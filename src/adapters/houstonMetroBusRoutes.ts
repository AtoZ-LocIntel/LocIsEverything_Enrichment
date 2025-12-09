/**
 * Houston Metro Bus Routes Adapter
 * Queries Houston Metro Bus Routes polyline feature service
 * Supports proximity queries up to 5 miles
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_METRO_Bus_Routes_view/FeatureServer/29';

export interface HoustonMetroBusRouteInfo {
  objectId: string | null;
  routeName: string | null;
  routeNumber: string | null;
  routeType: string | null;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  attributes: Record<string, any>;
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
 * Query Houston Metro Bus Routes within proximity of a location
 * Supports proximity queries up to 5 miles
 */
export async function getHoustonMetroBusRoutesData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<HoustonMetroBusRouteInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 5 miles
    if (radiusMiles && radiusMiles > 5.0) {
      radiusMiles = 5.0;
    }
    
    if (!radiusMiles || radiusMiles <= 0) {
      return [];
    }
    
    // Convert lat/lon to Web Mercator for ESRI query
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const features: HoustonMetroBusRouteInfo[] = [];
    
    // Proximity query (required for polylines)
    try {
      const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
      // Build query URL manually to ensure proper encoding
      const geometryStr = encodeURIComponent(JSON.stringify(geometry));
      const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🚌 Querying Houston Metro Bus Routes for proximity (${radiusMiles} miles) at [${lat}, ${lon}]`);
      console.log(`🔗 Houston Metro Bus Routes Proximity Query URL: ${proximityUrl}`);
      
      const proximityData = await fetchJSONSmart(proximityUrl) as any;
      
      // Log the full response for debugging
      console.log(`📊 Houston Metro Bus Routes Proximity Response:`, {
        hasError: !!proximityData.error,
        error: proximityData.error,
        featureCount: proximityData.features?.length || 0,
        hasFeatures: !!proximityData.features
      });
      
      if (proximityData.error) {
        console.error('❌ Houston Metro Bus Routes API Error:', proximityData.error);
      } else if (proximityData.features && proximityData.features.length > 0) {
        proximityData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          // Calculate distance from point to nearest point on polyline
          let distance_miles = radiusMiles!; // Default to max radius
          
          if (geometry && geometry.paths) {
            // Find minimum distance to any point on any path of the polyline
            let minDistance = Infinity;
            geometry.paths.forEach((path: number[][]) => {
              path.forEach((coord: number[]) => {
                // Note: ESRI geometry paths are in [x, y] format (lon, lat)
                const distance = calculateDistance(lat, lon, coord[1], coord[0]);
                if (distance < minDistance) minDistance = distance;
              });
            });
            distance_miles = minDistance;
          }
          
          // Only include routes within the specified radius
          if (distance_miles <= radiusMiles!) {
            const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
            // Try to find route name/number fields (field names may vary)
            const routeName = attributes.ROUTE_NAME || attributes.route_name || attributes.RouteName || attributes.routeName || 
                             attributes.NAME || attributes.name || attributes.Route || attributes.route || null;
            const routeNumber = attributes.ROUTE_NUMBER || attributes.route_number || attributes.RouteNumber || attributes.routeNumber ||
                               attributes.ROUTE || attributes.Route || attributes.NUMBER || attributes.number || null;
            const routeType = attributes.ROUTE_TYPE || attributes.route_type || attributes.RouteType || attributes.routeType ||
                             attributes.TYPE || attributes.type || null;
            
            features.push({
              objectId: objectId,
              routeName: routeName,
              routeNumber: routeNumber,
              routeType: routeType,
              geometry: geometry,
              distance_miles: Number(distance_miles.toFixed(2)),
              attributes: attributes
            });
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Houston Metro Bus Routes: Proximity query failed:', error);
    }
    
    // Sort by distance
    features.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Houston Metro Bus Routes: Found ${features.length} route segment(s)`);
    return features;
  } catch (error) {
    console.error('❌ Error querying Houston Metro Bus Routes data:', error);
    throw error;
  }
}

