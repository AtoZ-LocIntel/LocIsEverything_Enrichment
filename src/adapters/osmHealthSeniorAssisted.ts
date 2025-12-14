/**
 * OSM Health & Wellness - Senior & Assisted Care Adapter
 * Queries OpenStreetMap for nursing homes, assisted living, rehabilitation, hospices
 * Uses Overpass API with proximity queries up to 25 miles
 */

import { queryOverpass } from '../utils/overpassQuery';

export interface OSMHealthSeniorAssistedInfo {
  osmId: string;
  osmType: 'node' | 'way' | 'relation';
  name: string | null;
  amenity: string | null;
  socialFacility: string | null;
  healthcare: string | null;
  latitude: number;
  longitude: number;
  distance_miles: number;
  tags: Record<string, string>;
}

const LAYER_FILTERS = `
  nwr["amenity"="nursing_home"];
  nwr["social_facility"="assisted_living"];
  nwr["healthcare"="rehabilitation"];
  nwr["healthcare"="hospice"];
`;

export async function getOSMHealthSeniorAssistedData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<OSMHealthSeniorAssistedInfo[]> {
  try {
    const cappedRadius = radiusMiles ? Math.min(radiusMiles, 25.0) : 25.0;
    const elements = await queryOverpass(LAYER_FILTERS, lat, lon, cappedRadius);
    
    return elements.map(element => ({
      osmId: `${element.type}_${element.id}`,
      osmType: element.type,
      name: element.tags.name || element.tags['name:en'] || null,
      amenity: element.tags.amenity || null,
      socialFacility: element.tags.social_facility || null,
      healthcare: element.tags.healthcare || null,
      latitude: element.lat!,
      longitude: element.lon!,
      distance_miles: element.distance_miles,
      tags: element.tags
    }));
  } catch (error) {
    console.error('❌ Error querying OSM Senior & Assisted Care:', error);
    return [];
  }
}

