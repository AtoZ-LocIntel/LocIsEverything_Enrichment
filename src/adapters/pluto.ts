// NYC PLUTO adapter (ArcGIS FeatureService)
// Layer: https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer/0

import { GeocodeQuery, GeocodingAdapter, GeocodeResult } from "../lib/types";

// Rough NYC bbox for a quick relevance check
const NYC_BBOX: [number, number, number, number] = [40.4774, -74.2591, 40.9176, -73.7002]; // [S,W,N,E]

function bboxIntersects(a: [number, number, number, number], b: [number, number, number, number]) {
  const [s1, w1, n1, e1] = a;
  const [s2, w2, n2, e2] = b;
  return !(e1 < w2 || e2 < w1 || n1 < s2 || n2 < s1);
}

function centroidFromRing(ring: [number, number][]) {
  // Simple average (good enough for parcel display; ArcGIS returnCentroid preferred)
  let sx = 0, sy = 0;
  for (const [x, y] of ring) { sx += x; sy += y; }
  return { lon: sx / ring.length, lat: sy / ring.length };
}

export const PlutoAdapter: GeocodingAdapter = {
  name: "NYC PLUTO",
  rateLimit: { rps: 3 },

  // Skip when user explicitly restricts to a bbox outside NYC
  supports(q: GeocodeQuery) {
    if (!q.bbox) return true;
    return bboxIntersects(q.bbox, NYC_BBOX);
  },

  buildRequests(q: GeocodeQuery) {
    const base = new URL(
      "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer/0/query"
    );

    // Sanitize single quotes for SQL LIKE
    const text = (q.text || "").replace(/'/g, "''");

    // Optional: if a numeric BBL appears in the query, OR it in for higher precision
    const digits = (q.text || "").replace(/\D/g, "");
    const bblClause = digits.length >= 7 ? ` OR BBL=${digits}` : "";

    base.searchParams.set("f", "json");
    base.searchParams.set("outFields", "Address,Borough,Block,Lot,BBL,ZipCode");
    base.searchParams.set("where", `UPPER(Address) LIKE UPPER('%${text}%')${bblClause}`);
    base.searchParams.set("returnGeometry", "true");
    base.searchParams.set("returnCentroid", "true");     // ask server for polygon centroids
    base.searchParams.set("outSR", "4326");

    // Respect user bbox filter if present
    if (q.bbox) {
      const [s, w, n, e] = q.bbox;
      base.searchParams.set(
        "geometry",
        JSON.stringify({ xmin: w, ymin: s, xmax: e, ymax: n, spatialReference: { wkid: 4326 } })
      );
      base.searchParams.set("geometryType", "esriGeometryEnvelope");
      base.searchParams.set("inSR", "4326");
      base.searchParams.set("spatialRel", "esriSpatialRelIntersects");
    }

    return [base.toString()];
  },

  parseResponse(json: any, _q: GeocodeQuery): GeocodeResult[] {
    const feats = json?.features || [];
    const out: GeocodeResult[] = [];

    for (const f of feats) {
      let lon: number | undefined;
      let lat: number | undefined;

      // Prefer server-provided centroid
      if (f?.centroid && typeof f.centroid.x === "number" && typeof f.centroid.y === "number") {
        lon = f.centroid.x; lat = f.centroid.y;
      } else if (Array.isArray(f?.geometry?.rings) && f.geometry.rings[0]?.length) {
        const c = centroidFromRing(f.geometry.rings[0]);
        lon = c.lon; lat = c.lat;
      } else if (typeof f?.geometry?.x === "number" && typeof f?.geometry?.y === "number") {
        lon = f.geometry.x; lat = f.geometry.y;
      }

      if (typeof lat !== "number" || typeof lon !== "number") continue;

      const a = f.attributes || {};
      const label = [
        a.Address,
        a.Borough ? `Borough ${a.Borough}` : "",
        a.ZipCode || "",
        a.BBL ? `(BBL ${a.BBL})` : ""
      ].filter(Boolean).join(", ");

      // Boost confidence if BBL matched exactly
      const bblBoost = a.BBL && ("" + a.BBL).length >= 7 ? 0.07 : 0;

      out.push({
        source: "NYC PLUTO",
        lat,
        lon,
        name: label || "NYC parcel",
        confidence: 0.85 + bblBoost,
        raw: f
      });
    }

    return out;
  }
};
