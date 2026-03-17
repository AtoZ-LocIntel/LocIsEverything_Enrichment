/**
 * CDPHE Health Facilities Adapter
 * Queries CDPHE_Health_Facilities FeatureServer
 * Supports proximity queries (points) up to 100 miles
 *
 * Service: https://services3.arcgis.com/66aUo8zsujfVXRIT/arcgis/rest/services/CDPHE_Health_Facilities/FeatureServer/0
 */

const BASE_SERVICE_URL =
  'https://services3.arcgis.com/66aUo8zsujfVXRIT/arcgis/rest/services/CDPHE_Health_Facilities/FeatureServer';
const LAYER_ID = 0;

export interface COCDPHEHealthFacilityInfo {
  facilityId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number | null;
}

export async function getCOCDPHEHealthFacilityData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<COCDPHEHealthFacilityInfo[]> {
  try {
    const cappedRadius = Math.min(radiusMiles, 100);
    console.log(
      `🏥 Querying CDPHE Health Facilities within ${cappedRadius} miles of [${lat}, ${lon}]`
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
      `🔗 CDPHE Health Facilities Proximity Query URL: ${queryUrl.toString()}`
    );

    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error('❌ CDPHE Health Facilities API Error:', data.error);
      return [];
    }

    if (!data.features || data.features.length === 0) {
      console.log(
        `ℹ️ No CDPHE Health Facilities found within ${cappedRadius} miles`
      );
      return [];
    }

    const facilities: COCDPHEHealthFacilityInfo[] = data.features.map(
      (feature: any) => {
        const attrs = feature.attributes || {};
        const geometry = feature.geometry || null;

        const facilityId =
          attrs.Facility_ID ||
          attrs.facility_id ||
          attrs.OBJECTID ||
          attrs.objectid ||
          attrs.GlobalID ||
          attrs.GlobalId ||
          `OBJECTID_${attrs.OBJECTID || attrs.objectid || 'Unknown'}`;

        return {
          facilityId,
          attributes: attrs,
          geometry,
          distance_miles: null,
        };
      }
    );

    console.log(
      `✅ Found ${facilities.length} nearby CDPHE Health Facility(ies)`
    );
    return facilities;
  } catch (error) {
    console.error('❌ Error querying CDPHE Health Facilities:', error);
    return [];
  }
}
