/**
 * South Carolina Coastal Well Inventory Adapter
 * Queries SC Coastal Plain Well Inventory points from ArcGIS FeatureServer
 * Supports proximity queries up to 10 miles
 * Layer: SCDNR_Coastal_Plain_Well_Inventory (Layer 0) - Points
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/acgZYxoN5Oj8pDLa/ArcGIS/rest/services/SCDNR_Coastal_Plain_Well_Inventory/FeatureServer';
const LAYER_ID = 0;

export interface SCCoastalWellInfo {
  objectid1: number | null;
  objectid: number | null;
  wellId: string | null;
  scGrid: string | null;
  latDDNAD83: number | null;
  lonDDNAD83: number | null;
  topo: string | null;
  elev: number | null;
  owner: string | null;
  wellUse: string | null;
  depthD: number | null;
  depthC: number | null;
  diam1: number | null;
  diam2: string | null;
  ohCas: string | null;
  screenT: number | null;
  screenB: number | null;
  drillYr: string | null;
  drillMo: string | null;
  yield: number | null;
  yieldYr: string | null;
  gLogs: string | null;
  dLogs: number | null;
  pTest: number | null;
  chem: string | null;
  scgsSamples: string | null;
  wlQ: string | null;
  wlFt: string | null;
  wlYr: string | null;
  driller: string | null;
  remarks: string | null;
  county: string | null;
  globalId: string | null;
  dLogsText: string | null;
  pTestText: string | null;
  attributes: Record<string, any>;
  lat: number;
  lon: number;
  distance_miles?: number;
}

/**
 * Query SC Coastal Well Inventory for proximity
 * Supports proximity queries up to 10 miles
 */
export async function getSCCoastalWellInventoryData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<SCCoastalWellInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 10 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 10.0) : 10.0;
    
    if (maxRadius <= 0) {
      return [];
    }
    
    const results: SCCoastalWellInfo[] = [];
    const processedIds = new Set<number | string>();
    
    // Proximity query with pagination
    try {
      const radiusMeters = maxRadius * 1609.34;
      const proximityGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const allFeatures: any[] = [];
      let resultOffset = 0;
      const batchSize = 5000; // Max record count is 5000
      let hasMore = true;
      
      while (hasMore) {
        const proximityUrl = `${BASE_SERVICE_URL}/${LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        
        if (resultOffset === 0) {
          console.log(`💧 Querying SC Coastal Well Inventory for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
        }
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityData.error) {
          console.error('❌ SC Coastal Well Inventory API Error:', proximityData.error);
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
      
      console.log(`✅ Fetched ${allFeatures.length} total SC Coastal Well Inventory features for proximity`);
      
      // Process all features and calculate accurate distances
      allFeatures.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || {};
        
        // Extract coordinates from geometry (point geometry has x, y)
        // ESRI geometry: x is longitude, y is latitude
        const destLon = geometry.x !== null && geometry.x !== undefined ? geometry.x : (attributes.Lon_DD_NAD83 || attributes.lon_DD_NAD83 || null);
        const destLat = geometry.y !== null && geometry.y !== undefined ? geometry.y : (attributes.Lat_DD_NAD83 || attributes.lat_DD_NAD83 || null);
        
        if (destLat === null || destLon === null || typeof destLat !== 'number' || typeof destLon !== 'number') {
          return; // Skip features without valid coordinates
        }
        
        // Calculate accurate distance from search point to well point
        const R = 3959; // Earth's radius in miles
        const dLat = (destLat - lat) * Math.PI / 180;
        const dLon = (destLon - lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        // Only include features within the specified radius
        if (distance <= maxRadius) {
          const objectid1 = attributes.OBJECTID_1 !== null && attributes.OBJECTID_1 !== undefined ? attributes.OBJECTID_1 : null;
          const objectid = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID : null;
          const uniqueId = objectid1 !== null ? objectid1 : (objectid !== null ? objectid : (attributes.GlobalID || null));
          
          // Skip duplicates
          if (uniqueId !== null && processedIds.has(uniqueId)) {
            return;
          }
          
          const wellId = attributes.WELL_ID || attributes.well_id || attributes.Well_Id || null;
          const scGrid = attributes.SC_GRID || attributes.sc_grid || attributes.Sc_Grid || null;
          const latDDNAD83 = attributes.Lat_DD_NAD83 || attributes.lat_DD_NAD83 || null;
          const lonDDNAD83 = attributes.Lon_DD_NAD83 || attributes.lon_DD_NAD83 || null;
          const topo = attributes.TOPO || attributes.topo || attributes.Topo || null;
          const elev = attributes.ELEV !== null && attributes.ELEV !== undefined ? attributes.ELEV : null;
          const owner = attributes.OWNER || attributes.owner || attributes.Owner || null;
          const wellUse = attributes.WELL_USE || attributes.well_use || attributes.Well_Use || null;
          const depthD = attributes.DEPTH_D !== null && attributes.DEPTH_D !== undefined ? attributes.DEPTH_D : null;
          const depthC = attributes.DEPTH_C !== null && attributes.DEPTH_C !== undefined ? attributes.DEPTH_C : null;
          const diam1 = attributes.DIAM_1 !== null && attributes.DIAM_1 !== undefined ? attributes.DIAM_1 : null;
          const diam2 = attributes.DIAM_2 || attributes.diam_2 || attributes.Diam_2 || null;
          const ohCas = attributes.OH_CAS || attributes.oh_cas || attributes.Oh_Cas || null;
          const screenT = attributes.SCREEN_T !== null && attributes.SCREEN_T !== undefined ? attributes.SCREEN_T : null;
          const screenB = attributes.SCREEN_B !== null && attributes.SCREEN_B !== undefined ? attributes.SCREEN_B : null;
          const drillYr = attributes.DRILL_YR || attributes.drill_yr || attributes.Drill_Yr || null;
          const drillMo = attributes.DRILL_MO || attributes.drill_mo || attributes.Drill_Mo || null;
          const yieldVal = attributes.YIELD !== null && attributes.YIELD !== undefined ? attributes.YIELD : null;
          const yieldYr = attributes.YIELD_YR || attributes.yield_yr || attributes.Yield_Yr || null;
          const gLogs = attributes.G_LOGS || attributes.g_logs || attributes.G_Logs || null;
          const dLogs = attributes.D_LOGS !== null && attributes.D_LOGS !== undefined ? attributes.D_LOGS : null;
          const pTest = attributes.P_TEST !== null && attributes.P_TEST !== undefined ? attributes.P_TEST : null;
          const chem = attributes.CHEM || attributes.chem || attributes.Chem || null;
          const scgsSamples = attributes.SCGS_Samples || attributes.scgs_samples || attributes.Scgs_Samples || null;
          const wlQ = attributes.WL_Q || attributes.wl_q || attributes.Wl_Q || null;
          const wlFt = attributes.WL_FT || attributes.wl_ft || attributes.Wl_Ft || null;
          const wlYr = attributes.WL_YR || attributes.wl_yr || attributes.Wl_Yr || null;
          const driller = attributes.DRILLER || attributes.driller || attributes.Driller || null;
          const remarks = attributes.REMARKS || attributes.remarks || attributes.Remarks || null;
          const county = attributes.COUNTY || attributes.county || attributes.County || null;
          const globalId = attributes.GlobalID || attributes.globalID || attributes.globalId || null;
          const dLogsText = attributes.D_Logs_Text || attributes.d_logs_text || attributes.D_Logs_Text || null;
          const pTestText = attributes.P_Test_Text || attributes.p_test_text || attributes.P_Test_Text || null;
          
          results.push({
            objectid1: objectid1,
            objectid: objectid,
            wellId: wellId,
            scGrid: scGrid,
            latDDNAD83: latDDNAD83,
            lonDDNAD83: lonDDNAD83,
            topo: topo,
            elev: elev,
            owner: owner,
            wellUse: wellUse,
            depthD: depthD,
            depthC: depthC,
            diam1: diam1,
            diam2: diam2,
            ohCas: ohCas,
            screenT: screenT,
            screenB: screenB,
            drillYr: drillYr,
            drillMo: drillMo,
            yield: yieldVal,
            yieldYr: yieldYr,
            gLogs: gLogs,
            dLogs: dLogs,
            pTest: pTest,
            chem: chem,
            scgsSamples: scgsSamples,
            wlQ: wlQ,
            wlFt: wlFt,
            wlYr: wlYr,
            driller: driller,
            remarks: remarks,
            county: county,
            globalId: globalId,
            dLogsText: dLogsText,
            pTestText: pTestText,
            attributes: attributes,
            lat: destLat,
            lon: destLon,
            distance_miles: distance
          });
          
          if (uniqueId !== null) {
            processedIds.add(uniqueId);
          }
        }
      });
      
      // Sort by distance
      results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
      
      console.log(`✅ Found ${results.length} SC Coastal Well(s) within ${maxRadius} miles`);
    } catch (error) {
      console.error('❌ Proximity query failed for SC Coastal Well Inventory:', error);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error querying SC Coastal Well Inventory data:', error);
    return [];
  }
}

