/**
 * Shared AIS Stream snapshot logic (Vercel serverless + Vite dev middleware).
 */
import WebSocket from 'ws';

const AIS_STREAM_URL = 'wss://stream.aisstream.io/v0/stream';

function milesToLatDelta(miles: number): number {
  return miles / 69;
}

function milesToLonDelta(miles: number, latDeg: number): number {
  const cos = Math.cos((latDeg * Math.PI) / 180);
  const denom = 69 * Math.max(Math.abs(cos), 0.01);
  return miles / denom;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * AIS Stream subscription boxes: each corner [latitude, longitude] per docs.
 * When the search radius crosses the antimeridian (±180°), a single [minLon, maxLon] interval
 * cannot describe the region — use two boxes (no overlap duplication per AIS Stream docs).
 */
function buildBoundingBoxesForRadiusMiles(lat: number, lon: number, radiusMiles: number): number[][][] {
  const dLat = milesToLatDelta(radiusMiles);
  const dLon = milesToLonDelta(radiusMiles, lat);
  const minLat = Math.max(-90, lat - dLat);
  const maxLat = Math.min(90, lat + dLat);
  const minLon = lon - dLon;
  const maxLon = lon + dLon;

  if (minLon >= -180 && maxLon <= 180) {
    return [[[minLat, minLon], [maxLat, maxLon]]];
  }

  const boxes: number[][][] = [];

  if (maxLon > 180) {
    const overflow = maxLon - 180;
    boxes.push([[minLat, Math.max(-180, minLon)], [maxLat, 180]]);
    boxes.push([[minLat, -180], [maxLat, -180 + overflow]]);
  } else if (minLon < -180) {
    const under = -180 - minLon;
    boxes.push([[minLat, -180], [maxLat, Math.min(180, maxLon)]]);
    boxes.push([[minLat, 180 - under], [maxLat, 180]]);
  } else {
    boxes.push([[minLat, Math.max(-180, minLon)], [maxLat, Math.min(180, maxLon)]]);
  }

  return boxes;
}

export interface AISStreamFeature {
  mmsi: string;
  lat: number;
  lon: number;
  latitude: number;
  longitude: number;
  /** AIS Stream `MessageType` (e.g. PositionReport, ExtendedClassBPositionReport). */
  aisMessageType?: string;
  sog?: number;
  cog?: number;
  navigationalStatus?: number;
  trueHeading?: number;
  /** AIS rate of turn (e.g. PositionReport); Extended Class B may omit. */
  rateOfTurn?: number;
  timestamp?: number;
  shipName?: string;
  /** IMO-style ship and cargo type code (common on Extended Class B). */
  shipType?: number;
  /** Bow/stern/port/starboard offsets in meters (Extended Class B `Dimension`). */
  dimension?: { a: number; b: number; c: number; d: number };
  /** AIS metadata `time_utc` when present. */
  metaTimeUtc?: string;
  positionAccuracy?: boolean;
  raim?: boolean;
  messageId?: number;
  /** GNSS fix type (Extended Class B / some reports). */
  fixType?: number;
  dte?: boolean;
  assignedMode?: boolean;
  /** AIS special manoeuvre indicator (PositionReport). */
  specialManoeuvre?: number;
  /** Decoded position valid flag when AIS provides it. */
  reportValid?: boolean;
  /** From AIS message type 5 / `ShipStaticData` (merged when received). */
  hasShipStaticData?: boolean;
  callSign?: string;
  imoNumber?: number;
  destination?: string;
  maximumStaticDraught?: number;
  aisVersion?: number;
  etaMonth?: number;
  etaDay?: number;
  etaHour?: number;
  etaMinute?: number;
  shipStaticMessageId?: number;
  staticRepeatIndicator?: number;
  shipStaticValid?: boolean;
  staticSpare?: boolean;
  distance_miles?: number;
}

function normalizeNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function normalizeBool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  return undefined;
}

function extractPositionPayload(
  msg: Record<string, unknown> | undefined,
  messageType: string | undefined
): Record<string, unknown> | undefined {
  if (!msg) return undefined;
  const explicit =
    msg.PositionReport ||
    msg.StandardClassBPositionReport ||
    msg.ExtendedClassBPositionReport ||
    msg.positionreport ||
    msg.standardclassbpositionreport ||
    msg.extendedclassbpositionreport;
  if (explicit && typeof explicit === 'object') {
    return explicit as Record<string, unknown>;
  }
  if (messageType && typeof msg[messageType] === 'object' && msg[messageType]) {
    return msg[messageType] as Record<string, unknown>;
  }
  return undefined;
}

function parsePositionMessage(raw: Record<string, unknown>): AISStreamFeature | null {
  const msg = raw.Message as Record<string, unknown> | undefined;
  const mt = typeof raw.MessageType === 'string' ? raw.MessageType : undefined;
  const pr = extractPositionPayload(msg, mt);

  const meta = (raw.MetaData || raw.Metadata || {}) as Record<string, unknown>;

  let lat = pr ? normalizeNum(pr.Latitude ?? pr.latitude) : null;
  let lon = pr ? normalizeNum(pr.Longitude ?? pr.longitude) : null;
  if (lat == null || lon == null) {
    lat = normalizeNum(meta.Latitude ?? meta.latitude);
    lon = normalizeNum(meta.Longitude ?? meta.longitude);
  }
  if (lat == null || lon == null) {
    return null;
  }

  const userId = pr ? pr.UserID ?? pr.userId : undefined;
  const mmsi =
    meta.MMSI != null
      ? String(meta.MMSI)
      : userId != null
        ? String(userId)
        : '';

  const nameFromMessage =
    pr && typeof pr.Name === 'string' && pr.Name.trim() ? pr.Name.trim() : undefined;
  const shipName =
    (typeof meta.ShipName === 'string' && meta.ShipName.trim()) ||
    (typeof meta.shipName === 'string' && meta.shipName.trim()) ||
    nameFromMessage ||
    undefined;

  const sogN = pr ? normalizeNum(pr.Sog ?? pr.sog) : null;
  const cogN = pr ? normalizeNum(pr.Cog ?? pr.cog) : null;
  const navN = pr ? normalizeNum(pr.NavigationalStatus ?? pr.navigationalstatus) : null;
  const thN = pr ? normalizeNum(pr.TrueHeading ?? pr.trueheading) : null;
  const tsN = pr ? normalizeNum(pr.Timestamp ?? pr.timestamp) : null;
  const rotN = pr ? normalizeNum(pr.RateOfTurn ?? pr.rateofturn) : null;
  const typeN = pr ? normalizeNum(pr.Type ?? pr.type) : null;
  const msgIdN = pr ? normalizeNum(pr.MessageID ?? pr.messageId) : null;
  const fixTN = pr ? normalizeNum(pr.FixType ?? pr.fixtype) : null;
  const smN = pr ? normalizeNum(pr.SpecialManoeuvreIndicator ?? pr.specialmanoeuvreindicator) : null;

  const metaTimeUtc =
    typeof meta.time_utc === 'string' && meta.time_utc.trim()
      ? meta.time_utc.trim()
      : typeof meta.timeUtc === 'string' && meta.timeUtc.trim()
        ? meta.timeUtc.trim()
        : undefined;

  let dimension: AISStreamFeature['dimension'];
  if (pr && pr.Dimension && typeof pr.Dimension === 'object') {
    const d = pr.Dimension as Record<string, unknown>;
    const a = normalizeNum(d.A ?? d.a);
    const b = normalizeNum(d.B ?? d.b);
    const c = normalizeNum(d.C ?? d.c);
    const dd = normalizeNum(d.D ?? d.d);
    if (a != null && b != null && c != null && dd != null) {
      dimension = { a, b, c, d: dd };
    }
  }

  return {
    mmsi: mmsi || 'unknown',
    lat,
    lon,
    latitude: lat,
    longitude: lon,
    aisMessageType: mt,
    sog: sogN ?? undefined,
    cog: cogN ?? undefined,
    navigationalStatus: navN ?? undefined,
    trueHeading: thN ?? undefined,
    rateOfTurn: rotN ?? undefined,
    timestamp: tsN ?? undefined,
    shipName,
    shipType: typeN ?? undefined,
    dimension,
    metaTimeUtc,
    positionAccuracy: pr ? normalizeBool(pr.PositionAccuracy ?? pr.positionaccuracy) : undefined,
    raim: pr ? normalizeBool(pr.Raim ?? pr.raim) : undefined,
    messageId: msgIdN ?? undefined,
    fixType: fixTN ?? undefined,
    dte: pr ? normalizeBool(pr.Dte ?? pr.dte) : undefined,
    assignedMode: pr ? normalizeBool(pr.AssignedMode ?? pr.assignedmode) : undefined,
    specialManoeuvre: smN ?? undefined,
    reportValid: pr ? normalizeBool(pr.Valid ?? pr.valid) : undefined,
  };
}

function omitUndefined<T extends Record<string, unknown>>(patch: Partial<T>): Partial<T> {
  return Object.fromEntries(
    Object.entries(patch as Record<string, unknown>).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

/** Merge position + static; keep last position report type when combining with ShipStaticData. */
function mergeAISFeatures(base: AISStreamFeature, patch: Partial<AISStreamFeature>): AISStreamFeature {
  const p = omitUndefined(patch as Record<string, unknown>) as Partial<AISStreamFeature>;
  const out: AISStreamFeature = {
    ...base,
    ...p,
    lat: patch.lat ?? base.lat,
    lon: patch.lon ?? base.lon,
    latitude: patch.latitude ?? base.latitude,
    longitude: patch.longitude ?? base.longitude,
    mmsi: patch.mmsi || base.mmsi,
    shipName: patch.shipName || base.shipName,
    dimension: patch.dimension ?? base.dimension,
    shipType: patch.shipType ?? base.shipType,
    hasShipStaticData: !!(base.hasShipStaticData || patch.hasShipStaticData),
  };
  if (base.aisMessageType && patch.aisMessageType === 'ShipStaticData') {
    out.aisMessageType = base.aisMessageType;
  }
  return out;
}

/**
 * AIS Stream `MessageType` ShipStaticData — static vessel particulars (msg 5 style).
 * Lat/lon may come from metadata only (last known position).
 */
function parseShipStaticMessage(raw: Record<string, unknown>): Partial<AISStreamFeature> & { mmsi: string } | null {
  const mt = typeof raw.MessageType === 'string' ? raw.MessageType : undefined;
  if (mt !== 'ShipStaticData') return null;

  const msg = raw.Message as Record<string, unknown> | undefined;
  const ss = (msg?.ShipStaticData ?? msg?.shipstaticdata) as Record<string, unknown> | undefined;
  if (!ss || typeof ss !== 'object') return null;

  const meta = (raw.MetaData || raw.Metadata || {}) as Record<string, unknown>;
  const uid = ss.UserID ?? ss.userId;
  const mmsi =
    meta.MMSI != null
      ? String(meta.MMSI)
      : uid != null
        ? String(uid)
        : '';
  if (!mmsi) return null;

  let lat = normalizeNum(meta.Latitude ?? meta.latitude);
  let lon = normalizeNum(meta.Longitude ?? meta.longitude);

  const name = typeof ss.Name === 'string' && ss.Name.trim() ? ss.Name.trim() : undefined;
  const callSign =
    typeof ss.CallSign === 'string' && ss.CallSign.trim() ? ss.CallSign.trim() : undefined;
  const destination =
    typeof ss.Destination === 'string' ? String(ss.Destination).trim() : undefined;

  const imoN = normalizeNum(ss.ImoNumber ?? ss.imoNumber);
  const typeN = normalizeNum(ss.Type ?? ss.type);
  const draughtN = normalizeNum(ss.MaximumStaticDraught ?? ss.maximumstaticdraught);
  const aisVerN = normalizeNum(ss.AisVersion ?? ss.aisversion);
  const fixTN = normalizeNum(ss.FixType ?? ss.fixtype);
  const msgIdN = normalizeNum(ss.MessageID ?? ss.messageId);
  const repN = normalizeNum(ss.RepeatIndicator ?? ss.repeatindicator);

  let etaMonth: number | undefined;
  let etaDay: number | undefined;
  let etaHour: number | undefined;
  let etaMinute: number | undefined;
  if (ss.Eta && typeof ss.Eta === 'object') {
    const e = ss.Eta as Record<string, unknown>;
    etaMonth = normalizeNum(e.Month ?? e.month) ?? undefined;
    etaDay = normalizeNum(e.Day ?? e.day) ?? undefined;
    etaHour = normalizeNum(e.Hour ?? e.hour) ?? undefined;
    etaMinute = normalizeNum(e.Minute ?? e.minute) ?? undefined;
  }

  let dimension: AISStreamFeature['dimension'];
  if (ss.Dimension && typeof ss.Dimension === 'object') {
    const d = ss.Dimension as Record<string, unknown>;
    const a = normalizeNum(d.A ?? d.a);
    const b = normalizeNum(d.B ?? d.b);
    const c = normalizeNum(d.C ?? d.c);
    const dd = normalizeNum(d.D ?? d.d);
    if (a != null && b != null && c != null && dd != null) {
      dimension = { a, b, c, d: dd };
    }
  }

  const patch: Partial<AISStreamFeature> & { mmsi: string } = {
    mmsi,
    aisMessageType: 'ShipStaticData',
    hasShipStaticData: true,
    shipName: name,
    shipType: typeN ?? undefined,
    dimension,
    callSign,
    imoNumber: imoN ?? undefined,
    destination: destination || undefined,
    maximumStaticDraught: draughtN ?? undefined,
    aisVersion: aisVerN ?? undefined,
    fixType: fixTN ?? undefined,
    dte: normalizeBool(ss.Dte ?? ss.dte),
    shipStaticMessageId: msgIdN ?? undefined,
    staticRepeatIndicator: repN ?? undefined,
    shipStaticValid: normalizeBool(ss.Valid ?? ss.valid),
    staticSpare: normalizeBool(ss.Spare ?? ss.spare),
    etaMonth,
    etaDay,
    etaHour,
    etaMinute,
  };

  if (lat != null && lon != null) {
    patch.lat = lat;
    patch.lon = lon;
    patch.latitude = lat;
    patch.longitude = lon;
  }

  return patch;
}

function mergeStaticPending(
  prev: Partial<AISStreamFeature> | undefined,
  next: Partial<AISStreamFeature> & { mmsi: string }
): Partial<AISStreamFeature> & { mmsi: string } {
  return { ...prev, ...next, mmsi: next.mmsi, hasShipStaticData: true };
}

function staticPatchToFeature(patch: Partial<AISStreamFeature> & { mmsi: string }): AISStreamFeature | null {
  if (patch.lat == null || patch.lon == null) return null;
  return {
    mmsi: patch.mmsi,
    lat: patch.lat,
    lon: patch.lon,
    latitude: patch.latitude ?? patch.lat,
    longitude: patch.longitude ?? patch.lon,
    aisMessageType: patch.aisMessageType,
    shipName: patch.shipName,
    shipType: patch.shipType,
    dimension: patch.dimension,
    callSign: patch.callSign,
    imoNumber: patch.imoNumber,
    destination: patch.destination,
    maximumStaticDraught: patch.maximumStaticDraught,
    aisVersion: patch.aisVersion,
    fixType: patch.fixType,
    dte: patch.dte,
    hasShipStaticData: patch.hasShipStaticData,
    shipStaticMessageId: patch.shipStaticMessageId,
    staticRepeatIndicator: patch.staticRepeatIndicator,
    shipStaticValid: patch.shipStaticValid,
    staticSpare: patch.staticSpare,
    etaMonth: patch.etaMonth,
    etaDay: patch.etaDay,
    etaHour: patch.etaHour,
    etaMinute: patch.etaMinute,
  };
}

interface CollectSnapshotStats {
  rawMessageCount: number;
  parsedPositionCount: number;
}

function collectSnapshot(
  apiKey: string,
  boundingBoxes: number[][][],
  collectMs: number,
  maxMessages: number
): Promise<{ features: AISStreamFeature[]; stats: CollectSnapshotStats }> {
  return new Promise((resolve, reject) => {
    const byMmsi = new Map<string, AISStreamFeature>();
    /** Static-only messages without metadata lat/lon — applied when a position report arrives. */
    const pendingStaticByMmsi = new Map<string, Partial<AISStreamFeature>>();
    let finished = false;
    let messageCount = 0;
    let rawMessageCount = 0;
    let parsedPositionCount = 0;

    const ws = new WebSocket(AIS_STREAM_URL);

    const done = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      resolve({
        features: [...byMmsi.values()],
        stats: { rawMessageCount, parsedPositionCount },
      });
    };

    const timer = setTimeout(done, collectMs);

    ws.on('open', () => {
      const subscription = {
        APIKey: apiKey,
        BoundingBoxes: boundingBoxes,
        FilterMessageTypes: [
          'PositionReport',
          'StandardClassBPositionReport',
          'ExtendedClassBPositionReport',
          'ShipStaticData',
        ],
      };
      ws.send(JSON.stringify(subscription));
    });

    ws.on('message', (data: WebSocket.RawData) => {
      if (finished) return;
      try {
        rawMessageCount++;
        const raw = JSON.parse(String(data)) as Record<string, unknown>;

        const staticPatch = parseShipStaticMessage(raw);
        if (staticPatch && staticPatch.mmsi && staticPatch.mmsi !== 'unknown') {
          const existing = byMmsi.get(staticPatch.mmsi);
          if (existing) {
            byMmsi.set(staticPatch.mmsi, mergeAISFeatures(existing, staticPatch));
            parsedPositionCount++;
          } else {
            const staticOnly = staticPatchToFeature(staticPatch);
            if (staticOnly) {
              const pend = pendingStaticByMmsi.get(staticPatch.mmsi);
              const merged =
                pend != null ? mergeAISFeatures(staticOnly, pend) : staticOnly;
              byMmsi.set(staticPatch.mmsi, merged);
              pendingStaticByMmsi.delete(staticPatch.mmsi);
              parsedPositionCount++;
            } else {
              const prev = pendingStaticByMmsi.get(staticPatch.mmsi);
              pendingStaticByMmsi.set(staticPatch.mmsi, mergeStaticPending(prev, staticPatch));
              parsedPositionCount++;
            }
          }
        }

        const feature = parsePositionMessage(raw);
        if (feature) {
          parsedPositionCount++;
          if (feature.mmsi !== 'unknown') {
            const pend = pendingStaticByMmsi.get(feature.mmsi);
            let f = feature;
            if (pend) {
              f = mergeAISFeatures(feature, pend);
              pendingStaticByMmsi.delete(feature.mmsi);
            }
            const prev = byMmsi.get(feature.mmsi);
            if (prev) {
              byMmsi.set(feature.mmsi, mergeAISFeatures(prev, f));
            } else {
              byMmsi.set(feature.mmsi, f);
            }
          } else {
            const key = `${feature.lat.toFixed(5)},${feature.lon.toFixed(5)}`;
            const prev = byMmsi.get(key);
            if (prev) {
              byMmsi.set(key, mergeAISFeatures(prev, feature));
            } else {
              byMmsi.set(key, feature);
            }
          }
        }
        messageCount++;
        if (messageCount >= maxMessages) {
          done();
        }
      } catch {
        /* ignore malformed */
      }
    });

    ws.on('error', (err: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      if (byMmsi.size > 0) {
        resolve({
          features: [...byMmsi.values()],
          stats: { rawMessageCount, parsedPositionCount },
        });
      } else {
        reject(err);
      }
    });

    ws.on('close', () => {
      if (!finished) {
        done();
      }
    });
  });
}

function pickQuery(
  query: Record<string, string | string[] | undefined>,
  key: string
): string {
  const v = query[key];
  if (v == null) return '';
  return Array.isArray(v) ? String(v[0]) : String(v);
}

/**
 * Core snapshot handler: same JSON as Vercel `/api/ais-snapshot`.
 */
export async function runAISStreamSnapshotQuery(
  query: Record<string, string | string[] | undefined>
): Promise<{ status: number; body: Record<string, unknown> }> {
  const apiKey = process.env.AISSTREAM_API_KEY || process.env.AIS_STREAM_API_KEY;
  if (!apiKey) {
    return {
      status: 503,
      body: {
        error: 'AIS Stream is not configured',
        hint: 'Set AISSTREAM_API_KEY in .env (local) or deployment env (aisstream.io).',
      },
    };
  }

  const lat = parseFloat(pickQuery(query, 'lat'));
  const lon = parseFloat(pickQuery(query, 'lon'));
  const radiusMiles = Math.min(
    500,
    Math.max(1, parseFloat(pickQuery(query, 'radiusMiles')) || 50)
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      status: 400,
      body: { error: 'Query parameters lat and lon are required (decimal degrees).' },
    };
  }

  const dLat = milesToLatDelta(radiusMiles);
  const dLon = milesToLonDelta(radiusMiles, lat);
  const minLat = Math.max(-90, lat - dLat);
  const maxLat = Math.min(90, lat + dLat);
  const rawMinLon = lon - dLon;
  const rawMaxLon = lon + dLon;

  /** Official docs: each corner is [latitude, longitude] (see aisstream.io documentation). */
  const boundingBoxes = buildBoundingBoxesForRadiusMiles(lat, lon, radiusMiles);

  const collectMs = Math.min(
    15000,
    Math.max(4000, parseInt(pickQuery(query, 'collectMs') || '12000', 10) || 12000)
  );

  const wantDebug = pickQuery(query, 'debug') === '1';

  /** Keep WebSocket work bounded; large message counts risk memory/time on serverless. */
  const maxWsMessages = 1200;
  /** Vercel response body limit (~4.5MB hobby); cap ships returned to stay well under. */
  const maxFeaturesReturned = 750;

  try {
    const { features, stats } = await collectSnapshot(apiKey, boundingBoxes, collectMs, maxWsMessages);
    const filtered = features
      .map((f) => {
        const d = haversineMiles(lat, lon, f.lat, f.lon);
        return { ...f, distance_miles: d };
      })
      .filter((f) => f.distance_miles! <= radiusMiles + 0.5)
      .sort((a, b) => (a.distance_miles ?? 0) - (b.distance_miles ?? 0));

    const capped = filtered.slice(0, maxFeaturesReturned);

    const body: Record<string, unknown> = {
      collectedAt: new Date().toISOString(),
      bbox: {
        minLat,
        maxLat,
        minLon: rawMinLon,
        maxLon: rawMaxLon,
        crossesAntimeridian: rawMinLon < -180 || rawMaxLon > 180,
        subscriptionBoxCount: boundingBoxes.length,
      },
      count: capped.length,
      features: capped,
    };
    if (filtered.length > capped.length) {
      body.truncated = true;
      body.totalMatched = filtered.length;
    }

    if (wantDebug) {
      body.debug = {
        boundingBoxes,
        collectMs,
        radiusMiles,
        center: { lat, lon },
        rawWsMessages: stats.rawMessageCount,
        parsedPositions: stats.parsedPositionCount,
        featuresBeforeRadiusFilter: features.length,
        note:
          'AIS Stream is global; each request subscribes to region(s) around lat/lon and radiusMiles, then filters by great-circle distance. Results are ships near your search point, not worldwide.',
        hint:
          stats.rawMessageCount === 0
            ? 'No WebSocket messages — check API key, network, or try a busy port/coastal bbox.'
            : stats.parsedPositionCount === 0
              ? 'Messages received but none parsed as positions — message shape may have changed.'
              : features.length === 0 && filtered.length === 0
                ? 'Positions parsed but none within radius (try larger radius or coastal area).'
                : undefined,
      };
    }

    return {
      status: 200,
      body,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('aisstream snapshot:', msg);
    return {
      status: 502,
      body: {
        error: 'Failed to connect to AIS Stream',
        details: msg,
      },
    };
  }
}
