/**
 * SC Scenic Rivers Adapter
 * Queries SC Scenic Rivers polylines from ArcGIS FeatureServer
 * Supports proximity queries up to 50 miles
 * Layer: SC_Scenic_Rivers_WRR (Layer 0) - Polylines
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/acgZYxoN5Oj8pDLa/ArcGIS/rest/services/SC_Scenic_Rivers_WRR/FeatureServer';
const LAYER_ID = 0;

export interface SCScenicRiverInfo {
  objectid: number | null;
  name: string | null;
  dnrMiles: number | null;
  dateEst: string | null;
  riverCons: string | null;
  description: string | null;
  attributes: Record<string, any>;
  geometry: any;
  distance_miles?: number;
}

/**
 * Calculate distance from a point to a polyline segment
 */
function distanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  let minDistance = Infinity;
  
  paths.forEach((path: number[][]) => {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      if (p1.length >= 2 && p2.length >= 2) {
        const lon1 = p1[0];
        const lat1 = p1[1];
        const lon2 = p2[0];
        const lat2 = p2[1];
        
        // Calculate distance from point to line segment
        const A = lon - lon1;
        const B = lat - lat1;
        const C = lon2 - lon1;
        const D = lat2 - lat1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
          param = dot / lenSq;
        }
        
        let xx: number, yy: number;
        
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
        
        const dx = lon - xx;
        const dy = lat - yy;
        const R = 3959; // Earth's radius in miles
        const dLat = dy * Math.PI / 180;
        const dLon = dx * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(yy * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        if (distance < minDistance) {
          minDistance = distance;
        }
      }
    }
  });
  
  return minDistance === Infinity ? 0 : minDistance;
}

/**
 * Query SC Scenic Rivers for proximity
 * Supports proximity queries up to 50 miles
 */
export async function getSCScenicRiversData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<SCScenicRiverInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;
    
    if (maxRadius <= 0) {
      return [];
    }
    
    const results: SCScenicRiverInfo[] = [];
    const processedIds = new Set<number>();
    
    // Proximity query with pagination
    try {
      const radiusMeters = maxRadius * 1609.34;
      const proximityGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const allFeatures: any[] = [];
      let resultOffset = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const proximityUrl = `${BASE_SERVICE_URL}/${LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        
        if (resultOffset === 0) {
          console.log(`🌊 Querying SC Scenic Rivers for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
        }
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityData.error) {
          console.error('❌ SC Scenic Rivers API Error:', proximityData.error);
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
      
      console.log(`✅ Fetched ${allFeatures.length} total SC Scenic River features for proximity`);
      
      // Process all features and calculate accurate distances
      allFeatures.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || {};
        const paths = geometry.paths || [];
        
        if (paths.length === 0) {
          return;
        }
        
        // Calculate distance from point to polyline
        const distance = distanceToPolyline(lat, lon, paths);
        
        // Only include features within the specified radius
        if (distance <= maxRadius) {
          const objectid = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID : null;
          
          // Skip duplicates
          if (objectid !== null && processedIds.has(objectid)) {
            return;
          }
          
          const name = attributes.NAME || attributes.Name || attributes.name || null;
          const dnrMiles = attributes.DNR_miles !== null && attributes.DNR_miles !== undefined ? attributes.DNR_miles : (attributes.DNR_Miles !== null && attributes.DNR_Miles !== undefined ? attributes.DNR_Miles : null);
          const dateEst = attributes.date_est || attributes.Date_Est || attributes.DATE_EST || null;
          const riverCons = attributes.river_cons || attributes.River_Cons || attributes.RIVER_CONS || null;
          const description = attributes.Description || attributes.description || attributes.DESCRIPTION || null;
          
          results.push({
            objectid: objectid,
            name: name,
            dnrMiles: dnrMiles,
            dateEst: dateEst,
            riverCons: riverCons,
            description: description,
            attributes: attributes,
            geometry: geometry,
            distance_miles: distance
          });
          
          if (objectid !== null) {
            processedIds.add(objectid);
          }
        }
      });
      
      // Sort by distance
      results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
      
      console.log(`✅ Found ${results.length} SC Scenic River(s) within ${maxRadius} miles`);
    } catch (error) {
      console.error('❌ Proximity query failed for SC Scenic Rivers:', error);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error querying SC Scenic Rivers data:', error);
    return [];
  }
}

