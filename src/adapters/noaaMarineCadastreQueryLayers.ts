/**
 * NOAA Marine Cadastre — additional MapServer query layers (points & polygons).
 * @see https://coast.noaa.gov/arcgis/rest/services/MarineCadastre
 */

const MARINE_CADASTRE_BASE = 'https://coast.noaa.gov/arcgis/rest/services/MarineCadastre';

export const NOAA_MARINE_CADASTRE_QUERY_MAX_RADIUS_MILES = 100;
/** Proximity search cap for Coastal Wetlands (layer is coastal-scale; 2 mi buffer matches product UX). */
export const NOAA_MARINE_COASTAL_WETLANDS_MAX_RADIUS_MILES = 2;
const BATCH_SIZE = 2000;

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Five Marine Cadastre query layers (distinct from `noaa_marine_place_names`). */
export const MARINE_CADASTRE_QUERY_LAYERS = {
  noaa_marine_undersea_feature_place_names: {
    serviceFolder: 'UnderseaFeaturePlaceNames',
    layerId: 0,
    kind: 'point' as const,
    shortLabel: 'Undersea Feature Place Names',
  },
  noaa_marine_seagrasses: {
    serviceFolder: 'Seagrasses',
    layerId: 0,
    kind: 'polygon' as const,
    shortLabel: 'Seagrasses',
  },
  noaa_marine_coastal_wetlands: {
    serviceFolder: 'CoastalWetlands',
    layerId: 0,
    kind: 'polygon' as const,
    shortLabel: 'Coastal Wetlands',
  },
  noaa_marine_us_state_submerged_lands: {
    serviceFolder: 'USStateSubmergedLands',
    layerId: 0,
    kind: 'polygon' as const,
    shortLabel: 'US State Submerged Lands',
  },
  noaa_marine_ioos_regions: {
    serviceFolder: 'IOOSRegions',
    layerId: 0,
    kind: 'polygon' as const,
    shortLabel: 'IOOS Regions',
  },
} as const;

export type MarineCadastreQueryLayerId = keyof typeof MARINE_CADASTRE_QUERY_LAYERS;

export interface MarineCadastreQueryFeature {
  objectid: number | null;
  lat: number | null;
  lon: number | null;
  distance_miles: number;
  attributes: Record<string, unknown>;
  geometry: unknown;
  isContaining?: boolean;
}

function coordsFromPointFeature(f: {
  geometry?: { x?: number; y?: number };
  attributes?: Record<string, unknown>;
}): { lat: number; lon: number } | null {
  const attrs = f.attributes || {};
  const alat = attrs.LATITUDE ?? attrs.latitude ?? attrs.lat;
  const alon = attrs.LONGITUDE ?? attrs.longitude ?? attrs.lon;
  if (typeof alat === 'number' && typeof alon === 'number' && Number.isFinite(alat) && Number.isFinite(alon)) {
    return { lat: alat, lon: alon };
  }
  const gx = f.geometry?.x;
  const gy = f.geometry?.y;
  if (typeof gx === 'number' && typeof gy === 'number' && Number.isFinite(gx) && Number.isFinite(gy)) {
    return { lat: gy, lon: gx };
  }
  return null;
}

function ringCentroid(ring: number[][]): { lat: number; lon: number } | null {
  if (!ring?.length) return null;
  let sumX = 0;
  let sumY = 0;
  let n = 0;
  for (const coord of ring) {
    if (coord.length >= 2) {
      sumX += coord[0];
      sumY += coord[1];
      n++;
    }
  }
  if (n === 0) return null;
  return { lon: sumX / n, lat: sumY / n };
}

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  if (!ring?.length) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      (yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-15) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function displayMarineCadastreQueryLabel(attrs: Record<string, unknown>): string {
  const candidates = [
    attrs.name,
    attrs.NAME,
    attrs.Name,
    attrs.NWIClass,
    attrs.bioticClass,
    attrs.bioticCommunity,
    attrs.region,
    attrs.REGION,
    attrs.Region,
    attrs.stateUSPS,
    attrs.aquaticSetting,
    attrs.PlaceName,
  ];
  for (const c of candidates) {
    if (c != null && String(c).trim() !== '') return String(c).trim();
  }
  const oid = attrs.OBJECTID ?? attrs.objectid;
  if (oid != null) return `Feature ${oid}`;
  return '';
}

function serviceUrl(folder: string, layerId: number): string {
  return `${MARINE_CADASTRE_BASE}/${folder}/MapServer/${layerId}`;
}

/**
 * Query a Marine Cadastre feature layer within a buffer (WGS84).
 */
export async function queryMarineCadastreLayerById(
  enrichmentId: MarineCadastreQueryLayerId,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<MarineCadastreQueryFeature[]> {
  const cfg = MARINE_CADASTRE_QUERY_LAYERS[enrichmentId];
  const layerMax =
    (cfg as { maxRadiusMiles?: number }).maxRadiusMiles ?? NOAA_MARINE_CADASTRE_QUERY_MAX_RADIUS_MILES;
  const capped = Math.min(Math.max(radiusMiles, 0), layerMax);
  if (capped <= 0) return [];

  const radiusMeters = capped * 1609.34;
  const pointGeometry = { x: lon, y: lat, spatialReference: { wkid: 4326 } };
  const geometryStr = encodeURIComponent(JSON.stringify(pointGeometry));
  const base = serviceUrl(cfg.serviceFolder, cfg.layerId);

  const collected: MarineCadastreQueryFeature[] = [];
  let resultOffset = 0;
  let hasMore = true;
  const { fetchJSONSmart } = await import('../services/EnrichmentService');

  while (hasMore) {
    const url = `${base}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${BATCH_SIZE}&resultOffset=${resultOffset}`;

    const data = (await fetchJSONSmart(url)) as {
      error?: unknown;
      features?: Array<{
        attributes?: Record<string, unknown>;
        geometry?: {
          x?: number;
          y?: number;
          rings?: number[][][];
          paths?: number[][][];
        };
      }>;
      exceededTransferLimit?: boolean;
    };

    if (data.error || !data.features?.length) {
      hasMore = false;
      break;
    }

    for (const f of data.features) {
      const attrs = f.attributes || {};
      const oid = Number(attrs.OBJECTID ?? attrs.objectid ?? attrs.FID);
      const geom = f.geometry;

      if (cfg.kind === 'point') {
        const cc = coordsFromPointFeature(f);
        if (!cc) continue;
        const distance_miles = Number(haversineMiles(lat, lon, cc.lat, cc.lon).toFixed(4));
        if (distance_miles > capped + 1e-5) continue;
        collected.push({
          objectid: Number.isFinite(oid) ? oid : collected.length,
          lat: cc.lat,
          lon: cc.lon,
          distance_miles,
          attributes: attrs,
          geometry:
            typeof geom?.x === 'number' && typeof geom?.y === 'number'
              ? { x: geom.x, y: geom.y, spatialReference: { wkid: 4326 } }
              : null,
        });
        continue;
      }

      // polygon
      const rings = geom?.rings;
      if (!rings?.length) continue;
      const outer = rings[0];
      const centroid = ringCentroid(outer);
      if (!centroid) continue;

      const isContaining = pointInRing(lon, lat, outer);
      const distance_miles = isContaining
        ? 0
        : Number(haversineMiles(lat, lon, centroid.lat, centroid.lon).toFixed(4));
      if (!isContaining && distance_miles > capped + 1e-5) continue;

      collected.push({
        objectid: Number.isFinite(oid) ? oid : collected.length,
        lat: centroid.lat,
        lon: centroid.lon,
        distance_miles,
        attributes: attrs,
        geometry: geom,
        isContaining,
      });
    }

    if (data.exceededTransferLimit === true || data.features.length === BATCH_SIZE) {
      resultOffset += BATCH_SIZE;
      await new Promise((r) => setTimeout(r, 80));
    } else {
      hasMore = false;
    }
  }

  collected.sort((a, b) => a.distance_miles - b.distance_miles);
  return collected;
}
