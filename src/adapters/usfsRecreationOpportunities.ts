/**
 * USFS Recreation Opportunities Adapter
 * Queries USFS Recreation Opportunities point feature service
 * Supports proximity queries up to 100 miles
 */

const BASE_SERVICE_URL = 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RecreationOpportunities_01/MapServer/0';

export interface USFSRecreationOpportunityInfo {
  objectId: string | null;
  recAreaName: string | null;
  forestName: string | null;
  markerActivity: string | null;
  markerActivityGroup: string | null;
  openSeasonStart: string | null;
  openSeasonEnd: string | null;
  recAreaUrl: string | null;
  recAreaId: string | null;
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
 * Query USFS Recreation Opportunities within proximity of a location
 * Supports proximity queries up to 100 miles
 */
export async function getUSFSRecreationOpportunitiesData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<USFSRecreationOpportunityInfo[]> {
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
        console.log(`🏕️ Querying USFS Recreation Opportunities for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
      }
      
      const proximityData = await fetchJSONSmart(proximityUrl) as any;
      
      if (proximityData.error) {
        console.error('❌ USFS Recreation Opportunities API Error:', proximityData.error);
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
    
    console.log(`✅ Fetched ${allFeatures.length} total USFS Recreation Opportunities for proximity`);
    
    const results: USFSRecreationOpportunityInfo[] = [];
    
    // Process proximity features
    allFeatures.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
        const distance = calculateDistance(lat, lon, geometry.y, geometry.x);
        
        if (distance <= maxRadius) {
          const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
          const recAreaName = attributes.RECAREANAME || attributes.RecAreaName || attributes.recareaname || attributes.NAME || attributes.Name || attributes.name || null;
          const forestName = attributes.FORESTNAME || attributes.ForestName || attributes.forestname || null;
          const markerActivity = attributes.MARKERACTIVITY || attributes.MarkerActivity || attributes.markeractivity || null;
          const markerActivityGroup = attributes.MARKERACTIVITYGROUP || attributes.MarkerActivityGroup || attributes.markeractivitygroup || null;
          const openSeasonStart = attributes.OPEN_SEASON_START || attributes.Open_Season_Start || attributes.open_season_start || null;
          const openSeasonEnd = attributes.OPEN_SEASON_END || attributes.Open_Season_End || attributes.open_season_end || null;
          const recAreaUrl = attributes.RECAREAURL || attributes.RecAreaUrl || attributes.recareaurl || null;
          const recAreaId = attributes.RECAREAID !== null && attributes.RECAREAID !== undefined ? attributes.RECAREAID.toString() : null;
          
          results.push({
            objectId: objectId,
            recAreaName: recAreaName,
            forestName: forestName,
            markerActivity: markerActivity,
            markerActivityGroup: markerActivityGroup,
            openSeasonStart: openSeasonStart,
            openSeasonEnd: openSeasonEnd,
            recAreaUrl: recAreaUrl,
            recAreaId: recAreaId,
            geometry: geometry,
            distance_miles: Number(distance.toFixed(2)),
            attributes: attributes
          });
        }
      }
    });
    
    // Sort by distance
    results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ USFS Recreation Opportunities: Found ${results.length} recreation opportunity(ies)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying USFS Recreation Opportunities data:', error);
    throw error;
  }
}

