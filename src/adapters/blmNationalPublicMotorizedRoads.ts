/**
 * BLM National GTLF Public Motorized Roads Adapter
 * Queries BLM National GTLF Public Motorized Roads linear feature service
 * Supports proximity queries up to 50 miles
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_GTLF_Public_Motorized_Roads/FeatureServer/3';

export interface BLMNationalPublicMotorizedRoadInfo {
  objectId: string | null;
  routePrimaryName: string | null;
  routeSecondarySpecialDesignationName: string | null;
  adminState: string | null;
  planAssetClass: string | null;
  planModeTransport: string | null;
  planOhvRouteDsgntn: string | null;
  observeRouteUseClass: string | null;
  gisMiles: number | null;
  blmMiles: number | null;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  attributes: Record<string, any>;
}

/**
 * Calculate distance from point to nearest point on polyline
 */
function distanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  if (!paths || paths.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  paths.forEach((path: number[][]) => {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      // Calculate distance to line segment
      const dist = distanceToLineSegment(lat, lon, p1[1], p1[0], p2[1], p2[0]);
      if (dist < minDistance) minDistance = dist;
    }
  });
  
  return minDistance;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(
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
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
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
  
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Query BLM National GTLF Public Motorized Roads for proximity
 * Supports proximity queries up to 50 miles
 */
export async function getBLMNationalPublicMotorizedRoadsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<BLMNationalPublicMotorizedRoadInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 50 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 50.0) : 50.0;
    
    if (maxRadius <= 0) {
      return [];
    }
    
    const radiusMeters = maxRadius * 1609.34;
    const proximityGeometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const allFeatures: any[] = [];
    let resultOffset = 0;
    const batchSize = 2000;
    let hasMore = true;
    
    while (hasMore) {
      const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
      
      if (resultOffset === 0) {
        console.log(`🛣️ Querying BLM National GTLF Public Motorized Roads for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
      }
      
      const proximityData = await fetchJSONSmart(proximityUrl) as any;
      
      if (proximityData.error) {
        console.error('❌ BLM Public Motorized Roads API Error:', proximityData.error);
        break;
      }
      
      if (!proximityData.features || proximityData.features.length === 0) {
        hasMore = false;
        break;
      }
      
      allFeatures.push(...proximityData.features);
      
      if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
        resultOffset += batchSize;
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        hasMore = false;
      }
    }
    
    console.log(`✅ Fetched ${allFeatures.length} total BLM Public Motorized Roads for proximity`);
    
    const results: BLMNationalPublicMotorizedRoadInfo[] = [];
    
    // Process proximity features
    allFeatures.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      if (geometry && geometry.paths) {
        const distance = distanceToPolyline(lat, lon, geometry.paths);
        const distanceMiles = distance * 69; // Approximate conversion (1 degree lat ≈ 69 miles)
        
        if (distanceMiles <= maxRadius) {
          const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
          const routePrimaryName = attributes.ROUTE_PRMRY_NM || attributes.Route_Prmy_Nm || attributes.route_prmry_nm || null;
          const routeSecondarySpecialDesignationName = attributes.ROUTE_SCNDRY_SPCL_DSGNTN_NM || attributes.Route_Scndry_Spcl_Dsgntn_Nm || attributes.route_scndry_spcl_dsgntn_nm || null;
          const adminState = attributes.ADMIN_ST || attributes.Admin_St || attributes.admin_st || null;
          const planAssetClass = attributes.PLAN_ASSET_CLASS || attributes.Plan_Asset_Class || attributes.plan_asset_class || null;
          const planModeTransport = attributes.PLAN_MODE_TRNSPRT || attributes.Plan_Mode_Trnsprt || attributes.plan_mode_trnsprt || null;
          const planOhvRouteDsgntn = attributes.PLAN_OHV_ROUTE_DSGNTN || attributes.Plan_Ohv_Route_Dsgntn || attributes.plan_ohv_route_dsgntn || null;
          const observeRouteUseClass = attributes.OBSRVE_ROUTE_USE_CLASS || attributes.Obsrve_Route_Use_Class || attributes.obsrve_route_use_class || null;
          const gisMiles = attributes.GIS_MILES !== null && attributes.GIS_MILES !== undefined ? Number(attributes.GIS_MILES) : null;
          const blmMiles = attributes.BLM_MILES !== null && attributes.BLM_MILES !== undefined ? Number(attributes.BLM_MILES) : null;
          
          results.push({
            objectId: objectId,
            routePrimaryName: routePrimaryName,
            routeSecondarySpecialDesignationName: routeSecondarySpecialDesignationName,
            adminState: adminState,
            planAssetClass: planAssetClass,
            planModeTransport: planModeTransport,
            planOhvRouteDsgntn: planOhvRouteDsgntn,
            observeRouteUseClass: observeRouteUseClass,
            gisMiles: gisMiles,
            blmMiles: blmMiles,
            geometry: geometry,
            distance_miles: Number(distanceMiles.toFixed(2)),
            attributes: attributes
          });
        }
      }
    });
    
    // Sort by distance
    results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ BLM National GTLF Public Motorized Roads: Found ${results.length} road(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying BLM National GTLF Public Motorized Roads data:', error);
    throw error;
  }
}

