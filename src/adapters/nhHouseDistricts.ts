/**
 * NH House Districts Adapter
 * Queries New Hampshire House of Representatives District Boundaries (2022)
 * from NH GRANIT FeatureServer
 */

const BASE_SERVICE_URL = 'https://nhgeodata.unh.edu/hosting/rest/services/Hosted/APB_ElectoralDistricts/FeatureServer';
const LAYER_ID = 8;

export interface NHHouseDistrictData {
  district: string | null;
  attributes: Record<string, any>;
}

/**
 * Query NH House Districts FeatureServer for point-in-polygon
 * Returns the district that contains the given point
 */
export async function getNHHouseDistrictData(
  lat: number,
  lon: number
): Promise<NHHouseDistrictData | null> {
  try {
    console.log(`🏛️ Querying NH House Districts for point [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NH House Districts Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📊 NH House Districts API Response:`, data);
    
    if (data.error) {
      console.error('❌ NH House Districts API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No NH House District found for this location');
      return {
        district: null,
        attributes: {}
      };
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    
    // Extract district identifier - try multiple possible field names
    const district = attributes._basehse22 || 
                     attributes.basehse22 || 
                     attributes.District || 
                     attributes.district ||
                     attributes.DISTRICT ||
                     attributes.name ||
                     null;
    
    console.log(`✅ Found NH House District: ${district}`);
    
    return {
      district,
      attributes
    };
  } catch (error) {
    console.error('❌ Error querying NH House Districts:', error);
    return null;
  }
}

