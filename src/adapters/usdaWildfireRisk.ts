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
  
  source?: string;
  error?: string;
}

export async function getUSDAWildfireRiskData(lat: number, lon: number): Promise<USDAWildfireRiskResponse> {
  try {
    console.log(`🔥 Fetching USDA Wildfire Risk data for coordinates: [${lat}, ${lon}]`);
    
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
    
    // Fetch Wildfire Hazard Potential data (default layer)
    try {
      const params = new URLSearchParams({
        f: 'json',
        geometry: `${lon},${lat}`,
        geometryType: 'esriGeometryPoint',
        sr: '4326',
        imageDisplay: '400,400,96',
        mapExtent: `${lon},${lat},${lon},${lat}`,
        tolerance: '1',
        returnGeometry: 'false',
        returnCatalogItems: 'false'
      });
      
      const response = await fetch(`${endpoints.wildfireHazardPotential}?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        console.log('🔥 Wildfire Hazard Potential API Response:', data);
        
        if (data.value && data.value !== 'NoData') {
          const value = parseFloat(data.value);
          result.whp = value;
          result.whp_label = getHazardPotentialLabel(value);
          
          console.log(`🔥 Wildfire Hazard Potential: ${value} (${result.whp_label})`);
        } else {
          console.log('🔥 No wildfire data available for this location');
        }
      } else {
        console.warn('⚠️ Wildfire API request failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch Wildfire Hazard Potential:', error);
    }
    
    // Fetch Housing Unit Risk data (comprehensive housing and population risk)
    try {
      const params = new URLSearchParams({
        f: 'json',
        geometry: `${lon},${lat}`,
        geometryType: 'esriGeometryPoint',
        sr: '4326',
        imageDisplay: '400,400,96',
        mapExtent: `${lon},${lat},${lon},${lat}`,
        tolerance: '1',
        returnGeometry: 'false',
        returnCatalogItems: 'false'
      });
      
      const housingResponse = await fetch(`${endpoints.housingUnitRisk}?${params.toString()}`);
      if (housingResponse.ok) {
        const housingData = await housingResponse.json();
        console.log('🏠 Housing Unit Risk API Response:', housingData);
        
        if (housingData.value && housingData.value !== 'NoData') {
          const value = parseFloat(housingData.value);
          
          // For now, store as housing unit risk (this service contains multiple datasets)
          // We can expand this to fetch specific raster functions for different housing metrics
          result.housing_unit_risk = value;
          
          console.log(`🏠 Housing Unit Risk: ${value}`);
        } else {
          console.log('🏠 No housing unit risk data available for this location');
        }
      } else {
        console.warn('⚠️ Housing Unit Risk API request failed:', housingResponse.status, housingResponse.statusText);
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch Housing Unit Risk:', error);
    }
    
    // Fetch Population Count with proper ImageServer identify parameters (legacy)
    try {
      const params = new URLSearchParams({
        f: 'json',
        geometry: `${lon},${lat}`,
        geometryType: 'esriGeometryPoint',
        sr: '4326',
        imageDisplay: '400,400,96',
        mapExtent: `${lon},${lat},${lon},${lat}`,
        tolerance: '1',
        returnGeometry: 'false',
        returnCatalogItems: 'false'
      });
      
      const popResponse = await fetch(`${endpoints.popCount}?${params.toString()}`);
      if (popResponse.ok) {
        const popData = await popResponse.json();
        if (popData.value && popData.value !== 'NoData') {
          result.pop_count = parseFloat(popData.value);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch Population Count:', error);
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


