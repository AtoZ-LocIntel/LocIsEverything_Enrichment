/**
 * MA NHESP Natural Communities Adapter
 * Queries Massachusetts NHESP Natural Communities from MassGIS MapServer
 * Supports both point-in-polygon and proximity queries
 * This is a polygon dataset, so we calculate distance to nearest point on polygon boundary
 */

const BASE_SERVICE_URL = 'https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/NHESP_Natural_Communities/MapServer';
const LAYER_ID = 0;

export interface MANHESPNaturalCommunity {
  objectId?: number;
  communNam?: string;
  uniqueId?: number;
  communRan?: string;
  specificD?: string;
  communDes?: string;
  version?: number;
  shapeArea?: number;
  shapeLen?: number;
  distance_miles?: number;
  geometry?: any;
  attributes?: Record<string, any>;
}

/**
 * Calculate distance from a point to the nearest point on a polygon boundary
 */
function calculateDistanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  let minDistance = Infinity;
  
  rings.forEach(ring => {
    // Each ring is an array of coordinate pairs [x, y] or [lon, lat]
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      
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
 * Query MA NHESP Natural Communities MapServer for point-in-polygon
 * Returns communities that contain the specified point
 */
export async function getMANHESPNaturalCommunitiesContainingData(
  lat: number,
  lon: number
): Promise<MANHESPNaturalCommunity[]> {
  try {
    console.log(`🌿 Querying MA NHESP Natural Communities containing [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 MA NHESP Natural Communities Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ MA NHESP Natural Communities API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No MA NHESP Natural Communities found containing the point`);
      return [];
    }
    
    // Process features
    const communities: MANHESPNaturalCommunity[] = data.features.map((feature: any, idx: number) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      if (idx === 0) {
        console.log(`🔍 MA NHESP Natural Community feature 0:`, {
          hasGeometry: !!geometry,
          geometryType: geometry.type,
          hasRings: !!geometry.rings,
          ringsLength: geometry.rings?.length,
          spatialReference: geometry.spatialReference || data.spatialReference
        });
      }
      
      return {
        objectId: attributes.OBJECTID,
        communNam: attributes.COMMUN_NAM || attributes.Commun_Nam || attributes.commun_nam,
        uniqueId: attributes.UNIQUE_ID || attributes.Unique_ID || attributes.unique_id,
        communRan: attributes.COMMUN_RAN || attributes.Commun_Ran || attributes.commun_ran,
        specificD: attributes.SPECIFIC_D || attributes.Specific_D || attributes.specific_d,
        communDes: attributes.COMMUN_DES || attributes.Commun_Des || attributes.commun_des,
        version: attributes.VERSION || attributes.Version || attributes.version,
        shapeArea: attributes['SHAPE.AREA'] || attributes.Shape_Area || attributes.shape_area,
        shapeLen: attributes['SHAPE.LEN'] || attributes.Shape_Len || attributes.shape_len,
        distance_miles: 0, // Containing features have distance = 0
        geometry,
        attributes,
      };
    });
    
    console.log(`✅ Found ${communities.length} MA NHESP Natural Communities containing the point`);
    
    return communities;
  } catch (error) {
    console.error('❌ Error querying MA NHESP Natural Communities:', error);
    return [];
  }
}

/**
 * Query MA NHESP Natural Communities MapServer for proximity search
 * Returns communities within the specified radius (in miles)
 */
export async function getMANHESPNaturalCommunitiesNearbyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<MANHESPNaturalCommunity[]> {
  try {
    console.log(`🌿 Querying MA NHESP Natural Communities within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 MA NHESP Natural Communities Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ MA NHESP Natural Communities API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No MA NHESP Natural Communities found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process features and calculate distance
    const communities: MANHESPNaturalCommunity[] = data.features.map((feature: any, idx: number) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      if (idx === 0) {
        console.log(`🔍 MA NHESP Natural Community feature 0 (nearby):`, {
          hasGeometry: !!geometry,
          geometryType: geometry.type,
          hasRings: !!geometry.rings,
          ringsLength: geometry.rings?.length,
          spatialReference: geometry.spatialReference || data.spatialReference
        });
      }
      
      // Calculate distance from search point to nearest point on polygon boundary
      let distance_miles: number | undefined = undefined;
      if (geometry.rings && geometry.rings.length > 0) {
        distance_miles = calculateDistanceToPolygon(lat, lon, geometry.rings);
      }
      
      return {
        objectId: attributes.OBJECTID,
        communNam: attributes.COMMUN_NAM || attributes.Commun_Nam || attributes.commun_nam,
        uniqueId: attributes.UNIQUE_ID || attributes.Unique_ID || attributes.unique_id,
        communRan: attributes.COMMUN_RAN || attributes.Commun_Ran || attributes.commun_ran,
        specificD: attributes.SPECIFIC_D || attributes.Specific_D || attributes.specific_d,
        communDes: attributes.COMMUN_DES || attributes.Commun_Des || attributes.commun_des,
        version: attributes.VERSION || attributes.Version || attributes.version,
        shapeArea: attributes['SHAPE.AREA'] || attributes.Shape_Area || attributes.shape_area,
        shapeLen: attributes['SHAPE.LEN'] || attributes.Shape_Len || attributes.shape_len,
        distance_miles,
        geometry,
        attributes,
      };
    });
    
    // Sort by distance
    communities.sort((a, b) => {
      const distA = a.distance_miles ?? Infinity;
      const distB = b.distance_miles ?? Infinity;
      return distA - distB;
    });
    
    console.log(`✅ Found ${communities.length} MA NHESP Natural Communities`);
    
    return communities;
  } catch (error) {
    console.error('❌ Error querying MA NHESP Natural Communities:', error);
    return [];
  }
}

