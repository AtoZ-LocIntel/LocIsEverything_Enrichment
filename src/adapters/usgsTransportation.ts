/**
 * USGS Transportation Adapter
 * Service: https://cartowfs.nationalmap.gov/arcgis/rest/services/transportation/MapServer
 * Supports proximity queries up to 25 miles (5 miles for Local Roads)
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://cartowfs.nationalmap.gov/arcgis/rest/services/transportation/MapServer';

export interface USGSTransportationFeature {
  objectid: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance from query point
  layerId: number; // Which layer this feature came from (1-8)
  layerName: string; // Human-readable layer name
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
 * Calculate distance from point to nearest point on polygon boundary (for Airport features)
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
 * Query a specific USGS Transportation layer
 */
async function queryTransportationLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSTransportationFeature[]> {
  try {
    const radiusKm = radiusMiles * 1.60934;
    const maxRecordCount = 2000;

    console.log(
      `🚗 USGS Transportation ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
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
          `USGS Transportation ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ USGS Transportation ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances
    const processedFeatures: USGSTransportationFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || 0;

        let distanceMiles = radiusMiles; // Default to max radius

        // Calculate distance based on geometry type
        if (geometry) {
          if (geometry.paths && geometry.paths.length > 0) {
            // Polyline geometry (roads, railroads, trails)
            distanceMiles = distanceToPolyline(lat, lon, geometry.paths);
          } else if (geometry.rings && geometry.rings.length > 0) {
            // Polygon geometry (airports)
            distanceMiles = distanceToPolygon(lat, lon, geometry.rings);
          } else if (geometry.x && geometry.y) {
            // Point geometry
            const dx = (lon - geometry.x) * 69 * Math.cos(lat * Math.PI / 180);
            const dy = (lat - geometry.y) * 69;
            distanceMiles = Math.sqrt(dx * dx + dy * dy);
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
      `✅ Processed ${processedFeatures.length} USGS Transportation ${layerName} feature(s) within ${radiusMiles} miles`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ USGS Transportation ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query all USGS Transportation layers
 */
export async function getUSGSTransportationData(
  lat: number,
  lon: number,
  radiusMiles: number,
  layerIds?: number[] // Optional: specify which layers to query (default: all)
): Promise<USGSTransportationFeature[]> {
  const layers = [
    { id: 1, name: 'Airport', maxRadius: 25 },
    { id: 2, name: 'Airport Runway', maxRadius: 25 },
    { id: 3, name: 'Interstate', maxRadius: 25 },
    { id: 4, name: 'US Route', maxRadius: 25 },
    { id: 5, name: 'State Route', maxRadius: 25 },
    { id: 6, name: 'US Railroad', maxRadius: 25 },
    { id: 7, name: 'Local Road', maxRadius: 5 },
    { id: 8, name: 'Trails', maxRadius: 25 },
  ];

  const layersToQuery = layerIds 
    ? layers.filter(l => layerIds.includes(l.id))
    : layers;

  const allFeatures: USGSTransportationFeature[] = [];

  // Query each layer in parallel
  const queries = layersToQuery.map(layer => {
    const cappedRadius = Math.min(radiusMiles, layer.maxRadius);
    return queryTransportationLayer(layer.id, layer.name, lat, lon, cappedRadius);
  });

  const results = await Promise.all(queries);
  
  // Combine all results
  results.forEach(features => {
    allFeatures.push(...features);
  });

  // Sort all features by distance
  allFeatures.sort((a, b) => {
    const distA = a.distance_miles || Infinity;
    const distB = b.distance_miles || Infinity;
    return distA - distB;
  });

  return allFeatures;
}

/**
 * Query individual transportation layers (for specific layer queries)
 */
export async function getUSGSTransportationAirportData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSTransportationFeature[]> {
  return queryTransportationLayer(1, 'Airport', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSTransportationAirportRunwayData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSTransportationFeature[]> {
  return queryTransportationLayer(2, 'Airport Runway', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSTransportationInterstateData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSTransportationFeature[]> {
  return queryTransportationLayer(3, 'Interstate', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSTransportationUSRouteData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSTransportationFeature[]> {
  return queryTransportationLayer(4, 'US Route', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSTransportationStateRouteData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSTransportationFeature[]> {
  return queryTransportationLayer(5, 'State Route', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSTransportationUSRailroadData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSTransportationFeature[]> {
  return queryTransportationLayer(6, 'US Railroad', lat, lon, Math.min(radiusMiles, 25));
}

export async function getUSGSTransportationLocalRoadData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSTransportationFeature[]> {
  return queryTransportationLayer(7, 'Local Road', lat, lon, Math.min(radiusMiles, 5));
}

export async function getUSGSTransportationTrailsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<USGSTransportationFeature[]> {
  return queryTransportationLayer(8, 'Trails', lat, lon, Math.min(radiusMiles, 25));
}

