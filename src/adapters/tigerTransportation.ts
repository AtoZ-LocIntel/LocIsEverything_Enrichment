/**
 * TIGER Transportation Adapter
 * Queries US Census TIGER Transportation MapServer for roads and railroads
 * Supports proximity queries up to 25 miles
 * API: https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer';

export interface TIGERTransportationInfo {
  objectId: number;
  fullName?: string | null;
  rttyp?: string | null; // Route type
  mtfcc?: string | null; // MAF/TIGER Feature Class Code
  linearId?: string | null;
  geometry: any; // ESRI polyline geometry for drawing on map
  distance_miles?: number;
  attributes: Record<string, any>;
}

/**
 * Calculate distance from a point to the nearest point on a polyline
 */
function calculateDistanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  let minDistance = Infinity;
  
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      // Calculate distance from point to line segment
      const dist = pointToLineSegmentDistance(lat, lon, p1[1], p1[0], p2[1], p2[0]);
      minDistance = Math.min(minDistance, dist);
    }
  }
  
  return minDistance;
}

/**
 * Calculate distance from a point to a line segment using perpendicular distance
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
  
  // Calculate distance using Haversine formula
  return haversineDistance(py, px, yy, xx);
}

/**
 * Calculate distance between two points using Haversine formula
 */
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
 * Query TIGER Transportation MapServer for a specific layer
 * All layers are linear features (roads/railroads) - proximity queries only
 */
export async function getTIGERTransportationData(
  layerId: number,
  lat: number,
  lon: number,
  radius?: number
): Promise<TIGERTransportationInfo[]> {
  try {
    const results: TIGERTransportationInfo[] = [];
    const maxRadius = radius ? Math.min(radius, 25) : 25; // Cap at 25 miles
    
    console.log(`🗺️ Querying TIGER Transportation Layer ${layerId} for proximity at [${lat}, ${lon}]`);
    
    // Proximity query for linear features
    if (maxRadius > 0) {
      const radiusMeters = maxRadius * 1609.34; // Convert miles to meters
      
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const proximityUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
        proximityUrl.searchParams.set('f', 'json');
        proximityUrl.searchParams.set('where', '1=1');
        proximityUrl.searchParams.set('outFields', '*');
        proximityUrl.searchParams.set('geometry', JSON.stringify({
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        }));
        proximityUrl.searchParams.set('geometryType', 'esriGeometryPoint');
        proximityUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
        proximityUrl.searchParams.set('distance', radiusMeters.toString());
        proximityUrl.searchParams.set('units', 'esriSRUnit_Meter');
        proximityUrl.searchParams.set('inSR', '4326');
        proximityUrl.searchParams.set('outSR', '4326');
        proximityUrl.searchParams.set('returnGeometry', 'true');
        proximityUrl.searchParams.set('resultRecordCount', pageSize.toString());
        proximityUrl.searchParams.set('resultOffset', offset.toString());
        
        console.log(`🔗 TIGER Transportation Layer ${layerId} Proximity Query URL (offset ${offset}): ${proximityUrl.toString()}`);
        
        try {
          const proximityData = await fetchJSONSmart(proximityUrl.toString());
          
          if (proximityData.error) {
            console.error(`❌ TIGER Transportation Layer ${layerId} API Error:`, proximityData.error);
            break;
          }
          
          if (!proximityData.features || proximityData.features.length === 0) {
            hasMore = false;
            break;
          }
          
          // Process features
          for (const feature of proximityData.features) {
            const attrs = feature.attributes || {};
            const geom = feature.geometry;
            
            if (!geom || !geom.paths || geom.paths.length === 0) {
              continue;
            }
            
            // Calculate distance to polyline
            const distance = calculateDistanceToPolyline(lat, lon, geom.paths);
            
            // Filter by actual distance (API returns features within buffer, but we want accurate distance)
            if (distance > maxRadius) {
              continue;
            }
            
            results.push({
              objectId: attrs.OBJECTID || attrs.objectId || attrs.FID || 0,
              fullName: attrs.FULLNAME || attrs.fullName || attrs.NAME || null,
              rttyp: attrs.RTTYP || attrs.rttyp || null,
              mtfcc: attrs.MTFCC || attrs.mtfcc || null,
              linearId: attrs.LINEARID || attrs.linearId || null,
              geometry: geom,
              distance_miles: distance,
              attributes: attrs
            });
          }
          
          // Check if there are more results
          if (proximityData.features.length < pageSize) {
            hasMore = false;
          } else {
            offset += pageSize;
          }
          
          // Add a small delay to avoid rate limiting
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`❌ Error querying TIGER Transportation Layer ${layerId}:`, error);
          hasMore = false;
        }
      }
    }
    
    // Sort by distance
    results.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ TIGER Transportation Layer ${layerId}: Found ${results.length} features`);
    return results;
  } catch (error) {
    console.error(`❌ Error in getTIGERTransportationData for layer ${layerId}:`, error);
    return [];
  }
}

