/**
 * Guam Villages Adapter
 * Queries Guam Villages from ArcGIS FeatureServer
 * Supports point-in-polygon and proximity queries up to 10 miles
 * Layers:
 * - Layer 57: GuamVillages_ExportFeatures (villages)
 * - Layer 58: StateBoundary__ExportFeature (state boundary)
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/Guam_Villages/FeatureServer';
const VILLAGES_LAYER_ID = 57;
const STATE_BOUNDARY_LAYER_ID = 58;

export interface GuamVillageInfo {
  attributes: Record<string, any>;
  geometry?: any;
  isContaining?: boolean; // For point-in-polygon queries
  distance_miles?: number; // For proximity queries
}

export interface GuamStateBoundaryInfo {
  attributes: Record<string, any>;
  geometry?: any;
  isContaining?: boolean; // For point-in-polygon queries
  distance_miles?: number; // For proximity queries
}

/**
 * Calculate distance from point to polygon (minimum distance to any point on polygon boundary)
 */
function distanceToPolygon(
  px: number, py: number,
  rings: number[][][]
): number {
  let minDistance = Infinity;
  
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      
      // Calculate distance to line segment
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lengthSquared = dx * dx + dy * dy;
      
      if (lengthSquared === 0) {
        // Point to point distance
        const dist = Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        minDistance = Math.min(minDistance, dist);
      } else {
        // Point to line segment distance
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        const dist = Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
        minDistance = Math.min(minDistance, dist);
      }
    }
  }
  
  // Convert degrees to miles (approximate: 1 degree ≈ 69 miles at equator)
  // More accurate: use Haversine for each segment, but this approximation is sufficient
  const latRad = py * Math.PI / 180;
  const milesPerDegreeLat = 69;
  const milesPerDegreeLon = 69 * Math.cos(latRad);
  
  return minDistance * Math.sqrt(milesPerDegreeLat * milesPerDegreeLat + milesPerDegreeLon * milesPerDegreeLon);
}

/**
 * Query Guam Villages for point-in-polygon and proximity
 * Supports proximity queries up to 10 miles
 */
export async function getGuamVillagesData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<GuamVillageInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 10 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 10.0) : 10.0;
    
    const results: GuamVillageInfo[] = [];
    
    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pointInPolyUrl = `${BASE_SERVICE_URL}/${VILLAGES_LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🏝️ Querying Guam Villages for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 Guam Villages Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      if (!pointInPolyData.error && pointInPolyData.features &&
          Array.isArray(pointInPolyData.features) && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          results.push({
            attributes: feature.attributes || {},
            geometry: feature.geometry,
            isContaining: true,
            distance_miles: 0
          });
        });
      }
    } catch (error) {
      console.error('Error in point-in-polygon query for Guam Villages:', error);
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
          const proximityUrl = `${BASE_SERVICE_URL}/${VILLAGES_LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
          
          if (resultOffset === 0) {
            console.log(`🏝️ Querying Guam Villages for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error('❌ Guam Villages API Error:', proximityData.error);
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
        
        console.log(`✅ Fetched ${allFeatures.length} total Guam Villages for proximity`);
        
        // Process proximity features
        allFeatures.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || {};
          const rings = geometry.rings || [];
          
          // Skip if already in results (from point-in-polygon query)
          const objectId = attributes.OBJECTID || attributes.FID || attributes.fid || null;
          const existingIndex = results.findIndex(r => {
            const rObjectId = r.attributes.OBJECTID || r.attributes.FID || r.attributes.fid || null;
            return rObjectId !== null && objectId !== null && rObjectId === objectId;
          });
          if (existingIndex >= 0) {
            return; // Already added from point-in-polygon query
          }
          
          if (rings.length > 0) {
            const distance = distanceToPolygon(lon, lat, rings);
            
            results.push({
              attributes: attributes,
              geometry: geometry,
              isContaining: false,
              distance_miles: distance
            });
          }
        });
        
        console.log(`✅ Found ${results.length} total Guam Village(s) (${results.filter(r => r.isContaining).length} containing, ${results.filter(r => !r.isContaining).length} nearby)`);
      } catch (error) {
        console.error(`❌ Proximity query failed:`, error);
      }
    }
    
    console.log(`✅ Found ${results.length} Guam Village(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying Guam Villages:', error);
    return [];
  }
}

/**
 * Query Guam State Boundary for point-in-polygon and proximity
 * Supports proximity queries up to 10 miles
 */
export async function getGuamStateBoundaryData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<GuamStateBoundaryInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 10 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 10.0) : 10.0;
    
    const results: GuamStateBoundaryInfo[] = [];
    
    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pointInPolyUrl = `${BASE_SERVICE_URL}/${STATE_BOUNDARY_LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🏝️ Querying Guam State Boundary for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 Guam State Boundary Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      if (!pointInPolyData.error && pointInPolyData.features &&
          Array.isArray(pointInPolyData.features) && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          results.push({
            attributes: feature.attributes || {},
            geometry: feature.geometry,
            isContaining: true,
            distance_miles: 0
          });
        });
      }
    } catch (error) {
      console.error('Error in point-in-polygon query for Guam State Boundary:', error);
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
          const proximityUrl = `${BASE_SERVICE_URL}/${STATE_BOUNDARY_LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
          
          if (resultOffset === 0) {
            console.log(`🏝️ Querying Guam State Boundary for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error('❌ Guam State Boundary API Error:', proximityData.error);
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
        
        console.log(`✅ Fetched ${allFeatures.length} total Guam State Boundary features for proximity`);
        
        // Process proximity features
        allFeatures.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || {};
          const rings = geometry.rings || [];
          
          // Skip if already in results (from point-in-polygon query)
          const objectId = attributes.OBJECTID || attributes.FID || attributes.fid || null;
          const existingIndex = results.findIndex(r => {
            const rObjectId = r.attributes.OBJECTID || r.attributes.FID || r.attributes.fid || null;
            return rObjectId !== null && objectId !== null && rObjectId === objectId;
          });
          if (existingIndex >= 0) {
            return; // Already added from point-in-polygon query
          }
          
          if (rings.length > 0) {
            const distance = distanceToPolygon(lon, lat, rings);
            
            results.push({
              attributes: attributes,
              geometry: geometry,
              isContaining: false,
              distance_miles: distance
            });
          }
        });
        
        console.log(`✅ Found ${results.length} total Guam State Boundary feature(s) (${results.filter(r => r.isContaining).length} containing, ${results.filter(r => !r.isContaining).length} nearby)`);
      } catch (error) {
        console.error(`❌ Proximity query failed:`, error);
      }
    }
    
    console.log(`✅ Found ${results.length} Guam State Boundary feature(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying Guam State Boundary:', error);
    return [];
  }
}

