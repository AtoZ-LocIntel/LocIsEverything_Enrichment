/**
 * NOAA World Ocean Atlas Water Temperature Adapter
 * Service: https://gis.ngdc.noaa.gov/arcgis/rest/services/climatology/WorldOceanAtlas_WaterTemperature/MapServer
 * Supports proximity queries up to 100 miles for water temperature contour line features
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://gis.ngdc.noaa.gov/arcgis/rest/services/climatology/WorldOceanAtlas_WaterTemperature/MapServer';

export interface NOAOWaterTemperatureFeature {
  objectid: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance from query point
  layerId: number; // Which layer this feature came from (0-11)
  layerName: string; // Human-readable layer name (month)
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
 * Layer names for each month
 */
const LAYER_NAMES: Record<number, string> = {
  0: 'January',
  1: 'February',
  2: 'March',
  3: 'April',
  4: 'May',
  5: 'June',
  6: 'July',
  7: 'August',
  8: 'September',
  9: 'October',
  10: 'November',
  11: 'December'
};

/**
 * Query a specific NOAA Water Temperature layer
 */
async function queryWaterTemperatureLayer(
  layerId: number,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  try {
    const radiusKm = radiusMiles * 1.60934;
    const maxRecordCount = 2000;
    const layerName = LAYER_NAMES[layerId] || `Month ${layerId + 1}`;

    console.log(
      `🌊 NOAA Water Temperature ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
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
          `NOAA Water Temperature ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ NOAA Water Temperature ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances
    const processedFeatures: NOAOWaterTemperatureFeature[] = allFeatures.map(
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
            // Some layers might have rings, treat as polylines
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
      `✅ Processed ${processedFeatures.length} NOAA Water Temperature ${layerName} feature(s) within ${radiusMiles} miles`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ NOAA Water Temperature ${LAYER_NAMES[layerId] || `Layer ${layerId}`} API Error:`, error);
    throw error;
  }
}

/**
 * Query functions for each month
 */
export async function getNOAOWaterTemperatureJanuary(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  return queryWaterTemperatureLayer(0, lat, lon, Math.min(radiusMiles, 100));
}

export async function getNOAOWaterTemperatureFebruary(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  return queryWaterTemperatureLayer(1, lat, lon, Math.min(radiusMiles, 100));
}

export async function getNOAOWaterTemperatureMarch(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  return queryWaterTemperatureLayer(2, lat, lon, Math.min(radiusMiles, 100));
}

export async function getNOAOWaterTemperatureApril(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  return queryWaterTemperatureLayer(3, lat, lon, Math.min(radiusMiles, 100));
}

export async function getNOAOWaterTemperatureMay(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  return queryWaterTemperatureLayer(4, lat, lon, Math.min(radiusMiles, 100));
}

export async function getNOAOWaterTemperatureJune(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  return queryWaterTemperatureLayer(5, lat, lon, Math.min(radiusMiles, 100));
}

export async function getNOAOWaterTemperatureJuly(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  return queryWaterTemperatureLayer(6, lat, lon, Math.min(radiusMiles, 100));
}

export async function getNOAOWaterTemperatureAugust(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  return queryWaterTemperatureLayer(7, lat, lon, Math.min(radiusMiles, 100));
}

export async function getNOAOWaterTemperatureSeptember(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  return queryWaterTemperatureLayer(8, lat, lon, Math.min(radiusMiles, 100));
}

export async function getNOAOWaterTemperatureOctober(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  return queryWaterTemperatureLayer(9, lat, lon, Math.min(radiusMiles, 100));
}

export async function getNOAOWaterTemperatureNovember(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  return queryWaterTemperatureLayer(10, lat, lon, Math.min(radiusMiles, 100));
}

export async function getNOAOWaterTemperatureDecember(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAOWaterTemperatureFeature[]> {
  return queryWaterTemperatureLayer(11, lat, lon, Math.min(radiusMiles, 100));
}

