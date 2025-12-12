/**
 * Ireland High Water Marks Adapter
 * Queries OSi Ireland High Water Marks - National Water Marks Ungeneralised 2024
 * This is a polyline dataset, so we calculate distance to nearest point on the line
 * Supports proximity queries up to 25 miles
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/HighWaterMark_NationalWaterMarks_Ungeneralised_2024/FeatureServer/0';

export interface IrelandHighWaterMarkInfo {
  objectId: number;
  guid: string;
  bdyTypeValue: string | null;
  shapeLength: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI polyline geometry for drawing on map
  distance_miles?: number;
  [key: string]: any; // For other attributes
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
      
      // ESRI geometry with outSR=4326 are [x, y] which is [lon, lat] in degrees
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
 * Query Ireland High Water Marks FeatureServer for proximity search
 * Returns high water marks within the specified radius (in miles)
 */
export async function getIrelandHighWaterMarksData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<IrelandHighWaterMarkInfo[]> {
  try {
    console.log(`🌊 Querying Ireland High Water Marks within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    // Convert miles to meters for the buffer distance
    const radiusMeters = radiusMiles * 1609.34;
    
    let hasMore = true;
    let resultOffset = 0;
    const resultRecordCount = 2000;
    const waterMarks: IrelandHighWaterMarkInfo[] = [];
    
    while (hasMore) {
      // Build query URL using URL API for better reliability
      const queryUrl = new URL(`${BASE_SERVICE_URL}/query`);
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
      queryUrl.searchParams.set('resultRecordCount', resultRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      console.log(`🔗 Ireland High Water Marks Query URL: ${queryUrl.toString()}`);
      
      const response = await fetchJSONSmart(queryUrl.toString());
      
      if (response.error) {
        console.error(`❌ Ireland High Water Marks API Error:`, response.error);
        hasMore = false;
        break;
      }
      
      if (!response || !response.features || response.features.length === 0) {
        hasMore = false;
        break;
      }
      
      // Process all features
      for (const feature of response.features) {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || {};
        
        // Extract key fields
        const objectId = attributes.OBJECTID || attributes.ESRI_OID || 0;
        const guid = attributes.GUID || '';
        const bdyTypeValue = attributes.BDY_TYPE_VALUE || null;
        const shapeLength = attributes.Shape__Length || attributes.SHAPE__LENGTH || null;
        
        // Calculate distance from search point to nearest point on polyline
        let distance_miles: number | undefined = undefined;
        if (geometry.paths && geometry.paths.length > 0) {
          distance_miles = calculateDistanceToPolyline(lat, lon, geometry.paths);
          
          // Only include if within radius
          if (distance_miles <= radiusMiles) {
            const waterMarkInfo: IrelandHighWaterMarkInfo = {
              objectId,
              guid,
              bdyTypeValue,
              shapeLength: shapeLength !== null && shapeLength !== undefined ? Number(shapeLength) : null,
              attributes,
              geometry,
              distance_miles,
              ...attributes
            };
            
            waterMarks.push(waterMarkInfo);
          }
        }
      }
      
      // Check if there are more results
      if (response.exceededTransferLimit === true || response.features.length === resultRecordCount) {
        resultOffset += resultRecordCount;
      } else {
        hasMore = false;
      }
    }
    
    // Sort by distance
    waterMarks.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${waterMarks.length} Ireland High Water Marks`);
    
    return waterMarks;
  } catch (error) {
    console.error('❌ Error querying Ireland High Water Marks:', error);
    return [];
  }
}

