/**
 * NH Voting Wards Adapter
 * Queries New Hampshire Political Districts (Voting Wards)
 * from NH GRANIT FeatureServer
 */

const BASE_SERVICE_URL = 'https://nhgeodata.unh.edu/hosting/rest/services/Hosted/APB_ElectoralDistricts/FeatureServer';
const LAYER_ID = 5;

export interface NHVotingWardData {
  ward: string | null;
  attributes: Record<string, any>;
}

/**
 * Query NH Voting Wards FeatureServer for point-in-polygon
 * Returns the voting ward that contains the given point
 */
export async function getNHVotingWardData(
  lat: number,
  lon: number
): Promise<NHVotingWardData | null> {
  try {
    console.log(`🗳️ Querying NH Voting Wards for point [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NH Voting Wards Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📊 NH Voting Wards API Response:`, data);
    
    if (data.error) {
      console.error('❌ NH Voting Wards API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No NH Voting Ward found for this location');
      return {
        ward: null,
        attributes: {}
      };
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    
    // Extract ward identifier - try multiple possible field names
    const ward = attributes.ward || 
                 attributes._ward || 
                 attributes.Ward || 
                 attributes.WARD ||
                 attributes.name ||
                 null;
    
    console.log(`✅ Found NH Voting Ward: ${ward}`);
    
    return {
      ward,
      attributes
    };
  } catch (error) {
    console.error('❌ Error querying NH Voting Wards:', error);
    return null;
  }
}

