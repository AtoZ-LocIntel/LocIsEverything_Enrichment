/**
 * Orlando Christmas Light Displays Adapter
 * Queries Orlando area Christmas Light Displays points from ArcGIS FeatureServer
 * Supports proximity queries up to 50 miles
 * Layer: Holiday_Lights_WFL1 (Layer 2) - Points
 */

/**
 * Filter out personal names from display text
 * Removes patterns like "Home of [Name]" or similar personal information
 */
function filterPersonalNames(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') {
    return text || null;
  }
  
  // Remove patterns like "Home of [Name]" or "Home of [Name] & [Name]"
  const personalNamePatterns = [
    /^Home\s+of\s+[^,]+(?:,\s*[^,]+)*/i, // "Home of Name" or "Home of Name & Name"
    /^Home\s+of\s+[^&]+(?:\s*&\s*[^&]+)*/i, // "Home of Name & Name"
  ];
  
  let filtered = text;
  for (const pattern of personalNamePatterns) {
    filtered = filtered.replace(pattern, '').trim();
  }
  
  // If the entire text was just a personal name pattern, return null
  if (!filtered || filtered.length === 0) {
    return null;
  }
  
  return filtered;
}

const BASE_SERVICE_URL = 'https://services5.arcgis.com/hbtBppF7t3PpouVf/arcgis/rest/services/Holiday_Lights_WFL1/FeatureServer';
const LAYER_ID = 2;

export interface OrlandoChristmasLightInfo {
  objectid: number | null;
  address: string | null;
  description: string | null;
  dates: string | null;
  times: string | null;
  name: string | null;
  website: string | null;
  attributes: Record<string, any>;
  lat: number;
  lon: number;
  distance_miles?: number;
}

/**
 * Query Orlando Christmas Light Displays for proximity
 * Supports proximity queries up to 50 miles
 */
export async function getOrlandoChristmasLightsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<OrlandoChristmasLightInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;
    
    if (maxRadius <= 0) {
      return [];
    }
    
    const results: OrlandoChristmasLightInfo[] = [];
    const processedIds = new Set<number>();
    
    // Proximity query with pagination
    try {
      const radiusMeters = maxRadius * 1609.34;
      const proximityGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const allFeatures: any[] = [];
      let resultOffset = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const proximityUrl = `${BASE_SERVICE_URL}/${LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        
        if (resultOffset === 0) {
          console.log(`🎄 Querying Orlando Christmas Light Displays for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
        }
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityData.error) {
          console.error('❌ Orlando Christmas Light Displays API Error:', proximityData.error);
          break;
        }
        
        if (!proximityData.features || proximityData.features.length === 0) {
          hasMore = false;
          break;
        }
        
        allFeatures.push(...proximityData.features);
        
        if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
          resultOffset += batchSize;
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }
      
      console.log(`✅ Fetched ${allFeatures.length} total Orlando Christmas Light Display features for proximity`);
      
      // Process all features and calculate accurate distances
      allFeatures.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || {};
        
        // Extract coordinates from geometry (point geometry has x, y)
        // ESRI geometry: x is longitude, y is latitude (when in WGS84/4326)
        // The service may return coordinates in a projected system, but we request outSR=4326
        // If coordinates are still in projected system, we'll detect and handle it
        let destLon = geometry.x !== null && geometry.x !== undefined ? geometry.x : null;
        let destLat = geometry.y !== null && geometry.y !== undefined ? geometry.y : null;
        
        // Check if coordinates are in a projected coordinate system (Web Mercator, State Plane, etc.)
        // Projected coordinates are typically very large numbers (millions)
        // WGS84 lat/lon are: lon: -180 to 180, lat: -90 to 90
        if (destLat === null || destLon === null) {
          console.warn('Orlando Christmas Light Display has null coordinates, skipping');
          return;
        }
        
        // If coordinates appear to be in a projected system (Web Mercator EPSG:3857), convert them
        // Web Mercator X: -20037508 to 20037508, Y: -20037508 to 20037508
        if (Math.abs(destLon) > 180 || Math.abs(destLat) > 90) {
          // Likely in Web Mercator (EPSG:3857) or another projected system
          // Convert Web Mercator to WGS84 if needed
          // Web Mercator to WGS84: lon = x / 20037508.34 * 180, lat = atan(exp(y / 20037508.34 * π)) * 360 / π - 90
          if (Math.abs(destLon) < 20037509 && Math.abs(destLat) < 20037509) {
            // Likely Web Mercator
            const lonDeg = (destLon / 20037508.34) * 180;
            const latRad = Math.atan(Math.exp((destLat / 20037508.34) * Math.PI));
            const latDeg = (latRad * 360) / Math.PI - 90;
            destLon = lonDeg;
            destLat = latDeg;
          } else {
            // Unknown projected system, skip
            console.warn(`Orlando Christmas Light Display has coordinates in unknown system (${destLon}, ${destLat}), skipping`);
            return;
          }
        }
        
        // Calculate accurate distance from search point to display point
        const R = 3959; // Earth's radius in miles
        const dLat = (destLat - lat) * Math.PI / 180;
        const dLon = (destLon - lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        // Only include features within the specified radius
        if (distance <= maxRadius) {
          const objectid = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID : null;
          
          // Skip duplicates
          if (objectid !== null && processedIds.has(objectid)) {
            return;
          }
          
          const address = attributes.Address || attributes.address || attributes.ADDRESS || null;
          const descriptionRaw = attributes.Description || attributes.description || attributes.DESCRIPTION || null;
          const dates = attributes.Dates || attributes.dates || attributes.DATES || null;
          const times = attributes.Times || attributes.times || attributes.TIMES || null;
          const nameRaw = attributes.Name || attributes.name || attributes.NAME || null;
          const website = attributes.Website || attributes.website || attributes.WEBSITE || null;
          
          // Filter out personal names from name and description
          const name = filterPersonalNames(nameRaw);
          const description = filterPersonalNames(descriptionRaw);
          
          // Also filter the attributes object to remove personal names
          const filteredAttributes = { ...attributes };
          if (filteredAttributes.Name) {
            filteredAttributes.Name = filterPersonalNames(filteredAttributes.Name) || filteredAttributes.Name;
          }
          if (filteredAttributes.name) {
            filteredAttributes.name = filterPersonalNames(filteredAttributes.name) || filteredAttributes.name;
          }
          if (filteredAttributes.NAME) {
            filteredAttributes.NAME = filterPersonalNames(filteredAttributes.NAME) || filteredAttributes.NAME;
          }
          if (filteredAttributes.Description) {
            filteredAttributes.Description = filterPersonalNames(filteredAttributes.Description) || filteredAttributes.Description;
          }
          if (filteredAttributes.description) {
            filteredAttributes.description = filterPersonalNames(filteredAttributes.description) || filteredAttributes.description;
          }
          if (filteredAttributes.DESCRIPTION) {
            filteredAttributes.DESCRIPTION = filterPersonalNames(filteredAttributes.DESCRIPTION) || filteredAttributes.DESCRIPTION;
          }
          
          results.push({
            objectid: objectid,
            address: address,
            description: description,
            dates: dates,
            times: times,
            name: name,
            website: website,
            attributes: filteredAttributes,
            lat: destLat,
            lon: destLon,
            distance_miles: distance
          });
          
          if (objectid !== null) {
            processedIds.add(objectid);
          }
        }
      });
      
      // Sort by distance
      results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
      
      console.log(`✅ Found ${results.length} Orlando Christmas Light Display(s) within ${maxRadius} miles`);
    } catch (error) {
      console.error('❌ Proximity query failed for Orlando Christmas Light Displays:', error);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error querying Orlando Christmas Light Displays data:', error);
    return [];
  }
}

