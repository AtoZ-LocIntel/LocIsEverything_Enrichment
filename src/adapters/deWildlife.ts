/**
 * DE Wildlife Adapter
 * Queries Delaware Wildlife data from DE FirstMap FeatureServer
 * Supports proximity queries for point features and point-in-polygon for polygons
 */

const BASE_SERVICE_URL = 'https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Wildlife/FeatureServer';
const STANDS_BLINDS_FIELDS_LAYER_ID = 0;
const BOAT_RAMPS_LAYER_ID = 1;
const FACILITIES_LAYER_ID = 2;
const PARKING_LAYER_ID = 3;
const RESTROOMS_LAYER_ID = 4;
const SAFETY_ZONES_LAYER_ID = 5;
const WILDLIFE_MANAGEMENT_ZONES_LAYER_ID = 6;

export interface DEWildlifePointInfo {
  featureId: string | null;
  name: string | null;
  type: string | null;
  attributes: Record<string, any>;
  geometry?: any;
  distance_miles?: number;
}

export interface DEWildlifePolygonInfo {
  featureId: string | null;
  name: string | null;
  type: string | null;
  attributes: Record<string, any>;
  geometry?: any;
  isContaining?: boolean;
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
 * Generic function to query point features for proximity search
 */
async function queryPointFeatures(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DEWildlifePointInfo[]> {
  try {
    console.log(`🦌 Querying ${layerName} within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = radiusMiles * 1609.34;
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
    
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
    
    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error) {
      console.error(`❌ ${layerName} API Error:`, data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No ${layerName} found within ${radiusMiles} miles`);
      return [];
    }
    
    const features: DEWildlifePointInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      let featureLat: number | null = null;
      let featureLon: number | null = null;
      
      if (geometry) {
        if (geometry.y && geometry.x) {
          featureLat = geometry.y;
          featureLon = geometry.x;
        }
      }
      
      const name = attributes.NAME || attributes.name || attributes.TYPE || attributes.type || layerName;
      const type = attributes.TYPE || attributes.type || attributes.FACILITY_TYPE || attributes.facility_type || null;
      const featureId = attributes.OBJECTID || attributes.objectid || null;
      
      let distance_miles: number | undefined = undefined;
      if (featureLat && featureLon) {
        distance_miles = haversineDistance(lat, lon, featureLat, featureLon);
      }
      
      return {
        featureId: featureId ? featureId.toString() : null,
        name,
        type,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    const nearbyFeatures = features
      .filter(f => f.distance_miles !== undefined && f.distance_miles <= radiusMiles)
      .sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    
    console.log(`✅ Found ${nearbyFeatures.length} ${layerName} within ${radiusMiles} miles`);
    return nearbyFeatures;
  } catch (error) {
    console.error(`❌ Error querying ${layerName}:`, error);
    return [];
  }
}

/**
 * Generic function to query polygon features for point-in-polygon
 */
async function queryPolygonFeatures(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number
): Promise<{ containing: DEWildlifePolygonInfo | null; nearby: DEWildlifePolygonInfo[] }> {
  try {
    console.log(`🦌 Querying ${layerName} for point [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
    
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
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error) {
      console.error(`❌ ${layerName} API Error:`, data.error);
      return { containing: null, nearby: [] };
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No ${layerName} found containing the point`);
      return { containing: null, nearby: [] };
    }
    
    const containingFeature = data.features[0];
    const attributes = containingFeature.attributes || {};
    const geometry = containingFeature.geometry || null;
    
    const name = attributes.NAME || attributes.name || attributes.ZONE || attributes.zone || layerName;
    const type = attributes.TYPE || attributes.type || attributes.ZONE_TYPE || attributes.zone_type || null;
    const featureId = attributes.OBJECTID || attributes.objectid || null;
    
    const feature: DEWildlifePolygonInfo = {
      featureId: featureId ? featureId.toString() : null,
      name,
      type,
      attributes,
      geometry,
      isContaining: true
    };
    
    console.log(`✅ Found ${layerName} containing the point: ${name}`);
    return { containing: feature, nearby: [] };
  } catch (error) {
    console.error(`❌ Error querying ${layerName}:`, error);
    return { containing: null, nearby: [] };
  }
}

/**
 * Query WA Stands Blinds and Fields
 */
export async function getDEStandsBlindsFieldsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DEWildlifePointInfo[]> {
  return queryPointFeatures(STANDS_BLINDS_FIELDS_LAYER_ID, 'WA Stands Blinds and Fields', lat, lon, radiusMiles);
}

/**
 * Query WA Boat Ramps
 */
export async function getDEBoatRampsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DEWildlifePointInfo[]> {
  return queryPointFeatures(BOAT_RAMPS_LAYER_ID, 'WA Boat Ramps', lat, lon, radiusMiles);
}

/**
 * Query WA Facilities
 */
export async function getDEFacilitiesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DEWildlifePointInfo[]> {
  return queryPointFeatures(FACILITIES_LAYER_ID, 'WA Facilities', lat, lon, radiusMiles);
}

/**
 * Query WA Parking
 */
export async function getDEParkingData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DEWildlifePointInfo[]> {
  return queryPointFeatures(PARKING_LAYER_ID, 'WA Parking', lat, lon, radiusMiles);
}

/**
 * Query WA Restrooms
 */
export async function getDERestroomsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DEWildlifePointInfo[]> {
  return queryPointFeatures(RESTROOMS_LAYER_ID, 'WA Restrooms', lat, lon, radiusMiles);
}

/**
 * Query WA Safety Zones
 */
export async function getDESafetyZonesData(
  lat: number,
  lon: number
): Promise<{ containing: DEWildlifePolygonInfo | null; nearby: DEWildlifePolygonInfo[] }> {
  return queryPolygonFeatures(SAFETY_ZONES_LAYER_ID, 'WA Safety Zones', lat, lon);
}

/**
 * Query Wildlife Management Zones
 */
export async function getDEWildlifeManagementZonesData(
  lat: number,
  lon: number
): Promise<{ containing: DEWildlifePolygonInfo | null; nearby: DEWildlifePolygonInfo[] }> {
  return queryPolygonFeatures(WILDLIFE_MANAGEMENT_ZONES_LAYER_ID, 'Wildlife Management Zones', lat, lon);
}

