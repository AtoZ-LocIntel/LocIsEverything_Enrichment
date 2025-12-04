/**
 * CA Land Ownership Adapter
 * Queries California Land Ownership from CAL FIRE FRAP FeatureServer
 * Supports point-in-polygon queries only (which ownership polygon contains the point)
 */

const BASE_SERVICE_URL = 'https://egis.fire.ca.gov/arcgis/rest/services/FRAP/ownership/FeatureServer';
const LAYER_ID = 0;

export interface CALandOwnershipInfo {
  ownershipId: string | null;
  ownLevel: string | null;
  ownAgency: string | null;
  ownGroup: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
}

/**
 * Query CA Land Ownership FeatureServer for point-in-polygon
 * Returns the ownership polygon that contains the given point
 */
export async function getCALandOwnershipData(
  lat: number,
  lon: number
): Promise<CALandOwnershipInfo | null> {
  try {
    console.log(`🏛️ Querying CA Land Ownership for containing ownership polygon at [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CA Land Ownership Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA Land Ownership API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA Land Ownership polygon found containing this location');
      return null;
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    // Extract ownership information
    const ownershipId = attributes.OBJECTID || 
                       attributes.objectid || 
                       attributes.GlobalID ||
                       null;
    
    const ownLevel = attributes.OWN_LEVEL || 
                    attributes.own_level ||
                    attributes.Own_Level ||
                    null;
    
    const ownAgency = attributes.OWN_AGENCY || 
                     attributes.own_agency ||
                     attributes.Own_Agency ||
                     null;
    
    const ownGroup = attributes.OWN_GROUP || 
                    attributes.own_group ||
                    attributes.Own_Group ||
                    null;
    
    console.log(`✅ Found containing CA Land Ownership: ${ownGroup || ownAgency || ownLevel || ownershipId}`);
    
    return {
      ownershipId: ownershipId ? ownershipId.toString() : null,
      ownLevel,
      ownAgency,
      ownGroup,
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying CA Land Ownership:', error);
    return null;
  }
}

