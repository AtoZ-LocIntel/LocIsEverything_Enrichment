import { fetchJSONSmart } from '../services/EnrichmentService';

export interface SeismicHazardFeature {
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

function polygonCentroid(rings: number[][][]): { lat: number; lon: number } | null {
  if (!rings || rings.length === 0) return null;
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  rings[0].forEach(coord => {
    if (coord && coord.length >= 2) {
      sumLon += coord[0];
      sumLat += coord[1];
      count++;
    }
  });
  if (count === 0) return null;
  return { lat: sumLat / count, lon: sumLon / count };
}

export async function getSeismicHazard2023Data(
  lat: number,
  lon: number,
  radiusMiles = 50,
  layerName = '2023 National Seismic Hazard Model'
): Promise<SeismicHazardFeature[]> {
  const cappedRadius = Math.max(0, Math.min(radiusMiles, 50));
  if (cappedRadius === 0) return [];

  const pointGeometry = { x: lon, y: lat, spatialReference: { wkid: 4326 } };
  const distanceMeters = cappedRadius * 1609.34;
  const base = 'https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/2023_National_Seismic_Hazard_Model/FeatureServer/0';
  const url = `${base}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${distanceMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=2000&resultOffset=0`;

  try {
    const data = await fetchJSONSmart(url) as any;
    if (data.error || !data.features) {
      console.error('❌ Seismic Hazard API error:', data.error);
      return [];
    }

    return data.features.map((f: any, idx: number) => {
      const attrs = f.attributes || {};
      const geom = f.geometry;
      let latVal: number | undefined;
      let lonVal: number | undefined;
      let distance: number | undefined;
      let containing: boolean | undefined;

      if (geom && Array.isArray(geom.rings)) {
        const cent = polygonCentroid(geom.rings);
        if (cent) {
          latVal = cent.lat;
          lonVal = cent.lon;
          distance = haversineDistance(lat, lon, latVal, lonVal);
          containing = distance < 0.01;
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
    }).filter((f: SeismicHazardFeature) => {
      if (f.distance !== undefined) return f.distance <= cappedRadius;
      return true;
    });
  } catch (error) {
    console.error('❌ Error fetching 2023 National Seismic Hazard Model:', error);
    return [];
  }
}

