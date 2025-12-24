/**
 * Adapter for DC Bike Trails service
 * Service: https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_Bikes_Trails_WebMercator/MapServer
 * Supports multiple layers with proximity queries up to 5 miles
 */

const BASE_SERVICE_URL = 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_Bikes_Trails_WebMercator/MapServer';

export interface DCBikeTrailFeature {
  objectid: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry (polyline or point)
  distance_miles?: number; // Distance from query point
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
 * Query DC Bike Trails layer
 * Supports proximity queries up to 5 miles
 */
export async function getDCBikeTrailsData(
  layerId: number,
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<DCBikeTrailFeature[]> {
  try {
    // Cap radius at 5 miles
    const cappedRadius = radiusMiles ? Math.min(radiusMiles, 5.0) : 5.0;
    const radiusMeters = cappedRadius * 1609.34;

    console.log(
      `🚴 DC Bike Trails Layer ${layerId} query for coordinates [${lat}, ${lon}] within ${cappedRadius} miles`
    );

    // Query for features within radius with pagination
    let allFeatures: any[] = [];
    let resultOffset = 0;
    const batchSize = 2000;
    let hasMore = true;

    while (hasMore) {
      const queryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
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
      queryUrl.searchParams.set('distance', radiusMeters.toString());
      queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', batchSize.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      if (resultOffset === 0) {
        console.log(`🔗 DC Bike Trails Query URL (offset ${resultOffset}): ${queryUrl.toString()}`);
      }

      const response = await fetch(queryUrl.toString());

      if (!response.ok) {
        throw new Error(
          `DC Bike Trails API failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(
          `DC Bike Trails API error: ${JSON.stringify(data.error)}`
        );
      }

      const batchFeatures = data.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      // Check if there are more results
      hasMore = batchFeatures.length === batchSize || data.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      // Safety check
      if (resultOffset > 100000) {
        console.warn('⚠️ DC Bike Trails: Stopping pagination at 100k records for safety');
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Fetched ${allFeatures.length} total DC Bike Trails features for layer ${layerId}`);

    // Process features and calculate distances
    const processedFeatures: DCBikeTrailFeature[] = allFeatures.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      const objectid = attributes.OBJECTID || attributes.objectid || null;

      let distanceMiles = 0;

      if (geometry) {
        if (geometry.paths && geometry.paths.length > 0) {
          // Polyline - calculate distance to nearest point on line
          distanceMiles = pointToLineSegmentDistance(lat, lon, geometry.paths);
        } else if (geometry.x !== undefined && geometry.y !== undefined) {
          // Point - calculate direct distance
          distanceMiles = haversineDistance(lat, lon, geometry.y, geometry.x);
        } else if (geometry.points && geometry.points.length > 0) {
          // Multipoint - use first point
          const firstPoint = geometry.points[0];
          distanceMiles = haversineDistance(lat, lon, firstPoint[1], firstPoint[0]);
        }
      }

      return {
        objectid,
        attributes,
        geometry,
        distance_miles: distanceMiles
      };
    });

    // Sort by distance
    processedFeatures.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${processedFeatures.length} DC Bike Trails feature(s) within ${cappedRadius} miles for layer ${layerId}`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ DC Bike Trails Layer ${layerId} API Error:`, error);
    throw error;
  }
}

