/**
 * CT DEEP Properties Adapter
 * Queries Connecticut Department of Energy and Environmental Protection (DEEP) Properties
 * from CT Geodata Portal FeatureServer
 * Supports both point-in-polygon (which property contains the point) and
 * proximity queries (properties within a specified radius up to 25 miles)
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/Connecticut_DEEP_Property/FeatureServer';
const LAYER_ID = 0;

export interface CTDeepPropertyData {
  containingProperty: CTDeepPropertyInfo | null;
  nearbyProperties: CTDeepPropertyInfo[];
}

export interface CTDeepPropertyInfo {
  propertyId: string | null;
  propertyName: string | null;
  avLegend: string | null;
  imsLegend: string | null;
  depId: string | null;
  agencyFunctionCode: string | null;
  acreage: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number;
}

/**
 * Calculate distance from a point to a polygon (distance to nearest edge)
 */
function calculateDistanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  let minDistance = Infinity;
  
  // Check distance to each ring (outer boundary and holes)
  rings.forEach(ring => {
    // Check distance to each edge of the ring
    for (let i = 0; i < ring.length; i++) {
      const p1 = ring[i];
      const p2 = ring[(i + 1) % ring.length]; // Wrap around to close the polygon
      
      // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
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
 * Query CT DEEP Properties FeatureServer for point-in-polygon
 * Returns the property that contains the given point
 */
async function getContainingProperty(
  lat: number,
  lon: number
): Promise<CTDeepPropertyInfo | null> {
  try {
    console.log(`🏞️ Querying CT DEEP Properties for containing property at [${lat}, ${lon}]`);
    
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
    queryUrl.searchParams.set('returnGeometry', 'true'); // Return geometry for map drawing
    
    console.log(`🔗 CT DEEP Properties Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT DEEP Properties API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CT DEEP Property found containing this location');
      return null;
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    // Extract property information
    const propertyId = attributes.OBJECTID || 
                     attributes.objectid || 
                     attributes.DEP_ID ||
                     attributes.dep_id ||
                     attributes.GlobalID ||
                     null;
    
    const propertyName = attributes.PROPERTY || 
                        attributes.property || 
                        attributes.Property ||
                        null;
    
    const avLegend = attributes.AV_LEGEND || 
                    attributes.av_legend || 
                    attributes.Av_Legend ||
                    null;
    
    const imsLegend = attributes.IMS_LEGEND || 
                     attributes.ims_legend || 
                     attributes.Ims_Legend ||
                     null;
    
    const depId = attributes.DEP_ID || 
                 attributes.dep_id || 
                 attributes.Dep_Id ||
                 null;
    
    const agencyFunctionCode = attributes.AGNCYFN_CD || 
                              attributes.agncyfn_cd || 
                              attributes.AgncyFn_Cd ||
                              null;
    
    const acreage = attributes.ACRE_GIS || 
                   attributes.acre_gis || 
                   attributes.Acre_Gis ||
                   null;
    
    console.log(`✅ Found containing CT DEEP Property: ${propertyName || propertyId}`);
    
    return {
      propertyId,
      propertyName,
      avLegend,
      imsLegend,
      depId,
      agencyFunctionCode,
      acreage: acreage ? parseFloat(acreage.toString()) : null,
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying CT DEEP Properties for containing property:', error);
    return null;
  }
}

/**
 * Query CT DEEP Properties FeatureServer for proximity search
 * Returns properties within the specified radius (in miles, up to 25 miles)
 */
async function getNearbyProperties(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTDeepPropertyInfo[]> {
  try {
    console.log(`🏞️ Querying CT DEEP Properties within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    // Convert miles to meters for the buffer distance
    const radiusMeters = radiusMiles * 1609.34;
    
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
    queryUrl.searchParams.set('returnGeometry', 'true'); // Return geometry for map drawing
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    
    console.log(`🔗 CT DEEP Properties Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT DEEP Properties API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No CT DEEP Properties found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const properties: CTDeepPropertyInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      // Extract property information
      const propertyId = attributes.OBJECTID || 
                       attributes.objectid || 
                       attributes.DEP_ID ||
                       attributes.dep_id ||
                       attributes.GlobalID ||
                       null;
      
      const propertyName = attributes.PROPERTY || 
                          attributes.property || 
                          attributes.Property ||
                          null;
      
      const avLegend = attributes.AV_LEGEND || 
                      attributes.av_legend || 
                      attributes.Av_Legend ||
                      null;
      
      const imsLegend = attributes.IMS_LEGEND || 
                       attributes.ims_legend || 
                       attributes.Ims_Legend ||
                       null;
      
      const depId = attributes.DEP_ID || 
                   attributes.dep_id || 
                   attributes.Dep_Id ||
                   null;
      
      const agencyFunctionCode = attributes.AGNCYFN_CD || 
                                attributes.agncyfn_cd || 
                                attributes.AgncyFn_Cd ||
                                null;
      
      const acreage = attributes.ACRE_GIS || 
                     attributes.acre_gis || 
                     attributes.Acre_Gis ||
                     null;
      
      // Calculate distance from search point to nearest edge of polygon
      let distance_miles: number | undefined = undefined;
      if (geometry && geometry.rings && geometry.rings.length > 0) {
        distance_miles = calculateDistanceToPolygon(lat, lon, geometry.rings);
      }
      
      return {
        propertyId,
        propertyName,
        avLegend,
        imsLegend,
        depId,
        agencyFunctionCode,
        acreage: acreage ? parseFloat(acreage.toString()) : null,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    // Sort by distance (closest first)
    properties.sort((a, b) => {
      const distA = a.distance_miles ?? Infinity;
      const distB = b.distance_miles ?? Infinity;
      return distA - distB;
    });
    
    console.log(`✅ Found ${properties.length} nearby CT DEEP Properties`);
    
    return properties;
  } catch (error) {
    console.error('❌ Error querying CT DEEP Properties for nearby properties:', error);
    return [];
  }
}

/**
 * Main function to get both containing property and nearby properties
 */
export async function getCTDeepPropertyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTDeepPropertyData | null> {
  try {
    // Get containing property (point-in-polygon)
    const containingProperty = await getContainingProperty(lat, lon);
    
    // Get nearby properties (proximity search)
    const nearbyProperties = await getNearbyProperties(lat, lon, radiusMiles);
    
    return {
      containingProperty,
      nearbyProperties
    };
  } catch (error) {
    console.error('❌ Error fetching CT DEEP Property data:', error);
    return null;
  }
}

