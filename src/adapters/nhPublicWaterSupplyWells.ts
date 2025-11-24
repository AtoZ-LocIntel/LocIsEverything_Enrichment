/**
 * NH Public Water Supply Wells Adapter
 * Queries New Hampshire Public Water Supply Wells from DES FeatureServer
 * Supports proximity queries to find public water supply wells within a specified radius
 * This is a point dataset
 */

const BASE_SERVICE_URL = 'https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Secure/MapServer';
const LAYER_ID = 2;

export interface NHPublicWaterSupplyWell {
  well_id: string | null;
  facility_name: string | null;
  owner_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  well_depth_ft: number | null;
  water_depth_ft: number | null;
  latitude: number;
  longitude: number;
  attributes: Record<string, any>;
  distance_miles?: number;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Query NH Public Water Supply Wells FeatureServer for proximity search
 * Returns public water supply wells within the specified radius (in miles)
 */
export async function getNHPublicWaterSupplyWellsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHPublicWaterSupplyWell[]> {
  try {
    console.log(`🚰 Querying NH Public Water Supply Wells within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    queryUrl.searchParams.set('returnGeometry', 'true');
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    
    console.log(`🔗 NH Public Water Supply Wells Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH Public Water Supply Wells API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Public Water Supply Wells found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const publicWells: NHPublicWaterSupplyWell[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract well ID
      const wellId = attributes.well_id || 
                    attributes.WELL_ID || 
                    attributes.WellId ||
                    attributes._well_id ||
                    attributes.id ||
                    attributes.ID ||
                    attributes.Id ||
                    attributes.objectid ||
                    attributes.OBJECTID ||
                    null;
      
      // Extract facility name
      const facilityName = attributes.facility_name || 
                           attributes.FACILITY_NAME || 
                           attributes.FacilityName ||
                           attributes._facility_name ||
                           attributes.name ||
                           attributes.NAME ||
                           attributes.Name ||
                           null;
      
      // Extract owner name
      const ownerName = attributes.owner_name || 
                       attributes.OWNER_NAME || 
                       attributes.OwnerName ||
                       attributes._owner_name ||
                       attributes.owner ||
                       attributes.OWNER ||
                       attributes.Owner ||
                       null;
      
      // Extract address
      const address = attributes.address || 
                     attributes.ADDRESS || 
                     attributes.Address ||
                     attributes._address ||
                     attributes.street ||
                     attributes.STREET ||
                     attributes.street_address ||
                     attributes.STREET_ADDRESS ||
                     null;
      
      // Extract location info
      const city = attributes.city || 
                   attributes.CITY || 
                   attributes.City ||
                   attributes._city ||
                   attributes.gismunic ||
                   attributes.GISMUNIC ||
                   attributes.municipality ||
                   attributes.MUNICIPALITY ||
                   null;
      
      const state = attributes.st || 
                    attributes.ST || 
                    attributes.State ||
                    attributes._st ||
                    'NH';
      
      // Extract well depth
      const wellDepth = attributes.well_depth_ft || 
                       attributes.WELL_DEPTH_FT || 
                       attributes.WellDepthFt ||
                       attributes._well_depth_ft ||
                       attributes.depth ||
                       attributes.DEPTH ||
                       attributes.well_depth ||
                       attributes.WELL_DEPTH ||
                       null;
      
      // Extract water depth
      const waterDepth = attributes.water_depth_ft || 
                        attributes.WATER_DEPTH_FT || 
                        attributes.WaterDepthFt ||
                        attributes._water_depth_ft ||
                        attributes.water_depth ||
                        attributes.WATER_DEPTH ||
                        attributes.static_water_level ||
                        attributes.STATIC_WATER_LEVEL ||
                        null;
      
      // Get coordinates from geometry (point)
      let latitude = 0;
      let longitude = 0;
      
      if (geometry.x && geometry.y) {
        // ESRI point geometry has x, y coordinates
        longitude = geometry.x;
        latitude = geometry.y;
      } else if (geometry.latitude && geometry.longitude) {
        latitude = geometry.latitude;
        longitude = geometry.longitude;
      } else if (attributes.latitude && attributes.longitude) {
        // Try to parse from attributes if available
        latitude = parseFloat(attributes.latitude) || 0;
        longitude = parseFloat(attributes.longitude) || 0;
      }
      
      // Calculate distance from search point
      let distance_miles: number | undefined = undefined;
      if (latitude !== 0 && longitude !== 0) {
        distance_miles = calculateDistance(lat, lon, latitude, longitude);
      }
      
      return {
        well_id: wellId ? String(wellId) : null,
        facility_name: facilityName,
        owner_name: ownerName,
        address,
        city,
        state,
        well_depth_ft: wellDepth !== null && wellDepth !== undefined ? Number(wellDepth) : null,
        water_depth_ft: waterDepth !== null && waterDepth !== undefined ? Number(waterDepth) : null,
        latitude,
        longitude,
        attributes,
        distance_miles
      };
    });
    
    console.log(`✅ Found ${publicWells.length} NH Public Water Supply Wells`);
    
    return publicWells;
  } catch (error) {
    console.error('❌ Error querying NH Public Water Supply Wells:', error);
    return [];
  }
}

