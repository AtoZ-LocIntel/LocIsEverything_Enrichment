/**
 * NH Fire Stations Adapter
 * Queries New Hampshire Fire Stations from NH GRANIT FeatureServer
 * Supports proximity queries to find fire stations within a specified radius
 */

const BASE_SERVICE_URL = 'https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_HSIP_ServiceFacilities/FeatureServer';
const LAYER_ID = 2;

export interface NHFireStation {
  name: string | null;
  type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  telephone: string | null;
  owner: string | null;
  fdid: string | null;
  attributes: Record<string, any>;
  lat: number;
  lon: number;
  distance_miles?: number;
}

/**
 * Query NH Fire Stations FeatureServer for proximity search
 * Returns fire stations within the specified radius (in miles)
 */
export async function getNHFireStationsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHFireStation[]> {
  try {
    console.log(`🚒 Querying NH Fire Stations within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NH Fire Stations Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH Fire Stations API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Fire Stations found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const fireStations: NHFireStation[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract coordinates from geometry (point geometry has x, y)
      // ESRI geometry: x is longitude, y is latitude
      const destLon = geometry.x || geometry.longitude || null;
      const destLat = geometry.y || geometry.latitude || null;
      
      // Extract name and type
      const name = attributes.name || 
                   attributes.NAME || 
                   attributes.Name ||
                   attributes._name ||
                   null;
      
      const type = attributes.type || 
                   attributes.TYPE || 
                   attributes.Type ||
                   attributes._type ||
                   null;
      
      // Extract address information
      const address = attributes.address || attributes.ADDRESS || attributes.Address || '';
      const city = attributes.city || attributes.CITY || attributes.City || '';
      const state = attributes.state || attributes.STATE || attributes.State || 'NH';
      const zip = attributes.zip || attributes.ZIP || attributes.Zip || '';
      const telephone = attributes.telephone || attributes.TELEPHONE || attributes.Telephone || '';
      const owner = attributes.owner || attributes.OWNER || attributes.Owner || '';
      const fdid = attributes.fdid || attributes.FDID || attributes.Fdid || '';
      
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
        type,
        address,
        city,
        state,
        zip,
        telephone,
        owner,
        fdid,
        attributes,
        lat: destLat || 0,
        lon: destLon || 0,
        distance_miles
      };
    });
    
    console.log(`✅ Found ${fireStations.length} NH Fire Stations`);
    
    return fireStations;
  } catch (error) {
    console.error('❌ Error querying NH Fire Stations:', error);
    return [];
  }
}

