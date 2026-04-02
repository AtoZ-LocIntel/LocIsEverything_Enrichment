/**
 * NOAA OCM County Snapshots — Critical Facilities (10 ft SLR) MapServer layers (MultiPoint).
 * @see https://coast.noaa.gov/arcgis/rest/services/CountySnapshots/CriticalFacilities_10ftSLR/MapServer
 */

const SERVICE_BASE =
  'https://coast.noaa.gov/arcgis/rest/services/CountySnapshots/CriticalFacilities_10ftSLR/MapServer';

export const NOAA_COUNTY_SNAPSHOTS_SLR10FT_MAX_RADIUS_MILES = 100;
const BATCH_SIZE = 1000;

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

/** Cheap reject before Haversine (national multipoints can have 10⁴–10⁵+ vertices per feature). */
function withinRoughMiles(
  lat0: number,
  lon0: number,
  lat1: number,
  lon1: number,
  radiusMiles: number
): boolean {
  const milesPerDegLat = 69;
  const cosLat = Math.cos((lat0 * Math.PI) / 180);
  const dy = Math.abs(lat1 - lat0) * milesPerDegLat;
  const dx = Math.abs(lon1 - lon0) * milesPerDegLat * Math.max(0.2, Math.abs(cosLat));
  const slack = radiusMiles * 1.08 + 2;
  return dx * dx + dy * dy <= slack * slack;
}

export const COUNTY_SNAPSHOTS_SLR10FT_LAYERS = {
  noaa_county_snapshots_slr10ft_facilities_inside: {
    layerId: 0,
    shortLabel: 'Facilities Inside SLR Inundation',
  },
  noaa_county_snapshots_slr10ft_inside_inundation: {
    layerId: 1,
    shortLabel: 'Inside SLR Inundation',
  },
  noaa_county_snapshots_slr10ft_outside_inundation: {
    layerId: 2,
    shortLabel: 'Outside SLR Inundation',
  },
} as const;

export type CountySnapshotsSlr10ftLayerId = keyof typeof COUNTY_SNAPSHOTS_SLR10FT_LAYERS;

/**
 * OCM uses field name FIPSSTCO for a thematic facility-type code (unique-value renderer), not county FIPS.
 * @see layer drawingInfo / service legend
 */
export const OCM_CRITICAL_FACILITIES_SLR_FIPSSTCO_CATEGORY: Record<string, string> = {
  '01003': 'Fire Station',
  '01005': 'Hospital',
  '01013': 'Police Station',
  '01025': 'School',
};

export interface CountySnapshotsSlr10ftFeature {
  objectid: number | null;
  pointIndex: number;
  lat: number;
  lon: number;
  distance_miles: number;
  attributes: Record<string, unknown>;
  geometry: { x: number; y: number; spatialReference: { wkid: number } };
}

function layerUrl(layerId: number): string {
  return `${SERVICE_BASE}/${layerId}`;
}

/** Human-readable label from common OCM / facility attribute names */
export function displayCountySnapshotsSlrLabel(attrs: Record<string, unknown>): string {
  const codeRaw = attrs.FIPSSTCO ?? attrs.fipsstco;
  if (codeRaw != null && String(codeRaw).trim() !== '') {
    const code = String(codeRaw).trim();
    const category = OCM_CRITICAL_FACILITIES_SLR_FIPSSTCO_CATEGORY[code];
    const sum = attrs.SUM_Establishments ?? attrs.sum_establishments;
    if (category) {
      if (sum != null && sum !== '' && Number.isFinite(Number(sum))) {
        return `${category} — ${Number(sum).toLocaleString()} establishment(s) in this service row (national multipoint)`;
      }
      return `${category} (national multipoint)`;
    }
    if (sum != null && sum !== '' && Number.isFinite(Number(sum))) {
      return `Category code ${code} (${Number(sum).toLocaleString()} est.)`;
    }
    return `Category code ${code}`;
  }
  const candidates = [
    attrs.FACILITY_NAME,
    attrs.Facility_Name,
    attrs.FACILITY,
    attrs.Facility,
    attrs.NAME,
    attrs.Name,
    attrs.name,
    attrs.FACILITY_TYPE,
    attrs.FacilityType,
    attrs.FTYPE,
    attrs.POINT_NAME,
  ];
  for (const c of candidates) {
    if (c != null && String(c).trim() !== '') return String(c).trim();
  }
  const oid = attrs.OBJECTID ?? attrs.objectid;
  if (oid != null) return `Feature ${oid}`;
  return '';
}

/** Web Mercator (3857/102100) meters → WGS84 when coords are not geographic */
function projectWebMercatorMetersToWgs84(x: number, y: number): { lon: number; lat: number } {
  const lon = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
  return { lon, lat };
}

function toLonLatPair(x: number, y: number): { lon: number; lat: number } {
  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    return { lon: x, lat: y };
  }
  return projectWebMercatorMetersToWgs84(x, y);
}

/**
 * Collect [x,y] pairs from ArcGIS MultiPoint JSON (possibly nested) or line paths.
 */
function collectXYPairs(geom: {
  x?: number;
  y?: number;
  points?: unknown;
  paths?: number[][][] | null;
}): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];

  const pushPair = (a: unknown, b: unknown) => {
    if (typeof a === 'number' && typeof b === 'number' && Number.isFinite(a) && Number.isFinite(b)) {
      pairs.push([a, b]);
    }
  };

  const walkPoints = (node: unknown): void => {
    if (!Array.isArray(node) || node.length === 0) return;
    const head = node[0];
    if (typeof head === 'number' && typeof node[1] === 'number') {
      pushPair(head, node[1]);
      return;
    }
    if (Array.isArray(head)) {
      for (const child of node) walkPoints(child);
    }
  };

  if (geom?.points != null) {
    walkPoints(geom.points);
  }
  if (pairs.length === 0 && geom?.paths?.length) {
    for (const path of geom.paths) {
      if (!Array.isArray(path)) continue;
      for (const pt of path) {
        if (Array.isArray(pt) && pt.length >= 2) pushPair(pt[0], pt[1]);
      }
    }
  }
  if (pairs.length === 0 && typeof geom?.x === 'number' && typeof geom?.y === 'number') {
    pushPair(geom.x, geom.y);
  }
  return pairs;
}

function extractPoints(geom: {
  x?: number;
  y?: number;
  points?: unknown;
  paths?: number[][][] | null;
}): Array<{ lon: number; lat: number }> {
  const pairs = collectXYPairs(geom);
  const out: Array<{ lon: number; lat: number }> = [];
  for (const [x, y] of pairs) {
    const { lon, lat } = toLonLatPair(x, y);
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      out.push({ lon, lat });
    }
  }
  return out;
}

/**
 * Proximity query (buffer) against a MultiPoint layer; expands multipoints to per-vertex rows.
 */
export async function queryCountySnapshotsSlr10ftLayer(
  enrichmentId: CountySnapshotsSlr10ftLayerId,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CountySnapshotsSlr10ftFeature[]> {
  const cfg = COUNTY_SNAPSHOTS_SLR10FT_LAYERS[enrichmentId];
  const capped = Math.min(Math.max(radiusMiles, 0), NOAA_COUNTY_SNAPSHOTS_SLR10FT_MAX_RADIUS_MILES);
  if (capped <= 0) return [];

  const radiusMeters = capped * 1609.34;
  // Service data is stored in 102100/3857; point buffer in WGS84 uses geodesic distance (meters) on NOAA 11.x.
  const pointGeometry = { x: lon, y: lat, spatialReference: { wkid: 4326 } };
  const base = layerUrl(cfg.layerId);

  const collected: CountySnapshotsSlr10ftFeature[] = [];
  let resultOffset = 0;
  let hasMore = true;
  const { fetchJSONSmart } = await import('../services/EnrichmentService');

  while (hasMore) {
    // Intersects + distance = buffer around the search point (proximity). Not point-in-polygon.
    // Do not set geometryPrecision — it can collapse nearby multipoint vertices; payloads are large but correct.
    // orderByFields is required for stable pagination (resultOffset).
    const params = new URLSearchParams({
      f: 'json',
      where: '1=1',
      outFields: '*',
      geometry: JSON.stringify(pointGeometry),
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      distance: String(radiusMeters),
      units: 'esriSRUnit_Meter',
      inSR: '4326',
      outSR: '4326',
      returnGeometry: 'true',
      resultRecordCount: String(BATCH_SIZE),
      resultOffset: String(resultOffset),
      orderByFields: 'OBJECTID',
    });
    const url = `${base}/query?${params.toString()}`;

    const data = (await fetchJSONSmart(url)) as {
      error?: { message?: string; code?: number };
      features?: Array<{
        attributes?: Record<string, unknown>;
        geometry?: { x?: number; y?: number; points?: unknown; paths?: number[][][] | null };
      }>;
      exceededTransferLimit?: boolean;
    };

    if (data.error) {
      const msg = data.error.message ?? JSON.stringify(data.error);
      throw new Error(`ArcGIS SLR query failed: ${msg}`);
    }
    if (!data.features?.length) {
      hasMore = false;
      break;
    }

    for (const f of data.features) {
      const attrs = f.attributes || {};
      const oid = Number(attrs.OBJECTID ?? attrs.objectid ?? attrs.FID);
      const geom = f.geometry;
      if (!geom) continue;

      const pts = extractPoints(geom);
      pts.forEach((pt, pointIndex) => {
        if (!withinRoughMiles(lat, lon, pt.lat, pt.lon, capped)) return;
        const distance_miles = Number(haversineMiles(lat, lon, pt.lat, pt.lon).toFixed(4));
        if (distance_miles > capped + 1e-5) return;
        collected.push({
          objectid: Number.isFinite(oid) ? oid : null,
          pointIndex,
          lat: pt.lat,
          lon: pt.lon,
          distance_miles,
          attributes: attrs,
          geometry: { x: pt.lon, y: pt.lat, spatialReference: { wkid: 4326 } },
        });
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
