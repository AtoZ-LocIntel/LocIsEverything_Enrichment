# AIS Proxy Server Deployment Guide

This guide explains how to deploy the AIS WebSocket proxy server.

## Why Do We Need This?

AISStream.io **does not support direct browser connections** due to CORS restrictions. The WebSocket connection must be made from a backend server, which then proxies the data to browser clients.

## Quick Start (Local Testing)

1. **Install dependencies:**
   ```bash
   npm install ws express cors
   ```

2. **Run the server:**
   ```bash
   node ais-proxy-server.js
   ```

3. **Test the connection:**
   - Server runs on `http://localhost:3001`
   - WebSocket endpoint: `ws://localhost:3001`
   - Health check: `http://localhost:3001/health`

## Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. **Sign up:** https://railway.app (free tier available)

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or "Empty Project")

3. **Add the proxy server:**
   - If deploying from GitHub, push `ais-proxy-server.js` and `ais-proxy-package.json` to your repo
   - Railway will auto-detect Node.js and install dependencies

4. **Set environment variables:**
   - No environment variables needed (API key is hardcoded for now)
   - You can move it to `process.env.AIS_API_KEY` for better security

5. **Deploy:**
   - Railway will automatically deploy
   - Note the public URL (e.g., `https://your-app.railway.app`)

6. **Update frontend:**
   - Change WebSocket URL from `wss://stream.aisstream.io/v0/stream` to `wss://your-app.railway.app`

### Option 2: Render

1. **Sign up:** https://render.com (free tier available)

2. **Create new Web Service:**
   - Connect your GitHub repo
   - Select "Web Service"
   - Build command: `npm install`
   - Start command: `node ais-proxy-server.js`
   - Environment: `Node`

3. **Deploy:**
   - Render will automatically deploy
   - Note the public URL

### Option 3: Fly.io

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create `fly.toml`:**
   ```toml
   app = "your-ais-proxy"
   primary_region = "iad"

   [build]

   [http_service]
     internal_port = 3001
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
     processes = ["app"]

   [[services]]
     protocol = "tcp"
     internal_port = 3001
   ```

3. **Deploy:**
   ```bash
   fly launch
   fly deploy
   ```

## Updating Frontend Code

Once deployed, update `src/adapters/aisStream.ts`:

```typescript
// Change from:
const WS_ENDPOINT = 'wss://stream.aisstream.io/v0/stream';

// To:
const WS_ENDPOINT = 'wss://your-proxy-server.railway.app';
```

## Security Considerations

1. **Move API key to environment variable:**
   ```javascript
   const AIS_API_KEY = process.env.AIS_API_KEY || '0256c200afb36e5acc502edb52da76989f307efe';
   ```

2. **Add authentication (optional):**
   - Add API key or token validation for browser clients
   - Rate limiting to prevent abuse

3. **CORS configuration:**
   - The server already includes CORS middleware
   - You can restrict origins if needed:
     ```javascript
     app.use(cors({
       origin: 'https://your-frontend-domain.com'
     }));
     ```

## Cost

- **Railway:** Free tier includes 500 hours/month, $5 credit
- **Render:** Free tier available (sleeps after inactivity)
- **Fly.io:** Free tier includes 3 shared VMs

All options are suitable for development and low-traffic production use.

## Monitoring

Check server health:
```bash
curl https://your-proxy-server.railway.app/health
```

Response:
```json
{
  "status": "ok",
  "aisConnected": true,
  "browserClients": 2
}
```
