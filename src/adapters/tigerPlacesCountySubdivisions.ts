/**
 * TIGER Places and County Subdivisions Adapter
 * Queries US Census TIGER Places and County Subdivisions MapServer
 * Supports point-in-polygon and proximity queries up to 100 miles
 * API: https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer';

export interface TIGERPlacesCountySubdivisionsInfo {
  objectId: number;
  name?: string | null;
  stateFips?: string | null;
  countyFips?: string | null;
  placeType?: string | null; // Estates, County Subdivisions, Subbarrios, Consolidated Cities, Incorporated Places, Census Designated Places
  geometry: any; // ESRI polygon geometry for drawing on map
  distance_miles?: number;
  attributes: Record<string, any>;
  isContaining?: boolean;
}

/**
 * Calculate distance from a point to the nearest point on a polygon boundary
 * ESRI geometry rings are in [lon, lat] format
 */
function calculateDistanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  let minDistance = Infinity;
  
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const p1 = ring[i];
      const p2 = ring[(i + 1) % ring.length]; // Wrap around to first point
      
      // ESRI geometry coordinates are [lon, lat]
      const lat1 = p1[1];
      const lon1 = p1[0];
      const lat2 = p2[1];
      const lon2 = p2[0];
      
      // Calculate distance from point to line segment using geographic coordinates
      const dist = pointToLineSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, dist);
    }
  }
  
  return minDistance;
}

/**
 * Calculate distance from a point to a line segment on a sphere
 * Uses an approximation: samples points along the segment and finds minimum distance
 */
function pointToLineSegmentDistance(
  latP: number, lonP: number,
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  // First, calculate distances to endpoints
  const distToP1 = haversineDistance(latP, lonP, lat1, lon1);
  const distToP2 = haversineDistance(latP, lonP, lat2, lon2);
  
  // If segment is very short, just use minimum distance to endpoints
  const segmentLength = haversineDistance(lat1, lon1, lat2, lon2);
  if (segmentLength < 0.01) { // Less than ~0.6 miles
    return Math.min(distToP1, distToP2);
  }
  
  // Use a simple approximation: sample points along the segment
  // This is more accurate than Euclidean math on geographic coordinates
  const numSamples = Math.max(3, Math.ceil(segmentLength * 10)); // Sample every ~0.1 miles
  let minDist = Math.min(distToP1, distToP2);
  
  for (let i = 1; i < numSamples; i++) {
    const t = i / numSamples;
    // Interpolate lat/lon along the great circle arc (simple linear interpolation)
    const latT = lat1 + t * (lat2 - lat1);
    const lonT = lon1 + t * (lon2 - lon1);
    const dist = haversineDistance(latP, lonP, latT, lonT);
    minDist = Math.min(minDist, dist);
  }
  
  return minDist;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a point is inside a ring using ray casting algorithm
 */
function pointInRing(lat: number, lon: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    // ESRI geometry coordinates are [lon, lat]
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  // Check if point is in any ring (for multipolygon, point needs to be in at least one outer ring)
  for (const ring of rings) {
    if (pointInRing(lat, lon, ring)) {
      return true;
    }
  }
  return false;
}

/**
 * Query TIGER Places and County Subdivisions data for a given location and radius
 */
export async function getTIGERPlacesCountySubdivisionsData(
  layerId: number,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<{
  containing?: TIGERPlacesCountySubdivisionsInfo | null;
  nearby_features: TIGERPlacesCountySubdivisionsInfo[];
  _all: TIGERPlacesCountySubdivisionsInfo[];
}> {
  let containing: TIGERPlacesCountySubdivisionsInfo | null = null;
  const nearby_features: TIGERPlacesCountySubdivisionsInfo[] = [];
  const _all: TIGERPlacesCountySubdivisionsInfo[] = [];

  try {
    // Convert radius from miles to meters for ESRI query
    const radiusMeters = radiusMiles * 1609.34;

    // Create a buffer geometry for proximity query
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };

    // Query for features within the radius
    const queryUrl = `${BASE_SERVICE_URL}/${layerId}/query`;
    const queryParams = new URLSearchParams({
      f: 'json',
      where: '1=1',
      outFields: '*',
      geometry: JSON.stringify(geometry),
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      distance: radiusMeters.toString(),
      units: 'esriSRUnit_Meter',
      inSR: '4326',
      outSR: '4326',
      returnGeometry: 'true',
      resultRecordCount: '1000',
      resultOffset: '0'
    });

    let allFeatures: TIGERPlacesCountySubdivisionsInfo[] = [];
    let offset = 0;
    const maxRecords = 1000;

    while (true) {
      queryParams.set('resultOffset', offset.toString());
      const response = await fetchJSONSmart(`${queryUrl}?${queryParams.toString()}`);
      
      if (!response || response.error || !response.features || response.features.length === 0) {
        break;
      }

      const features = response.features.map((feature: any) => {
        const attrs = feature.attributes || {};
        const geom = feature.geometry || {};
        
        // Extract name from various possible fields
        const name = attrs.NAME || attrs.NAMELSAD || attrs.NAME20 || attrs.PLACE || attrs.COUSUB || null;
        
        // Determine place type based on layer ID
        // Layers 0-5: Base layers
        // Layers 7-12: BAS 2025 (same pattern as 0-5, offset by 1)
        // Layers 14-19: ACS 2024 (same pattern as 0-5, offset by 2)
        // Layers 21-26: Census 2020 (same pattern as 0-5, offset by 3)
        // Layers 6, 13, 20: Group layers (no data)
        let placeType: string | null = null;
        const baseLayerId = layerId <= 5 ? layerId : (layerId >= 7 && layerId <= 12) ? layerId - 7 : (layerId >= 14 && layerId <= 19) ? layerId - 14 : (layerId >= 21 && layerId <= 26) ? layerId - 21 : -1;
        if (baseLayerId === 0) {
          placeType = 'Estates';
        } else if (baseLayerId === 1) {
          placeType = 'County Subdivisions';
        } else if (baseLayerId === 2) {
          placeType = 'Subbarrios';
        } else if (baseLayerId === 3) {
          placeType = 'Consolidated Cities';
        } else if (baseLayerId === 4) {
          placeType = 'Incorporated Places';
        } else if (baseLayerId === 5) {
          placeType = 'Census Designated Places';
        }

        return {
          objectId: attrs.OBJECTID || attrs.FID || 0,
          name,
          stateFips: attrs.STATEFP || attrs.STATE || null,
          countyFips: attrs.COUNTYFP || attrs.COUNTY || null,
          placeType: placeType,
          geometry: geom,
          attributes: attrs
        } as TIGERPlacesCountySubdivisionsInfo;
      });

      allFeatures = allFeatures.concat(features);

      if (response.features.length < maxRecords || !response.exceededTransferLimit) {
        break;
      }

      offset += maxRecords;
      if (offset > 100000) {
        console.warn(`⚠️ TIGER Places Layer ${layerId}: Stopping pagination at 100k records for safety`);
        break;
      }
    }

    // Process features: check point-in-polygon and calculate distances
    for (const feature of allFeatures) {
      if (!feature.geometry || !feature.geometry.rings) {
        continue;
      }

      const rings = feature.geometry.rings;
      
      // Check if point is inside polygon
      const isInside = pointInPolygon(lat, lon, rings);
      
      if (isInside) {
        containing = feature;
        feature.distance_miles = 0;
        feature.isContaining = true;
      } else {
        // Calculate distance to polygon boundary
        const distance = calculateDistanceToPolygon(lat, lon, rings);
        feature.distance_miles = distance;
        feature.isContaining = false;
        
        // Only include if within radius
        if (distance <= radiusMiles) {
          nearby_features.push(feature);
        }
      }
      
      // Add to _all if within radius
      if (isInside || (feature.distance_miles !== undefined && feature.distance_miles <= radiusMiles)) {
        _all.push(feature);
      }
    }

    // Sort nearby features by distance
    nearby_features.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));

    return {
      containing,
      nearby_features,
      _all
    };
  } catch (error) {
    console.error(`Error fetching TIGER Places and County Subdivisions data for layer ${layerId}:`, error);
    return {
      containing: null,
      nearby_features: [],
      _all: []
    };
  }
}
