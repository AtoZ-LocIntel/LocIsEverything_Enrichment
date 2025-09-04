// USDA Wildfire Risk to Communities (WRC) API Adapter
// Fetches wildfire risk data from USDA Forest Service

interface USDAWildfireRiskResponse {
  // Fire Behavior Risk
  whp?: number | null;
  whp_label?: string | null;
  bp?: number | null;
  bp_percentage?: number | null;
  cfl?: number | null;
  cfl_label?: string | null;
  rps?: number | null;
  cRPS?: number | null;
  exposure_type?: number | null;
  exposure_label?: string | null;
  flep4?: number;
  flep8?: number;
  
  // Population & Housing Risk
  pop_count?: number;
  pop_density?: number;
  building_count?: number;
  building_density?: number;
  building_coverage?: number;
  housing_unit_count?: number;
  housing_unit_density?: number;
  housing_unit_exposure?: number;
  housing_unit_impact?: number;
  housing_unit_risk?: number;
  
  // Proximity information
  proximity_note?: string;
  
  source?: string;
  error?: string;
}

export async function getUSDAWildfireRiskData(lat: number, lon: number): Promise<USDAWildfireRiskResponse> {
  try {
    console.log(`🔥🔥🔥 USDA WILDFIRE RISK FUNCTION CALLED - coordinates: [${lat}, ${lon}]`);
    
    // Prevent automatic/test calls - require valid coordinates
    if (!lat || !lon || isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      console.warn('⚠️ Invalid coordinates provided to wildfire function');
      return {
        whp: null,
        whp_label: null,
        bp: null,
        bp_percentage: null,
        cfl: null,
        cfl_label: null,
        rps: null,
        cRPS: null,
        exposure_type: null,
        exposure_label: null,
        source: 'USDA Forest Service - Wildfire Risk to Communities',
        error: 'Invalid coordinates provided'
      };
    }
    
    // Define the ImageServer endpoints we have available
    const endpoints = {
      // Comprehensive Fire Behavior Risk (2024 version - contains all core datasets)
      wildfireHazardPotential: 'https://imagery.geoplatform.gov/iipp/rest/services/Fire_Aviation/USFS_EDW_RMRS_WRC_WildfireHazardPotential/ImageServer/identify',
      
      // Housing Unit Risk (comprehensive housing and population risk data)
      housingUnitRisk: 'https://imagery.geoplatform.gov/iipp/rest/services/Fire_Aviation/USFS_EDW_RMRS_WRC_HousingUnitRisk/ImageServer/identify',
      
      // Population & Housing Risk (legacy - keeping for compatibility)
      popCount: 'https://imagery.geoplatform.gov/iipp/rest/services/Fire_Aviation/USFS_EDW_RMRS_WRC_PopulationCount/ImageServer/identify'
    };
    
    const result: USDAWildfireRiskResponse = {
      source: 'USDA Forest Service - Wildfire Risk to Communities (ImageServer)'
    };

    // First try the exact coordinates
    let exactData = await fetchWildfireData(endpoints.wildfireHazardPotential, lat, lon);
    if (exactData && exactData.value && exactData.value !== 'NoData') {
      const value = parseFloat(exactData.value);
      result.whp = value;
      result.whp_label = getHazardPotentialLabel(value);
      console.log(`🔥 Exact location - Wildfire Hazard Potential: ${value} (${result.whp_label})`);
    } else {
      console.log('🔥 No data at exact location');
    }
    

    
    // Fetch Housing Unit Risk and Population Count in parallel for better performance
    const [housingData, popData] = await Promise.allSettled([
      fetchWildfireData(endpoints.housingUnitRisk, lat, lon),
      fetchWildfireData(endpoints.popCount, lat, lon)
    ]);
    
    // Process Housing Unit Risk data
    if (housingData.status === 'fulfilled' && housingData.value && housingData.value.value && housingData.value.value !== 'NoData') {
      const value = parseFloat(housingData.value.value);
      result.housing_unit_risk = value;
      console.log(`🏠 Housing Unit Risk: ${value}`);
    } else {
      console.log('🏠 No housing unit risk data available for this location');
    }
    
    // Process Population Count data
    if (popData.status === 'fulfilled' && popData.value && popData.value.value && popData.value.value !== 'NoData') {
      result.pop_count = parseFloat(popData.value.value);
      console.log(`👥 Population Count: ${result.pop_count}`);
    } else {
      console.log('👥 No population count data available for this location');
    }
    
    // Check if we got any data
    const hasData = Object.keys(result).some(key => 
      key !== 'source' && key !== 'error' && result[key as keyof USDAWildfireRiskResponse] !== undefined
    );
    
    if (!hasData) {
      console.warn('⚠️ No wildfire risk data found for this location');
      return {
        source: 'USDA Forest Service - Wildfire Risk to Communities',
        error: 'No data available for this location'
      };
    }

    console.log('✅ USDA Wildfire Risk data retrieved successfully:', result);
    return result;

  } catch (error) {
    console.error('❌ Error fetching USDA Wildfire Risk data:', error);
    return {
      source: 'USDA Forest Service - Wildfire Risk to Communities',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function getHazardPotentialLabel(whp: number): string {
  if (whp >= 4.5) return 'Very High';
  if (whp >= 3.5) return 'High';
  if (whp >= 2.5) return 'Moderate';
  if (whp >= 1.5) return 'Low';
  return 'Very Low';
}

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

// Helper function to fetch wildfire data for a specific coordinate
async function fetchWildfireData(endpoint: string, lat: number, lon: number): Promise<any> {
  try {
    // Use proper geometry format for ImageServer
    const geometry = {
      "x": lon,
      "y": lat,
      "spatialReference": {"wkid": 4326}
    };
    
    const params = new URLSearchParams({
      f: 'json',
      geometry: JSON.stringify(geometry),
      geometryType: 'esriGeometryPoint',
      sr: '4326',
      imageDisplay: '400,400,96',
      mapExtent: `${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}`,
      tolerance: '1',
      returnGeometry: 'false',
      returnCatalogItems: 'false'
    });
    
    const url = `${endpoint}?${params.toString()}`;
    console.log(`🌐 USDA API Call: ${url}`);
    
    // Use fetchJSONSmart with CORS proxy support
    const data = await fetchJSONSmart(url);
    console.log(`📊 USDA API Response:`, data);
    
    return data;
  } catch (error) {
    console.warn('⚠️ Failed to fetch USDA wildfire data:', error);
    return null;
  }
}






