/**
 * OSM Health & Wellness - Pharmacy & Diagnostics Adapter
 * Queries OpenStreetMap for pharmacies, laboratories, diagnostic centers
 * Uses Overpass API with proximity queries up to 25 miles
 */

import { queryOverpass } from '../utils/overpassQuery';

export interface OSMHealthPharmacyDiagnosticsInfo {
  osmId: string;
  osmType: 'node' | 'way' | 'relation';
  name: string | null;
  amenity: string | null;
  healthcare: string | null;
  latitude: number;
  longitude: number;
  distance_miles: number;
  tags: Record<string, string>;
}

const LAYER_FILTERS = `
  nwr["amenity"="pharmacy"];
  nwr["healthcare"="pharmacy"];
  nwr["healthcare"="laboratory"];
  nwr["healthcare"="diagnostic_centre"];
`;

export async function getOSMHealthPharmacyDiagnosticsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<OSMHealthPharmacyDiagnosticsInfo[]> {
  try {
    const cappedRadius = radiusMiles ? Math.min(radiusMiles, 25.0) : 25.0;
    const elements = await queryOverpass(LAYER_FILTERS, lat, lon, cappedRadius);
    
    return elements.map(element => ({
      osmId: `${element.type}_${element.id}`,
      osmType: element.type,
      name: element.tags.name || element.tags['name:en'] || null,
      amenity: element.tags.amenity || null,
      healthcare: element.tags.healthcare || null,
      latitude: element.lat!,
      longitude: element.lon!,
      distance_miles: element.distance_miles,
      tags: element.tags
    }));
  } catch (error) {
    console.error('❌ Error querying OSM Pharmacy & Diagnostics:', error);
    return [];
  }
}

