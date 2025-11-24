/**
 * NH National Wetland Inventory (NWI) Plus Adapter
 * Queries New Hampshire NWI Plus from DES FeatureServer
 * Supports both point-in-polygon queries (containing wetland) and proximity queries (nearby wetlands)
 * This is a polygon dataset
 */

const BASE_SERVICE_URL = 'https://gis.des.nh.gov/server/rest/services/Hosted/NWIplus/FeatureServer';
const LAYER_ID = 0;

export interface NHNWIPlus {
  wetland_id: string | null;
  wetland_type: string | null;
  wetland_class: string | null;
  attributes: Record<string, any>;
  geometry: any; // ESRI polygon geometry for drawing on map
  distance_miles?: number; // Distance from query point (for proximity queries)
}

/**
 * Query NH NWI Plus FeatureServer for point-in-polygon search
 * Returns the wetland that contains the specified point
 */
export async function getNHNWIPlusContainingData(
  lat: number,
  lon: number
): Promise<NHNWIPlus | null> {
  try {
    console.log(`🌊 Querying NH NWI Plus for point [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for point-in-polygon search
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', `${lon},${lat}`);
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true'); // Return geometry for map drawing
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    
    console.log(`🔗 NH NWI Plus Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH NWI Plus API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH NWI Plus wetland found containing point [${lat}, ${lon}]`);
      return null;
    }
    
    // Use the first feature (point-in-polygon should return at most one result)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || {};
    
    // Log all available attributes for debugging
    console.log('🌊 NH NWI Plus attributes:', attributes);
    console.log('🌊 NH NWI Plus attribute keys:', Object.keys(attributes));
    console.log('🌊 NH NWI Plus geometry:', geometry ? 'present' : 'missing', geometry?.rings ? `(${geometry.rings.length} rings)` : '');
    
    // Extract wetland ID - try all possible field name variations
    // Use OBJECTID or FID as fallback since they're standard ESRI fields
    const wetlandId = attributes.wetland_id || 
                     attributes.WETLAND_ID || 
                     attributes.WetlandId ||
                     attributes._wetland_id ||
                     attributes.id ||
                     attributes.ID ||
                     attributes.objectid ||
                     attributes.OBJECTID ||
                     attributes.ObjectId ||
                     attributes.FID ||
                     attributes.fid ||
                     (attributes.OBJECTID !== undefined ? String(attributes.OBJECTID) : null) ||
                     (attributes.objectid !== undefined ? String(attributes.objectid) : null) ||
                     (attributes.FID !== undefined ? String(attributes.FID) : null) ||
                     (attributes.fid !== undefined ? String(attributes.fid) : null) ||
                     null;
    
    // Extract wetland type
    const wetlandType = attributes.wetland_type || 
                       attributes.WETLAND_TYPE || 
                       attributes.WetlandType ||
                       attributes._wetland_type ||
                       attributes.type ||
                       attributes.TYPE ||
                       attributes.Type ||
                       attributes.ATTRIBUTE ||
                       attributes.attribute ||
                       null;
    
    // Extract wetland class
    const wetlandClass = attributes.wetland_class || 
                        attributes.WETLAND_CLASS || 
                        attributes.WetlandClass ||
                        attributes._wetland_class ||
                        attributes.class ||
                        attributes.CLASS ||
                        attributes.Class ||
                        attributes.WETLAND_CODE ||
                        attributes.wetland_code ||
                        null;
    
    return {
      wetland_id: wetlandId ? String(wetlandId) : null,
      wetland_type: wetlandType,
      wetland_class: wetlandClass,
      attributes,
      geometry // Include geometry for map drawing
    };
  } catch (error) {
    console.error('❌ Error querying NH NWI Plus (containing):', error);
    return null;
  }
}

/**
 * Query NH NWI Plus FeatureServer for proximity search
 * Returns all wetlands within the specified radius (in miles)
 */
export async function getNHNWIPlusNearbyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHNWIPlus[]> {
  try {
    console.log(`🌊 Querying NH NWI Plus for wetlands near [${lat}, ${lon}] within ${radiusMiles} miles`);
    
    // Convert radius from miles to meters for the query
    const radiusMeters = radiusMiles * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for proximity search
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', `${lon},${lat}`);
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', radiusMeters.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true'); // Return geometry for map drawing
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    
    console.log(`🔗 NH NWI Plus Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH NWI Plus Proximity API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH NWI Plus wetlands found within ${radiusMiles} miles of [${lat}, ${lon}]`);
      return [];
    }
    
    // Log first feature for debugging
    if (data.features && data.features.length > 0) {
      console.log('🌊 NH NWI Plus first feature attributes:', data.features[0].attributes);
      console.log('🌊 NH NWI Plus first feature attribute keys:', Object.keys(data.features[0].attributes || {}));
      console.log('🌊 NH NWI Plus first feature geometry:', data.features[0].geometry ? 'present' : 'missing', data.features[0].geometry?.rings ? `(${data.features[0].geometry.rings.length} rings)` : '');
    }
    
    // Calculate distance for each wetland using Haversine formula
    const wetlands: NHNWIPlus[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract wetland ID - try all possible field name variations
      // Use OBJECTID or FID as fallback since they're standard ESRI fields
      const wetlandId = attributes.wetland_id || 
                       attributes.WETLAND_ID || 
                       attributes.WetlandId ||
                       attributes._wetland_id ||
                       attributes.id ||
                       attributes.ID ||
                       attributes.objectid ||
                       attributes.OBJECTID ||
                       attributes.ObjectId ||
                       attributes.FID ||
                       attributes.fid ||
                       (attributes.OBJECTID !== undefined ? String(attributes.OBJECTID) : null) ||
                       (attributes.objectid !== undefined ? String(attributes.objectid) : null) ||
                       (attributes.FID !== undefined ? String(attributes.FID) : null) ||
                       (attributes.fid !== undefined ? String(attributes.fid) : null) ||
                       null;
      
      // Extract wetland type
      const wetlandType = attributes.wetland_type || 
                         attributes.WETLAND_TYPE || 
                         attributes.WetlandType ||
                         attributes._wetland_type ||
                         attributes.type ||
                         attributes.TYPE ||
                         attributes.Type ||
                         attributes.ATTRIBUTE ||
                         attributes.attribute ||
                         null;
      
      // Extract wetland class
      const wetlandClass = attributes.wetland_class || 
                          attributes.WETLAND_CLASS || 
                          attributes.WetlandClass ||
                          attributes._wetland_class ||
                          attributes.class ||
                          attributes.CLASS ||
                          attributes.Class ||
                          attributes.WETLAND_CODE ||
                          attributes.wetland_code ||
                          null;
      
      // Calculate distance from query point to wetland centroid
      // For polygons, we'll use the first coordinate of the first ring as an approximation
      let distanceMiles = null;
      if (geometry.rings && geometry.rings.length > 0 && geometry.rings[0].length > 0) {
        const firstCoord = geometry.rings[0][0];
        const wetlandLon = firstCoord[0];
        const wetlandLat = firstCoord[1];
        
        // Haversine formula to calculate distance
        const R = 3958.8; // Earth radius in miles
        const dLat = (wetlandLat - lat) * Math.PI / 180;
        const dLon = (wetlandLon - lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(wetlandLat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceMiles = R * c;
      }
      
      return {
        wetland_id: wetlandId ? String(wetlandId) : null,
        wetland_type: wetlandType,
        wetland_class: wetlandClass,
        attributes,
        geometry, // Include geometry for map drawing
        distance_miles: distanceMiles !== null ? Number(distanceMiles.toFixed(2)) : null
      };
    });
    
    // Sort by distance (closest first)
    wetlands.sort((a, b) => {
      if (a.distance_miles === null) return 1;
      if (b.distance_miles === null) return -1;
      return a.distance_miles - b.distance_miles;
    });
    
    console.log(`✅ Found ${wetlands.length} NH NWI Plus wetlands within ${radiusMiles} miles`);
    
    return wetlands;
  } catch (error) {
    console.error('❌ Error querying NH NWI Plus (proximity):', error);
    return [];
  }
}

