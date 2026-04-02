/**
 * Quick AIS Stream WebSocket smoke test (no HTTP layer).
 * Usage (from repo root):
 *   set AISSTREAM_API_KEY=your_key&& node scripts/test-ais-ws.mjs
 *   # optional: LAT=34.05 LON=-118.25 RADIUS_MILES=50 node scripts/test-ais-ws.mjs
 */
import WebSocket from 'ws';

const API_KEY = process.env.AISSTREAM_API_KEY || process.env.AIS_STREAM_API_KEY;
const lat = parseFloat(process.env.LAT || '34.05', 10);
const lon = parseFloat(process.env.LON || '-118.25', 10);
const radiusMiles = Math.min(500, Math.max(5, parseFloat(process.env.RADIUS_MILES || '80', 10) || 80));

function milesToLatDelta(miles) {
  return miles / 69;
}
function milesToLonDelta(miles, latDeg) {
  const cos = Math.cos((latDeg * Math.PI) / 180);
  return miles / (69 * Math.max(Math.abs(cos), 0.01));
}

if (!API_KEY) {
  console.error('Set AISSTREAM_API_KEY (or AIS_STREAM_API_KEY) in the environment.');
  process.exit(1);
}

const dLat = milesToLatDelta(radiusMiles);
const dLon = milesToLonDelta(radiusMiles, lat);
const minLat = Math.max(-90, lat - dLat);
const maxLat = Math.min(90, lat + dLat);
const minLon = Math.max(-180, lon - dLon);
const maxLon = Math.min(180, lon + dLon);

const boundingBoxes = [[[maxLat, minLon], [minLat, maxLon]]];
const url = 'wss://stream.aisstream.io/v0/stream';

console.log(`Connecting to ${url}...`);
console.log(`BBox around [${lat}, ${lon}] r=${radiusMiles}mi → corners [${maxLat}, ${minLon}] and [${minLat}, ${maxLon}]`);

const ws = new WebSocket(url);
let count = 0;
let positionReports = 0;
const t0 = Date.now();

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      APIKey: API_KEY,
      BoundingBoxes: boundingBoxes,
      FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport', 'ExtendedClassBPositionReport'],
    })
  );
  console.log('Subscription sent (Class A + Class B position types).');
});

ws.on('message', (data) => {
  count++;
  try {
    const raw = JSON.parse(String(data));
    const msg = raw.Message || {};
    if (msg.PositionReport || msg.StandardClassBPositionReport || msg.ExtendedClassBPositionReport) {
      positionReports++;
    }
  } catch {
    /* ignore */
  }
});

const done = () => {
  const ms = Date.now() - t0;
  console.log(`Done in ${ms}ms: ${count} raw messages, ~${positionReports} position-like parses.`);
  try {
    ws.close();
  } catch {
    /* ignore */
  }
  process.exit(positionReports > 0 || count > 0 ? 0 : 2);
};

setTimeout(done, 12000);

ws.on('error', (err) => {
  console.error('WebSocket error:', err.message || err);
  process.exit(1);
});
