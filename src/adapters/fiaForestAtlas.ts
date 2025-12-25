/**
 * Adapter for USDA Forest Service FIA Forest Atlas MapServer
 * Service: https://apps.fs.usda.gov/arcx/rest/services/RDW_FIA_ForestAtlas/
 */

export interface FIAForestAtlasFeature {
  objectid: number;
  geometry: {
    rings?: number[][][]; // Polygon
    paths?: number[][][]; // Polyline
    x?: number;
    y?: number;
    spatialReference?: {
      wkid: number;
    };
  };
  attributes: Record<string, any>;
}

export interface FIAForestAtlasResponse {
  features?: FIAForestAtlasFeature[];
  geometryType?: string;
  spatialReference?: {
    wkid: number;
  };
  error?: any;
  exceededTransferLimit?: boolean;
}

const BASE_SERVICE_URL = 'https://apps.fs.usda.gov/arcx/rest/services/RDW_FIA_ForestAtlas';

/**
 * Get FIA Forest Atlas data for a specific species service and layer
 * @param serviceName - The service name (e.g., '107_American_elm_spp')
 * @param layerId - The layer ID (0-3)
 * @param latitude - Point latitude
 * @param longitude - Point longitude
 * @param radius - Search radius in miles (0 for point-in-polygon only)
 * @returns Array of features with distance calculations
 */
export async function getFIAForestAtlasData(
  serviceName: string,
  layerId: number,
  latitude: number,
  longitude: number,
  radius: number = 0
): Promise<Array<FIAForestAtlasFeature & { distance_miles?: number; isContaining?: boolean }>> {
  const serviceUrl = `${BASE_SERVICE_URL}/${serviceName}/MapServer/${layerId}`;
  
  try {
    const results: Array<FIAForestAtlasFeature & { distance_miles?: number; isContaining?: boolean }> = [];
    const processedFeatureIds = new Set<number>();
    
    // Always try point-in-polygon query first (for polygon layers)
    try {
      const pointGeometry = {
        x: longitude,
        y: latitude,
        spatialReference: { wkid: 4326 }
      };
      
      // This MapServer requires a spatial filter (doesn't support resultRecordCount/pagination)
      const pointInPolyParams = new URLSearchParams({
        f: 'json',
        where: '1=1',
        outFields: '*',
        geometry: JSON.stringify(pointGeometry),
        geometryType: 'esriGeometryPoint',
        spatialRel: 'esriSpatialRelIntersects',
        inSR: '4326',
        outSR: '4326',
        returnGeometry: 'true'
      });
      
      const pointInPolyUrl = `${serviceUrl}/query?${pointInPolyParams.toString()}`;
      console.log(`🌳 FIA Forest Atlas Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
      const pointInPolyResponse = await fetch(pointInPolyUrl);
      if (pointInPolyResponse.ok) {
        const pointInPolyData: FIAForestAtlasResponse = await pointInPolyResponse.json();
        
        if (pointInPolyData.features && pointInPolyData.features.length > 0) {
          pointInPolyData.features.forEach((feature) => {
            const objectid = feature.objectid || feature.attributes?.OBJECTID || feature.attributes?.objectid;
            if (objectid && !processedFeatureIds.has(objectid)) {
              processedFeatureIds.add(objectid);
              
              const processed: FIAForestAtlasFeature & { distance_miles?: number; isContaining?: boolean } = {
                ...feature,
                isContaining: true,
                distance_miles: 0
              };
              
              // Verify point is actually in polygon
              if (feature.geometry.rings && feature.geometry.rings.length > 0) {
                processed.isContaining = isPointInPolygon(longitude, latitude, feature.geometry.rings[0]);
              }
              
              results.push(processed);
            }
          });
          console.log(`✅ Found ${results.length} FIA Forest Atlas feature(s) containing the point`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Point-in-polygon query failed:`, error);
    }
    
    // If radius > 0, query all features and filter client-side
    // This MapServer doesn't support spatial queries (distance, envelope, polygon buffers all fail)
    if (radius > 0) {
      return await queryAllFeaturesAndFilter(serviceUrl, longitude, latitude, radius, processedFeatureIds, results);
    }
    
    // If radius is 0, only return containing features
    if (radius === 0) {
      return results.filter((f) => f.isContaining === true);
    }
    
    // Sort by distance (containing features first, then by distance)
    results.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      if (a.distance_miles !== undefined && b.distance_miles !== undefined) {
        return a.distance_miles - b.distance_miles;
      }
      return 0;
    });
    
    return results;
  } catch (error) {
    console.error('❌ FIA Forest Atlas API Error:', error);
    throw error;
  }
}

/**
 * Fallback: Query all features and filter client-side when spatial queries don't work
 */
async function queryAllFeaturesAndFilter(
  serviceUrl: string,
  longitude: number,
  latitude: number,
  radius: number,
  processedFeatureIds: Set<number>,
  existingResults: Array<FIAForestAtlasFeature & { distance_miles?: number; isContaining?: boolean }>
): Promise<Array<FIAForestAtlasFeature & { distance_miles?: number; isContaining?: boolean }>> {
  try {
    // This MapServer doesn't support resultRecordCount, so we need a spatial filter
    // For proximity, we'll use a bounding box polygon as the spatial filter
    // Calculate bounding box in degrees (approximate - 1 degree latitude ≈ 69 miles)
    const latDegrees = radius / 69.0;
    const lonDegrees = radius / (69.0 * Math.cos(latitude * Math.PI / 180));
    
    // Create a polygon bounding box for the spatial filter
    const bboxPolygon = {
      rings: [[
        [longitude - lonDegrees, latitude - latDegrees],
        [longitude + lonDegrees, latitude - latDegrees],
        [longitude + lonDegrees, latitude + latDegrees],
        [longitude - lonDegrees, latitude + latDegrees],
        [longitude - lonDegrees, latitude - latDegrees] // Close the ring
      ]],
      spatialReference: { wkid: 4326 }
    };
    
    const queryParams = new URLSearchParams({
      f: 'json',
      where: '1=1',
      outFields: '*',
      geometry: JSON.stringify(bboxPolygon),
      geometryType: 'esriGeometryPolygon',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      returnGeometry: 'true'
    });
    
    const queryUrl = `${serviceUrl}/query?${queryParams.toString()}`;
    console.log(`🌳 FIA Forest Atlas Fallback Query (all features) URL: ${queryUrl}`);
    
    const response = await fetch(queryUrl);
    if (!response.ok) {
      console.error(`❌ FIA Forest Atlas fallback query failed: ${response.status}`);
      return existingResults;
    }
    
    const data: FIAForestAtlasResponse = await response.json();
    
    if (data.error || !data.features) {
      console.error('❌ FIA Forest Atlas fallback query error:', data.error);
      return existingResults;
    }
    
    console.log(`✅ Fetched ${data.features.length} total features, filtering by distance...`);
    
    // Filter features by distance client-side
    data.features.forEach((feature) => {
      const objectid = feature.objectid || feature.attributes?.OBJECTID || feature.attributes?.objectid;
      
      // Skip if already in results
      if (objectid && processedFeatureIds.has(objectid)) {
        return;
      }
      
      processedFeatureIds.add(objectid);
      
      const processed: FIAForestAtlasFeature & { distance_miles?: number; isContaining?: boolean } = {
        ...feature,
        isContaining: false
      };
      
      // Calculate distance based on geometry type
      if (feature.geometry.rings && feature.geometry.rings.length > 0) {
        processed.isContaining = isPointInPolygon(longitude, latitude, feature.geometry.rings[0]);
        if (processed.isContaining) {
          processed.distance_miles = 0;
        } else {
          processed.distance_miles = calculateDistanceToPolygon(
            longitude,
            latitude,
            feature.geometry.rings[0]
          );
        }
      } else if (feature.geometry.paths && feature.geometry.paths.length > 0) {
        processed.distance_miles = calculateDistanceToPolyline(
          longitude,
          latitude,
          feature.geometry.paths[0]
        );
      } else if (feature.geometry.x && feature.geometry.y) {
        processed.distance_miles = haversineDistance(
          latitude,
          longitude,
          feature.geometry.y,
          feature.geometry.x
        );
      }
      
      // Only add if within radius or containing
      if (processed.isContaining || (processed.distance_miles !== undefined && processed.distance_miles <= radius)) {
        existingResults.push(processed);
      }
    });
    
    return existingResults;
  } catch (error) {
    console.error('❌ FIA Forest Atlas fallback query failed:', error);
    return existingResults;
  }
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(
  x: number,
  y: number,
  polygon: number[][]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculate distance from point to nearest point on polygon boundary
 */
function calculateDistanceToPolygon(
  lon: number,
  lat: number,
  polygon: number[][]
): number {
  let minDistance = Infinity;
  
  for (let i = 0; i < polygon.length; i++) {
    const nextIndex = (i + 1) % polygon.length;
    const distance = distanceToLineSegment(
      lat,
      lon,
      polygon[i][1],
      polygon[i][0],
      polygon[nextIndex][1],
      polygon[nextIndex][0]
    );
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

/**
 * Calculate distance from point to nearest point on polyline
 */
function calculateDistanceToPolyline(
  lon: number,
  lat: number,
  polyline: number[][]
): number {
  let minDistance = Infinity;
  
  for (let i = 0; i < polyline.length - 1; i++) {
    const distance = distanceToLineSegment(
      lat,
      lon,
      polyline[i][1],
      polyline[i][0],
      polyline[i + 1][1],
      polyline[i + 1][0]
    );
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

/**
 * Calculate distance from point to line segment (in miles)
 */
function distanceToLineSegment(
  lat: number,
  lon: number,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const A = lat - lat1;
  const B = lon - lon1;
  const C = lat2 - lat1;
  const D = lon2 - lon1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx: number, yy: number;
  
  if (param < 0) {
    xx = lat1;
    yy = lon1;
  } else if (param > 1) {
    xx = lat2;
    yy = lon2;
  } else {
    xx = lat1 + param * C;
    yy = lon1 + param * D;
  }
  
  return haversineDistance(lat, lon, xx, yy);
}

/**
 * Calculate Haversine distance between two points (in miles)
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


