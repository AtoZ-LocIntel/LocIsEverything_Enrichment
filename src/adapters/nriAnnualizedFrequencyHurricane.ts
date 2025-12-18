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

const EARTHQUAKE_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Earthquake/FeatureServer';

const DROUGHT_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Drought/FeatureServer';

const WILDFIRE_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Wildfire/FeatureServer';

const LIGHTNING_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Lightning/FeatureServer';

const ICE_STORM_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Ice_Storm/FeatureServer';

const COASTAL_FLOODING_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Coastal_Flooding/FeatureServer';

const RIVERINE_FLOODING_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Riverine_Flooding/FeatureServer';

const LANDSLIDE_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Landslide/FeatureServer';

const STRONG_WIND_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Strong_Wind/FeatureServer';

const WINTER_WEATHER_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Winter_Weather/FeatureServer';

const COLD_WAVE_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Cold_Wave/FeatureServer';

const HEAT_WAVE_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Heat_Wave/FeatureServer';

const AVALANCHE_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Avalanche/FeatureServer';

const TSUNAMI_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Tsunami/FeatureServer';

const VOLCANIC_ACTIVITY_SERVICE_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Annualized_Frequency_Volcanic_Activity/FeatureServer';

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

// Earthquake
export async function getNRICountyEarthquakeAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    EARTHQUAKE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Earthquake (County)'
  );
}

export async function getNRICensusTractEarthquakeAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    EARTHQUAKE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Earthquake (Census Tract)'
  );
}

// Drought
export async function getNRICountyDroughtAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    DROUGHT_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Drought (County)'
  );
}

export async function getNRICensusTractDroughtAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    DROUGHT_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Drought (Census Tract)'
  );
}

// Wildfire
export async function getNRICountyWildfireAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    WILDFIRE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Wildfire (County)'
  );
}

export async function getNRICensusTractWildfireAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    WILDFIRE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Wildfire (Census Tract)'
  );
}

// Lightning
export async function getNRICountyLightningAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    LIGHTNING_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Lightning (County)'
  );
}

export async function getNRICensusTractLightningAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    LIGHTNING_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Lightning (Census Tract)'
  );
}

// Ice Storm
export async function getNRICountyIceStormAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    ICE_STORM_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Ice Storm (County)'
  );
}

export async function getNRICensusTractIceStormAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    ICE_STORM_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Ice Storm (Census Tract)'
  );
}

// Coastal Flooding
export async function getNRICountyCoastalFloodingAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    COASTAL_FLOODING_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Coastal Flooding (County)'
  );
}

export async function getNRICensusTractCoastalFloodingAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    COASTAL_FLOODING_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Coastal Flooding (Census Tract)'
  );
}

// Riverine Flooding
export async function getNRICountyRiverineFloodingAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    RIVERINE_FLOODING_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Riverine Flooding (County)'
  );
}

export async function getNRICensusTractRiverineFloodingAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    RIVERINE_FLOODING_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Riverine Flooding (Census Tract)'
  );
}

// Landslide
export async function getNRICountyLandslideAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    LANDSLIDE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Landslide (County)'
  );
}

export async function getNRICensusTractLandslideAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    LANDSLIDE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Landslide (Census Tract)'
  );
}

// Strong Wind
export async function getNRICountyStrongWindAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    STRONG_WIND_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Strong Wind (County)'
  );
}

export async function getNRICensusTractStrongWindAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    STRONG_WIND_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Strong Wind (Census Tract)'
  );
}

// Winter Weather
export async function getNRICountyWinterWeatherAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    WINTER_WEATHER_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Winter Weather (County)'
  );
}

export async function getNRICensusTractWinterWeatherAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    WINTER_WEATHER_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Winter Weather (Census Tract)'
  );
}

// Cold Wave
export async function getNRICountyColdWaveAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    COLD_WAVE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Cold Wave (County)'
  );
}

export async function getNRICensusTractColdWaveAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    COLD_WAVE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Cold Wave (Census Tract)'
  );
}

// Heat Wave
export async function getNRICountyHeatWaveAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    HEAT_WAVE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Heat Wave (County)'
  );
}

export async function getNRICensusTractHeatWaveAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    HEAT_WAVE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Heat Wave (Census Tract)'
  );
}

// Avalanche
export async function getNRICountyAvalancheAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    AVALANCHE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Avalanche (County)'
  );
}

export async function getNRICensusTractAvalancheAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    AVALANCHE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Avalanche (Census Tract)'
  );
}

// Tsunami
export async function getNRICountyTsunamiAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    TSUNAMI_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Tsunami (County)'
  );
}

export async function getNRICensusTractTsunamiAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    TSUNAMI_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Tsunami (Census Tract)'
  );
}

// Volcanic Activity
export async function getNRICountyVolcanicActivityAnnualizedFrequency(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountyAnnualizedFrequency(
    VOLCANIC_ACTIVITY_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Volcanic Activity (County)'
  );
}

export async function getNRICensusTractVolcanicActivityAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    VOLCANIC_ACTIVITY_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    10,
    'NRI Annualized Frequency Volcanic Activity (Census Tract)'
  );
}


