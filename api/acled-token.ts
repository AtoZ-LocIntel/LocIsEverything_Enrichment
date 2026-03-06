import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACLED_EMAIL = 'AtoZgis@gmail.com';
const ACLED_PASSWORD = '!!77PineCone77!!';
const TOKEN_URL = 'https://acleddata.com/oauth/token';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create form data for OAuth token request
    const formData = new URLSearchParams();
    formData.append('username', ACLED_EMAIL);
    formData.append('password', ACLED_PASSWORD);
    formData.append('grant_type', 'password');
    formData.append('client_id', 'acled');

    // Make request to ACLED OAuth endpoint
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ACLED token request failed:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Failed to get ACLED access token',
        details: errorText
      });
    }

    const tokenData = await response.json();
    
    // Return token data to client
    return res.status(200).json(tokenData);
  } catch (error: any) {
    console.error('Error in ACLED token proxy:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
