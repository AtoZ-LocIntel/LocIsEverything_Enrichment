/**
 * CO Tennis Courts Adapter
 * Queries Colorado Statewide Tennis Courts FeatureServer
 * Supports proximity queries (polygons) up to 50 miles
 *
 * Service: https://services3.arcgis.com/DgjqnJA1rgO92Soi/arcgis/rest/services/_State_of_Colorado_Tennis_Courts/FeatureServer/2
 */

const BASE_SERVICE_URL =
  'https://services3.arcgis.com/DgjqnJA1rgO92Soi/arcgis/rest/services/_State_of_Colorado_Tennis_Courts/FeatureServer';
const LAYER_ID = 2;

export interface COTennisCourtInfo {
  courtId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number | null;
}

export async function getCOTennisCourtData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<COTennisCourtInfo[]> {
  try {
    console.log(`🎾 Querying CO Tennis Courts within ${radiusMiles} miles of [${lat}, ${lon}]`);

    const radiusMeters = radiusMiles * 1609.34;

    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    const pointGeometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 },
    };

    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', JSON.stringify(pointGeometry));
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', radiusMeters.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    queryUrl.searchParams.set('resultRecordCount', '2000');

    console.log(`🔗 CO Tennis Courts Proximity Query URL: ${queryUrl.toString()}`);

    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error('❌ CO Tennis Courts API Error:', data.error);
      return [];
    }

    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No CO Tennis Courts found within ${radiusMiles} miles`);
      return [];
    }

    const courts: COTennisCourtInfo[] = data.features.map((feature: any) => {
      const attrs = feature.attributes || {};
      const geometry = feature.geometry || null;

      const courtId =
        attrs.OBJECTID ||
        attrs.objectid ||
        attrs.GlobalID ||
        attrs.GlobalId ||
        `OBJECTID_${attrs.OBJECTID || attrs.objectid || 'Unknown'}`;

      return {
        courtId,
        attributes: attrs,
        geometry,
        distance_miles: null,
      };
    });

    console.log(`✅ Found ${courts.length} nearby CO Tennis Courts`);
    return courts;
  } catch (error) {
    console.error('❌ Error querying CO Tennis Courts:', error);
    return [];
  }
}

