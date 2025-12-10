/**
 * Houston Bikeways (Existing) Adapter
 * Queries Houston Bikeways Existing linear network polyline feature service
 * Supports proximity queries up to 5 miles
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_Bikeways_Existing_LC_view/FeatureServer/28';

export interface HoustonBikewayInfo {
  objectId: string | null;
  bikewayName: string | null;
  bikewayType: string | null;
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
 * Query Houston Bikeways within proximity of a location
 * Supports proximity queries up to 5 miles
 */
export async function getHoustonBikewaysData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<HoustonBikewayInfo[]> {
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
    
    const features: HoustonBikewayInfo[] = [];
    
    // Proximity query (required for polylines) with pagination to get all results
    try {
      const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
      const allFeatures: any[] = [];
      let resultOffset = 0;
      const batchSize = 2000; // ESRI FeatureServer max per request
      let hasMore = true;
      
      // Fetch all results in batches
      while (hasMore) {
        // Build query URL manually to ensure proper encoding
        const geometryStr = encodeURIComponent(JSON.stringify(geometry));
        const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        
        if (resultOffset === 0) {
          console.log(`🚴 Querying Houston Bikeways for proximity (${radiusMiles} miles) at [${lat}, ${lon}]`);
        }
        console.log(`🔗 Houston Bikeways Proximity Query URL (offset ${resultOffset}): ${proximityUrl}`);
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        // Log the full response for debugging
        console.log(`📊 Houston Bikeways Proximity Response (offset ${resultOffset}):`, {
          hasError: !!proximityData.error,
          error: proximityData.error,
          featureCount: proximityData.features?.length || 0,
          hasFeatures: !!proximityData.features,
          exceededTransferLimit: proximityData.exceededTransferLimit
        });
        
        if (proximityData.error) {
          console.error('❌ Houston Bikeways API Error:', proximityData.error);
          break;
        }
        
        if (!proximityData.features || proximityData.features.length === 0) {
          hasMore = false;
          break;
        }
        
        allFeatures.push(...proximityData.features);
        console.log(`📦 Fetched batch: ${proximityData.features.length} bikeway segments (total so far: ${allFeatures.length})`);
        
        // Check if there are more records to fetch
        if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
          resultOffset += batchSize;
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }
      
      console.log(`✅ Fetched ${allFeatures.length} total Houston Bikeways (${Math.ceil(allFeatures.length / batchSize)} batches)`);
      
      // Process all features
      if (allFeatures.length > 0) {
        allFeatures.forEach((feature: any) => {
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
          
          // Only include bikeways within the specified radius
          if (distance_miles <= radiusMiles!) {
            const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
            // Try to find bikeway name/type fields (field names may vary)
            const bikewayName = attributes.NAME || attributes.name || attributes.NAME1 || attributes.name1 || 
                               attributes.BIKEWAY_NAME || attributes.bikeway_name || attributes.BikewayName || 
                               attributes.STREET_NAME || attributes.street_name || attributes.StreetName || null;
            const bikewayType = attributes.TYPE || attributes.type || attributes.BIKEWAY_TYPE || attributes.bikeway_type ||
                               attributes.BikewayType || attributes.TYPE_DESC || attributes.type_desc || null;
            
            features.push({
              objectId: objectId,
              bikewayName: bikewayName,
              bikewayType: bikewayType,
              geometry: geometry,
              distance_miles: Number(distance_miles.toFixed(2)),
              attributes: attributes
            });
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Houston Bikeways: Proximity query failed:', error);
    }
    
    // Sort by distance
    features.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Houston Bikeways: Found ${features.length} bikeway segment(s)`);
    return features;
  } catch (error) {
    console.error('❌ Error querying Houston Bikeways data:', error);
    throw error;
  }
}

