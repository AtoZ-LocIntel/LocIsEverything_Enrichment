/**
 * Colorado Shelters and Warming Locations Adapter
 * Queries Colorado_Shelters_and_Warming_Locations FeatureServer
 * Supports proximity queries (points) up to 100 miles
 *
 * Service: https://services3.arcgis.com/DgjqnJA1rgO92Soi/arcgis/rest/services/Colorado_Shelters_and_Warming_Locations/FeatureServer/0
 */

const BASE_SERVICE_URL =
  'https://services3.arcgis.com/DgjqnJA1rgO92Soi/arcgis/rest/services/Colorado_Shelters_and_Warming_Locations/FeatureServer';
const LAYER_ID = 0;

export interface COShelterWarmingInfo {
  shelterId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number | null;
}

export async function getCOSheltersWarmingData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<COShelterWarmingInfo[]> {
  try {
    const cappedRadius = Math.min(radiusMiles, 100);
    console.log(
      `🏠 Querying CO Shelters & Warming Locations within ${cappedRadius} miles of [${lat}, ${lon}]`
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

    console.log(`🔗 CO Shelters & Warming Locations Proximity Query URL: ${queryUrl.toString()}`);

    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error('❌ CO Shelters & Warming Locations API Error:', data.error);
      return [];
    }

    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No CO Shelters & Warming Locations found within ${cappedRadius} miles`);
      return [];
    }

    const shelters: COShelterWarmingInfo[] = data.features.map((feature: any) => {
      const attrs = feature.attributes || {};
      const geometry = feature.geometry || null;

      const shelterId =
        attrs.OBJECTID ||
        attrs.objectid ||
        attrs.GlobalID ||
        attrs.GlobalId ||
        `OBJECTID_${attrs.OBJECTID || attrs.objectid || 'Unknown'}`;

      return {
        shelterId,
        attributes: attrs,
        geometry,
        distance_miles: null,
      };
    });

    console.log(`✅ Found ${shelters.length} nearby CO Shelters & Warming Locations`);
    return shelters;
  } catch (error) {
    console.error('❌ Error querying CO Shelters & Warming Locations:', error);
    return [];
  }
}

