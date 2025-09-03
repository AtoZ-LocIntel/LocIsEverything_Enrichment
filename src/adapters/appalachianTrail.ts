// Appalachian Trail ArcGIS Service Adapter
// Service URL: https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/ANST_Facilities/FeatureServer

export interface ATFeature {
  attributes: Record<string, any>;
  geometry?: {
    x?: number;
    y?: number;
    paths?: number[][][];
  };
  distance_miles?: number;
}

export interface ATResponse {
  features: ATFeature[];
  geometryType?: string;
  spatialReference?: {
    wkid: number;
  };
}

// Layer mappings for the AT services
export const AT_LAYER_MAPPINGS = {
  // ANST_Facilities service
  'at_bridges': { service: 'facilities', layer: 0 },        // Bridges
  'at_campsites': { service: 'facilities', layer: 1 },      // Campsites
  'at_parking': { service: 'facilities', layer: 2 },        // Parking
  'at_privies': { service: 'facilities', layer: 3 },        // Privies
  'at_shelters': { service: 'facilities', layer: 4 },       // Shelters
  'at_vistas': { service: 'facilities', layer: 5 },         // Vistas
  'at_side_trails': { service: 'facilities', layer: 6 },    // Side Trails
  'at_treadway': { service: 'facilities', layer: 7 },       // A.T. Treadway
  'at_assets_trail': { service: 'facilities', layer: 11 },  // Assets_Trail
  'at_assets_structures': { service: 'facilities', layer: 12 }, // Assets_Structures
  'at_assets_bridges': { service: 'facilities', layer: 13 },    // Assets_Bridges
  
  // ANST_Centerline service
  'at_centerline': { service: 'centerline', layer: 0 }      // Appalachian National Scenic Trail centerline
};

// Base service URLs
const AT_SERVICE_URLS = {
  facilities: 'https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/ANST_Facilities/FeatureServer',
  centerline: 'https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/ANST_Centerline/FeatureServer'
};

/**
 * Query Appalachian Trail features within a specified radius
 */
export async function queryATFeatures(
  layerId: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<ATFeature[]> {
  const layerMapping = AT_LAYER_MAPPINGS[layerId as keyof typeof AT_LAYER_MAPPINGS];
  
  if (layerMapping === undefined) {
    throw new Error(`Unknown AT layer: ${layerId}`);
  }

  const { service, layer } = layerMapping;
  const serviceUrl = AT_SERVICE_URLS[service];
  
  if (!serviceUrl) {
    throw new Error(`Unknown AT service: ${service}`);
  }

  // Convert miles to meters for the query
  const radiusMeters = radiusMiles * 1609.34;
  
  // Create the query URL
  const queryUrl = new URL(`${serviceUrl}/${layer}/query`);
  
  // Set query parameters
  queryUrl.searchParams.set('f', 'json');
  queryUrl.searchParams.set('where', '1=1'); // Get all features
  queryUrl.searchParams.set('outFields', '*'); // Get all fields
  queryUrl.searchParams.set('geometry', `${lon},${lat}`);
  queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
  queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  queryUrl.searchParams.set('distance', radiusMeters.toString());
  queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
  queryUrl.searchParams.set('returnGeometry', 'true');
  queryUrl.searchParams.set('returnDistinctValues', 'false');
  queryUrl.searchParams.set('returnCountOnly', 'false');
  queryUrl.searchParams.set('returnExtentOnly', 'false');
  queryUrl.searchParams.set('returnIdsOnly', 'false');
  queryUrl.searchParams.set('returnZ', 'false');
  queryUrl.searchParams.set('returnM', 'false');
  queryUrl.searchParams.set('inSR', '4326'); // Input spatial reference (WGS84)
  queryUrl.searchParams.set('outSR', '4326'); // Output spatial reference (WGS84)

  try {
    console.log(`🗺️ Querying AT ${service} service layer ${layer} (${layerId}) within ${radiusMiles} miles of ${lat}, ${lon}`);
    console.log(`🔗 Query URL: ${queryUrl.toString()}`);

    const response = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ATResponse = await response.json();
    
    // Check for ArcGIS error responses
    if (data.error) {
      console.error(`❌ ArcGIS Error:`, data.error);
      throw new Error(`ArcGIS Error: ${data.error.message || 'Unknown error'}`);
    }
    
    if (!data.features) {
      console.warn(`⚠️ No features array in response for ${layerId}`);
      return [];
    }

    console.log(`✅ Found ${data.features.length} AT features for ${layerId}`);
    
    // Debug: Log the first feature structure for centerline
    if (layerId === 'at_centerline' && data.features.length > 0) {
      console.log(`🔍 AT Centerline feature structure:`, {
        firstFeature: data.features[0],
        geometryType: data.geometryType,
        spatialReference: data.spatialReference
      });
    }
    
    // Add distance calculation to each feature
    const featuresWithDistance = data.features.map(feature => {
      if (feature.geometry) {
        let distance = 0;
        
        // Handle different geometry types
        if (feature.geometry.x && feature.geometry.y) {
          // Point geometry (facilities)
          distance = calculateDistance(
            lat, lon,
            feature.geometry.y, feature.geometry.x
          );
        } else if (feature.geometry.paths) {
          // Polyline geometry (centerline) - calculate distance to nearest point on line
          distance = calculateDistanceToPolyline(
            lat, lon, feature.geometry.paths
          );
        }
        
        return {
          ...feature,
          distance_miles: distance
        };
      }
      return feature;
    });

    return featuresWithDistance;

  } catch (error) {
    console.error(`❌ Error querying AT layer ${layerId}:`, error);
    throw error;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate distance from a point to the nearest point on a polyline
 */
function calculateDistanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  let minDistance = Infinity;
  
  console.log(`🔍 Calculating distance to polyline with ${paths.length} paths`);
  
  // Iterate through all paths in the polyline
  for (const path of paths) {
    console.log(`🔍 Processing path with ${path.length} points`);
    // Iterate through all segments in the path
    for (let i = 0; i < path.length - 1; i++) {
      const [lon1, lat1] = path[i];
      const [lon2, lat2] = path[i + 1];
      
      // Calculate distance to this line segment
      const distance = calculateDistanceToLineSegment(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, distance);
    }
  }
  
  const finalDistance = minDistance === Infinity ? 0 : minDistance;
  console.log(`🔍 Final polyline distance: ${finalDistance} miles`);
  return finalDistance;
}

/**
 * Calculate distance from a point to a line segment
 */
function calculateDistanceToLineSegment(
  px: number, py: number, 
  x1: number, y1: number, 
  x2: number, y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    // Line segment is actually a point
    return calculateDistance(px, py, x1, y1);
  }
  
  let param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  return calculateDistance(px, py, yy, xx);
}

/**
 * Get all available AT layer information
 */
export function getATLayerInfo() {
  return Object.entries(AT_LAYER_MAPPINGS).map(([layerId, mapping]) => ({
    layerId,
    service: mapping.service,
    layer: mapping.layer,
    name: layerId.replace('at_', '').replace('_', ' ').toUpperCase()
  }));
}
