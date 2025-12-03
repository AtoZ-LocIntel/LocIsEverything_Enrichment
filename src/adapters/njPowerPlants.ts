/**
 * NJ Power Plants Adapter
 * Queries New Jersey Department of Environmental Protection (NJDEP) Power Plants
 * from the Utilities MapServer
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://mapsdep.nj.gov/arcgis/rest/services/Features/Utilities/MapServer';
const LAYER_ID = 20;

export interface NJPowerPlantInfo {
  plantId: string | null;
  plantCode: string | null;
  plantName: string | null;
  utilityName: string | null;
  siteId: string | null;
  airPi: string | null;
  city: string | null;
  county: string | null;
  streetAddress: string | null;
  primarySource: string | null;
  installMW: number | null;
  totalMW: number | null;
  sourceDescription: string | null;
  technical: string | null;
  edc: string | null;
  gridSupply: string | null;
  dmrLink: string | null;
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
 * Query NJ Power Plants MapServer for proximity search
 * Returns power plants within the specified radius (in miles, max 25 miles)
 */
export async function getNJPowerPlantsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NJPowerPlantInfo[]> {
  try {
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radiusMiles, 25.0);
    
    console.log(`⚡ Querying NJ Power Plants within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NJ Power Plants Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NJ Power Plants API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NJ Power Plants found within ${cappedRadius} miles`);
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} NJ Power Plants nearby`);
    
    // Process features and calculate distances
    const powerPlants: NJPowerPlantInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract plant fields
      const plantCode = attributes.PLANT_CODE || attributes.plant_code || attributes.PLANTCODE || attributes.plantcode || null;
      const plantName = attributes.PLANT_NAME || attributes.plant_name || attributes.NAME || attributes.name || null;
      const utilityName = attributes.UTILITY_NAME || attributes.utility_name || null;
      const siteId = attributes.SITE_ID || attributes.site_id || null;
      const airPi = attributes.AIR_PI || attributes.air_pi || null;
      const city = attributes.CITY || attributes.city || null;
      const county = attributes.COUNTY || attributes.county || null;
      const streetAddress = attributes.STREET_ADD || attributes.street_add || attributes.ADDRESS || attributes.address || null;
      const primarySource = attributes.PRIMSOURCE || attributes.primsource || attributes.PRIMARY_SOURCE || attributes.primary_source || null;
      const installMW = attributes.INSTALL_MW !== null && attributes.INSTALL_MW !== undefined ? parseFloat(attributes.INSTALL_MW.toString()) : null;
      const totalMW = attributes.TOTAL_MW !== null && attributes.TOTAL_MW !== undefined ? parseFloat(attributes.TOTAL_MW.toString()) : null;
      const sourceDescription = attributes.SOURCE_DES || attributes.source_des || attributes.SOURCE_DESC || attributes.source_desc || null;
      const technical = attributes.TECHNICAL || attributes.technical || null;
      const edc = attributes.EDC || attributes.edc || null;
      const gridSupply = attributes.GRIDSUPPLY || attributes.gridsupply || attributes.GRID_SUPPLY || attributes.grid_supply || null;
      const dmrLink = attributes.DMR_LINK || attributes.dmr_link || attributes.DMR || attributes.dmr || null;
      
      // Get coordinates from geometry or attributes
      let plantLat: number | null = null;
      let plantLon: number | null = null;
      
      // First try geometry
      if (geometry.x !== undefined && geometry.y !== undefined) {
        plantLon = geometry.x;
        plantLat = geometry.y;
      } else if (geometry.latitude !== undefined && geometry.longitude !== undefined) {
        plantLat = geometry.latitude;
        plantLon = geometry.longitude;
      } else if (geometry.lat !== undefined && geometry.lon !== undefined) {
        plantLat = geometry.lat;
        plantLon = geometry.lon;
      }
      
      // Fallback to attributes if geometry not available
      if (plantLat === null || plantLon === null) {
        if (attributes.LATITUDE !== null && attributes.LATITUDE !== undefined) {
          plantLat = parseFloat(attributes.LATITUDE.toString());
        }
        if (attributes.LONGITUDE !== null && attributes.LONGITUDE !== undefined) {
          plantLon = parseFloat(attributes.LONGITUDE.toString());
        }
      }
      
      // Calculate distance
      let distance_miles: number | undefined = undefined;
      if (plantLat !== null && plantLon !== null) {
        distance_miles = haversineDistance(lat, lon, plantLat, plantLon);
      }
      
      const plantId = attributes.OBJECTID || attributes.objectid || plantCode || siteId || plantName || null;
      
      return {
        plantId: plantId ? plantId.toString() : null,
        plantCode: plantCode ? plantCode.toString() : null,
        plantName,
        utilityName,
        siteId: siteId ? siteId.toString() : null,
        airPi: airPi ? airPi.toString() : null,
        city,
        county,
        streetAddress,
        primarySource,
        installMW,
        totalMW,
        sourceDescription,
        technical,
        edc,
        gridSupply,
        dmrLink,
        attributes,
        lat: plantLat,
        lon: plantLon,
        distance_miles
      };
    });
    
    // Filter by actual distance and sort by distance
    const filteredPlants = powerPlants
      .filter(plant => plant.distance_miles !== undefined && plant.distance_miles <= cappedRadius && plant.lat !== null && plant.lon !== null)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Returning ${filteredPlants.length} NJ Power Plants within ${cappedRadius} miles`);
    
    return filteredPlants;
    
  } catch (error) {
    console.error('❌ Error querying NJ Power Plants:', error);
    return [];
  }
}

