/**
 * NPS Visitor Centers Adapter
 * Queries National Park Service API for visitor centers
 * Supports proximity queries up to 50 miles
 * API: https://developer.nps.gov/api/v1/visitorcenters
 */

const BASE_API_URL = 'https://developer.nps.gov/api/v1';

export interface NPSVisitorCenterInfo {
  id: string | null;
  name: string | null;
  parkCode: string | null;
  description: string | null;
  directionsInfo: string | null;
  directionsUrl: string | null;
  lat: number;
  lon: number;
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
 * Query NPS Visitor Centers API for proximity search
 * Supports proximity queries up to 50 miles
 */
export async function getNPSVisitorCentersData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<NPSVisitorCenterInfo[]> {
  try {
    const apiKey = import.meta.env.VITE_NPS_API_KEY;
    if (!apiKey) {
      throw new Error('NPS API key not configured. Please set VITE_NPS_API_KEY environment variable.');
    }
    
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;
    
    const results: NPSVisitorCenterInfo[] = [];
    const allVisitorCenters: any[] = [];
    
    // Fetch all visitor centers (paginated)
    let start = 0;
    const limit = 50;
    let hasMore = true;
    
    while (hasMore) {
      const url = `${BASE_API_URL}/visitorcenters?limit=${limit}&start=${start}&api_key=${apiKey}`;
      
      if (start === 0) {
        console.log(`🏛️ Querying NPS Visitor Centers API for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
      }
      
      const data = await fetchJSONSmart(url) as any;
      
      if (data.error) {
        console.error('❌ NPS Visitor Centers API Error:', data.error);
        break;
      }
      
      if (!data.data || data.data.length === 0) {
        hasMore = false;
        break;
      }
      
      allVisitorCenters.push(...data.data);
      
      // Check if there are more results
      const total = parseInt(data.total || '0', 10);
      if (start + data.data.length >= total) {
        hasMore = false;
      } else {
        start += limit;
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      }
    }
    
    console.log(`✅ Fetched ${allVisitorCenters.length} total NPS Visitor Centers`);
    
    // Filter visitor centers by distance
    allVisitorCenters.forEach((visitorCenter: any) => {
      const latLong = visitorCenter.latLong;
      if (!latLong) return;
      
      const coords = parseLatLong(latLong);
      if (!coords) return;
      
      const distance = calculateDistance(lat, lon, coords.lat, coords.lon);
      
      if (distance <= maxRadius) {
        results.push({
          id: visitorCenter.id || null,
          name: visitorCenter.name || null,
          parkCode: visitorCenter.parkCode || null,
          description: visitorCenter.description || null,
          directionsInfo: visitorCenter.directionsInfo || null,
          directionsUrl: visitorCenter.directionsUrl || null,
          lat: coords.lat,
          lon: coords.lon,
          distance_miles: Number(distance.toFixed(2)),
          attributes: visitorCenter
        });
      }
    });
    
    // Sort by distance
    results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ NPS Visitor Centers: Found ${results.length} visitor center(s) within ${maxRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying NPS Visitor Centers data:', error);
    throw error;
  }
}

