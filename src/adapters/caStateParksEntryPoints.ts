/**
 * CA State Parks Entry Points Adapter
 * Queries California State Parks Entry Points from CA State Parks FeatureServer
 * Supports proximity queries
 */

const BASE_SERVICE_URL = 'https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/ParkEntryPoints/FeatureServer';
const LAYER_ID = 2;

export interface CAStateParkEntryPointInfo {
  entryPointId: string | null;
  parkUnitName: string | null;
  streetAddress: string | null;
  city: string | null;
  zipCode: string | null;
  phone: string | null;
  website: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA State Parks Entry Points FeatureServer for proximity
 */
export async function getCAStateParksEntryPointsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CAStateParkEntryPointInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log('ℹ️ CA State Parks Entry Points requires a radius for proximity query');
      return [];
    }
    
    console.log(`🏞️ Querying CA State Parks Entry Points within ${radius} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = radius * 1609.34;
    
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
    queryUrl.searchParams.set('distance', radiusMeters.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 CA State Parks Entry Points Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA State Parks Entry Points API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA State Parks Entry Points found within the specified radius');
      return [];
    }
    
    const results: CAStateParkEntryPointInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const entryPointId = attributes.OBJECTID || 
                          attributes.objectid || 
                          attributes.GlobalID ||
                          null;
      
      // Extract park information - field names may vary
      const parkUnitName = attributes.PARK_NAME || 
                          attributes.park_name ||
                          attributes.ParkName ||
                          attributes.Park_Name ||
                          attributes.NAME ||
                          attributes.name ||
                          null;
      
      const streetAddress = attributes.ADDRESS || 
                           attributes.address ||
                           attributes.Address ||
                           attributes.STREET_ADDRESS ||
                           attributes.street_address ||
                           null;
      
      const city = attributes.CITY || 
                  attributes.city ||
                  attributes.City ||
                  null;
      
      const zipCode = attributes.ZIP || 
                     attributes.zip ||
                     attributes.Zip ||
                     attributes.ZIP_CODE ||
                     attributes.zip_code ||
                     null;
      
      const phone = attributes.PHONE || 
                   attributes.phone ||
                   attributes.Phone ||
                   null;
      
      const website = attributes.WEBSITE || 
                     attributes.website ||
                     attributes.Website ||
                     attributes.URL ||
                     attributes.url ||
                     null;
      
      // Calculate distance (approximate for now)
      const distance_miles = radius; // Will be refined if needed
      
      results.push({
        entryPointId: entryPointId ? entryPointId.toString() : null,
        parkUnitName,
        streetAddress,
        city,
        zipCode,
        phone,
        website,
        attributes,
        geometry,
        distance_miles
      });
    });
    
    console.log(`✅ Found ${results.length} CA State Parks Entry Point(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA State Parks Entry Points:', error);
    return [];
  }
}

