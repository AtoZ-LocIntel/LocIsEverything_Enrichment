import { fetchJSONSmart } from '../services/EnrichmentService';

export interface NWSStreamGaugeInfo {
  objectId: number;
  attributes: Record<string, any>;
  geometry: { x: number; y: number };
  lat: number;
  lon: number;
  distance: number;
  containing: boolean;
  layerName: string;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getNWSStreamGaugesData(
  lat: number,
  lon: number,
  layerName: string,
  serviceUrl: string,
  radiusMiles = 25
): Promise<NWSStreamGaugeInfo[]> {
  try {
    const results: NWSStreamGaugeInfo[] = [];
    const maxRadius = Math.min(radiusMiles, 25);
    const radiusMeters = maxRadius * 1609.34;
    const pointGeometry = { x: lon, y: lat, spatialReference: { wkid: 4326 } };

    let resultOffset = 0;
    const batchSize = 2000;
    let hasMore = true;

    while (hasMore) {
      const queryUrl = `${serviceUrl}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
      if (resultOffset === 0) {
        console.log(`🌊 Querying ${layerName} within ${maxRadius} miles at [${lat}, ${lon}]`);
        console.log(`🔗 Stream Gauges URL: ${queryUrl}`);
      }

      const data = await fetchJSONSmart(queryUrl) as any;
      if (data.error) {
        console.error(`❌ Stream Gauges API Error:`, data.error);
        break;
      }
      if (!data.features || data.features.length === 0) {
        hasMore = false;
        break;
      }

      data.features.forEach((feature: any, featureIndex: number) => {
        const attrs = feature.attributes || {};
        const geom = feature.geometry;
        if (!geom || geom.x === undefined || geom.y === undefined) return;

        const pointLon = geom.x;
        const pointLat = geom.y;
        const distance = haversineDistance(lat, lon, pointLat, pointLon);
        if (distance > maxRadius) return;

        results.push({
          objectId: attrs.OBJECTID || attrs.objectId || featureIndex,
          attributes: attrs,
          geometry: { x: pointLon, y: pointLat },
          lat: pointLat,
          lon: pointLon,
          distance,
          containing: distance < 0.01,
          layerName
        });
      });

      if (data.exceededTransferLimit === true || data.features.length === batchSize) {
        resultOffset += batchSize;
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Found ${results.length} ${layerName} feature(s)`);
    return results;
  } catch (error) {
    console.error(`❌ Error querying ${layerName}:`, error);
    return [];
  }
}

