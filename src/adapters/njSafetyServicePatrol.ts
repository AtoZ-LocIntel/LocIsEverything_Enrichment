/**
 * NJ Safety Service Patrol Adapter
 * Queries New Jersey Department of Transportation Safety Service Patrol routes from NJGIN FeatureServer
 * Supports proximity queries up to 25 miles
 * This is a line dataset (polylines), so we calculate distance to nearest point on the line
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/HggmsDF7UJsNN1FK/arcgis/rest/services/Safety_Service_Patrol/FeatureServer';
const LAYER_ID = 0;

export interface NJSafetyServicePatrolInfo {
  routeId: string | null;
  routeName: string | null;
  sri: string | null;
  beginMile: number | null;
  endMile: number | null;
  totalMiles: number | null;
  category: string | null;
  categoryType: string | null;
  locationError: string | null;
  attributes: Record<string, any>;
  geometry: any; // ESRI polyline geometry for drawing on map
  distance_miles?: number;
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
  // Calculate distance from point to each endpoint
  const d1 = haversineDistance(py, px, y1, x1);
  const d2 = haversineDistance(py, px, y2, x2);
  
  // Calculate distance along the line segment
  const dSegment = haversineDistance(y1, x1, y2, x2);
  
  // If segment is very short, just use distance to nearest endpoint
  if (dSegment < 0.001) {
    return Math.min(d1, d2);
  }
  
  // Calculate the closest point on the line segment using vector projection
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, 
    ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
  ));
  
  const closestLon = x1 + t * dx;
  const closestLat = y1 + t * dy;
  
  return haversineDistance(py, px, closestLat, closestLon);
}

/**
 * Haversine distance calculation
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
 * Query NJ Safety Service Patrol FeatureServer for proximity search
 * Returns patrol routes within the specified radius (in miles, max 25 miles)
 */
export async function getNJSafetyServicePatrolData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NJSafetyServicePatrolInfo[]> {
  try {
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radiusMiles, 25.0);
    
    console.log(`🚨 Querying NJ Safety Service Patrol routes within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    // Convert miles to meters for the buffer
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
    
    console.log(`🔗 NJ Safety Service Patrol Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NJ Safety Service Patrol API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NJ Safety Service Patrol routes found within ${cappedRadius} miles`);
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} NJ Safety Service Patrol routes nearby`);
    
    // Process features and calculate distances
    const patrolRoutes: NJSafetyServicePatrolInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract route fields
      const routeName = attributes.SRI_ || attributes.sri_ || attributes.ROUTE || attributes.route || null;
      const sri = attributes.SRI || attributes.sri || null;
      const beginMile = attributes.BEGIN_MILE !== null && attributes.BEGIN_MILE !== undefined ? parseFloat(attributes.BEGIN_MILE.toString()) : null;
      const endMile = attributes.END_MILEPO !== null && attributes.END_MILEPO !== undefined ? parseFloat(attributes.END_MILEPO.toString()) : null;
      const totalMiles = attributes.TOTAL_MILE !== null && attributes.TOTAL_MILE !== undefined ? parseFloat(attributes.TOTAL_MILE.toString()) : null;
      const category = attributes.CAT || attributes.cat || null;
      const categoryType = attributes.CAT_1 || attributes.cat_1 || null;
      const locationError = attributes.LOC_ERROR || attributes.loc_error || null;
      
      const routeId = attributes.OBJECTID || attributes.objectid || sri || null;
      
      // Calculate distance to polyline
      let distance_miles: number | undefined = undefined;
      if (geometry.paths && geometry.paths.length > 0) {
        distance_miles = calculateDistanceToPolyline(lat, lon, geometry.paths);
      }
      
      return {
        routeId: routeId ? routeId.toString() : null,
        routeName,
        sri,
        beginMile,
        endMile,
        totalMiles,
        category,
        categoryType,
        locationError,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    // Filter by actual distance and sort by distance
    const filteredRoutes = patrolRoutes
      .filter(route => route.distance_miles !== undefined && route.distance_miles <= cappedRadius)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Returning ${filteredRoutes.length} NJ Safety Service Patrol routes within ${cappedRadius} miles`);
    
    return filteredRoutes;
    
  } catch (error) {
    console.error('❌ Error querying NJ Safety Service Patrol:', error);
    return [];
  }
}

