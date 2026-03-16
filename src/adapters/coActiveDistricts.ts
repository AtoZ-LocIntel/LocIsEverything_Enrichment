/**
 * CO Active Districts Adapter
 * Queries Colorado DOLA Active Districts from Colorado Spatial Portal FeatureServer
 * Supports both point-in-polygon (which district contains the point) and
 * proximity queries (districts within a specified radius)
 */

const BASE_SERVICE_URL = 'https://services3.arcgis.com/DgjqnJA1rgO92Soi/arcgis/rest/services/All_Active_DOLA_Districts_-_private_staging_area_view/FeatureServer';
const LAYER_ID = 0;

export interface COActiveDistrictData {
  containingDistrict: COActiveDistrictInfo | null;
  nearbyDistricts: COActiveDistrictInfo[];
}

export interface COActiveDistrictInfo {
  districtId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
}

/**
 * Query CO Active Districts FeatureServer for point-in-polygon
 * Returns the district that contains the given point
 */
async function getContainingDistrict(
  lat: number,
  lon: number
): Promise<COActiveDistrictInfo | null> {
  try {
    console.log(`🏛️ Querying CO Active Districts for containing district at [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for point-in-polygon
    // Use JSON geometry format and esriSpatialRelWithin for FeatureServer (more reliable for point-in-polygon)
    const pointGeometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', JSON.stringify(pointGeometry));
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects'); // Use Intersects (same as CO Parcels - proven to work)
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true'); // Return geometry for map drawing
    
    console.log(`🔗 CO Active Districts Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CO Active Districts API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CO Active District found containing this location');
      return null;
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    console.log(`🔍 CO Active Districts: Feature attributes keys:`, Object.keys(attributes));
    console.log(`🔍 CO Active Districts: Sample attributes:`, {
      lgid: attributes.lgid,
      LGID: attributes.LGID,
      lgname: attributes.lgname,
      LGNAME: attributes.LGNAME,
      OBJECTID: attributes.OBJECTID,
      objectid: attributes.objectid
    });
    
    // Extract district identifier - try common field names, use OBJECTID as fallback
    const districtId = attributes.lgid || 
                     attributes.LGID || 
                     attributes.lgname ||
                     attributes.LGNAME ||
                     attributes.OBJECTID ||
                     attributes.objectid ||
                     attributes.OBJECTID_1 ||
                     attributes.name ||
                     `OBJECTID_${attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || 'Unknown'}`;
    
    console.log(`✅ Found containing CO Active District: ${districtId}`);
    console.log(`✅ District has geometry:`, !!geometry);
    
    // Always return an object if we have a feature, even if districtId is 'Unknown'
    return {
      districtId,
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying CO Active Districts for containing district:', error);
    return null;
  }
}

/**
 * Query CO Active Districts FeatureServer for proximity search
 * Returns districts within the specified radius (in miles)
 */
async function getNearbyDistricts(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<COActiveDistrictInfo[]> {
  try {
    console.log(`🏛️ Querying CO Active Districts within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    // Convert miles to meters for the buffer distance
    const radiusMeters = radiusMiles * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for proximity search
    // Use JSON geometry format for consistency
    const pointGeometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
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
    queryUrl.searchParams.set('returnGeometry', 'true'); // Return geometry for map drawing
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    queryUrl.searchParams.set('resultRecordCount', '2000'); // Service supports up to 2000 records
    
    console.log(`🔗 CO Active Districts Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CO Active Districts API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No CO Active Districts found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const districts: COActiveDistrictInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      // Extract district identifier - try common field names, use OBJECTID as fallback
      const districtId = attributes.lgid || 
                       attributes.LGID || 
                       attributes.lgname ||
                       attributes.LGNAME ||
                       attributes.OBJECTID ||
                       attributes.objectid ||
                       attributes.OBJECTID_1 ||
                       attributes.name ||
                       `OBJECTID_${attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || 'Unknown'}`;
      
      return {
        districtId,
        attributes,
        geometry
      };
    });
    
    console.log(`✅ Found ${districts.length} nearby CO Active Districts`);
    
    return districts;
  } catch (error) {
    console.error('❌ Error querying CO Active Districts for nearby districts:', error);
    return [];
  }
}

/**
 * Main function to get both containing district and nearby districts
 */
export async function getCOActiveDistrictData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<COActiveDistrictData | null> {
  try {
    // Get containing district (point-in-polygon)
    const containingDistrict = await getContainingDistrict(lat, lon);
    
    // Get nearby districts (proximity search)
    const nearbyDistricts = await getNearbyDistricts(lat, lon, radiusMiles);
    
    return {
      containingDistrict,
      nearbyDistricts
    };
  } catch (error) {
    console.error('❌ Error fetching CO Active District data:', error);
    return null;
  }
}
