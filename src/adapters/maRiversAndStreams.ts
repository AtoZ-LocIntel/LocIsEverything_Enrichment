/**
 * MA Rivers and Streams Adapter
 * Queries Massachusetts Rivers and Streams from MassGIS Hydro_Major FeatureServer
 * Supports proximity queries for linear features
 */

const BASE_SERVICE_URL = 'https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Hydro_Major/FeatureServer';
const LAYER_ID = 1;

export interface MARiverAndStream {
  objectId?: number;
  distance_miles?: number;
  geometry?: any;
  attributes?: Record<string, any>;
}

/**
 * Calculate haversine distance between two lat/lon points in miles
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate distance from a point to the nearest point on a polyline
 */
function calculateDistanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  let minDistance = Infinity;
  
  // Check each path (a river/stream can have multiple paths)
  for (const path of paths) {
    // Check each line segment in the path
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      // Calculate distance from point to line segment
      const dist = pointToLineSegmentDistance(lat, lon, p1[1], p1[0], p2[1], p2[0]);
      minDistance = Math.min(minDistance, dist);
    }
  }
  
  return minDistance;
}

/**
 * Calculate distance from a point to a line segment
 */
function pointToLineSegmentDistance(
  pointLat: number,
  pointLon: number,
  lineLat1: number,
  lineLon1: number,
  lineLat2: number,
  lineLon2: number
): number {
  const A = pointLon - lineLon1;
  const B = pointLat - lineLat1;
  const C = lineLon2 - lineLon1;
  const D = lineLat2 - lineLat1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx: number, yy: number;
  
  if (param < 0) {
    xx = lineLon1;
    yy = lineLat1;
  } else if (param > 1) {
    xx = lineLon2;
    yy = lineLat2;
  } else {
    xx = lineLon1 + param * C;
    yy = lineLat1 + param * D;
  }
  
  return haversineDistance(pointLat, pointLon, yy, xx);
}

/**
 * Query MA Rivers and Streams FeatureServer for proximity
 * Returns rivers/streams within the specified radius
 */
export async function getMARiversAndStreamsNearbyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<MARiverAndStream[]> {
  try {
    console.log(`🌊 Querying MA Rivers and Streams within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    // Convert miles to meters for the query
    const radiusMeters = radiusMiles * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for proximity
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
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 MA Rivers and Streams Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ MA Rivers and Streams API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No MA Rivers and Streams found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process features and calculate distance
    const riversAndStreams: MARiverAndStream[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Calculate distance from search point to nearest point on polyline
      let distance_miles: number | undefined = undefined;
      if (geometry.paths && geometry.paths.length > 0) {
        distance_miles = calculateDistanceToPolyline(lat, lon, geometry.paths);
      }
      
      return {
        objectId: attributes.OBJECTID,
        distance_miles,
        geometry,
        attributes,
      };
    });
    
    // Sort by distance
    riversAndStreams.sort((a, b) => {
      if (a.distance_miles === null || a.distance_miles === undefined) return 1;
      if (b.distance_miles === null || b.distance_miles === undefined) return -1;
      return a.distance_miles - b.distance_miles;
    });
    
    console.log(`✅ Found ${riversAndStreams.length} MA Rivers and Streams within ${radiusMiles} miles`);
    
    return riversAndStreams;
  } catch (error) {
    console.error('❌ Error querying MA Rivers and Streams:', error);
    return [];
  }
}

