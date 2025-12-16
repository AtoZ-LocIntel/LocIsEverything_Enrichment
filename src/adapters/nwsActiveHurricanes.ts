import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Active_Hurricanes_v1/FeatureServer';

export interface NWSActiveHurricaneInfo {
  objectId: number;
  attributes: Record<string, any>;
  geometry: any; // ESRI geometry (polygon, polyline, or point)
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
 * Calculate distance from point to nearest edge of polygon or point
 */
function distanceToGeometry(lat: number, lon: number, geometry: any): number {
  if (!geometry) return Infinity;
  
  // Point geometry
  if (geometry.x !== undefined && geometry.y !== undefined) {
    const pointLon = geometry.x;
    const pointLat = geometry.y;
    
    // Check if coordinates are in Web Mercator
    const isWebMercator = Math.abs(pointLon) > 180 || Math.abs(pointLat) > 90;
    let wgs84Lat = pointLat;
    let wgs84Lon = pointLon;
    
    if (isWebMercator) {
      wgs84Lon = (pointLon / 20037508.34) * 180;
      let mercLat = (pointLat / 20037508.34) * 180;
      wgs84Lat = 180 / Math.PI * (2 * Math.atan(Math.exp(mercLat * Math.PI / 180)) - Math.PI / 2);
    }
    
    return haversineDistance(lat, lon, wgs84Lat, wgs84Lon);
  }
  
  // Polygon geometry
  if (geometry.rings) {
    const rings = geometry.rings;
    if (rings && rings.length > 0) {
      // Check if coordinates are in Web Mercator or WGS84
      const firstCoord = rings[0]?.[0];
      const isWebMercator = firstCoord && (Math.abs(firstCoord[0]) > 180 || Math.abs(firstCoord[1]) > 90);
      
      const ringsWGS84 = rings.map((ring: number[][]) => 
        ring.map((coord: number[]) => {
          if (isWebMercator) {
            const lon_merc = (coord[0] / 20037508.34) * 180;
            let lat_merc = (coord[1] / 20037508.34) * 180;
            lat_merc = 180 / Math.PI * (2 * Math.atan(Math.exp(lat_merc * Math.PI / 180)) - Math.PI / 2);
            return [lon_merc, lat_merc];
          } else {
            return [coord[0], coord[1]];
          }
        })
      );
      
      if (pointInPolygon(lat, lon, ringsWGS84)) {
        return 0;
      }
      
      // Calculate distance to nearest edge
      let minDistance = Infinity;
      for (const ring of ringsWGS84) {
        for (let i = 0; i < ring.length; i++) {
          const p1 = ring[i];
          const p2 = ring[(i + 1) % ring.length];
          const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
          if (dist < minDistance) {
            minDistance = dist;
          }
        }
      }
      return minDistance;
    }
  }
  
  // Polyline geometry
  if (geometry.paths) {
    const paths = geometry.paths;
    if (paths && paths.length > 0) {
      const firstCoord = paths[0]?.[0];
      const isWebMercator = firstCoord && (Math.abs(firstCoord[0]) > 180 || Math.abs(firstCoord[1]) > 90);
      
      let minDistance = Infinity;
      for (const path of paths) {
        for (let i = 0; i < path.length - 1; i++) {
          const coord1 = path[i];
          const coord2 = path[i + 1];
          
          let lat1 = coord1[1];
          let lon1 = coord1[0];
          let lat2 = coord2[1];
          let lon2 = coord2[0];
          
          if (isWebMercator) {
            lon1 = (coord1[0] / 20037508.34) * 180;
            let mercLat1 = (coord1[1] / 20037508.34) * 180;
            lat1 = 180 / Math.PI * (2 * Math.atan(Math.exp(mercLat1 * Math.PI / 180)) - Math.PI / 2);
            
            lon2 = (coord2[0] / 20037508.34) * 180;
            let mercLat2 = (coord2[1] / 20037508.34) * 180;
            lat2 = 180 / Math.PI * (2 * Math.atan(Math.exp(mercLat2 * Math.PI / 180)) - Math.PI / 2);
          }
          
          const dist = distanceToLineSegment(lat, lon, lat1, lon1, lat2, lon2);
          if (dist < minDistance) {
            minDistance = dist;
          }
        }
      }
      return minDistance;
    }
  }
  
  return Infinity;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
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
  return Math.sqrt(dx * dx + dy * dy) * 69; // Convert to miles (rough approximation)
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
 * Query NWS Active Hurricanes for point-in-polygon and proximity
 * Supports proximity queries up to 100 miles
 */
export async function getNWSActiveHurricanesData(
  lat: number,
  lon: number,
  layerId: number,
  layerName: string,
  radiusMiles?: number
): Promise<NWSActiveHurricaneInfo[]> {
  try {
    // Cap radius at 100 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 100.0) : 100.0;
    
    const results: NWSActiveHurricaneInfo[] = [];
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
      
      console.log(`🌀 Querying NWS ${layerName} (Layer ${layerId}) for point-in-polygon at [${lat}, ${lon}]`);
      
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
              // Polygon geometry
              const firstCoord = geom.rings[0]?.[0];
              const isWebMercator = firstCoord && (Math.abs(firstCoord[0]) > 180 || Math.abs(firstCoord[1]) > 90);
              
              const ringsWGS84 = geom.rings.map((ring: number[][]) => 
                ring.map((coord: number[]) => {
                  if (isWebMercator) {
                    const lon_merc = (coord[0] / 20037508.34) * 180;
                    let lat_merc = (coord[1] / 20037508.34) * 180;
                    lat_merc = 180 / Math.PI * (2 * Math.atan(Math.exp(lat_merc * Math.PI / 180)) - Math.PI / 2);
                    return [lon_merc, lat_merc];
                  } else {
                    return [coord[0], coord[1]];
                  }
                })
              );
              isContaining = pointInPolygon(lat, lon, ringsWGS84);
              centroid = calculateCentroid(ringsWGS84);
            } else if (geom.x !== undefined && geom.y !== undefined) {
              // Point geometry - check if it's the same point
              const pointLon = geom.x;
              const pointLat = geom.y;
              const isWebMercator = Math.abs(pointLon) > 180 || Math.abs(pointLat) > 90;
              
              let wgs84Lat = pointLat;
              let wgs84Lon = pointLon;
              if (isWebMercator) {
                wgs84Lon = (pointLon / 20037508.34) * 180;
                let mercLat = (pointLat / 20037508.34) * 180;
                wgs84Lat = 180 / Math.PI * (2 * Math.atan(Math.exp(mercLat * Math.PI / 180)) - Math.PI / 2);
              }
              
              // Consider point as containing if very close (within 0.01 miles)
              const dist = haversineDistance(lat, lon, wgs84Lat, wgs84Lon);
              isContaining = dist < 0.01;
              if (isContaining) {
                centroid = { lat: wgs84Lat, lon: wgs84Lon };
              }
            }
          }
          
          if (isContaining) {
            results.push({
              objectId: attrs.OBJECTID || attrs.objectId || 0,
              attributes: attrs,
              geometry: geom,
              lat: centroid?.lat,
              lon: centroid?.lon,
              containing: true,
              layerId: layerId,
              layerName: layerName
            });
          }
        });
      }
    } catch (error) {
      console.error(`❌ Point-in-polygon query failed for NWS ${layerName}:`, error);
    }
    
    // Proximity query
    if (maxRadius > 0) {
      try {
        const radiusMeters = maxRadius * 1609.34;
        const proximityUrl = `${serviceUrl}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true`;
        
        console.log(`🌀 Querying NWS ${layerName} (Layer ${layerId}) for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityData.error) {
          console.error(`❌ NWS ${layerName} Proximity API Error:`, proximityData.error);
        }
        
        if (!proximityData.error && proximityData.features && proximityData.features.length > 0) {
          console.log(`✅ NWS ${layerName} returned ${proximityData.features.length} feature(s) from proximity query`);
          proximityData.features.forEach((feature: any) => {
            const attrs = feature.attributes || {};
            const geom = feature.geometry;
            
            // Check if already in results (from point-in-polygon)
            const existingIndex = results.findIndex(r => 
              r.objectId === (attrs.OBJECTID || attrs.objectId) && r.containing
            );
            
            if (existingIndex === -1) {
              // Calculate distance
              const distance = distanceToGeometry(lat, lon, geom);
              
              if (distance <= maxRadius) {
                let centroid: { lat: number; lon: number } | null = null;
                
                if (geom) {
                  if (geom.rings) {
                    const firstCoord = geom.rings[0]?.[0];
                    const isWebMercator = firstCoord && (Math.abs(firstCoord[0]) > 180 || Math.abs(firstCoord[1]) > 90);
                    
                    const ringsWGS84 = geom.rings.map((ring: number[][]) => 
                      ring.map((coord: number[]) => {
                        if (isWebMercator) {
                          const lon_merc = (coord[0] / 20037508.34) * 180;
                          let lat_merc = (coord[1] / 20037508.34) * 180;
                          lat_merc = 180 / Math.PI * (2 * Math.atan(Math.exp(lat_merc * Math.PI / 180)) - Math.PI / 2);
                          return [lon_merc, lat_merc];
                        } else {
                          return [coord[0], coord[1]];
                        }
                      })
                    );
                    centroid = calculateCentroid(ringsWGS84);
                  } else if (geom.x !== undefined && geom.y !== undefined) {
                    const pointLon = geom.x;
                    const pointLat = geom.y;
                    const isWebMercator = Math.abs(pointLon) > 180 || Math.abs(pointLat) > 90;
                    
                    if (isWebMercator) {
                      const lon_merc = (pointLon / 20037508.34) * 180;
                      let lat_merc = (pointLat / 20037508.34) * 180;
                      const wgs84Lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat_merc * Math.PI / 180)) - Math.PI / 2);
                      centroid = { lat: wgs84Lat, lon: lon_merc };
                    } else {
                      centroid = { lat: pointLat, lon: pointLon };
                    }
                  }
                }
                
                results.push({
                  objectId: attrs.OBJECTID || attrs.objectId || 0,
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
        }
      } catch (error) {
        console.error(`❌ Proximity query failed for NWS ${layerName}:`, error);
      }
    }
    
    console.log(`✅ Found ${results.length} NWS ${layerName} feature(s) (${results.filter(r => r.containing).length} containing, ${results.filter(r => !r.containing).length} nearby)`);
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying NWS ${layerName} data:`, error);
    return [];
  }
}

