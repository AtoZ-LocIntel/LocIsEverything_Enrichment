import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer';

export interface NWSWatchesWarningsInfo {
  objectId: number;
  attributes: Record<string, any>;
  geometry: any; // ESRI geometry (polygon or point)
  lat?: number;
  lon?: number;
  distance?: number;
  containing?: boolean; // True if point is within polygon/at point
  layerId: number;
  layerName: string;
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
  
  // Check if point is inside polygon
  if (pointInPolygon(lat, lon, rings)) {
    return 0;
  }
  
  // Calculate distance to nearest edge
  let minDistance = Infinity;
  const outerRing = rings[0];
  
  for (let i = 0; i < outerRing.length; i++) {
    const j = (i + 1) % outerRing.length;
    const x1 = outerRing[i][0];
    const y1 = outerRing[i][1];
    const x2 = outerRing[j][0];
    const y2 = outerRing[j][1];
    
    const dist = distanceToLineSegment(lon, lat, x1, y1, x2, y2);
    if (dist < minDistance) {
      minDistance = dist;
    }
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
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  
  if (lengthSquared === 0) {
    // Line segment is a point
    const dx2 = px - x1;
    const dy2 = py - y1;
    return Math.sqrt(dx2 * dx2 + dy2 * dy2) * 69; // Convert to miles (approximate)
  }
  
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  
  const dx2 = px - projX;
  const dy2 = py - projY;
  const distanceDegrees = Math.sqrt(dx2 * dx2 + dy2 * dy2);
  
  // Convert degrees to miles (approximate at this latitude)
  return distanceDegrees * 69;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate polygon centroid
 */
function calculateCentroid(rings: number[][][]): { lat: number; lon: number } | null {
  if (!rings || rings.length === 0) return null;
  
  const outerRing = rings[0];
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  
  for (const coord of outerRing) {
    if (coord && coord.length >= 2) {
      sumLon += coord[0];
      sumLat += coord[1];
      count++;
    }
  }
  
  if (count === 0) return null;
  
  return {
    lat: sumLat / count,
    lon: sumLon / count
  };
}

/**
 * Convert Web Mercator (3857) to WGS84 (4326)
 */
function webMercatorToWGS84(x: number, y: number): { lat: number; lon: number } {
  const lon = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
  return { lat, lon };
}

/**
 * Query NWS Watches and Warnings for point-in-polygon and proximity
 * Supports proximity queries up to 100 miles
 */
export async function getNWSWatchesWarningsData(
  lat: number,
  lon: number,
  layerId: number,
  layerName: string,
  radiusMiles?: number
): Promise<NWSWatchesWarningsInfo[]> {
  try {
    // Cap radius at 100 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 100.0) : 100.0;
    
    const results: NWSWatchesWarningsInfo[] = [];
    const serviceUrl = `${BASE_SERVICE_URL}/${layerId}`;
    
    // Use WGS84 directly - ArcGIS services handle conversion server-side
    const pointGeometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    // Point-in-polygon query first
    try {
      const pointInPolyUrl = `${serviceUrl}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🌦️ Querying NWS ${layerName} (Layer ${layerId}) for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 NWS Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      if (pointInPolyData.error) {
        console.error(`❌ NWS ${layerName} Point-in-Polygon API Error:`, pointInPolyData.error);
      }
      
      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        console.log(`✅ NWS ${layerName} returned ${pointInPolyData.features.length} feature(s) from point-in-polygon query`);
        pointInPolyData.features.forEach((feature: any) => {
          const attrs = feature.attributes || {};
          const geom = feature.geometry;
          
          let isContaining = false;
          let centroid: { lat: number; lon: number } | null = null;
          
          if (geom) {
            if (geom.rings) {
              // Polygon geometry - check if point is inside
              // Check if coordinates are in Web Mercator (large values) or WGS84
              const firstCoord = geom.rings[0]?.[0];
              const isWebMercator = firstCoord && (Math.abs(firstCoord[0]) > 180 || Math.abs(firstCoord[1]) > 90);
              
              const ringsWGS84 = geom.rings.map((ring: number[][]) => 
                ring.map((coord: number[]) => {
                  if (isWebMercator) {
                    // Convert from Web Mercator to WGS84
                    const wgs84 = webMercatorToWGS84(coord[0], coord[1]);
                    return [wgs84.lon, wgs84.lat];
                  } else {
                    // Already in WGS84 - ESRI format is [lon, lat]
                    return [coord[0], coord[1]];
                  }
                })
              );
              isContaining = pointInPolygon(lat, lon, ringsWGS84);
              centroid = calculateCentroid(ringsWGS84);
            } else if (geom.x !== undefined && geom.y !== undefined) {
              // Point geometry - check if it's the same point
              // Check if coordinates are in Web Mercator (large values) or WGS84
              const isWebMercator = Math.abs(geom.x) > 180 || Math.abs(geom.y) > 90;
              let pointWGS84;
              if (isWebMercator) {
                pointWGS84 = webMercatorToWGS84(geom.x, geom.y);
              } else {
                // Already in WGS84 - ESRI format is x=lon, y=lat
                pointWGS84 = { lat: geom.y, lon: geom.x };
              }
              const distance = haversineDistance(lat, lon, pointWGS84.lat, pointWGS84.lon);
              isContaining = distance < 0.01; // Within ~50 feet
              centroid = pointWGS84;
            }
          }
          
          if (isContaining) {
            results.push({
              objectId: attrs.OBJECTID || attrs.objectId || 0,
              attributes: attrs,
              geometry: geom,
              lat: centroid?.lat,
              lon: centroid?.lon,
              distance: 0,
              containing: true,
              layerId: layerId,
              layerName: layerName
            });
          }
        });
        
        console.log(`✅ Found ${results.length} NWS ${layerName} feature(s) containing the point`);
      }
    } catch (error) {
      console.error(`❌ Point-in-polygon query failed for ${layerName}:`, error);
    }
    
    // Proximity query (if radius is provided)
    if (maxRadius > 0) {
      try {
        const radiusMeters = maxRadius * 1609.34;
        
        const allFeatures: any[] = [];
        let resultOffset = 0;
        const batchSize = 2000;
        let hasMore = true;
        
        while (hasMore) {
          const proximityUrl = `${serviceUrl}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
          
          if (resultOffset === 0) {
            console.log(`🌦️ Querying NWS ${layerName} (Layer ${layerId}) for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
            console.log(`🔗 NWS Proximity Query URL: ${proximityUrl}`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error(`❌ NWS ${layerName} Proximity API Error:`, proximityData.error);
            break;
          }
          
          if (resultOffset === 0 && proximityData.features) {
            console.log(`✅ NWS ${layerName} returned ${proximityData.features.length} feature(s) from proximity query`);
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
        
        console.log(`✅ Fetched ${allFeatures.length} total NWS ${layerName} features for proximity`);
        
        // Process proximity features
        allFeatures.forEach((feature: any) => {
          const attrs = feature.attributes || {};
          const objectId = attrs.OBJECTID || attrs.objectId || 0;
          const alreadyAdded = results.some(r => r.objectId === objectId && r.containing && r.layerId === layerId);
          
          if (!alreadyAdded) {
            const geom = feature.geometry;
            let distance = Infinity;
            let centroid: { lat: number; lon: number } | null = null;
            
            if (geom) {
              if (geom.rings) {
                // Polygon geometry
                // Check if coordinates look like Web Mercator
                const firstCoord = geom.rings[0]?.[0];
                const isWebMercator = firstCoord && (Math.abs(firstCoord[0]) > 180 || Math.abs(firstCoord[1]) > 90);
                
                const ringsWGS84 = geom.rings.map((ring: number[][]) => 
                  ring.map((coord: number[]) => {
                    if (isWebMercator) {
                      // Convert from Web Mercator to WGS84
                      const wgs84 = webMercatorToWGS84(coord[0], coord[1]);
                      return [wgs84.lon, wgs84.lat];
                    } else {
                      // Already in WGS84
                      return [coord[0], coord[1]];
                    }
                  })
                );
                distance = distanceToPolygon(lat, lon, ringsWGS84);
                centroid = calculateCentroid(ringsWGS84);
              } else if (geom.x !== undefined && geom.y !== undefined) {
                // Point geometry
                // Check if coordinates look like Web Mercator
                const isWebMercator = Math.abs(geom.x) > 180 || Math.abs(geom.y) > 90;
                let pointWGS84;
                if (isWebMercator) {
                  pointWGS84 = webMercatorToWGS84(geom.x, geom.y);
                } else {
                  pointWGS84 = { lat: geom.y, lon: geom.x };
                }
                distance = haversineDistance(lat, lon, pointWGS84.lat, pointWGS84.lon);
                centroid = pointWGS84;
              }
            }
            
            if (distance <= maxRadius) {
              results.push({
                objectId: objectId,
                attributes: attrs,
                geometry: geom,
                lat: centroid?.lat,
                lon: centroid?.lon,
                distance: distance,
                containing: false,
                layerId: layerId,
                layerName: layerName
              });
            }
          }
        });
        
        console.log(`✅ Found ${results.filter(r => !r.containing).length} NWS ${layerName} feature(s) within ${maxRadius} miles`);
      } catch (error) {
        console.error(`❌ Proximity query failed for ${layerName}:`, error);
      }
    }
    
    // Sort by containing first, then by distance
    results.sort((a, b) => {
      if (a.containing && !b.containing) return -1;
      if (!a.containing && b.containing) return 1;
      return (a.distance || 0) - (b.distance || 0);
    });
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying NWS ${layerName} data:`, error);
    return [];
  }
}

