/**
 * NH Automobile Salvage Yards Adapter
 * Queries New Hampshire Automobile Salvage Yards from DES FeatureServer
 * Supports proximity queries to find salvage yards within a specified radius
 * This is a point dataset
 */

const BASE_SERVICE_URL = 'https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Public/MapServer';
const LAYER_ID = 3;

export interface NHAutomobileSalvageYard {
  facility_id: string | null;
  site_name: string | null;
  address: string | null;
  address2: string | null;
  town: string | null;
  state: string | null;
  status: string | null;
  onestop_link: string | null;
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
 * Query NH Automobile Salvage Yards FeatureServer for proximity search
 * Returns salvage yards within the specified radius (in miles)
 */
export async function getNHAutomobileSalvageYardsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHAutomobileSalvageYard[]> {
  try {
    console.log(`🚗 Querying NH Automobile Salvage Yards within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NH Automobile Salvage Yards Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH Automobile Salvage Yards API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Automobile Salvage Yards found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const salvageYards: NHAutomobileSalvageYard[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract facility ID
      const facilityId = attributes.facility_id || 
                        attributes.FACILITY_ID || 
                        attributes.FacilityId ||
                        attributes._facility_id ||
                        attributes.id ||
                        attributes.ID ||
                        attributes.Id ||
                        null;
      
      // Extract site name
      const siteName = attributes.site_name || 
                      attributes.SITE_NAME || 
                      attributes.SiteName ||
                      attributes._site_name ||
                      attributes.name ||
                      attributes.NAME ||
                      attributes.Name ||
                      null;
      
      // Extract address
      const address = attributes.address || 
                     attributes.ADDRESS || 
                     attributes.Address ||
                     attributes._address ||
                     attributes.street ||
                     attributes.STREET ||
                     null;
      
      // Extract address line 2
      const address2 = attributes.add2 || 
                      attributes.ADD2 || 
                      attributes.Add2 ||
                      attributes._add2 ||
                      attributes.address2 ||
                      attributes.ADDRESS2 ||
                      attributes.Address2 ||
                      null;
      
      // Extract location info
      const town = attributes.town || 
                  attributes.TOWN || 
                  attributes.Town ||
                  attributes._town ||
                  attributes.city ||
                  attributes.CITY ||
                  attributes.City ||
                  attributes.municipality ||
                  attributes.MUNICIPALITY ||
                  null;
      
      const state = attributes.st || 
                    attributes.ST || 
                    attributes.State ||
                    attributes._st ||
                    'NH';
      
      // Extract status
      const status = attributes.status || 
                    attributes.STATUS || 
                    attributes.Status ||
                    attributes._status ||
                    attributes.site_status ||
                    attributes.SITE_STATUS ||
                    null;
      
      // Extract OneStop link
      const onestopLink = attributes.onestop_link || 
                         attributes.ONESTOP_LINK || 
                         attributes.OneStopLink ||
                         attributes._onestop_link ||
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
        facility_id: facilityId ? String(facilityId) : null,
        site_name: siteName,
        address,
        address2,
        town,
        state,
        status,
        onestop_link: onestopLink,
        latitude,
        longitude,
        attributes,
        distance_miles
      };
    });
    
    console.log(`✅ Found ${salvageYards.length} NH Automobile Salvage Yards`);
    
    return salvageYards;
  } catch (error) {
    console.error('❌ Error querying NH Automobile Salvage Yards:', error);
    return [];
  }
}

