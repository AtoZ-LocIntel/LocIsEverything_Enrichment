/**
 * Houston Affordability Adapter
 * Queries Houston Affordability by Census Tract FeatureServer
 * Supports point-in-polygon and proximity queries up to 5 miles
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services.arcgis.com/NummVBqZSIJKUeVR/ArcGIS/rest/services/Affordability/FeatureServer';
const ALL_LAYER_IDS = [0, 1, 2, 3]; // All layers: 0=CITY_LIMIT, 1=ETJ, 2&3=HGACTracts_HTAindex
const TRACT_LAYER_IDS = [2, 3]; // HGACTracts_HTAindex layers (for affordability data)
const BOUNDARY_LAYER_IDS = [0, 1]; // Boundary layers (CITY_LIMIT and ETJ)

export interface HoustonAffordabilityInfo {
  objectId: number;
  tractId: string | null;
  htaIndex: number | null;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // For point-in-polygon queries
  attributes: Record<string, any>;
  [key: string]: any; // For other attributes
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
 * Calculate centroid of a polygon ring
 */
function calculatePolygonCentroid(ring: number[][]): [number, number] {
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  
  for (const coord of ring) {
    if (coord.length >= 2) {
      sumX += coord[0];
      sumY += coord[1];
      count++;
    }
  }
  
  return count > 0 ? [sumX / count, sumY / count] : [0, 0];
}

/**
 * Convert ESRI geometry coordinates to lat/lon
 */
function esriToLatLon(x: number, y: number, spatialRef?: any): [number, number] {
  // If spatial reference is 2278 (Texas State Plane), we need to convert
  // For now, assume coordinates are already in WGS84 or will be converted by the service
  // The service should handle coordinate transformation with inSR/outSR parameters
  if (Math.abs(x) > 180 || Math.abs(y) > 90) {
    // Likely Web Mercator or State Plane - service should convert with outSR=4326
    // Return as-is and let the service handle conversion
    return [y, x];
  }
  return [y, x]; // ESRI uses [x, y] but we need [lat, lon]
}

export interface HoustonAffordabilityData {
  containing: HoustonAffordabilityInfo | null;
  nearby: HoustonAffordabilityInfo[];
  cityLimit: HoustonAffordabilityInfo | null; // Layer 0
  etj: HoustonAffordabilityInfo | null; // Layer 1
}

/**
 * Query Houston Affordability Tracts for point-in-polygon and proximity
 * Supports proximity queries up to 5 miles
 */
export async function getHoustonAffordabilityData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<HoustonAffordabilityData> {
  try {
    console.log(`🏘️ Querying Houston Affordability for [${lat}, ${lon}]${radiusMiles ? ` with radius ${radiusMiles} miles` : ''}`);
    
    const cappedRadius = radiusMiles ? Math.min(radiusMiles, 5.0) : 5.0;
    const results: HoustonAffordabilityInfo[] = [];
    let containingTract: HoustonAffordabilityInfo | null = null;
    let cityLimit: HoustonAffordabilityInfo | null = null;
    let etj: HoustonAffordabilityInfo | null = null;
    
    // Point-in-polygon query for boundary layers (0 and 1)
    for (const layerId of BOUNDARY_LAYER_IDS) {
      try {
        const pointGeometry = {
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        };
        
        const geometryStr = encodeURIComponent(JSON.stringify(pointGeometry));
        const pointInPolyUrl = `${BASE_SERVICE_URL}/${layerId}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
        
        console.log(`🔗 Houston Affordability Layer ${layerId} (Boundary) Point-in-Polygon Query URL: ${pointInPolyUrl}`);
        
        const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
        
        if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
          for (const feature of pointInPolyData.features) {
            const attributes = feature.attributes || {};
            const geometry = feature.geometry;
            
            const boundaryInfo: HoustonAffordabilityInfo = {
              objectId: attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 0,
              tractId: null, // Boundary layers don't have tract IDs
              htaIndex: null, // Boundary layers don't have HTA Index
              geometry,
              isContaining: true,
              distance_miles: 0,
              attributes,
              ...attributes,
              layerType: layerId === 0 ? 'CITY_LIMIT' : 'ETJ'
            };
            
            if (layerId === 0) {
              cityLimit = boundaryInfo;
            } else if (layerId === 1) {
              etj = boundaryInfo;
            }
            results.push(boundaryInfo);
          }
        }
      } catch (error) {
        console.error(`❌ Point-in-polygon query failed for boundary layer ${layerId}:`, error);
      }
    }
    
    // Always query boundary layers (0 and 1) - query all features since there's typically only one of each
    // This ensures boundaries are always shown regardless of point location
    for (const layerId of BOUNDARY_LAYER_IDS) {
      try {
        // Check if we already have this boundary from point-in-polygon
        const existingBoundary = layerId === 0 ? cityLimit : etj;
        if (existingBoundary) {
          console.log(`✅ Houston Affordability Layer ${layerId} (Boundary) already found from point-in-polygon`);
          continue; // Already have it from point-in-polygon
        }
        
        // Query all features from boundary layer (no spatial filter) since there's typically only one boundary
        const allFeaturesUrl = `${BASE_SERVICE_URL}/${layerId}/query?f=json&where=1%3D1&outFields=*&outSR=4326&returnGeometry=true&resultRecordCount=10`;
        
        console.log(`🔗 Houston Affordability Layer ${layerId} (Boundary) Query All Features to get boundary polygon`);
        
        const allFeaturesData = await fetchJSONSmart(allFeaturesUrl) as any;
        
        if (allFeaturesData.error) {
          console.error(`❌ Houston Affordability Layer ${layerId} (Boundary) API Error:`, allFeaturesData.error);
        } else if (!allFeaturesData.features || allFeaturesData.features.length === 0) {
          console.log(`⚠️ Houston Affordability Layer ${layerId} (Boundary) - No features found`);
        } else {
          console.log(`✅ Houston Affordability Layer ${layerId} (Boundary) - Found ${allFeaturesData.features.length} feature(s)`);
          
          // Get the first feature (should be the boundary polygon)
          const feature = allFeaturesData.features[0];
          const attributes = feature.attributes || {};
          const geometry = feature.geometry;
          
          if (!geometry || !geometry.rings) {
            console.warn(`⚠️ Houston Affordability Layer ${layerId} (Boundary) - Feature has no geometry`);
            continue;
          }
          
          // Calculate distance to polygon centroid to determine if point is inside
          let boundaryLat = lat;
          let boundaryLon = lon;
          let distanceMiles = 0;
          let isPointInside = false;
          
          if (geometry.rings && geometry.rings.length > 0) {
            const outerRing = geometry.rings[0];
            if (outerRing && outerRing.length > 0) {
              const centroid = calculatePolygonCentroid(outerRing);
              const [centroidLat, centroidLon] = esriToLatLon(centroid[0], centroid[1], geometry.spatialReference);
              boundaryLat = centroidLat;
              boundaryLon = centroidLon;
              distanceMiles = calculateDistance(lat, lon, boundaryLat, boundaryLon);
              
              // Check if point is inside polygon using point-in-polygon check
              // For now, we'll use the point-in-polygon result if we have it, otherwise assume not inside
              // (The actual point-in-polygon check was done earlier, so if we're here, point is likely outside)
            }
          }
          
          const boundaryInfo: HoustonAffordabilityInfo = {
            objectId: attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 0,
            tractId: null,
            htaIndex: null,
            geometry,
            isContaining: isPointInside,
            distance_miles: Number(distanceMiles.toFixed(2)),
            attributes,
            ...attributes,
            layerType: layerId === 0 ? 'CITY_LIMIT' : 'ETJ'
          };
          
          if (layerId === 0) {
            cityLimit = boundaryInfo;
            console.log(`✅ Houston Affordability Layer 0 (CITY_LIMIT) - Added to results`);
          } else if (layerId === 1) {
            etj = boundaryInfo;
            console.log(`✅ Houston Affordability Layer 1 (ETJ) - Added to results`);
          }
          results.push(boundaryInfo);
        }
      } catch (error) {
        console.error(`❌ Query failed for boundary layer ${layerId}:`, error);
      }
    }
    
    // Point-in-polygon query for tract layers (2 and 3)
    for (const layerId of TRACT_LAYER_IDS) {
      try {
        const pointGeometry = {
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        };
        
        const geometryStr = encodeURIComponent(JSON.stringify(pointGeometry));
        const pointInPolyUrl = `${BASE_SERVICE_URL}/${layerId}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
        
        console.log(`🔗 Houston Affordability Layer ${layerId} Point-in-Polygon Query URL: ${pointInPolyUrl}`);
        
        const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
        
        if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
          for (const feature of pointInPolyData.features) {
            const attributes = feature.attributes || {};
            const geometry = feature.geometry;
            
            const tractInfo: HoustonAffordabilityInfo = {
              objectId: attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 0,
              tractId: attributes.TRACT || attributes.tract || attributes.TRACTCE || attributes.tractce || null,
              htaIndex: attributes.HTA_INDEX !== null && attributes.HTA_INDEX !== undefined 
                ? parseFloat(attributes.HTA_INDEX.toString())
                : (attributes.hta_index !== null && attributes.hta_index !== undefined
                   ? parseFloat(attributes.hta_index.toString())
                   : null),
              geometry,
              isContaining: true,
              distance_miles: 0,
              attributes,
              ...attributes
            };
            
            if (!containingTract) {
              containingTract = tractInfo;
            }
            results.push(tractInfo);
          }
        }
      } catch (error) {
        console.error(`❌ Point-in-polygon query failed for layer ${layerId}:`, error);
      }
    }
    
    // Proximity query (if radius is provided)
    if (cappedRadius > 0) {
      for (const layerId of TRACT_LAYER_IDS) {
        try {
          const radiusMeters = cappedRadius * 1609.34;
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
            const geometryStr = encodeURIComponent(JSON.stringify(proximityGeometry));
            const proximityUrl = `${BASE_SERVICE_URL}/${layerId}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
            
            if (resultOffset === 0) {
              console.log(`🔗 Houston Affordability Layer ${layerId} Proximity Query (${cappedRadius} miles) at [${lat}, ${lon}]`);
            }
            
            const proximityData = await fetchJSONSmart(proximityUrl) as any;
            
            if (proximityData.error) {
              console.error(`❌ Houston Affordability Layer ${layerId} API Error:`, proximityData.error);
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
          
          console.log(`✅ Fetched ${allFeatures.length} total Houston Affordability tracts for proximity from layer ${layerId}`);
          
          // Process proximity features
          for (const feature of allFeatures) {
            const attributes = feature.attributes || {};
            const geometry = feature.geometry;
            
            // Skip if this is already in results (from point-in-polygon)
            const existingIndex = results.findIndex(r => 
              r.objectId === (attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 0)
            );
            
            if (existingIndex >= 0) {
              continue; // Already have this tract
            }
            
            // Calculate distance to polygon centroid
            let tractLat = lat;
            let tractLon = lon;
            let distanceMiles = cappedRadius;
            
            if (geometry && geometry.rings && geometry.rings.length > 0) {
              const outerRing = geometry.rings[0];
              if (outerRing && outerRing.length > 0) {
                const centroid = calculatePolygonCentroid(outerRing);
                // Convert if needed (service should return in WGS84 with outSR=4326)
                const [centroidLat, centroidLon] = esriToLatLon(centroid[0], centroid[1], geometry.spatialReference);
                tractLat = centroidLat;
                tractLon = centroidLon;
                distanceMiles = calculateDistance(lat, lon, tractLat, tractLon);
              }
            }
            
            // Only include if within radius
            if (distanceMiles <= cappedRadius) {
              const tractInfo: HoustonAffordabilityInfo = {
                objectId: attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 0,
                tractId: attributes.TRACT || attributes.tract || attributes.TRACTCE || attributes.tractce || null,
                htaIndex: attributes.HTA_INDEX !== null && attributes.HTA_INDEX !== undefined 
                  ? parseFloat(attributes.HTA_INDEX.toString())
                  : (attributes.hta_index !== null && attributes.hta_index !== undefined
                     ? parseFloat(attributes.hta_index.toString())
                     : null),
                geometry,
                isContaining: false,
                distance_miles: Number(distanceMiles.toFixed(2)),
                attributes,
                ...attributes
              };
              
              results.push(tractInfo);
            }
          }
        } catch (error) {
          console.error(`❌ Proximity query failed for layer ${layerId}:`, error);
        }
      }
    }
    
    // Sort by distance (containing first, then by distance)
    results.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      return (a.distance_miles || Infinity) - (b.distance_miles || Infinity);
    });
    
    // Remove duplicates based on objectId
    const uniqueResults: HoustonAffordabilityInfo[] = [];
    const seenIds = new Set<number>();
    for (const result of results) {
      if (!seenIds.has(result.objectId)) {
        seenIds.add(result.objectId);
        uniqueResults.push(result);
      }
    }
    
    console.log(`✅ Found ${uniqueResults.length} Houston Affordability tract(s)${containingTract ? ' (1 containing)' : ''}${cappedRadius > 0 ? ` and ${uniqueResults.filter(r => !r.isContaining && !r.layerType).length} nearby within ${cappedRadius} miles` : ''}${cityLimit ? ' (within city limit)' : ''}${etj ? ' (within ETJ)' : ''}`);
    
    return {
      containing: containingTract,
      nearby: uniqueResults.filter(r => !r.isContaining && !r.layerType),
      cityLimit: cityLimit,
      etj: etj
    };
  } catch (error) {
    console.error('❌ Error querying Houston Affordability:', error);
    return {
      containing: null,
      nearby: [],
      cityLimit: null,
      etj: null
    };
  }
}

