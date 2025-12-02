/**
 * DE Rail Lines Adapter
 * Queries Delaware Rail Lines from DE FirstMap FeatureServer
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Transportation/DE_Multimodal/FeatureServer';
const RAIL_LINES_LAYER_ID = 18;

export interface DERailLineInfo {
  railId: string | null;
  trackType: string | null;
  status: string | null;
  lineId: string | null;
  owner: string | null;
  operators: string[];
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
 * Query DE Rail Lines FeatureServer for proximity search
 */
export async function getDERailLinesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DERailLineInfo[]> {
  try {
    console.log(`🚂 Querying DE Rail Lines within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = radiusMiles * 1609.34;
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${RAIL_LINES_LAYER_ID}/query`);
    
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
      console.error('❌ DE Rail Lines API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No DE Rail Lines found within ${radiusMiles} miles`);
      return [];
    }
    
    const railLines: DERailLineInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const railId = attributes.RAIL_ID || attributes.rail_id || attributes.OBJECTID || attributes.objectid || null;
      const trackType = attributes.TRACK_TYPE || attributes.track_type || null;
      const status = attributes.STATUS || attributes.status || null;
      const lineId = attributes.LINE_ID || attributes.line_id || null;
      const owner = attributes.OWNER || attributes.owner || null;
      
      // Collect all operators
      const operators: string[] = [];
      if (attributes.OPERATOR1 || attributes.operator1) operators.push(attributes.OPERATOR1 || attributes.operator1);
      if (attributes.OPERATOR2 || attributes.operator2) operators.push(attributes.OPERATOR2 || attributes.operator2);
      if (attributes.OPERATOR3 || attributes.operator3) operators.push(attributes.OPERATOR3 || attributes.operator3);
      if (attributes.OPERATOR4 || attributes.operator4) operators.push(attributes.OPERATOR4 || attributes.operator4);
      
      let distance_miles: number | undefined = undefined;
      if (geometry && geometry.paths && geometry.paths.length > 0) {
        distance_miles = calculateDistanceToPolyline(lat, lon, geometry.paths);
      }
      
      return {
        railId: railId ? railId.toString() : null,
        trackType,
        status,
        lineId,
        owner,
        operators,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    const nearbyRailLines = railLines
      .filter(line => line.distance_miles !== undefined && line.distance_miles <= radiusMiles)
      .sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    
    console.log(`✅ Found ${nearbyRailLines.length} DE Rail Lines within ${radiusMiles} miles`);
    return nearbyRailLines;
  } catch (error) {
    console.error('❌ Error querying DE Rail Lines:', error);
    return [];
  }
}

