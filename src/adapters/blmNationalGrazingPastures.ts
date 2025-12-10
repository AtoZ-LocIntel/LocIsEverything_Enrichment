/**
 * BLM National Grazing Pasture Polygons Adapter
 * Queries BLM National Grazing Pasture Polygons polygon feature service
 * Supports point-in-polygon and proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Grazing_Pasture_Polygons/FeatureServer/0';

export interface BLMNationalGrazingPastureInfo {
  objectId: string | null;
  allotNumber: string | null;
  allotName: string | null;
  pastureNumber: string | null;
  pastureName: string | null;
  gisAcres: number | null;
  adminState: string | null;
  adminOfficeCode: string | null;
  adminUnitCode: string | null;
  stateAllotPast: string | null;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // True if point is within polygon
  attributes: Record<string, any>;
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
 * Query BLM National Grazing Pasture Polygons for point-in-polygon and proximity
 * Supports proximity queries up to 25 miles
 */
export async function getBLMNationalGrazingPasturesData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<BLMNationalGrazingPastureInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 25 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 25.0) : 25.0;
    
    const results: BLMNationalGrazingPastureInfo[] = [];
    
    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🐄 Querying BLM National Grazing Pasture Polygons for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 BLM Grazing Pastures Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
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
            const allotNumber = attributes.ALLOT_NO || attributes.Allot_No || attributes.allot_no || null;
            const allotName = attributes.ALLOT_NAME || attributes.Allot_Name || attributes.allot_name || null;
            const pastureNumber = attributes.PAST_NO || attributes.Past_No || attributes.past_no || null;
            const pastureName = attributes.PAST_NAME || attributes.Past_Name || attributes.past_name || null;
            const gisAcres = attributes.GIS_ACRES !== null && attributes.GIS_ACRES !== undefined ? Number(attributes.GIS_ACRES) : null;
            const adminState = attributes.ADMIN_ST || attributes.Admin_St || attributes.admin_st || null;
            const adminOfficeCode = attributes.ADM_OFC_CD || attributes.Adm_Ofc_Cd || attributes.adm_ofc_cd || null;
            const adminUnitCode = attributes.ADM_UNIT_CD || attributes.Adm_Unit_Cd || attributes.adm_unit_cd || null;
            const stateAllotPast = attributes.ST_ALLOT_PAST || attributes.St_Allot_Past || attributes.st_allot_past || null;
            
            results.push({
              objectId: objectId,
              allotNumber: allotNumber,
              allotName: allotName,
              pastureNumber: pastureNumber,
              pastureName: pastureName,
              gisAcres: gisAcres,
              adminState: adminState,
              adminOfficeCode: adminOfficeCode,
              adminUnitCode: adminUnitCode,
              stateAllotPast: stateAllotPast,
              geometry: geometry,
              distance_miles: 0,
              isContaining: true,
              attributes: attributes
            });
          }
        });
      }
      
      console.log(`✅ Found ${results.length} BLM Grazing Pasture(s) containing the point`);
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
            console.log(`🐄 Querying BLM National Grazing Pasture Polygons for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error('❌ BLM Grazing Pastures API Error:', proximityData.error);
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
        
        console.log(`✅ Fetched ${allFeatures.length} total BLM Grazing Pastures for proximity`);
        
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
              const allotNumber = attributes.ALLOT_NO || attributes.Allot_No || attributes.allot_no || null;
              const allotName = attributes.ALLOT_NAME || attributes.Allot_Name || attributes.allot_name || null;
              const pastureNumber = attributes.PAST_NO || attributes.Past_No || attributes.past_no || null;
              const pastureName = attributes.PAST_NAME || attributes.Past_Name || attributes.past_name || null;
              const gisAcres = attributes.GIS_ACRES !== null && attributes.GIS_ACRES !== undefined ? Number(attributes.GIS_ACRES) : null;
              const adminState = attributes.ADMIN_ST || attributes.Admin_St || attributes.admin_st || null;
              const adminOfficeCode = attributes.ADM_OFC_CD || attributes.Adm_Ofc_Cd || attributes.adm_ofc_cd || null;
              const adminUnitCode = attributes.ADM_UNIT_CD || attributes.Adm_Unit_Cd || attributes.adm_unit_cd || null;
              const stateAllotPast = attributes.ST_ALLOT_PAST || attributes.St_Allot_Past || attributes.st_allot_past || null;
              
              results.push({
                objectId: objectId,
                allotNumber: allotNumber,
                allotName: allotName,
                pastureNumber: pastureNumber,
                pastureName: pastureName,
                gisAcres: gisAcres,
                adminState: adminState,
                adminOfficeCode: adminOfficeCode,
                adminUnitCode: adminUnitCode,
                stateAllotPast: stateAllotPast,
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
    
    console.log(`✅ BLM National Grazing Pasture Polygons: Found ${results.length} grazing pasture(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying BLM National Grazing Pasture Polygons data:', error);
    throw error;
  }
}

