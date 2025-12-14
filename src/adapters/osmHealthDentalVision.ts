/**
 * OSM Health & Wellness - Dental & Vision Adapter
 * Queries OpenStreetMap for dentists, orthodontists, oral surgeons, optometrists, ophthalmologists
 * Uses Overpass API with proximity queries up to 25 miles
 */

import { queryOverpass } from '../utils/overpassQuery';

export interface OSMHealthDentalVisionInfo {
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
  nwr["healthcare"="dentist"];
  nwr["healthcare"="orthodontist"];
  nwr["healthcare"="oral_surgeon"];
  nwr["healthcare"="optometrist"];
  nwr["healthcare"="ophthalmologist"];
`;

export async function getOSMHealthDentalVisionData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<OSMHealthDentalVisionInfo[]> {
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
    console.error('❌ Error querying OSM Dental & Vision:', error);
    return [];
  }
}

