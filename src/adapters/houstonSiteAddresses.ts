/**
 * Houston Site Addresses Adapter
 * Queries Houston Site Addresses point feature service
 * Supports proximity queries up to 1 mile only
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_SiteAddresses/FeatureServer/3';

export interface HoustonSiteAddressInfo {
  objectId: string | null;
  siteaddid: number | null;
  fulladdr: string | null;
  addrnum: string | null;
  roadname: string | null;
  roadtype: string | null;
  unitid: string | null;
  unittype: string | null;
  municipality: string | null;
  zipcode: string | null;
  county: string | null;
  addrtype: string | null;
  status: string | null;
  source: string | null;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  attributes: Record<string, any>;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert ESRI geometry coordinates to lat/lon
 * ESRI geometry can be in various coordinate systems, but we'll assume Web Mercator or WGS84
 */
function esriToLatLon(x: number, y: number): [number, number] {
  // If coordinates look like Web Mercator (large numbers), convert to WGS84
  if (Math.abs(x) > 180 || Math.abs(y) > 90) {
    // Web Mercator to WGS84 conversion
    const lon = (x / 20037508.34) * 180;
    let lat = (y / 20037508.34) * 180;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    return [lat, lon];
  }
  // Assume already in WGS84
  return [y, x]; // ESRI uses [x, y] but we need [lat, lon]
}

/**
 * Query Houston Site Addresses within proximity of a location
 * Supports proximity queries up to 1 mile only
 */
export async function getHoustonSiteAddressesData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<HoustonSiteAddressInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 1 mile
    if (radiusMiles && radiusMiles > 1.0) {
      radiusMiles = 1.0;
    }
    
    if (!radiusMiles || radiusMiles <= 0) {
      return [];
    }
    
    // Convert lat/lon to Web Mercator for ESRI query
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const features: HoustonSiteAddressInfo[] = [];
    
    // Proximity query (required for points)
    try {
      const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
      // Build query URL manually to ensure proper encoding
      const geometryStr = encodeURIComponent(JSON.stringify(geometry));
      const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`📍 Querying Houston Site Addresses for proximity (${radiusMiles} miles) at [${lat}, ${lon}]`);
      console.log(`🔗 Houston Site Addresses Proximity Query URL: ${proximityUrl}`);
      
      const proximityData = await fetchJSONSmart(proximityUrl) as any;
      
      // Log the full response for debugging
      console.log(`📊 Houston Site Addresses Proximity Response:`, {
        hasError: !!proximityData.error,
        error: proximityData.error,
        featureCount: proximityData.features?.length || 0,
        hasFeatures: !!proximityData.features
      });
      
      if (proximityData.error) {
        console.error('❌ Houston Site Addresses API Error:', proximityData.error);
      } else if (proximityData.features && proximityData.features.length > 0) {
        proximityData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          // Extract coordinates from geometry
          let featureLat = lat;
          let featureLon = lon;
          
          if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
            // Geometry is already in WGS84 (we requested outSR=4326)
            featureLon = geometry.x;
            featureLat = geometry.y;
          } else if (attributes.xcoord && attributes.ycoord) {
            // Fallback to xcoord/ycoord if geometry not available
            // These appear to be in State Plane, but we'll try to use them if they look like lat/lon
            const x = Number(attributes.xcoord);
            const y = Number(attributes.ycoord);
            if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
              featureLon = x;
              featureLat = y;
            } else {
              // State Plane coordinates - would need conversion, but geometry should be available
              console.warn('⚠️ Houston Site Addresses: Coordinates appear to be State Plane, using geometry instead');
            }
          }
          
          const distance = calculateDistance(lat, lon, featureLat, featureLon);
          
          const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
          const siteaddid = attributes.siteaddid !== null && attributes.siteaddid !== undefined ? Number(attributes.siteaddid) : null;
          const fulladdr = attributes.fulladdr || null;
          const addrnum = attributes.addrnum || null;
          const roadname = attributes.roadname || null;
          const roadtype = attributes.roadtype || null;
          const unitid = attributes.unitid || null;
          const unittype = attributes.unittype || null;
          const municipality = attributes.municipality || null;
          const zipcode = attributes.zipcode || null;
          const county = attributes.county || null;
          const addrtype = attributes.addrtype || null;
          const status = attributes.status || null;
          const source = attributes.source || null;
          
          features.push({
            objectId: objectId,
            siteaddid: siteaddid,
            fulladdr: fulladdr,
            addrnum: addrnum,
            roadname: roadname,
            roadtype: roadtype,
            unitid: unitid,
            unittype: unittype,
            municipality: municipality,
            zipcode: zipcode,
            county: county,
            addrtype: addrtype,
            status: status,
            source: source,
            geometry: geometry,
            distance_miles: distance,
            attributes: attributes
          });
        });
      }
    } catch (error) {
      console.warn('⚠️ Houston Site Addresses: Proximity query failed:', error);
    }
    
    // Sort by distance
    features.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Houston Site Addresses: Found ${features.length} address(es)`);
    return features;
  } catch (error) {
    console.error('❌ Error querying Houston Site Addresses data:', error);
    throw error;
  }
}

