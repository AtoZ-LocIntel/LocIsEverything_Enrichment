/**
 * WRI Aqueduct Water Risk Adapter
 * Queries World Resources Institute Aqueduct Water Risk data from ArcGIS FeatureServer
 * Supports point-in-polygon and proximity queries up to 100 miles
 * Layers:
 * - Layer 0: Future Annual
 * - Layer 1: Baseline Annual
 * - Layer 2: Baseline Monthly
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/aqueduct_water_risk/FeatureServer';
const FUTURE_ANNUAL_LAYER_ID = 0;
const BASELINE_ANNUAL_LAYER_ID = 1;
const BASELINE_MONTHLY_LAYER_ID = 2;

export interface WRIAqueductWaterRiskInfo {
  attributes: Record<string, any>;
  geometry?: any;
  isContaining?: boolean;
  distance_miles?: number;
}

/**
 * Point-in-polygon check using ray casting algorithm
 * Note: ring coordinates are [lon, lat] format
 */
function pointInRing(lat: number, lon: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const lonI = ring[i][0], latI = ring[i][1];
    const lonJ = ring[j][0], latJ = ring[j][1];
    const intersect = ((latI > lat) !== (latJ > lat)) && (lon < (lonJ - lonI) * (lat - latI) / (latJ - latI) + lonI);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Point-in-polygon check for multi-ring polygons
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  // Check if point is in the outer ring (first ring)
  const outerRing = rings[0];
  if (!pointInRing(lat, lon, outerRing)) return false;
  // Check if point is in any inner ring (holes) - if so, it's outside
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lat, lon, rings[i])) return false;
  }
  return true;
}

/**
 * Calculate distance from point to polygon edge (in miles)
 * Note: ring coordinates are [lon, lat] format
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  let minDistance = Infinity;
  const outerRing = rings[0];
  for (let i = 0; i < outerRing.length; i++) {
    const p1 = outerRing[i];
    const p2 = outerRing[(i + 1) % outerRing.length];
    // p1 and p2 are [lon, lat] format
    const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance;
}

/**
 * Calculate distance from point to line segment (in miles)
 * Note: ring coordinates are [lon, lat] format
 */
function distanceToLineSegment(
  lat: number, lon: number,
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const A = lon - lon1;
  const B = lat - lat1;
  const C = lon2 - lon1;
  const D = lat2 - lat1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx, yy;
  if (param < 0) {
    xx = lon1;
    yy = lat1;
  } else if (param > 1) {
    xx = lon2;
    yy = lat2;
  } else {
    xx = lon1 + param * C;
    yy = lat1 + param * D;
  }
  const R = 3959; // Earth's radius in miles
  const dLat = (yy - lat) * Math.PI / 180;
  const dLon = (xx - lon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(yy * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query WRI Aqueduct Water Risk layer for point-in-polygon and proximity
 * Supports proximity queries up to 100 miles
 */
async function getWRIAqueductWaterRiskLayerData(
  lat: number,
  lon: number,
  layerId: number,
  layerName: string,
  radiusMiles?: number
): Promise<WRIAqueductWaterRiskInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 100 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 100.0) : 100.0;
    
    const results: WRIAqueductWaterRiskInfo[] = [];
    
    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pointInPolyUrl = `${BASE_SERVICE_URL}/${layerId}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🌊 Querying WRI Aqueduct Water Risk ${layerName} for point-in-polygon at [${lat}, ${lon}]`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      if (!pointInPolyData.error && pointInPolyData.features &&
          Array.isArray(pointInPolyData.features) && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || {};
          const rings = geometry.rings || [];
          
          // Verify point is actually inside polygon (client-side check)
          if (rings.length > 0 && pointInPolygon(lat, lon, rings)) {
            results.push({
              attributes,
              geometry,
              isContaining: true,
              distance_miles: 0
            });
          }
        });
        console.log(`✅ Found ${results.length} WRI Aqueduct Water Risk ${layerName} feature(s) containing the point`);
      }
    } catch (error) {
      console.error(`❌ Point-in-polygon query failed for ${layerName}:`, error);
    }
    
    // Proximity query (if radius is provided)
    if (maxRadius > 0) {
      try {
        const radiusMeters = maxRadius * 1609.34;
        const proximityGeometry = {
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        };
        
        const allFeatures: any[] = [];
        let resultOffset = 0;
        const batchSize = 2000;
        let hasMore = true;
        
        while (hasMore) {
          const proximityUrl = `${BASE_SERVICE_URL}/${layerId}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
          
          if (resultOffset === 0) {
            console.log(`🌊 Querying WRI Aqueduct Water Risk ${layerName} for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error(`❌ WRI Aqueduct Water Risk ${layerName} API Error:`, proximityData.error);
            break;
          }
          
          if (!proximityData.features || proximityData.features.length === 0) {
            hasMore = false;
            break;
          }
          
          allFeatures.push(...proximityData.features);
          
          if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
            resultOffset += batchSize;
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            hasMore = false;
          }
        }
        
        console.log(`✅ Fetched ${allFeatures.length} total WRI Aqueduct Water Risk ${layerName} features for proximity`);
        
        // Process proximity features
        allFeatures.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || {};
          const rings = geometry.rings || [];
          
          // Skip if already in results (from point-in-polygon query)
          const objectId = attributes.OBJECTID || attributes.FID || attributes.fid || null;
          const existingIndex = results.findIndex(r => {
            const rObjectId = r.attributes.OBJECTID || r.attributes.FID || r.attributes.fid || null;
            return rObjectId !== null && objectId !== null && rObjectId === objectId;
          });
          if (existingIndex >= 0) {
            return; // Already added from point-in-polygon query
          }
          
          if (rings.length > 0) {
            const distance = distanceToPolygon(lat, lon, rings);
            
            results.push({
              attributes,
              geometry,
              isContaining: false,
              distance_miles: distance
            });
          }
        });
        
        console.log(`✅ Found ${results.length} total WRI Aqueduct Water Risk ${layerName} feature(s) (${results.filter(r => r.isContaining).length} containing, ${results.filter(r => !r.isContaining).length} nearby)`);
      } catch (error) {
        console.error(`❌ Proximity query failed for ${layerName}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying WRI Aqueduct Water Risk ${layerName}:`, error);
    return [];
  }
}

/**
 * Query WRI Aqueduct Water Risk - Future Annual
 */
export async function getWRIAqueductWaterRiskFutureAnnualData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<WRIAqueductWaterRiskInfo[]> {
  return getWRIAqueductWaterRiskLayerData(lat, lon, FUTURE_ANNUAL_LAYER_ID, 'Future Annual', radiusMiles);
}

/**
 * Query WRI Aqueduct Water Risk - Baseline Annual
 */
export async function getWRIAqueductWaterRiskBaselineAnnualData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<WRIAqueductWaterRiskInfo[]> {
  return getWRIAqueductWaterRiskLayerData(lat, lon, BASELINE_ANNUAL_LAYER_ID, 'Baseline Annual', radiusMiles);
}

/**
 * Query WRI Aqueduct Water Risk - Baseline Monthly
 */
export async function getWRIAqueductWaterRiskBaselineMonthlyData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<WRIAqueductWaterRiskInfo[]> {
  return getWRIAqueductWaterRiskLayerData(lat, lon, BASELINE_MONTHLY_LAYER_ID, 'Baseline Monthly', radiusMiles);
}

