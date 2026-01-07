/**
 * Scotland Trunk Road Gritter Adapter
 * Queries Scotland Trunk Road Gritter Vehicle Locations and Trails
 * Supports proximity queries for point and polyline features
 */

const BASE_SERVICE_URL = 'https://services-eu1.arcgis.com/2fd71P03WS9cosrs/ArcGIS/rest/services/TSWT_Vehicles_Live_WGT2/FeatureServer';

export interface ScotlandGritterLocationInfo {
  objectId: string | null;
  vehicleId: string | null;
  vehicleName: string | null;
  status: string | null;
  lastUpdate: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

export interface ScotlandGritterTrailInfo {
  objectId: string | null;
  vehicleId: string | null;
  vehicleName: string | null;
  trailLength: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Helper function to fetch with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Query Scotland Gritter Vehicle Locations (Layer 1) - Point features
 */
export async function getScotlandGritterLocationsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<ScotlandGritterLocationInfo[]> {
  try {
    const results: ScotlandGritterLocationInfo[] = [];
    const LAYER_ID = 1;
    
    if (!radius || radius <= 0) {
      console.log(`📍 Scotland Gritter Locations: No radius provided, skipping proximity query`);
      return results;
    }
    
    console.log(`🚛 Querying Scotland Gritter Vehicle Locations within ${radius} miles of [${lat}, ${lon}]`);
    
    // Convert radius from miles to meters
    const radiusMeters = radius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
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
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 Scotland Gritter Locations Query URL: ${queryUrl.toString()}`);
    
    let data: any;
    try {
      const response = await fetchWithTimeout(queryUrl.toString(), 30000);
      
      if (!response.ok) {
        console.error(`❌ Scotland Gritter Locations HTTP error! status: ${response.status}`);
        return results;
      }
      
      data = await response.json();
    } catch (error: any) {
      console.error('❌ Scotland Gritter Locations fetch error:', error.message || error);
      return results;
    }
    
    if (data.error) {
      console.error('❌ Scotland Gritter Locations API Error:', data.error);
      return results;
    }
    
    if (data.features && data.features.length > 0) {
      data.features.forEach((feature: any) => {
        try {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const objectId = attributes.OBJECTID || attributes.objectid || attributes.FID || null;
          const vehicleId = attributes.VehicleID || attributes.vehicleId || attributes.vehicle_id || attributes.VEHICLE_ID || null;
          const vehicleName = attributes.VehicleName || attributes.vehicleName || attributes.vehicle_name || attributes.VEHICLE_NAME || null;
          const status = attributes.Status || attributes.status || attributes.STATUS || null;
          const lastUpdate = attributes.LastUpdate || attributes.lastUpdate || attributes.last_update || attributes.LAST_UPDATE || null;
          
          // Calculate distance
          let distance = radius || 0;
          if (geometry && typeof geometry.x === 'number' && typeof geometry.y === 'number') {
            // Geometry is in the service's spatial reference (27700 - British National Grid)
            // We need to convert to lat/lon for distance calculation
            // For now, use a simple approximation or convert coordinates
            // Since the query uses inSR/outSR 4326, geometry should be in lat/lon
            const featureLat = geometry.y;
            const featureLon = geometry.x;
            distance = calculateDistance(lat, lon, featureLat, featureLon);
          }
          
          results.push({
            objectId: objectId ? objectId.toString() : null,
            vehicleId: vehicleId ? vehicleId.toString() : null,
            vehicleName,
            status,
            lastUpdate,
            attributes,
            geometry,
            distance_miles: distance
          });
        } catch (error: any) {
          console.error('❌ Error processing Scotland Gritter Location feature:', error.message || error);
        }
      });
    }
    
    console.log(`✅ Scotland Gritter Locations: Found ${results.length} vehicle(s)`);
    return results;
  } catch (error: any) {
    console.error('❌ Error querying Scotland Gritter Locations data:', error.message || error);
    return [];
  }
}

/**
 * Query Scotland Gritter Vehicle Trails (Layer 2) - Polyline features
 */
export async function getScotlandGritterTrailsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<ScotlandGritterTrailInfo[]> {
  try {
    const results: ScotlandGritterTrailInfo[] = [];
    const LAYER_ID = 2;
    
    if (!radius || radius <= 0) {
      console.log(`📍 Scotland Gritter Trails: No radius provided, skipping proximity query`);
      return results;
    }
    
    console.log(`🚛 Querying Scotland Gritter Vehicle Trails within ${radius} miles of [${lat}, ${lon}]`);
    
    // Convert radius from miles to meters
    const radiusMeters = radius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
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
    queryUrl.searchParams.set('returnGeometry', 'true');
    queryUrl.searchParams.set('returnIdsOnly', 'false');
    queryUrl.searchParams.set('returnCountOnly', 'false');
    // Request full geometry without simplification
    // Note: Some ArcGIS services don't support these parameters, but try them
    try {
      queryUrl.searchParams.set('geometryPrecision', '6');
    } catch (e) {
      // Ignore if parameter not supported
    }
    try {
      queryUrl.searchParams.set('maxAllowableOffset', '0');
    } catch (e) {
      // Ignore if parameter not supported  
    }
    
    console.log(`🔗 Scotland Gritter Trails Query URL: ${queryUrl.toString()}`);
    
    let data: any;
    try {
      const response = await fetchWithTimeout(queryUrl.toString(), 30000);
      
      if (!response.ok) {
        console.error(`❌ Scotland Gritter Trails HTTP error! status: ${response.status}`);
        return results;
      }
      
      data = await response.json();
    } catch (error: any) {
      console.error('❌ Scotland Gritter Trails fetch error:', error.message || error);
      return results;
    }
    
    if (data.error) {
      console.error('❌ Scotland Gritter Trails API Error:', data.error);
      return results;
    }
    
    console.log(`🔍 API Response Summary:`, {
      hasFeatures: !!data.features,
      featuresCount: data.features?.length || 0,
      firstFeatureSample: data.features?.[0] ? {
        hasAttributes: !!data.features[0].attributes,
        hasGeometry: !!data.features[0].geometry,
        geometryKeys: data.features[0].geometry ? Object.keys(data.features[0].geometry) : [],
        geometryType: data.features[0].geometry?.type,
        hasPaths: !!data.features[0].geometry?.paths,
        pathsLength: data.features[0].geometry?.paths?.length,
        fullGeometry: JSON.stringify(data.features[0].geometry).substring(0, 500)
      } : null
    });
    
    if (data.features && data.features.length > 0) {
      data.features.forEach((feature: any, index: number) => {
        try {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          // Log raw geometry from API for each feature
          console.log(`🔍 Raw trail geometry from API [Feature ${index}]:`, {
            hasGeometry: !!geometry,
            geometryType: geometry?.type,
            geometryKeys: geometry ? Object.keys(geometry) : [],
            hasPaths: !!geometry?.paths,
            pathsLength: geometry?.paths?.length,
            hasX: geometry?.x !== undefined,
            hasY: geometry?.y !== undefined,
            isPoint: geometry?.x !== undefined && geometry?.y !== undefined,
            spatialReference: geometry?.spatialReference,
            firstPathSample: geometry?.paths?.[0]?.slice(0, 2),
            fullGeometry: JSON.stringify(geometry).substring(0, 1000)
          });
          
          // Log all attribute keys to help debug
          if (index === 0) {
            console.log(`🔍 Sample trail attributes keys:`, Object.keys(attributes));
            console.log(`🔍 Sample trail attributes (first feature):`, JSON.stringify(attributes).substring(0, 2000));
          }
          
          // This layer returns POINT geometry (not polylines) - each point represents a trail waypoint
          // The geometry is a point with x, y coordinates
          if (!geometry || geometry.x === undefined || geometry.y === undefined) {
            console.warn(`⚠️ Feature ${index} does not have valid point geometry. Skipping.`);
            return;
          }
          
          // For point geometry, we'll use the point coordinates directly
          // Note: This is different from polylines - each feature is a single point representing a trail location
          
          const objectId = attributes.OBJECTID || attributes.objectid || attributes.FID || null;
          const vehicleId = attributes.VehicleID || attributes.vehicleId || attributes.vehicle_id || attributes.VEHICLE_ID || null;
          const vehicleName = attributes.VehicleName || attributes.vehicleName || attributes.vehicle_name || attributes.VEHICLE_NAME || null;
          const trailLength = attributes.TrailLength || attributes.trailLength || attributes.trail_length || attributes.TRAIL_LENGTH || null;
          
          // Calculate distance to point (this is a point layer, not polyline)
          let distance = radius || 0;
          if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
            // Point coordinates: x is longitude, y is latitude (after outSR=4326)
            const pointLon = geometry.x;
            const pointLat = geometry.y;
            distance = calculateDistance(lat, lon, pointLat, pointLon);
          }
          
          // Preserve geometry exactly as received from API (point geometry with x, y)
          results.push({
            objectId: objectId ? objectId.toString() : null,
            vehicleId: vehicleId ? vehicleId.toString() : null,
            vehicleName,
            status,
            ageCategory,
            heading,
            speed,
            fetchTimestamp,
            sourceTimestamp,
            attributes,
            geometry: geometry, // Preserve full geometry object (point with x, y)
            distance_miles: distance
          });
        } catch (error: any) {
          console.error('❌ Error processing Scotland Gritter Trail feature:', error.message || error);
        }
      });
    }
    
    console.log(`✅ Scotland Gritter Trails: Found ${results.length} trail(s)`);
    return results;
  } catch (error: any) {
    console.error('❌ Error querying Scotland Gritter Trails data:', error.message || error);
    return [];
  }
}

