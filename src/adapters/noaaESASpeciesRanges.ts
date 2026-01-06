/**
 * NOAA ESA Species Ranges Adapter
 * Service: https://maps.fisheries.noaa.gov/server/rest/services/WCR/ESA_Species_Ranges/MapServer
 * Supports point-in-polygon and proximity queries up to 100 miles
 * Contains multiple layers for Salmon and Steelhead ESA-listed species ranges
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://maps.fisheries.noaa.gov/server/rest/services/WCR/ESA_Species_Ranges/MapServer';

export interface NOAAESASpeciesRangesInfo {
  objectid: number | null;
  geometry?: any; // ESRI polygon geometry (rings)
  distance_miles?: number;
  isContaining?: boolean;
  layerId: number; // Which layer this feature came from
  layerName: string; // Human-readable layer name
  attributes: Record<string, any>;
}

/**
 * Layer names mapping
 */
const LAYER_NAMES: Record<number, string> = {
  0: 'Salmon',
  1: 'Salmon, chum (Hood Canal summer-run ESU)',
  2: 'Salmon, chum (Hood Canal summer-run ESU) - access overlay',
  3: 'Salmon, chum (Hood Canal summer-run ESU)',
  4: 'Salmon, chum (Hood Canal summer-run ESU) - populations',
  5: 'Salmon, chum (Columbia River ESU)',
  6: 'Salmon, chum (Columbia River ESU) - access overlay',
  7: 'Salmon, chum (Columbia River ESU)',
  8: 'Salmon, chum (Columbia River ESU) - populations',
  9: 'Salmon, coho (Lower Columbia River ESU)',
  10: 'Salmon, coho (Lower Columbia River ESU) - access overlay',
  11: 'Salmon, coho (Lower Columbia River ESU)',
  12: 'Salmon, coho (Lower Columbia River ESU) - populations',
  13: 'Salmon, coho (Oregon Coast ESU)',
  14: 'Salmon, coho (Oregon Coast ESU) - access overlay',
  15: 'Salmon, coho (Oregon Coast ESU)',
  16: 'Salmon, coho (Oregon Coast ESU) - populations',
  82: 'Salmon, coho (Southern Oregon/Northern California Coast ESU)',
  83: 'Salmon, coho (Southern Oregon/Northern California Coast ESU) - access overlay',
  84: 'Salmon, coho (Southern Oregon/Northern California Coast ESU)',
  85: 'Salmon, coho (Central California Coast ESU)',
  86: 'Salmon, coho (Central California Coast ESU) - access overlay',
  87: 'Salmon, coho (Central California Coast ESU)',
  17: 'Salmon, sockeye (Ozette Lake ESU)',
  18: 'Salmon, sockeye (Ozette Lake ESU) - access overlay',
  19: 'Salmon, sockeye (Ozette Lake ESU)',
  20: 'Salmon, sockeye (Ozette Lake ESU) - population',
  21: 'Salmon, sockeye (Snake River ESU)',
  22: 'Salmon, sockeye (Snake River ESU) - access overlay',
  23: 'Salmon, sockeye (Snake River ESU)',
  24: 'Salmon, sockeye (Snake River ESU) - populations',
  25: 'Salmon, Chinook (Puget Sound ESU)',
  26: 'Salmon, Chinook (Puget Sound ESU) - access overlay',
  27: 'Salmon, Chinook (Puget Sound ESU)',
  28: 'Salmon, Chinook (Puget Sound ESU) - populations',
  29: 'Salmon, Chinook (Upper Columbia River spring-run ESU)',
  30: 'Salmon, Chinook (Upper Columbia River spring-run ESU) - access overlay',
  31: 'Salmon, Chinook (Upper Columbia River spring-run ESU)',
  32: 'Salmon, Chinook (Upper Columbia River spring-run ESU) - populations',
  33: 'Salmon, Chinook (Upper Columbia River spring-run ESU-XN)',
  34: 'Salmon, Chinook (Upper Columbia River spring-run ESU-XN) - access overlay',
  35: 'Salmon, Chinook (Upper Columbia River spring-run ESU-XN)',
  36: 'Salmon, Chinook (Upper Columbia River spring-run ESU-XN) - reintroduced population',
  37: 'Salmon, Chinook (Lower Columbia River ESU)',
  38: 'Salmon, Chinook (Lower Columbia River ESU) - access overlay',
  39: 'Salmon, Chinook (Lower Columbia River ESU)',
  40: 'Salmon, Chinook (Lower Columbia River ESU) - populations',
  41: 'Salmon, Chinook (Upper Willamette River ESU)',
  42: 'Salmon, Chinook (Upper Willamette River ESU) - access overlay',
  43: 'Salmon, Chinook (Upper Willamette River ESU)',
  44: 'Salmon, Chinook (Upper Willamette River ESU) - populations',
  45: 'Salmon, Chinook (Snake River spring/summer-run ESU)',
  46: 'Salmon, Chinook (Snake River spring/summer-run ESU) - access overlay',
  47: 'Salmon, Chinook (Snake River spring/summer-run ESU)',
  48: 'Salmon, Chinook (Snake River spring/summer-run ESU) - populations',
  49: 'Salmon, Chinook (Snake River fall-run ESU)',
  50: 'Salmon, Chinook (Snake River fall-run ESU) - access overlay',
  51: 'Salmon, Chinook (Snake River fall-run ESU)',
  52: 'Salmon, Chinook (Snake River fall-run ESU) - populations',
  88: 'Salmon, Chinook (California Coastal ESU)',
  89: 'Salmon, Chinook (California Coastal ESU) - access overlay',
  90: 'Salmon, Chinook (California Coastal ESU)',
  91: 'Salmon, Chinook (Sacramento River winter-run ESU)',
  92: 'Salmon, Chinook (Sacramento River winter-run ESU) - access overlay',
  93: 'Salmon, Chinook (Sacramento River winter-run ESU)',
  94: 'Salmon, Chinook (Central Valley spring-run ESU)',
  95: 'Salmon, Chinook (Central Valley spring-run ESU) - access overlay',
  96: 'Salmon, Chinook (Central Valley spring-run ESU)',
  53: 'Steelhead',
  54: 'Steelhead (Puget Sound DPS)',
  55: 'Steelhead (Puget Sound DPS) - access overlay',
  56: 'Steelhead (Puget Sound DPS)',
  57: 'Steelhead (Puget Sound DPS) - populations',
  58: 'Steelhead (Upper Columbia River DPS)',
  59: 'Steelhead (Upper Columbia River DPS) - access overlay',
  60: 'Steelhead (Upper Columbia River DPS)',
  61: 'Steelhead (Upper Columbia River DPS) - populations',
  62: 'Steelhead (Middle Columbia River DPS)',
  63: 'Steelhead (Middle Columbia River DPS) - access overlay',
  64: 'Steelhead (Middle Columbia River DPS)',
  65: 'Steelhead (Middle Columbia River DPS) - populations',
  66: 'Steelhead (Middle Columbia River DPS-XN)',
  67: 'Steelhead (Middle Columbia River DPS-XN) - access overlay',
  68: 'Steelhead (Middle Columbia River DPS-XN)',
  69: 'Steelhead (Middle Columbia River DPS-XN) - reintroduced population',
  70: 'Steelhead (Lower Columbia River DPS)',
  71: 'Steelhead (Lower Columbia River DPS) - access overlay',
  72: 'Steelhead (Lower Columbia River DPS)',
  73: 'Steelhead (Lower Columbia River DPS) - populations',
  74: 'Steelhead (Snake River Basin DPS)',
  75: 'Steelhead (Snake River Basin DPS) - access overlay',
  76: 'Steelhead (Snake River Basin DPS)',
  77: 'Steelhead (Snake River Basin DPS) - populations',
  78: 'Steelhead (Upper Willamette River DPS)',
  79: 'Steelhead (Upper Willamette River DPS) - access overlay',
  80: 'Steelhead (Upper Willamette River DPS)',
  81: 'Steelhead (Upper Willamette River DPS) - populations',
  97: 'Steelhead (Northern California DPS)',
  98: 'Steelhead (Northern California DPS) - access overlay',
  99: 'Steelhead (Northern California DPS)',
  100: 'Steelhead (Central California Coast DPS)',
  101: 'Steelhead (Central California Coast DPS) - access overlay',
  102: 'Steelhead (Central California Coast DPS)',
  103: 'Steelhead (California Central Valley DPS)',
  104: 'Steelhead (California Central Valley DPS) - access overlay',
  105: 'Steelhead (California Central Valley DPS)',
  106: 'Steelhead (South-Central California Coast DPS)',
  107: 'Steelhead (South-Central California Coast DPS) - access overlay',
  108: 'Steelhead (South-Central California Coast DPS)',
  109: 'Steelhead (Southern California DPS)',
  110: 'Steelhead (Southern California DPS) - access overlay',
  111: 'Steelhead (Southern California DPS)',
};

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
 * Query NOAA ESA Species Ranges layer for point-in-polygon and proximity
 * Supports proximity queries up to 100 miles
 */
export async function queryESASpeciesRangesLayer(
  layerId: number,
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<NOAAESASpeciesRangesInfo[]> {
  try {
    const radiusKm = (radiusMiles || 100) * 1.60934;
    const maxRecordCount = 2000;
    const layerName = LAYER_NAMES[layerId] || `Layer ${layerId}`;

    console.log(
      `🐟 Querying NOAA ESA Species Ranges ${layerName} (Layer ${layerId}) for coordinates [${lat}, ${lon}] within ${radiusMiles || 100} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    // First, check for point-in-polygon (containing features)
    const pointInPolygonUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
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
      console.warn(`⚠️ NOAA ESA Species Ranges ${layerName} point-in-polygon query error: ${JSON.stringify(pointInPolygonResponse.error)}`);
    } else {
      const containingFeatures = pointInPolygonResponse.features || [];
      allFeatures = allFeatures.concat(containingFeatures.map((f: any) => ({ ...f, _isContaining: true })));
    }

    // Then, query for proximity features if radius is specified
    if (radiusMiles && radiusMiles > 0) {
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
        proximityUrl.searchParams.set('distance', radiusKm.toString());
        proximityUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
        proximityUrl.searchParams.set('inSR', '4326');
        proximityUrl.searchParams.set('outSR', '4326');
        proximityUrl.searchParams.set('returnGeometry', 'true');
        proximityUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
        proximityUrl.searchParams.set('resultOffset', resultOffset.toString());

        const proximityResponse = await fetchJSONSmart(proximityUrl.toString());

        if (proximityResponse.error) {
          console.warn(`⚠️ NOAA ESA Species Ranges ${layerName} proximity query error: ${JSON.stringify(proximityResponse.error)}`);
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
            console.warn(`⚠️ NOAA ESA Species Ranges ${layerName}: Stopping pagination at 100k records for safety`);
            hasMore = false;
          }

          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
    }

    // Process features and calculate distances and point-in-polygon
    const processedFeatures: NOAAESASpeciesRangesInfo[] = allFeatures.map(
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
          layerId,
          layerName,
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
      `✅ Processed ${processedFeatures.length} NOAA ESA Species Ranges ${layerName} feature(s) (${processedFeatures.filter(f => f.isContaining).length} containing, ${processedFeatures.filter(f => !f.isContaining).length} nearby)`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ NOAA ESA Species Ranges ${LAYER_NAMES[layerId] || `Layer ${layerId}`} API Error:`, error);
    throw error;
  }
}

// Export individual query functions for each layer
export const getNOAAESASpeciesRangesLayer0 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(0, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer1 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(1, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer2 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(2, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer3 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(3, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer4 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(4, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer5 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(5, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer6 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(6, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer7 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(7, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer8 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(8, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer9 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(9, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer10 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(10, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer11 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(11, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer12 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(12, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer13 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(13, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer14 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(14, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer15 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(15, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer16 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(16, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer17 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(17, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer18 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(18, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer19 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(19, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer20 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(20, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer21 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(21, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer22 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(22, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer23 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(23, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer24 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(24, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer25 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(25, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer26 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(26, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer27 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(27, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer28 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(28, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer29 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(29, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer30 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(30, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer31 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(31, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer32 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(32, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer33 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(33, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer34 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(34, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer35 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(35, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer36 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(36, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer37 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(37, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer38 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(38, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer39 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(39, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer40 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(40, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer41 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(41, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer42 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(42, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer43 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(43, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer44 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(44, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer45 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(45, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer46 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(46, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer47 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(47, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer48 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(48, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer49 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(49, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer50 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(50, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer51 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(51, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer52 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(52, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer53 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(53, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer54 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(54, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer55 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(55, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer56 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(56, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer57 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(57, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer58 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(58, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer59 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(59, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer60 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(60, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer61 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(61, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer62 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(62, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer63 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(63, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer64 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(64, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer65 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(65, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer66 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(66, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer67 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(67, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer68 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(68, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer69 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(69, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer70 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(70, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer71 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(71, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer72 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(72, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer73 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(73, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer74 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(74, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer75 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(75, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer76 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(76, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer77 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(77, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer78 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(78, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer79 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(79, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer80 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(80, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer81 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(81, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer82 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(82, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer83 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(83, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer84 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(84, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer85 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(85, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer86 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(86, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer87 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(87, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer88 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(88, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer89 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(89, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer90 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(90, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer91 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(91, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer92 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(92, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer93 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(93, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer94 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(94, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer95 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(95, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer96 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(96, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer97 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(97, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer98 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(98, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer99 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(99, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer100 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(100, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer101 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(101, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer102 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(102, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer103 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(103, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer104 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(104, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer105 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(105, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer106 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(106, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer107 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(107, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer108 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(108, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer109 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(109, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer110 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(110, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAAESASpeciesRangesLayer111 = (lat: number, lon: number, radiusMiles?: number) => queryESASpeciesRangesLayer(111, lat, lon, Math.min(radiusMiles || 100, 100));

