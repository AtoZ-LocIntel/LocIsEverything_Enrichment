/**
 * NH Nursing Homes Adapter
 * Queries New Hampshire Nursing Homes from NH GRANIT FeatureServer
 * Supports proximity queries to find nursing homes within a specified radius
 */

const BASE_SERVICE_URL = 'https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_HSIP_ServiceFacilities/FeatureServer';
const LAYER_ID = 5;

export interface NHNursingHome {
  name: string | null;
  fac_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  telephone: string | null;
  beds: number | null;
  attributes: Record<string, any>;
  lat: number;
  lon: number;
  distance_miles?: number;
}

/**
 * Query NH Nursing Homes FeatureServer for proximity search
 * Returns nursing homes within the specified radius (in miles)
 */
export async function getNHNursingHomesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHNursingHome[]> {
  try {
    console.log(`🏥 Querying NH Nursing Homes within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    // Convert miles to meters for the buffer distance
    const radiusMeters = radiusMiles * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for proximity search
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', `${lon},${lat}`);
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', radiusMeters.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true'); // Need geometry to get coordinates
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    
    console.log(`🔗 NH Nursing Homes Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH Nursing Homes API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Nursing Homes found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const nursingHomes: NHNursingHome[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract coordinates from geometry (point geometry has x, y)
      // ESRI geometry: x is longitude, y is latitude
      const destLon = geometry.x || geometry.longitude || null;
      const destLat = geometry.y || geometry.latitude || null;
      
      // Extract name and facility type
      const name = attributes.name || 
                   attributes.NAME || 
                   attributes.Name ||
                   attributes._name ||
                   null;
      
      const facType = attributes.fac_type || 
                      attributes.FAC_TYPE || 
                      attributes.FacType ||
                      attributes._fac_type ||
                      null;
      
      // Extract address information
      const address = attributes.address || attributes.ADDRESS || attributes.Address || '';
      const city = attributes.city || attributes.CITY || attributes.City || '';
      const state = attributes.state || attributes.STATE || attributes.State || 'NH';
      const zip = attributes.zip || attributes.ZIP || attributes.Zip || '';
      const telephone = attributes.telephone || attributes.TELEPHONE || attributes.Telephone || '';
      const beds = attributes.beds || attributes.BEDS || attributes.Beds || null;
      
      // Calculate distance from search point to destination
      let distance_miles: number | undefined = undefined;
      if (destLat !== null && destLon !== null && typeof destLat === 'number' && typeof destLon === 'number') {
        // Haversine formula to calculate distance from search point (lat, lon) to destination (destLat, destLon)
        const R = 3959; // Earth's radius in miles
        const dLat = (destLat - lat) * Math.PI / 180;
        const dLon = (destLon - lon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance_miles = R * c;
      }
      
      return {
        name,
        fac_type: facType,
        address,
        city,
        state,
        zip,
        telephone,
        beds: beds !== null && beds !== undefined ? Number(beds) : null,
        attributes,
        lat: destLat || 0,
        lon: destLon || 0,
        distance_miles
      };
    });
    
    console.log(`✅ Found ${nursingHomes.length} NH Nursing Homes`);
    
    return nursingHomes;
  } catch (error) {
    console.error('❌ Error querying NH Nursing Homes:', error);
    return [];
  }
}

