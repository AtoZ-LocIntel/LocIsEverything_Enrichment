/**
 * CT Drinking Water Watersheds Adapter
 * Queries Connecticut Drinking Water Watersheds from CT Geodata Portal FeatureServer
 * Supports both point-in-polygon (which watershed contains the point) and
 * proximity queries (watersheds within a specified radius up to 25 miles)
 */

const BASE_SERVICE_URL = 'https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/ArcGIS/rest/services/Drinking_Water_Watersheds/FeatureServer';
const LAYER_ID = 0;

export interface CTDrinkingWaterWatershedData {
  containingWatershed: CTDrinkingWaterWatershedInfo | null;
  nearbyWatersheds: CTDrinkingWaterWatershedInfo[];
}

export interface CTDrinkingWaterWatershedInfo {
  watershedId: string | null;
  pwsName: string | null;
  pwsId: string | null;
  shed: string | null;
  status: string | null;
  acres: number | null;
  attributes: Record<string, any>;
  geometry?: any;
  distance_miles?: number;
}

/**
 * Calculate distance from a point to a polygon (distance to nearest edge)
 */
function calculateDistanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  let minDistance = Infinity;
  
  rings.forEach(ring => {
    for (let i = 0; i < ring.length; i++) {
      const p1 = ring[i];
      const p2 = ring[(i + 1) % ring.length];
      
      const lat1 = p1[1];
      const lon1 = p1[0];
      const lat2 = p2[1];
      const lon2 = p2[0];
      
      const distance = pointToLineSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, distance);
    }
  });
  
  return minDistance;
}

function pointToLineSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const lat1 = y1 * Math.PI / 180;
  const lon1 = x1 * Math.PI / 180;
  const lat2 = y2 * Math.PI / 180;
  const lon2 = x2 * Math.PI / 180;
  const latP = py * Math.PI / 180;
  const lonP = px * Math.PI / 180;
  
  const d1 = haversineDistance(latP, lonP, lat1, lon1);
  const d2 = haversineDistance(latP, lonP, lat2, lon2);
  const dSegment = haversineDistance(lat1, lon1, lat2, lon2);
  
  if (dSegment < 0.001) {
    return Math.min(d1, d2);
  }
  
  const t = Math.max(0, Math.min(1, 
    ((latP - lat1) * (lat2 - lat1) + (lonP - lon1) * (lon2 - lon1)) / (dSegment * dSegment)
  ));
  
  const latClosest = lat1 + t * (lat2 - lat1);
  const lonClosest = lon1 + t * (lon2 - lon1);
  
  return haversineDistance(latP, lonP, latClosest, lonClosest);
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Query CT Drinking Water Watersheds FeatureServer for point-in-polygon
 */
async function getContainingWatershed(
  lat: number,
  lon: number
): Promise<CTDrinkingWaterWatershedInfo | null> {
  try {
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
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    const response = await fetch(queryUrl.toString());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    if (data.error || !data.features || data.features.length === 0) return null;
    
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    const pwsName = attributes.pws_name || attributes.PWS_NAME || null;
    const pwsId = attributes.pws_id || attributes.PWS_ID || null;
    const shed = attributes.shed || attributes.SHED || null;
    const status = attributes.status || attributes.STATUS || null;
    const acres = attributes.acres || attributes.ACRES || attributes.st_area_sh || attributes.ST_AREA_SH || null;
    
    const watershedId = attributes.FID || attributes.fid || attributes.OBJECTID || attributes.objectid || null;
    
    return {
      watershedId,
      pwsName,
      pwsId,
      shed,
      status,
      acres: acres ? parseFloat(acres.toString()) : null,
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying CT Drinking Water Watersheds for containing watershed:', error);
    return null;
  }
}

/**
 * Query CT Drinking Water Watersheds FeatureServer for proximity search
 */
async function getNearbyWatersheds(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTDrinkingWaterWatershedInfo[]> {
  try {
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
    
    const response = await fetch(queryUrl.toString());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    if (data.error || !data.features || data.features.length === 0) return [];
    
    const watersheds: CTDrinkingWaterWatershedInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const pwsName = attributes.pws_name || attributes.PWS_NAME || null;
      const pwsId = attributes.pws_id || attributes.PWS_ID || null;
      const shed = attributes.shed || attributes.SHED || null;
      const status = attributes.status || attributes.STATUS || null;
      const acres = attributes.acres || attributes.ACRES || attributes.st_area_sh || attributes.ST_AREA_SH || null;
      
      const watershedId = attributes.FID || attributes.fid || attributes.OBJECTID || attributes.objectid || null;
      
      let distance_miles: number | undefined;
      if (geometry && geometry.rings && geometry.rings.length > 0) {
        distance_miles = calculateDistanceToPolygon(lat, lon, geometry.rings);
      }
      
      return {
        watershedId,
        pwsName,
        pwsId,
        shed,
        status,
        acres: acres ? parseFloat(acres.toString()) : null,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    watersheds.sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    return watersheds;
  } catch (error) {
    console.error('❌ Error querying CT Drinking Water Watersheds for nearby watersheds:', error);
    return [];
  }
}

export async function getCTDrinkingWaterWatershedData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTDrinkingWaterWatershedData | null> {
  try {
    const containingWatershed = await getContainingWatershed(lat, lon);
    const nearbyWatersheds = await getNearbyWatersheds(lat, lon, radiusMiles);
    
    return {
      containingWatershed,
      nearbyWatersheds
    };
  } catch (error) {
    console.error('❌ Error fetching CT Drinking Water Watershed data:', error);
    return null;
  }
}

