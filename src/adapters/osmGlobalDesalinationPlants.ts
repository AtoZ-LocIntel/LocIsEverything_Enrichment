/**
 * Global Risk — OpenStreetMap desalination / seawater water works (Overpass API).
 * Single `queryOverpass` call (one HTTP request) like global data centers — avoids 429 from back-to-back Overpass POSTs.
 */

import { queryOverpass } from '../utils/overpassQuery';

export type DesalinationPlantOSMProfile =
  | 'desalination_plant'
  | 'man_made_desalination'
  | 'industrial_seawater'
  | 'man_made_seawater'
  | 'industrial_desalination'
  | 'plant_method_desalination'
  | 'unknown';

export interface GlobalDesalinationPlantOSMFeature {
  osm_id: string;
  osm_type: 'node' | 'way' | 'relation';
  name: string | null;
  desal_profile: DesalinationPlantOSMProfile;
  latitude: number;
  longitude: number;
  distance_miles: number;
  operator: string | null;
  geometry: { type: 'point'; x: number; y: number };
  tags: Record<string, string>;
}

function classifyProfile(tags: Record<string, string>): DesalinationPlantOSMProfile {
  const pm = tags['plant:method'];
  const ps = tags['plant:source'];
  const mm = tags.man_made;
  const ind = tags.industrial;

  if (mm === 'desalination_plant') return 'desalination_plant';
  if (mm === 'water_works' && pm === 'desalination') return 'man_made_desalination';
  if (ind === 'water_works' && ps === 'seawater') return 'industrial_seawater';
  if (mm === 'water_works' && ps === 'seawater') return 'man_made_seawater';
  if (ind === 'water_works' && pm === 'desalination') return 'industrial_desalination';
  if (pm === 'desalination') return 'plant_method_desalination';
  return 'unknown';
}

const LAYER_FILTERS = `
  nwr["man_made"="water_works"]["plant:method"="desalination"];
  nwr["industrial"="water_works"]["plant:source"="seawater"];
  nwr["man_made"="desalination_plant"];
  nwr["plant:method"="desalination"];
`;

const MAX_RADIUS_MILES = 250;

export async function getGlobalDesalinationPlantsOSMData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<GlobalDesalinationPlantOSMFeature[]> {
  try {
    const cappedRadius = Math.min(radiusMiles, MAX_RADIUS_MILES);
    const elements = await queryOverpass(LAYER_FILTERS, lat, lon, cappedRadius, {
      maxRadiusMiles: MAX_RADIUS_MILES,
      timeoutSec: 180,
    });

    return elements.map((el) => {
      const tags = el.tags || {};
      const la = el.lat!;
      const lo = el.lon!;
      return {
        osm_id: `${el.type}/${el.id}`,
        osm_type: el.type,
        name: tags.name || tags['name:en'] || null,
        desal_profile: classifyProfile(tags),
        latitude: la,
        longitude: lo,
        distance_miles: el.distance_miles,
        operator: tags.operator || tags['operator:name'] || null,
        geometry: { type: 'point', x: lo, y: la },
        tags,
      };
    });
  } catch (error) {
    console.error('❌ Error querying OSM Global Desalination Plants:', error);
    return [];
  }
}
