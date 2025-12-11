/**
 * TIGER School Districts Adapter
 * Queries US Census TIGER School Districts MapServer for school districts
 * Supports point-in-polygon and proximity queries up to 25 miles
 * API: https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/School/MapServer
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/School/MapServer';

export interface TIGERSchoolDistrictInfo {
  objectId: number;
  name?: string | null;
  stateFips?: string | null;
  countyFips?: string | null;
  districtCode?: string | null;
  geometry: any; // ESRI polygon geometry for drawing on map
  distance_miles?: number;
  attributes: Record<string, any>;
}

/**
 * Calculate distance from a point to the nearest point on a polygon boundary
 */
function calculateDistanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  let minDistance = Infinity;
  
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const p1 = ring[i];
      const p2 = ring[(i + 1) % ring.length]; // Wrap around to first point
      
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
 * Query TIGER School Districts MapServer for a specific layer
 * Supports both point-in-polygon and proximity queries
 */
export async function getTIGERSchoolDistrictsData(
  layerId: number,
  lat: number,
  lon: number,
  radius?: number
): Promise<{ containing: TIGERSchoolDistrictInfo | null; nearby: TIGERSchoolDistrictInfo[] }> {
  try {
    const results: { containing: TIGERSchoolDistrictInfo | null; nearby: TIGERSchoolDistrictInfo[] } = {
      containing: null,
      nearby: []
    };
    
    const maxRadius = radius ? Math.min(radius, 25) : 25; // Cap at 25 miles
    
    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pointInPolyUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
      pointInPolyUrl.searchParams.set('f', 'json');
      pointInPolyUrl.searchParams.set('where', '1=1');
      pointInPolyUrl.searchParams.set('outFields', '*');
      pointInPolyUrl.searchParams.set('geometry', JSON.stringify(pointGeometry));
      pointInPolyUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      pointInPolyUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      pointInPolyUrl.searchParams.set('inSR', '4326');
      pointInPolyUrl.searchParams.set('outSR', '4326');
      pointInPolyUrl.searchParams.set('returnGeometry', 'true');
      
      console.log(`🏫 Querying TIGER School Districts Layer ${layerId} for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 TIGER School Districts Point-in-Polygon Query URL: ${pointInPolyUrl.toString()}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl.toString());
      
      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        const feature = pointInPolyData.features[0];
        const attrs = feature.attributes || {};
        const geom = feature.geometry;
        
        if (geom && geom.rings) {
          results.containing = {
            objectId: attrs.OBJECTID || attrs.objectId || attrs.FID || 0,
            name: attrs.NAME || attrs.name || attrs.NAMELSAD || attrs.NAMELSAD || null,
            stateFips: attrs.STATEFP || attrs.stateFips || attrs.STATEFP00 || null,
            countyFips: attrs.COUNTYFP || attrs.countyFips || attrs.COUNTYFP00 || null,
            districtCode: attrs.SCHOOLYEAR || attrs.schoolYear || attrs.GEOID || attrs.geoid || null,
            geometry: geom,
            distance_miles: 0, // Containing polygon has distance 0
            attributes: attrs
          };
          console.log(`✅ Found containing school district: ${results.containing.name || 'Unknown'}`);
        }
      }
    } catch (error) {
      console.error(`❌ Point-in-polygon query failed for layer ${layerId}:`, error);
    }
    
    // Proximity query (if radius is provided)
    if (maxRadius > 0) {
      try {
        const radiusMeters = maxRadius * 1609.34; // Convert miles to meters
        const proximityGeometry = {
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        };
        
        const allFeatures: any[] = [];
        let resultOffset = 0;
        const batchSize = 2000;
        let hasMore = true;
        
        while (hasMore) {
          const proximityUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
          proximityUrl.searchParams.set('f', 'json');
          proximityUrl.searchParams.set('where', '1=1');
          proximityUrl.searchParams.set('outFields', '*');
          proximityUrl.searchParams.set('geometry', JSON.stringify(proximityGeometry));
          proximityUrl.searchParams.set('geometryType', 'esriGeometryPoint');
          proximityUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
          proximityUrl.searchParams.set('distance', radiusMeters.toString());
          proximityUrl.searchParams.set('units', 'esriSRUnit_Meter');
          proximityUrl.searchParams.set('inSR', '4326');
          proximityUrl.searchParams.set('outSR', '4326');
          proximityUrl.searchParams.set('returnGeometry', 'true');
          proximityUrl.searchParams.set('resultRecordCount', batchSize.toString());
          proximityUrl.searchParams.set('resultOffset', resultOffset.toString());
          
          if (resultOffset === 0) {
            console.log(`🏫 Querying TIGER School Districts Layer ${layerId} for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl.toString());
          
          if (proximityData.error) {
            console.error(`❌ TIGER School Districts Layer ${layerId} API Error:`, proximityData.error);
            break;
          }
          
          if (!proximityData.features || proximityData.features.length === 0) {
            hasMore = false;
            break;
          }
          
          allFeatures.push(...proximityData.features);
          
          if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
            resultOffset += batchSize;
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            hasMore = false;
          }
        }
        
        console.log(`✅ Fetched ${allFeatures.length} total TIGER School Districts for proximity`);
        
        // Process proximity features
        const seenIds = new Set<number>();
        if (results.containing) {
          seenIds.add(results.containing.objectId);
        }
        
        allFeatures.forEach((feature: any) => {
          const attrs = feature.attributes || {};
          const geom = feature.geometry;
          const objectId = attrs.OBJECTID || attrs.objectId || attrs.FID || 0;
          
          // Skip if already in containing result
          if (seenIds.has(objectId)) {
            return;
          }
          seenIds.add(objectId);
          
          if (!geom || !geom.rings || geom.rings.length === 0) {
            return;
          }
          
          // Calculate distance to polygon boundary
          const distance = calculateDistanceToPolygon(lat, lon, geom.rings);
          
          // Filter by actual distance (API returns features within buffer, but we want accurate distance)
          if (distance > maxRadius) {
            return;
          }
          
          results.nearby.push({
            objectId: objectId,
            name: attrs.NAME || attrs.name || attrs.NAMELSAD || attrs.NAMELSAD || null,
            stateFips: attrs.STATEFP || attrs.stateFips || attrs.STATEFP00 || null,
            countyFips: attrs.COUNTYFP || attrs.countyFips || attrs.COUNTYFP00 || null,
            districtCode: attrs.SCHOOLYEAR || attrs.schoolYear || attrs.GEOID || attrs.geoid || null,
            geometry: geom,
            distance_miles: distance,
            attributes: attrs
          });
        });
        
        // Sort by distance
        results.nearby.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
        
        console.log(`✅ TIGER School Districts Layer ${layerId}: Found ${results.nearby.length} nearby districts`);
      } catch (error) {
        console.error(`❌ Proximity query failed for layer ${layerId}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`❌ Error in getTIGERSchoolDistrictsData for layer ${layerId}:`, error);
    return { containing: null, nearby: [] };
  }
}

