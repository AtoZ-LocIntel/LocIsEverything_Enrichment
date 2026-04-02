/**
 * Esri JSON polygon geometry: flat `rings` array mixes multipart outers and holes.
 * Outer rings share one winding; holes use the opposite (ArcGIS REST convention).
 */

/** Signed area in map plane (lon/lat as x/y). Sign distinguishes outer vs hole winding. */
export function esriRingSignedArea(ring: number[][]): number {
  if (!ring || ring.length < 3) return 0;
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    s += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return s / 2;
}

function ringSign(ring: number[][]): number {
  return Math.sign(esriRingSignedArea(ring));
}

/**
 * Partition Esri `rings` into polygons: each entry is [outer, ...holes].
 * Holes have opposite winding to their part's outer ring. A new ring with the **same**
 * winding as the current part's outer starts a new multipart island.
 */
export function groupEsriRingsIntoPolygons(rings: number[][][]): number[][][][] {
  if (!rings?.length) return [];
  const parts: number[][][][] = [];
  let current: number[][][] = [rings[0]];

  for (let i = 1; i < rings.length; i++) {
    const r = rings[i];
    const s = ringSign(r);
    const outerSign = ringSign(current[0]);
    if (s !== 0 && outerSign !== 0 && s === outerSign) {
      parts.push(current);
      current = [r];
    } else {
      current.push(r);
    }
  }
  parts.push(current);
  return parts;
}

/** Ray-casting; ring vertices are [lon, lat]. */
export function pointInRing(lat: number, lon: number, ring: number[][]): boolean {
  if (!ring || ring.length < 3) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      (yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** True if (lat,lon) lies inside the Esri polygon (multipart + holes). */
export function pointInEsriPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings?.length) return false;
  const grouped = groupEsriRingsIntoPolygons(rings);
  for (const part of grouped) {
    const outer = part[0];
    if (!outer || outer.length < 3) continue;
    if (!pointInRing(lat, lon, outer)) continue;
    let inHole = false;
    for (let h = 1; h < part.length; h++) {
      const hole = part[h];
      if (hole && hole.length >= 3 && pointInRing(lat, lon, hole)) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

/**
 * Leaflet `L.polygon` argument: one polygon with holes is LatLng[][];
 * multipolygon is LatLng[][][].
 * Drops degenerate rings (fewer than 3 vertices).
 */
export function esriRingsToLeafletPolygonLatLngs(
  rings: number[][][]
): [number, number][][] | [number, number][][][] | null {
  const grouped = groupEsriRingsIntoPolygons(rings);
  const mapped: [number, number][][][] = [];
  for (const part of grouped) {
    const latlngRings = part
      .filter((ring) => ring.length >= 3)
      .map((ring) => ring.map(([lon, lat]) => [lat, lon] as [number, number]));
    if (latlngRings.length > 0) {
      mapped.push(latlngRings);
    }
  }
  if (mapped.length === 0) return null;
  if (mapped.length === 1) {
    return mapped[0] as [number, number][][];
  }
  return mapped as [number, number][][][];
}
