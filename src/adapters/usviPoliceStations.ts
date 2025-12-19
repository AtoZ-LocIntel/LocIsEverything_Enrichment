/**
 * USVI Police Stations Adapter
 * Queries USVI Police Stations from ArcGIS FeatureServer
 * Supports proximity queries to find police stations within a specified radius
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/Police_Stations_USVI/FeatureServer';
const LAYER_ID = 1;

export interface USVIPoliceStation {
  fac_name: string | null;
  fac_type: string | null;
  territory: string | null;
  county: string | null;
  x: number | null;
  y: number | null;
  usng: string | null;
  flood_zone: string | null;
  attributes: Record<string, any>;
  lat: number;
  lon: number;
  distance_miles?: number;
}

/**
 * Query USVI Police Stations FeatureServer for proximity search
 * Returns police stations within the specified radius (in miles)
 */
export async function getUSVIPoliceStationsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USVIPoliceStation[]> {
  try {
    console.log(`🚓 Querying USVI Police Stations within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 USVI Police Stations Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ USVI Police Stations API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No USVI Police Stations found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const policeStations: USVIPoliceStation[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract coordinates from geometry (point geometry has x, y)
      // ESRI geometry: x is longitude, y is latitude
      const destLon = geometry.x || attributes.X || null;
      const destLat = geometry.y || attributes.Y || null;
      
      // Extract fields from attributes
      const fac_name = attributes.FAC_NAME || attributes.fac_name || attributes.Fac_Name || null;
      const fac_type = attributes.FAC_TYPE || attributes.fac_type || attributes.Fac_Type || null;
      const territory = attributes.TERRITORY || attributes.territory || attributes.Territory || null;
      const county = attributes.COUNTY || attributes.county || attributes.County || null;
      const x = attributes.X || attributes.x || null;
      const y = attributes.Y || attributes.y || null;
      const usng = attributes.USNG || attributes.usng || attributes.Usng || null;
      const flood_zone = attributes.FLOOD_ZONE || attributes.flood_zone || attributes.Flood_Zone || null;
      
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
        fac_name,
        fac_type,
        territory,
        county,
        x,
        y,
        usng,
        flood_zone,
        attributes,
        lat: destLat || 0,
        lon: destLon || 0,
        distance_miles
      };
    });
    
    console.log(`✅ Found ${policeStations.length} USVI Police Stations`);
    
    return policeStations;
  } catch (error) {
    console.error('❌ Error querying USVI Police Stations:', error);
    return [];
  }
}

