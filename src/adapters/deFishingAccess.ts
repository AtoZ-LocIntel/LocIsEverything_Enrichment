/**
 * DE Fishing Access Adapter
 * Queries Delaware Fishing Access points from DE FirstMap FeatureServer
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Fishing_Access/FeatureServer';
const FISHING_ACCESS_LAYER_ID = 0;
const TROUT_STREAMS_LAYER_ID = 1;

export interface DEFishingAccessInfo {
  accessId: string | null;
  name: string | null;
  facility: string | null;
  division: string | null;
  county: string | null;
  tidal: string | null;
  attributes: Record<string, any>;
  geometry?: any;
  distance_miles?: number;
}

export interface DETroutStreamInfo {
  streamId: string | null;
  waterBodyName: string | null;
  restriction: string | null;
  description: string | null;
  gnisName: string | null;
  gnisId: string | null;
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
 * Calculate distance from a point to a polyline (distance to nearest point on line)
 */
function calculateDistanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  let minDistance = Infinity;
  
  paths.forEach(path => {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      // ESRI geometry coordinates with outSR=4326 are [x, y] which is [lon, lat] in degrees
      const lon1 = p1[0];
      const lat1 = p1[1];
      const lon2 = p2[0];
      const lat2 = p2[1];
      
      // Calculate distance from point to line segment
      const distance = pointToLineSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, distance);
    }
  });
  
  return minDistance;
}

function pointToLineSegmentDistance(
  pointLat: number, pointLon: number,
  segLat1: number, segLon1: number,
  segLat2: number, segLon2: number
): number {
  // Calculate distances to endpoints
  const d1 = haversineDistance(pointLat, pointLon, segLat1, segLon1);
  const d2 = haversineDistance(pointLat, pointLon, segLat2, segLon2);
  const dSegment = haversineDistance(segLat1, segLon1, segLat2, segLon2);
  
  // If segment is very short, just return distance to nearest endpoint
  if (dSegment < 0.001) {
    return Math.min(d1, d2);
  }
  
  // Calculate the closest point on the line segment
  // Using vector projection
  const dx = segLon2 - segLon1;
  const dy = segLat2 - segLat1;
  const t = Math.max(0, Math.min(1, 
    ((pointLon - segLon1) * dx + (pointLat - segLat1) * dy) / (dx * dx + dy * dy)
  ));
  
  const closestLon = segLon1 + t * dx;
  const closestLat = segLat1 + t * dy;
  
  return haversineDistance(pointLat, pointLon, closestLat, closestLon);
}

/**
 * Query DE Fishing Access FeatureServer for proximity search
 */
export async function getDEFishingAccessData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DEFishingAccessInfo[]> {
  try {
    console.log(`🎣 Querying DE Fishing Access within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = radiusMiles * 1609.34;
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${FISHING_ACCESS_LAYER_ID}/query`);
    
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
      console.error('❌ DE Fishing Access API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No DE Fishing Access locations found within ${radiusMiles} miles`);
      return [];
    }
    
    const accessPoints: DEFishingAccessInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      let accessLat: number | null = null;
      let accessLon: number | null = null;
      
      if (geometry) {
        if (geometry.y && geometry.x) {
          accessLat = geometry.y;
          accessLon = geometry.x;
        }
      }
      
      const name = attributes.GNIS_NAME || attributes.gnis_name || 'Fishing Access';
      const facility = attributes.FACILITY || attributes.facility || null;
      const division = attributes.DIVISION || attributes.division || null;
      const county = attributes.COUNTY || attributes.county || null;
      const tidal = attributes.TIDAL || attributes.tidal || null;
      
      const accessId = attributes.OBJECTID || attributes.objectid || null;
      
      let distance_miles: number | undefined = undefined;
      if (accessLat && accessLon) {
        distance_miles = haversineDistance(lat, lon, accessLat, accessLon);
      }
      
      return {
        accessId: accessId ? accessId.toString() : null,
        name,
        facility,
        division,
        county,
        tidal,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    const nearbyAccess = accessPoints
      .filter(access => access.distance_miles !== undefined && access.distance_miles <= radiusMiles)
      .sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    
    console.log(`✅ Found ${nearbyAccess.length} DE Fishing Access locations within ${radiusMiles} miles`);
    return nearbyAccess;
  } catch (error) {
    console.error('❌ Error querying DE Fishing Access:', error);
    return [];
  }
}

/**
 * Query DE Trout Streams FeatureServer for proximity search
 */
export async function getDETroutStreamsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DETroutStreamInfo[]> {
  try {
    console.log(`🐟 Querying DE Trout Streams within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = radiusMiles * 1609.34;
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${TROUT_STREAMS_LAYER_ID}/query`);
    
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
      console.error('❌ DE Trout Streams API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No DE Trout Streams found within ${radiusMiles} miles`);
      return [];
    }
    
    const streams: DETroutStreamInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const waterBodyName = attributes.WATERBODYNAME || attributes.waterBodyName || null;
      const restriction = attributes.RESTRICTION || attributes.restriction || null;
      const description = attributes.DESCRIPTION || attributes.description || null;
      const gnisName = attributes.GNIS_NAME || attributes.gnis_name || null;
      const gnisId = attributes.GNIS_ID || attributes.gnis_id || null;
      
      const streamId = attributes.OBJECTID || attributes.objectid || null;
      
      let distance_miles: number | undefined = undefined;
      if (geometry && geometry.paths && geometry.paths.length > 0) {
        distance_miles = calculateDistanceToPolyline(lat, lon, geometry.paths);
      }
      
      return {
        streamId: streamId ? streamId.toString() : null,
        waterBodyName,
        restriction,
        description,
        gnisName,
        gnisId,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    const nearbyStreams = streams
      .filter(stream => stream.distance_miles !== undefined && stream.distance_miles <= radiusMiles)
      .sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    
    console.log(`✅ Found ${nearbyStreams.length} DE Trout Streams within ${radiusMiles} miles`);
    return nearbyStreams;
  } catch (error) {
    console.error('❌ Error querying DE Trout Streams:', error);
    return [];
  }
}

