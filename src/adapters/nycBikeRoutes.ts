/**
 * NYC Bike Routes Adapter
 * Queries NYC Bike Routes (linear feature service)
 * Supports proximity queries (max 5 miles)
 */

const BASE_SERVICE_URL = 'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/ArcGIS/rest/services/Bike_Routes/FeatureServer';
const LAYER_ID = 0;

export interface NYCBikeRouteInfo {
  routeId: string | null;
  name: string | null;
  routeType: string | null;
  status: string | null;
  shapeLength: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
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
 * Query NYC Bike Routes FeatureServer for proximity
 */
export async function getNYCBikeRoutesData(
  lat: number,
  lon: number,
  radius?: number
): Promise<NYCBikeRouteInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log(`ℹ️ NYC Bike Routes requires a radius for proximity query`);
      return [];
    }
    
    // Cap radius at 5 miles
    const cappedRadius = Math.min(radius, 5.0);
    
    console.log(`🚴 Querying NYC Bike Routes within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = cappedRadius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
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
    
    console.log(`🔗 NYC Bike Routes Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NYC Bike Routes API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No NYC Bike Routes found within the specified radius');
      return [];
    }
    
    const results: NYCBikeRouteInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const routeId = attributes.OBJECTID || 
                    attributes.objectid || 
                    attributes.GlobalID ||
                    attributes.GLOBALID ||
                    attributes.ROUTE_ID ||
                    attributes.route_id ||
                    null;
      
      // Extract route information
      const name = attributes.NAME || 
                  attributes.name ||
                  attributes.Name ||
                  attributes.ROUTE_NAME ||
                  attributes.route_name ||
                  null;
      
      const routeType = attributes.ROUTE_TYPE || 
                       attributes.route_type ||
                       attributes.RouteType ||
                       attributes.TYPE ||
                       attributes.type ||
                       null;
      
      const status = attributes.STATUS || 
                    attributes.status ||
                    attributes.Status ||
                    null;
      
      const shapeLength = attributes.Shape__Length !== null && attributes.Shape__Length !== undefined 
                         ? parseFloat(attributes.Shape__Length.toString())
                         : (attributes.shape_length !== null && attributes.shape_length !== undefined
                            ? parseFloat(attributes.shape_length.toString())
                            : (attributes.SHAPE_LENGTH !== null && attributes.SHAPE_LENGTH !== undefined
                               ? parseFloat(attributes.SHAPE_LENGTH.toString())
                               : null));
      
      // Calculate distance to line segment (use centroid or nearest point)
      let distance = cappedRadius; // Default to max radius
      if (geometry && geometry.paths && geometry.paths.length > 0) {
        // Calculate centroid of line
        // ESRI polyline geometry: paths is an array of coordinate arrays
        // Each path is an array of [x, y] or [x, y, z] coordinates
        let sumLat = 0;
        let sumLon = 0;
        let coordCount = 0;
        
        geometry.paths.forEach((path: number[][]) => {
          path.forEach((coord: number[]) => {
            if (coord && coord.length >= 2) {
              // ESRI coordinates are [x, y] where x is longitude and y is latitude
              sumLon += coord[0];
              sumLat += coord[1];
              coordCount++;
            }
          });
        });
        
        if (coordCount > 0) {
          const centroidLat = sumLat / coordCount;
          const centroidLon = sumLon / coordCount;
          distance = calculateDistance(lat, lon, centroidLat, centroidLon);
        }
      }
      
      results.push({
        routeId: routeId ? routeId.toString() : null,
        name,
        routeType,
        status,
        shapeLength,
        attributes,
        geometry,
        distance_miles: distance
      });
    });
    
    console.log(`✅ NYC Bike Routes: Found ${results.length} route(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying NYC Bike Routes data:', error);
    throw error;
  }
}

