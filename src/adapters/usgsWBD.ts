/**
 * USGS WBD (Watershed Boundary Dataset) Adapter
 * Service: https://hydrowfs.nationalmap.gov/arcgis/rest/services/wbd/MapServer
 * Supports point-in-polygon (for polygon layers) and proximity queries up to 25 miles
 * WBDLine (layer 0) is a line layer - proximity only, no point-in-polygon
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://hydrowfs.nationalmap.gov/arcgis/rest/services/wbd/MapServer';

export interface USGSWBDFeature {
  objectid: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance from query point (0 if inside polygon)
  isContaining?: boolean; // True if point is within polygon (polygon layers only)
  layerId: number; // Which layer this feature came from (0-8)
  layerName: string; // Human-readable layer name
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  // Use the first ring (exterior ring) for point-in-polygon check
  const ring = rings[0];
  if (!ring || ring.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]; // lon
    const yi = ring[i][1]; // lat
    const xj = ring[j][0]; // lon
    const yj = ring[j][1]; // lat
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate distance from point to nearest point on polygon boundary
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  rings.forEach(ring => {
    if (!ring || ring.length < 2) return;
    
    // Calculate distance to each edge of the polygon
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      
      if (p1.length >= 2 && p2.length >= 2) {
        const lon1 = p1[0];
        const lat1 = p1[1];
        const lon2 = p2[0];
        const lat2 = p2[1];
        
        // Calculate distance from point to line segment
        const distance = distanceToLineSegment(lat, lon, lat1, lon1, lat2, lon2);
        minDistance = Math.min(minDistance, distance);
      }
    }
  });
  
  return minDistance;
}

/**
 * Calculate distance from a point to a line segment
 */
function distanceToLineSegment(
  pointLat: number,
  pointLon: number,
  lineStartLat: number,
  lineStartLon: number,
  lineEndLat: number,
  lineEndLon: number
): number {
  const A = pointLon - lineStartLon;
  const B = pointLat - lineStartLat;
  const C = lineEndLon - lineStartLon;
  const D = lineEndLat - lineStartLat;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = lineStartLon;
    yy = lineStartLat;
  } else if (param > 1) {
    xx = lineEndLon;
    yy = lineEndLat;
  } else {
    xx = lineStartLon + param * C;
    yy = lineStartLat + param * D;
  }

  const dx = pointLon - xx;
  const dy = pointLat - yy;
  return Math.sqrt(dx * dx + dy * dy) * 69; // Convert to miles (rough approximation)
}

/**
 * Calculate distance from a point to the nearest point on a polyline
 */
function distanceToPolyline(
  pointLat: number,
  pointLon: number,
  polylinePaths: number[][][]
): number {
  let minDistance = Infinity;

  for (const path of polylinePaths) {
    for (let i = 0; i < path.length - 1; i++) {
      const segmentStart = path[i];
      const segmentEnd = path[i + 1];

      // Calculate distance to line segment
      const distance = distanceToLineSegment(
        pointLat,
        pointLon,
        segmentStart[1], // lat
        segmentStart[0], // lon
        segmentEnd[1], // lat
        segmentEnd[0] // lon
      );

      minDistance = Math.min(minDistance, distance);
    }
  }

  return minDistance;
}

/**
 * Query a specific USGS WBD layer
 */
async function queryWBDLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number,
  isPolygon: boolean
): Promise<USGSWBDFeature[]> {
  try {
    const radiusKm = radiusMiles * 1.60934;
    const maxRecordCount = 2000;

    console.log(
      `💧 USGS WBD ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
      const queryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
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
      queryUrl.searchParams.set('distance', radiusKm.toString());
      queryUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      const response = await fetchJSONSmart(queryUrl.toString());

      if (response.error) {
        throw new Error(
          `USGS WBD ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ USGS WBD ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances / point-in-polygon
    const processedFeatures: USGSWBDFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || 0;

        let distanceMiles = radiusMiles; // Default to max radius
        let isContaining = false;

        // Check point-in-polygon and calculate distance
        if (geometry) {
          if (isPolygon && geometry.rings && geometry.rings.length > 0) {
            // Polygon geometry - check point-in-polygon
            isContaining = pointInPolygon(lat, lon, geometry.rings);
            if (isContaining) {
              distanceMiles = 0; // Point is inside polygon
            } else {
              distanceMiles = distanceToPolygon(lat, lon, geometry.rings);
            }
          } else if (!isPolygon && geometry.paths && geometry.paths.length > 0) {
            // Polyline geometry (WBDLine) - proximity only
            distanceMiles = distanceToPolyline(lat, lon, geometry.paths);
          }
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          isContaining,
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
      `✅ Processed ${processedFeatures.length} USGS WBD ${layerName} feature(s) within ${radiusMiles} miles${isPolygon ? ` (${processedFeatures.filter(f => f.isContaining).length} containing)` : ''}`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ USGS WBD ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query individual WBD layers (for specific layer queries)
 */
export async function getUSGSWBDLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSWBDFeature[]> {
  return queryWBDLayer(0, 'WBDLine', lat, lon, Math.min(radiusMiles, 25), false);
}

export async function getUSGSWBD2DigitHUData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSWBDFeature[]> {
  return queryWBDLayer(1, '2-digit HU (Region)', lat, lon, Math.min(radiusMiles, 25), true);
}

export async function getUSGSWBD4DigitHUData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSWBDFeature[]> {
  return queryWBDLayer(2, '4-digit HU (Subregion)', lat, lon, Math.min(radiusMiles, 25), true);
}

export async function getUSGSWBD6DigitHUData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSWBDFeature[]> {
  return queryWBDLayer(3, '6-digit HU (Basin)', lat, lon, Math.min(radiusMiles, 25), true);
}

export async function getUSGSWBD8DigitHUData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSWBDFeature[]> {
  return queryWBDLayer(4, '8-digit HU (Subbasin)', lat, lon, Math.min(radiusMiles, 25), true);
}

export async function getUSGSWBD10DigitHUData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSWBDFeature[]> {
  return queryWBDLayer(5, '10-digit HU (Watershed)', lat, lon, Math.min(radiusMiles, 25), true);
}

export async function getUSGSWBD12DigitHUData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSWBDFeature[]> {
  return queryWBDLayer(6, '12-digit HU (Subwatershed)', lat, lon, Math.min(radiusMiles, 25), true);
}

export async function getUSGSWBD14DigitHUData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSWBDFeature[]> {
  return queryWBDLayer(7, '14-digit HU', lat, lon, Math.min(radiusMiles, 25), true);
}

export async function getUSGSWBD16DigitHUData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSWBDFeature[]> {
  return queryWBDLayer(8, '16-digit HU', lat, lon, Math.min(radiusMiles, 25), true);
}





