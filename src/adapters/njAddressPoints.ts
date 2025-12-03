/**
 * NJ Address Points Adapter
 * Queries New Jersey Address Points from NJGIN FeatureServer
 * Supports proximity queries up to 1 mile
 */

const BASE_SERVICE_URL = 'https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/ArcGIS/rest/services/AddressPoints/FeatureServer';
const LAYER_ID = 3;

export interface NJAddressPointInfo {
  addressId: string | null;
  fullAddress: string | null;
  streetName: string | null;
  streetNumber: string | null;
  municipality: string | null;
  county: string | null;
  zipCode: string | null;
  state: string | null;
  country: string | null;
  subtype: string | null;
  primaryPoint: string | null;
  status: string | null;
  placement: string | null;
  lat: number;
  lon: number;
  distance_miles?: number;
  attributes: Record<string, any>;
}

/**
 * Calculate distance between two lat/lon points using Haversine formula
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
 * Query NJ Address Points FeatureServer for proximity search
 * Returns address points within the specified radius (in miles, max 1 mile)
 */
export async function getNJAddressPointsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NJAddressPointInfo[]> {
  try {
    // Cap radius at 5 miles
    const cappedRadius = Math.min(radiusMiles, 5.0);
    
    console.log(`📍 Querying NJ Address Points within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NJ Address Points Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NJ Address Points API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NJ Address Points found within ${cappedRadius} miles`);
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} NJ Address Points nearby`);
    
    // Process features and calculate distances
    const addressPoints: NJAddressPointInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract coordinates (ESRI returns x, y which is lon, lat)
      const lon = geometry.x || geometry.longitude || null;
      const lat = geometry.y || geometry.latitude || null;
      
      if (lat === null || lon === null) {
        console.warn('⚠️ Address point missing coordinates, skipping');
        return null;
      }
      
      // Distance will be calculated after we have all points
      
      // Extract address fields
      const streetName = attributes.ST_NAME || attributes.st_name || attributes.LST_NAME || attributes.lst_name || null;
      const streetNumber = attributes.ST_NUMBER || attributes.st_number || attributes.LST_NUMBER || attributes.lst_number || null;
      const municipality = attributes.INC_MUNI || attributes.inc_muni || attributes.MUNICIPALITY || attributes.municipality || null;
      const county = attributes.COUNTY || attributes.county || null;
      const zipCode = attributes.POST_CODE || attributes.post_code || attributes.ZIP_CODE || attributes.zip_code || attributes.ZIP5 || attributes.zip5 || null;
      const state = attributes.STATE || attributes.state || 'NJ';
      const country = attributes.COUNTRY || attributes.country || 'US';
      const subtype = attributes.SUBTYPE || attributes.subtype || null;
      const primaryPoint = attributes.PRIMARYPT || attributes.primarypt || null;
      const status = attributes.STATUS || attributes.status || null;
      const placement = attributes.PLACEMENT || attributes.placement || null;
      
      // Build full address
      let fullAddress = '';
      if (streetNumber) fullAddress += streetNumber + ' ';
      if (streetName) fullAddress += streetName;
      if (municipality) {
        if (fullAddress) fullAddress += ', ';
        fullAddress += municipality;
      }
      if (state) {
        if (fullAddress) fullAddress += ', ';
        fullAddress += state;
      }
      if (zipCode) {
        if (fullAddress) fullAddress += ' ';
        fullAddress += zipCode;
      }
      
      const addressId = attributes.OBJECTID || attributes.objectid || attributes.ADDR_PT_ID || attributes.addr_pt_id || null;
      
      return {
        addressId: addressId ? addressId.toString() : null,
        fullAddress: fullAddress || null,
        streetName,
        streetNumber,
        municipality,
        county,
        zipCode,
        state,
        country,
        subtype,
        primaryPoint,
        status,
        placement,
        lat,
        lon,
        distance_miles: undefined, // Will be calculated below
        attributes
      };
    }).filter((point: NJAddressPointInfo | null) => point !== null) as NJAddressPointInfo[];
    
    // Filter by actual distance and sort by distance
    const filteredPoints = addressPoints
      .map(point => ({
        ...point,
        distance_miles: haversineDistance(lat, lon, point.lat, point.lon)
      }))
      .filter(point => point.distance_miles <= cappedRadius)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Returning ${filteredPoints.length} NJ Address Points within ${cappedRadius} miles`);
    
    return filteredPoints;
    
  } catch (error) {
    console.error('❌ Error querying NJ Address Points:', error);
    return [];
  }
}

