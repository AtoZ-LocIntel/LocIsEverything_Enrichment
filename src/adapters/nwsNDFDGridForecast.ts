import { fetchJSONSmart } from '../services/EnrichmentService';

export interface NWSNDFDGridForecastInfo {
  objectId: number;
  attributes: Record<string, any>;
  geometry: any;
  lat?: number;
  lon?: number;
  distance?: number;
  containing?: boolean;
  layerName: string;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function webMercatorToWGS84(x: number, y: number): { lat: number; lon: number } {
  const lon = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
  return { lat, lon };
}

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
  return { lat: sumLat / count, lon: sumLon / count };
}

export async function getNWSNDFDGridForecastData(
  lat: number,
  lon: number,
  layerName: string,
  serviceUrl: string,
  maxRadiusMiles = 100,
  polygonsOnly = false
): Promise<NWSNDFDGridForecastInfo[]> {
  try {
    const results: NWSNDFDGridForecastInfo[] = [];
    const pointGeometry = { x: lon, y: lat, spatialReference: { wkid: 4326 } };
    const radiusMeters = Math.max(0, Math.min(maxRadiusMiles, 100)) * 1609.34;

    if (radiusMeters === 0) return [];

    // Query with distance for proximity + intersects for containing
    let resultOffset = 0;
    const batchSize = 2000;
    let hasMore = true;

    while (hasMore) {
      const queryUrl = `${serviceUrl}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;

      if (resultOffset === 0) {
        console.log(`🌨️ Querying NWS ${layerName} within ${maxRadiusMiles} miles at [${lat}, ${lon}]`);
        console.log(`🔗 NWS NDFD Grid Forecast Query URL: ${queryUrl}`);
      }

      const data = await fetchJSONSmart(queryUrl) as any;

      if (data.error) {
        console.error(`❌ NWS ${layerName} API Error:`, data.error);
        if (resultOffset === 0) console.error(`❌ Full error details:`, JSON.stringify(data.error, null, 2));
        break;
      }

      if (!data.features || data.features.length === 0) {
        hasMore = false;
        break;
      }

      data.features.forEach((feature: any, featureIndex: number) => {
        const attrs = feature.attributes || {};
        const geom = feature.geometry;
        if (!geom) return;

        // Skip non-polygon geometries when polygonsOnly is true
        if (polygonsOnly && !geom.rings) {
          console.warn(`🥶 polygonsOnly enabled; skipping non-polygon geometry for ${layerName} (feature ${featureIndex})`);
          return;
        }

        if (geom.x !== undefined && geom.y !== undefined && !polygonsOnly) {
          let pointLon = geom.x;
          let pointLat = geom.y;
          const isWebMercator = Math.abs(pointLon) > 180 || Math.abs(pointLat) > 90;
          if (isWebMercator) {
            const wgs = webMercatorToWGS84(pointLon, pointLat);
            pointLon = wgs.lon;
            pointLat = wgs.lat;
          }
          const distance = haversineDistance(lat, lon, pointLat, pointLon);
          const containing = distance < 0.01;
          if (distance <= maxRadiusMiles) {
            results.push({
              objectId: attrs.OBJECTID || attrs.objectId || featureIndex,
              attributes: attrs,
              geometry: { ...geom, x: pointLon, y: pointLat },
              lat: pointLat,
              lon: pointLon,
              distance,
              containing,
              layerName
            });
          }
        } else if (geom.rings) {
          const firstCoord = geom.rings[0]?.[0];
          const isWebMercator = firstCoord && (Math.abs(firstCoord[0]) > 180 || Math.abs(firstCoord[1]) > 90);
          const ringsWGS84 = geom.rings.map((ring: number[][]) =>
            ring.map((coord: number[]) => {
              if (isWebMercator) {
                const wgs = webMercatorToWGS84(coord[0], coord[1]);
                return [wgs.lon, wgs.lat];
              }
              return [coord[0], coord[1]];
            })
          );
          const centroid = calculateCentroid(ringsWGS84);
          let distance: number | undefined;
          if (centroid) {
            distance = haversineDistance(lat, lon, centroid.lat, centroid.lon);
          }
          if (distance === undefined || distance <= maxRadiusMiles) {
            // Ensure we drop any point properties from geometry to avoid point rendering downstream
            results.push({
              objectId: attrs.OBJECTID || attrs.objectId || featureIndex,
              attributes: attrs,
              // keep only rings to avoid point artifacts
              geometry: { rings: ringsWGS84 },
              lat: centroid?.lat,
              lon: centroid?.lon,
              distance,
              containing: distance !== undefined ? distance < 0.01 : undefined,
              layerName
            });
          }
        }
      });

      if (data.exceededTransferLimit === true || data.features.length === batchSize) {
        resultOffset += batchSize;
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Found ${results.length} NWS ${layerName} feature(s)`);
    return results;
  } catch (error) {
    console.error(`❌ Error querying NWS ${layerName} data:`, error);
    return [];
  }
}

