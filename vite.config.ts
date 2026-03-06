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
