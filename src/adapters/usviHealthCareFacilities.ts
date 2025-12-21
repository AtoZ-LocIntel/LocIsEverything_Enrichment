/**
 * USVI Health Care Facilities Adapter
 * Queries USVI Health Care Facilities from ArcGIS FeatureServer
 * Supports proximity queries to find health care facilities within a specified radius
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/Health_Care_Facilities_USVI_20230824/FeatureServer';
const LAYER_ID = 0;

export interface USVIHealthCareFacility {
  fac_type: string | null;
  territory: string | null;
  county: string | null;
  gen_capaci: string | null;
  diesel_gal: string | null;
  facilityName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  usng: string | null;
  watch_warning: string | null;
  hurricane_force_wind_prob: string | null;
  cone_intersection: string | null;
  upload_time: string | null;
  attributes: Record<string, any>;
  lat: number;
  lon: number;
  distance_miles?: number;
}

/**
 * Query USVI Health Care Facilities FeatureServer for proximity search
 * Returns health care facilities within the specified radius (in miles)
 */
export async function getUSVIHealthCareFacilitiesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USVIHealthCareFacility[]> {
  try {
    console.log(`🏥 Querying USVI Health Care Facilities within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 USVI Health Care Facilities Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ USVI Health Care Facilities API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No USVI Health Care Facilities found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const facilities: USVIHealthCareFacility[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract coordinates from geometry (point geometry has x, y)
      // ESRI geometry: x is longitude, y is latitude
      const destLon = geometry.x || attributes.Longitude || attributes.longitude || null;
      const destLat = geometry.y || attributes.Latitude || attributes.latitude || null;
      
      // Extract fields from attributes
      const fac_type = attributes.FAC_TYPE || attributes.fac_type || attributes.Fac_Type || null;
      const territory = attributes.TERRITORY || attributes.territory || attributes.Territory || null;
      const county = attributes.COUNTY || attributes.county || attributes.County || null;
      const gen_capaci = attributes.GEN_CAPACI || attributes.gen_capaci || attributes.Gen_Capaci || null;
      const diesel_gal = attributes.DIESEL_GAL || attributes.diesel_gal || attributes.Diesel_Gal || null;
      const facilityName = attributes.FacilityName || attributes.facilityName || attributes.facility_name || null;
      const address = attributes.address || attributes.Address || attributes.ADDRESS || null;
      const latitude = attributes.Latitude || attributes.latitude || null;
      const longitude = attributes.Longitude || attributes.longitude || null;
      const usng = attributes.USNG || attributes.usng || attributes.Usng || null;
      const watch_warning = attributes.Watch_Warning || attributes.watch_warning || attributes.WatchWarning || null;
      const hurricane_force_wind_prob = attributes.Hurricane_Force_Wind_Prob || attributes.hurricane_force_wind_prob || attributes.HurricaneForceWindProb || null;
      const cone_intersection = attributes.Cone_Intersection || attributes.cone_intersection || attributes.ConeIntersection || null;
      const upload_time = attributes.Upload_Time || attributes.upload_time || attributes.UploadTime || null;
      
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
        fac_type,
        territory,
        county,
        gen_capaci,
        diesel_gal,
        facilityName,
        address,
        latitude,
        longitude,
        usng,
        watch_warning,
        hurricane_force_wind_prob,
        cone_intersection,
        upload_time,
        attributes,
        lat: destLat || 0,
        lon: destLon || 0,
        distance_miles
      };
    });
    
    console.log(`✅ Found ${facilities.length} USVI Health Care Facilities`);
    
    return facilities;
  } catch (error) {
    console.error('❌ Error querying USVI Health Care Facilities:', error);
    return [];
  }
}

