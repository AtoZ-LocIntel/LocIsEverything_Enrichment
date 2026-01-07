/**
 * Miami Business Location (FD Inspected) Adapter
 * Queries City of Miami businesses with Fire Department Certificate of Occupancy
 * Supports proximity queries for point features
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/CvuPhqcTQpZPT9qY/arcgis/rest/services/Business_with_Fire_Department_Certificate_Occupancy/FeatureServer';

export interface MiamiBusinessFDInspectedInfo {
  objectId: string | null;
  businessId: string | null;
  businessName: string | null;
  businessAddress: string | null;
  city: string | null;
  stateCode: string | null;
  zipCode: string | null;
  squareFoot: number | null;
  folioNumber: string | null;
  fireZone90: string | null;
  activity: string | null;
  activity2: string | null;
  activity3: string | null;
  activity4: string | null;
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
 * Query Miami Business Locations with Fire Department Certificate of Occupancy (Layer 0) - Point features
 */
export async function getMiamiBusinessFDInspectedData(
  lat: number,
  lon: number,
  radius?: number
): Promise<MiamiBusinessFDInspectedInfo[]> {
  try {
    const results: MiamiBusinessFDInspectedInfo[] = [];
    const LAYER_ID = 0;
    
    if (!radius || radius <= 0) {
      console.log(`📍 Miami Business FD Inspected: No radius provided, skipping proximity query`);
      return results;
    }
    
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radius, 25.0);
    
    console.log(`🏢 Querying Miami Business Locations (FD Inspected) within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 Miami Business FD Inspected Query URL: ${queryUrl.toString()}`);
    
    let data: any;
    try {
      const response = await fetchWithTimeout(queryUrl.toString(), 30000);
      
      if (!response.ok) {
        console.error(`❌ Miami Business FD Inspected HTTP error! status: ${response.status}`);
        return results;
      }
      
      data = await response.json();
    } catch (error: any) {
      console.error('❌ Miami Business FD Inspected fetch error:', error.message || error);
      return results;
    }
    
    if (data.error) {
      console.error('❌ Miami Business FD Inspected API Error:', data.error);
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
          
          // Extract business information
          const objectId = attributes.OBJECTID || attributes.objectid || attributes.FID || attributes.FID || null;
          const businessId = attributes.BusinessID || attributes.businessId || attributes.business_id || attributes.BUSINESS_ID || null;
          const businessName = attributes.BusinessNa || attributes.businessNa || attributes.business_name || attributes.BUSINESS_NAME || attributes.BusinessName || null;
          const businessAddress = attributes.BusinessAd || attributes.businessAd || attributes.business_address || attributes.BUSINESS_ADDRESS || attributes.BusinessAddress || null;
          const city = attributes.City || attributes.city || null;
          const stateCode = attributes.StateCode || attributes.stateCode || attributes.state_code || attributes.STATE_CODE || null;
          const zipCode = attributes.ZipCode || attributes.zipCode || attributes.zip_code || attributes.ZIP_CODE || null;
          const squareFoot = attributes.SquareFoot !== null && attributes.SquareFoot !== undefined ? attributes.SquareFoot :
                            attributes.squareFoot !== null && attributes.squareFoot !== undefined ? attributes.squareFoot :
                            attributes.square_foot !== null && attributes.square_foot !== undefined ? attributes.square_foot : null;
          const folioNumber = attributes.FolioNumbe || attributes.folioNumbe || attributes.folio_number || attributes.FOLIO_NUMBER || null;
          const fireZone90 = attributes.FireZone90 || attributes.fireZone90 || attributes.fire_zone_90 || attributes.FIRE_ZONE_90 || null;
          const activity = attributes.ACTIVITY || attributes.activity || null;
          const activity2 = attributes.ACTIVITY2 || attributes.activity2 || attributes.activity_2 || null;
          const activity3 = attributes.ACTIVITY3 || attributes.activity3 || attributes.activity_3 || null;
          const activity4 = attributes.ACTIVITY4 || attributes.activity4 || attributes.activity_4 || null;
          
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
            businessId: businessId ? businessId.toString() : null,
            businessName,
            businessAddress,
            city,
            stateCode,
            zipCode,
            squareFoot: squareFoot !== null ? Number(squareFoot) : null,
            folioNumber,
            fireZone90,
            activity,
            activity2,
            activity3,
            activity4,
            attributes,
            geometry: geometry, // Preserve full geometry object (point with x, y)
            distance_miles: distance
          });
        } catch (error: any) {
          console.error('❌ Error processing Miami Business FD Inspected feature:', error.message || error);
        }
      });
    }
    
    console.log(`✅ Miami Business FD Inspected: Found ${results.length} business(es)`);
    return results;
  } catch (error: any) {
    console.error('❌ Error querying Miami Business FD Inspected data:', error.message || error);
    return [];
  }
}

