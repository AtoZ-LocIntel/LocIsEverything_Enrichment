/**
 * Australia Built-Up Areas Adapter
 * Queries Digital Atlas AUS Built-Up Areas FeatureServer
 * Polygonal feature service for built-up areas (urban areas where buildings are clustered)
 * Supports point-in-polygon and proximity queries up to 50 miles
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/Built_Up_Areas/FeatureServer/0';

export interface AustraliaBuiltUpAreaInfo {
  objectId: number;
  areaCalc: number | null;
  featureType: string | null;
  globalId: string | null;
  shapeArea: number | null;
  shapeLength: number | null;
  lat: number;
  lon: number;
  distance_miles?: number;
  isContaining?: boolean;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  [key: string]: any; // For other attributes
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

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = rings.length - 1; i < rings.length; j = i++) {
    const xi = rings[i][0], yi = rings[i][1];
    const xj = rings[j][0], yj = rings[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculate minimum distance from a point to a polygon
 */
function calculateDistanceToPolygon(lat: number, lon: number, rings: number[][]): number {
  let minDistance = Infinity;
  
  // Check if point is inside polygon
  if (pointInPolygon(lat, lon, rings)) {
    return 0;
  }
  
  // Check distance to each edge of the polygon
  for (let i = 0; i < rings.length; i++) {
    const [lon1, lat1] = rings[i]; // ESRI format: [lon, lat]
    const [lon2, lat2] = rings[(i + 1) % rings.length];
    
    // Calculate distance from point to line segment using haversine
    const distance = haversineDistance(lat, lon, lat1, lon1);
    const distance2 = haversineDistance(lat, lon, lat2, lon2);
    
    // Use minimum of distances to endpoints for simplicity
    minDistance = Math.min(minDistance, distance, distance2);
  }
  
  return minDistance;
}

export interface AustraliaBuiltUpAreaData {
  containing: AustraliaBuiltUpAreaInfo[];
  nearby: AustraliaBuiltUpAreaInfo[];
  _all: AustraliaBuiltUpAreaInfo[];
}

export async function getAustraliaBuiltUpAreasData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AustraliaBuiltUpAreaData> {
  try {
    console.log(`🏙️ Querying Australia Built-Up Areas for [${lat}, ${lon}] within ${radiusMiles} miles`);
    
    // Convert radius from miles to meters for ESRI query
    const radiusMeters = radiusMiles * 1609.34;
    
    const containing: AustraliaBuiltUpAreaInfo[] = [];
    const nearby: AustraliaBuiltUpAreaInfo[] = [];
    const _all: AustraliaBuiltUpAreaInfo[] = [];
    
    let hasMore = true;
    let resultOffset = 0;
    const resultRecordCount = 2000;
    
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
      
      console.log(`🔗 Australia Built-Up Areas Query URL: ${queryUrl.toString()}`);
      
      const response = await fetchJSONSmart(queryUrl.toString());
      
      if (response.error) {
        console.error(`❌ Australia Built-Up Areas API Error:`, response.error);
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
        const isContaining = pointInPolygon(lat, lon, rings);
        
        // Calculate distance (0 if containing, otherwise distance to polygon)
        const distance = isContaining ? 0 : calculateDistanceToPolygon(lat, lon, rings);
        
        // Calculate centroid for display
        let centroidLat = 0;
        let centroidLon = 0;
        let pointCount = 0;
        
        for (const ring of rings) {
          centroidLat += ring[1]; // ESRI format: [lon, lat]
          centroidLon += ring[0];
          pointCount++;
        }
        
        if (pointCount > 0) {
          centroidLat = centroidLat / pointCount;
          centroidLon = centroidLon / pointCount;
        }
        
        // Only include if within radius
        if (distance <= radiusMiles) {
          const areaInfo: AustraliaBuiltUpAreaInfo = {
            objectId: attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 0,
            areaCalc: attributes.area_calc || attributes.AREA_CALC || null,
            featureType: attributes.feature_type || attributes.FEATURE_TYPE || 'Built-Up Area',
            globalId: attributes.globalid || attributes.GLOBALID || null,
            shapeArea: attributes.shape__area || attributes.Shape__Area || attributes.SHAPE__AREA || null,
            shapeLength: attributes.shape__length || attributes.Shape__Length || attributes.SHAPE__LENGTH || null,
            lat: centroidLat,
            lon: centroidLon,
            distance_miles: distance,
            isContaining: isContaining,
            attributes,
            geometry,
            ...attributes
          };
          
          if (isContaining) {
            containing.push(areaInfo);
          } else {
            nearby.push(areaInfo);
          }
          _all.push(areaInfo);
        }
      }
      
      // Check if there are more results
      if (response.exceededTransferLimit === true || response.features.length === resultRecordCount) {
        resultOffset += resultRecordCount;
      } else {
        hasMore = false;
      }
    }
    
    // Sort nearby by distance
    nearby.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${containing.length} containing and ${nearby.length} nearby Australia Built-Up Areas`);
    
    return {
      containing,
      nearby,
      _all
    };
  } catch (error) {
    console.error('❌ Error querying Australia Built-Up Areas:', error);
    return {
      containing: [],
      nearby: [],
      _all: []
    };
  }
}

