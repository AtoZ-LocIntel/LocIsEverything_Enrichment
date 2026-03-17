/**
 * SAMHSA Colorado Substance Abuse and Mental Health Service Providers Adapter
 * Queries CDPHE SAMHSA MapServer
 * Supports proximity queries (points) up to 100 miles
 *
 * Service: https://www.cohealthmaps.dphe.state.co.us/arcgis/rest/services/OPEN_DATA/cdphe_samsha_colorado_substance_abuse_mental_health_service_providers/MapServer/0
 */

const BASE_SERVICE_URL =
  'https://www.cohealthmaps.dphe.state.co.us/arcgis/rest/services/OPEN_DATA/cdphe_samsha_colorado_substance_abuse_mental_health_service_providers/MapServer';
const LAYER_ID = 0;

export interface COSAMHSAServiceProviderInfo {
  providerId: string | null;
  attributes: Record<string, any>;
  geometry?: any;
  distance_miles?: number | null;
}

export async function getCOSAMHSAServiceProviderData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<COSAMHSAServiceProviderInfo[]> {
  try {
    const cappedRadius = Math.min(radiusMiles, 100);
    console.log(
      `🧠 Querying SAMHSA Service Providers within ${cappedRadius} miles of [${lat}, ${lon}]`
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
      `🔗 SAMHSA Service Providers Proximity Query URL: ${queryUrl.toString()}`
    );

    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error('❌ SAMHSA Service Providers API Error:', data.error);
      return [];
    }

    if (!data.features || data.features.length === 0) {
      console.log(
        `ℹ️ No SAMHSA Service Providers found within ${cappedRadius} miles`
      );
      return [];
    }

    const providers: COSAMHSAServiceProviderInfo[] = data.features.map(
      (feature: any) => {
        const attrs = feature.attributes || {};
        const geometry = feature.geometry || null;

        const providerId =
          attrs.OBJECTID ||
          attrs.objectid ||
          attrs.GlobalID ||
          attrs.GlobalId ||
          attrs.Provider_Name ||
          attrs.provider_name ||
          `OBJECTID_${attrs.OBJECTID || attrs.objectid || 'Unknown'}`;

        return {
          providerId,
          attributes: attrs,
          geometry,
          distance_miles: null,
        };
      }
    );

    console.log(
      `✅ Found ${providers.length} nearby SAMHSA Service Provider(s)`
    );
    return providers;
  } catch (error) {
    console.error('❌ Error querying SAMHSA Service Providers:', error);
    return [];
  }
}
