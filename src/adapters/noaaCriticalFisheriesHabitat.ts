/**
 * NOAA Critical Fisheries Habitat Adapter
 * Service: https://maps.fisheries.noaa.gov/server/rest/services/All_Critical_Habitat/MapServer/229
 * Supports point-in-polygon and proximity queries up to 100 miles
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://maps.fisheries.noaa.gov/server/rest/services/All_Critical_Habitat/MapServer';
const LAYER_ID = 229;

export interface NOAACriticalFisheriesHabitatInfo {
  objectid: number | null;
  geometry?: any; // ESRI polygon geometry (rings)
  distance_miles?: number;
  isContaining?: boolean;
  attributes: Record<string, any>;
}

/**
 * Calculate distance from point to polygon (minimum distance to any vertex or edge)
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  rings.forEach((ring: number[][]) => {
    // Check distance to each vertex
    ring.forEach((coord: number[]) => {
      // ESRI coordinates are [lon, lat] format
      const ringLat = coord[1];
      const ringLon = coord[0];
      
      const R = 3959; // Earth's radius in miles
      const dLat = (ringLat - lat) * Math.PI / 180;
      const dLon = (ringLon - lon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(ringLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      if (distance < minDistance) minDistance = distance;
    });
    
    // Check distance to each edge
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
      if (dist < minDistance) minDistance = dist;
    }
  });
  
  return minDistance;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(
  lat: number, lon: number,
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const A = lon - lon1;
  const B = lat - lat1;
  const C = lon2 - lon1;
  const D = lat2 - lat1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx, yy;
  if (param < 0) {
    xx = lon1;
    yy = lat1;
  } else if (param > 1) {
    xx = lon2;
    yy = lat2;
  } else {
    xx = lon1 + param * C;
    yy = lat1 + param * D;
  }
  const R = 3959; // Earth's radius in miles
  const dLat = (yy - lat) * Math.PI / 180;
  const dLon = (xx - lon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(yy * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Point-in-polygon check using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  const outerRing = rings[0];
  if (!outerRing || outerRing.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0]; // lon
    const yi = outerRing[i][1]; // lat
    const xj = outerRing[j][0]; // lon
    const yj = outerRing[j][1]; // lat
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  // Check if point is in any holes
  for (let h = 1; h < rings.length; h++) {
    const hole = rings[h];
    if (!hole || hole.length < 3) continue;
    
    let inHole = false;
    for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
      const xi = hole[i][0];
      const yi = hole[i][1];
      const xj = hole[j][0];
      const yj = hole[j][1];
      
      const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inHole = !inHole;
    }
    
    if (inHole) {
      inside = false; // Point is in a hole, so not inside polygon
      break;
    }
  }
  
  return inside;
}

/**
 * Query NOAA Critical Fisheries Habitat for point-in-polygon and proximity
 * Supports proximity queries up to 100 miles
 */
export async function getNOAACriticalFisheriesHabitatData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<NOAACriticalFisheriesHabitatInfo[]> {
  try {
    const radiusKm = (radiusMiles || 100) * 1.60934;
    const maxRecordCount = 2000;

    console.log(
      `🐟 Querying NOAA Critical Fisheries Habitat (Layer ${LAYER_ID}) for coordinates [${lat}, ${lon}] within ${radiusMiles || 100} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    // First, check for point-in-polygon (containing features)
    const pointInPolygonUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    pointInPolygonUrl.searchParams.set('f', 'json');
    pointInPolygonUrl.searchParams.set('where', '1=1');
    pointInPolygonUrl.searchParams.set('outFields', '*');
    pointInPolygonUrl.searchParams.set('geometry', JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }));
    pointInPolygonUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    pointInPolygonUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    pointInPolygonUrl.searchParams.set('inSR', '4326');
    pointInPolygonUrl.searchParams.set('outSR', '4326');
    pointInPolygonUrl.searchParams.set('returnGeometry', 'true');
    pointInPolygonUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());

    const pointInPolygonResponse = await fetchJSONSmart(pointInPolygonUrl.toString());
    
    if (pointInPolygonResponse.error) {
      console.warn(`⚠️ NOAA Critical Fisheries Habitat point-in-polygon query error: ${JSON.stringify(pointInPolygonResponse.error)}`);
    } else {
      const containingFeatures = pointInPolygonResponse.features || [];
      allFeatures = allFeatures.concat(containingFeatures.map((f: any) => ({ ...f, _isContaining: true })));
    }

    // Then, query for proximity features if radius is specified
    if (radiusMiles && radiusMiles > 0) {
      while (hasMore) {
        const proximityUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
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
        proximityUrl.searchParams.set('distance', radiusKm.toString());
        proximityUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
        proximityUrl.searchParams.set('inSR', '4326');
        proximityUrl.searchParams.set('outSR', '4326');
        proximityUrl.searchParams.set('returnGeometry', 'true');
        proximityUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
        proximityUrl.searchParams.set('resultOffset', resultOffset.toString());

        const proximityResponse = await fetchJSONSmart(proximityUrl.toString());

        if (proximityResponse.error) {
          console.warn(`⚠️ NOAA Critical Fisheries Habitat proximity query error: ${JSON.stringify(proximityResponse.error)}`);
          hasMore = false;
        } else {
          const batchFeatures = proximityResponse.features || [];
          
          // Filter out duplicates (features already found in point-in-polygon query)
          const existingObjectIds = new Set(allFeatures.map((f: any) => f.attributes?.OBJECTID || f.attributes?.objectid || f.OBJECTID || f.objectid));
          const newFeatures = batchFeatures.filter((f: any) => {
            const objectId = f.attributes?.OBJECTID || f.attributes?.objectid || f.OBJECTID || f.objectid;
            return !existingObjectIds.has(objectId);
          });
          
          allFeatures = allFeatures.concat(newFeatures);
          hasMore = batchFeatures.length === maxRecordCount || proximityResponse.exceededTransferLimit === true;
          resultOffset += batchFeatures.length;

          if (resultOffset > 100000) {
            console.warn(`⚠️ NOAA Critical Fisheries Habitat: Stopping pagination at 100k records for safety`);
            hasMore = false;
          }

          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
    }

    // Process features and calculate distances and point-in-polygon
    const processedFeatures: NOAACriticalFisheriesHabitatInfo[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || 0;
        const isContaining = feature._isContaining || false;

        let distanceMiles = 0; // Default for containing features

        // Calculate distance to polygon if not containing
        if (geometry && geometry.rings && geometry.rings.length > 0) {
          if (isContaining) {
            distanceMiles = 0; // Point is inside polygon
          } else {
            // Verify point-in-polygon (server might return features that don't actually contain)
            const actuallyContaining = pointInPolygon(lat, lon, geometry.rings);
            if (actuallyContaining) {
              distanceMiles = 0;
            } else {
              distanceMiles = distanceToPolygon(lat, lon, geometry.rings);
            }
          }
        } else if (!isContaining && radiusMiles) {
          distanceMiles = radiusMiles; // Default to max radius if no geometry
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          isContaining: isContaining || distanceMiles === 0,
        };
      }
    );

    // Sort by containing first, then by distance
    processedFeatures.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${processedFeatures.length} NOAA Critical Fisheries Habitat feature(s) (${processedFeatures.filter(f => f.isContaining).length} containing, ${processedFeatures.filter(f => !f.isContaining).length} nearby)`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ NOAA Critical Fisheries Habitat API Error:`, error);
    throw error;
  }
}

