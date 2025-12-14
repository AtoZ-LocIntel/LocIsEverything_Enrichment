/**
 * Houston Fire Hydrants Adapter
 * Queries Houston Fire Hydrants point feature service
 * Supports proximity queries up to 1 mile
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_Houston_Fire_Hydrant_view/FeatureServer/9';

export interface HoustonFireHydrantInfo {
  objectId: string | null;
  facilityId: string | null;
  address: string | null;
  hydrantNumber: string | null;
  zone: string | null;
  councilDistrict: string | null;
  owner: string | null;
  barrelDiameter: number | null;
  nozzleDiameter1: number | null;
  nozzleDiameter2: number | null;
  nozzleDiameter3: number | null;
  lineSize: number | null;
  mainDiameter: number | null;
  hydrantLeadDiameter: number | null;
  inServiceDate: string | null;
  hfdDelivery: string | null;
  keyMap: string | null;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  attributes: Record<string, any>;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query Houston Fire Hydrants within proximity of a location
 * Supports proximity queries up to 1 mile
 */
export async function getHoustonFireHydrantsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<HoustonFireHydrantInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 1 mile
    if (radiusMiles && radiusMiles > 1.0) {
      radiusMiles = 1.0;
    }
    
    if (!radiusMiles || radiusMiles <= 0) {
      return [];
    }
    
    // Convert lat/lon to Web Mercator for ESRI query
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const features: HoustonFireHydrantInfo[] = [];
    
    // Proximity query (required for points) with pagination to get all results
    try {
      const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
      const allFeatures: any[] = [];
      let resultOffset = 0;
      const batchSize = 2000; // ESRI FeatureServer max per request
      let hasMore = true;
      
      // Fetch all results in batches
      while (hasMore) {
        // Build query URL manually to ensure proper encoding
        const geometryStr = encodeURIComponent(JSON.stringify(geometry));
        const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityData.error) {
          throw new Error(`Houston Fire Hydrants API error: ${JSON.stringify(proximityData.error)}`);
        }
        
        if (proximityData.features && Array.isArray(proximityData.features)) {
          allFeatures.push(...proximityData.features);
          
          // Check if there are more results
          if (proximityData.features.length < batchSize) {
            hasMore = false;
          } else {
            resultOffset += batchSize;
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
        
        // Calculate distance from query point
        const distanceMiles = calculateDistance(lat, lon, geom.y, geom.x);
        
        // Only include features within the specified radius
        if (distanceMiles > radiusMiles!) {
          continue;
        }
        
        const hydrant: HoustonFireHydrantInfo = {
          objectId: attrs.OBJECTID?.toString() || attrs.objectId?.toString() || null,
          facilityId: attrs.FACILITYID?.toString() || attrs.facilityId?.toString() || attrs.UFID?.toString() || attrs.ufid?.toString() || null,
          address: attrs.ADDRESS || attrs.address || null,
          hydrantNumber: attrs.HYDRANTNUMBER || attrs.hydrantNumber || null,
          zone: attrs.ZONE || attrs.zone || null,
          councilDistrict: attrs.COUNCILDISTRICT || attrs.councilDistrict || null,
          owner: attrs.OWNER || attrs.owner || null,
          barrelDiameter: attrs.BARRELDIAMETER !== null && attrs.BARRELDIAMETER !== undefined ? Number(attrs.BARRELDIAMETER) : (attrs.barrelDiameter !== null && attrs.barrelDiameter !== undefined ? Number(attrs.barrelDiameter) : null),
          nozzleDiameter1: attrs.NOZZLEDIAMETER1 !== null && attrs.NOZZLEDIAMETER1 !== undefined ? Number(attrs.NOZZLEDIAMETER1) : (attrs.nozzleDiameter1 !== null && attrs.nozzleDiameter1 !== undefined ? Number(attrs.nozzleDiameter1) : null),
          nozzleDiameter2: attrs.NOZZLEDIAMETER2 !== null && attrs.NOZZLEDIAMETER2 !== undefined ? Number(attrs.NOZZLEDIAMETER2) : (attrs.nozzleDiameter2 !== null && attrs.nozzleDiameter2 !== undefined ? Number(attrs.nozzleDiameter2) : null),
          nozzleDiameter3: attrs.NOZZLEDIAMETER3 !== null && attrs.NOZZLEDIAMETER3 !== undefined ? Number(attrs.NOZZLEDIAMETER3) : (attrs.nozzleDiameter3 !== null && attrs.nozzleDiameter3 !== undefined ? Number(attrs.nozzleDiameter3) : null),
          lineSize: attrs.LINESIZE !== null && attrs.LINESIZE !== undefined ? Number(attrs.LINESIZE) : (attrs.lineSize !== null && attrs.lineSize !== undefined ? Number(attrs.lineSize) : null),
          mainDiameter: attrs.MAINDIAMETER !== null && attrs.MAINDIAMETER !== undefined ? Number(attrs.MAINDIAMETER) : (attrs.mainDiameter !== null && attrs.mainDiameter !== undefined ? Number(attrs.mainDiameter) : null),
          hydrantLeadDiameter: attrs.HYDRANTLEADDIAMETER !== null && attrs.HYDRANTLEADDIAMETER !== undefined ? Number(attrs.HYDRANTLEADDIAMETER) : (attrs.hydrantLeadDiameter !== null && attrs.hydrantLeadDiameter !== undefined ? Number(attrs.hydrantLeadDiameter) : null),
          inServiceDate: attrs.INSERVICEDATE || attrs.inServiceDate || null,
          hfdDelivery: attrs.HFD_DELIVERY || attrs.hfdDelivery || null,
          keyMap: attrs.KEYMAP || attrs.keyMap || null,
          geometry: geom,
          distance_miles: Number(distanceMiles.toFixed(2)),
          attributes: attrs
        };
        
        features.push(hydrant);
      }
      
      // Sort by distance (closest first)
      features.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
      
    } catch (error) {
      throw new Error(`Error querying Houston Fire Hydrants proximity: ${error}`);
    }
    
    return features;
  } catch (error) {
    throw new Error(`Error fetching Houston Fire Hydrants data: ${error}`);
  }
}

