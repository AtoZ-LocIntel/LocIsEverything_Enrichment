/**
 * BLM National GTLF Public Nonmotorized Trails Adapter
 * Queries BLM National GTLF Public Nonmotorized Trails linear feature service
 * Supports proximity queries up to 100 miles
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_GTLF_Public_Nonmotorized_Trails/FeatureServer/6';

export interface BLMNationalNonmotorizedTrailInfo {
  objectId: string | null;
  routeName: string | null;
  adminState: string | null;
  assetClass: string | null;
  modeTransport: string | null;
  routeUseClass: string | null;
  ohvRouteDesignation: string | null;
  gisMiles: number | null;
  blmMiles: number | null;
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
 * Query BLM National GTLF Public Nonmotorized Trails within proximity of a location
 * Supports proximity queries up to 100 miles
 */
export async function getBLMNationalNonmotorizedTrailsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<BLMNationalNonmotorizedTrailInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    if (radiusMiles && radiusMiles > 50.0) {
      radiusMiles = 50.0;
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
    
    const features: BLMNationalNonmotorizedTrailInfo[] = [];
    
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
          console.log(`🚶 Querying BLM National GTLF Public Nonmotorized Trails for proximity (${radiusMiles} miles) at [${lat}, ${lon}]`);
        }
        console.log(`🔗 BLM National Nonmotorized Trails Proximity Query URL (offset ${resultOffset}): ${proximityUrl}`);
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        // Log the full response for debugging
        console.log(`📊 BLM National Nonmotorized Trails Proximity Response (offset ${resultOffset}):`, {
          hasError: !!proximityData.error,
          error: proximityData.error,
          featureCount: proximityData.features?.length || 0,
          hasFeatures: !!proximityData.features,
          exceededTransferLimit: proximityData.exceededTransferLimit
        });
        
        if (proximityData.error) {
          console.error('❌ BLM National Nonmotorized Trails API Error:', proximityData.error);
          break;
        }
        
        if (!proximityData.features || proximityData.features.length === 0) {
          hasMore = false;
          break;
        }
        
        allFeatures.push(...proximityData.features);
        console.log(`📦 Fetched batch: ${proximityData.features.length} nonmotorized trail segments (total so far: ${allFeatures.length})`);
        
        // Check if there are more records to fetch
        if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
          resultOffset += batchSize;
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }
      
      console.log(`✅ Fetched ${allFeatures.length} total BLM National Nonmotorized Trail segments (${Math.ceil(allFeatures.length / batchSize)} batches)`);
      
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
          
          // Only include trails within the specified radius
          if (distance_miles <= radiusMiles!) {
            const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
            const routeName = attributes.ROUTE_PRMRY_NM || attributes.Route_Prmry_Nm || attributes.route_prmry_nm || null;
            const adminState = attributes.ADMIN_ST || attributes.Admin_St || attributes.admin_st || null;
            const assetClass = attributes.PLAN_ASSET_CLASS || attributes.Plan_Asset_Class || attributes.plan_asset_class || null;
            const modeTransport = attributes.PLAN_MODE_TRNSPRT || attributes.Plan_Mode_Trnsprt || attributes.plan_mode_trnsprt || null;
            const routeUseClass = attributes.OBSRVE_ROUTE_USE_CLASS || attributes.Obsrve_Route_Use_Class || attributes.obsrve_route_use_class || null;
            const ohvRouteDesignation = attributes.PLAN_OHV_ROUTE_DSGNTN || attributes.Plan_Ohv_Route_Dsgntn || attributes.plan_ohv_route_dsgntn || null;
            const gisMiles = attributes.GIS_MILES !== null && attributes.GIS_MILES !== undefined ? Number(attributes.GIS_MILES) : null;
            const blmMiles = attributes.BLM_MILES !== null && attributes.BLM_MILES !== undefined ? Number(attributes.BLM_MILES) : null;
            
            features.push({
              objectId: objectId,
              routeName: routeName,
              adminState: adminState,
              assetClass: assetClass,
              modeTransport: modeTransport,
              routeUseClass: routeUseClass,
              ohvRouteDesignation: ohvRouteDesignation,
              gisMiles: gisMiles,
              blmMiles: blmMiles,
              geometry: geometry,
              distance_miles: Number(distance_miles.toFixed(2)),
              attributes: attributes
            });
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ BLM National Nonmotorized Trails: Proximity query failed:', error);
    }
    
    // Sort by distance
    features.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ BLM National Nonmotorized Trails: Found ${features.length} nonmotorized trail segment(s)`);
    return features;
  } catch (error) {
    console.error('❌ Error querying BLM National Nonmotorized Trails data:', error);
    throw error;
  }
}

