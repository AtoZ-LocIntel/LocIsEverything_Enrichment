import { fetchJSONSmart } from '../services/EnrichmentService';

export interface PortWatchChokepointInfo {
  portid: string;
  portname: string;
  country: string;
  ISO3: string;
  continent: string;
  fullname: string;
  lat: number;
  lon: number;
  vessel_count_total: number;
  vessel_count_container: number;
  vessel_count_dry_bulk: number;
  vessel_count_general_cargo: number;
  vessel_count_RoRo: number;
  vessel_count_tanker: number;
  industry_top1: string;
  industry_top2: string;
  industry_top3: string;
  share_country_maritime_import: number;
  share_country_maritime_export: number;
  LOCODE: string;
  pageid: string;
  countrynoaccents: string;
  ObjectId: number;
  distance_miles?: number;
  geometry?: any;
}

const BASE_SERVICE_URL = 'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/ArcGIS/rest/services/PortWatch_chokepoints_database/FeatureServer';
const LAYER_ID = 0;
const MAX_RADIUS_MILES = 100;

/**
 * Query Port Watch Chokepoints point layer with proximity support
 * Note: This is a point layer, so only proximity queries are supported (no point-in-polygon)
 */
export async function getPortWatchChokepointsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<PortWatchChokepointInfo[]> {
  try {
    const maxRecordCount = 1000;
    const cappedRadius = Math.min(radiusMiles || 0, MAX_RADIUS_MILES);
    
    console.log(`🌊 Port Watch Chokepoints query for coordinates [${lat}, ${lon}] within ${cappedRadius} miles`);

    if (cappedRadius <= 0) {
      console.log(`⚠️ Port Watch Chokepoints requires a radius for proximity query`);
      return [];
    }

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;

    // Proximity query (intersects with distance) - point layer only supports proximity
    while (hasMore) {
      const radiusMeters = cappedRadius * 1609.34;
      const proximityQueryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
      proximityQueryUrl.searchParams.set('f', 'json');
      proximityQueryUrl.searchParams.set('where', '1=1');
      proximityQueryUrl.searchParams.set('outFields', '*');
      proximityQueryUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      proximityQueryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      proximityQueryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      proximityQueryUrl.searchParams.set('distance', radiusMeters.toString());
      proximityQueryUrl.searchParams.set('units', 'esriSRUnit_Meter');
      proximityQueryUrl.searchParams.set('inSR', '4326');
      proximityQueryUrl.searchParams.set('outSR', '4326');
      proximityQueryUrl.searchParams.set('returnGeometry', 'true');
      proximityQueryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      proximityQueryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      if (resultOffset === 0) {
        console.log(`📊 Querying Port Watch Chokepoints for proximity (${cappedRadius} miles) at [${lat}, ${lon}]`);
      }
      
      try {
        const proximityResponse = await fetchJSONSmart(proximityQueryUrl.toString());
        
        if (proximityResponse.error) {
          console.error(`❌ Port Watch Chokepoints proximity query error:`, proximityResponse.error);
          break;
        }
        
        if (!proximityResponse.features || proximityResponse.features.length === 0) {
          hasMore = false;
          break;
        }
        
        allFeatures = allFeatures.concat(proximityResponse.features);
        
        if (proximityResponse.exceededTransferLimit === true || 
            (proximityResponse.features && proximityResponse.features.length >= maxRecordCount)) {
          resultOffset += maxRecordCount;
          hasMore = true;
        } else {
          hasMore = false;
        }
      } catch (error: any) {
        console.error(`❌ Port Watch Chokepoints proximity query failed:`, error);
        hasMore = false;
      }
    }

    // Process features and calculate distances
    const results: PortWatchChokepointInfo[] = allFeatures.map((feature: any) => {
      const attrs = feature.attributes || {};
      const geom = feature.geometry;
      
      // Calculate distance for proximity features
      let distance_miles: number | undefined;
      if (geom && attrs.lat && attrs.lon) {
        // Use provided lat/lon from attributes if available
        const R = 3959; // Earth's radius in miles
        const dLat = (lat - attrs.lat) * Math.PI / 180;
        const dLon = (lon - attrs.lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(attrs.lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance_miles = R * c;
      } else if (geom && geom.x && geom.y) {
        // Use geometry coordinates if attributes don't have lat/lon
        const R = 3959;
        const dLat = (lat - geom.y) * Math.PI / 180;
        const dLon = (lon - geom.x) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(geom.y * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance_miles = R * c;
      }
      
      return {
        portid: attrs.portid || '',
        portname: attrs.portname || '',
        country: attrs.country || '',
        ISO3: attrs.ISO3 || '',
        continent: attrs.continent || '',
        fullname: attrs.fullname || '',
        lat: attrs.lat || geom?.y || 0,
        lon: attrs.lon || geom?.x || 0,
        vessel_count_total: attrs.vessel_count_total || 0,
        vessel_count_container: attrs.vessel_count_container || 0,
        vessel_count_dry_bulk: attrs.vessel_count_dry_bulk || 0,
        vessel_count_general_cargo: attrs.vessel_count_general_cargo || 0,
        vessel_count_RoRo: attrs.vessel_count_RoRo || 0,
        vessel_count_tanker: attrs.vessel_count_tanker || 0,
        industry_top1: attrs.industry_top1 || '',
        industry_top2: attrs.industry_top2 || '',
        industry_top3: attrs.industry_top3 || '',
        share_country_maritime_import: attrs.share_country_maritime_import || 0,
        share_country_maritime_export: attrs.share_country_maritime_export || 0,
        LOCODE: attrs.LOCODE || '',
        pageid: attrs.pageid || '',
        countrynoaccents: attrs.countrynoaccents || '',
        ObjectId: attrs.ObjectId || attrs.OBJECTID || attrs.objectid || 0,
        distance_miles: distance_miles,
        geometry: geom
      };
    });

    console.log(`✅ Port Watch Chokepoints query completed: ${results.length} features found`);
    return results;
  } catch (error: any) {
    console.error('❌ Port Watch Chokepoints query error:', error);
    return [];
  }
}

/**
 * Query ALL Port Watch Chokepoints globally (no spatial constraints)
 * Used for global visualization of all chokepoint data
 */
export async function getAllPortWatchChokepointsData(): Promise<PortWatchChokepointInfo[]> {
  try {
    const maxRecordCount = 1000;
    console.log(`🌊 Querying ALL Port Watch Chokepoints globally`);
    
    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
      queryUrl.searchParams.set('f', 'json');
      queryUrl.searchParams.set('where', '1=1');
      queryUrl.searchParams.set('outFields', '*');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      if (resultOffset === 0) {
        console.log(`📊 Querying ALL Port Watch Chokepoints (no spatial filter)`);
      }
      
      try {
        const response = await fetchJSONSmart(queryUrl.toString());
        
        if (response.error) {
          console.error(`❌ Port Watch Chokepoints query error:`, response.error);
          break;
        }
        
        if (!response.features || response.features.length === 0) {
          hasMore = false;
          break;
        }
        
        allFeatures = allFeatures.concat(response.features);
        
        if (response.exceededTransferLimit === true || response.features.length >= maxRecordCount) {
          resultOffset += maxRecordCount;
          hasMore = true;
        } else {
          hasMore = false;
        }
      } catch (error: any) {
        console.error(`❌ Port Watch Chokepoints query failed:`, error);
        hasMore = false;
      }
    }
    
    const results: PortWatchChokepointInfo[] = allFeatures.map((feature: any) => {
      const attrs = feature.attributes || {};
      const geom = feature.geometry;
      
      return {
        portid: attrs.portid || '',
        portname: attrs.portname || '',
        country: attrs.country || '',
        ISO3: attrs.ISO3 || '',
        continent: attrs.continent || '',
        fullname: attrs.fullname || '',
        lat: attrs.lat || geom?.y || 0,
        lon: attrs.lon || geom?.x || 0,
        vessel_count_total: attrs.vessel_count_total || 0,
        vessel_count_container: attrs.vessel_count_container || 0,
        vessel_count_dry_bulk: attrs.vessel_count_dry_bulk || 0,
        vessel_count_general_cargo: attrs.vessel_count_general_cargo || 0,
        vessel_count_RoRo: attrs.vessel_count_RoRo || 0,
        vessel_count_tanker: attrs.vessel_count_tanker || 0,
        industry_top1: attrs.industry_top1 || '',
        industry_top2: attrs.industry_top2 || '',
        industry_top3: attrs.industry_top3 || '',
        share_country_maritime_import: attrs.share_country_maritime_import || 0,
        share_country_maritime_export: attrs.share_country_maritime_export || 0,
        LOCODE: attrs.LOCODE || '',
        pageid: attrs.pageid || '',
        countrynoaccents: attrs.countrynoaccents || '',
        ObjectId: attrs.ObjectId || attrs.OBJECTID || attrs.objectid || 0,
        geometry: geom
      };
    });
    
    console.log(`✅ Retrieved ${results.length} Port Watch Chokepoints globally`);
    return results;
  } catch (error: any) {
    console.error('❌ Error querying all Port Watch Chokepoints:', error);
    return [];
  }
}
