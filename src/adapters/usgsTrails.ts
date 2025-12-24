/**
 * Adapter for USGS Trails service
 * Service: https://partnerships.nationalmap.gov/arcgis/rest/services/USGSTrails/MapServer/0
 * Geometry Type: Polyline
 */

export interface USGSTrailFeature {
  objectid: number;
  name?: string;
  namealternate?: string;
  trailnumber?: string;
  trailtype?: string;
  nationaltraildesignation?: string;
  lengthmiles?: number;
  hikerpedestrian?: string;
  bicycle?: string;
  packsaddle?: string;
  atv?: string;
  motorcycle?: string;
  primarytrailmaintainer?: string;
  geometry?: any;
  distance_miles?: number;
}

/**
 * Calculate distance from a point to the nearest point on a polyline
 */
function distanceToPolyline(
  pointLat: number,
  pointLon: number,
  polylinePaths: number[][][]
): number {
  let minDistance = Infinity;

  for (const path of polylinePaths) {
    for (let i = 0; i < path.length - 1; i++) {
      const segmentStart = path[i];
      const segmentEnd = path[i + 1];

      // Calculate distance to line segment
      const distance = distanceToLineSegment(
        pointLat,
        pointLon,
        segmentStart[1], // lat
        segmentStart[0], // lon
        segmentEnd[1], // lat
        segmentEnd[0] // lon
      );

      minDistance = Math.min(minDistance, distance);
    }
  }

  return minDistance;
}

/**
 * Calculate distance from a point to a line segment
 */
function distanceToLineSegment(
  pointLat: number,
  pointLon: number,
  lineStartLat: number,
  lineStartLon: number,
  lineEndLat: number,
  lineEndLon: number
): number {
  const A = pointLon - lineStartLon;
  const B = pointLat - lineStartLat;
  const C = lineEndLon - lineStartLon;
  const D = lineEndLat - lineStartLat;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = lineStartLon;
    yy = lineStartLat;
  } else if (param > 1) {
    xx = lineEndLon;
    yy = lineEndLat;
  } else {
    xx = lineStartLon + param * C;
    yy = lineStartLat + param * D;
  }

  const dx = pointLon - xx;
  const dy = pointLat - yy;
  return Math.sqrt(dx * dx + dy * dy) * 69; // Convert to miles (rough approximation)
}

/**
 * Query USGS Trails within proximity of a point
 */
export async function getUSGSTrailsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSTrailFeature[]> {
  try {
    // Cap radius at 50 miles
    const cappedRadius = Math.min(radiusMiles || 50, 50);
    const radiusKm = cappedRadius * 1.60934;

    console.log(
      `🥾 USGS Trails query for coordinates [${lat}, ${lon}] within ${cappedRadius} miles`
    );

    // Query for trails within radius
    // Fetch all results using pagination (ArcGIS services have default maxRecordCount limits)
    let allTrails: any[] = [];
    let resultOffset = 0;
    const batchSize = 2000; // ArcGIS default, but we'll paginate to get all results
    let hasMore = true;

    while (hasMore) {
      const queryUrl = new URL('https://partnerships.nationalmap.gov/arcgis/rest/services/USGSTrails/MapServer/0/query');
      queryUrl.searchParams.set('f', 'json');
      queryUrl.searchParams.set('where', '1=1');
      queryUrl.searchParams.set('outFields', 'OBJECTID,name,namealternate,trailnumber,trailtype,nationaltraildesignation,lengthmiles,hikerpedestrian,bicycle,packsaddle,atv,motorcycle,primarytrailmaintainer');
      queryUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      queryUrl.searchParams.set('distance', radiusKm.toString());
      queryUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', batchSize.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      if (resultOffset === 0) {
        console.log(`🔗 USGS Trails Query URL: ${queryUrl.toString()}`);
      }
      const response = await fetch(queryUrl.toString());

      if (!response.ok) {
        throw new Error(
          `USGS Trails API failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(
          `USGS Trails API error: ${JSON.stringify(data.error)}`
        );
      }

      const batchFeatures = data.features || [];
      allTrails = allTrails.concat(batchFeatures);

      if (resultOffset === 0) {
        console.log(`📊 USGS Trails Query response:`, {
          featuresCount: batchFeatures.length,
          exceededTransferLimit: data.exceededTransferLimit,
          totalFetched: allTrails.length
        });
      }

      // Continue paginating if we got a full batch and there might be more
      hasMore = batchFeatures.length === batchSize || data.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      // Safety check to prevent infinite loops (shouldn't hit this with proximity queries)
      if (resultOffset > 100000) {
        console.warn('⚠️ USGS Trails: Stopping pagination at 100k records for safety');
        hasMore = false;
      }

      // Small delay between requests to avoid overwhelming the server
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Fetched ${allTrails.length} total USGS Trails features (no record limit - all within proximity)`);

    // Process features and calculate distances
    const processedTrails: USGSTrailFeature[] = allTrails.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;

        console.log(`🥾 Processing trail feature:`, {
          hasGeometry: !!geometry,
          hasPaths: !!geometry?.paths,
          pathsLength: geometry?.paths?.length,
          objectid: attributes.OBJECTID || attributes.objectid,
          name: attributes.name
        });

        let distanceMiles = cappedRadius; // Default to max radius

        // Calculate distance to polyline
        if (geometry && geometry.paths && geometry.paths.length > 0) {
          distanceMiles = distanceToPolyline(lat, lon, geometry.paths);
        }

        const processedTrail = {
          objectid: attributes.OBJECTID || attributes.objectid,
          name: attributes.name,
          namealternate: attributes.namealternate,
          trailnumber: attributes.trailnumber,
          trailtype: attributes.trailtype,
          nationaltraildesignation: attributes.nationaltraildesignation,
          lengthmiles: attributes.lengthmiles,
          hikerpedestrian: attributes.hikerpedestrian,
          bicycle: attributes.bicycle,
          packsaddle: attributes.packsaddle,
          atv: attributes.atv,
          motorcycle: attributes.motorcycle,
          primarytrailmaintainer: attributes.primarytrailmaintainer,
          geometry: geometry, // Preserve full geometry object
          distance_miles: distanceMiles,
        };

        console.log(`🥾 Processed trail:`, {
          name: processedTrail.name,
          hasGeometry: !!processedTrail.geometry,
          hasPaths: !!processedTrail.geometry?.paths
        });

        return processedTrail;
      }
    );

    // Sort by distance
    processedTrails.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${processedTrails.length} USGS Trails feature(s) within ${cappedRadius} miles`
    );

    return processedTrails;
  } catch (error) {
    console.error('❌ USGS Trails API Error:', error);
    throw error;
  }
}

