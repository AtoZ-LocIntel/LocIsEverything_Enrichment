// src/lib/types.ts
export type BBox = [south: number, west: number, north: number, east: number];

export interface GeocodeQuery {
  text: string;
  countryCodes?: string; // "us,ca"
  bbox?: BBox;
  by?: 'lookup' | 'search' | 'auto';
}

export interface GeocodeResult {
  source: string;
  lat: number;
  lon: number;
  name: string;
  confidence: number; // 0..1
  raw?: any;
}

export interface RateLimit {
  rps: number;        // requests per second ceiling for this adapter
  burst?: number;     // optional burst size
}

export interface GeocodingAdapter {
  name: string;
  rateLimit?: RateLimit;
  supports?(q: GeocodeQuery): boolean; // optional hint to skip if irrelevant
  buildRequests(q: GeocodeQuery): RequestInfo[]; // one or many HTTP requests
  parseResponse(resp: any, q: GeocodeQuery): GeocodeResult[]; // normalize
}
