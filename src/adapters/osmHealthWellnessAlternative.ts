/**
 * OSM Health & Wellness - Wellness & Alternative Care Adapter
 * Queries OpenStreetMap for chiropractors, acupuncturists, massage, naturopaths, osteopaths
 * Uses Overpass API with proximity queries up to 25 miles
 */

import { queryOverpass } from '../utils/overpassQuery';

export interface OSMHealthWellnessAlternativeInfo {
  osmId: string;
  osmType: 'node' | 'way' | 'relation';
  name: string | null;
  healthcare: string | null;
  latitude: number;
  longitude: number;
  distance_miles: number;
  tags: Record<string, string>;
}

const LAYER_FILTERS = `
  nwr["healthcare"="chiropractor"];
  nwr["healthcare"="acupuncture"];
  nwr["healthcare"="alternative"];
  nwr["healthcare"="massage"];
  nwr["healthcare"="naturopath"];
  nwr["healthcare"="osteopath"];
`;

export async function getOSMHealthWellnessAlternativeData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<OSMHealthWellnessAlternativeInfo[]> {
  try {
    const cappedRadius = radiusMiles ? Math.min(radiusMiles, 25.0) : 25.0;
    const elements = await queryOverpass(LAYER_FILTERS, lat, lon, cappedRadius);
    
    return elements.map(element => ({
      osmId: `${element.type}_${element.id}`,
      osmType: element.type,
      name: element.tags.name || element.tags['name:en'] || null,
      healthcare: element.tags.healthcare || null,
      latitude: element.lat!,
      longitude: element.lon!,
      distance_miles: element.distance_miles,
      tags: element.tags
    }));
  } catch (error) {
    console.error('❌ Error querying OSM Wellness & Alternative Care:', error);
    return [];
  }
}

