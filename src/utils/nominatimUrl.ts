/**
 * Nominatim blocks anonymous browser CORS on many origins. Use same-origin /api/nominatim
 * (Vite proxy in dev, Vercel function in prod) so the client never calls nominatim.openstreetmap.org directly.
 */
const NOMINATIM_PUBLIC = 'https://nominatim.openstreetmap.org';

export function getNominatimApiOrigin(): string {
  if (typeof window === 'undefined') {
    return NOMINATIM_PUBLIC;
  }
  return `${window.location.origin}/api/nominatim`;
}

/** Full URL for /search with query string (same-origin when in browser). */
export function buildNominatimSearchUrl(searchParams: URLSearchParams): string {
  return `${getNominatimApiOrigin()}/search?${searchParams.toString()}`;
}
