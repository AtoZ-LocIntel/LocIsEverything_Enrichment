/**
 * OSM Health & Wellness - Public & Community Health Adapter
 * Queries OpenStreetMap for public health facilities, community health centers
 * Uses Overpass API with proximity queries up to 25 miles
 */

import { queryOverpass } from '../utils/overpassQuery';

export interface OSMHealthPublicCommunityInfo {
  osmId: string;
  osmType: 'node' | 'way' | 'relation';
  name: string | null;
  healthcare: string | null;
  amenity: string | null;
  socialFacility: string | null;
  latitude: number;
  longitude: number;
  distance_miles: number;
  tags: Record<string, string>;
}

const LAYER_FILTERS = `
  nwr["healthcare"="public_health"];
  nwr["healthcare"="clinic"]["operator:type"="public"];
  nwr["amenity"="social_facility"]["social_facility"="healthcare"];
  nwr["healthcare"="community_health_centre"];
`;

export async function getOSMHealthPublicCommunityData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<OSMHealthPublicCommunityInfo[]> {
  try {
    const cappedRadius = radiusMiles ? Math.min(radiusMiles, 25.0) : 25.0;
    const elements = await queryOverpass(LAYER_FILTERS, lat, lon, cappedRadius);
    
    return elements.map(element => ({
      osmId: `${element.type}_${element.id}`,
      osmType: element.type,
      name: element.tags.name || element.tags['name:en'] || null,
      healthcare: element.tags.healthcare || null,
      amenity: element.tags.amenity || null,
      socialFacility: element.tags.social_facility || null,
      latitude: element.lat!,
      longitude: element.lon!,
      distance_miles: element.distance_miles,
      tags: element.tags
    }));
  } catch (error) {
    console.error('❌ Error querying OSM Public & Community Health:', error);
    return [];
  }
}

