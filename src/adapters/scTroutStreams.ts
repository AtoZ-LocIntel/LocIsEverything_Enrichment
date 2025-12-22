/**
 * South Carolina Trout Streams Adapter
 * Queries SC Trout Streams polylines from ArcGIS FeatureServer
 * Supports proximity queries up to 50 miles
 * Layer: Trout_Streams (Layer 4) - Polylines
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/acgZYxoN5Oj8pDLa/ArcGIS/rest/services/Trout_Streams/FeatureServer';
const LAYER_ID = 4;

export interface SCTroutStreamInfo {
  fid: number | null;
  objectid: number | null;
  geometry?: any; // ESRI polyline geometry (paths)
  distance_miles?: number;
  attributes: Record<string, any>;
}

/**
 * Calculate distance from point to line segment
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
 * Calculate distance from point to polyline (minimum distance to any segment)
 */
function distanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  if (!paths || paths.length === 0) return Infinity;
  let minDistance = Infinity;
  
  paths.forEach((path: number[][]) => {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      // ESRI paths are [lon, lat] format
      const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
      if (dist < minDistance) minDistance = dist;
    }
  });
  
  return minDistance;
}

/**
 * Query SC Trout Streams within proximity of a location
 * Supports proximity queries up to 50 miles
 */
export async function getSCTroutStreamsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<SCTroutStreamInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;
    
    if (maxRadius <= 0) {
      return [];
    }
    
    const results: SCTroutStreamInfo[] = [];
    
    // Proximity query (required for polylines) with pagination
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
        const proximityUrl = `${BASE_SERVICE_URL}/${LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        
        if (resultOffset === 0) {
          console.log(`🐟 Querying SC Trout Streams for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
        }
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityData.error) {
          console.error('❌ SC Trout Streams API Error:', proximityData.error);
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
      
      console.log(`✅ Fetched ${allFeatures.length} total SC Trout Streams features for proximity`);
      
      // Process all features and calculate accurate distances
      allFeatures.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || {};
        const paths = geometry.paths || [];
        
        if (paths.length > 0) {
          // Calculate accurate distance from point to polyline
          const distance = distanceToPolyline(lat, lon, paths);
          
          // Only include features within the specified radius
          if (distance <= maxRadius) {
            const fid = attributes.FID !== null && attributes.FID !== undefined ? attributes.FID : null;
            const objectid = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID : null;
            
            // Check for duplicates using FID or OBJECTID
            const alreadyAdded = results.some(r => 
              (r.fid !== null && fid !== null && r.fid === fid) ||
              (r.objectid !== null && objectid !== null && r.objectid === objectid)
            );
            
            if (!alreadyAdded) {
              results.push({
                fid: fid,
                objectid: objectid,
                geometry: geometry,
                distance_miles: distance,
                attributes: attributes
              });
            }
          }
        }
      });
      
      // Sort by distance
      results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
      
      console.log(`✅ Found ${results.length} SC Trout Streams feature(s) within ${maxRadius} miles`);
    } catch (error) {
      console.error('❌ Proximity query failed for SC Trout Streams:', error);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error querying SC Trout Streams data:', error);
    return [];
  }
}

