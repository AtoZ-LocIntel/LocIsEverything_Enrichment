/**
 * UK Built-Up Areas (December 2024) Adapter
 * Queries ONS Built-Up Areas 2024 polygon feature service
 * Supports point-in-polygon and proximity queries up to 25 miles
 *
 * Service: main_ONS_BUA_2024_EW (FeatureServer/0)
 * URL: https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/main_ONS_BUA_2024_EW/FeatureServer/0
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

export interface UKBuiltUpAreaInfo {
  objectId: number;
  gsscode: string | null;
  bua24cd: string | null;
  bua24nm: string | null;
  bua24nmw: string | null;
  areahectar: number | null;
  shapeArea: number | null;
  shapeLength: number | null;
  globalId: string | null;
  distance_miles?: number;
  isContaining?: boolean;
  geometry?: any;
  [key: string]: any;
}

function pointInRing(point: [number, number], ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > point[1]) !== (yj > point[1])) &&
      (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  if (!polygon || polygon.length === 0) return false;
  const outerRing = polygon[0].map((coord: number[]) => [coord[0], coord[1]] as [number, number]);
  if (!pointInRing(point, outerRing)) return false;
  for (let i = 1; i < polygon.length; i++) {
    const innerRing = polygon[i].map((coord: number[]) => [coord[0], coord[1]] as [number, number]);
    if (pointInRing(point, innerRing)) return false;
  }
  return true;
}

function pointInMultipolygon(point: [number, number], multipolygon: number[][][][]): boolean {
  if (!multipolygon || multipolygon.length === 0) return false;
  for (const polygon of multipolygon) {
    if (pointInPolygon(point, polygon)) return true;
  }
  return false;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function pointToLineSegmentDistance(
  pointLat: number,
  pointLon: number,
  segStartLat: number,
  segStartLon: number,
  segEndLat: number,
  segEndLon: number
): number {
  const d12 = haversineDistance(pointLat, pointLon, segStartLat, segStartLon);
  const d13 = haversineDistance(pointLat, pointLon, segEndLat, segEndLon);
  const d23 = haversineDistance(segStartLat, segStartLon, segEndLat, segEndLon);
  if (d23 < 0.0001) return d12;

  const dot1 = (segStartLat - pointLat) * (segEndLat - segStartLat) +
    (segStartLon - pointLon) * (segEndLon - segStartLon);
  const dot2 = (segEndLat - pointLat) * (segStartLat - segEndLat) +
    (segEndLon - pointLon) * (segStartLon - segEndLon);
  if (dot1 <= 0) return d12;
  if (dot2 <= 0) return d13;

  return Math.min(d12, d13);
}

function distanceToPolygon(
  pointLat: number,
  pointLon: number,
  polygon: number[][][]
): number {
  if (!polygon || polygon.length === 0) return Infinity;
  let minDistance = Infinity;

  for (const ring of polygon) {
    if (ring.length < 2) continue;
    for (let i = 0; i < ring.length; i++) {
      const start = ring[i];
      const end = ring[(i + 1) % ring.length];
      const segStartLon = start[0];
      const segStartLat = start[1];
      const segEndLon = end[0];
      const segEndLat = end[1];

      const distance = pointToLineSegmentDistance(
        pointLat,
        pointLon,
        segStartLat,
        segStartLon,
        segEndLat,
        segEndLon
      );
      minDistance = Math.min(minDistance, distance);
    }
  }

  return minDistance;
}

function distanceToMultipolygon(
  pointLat: number,
  pointLon: number,
  multipolygon: number[][][][]
): number {
  if (!multipolygon || multipolygon.length === 0) return Infinity;
  let minDistance = Infinity;
  for (const polygon of multipolygon) {
    const d = distanceToPolygon(pointLat, pointLon, polygon);
    minDistance = Math.min(minDistance, d);
  }
  return minDistance;
}

export async function getUKBuiltUpAreas2024Data(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<{
  containing: UKBuiltUpAreaInfo[];
  nearby_features: UKBuiltUpAreaInfo[];
  _all: UKBuiltUpAreaInfo[];
}> {
  const baseUrl =
    'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/main_ONS_BUA_2024_EW/FeatureServer/0';

  const containing: UKBuiltUpAreaInfo[] = [];
  const nearby_features: UKBuiltUpAreaInfo[] = [];
  const _all: UKBuiltUpAreaInfo[] = [];

  try {
    // Cap radius at 25 miles but allow 0-mile "pure" point-in-polygon queries
    const effectiveRadiusMiles = Math.min(radiusMiles || 0, 25.0);
    const radiusMeters = effectiveRadiusMiles * 1609.34;
    const pointGeometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };

    // First, query for features that INTERSECT the point on the server side.
    // Use esriSpatialRelIntersects here because this service is tuned for it;
    // we add a light client-side point-in-polygon check below rather than
    // over-constraining the server query.
    const containsUrl =
      `${baseUrl}/query?f=json&where=1=1&outFields=*&geometry=${encodeURIComponent(
        JSON.stringify(pointGeometry)
      )}` +
      // Intersects is what this service expects for point-in-polygon style queries.
      '&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects' +
      '&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=2000';

    const containsResponse = (await fetchJSONSmart(containsUrl)) as any;
    const seenObjectIds = new Set<number>();

    if (containsResponse && Array.isArray(containsResponse.features)) {
      for (const feature of containsResponse.features) {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;

        const info: UKBuiltUpAreaInfo = {
          objectId: attributes.FID || attributes.OBJECTID || attributes.ESRI_OID || 0,
          gsscode: attributes.gsscode || attributes.GSSCODE || null,
          bua24cd: attributes.BUA24CD || attributes.bua24cd || null,
          bua24nm: attributes.BUA24NM || attributes.bua24nm || null,
          bua24nmw: attributes.BUA24NMW || attributes.bua24nmw || null,
          areahectar:
            attributes.areahectar !== null && attributes.areahectar !== undefined
              ? Number(attributes.areahectar)
              : null,
          shapeArea:
            attributes.Shape__Area !== null && attributes.Shape__Area !== undefined
              ? Number(attributes.Shape__Area)
              : null,
          shapeLength:
            attributes.Shape__Length !== null && attributes.Shape__Length !== undefined
              ? Number(attributes.Shape__Length)
              : null,
          globalId: attributes.GlobalID || attributes.GLOBALID || null,
          geometry,
          distance_miles: 0,
          isContaining: true,
          ...attributes
        };

        containing.push(info);
        _all.push(info);
        seenObjectIds.add(info.objectId);
      }
    }

    // Only run proximity search if radius > 0 — but always run the containing query above
    if (effectiveRadiusMiles > 0) {
      const bufferGeometry = pointGeometry;

      const queryUrl =
        `${baseUrl}/query?f=json&where=1=1&outFields=*&geometry=${encodeURIComponent(
          JSON.stringify(bufferGeometry)
        )}` +
        '&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects' +
        `&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=2000`;

      let hasMore = true;
      let resultOffset = 0;
      const resultRecordCount = 2000;

      while (hasMore) {
        const url = `${queryUrl}&resultOffset=${resultOffset}`;
        const response = (await fetchJSONSmart(url)) as any;

        if (!response || !response.features || response.features.length === 0) {
          hasMore = false;
          break;
        }

        for (const feature of response.features) {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry;

          const info: UKBuiltUpAreaInfo = {
            objectId: attributes.FID || attributes.OBJECTID || attributes.ESRI_OID || 0,
            gsscode: attributes.gsscode || attributes.GSSCODE || null,
            bua24cd: attributes.BUA24CD || attributes.bua24cd || null,
            bua24nm: attributes.BUA24NM || attributes.bua24nm || null,
            bua24nmw: attributes.BUA24NMW || attributes.bua24nmw || null,
            areahectar:
              attributes.areahectar !== null && attributes.areahectar !== undefined
                ? Number(attributes.areahectar)
                : null,
            shapeArea:
              attributes.Shape__Area !== null && attributes.Shape__Area !== undefined
                ? Number(attributes.Shape__Area)
                : null,
            shapeLength:
              attributes.Shape__Length !== null && attributes.Shape__Length !== undefined
                ? Number(attributes.Shape__Length)
                : null,
            globalId: attributes.GlobalID || attributes.GLOBALID || null,
            geometry,
            ...attributes
          };

          // Skip features already added as containing from the server-side contains query
          if (seenObjectIds.has(info.objectId)) {
            continue;
          }

          let isContaining = false;
          if (geometry && geometry.rings) {
            if (
              Array.isArray(geometry.rings[0]) &&
              Array.isArray(geometry.rings[0][0]) &&
              !Array.isArray(geometry.rings[0][0][0])
            ) {
              isContaining = pointInPolygon([lon, lat], geometry.rings);
            } else if (
              Array.isArray(geometry.rings[0]) &&
              Array.isArray(geometry.rings[0][0]) &&
              Array.isArray(geometry.rings[0][0][0])
            ) {
              isContaining = pointInMultipolygon([lon, lat], geometry.rings);
            }
          }

          if (isContaining) {
            info.distance_miles = 0;
            info.isContaining = true;
            containing.push(info);
          } else {
            let distance = Infinity;
            if (geometry && geometry.rings) {
              if (
                Array.isArray(geometry.rings[0]) &&
                Array.isArray(geometry.rings[0][0]) &&
                !Array.isArray(geometry.rings[0][0][0])
              ) {
                distance = distanceToPolygon(lat, lon, geometry.rings);
              } else if (
                Array.isArray(geometry.rings[0]) &&
                Array.isArray(geometry.rings[0][0]) &&
                Array.isArray(geometry.rings[0][0][0])
              ) {
                distance = distanceToMultipolygon(lat, lon, geometry.rings);
              }
            }

            if (distance <= effectiveRadiusMiles) {
              info.distance_miles = distance;
              info.isContaining = false;
              nearby_features.push(info);
            }
          }

          _all.push(info);
        }

        if (
          response.exceededTransferLimit === true ||
          response.features.length === resultRecordCount
        ) {
          resultOffset += resultRecordCount;
        } else {
          hasMore = false;
        }
      }

      nearby_features.sort(
        (a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity)
      );
    }
  } catch (error) {
    console.error('Error fetching UK Built-Up Areas 2024 data:', error);
  }

  return { containing, nearby_features, _all };
}


