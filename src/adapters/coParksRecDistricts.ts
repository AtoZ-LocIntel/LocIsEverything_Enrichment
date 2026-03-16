/**
 * CO Parks & Recreation Districts Adapter
 * Queries Colorado DOLA Parks & Recreation Districts FeatureServer
 * Supports both point-in-polygon (which district contains the point) and
 * proximity queries (districts within a specified radius)
 *
 * Service: https://services3.arcgis.com/DgjqnJA1rgO92Soi/arcgis/rest/services/Parks_and_Recreation_Districts/FeatureServer/0
 */

const BASE_SERVICE_URL =
  'https://services3.arcgis.com/DgjqnJA1rgO92Soi/arcgis/rest/services/Parks_and_Recreation_Districts/FeatureServer';
const LAYER_ID = 0;

export interface COParksRecDistrictData {
  containingDistrict: COParksRecDistrictInfo | null;
  nearbyDistricts: COParksRecDistrictInfo[];
}

export interface COParksRecDistrictInfo {
  districtId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
}

/**
 * Query CO Parks & Recreation Districts FeatureServer for point-in-polygon
 * Returns the district that contains the given point
 */
async function getContainingParksRecDistrict(
  lat: number,
  lon: number
): Promise<COParksRecDistrictInfo | null> {
  try {
    console.log(`🏞️ Querying CO Parks & Recreation Districts for containing district at [${lat}, ${lon}]`);

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
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');

    console.log(`🔗 CO Parks & Recreation Point-in-Polygon Query URL: ${queryUrl.toString()}`);

    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error('❌ CO Parks & Recreation API Error:', data.error);
      return null;
    }

    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CO Parks & Recreation District found containing this location');
      return null;
    }

    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;

    // Extract district identifier - use lgid / lgname / OBJECTID patterns from layer definition
    const districtId =
      attributes.lgid ||
      attributes.LGID ||
      attributes.lgname ||
      attributes.LGNAME ||
      attributes.abbrev_name ||
      attributes.ABBREV_NAME ||
      attributes.OBJECTID ||
      attributes.objectid ||
      `OBJECTID_${attributes.OBJECTID || attributes.objectid || 'Unknown'}`;

    console.log(`✅ Found containing CO Parks & Recreation District: ${districtId}`);

    return {
      districtId,
      attributes,
      geometry,
    };
  } catch (error) {
    console.error('❌ Error querying CO Parks & Recreation Districts for containing district:', error);
    return null;
  }
}

/**
 * Query CO Parks & Recreation Districts FeatureServer for proximity search
 * Returns districts within the specified radius (in miles)
 */
async function getNearbyParksRecDistricts(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<COParksRecDistrictInfo[]> {
  try {
    console.log(`🏞️ Querying CO Parks & Recreation Districts within ${radiusMiles} miles of [${lat}, ${lon}]`);

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
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    queryUrl.searchParams.set('resultRecordCount', '2000');

    console.log(`🔗 CO Parks & Recreation Proximity Query URL: ${queryUrl.toString()}`);

    const response = await fetch(queryUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error('❌ CO Parks & Recreation API Error:', data.error);
      return [];
    }

    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No CO Parks & Recreation Districts found within ${radiusMiles} miles`);
      return [];
    }

    const districts: COParksRecDistrictInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;

      const districtId =
        attributes.lgid ||
        attributes.LGID ||
        attributes.lgname ||
        attributes.LGNAME ||
        attributes.abbrev_name ||
        attributes.ABBREV_NAME ||
        attributes.OBJECTID ||
        attributes.objectid ||
        `OBJECTID_${attributes.OBJECTID || attributes.objectid || 'Unknown'}`;

      return {
        districtId,
        attributes,
        geometry,
      };
    });

    console.log(`✅ Found ${districts.length} nearby CO Parks & Recreation Districts`);
    return districts;
  } catch (error) {
    console.error('❌ Error querying CO Parks & Recreation Districts for nearby districts:', error);
    return [];
  }
}

export async function getCOParksRecDistrictData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<COParksRecDistrictData | null> {
  try {
    const [containingDistrict, nearbyDistricts] = await Promise.all([
      getContainingParksRecDistrict(lat, lon),
      getNearbyParksRecDistricts(lat, lon, radiusMiles),
    ]);

    return {
      containingDistrict,
      nearbyDistricts,
    };
  } catch (error) {
    console.error('❌ Error in getCOParksRecDistrictData:', error);
    return null;
  }
}

