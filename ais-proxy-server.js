/**
 * AIS Stream WebSocket Proxy Server
 * 
 * This server connects to AISStream.io and proxies messages to browser clients.
 * 
 * To run:
 *   1. Install dependencies: npm install ws express cors
 *   2. Run: node ais-proxy-server.js
 *   3. Server runs on http://localhost:3001
 * 
 * To deploy:
 *   - Railway: https://railway.app (free tier available)
 *   - Render: https://render.com (free tier available)
 *   - Fly.io: https://fly.io (free tier available)
 */

const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const http = require('http');

const AIS_API_KEY = '0256c200afb36e5acc502edb52da76989f307efe';
const AIS_ENDPOINT = 'wss://stream.aisstream.io/v0/stream';
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Store all connected browser clients
const browserClients = new Set();

// AIS WebSocket connection (single connection shared by all clients)
let aisConnection = null;
let currentBoundingBoxes = [[[-180, -90], [180, 90]]]; // Default: entire world

/**
 * Connect to AIS Stream
 */
function connectToAIS() {
  if (aisConnection && aisConnection.readyState === WebSocket.OPEN) {
    console.log('✅ AIS connection already open');
    return;
  }

  console.log('🚢 Connecting to AIS Stream...');
  aisConnection = new WebSocket(AIS_ENDPOINT);

  aisConnection.onopen = () => {
    console.log('✅ Connected to AIS Stream');
    
    // Send subscription immediately (must be within 3 seconds)
    const subscription = {
      APIKey: AIS_API_KEY,
      BoundingBoxes: currentBoundingBoxes
    };
    
    console.log('📡 Sending subscription:', JSON.stringify(subscription));
    aisConnection.send(JSON.stringify(subscription));
  };

  aisConnection.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Broadcast to all connected browser clients
      const message = JSON.stringify(data);
      browserClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error('❌ Error parsing AIS message:', error);
    }
  };

  aisConnection.onerror = (error) => {
    console.error('❌ AIS Stream error:', error);
  };

  aisConnection.onclose = () => {
    console.log('⚠️ AIS Stream connection closed');
    aisConnection = null;
    
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      if (browserClients.size > 0) {
        console.log('🔄 Reconnecting to AIS Stream...');
        connectToAIS();
      }
    }, 5000);
  };
}

/**
 * WebSocket server for browser clients
 */
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('🌐 Browser client connected');
  browserClients.add(ws);

  // Connect to AIS if not already connected
  if (!aisConnection || aisConnection.readyState !== WebSocket.OPEN) {
    connectToAIS();
  }

  // Handle messages from browser (e.g., bounding box updates)
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'updateBoundingBoxes' && data.boundingBoxes) {
        currentBoundingBoxes = data.boundingBoxes;
        
        // Update AIS subscription
        if (aisConnection && aisConnection.readyState === WebSocket.OPEN) {
          const subscription = {
            APIKey: AIS_API_KEY,
            BoundingBoxes: currentBoundingBoxes
          };
          aisConnection.send(JSON.stringify(subscription));
          console.log('📡 Updated AIS subscription with new bounding boxes');
        }
      }
    } catch (error) {
      console.error('❌ Error handling browser message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🌐 Browser client disconnected');
    browserClients.delete(ws);
    
    // Close AIS connection if no clients remain
    if (browserClients.size === 0 && aisConnection) {
      console.log('🔌 No clients remaining, closing AIS connection');
      aisConnection.close();
    }
  });

  ws.on('error', (error) => {
    console.error('❌ Browser client error:', error);
    browserClients.delete(ws);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    aisConnected: aisConnection && aisConnection.readyState === WebSocket.OPEN,
    browserClients: browserClients.size
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 AIS Proxy Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
