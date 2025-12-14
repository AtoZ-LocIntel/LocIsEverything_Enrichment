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
 * Query Overpass API with tag filters and radius
 * @param layerFilters - Overpass QL filter block (e.g., 'nwr["amenity"="hospital"];')
 * @param lat - Latitude of center point
 * @param lon - Longitude of center point
 * @param radiusMiles - Radius in miles (default: 5, max: 25)
 * @returns Array of OSM elements with distance calculated
 */
export async function queryOverpass(
  layerFilters: string,
  lat: number,
  lon: number,
  radiusMiles: number = 5
): Promise<Array<OverpassElement & { distance_miles: number }>> {
  try {
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radiusMiles, 25.0);
    const radiusMeters = Math.round(cappedRadius * 1609.34); // Convert to meters
    
    // Build Overpass QL query
    const query = `[out:json][timeout:25];
(
  ${layerFilters}
)
(around:${radiusMeters}, ${lat}, ${lon});
out center tags;`;
    
    // Fetch from Overpass API
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`
    });
    
    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }
    
    const data: OverpassResponse = await response.json();
    
    if (!data.elements || data.elements.length === 0) {
      return [];
    }
    
    // Process elements and calculate distances
    const results: Array<OverpassElement & { distance_miles: number }> = [];
    const seenIds = new Set<string>(); // Deduplicate by type+id
    
    for (const element of data.elements) {
      // Get coordinates
      let elementLat: number | null = null;
      let elementLon: number | null = null;
      
      if (element.type === 'node') {
        elementLat = element.lat || null;
        elementLon = element.lon || null;
      } else if (element.center) {
        elementLat = element.center.lat;
        elementLon = element.center.lon;
      }
      
      if (elementLat === null || elementLon === null || !Number.isFinite(elementLat) || !Number.isFinite(elementLon)) {
        continue;
      }
      
      // Deduplicate by type+id
      const dedupKey = `${element.type}_${element.id}`;
      if (seenIds.has(dedupKey)) {
        continue;
      }
      seenIds.add(dedupKey);
      
      // Calculate distance
      const distanceMiles = haversineDistance(lat, lon, elementLat, elementLon);
      
      // Only include if within radius
      if (distanceMiles <= cappedRadius) {
        results.push({
          ...element,
          lat: elementLat,
          lon: elementLon,
          distance_miles: Number(distanceMiles.toFixed(2))
        });
      }
    }
    
    // Sort by distance
    results.sort((a, b) => a.distance_miles - b.distance_miles);
    
    return results;
  } catch (error) {
    console.error('❌ Error querying Overpass API:', error);
    return [];
  }
}

