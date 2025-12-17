import { fetchJSONSmart } from '../services/EnrichmentService';

interface NSHMFeature {
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

function centroidFromRings(rings: number[][][]): { lat: number; lon: number } | null {
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  for (const ring of rings) {
    for (const coord of ring) {
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

export async function getNationalSeismicHazardData(
  lat: number,
  lon: number,
  layerName = '2023 National Seismic Hazard Model'
): Promise<NSHMFeature[]> {
  const pointGeometry = { x: lon, y: lat, spatialReference: { wkid: 4326 } };
  const base = 'https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/2023_National_Seismic_Hazard_Model/FeatureServer/0';
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
  const url = `${base}/query?${params.join('&')}`;

  try {
    const data = await fetchJSONSmart(url) as any;
    if (data.error || !data.features) {
      console.error('❌ NSHM API error:', data.error);
      return [];
    }

    console.log(`🌍 NSHM: Received ${data.features.length} feature(s) from API`);
    
    return data.features.map((f: any, idx: number) => {
      const attrs = f.attributes || {};
      const geom = f.geometry;
      
      console.log(`🌍 NSHM Feature ${idx}:`, {
        hasGeometry: !!geom,
        geometryKeys: geom ? Object.keys(geom) : [],
        hasRings: !!(geom && geom.rings),
        ringsCount: geom?.rings?.length || 0,
        firstRingLength: geom?.rings?.[0]?.length || 0,
        spatialRef: geom?.spatialReference,
        firstRingSample: geom?.rings?.[0]?.[0],
        firstRingFirst3: geom?.rings?.[0]?.slice(0, 3)
      });
      
      // Ensure we preserve the full polygon geometry (rings)
      // Only calculate centroid if needed for display, but keep full geometry
      let latVal: number | undefined;
      let lonVal: number | undefined;
      let containing = false;

      if (geom && Array.isArray(geom.rings)) {
        // Calculate centroid only for reference, but preserve full polygon geometry
        const cent = centroidFromRings(geom.rings);
        if (cent) {
          lonVal = cent.lon;
          latVal = cent.lat;
        }
        // Treat as containing when server returns feature on intersects
        containing = true;
      }

      return {
        objectId: attrs.OBJECTID || attrs.objectId || idx,
        attributes: attrs,
        geometry: geom, // Full polygon geometry with rings preserved
        lat: latVal, // Centroid for reference only
        lon: lonVal, // Centroid for reference only
        distance: undefined, // No distance for point-in-polygon
        containing,
        layerName
      };
    });
  } catch (error) {
    console.error('❌ Error fetching NSHM data:', error);
    return [];
  }
}

