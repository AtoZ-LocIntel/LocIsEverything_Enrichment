import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';

// Global Fishing Watch API Key (JWT token)
const GFW_API_KEY = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJLbm93WW91ckxvY2F0aW9uIiwidXNlcklkIjo1NzM2MiwiYXBwbGljYXRpb25OYW1lIjoiS25vd1lvdXJMb2NhdGlvbiIsImlkIjo0ODQyLCJ0eXBlIjoidXNlci1hcHBsaWNhdGlvbiJ9LCJpYXQiOjE3NzMxNTI2MjIsImV4cCI6MjA4ODUxMjYyMiwiYXVkIjoiZ2Z3IiwiaXNzIjoiZ2Z3In0.nmObatF1FPGO8eLkEQSxI_4gTLGtLySyV6E4bC0XkOGz8d-Xqyl8I7rqkbvdK1wv45y9W8vkpXtVDVPNylkfWzsarJK1Tc4lYDOk_3B7QG99POQZ8JHUP4QfWqvtiNBbPkayV82hS4eiJnMkgqxhtlQTRnK4-7JB2QOd81RTorKCN-O95kgLDSWqUNYTccrlxnWNpXq-iaq3hkZK1TIY5G1uREHYxlsL3e7T7o8Ato19qeTpTcr1KCQg14IDXepdScL5xQ5mne4zW0WHCbXSXeH-3U6QCDn9P6L8tlSvIrpd3aAQVhsUDOvjA80h4Z6POReQF7xrwrWOSnXI1IYq_sfSkTozJGB02POU0z4lpZW7TwHso439bl-KmrUUw74AcjJZSgFE_gMpt6_QaXYXTLbD6GPTiGkxgMubLS-7LB2gDFwiqo5aY8gCwbUi8NFdMONtOyhPpGZ8urvUUZ6Ut5OYesbIAdBl0LrFQE1XJbXwEqkxWeCPmG7Ejzfk4_io';
const GFW_API_BASE_URL = 'https://gateway.api.globalfishingwatch.org';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the endpoint path from query parameter
    const endpoint = req.query.endpoint as string;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    // Build GFW API URL
    const gfwUrl = `${GFW_API_BASE_URL}${endpoint}`;
    
    // Get additional query parameters (excluding 'endpoint')
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'endpoint' && value) {
        queryParams.append(key, value as string);
      }
    });
    
    const fullUrl = queryParams.toString() 
      ? `${gfwUrl}?${queryParams.toString()}`
      : gfwUrl;

    // Make request to GFW API with Bearer token
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GFW_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GFW API request failed:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Failed to fetch GFW data',
        details: errorText
      });
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(200).json(data);
    } else if (contentType && (contentType.includes('application/vnd.mapbox-vector-tile') || contentType.includes('application/x-protobuf') || endpoint.includes('context-layers'))) {
      // Parse MVT format and convert to JSON
      const buffer = await response.arrayBuffer();
      
      try {
        // Parse MVT tile
        const tile = new VectorTile(new Pbf(Buffer.from(buffer)));
        
        // Extract features from all layers
        const features: any[] = [];
        
        for (const layerName in tile.layers) {
          const layer = tile.layers[layerName];
          
          for (let i = 0; i < layer.length; i++) {
            const feature = layer.feature(i);
            const props = feature.properties;
            
            // GFW SAR Fixed Infrastructure has lat/lon in properties
            // Extract the feature data
            const featureData: any = {
              ...props,
              // Ensure structure_id is a string
              structure_id: String(props.structure_id || ''),
            };
            
            // Convert empty strings to undefined for optional fields
            if (featureData.structure_start_date === '') {
              featureData.structure_start_date = undefined;
            }
            if (featureData.structure_end_date === '') {
              featureData.structure_end_date = undefined;
            }
            
            features.push(featureData);
          }
        }
        
        // Return parsed features as JSON
        return res.status(200).json({
          format: 'MVT_PARSED',
          features: features,
          count: features.length
        });
      } catch (parseError: any) {
        console.error('Error parsing MVT:', parseError);
        return res.status(500).json({
          error: 'Failed to parse MVT data',
          message: parseError.message
        });
      }
    } else {
      // For other binary formats, return as buffer
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      return res.status(200).send(Buffer.from(buffer));
    }
  } catch (error: any) {
    console.error('Error in GFW proxy:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
