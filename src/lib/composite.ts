// src/lib/composite.ts
import { GeocodeQuery, GeocodeResult, GeocodingAdapter } from "./types";

const sleep = (ms:number)=> new Promise(r=>setTimeout(r,ms));

export class CompositeGeocoder {
  constructor(
    private adapters: GeocodingAdapter[],
    private fetchImpl: typeof fetch = fetch,
    private perAdapterTimeoutMs = 4000
  ) {}

  async search(q: GeocodeQuery): Promise<GeocodeResult[]> {
    const active = this.adapters.filter(a => !a.supports || a.supports(q));
    const results: GeocodeResult[] = [];

    await Promise.all(active.map(async (adapter) => {
      const reqs = adapter.buildRequests(q);
      const rps = adapter.rateLimit?.rps ?? 10;
      const interval = 1000 / Math.max(1, rps);

      for (let i=0; i<reqs.length; i++) {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(()=>ctrl.abort(), this.perAdapterTimeoutMs);
          const res = await this.fetchImpl(reqs[i] as any, { signal: ctrl.signal } as any);
          clearTimeout(timer);
          if (res.ok) {
            const json = await res.json();
            results.push(...adapter.parseResponse(json, q));
          }
        } catch (e) {
          console.warn(`[${adapter.name}] request failed`, e);
        }
        if (i < reqs.length - 1) await sleep(interval);
      }
    }));

    return this.rankAndDedupe(results);
  }

  private rankAndDedupe(rs: GeocodeResult[]): GeocodeResult[] {
    // dedupe ~11m
    const uniq: GeocodeResult[] = [];
    for (const r of rs) {
      const hit = uniq.find(u => Math.abs(u.lat - r.lat) < 0.0001 && Math.abs(u.lon - r.lon) < 0.0001);
      if (!hit) uniq.push(r);
    }
    // sort by confidence
    uniq.sort((a,b)=> (b.confidence ?? 0) - (a.confidence ?? 0));
    return uniq;
  }
}
