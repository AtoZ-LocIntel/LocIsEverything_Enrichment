/**
 * OSM Health & Wellness - Mental & Behavioral Health Adapter
 * Queries OpenStreetMap for psychotherapists, psychologists, psychiatrists, mental health clinics
 * Uses Overpass API with proximity queries up to 25 miles
 */

import { queryOverpass } from '../utils/overpassQuery';

export interface OSMHealthMentalBehavioralInfo {
  osmId: string;
  osmType: 'node' | 'way' | 'relation';
  name: string | null;
  healthcare: string | null;
  socialFacility: string | null;
  latitude: number;
  longitude: number;
  distance_miles: number;
  tags: Record<string, string>;
}

const LAYER_FILTERS = `
  nwr["healthcare"="psychotherapist"];
  nwr["healthcare"="psychologist"];
  nwr["healthcare"="psychiatrist"];
  nwr["healthcare"="clinic"]["healthcare:specialty"="mental_health"];
  nwr["social_facility"="drug_rehabilitation"];
  nwr["healthcare"="social_worker"];
`;

export async function getOSMHealthMentalBehavioralData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<OSMHealthMentalBehavioralInfo[]> {
  try {
    const cappedRadius = radiusMiles ? Math.min(radiusMiles, 25.0) : 25.0;
    const elements = await queryOverpass(LAYER_FILTERS, lat, lon, cappedRadius);
    
    return elements.map(element => ({
      osmId: `${element.type}_${element.id}`,
      osmType: element.type,
      name: element.tags.name || element.tags['name:en'] || null,
      healthcare: element.tags.healthcare || null,
      socialFacility: element.tags.social_facility || null,
      latitude: element.lat!,
      longitude: element.lon!,
      distance_miles: element.distance_miles,
      tags: element.tags
    }));
  } catch (error) {
    console.error('❌ Error querying OSM Mental & Behavioral Health:', error);
    return [];
  }
}

