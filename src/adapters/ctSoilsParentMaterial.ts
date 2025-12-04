/**
 * CT Soils Parent Material Name Adapter
 * Queries Connecticut Soils Parent Material Name from CT Geodata Portal FeatureServer
 * Supports point-in-polygon queries (which soil polygon contains the point)
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/Soils_Parent_Material_Name/FeatureServer';
const LAYER_ID = 1;

export interface CTSoilsParentMaterialInfo {
  soilId: string | null;
  areaSymbol: string | null;
  musym: string | null;
  mukey: string | null;
  parentMaterialName: string | null;
  spatialVersion: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
}

/**
 * Query CT Soils Parent Material Name FeatureServer for point-in-polygon
 * Returns the soil polygon that contains the given point
 */
export async function getCTSoilsParentMaterialData(
  lat: number,
  lon: number
): Promise<CTSoilsParentMaterialInfo | null> {
  try {
    console.log(`🌱 Querying CT Soils Parent Material Name for containing soil polygon at [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for point-in-polygon
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
    queryUrl.searchParams.set('returnGeometry', 'true'); // Return geometry for map drawing
    
    console.log(`🔗 CT Soils Parent Material Name Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT Soils Parent Material Name API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CT Soils Parent Material Name polygon found containing this location');
      return null;
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    // Extract soil information
    const soilId = attributes.OBJECTID || 
                  attributes.objectid || 
                  attributes.GlobalID ||
                  null;
    
    const areaSymbol = attributes.AREASYMBOL || 
                      attributes.areasymbol ||
                      null;
    
    const musym = attributes.MUSYM || 
                 attributes.musym ||
                 null;
    
    const mukey = attributes.MUKEY || 
                 attributes.mukey ||
                 null;
    
    const parentMaterialName = attributes.ParMatNm || 
                               attributes.parmatnm ||
                               attributes.ParentMaterialName ||
                               null;
    
    const spatialVersion = attributes.SPATIALVER !== null && attributes.SPATIALVER !== undefined 
      ? parseInt(attributes.SPATIALVER.toString()) 
      : (attributes.spatialver !== null && attributes.spatialver !== undefined 
        ? parseInt(attributes.spatialver.toString()) 
        : null);
    
    console.log(`✅ Found containing CT Soils Parent Material: ${parentMaterialName || mukey || soilId}`);
    
    return {
      soilId: soilId ? soilId.toString() : null,
      areaSymbol,
      musym,
      mukey: mukey ? mukey.toString() : null,
      parentMaterialName,
      spatialVersion,
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying CT Soils Parent Material Name:', error);
    return null;
  }
}

