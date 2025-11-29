/**
 * CT Building Footprints Adapter
 * Queries Connecticut 2D Building Footprints from CT Geodata Portal FeatureServer
 * Supports both point-in-polygon (which building contains the point) and
 * proximity queries (buildings within a specified radius)
 */

const BASE_SERVICE_URL = 'https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/arcgis/rest/services/2D_Building_Footprints/FeatureServer';
const LAYER_ID = 0;

export interface CTBuildingFootprintData {
  containingBuilding: CTBuildingFootprintInfo | null;
  nearbyBuildings: CTBuildingFootprintInfo[];
}

export interface CTBuildingFootprintInfo {
  buildingId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
}

/**
 * Query CT Building Footprints FeatureServer for point-in-polygon
 * Returns the building that contains the given point
 */
async function getContainingBuilding(
  lat: number,
  lon: number
): Promise<CTBuildingFootprintInfo | null> {
  try {
    console.log(`🏢 Querying CT Building Footprints for containing building at [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CT Building Footprints Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT Building Footprints API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CT Building Footprint found containing this location');
      return null;
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    // Extract building identifier - try common field names
    const buildingId = attributes.OBJECTID || 
                     attributes.objectid || 
                     attributes.OBJECTID_1 ||
                     attributes.objectId ||
                     attributes.BUILDING_ID ||
                     attributes.building_id ||
                     null;
    
    console.log(`✅ Found containing CT Building Footprint: ${buildingId}`);
    
    return {
      buildingId,
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying CT Building Footprints for containing building:', error);
    return null;
  }
}

/**
 * Query CT Building Footprints FeatureServer for proximity search
 * Returns buildings within the specified radius (in miles)
 */
async function getNearbyBuildings(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTBuildingFootprintInfo[]> {
  try {
    console.log(`🏢 Querying CT Building Footprints within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CT Building Footprints Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT Building Footprints API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No CT Building Footprints found within ${radiusMiles} miles`);
      return [];
    }
    
    // Process all features
    const buildings: CTBuildingFootprintInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      // Extract building identifier - try common field names
      const buildingId = attributes.OBJECTID || 
                       attributes.objectid || 
                       attributes.OBJECTID_1 ||
                       attributes.objectId ||
                       attributes.BUILDING_ID ||
                       attributes.building_id ||
                       null;
      
      return {
        buildingId,
        attributes,
        geometry
      };
    });
    
    console.log(`✅ Found ${buildings.length} nearby CT Building Footprints`);
    
    return buildings;
  } catch (error) {
    console.error('❌ Error querying CT Building Footprints for nearby buildings:', error);
    return [];
  }
}

/**
 * Main function to get both containing building and nearby buildings
 */
export async function getCTBuildingFootprintData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTBuildingFootprintData | null> {
  try {
    // Get containing building (point-in-polygon)
    const containingBuilding = await getContainingBuilding(lat, lon);
    
    // Get nearby buildings (proximity search)
    const nearbyBuildings = await getNearbyBuildings(lat, lon, radiusMiles);
    
    return {
      containingBuilding,
      nearbyBuildings
    };
  } catch (error) {
    console.error('❌ Error fetching CT Building Footprint data:', error);
    return null;
  }
}

