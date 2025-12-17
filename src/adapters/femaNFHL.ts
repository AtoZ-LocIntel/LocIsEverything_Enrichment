import { fetchJSONSmart } from '../services/EnrichmentService';

export interface FemaNFHLFeature {
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
  paths.forEach(path => {
    path.forEach(coord => {
      if (coord.length >= 2) {
        sumLon += coord[0];
        sumLat += coord[1];
        count++;
      }
    });
  });
  if (count === 0) return null;
  return { lat: sumLat / count, lon: sumLon / count };
}

export async function getFemaNFHLData(
  lat: number,
  lon: number,
  layerId: number,
  layerName: string,
  isPointLayer: boolean,
  radiusMiles = 10,
  isLineProximity = false
): Promise<FemaNFHLFeature[]> {
  const pointGeometry = { x: lon, y: lat, spatialReference: { wkid: 4326 } };
  const base = 'https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer';
  const distanceMeters = isPointLayer ? Math.min(radiusMiles, 10) * 1609.34 : undefined;
  const params = [
    'f=json',
    'where=1%3D1',
    'outFields=*',
    `geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}`,
    'geometryType=esriGeometryPoint',
    'spatialRel=esriSpatialRelIntersects',
    'inSR=4326',
    'outSR=4326',
    'returnGeometry=true',
    'resultRecordCount=2000',
    'resultOffset=0'
  ];
  if (distanceMeters !== undefined) {
    params.push(`distance=${distanceMeters}`, 'units=esriSRUnit_Meter');
  }
  const url = `${base}/${layerId}/query?${params.join('&')}`;

  try {
    const data = await fetchJSONSmart(url) as any;
    if (data.error || !data.features) {
      console.error(`❌ FEMA NFHL API error for ${layerName}:`, data.error);
      return [];
    }

    return data.features.map((f: any, idx: number) => {
      const attrs = f.attributes || {};
      const geom = f.geometry;
      let latVal: number | undefined;
      let lonVal: number | undefined;
      let distance: number | undefined;
      let containing: boolean | undefined;

      if (isPointLayer && geom && typeof geom.x === 'number' && typeof geom.y === 'number') {
        lonVal = geom.x;
        latVal = geom.y;
        if (latVal !== undefined && lonVal !== undefined) {
          distance = haversineDistance(lat, lon, latVal, lonVal);
          containing = distance < 0.01;
        }
      } else if (isLineProximity && geom && Array.isArray(geom.paths)) {
        const cent = centroidFromPaths(geom.paths);
        if (cent) {
          latVal = cent.lat;
          lonVal = cent.lon;
          if (latVal !== undefined && lonVal !== undefined) {
            distance = haversineDistance(lat, lon, latVal, lonVal);
            containing = false;
          }
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
    }).filter((f: FemaNFHLFeature) => {
      const maxR = radiusMiles || 10;
      if ((isPointLayer || isLineProximity) && f.distance !== undefined) {
        return f.distance <= maxR;
      }
      return true;
    });
  } catch (error) {
    console.error(`❌ Error fetching FEMA NFHL ${layerName}:`, error);
    return [];
  }
}

