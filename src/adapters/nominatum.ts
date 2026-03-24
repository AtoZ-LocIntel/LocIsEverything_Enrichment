// src/adapters/nominatim.ts
import { GeocodeQuery, GeocodingAdapter, GeocodeResult } from "../lib/types";
import { buildNominatimSearchUrl } from "../utils/nominatimUrl";

export const NominatimAdapter: GeocodingAdapter = {
  name: "OSM Nominatim",
  rateLimit: { rps: 1 },
  buildRequests(q: GeocodeQuery) {
    const params = new URLSearchParams();
    params.set("format", "json");
    params.set("addressdetails", "1");
    params.set("limit", "5");
    params.set("q", q.text);
    params.set("email", "noreply@locationmart.com");
    if (q.countryCodes) params.set("countrycodes", q.countryCodes.toLowerCase());
    if (q.bbox) {
      const [s, w, n, e] = q.bbox;
      params.set("viewbox", `${w},${n},${e},${s}`);
      params.set("bounded", "1");
    }
    return [buildNominatimSearchUrl(params)];
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
