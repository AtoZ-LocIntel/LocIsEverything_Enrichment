/**
 * OSM Health & Wellness - Fitness & Movement Adapter
 * Queries OpenStreetMap for fitness centers, gyms, sports centers, physiotherapists
 * Uses Overpass API with proximity queries up to 25 miles
 */

import { queryOverpass } from '../utils/overpassQuery';

export interface OSMHealthFitnessMovementInfo {
  osmId: string;
  osmType: 'node' | 'way' | 'relation';
  name: string | null;
  leisure: string | null;
  sport: string | null;
  amenity: string | null;
  healthcare: string | null;
  latitude: number;
  longitude: number;
  distance_miles: number;
  tags: Record<string, string>;
}

const LAYER_FILTERS = `
  nwr["leisure"="fitness_centre"];
  nwr["sport"="fitness"];
  nwr["leisure"="sports_centre"];
  nwr["amenity"="gym"];
  nwr["healthcare"="physiotherapist"];
  nwr["healthcare"="rehabilitation"];
`;

export async function getOSMHealthFitnessMovementData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<OSMHealthFitnessMovementInfo[]> {
  try {
    const cappedRadius = radiusMiles ? Math.min(radiusMiles, 25.0) : 25.0;
    const elements = await queryOverpass(LAYER_FILTERS, lat, lon, cappedRadius);
    
    return elements.map(element => ({
      osmId: `${element.type}_${element.id}`,
      osmType: element.type,
      name: element.tags.name || element.tags['name:en'] || null,
      leisure: element.tags.leisure || null,
      sport: element.tags.sport || null,
      amenity: element.tags.amenity || null,
      healthcare: element.tags.healthcare || null,
      latitude: element.lat!,
      longitude: element.lon!,
      distance_miles: element.distance_miles,
      tags: element.tags
    }));
  } catch (error) {
    console.error('❌ Error querying OSM Fitness & Movement:', error);
    return [];
  }
}

