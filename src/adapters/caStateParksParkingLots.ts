/**
 * CA State Parks Parking Lots Adapter
 * Queries California State Parks Parking Lots from CA State Parks FeatureServer
 * Supports proximity queries
 */

const BASE_SERVICE_URL = 'https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/ParkingPoints/FeatureServer';
const LAYER_ID = 0;

export interface CAStateParkParkingLotInfo {
  parkingLotId: string | null;
  name: string | null;
  gisId: string | null;
  type: string | null;
  subType: string | null;
  unitNbr: string | null;
  useType: string | null;
  unitName: string | null;
  trailhead: string | null;
  share: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA State Parks Parking Lots FeatureServer for proximity
 */
export async function getCAStateParksParkingLotsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CAStateParkParkingLotInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log('ℹ️ CA State Parks Parking Lots requires a radius for proximity query');
      return [];
    }
    
    console.log(`🅿️ Querying CA State Parks Parking Lots within ${radius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CA State Parks Parking Lots Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA State Parks Parking Lots API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA State Parks Parking Lots found within the specified radius');
      return [];
    }
    
    const results: CAStateParkParkingLotInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const parkingLotId = attributes.FID || 
                          attributes.fid || 
                          attributes.OBJECTID ||
                          attributes.objectid ||
                          attributes.GlobalID ||
                          null;
      
      const name = attributes.NAME || 
                  attributes.name ||
                  attributes.Name ||
                  null;
      
      const gisId = attributes.GISID || 
                   attributes.gisId ||
                   attributes.GisId ||
                   null;
      
      const type = attributes.TYPE || 
                  attributes.type ||
                  attributes.Type ||
                  null;
      
      const subType = attributes.SUBTYPE || 
                     attributes.subType ||
                     attributes.SubType ||
                     null;
      
      const unitNbr = attributes.UNITNBR || 
                     attributes.unitNbr ||
                     attributes.UnitNbr ||
                     null;
      
      const useType = attributes.USETYPE || 
                     attributes.useType ||
                     attributes.UseType ||
                     null;
      
      const unitName = attributes.UNITNAME || 
                      attributes.unitName ||
                      attributes.UnitName ||
                      null;
      
      const trailhead = attributes.TRAILHEAD || 
                       attributes.trailhead ||
                       attributes.Trailhead ||
                       null;
      
      const share = attributes.SHARE || 
                   attributes.share ||
                   attributes.Share ||
                   null;
      
      // Calculate distance (approximate for now)
      const distance_miles = radius; // Will be refined if needed
      
      results.push({
        parkingLotId: parkingLotId ? parkingLotId.toString() : null,
        name,
        gisId,
        type,
        subType,
        unitNbr,
        useType,
        unitName,
        trailhead,
        share,
        attributes,
        geometry,
        distance_miles
      });
    });
    
    console.log(`✅ Found ${results.length} CA State Parks Parking Lot(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA State Parks Parking Lots:', error);
    return [];
  }
}

