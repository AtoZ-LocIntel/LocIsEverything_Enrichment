/**
 * Global Risk — OpenStreetMap data centers (Overpass API).
 * Tags: man_made=data_center, building=data_center, telecom=data_center
 * Same query pattern as other OSM POI layers: inline (around:) per statement + out center tags (no recurse).
 */

import { queryOverpass } from '../utils/overpassQuery';

export interface GlobalDataCenterOSMFeature {
  osm_id: string;
  osm_type: 'node' | 'way' | 'relation';
  name: string | null;
  /** Which primary tag classified this feature */
  data_center_tag: 'man_made' | 'building' | 'telecom' | 'unknown';
  latitude: number;
  longitude: number;
  distance_miles: number;
  operator: string | null;
  /** GeoJSON-style point for map/CSV (x=lon, y=lat matches other global layers) */
  geometry: { type: 'point'; x: number; y: number };
  tags: Record<string, string>;
}

function classifyTag(tags: Record<string, string>): 'man_made' | 'building' | 'telecom' | 'unknown' {
  if (tags.man_made === 'data_center') return 'man_made';
  if (tags.building === 'data_center') return 'building';
  if (tags.telecom === 'data_center') return 'telecom';
  return 'unknown';
}

const LAYER_FILTERS = `
  nwr["man_made"="data_center"];
  nwr["building"="data_center"];
  nwr["telecom"="data_center"];
`;

/** Public Overpass stays reliable within ~250 mi for this layer. */
const MAX_RADIUS_MILES = 250;

export async function getGlobalDataCentersOSMData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalDataCenterOSMFeature[]> {
  try {
    const cappedRadius = Math.min(radiusMiles, MAX_RADIUS_MILES);
    const elements = await queryOverpass(LAYER_FILTERS, lat, lon, cappedRadius, {
      maxRadiusMiles: MAX_RADIUS_MILES,
      timeoutSec: 180,
    });

    return elements.map((el) => {
      const la = el.lat!;
      const lo = el.lon!;
      return {
        osm_id: `${el.type}/${el.id}`,
        osm_type: el.type,
        name: el.tags.name || el.tags['name:en'] || null,
        data_center_tag: classifyTag(el.tags),
        latitude: la,
        longitude: lo,
        distance_miles: el.distance_miles,
        operator: el.tags.operator || el.tags['operator:name'] || null,
        geometry: { type: 'point', x: lo, y: la },
        tags: el.tags,
      };
    });
  } catch (error) {
    console.error('❌ Error querying OSM Global Data Centers:', error);
    return [];
  }
}
