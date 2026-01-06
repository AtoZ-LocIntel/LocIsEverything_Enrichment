/**
 * Adapter for NOAA US Maritime Limits and Boundaries MapServer
 * https://gis.charttools.noaa.gov/arcgis/rest/services/MaritimeBoundaries/US_Maritime_Limits_Boundaries/MapServer
 */

export interface NOAAMaritimeLimitsBoundariesFeature {
  objectid: number | null;
  geometry: any; // ArcGIS polyline geometry
  distance_miles: number | null;
  layerId: number;
  layerName: string;
  attributes: Record<string, any>;
}

const BASE_SERVICE_URL = 'https://gis.charttools.noaa.gov/arcgis/rest/services/MaritimeBoundaries/US_Maritime_Limits_Boundaries/MapServer';

const LAYER_NAMES: Record<number, string> = {
  0: 'Overview',
  1: '12NM Territorial Sea',
  2: '24NM Contiguous Zone',
  3: '200NM EEZ and Maritime Boundaries',
  4: 'US/Canada Land Boundary'
};

/**
 * Calculate distance from a point to a polyline (minimum distance to any segment)
 */
function calculateDistance(lat: number, lon: number, geometry: any): number | null {
  if (!geometry || !geometry.paths) return null;

  let minDistance = Infinity;

  geometry.paths.forEach((path: number[][]) => {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const dist = pointToLineSegmentDistance(lon, lat, p1[0], p1[1], p2[0], p2[1]);
      minDistance = Math.min(minDistance, dist);
    }
  });

  return minDistance === Infinity ? null : minDistance;
}

/**
 * Calculate distance from a point to a line segment
 */
function pointToLineSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const lineLengthSq = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (lineLengthSq === 0) return haversineDistance(py, px, y1, x1);

  const t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLengthSq;
  let closestX, closestY;

  if (t < 0) {
    closestX = x1;
    closestY = y1;
  } else if (t > 1) {
    closestX = x2;
    closestY = y2;
  } else {
    closestX = x1 + t * (x2 - x1);
    closestY = y1 + t * (y2 - y1);
  }

  return haversineDistance(py, px, closestY, closestX);
}

/**
 * Haversine distance formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query NOAA US Maritime Limits and Boundaries MapServer
 * @param layerId Layer ID (0-4)
 * @param lat Latitude
 * @param lon Longitude
 * @param radiusMiles Proximity radius in miles (max 250)
 * @returns Array of maritime limits/boundaries features
 */
export async function queryNOAAMaritimeLimitsBoundariesLayer(
  layerId: number,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAAMaritimeLimitsBoundariesFeature[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    const results: NOAAMaritimeLimitsBoundariesFeature[] = [];
    const maxRadius = Math.min(radiusMiles, 250); // Cap radius at 250 miles
    const radiusMeters = maxRadius * 1609.34;
    const layerName = LAYER_NAMES[layerId] || `Layer ${layerId}`;

    // Proximity query for polylines
    if (maxRadius > 0) {
      const proximityGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      const allProximityFeatures: any[] = [];
      let resultOffset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const proximityUrl = `${BASE_SERVICE_URL}/${layerId}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        const proximityData = await fetchJSONSmart(proximityUrl) as any;

        if (proximityData.error) {
          console.error(`❌ NOAA Maritime Limits and Boundaries API Error for layer ${layerId}:`, proximityData.error);
          break;
        }

        if (!proximityData.features || proximityData.features.length === 0) {
          hasMore = false;
          break;
        }

        allProximityFeatures.push(...proximityData.features);

        if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
          resultOffset += batchSize;
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }

      // Process proximity features and calculate distances
      allProximityFeatures.forEach((feature: any) => {
        const distance = calculateDistance(lat, lon, feature.geometry);
        if (distance !== null && distance <= maxRadius) {
          results.push({
            objectid: feature.attributes.OBJECTID || feature.attributes.objectid || null,
            geometry: feature.geometry,
            distance_miles: distance,
            layerId: layerId,
            layerName: layerName,
            attributes: feature.attributes,
          });
        }
      });
    }

    // Sort results by distance
    results.sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    return results;
  } catch (error) {
    console.error(`❌ Error fetching NOAA Maritime Limits and Boundaries data for layer ${layerId}:`, error);
    return [];
  }
}

// Export individual layer query functions
export async function queryNOAAMaritimeOverview(lat: number, lon: number, radiusMiles: number): Promise<NOAAMaritimeLimitsBoundariesFeature[]> {
  return queryNOAAMaritimeLimitsBoundariesLayer(0, lat, lon, radiusMiles);
}

export async function queryNOAAMaritime12NM(lat: number, lon: number, radiusMiles: number): Promise<NOAAMaritimeLimitsBoundariesFeature[]> {
  return queryNOAAMaritimeLimitsBoundariesLayer(1, lat, lon, radiusMiles);
}

export async function queryNOAAMaritime24NM(lat: number, lon: number, radiusMiles: number): Promise<NOAAMaritimeLimitsBoundariesFeature[]> {
  return queryNOAAMaritimeLimitsBoundariesLayer(2, lat, lon, radiusMiles);
}

export async function queryNOAAMaritime200NM(lat: number, lon: number, radiusMiles: number): Promise<NOAAMaritimeLimitsBoundariesFeature[]> {
  return queryNOAAMaritimeLimitsBoundariesLayer(3, lat, lon, radiusMiles);
}

export async function queryNOAAMaritimeUSCanadaBoundary(lat: number, lon: number, radiusMiles: number): Promise<NOAAMaritimeLimitsBoundariesFeature[]> {
  return queryNOAAMaritimeLimitsBoundariesLayer(4, lat, lon, radiusMiles);
}

