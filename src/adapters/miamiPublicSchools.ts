/**
 * Miami Public Schools Adapter
 * Queries City of Miami public school sites
 * Supports proximity queries for point features
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/CvuPhqcTQpZPT9qY/arcgis/rest/services/School_Site/FeatureServer';

export interface MiamiPublicSchoolInfo {
  objectId: string | null;
  folio: string | null;
  schoolId: string | null;
  name: string | null;
  campus: string | null;
  address: string | null;
  unit: string | null;
  city: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  type: string | null;
  grades: string | null;
  capacity: number | null;
  enrollment: number | null;
  region: string | null;
  lat: number | null;
  lon: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Helper function to fetch with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Query Miami Public Schools (Layer 0) - Point features
 */
export async function getMiamiPublicSchoolsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<MiamiPublicSchoolInfo[]> {
  try {
    const results: MiamiPublicSchoolInfo[] = [];
    const LAYER_ID = 0;
    
    if (!radius || radius <= 0) {
      console.log(`📍 Miami Public Schools: No radius provided, skipping proximity query`);
      return results;
    }
    
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radius, 25.0);
    
    console.log(`🎓 Querying Miami Public Schools within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    // Convert radius from miles to meters
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
    queryUrl.searchParams.set('geometryPrecision', '6'); // Request full precision geometry
    queryUrl.searchParams.set('maxAllowableOffset', '0'); // Don't simplify geometry
    
    console.log(`🔗 Miami Public Schools Query URL: ${queryUrl.toString()}`);
    
    let data: any;
    try {
      const response = await fetchWithTimeout(queryUrl.toString(), 30000);
      
      if (!response.ok) {
        console.error(`❌ Miami Public Schools HTTP error! status: ${response.status}`);
        return results;
      }
      
      data = await response.json();
    } catch (error: any) {
      console.error('❌ Miami Public Schools fetch error:', error.message || error);
      return results;
    }
    
    if (data.error) {
      console.error('❌ Miami Public Schools API Error:', data.error);
      return results;
    }
    
    console.log(`🔍 API Response Summary:`, {
      hasFeatures: !!data.features,
      featuresCount: data.features?.length || 0,
      firstFeatureSample: data.features?.[0] ? {
        hasAttributes: !!data.features[0].attributes,
        hasGeometry: !!data.features[0].geometry,
        geometryKeys: data.features[0].geometry ? Object.keys(data.features[0].geometry) : [],
        geometryType: data.features[0].geometry?.type,
        hasX: data.features[0].geometry?.x !== undefined,
        hasY: data.features[0].geometry?.y !== undefined
      } : null
    });
    
    if (data.features && data.features.length > 0) {
      data.features.forEach((feature: any) => {
        try {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          // Extract school information
          const objectId = attributes.OBJECTID || attributes.objectid || attributes.FID || null;
          const folio = attributes.FOLIO || attributes.folio || null;
          const schoolId = attributes.ID || attributes.id || attributes.SchoolID || attributes.schoolId || null;
          const name = attributes.NAME || attributes.name || attributes.Name || null;
          const campus = attributes.CAMPUS || attributes.campus || attributes.Campus || null;
          const address = attributes.ADDRESS || attributes.address || attributes.Address || null;
          const unit = attributes.UNIT || attributes.unit || attributes.Unit || null;
          const city = attributes.CITY || attributes.city || attributes.City || null;
          const zipCode = attributes.ZIPCODE || attributes.zipCode || attributes.zip_code || attributes.ZIP_CODE || null;
          const phone = attributes.PHONE || attributes.phone || attributes.Phone || null;
          const email = attributes.EMAIL || attributes.email || attributes.Email || null;
          const type = attributes.TYPE || attributes.type || attributes.Type || null;
          const grades = attributes.GRADES || attributes.grades || attributes.Grades || null;
          const capacity = attributes.CAPACITY !== null && attributes.CAPACITY !== undefined ? attributes.CAPACITY :
                          attributes.capacity !== null && attributes.capacity !== undefined ? attributes.capacity : null;
          const enrollment = attributes.ENROLLMNT !== null && attributes.ENROLLMNT !== undefined ? attributes.ENROLLMNT :
                            attributes.enrollment !== null && attributes.enrollment !== undefined ? attributes.enrollment :
                            attributes.ENROLLMENT !== null && attributes.ENROLLMENT !== undefined ? attributes.ENROLLMENT : null;
          const region = attributes.REGION || attributes.region || attributes.Region || null;
          const lat = attributes.LAT !== null && attributes.LAT !== undefined ? attributes.LAT :
                     attributes.lat !== null && attributes.lat !== undefined ? attributes.lat : null;
          const lon = attributes.LON !== null && attributes.LON !== undefined ? attributes.LON :
                     attributes.lon !== null && attributes.lon !== undefined ? attributes.lon : null;
          
          // Calculate distance to point
          let distance = cappedRadius || 0;
          if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
            // Point coordinates: x is longitude, y is latitude (after outSR=4326)
            const pointLon = geometry.x;
            const pointLat = geometry.y;
            distance = calculateDistance(lat, lon, pointLat, pointLon);
          }
          
          results.push({
            objectId: objectId ? objectId.toString() : null,
            folio,
            schoolId: schoolId ? schoolId.toString() : null,
            name,
            campus,
            address,
            unit,
            city,
            zipCode,
            phone,
            email,
            type,
            grades,
            capacity: capacity !== null ? Number(capacity) : null,
            enrollment: enrollment !== null ? Number(enrollment) : null,
            region,
            lat: lat !== null ? Number(lat) : null,
            lon: lon !== null ? Number(lon) : null,
            attributes,
            geometry: geometry, // Preserve full geometry object (point with x, y)
            distance_miles: distance
          });
        } catch (error: any) {
          console.error('❌ Error processing Miami Public School feature:', error.message || error);
        }
      });
    }
    
    console.log(`✅ Miami Public Schools: Found ${results.length} school(s)`);
    return results;
  } catch (error: any) {
    console.error('❌ Error querying Miami Public Schools data:', error.message || error);
    return [];
  }
}

