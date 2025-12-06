/**
 * LA County Hazards Adapter
 * Queries LA County Hazards MapServer for multiple hazard layers
 * Supports proximity queries for points/lines and point-in-polygon for polygons
 */

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Hazards/MapServer';

export interface LACountyHazardInfo {
  hazardId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // For point-in-polygon queries
}

/**
 * Query LA County Hazards MapServer for a specific layer
 * Supports both point-in-polygon (for polygons) and proximity queries (for points/lines/polygons)
 */
export async function getLACountyHazardsData(
  layerId: number,
  lat: number,
  lon: number,
  radius?: number
): Promise<LACountyHazardInfo[]> {
  try {
    // Determine if this is a polygon layer (for point-in-polygon) or point/line layer (proximity only)
    // Layer IDs that are typically polygons: 1, 2, 5, 7, 8, 9, 11, 12, 14, 18, 19
    // Layer IDs that are typically lines: 4, 6, 13
    // Layer IDs that are typically points: 0, 3, 10, 17
    const polygonLayers = [1, 2, 5, 7, 8, 9, 11, 12, 14, 18, 19];
    const isPolygonLayer = polygonLayers.includes(layerId);
    
    // If no radius provided and it's a polygon layer, do point-in-polygon query only
    if (!radius || radius <= 0) {
      if (isPolygonLayer) {
        console.log(`⚠️ Querying LA County Hazards Layer ${layerId} for point-in-polygon at [${lat}, ${lon}]`);
        
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
        queryUrl.searchParams.set('inSR', '4326');
        queryUrl.searchParams.set('outSR', '4326');
        queryUrl.searchParams.set('returnGeometry', 'true');
        
    console.log(`🔗 LA County Hazards Layer ${layerId} Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const data = await fetchJSONSmart(queryUrl.toString());
        
        if (data.error) {
          console.error(`❌ LA County Hazards Layer ${layerId} API Error:`, data.error);
          return [];
        }
        
        if (!data.features || data.features.length === 0) {
          console.log(`ℹ️ No LA County Hazards Layer ${layerId} features found containing the point`);
          return [];
        }
        
        const results: LACountyHazardInfo[] = [];
        
        data.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const hazardId = attributes.OBJECTID || 
                          attributes.objectid || 
                          attributes.GlobalID ||
                          attributes.GLOBALID ||
                          null;
          
          // Check if point is inside polygon (point-in-polygon)
          let isContaining = false;
          
          if (geometry && geometry.rings) {
            const rings = geometry.rings;
            if (rings && rings.length > 0) {
              const outerRing = rings[0];
              let inside = false;
              for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
                const xi = outerRing[i][0], yi = outerRing[i][1];
                const xj = outerRing[j][0], yj = outerRing[j][1];
                const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
              }
              isContaining = inside;
            }
          }
          
          // Only include features that contain the point
          if (isContaining) {
            results.push({
              hazardId: hazardId ? hazardId.toString() : null,
              attributes,
              geometry,
              isContaining: true,
              distance_miles: 0
            });
          }
        });
        
        console.log(`✅ Found ${results.length} LA County Hazards Layer ${layerId} feature(s) containing the point`);
        return results;
      } else {
        console.log(`ℹ️ LA County Hazards Layer ${layerId} requires a radius for proximity query`);
        return [];
      }
    }
    
    // Proximity query (for all layer types when radius is provided)
    const cappedRadius = Math.min(radius, 25.0); // Cap at 25 miles
    
    console.log(`⚠️ Querying LA County Hazards Layer ${layerId} within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = cappedRadius * 1609.34;
    
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
    queryUrl.searchParams.set('distance', radiusMeters.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 LA County Hazards Layer ${layerId} Proximity Query URL: ${queryUrl.toString()}`);
    
    const data = await fetchJSONSmart(queryUrl.toString());
    
    if (data.error) {
      console.error(`❌ LA County Hazards Layer ${layerId} API Error:`, data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No LA County Hazards Layer ${layerId} features found within the specified radius`);
      return [];
    }
    
    const results: LACountyHazardInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const hazardId = attributes.OBJECTID || 
                      attributes.objectid || 
                      attributes.GlobalID ||
                      attributes.GLOBALID ||
                      null;
      
      // Calculate distance from point to feature
      let distance_miles = cappedRadius; // Default to max radius
      let isContaining = false;
      
      if (geometry) {
        if (geometry.rings) {
          // Polygon geometry - check if point is inside
          const rings = geometry.rings;
          if (rings && rings.length > 0) {
            const outerRing = rings[0];
            let inside = false;
            for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
              const xi = outerRing[i][0], yi = outerRing[i][1];
              const xj = outerRing[j][0], yj = outerRing[j][1];
              const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
              if (intersect) inside = !inside;
            }
            
            if (inside) {
              isContaining = true;
              distance_miles = 0;
            } else {
              // Calculate distance to nearest point on polygon
              let minDistance = Infinity;
              outerRing.forEach((coord: number[]) => {
                const R = 3959; // Earth radius in miles
                const dLat = (lat - coord[1]) * Math.PI / 180;
                const dLon = (lon - coord[0]) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                          Math.cos(coord[1] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                          Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;
                if (distance < minDistance) minDistance = distance;
              });
              distance_miles = minDistance;
            }
          }
        } else if (geometry.paths) {
          // Polyline geometry - calculate distance to nearest point on line
          let minDistance = Infinity;
          geometry.paths.forEach((path: number[][]) => {
            path.forEach((coord: number[]) => {
              const R = 3959; // Earth radius in miles
              const dLat = (lat - coord[1]) * Math.PI / 180;
              const dLon = (lon - coord[0]) * Math.PI / 180;
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(coord[1] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = R * c;
              if (distance < minDistance) minDistance = distance;
            });
          });
          distance_miles = minDistance;
        } else if (geometry.x !== undefined && geometry.y !== undefined) {
          // Point geometry - calculate direct distance
          const R = 3959; // Earth radius in miles
          const dLat = (lat - geometry.y) * Math.PI / 180;
          const dLon = (lon - geometry.x) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(geometry.y * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance_miles = R * c;
        }
      }
      
      // Only include features within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          hazardId: hazardId ? hazardId.toString() : null,
          attributes,
          geometry,
          distance_miles: Number(distance_miles.toFixed(2)),
          isContaining
        });
      }
    });
    
    // Sort by distance (closest first), containing polygons first
    results.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      return (a.distance_miles || Infinity) - (b.distance_miles || Infinity);
    });
    
    console.log(`✅ Found ${results.length} LA County Hazards Layer ${layerId} feature(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error(`❌ Error querying LA County Hazards Layer ${layerId}:`, error);
    return [];
  }
}

