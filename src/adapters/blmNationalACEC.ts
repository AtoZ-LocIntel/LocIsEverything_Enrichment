/**
 * BLM National Areas of Critical Environmental Concern Adapter
 * Queries BLM National Areas of Critical Environmental Concern polygon feature service
 * Supports point-in-polygon and proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Areas_of_Critical_Environmental_Concern/FeatureServer/1';

export interface BLMNationalACECInfo {
  objectId: string | null;
  acecName: string | null;
  lupName: string | null;
  nepaNum: string | null;
  rodDate: string | null;
  gisAcres: number | null;
  adminState: string | null;
  relevanceCultural: string | null;
  relevanceForestry: string | null;
  relevanceHistoric: string | null;
  relevanceNaturalHazards: string | null;
  relevanceNaturalProcesses: string | null;
  relevanceNaturalSystems: string | null;
  relevanceScenic: string | null;
  relevanceWildlife: string | null;
  importanceQuality: string | null;
  importanceImportance: string | null;
  importanceContribution: string | null;
  importanceThreat: string | null;
  specialMgmtProtect: string | null;
  specialMgmtPrevent: string | null;
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
 * Query BLM National Areas of Critical Environmental Concern for point-in-polygon and proximity
 * Supports proximity queries up to 25 miles
 */
export async function getBLMNationalACECData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<BLMNationalACECInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 25 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 25.0) : 25.0;
    
    const results: BLMNationalACECInfo[] = [];
    
    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🌿 Querying BLM National ACEC for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 BLM ACEC Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
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
            const acecName = attributes.ACEC_NAME || attributes.Acec_Name || attributes.acec_name || null;
            const lupName = attributes.LUP_NAME || attributes.Lup_Name || attributes.lup_name || null;
            const nepaNum = attributes.NEPA_NUM || attributes.Nepa_Num || attributes.nepa_num || null;
            const rodDate = attributes.ROD_DATE ? new Date(attributes.ROD_DATE).toLocaleDateString() : null;
            const gisAcres = attributes.GIS_ACRES !== null && attributes.GIS_ACRES !== undefined ? Number(attributes.GIS_ACRES) : null;
            const adminState = attributes.ADMIN_ST || attributes.Admin_St || attributes.admin_st || null;
            const relevanceCultural = attributes.ACEC_RLVNCE_CUL || null;
            const relevanceForestry = attributes.ACEC_RLVNCE_FRSC || null;
            const relevanceHistoric = attributes.ACEC_RLVNCE_HIS || null;
            const relevanceNaturalHazards = attributes.ACEC_RLVNCE_NHAZ || null;
            const relevanceNaturalProcesses = attributes.ACEC_RLVNCE_NPRO || null;
            const relevanceNaturalSystems = attributes.ACEC_RLVNCE_NSYS || null;
            const relevanceScenic = attributes.ACEC_RLVNCE_SCE || null;
            const relevanceWildlife = attributes.ACEC_RLVNCE_WRSC || null;
            const importanceQuality = attributes.ACEC_IMPRTNCE_QLTS || null;
            const importanceImportance = attributes.ACEC_IMPRTNCE_IMPRTNCE || null;
            const importanceContribution = attributes.ACEC_IMPRTNCE_CNTRBTN || null;
            const importanceThreat = attributes.ACEC_IMPRTNCE_THRT || null;
            const specialMgmtProtect = attributes.SPCL_MGMT_ATTN_RX_PRTCT || null;
            const specialMgmtPrevent = attributes.SPCL_MGMT_ATTN_RX_PRVNT || null;
            
            results.push({
              objectId: objectId,
              acecName: acecName,
              lupName: lupName,
              nepaNum: nepaNum,
              rodDate: rodDate,
              gisAcres: gisAcres,
              adminState: adminState,
              relevanceCultural: relevanceCultural,
              relevanceForestry: relevanceForestry,
              relevanceHistoric: relevanceHistoric,
              relevanceNaturalHazards: relevanceNaturalHazards,
              relevanceNaturalProcesses: relevanceNaturalProcesses,
              relevanceNaturalSystems: relevanceNaturalSystems,
              relevanceScenic: relevanceScenic,
              relevanceWildlife: relevanceWildlife,
              importanceQuality: importanceQuality,
              importanceImportance: importanceImportance,
              importanceContribution: importanceContribution,
              importanceThreat: importanceThreat,
              specialMgmtProtect: specialMgmtProtect,
              specialMgmtPrevent: specialMgmtPrevent,
              geometry: geometry,
              distance_miles: 0,
              isContaining: true,
              attributes: attributes
            });
          }
        });
      }
      
      console.log(`✅ Found ${results.length} BLM ACEC(s) containing the point`);
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
            console.log(`🌿 Querying BLM National ACEC for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error('❌ BLM ACEC API Error:', proximityData.error);
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
        
        console.log(`✅ Fetched ${allFeatures.length} total BLM ACEC for proximity`);
        
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
              const acecName = attributes.ACEC_NAME || attributes.Acec_Name || attributes.acec_name || null;
              const lupName = attributes.LUP_NAME || attributes.Lup_Name || attributes.lup_name || null;
              const nepaNum = attributes.NEPA_NUM || attributes.Nepa_Num || attributes.nepa_num || null;
              const rodDate = attributes.ROD_DATE ? new Date(attributes.ROD_DATE).toLocaleDateString() : null;
              const gisAcres = attributes.GIS_ACRES !== null && attributes.GIS_ACRES !== undefined ? Number(attributes.GIS_ACRES) : null;
              const adminState = attributes.ADMIN_ST || attributes.Admin_St || attributes.admin_st || null;
              const relevanceCultural = attributes.ACEC_RLVNCE_CUL || null;
              const relevanceForestry = attributes.ACEC_RLVNCE_FRSC || null;
              const relevanceHistoric = attributes.ACEC_RLVNCE_HIS || null;
              const relevanceNaturalHazards = attributes.ACEC_RLVNCE_NHAZ || null;
              const relevanceNaturalProcesses = attributes.ACEC_RLVNCE_NPRO || null;
              const relevanceNaturalSystems = attributes.ACEC_RLVNCE_NSYS || null;
              const relevanceScenic = attributes.ACEC_RLVNCE_SCE || null;
              const relevanceWildlife = attributes.ACEC_RLVNCE_WRSC || null;
              const importanceQuality = attributes.ACEC_IMPRTNCE_QLTS || null;
              const importanceImportance = attributes.ACEC_IMPRTNCE_IMPRTNCE || null;
              const importanceContribution = attributes.ACEC_IMPRTNCE_CNTRBTN || null;
              const importanceThreat = attributes.ACEC_IMPRTNCE_THRT || null;
              const specialMgmtProtect = attributes.SPCL_MGMT_ATTN_RX_PRTCT || null;
              const specialMgmtPrevent = attributes.SPCL_MGMT_ATTN_RX_PRVNT || null;
              
              results.push({
                objectId: objectId,
                acecName: acecName,
                lupName: lupName,
                nepaNum: nepaNum,
                rodDate: rodDate,
                gisAcres: gisAcres,
                adminState: adminState,
                relevanceCultural: relevanceCultural,
                relevanceForestry: relevanceForestry,
                relevanceHistoric: relevanceHistoric,
                relevanceNaturalHazards: relevanceNaturalHazards,
                relevanceNaturalProcesses: relevanceNaturalProcesses,
                relevanceNaturalSystems: relevanceNaturalSystems,
                relevanceScenic: relevanceScenic,
                relevanceWildlife: relevanceWildlife,
                importanceQuality: importanceQuality,
                importanceImportance: importanceImportance,
                importanceContribution: importanceContribution,
                importanceThreat: importanceThreat,
                specialMgmtProtect: specialMgmtProtect,
                specialMgmtPrevent: specialMgmtPrevent,
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
    
    console.log(`✅ BLM National Areas of Critical Environmental Concern: Found ${results.length} ACEC(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying BLM National Areas of Critical Environmental Concern data:', error);
    throw error;
  }
}

