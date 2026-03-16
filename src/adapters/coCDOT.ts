/**
 * Adapter for Colorado Department of Transportation (CDOT) Open Data Feature Service
 * Service URL: https://dtdapps.coloradodot.info/arcgis/rest/services/CPLAN/open_data_sde/FeatureServer
 * 
 * Supports point-in-polygon queries for polygon layers and proximity queries for all layers
 */

/**
 * Convert layer name to POI config ID
 */
export function layerNameToId(layerName: string): string {
  return layerName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/'/g, '') // Remove apostrophes
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/-/g, '_')
    .replace(/:/g, '_')
    .replace(/&/g, 'and');
}

const BASE_SERVICE_URL = 'https://dtdapps.coloradodot.info/arcgis/rest/services/CPLAN/open_data_sde/FeatureServer';

export interface CDOTFeature {
  objectId: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number | null; // Distance from query point (0 if inside polygon, null if not calculated)
  isContaining?: boolean; // True if point is within polygon
  layerId: number; // Which layer this feature came from
  layerName: string; // Human-readable layer name
}

/**
 * Layer geometry types based on layer names and IDs
 * Polygon layers: Districts, Regions, Boundaries, Parcels, Areas, Wetlands, Urban Areas, Categories
 * Line layers: Roads, Highways, Frontage Roads, Ramps, Scenic Byways, Projects (Line)
 * Point layers: Bridges, Culverts, Interchanges, Milepoints, Projects (Point), Structures, Tunnels, Outdoor Advertising, Noise Barriers, Seed Mixes
 */
const POLYGON_LAYER_IDS = [
  2,  // Commission Districts
  3,  // Engineering Regions
  9,  // Highways: Access Categories
  10, // Highways: Drivability Life
  11, // Highways: Functional Class
  12, // Highways: Geometrics
  13, // Highways: Traffic Counts
  15, // Maintenance Patrols
  16, // Maintenance Sections
  18, // Metropolitan Planning Orgs (MPO)
  20, // MS4 - Aug 2015 to Current
  26, // Project Wetlands
  27, // Potential Fen Wetlands
  32, // Transportation Planning Regions (TPR)
  34, // Urban Areas - Adjusted 2020
  36, // CDOT ROW Boundaries
  37, // CDOT Parcels
  38, // Maintenance Regions
  39, // Maintenance Supervisor Areas
  40  // Highways: Alias
];

// Reserved for future use - line and point layer IDs
// const LINE_LAYER_IDS = [
//   4,  // Frontage Roads
//   6,  // Highways (generalized)
//   7,  // Highways
//   14, // Local Roads
//   17, // Major Roads
//   24, // Projects (all types) - Line
//   28, // Ramps
//   29  // Scenic Byways
// ];

// const POINT_LAYER_IDS = [
//   0,  // Bridges and Major Culverts
//   1,  // CDOT ROW Project Archive (could be polygon, but treating as point for now)
//   8,  // Highway Interchanges
//   19, // Milepoints
//   23, // Outdoor Advertising
//   25, // Projects (all types) - Point
//   30, // Seed Mixes
//   31, // Structures (all types)
//   33  // Tunnels
// ];

// Point-in-polygon function removed - we rely on server-side spatial queries from ArcGIS

/**
 * Calculate haversine distance between two points in miles
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
 * Calculate centroid of polygon rings
 */
function calculateCentroid(rings: number[][][]): { lat: number; lon: number } | null {
  if (!rings || rings.length === 0) return null;
  
  const outerRing = rings[0];
  if (!outerRing || outerRing.length < 3) return null;
  
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  
  for (const point of outerRing) {
    if (point && point.length >= 2) {
      sumLon += point[0]; // x/lon
      sumLat += point[1]; // y/lat
      count++;
    }
  }
  
  if (count === 0) return null;
  
  return {
    lat: sumLat / count,
    lon: sumLon / count
  };
}

/**
 * Calculate centroid of line/polyline
 */
function calculateLineCentroid(paths: number[][][]): { lat: number; lon: number } | null {
  if (!paths || paths.length === 0) return null;
  
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  
  for (const path of paths) {
    for (const point of path) {
      if (point && point.length >= 2) {
        sumLon += point[0]; // x/lon
        sumLat += point[1]; // y/lat
        count++;
      }
    }
  }
  
  if (count === 0) return null;
  
  return {
    lat: sumLat / count,
    lon: sumLon / count
  };
}

/**
 * Query CDOT layer for features
 * Supports point-in-polygon for polygon layers and proximity queries for all layers
 */
export async function getCDOTLayerData(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CDOTFeature[]> {
  try {
    console.log(`🚧 Querying CDOT Layer ${layerId} (${layerName}) at [${lat}, ${lon}] with radius ${radiusMiles} miles`);
    
    const isPolygonLayer = POLYGON_LAYER_IDS.includes(layerId);
    // const isLineLayer = LINE_LAYER_IDS.includes(layerId); // Reserved for future use
    // const isPointLayer = POINT_LAYER_IDS.includes(layerId); // Reserved for future use
    
    const results: CDOTFeature[] = [];
    const processedFeatureIds = new Set<string>();
    
    // For polygon layers, try point-in-polygon query first
    if (isPolygonLayer) {
      console.log(`🗺️ Querying CDOT Layer ${layerId} for point-in-polygon`);
      
      const pointInPolyUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
      pointInPolyUrl.searchParams.set('f', 'json');
      pointInPolyUrl.searchParams.set('where', '1=1');
      pointInPolyUrl.searchParams.set('outFields', '*');
      pointInPolyUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      pointInPolyUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      pointInPolyUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      pointInPolyUrl.searchParams.set('inSR', '4326');
      pointInPolyUrl.searchParams.set('outSR', '4326');
      pointInPolyUrl.searchParams.set('returnGeometry', 'true');
      
      try {
        const pointInPolyResponse = await fetch(pointInPolyUrl.toString());
        if (!pointInPolyResponse.ok) {
          throw new Error(`HTTP error! status: ${pointInPolyResponse.status}`);
        }
        
        const pointInPolyData = await pointInPolyResponse.json();
        
        if (pointInPolyData.error) {
          console.error(`❌ CDOT Layer ${layerId} Point-in-Polygon API Error:`, pointInPolyData.error);
        } else if (pointInPolyData.features && pointInPolyData.features.length > 0) {
          for (const feature of pointInPolyData.features) {
            const objectId = feature.attributes.OBJECTID || feature.attributes.objectid || feature.attributes.FID || feature.attributes.fid || `feature_${results.length}`;
            const featureKey = `${layerId}_${objectId}`;
            
            if (!processedFeatureIds.has(featureKey)) {
              processedFeatureIds.add(featureKey);
              
              results.push({
                objectId: objectId,
                attributes: feature.attributes || {},
                geometry: feature.geometry || null,
                distance_miles: 0,
                isContaining: true,
                layerId: layerId,
                layerName: layerName
              });
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error querying CDOT Layer ${layerId} for point-in-polygon:`, error);
      }
    }
    
    // For all layers, do proximity query if radius > 0
    if (radiusMiles > 0) {
      console.log(`🔍 Querying CDOT Layer ${layerId} for proximity (${radiusMiles} miles)`);
      
      // Convert radius from miles to meters (service uses meters)
      const radiusMeters = radiusMiles * 1609.34;
      
      const proximityUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
      proximityUrl.searchParams.set('f', 'json');
      proximityUrl.searchParams.set('where', '1=1');
      proximityUrl.searchParams.set('outFields', '*');
      proximityUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      proximityUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      proximityUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      proximityUrl.searchParams.set('inSR', '4326');
      proximityUrl.searchParams.set('outSR', '4326');
      proximityUrl.searchParams.set('returnGeometry', 'true');
      proximityUrl.searchParams.set('distance', radiusMeters.toString());
      proximityUrl.searchParams.set('units', 'esriSRUnit_Meter');
      
      try {
        const proximityResponse = await fetch(proximityUrl.toString());
        if (!proximityResponse.ok) {
          throw new Error(`HTTP error! status: ${proximityResponse.status}`);
        }
        
        const proximityData = await proximityResponse.json();
        
        if (proximityData.error) {
          console.error(`❌ CDOT Layer ${layerId} Proximity API Error:`, proximityData.error);
        } else if (proximityData.features && proximityData.features.length > 0) {
          for (const feature of proximityData.features) {
            const objectId = feature.attributes.OBJECTID || feature.attributes.objectid || feature.attributes.FID || feature.attributes.fid || `feature_${results.length}`;
            const featureKey = `${layerId}_${objectId}`;
            
            // Skip if already added as containing feature
            if (processedFeatureIds.has(featureKey)) {
              continue;
            }
            
            processedFeatureIds.add(featureKey);
            
            // Calculate distance based on geometry type
            let distance_miles: number | null = null;
            
            if (feature.geometry) {
              if (feature.geometry.rings && feature.geometry.rings.length > 0) {
                // Polygon - calculate distance to centroid
                const centroid = calculateCentroid(feature.geometry.rings);
                if (centroid) {
                  distance_miles = calculateDistance(lat, lon, centroid.lat, centroid.lon);
                }
              } else if (feature.geometry.paths && feature.geometry.paths.length > 0) {
                // Line - calculate distance to centroid
                const centroid = calculateLineCentroid(feature.geometry.paths);
                if (centroid) {
                  distance_miles = calculateDistance(lat, lon, centroid.lat, centroid.lon);
                }
              } else if (feature.geometry.x !== undefined && feature.geometry.y !== undefined) {
                // Point
                distance_miles = calculateDistance(lat, lon, feature.geometry.y, feature.geometry.x);
              }
            }
            
            // Filter by radius if distance calculated
            if (distance_miles !== null && distance_miles > radiusMiles) {
              continue;
            }
            
            results.push({
              objectId: objectId,
              attributes: feature.attributes || {},
              geometry: feature.geometry || null,
              distance_miles: distance_miles ?? undefined,
              isContaining: false,
              layerId: layerId,
              layerName: layerName
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error querying CDOT Layer ${layerId} for proximity:`, error);
      }
    }
    
    console.log(`✅ CDOT Layer ${layerId} query returned ${results.length} features`);
    return results;
  } catch (error) {
    console.error(`❌ Error querying CDOT Layer ${layerId}:`, error);
    return [];
  }
}

/**
 * Mapping of layer IDs to human-readable names
 */
export const CDOT_LAYER_NAMES: Record<number, string> = {
  0: "Bridges and Major Culverts",
  1: "CDOT ROW Project Archive",
  2: "Commission Districts",
  3: "Engineering Regions",
  4: "Frontage Roads",
  6: "Highways (generalized)",
  7: "Highways",
  8: "Highway Interchanges",
  9: "Highways: Access Categories",
  10: "Highways: Drivability Life",
  11: "Highways: Functional Class",
  12: "Highways: Geometrics",
  13: "Highways: Traffic Counts",
  14: "Local Roads",
  15: "Maintenance Patrols",
  16: "Maintenance Sections",
  17: "Major Roads",
  18: "Metropolitan Planning Orgs (MPO)",
  19: "Milepoints",
  20: "MS4 - Aug 2015 to Current",
  23: "Outdoor Advertising",
  24: "Projects (all types) - Line",
  25: "Projects (all types) - Point",
  26: "Project Wetlands",
  27: "Potential Fen Wetlands",
  28: "Ramps",
  29: "Scenic Byways",
  30: "Seed Mixes",
  31: "Structures (all types)",
  32: "Transportation Planning Regions (TPR)",
  33: "Tunnels",
  34: "Urban Areas - Adjusted 2020",
  35: "Noise Barriers",
  36: "CDOT ROW Boundaries",
  37: "CDOT Parcels",
  38: "Maintenance Regions",
  39: "Maintenance Supervisor Areas",
  40: "Highways: Alias"
};
