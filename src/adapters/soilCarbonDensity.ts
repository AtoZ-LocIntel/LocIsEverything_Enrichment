// World Soils 250m Organic Carbon Density (ISRIC Soilgrids via ESRI Living Atlas)
// Fetches soil organic carbon density data from ESRI Living Atlas ImageServer

interface SoilCarbonDensityResponse {
  organic_carbon_density?: number | null;
  organic_carbon_density_units?: string;
  source?: string;
  error?: string;
}

export async function getSoilCarbonDensityData(lat: number, lon: number): Promise<SoilCarbonDensityResponse> {
  try {
    console.log(`🌱 Fetching Soil Organic Carbon Density data for coordinates: [${lat}, ${lon}]`);
    
    // Prevent invalid coordinates
    if (!lat || !lon || isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      console.warn('⚠️ Invalid coordinates provided to soil carbon density function');
      return {
        organic_carbon_density: null,
        organic_carbon_density_units: 'kg/m²',
        source: 'ISRIC Soilgrids via ESRI Living Atlas',
        error: 'Invalid coordinates provided'
      };
    }
    
    // ESRI Living Atlas ImageServer endpoint for World Soils 250m Organic Carbon Density
    // Note: The identify endpoint might need to be called differently for tiled image services
    const baseUrl = 'https://tiledimageservices.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/WorldSoils250mOrganicCarbonDensity/ImageServer';
    const endpoint = `${baseUrl}/identify`;
    
    const result: SoilCarbonDensityResponse = {
      organic_carbon_density_units: 'kg/m²',
      source: 'ISRIC Soilgrids via ESRI Living Atlas - World Soils 250m Organic Carbon Density'
    };

    // Fetch data using the identify endpoint (point-in-pixel query)
    const data = await fetchSoilData(endpoint, lat, lon);
    
    // Log the full response for debugging
    console.log('🌱 Full identify response:', JSON.stringify(data, null, 2));
    console.log('🌱 Response type:', typeof data);
    console.log('🌱 Response keys:', data ? Object.keys(data) : 'null');
    
    // Handle different possible response structures
    let carbonDensityValue = null;
    
    if (data) {
      // Check for error first
      if (data.error) {
        console.error('🌱 API returned error:', data.error);
        return {
          organic_carbon_density: null,
          organic_carbon_density_units: 'kg/m²',
          source: 'ISRIC Soilgrids via ESRI Living Atlas',
          error: `API Error: ${data.error.message || JSON.stringify(data.error)}`
        };
      }
      
      // Check for value in various possible locations
      // Format 1: Direct value property
      if (data.value !== undefined && data.value !== null && data.value !== 'NoData' && data.value !== '') {
        console.log('🌱 Found value in data.value:', data.value);
        carbonDensityValue = data.value;
      } 
      // Format 2: Results array (common in ImageServer identify)
      else if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        console.log('🌱 Found results array with', data.results.length, 'items');
        const firstResult = data.results[0];
        console.log('🌱 First result:', JSON.stringify(firstResult, null, 2));
        
        if (firstResult.value !== undefined && firstResult.value !== null && firstResult.value !== 'NoData' && firstResult.value !== '') {
          carbonDensityValue = firstResult.value;
        } else if (firstResult.attributes) {
          // Sometimes value is in attributes
          console.log('🌱 Checking attributes:', firstResult.attributes);
          if (firstResult.attributes.value !== undefined) {
            carbonDensityValue = firstResult.attributes.value;
          } else if (firstResult.attributes.Pixel !== undefined) {
            carbonDensityValue = firstResult.attributes.Pixel;
          }
        }
      } 
      // Format 3: Properties object
      else if (data.properties && data.properties.value !== undefined) {
        console.log('🌱 Found value in data.properties.value:', data.properties.value);
        carbonDensityValue = data.properties.value;
      }
      // Format 4: Check for pixel value directly
      else if (data.pixel !== undefined) {
        console.log('🌱 Found value in data.pixel:', data.pixel);
        carbonDensityValue = data.pixel;
      }
      // Format 5: Check location property (sometimes contains value)
      else if (data.location && data.location.value !== undefined) {
        console.log('🌱 Found value in data.location.value:', data.location.value);
        carbonDensityValue = data.location.value;
      }
      
      if (carbonDensityValue === null) {
        console.warn('🌱 Could not find value in any expected location. Full response structure:', {
          hasValue: 'value' in data,
          hasResults: 'results' in data,
          hasProperties: 'properties' in data,
          hasPixel: 'pixel' in data,
          hasLocation: 'location' in data,
          allKeys: Object.keys(data)
        });
      }
    }
    
    if (carbonDensityValue !== null) {
      const carbonDensity = parseFloat(carbonDensityValue);
      if (!isNaN(carbonDensity)) {
        result.organic_carbon_density = carbonDensity;
        console.log(`🌱 Soil Organic Carbon Density: ${carbonDensity} kg/m²`);
      } else {
        console.log('🌱 No valid carbon density data at location (parsed as NaN)');
        result.organic_carbon_density = null;
      }
    } else {
      console.log('🌱 No data available at this location (value not found in response)');
      result.organic_carbon_density = null;
    }
    
    // Check if we got any data
    if (result.organic_carbon_density === null || result.organic_carbon_density === undefined) {
      console.warn('⚠️ No soil carbon density data found for this location');
      return {
        organic_carbon_density: null,
        organic_carbon_density_units: 'kg/m²',
        source: 'ISRIC Soilgrids via ESRI Living Atlas',
        error: 'No data available for this location'
      };
    }

    console.log('✅ Soil Carbon Density data retrieved successfully:', result);
    return result;

  } catch (error) {
    console.error('❌ Error fetching Soil Carbon Density data:', error);
    return {
      organic_carbon_density: null,
      organic_carbon_density_units: 'kg/m²',
      source: 'ISRIC Soilgrids via ESRI Living Atlas',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

// Helper function to fetch soil data for a specific coordinate using ImageServer identify endpoint
async function fetchSoilData(endpoint: string, lat: number, lon: number): Promise<any> {
  try {
    // The "Invalid URL" error suggests the endpoint might not support identify the way we're calling it
    // Let's try using the exact format from the user's example, but also try a POST request
    // Some ESRI services require POST for identify operations
    
    // Format 1: Simple comma-separated (as in user's example) - minimal parameters
    const geometryParam1 = `${lon},${lat}`;
    const url1 = `${endpoint}?geometry=${geometryParam1}&geometryType=esriGeometryPoint&sr=4326&returnGeometry=false&returnCatalogItems=false&f=json`;
    
    console.log(`🌐 Soil Carbon Density API Call (format 1 - GET): ${url1}`);
    
    // Try format 1 first (GET request)
    try {
      const data = await fetchJSONSmart(url1);
      console.log(`📊 Soil Carbon Density API Response (format 1):`, data);
      
      // Check if we got an error response
      if (data && data.error) {
        console.warn('⚠️ Format 1 returned error, trying format 2 (POST):', data.error);
        throw new Error('Format 1 failed');
      }
      
      return data;
    } catch (error1) {
      // Format 1 failed, try format 2 as POST request
      console.log('🔄 Trying format 2 (POST request with form data)...');
      
      try {
        // Format 2: Try POST request with form-encoded data
        // Some ESRI ImageServers require POST for identify
        const formData = new URLSearchParams({
          geometry: `${lon},${lat}`,
          geometryType: 'esriGeometryPoint',
          sr: '4326',
          returnGeometry: 'false',
          returnCatalogItems: 'false',
          f: 'json'
        });
        
        console.log(`🌐 Soil Carbon Density API Call (format 2 - POST): ${endpoint}`);
        console.log(`🌐 POST body: ${formData.toString()}`);
        
        // Use fetchJSONSmart but with POST method
        const data = await fetchJSONSmart(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        });
        
        console.log(`📊 Soil Carbon Density API Response (format 2 - POST):`, data);
        
        if (data && data.error) {
          console.warn('⚠️ Format 2 (POST) returned error, trying format 3:', data.error);
          throw new Error('Format 2 failed');
        }
        
        return data;
      } catch (error2) {
        // Format 2 failed, try format 3 with JSON geometry and POST
        console.log('🔄 Trying format 3 (POST with JSON geometry)...');
        
        try {
          const geometry3 = {
            "x": lon,
            "y": lat,
            "spatialReference": {"wkid": 4326}
          };
          
          const formData3 = new URLSearchParams({
            geometry: JSON.stringify(geometry3),
            geometryType: 'esriGeometryPoint',
            sr: '4326',
            imageDisplay: '400,400,96',
            mapExtent: `${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}`,
            tolerance: '1',
            returnGeometry: 'false',
            returnCatalogItems: 'false',
            f: 'json'
          });
          
          console.log(`🌐 Soil Carbon Density API Call (format 3 - POST with JSON geometry): ${endpoint}`);
          
          const data = await fetchJSONSmart(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData3.toString()
          });
          
          console.log(`📊 Soil Carbon Density API Response (format 3 - POST):`, data);
          
          return data;
        } catch (error3) {
          console.error('❌ All three formats failed');
          return null;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch soil carbon density data:', error);
    return null;
  }
}

