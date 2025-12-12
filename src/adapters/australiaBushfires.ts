/**
 * Australia Bushfires Adapter
 * Queries Digital Atlas AUS 3-Hourly Bushfire Accumulation FeatureServer
 * Handles both Location Points (point features) and Extents (polygon features)
 * Supports point-in-polygon and proximity queries up to 50 miles
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/ArcGIS/rest/services/3-Hourly_Bushfire_Accumulation_2_view/FeatureServer';

export interface AustraliaBushfireInfo {
  objectId: number;
  lat: number;
  lon: number;
  distance_miles?: number;
  isContaining?: boolean;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  [key: string]: any; // For other attributes
}

// Convert date fields from long integers to readable date strings
function convertDateFields(attributes: Record<string, any>): Record<string, any> {
  const converted: Record<string, any> = { ...attributes };
  
  for (const [key, value] of Object.entries(attributes)) {
    // Check if field name suggests it's a date/time field
    const isDateField = /date|time|timestamp|created|updated|modified|start|end|_dt|_date|_time/i.test(key);
    
    if (isDateField && value !== null && value !== undefined) {
      // If it's a number (long integer), convert it
      if (typeof value === 'number') {
        try {
          // ESRI dates are typically milliseconds since epoch
          // But sometimes they might be seconds, so check the magnitude
          let dateValue = value;
          
          // If the number is less than a reasonable timestamp in seconds (year 2000 = 946684800)
          // but greater than a reasonable timestamp in milliseconds (year 2000 = 946684800000)
          // we need to determine the format
          // Most ESRI dates are in milliseconds
          if (value < 946684800000 && value > 946684800) {
            // Likely in seconds, convert to milliseconds
            dateValue = value * 1000;
          }
          
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            // Convert to readable date string
            converted[key] = date.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
            // Also add ISO format for CSV compatibility
            converted[`${key}_iso`] = date.toISOString();
          }
        } catch (error) {
          // If conversion fails, keep original value
          console.warn(`Failed to convert date field ${key}:`, error);
        }
      } else if (typeof value === 'string' && /^\d+$/.test(value)) {
        // String that looks like a number (long integer)
        try {
          const numValue = parseInt(value, 10);
          let dateValue = numValue;
          
          if (numValue < 946684800000 && numValue > 946684800) {
            dateValue = numValue * 1000;
          }
          
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            converted[key] = date.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
            converted[`${key}_iso`] = date.toISOString();
          }
        } catch (error) {
          console.warn(`Failed to convert date string field ${key}:`, error);
        }
      }
    }
  }
  
  return converted;
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

// Point in polygon test using ray casting algorithm
// ESRI geometry rings are [x, y] which is [lon, lat] in WGS84
function pointInPolygon(lat: number, lon: number, rings: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = rings.length - 1; i < rings.length; j = i++) {
    const [xi, yi] = rings[i]; // xi = lon, yi = lat
    const [xj, yj] = rings[j]; // xj = lon, yj = lat
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Calculate distance from point to polygon (distance to nearest edge)
// ESRI geometry rings are [x, y] which is [lon, lat] in WGS84
function distanceToPolygon(lat: number, lon: number, rings: number[][]): number {
  let minDistance = Infinity;
  
  // Check distance to each edge of the polygon
  for (let i = 0; i < rings.length; i++) {
    const [lon1, lat1] = rings[i]; // ESRI format: [lon, lat]
    const [lon2, lat2] = rings[(i + 1) % rings.length];
    
    // Calculate distance from point to line segment using haversine
    const distance = haversineDistance(lat, lon, lat1, lon1);
    const distance2 = haversineDistance(lat, lon, lat2, lon2);
    const segmentDistance = haversineDistance(lat1, lon1, lat2, lon2);
    
    // Use minimum of distances to endpoints for simplicity
    minDistance = Math.min(minDistance, distance, distance2);
  }
  
  return minDistance;
}


export interface AustraliaBushfireData {
  containing: AustraliaBushfireInfo[];
  nearby: AustraliaBushfireInfo[];
  _all: AustraliaBushfireInfo[];
}

export async function getAustraliaBushfiresData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AustraliaBushfireData> {
  try {
    console.log(`🔥 Querying Australia Bushfires within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    const containing: AustraliaBushfireInfo[] = [];
    const nearby: AustraliaBushfireInfo[] = [];
    
    // Convert radius from miles to meters for ESRI query
    const radiusMeters = radiusMiles * 1609.34;
    
    // Query Location Points (layer 4) - point features
    try {
      let hasMore = true;
      let resultOffset = 0;
      const resultRecordCount = 1000;
      
      while (hasMore) {
        const queryUrl = new URL(`${BASE_SERVICE_URL}/4/query`);
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
        
        const response = await fetchJSONSmart(queryUrl.toString());
        
        if (response.error) {
          console.error(`❌ Australia Bushfires Location Points API Error:`, response.error);
          hasMore = false;
          break;
        }
        
        if (!response || !response.features || response.features.length === 0) {
          hasMore = false;
          break;
        }
        
        for (const feature of response.features) {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry;
          
          let pointLat = 0;
          let pointLon = 0;
          
          if (geometry) {
            if (geometry.x !== undefined && geometry.y !== undefined) {
              pointLon = geometry.x;
              pointLat = geometry.y;
            } else if (geometry.longitude !== undefined && geometry.latitude !== undefined) {
              pointLon = geometry.longitude;
              pointLat = geometry.latitude;
            } else if (Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
              pointLon = geometry.coordinates[0];
              pointLat = geometry.coordinates[1];
            }
          }
          
          if (pointLat === 0 && pointLon === 0) {
            pointLat = attributes.Latitude || attributes.latitude || attributes.LAT || attributes.lat || lat;
            pointLon = attributes.Longitude || attributes.longitude || attributes.LON || attributes.lon || lon;
          }
          
          const distance = haversineDistance(lat, lon, pointLat, pointLon);
          
          if (distance <= radiusMiles) {
            // Convert date fields in attributes
            const convertedAttributes = convertDateFields(attributes);
            
            const bushfireInfo: AustraliaBushfireInfo = {
              objectId: attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 0,
              lat: pointLat,
              lon: pointLon,
              distance_miles: distance,
              isContaining: distance === 0,
              attributes: convertedAttributes,
              geometry,
              ...convertedAttributes
            };
            
            if (distance === 0) {
              containing.push(bushfireInfo);
            } else {
              nearby.push(bushfireInfo);
            }
          }
        }
        
        if (response.exceededTransferLimit === true || response.features.length === resultRecordCount) {
          resultOffset += resultRecordCount;
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error('Error querying Location Points:', error);
    }
    
    // Query Extents (layer 3) - polygon features
    try {
      let hasMore = true;
      let resultOffset = 0;
      const resultRecordCount = 1000;
      
      while (hasMore) {
        const queryUrl = new URL(`${BASE_SERVICE_URL}/3/query`);
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
        
        const response = await fetchJSONSmart(queryUrl.toString());
        
        if (response.error) {
          console.error(`❌ Australia Bushfires Extents API Error:`, response.error);
          hasMore = false;
          break;
        }
        
        if (!response || !response.features || response.features.length === 0) {
          hasMore = false;
          break;
        }
        
        for (const feature of response.features) {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry;
          
          if (!geometry || !geometry.rings) {
            continue;
          }
          
          // Check if point is inside polygon
          const rings = geometry.rings[0]; // Use first ring
          const isInside = pointInPolygon(lat, lon, rings);
          
          // Calculate distance
          const distance = isInside ? 0 : distanceToPolygon(lat, lon, rings);
          
          if (isInside || distance <= radiusMiles) {
            // Calculate centroid for display
            let centroidLat = 0;
            let centroidLon = 0;
            if (rings && rings.length > 0) {
              let sumLat = 0;
              let sumLon = 0;
              rings.forEach((ring: number[]) => {
                sumLon += ring[0];
                sumLat += ring[1];
              });
              centroidLat = sumLat / rings.length;
              centroidLon = sumLon / rings.length;
            }
            
            // Convert date fields in attributes
            const convertedAttributes = convertDateFields(attributes);
            
            const bushfireInfo: AustraliaBushfireInfo = {
              objectId: attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 0,
              lat: centroidLat || lat,
              lon: centroidLon || lon,
              distance_miles: distance,
              isContaining: isInside,
              attributes: convertedAttributes,
              geometry,
              ...convertedAttributes
            };
            
            if (isInside) {
              containing.push(bushfireInfo);
            } else {
              nearby.push(bushfireInfo);
            }
          }
        }
        
        if (response.exceededTransferLimit === true || response.features.length === resultRecordCount) {
          resultOffset += resultRecordCount;
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error('Error querying Extents:', error);
    }
    
    // Combine all results
    const _all = [...containing, ...nearby];
    
    // Sort by distance
    _all.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Found ${containing.length} containing and ${nearby.length} nearby Australia Bushfires`);
    
    return {
      containing,
      nearby,
      _all
    };
  } catch (error) {
    console.error('❌ Error querying Australia Bushfires:', error);
    return {
      containing: [],
      nearby: [],
      _all: []
    };
  }
}

