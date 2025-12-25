/**
 * Adapter for DC Property and Land service
 * Service: https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Property_and_Land_WebMercator/FeatureServer
 * Supports multiple layers with point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Property_and_Land_WebMercator/FeatureServer';

export interface DCPropertyAndLandFeature {
  objectid: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry (polygon, polyline, or point)
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
 * Calculate distance from point to nearest point on polyline
 */
function pointToLineSegmentDistance(
  pointLat: number,
  pointLon: number,
  polylinePaths: number[][][]
): number {
  let minDistance = Infinity;

  for (const path of polylinePaths) {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i]; // [lon, lat]
      const p2 = path[i + 1]; // [lon, lat]

      // Calculate distance from point to line segment
      const dist = distanceToSegment(pointLat, pointLon, p1[1], p1[0], p2[1], p2[0]);
      minDistance = Math.min(minDistance, dist);
    }
  }

  return minDistance;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
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

  let xx: number, yy: number;

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
 * Calculate distance from point to polygon (to nearest boundary)
 */
function distanceToPolygon(
  pointLat: number,
  pointLon: number,
  polygonGeometry: any
): number {
  if (!polygonGeometry.rings || polygonGeometry.rings.length === 0) {
    return Infinity;
  }

  // Check if point is inside polygon
  if (isPointInPolygon(pointLat, pointLon, polygonGeometry.rings)) {
    return 0;
  }

  // Calculate distance to nearest point on polygon boundary
  let minDistance = Infinity;
  for (const ring of polygonGeometry.rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i]; // [lon, lat]
      const p2 = ring[i + 1]; // [lon, lat]
      const dist = distanceToSegment(pointLat, pointLon, p1[1], p1[0], p2[1], p2[0]);
      minDistance = Math.min(minDistance, dist);
    }
  }
  return minDistance;
}

/**
 * Check if point is inside polygon using ray casting algorithm
 */
function isPointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  const outerRing = rings[0];
  if (!outerRing || outerRing.length < 3) return false;

  let inside = false;
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0], yi = outerRing[i][1];
    const xj = outerRing[j][0], yj = outerRing[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Query DC Property and Land layer
 * Supports point-in-polygon for polygons and proximity queries
 */
export async function getDCPropertyAndLandData(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<DCPropertyAndLandFeature[]> {
  try {
    // Determine geometry type and max radius from layer name
    const isPointLayer = layerName.toLowerCase().endsWith('points');
    const isLineLayer = layerName.toLowerCase().endsWith('lines');
    const isPolygonLayer = !isPointLayer && !isLineLayer;
    
    // Set max radius to 5 miles for all layers
    const maxRadius = 5.0;
    const cappedRadius = radiusMiles ? Math.min(radiusMiles, maxRadius) : maxRadius;
    const radiusMeters = cappedRadius * 1609.34;

    console.log(
      `🏢 DC Property and Land Layer ${layerId} (${layerName}) query for coordinates [${lat}, ${lon}] within ${cappedRadius} miles`
    );

    const results: DCPropertyAndLandFeature[] = [];
    const processedFeatureIds = new Set<number>();

    // Only perform point-in-polygon query for polygon layers
    if (isPolygonLayer) {
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

      console.log(`🔗 DC Property and Land Inside Query URL: ${insideQueryUrl.toString()}`);
      const insideResponse = await fetch(insideQueryUrl.toString());

      if (!insideResponse.ok) {
        throw new Error(
          `DC Property and Land API failed: ${insideResponse.status} ${insideResponse.statusText}`
        );
      }

      const insideData = await insideResponse.json();

      if (insideData.error) {
        throw new Error(
          `DC Property and Land API error: ${JSON.stringify(insideData.error)}`
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
    if (cappedRadius && cappedRadius > 0) {
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
          console.log(`🔗 DC Property and Land Nearby Query URL: ${nearbyQueryUrl.toString()}`);
        }

        const nearbyResponse = await fetch(nearbyQueryUrl.toString());

        if (!nearbyResponse.ok) {
          throw new Error(
            `DC Property and Land Nearby API failed: ${nearbyResponse.status} ${nearbyResponse.statusText}`
          );
        }

        const nearbyData = await nearbyResponse.json();

        if (nearbyData.error) {
          throw new Error(
            `DC Property and Land Nearby API error: ${JSON.stringify(nearbyData.error)}`
          );
        }

        const batchFeatures = nearbyData.features || [];
        allFeatures = allFeatures.concat(batchFeatures);

        // Check if there are more results
        hasMore = batchFeatures.length === batchSize || nearbyData.exceededTransferLimit === true;
        resultOffset += batchFeatures.length;

        // Safety check
        if (resultOffset > 100000) {
          console.warn('⚠️ DC Property and Land: Stopping pagination at 100k records for safety');
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
            if (isPolygonLayer && geometry.rings) {
              // Polygon - calculate distance to boundary
              distanceMiles = distanceToPolygon(lat, lon, geometry);
            } else if (isLineLayer && geometry.paths) {
              // Polyline - calculate distance to nearest point on line
              distanceMiles = pointToLineSegmentDistance(lat, lon, geometry.paths);
            } else if (isPointLayer && (geometry.x !== undefined && geometry.y !== undefined)) {
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
      `✅ Processed ${results.length} DC Property and Land Layer ${layerId} feature(s) (${results.filter(r => r.isContaining).length} containing, ${results.filter(r => !r.isContaining).length} nearby)`
    );

    return results;
  } catch (error) {
    console.error(`❌ DC Property and Land Layer ${layerId} API Error:`, error);
    throw error;
  }
}

