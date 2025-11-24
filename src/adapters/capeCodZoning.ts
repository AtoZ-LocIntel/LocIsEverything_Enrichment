/**
 * Cape Cod Zoning Map Adapter
 * Queries Cape Cod Commission Zoning Map from FeatureServer
 * Supports both point-in-polygon and proximity queries
 * This is a polygon dataset, so we calculate distance to nearest point on polygon boundary
 */

const BASE_SERVICE_URL = 'https://gis-services.capecodcommission.org/arcgis/rest/services/Reference/Boundaries/MapServer';
const LAYER_ID = 20;

export interface CapeCodZoning {
  objectId?: number;
  fid?: number;
  townId?: number;
  zoneCode?: string;
  primUse?: string;
  genUse?: string;
  townCode?: string;
  primUse2?: string;
  acres?: number;
  sqMi?: number;
  shapeLeng?: number;
  shapeArea?: number;
  mapc?: string;
  lastedited?: string;
  source?: string;
  currAsOf?: string;
  geomChang?: number;
  attrChang?: number;
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
 * Query Cape Cod Zoning FeatureServer for point-in-polygon (containing)
 */
export async function getCapeCodZoningContainingData(
  lat: number,
  lon: number
): Promise<CapeCodZoning[]> {
  try {
    console.log(`🏘️ Querying Cape Cod Zoning containing [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 Cape Cod Zoning Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Cape Cod Zoning API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No Cape Cod Zoning found containing the point`);
      return [];
    }
    
    // Process features
    const zoningAreas: CapeCodZoning[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      
      return {
        objectId: attributes.OBJECTID || attributes.FID,
        fid: attributes.FID,
        townId: attributes.TOWN_ID || attributes.Town_ID,
        zoneCode: attributes.ZONECODE || attributes.ZoneCode || attributes.zonecode,
        primUse: attributes.PRIM_USE || attributes.Prim_Use || attributes.prim_use,
        genUse: attributes.GEN_USE || attributes.Gen_Use || attributes.gen_use,
        townCode: attributes.TOWNCODE || attributes.TownCode || attributes.towncode,
        primUse2: attributes.PRIM_USE2 || attributes.Prim_Use2 || attributes.prim_use2,
        acres: attributes.ACRES || attributes.Acres || attributes.acres,
        sqMi: attributes.SQMI || attributes.SqMi || attributes.sqmi,
        shapeLeng: attributes.Shape_Leng || attributes.ShapeLeng || attributes.shape_leng,
        shapeArea: attributes.Shape_Area || attributes.ShapeArea || attributes.shape_area,
        mapc: attributes.MAPC || attributes.Mapc || attributes.mapc,
        lastedited: attributes.LASTEDITED || attributes.LastEdited || attributes.lastedited,
        source: attributes.SOURCE || attributes.Source || attributes.source,
        currAsOf: attributes.CURR_AS_OF || attributes.Curr_As_Of || attributes.curr_as_of,
        geomChang: attributes.GEOM_CHANG || attributes.GeomChang || attributes.geom_chang,
        attrChang: attributes.ATTR_CHANG || attributes.AttrChang || attributes.attr_chang,
        distance_miles: 0, // Point is inside, so distance is 0
        geometry: feature.geometry,
        attributes,
      };
    });
    
    console.log(`✅ Found ${zoningAreas.length} Cape Cod Zoning areas containing the point`);
    
    return zoningAreas;
  } catch (error) {
    console.error('❌ Error querying Cape Cod Zoning (containing):', error);
    return [];
  }
}

/**
 * Query Cape Cod Zoning FeatureServer for proximity search
 * Returns zoning areas within the specified radius (in miles)
 */
export async function getCapeCodZoningNearbyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CapeCodZoning[]> {
  try {
    console.log(`🏘️ Querying Cape Cod Zoning within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 Cape Cod Zoning Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Cape Cod Zoning API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No Cape Cod Zoning found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process features and calculate distance
    const zoningAreas: CapeCodZoning[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Calculate distance from search point to nearest point on polygon boundary
      let distance_miles: number | undefined = undefined;
      if (geometry.rings && geometry.rings.length > 0) {
        // Check if point is inside polygon
        const isInside = pointInPolygon(lat, lon, geometry.rings);
        if (isInside) {
          distance_miles = 0;
        } else {
          // Calculate distance to nearest boundary point
          distance_miles = calculateDistanceToPolygon(lat, lon, geometry.rings);
        }
      }
      
      return {
        objectId: attributes.OBJECTID || attributes.FID,
        fid: attributes.FID,
        townId: attributes.TOWN_ID || attributes.Town_ID,
        zoneCode: attributes.ZONECODE || attributes.ZoneCode || attributes.zonecode,
        primUse: attributes.PRIM_USE || attributes.Prim_Use || attributes.prim_use,
        genUse: attributes.GEN_USE || attributes.Gen_Use || attributes.gen_use,
        townCode: attributes.TOWNCODE || attributes.TownCode || attributes.towncode,
        primUse2: attributes.PRIM_USE2 || attributes.Prim_Use2 || attributes.prim_use2,
        acres: attributes.ACRES || attributes.Acres || attributes.acres,
        sqMi: attributes.SQMI || attributes.SqMi || attributes.sqmi,
        shapeLeng: attributes.Shape_Leng || attributes.ShapeLeng || attributes.shape_leng,
        shapeArea: attributes.Shape_Area || attributes.ShapeArea || attributes.shape_area,
        mapc: attributes.MAPC || attributes.Mapc || attributes.mapc,
        lastedited: attributes.LASTEDITED || attributes.LastEdited || attributes.lastedited,
        source: attributes.SOURCE || attributes.Source || attributes.source,
        currAsOf: attributes.CURR_AS_OF || attributes.Curr_As_Of || attributes.curr_as_of,
        geomChang: attributes.GEOM_CHANG || attributes.GeomChang || attributes.geom_chang,
        attrChang: attributes.ATTR_CHANG || attributes.AttrChang || attributes.attr_chang,
        distance_miles,
        geometry,
        attributes,
      };
    });
    
    // Sort by distance
    zoningAreas.sort((a, b) => {
      const distA = a.distance_miles ?? Infinity;
      const distB = b.distance_miles ?? Infinity;
      return distA - distB;
    });
    
    console.log(`✅ Found ${zoningAreas.length} Cape Cod Zoning areas`);
    
    return zoningAreas;
  } catch (error) {
    console.error('❌ Error querying Cape Cod Zoning (nearby):', error);
    return [];
  }
}

