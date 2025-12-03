/**
 * NJ Public Places to Keep Cool Adapter
 * Queries New Jersey Department of Environmental Protection (NJDEP) Public Places to Keep Cool
 * from the FeatureServer
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/QWdNfRs7lkPq4g4Q/arcgis/rest/services/Public_Places_to_Keep_Cool_in_New_Jersey/FeatureServer';
const LAYER_ID = 0;

export interface NJPublicPlaceToKeepCoolInfo {
  placeId: string | null;
  featureType: string | null;
  featureName: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  municipality: string | null;
  county: string | null;
  website: string | null;
  phoneNumber: string | null;
  admission: string | null;
  in211: string | null;
  notes: string | null;
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
 * Query NJ Public Places to Keep Cool FeatureServer for proximity search
 * Returns places within the specified radius (in miles, max 25 miles)
 */
export async function getNJPublicPlacesToKeepCoolData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NJPublicPlaceToKeepCoolInfo[]> {
  try {
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radiusMiles, 25.0);
    
    console.log(`❄️ Querying NJ Public Places to Keep Cool within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NJ Public Places to Keep Cool Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NJ Public Places to Keep Cool API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NJ Public Places to Keep Cool found within ${cappedRadius} miles`);
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} NJ Public Places to Keep Cool nearby`);
    
    // Process features and calculate distances
    const places: NJPublicPlaceToKeepCoolInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract place fields
      const featureType = attributes.FEATURE_TYPE || attributes.feature_type || attributes.FeatureType || null;
      const featureName = attributes.FEATURE_NAME || attributes.feature_name || attributes.FeatureName || null;
      const address = attributes.ADDRESS || attributes.address || null;
      const city = attributes.CITY || attributes.city || null;
      const zip = attributes.ZIP || attributes.zip || null;
      const municipality = attributes.MUNICIPALITY || attributes.municipality || null;
      const county = attributes.COUNTY || attributes.county || null;
      const website = attributes.WEBSITE || attributes.website || null;
      const phoneNumber = attributes.PHONE_NUMBER || attributes.phone_number || attributes.PHONE || attributes.phone || null;
      const admission = attributes.ADMISSION || attributes.admission || null;
      const in211 = attributes.IN_211 || attributes.in_211 || attributes.IN211 || attributes.in211 || null;
      const notes = attributes.NOTES || attributes.notes || null;
      
      // Get coordinates from geometry or attributes
      let placeLat: number | null = null;
      let placeLon: number | null = null;
      
      // First try geometry
      if (geometry.x !== undefined && geometry.y !== undefined) {
        placeLon = geometry.x;
        placeLat = geometry.y;
      } else if (geometry.latitude !== undefined && geometry.longitude !== undefined) {
        placeLat = geometry.latitude;
        placeLon = geometry.longitude;
      } else if (geometry.lat !== undefined && geometry.lon !== undefined) {
        placeLat = geometry.lat;
        placeLon = geometry.lon;
      }
      
      // Fallback to attributes if geometry not available
      if (placeLat === null || placeLon === null) {
        if (attributes.LATITUDE !== null && attributes.LATITUDE !== undefined) {
          placeLat = parseFloat(attributes.LATITUDE.toString());
        }
        if (attributes.LONGITUDE !== null && attributes.LONGITUDE !== undefined) {
          placeLon = parseFloat(attributes.LONGITUDE.toString());
        }
      }
      
      // Calculate distance
      let distance_miles: number | undefined = undefined;
      if (placeLat !== null && placeLon !== null) {
        distance_miles = haversineDistance(lat, lon, placeLat, placeLon);
      }
      
      const placeId = attributes.OBJECTID || attributes.objectid || attributes.GLOBALID || attributes.globalid || featureName || null;
      
      return {
        placeId: placeId ? placeId.toString() : null,
        featureType,
        featureName,
        address,
        city,
        zip,
        municipality,
        county,
        website,
        phoneNumber,
        admission,
        in211: in211 ? in211.toString() : null,
        notes,
        attributes,
        lat: placeLat,
        lon: placeLon,
        distance_miles
      };
    });
    
    // Filter by actual distance and sort by distance
    const filteredPlaces = places
      .filter(place => place.distance_miles !== undefined && place.distance_miles <= cappedRadius && place.lat !== null && place.lon !== null)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Returning ${filteredPlaces.length} NJ Public Places to Keep Cool within ${cappedRadius} miles`);
    
    return filteredPlaces;
    
  } catch (error) {
    console.error('❌ Error querying NJ Public Places to Keep Cool:', error);
    return [];
  }
}

