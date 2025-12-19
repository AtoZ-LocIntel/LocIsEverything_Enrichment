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

// NRI Census Tract Risk Index Rating and Expected Annual Loss Rating services
const NRI_AVALANCHE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Avalanche_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COASTAL_FLOODING_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Coastal_Flooding_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COASTAL_FLOODING_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Coastal_Flooding_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COLD_WAVE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Cold_Wave_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COLD_WAVE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Cold_Wave_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_DROUGHT_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Drought_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_DROUGHT_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Drought_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_EARTHQUAKE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Earthquake_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_EARTHQUAKE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Earthquake_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COMPOSITE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Expected_Annual_Loss_Rating_Composite/FeatureServer';
const NRI_HAIL_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Hail_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_HAIL_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Hail_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_HEAT_WAVE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Heat_Wave_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_HEAT_WAVE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Heat_Wave_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_ICE_STORM_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Ice_Storm_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_ICE_STORM_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Ice_Storm_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_INLAND_FLOODING_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Inland_Flooding_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_INLAND_FLOODING_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Inland_Flooding_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_LANDSLIDE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Landslide_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_LANDSLIDE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Landslide_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_LIGHTNING_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Lightning_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_LIGHTNING_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Lightning_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_SOCIAL_VULNERABILITY_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Social_Vulnerability_Rating/FeatureServer';
const NRI_STRONG_WIND_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Strong_Wind_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_STRONG_WIND_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Strong_Wind_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_TORNADO_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Tornado_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_TORNADO_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Tornado_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_TSUNAMI_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Tsunami_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_TSUNAMI_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Tsunami_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_VOLCANIC_ACTIVITY_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Volcanic_Activity_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_VOLCANIC_ACTIVITY_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Volcanic_Activity_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_WILDFIRE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Wildfire_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_WILDFIRE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Wildfire_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_WINTER_WEATHER_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Winter_Weather_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_WINTER_WEATHER_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Census_Tract_Winter_Weather_Hazard_Type_Risk_Index_Rating/FeatureServer';

// NRI County Risk Index Rating and Expected Annual Loss Rating services
const NRI_COUNTY_AVALANCHE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Avalanche_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_AVALANCHE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Avalanche_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_COASTAL_FLOODING_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Coastal_Flooding_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_COASTAL_FLOODING_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Coastal_Flooding_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_COLD_WAVE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Cold_Wave_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_COLD_WAVE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Cold_Wave_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_COMMUNITY_RESILIENCE_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Community_Resilience_Rating/FeatureServer';
const NRI_COUNTY_DROUGHT_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Drought_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_DROUGHT_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Drought_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_EARTHQUAKE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Earthquake_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_EARTHQUAKE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Earthquake_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_HAIL_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Hail_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_HAIL_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Hail_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_HEAT_WAVE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Heat_Wave_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_HEAT_WAVE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Heat_Wave_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_HURRICANE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Hurricane_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_HURRICANE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Hurricane_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_ICE_STORM_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Ice_Storm_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_ICE_STORM_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Ice_Storm_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_INLAND_FLOODING_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Inland_Flooding_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_INLAND_FLOODING_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Inland_Flooding_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_LANDSLIDE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Landslide_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_LANDSLIDE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Landslide_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_LIGHTNING_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Lightning_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_NATIONAL_RISK_INDEX_COMPOSITE_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_National_Risk_Index_Rating_Composite/FeatureServer';
const NRI_COUNTY_STRONG_WIND_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Strong_Wind_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_STRONG_WIND_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Strong_Wind_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_TORNADO_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Tornado_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_TORNADO_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Tornado_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_TSUNAMI_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Tsunami_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_TSUNAMI_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Tsunami_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_VOLCANIC_ACTIVITY_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Volcanic_Activity_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_VOLCANIC_ACTIVITY_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Volcanic_Activity_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_WILDFIRE_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Wildfire_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_WILDFIRE_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Wildfire_Hazard_Type_Risk_Index_Rating/FeatureServer';
const NRI_COUNTY_WINTER_WEATHER_EAL_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Winter_Weather_Expected_Annual_Loss_Rating/FeatureServer';
const NRI_COUNTY_WINTER_WEATHER_HT_RISK_SERVICE = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_County_Winter_Weather_Hazard_Type_Risk_Index_Rating/FeatureServer';

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

// Helper for single-layer Census Tract services (layer 0 only)
async function getNRICensusTractSingleLayer(
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

// Helper for single-layer County services (layer 0 only, 25 miles max)
async function getNRICountySingleLayer(
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
    50,
    'NRI Annualized Frequency Hurricane (County)'
  );
}

export async function getNRICensusTractHurricaneAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    HURRICANE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    50,
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
    50,
    'NRI Annualized Frequency Hail (County)'
  );
}

export async function getNRICensusTractHailAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    HAIL_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Tornado (County)'
  );
}

export async function getNRICensusTractTornadoAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    TORNADO_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Earthquake (County)'
  );
}

export async function getNRICensusTractEarthquakeAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    EARTHQUAKE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Drought (County)'
  );
}

export async function getNRICensusTractDroughtAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    DROUGHT_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Wildfire (County)'
  );
}

export async function getNRICensusTractWildfireAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    WILDFIRE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Lightning (County)'
  );
}

export async function getNRICensusTractLightningAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    LIGHTNING_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Ice Storm (County)'
  );
}

export async function getNRICensusTractIceStormAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    ICE_STORM_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Coastal Flooding (County)'
  );
}

export async function getNRICensusTractCoastalFloodingAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    COASTAL_FLOODING_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Riverine Flooding (County)'
  );
}

export async function getNRICensusTractRiverineFloodingAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    RIVERINE_FLOODING_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Landslide (County)'
  );
}

export async function getNRICensusTractLandslideAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    LANDSLIDE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Strong Wind (County)'
  );
}

export async function getNRICensusTractStrongWindAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    STRONG_WIND_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Winter Weather (County)'
  );
}

export async function getNRICensusTractWinterWeatherAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    WINTER_WEATHER_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Cold Wave (County)'
  );
}

export async function getNRICensusTractColdWaveAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    COLD_WAVE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Heat Wave (County)'
  );
}

export async function getNRICensusTractHeatWaveAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    HEAT_WAVE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Avalanche (County)'
  );
}

export async function getNRICensusTractAvalancheAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    AVALANCHE_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Tsunami (County)'
  );
}

export async function getNRICensusTractTsunamiAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    TSUNAMI_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
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
    50,
    'NRI Annualized Frequency Volcanic Activity (County)'
  );
}

export async function getNRICensusTractVolcanicActivityAnnualizedFrequency(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractAnnualizedFrequency(
    VOLCANIC_ACTIVITY_SERVICE_BASE,
    lat,
    lon,
    radiusMiles,
    25,
    'NRI Annualized Frequency Volcanic Activity (Census Tract)'
  );
}

// NRI Census Tract Risk Index Rating and Expected Annual Loss Rating layers
export async function getNRICensusTractAvalancheHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_AVALANCHE_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Avalanche Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractCoastalFloodingExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_COASTAL_FLOODING_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Coastal Flooding Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractCoastalFloodingHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_COASTAL_FLOODING_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Coastal Flooding Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractColdWaveExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_COLD_WAVE_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Cold Wave Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractColdWaveHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_COLD_WAVE_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Cold Wave Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractDroughtExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_DROUGHT_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Drought Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractDroughtHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_DROUGHT_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Drought Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractEarthquakeExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_EARTHQUAKE_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Earthquake Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractEarthquakeHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_EARTHQUAKE_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Earthquake Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractExpectedAnnualLossRatingComposite(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_COMPOSITE_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Expected Annual Loss Rating Composite (Census Tract)');
}

export async function getNRICensusTractHailExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_HAIL_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Hail Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractHailHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_HAIL_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Hail Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractHeatWaveExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_HEAT_WAVE_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Heat Wave Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractHeatWaveHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_HEAT_WAVE_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Heat Wave Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractIceStormExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_ICE_STORM_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Ice Storm Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractIceStormHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_ICE_STORM_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Ice Storm Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractInlandFloodingExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_INLAND_FLOODING_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Inland Flooding Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractInlandFloodingHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_INLAND_FLOODING_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Inland Flooding Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractLandslideExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_LANDSLIDE_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Landslide Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractLandslideHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_LANDSLIDE_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Landslide Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractLightningExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_LIGHTNING_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Lightning Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractLightningHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_LIGHTNING_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Lightning Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractSocialVulnerabilityRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_SOCIAL_VULNERABILITY_SERVICE, lat, lon, radiusMiles, 25, 'NRI Social Vulnerability Rating (Census Tract)');
}

export async function getNRICensusTractStrongWindExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_STRONG_WIND_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Strong Wind Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractStrongWindHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_STRONG_WIND_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Strong Wind Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractTornadoExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_TORNADO_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Tornado Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractTornadoHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_TORNADO_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Tornado Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractTsunamiExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_TSUNAMI_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Tsunami Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractTsunamiHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_TSUNAMI_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Tsunami Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractVolcanicActivityExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_VOLCANIC_ACTIVITY_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Volcanic Activity Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractVolcanicActivityHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_VOLCANIC_ACTIVITY_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Volcanic Activity Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractWildfireExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_WILDFIRE_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Wildfire Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractWildfireHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_WILDFIRE_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Wildfire Hazard Type Risk Index Rating (Census Tract)');
}

export async function getNRICensusTractWinterWeatherExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_WINTER_WEATHER_EAL_SERVICE, lat, lon, radiusMiles, 25, 'NRI Winter Weather Expected Annual Loss Rating (Census Tract)');
}

export async function getNRICensusTractWinterWeatherHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 5) {
  return await getNRICensusTractSingleLayer(NRI_WINTER_WEATHER_HT_RISK_SERVICE, lat, lon, radiusMiles, 25, 'NRI Winter Weather Hazard Type Risk Index Rating (Census Tract)');
}

// NRI County Risk Index Rating and Expected Annual Loss Rating layers
export async function getNRICountyAvalancheExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_AVALANCHE_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Avalanche Expected Annual Loss Rating (County)');
}

export async function getNRICountyAvalancheHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_AVALANCHE_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Avalanche Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyCoastalFloodingExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_COASTAL_FLOODING_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Coastal Flooding Expected Annual Loss Rating (County)');
}

export async function getNRICountyCoastalFloodingHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_COASTAL_FLOODING_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Coastal Flooding Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyColdWaveExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_COLD_WAVE_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Cold Wave Expected Annual Loss Rating (County)');
}

export async function getNRICountyColdWaveHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_COLD_WAVE_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Cold Wave Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyCommunityResilienceRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_COMMUNITY_RESILIENCE_SERVICE, lat, lon, radiusMiles, 50, 'NRI Community Resilience Rating (County)');
}

export async function getNRICountyDroughtExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_DROUGHT_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Drought Expected Annual Loss Rating (County)');
}

export async function getNRICountyDroughtHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_DROUGHT_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Drought Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyEarthquakeExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_EARTHQUAKE_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Earthquake Expected Annual Loss Rating (County)');
}

export async function getNRICountyEarthquakeHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_EARTHQUAKE_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Earthquake Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyHailExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_HAIL_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Hail Expected Annual Loss Rating (County)');
}

export async function getNRICountyHailHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_HAIL_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Hail Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyHeatWaveExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_HEAT_WAVE_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Heat Wave Expected Annual Loss Rating (County)');
}

export async function getNRICountyHeatWaveHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_HEAT_WAVE_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Heat Wave Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyHurricaneExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_HURRICANE_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Hurricane Expected Annual Loss Rating (County)');
}

export async function getNRICountyHurricaneHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_HURRICANE_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Hurricane Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyIceStormExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_ICE_STORM_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Ice Storm Expected Annual Loss Rating (County)');
}

export async function getNRICountyIceStormHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_ICE_STORM_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Ice Storm Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyInlandFloodingExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_INLAND_FLOODING_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Inland Flooding Expected Annual Loss Rating (County)');
}

export async function getNRICountyInlandFloodingHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_INLAND_FLOODING_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Inland Flooding Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyLandslideExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_LANDSLIDE_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Landslide Expected Annual Loss Rating (County)');
}

export async function getNRICountyLandslideHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_LANDSLIDE_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Landslide Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyLightningExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_LIGHTNING_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Lightning Expected Annual Loss Rating (County)');
}

export async function getNRICountyNationalRiskIndexRatingComposite(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_NATIONAL_RISK_INDEX_COMPOSITE_SERVICE, lat, lon, radiusMiles, 50, 'NRI National Risk Index Rating Composite (County)');
}

export async function getNRICountyStrongWindExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_STRONG_WIND_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Strong Wind Expected Annual Loss Rating (County)');
}

export async function getNRICountyStrongWindHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_STRONG_WIND_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Strong Wind Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyTornadoExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_TORNADO_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Tornado Expected Annual Loss Rating (County)');
}

export async function getNRICountyTornadoHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_TORNADO_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Tornado Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyTsunamiExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_TSUNAMI_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Tsunami Expected Annual Loss Rating (County)');
}

export async function getNRICountyTsunamiHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_TSUNAMI_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Tsunami Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyVolcanicActivityExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_VOLCANIC_ACTIVITY_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Volcanic Activity Expected Annual Loss Rating (County)');
}

export async function getNRICountyVolcanicActivityHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_VOLCANIC_ACTIVITY_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Volcanic Activity Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyWildfireExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_WILDFIRE_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Wildfire Expected Annual Loss Rating (County)');
}

export async function getNRICountyWildfireHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_WILDFIRE_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Wildfire Hazard Type Risk Index Rating (County)');
}

export async function getNRICountyWinterWeatherExpectedAnnualLossRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_WINTER_WEATHER_EAL_SERVICE, lat, lon, radiusMiles, 50, 'NRI Winter Weather Expected Annual Loss Rating (County)');
}

export async function getNRICountyWinterWeatherHazardTypeRiskIndexRating(lat: number, lon: number, radiusMiles = 25) {
  return await getNRICountySingleLayer(NRI_COUNTY_WINTER_WEATHER_HT_RISK_SERVICE, lat, lon, radiusMiles, 50, 'NRI Winter Weather Hazard Type Risk Index Rating (County)');
}


