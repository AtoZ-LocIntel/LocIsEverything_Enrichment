/**
 * Miami Water Bodies Adapter
 * Queries City of Miami water body polygons
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/CvuPhqcTQpZPT9qY/arcgis/rest/services/Water_Bodies_(Polygons)/FeatureServer';

export interface MiamiWaterBodyInfo {
  objectId: string | null;
  water: number | null;
  type: string | null;
  lastUpdate: string | null;
  shapeArea: number | null;
  shapeLength: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries (0 for containing features)
  isContaining?: boolean; // True if point is inside polygon
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
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  // Use the first ring (exterior ring)
  const ring = rings[0];
  if (!ring || ring.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][1]; // lat
    const yi = ring[i][0]; // lon
    const xj = ring[j][1]; // lat
    const yj = ring[j][0]; // lon
    
    const intersect = ((yi > lat) !== (yj > lat)) &&
                      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate distance from point to polygon boundary
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  // Check distance to all rings
  rings.forEach((ring: number[][]) => {
    if (!ring || ring.length < 2) return;
    
    // Check distance to each edge of the polygon
    for (let i = 0; i < ring.length; i++) {
      const p1 = ring[i];
      const p2 = ring[(i + 1) % ring.length];
      
      if (p1 && p2 && p1.length >= 2 && p2.length >= 2) {
        const lat1 = p1[1];
        const lon1 = p1[0];
        const lat2 = p2[1];
        const lon2 = p2[0];
        
        // Calculate distance to line segment
        const dist = distanceToLineSegment(lat, lon, lat1, lon1, lat2, lon2);
        if (dist < minDistance) {
          minDistance = dist;
        }
      }
    }
  });
  
  return minDistance;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(
  pointLat: number, pointLon: number,
  segLat1: number, segLon1: number,
  segLat2: number, segLon2: number
): number {
  const A = pointLon - segLon1;
  const B = pointLat - segLat1;
  const C = segLon2 - segLon1;
  const D = segLat2 - segLat1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx: number, yy: number;
  
  if (param < 0) {
    xx = segLon1;
    yy = segLat1;
  } else if (param > 1) {
    xx = segLon2;
    yy = segLat2;
  } else {
    xx = segLon1 + param * C;
    yy = segLat1 + param * D;
  }
  
  return calculateDistance(pointLat, pointLon, yy, xx);
}

/**
 * Helper function to fetch with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Query Miami Water Bodies (Layer 0) - Polygon features
 * Supports point-in-polygon and proximity queries
 */
export async function getMiamiWaterBodiesData(
  lat: number,
  lon: number,
  radius?: number
): Promise<MiamiWaterBodyInfo[]> {
  try {
    const results: MiamiWaterBodyInfo[] = [];
    const LAYER_ID = 0;
    const processedObjectIds = new Set<string>();
    
    // Always do point-in-polygon query first
    console.log(`💧 Querying Miami Water Bodies for point-in-polygon at [${lat}, ${lon}]`);
    
    const pointInPolyQueryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    pointInPolyQueryUrl.searchParams.set('f', 'json');
    pointInPolyQueryUrl.searchParams.set('where', '1=1');
    pointInPolyQueryUrl.searchParams.set('outFields', '*');
    pointInPolyQueryUrl.searchParams.set('geometry', JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }));
    pointInPolyQueryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    pointInPolyQueryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    pointInPolyQueryUrl.searchParams.set('inSR', '4326');
    pointInPolyQueryUrl.searchParams.set('outSR', '4326');
    pointInPolyQueryUrl.searchParams.set('returnGeometry', 'true');
    pointInPolyQueryUrl.searchParams.set('geometryPrecision', '6');
    pointInPolyQueryUrl.searchParams.set('maxAllowableOffset', '0');
    
    console.log(`🔗 Miami Water Bodies Point-in-Polygon Query URL: ${pointInPolyQueryUrl.toString()}`);
    
    let pointInPolyData: any;
    try {
      const pointInPolyResponse = await fetchWithTimeout(pointInPolyQueryUrl.toString(), 30000);
      
      if (!pointInPolyResponse.ok) {
        console.error(`❌ Miami Water Bodies HTTP error! status: ${pointInPolyResponse.status}`);
      } else {
        pointInPolyData = await pointInPolyResponse.json();
      }
    } catch (error: any) {
      console.error('❌ Miami Water Bodies Point-in-Polygon fetch error:', error.message || error);
    }
    
    if (pointInPolyData && !pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
      pointInPolyData.features.forEach((feature: any) => {
        try {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const objectId = attributes.OBJECTID || attributes.objectid || attributes.FID || null;
          if (objectId) processedObjectIds.add(objectId.toString());
          
          const water = attributes.WATER !== null && attributes.WATER !== undefined ? attributes.WATER :
                       attributes.water !== null && attributes.water !== undefined ? attributes.water : null;
          const type = attributes.TYPE || attributes.type || attributes.Type || null;
          const lastUpdate = attributes.LAST_UPDAT || attributes.lastUpdate || attributes.LastUpdate || attributes.LAST_UPDATE || null;
          const shapeArea = attributes.Shape__Area !== null && attributes.Shape__Area !== undefined ? attributes.Shape__Area :
                           attributes.Shape_Area !== null && attributes.Shape_Area !== undefined ? attributes.Shape_Area :
                           attributes.shapeArea !== null && attributes.shapeArea !== undefined ? attributes.shapeArea : null;
          const shapeLength = attributes.Shape__Length !== null && attributes.Shape__Length !== undefined ? attributes.Shape__Length :
                             attributes.Shape_Length !== null && attributes.Shape_Length !== undefined ? attributes.Shape_Length :
                             attributes.shapeLength !== null && attributes.shapeLength !== undefined ? attributes.shapeLength : null;
          
          results.push({
            objectId: objectId ? objectId.toString() : null,
            water: water !== null ? Number(water) : null,
            type,
            lastUpdate: lastUpdate ? lastUpdate.toString() : null,
            shapeArea: shapeArea !== null ? Number(shapeArea) : null,
            shapeLength: shapeLength !== null ? Number(shapeLength) : null,
            attributes,
            geometry: geometry,
            distance_miles: 0, // Point is inside polygon
            isContaining: true
          });
        } catch (error: any) {
          console.error('❌ Error processing Miami Water Body feature (point-in-polygon):', error.message || error);
        }
      });
    }
    
    // Proximity query (if radius is provided and > 0)
    if (radius && radius > 0) {
      const cappedRadius = Math.min(radius, 25.0);
      console.log(`💧 Querying Miami Water Bodies within ${cappedRadius} miles of [${lat}, ${lon}]`);
      
      const radiusMeters = cappedRadius * 1609.34;
      
      const proximityQueryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
      proximityQueryUrl.searchParams.set('f', 'json');
      proximityQueryUrl.searchParams.set('where', '1=1');
      proximityQueryUrl.searchParams.set('outFields', '*');
      proximityQueryUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      proximityQueryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      proximityQueryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      proximityQueryUrl.searchParams.set('distance', radiusMeters.toString());
      proximityQueryUrl.searchParams.set('units', 'esriSRUnit_Meter');
      proximityQueryUrl.searchParams.set('inSR', '4326');
      proximityQueryUrl.searchParams.set('outSR', '4326');
      proximityQueryUrl.searchParams.set('returnGeometry', 'true');
      proximityQueryUrl.searchParams.set('geometryPrecision', '6');
      proximityQueryUrl.searchParams.set('maxAllowableOffset', '0');
      
      console.log(`🔗 Miami Water Bodies Proximity Query URL: ${proximityQueryUrl.toString()}`);
      
      let proximityData: any;
      try {
        const proximityResponse = await fetchWithTimeout(proximityQueryUrl.toString(), 30000);
        
        if (!proximityResponse.ok) {
          console.error(`❌ Miami Water Bodies Proximity HTTP error! status: ${proximityResponse.status}`);
        } else {
          proximityData = await proximityResponse.json();
        }
      } catch (error: any) {
        console.error('❌ Miami Water Bodies Proximity fetch error:', error.message || error);
      }
      
      if (proximityData && !proximityData.error && proximityData.features && proximityData.features.length > 0) {
        proximityData.features.forEach((feature: any) => {
          try {
            const attributes = feature.attributes || {};
            const geometry = feature.geometry || null;
            
            const objectId = attributes.OBJECTID || attributes.objectid || attributes.FID || null;
            const objectIdStr = objectId ? objectId.toString() : null;
            
            // Skip if already processed from point-in-polygon query
            if (objectIdStr && processedObjectIds.has(objectIdStr)) {
              return;
            }
            
            const water = attributes.WATER !== null && attributes.WATER !== undefined ? attributes.WATER :
                         attributes.water !== null && attributes.water !== undefined ? attributes.water : null;
            const type = attributes.TYPE || attributes.type || attributes.Type || null;
            const lastUpdate = attributes.LAST_UPDAT || attributes.lastUpdate || attributes.LastUpdate || attributes.LAST_UPDATE || null;
            const shapeArea = attributes.Shape__Area !== null && attributes.Shape__Area !== undefined ? attributes.Shape__Area :
                             attributes.Shape_Area !== null && attributes.Shape_Area !== undefined ? attributes.Shape_Area :
                             attributes.shapeArea !== null && attributes.shapeArea !== undefined ? attributes.shapeArea : null;
            const shapeLength = attributes.Shape__Length !== null && attributes.Shape__Length !== undefined ? attributes.Shape__Length :
                               attributes.Shape_Length !== null && attributes.Shape_Length !== undefined ? attributes.Shape_Length :
                               attributes.shapeLength !== null && attributes.shapeLength !== undefined ? attributes.shapeLength : null;
            
            // Calculate distance to polygon
            let distance = cappedRadius || 0;
            let isContaining = false;
            
            if (geometry && geometry.rings && Array.isArray(geometry.rings) && geometry.rings.length > 0) {
              isContaining = pointInPolygon(lat, lon, geometry.rings);
              if (isContaining) {
                distance = 0;
              } else {
                distance = distanceToPolygon(lat, lon, geometry.rings);
                // Only include if within radius
                if (distance > cappedRadius) {
                  return; // Skip this feature
                }
              }
            }
            
            results.push({
              objectId: objectIdStr,
              water: water !== null ? Number(water) : null,
              type,
              lastUpdate: lastUpdate ? lastUpdate.toString() : null,
              shapeArea: shapeArea !== null ? Number(shapeArea) : null,
              shapeLength: shapeLength !== null ? Number(shapeLength) : null,
              attributes,
              geometry: geometry,
              distance_miles: distance,
              isContaining: isContaining
            });
          } catch (error: any) {
            console.error('❌ Error processing Miami Water Body feature (proximity):', error.message || error);
          }
        });
      }
    }
    
    // Sort results: containing first, then by distance
    results.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });
    
    console.log(`✅ Miami Water Bodies: Found ${results.length} water body/bodies (${results.filter(r => r.isContaining).length} containing)`);
    return results;
  } catch (error: any) {
    console.error('❌ Error querying Miami Water Bodies data:', error.message || error);
    return [];
  }
}

