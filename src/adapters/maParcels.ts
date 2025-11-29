/**
 * MA Parcels Adapter
 * Queries Massachusetts Property Tax Parcels from MassGIS FeatureServer
 * Supports both point-in-polygon (which parcel contains the point) and
 * proximity queries (parcels within a specified radius)
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/hGdibHYSPO59RG1h/ArcGIS/rest/services/L3_TAXPAR_POLY_ASSESS_gdb/FeatureServer';
const LAYER_ID = 0;

export interface MAParcelData {
  containingParcel: MAParcelInfo | null;
  nearbyParcels: MAParcelInfo[];
}

export interface MAParcelInfo {
  parcelId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
}

/**
 * Query MA Parcels FeatureServer for point-in-polygon
 * Returns the parcel that contains the given point
 */
async function getContainingParcel(
  lat: number,
  lon: number
): Promise<MAParcelInfo | null> {
  try {
    console.log(`🏠 Querying MA Parcels for containing parcel at [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for point-in-polygon
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
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true'); // Return geometry for map drawing
    
    console.log(`🔗 MA Parcels Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ MA Parcels API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No MA Parcel found containing this location');
      return null;
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    // Extract parcel identifier - try common field names for MA parcels
    const parcelId = attributes.MAP_PAR_ID || 
                     attributes.map_par_id || 
                     attributes.MAP_PARID ||
                     attributes.PROP_ID ||
                     attributes.prop_id ||
                     attributes.OBJECTID ||
                     attributes.objectid ||
                     attributes.LOC_ID ||
                     attributes.loc_id ||
                     null;
    
    console.log(`✅ Found containing MA Parcel: ${parcelId}`);
    
    return {
      parcelId,
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying MA Parcels for containing parcel:', error);
    return null;
  }
}

/**
 * Query MA Parcels FeatureServer for proximity search
 * Returns parcels within the specified radius (in miles)
 */
async function getNearbyParcels(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<MAParcelInfo[]> {
  try {
    console.log(`🏠 Querying MA Parcels within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    // Convert miles to meters for the buffer distance
    const radiusMeters = radiusMiles * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for proximity search
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
    queryUrl.searchParams.set('returnGeometry', 'true'); // Return geometry for map drawing
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    
    console.log(`🔗 MA Parcels Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ MA Parcels API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No MA Parcels found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const parcels: MAParcelInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      // Extract parcel identifier - try common field names for MA parcels
      const parcelId = attributes.MAP_PAR_ID || 
                       attributes.map_par_id || 
                       attributes.MAP_PARID ||
                       attributes.PROP_ID ||
                       attributes.prop_id ||
                       attributes.OBJECTID ||
                       attributes.objectid ||
                       attributes.LOC_ID ||
                       attributes.loc_id ||
                       null;
      
      return {
        parcelId,
        attributes,
        geometry
      };
    });
    
    console.log(`✅ Found ${parcels.length} nearby MA Parcels`);
    
    return parcels;
  } catch (error) {
    console.error('❌ Error querying MA Parcels for nearby parcels:', error);
    return [];
  }
}

/**
 * Main function to get both containing parcel and nearby parcels
 */
export async function getMAParcelData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<MAParcelData | null> {
  try {
    // Get containing parcel (point-in-polygon)
    const containingParcel = await getContainingParcel(lat, lon);
    
    // Get nearby parcels (proximity search)
    const nearbyParcels = await getNearbyParcels(lat, lon, radiusMiles);
    
    return {
      containingParcel,
      nearbyParcels
    };
  } catch (error) {
    console.error('❌ Error fetching MA Parcel data:', error);
    return null;
  }
}

