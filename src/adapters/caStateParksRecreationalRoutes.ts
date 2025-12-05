/**
 * CA State Parks Recreational Routes Adapter
 * Queries California State Parks Recreational Routes from CA State Parks FeatureServer
 * Supports proximity queries for linear features (polylines)
 */

const BASE_SERVICE_URL = 'https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/RecreationalRoutes/FeatureServer';
const LAYER_ID = 0;

export interface CAStateParkRecreationalRouteInfo {
  routeId: string | null;
  routeName: string | null;
  gisId: string | null;
  routeClass: string | null;
  routeCategory: string | null;
  routeType: string | null;
  unitNbr: string | null;
  unitName: string | null;
  segmentLength: number | null;
  share: string | null;
  routeDescription: string | null;
  trailDescription: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI polyline geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Calculate distance from point to nearest point on polyline
 */
function calculateDistanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  let minDistance = Infinity;
  
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const [lon1, lat1] = path[i];
      const [lon2, lat2] = path[i + 1];
      
      // Calculate distance from point to line segment
      const distance = pointToLineSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, distance);
    }
  }
  
  return minDistance;
}

/**
 * Calculate distance from point to line segment
 */
function pointToLineSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx: number, yy: number;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  
  // Convert to meters using haversine
  const R = 6371000; // Earth radius in meters
  const dLat = (dy * Math.PI) / 180;
  const dLon = (dx * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((y1 * Math.PI) / 180) * Math.cos((yy * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query CA State Parks Recreational Routes FeatureServer for proximity
 * Note: This is a linear feature (polyline), so we query all routes and filter by distance
 */
export async function getCAStateParksRecreationalRoutesData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CAStateParkRecreationalRouteInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log('ℹ️ CA State Parks Recreational Routes requires a radius for proximity query');
      return [];
    }
    
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radius, 25.0);
    
    console.log(`🛤️ Querying CA State Parks Recreational Routes within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CA State Parks Recreational Routes Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA State Parks Recreational Routes API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA State Parks Recreational Routes found within the specified radius');
      return [];
    }
    
    const results: CAStateParkRecreationalRouteInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const routeId = attributes.FID || 
                     attributes.fid || 
                     attributes.OBJECTID ||
                     attributes.objectid ||
                     attributes.GlobalID ||
                     null;
      
      // Extract route information
      const routeName = attributes.ROUTENAME || 
                       attributes.routeName ||
                       attributes.RouteName ||
                       attributes.NAME ||
                       attributes.name ||
                       null;
      
      const gisId = attributes.GISID || 
                   attributes.gisId ||
                   attributes.GisId ||
                   null;
      
      const routeClass = attributes.ROUTECLASS || 
                        attributes.routeClass ||
                        attributes.RouteClass ||
                        null;
      
      const routeCategory = attributes.ROUTECAT || 
                           attributes.routeCat ||
                           attributes.RouteCat ||
                           attributes.ROUTE_CAT ||
                           attributes.route_category ||
                           null;
      
      const routeType = attributes.ROUTETYPE || 
                       attributes.routeType ||
                       attributes.RouteType ||
                       attributes.ROUTE_TYPE ||
                       attributes.route_type ||
                       null;
      
      const unitNbr = attributes.UNITNBR || 
                     attributes.unitNbr ||
                     attributes.UnitNbr ||
                     null;
      
      const unitName = attributes.UNITNAME || 
                      attributes.unitName ||
                      attributes.UnitName ||
                      null;
      
      const segmentLength = attributes.SEGLNGTH || 
                           attributes.segLngth ||
                           attributes.SEGMENT_LENGTH ||
                           attributes.segment_length ||
                           attributes.Shape_Length ||
                           attributes.shape_length ||
                           null;
      
      const share = attributes.SHARE || 
                   attributes.share ||
                   attributes.Share ||
                   null;
      
      const routeDescription = attributes.ROUTEDES || 
                              attributes.routeDes ||
                              attributes.ROUTE_DES ||
                              attributes.route_description ||
                              null;
      
      const trailDescription = attributes.TRAILDES || 
                              attributes.trailDes ||
                              attributes.TRAIL_DES ||
                              attributes.trail_description ||
                              null;
      
      // Calculate distance from point to polyline
      let distance_miles = cappedRadius; // Default to max radius
      if (geometry && geometry.paths) {
        // Convert geometry paths to lat/lon if needed (check if in Web Mercator)
        let paths = geometry.paths;
        
        // If coordinates look like Web Mercator (large numbers), we'll approximate
        // Otherwise assume they're already in lat/lon
        if (paths.length > 0 && paths[0].length > 0) {
          const firstCoord = paths[0][0];
          // Web Mercator coordinates are typically in millions
          if (Math.abs(firstCoord[0]) > 1000000 || Math.abs(firstCoord[1]) > 1000000) {
            // Approximate distance using bounding box
            distance_miles = cappedRadius;
          } else {
            // Calculate actual distance to polyline
            const distanceMeters = calculateDistanceToPolyline(lat, lon, paths);
            distance_miles = distanceMeters / 1609.34;
          }
        }
      }
      
      // Only include routes within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          routeId: routeId ? routeId.toString() : null,
          routeName,
          gisId,
          routeClass,
          routeCategory,
          routeType,
          unitNbr,
          unitName,
          segmentLength: segmentLength ? parseFloat(segmentLength.toString()) : null,
          share,
          routeDescription,
          trailDescription,
          attributes,
          geometry,
          distance_miles: Number(distance_miles.toFixed(2))
        });
      }
    });
    
    // Sort by distance (closest first)
    results.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${results.length} CA State Parks Recreational Route(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA State Parks Recreational Routes:', error);
    return [];
  }
}

