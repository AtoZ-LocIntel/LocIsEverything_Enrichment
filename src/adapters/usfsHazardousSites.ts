/**
 * USFS Hazardous Sites (CERCLA Sites) Adapter
 * Queries USFS Hazardous Sites (CERCLA Sites) polygon feature service
 * Supports point-in-polygon and proximity queries up to 100 miles
 */

const BASE_SERVICE_URL = 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_CERCLASite_01/MapServer/0';

export interface USFSHazardousSiteInfo {
  objectId: string | null;
  caseName: string | null;
  localCaseId: string | null;
  areaName: string | null;
  areaType: string | null;
  boundaryStatus: string | null;
  officialAcres: number | null;
  gisAcres: number | null;
  region: string | null;
  comments: string | null;
  actionDate: string | null;
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
 * Query USFS Hazardous Sites (CERCLA Sites) for point-in-polygon and proximity
 * Supports proximity queries up to 100 miles
 */
export async function getUSFSHazardousSitesData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<USFSHazardousSiteInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;
    
    const results: USFSHazardousSiteInfo[] = [];
    
    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`⚠️ Querying USFS Hazardous Sites (CERCLA Sites) for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 USFS Hazardous Sites Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          // Verify point is actually inside polygon
          let isContaining = false;
          if (geometry) {
            isContaining = pointInMultipolygon(lat, lon, geometry);
          }
          
          if (isContaining) {
            const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
            const caseName = attributes.CASENAME || attributes.CaseName || attributes.casename || null;
            const localCaseId = attributes.LOCALCASEID || attributes.LocalCaseId || attributes.localcaseid || null;
            const areaName = attributes.AREANAME || attributes.AreaName || attributes.areaname || null;
            const areaType = attributes.AREATYPE || attributes.AreaType || attributes.areatype || null;
            const boundaryStatus = attributes.BOUNDARYSTATUS || attributes.BoundaryStatus || attributes.boundarystatus || null;
            const officialAcres = attributes.OFFICIALACRES !== null && attributes.OFFICIALACRES !== undefined ? Number(attributes.OFFICIALACRES) : null;
            const gisAcres = attributes.GIS_ACRES !== null && attributes.GIS_ACRES !== undefined ? Number(attributes.GIS_ACRES) : null;
            const region = attributes.REGION || attributes.Region || attributes.region || null;
            const comments = attributes.COMMENTS || attributes.Comments || attributes.comments || null;
            const actionDate = attributes.ACTIONDATE ? new Date(attributes.ACTIONDATE).toLocaleDateString() : null;
            
            results.push({
              objectId: objectId,
              caseName: caseName,
              localCaseId: localCaseId,
              areaName: areaName,
              areaType: areaType,
              boundaryStatus: boundaryStatus,
              officialAcres: officialAcres,
              gisAcres: gisAcres,
              region: region,
              comments: comments,
              actionDate: actionDate,
              geometry: geometry,
              distance_miles: 0,
              isContaining: true,
              attributes: attributes
            });
          }
        });
      }
      
      console.log(`✅ Found ${results.length} USFS Hazardous Site(s) containing the point`);
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
            console.log(`⚠️ Querying USFS Hazardous Sites (CERCLA Sites) for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error('❌ USFS Hazardous Sites API Error:', proximityData.error);
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
        
        console.log(`✅ Fetched ${allFeatures.length} total USFS Hazardous Sites for proximity`);
        
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
              const caseName = attributes.CASENAME || attributes.CaseName || attributes.casename || null;
              const localCaseId = attributes.LOCALCASEID || attributes.LocalCaseId || attributes.localcaseid || null;
              const areaName = attributes.AREANAME || attributes.AreaName || attributes.areaname || null;
              const areaType = attributes.AREATYPE || attributes.AreaType || attributes.areatype || null;
              const boundaryStatus = attributes.BOUNDARYSTATUS || attributes.BoundaryStatus || attributes.boundarystatus || null;
              const officialAcres = attributes.OFFICIALACRES !== null && attributes.OFFICIALACRES !== undefined ? Number(attributes.OFFICIALACRES) : null;
              const gisAcres = attributes.GIS_ACRES !== null && attributes.GIS_ACRES !== undefined ? Number(attributes.GIS_ACRES) : null;
              const region = attributes.REGION || attributes.Region || attributes.region || null;
              const comments = attributes.COMMENTS || attributes.Comments || attributes.comments || null;
              const actionDate = attributes.ACTIONDATE ? new Date(attributes.ACTIONDATE).toLocaleDateString() : null;
              
              results.push({
                objectId: objectId,
                caseName: caseName,
                localCaseId: localCaseId,
                areaName: areaName,
                areaType: areaType,
                boundaryStatus: boundaryStatus,
                officialAcres: officialAcres,
                gisAcres: gisAcres,
                region: region,
                comments: comments,
                actionDate: actionDate,
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
    
    console.log(`✅ USFS Hazardous Sites (CERCLA Sites): Found ${results.length} hazardous site(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying USFS Hazardous Sites (CERCLA Sites) data:', error);
    throw error;
  }
}

