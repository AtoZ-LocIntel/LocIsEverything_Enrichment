/**
 * NH Source Water Protection Areas Adapter
 * Queries New Hampshire Source Water Protection Areas from DES FeatureServer
 * Supports point-in-polygon queries to find which protection area contains a point
 * This is a polygon dataset
 */

const BASE_SERVICE_URL = 'https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Secure/MapServer';
const LAYER_ID = 4;

export interface NHSourceWaterProtectionArea {
  system_id: string | null;
  allid: string | null;
  name: string | null;
  address: string | null;
  town: string | null;
  system_act: string | null;
  system_typ: string | null;
  system_cat: string | null;
  population: number | null;
  dwpa_type: string | null;
  dwpa_rad: number | null;
  attributes: Record<string, any>;
  geometry: any; // ESRI polygon geometry for drawing on map
}

/**
 * Query NH Source Water Protection Areas FeatureServer for point-in-polygon search
 * Returns the protection area that contains the specified point
 */
export async function getNHSourceWaterProtectionAreaData(
  lat: number,
  lon: number
): Promise<NHSourceWaterProtectionArea | null> {
  try {
    console.log(`💧 Querying NH Source Water Protection Areas for point [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 NH Source Water Protection Areas Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ NH Source Water Protection Areas API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Source Water Protection Area found containing point [${lat}, ${lon}]`);
      return null;
    }
    
    // Use the first feature (point-in-polygon should return at most one result)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || {};
    
    // Extract system ID
    const systemId = attributes.system_id || 
                    attributes.SYSTEM_ID || 
                    attributes.SystemId ||
                    attributes._system_id ||
                    attributes.id ||
                    attributes.ID ||
                    null;
    
    // Extract ALLID
    const allid = attributes.allid || 
                 attributes.ALLID || 
                 attributes.AllId ||
                 attributes._allid ||
                 null;
    
    // Extract name
    const name = attributes.name || 
                attributes.NAME || 
                attributes.Name ||
                attributes._name ||
                null;
    
    // Extract address
    const address = attributes.address || 
                   attributes.ADDRESS || 
                   attributes.Address ||
                   attributes._address ||
                   attributes.street ||
                   attributes.STREET ||
                   null;
    
    // Extract town
    const town = attributes.town || 
                attributes.TOWN || 
                attributes.Town ||
                attributes._town ||
                attributes.city ||
                attributes.CITY ||
                attributes.City ||
                attributes.municipality ||
                attributes.MUNICIPALITY ||
                null;
    
    // Extract system activity
    const systemAct = attributes.system_act || 
                     attributes.SYSTEM_ACT || 
                     attributes.SystemAct ||
                     attributes._system_act ||
                     null;
    
    // Extract system type
    const systemTyp = attributes.system_typ || 
                     attributes.SYSTEM_TYP || 
                     attributes.SystemTyp ||
                     attributes._system_typ ||
                     null;
    
    // Extract system category
    const systemCat = attributes.system_cat || 
                     attributes.SYSTEM_CAT || 
                     attributes.SystemCat ||
                     attributes._system_cat ||
                     null;
    
    // Extract population
    const population = attributes.population || 
                      attributes.POPULATION || 
                      attributes.Population ||
                      attributes._population ||
                      null;
    
    // Extract DWPA type
    const dwpaType = attributes.dwpa_type || 
                    attributes.DWPA_TYPE || 
                    attributes.DwpaType ||
                    attributes._dwpa_type ||
                    null;
    
    // Extract DWPA radius
    const dwpaRad = attributes.dwpa_rad || 
                   attributes.DWPA_RAD || 
                   attributes.DwpaRad ||
                   attributes._dwpa_rad ||
                   null;
    
    return {
      system_id: systemId ? String(systemId) : null,
      allid: allid ? String(allid) : null,
      name,
      address,
      town,
      system_act: systemAct,
      system_typ: systemTyp,
      system_cat: systemCat,
      population: population !== null && population !== undefined ? Number(population) : null,
      dwpa_type: dwpaType,
      dwpa_rad: dwpaRad !== null && dwpaRad !== undefined && dwpaRad !== -9999 ? Number(dwpaRad) : null,
      attributes,
      geometry // Include geometry for map drawing
    };
  } catch (error) {
    console.error('❌ Error querying NH Source Water Protection Areas:', error);
    return null;
  }
}

