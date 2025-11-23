/**
 * NH Access Sites to Public Waters Adapter
 * Queries New Hampshire Access Sites to Public Waters from NH GRANIT FeatureServer
 * Supports proximity queries to find public water access sites within a specified radius
 */

const BASE_SERVICE_URL = 'https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_RecreationResources/FeatureServer';
const LAYER_ID = 0;

export interface NHPublicWatersAccess {
  facility: string | null;
  water_body: string | null;
  wb_type: string | null;
  access_typ: string | null;
  town: string | null;
  county: string | null;
  ownership: string | null;
  boat: string | null;
  swim: string | null;
  fish: string | null;
  picnic: string | null;
  camp: string | null;
  attributes: Record<string, any>;
  lat: number;
  lon: number;
  distance_miles?: number;
}

/**
 * Query NH Access Sites to Public Waters FeatureServer for proximity search
 * Returns public water access sites within the specified radius (in miles)
 */
export async function getNHPublicWatersAccessData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHPublicWatersAccess[]> {
  try {
    console.log(`🌊 Querying NH Access Sites to Public Waters within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NH Access Sites to Public Waters Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH Access Sites to Public Waters API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Access Sites to Public Waters found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const accessSites: NHPublicWatersAccess[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract coordinates from geometry (point geometry has x, y)
      // ESRI geometry: x is longitude, y is latitude
      // Also check for latitude/longitude fields in attributes
      const destLon = geometry.x || attributes.longitude || geometry.longitude || null;
      const destLat = geometry.y || attributes.latitude || geometry.latitude || null;
      
      // Extract facility and water body information
      const facility = attributes.facility || 
                       attributes.FACILITY || 
                       attributes.Facility ||
                       attributes._facility ||
                       null;
      
      const waterBody = attributes.water_body || 
                        attributes.WATER_BODY || 
                        attributes.WaterBody ||
                        attributes._water_body ||
                        null;
      
      const wbType = attributes.wb_type || 
                     attributes.WB_TYPE || 
                     attributes.WbType ||
                     attributes._wb_type ||
                     null;
      
      const accessTyp = attributes.access_typ || 
                        attributes.ACCESS_TYP || 
                        attributes.AccessTyp ||
                        attributes._access_typ ||
                        null;
      
      // Extract location information
      const town = attributes.town || attributes.TOWN || attributes.Town || '';
      const county = attributes.county || attributes.COUNTY || attributes.County || '';
      const ownership = attributes.ownership || attributes.OWNERSHIP || attributes.Ownership || '';
      
      // Extract amenities
      const boat = attributes.boat || attributes.BOAT || attributes.Boat || '';
      const swim = attributes.swim || attributes.SWIM || attributes.Swim || '';
      const fish = attributes.fish || attributes.FISH || attributes.Fish || '';
      const picnic = attributes.picnic || attributes.PICNIC || attributes.Picnic || '';
      const camp = attributes.camp || attributes.CAMP || attributes.Camp || '';
      
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
        facility,
        water_body: waterBody,
        wb_type: wbType,
        access_typ: accessTyp,
        town,
        county,
        ownership,
        boat,
        swim,
        fish,
        picnic,
        camp,
        attributes,
        lat: destLat || 0,
        lon: destLon || 0,
        distance_miles
      };
    });
    
    console.log(`✅ Found ${accessSites.length} NH Access Sites to Public Waters`);
    
    return accessSites;
  } catch (error) {
    console.error('❌ Error querying NH Access Sites to Public Waters:', error);
    return [];
  }
}

