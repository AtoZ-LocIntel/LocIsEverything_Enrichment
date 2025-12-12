import { fetchJSONSmart } from '../services/EnrichmentService';

export interface IrelandVegetationAreaInfo {
  objectId: number;
  fcSubtype: number;
  name: string | null;
  shapeArea: number;
  shapeLength: number;
  distance_miles?: number;
  geometry?: any;
  [key: string]: any; // For other attributes
}

// Point-in-polygon check for a single ring
function pointInRing(point: [number, number], ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > point[1]) !== (yj > point[1])) &&
      (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Point-in-polygon check for a polygon (can have multiple rings)
function pointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  if (!polygon || polygon.length === 0) return false;
  
  // Check if point is in the outer ring
  const outerRing = polygon[0].map((coord: number[]) => [coord[0], coord[1]] as [number, number]);
  if (!pointInRing(point, outerRing)) return false;
  
  // Check if point is in any inner ring (holes)
  for (let i = 1; i < polygon.length; i++) {
    const innerRing = polygon[i].map((coord: number[]) => [coord[0], coord[1]] as [number, number]);
    if (pointInRing(point, innerRing)) return false; // Point is in a hole
  }
  
  return true;
}

// Point-in-multipolygon check
function pointInMultipolygon(point: [number, number], multipolygon: number[][][][]): boolean {
  if (!multipolygon || multipolygon.length === 0) return false;
  
  for (const polygon of multipolygon) {
    if (pointInPolygon(point, polygon)) return true;
  }
  
  return false;
}

// Haversine distance calculation
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Distance from point to line segment
function pointToLineSegmentDistance(
  pointLat: number,
  pointLon: number,
  segStartLat: number,
  segStartLon: number,
  segEndLat: number,
  segEndLon: number
): number {
  // Convert to radians
  const lat1 = pointLat * Math.PI / 180;
  const lon1 = pointLon * Math.PI / 180;
  const lat2 = segStartLat * Math.PI / 180;
  const lon2 = segStartLon * Math.PI / 180;
  const lat3 = segEndLat * Math.PI / 180;
  const lon3 = segEndLon * Math.PI / 180;

  // Calculate distances
  const d12 = haversineDistance(pointLat, pointLon, segStartLat, segStartLon);
  const d13 = haversineDistance(pointLat, pointLon, segEndLat, segEndLon);
  const d23 = haversineDistance(segStartLat, segStartLon, segEndLat, segEndLon);

  // If the segment is a point, return distance to that point
  if (d23 < 0.0001) return d12;

  // Check if the closest point is one of the endpoints
  const dot1 = Math.cos(lat1 - lat2) * Math.cos(lon1 - lon2);
  const dot2 = Math.cos(lat1 - lat3) * Math.cos(lon1 - lon3);
  
  if (dot1 <= 0) return d12;
  if (dot2 <= 0) return d13;

  // Calculate perpendicular distance
  // Use spherical law of cosines for more accurate calculation
  const a = Math.acos(Math.cos(d12 / 3958.8) * Math.cos(d23 / 3958.8) + 
                      Math.sin(d12 / 3958.8) * Math.sin(d23 / 3958.8) * Math.cos(lat1 - lat2));
  const h = Math.asin(Math.sin(d12 / 3958.8) * Math.sin(a));
  
  return h * 3958.8;
}

// Calculate distance from point to polygon boundary
function distanceToPolygonBoundary(
  lat: number,
  lon: number,
  polygon: number[][][]
): number {
  let minDistance = Infinity;
  
  if (!polygon || polygon.length === 0) return minDistance;
  
  // Check each ring (outer ring and holes)
  for (const ring of polygon) {
    if (!ring || ring.length < 2) continue;
    
    // Check distance to each edge of the ring
    for (let i = 0; i < ring.length; i++) {
      const p1 = ring[i];
      const p2 = ring[(i + 1) % ring.length];
      
      // ESRI geometry coordinates with outSR=4326 are [x, y] which is [lon, lat] in degrees
      const lat1 = p1[1];
      const lon1 = p1[0];
      const lat2 = p2[1];
      const lon2 = p2[0];
      
      const distance = pointToLineSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, distance);
    }
  }
  
  return minDistance;
}

// Calculate distance from point to multipolygon boundary
function distanceToMultipolygonBoundary(
  lat: number,
  lon: number,
  multipolygon: number[][][][]
): number {
  let minDistance = Infinity;
  
  if (!multipolygon || multipolygon.length === 0) return minDistance;
  
  for (const polygon of multipolygon) {
    const distance = distanceToPolygonBoundary(lat, lon, polygon);
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

export async function getIrelandVegetationAreasData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<{ containing: IrelandVegetationAreaInfo[]; nearby: IrelandVegetationAreaInfo[] }> {
  const BASE_SERVICE_URL = 'https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/Vegetation_Areas___OSi_National_250K_Map_of_Ireland/FeatureServer/0';
  
  const containing: IrelandVegetationAreaInfo[] = [];
  const nearby: IrelandVegetationAreaInfo[] = [];
  
  try {
    console.log(`🌿 Querying Ireland Vegetation Areas for point-in-polygon and proximity at [${lat}, ${lon}]`);
    
    // Convert radius from miles to meters for ESRI query
    const radiusMeters = radiusMiles * 1609.34;
    
    // First, do point-in-polygon query
    const pointInPolyQueryUrl = new URL(`${BASE_SERVICE_URL}/query`);
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
    pointInPolyQueryUrl.searchParams.set('resultRecordCount', '2000');
    
    console.log(`🔗 Ireland Vegetation Areas Point-in-Polygon Query URL: ${pointInPolyQueryUrl.toString()}`);
    
    const pointInPolyResponse = await fetchJSONSmart(pointInPolyQueryUrl.toString());
    
    if (pointInPolyResponse && !pointInPolyResponse.error && pointInPolyResponse.features) {
      for (const feature of pointInPolyResponse.features) {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        // Extract coordinates
        let pointLat = lat;
        let pointLon = lon;
        
        // Check if point is actually in polygon using geometry
        let isInside = false;
        if (geometry) {
          if (geometry.rings) {
            // Single polygon
            isInside = pointInPolygon([pointLon, pointLat], geometry.rings);
          } else if (geometry.geometries) {
            // Multipolygon
            isInside = pointInMultipolygon([pointLon, pointLat], geometry.geometries.map((g: any) => g.rings));
          }
        }
        
        if (isInside) {
          const vegetationAreaInfo: IrelandVegetationAreaInfo = {
            objectId: attributes.OBJECTID || attributes.ESRI_OID || 0,
            fcSubtype: attributes.FCsubtype || attributes.FCSUBTYPE || 0,
            name: attributes.NAMN1 || attributes.NAME || null,
            shapeArea: attributes.Shape__Area || attributes.SHAPE__AREA || 0,
            shapeLength: attributes.Shape__Length || attributes.SHAPE__LENGTH || 0,
            geometry,
            ...attributes
          };
          
          containing.push(vegetationAreaInfo);
        }
      }
    }
    
    // Then, do proximity query
    let hasMore = true;
    let resultOffset = 0;
    const resultRecordCount = 2000;
    
    while (hasMore) {
      const proximityQueryUrl = new URL(`${BASE_SERVICE_URL}/query`);
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
      proximityQueryUrl.searchParams.set('resultRecordCount', resultRecordCount.toString());
      proximityQueryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      console.log(`🔗 Ireland Vegetation Areas Proximity Query URL: ${proximityQueryUrl.toString()}`);
      
      const proximityResponse = await fetchJSONSmart(proximityQueryUrl.toString());
      
      if (proximityResponse.error) {
        console.error(`❌ Ireland Vegetation Areas API Error:`, proximityResponse.error);
        hasMore = false;
        break;
      }
      
      if (!proximityResponse || !proximityResponse.features || proximityResponse.features.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const feature of proximityResponse.features) {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        // Skip if already in containing array
        const objectId = attributes.OBJECTID || attributes.ESRI_OID || 0;
        if (containing.some(c => c.objectId === objectId)) {
          continue;
        }
        
        // Calculate distance to polygon boundary
        let distance = Infinity;
        if (geometry) {
          if (geometry.rings) {
            // Single polygon
            distance = distanceToPolygonBoundary(lat, lon, geometry.rings);
          } else if (geometry.geometries) {
            // Multipolygon
            distance = distanceToMultipolygonBoundary(lat, lon, geometry.geometries.map((g: any) => g.rings));
          }
        }
        
        // Only include if within radius
        if (distance <= radiusMiles) {
          const vegetationAreaInfo: IrelandVegetationAreaInfo = {
            objectId,
            fcSubtype: attributes.FCsubtype || attributes.FCSUBTYPE || 0,
            name: attributes.NAMN1 || attributes.NAME || null,
            shapeArea: attributes.Shape__Area || attributes.SHAPE__AREA || 0,
            shapeLength: attributes.Shape__Length || attributes.SHAPE__LENGTH || 0,
            distance_miles: distance,
            geometry,
            ...attributes
          };
          
          nearby.push(vegetationAreaInfo);
        }
      }
      
      // Check if there are more results
      if (proximityResponse.exceededTransferLimit === true || proximityResponse.features.length === resultRecordCount) {
        resultOffset += resultRecordCount;
      } else {
        hasMore = false;
      }
    }
    
    // Sort nearby by distance
    nearby.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${containing.length} containing and ${nearby.length} nearby Ireland Vegetation Areas`);
    
  } catch (error) {
    console.error('Error fetching Ireland Vegetation Areas data:', error);
  }
  
  return { containing, nearby };
}

