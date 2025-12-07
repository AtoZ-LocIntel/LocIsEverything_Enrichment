/**
 * LA County Infrastructure Adapter
 * Queries LA County Infrastructure MapServer for multiple infrastructure layers
 * Supports proximity queries for points/lines and point-in-polygon for polygons
 */

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Infrastructure/MapServer';

export interface LACountyInfrastructureInfo {
  infrastructureId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  isContaining?: boolean; // For point-in-polygon queries
  distance_miles?: number; // For proximity queries
}

/**
 * Query LA County Infrastructure MapServer for a specific layer
 * Supports point-in-polygon queries for polygons and proximity queries for all (up to 25 miles)
 */
export async function getLACountyInfrastructureData(
  layerId: number,
  lat: number,
  lon: number,
  radius?: number
): Promise<LACountyInfrastructureInfo[]> {
  try {
    // Determine if this is likely a polygon layer
    // Polygon layers: 1 (Buildings), 2 (Schools), 3 (County-owned Parcels), 4 (Government-owned Parcels)
    // Point layer: 0 (County Facilities)
    const polygonLayerIds = [1, 2, 3, 4];
    const isPolygonLayer = polygonLayerIds.includes(layerId);
    
    // Try point-in-polygon first for polygon layers
    if (isPolygonLayer && (!radius || radius === 0)) {
      console.log(`🗺️ Querying LA County Infrastructure Layer ${layerId} for point-in-polygon at [${lat}, ${lon}]`);
      
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
      
      console.log(`🔗 LA County Infrastructure Layer ${layerId} Point-in-Polygon Query URL: ${queryUrl.toString()}`);
      
      const data = await fetchJSONSmart(queryUrl.toString());
      
      if (data.error) {
        console.error(`❌ LA County Infrastructure Layer ${layerId} API Error:`, data.error);
        return [];
      }
      
      if (!data.features || data.features.length === 0) {
        console.log(`ℹ️ No LA County Infrastructure Layer ${layerId} features found containing the point`);
        return [];
      }
      
      const results: LACountyInfrastructureInfo[] = [];
      
      data.features.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || null;
        
        const infrastructureId = attributes.OBJECTID || 
                                attributes.objectid || 
                                attributes.LACO || 
                                attributes.laco ||
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
            infrastructureId: infrastructureId ? infrastructureId.toString() : null,
            attributes,
            geometry,
            isContaining: true,
            distance_miles: 0
          });
        }
      });
      
      console.log(`✅ Found ${results.length} LA County Infrastructure Layer ${layerId} feature(s) containing the point`);
      return results;
    }
    
    // Proximity query (for all layer types when radius is provided, or for point layers)
    const cappedRadius = Math.min(radius || 25.0, 25.0); // Cap at 25 miles
    
    console.log(`⚠️ Querying LA County Infrastructure Layer ${layerId} within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 LA County Infrastructure Layer ${layerId} Proximity Query URL: ${queryUrl.toString()}`);
    
    const data = await fetchJSONSmart(queryUrl.toString());
    
    if (data.error) {
      console.error(`❌ LA County Infrastructure Layer ${layerId} API Error:`, data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No LA County Infrastructure Layer ${layerId} features found within the specified radius`);
      return [];
    }
    
    const results: LACountyInfrastructureInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const infrastructureId = attributes.OBJECTID || 
                            attributes.objectid || 
                            attributes.LACO || 
                            attributes.laco ||
                            attributes.GlobalID ||
                            attributes.GLOBALID ||
                            null;
      
      // Calculate distance for proximity queries
      let distance_miles = 0;
      if (geometry) {
        if (geometry.x && geometry.y) {
          // Point geometry
          const featureLat = geometry.y;
          const featureLon = geometry.x;
          distance_miles = calculateHaversineDistance(lat, lon, featureLat, featureLon);
        } else if (geometry.paths || geometry.rings) {
          // Line or polygon geometry - calculate distance to nearest point
          const coords = geometry.paths ? geometry.paths[0] : (geometry.rings ? geometry.rings[0] : []);
          if (coords && coords.length > 0) {
            let minDistance = Infinity;
            coords.forEach((coord: number[]) => {
              const coordLat = coord[1];
              const coordLon = coord[0];
              const dist = calculateHaversineDistance(lat, lon, coordLat, coordLon);
              if (dist < minDistance) minDistance = dist;
            });
            distance_miles = minDistance;
          }
        }
      }
      
      results.push({
        infrastructureId: infrastructureId ? infrastructureId.toString() : null,
        attributes,
        geometry,
        distance_miles
      });
    });
    
    console.log(`✅ Found ${results.length} LA County Infrastructure Layer ${layerId} feature(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error(`❌ Error querying LA County Infrastructure Layer ${layerId}:`, error);
    return [];
  }
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

