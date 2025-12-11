/**
 * NPS National Parks Adapter
 * Queries National Park Service API for national parks
 * Supports proximity queries up to 50 miles
 * API: https://developer.nps.gov/api/v1/parks
 */

const BASE_API_URL = 'https://developer.nps.gov/api/v1';

export interface NPSNationalParkInfo {
  parkCode: string | null;
  fullName: string | null;
  name: string | null;
  designation: string | null;
  states: string | null;
  description: string | null;
  lat: number;
  lon: number;
  url: string | null;
  distance_miles?: number;
  attributes: Record<string, any>;
}

/**
 * Parse latLong string from NPS API (format: "lat:44.59824417, long:-110.5471695")
 */
function parseLatLong(latLong: string): { lat: number; lon: number } | null {
  if (!latLong) return null;
  
  try {
    const parts = latLong.split(',');
    const latMatch = parts[0]?.match(/lat:\s*([-\d.]+)/);
    const lonMatch = parts[1]?.match(/long:\s*([-\d.]+)/);
    
    if (latMatch && lonMatch) {
      const lat = parseFloat(latMatch[1]);
      const lon = parseFloat(lonMatch[1]);
      
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { lat, lon };
      }
    }
  } catch (error) {
    console.error('Error parsing latLong:', error);
  }
  
  return null;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query NPS National Parks API for proximity search
 * Supports proximity queries up to 50 miles
 */
export async function getNPSNationalParksData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<NPSNationalParkInfo[]> {
  try {
    const apiKey = import.meta.env.VITE_NPS_API_KEY;
    if (!apiKey) {
      throw new Error('NPS API key not configured. Please set VITE_NPS_API_KEY environment variable.');
    }
    
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;
    
    const results: NPSNationalParkInfo[] = [];
    const allParks: any[] = [];
    
    // Fetch all parks (paginated)
    let start = 0;
    const limit = 50;
    let hasMore = true;
    
    while (hasMore) {
      const url = `${BASE_API_URL}/parks?limit=${limit}&start=${start}&api_key=${apiKey}`;
      
      if (start === 0) {
        console.log(`🏞️ Querying NPS National Parks API for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
      }
      
      const data = await fetchJSONSmart(url) as any;
      
      if (data.error) {
        console.error('❌ NPS National Parks API Error:', data.error);
        break;
      }
      
      if (!data.data || data.data.length === 0) {
        hasMore = false;
        break;
      }
      
      allParks.push(...data.data);
      
      // Check if there are more results
      const total = parseInt(data.total || '0', 10);
      if (start + data.data.length >= total) {
        hasMore = false;
      } else {
        start += limit;
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      }
    }
    
    console.log(`✅ Fetched ${allParks.length} total NPS National Parks`);
    
    // Filter parks by distance
    allParks.forEach((park: any) => {
      const latLong = park.latLong;
      if (!latLong) return;
      
      const coords = parseLatLong(latLong);
      if (!coords) return;
      
      const distance = calculateDistance(lat, lon, coords.lat, coords.lon);
      
      if (distance <= maxRadius) {
        results.push({
          parkCode: park.parkCode || null,
          fullName: park.fullName || null,
          name: park.name || null,
          designation: park.designation || null,
          states: park.states || null,
          description: park.description || null,
          lat: coords.lat,
          lon: coords.lon,
          url: park.url || null,
          distance_miles: Number(distance.toFixed(2)),
          attributes: park
        });
      }
    });
    
    // Sort by distance
    results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ NPS National Parks: Found ${results.length} park(s) within ${maxRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying NPS National Parks data:', error);
    throw error;
  }
}

