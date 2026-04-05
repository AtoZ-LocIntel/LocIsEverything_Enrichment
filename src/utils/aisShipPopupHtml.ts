/**
 * Shared HTML for AIS live vessel Leaflet popups (enrichment layer + map toggle).
 * Labels follow common AIS/ITU usage; codes are from decoded AIS Stream payloads.
 */

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** ITU-R M.1371-style navigational status (0–15). */
export function aisNavStatusLabel(code: number): string {
  const m: Record<number, string> = {
    0: 'Under way using engine',
    1: 'At anchor',
    2: 'Not under command',
    3: 'Restricted manoeuvrability',
    4: 'Constrained by draught',
    5: 'Moored',
    6: 'Aground',
    7: 'Engaged in fishing',
    8: 'Under way sailing',
    9: 'Reserved (HSC)',
    10: 'Reserved (WIG)',
    11: 'Power-driven vessel towing',
    12: 'Reserved',
    13: 'Reserved',
    14: 'AIS-SART / MOB / EPIRB',
    15: 'Not defined',
  };
  return m[code] ?? 'Unknown code';
}

/** AIS ship and cargo type (IMO-style); coarse buckets for display. */
export function aisShipTypeLabel(code: number): string {
  if (!Number.isFinite(code)) return '—';
  if (code === 0) return 'Not available / unknown';
  if (code >= 1 && code <= 19) return 'Reserved';
  if (code >= 20 && code <= 29) return 'WIG';
  if (code === 30) return 'Fishing';
  if (code === 31 || code === 32) return 'Towing';
  if (code === 33) return 'Dredging / underwater ops';
  if (code === 34) return 'Diving ops';
  if (code === 35) return 'Military ops';
  if (code === 36) return 'Sailing';
  if (code === 37) return 'Pleasure craft';
  if (code >= 40 && code <= 49) return 'High speed craft';
  if (code >= 50 && code <= 59) return 'Special vessel';
  if (code >= 60 && code <= 69) return 'Passenger';
  if (code >= 70 && code <= 79) return 'Cargo';
  if (code >= 80 && code <= 89) return 'Tanker';
  if (code >= 90 && code <= 99) return 'Other';
  return 'Code out of range';
}

function aisFixTypeLabel(code: number): string {
  const m: Record<number, string> = {
    0: 'Default / unknown',
    1: 'GPS',
    2: 'GLONASS',
    3: 'GPS+GLONASS',
    4: 'Loran-C',
    5: 'Chayka',
    6: 'integrated',
    7: 'surveyed',
    8: 'Galileo',
    15: 'Internal GNSS',
  };
  return m[code] ?? `Type ${code}`;
}

export interface AisShipPopupOptions {
  shipIcon?: string;
}

/**
 * Build popup HTML from enrichment / snapshot vessel objects (any subset of fields).
 */
export function buildAisShipPopupHtml(vessel: Record<string, unknown>, options?: AisShipPopupOptions): string {
  const shipIcon = options?.shipIcon ?? '🚢';
  const vlat = vessel.lat ?? vessel.latitude;
  const vlon = vessel.lon ?? vessel.longitude;
  const mmsi = vessel.mmsi != null ? String(vessel.mmsi) : '—';
  const nameRaw =
    typeof vessel.shipName === 'string' && vessel.shipName.trim() ? vessel.shipName.trim() : `MMSI ${mmsi}`;
  const name = esc(nameRaw);

  const cog = typeof vessel.cog === 'number' && Number.isFinite(vessel.cog) ? vessel.cog : null;
  const sog = typeof vessel.sog === 'number' && Number.isFinite(vessel.sog) ? vessel.sog : null;
  const th =
    typeof vessel.trueHeading === 'number' && vessel.trueHeading >= 0 && vessel.trueHeading <= 359
      ? vessel.trueHeading
      : null;

  const parts: string[] = [];

  parts.push(`<div><strong>MMSI:</strong> ${esc(mmsi)}</div>`);

  if (typeof vlat === 'number' && typeof vlon === 'number' && Number.isFinite(vlat) && Number.isFinite(vlon)) {
    parts.push(`<div><strong>Position:</strong> ${vlat.toFixed(5)}°, ${vlon.toFixed(5)}°</div>`);
  }

  if (typeof vessel.distance_miles === 'number' && Number.isFinite(vessel.distance_miles)) {
    parts.push(`<div><strong>Distance:</strong> ${vessel.distance_miles.toFixed(1)} mi</div>`);
  }

  if (typeof vessel.aisMessageType === 'string' && vessel.aisMessageType.trim()) {
    parts.push(`<div><strong>AIS message:</strong> ${esc(vessel.aisMessageType.trim())}</div>`);
  }

  if (typeof vessel.messageId === 'number' && Number.isFinite(vessel.messageId)) {
    parts.push(`<div><strong>AIS message ID:</strong> ${vessel.messageId}</div>`);
  }

  if (typeof vessel.metaTimeUtc === 'string' && vessel.metaTimeUtc.trim()) {
    parts.push(`<div><strong>UTC (metadata):</strong> ${esc(vessel.metaTimeUtc.trim())}</div>`);
  }

  if (sog !== null) parts.push(`<div><strong>SOG:</strong> ${sog.toFixed(1)} kn</div>`);
  if (cog !== null) parts.push(`<div><strong>COG:</strong> ${cog.toFixed(0)}°</div>`);
  if (th !== null) parts.push(`<div><strong>True heading:</strong> ${th.toFixed(0)}°</div>`);

  if (typeof vessel.rateOfTurn === 'number' && Number.isFinite(vessel.rateOfTurn)) {
    parts.push(`<div><strong>Rate of turn:</strong> ${vessel.rateOfTurn} <span style="opacity:.85">(AIS raw)</span></div>`);
  }

  if (typeof vessel.navigationalStatus === 'number' && Number.isFinite(vessel.navigationalStatus)) {
    const n = Math.trunc(vessel.navigationalStatus);
    const label = n >= 0 && n <= 15 ? aisNavStatusLabel(n) : 'Unknown';
    parts.push(`<div><strong>Nav status:</strong> ${n} — ${esc(label)}</div>`);
  }

  if (typeof vessel.specialManoeuvre === 'number' && Number.isFinite(vessel.specialManoeuvre)) {
    const sm = vessel.specialManoeuvre;
    const smTxt = sm === 0 ? 'Not engaged' : sm === 1 ? 'Engaged' : String(sm);
    parts.push(`<div><strong>Special manoeuvre:</strong> ${esc(smTxt)}</div>`);
  }

  if (typeof vessel.shipType === 'number' && Number.isFinite(vessel.shipType)) {
    const st = Math.trunc(vessel.shipType);
    parts.push(
      `<div><strong>Ship type:</strong> ${st} — ${esc(aisShipTypeLabel(st))}</div>`
    );
  }

  const dim = vessel.dimension as { a?: number; b?: number; c?: number; d?: number } | undefined;
  if (
    dim &&
    typeof dim.a === 'number' &&
    typeof dim.b === 'number' &&
    typeof dim.c === 'number' &&
    typeof dim.d === 'number'
  ) {
    const loa = dim.a + dim.b;
    const beam = dim.c + dim.d;
    parts.push(
      `<div><strong>Dimensions (m):</strong> bow ${dim.a} · stern ${dim.b} · port ${dim.c} · starboard ${dim.d}</div>`
    );
    parts.push(
      `<div><strong>LOA × beam (approx.):</strong> ${loa.toFixed(0)} × ${beam.toFixed(0)} m</div>`
    );
  }

  if (vessel.positionAccuracy !== undefined) {
    parts.push(`<div><strong>Position accuracy (AIS):</strong> ${vessel.positionAccuracy ? 'high (≤10 m)' : 'low (>10 m)'}</div>`);
  }
  if (vessel.raim !== undefined) {
    parts.push(`<div><strong>RAIM:</strong> ${vessel.raim ? 'in use' : 'not in use'}</div>`);
  }
  if (vessel.reportValid !== undefined) {
    parts.push(`<div><strong>Decoded valid:</strong> ${vessel.reportValid ? 'yes' : 'no'}</div>`);
  }

  if (typeof vessel.fixType === 'number' && Number.isFinite(vessel.fixType)) {
    const ft = Math.trunc(vessel.fixType);
    parts.push(`<div><strong>Fix type:</strong> ${ft} — ${esc(aisFixTypeLabel(ft))}</div>`);
  }
  if (vessel.dte !== undefined) {
    parts.push(`<div><strong>DTE:</strong> ${vessel.dte ? 'available' : 'not available'}</div>`);
  }
  if (vessel.assignedMode !== undefined) {
    parts.push(`<div><strong>Assigned mode:</strong> ${vessel.assignedMode ? 'yes' : 'no'}</div>`);
  }

  if (typeof vessel.timestamp === 'number' && Number.isFinite(vessel.timestamp)) {
    parts.push(`<div><strong>AIS timestamp (sec):</strong> ${vessel.timestamp} <span style="opacity:.85">(in minute)</span></div>`);
  }

  const hasStatic =
    vessel.hasShipStaticData === true ||
    typeof vessel.callSign === 'string' ||
    typeof vessel.imoNumber === 'number' ||
    typeof vessel.destination === 'string' ||
    typeof vessel.maximumStaticDraught === 'number' ||
    typeof vessel.shipStaticMessageId === 'number';
  if (hasStatic) {
    parts.push(
      `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;font-weight:600;color:#374151;">Static (AIS msg 5 / ShipStaticData)</div>`
    );
    if (typeof vessel.callSign === 'string' && vessel.callSign.trim()) {
      parts.push(`<div><strong>Call sign:</strong> ${esc(vessel.callSign.trim())}</div>`);
    }
    if (typeof vessel.imoNumber === 'number' && Number.isFinite(vessel.imoNumber) && vessel.imoNumber > 0) {
      parts.push(`<div><strong>IMO number:</strong> ${vessel.imoNumber}</div>`);
    }
    if (typeof vessel.destination === 'string' && vessel.destination.trim()) {
      parts.push(`<div><strong>Destination:</strong> ${esc(vessel.destination.trim())}</div>`);
    }
    if (typeof vessel.maximumStaticDraught === 'number' && Number.isFinite(vessel.maximumStaticDraught)) {
      parts.push(`<div><strong>Max draught:</strong> ${vessel.maximumStaticDraught.toFixed(1)} m</div>`);
    }
    if (typeof vessel.aisVersion === 'number' && Number.isFinite(vessel.aisVersion)) {
      parts.push(`<div><strong>AIS version:</strong> ${vessel.aisVersion}</div>`);
    }
    const em = vessel.etaMonth;
    const ed = vessel.etaDay;
    const eh = vessel.etaHour;
    const emin = vessel.etaMinute;
    if ([em, ed, eh, emin].some((x) => typeof x === 'number' && Number.isFinite(x))) {
      const minStr =
        typeof emin === 'number' && Number.isFinite(emin) ? String(emin).padStart(2, '0') : '—';
      const etaStr = `M${em ?? '—'}/${ed ?? '—'} ${eh ?? '—'}:${minStr}`;
      parts.push(`<div><strong>ETA (decoded):</strong> ${esc(etaStr)} <span style="opacity:.85">(AIS month/day/hour/min)</span></div>`);
    }
    if (typeof vessel.shipStaticMessageId === 'number') {
      parts.push(`<div><strong>Static message ID:</strong> ${vessel.shipStaticMessageId}</div>`);
    }
    if (typeof vessel.staticRepeatIndicator === 'number') {
      parts.push(`<div><strong>Repeat indicator:</strong> ${vessel.staticRepeatIndicator}</div>`);
    }
    if (vessel.shipStaticValid !== undefined) {
      parts.push(`<div><strong>Static decode valid:</strong> ${vessel.shipStaticValid ? 'yes' : 'no'}</div>`);
    }
    if (vessel.staticSpare !== undefined) {
      parts.push(`<div><strong>Spare:</strong> ${vessel.staticSpare ? 'yes' : 'no'}</div>`);
    }
  }

  return `
              <div style="min-width: 240px; max-width: 400px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                  ${shipIcon} ${name}
                </h3>
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; line-height: 1.45;">
                  ${parts.join('')}
                </div>
              </div>
            `;
}
