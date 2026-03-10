import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
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
      }
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
    port: 3000
  }
})
