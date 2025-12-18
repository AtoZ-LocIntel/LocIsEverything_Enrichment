import { fetchJSONSmart } from '../services/EnrichmentService';

export interface NRIFeature {
  objectId: number;
  attributes: Record<string, any>;
  geometry: any; // ESRI polygon geometry (rings)
  distance_miles?: number;
  isContaining?: boolean;
  layerName: string;
}

const HURRICANE_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Hurricane/FeatureServer';

const HAIL_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Hail/FeatureServer';

const TORNADO_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Tornado/FeatureServer';

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function centroidFromRings(rings: number[][][]): { lat: number; lon: number } | null {
  if (!Array.isArray(rings) || rings.length === 0) return null;
  const ring = rings[0];
  if (!Array.isArray(ring) || ring.length === 0) return null;
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  ring.forEach((coord) => {
    if (Array.isArray(coord) && coord.length >= 2) {
      sumLon += coord[0];
      sumLat += coord[1];
      count++;
    }
  });
  if (count === 0) return null;
  return { lat: sumLat / count, lon: sumLon / count };
}

async function queryEsri(serviceBase: string, layerId: number, params: Record<string, string>) {
  const url = new URL(`${serviceBase}/${layerId}/query`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return await fetchJSONSmart(url.toString());
}

async function getNRICountyAnnualizedFrequency(
  serviceBase: string,
  lat: number,
  lon: number,
  radiusMiles: number,
  maxMiles: number,
  layerName: string
): Promise<{ containing: NRIFeature[]; nearby: NRIFeature[]; all: NRIFeature[] }> {
  const layerId = 0;
  const cappedRadius = Math.min(Math.max(radiusMiles, 0), maxMiles);
  const meters = cappedRadius * 1609.34;
  const point = { x: lon, y: lat, spatialReference: { wkid: 4326 } };

  // Proximity query (returns polygons)
  const proximity = await queryEsri(serviceBase, layerId, {
    f: 'json',
    where: '1=1',
    outFields: '*',
    geometry: JSON.stringify(point),
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    distance: meters.toString(),
    units: 'esriSRUnit_Meter',
    inSR: '4326',
    outSR: '4326',
    returnGeometry: 'true',
    resultRecordCount: '1000',
    resultOffset: '0',
  });

  const features: any[] = Array.isArray(proximity?.features) ? proximity.features : [];
  const processed: NRIFeature[] = features.map((f, idx) => {
    const attrs = f.attributes || {};
    const geom = f.geometry;
    const cent = geom?.rings ? centroidFromRings(geom.rings) : null;
    const dist = cent ? haversineMiles(lat, lon, cent.lat, cent.lon) : undefined;
    return {
      objectId: attrs.OBJECTID ?? attrs.objectId ?? attrs.objectid ?? idx,
      attributes: attrs,
      geometry: geom,
      distance_miles: dist,
      isContaining: false,
      layerName,
    };
  });

  // Point-in-polygon query (contains) via ESRI geometry relation
  const pip = await queryEsri(serviceBase, layerId, {
    f: 'json',
    where: '1=1',
    outFields: '*',
    geometry: JSON.stringify(point),
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
    outSR: '4326',
    returnGeometry: 'true',
    resultRecordCount: '1000',
    resultOffset: '0',
  });
  const pipFeatures: any[] = Array.isArray(pip?.features) ? pip.features : [];
  const containing: NRIFeature[] = pipFeatures.map((f, idx) => {
    const attrs = f.attributes || {};
    return {
      objectId: attrs.OBJECTID ?? attrs.objectId ?? attrs.objectid ?? idx,
      attributes: attrs,
      geometry: f.geometry,
      distance_miles: 0,
      isContaining: true,
      layerName,
    };
  });

  // De-dupe containing IDs from nearby
  const containingIds = new Set(containing.map((c) => String(c.objectId)));
  const nearby = processed
    .filter((p) => !containingIds.has(String(p.objectId)))
    .filter((p) => typeof p.distance_miles !== 'number' || p.distance_miles <= cappedRadius);

  return { containing, nearby, all: [...containing, ...nearby] };
}

async function getNRICensusTractAnnualizedFrequency(
  serviceBase: string,
  lat: number,
  lon: number,
  radiusMiles: number,
  maxMiles: number,
  layerName: string
): Promise<{ containing: NRIFeature[]; nearby: NRIFeature[]; all: NRIFeature[] }> {
  const layerId = 1;
  const cappedRadius = Math.min(Math.max(radiusMiles, 0), maxMiles);
  const meters = cappedRadius * 1609.34;
  const point = { x: lon, y: lat, spatialReference: { wkid: 4326 } };

  const proximity = await queryEsri(serviceBase, layerId, {
    f: 'json',
    where: '1=1',
    outFields: '*',
    geometry: JSON.stringify(point),
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    distance: meters.toString(),
    units: 'esriSRUnit_Meter',
    inSR: '4326',
    outSR: '4326',
    returnGeometry: 'true',
    resultRecordCount: '1000',
    resultOffset: '0',
  });

  const features: any[] = Array.isArray(proximity?.features) ? proximity.features : [];
  const processed: NRIFeature[] = features.map((f, idx) => {
    const attrs = f.attributes || {};
    const geom = f.geometry;
    const cent = geom?.rings ? centroidFromRings(geom.rings) : null;
    const dist = cent ? haversineMiles(lat, lon, cent.lat, cent.lon) : undefined;
    return {
      objectId: attrs.OBJECTID ?? attrs.objectId ?? attrs.objectid ?? idx,
      attributes: attrs,
      geometry: geom,
      distance_miles: dist,
      isContaining: false,
      layerName,
    };
  });

  const pip = await queryEsri(serviceBase, layerId, {
    f: 'json',
    where: '1=1',
    outFields: '*',
    geometry: JSON.stringify(point),
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
    outSR: '4326',
    returnGeometry: 'true',
    resultRecordCount: '1000',
    resultOffset: '0',
  });

  const pipFeatures: any[] = Array.isArray(pip?.features) ? pip.features : [];
  const containing: NRIFeature[] = pipFeatures.map((f, idx) => {
    const attrs = f.attributes || {};
    return {
      objectId: attrs.OBJECTID ?? attrs.objectId ?? attrs.objectid ?? idx,
      attributes: attrs,
      geometry: f.geometry,
      distance_miles: 0,
      isContaining: true,
      layerName,
    };
  });

  const containingIds = new Set(containing.map((c) => String(c.objectId)));
  const nearby = processed
    .filter((p) => !containingIds.has(String(p.objectId)))
    .filter((p) => typeof p.distance_miles !== 'number' || p.distance_miles <= cappedRadius);

  return { containing, nearby, all: [...containing, ...nearby] };
}

// Hurricane
export async function getNRICountyHurricaneAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    HURRICANE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Hurricane (County)'
  );
}

export async function getNRICensusTractHurricaneAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    HURRICANE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Hurricane (Census Tract)'
  );
}

// Hail
export async function getNRICountyHailAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    HAIL_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Hail (County)'
  );
}

export async function getNRICensusTractHailAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    HAIL_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Hail (Census Tract)'
  );
}

// Tornado (NRI annualized frequency)
export async function getNRICountyTornadoAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    TORNADO_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Tornado (County)'
  );
}

export async function getNRICensusTractTornadoAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    TORNADO_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Tornado (Census Tract)'
  );
}


