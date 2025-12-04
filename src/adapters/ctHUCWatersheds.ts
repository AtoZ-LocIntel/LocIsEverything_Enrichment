/**
 * CT HUC Watershed Boundaries Adapter
 * Queries Connecticut HUC (Hydrologic Unit Code) Watershed Boundaries
 * from CT Geodata Portal FeatureServer
 * Supports point-in-polygon queries (which watershed contains the point)
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/Watershed_Boundary_Dataset/FeatureServer';
const LAYER_ID = 2;

export interface CTHUCWatershedInfo {
  watershedId: string | null;
  huc8: string | null;
  huc10: string | null;
  huc12: string | null;
  huc10Name: string | null;
  huc12Name: string | null;
  huc10Type: string | null;
  huc12Type: string | null;
  huc10Mod: string | null;
  huc12Mod: string | null;
  acres: number | null;
  states: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
}

/**
 * Query CT HUC Watershed Boundaries FeatureServer for point-in-polygon
 * Returns the watershed that contains the given point
 */
export async function getCTHUCWatershedData(
  lat: number,
  lon: number
): Promise<CTHUCWatershedInfo | null> {
  try {
    console.log(`🌊 Querying CT HUC Watershed Boundaries for containing watershed at [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CT HUC Watershed Boundaries Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT HUC Watershed Boundaries API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CT HUC Watershed found containing this location');
      return null;
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    // Extract watershed information
    const watershedId = attributes.OBJECTID || 
                       attributes.objectid || 
                       attributes.GlobalID ||
                       null;
    
    const huc8 = attributes.HUC_8 || 
                attributes.huc_8 ||
                null;
    
    const huc10 = attributes.HUC_10 || 
                 attributes.huc_10 ||
                 null;
    
    const huc12 = attributes.HUC_12 || 
                 attributes.huc_12 ||
                 null;
    
    const huc10Name = attributes.HU_10_NAME || 
                     attributes.hu_10_name ||
                     null;
    
    const huc12Name = attributes.HU_12_NAME || 
                     attributes.hu_12_name ||
                     null;
    
    const huc10Type = attributes.HU_10_TYPE || 
                     attributes.hu_10_type ||
                     null;
    
    const huc12Type = attributes.HU_12_TYPE || 
                     attributes.hu_12_type ||
                     null;
    
    const huc10Mod = attributes.HU_10_MOD || 
                    attributes.hu_10_mod ||
                    null;
    
    const huc12Mod = attributes.HU_12_MOD || 
                    attributes.hu_12_mod ||
                    null;
    
    const acres = attributes.ACRES !== null && attributes.ACRES !== undefined 
      ? parseFloat(attributes.ACRES.toString()) 
      : null;
    
    const states = attributes.STATES || 
                  attributes.states ||
                  null;
    
    console.log(`✅ Found containing CT HUC Watershed: ${huc12Name || huc10Name || huc12 || huc10 || watershedId}`);
    
    return {
      watershedId: watershedId ? watershedId.toString() : null,
      huc8,
      huc10,
      huc12,
      huc10Name,
      huc12Name,
      huc10Type,
      huc12Type,
      huc10Mod,
      huc12Mod,
      acres,
      states,
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying CT HUC Watershed Boundaries:', error);
    return null;
  }
}

