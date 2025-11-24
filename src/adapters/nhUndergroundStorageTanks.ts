/**
 * NH Underground Storage Tank Sites Adapter
 * Queries New Hampshire Underground Storage Tank Sites from DES FeatureServer
 * Supports proximity queries to find UST sites within a specified radius
 * This is a point dataset
 */

const BASE_SERVICE_URL = 'https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Public/MapServer';
const LAYER_ID = 13;

export interface NHUndergroundStorageTank {
  facility_name: string | null;
  facility_address: string | null;
  city: string | null;
  state: string | null;
  tank_count: number | null;
  latitude: number;
  longitude: number;
  attributes: Record<string, any>;
  distance_miles?: number;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Query NH Underground Storage Tank Sites FeatureServer for proximity search
 * Returns UST sites within the specified radius (in miles)
 */
export async function getNHUndergroundStorageTanksData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHUndergroundStorageTank[]> {
  try {
    console.log(`🛢️ Querying NH Underground Storage Tank Sites within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    queryUrl.searchParams.set('returnGeometry', 'true');
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    
    console.log(`🔗 NH Underground Storage Tank Sites Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH Underground Storage Tank Sites API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Underground Storage Tank Sites found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const ustSites: NHUndergroundStorageTank[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract facility name
      const facilityName = attributes.facility_name || 
                          attributes.FACILITY_NAME || 
                          attributes.FacilityName ||
                          attributes._facility_name ||
                          attributes.name ||
                          attributes.NAME ||
                          attributes.Name ||
                          null;
      
      // Extract facility address
      const facilityAddress = attributes.facility_address || 
                              attributes.FACILITY_ADDRESS || 
                              attributes.FacilityAddress ||
                              attributes._facility_address ||
                              attributes.address ||
                              attributes.ADDRESS ||
                              attributes.Address ||
                              attributes.street ||
                              attributes.STREET ||
                              null;
      
      // Extract location info
      const city = attributes.city || 
                   attributes.CITY || 
                   attributes.City ||
                   attributes._city ||
                   attributes.gismunic ||
                   attributes.GISMUNIC ||
                   null;
      
      const state = attributes.st || 
                    attributes.ST || 
                    attributes.State ||
                    attributes._st ||
                    'NH';
      
      // Extract tank count
      const tankCount = attributes.tank_count || 
                       attributes.TANK_COUNT || 
                       attributes.TankCount ||
                       attributes._tank_count ||
                       attributes.num_tanks ||
                       attributes.NUM_TANKS ||
                       attributes.count ||
                       attributes.COUNT ||
                       null;
      
      // Get coordinates from geometry (point)
      let latitude = 0;
      let longitude = 0;
      
      if (geometry.x && geometry.y) {
        // ESRI point geometry has x, y coordinates
        longitude = geometry.x;
        latitude = geometry.y;
      } else if (geometry.latitude && geometry.longitude) {
        latitude = geometry.latitude;
        longitude = geometry.longitude;
      } else if (attributes.latitude && attributes.longitude) {
        // Try to parse from attributes if available
        latitude = parseFloat(attributes.latitude) || 0;
        longitude = parseFloat(attributes.longitude) || 0;
      }
      
      // Calculate distance from search point
      let distance_miles: number | undefined = undefined;
      if (latitude !== 0 && longitude !== 0) {
        distance_miles = calculateDistance(lat, lon, latitude, longitude);
      }
      
      return {
        facility_name: facilityName,
        facility_address: facilityAddress,
        city,
        state,
        tank_count: tankCount !== null && tankCount !== undefined ? Number(tankCount) : null,
        latitude,
        longitude,
        attributes,
        distance_miles
      };
    });
    
    console.log(`✅ Found ${ustSites.length} NH Underground Storage Tank Sites`);
    
    return ustSites;
  } catch (error) {
    console.error('❌ Error querying NH Underground Storage Tank Sites:', error);
    return [];
  }
}

