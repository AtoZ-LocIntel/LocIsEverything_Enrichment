/**
 * Maps map legend keys (enrichment / layer ids) to canonical data-source URLs
 * aligned with Data Sources. Used by MapView legend links.
 *
 * Resolution order:
 * 1. Optional `sourceUrl` on the POI config entry (highest priority)
 * 2. Exact key match in LAYER_SOURCE_URL_EXACT
 * 3. First matching rule in LAYER_SOURCE_URL_RULES (most specific patterns first)
 */

import { poiConfigManager } from './poiConfig';

/** ArcGIS FeatureServer for Global Risk — all Global Oil and Gas infrastructure sublayers */
export const GLOBAL_OIL_AND_GAS_FEATURE_SERVER_URL =
  'https://services6.arcgis.com/62zavqsrcK71xG8O/ArcGIS/rest/services/Global_Oil_and_Gas_Features/FeatureServer';

/** USGS ArcGIS REST services catalog (National Map / TNM layers use this hub). */
export const USGS_ARCGIS_REST_SERVICES_BASE = 'https://gisdata.usgs.gov/arcgis/rest/services/';

/** Hurricane evacuation routes — matches `hurricaneEvacuationRoutes.ts` FeatureServer. */
export const USGS_HURRICANE_EVACUATION_ROUTES_FEATURE_SERVER =
  'https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/Hurricane_Evacuation_Routes_1/FeatureServer';

/**
 * FEMA National Risk Index (NRI) hazard layers on ArcGIS Online — service directory listing
 * (matches `nriAnnualizedFrequencyHurricane.ts` and related NRI adapters).
 */
export const FEMA_NRI_ARCGIS_SERVICES_BASE =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services';

/** Keys that appear in the legend but should not link anywhere */
const NO_URL_PREFIXES = ['batch_location_'];

/** Manual overrides — use when a layer id does not match a generic rule */
export const LAYER_SOURCE_URL_EXACT: Record<string, string> = {
  poi_wikipedia: 'https://www.wikipedia.org/',
  poi_wildfires:
    'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Current_Wildland_Fire_Locations/FeatureServer',
  poi_nps_all_crashes:
    'https://services.arcgis.com/xOi1kZaI0eWDREZv/ArcGIS/rest/services/All_Crashes/FeatureServer/0',
  tornado_tracks_1950_2017:
    'https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/Tornado_Tracks_1950_2017_1/FeatureServer/0',
  national_seismic_hazard_2023:
    'https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/2023_National_Seismic_Hazard_Model/FeatureServer/0',
  poi_earthquakes: 'https://earthquake.usgs.gov/earthquakes/feed/',
  poi_volcanoes: 'https://volcanoes.usgs.gov/vsc/api/volcanoApi/geojson',
  poi_flood_reference_points: 'https://waterwatch.usgs.gov/',
  poi_wetlands: 'https://www.fws.gov/program/national-wetlands-inventory',
  poi_animal_vehicle_collisions: 'https://locationfriend.com/',
  poi_fema_flood_zones: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer',
  opensky_flights: 'https://opensky-network.org/',
  ais_live_shipping: 'https://aisstream.io/',
  portwatch_disruptions: 'https://portwatch.imf.org/',
  portwatch_chokepoints: 'https://portwatch.imf.org/',
  portwatch_ports: 'https://portwatch.imf.org/',
  mdb_gtfs_feeds: 'https://mobilitydatabase.org/',
  usgs_earthquakes: 'https://earthquake.usgs.gov/earthquakes/feed/',
  climate_risks: 'https://www.climate.gov/',
  acled: 'https://acleddata.com/',
  spillovers_port_impact: 'https://portwatch.imf.org/',
  hurricane_evacuation_routes: USGS_HURRICANE_EVACUATION_ROUTES_FEATURE_SERVER,
  hurricane_evacuation_routes_hazards: USGS_HURRICANE_EVACUATION_ROUTES_FEATURE_SERVER,
  noaa_marinecadastre_ais_vessel_transit_counts_2024:
    'https://coast.noaa.gov/arcgis/rest/services/MarineCadastre/AISVesselTransitCounts2024/MapServer',
  noaa_marine_place_names:
    'https://coast.noaa.gov/arcgis/rest/services/MarineCadastre/MarinePlaceNames/MapServer',
  noaa_marinecadastre_marine_place_names:
    'https://coast.noaa.gov/arcgis/rest/services/MarineCadastre/MarinePlaceNames/MapServer',
  noaa_marine_undersea_feature_place_names:
    'https://coast.noaa.gov/arcgis/rest/services/MarineCadastre/UnderseaFeaturePlaceNames/MapServer',
  noaa_marine_seagrasses:
    'https://coast.noaa.gov/arcgis/rest/services/MarineCadastre/Seagrasses/MapServer',
  noaa_marine_coastal_wetlands:
    'https://coast.noaa.gov/arcgis/rest/services/MarineCadastre/CoastalWetlands/MapServer/0',
  noaa_marine_us_state_submerged_lands:
    'https://coast.noaa.gov/arcgis/rest/services/MarineCadastre/USStateSubmergedLands/MapServer',
  noaa_marine_ioos_regions:
    'https://coast.noaa.gov/arcgis/rest/services/MarineCadastre/IOOSRegions/MapServer',
  noaa_county_snapshots_slr10ft_facilities_inside:
    'https://coast.noaa.gov/arcgis/rest/services/CountySnapshots/CriticalFacilities_10ftSLR/MapServer/0',
  noaa_county_snapshots_slr10ft_inside_inundation:
    'https://coast.noaa.gov/arcgis/rest/services/CountySnapshots/CriticalFacilities_10ftSLR/MapServer/1',
  noaa_county_snapshots_slr10ft_outside_inundation:
    'https://coast.noaa.gov/arcgis/rest/services/CountySnapshots/CriticalFacilities_10ftSLR/MapServer/2',
  usgs_nationalmap_plss_township:
    'https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer/1',
  usgs_nationalmap_plss_section:
    'https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer/2',
  usgs_nationalmap_plss_intersected:
    'https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer/3',
  blm_lands:
    'https://services.arcgis.com/xOi1kZaI0eWDREZv/ArcGIS/rest/services/BLM_Lands/FeatureServer/0',
  blm_pfyc_geologic_formations:
    'https://gis.blm.gov/arcgis/rest/services/geophysical/BLM_Natl_PFYC_GeologicFormations_Cached/MapServer/0',
  /** Nationwide Rivers Inventory — not FEMA National Risk Index; must win over `nri_` prefix rule */
  nri_rivers:
    'https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/Nationwide_Rivers_Inventory_Official/FeatureServer/0',
};

type Rule = { test: (key: string) => boolean; url: string };

/** More-specific matchers must appear before broader ones */
const LAYER_SOURCE_URL_RULES: Rule[] = [
  { test: (k) => k.startsWith('nri_'), url: FEMA_NRI_ARCGIS_SERVICES_BASE },
  { test: (k) => k.startsWith('fema_nfhl_'), url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer' },
  { test: (k) => k.includes('national_seismic_hazard'), url: 'https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/2023_National_Seismic_Hazard_Model/FeatureServer/0' },
  { test: (k) => k.startsWith('tornado_tracks'), url: 'https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/Tornado_Tracks_1950_2017_1/FeatureServer/0' },
  // Global Risk — Processing Plants, LNG, Power Plants, Storage, Stations, Refineries, Basins, Fields,
  // Mines, Wells, Wells Vector Grid, Platforms/Well Pads, Underground Storage, Pipelines, Railways, Ports
  { test: (k) => k.startsWith('global_oil_gas_'), url: GLOBAL_OIL_AND_GAS_FEATURE_SERVER_URL },
  { test: (k) => k.startsWith('usda_'), url: 'https://www.fs.usda.gov/' },
  { test: (k) => k.startsWith('nh_'), url: 'https://granit.unh.edu/' },
  { test: (k) => k.startsWith('boston_'), url: 'https://data.boston.gov/' },
  { test: (k) => k.startsWith('chicago_'), url: 'https://data.cityofchicago.org/' },
  { test: (k) => k.startsWith('nyc_'), url: 'https://opendata.cityofnewyork.us/' },
  { test: (k) => k.startsWith('la_county_'), url: 'https://data.lacounty.gov/' },
  { test: (k) => k.startsWith('houston_'), url: 'https://cohgis-mycity.opendata.arcgis.com/' },
  { test: (k) => k.startsWith('dc_'), url: 'https://opendata.dc.gov/' },
  { test: (k) => k.startsWith('poi_epa_') || k.startsWith('tri_'), url: 'https://www.epa.gov/' },
  { test: (k) => k.startsWith('poi_osm_') || k.includes('_osm_'), url: 'https://www.openstreetmap.org/' },
  { test: (k) => k.startsWith('tnm_'), url: USGS_ARCGIS_REST_SERVICES_BASE },
  { test: (k) => k.startsWith('us_national_grid_'), url: USGS_ARCGIS_REST_SERVICES_BASE },
  { test: (k) => k.startsWith('us_historical_'), url: USGS_ARCGIS_REST_SERVICES_BASE },
  { test: (k) => k.startsWith('usgs_'), url: USGS_ARCGIS_REST_SERVICES_BASE },
  { test: (k) => k.startsWith('nws_'), url: 'https://www.weather.gov/documentation/services-web-api' },
  { test: (k) => k.startsWith('fws_'), url: 'https://www.fws.gov/' },
  { test: (k) => k.startsWith('blm_'), url: 'https://www.blm.gov/maps' },
  { test: (k) => k.startsWith('ca_'), url: 'https://gis.data.ca.gov/' },
  { test: (k) => k.startsWith('fldep_') || k.startsWith('fldot_'), url: 'https://geodata.dep.state.fl.us/' },
  { test: (k) => k.startsWith('ma_'), url: 'https://www.mass.gov/info-details/massgis-data-layers' },
  { test: (k) => k.startsWith('ct_'), url: 'https://portal.ct.gov/Geospatial-Information-Systems' },
  { test: (k) => k.startsWith('co_'), url: 'https://data.colorado.gov/' },
  { test: (k) => k.startsWith('de_'), url: 'https://firstmap.delaware.gov/' },
  { test: (k) => k.startsWith('ireland_'), url: 'https://data.gov.ie/' },
  { test: (k) => k.startsWith('uk_'), url: 'https://www.data.gov.uk/' },
  { test: (k) => k.startsWith('australia_'), url: 'https://data.gov.au/' },
  { test: (k) => k.startsWith('miami_'), url: 'https://www.miamidade.gov/globalgis/' },
  { test: (k) => k.startsWith('orlando_'), url: 'https://data-cityoforlando.opendata.arcgis.com/' },
  { test: (k) => k.startsWith('datasf_') || k.includes('datasf'), url: 'https://datasf.org/opendata/' },
  { test: (k) => k.startsWith('poi_padus_'), url: 'https://www.usgs.gov/programs/gap-analysis-project/science/pad-us-data-download' },
  { test: (k) => k.startsWith('median_sea_ice'), url: 'https://nsidc.org/' },
];

/**
 * Returns a public documentation or service URL for a legend layer key, if known.
 */
export function getLayerSourceUrl(legendKey: string | undefined): string | undefined {
  if (!legendKey) return undefined;
  if (NO_URL_PREFIXES.some((p) => legendKey.startsWith(p))) return undefined;

  const fromPoi = poiConfigManager.getPOIType(legendKey)?.sourceUrl;
  if (fromPoi) return fromPoi;

  const exact = LAYER_SOURCE_URL_EXACT[legendKey];
  if (exact) return exact;

  for (const { test, url } of LAYER_SOURCE_URL_RULES) {
    if (test(legendKey)) return url;
  }

  return undefined;
}
