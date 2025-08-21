// src/adapters/geonames.ts
import { GeocodeQuery, GeocodingAdapter, GeocodeResult } from "../lib/types";

const GEONAMES_USER = "demo"; // or inject via env

export const GeoNamesAdapter: GeocodingAdapter = {
  name: "GeoNames",
  rateLimit: { rps: 5 },
  buildRequests(q: GeocodeQuery) {
    const u = new URL("https://secure.geonames.org/searchJSON");
    u.searchParams.set("q", q.text);
    u.searchParams.set("maxRows", "5");
    u.searchParams.set("username", GEONAMES_USER);
    if (q.countryCodes) {
      const first = q.countryCodes.split(",")[0]?.toUpperCase();
      if (first) u.searchParams.set("countryBias", first);
      if (!q.countryCodes.includes(",")) u.searchParams.set("country", first);
    }
    if (q.bbox) {
      const [s,w,n,e] = q.bbox;
      u.searchParams.set("north", String(n));
      u.searchParams.set("south", String(s));
      u.searchParams.set("east",  String(e));
      u.searchParams.set("west",  String(w));
    }
    return [u.toString()];
  },
  parseResponse(json: any): GeocodeResult[] {
    return (json?.geonames || []).map((g:any)=>({
      source: "GeoNames",
      lat: parseFloat(g.lat), lon: parseFloat(g.lng),
      name: [g.name, g.adminName1, g.countryName].filter(Boolean).join(", "),
      confidence: 0.6, raw: g
    }));
  }
};
