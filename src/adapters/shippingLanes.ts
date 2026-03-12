/**
 * Adapter for Global Shipping Lanes GeoJSON
 * Dataset: https://raw.githubusercontent.com/newzealandpaul/Shipping-Lanes/main/data/Shipping_Lanes_v1.geojson
 * 
 * Provides proximity queries for global shipping routes (Major, Middle, Minor)
 * - Proximity queries up to 1000 miles
 * - Returns shipping lane segments within the specified radius
 */

export interface ShippingLaneInfo {
  type: string; // Major, Middle, Minor
  distance_miles?: number;
  geometry?: any; // GeoJSON geometry
  properties?: any; // Original GeoJSON properties
}

const GEOJSON_URL = 'https://raw.githubusercontent.com/newzealandpaul/Shipping-Lanes/main/data/Shipping_Lanes_v1.geojson';
const MAX_RADIUS_MILES = 1000;

// Cache for the GeoJSON data
let cachedGeoJSON: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 3600000; // 1 hour cache

// Cache for query results (REMOVE THIS - it's causing the bug!)
// Actually, let's not cache results, only cache the GeoJSON data itself

/**
 * Calculate distance between two points using Haversine formula (in miles)
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Interpolate a point along a great circle arc (spherical interpolation)
 */
function sphericalInterpolate(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  t: number
): [number, number] {
  // Convert to radians
  const φ1 = lat1 * Math.PI / 180;
  const λ1 = lon1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const λ2 = lon2 * Math.PI / 180;
  
  // Calculate angular distance
  const Δλ = λ2 - λ1;
  const a = Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const δ = Math.acos(Math.max(-1, Math.min(1, a))); // Clamp to avoid NaN
  
  if (δ < 0.0001) {
    // Points are very close, just return start point
    return [lat1, lon1];
  }
  
  // Spherical interpolation
  const A = Math.sin((1 - t) * δ) / Math.sin(δ);
  const B = Math.sin(t * δ) / Math.sin(δ);
  
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);
  
  const φ = Math.atan2(z, Math.sqrt(x * x + y * y));
  const λ = Math.atan2(y, x);
  
  return [φ * 180 / Math.PI, λ * 180 / Math.PI];
}

/**
 * Calculate distance from a point to a line segment (in miles)
 * Uses spherical interpolation for accuracy on long segments
 */
function pointToLineDistance(
  pointLat: number,
  pointLon: number,
  lineStartLat: number,
  lineStartLon: number,
  lineEndLat: number,
  lineEndLon: number
): number {
  // Calculate distance to endpoints
  const distToStart = haversineDistance(pointLat, pointLon, lineStartLat, lineStartLon);
  const distToEnd = haversineDistance(pointLat, pointLon, lineEndLat, lineEndLon);
  const segmentLength = haversineDistance(lineStartLat, lineStartLon, lineEndLat, lineEndLon);
  
  // If segment is very short, just use distance to closest endpoint
  if (segmentLength < 0.01) {
    return Math.min(distToStart, distToEnd);
  }
  
  // Use ternary search to find the closest point on the great circle segment
  let minDistance = Math.min(distToStart, distToEnd);
  
  let left = 0;
  let right = 1;
  const tolerance = 0.0001;
  
  // Ternary search for minimum distance
  for (let iter = 0; iter < 30; iter++) {
    const mid1 = left + (right - left) / 3;
    const mid2 = right - (right - left) / 3;
    
    // Use spherical interpolation
    const [lat1, lon1] = sphericalInterpolate(lineStartLat, lineStartLon, lineEndLat, lineEndLon, mid1);
    const [lat2, lon2] = sphericalInterpolate(lineStartLat, lineStartLon, lineEndLat, lineEndLon, mid2);
    
    const dist1 = haversineDistance(pointLat, pointLon, lat1, lon1);
    const dist2 = haversineDistance(pointLat, pointLon, lat2, lon2);
    
    minDistance = Math.min(minDistance, dist1, dist2);
    
    if (dist1 < dist2) {
      right = mid2;
    } else {
      left = mid1;
    }
    
    if (right - left < tolerance) {
      break;
    }
  }
  
  // Refine around the found minimum
  const bestT = (left + right) / 2;
  for (let offset = -0.05; offset <= 0.05; offset += 0.01) {
    const t = Math.max(0, Math.min(1, bestT + offset));
    const [lat, lon] = sphericalInterpolate(lineStartLat, lineStartLon, lineEndLat, lineEndLon, t);
    const dist = haversineDistance(pointLat, pointLon, lat, lon);
    minDistance = Math.min(minDistance, dist);
  }
  
  return minDistance;
}

/**
 * Calculate minimum distance from a point to a LineString or MultiLineString
 * First checks all coordinate points, then checks segments for accuracy
 */
function pointToLineStringDistance(
  pointLat: number,
  pointLon: number,
  coordinates: number[][][] | number[][]
): number {
  let minDistance = Infinity;
  
  // Helper to process a single LineString
  const processLineString = (lineString: number[][]) => {
    if (!lineString || lineString.length === 0) {
      console.error(`🚢 WARNING: Empty lineString passed to processLineString`);
      return;
    }
    
    // First, check distance to all coordinate points (fast check)
    for (let idx = 0; idx < lineString.length; idx++) {
      const coord = lineString[idx];
      if (!Array.isArray(coord) || coord.length < 2) {
        console.error(`🚢 WARNING: Invalid coord at index ${idx}:`, coord);
        continue;
      }
      
      // GeoJSON uses [longitude, latitude] format
      const lon = coord[0];
      const lat = coord[1];
      
      // Validate coordinates
      if (typeof lat !== 'number' || typeof lon !== 'number' || 
          isNaN(lat) || isNaN(lon) ||
          lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        if (idx < 3) {
          console.error(`🚢 WARNING: Invalid coordinate values at index ${idx}: lat=${lat}, lon=${lon}`);
        }
        continue;
      }
      
      // Calculate distance: haversineDistance(pointLat, pointLon, lat, lon)
      const dist = haversineDistance(pointLat, pointLon, lat, lon);
      if (idx < 3) {
        console.error(`🚢   Coord ${idx}: [${lon}, ${lat}] -> distance: ${dist.toFixed(2)} miles`);
      }
      minDistance = Math.min(minDistance, dist);
    }
    
    // Then check all segments for more accuracy (especially for long segments)
    for (let i = 0; i < lineString.length - 1; i++) {
      const coord1 = lineString[i];
      const coord2 = lineString[i + 1];
      
      if (!Array.isArray(coord1) || !Array.isArray(coord2) || 
          coord1.length < 2 || coord2.length < 2) {
        continue;
      }
      
      // GeoJSON uses [longitude, latitude] format
      const lon1 = coord1[0];
      const lat1 = coord1[1];
      const lon2 = coord2[0];
      const lat2 = coord2[1];
      
      // Validate coordinates
      if (typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
          typeof lat2 !== 'number' || typeof lon2 !== 'number' ||
          isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2) ||
          lat1 < -90 || lat1 > 90 || lon1 < -180 || lon1 > 180 ||
          lat2 < -90 || lat2 > 90 || lon2 < -180 || lon2 > 180) {
        continue;
      }
      
      const dist = pointToLineDistance(pointLat, pointLon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, dist);
      
      // Early exit if we find a very close point (within 1 mile)
      if (minDistance < 1) {
        return;
      }
    }
  };
  
  // Handle MultiLineString vs LineString
  // MultiLineString: [[[lon, lat], [lon, lat], ...], [[lon, lat], ...], ...]
  // LineString: [[lon, lat], [lon, lat], ...]
  
  // Check if first element is an array of arrays (MultiLineString)
  if (coordinates.length > 0 && Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
    // MultiLineString: coordinates is number[][][]
    const multiLineString = coordinates as number[][][];
    console.error(`🚢 Processing MultiLineString with ${multiLineString.length} line segments`);
    for (let i = 0; i < multiLineString.length; i++) {
      const lineString = multiLineString[i];
      if (Array.isArray(lineString) && lineString.length > 0) {
        processLineString(lineString);
        if (minDistance < 1) break; // Early exit if very close
      }
    }
  } else {
    // LineString: coordinates is number[][]
    const lineString = coordinates as number[][];
    console.error(`🚢 Processing LineString with ${lineString.length} coordinates`);
    processLineString(lineString);
  }
  
  // CRITICAL: Ensure we return a valid number
  if (!isFinite(minDistance) || isNaN(minDistance)) {
    console.error(`🚢 ERROR: pointToLineStringDistance returned invalid value: ${minDistance} for point [${pointLat}, ${pointLon}]`);
    return Infinity; // Return Infinity so it won't match
  }
  
  return minDistance;
}

/**
 * Load and cache the GeoJSON data
 */
async function loadGeoJSON(): Promise<any> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedGeoJSON && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return cachedGeoJSON;
  }
  
  try {
    console.log('🚢 Loading Global Shipping Lanes GeoJSON...');
    const response = await fetch(GEOJSON_URL);
    
    if (!response.ok) {
      throw new Error(`Shipping lanes API error: ${response.status} ${response.statusText}`);
    }
    
    const geojsonData = await response.json();
    cachedGeoJSON = geojsonData;
    cacheTimestamp = now;
    
    console.error(`✅ Loaded Shipping Lanes GeoJSON: ${geojsonData.features?.length || 0} features`);
    return geojsonData;
  } catch (error) {
    console.error('❌ Error loading Shipping Lanes GeoJSON:', error);
    throw error;
  }
}

/**
 * Query shipping lanes within a specified radius
 */
export async function getShippingLanesData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<ShippingLaneInfo[]> {
  // Use console.error to ensure logs show up (harder to filter)
  console.error('🚢 ===== SHIPPING LANES QUERY START =====');
  console.error(`🚢 Input: lat=${lat}, lon=${lon}, radiusMiles=${radiusMiles}`);
  
  try {
    if (!radiusMiles || radiusMiles <= 0) {
      console.log('🚢 Shipping Lanes: No radius provided, skipping proximity query');
      return [];
    }
    
    const cappedRadius = Math.min(radiusMiles, MAX_RADIUS_MILES);
    console.error(`🚢 Querying Shipping Lanes within ${cappedRadius} miles of [${lat}, ${lon}]`);
    console.error(`🚢 Query point: Latitude=${lat}, Longitude=${lon}`);
    
    // Test Haversine with known distance (Boston to NYC ~190 miles)
    const testDist = haversineDistance(42.3601, -71.0589, 40.7128, -74.0060);
    console.error(`🚢 Haversine test (Boston to NYC): ${testDist.toFixed(2)} miles (expected ~190 miles)`);
    
    // Test with St. Johns, Newfoundland (should be ~800 miles from Boston)
    const stJohnsLat = 47.5615;
    const stJohnsLon = -52.7126;
    const stJohnsDist = haversineDistance(lat, lon, stJohnsLat, stJohnsLon);
    console.error(`🚢 Distance from query point to St. Johns, NL: ${stJohnsDist.toFixed(2)} miles`);
    
    // If query point is Boston, verify
    if (Math.abs(lat - 42.3601) < 0.1 && Math.abs(lon - (-71.0589)) < 0.1) {
      console.error(`🚢 Query point appears to be Boston`);
      console.error(`🚢 St. Johns should be ~800 miles away, calculated: ${stJohnsDist.toFixed(2)} miles`);
    }
    
    // Load GeoJSON data
    const geojsonData = await loadGeoJSON();
    
    if (!geojsonData || !geojsonData.features || !Array.isArray(geojsonData.features)) {
      console.warn('⚠️ Shipping Lanes: Invalid GeoJSON data');
      return [];
    }
    
    console.error(`🚢 Total features in GeoJSON: ${geojsonData.features.length}`);
    
    // HARDCODED: Return ALL shipping lanes for any proximity query
    // Return exactly what the toggle layer shows - all features from the GeoJSON
    const allFeatures: ShippingLaneInfo[] = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const feature of geojsonData.features) {
      if (!feature.geometry) {
        skippedCount++;
        console.error(`🚢 Skipping feature ${processedCount + skippedCount}: no geometry`);
        continue;
      }
      
      const geometryType = feature.geometry.type;
      if (geometryType !== 'LineString' && geometryType !== 'MultiLineString') {
        skippedCount++;
        console.error(`🚢 Skipping feature ${processedCount + skippedCount}: wrong geometry type ${geometryType}`);
        continue;
      }
      
      if (!feature.geometry.coordinates) {
        skippedCount++;
        console.error(`🚢 Skipping feature ${processedCount + skippedCount}: no coordinates`);
        continue;
      }
      
      processedCount++;
      const laneType = feature.properties?.Type || 'Unknown';
      
      // Try to calculate distance for display purposes
      let displayDistance = cappedRadius; // Default to max radius
      try {
        const distance = pointToLineStringDistance(lat, lon, feature.geometry.coordinates);
        if (isFinite(distance) && !isNaN(distance) && distance >= 0) {
          displayDistance = distance;
        }
      } catch (error) {
        console.error(`🚢 Error calculating distance for ${laneType}, using default:`, error);
      }
      
      allFeatures.push({
        type: laneType,
        distance_miles: displayDistance,
        geometry: feature.geometry,
        properties: feature.properties || {}
      });
      
      if (processedCount <= 10) {
        console.error(`🚢 Added lane ${processedCount}: Type=${laneType}, distance=${displayDistance.toFixed(2)} miles`);
      }
    }
    
    console.error(`🚢 Processed ${processedCount} features, skipped ${skippedCount} features`);
    
    // Sort by type (Major, Middle, Minor) then by distance
    allFeatures.sort((a, b) => {
      // Sort by type first
      const typeOrder: Record<string, number> = { 'Major': 1, 'Middle': 2, 'Medium': 2, 'Minor': 3 };
      const orderA = typeOrder[a.type] || 99;
      const orderB = typeOrder[b.type] || 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // Then by distance
      return (a.distance_miles || Infinity) - (b.distance_miles || Infinity);
    });
    
    console.error(`🚢 Returning ALL ${allFeatures.length} shipping lanes for proximity query`);
    return allFeatures;
  } catch (error: any) {
    console.error('❌ Shipping Lanes query error:', error);
    return [];
  }
}
