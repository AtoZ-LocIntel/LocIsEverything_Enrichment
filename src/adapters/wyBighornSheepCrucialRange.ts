/**
 * Adapter for Wyoming Bighorn Sheep Crucial Range Feature Service
 * Service URL: https://services6.arcgis.com/cWzdqIyxbijuhPLw/arcgis/rest/services/Bighorn_Sheep_Crucial_Range/FeatureServer/0
 * 
 * Summary:
 * This layer is a subset of the corresponding seasonal range layer for this species. All of the same metadata 
 * is used for this subset. The citation title is modified to replace "Seasonal" with "Crucial" and only the 
 * following seasonal ranges are included: anything with a "crucial" (CRU) designation in the RANGE attribute 
 * field (Select By Attributes... > "RANGE" LIKE '%CRU%').
 * 
 * Bighorn Sheep Crucial Range polygons showing crucial winter and crucial winter-low elevation range areas.
 */

const BASE_SERVICE_URL = 'https://services6.arcgis.com/cWzdqIyxbijuhPLw/arcgis/rest/services/Bighorn_Sheep_Crucial_Range/FeatureServer';
const LAYER_ID = 0;

export interface WYBighornSheepCrucialRangeInfo {
  objectId?: number;
  species?: string;
  range?: string;
  acres?: number;
  sqMiles?: number;
  shapeArea?: number;
  shapeLength?: number;
  lat?: number;
  lon?: number;
  distance_miles?: number;
  geometry?: any;
  attributes: Record<string, any>;
  isContaining?: boolean; // True if point is within polygon
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
      
      // Convert to lat/lon if needed (ESRI geometry might be in State Plane or WGS84)
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
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  // Use the first ring (exterior ring) for point-in-polygon check
  if (!rings || rings.length === 0) return false;
  
  const ring = rings[0];
  let inside = false;
  
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat)) &&
                      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate centroid of a polygon
 */
function calculateCentroid(rings: number[][][]): { lat: number; lon: number } | null {
  if (!rings || rings.length === 0 || !rings[0] || rings[0].length === 0) {
    return null;
  }
  
  const ring = rings[0];
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  
  ring.forEach(coord => {
    sumLon += coord[0];
    sumLat += coord[1];
    count++;
  });
  
  if (count === 0) return null;
  
  return {
    lat: sumLat / count,
    lon: sumLon / count
  };
}

/**
 * Query WY Bighorn Sheep Crucial Range FeatureServer for point-in-polygon (containing)
 */
export async function getWYBighornSheepCrucialRangeContainingData(
  lat: number,
  lon: number
): Promise<WYBighornSheepCrucialRangeInfo[]> {
  try {
    console.log(`🐑 Querying WY Bighorn Sheep Crucial Range containing [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for point-in-polygon
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }));
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 WY Bighorn Sheep Crucial Range Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ WY Bighorn Sheep Crucial Range API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No WY Bighorn Sheep Crucial Range found containing the point`);
      return [];
    }
    
    // Process features
    const rangeFeatures: WYBighornSheepCrucialRangeInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry;
      const centroid = geometry && geometry.rings ? calculateCentroid(geometry.rings) : null;
      
      return {
        objectId: attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? Number(attributes.OBJECTID) : undefined,
        species: attributes.SPECIES || undefined,
        range: attributes.RANGE || undefined,
        acres: attributes.Acres !== null && attributes.Acres !== undefined ? Number(attributes.Acres) : undefined,
        sqMiles: attributes.SQMiles !== null && attributes.SQMiles !== undefined ? Number(attributes.SQMiles) : undefined,
        shapeArea: attributes['Shape__Area'] !== null && attributes['Shape__Area'] !== undefined ? Number(attributes['Shape__Area']) : undefined,
        shapeLength: attributes['Shape__Length'] !== null && attributes['Shape__Length'] !== undefined ? Number(attributes['Shape__Length']) : undefined,
        lat: centroid ? centroid.lat : undefined,
        lon: centroid ? centroid.lon : undefined,
        distance_miles: 0, // Point is inside, so distance is 0
        isContaining: true,
        geometry: geometry,
        attributes,
      };
    });
    
    console.log(`✅ Found ${rangeFeatures.length} WY Bighorn Sheep Crucial Range feature(s) containing the point`);
    
    return rangeFeatures;
  } catch (error) {
    console.error('❌ Error querying WY Bighorn Sheep Crucial Range (containing):', error);
    return [];
  }
}

/**
 * Query WY Bighorn Sheep Crucial Range FeatureServer for proximity search
 * Returns range features within the specified radius (in miles)
 */
export async function getWYBighornSheepCrucialRangeNearbyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<WYBighornSheepCrucialRangeInfo[]> {
  try {
    // Cap radius at 100 miles
    const cappedRadius = Math.min(radiusMiles, 100.0);
    
    console.log(`🐑 Querying WY Bighorn Sheep Crucial Range within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    // Convert miles to meters for the buffer distance
    const radiusMeters = cappedRadius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for proximity search
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }));
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', radiusMeters.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 WY Bighorn Sheep Crucial Range Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ WY Bighorn Sheep Crucial Range API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No WY Bighorn Sheep Crucial Range found within ${cappedRadius} miles`);
      return [];
    }
    
    // Process features and calculate distance
    const rangeFeatures: WYBighornSheepCrucialRangeInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Calculate distance from search point to nearest point on polygon boundary
      let distance_miles: number | undefined = undefined;
      let isContaining = false;
      const centroid = geometry.rings ? calculateCentroid(geometry.rings) : null;
      
      if (geometry.rings && geometry.rings.length > 0) {
        // Check if point is inside polygon
        isContaining = pointInPolygon(lat, lon, geometry.rings);
        if (isContaining) {
          distance_miles = 0;
        } else {
          // Calculate distance to nearest boundary point
          distance_miles = calculateDistanceToPolygon(lat, lon, geometry.rings);
        }
      }
      
      // Only include if within radius
      if (distance_miles !== undefined && distance_miles > cappedRadius) {
        return null;
      }
      
      return {
        objectId: attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? Number(attributes.OBJECTID) : undefined,
        species: attributes.SPECIES || undefined,
        range: attributes.RANGE || undefined,
        acres: attributes.Acres !== null && attributes.Acres !== undefined ? Number(attributes.Acres) : undefined,
        sqMiles: attributes.SQMiles !== null && attributes.SQMiles !== undefined ? Number(attributes.SQMiles) : undefined,
        shapeArea: attributes['Shape__Area'] !== null && attributes['Shape__Area'] !== undefined ? Number(attributes['Shape__Area']) : undefined,
        shapeLength: attributes['Shape__Length'] !== null && attributes['Shape__Length'] !== undefined ? Number(attributes['Shape__Length']) : undefined,
        lat: centroid ? centroid.lat : undefined,
        lon: centroid ? centroid.lon : undefined,
        distance_miles,
        isContaining,
        geometry,
        attributes,
      };
    }).filter((feature: WYBighornSheepCrucialRangeInfo | null): feature is WYBighornSheepCrucialRangeInfo => feature !== null);
    
    // Sort by distance (containing features first, then by distance)
    rangeFeatures.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      const distA = a.distance_miles ?? Infinity;
      const distB = b.distance_miles ?? Infinity;
      return distA - distB;
    });
    
    console.log(`✅ Found ${rangeFeatures.length} WY Bighorn Sheep Crucial Range feature(s)`);
    
    return rangeFeatures;
  } catch (error) {
    console.error('❌ Error querying WY Bighorn Sheep Crucial Range (nearby):', error);
    return [];
  }
}
