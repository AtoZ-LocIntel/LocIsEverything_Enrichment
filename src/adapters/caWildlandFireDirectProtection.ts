/**
 * CA Wildland Fire Direct Protection Areas Adapter
 * Queries California Wildland Fire Direct Protection Areas from USFS FeatureServer
 * Supports point-in-polygon queries only (which protection area contains the point)
 */

const BASE_SERVICE_URL = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/CA_WF_Direct_Protection_Areas_Public/FeatureServer';
const LAYER_ID = 0;

export interface CAWildlandFireDirectProtectionInfo {
  protectionAreaId: string | null;
  dpaAgency: string | null;
  dpaGroup: string | null;
  respondId: string | null;
  nwcgUnitId: string | null;
  agreements: string | null;
  costAppor: string | null;
  comments: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
}

/**
 * Query CA Wildland Fire Direct Protection Areas FeatureServer for point-in-polygon
 * Returns the protection area that contains the given point
 */
export async function getCAWildlandFireDirectProtectionData(
  lat: number,
  lon: number
): Promise<CAWildlandFireDirectProtectionInfo | null> {
  try {
    console.log(`🔥 Querying CA Wildland Fire Direct Protection Areas for containing protection area at [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CA Wildland Fire Direct Protection Areas Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA Wildland Fire Direct Protection Areas API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA Wildland Fire Direct Protection Area found containing this location');
      return null;
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    // Extract protection area information
    const protectionAreaId = attributes.OBJECTID || 
                            attributes.objectid || 
                            attributes.GlobalID ||
                            null;
    
    const dpaAgency = attributes.DPA_AGENCY || 
                     attributes.dpa_agency ||
                     attributes.Dpa_Agency ||
                     null;
    
    const dpaGroup = attributes.DPA_GROUP || 
                    attributes.dpa_group ||
                    attributes.Dpa_Group ||
                    null;
    
    const respondId = attributes.RESPOND_ID || 
                     attributes.respond_id ||
                     attributes.Respond_Id ||
                     null;
    
    const nwcgUnitId = attributes.NWCG_UNITID || 
                      attributes.nwcg_unitid ||
                      attributes.Nwcg_Unitid ||
                      null;
    
    const agreements = attributes.AGREEMENTS || 
                      attributes.agreements ||
                      attributes.Agreements ||
                      null;
    
    const costAppor = attributes.COST_APPOR || 
                     attributes.cost_appor ||
                     attributes.Cost_Appor ||
                     null;
    
    const comments = attributes.COMMENTS || 
                    attributes.comments ||
                    attributes.Comments ||
                    null;
    
    console.log(`✅ Found containing CA Wildland Fire Direct Protection Area: ${dpaAgency || dpaGroup || protectionAreaId}`);
    
    return {
      protectionAreaId: protectionAreaId ? protectionAreaId.toString() : null,
      dpaAgency,
      dpaGroup,
      respondId,
      nwcgUnitId,
      agreements,
      costAppor,
      comments,
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying CA Wildland Fire Direct Protection Areas:', error);
    return null;
  }
}

