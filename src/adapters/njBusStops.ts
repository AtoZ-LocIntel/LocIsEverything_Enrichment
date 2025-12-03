/**
 * NJ Bus Stops Adapter
 * Queries New Jersey Transit Bus Stops from NJGIN FeatureServer
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://services6.arcgis.com/M0t0HPE53pFK525U/arcgis/rest/services/Single_Point_Bus_Stops_of_NJ_Transit/FeatureServer';
const LAYER_ID = 0;

export interface NJBusStopInfo {
  stopId: string | null;
  stopNumber: string | null;
  description: string | null;
  county: string | null;
  municipality: string | null;
  stopType: string | null;
  direction: string | null;
  streetDirection: string | null;
  allLines: string | null;
  lat: number;
  lon: number;
  distance_miles?: number;
  attributes: Record<string, any>;
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
 * Query NJ Bus Stops FeatureServer for proximity search
 * Returns bus stops within the specified radius (in miles, max 25 miles)
 */
export async function getNJBusStopsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NJBusStopInfo[]> {
  try {
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radiusMiles, 25.0);
    
    console.log(`🚌 Querying NJ Bus Stops within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NJ Bus Stops Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NJ Bus Stops API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NJ Bus Stops found within ${cappedRadius} miles`);
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} NJ Bus Stops nearby`);
    
    // Process features and calculate distances
    const busStops: NJBusStopInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract coordinates - check both geometry and attribute fields
      let lon = geometry.x || geometry.longitude || attributes.DLONG_GIS || attributes.dlong_gis || null;
      let lat = geometry.y || geometry.latitude || attributes.DLAT_GIS || attributes.dlat_gis || null;
      
      // If geometry doesn't have coordinates, use attribute fields
      if (lat === null || lon === null) {
        lat = attributes.DLAT_GIS || attributes.dlat_gis || null;
        lon = attributes.DLONG_GIS || attributes.dlong_gis || null;
      }
      
      if (lat === null || lon === null) {
        console.warn('⚠️ Bus stop missing coordinates, skipping');
        return null;
      }
      
      // Extract bus stop fields
      const stopNumber = attributes.STOP_NUM || attributes.stop_num || attributes.STOP_NUMBER || attributes.stop_number || null;
      const description = attributes.DESCRIPTION_BSL || attributes.description_bsl || attributes.DESCRIPTION || attributes.description || null;
      const county = attributes.COUNTY || attributes.county || null;
      const municipality = attributes.MUNICIPALITY || attributes.municipality || null;
      const stopType = attributes.STOP_TYPE || attributes.stop_type || null;
      const direction = attributes.DIRECTION_OP || attributes.direction_op || attributes.DIRECTION || attributes.direction || null;
      const streetDirection = attributes.STREET_DIR || attributes.street_dir || null;
      const allLines = attributes.ALL_LINES || attributes.all_lines || attributes.LINES || attributes.lines || null;
      
      const stopId = attributes.OBJECTID || attributes.objectid || stopNumber || null;
      
      return {
        stopId: stopId ? stopId.toString() : null,
        stopNumber: stopNumber ? stopNumber.toString() : null,
        description,
        county,
        municipality,
        stopType,
        direction,
        streetDirection,
        allLines,
        lat: parseFloat(lat.toString()),
        lon: parseFloat(lon.toString()),
        distance_miles: undefined, // Will be calculated below
        attributes
      };
    }).filter((stop: NJBusStopInfo | null) => stop !== null) as NJBusStopInfo[];
    
    // Filter by actual distance and sort by distance
    const filteredStops = busStops
      .map(stop => ({
        ...stop,
        distance_miles: haversineDistance(lat, lon, stop.lat, stop.lon)
      }))
      .filter(stop => stop.distance_miles <= cappedRadius)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Returning ${filteredStops.length} NJ Bus Stops within ${cappedRadius} miles`);
    
    return filteredStops;
    
  } catch (error) {
    console.error('❌ Error querying NJ Bus Stops:', error);
    return [];
  }
}

