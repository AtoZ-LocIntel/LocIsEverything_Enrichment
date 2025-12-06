/**
 * LA County School District Boundaries Adapter
 * Queries LA County School District Boundaries (polygonal feature service)
 * Supports point-in-polygon queries only
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/School_District/FeatureServer';
const LAYER_ID = 0;

export interface LACountySchoolDistrictBoundaryInfo {
  districtId: string | null;
  districtName: string | null;
  districtCode: string | null;
  districtType: string | null;
  shapeArea: number | null;
  shapeLength: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  isContaining?: boolean; // For point-in-polygon queries
}

/**
 * Query LA County School District Boundaries FeatureServer for point-in-polygon
 */
export async function getLACountySchoolDistrictBoundariesData(
  lat: number,
  lon: number
): Promise<LACountySchoolDistrictBoundaryInfo[]> {
  try {
    console.log(`🏫 Querying LA County School District Boundaries for point-in-polygon at [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 LA County School District Boundaries Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ LA County School District Boundaries API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No LA County School District Boundaries found containing the point');
      return [];
    }
    
    const results: LACountySchoolDistrictBoundaryInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const districtId = attributes.OBJECTID || 
                         attributes.objectid || 
                         attributes.GlobalID ||
                         attributes.GLOBALID ||
                         null;
      
      // Extract district information (actual field names from the service)
      const districtName = attributes.LABEL || 
                          attributes.label ||
                          attributes.Label ||
                          null;
      
      const districtCode = attributes.ABBR || 
                           attributes.abbr ||
                           attributes.Abbr ||
                           null;
      
      const districtType = attributes.DISTRICT_TYPE || 
                          attributes.district_type ||
                          attributes.DistrictType ||
                          null;
      
      const shapeArea = attributes.Shape__Area !== null && attributes.Shape__Area !== undefined 
                       ? parseFloat(attributes.Shape__Area.toString())
                       : (attributes.shape_area !== null && attributes.shape_area !== undefined
                          ? parseFloat(attributes.shape_area.toString())
                          : null);
      
      const shapeLength = attributes.Shape__Length !== null && attributes.Shape__Length !== undefined 
                         ? parseFloat(attributes.Shape__Length.toString())
                         : (attributes.shape_length !== null && attributes.shape_length !== undefined
                            ? parseFloat(attributes.shape_length.toString())
                            : null);
      
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
      
      // Only include districts that contain the point
      if (isContaining) {
        results.push({
          districtId: districtId ? districtId.toString() : null,
          districtName,
          districtCode,
          districtType,
          shapeArea,
          shapeLength,
          attributes,
          geometry,
          isContaining: true
        });
      }
    });
    
    console.log(`✅ Found ${results.length} LA County School District Boundary(ies) containing the point`);
    return results;
  } catch (error) {
    console.error('❌ Error querying LA County School District Boundaries:', error);
    return [];
  }
}

