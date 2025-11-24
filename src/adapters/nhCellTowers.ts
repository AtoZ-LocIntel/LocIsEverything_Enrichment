/**
 * NH Cell Towers Adapter
 * Queries New Hampshire Personal Wireless Service Facilities (Cell Towers) from NH GRANIT FeatureServer
 * Supports proximity queries to find cell towers within a specified radius
 * This is a point dataset
 */

const BASE_SERVICE_URL = 'https://nhgeodata.unh.edu/hosting/rest/services/Hosted/GV_BaseLayers/FeatureServer';
const LAYER_ID = 1;

export interface NHCellTower {
  entity_name: string | null;
  structure_type: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  height_above_ground_ft: number | null;
  elevation_ft: number | null;
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
 * Query NH Cell Towers FeatureServer for proximity search
 * Returns cell towers within the specified radius (in miles)
 */
export async function getNHCellTowersData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHCellTower[]> {
  try {
    console.log(`📡 Querying NH Cell Towers within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NH Cell Towers Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH Cell Towers API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Cell Towers found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const cellTowers: NHCellTower[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract entity name
      const entityName = attributes.entity_nam || 
                         attributes.ENTITY_NAM || 
                         attributes.EntityName ||
                         attributes._entity_nam ||
                         attributes.owner ||
                         attributes.OWNER ||
                         null;
      
      // Extract structure type
      const structureType = attributes.str_typ || 
                            attributes.STR_TYP || 
                            attributes.StrTyp ||
                            attributes._str_typ ||
                            attributes.structure_type ||
                            attributes.STRUCTURE_TYPE ||
                            null;
      
      // Extract location info
      const city = attributes.city || 
                   attributes.CITY || 
                   attributes.City ||
                   attributes._city ||
                   attributes.gismunic ||
                   attributes.GISMUNIC ||
                   null;
      
      const state = attributes.st || 
                    attributes.ST || 
                    attributes.State ||
                    attributes._st ||
                    'NH';
      
      // Extract address
      const address = attributes.street || 
                      attributes.STREET || 
                      attributes.Street ||
                      attributes._street ||
                      attributes.str_street ||
                      attributes.STR_STREET ||
                      null;
      
      // Extract height and elevation
      const heightAboveGround = attributes.hgtabvgr_f || 
                                attributes.HGTABVGR_F || 
                                attributes.HgtAbvGrF ||
                                attributes._hgtabvgr_f ||
                                attributes.height ||
                                attributes.HEIGHT ||
                                null;
      
      const elevation = attributes.elev_ft || 
                        attributes.ELEV_FT || 
                        attributes.ElevFt ||
                        attributes._elev_ft ||
                        attributes.elevation ||
                        attributes.ELEVATION ||
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
        entity_name: entityName,
        structure_type: structureType,
        city,
        state,
        address,
        height_above_ground_ft: heightAboveGround !== null && heightAboveGround !== undefined ? Number(heightAboveGround) : null,
        elevation_ft: elevation !== null && elevation !== undefined ? Number(elevation) : null,
        latitude,
        longitude,
        attributes,
        distance_miles
      };
    });
    
    console.log(`✅ Found ${cellTowers.length} NH Cell Towers`);
    
    return cellTowers;
  } catch (error) {
    console.error('❌ Error querying NH Cell Towers:', error);
    return [];
  }
}

