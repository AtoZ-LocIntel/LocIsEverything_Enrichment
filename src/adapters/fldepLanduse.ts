/**
 * FLDEP Landuse Adapter
 * Queries Florida Department of Environmental Protection (DEP) Statewide Land Use data
 * Supports both point-in-polygon and proximity queries up to 5 miles
 * This is a polygon dataset, so we calculate distance to nearest point on polygon boundary
 * 
 * Service URL: https://ca.dep.state.fl.us/arcgis/rest/services/OpenData/STATEWIDE_LU_2004_2013/MapServer/1
 * 
 * Summary:
 * The two main purposes of this GIS layer are 1) to compile the five Florida Land use datasets 
 * from the Water Management Districts into one consistent state-wide layer for analysis and display 
 * purposes and 2) to incorporate LDI and LSI values into a statewide Land Use layer.
 * 
 * Statewide Florida Land Use layer updated with Landscape Development Intensity (LDI) and 
 * Landscape Support Index (LSI) values. The Land Use layer was compiled from the five Water 
 * Management Districts (WMD) in Florida (NWF,SR, SJR, SWF, SF) using the most recent version of 
 * data available. This layer will be updated when new versions of Land Use become available 
 * from the WMDs and updated with corresponding LDI and LSI values.
 * 
 * Division of Environmental Assessment and Restoration (DEAR)
 */

const BASE_SERVICE_URL = 'https://ca.dep.state.fl.us/arcgis/rest/services/OpenData/STATEWIDE_LU_2004_2013/MapServer';
const LAYER_ID = 1;

export interface FLDEPLanduseInfo {
  objectId?: number;
  level3Value?: number;
  ldi?: number;
  lsi?: number;
  wmdDistrict?: string;
  landuseYear?: number;
  description?: string;
  shapeArea?: number;
  shapeLength?: number;
  distance_miles?: number;
  geometry?: any;
  attributes?: Record<string, any>;
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
 * Query FLDEP Landuse MapServer for point-in-polygon (containing)
 */
export async function getFLDEPLanduseContainingData(
  lat: number,
  lon: number
): Promise<FLDEPLanduseInfo[]> {
  try {
    console.log(`🌳 Querying FLDEP Landuse containing [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 FLDEP Landuse Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ FLDEP Landuse API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No FLDEP Landuse found containing the point`);
      return [];
    }
    
    // Process features
    const landuseFeatures: FLDEPLanduseInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      
      return {
        objectId: attributes.OBJECTID,
        level3Value: attributes.LEVEL3_VALUE,
        ldi: attributes.LDI,
        lsi: attributes.LSI,
        wmdDistrict: attributes.WMD_DISTRICT,
        landuseYear: attributes.LANDUSE_YEAR,
        description: attributes.DESCRIPTION,
        shapeArea: attributes['SHAPE.AREA'],
        shapeLength: attributes['SHAPE.LEN'],
        distance_miles: 0, // Point is inside, so distance is 0
        isContaining: true,
        geometry: feature.geometry,
        attributes,
      };
    });
    
    console.log(`✅ Found ${landuseFeatures.length} FLDEP Landuse feature(s) containing the point`);
    
    return landuseFeatures;
  } catch (error) {
    console.error('❌ Error querying FLDEP Landuse (containing):', error);
    return [];
  }
}

/**
 * Query FLDEP Landuse MapServer for proximity search
 * Returns landuse features within the specified radius (in miles)
 */
export async function getFLDEPLanduseNearbyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<FLDEPLanduseInfo[]> {
  try {
    // Cap radius at 5 miles
    const cappedRadius = Math.min(radiusMiles, 5.0);
    
    console.log(`🌳 Querying FLDEP Landuse within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 FLDEP Landuse Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ FLDEP Landuse API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No FLDEP Landuse found within ${cappedRadius} miles`);
      return [];
    }
    
    // Process features and calculate distance
    const landuseFeatures: FLDEPLanduseInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Calculate distance from search point to nearest point on polygon boundary
      let distance_miles: number | undefined = undefined;
      let isContaining = false;
      
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
        objectId: attributes.OBJECTID,
        level3Value: attributes.LEVEL3_VALUE,
        ldi: attributes.LDI,
        lsi: attributes.LSI,
        wmdDistrict: attributes.WMD_DISTRICT,
        landuseYear: attributes.LANDUSE_YEAR,
        description: attributes.DESCRIPTION,
        shapeArea: attributes['SHAPE.AREA'],
        shapeLength: attributes['SHAPE.LEN'],
        distance_miles,
        isContaining,
        geometry,
        attributes,
      };
    }).filter((feature: FLDEPLanduseInfo | null): feature is FLDEPLanduseInfo => feature !== null);
    
    // Sort by distance (containing features first, then by distance)
    landuseFeatures.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      const distA = a.distance_miles ?? Infinity;
      const distB = b.distance_miles ?? Infinity;
      return distA - distB;
    });
    
    console.log(`✅ Found ${landuseFeatures.length} FLDEP Landuse feature(s)`);
    
    return landuseFeatures;
  } catch (error) {
    console.error('❌ Error querying FLDEP Landuse (nearby):', error);
    return [];
  }
}
