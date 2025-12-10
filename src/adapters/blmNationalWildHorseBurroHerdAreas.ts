/**
 * BLM National Wild Horse and Burro Herd Area Polygons Adapter
 * Queries BLM National Wild Horse and Burro Herd Area Polygons polygon feature service
 * Supports point-in-polygon and proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Wild_Horse_and_Burro_Heard_Area_Polygons/FeatureServer/4';

export interface BLMNationalWildHorseBurroHerdAreaInfo {
  objectId: string | null;
  herdAreaName: string | null;
  herdAreaNumber: string | null;
  adminState: string | null;
  adminAgency: string | null;
  herdType: string | null;
  blmAcres: number | null;
  totalAcres: number | null;
  transferAcres: number | null;
  estHorsePop: number | null;
  estBurroPop: number | null;
  lastGatherDate: string | null;
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
 * Query BLM National Wild Horse and Burro Herd Area Polygons for point-in-polygon and proximity
 * Supports proximity queries up to 25 miles
 */
export async function getBLMNationalWildHorseBurroHerdAreasData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<BLMNationalWildHorseBurroHerdAreaInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 25 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 25.0) : 25.0;
    
    const results: BLMNationalWildHorseBurroHerdAreaInfo[] = [];
    
    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🐴 Querying BLM National Wild Horse and Burro Herd Areas for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 BLM Wild Horse/Burro Herd Areas Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
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
            const herdAreaName = attributes.HA_NAME || attributes.Ha_Name || attributes.ha_name || null;
            const herdAreaNumber = attributes.HA_NO || attributes.Ha_No || attributes.ha_no || null;
            const adminState = attributes.ADMIN_ST || attributes.Admin_St || attributes.admin_st || null;
            const adminAgency = attributes.ADMIN_AGCY || attributes.Admin_Agcy || attributes.admin_agcy || null;
            const herdType = attributes.HERD_TYPE || attributes.Herd_Type || attributes.herd_type || null;
            const blmAcres = attributes.BLM_ACRES !== null && attributes.BLM_ACRES !== undefined ? Number(attributes.BLM_ACRES) : null;
            const totalAcres = attributes.TOTAL_ACRES !== null && attributes.TOTAL_ACRES !== undefined ? Number(attributes.TOTAL_ACRES) : null;
            const transferAcres = attributes.TRANSFER_ACRES !== null && attributes.TRANSFER_ACRES !== undefined ? Number(attributes.TRANSFER_ACRES) : null;
            const estHorsePop = attributes.EST_HORSE_POP !== null && attributes.EST_HORSE_POP !== undefined ? Number(attributes.EST_HORSE_POP) : null;
            const estBurroPop = attributes.EST_BURRO_POP !== null && attributes.EST_BURRO_POP !== undefined ? Number(attributes.EST_BURRO_POP) : null;
            const lastGatherDate = attributes.LAST_GATHER_DT ? new Date(attributes.LAST_GATHER_DT).toLocaleDateString() : null;
            
            results.push({
              objectId: objectId,
              herdAreaName: herdAreaName,
              herdAreaNumber: herdAreaNumber,
              adminState: adminState,
              adminAgency: adminAgency,
              herdType: herdType,
              blmAcres: blmAcres,
              totalAcres: totalAcres,
              transferAcres: transferAcres,
              estHorsePop: estHorsePop,
              estBurroPop: estBurroPop,
              lastGatherDate: lastGatherDate,
              geometry: geometry,
              distance_miles: 0,
              isContaining: true,
              attributes: attributes
            });
          }
        });
      }
      
      console.log(`✅ Found ${results.length} BLM Wild Horse/Burro Herd Area(s) containing the point`);
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
            console.log(`🐴 Querying BLM National Wild Horse and Burro Herd Areas for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error('❌ BLM Wild Horse/Burro Herd Areas API Error:', proximityData.error);
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
        
        console.log(`✅ Fetched ${allFeatures.length} total BLM Wild Horse/Burro Herd Areas for proximity`);
        
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
              const herdAreaName = attributes.HA_NAME || attributes.Ha_Name || attributes.ha_name || null;
              const herdAreaNumber = attributes.HA_NO || attributes.Ha_No || attributes.ha_no || null;
              const adminState = attributes.ADMIN_ST || attributes.Admin_St || attributes.admin_st || null;
              const adminAgency = attributes.ADMIN_AGCY || attributes.Admin_Agcy || attributes.admin_agcy || null;
              const herdType = attributes.HERD_TYPE || attributes.Herd_Type || attributes.herd_type || null;
              const blmAcres = attributes.BLM_ACRES !== null && attributes.BLM_ACRES !== undefined ? Number(attributes.BLM_ACRES) : null;
              const totalAcres = attributes.TOTAL_ACRES !== null && attributes.TOTAL_ACRES !== undefined ? Number(attributes.TOTAL_ACRES) : null;
              const transferAcres = attributes.TRANSFER_ACRES !== null && attributes.TRANSFER_ACRES !== undefined ? Number(attributes.TRANSFER_ACRES) : null;
              const estHorsePop = attributes.EST_HORSE_POP !== null && attributes.EST_HORSE_POP !== undefined ? Number(attributes.EST_HORSE_POP) : null;
              const estBurroPop = attributes.EST_BURRO_POP !== null && attributes.EST_BURRO_POP !== undefined ? Number(attributes.EST_BURRO_POP) : null;
              const lastGatherDate = attributes.LAST_GATHER_DT ? new Date(attributes.LAST_GATHER_DT).toLocaleDateString() : null;
              
              results.push({
                objectId: objectId,
                herdAreaName: herdAreaName,
                herdAreaNumber: herdAreaNumber,
                adminState: adminState,
                adminAgency: adminAgency,
                herdType: herdType,
                blmAcres: blmAcres,
                totalAcres: totalAcres,
                transferAcres: transferAcres,
                estHorsePop: estHorsePop,
                estBurroPop: estBurroPop,
                lastGatherDate: lastGatherDate,
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
    
    console.log(`✅ BLM National Wild Horse and Burro Herd Area Polygons: Found ${results.length} herd area(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying BLM National Wild Horse and Burro Herd Area Polygons data:', error);
    throw error;
  }
}

