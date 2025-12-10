/**
 * USFS Roads Closed to Motorized Uses Adapter
 * Queries USFS Roads Closed to Motorized Uses linear feature service
 * Supports proximity queries up to 100 miles
 */

const BASE_SERVICE_URL = 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RoadBasic_01/MapServer/1';

export interface USFSRoadClosedToMotorizedInfo {
  objectId: string | null;
  roadName: string | null;
  roadNumber: string | null;
  forestName: string | null;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  attributes: Record<string, any>;
}

/**
 * Calculate distance from point to nearest point on polyline
 */
function distanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  if (!paths || paths.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  paths.forEach((path: number[][]) => {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
      if (dist < minDistance) minDistance = dist;
    }
  });
  
  return minDistance;
}

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
 * Query USFS Roads Closed to Motorized Uses for proximity
 * Supports proximity queries up to 100 miles
 */
export async function getUSFSRoadsClosedToMotorizedData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<USFSRoadClosedToMotorizedInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;
    
    if (maxRadius <= 0) {
      return [];
    }
    
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
        console.log(`🚫 Querying USFS Roads Closed to Motorized Uses for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
      }
      
      const proximityData = await fetchJSONSmart(proximityUrl) as any;
      
      if (proximityData.error) {
        console.error('❌ USFS Roads Closed to Motorized API Error:', proximityData.error);
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
    
    console.log(`✅ Fetched ${allFeatures.length} total USFS Roads Closed to Motorized Uses for proximity`);
    
    const results: USFSRoadClosedToMotorizedInfo[] = [];
    
    allFeatures.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      if (geometry && geometry.paths) {
        const distance = distanceToPolyline(lat, lon, geometry.paths);
        const distanceMiles = distance * 69;
        
        if (distanceMiles <= maxRadius) {
          const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
          const roadName = attributes.ROADNAME || attributes.RoadName || attributes.roadname || attributes.NAME || attributes.Name || attributes.name || null;
          const roadNumber = attributes.ROADNUMBER || attributes.RoadNumber || attributes.roadnumber || attributes.NUMBER || attributes.Number || attributes.number || null;
          const forestName = attributes.FORESTNAME || attributes.ForestName || attributes.forestname || null;
          
          results.push({
            objectId: objectId,
            roadName: roadName,
            roadNumber: roadNumber,
            forestName: forestName,
            geometry: geometry,
            distance_miles: Number(distanceMiles.toFixed(2)),
            attributes: attributes
          });
        }
      }
    });
    
    results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ USFS Roads Closed to Motorized Uses: Found ${results.length} road(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying USFS Roads Closed to Motorized Uses data:', error);
    throw error;
  }
}

