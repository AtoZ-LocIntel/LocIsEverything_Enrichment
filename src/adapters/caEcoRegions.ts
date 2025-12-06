/**
 * CA Eco Regions Adapter
 * Queries California USDA Ecoregion Sections (polygonal feature service)
 * Supports point-in-polygon queries
 */

const BASE_SERVICE_URL = 'https://services8.arcgis.com/JFYbogndXme7ddg8/arcgis/rest/services/USDA_Ecoregion_Sections_07_3__California/FeatureServer';
const LAYER_ID = 0;

export interface CAEcoRegionInfo {
  regionId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  isContaining?: boolean; // For point-in-polygon queries
}

/**
 * Query CA Eco Regions FeatureServer for point-in-polygon
 */
export async function getCAEcoRegionsData(
  lat: number,
  lon: number
): Promise<CAEcoRegionInfo[]> {
  try {
    console.log(`🌿 Querying CA Eco Regions for point-in-polygon at [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CA Eco Regions Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA Eco Regions API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA Eco Regions found containing the point');
      return [];
    }
    
    const results: CAEcoRegionInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const regionId = attributes.OBJECTID || 
                      attributes.objectid || 
                      attributes.GlobalID ||
                      attributes.GLOBALID ||
                      attributes.US_L3CODE ||
                      attributes.us_l3code ||
                      attributes.US_L3NAME ||
                      attributes.us_l3name ||
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
      
      // Only include regions that contain the point
      if (isContaining) {
        results.push({
          regionId: regionId ? regionId.toString() : null,
          attributes,
          geometry,
          isContaining: true
        });
      }
    });
    
    console.log(`✅ Found ${results.length} CA Eco Region(s) containing the point`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA Eco Regions:', error);
    return [];
  }
}

