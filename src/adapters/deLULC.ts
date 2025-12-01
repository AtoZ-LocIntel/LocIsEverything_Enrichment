/**
 * DE Land Use Land Cover Adapter
 * Queries Delaware LULC layers from DE FirstMap FeatureServer
 * Supports point-in-polygon queries for multiple years: 2007, 2007 Revised, 2012, 2017, 2022
 */

const BASE_SERVICE_URL = 'https://enterprise.firstmap.delaware.gov/arcgis/rest/services/PlanningCadastre/DE_LULC/FeatureServer';

export interface DELULCInfo {
  lulcCode: number | null;
  lulcCategory: string | null;
  attributes: Record<string, any>;
  geometry?: any;
}

/**
 * Query DE LULC FeatureServer for point-in-polygon
 * Returns the LULC polygon that contains the given point
 */
export async function getDELULCData(
  lat: number,
  lon: number,
  layerId: number,
  year: string
): Promise<DELULCInfo | null> {
  try {
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
    
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', `${lon},${lat}`);
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    const response = await fetch(queryUrl.toString());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    if (data.error || !data.features || data.features.length === 0) return null;
    
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    // Extract LULC code and category based on year
    let lulcCode: number | null = null;
    let lulcCategory: string | null = null;
    
    if (year === '2007' || year === '2007_revised') {
      lulcCode = attributes.LULC_CODE2007 || attributes.lulc_code2007 || null;
      lulcCategory = attributes.LULC_CATEGORY2007 || attributes.lulc_category2007 || null;
    } else if (year === '2012') {
      lulcCode = attributes.LULC_CODE2012 || attributes.lulc_code2012 || null;
      lulcCategory = attributes.LULC_CATEGORY2012 || attributes.lulc_category2012 || null;
    } else if (year === '2017') {
      lulcCode = attributes.LULC_CODE2017 || attributes.lulc_code2017 || null;
      lulcCategory = attributes.LULC_CATEGORY2017 || attributes.lulc_category2017 || null;
    } else if (year === '2022') {
      lulcCode = attributes.LULC_CODE2022 || attributes.lulc_code2022 || null;
      lulcCategory = attributes.LULC_CATEGORY2022 || attributes.lulc_category2022 || null;
    }
    
    return {
      lulcCode,
      lulcCategory,
      attributes,
      geometry
    };
  } catch (error) {
    console.error(`❌ Error querying DE LULC ${year}:`, error);
    return null;
  }
}

