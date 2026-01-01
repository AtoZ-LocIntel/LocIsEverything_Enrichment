/**
 * USGS GeoNames Adapter
 * Service: https://cartowfs.nationalmap.gov/arcgis/rest/services/geonames/MapServer
 * Supports proximity queries up to 25 miles for all layers
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://cartowfs.nationalmap.gov/arcgis/rest/services/geonames/MapServer';

export interface USGSGeonameFeature {
  objectid: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance from query point
  layerId: number; // Which layer this feature came from (0-6)
  layerName: string; // Human-readable layer name
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate distance from a point to the nearest point on a polyline
 */
function distanceToPolyline(
  pointLat: number,
  pointLon: number,
  polylinePaths: number[][][]
): number {
  let minDistance = Infinity;

  for (const path of polylinePaths) {
    for (let i = 0; i < path.length - 1; i++) {
      const segmentStart = path[i];
      const segmentEnd = path[i + 1];

      // Calculate distance to line segment
      const distance = distanceToLineSegment(
        pointLat,
        pointLon,
        segmentStart[1], // lat
        segmentStart[0], // lon
        segmentEnd[1], // lat
        segmentEnd[0] // lon
      );

      minDistance = Math.min(minDistance, distance);
    }
  }

  return minDistance;
}

/**
 * Calculate distance from a point to a line segment
 */
function distanceToLineSegment(
  pointLat: number,
  pointLon: number,
  lineStartLat: number,
  lineStartLon: number,
  lineEndLat: number,
  lineEndLon: number
): number {
  const A = pointLon - lineStartLon;
  const B = pointLat - lineStartLat;
  const C = lineEndLon - lineStartLon;
  const D = lineEndLat - lineStartLat;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = lineStartLon;
    yy = lineStartLat;
  } else if (param > 1) {
    xx = lineEndLon;
    yy = lineEndLat;
  } else {
    xx = lineStartLon + param * C;
    yy = lineStartLat + param * D;
  }

  const dx = pointLon - xx;
  const dy = pointLat - yy;
  return Math.sqrt(dx * dx + dy * dy) * 69; // Convert to miles (rough approximation)
}

/**
 * Calculate distance from point to nearest point on polygon boundary
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  rings.forEach(ring => {
    if (!ring || ring.length < 2) return;
    
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      
      if (p1.length >= 2 && p2.length >= 2) {
        const lon1 = p1[0];
        const lat1 = p1[1];
        const lon2 = p2[0];
        const lat2 = p2[1];
        
        const distance = distanceToLineSegment(lat, lon, lat1, lon1, lat2, lon2);
        minDistance = Math.min(minDistance, distance);
      }
    }
  });
  
  return minDistance;
}

/**
 * Query a specific USGS GeoNames layer
 */
async function queryGeonameLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSGeonameFeature[]> {
  try {
    const radiusKm = radiusMiles * 1.60934;
    const maxRecordCount = 2000;

    console.log(
      `📍 USGS GeoNames ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
      const queryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
      queryUrl.searchParams.set('f', 'json');
      queryUrl.searchParams.set('where', '1=1');
      queryUrl.searchParams.set('outFields', '*');
      queryUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      queryUrl.searchParams.set('distance', radiusKm.toString());
      queryUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      const response = await fetchJSONSmart(queryUrl.toString());

      if (response.error) {
        throw new Error(
          `USGS GeoNames ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ USGS GeoNames ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances
    const processedFeatures: USGSGeonameFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || 0;

        let distanceMiles = radiusMiles; // Default to max radius

        // Calculate distance based on geometry type
        if (geometry) {
          if (geometry.paths && geometry.paths.length > 0) {
            // Polyline geometry (hydro lines, transportation)
            distanceMiles = distanceToPolyline(lat, lon, geometry.paths);
          } else if (geometry.rings && geometry.rings.length > 0) {
            // Polygon geometry
            distanceMiles = distanceToPolygon(lat, lon, geometry.rings);
          } else if (geometry.x && geometry.y) {
            // Point geometry (hydro points, administrative, landform, etc.)
            distanceMiles = calculateHaversineDistance(lat, lon, geometry.y, geometry.x);
          }
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          layerId,
          layerName,
        };
      }
    );

    // Sort by distance
    processedFeatures.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${processedFeatures.length} USGS GeoNames ${layerName} feature(s) within ${radiusMiles} miles`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ USGS GeoNames ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query individual GeoNames layers (for specific layer queries)
 */
export async function getUSGSGeonamesAdministrativeData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSGeonameFeature[]> {
  return queryGeonameLayer(0, 'Administrative', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSGeonamesTransportationData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSGeonameFeature[]> {
  return queryGeonameLayer(1, 'Transportation', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSGeonamesLandformData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSGeonameFeature[]> {
  return queryGeonameLayer(2, 'Landform', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSGeonamesHydroLinesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSGeonameFeature[]> {
  return queryGeonameLayer(3, 'Hydro Lines', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSGeonamesHydroPointsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSGeonameFeature[]> {
  return queryGeonameLayer(4, 'Hydro Points', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSGeonamesAntarcticaData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSGeonameFeature[]> {
  return queryGeonameLayer(5, 'Antarctica', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSGeonamesHistoricalData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSGeonameFeature[]> {
  return queryGeonameLayer(6, 'Historical', lat, lon, Math.min(radiusMiles, 25));
}

