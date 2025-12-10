/**
 * BLM National Sheep and Goat Billed Grazing Allotments Adapter
 * Queries BLM National Sheep and Goat Billed Grazing Allotments polygon feature service
 * Supports point-in-polygon and proximity queries up to 50 miles
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Sheep_and_Goat_Billed_Grazing_Allotments/FeatureServer/3';

export interface BLMNationalSheepGoatGrazingInfo {
  objectId: string | null;
  allotName: string | null;
  stateAllotNum: string | null;
  status: string | null;
  source: string | null;
  trAllotNum: string | null;
  sumAcres: number | null;
  pastureName: string | null;
  stateAllotPastNum: string | null;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // True if point is within polygon
  attributes: Record<string, any>;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  const outerRing = rings[0];
  let inside = false;
  
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0];
    const yi = outerRing[i][1];
    const xj = outerRing[j][0];
    const yj = outerRing[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate distance from point to nearest edge of polygon
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  
  let minDistance = Infinity;
  const outerRing = rings[0];
  
  for (let i = 0; i < outerRing.length; i++) {
    const nextIndex = (i + 1) % outerRing.length;
    const p1 = outerRing[i];
    const p2 = outerRing[nextIndex];
    
    // Calculate distance to line segment
    const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
    if (dist < minDistance) minDistance = dist;
  }
  
  return minDistance;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Query BLM National Sheep and Goat Billed Grazing Allotments for point-in-polygon and proximity
 * Supports proximity queries up to 25 miles
 */
export async function getBLMNationalSheepGoatGrazingData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<BLMNationalSheepGoatGrazingInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;
    
    const results: BLMNationalSheepGoatGrazingInfo[] = [];
    
    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🐑 Querying BLM National Sheep and Goat Billed Grazing Allotments for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 BLM Sheep/Goat Grazing Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          // Verify point is actually inside polygon
          let isContaining = false;
          if (geometry && geometry.rings) {
            isContaining = pointInPolygon(lat, lon, geometry.rings);
          }
          
          if (isContaining) {
            const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
            const allotName = attributes.ALLOT_NAME || attributes.Allot_Name || attributes.allot_name || null;
            const stateAllotNum = attributes.ST_ALLOT_NUM || attributes.St_Allot_Num || attributes.st_allot_num || null;
            const status = attributes.Status || attributes.status || null;
            const source = attributes.Source || attributes.source || null;
            const trAllotNum = attributes.TR_ALLOT_NUM || attributes.Tr_Allot_Num || attributes.tr_allot_num || null;
            const sumAcres = attributes.SUM_ACRES !== null && attributes.SUM_ACRES !== undefined ? Number(attributes.SUM_ACRES) : null;
            const pastureName = attributes.PAST_NAME || attributes.Past_Name || attributes.past_name || null;
            const stateAllotPastNum = attributes.ST_ALLOT_PAST_NUM || attributes.St_Allot_Past_Num || attributes.st_allot_past_num || null;
            
            results.push({
              objectId: objectId,
              allotName: allotName,
              stateAllotNum: stateAllotNum,
              status: status,
              source: source,
              trAllotNum: trAllotNum,
              sumAcres: sumAcres,
              pastureName: pastureName,
              stateAllotPastNum: stateAllotPastNum,
              geometry: geometry,
              distance_miles: 0,
              isContaining: true,
              attributes: attributes
            });
          }
        });
      }
      
      console.log(`✅ Found ${results.length} BLM Sheep/Goat Grazing Allotment(s) containing the point`);
    } catch (error) {
      console.error(`❌ Point-in-polygon query failed:`, error);
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
          const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
          
          if (resultOffset === 0) {
            console.log(`🐑 Querying BLM National Sheep and Goat Billed Grazing Allotments for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error('❌ BLM Sheep/Goat Grazing API Error:', proximityData.error);
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
        
        console.log(`✅ Fetched ${allFeatures.length} total BLM Sheep/Goat Grazing Allotments for proximity`);
        
        // Process proximity features
        allFeatures.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          // Check if already added as containing
          const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
          const alreadyAdded = results.some(r => r.objectId === objectId && r.isContaining);
          
          if (!alreadyAdded && geometry && geometry.rings) {
            const distance = distanceToPolygon(lat, lon, geometry.rings);
            const distanceMiles = distance * 69; // Approximate conversion (1 degree lat ≈ 69 miles)
            
            if (distanceMiles <= maxRadius) {
              const allotName = attributes.ALLOT_NAME || attributes.Allot_Name || attributes.allot_name || null;
              const stateAllotNum = attributes.ST_ALLOT_NUM || attributes.St_Allot_Num || attributes.st_allot_num || null;
              const status = attributes.Status || attributes.status || null;
              const source = attributes.Source || attributes.source || null;
              const trAllotNum = attributes.TR_ALLOT_NUM || attributes.Tr_Allot_Num || attributes.tr_allot_num || null;
              const sumAcres = attributes.SUM_ACRES !== null && attributes.SUM_ACRES !== undefined ? Number(attributes.SUM_ACRES) : null;
              const pastureName = attributes.PAST_NAME || attributes.Past_Name || attributes.past_name || null;
              const stateAllotPastNum = attributes.ST_ALLOT_PAST_NUM || attributes.St_Allot_Past_Num || attributes.st_allot_past_num || null;
              
              results.push({
                objectId: objectId,
                allotName: allotName,
                stateAllotNum: stateAllotNum,
                status: status,
                source: source,
                trAllotNum: trAllotNum,
                sumAcres: sumAcres,
                pastureName: pastureName,
                stateAllotPastNum: stateAllotPastNum,
                geometry: geometry,
                distance_miles: Number(distanceMiles.toFixed(2)),
                isContaining: false,
                attributes: attributes
              });
            }
          }
        });
      } catch (error) {
        console.error(`❌ Proximity query failed:`, error);
      }
    }
    
    // Sort by containing first, then by distance
    results.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      return (a.distance_miles || 0) - (b.distance_miles || 0);
    });
    
    console.log(`✅ BLM National Sheep and Goat Billed Grazing Allotments: Found ${results.length} allotment(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying BLM National Sheep and Goat Billed Grazing Allotments data:', error);
    throw error;
  }
}

