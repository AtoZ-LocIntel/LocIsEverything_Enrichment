/**
 * NH Senate Districts Adapter
 * Queries New Hampshire Senate District Boundaries (2022)
 * from NH GRANIT FeatureServer
 */

const BASE_SERVICE_URL = 'https://nhgeodata.unh.edu/hosting/rest/services/Hosted/APB_ElectoralDistricts/FeatureServer';
const LAYER_ID = 10;

export interface NHSenateDistrictData {
  district: string | null;
  attributes: Record<string, any>;
}

/**
 * Query NH Senate Districts FeatureServer for point-in-polygon
 * Returns the district that contains the given point
 */
export async function getNHSenateDistrictData(
  lat: number,
  lon: number
): Promise<NHSenateDistrictData | null> {
  try {
    console.log(`🏛️ Querying NH Senate Districts for point [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for point-in-polygon
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', `${lon},${lat}`);
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'false');
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    queryUrl.searchParams.set('returnCountOnly', 'false');
    queryUrl.searchParams.set('returnIdsOnly', 'false');
    
    console.log(`🔗 NH Senate Districts Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📊 NH Senate Districts API Response:`, data);
    
    if (data.error) {
      console.error('❌ NH Senate Districts API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No NH Senate District found for this location');
      return {
        district: null,
        attributes: {}
      };
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    
    // Extract district identifier - try multiple possible field names
    const district = attributes.senate2022 || 
                     attributes._senate2022 || 
                     attributes.Senate2022 || 
                     attributes.SENATE2022 ||
                     attributes.District || 
                     attributes.district ||
                     attributes.DISTRICT ||
                     attributes.name ||
                     null;
    
    console.log(`✅ Found NH Senate District: ${district}`);
    
    return {
      district,
      attributes
    };
  } catch (error) {
    console.error('❌ Error querying NH Senate Districts:', error);
    return null;
  }
}

