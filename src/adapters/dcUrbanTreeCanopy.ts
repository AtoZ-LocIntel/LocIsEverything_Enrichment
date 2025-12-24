/**
 * Adapter for DC Urban Tree Canopy service
 * Service: https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Urban_Tree_Canopy/FeatureServer
 * Supports multiple layers with point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Urban_Tree_Canopy/FeatureServer';

export interface DCUrbanTreeCanopyFeature {
  objectid: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI polygon or point geometry
  isContaining?: boolean; // True if point is inside polygon
  distance_miles?: number; // Distance for proximity queries
}

/**
 * Haversine formula for distance calculation
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate distance from point to polygon centroid or nearest point
 */
function distanceToPolygon(
  pointLat: number,
  pointLon: number,
  polygonGeometry: any
): number {
  if (!polygonGeometry || !polygonGeometry.rings || polygonGeometry.rings.length === 0) {
    return Infinity;
  }

  // Get centroid of polygon (first ring's centroid)
  const ring = polygonGeometry.rings[0];
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;

  for (const coord of ring) {
    // ESRI coordinates are [x, y] = [lon, lat] in WGS84
    sumLon += coord[0];
    sumLat += coord[1];
    count++;
  }

  if (count === 0) return Infinity;

  const centroidLat = sumLat / count;
  const centroidLon = sumLon / count;

  return haversineDistance(pointLat, pointLon, centroidLat, centroidLon);
}

/**
 * Query DC Urban Tree Canopy layer
 * Supports point-in-polygon and proximity queries up to 10 miles
 */
export async function getDCUrbanTreeCanopyData(
  layerId: number,
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<DCUrbanTreeCanopyFeature[]> {
  try {
    // Cap radius at 10 miles (1 mile for DC Trees layerId 11)
    const maxRadius = layerId === 11 ? 1.0 : 10.0;
    const cappedRadius = radiusMiles ? Math.min(radiusMiles, maxRadius) : maxRadius;
    const radiusMeters = cappedRadius * 1609.34;

    console.log(
      `🌳 DC Urban Tree Canopy Layer ${layerId} query for coordinates [${lat}, ${lon}] within ${cappedRadius} miles`
    );

    const results: DCUrbanTreeCanopyFeature[] = [];
    const processedFeatureIds = new Set<number>();

    // For DC Trees (layerId 11), skip point-in-polygon and only do proximity queries
    const isDCTrees = layerId === 11;

    // First, check if point is inside any polygon (point-in-polygon) - skip for DC Trees
    if (!isDCTrees) {
      const insideQueryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
      insideQueryUrl.searchParams.set('f', 'json');
      insideQueryUrl.searchParams.set('where', '1=1');
      insideQueryUrl.searchParams.set('outFields', '*');
      insideQueryUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      insideQueryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      insideQueryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      insideQueryUrl.searchParams.set('inSR', '4326');
      insideQueryUrl.searchParams.set('outSR', '4326');
      insideQueryUrl.searchParams.set('returnGeometry', 'true');

      console.log(`🔗 DC Urban Tree Canopy Inside Query URL: ${insideQueryUrl.toString()}`);
      const insideResponse = await fetch(insideQueryUrl.toString());

      if (!insideResponse.ok) {
        throw new Error(
          `DC Urban Tree Canopy API failed: ${insideResponse.status} ${insideResponse.statusText}`
        );
      }

      const insideData = await insideResponse.json();

      if (insideData.error) {
        throw new Error(
          `DC Urban Tree Canopy API error: ${JSON.stringify(insideData.error)}`
        );
      }

      // Process containing features
      if (insideData.features && insideData.features.length > 0) {
        insideData.features.forEach((feature: any) => {
          const objectid = feature.attributes.OBJECTID || feature.attributes.objectid;
          if (objectid && !processedFeatureIds.has(objectid)) {
            results.push({
              objectid,
              attributes: feature.attributes,
              geometry: feature.geometry,
              isContaining: true,
              distance_miles: 0
            });
            processedFeatureIds.add(objectid);
          }
        });
      }
    }

    // Now query for nearby features within radius (proximity)
    if (radiusMiles && radiusMiles > 0) {
      // Fetch all results using pagination
      let allFeatures: any[] = [];
      let resultOffset = 0;
      const batchSize = 2000;
      let hasMore = true;

      while (hasMore) {
        const nearbyQueryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
        nearbyQueryUrl.searchParams.set('f', 'json');
        nearbyQueryUrl.searchParams.set('where', '1=1');
        nearbyQueryUrl.searchParams.set('outFields', '*');
        nearbyQueryUrl.searchParams.set('geometry', JSON.stringify({
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        }));
        nearbyQueryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
        nearbyQueryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
        nearbyQueryUrl.searchParams.set('distance', radiusMeters.toString());
        nearbyQueryUrl.searchParams.set('units', 'esriSRUnit_Meter');
        nearbyQueryUrl.searchParams.set('inSR', '4326');
        nearbyQueryUrl.searchParams.set('outSR', '4326');
        nearbyQueryUrl.searchParams.set('returnGeometry', 'true');
        nearbyQueryUrl.searchParams.set('resultRecordCount', batchSize.toString());
        nearbyQueryUrl.searchParams.set('resultOffset', resultOffset.toString());

        if (resultOffset === 0) {
          console.log(`🔗 DC Urban Tree Canopy Nearby Query URL: ${nearbyQueryUrl.toString()}`);
        }

        const nearbyResponse = await fetch(nearbyQueryUrl.toString());

        if (!nearbyResponse.ok) {
          throw new Error(
            `DC Urban Tree Canopy Nearby API failed: ${nearbyResponse.status} ${nearbyResponse.statusText}`
          );
        }

        const nearbyData = await nearbyResponse.json();

        if (nearbyData.error) {
          throw new Error(
            `DC Urban Tree Canopy Nearby API error: ${JSON.stringify(nearbyData.error)}`
          );
        }

        const batchFeatures = nearbyData.features || [];
        allFeatures = allFeatures.concat(batchFeatures);

        // Check if there are more results
        hasMore = batchFeatures.length === batchSize || nearbyData.exceededTransferLimit === true;
        resultOffset += batchFeatures.length;

        // Safety check
        if (resultOffset > 100000) {
          console.warn('⚠️ DC Urban Tree Canopy: Stopping pagination at 100k records for safety');
          hasMore = false;
        }

        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Process nearby features
      allFeatures.forEach((feature: any) => {
        const objectid = feature.attributes.OBJECTID || feature.attributes.objectid;
        if (objectid && !processedFeatureIds.has(objectid)) {
          const geometry = feature.geometry;
          let distanceMiles = cappedRadius;

          // Calculate distance
          if (geometry) {
            if (geometry.rings && !isDCTrees) {
              // Polygon - calculate distance to centroid (skip for DC Trees as it's point-only)
              distanceMiles = distanceToPolygon(lat, lon, geometry);
            } else if (geometry.x !== undefined && geometry.y !== undefined) {
              // Point - calculate direct distance
              distanceMiles = haversineDistance(lat, lon, geometry.y, geometry.x);
            } else if (geometry.points && geometry.points.length > 0) {
              // Multipoint - use first point
              const firstPoint = geometry.points[0];
              distanceMiles = haversineDistance(lat, lon, firstPoint[1], firstPoint[0]);
            }
          }

          results.push({
            objectid,
            attributes: feature.attributes,
            geometry,
            isContaining: false,
            distance_miles: distanceMiles
          });
          processedFeatureIds.add(objectid);
        }
      });
    }

    // Sort by containing first, then by distance
    results.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${results.length} DC Urban Tree Canopy Layer ${layerId} feature(s) (${results.filter(r => r.isContaining).length} containing, ${results.filter(r => !r.isContaining).length} nearby)`
    );

    return results;
  } catch (error) {
    console.error(`❌ DC Urban Tree Canopy Layer ${layerId} API Error:`, error);
    throw error;
  }
}

