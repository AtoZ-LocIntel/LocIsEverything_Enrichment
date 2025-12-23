/**
 * USGS Government Units Adapter
 * Queries USGS Governmental Unit Boundaries FeatureServer for polygon features
 * Supports point-in-polygon and proximity queries up to 50 miles
 */

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://cartowfs.nationalmap.gov/arcgis/rest/services/govunits/MapServer';

export interface USGSGovernmentUnitInfo {
  unitId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  isContaining?: boolean; // True if point is within the polygon
  distance_miles?: number; // Distance from query point (for proximity queries)
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
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  // Use the first ring (exterior ring) for point-in-polygon check
  const ring = rings[0];
  if (!ring || ring.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]; // lon
    const yi = ring[i][1]; // lat
    const xj = ring[j][0]; // lon
    const yj = ring[j][1]; // lat
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate distance from point to nearest point on polygon boundary
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  rings.forEach(ring => {
    if (!ring || ring.length < 2) return;
    
    // Calculate distance to each edge of the polygon
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      
      if (p1.length >= 2 && p2.length >= 2) {
        const lon1 = p1[0];
        const lat1 = p1[1];
        const lon2 = p2[0];
        const lat2 = p2[1];
        
        // Calculate distance from point to line segment
        const A = lon - lon1;
        const B = lat - lat1;
        const C = lon2 - lon1;
        const D = lat2 - lat1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
          param = dot / lenSq;
        }
        
        let xx: number, yy: number;
        
        if (param < 0) {
          xx = lon1;
          yy = lat1;
        } else if (param > 1) {
          xx = lon2;
          yy = lat2;
        } else {
          xx = lon1 + param * C;
          yy = lat1 + param * D;
        }
        
        const distance = calculateHaversineDistance(lat, lon, yy, xx);
        if (distance < minDistance) {
          minDistance = distance;
        }
      }
    }
  });
  
  return minDistance === Infinity ? 0 : minDistance;
}

/**
 * Query USGS Government Units FeatureServer
 * Supports point-in-polygon and proximity queries up to 50 miles
 */
export async function getUSGSGovernmentUnitsData(
  layerId: number,
  lat: number,
  lon: number,
  radius?: number
): Promise<USGSGovernmentUnitInfo[]> {
  try {
    console.log(`🏛️ Querying USGS Government Units Layer ${layerId} for [${lat}, ${lon}]`);
    
    const results: USGSGovernmentUnitInfo[] = [];
    const processedFeatureIds = new Set<string>();
    
    // First, try point-in-polygon query (no radius needed)
    try {
      const pointInPolygonUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
      pointInPolygonUrl.searchParams.set('f', 'json');
      pointInPolygonUrl.searchParams.set('where', '1=1');
      pointInPolygonUrl.searchParams.set('outFields', '*');
      pointInPolygonUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      pointInPolygonUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      pointInPolygonUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      pointInPolygonUrl.searchParams.set('inSR', '4326');
      pointInPolygonUrl.searchParams.set('outSR', '4326');
      pointInPolygonUrl.searchParams.set('returnGeometry', 'true');
      pointInPolygonUrl.searchParams.set('returnDistinctValues', 'false');
      
      const pointInPolygonData = await fetchJSONSmart(pointInPolygonUrl.toString());
      
      if (!pointInPolygonData.error && pointInPolygonData.features && pointInPolygonData.features.length > 0) {
        pointInPolygonData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const unitId = attributes.OBJECTID || 
                         attributes.objectid || 
                         attributes.FID ||
                         attributes.fid ||
                         null;
          
          const featureId = unitId ? unitId.toString() : `${feature.OBJECTID || feature.objectid || Math.random()}`;
          
          if (!processedFeatureIds.has(featureId)) {
            // Verify point is actually inside polygon
            let isContaining = false;
            if (geometry && geometry.rings) {
              isContaining = pointInPolygon(lat, lon, geometry.rings);
            }
            
            if (isContaining) {
              results.push({
                unitId: unitId ? unitId.toString() : null,
                attributes,
                geometry,
                isContaining: true,
                distance_miles: 0
              });
              processedFeatureIds.add(featureId);
            }
          }
        });
      }
    } catch (error) {
      console.error(`❌ Error in point-in-polygon query for Layer ${layerId}:`, error);
    }
    
    // Then, if radius is provided, do proximity query
    if (radius && radius > 0) {
      const cappedRadius = Math.min(radius, 50.0);
      const radiusMeters = cappedRadius * 1609.34;
      
      console.log(`🔍 Querying USGS Government Units Layer ${layerId} within ${cappedRadius} miles`);
      
      // Proximity query with pagination support
      const allFeatures: any[] = [];
      let resultOffset = 0;
      const batchSize = 2000;
      let hasMore = true;
      
      while (hasMore) {
        const proximityUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
        proximityUrl.searchParams.set('f', 'json');
        proximityUrl.searchParams.set('where', '1=1');
        proximityUrl.searchParams.set('outFields', '*');
        proximityUrl.searchParams.set('geometry', JSON.stringify({
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        }));
        proximityUrl.searchParams.set('geometryType', 'esriGeometryPoint');
        proximityUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
        proximityUrl.searchParams.set('distance', radiusMeters.toString());
        proximityUrl.searchParams.set('units', 'esriSRUnit_Meter');
        proximityUrl.searchParams.set('inSR', '4326');
        proximityUrl.searchParams.set('outSR', '4326');
        proximityUrl.searchParams.set('returnGeometry', 'true');
        proximityUrl.searchParams.set('resultRecordCount', batchSize.toString());
        proximityUrl.searchParams.set('resultOffset', resultOffset.toString());
        
        try {
          const proximityData = await fetchJSONSmart(proximityUrl.toString());
          
          if (proximityData.error) {
            console.error(`❌ USGS Government Units Layer ${layerId} API Error:`, proximityData.error);
            break;
          }
          
          if (!proximityData.features || proximityData.features.length === 0) {
            hasMore = false;
            break;
          }
          
          allFeatures.push(...proximityData.features);
          
          if (resultOffset === 0) {
            console.log(`✅ USGS Government Units Layer ${layerId} returned ${proximityData.features.length} feature(s) from proximity query`);
          }
          
          if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
            resultOffset += batchSize;
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            hasMore = false;
          }
        } catch (error) {
          console.error(`❌ Error fetching USGS Government Units Layer ${layerId} (offset ${resultOffset}):`, error);
          hasMore = false;
        }
      }
      
      // Process proximity features
      allFeatures.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || null;
        
        const unitId = attributes.OBJECTID || 
                       attributes.objectid || 
                       attributes.FID ||
                       attributes.fid ||
                       null;
        
        const featureId = unitId ? unitId.toString() : `${feature.OBJECTID || feature.objectid || Math.random()}`;
        
        if (processedFeatureIds.has(featureId)) {
          return;
        }
        
        // Check if point is inside polygon
        let isContaining = false;
        let distance_miles = cappedRadius;
        
        if (geometry && geometry.rings) {
          isContaining = pointInPolygon(lat, lon, geometry.rings);
          if (!isContaining) {
            // Calculate distance to polygon boundary
            distance_miles = distanceToPolygon(lat, lon, geometry.rings);
          } else {
            distance_miles = 0;
          }
        }
        
        // Only include if within radius
        if (distance_miles <= cappedRadius) {
          results.push({
            unitId: unitId ? unitId.toString() : null,
            attributes,
            geometry,
            isContaining,
            distance_miles: Number(distance_miles.toFixed(2))
          });
          processedFeatureIds.add(featureId);
        }
      });
    }
    
    // Sort results: containing first, then by distance
    results.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      return (a.distance_miles || Infinity) - (b.distance_miles || Infinity);
    });
    
    console.log(`✅ Processed ${results.length} USGS Government Units Layer ${layerId} feature(s)`);
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying USGS Government Units Layer ${layerId}:`, error);
    return [];
  }
}

