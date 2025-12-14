/**
 * UK Local Authority Districts Adapter
 * Queries UK Office for National Statistics Local Authority Districts polygon feature service
 * Supports point-in-polygon and proximity queries up to 50 miles
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

export interface UKLocalAuthorityDistrictInfo {
  objectId: number;
  lad25cd: string | null;
  lad25nm: string | null;
  lad25nmw: string | null;
  bngE: number | null;
  bngN: number | null;
  long: number | null;
  lat: number | null;
  shapeArea: number | null;
  shapeLength: number | null;
  globalId: string | null;
  distance_miles?: number;
  isContaining?: boolean;
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

export async function getUKLocalAuthorityDistrictsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<{
  containing: UKLocalAuthorityDistrictInfo[];
  nearby_features: UKLocalAuthorityDistrictInfo[];
  _all: UKLocalAuthorityDistrictInfo[];
}> {
  const baseUrl = 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/LAD_MAY_2025_UK_BUC/FeatureServer/0';
  
  const containing: UKLocalAuthorityDistrictInfo[] = [];
  const nearby_features: UKLocalAuthorityDistrictInfo[] = [];
  const _all: UKLocalAuthorityDistrictInfo[] = [];
  
  try {
    // Cap radius at 50 miles
    if (radiusMiles > 50.0) {
      radiusMiles = 50.0;
    }
    
    if (radiusMiles <= 0) {
      return { containing, nearby_features, _all };
    }
    
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
      const response = await fetchJSONSmart(url) as any;
      
      if (!response || !response.features || response.features.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const feature of response.features) {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        // Extract Local Authority District information
        const districtInfo: UKLocalAuthorityDistrictInfo = {
          objectId: attributes.FID || attributes.OBJECTID || attributes.ESRI_OID || 0,
          lad25cd: attributes.LAD25CD || null,
          lad25nm: attributes.LAD25NM || null,
          lad25nmw: attributes.LAD25NMW || null,
          bngE: attributes.BNG_E !== null && attributes.BNG_E !== undefined ? Number(attributes.BNG_E) : null,
          bngN: attributes.BNG_N !== null && attributes.BNG_N !== undefined ? Number(attributes.BNG_N) : null,
          long: attributes.LONG !== null && attributes.LONG !== undefined ? Number(attributes.LONG) : null,
          lat: attributes.LAT !== null && attributes.LAT !== undefined ? Number(attributes.LAT) : null,
          shapeArea: attributes.Shape__Area !== null && attributes.Shape__Area !== undefined ? Number(attributes.Shape__Area) : null,
          shapeLength: attributes.Shape__Length !== null && attributes.Shape__Length !== undefined ? Number(attributes.Shape__Length) : null,
          globalId: attributes.GlobalID || attributes.GLOBALID || null,
          geometry: geometry,
          ...attributes
        };
        
        // Check if point is inside the polygon
        let isContaining = false;
        if (geometry) {
          if (geometry.rings) {
            // Check if it's a multipolygon or single polygon
            if (Array.isArray(geometry.rings[0]) && Array.isArray(geometry.rings[0][0]) && !Array.isArray(geometry.rings[0][0][0])) {
              // Single polygon
              isContaining = pointInPolygon([lon, lat], geometry.rings);
            } else if (Array.isArray(geometry.rings[0]) && Array.isArray(geometry.rings[0][0]) && Array.isArray(geometry.rings[0][0][0])) {
              // Multipolygon
              isContaining = pointInMultipolygon([lon, lat], geometry.rings);
            }
          }
        }
        
        if (isContaining) {
          districtInfo.distance_miles = 0;
          districtInfo.isContaining = true;
          containing.push(districtInfo);
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
            districtInfo.distance_miles = distance;
            districtInfo.isContaining = false;
            nearby_features.push(districtInfo);
          }
        }
        
        _all.push(districtInfo);
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
    console.error('Error fetching UK Local Authority Districts data:', error);
  }
  
  return {
    containing,
    nearby_features,
    _all
  };
}

