/**
 * Adapter for AIS Stream WebSocket Service
 * Service URL: wss://stream.aisstream.io/v0/stream
 * API Key: 0256c200afb36e5acc502edb52da76989f307efe
 */

export interface AISVesselInfo {
  MMSI: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  shipType?: string;
  vesselName?: string;
  callSign?: string;
  timestamp?: number;
}

const API_KEY = '0256c200afb36e5acc502edb52da76989f307efe';
const WS_ENDPOINT = 'wss://stream.aisstream.io/v0/stream';

let wsConnection: WebSocket | null = null;
let vesselCallbacks: Set<(vessels: AISVesselInfo[]) => void> = new Set();
let currentVessels: Map<string, AISVesselInfo> = new Map();
let reconnectAttempts = 0;
let currentBoundingBoxes: number[][][] = [];
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Subscribe to AIS stream with bounding box
 * @param boundingBoxes Array of bounding boxes [[[minLon, minLat], [maxLon, maxLat]]]
 * @param onVesselUpdate Callback function called when vessels are updated
 * @returns Function to unsubscribe
 */
export function subscribeToAISStream(
  boundingBoxes: number[][][],
  onVesselUpdate: (vessels: AISVesselInfo[]) => void
): () => void {
  vesselCallbacks.add(onVesselUpdate);
  
  // Store bounding boxes
  currentBoundingBoxes = boundingBoxes;
  
  // If connection doesn't exist or is closed, create new one
  if (!wsConnection || wsConnection.readyState === WebSocket.CLOSED) {
    connectWebSocket(boundingBoxes);
  } else if (wsConnection.readyState === WebSocket.OPEN) {
    // Update subscription with new bounding boxes
    updateSubscription(boundingBoxes);
    // Immediately send current vessels
    onVesselUpdate(Array.from(currentVessels.values()));
  } else if (wsConnection.readyState === WebSocket.CONNECTING) {
    // Wait for connection, then update subscription
    const checkConnection = setInterval(() => {
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        clearInterval(checkConnection);
        updateSubscription(boundingBoxes);
        onVesselUpdate(Array.from(currentVessels.values()));
      } else if (wsConnection && wsConnection.readyState === WebSocket.CLOSED) {
        clearInterval(checkConnection);
        connectWebSocket(boundingBoxes);
      }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkConnection), 5000);
  }
  
  // Return unsubscribe function
  return () => {
    vesselCallbacks.delete(onVesselUpdate);
    // Only disconnect if no more callbacks and connection is established
    if (vesselCallbacks.size === 0 && wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      disconnectWebSocket();
    }
  };
}

function connectWebSocket(boundingBoxes: number[][][]) {
  // Don't connect if already connecting or connected
  if (wsConnection && (wsConnection.readyState === WebSocket.CONNECTING || wsConnection.readyState === WebSocket.OPEN)) {
    // Just update subscription if already connected
    if (wsConnection.readyState === WebSocket.OPEN) {
      updateSubscription(boundingBoxes);
    }
    return;
  }
  
  // Disconnect any existing connection first
  if (wsConnection) {
    try {
      wsConnection.close();
    } catch (error) {
      // Ignore errors when closing
    }
    wsConnection = null;
  }
  
  try {
    console.log('🚢 Connecting to AIS Stream WebSocket...');
    currentBoundingBoxes = boundingBoxes;
    wsConnection = new WebSocket(WS_ENDPOINT);
    
    wsConnection.onopen = () => {
      console.log('✅ AIS Stream WebSocket connected');
      reconnectAttempts = 0;
      // CRITICAL: Subscription must be sent within 3 seconds of connection!
      // Send immediately - don't wait
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        updateSubscription(boundingBoxes);
      }
    };
    
    wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        if (data.MessageType === 'PositionReport') {
          handlePositionReport(data);
        } else if (data.MessageType === 'StaticData') {
          handleStaticData(data);
        } else {
          console.log('🚢 AIS: Received message type:', data.MessageType);
        }
      } catch (error) {
        console.error('❌ Error parsing AIS message:', error, event.data);
      }
    };
    
    wsConnection.onerror = (error) => {
      console.error('❌ AIS Stream WebSocket error:', error);
    };
    
    wsConnection.onclose = () => {
      console.log('⚠️ AIS Stream WebSocket closed');
      wsConnection = null;
      
      // Attempt to reconnect if there are active subscribers
      if (vesselCallbacks.size > 0 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // Exponential backoff, max 10s
        console.log(`🔄 Reconnecting to AIS Stream in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(() => {
          if (vesselCallbacks.size > 0 && currentBoundingBoxes.length > 0) {
            // Use stored bounding boxes for reconnection
            connectWebSocket(currentBoundingBoxes);
          }
        }, delay);
      }
    };
  } catch (error) {
    console.error('❌ Error creating AIS WebSocket connection:', error);
  }
}

function updateSubscription(boundingBoxes: number[][][]) {
  if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
    return;
  }
  
  // Validate bounding boxes - ensure all values are valid numbers (not null, not undefined, not NaN)
  const validBoundingBoxes: number[][][] = [];
  
  for (const box of boundingBoxes) {
    if (!Array.isArray(box) || box.length !== 2) continue;
    
    const [sw, ne] = box;
    if (!Array.isArray(sw) || !Array.isArray(ne) || sw.length !== 2 || ne.length !== 2) continue;
    
    const [minLon, minLat] = sw;
    const [maxLon, maxLat] = ne;
    
    // Strict validation: must be numbers, not null, not undefined, not NaN, and within valid ranges
    if (
      typeof minLon === 'number' && !isNaN(minLon) && minLon !== null && minLon !== undefined &&
      typeof minLat === 'number' && !isNaN(minLat) && minLat !== null && minLat !== undefined &&
      typeof maxLon === 'number' && !isNaN(maxLon) && maxLon !== null && maxLon !== undefined &&
      typeof maxLat === 'number' && !isNaN(maxLat) && maxLat !== null && maxLat !== undefined &&
      minLon >= -180 && minLon <= 180 &&
      minLat >= -90 && minLat <= 90 &&
      maxLon >= -180 && maxLon <= 180 &&
      maxLat >= -90 && maxLat <= 90 &&
      minLon < maxLon &&
      minLat < maxLat
    ) {
      validBoundingBoxes.push([[minLon, minLat], [maxLon, maxLat]]);
    }
  }
  
  if (validBoundingBoxes.length === 0) {
    console.warn('⚠️ No valid bounding boxes for AIS subscription');
    return;
  }
  
  // Double-check all values are numbers before sending - convert to numbers explicitly
  const finalBoundingBoxes = validBoundingBoxes.map(box => {
    const [[minLon, minLat], [maxLon, maxLat]] = box;
    return [
      [Number(minLon), Number(minLat)],
      [Number(maxLon), Number(maxLat)]
    ];
  });
  
  // Verify no null/undefined/NaN values
  const hasInvalidValues = finalBoundingBoxes.some(box => {
    const [[minLon, minLat], [maxLon, maxLat]] = box;
    return (
      isNaN(minLon) || isNaN(minLat) || isNaN(maxLon) || isNaN(maxLat) ||
      minLon === null || minLat === null || maxLon === null || maxLat === null ||
      minLon === undefined || minLat === undefined || maxLon === undefined || maxLat === undefined
    );
  });
  
  if (hasInvalidValues) {
    console.error('❌ Invalid bounding box values detected:', finalBoundingBoxes);
    return;
  }
  
  // Note: Documentation shows both "APIKey" and "Apikey" - using "APIKey" as shown in subscription example
  const subscription = {
    APIKey: API_KEY,  // Must match exactly - documentation shows "APIKey" in subscription example
    BoundingBoxes: finalBoundingBoxes
  };
  
  console.log('📡 Subscribing to AIS Stream with bounding boxes:', JSON.stringify(subscription));
  
  try {
    wsConnection.send(JSON.stringify(subscription));
  } catch (error) {
    console.error('❌ Error sending AIS subscription:', error);
  }
}

function handlePositionReport(data: any) {
  try {
    const mmsi = data.MMSI?.toString();
    if (!mmsi) {
      console.log('🚢 AIS: Skipping position report - no MMSI');
      return;
    }
    
    // Validate latitude and longitude - must be valid numbers
    const lat = typeof data.Latitude === 'number' && !isNaN(data.Latitude) ? data.Latitude : null;
    const lon = typeof data.Longitude === 'number' && !isNaN(data.Longitude) ? data.Longitude : null;
    
    // Skip if coordinates are invalid
    if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      console.log('🚢 AIS: Skipping position report - invalid coordinates', { mmsi, lat, lon });
      return;
    }
    
    const vessel: AISVesselInfo = {
      MMSI: mmsi,
      latitude: lat,
      longitude: lon,
      speed: typeof data.Sog === 'number' && !isNaN(data.Sog) ? data.Sog : undefined,
      heading: typeof data.Cog === 'number' && !isNaN(data.Cog) ? data.Cog : undefined,
      timestamp: Date.now()
    };
    
    // Merge with existing vessel data if available
    const existingVessel = currentVessels.get(mmsi);
    if (existingVessel) {
      // Preserve static data (name, callSign, shipType) when updating position
      vessel.vesselName = existingVessel.vesselName;
      vessel.callSign = existingVessel.callSign;
      vessel.shipType = existingVessel.shipType;
      Object.assign(existingVessel, vessel);
    } else {
      currentVessels.set(mmsi, vessel);
    }
    
    console.log(`🚢 AIS: Processed position report for ${mmsi} at [${lat}, ${lon}] (${currentVessels.size} total vessels)`);
    
    // Notify all callbacks
    notifyCallbacks();
  } catch (error) {
    console.error('❌ Error handling position report:', error);
  }
}

function handleStaticData(data: any) {
  try {
    const mmsi = data.MMSI?.toString();
    if (!mmsi) return;
    
    const vessel = currentVessels.get(mmsi) || {
      MMSI: mmsi,
      latitude: 0,
      longitude: 0
    };
    
    // Update static vessel information
    const vesselInfo = vessel as AISVesselInfo;
    if (data.VesselName) vesselInfo.vesselName = data.VesselName;
    if (data.CallSign) vesselInfo.callSign = data.CallSign;
    if (data.ShipType) vesselInfo.shipType = data.ShipType;
    
    currentVessels.set(mmsi, vessel);
    
    // Notify all callbacks
    notifyCallbacks();
  } catch (error) {
    console.error('❌ Error handling static data:', error);
  }
}

function notifyCallbacks() {
  const vessels = Array.from(currentVessels.values());
  console.log(`🚢 AIS: Notifying ${vesselCallbacks.size} callbacks with ${vessels.length} vessels`);
  vesselCallbacks.forEach(callback => {
    try {
      callback(vessels);
    } catch (error) {
      console.error('❌ Error in AIS vessel callback:', error);
    }
  });
}

function disconnectWebSocket() {
  if (wsConnection) {
    // Only close if connection is open or connecting
    if (wsConnection.readyState === WebSocket.OPEN || wsConnection.readyState === WebSocket.CONNECTING) {
      console.log('🚢 Disconnecting from AIS Stream...');
      try {
        wsConnection.close();
      } catch (error) {
        console.warn('⚠️ Error closing AIS WebSocket:', error);
      }
    }
    wsConnection = null;
  }
  currentVessels.clear();
}

/**
 * Get current vessels snapshot
 */
export function getCurrentVessels(): AISVesselInfo[] {
  return Array.from(currentVessels.values());
}

/**
 * Clear all vessels (useful when changing map bounds significantly)
 */
export function clearVessels() {
  currentVessels.clear();
  notifyCallbacks();
}

/**
 * Manual test function for AIS Stream
 * Call this from browser console: window.testAISStream()
 */
export function testAISStream() {
  console.log('🧪 Starting AIS Stream manual test...');
  
  const API_KEY = '0256c200afb36e5acc502edb52da76989f307efe';
  const WS_ENDPOINT = 'wss://stream.aisstream.io/v0/stream';
  
  // Test bounding box (North America)
  const testBoundingBoxes = [[[-100, 25], [-70, 50]]];
  
  console.log('🧪 Connecting to:', WS_ENDPOINT);
  console.log('🧪 Bounding boxes:', testBoundingBoxes);
  
  const ws = new WebSocket(WS_ENDPOINT);
  let messageCount = 0;
  let positionReportCount = 0;
  let staticDataCount = 0;
  
  ws.onopen = () => {
    console.log('✅ WebSocket connected');
    
    const subscription = {
      APIKey: API_KEY,
      BoundingBoxes: testBoundingBoxes
    };
    
    console.log('📡 Sending subscription:', JSON.stringify(subscription));
    ws.send(JSON.stringify(subscription));
  };
  
  ws.onmessage = (event) => {
    messageCount++;
    try {
      const data = JSON.parse(event.data);
      
      if (data.MessageType === 'PositionReport') {
        positionReportCount++;
        const mmsi = data.MMSI;
        const lat = data.Latitude;
        const lon = data.Longitude;
        const speed = data.Sog;
        const heading = data.Cog;
        
        console.log(`📍 Position Report #${positionReportCount}:`, {
          MMSI: mmsi,
          Latitude: lat,
          Longitude: lon,
          Speed: speed,
          Heading: heading,
          MessageType: data.MessageType
        });
        
        // Validate coordinates
        if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
          console.error('❌ Invalid coordinates:', { lat, lon });
        } else if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          console.error('❌ Coordinates out of range:', { lat, lon });
        } else {
          console.log('✅ Valid coordinates');
        }
      } else if (data.MessageType === 'StaticData') {
        staticDataCount++;
        console.log(`📋 Static Data #${staticDataCount}:`, {
          MMSI: data.MMSI,
          VesselName: data.VesselName,
          CallSign: data.CallSign,
          ShipType: data.ShipType
        });
      } else {
        console.log('📨 Other message:', data.MessageType, data);
      }
      
      if (messageCount % 10 === 0) {
        console.log(`📊 Stats: ${messageCount} total messages, ${positionReportCount} position reports, ${staticDataCount} static data`);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error, event.data);
    }
  };
  
  ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
  };
  
  ws.onclose = (event) => {
    console.log('⚠️ WebSocket closed:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    console.log(`📊 Final stats: ${messageCount} total messages, ${positionReportCount} position reports, ${staticDataCount} static data`);
  };
  
  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up test connection...');
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };
}

// Make test function available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).testAISStream = testAISStream;
}
