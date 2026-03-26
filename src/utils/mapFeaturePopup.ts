/**
 * Map feature popups aligned with CSV export rows: search location + full attribute list.
 */

export function escapeHtml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface PopupSearchContext {
  searchedAddress: string;
  searchedLat: number;
  searchedLon: number;
  confidence?: string | number | null;
}

/** Merge ArcGIS-style nested `attributes` / GeoJSON `properties` with top-level fields (top-level wins). */
export function mergeRecordForPopup(record: Record<string, any>): Record<string, any> {
  const fromAttrs =
    record.attributes &&
    typeof record.attributes === 'object' &&
    !Array.isArray(record.attributes)
      ? { ...record.attributes }
      : {};
  const fromProps =
    record.properties &&
    typeof record.properties === 'object' &&
    !Array.isArray(record.properties)
      ? { ...record.properties }
      : {};
  const merged = { ...fromProps, ...fromAttrs, ...record };
  if ('attributes' in merged) delete merged.attributes;
  if ('properties' in merged) delete merged.properties;
  return merged;
}

/** Order keys: `priorityKeys` first (when present), then remaining alphabetically. */
export function orderPopupKeys(allKeys: string[], priorityKeys?: string[]): string[] {
  if (!priorityKeys?.length) {
    return [...allKeys].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }
  const set = new Set(allKeys);
  const ordered: string[] = [];
  const used = new Set<string>();
  for (const k of priorityKeys) {
    if (set.has(k) && !used.has(k)) {
      ordered.push(k);
      used.add(k);
    }
  }
  const rest = allKeys.filter((k) => !used.has(k));
  rest.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  return [...ordered, ...rest];
}

function formatAttrValue(value: unknown, key: string, esc: typeof escapeHtml): string {
  if (value === null) return '—';
  if (value === undefined) return '—';
  if (value === '') return '(empty)';
  if (typeof value === 'object') return esc(JSON.stringify(value));
  if (key === 'distance_miles' && typeof value === 'number') {
    return `${esc(value.toFixed(2))} mi`;
  }
  if (typeof value === 'number') return esc(value.toLocaleString());
  return esc(String(value));
}

export interface FullFeaturePopupOptions {
  /** Plain text only; escaped internally */
  titlePlain: string;
  emoji?: string;
  subtitle?: string;
  /** Same as CSV `POI_Type` where applicable */
  poiTypeLabel?: string;
  searchContext: PopupSearchContext;
  record: Record<string, any>;
  /** Suppress huge or redundant blobs (geometry still available in data / CSV JSON) */
  hideKeys?: Set<string>;
  /** Show these keys first (e.g. NHDES FILE_NUMBER, TYPE_CODE), then the rest A–Z */
  priorityKeys?: string[];
  maxWidth?: number;
  scrollMaxHeight?: number;
}

/**
 * Popup HTML: search context block (matches CSV Address / Lat / Lon / Confidence / POI_Type)
 * plus scrollable list of all merged record keys, sorted, including empty values.
 */
export function buildFullFeaturePopupHtml(o: FullFeaturePopupOptions): string {
  const esc = escapeHtml;
  const hide = new Set<string>(['geometry', '__geometry', ...(o.hideKeys ? o.hideKeys : [])]);
  const merged = mergeRecordForPopup(o.record);
  const keys = orderPopupKeys(
    Object.keys(merged).filter((k) => !hide.has(k)),
    o.priorityKeys
  );

  const conf =
    o.searchContext.confidence != null && o.searchContext.confidence !== ''
      ? String(o.searchContext.confidence)
      : '—';

  let rowsHtml = '';
  for (const key of keys) {
    const value = merged[key];
    const displayKey = esc(key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    const displayVal = formatAttrValue(value, key, esc);
    rowsHtml += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayVal}</div>`;
  }

  const titleLine = `${o.emoji ? `${o.emoji} ` : ''}${esc(o.titlePlain)}`;
  const sub =
    o.subtitle != null && o.subtitle !== ''
      ? `<p style="margin: 0 0 8px 0; font-size: 11px; color: #9ca3af;">${esc(o.subtitle)}</p>`
      : '';

  const maxW = o.maxWidth ?? 440;
  const scrollH = o.scrollMaxHeight ?? 360;

  return `
    <div style="min-width: 280px; max-width: ${maxW}px;">
      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
        ${titleLine}
      </h3>
      ${sub}
      <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
        <div><strong>Searched address:</strong> ${esc(o.searchContext.searchedAddress)}</div>
        <div><strong>Search latitude:</strong> ${esc(String(o.searchContext.searchedLat))}</div>
        <div><strong>Search longitude:</strong> ${esc(String(o.searchContext.searchedLon))}</div>
        <div><strong>Confidence:</strong> ${esc(conf)}</div>
        ${o.poiTypeLabel ? `<div><strong>Row type:</strong> ${esc(o.poiTypeLabel)}</div>` : ''}
      </div>
      <div style="font-size: 12px; color: #374151; max-height: ${scrollH}px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
        ${rowsHtml}
      </div>
    </div>
  `;
}
