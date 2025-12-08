/**
 * LA County Political Boundaries Adapter
 * Queries LA County Political Boundaries MapServer for various political boundary data
 * All layers are polygon layers - point-in-polygon queries only
 */

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer';

export interface LACountyPoliticalBoundariesInfo {
  boundaryId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  isContaining?: boolean; // For point-in-polygon queries
}

/**
 * Query LA County Political Boundaries MapServer for a specific layer
 * All layers are polygon layers - point-in-polygon queries only
 */
export async function getLACountyPoliticalBoundariesData(
  layerId: number,
  lat: number,
  lon: number
): Promise<LACountyPoliticalBoundariesInfo[]> {
  try {
    const results: LACountyPoliticalBoundariesInfo[] = [];
    
    // All Political Boundaries layers are polygon layers - only perform point-in-polygon queries
    console.log(`🗺️ Querying LA County Political Boundaries Layer ${layerId} for point-in-polygon at [${lat}, ${lon}]`);
    
    const pointInPolyUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
    pointInPolyUrl.searchParams.set('f', 'json');
    pointInPolyUrl.searchParams.set('where', '1=1');
    pointInPolyUrl.searchParams.set('outFields', '*');
    pointInPolyUrl.searchParams.set('geometry', JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }));
    pointInPolyUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    pointInPolyUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    pointInPolyUrl.searchParams.set('inSR', '4326');
    pointInPolyUrl.searchParams.set('outSR', '4326');
    pointInPolyUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 LA County Political Boundaries Layer ${layerId} Point-in-Polygon Query URL: ${pointInPolyUrl.toString()}`);
    
    try {
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl.toString());
      
      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const boundaryId = attributes.OBJECTID || 
                            attributes.objectid || 
                            attributes.GlobalID ||
                            attributes.GLOBALID ||
                            attributes.ID ||
                            attributes.id ||
                            attributes.NAME ||
                            attributes.Name ||
                            attributes.name ||
                            attributes.DISTRICT ||
                            attributes.district ||
                            attributes.DISTRICT_NUM ||
                            attributes.district_num ||
                            attributes.DISTRICT_NUMBER ||
                            attributes.district_number ||
                            null;
          
          // Verify point-in-polygon with ray casting
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
          
          // Only include if it's actually containing the point
          if (isContaining) {
            results.push({
              boundaryId: boundaryId ? boundaryId.toString() : null,
              attributes,
              geometry,
              isContaining: true
            });
          }
        });
        
        console.log(`✅ Found ${results.length} LA County Political Boundaries Layer ${layerId} feature(s) containing the point`);
      } else {
        console.log(`ℹ️ No LA County Political Boundaries Layer ${layerId} features found containing the point`);
      }
    } catch (error) {
      console.error(`❌ Point-in-polygon query failed for layer ${layerId}:`, error);
    }
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying LA County Political Boundaries Layer ${layerId}:`, error);
    return [];
  }
}

