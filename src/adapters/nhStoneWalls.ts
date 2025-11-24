/**
 * NH Stone Walls Adapter
 * Queries New Hampshire Stone Walls from ArcGIS FeatureServer
 * Supports proximity queries to find stone walls within a specified radius
 * This is a line dataset (polylines), so we calculate distance to nearest point on the line
 */

const BASE_SERVICE_URL = 'https://services9.arcgis.com/wnvDDrXX8EouLkZP/arcgis/rest/services/NH_Stone_Wall_Layer_Public_View/FeatureServer';
const LAYER_ID = 0;

export interface NHStoneWall {
  objectId?: number;
  globalId?: string;
  town?: string;
  user?: string;
  userEmail?: string;
  featureType?: string;
  featureTypology?: string;
  featureMappingSource?: number;
  featureMappingNotes?: string;
  featureStatus?: string;
  generalNotes?: string;
  symCode?: number;
  shapeLength?: number;
  distance_miles?: number;
  geometry?: any;
  attributes?: Record<string, any>;
}

/**
 * Calculate distance from a point to the nearest point on a polyline
 */
function calculateDistanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  let minDistance = Infinity;
  
  paths.forEach(path => {
    // Each path is an array of coordinate pairs [x, y] or [lon, lat]
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      // Convert to lat/lon if needed (ESRI geometry might be in Web Mercator or WGS84)
      const lat1 = p1[1];
      const lon1 = p1[0];
      const lat2 = p2[1];
      const lon2 = p2[0];
      
      // Calculate distance from point to line segment
      const distance = pointToLineSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, distance);
    }
  });
  
  return minDistance;
}

/**
 * Calculate distance from a point to a line segment
 */
function pointToLineSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  // Convert to radians
  const lat1 = y1 * Math.PI / 180;
  const lon1 = x1 * Math.PI / 180;
  const lat2 = y2 * Math.PI / 180;
  const lon2 = x2 * Math.PI / 180;
  const latP = py * Math.PI / 180;
  const lonP = px * Math.PI / 180;
  
  // Calculate distance from point to each endpoint
  const d1 = haversineDistance(latP, lonP, lat1, lon1);
  const d2 = haversineDistance(latP, lonP, lat2, lon2);
  
  // Calculate distance along the line segment
  const dSegment = haversineDistance(lat1, lon1, lat2, lon2);
  
  // If segment is very short, just use distance to nearest endpoint
  if (dSegment < 0.001) {
    return Math.min(d1, d2);
  }
  
  // Calculate the closest point on the line segment
  const t = Math.max(0, Math.min(1, 
    ((latP - lat1) * (lat2 - lat1) + (lonP - lon1) * (lon2 - lon1)) / (dSegment * dSegment)
  ));
  
  const latClosest = lat1 + t * (lat2 - lat1);
  const lonClosest = lon1 + t * (lon2 - lon1);
  
  return haversineDistance(latP, lonP, latClosest, lonClosest);
}

/**
 * Haversine distance calculation
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Query NH Stone Walls FeatureServer for proximity search
 * Returns stone walls within the specified radius (in miles)
 */
export async function getNHStoneWallsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHStoneWall[]> {
  try {
    console.log(`🧱 Querying NH Stone Walls within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    // Convert miles to meters for the buffer distance
    const radiusMeters = radiusMiles * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for proximity search
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', `${lon},${lat}`);
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', radiusMeters.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true'); // Need geometry to draw lines and calculate distance
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    
    console.log(`🔗 NH Stone Walls Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH Stone Walls API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Stone Walls found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const stoneWalls: NHStoneWall[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Calculate distance from search point to nearest point on stone wall line
      let distance_miles: number | undefined = undefined;
      if (geometry.paths && geometry.paths.length > 0) {
        distance_miles = calculateDistanceToPolyline(lat, lon, geometry.paths);
      }
      
      return {
        objectId: attributes.OBJECTID,
        globalId: attributes.GlobalID,
        town: attributes.TOWN,
        user: attributes.USER_,
        userEmail: attributes.USER_EMAIL,
        featureType: attributes.FEATURE_TYPE,
        featureTypology: attributes.FEATURE_TYPOLOGY,
        featureMappingSource: attributes.FEATURE_MAPPING_SOURCE,
        featureMappingNotes: attributes.FEATURE_MAPPING_NOTES,
        featureStatus: attributes.FEATURE_STATUS,
        generalNotes: attributes.GENERAL_NOTES,
        symCode: attributes.SYM_CODE,
        shapeLength: attributes.Shape__Length,
        distance_miles,
        geometry,
        attributes,
      };
    });
    
    // Sort by distance
    stoneWalls.sort((a, b) => {
      const distA = a.distance_miles ?? Infinity;
      const distB = b.distance_miles ?? Infinity;
      return distA - distB;
    });
    
    console.log(`✅ Found ${stoneWalls.length} NH Stone Walls`);
    
    return stoneWalls;
  } catch (error) {
    console.error('❌ Error querying NH Stone Walls:', error);
    return [];
  }
}

