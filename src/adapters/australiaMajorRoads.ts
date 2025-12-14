/**
 * Australia Major Roads Adapter
 * Queries Digital Atlas AUS Major Roads FeatureServer
 * Polyline feature service for major road infrastructure
 * Supports proximity queries up to 1 mile (0.25, 0.50, 0.75, 1.0)
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/MajorRoads/FeatureServer/0';

export interface AustraliaMajorRoadInfo {
  objectId: number;
  roadId: string | null;
  fullStreetName: string | null;
  streetName: string | null;
  streetType: string | null;
  hierarchy: string | null;
  status: string | null;
  surface: string | null;
  state: string | null;
  oneWay: string | null;
  laneDescription: string | null;
  lat: number;
  lon: number;
  distance_miles?: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  [key: string]: any; // For other attributes
}

// Haversine distance calculation
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
      
      // ESRI geometry with outSR=4326 are [x, y] which is [lon, lat] in degrees
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
  
  // Convert back to degrees for haversine
  const lat1Deg = y1 * 180 / Math.PI;
  const lon1Deg = x1 * 180 / Math.PI;
  const lat2Deg = y2 * 180 / Math.PI;
  const lon2Deg = x2 * 180 / Math.PI;
  const latPDeg = py;
  const lonPDeg = px;
  
  // Calculate distance from point to each endpoint
  const d1 = haversineDistance(latPDeg, lonPDeg, lat1Deg, lon1Deg);
  const d2 = haversineDistance(latPDeg, lonPDeg, lat2Deg, lon2Deg);
  
  // Calculate distance along the line segment
  const dSegment = haversineDistance(lat1Deg, lon1Deg, lat2Deg, lon2Deg);
  
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
  
  // Calculate distance to closest point
  const latClosestDeg = latClosest * 180 / Math.PI;
  const lonClosestDeg = lonClosest * 180 / Math.PI;
  return haversineDistance(latPDeg, lonPDeg, latClosestDeg, lonClosestDeg);
}

export async function getAustraliaMajorRoadsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AustraliaMajorRoadInfo[]> {
  try {
    console.log(`🛣️ Querying Australia Major Roads within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    // Convert radius from miles to meters for ESRI query
    const radiusMeters = radiusMiles * 1609.34;
    
    const roads: AustraliaMajorRoadInfo[] = [];
    let hasMore = true;
    let resultOffset = 0;
    const resultRecordCount = 2000;
    
    while (hasMore) {
      // Build query URL using URL API for better reliability
      const queryUrl = new URL(`${BASE_SERVICE_URL}/query`);
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
      queryUrl.searchParams.set('resultRecordCount', resultRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      console.log(`🔗 Australia Major Roads Query URL: ${queryUrl.toString()}`);
      
      const response = await fetchJSONSmart(queryUrl.toString());
      
      if (response.error) {
        console.error(`❌ Australia Major Roads API Error:`, response.error);
        hasMore = false;
        break;
      }
      
      if (!response || !response.features || response.features.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const feature of response.features) {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        if (!geometry || !geometry.paths) {
          continue;
        }
        
        // Calculate distance from search point to polyline
        const paths = geometry.paths;
        const finalDistance = calculateDistanceToPolyline(lat, lon, paths);
        
        // Find closest point on polyline for display
        let closestPoint: { lat: number; lon: number } | null = null;
        let minPointDistance = Infinity;
        
        for (const path of paths) {
          for (let i = 0; i < path.length; i++) {
            const [pointLon, pointLat] = path[i];
            const distance = haversineDistance(lat, lon, pointLat, pointLon);
            if (distance < minPointDistance) {
              minPointDistance = distance;
              closestPoint = { lat: pointLat, lon: pointLon };
            }
          }
        }
        
        // Only include if within radius
        if (finalDistance <= radiusMiles && closestPoint) {
          const roadInfo: AustraliaMajorRoadInfo = {
            objectId: attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 0,
            roadId: attributes.road_id || attributes.ROAD_ID || null,
            fullStreetName: attributes.full_street_name || attributes.FULL_STREET_NAME || null,
            streetName: attributes.street_name || attributes.STREET_NAME || attributes.street_name_label || attributes.STREET_NAME_LABEL || null,
            streetType: attributes.street_type || attributes.STREET_TYPE || attributes.street_type_label || attributes.STREET_TYPE_LABEL || null,
            hierarchy: attributes.hierarchy || attributes.HIERARCHY || null,
            status: attributes.status || attributes.STATUS || null,
            surface: attributes.surface || attributes.SURFACE || null,
            state: attributes.state || attributes.STATE || null,
            oneWay: attributes.one_way || attributes.ONE_WAY || null,
            laneDescription: attributes.lane_description || attributes.LANE_DESCRIPTION || null,
            lat: closestPoint.lat,
            lon: closestPoint.lon,
            distance_miles: finalDistance,
            attributes,
            geometry,
            ...attributes
          };
          
          roads.push(roadInfo);
        }
      }
      
      // Check if there are more results
      if (response.exceededTransferLimit === true || response.features.length === resultRecordCount) {
        resultOffset += resultRecordCount;
      } else {
        hasMore = false;
      }
    }
    
    // Sort by distance
    roads.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${roads.length} Australia Major Roads`);
    
    return roads;
  } catch (error) {
    console.error('❌ Error querying Australia Major Roads:', error);
    return [];
  }
}


