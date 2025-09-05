// Pacific Crest Trail (PCT) ArcGIS FeatureServer adapter
// Handles queries to PCT-related ArcGIS services

export interface PCTFeature {
  attributes: Record<string, any>;
  geometry?: {
    x?: number;
    y?: number;
    paths?: number[][][]; // For polyline geometry
  };
  distance_miles?: number;
}

export interface PCTResponse {
  features: PCTFeature[];
  geometryType?: string;
  spatialReference?: {
    wkid: number;
  };
  error?: {
    message?: string;
  };
}

// PCT Layer mappings for different services
const PCT_LAYER_MAPPINGS: Record<string, number> = {
  centerline: 0,
  sheriff_offices: 0,
  side_trails: 0,
  mile_markers_2024: 0,
  tenth_mile_markers_2024: 0,
  resupply_towns: 0
};

// Base service URLs
const PCT_SERVICE_URLS: Record<string, string> = {
  centerline: 'https://services5.arcgis.com/ZldHa25efPFpMmfB/ArcGIS/rest/services/PCT_Centerline/FeatureServer',
  sheriff_offices: 'https://services5.arcgis.com/ZldHa25efPFpMmfB/ArcGIS/rest/services/PCT_Sheriffs_Offices/FeatureServer',
  side_trails: 'https://services5.arcgis.com/ZldHa25efPFpMmfB/ArcGIS/rest/services/PCT_Side_Trails/FeatureServer',
  mile_markers_2024: 'https://services5.arcgis.com/ZldHa25efPFpMmfB/ArcGIS/rest/services/PCTA_Mile_Markers_2024/FeatureServer',
  tenth_mile_markers_2024: 'https://services5.arcgis.com/ZldHa25efPFpMmfB/ArcGIS/rest/services/PCTA_Tenthmile_Markers_2024/FeatureServer',
  resupply_towns: 'https://services5.arcgis.com/ZldHa25efPFpMmfB/ArcGIS/rest/services/Trail_Town_Resupply_Public/FeatureServer'
};

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate distance from a point to a polyline
 */
function calculateDistanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  let minDistance = Infinity;
  
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const [lon1, lat1] = path[i];
      const [lon2, lat2] = path[i + 1];
      const distance = calculateDistanceToLineSegment(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, distance);
    }
  }
  
  return minDistance;
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
  
  return calculateDistance(px, py, xx, yy);
}

/**
 * Query PCT features from ArcGIS FeatureServer
 */
export async function queryPCTFeatures(
  layerType: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<PCTResponse> {
  try {
    const serviceUrl = PCT_SERVICE_URLS[layerType];
    const layerId = PCT_LAYER_MAPPINGS[layerType];
    
    if (!serviceUrl) {
      throw new Error(`Unknown PCT layer type: ${layerType}`);
    }
    
    const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
    
    // Build the query URL
    const queryUrl = new URL(`${serviceUrl}/${layerId}/query`);
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
    
    console.log(`🗺️ Querying PCT ${layerType} service layer ${layerId} within ${radiusMiles} miles of ${lat}, ${lon}`);
    console.log(`🔗 Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: PCTResponse = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Unknown error from PCT service');
    }
    
    // Debug: Log the response structure
    console.log(`🔍 PCT ${layerType} response:`, {
      featureCount: data.features?.length || 0,
      geometryType: data.geometryType,
      spatialReference: data.spatialReference
    });
    
    // Calculate distances for each feature
    if (data.features) {
      data.features.forEach(feature => {
        if (feature.geometry) {
          if (feature.geometry.x && feature.geometry.y) {
            // Point geometry
            feature.distance_miles = calculateDistance(
              lat, lon,
              feature.geometry.y, feature.geometry.x
            );
          } else if (feature.geometry.paths && feature.geometry.paths.length > 0) {
            // Polyline geometry
            feature.distance_miles = calculateDistanceToPolyline(
              lat, lon, feature.geometry.paths
            );
          }
        }
      });
      
      // Sort by distance
      data.features.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    }
    
    console.log(`🗺️ PCT ${layerType} found ${data.features?.length || 0} features`);
    return data;
    
  } catch (error) {
    console.error(`PCT ${layerType} query failed:`, error);
    return {
      features: [],
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get information about all configured PCT layers
 */
export function getPCTLayerInfo(): Array<{id: string, name: string, description: string}> {
  return [
    { id: 'centerline', name: 'PCT Centerline', description: 'Pacific Crest Trail main centerline' },
    { id: 'sheriff_offices', name: 'PCT Sheriff Offices', description: 'Sheriff offices along the PCT' },
    { id: 'side_trails', name: 'PCT Side Trails', description: 'Side trails and connecting routes' },
    { id: 'mile_markers_2024', name: 'PCT 2024 Mile Markers', description: 'Mile markers for 2024' },
    { id: 'tenth_mile_markers_2024', name: 'PCT 2025 Tenth/Mile Markers', description: 'Tenth-mile markers for 2024' },
    { id: 'resupply_towns', name: 'PCT Resupply Towns', description: 'Resupply towns and services' }
  ];
}
