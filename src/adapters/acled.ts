
export interface ACLEDEvent {
  event_id_cnty: string;
  event_date: string;
  year: number;
  time_precision: number;
  disorder_type: string;
  event_type: string;
  sub_event_type: string;
  actor1: string;
  assoc_actor_1?: string;
  inter1: string | number;
  actor2?: string;
  assoc_actor_2?: string;
  inter2?: string | number;
  interaction: string | number;
  civilian_targeting?: string;
  iso: number;
  region: string;
  country: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  location: string;
  latitude: number;
  longitude: number;
  geo_precision: number;
  source: string;
  source_scale?: string;
  notes?: string;
  fatalities: number;
  tags?: string;
  timestamp: number;
}

interface ACLEDTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

interface ACLEDApiResponse {
  status: number;
  success: boolean;
  last_update: number;
  count: number;
  messages: string[];
  data: ACLEDEvent[];
  filename?: string;
  data_query_restrictions?: any;
}

const API_BASE_URL = 'https://acleddata.com/api/acled/read';

// Cache for access token
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get OAuth access token for ACLED API
 * Tries cookie-based auth first (for browser), falls back to OAuth token via proxy
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  // Try cookie-based authentication first (works in browser if ACLED allows CORS)
  try {
    console.log('🔐 Attempting cookie-based authentication...');
    
    const loginResponse = await fetch('https://acleddata.com/user/login?_format=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
      body: JSON.stringify({
        name: 'AtoZgis@gmail.com',
        pass: '!!77PineCone77!!'
      }),
    });

    if (loginResponse.ok) {
      await loginResponse.json(); // Check response is valid JSON
      console.log('✅ Cookie-based authentication successful');
      
      // For cookie-based auth, we don't need a token, but we'll use a placeholder
      // The cookie will be used automatically in subsequent requests
      cachedToken = 'cookie-auth'; // Placeholder to indicate cookie auth is active
      tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      return cachedToken;
    }
  } catch (error: any) {
    console.warn('⚠️ Cookie-based auth failed, trying OAuth proxy...', error.message);
  }

  // Fall back to OAuth token via proxy endpoint (works in both dev and production)
  try {
    console.log('🔐 Requesting ACLED API access token via proxy...');
    
    // Use proxy endpoint (Vite proxy in dev, Vercel function in production)
    const formData = new URLSearchParams();
    formData.append('username', 'AtoZgis@gmail.com');
    formData.append('password', '!!77PineCone77!!');
    formData.append('grant_type', 'password');
    formData.append('client_id', 'acled');
    
    const response = await fetch('/api/acled-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Unknown error' };
      }
      throw new Error(`Failed to get access token: ${response.status} ${errorData.error || response.statusText}`);
    }

    const tokenData: ACLEDTokenResponse = await response.json();
    
    cachedToken = tokenData.access_token;
    tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - (60 * 60 * 1000);
    
    console.log('✅ ACLED API access token obtained via proxy');
    return cachedToken;
  } catch (error: any) {
    console.error('❌ Error getting ACLED access token:', error);
    throw new Error(`ACLED authentication failed: ${error.message}. Make sure the Vite dev server proxy is configured or use "vercel dev" for local development.`);
  }
}

/**
 * Query ACLED events globally (no spatial constraints)
 * Used for global visualization of all ACLED data
 */
export async function getAllACLEDData(): Promise<ACLEDEvent[]> {
  try {
    console.log('📊 Querying ALL ACLED events globally');
    
    // Note: Access token is handled by the proxy endpoint server-side
    let allEvents: ACLEDEvent[] = [];
    let limit = 5000; // ACLED default max per request
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      try {
        // Build query URL - get recent events (last 2 years) to limit data size
        const currentYear = new Date().getFullYear();
        const twoYearsAgo = currentYear - 2;
        
        const queryUrl = new URL(API_BASE_URL);
        queryUrl.searchParams.set('_format', 'json');
        queryUrl.searchParams.set('year', `${twoYearsAgo}|${currentYear}`);
        queryUrl.searchParams.set('year_where', 'BETWEEN');
        queryUrl.searchParams.set('limit', limit.toString());
        queryUrl.searchParams.set('fields', 'event_id_cnty|event_date|year|disorder_type|event_type|sub_event_type|actor1|actor2|country|region|latitude|longitude|fatalities|location|admin1|admin2|admin3|source|notes|tags');
        
        if (offset > 0) {
          // Note: ACLED doesn't have explicit offset, but we can use timestamp filtering
          // For simplicity, we'll fetch in batches using limit
          // This is a simplified approach - in production you might want to use pagination
          break; // For now, just get the first batch
        }
        
        console.log(`📡 Fetching ACLED events (limit: ${limit})...`);
        
        // Build query parameters for proxy
        const queryParams = new URLSearchParams();
        queryParams.set('_format', 'json');
        queryParams.set('year', `${twoYearsAgo}|${currentYear}`);
        queryParams.set('year_where', 'BETWEEN');
        queryParams.set('limit', limit.toString());
        queryParams.set('fields', 'event_id_cnty|event_date|year|disorder_type|event_type|sub_event_type|actor1|actor2|country|region|latitude|longitude|fatalities|location|admin1|admin2|admin3|source|notes|tags');
        
        // Use proxy endpoint to avoid CORS issues
        const proxyUrl = `/api/acled-proxy?${queryParams.toString()}`;
        
        console.log(`🔗 Calling ACLED proxy: ${proxyUrl}`);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Get response text first to check what we're actually receiving
        const responseText = await response.text();
        
        if (!response.ok) {
          console.error('ACLED proxy error response:', response.status, responseText.substring(0, 500));
          throw new Error(`ACLED API request failed: ${response.status} ${response.statusText}`);
        }

        // Check if response looks like JSON
        let apiResponse: ACLEDApiResponse;
        try {
          apiResponse = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse ACLED response as JSON. Response:', responseText.substring(0, 500));
          console.error('Content-Type:', response.headers.get('content-type'));
          throw new Error(`ACLED proxy returned invalid JSON. Response may be source code or HTML.`);
        }
        
        if (apiResponse.status !== 200 || !apiResponse.success) {
          throw new Error(`ACLED API error: ${apiResponse.messages?.join(', ') || 'Unknown error'}`);
        }
        
        if (!apiResponse.data || apiResponse.data.length === 0) {
          hasMore = false;
          break;
        }
        
        allEvents = allEvents.concat(apiResponse.data);
        console.log(`✅ Retrieved ${apiResponse.data.length} ACLED events (total: ${allEvents.length})`);
        
        // Check if we got fewer than the limit (means we're done)
        if (apiResponse.data.length < limit) {
          hasMore = false;
        } else {
          // For now, we'll limit to first batch to avoid overwhelming the system
          // In production, you might want to implement proper pagination
          hasMore = false;
        }
        
      } catch (error: any) {
        console.error(`❌ ACLED API query failed:`, error);
        hasMore = false;
      }
    }
    
    console.log(`✅ Retrieved ${allEvents.length} ACLED events globally`);
    return allEvents;
  } catch (error: any) {
    console.error('❌ Error querying all ACLED data:', error);
    return [];
  }
}

/**
 * Query ACLED events for a specific location with proximity support
 */
export async function getACLEDData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<ACLEDEvent[]> {
  try {
    // Note: Access token is handled by the proxy endpoint server-side
    const currentYear = new Date().getFullYear();
    const twoYearsAgo = currentYear - 2;
    
    // Build bounding box for proximity query
    // Approximate: 1 degree latitude ≈ 69 miles
    const radiusDegrees = (radiusMiles || 50) / 69;
    const minLat = lat - radiusDegrees;
    const maxLat = lat + radiusDegrees;
    const minLon = lon - radiusDegrees;
    const maxLon = lon + radiusDegrees;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('_format', 'json');
    queryParams.set('year', `${twoYearsAgo}|${currentYear}`);
    queryParams.set('year_where', 'BETWEEN');
    queryParams.set('latitude', `${minLat}|${maxLat}`);
    queryParams.set('latitude_where', 'BETWEEN');
    queryParams.set('longitude', `${minLon}|${maxLon}`);
    queryParams.set('longitude_where', 'BETWEEN');
    queryParams.set('limit', '5000');
    queryParams.set('fields', 'event_id_cnty|event_date|year|disorder_type|event_type|sub_event_type|actor1|actor2|country|region|latitude|longitude|fatalities|location|admin1|admin2|admin3|source|notes|tags');
    
    console.log(`📡 Fetching ACLED events near [${lat}, ${lon}] within ${radiusMiles || 50} miles...`);
    
    // Use proxy endpoint to avoid CORS issues
    const queryString = queryParams.toString();
    const proxyUrl = `/api/acled-proxy?${queryString}`;
    
    console.log(`🔗 Calling ACLED proxy: ${proxyUrl}`);
    console.log(`📋 Query parameters:`, Object.fromEntries(queryParams.entries()));
    console.log(`📋 Query string: ${queryString}`);
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response text first to check what we're actually receiving
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('ACLED proxy error response:', response.status, response.statusText);
      console.error('Error response body:', responseText.substring(0, 1000));
      
      // 403 usually means authentication failed
      if (response.status === 403) {
        throw new Error(`ACLED API returned 403 Forbidden. This usually means authentication failed. Check if the access token is being passed correctly.`);
      }
      
      throw new Error(`ACLED API request failed: ${response.status} ${response.statusText}`);
    }

    // Check if response looks like JSON
    let apiResponse: ACLEDApiResponse;
    try {
      apiResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse ACLED response as JSON. Response:', responseText.substring(0, 500));
      console.error('Content-Type:', response.headers.get('content-type'));
      throw new Error(`ACLED proxy returned invalid JSON. Response may be source code or HTML.`);
    }
    
    if (apiResponse.status !== 200 || !apiResponse.success) {
      throw new Error(`ACLED API error: ${apiResponse.messages?.join(', ') || 'Unknown error'}`);
    }
    
    const events = apiResponse.data || [];
    
    // Filter by actual distance (since bounding box is approximate)
    const filteredEvents = events.filter(event => {
      if (!event.latitude || !event.longitude) return false;
      const distance = calculateDistance(lat, lon, event.latitude, event.longitude);
      return distance <= (radiusMiles || 50);
    });
    
    console.log(`✅ Retrieved ${filteredEvents.length} ACLED events near location`);
    return filteredEvents;
  } catch (error: any) {
    console.error('❌ Error querying ACLED data:', error);
    // Log more details about the error
    if (error.message && error.message.includes('JSON')) {
      console.error('JSON parsing error - response might not be JSON. Check serverless function execution.');
    }
    return [];
  }
}

/**
 * Calculate distance between two points in miles using Haversine formula
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
