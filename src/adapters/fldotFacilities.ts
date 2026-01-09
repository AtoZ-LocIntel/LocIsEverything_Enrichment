/**
 * Adapter for FLDOT Facilities Feature Service
 * Service URL: https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/FDOTFAC10312016/FeatureServer/0
 */

export interface FLDOTFacilityInfo {
  fid: number | null;
  facName: string | null;
  facType: string | null;
  streetNumber: string | null;
  roadName: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  zipCode: string | null;
  longAddress: string | null;
  phone: string | null;
  district: string | null;
  source: string | null;
  name: string | null;
  lat: number | null;
  lon: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

export async function getFLDOTFacilitiesData(
  lat: number,
  lon: number,
  radius?: number
): Promise<FLDOTFacilityInfo[]> {
  const BASE_SERVICE_URL = 'https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/FDOTFAC10312016/FeatureServer/0';
  
  try {
    if (!radius || radius <= 0) {
      console.log(`🏢 FLDOT Facilities: No radius provided, skipping proximity query`);
      return [];
    }
    
    // Cap radius at 50 miles
    const cappedRadius = Math.min(radius, 50.0);
    
    console.log(`🏢 Querying FLDOT Facilities within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    // Convert radius from miles to meters
    const radiusMeters = cappedRadius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/query`);
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
    queryUrl.searchParams.set('geometryPrecision', '6');
    queryUrl.searchParams.set('maxAllowableOffset', '0');
    
    console.log(`🔗 FLDOT Facilities Query URL: ${queryUrl.toString()}`);
    
    const response = await fetchWithTimeout(queryUrl.toString(), 30000);
    
    if (!response.ok) {
      console.error(`❌ FLDOT Facilities HTTP error! status: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ FLDOT Facilities API Error:', data.error);
      return [];
    }
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn('No features array in FLDOT Facilities response');
      return [];
    }
    
    const facilities: FLDOTFacilityInfo[] = [];
    
    for (const feature of data.features) {
      try {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        if (!geometry || (typeof geometry.x !== 'number' || typeof geometry.y !== 'number')) {
          continue;
        }
        
        // Calculate distance
        const pointLat = geometry.y;
        const pointLon = geometry.x;
        const distance_miles = calculateDistance(lat, lon, pointLat, pointLon);
        
        // Only include if within radius
        if (distance_miles > cappedRadius) {
          continue;
        }
        
        const facilityInfo: FLDOTFacilityInfo = {
          fid: attributes.FID !== null && attributes.FID !== undefined ? Number(attributes.FID) : null,
          facName: attributes.Fac_Name || attributes.FAC_NAME || null,
          facType: attributes.Fac_Type || attributes.FAC_TYPE || null,
          streetNumber: attributes.StreetNumb || attributes.STREETNUMB || null,
          roadName: attributes.RoadName || attributes.ROADNAME || null,
          city: attributes.City || attributes.CITY || null,
          county: attributes.County || attributes.COUNTY || null,
          state: attributes.State || attributes.STATE || null,
          zipCode: attributes.ZipCode || attributes.ZIPCODE || null,
          longAddress: attributes.Long_Addre || attributes.LONG_ADDRE || null,
          phone: attributes.Phone || attributes.PHONE || null,
          district: attributes.District || attributes.DISTRICT || null,
          source: attributes.Source || attributes.SOURCE || null,
          name: attributes.Name || attributes.NAME || null,
          lat: pointLat,
          lon: pointLon,
          attributes: attributes,
          geometry: geometry,
          distance_miles: distance_miles
        };
        
        facilities.push(facilityInfo);
      } catch (error: any) {
        console.error('Error processing FLDOT Facility feature:', error);
        continue;
      }
    }
    
    console.log(`🏢 Retrieved ${facilities.length} FLDOT Facilities`);
    return facilities;
    
  } catch (error: any) {
    console.error('❌ Error fetching FLDOT Facilities:', error);
    return [];
  }
}
