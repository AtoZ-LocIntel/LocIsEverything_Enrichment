/**
 * Mobility Database Catalog — GET /v1/gtfs_feeds (GTFS static feeds).
 * Uses same-origin proxy /api/mobility-database-gtfs-feeds (Bearer token on server / Vite dev proxy).
 * @see https://mobilitydatabase.org/
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

export interface MobilityGtfsFeedRecord {
  id: string;
  provider: string;
  feed_name: string | null;
  status: string | null;
  official: boolean | null;
  lat: number;
  lon: number;
  distance_miles: number;
  producer_url: string | null;
  hosted_url: string | null;
  country_code: string | null;
  subdivision_name: string | null;
  municipality: string | null;
  feed_contact_email: string | null;
  data_type: string | null;
}

/** Single request cap (API default max is 2500; keep response size reasonable). */
const FEEDS_LIMIT = 500;
const MAX_RADIUS_MILES = 500;

function milesToLatDelta(miles: number): number {
  return miles / 69;
}

function milesToLonDelta(miles: number, latDeg: number): number {
  const cos = Math.cos((latDeg * Math.PI) / 180);
  return miles / (69 * Math.max(Math.abs(cos), 0.01));
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bboxFromFeed(feed: any): { minLat: number; maxLat: number; minLon: number; maxLon: number } | null {
  const bb = feed?.latest_dataset?.bounding_box || feed?.bounding_box;
  if (
    !bb ||
    bb.minimum_latitude == null ||
    bb.maximum_latitude == null ||
    bb.minimum_longitude == null ||
    bb.maximum_longitude == null
  ) {
    return null;
  }
  return {
    minLat: bb.minimum_latitude,
    maxLat: bb.maximum_latitude,
    minLon: bb.minimum_longitude,
    maxLon: bb.maximum_longitude,
  };
}

function centerFromBBox(bb: { minLat: number; maxLat: number; minLon: number; maxLon: number }): {
  lat: number;
  lon: number;
} {
  return {
    lat: (bb.minLat + bb.maxLat) / 2,
    lon: (bb.minLon + bb.maxLon) / 2,
  };
}

function locationMeta(feed: any): { country_code: string | null; subdivision_name: string | null; municipality: string | null } {
  const loc = Array.isArray(feed?.locations) && feed.locations[0] ? feed.locations[0] : null;
  if (!loc) {
    return { country_code: null, subdivision_name: null, municipality: null };
  }
  return {
    country_code: loc.country_code ?? null,
    subdivision_name: loc.subdivision_name ?? null,
    municipality: loc.municipality ?? null,
  };
}

/**
 * Query GTFS feeds whose latest dataset bounding box intersects the search bbox (partially_enclosed),
 * then sort by distance from the query point to the dataset bbox center.
 */
export async function getMobilityDatabaseGtfsFeedsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<MobilityGtfsFeedRecord[]> {
  const capped = Math.min(radiusMiles || 0, MAX_RADIUS_MILES);
  if (capped <= 0) {
    return [];
  }

  const dLat = milesToLatDelta(capped);
  const dLon = milesToLonDelta(capped, lat);
  const minLat = lat - dLat;
  const maxLat = lat + dLat;
  const minLon = lon - dLon;
  const maxLon = lon + dLon;

  const params = new URLSearchParams();
  params.set('limit', String(FEEDS_LIMIT));
  params.set('offset', '0');
  params.set('dataset_latitudes', `${minLat},${maxLat}`);
  params.set('dataset_longitudes', `${minLon},${maxLon}`);
  params.set('bounding_filter_method', 'partially_enclosed');

  const url = `/api/mobility-database-gtfs-feeds?${params.toString()}`;
  const data = await fetchJSONSmart(url);

  if (data && typeof data === 'object' && !Array.isArray(data) && (data as any).error) {
    throw new Error((data as any).error || 'Mobility Database API error');
  }

  const collected = Array.isArray(data) ? data : [];

  const out: MobilityGtfsFeedRecord[] = [];

  for (const feed of collected) {
    const bb = bboxFromFeed(feed);
    if (!bb) continue;
    const { lat: clat, lon: clon } = centerFromBBox(bb);
    const distance_miles = haversineMiles(lat, lon, clat, clon);
    if (distance_miles > capped) continue;

    const meta = locationMeta(feed);
    const src = feed?.source_info || {};
    const latest = feed?.latest_dataset || {};

    out.push({
      id: String(feed.id ?? ''),
      provider: String(feed.provider ?? 'Unknown'),
      feed_name: feed.feed_name != null ? String(feed.feed_name) : null,
      status: feed.status != null ? String(feed.status) : null,
      official: typeof feed.official === 'boolean' ? feed.official : null,
      lat: clat,
      lon: clon,
      distance_miles,
      producer_url: src.producer_url != null ? String(src.producer_url) : null,
      hosted_url: latest.hosted_url != null ? String(latest.hosted_url) : null,
      country_code: meta.country_code,
      subdivision_name: meta.subdivision_name,
      municipality: meta.municipality,
      feed_contact_email: feed.feed_contact_email != null ? String(feed.feed_contact_email) : null,
      data_type: feed.data_type != null ? String(feed.data_type) : null,
    });
  }

  out.sort((a, b) => a.distance_miles - b.distance_miles);
  return out;
}
