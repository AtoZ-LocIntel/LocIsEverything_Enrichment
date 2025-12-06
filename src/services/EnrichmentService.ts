import { GeocodeResult } from '../lib/types';
import { EnrichmentResult } from '../App';
import { getUSDAWildfireRiskData } from '../adapters/usdaWildfireRisk';
import { getSoilCarbonDensityData } from '../adapters/soilCarbonDensity';
import { getNHHouseDistrictData } from '../adapters/nhHouseDistricts';
import { getNHVotingWardData } from '../adapters/nhVotingWards';
import { getNHSenateDistrictData } from '../adapters/nhSenateDistricts';
import { getNHSSURGOContainingData } from '../adapters/nhSSURGO';
import { getNHBedrockGeologyContainingData } from '../adapters/nhBedrockGeology';
import { getNHGeographicNamesNearbyData } from '../adapters/nhGeographicNames';
import { getNHParcelData } from '../adapters/nhParcels';
import { getNHKeyDestinationsData } from '../adapters/nhKeyDestinations';
import { getNHNursingHomesData } from '../adapters/nhNursingHomes';
import { getNHEMSData } from '../adapters/nhEMS';
import { getNHFireStationsData } from '../adapters/nhFireStations';
import { getNHPlacesOfWorshipData } from '../adapters/nhPlacesOfWorship';
import { getNHHospitalsData } from '../adapters/nhHospitals';
import { getNHPublicWatersAccessData } from '../adapters/nhPublicWatersAccess';
import { getNHLawEnforcementData } from '../adapters/nhLawEnforcement';
import { getNHRecreationTrailsData } from '../adapters/nhRecreationTrails';
import { getNHStoneWallsData } from '../adapters/nhStoneWalls';
import { getNHDOTRoadsData } from '../adapters/nhDOTRoads';
import { getNHRailroadsData } from '../adapters/nhRailroads';
import { getNHTransmissionPipelinesData } from '../adapters/nhTransmissionPipelines';
import { getNHCellTowersData } from '../adapters/nhCellTowers';
import { getNHUndergroundStorageTanksData } from '../adapters/nhUndergroundStorageTanks';
import { getNHWaterWellsData } from '../adapters/nhWaterWells';
import { getNHPublicWaterSupplyWellsData } from '../adapters/nhPublicWaterSupplyWells';
import { getNHRemediationSitesData } from '../adapters/nhRemediationSites';
import { getNHAutomobileSalvageYardsData } from '../adapters/nhAutomobileSalvageYards';
import { getNHSolidWasteFacilitiesData } from '../adapters/nhSolidWasteFacilities';
import { getNHSourceWaterProtectionAreaData } from '../adapters/nhSourceWaterProtectionAreas';
// NH NWI Plus functions are imported dynamically in the method
import { getMADEPWetlandsContainingData, getMADEPWetlandsNearbyData, MADEPWetland } from '../adapters/maDEPWetlands';
import { getMAOpenSpaceContainingData, getMAOpenSpaceNearbyData, MAOpenSpace } from '../adapters/maOpenSpace';
import { getCapeCodZoningContainingData, getCapeCodZoningNearbyData, CapeCodZoning } from '../adapters/capeCodZoning';
import { getMATrailsData } from '../adapters/maTrails';
import { getMANHESPNaturalCommunitiesContainingData, getMANHESPNaturalCommunitiesNearbyData } from '../adapters/maNHESPNaturalCommunities';
import { getMALakesAndPondsContainingData, getMALakesAndPondsNearbyData } from '../adapters/maLakesAndPonds';
import { getMARiversAndStreamsNearbyData } from '../adapters/maRiversAndStreams';
import { getMARegionalPlanningAgenciesContainingData } from '../adapters/maRegionalPlanningAgencies';
import { getNationalMarineSanctuariesContainingData, getNationalMarineSanctuariesNearbyData } from '../adapters/nationalMarineSanctuaries';
import { getMAACECsContainingData, getMAACECsNearbyData } from '../adapters/maACECs';
import { getMAParcelData } from '../adapters/maParcels';
import { getCTParcelData } from '../adapters/ctParcels';
import { getCTBuildingFootprintData } from '../adapters/ctBuildingFootprints';
import { getCTRoadsData } from '../adapters/ctRoads';
import { getCTUrgentCareData } from '../adapters/ctUrgentCare';
import { getCTDeepPropertyData } from '../adapters/ctDeepProperties';
import { getCTTribalLandData } from '../adapters/ctTribalLands';
import { getCTDrinkingWaterWatershedData } from '../adapters/ctDrinkingWaterWatersheds';
import { getCTBroadbandAvailabilityData } from '../adapters/ctBroadbandAvailability';
import { getCTWaterPollutionControlData } from '../adapters/ctWaterPollutionControl';
import { getCTBoatLaunchesData } from '../adapters/ctBoatLaunches';
import { getCTFederalOpenSpaceData } from '../adapters/ctFederalOpenSpace';
import { getCTHUCWatershedData } from '../adapters/ctHUCWatersheds';
import { getCTSoilsParentMaterialData } from '../adapters/ctSoilsParentMaterial';
import { getCAPowerOutageAreaData } from '../adapters/caPowerOutageAreas';
import { getCAFirePerimetersAllData } from '../adapters/caFirePerimetersAll';
import { getCAFirePerimetersRecentLargeData } from '../adapters/caFirePerimetersRecentLarge';
import { getCAFirePerimeters1950Data } from '../adapters/caFirePerimeters1950';
import { getCALandOwnershipData } from '../adapters/caLandOwnership';
import { getCACGSLandslideZonesData } from '../adapters/caCgsLandslideZones';
import { getCACGSLiquefactionZonesData } from '../adapters/caCgsLiquefactionZones';
import { getCAWildlandFireDirectProtectionData } from '../adapters/caWildlandFireDirectProtection';
import { getCACalVTPTreatmentAreasData } from '../adapters/caCalVTPTreatmentAreas';
import { getCAStateParksEntryPointsData } from '../adapters/caStateParksEntryPoints';
import { getCAStateParksParkingLotsData } from '../adapters/caStateParksParkingLots';
import { getCAStateParksBoundariesData } from '../adapters/caStateParksBoundaries';
import { getCAStateParksCampgroundsData } from '../adapters/caStateParksCampgrounds';
import { getCAStateParksRecreationalRoutesData } from '../adapters/caStateParksRecreationalRoutes';
import { getCAMarineOilTerminalsData } from '../adapters/caMarineOilTerminals';
import { getCAPostfireDamageInspectionsData } from '../adapters/caPostfireDamageInspections';
import { getCAMediumHeavyDutyInfrastructureData } from '../adapters/caMediumHeavyDutyInfrastructure';
import { getCAFRAPFacilitiesData } from '../adapters/caFrapFacilities';
import { getCASolarFootprintsData } from '../adapters/caSolarFootprints';
import { getCANaturalGasServiceAreasData } from '../adapters/caNaturalGasServiceAreas';
import { getCAPLSSSectionsData } from '../adapters/caPlssSections';
import { getCAGeothermalWellsData } from '../adapters/caGeothermalWells';
import { getCAOilGasWellsData } from '../adapters/caOilGasWells';
import { getCAEcoRegionsData } from '../adapters/caEcoRegions';
import { getCALosAngelesZoningData } from '../adapters/caLosAngelesZoning';
import { getLACountyArtsRecreationData, getLACountyEducationData, getLACountyHospitalsData, getLACountyMunicipalServicesData, getLACountyPhysicalFeaturesData, getLACountyPublicSafetyData, getLACountyTransportationData } from '../adapters/laCountyPOI';
import { getLACountyHistoricCulturalMonumentsData } from '../adapters/laCountyHistoricCulturalMonuments';
import { getLACountyHousingLeadRiskData } from '../adapters/laCountyHousingLeadRisk';
import { getLACountySchoolDistrictBoundariesData } from '../adapters/laCountySchoolDistrictBoundaries';
import { getLACountyMetroLinesData } from '../adapters/laCountyMetroLines';
import { getCACondorRangeData } from '../adapters/caCondorRange';
import { getCABlackBearRangeData } from '../adapters/caBlackBearRange';
import { getCABrushRabbitRangeData } from '../adapters/caBrushRabbitRange';
import { getCAGreatGrayOwlRangeData } from '../adapters/caGreatGrayOwlRange';
import { getCASandhillCraneRangeData } from '../adapters/caSandhillCraneRange';
import { getCAHighwayRestAreasData } from '../adapters/caHighwayRestAreas';
import { getDEStateForestData } from '../adapters/deStateForest';
import { getDEPinePlantationData } from '../adapters/dePinePlantations';
import { getDEUrbanTreeCanopyData } from '../adapters/deUrbanTreeCanopy';
import { getDEForestCover2007Data } from '../adapters/deForestCover2007';
import { getDENoBuildPointsBayData } from '../adapters/deNoBuildPointsBay';
import { getDENoBuildLineBayData } from '../adapters/deNoBuildLineBay';
import { getDENoBuildPointsOceanData } from '../adapters/deNoBuildPointsOcean';
import { getDENoBuildLineOceanData } from '../adapters/deNoBuildLineOcean';
import { getDEParkFacilitiesData } from '../adapters/deParkFacilities';
import { getDEChildCareCentersData } from '../adapters/deChildCareCenters';
import { getDEFishingAccessData, getDETroutStreamsData } from '../adapters/deFishingAccess';
import { getDEPublicSchoolsData, getDEPrivateSchoolsData, getDEVoTechDistrictsData, getDESchoolDistrictsData } from '../adapters/deSchools';
import { getDEStandsBlindsFieldsData, getDEBoatRampsData, getDEFacilitiesData, getDEParkingData, getDERestroomsData, getDESafetyZonesData, getDEWildlifeManagementZonesData } from '../adapters/deWildlife';
import { getDERailLinesData } from '../adapters/deRailLines';
import { getNJParcelsData } from '../adapters/njParcels';
import { getNJAddressPointsData } from '../adapters/njAddressPoints';
import { getNJBusStopsData } from '../adapters/njBusStops';
import { getNJSafetyServicePatrolData } from '../adapters/njSafetyServicePatrol';
import { getNJServiceAreasData } from '../adapters/njServiceAreas';
import { getNJRoadwayNetworkData } from '../adapters/njRoadwayNetwork';
import { getNJKnownContaminatedSitesData } from '../adapters/njKnownContaminatedSites';
import { getNJAlternativeFuelStationsData } from '../adapters/njAlternativeFuelStations';
import { getNJPowerPlantsData } from '../adapters/njPowerPlants';
import { getNJPublicSolarFacilitiesData } from '../adapters/njPublicSolarFacilities';
import { getNJPublicPlacesToKeepCoolData } from '../adapters/njPublicPlacesToKeepCool';
import { getDENaturalAreasData } from '../adapters/deNaturalAreas';
import { getDEOutdoorRecreationParksTrailsLandsData } from '../adapters/deOutdoorRecreationParksTrailsLands';
import { getDELandWaterConservationFundData } from '../adapters/deLandWaterConservationFund';
import { getDENaturePreservesData } from '../adapters/deNaturePreserves';
import { getDEOutdoorRecreationAreasData } from '../adapters/deOutdoorRecreationAreas';
import { getDEOutdoorRecreationParksTrailsOpenSpaceData } from '../adapters/deOutdoorRecreationParksTrailsOpenSpace';
import { getDEPublicProtectedLandsData } from '../adapters/dePublicProtectedLands';
import { getDEConservationEasementsData } from '../adapters/deConservationEasements';
import { getDETrailsPathwaysData } from '../adapters/deTrailsPathways';
import { getDESeasonalRestrictedAreasData } from '../adapters/deSeasonalRestrictedAreas';
import { getDEPermanentRestrictedAreasData } from '../adapters/dePermanentRestrictedAreas';
import { getDEWildlifeAreaBoundariesData } from '../adapters/deWildlifeAreaBoundaries';
import { getDEParcelData } from '../adapters/deParcels';
import { getDELULCData } from '../adapters/deLULC';
import { getTerrainAnalysis } from './ElevationService';
import { queryATFeatures } from '../adapters/appalachianTrail';
import { queryPCTFeatures } from '../adapters/pacificCrestTrail';
import { EPATRIService } from '../adapters/epaTRI';
import { EPAWalkabilityService } from '../adapters/epaWalkability';
import { FWSSpeciesService } from '../adapters/fwsSpecies';
import { AURORA_VIEWING_LOCATIONS } from '../data/auroraLocations';
import { fetchEBirdHotspots, fetchEBirdRecentObservations } from '../utils/eBird';
import { poiConfigManager } from '../lib/poiConfig';

// CORS proxy helpers from original geocoder.html
const USE_CORS_PROXY = true;
const CORS_PROXIES = [
  { type: "prefix", value: "https://corsproxy.io/?" },
  { type: "wrap", value: "https://api.allorigins.win/raw?url=" },
  { type: "prefix", value: "https://cors-anywhere.herokuapp.com/" }
];

// Rate limiting constants
const NOMINATIM_RATE_LIMIT_MS = 1100; // 1 request per second + buffer

function proxied(url: string, which: number = 0): string {
  const p = CORS_PROXIES[which];
  if (!p) return url;
  return p.type === "prefix" ? (p.value + url) : (p.value + encodeURIComponent(url));
}

export async function fetchJSONSmart(url: string, opts: RequestInit = {}, backoff: number = 200): Promise<any> {
  // When CORS proxy is disabled, only try direct URL
  const attempts = USE_CORS_PROXY ? [url, proxied(url, 0), proxied(url, 1), proxied(url, 2)] : [url];
  let err: any;
  
  for (let i = 0; i < attempts.length; i++) {
    try {
      console.log(`🌐 Attempt ${i + 1}: Fetching from ${attempts[i]}`);
      
      const res = await fetch(attempts[i], { 
        ...opts, 
        headers: { 
          "Accept": "application/json", 
          ...(opts.headers || {}) 
        } 
      });
      
      if (!res.ok) {
        console.warn(`⚠️ HTTP ${res.status} from ${attempts[i]}`);
        throw new Error(`HTTP ${res.status}`);
      }
      
      const text = await res.text();
      
      // Check if response is HTML (error page) instead of JSON
      if (text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE')) {
        console.warn(`⚠️ Received HTML instead of JSON from ${attempts[i]}:`, text.substring(0, 200));
        throw new Error('Received HTML instead of JSON');
      }
      
      // Try to parse as JSON
      try {
        const body = JSON.parse(text);
        console.log(`✅ Successfully parsed JSON from ${attempts[i]}`);
        return body;
      } catch (parseError) {
        console.warn(`⚠️ Failed to parse JSON from ${attempts[i]}:`, text.substring(0, 200));
        console.warn(`⚠️ Full response length:`, text.length);
        throw new Error('Invalid JSON response');
      }
      
    } catch (e) { 
      err = e; 
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.warn(`❌ Attempt ${i + 1} failed:`, errorMessage);
      
      // Don't retry if CORS proxy is disabled and we get certain errors
      if (!USE_CORS_PROXY && (
        errorMessage.includes('403') || 
        errorMessage.includes('CORS') || 
        errorMessage.includes('network')
      )) {
        console.warn(`🚫 Skipping retries due to CORS/network error with proxy disabled`);
        break;
      }
      
      if (i < attempts.length - 1) {
        console.log(`⏳ Waiting ${backoff}ms before retry...`);
        await new Promise(r => setTimeout(r, backoff)); 
      }
    }
  }
  
  console.error(`❌ All attempts failed for ${url}`);
  throw err || new Error("fetchJSONSmart failed");
}

// Rate limiting utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class EnrichmentService {
  private performanceMetrics: {
    totalQueries: number;
    totalTime: number;
    averageTime: number;
    parallelQueries: number;
  } = {
    totalQueries: 0,
    totalTime: 0,
    averageTime: 0,
    parallelQueries: 0
  };
  
  constructor() {
    // Using your proven working geocoding approach instead of CompositeGeocoder
  }
  
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }
  
  logPerformanceSummary() {
    console.log('📊 === PERFORMANCE SUMMARY ===');
    console.log(`Total Queries: ${this.performanceMetrics.totalQueries}`);
    console.log(`Total Time: ${this.performanceMetrics.totalTime}ms`);
    console.log(`Average Time: ${this.performanceMetrics.averageTime}ms`);
    console.log(`Parallel Queries: ${this.performanceMetrics.parallelQueries}`);
    console.log('=============================');
  }

  // Utility methods for coordinate calculations
  private calculateBoundingBox(lat: number, lon: number, radiusMiles: number): string {
    // Convert miles to meters
    const radiusMeters = radiusMiles * 1609.34;
    
    // Use your proven working formula: 111,320 meters per degree
    const latDelta = radiusMeters / 111320;
    const lonDelta = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));
    
    const south = lat - latDelta;
    const north = lat + latDelta;
    const west = lon - lonDelta;
    const east = lon + lonDelta;
    
    // Return as comma-separated string for Overpass API
    return `${south.toFixed(6)},${west.toFixed(6)},${north.toFixed(6)},${east.toFixed(6)}`;
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula for calculating distance between two points on Earth
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }
  
  private async getFEMAFloodZones(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`FEMA Flood Zones query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // Use the correct FEMA NFHL endpoint as provided by user
      const baseUrl = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query';
      
      // Use point-based query instead of bounding box (more reliable)
      const queryUrl = `${baseUrl}?f=json&where=1=1&geometry=${lon.toFixed(6)},${lat.toFixed(6)}&geometryType=esriGeometryPoint&inSR=4326&outSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY&returnGeometry=true&resultRecordCount=5`;
      
      console.log(`🔗 FEMA NFHL API URL: ${queryUrl}`);
      
      try {
        const response = await fetch(queryUrl);
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 FEMA NFHL API response:`, data);
          console.log(`🔍 FEMA response structure:`, {
            hasFeatures: !!data.features,
            featuresLength: data.features?.length,
            responseKeys: Object.keys(data),
            firstFeature: data.features?.[0]
          });
          
          if (data && data.features && data.features.length > 0) {
            console.log(`✅ Found ${data.features.length} FEMA flood zones containing the point`);
            
            // Process the features to find zones containing the point
            const zones = data.features.map((feature: any) => {
              const properties = feature.attributes || feature.properties;
              return {
                zone: properties.FLD_ZONE || properties.ZONE || 'Unknown Zone',
                name: properties.ZONE_SUBTY || properties.NAME || 'Unknown',
                risk: properties.RISK || 'Unknown',
                geometry: feature.geometry
              };
            });
            
            // Since we're using a point query, the point should be inside the returned zones
            const currentZone = zones[0].zone;
            const summary = `Location is in FEMA flood zone: ${currentZone}`;
            
            return {
              poi_fema_flood_zones_count: zones.length,
              poi_fema_flood_zones_summary: summary,
              poi_fema_flood_zones_current: currentZone,
              poi_fema_flood_zones_nearby: zones.slice(0, 2), // Top 2 zones
              poi_fema_flood_zones_status: 'Data retrieved successfully'
            };
          } else {
            console.log(`⚠️  No FEMA flood zones found containing the point`);
            return {
              poi_fema_flood_zones_count: 0,
              poi_fema_flood_zones_summary: `No FEMA flood zones found at this location`,
              poi_fema_flood_zones_current: null,
              poi_fema_flood_zones_nearby: [],
              poi_fema_flood_zones_status: 'No zones at location'
            };
          }
        } else {
          throw new Error(`FEMA API HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.log('FEMA NFHL API query failed:', error);
        return {
          poi_fema_flood_zones_count: 0,
          poi_fema_flood_zones_summary: 'FEMA flood zone data temporarily unavailable',
          poi_fema_flood_zones_current: null,
          poi_fema_flood_zones_nearby: [],
          poi_fema_flood_zones_status: 'API query failed'
        };
      }
      
    } catch (error) {
      console.error('Error in FEMA flood zones query:', error);
      return {
        poi_fema_flood_zones_count: 0,
        poi_fema_flood_zones_summary: 'Error querying FEMA flood zones'
      };
    }
  }
  
    private async getWetlands(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`USGS Wetlands query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // Official USGS NWI Wetlands MapServer endpoint (preferred service)
      const baseUrl = 'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0/query';
      
      // Use simple comma-separated coordinates for the official MapServer
      const geometryParam = `${lon.toFixed(6)},${lat.toFixed(6)}`;
      
      console.log(`🔍 Geometry parameter: ${geometryParam}`);
      
      // First, check if point is inside any wetland (point-in-polygon query)
      // Use the official MapServer with proper parameters
      const pointQueryUrl = `${baseUrl}?where=1%3D1&geometry=${geometryParam}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&f=json`;
      
      console.log(`🔗 USGS NWI Wetlands Point Query URL: ${pointQueryUrl}`);
      
      let pointInWetland = false;
      let currentWetland = null;
      
      try {
        const pointResponse = await fetch(pointQueryUrl);
        if (pointResponse.ok) {
          const pointData = await pointResponse.json();
          console.log(`📊 USGS NWI Wetlands Point Query response:`, pointData);
          
          if (pointData && pointData.features && pointData.features.length > 0) {
            pointInWetland = true;
            const feature = pointData.features[0];
            const properties = feature.attributes || feature.properties;
            currentWetland = {
              type: properties.WETLAND_TY || properties.WETLAND_TYPE || properties.ATTRIBUTE || 'Unknown',
              attribute: properties.ATTRIBUTE || 'Unknown',
              acres: properties.ACRES || null,
              geometry: feature.geometry
            };
            console.log(`✅ Point is inside wetland: ${currentWetland.type}`);
          } else {
            console.log(`⚠️  Point is not inside any wetland`);
          }
        } else {
          console.log(`❌ Point query failed with status: ${pointResponse.status} ${pointResponse.statusText}`);
        }
      } catch (error) {
        console.log('USGS NWI Wetlands point query failed:', error);
      }
      
      // Now check for wetlands nearby within the specified radius using the distance parameter
      // Use the official MapServer with proper distance units
      const nearbyQueryUrl = `${baseUrl}?where=1%3D1&geometry=${geometryParam}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=${radiusMiles}&units=esriSRUnit_StatuteMile&outFields=*&returnGeometry=true&f=json`;
      
      console.log(`🔗 USGS NWI Wetlands Nearby Query URL: ${nearbyQueryUrl}`);
      
      let nearbyWetlands = [];
      let totalNearbyCount = 0;
      
      try {
        const nearbyResponse = await fetch(nearbyQueryUrl);
        if (nearbyResponse.ok) {
          const nearbyData = await nearbyResponse.json();
          console.log(`📊 USGS NWI Wetlands Nearby Query response:`, nearbyData);
          
          if (nearbyData && nearbyData.features && nearbyData.features.length > 0) {
            console.log(`📊 Wetlands found within ${radiusMiles} miles: ${nearbyData.features.length}`);
            
            totalNearbyCount = nearbyData.features.length;
            nearbyWetlands = nearbyData.features.slice(0, 5).map((feature: any) => {
              const properties = feature.attributes || feature.properties;
              return {
                type: properties.WETLAND_TY || properties.WETLAND_TYPE || properties.ATTRIBUTE || 'Unknown',
                attribute: properties.ATTRIBUTE || 'Unknown',
                acres: properties.ACRES || null,
                geometry: feature.geometry
              };
            });
            console.log(`✅ Found ${totalNearbyCount} wetlands within ${radiusMiles} miles`);
          } else {
            console.log(`⚠️  No wetlands found within ${radiusMiles} miles`);
          }
        } else {
          console.log(`❌ Nearby query failed with status: ${nearbyResponse.status} ${nearbyResponse.statusText}`);
        }
      } catch (error) {
        console.log('USGS NWI Wetlands nearby query failed:', error);
      }
      
      // Generate summary and return results
      let summary = '';
      if (pointInWetland && currentWetland) {
        summary = `Location is inside ${currentWetland.type} wetland`;
        if (currentWetland.acres) {
          summary += ` (${currentWetland.acres.toFixed(2)} acres)`;
        }
      } else {
        summary = `Location is not inside any wetland`;
      }
      
      if (totalNearbyCount > 0) {
        summary += `. Found ${totalNearbyCount} wetlands within ${radiusMiles} miles`;
      }
      
      return {
        poi_wetlands_count: totalNearbyCount,
        poi_wetlands_point_in_wetland: pointInWetland,
        poi_wetlands_current: currentWetland,
        poi_wetlands_nearby: nearbyWetlands,
        poi_wetlands_summary: summary,
        poi_wetlands_status: 'Data retrieved successfully',
        poi_wetlands_proximity_distance: radiusMiles
      };
      
    } catch (error) {
      console.error('Error in USGS NWI Wetlands query:', error);
      return {
        poi_wetlands_count: 0,
        poi_wetlands_point_in_wetland: false,
        poi_wetlands_current: null,
        poi_wetlands_nearby: [],
        poi_wetlands_summary: 'Error querying USGS NWI Wetlands data',
        poi_wetlands_status: 'API query failed',
        poi_wetlands_proximity_distance: radiusMiles
      };
    }
  }

  private async getEarthquakes(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`USGS Earthquake query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // USGS Earthquake API endpoint
      const baseUrl = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
      
      // Convert miles to kilometers (USGS API uses kilometers)
      const radiusKm = radiusMiles * 1.60934;
      
      // Query for earthquakes within the specified radius
      const queryUrl = `${baseUrl}?format=geojson&starttime=1900-01-01&endtime=2024-12-31&latitude=${lat}&longitude=${lon}&maxradiuskm=${radiusKm}&minmagnitude=2.0&orderby=time`;
      
      console.log(`🔗 USGS Earthquake Query URL: ${queryUrl}`);
      
      let earthquakeCount = 0;
      let largestMagnitude = 0;
      let recentEarthquakes = [];
      
      try {
        const response = await fetch(queryUrl);
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 USGS Earthquake response:`, data);
          
          if (data && data.features && Array.isArray(data.features)) {
            earthquakeCount = data.features.length;
            
            // Get the largest magnitude earthquake
            if (earthquakeCount > 0) {
              largestMagnitude = Math.max(...data.features.map((eq: any) => eq.properties.mag || 0));
              
              // Get the 5 most recent earthquakes
              recentEarthquakes = data.features
                .sort((a: any, b: any) => new Date(b.properties.time).getTime() - new Date(a.properties.time).getTime())
                .slice(0, 5)
                .map((eq: any) => ({
                  magnitude: eq.properties.mag || 0,
                  date: new Date(eq.properties.time).toLocaleDateString(),
                  depth: eq.properties.depth || 0,
                  place: eq.properties.place || 'Unknown location'
                }));
            }
            
            console.log(`✅ Found ${earthquakeCount} earthquakes within ${radiusMiles} miles (${radiusKm.toFixed(1)} km)`);
          } else {
            console.log(`⚠️  No earthquakes found within ${radiusMiles} miles`);
          }
        } else {
          console.log(`❌ USGS Earthquake API error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log('USGS Earthquake query failed:', error);
      }
      
      // Generate summary
      let summary = '';
      if (earthquakeCount > 0) {
        summary = `Found ${earthquakeCount} historical earthquakes within ${radiusMiles} miles`;
        if (largestMagnitude > 0) {
          summary += ` (largest: M${largestMagnitude.toFixed(1)})`;
        }
      } else {
        summary = `No historical earthquakes found within ${radiusMiles} miles`;
      }
      
      return {
        poi_earthquakes_count: earthquakeCount,
        poi_earthquakes_largest_magnitude: largestMagnitude,
        poi_earthquakes_recent: recentEarthquakes,
        poi_earthquakes_summary: summary
      };
      
    } catch (error) {
      console.error('Error in USGS Earthquake query:', error);
      return {
        poi_earthquakes_count: 0,
        poi_earthquakes_largest_magnitude: 0,
        poi_earthquakes_recent: [],
        poi_earthquakes_summary: 'Error querying USGS Earthquake data'
      };
    }
  }

  private async getVolcanoes(lat: number, lon: number, radiusMiles: number): Promise<any> {
    try {
      console.log(`🌋 USGS Volcano query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // USGS Volcano API endpoint
      const baseUrl = 'https://volcanoes.usgs.gov/vsc/api/volcanoApi/geojson';
      
      // Download all volcano data and filter by proximity
      const response = await fetch(baseUrl);
      if (!response.ok) {
        throw new Error(`USGS Volcano API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`🌋 Downloaded ${data.features?.length || 0} volcano features from USGS API`);
      
      if (!data.features || !Array.isArray(data.features)) {
        console.log('🌋 No volcano features found in response');
        return { count: 0, active: 0, summary: 'No volcanoes found' };
      }
      
      // Filter volcanoes by proximity
      const radiusKm = radiusMiles * 1.60934; // Convert miles to km
      const nearbyVolcanoes = data.features.filter((volcano: any) => {
        if (volcano.geometry?.coordinates && volcano.geometry.coordinates.length >= 2) {
          const [volcanoLon, volcanoLat] = volcano.geometry.coordinates;
          const distance = this.calculateDistance(lat, lon, volcanoLat, volcanoLon);
          return distance <= radiusKm;
        }
        return false;
      });
      
      console.log(`🌋 Found ${nearbyVolcanoes.length} volcanoes within ${radiusMiles} miles`);
      
      // Count active volcanoes
      const activeVolcanoes = nearbyVolcanoes.filter((volcano: any) => 
        volcano.properties?.status?.toLowerCase().includes('active') ||
        volcano.properties?.status?.toLowerCase().includes('erupting')
      );
      
      const summary = nearbyVolcanoes.length > 0 
        ? `${nearbyVolcanoes.length} volcano${nearbyVolcanoes.length !== 1 ? 'es' : ''} found within ${radiusMiles} miles`
        : 'No volcanoes found';
      
      return {
        count: nearbyVolcanoes.length,
        active: activeVolcanoes.length,
        summary,
        volcanoes: nearbyVolcanoes
      };
    } catch (error) {
      console.error('🌋 USGS Volcano query failed:', error);
      return { count: 0, active: 0, summary: 'Volcano data unavailable', error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async getFloodReferencePoints(lat: number, lon: number, radiusMiles: number): Promise<any> {
    try {
      console.log(`🌊 USGS Flood Reference Points query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // USGS RTFI API endpoint for flooding reference points
      const baseUrl = 'https://api.waterdata.usgs.gov/rtfi-api/referencepoints/flooding';
      
      // Try to query with proximity parameters first
      let response;
      try {
        // Attempt proximity query (if supported by the API)
        const radiusKm = radiusMiles * 1.60934; // Convert miles to km
        const proximityUrl = `${baseUrl}?latitude=${lat}&longitude=${lon}&radius=${radiusKm}`;
        console.log(`🔗 USGS RTFI Proximity Query URL: ${proximityUrl}`);
        
        response = await fetch(proximityUrl);
        if (response.ok) {
          const data = await response.json();
          console.log(`🌊 Proximity query successful, found ${data.length || 0} reference points`);
          
          if (data && Array.isArray(data) && data.length > 0) {
            // Verify the data actually contains points near our location
            const nearbyPoints = data.filter((point: any) => {
              if (point.latitude && point.longitude) {
                const distance = this.calculateDistance(lat, lon, point.latitude, point.longitude);
                const isNearby = distance <= radiusKm;
                if (isNearby) {
                  console.log(`🌊 Found nearby point: ${point.site_name} at distance ${distance.toFixed(2)} km`);
                }
                return isNearby;
              }
              return false;
            });
            
            console.log(`🌊 After proximity filtering: ${nearbyPoints.length} points within ${radiusKm} km`);
            
            // Filter for actively flooding points
            const activeFloodingPoints = nearbyPoints.filter((point: any) => 
              point.is_flooding === true && point.active === true
            );
            
            console.log(`🌊 Found ${activeFloodingPoints.length} actively flooding reference points`);
            
            const summary = activeFloodingPoints.length > 0 
              ? `${activeFloodingPoints.length} actively flooding reference point${activeFloodingPoints.length !== 1 ? 's' : ''} found within ${radiusMiles} miles`
              : 'No actively flooding reference points found';
            
            return {
              count: nearbyPoints.length,
              active_flooding: activeFloodingPoints.length,
              summary,
              reference_points: activeFloodingPoints
            };
          } else {
            console.log('🌊 Proximity query returned no data or invalid format, falling back to full dataset');
          }
        } else {
          console.log(`🌊 Proximity query failed with status ${response.status}: ${response.statusText}`);
        }
      } catch (proximityError) {
        console.log('🌊 Proximity query failed, falling back to full dataset filtering:', proximityError);
      }
      
      // Fallback: Download all data and filter client-side
      console.log(`🌊 Falling back to full dataset query and client-side filtering`);
      response = await fetch(baseUrl);
      
      if (!response.ok) {
        throw new Error(`USGS RTFI API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`🌊 Downloaded ${data.length || 0} reference points from USGS RTFI API`);
      
      if (!data || !Array.isArray(data)) {
        console.log('🌊 No reference points found in response');
        return { count: 0, active_flooding: 0, summary: 'No reference points found' };
      }
      
      // Log a few sample points to verify data structure
      if (data.length > 0) {
        console.log('🌊 Sample data structure:', {
          firstPoint: data[0],
          hasLatLon: data[0].latitude !== undefined && data[0].longitude !== undefined,
          latLonType: typeof data[0].latitude
        });
      }
      
      // Filter reference points by proximity and flooding status
      const radiusKm = radiusMiles * 1.60934; // Convert miles to km
      console.log(`🌊 Filtering ${data.length} points for proximity within ${radiusKm} km of [${lat}, ${lon}]`);
      
      const nearbyPoints = data.filter((point: any) => {
        if (point.latitude && point.longitude) {
          const distance = this.calculateDistance(lat, lon, point.latitude, point.longitude);
          const isNearby = distance <= radiusKm;
          
          // Log some debugging info for the first few points
          if (data.indexOf(point) < 5) {
            console.log(`🌊 Point ${point.site_name || 'unnamed'}: [${point.latitude}, ${point.longitude}] - distance: ${distance.toFixed(2)} km - nearby: ${isNearby}`);
          }
          
          return isNearby;
        }
        return false;
      });
      
      console.log(`🌊 Found ${nearbyPoints.length} reference points within ${radiusMiles} miles`);
      
      // Filter for actively flooding points
      const activeFloodingPoints = nearbyPoints.filter((point: any) => 
        point.is_flooding === true && point.active === true
      );
      
      console.log(`🌊 Found ${activeFloodingPoints.length} actively flooding reference points`);
      
      const summary = activeFloodingPoints.length > 0 
        ? `${activeFloodingPoints.length} actively flooding reference point${activeFloodingPoints.length !== 1 ? 's' : ''} found within ${radiusMiles} miles`
        : 'No actively flooding reference points found';
      
      return {
        count: nearbyPoints.length,
        active_flooding: activeFloodingPoints.length,
        summary,
        reference_points: activeFloodingPoints
      };
    } catch (error) {
      console.error('🌊 USGS Flood Reference Points query failed:', error);
      return { count: 0, active_flooding: 0, summary: 'Flood reference points data unavailable', error: error instanceof Error ? error.message : String(error) };
    }
  }




  
  private getCustomPOIData(_enrichmentId: string): any {
    // This method should return custom POI data from poiConfigManager
    // For now, return null
    return null;
  }
  
  private getCustomPOICount(_enrichmentId: string, _lat: number, _lon: number, _radius: number, _customPOI: any): Promise<Record<string, any>> {
    // This method should handle custom POI counting
    // For now, return a placeholder
    return Promise.resolve({
      [`${_enrichmentId}_count`]: 0,
      [`${_enrichmentId}_summary`]: 'Custom POI not yet implemented'
    });
  }
  
  private categorizeWikipediaArticle(title: string, _article: any): string[] {
    // Simple categorization based on title keywords
    const categories: string[] = [];
    
    if (title.toLowerCase().includes('school') || title.toLowerCase().includes('university') || title.toLowerCase().includes('college')) {
      categories.push('Education');
    }
    if (title.toLowerCase().includes('park') || title.toLowerCase().includes('garden') || title.toLowerCase().includes('trail')) {
      categories.push('Recreation');
    }
    if (title.toLowerCase().includes('museum') || title.toLowerCase().includes('theater') || title.toLowerCase().includes('gallery')) {
      categories.push('Culture');
    }
    if (title.toLowerCase().includes('hospital') || title.toLowerCase().includes('clinic') || title.toLowerCase().includes('medical')) {
      categories.push('Healthcare');
    }
    if (title.toLowerCase().includes('church') || title.toLowerCase().includes('temple') || title.toLowerCase().includes('mosque')) {
      categories.push('Religion');
    }
    
    return categories.length > 0 ? categories : ['General'];
  }
  
  private groupArticlesByCategory(categorizedArticles: Array<{title: string, categories: string[], article: any}>): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    categorizedArticles.forEach(({title, categories, article}) => {
      categories.forEach(category => {
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push({title, article});
      });
    });
    
    return grouped;
  }
  
  private generateWikipediaSummary(articlesByCategory: Record<string, any[]>): string {
    const categorySummaries = Object.entries(articlesByCategory).map(([category, articles]) => {
      return `${category}: ${articles.length} articles`;
    });
    
    return categorySummaries.join(', ');
  }

  async enrichSingleLocation(
    address: string, 
    selectedEnrichments: string[], 
    poiRadii: Record<string, number>
  ): Promise<EnrichmentResult> {
    // Use the working geocoding functions from original geocoder.html
    const geocodeResult = await this.geocodeAddress(address);
    
    if (!geocodeResult) {
      throw new Error('No geocoding results found for the provided address');
    }

    // Run enrichments
    const enrichments = await this.runEnrichments(
      geocodeResult.lat, 
      geocodeResult.lon, 
      selectedEnrichments, 
      poiRadii
    );

    return {
      location: geocodeResult,
      enrichments
    };
  }

  async enrichBatchLocations(
    addresses: string[],
    selectedEnrichments: string[],
    poiRadii: Record<string, number>,
    onProgress?: (current: number, total: number, estimatedTimeRemaining: number) => void
  ): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = [];
    const startTime = Date.now();
    
    // Calculate estimated processing time
    const estimatedTotalTime = this.calculateEstimatedTime(addresses.length);
    
    console.log(`🚀 Starting batch processing of ${addresses.length} addresses`);
    console.log(`⏱️  Estimated total time: ${this.formatTime(estimatedTotalTime)}`);
    console.log(`📊 Rate limits: Nominatim (1/sec), US Census (10/sec), GeoNames (4/sec)`);
    
    for (let i = 0; i < addresses.length; i++) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const estimatedTimeRemaining = Math.max(0, estimatedTotalTime - elapsedTime);
      
      try {
        console.log(`📍 Processing ${i + 1}/${addresses.length}: ${addresses[i]}`);
        
        const result = await this.enrichSingleLocation(
          addresses[i], 
          selectedEnrichments, 
          poiRadii
        );
        results.push(result);
        
        // Rate limiting delay between requests
        if (i < addresses.length - 1) {
          const delay = this.calculateDelayForNextRequest();
          console.log(`⏳ Rate limiting: waiting ${delay}ms before next request...`);
          await sleep(delay);
        }
        
      } catch (error) {
        console.error(`❌ Failed to enrich address ${i + 1}: ${addresses[i]}`, error);
        // Add a placeholder result for failed addresses
        results.push({
          location: {
            source: 'Failed',
            lat: 0,
            lon: 0,
            name: addresses[i],
            confidence: 0,
            raw: {}
          },
          enrichments: { error: 'Geocoding failed' }
        });
      }
      
      if (onProgress) {
        onProgress(i + 1, addresses.length, estimatedTimeRemaining);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Batch processing complete in ${this.formatTime(totalTime)}`);
    
    return results;
  }

  // Calculate estimated processing time based on rate limits
  private calculateEstimatedTime(addressCount: number): number {
    // Conservative estimate: 1.2 seconds per address (includes rate limiting)
    return addressCount * 1200;
  }

  // Format time in human-readable format
  private formatTime(ms: number): string {
    if (ms < 60000) {
      return `${Math.round(ms / 1000)} seconds`;
    } else if (ms < 3600000) {
      return `${Math.round(ms / 60000)} minutes`;
    } else {
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.round((ms % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    }
  }

  // Calculate appropriate delay based on geocoder usage
  private calculateDelayForNextRequest(): number {
    // For now, use Nominatim rate limit as primary constraint
    // In future, could track which geocoder was used last
    return NOMINATIM_RATE_LIMIT_MS;
  }

  // Working geocoding functions from original geocoder.html with rate limiting
  private async geocodeNominatim(q: string): Promise<GeocodeResult | null> {
    try {
      const u = new URL("https://nominatim.openstreetmap.org/search");
      u.searchParams.set("q", q);
      u.searchParams.set("format", "json");
      u.searchParams.set("addressdetails", "1");
      u.searchParams.set("limit", "1");
      u.searchParams.set("email", "noreply@locationmart.com");
      
      const d = await fetchJSONSmart(u.toString());
      if (d && d.length) {
        const x = d[0];
        return {
          lat: +x.lat, 
          lon: +x.lon, 
          source: "Nominatim (OSM)", 
          confidence: 0.9,
          name: x.display_name || q,
          raw: x
        };
      }
      return null;
    } catch (error) {
      console.error('Nominatim geocoding failed:', error);
      return null;
    }
  }

  private async geocodeUSCensus(q: string): Promise<GeocodeResult | null> {
    try {
      const u = new URL("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress");
      u.searchParams.set("address", q);
      u.searchParams.set("benchmark", "Public_AR_Current");
      u.searchParams.set("format", "json");
      
      const d = await fetchJSONSmart(u.toString());
      const r = d?.result?.addressMatches?.[0];
      
      if (r?.coordinates) {
        return {
          lat: r.coordinates.y, 
          lon: r.coordinates.x, 
          source: "US Census", 
          confidence: 0.8,
          name: r.matchedAddress || q,
          raw: r
        };
      }
      return null;
    } catch (error) {
      console.error('US Census geocoding failed:', error);
      return null;
    }
  }

  private async geocodePostcodesIO(q: string): Promise<GeocodeResult | null> {
    try {
      const cleaned = q.trim();
      const encoded = encodeURIComponent(cleaned);

      const lookupUrl = `https://api.postcodes.io/postcodes/${encoded.replace(/%20/g, '')}`;
      let data = await fetchJSONSmart(lookupUrl);

      if (data?.status !== 200 || !data?.result) {
        const searchUrl = `https://api.postcodes.io/postcodes?q=${encodeURIComponent(cleaned)}&limit=1`;
        data = await fetchJSONSmart(searchUrl);
        if (data?.status !== 200 || !data?.result) {
          return null;
        }
        data.result = Array.isArray(data.result) ? data.result[0] : data.result;
      }

      const r = data.result;
      if (!r?.latitude || !r?.longitude) {
        return null;
      }

      return {
        lat: r.latitude,
        lon: r.longitude,
        source: "Postcodes.io",
        confidence: 0.95,
        name: r.postcode || cleaned,
        raw: r
      };
    } catch (error) {
      console.error('Postcodes.io geocoding failed:', error);
      return null;
    }
  }

  private async geocodeAddress(q: string): Promise<GeocodeResult | null> {
    // Use your proven working geocoding approach
    console.log(`🔍 Geocoding address: ${q}`);
    
    // First, check if the input is already coordinates (lat, lon or lon, lat)
    const coordMatch = q.trim().match(/^(-?\d+\.?\d*)\s*[,;]\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const first = parseFloat(coordMatch[1]);
      const second = parseFloat(coordMatch[2]);
      
      // Determine if it's lat,lon or lon,lat based on value ranges
      // Latitude: -90 to 90, Longitude: -180 to 180
      let lat: number, lon: number;
      
      if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
        // Could be lat,lon or lon,lat - check which makes more sense
        // If first is clearly a latitude (between -90 and 90) and second is clearly a longitude (between -180 and 180)
        if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
          // Assume lat,lon format (most common)
          lat = first;
          lon = second;
        } else {
          // Assume lon,lat format
          lat = second;
          lon = first;
        }
      } else if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
        // Likely lon,lat format
        lon = first;
        lat = second;
      } else {
        // Default to lat,lon
        lat = first;
        lon = second;
      }
      
      // Validate coordinates
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        console.log(`✅ Detected coordinates: ${lat}, ${lon}`);
        return {
          lat: lat,
          lon: lon,
          source: "User Input (Coordinates)",
          confidence: 1.0,
          name: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
          raw: { lat, lon }
        };
      }
    }
    
    // Try Nominatim first (most reliable)
    let g = await this.geocodeNominatim(q);
    if (g) {
      console.log(`✅ Geocoded via Nominatim: ${g.lat}, ${g.lon}`);
      return g;
    }

    // Try UK-specific Postcodes.io for postcodes or UK addresses
    if (/\b(UK|United Kingdom|England|Scotland|Wales|Northern Ireland)\b/i.test(q) || /\b[A-Z]{1,2}\d[A-Z0-9]?\s*\d[A-Z]{2}\b/i.test(q)) {
      g = await this.geocodePostcodesIO(q);
      if (g) {
        console.log(`✅ Geocoded via Postcodes.io: ${g.lat}, ${g.lon}`);
        return g;
      }
    }
    
    // Try US Census for US addresses
    if (/\b(US|USA|United States|[A-Z]{2})\b/i.test(q) || /,\s*[A-Z]{2}\b/.test(q)) {
      g = await this.geocodeUSCensus(q);
      if (g) {
        console.log(`✅ Geocoded via US Census: ${g.lat}, ${g.lon}`);
        return g;
      }
    }
    
    console.log(`❌ Geocoding failed for: ${q}`);
    return null;
  }



  private async runEnrichments(
    lat: number, 
    lon: number, 
    selectedEnrichments: string[], 
    poiRadii: Record<string, number>
  ): Promise<Record<string, any>> {
    const enrichments: Record<string, any> = {};
    const startTime = performance.now();
    
    console.log(`🚀 Starting parallel enrichment queries for coordinates [${lat}, ${lon}]`);
    
    // Create parallel promises for all default enrichments
    const defaultEnrichmentPromises = [
      // Weather queries (can run in parallel)
      this.getOpenMeteoWeather(lat, lon).catch(error => {
        console.error('Open-Meteo weather query failed:', error);
        return { open_meteo_weather_error: error instanceof Error ? error.message : 'Unknown error' };
      }),
      
      this.getNWSWeatherAlerts(lat, lon, 25).catch(error => {
        console.error('NWS weather alerts query failed:', error);
        return { nws_weather_alerts_error: error instanceof Error ? error.message : 'Unknown error' };
      }),
      
      // Terrain analysis (includes elevation, so we don't need separate elevation query)
      getTerrainAnalysis(lat, lon).then(terrainAnalysis => {
        console.log(`✅ Terrain analysis complete: ${terrainAnalysis.elevation}m elevation, ${terrainAnalysis.slope.toFixed(1)}° slope, ${terrainAnalysis.aspect.toFixed(0)}° aspect (${terrainAnalysis.slopeDirection})`);
        return {
          terrain_elevation: terrainAnalysis.elevation,
          terrain_slope: Math.round(terrainAnalysis.slope * 10) / 10,
          terrain_aspect: Math.round(terrainAnalysis.aspect),
          terrain_slope_direction: terrainAnalysis.slopeDirection,
          // Also provide elevation_ft for compatibility
          elevation_ft: Math.round(terrainAnalysis.elevation * 3.28084)
        };
      }).catch(error => {
        console.error('Terrain analysis failed:', error);
        return { terrain_analysis_error: error instanceof Error ? error.message : 'Unknown error' };
      }),
      
      // Census/FIPS query
      this.runSingleEnrichment('fips', lat, lon, poiRadii).catch(error => {
        console.error('Census/FIPS query failed:', error);
        return { fips_error: error instanceof Error ? error.message : 'Unknown error' };
      }),
      
      // ACS demographics query
      this.runSingleEnrichment('acs', lat, lon, poiRadii).catch(error => {
        console.error('ACS demographics query failed:', error);
        return { acs_error: error instanceof Error ? error.message : 'Unknown error' };
      }),
      
      // Walkability Index (runs automatically for every query)
      this.runSingleEnrichment('poi_walkability_index', lat, lon, poiRadii).catch(error => {
        console.error('Walkability index query failed:', error);
        return { walkability_index_error: error instanceof Error ? error.message : 'Unknown error' };
      })
    ];
    
    // Create parallel promises for selected enrichments
    const selectedEnrichmentPromises = selectedEnrichments.map(enrichmentId => 
      this.runSingleEnrichment(enrichmentId, lat, lon, poiRadii).catch(error => {
        console.error(`Enrichment ${enrichmentId} failed:`, error);
        return { [`${enrichmentId}_error`]: error instanceof Error ? error.message : 'Unknown error' };
      })
    );
    
    // Wait for all enrichments to complete in parallel
    console.log(`⏱️  Running ${defaultEnrichmentPromises.length + selectedEnrichmentPromises.length} enrichment queries in parallel...`);
    
    const allResults = await Promise.allSettled([
      ...defaultEnrichmentPromises,
      ...selectedEnrichmentPromises
    ]);
    
    // Process results
    allResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        Object.assign(enrichments, result.value);
      } else {
        console.error(`Enrichment promise ${index} rejected:`, result.reason);
      }
    });
    
    const endTime = performance.now();
    const totalTime = Math.round(endTime - startTime);
    
    // Update performance metrics
    this.performanceMetrics.totalQueries += 1;
    this.performanceMetrics.totalTime += totalTime;
    this.performanceMetrics.averageTime = Math.round(this.performanceMetrics.totalTime / this.performanceMetrics.totalQueries);
    this.performanceMetrics.parallelQueries += defaultEnrichmentPromises.length + selectedEnrichmentPromises.length;
    
    console.log(`🎯 All enrichments completed in ${totalTime}ms (parallel execution)`);
    console.log(`📊 Performance Stats: ${this.performanceMetrics.totalQueries} total queries, ${this.performanceMetrics.averageTime}ms average`);
    
    return enrichments;
  }

  private async runSingleEnrichment(
    enrichmentId: string, 
    lat: number, 
    lon: number, 
    poiRadii: Record<string, number>
  ): Promise<Record<string, any>> {
    // Check POI config for maxRadius, otherwise use default caps
    let maxRadius = 25; // Default 25 mile cap for all POIs (user can select up to this)
    
    const poiConfig = poiConfigManager.getPOIType(enrichmentId);
    
    if (poiConfig?.maxRadius) {
      // Use maxRadius from POI config if specified
      maxRadius = poiConfig.maxRadius;
    } else if (enrichmentId === 'poi_wildfires') {
      maxRadius = 50; // Wildfires can be up to 50 miles for risk assessment
    } else if (enrichmentId === 'poi_volcanoes') {
      maxRadius = 50; // Volcanoes can be up to 50 miles
    } else if (enrichmentId === 'poi_power_plants_openei' || enrichmentId === 'poi_epa_power' || enrichmentId === 'poi_animal_vehicle_collisions' || enrichmentId === 'poi_padus_public_access' || enrichmentId === 'poi_padus_protection_status' || enrichmentId === 'poi_earthquakes' || enrichmentId === 'poi_flood_reference_points') {
      maxRadius = 25; // These can be up to 25 miles
    } else if (enrichmentId.startsWith('poi_')) {
      // For all other POI types, allow up to 25 miles (user's selection)
      maxRadius = 25;
    }
    
    const radius = Math.min(poiRadii[enrichmentId] || this.getDefaultRadius(enrichmentId), maxRadius);

    switch (enrichmentId) {
      case 'elev':
        const elevationMeters = await this.getElevation(lat, lon);
        const elevationFeet = elevationMeters ? Math.round(elevationMeters * 3.28084) : null;
        return { elevation_ft: elevationFeet };
      
      case 'airq': {
        const pm25 = await this.getAirQuality(lat, lon);
        if (pm25 == null) {
          return {
            airq_pm25: null,
            airq_category: 'Unavailable',
            airq_colour: 'gray',
            airq_message: 'Air quality data temporarily unavailable.',
          };
        }

        const airQuality = this.classifyPM25(pm25);
        return {
          airq_pm25: Number(pm25.toFixed(1)),
          airq_category: airQuality.label,
          airq_colour: airQuality.colour,
          airq_message: airQuality.message,
        };
      }
      
      case 'fips':
        return await this.getFIPSCodes(lat, lon);
      
      case 'acs':
        const fipsData = await this.getFIPSCodes(lat, lon);
        return await this.getACSDemographics(fipsData.fips_state, fipsData.fips_county, fipsData.fips_tract6);
      
      case 'nws_alerts':
        return { nws_active_alerts: await this.getNWSAlerts(lat, lon) };
      
      case 'poi_wikipedia':
        return await this.getWikipediaPOIs(lat, lon, radius);
      case 'poi_aurora_viewing_sites':
        return await this.getAuroraViewingSites(lat, lon, radius);
      case 'poi_ebird_hotspots': {
        const requestedRadiusMiles = radius;
        const distKm = Math.min(requestedRadiusMiles * 1.60934, 50); // eBird max 50km
        return await this.getEBirdHotspots(lat, lon, distKm, requestedRadiusMiles);
      }
      case 'ebird_recent_observations': {
        const distKm = Math.min(radius * 1.60934, 50);
        return await this.getEBirdRecentObservations(lat, lon, distKm, 7);
      }
      
      case 'poi_museums_historic':
        return await this.getPOICount('poi_museums_historic', lat, lon, radius);
      
      case 'poi_bars_nightlife':
        return await this.getPOICount('poi_bars_nightlife', lat, lon, radius);
      
      case 'poi_mountain_biking':
        return await this.getMountainBikingTrails(lat, lon, radius);
      
      case 'poi_powerlines':
        return await this.getPOICount('poi_powerlines', lat, lon, radius);
      
      case 'poi_cell_towers':
        return await this.getPOICount('poi_cell_towers', lat, lon, radius);
      
      case 'poi_fema_flood_zones':
        return await this.getFEMAFloodZones(lat, lon, radius);
      
      case 'poi_wetlands':
        return await this.getWetlands(lat, lon, radius);
      
      case 'poi_earthquakes':
        return await this.getEarthquakes(lat, lon, radius);
      
      case 'poi_volcanoes':
        const volcanoData = await this.getVolcanoes(lat, lon, radius);
        return {
          poi_volcanoes_count: volcanoData.count,
          poi_volcanoes_active: volcanoData.active,
          poi_volcanoes_summary: volcanoData.summary,
          poi_volcanoes_proximity_distance: radius
        };
      
      case 'poi_flood_reference_points':
        const floodRefData = await this.getFloodReferencePoints(lat, lon, radius);
        return {
          poi_flood_reference_points_count: floodRefData.count,
          poi_flood_reference_points_active_flooding: floodRefData.active_flooding,
          poi_flood_reference_points_summary: floodRefData.summary,
          poi_flood_reference_points_proximity_distance: radius
        };
      
      // EPA FRS Environmental Hazards
      case 'poi_epa_brownfields':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'ACRES');
      case 'poi_epa_superfund':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'SEMS/CERCLIS');
      case 'poi_epa_rcra':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'RCRAInfo');
      // EPA TRI (Toxics Release Inventory) - Comprehensive facility data
      case 'tri_facilities':
      case 'tri_facilities_tribal':
      case 'tri_all_facilities':
      case 'tri_manufacturing':
      case 'tri_metal_mining':
      case 'tri_electric_utility':
      case 'tri_wood_products':
      case 'tri_automotive':
      case 'tri_pfas':
      case 'tri_lead':
      case 'tri_dioxins':
      case 'tri_ethylene_oxide':
      case 'tri_carcinogens':
      case 'tri_mercury':
      case 'tri_federal':
        const triService = new EPATRIService();
        return await triService.enrichLocation(lat, lon, [enrichmentId], poiRadii);
      
      // EPA Walkability Index
      case 'poi_walkability_index':
        console.log('Calling EPA Walkability Service for:', lat, lon);
        const walkabilityService = new EPAWalkabilityService();
        const result = await walkabilityService.enrichLocation(lat, lon, [enrichmentId], poiRadii);
        console.log('Walkability service result:', result);
        return result;
      
      // FWS Species & Critical Habitat
      case 'poi_fws_species':
        console.log('Calling FWS Species Service for:', lat, lon);
        const fwsService = new FWSSpeciesService();
        const fwsResult = await fwsService.enrichLocation(lat, lon, [enrichmentId], poiRadii);
        console.log('FWS Species service result:', fwsResult);
        return fwsResult;
      case 'poi_epa_npdes':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'NPDES');
      case 'poi_epa_air':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'ICIS-AIR');
      case 'poi_epa_radiation':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'RADINFO');
      case 'poi_epa_power':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'EGRID');
      case 'poi_epa_oil_spill':
        return await this.getEPAFRSFacilities(lat, lon, radius, 'SPCC/FRP');
      
      // PAD-US Public Lands & Protected Areas
      case 'poi_padus_public_access':
        return await this.getPADUSPublicAccess(lat, lon, radius);
      case 'poi_padus_protection_status':
        return await this.getPADUSProtectionStatus(lat, lon, radius);
      
      // USDA Local Food Portal - Farmers Markets & Local Food
      case 'poi_usda_agritourism':
        return await this.getUSDALocalFood(lat, lon, radius, 'agritourism');
      case 'poi_usda_csa':
        return await this.getUSDALocalFood(lat, lon, radius, 'csa');
      case 'poi_usda_farmers_market':
        return await this.getUSDALocalFood(lat, lon, radius, 'farmersmarket');
      case 'poi_usda_food_hub':
        return await this.getUSDALocalFood(lat, lon, radius, 'foodhub');
      case 'poi_usda_onfarm_market':
        return await this.getUSDALocalFood(lat, lon, radius, 'onfarmmarket');
      
      // Electric Charging Stations via OpenChargeMap API
              case 'poi_electric_charging':
          return await this.getElectricChargingStations(lat, lon, radius);
        case 'poi_gas_stations':
          return await this.getGasStations(lat, lon, radius);
        case 'poi_colleges_universities':
          return await this.getCollegesUniversities(lat, lon, radius);
        
        case 'poi_mail_shipping':
          return await this.getMailShipping(lat, lon, radius);
        
        case 'pct_centerline':
        case 'pct_sheriff_offices':
        case 'pct_side_trails':
        case 'pct_mile_markers_2024':
        case 'pct_tenth_mile_markers_2024':
        case 'pct_resupply_towns':
          return await this.getPCTFeatures(enrichmentId, lat, lon, radius);
      
      // USDA Wildfire Risk to Communities (WRC) - Point-based risk assessment
      case 'usda_wildfire_hazard_potential':
      case 'usda_burn_probability':
      case 'usda_conditional_flame_length':
      case 'usda_risk_to_structures':
      case 'usda_conditional_risk_to_structures':
      case 'usda_exposure_type':
        // All USDA wildfire risk layers are handled together for efficiency
        return await this.getUSDAWildfireRisk(lat, lon);
      
      // Soil Carbon Density (ISRIC Soilgrids via ESRI Living Atlas) - Point-based query
      case 'soil_organic_carbon_density':
        return await this.getSoilCarbonDensity(lat, lon);
      
      // NH House Districts (NH GRANIT) - Point-in-polygon query
      case 'nh_house_districts_2022':
        return await this.getNHHouseDistrict(lat, lon);
      
      // NH Voting Wards (NH GRANIT) - Point-in-polygon query
      case 'nh_voting_wards':
        return await this.getNHVotingWard(lat, lon);
      
      // NH Senate Districts (NH GRANIT) - Point-in-polygon query
      case 'nh_senate_districts_2022':
        return await this.getNHSenateDistrict(lat, lon);
      
      // NH SSURGO Soils (NH GRANIT) - Point-in-polygon query
      case 'nh_ssurgo':
        return await this.getNHSSURGO(lat, lon);
      
      // NH Bedrock Geology (NH GRANIT) - Point-in-polygon query
      case 'nh_bedrock_geology':
        return await this.getNHBedrockGeology(lat, lon);
      
      // NH Geographic Names (NH GRANIT) - Proximity query
      case 'nh_geographic_names':
        return await this.getNHGeographicNames(lat, lon, radius);
      
      // NH Parcels (NH GRANIT) - Point-in-polygon and proximity query
      case 'nh_parcels':
        return await this.getNHParcels(lat, lon, radius);
      
      // NH Key Destinations (NH GRANIT) - Proximity query
      case 'nh_key_destinations':
        return await this.getNHKeyDestinations(lat, lon, radius);
      
      // NH Nursing Homes (NH GRANIT) - Proximity query
      case 'nh_nursing_homes':
        return await this.getNHNursingHomes(lat, lon, radius);
      
      // NH Emergency Medical Services (NH GRANIT) - Proximity query
      case 'nh_ems':
        return await this.getNHEMS(lat, lon, radius);
      
      // NH Fire Stations (NH GRANIT) - Proximity query
      case 'nh_fire_stations':
        return await this.getNHFireStations(lat, lon, radius);
      
      // NH Places of Worship (NH GRANIT) - Proximity query
      case 'nh_places_of_worship':
        return await this.getNHPlacesOfWorship(lat, lon, radius);
      
      // NH Hospitals (NH GRANIT) - Proximity query
      case 'nh_hospitals':
        return await this.getNHHospitals(lat, lon, radius);
      
      // NH Access Sites to Public Waters (NH GRANIT) - Proximity query
      case 'nh_public_waters_access':
        return await this.getNHPublicWatersAccess(lat, lon, radius);
      
      // NH Law Enforcement (NH GRANIT) - Proximity query
      case 'nh_law_enforcement':
        return await this.getNHLawEnforcement(lat, lon, radius);
      
      // NH Recreation Trails (NH GRANIT) - Proximity query (line dataset)
      case 'nh_recreation_trails':
        return await this.getNHRecreationTrails(lat, lon, radius);
      
      // NH Stone Walls - Proximity query (line dataset)
      case 'nh_stone_walls':
        return await this.getNHStoneWalls(lat, lon, radius);
      
      // NH DOT Roads (NH GRANIT) - Proximity query (line dataset)
      case 'nh_dot_roads':
        return await this.getNHDOTRoads(lat, lon, radius);
      
      // NH Railroads (NH GRANIT) - Proximity query (line dataset)
      case 'nh_railroads':
        return await this.getNHRailroads(lat, lon, radius);
      
      // NH Transmission/Pipelines (NH GRANIT) - Proximity query (line dataset)
      case 'nh_transmission_pipelines':
        return await this.getNHTransmissionPipelines(lat, lon, radius);
      
      // NH Cell Towers (NH GRANIT) - Proximity query (point dataset)
      case 'nh_cell_towers':
        return await this.getNHCellTowers(lat, lon, radius);
      
      // NH Underground Storage Tank Sites (NH DES) - Proximity query (point dataset)
      case 'nh_underground_storage_tanks':
        return await this.getNHUndergroundStorageTanks(lat, lon, radius);
      
      // NH Water Well Inventory (NH DES) - Proximity query (point dataset)
      case 'nh_water_wells':
        return await this.getNHWaterWells(lat, lon, radius);
      
      // NH Public Water Supply Wells (NH DES) - Proximity query (point dataset)
      case 'nh_public_water_supply_wells':
        return await this.getNHPublicWaterSupplyWells(lat, lon, radius);
      
      // NH Remediation Sites (NH DES) - Proximity query (point dataset)
      case 'nh_remediation_sites':
        return await this.getNHRemediationSites(lat, lon, radius);
      
      // NH Automobile Salvage Yards (NH DES) - Proximity query (point dataset)
      case 'nh_automobile_salvage_yards':
        return await this.getNHAutomobileSalvageYards(lat, lon, radius);
      
      // NH Solid Waste Facilities (NH DES) - Proximity query (point dataset)
      case 'nh_solid_waste_facilities':
        return await this.getNHSolidWasteFacilities(lat, lon, radius);
      
      // NH Source Water Protection Areas (NH DES) - Point-in-polygon query (polygon dataset)
      case 'nh_source_water_protection_areas':
        return await this.getNHSourceWaterProtectionArea(lat, lon);
      
      // NH National Wetland Inventory (NWI) Plus (NH DES) - Point-in-polygon and proximity queries (polygon dataset)
      case 'nh_nwi_plus':
        return await this.getNHNWIPlus(lat, lon, radius);
      
      // MA DEP Wetlands (MassGIS) - Point-in-polygon and proximity query (polygon dataset)
      case 'ma_dep_wetlands':
        return await this.getMADEPWetlands(lat, lon, radius);
      
      // MA Protected and Recreational Open Space (MassGIS) - Point-in-polygon and proximity query (polygon dataset)
      case 'ma_open_space':
        return await this.getMAOpenSpace(lat, lon, radius);
      
      // Cape Cod Zoning Map - Point-in-polygon and proximity query (polygon dataset)
      case 'cape_cod_zoning':
        return await this.getCapeCodZoning(lat, lon, radius);
      
      // MA Hiking and Wilderness Trails - Proximity query (line dataset)
      case 'ma_trails':
        return await this.getMATrails(lat, lon, radius);
      
      // MA NHESP Natural Communities - Point-in-polygon and proximity query (polygon dataset)
      case 'ma_nhesp_natural_communities':
        return await this.getMANHESPNaturalCommunities(lat, lon, radius);
      case 'ma_lakes_and_ponds':
        return await this.getMALakesAndPonds(lat, lon, radius);
      case 'ma_rivers_and_streams':
        return await this.getMARiversAndStreams(lat, lon, radius);
      
      // MA Regional Planning Agencies (MassGIS) - Point-in-polygon query
      case 'ma_regional_planning_agencies':
        return await this.getMARegionalPlanningAgencies(lat, lon);
      
      // MA Areas of Critical Environmental Concern (MassGIS) - Point-in-polygon and proximity query
      case 'ma_acecs':
        return await this.getMAACECs(lat, lon, radius);
      
      // MA Parcels (MassGIS) - Point-in-polygon and proximity query
      case 'ma_parcels':
        return await this.getMAParcels(lat, lon, radius);
      
      // CT Building Footprints (CT Geodata Portal) - Point-in-polygon and proximity query
        case 'ct_parcels':
          return await this.getCTParcels(lat, lon, radius);
        case 'ct_building_footprints':
        return await this.getCTBuildingFootprints(lat, lon, radius);
      
      // CT Roads and Trails (CT Geodata Portal) - Proximity query
      case 'ct_roads':
        return await this.getCTRoads(lat, lon, radius);
      
      // CT Urgent Care (CT Geodata Portal) - Proximity query
      case 'ct_urgent_care':
        return await this.getCTUrgentCare(lat, lon, radius);
      
      // CT DEEP Properties (CT Geodata Portal) - Point-in-polygon and proximity query
      case 'ct_deep_properties':
        return await this.getCTDeepProperties(lat, lon, radius);
      
      case 'ct_tribal_lands':
        return await this.getCTTribalLands(lat, lon, radius);
      
      case 'ct_drinking_water_watersheds':
        return await this.getCTDrinkingWaterWatersheds(lat, lon, radius);
      
      // CT Broadband Availability (CT Geodata Portal) - Point-in-polygon and proximity query
      case 'ct_broadband_availability':
        return await this.getCTBroadbandAvailability(lat, lon, radius);
      
      // CT Water Pollution Control Facilities (CT Geodata Portal) - Proximity query
      case 'ct_water_pollution_control':
        return await this.getCTWaterPollutionControl(lat, lon, radius);
      
      // CT Boat Launches (CT Geodata Portal) - Proximity query
      case 'ct_boat_launches':
        return await this.getCTBoatLaunches(lat, lon, radius);
      
      // CT Federal Open Space (CT Geodata Portal) - Point-in-polygon and proximity query
      case 'ct_federal_open_space':
        return await this.getCTFederalOpenSpace(lat, lon, radius);
      
      // CT HUC Watershed Boundaries (CT Geodata Portal) - Point-in-polygon query only
      case 'ct_huc_watersheds':
        return await this.getCTHUCWatersheds(lat, lon);
      
      // CT Soils Parent Material Name (CT Geodata Portal) - Point-in-polygon query only
      case 'ct_soils_parent_material':
        return await this.getCTSoilsParentMaterial(lat, lon);
      
      // CA Power Outage Areas (CA Open Data Portal) - Point-in-polygon and proximity query
      case 'ca_power_outage_areas':
        return await this.getCAPowerOutageAreas(lat, lon, radius);
      
      // CA Fire Perimeters (All) (CA Open Data Portal) - Point-in-polygon and proximity query
      case 'ca_fire_perimeters_all':
        return await this.getCAFirePerimetersAll(lat, lon, radius);
      
      // CA Recent Large Fire Perimeters (CA Open Data Portal) - Point-in-polygon and proximity query
      case 'ca_fire_perimeters_recent_large':
        return await this.getCAFirePerimetersRecentLarge(lat, lon, radius);
      
      // CA Fire Perimeters (1950+) (CA Open Data Portal) - Point-in-polygon and proximity query
      case 'ca_fire_perimeters_1950':
        return await this.getCAFirePerimeters1950(lat, lon, radius);
      
      // CA Land Ownership (CA Open Data Portal) - Point-in-polygon query only
      case 'ca_land_ownership':
        return await this.getCALandOwnership(lat, lon);
      
      // CA CGS Landslide Zones (CA Open Data Portal) - Point-in-polygon and proximity query (max 10 miles)
      case 'ca_cgs_landslide_zones':
        return await this.getCACGSLandslideZones(lat, lon, radius);
      
      // CA CGS Liquefaction Zones (CA Open Data Portal) - Point-in-polygon and proximity query (max 25 miles)
      case 'ca_cgs_liquefaction_zones':
        return await this.getCACGSLiquefactionZones(lat, lon, radius);
      
      // CA Wildland Fire Direct Protection Areas (CA Open Data Portal) - Point-in-polygon query only
      case 'ca_wildland_fire_direct_protection':
        return await this.getCAWildlandFireDirectProtection(lat, lon);
      
      // CA CalVTP Treatment Areas (CA Open Data Portal) - Point-in-polygon and proximity query
      case 'ca_calvtp_treatment_areas':
        return await this.getCACalVTPTreatmentAreas(lat, lon, radius);
      
      // CA Post-Fire Damage Inspections (DINS) - Proximity query only
      case 'ca_postfire_damage_inspections':
        return await this.getCAPostfireDamageInspections(lat, lon, radius);
      
      // CA Medium and Heavy Duty Infrastructure - Proximity query only
      case 'ca_medium_heavy_duty_infrastructure':
        return await this.getCAMediumHeavyDutyInfrastructure(lat, lon, radius);
      
      // CA FRAP Facilities - Proximity query only
      case 'ca_frap_facilities':
        return await this.getCAFRAPFacilities(lat, lon, radius);
      
      // CA Solar Footprints - Proximity query only
      case 'ca_solar_footprints':
        return await this.getCASolarFootprints(lat, lon, radius);
      
      // CA Natural Gas Service Areas - Point-in-polygon query only
      case 'ca_natural_gas_service_areas':
        return await this.getCANaturalGasServiceAreas(lat, lon);
      
      // CA PLSS Sections - Point-in-polygon query only
      case 'ca_plss_sections':
        return await this.getCAPLSSSections(lat, lon);
      
      // CA Geothermal Wells - Proximity query only
      case 'ca_geothermal_wells':
        return await this.getCAGeothermalWells(lat, lon, radius);
      
      // CA Oil and Gas Wells - Proximity query only
      case 'ca_oil_gas_wells':
        return await this.getCAOilGasWells(lat, lon, radius);
      
      // CA Eco Regions - Point-in-polygon query only
      case 'ca_eco_regions':
        return await this.getCAEcoRegions(lat, lon);
      
      // City of Los Angeles Zoning - Point-in-polygon and proximity query (max 1 mile)
      case 'ca_la_zoning':
        return await this.getCALosAngelesZoning(lat, lon, radius);
      
      // LA County Points of Interest - Proximity query only (up to 25 miles)
      case 'la_county_arts_recreation':
        return await this.getLACountyArtsRecreation(lat, lon, radius);
      case 'la_county_education':
        return await this.getLACountyEducation(lat, lon, radius);
      case 'la_county_hospitals':
        return await this.getLACountyHospitals(lat, lon, radius);
      case 'la_county_municipal_services':
        return await this.getLACountyMunicipalServices(lat, lon, radius);
      case 'la_county_physical_features':
        return await this.getLACountyPhysicalFeatures(lat, lon, radius);
      case 'la_county_public_safety':
        return await this.getLACountyPublicSafety(lat, lon, radius);
      case 'la_county_transportation':
        return await this.getLACountyTransportation(lat, lon, radius);
      
      // LA County Historic Cultural Monuments - Point-in-polygon and proximity query (max 25 miles)
      case 'la_county_historic_cultural_monuments':
        return await this.getLACountyHistoricCulturalMonuments(lat, lon, radius);
      
      // LA County Housing with Potential Lead Risk - Point-in-polygon and proximity query (max 5 miles)
      case 'la_county_housing_lead_risk':
        return await this.getLACountyHousingLeadRisk(lat, lon, radius);
      
      // LA County School District Boundaries - Point-in-polygon query only
      case 'la_county_school_district_boundaries':
        return await this.getLACountySchoolDistrictBoundaries(lat, lon);
      
      // LA County MTA Metro Lines - Proximity query only (max 25 miles)
      case 'la_county_metro_lines':
        return await this.getLACountyMetroLines(lat, lon, radius);
      
      // CA State Parks Entry Points (CA Open Data Portal) - Proximity query only
      case 'ca_state_parks_entry_points':
        return await this.getCAStateParksEntryPoints(lat, lon, radius);
      
      // CA State Parks Parking Lots (CA Open Data Portal) - Proximity query only
      case 'ca_state_parks_parking_lots':
        return await this.getCAStateParksParkingLots(lat, lon, radius);
      
      // CA State Parks Boundaries (CA Open Data Portal) - Point-in-polygon and proximity query
      case 'ca_state_parks_boundaries':
        return await this.getCAStateParksBoundaries(lat, lon, radius);
      
      // CA State Parks Campgrounds (CA Open Data Portal) - Proximity query only
      case 'ca_state_parks_campgrounds':
        return await this.getCAStateParksCampgrounds(lat, lon, radius);
      
      // CA State Parks Recreational Routes (CA Open Data Portal) - Proximity query only (linear features)
      case 'ca_state_parks_recreational_routes':
        return await this.getCAStateParksRecreationalRoutes(lat, lon, radius);
      
      // CA Condor Range (CDFW BIOS) - Point-in-polygon and proximity query
      case 'ca_condor_range':
        return await this.getCACondorRange(lat, lon, radius);
      
      case 'ca_black_bear_range':
        return await this.getCABlackBearRange(lat, lon, radius);
      
      case 'ca_brush_rabbit_range':
        return await this.getCABrushRabbitRange(lat, lon, radius);
      
      case 'ca_great_gray_owl_range':
        return await this.getCAGreatGrayOwlRange(lat, lon, radius);
      
      case 'ca_sandhill_crane_range':
        return await this.getCASandhillCraneRange(lat, lon, radius);
      
      case 'ca_highway_rest_areas':
        return await this.getCAHighwayRestAreas(lat, lon, radius);
      
      // CA Marine Oil Terminals (CA State) - Proximity query only
      case 'ca_marine_oil_terminals':
        return await this.getCAMarineOilTerminals(lat, lon, radius);
      
      // DE State Forest (DE FirstMap) - Point-in-polygon and proximity query
      case 'de_state_forest':
        return await this.getDEStateForest(lat, lon, radius);
      
      // DE Pine Plantations (DE FirstMap) - Point-in-polygon and proximity query
      case 'de_pine_plantations':
        return await this.getDEPinePlantations(lat, lon, radius);
      
      // DE Urban Tree Canopy (DE FirstMap) - Point-in-polygon and proximity query
      case 'de_urban_tree_canopy':
        return await this.getDEUrbanTreeCanopy(lat, lon, radius);
      
      // DE Forest Cover 2007 (DE FirstMap) - Point-in-polygon and proximity query
      case 'de_forest_cover_2007':
        return await this.getDEForestCover2007(lat, lon, radius);
      
      case 'de_no_build_points_bay':
        return await this.getDENoBuildPointsBay(lat, lon, radius);
      case 'de_no_build_line_bay':
        return await this.getDENoBuildLineBay(lat, lon, radius);
      case 'de_no_build_points_ocean':
        return await this.getDENoBuildPointsOcean(lat, lon, radius);
      case 'de_no_build_line_ocean':
        return await this.getDENoBuildLineOcean(lat, lon, radius);
      case 'de_park_facilities':
        return await this.getDEParkFacilities(lat, lon, radius);
      case 'de_child_care_centers':
        return await this.getDEChildCareCenters(lat, lon, radius);
      case 'de_fishing_access':
        return await this.getDEFishingAccess(lat, lon, radius);
      case 'de_trout_streams':
        return await this.getDETroutStreams(lat, lon, radius);
      case 'de_public_schools':
        return await this.getDEPublicSchools(lat, lon, radius);
      case 'de_private_schools':
        return await this.getDEPrivateSchools(lat, lon, radius);
      case 'de_votech_districts':
        return await this.getDEVoTechDistricts(lat, lon);
      case 'de_school_districts':
        return await this.getDESchoolDistricts(lat, lon);
      case 'de_stands_blinds_fields':
        return await this.getDEStandsBlindsFields(lat, lon, radius);
      case 'de_boat_ramps':
        return await this.getDEBoatRamps(lat, lon, radius);
      case 'de_facilities':
        return await this.getDEFacilities(lat, lon, radius);
      case 'de_parking':
        return await this.getDEParking(lat, lon, radius);
      case 'de_restrooms':
        return await this.getDERestrooms(lat, lon, radius);
      case 'de_safety_zones':
        return await this.getDESafetyZones(lat, lon);
      case 'de_wildlife_management_zones':
        return await this.getDEWildlifeManagementZones(lat, lon);
      case 'de_rail_lines':
        return await this.getDERailLines(lat, lon, radius);
      case 'nj_parcels':
        return await this.getNJParcels(lat, lon, radius);
      case 'nj_address_points':
        return await this.getNJAddressPoints(lat, lon, radius);
      case 'nj_bus_stops':
        return await this.getNJBusStops(lat, lon, radius);
      case 'nj_safety_service_patrol':
        return await this.getNJSafetyServicePatrol(lat, lon, radius);
      case 'nj_service_areas':
        return await this.getNJServiceAreas(lat, lon, radius);
      case 'nj_roadway_network':
        return await this.getNJRoadwayNetwork(lat, lon, radius);
      case 'nj_known_contaminated_sites':
        return await this.getNJKnownContaminatedSites(lat, lon, radius);
      case 'nj_alternative_fuel_stations':
        return await this.getNJAlternativeFuelStations(lat, lon, radius);
      case 'nj_power_plants':
        return await this.getNJPowerPlants(lat, lon, radius);
      case 'nj_public_solar_facilities':
        return await this.getNJPublicSolarFacilities(lat, lon, radius);
      case 'nj_public_places_to_keep_cool':
        return await this.getNJPublicPlacesToKeepCool(lat, lon, radius);
      case 'de_natural_areas':
        return await this.getDENaturalAreas(lat, lon, radius);
      case 'de_outdoor_recreation_parks_trails_lands':
        return await this.getDEOutdoorRecreationParksTrailsLands(lat, lon, radius);
      case 'de_land_water_conservation_fund':
        return await this.getDELandWaterConservationFund(lat, lon, radius);
      case 'de_nature_preserves':
        return await this.getDENaturePreserves(lat, lon, radius);
      case 'de_outdoor_recreation_areas':
        return await this.getDEOutdoorRecreationAreas(lat, lon, radius);
      case 'de_outdoor_recreation_parks_trails_open_space':
        return await this.getDEOutdoorRecreationParksTrailsOpenSpace(lat, lon, radius);
      case 'de_public_protected_lands':
        return await this.getDEPublicProtectedLands(lat, lon, radius);
      case 'de_conservation_easements':
        return await this.getDEConservationEasements(lat, lon, radius);
      case 'de_trails_pathways':
        return await this.getDETrailsPathways(lat, lon, radius);
      case 'de_seasonal_restricted_areas':
        return await this.getDESeasonalRestrictedAreas(lat, lon, radius);
      case 'de_permanent_restricted_areas':
        return await this.getDEPermanentRestrictedAreas(lat, lon, radius);
      case 'de_wildlife_area_boundaries':
        return await this.getDEWildlifeAreaBoundaries(lat, lon, radius);
      
      case 'de_parcels':
        return await this.getDEParcels(lat, lon, radius);
      
      case 'de_lulc_2007':
        return await this.getDELULC(lat, lon, 0, '2007');
      
      case 'de_lulc_2007_revised':
        return await this.getDELULC(lat, lon, 1, '2007_revised');
      
      case 'de_lulc_2012':
        return await this.getDELULC(lat, lon, 2, '2012');
      
      case 'de_lulc_2017':
        return await this.getDELULC(lat, lon, 3, '2017');
      
      case 'de_lulc_2022':
        return await this.getDELULC(lat, lon, 4, '2022');
      
      // National Marine Sanctuaries (NOAA) - Point-in-polygon and proximity query
      case 'national_marine_sanctuaries':
        return await this.getNationalMarineSanctuaries(lat, lon, radius);
    
    default:
      if (enrichmentId.startsWith('at_')) {
        // Handle Appalachian Trail queries
        if (enrichmentId === 'at_osm_features') {
          // Special handling for OSM AT features
          return await this.getOSMATFeatures(lat, lon, radius);
        }
        return await this.getATFeatures(enrichmentId, lat, lon, radius);
      } else if (enrichmentId.startsWith('pct_')) {
        // Handle Pacific Crest Trail queries
        if (enrichmentId === 'pct_osm_features') {
          // Special handling for OSM PCT features
          console.log(`🏔️ ===== PCT OSM ROUTING HIT =====`);
          return await this.getOSMPCTFeatures(lat, lon, radius);
        }
        return await this.getPCTFeatures(enrichmentId, lat, lon, radius);
      } else if (enrichmentId.startsWith('poi_')) {
        // Check if this is a custom POI type
        const customPOI = this.getCustomPOIData(enrichmentId);
        if (customPOI) {
          return await this.getCustomPOICount(enrichmentId, lat, lon, radius, customPOI);
        }
        return await this.getPOICount(enrichmentId, lat, lon, radius);
      }
      return {};
    }
  }

  private async getElevation(lat: number, lon: number): Promise<number | null> {
    try {
      const u = new URL("https://api.open-meteo.com/v1/elevation");
      u.searchParams.set("latitude", lat.toString());
      u.searchParams.set("longitude", lon.toString());
      
      const j = await fetchJSONSmart(u.toString());
      return j?.elevation?.[0] ?? null;
    } catch (error) {
      console.error('Elevation API error:', error);
      return null;
    }
  }

  private async getAirQuality(lat: number, lon: number): Promise<number | null> {
    try {
      const u = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
      u.searchParams.set("latitude", lat.toString());
      u.searchParams.set("longitude", lon.toString());
      u.searchParams.set("hourly", "pm2_5");
      
      const j = await fetchJSONSmart(u.toString());
      const vals = j?.hourly?.pm2_5 || [];
      return vals.length ? vals[vals.length - 1] : null;
    } catch (error) {
      console.error('Air quality API error:', error);
      return null;
    }
  }

  private classifyPM25(value: number): { label: string; colour: string; message: string } {
    if (value <= 12) {
      return {
        label: 'Good',
        colour: 'green',
        message: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
      };
    }
    if (value <= 35.4) {
      return {
        label: 'Moderate',
        colour: 'yellow',
        message: 'Air quality is acceptable; however, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.',
      };
    }
    if (value <= 55.4) {
      return {
        label: 'Unhealthy for Sensitive Groups',
        colour: 'orange',
        message: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
      };
    }
    if (value <= 150.4) {
      return {
        label: 'Unhealthy',
        colour: 'red',
        message: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.',
      };
    }
    if (value <= 250.4) {
      return {
        label: 'Very Unhealthy',
        colour: 'purple',
        message: 'Health alert: The risk of health effects is increased for everyone.',
      };
    }
    return {
      label: 'Hazardous',
      colour: 'maroon',
      message: 'Emergency conditions. The entire population is more likely to be affected. Limit outdoor exposure.',
    };
  }

  private async getUSDAWildfireRisk(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🔥 Fetching USDA Wildfire Risk data for [${lat}, ${lon}]`);
      
      const wildfireData = await getUSDAWildfireRiskData(lat, lon);
      
      const result: Record<string, any> = {};
      
      // Wildfire Hazard Potential (WHP)
      if (wildfireData.whp !== null) {
        result.usda_wildfire_hazard_potential = wildfireData.whp;
        result.usda_wildfire_hazard_potential_label = wildfireData.whp_label;
      }
      
      // Burn Probability (BP)
      if (wildfireData.bp !== null) {
        result.usda_burn_probability = wildfireData.bp;
        result.usda_burn_probability_percentage = wildfireData.bp_percentage;
      }
      
      // Conditional Flame Length (CFL)
      if (wildfireData.cfl !== null) {
        result.usda_conditional_flame_length = wildfireData.cfl;
        result.usda_conditional_flame_length_label = wildfireData.cfl_label;
      }
      
      // Risk to Potential Structures (RPS)
      if (wildfireData.rps !== null) {
        result.usda_risk_to_structures = wildfireData.rps;
      }
      
      // Conditional Risk to Potential Structures (cRPS)
      if (wildfireData.cRPS !== null) {
        result.usda_conditional_risk_to_structures = wildfireData.cRPS;
      }
      
      // Exposure Type
      if (wildfireData.exposure_type !== null) {
        result.usda_exposure_type = wildfireData.exposure_type;
        result.usda_exposure_type_label = wildfireData.exposure_label;
      }
      
      // Source attribution
      result.usda_wildfire_risk_source = wildfireData.source;
      
      // Handle errors
      if (wildfireData.error) {
        result.usda_wildfire_risk_error = wildfireData.error;
        console.warn(`⚠️ USDA Wildfire Risk API had errors:`, wildfireData.error);
      }
      
      console.log(`✅ USDA Wildfire Risk data processed:`, {
        whp: result.usda_wildfire_hazard_potential_label,
        bp: result.usda_burn_probability_percentage ? `${result.usda_burn_probability_percentage.toFixed(3)}%` : 'N/A',
        cfl: result.usda_conditional_flame_length_label,
        exposure: result.usda_exposure_type_label
      });
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error fetching USDA Wildfire Risk data:`, error);
      return {
        usda_wildfire_risk_error: error instanceof Error ? error.message : 'Unknown error',
        usda_wildfire_risk_source: 'USDA Forest Service - Wildfire Risk to Communities'
      };
    }
  }

  private async getSoilCarbonDensity(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🌱 Fetching Soil Organic Carbon Density data for [${lat}, ${lon}]`);
      
      const soilData = await getSoilCarbonDensityData(lat, lon);
      
      const result: Record<string, any> = {};
      
      // Organic Carbon Density
      if (soilData.organic_carbon_density !== null && soilData.organic_carbon_density !== undefined) {
        result.soil_organic_carbon_density = soilData.organic_carbon_density;
        result.soil_organic_carbon_density_units = soilData.organic_carbon_density_units || 'kg/m²';
      }
      
      // Source attribution
      result.soil_carbon_density_source = soilData.source;
      
      // Handle errors
      if (soilData.error) {
        result.soil_carbon_density_error = soilData.error;
        console.warn(`⚠️ Soil Carbon Density API had errors:`, soilData.error);
      }
      
      console.log(`✅ Soil Carbon Density data processed:`, {
        carbon_density: result.soil_organic_carbon_density ? `${result.soil_organic_carbon_density.toFixed(2)} ${result.soil_organic_carbon_density_units}` : 'N/A'
      });
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error fetching Soil Carbon Density data:`, error);
      return {
        soil_carbon_density_error: error instanceof Error ? error.message : 'Unknown error',
        soil_carbon_density_source: 'ISRIC Soilgrids via ESRI Living Atlas'
      };
    }
  }

  private async getNHHouseDistrict(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🏛️ Fetching NH House District data for [${lat}, ${lon}]`);
      
      const districtData = await getNHHouseDistrictData(lat, lon);
      
      const result: Record<string, any> = {};
      
      if (districtData && districtData.district) {
        result.nh_house_district_2022 = districtData.district;
        result.nh_house_district_2022_attributes = districtData.attributes;
      } else {
        result.nh_house_district_2022 = null;
        result.nh_house_district_2022_message = 'No district found for this location';
      }
      
      console.log(`✅ NH House District data processed:`, {
        district: result.nh_house_district_2022 || 'N/A'
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH House District:', error);
      return {
        nh_house_district_2022: null,
        nh_house_district_2022_error: 'Error fetching NH House District data'
      };
    }
  }

  private async getNHVotingWard(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🗳️ Fetching NH Voting Ward data for [${lat}, ${lon}]`);
      
      const wardData = await getNHVotingWardData(lat, lon);
      
      const result: Record<string, any> = {};
      
      if (wardData && wardData.ward) {
        result.nh_voting_ward = wardData.ward;
        result.nh_voting_ward_attributes = wardData.attributes;
      } else {
        result.nh_voting_ward = null;
        result.nh_voting_ward_message = 'No voting ward found for this location';
      }
      
      console.log(`✅ NH Voting Ward data processed:`, {
        ward: result.nh_voting_ward || 'N/A'
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Voting Ward:', error);
      return {
        nh_voting_ward: null,
        nh_voting_ward_error: 'Error fetching NH Voting Ward data'
      };
    }
  }

  private async getNHSenateDistrict(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🏛️ Fetching NH Senate District data for [${lat}, ${lon}]`);
      
      const districtData = await getNHSenateDistrictData(lat, lon);
      
      const result: Record<string, any> = {};
      
      if (districtData && districtData.district) {
        result.nh_senate_district_2022 = districtData.district;
        result.nh_senate_district_2022_attributes = districtData.attributes;
      } else {
        result.nh_senate_district_2022 = null;
        result.nh_senate_district_2022_message = 'No senate district found for this location';
      }
      
      console.log(`✅ NH Senate District data processed:`, {
        district: result.nh_senate_district_2022 || 'N/A'
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Senate District:', error);
      return {
        nh_senate_district_2022: null,
        nh_senate_district_2022_error: 'Error fetching NH Senate District data'
      };
    }
  }

  private async getNHSSURGO(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🌱 Fetching NH SSURGO soil data for [${lat}, ${lon}]`);
      
      const soils = await getNHSSURGOContainingData(lat, lon);
      
      const result: Record<string, any> = {};
      
      if (soils && soils.length > 0) {
        // Get the first soil (point should only be in one polygon)
        const soil = soils[0];
        result.nh_ssurgo_areasymbol = soil.areasymbol || null; // Soils code
        result.nh_ssurgo_muname = soil.muname || null; // Soil name
        result.nh_ssurgo_all = soils; // Store all soils with geometry for map drawing
        result.nh_ssurgo_count = soils.length;
      } else {
        result.nh_ssurgo_areasymbol = null;
        result.nh_ssurgo_muname = null;
        result.nh_ssurgo_all = [];
        result.nh_ssurgo_count = 0;
        result.nh_ssurgo_message = 'No soil data found for this location';
      }
      
      console.log(`✅ NH SSURGO data processed:`, {
        areasymbol: result.nh_ssurgo_areasymbol || 'N/A',
        muname: result.nh_ssurgo_muname || 'N/A',
        count: result.nh_ssurgo_count
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH SSURGO:', error);
      return {
        nh_ssurgo_areasymbol: null,
        nh_ssurgo_muname: null,
        nh_ssurgo_all: [],
        nh_ssurgo_count: 0,
        nh_ssurgo_error: 'Error fetching NH SSURGO data'
      };
    }
  }

  private async getNHBedrockGeology(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🪨 Fetching NH Bedrock Geology data for [${lat}, ${lon}]`);
      
      const formations = await getNHBedrockGeologyContainingData(lat, lon);
      
      const result: Record<string, any> = {};
      
      if (formations && formations.length > 0) {
        // Get the first formation (point should only be in one polygon)
        const formation = formations[0];
        result.nh_bedrock_geology_code = formation.code || null;
        result.nh_bedrock_geology_major = formation.major || null;
        result.nh_bedrock_geology_formation1 = formation.formation1 || null;
        result.nh_bedrock_geology_formation2 = formation.formation2 || null;
        result.nh_bedrock_geology_pluton_age = formation.pluton_age || null;
        result.nh_bedrock_geology_rock_type = formation.rock_type || null;
        result.nh_bedrock_geology_fullname = formation.fullname || null;
        result.nh_bedrock_geology_geologichistory = formation.geologichistory || null;
        result.nh_bedrock_geology_lithology = formation.lithology || null;
        result.nh_bedrock_geology_source = formation.source || null;
        result.nh_bedrock_geology_all = formations; // Store all formations with geometry for map drawing
        result.nh_bedrock_geology_count = formations.length;
      } else {
        result.nh_bedrock_geology_code = null;
        result.nh_bedrock_geology_major = null;
        result.nh_bedrock_geology_formation1 = null;
        result.nh_bedrock_geology_formation2 = null;
        result.nh_bedrock_geology_pluton_age = null;
        result.nh_bedrock_geology_rock_type = null;
        result.nh_bedrock_geology_fullname = null;
        result.nh_bedrock_geology_geologichistory = null;
        result.nh_bedrock_geology_lithology = null;
        result.nh_bedrock_geology_source = null;
        result.nh_bedrock_geology_all = [];
        result.nh_bedrock_geology_count = 0;
        result.nh_bedrock_geology_message = 'No bedrock geology data found for this location';
      }
      
      console.log(`✅ NH Bedrock Geology data processed:`, {
        code: result.nh_bedrock_geology_code || 'N/A',
        fullname: result.nh_bedrock_geology_fullname || 'N/A',
        count: result.nh_bedrock_geology_count
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Bedrock Geology:', error);
      return {
        nh_bedrock_geology_code: null,
        nh_bedrock_geology_major: null,
        nh_bedrock_geology_formation1: null,
        nh_bedrock_geology_formation2: null,
        nh_bedrock_geology_pluton_age: null,
        nh_bedrock_geology_rock_type: null,
        nh_bedrock_geology_fullname: null,
        nh_bedrock_geology_geologichistory: null,
        nh_bedrock_geology_lithology: null,
        nh_bedrock_geology_source: null,
        nh_bedrock_geology_all: [],
        nh_bedrock_geology_count: 0,
        nh_bedrock_geology_error: 'Error fetching NH Bedrock Geology data'
      };
    }
  }

  private async getNHGeographicNames(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`📍 Fetching NH Geographic Names data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      const places = await getNHGeographicNamesNearbyData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      if (places && places.length > 0) {
        result.nh_geographic_names_all = places; // Store all places for map drawing and CSV
        result.nh_geographic_names_count = places.length;
      } else {
        result.nh_geographic_names_all = [];
        result.nh_geographic_names_count = 0;
        result.nh_geographic_names_message = `No geographic names found within ${radius} miles`;
      }
      
      console.log(`✅ NH Geographic Names data processed:`, {
        count: result.nh_geographic_names_count
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Geographic Names:', error);
      return {
        nh_geographic_names_all: [],
        nh_geographic_names_count: 0,
        nh_geographic_names_error: 'Error fetching NH Geographic Names data'
      };
    }
  }

  private async getNHKeyDestinations(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`📍 Fetching NH Key Destinations data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const destinations = await getNHKeyDestinationsData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (destinations && destinations.length > 0) {
        result.nh_key_destinations_count = destinations.length;
        result.nh_key_destinations_all = destinations.map(dest => ({
          ...dest.attributes,
          name: dest.name,
          type: dest.type,
          lat: dest.lat,
          lon: dest.lon,
          distance_miles: dest.distance_miles
        }));
      } else {
        result.nh_key_destinations_count = 0;
        result.nh_key_destinations_all = [];
      }
      
      result.nh_key_destinations_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Key Destinations data processed:`, {
        count: result.nh_key_destinations_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Key Destinations:', error);
      return {
        nh_key_destinations_count: 0,
        nh_key_destinations_all: [],
        nh_key_destinations_error: 'Error fetching NH Key Destinations data'
      };
    }
  }

  private async getNHNursingHomes(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🏥 Fetching NH Nursing Homes data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const nursingHomes = await getNHNursingHomesData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (nursingHomes && nursingHomes.length > 0) {
        result.nh_nursing_homes_count = nursingHomes.length;
        result.nh_nursing_homes_all = nursingHomes.map(home => ({
          ...home.attributes,
          name: home.name,
          fac_type: home.fac_type,
          address: home.address,
          city: home.city,
          state: home.state,
          zip: home.zip,
          telephone: home.telephone,
          beds: home.beds,
          lat: home.lat,
          lon: home.lon,
          distance_miles: home.distance_miles
        }));
      } else {
        result.nh_nursing_homes_count = 0;
        result.nh_nursing_homes_all = [];
      }
      
      result.nh_nursing_homes_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Nursing Homes data processed:`, {
        count: result.nh_nursing_homes_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Nursing Homes:', error);
      return {
        nh_nursing_homes_count: 0,
        nh_nursing_homes_all: [],
        nh_nursing_homes_error: 'Error fetching NH Nursing Homes data'
      };
    }
  }

  private async getNHEMS(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🚑 Fetching NH EMS data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const emsFacilities = await getNHEMSData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (emsFacilities && emsFacilities.length > 0) {
        result.nh_ems_count = emsFacilities.length;
        result.nh_ems_all = emsFacilities.map(facility => ({
          ...facility.attributes,
          name: facility.name,
          type: facility.type,
          address: facility.address,
          city: facility.city,
          state: facility.state,
          zip: facility.zip,
          telephone: facility.telephone,
          owner: facility.owner,
          lat: facility.lat,
          lon: facility.lon,
          distance_miles: facility.distance_miles
        }));
      } else {
        result.nh_ems_count = 0;
        result.nh_ems_all = [];
      }
      
      result.nh_ems_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH EMS data processed:`, {
        count: result.nh_ems_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH EMS:', error);
      return {
        nh_ems_count: 0,
        nh_ems_all: [],
        nh_ems_error: 'Error fetching NH EMS data'
      };
    }
  }

  private async getNHFireStations(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🚒 Fetching NH Fire Stations data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const fireStations = await getNHFireStationsData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (fireStations && fireStations.length > 0) {
        result.nh_fire_stations_count = fireStations.length;
        result.nh_fire_stations_all = fireStations.map(station => ({
          ...station.attributes,
          name: station.name,
          type: station.type,
          address: station.address,
          city: station.city,
          state: station.state,
          zip: station.zip,
          telephone: station.telephone,
          owner: station.owner,
          fdid: station.fdid,
          lat: station.lat,
          lon: station.lon,
          distance_miles: station.distance_miles
        }));
      } else {
        result.nh_fire_stations_count = 0;
        result.nh_fire_stations_all = [];
      }
      
      result.nh_fire_stations_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Fire Stations data processed:`, {
        count: result.nh_fire_stations_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Fire Stations:', error);
      return {
        nh_fire_stations_count: 0,
        nh_fire_stations_all: [],
        nh_fire_stations_error: 'Error fetching NH Fire Stations data'
      };
    }
  }

  private async getNHPlacesOfWorship(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🕌 Fetching NH Places of Worship data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const placesOfWorship = await getNHPlacesOfWorshipData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (placesOfWorship && placesOfWorship.length > 0) {
        result.nh_places_of_worship_count = placesOfWorship.length;
        result.nh_places_of_worship_all = placesOfWorship.map(place => ({
          ...place.attributes,
          name: place.name,
          subtype: place.subtype,
          denom: place.denom,
          address: place.address,
          city: place.city,
          state: place.state,
          zip: place.zip,
          telephone: place.telephone,
          attendance: place.attendance,
          lat: place.lat,
          lon: place.lon,
          distance_miles: place.distance_miles
        }));
      } else {
        result.nh_places_of_worship_count = 0;
        result.nh_places_of_worship_all = [];
      }
      
      result.nh_places_of_worship_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Places of Worship data processed:`, {
        count: result.nh_places_of_worship_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Places of Worship:', error);
      return {
        nh_places_of_worship_count: 0,
        nh_places_of_worship_all: [],
        nh_places_of_worship_error: 'Error fetching NH Places of Worship data'
      };
    }
  }

  private async getNHHospitals(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🏥 Fetching NH Hospitals data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const hospitals = await getNHHospitalsData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (hospitals && hospitals.length > 0) {
        result.nh_hospitals_count = hospitals.length;
        result.nh_hospitals_all = hospitals.map(hospital => ({
          ...hospital.attributes,
          name: hospital.name,
          fac_type: hospital.fac_type,
          address: hospital.address,
          city: hospital.city,
          state: hospital.state,
          zip: hospital.zip,
          telephone: hospital.telephone,
          beds: hospital.beds,
          owner: hospital.owner,
          lat: hospital.lat,
          lon: hospital.lon,
          distance_miles: hospital.distance_miles
        }));
      } else {
        result.nh_hospitals_count = 0;
        result.nh_hospitals_all = [];
      }
      
      result.nh_hospitals_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Hospitals data processed:`, {
        count: result.nh_hospitals_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Hospitals:', error);
      return {
        nh_hospitals_count: 0,
        nh_hospitals_all: [],
        nh_hospitals_error: 'Error fetching NH Hospitals data'
      };
    }
  }

  private async getNHPublicWatersAccess(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🌊 Fetching NH Access Sites to Public Waters data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const accessSites = await getNHPublicWatersAccessData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (accessSites && accessSites.length > 0) {
        result.nh_public_waters_access_count = accessSites.length;
        result.nh_public_waters_access_all = accessSites.map(site => ({
          ...site.attributes,
          facility: site.facility,
          water_body: site.water_body,
          wb_type: site.wb_type,
          access_typ: site.access_typ,
          town: site.town,
          county: site.county,
          ownership: site.ownership,
          boat: site.boat,
          swim: site.swim,
          fish: site.fish,
          picnic: site.picnic,
          camp: site.camp,
          lat: site.lat,
          lon: site.lon,
          distance_miles: site.distance_miles
        }));
      } else {
        result.nh_public_waters_access_count = 0;
        result.nh_public_waters_access_all = [];
      }
      
      result.nh_public_waters_access_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Access Sites to Public Waters data processed:`, {
        count: result.nh_public_waters_access_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Access Sites to Public Waters:', error);
      return {
        nh_public_waters_access_count: 0,
        nh_public_waters_access_all: [],
        nh_public_waters_access_error: 'Error fetching NH Access Sites to Public Waters data'
      };
    }
  }

  private async getNHLawEnforcement(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🚔 Fetching NH Law Enforcement data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const lawEnforcementFacilities = await getNHLawEnforcementData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (lawEnforcementFacilities && lawEnforcementFacilities.length > 0) {
        result.nh_law_enforcement_count = lawEnforcementFacilities.length;
        result.nh_law_enforcement_all = lawEnforcementFacilities.map(facility => ({
          ...facility.attributes,
          name: facility.name,
          type: facility.type,
          address: facility.address,
          city: facility.city,
          state: facility.state,
          zip: facility.zip,
          telephone: facility.telephone,
          owner: facility.owner,
          lat: facility.lat,
          lon: facility.lon,
          distance_miles: facility.distance_miles
        }));
      } else {
        result.nh_law_enforcement_count = 0;
        result.nh_law_enforcement_all = [];
      }
      
      result.nh_law_enforcement_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Law Enforcement data processed:`, {
        count: result.nh_law_enforcement_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Law Enforcement:', error);
      return {
        nh_law_enforcement_count: 0,
        nh_law_enforcement_all: [],
        nh_law_enforcement_error: 'Error fetching NH Law Enforcement data'
      };
    }
  }

  private async getNHRecreationTrails(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🥾 Fetching NH Recreation Trails data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const trails = await getNHRecreationTrailsData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (trails && trails.length > 0) {
        result.nh_recreation_trails_count = trails.length;
        result.nh_recreation_trails_all = trails.map(trail => ({
          ...trail.attributes,
          name: trail.name,
          trail_type: trail.trail_type,
          length_miles: trail.length_miles,
          geometry: trail.geometry, // Include geometry for map drawing
          distance_miles: trail.distance_miles
        }));
      } else {
        result.nh_recreation_trails_count = 0;
        result.nh_recreation_trails_all = [];
      }
      
      result.nh_recreation_trails_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Recreation Trails data processed:`, {
        count: result.nh_recreation_trails_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Recreation Trails:', error);
      return {
        nh_recreation_trails_count: 0,
        nh_recreation_trails_all: [],
        nh_recreation_trails_error: 'Error fetching NH Recreation Trails data'
      };
    }
  }

  private async getNHStoneWalls(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🧱 Fetching NH Stone Walls data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const stoneWalls = await getNHStoneWallsData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (stoneWalls && stoneWalls.length > 0) {
        result.nh_stone_walls_count = stoneWalls.length;
        result.nh_stone_walls_all = stoneWalls.map(wall => {
          const { geometry, attributes, ...rest } = wall;
          return {
            ...attributes,
            ...rest,
            geometry: geometry, // Include geometry for map drawing
          };
        });
      } else {
        result.nh_stone_walls_count = 0;
        result.nh_stone_walls_all = [];
      }
      
      result.nh_stone_walls_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Stone Walls data processed:`, {
        count: result.nh_stone_walls_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Stone Walls:', error);
      return {
        nh_stone_walls_count: 0,
        nh_stone_walls_all: [],
        nh_stone_walls_error: 'Error fetching NH Stone Walls data'
      };
    }
  }

  private async getNHDOTRoads(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🛣️ Fetching NH DOT Roads data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 0.5 miles if not specified
      const radiusMiles = radius || 0.5;
      
      const roads = await getNHDOTRoadsData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (roads && roads.length > 0) {
        result.nh_dot_roads_count = roads.length;
        result.nh_dot_roads_all = roads.map(road => ({
          ...road.attributes,
          name: road.name,
          road_type: road.road_type,
          route_number: road.route_number,
          geometry: road.geometry, // Include geometry for map drawing
          distance_miles: road.distance_miles
        }));
      } else {
        result.nh_dot_roads_count = 0;
        result.nh_dot_roads_all = [];
      }
      
      result.nh_dot_roads_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH DOT Roads data processed:`, {
        count: result.nh_dot_roads_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH DOT Roads:', error);
      return {
        nh_dot_roads_count: 0,
        nh_dot_roads_all: [],
        nh_dot_roads_error: 'Error fetching NH DOT Roads data'
      };
    }
  }

  private async getNHRailroads(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🚂 Fetching NH Railroads data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 0.5 miles if not specified
      const radiusMiles = radius || 0.5;
      
      const railroads = await getNHRailroadsData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (railroads && railroads.length > 0) {
        result.nh_railroads_count = railroads.length;
        result.nh_railroads_all = railroads.map(railroad => ({
          ...railroad.attributes,
          name: railroad.name,
          status: railroad.status,
          ownership: railroad.ownership,
          operator: railroad.operator,
          length_miles: railroad.length_miles,
          geometry: railroad.geometry, // Include geometry for map drawing
          distance_miles: railroad.distance_miles
        }));
      } else {
        result.nh_railroads_count = 0;
        result.nh_railroads_all = [];
      }
      
      result.nh_railroads_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Railroads data processed:`, {
        count: result.nh_railroads_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Railroads:', error);
      return {
        nh_railroads_count: 0,
        nh_railroads_all: [],
        nh_railroads_error: 'Error fetching NH Railroads data'
      };
    }
  }

  private async getNHTransmissionPipelines(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`⚡ Fetching NH Transmission/Pipelines data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 0.5 miles if not specified
      const radiusMiles = radius || 0.5;
      
      const transmissionPipelines = await getNHTransmissionPipelinesData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (transmissionPipelines && transmissionPipelines.length > 0) {
        result.nh_transmission_pipelines_count = transmissionPipelines.length;
        result.nh_transmission_pipelines_all = transmissionPipelines.map(tp => {
          // Ensure geometry is preserved (don't let attributes.geometry overwrite it)
          const { geometry: _, ...attributesWithoutGeometry } = tp.attributes || {};
          return {
            ...attributesWithoutGeometry,
            type: tp.type,
            pia: tp.pia,
            granitid: tp.granitid,
            geometry: tp.geometry, // Include geometry for map drawing (from top level, not attributes)
            distance_miles: tp.distance_miles
          };
        });
      } else {
        result.nh_transmission_pipelines_count = 0;
        result.nh_transmission_pipelines_all = [];
      }
      
      result.nh_transmission_pipelines_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Transmission/Pipelines data processed:`, {
        count: result.nh_transmission_pipelines_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Transmission/Pipelines:', error);
      return {
        nh_transmission_pipelines_count: 0,
        nh_transmission_pipelines_all: [],
        nh_transmission_pipelines_error: 'Error fetching NH Transmission/Pipelines data'
      };
    }
  }

  private async getNHCellTowers(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`📡 Fetching NH Cell Towers data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const cellTowers = await getNHCellTowersData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (cellTowers && cellTowers.length > 0) {
        result.nh_cell_towers_count = cellTowers.length;
        result.nh_cell_towers_all = cellTowers.map(tower => ({
          ...tower.attributes,
          entity_name: tower.entity_name,
          structure_type: tower.structure_type,
          city: tower.city,
          state: tower.state,
          address: tower.address,
          height_above_ground_ft: tower.height_above_ground_ft,
          elevation_ft: tower.elevation_ft,
          lat: tower.latitude,
          lon: tower.longitude,
          distance_miles: tower.distance_miles
        }));
      } else {
        result.nh_cell_towers_count = 0;
        result.nh_cell_towers_all = [];
      }
      
      result.nh_cell_towers_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Cell Towers data processed:`, {
        count: result.nh_cell_towers_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Cell Towers:', error);
      return {
        nh_cell_towers_count: 0,
        nh_cell_towers_all: [],
        nh_cell_towers_error: 'Error fetching NH Cell Towers data'
      };
    }
  }

  private async getNHUndergroundStorageTanks(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🛢️ Fetching NH Underground Storage Tank Sites data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const ustSites = await getNHUndergroundStorageTanksData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (ustSites && ustSites.length > 0) {
        result.nh_underground_storage_tanks_count = ustSites.length;
        result.nh_underground_storage_tanks_all = ustSites.map(site => ({
          ...site.attributes,
          facility_name: site.facility_name,
          facility_address: site.facility_address,
          city: site.city,
          state: site.state,
          tank_count: site.tank_count,
          lat: site.latitude,
          lon: site.longitude,
          distance_miles: site.distance_miles
        }));
      } else {
        result.nh_underground_storage_tanks_count = 0;
        result.nh_underground_storage_tanks_all = [];
      }
      
      result.nh_underground_storage_tanks_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Underground Storage Tank Sites data processed:`, {
        count: result.nh_underground_storage_tanks_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Underground Storage Tank Sites:', error);
      return {
        nh_underground_storage_tanks_count: 0,
        nh_underground_storage_tanks_all: [],
        nh_underground_storage_tanks_error: 'Error fetching NH Underground Storage Tank Sites data'
      };
    }
  }

  private async getNHWaterWells(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`💧 Fetching NH Water Well Inventory data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const waterWells = await getNHWaterWellsData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (waterWells && waterWells.length > 0) {
        result.nh_water_wells_count = waterWells.length;
        result.nh_water_wells_all = waterWells.map(well => ({
          ...well.attributes,
          well_id: well.well_id,
          owner_name: well.owner_name,
          address: well.address,
          city: well.city,
          state: well.state,
          well_depth_ft: well.well_depth_ft,
          water_depth_ft: well.water_depth_ft,
          lat: well.latitude,
          lon: well.longitude,
          distance_miles: well.distance_miles
        }));
      } else {
        result.nh_water_wells_count = 0;
        result.nh_water_wells_all = [];
      }
      
      result.nh_water_wells_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Water Well Inventory data processed:`, {
        count: result.nh_water_wells_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Water Well Inventory:', error);
      return {
        nh_water_wells_count: 0,
        nh_water_wells_all: [],
        nh_water_wells_error: 'Error fetching NH Water Well Inventory data'
      };
    }
  }

  private async getNHPublicWaterSupplyWells(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🚰 Fetching NH Public Water Supply Wells data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const publicWells = await getNHPublicWaterSupplyWellsData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (publicWells && publicWells.length > 0) {
        result.nh_public_water_supply_wells_count = publicWells.length;
        result.nh_public_water_supply_wells_all = publicWells.map(well => ({
          ...well.attributes,
          well_id: well.well_id,
          facility_name: well.facility_name,
          owner_name: well.owner_name,
          address: well.address,
          city: well.city,
          state: well.state,
          well_depth_ft: well.well_depth_ft,
          water_depth_ft: well.water_depth_ft,
          lat: well.latitude,
          lon: well.longitude,
          distance_miles: well.distance_miles
        }));
      } else {
        result.nh_public_water_supply_wells_count = 0;
        result.nh_public_water_supply_wells_all = [];
      }
      
      result.nh_public_water_supply_wells_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Public Water Supply Wells data processed:`, {
        count: result.nh_public_water_supply_wells_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Public Water Supply Wells:', error);
      return {
        nh_public_water_supply_wells_count: 0,
        nh_public_water_supply_wells_all: [],
        nh_public_water_supply_wells_error: 'Error fetching NH Public Water Supply Wells data'
      };
    }
  }

  private async getNHRemediationSites(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🔧 Fetching NH Remediation Sites data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const remediationSites = await getNHRemediationSitesData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (remediationSites && remediationSites.length > 0) {
        result.nh_remediation_sites_count = remediationSites.length;
        result.nh_remediation_sites_all = remediationSites.map(site => ({
          ...site.attributes,
          site_id: site.site_id,
          site_name: site.site_name,
          facility_name: site.facility_name,
          address: site.address,
          city: site.city,
          state: site.state,
          site_status: site.site_status,
          lat: site.latitude,
          lon: site.longitude,
          distance_miles: site.distance_miles
        }));
      } else {
        result.nh_remediation_sites_count = 0;
        result.nh_remediation_sites_all = [];
      }
      
      result.nh_remediation_sites_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Remediation Sites data processed:`, {
        count: result.nh_remediation_sites_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Remediation Sites:', error);
      return {
        nh_remediation_sites_count: 0,
        nh_remediation_sites_all: [],
        nh_remediation_sites_error: 'Error fetching NH Remediation Sites data'
      };
    }
  }

  private async getNHAutomobileSalvageYards(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🚗 Fetching NH Automobile Salvage Yards data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const salvageYards = await getNHAutomobileSalvageYardsData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (salvageYards && salvageYards.length > 0) {
        result.nh_automobile_salvage_yards_count = salvageYards.length;
        result.nh_automobile_salvage_yards_all = salvageYards.map(yard => ({
          ...yard.attributes,
          facility_id: yard.facility_id,
          site_name: yard.site_name,
          address: yard.address,
          address2: yard.address2,
          town: yard.town,
          state: yard.state,
          status: yard.status,
          onestop_link: yard.onestop_link,
          lat: yard.latitude,
          lon: yard.longitude,
          distance_miles: yard.distance_miles
        }));
      } else {
        result.nh_automobile_salvage_yards_count = 0;
        result.nh_automobile_salvage_yards_all = [];
      }
      
      result.nh_automobile_salvage_yards_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Automobile Salvage Yards data processed:`, {
        count: result.nh_automobile_salvage_yards_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Automobile Salvage Yards:', error);
      return {
        nh_automobile_salvage_yards_count: 0,
        nh_automobile_salvage_yards_all: [],
        nh_automobile_salvage_yards_error: 'Error fetching NH Automobile Salvage Yards data'
      };
    }
  }

  private async getNHSolidWasteFacilities(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🗑️ Fetching NH Solid Waste Facilities data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const facilities = await getNHSolidWasteFacilitiesData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (facilities && facilities.length > 0) {
        result.nh_solid_waste_facilities_count = facilities.length;
        result.nh_solid_waste_facilities_all = facilities.map(facility => ({
          ...facility.attributes,
          swf_lid: facility.swf_lid,
          swf_name: facility.swf_name,
          swf_type: facility.swf_type,
          swf_status: facility.swf_status,
          swf_permit: facility.swf_permit,
          address: facility.address,
          address2: facility.address2,
          city: facility.city,
          state: facility.state,
          onestop_link: facility.onestop_link,
          lat: facility.latitude,
          lon: facility.longitude,
          distance_miles: facility.distance_miles
        }));
      } else {
        result.nh_solid_waste_facilities_count = 0;
        result.nh_solid_waste_facilities_all = [];
      }
      
      result.nh_solid_waste_facilities_search_radius_miles = radiusMiles;
      
      console.log(`✅ NH Solid Waste Facilities data processed:`, {
        count: result.nh_solid_waste_facilities_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Solid Waste Facilities:', error);
      return {
        nh_solid_waste_facilities_count: 0,
        nh_solid_waste_facilities_all: [],
        nh_solid_waste_facilities_error: 'Error fetching NH Solid Waste Facilities data'
      };
    }
  }

  private async getNHSourceWaterProtectionArea(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`💧 Fetching NH Source Water Protection Area data for [${lat}, ${lon}]`);
      
      const protectionArea = await getNHSourceWaterProtectionAreaData(lat, lon);
      
      const result: Record<string, any> = {};
      
      if (protectionArea) {
        result.nh_source_water_protection_area_system_id = protectionArea.system_id;
        result.nh_source_water_protection_area_allid = protectionArea.allid;
        result.nh_source_water_protection_area_name = protectionArea.name;
        result.nh_source_water_protection_area_address = protectionArea.address;
        result.nh_source_water_protection_area_town = protectionArea.town;
        result.nh_source_water_protection_area_system_act = protectionArea.system_act;
        result.nh_source_water_protection_area_system_typ = protectionArea.system_typ;
        result.nh_source_water_protection_area_system_cat = protectionArea.system_cat;
        result.nh_source_water_protection_area_population = protectionArea.population;
        result.nh_source_water_protection_area_dwpa_type = protectionArea.dwpa_type;
        result.nh_source_water_protection_area_dwpa_rad = protectionArea.dwpa_rad;
        result.nh_source_water_protection_area_geometry = protectionArea.geometry; // Include geometry for map drawing
      } else {
        result.nh_source_water_protection_area_system_id = null;
        result.nh_source_water_protection_area_allid = null;
        result.nh_source_water_protection_area_name = null;
        result.nh_source_water_protection_area_address = null;
        result.nh_source_water_protection_area_town = null;
        result.nh_source_water_protection_area_system_act = null;
        result.nh_source_water_protection_area_system_typ = null;
        result.nh_source_water_protection_area_system_cat = null;
        result.nh_source_water_protection_area_population = null;
        result.nh_source_water_protection_area_dwpa_type = null;
        result.nh_source_water_protection_area_dwpa_rad = null;
        result.nh_source_water_protection_area_geometry = null;
      }
      
      console.log(`✅ NH Source Water Protection Area data processed:`, {
        found: !!protectionArea,
        name: protectionArea?.name || 'None'
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Source Water Protection Area:', error);
      return {
        nh_source_water_protection_area_system_id: null,
        nh_source_water_protection_area_allid: null,
        nh_source_water_protection_area_name: null,
        nh_source_water_protection_area_address: null,
        nh_source_water_protection_area_town: null,
        nh_source_water_protection_area_system_act: null,
        nh_source_water_protection_area_system_typ: null,
        nh_source_water_protection_area_system_cat: null,
        nh_source_water_protection_area_population: null,
        nh_source_water_protection_area_dwpa_type: null,
        nh_source_water_protection_area_dwpa_rad: null,
        nh_source_water_protection_area_geometry: null,
        nh_source_water_protection_area_error: 'Error fetching NH Source Water Protection Area data'
      };
    }
  }

  private async getNHNWIPlus(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🌊 Fetching NH NWI Plus data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      
      // If radius is provided, do proximity query
      if (radius && radius > 0) {
        const { getNHNWIPlusContainingData, getNHNWIPlusNearbyData } = await import('../adapters/nhNWIPlus');
        
        // Get containing wetland (point-in-polygon)
        const containingWetland = await getNHNWIPlusContainingData(lat, lon);
        console.log('🌊 Containing wetland from adapter:', containingWetland);
        
        // Get nearby wetlands (proximity)
        const nearbyWetlands = await getNHNWIPlusNearbyData(lat, lon, radius);
        console.log(`🌊 Nearby wetlands from adapter: ${nearbyWetlands.length} found`);
        
        // Combine containing and nearby wetlands, avoiding duplicates
        const allWetlands: any[] = [];
        const seenIds = new Set<string>();
        
        // Add containing wetland first if it exists
        if (containingWetland) {
          const id = containingWetland.wetland_id || containingWetland.attributes?.OBJECTID || containingWetland.attributes?.objectid || containingWetland.attributes?.FID || containingWetland.attributes?.fid || 'unknown';
          if (!seenIds.has(String(id))) {
            seenIds.add(String(id));
            // Exclude geometry from attributes before spreading to avoid overwriting
            const { geometry: _, ...attributesWithoutGeometry } = containingWetland.attributes || {};
            allWetlands.push({
              ...attributesWithoutGeometry,
              wetland_id: containingWetland.wetland_id,
              wetland_type: containingWetland.wetland_type,
              wetland_class: containingWetland.wetland_class,
              geometry: containingWetland.geometry,
              isContaining: true,
              distance_miles: 0
            });
            console.log('🌊 Added containing wetland to allWetlands:', {
              wetland_id: containingWetland.wetland_id,
              has_geometry: !!containingWetland.geometry
            });
          }
        }
        
        // Add nearby wetlands (excluding the containing one)
        nearbyWetlands.forEach(wetland => {
          const id = wetland.wetland_id || wetland.attributes?.OBJECTID || wetland.attributes?.objectid || wetland.attributes?.FID || wetland.attributes?.fid || 'unknown';
          if (!seenIds.has(String(id))) {
            seenIds.add(String(id));
            // Exclude geometry from attributes before spreading to avoid overwriting
            const { geometry: _, ...attributesWithoutGeometry } = wetland.attributes || {};
            allWetlands.push({
              ...attributesWithoutGeometry,
              wetland_id: wetland.wetland_id,
              wetland_type: wetland.wetland_type,
              wetland_class: wetland.wetland_class,
              geometry: wetland.geometry,
              isContaining: false,
              distance_miles: wetland.distance_miles
            });
          }
        });
        
        console.log(`🌊 Total wetlands in allWetlands array: ${allWetlands.length}`);
        console.log('🌊 Sample wetland from allWetlands:', allWetlands[0] ? {
          wetland_id: allWetlands[0].wetland_id,
          wetland_type: allWetlands[0].wetland_type,
          wetland_class: allWetlands[0].wetland_class,
          has_geometry: !!allWetlands[0].geometry,
          isContaining: allWetlands[0].isContaining
        } : 'none');
        
        result.nh_nwi_plus_count = allWetlands.length;
        result.nh_nwi_plus_all = allWetlands;
        result.nh_nwi_plus_search_radius_miles = radius;
        
        // Also include the containing wetland fields for summary display
        if (containingWetland) {
          result.nh_nwi_plus_wetland_id = containingWetland.wetland_id;
          result.nh_nwi_plus_wetland_type = containingWetland.wetland_type;
          result.nh_nwi_plus_wetland_class = containingWetland.wetland_class;
        } else {
          result.nh_nwi_plus_wetland_id = null;
          result.nh_nwi_plus_wetland_type = null;
          result.nh_nwi_plus_wetland_class = null;
        }
      } else {
        // No radius provided, just do point-in-polygon query
        const { getNHNWIPlusContainingData } = await import('../adapters/nhNWIPlus');
        const wetland = await getNHNWIPlusContainingData(lat, lon);
        
        if (wetland) {
          result.nh_nwi_plus_wetland_id = wetland.wetland_id;
          result.nh_nwi_plus_wetland_type = wetland.wetland_type;
          result.nh_nwi_plus_wetland_class = wetland.wetland_class;
          result.nh_nwi_plus_geometry = wetland.geometry; // Include geometry for map drawing
        } else {
          result.nh_nwi_plus_wetland_id = null;
          result.nh_nwi_plus_wetland_type = null;
          result.nh_nwi_plus_wetland_class = null;
          result.nh_nwi_plus_geometry = null;
        }
      }
      
      console.log(`✅ NH NWI Plus data processed:`, {
        count: result.nh_nwi_plus_count || (result.nh_nwi_plus_wetland_id ? 1 : 0),
        has_containing: !!result.nh_nwi_plus_wetland_id
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH NWI Plus:', error);
      return {
        nh_nwi_plus_wetland_id: null,
        nh_nwi_plus_wetland_type: null,
        nh_nwi_plus_wetland_class: null,
        nh_nwi_plus_geometry: null,
        nh_nwi_plus_count: 0,
        nh_nwi_plus_all: [],
        nh_nwi_plus_error: 'Error fetching NH NWI Plus data'
      };
    }
  }

  private async getMADEPWetlands(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🌊 Fetching MA DEP Wetlands data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      
      if (radius && radius > 0) {
        // Proximity query - get both containing and nearby wetlands
        const containingWetlands = await getMADEPWetlandsContainingData(lat, lon);
        console.log('🌊 Containing wetlands from adapter:', containingWetlands.length);
        
        const nearbyWetlands = await getMADEPWetlandsNearbyData(lat, lon, radius);
        console.log(`🌊 Nearby wetlands from adapter: ${nearbyWetlands.length} found`);
        
        // Combine results, avoiding duplicates by OBJECTID (primary) or GLOBALID (fallback)
        // Use a composite key to ensure uniqueness
        const allWetlandsMap = new Map<string, MADEPWetland>();
        
        // Add containing wetlands first (distance = 0)
        containingWetlands.forEach(wetland => {
          // Use OBJECTID as primary key, GLOBALID as fallback, or a combination
          const key = wetland.objectId !== undefined && wetland.objectId !== null 
            ? `oid_${wetland.objectId}` 
            : (wetland.globalId 
              ? `gid_${wetland.globalId}` 
              : null);
          if (key) {
            allWetlandsMap.set(key, wetland);
          }
        });
        
        // Add nearby wetlands (only if not already present as containing feature)
        nearbyWetlands.forEach(wetland => {
          const key = wetland.objectId !== undefined && wetland.objectId !== null 
            ? `oid_${wetland.objectId}` 
            : (wetland.globalId 
              ? `gid_${wetland.globalId}` 
              : null);
          if (key && !allWetlandsMap.has(key)) {
            // Only add if not already present (containing features take precedence)
            allWetlandsMap.set(key, wetland);
          }
        });
        
        const allWetlands = Array.from(allWetlandsMap.values());
        
        if (allWetlands.length > 0) {
          result.ma_dep_wetlands_count = allWetlands.length;
          console.log(`✅ MA DEP Wetlands: Processing ${allWetlands.length} wetlands, first has geometry:`, !!(allWetlands[0] as any)?.geometry);
          result.ma_dep_wetlands_all = allWetlands.map((wetland, idx) => {
            const wetlandAny = wetland as any;
            const geometry = wetlandAny.geometry;
            const attributes = wetlandAny.attributes;
            const { geometry: _geom1, ...rest } = wetlandAny;
            if (idx === 0) {
              console.log(`🔍 MA DEP Wetland 0 - geometry:`, !!geometry, 'has rings:', !!geometry?.rings, 'rings length:', geometry?.rings?.length);
            }
            // Exclude geometry from attributes if it exists there
            const { geometry: _geom2, ...cleanAttributes } = attributes || {};
            // Exclude geometry from rest to ensure it doesn't overwrite
            const { geometry: _geom3, ...cleanRest } = rest || {};
            const result = {
              ...cleanAttributes,
              ...cleanRest,
              geometry: geometry, // Include geometry for map drawing (from top level)
            };
            if (idx === 0) {
              console.log(`🔍 MA DEP Wetland 0 - result has geometry:`, !!result.geometry, 'has rings:', !!result.geometry?.rings);
            }
            return result;
          });
        } else {
          result.ma_dep_wetlands_count = 0;
          result.ma_dep_wetlands_all = [];
        }
        
        result.ma_dep_wetlands_search_radius_miles = radius;
      } else {
        // Point-in-polygon query only
        const containingWetlands = await getMADEPWetlandsContainingData(lat, lon);
        
        if (containingWetlands.length > 0) {
          result.ma_dep_wetlands_count = containingWetlands.length;
          result.ma_dep_wetlands_all = containingWetlands.map(wetland => {
            const wetlandAny = wetland as any;
            const geometry = wetlandAny.geometry;
            const attributes = wetlandAny.attributes;
            const { geometry: _geom4, ...rest } = wetlandAny;
            // Exclude geometry from attributes if it exists there
            const { geometry: _geom5, ...cleanAttributes } = attributes || {};
            // Exclude geometry from rest to ensure it doesn't overwrite
            const { geometry: _geom6, ...cleanRest } = rest || {};
            return {
              ...cleanAttributes,
              ...cleanRest,
              geometry: geometry, // Include geometry for map drawing (from top level)
            };
          });
        } else {
          result.ma_dep_wetlands_count = 0;
          result.ma_dep_wetlands_all = [];
        }
      }
      
      console.log(`✅ MA DEP Wetlands data processed:`, {
        count: result.ma_dep_wetlands_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching MA DEP Wetlands:', error);
      return {
        ma_dep_wetlands_count: 0,
        ma_dep_wetlands_all: [],
        ma_dep_wetlands_error: 'Error fetching MA DEP Wetlands data'
      };
    }
  }

  private async getMAOpenSpace(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏞️ Fetching MA Open Space data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      
      if (radius && radius > 0) {
        // Proximity query - get both containing and nearby open spaces
        const containingOpenSpaces = await getMAOpenSpaceContainingData(lat, lon);
        console.log('🏞️ Containing open spaces from adapter:', containingOpenSpaces.length);
        
        const nearbyOpenSpaces = await getMAOpenSpaceNearbyData(lat, lon, radius);
        console.log(`🏞️ Nearby open spaces from adapter: ${nearbyOpenSpaces.length} found`);
        
        // Combine results, avoiding duplicates by OBJECTID
        const allOpenSpacesMap = new Map<number, MAOpenSpace>();
        
        // Add containing open spaces first (distance = 0)
        containingOpenSpaces.forEach(openSpace => {
          if (openSpace.objectId) {
            allOpenSpacesMap.set(openSpace.objectId, openSpace);
          }
        });
        
        // Add nearby open spaces (only if not already present as containing feature)
        nearbyOpenSpaces.forEach(openSpace => {
          if (openSpace.objectId && !allOpenSpacesMap.has(openSpace.objectId)) {
            // Only add if not already present (containing features take precedence)
            allOpenSpacesMap.set(openSpace.objectId, openSpace);
          }
        });
        
        const allOpenSpaces = Array.from(allOpenSpacesMap.values());
        
        if (allOpenSpaces.length > 0) {
          result.ma_open_space_count = allOpenSpaces.length;
          console.log(`✅ MA Open Space: Processing ${allOpenSpaces.length} open spaces, first has geometry:`, !!(allOpenSpaces[0] as any)?.geometry);
          result.ma_open_space_all = allOpenSpaces.map((openSpace, idx) => {
            const openSpaceAny = openSpace as any;
            const geometry = openSpaceAny.geometry;
            const attributes = openSpaceAny.attributes;
            const { geometry: _geom7, ...rest } = openSpaceAny;
            if (idx === 0) {
              console.log(`🔍 MA Open Space 0 - geometry:`, !!geometry, 'has rings:', !!geometry?.rings, 'rings length:', geometry?.rings?.length);
            }
            // Exclude geometry from attributes if it exists there
            const { geometry: _geom8, ...cleanAttributes } = attributes || {};
            // Exclude geometry from rest to ensure it doesn't overwrite
            const { geometry: _geom9, ...cleanRest } = rest || {};
            const result = {
              ...cleanAttributes,
              ...cleanRest,
              geometry: geometry, // Include geometry for map drawing (from top level)
            };
            if (idx === 0) {
              console.log(`🔍 MA Open Space 0 - result has geometry:`, !!result.geometry, 'has rings:', !!result.geometry?.rings);
            }
            return result;
          });
        } else {
          result.ma_open_space_count = 0;
          result.ma_open_space_all = [];
        }
        
        result.ma_open_space_search_radius_miles = radius;
      } else {
        // Point-in-polygon query only
        const containingOpenSpaces = await getMAOpenSpaceContainingData(lat, lon);
        
        if (containingOpenSpaces.length > 0) {
          result.ma_open_space_count = containingOpenSpaces.length;
          result.ma_open_space_all = containingOpenSpaces.map(openSpace => {
            const openSpaceAny = openSpace as any;
            const geometry = openSpaceAny.geometry;
            const attributes = openSpaceAny.attributes;
            const { geometry: _geom10, ...rest } = openSpaceAny;
            // Exclude geometry from attributes if it exists there
            const { geometry: _geom11, ...cleanAttributes } = attributes || {};
            // Exclude geometry from rest to ensure it doesn't overwrite
            const { geometry: _geom12, ...cleanRest } = rest || {};
            return {
              ...cleanAttributes,
              ...cleanRest,
              geometry: geometry, // Include geometry for map drawing (from top level)
            };
          });
        } else {
          result.ma_open_space_count = 0;
          result.ma_open_space_all = [];
        }
      }
      
      console.log(`✅ MA Open Space data processed:`, {
        count: result.ma_open_space_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching MA Open Space:', error);
      return {
        ma_open_space_count: 0,
        ma_open_space_all: [],
        ma_open_space_error: 'Error fetching MA Open Space data'
      };
    }
  }

  private async getCapeCodZoning(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏘️ Fetching Cape Cod Zoning data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      
      if (radius && radius > 0) {
        // Proximity query - get both containing and nearby zoning areas
        const containingZoning = await getCapeCodZoningContainingData(lat, lon);
        console.log('🏘️ Containing zoning areas from adapter:', containingZoning.length);
        
        const nearbyZoning = await getCapeCodZoningNearbyData(lat, lon, radius);
        console.log(`🏘️ Nearby zoning areas from adapter: ${nearbyZoning.length} found`);
        
        // Combine results, avoiding duplicates by FID (primary) or OBJECTID (fallback)
        // Use a composite key to ensure uniqueness: FID takes precedence, then OBJECTID
        const allZoningMap = new Map<string, CapeCodZoning>();
        
        // Add containing zoning areas first (distance = 0)
        containingZoning.forEach(zoning => {
          // Use FID as primary key, OBJECTID as fallback, or a combination
          const key = zoning.fid !== undefined && zoning.fid !== null 
            ? `fid_${zoning.fid}` 
            : (zoning.objectId !== undefined && zoning.objectId !== null 
              ? `oid_${zoning.objectId}` 
              : null);
          if (key) {
            allZoningMap.set(key, zoning);
          }
        });
        
        // Add nearby zoning areas (only if not already present as containing feature)
        nearbyZoning.forEach(zoning => {
          const key = zoning.fid !== undefined && zoning.fid !== null 
            ? `fid_${zoning.fid}` 
            : (zoning.objectId !== undefined && zoning.objectId !== null 
              ? `oid_${zoning.objectId}` 
              : null);
          if (key && !allZoningMap.has(key)) {
            // Only add if not already present (containing features take precedence)
            allZoningMap.set(key, zoning);
          }
        });
        
        const allZoning = Array.from(allZoningMap.values());
        
        if (allZoning.length > 0) {
          result.cape_cod_zoning_count = allZoning.length;
          // Get the containing zone code for summary output (first one with distance = 0)
          const containingZone = allZoning.find(z => z.distance_miles === 0 || z.distance_miles === null);
          if (containingZone) {
            result.cape_cod_zoning_zone_code = containingZone.zoneCode || '';
          }
          result.cape_cod_zoning_all = allZoning.map(zoning => {
            const { geometry, attributes, ...rest } = zoning;
            // Exclude geometry from attributes if it exists there
            const { geometry: _, ...cleanAttributes } = attributes || {};
            return {
              ...cleanAttributes,
              ...rest,
              geometry: geometry, // Include geometry for map drawing
            };
          });
        } else {
          result.cape_cod_zoning_count = 0;
          result.cape_cod_zoning_all = [];
        }
        
        result.cape_cod_zoning_search_radius_miles = radius;
      } else {
        // Point-in-polygon query only
        const containingZoning = await getCapeCodZoningContainingData(lat, lon);
        
        if (containingZoning.length > 0) {
          result.cape_cod_zoning_count = containingZoning.length;
          // Get the zone code for summary output (first one)
          if (containingZoning[0]) {
            result.cape_cod_zoning_zone_code = containingZoning[0].zoneCode || '';
          }
          result.cape_cod_zoning_all = containingZoning.map(zoning => {
            const { geometry, attributes, ...rest } = zoning;
            // Exclude geometry from attributes if it exists there
            const { geometry: _, ...cleanAttributes } = attributes || {};
            return {
              ...cleanAttributes,
              ...rest,
              geometry: geometry, // Include geometry for map drawing
            };
          });
        } else {
          result.cape_cod_zoning_count = 0;
          result.cape_cod_zoning_all = [];
        }
      }
      
      console.log(`✅ Cape Cod Zoning data processed:`, {
        count: result.cape_cod_zoning_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching Cape Cod Zoning:', error);
      return {
        cape_cod_zoning_count: 0,
        cape_cod_zoning_all: [],
        cape_cod_zoning_error: 'Error fetching Cape Cod Zoning data'
      };
    }
  }

  private async getMATrails(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🥾 Fetching MA Trails data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      
      if (!radius || radius <= 0) {
        // Trails require a radius for proximity queries
        result.ma_trails_count = 0;
        result.ma_trails_all = [];
        return result;
      }
      
      const trails = await getMATrailsData(lat, lon, radius);
      console.log(`🥾 MA Trails from adapter: ${trails.length} found`);
      
      if (trails.length > 0) {
        result.ma_trails_count = trails.length;
        result.ma_trails_all = trails.map(trail => {
          const trailAny = trail as any;
          const geometry = trailAny.geometry;
          const attributes = trailAny.attributes;
          const { geometry: _geom13, ...rest } = trailAny;
          // Exclude geometry from attributes if it exists there
          const { geometry: _geom14, ...cleanAttributes } = attributes || {};
          // Exclude geometry from rest to ensure it doesn't overwrite
          const { geometry: _geom15, ...cleanRest } = rest || {};
          return {
            ...cleanAttributes,
            ...cleanRest,
            geometry: geometry, // Include geometry for map drawing
          };
        });
      } else {
        result.ma_trails_count = 0;
        result.ma_trails_all = [];
      }
      
      result.ma_trails_search_radius_miles = radius;
      
      console.log(`✅ MA Trails data processed:`, {
        count: result.ma_trails_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching MA Trails:', error);
      return {
        ma_trails_count: 0,
        ma_trails_all: [],
        ma_trails_error: 'Error fetching MA Trails data'
      };
    }
  }

  private async getMANHESPNaturalCommunities(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🌿 Fetching MA NHESP Natural Communities data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      
      if (radius && radius > 0) {
        // Proximity query - get both containing and nearby communities
        const containingCommunities = await getMANHESPNaturalCommunitiesContainingData(lat, lon);
        console.log('🌿 Containing communities from adapter:', containingCommunities.length);
        
        const nearbyCommunities = await getMANHESPNaturalCommunitiesNearbyData(lat, lon, radius);
        console.log(`🌿 Nearby communities from adapter: ${nearbyCommunities.length} found`);
        
        // Combine results, avoiding duplicates by composite string key
        const allCommunitiesMap = new Map<string, any>();
        
        // Add containing communities first (distance = 0)
        containingCommunities.forEach(community => {
          const key = community.objectId !== undefined && community.objectId !== null 
            ? `oid_${community.objectId}` 
            : (community.uniqueId !== undefined && community.uniqueId !== null
              ? `uid_${community.uniqueId}`
              : null);
          if (key) {
            allCommunitiesMap.set(key, community);
          }
        });
        
        // Add nearby communities (only if not already present as containing feature)
        nearbyCommunities.forEach(community => {
          const key = community.objectId !== undefined && community.objectId !== null 
            ? `oid_${community.objectId}` 
            : (community.uniqueId !== undefined && community.uniqueId !== null
              ? `uid_${community.uniqueId}`
              : null);
          if (key && !allCommunitiesMap.has(key)) {
            // Only add if not already present (containing features take precedence)
            allCommunitiesMap.set(key, community);
          }
        });
        
        const allCommunities = Array.from(allCommunitiesMap.values());
        
        if (allCommunities.length > 0) {
          result.ma_nhesp_natural_communities_count = allCommunities.length;
          console.log(`✅ MA NHESP Natural Communities: Processing ${allCommunities.length} communities, first has geometry:`, !!(allCommunities[0] as any)?.geometry);
          result.ma_nhesp_natural_communities_all = allCommunities.map((community, idx) => {
            const communityAny = community as any;
            const geometry = communityAny.geometry;
            const attributes = communityAny.attributes;
            if (idx === 0) {
              console.log(`🔍 MA NHESP Natural Community 0 - geometry:`, !!geometry, 'has rings:', !!geometry?.rings, 'rings length:', geometry?.rings?.length);
            }
            const { geometry: _geom16, ...rest } = communityAny;
            // Exclude geometry from attributes if it exists there
            const { geometry: _geom17, ...cleanAttributes } = attributes || {};
            // Exclude geometry from rest to ensure it doesn't overwrite
            const { geometry: _geom18, ...cleanRest } = rest || {};
            const result = {
              ...cleanAttributes,
              ...cleanRest,
              geometry: geometry, // Include geometry for map drawing (from top level)
            };
            if (idx === 0) {
              console.log(`🔍 MA NHESP Natural Community 0 - result has geometry:`, !!result.geometry, 'has rings:', !!result.geometry?.rings);
            }
            return result;
          });
        } else {
          result.ma_nhesp_natural_communities_count = 0;
          result.ma_nhesp_natural_communities_all = [];
        }
        
        result.ma_nhesp_natural_communities_search_radius_miles = radius;
      } else {
        // Point-in-polygon query only
        const containingCommunities = await getMANHESPNaturalCommunitiesContainingData(lat, lon);
        
        if (containingCommunities.length > 0) {
          result.ma_nhesp_natural_communities_count = containingCommunities.length;
          result.ma_nhesp_natural_communities_all = containingCommunities.map((community, idx) => {
            const communityAny = community as any;
            const geometry = communityAny.geometry;
            const attributes = communityAny.attributes;
            if (idx === 0) {
              console.log(`🔍 MA NHESP Natural Community 0 (containing) - geometry:`, !!geometry, 'has rings:', !!geometry?.rings, 'rings length:', geometry?.rings?.length);
            }
            const { geometry: _geom19, ...rest } = communityAny;
            // Exclude geometry from attributes if it exists there
            const { geometry: _geom20, ...cleanAttributes } = attributes || {};
            // Exclude geometry from rest to ensure it doesn't overwrite
            const { geometry: _geom21, ...cleanRest } = rest || {};
            const result = {
              ...cleanAttributes,
              ...cleanRest,
              geometry: geometry, // Include geometry for map drawing (from top level)
            };
            if (idx === 0) {
              console.log(`🔍 MA NHESP Natural Community 0 (containing) - result has geometry:`, !!result.geometry, 'has rings:', !!result.geometry?.rings);
            }
            return result;
          });
        } else {
          result.ma_nhesp_natural_communities_count = 0;
          result.ma_nhesp_natural_communities_all = [];
        }
      }
      
      console.log(`✅ MA NHESP Natural Communities data processed:`, {
        count: result.ma_nhesp_natural_communities_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching MA NHESP Natural Communities:', error);
      return {
        ma_nhesp_natural_communities_count: 0,
        ma_nhesp_natural_communities_all: [],
        ma_nhesp_natural_communities_error: 'Error fetching MA NHESP Natural Communities data'
      };
    }
  }

  private async getMARiversAndStreams(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🌊 Fetching MA Rivers and Streams data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      
      if (!radius || radius <= 0) {
        // Rivers and Streams require a radius for proximity queries
        result.ma_rivers_and_streams_count = 0;
        result.ma_rivers_and_streams_all = [];
        return result;
      }
      
      const riversAndStreams = await getMARiversAndStreamsNearbyData(lat, lon, radius);
      console.log(`🌊 MA Rivers and Streams from adapter: ${riversAndStreams.length} found`);
      
      if (riversAndStreams.length > 0) {
        result.ma_rivers_and_streams_count = riversAndStreams.length;
        result.ma_rivers_and_streams_all = riversAndStreams.map(river => {
          const riverAny = river as any;
          const geometry = riverAny.geometry;
          const attributes = riverAny.attributes;
          const { geometry: _geom34, ...rest } = riverAny;
          // Exclude geometry from attributes if it exists there
          const { geometry: _geom35, ...cleanAttributes } = attributes || {};
          // Exclude geometry from rest to ensure it doesn't overwrite
          const { geometry: _geom36, ...cleanRest } = rest || {};
          return {
            ...cleanAttributes,
            ...cleanRest,
            geometry: geometry, // Include geometry for map drawing
          };
        });
      } else {
        result.ma_rivers_and_streams_count = 0;
        result.ma_rivers_and_streams_all = [];
      }
      
      result.ma_rivers_and_streams_search_radius_miles = radius;
      
      console.log(`✅ MA Rivers and Streams data processed:`, {
        count: result.ma_rivers_and_streams_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching MA Rivers and Streams:', error);
      return {
        ma_rivers_and_streams_count: 0,
        ma_rivers_and_streams_all: [],
        ma_rivers_and_streams_error: 'Error fetching MA Rivers and Streams data'
      };
    }
  }

  private async getMALakesAndPonds(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏞️ Fetching MA Lakes and Ponds data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      
      if (radius && radius > 0) {
        // Proximity query - get both containing and nearby lakes/ponds
        const containingLakes = await getMALakesAndPondsContainingData(lat, lon);
        console.log('🏞️ Containing lakes/ponds from adapter:', containingLakes.length);
        
        const nearbyLakes = await getMALakesAndPondsNearbyData(lat, lon, radius);
        console.log(`🏞️ Nearby lakes/ponds from adapter: ${nearbyLakes.length} found`);
        
        // Combine results, avoiding duplicates by composite string key
        const allLakesMap = new Map<string, any>();
        
        // Add containing lakes first (distance = 0)
        containingLakes.forEach(lake => {
          const key = lake.objectId !== undefined && lake.objectId !== null 
            ? `oid_${lake.objectId}` 
            : null;
          if (key) {
            allLakesMap.set(key, lake);
          }
        });
        
        // Add nearby lakes (only if not already present as containing feature)
        nearbyLakes.forEach(lake => {
          const key = lake.objectId !== undefined && lake.objectId !== null 
            ? `oid_${lake.objectId}` 
            : null;
          if (key && !allLakesMap.has(key)) {
            // Only add if not already present (containing features take precedence)
            allLakesMap.set(key, lake);
          }
        });
        
        const allLakes = Array.from(allLakesMap.values());
        
        if (allLakes.length > 0) {
          result.ma_lakes_and_ponds_count = allLakes.length;
          console.log(`✅ MA Lakes and Ponds: Processing ${allLakes.length} lakes/ponds`);
          result.ma_lakes_and_ponds_all = allLakes.map((lake, idx) => {
            const lakeAny = lake as any;
            const geometry = lakeAny.geometry;
            const attributes = lakeAny.attributes;
            
            if (idx === 0) {
              console.log(`🔍 MA Lake/Pond 0 - Original geometry:`, !!geometry, 'has rings:', !!geometry?.rings, 'rings length:', geometry?.rings?.length);
              console.log(`🔍 MA Lake/Pond 0 - Original attributes:`, !!attributes);
            }
            
            // Extract geometry from top level before processing
            const { geometry: _geom28, attributes: _attrs, ...rest } = lakeAny;
            
            // Exclude geometry from attributes if it exists there
            const { geometry: _geom29, ...cleanAttributes } = attributes || {};
            
            // Build result object - ensure geometry is preserved from top level
            const result = {
              ...cleanAttributes, // Attributes without geometry
              ...rest, // Other top-level properties (like objectId, name, etc.) without geometry or attributes
              geometry: geometry, // Include geometry for map drawing (from top level, preserved)
            };
            
            if (idx === 0) {
              console.log(`🔍 MA Lake/Pond 0 - Result geometry:`, !!result.geometry, 'has rings:', !!result.geometry?.rings, 'rings length:', result.geometry?.rings?.length);
            }
            
            return result;
          });
        } else {
          result.ma_lakes_and_ponds_count = 0;
          result.ma_lakes_and_ponds_all = [];
        }
        
        result.ma_lakes_and_ponds_search_radius_miles = radius;
      } else {
        // Point-in-polygon query only
        const containingLakes = await getMALakesAndPondsContainingData(lat, lon);
        
        if (containingLakes.length > 0) {
          result.ma_lakes_and_ponds_count = containingLakes.length;
          result.ma_lakes_and_ponds_all = containingLakes.map((lake, idx) => {
            const lakeAny = lake as any;
            const geometry = lakeAny.geometry;
            const attributes = lakeAny.attributes;
            
            if (idx === 0) {
              console.log(`🔍 MA Lake/Pond 0 (containing) - Original geometry:`, !!geometry, 'has rings:', !!geometry?.rings, 'rings length:', geometry?.rings?.length);
            }
            
            // Extract geometry from top level before processing
            const { geometry: _geom31, attributes: _attrs, ...rest } = lakeAny;
            
            // Exclude geometry from attributes if it exists there
            const { geometry: _geom32, ...cleanAttributes } = attributes || {};
            
            // Build result object - ensure geometry is preserved from top level
            const result = {
              ...cleanAttributes, // Attributes without geometry
              ...rest, // Other top-level properties (like objectId, name, etc.) without geometry or attributes
              geometry: geometry, // Include geometry for map drawing (from top level, preserved)
            };
            
            if (idx === 0) {
              console.log(`🔍 MA Lake/Pond 0 (containing) - Result geometry:`, !!result.geometry, 'has rings:', !!result.geometry?.rings, 'rings length:', result.geometry?.rings?.length);
            }
            
            return result;
          });
        } else {
          result.ma_lakes_and_ponds_count = 0;
          result.ma_lakes_and_ponds_all = [];
        }
      }
      
      console.log(`✅ MA Lakes and Ponds data processed:`, {
        count: result.ma_lakes_and_ponds_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching MA Lakes and Ponds:', error);
      return {
        ma_lakes_and_ponds_count: 0,
        ma_lakes_and_ponds_all: [],
        ma_lakes_and_ponds_error: 'Error fetching MA Lakes and Ponds data'
      };
    }
  }

  private async getNHParcels(lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🏠 Fetching NH Parcels data for [${lat}, ${lon}] with radius ${radius} miles`);
      
      // Use the provided radius, defaulting to 0.25 miles if not specified
      const radiusMiles = radius || 0.25;
      
      const parcelData = await getNHParcelData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {};
      
      if (parcelData) {
        // Collect all parcels (containing + nearby) into a single array for CSV export
        const allParcels: any[] = [];
        
        // Add containing parcel (point-in-polygon) if found
        if (parcelData.containingParcel && parcelData.containingParcel.parcelId) {
          allParcels.push({
            ...parcelData.containingParcel.attributes,
            parcelId: parcelData.containingParcel.parcelId,
            isContaining: true,
            distance_miles: 0,
            geometry: parcelData.containingParcel.geometry // Include geometry for map drawing
          });
          result.nh_parcel_containing = parcelData.containingParcel.parcelId;
        } else {
          result.nh_parcel_containing = null;
          result.nh_parcel_containing_message = 'No parcel found containing this location';
        }
        
        // Add nearby parcels (proximity search)
        if (parcelData.nearbyParcels && parcelData.nearbyParcels.length > 0) {
          parcelData.nearbyParcels.forEach(parcel => {
            // Only add if it's not already in the array (avoid duplicates)
            if (!allParcels.some(p => p.parcelId === parcel.parcelId)) {
              allParcels.push({
                ...parcel.attributes,
                parcelId: parcel.parcelId,
                isContaining: false,
                distance_miles: null, // Distance not calculated in proximity query
                geometry: parcel.geometry // Include geometry for map drawing
              });
            }
          });
          result.nh_parcels_nearby_count = parcelData.nearbyParcels.length;
        } else {
          result.nh_parcels_nearby_count = 0;
        }
        
        // Store all parcels as an array for CSV export (similar to _all_pois pattern)
        result.nh_parcels_all = allParcels;
        result.nh_parcels_search_radius_miles = radiusMiles;
      } else {
        result.nh_parcel_containing = null;
        result.nh_parcels_nearby_count = 0;
        result.nh_parcels_all = [];
      }
      
      console.log(`✅ NH Parcels data processed:`, {
        containing: result.nh_parcel_containing || 'N/A',
        nearbyCount: result.nh_parcels_nearby_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NH Parcels:', error);
      return {
        nh_parcel_containing: null,
        nh_parcels_nearby_count: 0,
        nh_parcels_all: [],
        nh_parcels_error: 'Error fetching NH Parcels data'
      };
    }
  }

  private async getFIPSCodes(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log('🌐 Fetching rich census data from Census Geocoder API...');
      
      // Try direct API first, then CORS proxy if needed
      const directUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lon}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;
      
      console.log('🌐 Census Geocoder Direct URL:', directUrl);
      
      let j;
      try {
        // Try direct first
        j = await fetchJSONSmart(directUrl);
      } catch (corsError) {
        console.warn('⚠️ Direct Census API blocked by CORS, trying proxy...', corsError);
        console.log('🌐 Census Geocoder Proxy URL:', proxyUrl);
        j = await fetchJSONSmart(proxyUrl);
      }
      
      if (!j?.result?.geographies) {
        console.warn('⚠️ Census Geocoder returned no geographic data');
        return {};
      }
      
      const geo = j.result.geographies;
      
      // Extract all the rich geographic data
      const state = geo.States?.[0];
      const county = geo.Counties?.[0];
      const tract = geo['Census Tracts']?.[0];
      const block = geo['2020 Census Blocks']?.[0];
      const place = geo['Incorporated Places']?.[0];
      const urbanArea = geo['Urban Areas']?.[0];
      const csa = geo['Combined Statistical Areas']?.[0];
      const subdivision = geo['County Subdivisions']?.[0];
      const congressionalDistrict = geo['119th Congressional Districts']?.[0];
      const stateSenate = geo['2024 State Legislative Districts - Upper']?.[0];
      const stateHouse = geo['2024 State Legislative Districts - Lower']?.[0];
      
      const result: Record<string, any> = {};
      
      // Basic FIPS codes (for compatibility)
      if (block && tract && county && state) {
        result.fips_block = block.GEOID;
        result.fips_tract = tract.GEOID;
        result.fips_state = state.STATE;
        result.fips_county = county.COUNTY;
        result.fips_tract6 = tract.TRACT;
      }
      
      // Rich State Information
      if (state) {
        result.state_name = state.NAME;
        result.state_code = state.STUSAB;
        result.state_geoid = state.GEOID;
        result.state_region = state.REGION;
        result.state_division = state.DIVISION;
      }
      
      // Rich County Information
      if (county) {
        result.county_name = county.NAME;
        result.county_geoid = county.GEOID;
        result.county_basename = county.BASENAME;
      }
      
      // Census Tract Information
      if (tract) {
        result.census_tract_name = tract.NAME;
        result.census_tract_geoid = tract.GEOID;
        result.census_tract_basename = tract.BASENAME;
      }
      
      // Census Block Information
      if (block) {
        result.census_block_name = block.NAME;
        result.census_block_geoid = block.GEOID;
        result.census_block_basename = block.BASENAME;
        result.census_block_urban_rural = block.UR === 'U' ? 'Urban' : 'Rural';
      }
      
      // Incorporated Place (City/Town)
      if (place) {
        result.city_name = place.NAME;
        result.city_geoid = place.GEOID;
        result.city_basename = place.BASENAME;
        result.city_functional_status = place.FUNCSTAT;
      }
      
      // Urban Area
      if (urbanArea) {
        result.urban_area_name = urbanArea.NAME;
        result.urban_area_geoid = urbanArea.GEOID;
        result.urban_area_basename = urbanArea.BASENAME;
      }
      
      // Combined Statistical Area (Metro Area)
      if (csa) {
        result.metro_area_name = csa.NAME;
        result.metro_area_geoid = csa.GEOID;
        result.metro_area_basename = csa.BASENAME;
      }
      
      // County Subdivision
      if (subdivision) {
        result.subdivision_name = subdivision.NAME;
        result.subdivision_geoid = subdivision.GEOID;
        result.subdivision_basename = subdivision.BASENAME;
      }
      
      // Congressional District
      if (congressionalDistrict) {
        result.congressional_district = congressionalDistrict.NAME;
        result.congressional_district_geoid = congressionalDistrict.GEOID;
        result.congressional_district_number = congressionalDistrict.CD119;
      }
      
      // State Legislative Districts
      if (stateSenate) {
        result.state_senate_district = stateSenate.NAME;
        result.state_senate_district_geoid = stateSenate.GEOID;
      }
      
      if (stateHouse) {
        result.state_house_district = stateHouse.NAME;
        result.state_house_district_geoid = stateHouse.GEOID;
      }
      
      console.log('✅ Rich census/geographic data successfully retrieved:', Object.keys(result).length, 'fields');
      return result;
      
    } catch (error) {
      console.error('❌ Census Geocoder API error:', error);
      console.warn('⚠️ Census/geographic data will be unavailable for this location');
      
      // Return empty object but don't break the entire enrichment process
      return {};
    }
  }



  private async getACSDemographics(stateCode: string, countyCode: string, tractCode: string): Promise<Record<string, any>> {
    if (!stateCode || !countyCode || !tractCode) return {};
    
    try {
      const ACS_VARS: Record<string, string> = {
        'B01003_001E': 'acs_population',
        'B19013_001E': 'acs_median_hh_income',
        'B01002_001E': 'acs_median_age'
      };
      
      const variables = Object.keys(ACS_VARS).join(",");
      const url = `https://api.census.gov/data/2022/acs/acs5?get=${variables},NAME&for=tract:${tractCode}&in=state:${stateCode}%20county:${countyCode}`;
      
      const j = await fetchJSONSmart(url);
      
      if (!Array.isArray(j) || j.length < 2) return {};
      
      const header = j[0];
      const row = j[1];
      const result: Record<string, any> = {};
      
      header.forEach((h: string, i: number) => {
        if (ACS_VARS[h]) {
          result[ACS_VARS[h]] = row[i];
        }
      });
      
      result.acs_name = row[header.indexOf('NAME')] || null;
      return result;
    } catch (error) {
      console.error('❌ Census ACS API error:', error);
      return {};
    }
  }



  private async getNWSAlerts(lat: number, lon: number): Promise<number> {
    try {
      const response = await fetchJSONSmart(`https://api.weather.gov/alerts?point=${lat},${lon}`);
      return response?.features?.length || 0;
    } catch (error) {
      console.error('NWS API error:', error);
      return 0;
    }
  }

  private async getPOICount(enrichmentId: string, lat: number, lon: number, radius: number): Promise<Record<string, any>> {
    try {
      console.log(`🔍 getPOICount called for ${enrichmentId} at [${lat}, ${lon}] with ${radius}mi radius`);
      
      // Use Overpass API for OSM-based POIs
      const filters = this.getFiltersFor(enrichmentId);
      console.log(`🔍 Filters found for ${enrichmentId}:`, filters);
      
      if (filters.length > 0) {
        // Handle custom API calls (like Animal-Vehicle Impact (AVI) and Wildfires)
        if (filters.includes("custom_api")) {
          console.log(`🔍 Calling custom API for ${enrichmentId}...`);
          
          let result;
          if (enrichmentId === "poi_animal_vehicle_collisions") {
            result = await this.getAnimalVehicleCollisions(lat, lon, radius);
          } else if (enrichmentId === "poi_wildfires") {
            result = await this.getWildfires(lat, lon, radius);
          } else {
            console.warn(`Unknown custom API enrichment: ${enrichmentId}`);
            result = { count: 0, elements: [], detailed_pois: [] };
          }
          
          console.log(`🔍 Custom API result for ${enrichmentId}:`, {
            count: result.count,
            elementsCount: result.elements?.length || 0,
            hasDetailedPois: !!(result as any).detailed_pois,
            detailedPoisCount: (result as any).detailed_pois?.length || 0
          });
          
          const countKey = `${enrichmentId}_count_${radius}mi`;
          const poiResult: Record<string, any> = { [countKey]: result.count };
          
          // Include detailed POI data for mapping (if available)
          if ((result as any).detailed_pois && (result as any).detailed_pois.length > 0) {
            poiResult[`${enrichmentId}_detailed`] = (result as any).detailed_pois;
            console.log(`✅ Added ${(result as any).detailed_pois.length} detailed POIs for ${enrichmentId}`);
          } else {
            console.log(`⚠️  No detailed POIs found for ${enrichmentId}`);
          }
          
          // Include ALL POI data for CSV export (complete dataset)
          if ((result as any).all_pois && (result as any).all_pois.length > 0) {
            poiResult[`${enrichmentId}_all_pois`] = (result as any).all_pois;
            console.log(`✅ Added ${(result as any).all_pois.length} ALL POIs for ${enrichmentId} CSV export`);
          } else {
            console.log(`⚠️  No all_pois found for ${enrichmentId}`);
          }
          
          // Include elements data for map display (if available)
          if ((result as any).elements && (result as any).elements.length > 0) {
            poiResult[`${enrichmentId}_elements`] = (result as any).elements;
            console.log(`✅ Added ${(result as any).elements.length} elements for ${enrichmentId} map display`);
          } else {
            console.log(`⚠️  No elements found for ${enrichmentId}`);
          }
          
          console.log(`🔍 Final poiResult for ${enrichmentId}:`, poiResult);
          return poiResult;
        }
        
        // Handle OSM-based POIs
        console.log(`🔍 Calling overpassCountMiles for ${enrichmentId}...`);
        const result = await this.overpassCountMiles(lat, lon, radius, filters);
        console.log(`🔍 overpassCountMiles result for ${enrichmentId}:`, {
          count: result.count,
          elementsCount: result.elements?.length || 0,
          hasDetailedPois: !!(result as any).detailed_pois,
          detailedPoisCount: (result as any).detailed_pois?.length || 0
        });
        
        const countKey = `${enrichmentId}_count_${radius}mi`;
        const poiResult: Record<string, any> = { [countKey]: result.count };
        
        // Include detailed POI data for mapping (if available)
        if ((result as any).detailed_pois && (result as any).detailed_pois.length > 0) {
          poiResult[`${enrichmentId}_detailed`] = (result as any).detailed_pois;
          console.log(`✅ Added ${(result as any).detailed_pois.length} detailed POIs for ${enrichmentId}`);
        } else {
          console.log(`⚠️  No detailed POIs found for ${enrichmentId}`);
        }
        
        // Include ALL POI data for CSV export (complete dataset)
        if ((result as any).all_pois && (result as any).all_pois.length > 0) {
          poiResult[`${enrichmentId}_all_pois`] = (result as any).all_pois;
          console.log(`✅ Added ${(result as any).all_pois.length} ALL POIs for ${enrichmentId} CSV export`);
        } else {
          console.log(`⚠️  No all_pois found for ${enrichmentId}`);
        }
        
        // Include elements data for map display (if available)
        if ((result as any).elements && (result as any).elements.length > 0) {
          poiResult[`${enrichmentId}_elements`] = (result as any).elements;
          console.log(`✅ Added ${(result as any).elements.length} elements for ${enrichmentId} map display`);
        } else {
          console.log(`⚠️  No elements found for ${enrichmentId}`);
        }
        
        console.log(`🔍 Final poiResult for ${enrichmentId}:`, poiResult);
        return poiResult;
      }
      
      // Return 0 for POI types without proper OSM filters
      // This prevents fake random numbers from appearing
      const key = `${enrichmentId}_count_${radius}mi`;
      console.log(`⚠️  No OSM filters found for ${enrichmentId}, returning 0`);
      return { [key]: 0 };
    } catch (error) {
      console.error(`POI count failed for ${enrichmentId}:`, error);
      const key = `${enrichmentId}_count_${radius}mi`;
      return { [key]: 0 };
    }
  }

  private getFiltersFor(id: string): string[] {
    // Add comprehensive logging to debug POI filter issues
    console.log(`🔍 Looking for OSM filters for: ${id}`);
    
    if (id === "poi_schools") {
      console.log(`🏫 Schools filter requested - returning ["amenity=school"]`);
      return ["amenity=school"];
    }
    if (id === "poi_hospitals") return ["amenity=hospital"];
    if (id === "poi_parks") return ["leisure=park"];
    if (id === "poi_grocery") return ["shop=supermarket", "shop=convenience"];
    if (id === "poi_restaurants") return ["amenity=restaurant", "amenity=fast_food"];
    if (id === "poi_banks") return ["amenity=bank", "amenity=atm"];
    if (id === "poi_pharmacies") return ["shop=pharmacy", "amenity=pharmacy"];
    if (id === "poi_worship") return ["amenity=place_of_worship"];
    if (id === "poi_doctors_clinics") return ["amenity=clinic", "amenity=doctors"];
    if (id === "poi_dentists") return ["amenity=dentist"];
    if (id === "poi_gyms") return ["leisure=fitness_centre", "leisure=gym"];
    if (id === "poi_cinemas") return ["amenity=cinema"];
    if (id === "poi_theatres") return ["amenity=theatre"];
    if (id === "poi_museums_historic") return ["tourism=museum", "historic=memorial", "historic=monument", "historic=castle", "historic=ruins", "historic=archaeological_site"];
    if (id === "poi_hotels") return ["tourism=hotel", "tourism=hostel"];
    if (id === "poi_breweries") return ["craft=brewery", "amenity=pub"];
    
    // Updated police and fire station filters using canonical OSM tags
    if (id === "poi_police_stations") return ["amenity=police"];
    if (id === "poi_fire_stations") return ["amenity=fire_station"];
    
    if (id === "poi_urgent_care") return ["amenity=clinic"];
    if (id === "poi_golf_courses") return ["leisure=golf_course"];
    if (id === "poi_boat_ramps") return ["leisure=boat_ramp"];
    if (id === "poi_cafes_coffee") return ["amenity=cafe", "shop=coffee"];
    if (id === "poi_markets") return ["shop=marketplace", "amenity=marketplace"];
    
         // Add missing POI types that were showing up in your results
    if (id === "poi_airports") return ["aeroway=aerodrome", "aeroway=airstrip", "aeroway=heliport", "aeroway=landing_strip"];
     if (id === "poi_substations") return ["power=substation"];
     if (id === "poi_powerlines") return ["power=line"];
     if (id === "poi_power_plants_openei") return ["power=plant", "power=generator"];
     if (id === "poi_railroads") return ["railway=rail"];
     if (id === "poi_gas") return ["amenity=fuel"];
     
     // The Location Is Everything Company - Animal-Vehicle Impact (AVI) API
     if (id === "poi_animal_vehicle_collisions") return ["custom_api"];
     
     // NIFC/Esri Current Wildfires
     if (id === "poi_wildfires") return ["custom_api"];
     
     // Fix missing POI types showing 0 counts
     if (id === "poi_tnm_airports") return ["aeroway=aerodrome", "aeroway=airport"];
     if (id === "poi_tnm_railroads") return ["railway=rail"];
     if (id === "poi_tnm_trails") return ["route=hiking", "route=foot", "leisure=park"];
     
     // Comprehensive transportation POI types
    if (id === "poi_bus") return [
      "highway=bus_stop",
      "amenity=bus_station",
      "public_transport=platform|bus=yes",
      "public_transport=platform|bus=designated"
    ];
    if (id === "poi_train") return [
      "railway=station",
      "railway=halt",
      "railway=stop",
      "railway=platform",
      "public_transport=platform|train=yes",
      "public_transport=stop_position|train=yes"
    ];
    if (id === "poi_subway_metro") return [
      "railway=subway_entrance",
      "railway=station|station=subway",
      "railway=station|subway=yes",
      "railway=platform|subway=yes",
      "public_transport=stop_position|subway=yes"
    ];
    if (id === "poi_tram") return [
      "railway=tram_stop",
      "railway=platform|tram=yes",
      "public_transport=platform|tram=yes",
      "public_transport=stop_position|tram=yes"
    ];
    if (id === "poi_monorail") return [
      "railway=monorail",
      "railway=station|monorail=yes",
      "railway=platform|monorail=yes",
      "public_transport=platform|monorail=yes"
    ];
    if (id === "poi_aerialway") return [
      "aerialway=station",
      "aerialway=gondola",
      "aerialway=cable_car",
      "aerialway=chair_lift",
      "aerialway=drag_lift"
    ];
    if (id === "poi_ferry") return ["amenity=ferry_terminal"];
    if (id === "poi_airport_air") return ["aeroway=terminal", "aeroway=gate", "aeroway=boarding_area"];
     if (id === "poi_taxi") return ["amenity=taxi"];
     if (id === "poi_bike_scooter_share") return ["amenity=bicycle_rental", "amenity=scooter_rental"];
     if (id === "poi_dockless_hub") return ["amenity=bicycle_rental", "amenity=scooter_rental"];
     
     // Natural Resources
     if (id === "poi_beaches") return ["natural=beach"];
     if (id === "poi_lakes_ponds") return ["water=lake", "water=pond"];
     if (id === "poi_rivers_streams") return ["waterway=river", "waterway=stream", "waterway=brook"];
     if (id === "poi_mountains_peaks") return ["natural=peak", "natural=mountain"];
     
     // Legacy transportation POI types (keeping for backward compatibility)
     if (id === "poi_train_stations") return ["railway=station", "railway=halt", "station=subway"];
     if (id === "poi_bus_stations") return ["amenity=bus_station", "public_transport=station"];
     if (id === "poi_bus_stops") return ["highway=platform", "public_transport=platform"];
     if (id === "poi_cell_towers") return ["man_made=mast", "man_made=tower", "tower:type=communication", "communication:mobile_phone=yes"];
     if (id === "poi_bars_nightlife") return ["amenity=bar", "amenity=pub", "amenity=nightclub", "amenity=biergarten", "amenity=music_venue"];
     
           // Hazards
      if (id === "poi_fema_flood_zones") return ["fema_flood_zones"]; // Special handling for FEMA flood zones
      
      // EPA FRS Environmental Hazards
      if (id === "poi_epa_brownfields") return ["epa_frs_brownfields"];
      if (id === "poi_epa_superfund") return ["epa_frs_superfund"];
      if (id === "poi_epa_rcra") return ["epa_frs_rcra"];
      if (id === "poi_epa_tri") return ["epa_frs_tri"];
      if (id === "poi_epa_npdes") return ["epa_frs_npdes"];
      if (id === "poi_epa_air") return ["epa_frs_air"];
      if (id === "poi_epa_radiation") return ["epa_frs_radiation"];
      if (id === "poi_epa_power") return ["epa_frs_power"];
      if (id === "poi_epa_oil_spill") return ["epa_frs_oil_spill"];
      
      // USDA Local Food Portal - Farmers Markets & Local Food
      if (id === "poi_usda_agritourism") return ["usda_agritourism"];
      if (id === "poi_usda_csa") return ["usda_csa"];
      if (id === "poi_usda_farmers_market") return ["usda_farmers_market"];
      if (id === "poi_usda_food_hub") return ["usda_food_hub"];
      if (id === "poi_usda_onfarm_market") return ["usda_onfarm_market"];
    
    console.log(`⚠️  No OSM filters found for: ${id}`);
    return [];
  }

  // Custom Overpass query for mountain biking and biking trails
  private async getMountainBikingTrails(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🚴 Mountain Biking Trails query for [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      const bbox = this.calculateBoundingBox(lat, lon, radiusMiles);
      
      // Build comprehensive Overpass query for MTB and bike trails
      // Based on user's requirements: highway=path/track with bicycle=yes/designated and mtb=yes
      // Also includes cycleways and official MTB/bike routes
      const overpassQuery = `[out:json][timeout:60];
(
  // MTB trails: paths and tracks with bicycle and mtb tags
  way["highway"="path"]["bicycle"~"yes|designated"]["mtb"="yes"](${bbox});
  way["highway"="track"]["bicycle"~"yes|designated"]["mtb"="yes"](${bbox});
  
  // General bike trails: cycleways and paths/tracks with bicycle designation
  way["highway"="cycleway"](${bbox});
  way["highway"="path"]["bicycle"~"yes|designated"](${bbox});
  way["highway"="track"]["bicycle"~"yes|designated"](${bbox});
  
  // Official MTB and bicycle route relations
  relation["route"="mtb"](${bbox});
  relation["route"="bicycle"](${bbox});
);
out center;`;

      console.log(`🚴 Overpass query for MTB/Biking trails:`, overpassQuery);
      
      const res = await fetchJSONSmart("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: overpassQuery,
        headers: { "Content-Type": "text/plain;charset=UTF-8" }
      });
      
      console.log(`📊 Overpass API response:`, res);
      
      if (!res || !res.elements) {
        console.error(`❌ Invalid Overpass API response:`, res);
        return { [`poi_mountain_biking_count_${radiusMiles}mi`]: 0 };
      }
      
      const elements = res.elements || [];
      console.log(`📊 Overpass API returned ${elements.length} trail elements within bbox`);
      
      // Process trails and calculate distances
      const nearbyTrails: any[] = [];
      const seen = new Set();
      const norm = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
      
      for (const el of elements) {
        let latc: number | null = null;
        let lonc: number | null = null;
        
        if (el.type === 'node') {
          latc = el.lat;
          lonc = el.lon;
        } else if (el.type === 'way' || el.type === 'relation') {
          latc = el.center?.lat;
          lonc = el.center?.lon;
        }
        
        if (latc == null || lonc == null) continue;
        
        const distanceMiles = this.calculateDistance(lat, lon, latc, lonc) * 0.621371;
        if (!Number.isFinite(distanceMiles) || distanceMiles > radiusMiles) {
          continue;
        }
        
        // Determine trail type
        const isMTB = el.tags?.mtb === 'yes' || el.tags?.route === 'mtb';
        const isCycleway = el.tags?.highway === 'cycleway';
        const isBikeRoute = el.tags?.route === 'bicycle';
        const trailType = isMTB ? 'MTB' : (isCycleway ? 'Cycleway' : (isBikeRoute ? 'Bike Route' : 'Bike Trail'));
        
        const nameOrType = el.tags?.name || el.tags?.ref || `${trailType} ${el.id}`;
        const key = `${norm(nameOrType)}|${latc.toFixed(4)},${lonc.toFixed(4)}`;
        
        if (!seen.has(key)) {
          seen.add(key);
          nearbyTrails.push({
            ...el,
            processed_name: nameOrType,
            trail_type: trailType,
            is_mtb: isMTB,
            distance_miles: Number(distanceMiles.toFixed(2)),
            mtb_scale: el.tags?.['mtb:scale'],
            surface: el.tags?.surface,
            sac_scale: el.tags?.['sac_scale']
          });
        }
      }
      
      console.log(`✅ Found ${nearbyTrails.length} unique biking/MTB trails within ${radiusMiles} miles`);
      
      // Sort by distance
      const sortedTrails = [...nearbyTrails].sort((a, b) => a.distance_miles - b.distance_miles);
      
      // Count by type
      const mtbCount = sortedTrails.filter(t => t.is_mtb).length;
      const bikeCount = sortedTrails.length - mtbCount;
      
      const countKey = `poi_mountain_biking_count_${radiusMiles}mi`;
      const result: Record<string, any> = {
        [countKey]: sortedTrails.length,
        poi_mountain_biking_total: sortedTrails.length,
        poi_mountain_biking_mtb_count: mtbCount,
        poi_mountain_biking_bike_count: bikeCount,
        poi_mountain_biking_summary: `Found ${sortedTrails.length} biking trails (${mtbCount} MTB, ${bikeCount} general bike trails) within ${radiusMiles} miles`
      };
      
      // Add detailed trail data for mapping
      if (sortedTrails.length > 0) {
        result.poi_mountain_biking_detailed = sortedTrails.slice(0, 5000).map((trail, index) => ({
          id: `${trail.id || trail.type + '_' + index}`,
          type: trail.type,
          name: trail.tags?.name || trail.processed_name || 'Unnamed Trail',
          trail_type: trail.trail_type,
          is_mtb: trail.is_mtb,
          lat: trail.lat || trail.center?.lat,
          lon: trail.lon || trail.center?.lon,
          distance_miles: trail.distance_miles,
          mtb_scale: trail.mtb_scale,
          surface: trail.surface,
          sac_scale: trail.sac_scale,
          tags: trail.tags,
          highway: trail.tags?.highway,
          bicycle: trail.tags?.bicycle,
          route: trail.tags?.route
        }));
        
        result.poi_mountain_biking_all_pois = sortedTrails.map(trail => ({
          id: trail.id,
          type: trail.type,
          name: trail.tags?.name || trail.processed_name || 'Unnamed Trail',
          trail_type: trail.trail_type,
          is_mtb: trail.is_mtb,
          lat: trail.lat || trail.center?.lat,
          lon: trail.lon || trail.center?.lon,
          distance_miles: trail.distance_miles,
          mtb_scale: trail.mtb_scale,
          surface: trail.surface,
          sac_scale: trail.sac_scale,
          tags: trail.tags
        }));
      }
      
      return result;
    } catch (error) {
      console.error('🚴 Mountain Biking Trails query failed:', error);
      return { [`poi_mountain_biking_count_${radiusMiles}mi`]: 0 };
    }
  }

  private async overpassCountMiles(lat: number, lon: number, radiusMiles: number, filters: string[]): Promise<{ count: number, elements: any[] }> {
    try {
      console.log(`🗺️  overpassCountMiles called with:`, {
        lat,
        lon,
        radiusMiles,
        filters,
        timestamp: new Date().toISOString()
      });
      
      // Calculate accurate bounding box using proven 111,320 meters per degree formula
      const bbox = this.calculateBoundingBox(lat, lon, radiusMiles);
      
          // Build query using your exact working syntax - ALL element types for POIs
    let queryParts: string[] = [];
    filters.forEach(filter => {
      // Fix: Overpass needs separate quotes around key and value: ["key"="value"]
      const [key, value] = filter.split('=');
      // Overpass expects bbox in parentheses: (south,west,north,east)
      // The bbox variable already contains the comma-separated values
      queryParts.push(`  node["${key}"="${value}"](${bbox});`);
      queryParts.push(`  way["${key}"="${value}"](${bbox});`);
      queryParts.push(`  relation["${key}"="${value}"](${bbox});`);
    });
      
             const q = `[out:json][timeout:60];
 (
 ${queryParts.join('\n')}
 );
 out center;`;
      
      console.log(`🗺️  Overpass API Query for ${radiusMiles}mi radius:`);
      console.log(`📍 Location: ${lat}, ${lon}`);
      console.log(`📦 Bounding Box: ${bbox}`);
      console.log(`📦 Formatted Bbox: (${bbox})`);
      console.log(`🔍 Filters: ${filters.join(', ')}`);
      console.log(`🔍 Query Parts:`, queryParts);
      console.log(`📝 Final Query: ${q}`);
      
      const res = await fetchJSONSmart("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: q,
        headers: { "Content-Type": "text/plain;charset=UTF-8" }
      });
      
      console.log(`📊 Overpass API response:`, res);
      
      if (!res || !res.elements) {
        console.error(`❌ Invalid Overpass API response:`, res);
        return { count: 0, elements: [] };
      }
      
      const elements = res.elements || [];
      console.log(`📊 Overpass API returned ${elements.length} elements within bbox`);
      
      // Process POIs returned by bbox (server has already filtered spatially)
      const nearbyPOIs: any[] = [];
      const seen = new Set();
      const norm = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
      
      for (const el of elements) {
        // Handle different element types with out center format
        let latc: number | null = null;
        let lonc: number | null = null;
        
        if (el.type === 'node') {
          // Nodes have direct lat/lon coordinates
          latc = el.lat;
          lonc = el.lon;
        } else if (el.type === 'way' || el.type === 'relation') {
          // Ways and relations use center coordinates with out center
          latc = el.center?.lat;
          lonc = el.center?.lon;
        }
        
        if (latc == null || lonc == null) continue;
        
        const distanceMiles = this.calculateDistance(lat, lon, latc, lonc) * 0.621371;
        if (!Number.isFinite(distanceMiles) || distanceMiles > radiusMiles) {
          continue;
        }
        
        const nameOrType =
          el.tags?.name ||
          el.tags?.amenity ||
          el.tags?.shop ||
          el.tags?.tourism ||
          el.tags?.man_made ||
          `${el.type}_${el.id}`;
        
        const key = `${norm(nameOrType)}|${latc.toFixed(4)},${lonc.toFixed(4)}`;
        if (!seen.has(key)) {
          seen.add(key);
          nearbyPOIs.push({
            ...el,
            processed_name: nameOrType,
            distance_miles: Number(distanceMiles.toFixed(2))
          });
        }
      }
      
             console.log(`✅ Bbox query results: ${nearbyPOIs.length} unique POIs within ${radiusMiles} miles`);
       
               // TEMPORARY: Show detailed restaurant records for inspection
        if (nearbyPOIs.length > 0 && filters.some(f => f.includes('restaurant') || f.includes('fast_food'))) {
          // Sort by distance (closest to farthest)
          const sortedPOIs = [...nearbyPOIs].sort((a, b) => a.distance_miles - b.distance_miles);
          
          console.log(`🍽️  DETAILED RESTAURANT RECORDS (showing top 250 by proximity):`);
          console.log(`📊 Total restaurants found: ${nearbyPOIs.length}`);
          console.log(`📍 Distance range: ${sortedPOIs[0].distance_miles} - ${sortedPOIs[sortedPOIs.length - 1].distance_miles} miles`);
          
          sortedPOIs.slice(0, 250).forEach((poi, index) => {
            console.log(`\n--- Restaurant ${index + 1} (${poi.distance_miles} miles) ---`);
            console.log(`Name: ${poi.tags?.name || 'Unnamed'}`);
            console.log(`Type: ${poi.tags?.amenity || 'Unknown'}`);
            console.log(`OSM ID: ${poi.id}`);
            console.log(`Element Type: ${poi.type}`);
            console.log(`Coordinates: ${poi.lat || poi.center?.lat}, ${poi.lon || poi.center?.lon}`);
            console.log(`Distance: ${poi.distance_miles} miles`);
            console.log(`Address: ${poi.tags?.['addr:street'] || 'N/A'} ${poi.tags?.['addr:housenumber'] || ''}`);
            console.log(`City: ${poi.tags?.['addr:city'] || 'N/A'}`);
            console.log(`All Tags:`, poi.tags);
          });
          
          if (nearbyPOIs.length > 250) {
            console.log(`\n... and ${nearbyPOIs.length - 250} more restaurants`);
          }
        }
        
        // TEMPORARY: Show detailed police and fire station records for inspection
        if (nearbyPOIs.length > 0 && filters.some(f => f.includes('police') || f.includes('fire_station'))) {
          // Sort by distance (closest to farthest)
          const sortedPOIs = [...nearbyPOIs].sort((a, b) => a.distance_miles - b.distance_miles);
          
          const poiType = filters.some(f => f.includes('police')) ? 'POLICE STATIONS' : 'FIRE STATIONS';
          console.log(`🚔  DETAILED ${poiType} RECORDS (showing ALL by proximity):`);
          console.log(`📊 Total ${poiType.toLowerCase()} found: ${nearbyPOIs.length}`);
          console.log(`📍 Distance range: ${sortedPOIs[0].distance_miles} - ${sortedPOIs[sortedPOIs.length - 1].distance_miles} miles`);
          
          sortedPOIs.forEach((poi, index) => {
            console.log(`\n--- ${poiType.slice(0, -1)} ${index + 1} (${poi.distance_miles} miles) ---`);
            console.log(`Name: ${poi.tags?.name || 'Unnamed'}`);
            console.log(`Type: ${poi.tags?.amenity || 'Unknown'}`);
            console.log(`OSM ID: ${poi.id}`);
            console.log(`Element Type: ${poi.type}`);
            console.log(`Coordinates: ${poi.lat || poi.center?.lat}, ${poi.lon || poi.center?.lon}`);
            console.log(`Distance: ${poi.distance_miles} miles`);
            console.log(`Address: ${poi.tags?.['addr:street'] || 'N/A'} ${poi.tags?.['addr:housenumber'] || ''}`);
            console.log(`City: ${poi.tags?.['addr:city'] || 'N/A'}`);
            console.log(`All Tags:`, poi.tags);
          });
        }

        // TEMPORARY: Show detailed school records for inspection
        if (nearbyPOIs.length > 0 && filters.some(f => f.includes('school'))) {
          // Sort by distance (closest to farthest)
          const sortedPOIs = [...nearbyPOIs].sort((a, b) => a.distance_miles - b.distance_miles);
          
          console.log(`🏫  DETAILED SCHOOL RECORDS (showing ALL by proximity):`);
          console.log(`📊 Total schools found: ${nearbyPOIs.length}`);
          console.log(`📍 Distance range: ${sortedPOIs[0].distance_miles} - ${sortedPOIs[sortedPOIs.length - 1].distance_miles} miles`);
          
          sortedPOIs.forEach((poi, index) => {
            console.log(`\n--- School ${index + 1} (${poi.distance_miles} miles) ---`);
            console.log(`Name: ${poi.tags?.name || 'Unnamed'}`);
            console.log(`Type: ${poi.tags?.amenity || 'Unknown'}`);
            console.log(`OSM ID: ${poi.id}`);
            console.log(`Element Type: ${poi.type}`);
            console.log(`Coordinates: ${poi.lat || poi.center?.lat}, ${poi.lon || poi.center?.lon}`);
            console.log(`Distance: ${poi.distance_miles} miles`);
            console.log(`Address: ${poi.tags?.['addr:street'] || 'N/A'} ${poi.tags?.['addr:housenumber'] || ''}`);
            console.log(`City: ${poi.tags?.['addr:city'] || 'N/A'}`);
            console.log(`All Tags:`, poi.tags);
          });
        }
       
       if (nearbyPOIs.length > 0) {
         const distances = nearbyPOIs.map(p => p.distance_miles).sort((a, b) => a - b);
         console.log(`📍 Distance range: ${distances[0]} - ${distances[distances.length - 1]} miles`);
         
         // Show some sample POIs
         const samplePOIs = nearbyPOIs.slice(0, 3).map(p => ({
           name: p.tags?.name || 'Unnamed',
           distance: p.distance_miles,
           type: p.tags?.amenity || p.tags?.shop || p.tags?.tourism || 'Unknown'
         }));
         console.log(`🔍 Sample POIs:`, samplePOIs);
       }
      
      // Return both count and detailed POI data for mapping
      const result: any = { count: nearbyPOIs.length, elements: nearbyPOIs };
      
      // Add detailed POI data for single search results (to enable mapping)
      if (nearbyPOIs.length > 0) {
        const sortedPOIs = [...nearbyPOIs].sort((a, b) => a.distance_miles - b.distance_miles);
        
        // Store ALL POIs for CSV export (complete dataset)
        result.all_pois = sortedPOIs.map(poi => ({
          id: poi.id,
          type: poi.type,
          name: poi.tags?.name || 'Unnamed',
          lat: poi.lat || poi.center?.lat,
          lon: poi.lon || poi.center?.lon,
          distance_miles: poi.distance_miles,
          tags: poi.tags,
          amenity: poi.tags?.amenity,
          shop: poi.tags?.shop,
          tourism: poi.tags?.tourism,
          address: poi.tags?.['addr:street'] || poi.tags?.['addr:full'],
          phone: poi.tags?.phone,
          website: poi.tags?.website
        }));
        
        // Limit to top 50 closest POIs for map display (to avoid overwhelming the map)
        result.detailed_pois = sortedPOIs.slice(0, 5000).map((poi, index) => ({
          id: `${poi.id || poi.type + '_' + index}`,
          type: poi.type,
          name: poi.tags?.name || poi.tags?.amenity || poi.tags?.shop || poi.tags?.tourism || poi.processed_name || 'Unnamed',
          lat: poi.lat || poi.center?.lat,
          lon: poi.lon || poi.center?.lon,
          distance_miles: poi.distance_miles,
          tags: poi.tags,
          amenity: poi.tags?.amenity,
          shop: poi.tags?.shop,
          tourism: poi.tags?.tourism,
          address: poi.tags?.['addr:street'] || poi.tags?.['addr:full'],
          phone: poi.tags?.phone,
          website: poi.tags?.website
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Overpass API error:', error);
      return { count: 0, elements: [] };
    }
  }

  private getDefaultRadius(enrichmentId: string): number {
    const poiConfig = poiConfigManager.getPOIType(enrichmentId);
    if (poiConfig?.defaultRadius !== undefined) {
      return poiConfig.defaultRadius;
    }

    const defaultRadii: Record<string, number> = {
      'poi_schools': 5,
      'poi_hospitals': 5,
      'poi_parks': 5,
      'poi_grocery': 3,
      'poi_restaurants': 3,
      'poi_banks': 3,
      'poi_pharmacies': 3,
      'poi_gas': 3,
      'poi_hotels': 5,
      'poi_airports': 5,
      'poi_power_plants_openei': 25,
      'poi_substations': 5,
      'poi_powerlines': 5,
      'poi_cell_towers': 5,
      'poi_eq': 5,
      'poi_fema_floodzones': 2,
      'poi_usgs_volcano': 5,
      'poi_wikipedia': 5,
      'poi_police_stations': 5,
      'poi_fire_stations': 5,
      'poi_urgent_care': 5,
      'poi_golf_courses': 5,
      'poi_bars_nightlife': 2,
      'poi_boat_ramps': 5,
      'poi_cafes_coffee': 3,
       'poi_markets': 5,
       'poi_fema_flood_zones': 5,
       
       // EPA FRS Environmental Hazards
       'poi_epa_brownfields': 5,
       'poi_epa_superfund': 5,
       'poi_epa_rcra': 5,
       'poi_epa_tri': 5,
       'poi_epa_npdes': 5,
       'poi_epa_air': 5,
       'poi_epa_radiation': 5,
       'poi_epa_power': 25,
       'poi_epa_oil_spill': 5,
       
       // USDA Local Food Portal - Farmers Markets & Local Food
       'poi_usda_agritourism': 5,
       'poi_usda_csa': 5,
       'poi_usda_farmers_market': 5,
       'poi_usda_food_hub': 5,
       'poi_usda_onfarm_market': 5,
      'poi_aurora_viewing_sites': 100,
      'poi_ebird_hotspots': 25,
    };
    
    // Get the default radius, with special handling for power plants and other large-radius POIs
    const radius = defaultRadii[enrichmentId] || 5;
    
    // Allow power plants, animal collisions, and other infrastructure to use larger radii
    if (
      enrichmentId === 'poi_power_plants_openei' ||
      enrichmentId === 'poi_electric_charging' ||
      enrichmentId === 'poi_epa_power' ||
      enrichmentId === 'poi_animal_vehicle_collisions' ||
      enrichmentId === 'poi_aurora_viewing_sites'
    ) {
      return radius; // No cap for power plants, charging stations, EPA power generation, and animal collisions
    }
    
    // Cap other POI types at 5 miles maximum unless explicitly provided via config
    return Math.min(radius, 5);
  }

  
  
  // Enhanced Wikipedia/Wikidata POI enrichment for quirky and interesting sites
  private async getWikipediaPOIs(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🔍 Wikipedia POI: Searching for articles near ${lat}, ${lon} within ${radiusMiles} miles`);
      
      // Wikipedia API requires radius in meters between 10 and 10,000
      const radiusMeters = Math.min(10000, Math.max(10, Math.floor(radiusMiles * 1609.34)));
      
      // Use Wikipedia's geosearch API to find nearby articles
      const wikiUrl = new URL('https://en.wikipedia.org/w/api.php');
      wikiUrl.searchParams.set('action', 'query');
      wikiUrl.searchParams.set('list', 'geosearch');
      wikiUrl.searchParams.set('gscoord', `${lat}|${lon}`);
      wikiUrl.searchParams.set('gsradius', radiusMeters.toString());
      wikiUrl.searchParams.set('gslimit', '50');
      wikiUrl.searchParams.set('format', 'json');
      wikiUrl.searchParams.set('origin', '*');
      
      console.log(`🔗 Wikipedia API URL: ${wikiUrl.toString()}`);
      console.log(`📏 Radius: ${radiusMeters}m (${Math.round(radiusMeters * 0.000621371 * 100) / 100} miles)`);
      
      const wikiData = await fetchJSONSmart(wikiUrl.toString());
      console.log(`📊 Wikipedia API response:`, wikiData);
      
      let articles = wikiData?.query?.geosearch || [];
      console.log(`📚 Found ${articles.length} Wikipedia articles (geosearch)`);

      if ((!articles || articles.length === 0) && radiusMiles > 6.3) {
        console.log('⚠️ Geosearch returned no results, falling back to Wikidata SPARQL within radius');
        const radiusKm = Math.max(10, radiusMiles * 1.60934);

        const sparql = `
          SELECT ?item ?itemLabel ?article ?coord WHERE {
            SERVICE wikibase:around {
              ?item wdt:P625 ?coord .
              bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral .
              bd:serviceParam wikibase:radius "${radiusKm}" .
            }
            ?article schema:about ?item ;
                     schema:inLanguage "en" ;
                     schema:isPartOf <https://en.wikipedia.org/> .
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
          }
          LIMIT 100
        `;

        const wikidataUrl = new URL('https://query.wikidata.org/sparql');
        wikidataUrl.searchParams.set('format', 'json');
        wikidataUrl.searchParams.set('query', sparql);

        const wikidataResponse = await fetchJSONSmart(wikidataUrl.toString(), {
          headers: {
            'Accept': 'application/sparql-results+json',
          },
        });

        console.log('📊 Wikidata fallback response:', wikidataResponse);

        const bindings = wikidataResponse?.results?.bindings || [];
        articles = bindings.map((binding: any, index: number) => {
          const coord = binding.coord?.value;
          let poiLat = lat;
          let poiLon = lon;
          if (coord) {
            const match = coord.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
            if (match) {
              poiLon = parseFloat(match[1]);
              poiLat = parseFloat(match[2]);
            }
          }
          const distanceKm = this.calculateDistance(lat, lon, poiLat, poiLon);
          return {
            title: binding.itemLabel?.value || `Wikidata Item ${index + 1}`,
            pageid: 0,
            lat: poiLat,
            lon: poiLon,
            dist: distanceKm,
            pageTitle: binding.article?.value?.split('/').pop() || binding.item?.value?.split('/').pop(),
            pageUrl: binding.article?.value || null,
          };
        });

        console.log(`📚 Found ${articles.length} Wikipedia articles via Wikidata fallback`);
      }

      if (articles.length === 0) {
        console.log(`⚠️  No Wikipedia articles found for this location`);
        return { poi_wikipedia_count: 0, poi_wikipedia_articles: [] };
      }

      // Categorize articles by interesting tags and types
      const categorizedArticles = articles.map((article: any) => {
        const title = article.title;
        const distance = article.dist;
        const pageId = article.pageid;
        
        // Detect interesting categories and types
        const categories = this.categorizeWikipediaArticle(title, article);
        
        const distanceKm = typeof distance === 'number' ? distance : this.calculateDistance(lat, lon, article.lat, article.lon);
        const url = article.pageUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(article.pageTitle || title)}`;

        return {
          title,
          distance_km: distanceKm,
          distance_miles: Math.round(distanceKm * 0.621371 * 100) / 100,
          page_id: pageId,
          categories,
          lat: article.lat,
          lon: article.lon,
          url
        };
      });

      // Group by category for better organization
      const articlesByCategory = this.groupArticlesByCategory(categorizedArticles);
      
      return {
        poi_wikipedia_count: articles.length,
        poi_wikipedia_articles: categorizedArticles,
        poi_wikipedia_by_category: articlesByCategory,
        poi_wikipedia_summary: this.generateWikipediaSummary(articlesByCategory)
      };
      
    } catch (error) {
      console.error('Wikipedia POI enrichment failed:', error);
      return { poi_wikipedia_count: 0, poi_wikipedia_error: 'Failed to fetch Wikipedia data' };
    }
  }

  private async getAuroraViewingSites(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🌌 Checking aurora viewing locations for [${lat}, ${lon}] within ${radiusMiles} miles`);

      const locationsWithDistance = AURORA_VIEWING_LOCATIONS.map(location => {
        const distanceKm = this.calculateDistance(lat, lon, location.lat, location.lon);
        const distanceMiles = distanceKm * 0.621371;

        return {
          ...location,
          subdivision: location.subdivision.trim(),
          country: location.country.trim(),
          distance_miles: Number(distanceMiles.toFixed(2)),
          distance_km: Number(distanceKm.toFixed(2)),
        };
      }).sort((a, b) => a.distance_miles - b.distance_miles);

      const withinRadius = locationsWithDistance.filter(site => site.distance_miles <= radiusMiles);
      const nearest = locationsWithDistance[0] || null;
      const detailedSites = withinRadius.slice(0, 50);

      const radiusLabel = radiusMiles.toString();
      const countKey = `poi_aurora_viewing_sites_count_${radiusLabel}mi`;

      const summary = withinRadius.length > 0
        ? `Found ${withinRadius.length} curated aurora viewing site${withinRadius.length === 1 ? '' : 's'} within ${radiusMiles} miles.`
        : nearest
          ? `No curated viewing sites within ${radiusMiles} miles. Nearest is ${nearest.name} (${nearest.distance_miles} miles away).`
          : `No curated aurora viewing sites available.`;

      const result: Record<string, any> = {
        [countKey]: withinRadius.length,
        poi_aurora_viewing_sites_count: withinRadius.length,
        poi_aurora_viewing_sites_radius_miles: radiusMiles,
        poi_aurora_viewing_sites_summary: summary,
        poi_aurora_viewing_sites_nearest: nearest,
        poi_aurora_viewing_sites_within_radius: withinRadius,
        poi_aurora_viewing_sites_detailed: detailedSites,
        poi_aurora_viewing_sites_all_pois: withinRadius,
        poi_aurora_viewing_sites_source: 'Auroras.live (https://auroras.live)',
        count: withinRadius.length,
      };

      console.log(`🌌 Aurora viewing site result:`, result);
      return result;
    } catch (error) {
      console.error('🌌 Aurora viewing sites lookup failed:', error);
      return {
        count: 0,
        poi_aurora_viewing_sites_count: 0,
        poi_aurora_viewing_sites_detailed: [],
        poi_aurora_viewing_sites_all_pois: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        poi_aurora_viewing_sites_source: 'Auroras.live (https://auroras.live)',
      };
    }
  }

  private async getEBirdHotspots(lat: number, lon: number, distKm: number, requestedRadiusMiles?: number): Promise<Record<string, any>> {
    try {
      const hotspots = await fetchEBirdHotspots(lat, lon, distKm, 50);
      const hotspotsWithDistance = hotspots.map((spot) => {
        const distanceKm = this.calculateDistance(lat, lon, spot.lat, spot.lng);
        const distanceMiles = distanceKm * 0.621371;
        return {
          ...spot,
          name: spot.locName || spot.name || 'Birding Hotspot',
          lon: spot.lng,
          distance_km: Number(distanceKm.toFixed(2)),
          distance_miles: Number(distanceMiles.toFixed(2)),
        };
      }).sort((a, b) => a.distance_miles - b.distance_miles);

      const effectiveRadiusMiles = Number((distKm * 0.621371).toFixed(1));
      const requestedRadiusMilesRounded =
        requestedRadiusMiles !== undefined ? Number(requestedRadiusMiles.toFixed(1)) : undefined;
      const radiusSummaryMiles = requestedRadiusMilesRounded ?? effectiveRadiusMiles;
      const radiusNote =
        requestedRadiusMilesRounded !== undefined && requestedRadiusMilesRounded !== effectiveRadiusMiles
          ? ` (clamped to ${effectiveRadiusMiles} miles due to eBird API limit)`
          : '';

      const summary = hotspotsWithDistance.length
        ? `Found ${hotspotsWithDistance.length} birding hotspot${hotspotsWithDistance.length === 1 ? '' : 's'} within ${radiusSummaryMiles.toFixed(1)} miles${radiusNote}.`
        : `No birding hotspots found within ${radiusSummaryMiles.toFixed(1)} miles${radiusNote}.`;

      return {
        poi_ebird_hotspots_count: hotspotsWithDistance.length,
        poi_ebird_hotspots_radius_km: Number(distKm.toFixed(2)),
        poi_ebird_hotspots_radius_miles: effectiveRadiusMiles,
        ...(requestedRadiusMilesRounded !== undefined
          ? { poi_ebird_hotspots_radius_miles_requested: requestedRadiusMilesRounded }
          : {}),
        poi_ebird_hotspots_summary: summary,
        poi_ebird_hotspots_detailed: hotspotsWithDistance.slice(0, 50),
        poi_ebird_hotspots_all_pois: hotspotsWithDistance,
        poi_ebird_hotspots_source: 'eBird (Cornell Lab of Ornithology)',
        count: hotspotsWithDistance.length,
      };
    } catch (error) {
      console.error('eBird hotspot lookup failed:', error);
      return {
        count: 0,
        poi_ebird_hotspots_count: 0,
        poi_ebird_hotspots_detailed: [],
        poi_ebird_hotspots_all_pois: [],
        poi_ebird_hotspots_summary: 'Birding hotspot data unavailable.',
        poi_ebird_hotspots_source: 'eBird (Cornell Lab of Ornithology)',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async getEBirdRecentObservations(lat: number, lon: number, distKm: number, lookBackDays: number): Promise<Record<string, any>> {
    try {
      const observations = await fetchEBirdRecentObservations(lat, lon, distKm, lookBackDays);
      const observationsWithDistance = observations
        .map((obs) => {
          const distanceKm = this.calculateDistance(lat, lon, obs.lat, obs.lng);
          const distanceMiles = distanceKm * 0.621371;
          return {
            ...obs,
            name: obs.comName,
            species_common_name: obs.comName,
            species_scientific_name: obs.sciName,
            location_name: obs.locName,
            lon: obs.lng,
            distance_km: Number(distanceKm.toFixed(2)),
            distance_miles: Number(distanceMiles.toFixed(2)),
          };
        })
        .sort((a, b) => a.distance_miles - b.distance_miles);

      const speciesMap = new Map<string, { name: string; count: number; mostRecent: string }>();

      observationsWithDistance.forEach((obs) => {
        const key = obs.speciesCode;
        const count = obs.howMany ?? 1;
        const existing = speciesMap.get(key);
        if (existing) {
          existing.count += count;
          if (new Date(obs.obsDt) > new Date(existing.mostRecent)) {
            existing.mostRecent = obs.obsDt;
          }
        } else {
          speciesMap.set(key, {
            name: obs.comName,
            count,
            mostRecent: obs.obsDt,
          });
        }
      });

      const topSpecies = Array.from(speciesMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 25);

      return {
        ebird_recent_observations_total_reports: observationsWithDistance.length,
        ebird_recent_observations_unique_species: speciesMap.size,
        ebird_recent_observations_top_species: topSpecies,
        ebird_recent_observations_radius_km: Number(distKm.toFixed(2)),
        ebird_recent_observations_radius_miles: Number((distKm * 0.621371).toFixed(1)),
        ebird_recent_observations_lookback_days: lookBackDays,
        ebird_recent_observations_summary: speciesMap.size
          ? `${speciesMap.size} species reported within the last ${lookBackDays} day${lookBackDays === 1 ? '' : 's'}.`
          : `No species reported within the last ${lookBackDays} day${lookBackDays === 1 ? '' : 's'}.`,
        ebird_recent_observations_detailed: observationsWithDistance.slice(0, 50),
        ebird_recent_observations_all: observationsWithDistance.slice(0, 200),
        ebird_recent_observations_all_pois: observationsWithDistance,
        ebird_recent_observations_nearest: observationsWithDistance[0] || null,
        ebird_recent_observations_source: 'eBird (Cornell Lab of Ornithology)',
        count: speciesMap.size,
      };
    } catch (error) {
      console.error('eBird observation lookup failed:', error);
      return {
        ebird_recent_observations_total_reports: 0,
        ebird_recent_observations_unique_species: 0,
        ebird_recent_observations_top_species: [],
        ebird_recent_observations_detailed: [],
        ebird_recent_observations_all: [],
        ebird_recent_observations_all_pois: [],
        ebird_recent_observations_summary: 'Bird observation data unavailable.',
        ebird_recent_observations_source: 'eBird (Cornell Lab of Ornithology)',
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
      };
    }
  }

     // EPA FRS (Facility Registry Service) Environmental Hazards enrichment
   private async getEPAFRSFacilities(lat: number, lon: number, radiusMiles: number, programType: string): Promise<Record<string, any>> {
    console.log(`🏭 EPA FRS ${programType} query for [${lat}, ${lon}] within ${radiusMiles} miles`);
    
    // Use the correct EPA FRS REST API endpoint as provided by user
    const baseUrl = 'https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities';
    const url = new URL(baseUrl);
    
    // Set query parameters for proximity search using correct parameter names
    url.searchParams.set('latitude83', lat.toString());
    url.searchParams.set('longitude83', lon.toString());
    url.searchParams.set('search_radius', radiusMiles.toString());
    url.searchParams.set('output', 'JSON');
    
    // Add program-specific filters using the correct parameter name
    if (programType !== 'ACRES') {
      url.searchParams.set('pgm_sys_acrnm', programType);
    }
    
    console.log(`🔗 EPA FRS API URL: ${url.toString()}`);
    
    try {
      console.log(`🔍 EPA FRS API Debug Info:`);
      console.log(`📍 Location: [${lat}, ${lon}]`);
      console.log(`📏 Radius: ${radiusMiles} miles`);
      console.log(`🏭 Program Type: ${programType}`);
      console.log(`🔗 Full API URL: ${url.toString()}`);
      
      const response = await fetchJSONSmart(url.toString());
      console.log(`📊 EPA FRS API response:`, response);
    
      if (!response || !response.Results || !response.Results.FRSFacility || !Array.isArray(response.Results.FRSFacility)) {
        console.log(`⚠️  No EPA FRS facilities found for ${programType}`);
        console.log(`🔄 Attempting fallback to OpenEI power plants...`);
        
        // Fallback to OpenEI power plants if EPA FRS returns no results
        if (programType === 'EGRID') {
          try {
            const openEIResult = await this.getPOICount('poi_power_plants_openei', lat, lon, radiusMiles);
            console.log(`🔄 OpenEI fallback result:`, openEIResult);
            
            // Map OpenEI results to EPA power format
            const openEICount = openEIResult[`poi_power_plants_openei_count_${radiusMiles}mi`] || 0;
            const openEIFacilities = openEIResult[`poi_power_plants_openei_detailed`] || [];
            
            return {
              [`poi_epa_${this.getEPAProgramId(programType)}_count`]: openEICount,
              [`poi_epa_${this.getEPAProgramId(programType)}_facilities`]: openEIFacilities,
              [`poi_epa_${this.getEPAProgramId(programType)}_summary`]: `Found ${openEICount} Power Generation facilities within ${radiusMiles} miles (via OpenEI fallback)`
            };
          } catch (fallbackError) {
            console.error(`❌ OpenEI fallback also failed:`, fallbackError);
          }
        }
        
        return {
          [`poi_epa_${this.getEPAProgramId(programType)}_count`]: 0,
          [`poi_epa_${this.getEPAProgramId(programType)}_facilities`]: [],
          [`poi_epa_${this.getEPAProgramId(programType)}_summary`]: `No ${this.getEPAProgramLabel(programType)} facilities found within ${radiusMiles} miles`
        };
      }
      
      const facilities = response.Results.FRSFacility;
      console.log(`🏭 Found ${facilities.length} EPA FRS ${programType} facilities`);
      
      // Process and categorize facilities
      const processedFacilities = facilities.map((facility: any) => ({
        id: facility.facility_id || facility.registry_id,
        name: facility.facility_name || 'Unnamed Facility',
        program: programType,
        status: facility.facility_status || 'Unknown',
        address: facility.street_address || 'N/A',
        city: facility.city_name || 'N/A',
        state: facility.state_code || 'N/A',
        zip: facility.zip_code || 'N/A',
        lat: facility.latitude83 || facility.latitude,
        lon: facility.longitude83 || facility.longitude,
        distance_miles: this.calculateDistance(lat, lon, facility.latitude83 || facility.latitude, facility.longitude83 || facility.longitude) * 0.621371,
        raw_data: facility
      }));
      
      // Filter by actual distance and sort by proximity
      const nearbyFacilities = processedFacilities
        .filter((f: any) => f.distance_miles <= radiusMiles)
        .sort((a: any, b: any) => a.distance_miles - b.distance_miles);
      
      console.log(`✅ EPA FRS ${programType}: ${nearbyFacilities.length} facilities within ${radiusMiles} miles`);
      
      // Show detailed facility records for inspection
      if (nearbyFacilities.length > 0) {
        console.log(`🏭 DETAILED EPA FRS ${programType} FACILITIES (showing ALL by proximity):`);
        nearbyFacilities.forEach((facility: any, index: number) => {
          console.log(`\n--- Facility ${index + 1} (${facility.distance_miles.toFixed(2)} miles) ---`);
          console.log(`Name: ${facility.name}`);
          console.log(`Program: ${facility.program}`);
          console.log(`Status: ${facility.status}`);
          console.log(`Address: ${facility.address}, ${facility.city}, ${facility.state} ${facility.zip}`);
          console.log(`Coordinates: ${facility.lat}, ${facility.lon}`);
          console.log(`Distance: ${facility.distance_miles.toFixed(2)} miles`);
        });
      }
      
      const programId = this.getEPAProgramId(programType);
      const programLabel = this.getEPAProgramLabel(programType);
      
      return {
        [`poi_epa_${programId}_count`]: nearbyFacilities.length,
        [`poi_epa_${programId}_facilities`]: nearbyFacilities,
        [`poi_epa_${programId}_summary`]: `Found ${nearbyFacilities.length} ${programLabel} facilities within ${radiusMiles} miles`
      };
      
    } catch (error) {
      console.error(`❌ EPA FRS ${programType} API error:`, error);
      console.error(`🔗 Failed URL: https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities`);
      console.error(`📋 Program Type: ${programType}`);
      console.error(`📍 Coordinates: [${lat}, ${lon}]`);
      console.error(`📏 Radius: ${radiusMiles} miles`);
      
      // Check if this is a CORS error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isCORSError = errorMessage.includes('CORS') || errorMessage.includes('blocked') || errorMessage.includes('Access-Control');
      
      if (isCORSError) {
        console.log(`🌐 CORS policy blocked EPA FRS API access - this is expected in browser environments`);
        console.log(`💡 EPA FRS data may be available through the ArcGIS fallback service`);
      }
      
      // Try fallback to OpenEI power plants if EPA FRS fails (e.g., CORS error)
      if (programType === 'EGRID') {
        console.log(`🔄 EPA FRS failed, attempting fallback to OpenEI power plants...`);
        try {
          const openEIResult = await this.getPOICount('poi_power_plants_openei', lat, lon, radiusMiles);
          console.log(`🔄 OpenEI fallback result:`, openEIResult);
          
          // Map OpenEI results to EPA power format
          const openEICount = openEIResult[`poi_power_plants_openei_count_${radiusMiles}mi`] || 0;
          const openEIFacilities = openEIResult[`poi_power_plants_openei_detailed`] || [];
          
          return {
            [`poi_epa_${this.getEPAProgramId(programType)}_count`]: openEICount,
            [`poi_epa_${this.getEPAProgramId(programType)}_facilities`]: openEIFacilities,
            [`poi_epa_${this.getEPAProgramId(programType)}_summary`]: `Found ${openEICount} Power Generation facilities within ${radiusMiles} miles (via OpenEI fallback)`
          };
        } catch (fallbackError) {
          console.error(`❌ OpenEI fallback also failed:`, fallbackError);
        }
      }
      
      const programId = this.getEPAProgramId(programType);
      return {
        [`poi_epa_${programId}_count`]: 0,
        [`poi_epa_${programId}_facilities`]: [],
        [`poi_epa_${programId}_summary`]: `No ${this.getEPAProgramLabel(programType)} facilities found within ${radiusMiles} miles`
      };
    }
  }
  
  // Helper methods for EPA program identification
  private getEPAProgramId(programType: string): string {
    const programMap: Record<string, string> = {
      'ACRES': 'brownfields',
      'SEMS/CERCLIS': 'superfund',
      'RCRAInfo': 'rcra',
      'TRI': 'tri',
      'NPDES': 'npdes',
      'ICIS-AIR': 'air',
      'RADINFO': 'radiation',
      'EGRID': 'power',
      'SPCC/FRP': 'oil_spill'
    };
        return programMap[programType] || programType.toLowerCase();
 }
  
  // Helper methods for EPA program labels
  private getEPAProgramLabel(programType: string): string {
    const programMap: Record<string, string> = {
      'ACRES': 'Brownfields',
      'SEMS/CERCLIS': 'Superfund',
      'RCRAInfo': 'RCRA',
      'TRI': 'TRI',
      'NPDES': 'NPDES',
      'ICIS-AIR': 'Air Facilities',
      'RADINFO': 'Radiation',
      'EGRID': 'Power Generation',
      'SPCC/FRP': 'Oil Spill Response'
    };
    return programMap[programType] || programType;
  }
  
  // USDA Local Food Portal - Farmers Markets & Local Food enrichment
  private async getUSDALocalFood(lat: number, lon: number, radiusMiles: number, foodType: string): Promise<Record<string, any>> {
    try {
      console.log(`🌾 USDA Local Food Portal ${foodType} query for [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // USDA Local Food Portal API endpoints
      const apiEndpoints: Record<string, string> = {
        'agritourism': 'https://www.usdalocalfoodportal.com/api/agritourism/',
        'csa': 'https://www.usdalocalfoodportal.com/api/csa/',
        'farmersmarket': 'https://www.usdalocalfoodportal.com/api/farmersmarket/',
        'foodhub': 'https://www.usdalocalfoodportal.com/api/foodhub/',
        'onfarmmarket': 'https://www.usdalocalfoodportal.com/api/onfarmmarket/'
      };
      
      const apiUrl = apiEndpoints[foodType];
      if (!apiUrl) {
        throw new Error(`Unknown USDA food type: ${foodType}`);
      }
      
      // Build URL with correct query parameters
      // Use x, y, and radius parameters for coordinate-based search
      const url = new URL(apiUrl);
      url.searchParams.set('x', lon.toString()); // longitude
      url.searchParams.set('y', lat.toString()); // latitude
      url.searchParams.set('radius', Math.min(radiusMiles, 100).toString()); // max 100 miles
      
      console.log(`🔗 USDA API URL: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`USDA API HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 USDA ${foodType} API response:`, data);
      
      if (!data || !Array.isArray(data)) {
        console.log(`⚠️  No USDA ${foodType} data found`);
        return this.createEmptyUSDAResult(foodType, radiusMiles);
      }
      
      const facilities = data;
      console.log(`🌾 Found ${facilities.length} USDA ${foodType} facilities`);
      
      // Process facilities and calculate distances
      const processedFacilities = facilities.map((facility: any) => {
                // Extract coordinates from facility data
        let facilityLat: number | null = null;
        let facilityLon: number | null = null;
        
        // Try different possible coordinate field names from USDA API response
        if (facility.latitude && facility.longitude) {
          facilityLat = parseFloat(facility.latitude);
          facilityLon = parseFloat(facility.longitude);
        } else if (facility.lat && facility.lon) {
          facilityLat = parseFloat(facility.lat);
          facilityLon = parseFloat(facility.lon);
        } else if (facility.x && facility.y) {
          // Handle x,y coordinate format
          facilityLon = parseFloat(facility.x);
          facilityLat = parseFloat(facility.y);
        } else if (facility.geometry && facility.geometry.coordinates) {
          // Handle GeoJSON format if present
          facilityLon = parseFloat(facility.geometry.coordinates[0]);
          facilityLat = parseFloat(facility.geometry.coordinates[1]);
        }
        
        if (facilityLat && facilityLon && !isNaN(facilityLat) && !isNaN(facilityLon)) {
          const distanceMiles = this.calculateDistance(lat, lon, facilityLat, facilityLon) * 0.621371;
          
          return {
            id: facility.id || facility.listing_id || facility.record_id || Math.random().toString(36).substr(2, 9),
            name: facility.listing_name || facility.name || facility.facility_name || facility.market_name || 'Unnamed Facility',
            type: foodType,
            lat: facilityLat,
            lon: facilityLon,
              distance_miles: Math.round(distanceMiles * 100) / 100,
            address: facility.location_address || facility.address || facility.street_address || 'N/A',
            city: facility.location_city || facility.city || facility.city_name || 'N/A',
            state: facility.location_state || facility.state || facility.state_code || 'N/A',
            zip: facility.location_zipcode || facility.zip || facility.zip_code || 'N/A',
            phone: facility.phone || facility.phone_number || 'N/A',
            website: facility.media_website || facility.website || facility.url || 'N/A',
            description: facility.description || facility.notes || '',
            season: facility.season || facility.seasonality || 'N/A',
            raw_data: facility
          };
        }
        
        return null;
      }).filter(Boolean); // Remove null entries
      
            console.log(`🌾 Processed ${processedFacilities.length} USDA ${foodType} facilities with coordinates`);
      
      // Filter by actual distance and sort by proximity
      const nearbyFacilities = processedFacilities
        .filter((f: any) => f.distance_miles <= radiusMiles)
        .sort((a: any, b: any) => a.distance_miles - b.distance_miles);
      
      console.log(`✅ USDA ${foodType}: ${nearbyFacilities.length} facilities within ${radiusMiles} miles`);
      
      // Show detailed facility records for inspection
      if (nearbyFacilities.length > 0) {
        console.log(`🌾 DETAILED USDA ${foodType.toUpperCase()} FACILITIES (showing ALL by proximity):`);
        nearbyFacilities.forEach((facility: any, index: number) => {
          console.log(`\n--- Facility ${index + 1} (${facility.distance_miles.toFixed(2)} miles) ---`);
          console.log(`Name: ${facility.name}`);
          console.log(`Type: ${facility.type}`);
          console.log(`Address: ${facility.address}, ${facility.city}, ${facility.state} ${facility.zip}`);
          console.log(`Coordinates: ${facility.lat}, ${facility.lon}`);
          console.log(`Distance: ${facility.distance_miles.toFixed(2)} miles`);
          console.log(`Phone: ${facility.phone}`);
          console.log(`Website: ${facility.website}`);
          console.log(`Season: ${facility.season}`);
        });
      }
      
      const foodTypeId = this.getUSDAFoodTypeId(foodType);
      const foodTypeLabel = this.getUSDAFoodTypeLabel(foodType);

      return {
        [`poi_usda_${foodTypeId}_count`]: nearbyFacilities.length,
        [`poi_usda_${foodTypeId}_facilities`]: nearbyFacilities,
        [`poi_usda_${foodTypeId}_summary`]: `Found ${nearbyFacilities.length} ${foodTypeLabel} within ${radiusMiles} miles`,
        [`poi_usda_${foodTypeId}_source`]: 'USDA Local Food Portal',
        [`poi_usda_${foodTypeId}_note`]: 'Data from USDA Local Food Portal API'
      };

    } catch (error) {
      console.error(`❌ USDA Local Food Portal ${foodType} API error:`, error);
      
      const foodTypeId = this.getUSDAFoodTypeId(foodType);
      return {
        [`poi_usda_${foodTypeId}_count`]: 0,
        [`poi_usda_${foodTypeId}_facilities`]: [],
        [`poi_usda_${foodTypeId}_error`]: `USDA API error: ${error instanceof Error ? error.message : String(error)}`,
        [`poi_usda_${foodTypeId}_status`]: 'API error'
      };
    }
  }
  
  // Helper methods for USDA food type identification
  private getUSDAFoodTypeId(foodType: string): string {
    const foodTypeMap: Record<string, string> = {
      'agritourism': 'agritourism',
      'csa': 'csa',
      'farmersmarket': 'farmers_market',
      'foodhub': 'food_hub',
      'onfarmmarket': 'onfarm_market'
    };
    return foodTypeMap[foodType] || foodType;
  }
  
  private getUSDAFoodTypeLabel(foodType: string): string {
    const foodTypeMap: Record<string, string> = {
      'agritourism': 'Agritourism',
      'csa': 'CSA Programs',
      'farmersmarket': 'Farmers Markets',
      'foodhub': 'Food Hubs',
      'onfarmmarket': 'On-Farm Markets'
    };
    return foodTypeMap[foodType] || foodType;
  }
  
  // Helper method to create empty USDA results
  private createEmptyUSDAResult(foodType: string, radiusMiles: number): Record<string, any> {
    const foodTypeId = this.getUSDAFoodTypeId(foodType);
    const foodTypeLabel = this.getUSDAFoodTypeLabel(foodType);
    
    return {
      [`poi_usda_${foodTypeId}_count`]: 0,
      [`poi_usda_${foodTypeId}_facilities`]: [],
      [`poi_usda_${foodTypeId}_summary`]: `No ${foodTypeLabel} found within ${radiusMiles} miles`,
      [`poi_usda_${foodTypeId}_source`]: 'USDA Local Food Portal',
      [`poi_usda_${foodTypeId}_note`]: 'No facilities in this area'
    };
  }

  private async getNWSWeatherAlerts(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🌤️  NWS Weather Alerts query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);

      // NWS Alerts API endpoint with point parameter (lat,lon format)
      // The NWS API will return alerts that intersect with the specified point
      const url = `https://api.weather.gov/alerts/active?point=${lat.toFixed(6)},${lon.toFixed(6)}`;

      console.log(`🔗 NWS Weather Alerts API URL: ${url}`);
      console.log(`📍 Query Point: [${lat}, ${lon}] (${radiusMiles} mile radius)`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NWS API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 NWS API response:`, data);

      if (!data || !data.features || !Array.isArray(data.features)) {
        console.log('🌤️  No weather alerts found in response');
        return {
          nws_weather_alerts_count: 0,
          nws_weather_alerts_active: 0,
          nws_weather_alerts_summary: 'No active weather alerts',
          nws_weather_alerts_details: []
        };
      }

      console.log(`🌤️  Found ${data.features.length} weather alerts at point`);

      // Filter alerts to only include those within the actual radius
      const radiusKm = radiusMiles * 1.60934; // Convert miles to km
      const alertsWithinRadius = data.features.filter((alert: any) => {
        // Check if the alert's area intersects with our radius
        if (alert.geometry && alert.geometry.coordinates) {
          // For simplicity, check if the center of the alert area is within our radius
          // This is a simplified approach - for more precision, you could check polygon intersection
          let alertLat: number, alertLon: number;

          if (alert.geometry.type === 'Point') {
            // Single point alert
            [alertLon, alertLat] = alert.geometry.coordinates;
          } else if (alert.geometry.type === 'Polygon') {
            // Polygon alert - use the centroid (simplified)
            const coords = alert.geometry.coordinates[0]; // First ring
            const centerLon = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coords.length;
            const centerLat = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coords.length;
            alertLon = centerLon;
            alertLat = centerLat;
          } else {
            // Other geometry types - skip for now
            return false;
          }

          if (alertLat && alertLon) {
            const distance = this.calculateDistance(lat, lon, alertLat, alertLon);
            return distance <= radiusKm;
          }
        }
        return false;
      });

      console.log(`🌤️  Found ${alertsWithinRadius.length} weather alerts within ${radiusMiles} miles`);

      // Process alert details
      const alertDetails = alertsWithinRadius.map((alert: any) => {
        const properties = alert.properties || {};
        return {
          id: alert.id || 'Unknown',
          event: properties.event || 'Unknown Event',
          severity: properties.severity || 'Unknown',
          urgency: properties.urgency || 'Unknown',
          certainty: properties.certainty || 'Unknown',
          headline: properties.headline || 'No headline',
          description: properties.description || 'No description',
          instruction: properties.instruction || 'No instructions',
          area_desc: properties.areaDesc || 'Unknown area',
          effective: properties.effective ? new Date(properties.effective).toLocaleString() : 'Unknown',
          expires: properties.expires ? new Date(properties.expires).toLocaleString() : 'Unknown',
          status: properties.status || 'Unknown'
        };
      });

      // Count by severity
      const severityCounts = alertDetails.reduce((counts: Record<string, number>, alert: any) => {
        const severity = alert.severity.toLowerCase();
        counts[severity] = (counts[severity] || 0) + 1;
        return counts;
      }, {});

      // Generate summary
      let summary = '';
      if (alertsWithinRadius.length === 0) {
        summary = 'No active weather alerts';
      } else if (alertsWithinRadius.length === 1) {
        summary = `1 active weather alert: ${alertDetails[0].event}`;
      } else {
        summary = `${alertsWithinRadius.length} active weather alerts`;
        if (severityCounts.extreme) {
          summary += ` (${severityCounts.extreme} extreme)`;
        }
        if (severityCounts.severe) {
          summary += ` (${severityCounts.severe} severe)`;
        }
      }

      return {
        nws_weather_alerts_count: alertsWithinRadius.length,
        nws_weather_alerts_active: alertsWithinRadius.length,
        nws_weather_alerts_summary: summary,
        nws_weather_alerts_details: alertDetails,
        nws_weather_alerts_severity_breakdown: severityCounts,
        nws_weather_alerts_radius_miles: radiusMiles
      };

    } catch (error) {
      console.error('🌤️  NWS Weather Alerts query failed:', error);
      return {
        nws_weather_alerts_count: 0,
        nws_weather_alerts_active: 0,
        nws_weather_alerts_summary: 'Weather alert data unavailable',
        nws_weather_alerts_error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async getOpenMeteoWeather(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🌡️  Open-Meteo Weather query for coordinates [${lat}, ${lon}]`);

      // Open-Meteo API endpoint for current weather with timezone
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;

      console.log(`🔗 Open-Meteo Weather API URL: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 Open-Meteo API response:`, data);

      if (!data || !data.current_weather) {
        console.log('🌡️  No current weather data found in response');
        return {
          open_meteo_weather_error: 'No current weather data available'
        };
      }

      const currentWeather = data.current_weather;
      console.log(`🌡️  Current weather data:`, currentWeather);

      // Convert weather code to human-readable description
      const weatherDescriptions: Record<number, string> = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
      };

      const weatherDescription = weatherDescriptions[currentWeather.weathercode] || 'Unknown weather condition';

      // Convert Celsius to Fahrenheit: (°C × 9/5) + 32
      const temperatureF = (currentWeather.temperature * 9/5) + 32;
      
      // Convert km/h to mph: km/h × 0.621371
      const windspeedMph = currentWeather.windspeed * 0.621371;

      return {
        open_meteo_weather_temperature_c: currentWeather.temperature,
        open_meteo_weather_temperature_f: temperatureF,
        open_meteo_weather_windspeed: currentWeather.windspeed,
        open_meteo_weather_windspeed_mph: windspeedMph,
        open_meteo_weather_winddirection: currentWeather.winddirection,
        open_meteo_weather_weathercode: currentWeather.weathercode,
        open_meteo_weather_weather_description: weatherDescription,
        open_meteo_weather_time: currentWeather.time,
        open_meteo_weather_timezone: data.timezone || 'Unknown',
        open_meteo_weather_timezone_abbreviation: data.timezone_abbreviation || 'Unknown',
        open_meteo_weather_utc_offset_seconds: data.utc_offset_seconds || 0,
        open_meteo_weather_summary: `Current weather: ${weatherDescription}, ${temperatureF.toFixed(1)}°F, ${windspeedMph.toFixed(1)} mph wind`
      };

    } catch (error) {
      console.error('🌡️  Open-Meteo Weather query failed:', error);
      return {
        open_meteo_weather_error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // PAD-US Public Access Query
  private async getPADUSPublicAccess(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🏞️ PAD-US Public Access query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // First, check if point is inside any public land (point-in-polygon)
      const insideQueryUrl = `https://services.arcgis.com/v01gqwM5QqNysAAi/ArcGIS/rest/services/PADUS_Public_Access/FeatureServer/0/query?where=1=1&geometry={"x":${lon},"y":${lat},"spatialReference":{"wkid":4326}}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID,Category,FeatClass,Unit_Nm,Pub_Access,GAP_Sts,IUCN_Cat,MngTp_Desc,MngNm_Desc,DesTp_Desc,BndryName,ST_Name,GIS_AcrsDb&f=json&returnGeometry=true`;
      
      console.log(`🔗 PAD-US Inside Query URL: ${insideQueryUrl}`);
      const insideResponse = await fetch(insideQueryUrl);
      
      if (!insideResponse.ok) {
        throw new Error(`PAD-US API failed: ${insideResponse.status} ${insideResponse.statusText}`);
      }
      
      const insideData = await insideResponse.json();
      console.log(`📊 PAD-US Inside Query response:`, insideData);
      
      // Check if point is inside any public land
      const isInsidePublicLand = insideData.features && insideData.features.length > 0;
      let insideLandInfo = null;
      
      if (isInsidePublicLand) {
        const feature = insideData.features[0];
        insideLandInfo = {
          category: feature.attributes.Category,
          featureClass: feature.attributes.FeatClass,
          unitName: feature.attributes.Unit_Nm,
          publicAccess: feature.attributes.Pub_Access,
          gapStatus: feature.attributes.GAP_Sts,
          iucnCategory: feature.attributes.IUCN_Cat,
          managerType: feature.attributes.MngTp_Desc,
          managerName: feature.attributes.MngNm_Desc,
          designationType: feature.attributes.DesTp_Desc,
          boundaryName: feature.attributes.BndryName,
          state: feature.attributes.ST_Name,
          acres: feature.attributes.GIS_AcrsDb,
          geometry: feature.geometry, // Preserve geometry for map drawing
          objectId: feature.attributes.OBJECTID
        };
      }
      
      // Now query for nearby public lands within radius
      const radiusKm = radiusMiles * 1.60934;
      const nearbyQueryUrl = `https://services.arcgis.com/v01gqwM5QqNysAAi/ArcGIS/rest/services/PADUS_Public_Access/FeatureServer/0/query?where=1=1&geometry={"x":${lon},"y":${lat},"spatialReference":{"wkid":4326}}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusKm}&units=esriSRUnit_Kilometer&outFields=OBJECTID,Category,FeatClass,Unit_Nm,Pub_Access,GAP_Sts,IUCN_Cat,MngTp_Desc,MngNm_Desc,DesTp_Desc,BndryName,ST_Name,GIS_AcrsDb&f=json&returnGeometry=true&outSR=4326&maxRecordCount=1000`;
      
      console.log(`🔗 PAD-US Nearby Query URL: ${nearbyQueryUrl}`);
      const nearbyResponse = await fetch(nearbyQueryUrl);
      
      if (!nearbyResponse.ok) {
        throw new Error(`PAD-US Nearby API failed: ${nearbyResponse.status} ${nearbyResponse.statusText}`);
      }
      
      const nearbyData = await nearbyResponse.json();
      console.log(`📊 PAD-US Nearby Query response:`, nearbyData);
      
      const nearbyLands = nearbyData.features || [];
      
      // Count by access type
      const accessCounts = {
        open: nearbyLands.filter((f: any) => f.attributes.Pub_Access === 'OA').length,
        restricted: nearbyLands.filter((f: any) => f.attributes.Pub_Access === 'RA').length,
        closed: nearbyLands.filter((f: any) => f.attributes.Pub_Access === 'XA').length
      };
      
      // Count by manager type
      const managerCounts: Record<string, number> = {};
      nearbyLands.forEach((feature: any) => {
        const managerType = feature.attributes.MngTp_Desc || 'Unknown';
        managerCounts[managerType] = (managerCounts[managerType] || 0) + 1;
      });
      
      return {
        padus_public_access_inside: isInsidePublicLand,
        padus_public_access_inside_info: insideLandInfo,
        padus_public_access_nearby_count: nearbyLands.length,
        padus_public_access_nearby_access_counts: accessCounts,
        padus_public_access_nearby_manager_counts: managerCounts,
        padus_public_access_nearby_features: nearbyLands.map((feature: any) => ({
          objectId: feature.attributes.OBJECTID,
          category: feature.attributes.Category,
          featureClass: feature.attributes.FeatClass,
          unitName: feature.attributes.Unit_Nm,
          publicAccess: feature.attributes.Pub_Access,
          gapStatus: feature.attributes.GAP_Sts,
          iucnCategory: feature.attributes.IUCN_Cat,
          managerType: feature.attributes.MngTp_Desc,
          managerName: feature.attributes.MngNm_Desc,
          designationType: feature.attributes.DesTp_Desc,
          boundaryName: feature.attributes.BndryName,
          state: feature.attributes.ST_Name,
          acres: feature.attributes.GIS_AcrsDb,
          geometry: feature.geometry // Include geometry for map drawing
        })),
        padus_public_access_all: (() => {
          const allFeatures: any[] = [];
          
          // Add containing feature first if it exists
          if (isInsidePublicLand && insideLandInfo && insideLandInfo.geometry) {
            console.log('🔍 PAD-US Public Access: Adding containing feature with geometry:', !!insideLandInfo.geometry, 'has rings:', !!insideLandInfo.geometry?.rings);
            allFeatures.push(insideLandInfo);
          }
          
          // Add nearby features, avoiding duplicates
          const addedObjectIds = new Set<number>();
          if (isInsidePublicLand && insideLandInfo && insideLandInfo.objectId) {
            addedObjectIds.add(insideLandInfo.objectId);
          }
          
          nearbyLands.forEach((feature: any, idx: number) => {
            const objectId = feature.attributes.OBJECTID;
            if (objectId && !addedObjectIds.has(objectId)) {
              if (idx === 0) {
                console.log('🔍 PAD-US Public Access: First nearby feature has geometry:', !!feature.geometry, 'has rings:', !!feature.geometry?.rings);
              }
              allFeatures.push({
                objectId: feature.attributes.OBJECTID,
                category: feature.attributes.Category,
                featureClass: feature.attributes.FeatClass,
                unitName: feature.attributes.Unit_Nm,
                publicAccess: feature.attributes.Pub_Access,
                gapStatus: feature.attributes.GAP_Sts,
                iucnCategory: feature.attributes.IUCN_Cat,
                managerType: feature.attributes.MngTp_Desc,
                managerName: feature.attributes.MngNm_Desc,
                designationType: feature.attributes.DesTp_Desc,
                boundaryName: feature.attributes.BndryName,
                state: feature.attributes.ST_Name,
                acres: feature.attributes.GIS_AcrsDb,
                geometry: feature.geometry, // Preserve geometry for map drawing
                distance_miles: 0 // Will be calculated if needed
              });
              addedObjectIds.add(objectId);
            }
          });
          
          console.log(`✅ PAD-US Public Access: Created _all array with ${allFeatures.length} features, first has geometry:`, !!(allFeatures[0] as any)?.geometry);
          return allFeatures;
        })(),
        padus_public_access_summary: isInsidePublicLand 
          ? `Location is inside ${insideLandInfo?.unitName || 'public land'} (${insideLandInfo?.managerName || 'Unknown Manager'}) - ${insideLandInfo?.publicAccess || 'Unknown'} access`
          : nearbyLands.length > 0
            ? `Location is not within any public land. Found ${nearbyLands.length} public lands within ${radiusMiles} miles.`
            : `No public lands found within ${radiusMiles} miles of this location.`
      };
      
    } catch (error) {
      console.error('🏞️ PAD-US Public Access query failed:', error);
      return { padus_public_access_error: error instanceof Error ? error.message : String(error) };
    }
  }

  // PAD-US Protection Status Query
  private async getPADUSProtectionStatus(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🛡️ PAD-US Protection Status query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      const radiusKm = radiusMiles * 1.60934;
      const queryUrl = `https://services.arcgis.com/v01gqwM5QqNysAAi/ArcGIS/rest/services/PADUS_Public_Access/FeatureServer/0/query?where=1=1&geometry={"x":${lon},"y":${lat},"spatialReference":{"wkid":4326}}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusKm}&units=esriSRUnit_Kilometer&outFields=OBJECTID,GAP_Sts,IUCN_Cat,Category,Unit_Nm,Pub_Access&f=json&returnGeometry=true&outSR=4326&maxRecordCount=1000`;
      
      console.log(`🔗 PAD-US Protection Status Query URL: ${queryUrl}`);
      const response = await fetch(queryUrl);
      
      if (!response.ok) {
        throw new Error(`PAD-US Protection Status API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 PAD-US Protection Status response:`, data);
      
      const features = data.features || [];
      
      // Count by GAP status
      const gapStatusCounts: Record<string, number> = {};
      features.forEach((feature: any) => {
        const gapStatus = feature.attributes.GAP_Sts || 'Unknown';
        gapStatusCounts[gapStatus] = (gapStatusCounts[gapStatus] || 0) + 1;
      });
      
      // Count by IUCN category
      const iucnCounts: Record<string, number> = {};
      features.forEach((feature: any) => {
        const iucnCat = feature.attributes.IUCN_Cat || 'Unknown';
        iucnCounts[iucnCat] = (iucnCounts[iucnCat] || 0) + 1;
      });
      
      // Count by category
      const categoryCounts: Record<string, number> = {};
      features.forEach((feature: any) => {
        const category = feature.attributes.Category || 'Unknown';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      
      return {
        padus_protection_status_nearby_count: features.length,
        padus_protection_status_gap_counts: gapStatusCounts,
        padus_protection_status_iucn_counts: iucnCounts,
        padus_protection_status_category_counts: categoryCounts,
        padus_protection_status_nearby_features: features.map((feature: any) => ({
          objectId: feature.attributes.OBJECTID,
          gapStatus: feature.attributes.GAP_Sts,
          iucnCategory: feature.attributes.IUCN_Cat,
          category: feature.attributes.Category,
          unitName: feature.attributes.Unit_Nm,
          publicAccess: feature.attributes.Pub_Access,
          geometry: feature.geometry // Include geometry for map drawing
        })),
        padus_protection_status_all: (() => {
          const allFeatures = features.map((feature: any, idx: number) => {
            if (idx === 0) {
              console.log('🔍 PAD-US Protection Status: First feature has geometry:', !!feature.geometry, 'has rings:', !!feature.geometry?.rings);
            }
            return {
              objectId: feature.attributes.OBJECTID,
              gapStatus: feature.attributes.GAP_Sts,
              iucnCategory: feature.attributes.IUCN_Cat,
              category: feature.attributes.Category,
              unitName: feature.attributes.Unit_Nm,
              publicAccess: feature.attributes.Pub_Access,
              geometry: feature.geometry, // Preserve geometry for map drawing
              distance_miles: 0 // Will be calculated if needed
            };
          });
          console.log(`✅ PAD-US Protection Status: Created _all array with ${allFeatures.length} features, first has geometry:`, !!(allFeatures[0] as any)?.geometry);
          return allFeatures;
        })(),
        padus_protection_status_summary: `Found ${features.length} protected areas within ${radiusMiles} miles with various protection levels and categories.`
      };
      
    } catch (error) {
      console.error('🛡️ PAD-US Protection Status query failed:', error);
      return { padus_protection_status_error: error instanceof Error ? error.message : String(error)       };
    }
  }

  private async getMARegionalPlanningAgencies(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🏛️ Fetching MA Regional Planning Agencies data for [${lat}, ${lon}]`);
      
      const agencies = await getMARegionalPlanningAgenciesContainingData(lat, lon);
      console.log(`🏛️ MA Regional Planning Agencies from adapter: ${agencies.length} found`);
      
      const result: Record<string, any> = {};
      
      if (agencies && agencies.length > 0) {
        result.ma_regional_planning_agencies_count = agencies.length;
        result.ma_regional_planning_agencies_all = agencies.map(agency => {
          const agencyAny = agency as any;
          const geometry = agencyAny.geometry;
          const attributes = agencyAny.attributes;
          const { geometry: _geom37, ...rest } = agencyAny;
          // Exclude geometry from attributes if it exists there
          const { geometry: _geom38, ...cleanAttributes } = attributes || {};
          // Exclude geometry from rest to ensure it doesn't overwrite
          const { geometry: _geom39, ...cleanRest } = rest || {};
          return {
            ...cleanAttributes,
            ...cleanRest,
            geometry: geometry, // Include geometry for map drawing
            RPA_ID: agency.RPA_ID,
            RPA_NAME: agency.RPA_NAME,
            ACRONYM: agency.ACRONYM,
            WEBSITE: agency.WEBSITE,
            objectId: agency.objectId,
            distance_miles: agency.distance_miles || 0
          };
        });
        
        // Add summary info for the first agency (if point is inside)
        if (agencies.length > 0) {
          const firstAgency = agencies[0];
          result.ma_regional_planning_agency_name = firstAgency.RPA_NAME || '';
          result.ma_regional_planning_agency_acronym = firstAgency.ACRONYM || '';
          result.ma_regional_planning_agency_website = firstAgency.WEBSITE || '';
        }
      } else {
        result.ma_regional_planning_agencies_count = 0;
        result.ma_regional_planning_agencies_all = [];
      }
      
      console.log(`✅ MA Regional Planning Agencies data processed:`, {
        count: result.ma_regional_planning_agencies_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching MA Regional Planning Agencies:', error);
      return {
        ma_regional_planning_agencies_count: 0,
        ma_regional_planning_agencies_all: [],
        ma_regional_planning_agencies_error: 'Error fetching MA Regional Planning Agencies data'
      };
    }
  }

  private async getNationalMarineSanctuaries(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🌊 Fetching National Marine Sanctuaries data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      
      // Always do point-in-polygon query first
      const containingSanctuaries = await getNationalMarineSanctuariesContainingData(lat, lon);
      console.log(`🌊 National Marine Sanctuaries containing point: ${containingSanctuaries.length}`);
      
      // If radius is provided, also do proximity query
      let nearbySanctuaries: any[] = [];
      if (radius && radius > 0) {
        nearbySanctuaries = await getNationalMarineSanctuariesNearbyData(lat, lon, radius);
        console.log(`🌊 National Marine Sanctuaries nearby: ${nearbySanctuaries.length}`);
      }
      
      // Combine results, avoiding duplicates by objectId
      const allSanctuariesMap = new Map<string, any>();
      
      // Add containing sanctuaries first (distance = 0)
      containingSanctuaries.forEach(sanctuary => {
        const key = sanctuary.objectId !== undefined && sanctuary.objectId !== null
          ? `oid_${sanctuary.objectId}`
          : null;
        if (key) {
          allSanctuariesMap.set(key, sanctuary);
        }
      });
      
      // Add nearby sanctuaries (only if not already present as containing feature)
      nearbySanctuaries.forEach(sanctuary => {
        const key = sanctuary.objectId !== undefined && sanctuary.objectId !== null
          ? `oid_${sanctuary.objectId}`
          : null;
        if (key && !allSanctuariesMap.has(key)) { // Only add if not already present
          allSanctuariesMap.set(key, sanctuary);
        }
      });
      
      const allSanctuaries = Array.from(allSanctuariesMap.values());
      
      if (allSanctuaries.length > 0) {
        result.national_marine_sanctuaries_count = allSanctuaries.length;
        result.national_marine_sanctuaries_all = allSanctuaries.map((sanctuary) => {
          const sanctuaryAny = sanctuary as any;
          const geometry = sanctuaryAny.geometry;
          const attributes = sanctuaryAny.attributes;
          const { geometry: _geom40, ...rest } = sanctuaryAny;
          // Exclude geometry from attributes if it exists there
          const { geometry: _geom41, ...cleanAttributes } = attributes || {};
          // Exclude geometry from rest to ensure it doesn't overwrite
          const { geometry: _geom42, ...cleanRest } = rest || {};
          return {
            ...cleanAttributes,
            ...cleanRest,
            geometry: geometry, // Include geometry for map drawing (from top level)
            sitename: sanctuary.sitename,
            unitname: sanctuary.unitname,
            siteurl: sanctuary.siteurl,
            citation: sanctuary.citation,
            cfrsection: sanctuary.cfrsection,
            SHAPE__Length: sanctuary.SHAPE__Length,
            SHAPE__Area: sanctuary.SHAPE__Area,
            objectId: sanctuary.objectId,
            distance_miles: sanctuary.distance_miles || 0
          };
        });
        
        // Add summary info for the first sanctuary (if point is inside)
        if (containingSanctuaries.length > 0) {
          const firstSanctuary = containingSanctuaries[0];
          result.national_marine_sanctuary_name = firstSanctuary.sitename || '';
          result.national_marine_sanctuary_unit = firstSanctuary.unitname || '';
          result.national_marine_sanctuary_url = firstSanctuary.siteurl || '';
        }
      } else {
        result.national_marine_sanctuaries_count = 0;
        result.national_marine_sanctuaries_all = [];
      }
      
      if (radius && radius > 0) {
        result.national_marine_sanctuaries_search_radius_miles = radius;
      }
      
      console.log(`✅ National Marine Sanctuaries data processed:`, {
        count: result.national_marine_sanctuaries_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching National Marine Sanctuaries:', error);
      return {
        national_marine_sanctuaries_count: 0,
        national_marine_sanctuaries_all: [],
        national_marine_sanctuaries_error: 'Error fetching National Marine Sanctuaries data'
      };
    }
  }

  private async getMAACECs(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🌿 Fetching MA ACECs data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      
      // Always do point-in-polygon query first
      const containingACECs = await getMAACECsContainingData(lat, lon);
      console.log(`🌿 MA ACECs containing point: ${containingACECs.length}`);
      
      // If radius is provided, also do proximity query
      let nearbyACECs: any[] = [];
      if (radius && radius > 0) {
        nearbyACECs = await getMAACECsNearbyData(lat, lon, radius);
        console.log(`🌿 MA ACECs nearby: ${nearbyACECs.length}`);
      }
      
      // Combine results, avoiding duplicates by objectId
      const allACECsMap = new Map<string, any>();
      
      // Add containing ACECs first (distance = 0)
      containingACECs.forEach(acec => {
        const key = acec.objectId !== undefined && acec.objectId !== null
          ? `oid_${acec.objectId}`
          : null;
        if (key) {
          allACECsMap.set(key, acec);
        }
      });
      
      // Add nearby ACECs (only if not already present as containing feature)
      nearbyACECs.forEach(acec => {
        const key = acec.objectId !== undefined && acec.objectId !== null
          ? `oid_${acec.objectId}`
          : null;
        if (key && !allACECsMap.has(key)) { // Only add if not already present
          allACECsMap.set(key, acec);
        }
      });
      
      const allACECs = Array.from(allACECsMap.values());
      
      if (allACECs.length > 0) {
        result.ma_acecs_count = allACECs.length;
        result.ma_acecs_all = allACECs.map((acec) => {
          const acecAny = acec as any;
          const geometry = acecAny.geometry;
          const attributes = acecAny.attributes;
          const { geometry: _geom43, ...rest } = acecAny;
          // Exclude geometry from attributes if it exists there
          const { geometry: _geom44, ...cleanAttributes } = attributes || {};
          // Exclude geometry from rest to ensure it doesn't overwrite
          const { geometry: _geom45, ...cleanRest } = rest || {};
          return {
            ...cleanAttributes,
            ...cleanRest,
            geometry: geometry, // Include geometry for map drawing (from top level)
            ACECID: acec.ACECID,
            NAME: acec.NAME,
            DES_DATE: acec.DES_DATE,
            SECRETARY: acec.SECRETARY,
            ADMIN_BY: acec.ADMIN_BY,
            REGION: acec.REGION,
            POLY_ACRES: acec.POLY_ACRES,
            ACEC_ACRES: acec.ACEC_ACRES,
            objectId: acec.objectId,
            distance_miles: acec.distance_miles || 0
          };
        });
        
        // Add summary info for the first ACEC (if point is inside)
        if (containingACECs.length > 0) {
          const firstACEC = containingACECs[0];
          result.ma_acec_name = firstACEC.NAME || '';
          result.ma_acec_id = firstACEC.ACECID || '';
          result.ma_acec_region = firstACEC.REGION || '';
        }
      } else {
        result.ma_acecs_count = 0;
        result.ma_acecs_all = [];
      }
      
      if (radius && radius > 0) {
        result.ma_acecs_search_radius_miles = radius;
      }
      
      console.log(`✅ MA ACECs data processed:`, {
        count: result.ma_acecs_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching MA ACECs:', error);
      return {
        ma_acecs_count: 0,
        ma_acecs_all: [],
        ma_acecs_error: 'Error fetching MA ACECs data'
      };
    }
  }

  private async getMAParcels(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏠 Fetching MA Parcels data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 0.3; // Default to 0.3 miles if not provided
      
      // Get parcel data (both containing and nearby)
      const parcelData = await getMAParcelData(lat, lon, radiusMiles);
      
      if (parcelData) {
        // Collect all parcels (containing + nearby) into a single array for CSV export
        const allParcels: any[] = [];
        
        // Add containing parcel (point-in-polygon) if found
        if (parcelData.containingParcel && parcelData.containingParcel.parcelId) {
          allParcels.push({
            ...parcelData.containingParcel.attributes,
            parcelId: parcelData.containingParcel.parcelId,
            isContaining: true,
            distance_miles: 0,
            geometry: parcelData.containingParcel.geometry // Include geometry for map drawing
          });
          result.ma_parcel_containing = parcelData.containingParcel.parcelId;
        } else {
          result.ma_parcel_containing = null;
          result.ma_parcel_containing_message = 'No parcel found containing this location';
        }
        
        // Add nearby parcels (proximity search)
        if (parcelData.nearbyParcels && parcelData.nearbyParcels.length > 0) {
          parcelData.nearbyParcels.forEach(parcel => {
            // Only add if it's not already in the array (avoid duplicates)
            if (!allParcels.some(p => p.parcelId === parcel.parcelId)) {
              allParcels.push({
                ...parcel.attributes,
                parcelId: parcel.parcelId,
                isContaining: false,
                distance_miles: null, // Distance not calculated in proximity query
                geometry: parcel.geometry // Include geometry for map drawing
              });
            }
          });
          result.ma_parcels_nearby_count = parcelData.nearbyParcels.length;
        } else {
          result.ma_parcels_nearby_count = 0;
        }
        
        // Store all parcels as an array for CSV export (similar to _all_pois pattern)
        result.ma_parcels_all = allParcels;
        result.ma_parcels_search_radius_miles = radiusMiles;
      } else {
        result.ma_parcel_containing = null;
        result.ma_parcels_nearby_count = 0;
        result.ma_parcels_all = [];
      }
      
      console.log(`✅ MA Parcels data processed:`, {
        containing: result.ma_parcel_containing || 'N/A',
        nearbyCount: result.ma_parcels_nearby_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching MA Parcels:', error);
      return {
        ma_parcel_containing: null,
        ma_parcels_nearby_count: 0,
        ma_parcels_all: [],
        ma_parcels_error: 'Error fetching MA Parcels data'
      };
    }
  }

  private async getCTWaterPollutionControl(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const facilities = await getCTWaterPollutionControlData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {
        ct_water_pollution_control_count: facilities.length,
        ct_water_pollution_control_search_radius_miles: radiusMiles,
        ct_water_pollution_control_all: facilities.map(facility => ({
          ...facility.attributes,
          facilityId: facility.facilityId,
          facilityName: facility.facilityName,
          permittee: facility.permittee,
          address: facility.address,
          city: facility.city,
          zip: facility.zip,
          phone: facility.phone,
          permitId: facility.permitId,
          facilityIdCode: facility.facilityIdCode,
          receivingWaterbody: facility.receivingWaterbody,
          dischargeType: facility.dischargeType,
          facilityClass: facility.facilityClass,
          owner: facility.owner,
          lat: facility.lat,
          lon: facility.lon,
          distance_miles: facility.distance_miles
        }))
      };
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CT Water Pollution Control Facilities:', error);
      return {
        ct_water_pollution_control_count: 0,
        ct_water_pollution_control_all: [],
        ct_water_pollution_control_error: 'Error fetching CT Water Pollution Control Facilities data'
      };
    }
  }

  private async getCTBoatLaunches(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const launches = await getCTBoatLaunchesData(lat, lon, radiusMiles);
      
      const result: Record<string, any> = {
        ct_boat_launches_count: launches.length,
        ct_boat_launches_search_radius_miles: radiusMiles,
        ct_boat_launches_all: launches.map(launch => ({
          ...launch.attributes,
          launchId: launch.launchId,
          name: launch.name,
          address: launch.address,
          city: launch.city,
          state: launch.state,
          zip: launch.zip,
          phone: launch.phone,
          lat: launch.lat,
          lon: launch.lon,
          distance_miles: launch.distance_miles
        }))
      };
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CT Boat Launches:', error);
      return {
        ct_boat_launches_count: 0,
        ct_boat_launches_all: [],
        ct_boat_launches_error: 'Error fetching CT Boat Launches data'
      };
    }
  }

  private async getCTFederalOpenSpace(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const openSpaceData = await getCTFederalOpenSpaceData(lat, lon, radiusMiles);
      
      if (!openSpaceData) {
        return {
          ct_federal_open_space_containing: null,
          ct_federal_open_space_containing_message: 'No open space found containing this location',
          ct_federal_open_space_nearby_count: 0,
          ct_federal_open_space_all: []
        };
      }
      
      const result: Record<string, any> = {};
      
      if (openSpaceData.containingOpenSpace) {
        result.ct_federal_open_space_containing = openSpaceData.containingOpenSpace.name || 
                                                  openSpaceData.containingOpenSpace.openSpaceId || 
                                                  'Unknown Open Space';
        result.ct_federal_open_space_containing_message = `Location is within: ${result.ct_federal_open_space_containing}`;
        if (openSpaceData.containingOpenSpace.agency) {
          result.ct_federal_open_space_containing_agency = openSpaceData.containingOpenSpace.agency;
        }
      } else {
        result.ct_federal_open_space_containing = null;
        result.ct_federal_open_space_containing_message = 'No open space found containing this location';
      }
      
      const allOpenSpaces: any[] = [];
      
      if (openSpaceData.containingOpenSpace) {
        allOpenSpaces.push({
          ...openSpaceData.containingOpenSpace.attributes,
          openSpaceId: openSpaceData.containingOpenSpace.openSpaceId,
          name: openSpaceData.containingOpenSpace.name,
          agency: openSpaceData.containingOpenSpace.agency,
          isContaining: true,
          distance_miles: 0,
          geometry: openSpaceData.containingOpenSpace.geometry
        });
      }
      
      if (openSpaceData.nearbyOpenSpaces && openSpaceData.nearbyOpenSpaces.length > 0) {
        openSpaceData.nearbyOpenSpaces.forEach(openSpace => {
          const isSameAsContaining = openSpaceData.containingOpenSpace && 
                                    openSpace.openSpaceId === openSpaceData.containingOpenSpace.openSpaceId;
          if (!isSameAsContaining) {
            allOpenSpaces.push({
              ...openSpace.attributes,
              openSpaceId: openSpace.openSpaceId,
              name: openSpace.name,
              agency: openSpace.agency,
              isContaining: false,
              distance_miles: openSpace.distance_miles,
              geometry: openSpace.geometry
            });
          }
        });
      }
      
      const uniqueOpenSpaces = new Map<string, any>();
      allOpenSpaces.forEach(openSpace => {
        const key = openSpace.openSpaceId || openSpace.OBJECTID || `openspace_${Math.random()}`;
        if (!uniqueOpenSpaces.has(key)) {
          uniqueOpenSpaces.set(key, openSpace);
        }
      });
      
      const deduplicatedOpenSpaces = Array.from(uniqueOpenSpaces.values());
      
      if (deduplicatedOpenSpaces.length > 0) {
        result.ct_federal_open_space_nearby_count = deduplicatedOpenSpaces.length;
        result.ct_federal_open_space_all = deduplicatedOpenSpaces;
      } else {
        result.ct_federal_open_space_nearby_count = 0;
        result.ct_federal_open_space_all = [];
      }
      
      result.ct_federal_open_space_search_radius_miles = radiusMiles;
      
      console.log(`✅ CT Federal Open Space data processed:`, {
        containing: result.ct_federal_open_space_containing || 'N/A',
        nearbyCount: result.ct_federal_open_space_nearby_count || 0
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CT Federal Open Space data:', error);
      return {
        ct_federal_open_space_containing: null,
        ct_federal_open_space_containing_message: 'Error fetching CT Federal Open Space data',
        ct_federal_open_space_nearby_count: 0,
        ct_federal_open_space_all: []
      };
    }
  }

  private async getCTHUCWatersheds(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      const watershedData = await getCTHUCWatershedData(lat, lon);
      
      if (!watershedData) {
        return {
          ct_huc_watersheds_containing: null,
          ct_huc_watersheds_containing_message: 'No watershed found containing this location',
          ct_huc_watersheds_all: []
        };
      }
      
      const result: Record<string, any> = {};
      
      // Set containing watershed information
      result.ct_huc_watersheds_containing = watershedData.huc12Name || 
                                            watershedData.huc10Name || 
                                            watershedData.huc12 || 
                                            watershedData.huc10 || 
                                            watershedData.watershedId || 
                                            'Unknown Watershed';
      result.ct_huc_watersheds_containing_message = `Location is within: ${result.ct_huc_watersheds_containing}`;
      
      if (watershedData.huc12) {
        result.ct_huc_watersheds_containing_huc12 = watershedData.huc12;
      }
      if (watershedData.huc10) {
        result.ct_huc_watersheds_containing_huc10 = watershedData.huc10;
      }
      if (watershedData.huc8) {
        result.ct_huc_watersheds_containing_huc8 = watershedData.huc8;
      }
      if (watershedData.huc12Name) {
        result.ct_huc_watersheds_containing_huc12_name = watershedData.huc12Name;
      }
      if (watershedData.huc10Name) {
        result.ct_huc_watersheds_containing_huc10_name = watershedData.huc10Name;
      }
      if (watershedData.acres !== null) {
        result.ct_huc_watersheds_containing_acres = watershedData.acres;
      }
      if (watershedData.states) {
        result.ct_huc_watersheds_containing_states = watershedData.states;
      }
      
      // Add to _all array for map drawing
      result.ct_huc_watersheds_all = [{
        ...watershedData.attributes,
        watershedId: watershedData.watershedId,
        huc8: watershedData.huc8,
        huc10: watershedData.huc10,
        huc12: watershedData.huc12,
        huc10Name: watershedData.huc10Name,
        huc12Name: watershedData.huc12Name,
        huc10Type: watershedData.huc10Type,
        huc12Type: watershedData.huc12Type,
        huc10Mod: watershedData.huc10Mod,
        huc12Mod: watershedData.huc12Mod,
        acres: watershedData.acres,
        states: watershedData.states,
        isContaining: true,
        distance_miles: 0,
        geometry: watershedData.geometry
      }];
      
      console.log(`✅ CT HUC Watershed data processed:`, {
        containing: result.ct_huc_watersheds_containing || 'N/A'
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CT HUC Watershed data:', error);
      return {
        ct_huc_watersheds_containing: null,
        ct_huc_watersheds_containing_message: 'Error fetching CT HUC Watershed data',
        ct_huc_watersheds_all: []
      };
    }
  }

  private async getCTSoilsParentMaterial(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      const soilData = await getCTSoilsParentMaterialData(lat, lon);
      
      if (!soilData) {
        return {
          ct_soils_parent_material_containing: null,
          ct_soils_parent_material_containing_message: 'No soil polygon found containing this location',
          ct_soils_parent_material_all: []
        };
      }
      
      const result: Record<string, any> = {};
      
      // Set containing soil information
      result.ct_soils_parent_material_containing = soilData.parentMaterialName || 
                                                  soilData.mukey || 
                                                  soilData.musym || 
                                                  soilData.soilId || 
                                                  'Unknown Soil';
      result.ct_soils_parent_material_containing_message = `Location is within: ${result.ct_soils_parent_material_containing}`;
      
      if (soilData.parentMaterialName) {
        result.ct_soils_parent_material_containing_parent_material_name = soilData.parentMaterialName;
      }
      if (soilData.mukey) {
        result.ct_soils_parent_material_containing_mukey = soilData.mukey;
      }
      if (soilData.musym) {
        result.ct_soils_parent_material_containing_musym = soilData.musym;
      }
      if (soilData.areaSymbol) {
        result.ct_soils_parent_material_containing_area_symbol = soilData.areaSymbol;
      }
      if (soilData.spatialVersion !== null) {
        result.ct_soils_parent_material_containing_spatial_version = soilData.spatialVersion;
      }
      
      // Add to _all array for map drawing
      result.ct_soils_parent_material_all = [{
        ...soilData.attributes,
        soilId: soilData.soilId,
        areaSymbol: soilData.areaSymbol,
        musym: soilData.musym,
        mukey: soilData.mukey,
        parentMaterialName: soilData.parentMaterialName,
        spatialVersion: soilData.spatialVersion,
        isContaining: true,
        distance_miles: 0,
        geometry: soilData.geometry
      }];
      
      console.log(`✅ CT Soils Parent Material data processed:`, {
        containing: result.ct_soils_parent_material_containing || 'N/A'
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CT Soils Parent Material data:', error);
      return {
        ct_soils_parent_material_containing: null,
        ct_soils_parent_material_containing_message: 'Error fetching CT Soils Parent Material data',
        ct_soils_parent_material_all: []
      };
    }
  }

  private async getCAPowerOutageAreas(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`⚡ Fetching CA Power Outage Areas data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const outageAreas = await getCAPowerOutageAreaData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      if (outageAreas.length === 0) {
        result.ca_power_outage_areas_containing = null;
        result.ca_power_outage_areas_containing_message = 'No power outage area found containing this location';
        result.ca_power_outage_areas_count = 0;
        result.ca_power_outage_areas_all = [];
        return result;
      }
      
      // Find containing outage (distance = 0)
      const containingOutage = outageAreas.find(o => o.distance_miles === 0);
      
      if (containingOutage) {
        result.ca_power_outage_areas_containing = containingOutage.incidentId || 
                                                 containingOutage.outageId || 
                                                 containingOutage.utilityCompany || 
                                                 'Power Outage Area';
        result.ca_power_outage_areas_containing_message = `Location is within a power outage area: ${result.ca_power_outage_areas_containing}`;
        
        if (containingOutage.utilityCompany) {
          result.ca_power_outage_areas_containing_utility_company = containingOutage.utilityCompany;
        }
        if (containingOutage.outageStatus) {
          result.ca_power_outage_areas_containing_status = containingOutage.outageStatus;
        }
        if (containingOutage.outageType) {
          result.ca_power_outage_areas_containing_type = containingOutage.outageType;
        }
        if (containingOutage.impactedCustomers !== null) {
          result.ca_power_outage_areas_containing_customers = containingOutage.impactedCustomers;
        }
        if (containingOutage.county) {
          result.ca_power_outage_areas_containing_county = containingOutage.county;
        }
      } else {
        result.ca_power_outage_areas_containing = null;
        result.ca_power_outage_areas_containing_message = 'No power outage area found containing this location';
      }
      
      // Set count and all array
      result.ca_power_outage_areas_count = outageAreas.length;
      result.ca_power_outage_areas_all = outageAreas.map(outage => ({
        ...outage.attributes,
        outageId: outage.outageId,
        utilityCompany: outage.utilityCompany,
        startDate: outage.startDate,
        estimatedRestoreDate: outage.estimatedRestoreDate,
        cause: outage.cause,
        impactedCustomers: outage.impactedCustomers,
        county: outage.county,
        outageStatus: outage.outageStatus,
        outageType: outage.outageType,
        incidentId: outage.incidentId,
        isContaining: outage.distance_miles === 0,
        distance_miles: outage.distance_miles || 0,
        geometry: outage.geometry
      }));
      
      console.log(`✅ CA Power Outage Areas data processed:`, {
        containing: result.ca_power_outage_areas_containing || 'N/A',
        totalCount: result.ca_power_outage_areas_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Power Outage Areas data:', error);
      return {
        ca_power_outage_areas_containing: null,
        ca_power_outage_areas_containing_message: 'Error fetching CA Power Outage Areas data',
        ca_power_outage_areas_count: 0,
        ca_power_outage_areas_all: []
      };
    }
  }

  private async getCAFirePerimetersAll(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🔥 Fetching CA Fire Perimeters (All) data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const firePerimeters = await getCAFirePerimetersAllData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      if (firePerimeters.length === 0) {
        result.ca_fire_perimeters_all_containing = null;
        result.ca_fire_perimeters_all_containing_message = 'No fire perimeter found containing this location';
        result.ca_fire_perimeters_all_count = 0;
        result.ca_fire_perimeters_all_all = [];
        return result;
      }
      
      // Find containing fire (distance = 0)
      const containingFire = firePerimeters.find(f => f.distance_miles === 0);
      
      if (containingFire) {
        result.ca_fire_perimeters_all_containing = containingFire.fireName || 
                                                   containingFire.fireId || 
                                                   'Fire Perimeter';
        result.ca_fire_perimeters_all_containing_message = `Location is within a fire perimeter: ${result.ca_fire_perimeters_all_containing}`;
        
        if (containingFire.fireName) {
          result.ca_fire_perimeters_all_containing_name = containingFire.fireName;
        }
        if (containingFire.fireYear !== null) {
          result.ca_fire_perimeters_all_containing_year = containingFire.fireYear;
        }
        if (containingFire.acres !== null) {
          result.ca_fire_perimeters_all_containing_acres = containingFire.acres;
        }
      } else {
        result.ca_fire_perimeters_all_containing = null;
        result.ca_fire_perimeters_all_containing_message = 'No fire perimeter found containing this location';
      }
      
      // Set count and all array
      result.ca_fire_perimeters_all_count = firePerimeters.length;
      result.ca_fire_perimeters_all_all = firePerimeters.map(fire => ({
        ...fire.attributes,
        fireId: fire.fireId,
        fireName: fire.fireName,
        fireYear: fire.fireYear,
        acres: fire.acres,
        isContaining: fire.distance_miles === 0,
        distance_miles: fire.distance_miles || 0,
        geometry: fire.geometry
      }));
      
      console.log(`✅ CA Fire Perimeters (All) data processed:`, {
        containing: result.ca_fire_perimeters_all_containing || 'N/A',
        totalCount: result.ca_fire_perimeters_all_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Fire Perimeters (All) data:', error);
      return {
        ca_fire_perimeters_all_containing: null,
        ca_fire_perimeters_all_containing_message: 'Error fetching CA Fire Perimeters (All) data',
        ca_fire_perimeters_all_count: 0,
        ca_fire_perimeters_all_all: []
      };
    }
  }

  private async getCAFirePerimetersRecentLarge(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🔥 Fetching CA Recent Large Fire Perimeters data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const firePerimeters = await getCAFirePerimetersRecentLargeData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      if (firePerimeters.length === 0) {
        result.ca_fire_perimeters_recent_large_containing = null;
        result.ca_fire_perimeters_recent_large_containing_message = 'No fire perimeter found containing this location';
        result.ca_fire_perimeters_recent_large_count = 0;
        result.ca_fire_perimeters_recent_large_all = [];
        return result;
      }
      
      // Find containing fire (distance = 0)
      const containingFire = firePerimeters.find(f => f.distance_miles === 0);
      
      if (containingFire) {
        result.ca_fire_perimeters_recent_large_containing = containingFire.fireName || 
                                                            containingFire.fireId || 
                                                            'Fire Perimeter';
        result.ca_fire_perimeters_recent_large_containing_message = `Location is within a fire perimeter: ${result.ca_fire_perimeters_recent_large_containing}`;
        
        if (containingFire.fireName) {
          result.ca_fire_perimeters_recent_large_containing_name = containingFire.fireName;
        }
        if (containingFire.fireYear !== null) {
          result.ca_fire_perimeters_recent_large_containing_year = containingFire.fireYear;
        }
        if (containingFire.acres !== null) {
          result.ca_fire_perimeters_recent_large_containing_acres = containingFire.acres;
        }
      } else {
        result.ca_fire_perimeters_recent_large_containing = null;
        result.ca_fire_perimeters_recent_large_containing_message = 'No fire perimeter found containing this location';
      }
      
      // Set count and all array
      result.ca_fire_perimeters_recent_large_count = firePerimeters.length;
      result.ca_fire_perimeters_recent_large_all = firePerimeters.map(fire => ({
        ...fire.attributes,
        fireId: fire.fireId,
        fireName: fire.fireName,
        fireYear: fire.fireYear,
        acres: fire.acres,
        isContaining: fire.distance_miles === 0,
        distance_miles: fire.distance_miles || 0,
        geometry: fire.geometry
      }));
      
      console.log(`✅ CA Recent Large Fire Perimeters data processed:`, {
        containing: result.ca_fire_perimeters_recent_large_containing || 'N/A',
        totalCount: result.ca_fire_perimeters_recent_large_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Recent Large Fire Perimeters data:', error);
      return {
        ca_fire_perimeters_recent_large_containing: null,
        ca_fire_perimeters_recent_large_containing_message: 'Error fetching CA Recent Large Fire Perimeters data',
        ca_fire_perimeters_recent_large_count: 0,
        ca_fire_perimeters_recent_large_all: []
      };
    }
  }

  private async getCAFirePerimeters1950(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🔥 Fetching CA Fire Perimeters (1950+) data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const firePerimeters = await getCAFirePerimeters1950Data(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      if (firePerimeters.length === 0) {
        result.ca_fire_perimeters_1950_containing = null;
        result.ca_fire_perimeters_1950_containing_message = 'No fire perimeter found containing this location';
        result.ca_fire_perimeters_1950_count = 0;
        result.ca_fire_perimeters_1950_all = [];
        return result;
      }
      
      // Find containing fire (distance = 0)
      const containingFire = firePerimeters.find(f => f.distance_miles === 0);
      
      if (containingFire) {
        result.ca_fire_perimeters_1950_containing = containingFire.fireName || 
                                                    containingFire.fireId || 
                                                    'Fire Perimeter';
        result.ca_fire_perimeters_1950_containing_message = `Location is within a fire perimeter: ${result.ca_fire_perimeters_1950_containing}`;
        
        if (containingFire.fireName) {
          result.ca_fire_perimeters_1950_containing_name = containingFire.fireName;
        }
        if (containingFire.fireYear !== null) {
          result.ca_fire_perimeters_1950_containing_year = containingFire.fireYear;
        }
        if (containingFire.acres !== null) {
          result.ca_fire_perimeters_1950_containing_acres = containingFire.acres;
        }
      } else {
        result.ca_fire_perimeters_1950_containing = null;
        result.ca_fire_perimeters_1950_containing_message = 'No fire perimeter found containing this location';
      }
      
      // Set count and all array
      result.ca_fire_perimeters_1950_count = firePerimeters.length;
      result.ca_fire_perimeters_1950_all = firePerimeters.map(fire => ({
        ...fire.attributes,
        fireId: fire.fireId,
        fireName: fire.fireName,
        fireYear: fire.fireYear,
        acres: fire.acres,
        isContaining: fire.distance_miles === 0,
        distance_miles: fire.distance_miles || 0,
        geometry: fire.geometry
      }));
      
      console.log(`✅ CA Fire Perimeters (1950+) data processed:`, {
        containing: result.ca_fire_perimeters_1950_containing || 'N/A',
        totalCount: result.ca_fire_perimeters_1950_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Fire Perimeters (1950+) data:', error);
      return {
        ca_fire_perimeters_1950_containing: null,
        ca_fire_perimeters_1950_containing_message: 'Error fetching CA Fire Perimeters (1950+) data',
        ca_fire_perimeters_1950_count: 0,
        ca_fire_perimeters_1950_all: []
      };
    }
  }

  private async getCALandOwnership(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      const ownershipData = await getCALandOwnershipData(lat, lon);
      
      if (!ownershipData) {
        return {
          ca_land_ownership_containing: null,
          ca_land_ownership_containing_message: 'No land ownership polygon found containing this location',
          ca_land_ownership_all: []
        };
      }
      
      const result: Record<string, any> = {};
      
      // Set containing ownership information
      result.ca_land_ownership_containing = ownershipData.ownGroup || 
                                           ownershipData.ownAgency || 
                                           ownershipData.ownLevel || 
                                           ownershipData.ownershipId || 
                                           'Unknown Ownership';
      result.ca_land_ownership_containing_message = `Location is within: ${result.ca_land_ownership_containing}`;
      
      if (ownershipData.ownGroup) {
        result.ca_land_ownership_containing_group = ownershipData.ownGroup;
      }
      if (ownershipData.ownAgency) {
        result.ca_land_ownership_containing_agency = ownershipData.ownAgency;
      }
      if (ownershipData.ownLevel) {
        result.ca_land_ownership_containing_level = ownershipData.ownLevel;
      }
      
      // Add to _all array for map drawing
      result.ca_land_ownership_all = [{
        ...ownershipData.attributes,
        ownershipId: ownershipData.ownershipId,
        ownLevel: ownershipData.ownLevel,
        ownAgency: ownershipData.ownAgency,
        ownGroup: ownershipData.ownGroup,
        isContaining: true,
        geometry: ownershipData.geometry
      }];
      
      console.log(`✅ CA Land Ownership data processed:`, {
        containing: result.ca_land_ownership_containing || 'N/A'
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Land Ownership data:', error);
      return {
        ca_land_ownership_containing: null,
        ca_land_ownership_containing_message: 'Error fetching CA Land Ownership data',
        ca_land_ownership_all: []
      };
    }
  }

  private async getCACGSLandslideZones(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏔️ Fetching CA CGS Landslide Zones data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      // Limit radius to 10 miles maximum as specified
      const maxRadius = 10;
      const queryRadius = radius && radius > 0 ? Math.min(radius, maxRadius) : undefined;
      
      const landslideZones = await getCACGSLandslideZonesData(lat, lon, queryRadius);
      
      const result: Record<string, any> = {};
      
      if (landslideZones.length === 0) {
        result.ca_cgs_landslide_zones_containing = null;
        result.ca_cgs_landslide_zones_containing_message = 'No landslide zone found containing this location';
        result.ca_cgs_landslide_zones_count = 0;
        result.ca_cgs_landslide_zones_all = [];
        return result;
      }
      
      // Find containing zone (distance = 0)
      const containingZone = landslideZones.find(z => z.distance_miles === 0);
      
      if (containingZone) {
        result.ca_cgs_landslide_zones_containing = containingZone.zoneName || 
                                                   containingZone.zoneType || 
                                                   containingZone.landslideZoneId || 
                                                   'Landslide Zone';
        result.ca_cgs_landslide_zones_containing_message = `Location is within a landslide zone: ${result.ca_cgs_landslide_zones_containing}`;
        
        if (containingZone.zoneName) {
          result.ca_cgs_landslide_zones_containing_name = containingZone.zoneName;
        }
        if (containingZone.zoneType) {
          result.ca_cgs_landslide_zones_containing_type = containingZone.zoneType;
        }
        if (containingZone.landslideZoneId) {
          result.ca_cgs_landslide_zones_containing_id = containingZone.landslideZoneId;
        }
      } else {
        result.ca_cgs_landslide_zones_containing = null;
        result.ca_cgs_landslide_zones_containing_message = 'No landslide zone found containing this location';
      }
      
      // Set count and all array
      result.ca_cgs_landslide_zones_count = landslideZones.length;
      result.ca_cgs_landslide_zones_all = landslideZones.map(zone => ({
        ...zone.attributes,
        landslideZoneId: zone.landslideZoneId,
        zoneName: zone.zoneName,
        zoneType: zone.zoneType,
        isContaining: zone.distance_miles === 0,
        distance_miles: zone.distance_miles || 0,
        geometry: zone.geometry
      }));
      
      console.log(`✅ CA CGS Landslide Zones data processed:`, {
        containing: result.ca_cgs_landslide_zones_containing || 'N/A',
        totalCount: result.ca_cgs_landslide_zones_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA CGS Landslide Zones data:', error);
      return {
        ca_cgs_landslide_zones_containing: null,
        ca_cgs_landslide_zones_containing_message: 'Error fetching CA CGS Landslide Zones data',
        ca_cgs_landslide_zones_count: 0,
        ca_cgs_landslide_zones_all: []
      };
    }
  }

  private async getCACGSLiquefactionZones(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🌊 Fetching CA CGS Liquefaction Zones data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      // Limit radius to 25 miles maximum as specified
      const maxRadius = 25;
      const queryRadius = radius && radius > 0 ? Math.min(radius, maxRadius) : undefined;
      
      const liquefactionZones = await getCACGSLiquefactionZonesData(lat, lon, queryRadius);
      
      const result: Record<string, any> = {};
      
      if (liquefactionZones.length === 0) {
        result.ca_cgs_liquefaction_zones_containing = null;
        result.ca_cgs_liquefaction_zones_containing_message = 'No liquefaction zone found containing this location';
        result.ca_cgs_liquefaction_zones_count = 0;
        result.ca_cgs_liquefaction_zones_all = [];
        return result;
      }
      
      // Find containing zone (distance = 0)
      const containingZone = liquefactionZones.find(z => z.distance_miles === 0);
      
      if (containingZone) {
        result.ca_cgs_liquefaction_zones_containing = containingZone.zoneName || 
                                                      containingZone.zoneType || 
                                                      containingZone.liquefactionZoneId || 
                                                      'Liquefaction Zone';
        result.ca_cgs_liquefaction_zones_containing_message = `Location is within a liquefaction zone: ${result.ca_cgs_liquefaction_zones_containing}`;
        
        if (containingZone.zoneName) {
          result.ca_cgs_liquefaction_zones_containing_name = containingZone.zoneName;
        }
        if (containingZone.zoneType) {
          result.ca_cgs_liquefaction_zones_containing_type = containingZone.zoneType;
        }
        if (containingZone.liquefactionZoneId) {
          result.ca_cgs_liquefaction_zones_containing_id = containingZone.liquefactionZoneId;
        }
      } else {
        result.ca_cgs_liquefaction_zones_containing = null;
        result.ca_cgs_liquefaction_zones_containing_message = 'No liquefaction zone found containing this location';
      }
      
      // Set count and all array
      result.ca_cgs_liquefaction_zones_count = liquefactionZones.length;
      result.ca_cgs_liquefaction_zones_all = liquefactionZones.map(zone => ({
        ...zone.attributes,
        liquefactionZoneId: zone.liquefactionZoneId,
        zoneName: zone.zoneName,
        zoneType: zone.zoneType,
        isContaining: zone.distance_miles === 0,
        distance_miles: zone.distance_miles || 0,
        geometry: zone.geometry
      }));
      
      console.log(`✅ CA CGS Liquefaction Zones data processed:`, {
        containing: result.ca_cgs_liquefaction_zones_containing || 'N/A',
        totalCount: result.ca_cgs_liquefaction_zones_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA CGS Liquefaction Zones data:', error);
      return {
        ca_cgs_liquefaction_zones_containing: null,
        ca_cgs_liquefaction_zones_containing_message: 'Error fetching CA CGS Liquefaction Zones data',
        ca_cgs_liquefaction_zones_count: 0,
        ca_cgs_liquefaction_zones_all: []
      };
    }
  }

  private async getCAWildlandFireDirectProtection(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      const protectionData = await getCAWildlandFireDirectProtectionData(lat, lon);
      
      if (!protectionData) {
        return {
          ca_wildland_fire_direct_protection_containing: null,
          ca_wildland_fire_direct_protection_containing_message: 'No wildland fire direct protection area found containing this location',
          ca_wildland_fire_direct_protection_all: []
        };
      }
      
      const result: Record<string, any> = {};
      
      // Set containing protection area information
      result.ca_wildland_fire_direct_protection_containing = protectionData.dpaAgency || 
                                                             protectionData.dpaGroup || 
                                                             protectionData.respondId || 
                                                             protectionData.protectionAreaId || 
                                                             'Unknown Protection Area';
      result.ca_wildland_fire_direct_protection_containing_message = `Location is within: ${result.ca_wildland_fire_direct_protection_containing}`;
      
      if (protectionData.dpaAgency) {
        result.ca_wildland_fire_direct_protection_containing_agency = protectionData.dpaAgency;
      }
      if (protectionData.dpaGroup) {
        result.ca_wildland_fire_direct_protection_containing_group = protectionData.dpaGroup;
      }
      if (protectionData.respondId) {
        result.ca_wildland_fire_direct_protection_containing_respond_id = protectionData.respondId;
      }
      if (protectionData.nwcgUnitId) {
        result.ca_wildland_fire_direct_protection_containing_nwcg_unit_id = protectionData.nwcgUnitId;
      }
      if (protectionData.agreements) {
        result.ca_wildland_fire_direct_protection_containing_agreements = protectionData.agreements;
      }
      if (protectionData.costAppor) {
        result.ca_wildland_fire_direct_protection_containing_cost_appor = protectionData.costAppor;
      }
      
      // Add to _all array for map drawing
      result.ca_wildland_fire_direct_protection_all = [{
        ...protectionData.attributes,
        protectionAreaId: protectionData.protectionAreaId,
        dpaAgency: protectionData.dpaAgency,
        dpaGroup: protectionData.dpaGroup,
        respondId: protectionData.respondId,
        nwcgUnitId: protectionData.nwcgUnitId,
        agreements: protectionData.agreements,
        costAppor: protectionData.costAppor,
        comments: protectionData.comments,
        isContaining: true,
        distance_miles: 0,
        geometry: protectionData.geometry
      }];
      
      console.log(`✅ CA Wildland Fire Direct Protection Areas data processed:`, {
        containing: result.ca_wildland_fire_direct_protection_containing || 'N/A'
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Wildland Fire Direct Protection Areas data:', error);
      return {
        ca_wildland_fire_direct_protection_containing: null,
        ca_wildland_fire_direct_protection_containing_message: 'Error fetching CA Wildland Fire Direct Protection Areas data',
        ca_wildland_fire_direct_protection_all: []
      };
    }
  }

  private async getCACalVTPTreatmentAreas(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🔥 Fetching CA CalVTP Treatment Areas data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const treatmentAreas = await getCACalVTPTreatmentAreasData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      result.ca_calvtp_treatment_areas_count = treatmentAreas.length;
      result.ca_calvtp_treatment_areas_all = treatmentAreas.map(area => ({
        ...area.attributes,
        treatmentAreaId: area.treatmentAreaId,
        projectId: area.projectId,
        dateCompleted: area.dateCompleted,
        treatmentType: area.treatmentType,
        treatmentActivity: area.treatmentActivity,
        treatmentAcres: area.treatmentAcres,
        county: area.county,
        fuelType: area.fuelType,
        coastalZone: area.coastalZone,
        grantType: area.grantType,
        status: area.status,
        affiliation: area.affiliation,
        treatmentStage: area.treatmentStage,
        contactName: area.contactName,
        contactNumber: area.contactNumber,
        contactEmail: area.contactEmail,
        contactAddress: area.contactAddress,
        comments: area.comments,
        reviewed: area.reviewed,
        distance_miles: area.distance_miles,
        geometry: area.geometry
      }));
      
      // Point-in-polygon result (distance_miles === 0)
      const containingArea = treatmentAreas.find(a => a.distance_miles === 0);
      if (containingArea) {
        result.ca_calvtp_treatment_areas = containingArea.projectId || `Treatment Area ${containingArea.treatmentAreaId || 'Unknown'}`;
        result.ca_calvtp_treatment_areas_project_id = containingArea.projectId || null;
        result.ca_calvtp_treatment_areas_treatment_stage = containingArea.treatmentStage || null;
        result.ca_calvtp_treatment_areas_treatment_acres = containingArea.treatmentAcres || null;
      }
      
      console.log(`✅ CA CalVTP Treatment Areas data processed:`, {
        totalCount: result.ca_calvtp_treatment_areas_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA CalVTP Treatment Areas data:', error);
      return {
        ca_calvtp_treatment_areas_count: 0,
        ca_calvtp_treatment_areas_all: []
      };
    }
  }

  private async getCAPostfireDamageInspections(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🔥 Fetching CA Post-Fire Damage Inspections (DINS) data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          ca_postfire_damage_inspections_count: 0,
          ca_postfire_damage_inspections_all: []
        };
      }
      
      const inspections = await getCAPostfireDamageInspectionsData(lat, lon, radius);
      
      const result: Record<string, any> = {};

      result.ca_postfire_damage_inspections_count = inspections.length;
      result.ca_postfire_damage_inspections_all = inspections.map(inspection => ({
        ...inspection.attributes,
        inspectionId: inspection.inspectionId,
        damage: inspection.damage,
        siteAddress: inspection.siteAddress,
        streetNumber: inspection.streetNumber,
        streetName: inspection.streetName,
        streetType: inspection.streetType,
        city: inspection.city,
        county: inspection.county,
        zipCode: inspection.zipCode,
        incidentName: inspection.incidentName,
        incidentNum: inspection.incidentNum,
        incidentStartDate: inspection.incidentStartDate,
        fireName: inspection.fireName,
        structureType: inspection.structureType,
        structureCategory: inspection.structureCategory,
        roofConstruction: inspection.roofConstruction,
        yearBuilt: inspection.yearBuilt,
        apn: inspection.apn,
        assessedImprovedValue: inspection.assessedImprovedValue,
        calFireUnit: inspection.calFireUnit,
        battalion: inspection.battalion,
        geometry: inspection.geometry,
        distance_miles: inspection.distance_miles
      }));
      
      result.ca_postfire_damage_inspections_summary = `Found ${inspections.length} post-fire damage inspection(s) within ${radius} miles.`;
      
      console.log(`✅ CA Post-Fire Damage Inspections (DINS) data processed:`, {
        totalCount: result.ca_postfire_damage_inspections_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Post-Fire Damage Inspections (DINS) data:', error);
      return {
        ca_postfire_damage_inspections_count: 0,
        ca_postfire_damage_inspections_all: []
      };
    }
  }

  private async getCAMediumHeavyDutyInfrastructure(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🚛 Fetching CA Medium and Heavy Duty Infrastructure data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          ca_medium_heavy_duty_infrastructure_count: 0,
          ca_medium_heavy_duty_infrastructure_all: []
        };
      }
      
      const stations = await getCAMediumHeavyDutyInfrastructureData(lat, lon, radius);
      
      const result: Record<string, any> = {};

      result.ca_medium_heavy_duty_infrastructure_count = stations.length;
      result.ca_medium_heavy_duty_infrastructure_all = stations.map(station => ({
        ...station.attributes,
        stationId: station.stationId,
        chargingOrHydrogen: station.chargingOrHydrogen,
        chargerOrDispenserCount: station.chargerOrDispenserCount,
        nozzleCount: station.nozzleCount,
        address: station.address,
        latitude: station.latitude,
        longitude: station.longitude,
        fundingAgencies: station.fundingAgencies,
        operator: station.operator,
        eligible: station.eligible,
        liquidGaseous: station.liquidGaseous,
        chargingCapacity: station.chargingCapacity,
        maximumCharging: station.maximumCharging,
        projectStatus: station.projectStatus,
        geometry: station.geometry,
        distance_miles: station.distance_miles
      }));
      
      result.ca_medium_heavy_duty_infrastructure_summary = `Found ${stations.length} medium/heavy duty infrastructure station(s) within ${radius} miles.`;
      
      console.log(`✅ CA Medium and Heavy Duty Infrastructure data processed:`, {
        totalCount: result.ca_medium_heavy_duty_infrastructure_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Medium and Heavy Duty Infrastructure data:', error);
      return {
        ca_medium_heavy_duty_infrastructure_count: 0,
        ca_medium_heavy_duty_infrastructure_all: []
      };
    }
  }

  private async getCAFRAPFacilities(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🔥 Fetching CA FRAP Facilities data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          ca_frap_facilities_count: 0,
          ca_frap_facilities_all: []
        };
      }
      
      const facilities = await getCAFRAPFacilitiesData(lat, lon, radius);
      
      const result: Record<string, any> = {};

      result.ca_frap_facilities_count = facilities.length;
      result.ca_frap_facilities_all = facilities.map(facility => ({
        ...facility.attributes,
        facilityId: facility.facilityId,
        facilityStatus: facility.facilityStatus,
        name: facility.name,
        cadName: facility.cadName,
        aka: facility.aka,
        type: facility.type,
        unit: facility.unit,
        cdfUnit: facility.cdfUnit,
        county: facility.county,
        owner: facility.owner,
        funding: facility.funding,
        staffing: facility.staffing,
        address: facility.address,
        city: facility.city,
        zip: facility.zip,
        phoneNum: facility.phoneNum,
        latitude: facility.latitude,
        longitude: facility.longitude,
        geometry: facility.geometry,
        distance_miles: facility.distance_miles
      }));
      
      result.ca_frap_facilities_summary = `Found ${facilities.length} FRAP facility/facilities within ${radius} miles.`;
      
      console.log(`✅ CA FRAP Facilities data processed:`, {
        totalCount: result.ca_frap_facilities_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA FRAP Facilities data:', error);
      return {
        ca_frap_facilities_count: 0,
        ca_frap_facilities_all: []
      };
    }
  }

  private async getCASolarFootprints(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`☀️ Fetching CA Solar Footprints data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          ca_solar_footprints_count: 0,
          ca_solar_footprints_all: []
        };
      }
      
      const footprints = await getCASolarFootprintsData(lat, lon, radius);
      
      const result: Record<string, any> = {};

      result.ca_solar_footprints_count = footprints.length;
      result.ca_solar_footprints_all = footprints.map(footprint => ({
        ...footprint.attributes,
        footprintId: footprint.footprintId,
        countyName: footprint.countyName,
        acres: footprint.acres,
        type: footprint.type,
        urbanRural: footprint.urbanRural,
        combinedClass: footprint.combinedClass,
        distSubGTET100Miles: footprint.distSubGTET100Miles,
        percentileGTET100Miles: footprint.percentileGTET100Miles,
        nameSubGTET100: footprint.nameSubGTET100,
        hifldIdSubGTET100: footprint.hifldIdSubGTET100,
        distSubGTET200Miles: footprint.distSubGTET200Miles,
        percentileGTET200Miles: footprint.percentileGTET200Miles,
        nameSubGTET200: footprint.nameSubGTET200,
        hifldIdSubGTET200: footprint.hifldIdSubGTET200,
        distSubCAISOMiles: footprint.distSubCAISOMiles,
        percentileGTETCAISOMiles: footprint.percentileGTETCAISOMiles,
        nameSubCASIO: footprint.nameSubCASIO,
        hifldIdSubCAISO: footprint.hifldIdSubCAISO,
        solarTechnoeconomicIntersec: footprint.solarTechnoeconomicIntersec,
        shapeArea: footprint.shapeArea,
        shapeLength: footprint.shapeLength,
        geometry: footprint.geometry,
        distance_miles: footprint.distance_miles,
        isContaining: footprint.isContaining
      }));
      
      result.ca_solar_footprints_summary = `Found ${footprints.length} solar footprint(s) within ${radius} miles.`;
      
      console.log(`✅ CA Solar Footprints data processed:`, {
        totalCount: result.ca_solar_footprints_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Solar Footprints data:', error);
      return {
        ca_solar_footprints_count: 0,
        ca_solar_footprints_all: []
      };
    }
  }

  private async getCANaturalGasServiceAreas(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`⛽ Fetching CA Natural Gas Service Areas data for [${lat}, ${lon}]`);
      
      const serviceAreas = await getCANaturalGasServiceAreasData(lat, lon);
      
      const result: Record<string, any> = {};

      if (serviceAreas.length === 0) {
        result.ca_natural_gas_service_areas_containing = null;
        result.ca_natural_gas_service_areas_containing_message = 'No natural gas service area found containing this location';
        result.ca_natural_gas_service_areas_count = 0;
        result.ca_natural_gas_service_areas_all = [];
      } else {
        // Get the first containing service area (should typically be only one)
        const containingArea = serviceAreas[0];
        
        result.ca_natural_gas_service_areas_containing = containingArea.serviceAreaId || 'Unknown Service Area';
        result.ca_natural_gas_service_areas_containing_message = `Location is within natural gas service area: ${containingArea.serviceAreaId || 'Unknown'}`;
        result.ca_natural_gas_service_areas_count = serviceAreas.length;
        result.ca_natural_gas_service_areas_all = serviceAreas.map(area => ({
          ...area.attributes,
          serviceAreaId: area.serviceAreaId,
          geometry: area.geometry,
          isContaining: area.isContaining
        }));
      }
      
      console.log(`✅ CA Natural Gas Service Areas data processed:`, {
        totalCount: result.ca_natural_gas_service_areas_count,
        containing: result.ca_natural_gas_service_areas_containing
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Natural Gas Service Areas data:', error);
      return {
        ca_natural_gas_service_areas_containing: null,
        ca_natural_gas_service_areas_containing_message: 'Error querying natural gas service areas',
        ca_natural_gas_service_areas_count: 0,
        ca_natural_gas_service_areas_all: []
      };
    }
  }

  private async getCAPLSSSections(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🗺️ Fetching CA PLSS Sections data for [${lat}, ${lon}]`);
      
      const sections = await getCAPLSSSectionsData(lat, lon);
      
      const result: Record<string, any> = {};

      if (sections.length === 0) {
        result.ca_plss_sections_containing = null;
        result.ca_plss_sections_containing_message = 'No PLSS section found containing this location';
        result.ca_plss_sections_township = null;
        result.ca_plss_sections_range = null;
        result.ca_plss_sections_section = null;
        result.ca_plss_sections_meridian = null;
        result.ca_plss_sections_count = 0;
        result.ca_plss_sections_all = [];
      } else {
        // Get the first containing section (should typically be only one)
        const containingSection = sections[0];
        
        // Format Township and Range for summary form
        const township = containingSection.township || null;
        const range = containingSection.range || null;
        const section = containingSection.section || null;
        const meridian = containingSection.meridian || null;
        
        // Create formatted string for summary
        let plssString = '';
        if (township && range) {
          plssString = `T${township} R${range}`;
          if (section) {
            plssString += ` S${section}`;
          }
          if (meridian) {
            plssString += ` ${meridian}`;
          }
        } else {
          plssString = containingSection.sectionId || 'Unknown Section';
        }
        
        result.ca_plss_sections_containing = plssString;
        result.ca_plss_sections_containing_message = `Location is within PLSS section: ${plssString}`;
        result.ca_plss_sections_township = township;
        result.ca_plss_sections_range = range;
        result.ca_plss_sections_section = section;
        result.ca_plss_sections_meridian = meridian;
        result.ca_plss_sections_count = sections.length;
        result.ca_plss_sections_all = sections.map(sec => ({
          ...sec.attributes,
          sectionId: sec.sectionId,
          township: sec.township,
          range: sec.range,
          section: sec.section,
          meridian: sec.meridian,
          geometry: sec.geometry,
          isContaining: sec.isContaining
        }));
      }
      
      console.log(`✅ CA PLSS Sections data processed:`, {
        totalCount: result.ca_plss_sections_count,
        township: result.ca_plss_sections_township,
        range: result.ca_plss_sections_range,
        section: result.ca_plss_sections_section
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA PLSS Sections data:', error);
      return {
        ca_plss_sections_containing: null,
        ca_plss_sections_containing_message: 'Error querying PLSS sections',
        ca_plss_sections_township: null,
        ca_plss_sections_range: null,
        ca_plss_sections_section: null,
        ca_plss_sections_meridian: null,
        ca_plss_sections_count: 0,
        ca_plss_sections_all: []
      };
    }
  }

  private async getCAGeothermalWells(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🌋 Fetching CA Geothermal Wells data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          ca_geothermal_wells_count: 0,
          ca_geothermal_wells_all: []
        };
      }
      
      const wells = await getCAGeothermalWellsData(lat, lon, radius);
      
      const result: Record<string, any> = {};

      result.ca_geothermal_wells_count = wells.length;
      result.ca_geothermal_wells_all = wells.map(well => ({
        ...well.attributes,
        wellId: well.wellId,
        geometry: well.geometry,
        distance_miles: well.distance_miles
      }));
      
      result.ca_geothermal_wells_summary = `Found ${wells.length} geothermal well(s) within ${radius} miles.`;
      
      console.log(`✅ CA Geothermal Wells data processed:`, {
        totalCount: result.ca_geothermal_wells_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Geothermal Wells data:', error);
      return {
        ca_geothermal_wells_count: 0,
        ca_geothermal_wells_all: []
      };
    }
  }

  private async getCAOilGasWells(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🛢️ Fetching CA Oil and Gas Wells data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          ca_oil_gas_wells_count: 0,
          ca_oil_gas_wells_all: []
        };
      }
      
      const wells = await getCAOilGasWellsData(lat, lon, radius);
      
      const result: Record<string, any> = {};

      result.ca_oil_gas_wells_count = wells.length;
      result.ca_oil_gas_wells_all = wells.map(well => ({
        ...well.attributes,
        wellId: well.wellId,
        geometry: well.geometry,
        distance_miles: well.distance_miles
      }));
      
      result.ca_oil_gas_wells_summary = `Found ${wells.length} oil and gas well(s) within ${radius} miles.`;
      
      console.log(`✅ CA Oil and Gas Wells data processed:`, {
        totalCount: result.ca_oil_gas_wells_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Oil and Gas Wells data:', error);
      return {
        ca_oil_gas_wells_count: 0,
        ca_oil_gas_wells_all: []
      };
    }
  }

  private async getCAEcoRegions(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🌿 Fetching CA Eco Regions data for [${lat}, ${lon}]`);
      
      const regions = await getCAEcoRegionsData(lat, lon);
      
      const result: Record<string, any> = {};

      if (regions.length === 0) {
        result.ca_eco_regions_containing = null;
        result.ca_eco_regions_containing_message = 'No eco region found containing this location';
        result.ca_eco_regions_count = 0;
        result.ca_eco_regions_all = [];
      } else {
        // Get the first containing region (should typically be only one)
        const containingRegion = regions[0];
        
        // Extract common ecoregion fields
        const usL3Code = containingRegion.attributes.US_L3CODE || 
                        containingRegion.attributes.us_l3code ||
                        containingRegion.attributes.US_L3_CODE ||
                        null;
        
        const usL3Name = containingRegion.attributes.US_L3NAME || 
                        containingRegion.attributes.us_l3name ||
                        containingRegion.attributes.US_L3_NAME ||
                        null;
        
        const regionName = usL3Name || usL3Code || containingRegion.regionId || 'Unknown Region';
        
        result.ca_eco_regions_containing = regionName;
        result.ca_eco_regions_containing_message = `Location is within eco region: ${regionName}`;
        result.ca_eco_regions_us_l3_code = usL3Code;
        result.ca_eco_regions_us_l3_name = usL3Name;
        result.ca_eco_regions_count = regions.length;
        result.ca_eco_regions_all = regions.map(region => ({
          ...region.attributes,
          regionId: region.regionId,
          geometry: region.geometry,
          isContaining: region.isContaining
        }));
      }
      
      console.log(`✅ CA Eco Regions data processed:`, {
        totalCount: result.ca_eco_regions_count,
        containing: result.ca_eco_regions_containing
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Eco Regions data:', error);
      return {
        ca_eco_regions_containing: null,
        ca_eco_regions_containing_message: 'Error querying eco regions',
        ca_eco_regions_us_l3_code: null,
        ca_eco_regions_us_l3_name: null,
        ca_eco_regions_count: 0,
        ca_eco_regions_all: []
      };
    }
  }

  private async getCALosAngelesZoning(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏙️ Fetching City of Los Angeles Zoning data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const zones = await getCALosAngelesZoningData(lat, lon, radius);
      
      const result: Record<string, any> = {};

      if (zones.length === 0) {
        result.ca_la_zoning_containing = null;
        result.ca_la_zoning_containing_message = 'No zoning polygon found containing this location';
        result.ca_la_zoning_count = 0;
        result.ca_la_zoning_all = [];
      } else {
        // Get the first containing zone (should typically be only one for point-in-polygon)
        const containingZone = zones.find(z => z.isContaining) || zones[0];
        
        if (containingZone && containingZone.isContaining) {
          result.ca_la_zoning_containing = containingZone.zoningId || 'Unknown Zone';
          result.ca_la_zoning_containing_message = `Location is within zoning: ${containingZone.zoningId || 'Unknown'}`;
        } else {
          result.ca_la_zoning_containing = null;
          result.ca_la_zoning_containing_message = 'No zoning polygon found containing this location';
        }
        
        result.ca_la_zoning_count = zones.length;
        result.ca_la_zoning_all = zones.map(zone => ({
          ...zone.attributes,
          zoningId: zone.zoningId,
          geometry: zone.geometry,
          distance_miles: zone.distance_miles,
          isContaining: zone.isContaining
        }));
        
        result.ca_la_zoning_summary = `Found ${zones.length} zoning polygon(s)${radius ? ` within ${radius} miles` : ' containing the point'}.`;
      }
      
      console.log(`✅ City of Los Angeles Zoning data processed:`, {
        totalCount: result.ca_la_zoning_count,
        containing: result.ca_la_zoning_containing
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching City of Los Angeles Zoning data:', error);
      return {
        ca_la_zoning_containing: null,
        ca_la_zoning_containing_message: 'Error querying zoning polygons',
        ca_la_zoning_count: 0,
        ca_la_zoning_all: []
      };
    }
  }

  private async getLACountyArtsRecreation(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🎨 Fetching LA County Arts and Recreation data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          la_county_arts_recreation_count: 0,
          la_county_arts_recreation_all: []
        };
      }
      
      const pois = await getLACountyArtsRecreationData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      result.la_county_arts_recreation_count = pois.length;
      result.la_county_arts_recreation_all = pois.map(poi => ({
        ...poi.attributes,
        poiId: poi.poiId,
        geometry: poi.geometry,
        distance_miles: poi.distance_miles
      }));
      result.la_county_arts_recreation_summary = `Found ${pois.length} arts and recreation POI(s) within ${radius} miles.`;
      
      console.log(`✅ LA County Arts and Recreation data processed:`, {
        totalCount: result.la_county_arts_recreation_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching LA County Arts and Recreation data:', error);
      return {
        la_county_arts_recreation_count: 0,
        la_county_arts_recreation_all: []
      };
    }
  }

  private async getLACountyEducation(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🎓 Fetching LA County Education data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          la_county_education_count: 0,
          la_county_education_all: []
        };
      }
      
      const pois = await getLACountyEducationData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      result.la_county_education_count = pois.length;
      result.la_county_education_all = pois.map(poi => ({
        ...poi.attributes,
        poiId: poi.poiId,
        geometry: poi.geometry,
        distance_miles: poi.distance_miles
      }));
      result.la_county_education_summary = `Found ${pois.length} education POI(s) within ${radius} miles.`;
      
      console.log(`✅ LA County Education data processed:`, {
        totalCount: result.la_county_education_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching LA County Education data:', error);
      return {
        la_county_education_count: 0,
        la_county_education_all: []
      };
    }
  }

  private async getLACountyHospitals(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏥 Fetching LA County Hospitals data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          la_county_hospitals_count: 0,
          la_county_hospitals_all: []
        };
      }
      
      const pois = await getLACountyHospitalsData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      result.la_county_hospitals_count = pois.length;
      result.la_county_hospitals_all = pois.map(poi => ({
        ...poi.attributes,
        poiId: poi.poiId,
        geometry: poi.geometry,
        distance_miles: poi.distance_miles
      }));
      result.la_county_hospitals_summary = `Found ${pois.length} hospital(s) within ${radius} miles.`;
      
      console.log(`✅ LA County Hospitals data processed:`, {
        totalCount: result.la_county_hospitals_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching LA County Hospitals data:', error);
      return {
        la_county_hospitals_count: 0,
        la_county_hospitals_all: []
      };
    }
  }

  private async getLACountyMunicipalServices(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏛️ Fetching LA County Municipal Services data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          la_county_municipal_services_count: 0,
          la_county_municipal_services_all: []
        };
      }
      
      const pois = await getLACountyMunicipalServicesData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      result.la_county_municipal_services_count = pois.length;
      result.la_county_municipal_services_all = pois.map(poi => ({
        ...poi.attributes,
        poiId: poi.poiId,
        geometry: poi.geometry,
        distance_miles: poi.distance_miles
      }));
      result.la_county_municipal_services_summary = `Found ${pois.length} municipal service(s) within ${radius} miles.`;
      
      console.log(`✅ LA County Municipal Services data processed:`, {
        totalCount: result.la_county_municipal_services_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching LA County Municipal Services data:', error);
      return {
        la_county_municipal_services_count: 0,
        la_county_municipal_services_all: []
      };
    }
  }

  private async getLACountyPhysicalFeatures(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏔️ Fetching LA County Physical Features data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          la_county_physical_features_count: 0,
          la_county_physical_features_all: []
        };
      }
      
      const pois = await getLACountyPhysicalFeaturesData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      result.la_county_physical_features_count = pois.length;
      result.la_county_physical_features_all = pois.map(poi => ({
        ...poi.attributes,
        poiId: poi.poiId,
        geometry: poi.geometry,
        distance_miles: poi.distance_miles
      }));
      result.la_county_physical_features_summary = `Found ${pois.length} physical feature(s) within ${radius} miles.`;
      
      console.log(`✅ LA County Physical Features data processed:`, {
        totalCount: result.la_county_physical_features_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching LA County Physical Features data:', error);
      return {
        la_county_physical_features_count: 0,
        la_county_physical_features_all: []
      };
    }
  }

  private async getLACountyPublicSafety(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🚨 Fetching LA County Public Safety data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          la_county_public_safety_count: 0,
          la_county_public_safety_all: []
        };
      }
      
      const pois = await getLACountyPublicSafetyData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      result.la_county_public_safety_count = pois.length;
      result.la_county_public_safety_all = pois.map(poi => ({
        ...poi.attributes,
        poiId: poi.poiId,
        geometry: poi.geometry,
        distance_miles: poi.distance_miles
      }));
      result.la_county_public_safety_summary = `Found ${pois.length} public safety POI(s) within ${radius} miles.`;
      
      console.log(`✅ LA County Public Safety data processed:`, {
        totalCount: result.la_county_public_safety_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching LA County Public Safety data:', error);
      return {
        la_county_public_safety_count: 0,
        la_county_public_safety_all: []
      };
    }
  }

  private async getLACountyTransportation(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🚌 Fetching LA County Transportation data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          la_county_transportation_count: 0,
          la_county_transportation_all: []
        };
      }
      
      const pois = await getLACountyTransportationData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      result.la_county_transportation_count = pois.length;
      result.la_county_transportation_all = pois.map(poi => ({
        ...poi.attributes,
        poiId: poi.poiId,
        geometry: poi.geometry,
        distance_miles: poi.distance_miles
      }));
      result.la_county_transportation_summary = `Found ${pois.length} transportation POI(s) within ${radius} miles.`;
      
      console.log(`✅ LA County Transportation data processed:`, {
        totalCount: result.la_county_transportation_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching LA County Transportation data:', error);
      return {
        la_county_transportation_count: 0,
        la_county_transportation_all: []
      };
    }
  }

  private async getLACountyHistoricCulturalMonuments(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏛️ Fetching LA County Historic Cultural Monuments data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const monuments = await getLACountyHistoricCulturalMonumentsData(lat, lon, radius);
      
      const result: Record<string, any> = {};

      if (monuments.length === 0) {
        result.la_county_historic_cultural_monuments_containing = null;
        result.la_county_historic_cultural_monuments_containing_message = 'No historic cultural monument found containing this location';
        result.la_county_historic_cultural_monuments_count = 0;
        result.la_county_historic_cultural_monuments_all = [];
      } else {
        // Get the first containing monument (should typically be only one for point-in-polygon)
        const containingMonument = monuments.find(m => m.isContaining) || monuments[0];
        
        if (containingMonument && containingMonument.isContaining) {
          result.la_county_historic_cultural_monuments_containing = containingMonument.name || containingMonument.monumentId || 'Unknown Monument';
          result.la_county_historic_cultural_monuments_containing_message = `Location is within historic cultural monument: ${containingMonument.name || containingMonument.monumentId || 'Unknown'}`;
        } else {
          result.la_county_historic_cultural_monuments_containing = null;
          result.la_county_historic_cultural_monuments_containing_message = 'No historic cultural monument found containing this location';
        }
        
        result.la_county_historic_cultural_monuments_count = monuments.length;
        result.la_county_historic_cultural_monuments_all = monuments.map(monument => ({
          ...monument.attributes,
          monumentId: monument.monumentId,
          histType: monument.histType,
          mntType: monument.mntType,
          mntNum: monument.mntNum,
          name: monument.name,
          location: monument.location,
          dateActive: monument.dateActive,
          notes: monument.notes,
          shapeArea: monument.shapeArea,
          shapeLength: monument.shapeLength,
          geometry: monument.geometry,
          distance_miles: monument.distance_miles,
          isContaining: monument.isContaining
        }));
        
        result.la_county_historic_cultural_monuments_summary = `Found ${monuments.length} historic cultural monument(s)${radius ? ` within ${radius} miles` : ' containing the point'}.`;
      }
      
      console.log(`✅ LA County Historic Cultural Monuments data processed:`, {
        totalCount: result.la_county_historic_cultural_monuments_count,
        containing: result.la_county_historic_cultural_monuments_containing
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching LA County Historic Cultural Monuments data:', error);
      return {
        la_county_historic_cultural_monuments_containing: null,
        la_county_historic_cultural_monuments_containing_message: 'Error querying historic cultural monuments',
        la_county_historic_cultural_monuments_count: 0,
        la_county_historic_cultural_monuments_all: []
      };
    }
  }

  private async getLACountyHousingLeadRisk(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏠 Fetching LA County Housing with Potential Lead Risk data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const housingAreas = await getLACountyHousingLeadRiskData(lat, lon, radius);
      
      const result: Record<string, any> = {};

      if (housingAreas.length === 0) {
        result.la_county_housing_lead_risk_containing = null;
        result.la_county_housing_lead_risk_containing_message = 'No housing lead risk area found containing this location';
        result.la_county_housing_lead_risk_count = 0;
        result.la_county_housing_lead_risk_all = [];
      } else {
        // Get the first containing area (should typically be only one for point-in-polygon)
        const containingArea = housingAreas.find(a => a.isContaining) || housingAreas[0];
        
        if (containingArea && containingArea.isContaining) {
          result.la_county_housing_lead_risk_containing = containingArea.ct20 || containingArea.housingId || 'Unknown Area';
          result.la_county_housing_lead_risk_containing_message = `Location is within housing lead risk area: Census Tract ${containingArea.ct20 || containingArea.housingId || 'Unknown'} (Risk: ${containingArea.housingRisk !== null ? containingArea.housingRisk.toFixed(1) : 'N/A'}%)`;
        } else {
          result.la_county_housing_lead_risk_containing = null;
          result.la_county_housing_lead_risk_containing_message = 'No housing lead risk area found containing this location';
        }
        
        result.la_county_housing_lead_risk_count = housingAreas.length;
        result.la_county_housing_lead_risk_all = housingAreas.map(area => ({
          ...area.attributes,
          housingId: area.housingId,
          ct20: area.ct20,
          housingRisk: area.housingRisk,
          laCity: area.laCity,
          shapeArea: area.shapeArea,
          shapeLength: area.shapeLength,
          geometry: area.geometry,
          distance_miles: area.distance_miles,
          isContaining: area.isContaining
        }));
        
        result.la_county_housing_lead_risk_summary = `Found ${housingAreas.length} housing lead risk area(s)${radius ? ` within ${radius} miles` : ' containing the point'}.`;
      }
      
      console.log(`✅ LA County Housing Lead Risk data processed:`, {
        totalCount: result.la_county_housing_lead_risk_count,
        containing: result.la_county_housing_lead_risk_containing
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching LA County Housing with Potential Lead Risk data:', error);
      return {
        la_county_housing_lead_risk_containing: null,
        la_county_housing_lead_risk_containing_message: 'Error querying housing lead risk areas',
        la_county_housing_lead_risk_count: 0,
        la_county_housing_lead_risk_all: []
      };
    }
  }

  private async getLACountySchoolDistrictBoundaries(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      console.log(`🏫 Fetching LA County School District Boundaries data for [${lat}, ${lon}]`);
      
      const districts = await getLACountySchoolDistrictBoundariesData(lat, lon);
      
      const result: Record<string, any> = {};

      if (districts.length === 0) {
        result.la_county_school_district_boundaries_containing = null;
        result.la_county_school_district_boundaries_containing_message = 'No school district boundary found containing this location';
        result.la_county_school_district_boundaries_count = 0;
        result.la_county_school_district_boundaries_all = [];
      } else {
        // Get the first containing district (should typically be only one for point-in-polygon)
        const containingDistrict = districts.find(d => d.isContaining) || districts[0];
        
        if (containingDistrict && containingDistrict.isContaining) {
          result.la_county_school_district_boundaries_containing = containingDistrict.districtName || containingDistrict.districtCode || containingDistrict.districtId || 'Unknown District';
          result.la_county_school_district_boundaries_containing_message = `Location is within school district: ${containingDistrict.districtName || containingDistrict.districtCode || containingDistrict.districtId || 'Unknown'}`;
        } else {
          result.la_county_school_district_boundaries_containing = null;
          result.la_county_school_district_boundaries_containing_message = 'No school district boundary found containing this location';
        }
        
        result.la_county_school_district_boundaries_count = districts.length;
        result.la_county_school_district_boundaries_all = districts.map(district => ({
          ...district.attributes,
          districtId: district.districtId,
          districtName: district.districtName,
          districtCode: district.districtCode,
          districtType: district.districtType,
          shapeArea: district.shapeArea,
          shapeLength: district.shapeLength,
          geometry: district.geometry,
          isContaining: district.isContaining
        }));
        
        result.la_county_school_district_boundaries_summary = `Found ${districts.length} school district boundary(ies) containing the point.`;
      }
      
      console.log(`✅ LA County School District Boundaries data processed:`, {
        totalCount: result.la_county_school_district_boundaries_count,
        containing: result.la_county_school_district_boundaries_containing
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching LA County School District Boundaries data:', error);
      return {
        la_county_school_district_boundaries_containing: null,
        la_county_school_district_boundaries_containing_message: 'Error querying school district boundaries',
        la_county_school_district_boundaries_count: 0,
        la_county_school_district_boundaries_all: []
      };
    }
  }

  private async getLACountyMetroLines(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🚇 Fetching LA County MTA Metro Lines data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          la_county_metro_lines_count: 0,
          la_county_metro_lines_all: []
        };
      }
      
      const lines = await getLACountyMetroLinesData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      result.la_county_metro_lines_count = lines.length;
      result.la_county_metro_lines_all = lines.map(line => ({
        ...line.attributes,
        lineId: line.lineId,
        name: line.name,
        label: line.label,
        status: line.status,
        type: line.type,
        shapeLength: line.shapeLength,
        geometry: line.geometry,
        distance_miles: line.distance_miles
      }));
      result.la_county_metro_lines_summary = `Found ${lines.length} metro line(s) within ${radius} miles.`;
      
      console.log(`✅ LA County Metro Lines data processed:`, {
        totalCount: result.la_county_metro_lines_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching LA County MTA Metro Lines data:', error);
      return {
        la_county_metro_lines_count: 0,
        la_county_metro_lines_all: []
      };
    }
  }

  private async getCAStateParksEntryPoints(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏞️ Fetching CA State Parks Entry Points data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          ca_state_parks_entry_points_count: 0,
          ca_state_parks_entry_points_all: []
        };
      }
      
      const entryPoints = await getCAStateParksEntryPointsData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      result.ca_state_parks_entry_points_count = entryPoints.length;
      result.ca_state_parks_entry_points_all = entryPoints.map(entryPoint => ({
        ...entryPoint.attributes,
        entryPointId: entryPoint.entryPointId,
        parkUnitName: entryPoint.parkUnitName,
        streetAddress: entryPoint.streetAddress,
        city: entryPoint.city,
        zipCode: entryPoint.zipCode,
        phone: entryPoint.phone,
        website: entryPoint.website,
        distance_miles: entryPoint.distance_miles || 0,
        geometry: entryPoint.geometry
      }));
      
      console.log(`✅ CA State Parks Entry Points data processed:`, {
        totalCount: result.ca_state_parks_entry_points_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA State Parks Entry Points data:', error);
      return {
        ca_state_parks_entry_points_count: 0,
        ca_state_parks_entry_points_all: []
      };
    }
  }

  private async getCAStateParksParkingLots(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🅿️ Fetching CA State Parks Parking Lots data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          ca_state_parks_parking_lots_count: 0,
          ca_state_parks_parking_lots_all: []
        };
      }
      
      const parkingLots = await getCAStateParksParkingLotsData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      result.ca_state_parks_parking_lots_count = parkingLots.length;
      result.ca_state_parks_parking_lots_all = parkingLots.map(parkingLot => ({
        ...parkingLot.attributes,
        parkingLotId: parkingLot.parkingLotId,
        name: parkingLot.name,
        gisId: parkingLot.gisId,
        type: parkingLot.type,
        subType: parkingLot.subType,
        unitNbr: parkingLot.unitNbr,
        useType: parkingLot.useType,
        unitName: parkingLot.unitName,
        trailhead: parkingLot.trailhead,
        share: parkingLot.share,
        distance_miles: parkingLot.distance_miles || 0,
        geometry: parkingLot.geometry
      }));
      
      console.log(`✅ CA State Parks Parking Lots data processed:`, {
        totalCount: result.ca_state_parks_parking_lots_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA State Parks Parking Lots data:', error);
      return {
        ca_state_parks_parking_lots_count: 0,
        ca_state_parks_parking_lots_all: []
      };
    }
  }

  private async getCAStateParksBoundaries(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏞️ Fetching CA State Parks Boundaries data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const boundaries = await getCAStateParksBoundariesData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      if (boundaries.length === 0) {
        result.ca_state_parks_boundaries_containing = null;
        result.ca_state_parks_boundaries_containing_message = 'No state park boundary found containing this location';
        result.ca_state_parks_boundaries_count = 0;
        result.ca_state_parks_boundaries_all = [];
        return result;
      }
      
      // Find containing boundary (distance = 0)
      const containingBoundary = boundaries.find(b => b.distance_miles === 0);
      
      if (containingBoundary) {
        result.ca_state_parks_boundaries_containing = containingBoundary.unitName || 
                                                      containingBoundary.boundaryId || 
                                                      'State Park';
        result.ca_state_parks_boundaries_containing_message = `Location is within: ${result.ca_state_parks_boundaries_containing}`;
        
        if (containingBoundary.unitName) {
          result.ca_state_parks_boundaries_containing_unit_name = containingBoundary.unitName;
        }
        if (containingBoundary.gisId) {
          result.ca_state_parks_boundaries_containing_gis_id = containingBoundary.gisId;
        }
        if (containingBoundary.subType) {
          result.ca_state_parks_boundaries_containing_sub_type = containingBoundary.subType;
        }
        if (containingBoundary.unitNbr) {
          result.ca_state_parks_boundaries_containing_unit_nbr = containingBoundary.unitNbr;
        }
      } else {
        result.ca_state_parks_boundaries_containing = null;
        result.ca_state_parks_boundaries_containing_message = 'No state park boundary found containing this location';
      }
      
      // Set count and all array
      result.ca_state_parks_boundaries_count = boundaries.length;
      result.ca_state_parks_boundaries_all = boundaries.map(boundary => ({
        ...boundary.attributes,
        boundaryId: boundary.boundaryId,
        unitName: boundary.unitName,
        gisId: boundary.gisId,
        subType: boundary.subType,
        unitNbr: boundary.unitNbr,
        isContaining: boundary.distance_miles === 0,
        distance_miles: boundary.distance_miles || 0,
        geometry: boundary.geometry
      }));
      
      console.log(`✅ CA State Parks Boundaries data processed:`, {
        containing: result.ca_state_parks_boundaries_containing || 'N/A',
        totalCount: result.ca_state_parks_boundaries_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA State Parks Boundaries data:', error);
      return {
        ca_state_parks_boundaries_containing: null,
        ca_state_parks_boundaries_containing_message: 'Error fetching CA State Parks Boundaries data',
        ca_state_parks_boundaries_count: 0,
        ca_state_parks_boundaries_all: []
      };
    }
  }

  private async getCAStateParksCampgrounds(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`⛺ Fetching CA State Parks Campgrounds data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          ca_state_parks_campgrounds_count: 0,
          ca_state_parks_campgrounds_all: []
        };
      }
      
      const campgrounds = await getCAStateParksCampgroundsData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      result.ca_state_parks_campgrounds_count = campgrounds.length;
      result.ca_state_parks_campgrounds_all = campgrounds.map(campground => ({
        ...campground.attributes,
        campgroundId: campground.campgroundId,
        name: campground.name,
        gisId: campground.gisId,
        type: campground.type,
        subType: campground.subType,
        unitNbr: campground.unitNbr,
        useType: campground.useType,
        unitName: campground.unitName,
        distance_miles: campground.distance_miles || 0,
        geometry: campground.geometry
      }));
      
      console.log(`✅ CA State Parks Campgrounds data processed:`, {
        totalCount: result.ca_state_parks_campgrounds_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA State Parks Campgrounds data:', error);
      return {
        ca_state_parks_campgrounds_count: 0,
        ca_state_parks_campgrounds_all: []
      };
    }
  }

  private async getCAStateParksRecreationalRoutes(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🛤️ Fetching CA State Parks Recreational Routes data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          ca_state_parks_recreational_routes_count: 0,
          ca_state_parks_recreational_routes_all: []
        };
      }
      
      const routes = await getCAStateParksRecreationalRoutesData(lat, lon, radius);
      
      const result: Record<string, any> = {};

      result.ca_state_parks_recreational_routes_count = routes.length;
      result.ca_state_parks_recreational_routes_all = routes.map(route => ({
        ...route.attributes,
        routeId: route.routeId,
        routeName: route.routeName,
        gisId: route.gisId,
        routeClass: route.routeClass,
        routeCategory: route.routeCategory,
        routeType: route.routeType,
        unitNbr: route.unitNbr,
        unitName: route.unitName,
        segmentLength: route.segmentLength,
        share: route.share,
        routeDescription: route.routeDescription,
        trailDescription: route.trailDescription,
        geometry: route.geometry,
        distance_miles: route.distance_miles
      }));
      
      result.ca_state_parks_recreational_routes_summary = `Found ${routes.length} recreational route(s) within ${radius} miles.`;
      
      console.log(`✅ CA State Parks Recreational Routes data processed:`, {
        totalCount: result.ca_state_parks_recreational_routes_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA State Parks Recreational Routes data:', error);
      return {
        ca_state_parks_recreational_routes_count: 0,
        ca_state_parks_recreational_routes_all: []
      };
    }
  }

  // CA Condor Range (CDFW BIOS) - Point-in-polygon and proximity query
  private async getCACondorRange(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🦅 Fetching CA Condor Range data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const ranges = await getCACondorRangeData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      result.ca_condor_range_count = ranges.length;
      result.ca_condor_range_all = ranges.map(range => ({
        ...range.attributes,
        rangeId: range.rangeId,
        shapeName: range.shapeName,
        commonName: range.commonName,
        scientificName: range.scientificName,
        symbol: range.symbol,
        occYears: range.occYears,
        rangeStart: range.rangeStart,
        rangeEnd: range.rangeEnd,
        distance_miles: range.distance_miles,
        geometry: range.geometry
      }));
      
      // Point-in-polygon result (distance_miles === 0)
      const containingRange = ranges.find(r => r.distance_miles === 0);
      if (containingRange) {
        result.ca_condor_range = containingRange.shapeName || containingRange.commonName || 'California Condor Range';
        result.ca_condor_range_symbol = containingRange.symbol || null;
        result.ca_condor_range_occ_years = containingRange.occYears || null;
      }
      
      console.log(`✅ CA Condor Range data processed:`, {
        totalCount: result.ca_condor_range_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Condor Range data:', error);
      return {
        ca_condor_range_count: 0,
        ca_condor_range_all: []
      };
    }
  }

  private async getCABlackBearRange(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🐻 Fetching CA Black Bear Range data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const ranges = await getCABlackBearRangeData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      result.ca_black_bear_range_count = ranges.length;
      result.ca_black_bear_range_all = ranges.map(range => ({
        ...range.attributes,
        rangeId: range.rangeId,
        shapeName: range.shapeName,
        commonName: range.commonName,
        scientificName: range.scientificName,
        symbol: range.symbol,
        occYears: range.occYears,
        rangeStart: range.rangeStart,
        rangeEnd: range.rangeEnd,
        distance_miles: range.distance_miles,
        geometry: range.geometry
      }));
      
      // Point-in-polygon result (distance_miles === 0)
      const containingRange = ranges.find(r => r.distance_miles === 0);
      if (containingRange) {
        result.ca_black_bear_range = containingRange.shapeName || containingRange.commonName || 'California Black Bear Range';
        result.ca_black_bear_range_symbol = containingRange.symbol || null;
        result.ca_black_bear_range_occ_years = containingRange.occYears || null;
      }
      
      console.log(`✅ CA Black Bear Range data processed:`, {
        totalCount: result.ca_black_bear_range_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Black Bear Range data:', error);
      return {
        ca_black_bear_range_count: 0,
        ca_black_bear_range_all: []
      };
    }
  }

  private async getCABrushRabbitRange(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🐰 Fetching CA Brush Rabbit Range data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const ranges = await getCABrushRabbitRangeData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      result.ca_brush_rabbit_range_count = ranges.length;
      result.ca_brush_rabbit_range_all = ranges.map(range => ({
        ...range.attributes,
        rangeId: range.rangeId,
        shapeName: range.shapeName,
        commonName: range.commonName,
        scientificName: range.scientificName,
        symbol: range.symbol,
        occYears: range.occYears,
        rangeStart: range.rangeStart,
        rangeEnd: range.rangeEnd,
        distance_miles: range.distance_miles,
        geometry: range.geometry
      }));
      
      // Point-in-polygon result (distance_miles === 0)
      const containingRange = ranges.find(r => r.distance_miles === 0);
      if (containingRange) {
        result.ca_brush_rabbit_range = containingRange.shapeName || containingRange.commonName || 'California Brush Rabbit Range';
        result.ca_brush_rabbit_range_symbol = containingRange.symbol || null;
        result.ca_brush_rabbit_range_occ_years = containingRange.occYears || null;
      }
      
      console.log(`✅ CA Brush Rabbit Range data processed:`, {
        totalCount: result.ca_brush_rabbit_range_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Brush Rabbit Range data:', error);
      return {
        ca_brush_rabbit_range_count: 0,
        ca_brush_rabbit_range_all: []
      };
    }
  }

  private async getCAGreatGrayOwlRange(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🦉 Fetching CA Great Gray Owl Range data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const ranges = await getCAGreatGrayOwlRangeData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      result.ca_great_gray_owl_range_count = ranges.length;
      result.ca_great_gray_owl_range_all = ranges.map(range => ({
        ...range.attributes,
        rangeId: range.rangeId,
        shapeName: range.shapeName,
        commonName: range.commonName,
        scientificName: range.scientificName,
        symbol: range.symbol,
        occYears: range.occYears,
        rangeStart: range.rangeStart,
        rangeEnd: range.rangeEnd,
        distance_miles: range.distance_miles,
        geometry: range.geometry
      }));
      
      // Point-in-polygon result (distance_miles === 0)
      const containingRange = ranges.find(r => r.distance_miles === 0);
      if (containingRange) {
        result.ca_great_gray_owl_range = containingRange.shapeName || containingRange.commonName || 'California Great Gray Owl Range';
        result.ca_great_gray_owl_range_symbol = containingRange.symbol || null;
        result.ca_great_gray_owl_range_occ_years = containingRange.occYears || null;
      }
      
      console.log(`✅ CA Great Gray Owl Range data processed:`, {
        totalCount: result.ca_great_gray_owl_range_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Great Gray Owl Range data:', error);
      return {
        ca_great_gray_owl_range_count: 0,
        ca_great_gray_owl_range_all: []
      };
    }
  }

  private async getCASandhillCraneRange(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🦩 Fetching CA Sandhill Crane Range data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const ranges = await getCASandhillCraneRangeData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      result.ca_sandhill_crane_range_count = ranges.length;
      result.ca_sandhill_crane_range_all = ranges.map(range => ({
        ...range.attributes,
        rangeId: range.rangeId,
        shapeName: range.shapeName,
        commonName: range.commonName,
        scientificName: range.scientificName,
        symbol: range.symbol,
        occYears: range.occYears,
        rangeStart: range.rangeStart,
        rangeEnd: range.rangeEnd,
        distance_miles: range.distance_miles,
        geometry: range.geometry
      }));
      
      // Point-in-polygon result (distance_miles === 0)
      const containingRange = ranges.find(r => r.distance_miles === 0);
      if (containingRange) {
        result.ca_sandhill_crane_range = containingRange.shapeName || containingRange.commonName || 'California Sandhill Crane Range';
        result.ca_sandhill_crane_range_symbol = containingRange.symbol || null;
        result.ca_sandhill_crane_range_occ_years = containingRange.occYears || null;
      }
      
      console.log(`✅ CA Sandhill Crane Range data processed:`, {
        totalCount: result.ca_sandhill_crane_range_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Sandhill Crane Range data:', error);
      return {
        ca_sandhill_crane_range_count: 0,
        ca_sandhill_crane_range_all: []
      };
    }
  }

  private async getCAHighwayRestAreas(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🚗 Fetching CA Highway Rest Areas data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const restAreas = await getCAHighwayRestAreasData(lat, lon, radius);
      
      const result: Record<string, any> = {};
      
      result.ca_highway_rest_areas_count = restAreas.length;
      result.ca_highway_rest_areas_all = restAreas.map(restArea => ({
        ...restArea.attributes,
        restAreaId: restArea.restAreaId,
        name: restArea.name,
        route: restArea.route,
        direction: restArea.direction,
        county: restArea.county,
        city: restArea.city,
        amenities: restArea.amenities,
        distance_miles: restArea.distance_miles,
        geometry: restArea.geometry
      }));
      
      console.log(`✅ CA Highway Rest Areas data processed:`, {
        totalCount: result.ca_highway_rest_areas_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Highway Rest Areas data:', error);
      return {
        ca_highway_rest_areas_count: 0,
        ca_highway_rest_areas_all: []
      };
    }
  }

  private async getCAMarineOilTerminals(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🛢️ Fetching CA Marine Oil Terminals data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      if (!radius || radius <= 0) {
        return {
          ca_marine_oil_terminals_count: 0,
          ca_marine_oil_terminals_all: []
        };
      }
      
      const terminals = await getCAMarineOilTerminalsData(lat, lon, radius);
      
      const result: Record<string, any> = {};

      result.ca_marine_oil_terminals_count = terminals.length;
      result.ca_marine_oil_terminals_all = terminals.map(terminal => ({
        ...terminal.attributes,
        terminalId: terminal.terminalId,
        terminalName: terminal.terminalName,
        wo: terminal.wo,
        woBerthId: terminal.woBerthId,
        city: terminal.city,
        county: terminal.county,
        displayName: terminal.displayName,
        latitude: terminal.latitude,
        longitude: terminal.longitude,
        geometry: terminal.geometry,
        distance_miles: terminal.distance_miles
      }));
      
      result.ca_marine_oil_terminals_summary = `Found ${terminals.length} marine oil terminal(s) within ${radius} miles.`;
      
      console.log(`✅ CA Marine Oil Terminals data processed:`, {
        totalCount: result.ca_marine_oil_terminals_count
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CA Marine Oil Terminals data:', error);
      return {
        ca_marine_oil_terminals_count: 0,
        ca_marine_oil_terminals_all: []
      };
    }
  }

  private async getDEStateForest(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🌲 Fetching DE State Forest data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 0;
      
      const forestData = await getDEStateForestData(lat, lon, radiusMiles);
      
      if (forestData) {
        const allFeatures: any[] = [];
        
        if (forestData.containingFeature) {
          allFeatures.push({
            ...forestData.containingFeature.attributes,
            isContaining: true,
            distance_miles: 0,
            geometry: forestData.containingFeature.geometry
          });
          result.de_state_forest_containing = true;
        } else {
          result.de_state_forest_containing = false;
        }
        
        if (forestData.nearbyFeatures && forestData.nearbyFeatures.length > 0) {
          forestData.nearbyFeatures.forEach(feature => {
            allFeatures.push({
              ...feature.attributes,
              isContaining: false,
              distance_miles: feature.distance_miles,
              geometry: feature.geometry
            });
          });
          result.de_state_forest_nearby_count = forestData.nearbyFeatures.length;
        } else {
          result.de_state_forest_nearby_count = 0;
        }
        
        result.de_state_forest_all = allFeatures;
        result.de_state_forest_count = allFeatures.length;
        if (radiusMiles > 0) {
          result.de_state_forest_search_radius_miles = radiusMiles;
        }
      } else {
        result.de_state_forest_count = 0;
        result.de_state_forest_all = [];
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE State Forest:', error);
      return {
        de_state_forest_count: 0,
        de_state_forest_all: [],
        de_state_forest_error: 'Error fetching DE State Forest data'
      };
    }
  }

  private async getDEPinePlantations(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🌲 Fetching DE Pine Plantations data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 0;
      
      const plantationData = await getDEPinePlantationData(lat, lon, radiusMiles);
      
      if (plantationData) {
        const allFeatures: any[] = [];
        
        if (plantationData.containingFeature) {
          allFeatures.push({
            ...plantationData.containingFeature.attributes,
            isContaining: true,
            distance_miles: 0,
            geometry: plantationData.containingFeature.geometry
          });
          result.de_pine_plantations_containing = true;
        } else {
          result.de_pine_plantations_containing = false;
        }
        
        if (plantationData.nearbyFeatures && plantationData.nearbyFeatures.length > 0) {
          plantationData.nearbyFeatures.forEach(feature => {
            allFeatures.push({
              ...feature.attributes,
              isContaining: false,
              distance_miles: feature.distance_miles,
              geometry: feature.geometry
            });
          });
          result.de_pine_plantations_nearby_count = plantationData.nearbyFeatures.length;
        } else {
          result.de_pine_plantations_nearby_count = 0;
        }
        
        result.de_pine_plantations_all = allFeatures;
        result.de_pine_plantations_count = allFeatures.length;
        if (radiusMiles > 0) {
          result.de_pine_plantations_search_radius_miles = radiusMiles;
        }
      } else {
        result.de_pine_plantations_count = 0;
        result.de_pine_plantations_all = [];
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Pine Plantations:', error);
      return {
        de_pine_plantations_count: 0,
        de_pine_plantations_all: [],
        de_pine_plantations_error: 'Error fetching DE Pine Plantations data'
      };
    }
  }

  private async getDEUrbanTreeCanopy(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🌳 Fetching DE Urban Tree Canopy data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 0;
      
      const canopyData = await getDEUrbanTreeCanopyData(lat, lon, radiusMiles);
      
      if (canopyData) {
        const allFeatures: any[] = [];
        
        if (canopyData.containingFeature) {
          allFeatures.push({
            ...canopyData.containingFeature.attributes,
            isContaining: true,
            distance_miles: 0,
            geometry: canopyData.containingFeature.geometry
          });
          result.de_urban_tree_canopy_containing = true;
        } else {
          result.de_urban_tree_canopy_containing = false;
        }
        
        if (canopyData.nearbyFeatures && canopyData.nearbyFeatures.length > 0) {
          canopyData.nearbyFeatures.forEach(feature => {
            allFeatures.push({
              ...feature.attributes,
              isContaining: false,
              distance_miles: feature.distance_miles,
              geometry: feature.geometry
            });
          });
          result.de_urban_tree_canopy_nearby_count = canopyData.nearbyFeatures.length;
        } else {
          result.de_urban_tree_canopy_nearby_count = 0;
        }
        
        result.de_urban_tree_canopy_all = allFeatures;
        result.de_urban_tree_canopy_count = allFeatures.length;
        if (radiusMiles > 0) {
          result.de_urban_tree_canopy_search_radius_miles = radiusMiles;
        }
      } else {
        result.de_urban_tree_canopy_count = 0;
        result.de_urban_tree_canopy_all = [];
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Urban Tree Canopy:', error);
      return {
        de_urban_tree_canopy_count: 0,
        de_urban_tree_canopy_all: [],
        de_urban_tree_canopy_error: 'Error fetching DE Urban Tree Canopy data'
      };
    }
  }

  private async getDEForestCover2007(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🌲 Fetching DE Forest Cover 2007 data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 0;
      
      const forestData = await getDEForestCover2007Data(lat, lon, radiusMiles);
      
      if (forestData) {
        const allFeatures: any[] = [];
        
        if (forestData.containingFeature) {
          allFeatures.push({
            ...forestData.containingFeature.attributes,
            isContaining: true,
            distance_miles: 0,
            geometry: forestData.containingFeature.geometry
          });
          result.de_forest_cover_2007_containing = true;
        } else {
          result.de_forest_cover_2007_containing = false;
        }
        
        if (forestData.nearbyFeatures && forestData.nearbyFeatures.length > 0) {
          forestData.nearbyFeatures.forEach(feature => {
            allFeatures.push({
              ...feature.attributes,
              isContaining: false,
              distance_miles: feature.distance_miles,
              geometry: feature.geometry
            });
          });
          result.de_forest_cover_2007_nearby_count = forestData.nearbyFeatures.length;
        } else {
          result.de_forest_cover_2007_nearby_count = 0;
        }
        
        result.de_forest_cover_2007_all = allFeatures;
        result.de_forest_cover_2007_count = allFeatures.length;
        if (radiusMiles > 0) {
          result.de_forest_cover_2007_search_radius_miles = radiusMiles;
        }
      } else {
        result.de_forest_cover_2007_count = 0;
        result.de_forest_cover_2007_all = [];
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Forest Cover 2007:', error);
      return {
        de_forest_cover_2007_count: 0,
        de_forest_cover_2007_all: [],
        de_forest_cover_2007_error: 'Error fetching DE Forest Cover 2007 data'
      };
    }
  }

  private async getDENoBuildPointsBay(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 5;
      const data = await getDENoBuildPointsBayData(lat, lon, radiusMiles);
      return {
        de_no_build_points_bay_all: data.map(f => ({ ...f.attributes, distance_miles: f.distance_miles, geometry: f.geometry })),
        de_no_build_points_bay_count: data.length,
        de_no_build_points_bay_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE No Build Points Bay:', error);
      return { de_no_build_points_bay_count: 0, de_no_build_points_bay_all: [] };
    }
  }

  private async getDENoBuildLineBay(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 5;
      const data = await getDENoBuildLineBayData(lat, lon, radiusMiles);
      return {
        de_no_build_line_bay_all: data.map(f => ({ ...f.attributes, distance_miles: f.distance_miles, geometry: f.geometry })),
        de_no_build_line_bay_count: data.length,
        de_no_build_line_bay_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE No Build Line Bay:', error);
      return { de_no_build_line_bay_count: 0, de_no_build_line_bay_all: [] };
    }
  }

  private async getDENoBuildPointsOcean(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 5;
      const data = await getDENoBuildPointsOceanData(lat, lon, radiusMiles);
      return {
        de_no_build_points_ocean_all: data.map(f => ({ ...f.attributes, distance_miles: f.distance_miles, geometry: f.geometry })),
        de_no_build_points_ocean_count: data.length,
        de_no_build_points_ocean_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE No Build Points Ocean:', error);
      return { de_no_build_points_ocean_count: 0, de_no_build_points_ocean_all: [] };
    }
  }

  private async getDENoBuildLineOcean(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 5;
      const data = await getDENoBuildLineOceanData(lat, lon, radiusMiles);
      return {
        de_no_build_line_ocean_all: data.map(f => ({ ...f.attributes, distance_miles: f.distance_miles, geometry: f.geometry })),
        de_no_build_line_ocean_count: data.length,
        de_no_build_line_ocean_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE No Build Line Ocean:', error);
      return { de_no_build_line_ocean_count: 0, de_no_build_line_ocean_all: [] };
    }
  }

  private async getDEParkFacilities(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 5;
      const data = await getDEParkFacilitiesData(lat, lon, radiusMiles);
      return {
        de_park_facilities_all: data.map(f => ({ ...f.attributes, distance_miles: f.distance_miles, geometry: f.geometry })),
        de_park_facilities_count: data.length,
        de_park_facilities_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Park Facilities:', error);
      return { de_park_facilities_count: 0, de_park_facilities_all: [] };
    }
  }

  private async getDEChildCareCenters(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const data = await getDEChildCareCentersData(lat, lon, radiusMiles);
      return {
        de_child_care_centers_all: data.map(f => ({
          ...f.attributes,
          name: f.name,
          type: f.type,
          address: f.address,
          city: f.city,
          state: f.state,
          zip: f.zip,
          phone: f.phone,
          county: f.county,
          capacity: f.capacity,
          starLevel: f.starLevel,
          ageRange: f.ageRange,
          opens: f.opens,
          closes: f.closes,
          distance_miles: f.distance_miles,
          geometry: f.geometry
        })),
        de_child_care_centers_count: data.length,
        de_child_care_centers_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Child Care Centers:', error);
      return { de_child_care_centers_count: 0, de_child_care_centers_all: [] };
    }
  }

  private async getDEFishingAccess(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const data = await getDEFishingAccessData(lat, lon, radiusMiles);
      return {
        de_fishing_access_all: data.map(f => ({
          ...f.attributes,
          name: f.name,
          facility: f.facility,
          division: f.division,
          county: f.county,
          tidal: f.tidal,
          distance_miles: f.distance_miles,
          geometry: f.geometry
        })),
        de_fishing_access_count: data.length,
        de_fishing_access_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Fishing Access:', error);
      return { de_fishing_access_count: 0, de_fishing_access_all: [] };
    }
  }

  private async getDETroutStreams(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const data = await getDETroutStreamsData(lat, lon, radiusMiles);
      return {
        de_trout_streams_all: data.map(f => ({
          ...f.attributes,
          waterBodyName: f.waterBodyName,
          restriction: f.restriction,
          description: f.description,
          gnisName: f.gnisName,
          gnisId: f.gnisId,
          distance_miles: f.distance_miles,
          geometry: f.geometry
        })),
        de_trout_streams_count: data.length,
        de_trout_streams_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Trout Streams:', error);
      return { de_trout_streams_count: 0, de_trout_streams_all: [] };
    }
  }

  private async getDEPublicSchools(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const data = await getDEPublicSchoolsData(lat, lon, radiusMiles);
      return {
        de_public_schools_all: data.map(f => ({
          ...f.attributes,
          name: f.name,
          schoolType: f.schoolType,
          district: f.district,
          address: f.address,
          city: f.city,
          state: f.state,
          zip: f.zip,
          phone: f.phone,
          distance_miles: f.distance_miles,
          geometry: f.geometry
        })),
        de_public_schools_count: data.length,
        de_public_schools_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Public Schools:', error);
      return { de_public_schools_count: 0, de_public_schools_all: [] };
    }
  }

  private async getDEPrivateSchools(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const data = await getDEPrivateSchoolsData(lat, lon, radiusMiles);
      return {
        de_private_schools_all: data.map(f => ({
          ...f.attributes,
          name: f.name,
          schoolType: f.schoolType,
          district: f.district,
          address: f.address,
          city: f.city,
          state: f.state,
          zip: f.zip,
          phone: f.phone,
          distance_miles: f.distance_miles,
          geometry: f.geometry
        })),
        de_private_schools_count: data.length,
        de_private_schools_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Private Schools:', error);
      return { de_private_schools_count: 0, de_private_schools_all: [] };
    }
  }

  private async getDEVoTechDistricts(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      const data = await getDEVoTechDistrictsData(lat, lon);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      
      if (data.containing) {
        allFeatures.push({
          ...data.containing.attributes,
          name: data.containing.name,
          districtType: data.containing.districtType,
          isContaining: true,
          geometry: data.containing.geometry
        });
        result.de_votech_districts_containing = true;
      } else {
        result.de_votech_districts_containing = false;
      }
      
      result.de_votech_districts_all = allFeatures;
      result.de_votech_districts_count = allFeatures.length;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE VoTech Districts:', error);
      return { de_votech_districts_count: 0, de_votech_districts_all: [], de_votech_districts_containing: false };
    }
  }

  private async getDESchoolDistricts(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      const data = await getDESchoolDistrictsData(lat, lon);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      
      if (data.containing) {
        allFeatures.push({
          ...data.containing.attributes,
          name: data.containing.name,
          districtType: data.containing.districtType,
          isContaining: true,
          geometry: data.containing.geometry
        });
        result.de_school_districts_containing = true;
      } else {
        result.de_school_districts_containing = false;
      }
      
      result.de_school_districts_all = allFeatures;
      result.de_school_districts_count = allFeatures.length;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE School Districts:', error);
      return { de_school_districts_count: 0, de_school_districts_all: [], de_school_districts_containing: false };
    }
  }

  private async getDEStandsBlindsFields(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const data = await getDEStandsBlindsFieldsData(lat, lon, radiusMiles);
      return {
        de_stands_blinds_fields_all: data.map(f => ({
          ...f.attributes,
          name: f.name,
          type: f.type,
          distance_miles: f.distance_miles,
          geometry: f.geometry
        })),
        de_stands_blinds_fields_count: data.length,
        de_stands_blinds_fields_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Stands Blinds Fields:', error);
      return { de_stands_blinds_fields_count: 0, de_stands_blinds_fields_all: [] };
    }
  }

  private async getDEBoatRamps(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const data = await getDEBoatRampsData(lat, lon, radiusMiles);
      return {
        de_boat_ramps_all: data.map(f => ({
          ...f.attributes,
          name: f.name,
          type: f.type,
          distance_miles: f.distance_miles,
          geometry: f.geometry
        })),
        de_boat_ramps_count: data.length,
        de_boat_ramps_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Boat Ramps:', error);
      return { de_boat_ramps_count: 0, de_boat_ramps_all: [] };
    }
  }

  private async getDEFacilities(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const data = await getDEFacilitiesData(lat, lon, radiusMiles);
      return {
        de_facilities_all: data.map(f => ({
          ...f.attributes,
          name: f.name,
          type: f.type,
          distance_miles: f.distance_miles,
          geometry: f.geometry
        })),
        de_facilities_count: data.length,
        de_facilities_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Facilities:', error);
      return { de_facilities_count: 0, de_facilities_all: [] };
    }
  }

  private async getDEParking(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const data = await getDEParkingData(lat, lon, radiusMiles);
      return {
        de_parking_all: data.map(f => ({
          ...f.attributes,
          name: f.name,
          type: f.type,
          distance_miles: f.distance_miles,
          geometry: f.geometry
        })),
        de_parking_count: data.length,
        de_parking_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Parking:', error);
      return { de_parking_count: 0, de_parking_all: [] };
    }
  }

  private async getDERestrooms(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const data = await getDERestroomsData(lat, lon, radiusMiles);
      return {
        de_restrooms_all: data.map(f => ({
          ...f.attributes,
          name: f.name,
          type: f.type,
          distance_miles: f.distance_miles,
          geometry: f.geometry
        })),
        de_restrooms_count: data.length,
        de_restrooms_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Restrooms:', error);
      return { de_restrooms_count: 0, de_restrooms_all: [] };
    }
  }

  private async getDESafetyZones(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      const data = await getDESafetyZonesData(lat, lon);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      
      if (data.containing) {
        allFeatures.push({
          ...data.containing.attributes,
          name: data.containing.name,
          type: data.containing.type,
          isContaining: true,
          geometry: data.containing.geometry
        });
        result.de_safety_zones_containing = true;
      } else {
        result.de_safety_zones_containing = false;
      }
      
      result.de_safety_zones_all = allFeatures;
      result.de_safety_zones_count = allFeatures.length;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Safety Zones:', error);
      return { de_safety_zones_count: 0, de_safety_zones_all: [], de_safety_zones_containing: false };
    }
  }

  private async getDEWildlifeManagementZones(lat: number, lon: number): Promise<Record<string, any>> {
    try {
      const data = await getDEWildlifeManagementZonesData(lat, lon);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      
      if (data.containing) {
        allFeatures.push({
          ...data.containing.attributes,
          name: data.containing.name,
          type: data.containing.type,
          isContaining: true,
          geometry: data.containing.geometry
        });
        result.de_wildlife_management_zones_containing = true;
      } else {
        result.de_wildlife_management_zones_containing = false;
      }
      
      result.de_wildlife_management_zones_all = allFeatures;
      result.de_wildlife_management_zones_count = allFeatures.length;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Wildlife Management Zones:', error);
      return { de_wildlife_management_zones_count: 0, de_wildlife_management_zones_all: [], de_wildlife_management_zones_containing: false };
    }
  }

  private async getDERailLines(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const data = await getDERailLinesData(lat, lon, radiusMiles);
      return {
        de_rail_lines_all: data.map(f => ({
          ...f.attributes,
          railId: f.railId,
          trackType: f.trackType,
          status: f.status,
          lineId: f.lineId,
          owner: f.owner,
          operators: f.operators,
          distance_miles: f.distance_miles,
          geometry: f.geometry
        })),
        de_rail_lines_count: data.length,
        de_rail_lines_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Rail Lines:', error);
      return { de_rail_lines_count: 0, de_rail_lines_all: [] };
    }
  }

  private async getDENaturalAreas(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 0;
      const data = await getDENaturalAreasData(lat, lon, radiusMiles);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      if (data.containingFeature) {
        allFeatures.push({ ...data.containingFeature.attributes, isContaining: true, distance_miles: 0, geometry: data.containingFeature.geometry });
        result.de_natural_areas_containing = true;
      } else {
        result.de_natural_areas_containing = false;
      }
      if (data.nearbyFeatures && data.nearbyFeatures.length > 0) {
        data.nearbyFeatures.forEach(f => allFeatures.push({ ...f.attributes, isContaining: false, distance_miles: f.distance_miles, geometry: f.geometry }));
        result.de_natural_areas_nearby_count = data.nearbyFeatures.length;
      } else {
        result.de_natural_areas_nearby_count = 0;
      }
      result.de_natural_areas_all = allFeatures;
      result.de_natural_areas_count = allFeatures.length;
      if (radiusMiles > 0) result.de_natural_areas_search_radius_miles = radiusMiles;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Natural Areas:', error);
      return { de_natural_areas_count: 0, de_natural_areas_all: [] };
    }
  }

  private async getDEOutdoorRecreationParksTrailsLands(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 0;
      const data = await getDEOutdoorRecreationParksTrailsLandsData(lat, lon, radiusMiles);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      if (data.containingFeature) {
        allFeatures.push({ ...data.containingFeature.attributes, isContaining: true, distance_miles: 0, geometry: data.containingFeature.geometry });
        result.de_outdoor_recreation_parks_trails_lands_containing = true;
      } else {
        result.de_outdoor_recreation_parks_trails_lands_containing = false;
      }
      if (data.nearbyFeatures && data.nearbyFeatures.length > 0) {
        data.nearbyFeatures.forEach(f => allFeatures.push({ ...f.attributes, isContaining: false, distance_miles: f.distance_miles, geometry: f.geometry }));
        result.de_outdoor_recreation_parks_trails_lands_nearby_count = data.nearbyFeatures.length;
      } else {
        result.de_outdoor_recreation_parks_trails_lands_nearby_count = 0;
      }
      result.de_outdoor_recreation_parks_trails_lands_all = allFeatures;
      result.de_outdoor_recreation_parks_trails_lands_count = allFeatures.length;
      if (radiusMiles > 0) result.de_outdoor_recreation_parks_trails_lands_search_radius_miles = radiusMiles;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Outdoor Recreation Parks Trails Lands:', error);
      return { de_outdoor_recreation_parks_trails_lands_count: 0, de_outdoor_recreation_parks_trails_lands_all: [] };
    }
  }

  private async getDELandWaterConservationFund(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 0;
      const data = await getDELandWaterConservationFundData(lat, lon, radiusMiles);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      if (data.containingFeature) {
        allFeatures.push({ ...data.containingFeature.attributes, isContaining: true, distance_miles: 0, geometry: data.containingFeature.geometry });
        result.de_land_water_conservation_fund_containing = true;
      } else {
        result.de_land_water_conservation_fund_containing = false;
      }
      if (data.nearbyFeatures && data.nearbyFeatures.length > 0) {
        data.nearbyFeatures.forEach(f => allFeatures.push({ ...f.attributes, isContaining: false, distance_miles: f.distance_miles, geometry: f.geometry }));
        result.de_land_water_conservation_fund_nearby_count = data.nearbyFeatures.length;
      } else {
        result.de_land_water_conservation_fund_nearby_count = 0;
      }
      result.de_land_water_conservation_fund_all = allFeatures;
      result.de_land_water_conservation_fund_count = allFeatures.length;
      if (radiusMiles > 0) result.de_land_water_conservation_fund_search_radius_miles = radiusMiles;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Land and Water Conservation Fund:', error);
      return { de_land_water_conservation_fund_count: 0, de_land_water_conservation_fund_all: [] };
    }
  }

  private async getDENaturePreserves(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 0;
      const data = await getDENaturePreservesData(lat, lon, radiusMiles);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      if (data.containingFeature) {
        allFeatures.push({ ...data.containingFeature.attributes, isContaining: true, distance_miles: 0, geometry: data.containingFeature.geometry });
        result.de_nature_preserves_containing = true;
      } else {
        result.de_nature_preserves_containing = false;
      }
      if (data.nearbyFeatures && data.nearbyFeatures.length > 0) {
        data.nearbyFeatures.forEach(f => allFeatures.push({ ...f.attributes, isContaining: false, distance_miles: f.distance_miles, geometry: f.geometry }));
        result.de_nature_preserves_nearby_count = data.nearbyFeatures.length;
      } else {
        result.de_nature_preserves_nearby_count = 0;
      }
      result.de_nature_preserves_all = allFeatures;
      result.de_nature_preserves_count = allFeatures.length;
      if (radiusMiles > 0) result.de_nature_preserves_search_radius_miles = radiusMiles;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Nature Preserves:', error);
      return { de_nature_preserves_count: 0, de_nature_preserves_all: [] };
    }
  }

  private async getDEOutdoorRecreationAreas(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 0;
      const data = await getDEOutdoorRecreationAreasData(lat, lon, radiusMiles);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      if (data.containingFeature) {
        allFeatures.push({ ...data.containingFeature.attributes, isContaining: true, distance_miles: 0, geometry: data.containingFeature.geometry });
        result.de_outdoor_recreation_areas_containing = true;
      } else {
        result.de_outdoor_recreation_areas_containing = false;
      }
      if (data.nearbyFeatures && data.nearbyFeatures.length > 0) {
        data.nearbyFeatures.forEach(f => allFeatures.push({ ...f.attributes, isContaining: false, distance_miles: f.distance_miles, geometry: f.geometry }));
        result.de_outdoor_recreation_areas_nearby_count = data.nearbyFeatures.length;
      } else {
        result.de_outdoor_recreation_areas_nearby_count = 0;
      }
      result.de_outdoor_recreation_areas_all = allFeatures;
      result.de_outdoor_recreation_areas_count = allFeatures.length;
      if (radiusMiles > 0) result.de_outdoor_recreation_areas_search_radius_miles = radiusMiles;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Outdoor Recreation Areas:', error);
      return { de_outdoor_recreation_areas_count: 0, de_outdoor_recreation_areas_all: [] };
    }
  }

  private async getDEOutdoorRecreationParksTrailsOpenSpace(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 0;
      const data = await getDEOutdoorRecreationParksTrailsOpenSpaceData(lat, lon, radiusMiles);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      if (data.containingFeature) {
        allFeatures.push({ ...data.containingFeature.attributes, isContaining: true, distance_miles: 0, geometry: data.containingFeature.geometry });
        result.de_outdoor_recreation_parks_trails_open_space_containing = true;
      } else {
        result.de_outdoor_recreation_parks_trails_open_space_containing = false;
      }
      if (data.nearbyFeatures && data.nearbyFeatures.length > 0) {
        data.nearbyFeatures.forEach(f => allFeatures.push({ ...f.attributes, isContaining: false, distance_miles: f.distance_miles, geometry: f.geometry }));
        result.de_outdoor_recreation_parks_trails_open_space_nearby_count = data.nearbyFeatures.length;
      } else {
        result.de_outdoor_recreation_parks_trails_open_space_nearby_count = 0;
      }
      result.de_outdoor_recreation_parks_trails_open_space_all = allFeatures;
      result.de_outdoor_recreation_parks_trails_open_space_count = allFeatures.length;
      if (radiusMiles > 0) result.de_outdoor_recreation_parks_trails_open_space_search_radius_miles = radiusMiles;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Outdoor Recreation Parks Trails Open Space:', error);
      return { de_outdoor_recreation_parks_trails_open_space_count: 0, de_outdoor_recreation_parks_trails_open_space_all: [] };
    }
  }

  private async getDEPublicProtectedLands(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 0;
      const data = await getDEPublicProtectedLandsData(lat, lon, radiusMiles);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      if (data.containingFeature) {
        allFeatures.push({ ...data.containingFeature.attributes, isContaining: true, distance_miles: 0, geometry: data.containingFeature.geometry });
        result.de_public_protected_lands_containing = true;
      } else {
        result.de_public_protected_lands_containing = false;
      }
      if (data.nearbyFeatures && data.nearbyFeatures.length > 0) {
        data.nearbyFeatures.forEach(f => allFeatures.push({ ...f.attributes, isContaining: false, distance_miles: f.distance_miles, geometry: f.geometry }));
        result.de_public_protected_lands_nearby_count = data.nearbyFeatures.length;
      } else {
        result.de_public_protected_lands_nearby_count = 0;
      }
      result.de_public_protected_lands_all = allFeatures;
      result.de_public_protected_lands_count = allFeatures.length;
      if (radiusMiles > 0) result.de_public_protected_lands_search_radius_miles = radiusMiles;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Public Protected Lands:', error);
      return { de_public_protected_lands_count: 0, de_public_protected_lands_all: [] };
    }
  }

  private async getDEConservationEasements(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 0;
      const data = await getDEConservationEasementsData(lat, lon, radiusMiles);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      if (data.containingFeature) {
        allFeatures.push({ ...data.containingFeature.attributes, isContaining: true, distance_miles: 0, geometry: data.containingFeature.geometry });
        result.de_conservation_easements_containing = true;
      } else {
        result.de_conservation_easements_containing = false;
      }
      if (data.nearbyFeatures && data.nearbyFeatures.length > 0) {
        data.nearbyFeatures.forEach(f => allFeatures.push({ ...f.attributes, isContaining: false, distance_miles: f.distance_miles, geometry: f.geometry }));
        result.de_conservation_easements_nearby_count = data.nearbyFeatures.length;
      } else {
        result.de_conservation_easements_nearby_count = 0;
      }
      result.de_conservation_easements_all = allFeatures;
      result.de_conservation_easements_count = allFeatures.length;
      if (radiusMiles > 0) result.de_conservation_easements_search_radius_miles = radiusMiles;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Conservation Easements:', error);
      return { de_conservation_easements_count: 0, de_conservation_easements_all: [] };
    }
  }

  private async getDETrailsPathways(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 5;
      const data = await getDETrailsPathwaysData(lat, lon, radiusMiles);
      return {
        de_trails_pathways_all: data.map(f => ({ ...f.attributes, distance_miles: f.distance_miles, geometry: f.geometry })),
        de_trails_pathways_count: data.length,
        de_trails_pathways_search_radius_miles: radiusMiles
      };
    } catch (error) {
      console.error('❌ Error fetching DE Trails and Pathways:', error);
      return { de_trails_pathways_count: 0, de_trails_pathways_all: [] };
    }
  }

  private async getDESeasonalRestrictedAreas(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 0;
      const data = await getDESeasonalRestrictedAreasData(lat, lon, radiusMiles);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      if (data.containingFeature) {
        allFeatures.push({ ...data.containingFeature.attributes, isContaining: true, distance_miles: 0, geometry: data.containingFeature.geometry });
        result.de_seasonal_restricted_areas_containing = true;
      } else {
        result.de_seasonal_restricted_areas_containing = false;
      }
      if (data.nearbyFeatures && data.nearbyFeatures.length > 0) {
        data.nearbyFeatures.forEach(f => allFeatures.push({ ...f.attributes, isContaining: false, distance_miles: f.distance_miles, geometry: f.geometry }));
        result.de_seasonal_restricted_areas_nearby_count = data.nearbyFeatures.length;
      } else {
        result.de_seasonal_restricted_areas_nearby_count = 0;
      }
      result.de_seasonal_restricted_areas_all = allFeatures;
      result.de_seasonal_restricted_areas_count = allFeatures.length;
      if (radiusMiles > 0) result.de_seasonal_restricted_areas_search_radius_miles = radiusMiles;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Seasonal Restricted Areas:', error);
      return { de_seasonal_restricted_areas_count: 0, de_seasonal_restricted_areas_all: [] };
    }
  }

  private async getDEPermanentRestrictedAreas(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 0;
      const data = await getDEPermanentRestrictedAreasData(lat, lon, radiusMiles);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      if (data.containingFeature) {
        allFeatures.push({ ...data.containingFeature.attributes, isContaining: true, distance_miles: 0, geometry: data.containingFeature.geometry });
        result.de_permanent_restricted_areas_containing = true;
      } else {
        result.de_permanent_restricted_areas_containing = false;
      }
      if (data.nearbyFeatures && data.nearbyFeatures.length > 0) {
        data.nearbyFeatures.forEach(f => allFeatures.push({ ...f.attributes, isContaining: false, distance_miles: f.distance_miles, geometry: f.geometry }));
        result.de_permanent_restricted_areas_nearby_count = data.nearbyFeatures.length;
      } else {
        result.de_permanent_restricted_areas_nearby_count = 0;
      }
      result.de_permanent_restricted_areas_all = allFeatures;
      result.de_permanent_restricted_areas_count = allFeatures.length;
      if (radiusMiles > 0) result.de_permanent_restricted_areas_search_radius_miles = radiusMiles;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Permanent Restricted Areas:', error);
      return { de_permanent_restricted_areas_count: 0, de_permanent_restricted_areas_all: [] };
    }
  }

  private async getDEWildlifeAreaBoundaries(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 0;
      const data = await getDEWildlifeAreaBoundariesData(lat, lon, radiusMiles);
      const result: Record<string, any> = {};
      const allFeatures: any[] = [];
      if (data.containingFeature) {
        allFeatures.push({ ...data.containingFeature.attributes, isContaining: true, distance_miles: 0, geometry: data.containingFeature.geometry });
        result.de_wildlife_area_boundaries_containing = true;
      } else {
        result.de_wildlife_area_boundaries_containing = false;
      }
      if (data.nearbyFeatures && data.nearbyFeatures.length > 0) {
        data.nearbyFeatures.forEach(f => allFeatures.push({ ...f.attributes, isContaining: false, distance_miles: f.distance_miles, geometry: f.geometry }));
        result.de_wildlife_area_boundaries_nearby_count = data.nearbyFeatures.length;
      } else {
        result.de_wildlife_area_boundaries_nearby_count = 0;
      }
      result.de_wildlife_area_boundaries_all = allFeatures;
      result.de_wildlife_area_boundaries_count = allFeatures.length;
      if (radiusMiles > 0) result.de_wildlife_area_boundaries_search_radius_miles = radiusMiles;
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Wildlife Area Boundaries:', error);
      return { de_wildlife_area_boundaries_count: 0, de_wildlife_area_boundaries_all: [] };
    }
  }

  private async getDEParcels(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius || 0.3;
      const parcelData = await getDEParcelData(lat, lon, radiusMiles);
      const result: Record<string, any> = {};
      
      if (parcelData) {
        const allParcels: any[] = [];
        
        if (parcelData.containingParcel && parcelData.containingParcel.parcelId) {
          allParcels.push({
            ...parcelData.containingParcel.attributes,
            parcelId: parcelData.containingParcel.parcelId,
            isContaining: true,
            distance_miles: 0,
            geometry: parcelData.containingParcel.geometry
          });
          result.de_parcel_containing = parcelData.containingParcel.parcelId;
        } else {
          result.de_parcel_containing = null;
          result.de_parcel_containing_message = 'No parcel found containing this location';
        }
        
        if (parcelData.nearbyParcels && parcelData.nearbyParcels.length > 0) {
          parcelData.nearbyParcels.forEach(parcel => {
            if (!allParcels.some(p => p.parcelId === parcel.parcelId)) {
              allParcels.push({
                ...parcel.attributes,
                parcelId: parcel.parcelId,
                isContaining: false,
                distance_miles: parcel.distance_miles,
                geometry: parcel.geometry
              });
            }
          });
          result.de_parcels_nearby_count = parcelData.nearbyParcels.length;
        } else {
          result.de_parcels_nearby_count = 0;
        }
        
        result.de_parcels_all = allParcels;
        result.de_parcels_count = allParcels.length;
        if (radiusMiles > 0) {
          result.de_parcels_search_radius_miles = radiusMiles;
        }
      } else {
        result.de_parcels_count = 0;
        result.de_parcels_all = [];
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching DE Parcels:', error);
      return { de_parcels_count: 0, de_parcels_all: [] };
    }
  }

  private async getDELULC(lat: number, lon: number, layerId: number, year: string): Promise<Record<string, any>> {
    try {
      const lulcData = await getDELULCData(lat, lon, layerId, year);
      const result: Record<string, any> = {};
      
      if (lulcData) {
        const keyPrefix = `de_lulc_${year}`;
        result[`${keyPrefix}_code`] = lulcData.lulcCode;
        result[`${keyPrefix}_category`] = lulcData.lulcCategory;
        result[`${keyPrefix}_found`] = true;
        result[`${keyPrefix}_geometry`] = lulcData.geometry;
        
        // Store all attributes for CSV export
        result[`${keyPrefix}_all`] = [{
          ...lulcData.attributes,
          lulcCode: lulcData.lulcCode,
          lulcCategory: lulcData.lulcCategory,
          geometry: lulcData.geometry
        }];
      } else {
        const keyPrefix = `de_lulc_${year}`;
        result[`${keyPrefix}_found`] = false;
        result[`${keyPrefix}_code`] = null;
        result[`${keyPrefix}_category`] = null;
        result[`${keyPrefix}_all`] = [];
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Error fetching DE LULC ${year}:`, error);
      const keyPrefix = `de_lulc_${year}`;
      return { 
        [`${keyPrefix}_found`]: false,
        [`${keyPrefix}_code`]: null,
        [`${keyPrefix}_category`]: null,
        [`${keyPrefix}_all`]: []
      };
    }
  }

  private async getCTParcels(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏠 Fetching CT Parcels data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 0.25; // Default to 0.25 miles if not provided
      
      // Get parcel data (both containing and nearby)
      const parcelData = await getCTParcelData(lat, lon, radiusMiles);
      
      if (parcelData) {
        // Collect all parcels (containing + nearby) into a single array for CSV export
        const allParcels: any[] = [];
        
        // Add containing parcel (point-in-polygon) if found
        if (parcelData.containingParcel && parcelData.containingParcel.parcelId) {
          allParcels.push({
            ...parcelData.containingParcel.attributes,
            parcelId: parcelData.containingParcel.parcelId,
            isContaining: true,
            distance_miles: 0,
            geometry: parcelData.containingParcel.geometry // Include geometry for map drawing
          });
          result.ct_parcel_containing = parcelData.containingParcel.parcelId;
          result.ct_parcel_containing_town = parcelData.containingParcel.attributes?.Town_Name || null;
          result.ct_parcel_containing_owner = parcelData.containingParcel.attributes?.Owner || null;
          result.ct_parcel_containing_location = parcelData.containingParcel.attributes?.Location || null;
        } else {
          result.ct_parcel_containing = null;
          result.ct_parcel_containing_message = 'No parcel found containing this location';
        }
        
        // Add nearby parcels (proximity search)
        if (parcelData.nearbyParcels && parcelData.nearbyParcels.length > 0) {
          parcelData.nearbyParcels.forEach(parcel => {
            // Only add if it's not already in the array (avoid duplicates)
            if (!allParcels.some(p => p.parcelId === parcel.parcelId)) {
              allParcels.push({
                ...parcel.attributes,
                parcelId: parcel.parcelId,
                isContaining: false,
                distance_miles: parcel.distance_miles || null,
                geometry: parcel.geometry // Include geometry for map drawing
              });
            }
          });
          result.ct_parcels_nearby_count = parcelData.nearbyParcels.length;
        } else {
          result.ct_parcels_nearby_count = 0;
        }
        
        // Store all parcels as an array for CSV export (similar to _all_pois pattern)
        result.ct_parcels_all = allParcels;
        result.ct_parcels_search_radius_miles = radiusMiles;
      } else {
        result.ct_parcel_containing = null;
        result.ct_parcels_nearby_count = 0;
        result.ct_parcels_all = [];
      }
      
      console.log(`✅ CT Parcels data processed:`, {
        containing: result.ct_parcel_containing || 'N/A',
        nearbyCount: result.ct_parcels_nearby_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching CT Parcels:', error);
      return {
        ct_parcel_containing: null,
        ct_parcels_nearby_count: 0,
        ct_parcels_all: [],
        ct_parcels_error: 'Error fetching CT Parcels data'
      };
    }
  }

  private async getNJParcels(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏠 Fetching NJ Parcels data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 0.25; // Default to 0.25 miles if not provided
      
      // Get parcel data (both containing and nearby)
      const parcelData = await getNJParcelsData(lat, lon, radiusMiles);
      
      if (parcelData) {
        // Collect all parcels (containing + nearby) into a single array for CSV export
        const allParcels: any[] = [];
        
        // Add containing parcel (point-in-polygon) if found
        if (parcelData.containing && parcelData.containing.parcelId) {
          allParcels.push({
            ...parcelData.containing.attributes,
            parcelId: parcelData.containing.parcelId,
            pin: parcelData.containing.pin,
            municipality: parcelData.containing.municipality,
            county: parcelData.containing.county,
            block: parcelData.containing.block,
            lot: parcelData.containing.lot,
            ownerName: parcelData.containing.ownerName,
            streetAddress: parcelData.containing.streetAddress,
            cityState: parcelData.containing.cityState,
            zipCode: parcelData.containing.zipCode,
            landValue: parcelData.containing.landValue,
            improvementValue: parcelData.containing.improvementValue,
            netValue: parcelData.containing.netValue,
            acres: parcelData.containing.acres,
            isContaining: true,
            distance_miles: 0,
            geometry: parcelData.containing.geometry // Include geometry for map drawing
          });
          result.nj_parcel_containing = parcelData.containing.parcelId;
          result.nj_parcel_containing_pin = parcelData.containing.pin;
          result.nj_parcel_containing_municipality = parcelData.containing.municipality;
          result.nj_parcel_containing_county = parcelData.containing.county;
        } else {
          result.nj_parcel_containing = null;
          result.nj_parcel_containing_message = 'No parcel found containing this location';
        }
        
        // Add nearby parcels (proximity search)
        if (parcelData.nearby && parcelData.nearby.length > 0) {
          parcelData.nearby.forEach(parcel => {
            // Only add if it's not already in the array (avoid duplicates)
            if (!allParcels.some(p => p.parcelId === parcel.parcelId)) {
              allParcels.push({
                ...parcel.attributes,
                parcelId: parcel.parcelId,
                pin: parcel.pin,
                municipality: parcel.municipality,
                county: parcel.county,
                block: parcel.block,
                lot: parcel.lot,
                ownerName: parcel.ownerName,
                streetAddress: parcel.streetAddress,
                cityState: parcel.cityState,
                zipCode: parcel.zipCode,
                landValue: parcel.landValue,
                improvementValue: parcel.improvementValue,
                netValue: parcel.netValue,
                acres: parcel.acres,
                isContaining: false,
                distance_miles: parcel.distance_miles || null,
                geometry: parcel.geometry // Include geometry for map drawing
              });
            }
          });
          result.nj_parcels_nearby_count = parcelData.nearby.length;
        } else {
          result.nj_parcels_nearby_count = 0;
        }
        
        // Store all parcels as an array for CSV export (similar to _all_pois pattern)
        result.nj_parcels_all = allParcels;
        result.nj_parcels_search_radius_miles = radiusMiles;
      } else {
        result.nj_parcel_containing = null;
        result.nj_parcels_nearby_count = 0;
        result.nj_parcels_all = [];
      }
      
      console.log(`✅ NJ Parcels data processed:`, {
        containing: result.nj_parcel_containing || 'N/A',
        nearbyCount: result.nj_parcels_nearby_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NJ Parcels:', error);
      return {
        nj_parcel_containing: null,
        nj_parcels_nearby_count: 0,
        nj_parcels_all: [],
        nj_parcels_error: 'Error fetching NJ Parcels data'
      };
    }
  }

  private async getNJAddressPoints(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`📍 Fetching NJ Address Points data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 0.3; // Default to 0.3 miles if not provided, capped at 5 miles
      const cappedRadius = Math.min(radiusMiles, 5.0);
      
      // Get address points data
      const addressPoints = await getNJAddressPointsData(lat, lon, cappedRadius);
      
      if (addressPoints && addressPoints.length > 0) {
        // Store all address points for CSV export and map drawing
        result.nj_address_points_all = addressPoints.map(point => ({
          ...point.attributes,
          addressId: point.addressId,
          fullAddress: point.fullAddress,
          streetName: point.streetName,
          streetNumber: point.streetNumber,
          municipality: point.municipality,
          county: point.county,
          zipCode: point.zipCode,
          state: point.state,
          country: point.country,
          subtype: point.subtype,
          primaryPoint: point.primaryPoint,
          status: point.status,
          placement: point.placement,
          lat: point.lat,
          lon: point.lon,
          distance_miles: point.distance_miles
        }));
        
        result.nj_address_points_count = addressPoints.length;
        result.nj_address_points_search_radius_miles = cappedRadius;
      } else {
        result.nj_address_points_all = [];
        result.nj_address_points_count = 0;
        result.nj_address_points_search_radius_miles = cappedRadius;
      }
      
      console.log(`✅ NJ Address Points data processed:`, {
        count: result.nj_address_points_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NJ Address Points:', error);
      return {
        nj_address_points_all: [],
        nj_address_points_count: 0,
        nj_address_points_error: 'Error fetching NJ Address Points data'
      };
    }
  }

  private async getNJBusStops(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🚌 Fetching NJ Bus Stops data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 5; // Default to 5 miles if not provided, capped at 25 miles
      const cappedRadius = Math.min(radiusMiles, 25.0);
      
      // Get bus stops data
      const busStops = await getNJBusStopsData(lat, lon, cappedRadius);
      
      if (busStops && busStops.length > 0) {
        // Store all bus stops for CSV export and map drawing
        result.nj_bus_stops_all = busStops.map(stop => ({
          ...stop.attributes,
          stopId: stop.stopId,
          stopNumber: stop.stopNumber,
          description: stop.description,
          county: stop.county,
          municipality: stop.municipality,
          stopType: stop.stopType,
          direction: stop.direction,
          streetDirection: stop.streetDirection,
          allLines: stop.allLines,
          lat: stop.lat,
          lon: stop.lon,
          distance_miles: stop.distance_miles
        }));
        
        result.nj_bus_stops_count = busStops.length;
        result.nj_bus_stops_search_radius_miles = cappedRadius;
      } else {
        result.nj_bus_stops_all = [];
        result.nj_bus_stops_count = 0;
        result.nj_bus_stops_search_radius_miles = cappedRadius;
      }
      
      console.log(`✅ NJ Bus Stops data processed:`, {
        count: result.nj_bus_stops_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NJ Bus Stops:', error);
      return {
        nj_bus_stops_all: [],
        nj_bus_stops_count: 0,
        nj_bus_stops_error: 'Error fetching NJ Bus Stops data'
      };
    }
  }

  private async getNJSafetyServicePatrol(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🚨 Fetching NJ Safety Service Patrol data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 5; // Default to 5 miles if not provided, capped at 25 miles
      const cappedRadius = Math.min(radiusMiles, 25.0);
      
      // Get patrol routes data
      const patrolRoutes = await getNJSafetyServicePatrolData(lat, lon, cappedRadius);
      
      if (patrolRoutes && patrolRoutes.length > 0) {
        // Store all patrol routes for CSV export and map drawing
        result.nj_safety_service_patrol_all = patrolRoutes.map(route => ({
          ...route.attributes,
          routeId: route.routeId,
          routeName: route.routeName,
          sri: route.sri,
          beginMile: route.beginMile,
          endMile: route.endMile,
          totalMiles: route.totalMiles,
          category: route.category,
          categoryType: route.categoryType,
          locationError: route.locationError,
          geometry: route.geometry, // Include geometry for map drawing
          distance_miles: route.distance_miles
        }));
        
        result.nj_safety_service_patrol_count = patrolRoutes.length;
        result.nj_safety_service_patrol_search_radius_miles = cappedRadius;
      } else {
        result.nj_safety_service_patrol_all = [];
        result.nj_safety_service_patrol_count = 0;
        result.nj_safety_service_patrol_search_radius_miles = cappedRadius;
      }
      
      console.log(`✅ NJ Safety Service Patrol data processed:`, {
        count: result.nj_safety_service_patrol_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NJ Safety Service Patrol:', error);
      return {
        nj_safety_service_patrol_all: [],
        nj_safety_service_patrol_count: 0,
        nj_safety_service_patrol_error: 'Error fetching NJ Safety Service Patrol data'
      };
    }
  }

  private async getNJServiceAreas(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🛣️ Fetching NJ Service Areas data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 5; // Default to 5 miles if not provided, capped at 50 miles
      const cappedRadius = Math.min(radiusMiles, 50.0);
      
      // Get service areas data
      const serviceAreas = await getNJServiceAreasData(lat, lon, cappedRadius);
      
      if (serviceAreas && serviceAreas.length > 0) {
        // Store all service areas for CSV export and map drawing
        result.nj_service_areas_all = serviceAreas.map(area => ({
          ...area.attributes,
          serviceAreaId: area.serviceAreaId,
          name: area.name,
          route: area.route,
          milepost: area.milepost,
          lineType: area.lineType,
          rotation: area.rotation,
          lat: area.lat,
          lon: area.lon,
          distance_miles: area.distance_miles
        }));
        
        result.nj_service_areas_count = serviceAreas.length;
        result.nj_service_areas_search_radius_miles = cappedRadius;
      } else {
        result.nj_service_areas_all = [];
        result.nj_service_areas_count = 0;
        result.nj_service_areas_search_radius_miles = cappedRadius;
      }
      
      console.log(`✅ NJ Service Areas data processed:`, {
        count: result.nj_service_areas_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NJ Service Areas:', error);
      return {
        nj_service_areas_all: [],
        nj_service_areas_count: 0,
        nj_service_areas_error: 'Error fetching NJ Service Areas data'
      };
    }
  }

  private async getNJRoadwayNetwork(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🛣️ Fetching NJ Roadway Network data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 5; // Default to 5 miles if not provided, capped at 25 miles
      const cappedRadius = Math.min(radiusMiles, 25.0);
      
      // Get roadway network data
      const roadwaySegments = await getNJRoadwayNetworkData(lat, lon, cappedRadius);
      
      if (roadwaySegments && roadwaySegments.length > 0) {
        // Store all roadway segments for CSV export and map drawing
        result.nj_roadway_network_all = roadwaySegments.map(segment => ({
          ...segment.attributes,
          roadwayId: segment.roadwayId,
          sri: segment.sri,
          sldName: segment.sldName,
          parentSRI: segment.parentSRI,
          mpStart: segment.mpStart,
          mpEnd: segment.mpEnd,
          parentMpStart: segment.parentMpStart,
          parentMpEnd: segment.parentMpEnd,
          measuredLength: segment.measuredLength,
          direction: segment.direction,
          active: segment.active,
          routeSubtype: segment.routeSubtype,
          roadNum: segment.roadNum,
          geometry: segment.geometry, // Include geometry for map drawing
          distance_miles: segment.distance_miles
        }));
        
        result.nj_roadway_network_count = roadwaySegments.length;
        result.nj_roadway_network_search_radius_miles = cappedRadius;
      } else {
        result.nj_roadway_network_all = [];
        result.nj_roadway_network_count = 0;
        result.nj_roadway_network_search_radius_miles = cappedRadius;
      }
      
      console.log(`✅ NJ Roadway Network data processed:`, {
        count: result.nj_roadway_network_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NJ Roadway Network:', error);
      return {
        nj_roadway_network_all: [],
        nj_roadway_network_count: 0,
        nj_roadway_network_error: 'Error fetching NJ Roadway Network data'
      };
    }
  }

  private async getNJKnownContaminatedSites(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏭 Fetching NJ Known Contaminated Sites data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 5; // Default to 5 miles if not provided, capped at 25 miles
      const cappedRadius = Math.min(radiusMiles, 25.0);
      
      // Get contaminated sites data
      const contaminatedSites = await getNJKnownContaminatedSitesData(lat, lon, cappedRadius);
      
      if (contaminatedSites && contaminatedSites.length > 0) {
        // Store all contaminated sites for CSV export and map drawing
        result.nj_known_contaminated_sites_all = contaminatedSites.map(site => ({
          ...site.attributes,
          siteId: site.siteId,
          siteName: site.siteName,
          address: site.address,
          municipality: site.municipality,
          county: site.county,
          zipCode: site.zipCode,
          siteType: site.siteType,
          status: site.status,
          lat: site.lat,
          lon: site.lon,
          distance_miles: site.distance_miles
        }));
        
        result.nj_known_contaminated_sites_count = contaminatedSites.length;
        result.nj_known_contaminated_sites_search_radius_miles = cappedRadius;
      } else {
        result.nj_known_contaminated_sites_all = [];
        result.nj_known_contaminated_sites_count = 0;
        result.nj_known_contaminated_sites_search_radius_miles = cappedRadius;
      }
      
      console.log(`✅ NJ Known Contaminated Sites data processed:`, {
        count: result.nj_known_contaminated_sites_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NJ Known Contaminated Sites:', error);
      return {
        nj_known_contaminated_sites_all: [],
        nj_known_contaminated_sites_count: 0,
        nj_known_contaminated_sites_error: 'Error fetching NJ Known Contaminated Sites data'
      };
    }
  }

  private async getNJAlternativeFuelStations(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`⛽ Fetching NJ Alternative Fueled Vehicle Fueling Stations data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 5; // Default to 5 miles if not provided, capped at 25 miles
      const cappedRadius = Math.min(radiusMiles, 25.0);
      
      // Get alternative fuel stations data
      const fuelStations = await getNJAlternativeFuelStationsData(lat, lon, cappedRadius);
      
      if (fuelStations && fuelStations.length > 0) {
        // Store all fuel stations for CSV export and map drawing
        result.nj_alternative_fuel_stations_all = fuelStations.map(station => ({
          ...station.attributes,
          stationId: station.stationId,
          stationName: station.stationName,
          address: station.address,
          municipality: station.municipality,
          county: station.county,
          zipCode: station.zipCode,
          fuelType: station.fuelType,
          stationType: station.stationType,
          lat: station.lat,
          lon: station.lon,
          distance_miles: station.distance_miles
        }));
        
        result.nj_alternative_fuel_stations_count = fuelStations.length;
        result.nj_alternative_fuel_stations_search_radius_miles = cappedRadius;
      } else {
        result.nj_alternative_fuel_stations_all = [];
        result.nj_alternative_fuel_stations_count = 0;
        result.nj_alternative_fuel_stations_search_radius_miles = cappedRadius;
      }
      
      console.log(`✅ NJ Alternative Fueled Vehicle Fueling Stations data processed:`, {
        count: result.nj_alternative_fuel_stations_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NJ Alternative Fueled Vehicle Fueling Stations:', error);
      return {
        nj_alternative_fuel_stations_all: [],
        nj_alternative_fuel_stations_count: 0,
        nj_alternative_fuel_stations_error: 'Error fetching NJ Alternative Fueled Vehicle Fueling Stations data'
      };
    }
  }

  private async getNJPowerPlants(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`⚡ Fetching NJ Power Plants data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 5; // Default to 5 miles if not provided, capped at 25 miles
      const cappedRadius = Math.min(radiusMiles, 25.0);
      
      // Get power plants data
      const powerPlants = await getNJPowerPlantsData(lat, lon, cappedRadius);
      
      if (powerPlants && powerPlants.length > 0) {
        // Store all power plants for CSV export and map drawing
        result.nj_power_plants_all = powerPlants.map(plant => ({
          ...plant.attributes,
          plantId: plant.plantId,
          plantCode: plant.plantCode,
          plantName: plant.plantName,
          utilityName: plant.utilityName,
          siteId: plant.siteId,
          airPi: plant.airPi,
          city: plant.city,
          county: plant.county,
          streetAddress: plant.streetAddress,
          primarySource: plant.primarySource,
          installMW: plant.installMW,
          totalMW: plant.totalMW,
          sourceDescription: plant.sourceDescription,
          technical: plant.technical,
          edc: plant.edc,
          gridSupply: plant.gridSupply,
          dmrLink: plant.dmrLink,
          lat: plant.lat,
          lon: plant.lon,
          distance_miles: plant.distance_miles
        }));
        
        result.nj_power_plants_count = powerPlants.length;
        result.nj_power_plants_search_radius_miles = cappedRadius;
      } else {
        result.nj_power_plants_all = [];
        result.nj_power_plants_count = 0;
        result.nj_power_plants_search_radius_miles = cappedRadius;
      }
      
      console.log(`✅ NJ Power Plants data processed:`, {
        count: result.nj_power_plants_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NJ Power Plants:', error);
      return {
        nj_power_plants_all: [],
        nj_power_plants_count: 0,
        nj_power_plants_error: 'Error fetching NJ Power Plants data'
      };
    }
  }

  private async getNJPublicSolarFacilities(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`☀️ Fetching NJ Public Solar Facilities data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 5; // Default to 5 miles if not provided, capped at 25 miles
      const cappedRadius = Math.min(radiusMiles, 25.0);
      
      // Get public solar facilities data
      const solarFacilities = await getNJPublicSolarFacilitiesData(lat, lon, cappedRadius);
      
      if (solarFacilities && solarFacilities.length > 0) {
        // Store all solar facilities for CSV export and map drawing
        result.nj_public_solar_facilities_all = solarFacilities.map(facility => ({
          ...facility.attributes,
          facilityId: facility.facilityId,
          accountNumber: facility.accountNumber,
          companyName: facility.companyName,
          systemSize: facility.systemSize,
          customerType: facility.customerType,
          installAddress: facility.installAddress,
          installCity: facility.installCity,
          installZip: facility.installZip,
          installer: facility.installer,
          statusDate: facility.statusDate,
          lat: facility.lat,
          lon: facility.lon,
          distance_miles: facility.distance_miles
        }));
        
        result.nj_public_solar_facilities_count = solarFacilities.length;
        result.nj_public_solar_facilities_search_radius_miles = cappedRadius;
      } else {
        result.nj_public_solar_facilities_all = [];
        result.nj_public_solar_facilities_count = 0;
        result.nj_public_solar_facilities_search_radius_miles = cappedRadius;
      }
      
      console.log(`✅ NJ Public Solar Facilities data processed:`, {
        count: result.nj_public_solar_facilities_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NJ Public Solar Facilities:', error);
      return {
        nj_public_solar_facilities_all: [],
        nj_public_solar_facilities_count: 0,
        nj_public_solar_facilities_error: 'Error fetching NJ Public Solar Facilities data'
      };
    }
  }

  private async getNJPublicPlacesToKeepCool(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`❄️ Fetching NJ Public Places to Keep Cool data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 5; // Default to 5 miles if not provided, capped at 25 miles
      const cappedRadius = Math.min(radiusMiles, 25.0);
      
      // Get public places to keep cool data
      const places = await getNJPublicPlacesToKeepCoolData(lat, lon, cappedRadius);
      
      if (places && places.length > 0) {
        // Store all places for CSV export and map drawing
        result.nj_public_places_to_keep_cool_all = places.map(place => ({
          ...place.attributes,
          placeId: place.placeId,
          featureType: place.featureType,
          featureName: place.featureName,
          address: place.address,
          city: place.city,
          zip: place.zip,
          municipality: place.municipality,
          county: place.county,
          website: place.website,
          phoneNumber: place.phoneNumber,
          admission: place.admission,
          in211: place.in211,
          notes: place.notes,
          lat: place.lat,
          lon: place.lon,
          distance_miles: place.distance_miles
        }));
        
        result.nj_public_places_to_keep_cool_count = places.length;
        result.nj_public_places_to_keep_cool_search_radius_miles = cappedRadius;
      } else {
        result.nj_public_places_to_keep_cool_all = [];
        result.nj_public_places_to_keep_cool_count = 0;
        result.nj_public_places_to_keep_cool_search_radius_miles = cappedRadius;
      }
      
      console.log(`✅ NJ Public Places to Keep Cool data processed:`, {
        count: result.nj_public_places_to_keep_cool_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching NJ Public Places to Keep Cool:', error);
      return {
        nj_public_places_to_keep_cool_all: [],
        nj_public_places_to_keep_cool_count: 0,
        nj_public_places_to_keep_cool_error: 'Error fetching NJ Public Places to Keep Cool data'
      };
    }
  }

  private async getCTBuildingFootprints(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏢 Fetching CT Building Footprints data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      const radiusMiles = radius || 0.25; // Default to 0.25 miles if not provided
      
      // Get building footprint data (both containing and nearby)
      const buildingData = await getCTBuildingFootprintData(lat, lon, radiusMiles);
      
      if (buildingData) {
        // Collect all buildings (containing + nearby) into a single array for CSV export
        const allBuildings: any[] = [];
        
        // Add containing building (point-in-polygon) if found
        if (buildingData.containingBuilding && buildingData.containingBuilding.buildingId) {
          allBuildings.push({
            ...buildingData.containingBuilding.attributes,
            buildingId: buildingData.containingBuilding.buildingId,
            isContaining: true,
            distance_miles: 0,
            geometry: buildingData.containingBuilding.geometry // Include geometry for map drawing
          });
          result.ct_building_footprint_containing = buildingData.containingBuilding.buildingId;
        } else {
          result.ct_building_footprint_containing = null;
          result.ct_building_footprint_containing_message = 'No building found containing this location';
        }
        
        // Add nearby buildings (proximity search)
        if (buildingData.nearbyBuildings && buildingData.nearbyBuildings.length > 0) {
          buildingData.nearbyBuildings.forEach(building => {
            // Only add if it's not already in the array (avoid duplicates)
            if (!allBuildings.some(b => b.buildingId === building.buildingId)) {
              allBuildings.push({
                ...building.attributes,
                buildingId: building.buildingId,
                isContaining: false,
                distance_miles: null, // Distance not calculated in proximity query
                geometry: building.geometry // Include geometry for map drawing
              });
            }
          });
          result.ct_building_footprints_nearby_count = buildingData.nearbyBuildings.length;
        } else {
          result.ct_building_footprints_nearby_count = 0;
        }
        
        // Store all buildings as an array for CSV export (similar to _all_pois pattern)
        result.ct_building_footprints_all = allBuildings;
        result.ct_building_footprints_search_radius_miles = radiusMiles;
      } else {
        result.ct_building_footprint_containing = null;
        result.ct_building_footprints_nearby_count = 0;
        result.ct_building_footprints_all = [];
      }
      
      console.log(`✅ CT Building Footprints data processed:`, {
        containing: result.ct_building_footprint_containing || 'N/A',
        nearbyCount: result.ct_building_footprints_nearby_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching CT Building Footprints:', error);
      return {
        ct_building_footprint_containing: null,
        ct_building_footprints_nearby_count: 0,
        ct_building_footprints_all: [],
        ct_building_footprints_error: 'Error fetching CT Building Footprints data'
      };
    }
  }

  private async getCTRoads(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🛣️ Fetching CT Roads and Trails data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      
      // Use the provided radius, defaulting to 0.5 miles if not specified
      const radiusMiles = radius || 0.5;
      
      const roads = await getCTRoadsData(lat, lon, radiusMiles);
      
      if (roads && roads.length > 0) {
        result.ct_roads_count = roads.length;
        result.ct_roads_all = roads.map(road => ({
          ...road.attributes,
          roadClass: road.roadClass,
          avLegend: road.avLegend,
          imsLegend: road.imsLegend,
          lengthMiles: road.lengthMiles,
          geometry: road.geometry, // Include geometry for map drawing
          distance_miles: road.distance_miles
        }));
      } else {
        result.ct_roads_count = 0;
        result.ct_roads_all = [];
      }
      
      result.ct_roads_search_radius_miles = radiusMiles;
      
      console.log(`✅ CT Roads and Trails data processed:`, {
        count: result.ct_roads_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching CT Roads and Trails:', error);
      return {
        ct_roads_count: 0,
        ct_roads_all: [],
        ct_roads_error: 'Error fetching CT Roads and Trails data'
      };
    }
  }

  private async getCTUrgentCare(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏥 Fetching CT Urgent Care data for [${lat}, ${lon}]${radius ? ` with radius ${radius} miles` : ''}`);
      
      const result: Record<string, any> = {};
      
      // Use the provided radius, defaulting to 5 miles if not specified
      const radiusMiles = radius || 5;
      
      const facilities = await getCTUrgentCareData(lat, lon, radiusMiles);
      
      if (facilities && facilities.length > 0) {
        result.ct_urgent_care_count = facilities.length;
        result.ct_urgent_care_detailed = facilities.map(facility => ({
          id: facility.id,
          name: facility.name,
          address: facility.address,
          city: facility.city,
          state: facility.state,
          zip: facility.zip,
          phone: facility.phone,
          lat: facility.lat,
          lon: facility.lon,
          distance_miles: facility.distance_miles,
          attributes: facility.attributes // Include all attributes for CSV export
        }));
        result.ct_urgent_care_all = facilities; // Include all facilities for CSV export
      } else {
        result.ct_urgent_care_count = 0;
        result.ct_urgent_care_detailed = [];
        result.ct_urgent_care_all = [];
      }
      
      result.ct_urgent_care_search_radius_miles = radiusMiles;
      
      console.log(`✅ CT Urgent Care data processed:`, {
        count: result.ct_urgent_care_count || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error fetching CT Urgent Care:', error);
      return {
        ct_urgent_care_count: 0,
        ct_urgent_care_detailed: [],
        ct_urgent_care_all: [],
        ct_urgent_care_error: 'Error fetching CT Urgent Care data'
      };
    }
  }

  private async getCTDeepProperties(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      console.log(`🏞️ Fetching CT DEEP Properties data for coordinates [${lat}, ${lon}]`);
      
      // Default radius is 5 miles, max is 25 miles
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      
      const propertyData = await getCTDeepPropertyData(lat, lon, radiusMiles);
      
      if (!propertyData) {
        return {
          ct_deep_properties_containing: null,
          ct_deep_properties_containing_message: 'No property found containing this location',
          ct_deep_properties_nearby_count: 0,
          ct_deep_properties_all: [],
          ct_deep_properties_error: 'Error fetching CT DEEP Properties data'
        };
      }
      
      const result: Record<string, any> = {};
      
      // Handle containing property (point-in-polygon)
      if (propertyData.containingProperty) {
        result.ct_deep_properties_containing = propertyData.containingProperty.propertyName || 
                                              propertyData.containingProperty.propertyId || 
                                              'Unknown Property';
        result.ct_deep_properties_containing_message = `Location is within: ${result.ct_deep_properties_containing}`;
      } else {
        result.ct_deep_properties_containing = null;
        result.ct_deep_properties_containing_message = 'No property found containing this location';
      }
      
      // Combine containing and nearby properties for the _all array
      const allProperties: any[] = [];
      
      // Add containing property if it exists
      if (propertyData.containingProperty) {
        allProperties.push({
          ...propertyData.containingProperty,
          isContaining: true,
          distance_miles: 0
        });
      }
      
      // Add nearby properties (excluding the containing one if it exists)
      if (propertyData.nearbyProperties && propertyData.nearbyProperties.length > 0) {
        propertyData.nearbyProperties.forEach(property => {
          // Skip if this is the same as the containing property
          const isSameAsContaining = propertyData.containingProperty && 
                                    property.propertyId === propertyData.containingProperty.propertyId;
          if (!isSameAsContaining) {
            allProperties.push({
              ...property,
              isContaining: false
            });
          }
        });
      }
      
      // Deduplicate by property ID
      const uniqueProperties = new Map<string, any>();
      allProperties.forEach(property => {
        const key = property.propertyId || property.GlobalID || `prop_${Math.random()}`;
        if (!uniqueProperties.has(key)) {
          uniqueProperties.set(key, property);
        }
      });
      
      const deduplicatedProperties = Array.from(uniqueProperties.values());
      
      if (deduplicatedProperties.length > 0) {
        result.ct_deep_properties_nearby_count = deduplicatedProperties.length;
        result.ct_deep_properties_all = deduplicatedProperties;
      } else {
        result.ct_deep_properties_nearby_count = 0;
        result.ct_deep_properties_all = [];
      }
      
      result.ct_deep_properties_search_radius_miles = radiusMiles;
      
      console.log(`✅ CT DEEP Properties data processed:`, {
        containing: result.ct_deep_properties_containing || 'N/A',
        nearbyCount: result.ct_deep_properties_nearby_count || 0
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CT DEEP Properties data:', error);
      return {
        ct_deep_properties_containing: null,
        ct_deep_properties_containing_message: 'No property found containing this location',
        ct_deep_properties_nearby_count: 0,
        ct_deep_properties_all: [],
        ct_deep_properties_error: 'Error fetching CT DEEP Properties data'
      };
    }
  }

  private async getCTTribalLands(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const tribalLandData = await getCTTribalLandData(lat, lon, radiusMiles);
      
      if (!tribalLandData) {
        return {
          ct_tribal_lands_containing: null,
          ct_tribal_lands_containing_message: 'No tribal land found containing this location',
          ct_tribal_lands_nearby_count: 0,
          ct_tribal_lands_all: []
        };
      }
      
      const result: Record<string, any> = {};
      
      if (tribalLandData.containingTribalLand) {
        result.ct_tribal_lands_containing = tribalLandData.containingTribalLand.name || 
                                            tribalLandData.containingTribalLand.tribalLandId || 
                                            'Unknown Tribal Land';
        result.ct_tribal_lands_containing_message = `Location is within: ${result.ct_tribal_lands_containing}`;
        if (tribalLandData.containingTribalLand.recognitionType) {
          result.ct_tribal_lands_containing_recognition = tribalLandData.containingTribalLand.recognitionType;
        }
      } else {
        result.ct_tribal_lands_containing = null;
        result.ct_tribal_lands_containing_message = 'No tribal land found containing this location';
      }
      
      const allTribalLands: any[] = [];
      
      if (tribalLandData.containingTribalLand) {
        allTribalLands.push({
          ...tribalLandData.containingTribalLand.attributes,
          name: tribalLandData.containingTribalLand.name,
          nameLsad: tribalLandData.containingTribalLand.nameLsad,
          recognitionType: tribalLandData.containingTribalLand.recognitionType,
          isContaining: true,
          distance_miles: 0,
          geometry: tribalLandData.containingTribalLand.geometry
        });
      }
      
      if (tribalLandData.nearbyTribalLands && tribalLandData.nearbyTribalLands.length > 0) {
        tribalLandData.nearbyTribalLands.forEach(tribalLand => {
          const isSameAsContaining = tribalLandData.containingTribalLand && 
                                    tribalLand.tribalLandId === tribalLandData.containingTribalLand.tribalLandId;
          if (!isSameAsContaining) {
            allTribalLands.push({
              ...tribalLand.attributes,
              name: tribalLand.name,
              nameLsad: tribalLand.nameLsad,
              recognitionType: tribalLand.recognitionType,
              isContaining: false,
              distance_miles: tribalLand.distance_miles,
              geometry: tribalLand.geometry
            });
          }
        });
      }
      
      const uniqueTribalLands = new Map<string, any>();
      allTribalLands.forEach(tribalLand => {
        const key = tribalLand.tribalLandId || tribalLand.FID || tribalLand.OBJECTID || `tribal_${Math.random()}`;
        if (!uniqueTribalLands.has(key)) {
          uniqueTribalLands.set(key, tribalLand);
        }
      });
      
      const deduplicatedTribalLands = Array.from(uniqueTribalLands.values());
      
      if (deduplicatedTribalLands.length > 0) {
        result.ct_tribal_lands_nearby_count = deduplicatedTribalLands.length;
        result.ct_tribal_lands_all = deduplicatedTribalLands;
      } else {
        result.ct_tribal_lands_nearby_count = 0;
        result.ct_tribal_lands_all = [];
      }
      
      result.ct_tribal_lands_search_radius_miles = radiusMiles;
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CT Tribal Lands:', error);
      return {
        ct_tribal_lands_containing: null,
        ct_tribal_lands_containing_message: 'Error fetching CT Tribal Lands data',
        ct_tribal_lands_nearby_count: 0,
        ct_tribal_lands_all: []
      };
    }
  }

  private async getCTDrinkingWaterWatersheds(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 25) : 5;
      const watershedData = await getCTDrinkingWaterWatershedData(lat, lon, radiusMiles);
      
      if (!watershedData) {
        return {
          ct_drinking_water_watersheds_containing: null,
          ct_drinking_water_watersheds_containing_message: 'No watershed found containing this location',
          ct_drinking_water_watersheds_nearby_count: 0,
          ct_drinking_water_watersheds_all: []
        };
      }
      
      const result: Record<string, any> = {};
      
      if (watershedData.containingWatershed) {
        result.ct_drinking_water_watersheds_containing = watershedData.containingWatershed.pwsName || 
                                                         watershedData.containingWatershed.shed || 
                                                         watershedData.containingWatershed.watershedId || 
                                                         'Unknown Watershed';
        result.ct_drinking_water_watersheds_containing_message = `Location is within: ${result.ct_drinking_water_watersheds_containing}`;
        if (watershedData.containingWatershed.pwsId) {
          result.ct_drinking_water_watersheds_containing_pws_id = watershedData.containingWatershed.pwsId;
        }
        if (watershedData.containingWatershed.status) {
          result.ct_drinking_water_watersheds_containing_status = watershedData.containingWatershed.status;
        }
      } else {
        result.ct_drinking_water_watersheds_containing = null;
        result.ct_drinking_water_watersheds_containing_message = 'No watershed found containing this location';
      }
      
      const allWatersheds: any[] = [];
      
      if (watershedData.containingWatershed) {
        allWatersheds.push({
          ...watershedData.containingWatershed.attributes,
          pwsName: watershedData.containingWatershed.pwsName,
          pwsId: watershedData.containingWatershed.pwsId,
          shed: watershedData.containingWatershed.shed,
          status: watershedData.containingWatershed.status,
          acres: watershedData.containingWatershed.acres,
          isContaining: true,
          distance_miles: 0,
          geometry: watershedData.containingWatershed.geometry
        });
      }
      
      if (watershedData.nearbyWatersheds && watershedData.nearbyWatersheds.length > 0) {
        watershedData.nearbyWatersheds.forEach(watershed => {
          const isSameAsContaining = watershedData.containingWatershed && 
                                    watershed.watershedId === watershedData.containingWatershed.watershedId;
          if (!isSameAsContaining) {
            allWatersheds.push({
              ...watershed.attributes,
              pwsName: watershed.pwsName,
              pwsId: watershed.pwsId,
              shed: watershed.shed,
              status: watershed.status,
              acres: watershed.acres,
              isContaining: false,
              distance_miles: watershed.distance_miles,
              geometry: watershed.geometry
            });
          }
        });
      }
      
      const uniqueWatersheds = new Map<string, any>();
      allWatersheds.forEach(watershed => {
        const key = watershed.watershedId || watershed.FID || watershed.OBJECTID || `watershed_${Math.random()}`;
        if (!uniqueWatersheds.has(key)) {
          uniqueWatersheds.set(key, watershed);
        }
      });
      
      const deduplicatedWatersheds = Array.from(uniqueWatersheds.values());
      
      if (deduplicatedWatersheds.length > 0) {
        result.ct_drinking_water_watersheds_nearby_count = deduplicatedWatersheds.length;
        result.ct_drinking_water_watersheds_all = deduplicatedWatersheds;
      } else {
        result.ct_drinking_water_watersheds_nearby_count = 0;
        result.ct_drinking_water_watersheds_all = [];
      }
      
      result.ct_drinking_water_watersheds_search_radius_miles = radiusMiles;
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CT Drinking Water Watersheds:', error);
      return {
        ct_drinking_water_watersheds_containing: null,
        ct_drinking_water_watersheds_containing_message: 'Error fetching CT Drinking Water Watersheds data',
        ct_drinking_water_watersheds_nearby_count: 0,
        ct_drinking_water_watersheds_all: []
      };
    }
  }

  private async getCTBroadbandAvailability(lat: number, lon: number, radius?: number): Promise<Record<string, any>> {
    try {
      const radiusMiles = radius ? Math.min(radius, 5) : 0.5;
      const broadbandData = await getCTBroadbandAvailabilityData(lat, lon, radiusMiles);
      
      if (!broadbandData) {
        return {
          ct_broadband_availability_containing: null,
          ct_broadband_availability_containing_message: 'No block found containing this location',
          ct_broadband_availability_nearby_count: 0,
          ct_broadband_availability_all: []
        };
      }
      
      const result: Record<string, any> = {};
      
      if (broadbandData.containingBlock) {
        result.ct_broadband_availability_containing = broadbandData.containingBlock.blockName || 
                                                     broadbandData.containingBlock.blockGeoid || 
                                                     broadbandData.containingBlock.blockId || 
                                                     'Unknown Block';
        result.ct_broadband_availability_containing_message = `Location is within: ${result.ct_broadband_availability_containing}`;
        if (broadbandData.containingBlock.blockGeoid) {
          result.ct_broadband_availability_containing_block_geoid = broadbandData.containingBlock.blockGeoid;
        }
        if (broadbandData.containingBlock.pctUnserved !== null) {
          result.ct_broadband_availability_containing_pct_unserved = broadbandData.containingBlock.pctUnserved;
        }
        if (broadbandData.containingBlock.maxDownload !== null) {
          result.ct_broadband_availability_containing_max_download = broadbandData.containingBlock.maxDownload;
        }
      } else {
        result.ct_broadband_availability_containing = null;
        result.ct_broadband_availability_containing_message = 'No block found containing this location';
      }
      
      const allBlocks: any[] = [];
      
      if (broadbandData.containingBlock) {
        allBlocks.push({
          ...broadbandData.containingBlock.attributes,
          blockId: broadbandData.containingBlock.blockId,
          blockGeoid: broadbandData.containingBlock.blockGeoid,
          blockName: broadbandData.containingBlock.blockName,
          totalLocations: broadbandData.containingBlock.totalLocations,
          unserved: broadbandData.containingBlock.unserved,
          underserved: broadbandData.containingBlock.underserved,
          served: broadbandData.containingBlock.served,
          pctUnserved: broadbandData.containingBlock.pctUnserved,
          pctUnderserved: broadbandData.containingBlock.pctUnderserved,
          pctServed: broadbandData.containingBlock.pctServed,
          maxDownload: broadbandData.containingBlock.maxDownload,
          minDownload: broadbandData.containingBlock.minDownload,
          nProviders: broadbandData.containingBlock.nProviders,
          allProviders: broadbandData.containingBlock.allProviders,
          townName: broadbandData.containingBlock.townName,
          countyName: broadbandData.containingBlock.countyName,
          isContaining: true,
          distance_miles: 0,
          geometry: broadbandData.containingBlock.geometry
        });
      }
      
      if (broadbandData.nearbyBlocks && broadbandData.nearbyBlocks.length > 0) {
        broadbandData.nearbyBlocks.forEach(block => {
          const isSameAsContaining = broadbandData.containingBlock && 
                                    block.blockId === broadbandData.containingBlock.blockId;
          if (!isSameAsContaining) {
            allBlocks.push({
              ...block.attributes,
              blockId: block.blockId,
              blockGeoid: block.blockGeoid,
              blockName: block.blockName,
              totalLocations: block.totalLocations,
              unserved: block.unserved,
              underserved: block.underserved,
              served: block.served,
              pctUnserved: block.pctUnserved,
              pctUnderserved: block.pctUnderserved,
              pctServed: block.pctServed,
              maxDownload: block.maxDownload,
              minDownload: block.minDownload,
              nProviders: block.nProviders,
              allProviders: block.allProviders,
              townName: block.townName,
              countyName: block.countyName,
              isContaining: false,
              distance_miles: block.distance_miles,
              geometry: block.geometry
            });
          }
        });
      }
      
      const uniqueBlocks = new Map<string, any>();
      allBlocks.forEach(block => {
        const key = block.blockId || block.blockGeoid || block.OBJECTID || `block_${Math.random()}`;
        if (!uniqueBlocks.has(key)) {
          uniqueBlocks.set(key, block);
        }
      });
      
      const deduplicatedBlocks = Array.from(uniqueBlocks.values());
      
      if (deduplicatedBlocks.length > 0) {
        result.ct_broadband_availability_nearby_count = deduplicatedBlocks.length;
        result.ct_broadband_availability_all = deduplicatedBlocks;
      } else {
        result.ct_broadband_availability_nearby_count = 0;
        result.ct_broadband_availability_all = [];
      }
      
      result.ct_broadband_availability_search_radius_miles = radiusMiles;
      
      console.log(`✅ CT Broadband Availability data processed:`, {
        containing: result.ct_broadband_availability_containing || 'N/A',
        nearbyCount: result.ct_broadband_availability_nearby_count || 0
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching CT Broadband Availability data:', error);
      return {
        ct_broadband_availability_containing: null,
        ct_broadband_availability_containing_message: 'Error fetching CT Broadband Availability data',
        ct_broadband_availability_nearby_count: 0,
        ct_broadband_availability_all: []
      };
    }
  }

  // Electric Charging Stations via OpenChargeMap API
  private async getElectricChargingStations(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🔌 Electric Charging Stations query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      const apiKey = '3b819866-3a12-4dac-8ab1-7648e0a6f533';
      const queryUrl = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=US&latitude=${lat}&longitude=${lon}&distance=${radiusMiles}&maxresults=50&key=${apiKey}`;
      
      console.log(`🔗 OpenChargeMap API URL: ${queryUrl}`);
      const response = await fetch(queryUrl);
      
      if (!response.ok) {
        throw new Error(`OpenChargeMap API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 OpenChargeMap response:`, data);
      
      const stations = data || [];
      const totalStations = stations.length;
      
      // Count by connection type
      const connectionCounts: Record<string, number> = {};
      const levelCounts: Record<string, number> = {};
      
      stations.forEach((station: any) => {
        // Count connection types
        if (station.Connections && Array.isArray(station.Connections)) {
          station.Connections.forEach((conn: any) => {
            const connectionType = conn.ConnectionType?.Title || 'Unknown';
            connectionCounts[connectionType] = (connectionCounts[connectionType] || 0) + 1;
            
            const level = conn.Level?.Title || 'Unknown';
            levelCounts[level] = (levelCounts[level] || 0) + 1;
          });
        }
      });
      
      // Get station details for mapping
      const stationDetails = stations.slice(0, 10).map((station: any) => ({
        id: station.ID,
        name: station.AddressInfo?.Title || 'Unnamed Station',
        address: station.AddressInfo?.AddressLine1 || 'No address',
        city: station.AddressInfo?.Town || 'Unknown city',
        state: station.AddressInfo?.StateOrProvince || 'Unknown state',
        lat: station.AddressInfo?.Latitude,
        lon: station.AddressInfo?.Longitude,
        connections: station.Connections?.length || 0,
        status: station.StatusType?.Title || 'Unknown'
      }));
      
      return {
        poi_electric_charging_count: totalStations,
        poi_electric_charging_connection_types: connectionCounts,
        poi_electric_charging_levels: levelCounts,
        poi_electric_charging_detailed: stationDetails,
        poi_electric_charging_proximity_distance: radiusMiles,
        poi_electric_charging_summary: `Found ${totalStations} electric charging stations within ${radiusMiles} miles with various connection types and charging levels.`
      };
      
    } catch (error) {
      console.error('🔌 Electric Charging Stations query failed:', error);
      return { 
        poi_electric_charging_count: 0,
        poi_electric_charging_error: error instanceof Error ? error.message : String(error) 
      };
    }
  }


  private async getGasStations(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`⛽ Gas Stations query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // Limit radius to prevent timeout - max 10 miles for gas stations
      const maxRadiusMiles = Math.min(radiusMiles, 10);
      const radiusMeters = Math.round(maxRadiusMiles * 1609.34);
      
      // Use POST request with timeout to avoid 504 errors
      const query = `[out:json][timeout:25];
(node["amenity"="fuel"](around:${radiusMeters},${lat},${lon});
 way["amenity"="fuel"](around:${radiusMeters},${lat},${lon});
 relation["amenity"="fuel"](around:${radiusMeters},${lat},${lon});
);
out center;`;

      console.log(`⛽ Overpass query: ${query}`);

      // Try Overpass API with POST and retry logic
      let response;
      try {
        response = await fetchJSONSmart('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8'
          }
        });
      } catch (overpassError) {
        console.warn(`⛽ Primary Overpass API failed, trying alternative server:`, overpassError);
        // Try alternative Overpass server
        try {
          response = await fetchJSONSmart('https://lz4.overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
            headers: {
              'Content-Type': 'text/plain;charset=UTF-8'
            }
          });
        } catch (altError) {
          console.warn(`⛽ Alternative Overpass API also failed:`, altError);
          throw new Error('All Overpass API servers unavailable');
        }
      }

      if (!response || !response.elements) {
        console.warn(`⛽ Invalid response from Overpass API`);
        return {
          poi_gas_stations_summary: 'No gas stations found - invalid API response.',
          poi_gas_stations_detailed: [],
          poi_gas_stations_all: []
        };
      }

      const elements = response.elements || [];
      console.log(`⛽ Overpass returned ${elements.length} gas station elements`);
      
      // Calculate distances and filter by radius
      const stationsWithDistance: any[] = [];
      for (const element of elements) {
        // Get coordinates - nodes have direct lat/lon, ways/relations use center
        let stationLat: number | null = null;
        let stationLon: number | null = null;
        
        if (element.type === 'node') {
          stationLat = element.lat;
          stationLon = element.lon;
        } else if (element.type === 'way' || element.type === 'relation') {
          stationLat = element.center?.lat;
          stationLon = element.center?.lon;
        }
        
        if (stationLat == null || stationLon == null) {
          console.warn(`⛽ Skipping gas station ${element.id} - missing coordinates`);
          continue;
        }
        
        // Calculate distance in miles
        const distanceKm = this.calculateDistance(lat, lon, stationLat, stationLon);
        const distanceMiles = distanceKm * 0.621371;
        
        // Only include stations within the specified radius
        if (Number.isFinite(distanceMiles) && distanceMiles <= radiusMiles) {
          stationsWithDistance.push({
            ...element,
            lat: stationLat,
            lon: stationLon,
            distance_miles: Number(distanceMiles.toFixed(2))
          });
        }
      }
      
      // Sort by distance (closest first)
      stationsWithDistance.sort((a, b) => a.distance_miles - b.distance_miles);
      
      const count = stationsWithDistance.length;
      console.log(`⛽ Found ${count} gas stations within ${radiusMiles} miles (after distance filtering)`);
      
      // Process gas station details for mapping (take top results, already sorted by distance)
      const stationDetails = stationsWithDistance.slice(0, 100).map((element: any) => ({
        id: element.id,
        name: element.tags?.name || element.tags?.brand || 'Unnamed Gas Station',
        brand: element.tags?.brand || 'Unknown',
        address: element.tags?.['addr:street'] || 'No address',
        city: element.tags?.['addr:city'] || 'Unknown city',
        state: element.tags?.['addr:state'] || 'Unknown state',
        lat: element.lat,
        lon: element.lon,
        type: element.type,
        phone: element.tags?.phone,
        website: element.tags?.website,
        self_service: element.tags?.self_service,
        distance_miles: element.distance_miles
      }));
      
      return {
        poi_gas_stations_summary: `Found ${count} gas stations within ${radiusMiles} miles.`,
        poi_gas_stations_detailed: stationDetails,
        poi_gas_stations_all: stationsWithDistance // Include all stations for CSV export
      };
    } catch (error) {
      console.error('Gas Stations query failed:', error);
      return { 
        poi_gas_stations_summary: 'No gas stations found due to error.',
        poi_gas_stations_error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async getCollegesUniversities(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🎓 Colleges & Universities query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      const radiusMeters = Math.round(radiusMiles * 1609.34);
      
      // Build Overpass query based on user's provided query structure
      const query = `[out:json][timeout:50];
(
  node["amenity"~"college|university"](around:${radiusMeters},${lat},${lon});
  way["amenity"~"college|university"](around:${radiusMeters},${lat},${lon});
  relation["amenity"~"college|university"](around:${radiusMeters},${lat},${lon});
  way["landuse"="education"](around:${radiusMeters},${lat},${lon});
  relation["landuse"="education"](around:${radiusMeters},${lat},${lon});
  node["office"="educational_institution"](around:${radiusMeters},${lat},${lon});
  way["office"="educational_institution"](around:${radiusMeters},${lat},${lon});
  relation["office"="educational_institution"](around:${radiusMeters},${lat},${lon});
);
out center;`;
      
      let response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      
      // Fallback to alternative server if first fails
      if (!response.ok) {
        console.log(`🎓 Primary server failed, trying fallback...`);
        response = await fetch(`https://lz4.overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      const elements = data.elements || [];
      console.log(`🎓 Overpass returned ${elements.length} college/university elements`);
      
      // Calculate distances and filter by radius
      const institutionsWithDistance: any[] = [];
      for (const element of elements) {
        // Get coordinates - nodes have direct lat/lon, ways/relations use center
        let instLat: number | null = null;
        let instLon: number | null = null;
        
        if (element.type === 'node') {
          instLat = element.lat;
          instLon = element.lon;
        } else if (element.type === 'way' || element.type === 'relation') {
          instLat = element.center?.lat;
          instLon = element.center?.lon;
        }
        
        if (instLat == null || instLon == null) {
          console.warn(`🎓 Skipping college/university ${element.id} - missing coordinates`);
          continue;
        }
        
        // Calculate distance in miles
        const distanceKm = this.calculateDistance(lat, lon, instLat, instLon);
        const distanceMiles = distanceKm * 0.621371;
        
        // Only include institutions within the specified radius
        if (Number.isFinite(distanceMiles) && distanceMiles <= radiusMiles) {
          institutionsWithDistance.push({
            ...element,
            lat: instLat,
            lon: instLon,
            distance_miles: Number(distanceMiles.toFixed(2))
          });
        }
      }
      
      // Sort by distance (closest first)
      institutionsWithDistance.sort((a, b) => a.distance_miles - b.distance_miles);
      
      const count = institutionsWithDistance.length;
      console.log(`🎓 Found ${count} colleges/universities within ${radiusMiles} miles (after distance filtering)`);
      
      // Process institution details for mapping
      const institutionDetails = institutionsWithDistance.map((element: any) => ({
        id: element.id,
        name: element.tags?.name || 'Unnamed Institution',
        amenity: element.tags?.amenity || 'Unknown',
        office: element.tags?.office || null,
        landuse: element.tags?.landuse || null,
        address: element.tags?.['addr:street'] || null,
        city: element.tags?.['addr:city'] || null,
        state: element.tags?.['addr:state'] || null,
        postcode: element.tags?.['addr:postcode'] || null,
        lat: element.lat,
        lon: element.lon,
        type: element.type,
        phone: element.tags?.phone || null,
        website: element.tags?.website || null,
        email: element.tags?.email || null,
        distance_miles: element.distance_miles,
        tags: element.tags // Include all tags for CSV export
      }));
      
      return {
        poi_colleges_universities_summary: `Found ${count} colleges/universities within ${radiusMiles} miles.`,
        poi_colleges_universities_detailed: institutionDetails,
        poi_colleges_universities_all: institutionsWithDistance // Include all institutions for CSV export
      };
    } catch (error) {
      console.error('Colleges & Universities query failed:', error);
      return { 
        poi_colleges_universities_summary: 'No colleges/universities found due to error.',
        poi_colleges_universities_error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async getMailShipping(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`📮 Mail & Shipping query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      const radiusMeters = Math.round(radiusMiles * 1609.34);
      
      // Simplified query - focus on most common mail/shipping amenities to avoid timeout
      const query = `[out:json];(node["amenity"="post_office"](around:${radiusMeters},${lat},${lon});way["amenity"="post_office"](around:${radiusMeters},${lat},${lon});relation["amenity"="post_office"](around:${radiusMeters},${lat},${lon});node["amenity"="parcel_locker"](around:${radiusMeters},${lat},${lon});way["amenity"="parcel_locker"](around:${radiusMeters},${lat},${lon});relation["amenity"="parcel_locker"](around:${radiusMeters},${lat},${lon}););out center;`;
      
      let response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      
      // Fallback to alternative server if first fails
      if (!response.ok) {
        console.log(`📮 Primary server failed, trying fallback...`);
        response = await fetch(`https://lz4.overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      const elements = data.elements || [];
      console.log(`📮 Overpass returned ${elements.length} mail & shipping elements`);
      
      // Calculate distances and filter by radius
      const locationsWithDistance: any[] = [];
      for (const element of elements) {
        // Get coordinates - nodes have direct lat/lon, ways/relations use center
        let locationLat: number | null = null;
        let locationLon: number | null = null;
        
        if (element.type === 'node') {
          locationLat = element.lat;
          locationLon = element.lon;
        } else if (element.type === 'way' || element.type === 'relation') {
          locationLat = element.center?.lat;
          locationLon = element.center?.lon;
        }
        
        if (locationLat == null || locationLon == null) {
          console.warn(`📮 Skipping mail/shipping location ${element.id} - missing coordinates`);
          continue;
        }
        
        // Calculate distance in miles
        const distanceKm = this.calculateDistance(lat, lon, locationLat, locationLon);
        const distanceMiles = distanceKm * 0.621371;
        
        // Only include locations within the specified radius
        if (Number.isFinite(distanceMiles) && distanceMiles <= radiusMiles) {
          locationsWithDistance.push({
            ...element,
            lat: locationLat,
            lon: locationLon,
            distance_miles: Number(distanceMiles.toFixed(2))
          });
        }
      }
      
      // Sort by distance (closest first)
      locationsWithDistance.sort((a, b) => a.distance_miles - b.distance_miles);
      
      const count = locationsWithDistance.length;
      console.log(`📮 Found ${count} mail & shipping locations within ${radiusMiles} miles (after distance filtering)`);
      
      // Process mail & shipping details for mapping (all items, already sorted by distance)
      const shippingDetails = locationsWithDistance.map((element: any) => ({
        id: element.id,
        name: element.tags?.name || element.tags?.brand || 'Unnamed Shipping Location',
        type: element.tags?.amenity || element.tags?.shop || element.tags?.office || 'shipping',
        brand: element.tags?.brand || element.tags?.operator || 'Unknown',
        address: element.tags?.['addr:street'] || 'No address',
        city: element.tags?.['addr:city'] || 'Unknown city',
        state: element.tags?.['addr:state'] || 'Unknown state',
        lat: element.lat,
        lon: element.lon,
        phone: element.tags?.phone,
        website: element.tags?.website,
        opening_hours: element.tags?.opening_hours,
        distance_miles: element.distance_miles
      }));
      
      console.log(`📮 Mail & Shipping: Returning ${shippingDetails.length} items in poi_mail_shipping_detailed (should match count: ${count})`);
      
      return {
        poi_mail_shipping_summary: `Found ${count} mail & shipping locations within ${radiusMiles} miles.`,
        poi_mail_shipping_detailed: shippingDetails, // All items - no limit
        poi_mail_shipping_all: locationsWithDistance // Include all locations for CSV export
      };
    } catch (error) {
      console.error('Mail & Shipping query failed:', error);
      return { 
        poi_mail_shipping_summary: 'No mail & shipping locations found due to error.',
        poi_mail_shipping_error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async getPCTFeatures(enrichmentId: string, lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🏔️ PCT ${enrichmentId} query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // Extract layer type from enrichment ID (e.g., 'pct_centerline' -> 'centerline')
      const layerType = enrichmentId.replace('pct_', '');
      
      const response = await queryPCTFeatures(layerType, lat, lon, radiusMiles);
      
      if (response.error) {
        return {
          [`${enrichmentId}_error`]: response.error.message || 'Unknown error'
        };
      }
      
      const features = response.features || [];
      const count = features.length;
      
      // Process features into standardized POI format
      const poiFeatures = features.map((feature, index) => {
        let poiLat = lat;
        let poiLon = lon;
        
        // Extract coordinates from geometry
        const geometry = feature.geometry;
        if (geometry) {
          if (geometry.x && geometry.y) {
            // Point geometry
            poiLon = geometry.x;
            poiLat = geometry.y;
          } else if (geometry.paths && geometry.paths.length > 0) {
            // Polyline geometry - use first point of first path
            const firstPath = geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              const [lon, lat] = firstPath[0];
              poiLon = lon;
              poiLat = lat;
            }
          }
        }
        
        return {
          id: feature.attributes.OBJECTID || feature.attributes.FID || index,
          name: feature.attributes.NAME || feature.attributes.TRAIL_NAME || feature.attributes.TOWN_NAME || `PCT ${layerType} ${index + 1}`,
          type: layerType,
          lat: poiLat,
          lon: poiLon,
          distance_miles: feature.distance_miles || 0,
          attributes: feature.attributes
        };
      });
      
      return {
        [`${enrichmentId}_count`]: count,
        [`${enrichmentId}_features`]: poiFeatures,
        [`${enrichmentId}_summary`]: `Found ${count} PCT ${layerType} features within ${radiusMiles} miles.`
      };
      
    } catch (error) {
      console.error(`PCT ${enrichmentId} query failed:`, error);
      return {
        [`${enrichmentId}_error`]: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getOSMPCTFeatures(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🏔️ ===== PCT OSM QUERY STARTED =====`);
      console.log(`🗺️ Querying OSM PCT features within ${radiusMiles} miles of ${lat}, ${lon}`);

      // Increase radius and expand search terms for PCT
      const maxRadiusMiles = Math.min(radiusMiles, 10); // Increased from 2 to 10 miles
      const radiusMeters = Math.round(maxRadiusMiles * 1609.34);
      
      // Comprehensive PCT search with multiple variations
      const overpassQuery = `[out:json][timeout:25];
(
  // PCT name variations
  node["name"="Pacific Crest Trail"](around:${radiusMeters},${lat},${lon});
  node["name"~"Pacific Crest", i](around:${radiusMeters},${lat},${lon});
  node["name"~"PCT", i](around:${radiusMeters},${lat},${lon});
  node["name"~"Pacific Crest Trail", i](around:${radiusMeters},${lat},${lon});
  
  // Trail-related features
  node["highway"="path"](around:${radiusMeters},${lat},${lon});
  node["highway"="footway"](around:${radiusMeters},${lat},${lon});
  node["highway"="track"](around:${radiusMeters},${lat},${lon});
  
  // Amenities that might be PCT-related
  node["amenity"="shelter"](around:${radiusMeters},${lat},${lon});
  node["amenity"="camp_site"](around:${radiusMeters},${lat},${lon});
  node["amenity"="drinking_water"](around:${radiusMeters},${lat},${lon});
  node["trailhead"="yes"](around:${radiusMeters},${lat},${lon});
  node["camp_site"="yes"](around:${radiusMeters},${lat},${lon});
  node["natural"="spring"](around:${radiusMeters},${lat},${lon});
  
  // Tourism features
  node["tourism"="camp_site"](around:${radiusMeters},${lat},${lon});
  node["tourism"="wilderness_hut"](around:${radiusMeters},${lat},${lon});
);
out;`;

      console.log(`🗺️ PCT OSM query: ${overpassQuery}`);
      console.log(`🗺️ PCT OSM query length: ${overpassQuery.length}`);
      console.log(`🗺️ PCT OSM query bytes:`, new TextEncoder().encode(overpassQuery));

      // Try Overpass API with shorter timeout and retry logic (same as AT)
      let response;
      try {
        console.log(`🗺️ Sending PCT OSM query to primary server...`);
        response = await fetchJSONSmart('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpassQuery,
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8'
          }
        });
        console.log(`🗺️ PCT OSM primary server response received:`, response);
      } catch (error) {
        console.log(`🗺️ Primary server failed, trying fallback...`, error);
        response = await fetchJSONSmart('https://lz4.overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpassQuery,
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8'
          }
        });
        console.log(`🗺️ PCT OSM fallback server response received:`, response);
      }
      
      const data = response;
      console.log(`🗺️ PCT OSM data processing:`, data);
      
      console.log(`🔍 PCT OSM response:`, {
        elementCount: data.elements?.length || 0,
        elements: data.elements?.slice(0, 3) // Show first 3 elements for debugging
      });
      
      const elements = data.elements || [];
      const count = elements.length;
      
      // Process OSM PCT features (same as AT processing)
      const osmPOIs = elements.map((element: any) => {
        if (!element.lat || !element.lon) return null;
        
        return {
          id: element.id,
          name: element.tags?.name || 'Unnamed PCT Feature',
          type: element.tags?.amenity || element.tags?.highway || 'pct_feature',
          lat: element.lat,
          lon: element.lon,
          tags: element.tags,
          distance_miles: this.calculateDistance(lat, lon, element.lat, element.lon)
        };
      }).filter((poi: any) => poi !== null);
      
      // Sort by distance
      osmPOIs.sort((a: any, b: any) => a.distance_miles - b.distance_miles);
      
      const result = {
        pct_osm_features_count: count,
        pct_osm_features_features: osmPOIs,
        pct_osm_features_summary: `Found ${count} PCT OSM features within ${maxRadiusMiles} miles.`,
        sampleNames: osmPOIs.slice(0, 3).map((p: any) => p.name)
      };
      
      console.log(`🏔️ PCT OSM final result:`, result);
      return result;
      
    } catch (error) {
      console.error('🏔️ ===== PCT OSM QUERY FAILED =====', error);
      const errorResult = {
        pct_osm_features_error: error instanceof Error ? error.message : 'Unknown error',
        pct_osm_features_summary: 'No PCT OSM features found due to error.'
      };
      console.log(`🏔️ PCT OSM error result:`, errorResult);
      return errorResult;
    }
  }

  // The Location Is Everything Company - Animal-Vehicle Impact (AVI) API
  private async getAnimalVehicleCollisions(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🦌 Animal-Vehicle Impact (AVI) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // Use the working public endpoint with spatial filtering
      // Use local Docker container for development (localhost:8080)
      // In production, it will use api.locationfriend.com
      // IMPORTANT: You need to configure the DNS target for api.locationfriend.com to point to your PostgREST server
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const API_BASE = isLocalhost ? "http://localhost:8080" : "https://api.locationfriend.com";
      
      console.log(`🦌 Using API_BASE: ${API_BASE}`);
      const queryUrl = `${API_BASE}/vehicle_animal_collisions_api`;
      
      // Use simple bounds filtering that your API supports
      const params = new URLSearchParams();
      params.append('select', '*');
      params.append('limit', '5000');
      
      // Add simple lat/lon bounds (much more efficient than fetching all data)
      const latRange = radiusMiles / 69; // Rough conversion: 1 degree ≈ 69 miles
      params.append('lat', `gte.${lat - latRange}`);
      params.append('lat', `lte.${lat + latRange}`);
      params.append('lon', `gte.${lon - latRange}`);
      params.append('lon', `lte.${lon + latRange}`);
      
      const fullUrl = `${queryUrl}?${params.toString()}`;
      console.log(`🔗 Animal-Vehicle Impact (AVI) API with bounds filter: ${fullUrl}`);
      
      // Try direct fetch first, then fall back to CORS proxies if needed
      let data;
      try {
        const response = await fetch(fullUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          headers: { 
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        data = await response.json();
      } catch (directError) {
        // If direct fetch fails due to CORS, try with fetchJSONSmart proxy
        console.log('⚠️ Direct fetch failed, trying CORS proxy...', directError);
        data = await fetchJSONSmart(fullUrl, {
          method: 'GET',
          headers: { 
            'Accept': 'application/json'
          }
        });
      }
      console.log(`📊 Animal-Vehicle Impact (AVI) response:`, data);
      console.log(`📊 First collision record structure:`, data[0]);
      console.log(`📊 Available fields:`, data[0] ? Object.keys(data[0]) : 'No data');
      
      // Debug: Check what source values we're actually getting
      if (Array.isArray(data) && data.length > 0) {
        const allSources = data.map(c => c.source).filter(Boolean);
        console.log(`🦌 ALL SOURCES IN RESPONSE:`, allSources);
        console.log(`🦌 UNIQUE SOURCES:`, [...new Set(allSources)]);
        console.log(`🦌 SAMPLE COLLISION WITH SOURCE:`, data.find(c => c.source));
      }
      
      // Server response may include points outside the requested buffer.
      // Apply precise client-side filtering to guarantee proximity.
      const allCollisions = Array.isArray(data) ? data : [];
      console.log(`🦌 Received ${allCollisions.length} collisions before client-side filtering`);
      
      const collisionsInUserRadius: any[] = [];
      const collisionsForMap: any[] = [];
      const uniqueSources = new Set<string>();
      
      for (const collision of allCollisions) {
        // Extract coordinates
        let collisionLat: number | null = null;
        let collisionLon: number | null = null;
        
        if (collision.geom && collision.geom.coordinates) {
          // PostGIS geometry format: [lon, lat]
          [collisionLon, collisionLat] = collision.geom.coordinates;
        } else if (collision.lat && collision.lon) {
          // Direct lat/lon format
          collisionLat = collision.lat;
          collisionLon = collision.lon;
        }
        
        if (!collisionLat || !collisionLon) continue; // Skip invalid coordinates
        
        const distanceMiles = this.calculateDistance(lat, lon, collisionLat, collisionLon) * 0.621371;
        if (!Number.isFinite(distanceMiles)) {
          continue;
        }

        if (distanceMiles > radiusMiles) {
          continue;
        }

        // Add to source tracking
        if (collision.source) {
          uniqueSources.add(collision.source);
        }
        
        const collisionRecord = {
          ...collision,
          lat: collisionLat,
          lon: collisionLon,
          distance_miles: Number(distanceMiles.toFixed(2)),
        };

        collisionsInUserRadius.push({
          ...collisionRecord,
        });
        
        collisionsForMap.push(collisionRecord);
      }
      
      const totalCollisions = collisionsInUserRadius.length;
      const mapCollisions = collisionsForMap.length;
      console.log(`📍 Found ${totalCollisions} collisions within ${radiusMiles} miles (user proximity) for CSV export`);
      console.log(`📍 Found ${mapCollisions} collisions within ${radiusMiles} miles for map display (before limit)`);
      
      // Convert Set to array for display
      const uniqueSourcesArray = Array.from(uniqueSources);
      const sourceSummary = uniqueSourcesArray.length > 0 ? uniqueSourcesArray.join(', ') : 'No source data available';
      
      console.log(`🦌 Raw collisions in user radius:`, collisionsInUserRadius.length);
      console.log(`🦌 Sources from collisions:`, collisionsInUserRadius.map(c => c.source));
      console.log(`🦌 Unique sources found:`, uniqueSourcesArray);
      console.log(`🦌 Source summary:`, sourceSummary);
      
      // Create individual source entries for each collision to ensure they appear in popup
      const sourceEntries = collisionsInUserRadius.map((collision: any) => ({
        key: 'poi_animal_vehicle_collisions_source',
        value: collision.source || 'Unknown'
      }));
      
      // Create detailed POI data for mapping (sorted by distance for clarity)
      // Use collisionsInUserRadius as the source to ensure consistency with all_pois
      // No limit for Animal-Vehicle Collisions - show all features
      const collisionDetails = collisionsInUserRadius
        .map((collision: any, index: number) => ({
          id: `collision_${collision.id || index}`,
          name: `Animal-Vehicle Impact (AVI)`,
          description: `Collision record from ${collision.source || 'FARS'} database`,
          lat: collision.lat,
          lon: collision.lon,
          crash_year: collision.crash_year,
          source: collision.source,
          st_case: collision.st_case,
          distance_miles: collision.distance_miles,
          // Include all original fields
          ...collision
        }))
        .sort((a: any, b: any) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
      
      // Create a result structure that matches the expected POI format
      // Use collisionsInUserRadius for all arrays to ensure consistency
      const result = {
        count: totalCollisions, // Total count for CSV export (user proximity) - KEEP ORIGINAL STRUCTURE
        poi_animal_vehicle_collisions_count: totalCollisions, // Count field for display - matches all_pois length
        elements: collisionDetails, // Elements for map display (sorted by distance, all features) - same source as all_pois
        detailed_pois: collisionDetails, // Detailed POIs for map (sorted by distance, all features) - same source as all_pois
        all_pois: collisionsInUserRadius, // ALL POIs for CSV export and summary form (user proximity, all features)
        poi_animal_vehicle_collisions_source: sourceSummary, // ADD SOURCE FIELD WITHOUT BREAKING EXISTING CODE
        source_entries: sourceEntries, // ADD INDIVIDUAL SOURCE ENTRIES FOR POPUP DISPLAY
        summary: `Found ${totalCollisions} animal-vehicle impact (AVI) records within ${radiusMiles} miles from The Location Is Everything Company database.`,
        api_source: 'https://api.locationfriend.com/vehicle_animal_collisions_api'
      };
      
      // Verify consistency - all arrays should have the same length
      console.log(`🦌 AVI Result Verification:`, {
        totalCollisions,
        count: result.count,
        poi_animal_vehicle_collisions_count: result.poi_animal_vehicle_collisions_count,
        elementsLength: result.elements.length,
        detailedPoisLength: result.detailed_pois.length,
        allPoisLength: result.all_pois.length,
        collisionsInUserRadiusLength: collisionsInUserRadius.length,
        collisionDetailsLength: collisionDetails.length,
        allMatch: result.elements.length === result.all_pois.length && result.all_pois.length === totalCollisions
      });
      
      console.log(`🦌 Returning AVI result:`, result);
      console.log(`🦌 Source field value:`, result.poi_animal_vehicle_collisions_source);
      
      return result;
      
    } catch (error) {
      console.error('🦌 Animal-Vehicle Impact (AVI) query failed:', error);
      return { 
        count: 0, 
        elements: [], 
        detailed_pois: [], 
        all_pois: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        api_source: 'https://api.locationfriend.com/vehicle_animal_collisions_api'
      };
    }
  }

  // NIFC/Esri Current Wildfires API
  private async getWildfires(lat: number, lon: number, radiusMiles: number): Promise<Record<string, any>> {
    try {
      console.log(`🔥 Current Wildfires query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);
      
      // WFIGS Current Wildfire Incidents service (working service)
      const API_BASE = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query";
      
      // Build query parameters for proximity search
      const params = new URLSearchParams({
        where: '1=1',
        geometry: `${lon},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        distance: radiusMiles.toString(),
        units: 'esriSRUnit_StatuteMile',
        outFields: 'IncidentName,POOState,PercentContained,FireDiscoveryDateTime,IRWINID,ContainmentDateTime,IncidentSize,IncidentTypeCategory',
        returnGeometry: 'true',
        f: 'json'
      });
      
      const queryUrl = `${API_BASE}?${params.toString()}`;
      console.log(`🔗 WFIGS Wildfires API URL: ${queryUrl}`);
      
      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`WFIGS Wildfires API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 WFIGS Wildfires response:`, data);
      
      // Handle the response data structure
      const features = data.features || [];
      console.log(`🔥 Received ${features.length} wildfire incidents from WFIGS API`);
      
      // Process wildfire incidents
      const wildfires: any[] = [];
      const wildfireDetails: any[] = [];
      
      features.forEach((feature: any, index: number) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        // Extract coordinates (ArcGIS returns different geometry types)
        let fireLat: number | null = null;
        let fireLon: number | null = null;
        
        if (geometry) {
          if (geometry.x && geometry.y) {
            // Point geometry
            fireLon = geometry.x;
            fireLat = geometry.y;
          } else if (geometry.rings && geometry.rings.length > 0) {
            // Polygon geometry - use centroid of first ring
            const ring = geometry.rings[0];
            if (ring.length > 0) {
              fireLon = ring[0][0];
              fireLat = ring[0][1];
            }
          }
        }
        
        if (!fireLat || !fireLon) {
          console.warn(`🔥 Skipping wildfire with invalid coordinates:`, attributes);
          return;
        }
        
        // Calculate distance for display
        const distanceKm = this.calculateDistance(lat, lon, fireLat, fireLon);
        const distanceMiles = distanceKm * 0.621371;
        
        // Format dates
        const discoveryDate = attributes.FireDiscoveryDateTime ? 
          new Date(attributes.FireDiscoveryDateTime).toLocaleDateString() : 'Unknown';
        const containmentDate = attributes.ContainmentDateTime ? 
          new Date(attributes.ContainmentDateTime).toLocaleDateString() : 'Ongoing';
        
        // Create wildfire record
        const wildfire = {
          id: attributes.IRWINID || `wildfire_${index}`,
          name: attributes.IncidentName || 'Unnamed Fire',
          state: attributes.POOState || 'Unknown',
          containment: attributes.PercentContained || 0,
          discovery_date: discoveryDate,
          containment_date: containmentDate,
          size_acres: attributes.IncidentSize || 'Unknown',
          incident_type: attributes.IncidentTypeCategory || 'Wildfire',
          lat: fireLat,
          lon: fireLon,
          distance_miles: distanceMiles.toFixed(2)
        };
        
        wildfires.push(wildfire);
        
        // Create detailed POI data for mapping
        wildfireDetails.push({
          id: wildfire.id,
          name: wildfire.name,
          description: `${wildfire.incident_type} - ${wildfire.containment}% contained, discovered ${wildfire.discovery_date}`,
          lat: fireLat,
          lon: fireLon,
          distance_miles: wildfire.distance_miles,
          containment: wildfire.containment,
          size_acres: wildfire.size_acres,
          state: wildfire.state,
          discovery_date: wildfire.discovery_date
        });
      });
      
      const totalWildfires = wildfires.length;
      console.log(`📍 Found ${totalWildfires} wildfire incidents within ${radiusMiles} miles`);
      
      // Create result structure
      const result = {
        count: totalWildfires,
        elements: wildfires,
        detailed_pois: wildfireDetails,
        all_pois: wildfires,
        poi_wildfires_count: totalWildfires,
        poi_wildfires_proximity_distance: radiusMiles
      };
      
      console.log(`🔥 Wildfire query completed:`, {
        totalIncidents: totalWildfires,
        sampleNames: wildfires.slice(0, 3).map(w => w.name)
      });
      
      return result;
      
    } catch (error) {
      console.error('🔥 NIFC Wildfires query failed:', error);
      return { 
        count: 0,
        elements: [],
        detailed_pois: [],
        all_pois: [],
        poi_wildfires_count: 0
      };
    }
  }

  /**
   * Query OpenStreetMap Appalachian Trail features using Overpass API
   */
  private async getOSMATFeatures(
    lat: number,
    lon: number,
    radiusMiles: number
  ): Promise<Record<string, any>> {
    try {
      console.log(`🗺️ Querying OSM AT features within ${radiusMiles} miles of ${lat}, ${lon}`);

      // Limit radius to prevent timeout - max 2 miles for OSM queries
      const maxRadiusMiles = Math.min(radiusMiles, 2);
      const radiusMeters = Math.round(maxRadiusMiles * 1609.34);
      
      // Simplified Overpass API query - more efficient, shorter timeout
      const overpassQuery = `[out:json][timeout:15];
(
  // AT nodes only - most efficient query
  node["name"="Appalachian Trail"](around:${radiusMeters},${lat},${lon});
  node["amenity"="shelter"]["name"~"Appalachian Trail"](around:${radiusMeters},${lat},${lon});
);
out;`;

      console.log(`🗺️ OSM query: ${overpassQuery}`);

      // Try Overpass API with shorter timeout and retry logic
      let response;
      try {
        response = await fetchJSONSmart('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpassQuery,
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8'
          }
        });
      } catch (overpassError) {
        console.warn(`🗺️ Primary Overpass API failed, trying alternative server:`, overpassError);
        // Try alternative Overpass server
        try {
          response = await fetchJSONSmart('https://lz4.overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery,
            headers: {
              'Content-Type': 'text/plain;charset=UTF-8'
            }
          });
        } catch (altError) {
          console.warn(`🗺️ Alternative Overpass API also failed:`, altError);
          throw new Error('All Overpass API servers unavailable');
        }
      }

      if (!response || !response.elements) {
        console.log('🗺️ No OSM AT features found');
        return {
          'at_osm_features_count_5mi': 0,
          'at_osm_features_all_pois': [],
          'at_osm_features_detailed': []
        };
      }

      // Process OSM elements into POI format (simplified for nodes only)
      const osmPOIs = response.elements.map((element: any) => {
        // Only process nodes (simplified query)
        if (element.type !== 'node' || !element.lat || !element.lon) {
          console.warn('🗺️ Skipping invalid OSM element:', element);
          return null;
        }

        const poiLat = element.lat;
        const poiLon = element.lon;
        
        // Extract name from tags
        let name = 'AT Feature';
        if (element.tags) {
          name = element.tags.name || element.tags['name:en'] || element.tags.ref || 'AT Feature';
        }

        // Calculate distance
        const distanceMiles = this.calculateDistance(lat, lon, poiLat, poiLon);

        return {
          id: `osm_at_${element.type}_${element.id}`,
          name: name,
          lat: poiLat,
          lon: poiLon,
          distance_miles: distanceMiles,
          type: element.type.toUpperCase(),
          source: 'OpenStreetMap',
          osm_id: element.id,
          osm_type: element.type,
          tags: element.tags || {}
        };
      }).filter((poi: any) => poi !== null);

      const count = osmPOIs.length;
      console.log(`🗺️ Found ${count} OSM AT features`);

      // Create result structure
      const result = {
        [`at_osm_features_count_${radiusMiles}mi`]: count,
        [`at_osm_features_all_pois`]: osmPOIs,
        [`at_osm_features_detailed`]: osmPOIs,
        [`at_osm_features_elements`]: osmPOIs
      };

      console.log(`🗺️ OSM AT query completed:`, {
        count,
        sampleNames: osmPOIs.slice(0, 3).map((p: any) => p.name),
        resultKeys: Object.keys(result)
      });

      return result;

    } catch (error) {
      console.error(`🗺️ OSM AT query failed:`, error);
      
      // If Overpass API fails, try alternative approach or return empty results gracefully
      console.log(`🗺️ Falling back to empty OSM AT results due to API error`);
      return {
        [`at_osm_features_count_${radiusMiles}mi`]: 0,
        [`at_osm_features_all_pois`]: [],
        [`at_osm_features_detailed`]: [],
        [`at_osm_features_error`]: 'OSM API temporarily unavailable'
      };
    }
  }

  /**
   * Query Appalachian Trail features
   */
  private async getATFeatures(
    enrichmentId: string,
    lat: number,
    lon: number,
    radiusMiles: number
  ): Promise<Record<string, any>> {
    try {
      console.log(`🏔️ Querying AT features for ${enrichmentId} within ${radiusMiles} miles of ${lat}, ${lon}`);
      
      const features = await queryATFeatures(enrichmentId, lat, lon, radiusMiles);
      
      if (!features || features.length === 0) {
        console.log(`🏔️ No AT features found for ${enrichmentId}`);
        return {
          [`${enrichmentId}_count_${radiusMiles}mi`]: 0,
          [`${enrichmentId}_all_pois`]: [],
          [`${enrichmentId}_detailed`]: []
        };
      }

      // Process features into POI format
      const atPOIs = features.map((feature, index) => {
        const attributes = feature.attributes;
        const geometry = feature.geometry;
        
        // Extract coordinates
        let poiLat: number | null = null;
        let poiLon: number | null = null;
        
        if (geometry) {
          if (geometry.x && geometry.y) {
            // Point geometry (facilities)
            poiLon = geometry.x;
            poiLat = geometry.y;
          } else if (geometry.paths && geometry.paths.length > 0) {
            // Polyline geometry (centerline) - use first point of first path
            const firstPath = geometry.paths[0];
            if (firstPath && firstPath.length > 0) {
              const [lon, lat] = firstPath[0];
              poiLon = lon;
              poiLat = lat;
            }
          }
        }
        
        if (!poiLat || !poiLon) {
          console.warn(`🏔️ Skipping AT feature with invalid coordinates:`, attributes);
          return null;
        }
        
        // Create POI record
        const poi = {
          id: attributes.OBJECTID || attributes.FID || `at_${enrichmentId}_${index}`,
          name: attributes.NAME || attributes.FACILITY_NAME || attributes.TRAIL_NAME || `AT ${enrichmentId.replace('at_', '').replace('_', ' ')}`,
          lat: poiLat,
          lon: poiLon,
          distance_miles: feature.distance_miles || 0,
          type: enrichmentId.replace('at_', '').replace('_', ' ').toUpperCase(),
          source: 'Appalachian Trail Conservancy',
          ...attributes // Include all original attributes
        };
        
        return poi;
      }).filter(poi => poi !== null);

      const count = atPOIs.length;
      console.log(`🏔️ Found ${count} AT features for ${enrichmentId}`);
      
      // Create result structure
      const result = {
        [`${enrichmentId}_count_${radiusMiles}mi`]: count,
        [`${enrichmentId}_all_pois`]: atPOIs,
        [`${enrichmentId}_detailed`]: atPOIs,
        [`${enrichmentId}_elements`]: atPOIs
      };
      
      console.log(`🏔️ AT query completed for ${enrichmentId}:`, {
        count,
        sampleNames: atPOIs.slice(0, 3).map(p => p.name),
        resultKeys: Object.keys(result)
      });
      
      return result;
      
    } catch (error) {
      console.error(`🏔️ AT query failed for ${enrichmentId}:`, error);
      return {
        [`${enrichmentId}_count_${radiusMiles}mi`]: 0,
        [`${enrichmentId}_all_pois`]: [],
        [`${enrichmentId}_detailed`]: []
      };
    }
  }
}