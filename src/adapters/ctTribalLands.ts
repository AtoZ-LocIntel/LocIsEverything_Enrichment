/**
 * CT Tribal Lands Adapter
 * Queries Connecticut Tribal Lands from CT Geodata Portal FeatureServer
 * Supports both point-in-polygon (which tribal land contains the point) and
 * proximity queries (tribal lands within a specified radius up to 25 miles)
 */

const BASE_SERVICE_URL = 'https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/ArcGIS/rest/services/Connecticut_Tribal_Lands/FeatureServer';
const LAYER_ID = 0;

export interface CTTribalLandData {
  containingTribalLand: CTTribalLandInfo | null;
  nearbyTribalLands: CTTribalLandInfo[];
}

export interface CTTribalLandInfo {
  tribalLandId: string | null;
  name: string | null;
  nameLsad: string | null;
  recognitionType: string | null; // "State Recognized" or "Federally Recognized"
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
 * Query CT Tribal Lands FeatureServer for point-in-polygon
 */
async function getContainingTribalLand(
  lat: number,
  lon: number
): Promise<CTTribalLandInfo | null> {
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
    
    const name = attributes.NAME || attributes.name || null;
    const nameLsad = attributes.NAMELSAD || attributes.namelsad || null;
    
    // Determine recognition type based on NAME
    let recognitionType: string | null = null;
    if (name) {
      const federallyRecognized = ['Mohegan', 'Mashantucket Pequot'];
      const stateRecognized = ['Golden Hill Paugussett', 'Paucatuck Eastern Pequot', 'Schaghticoke'];
      
      if (federallyRecognized.includes(name)) {
        recognitionType = 'Federally Recognized';
      } else if (stateRecognized.includes(name)) {
        recognitionType = 'State Recognized';
      }
    }
    
    const tribalLandId = attributes.FID || attributes.fid || attributes.OBJECTID || attributes.objectid || null;
    
    return {
      tribalLandId,
      name,
      nameLsad,
      recognitionType,
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying CT Tribal Lands for containing land:', error);
    return null;
  }
}

/**
 * Query CT Tribal Lands FeatureServer for proximity search
 */
async function getNearbyTribalLands(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTTribalLandInfo[]> {
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
    
    const tribalLands: CTTribalLandInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const name = attributes.NAME || attributes.name || null;
      const nameLsad = attributes.NAMELSAD || attributes.namelsad || null;
      
      let recognitionType: string | null = null;
      if (name) {
        const federallyRecognized = ['Mohegan', 'Mashantucket Pequot'];
        const stateRecognized = ['Golden Hill Paugussett', 'Paucatuck Eastern Pequot', 'Schaghticoke'];
        
        if (federallyRecognized.includes(name)) {
          recognitionType = 'Federally Recognized';
        } else if (stateRecognized.includes(name)) {
          recognitionType = 'State Recognized';
        }
      }
      
      const tribalLandId = attributes.FID || attributes.fid || attributes.OBJECTID || attributes.objectid || null;
      
      let distance_miles: number | undefined;
      if (geometry && geometry.rings && geometry.rings.length > 0) {
        distance_miles = calculateDistanceToPolygon(lat, lon, geometry.rings);
      }
      
      return {
        tribalLandId,
        name,
        nameLsad,
        recognitionType,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    tribalLands.sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    return tribalLands;
  } catch (error) {
    console.error('❌ Error querying CT Tribal Lands for nearby lands:', error);
    return [];
  }
}

export async function getCTTribalLandData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTTribalLandData | null> {
  try {
    const containingTribalLand = await getContainingTribalLand(lat, lon);
    const nearbyTribalLands = await getNearbyTribalLands(lat, lon, radiusMiles);
    
    return {
      containingTribalLand,
      nearbyTribalLands
    };
  } catch (error) {
    console.error('❌ Error fetching CT Tribal Land data:', error);
    return null;
  }
}

