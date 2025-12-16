const BASE_SERVICE_URL = 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer';

export interface SatelliteVIIRSFireActivityInfo {
  objectId: number;
  attributes: Record<string, any>;
  geometry: {
    x: number;
    y: number;
    spatialReference?: { wkid: number };
  };
  lat: number;
  lon: number;
  distance?: number;
  containing: boolean;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineDistance(lat1, lon1, lat2, lon2);
}

export async function getSatelliteVIIRSFireActivityData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<SatelliteVIIRSFireActivityInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    if (radiusMiles && radiusMiles > 50.0) {
      radiusMiles = 50.0;
    }
    
    if (!radiusMiles || radiusMiles <= 0) {
      return [];
    }
    
    const maxRadius = radiusMiles || 50.0;
    const results: SatelliteVIIRSFireActivityInfo[] = [];
    const serviceUrl = `${BASE_SERVICE_URL}/0`;
    
    // Convert lat/lon to WGS84 for ESRI query
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    // Proximity query (required for points) with pagination to get all results
    try {
      const radiusMeters = maxRadius * 1609.34; // Convert miles to meters
      const allFeatures: any[] = [];
      let resultOffset = 0;
      const batchSize = 2000; // ESRI FeatureServer max per request
      let hasMore = true;
      
      // Fetch all results in batches
      while (hasMore) {
        // Build query URL manually to ensure proper encoding
        const geometryStr = encodeURIComponent(JSON.stringify(geometry));
        const proximityUrl = `${serviceUrl}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityData.error) {
          throw new Error(`Satellite VIIRS Fire Activity API error: ${JSON.stringify(proximityData.error)}`);
        }
        
        if (proximityData.features && Array.isArray(proximityData.features)) {
          allFeatures.push(...proximityData.features);
          
          // Check if there are more results
          if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
            resultOffset += batchSize;
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      
      // Process all features and calculate distances
      for (const feature of allFeatures) {
        const attrs = feature.attributes || {};
        const geom = feature.geometry;
        
        if (!geom || geom.x === undefined || geom.y === undefined) {
          continue;
        }
        
        // Coordinates may be in Web Mercator (3857) - check and convert if needed
        let pointLon = geom.x;
        let pointLat = geom.y;
        
        // Check if coordinates are in Web Mercator (3857) or WGS84 (4326)
        const isWebMercator = Math.abs(pointLon) > 180 || Math.abs(pointLat) > 90;
        
        if (isWebMercator) {
          // Convert from Web Mercator to WGS84
          pointLon = (pointLon / 20037508.34) * 180;
          let mercLat = (pointLat / 20037508.34) * 180;
          pointLat = 180 / Math.PI * (2 * Math.atan(Math.exp(mercLat * Math.PI / 180)) - Math.PI / 2);
        }
        
        // Calculate distance from query point
        const distanceMiles = calculateDistance(lat, lon, pointLat, pointLon);
        
        // Only include features within the specified radius
        if (distanceMiles > maxRadius) {
          continue;
        }
        
        // Consider point as containing if very close (within 0.01 miles)
        const isContaining = distanceMiles < 0.01;
        
        const hotspot: SatelliteVIIRSFireActivityInfo = {
          objectId: attrs.OBJECTID || attrs.objectId || 0,
          attributes: attrs,
          geometry: {
            x: pointLon,
            y: pointLat,
            spatialReference: { wkid: 4326 }
          },
          lat: pointLat,
          lon: pointLon,
          distance: distanceMiles,
          containing: isContaining
        };
        
        results.push(hotspot);
      }
      
      console.log(`✅ Found ${results.length} Satellite VIIRS Fire Activity hotspot(s) within ${maxRadius} miles`);
    } catch (error) {
      console.error(`❌ Proximity query failed for Satellite VIIRS Fire Activity:`, error);
    }
    
    return results;
  } catch (error) {
    console.error(`❌ Error fetching Satellite VIIRS Fire Activity data:`, error);
    return [];
  }
}

