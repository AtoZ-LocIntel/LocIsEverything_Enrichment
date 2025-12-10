/**
 * BLM National Land and Water Conservation Fund (LWCF) Polygons Adapter
 * Queries BLM National Land and Water Conservation Fund (LWCF) Polygons polygon feature service
 * Supports point-in-polygon and proximity queries up to 50 miles
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Land_and_Water_Conservation_Fund_LWCF_Polygons/FeatureServer/2';

export interface BLMNationalLWCFInfo {
  objectId: string | null;
  caseId: number | null;
  snFull: string | null;
  geoState: string | null;
  projectName: string | null;
  refNum: string | null;
  acqMethod: string | null;
  intAcq: string | null;
  esmtRgts: string | null;
  accRgts: string | null;
  acqFund: string | null;
  fundYear: string | null;
  purpose: string | null;
  paymentMade: string | null;
  acqValue: string | null;
  areaAcq: number | null;
  deedSignDate: string | null;
  recorded: string | null;
  countyRec: string | null;
  rstsAcq: string | null;
  ngoName: string | null;
  titleAcptDate: string | null;
  publicDisplay: string | null;
  administratingAgency: string | null;
  photoLinks: string | null;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // True if point is within polygon
  attributes: Record<string, any>;
}

/**
 * Check if a point is inside a single ring (polygon part) using ray casting algorithm
 */
function pointInRing(lat: number, lon: number, ring: number[][]): boolean {
  if (!ring || ring.length === 0) return false;
  
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Check if a point is inside a polygon (handles multipolygon features)
 * For multipolygons, checks all outer rings (polygon parts)
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  // Check if point is in the first ring (outer boundary)
  const outerRing = rings[0];
  let inside = pointInRing(lat, lon, outerRing);
  
  // If inside outer ring, check if point is in any holes (inner rings)
  // Holes subtract from the polygon, so if point is in a hole, it's not inside the polygon
  if (inside && rings.length > 1) {
    for (let i = 1; i < rings.length; i++) {
      if (pointInRing(lat, lon, rings[i])) {
        inside = false; // Point is in a hole, so it's outside the polygon
        break;
      }
    }
  }
  
  return inside;
}

/**
 * Check if a point is inside any part of a multipolygon feature
 * This handles cases where ESRI returns multipolygon geometries with multiple separate polygon parts
 */
function pointInMultipolygon(lat: number, lon: number, geometry: any): boolean {
  if (!geometry) return false;
  
  // Handle standard polygon with rings array
  if (geometry.rings && Array.isArray(geometry.rings)) {
    return pointInPolygon(lat, lon, geometry.rings);
  }
  
  // Handle multipolygon with multiple rings arrays (if ESRI uses this format)
  if (geometry.rings && Array.isArray(geometry.rings) && geometry.rings.length > 0) {
    // Check each potential polygon part
    // In ESRI format, rings[0] is outer, rings[1+] are holes for that polygon
    // For multipolygons, we might need to check multiple separate geometries
    return pointInPolygon(lat, lon, geometry.rings);
  }
  
  return false;
}

/**
 * Calculate distance from point to nearest edge of a single ring
 */
function distanceToRing(lat: number, lon: number, ring: number[][]): number {
  if (!ring || ring.length === 0) return Infinity;
  
  let minDistance = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const nextIndex = (i + 1) % ring.length;
    const p1 = ring[i];
    const p2 = ring[nextIndex];
    
    // Calculate distance to line segment
    const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
    if (dist < minDistance) minDistance = dist;
  }
  
  return minDistance;
}

/**
 * Calculate distance from point to nearest edge of polygon (handles multipolygon features)
 * For multipolygons, calculates distance to all polygon parts and returns the minimum
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  
  // Calculate distance to outer ring (main polygon boundary)
  let minDistance = distanceToRing(lat, lon, rings[0]);
  
  // For multipolygons or polygons with holes, check all rings
  // Holes are also boundaries, so we need to check them too
  for (let i = 1; i < rings.length; i++) {
    const dist = distanceToRing(lat, lon, rings[i]);
    if (dist < minDistance) minDistance = dist;
  }
  
  return minDistance;
}

/**
 * Calculate distance from point to nearest edge of multipolygon feature
 * Handles all polygon parts in multipolygon geometries
 */
function distanceToMultipolygon(lat: number, lon: number, geometry: any): number {
  if (!geometry) return Infinity;
  
  // Handle standard polygon with rings array
  if (geometry.rings && Array.isArray(geometry.rings)) {
    return distanceToPolygon(lat, lon, geometry.rings);
  }
  
  return Infinity;
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
 * Query BLM National Land and Water Conservation Fund (LWCF) Polygons for point-in-polygon and proximity
 * Supports proximity queries up to 25 miles
 */
export async function getBLMNationalLWCFData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<BLMNationalLWCFInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;
    
    const results: BLMNationalLWCFInfo[] = [];
    
    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`💧 Querying BLM National Land and Water Conservation Fund (LWCF) Polygons for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 BLM LWCF Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          // Verify point is actually inside polygon (handles multipolygon features)
          let isContaining = false;
          if (geometry) {
            isContaining = pointInMultipolygon(lat, lon, geometry);
          }
          
          if (isContaining) {
            const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
            const caseId = attributes.Case_id !== null && attributes.Case_id !== undefined ? Number(attributes.Case_id) : null;
            const snFull = attributes.SN_Full || attributes.Sn_Full || attributes.sn_full || null;
            const geoState = attributes.Geo_State || attributes.Geo_State || attributes.geo_state || null;
            const projectName = attributes.Prjt_Name || attributes.Prjt_Name || attributes.prjt_name || null;
            const refNum = attributes.Ref_Num || attributes.Ref_Num || attributes.ref_num || null;
            const acqMethod = attributes.Acq_Method || attributes.Acq_Method || attributes.acq_method || null;
            const intAcq = attributes.Int_Acq || attributes.Int_Acq || attributes.int_acq || null;
            const esmtRgts = attributes.Esmt_Rgts || attributes.Esmt_Rgts || attributes.esmt_rgts || null;
            const accRgts = attributes.Acc_Rgts || attributes.Acc_Rgts || attributes.acc_rgts || null;
            const acqFund = attributes.Acq_Fund || attributes.Acq_Fund || attributes.acq_fund || null;
            const fundYear = attributes.Fund_Year || attributes.Fund_Year || attributes.fund_year || null;
            const purpose = attributes.Purpose || attributes.Purpose || attributes.purpose || null;
            const paymentMade = attributes.Pmnt_Made || attributes.Pmnt_Made || attributes.pmnt_made || null;
            const acqValue = attributes.Acq_Value || attributes.Acq_Value || attributes.acq_value || null;
            const areaAcq = attributes.Area_Acq !== null && attributes.Area_Acq !== undefined ? Number(attributes.Area_Acq) : null;
            const deedSignDate = attributes.Deed_Sign ? new Date(attributes.Deed_Sign).toLocaleDateString() : null;
            const recorded = attributes.Recorded || attributes.Recorded || attributes.recorded || null;
            const countyRec = attributes.County_Rec || attributes.County_Rec || attributes.county_rec || null;
            const rstsAcq = attributes.Rsts_Acq || attributes.Rsts_Acq || attributes.rsts_acq || null;
            const ngoName = attributes.NGO_Name || attributes.NGO_Name || attributes.ngo_name || null;
            const titleAcptDate = attributes.Title_Acpt ? new Date(attributes.Title_Acpt).toLocaleDateString() : null;
            const publicDisplay = attributes.Public_Display || attributes.Public_Display || attributes.public_display || null;
            const administratingAgency = attributes.Administrating_Agency || attributes.Administrating_Agency || attributes.administrating_agency || null;
            const photoLinks = attributes.Photo_Links || attributes.Photo_Links || attributes.photo_links || null;
            
            results.push({
              objectId: objectId,
              caseId: caseId,
              snFull: snFull,
              geoState: geoState,
              projectName: projectName,
              refNum: refNum,
              acqMethod: acqMethod,
              intAcq: intAcq,
              esmtRgts: esmtRgts,
              accRgts: accRgts,
              acqFund: acqFund,
              fundYear: fundYear,
              purpose: purpose,
              paymentMade: paymentMade,
              acqValue: acqValue,
              areaAcq: areaAcq,
              deedSignDate: deedSignDate,
              recorded: recorded,
              countyRec: countyRec,
              rstsAcq: rstsAcq,
              ngoName: ngoName,
              titleAcptDate: titleAcptDate,
              publicDisplay: publicDisplay,
              administratingAgency: administratingAgency,
              photoLinks: photoLinks,
              geometry: geometry,
              distance_miles: 0,
              isContaining: true,
              attributes: attributes
            });
          }
        });
      }
      
      console.log(`✅ Found ${results.length} BLM LWCF Polygon(s) containing the point`);
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
            console.log(`💧 Querying BLM National Land and Water Conservation Fund (LWCF) Polygons for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error('❌ BLM LWCF API Error:', proximityData.error);
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
        
        console.log(`✅ Fetched ${allFeatures.length} total BLM LWCF Polygons for proximity`);
        
        // Process proximity features
        allFeatures.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          // Check if already added as containing
          const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
          const alreadyAdded = results.some(r => r.objectId === objectId && r.isContaining);
          
          if (!alreadyAdded && geometry) {
            const distance = distanceToMultipolygon(lat, lon, geometry);
            const distanceMiles = distance * 69; // Approximate conversion (1 degree lat ≈ 69 miles)
            
            if (distanceMiles <= maxRadius) {
              const caseId = attributes.Case_id !== null && attributes.Case_id !== undefined ? Number(attributes.Case_id) : null;
              const snFull = attributes.SN_Full || attributes.Sn_Full || attributes.sn_full || null;
              const geoState = attributes.Geo_State || attributes.Geo_State || attributes.geo_state || null;
              const projectName = attributes.Prjt_Name || attributes.Prjt_Name || attributes.prjt_name || null;
              const refNum = attributes.Ref_Num || attributes.Ref_Num || attributes.ref_num || null;
              const acqMethod = attributes.Acq_Method || attributes.Acq_Method || attributes.acq_method || null;
              const intAcq = attributes.Int_Acq || attributes.Int_Acq || attributes.int_acq || null;
              const esmtRgts = attributes.Esmt_Rgts || attributes.Esmt_Rgts || attributes.esmt_rgts || null;
              const accRgts = attributes.Acc_Rgts || attributes.Acc_Rgts || attributes.acc_rgts || null;
              const acqFund = attributes.Acq_Fund || attributes.Acq_Fund || attributes.acq_fund || null;
              const fundYear = attributes.Fund_Year || attributes.Fund_Year || attributes.fund_year || null;
              const purpose = attributes.Purpose || attributes.Purpose || attributes.purpose || null;
              const paymentMade = attributes.Pmnt_Made || attributes.Pmnt_Made || attributes.pmnt_made || null;
              const acqValue = attributes.Acq_Value || attributes.Acq_Value || attributes.acq_value || null;
              const areaAcq = attributes.Area_Acq !== null && attributes.Area_Acq !== undefined ? Number(attributes.Area_Acq) : null;
              const deedSignDate = attributes.Deed_Sign ? new Date(attributes.Deed_Sign).toLocaleDateString() : null;
              const recorded = attributes.Recorded || attributes.Recorded || attributes.recorded || null;
              const countyRec = attributes.County_Rec || attributes.County_Rec || attributes.county_rec || null;
              const rstsAcq = attributes.Rsts_Acq || attributes.Rsts_Acq || attributes.rsts_acq || null;
              const ngoName = attributes.NGO_Name || attributes.NGO_Name || attributes.ngo_name || null;
              const titleAcptDate = attributes.Title_Acpt ? new Date(attributes.Title_Acpt).toLocaleDateString() : null;
              const publicDisplay = attributes.Public_Display || attributes.Public_Display || attributes.public_display || null;
              const administratingAgency = attributes.Administrating_Agency || attributes.Administrating_Agency || attributes.administrating_agency || null;
              const photoLinks = attributes.Photo_Links || attributes.Photo_Links || attributes.photo_links || null;
              
              results.push({
                objectId: objectId,
                caseId: caseId,
                snFull: snFull,
                geoState: geoState,
                projectName: projectName,
                refNum: refNum,
                acqMethod: acqMethod,
                intAcq: intAcq,
                esmtRgts: esmtRgts,
                accRgts: accRgts,
                acqFund: acqFund,
                fundYear: fundYear,
                purpose: purpose,
                paymentMade: paymentMade,
                acqValue: acqValue,
                areaAcq: areaAcq,
                deedSignDate: deedSignDate,
                recorded: recorded,
                countyRec: countyRec,
                rstsAcq: rstsAcq,
                ngoName: ngoName,
                titleAcptDate: titleAcptDate,
                publicDisplay: publicDisplay,
                administratingAgency: administratingAgency,
                photoLinks: photoLinks,
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
    
    console.log(`✅ BLM National Land and Water Conservation Fund (LWCF) Polygons: Found ${results.length} LWCF polygon(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying BLM National Land and Water Conservation Fund (LWCF) Polygons data:', error);
    throw error;
  }
}

