import { fetchJSONSmart } from '../services/EnrichmentService';

export interface PortWatchDisruptionInfo {
  eventid: number;
  eventtype: string;
  eventname: string;
  htmlname: string;
  htmldescription: string;
  alertlevel: string;
  country: string;
  fromdate: string;
  year: number;
  todate: string;
  severitytext: string;
  lat: number;
  long: number;
  editdate: string;
  affectedports: string;
  n_affectedports: number;
  affectedpopulation: string;
  pageid: string;
  ObjectId: number;
  distance_miles?: number;
  isContaining?: boolean;
  geometry?: any;
}

const BASE_SERVICE_URL = 'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/ArcGIS/rest/services/portwatch_disruptions_database/FeatureServer';
const LAYER_ID = 0;
const MAX_RADIUS_MILES = 100;

/**
 * Query Port Watch Disruptions polygon layer with point-in-polygon and proximity support
 */
export async function getPortWatchDisruptionsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<PortWatchDisruptionInfo[]> {
  try {
    const maxRecordCount = 2000;
    const cappedRadius = Math.min(radiusMiles || 0, MAX_RADIUS_MILES);
    
    console.log(`🌊 Port Watch Disruptions query for coordinates [${lat}, ${lon}] within ${cappedRadius} miles`);

    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;
    const containsObjectIdsSet = new Set<number>(); // Track object IDs from contains query

    // First, try point-in-polygon query (contains)
    if (resultOffset === 0) {
      try {
        const containsQueryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
        containsQueryUrl.searchParams.set('f', 'json');
        containsQueryUrl.searchParams.set('where', '1=1');
        containsQueryUrl.searchParams.set('outFields', '*');
        containsQueryUrl.searchParams.set('geometry', JSON.stringify({
          x: lon,
          y: lat,
          spatialReference: { wkid: 4326 }
        }));
        containsQueryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
        containsQueryUrl.searchParams.set('spatialRel', 'esriSpatialRelWithin');
        containsQueryUrl.searchParams.set('inSR', '4326');
        containsQueryUrl.searchParams.set('outSR', '4326');
        containsQueryUrl.searchParams.set('returnGeometry', 'true');
        containsQueryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
        
        console.log(`🔍 Port Watch Disruptions point-in-polygon query URL: ${containsQueryUrl.toString()}`);
        const containsResponse = await fetchJSONSmart(containsQueryUrl.toString());
        
        if (containsResponse.error) {
          console.warn(`⚠️ Port Watch Disruptions point-in-polygon query error: ${JSON.stringify(containsResponse.error)}`);
        } else if (containsResponse.features && Array.isArray(containsResponse.features) && containsResponse.features.length > 0) {
          const containsFeatures = containsResponse.features;
          containsFeatures.forEach((f: any) => {
            const objectid = f.attributes?.ObjectId || f.attributes?.OBJECTID || f.attributes?.objectid || 0;
            containsObjectIdsSet.add(objectid);
          });
          const containsFeaturesWithFlag = containsFeatures.map((f: any) => ({ ...f, _fromContains: true }));
          allFeatures = allFeatures.concat(containsFeaturesWithFlag);
          console.log(`✅ Port Watch Disruptions point-in-polygon found ${containsFeatures.length} features`);
        }
      } catch (error: any) {
        console.warn(`⚠️ Port Watch Disruptions point-in-polygon query failed:`, error);
      }
    }

    // Then, try proximity query (intersects with distance) if radius is provided
    if (cappedRadius > 0) {
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
          console.log(`📊 Querying Port Watch Disruptions for proximity (${cappedRadius} miles) at [${lat}, ${lon}]`);
        }
        
        try {
          const proximityResponse = await fetchJSONSmart(proximityQueryUrl.toString());
          
          if (proximityResponse.error) {
            console.error(`❌ Port Watch Disruptions proximity query error:`, proximityResponse.error);
            break;
          }
          
          if (!proximityResponse.features || proximityResponse.features.length === 0) {
            hasMore = false;
            break;
          }
          
          // Filter out features already found in contains query
          const newFeatures = proximityResponse.features.filter((f: any) => {
            const objectid = f.attributes?.ObjectId || f.attributes?.OBJECTID || f.attributes?.objectid || 0;
            return !containsObjectIdsSet.has(objectid);
          });
          
          allFeatures = allFeatures.concat(newFeatures);
          
          if (proximityResponse.exceededTransferLimit === true || 
              (proximityResponse.features && proximityResponse.features.length >= maxRecordCount)) {
            resultOffset += maxRecordCount;
            hasMore = true;
          } else {
            hasMore = false;
          }
        } catch (error: any) {
          console.error(`❌ Port Watch Disruptions proximity query failed:`, error);
          hasMore = false;
        }
      }
    }

    // Process features and calculate distances
    const results: PortWatchDisruptionInfo[] = allFeatures.map((feature: any) => {
      const attrs = feature.attributes || {};
      const geom = feature.geometry;
      
      // Calculate distance for proximity features
      let distance_miles: number | undefined;
      if (!feature._fromContains && geom && attrs.lat && attrs.long) {
        // Use provided lat/long from attributes if available
        const R = 3959; // Earth's radius in miles
        const dLat = (lat - attrs.lat) * Math.PI / 180;
        const dLon = (lon - attrs.long) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(attrs.lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance_miles = R * c;
      }
      
      return {
        eventid: attrs.eventid || 0,
        eventtype: attrs.eventtype || '',
        eventname: attrs.eventname || '',
        htmlname: attrs.htmlname || '',
        htmldescription: attrs.htmldescription || '',
        alertlevel: attrs.alertlevel || '',
        country: attrs.country || '',
        fromdate: attrs.fromdate || '',
        year: attrs.year || 0,
        todate: attrs.todate || '',
        severitytext: attrs.severitytext || '',
        lat: attrs.lat || 0,
        long: attrs.long || 0,
        editdate: attrs.editdate || '',
        affectedports: attrs.affectedports || '',
        n_affectedports: attrs.n_affectedports || 0,
        affectedpopulation: attrs.affectedpopulation || '',
        pageid: attrs.pageid || '',
        ObjectId: attrs.ObjectId || attrs.OBJECTID || attrs.objectid || 0,
        distance_miles: distance_miles,
        isContaining: feature._fromContains || false,
        geometry: geom
      };
    });

    console.log(`✅ Port Watch Disruptions query completed: ${results.length} features found`);
    return results;
  } catch (error: any) {
    console.error('❌ Port Watch Disruptions query error:', error);
    return [];
  }
}

/**
 * Query ALL Port Watch Disruptions globally (no spatial constraints)
 * Used for global visualization of all disruption data
 */
export async function getAllPortWatchDisruptionsData(): Promise<PortWatchDisruptionInfo[]> {
  try {
    const maxRecordCount = 2000;
    console.log(`🌊 Querying ALL Port Watch Disruptions globally`);
    
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
        console.log(`📊 Querying ALL Port Watch Disruptions (no spatial filter)`);
      }
      
      try {
        const response = await fetchJSONSmart(queryUrl.toString());
        
        if (response.error) {
          console.error(`❌ Port Watch Disruptions query error:`, response.error);
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
        console.error(`❌ Port Watch Disruptions query failed:`, error);
        hasMore = false;
      }
    }
    
    const results: PortWatchDisruptionInfo[] = allFeatures.map((feature: any) => {
      const attrs = feature.attributes || {};
      return {
        eventid: attrs.eventid || 0,
        eventtype: attrs.eventtype || '',
        eventname: attrs.eventname || '',
        htmlname: attrs.htmlname || '',
        htmldescription: attrs.htmldescription || '',
        alertlevel: attrs.alertlevel || '',
        country: attrs.country || '',
        fromdate: attrs.fromdate || '',
        year: attrs.year || 0,
        todate: attrs.todate || '',
        severitytext: attrs.severitytext || '',
        lat: attrs.lat || 0,
        long: attrs.long || 0,
        editdate: attrs.editdate || '',
        affectedports: attrs.affectedports || '',
        n_affectedports: attrs.n_affectedports || 0,
        affectedpopulation: attrs.affectedpopulation || '',
        pageid: attrs.pageid || '',
        ObjectId: attrs.ObjectId || attrs.OBJECTID || attrs.objectid || 0,
        geometry: feature.geometry
      };
    });
    
    console.log(`✅ Retrieved ${results.length} Port Watch Disruptions globally`);
    return results;
  } catch (error: any) {
    console.error('❌ Error querying all Port Watch Disruptions:', error);
    return [];
  }
}
