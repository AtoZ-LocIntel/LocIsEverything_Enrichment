// Single-statement Overpass test (avoid PowerShell mangling node -e)
const lat = Number(process.env.LAT ?? 32.1045);
const lon = Number(process.env.LON ?? 34.8276);
const miles = Number(process.env.MILES ?? 10);
const r = Math.round(miles * 1609.34);
const url = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const tag = process.env.TAG || 'plant_method'; // plant_method | desalination_plant
const filter =
  tag === 'desalination_plant'
    ? `nwr["man_made"="desalination_plant"](around:${r},${lat},${lon})`
    : `nwr["plant:method"="desalination"](around:${r},${lat},${lon})`;
const q = `[out:json][timeout:90];
(
  ${filter};
);
out center tags;`;

console.log(q);
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'data=' + encodeURIComponent(q),
});
const text = await res.text();
console.log('HTTP', res.status);
if (!res.ok) {
  console.log(text.slice(0, 400));
  process.exit(1);
}
const d = JSON.parse(text);
console.log('elements', d.elements?.length, d.remark || '');
