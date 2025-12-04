/**
 * CT Water Pollution Control Facilities Adapter
 * Queries Connecticut Water Pollution Control Facilities from CT Geodata Portal FeatureServer
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/WATER_POLLUTION_CONTROL_FACILITIES/FeatureServer';
const LAYER_ID = 0;

export interface CTWaterPollutionControlInfo {
  facilityId: string | null;
  facilityName: string | null;
  permittee: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  phone: string | null;
  permitId: string | null;
  facilityIdCode: string | null;
  receivingWaterbody: string | null;
  dischargeType: string | null;
  facilityClass: string | null;
  owner: string | null;
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
 * Query CT Water Pollution Control Facilities FeatureServer for proximity search
 * Returns facilities within the specified radius (in miles, max 25 miles)
 */
export async function getCTWaterPollutionControlData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTWaterPollutionControlInfo[]> {
  try {
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radiusMiles, 25.0);
    
    console.log(`💧 Querying CT Water Pollution Control Facilities within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CT Water Pollution Control Facilities Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT Water Pollution Control Facilities API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No CT Water Pollution Control Facilities found within ${cappedRadius} miles`);
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} CT Water Pollution Control Facilities nearby`);
    
    // Process features and calculate distances
    const facilities: CTWaterPollutionControlInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract facility fields
      const facilityName = attributes.FACILITY_Name || attributes.facility_name || attributes.FACILITY_NAME || null;
      const permittee = attributes.Permitte || attributes.permittee || attributes.PERMITTEE || null;
      const address = attributes.FACILITY_Address || attributes.facility_address || attributes.ADDRESS__Permittee || attributes.address__permittee || null;
      const city = attributes.TOWN || attributes.town || attributes.CITY || attributes.city || null;
      const zip = attributes.Zip || attributes.zip || attributes.ZIP || null;
      const phone = attributes.PHONE || attributes.phone || null;
      const permitId = attributes.Permit_ID || attributes.permit_id || attributes.PERMIT_ID || null;
      const facilityIdCode = attributes.Facility_ID || attributes.facility_id || attributes.FACILITY_ID || null;
      const receivingWaterbody = attributes.Receiving_Waterbody || attributes.receiving_waterbody || attributes.RECEIVING_WATERBODY || null;
      const dischargeType = attributes.Discharge_Type || attributes.discharge_type || attributes.DISCHARGE_TYPE || null;
      const facilityClass = attributes.CLASS || attributes.class || attributes.CLASS_ || null;
      const owner = attributes.OWNER || attributes.owner || null;
      
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
        if (attributes.Latitude !== null && attributes.Latitude !== undefined) {
          facilityLat = parseFloat(attributes.Latitude.toString());
        }
        if (attributes.Longitude !== null && attributes.Longitude !== undefined) {
          facilityLon = parseFloat(attributes.Longitude.toString());
        }
      }
      
      // Calculate distance
      let distance_miles: number | undefined = undefined;
      if (facilityLat !== null && facilityLon !== null) {
        distance_miles = haversineDistance(lat, lon, facilityLat, facilityLon);
      }
      
      const facilityId = attributes.OBJECTID || attributes.objectid || attributes.Facility_ID || facilityIdCode || null;
      
      return {
        facilityId: facilityId ? facilityId.toString() : null,
        facilityName,
        permittee,
        address,
        city,
        zip,
        phone,
        permitId,
        facilityIdCode,
        receivingWaterbody,
        dischargeType,
        facilityClass,
        owner,
        attributes,
        lat: facilityLat,
        lon: facilityLon,
        distance_miles
      };
    });
    
    // Filter by actual distance and sort by distance
    const filteredFacilities = facilities
      .filter(facility => facility.distance_miles !== undefined && facility.distance_miles <= cappedRadius && facility.lat !== null && facility.lon !== null)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Returning ${filteredFacilities.length} CT Water Pollution Control Facilities within ${cappedRadius} miles`);
    
    return filteredFacilities;
    
  } catch (error) {
    console.error('❌ Error querying CT Water Pollution Control Facilities:', error);
    return [];
  }
}

