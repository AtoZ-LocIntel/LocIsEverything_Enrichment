/**
 * Leaflet popup HTML for USGS FDSN earthquake GeoJSON properties.
 * @see https://earthquake.usgs.gov/fdsnws/event/1/
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** USGS property keys in a sensible order for the popup (remaining keys follow alphabetically). */
const PRIMARY_ORDER = [
  'title',
  'place',
  'mag',
  'magType',
  'type',
  'time',
  'updated',
  'tz',
  'depth',
  'lat',
  'lon',
  'distance_miles',
  'status',
  'alert',
  'tsunami',
  'sig',
  'felt',
  'cdi',
  'mmi',
  'nst',
  'dmin',
  'rms',
  'gap',
  'net',
  'code',
  'id',
  'ids',
  'sources',
  'types',
  'url',
  'detail',
] as const;

const LABELS: Record<string, string> = {
  title: 'Title',
  place: 'Place',
  mag: 'Magnitude',
  magType: 'Magnitude type',
  type: 'Event type',
  time: 'Origin time',
  updated: 'Last updated',
  tz: 'Timezone offset (min from UTC)',
  depth: 'Depth',
  lat: 'Latitude',
  lon: 'Longitude',
  distance_miles: 'Distance from search point',
  status: 'Review status',
  alert: 'Pager alert level',
  tsunami: 'Tsunami',
  sig: 'Significance',
  felt: 'Felt reports (DYFI count)',
  cdi: 'Community intensity (CDI)',
  mmi: 'Max MMI (shaking)',
  nst: 'Seismic stations used',
  dmin: 'Distance to nearest station (°)',
  rms: 'RMS travel-time residual (s)',
  gap: 'Largest azimuthal gap (°)',
  net: 'Contributing network',
  code: 'Network event ID',
  id: 'Event ID',
  ids: 'Linked event IDs',
  sources: 'Data sources',
  types: 'Product types',
  url: 'Event page',
  detail: 'Detail (GeoJSON) URL',
};

function formatScalar(key: string, value: unknown): string {
  if (value === null || value === undefined) return '';

  if (key === 'time' || key === 'updated') {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return escapeHtml(String(value));
    const d = new Date(n);
    return `${escapeHtml(d.toLocaleString())} <span style="color:#9ca3af">(UTC: ${escapeHtml(d.toISOString())})</span>`;
  }

  if (key === 'tz') {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return escapeHtml(String(value));
    return escapeHtml(`${n} min from UTC`);
  }

  if (key === 'tsunami') {
    const n = Number(value);
    if (n === 1) return '<span style="color:#dc2626;font-weight:600">Yes — tsunami possible</span>';
    if (n === 0) return 'No';
    return escapeHtml(String(value));
  }

  if (key === 'mag' && typeof value === 'number') {
    return escapeHtml(value.toFixed(1));
  }

  if (
    (key === 'depth' || key === 'dmin' || key === 'rms' || key === 'gap' || key === 'cdi' || key === 'mmi') &&
    typeof value === 'number'
  ) {
    return escapeHtml(
      key === 'depth' ? `${value.toFixed(1)} km` : value.toFixed(2)
    );
  }

  if (key === 'distance_miles' && typeof value === 'number') {
    return escapeHtml(`${value.toFixed(2)} miles`);
  }

  if (key === 'lat' || key === 'lon') {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return escapeHtml(String(value));
    return escapeHtml(n.toFixed(5));
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return escapeHtml(String(value));
  }

  return escapeHtml(String(value));
}

function labelForKey(key: string): string {
  return LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Builds HTML for a Leaflet popup from a USGS earthquake feature object (adapter or enrichment payload).
 */
export function buildUSGSEarthquakePopupHtml(earthquake: Record<string, unknown>): string {
  const eq = { ...earthquake };
  const hasTsunami = eq.tsunami === 1;
  const icon = '🌍';
  const used = new Set<string>();
  const rows: string[] = [];
  const headerText = String(eq.place || eq.title || 'Earthquake');
  const tsunamiBadge = hasTsunami ? ' 🌊' : '';

  const addRow = (key: string, label: string, valueHtml: string) => {
    if (!valueHtml) return;
    used.add(key);
    rows.push(
      `<div style="margin:2px 0"><strong>${escapeHtml(label)}:</strong> ${valueHtml}</div>`
    );
  };

  for (const key of PRIMARY_ORDER) {
    if (!(key in eq) || eq[key] === null || eq[key] === undefined || eq[key] === '') continue;
    const v = eq[key];
    // Header already shows place or title; skip repeating the same string
    if (key === 'title' && String(v) === headerText) continue;
    const formatted = formatScalar(key, v);
    if (!formatted) continue;
    addRow(key, labelForKey(key), formatted);
  }

  const remaining = Object.keys(eq)
    .filter((k) => !used.has(k))
    .filter((k) => !['latitude', 'longitude'].includes(k))
    .sort();

  for (const key of remaining) {
    const v = eq[key];
    if (v === null || v === undefined || v === '') continue;
    if (typeof v === 'object') continue;
    const formatted = formatScalar(key, v);
    if (!formatted) continue;
    addRow(key, labelForKey(key), formatted);
  }

  const detailUrl = eq.detail != null ? String(eq.detail) : '';
  const pageUrl = eq.url != null ? String(eq.url) : '';

  const links: string[] = [];
  if (pageUrl) {
    links.push(
      `<a href="${escapeHtml(pageUrl)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline">USGS event page</a>`
    );
  }
  if (detailUrl && detailUrl !== pageUrl) {
    links.push(
      `<a href="${escapeHtml(detailUrl)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline">GeoJSON detail</a>`
    );
  }
  const linksHtml =
    links.length > 0
      ? `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e5e7eb">${links.join(' · ')}</div>`
      : '';

  return `
    <div style="min-width:280px;max-width:520px;font-size:12px;color:#374151;line-height:1.45">
      <h3 style="margin:0 0 8px 0;color:#111827;font-weight:600;font-size:14px">
        ${icon} ${escapeHtml(headerText)}${tsunamiBadge}
      </h3>
      ${hasTsunami ? `<div style="color:#dc2626;font-weight:600;margin-bottom:6px">Tsunami information may apply — check official sources.</div>` : ''}
      <div style="color:#4b5563">${rows.join('')}</div>
      ${linksHtml}
    </div>
  `.trim();
}

/**
 * Normalize enrichment payloads (e.g. poi_earthquakes) so mag/time match what the popup formatter expects.
 */
export function normalizeEarthquakeForPopup(raw: Record<string, unknown>): Record<string, unknown> {
  const o = { ...raw };
  if (o.mag == null && typeof o.magnitude === 'number') {
    o.mag = o.magnitude;
  }
  if (o.time == null && typeof o.date === 'string' && o.date) {
    const t = Date.parse(o.date);
    if (!Number.isNaN(t)) o.time = t;
  }
  return o;
}
