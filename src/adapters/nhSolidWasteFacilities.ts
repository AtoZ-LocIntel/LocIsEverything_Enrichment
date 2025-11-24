/**
 * NH Solid Waste Facilities Adapter
 * Queries New Hampshire Solid Waste Facilities from DES FeatureServer
 * Supports proximity queries to find solid waste facilities within a specified radius
 * This is a point dataset
 */

const BASE_SERVICE_URL = 'https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Public/MapServer';
const LAYER_ID = 12;

export interface NHSolidWasteFacility {
  swf_lid: string | null;
  swf_name: string | null;
  swf_type: string | null;
  swf_status: string | null;
  swf_permit: string | null;
  address: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
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
 * Query NH Solid Waste Facilities FeatureServer for proximity search
 * Returns solid waste facilities within the specified radius (in miles)
 */
export async function getNHSolidWasteFacilitiesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHSolidWasteFacility[]> {
  try {
    console.log(`🗑️ Querying NH Solid Waste Facilities within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NH Solid Waste Facilities Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH Solid Waste Facilities API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Solid Waste Facilities found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const facilities: NHSolidWasteFacility[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract facility ID (SWF_LID)
      const swfLid = attributes.swf_lid || 
                    attributes.SWF_LID || 
                    attributes.SwfLid ||
                    attributes._swf_lid ||
                    attributes.facility_id ||
                    attributes.FACILITY_ID ||
                    attributes.id ||
                    attributes.ID ||
                    null;
      
      // Extract facility name
      const swfName = attributes.swf_name || 
                     attributes.SWF_NAME || 
                     attributes.SwfName ||
                     attributes._swf_name ||
                     attributes.name ||
                     attributes.NAME ||
                     attributes.Name ||
                     null;
      
      // Extract facility type
      const swfType = attributes.swf_type || 
                     attributes.SWF_TYPE || 
                     attributes.SwfType ||
                     attributes._swf_type ||
                     attributes.type ||
                     attributes.TYPE ||
                     attributes.Type ||
                     null;
      
      // Extract status
      const swfStatus = attributes.swf_status || 
                       attributes.SWF_STATUS || 
                       attributes.SwfStatus ||
                       attributes._swf_status ||
                       attributes.status ||
                       attributes.STATUS ||
                       attributes.Status ||
                       null;
      
      // Extract permit
      const swfPermit = attributes.swf_permit || 
                       attributes.SWF_PERMIT || 
                       attributes.SwfPermit ||
                       attributes._swf_permit ||
                       attributes.permit ||
                       attributes.PERMIT ||
                       null;
      
      // Extract address
      const address = attributes.swf_add_1 || 
                     attributes.SWF_ADD_1 || 
                     attributes.SwfAdd1 ||
                     attributes._swf_add_1 ||
                     attributes.address ||
                     attributes.ADDRESS ||
                     attributes.Address ||
                     attributes.street ||
                     attributes.STREET ||
                     null;
      
      // Extract address line 2
      const address2 = attributes.swf_add_2 || 
                      attributes.SWF_ADD_2 || 
                      attributes.SwfAdd2 ||
                      attributes._swf_add_2 ||
                      attributes.add2 ||
                      attributes.ADD2 ||
                      attributes.Add2 ||
                      attributes.address2 ||
                      attributes.ADDRESS2 ||
                      null;
      
      // Extract location info
      const city = attributes.swf_city || 
                  attributes.SWF_CITY || 
                  attributes.SwfCity ||
                  attributes._swf_city ||
                  attributes.city ||
                  attributes.CITY ||
                  attributes.City ||
                  attributes.town ||
                  attributes.TOWN ||
                  attributes.municipality ||
                  attributes.MUNICIPALITY ||
                  null;
      
      const state = attributes.st || 
                    attributes.ST || 
                    attributes.State ||
                    attributes._st ||
                    'NH';
      
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
      } else if (attributes.swf_lat && attributes.swf_long) {
        // Try SWF-specific lat/long fields
        latitude = parseFloat(attributes.swf_lat) || 0;
        longitude = parseFloat(attributes.swf_long) || 0;
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
        swf_lid: swfLid ? String(swfLid) : null,
        swf_name: swfName,
        swf_type: swfType,
        swf_status: swfStatus,
        swf_permit: swfPermit,
        address,
        address2,
        city,
        state,
        onestop_link: onestopLink,
        latitude,
        longitude,
        attributes,
        distance_miles
      };
    });
    
    console.log(`✅ Found ${facilities.length} NH Solid Waste Facilities`);
    
    return facilities;
  } catch (error) {
    console.error('❌ Error querying NH Solid Waste Facilities:', error);
    return [];
  }
}

