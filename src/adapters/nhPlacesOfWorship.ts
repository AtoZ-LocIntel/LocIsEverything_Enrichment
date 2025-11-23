/**
 * NH Places of Worship Adapter
 * Queries New Hampshire Places of Worship from NH GRANIT FeatureServer
 * Supports proximity queries to find places of worship within a specified radius
 */

const BASE_SERVICE_URL = 'https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_HSIP_ServiceFacilities/FeatureServer';
const LAYER_ID = 6;

export interface NHPlaceOfWorship {
  name: string | null;
  subtype: string | null;
  denom: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  telephone: string | null;
  attendance: number | null;
  attributes: Record<string, any>;
  lat: number;
  lon: number;
  distance_miles?: number;
}

/**
 * Query NH Places of Worship FeatureServer for proximity search
 * Returns places of worship within the specified radius (in miles)
 */
export async function getNHPlacesOfWorshipData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHPlaceOfWorship[]> {
  try {
    console.log(`🕌 Querying NH Places of Worship within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NH Places of Worship Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH Places of Worship API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Places of Worship found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const placesOfWorship: NHPlaceOfWorship[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract coordinates from geometry (point geometry has x, y)
      // ESRI geometry: x is longitude, y is latitude
      const destLon = geometry.x || geometry.longitude || null;
      const destLat = geometry.y || geometry.latitude || null;
      
      // Extract name and type information
      const name = attributes.name || 
                   attributes.NAME || 
                   attributes.Name ||
                   attributes._name ||
                   null;
      
      const subtype = attributes.subtype || 
                       attributes.SUBTYPE || 
                       attributes.Subtype ||
                       attributes._subtype ||
                       null;
      
      const denom = attributes.denom || 
                    attributes.DENOM || 
                    attributes.Denom ||
                    attributes._denom ||
                    null;
      
      // Extract address information
      const address = attributes.address || attributes.ADDRESS || attributes.Address || '';
      const city = attributes.city || attributes.CITY || attributes.City || '';
      const state = attributes.state || attributes.STATE || attributes.State || 'NH';
      const zip = attributes.zip || attributes.ZIP || attributes.Zip || '';
      const telephone = attributes.telephone || attributes.TELEPHONE || attributes.Telephone || '';
      const attendance = attributes.attendance || attributes.ATTENDANCE || attributes.Attendance || null;
      
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
        subtype,
        denom,
        address,
        city,
        state,
        zip,
        telephone,
        attendance: attendance !== null && attendance !== undefined ? Number(attendance) : null,
        attributes,
        lat: destLat || 0,
        lon: destLon || 0,
        distance_miles
      };
    });
    
    console.log(`✅ Found ${placesOfWorship.length} NH Places of Worship`);
    
    return placesOfWorship;
  } catch (error) {
    console.error('❌ Error querying NH Places of Worship:', error);
    return [];
  }
}

