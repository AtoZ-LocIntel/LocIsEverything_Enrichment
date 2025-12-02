/**
 * DE Child Care Centers Adapter
 * Queries Delaware Child Care Centers from DE FirstMap FeatureServer
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_ChildCareCenters/FeatureServer';
const LAYER_ID = 0;

export interface DEChildCareCenterInfo {
  centerId: string | null;
  name: string | null;
  type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  county: string | null;
  capacity: number | null;
  starLevel: number | null;
  ageRange: string | null;
  opens: string | null;
  closes: string | null;
  attributes: Record<string, any>;
  geometry?: any;
  distance_miles?: number;
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
 * Query DE Child Care Centers FeatureServer for proximity search
 */
export async function getDEChildCareCentersData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DEChildCareCenterInfo[]> {
  try {
    console.log(`🏫 Querying DE Child Care Centers within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = radiusMiles * 1609.34;
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
    
    console.log(`🔗 DE Child Care Centers Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error) {
      console.error('❌ DE Child Care Centers API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No DE Child Care Centers found within ${radiusMiles} miles`);
      return [];
    }
    
    const centers: DEChildCareCenterInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      // Extract coordinates from geometry (ESRI point geometry)
      let centerLat: number | null = null;
      let centerLon: number | null = null;
      
      if (geometry) {
        if (geometry.y && geometry.x) {
          // ESRI point geometry: {x: lon, y: lat}
          centerLat = geometry.y;
          centerLon = geometry.x;
        } else if (geometry.latitude && geometry.longitude) {
          centerLat = geometry.latitude;
          centerLon = geometry.longitude;
        }
      }
      
      // Fallback to POINT_X and POINT_Y if available (but these might be in Web Mercator)
      if (!centerLat && attributes.POINT_Y) {
        centerLat = attributes.POINT_Y;
      }
      if (!centerLon && attributes.POINT_X) {
        centerLon = attributes.POINT_X;
      }
      
      const name = attributes.RSR_RESO_1 || attributes.rsr_reso_1 || 'Unknown Child Care Center';
      const type = attributes.RSR_TYPE_T || attributes.rsr_type_t || null;
      const address = attributes.ADR_STREET || attributes.adr_street || null;
      const city = attributes.ADR_CITYNA || attributes.adr_cityna || null;
      const state = attributes.ADR_STAECO || attributes.adr_staeco || null;
      const zip = attributes.ADR_ZIP ? attributes.ADR_ZIP.toString() : (attributes.ZIPCODE || attributes.zipcode || null);
      const phone = attributes.ADR_PHONE_ || attributes.adr_phone_ || null;
      const county = attributes.ADR_COUNTY || attributes.adr_county || null;
      const capacity = attributes.RSR_CPCT_N || attributes.rsr_cpct_n || null;
      const starLevel = attributes.DSI_STAR_LEVEL || attributes.dsi_star_level || attributes.STARLEVEL || attributes.starlevel || null;
      const ageRange = attributes.RSR_AGE_RA || attributes.rsr_age_ra || attributes.AGE_GROUP || attributes.age_group || null;
      const opens = attributes.RSR_OPENS_ || attributes.rsr_opens_ || null;
      const closes = attributes.RSR_CLOSES || attributes.rsr_closes || null;
      
      const centerId = attributes.OBJECTID || attributes.objectid || attributes.RSR_RSRC_I || attributes.rsr_rsrc_i || null;
      
      // Calculate distance if we have coordinates
      let distance_miles: number | undefined = undefined;
      if (centerLat && centerLon) {
        distance_miles = haversineDistance(lat, lon, centerLat, centerLon);
      }
      
      return {
        centerId: centerId ? centerId.toString() : null,
        name,
        type,
        address,
        city,
        state,
        zip,
        phone,
        county,
        capacity: capacity ? parseFloat(capacity.toString()) : null,
        starLevel: starLevel ? parseFloat(starLevel.toString()) : null,
        ageRange,
        opens,
        closes,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    // Filter by actual distance and sort by proximity
    const nearbyCenters = centers
      .filter(center => center.distance_miles !== undefined && center.distance_miles <= radiusMiles)
      .sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    
    console.log(`✅ Found ${nearbyCenters.length} DE Child Care Centers within ${radiusMiles} miles`);
    return nearbyCenters;
  } catch (error) {
    console.error('❌ Error querying DE Child Care Centers:', error);
    return [];
  }
}

