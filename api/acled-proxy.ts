import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACLED_EMAIL = 'AtoZgis@gmail.com';
const ACLED_PASSWORD = '!!77PineCone77!!';
const TOKEN_URL = 'https://acleddata.com/oauth/token';
const API_BASE_URL = 'https://acleddata.com/api/acled/read';

// Cache for access token (in-memory, resets on serverless function restart)
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get OAuth access token for ACLED API
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('username', ACLED_EMAIL);
    formData.append('password', ACLED_PASSWORD);
    formData.append('grant_type', 'password');
    formData.append('client_id', 'acled');

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();
    
    // Cache the token (expires in 24 hours, but we'll refresh a bit earlier)
    cachedToken = tokenData.access_token;
    tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - (60 * 60 * 1000); // Refresh 1 hour before expiry
    
    return cachedToken;
  } catch (error: any) {
    throw new Error(`Error getting ACLED access token: ${error.message}`);
  }
}

// Explicitly reference getAccessToken so TypeScript treats it as a used value
void getAccessToken;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get access token
    const accessToken = await getAccessToken();
    
    // Get query parameters from the request
    const queryParams = new URLSearchParams(req.query as Record<string, string>);
    
    // Build ACLED API URL with query parameters
    const acledUrl = new URL(API_BASE_URL);
    queryParams.forEach((value, key) => {
      acledUrl.searchParams.set(key, value);
    });
    
    // Make request to ACLED API with Bearer token
    const response = await fetch(acledUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ACLED API request failed:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Failed to fetch ACLED data',
        details: errorText
      });
    }

    const data = await response.json();
    
    // Return ACLED data to client
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in ACLED proxy:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
