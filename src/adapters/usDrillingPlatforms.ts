/**
 * US Drilling Platforms Adapter
 * Queries US Drilling Platforms points from ArcGIS FeatureServer
 * Supports proximity queries up to 100 miles
 * Layer: USA_Drilling_Platforms_(HFS) (Layer 0) - Points
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Drilling_Platforms_(HFS)/FeatureServer';
const LAYER_ID = 0;

export interface USDrillingPlatformInfo {
  objectid: number | null;
  structureName: string | null;
  structureNumber: string | null;
  complexIdNumber: number | null;
  areaCode: string | null;
  blockNumber: string | null;
  districtCode: number | null;
  latitude: number | null;
  longitude: number | null;
  majorStructureFlag: string | null;
  attributes: Record<string, any>;
  lat: number;
  lon: number;
  distance_miles?: number;
}

/**
 * Query US Drilling Platforms for proximity
 * Supports proximity queries up to 100 miles
 */
export async function getUSDrillingPlatformsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<USDrillingPlatformInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 100 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 100.0) : 100.0;
    
    if (maxRadius <= 0) {
      return [];
    }
    
    const results: USDrillingPlatformInfo[] = [];
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
          console.log(`🛢️ Querying US Drilling Platforms for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
        }
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityData.error) {
          console.error('❌ US Drilling Platforms API Error:', proximityData.error);
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
      
      console.log(`✅ Fetched ${allFeatures.length} total US Drilling Platform features for proximity`);
      
      // Process all features and calculate accurate distances
      allFeatures.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || {};
        
        // Extract coordinates from geometry (point geometry has x, y)
        // ESRI geometry: x is longitude, y is latitude (when in WGS84/4326)
        let destLon = geometry.x !== null && geometry.x !== undefined ? geometry.x : null;
        let destLat = geometry.y !== null && geometry.y !== undefined ? geometry.y : null;
        
        // Also check attributes for LATITUDE and LONGITUDE fields
        if (destLat === null || destLon === null) {
          destLat = attributes.LATITUDE !== null && attributes.LATITUDE !== undefined ? attributes.LATITUDE : null;
          destLon = attributes.LONGITUDE !== null && attributes.LONGITUDE !== undefined ? attributes.LONGITUDE : null;
        }
        
        // Check if coordinates are in a projected coordinate system
        if (destLat === null || destLon === null) {
          console.warn('US Drilling Platform has null coordinates, skipping');
          return;
        }
        
        // If coordinates appear to be in a projected system (Web Mercator EPSG:3857), convert them
        if (Math.abs(destLon) > 180 || Math.abs(destLat) > 90) {
          // Likely in Web Mercator (EPSG:3857) or another projected system
          if (Math.abs(destLon) < 20037509 && Math.abs(destLat) < 20037509) {
            // Likely Web Mercator
            const lonDeg = (destLon / 20037508.34) * 180;
            const latRad = Math.atan(Math.exp((destLat / 20037508.34) * Math.PI));
            const latDeg = (latRad * 360) / Math.PI - 90;
            destLon = lonDeg;
            destLat = latDeg;
          } else {
            // Unknown projected system, skip
            console.warn(`US Drilling Platform has coordinates in unknown system (${destLon}, ${destLat}), skipping`);
            return;
          }
        }
        
        // Calculate accurate distance from search point to platform point
        const R = 3959; // Earth's radius in miles
        const dLat = (destLat - lat) * Math.PI / 180;
        const dLon = (destLon - lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        // Only include features within the specified radius
        if (distance <= maxRadius) {
          const objectid = attributes.ObjectId !== null && attributes.ObjectId !== undefined ? attributes.ObjectId : null;
          
          // Skip duplicates
          if (objectid !== null && processedIds.has(objectid)) {
            return;
          }
          
          const structureName = attributes.STRUCTURE_NAME || attributes.Structure_Name || attributes.structure_name || null;
          const structureNumber = attributes.STRUCTURE_NUMBER !== null && attributes.STRUCTURE_NUMBER !== undefined ? String(attributes.STRUCTURE_NUMBER) : (attributes.Structure_Number !== null && attributes.Structure_Number !== undefined ? String(attributes.Structure_Number) : null);
          const complexIdNumber = attributes.COMPLEX_ID_NUMBER !== null && attributes.COMPLEX_ID_NUMBER !== undefined ? attributes.COMPLEX_ID_NUMBER : (attributes.Complex_Id_Number !== null && attributes.Complex_Id_Number !== undefined ? attributes.Complex_Id_Number : null);
          const areaCode = attributes.AREA_CODE || attributes.Area_Code || attributes.area_code || null;
          const blockNumber = attributes.BLOCK_NUMBER || attributes.Block_Number || attributes.block_number || null;
          const districtCode = attributes.DISTRICT_CODE !== null && attributes.DISTRICT_CODE !== undefined ? attributes.DISTRICT_CODE : (attributes.District_Code !== null && attributes.District_Code !== undefined ? attributes.District_Code : null);
          const majorStructureFlag = attributes.Major_Structure_Flag || attributes.MAJOR_STRUCTURE_FLAG || attributes.major_structure_flag || null;
          
          results.push({
            objectid: objectid,
            structureName: structureName,
            structureNumber: structureNumber,
            complexIdNumber: complexIdNumber,
            areaCode: areaCode,
            blockNumber: blockNumber,
            districtCode: districtCode,
            latitude: destLat,
            longitude: destLon,
            majorStructureFlag: majorStructureFlag,
            attributes: attributes,
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
      
      console.log(`✅ Found ${results.length} US Drilling Platform(s) within ${maxRadius} miles`);
    } catch (error) {
      console.error('❌ Proximity query failed for US Drilling Platforms:', error);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error querying US Drilling Platforms data:', error);
    return [];
  }
}

