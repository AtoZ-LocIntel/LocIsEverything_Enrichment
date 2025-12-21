/**
 * Puerto Rico Hydrology Adapter
 * Queries Puerto Rico Hydrology polylines from ArcGIS FeatureServer
 * Supports proximity queries up to 25 miles
 * Layer: PR_Hydrology (Layer 0) - Polylines
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/PR_Hydrology/FeatureServer';
const LAYER_ID = 0;

export interface PRHydrologyInfo {
  fid: number | null;
  name: string | null;
  tipo: string | null;
  type: string | null;
  shapeLength: number | null;
  geometry?: any; // ESRI polyline geometry (paths)
  distance_miles?: number;
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
 * Query Puerto Rico Hydrology within proximity of a location
 * Supports proximity queries up to 25 miles
 */
export async function getPRHydrologyData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<PRHydrologyInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 25 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 25.0) : 25.0;
    
    if (maxRadius <= 0) {
      return [];
    }
    
    const results: PRHydrologyInfo[] = [];
    
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
          console.log(`🌊 Querying Puerto Rico Hydrology for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
        }
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityData.error) {
          console.error('❌ Puerto Rico Hydrology API Error:', proximityData.error);
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
      
      console.log(`✅ Fetched ${allFeatures.length} total Puerto Rico Hydrology features for proximity`);
      
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
            const name = attributes.NAME || attributes.name || attributes.Name || null;
            const tipo = attributes.TIPO || attributes.tipo || attributes.Tipo || null;
            const type = attributes.Type || attributes.type || null;
            const shapeLength = attributes.Shape__Length || attributes.Shape_Length || attributes.shapeLength || attributes.shape_length || null;
            
            // Check for duplicates using FID
            const alreadyAdded = results.some(r => r.fid !== null && fid !== null && r.fid === fid);
            
            if (!alreadyAdded) {
              results.push({
                fid: fid,
                name: name,
                tipo: tipo,
                type: type,
                shapeLength: shapeLength,
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
      
      console.log(`✅ Found ${results.length} Puerto Rico Hydrology feature(s) within ${maxRadius} miles`);
    } catch (error) {
      console.error('❌ Proximity query failed for Puerto Rico Hydrology:', error);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error querying Puerto Rico Hydrology data:', error);
    return [];
  }
}

