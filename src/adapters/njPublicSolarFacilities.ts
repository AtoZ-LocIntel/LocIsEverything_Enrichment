/**
 * NJ Public Solar Facilities Adapter
 * Queries New Jersey Department of Environmental Protection (NJDEP) Solar PV at Public Facilities
 * from the Utilities MapServer
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://mapsdep.nj.gov/arcgis/rest/services/Features/Utilities/MapServer';
const LAYER_ID = 17;

export interface NJPublicSolarFacilityInfo {
  facilityId: string | null;
  accountNumber: string | null;
  companyName: string | null;
  systemSize: number | null;
  customerType: string | null;
  installAddress: string | null;
  installCity: string | null;
  installZip: string | null;
  installer: string | null;
  statusDate: number | null;
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
 * Query NJ Public Solar Facilities MapServer for proximity search
 * Returns solar facilities within the specified radius (in miles, max 25 miles)
 */
export async function getNJPublicSolarFacilitiesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NJPublicSolarFacilityInfo[]> {
  try {
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radiusMiles, 25.0);
    
    console.log(`☀️ Querying NJ Public Solar Facilities within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NJ Public Solar Facilities Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NJ Public Solar Facilities API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NJ Public Solar Facilities found within ${cappedRadius} miles`);
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} NJ Public Solar Facilities nearby`);
    
    // Process features and calculate distances
    const solarFacilities: NJPublicSolarFacilityInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract facility fields
      const accountNumber = attributes.ACCOUNT_NUMBER || attributes.account_number || attributes.ACCOUNT || attributes.account || null;
      const companyName = attributes.COMPNAME || attributes.compname || attributes.COMPANY_NAME || attributes.company_name || attributes.NAME || attributes.name || null;
      const systemSize = attributes.SYSTEMSIZE !== null && attributes.SYSTEMSIZE !== undefined ? parseFloat(attributes.SYSTEMSIZE.toString()) : null;
      const customerType = attributes.CUSTOMERTYPE || attributes.customertype || attributes.CUSTOMER_TYPE || attributes.customer_type || null;
      const installAddress = attributes.INSTALLADD || attributes.installadd || attributes.INSTALL_ADDRESS || attributes.install_address || attributes.ADDRESS || attributes.address || null;
      const installCity = attributes.INSTALLCITY || attributes.installcity || attributes.INSTALL_CITY || attributes.install_city || attributes.CITY || attributes.city || null;
      const installZip = attributes.INSTALLZIP || attributes.installzip || attributes.INSTALL_ZIP || attributes.install_zip || attributes.ZIP || attributes.zip || null;
      const installer = attributes.INSTALLER || attributes.installer || null;
      const statusDate = attributes.STATUSDATE !== null && attributes.STATUSDATE !== undefined ? parseFloat(attributes.STATUSDATE.toString()) : null;
      
      // Get coordinates from geometry or attributes
      let facilityLat: number | null = null;
      let facilityLon: number | null = null;
      
      // First try geometry
      if (geometry.x !== undefined && geometry.y !== undefined) {
        facilityLon = geometry.x;
        facilityLat = geometry.y;
      } else if (geometry.latitude !== undefined && geometry.longitude !== undefined) {
        facilityLat = geometry.latitude;
        facilityLon = geometry.longitude;
      } else if (geometry.lat !== undefined && geometry.lon !== undefined) {
        facilityLat = geometry.lat;
        facilityLon = geometry.lon;
      }
      
      // Fallback to attributes if geometry not available
      if (facilityLat === null || facilityLon === null) {
        if (attributes.LATITUDE !== null && attributes.LATITUDE !== undefined) {
          facilityLat = parseFloat(attributes.LATITUDE.toString());
        }
        if (attributes.LONGITUDE !== null && attributes.LONGITUDE !== undefined) {
          facilityLon = parseFloat(attributes.LONGITUDE.toString());
        }
      }
      
      // Calculate distance
      let distance_miles: number | undefined = undefined;
      if (facilityLat !== null && facilityLon !== null) {
        distance_miles = haversineDistance(lat, lon, facilityLat, facilityLon);
      }
      
      const facilityId = attributes.OBJECTID || attributes.objectid || accountNumber || companyName || null;
      
      return {
        facilityId: facilityId ? facilityId.toString() : null,
        accountNumber,
        companyName,
        systemSize,
        customerType,
        installAddress,
        installCity,
        installZip,
        installer,
        statusDate,
        attributes,
        lat: facilityLat,
        lon: facilityLon,
        distance_miles
      };
    });
    
    // Filter by actual distance and sort by distance
    const filteredFacilities = solarFacilities
      .filter(facility => facility.distance_miles !== undefined && facility.distance_miles <= cappedRadius && facility.lat !== null && facility.lon !== null)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Returning ${filteredFacilities.length} NJ Public Solar Facilities within ${cappedRadius} miles`);
    
    return filteredFacilities;
    
  } catch (error) {
    console.error('❌ Error querying NJ Public Solar Facilities:', error);
    return [];
  }
}

