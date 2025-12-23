/**
 * Hurricane Evacuation Routes Adapter
 * Queries Hurricane Evacuation Routes FeatureServer for polyline features
 * Supports proximity queries up to 100 miles
 */

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/Hurricane_Evacuation_Routes_1/FeatureServer';

export interface HurricaneEvacuationRouteInfo {
  routeId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI polyline geometry for drawing on map
  distance_miles: number; // Distance from query point to nearest point on route
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
      
      // ESRI geometry coordinates with outSR=4326 are [x, y] which is [lon, lat] in degrees
      const lat1 = p1[1];
      const lon1 = p1[0];
      const lat2 = p2[1];
      const lon2 = p2[0];
      
      // Calculate distance from point to line segment
      const distance = pointToLineSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, distance);
    }
  });
  
  return minDistance === Infinity ? 0 : minDistance;
}

/**
 * Calculate distance from a point to a line segment
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
  
  // Calculate Haversine distance
  const R = 3959; // Earth's radius in miles
  const dLat = (py - yy) * Math.PI / 180;
  const dLon = (px - xx) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(py * Math.PI / 180) * Math.cos(yy * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query Hurricane Evacuation Routes FeatureServer
 * Supports proximity queries up to 100 miles
 */
export async function getHurricaneEvacuationRoutesData(
  lat: number,
  lon: number,
  radius?: number
): Promise<HurricaneEvacuationRouteInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log(`ℹ️ Hurricane Evacuation Routes requires a radius for proximity query`);
      return [];
    }
    
    // Cap radius at 100 miles
    const cappedRadius = Math.min(radius, 100.0);
    
    console.log(`🌀 Querying Hurricane Evacuation Routes within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = cappedRadius * 1609.34;
    
    const results: HurricaneEvacuationRouteInfo[] = [];
    const processedFeatureIds = new Set<string>();
    
    // Proximity query with pagination support
    const allFeatures: any[] = [];
    let resultOffset = 0;
    const batchSize = 2000; // Max record count per request
    let hasMore = true;
    
    while (hasMore) {
      const queryUrl = new URL(`${BASE_SERVICE_URL}/0/query`);
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
      queryUrl.searchParams.set('resultRecordCount', batchSize.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      if (resultOffset === 0) {
        console.log(`🔗 Hurricane Evacuation Routes Proximity Query URL: ${queryUrl.toString()}`);
      }
      
      try {
        const proximityData = await fetchJSONSmart(queryUrl.toString());
        
        if (proximityData.error) {
          console.error(`❌ Hurricane Evacuation Routes API Error:`, proximityData.error);
          break;
        }
        
        if (!proximityData.features || proximityData.features.length === 0) {
          hasMore = false;
          break;
        }
        
        allFeatures.push(...proximityData.features);
        
        if (resultOffset === 0) {
          console.log(`✅ Hurricane Evacuation Routes returned ${proximityData.features.length} feature(s) from proximity query`);
        }
        
        // Check if we need to fetch more results
        if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
          resultOffset += batchSize;
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(`❌ Error fetching Hurricane Evacuation Routes (offset ${resultOffset}):`, error);
        hasMore = false;
      }
    }
    
    console.log(`✅ Fetched ${allFeatures.length} total Hurricane Evacuation Routes features`);
    
    // Process features and calculate distances
    allFeatures.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const routeId = attributes.OBJECTID || 
                     attributes.objectid || 
                     attributes.ROUTE_ID ||
                     attributes.route_id ||
                     attributes.NAME ||
                     attributes.name ||
                     null;
      
      const featureId = routeId ? routeId.toString() : `${feature.OBJECTID || feature.objectid || Math.random()}`;
      
      // Skip if we already processed this feature
      if (processedFeatureIds.has(featureId)) {
        return;
      }
      
      // Calculate distance for polyline features
      let distance_miles = 0;
      if (geometry && geometry.paths) {
        // Polyline geometry - calculate distance to nearest point on line
        distance_miles = calculateDistanceToPolyline(lat, lon, geometry.paths);
      }
      
      results.push({
        routeId: routeId ? routeId.toString() : null,
        attributes,
        geometry,
        distance_miles
      });
      
      processedFeatureIds.add(featureId);
    });
    
    // Sort by distance (closest first)
    results.sort((a, b) => a.distance_miles - b.distance_miles);
    
    console.log(`✅ Processed ${results.length} Hurricane Evacuation Routes feature(s) within ${cappedRadius} miles`);
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying Hurricane Evacuation Routes:`, error);
    return [];
  }
}

