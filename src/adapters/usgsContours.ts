/**
 * USGS Contours Adapter
 * Service: https://cartowfs.nationalmap.gov/arcgis/rest/services/contours/MapServer
 * Supports proximity queries up to 25 miles for contour line features
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://cartowfs.nationalmap.gov/arcgis/rest/services/contours/MapServer';

export interface USGSContoursFeature {
  objectid: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance from query point
  layerId: number; // Which layer this feature came from (0-5)
  layerName: string; // Human-readable layer name
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
 * Query a specific USGS Contours layer
 */
async function queryContoursLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSContoursFeature[]> {
  try {
    const radiusKm = radiusMiles * 1.60934;
    const maxRecordCount = 2000;

    console.log(
      `⛰️ USGS Contours ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
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
          `USGS Contours ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ USGS Contours ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances
    const processedFeatures: USGSContoursFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || 0;

        let distanceMiles = radiusMiles; // Default to max radius

        // Calculate distance to polyline
        if (geometry) {
          if (geometry.paths && geometry.paths.length > 0) {
            distanceMiles = distanceToPolyline(lat, lon, geometry.paths);
          } else if (geometry.rings && geometry.rings.length > 0) {
            // Some contour layers might have rings (polygons), treat as polylines
            distanceMiles = distanceToPolyline(lat, lon, geometry.rings);
          }
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          layerId,
          layerName,
        };
      }
    );

    // Sort by distance
    processedFeatures.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${processedFeatures.length} USGS Contours ${layerName} feature(s) within ${radiusMiles} miles`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ USGS Contours ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query individual Contour layers
 */
export async function getUSGSContours100FootData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSContoursFeature[]> {
  return queryContoursLayer(0, 'Contours US 100 Foot', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSContours100FootLinesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSContoursFeature[]> {
  return queryContoursLayer(1, 'Contours US 100 Foot Lines', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSContours50FootData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSContoursFeature[]> {
  return queryContoursLayer(2, 'Contours US 50 Foot', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSContours50FootLinesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSContoursFeature[]> {
  return queryContoursLayer(3, 'Contours US 50 Foot Lines', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSContoursLargeScaleData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSContoursFeature[]> {
  return queryContoursLayer(4, 'Contours - Large Scale', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSContoursLargeScaleLinesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSContoursFeature[]> {
  return queryContoursLayer(5, 'Contours Lines - Large Scale', lat, lon, Math.min(radiusMiles, 25));
}




