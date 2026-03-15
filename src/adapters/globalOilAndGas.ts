/**
 * Adapter for Global Oil and Gas Features Feature Service
 * Service URL: https://services6.arcgis.com/62zavqsrcK71xG8O/arcgis/rest/services/Global_Oil_and_Gas_Features/FeatureServer
 * 
 * Layers:
 * 0 - Processing_Plants
 * 1 - LNG
 * 2 - Power_Plants
 * 3 - Storage
 * 4 - Stations
 * 5 - Refineries
 * 6 - Basins
 * 7 - Fields
 * 8 - Mines
 * 9 - Wells
 * 10 - Wells_Vector_Grid
 * 11 - Platforms_and_Well_Pads
 * 12 - Underground_Storage
 * 13 - Pipelines
 * 14 - Railways
 * 15 - Ports
 */

const BASE_SERVICE_URL = 'https://services6.arcgis.com/62zavqsrcK71xG8O/arcgis/rest/services/Global_Oil_and_Gas_Features/FeatureServer';

export interface GlobalOilAndGasFeature {
  objectId: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance from query point (0 if inside polygon)
  isContaining?: boolean; // True if point is within polygon (polygon layers only)
  layerId: number; // Which layer this feature came from
  layerName: string; // Human-readable layer name
}

/**
 * Point-in-polygon check using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  const outerRing = rings[0];
  if (!outerRing || outerRing.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0]; // lon
    const yi = outerRing[i][1]; // lat
    const xj = outerRing[j][0]; // lon
    const yj = outerRing[j][1]; // lat
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  // Check if point is in any holes
  for (let h = 1; h < rings.length; h++) {
    const hole = rings[h];
    if (!hole || hole.length < 3) continue;
    
    let inHole = false;
    for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
      const xi = hole[i][0];
      const yi = hole[i][1];
      const xj = hole[j][0];
      const yj = hole[j][1];
      
      const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inHole = !inHole;
    }
    
    if (inHole) {
      inside = false; // Point is in a hole, so not inside polygon
      break;
    }
  }
  
  return inside;
}

/**
 * Calculate haversine distance between two points in miles
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Calculate centroid of polygon rings
 */
function calculateCentroid(rings: number[][][]): { lat: number; lon: number } | null {
  if (!rings || rings.length === 0) return null;
  
  const outerRing = rings[0];
  if (!outerRing || outerRing.length === 0) return null;
  
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  
  for (const ring of rings) {
    for (const point of ring) {
      if (point && point.length >= 2) {
        sumLon += point[0]; // lon
        sumLat += point[1]; // lat
        count++;
      }
    }
  }
  
  if (count === 0) return null;
  
  return {
    lat: sumLat / count,
    lon: sumLon / count
  };
}

/**
 * Get layer geometry type from layer info
 */
async function getLayerGeometryType(layerId: number): Promise<string | null> {
  try {
    const url = `${BASE_SERVICE_URL}/${layerId}?f=json`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.geometryType || null;
  } catch (error) {
    console.error(`Error getting layer ${layerId} geometry type:`, error);
    return null;
  }
}

/**
 * Query Global Oil and Gas Features layer with point-in-polygon for polygons and proximity for all
 */
export async function getGlobalOilAndGasLayerData(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  try {
    const maxRecordCount = 2000;
    console.log(`🛢️ Global Oil and Gas ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);

    const results: GlobalOilAndGasFeature[] = [];
    const containsObjectIdsSet = new Set<number>(); // Track object IDs from contains query

    // Get layer geometry type to determine if it's a polygon layer
    const geometryType = await getLayerGeometryType(layerId);
    const isPolygonLayer = geometryType === 'esriGeometryPolygon';

    // For polygon layers, try point-in-polygon query first
    if (isPolygonLayer) {
      try {
        const pointInPolyUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
        pointInPolyUrl.searchParams.set('f', 'json');
        pointInPolyUrl.searchParams.set('where', '1=1');
        pointInPolyUrl.searchParams.set('outFields', '*');
        pointInPolyUrl.searchParams.set('geometry', JSON.stringify({
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        }));
        pointInPolyUrl.searchParams.set('geometryType', 'esriGeometryPoint');
        pointInPolyUrl.searchParams.set('spatialRel', 'esriSpatialRelWithin');
        pointInPolyUrl.searchParams.set('inSR', '4326');
        pointInPolyUrl.searchParams.set('outSR', '4326');
        pointInPolyUrl.searchParams.set('returnGeometry', 'true');
        pointInPolyUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());

        console.log(`🔗 Global Oil and Gas ${layerName} Point-in-Polygon Query URL: ${pointInPolyUrl.toString()}`);

        const pointInPolyResponse = await fetch(pointInPolyUrl.toString());
        if (pointInPolyResponse.ok) {
          const pointInPolyData = await pointInPolyResponse.json();
          
          if (!pointInPolyData.error && pointInPolyData.features && Array.isArray(pointInPolyData.features)) {
            pointInPolyData.features.forEach((feature: any) => {
              const attributes = feature.attributes || {};
              const geometry = feature.geometry;
              const objectId = attributes.OBJECTID || attributes.objectid || attributes.FID || 0;
              
              if (geometry && geometry.rings) {
                // Verify point is actually in polygon using client-side check
                if (pointInPolygon(lat, lon, geometry.rings)) {
                  const centroid = calculateCentroid(geometry.rings);
                  results.push({
                    objectId,
                    attributes,
                    geometry,
                    distance_miles: 0,
                    isContaining: true,
                    layerId,
                    layerName
                  });
                  containsObjectIdsSet.add(objectId);
                }
              }
            });
            
            console.log(`✅ Found ${results.length} ${layerName} feature(s) containing the point`);
          }
        }
      } catch (error) {
        console.error(`❌ Point-in-polygon query failed for ${layerName}:`, error);
      }
    }

    // Proximity query (for all layers, or for polygon layers to get nearby features)
    if (radiusMiles > 0) {
      try {
        const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
        
        const proximityUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
        proximityUrl.searchParams.set('f', 'json');
        proximityUrl.searchParams.set('where', '1=1');
        proximityUrl.searchParams.set('outFields', '*');
        proximityUrl.searchParams.set('geometry', JSON.stringify({
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        }));
        proximityUrl.searchParams.set('geometryType', 'esriGeometryPoint');
        proximityUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
        proximityUrl.searchParams.set('distance', radiusMeters.toString());
        proximityUrl.searchParams.set('units', 'esriSRUnit_Meter');
        proximityUrl.searchParams.set('inSR', '4326');
        proximityUrl.searchParams.set('outSR', '4326');
        proximityUrl.searchParams.set('returnGeometry', 'true');
        proximityUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());

        console.log(`🔗 Global Oil and Gas ${layerName} Proximity Query URL: ${proximityUrl.toString()}`);

        const proximityResponse = await fetch(proximityUrl.toString());
        
        if (proximityResponse.ok) {
          const proximityData = await proximityResponse.json();
          
          if (!proximityData.error && proximityData.features && Array.isArray(proximityData.features)) {
            proximityData.features.forEach((feature: any) => {
              const attributes = feature.attributes || {};
              const geometry = feature.geometry;
              const objectId = attributes.OBJECTID || attributes.objectid || attributes.FID || 0;
              
              // Skip if already added from point-in-polygon query
              if (containsObjectIdsSet.has(objectId)) {
                return;
              }
              
              let distanceMiles = radiusMiles;
              let featureLat: number | null = null;
              let featureLon: number | null = null;

              // Calculate distance based on geometry type
              if (geometry) {
                if (geometry.x !== undefined && geometry.y !== undefined) {
                  // Point geometry
                  featureLon = geometry.x;
                  featureLat = geometry.y;
                } else if (geometry.paths && geometry.paths.length > 0) {
                  // Polyline geometry - use first point
                  const firstPath = geometry.paths[0];
                  if (firstPath && firstPath.length > 0) {
                    featureLon = firstPath[0][0];
                    featureLat = firstPath[0][1];
                  }
                } else if (geometry.rings && geometry.rings.length > 0) {
                  // Polygon geometry - use centroid
                  const centroid = calculateCentroid(geometry.rings);
                  if (centroid) {
                    featureLat = centroid.lat;
                    featureLon = centroid.lon;
                  }
                }
              }

              // Calculate distance if we have coordinates
              if (featureLat !== null && featureLon !== null) {
                distanceMiles = calculateDistance(lat, lon, featureLat, featureLon);
              }

              // Only include if within radius
              if (distanceMiles <= radiusMiles) {
                results.push({
                  objectId,
                  attributes,
                  geometry,
                  distance_miles: distanceMiles,
                  isContaining: false,
                  layerId,
                  layerName
                });
              }
            });
          }
        }
      } catch (error) {
        console.error(`❌ Proximity query failed for ${layerName}:`, error);
      }
    }

    // Remove duplicates based on objectId
    const uniqueResults = Array.from(
      new Map(results.map(item => [item.objectId, item])).values()
    );

    console.log(`✅ Retrieved ${uniqueResults.length} unique ${layerName} feature(s)`);
    return uniqueResults;
    
  } catch (error: any) {
    console.error(`❌ Error querying Global Oil and Gas ${layerName}:`, error);
    return [];
  }
}

// Layer name mappings
export const LAYER_NAMES: Record<number, string> = {
  0: 'Processing_Plants',
  1: 'LNG',
  2: 'Power_Plants',
  3: 'Storage',
  4: 'Stations',
  5: 'Refineries',
  6: 'Basins',
  7: 'Fields',
  8: 'Mines',
  9: 'Wells',
  10: 'Wells_Vector_Grid',
  11: 'Platforms_and_Well_Pads',
  12: 'Underground_Storage',
  13: 'Pipelines',
  14: 'Railways',
  15: 'Ports'
};

// Convenience functions for each layer
export async function getGlobalOilAndGasProcessingPlantsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(0, 'Processing_Plants', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasLNGData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(1, 'LNG', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasPowerPlantsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(2, 'Power_Plants', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasStorageData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(3, 'Storage', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasStationsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(4, 'Stations', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasRefineriesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(5, 'Refineries', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasBasinsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(6, 'Basins', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasFieldsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(7, 'Fields', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasMinesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(8, 'Mines', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasWellsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(9, 'Wells', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasWellsVectorGridData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(10, 'Wells_Vector_Grid', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasPlatformsAndWellPadsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(11, 'Platforms_and_Well_Pads', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasUndergroundStorageData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(12, 'Underground_Storage', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasPipelinesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(13, 'Pipelines', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasRailwaysData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(14, 'Railways', lat, lon, radiusMiles);
}

export async function getGlobalOilAndGasPortsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalOilAndGasFeature[]> {
  return getGlobalOilAndGasLayerData(15, 'Ports', lat, lon, radiusMiles);
}
