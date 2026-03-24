// One-off: PA point — matches osmGlobalDataCenters.ts query shape
// Usage: MILES=500 node scripts/test-datacenter-overpass.mjs
const lat = 40.7934;
const lon = -77.86;
const miles = Number(process.env.MILES || 1000);
const r = Math.round(miles * 1609.34);

// Matches osmGlobalDataCenters.ts via queryOverpass (nwr + out center, no recurse)
const timeoutSec = Number(process.env.OVERPASS_TIMEOUT || 180);
const q = `[out:json][timeout:${timeoutSec}];
(
  nwr["man_made"="data_center"](around:${r},${lat},${lon});
  nwr["building"="data_center"](around:${r},${lat},${lon});
  nwr["telecom"="data_center"](around:${r},${lat},${lon});
);
out center tags;`;

function haversineMi(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const base =
  process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const t0 = Date.now();
const res = await fetch(base, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'data=' + encodeURIComponent(q),
});
const text = await res.text();
const ms = Date.now() - t0;
console.log('Center: State College area PA', lat, lon, '| radius ~', miles, 'mi =', r, 'm');
console.log('HTTP', res.status, 'in', ms, 'ms\n');

let data;
try {
  data = JSON.parse(text);
} catch {
  console.log('Non-JSON (first 800 chars):\n', text.slice(0, 800));
  process.exit(1);
}

const els = data.elements || [];
const tagged = els.filter(
  (e) =>
    e.tags &&
    (e.tags.man_made === 'data_center' ||
      e.tags.building === 'data_center' ||
      e.tags.telecom === 'data_center')
);

console.log('Raw elements:', els.length, '| Tagged data_center:', tagged.length);
if (data.remark) console.log('remark:', data.remark);

const byType = {};
for (const e of tagged) {
  byType[e.type] = (byType[e.type] || 0) + 1;
}
console.log('Tagged by type:', byType);

const withDist = tagged
  .map((e) => {
    let la = e.lat;
    let lo = e.lon;
    if (e.center) {
      la = e.center.lat;
      lo = e.center.lon;
    }
    if (la == null || lo == null) return null;
    return {
      type: e.type,
      id: e.id,
      name: e.tags.name || null,
      tag:
        e.tags.man_made === 'data_center'
          ? 'man_made'
          : e.tags.building === 'data_center'
            ? 'building'
            : 'telecom',
      lat: la,
      lon: lo,
      dist_mi: Number(haversineMi(lat, lon, la, lo).toFixed(2)),
    };
  })
  .filter(Boolean)
  .filter((x) => x.dist_mi <= miles);

withDist.sort((a, b) => a.dist_mi - b.dist_mi);
console.log(`Within ${miles} mi (tagged + has coords):`, withDist.length);
console.log('\nNearest 20:');
console.log(JSON.stringify(withDist.slice(0, 20), null, 2));
