/**
 * Adapter for Maritime Boundaries and Exclusive Economic Zones from UNH
 * Service URL: https://gis.ccom.unh.edu/server/rest/services/Global/Maritime_Boundaries_and_Exclusive_Economic_Zones_200NM/MapServer
 * 
 * Layer 1: eez_v11 - Exclusive Economic Zones (200NM)
 * 
 * From VLIZ Maritime Boundaries Geodatabase. Boundaries have been built using information about treaties 
 * between coastal countries. When treaties are not available, median lines have been calculated. 
 * An exclusive economic zone (EEZ) is a seazone extending from a state's coast or baseline over which 
 * the state has special rights over the exploration and use of marine resources. Generally a state's 
 * EEZ extends 200 nautical miles out from its coast, except where resulting points would be closer to another country.
 */

const BASE_SERVICE_URL = 'https://gis.ccom.unh.edu/server/rest/services/Global/Maritime_Boundaries_and_Exclusive_Economic_Zones_200NM/MapServer';
const LAYER_ID = 0; // Layer 0: eez_boundaries_v11_outline (polylines)

export interface MaritimeBoundaryFeature {
  objectId: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance from query point (0 if inside polygon)
  isContaining?: boolean; // True if point is within polygon
}

/**
 * Point-in-polygon check using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  const outerRing = rings[0];
  if (!outerRing || outerRing.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0]; // lon
    const yi = outerRing[i][1]; // lat
    const xj = outerRing[j][0]; // lon
    const yj = outerRing[j][1]; // lat
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  // Check if point is in any holes
  for (let h = 1; h < rings.length; h++) {
    const hole = rings[h];
    if (!hole || hole.length < 3) continue;
    
    let inHole = false;
    for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
      const xi = hole[i][0];
      const yi = hole[i][1];
      const xj = hole[j][0];
      const yj = hole[j][1];
      
      const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inHole = !inHole;
    }
    
    if (inHole) {
      inside = false; // Point is in a hole, so not inside polygon
      break;
    }
  }
  
  return inside;
}

/**
 * Calculate haversine distance between two points in miles
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Calculate centroid of polygon rings
 */
function calculateCentroid(rings: number[][][]): { lat: number; lon: number } | null {
  if (!rings || rings.length === 0) return null;
  
  const outerRing = rings[0];
  if (!outerRing || outerRing.length === 0) return null;
  
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  
  for (const ring of rings) {
    for (const point of ring) {
      if (point && point.length >= 2) {
        sumLon += point[0]; // lon
        sumLat += point[1]; // lat
        count++;
      }
    }
  }
  
  if (count === 0) return null;
  
  return {
    lat: sumLat / count,
    lon: sumLon / count
  };
}

/**
 * Query Maritime Boundaries for point-in-polygon and proximity
 */
export async function getMaritimeBoundariesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<MaritimeBoundaryFeature[]> {
  try {
    console.log(`🌊 Maritime Boundaries query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`);

    const results: MaritimeBoundaryFeature[] = [];
    const containsObjectIdsSet = new Set<number>(); // Track object IDs from contains query

    // For polylines, we can't do point-in-polygon, but we can find nearby lines
    // Use a small buffer query to find lines very close to the point
    try {
      const nearbyLinesUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
      nearbyLinesUrl.searchParams.set('f', 'json');
      nearbyLinesUrl.searchParams.set('where', '1=1');
      nearbyLinesUrl.searchParams.set('outFields', '*');
      nearbyLinesUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      nearbyLinesUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      nearbyLinesUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      nearbyLinesUrl.searchParams.set('distance', '1000'); // 1km buffer to find very close lines
      nearbyLinesUrl.searchParams.set('units', 'esriSRUnit_Meter');
      nearbyLinesUrl.searchParams.set('inSR', '4326');
      nearbyLinesUrl.searchParams.set('outSR', '4326');
      nearbyLinesUrl.searchParams.set('returnGeometry', 'true');

      console.log(`🔗 Maritime Boundaries Nearby Lines Query URL: ${nearbyLinesUrl.toString()}`);

      const nearbyLinesResponse = await fetch(nearbyLinesUrl.toString());
      if (nearbyLinesResponse.ok) {
        const nearbyLinesData = await nearbyLinesResponse.json();
        
        if (!nearbyLinesData.error && nearbyLinesData.features && Array.isArray(nearbyLinesData.features)) {
          nearbyLinesData.features.forEach((feature: any) => {
            const attributes = feature.attributes || {};
            const geometry = feature.geometry;
            // UNH service uses FID_ (with underscore) as the object ID field
            const objectId = attributes.FID_ || attributes.FID || attributes.OBJECTID || attributes.objectid || 0;
            
            if (geometry && geometry.paths) {
              // Calculate minimum distance to the polyline
              let minDistance = Infinity;
              geometry.paths.forEach((path: number[][]) => {
                for (let i = 0; i < path.length - 1; i++) {
                  const dist = calculateDistanceToLineSegment(lat, lon, path[i][1], path[i][0], path[i+1][1], path[i+1][0]);
                  if (dist < minDistance) minDistance = dist;
                }
              });
              
              if (minDistance < 0.62) { // Within ~1km (0.62 miles)
                results.push({
                  objectId,
                  attributes,
                  geometry,
                  distance_miles: minDistance,
                  isContaining: true
                });
                containsObjectIdsSet.add(objectId);
              }
            }
          });
          
          console.log(`✅ Found ${results.length} Maritime Boundary line(s) very close to the point`);
        }
      }
    } catch (error) {
      console.error(`❌ Nearby lines query failed for Maritime Boundaries:`, error);
    }
    
    // Helper function to calculate distance from point to line segment
    function calculateDistanceToLineSegment(
      px: number, py: number,
      x1: number, y1: number,
      x2: number, y2: number
    ): number {
      const A = px - x1;
      const B = py - y1;
      const C = x2 - x1;
      const D = y2 - y1;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      
      if (lenSq !== 0) param = dot / lenSq;
      
      let xx: number, yy: number;
      
      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }
      
      const dx = px - xx;
      const dy = py - yy;
      return Math.sqrt(dx * dx + dy * dy);
    }

    // Proximity query (for all features within radius)
    if (radiusMiles > 0) {
      try {
        // Calculate bounding box for envelope query (more reliable than distance query)
        // Convert radius from miles to degrees (approximate)
        const latRadius = radiusMiles / 69; // 1 degree latitude ≈ 69 miles
        const lonRadius = radiusMiles / (69 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude
        
        const xmin = lon - lonRadius;
        const ymin = lat - latRadius;
        const xmax = lon + lonRadius;
        const ymax = lat + latRadius;
        
        // Try envelope query first (more reliable for MapServer)
        const envelopeUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
        envelopeUrl.searchParams.set('f', 'json');
        envelopeUrl.searchParams.set('where', '1=1');
        envelopeUrl.searchParams.set('outFields', '*');
        envelopeUrl.searchParams.set('geometry', JSON.stringify({
          xmin: xmin,
          ymin: ymin,
          xmax: xmax,
          ymax: ymax,
          spatialReference: { wkid: 4326 }
        }));
        envelopeUrl.searchParams.set('geometryType', 'esriGeometryEnvelope');
        envelopeUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
        envelopeUrl.searchParams.set('inSR', '4326');
        envelopeUrl.searchParams.set('outSR', '4326');
        envelopeUrl.searchParams.set('returnGeometry', 'true');
        // Note: Service doesn't support pagination, so don't set resultRecordCount
        // The service should return full geometries even when using an envelope query

        console.log(`🔗 Maritime Boundaries Envelope Query URL: ${envelopeUrl.toString()}`);

        const proximityResponse = await fetch(envelopeUrl.toString());
        
        if (proximityResponse.ok) {
          const proximityData = await proximityResponse.json();
          
          if (proximityData.error) {
            console.error(`❌ Maritime Boundaries API Error:`, proximityData.error);
          } else if (proximityData.features && Array.isArray(proximityData.features)) {
            console.log(`🌊 Maritime Boundaries proximity query returned ${proximityData.features.length} features`);
            
            proximityData.features.forEach((feature: any) => {
              const attributes = feature.attributes || {};
              const geometry = feature.geometry;
              // UNH service uses FID_ (with underscore) as the object ID field
              const objectId = attributes.FID_ || attributes.FID || attributes.OBJECTID || attributes.objectid || 0;
              
              // Skip if already added from nearby lines query
              if (containsObjectIdsSet.has(objectId)) {
                return;
              }
              
              let distanceMiles = radiusMiles;
              let featureLat: number | null = null;
              let featureLon: number | null = null;

              // Calculate distance for polyline geometry
              // Service uses WGS84 (4326) natively, no conversion needed
              if (geometry && geometry.paths && geometry.paths.length > 0) {
                // Polyline geometry - find closest point on line to query point
                let minDistance = Infinity;
                let closestPoint: { lat: number; lon: number } | null = null;
                
                geometry.paths.forEach((path: number[][]) => {
                  for (let i = 0; i < path.length - 1; i++) {
                    // Path coordinates are [lon, lat] in WGS84
                    const p1 = { lat: path[i][1], lon: path[i][0] };
                    const p2 = { lat: path[i+1][1], lon: path[i+1][0] };
                    
                    // Calculate closest point on segment using perpendicular distance
                    const A = lat - p1.lat;
                    const B = lon - p1.lon;
                    const C = p2.lat - p1.lat;
                    const D = p2.lon - p1.lon;
                    
                    const dot = A * C + B * D;
                    const lenSq = C * C + D * D;
                    let param = lenSq !== 0 ? dot / lenSq : 0;
                    param = Math.max(0, Math.min(1, param));
                    
                    const closestLat = p1.lat + param * C;
                    const closestLon = p1.lon + param * D;
                    const dist = calculateDistance(lat, lon, closestLat, closestLon);
                    
                    if (dist < minDistance) {
                      minDistance = dist;
                      closestPoint = { lat: closestLat, lon: closestLon };
                    }
                  }
                });
                
                if (closestPoint) {
                  featureLat = closestPoint.lat;
                  featureLon = closestPoint.lon;
                  distanceMiles = minDistance;
                }
              }

              // Only include if within radius
              if (distanceMiles <= radiusMiles) {
                results.push({
                  objectId,
                  attributes,
                  geometry,
                  distance_miles: distanceMiles,
                  isContaining: false
                });
              }
            });
            
            console.log(`🌊 After filtering by distance, ${results.length} Maritime Boundary features within ${radiusMiles} miles`);
          } else {
            console.warn(`🌊 Maritime Boundaries proximity query returned no features or invalid response:`, proximityData);
          }
        }
      } catch (error) {
        console.error(`❌ Proximity query failed for Maritime Boundaries:`, error);
      }
    }

    // Remove duplicates based on objectId
    const uniqueResults = Array.from(
      new Map(results.map(item => [item.objectId, item])).values()
    );

    console.log(`✅ Retrieved ${uniqueResults.length} unique Maritime Boundary feature(s)`);
    return uniqueResults;
    
  } catch (error: any) {
    console.error(`❌ Error querying Maritime Boundaries:`, error);
    return [];
  }
}
