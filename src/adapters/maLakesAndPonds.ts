/**
 * MA Lakes and Ponds Adapter
 * Queries Massachusetts Lakes and Ponds from MassGIS Hydro_Major FeatureServer
 * Supports both point-in-polygon and proximity queries
 * This is a polygon dataset, so we calculate distance to nearest point on polygon boundary
 */

const BASE_SERVICE_URL = 'https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Hydro_Major/FeatureServer';
const LAYER_ID = 2;

export interface MALakeAndPond {
  objectId?: number;
  name?: string;
  type?: string;
  feature?: number;
  sqMeters?: number;
  distance_miles?: number;
  geometry?: any;
  attributes?: Record<string, any>;
}

/**
 * Calculate distance from a point to the nearest point on a polygon boundary
 */
function calculateDistanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  let minDistance = Infinity;
  
  // Check each ring (exterior and interior)
  for (const ring of rings) {
    // Check each line segment in the ring
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      
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
 * Query MA Lakes and Ponds FeatureServer for point-in-polygon
 * Returns lakes/ponds that contain the specified point
 */
export async function getMALakesAndPondsContainingData(
  lat: number,
  lon: number
): Promise<MALakeAndPond[]> {
  try {
    console.log(`🏞️ Querying MA Lakes and Ponds containing [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for point-in-polygon
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', `${lon},${lat}`);
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 MA Lakes and Ponds Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ MA Lakes and Ponds API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No MA Lakes and Ponds found containing the point`);
      return [];
    }
    
    // Process features
    const lakesAndPonds: MALakeAndPond[] = data.features.map((feature: any, idx: number) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      if (idx === 0) {
        console.log(`🔍 MA Lake/Pond feature 0 (containing):`, {
          hasGeometry: !!geometry,
          geometryType: geometry.type,
          hasRings: !!geometry.rings,
          ringsLength: geometry.rings?.length,
          spatialReference: geometry.spatialReference || data.spatialReference
        });
      }
      
      return {
        objectId: attributes.OBJECTID,
        name: attributes.NAME || attributes.Name || attributes.name || null,
        type: attributes.TYPE || attributes.Type || attributes.type || null,
        feature: attributes.FEATURE || attributes.Feature || attributes.feature || null,
        sqMeters: attributes.SQ_METERS || attributes.Sq_Meters || attributes.sq_meters || attributes['SQ.METERS'] || null,
        distance_miles: 0, // Containing features have distance = 0
        geometry,
        attributes,
      };
    });
    
    console.log(`✅ Found ${lakesAndPonds.length} MA Lakes and Ponds containing the point`);
    if (lakesAndPonds.length > 0) {
      console.log(`🔍 First containing lake/pond has geometry:`, !!lakesAndPonds[0].geometry, 'has rings:', !!lakesAndPonds[0].geometry?.rings);
    }
    
    return lakesAndPonds;
  } catch (error) {
    console.error('❌ Error querying MA Lakes and Ponds:', error);
    return [];
  }
}

/**
 * Query MA Lakes and Ponds FeatureServer for proximity
 * Returns lakes/ponds within the specified radius
 */
export async function getMALakesAndPondsNearbyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<MALakeAndPond[]> {
  try {
    console.log(`🏞️ Querying MA Lakes and Ponds within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 MA Lakes and Ponds Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ MA Lakes and Ponds API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No MA Lakes and Ponds found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process features and calculate distance
    const lakesAndPonds: MALakeAndPond[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Calculate distance from search point to nearest point on polygon boundary
      let distance_miles: number | undefined = undefined;
      if (geometry.rings && geometry.rings.length > 0) {
        distance_miles = calculateDistanceToPolygon(lat, lon, geometry.rings);
      }
      
      return {
        objectId: attributes.OBJECTID,
        name: attributes.NAME || attributes.Name || attributes.name || null,
        type: attributes.TYPE || attributes.Type || attributes.type || null,
        feature: attributes.FEATURE || attributes.Feature || attributes.feature || null,
        sqMeters: attributes.SQ_METERS || attributes.Sq_Meters || attributes.sq_meters || attributes['SQ.METERS'] || null,
        distance_miles,
        geometry,
        attributes,
      };
    });
    
    // Sort by distance (containing features first, then by distance)
    lakesAndPonds.sort((a, b) => {
      if (a.distance_miles === null || a.distance_miles === undefined) return 1;
      if (b.distance_miles === null || b.distance_miles === undefined) return -1;
      return a.distance_miles - b.distance_miles;
    });
    
    console.log(`✅ Found ${lakesAndPonds.length} MA Lakes and Ponds within ${radiusMiles} miles`);
    
    return lakesAndPonds;
  } catch (error) {
    console.error('❌ Error querying MA Lakes and Ponds:', error);
    return [];
  }
}

