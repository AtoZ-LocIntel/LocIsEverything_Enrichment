/**
 * Boston Open Data Adapter
 * Service: https://gisportal.boston.gov/arcgis/rest/services/CityServices/OpenData/MapServer
 * Supports proximity queries up to 25 miles for point features
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL_CHARGING = 'https://gisportal.boston.gov/arcgis/rest/services/CityServices/OpenData/MapServer';
const BASE_SERVICE_URL_BLUEBIKE = 'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/Blue_Bike_Stations/FeatureServer';
const BASE_SERVICE_URL_PUBLIC_TRANSIT = 'https://gisportal.boston.gov/arcgis/rest/services/CityServices/PublicTransit/MapServer';
const BASE_SERVICE_URL_ACTIVE_TRANSPORT = 'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/Active_Transportation_Network_2023/FeatureServer';
const BASE_SERVICE_URL_MANAGED_STREETS = 'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/City_of_Boston_Managed_Streets/FeatureServer';
const BASE_SERVICE_URL_OPEN_SPACE = 'https://gisportal.boston.gov/arcgis/rest/services/BaseServices/Open_Space_Public/FeatureServer';
const BASE_SERVICE_URL_PARK_FEATURES = 'https://gisportal.boston.gov/arcgis/rest/services/BaseServices/Park_Features/FeatureServer';
const BASE_SERVICE_URL_PAVEMENT_MARKINGS = 'https://gisportal.boston.gov/arcgis/rest/services/BTD/PavementMarkings/FeatureServer';
const BASE_SERVICE_URL_PARCELS = 'https://gisportal.boston.gov/arcgis/rest/services/Parcels/Parcels25/MapServer';
const BASE_SERVICE_URL_POPULATION_ESTIMATES_TRACTS = 'https://gis.bostonplans.org/hosting/rest/services/Hosted/Data_2025_Tract_AnalyzeB/FeatureServer';
const BASE_SERVICE_URL_POPULATION_ESTIMATES_NEIGHBORHOODS = 'https://gis.bostonplans.org/hosting/rest/services/Hosted/Data_2025_Neighborhood_AnalyzeB/FeatureServer';
const BASE_SERVICE_URL_POPULATION_ESTIMATES_CITY = 'https://gis.bostonplans.org/hosting/rest/services/Hosted/Data_2025_City_AnalyzeB/FeatureServer';
const BASE_SERVICE_URL_TRASH_DAY = 'https://gisportal.boston.gov/arcgis/rest/services/CityServices/TrashDay/MapServer';
const BASE_SERVICE_URL_BIKE_NETWORK = 'https://gisportal.boston.gov/arcgis/rest/services/CityServices/BikeNetwork/MapServer';
const BASE_SERVICE_URL_311_ADDRESSES = 'https://gisportal.boston.gov/arcgis/rest/services/CityServices/Addresses_Mattress_Pickup_311/FeatureServer';
const BASE_SERVICE_URL_MOH_PARCELS_2023 = 'https://gisportal.boston.gov/arcgis/rest/services/DND/MOH_Parcel_Join_FY23/MapServer';
const BASE_SERVICE_URL_EDUCATION = 'https://gisportal.boston.gov/arcgis/rest/services/Education/OpenData/MapServer';

export interface BostonOpenDataFeature {
  objectid: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance from query point (0 if inside polygon)
  isContaining?: boolean; // True if point is within polygon (polygon layers only)
  layerId: number; // Which layer this feature came from
  layerName: string; // Human-readable layer name
}

/**
 * Calculate Haversine distance between two points in miles
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate distance from a point to a line segment
 */
function distanceToLineSegment(
  pointLat: number,
  pointLon: number,
  lineStartLat: number,
  lineStartLon: number,
  lineEndLat: number,
  lineEndLon: number
): number {
  const A = pointLon - lineStartLon;
  const B = pointLat - lineStartLat;
  const C = lineEndLon - lineStartLon;
  const D = lineEndLat - lineStartLat;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = lineStartLon;
    yy = lineStartLat;
  } else if (param > 1) {
    xx = lineEndLon;
    yy = lineEndLat;
  } else {
    xx = lineStartLon + param * C;
    yy = lineStartLat + param * D;
  }

  const dx = pointLon - xx;
  const dy = pointLat - yy;
  return Math.sqrt(dx * dx + dy * dy) * 69; // Convert to miles (rough approximation)
}

/**
 * Calculate distance from a point to the nearest point on a polyline
 */
function distanceToPolyline(
  pointLat: number,
  pointLon: number,
  polylinePaths: number[][][]
): number {
  let minDistance = Infinity;

  for (const path of polylinePaths) {
    for (let i = 0; i < path.length - 1; i++) {
      const segmentStart = path[i];
      const segmentEnd = path[i + 1];

      // Calculate distance to line segment
      const distance = distanceToLineSegment(
        pointLat,
        pointLon,
        segmentStart[1], // lat
        segmentStart[0], // lon
        segmentEnd[1], // lat
        segmentEnd[0] // lon
      );

      minDistance = Math.min(minDistance, distance);
    }
  }

  return minDistance;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  // Use the first ring (exterior ring) for point-in-polygon check
  const ring = rings[0];
  if (!ring || ring.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]; // lon
    const yi = ring[i][1]; // lat
    const xj = ring[j][0]; // lon
    const yj = ring[j][1]; // lat
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate distance from point to nearest point on polygon boundary
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  rings.forEach(ring => {
    if (!ring || ring.length < 2) return;
    
    // Calculate distance to each edge of the polygon
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      
      if (p1.length >= 2 && p2.length >= 2) {
        const lon1 = p1[0];
        const lat1 = p1[1];
        const lon2 = p2[0];
        const lat2 = p2[1];
        
        // Calculate distance from point to line segment
        const distance = distanceToLineSegment(lat, lon, lat1, lon1, lat2, lon2);
        minDistance = Math.min(minDistance, distance);
      }
    }
  });
  
  return minDistance;
}

/**
 * Query a specific Boston Open Data layer (generic function for point layers)
 */
async function queryBostonLayer(
  baseServiceUrl: string,
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  try {
    const radiusKm = radiusMiles * 1.60934;
    const maxRecordCount = 2000;

    console.log(
      `🏙️ Boston Open Data ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
      const queryUrl = new URL(`${baseServiceUrl}/${layerId}/query`);
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
      queryUrl.searchParams.set('distance', radiusKm.toString());
      queryUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      const response = await fetchJSONSmart(queryUrl.toString());

      if (response.error) {
        throw new Error(
          `Boston Open Data ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ Boston Open Data ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances
    const processedFeatures: BostonOpenDataFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.OBJECTID_1 || 0;

        let distanceMiles = radiusMiles; // Default to max radius

        // Calculate distance using latitude/longitude from attributes or geometry
        let featureLat: number | null = null;
        let featureLon: number | null = null;

        if (attributes.Latitude && attributes.Longitude) {
          featureLat = attributes.Latitude;
          featureLon = attributes.Longitude;
        } else if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
          featureLon = geometry.x;
          featureLat = geometry.y;
        } else if (geometry && geometry.coordinates && geometry.coordinates.length >= 2) {
          featureLon = geometry.coordinates[0];
          featureLat = geometry.coordinates[1];
        }

        if (featureLat !== null && featureLon !== null) {
          distanceMiles = calculateHaversineDistance(lat, lon, featureLat, featureLon);
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          layerId,
          layerName,
        };
      }
    );

    // Sort by distance
    processedFeatures.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${processedFeatures.length} Boston Open Data ${layerName} feature(s) within ${radiusMiles} miles`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ Boston Open Data ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query Boston Charging Stations layer (Layer 2)
 */
export async function getBostonChargingStationsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonLayer(BASE_SERVICE_URL_CHARGING, 2, 'Charging Stations', lat, lon, Math.min(radiusMiles, 25));
}

/**
 * Query Boston Blue Bike Stations layer (Layer 0)
 */
async function queryBostonBlueBikeLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  try {
    const radiusKm = radiusMiles * 1.60934;
    const maxRecordCount = 2000;

    console.log(
      `🚴 Boston Open Data ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
      const queryUrl = new URL(`${BASE_SERVICE_URL_BLUEBIKE}/${layerId}/query`);
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
      queryUrl.searchParams.set('distance', radiusKm.toString());
      queryUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      const response = await fetchJSONSmart(queryUrl.toString());

      if (response.error) {
        throw new Error(
          `Boston Open Data ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ Boston Open Data ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances
    const processedFeatures: BostonOpenDataFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.ObjectId || 0;

        let distanceMiles = radiusMiles; // Default to max radius

        // Calculate distance using latitude/longitude from attributes or geometry
        let featureLat: number | null = null;
        let featureLon: number | null = null;

        if (attributes.Latitude && attributes.Longitude) {
          featureLat = attributes.Latitude;
          featureLon = attributes.Longitude;
        } else if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
          featureLon = geometry.x;
          featureLat = geometry.y;
        } else if (geometry && geometry.coordinates && geometry.coordinates.length >= 2) {
          featureLon = geometry.coordinates[0];
          featureLat = geometry.coordinates[1];
        }

        if (featureLat !== null && featureLon !== null) {
          distanceMiles = calculateHaversineDistance(lat, lon, featureLat, featureLon);
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          layerId,
          layerName,
        };
      }
    );

    // Sort by distance
    processedFeatures.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${processedFeatures.length} Boston Open Data ${layerName} feature(s) within ${radiusMiles} miles`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ Boston Open Data ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query Boston Blue Bike Stations layer (Layer 0)
 */
export async function getBostonBlueBikeStationsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonBlueBikeLayer(0, 'Blue Bike Stations', lat, lon, Math.min(radiusMiles, 25));
}

/**
 * Query Boston Active Transportation Network (Bicycle Network) layer (Layer 0)
 */
async function queryBostonActiveTransportLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  try {
    const radiusKm = radiusMiles * 1.60934;
    const maxRecordCount = 2000;

    console.log(
      `🚴 Boston Open Data ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
      const queryUrl = new URL(`${BASE_SERVICE_URL_ACTIVE_TRANSPORT}/${layerId}/query`);
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
      queryUrl.searchParams.set('distance', radiusKm.toString());
      queryUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      const response = await fetchJSONSmart(queryUrl.toString());

      if (response.error) {
        throw new Error(
          `Boston Open Data ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ Boston Open Data ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances (polylines)
    const processedFeatures: BostonOpenDataFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.ObjectId || 0;

        let distanceMiles = radiusMiles; // Default to max radius

        // Calculate distance to polyline
        if (geometry) {
          if (geometry.paths && geometry.paths.length > 0) {
            distanceMiles = distanceToPolyline(lat, lon, geometry.paths);
          } else if (geometry.rings && geometry.rings.length > 0) {
            // Some might have rings, treat as polylines
            distanceMiles = distanceToPolyline(lat, lon, geometry.rings);
          }
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          layerId,
          layerName,
        };
      }
    );

    // Sort by distance
    processedFeatures.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${processedFeatures.length} Boston Open Data ${layerName} feature(s) within ${radiusMiles} miles`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ Boston Open Data ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query Boston Bicycle Network 2023 layer (Layer 0)
 */
export async function getBostonBicycleNetwork2023Data(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonActiveTransportLayer(0, 'Bicycle Network 2023', lat, lon, Math.min(radiusMiles, 25));
}

/**
 * Query Boston Managed Streets layer (Layer 0)
 */
async function queryBostonManagedStreetsLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  try {
    const radiusKm = radiusMiles * 1.60934;
    const maxRecordCount = 2000;

    console.log(
      `🛣️ Boston Open Data ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
      const queryUrl = new URL(`${BASE_SERVICE_URL_MANAGED_STREETS}/${layerId}/query`);
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
      queryUrl.searchParams.set('distance', radiusKm.toString());
      queryUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      const response = await fetchJSONSmart(queryUrl.toString());

      if (response.error) {
        throw new Error(
          `Boston Open Data ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ Boston Open Data ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances (polylines)
    const processedFeatures: BostonOpenDataFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.ObjectId || attributes.FID || 0;

        let distanceMiles = radiusMiles; // Default to max radius

        // Calculate distance to polyline
        if (geometry) {
          if (geometry.paths && geometry.paths.length > 0) {
            distanceMiles = distanceToPolyline(lat, lon, geometry.paths);
          } else if (geometry.rings && geometry.rings.length > 0) {
            // Some might have rings, treat as polylines
            distanceMiles = distanceToPolyline(lat, lon, geometry.rings);
          }
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          layerId,
          layerName,
        };
      }
    );

    // Sort by distance
    processedFeatures.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${processedFeatures.length} Boston Open Data ${layerName} feature(s) within ${radiusMiles} miles`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ Boston Open Data ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query Boston Managed Streets layer (Layer 0)
 */
export async function getBostonManagedStreetsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonManagedStreetsLayer(0, 'Managed Streets', lat, lon, Math.min(radiusMiles, 25));
}

/**
 * Query Boston Open Space Public layer (Layer 0) - Polygon layer with point-in-polygon support
 */
async function queryBostonOpenSpaceLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  try {
    const maxRecordCount = 2000;

    console.log(
      `🌳 Boston Open Data ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
      // Calculate bounding box for the radius
      const latDelta = radiusMiles / 69.0; // Approximate miles per degree latitude
      const lonDelta = radiusMiles / (69.0 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude
      
      const minX = lon - lonDelta;
      const maxX = lon + lonDelta;
      const minY = lat - latDelta;
      const maxY = lat + latDelta;

      const queryUrl = new URL(`${BASE_SERVICE_URL_OPEN_SPACE}/${layerId}/query`);
      queryUrl.searchParams.set('f', 'json');
      queryUrl.searchParams.set('where', '1=1');
      queryUrl.searchParams.set('outFields', '*');
      queryUrl.searchParams.set('geometry', JSON.stringify({
        xmin: minX,
        ymin: minY,
        xmax: maxX,
        ymax: maxY,
        spatialReference: { wkid: 4326 }
      }));
      queryUrl.searchParams.set('geometryType', 'esriGeometryEnvelope');
      queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      const response = await fetchJSONSmart(queryUrl.toString());

      if (response.error) {
        throw new Error(
          `Boston Open Data ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ Boston Open Data ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances / point-in-polygon (polygons)
    const processedFeatures: BostonOpenDataFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.ObjectId || attributes.OBJECTID_ || attributes.FID || 0;

        let distanceMiles = radiusMiles; // Default to max radius
        let isContaining = false;

        // Calculate distance to polygon and check point-in-polygon
        if (geometry) {
          if (geometry.rings && geometry.rings.length > 0) {
            // Check if point is inside polygon
            isContaining = pointInPolygon(lat, lon, geometry.rings);
            
            if (isContaining) {
              distanceMiles = 0;
            } else {
              // Calculate distance to polygon boundary
              distanceMiles = distanceToPolygon(lat, lon, geometry.rings);
            }
          }
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          isContaining,
          layerId,
          layerName,
        };
      }
    );

    // Sort by distance (containing features first, then by distance)
    processedFeatures.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${processedFeatures.length} Boston Open Data ${layerName} feature(s) within ${radiusMiles} miles (${processedFeatures.filter(f => f.isContaining).length} containing point)`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ Boston Open Data ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query Boston Public Open Space layer (Layer 0)
 */
export async function getBostonPublicOpenSpaceData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonOpenSpaceLayer(0, 'Public Open Space', lat, lon, Math.min(radiusMiles, 25));
}

/**
 * Query Boston Park Features layer (Layer 0) - Point layer
 */
async function queryBostonParkFeaturesLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  try {
    const radiusKm = radiusMiles * 1.60934;
    const maxRecordCount = 2000;

    console.log(
      `🌳 Boston Open Data ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
      const queryUrl = new URL(`${BASE_SERVICE_URL_PARK_FEATURES}/${layerId}/query`);
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
      queryUrl.searchParams.set('distance', radiusKm.toString());
      queryUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      const response = await fetchJSONSmart(queryUrl.toString());

      if (response.error) {
        throw new Error(
          `Boston Open Data ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ Boston Open Data ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances (points)
    const processedFeatures: BostonOpenDataFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.ObjectId || attributes.OBJECTID_ || attributes.FID || 0;

        let distanceMiles = radiusMiles; // Default to max radius

        // Calculate distance using latitude/longitude from attributes or geometry
        let featureLat: number | null = null;
        let featureLon: number | null = null;

        if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
          featureLon = geometry.x;
          featureLat = geometry.y;
        } else if (geometry && geometry.coordinates && geometry.coordinates.length >= 2) {
          featureLon = geometry.coordinates[0];
          featureLat = geometry.coordinates[1];
        }

        if (featureLat !== null && featureLon !== null) {
          distanceMiles = calculateHaversineDistance(lat, lon, featureLat, featureLon);
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          layerId,
          layerName,
        };
      }
    );

    // Sort by distance
    processedFeatures.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${processedFeatures.length} Boston Open Data ${layerName} feature(s) within ${radiusMiles} miles`
    );

    return processedFeatures;
  } catch (error) {
    console.error(`❌ Boston Open Data ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query Boston Park Features layer (Layer 0)
 */
export async function getBostonParkFeaturesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonParkFeaturesLayer(0, 'Park Features', lat, lon, Math.min(radiusMiles, 25));
}

/**
 * Query Boston Pavement Markings layers - Generic function for polygon or polyline layers
 */
async function queryBostonPavementMarkingsLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number,
  isPolygon: boolean = false
): Promise<BostonOpenDataFeature[]> {
  try {
    const maxRecordCount = 2000;

    console.log(
      `🛣️ Boston Open Data ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
      // Calculate bounding box for the radius
      const latDelta = radiusMiles / 69.0; // Approximate miles per degree latitude
      const lonDelta = radiusMiles / (69.0 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude
      
      const minX = lon - lonDelta;
      const maxX = lon + lonDelta;
      const minY = lat - latDelta;
      const maxY = lat + latDelta;

      const queryUrl = new URL(`${BASE_SERVICE_URL_PAVEMENT_MARKINGS}/${layerId}/query`);
      queryUrl.searchParams.set('f', 'json');
      queryUrl.searchParams.set('where', '1=1');
      queryUrl.searchParams.set('outFields', '*');
      queryUrl.searchParams.set('geometry', JSON.stringify({
        xmin: minX,
        ymin: minY,
        xmax: maxX,
        ymax: maxY,
        spatialReference: { wkid: 4326 }
      }));
      queryUrl.searchParams.set('geometryType', 'esriGeometryEnvelope');
      queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      const response = await fetchJSONSmart(queryUrl.toString());

      if (response.error) {
        throw new Error(
          `Boston Open Data ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ Boston Open Data ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances / point-in-polygon
    const processedFeatures: BostonOpenDataFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.ObjectId || attributes.OBJECTID_ || attributes.FID || 0;

        let distanceMiles = radiusMiles; // Default to max radius
        let isContaining = false;

        if (isPolygon && geometry && geometry.rings && geometry.rings.length > 0) {
          // Polygon layer - check point-in-polygon and calculate distance to boundary
          isContaining = pointInPolygon(lat, lon, geometry.rings);
          
          if (isContaining) {
            distanceMiles = 0;
          } else {
            distanceMiles = distanceToPolygon(lat, lon, geometry.rings);
          }
        } else if (!isPolygon && geometry) {
          // Polyline layer - calculate distance to line
          if (geometry.paths && geometry.paths.length > 0) {
            distanceMiles = distanceToPolyline(lat, lon, geometry.paths);
          } else if (geometry.rings && geometry.rings.length > 0) {
            // Some polylines may be stored as rings
            distanceMiles = distanceToPolyline(lat, lon, geometry.rings);
          }
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          isContaining: isContaining || undefined,
          layerId,
          layerName,
        };
      }
    );

    // Filter features within radius and sort
    const withinRadius = processedFeatures.filter(f => (f.distance_miles || Infinity) <= radiusMiles);
    
    // Sort by distance (containing features first for polygons, then by distance)
    withinRadius.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${withinRadius.length} Boston Open Data ${layerName} feature(s) within ${radiusMiles} miles${isPolygon ? ` (${withinRadius.filter(f => f.isContaining).length} containing point)` : ''}`
    );

    return withinRadius;
  } catch (error) {
    console.error(`❌ Boston Open Data ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query Boston School Zones layer (Layer 0) - Polygon layer
 */
export async function getBostonSchoolZonesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonPavementMarkingsLayer(0, 'School Zones', lat, lon, Math.min(radiusMiles, 1), true);
}

/**
 * Query Boston Crosswalks layer (Layer 1) - Polyline layer
 */
export async function getBostonCrosswalksData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonPavementMarkingsLayer(1, 'Crosswalks', lat, lon, Math.min(radiusMiles, 1), false);
}

/**
 * Query Boston Yellow Centerlines layer (Layer 2) - Polyline layer
 */
export async function getBostonYellowCenterlinesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonPavementMarkingsLayer(2, 'Yellow Centerlines', lat, lon, Math.min(radiusMiles, 1), false);
}

/**
 * Query Boston Parcels 2025 layer (Layer 0) - Polygon layer with point-in-polygon support
 */
async function queryBostonParcelsLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  try {
    const maxRecordCount = 2000;

    console.log(
      `🏘️ Boston Open Data ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
      // Calculate bounding box for the radius
      const latDelta = radiusMiles / 69.0; // Approximate miles per degree latitude
      const lonDelta = radiusMiles / (69.0 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude
      
      const minX = lon - lonDelta;
      const maxX = lon + lonDelta;
      const minY = lat - latDelta;
      const maxY = lat + latDelta;

      const queryUrl = new URL(`${BASE_SERVICE_URL_PARCELS}/${layerId}/query`);
      queryUrl.searchParams.set('f', 'json');
      queryUrl.searchParams.set('where', '1=1');
      queryUrl.searchParams.set('outFields', '*');
      queryUrl.searchParams.set('geometry', JSON.stringify({
        xmin: minX,
        ymin: minY,
        xmax: maxX,
        ymax: maxY,
        spatialReference: { wkid: 4326 }
      }));
      queryUrl.searchParams.set('geometryType', 'esriGeometryEnvelope');
      queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      const response = await fetchJSONSmart(queryUrl.toString());

      if (response.error) {
        throw new Error(
          `Boston Open Data ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ Boston Open Data ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances / point-in-polygon (polygons)
    const processedFeatures: BostonOpenDataFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.ObjectId || attributes.OBJECTID_ || attributes.FID || 0;

        let distanceMiles = radiusMiles; // Default to max radius
        let isContaining = false;

        // Calculate distance to polygon and check point-in-polygon
        if (geometry) {
          if (geometry.rings && geometry.rings.length > 0) {
            // Check if point is inside polygon
            isContaining = pointInPolygon(lat, lon, geometry.rings);
            
            if (isContaining) {
              distanceMiles = 0;
            } else {
              // Calculate distance to polygon boundary
              distanceMiles = distanceToPolygon(lat, lon, geometry.rings);
            }
          }
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          isContaining,
          layerId,
          layerName,
        };
      }
    );

    // Filter features within radius and sort
    const withinRadius = processedFeatures.filter(f => (f.distance_miles || Infinity) <= radiusMiles);
    
    // Sort by distance (containing features first, then by distance)
    withinRadius.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${withinRadius.length} Boston Open Data ${layerName} feature(s) within ${radiusMiles} miles (${withinRadius.filter(f => f.isContaining).length} containing point)`
    );

    return withinRadius;
  } catch (error) {
    console.error(`❌ Boston Open Data ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query Boston Parcels 2025 layer (Layer 0)
 */
export async function getBostonParcels2025Data(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonParcelsLayer(0, 'Parcels 2025', lat, lon, Math.min(radiusMiles, 2));
}

/**
 * Query Boston Population Estimates 2025 Census Tracts layer (Layer 0) - Polygon layer with point-in-polygon support
 */
export async function getBostonPopulationEstimates2025Data(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonPopulationEstimatesLayer(BASE_SERVICE_URL_POPULATION_ESTIMATES_TRACTS, 0, 'Population Estimates 2025 Census Tracts', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Population Estimates 2025 Neighborhoods layer (Layer 0) - Polygon layer with point-in-polygon support
 */
export async function getBostonPopulationEstimates2025NeighborhoodsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonPopulationEstimatesLayer(BASE_SERVICE_URL_POPULATION_ESTIMATES_NEIGHBORHOODS, 0, 'Population Estimates 2025 Neighborhoods', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Population Estimates 2025 City layer (Layer 0) - Polygon layer with point-in-polygon support
 */
export async function getBostonPopulationEstimates2025CityData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonPopulationEstimatesLayer(BASE_SERVICE_URL_POPULATION_ESTIMATES_CITY, 0, 'Population Estimates 2025 City', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query MBTA Stops layer (Layer 0) - Point layer
 */
export async function getBostonMBTAStopsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonLayer(BASE_SERVICE_URL_PUBLIC_TRANSIT, 0, 'MBTA Stops', lat, lon, Math.min(radiusMiles, 2));
}

/**
 * Query Boston PWD Districts layer (Layer 0) - Polygon layer with point-in-polygon support
 */
export async function getBostonPWDDistrictsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonPopulationEstimatesLayer(BASE_SERVICE_URL_TRASH_DAY, 0, 'PWD Districts', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Snow Districts layer (Layer 1) - Polygon layer with point-in-polygon support
 */
export async function getBostonSnowDistrictsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonPopulationEstimatesLayer(BASE_SERVICE_URL_TRASH_DAY, 1, 'Snow Districts', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston WiFi Locations layer (Layer 0) - Point layer
 */
export async function getBostonWiFiLocationsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonLayer(BASE_SERVICE_URL_CHARGING, 0, 'WiFi Locations', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston WiFi Collector layer (Layer 1) - Point layer
 */
export async function getBostonWiFiCollectorData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonLayer(BASE_SERVICE_URL_CHARGING, 1, 'WiFi Collector', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Budget Facilities layer (Layer 3) - Point layer
 */
export async function getBostonBudgetFacilitiesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonLayer(BASE_SERVICE_URL_CHARGING, 3, 'Budget Facilities', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Hubway Stations layer (Layer 4) - Point layer
 */
export async function getBostonHubwayStationsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonLayer(BASE_SERVICE_URL_CHARGING, 4, 'Hubway Stations', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Polling Locations layer (Layer 5) - Point layer
 */
export async function getBostonPollingLocationsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonLayer(BASE_SERVICE_URL_CHARGING, 5, 'Polling Locations', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Public Libraries layer (Layer 6) - Point layer
 */
export async function getBostonPublicLibrariesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonLayer(BASE_SERVICE_URL_CHARGING, 6, 'Public Libraries', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Bike Network layer - Polyline layer
 * Generic function that can query Existing Facility, 5YR_plan, or 30YR_plan layers
 */
async function queryBostonBikeNetworkLayer(
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  try {
    const radiusKm = radiusMiles * 1.60934;
    const maxRecordCount = 2000;

    console.log(
      `🚴 Boston Open Data ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
      const queryUrl = new URL(`${BASE_SERVICE_URL_BIKE_NETWORK}/${layerId}/query`);
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
      queryUrl.searchParams.set('distance', radiusKm.toString());
      queryUrl.searchParams.set('units', 'esriSRUnit_Kilometer');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      const response = await fetchJSONSmart(queryUrl.toString());

      if (response.error) {
        throw new Error(
          `Boston Open Data ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ Boston Open Data ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances (polylines)
    const processedFeatures: BostonOpenDataFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.ObjectId || 0;

        let distanceMiles = radiusMiles; // Default to max radius

        // Calculate distance to polyline
        if (geometry) {
          if (geometry.paths && geometry.paths.length > 0) {
            distanceMiles = distanceToPolyline(lat, lon, geometry.paths);
          } else if (geometry.rings && geometry.rings.length > 0) {
            // Some might have rings, treat as polylines
            distanceMiles = distanceToPolyline(lat, lon, geometry.rings);
          }
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          layerId,
          layerName,
        };
      }
    );

    // Filter features within radius and sort
    const withinRadius = processedFeatures.filter(f => (f.distance_miles || Infinity) <= radiusMiles);
    
    // Sort by distance
    withinRadius.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${withinRadius.length} Boston Open Data ${layerName} feature(s) within ${radiusMiles} miles`
    );

    return withinRadius;
  } catch (error) {
    console.error(`❌ Boston Open Data ${layerName} API Error:`, error);
    throw error;
  }
}

/**
 * Query Boston Bike Network Existing Facility layer (Layer 0) - Polyline layer
 */
export async function getBostonBikeNetworkExistingFacilityData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonBikeNetworkLayer(0, 'Bike Network Existing Facility', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Bike Network 5YR_plan layer (Layer 1) - Polyline layer
 */
export async function getBostonBikeNetwork5YRPlanData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonBikeNetworkLayer(1, 'Bike Network 5YR Plan', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Bike Network 30YR_plan layer (Layer 2) - Polyline layer
 */
export async function getBostonBikeNetwork30YRPlanData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonBikeNetworkLayer(2, 'Bike Network 30YR Plan', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston 311 Bulk Item PickUp Locations layer (Layer 0) - Point layer
 */
export async function getBoston311AddressesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonLayer(BASE_SERVICE_URL_311_ADDRESSES, 0, '311 Bulk Item PickUp Locations', lat, lon, Math.min(radiusMiles, 1));
}

/**
 * Query Boston Parcels 2023 layer (Layer 0) - Polygon layer with point-in-polygon support
 */
export async function getBostonParcels2023Data(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonPopulationEstimatesLayer(BASE_SERVICE_URL_MOH_PARCELS_2023, 0, 'Parcels 2023', lat, lon, Math.min(radiusMiles, 0.25));
}

/**
 * Query Boston Public Schools layer (Layer 0) - Point layer
 */
export async function getBostonPublicSchoolsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonLayer(BASE_SERVICE_URL_EDUCATION, 0, 'Public Schools', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Non Public Schools layer (Layer 1) - Point layer
 */
export async function getBostonNonPublicSchoolsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonLayer(BASE_SERVICE_URL_EDUCATION, 1, 'Non Public Schools', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Colleges/Universities layer (Layer 2) - Point layer
 */
export async function getBostonCollegesUniversitiesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  return queryBostonLayer(BASE_SERVICE_URL_EDUCATION, 2, 'Colleges/Universities', lat, lon, Math.min(radiusMiles, 10));
}

/**
 * Query Boston Population Estimates layer - Polygon layer with point-in-polygon support
 * Generic function that can query Tracts, Neighborhoods, or City layers
 */
async function queryBostonPopulationEstimatesLayer(
  baseServiceUrl: string,
  layerId: number,
  layerName: string,
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<BostonOpenDataFeature[]> {
  try {
    const maxRecordCount = 2000;

    console.log(
      `📊 Boston Open Data ${layerName} (Layer ${layerId}) query for coordinates [${lat}, ${lon}] within ${radiusMiles} miles`
    );

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    while (hasMore) {
      // Calculate bounding box for the radius
      const latDelta = radiusMiles / 69.0; // Approximate miles per degree latitude
      const lonDelta = radiusMiles / (69.0 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude
      
      const minX = lon - lonDelta;
      const maxX = lon + lonDelta;
      const minY = lat - latDelta;
      const maxY = lat + latDelta;

      const queryUrl = new URL(`${baseServiceUrl}/${layerId}/query`);
      queryUrl.searchParams.set('f', 'json');
      queryUrl.searchParams.set('where', '1=1');
      queryUrl.searchParams.set('outFields', '*');
      queryUrl.searchParams.set('geometry', JSON.stringify({
        xmin: minX,
        ymin: minY,
        xmax: maxX,
        ymax: maxY,
        spatialReference: { wkid: 4326 }
      }));
      queryUrl.searchParams.set('geometryType', 'esriGeometryEnvelope');
      queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());

      const response = await fetchJSONSmart(queryUrl.toString());

      if (response.error) {
        throw new Error(
          `Boston Open Data ${layerName} API error: ${JSON.stringify(response.error)}`
        );
      }

      const batchFeatures = response.features || [];
      allFeatures = allFeatures.concat(batchFeatures);

      hasMore = batchFeatures.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += batchFeatures.length;

      if (resultOffset > 100000) {
        console.warn(`⚠️ Boston Open Data ${layerName}: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Process features and calculate distances / point-in-polygon (polygons)
    const processedFeatures: BostonOpenDataFeature[] = allFeatures.map(
      (feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectid = attributes.OBJECTID || attributes.objectid || attributes.ObjectId || attributes.OBJECTID_ || attributes.FID || 0;

        let distanceMiles = radiusMiles; // Default to max radius
        let isContaining = false;

        // Calculate distance to polygon and check point-in-polygon
        if (geometry) {
          if (geometry.rings && geometry.rings.length > 0) {
            // Check if point is inside polygon
            isContaining = pointInPolygon(lat, lon, geometry.rings);
            
            if (isContaining) {
              distanceMiles = 0;
            } else {
              // Calculate distance to polygon boundary
              distanceMiles = distanceToPolygon(lat, lon, geometry.rings);
            }
          }
        }

        return {
          objectid,
          attributes,
          geometry,
          distance_miles: distanceMiles,
          isContaining,
          layerId,
          layerName,
        };
      }
    );

    // Filter features within radius and sort
    const withinRadius = processedFeatures.filter(f => (f.distance_miles || Infinity) <= radiusMiles);
    
    // Sort by distance (containing features first, then by distance)
    withinRadius.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });

    console.log(
      `✅ Processed ${withinRadius.length} Boston Open Data ${layerName} feature(s) within ${radiusMiles} miles (${withinRadius.filter(f => f.isContaining).length} containing point)`
    );

    return withinRadius;
  } catch (error) {
    console.error(`❌ Boston Open Data ${layerName} API Error:`, error);
    throw error;
  }
}

