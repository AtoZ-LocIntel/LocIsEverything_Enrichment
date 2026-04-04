import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

/** Directory containing `vite.config.ts` — use for `loadEnv` so `.env` is found even when `cwd` ≠ project root. */
const viteConfigDir = path.dirname(fileURLToPath(import.meta.url))

/** Local dev: run AIS snapshot in Node (same logic as api/aisstream/snapshot.ts) so /api/aisstream/snapshot returns JSON. */
function aisSnapshotDevPlugin(mode: string) {
  return {
    name: 'ais-snapshot-local',
    configureServer(server: { middlewares: { use: (fn: unknown) => void } }) {
      server.middlewares.use(
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const url = req.url || ''
          if (!url.startsWith('/api/aisstream/snapshot')) {
            return next()
          }
          if (process.env.VITE_AIS_PROXY_TARGET) {
            return next()
          }
          if (req.method !== 'GET') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }
          try {
            const env = loadEnv(mode, viteConfigDir, '')
            const ais =
              (env.AISSTREAM_API_KEY && String(env.AISSTREAM_API_KEY).trim()) ||
              (env.AIS_STREAM_API_KEY && String(env.AIS_STREAM_API_KEY).trim())
            if (ais) {
              process.env.AISSTREAM_API_KEY = ais
            }
            const { runAISStreamSnapshotQuery } = await import('./api/aisstream/snapshotCore.ts')
            const u = new URL(url, 'http://localhost')
            const query: Record<string, string | string[]> = {}
            u.searchParams.forEach((v, k) => {
              const cur = query[k]
              if (cur === undefined) {
                query[k] = v
              } else if (Array.isArray(cur)) {
                cur.push(v)
              } else {
                query[k] = [cur, v]
              }
            })
            const { status, body } = await runAISStreamSnapshotQuery(query)
            res.setHeader('Content-Type', 'application/json')
            if (status === 200) {
              res.setHeader('Cache-Control', 'no-store')
            }
            res.statusCode = status
            res.end(JSON.stringify(body))
          } catch (e) {
            console.error('[vite] AIS snapshot middleware:', e)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'AIS snapshot dev middleware failed' }))
          }
        }
      )
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), aisSnapshotDevPlugin(mode)],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Nominatim blocks browser CORS on localhost; proxy same as production /api/nominatim/search
      '/api/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/nominatim/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader(
              'User-Agent',
              'LocIsEverything-Enrichment/1.0 (https://knowyourlocation.com; noreply@locationmart.com)'
            );
            proxyReq.setHeader('Accept', 'application/json');
          });
        },
      },
      // OpenSky only allows opensky-network.org in Access-Control-Allow-Origin — browser fetch from localhost needs a dev proxy.
      '/api/opensky-proxy': {
        target: 'https://opensky-network.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/opensky-proxy/, '/api/states/all'),
      },
      '/api/acled-token': {
        target: 'https://acleddata.com',
        changeOrigin: true,
        rewrite: (path) => '/oauth/token',
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Intercept the request and add form data
            if (req.method === 'POST') {
              const formData = new URLSearchParams();
              formData.append('username', 'AtoZgis@gmail.com');
              formData.append('password', '!!77PineCone77!!');
              formData.append('grant_type', 'password');
              formData.append('client_id', 'acled');
              
              const body = formData.toString();
              proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
              proxyReq.setHeader('Content-Length', Buffer.byteLength(body));
              proxyReq.write(body);
            }
          });
        }
      },
      '/api/acled-proxy': {
        target: 'https://acleddata.com',
        changeOrigin: true,
        rewrite: (path) => '/api/acled/read', // Vite automatically appends query string
        configure: (proxy, _options) => {
          // Cache for token in proxy context (shared across requests)
          let cachedToken: string | null = null;
          let tokenExpiry: number = 0;
          let tokenPromise: Promise<string> | null = null;
          
          // Function to get token (with promise caching to avoid concurrent requests)
          const getToken = async (): Promise<string> => {
            const now = Date.now();
            
            // Return cached token if still valid
            if (cachedToken && now < tokenExpiry) {
              return cachedToken;
            }
            
            // If token request is already in progress, wait for it
            if (tokenPromise) {
              return tokenPromise;
            }
            
            // Start new token request
            tokenPromise = (async () => {
              try {
                const tokenFormData = new URLSearchParams();
                tokenFormData.append('username', 'AtoZgis@gmail.com');
                tokenFormData.append('password', '!!77PineCone77!!');
                tokenFormData.append('grant_type', 'password');
                tokenFormData.append('client_id', 'acled');
                
                const tokenResponse = await fetch('https://acleddata.com/oauth/token', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: tokenFormData.toString(),
                });
                
                if (!tokenResponse.ok) {
                  throw new Error(`Token request failed: ${tokenResponse.status}`);
                }
                
                const tokenData = await tokenResponse.json();
                cachedToken = tokenData.access_token;
                tokenExpiry = now + (tokenData.expires_in * 1000) - (60 * 60 * 1000);
                tokenPromise = null; // Clear promise cache
                return cachedToken;
              } catch (error) {
                tokenPromise = null; // Clear promise cache on error
                throw error;
              }
            })();
            
            return tokenPromise;
          };
          
          proxy.on('proxyReq', async (proxyReq, req, _res) => {
            try {
              // Log the actual URL being proxied
              const fullUrl = req.url || '';
              const queryString = fullUrl.includes('?') ? fullUrl.split('?')[1] : '';
              console.log('🔗 [Vite Proxy] Original request URL:', fullUrl);
              console.log('🔗 [Vite Proxy] Query string:', queryString);
              console.log('🔗 [Vite Proxy] Proxying to:', `https://acleddata.com/api/acled/read${queryString ? '?' + queryString : ''}`);
              
              // Ensure the path includes query parameters
              if (queryString) {
                proxyReq.path = `/api/acled/read?${queryString}`;
              } else {
                proxyReq.path = '/api/acled/read';
              }
              
              console.log('🔐 [Vite Proxy] Getting ACLED token for request...');
              const token = await getToken();
              if (token) {
                proxyReq.setHeader('Authorization', `Bearer ${token}`);
                console.log('✅ [Vite Proxy] Authorization header added');
              } else {
                console.error('❌ [Vite Proxy] No token obtained');
              }
            } catch (error) {
              console.error('❌ [Vite Proxy] Error getting token:', error);
              // Continue without token - ACLED will return 403, but at least request goes through
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Log response status for debugging
            console.log(`📡 [Vite Proxy] ACLED API response: ${proxyRes.statusCode}`);
            if (proxyRes.statusCode === 403) {
              console.error('❌ [Vite Proxy] 403 Forbidden - Authentication may have failed');
            }
          });
        }
      },
      // GFW proxy - requires server-side MVT parsing, so we proxy to GFW API directly
      // Note: MVT parsing won't work in Vite dev, but at least requests will go through
      '/api/gfw-proxy': {
        target: 'https://gateway.api.globalfishingwatch.org',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Extract endpoint from query string and rewrite the path
            const url = new URL(req.url || '', `http://localhost:3000`);
            const endpoint = url.searchParams.get('endpoint');
            
            if (endpoint) {
              // Rewrite the path to use the endpoint
              proxyReq.path = endpoint;
              
              // Preserve other query params (excluding 'endpoint')
              const additionalParams = new URLSearchParams();
              url.searchParams.forEach((value, key) => {
                if (key !== 'endpoint') {
                  additionalParams.append(key, value);
                }
              });
              const queryString = additionalParams.toString();
              if (queryString) {
                proxyReq.path += `?${queryString}`;
              }
            }
            
            // Add GFW API key from the serverless function
            const gfwApiKey = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJLbm93WW91ckxvY2F0aW9uIiwidXNlcklkIjo1NzM2MiwiYXBwbGljYXRpb25OYW1lIjoiS25vd1lvdXJMb2NhdGlvbiIsImlkIjo0ODQyLCJ0eXBlIjoidXNlci1hcHBsaWNhdGlvbiJ9LCJpYXQiOjE3NzMxNTI2MjIsImV4cCI6MjA4ODUxMjYyMiwiYXVkIjoiZ2Z3IiwiaXNzIjoiZ2Z3In0.nmObatF1FPGO8eLkEQSxI_4gTLGtLySyV6E4bC0XkOGz8d-Xqyl8I7rqkbvdK1wv45y9W8vkpXtVDVPNylkfWzsarJK1Tc4lYDOk_3B7QG99POQZ8JHUP4QfWqvtiNBbPkayV82hS4eiJnMkgqxhtlQTRnK4-7JB2QOd81RTorKCN-O95kgLDSWqUNYTccrlxnWNpXq-iaq3hkZK1TIY5G1uREHYxlsL3e7T7o8Ato19qeTpTcr1KCQg14IDXepdScL5xQ5mne4zW0WHCbXSXeH-3U6QCDn9P6L8tlSvIrpd3aAQVhsUDOvjA80h4Z6POReQF7xrwrWOSnXI1IYq_sfSkTozJGB02POU0z4lpZW7TwHso439bl-KmrUUw74AcjJZSgFE_gMpt6_QaXYXTLbD6GPTiGkxgMubLS-7LB2gDFwiqo5aY8gCwbUi8NFdMONtOyhPpGZ8urvUUZ6Ut5OYesbIAdBl0LrFQE1XJbXwEqkxWeCPmG7Ejzfk4_io';
            proxyReq.setHeader('Authorization', `Bearer ${gfwApiKey}`);
            proxyReq.setHeader('Content-Type', 'application/json');
            
            console.log(`🔗 [Vite GFW Proxy] Proxying to: ${proxyReq.path}`);
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // MVT format will be parsed client-side using @mapbox/vector-tile
            // Let it pass through - the adapter will handle parsing
            const contentType = proxyRes.headers['content-type'];
            if (contentType && (contentType.includes('application/vnd.mapbox-vector-tile') || contentType.includes('application/x-protobuf'))) {
              console.log('✅ [Vite GFW Proxy] MVT tile received, will be parsed client-side');
            }
          });
        }
      },
      /** Mobility Database Catalog — forwards to /v1/gtfs_feeds with Bearer from .env (MOBILITY_DATABASE_API_TOKEN) */
      '/api/mobility-database-gtfs-feeds': {
        target: 'https://api.mobilitydatabase.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/mobility-database-gtfs-feeds/, '/v1/gtfs_feeds'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const token = process.env.MOBILITY_DATABASE_API_TOKEN;
            if (token) {
              proxyReq.setHeader('Authorization', `Bearer ${token}`);
            }
            proxyReq.setHeader('Accept', 'application/json');
          });
        },
      },
      // AIS Stream runs only on Vercel serverless; proxy to production so `npm run dev` can load ships.
      ...(process.env.VITE_AIS_PROXY_TARGET
        ? {
            '/api/aisstream': {
              target: process.env.VITE_AIS_PROXY_TARGET.replace(/\/$/, ''),
              changeOrigin: true,
              secure: true,
            },
          }
        : {}),
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
          utils: ['papaparse', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  preview: {
    port: 3000,
    proxy: {
      '/api/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/nominatim/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader(
              'User-Agent',
              'LocIsEverything-Enrichment/1.0 (https://knowyourlocation.com; noreply@locationmart.com)'
            );
            proxyReq.setHeader('Accept', 'application/json');
          });
        },
      },
      '/api/opensky-proxy': {
        target: 'https://opensky-network.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/opensky-proxy/, '/api/states/all'),
      },
    },
  },
}))
