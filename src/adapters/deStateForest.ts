/**
 * DE State Forest Adapter
 * Queries Delaware State Forest from DE FirstMap FeatureServer
 * Supports both point-in-polygon and proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Biota/DE_Forestry/FeatureServer';
const LAYER_ID = 0;

export interface DEStateForestData {
  containingFeature: DEStateForestInfo | null;
  nearbyFeatures: DEStateForestInfo[];
}

export interface DEStateForestInfo {
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance for proximity queries
}

/**
 * Query DE State Forest for point-in-polygon
 * Returns the feature that contains the given point
 */
async function getContainingFeature(
  lat: number,
  lon: number
): Promise<DEStateForestInfo | null> {
  try {
    console.log(`🌲 Querying DE State Forest for containing feature at [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', `${lon},${lat}`);
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 DE State Forest Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ DE State Forest API Error:', data.error);
      return null;
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No DE State Forest feature found containing this location');
      return null;
    }
    
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    console.log(`✅ Found containing DE State Forest feature`);
    
    return {
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying DE State Forest for containing feature:', error);
    return null;
  }
}

/**
 * Query DE State Forest for proximity search
 * Returns features within the specified radius (in miles)
 */
async function getNearbyFeatures(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DEStateForestInfo[]> {
  try {
    console.log(`🌲 Querying DE State Forest within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = radiusMiles * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', `${lon},${lat}`);
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', radiusMeters.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 DE State Forest Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ DE State Forest API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No DE State Forest features found within ${radiusMiles} miles`);
      return [];
    }
    
    // Calculate distance for each feature
    const features: DEStateForestInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      // Calculate distance to polygon edge (approximate using centroid)
      let distance_miles: number | undefined;
      if (geometry && geometry.rings && geometry.rings.length > 0) {
        // Calculate centroid
        const ring = geometry.rings[0];
        let sumLat = 0, sumLon = 0;
        for (const coord of ring) {
          sumLon += coord[0];
          sumLat += coord[1];
        }
        const centroidLon = sumLon / ring.length;
        const centroidLat = sumLat / ring.length;
        
        // Calculate distance from point to centroid
        distance_miles = calculateDistance(lat, lon, centroidLat, centroidLon);
      }
      
      return {
        attributes,
        geometry,
        distance_miles
      };
    });
    
    // Sort by distance
    features.sort((a, b) => {
      const distA = a.distance_miles ?? Infinity;
      const distB = b.distance_miles ?? Infinity;
      return distA - distB;
    });
    
    console.log(`✅ Found ${features.length} DE State Forest features within ${radiusMiles} miles`);
    
    return features;
  } catch (error) {
    console.error('❌ Error querying DE State Forest for nearby features:', error);
    return [];
  }
}

/**
 * Calculate distance between two lat/lon points in miles
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Main function to get DE State Forest data
 * Supports both point-in-polygon (when radiusMiles is 0) and proximity queries
 */
export async function getDEStateForestData(
  lat: number,
  lon: number,
  radiusMiles: number = 0
): Promise<DEStateForestData> {
  const containingFeature = radiusMiles === 0 
    ? await getContainingFeature(lat, lon)
    : null;
  
  const nearbyFeatures = radiusMiles > 0
    ? await getNearbyFeatures(lat, lon, radiusMiles)
    : [];
  
  return {
    containingFeature,
    nearbyFeatures
  };
}

