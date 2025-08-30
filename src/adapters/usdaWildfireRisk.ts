// USDA Wildfire Risk to Communities (WRC) API Adapter
// Fetches wildfire risk data from USDA Forest Service

interface USDAWildfireRiskResponse {
  // Fire Behavior Risk
  whp?: number;
  whp_label?: string;
  bp?: number;
  bp_percentage?: number;
  cfl?: number;
  cfl_label?: string;
  rps?: number;
  cRPS?: number;
  exposure_type?: number;
  exposure_label?: string;
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
      console.log('🔥 No data at exact location, checking proximity...');
      
      // If no data at exact location, check nearby points in a grid pattern
      const proximityData = await checkProximityForWildfireRisk(endpoints.wildfireHazardPotential, lat, lon);
      if (proximityData) {
        result.whp = proximityData.value;
        result.whp_label = getHazardPotentialLabel(proximityData.value);
        result.proximity_note = `Data found ${proximityData.distance.toFixed(1)} miles away`;
        console.log(`🔥 Proximity data found - Wildfire Hazard Potential: ${proximityData.value} (${result.whp_label}) at ${proximityData.distance.toFixed(1)} miles`);
      }
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

// Helper function to check proximity for wildfire risk data
async function checkProximityForWildfireRisk(endpoint: string, centerLat: number, centerLon: number): Promise<{value: number, distance: number} | null> {
  console.log('🔍🔍🔍 PROXIMITY SEARCH STARTED - Checking proximity for wildfire risk data...');
  
  // Optimized proximity search - fewer, smarter API calls
  const searchRadii = [2, 5, 10, 20]; // Reduced from 6 to 4 radii
  const degreesPerMile = 0.0145;
  
  for (const radiusMiles of searchRadii) {
    const radiusDegrees = radiusMiles * degreesPerMile;
    
    // Create a smaller, smarter grid - only check cardinal and diagonal directions
    const directions = [
      { lat: radiusDegrees, lon: 0 },           // North
      { lat: -radiusDegrees, lon: 0 },          // South  
      { lat: 0, lon: radiusDegrees },           // East
      { lat: 0, lon: -radiusDegrees },          // West
      { lat: radiusDegrees * 0.7, lon: radiusDegrees * 0.7 },   // Northeast
      { lat: radiusDegrees * 0.7, lon: -radiusDegrees * 0.7 },  // Northwest
      { lat: -radiusDegrees * 0.7, lon: radiusDegrees * 0.7 },  // Southeast
      { lat: -radiusDegrees * 0.7, lon: -radiusDegrees * 0.7 }  // Southwest
    ];
    
    console.log(`🔍 Checking 8 directions within ${radiusMiles} miles...`);
    
    // Check all directions in parallel for this radius
    const promises = directions.map(async (dir) => {
      const testLat = centerLat + dir.lat;
      const testLon = centerLon + dir.lon;
      
      console.log(`🎯 Testing coordinates: [${testLat.toFixed(6)}, ${testLon.toFixed(6)}] (${radiusMiles} miles)`);
      
      const data = await fetchWildfireData(endpoint, testLat, testLon);
      if (data && data.value && data.value !== 'NoData') {
        const value = parseFloat(data.value);
        const distance = calculateDistance(centerLat, centerLon, testLat, testLon);
        console.log(`✅ Found data at [${testLat.toFixed(6)}, ${testLon.toFixed(6)}]: ${value}`);
        return { value, distance };
      }
      return null;
    });
    
    const results = await Promise.allSettled(promises);
    
    // Find the first valid result
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        console.log(`🔥 Found wildfire data at ${result.value.distance.toFixed(1)} miles: ${result.value.value} (${getHazardPotentialLabel(result.value.value)})`);
        return result.value;
      }
    }
  }
  
  console.log('🔍 No wildfire risk data found within 25 miles');
  return null;
}

// Helper function to calculate distance between two points in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


