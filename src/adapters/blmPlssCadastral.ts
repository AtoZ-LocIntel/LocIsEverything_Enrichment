/**
 * BLM National PLSS CadNSDI (Public Land Survey System) — MapServer query adapter.
 * Service: https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer
 * Layers: 1 PLSS Township, 2 PLSS Section, 3 PLSS Intersected
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

export const BLM_PLSS_MAPSERVER_URL =
  'https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer';

const MAX_RADIUS_MILES = 100;

export interface BlmPlssFeature {
  objectid: number;
  attributes: Record<string, any>;
  geometry?: any;
  distance_miles?: number;
  isContaining?: boolean;
  layerId: number;
  layerName: string;
}

function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  const ring = rings[0];
  if (!ring || ring.length < 3) return false;

  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      (yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;

  let minDistance = Infinity;
  rings.forEach((ring) => {
    if (!ring || ring.length < 2) return;
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      if (p1.length >= 2 && p2.length >= 2) {
        const lon1 = p1[0];
        const lat1 = p1[1];
        const lon2 = p2[0];
        const lat2 = p2[1];
        const distance = distanceToLineSegment(lat, lon, lat1, lon1, lat2, lon2);
        minDistance = Math.min(minDistance, distance);
      }
    }
  });

  return minDistance;
}

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
  return Math.sqrt(dx * dx + dy * dy) * 69;
}

async function queryBlmPlssLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BlmPlssFeature[]> {
  const effectiveRadius = Math.min(Math.max(radiusMiles, 0), MAX_RADIUS_MILES);
  const radiusKm = effectiveRadius * 1.60934;
  const maxRecordCount = 2000;

  console.log(
    `📍 BLM PLSS ${layerName} (layer ${layerId}) query [${lat}, ${lon}] within ${effectiveRadius} mi`
  );

  let allFeatures: any[] = [];
  let resultOffset = 0;
  let hasMore = true;

  while (hasMore) {
    const queryUrl = new URL(`${BLM_PLSS_MAPSERVER_URL}/${layerId}/query`);
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set(
      'geometry',
      JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 },
      })
    );
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', radiusKm.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    // Densify true curves to standard rings so clients can render without curve support
    queryUrl.searchParams.set('returnTrueCurves', 'false');
    queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
    queryUrl.searchParams.set('resultOffset', resultOffset.toString());

    const response = await fetchJSONSmart(queryUrl.toString());

    if (response.error) {
      throw new Error(`BLM PLSS ${layerName} API error: ${JSON.stringify(response.error)}`);
    }

    const batchFeatures = response.features || [];
    allFeatures = allFeatures.concat(batchFeatures);

    hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
    resultOffset += batchFeatures.length;

    if (resultOffset > 100000) {
      console.warn(`⚠️ BLM PLSS ${layerName}: stopping pagination at 100k records`);
      hasMore = false;
    }

    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const processedFeatures: BlmPlssFeature[] = allFeatures.map((feature: any) => {
    const attributes = feature.attributes || {};
    const geometry = feature.geometry;
    const objectid =
      attributes.OBJECTID || attributes.objectid || attributes.FID || attributes.fid || 0;

    let distanceMiles = effectiveRadius;
    let isContaining = false;

    if (geometry && geometry.rings && geometry.rings.length > 0) {
      isContaining = pointInPolygon(lat, lon, geometry.rings);
      if (isContaining) {
        distanceMiles = 0;
      } else {
        distanceMiles = distanceToPolygon(lat, lon, geometry.rings);
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
  });

  processedFeatures.sort((a, b) => {
    if (a.isContaining && !b.isContaining) return -1;
    if (!a.isContaining && b.isContaining) return 1;
    const distA = a.distance_miles ?? Infinity;
    const distB = b.distance_miles ?? Infinity;
    return distA - distB;
  });

  console.log(
    `✅ BLM PLSS ${layerName}: ${processedFeatures.length} feature(s) (${processedFeatures.filter((f) => f.isContaining).length} containing)`
  );

  return processedFeatures;
}

export async function getBlmPlssTownshipData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BlmPlssFeature[]> {
  return queryBlmPlssLayer(1, 'PLSS Township', lat, lon, radiusMiles);
}

export async function getBlmPlssSectionData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BlmPlssFeature[]> {
  return queryBlmPlssLayer(2, 'PLSS Section', lat, lon, radiusMiles);
}

export async function getBlmPlssIntersectedData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BlmPlssFeature[]> {
  return queryBlmPlssLayer(3, 'PLSS Intersected', lat, lon, radiusMiles);
}
