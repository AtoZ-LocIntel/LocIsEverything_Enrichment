/**
 * Adapter for NOAA Weather Radar Impact Zones FeatureServer
 * https://coast.noaa.gov/arcgis/rest/services/Hosted/WeatherRadarImpactZones/FeatureServer/0
 */

export interface NOAAWeatherRadarImpactZoneFeature {
  objectid: number | null;
  siteidentifier?: string;
  sitename?: string;
  impactzone?: string;
  geometry: any; // ArcGIS polygon geometry
  distance_miles?: number | null;
  isContaining: boolean;
}

const BASE_SERVICE_URL = 'https://coast.noaa.gov/arcgis/rest/services/Hosted/WeatherRadarImpactZones/FeatureServer/0';

/**
 * Calculate distance from a point to a polygon (minimum distance to any edge)
 */
function calculateDistance(lat: number, lon: number, geometry: any): number | null {
  if (!geometry || !geometry.rings) return null;

  let minDistance = Infinity;

  geometry.rings.forEach((ring: number[][]) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
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
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, geometry: any): boolean {
  if (!geometry || !geometry.rings || geometry.rings.length === 0) return false;

  // Use the first ring (exterior ring) for point-in-polygon check
  const ring = geometry.rings[0];
  if (!ring || ring.length < 3) return false;

  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat)) &&
                     (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Query NOAA Weather Radar Impact Zones FeatureServer
 * @param lat Latitude
 * @param lon Longitude
 * @param radiusMiles Proximity radius in miles (max 50)
 * @returns Array of weather radar impact zone features
 */
export async function queryNOAAWeatherRadarImpactZones(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NOAAWeatherRadarImpactZoneFeature[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    const results: NOAAWeatherRadarImpactZoneFeature[] = [];
    const maxRadius = Math.min(radiusMiles, 50); // Cap radius at 50 miles
    const radiusMeters = maxRadius * 1609.34;

    // 1. Point-in-polygon query
    let containingFeatures: NOAAWeatherRadarImpactZoneFeature[] = [];
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;

      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        containingFeatures = pointInPolyData.features.map((feature: any) => ({
          objectid: feature.attributes.OBJECTID || feature.attributes.objectid_ || null,
          siteidentifier: feature.attributes.siteidentifier || feature.attributes.SiteIdentifier || null,
          sitename: feature.attributes.sitename || feature.attributes.SiteName || null,
          impactzone: feature.attributes.impactzone || feature.attributes.ImpactZone || null,
          geometry: feature.geometry,
          isContaining: true,
        }));
        results.push(...containingFeatures);
      }
    } catch (error) {
      console.error('❌ Error during point-in-polygon query for NOAA Weather Radar Impact Zones:', error);
    }

    // 2. Proximity query (if radius > 0)
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
        const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        const proximityData = await fetchJSONSmart(proximityUrl) as any;

        if (proximityData.error) {
          console.error('❌ NOAA Weather Radar Impact Zones API Error:', proximityData.error);
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

      // Process proximity features, filter out duplicates from point-in-polygon
      allProximityFeatures.forEach((feature: any) => {
        const featureObjectId = feature.attributes.OBJECTID || feature.attributes.objectid_ || null;
        const isDuplicate = containingFeatures.some(cf => cf.objectid === featureObjectId);
        if (!isDuplicate) {
          const distance = calculateDistance(lat, lon, feature.geometry);
          if (distance !== null && distance <= maxRadius) {
            results.push({
              objectid: featureObjectId,
              siteidentifier: feature.attributes.siteidentifier || feature.attributes.SiteIdentifier || null,
              sitename: feature.attributes.sitename || feature.attributes.SiteName || null,
              impactzone: feature.attributes.impactzone || feature.attributes.ImpactZone || null,
              geometry: feature.geometry,
              distance_miles: distance,
              isContaining: false,
            });
          }
        }
      });
    }

    // Sort results by distance
    results.sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    return results;
  } catch (error) {
    console.error('❌ Error fetching NOAA Weather Radar Impact Zones data:', error);
    return [];
  }
}

