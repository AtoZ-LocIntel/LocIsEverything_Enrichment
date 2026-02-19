// src/adapters/nominatim.ts
import { GeocodeQuery, GeocodingAdapter, GeocodeResult } from "../lib/types";

export const NominatimAdapter: GeocodingAdapter = {
  name: "OSM Nominatim",
  rateLimit: { rps: 1 },
  buildRequests(q: GeocodeQuery) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    url.searchParams.set("q", q.text);
    // Email is required by Nominatim usage policy for identification
    url.searchParams.set("email", "noreply@locationmart.com");
    if (q.countryCodes) url.searchParams.set("countrycodes", q.countryCodes.toLowerCase());
    if (q.bbox) {
      const [s,w,n,e] = q.bbox;
      url.searchParams.set("viewbox", `${w},${n},${e},${s}`);
      url.searchParams.set("bounded", "1");
    }
    return [url.toString()];
  },
  parseResponse(json: any, q: GeocodeQuery): GeocodeResult[] {
    if (!json || !Array.isArray(json)) {
      return [];
    }
    return json.map((it: any) => ({
      source: "OSM Nominatim",
      lat: parseFloat(it.lat),
      lon: parseFloat(it.lon),
      name: it.display_name || q.text,
      confidence: it.importance ?? 0.5,
      raw: it
    }));
  }
};
