import { fetchJSONSmart } from '../services/EnrichmentService';

export interface IrelandElectoralDivisionInfo {
  objectId: number;
  edId: string;
  edEnglish: string;
  edGaeilge: string;
  county: string;
  contae: string;
  province: string;
  centroidX: string;
  centroidY: string;
  guid: string;
  csoed3409: string;
  osied3441: string;
  csoed34_1: string;
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
  const d23 = haversineDistance(segStartLat, segStartLon, segEndLat, segEndLon);
  
  if (d23 === 0) return d12;
  
  // Calculate bearings
  const bearing12 = Math.atan2(
    Math.sin(lon2 - lon1) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  );
  
  const bearing23 = Math.atan2(
    Math.sin(lon3 - lon2) * Math.cos(lat3),
    Math.cos(lat2) * Math.sin(lat3) - Math.sin(lat2) * Math.cos(lat3) * Math.cos(lon3 - lon2)
  );
  
  const crossTrackDistance = Math.asin(Math.sin(d12 / 3958.8) * Math.sin(bearing12 - bearing23)) * 3958.8;
  
  return Math.abs(crossTrackDistance);
}

// Distance from point to polygon boundary
function distanceToPolygon(
  pointLat: number,
  pointLon: number,
  polygon: number[][][]
): number {
  if (!polygon || polygon.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  // Check distance to each ring
  for (const ring of polygon) {
    if (ring.length < 2) continue;
    
    for (let i = 0; i < ring.length; i++) {
      const start = ring[i];
      const end = ring[(i + 1) % ring.length];
      
      // ESRI coordinates are [lon, lat] in 4326
      const segStartLon = start[0];
      const segStartLat = start[1];
      const segEndLon = end[0];
      const segEndLat = end[1];
      
      const distance = pointToLineSegmentDistance(
        pointLat,
        pointLon,
        segStartLat,
        segStartLon,
        segEndLat,
        segEndLon
      );
      
      minDistance = Math.min(minDistance, distance);
    }
  }
  
  return minDistance;
}

// Distance from point to multipolygon boundary
function distanceToMultipolygon(
  pointLat: number,
  pointLon: number,
  multipolygon: number[][][][]
): number {
  if (!multipolygon || multipolygon.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  for (const polygon of multipolygon) {
    const distance = distanceToPolygon(pointLat, pointLon, polygon);
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

export async function getIrelandElectoralDivisionsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<{
  containing: IrelandElectoralDivisionInfo[];
  nearby_features: IrelandElectoralDivisionInfo[];
  _all: IrelandElectoralDivisionInfo[];
}> {
  const baseUrl = 'https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/CSO_Electoral_Divisions_Ungeneralised/FeatureServer/0';
  
  const containing: IrelandElectoralDivisionInfo[] = [];
  const nearby_features: IrelandElectoralDivisionInfo[] = [];
  const _all: IrelandElectoralDivisionInfo[] = [];
  
  try {
    // Convert radius from miles to meters for ESRI query
    const radiusMeters = radiusMiles * 1609.34;
    
    // Create a buffer geometry for proximity query
    const bufferGeometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    // Query for features within the buffer (proximity)
    const queryUrl = `${baseUrl}/query?f=json&where=1=1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(bufferGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=2000`;
    
    let hasMore = true;
    let resultOffset = 0;
    const resultRecordCount = 2000;
    
    while (hasMore) {
      const url = `${queryUrl}&resultOffset=${resultOffset}`;
      const response = await fetchJSONSmart(url);
      
      if (!response || !response.features || response.features.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const feature of response.features) {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        // Extract electoral division information
        const edInfo: IrelandElectoralDivisionInfo = {
          objectId: attributes.OBJECTID_1 || attributes.ESRI_OID || 0,
          edId: attributes.ED_ID || '',
          edEnglish: attributes.ED_ENGLISH || '',
          edGaeilge: attributes.ED_GAEILGE || '',
          county: attributes.COUNTY || '',
          contae: attributes.CONTAE || '',
          province: attributes.PROVINCE || '',
          centroidX: attributes.CENTROID_X || '',
          centroidY: attributes.CENTROID_Y || '',
          guid: attributes.GUID_ || '',
          csoed3409: attributes.CSOED_3409 || '',
          osied3441: attributes.OSIED_3441 || '',
          csoed34_1: attributes.CSOED_34_1 || '',
          shapeArea: attributes.Shape__Area || 0,
          shapeLength: attributes.Shape__Length || 0,
          geometry: geometry,
          ...attributes
        };
        
        // Check if point is inside the polygon
        let isContaining = false;
        if (geometry) {
          if (geometry.rings) {
            // Single polygon
            isContaining = pointInPolygon([lon, lat], geometry.rings);
          } else if (geometry.rings && Array.isArray(geometry.rings[0]) && Array.isArray(geometry.rings[0][0]) && Array.isArray(geometry.rings[0][0][0])) {
            // Multipolygon
            isContaining = pointInMultipolygon([lon, lat], geometry.rings);
          }
        }
        
        if (isContaining) {
          edInfo.distance_miles = 0;
          containing.push(edInfo);
        } else {
          // Calculate distance to polygon boundary
          let distance = Infinity;
          if (geometry) {
            if (geometry.rings) {
              if (Array.isArray(geometry.rings[0]) && Array.isArray(geometry.rings[0][0]) && !Array.isArray(geometry.rings[0][0][0])) {
                // Single polygon
                distance = distanceToPolygon(lat, lon, geometry.rings);
              } else if (Array.isArray(geometry.rings[0]) && Array.isArray(geometry.rings[0][0]) && Array.isArray(geometry.rings[0][0][0])) {
                // Multipolygon
                distance = distanceToMultipolygon(lat, lon, geometry.rings);
              }
            }
          }
          
          if (distance <= radiusMiles) {
            edInfo.distance_miles = distance;
            nearby_features.push(edInfo);
          }
        }
        
        _all.push(edInfo);
      }
      
      // Check if there are more results
      if (response.exceededTransferLimit === true || response.features.length === resultRecordCount) {
        resultOffset += resultRecordCount;
      } else {
        hasMore = false;
      }
    }
    
    // Sort nearby features by distance
    nearby_features.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
  } catch (error) {
    console.error('Error fetching Ireland Electoral Divisions data:', error);
  }
  
  return {
    containing,
    nearby_features,
    _all
  };
}

