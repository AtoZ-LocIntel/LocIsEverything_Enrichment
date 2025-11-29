/**
 * CT Roads and Trails Adapter
 * Queries Connecticut Roads and Trails from CT Geodata Portal FeatureServer
 * Supports proximity queries to find roads and trails within a specified radius
 * This is a line dataset (polylines), so we calculate distance to nearest point on the line
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/Road/FeatureServer';
const LAYER_ID = 0;

export interface CTRoad {
  roadClass: string | null;
  avLegend: string | null;
  imsLegend: string | null;
  lengthMiles: number | null;
  attributes: Record<string, any>;
  geometry: any; // ESRI polyline geometry for drawing on map
  distance_miles?: number;
}

/**
 * Calculate distance from a point to the nearest point on a polyline
 */
function calculateDistanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  let minDistance = Infinity;
  
  paths.forEach(path => {
    // Each path is an array of coordinate pairs [x, y] or [lon, lat]
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      // Convert to lat/lon if needed (ESRI geometry might be in Web Mercator or WGS84)
      const lat1 = p1[1];
      const lon1 = p1[0];
      const lat2 = p2[1];
      const lon2 = p2[0];
      
      // Calculate distance from point to line segment
      const distance = pointToLineSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, distance);
    }
  });
  
  return minDistance;
}

/**
 * Calculate distance from a point to a line segment
 */
function pointToLineSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  // Convert to radians
  const lat1 = y1 * Math.PI / 180;
  const lon1 = x1 * Math.PI / 180;
  const lat2 = y2 * Math.PI / 180;
  const lon2 = x2 * Math.PI / 180;
  const latP = py * Math.PI / 180;
  const lonP = px * Math.PI / 180;
  
  // Calculate distance from point to each endpoint
  const d1 = haversineDistance(latP, lonP, lat1, lon1);
  const d2 = haversineDistance(latP, lonP, lat2, lon2);
  
  // Calculate distance along the line segment
  const dSegment = haversineDistance(lat1, lon1, lat2, lon2);
  
  // If segment is very short, just use distance to nearest endpoint
  if (dSegment < 0.001) {
    return Math.min(d1, d2);
  }
  
  // Calculate the closest point on the line segment
  const t = Math.max(0, Math.min(1, 
    ((latP - lat1) * (lat2 - lat1) + (lonP - lon1) * (lon2 - lon1)) / (dSegment * dSegment)
  ));
  
  const latClosest = lat1 + t * (lat2 - lat1);
  const lonClosest = lon1 + t * (lon2 - lon1);
  
  return haversineDistance(latP, lonP, latClosest, lonClosest);
}

/**
 * Haversine distance calculation
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Query CT Roads and Trails FeatureServer for proximity search
 * Returns roads and trails within the specified radius (in miles)
 */
export async function getCTRoadsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTRoad[]> {
  try {
    console.log(`🛣️ Querying CT Roads and Trails within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    queryUrl.searchParams.set('returnGeometry', 'true'); // Need geometry to draw lines and calculate distance
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    
    console.log(`🔗 CT Roads and Trails Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT Roads and Trails API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No CT Roads and Trails found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const roads: CTRoad[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract road class and legend info
      const roadClass = attributes.ROAD_CLASS || 
                        attributes.road_class || 
                        attributes.Road_Class ||
                        null;
      
      const avLegend = attributes.AV_LEGEND || 
                       attributes.av_legend || 
                       attributes.Av_Legend ||
                       null;
      
      const imsLegend = attributes.IMS_LEGEND || 
                        attributes.ims_legend || 
                        attributes.Ims_Legend ||
                        null;
      
      const lengthMiles = attributes.LENGTH_MI || 
                          attributes.length_mi || 
                          attributes.Length_Mi ||
                          attributes.length_miles ||
                          null;
      
      // Calculate distance from search point to nearest point on road
      let distance_miles: number | undefined = undefined;
      if (geometry.paths && geometry.paths.length > 0) {
        distance_miles = calculateDistanceToPolyline(lat, lon, geometry.paths);
      }
      
      return {
        roadClass,
        avLegend,
        imsLegend,
        lengthMiles,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    // Sort by distance (closest first)
    roads.sort((a, b) => {
      const distA = a.distance_miles ?? Infinity;
      const distB = b.distance_miles ?? Infinity;
      return distA - distB;
    });
    
    console.log(`✅ Found ${roads.length} CT Roads and Trails`);
    
    return roads;
  } catch (error) {
    console.error('❌ Error querying CT Roads and Trails:', error);
    return [];
  }
}
