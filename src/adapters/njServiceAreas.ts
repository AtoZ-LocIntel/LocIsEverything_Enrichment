/**
 * NJ Service Areas Adapter
 * Queries New Jersey Service Areas from NJGIN FeatureServer
 * Supports proximity queries up to 50 miles
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/HggmsDF7UJsNN1FK/arcgis/rest/services/NJServiceArea/FeatureServer';
const LAYER_ID = 0;

export interface NJServiceAreaInfo {
  serviceAreaId: string | null;
  name: string | null;
  route: string | null;
  milepost: number | null;
  lineType: string | null;
  rotation: number | null;
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
 * Query NJ Service Areas FeatureServer for proximity search
 * Returns service areas within the specified radius (in miles, max 50 miles)
 */
export async function getNJServiceAreasData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NJServiceAreaInfo[]> {
  try {
    // Cap radius at 50 miles
    const cappedRadius = Math.min(radiusMiles, 50.0);
    
    console.log(`🛣️ Querying NJ Service Areas within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NJ Service Areas Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NJ Service Areas API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NJ Service Areas found within ${cappedRadius} miles`);
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} NJ Service Areas nearby`);
    
    // Process features and calculate distances
    const serviceAreas: NJServiceAreaInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract coordinates - check both geometry and attribute fields
      let lon = geometry.x || geometry.longitude || null;
      let lat = geometry.y || geometry.latitude || null;
      
      if (lat === null || lon === null) {
        console.warn('⚠️ Service area missing coordinates, skipping');
        return null;
      }
      
      // Extract service area fields
      const name = attributes.NAME || attributes.name || null;
      const route = attributes.ROUTE || attributes.route || null;
      const milepost = attributes.MILEPOST !== null && attributes.MILEPOST !== undefined ? parseFloat(attributes.MILEPOST.toString()) : null;
      const lineType = attributes.LINETYPE || attributes.linetype || null;
      const rotation = attributes.ROTATION !== null && attributes.ROTATION !== undefined ? parseFloat(attributes.ROTATION.toString()) : null;
      
      const serviceAreaId = attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || attributes.objectid_1 || null;
      
      return {
        serviceAreaId: serviceAreaId ? serviceAreaId.toString() : null,
        name,
        route,
        milepost,
        lineType,
        rotation,
        lat: parseFloat(lat.toString()),
        lon: parseFloat(lon.toString()),
        distance_miles: undefined, // Will be calculated below
        attributes
      };
    }).filter((area: NJServiceAreaInfo | null) => area !== null) as NJServiceAreaInfo[];
    
    // Filter by actual distance and sort by distance
    const filteredAreas = serviceAreas
      .map(area => ({
        ...area,
        distance_miles: haversineDistance(lat, lon, area.lat, area.lon)
      }))
      .filter(area => area.distance_miles <= cappedRadius)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Returning ${filteredAreas.length} NJ Service Areas within ${cappedRadius} miles`);
    
    return filteredAreas;
    
  } catch (error) {
    console.error('❌ Error querying NJ Service Areas:', error);
    return [];
  }
}

