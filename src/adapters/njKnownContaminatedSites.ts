/**
 * NJ Known Contaminated Sites Adapter
 * Queries New Jersey Department of Environmental Protection (NJDEP) Known Contaminated Sites
 * from the Environmental NJEMS MapServer
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://mapsdep.nj.gov/arcgis/rest/services/Features/Environmental_NJEMS/MapServer';
const LAYER_ID = 0;

export interface NJKnownContaminatedSiteInfo {
  siteId: string | null;
  siteName: string | null;
  address: string | null;
  municipality: string | null;
  county: string | null;
  zipCode: string | null;
  siteType: string | null;
  status: string | null;
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
 * Query NJ Known Contaminated Sites MapServer for proximity search
 * Returns contaminated sites within the specified radius (in miles, max 25 miles)
 */
export async function getNJKnownContaminatedSitesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NJKnownContaminatedSiteInfo[]> {
  try {
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radiusMiles, 25.0);
    
    console.log(`🏭 Querying NJ Known Contaminated Sites within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NJ Known Contaminated Sites Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NJ Known Contaminated Sites API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NJ Known Contaminated Sites found within ${cappedRadius} miles`);
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} NJ Known Contaminated Sites nearby`);
    
    // Process features and calculate distances
    const contaminatedSites: NJKnownContaminatedSiteInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract site fields - check various possible field names
      const siteName = attributes.SITE_NAME || attributes.site_name || attributes.NAME || attributes.name || attributes.SITE || attributes.site || null;
      const address = attributes.ADDRESS || attributes.address || attributes.ADDR || attributes.addr || null;
      const municipality = attributes.MUNICIPALITY || attributes.municipality || attributes.MUNI || attributes.muni || attributes.CITY || attributes.city || null;
      const county = attributes.COUNTY || attributes.county || null;
      const zipCode = attributes.ZIP_CODE || attributes.zip_code || attributes.ZIP || attributes.zip || attributes.POSTAL_CODE || attributes.postal_code || null;
      const siteType = attributes.SITE_TYPE || attributes.site_type || attributes.TYPE || attributes.type || null;
      const status = attributes.STATUS || attributes.status || attributes.SITE_STATUS || attributes.site_status || null;
      
      // Get coordinates from geometry
      let siteLat: number | null = null;
      let siteLon: number | null = null;
      
      if (geometry.x !== undefined && geometry.y !== undefined) {
        siteLon = geometry.x;
        siteLat = geometry.y;
      } else if (geometry.latitude !== undefined && geometry.longitude !== undefined) {
        siteLat = geometry.latitude;
        siteLon = geometry.longitude;
      } else if (geometry.lat !== undefined && geometry.lon !== undefined) {
        siteLat = geometry.lat;
        siteLon = geometry.lon;
      }
      
      // Calculate distance
      let distance_miles: number | undefined = undefined;
      if (siteLat !== null && siteLon !== null) {
        distance_miles = haversineDistance(lat, lon, siteLat, siteLon);
      }
      
      const siteId = attributes.OBJECTID || attributes.objectid || attributes.SITE_ID || attributes.site_id || siteName || null;
      
      return {
        siteId: siteId ? siteId.toString() : null,
        siteName,
        address,
        municipality,
        county,
        zipCode,
        siteType,
        status,
        attributes,
        lat: siteLat,
        lon: siteLon,
        distance_miles
      };
    });
    
    // Filter by actual distance and sort by distance
    const filteredSites = contaminatedSites
      .filter(site => site.distance_miles !== undefined && site.distance_miles <= cappedRadius && site.lat !== null && site.lon !== null)
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Returning ${filteredSites.length} NJ Known Contaminated Sites within ${cappedRadius} miles`);
    
    return filteredSites;
    
  } catch (error) {
    console.error('❌ Error querying NJ Known Contaminated Sites:', error);
    return [];
  }
}

