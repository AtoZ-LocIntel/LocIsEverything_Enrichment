/**
 * DE Schools Adapter
 * Queries Delaware Schools from DE FirstMap FeatureServer
 * Supports proximity queries for point features (schools) and point-in-polygon for districts
 */

const BASE_SERVICE_URL = 'https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Schools/FeatureServer';
const PUBLIC_SCHOOLS_LAYER_ID = 0;
const PRIVATE_SCHOOLS_LAYER_ID = 1;
const VOTECH_DISTRICTS_LAYER_ID = 2;
const SCHOOL_DISTRICTS_LAYER_ID = 3;

export interface DESchoolInfo {
  schoolId: string | null;
  name: string | null;
  schoolType: string | null;
  district: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  attributes: Record<string, any>;
  geometry?: any;
  distance_miles?: number;
}

export interface DESchoolDistrictInfo {
  districtId: string | null;
  name: string | null;
  districtType: string | null;
  attributes: Record<string, any>;
  geometry?: any;
  isContaining?: boolean;
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
 * Query DE Public Schools FeatureServer for proximity search
 */
export async function getDEPublicSchoolsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DESchoolInfo[]> {
  try {
    console.log(`🏫 Querying DE Public Schools within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = radiusMiles * 1609.34;
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${PUBLIC_SCHOOLS_LAYER_ID}/query`);
    
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
    
    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error) {
      console.error('❌ DE Public Schools API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No DE Public Schools found within ${radiusMiles} miles`);
      return [];
    }
    
    const schools: DESchoolInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      let schoolLat: number | null = null;
      let schoolLon: number | null = null;
      
      if (geometry) {
        if (geometry.y && geometry.x) {
          schoolLat = geometry.y;
          schoolLon = geometry.x;
        }
      }
      
      const name = attributes.NAME || attributes.name || attributes.SCHOOL_NAME || attributes.school_name || 'Public School';
      const schoolType = attributes.TYPE || attributes.type || attributes.SCHOOL_TYPE || attributes.school_type || null;
      const district = attributes.DISTRICT || attributes.district || attributes.DISTRICT_NAME || attributes.district_name || null;
      const address = attributes.ADDRESS || attributes.address || attributes.STREET || attributes.street || null;
      const city = attributes.CITY || attributes.city || null;
      const state = attributes.STATE || attributes.state || 'DE';
      const zip = attributes.ZIP || attributes.zip || attributes.ZIP_CODE || attributes.zip_code || null;
      const phone = attributes.PHONE || attributes.phone || attributes.TELEPHONE || attributes.telephone || null;
      
      const schoolId = attributes.OBJECTID || attributes.objectid || null;
      
      let distance_miles: number | undefined = undefined;
      if (schoolLat && schoolLon) {
        distance_miles = haversineDistance(lat, lon, schoolLat, schoolLon);
      }
      
      return {
        schoolId: schoolId ? schoolId.toString() : null,
        name,
        schoolType,
        district,
        address,
        city,
        state,
        zip,
        phone,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    const nearbySchools = schools
      .filter(school => school.distance_miles !== undefined && school.distance_miles <= radiusMiles)
      .sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    
    console.log(`✅ Found ${nearbySchools.length} DE Public Schools within ${radiusMiles} miles`);
    return nearbySchools;
  } catch (error) {
    console.error('❌ Error querying DE Public Schools:', error);
    return [];
  }
}

/**
 * Query DE Private Schools FeatureServer for proximity search
 */
export async function getDEPrivateSchoolsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DESchoolInfo[]> {
  try {
    console.log(`🏫 Querying DE Private Schools within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = radiusMiles * 1609.34;
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${PRIVATE_SCHOOLS_LAYER_ID}/query`);
    
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
    
    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error) {
      console.error('❌ DE Private Schools API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No DE Private Schools found within ${radiusMiles} miles`);
      return [];
    }
    
    const schools: DESchoolInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      let schoolLat: number | null = null;
      let schoolLon: number | null = null;
      
      if (geometry) {
        if (geometry.y && geometry.x) {
          schoolLat = geometry.y;
          schoolLon = geometry.x;
        }
      }
      
      const name = attributes.NAME || attributes.name || attributes.SCHOOL_NAME || attributes.school_name || 'Private School';
      const schoolType = attributes.TYPE || attributes.type || attributes.SCHOOL_TYPE || attributes.school_type || null;
      const district = attributes.DISTRICT || attributes.district || attributes.DISTRICT_NAME || attributes.district_name || null;
      const address = attributes.ADDRESS || attributes.address || attributes.STREET || attributes.street || null;
      const city = attributes.CITY || attributes.city || null;
      const state = attributes.STATE || attributes.state || 'DE';
      const zip = attributes.ZIP || attributes.zip || attributes.ZIP_CODE || attributes.zip_code || null;
      const phone = attributes.PHONE || attributes.phone || attributes.TELEPHONE || attributes.telephone || null;
      
      const schoolId = attributes.OBJECTID || attributes.objectid || null;
      
      let distance_miles: number | undefined = undefined;
      if (schoolLat && schoolLon) {
        distance_miles = haversineDistance(lat, lon, schoolLat, schoolLon);
      }
      
      return {
        schoolId: schoolId ? schoolId.toString() : null,
        name,
        schoolType,
        district,
        address,
        city,
        state,
        zip,
        phone,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    const nearbySchools = schools
      .filter(school => school.distance_miles !== undefined && school.distance_miles <= radiusMiles)
      .sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    
    console.log(`✅ Found ${nearbySchools.length} DE Private Schools within ${radiusMiles} miles`);
    return nearbySchools;
  } catch (error) {
    console.error('❌ Error querying DE Private Schools:', error);
    return [];
  }
}

/**
 * Query DE VoTech School Districts FeatureServer for point-in-polygon
 */
export async function getDEVoTechDistrictsData(
  lat: number,
  lon: number
): Promise<{ containing: DESchoolDistrictInfo | null; nearby: DESchoolDistrictInfo[] }> {
  try {
    console.log(`🏫 Querying DE VoTech School Districts for point [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${VOTECH_DISTRICTS_LAYER_ID}/query`);
    
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
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error) {
      console.error('❌ DE VoTech Districts API Error:', data.error);
      return { containing: null, nearby: [] };
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No DE VoTech School Districts found containing the point`);
      return { containing: null, nearby: [] };
    }
    
    const containingDistrict = data.features[0];
    const attributes = containingDistrict.attributes || {};
    const geometry = containingDistrict.geometry || null;
    
    const name = attributes.NAME || attributes.name || attributes.DISTRICT_NAME || attributes.district_name || 'VoTech School District';
    const districtId = attributes.OBJECTID || attributes.objectid || null;
    
    const district: DESchoolDistrictInfo = {
      districtId: districtId ? districtId.toString() : null,
      name,
      districtType: 'VoTech',
      attributes,
      geometry,
      isContaining: true
    };
    
    console.log(`✅ Found DE VoTech School District containing the point: ${name}`);
    return { containing: district, nearby: [] };
  } catch (error) {
    console.error('❌ Error querying DE VoTech School Districts:', error);
    return { containing: null, nearby: [] };
  }
}

/**
 * Query DE School Districts FeatureServer for point-in-polygon
 */
export async function getDESchoolDistrictsData(
  lat: number,
  lon: number
): Promise<{ containing: DESchoolDistrictInfo | null; nearby: DESchoolDistrictInfo[] }> {
  try {
    console.log(`🏫 Querying DE School Districts for point [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${SCHOOL_DISTRICTS_LAYER_ID}/query`);
    
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
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error) {
      console.error('❌ DE School Districts API Error:', data.error);
      return { containing: null, nearby: [] };
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No DE School Districts found containing the point`);
      return { containing: null, nearby: [] };
    }
    
    const containingDistrict = data.features[0];
    const attributes = containingDistrict.attributes || {};
    const geometry = containingDistrict.geometry || null;
    
    const name = attributes.NAME || attributes.name || attributes.DISTRICT_NAME || attributes.district_name || 'School District';
    const districtId = attributes.OBJECTID || attributes.objectid || null;
    
    const district: DESchoolDistrictInfo = {
      districtId: districtId ? districtId.toString() : null,
      name,
      districtType: 'Public',
      attributes,
      geometry,
      isContaining: true
    };
    
    console.log(`✅ Found DE School District containing the point: ${name}`);
    return { containing: district, nearby: [] };
  } catch (error) {
    console.error('❌ Error querying DE School Districts:', error);
    return { containing: null, nearby: [] };
  }
}

