import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://gis.cookcountyil.gov/traditional/rest/services/buildingFootprint_2022/MapServer/0';

export interface CookCountyBuildingFootprintInfo {
  objectId: number;
  areaSqft: number;
  year: string;
  groundZ: number;
  maxPoint: number;
  height: number;
  shapeArea: number;
  shapeLength: number;
  geometry: any; // ESRI polygon geometry
  lat?: number;
  lon?: number;
  distance?: number;
  containing?: boolean; // True if point is within polygon
  attributes: Record<string, any>;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;

  const outerRing = rings[0];
  let inside = false;

  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0];
    const yi = outerRing[i][1];
    const xj = outerRing[j][0];
    const yj = outerRing[j][1];

    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate distance from point to nearest edge of polygon
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;

  if (pointInPolygon(lat, lon, rings)) {
    return 0;
  }

  let minDistance = Infinity;
  const outerRing = rings[0];

  for (let i = 0; i < outerRing.length; i++) {
    const j = (i + 1) % outerRing.length;
    const x1 = outerRing[i][0];
    const y1 = outerRing[i][1];
    const x2 = outerRing[j][0];
    const y2 = outerRing[j][1];

    const dist = distanceToLineSegment(lon, lat, x1, y1, x2, y2);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    const dx2 = px - x1;
    const dy2 = py - y1;
    return Math.sqrt(dx2 * dx2 + dy2 * dy2) * 69;
  }

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  const dx2 = px - projX;
  const dy2 = py - projY;
  const distanceDegrees = Math.sqrt(dx2 * dx2 + dy2 * dy2);

  return distanceDegrees * 69;
}

/**
 * Create a geodesic circle polygon in WGS84 for spatial query.
 * Uses degree offsets that account for longitude compression at latitude,
 * yielding a circular search area instead of an elliptical one from point+distance.
 */
function createCirclePolygon(centerLat: number, centerLon: number, radiusMiles: number): { rings: number[][][]; spatialReference: { wkid: number } } {
  const radiusMeters = radiusMiles * 1609.34;
  const numPoints = 64; // Smooth circle
  const circlePoints: number[][] = [];
  const centerLatRad = (centerLat * Math.PI) / 180;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI; // angle from North, clockwise
    // Meters to degrees: 1° lat ≈ 111320m; 1° lon ≈ 111320*cos(lat) m
    const latOffset = (radiusMeters / 111320) * Math.cos(angle);
    const lonOffset = (radiusMeters / (111320 * Math.cos(centerLatRad))) * Math.sin(angle);
    circlePoints.push([centerLon + lonOffset, centerLat + latOffset]);
  }
  circlePoints.push(circlePoints[0]); // Close the ring

  return {
    rings: [circlePoints],
    spatialReference: { wkid: 4326 }
  };
}

/**
 * Calculate polygon centroid
 */
function calculateCentroid(rings: number[][][]): { lat: number; lon: number } | null {
  if (!rings || rings.length === 0) return null;

  const outerRing = rings[0];
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;

  for (const coord of outerRing) {
    if (coord && coord.length >= 2) {
      sumLon += coord[0];
      sumLat += coord[1];
      count++;
    }
  }

  if (count === 0) return null;

  return {
    lat: sumLat / count,
    lon: sumLon / count
  };
}

/**
 * Query Cook County Building Footprints (2022) for point-in-polygon and proximity
 * Supports proximity queries from 0.25 to 1 mile
 */
export async function getCookCountyBuildingFootprintsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<CookCountyBuildingFootprintInfo[]> {
  try {
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 1.0) : 1.0;

    const results: CookCountyBuildingFootprintInfo[] = [];

    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };

      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;

      console.log(`🏢 Querying Cook County Building Footprints for point-in-polygon at [${lat}, ${lon}]`);

      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;

      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const rings = feature.geometry?.rings;
          if (rings && pointInPolygon(lat, lon, rings)) {
            const centroid = calculateCentroid(rings);
            const attrs = feature.attributes || {};
            results.push({
              objectId: attrs.OBJECTID || attrs.objectId || 0,
              areaSqft: attrs.Area_SQFT ?? attrs.area_sqft ?? 0,
              year: attrs.Year ?? attrs.year ?? '',
              groundZ: attrs.Ground_Z ?? attrs.ground_z ?? 0,
              maxPoint: attrs.Max_Point ?? attrs.max_point ?? 0,
              height: attrs.Height ?? attrs.height ?? 0,
              shapeArea: attrs.SHAPE_Area ?? attrs.shapeArea ?? 0,
              shapeLength: attrs.SHAPE_Length ?? attrs.shapeLength ?? 0,
              geometry: feature.geometry,
              lat: centroid?.lat,
              lon: centroid?.lon,
              distance: 0,
              containing: true,
              attributes: attrs
            });
          }
        });

        console.log(`✅ Found ${results.length} Cook County Building Footprint(s) containing the point`);
      }
    } catch (error) {
      console.error(`❌ Point-in-polygon query failed:`, error);
    }

    // Proximity query - use circle polygon instead of point+distance to avoid
    // elliptical buffer when layer CRS (Illinois State Plane) differs from WGS84
    if (maxRadius > 0) {
      try {
        const circleGeometry = createCirclePolygon(lat, lon, maxRadius);

        const allFeatures: any[] = [];
        let resultOffset = 0;
        const batchSize = 2000;
        let hasMore = true;

        while (hasMore) {
          const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(circleGeometry))}&geometryType=esriGeometryPolygon&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;

          if (resultOffset === 0) {
            console.log(`🏢 Querying Cook County Building Footprints for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }

          const proximityData = await fetchJSONSmart(proximityUrl) as any;

          if (proximityData.error) {
            console.error('❌ Cook County Building Footprints API Error:', proximityData.error);
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

        console.log(`✅ Fetched ${allFeatures.length} total Cook County Building Footprints for proximity`);

        allFeatures.forEach((feature: any) => {
          const rings = feature.geometry?.rings;
          if (!rings) return;

          const attrs = feature.attributes || {};
          const objectId = attrs.OBJECTID || attrs.objectId || 0;
          const alreadyAdded = results.some(r => r.objectId === objectId && r.containing);

          if (!alreadyAdded) {
            const distance = distanceToPolygon(lat, lon, rings);
            const centroid = calculateCentroid(rings);

            if (distance <= maxRadius) {
              results.push({
                objectId,
                areaSqft: attrs.Area_SQFT ?? attrs.area_sqft ?? 0,
                year: attrs.Year ?? attrs.year ?? '',
                groundZ: attrs.Ground_Z ?? attrs.ground_z ?? 0,
                maxPoint: attrs.Max_Point ?? attrs.max_point ?? 0,
                height: attrs.Height ?? attrs.height ?? 0,
                shapeArea: attrs.SHAPE_Area ?? attrs.shapeArea ?? 0,
                shapeLength: attrs.SHAPE_Length ?? attrs.shapeLength ?? 0,
                geometry: feature.geometry,
                lat: centroid?.lat,
                lon: centroid?.lon,
                distance,
                containing: false,
                attributes: attrs
              });
            }
          }
        });

        console.log(`✅ Found ${results.filter(r => !r.containing).length} Cook County Building Footprint(s) within ${maxRadius} miles`);
      } catch (error) {
        console.error(`❌ Proximity query failed:`, error);
      }
    }

    results.sort((a, b) => {
      if (a.containing && !b.containing) return -1;
      if (!a.containing && b.containing) return 1;
      return (a.distance || 0) - (b.distance || 0);
    });

    return results;
  } catch (error) {
    console.error('❌ Error querying Cook County Building Footprints data:', error);
    return [];
  }
}
