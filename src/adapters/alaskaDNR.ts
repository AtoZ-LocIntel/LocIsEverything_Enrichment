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
      
      const containsResponse = await fetchJSONSmart(containsQueryUrl.toString());

      // Check if we have features - prioritize features over error property
      let containsFeatures: any[] = [];
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
      
      let proximityResponse = await fetchJSONSmart(proximityQueryUrl.toString());
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
        
        allFeatures = allFeatures.concat(newProximityFeatures);

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

      // Check if this feature came from the contains query
      const isContaining = containsObjectIdsSet.has(objectid);
      let distanceMiles = 0; // Default to 0 for containing features

      if (isContaining) {
        // Feature contains the point
        distanceMiles = 0;
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
    const filteredFeatures = processedFeatures.filter(f => (f.distance_miles || Infinity) <= radiusMiles);

    console.log(`✅ Processed ${filteredFeatures.length} Alaska DNR ${layerName} feature(s) within ${radiusMiles} miles`);

    return filteredFeatures;
  } catch (error) {
    console.error(`❌ Alaska DNR ${layerName} API Error:`, error);
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

