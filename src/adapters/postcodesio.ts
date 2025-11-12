// src/adapters/postcodesio.ts
import { GeocodingAdapter, GeocodeResult } from "../lib/types";

export const PostcodesIOAdapter: GeocodingAdapter = {
  name: "Postcodes.io",
  rateLimit: { rps: 10 },
  supports(q) {
    return /\b[A-Z]{1,2}\d[A-Z0-9]?\s*\d[A-Z]{2}\b/i.test(q.text);
  },
  buildRequests(q) {
    const method = q.by ?? 'lookup';
    const requests: string[] = [];

    const addLookup = (value: string) => {
      const clean = value.replace(/\s+/g, '');
      requests.push(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
    };

    if (method === 'lookup' || method === 'auto') {
      addLookup(q.text);
    }

    if ((method === 'search' || method === 'auto') && q.text.trim().length > 3) {
      requests.push(
        `https://api.postcodes.io/postcodes?q=${encodeURIComponent(q.text)}&limit=1`
      );
    }

    // If only search was requested and the query is too short, fall back to lookup
    if (requests.length === 0) {
      addLookup(q.text);
    }

    return requests;
  },
  parseResponse(json: any): GeocodeResult[] {
    if (json?.status !== 200 || !json?.result) {
      return [];
    }

    const results = Array.isArray(json.result) ? json.result : [json.result];

    return results
      .filter((r: any) => r?.latitude && r?.longitude)
      .map((r: any) => ({
        source: "Postcodes.io",
        lat: r.latitude,
        lon: r.longitude,
        name: r.postcode || r.outcode || r.admin_ward || 'UK Postcode',
        confidence: r.postcode ? 0.95 : 0.8,
        raw: r
      }));
  }
};
