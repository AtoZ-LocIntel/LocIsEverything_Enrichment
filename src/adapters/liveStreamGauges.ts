import { fetchJSONSmart } from '../services/EnrichmentService';

export interface LiveStreamGaugeInfo {
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

export async function getLiveStreamGaugesData(
  lat: number,
  lon: number,
  radiusMiles = 25,
  layerName = 'USGS Stream Gauges (Live)'
): Promise<LiveStreamGaugeInfo[]> {
  const maxRadius = Math.max(0, Math.min(radiusMiles, 25));
  if (maxRadius === 0) return [];

  const pointGeometry = { x: lon, y: lat, spatialReference: { wkid: 4326 } };
  const distanceMeters = maxRadius * 1609.34;
  const url = `https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Live_Stream_Gauges_v1/FeatureServer/0/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${distanceMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=2000&resultOffset=0`;

  try {
    const data = await fetchJSONSmart(url) as any;
    if (data.error || !data.features) {
      console.error('❌ Live Stream Gauges API error:', data.error);
      return [];
    }

    return data.features.map((f: any) => {
      const attrs = f.attributes || {};
      const geom = f.geometry || {};
      const y = geom.y;
      const x = geom.x;
      const distance = haversineDistance(lat, lon, y, x);
      const containing = false; // points only, do not treat as containing
      return {
        objectId: attrs.OBJECTID || attrs.objectId || 0,
        attributes: attrs,
        geometry: { x, y },
        lat: y,
        lon: x,
        distance,
        containing,
        layerName
      };
    }).filter((item: LiveStreamGaugeInfo) => item.distance <= maxRadius);
  } catch (error) {
    console.error('❌ Error fetching Live Stream Gauges:', error);
    return [];
  }
}

