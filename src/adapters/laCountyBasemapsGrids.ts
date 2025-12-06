/**
 * LA County Basemaps and Grids Adapter
 * Queries LA County Basemaps and Grids MapServer for multiple grid/boundary layers
 * Supports point-in-polygon queries for polygon layers
 */

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Basemaps_and_Grids/MapServer';

export interface LACountyBasemapGridInfo {
  gridId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  isContaining?: boolean; // For point-in-polygon queries
}

/**
 * Query LA County Basemaps and Grids MapServer for a specific layer
 * Supports point-in-polygon queries for polygon layers
 */
export async function getLACountyBasemapsGridsData(
  layerId: number,
  lat: number,
  lon: number
): Promise<LACountyBasemapGridInfo[]> {
  try {
    console.log(`🗺️ Querying LA County Basemaps and Grids Layer ${layerId} for point-in-polygon at [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 LA County Basemaps and Grids Layer ${layerId} Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const data = await fetchJSONSmart(queryUrl.toString());
    
    if (data.error) {
      console.error(`❌ LA County Basemaps and Grids Layer ${layerId} API Error:`, data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No LA County Basemaps and Grids Layer ${layerId} features found containing the point`);
      return [];
    }
    
    const results: LACountyBasemapGridInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const gridId = attributes.OBJECTID || 
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
          gridId: gridId ? gridId.toString() : null,
          attributes,
          geometry,
          isContaining: true
        });
      }
    });
    
    console.log(`✅ Found ${results.length} LA County Basemaps and Grids Layer ${layerId} feature(s) containing the point`);
    return results;
  } catch (error) {
    console.error(`❌ Error querying LA County Basemaps and Grids Layer ${layerId}:`, error);
    return [];
  }
}

