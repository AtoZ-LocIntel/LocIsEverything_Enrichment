/**
 * CT Boat Launches Adapter
 * Queries Connecticut DEEP Boat Launches from CT Geodata Portal FeatureServer
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/Connecticut_DEEP_Boat_Launches/FeatureServer';
const LAYER_ID = 0;

export interface CTBoatLaunchInfo {
  launchId: string | null;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  attributes: Record<string, any>;
  lat: number | null;
  lon: number | null;
  distance_miles?: number;
}

/**
 * Haversine distance calculation
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Query CT Boat Launches FeatureServer for proximity search
 * Returns boat launches within the specified radius (in miles, max 25 miles)
 */
export async function getCTBoatLaunchesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTBoatLaunchInfo[]> {
  try {
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radiusMiles, 25.0);
    
    console.log(`🚤 Querying CT Boat Launches within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    // Convert miles to meters for the buffer
    const radiusMeters = cappedRadius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }));
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', radiusMeters.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 CT Boat Launches Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT Boat Launches API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No CT Boat Launches found within ${cappedRadius} miles`);
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} CT Boat Launches nearby`);
    
    // Process features and calculate distances
    const launches: CTBoatLaunchInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract launch fields
      const name = attributes.NAME || attributes.name || attributes.Name || null;
      const address = attributes.ADDRESS || attributes.address || attributes.Address || null;
      const city = attributes.CITY || attributes.city || attributes.City || null;
      const state = attributes.STATE || attributes.state || attributes.State || 'CT';
      const zip = attributes.ZIP || attributes.zip || attributes.Zip || null;
      const phone = attributes.PHONE || attributes.phone || attributes.Phone || null;
      
      // Get coordinates from geometry or attributes
      let launchLat: number | null = null;
      let launchLon: number | null = null;
      
      // First try geometry
      if (geometry.x !== undefined && geometry.y !== undefined) {
        launchLon = geometry.x;
        launchLat = geometry.y;
      } else if (geometry.latitude !== undefined && geometry.longitude !== undefined) {
        launchLat = geometry.latitude;
        launchLon = geometry.longitude;
      } else if (geometry.lat !== undefined && geometry.lon !== undefined) {
        launchLat = geometry.lat;
        launchLon = geometry.lon;
      }
      
      // Fallback to attributes if geometry not available
      if (launchLat === null || launchLon === null) {
        if (attributes.Latitude !== null && attributes.Latitude !== undefined) {
          launchLat = parseFloat(attributes.Latitude.toString());
        }
        if (attributes.Longitude !== null && attributes.Longitude !== undefined) {
          launchLon = parseFloat(attributes.Longitude.toString());
        }
      }
      
      // Calculate distance
      let distance_miles: number | undefined = undefined;
      if (launchLat !== null && launchLon !== null) {
        distance_miles = haversineDistance(lat, lon, launchLat, launchLon);
      }
      
      const launchId = attributes.OBJECTID || attributes.objectid || attributes.ID || attributes.id || name || null;
      
      return {
        launchId: launchId ? launchId.toString() : null,
        name,
        address,
        city,
        state,
        zip,
        phone,
        attributes,
        lat: launchLat,
        lon: launchLon,
        distance_miles
      };
    });
    
    // Filter by actual distance and sort by distance
    const filteredLaunches = launches
      .filter(launch => launch.distance_miles !== undefined && launch.distance_miles <= cappedRadius && launch.lat !== null && launch.lon !== null)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Returning ${filteredLaunches.length} CT Boat Launches within ${cappedRadius} miles`);
    
    return filteredLaunches;
    
  } catch (error) {
    console.error('❌ Error querying CT Boat Launches:', error);
    return [];
  }
}

