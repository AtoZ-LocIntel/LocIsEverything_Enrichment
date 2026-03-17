/**
 * CDPHE Colorado Drug Treatment Program Resources Adapter
 * Queries OPEN_DATA/cdphe_colorado_drug_treatment_program_resources MapServer
 * Supports proximity queries (points) up to 100 miles
 *
 * Service: https://www.cohealthmaps.dphe.state.co.us/arcgis/rest/services/OPEN_DATA/cdphe_colorado_drug_treatment_program_resources/MapServer/0
 */

const BASE_SERVICE_URL =
  'https://www.cohealthmaps.dphe.state.co.us/arcgis/rest/services/OPEN_DATA/cdphe_colorado_drug_treatment_program_resources/MapServer';
const LAYER_ID = 0;

export interface CODrugTreatmentProgramInfo {
  programId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number | null;
}

export async function getCODrugTreatmentProgramData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CODrugTreatmentProgramInfo[]> {
  try {
    const cappedRadius = Math.min(radiusMiles, 100);
    console.log(
      `💊 Querying CO Drug Treatment Programs within ${cappedRadius} miles of [${lat}, ${lon}]`
    );

    const radiusMeters = cappedRadius * 1609.34;

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

    console.log(
      `🔗 CO Drug Treatment Programs Proximity Query URL: ${queryUrl.toString()}`
    );

    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error('❌ CO Drug Treatment Programs API Error:', data.error);
      return [];
    }

    if (!data.features || data.features.length === 0) {
      console.log(
        `ℹ️ No CO Drug Treatment Programs found within ${cappedRadius} miles`
      );
      return [];
    }

    const programs: CODrugTreatmentProgramInfo[] = data.features.map(
      (feature: any) => {
        const attrs = feature.attributes || {};
        const geometry = feature.geometry || null;

        const programId =
          attrs.OBJECTID ||
          attrs.objectid ||
          attrs.GlobalID ||
          attrs.GlobalId ||
          `OBJECTID_${attrs.OBJECTID || attrs.objectid || 'Unknown'}`;

        return {
          programId,
          attributes: attrs,
          geometry,
          distance_miles: null,
        };
      }
    );

    console.log(
      `✅ Found ${programs.length} nearby CO Drug Treatment Program resource(s)`
    );
    return programs;
  } catch (error) {
    console.error('❌ Error querying CO Drug Treatment Programs:', error);
    return [];
  }
}

