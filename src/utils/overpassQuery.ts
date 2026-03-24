/**
 * Overpass API Query Utility
 * Reusable functions for querying OpenStreetMap data via Overpass API
 */

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
}

export interface OverpassResponse {
  elements: OverpassElement[];
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Retry wrapper for API calls that may fail with 504 Gateway Timeout
 * Automatically retries 504 errors with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If we get a 504 Gateway Timeout, retry (unless this is the last attempt)
      if (response.status === 504) {
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s
          console.log(`⚠️ Overpass API returned 504 (Gateway Timeout). Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        } else {
          // Last attempt failed with 504
          throw new Error(`Overpass API error: 504 Gateway Timeout (after ${maxRetries} attempts)`);
        }
      }
      
      // For successful responses, return immediately
      if (response.ok) {
        return response;
      }
      
      // For other HTTP errors, throw immediately (don't retry non-504 errors)
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this is the last attempt or it's not a 504/network error, throw
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Only retry for network errors (not HTTP errors except 504, which is handled above)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (error instanceof TypeError || errorMessage.includes('fetch')) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`⚠️ Overpass API network error. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Don't retry other errors
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error('Overpass API request failed after retries');
}

/** Run a full Overpass QL string (for specialized queries). Returns raw elements or [] on failure. */
export async function fetchOverpassInterpreter(query: string): Promise<OverpassElement[]> {
  try {
    const response = await fetchWithRetry(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data: OverpassResponse = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error('❌ Error querying Overpass API:', error);
    return [];
  }
}

function buildQueryWithInlineAround(
  layerFilters: string,
  radiusMeters: number,
  lat: number,
  lon: number,
  timeoutSec: number
): string {
  const parts = layerFilters
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const lines: string[] = [];
  for (const part of parts) {
    if (part.includes('(around:')) {
      lines.push(part.endsWith(';') ? part : `${part};`);
    } else {
      lines.push(`${part}(around:${radiusMeters},${lat},${lon});`);
    }
  }
  return `[out:json][timeout:${timeoutSec}];
(
${lines.join('\n')}
);
out center tags;`;
}

/** Dedupe, compute distance from (lat,lon), keep within cappedRadiusMiles. */
export function elementsToProximityResults(
  elements: OverpassElement[],
  lat: number,
  lon: number,
  cappedRadiusMiles: number
): Array<OverpassElement & { distance_miles: number }> {
  const results: Array<OverpassElement & { distance_miles: number }> = [];
  const seenIds = new Set<string>();

  for (const element of elements) {
    let elementLat: number | null = null;
    let elementLon: number | null = null;

    if (element.type === 'node') {
      elementLat = element.lat ?? null;
      elementLon = element.lon ?? null;
    } else if (element.center) {
      elementLat = element.center.lat;
      elementLon = element.center.lon;
    }

    if (elementLat === null || elementLon === null || !Number.isFinite(elementLat) || !Number.isFinite(elementLon)) {
      continue;
    }

    const dedupKey = `${element.type}_${element.id}`;
    if (seenIds.has(dedupKey)) continue;
    seenIds.add(dedupKey);

    const distanceMiles = haversineDistance(lat, lon, elementLat, elementLon);
    if (distanceMiles <= cappedRadiusMiles) {
      results.push({
        ...element,
        lat: elementLat,
        lon: elementLon,
        distance_miles: Number(distanceMiles.toFixed(2)),
      });
    }
  }

  results.sort((a, b) => a.distance_miles - b.distance_miles);
  return results;
}

export interface OverpassQueryOptions {
  /** Max allowed radius in miles (default 25 for typical POI layers) */
  maxRadiusMiles?: number;
  /** Overpass [timeout:N] seconds (default 25; use higher for large radii) */
  timeoutSec?: number;
}

/**
 * Query Overpass API with tag filters and radius
 * @param layerFilters - Overpass QL filter block (e.g., 'nwr["amenity"="hospital"];')
 * @param lat - Latitude of center point
 * @param lon - Longitude of center point
 * @param radiusMiles - Radius in miles (default: 5)
 * @param options - Optional cap and timeout (default cap 25 mi, timeout 25s)
 * @returns Array of OSM elements with distance calculated
 */
export async function queryOverpass(
  layerFilters: string,
  lat: number,
  lon: number,
  radiusMiles: number = 5,
  options?: OverpassQueryOptions
): Promise<Array<OverpassElement & { distance_miles: number }>> {
  try {
    const maxCap = options?.maxRadiusMiles ?? 25;
    const cappedRadius = Math.min(radiusMiles, maxCap);
    const timeoutSec = options?.timeoutSec ?? 25;
    const radiusMeters = Math.round(cappedRadius * 1609.34); // Convert to meters

    // Spatial filter must be on each statement — a global union + (around:) loads the planet and hits limits
    const query = buildQueryWithInlineAround(layerFilters, radiusMeters, lat, lon, timeoutSec);
    const elements = await fetchOverpassInterpreter(query);
    return elementsToProximityResults(elements, lat, lon, cappedRadius);
  } catch (error) {
    console.error('❌ Error querying Overpass API:', error);
    return [];
  }
}

