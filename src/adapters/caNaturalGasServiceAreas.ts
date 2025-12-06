/**
 * CA Natural Gas Service Areas Adapter
 * Queries California Natural Gas Service Areas (polygonal feature service)
 * Supports point-in-polygon queries
 */

const BASE_SERVICE_URL = 'https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Natural_Gas_Service_Area/FeatureServer';
const LAYER_ID = 0;

export interface CANaturalGasServiceAreaInfo {
  serviceAreaId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  isContaining?: boolean; // For point-in-polygon queries
}

/**
 * Query CA Natural Gas Service Areas FeatureServer for point-in-polygon
 */
export async function getCANaturalGasServiceAreasData(
  lat: number,
  lon: number
): Promise<CANaturalGasServiceAreaInfo[]> {
  try {
    console.log(`⛽ Querying CA Natural Gas Service Areas for point-in-polygon at [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CA Natural Gas Service Areas Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA Natural Gas Service Areas API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA Natural Gas Service Areas found containing the point');
      return [];
    }
    
    const results: CANaturalGasServiceAreaInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const serviceAreaId = attributes.OBJECTID || 
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
      
      // Only include service areas that contain the point
      if (isContaining) {
        results.push({
          serviceAreaId: serviceAreaId ? serviceAreaId.toString() : null,
          attributes,
          geometry,
          isContaining: true
        });
      }
    });
    
    console.log(`✅ Found ${results.length} CA Natural Gas Service Area(s) containing the point`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA Natural Gas Service Areas:', error);
    return [];
  }
}

