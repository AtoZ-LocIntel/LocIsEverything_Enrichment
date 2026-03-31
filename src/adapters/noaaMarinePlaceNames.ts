/**
 * NOAA Marine Cadastre — Marine Place Names (MapServer layer 0, points)
 * @see https://coast.noaa.gov/arcgis/rest/services/MarineCadastre/MarinePlaceNames/MapServer
 */

const BASE_SERVICE_URL =
  'https://coast.noaa.gov/arcgis/rest/services/MarineCadastre/MarinePlaceNames/MapServer';
const LAYER_ID = 0;
export const NOAA_MARINE_PLACE_NAMES_MAX_RADIUS_MILES = 250;
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

export interface NOAAPlaceNameFeature {
  objectid: number | null;
  lat: number;
  lon: number;
  distance_miles: number;
  attributes: Record<string, unknown>;
  geometry: { x: number; y: number; spatialReference?: { wkid: number } } | null;
}

function coordsFromFeature(f: {
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

export function displayNameFromAttributes(attrs: Record<string, unknown>): string {
  const candidates = [
    attrs.name,
    attrs.NAME,
    attrs.Name,
    attrs.PLACE_NAME,
    attrs.Place_Name,
    attrs.place_name,
    attrs.PLACENAME,
    attrs.PLACE,
    attrs.LABEL,
    attrs.FULL_NAME,
  ];
  for (const c of candidates) {
    if (c != null && String(c).trim() !== '') return String(c).trim();
  }
  return '';
}

/**
 * Query Marine Place Names within a buffer of the search location (WGS84).
 */
export async function queryNOAAMarinePlaceNames(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAAPlaceNameFeature[]> {
  const capped = Math.min(Math.max(radiusMiles, 0), NOAA_MARINE_PLACE_NAMES_MAX_RADIUS_MILES);
  if (capped <= 0) return [];

  const radiusMeters = capped * 1609.34;
  const pointGeometry = { x: lon, y: lat, spatialReference: { wkid: 4326 } };
  const geometryStr = encodeURIComponent(JSON.stringify(pointGeometry));

  const collected: NOAAPlaceNameFeature[] = [];
  let resultOffset = 0;
  let hasMore = true;
  const { fetchJSONSmart } = await import('../services/EnrichmentService');

  while (hasMore) {
    const url = `${BASE_SERVICE_URL}/${LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${BATCH_SIZE}&resultOffset=${resultOffset}`;

    const data = (await fetchJSONSmart(url)) as {
      error?: unknown;
      features?: Array<{ attributes?: Record<string, unknown>; geometry?: { x?: number; y?: number } }>;
      exceededTransferLimit?: boolean;
    };

    if (data.error || !data.features?.length) {
      hasMore = false;
      break;
    }

    for (const f of data.features) {
      const attrs = f.attributes || {};
      const oid = Number(attrs.OBJECTID ?? attrs.objectid ?? attrs.FID ?? attrs.OBJECTID_1);
      const cc = coordsFromFeature(f);
      if (!cc) continue;

      const distance_miles = Number(haversineMiles(lat, lon, cc.lat, cc.lon).toFixed(4));
      if (distance_miles > capped + 1e-5) continue;

      const geom = f.geometry;
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
