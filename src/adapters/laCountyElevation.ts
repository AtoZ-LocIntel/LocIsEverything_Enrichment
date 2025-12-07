/**
 * LA County Elevation Adapter
 * Queries LA County Elevation MapServer for contour lines and elevation points
 * Raster layers are handled separately for visualization only
 */

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Elevation/MapServer';

export interface LACountyElevationInfo {
  elevationId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query LA County Elevation MapServer for contour lines or elevation points
 * Supports proximity queries up to 25 miles
 * Note: Raster layers (5, 6, 7, 8) are handled separately for visualization only
 */
export async function getLACountyElevationData(
  layerId: number,
  lat: number,
  lon: number,
  radius?: number
): Promise<LACountyElevationInfo[]> {
  try {
    // Raster layers (5, 6, 7, 8) are not queryable - they're for visualization only
    const rasterLayers = [5, 6, 7, 8];
    if (rasterLayers.includes(layerId)) {
      console.log(`ℹ️ LA County Elevation Layer ${layerId} is a raster layer - visualization only, no queryable data`);
      return [];
    }
    
    // All other layers are linear (contours) or point features
    const cappedRadius = Math.min(radius || 25.0, 25.0); // Cap at 25 miles
    
    console.log(`🗺️ Querying LA County Elevation Layer ${layerId} within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 LA County Elevation Layer ${layerId} Proximity Query URL: ${queryUrl.toString()}`);
    
    const data = await fetchJSONSmart(queryUrl.toString());
    
    if (data.error) {
      console.error(`❌ LA County Elevation Layer ${layerId} API Error:`, data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No LA County Elevation Layer ${layerId} features found within the specified radius`);
      return [];
    }
    
    const results: LACountyElevationInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const elevationId = attributes.OBJECTID || 
                         attributes.objectid || 
                         attributes.GlobalID ||
                         attributes.GLOBALID ||
                         attributes.ELEVATION ||
                         attributes.Elevation ||
                         attributes.elevation ||
                         attributes.CONTOUR ||
                         attributes.Contour ||
                         attributes.contour ||
                         null;
      
      // Calculate distance for proximity queries
      let distance_miles = 0;
      
      if (geometry) {
        if (geometry.paths) {
          // Polyline geometry (contours) - calculate distance to nearest point
          const paths = geometry.paths;
          if (paths && paths.length > 0) {
            let minDistance = Infinity;
            paths.forEach((path: number[][]) => {
              path.forEach((coord: number[]) => {
                const coordLat = coord[1];
                const coordLon = coord[0];
                const dist = calculateHaversineDistance(lat, lon, coordLat, coordLon);
                if (dist < minDistance) minDistance = dist;
              });
            });
            distance_miles = minDistance;
          }
        } else if (geometry.x !== undefined && geometry.y !== undefined) {
          // Point geometry - calculate direct distance
          distance_miles = calculateHaversineDistance(lat, lon, geometry.y, geometry.x);
        }
      }
      
      results.push({
        elevationId: elevationId ? elevationId.toString() : null,
        attributes,
        geometry,
        distance_miles
      });
    });
    
    console.log(`✅ Found ${results.length} LA County Elevation Layer ${layerId} feature(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error(`❌ Error querying LA County Elevation Layer ${layerId}:`, error);
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

