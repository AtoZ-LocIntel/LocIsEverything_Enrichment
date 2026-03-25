/**
 * Manual test — matches osmGlobalDesalinationPlants.ts (single merged query).
 *
 *   node scripts/test-desal-overpass.mjs
 *   LAT=32.8 LON=34.98 MILES=50 OVERPASS_URL=... node scripts/test-desal-overpass.mjs
 */

function buildQueryWithInlineAround(layerFilters, radiusMeters, lat, lon, timeoutSec) {
  const parts = layerFilters
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const lines = [];
  for (const part of parts) {
    if (part.includes('(around:')) {
      lines.push(part.endsWith(';') ? part : `${part};`);
    } else {
      lines.push(`${part}(around:${radiusMeters},${lat},${lon});`);
    }
  }
  return `[out:json][timeout:${timeoutSec}];
(
${lines.join('\n')}
);
out center tags;`;
}

const LAYER_FILTERS = `
  nwr["man_made"="water_works"]["plant:method"="desalination"];
  nwr["industrial"="water_works"]["plant:source"="seawater"];
  nwr["man_made"="desalination_plant"];
  nwr["plant:method"="desalination"];
`;

const lat = Number(process.env.LAT ?? 24.71);
const lon = Number(process.env.LON ?? 46.67);
const miles = Number(process.env.MILES ?? 80);
const timeoutSec = 180;
const radiusMeters = Math.round(miles * 1609.34);
const base = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';

const q = buildQueryWithInlineAround(LAYER_FILTERS, radiusMeters, lat, lon, timeoutSec);
console.log('Center', lat, lon, 'miles', miles, '\n');
console.log(q.slice(0, 700), '\n...\n');

const res = await fetch(base, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'data=' + encodeURIComponent(q),
});
const text = await res.text();
console.log('HTTP', res.status);
if (!res.ok) {
  console.log(text.slice(0, 500));
  process.exit(1);
}
const data = JSON.parse(text);
if (data.remark) console.log('remark:', data.remark);
const els = data.elements || [];
console.log('elements:', els.length);
for (let i = 0; i < Math.min(8, els.length); i++) {
  const e = els[i];
  const t = e.tags || {};
  const la = e.lat ?? e.center?.lat;
  const lo = e.lon ?? e.center?.lon;
  console.log(`  ${e.type}/${e.id} ${la},${lo} ${t.name || ''} method=${t['plant:method'] || '—'} man_made=${t.man_made || '—'}`);
}
