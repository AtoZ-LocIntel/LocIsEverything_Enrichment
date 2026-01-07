/**
 * Scotland Trunk Road Network Height Adapter
 * Queries Scotland Trunk Road Network Height (polyline features)
 * Supports proximity queries for road segments with height information
 */

const BASE_SERVICE_URL = 'https://services-eu1.arcgis.com/2fd71P03WS9cosrs/ArcGIS/rest/services/Trunk_Road_Network_Height/FeatureServer';

export interface ScotlandTrunkRoadHeightInfo {
  objectId: string | null;
  maxHeight: number | null;
  minHeight: number | null;
  meanHeight: number | null;
  meanHeightGrouped: string | null;
  maxHeightGrouped: string | null;
  symbology: number | null;
  shapeLength: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI polyline geometry for drawing on map
  distance_miles?: number; // For proximity queries
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
 * Query Scotland Trunk Road Network Height within proximity of a point
 */
export async function getScotlandTrunkRoadHeightData(
  lat: number,
  lon: number,
  radius: number
): Promise<ScotlandTrunkRoadHeightInfo[]> {
  try {
    const results: ScotlandTrunkRoadHeightInfo[] = [];
    const LAYER_ID = 0;
    
    if (!radius || radius <= 0) {
      console.log(`📍 Scotland Trunk Road Height: No radius provided, skipping proximity query`);
      return results;
    }
    
    console.log(`🛣️ Querying Scotland Trunk Road Network Height within ${radius} miles of [${lat}, ${lon}]`);
    
    // Convert radius from miles to meters
    const radiusMeters = radius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
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
    queryUrl.searchParams.set('returnIdsOnly', 'false');
    queryUrl.searchParams.set('returnCountOnly', 'false');
    
    console.log(`🔗 Scotland Trunk Road Height Query URL: ${queryUrl.toString()}`);
    
    let data: any;
    try {
      const response = await fetchWithTimeout(queryUrl.toString(), 30000);
      
      if (!response.ok) {
        console.error(`❌ Scotland Trunk Road Height HTTP error! status: ${response.status}`);
        return results;
      }
      
      data = await response.json();
    } catch (error: any) {
      console.error('❌ Scotland Trunk Road Height fetch error:', error.message || error);
      return results;
    }
    
    if (data.error) {
      console.error('❌ Scotland Trunk Road Height API Error:', data.error);
      return results;
    }
    
    console.log(`🔍 API Response Summary:`, {
      hasFeatures: !!data.features,
      featuresCount: data.features?.length || 0,
      firstFeatureSample: data.features?.[0] ? {
        hasAttributes: !!data.features[0].attributes,
        hasGeometry: !!data.features[0].geometry,
        geometryKeys: data.features[0].geometry ? Object.keys(data.features[0].geometry) : [],
        geometryType: data.features[0].geometry?.type,
        hasPaths: !!data.features[0].geometry?.paths,
        pathsLength: data.features[0].geometry?.paths?.length
      } : null
    });
    
    if (data.features && data.features.length > 0) {
      data.features.forEach((feature: any, index: number) => {
        try {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const objectId = attributes.OBJECTID || attributes.objectid || attributes.FID || null;
          const maxHeight = attributes.MAX_H !== null && attributes.MAX_H !== undefined ? attributes.MAX_H : 
                          attributes.max_h !== null && attributes.max_h !== undefined ? attributes.max_h : null;
          const minHeight = attributes.MIN_H !== null && attributes.MIN_H !== undefined ? attributes.MIN_H :
                          attributes.min_h !== null && attributes.min_h !== undefined ? attributes.min_h : null;
          const meanHeight = attributes.MEAN_H !== null && attributes.MEAN_H !== undefined ? attributes.MEAN_H :
                           attributes.mean_h !== null && attributes.mean_h !== undefined ? attributes.mean_h : null;
          const meanHeightGrouped = attributes.MEAN_H_G || attributes.mean_h_g || attributes.MeanHeightGrouped || null;
          const maxHeightGrouped = attributes.MAX_H_G || attributes.max_h_g || attributes.MaxHeightGrouped || null;
          const symbology = attributes.Symbology !== null && attributes.Symbology !== undefined ? attributes.Symbology :
                          attributes.symbology !== null && attributes.symbology !== undefined ? attributes.symbology : null;
          const shapeLength = attributes.Shape__Length || attributes.shape__length || attributes.Shape_Length || attributes.shapeLength || null;
          
          // Calculate distance to polyline
          let distance = radius || 0;
          if (geometry && geometry.paths && geometry.paths.length > 0) {
            // Find the closest point on the polyline
            let minDistance = Infinity;
            geometry.paths.forEach((path: number[][]) => {
              path.forEach((coord: number[]) => {
                if (coord && coord.length >= 2) {
                  // ESRI coordinates: [x, y] where x is longitude and y is latitude (after outSR=4326)
                  const coordLon = coord[0];
                  const coordLat = coord[1];
                  const dist = calculateDistance(lat, lon, coordLat, coordLon);
                  if (dist < minDistance) {
                    minDistance = dist;
                  }
                }
              });
            });
            if (minDistance < Infinity) {
              distance = minDistance;
            }
          }
          
          // Verify we have polyline geometry with paths
          if (!geometry || !geometry.paths || !Array.isArray(geometry.paths) || geometry.paths.length === 0) {
            console.warn(`⚠️ Feature ${index} does not have valid polyline geometry (paths array). Skipping.`);
            return;
          }
          
          // Preserve geometry exactly as received from API (with paths array)
          results.push({
            objectId: objectId ? objectId.toString() : null,
            maxHeight,
            minHeight,
            meanHeight,
            meanHeightGrouped,
            maxHeightGrouped,
            symbology,
            shapeLength,
            attributes,
            geometry: geometry, // Preserve full geometry object including paths
            distance_miles: distance
          });
        } catch (error: any) {
          console.error('❌ Error processing Scotland Trunk Road Height feature:', error.message || error);
        }
      });
    }
    
    console.log(`✅ Scotland Trunk Road Height: Found ${results.length} road segment(s)`);
    return results;
  } catch (error: any) {
    console.error('❌ Error querying Scotland Trunk Road Height data:', error.message || error);
    return [];
  }
}

