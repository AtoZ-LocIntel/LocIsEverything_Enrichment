/**
 * Adapter for Global Fishing Watch API
 * Service URL: https://gateway.api.globalfishingwatch.org/v3
 * 
 * Provides access to:
 * - SAR Fixed Infrastructure (oil, wind, unknown structures)
 * - Fishing effort data
 * - Vessel encounters
 * - Port visits
 * - And other maritime data
 */

import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';

export interface GFWSARFixedInfrastructureInfo {
  structure_id: string;
  lat: number;
  lon: number;
  label: 'oil' | 'wind' | 'unknown';
  structure_start_date?: number;
  structure_end_date?: number;
  label_confidence?: 'high' | 'medium' | 'low';
  distance?: number; // Distance in miles from query point
}

export interface GFWVesselInfo {
  id: string;
  name?: string;
  flag?: string;
  vesselType?: string;
  lat: number;
  lon: number;
  timestamp?: number;
  distance?: number; // Distance in miles from query point
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
 * Convert lat/lon to tile coordinates
 */
function latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

/**
 * Get bounding box tiles for a given area
 */
function getTilesForBounds(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  zoom: number
): Array<{ x: number; y: number; z: number }> {
  const minTile = latLonToTile(maxLat, minLon, zoom);
  const maxTile = latLonToTile(minLat, maxLon, zoom);
  
  const tiles: Array<{ x: number; y: number; z: number }> = [];
  for (let x = minTile.x; x <= maxTile.x; x++) {
    for (let y = minTile.y; y <= maxTile.y; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  return tiles;
}

/**
 * Note: GFW SAR Fixed Infrastructure API returns MVT (Mapbox Vector Tile) format
 * Proper MVT parsing requires @mapbox/vector-tile library or similar
 * For now, this adapter provides the structure - MVT parsing needs to be implemented
 * either server-side in the proxy or client-side with a library
 */

// GFW API Key (JWT token) - same as in serverless function
// Note: For production, consider using environment variables
const GFW_API_KEY = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJLbm93WW91ckxvY2F0aW9uIiwidXNlcklkIjo1NzM2MiwiYXBwbGljYXRpb25OYW1lIjoiS25vd1lvdXJMb2NhdGlvbiIsImlkIjo0ODQyLCJ0eXBlIjoidXNlci1hcHBsaWNhdGlvbiJ9LCJpYXQiOjE3NzMxNTI2MjIsImV4cCI6MjA4ODUxMjYyMiwiYXVkIjoiZ2Z3IiwiaXNzIjoiZ2Z3In0.nmObatF1FPGO8eLkEQSxI_4gTLGtLySyV6E4bC0XkOGz8d-Xqyl8I7rqkbvdK1wv45y9W8vkpXtVDVPNylkfWzsarJK1Tc4lYDOk_3B7QG99POQZ8JHUP4QfWqvtiNBbPkayV82hS4eiJnMkgqxhtlQTRnK4-7JB2QOd81RTorKCN-O95kgLDSWqUNYTccrlxnWNpXq-iaq3hkZK1TIY5G1uREHYxlsL3e7T7o8Ato19qeTpTcr1KCQg14IDXepdScL5xQ5mne4zW0WHCbXSXeH-3U6QCDn9P6L8tlSvIrpd3aAQVhsUDOvjA80h4Z6POReQF7xrwrWOSnXI1IYq_sfSkTozJGB02POU0z4lpZW7TwHso439bl-KmrUUw74AcjJZSgFE_gMpt6_QaXYXTLbD6GPTiGkxgMubLS-7LB2gDFwiqo5aY8gCwbUi8NFdMONtOyhPpGZ8urvUUZ6Ut5OYesbIAdBl0LrFQE1XJbXwEqkxWeCPmG7Ejzfk4_io';
const GFW_API_BASE_URL = 'https://gateway.api.globalfishingwatch.org';

/**
 * Make a direct API call to GFW (for JSON endpoints only)
 * Note: MVT endpoints require server-side parsing via proxy
 */
async function callGFWAPIDirect(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    const url = `${GFW_API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${GFW_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`GFW API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    // If direct call fails (CORS, etc.), fallback to proxy
    console.warn('Direct GFW API call failed, trying proxy:', error);
    const proxyUrl = `/api/gfw-proxy?endpoint=${encodeURIComponent(endpoint)}`;
    const proxyResponse = await fetch(proxyUrl, options);
    if (!proxyResponse.ok) {
      throw new Error(`GFW proxy error: ${proxyResponse.status}`);
    }
    return await proxyResponse.json();
  }
}

/**
 * Query SAR Fixed Infrastructure within a radius of a location
 * Supports proximity queries up to 1000 miles
 * 
 * NOTE: SAR Fixed Infrastructure uses MVT (Mapbox Vector Tile) format which requires server-side parsing.
 * This function uses the proxy endpoint for MVT parsing. For JSON endpoints (4Wings, Vessels, Events),
 * you can call GFW API directly from the frontend.
 */
export async function getGFWSARFixedInfrastructureData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<GFWSARFixedInfrastructureInfo[]> {
  try {
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 1000) : 1000;
    
    // Calculate bounding box
    const latRadius = maxRadius / 69; // Approximate degrees
    const lonRadius = maxRadius / (69 * Math.cos(lat * Math.PI / 180));
    
    const minLat = lat - latRadius;
    const maxLat = lat + latRadius;
    const minLon = lon - lonRadius;
    const maxLon = lon + lonRadius;
    
    // Use zoom level 9 for detailed data (as per GFW docs: 0-9 for SAR infrastructure)
    const zoom = 9;
    const tiles = getTilesForBounds(minLat, maxLat, minLon, maxLon, zoom);
    
    const allStructures: GFWSARFixedInfrastructureInfo[] = [];
    
    // Try direct API call first (will fail for MVT, but we'll fallback to proxy)
    // For MVT tiles, we MUST use the proxy for parsing
    for (const tile of tiles.slice(0, 50)) { // Limit to 50 tiles to avoid timeout
      try {
        // Use proxy endpoint - MVT tiles require server-side parsing
        const proxyUrl = `/api/gfw-proxy?endpoint=/v3/datasets/public-fixed-infrastructure-filtered:latest/context-layers/${tile.z}/${tile.x}/${tile.y}`;
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          // 404 is normal - many tiles don't contain infrastructure data
          if (response.status === 404) {
            // Silently skip empty tiles
            continue;
          }
          // Log other errors (5xx, auth errors, etc.)
          const errorText = await response.text().catch(() => 'Unknown error');
          console.warn(`GFW proxy error for tile ${tile.z}/${tile.x}/${tile.y}:`, response.status, errorText.substring(0, 200));
          continue;
        }

        // Check content type first to determine how to handle response
        const contentType = response.headers.get('content-type');
        
        // Handle MVT format - parse client-side
        if (contentType && (contentType.includes('application/vnd.mapbox-vector-tile') || contentType.includes('application/x-protobuf'))) {
          try {
            // Parse MVT tile client-side
            const arrayBuffer = await response.arrayBuffer();
            const mvtTile = new VectorTile(new Pbf(new Uint8Array(arrayBuffer)));
            
            console.log(`✅ Successfully parsed MVT tile ${tile.z}/${tile.x}/${tile.y}, layers:`, Object.keys(mvtTile.layers));
            
            // Extract features from all layers
            for (const layerName in mvtTile.layers) {
              const layer = mvtTile.layers[layerName];
              console.log(`📦 Layer "${layerName}": ${layer.length} features`);
              
              for (let i = 0; i < layer.length; i++) {
                const feature = layer.feature(i);
                const props = feature.properties;
                
                // Debug: log first feature to see structure
                if (i === 0) {
                  console.log(`🔍 First feature properties:`, props);
                }
                
                // GFW SAR Fixed Infrastructure has lat/lon in properties
                // Try different possible property names
                const lat = props.lat ?? props.latitude ?? props.y;
                const lon = props.lon ?? props.longitude ?? props.x;
                
                if (lat !== undefined && lon !== undefined) {
                  const structure: GFWSARFixedInfrastructureInfo = {
                    structure_id: String(props.structure_id || props.id || `tile-${tile.z}-${tile.x}-${tile.y}-${i}`),
                    lat: parseFloat(String(lat)),
                    lon: parseFloat(String(lon)),
                    label: (props.label || props.type || 'unknown') as 'oil' | 'wind' | 'unknown',
                    label_confidence: props.label_confidence || props.confidence,
                    structure_start_date: props.structure_start_date ? parseInt(props.structure_start_date) : undefined,
                    structure_end_date: props.structure_end_date ? parseInt(props.structure_end_date) : undefined,
                  };
                  allStructures.push(structure);
                  console.log(`✅ Added structure:`, structure);
                } else {
                  console.warn(`⚠️ Feature ${i} missing lat/lon. Properties:`, Object.keys(props));
                }
              }
            }
            console.log(`✅ Parsed ${allStructures.length} structures from tile ${tile.z}/${tile.x}/${tile.y}`);
            continue; // Successfully parsed MVT, move to next tile
          } catch (mvtError) {
            console.error(`❌ Failed to parse MVT tile ${tile.z}/${tile.x}/${tile.y}:`, mvtError);
            continue;
          }
        }
        
        // Handle JSON responses (from proxy that already parsed MVT, or error responses)
        const responseText = await response.text();
        
        // Check if response looks like JSON (not source code)
        if (responseText.trim().startsWith('import ') || responseText.trim().startsWith('export ') || responseText.includes('from ')) {
          console.warn(`GFW proxy returned source code instead of JSON for tile ${tile.z}/${tile.x}/${tile.y}. Proxy may not be configured.`);
          continue;
        }
        
        if (!contentType || contentType.includes('application/json') || contentType.includes('text/json')) {
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.warn(`Failed to parse GFW proxy response as JSON for tile ${tile.z}/${tile.x}/${tile.y}:`, responseText.substring(0, 200));
            continue;
          }
          
          // Check if proxy returned an error about MVT parsing - try direct API call
          if (data.error && data.format === 'MVT_REQUIRES_SERVER') {
            // Try direct API call with MVT parsing
            try {
              const directUrl = `${GFW_API_BASE_URL}/v3/datasets/public-fixed-infrastructure-filtered:latest/context-layers/${tile.z}/${tile.x}/${tile.y}`;
              const directResponse = await fetch(directUrl, {
                headers: {
                  'Authorization': `Bearer ${GFW_API_KEY}`,
                },
              });
              
              if (directResponse.ok) {
                const mvtBuffer = await directResponse.arrayBuffer();
                const mvtTile = new VectorTile(new Pbf(new Uint8Array(mvtBuffer)));
                
                for (const layerName in mvtTile.layers) {
                  const layer = mvtTile.layers[layerName];
                  for (let i = 0; i < layer.length; i++) {
                    const feature = layer.feature(i);
                    const props = feature.properties;
                    if (props.lat !== undefined && props.lon !== undefined) {
                      const structure: GFWSARFixedInfrastructureInfo = {
                        structure_id: String(props.structure_id || ''),
                        lat: parseFloat(props.lat),
                        lon: parseFloat(props.lon),
                        label: (props.label || 'unknown') as 'oil' | 'wind' | 'unknown',
                        label_confidence: props.label_confidence,
                        structure_start_date: props.structure_start_date ? parseInt(props.structure_start_date) : undefined,
                        structure_end_date: props.structure_end_date ? parseInt(props.structure_end_date) : undefined,
                      };
                      allStructures.push(structure);
                    }
                  }
                }
                continue; // Successfully parsed, move to next tile
              }
            } catch (directError) {
              console.warn(`Direct API call failed for tile ${tile.z}/${tile.x}/${tile.y}:`, directError);
            }
            continue;
          }
          
          // Proxy returns { format: 'MVT_PARSED', features: [...], count: N }
          if (data.format === 'MVT_PARSED' && Array.isArray(data.features)) {
            for (const feature of data.features) {
              // Feature already has lat/lon in properties from GFW API
              if (feature.lat !== undefined && feature.lon !== undefined) {
                const structure: GFWSARFixedInfrastructureInfo = {
                  structure_id: String(feature.structure_id || ''),
                  lat: parseFloat(feature.lat),
                  lon: parseFloat(feature.lon),
                  label: feature.label || 'unknown',
                  label_confidence: feature.label_confidence,
                  structure_start_date: feature.structure_start_date ? parseInt(feature.structure_start_date) : undefined,
                  structure_end_date: feature.structure_end_date ? parseInt(feature.structure_end_date) : undefined,
                };
                allStructures.push(structure);
              }
            }
          }
        } else {
          console.warn(`GFW proxy returned unexpected content type for tile ${tile.z}/${tile.x}/${tile.y}: ${contentType}`);
        }
      } catch (error) {
        console.warn(`Error fetching GFW tile ${tile.z}/${tile.x}/${tile.y}:`, error);
      }
    }
    
    // Filter by distance and return
    return allStructures
      .map(structure => {
        const distance = calculateDistance(lat, lon, structure.lat, structure.lon);
        return { ...structure, distance };
      })
      .filter(structure => structure.distance <= maxRadius)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
  } catch (error) {
    console.error('Error fetching GFW SAR Fixed Infrastructure data:', error);
    throw error;
  }
}

/**
 * Test function to verify GFW API is returning features
 * Queries a known area with infrastructure (Gulf of Mexico - offshore oil platforms)
 * 
 * To test from browser console:
 * 1. Open browser DevTools console
 * 2. Run: window.testGFW = async () => { const mod = await import('./src/adapters/globalFishingWatch.ts'); return mod.testGFWAPI(); }; window.testGFW();
 * 
 * Or simpler - expose it globally for testing:
 */
export async function testGFWAPI(): Promise<GFWSARFixedInfrastructureInfo[]> {
  console.log('🧪 Testing GFW API - querying Gulf of Mexico area (known to have oil platforms)');
  
  // Gulf of Mexico coordinates - area known to have offshore infrastructure
  // Test multiple known locations: Gulf of Mexico (oil platforms), North Sea (wind farms), etc.
  const testLocations = [
    { lat: 28.0, lon: -90.0, name: 'Gulf of Mexico (oil platforms)' },
    { lat: 54.0, lon: 2.0, name: 'North Sea (wind farms)' },
    { lat: 30.0, lon: -88.0, name: 'Gulf Coast' },
  ];
  
  const zoom = 9;
  const allStructures: GFWSARFixedInfrastructureInfo[] = [];
  
  for (const location of testLocations) {
    console.log(`\n📍 Testing location: ${location.name} (${location.lat}, ${location.lon})`);
    
    // Calculate tiles for this location
    const tile = latLonToTile(location.lat, location.lon, zoom);
    console.log(`🗺️ Calculated tile: ${zoom}/${tile.x}/${tile.y}`);
    
    // Test a few tiles around this location
    const testTiles = [
      { x: tile.x, y: tile.y, z: zoom },
      { x: tile.x + 1, y: tile.y, z: zoom },
      { x: tile.x, y: tile.y + 1, z: zoom },
      { x: tile.x - 1, y: tile.y, z: zoom },
      { x: tile.x, y: tile.y - 1, z: zoom },
    ];
  
    
    for (const tile of testTiles) {
    try {
      console.log(`🔍 Testing tile ${tile.z}/${tile.x}/${tile.y}...`);
      
      // Try direct API call first
      const directUrl = `${GFW_API_BASE_URL}/v3/datasets/public-fixed-infrastructure-filtered:latest/context-layers/${tile.z}/${tile.x}/${tile.y}`;
      console.log(`📡 Direct API URL: ${directUrl}`);
      
      const directResponse = await fetch(directUrl, {
        headers: {
          'Authorization': `Bearer ${GFW_API_KEY}`,
        },
      });
      
      console.log(`📊 Response status: ${directResponse.status}`);
      console.log(`📊 Content-Type: ${directResponse.headers.get('content-type')}`);
      
      if (directResponse.ok) {
        const contentType = directResponse.headers.get('content-type');
        
        if (contentType && (contentType.includes('application/vnd.mapbox-vector-tile') || contentType.includes('application/x-protobuf'))) {
          console.log(`✅ Got MVT format, parsing...`);
          const arrayBuffer = await directResponse.arrayBuffer();
          const mvtTile = new VectorTile(new Pbf(new Uint8Array(arrayBuffer)));
          
          let featureCount = 0;
          for (const layerName in mvtTile.layers) {
            const layer = mvtTile.layers[layerName];
            console.log(`📦 Layer: ${layerName}, features: ${layer.length}`);
            
            for (let i = 0; i < layer.length; i++) {
              const feature = layer.feature(i);
              const props = feature.properties;
              
              console.log(`  Feature ${i}:`, {
                structure_id: props.structure_id,
                lat: props.lat,
                lon: props.lon,
                label: props.label,
                label_confidence: props.label_confidence,
              });
              
              if (props.lat !== undefined && props.lon !== undefined) {
                const structure: GFWSARFixedInfrastructureInfo = {
                  structure_id: String(props.structure_id || ''),
                  lat: parseFloat(props.lat),
                  lon: parseFloat(props.lon),
                  label: (props.label || 'unknown') as 'oil' | 'wind' | 'unknown',
                  label_confidence: props.label_confidence,
                  structure_start_date: props.structure_start_date ? parseInt(props.structure_start_date) : undefined,
                  structure_end_date: props.structure_end_date ? parseInt(props.structure_end_date) : undefined,
                };
                allStructures.push(structure);
                featureCount++;
              }
            }
          }
          console.log(`✅ Parsed ${featureCount} structures from tile ${tile.z}/${tile.x}/${tile.y}`);
        } else {
          const text = await directResponse.text();
          console.log(`⚠️ Unexpected content type. Response:`, text.substring(0, 500));
        }
      } else if (directResponse.status === 404) {
        console.log(`ℹ️ Tile ${tile.z}/${tile.x}/${tile.y} returned 404 (no infrastructure in this tile)`);
      } else {
        const errorText = await directResponse.text();
        console.error(`❌ Error ${directResponse.status}:`, errorText);
      }
      } catch (error) {
        console.error(`❌ Error testing tile ${tile.z}/${tile.x}/${tile.y}:`, error);
      }
    }
  }
  
  console.log(`\n🧪 Test complete. Found ${allStructures.length} total structures across all test locations.`);
  if (allStructures.length > 0) {
    console.log('✅ SUCCESS: GFW API is returning features!');
    console.log('Sample structures:', allStructures.slice(0, 5));
  } else {
    console.log('⚠️ WARNING: No structures found. This could mean:');
    console.log('  1. The test tiles don\'t contain infrastructure');
    console.log('  2. There\'s an issue with the API or authentication');
    console.log('  3. The tile coordinates need adjustment');
  }
  return allStructures;
}

/**
 * Get all SAR Fixed Infrastructure globally (for Global Risk map view)
 * Note: This would be very large, so we'll limit to recent/active structures
 */
export async function getAllGFWSARFixedInfrastructureData(): Promise<GFWSARFixedInfrastructureInfo[]> {
  try {
    console.log(`🌊 Querying ALL GFW SAR Fixed Infrastructure globally`);
    
    // For global view, we'll fetch a sample of tiles at lower zoom levels
    // This is a simplified approach - production would need more sophisticated tile management
    const zoom = 3; // Lower zoom for global view
    const allStructures: GFWSARFixedInfrastructureInfo[] = [];
    
    // Fetch a representative sample of tiles
    // For global view, we'll fetch tiles at zoom level 3 (8x8 = 64 tiles)
    const maxTiles = Math.pow(2, zoom);
    for (let x = 0; x < maxTiles; x++) {
      for (let y = 0; y < maxTiles; y++) {
        if (allStructures.length > 10000) break; // Limit total structures
        
        try {
          const proxyUrl = `/api/gfw-proxy?endpoint=/v3/datasets/public-fixed-infrastructure-filtered:latest/context-layers/${zoom}/${x}/${y}`;
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            // 404 is normal - many tiles don't contain infrastructure data
            if (response.status === 404) {
              continue; // Silently skip empty tiles
            }
            // Log other errors (5xx, auth errors, etc.)
            const errorText = await response.text().catch(() => 'Unknown error');
            console.warn(`GFW proxy error for tile ${zoom}/${x}/${y}:`, response.status, errorText.substring(0, 200));
            continue;
          }
          
          // Check content type first to determine how to handle response
          const contentType = response.headers.get('content-type');
          
          // Handle MVT format - parse client-side
          if (contentType && (contentType.includes('application/vnd.mapbox-vector-tile') || contentType.includes('application/x-protobuf'))) {
            try {
              const arrayBuffer = await response.arrayBuffer();
              const mvtTile = new VectorTile(new Pbf(new Uint8Array(arrayBuffer)));
              
              for (const layerName in mvtTile.layers) {
                const layer = mvtTile.layers[layerName];
                for (let i = 0; i < layer.length; i++) {
                  const feature = layer.feature(i);
                  const props = feature.properties;
                  if (props.lat !== undefined && props.lon !== undefined) {
                    const structure: GFWSARFixedInfrastructureInfo = {
                      structure_id: String(props.structure_id || ''),
                      lat: parseFloat(props.lat),
                      lon: parseFloat(props.lon),
                      label: (props.label || 'unknown') as 'oil' | 'wind' | 'unknown',
                      label_confidence: props.label_confidence,
                      structure_start_date: props.structure_start_date ? parseInt(props.structure_start_date) : undefined,
                      structure_end_date: props.structure_end_date ? parseInt(props.structure_end_date) : undefined,
                    };
                    allStructures.push(structure);
                  }
                }
              }
              continue; // Successfully parsed MVT, move to next tile
            } catch (mvtError) {
              console.warn(`Failed to parse MVT tile ${zoom}/${x}/${y}:`, mvtError);
              continue;
            }
          }
          
          // Handle JSON responses
          const responseText = await response.text();
          
          // Check if response looks like JSON (not source code)
          if (responseText.trim().startsWith('import ') || responseText.trim().startsWith('export ') || responseText.includes('from ')) {
            console.warn(`GFW proxy returned source code instead of JSON for tile ${zoom}/${x}/${y}. Proxy may not be configured.`);
            continue;
          }
          
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.warn(`Failed to parse GFW proxy response as JSON for tile ${zoom}/${x}/${y}:`, responseText.substring(0, 200));
            continue;
          }
          
          // Proxy returns { format: 'MVT_PARSED', features: [...], count: N }
          if (data.format === 'MVT_PARSED' && Array.isArray(data.features)) {
            for (const feature of data.features) {
              if (feature.lat !== undefined && feature.lon !== undefined) {
                const structure: GFWSARFixedInfrastructureInfo = {
                  structure_id: String(feature.structure_id || ''),
                  lat: parseFloat(feature.lat),
                  lon: parseFloat(feature.lon),
                  label: feature.label || 'unknown',
                  label_confidence: feature.label_confidence,
                  structure_start_date: feature.structure_start_date ? parseInt(feature.structure_start_date) : undefined,
                  structure_end_date: feature.structure_end_date ? parseInt(feature.structure_end_date) : undefined,
                };
                allStructures.push(structure);
              }
            }
          }
        } catch (error) {
          // Skip failed tiles
          console.warn(`Error fetching GFW tile ${zoom}/${x}/${y}:`, error);
        }
      }
      if (allStructures.length > 10000) break;
    }
    
    console.log(`✅ Retrieved ${allStructures.length} GFW SAR Fixed Infrastructure globally`);
    return allStructures;
  } catch (error) {
    console.error('Error fetching all GFW SAR Fixed Infrastructure data:', error);
    throw error;
  }
}
