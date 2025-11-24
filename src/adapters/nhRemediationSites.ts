/**
 * NH Remediation Sites Adapter
 * Queries New Hampshire Remediation Sites from DES FeatureServer
 * Supports proximity queries to find remediation sites within a specified radius
 * This is a point dataset
 */

const BASE_SERVICE_URL = 'https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Public/MapServer';
const LAYER_ID = 11;

export interface NHRemediationSite {
  site_id: string | null;
  site_name: string | null;
  facility_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  site_status: string | null;
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
 * Query NH Remediation Sites FeatureServer for proximity search
 * Returns remediation sites within the specified radius (in miles)
 */
export async function getNHRemediationSitesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHRemediationSite[]> {
  try {
    console.log(`🔧 Querying NH Remediation Sites within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NH Remediation Sites Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH Remediation Sites API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Remediation Sites found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const remediationSites: NHRemediationSite[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract site ID
      const siteId = attributes.site_id || 
                    attributes.SITE_ID || 
                    attributes.SiteId ||
                    attributes._site_id ||
                    attributes.id ||
                    attributes.ID ||
                    attributes.Id ||
                    attributes.objectid ||
                    attributes.OBJECTID ||
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
      
      // Extract facility name
      const facilityName = attributes.facility_name || 
                          attributes.FACILITY_NAME || 
                          attributes.FacilityName ||
                          attributes._facility_name ||
                          attributes.facility ||
                          attributes.FACILITY ||
                          null;
      
      // Extract address
      const address = attributes.address || 
                     attributes.ADDRESS || 
                     attributes.Address ||
                     attributes._address ||
                     attributes.street ||
                     attributes.STREET ||
                     attributes.street_address ||
                     attributes.STREET_ADDRESS ||
                     null;
      
      // Extract location info
      const city = attributes.city || 
                   attributes.CITY || 
                   attributes.City ||
                   attributes._city ||
                   attributes.gismunic ||
                   attributes.GISMUNIC ||
                   attributes.municipality ||
                   attributes.MUNICIPALITY ||
                   null;
      
      const state = attributes.st || 
                    attributes.ST || 
                    attributes.State ||
                    attributes._st ||
                    'NH';
      
      // Extract site status
      const siteStatus = attributes.site_status || 
                        attributes.SITE_STATUS || 
                        attributes.SiteStatus ||
                        attributes._site_status ||
                        attributes.status ||
                        attributes.STATUS ||
                        attributes.Status ||
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
        site_id: siteId ? String(siteId) : null,
        site_name: siteName,
        facility_name: facilityName,
        address,
        city,
        state,
        site_status: siteStatus,
        latitude,
        longitude,
        attributes,
        distance_miles
      };
    });
    
    console.log(`✅ Found ${remediationSites.length} NH Remediation Sites`);
    
    return remediationSites;
  } catch (error) {
    console.error('❌ Error querying NH Remediation Sites:', error);
    return [];
  }
}

