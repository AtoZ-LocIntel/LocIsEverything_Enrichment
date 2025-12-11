/**
 * TIGER Special Land Use Areas Adapter
 * Queries US Census TIGER Special Land Use Areas MapServer
 * Supports point-in-polygon and proximity queries up to 25 miles
 * API: https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Special_Land_Use_Areas/MapServer
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Special_Land_Use_Areas/MapServer';

export interface TIGERSpecialLandUseInfo {
  objectId: number;
  name?: string | null;
  stateFips?: string | null;
  countyFips?: string | null;
  landUseType?: string | null;
  geometry: any; // ESRI polygon geometry for drawing on map
  distance_miles?: number;
  attributes: Record<string, any>;
}

/**
 * Calculate distance from a point to the nearest point on a polygon boundary
 * ESRI geometry rings are in [lon, lat] format
 */
function calculateDistanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  let minDistance = Infinity;
  
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const p1 = ring[i];
      const p2 = ring[(i + 1) % ring.length]; // Wrap around to first point
      
      // ESRI geometry coordinates are [lon, lat]
      const lat1 = p1[1];
      const lon1 = p1[0];
      const lat2 = p2[1];
      const lon2 = p2[0];
      
      // Calculate distance from point to line segment using geographic coordinates
      const dist = pointToLineSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, dist);
    }
  }
  
  return minDistance;
}

/**
 * Calculate distance from a point to a line segment on a sphere
 * Uses an approximation: samples points along the segment and finds minimum distance
 */
function pointToLineSegmentDistance(
  latP: number, lonP: number,
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  // First, calculate distances to endpoints
  const distToP1 = haversineDistance(latP, lonP, lat1, lon1);
  const distToP2 = haversineDistance(latP, lonP, lat2, lon2);
  
  // If segment is very short, just use minimum distance to endpoints
  const segmentLength = haversineDistance(lat1, lon1, lat2, lon2);
  if (segmentLength < 0.01) { // Less than ~0.6 miles
    return Math.min(distToP1, distToP2);
  }
  
  // Use a simple approximation: sample points along the segment
  // This is more accurate than Euclidean math on geographic coordinates
  const numSamples = Math.max(3, Math.ceil(segmentLength * 10)); // Sample every ~0.1 miles
  let minDist = Math.min(distToP1, distToP2);
  
  for (let i = 1; i < numSamples; i++) {
    const t = i / numSamples;
    // Interpolate lat/lon along the great circle arc (simple linear interpolation)
    const latT = lat1 + t * (lat2 - lat1);
    const lonT = lon1 + t * (lon2 - lon1);
    const dist = haversineDistance(latP, lonP, latT, lonT);
    minDist = Math.min(minDist, dist);
  }
  
  return minDist;
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
 * Query TIGER Special Land Use Areas MapServer for a specific layer
 * Supports both point-in-polygon and proximity queries
 */
export async function getTIGERSpecialLandUseData(
  layerId: number,
  lat: number,
  lon: number,
  radius?: number
): Promise<{ containing: TIGERSpecialLandUseInfo | null; nearby: TIGERSpecialLandUseInfo[] }> {
  try {
    const results: { containing: TIGERSpecialLandUseInfo | null; nearby: TIGERSpecialLandUseInfo[] } = {
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
      
      console.log(`🏛️ Querying TIGER Special Land Use Areas Layer ${layerId} for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 TIGER Special Land Use Areas Point-in-Polygon Query URL: ${pointInPolyUrl.toString()}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl.toString());
      
      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        const feature = pointInPolyData.features[0];
        const attrs = feature.attributes || {};
        const geom = feature.geometry;
        
        if (geom && geom.rings) {
          results.containing = {
            objectId: attrs.OBJECTID || attrs.objectId || attrs.FID || 0,
            name: attrs.NAME || attrs.name || attrs.NAMELSAD || attrs.NAMELSAD || attrs.FULLNAME || attrs.fullName || null,
            stateFips: attrs.STATEFP || attrs.stateFips || attrs.STATEFP00 || null,
            countyFips: attrs.COUNTYFP || attrs.countyFips || attrs.COUNTYFP00 || null,
            landUseType: attrs.LUCODE || attrs.luCode || attrs.TYPE || attrs.type || null,
            geometry: geom,
            distance_miles: 0, // Containing polygon has distance 0
            attributes: attrs
          };
          console.log(`✅ Found containing special land use area: ${results.containing.name || 'Unknown'}`);
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
            console.log(`🏛️ Querying TIGER Special Land Use Areas Layer ${layerId} for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl.toString());
          
          if (proximityData.error) {
            console.error(`❌ TIGER Special Land Use Areas Layer ${layerId} API Error:`, proximityData.error);
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
        
        console.log(`✅ Fetched ${allFeatures.length} total TIGER Special Land Use Areas for proximity`);
        
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
            name: attrs.NAME || attrs.name || attrs.NAMELSAD || attrs.NAMELSAD || attrs.FULLNAME || attrs.fullName || null,
            stateFips: attrs.STATEFP || attrs.stateFips || attrs.STATEFP00 || null,
            countyFips: attrs.COUNTYFP || attrs.countyFips || attrs.COUNTYFP00 || null,
            landUseType: attrs.LUCODE || attrs.luCode || attrs.TYPE || attrs.type || null,
            geometry: geom,
            distance_miles: distance,
            attributes: attrs
          });
        });
        
        // Sort by distance
        results.nearby.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
        
        console.log(`✅ TIGER Special Land Use Areas Layer ${layerId}: Found ${results.nearby.length} nearby areas`);
      } catch (error) {
        console.error(`❌ Proximity query failed for layer ${layerId}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`❌ Error in getTIGERSpecialLandUseData for layer ${layerId}:`, error);
    return { containing: null, nearby: [] };
  }
}

