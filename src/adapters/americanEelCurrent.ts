/**
 * American Eel Current Range Adapter
 * Queries American Eel Current Range polygons from ArcGIS FeatureServer
 * Supports point-in-polygon and proximity queries up to 50 miles
 * Layer: AE_Current (Layer 0) - Polygons
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/QVENGdaPbd4LUkLV/arcgis/rest/services/AmericanEelCurrent/FeatureServer';
const LAYER_ID = 0;

export interface AmericanEelCurrentInfo {
  objectid: number | null;
  region: string | null;
  subregion: string | null;
  basin: string | null;
  subbasin: string | null;
  huc8: string | null;
  acres: number | null;
  sqMiles: number | null;
  geometry?: any; // ESRI polygon geometry (rings)
  distance_miles?: number;
  isContaining?: boolean;
  attributes: Record<string, any>;
}

/**
 * Calculate distance from a point to the nearest point on a polygon boundary
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) {
    return Infinity;
  }

  const outerRing = rings[0];
  if (!outerRing || outerRing.length === 0) {
    return Infinity;
  }

  let minDistance = Infinity;

  // Check distance to each edge of the polygon
  for (let i = 0; i < outerRing.length; i++) {
    const p1 = outerRing[i];
    const p2 = outerRing[(i + 1) % outerRing.length];
    
    // Calculate distance from point to line segment
    const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
    minDistance = Math.min(minDistance, dist);
  }

  return minDistance;
}

/**
 * Calculate distance from a point to a line segment
 */
function distanceToLineSegment(
  pointLat: number,
  pointLon: number,
  lineLat1: number,
  lineLon1: number,
  lineLat2: number,
  lineLon2: number
): number {
  // Convert to radians
  const toRad = (deg: number) => deg * Math.PI / 180;
  const lat1 = toRad(lineLat1);
  const lon1 = toRad(lineLon1);
  const lat2 = toRad(lineLat2);
  const lon2 = toRad(lineLon2);
  const pointLatRad = toRad(pointLat);
  const pointLonRad = toRad(pointLon);

  // Calculate the length of the line segment
  const segmentLength = haversineDistance(lineLat1, lineLon1, lineLat2, lineLon2);

  if (segmentLength === 0) {
    return haversineDistance(pointLat, pointLon, lineLat1, lineLon1);
  }

  // Calculate the projection of the point onto the line segment
  const t = Math.max(0, Math.min(1, 
    ((pointLatRad - lat1) * (lat2 - lat1) + (pointLonRad - lon1) * (lon2 - lon1)) / (segmentLength * segmentLength)
  ));

  // Calculate the closest point on the line segment
  const closestLat = lat1 + t * (lat2 - lat1);
  const closestLon = lon1 + t * (lon2 - lon1);

  // Convert back to degrees
  const closestLatDeg = closestLat * 180 / Math.PI;
  const closestLonDeg = closestLon * 180 / Math.PI;

  // Calculate distance to closest point
  return haversineDistance(pointLat, pointLon, closestLatDeg, closestLonDeg);
}

/**
 * Calculate Haversine distance between two points
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) {
    return false;
  }

  const outerRing = rings[0];
  if (!outerRing || outerRing.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0];
    const yi = outerRing[i][1];
    const xj = outerRing[j][0];
    const yj = outerRing[j][1];

    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Query American Eel Current Range for point-in-polygon and proximity
 * Supports proximity queries up to 50 miles
 */
export async function getAmericanEelCurrentData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<AmericanEelCurrentInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');

    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;

    if (maxRadius <= 0) {
      return [];
    }

    const results: AmericanEelCurrentInfo[] = [];
    const processedIds = new Set<number>();

    // Point-in-polygon query
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };

      const pipUrl = `${BASE_SERVICE_URL}/${LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;

      console.log(`🐟 Querying American Eel Current Range for point-in-polygon at [${lat}, ${lon}]`);

      const pipData = await fetchJSONSmart(pipUrl) as any;

      if (pipData.error) {
        console.error('❌ American Eel Current Range API Error:', pipData.error);
      } else if (pipData.features && pipData.features.length > 0) {
        pipData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || {};
          const rings = geometry.rings || [];

          if (rings.length > 0) {
            const objectid = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID : null;

            if (objectid !== null && !processedIds.has(objectid)) {
              const region = attributes.REGION || attributes.region || null;
              const subregion = attributes.SUBREGION || attributes.subregion || null;
              const basin = attributes.BASIN || attributes.basin || null;
              const subbasin = attributes.SUBBASIN || attributes.subbasin || null;
              const huc8 = attributes.HUC_8 || attributes.huc_8 || attributes.HUC8_dbl || null;
              const acres = attributes.ACRES !== null && attributes.ACRES !== undefined ? attributes.ACRES : null;
              const sqMiles = attributes.SQ_MILES !== null && attributes.SQ_MILES !== undefined ? attributes.SQ_MILES : null;

              results.push({
                objectid: objectid,
                region: region,
                subregion: subregion,
                basin: basin,
                subbasin: subbasin,
                huc8: huc8,
                acres: acres,
                sqMiles: sqMiles,
                geometry: geometry,
                distance_miles: 0,
                isContaining: true,
                attributes: attributes
              });

              processedIds.add(objectid);
            }
          }
        });

        console.log(`✅ Found ${results.length} American Eel Current Range feature(s) containing the point`);
      }
    } catch (error) {
      console.error('❌ Point-in-polygon query failed for American Eel Current Range:', error);
    }

    // Proximity query with pagination
    try {
      const radiusMeters = maxRadius * 1609.34;
      const proximityGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };

      const allFeatures: any[] = [];
      let resultOffset = 0;
      const batchSize = 2000; // MaxRecordCount for this service
      let hasMore = true;

      while (hasMore) {
        const proximityUrl = `${BASE_SERVICE_URL}/${LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;

        if (resultOffset === 0) {
          console.log(`🐟 Querying American Eel Current Range for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
        }

        const proximityData = await fetchJSONSmart(proximityUrl) as any;

        if (proximityData.error) {
          console.error('❌ American Eel Current Range API Error:', proximityData.error);
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

      console.log(`✅ Fetched ${allFeatures.length} total American Eel Current Range features for proximity`);

      // Process all features and calculate accurate distances
      allFeatures.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || {};
        const rings = geometry.rings || [];

        if (rings.length > 0) {
          const objectid = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID : null;

          // Skip if already processed (point-in-polygon result)
          if (objectid !== null && processedIds.has(objectid)) {
            return;
          }

          // Calculate accurate distance from point to polygon
          const distance = distanceToPolygon(lat, lon, rings);

          // Only include features within the specified radius
          if (distance <= maxRadius) {
            const region = attributes.REGION || attributes.region || null;
            const subregion = attributes.SUBREGION || attributes.subregion || null;
            const basin = attributes.BASIN || attributes.basin || null;
            const subbasin = attributes.SUBBASIN || attributes.subbasin || null;
            const huc8 = attributes.HUC_8 || attributes.huc_8 || attributes.HUC8_dbl || null;
            const acres = attributes.ACRES !== null && attributes.ACRES !== undefined ? attributes.ACRES : null;
            const sqMiles = attributes.SQ_MILES !== null && attributes.SQ_MILES !== undefined ? attributes.SQ_MILES : null;

            // Check if point is inside polygon
            const isContaining = pointInPolygon(lat, lon, rings);

            results.push({
              objectid: objectid,
              region: region,
              subregion: subregion,
              basin: basin,
              subbasin: subbasin,
              huc8: huc8,
              acres: acres,
              sqMiles: sqMiles,
              geometry: geometry,
              distance_miles: distance,
              isContaining: isContaining,
              attributes: attributes
            });

            if (objectid !== null) {
              processedIds.add(objectid);
            }
          }
        }
      });

      // Sort by distance (containing polygons first, then by distance)
      results.sort((a, b) => {
        if (a.isContaining && !b.isContaining) return -1;
        if (!a.isContaining && b.isContaining) return 1;
        return (a.distance_miles || 0) - (b.distance_miles || 0);
      });

      console.log(`✅ Found ${results.length} American Eel Current Range feature(s) within ${maxRadius} miles`);
    } catch (error) {
      console.error('❌ Proximity query failed for American Eel Current Range:', error);
    }

    return results;
  } catch (error) {
    console.error('❌ Error querying American Eel Current Range data:', error);
    return [];
  }
}

