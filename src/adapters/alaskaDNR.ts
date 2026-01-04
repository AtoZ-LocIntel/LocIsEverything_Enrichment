/**
 * Alaska Department of Natural Resources (DNR) Adapter
 * Service: https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData
 * Supports proximity queries for various infrastructure and natural resource layers
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL_ALASKA_DNR = 'https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData';

export interface AlaskaDNRFeature {
  objectid: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance from query point (0 if inside polygon)
  isContaining?: boolean; // True if point is within polygon (polygon layers only)
  layerId: number; // Which layer this feature came from
  layerName: string; // Human-readable layer name
}

/**
 * Point-in-polygon check using ray casting algorithm
 * Used when server-side contains queries are not supported (e.g., 403 errors)
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
 * Calculate haversine distance between two points in miles
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query Alaska DNR layer - For POINT and POLYLINE layers ONLY
 * This function performs proximity queries only - NO contains queries.
 * For polygon layers that need point-in-polygon, use queryAlaskaDNRPolygonLayer instead.
 */
async function queryAlaskaDNRLayer(
  baseServiceUrl: string,
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  try {
    const maxRecordCount = 2000;
    console.log(`🏔️ Alaska DNR ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);

    // Ensure baseServiceUrl doesn't have trailing slash
    const cleanBaseUrl = baseServiceUrl.endsWith('/') ? baseServiceUrl.slice(0, -1) : baseServiceUrl;
    const queryUrl = new URL(`${cleanBaseUrl}/${layerId}/query`);
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }));
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', (radiusMiles * 1609.34).toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
    
    const response = await fetchJSONSmart(queryUrl.toString());

    if (response.error) {
      console.error(`❌ Alaska DNR ${layerName} API error. URL was: ${queryUrl.toString()}`);
      console.error(`Error details: ${JSON.stringify(response.error)}`);
      throw new Error(`Alaska DNR ${layerName} API error: ${JSON.stringify(response.error)}`);
    }

    const features = response.features || [];

    // Process features and calculate distances
    const processedFeatures: AlaskaDNRFeature[] = features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry;
      const objectid = attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || attributes.FID || 0;

      let distanceMiles = radiusMiles; // Default to max radius

      // Calculate distance using geometry
      if (geometry) {
        let featureLat: number | null = null;
        let featureLon: number | null = null;

        // Handle different geometry types
        if (geometry.x !== undefined && geometry.y !== undefined) {
          // Point geometry
          featureLon = geometry.x;
          featureLat = geometry.y;
        } else if (geometry.paths && geometry.paths.length > 0) {
          // Polyline geometry - use first point
          const firstPath = geometry.paths[0];
          if (firstPath && firstPath.length > 0) {
            featureLon = firstPath[0][0];
            featureLat = firstPath[0][1];
          }
        } else if (geometry.rings && geometry.rings.length > 0) {
          // Polygon geometry - use centroid (first ring, first point as approximation)
          const firstRing = geometry.rings[0];
          if (firstRing && firstRing.length > 0) {
            featureLon = firstRing[0][0];
            featureLat = firstRing[0][1];
          }
        } else if (geometry.coordinates && geometry.coordinates.length >= 2) {
          // GeoJSON-style coordinates
          featureLon = geometry.coordinates[0];
          featureLat = geometry.coordinates[1];
        }

        if (featureLat !== null && featureLon !== null) {
          distanceMiles = calculateHaversineDistance(lat, lon, featureLat, featureLon);
        }
      }

      return {
        objectid,
        attributes,
        geometry,
        distance_miles: distanceMiles,
        layerId,
        layerName,
      };
    });

    // Sort by distance
    processedFeatures.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(`✅ Processed ${processedFeatures.length} Alaska DNR ${layerName} feature(s) within ${radiusMiles} miles`);

    return processedFeatures;
  } catch (error) {
    console.error(`❌ Alaska DNR ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query Alaska DNR Trans Alaska Pipeline System (Layer 0) - Polyline layer
 */
export async function getAlaskaDNRTransAlaskaPipelineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    `${BASE_SERVICE_URL_ALASKA_DNR}/Infrastructure_TransAlaskaPipeline/MapServer`,
    0,
    'Trans Alaska Pipeline System',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Well Sites (Layer 0) - Point layer
 */
export async function getAlaskaDNRWellSitesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    `${BASE_SERVICE_URL_ALASKA_DNR}/LandActivity_WellSite/MapServer`,
    0,
    'Well Sites',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR polygon layer with point-in-polygon and proximity support
 * NOTE: This function should ONLY be called for polygon layers. Point and line layers should use queryAlaskaDNRLayer.
 */
async function queryAlaskaDNRPolygonLayer(
  baseServiceUrl: string,
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  try {
    const maxRecordCount = 2000;
    console.log(`🏔️ Alaska DNR ${layerName} (Layer ${layerId}) POLYGON query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;
    const containsObjectIdsSet = new Set<number>(); // Track object IDs from contains query

    while (hasMore) {
      // Ensure baseServiceUrl doesn't have trailing slash
      const cleanBaseUrl = baseServiceUrl.endsWith('/') ? baseServiceUrl.slice(0, -1) : baseServiceUrl;
      // First, try point-in-polygon query (contains) - ONLY for polygon layers
      const containsQueryUrl = new URL(`${cleanBaseUrl}/${layerId}/query`);
      containsQueryUrl.searchParams.set('f', 'json');
      containsQueryUrl.searchParams.set('where', '1=1');
      containsQueryUrl.searchParams.set('outFields', '*');
      containsQueryUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      containsQueryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      // Try esriSpatialRelWithin for FeatureServer, esriSpatialRelContains for MapServer
      // FeatureServer may not support Contains, so try Within first
      const isFeatureServer = baseServiceUrl.includes('/FeatureServer');
      containsQueryUrl.searchParams.set('spatialRel', isFeatureServer ? 'esriSpatialRelWithin' : 'esriSpatialRelContains');
      containsQueryUrl.searchParams.set('inSR', '4326');
      containsQueryUrl.searchParams.set('outSR', '4326');
      containsQueryUrl.searchParams.set('returnGeometry', 'true');
      containsQueryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      containsQueryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      let containsResponse: any;
      let containsQueryFailed = false;
      try {
        console.log(`🔍 Alaska DNR ${layerName} contains query URL: ${containsQueryUrl.toString()}`);
        containsResponse = await fetchJSONSmart(containsQueryUrl.toString());
        console.log(`🔍 Alaska DNR ${layerName} contains query response:`, {
          hasFeatures: Array.isArray(containsResponse.features) && containsResponse.features.length > 0,
          featureCount: containsResponse.features?.length || 0,
          hasError: !!containsResponse.error,
          error: containsResponse.error
        });
      } catch (error: any) {
        // Handle 403 or other errors - some layers don't support contains queries
        console.error(`❌ Alaska DNR ${layerName} contains query error:`, error);
        if (error.message?.includes('403') || error.message?.includes('HTTP 403')) {
          console.warn(`⚠️ Alaska DNR ${layerName} contains query returned 403 (not supported), using proximity only`);
          containsQueryFailed = true;
        } else {
          // Re-throw other errors
          throw error;
        }
      }

      // Check if we have features - prioritize features over error property
      let containsFeatures: any[] = [];
      if (!containsQueryFailed && containsResponse) {
        const responseFeatures = containsResponse.features || [];
        const hasContainsFeatures = Array.isArray(responseFeatures) && responseFeatures.length > 0;
        
        if (containsResponse.error && !hasContainsFeatures) {
          // Only treat as failure if there's an error AND no features
          console.warn(`⚠️ Alaska DNR ${layerName} contains query failed, using proximity only: ${JSON.stringify(containsResponse.error)}`);
        } else if (hasContainsFeatures) {
          // We have features, use them regardless of error property
          containsFeatures = responseFeatures;
          // Track object IDs from contains query
          containsFeatures.forEach((f: any) => {
            const objectid = f.attributes?.OBJECTID || f.attributes?.objectid || f.attributes?.OBJECTID_1 || f.attributes?.FID || 0;
            containsObjectIdsSet.add(objectid);
          });
          const containsFeaturesWithFlag = containsFeatures.map((f: any) => ({ ...f, _fromContains: true }));
          allFeatures = allFeatures.concat(containsFeaturesWithFlag);
        }
      }

      // Then, try proximity query (intersects with distance)
      // Some services don't support the distance parameter, so try both approaches
      const proximityQueryUrl = new URL(`${cleanBaseUrl}/${layerId}/query`);
      proximityQueryUrl.searchParams.set('f', 'json');
      proximityQueryUrl.searchParams.set('where', '1=1');
      proximityQueryUrl.searchParams.set('outFields', '*');
      
      // Try using distance parameter first (standard approach)
      proximityQueryUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      proximityQueryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      proximityQueryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      proximityQueryUrl.searchParams.set('distance', (radiusMiles * 1609.34).toString());
      proximityQueryUrl.searchParams.set('units', 'esriSRUnit_Meter');
      proximityQueryUrl.searchParams.set('inSR', '4326');
      proximityQueryUrl.searchParams.set('outSR', '4326');
      proximityQueryUrl.searchParams.set('returnGeometry', 'true');
      proximityQueryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      proximityQueryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      console.log(`🔍 Alaska DNR ${layerName} proximity query URL: ${proximityQueryUrl.toString()}`);
      let proximityResponse = await fetchJSONSmart(proximityQueryUrl.toString());
      console.log(`🔍 Alaska DNR ${layerName} proximity query response:`, {
        hasFeatures: Array.isArray(proximityResponse.features) && proximityResponse.features.length > 0,
        featureCount: proximityResponse.features?.length || 0,
        hasError: !!proximityResponse.error,
        error: proximityResponse.error
      });
      
      let proximityFeatures: any[] = [];
      let hasProximityFeatures = false;

      // If distance parameter approach fails, try using a buffer circle geometry instead
      if (proximityResponse.error && (!proximityResponse.features || proximityResponse.features.length === 0)) {
        console.log(`⚠️ Alaska DNR ${layerName} proximity query with distance parameter failed, trying buffer circle geometry approach...`);
        
        // Create a buffer circle geometry (approximate circle using polygon with many points)
        const radiusMeters = radiusMiles * 1609.34;
        const centerLon = lon;
        const centerLat = lat;
        const numPoints = 64; // Number of points to approximate circle
        const circlePoints: number[][] = [];
        
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          // Approximate distance in degrees (rough conversion)
          const latOffset = (radiusMeters / 111320) * Math.cos(angle);
          const lonOffset = (radiusMeters / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
          circlePoints.push([centerLon + lonOffset, centerLat + latOffset]);
        }
        // Close the circle
        circlePoints.push(circlePoints[0]);
        
        // Try with buffer circle geometry
        const bufferQueryUrl = new URL(`${cleanBaseUrl}/${layerId}/query`);
        bufferQueryUrl.searchParams.set('f', 'json');
        bufferQueryUrl.searchParams.set('where', '1=1');
        bufferQueryUrl.searchParams.set('outFields', '*');
        bufferQueryUrl.searchParams.set('geometry', JSON.stringify({
          rings: [circlePoints],
          spatialReference: { wkid: 4326 }
        }));
        bufferQueryUrl.searchParams.set('geometryType', 'esriGeometryPolygon');
        bufferQueryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
        bufferQueryUrl.searchParams.set('inSR', '4326');
        bufferQueryUrl.searchParams.set('outSR', '4326');
        bufferQueryUrl.searchParams.set('returnGeometry', 'true');
        bufferQueryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
        bufferQueryUrl.searchParams.set('resultOffset', resultOffset.toString());
        
        proximityResponse = await fetchJSONSmart(bufferQueryUrl.toString());
      }

      // Check if we have features - prioritize features over error property
      proximityFeatures = proximityResponse.features || [];
      hasProximityFeatures = Array.isArray(proximityFeatures) && proximityFeatures.length > 0;
      
      // Debug logging
      if (proximityResponse.error) {
        console.log(`🔍 Alaska DNR ${layerName} proximity response has error property: ${JSON.stringify(proximityResponse.error)}, but features count: ${proximityFeatures.length}`);
      }
      
      // If proximity query fails (error AND no features), continue with just contains results
      if (proximityResponse.error && !hasProximityFeatures) {
        console.warn(`⚠️ Alaska DNR ${layerName} proximity query failed, using contains results only: ${JSON.stringify(proximityResponse.error)}`);
        // Break out of loop since we can't paginate without proximity query
        hasMore = false;
      } else if (hasProximityFeatures) {
        // We have features, use them regardless of error property
        console.log(`✅ Alaska DNR ${layerName} proximity query returned ${proximityFeatures.length} features`);
        
        // Merge features, avoiding duplicates
        const existingObjectIds = new Set(allFeatures.map(f => f.attributes?.OBJECTID || f.attributes?.objectid || f.attributes?.OBJECTID_1 || f.attributes?.FID || 0));
        const newProximityFeatures = proximityFeatures.filter(f => {
          const objectid = f.attributes?.OBJECTID || f.attributes?.objectid || f.attributes?.OBJECTID_1 || f.attributes?.FID || 0;
          return !existingObjectIds.has(objectid);
        });
        
        // Mark proximity features so we know they're already within radius
        const proximityFeaturesWithFlag = newProximityFeatures.map((f: any) => ({ ...f, _fromProximity: true }));
        allFeatures = allFeatures.concat(proximityFeaturesWithFlag);

        hasMore = (containsFeatures.length === maxRecordCount || proximityFeatures.length === maxRecordCount) && resultOffset < 100000;
        resultOffset += Math.max(containsFeatures.length, proximityFeatures.length);
      } else {
        // No features from either query, break
        hasMore = false;
      }

      if (resultOffset > 100000) {
        console.warn(`⚠️ Alaska DNR ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        break;
      }
    }

    // Track which features came from contains query (use the set we created earlier)
    // We'll check this in the map function below

      // Process features and calculate distances
    const processedFeatures: AlaskaDNRFeature[] = allFeatures.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry;
      const objectid = attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || attributes.FID || 0;

      // Check if this feature came from the contains query or proximity query
      let isContaining = containsObjectIdsSet.has(objectid);
      const isFromProximity = feature._fromProximity === true;
      const isFromContains = feature._fromContains === true;
      let distanceMiles = 0; // Default to 0 for containing features

      // If contains query failed (403), do client-side point-in-polygon check for polygons
      if (!isContaining && geometry && geometry.rings && geometry.rings.length > 0) {
        isContaining = pointInPolygon(lat, lon, geometry.rings);
        if (isContaining) {
          // Mark as containing and add to set for consistency
          containsObjectIdsSet.add(objectid);
        }
      }

      if (isContaining) {
        // Feature contains the point
        distanceMiles = 0;
      } else if (isFromProximity && !isFromContains) {
        // Feature came from proximity query only (not contains) - server already verified it's within radius
        // For polygons, find the closest point in the ring to get a reasonable distance estimate
        if (geometry && geometry.rings && geometry.rings.length > 0) {
          const ring = geometry.rings[0];
          if (ring && ring.length > 0) {
            // Find the closest point in the ring to our query point
            let minDistance = Infinity;
            for (const point of ring) {
              if (point && point.length >= 2) {
                const pointDist = calculateHaversineDistance(lat, lon, point[1], point[0]);
                minDistance = Math.min(minDistance, pointDist);
              }
            }
            // Use the minimum distance, but cap at 99% of radius to ensure it passes filter
            distanceMiles = minDistance < Infinity ? Math.min(minDistance, radiusMiles * 0.99) : radiusMiles * 0.99;
          } else {
            distanceMiles = radiusMiles * 0.99;
          }
        } else if (geometry && geometry.paths && geometry.paths.length > 0) {
          // For polylines, find closest point
          let minDistance = Infinity;
          for (const path of geometry.paths) {
            for (const point of path) {
              if (point && point.length >= 2) {
                const pointDist = calculateHaversineDistance(lat, lon, point[1], point[0]);
                minDistance = Math.min(minDistance, pointDist);
              }
            }
          }
          distanceMiles = minDistance < Infinity ? Math.min(minDistance, radiusMiles * 0.99) : radiusMiles * 0.99;
        } else if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
          distanceMiles = calculateHaversineDistance(lat, lon, geometry.y, geometry.x);
          distanceMiles = Math.min(distanceMiles, radiusMiles * 0.99);
        } else {
          // Fallback: set to a value that will pass the filter
          distanceMiles = radiusMiles * 0.99;
        }
      } else if (geometry && geometry.rings && geometry.rings.length > 0) {
        // Polygon geometry - calculate distance to nearest edge/centroid
        const ring = geometry.rings[0];
        if (ring && ring.length > 0) {
          // Use first point as approximation for distance calculation
          const firstPoint = ring[0];
          if (firstPoint && firstPoint.length >= 2) {
            const featureLon = firstPoint[0];
            const featureLat = firstPoint[1];
            distanceMiles = calculateHaversineDistance(lat, lon, featureLat, featureLon);
          }
        }
      } else if (geometry && geometry.paths && geometry.paths.length > 0) {
        // Polyline geometry - use first point
        const firstPath = geometry.paths[0];
        if (firstPath && firstPath.length > 0) {
          const firstPoint = firstPath[0];
          if (firstPoint && firstPoint.length >= 2) {
            distanceMiles = calculateHaversineDistance(lat, lon, firstPoint[1], firstPoint[0]);
          }
        }
      } else if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
        // Point geometry
        distanceMiles = calculateHaversineDistance(lat, lon, geometry.y, geometry.x);
      }

      return {
        objectid,
        attributes,
        geometry,
        distance_miles: distanceMiles,
        isContaining,
        layerId,
        layerName,
      };
    });

    // Sort: containing features first (distance = 0), then by distance
    processedFeatures.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    // Filter by radius
    // Note: Features from proximity queries are already within radius, so we only filter non-proximity features
    const filteredFeatures = processedFeatures.filter(f => {
      // If it's a containing feature or came from proximity query, include it
      if (f.isContaining) return true;
      // For other features, check distance
      return (f.distance_miles || Infinity) <= radiusMiles;
    });

    console.log(`✅ Processed ${filteredFeatures.length} Alaska DNR ${layerName} feature(s) within ${radiusMiles} miles`);
    
    if (filteredFeatures.length === 0) {
      console.warn(`⚠️ Alaska DNR ${layerName}: No features returned. This could indicate:
        - Point is outside layer extent
        - Layer has no data in this area
        - Query parameters may need adjustment
        - Check console above for detailed query responses`);
    }

    return filteredFeatures;
  } catch (error) {
    console.error(`❌ Alaska DNR ${layerName} API Error:`, error);
    console.error(`❌ Error details:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Query Alaska DNR Oil and Gas Lease Sale Tract (Layer 0) - Polygon layer
 */
export async function getAlaskaDNROilGasLeaseSaleTractData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    `${BASE_SERVICE_URL_ALASKA_DNR}/MineralActivity_OGLeaseSaleTract/MapServer`,
    0,
    'Oil and Gas Lease Sale Tract',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR State Park Roads (Layer 3) - Polyline layer
 */
export async function getAlaskaDNRStateParkRoadsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    `${BASE_SERVICE_URL_ALASKA_DNR}/Recreational_ParkBoundary/MapServer`,
    3,
    'State Park Roads',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR State Park Trails (Layer 1) - Polyline layer
 */
export async function getAlaskaDNRStateParkTrailsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    `${BASE_SERVICE_URL_ALASKA_DNR}/Recreational_ParkBoundary/MapServer`,
    1,
    'State Park Trails',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR State Park Boundaries (Layer 2) - Polygon layer
 */
export async function getAlaskaDNRStateParkBoundariesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    `${BASE_SERVICE_URL_ALASKA_DNR}/Recreational_ParkBoundary/MapServer`,
    2,
    'State Park Boundaries',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR State Park Facilities (Layer 0) - Point layer
 */
export async function getAlaskaDNRStateParkFacilitiesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    `${BASE_SERVICE_URL_ALASKA_DNR}/Recreational_ParkBoundary/MapServer`,
    0,
    'State Park Facilities',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Controlled Livestock Districts (Layer 0) - Polygon layer
 */
export async function getAlaskaDNRControlledLivestockDistrictsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  // This service is NOT under OpenData, it's directly under services/AG
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/AG/Controlled_Livestock_District/MapServer',
    0,
    'Controlled Livestock Districts',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Land Capacity Classification (Layer 0) - Polygon layer
 */
export async function getAlaskaDNRLandCapacityClassificationData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  // This service is NOT under OpenData, it's directly under services/AG
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/AG/Land_Capability_Classification/MapServer',
    0,
    'Land Capacity Classification',
    lat,
    lon,
    Math.min(radiusMiles, 10.0)
  );
}

/**
 * Query Alaska DNR Shore Fishery Leases (Layer 0) - Polygon layer
 */
export async function getAlaskaDNRShoreFisheryLeasesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  // This service is NOT under OpenData, it's directly under services/DEC
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/AquaticFarmLeases/MapServer',
    0,
    'Shore Fishery Leases',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Aquatic Farm Leases (Layer 1) - Polygon layer
 */
export async function getAlaskaDNRAquaticFarmLeasesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  // This service is NOT under OpenData, it's directly under services/DEC
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/AquaticFarmLeases/MapServer',
    1,
    'Aquatic Farm Leases',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR WELTS (Well Log Tracking System) (Layer 0) - Point layer
 */
export async function getAlaskaDNRWELTSData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  // WELTS service is NOT under OpenData, it's directly under services
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/welts/MapServer',
    0,
    'WELTS (Well Log Tracking System)',
    lat,
    lon,
    Math.min(radiusMiles, 25.0)
  );
}

/**
 * Query Alaska DNR DEC WaterEstate layers
 */
export async function getAlaskaDNRPLSSSectionData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  // This service is NOT under OpenData, it's directly under services/DEC
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    0,
    'PLSS Section',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRPLSSTownshipData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  // This service is NOT under OpenData, it's directly under services/DEC
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    1,
    'PLSS Township',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRSurfaceWaterRightLocationData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  // This service is NOT under OpenData, it's directly under services/DEC
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    2,
    'Surface Water Right Location',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRSubSurfaceWaterRightLocationData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    3,
    'SubSurface Water Right Location',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRSurfaceWaterRightsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    4,
    'Surface Water Rights',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRSubSurfaceWaterRightsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    5,
    'SubSurface Water Rights',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRInstreamFlowWaterReservationsPointData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    6,
    'Instream Flow Water Reservations (Point)',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRInstreamFlowWaterReservationsLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    7,
    'Instream Flow Water Reservations (Line)',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRInstreamFlowWaterReservationsPolygonData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    8,
    'Instream Flow Water Reservations (Polygon)',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRShoreFisheryLeasesLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    9,
    'Shore Fishery Leases (Line)',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRShoreFisheryLeasesPolygonData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    10,
    'Shore Fishery Leases (Polygon)',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRAquaticFarmLeasesWaterEstateData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    11,
    'Aquatic Farm Leases',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLeaseLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    12,
    'Lease Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLeaseAreaData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DEC/DEC_WaterEstate/MapServer',
    13,
    'Lease Area',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Hatcher's Pass Motorized Closures layers
 */
export async function getAlaskaDNRHattersPassPlanBoundaryData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  // This service is NOT under OpenData, it's directly under services/DPOR
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DPOR/HP_MotorizedClosures/MapServer',
    0,
    "Hatcher's Pass Plan Boundary",
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRHattersPassNonMotorizedSummerData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  // This service is NOT under OpenData, it's directly under services/DPOR
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DPOR/HP_MotorizedClosures/MapServer',
    1,
    "Hatcher's Pass Non-motorized Summer",
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRHattersPassNonMotorizedYearRoundData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  // This service is NOT under OpenData, it's directly under services/DPOR
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/DPOR/HP_MotorizedClosures/MapServer',
    2,
    "Hatcher's Pass Non-motorized Year-round",
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mapper Base Layers
 */
// Point layers
export async function getAlaskaDNRNationalGeodeticSurveyPtData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    1,
    'National Geodetic Survey Pt',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRStateControlMonumentsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    2,
    'State Control Monuments',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRBLMMonumentsGCDBData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    5,
    'BLM Monuments GCDB',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRBLMMonumentsSDMSData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    6,
    'BLM Monuments SDMS',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRSurveyBoundaryPtData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    4,
    'Survey Boundary Pt',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

// Polyline layers
export async function getAlaskaDNRSimpleCoastlineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    0,
    'Simple Coastline',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRSurveyTractLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    28,
    'Survey Tract Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRSurveyBlockLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    30,
    'Survey Block Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRSurveyBoundaryLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    20,
    'Survey Boundary Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

// Polygon layers
export async function getAlaskaDNRSectionData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    22,
    'Section',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRSurveyLotPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    16,
    'Survey Lot Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRSurveyTractPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    18,
    'Survey Tract Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRSurveyBlockPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    17,
    'Survey Block Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRSurveyBoundaryPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    19,
    'Survey Boundary Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRTownshipData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    23,
    'Township',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRIncorporatedCityBoundaryData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    24,
    'Incorporated City Boundary',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRRecordingDistrictBoundaryData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    25,
    'Recording District Boundary',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRDCCEDCRABoroughBoundaryData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Base_Layers/MapServer',
    26,
    'DCCED CRA Borough Boundary',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mapper Land Estate Layers
 */
// Point layers
export async function getAlaskaDNRAgreementSettlementReconveyPtData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    2,
    'Agreement Settlement Reconvey Pt',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRRestrictedUseAuthorizationPtData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    36,
    'Restricted Use Authorization Pt',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRPotentialHazardousSitesPtData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    33,
    'Potential Hazardous Sites Pt',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRTrespassPtData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    41,
    'Trespass Pt',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRPermitLeaseLEPtData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    6,
    'Permit Lease LE Pt',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNREasementPtData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    3,
    'Easement Pt',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLandDisposalOtherPtData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    4,
    'Land Disposal Other Pt',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLandEstateSurveyBoundaryPtData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    51,
    'Survey Boundary Pt',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

// Polyline layers
export async function getAlaskaDNRLandEstateSimpleCoastlineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    1,
    'Simple Coastline',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRAgreementSettlementReconveyLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    42,
    'Agreement Settlement Reconvey Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRRestrictedUseAuthorizationLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    37,
    'Restricted Use Authorization Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRPotentialHazardousSitesLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    34,
    'Potential Hazardous Sites Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRTrespassLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    40,
    'Trespass Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRPermitLeaseLELineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    13,
    'Permit Lease LE Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNREasementLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    12,
    'Easement Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRResourceSaleLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    14,
    'Resource Sale Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRFederalActionLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    7,
    'Federal Action Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLandDisposalAvailableLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    43,
    'Land Disposal Available Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLandDisposalConveyedLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    9,
    'Land Disposal Conveyed Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLandDisposalOtherLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    44,
    'Land Disposal Other Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRManagementAgreementLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    10,
    'Management Agreement Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNROtherStateAcquiredLELineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    8,
    'Other State Acquired LE Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRS2477LineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    52,
    'RS2477 - Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRStateSelectedLandLELineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    53,
    'State Selected Land LE Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRStateTAPatentedLELineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    15,
    'State TA Patented LE Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLandEstateSurveyBoundaryLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    50,
    'Survey Boundary Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

// Polygon layers
export async function getAlaskaDNRLandEstateSectionData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    46,
    'Section',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRAgreementSettlementReconPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    17,
    'Agreement Settlement Recon Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRRestrictedUseAuthorizationPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    38,
    'Restricted Use Authorization Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRPotentialHazardousSitesPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    35,
    'Potential Hazardous Sites Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRTrespassPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    39,
    'Trespass Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRPermitLeaseLEPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    28,
    'Permit Lease LE Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNREasementPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    26,
    'Easement Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRResourceSalePolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    29,
    'Resource Sale Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRFederalActionPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    16,
    'Federal Action Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLandDisposalAvailablePolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    18,
    'Land Disposal Available Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLandDisposalConveyedPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    19,
    'Land Disposal Conveyed Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLandDisposalOtherPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    20,
    'Land Disposal Other Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRManagementAgreementPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    21,
    'Management Agreement Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRMentalHealthTrustLandPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    22,
    'Mental Health Trust Land Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRMunicipalEntitlementPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    23,
    'Municipal Entitlement Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRMunicipalTidelandPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    24,
    'Municipal Tideland Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRStateInterestNativeAllotmentPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    25,
    'State Interest Native Allotment Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNROtherStateAcquiredLEPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    30,
    'Other State Acquired LE Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRStateSelectedOrANILCATopfiledLandLEPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    31,
    'State Selected or ANILCA Topfiled Land LE Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRStateTAPatentedLEPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    32,
    'State TA, Patented, LE Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLandEstateSurveyBoundaryPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    49,
    'Survey Boundary Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLandEstateRecordingDistrictBoundaryData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    48,
    'Recording District Boundary',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

export async function getAlaskaDNRLandEstateTownshipData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Land_Estate_Layers/MapServer',
    45,
    'Township',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Agreement Settlement Recon Point (Layer 11) - Point layer
 */
export async function getAlaskaDNRMineralEstateAgreementSettlementReconPointData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    11,
    'Agreement Settlement Recon Point',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Agreement Settlement Recon Line (Layer 5) - Polyline layer
 */
export async function getAlaskaDNRMineralEstateAgreementSettlementReconLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    5,
    'Agreement Settlement Recon Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Agreement Settlement Recon Poly (Layer 22) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateAgreementSettlementReconPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    22,
    'Agreement Settlement Recon Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Federal Action Line (Layer 6) - Polyline layer
 */
export async function getAlaskaDNRMineralEstateFederalActionLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    6,
    'Federal Action Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Federal Action Poly (Layer 20) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateFederalActionPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    20,
    'Federal Action Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Leasehold Location Line (Layer 3) - Polyline layer
 */
export async function getAlaskaDNRMineralEstateLeaseholdLocationLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    3,
    'Leasehold Location Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Leasehold Location Poly (Layer 17) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateLeaseholdLocationPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    17,
    'Leasehold Location Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Management Agreement Line (Layer 2) - Polyline layer
 */
export async function getAlaskaDNRMineralEstateManagementAgreementLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    2,
    'Management Agreement Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Management Agreement Poly (Layer 9) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateManagementAgreementPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    9,
    'Management Agreement Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Mental Health Trust Land Poly (Layer 19) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateMentalHealthTrustLandPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    19,
    'Mental Health Trust Land Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Mineral Order Line (Layer 4) - Polyline layer
 */
export async function getAlaskaDNRMineralEstateMineralOrderLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    4,
    'Mineral Order Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Mineral Order Poly (Layer 16) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateMineralOrderPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    16,
    'Mineral Order Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - State Interest Native Allotment Poly (Layer 21) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateStateInterestNativeAllotmentPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    21,
    'State Interest Native Allotment Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Oil and Gas Lease Sale Tract Current (Layer 18) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateOilGasLeaseSaleTractCurrentData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    18,
    'Oil and Gas Lease Sale Tract Current',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Other State Acquired ME Line (Layer 8) - Polyline layer
 */
export async function getAlaskaDNRMineralEstateOtherStateAcquiredMELineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    8,
    'Other State Acquired ME Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Other State Acquired ME Poly (Layer 23) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateOtherStateAcquiredMEPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    23,
    'Other State Acquired ME Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Permit Lease ME Poly (Layer 10) - Polygon layer
 */
export async function getAlaskaDNRMineralEstatePermitLeaseMEPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    10,
    'Permit Lease ME Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - State Mining Claim Poly (Layer 112) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateStateMiningClaimPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    112,
    'State Mining Claim Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - State Mining Claim Pending Poly (Layer 13) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateStateMiningClaimPendingPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    13,
    'State Mining Claim Pending Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - State Mining Claim Closed Poly (Layer 14) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateStateMiningClaimClosedPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    14,
    'State Mining Claim Closed Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - State Prospecting Site Poly (Layer 111) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateStateProspectingSitePolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    111,
    'State Prospecting Site Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Municipal Entitlement Poly (Layer 113) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateMunicipalEntitlementPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    113,
    'Municipal Entitlement Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - State Selected Land ME Line (Layer 114) - Polyline layer
 */
export async function getAlaskaDNRMineralEstateStateSelectedLandMELineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    114,
    'State Selected Land ME Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - State Selected or ANILCA Topfiled Land ME Poly (Layer 1) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateStateSelectedOrANILCATopfiledLandMEPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    1,
    'State Selected or ANILCA Topfiled Land ME Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - State TA Patented ME Line (Layer 7) - Polyline layer
 */
export async function getAlaskaDNRMineralEstateStateTAPatentedMELineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    7,
    'State TA Patented ME Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - State TA Patented ME Poly (Layer 24) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateStateTAPatentedMEPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    24,
    'State TA Patented ME Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Survey Boundary Pt (Layer 51) - Point layer
 */
export async function getAlaskaDNRMineralEstateSurveyBoundaryPtData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    51,
    'Survey Boundary Pt',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Survey Boundary Line (Layer 50) - Polyline layer
 */
export async function getAlaskaDNRMineralEstateSurveyBoundaryLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    50,
    'Survey Boundary Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Survey Boundary Poly (Layer 49) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateSurveyBoundaryPolyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    49,
    'Survey Boundary Poly',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Recording District Boundary (Layer 25) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateRecordingDistrictBoundaryData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    25,
    'Recording District Boundary',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Well Site Point (Layer 12) - Point layer
 */
export async function getAlaskaDNRMineralEstateWellSitePointData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    12,
    'Well Site Point',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - DCCED CRA Borough Boundary (Layer 26) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateDCCEDCRABoroughBoundaryData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    26,
    'DCCED CRA Borough Boundary',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Mineral Estate - Township (Layer 45) - Polygon layer
 */
export async function getAlaskaDNRMineralEstateTownshipData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/Mapper/Mineral_Estate_Layers/MapServer',
    45,
    'Township',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Trust Land Survey (TLS) (Layer 0) - Polygon layer
 */
export async function getAlaskaDNRMHTTrustLandSurveyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    0,
    'Trust Land Survey (TLS)',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Other Activity (Layer 1) - Polygon layer
 */
export async function getAlaskaDNRMHTOtherActivityData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    1,
    'Other Activity',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Trespass Point (Layer 2) - Point layer
 */
export async function getAlaskaDNRMHTTrespassPointData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    2,
    'Trespass Point',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Trespass Line (Layer 3) - Polyline layer
 */
export async function getAlaskaDNRMHTTrespassLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    3,
    'Trespass Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Trespass Area (Layer 4) - Polygon layer
 */
export async function getAlaskaDNRMHTTrespassAreaData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    4,
    'Trespass Area',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Easements (Layer 5) - Polygon layer
 */
export async function getAlaskaDNRMHTEasementsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    5,
    'Easements',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Easement Point (Layer 6) - Point layer
 */
export async function getAlaskaDNRMHTEasementPointData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    6,
    'Easement Point',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Easement Line (Layer 7) - Polyline layer
 */
export async function getAlaskaDNRMHTEasementLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    7,
    'Easement Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Easement Area (Layer 8) - Polygon layer
 */
export async function getAlaskaDNRMHTEasementAreaData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    8,
    'Easement Area',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Sales (Layer 9) - Polygon layer
 */
export async function getAlaskaDNRMHTLandSalesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    9,
    'Land Sales',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Sale, Conveyed (Layer 10) - Polygon layer
 */
export async function getAlaskaDNRMHTLandSaleConveyedData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    10,
    'Land Sale, Conveyed',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Sale, Contract (Layer 11) - Polygon layer
 */
export async function getAlaskaDNRMHTLandSaleContractData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    11,
    'Land Sale, Contract',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Sale, Available OTC (Layer 12) - Polygon layer
 */
export async function getAlaskaDNRMHTLandSaleAvailableOTCData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    12,
    'Land Sale, Available OTC',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Sale, Pending Interest (Layer 13) - Polygon layer
 */
export async function getAlaskaDNRMHTLandSalePendingInterestData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    13,
    'Land Sale, Pending Interest',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Sale, Potential Reoffer (Layer 14) - Polygon layer
 */
export async function getAlaskaDNRMHTLandSalePotentialReofferData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    14,
    'Land Sale, Potential Reoffer',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Sale, New Inventory (Layer 15) - Polygon layer
 */
export async function getAlaskaDNRMHTLandSaleNewInventoryData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    15,
    'Land Sale, New Inventory',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Sale, Predisposal (Layer 16) - Polygon layer
 */
export async function getAlaskaDNRMHTLandSalePredisposalData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    16,
    'Land Sale, Predisposal',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Sale, All (Layer 17) - Polygon layer
 */
export async function getAlaskaDNRMHTLandSaleAllData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    17,
    'Land Sale, All',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Resource Sales (Layer 18) - Polygon layer
 */
export async function getAlaskaDNRMHTResourceSalesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    18,
    'Resource Sales',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Material Sale (Layer 19) - Polygon layer
 */
export async function getAlaskaDNRMHTMaterialSaleData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    19,
    'Material Sale',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Timber Sale (Layer 20) - Polygon layer
 */
export async function getAlaskaDNRMHTTimberSaleData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    20,
    'Timber Sale',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Leases & Licenses (Layer 21) - Polygon layer
 */
export async function getAlaskaDNRMHTLandLeasesLicensesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    21,
    'Land Leases & Licenses',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Use License Line (Layer 22) - Polyline layer
 */
export async function getAlaskaDNRMHTLandUseLicenseLineData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    22,
    'Land Use License Line',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Use License Area (Layer 23) - Polygon layer
 */
export async function getAlaskaDNRMHTLandUseLicenseAreaData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    23,
    'Land Use License Area',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Land Lease (Layer 24) - Polygon layer
 */
export async function getAlaskaDNRMHTLandLeaseData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    24,
    'Land Lease',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Mineral Leases & Licenses (Layer 25) - Polygon layer
 */
export async function getAlaskaDNRMHTMineralLeasesLicensesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    25,
    'Mineral Leases & Licenses',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Mineral Lease (Layer 26) - Polygon layer
 */
export async function getAlaskaDNRMHTMineralLeaseData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    26,
    'Mineral Lease',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Oil & Gas Lease (Layer 27) - Polygon layer
 */
export async function getAlaskaDNRMHTOilGasLeaseData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    27,
    'Oil & Gas Lease',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Coal Lease (Layer 28) - Polygon layer
 */
export async function getAlaskaDNRMHTCoalLeaseData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    28,
    'Coal Lease',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Mineral Exploration License (Layer 29) - Polygon layer
 */
export async function getAlaskaDNRMHTMineralExplorationLicenseData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    29,
    'Mineral Exploration License',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Oil & Gas Exploration License (Layer 30) - Polygon layer
 */
export async function getAlaskaDNRMHTOilGasExplorationLicenseData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    30,
    'Oil & Gas Exploration License',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Coal Exploration License (Layer 31) - Polygon layer
 */
export async function getAlaskaDNRMHTCoalExplorationLicenseData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    31,
    'Coal Exploration License',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Other Exploration License (Layer 32) - Polygon layer
 */
export async function getAlaskaDNRMHTOtherExplorationLicenseData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    32,
    'Other Exploration License',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Tundra Area - Stations (Layer 14) - Point layer
 */
export async function getAlaskaDNRTundraAreaStationsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MLW/TundraArea/MapServer',
    14,
    'Stations',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Tundra Area - Dalton Highway (Layer 12) - Polyline layer
 */
export async function getAlaskaDNRTundraAreaDaltonHighwayData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MLW/TundraArea/MapServer',
    12,
    'Dalton Highway',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Tundra Area - Tundra Regions (Layer 13) - Polygon layer
 */
export async function getAlaskaDNRTundraAreaTundraRegionsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MLW/TundraArea/MapServer',
    13,
    'Tundra Regions',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR Administrative - Soil and Water Conservation Districts (Layer 0) - Polygon layer
 */
export async function getAlaskaDNRSoilWaterConservationDistrictsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData/Administrative_SoilWaterConservationDistricts/MapServer',
    0,
    'Soil and Water Conservation Districts',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - TLO Land Exchange (Layer 34) - Polygon layer
 */
export async function getAlaskaDNRMHTTLOLandExchangeData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    34,
    'TLO Land Exchange',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - TLO Agreement (Layer 35) - Polygon layer
 */
export async function getAlaskaDNRMHTTLOAgreementData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    35,
    'TLO Agreement',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Title (Layer 36) - Polygon layer
 */
export async function getAlaskaDNRMHTTitleData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    36,
    'Title',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Mental Health Parcel (Layer 37) - Polygon layer
 */
export async function getAlaskaDNRMHTMentalHealthParcelData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    37,
    'Mental Health Parcel',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

/**
 * Query Alaska DNR MHT Land Activity - Mental Health Land (QCD) (Layer 38) - Polygon layer
 */
export async function getAlaskaDNRMHTMentalHealthLandQCDData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AlaskaDNRFeature[]> {
  return queryAlaskaDNRPolygonLayer(
    'https://arcgis.dnr.alaska.gov/arcgis/rest/services/MentalHealth/MHTLandActivity/MapServer',
    38,
    'Mental Health Land (QCD)',
    lat,
    lon,
    Math.min(radiusMiles, 100.0)
  );
}

