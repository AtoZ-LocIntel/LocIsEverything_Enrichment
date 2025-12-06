/**
 * CA Public Land Survey Sections (PLSS) Adapter
 * Queries California PLSS Sections (polygonal feature service)
 * Supports point-in-polygon queries to extract Township and Range values
 */

const BASE_SERVICE_URL = 'https://gis.conservation.ca.gov/server/rest/services/Base/Base_PLSS/MapServer';
const LAYER_ID = 1;

export interface CAPLSSSectionInfo {
  sectionId: string | null;
  township: string | null;
  range: string | null;
  section: string | null;
  meridian: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  isContaining?: boolean; // For point-in-polygon queries
}

/**
 * Query CA PLSS Sections MapServer for point-in-polygon
 */
export async function getCAPLSSSectionsData(
  lat: number,
  lon: number
): Promise<CAPLSSSectionInfo[]> {
  try {
    console.log(`🗺️ Querying CA PLSS Sections for point-in-polygon at [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
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
    
    console.log(`🔗 CA PLSS Sections Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA PLSS Sections API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA PLSS Sections found containing the point');
      return [];
    }
    
    const results: CAPLSSSectionInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const sectionId = attributes.OBJECTID || 
                       attributes.objectid || 
                       attributes.GlobalID ||
                       attributes.GLOBALID ||
                       null;
      
      // Extract Township and Range values (common field names)
      const township = attributes.TOWNSHIP || 
                      attributes.Township ||
                      attributes.township ||
                      attributes.TWP ||
                      attributes.Twp ||
                      attributes.twp ||
                      attributes.TWNSHP ||
                      attributes.Twnshp ||
                      null;
      
      const range = attributes.RANGE || 
                   attributes.Range ||
                   attributes.range ||
                   attributes.RNG ||
                   attributes.Rng ||
                   attributes.rng ||
                   attributes.RGE ||
                   attributes.Rge ||
                   null;
      
      const section = attributes.SECTION || 
                     attributes.Section ||
                     attributes.section ||
                     attributes.SEC ||
                     attributes.Sec ||
                     attributes.sec ||
                     attributes.SECT ||
                     attributes.Sect ||
                     null;
      
      const meridian = attributes.MERIDIAN || 
                      attributes.Meridian ||
                      attributes.meridian ||
                      attributes.MER ||
                      attributes.Mer ||
                      attributes.mer ||
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
      
      // Only include sections that contain the point
      if (isContaining) {
        results.push({
          sectionId: sectionId ? sectionId.toString() : null,
          township: township ? township.toString() : null,
          range: range ? range.toString() : null,
          section: section ? section.toString() : null,
          meridian: meridian ? meridian.toString() : null,
          attributes,
          geometry,
          isContaining: true
        });
      }
    });
    
    console.log(`✅ Found ${results.length} CA PLSS Section(s) containing the point`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA PLSS Sections:', error);
    return [];
  }
}

