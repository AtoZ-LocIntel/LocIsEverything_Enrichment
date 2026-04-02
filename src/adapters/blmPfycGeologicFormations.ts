/**
 * BLM Potential Fossil Yield Classification (PFYC) — geologic formation polygons (cached MapServer).
 * Point-in-polygon and proximity queries up to 100 miles.
 * Service: https://gis.blm.gov/arcgis/rest/services/geophysical/BLM_Natl_PFYC_GeologicFormations_Cached/MapServer/0
 */

import { pointInEsriPolygon } from '../utils/esriPolygonRings';

const BASE_SERVICE_URL =
  'https://gis.blm.gov/arcgis/rest/services/geophysical/BLM_Natl_PFYC_GeologicFormations_Cached/MapServer/0';

export const BLM_PFYC_MAX_RADIUS_MILES = 100;
const BATCH_SIZE = 2000;

export interface BLMPfycFeatureInfo {
  objectId: string | null;
  pfycClassCd: string | null;
  geoUnitName: string | null;
  geometry?: Record<string, unknown> | null;
  distance_miles?: number;
  isContaining?: boolean;
  attributes: Record<string, unknown>;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function closestPointOnSegmentLatLon(
  lat: number,
  lon: number,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { lat: number; lon: number } {
  const A = lon - lon1;
  const B = lat - lat1;
  const C = lon2 - lon1;
  const D = lat2 - lat1;
  const lenSq = C * C + D * D;
  let t = 0;
  if (lenSq > 0) t = Math.max(0, Math.min(1, (A * C + B * D) / lenSq));
  return { lat: lat1 + t * D, lon: lon1 + t * C };
}

function distanceMilesToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings?.length) return Infinity;
  let minMiles = Infinity;
  for (const ring of rings) {
    if (!ring || ring.length < 2) continue;
    for (let i = 0; i < ring.length - 1; i++) {
      const lon1 = ring[i][0];
      const lat1 = ring[i][1];
      const lon2 = ring[i + 1][0];
      const lat2 = ring[i + 1][1];
      const cl = closestPointOnSegmentLatLon(lat, lon, lat1, lon1, lat2, lon2);
      minMiles = Math.min(minMiles, haversineMiles(lat, lon, cl.lat, cl.lon));
    }
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
      const cl = closestPointOnSegmentLatLon(lat, lon, last[1], last[0], first[1], first[0]);
      minMiles = Math.min(minMiles, haversineMiles(lat, lon, cl.lat, cl.lon));
    }
  }
  return minMiles;
}

function featureToInfo(
  attributes: Record<string, unknown>,
  geometry: Record<string, unknown> | null | undefined,
  lat: number,
  lon: number,
  maxRadius: number,
  isProximityPass: boolean
): BLMPfycFeatureInfo | null {
  const rings = (geometry as { rings?: number[][][] })?.rings;
  if (!rings?.length) return null;

  const oidRaw = attributes.OBJECTID ?? attributes.objectid ?? attributes.FID;
  const objectId = oidRaw !== null && oidRaw !== undefined ? String(oidRaw) : null;
  const pfycClassCd =
    (attributes.PFYC_CLASS_CD as string) ||
    (attributes.pfyc_class_cd as string) ||
    null;
  const geoUnitName =
    (attributes.GEO_UNIT_NM as string) ||
    (attributes.Geo_Unit_Nm as string) ||
    null;

  const inside = pointInEsriPolygon(lat, lon, rings);
  let distanceMiles: number;
  if (inside) {
    distanceMiles = 0;
  } else {
    distanceMiles = Number(distanceMilesToPolygon(lat, lon, rings).toFixed(4));
    if (isProximityPass && distanceMiles > maxRadius + 1e-3) return null;
  }

  return {
    objectId,
    pfycClassCd,
    geoUnitName,
    geometry: geometry ?? null,
    distance_miles: distanceMiles,
    isContaining: inside,
    attributes,
  };
}

export async function getBLMPfycGeologicFormationsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<BLMPfycFeatureInfo[]> {
  const { fetchJSONSmart } = await import('../services/EnrichmentService');

  const maxRadius = Math.min(radiusMiles ?? BLM_PFYC_MAX_RADIUS_MILES, BLM_PFYC_MAX_RADIUS_MILES);
  const results: BLMPfycFeatureInfo[] = [];
  const seenContaining = new Set<string>();

  const pointGeometry = {
    x: lon,
    y: lat,
    spatialReference: { wkid: 4326 },
  };

  try {
    const pointInPolyUrl = `${BASE_SERVICE_URL}/query?${new URLSearchParams({
      f: 'json',
      where: '1=1',
      outFields: '*',
      geometry: JSON.stringify(pointGeometry),
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      returnGeometry: 'true',
    }).toString()}`;

    const pointInPolyData = (await fetchJSONSmart(pointInPolyUrl)) as {
      error?: { message?: string };
      features?: Array<{ attributes?: Record<string, unknown>; geometry?: Record<string, unknown> }>;
    };

    if (pointInPolyData.error) {
      console.error('BLM PFYC point-in-polygon error:', pointInPolyData.error);
    } else if (pointInPolyData.features?.length) {
      for (const feature of pointInPolyData.features) {
        const attrs = feature.attributes || {};
        const info = featureToInfo(attrs, feature.geometry, lat, lon, maxRadius, false);
        if (info?.isContaining) {
          const k = info.objectId ?? `idx-${results.length}`;
          if (!seenContaining.has(k)) {
            seenContaining.add(k);
            results.push(info);
          }
        }
      }
    }
  } catch (e) {
    console.error('BLM PFYC point-in-polygon query failed:', e);
  }

  if (maxRadius > 0) {
    const radiusMeters = maxRadius * 1609.34;
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
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
      const proximityUrl = `${BASE_SERVICE_URL}/query?${params.toString()}`;

      const proximityData = (await fetchJSONSmart(proximityUrl)) as {
        error?: { message?: string };
        features?: Array<{ attributes?: Record<string, unknown>; geometry?: Record<string, unknown> }>;
        exceededTransferLimit?: boolean;
      };

      if (proximityData.error) {
        console.error('BLM PFYC proximity error:', proximityData.error);
        break;
      }

      const batch = proximityData.features || [];
      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      for (const feature of batch) {
        const attrs = feature.attributes || {};
        const oidRaw = attrs.OBJECTID ?? attrs.objectid;
        const oidKey = oidRaw !== null && oidRaw !== undefined ? String(oidRaw) : null;

        const alreadyContaining = oidKey && seenContaining.has(oidKey);
        if (alreadyContaining) continue;

        const info = featureToInfo(attrs, feature.geometry, lat, lon, maxRadius, true);
        if (!info) continue;

        if (info.isContaining) {
          if (oidKey) seenContaining.add(oidKey);
          results.push(info);
          continue;
        }

        if ((info.distance_miles ?? Infinity) <= maxRadius + 1e-3) {
          results.push(info);
        }
      }

      if (proximityData.exceededTransferLimit === true || batch.length === BATCH_SIZE) {
        resultOffset += BATCH_SIZE;
        await new Promise((r) => setTimeout(r, 100));
      } else {
        hasMore = false;
      }

      if (resultOffset > 200000) {
        console.warn('BLM PFYC: stopping proximity pagination at 200k offset');
        hasMore = false;
      }
    }
  }

  const byId = new Map<string, BLMPfycFeatureInfo>();
  for (const r of results) {
    const id = r.objectId ?? `noid-${byId.size}`;
    const prev = byId.get(id);
    if (!prev) {
      byId.set(id, r);
      continue;
    }
    if (r.isContaining && !prev.isContaining) {
      byId.set(id, r);
    } else if (r.isContaining === prev.isContaining) {
      const da = r.distance_miles ?? Infinity;
      const db = prev.distance_miles ?? Infinity;
      if (da < db) byId.set(id, r);
    }
  }

  const merged = Array.from(byId.values());
  merged.sort((a, b) => {
    if (a.isContaining && !b.isContaining) return -1;
    if (!a.isContaining && b.isContaining) return 1;
    return (a.distance_miles ?? 0) - (b.distance_miles ?? 0);
  });

  return merged;
}
