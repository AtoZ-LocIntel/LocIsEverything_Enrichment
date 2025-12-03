/**
 * NJ Alternative Fueled Vehicle Fueling Stations Adapter
 * Queries New Jersey Department of Environmental Protection (NJDEP) Alternative Fueled Vehicle Fueling Stations
 * from the Structures MapServer
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://mapsdep.nj.gov/arcgis/rest/services/Features/Structures/MapServer';
const LAYER_ID = 1;

export interface NJAlternativeFuelStationInfo {
  stationId: string | null;
  stationName: string | null;
  address: string | null;
  municipality: string | null;
  county: string | null;
  zipCode: string | null;
  fuelType: string | null;
  stationType: string | null;
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
 * Query NJ Alternative Fueled Vehicle Fueling Stations MapServer for proximity search
 * Returns fueling stations within the specified radius (in miles, max 25 miles)
 */
export async function getNJAlternativeFuelStationsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NJAlternativeFuelStationInfo[]> {
  try {
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radiusMiles, 25.0);
    
    console.log(`⛽ Querying NJ Alternative Fueled Vehicle Fueling Stations within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NJ Alternative Fuel Stations Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NJ Alternative Fuel Stations API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NJ Alternative Fueled Vehicle Fueling Stations found within ${cappedRadius} miles`);
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} NJ Alternative Fueled Vehicle Fueling Stations nearby`);
    
    // Process features and calculate distances
    const fuelStations: NJAlternativeFuelStationInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract station fields - check various possible field names
      const stationName = attributes.NAME || attributes.name || attributes.STATION_NAME || attributes.station_name || attributes.FACILITY_NAME || attributes.facility_name || null;
      const address = attributes.ADDRESS || attributes.address || attributes.ADDR || attributes.addr || attributes.STREET_ADDRESS || attributes.street_address || null;
      const municipality = attributes.MUNICIPALITY || attributes.municipality || attributes.MUNI || attributes.muni || attributes.CITY || attributes.city || null;
      const county = attributes.COUNTY || attributes.county || null;
      const zipCode = attributes.ZIP_CODE || attributes.zip_code || attributes.ZIP || attributes.zip || attributes.POSTAL_CODE || attributes.postal_code || null;
      const fuelType = attributes.FUEL_TYPE || attributes.fuel_type || attributes.TYPE || attributes.type || attributes.ALTERNATIVE_FUEL || attributes.alternative_fuel || null;
      const stationType = attributes.STATION_TYPE || attributes.station_type || attributes.FACILITY_TYPE || attributes.facility_type || null;
      
      // Get coordinates from geometry
      let stationLat: number | null = null;
      let stationLon: number | null = null;
      
      if (geometry.x !== undefined && geometry.y !== undefined) {
        stationLon = geometry.x;
        stationLat = geometry.y;
      } else if (geometry.latitude !== undefined && geometry.longitude !== undefined) {
        stationLat = geometry.latitude;
        stationLon = geometry.longitude;
      } else if (geometry.lat !== undefined && geometry.lon !== undefined) {
        stationLat = geometry.lat;
        stationLon = geometry.lon;
      }
      
      // Calculate distance
      let distance_miles: number | undefined = undefined;
      if (stationLat !== null && stationLon !== null) {
        distance_miles = haversineDistance(lat, lon, stationLat, stationLon);
      }
      
      const stationId = attributes.OBJECTID || attributes.objectid || attributes.STATION_ID || attributes.station_id || stationName || null;
      
      return {
        stationId: stationId ? stationId.toString() : null,
        stationName,
        address,
        municipality,
        county,
        zipCode,
        fuelType,
        stationType,
        attributes,
        lat: stationLat,
        lon: stationLon,
        distance_miles
      };
    });
    
    // Filter by actual distance and sort by distance
    const filteredStations = fuelStations
      .filter(station => station.distance_miles !== undefined && station.distance_miles <= cappedRadius && station.lat !== null && station.lon !== null)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Returning ${filteredStations.length} NJ Alternative Fueled Vehicle Fueling Stations within ${cappedRadius} miles`);
    
    return filteredStations;
    
  } catch (error) {
    console.error('❌ Error querying NJ Alternative Fueled Vehicle Fueling Stations:', error);
    return [];
  }
}

