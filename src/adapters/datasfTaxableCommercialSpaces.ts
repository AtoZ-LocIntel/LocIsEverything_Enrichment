/**
 * DataSF — Taxable Commercial Spaces (Socrata)
 * Parcels where one or more property owner(s) and/or commercial tenant(s) are required to file or pay the Commercial Vacancy Tax.
 * Proximity via SoQL within_circle on location_point.
 * API: https://data.sfgov.org/resource/rzkk-54yv (GeoJSON)
 */

const RESOURCE_GEOJSON = 'https://data.sfgov.org/resource/rzkk-54yv.geojson';
const LOCATION_FIELD = 'location_point';
const MAX_RADIUS_MILES = 1;
const MILES_TO_METERS = 1609.34;
const EARTH_RADIUS_MI = 3958.8;

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MI * c;
}

export type DatasfTaxableCommercialSpace = Record<string, unknown> & {
  latitude: number;
  longitude: number;
  geometry: { type: 'Point'; coordinates: [number, number] };
  distance_miles: number;
};

export async function getDatasfTaxableCommercialSpacesData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<DatasfTaxableCommercialSpace[]> {
  if (!radiusMiles || radiusMiles <= 0) {
    return [];
  }

  const cappedMiles = Math.min(radiusMiles, MAX_RADIUS_MILES);
  const radiusMeters = cappedMiles * MILES_TO_METERS;
  const where = `within_circle(${LOCATION_FIELD}, ${lat}, ${lon}, ${radiusMeters})`;
  const url = new URL(RESOURCE_GEOJSON);
  url.searchParams.set('$where', where);
  url.searchParams.set('$limit', '50000');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`DataSF Taxable Commercial Spaces HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    type?: string;
    features?: Array<{ geometry?: { type?: string; coordinates?: number[] }; properties?: Record<string, unknown> }>;
  };

  if (!data.features || !Array.isArray(data.features)) {
    return [];
  }

  const results: DatasfTaxableCommercialSpace[] = [];

  for (const feature of data.features) {
    const geom = feature.geometry;
    const props = feature.properties || {};
    if (!geom || geom.type !== 'Point' || !geom.coordinates || geom.coordinates.length < 2) {
      continue;
    }
    const [plon, plat] = geom.coordinates as [number, number];
    const distance_miles = Number(haversineMiles(lat, lon, plat, plon).toFixed(4));
    if (distance_miles > cappedMiles + 1e-6) {
      continue;
    }

    const row: DatasfTaxableCommercialSpace = {
      ...props,
      latitude: plat,
      longitude: plon,
      geometry: { type: 'Point', coordinates: [plon, plat] },
      distance_miles,
    };
    results.push(row);
  }

  results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
  return results;
}
