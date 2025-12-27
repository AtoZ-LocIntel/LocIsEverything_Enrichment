/**
 * US Fish and Wildlife Service Critical Habitat Adapter
 * Queries USFWS Critical Habitat polygons from ArcGIS FeatureServer
 * Supports point-in-polygon and proximity queries up to 50 miles
 * Layers:
 *   - Final Critical Habitat Features (Layer 0) - Polygons
 *   - Proposed Critical Habitat Features (Layer 2) - Polygons
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/QVENGdaPbd4LUkLV/arcgis/rest/services/USFWS_Critical_Habitat/FeatureServer';

export interface USFWSCriticalHabitatInfo {
  objectid: number | null;
  speciesName: string | null;
  commonName: string | null;
  status: string | null; // Final or Proposed
  geometry?: any; // ESRI polygon geometry (rings)
  distance_miles?: number;
  isContaining?: boolean;
  attributes: Record<string, any>;
}

/**
 * Calculate distance from point to polygon (minimum distance to any vertex or edge)
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  rings.forEach((ring: number[][]) => {
    // Check distance to each vertex
    ring.forEach((coord: number[]) => {
      // ESRI coordinates are [lon, lat] format
      const ringLat = coord[1];
      const ringLon = coord[0];
      
      const R = 3959; // Earth's radius in miles
      const dLat = (ringLat - lat) * Math.PI / 180;
      const dLon = (ringLon - lon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(ringLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      if (distance < minDistance) minDistance = distance;
    });
    
    // Check distance to each edge
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
      if (dist < minDistance) minDistance = dist;
    }
  });
  
  return minDistance;
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
 * Point-in-polygon check using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  const outerRing = rings[0];
  if (!outerRing || outerRing.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0]; // lon
    const yi = outerRing[i][1]; // lat
    const xj = outerRing[j][0]; // lon
    const yj = outerRing[j][1]; // lat
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  // Check if point is in any holes
  for (let h = 1; h < rings.length; h++) {
    const hole = rings[h];
    if (!hole || hole.length < 3) continue;
    
    let inHole = false;
    for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
      const xi = hole[i][0];
      const yi = hole[i][1];
      const xj = hole[j][0];
      const yj = hole[j][1];
      
      const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inHole = !inHole;
    }
    
    if (inHole) {
      inside = false; // Point is in a hole, so not inside polygon
      break;
    }
  }
  
  return inside;
}

/**
 * Query USFWS Critical Habitat for point-in-polygon and proximity
 * Supports proximity queries up to 50 miles
 */
export async function getUSFWSCriticalHabitatData(
  layerId: number,
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<USFWSCriticalHabitatInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;
    
    if (maxRadius <= 0) {
      return [];
    }
    
    const results: USFWSCriticalHabitatInfo[] = [];
    const processedIds = new Set<number>();
    
    // Point-in-polygon query
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pipUrl = `${BASE_SERVICE_URL}/${layerId}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🦅 Querying USFWS Critical Habitat (Layer ${layerId}) for point-in-polygon at [${lat}, ${lon}]`);
      
      const pipData = await fetchJSONSmart(pipUrl) as any;
      
      if (pipData.error) {
        console.error('❌ USFWS Critical Habitat API Error:', pipData.error);
      } else if (pipData.features && pipData.features.length > 0) {
        pipData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || {};
          const rings = geometry.rings || [];
          
          if (rings.length > 0) {
            const objectid = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID : null;
            
            if (objectid !== null && !processedIds.has(objectid)) {
              const speciesName = attributes.SCIENTIFIC_NAME || attributes.scientific_name || attributes.ScientificName || null;
              const commonName = attributes.COMMON_NAME || attributes.common_name || attributes.CommonName || null;
              const status = layerId === 0 ? 'Final' : 'Proposed';
              
              results.push({
                objectid: objectid,
                speciesName: speciesName,
                commonName: commonName,
                status: status,
                geometry: geometry,
                distance_miles: 0,
                isContaining: true,
                attributes: attributes
              });
              
              processedIds.add(objectid);
            }
          }
        });
        
        console.log(`✅ Found ${results.length} USFWS Critical Habitat feature(s) containing the point`);
      }
    } catch (error) {
      console.error('❌ Point-in-polygon query failed for USFWS Critical Habitat:', error);
    }
    
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
      const batchSize = 2000;
      let hasMore = true;
      
      while (hasMore) {
        const proximityUrl = `${BASE_SERVICE_URL}/${layerId}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        
        if (resultOffset === 0) {
          console.log(`🦅 Querying USFWS Critical Habitat (Layer ${layerId}) for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
        }
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityData.error) {
          console.error('❌ USFWS Critical Habitat API Error:', proximityData.error);
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
      
      console.log(`✅ Fetched ${allFeatures.length} total USFWS Critical Habitat features for proximity`);
      
      // Process all features and calculate accurate distances
      allFeatures.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || {};
        const rings = geometry.rings || [];
        
        if (rings.length > 0) {
          const objectid = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID : null;
          
          // Skip if already processed (point-in-polygon result)
          if (objectid !== null && processedIds.has(objectid)) {
            return;
          }
          
          // Calculate accurate distance from point to polygon
          const distance = distanceToPolygon(lat, lon, rings);
          
          // Only include features within the specified radius
          if (distance <= maxRadius) {
            const speciesName = attributes.SCIENTIFIC_NAME || attributes.scientific_name || attributes.ScientificName || null;
            const commonName = attributes.COMMON_NAME || attributes.common_name || attributes.CommonName || null;
            const status = layerId === 0 ? 'Final' : 'Proposed';
            
            // Check if point is inside polygon
            const isContaining = pointInPolygon(lat, lon, rings);
            
            results.push({
              objectid: objectid,
              speciesName: speciesName,
              commonName: commonName,
              status: status,
              geometry: geometry,
              distance_miles: distance,
              isContaining: isContaining,
              attributes: attributes
            });
            
            if (objectid !== null) {
              processedIds.add(objectid);
            }
          }
        }
      });
      
      // Sort by distance (containing polygons first, then by distance)
      results.sort((a, b) => {
        if (a.isContaining && !b.isContaining) return -1;
        if (!a.isContaining && b.isContaining) return 1;
        return (a.distance_miles || 0) - (b.distance_miles || 0);
      });
      
      console.log(`✅ Found ${results.length} USFWS Critical Habitat feature(s) within ${maxRadius} miles`);
    } catch (error) {
      console.error('❌ Proximity query failed for USFWS Critical Habitat:', error);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error querying USFWS Critical Habitat data:', error);
    return [];
  }
}

