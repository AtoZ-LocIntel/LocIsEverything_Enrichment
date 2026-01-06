/**
 * NOAA NMFS Critical Habitat Adapter
 * Service: https://maps.fisheries.noaa.gov/server/rest/services/All_NMFS_Critical_Habitat/MapServer
 * Supports point-in-polygon (for polygons) and proximity queries up to 100 miles (for all geometry types)
 * Contains multiple layers for NMFS ESA-listed species critical habitat
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://maps.fisheries.noaa.gov/server/rest/services/All_NMFS_Critical_Habitat/MapServer';

export interface NOAANMFSCriticalHabitatInfo {
  objectid: number | null;
  geometry?: any; // ESRI polygon geometry (rings) or polyline geometry (paths)
  distance_miles?: number;
  isContaining?: boolean;
  layerId: number; // Which layer this feature came from
  layerName: string; // Human-readable layer name
  geometryType?: 'polygon' | 'polyline'; // Geometry type
  attributes: Record<string, any>;
}

/**
 * Map enrichment ID to layer ID
 */
export const layerIdMap: Record<string, number> = {
  'noaa_nmfs_critical_habitat_all_critical_habitat_poly_20230502': 226,
  'noaa_nmfs_critical_habitat_all_critical_habitat_line_20220404': 2,
  'noaa_nmfs_critical_habitat_coral_acroporaglobiceps_20250715': 261,
  'noaa_nmfs_critical_habitat_coral_acroporaretusa_20250715': 262,
  'noaa_nmfs_critical_habitat_coral_acroporaspeciosa_20250715': 263,
  'noaa_nmfs_critical_habitat_coral_fimbriaphylliaparadivisa_20250715': 264,
  'noaa_nmfs_critical_habitat_coral_isoporacrateriformis_20250715': 265,
  'noaa_nmfs_critical_habitat_coral_boulder_star_20230809': 250,
  'noaa_nmfs_critical_habitat_coral_lobed_star_20230809': 251,
  'noaa_nmfs_critical_habitat_coral_mountainous_star_20230809': 252,
  'noaa_nmfs_critical_habitat_coral_rough_cactus_20230809': 254,
  'noaa_nmfs_critical_habitat_coral_pillar_20230809': 253,
  'noaa_nmfs_critical_habitat_coral_staghorn_20081126': 119,
  'noaa_nmfs_critical_habitat_coral_elkhorn_20081126': 118,
  'noaa_nmfs_critical_habitat_grouper_nassau_20240102': 260,
  'noaa_nmfs_critical_habitat_bocaccio_puget_sound_georgia_basin_dps_20141113': 207,
  'noaa_nmfs_critical_habitat_eulachon_southern_dps_20111020': 208,
  'noaa_nmfs_critical_habitat_rockfish_yelloweye_puget_sound_georgia_basin_dps_20141113': 209,
  'noaa_nmfs_critical_habitat_salmon_atlantic_gulf_of_maine_dps_20090619': 166,
  'noaa_nmfs_critical_habitat_salmon_chinook_california_coastal_esu_20050902': 133,
  'noaa_nmfs_critical_habitat_salmon_chinook_central_valley_spring_run_esu_20050902': 135,
  'noaa_nmfs_critical_habitat_salmon_chinook_lower_columbia_river_esu_20050902': 137,
  'noaa_nmfs_critical_habitat_salmon_chinook_puget_sound_esu_20050902_line': 139,
  'noaa_nmfs_critical_habitat_salmon_chinook_puget_sound_esu_20050902_poly': 140,
  'noaa_nmfs_critical_habitat_salmon_chinook_sacramento_river_winter_run_esu_19930616_line': 142,
  'noaa_nmfs_critical_habitat_salmon_chinook_sacramento_river_winter_run_esu_19930616_poly': 143,
  'noaa_nmfs_critical_habitat_salmon_chinook_snake_river_fall_run_esu_19931228': 145,
  'noaa_nmfs_critical_habitat_salmon_chinook_upper_columbia_river_spring_run_esu_20050902': 147,
  'noaa_nmfs_critical_habitat_salmon_chinook_upper_willamette_river_esu_20050902': 149,
  'noaa_nmfs_critical_habitat_salmon_chum_columbia_river_esu_20050902': 151,
  'noaa_nmfs_critical_habitat_salmon_chum_hood_canal_summer_run_esu_20050902_line': 153,
  'noaa_nmfs_critical_habitat_salmon_chum_hood_canal_summer_run_esu_20050902_poly': 154,
  'noaa_nmfs_critical_habitat_salmon_coho_central_california_coast_esu_19990505': 156,
  'noaa_nmfs_critical_habitat_salmon_coho_lower_columbia_river_esu_20160224': 158,
  'noaa_nmfs_critical_habitat_salmon_coho_oregon_coast_esu_20080211': 160,
  'noaa_nmfs_critical_habitat_salmon_sockeye_ozette_lake_esu_20050902': 162,
  'noaa_nmfs_critical_habitat_salmon_sockeye_snake_river_esu_19931228_line': 164,
  'noaa_nmfs_critical_habitat_salmon_sockeye_snake_river_esu_19931228_poly': 165,
  'noaa_nmfs_critical_habitat_sawfish_smalltooth_us_dps_20090902': 168,
  'noaa_nmfs_critical_habitat_steelhead_california_central_valley_dps_20050902': 169,
  'noaa_nmfs_critical_habitat_steelhead_central_california_coast_dps_20050902': 170,
  'noaa_nmfs_critical_habitat_steelhead_lower_columbia_river_dps_20050902': 171,
  'noaa_nmfs_critical_habitat_steelhead_middle_columbia_river_dps_20050902': 172,
  'noaa_nmfs_critical_habitat_steelhead_northern_california_dps_20050902': 173,
  'noaa_nmfs_critical_habitat_steelhead_puget_sound_dps_20160224': 174,
  'noaa_nmfs_critical_habitat_steelhead_snake_river_basin_dps_20050902': 175,
  'noaa_nmfs_critical_habitat_steelhead_south_central_california_coast_dps_20050902': 176,
  'noaa_nmfs_critical_habitat_steelhead_southern_california_dps_20050902': 177,
  'noaa_nmfs_critical_habitat_steelhead_upper_columbia_river_dps_20050902': 178,
  'noaa_nmfs_critical_habitat_steelhead_upper_willamette_river_dps_20050902': 179,
  'noaa_nmfs_critical_habitat_sturgeon_atlantic_atlantic_subspecies_carolina_dps_20170817': 180,
  'noaa_nmfs_critical_habitat_sturgeon_atlantic_atlantic_subspecies_chesapeake_bay_dps_20170817': 181,
  'noaa_nmfs_critical_habitat_sturgeon_atlantic_atlantic_subspecies_gulf_of_maine_dps_20170817': 182,
  'noaa_nmfs_critical_habitat_sturgeon_atlantic_atlantic_subspecies_new_york_bight_dps_20170817': 183,
  'noaa_nmfs_critical_habitat_sturgeon_atlantic_atlantic_subspecies_south_atlantic_dps_20170817': 184,
  'noaa_nmfs_critical_habitat_sturgeon_atlantic_gulf_subspecies_20030319_line': 185,
  'noaa_nmfs_critical_habitat_sturgeon_atlantic_gulf_subspecies_20030319_poly': 186,
  'noaa_nmfs_critical_habitat_sturgeon_green_southern_dps_20091009_line': 187,
  'noaa_nmfs_critical_habitat_sturgeon_green_southern_dps_20091009_poly': 188,
  'noaa_nmfs_critical_habitat_abalone_black_20111027': 120,
  'noaa_nmfs_critical_habitat_sea_turtle_green_north_atlantic_dps_19980902': 203,
  'noaa_nmfs_critical_habitat_sea_turtle_hawksbill_19980902': 204,
  'noaa_nmfs_critical_habitat_sea_turtle_leatherback_20120126': 205,
  'noaa_nmfs_critical_habitat_sea_turtle_loggerhead_northwest_atlantic_ocean_dps_20140710': 206,
  'noaa_nmfs_critical_habitat_seal_bearded_beringia_dps_20220401': 198,
  'noaa_nmfs_critical_habitat_seal_hawaiian_monk_20150821_line': 199,
  'noaa_nmfs_critical_habitat_seal_hawaiian_monk_20150821_poly': 200,
  'noaa_nmfs_critical_habitat_sea_lion_steller_western_dps_19940615': 201,
  'noaa_nmfs_critical_habitat_seal_ringed_arctic_subspecies_20220401': 202,
  'noaa_nmfs_critical_habitat_whale_beluga_cook_inlet_dps_20110411': 190,
  'noaa_nmfs_critical_habitat_whale_false_killer_main_hawaiian_islands_insular_dps_20180724': 191,
  'noaa_nmfs_critical_habitat_whale_humpback_central_america_dps_20210421': 192,
  'noaa_nmfs_critical_habitat_whale_humpback_mexico_dps_20210421': 193,
  'noaa_nmfs_critical_habitat_whale_humpback_western_north_pacific_dps_20210421': 194,
  'noaa_nmfs_critical_habitat_whale_killer_southern_resident_dps_20210802': 195,
  'noaa_nmfs_critical_habitat_whale_north_atlantic_right_20160127': 196,
  'noaa_nmfs_critical_habitat_whale_north_pacific_right_20080408': 197,
  'noaa_nmfs_critical_habitat_proposed_rices_whale_20230724': 244,
  'noaa_nmfs_critical_habitat_proposed_sea_turtle_green_central_north_pacific_dps_20230719': 238,
  'noaa_nmfs_critical_habitat_proposed_sea_turtle_green_central_south_pacific_dps_20230719': 239,
  'noaa_nmfs_critical_habitat_proposed_sea_turtle_green_central_west_pacific_dps_20230719': 240,
  'noaa_nmfs_critical_habitat_proposed_sea_turtle_green_east_pacific_dps_20230719': 241,
  'noaa_nmfs_critical_habitat_proposed_sea_turtle_green_north_atlantic_dps_20230719': 242,
  'noaa_nmfs_critical_habitat_proposed_sea_turtle_green_south_atlantic_dps_20230719': 243,
};

/**
 * Layer names mapping
 */
const LAYER_NAMES: Record<number, string> = {
  226: 'All_critical_habitat_poly_20230502',
  2: 'All_critical_habitat_line_20220404',
  261: 'Coral_AcroporaGlobiceps_20250715',
  262: 'Coral_AcroporaRetusa_20250715',
  263: 'Coral_AcroporaSpeciosa_20250715',
  264: 'Coral_FimbriaphylliaParadivisa_20250715',
  265: 'Coral_IsoporaCrateriformis_20250715',
  250: 'CoralBoulderStar_20230809',
  251: 'CoralLobedStar_20230809',
  252: 'CoralMountainousStar_20230809',
  254: 'CoralRoughCactus_20230809',
  253: 'CoralPillar_20230809',
  119: 'CoralStaghorn_20081126',
  118: 'CoralElkhorn_20081126',
  260: 'GrouperNassau_20240102',
  207: 'Bocaccio_PugetSoundGeorgiaBasinDPS_20141113',
  208: 'Eulachon_SouthernDPS_20111020',
  209: 'RockfishYelloweye_PugetSoundGeorgiaBasinDPS_20141113',
  166: 'SalmonAtlantic_GulfofMaineDPS_20090619',
  133: 'SalmonChinook_CaliforniaCoastalESU_20050902',
  135: 'SalmonChinook_CentralValleyspringrunESU_20050902',
  137: 'SalmonChinook_LowerColumbiaRiverESU_20050902',
  139: 'SalmonChinook_PugetSoundESU_20050902_line',
  140: 'SalmonChinook_PugetSoundESU_20050902_poly',
  142: 'SalmonChinook_SacramentoRiverwinterrunESU_19930616_line',
  143: 'SalmonChinook_SacramentoRiverwinterrunESU_19930616_poly',
  145: 'SalmonChinook_SnakeRiverfallrunESU_19931228',
  147: 'SalmonChinook_UpperColumbiaRiverspringrunESU_20050902',
  149: 'SalmonChinook_UpperWillametteRiverESU_20050902',
  151: 'SalmonChum_ColumbiaRiverESU_20050902',
  153: 'SalmonChum_HoodCanalsummerrunESU_20050902_line',
  154: 'SalmonChum_HoodCanalsummerrunESU_20050902_poly',
  156: 'SalmonCoho_CentralCaliforniaCoastESU_19990505',
  158: 'SalmonCoho_LowerColumbiaRiverESU_20160224',
  160: 'SalmonCoho_OregonCoastESU_20080211',
  162: 'SalmonSockeye_OzetteLakeESU_20050902',
  164: 'SalmonSockeye_SnakeRiverESU_19931228_line',
  165: 'SalmonSockeye_SnakeRiverESU_19931228_poly',
  168: 'SawfishSmalltooth_USDPS_20090902',
  169: 'Steelhead_CaliforniaCentralValleyDPS_20050902',
  170: 'Steelhead_CentralCaliforniaCoastDPS_20050902',
  171: 'Steelhead_LowerColumbiaRiverDPS_20050902',
  172: 'Steelhead_MiddleColumbiaRiverDPS_20050902',
  173: 'Steelhead_NorthernCaliforniaDPS_20050902',
  174: 'Steelhead_PugetSoundDPS_20160224',
  175: 'Steelhead_SnakeRiverBasinDPS_20050902',
  176: 'Steelhead_SouthCentralCaliforniaCoastDPS_20050902',
  177: 'Steelhead_SouthernCaliforniaDPS_20050902',
  178: 'Steelhead_UpperColumbiaRiverDPS_20050902',
  179: 'Steelhead_UpperWillametteRiverDPS_20050902',
  180: 'SturgeonAtlantic_AtlanticSubspecies_CarolinaDPS_20170817',
  181: 'SturgeonAtlantic_AtlanticSubspecies_ChesapeakeBayDPS_20170817',
  182: 'SturgeonAtlantic_AtlanticSubspecies_GulfofMaineDPS_20170817',
  183: 'SturgeonAtlantic_AtlanticSubspecies_NewYorkBightDPS_20170817',
  184: 'SturgeonAtlantic_AtlanticSubspecies_SouthAtlanticDPS_20170817',
  185: 'SturgeonAtlantic_GulfSubspecies_20030319_line',
  186: 'SturgeonAtlantic_GulfSubspecies_20030319_poly',
  187: 'SturgeonGreen_SouthernDPS_20091009_line',
  188: 'SturgeonGreen_SouthernDPS_20091009_poly',
  120: 'AbaloneBlack_20111027',
  203: 'SeaTurtleGreen_NorthAtlanticDPS_19980902',
  204: 'SeaTurtleHawksbill_19980902',
  205: 'SeaTurtleLeatherback_20120126',
  206: 'SeaTurtleLoggerhead_NorthwestAtlanticOceanDPS_20140710',
  198: 'SealBearded_BeringiaDPS_20220401',
  199: 'SealHawaiianMonk_20150821_line',
  200: 'SealHawaiianMonk_20150821_poly',
  201: 'SeaLionSteller_WesternDPS_19940615',
  202: 'SealRinged_ArcticSubspecies_20220401',
  190: 'WhaleBeluga_CookInletDPS_20110411',
  191: 'WhaleFalseKiller_MainHawaiianIslandsInsularDPS_20180724',
  192: 'WhaleHumpback_CentralAmericaDPS_20210421',
  193: 'WhaleHumpback_MexicoDPS_20210421',
  194: 'WhaleHumpback_WesternNorthPacificDPS_20210421',
  195: 'WhaleKiller_SouthernResidentDPS_20210802',
  196: 'WhaleNorthAtlanticRight_20160127',
  197: 'WhaleNorthPacificRight_20080408',
  244: 'Proposed_RicesWhale_20230724',
  238: 'Proposed_SeaTurtleGreen_CentralNorthPacificDPS_20230719',
  239: 'Proposed_SeaTurtleGreen_CentralSouthPacificDPS_20230719',
  240: 'Proposed_SeaTurtleGreen_CentralWestPacificDPS_20230719',
  241: 'Proposed_SeaTurtleGreen_EastPacificDPS_20230719',
  242: 'Proposed_SeaTurtleGreen_NorthAtlanticDPS_20230719',
  243: 'Proposed_SeaTurtleGreen_SouthAtlanticDPS_20230719',
};

/**
 * Determine geometry type from layer name
 */
function getGeometryType(layerName: string): 'polygon' | 'polyline' {
  if (layerName.includes('_line') || layerName.includes('_Line') || layerName === 'All_critical_habitat_line_20220404') {
    return 'polyline';
  }
  return 'polygon'; // Default to polygon (includes _poly and regular layers)
}

/**
 * Calculate distance from point to polygon (minimum distance to any vertex or edge)
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  rings.forEach((ring: number[][]) => {
    // Check distance to each vertex
    ring.forEach((coord: number[]) => {
      // ESRI coordinates are [lon, lat] format
      const ringLat = coord[1];
      const ringLon = coord[0];
      
      const R = 3959; // Earth's radius in miles
      const dLat = (ringLat - lat) * Math.PI / 180;
      const dLon = (ringLon - lon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(ringLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      if (distance < minDistance) minDistance = distance;
    });
    
    // Check distance to each edge
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
      if (dist < minDistance) minDistance = dist;
    }
  });
  
  return minDistance;
}

/**
 * Calculate distance from point to polyline
 */
function distanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  if (!paths || paths.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  paths.forEach((path: number[][]) => {
    // Check distance to each vertex
    path.forEach((coord: number[]) => {
      const pathLat = coord[1];
      const pathLon = coord[0];
      
      const R = 3959; // Earth's radius in miles
      const dLat = (pathLat - lat) * Math.PI / 180;
      const dLon = (pathLon - lon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(pathLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      if (distance < minDistance) minDistance = distance;
    });
    
    // Check distance to each segment
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
      if (dist < minDistance) minDistance = dist;
    }
  });
  
  return minDistance;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(
  lat: number, lon: number,
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const A = lon - lon1;
  const B = lat - lat1;
  const C = lon2 - lon1;
  const D = lat2 - lat1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx, yy;
  if (param < 0) {
    xx = lon1;
    yy = lat1;
  } else if (param > 1) {
    xx = lon2;
    yy = lat2;
  } else {
    xx = lon1 + param * C;
    yy = lat1 + param * D;
  }
  const R = 3959; // Earth's radius in miles
  const dLat = (yy - lat) * Math.PI / 180;
  const dLon = (xx - lon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(yy * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Point-in-polygon check using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  const outerRing = rings[0];
  if (!outerRing || outerRing.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0]; // lon
    const yi = outerRing[i][1]; // lat
    const xj = outerRing[j][0]; // lon
    const yj = outerRing[j][1]; // lat
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  // Check if point is in any holes
  for (let h = 1; h < rings.length; h++) {
    const hole = rings[h];
    if (!hole || hole.length < 3) continue;
    
    let inHole = false;
    for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
      const xi = hole[i][0];
      const yi = hole[i][1];
      const xj = hole[j][0];
      const yj = hole[j][1];
      
      const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inHole = !inHole;
    }
    
    if (inHole) {
      inside = false; // Point is in a hole, so not inside polygon
      break;
    }
  }
  
  return inside;
}

/**
 * Query NOAA NMFS Critical Habitat layer for point-in-polygon (polygons) and proximity (all)
 * Supports proximity queries up to 100 miles
 */
export async function queryNMFSCriticalHabitatLayer(
  layerId: number,
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<NOAANMFSCriticalHabitatInfo[]> {
  try {
    const radiusKm = (radiusMiles || 100) * 1.60934;
    const maxRecordCount = 2000;
    const layerName = LAYER_NAMES[layerId] || `Layer ${layerId}`;
    const geometryType = getGeometryType(layerName);

    console.log(
      `🐟 Querying NOAA NMFS Critical Habitat ${layerName} (Layer ${layerId}, ${geometryType}) for coordinates [${lat}, ${lon}] within ${radiusMiles || 100} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    // For polygons, check for point-in-polygon (containing features)
    if (geometryType === 'polygon') {
      const pointInPolygonUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
      pointInPolygonUrl.searchParams.set('f', 'json');
      pointInPolygonUrl.searchParams.set('where', '1=1');
      pointInPolygonUrl.searchParams.set('outFields', '*');
      pointInPolygonUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      pointInPolygonUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      pointInPolygonUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      pointInPolygonUrl.searchParams.set('inSR', '4326');
      pointInPolygonUrl.searchParams.set('outSR', '4326');
      pointInPolygonUrl.searchParams.set('returnGeometry', 'true');
      pointInPolygonUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());

      const pointInPolygonResponse = await fetchJSONSmart(pointInPolygonUrl.toString());
      
      if (pointInPolygonResponse.error) {
        console.warn(`⚠️ NOAA NMFS Critical Habitat ${layerName} point-in-polygon query error: ${JSON.stringify(pointInPolygonResponse.error)}`);
      } else {
        const containingFeatures = pointInPolygonResponse.features || [];
        allFeatures = allFeatures.concat(containingFeatures.map((f: any) => ({ ...f, _isContaining: true })));
      }
    }

    // Query for proximity features if radius is specified
    if (radiusMiles && radiusMiles > 0) {
      while (hasMore) {
        const proximityUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
        proximityUrl.searchParams.set('f', 'json');
        proximityUrl.searchParams.set('where', '1=1');
        proximityUrl.searchParams.set('outFields', '*');
        proximityUrl.searchParams.set('geometry', JSON.stringify({
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        }));
        proximityUrl.searchParams.set('geometryType', 'esriGeometryPoint');
        proximityUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
        proximityUrl.searchParams.set('distance', radiusKm.toString());
        proximityUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
        proximityUrl.searchParams.set('inSR', '4326');
        proximityUrl.searchParams.set('outSR', '4326');
        proximityUrl.searchParams.set('returnGeometry', 'true');
        proximityUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
        proximityUrl.searchParams.set('resultOffset', resultOffset.toString());

        const proximityResponse = await fetchJSONSmart(proximityUrl.toString());

        if (proximityResponse.error) {
          console.warn(`⚠️ NOAA NMFS Critical Habitat ${layerName} proximity query error: ${JSON.stringify(proximityResponse.error)}`);
          hasMore = false;
        } else {
          const batchFeatures = proximityResponse.features || [];
          
          // Filter out duplicates (features already found in point-in-polygon query)
          const existingObjectIds = new Set(allFeatures.map((f: any) => f.attributes?.OBJECTID || f.attributes?.objectid || f.OBJECTID || f.objectid));
          const newFeatures = batchFeatures.filter((f: any) => {
            const objectId = f.attributes?.OBJECTID || f.attributes?.objectid || f.OBJECTID || f.objectid;
            return !existingObjectIds.has(objectId);
          });
          
          allFeatures = allFeatures.concat(newFeatures);
          hasMore = batchFeatures.length === maxRecordCount || proximityResponse.exceededTransferLimit === true;
          resultOffset += batchFeatures.length;

          if (resultOffset > 100000) {
            console.warn(`⚠️ NOAA NMFS Critical Habitat ${layerName}: Stopping pagination at 100k records for safety`);
            hasMore = false;
          }

          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
    }

    // Process features and calculate distances and point-in-polygon
    const processedFeatures: NOAANMFSCriticalHabitatInfo[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || 0;
        const isContaining = feature._isContaining || false;

        let distanceMiles = 0; // Default for containing features
        let detectedGeometryType: 'polygon' | 'polyline' = geometryType;

        // Determine geometry type from feature
        if (geometry) {
          if (geometry.rings && geometry.rings.length > 0) {
            detectedGeometryType = 'polygon';
            if (isContaining) {
              distanceMiles = 0; // Point is inside polygon
            } else {
              // Verify point-in-polygon (server might return features that don't actually contain)
              const actuallyContaining = pointInPolygon(lat, lon, geometry.rings);
              if (actuallyContaining) {
                distanceMiles = 0;
              } else {
                distanceMiles = distanceToPolygon(lat, lon, geometry.rings);
              }
            }
          } else if (geometry.paths && geometry.paths.length > 0) {
            detectedGeometryType = 'polyline';
            // Polylines don't support point-in-polygon, only proximity
            distanceMiles = distanceToPolyline(lat, lon, geometry.paths);
          } else if (!isContaining && radiusMiles) {
            distanceMiles = radiusMiles; // Default to max radius if no geometry
          }
        } else if (!isContaining && radiusMiles) {
          distanceMiles = radiusMiles; // Default to max radius if no geometry
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          isContaining: isContaining || (detectedGeometryType === 'polygon' && distanceMiles === 0),
          layerId,
          layerName,
          geometryType: detectedGeometryType,
        };
      }
    );

    // Sort by containing first, then by distance
    processedFeatures.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${processedFeatures.length} NOAA NMFS Critical Habitat ${layerName} feature(s) (${processedFeatures.filter(f => f.isContaining).length} containing, ${processedFeatures.filter(f => !f.isContaining).length} nearby)`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ NOAA NMFS Critical Habitat ${LAYER_NAMES[layerId] || `Layer ${layerId}`} API Error:`, error);
    throw error;
  }
}

// Export individual query functions for each layer
export const getNOAANMFSCriticalHabitatLayer226 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(226, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer2 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(2, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer261 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(261, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer262 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(262, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer263 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(263, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer264 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(264, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer265 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(265, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer250 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(250, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer251 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(251, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer252 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(252, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer254 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(254, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer253 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(253, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer119 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(119, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer118 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(118, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer260 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(260, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer207 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(207, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer208 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(208, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer209 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(209, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer166 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(166, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer133 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(133, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer135 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(135, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer137 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(137, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer139 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(139, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer140 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(140, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer142 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(142, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer143 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(143, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer145 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(145, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer147 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(147, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer149 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(149, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer151 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(151, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer153 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(153, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer154 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(154, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer156 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(156, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer158 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(158, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer160 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(160, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer162 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(162, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer164 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(164, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer165 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(165, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer168 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(168, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer169 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(169, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer170 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(170, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer171 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(171, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer172 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(172, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer173 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(173, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer174 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(174, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer175 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(175, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer176 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(176, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer177 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(177, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer178 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(178, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer179 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(179, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer180 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(180, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer181 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(181, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer182 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(182, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer183 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(183, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer184 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(184, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer185 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(185, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer186 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(186, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer187 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(187, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer188 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(188, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer120 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(120, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer203 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(203, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer204 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(204, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer205 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(205, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer206 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(206, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer198 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(198, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer199 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(199, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer200 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(200, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer201 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(201, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer202 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(202, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer190 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(190, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer191 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(191, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer192 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(192, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer193 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(193, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer194 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(194, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer195 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(195, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer196 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(196, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer197 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(197, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer244 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(244, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer238 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(238, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer239 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(239, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer240 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(240, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer241 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(241, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer242 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(242, lat, lon, Math.min(radiusMiles || 100, 100));
export const getNOAANMFSCriticalHabitatLayer243 = (lat: number, lon: number, radiusMiles?: number) => queryNMFSCriticalHabitatLayer(243, lat, lon, Math.min(radiusMiles || 100, 100));

