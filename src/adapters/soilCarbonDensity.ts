// World Soils 250m Organic Carbon Density (ISRIC SoilGrids REST API)
// Fetches soil organic carbon density data from ISRIC SoilGrids v2.0 REST API

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
        source: 'ISRIC SoilGrids',
        error: 'Invalid coordinates provided'
      };
    }
    
    // ISRIC SoilGrids v2.0 REST API endpoint
    // The API expects arrays for property, depth, and value parameters
    const baseUrl = 'https://rest.isric.org/soilgrids/v2.0/properties/query';
    
    // Validate URL construction
    let queryUrl: URL;
    try {
      queryUrl = new URL(baseUrl);
      queryUrl.searchParams.set('lon', lon.toString());
      queryUrl.searchParams.set('lat', lat.toString());
      
      // Request organic carbon density (ocd) property with mean value at 0-30cm depth
      // Using append() creates multiple query parameters with the same name (array format)
      queryUrl.searchParams.append('property', 'ocd'); // ocd = organic carbon density
      queryUrl.searchParams.append('value', 'mean'); // Get mean value
      queryUrl.searchParams.append('depth', '0-30cm'); // Standard depth layer
      
      const finalUrl = queryUrl.toString();
      console.log(`🌐 Soil Carbon Density API Call: ${finalUrl}`);
      
      // Validate the URL is properly formed
      try {
        new URL(finalUrl); // This will throw if URL is invalid
      } catch (urlError) {
        console.error('❌ Invalid URL constructed:', finalUrl);
        throw new Error(`Invalid URL: ${urlError instanceof Error ? urlError.message : 'Unknown URL error'}`);
      }
    } catch (urlConstructionError) {
      console.error('❌ Error constructing URL:', urlConstructionError);
      throw new Error(`Failed to construct API URL: ${urlConstructionError instanceof Error ? urlConstructionError.message : 'Unknown error'}`);
    }
    
    const result: SoilCarbonDensityResponse = {
      organic_carbon_density_units: 'kg/m²',
      source: 'ISRIC SoilGrids v2.0 - Organic Carbon Density'
    };

    // Fetch data from ISRIC SoilGrids REST API
    let data: any = null;
    let response: Response | null = null;
    
    try {
      response = await fetch(queryUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ${response.status} error:`, errorText.substring(0, 200));
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }
      
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from API');
      }
      
      try {
        data = JSON.parse(responseText);
        console.log(`📊 Soil Carbon Density API Response (full):`, JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', responseText.substring(0, 200));
        throw new Error('Invalid JSON response from API');
      }
      
      // If layers array is empty, try without depth/value parameters (use API defaults)
      if (data && data.properties && data.properties.layers && Array.isArray(data.properties.layers) && data.properties.layers.length === 0) {
        console.log('🔄 Empty layers array, trying with only property parameter (using API defaults)...');
        
        try {
          const fallbackUrl = new URL(baseUrl);
          fallbackUrl.searchParams.set('lon', lon.toString());
          fallbackUrl.searchParams.set('lat', lat.toString());
          fallbackUrl.searchParams.set('property', 'ocd'); // Just request ocd, let API use defaults
          
          console.log(`🌐 Soil Carbon Density API Call (fallback): ${fallbackUrl.toString()}`);
          
          response = await fetch(fallbackUrl.toString(), {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const fallbackText = await response.text();
            if (fallbackText && fallbackText.trim() !== '') {
              data = JSON.parse(fallbackText);
              console.log(`📊 Soil Carbon Density API Response (fallback, full):`, JSON.stringify(data, null, 2));
            }
          } else {
            console.warn(`⚠️ Fallback request failed with HTTP ${response.status}`);
          }
        } catch (fallbackError) {
          console.warn('⚠️ Fallback request failed:', fallbackError);
        }
      }
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      throw fetchError;
    }
    console.log(`📊 Response type:`, typeof data);
    console.log(`📊 Response keys:`, data ? Object.keys(data) : 'null');
    
    // ISRIC SoilGrids API returns GeoJSON with properties.layers array
    // The response structure: { "properties": { "layers": [{ "name": "ocd", "depths": [{ "label": "0-30cm", "values": { "mean": value } }] }] } }
    let carbonDensityValue = null;
    
    if (data && data.properties && data.properties.layers && Array.isArray(data.properties.layers)) {
      console.log(`🌱 Found layers array with ${data.properties.layers.length} items`);
      
      // Look for organic carbon density (ocd) layer
      for (const layer of data.properties.layers) {
        if (layer.name === 'ocd' && layer.depths && Array.isArray(layer.depths)) {
          console.log(`🌱 Found ocd layer with ${layer.depths.length} depth levels`);
          
          // Prefer 0-30cm depth (standard surface layer), fallback to 0-5cm if not available
          const preferredDepths = ['0-30cm', '0-5cm', '5-15cm', '15-30cm'];
          
          // Store depth info for conversion
          let selectedDepth: any = null;
          let selectedDepthLabel = '';
          
          for (const depthLabel of preferredDepths) {
            const depth = layer.depths.find((d: any) => d.label === depthLabel);
            if (depth && depth.values && depth.values.mean !== undefined && depth.values.mean !== null) {
              carbonDensityValue = depth.values.mean;
              selectedDepth = depth;
              selectedDepthLabel = depthLabel;
              console.log(`🌱 Found organic carbon density (${depthLabel}): ${carbonDensityValue} dg/dm³`);
              break;
            }
          }
          
          // If we didn't find a preferred depth, use the first available depth with mean value
          if (!carbonDensityValue) {
            for (const depth of layer.depths) {
              if (depth.values && depth.values.mean !== undefined && depth.values.mean !== null) {
                carbonDensityValue = depth.values.mean;
                selectedDepth = depth;
                selectedDepthLabel = depth.label;
                console.log(`🌱 Found organic carbon density (${depth.label}): ${carbonDensityValue} dg/dm³`);
                break;
              }
            }
          }
          
          // Convert from dg/dm³ to kg/m³, then to kg/m² based on depth
          // Conversion: 1 dg/dm³ = 0.1 kg/m³
          // Formula: 1 dg = 0.1 g = 0.0001 kg, 1 dm³ = 0.001 m³
          // So: 1 dg/dm³ = 0.0001 kg / 0.001 m³ = 0.1 kg/m³
          // Then multiply by depth in meters to get kg/m² (surface density)
          if (carbonDensityValue !== null && selectedDepth && selectedDepth.range) {
            const depthRange = selectedDepth.range;
            const topDepth = depthRange.top_depth || 0; // in cm
            const bottomDepth = depthRange.bottom_depth || 0; // in cm
            const depthMeters = (bottomDepth - topDepth) / 100; // Convert cm to meters
            
            const originalValue = parseFloat(carbonDensityValue.toString());
            
            // Convert from dg/dm³ to kg/m³: 1 dg/dm³ = 0.1 kg/m³
            const carbonDensityKgPerM3 = originalValue * 0.1;
            
            // Convert from kg/m³ to kg/m² by multiplying by depth in meters
            const carbonDensityKgPerM2 = carbonDensityKgPerM3 * depthMeters;
            
            carbonDensityValue = carbonDensityKgPerM2;
            console.log(`🌱 Unit conversion: ${originalValue.toFixed(2)} dg/dm³ → ${carbonDensityKgPerM3.toFixed(2)} kg/m³ → ${carbonDensityKgPerM2.toFixed(2)} kg/m² (depth: ${depthMeters}m, ${selectedDepthLabel})`);
          } else if (carbonDensityValue !== null) {
            // Fallback: if we can't determine depth, just convert to kg/m³
            // Assume 0-30cm depth (0.3m) for conversion to kg/m²
            const originalValue = parseFloat(carbonDensityValue.toString());
            const carbonDensityKgPerM3 = originalValue * 0.1;
            const carbonDensityKgPerM2 = carbonDensityKgPerM3 * 0.3; // Assume 0.3m depth
            carbonDensityValue = carbonDensityKgPerM2;
            console.log(`🌱 Unit conversion (fallback, assuming 0-30cm): ${originalValue.toFixed(2)} dg/dm³ → ${carbonDensityKgPerM3.toFixed(2)} kg/m³ → ${carbonDensityKgPerM2.toFixed(2)} kg/m²`);
          }
          
          break; // Found ocd layer, no need to check other layers
        }
      }
    }
    
    if (!carbonDensityValue) {
      console.warn('🌱 Could not find ocd value in layers. Full response structure:', {
        hasProperties: !!data.properties,
        hasLayers: !!(data.properties && data.properties.layers && Array.isArray(data.properties.layers)),
        layersCount: data.properties && data.properties.layers ? data.properties.layers.length : 0,
        layers: data.properties && data.properties.layers ? data.properties.layers.map((l: any) => l.name) : [],
        allKeys: Object.keys(data)
      });
    }
    
    if (carbonDensityValue !== null && carbonDensityValue !== undefined) {
      const carbonDensity = parseFloat(carbonDensityValue);
      if (!isNaN(carbonDensity)) {
        result.organic_carbon_density = carbonDensity;
        console.log(`🌱 Soil Organic Carbon Density: ${carbonDensity} kg/m²`);
      } else {
        console.log('🌱 No valid carbon density data at location (parsed as NaN)');
        result.organic_carbon_density = null;
      }
    } else {
      console.log('🌱 No data available at this location');
      result.organic_carbon_density = null;
    }
    
    // Check if we got any data
    if (result.organic_carbon_density === null || result.organic_carbon_density === undefined) {
      console.warn('⚠️ No soil carbon density data found for this location');
      return {
        organic_carbon_density: null,
        organic_carbon_density_units: 'kg/m²',
        source: 'ISRIC SoilGrids v2.0',
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
      source: 'ISRIC SoilGrids v2.0',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

