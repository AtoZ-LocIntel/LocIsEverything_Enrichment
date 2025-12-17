import { fetchJSONSmart } from '../services/EnrichmentService';

interface TornadoTrackFeature {
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
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function centroidFromPaths(paths: number[][][]): { lat: number; lon: number } | null {
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  for (const path of paths) {
    for (const coord of path) {
      if (coord.length >= 2) {
        sumLon += coord[0];
        sumLat += coord[1];
        count++;
      }
    }
  }
  if (count === 0) return null;
  return { lat: sumLat / count, lon: sumLon / count };
}

export async function getTornadoTracksData(
  lat: number,
  lon: number,
  layerName = 'Tornado Tracks 1950-2017',
  radiusMiles = 50
): Promise<TornadoTrackFeature[]> {
  const cappedRadius = Math.min(Math.max(radiusMiles, 0), 50);
  const pointGeometry = { x: lon, y: lat, spatialReference: { wkid: 4326 } };
  const base = 'https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/Tornado_Tracks_1950_2017_1/FeatureServer/0';
  const params = [
    'f=json',
    'where=1%3D1',
    'outFields=*',
    `geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}`,
    'geometryType=esriGeometryPoint',
    'spatialRel=esriSpatialRelIntersects',
    `distance=${cappedRadius * 1609.34}`,
    'units=esriSRUnit_Meter',
    'inSR=4326',
    'outSR=4326',
    'returnGeometry=true',
    'resultRecordCount=2000',
    'resultOffset=0'
  ];
  const url = `${base}/query?${params.join('&')}`;

  try {
    const data = await fetchJSONSmart(url) as any;
    if (data.error || !data.features) {
      console.error('❌ Tornado Tracks API error:', data.error);
      return [];
    }

    return data.features.map((f: any, idx: number) => {
      const attrs = f.attributes || {};
      const geom = f.geometry;
      let latVal: number | undefined;
      let lonVal: number | undefined;
      let distance: number | undefined;
      let containing = false;

      if (geom && Array.isArray(geom.paths)) {
        const cent = centroidFromPaths(geom.paths);
        if (cent) {
          lonVal = cent.lon;
          latVal = cent.lat;
          distance = haversineDistance(lat, lon, latVal, lonVal);
        }
      }

      return {
        objectId: attrs.OBJECTID || attrs.objectId || idx,
        attributes: attrs,
        geometry: geom,
        lat: latVal,
        lon: lonVal,
        distance,
        containing,
        layerName
      };
    }).filter((f: TornadoTrackFeature) => {
      if (f.distance !== undefined) {
        return f.distance <= cappedRadius;
      }
      return true;
    });
  } catch (error) {
    console.error('❌ Error fetching Tornado Tracks data:', error);
    return [];
  }
}

