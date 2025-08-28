// src/adapters/postcodesio.ts
import { GeocodingAdapter, GeocodeResult } from "../lib/types";

export const PostcodesIOAdapter: GeocodingAdapter = {
  name: "Postcodes.io",
  rateLimit: { rps: 10 },
  supports(q) { return /\b[A-Z]{1,2}\d[A-Z0-9]?\s*\d[A-Z]{2}\b/i.test(q.text); }, // looks like a UK postcode
  buildRequests(q) {
    const clean = q.text.replace(/\s+/g, '');
    return [`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`];
  },
  parseResponse(json:any): GeocodeResult[] {
    const r = json?.result;
    if (!r) return [];
    return [{
      source: "Postcodes.io",
      lat: r.latitude, lon: r.longitude,
      name: r.postcode, confidence: 0.95, raw: r
    }];
  }
};
