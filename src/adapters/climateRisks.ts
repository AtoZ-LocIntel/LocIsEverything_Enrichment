/**
 * Adapter for Scenarios Climate Risks ArcGIS Feature Service
 * Service URL: https://services9.arcgis.com/weJ1QsnbMYJlCHdG/ArcGIS/rest/services/scenarios_climate_risks/FeatureServer/0
 */

export interface ClimateRiskInfo {
  objectId: string | null;
  // RCP26 (Representative Concentration Pathway 2.6) - Low emissions scenario
  rcp26_coast_dwt?: number | null;
  rcp26_fluv_dwt?: number | null;
  rcp26_pluv_dwt?: number | null;
  rcp26_total_dwt?: number | null;
  rcp26_tc_dam?: number | null;
  rcp26_coast_dam?: number | null;
  rcp26_fluv_dam?: number | null;
  rcp26_pluv_dam?: number | null;
  rcp26_total_dam?: number | null;
  rcp26_eq_dam?: number | null;
  
  // RCP45 (Representative Concentration Pathway 4.5) - Medium emissions scenario
  rcp45_coast_dwt?: number | null;
  rcp45_fluv_dwt?: number | null;
  rcp45_pluv_dwt?: number | null;
  rcp45_total_dwt?: number | null;
  rcp45_tc_dam?: number | null;
  rcp45_coast_dam?: number | null;
  rcp45_fluv_dam?: number | null;
  rcp45_pluv_dam?: number | null;
  rcp45_total_dam?: number | null;
  rcp45_eq_dam?: number | null;
  
  // RCP85 (Representative Concentration Pathway 8.5) - High emissions scenario
  rcp85_coast_dwt?: number | null;
  rcp85_fluv_dwt?: number | null;
  rcp85_pluv_dwt?: number | null;
  rcp85_total_dwt?: number | null;
  rcp85_tc_dam?: number | null;
  rcp85_coast_dam?: number | null;
  rcp85_fluv_dam?: number | null;
  rcp85_pluv_dam?: number | null;
  rcp85_total_dam?: number | null;
  rcp85_eq_dam?: number | null;
  
  // PR (Present-day/Historical) scenario
  pr_coast_dwt?: number | null;
  pr_fluv_dwt?: number | null;
  pr_pluv_dwt?: number | null;
  pr_total_dwt?: number | null;
  pr_tc_dam?: number | null;
  pr_coast_dam?: number | null;
  pr_fluv_dam?: number | null;
  pr_pluv_dam?: number | null;
  pr_total_dam?: number | null;
  pr_eq_dam?: number | null;
  
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  latitude?: number;
  longitude?: number;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

export async function getClimateRisksData(
  lat: number,
  lon: number,
  radius?: number
): Promise<ClimateRiskInfo[]> {
  const BASE_SERVICE_URL = 'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/ArcGIS/rest/services/scenarios_climate_risks/FeatureServer/0';
  
  try {
    if (!radius || radius <= 0) {
      console.log(`🌍 Climate Risks: No radius provided, skipping proximity query`);
      return [];
    }
    
    // Cap radius at 100 miles
    const cappedRadius = Math.min(radius, 100.0);
    
    console.log(`🌍 Querying Climate Risks within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    // Convert radius from miles to meters
    const radiusMeters = cappedRadius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/query`);
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
    queryUrl.searchParams.set('geometryPrecision', '6');
    queryUrl.searchParams.set('maxAllowableOffset', '0');
    
    console.log(`🔗 Climate Risks Query URL: ${queryUrl.toString()}`);
    
    const response = await fetchWithTimeout(queryUrl.toString(), 30000);
    
    if (!response.ok) {
      console.error(`❌ Climate Risks HTTP error! status: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error(`❌ Climate Risks API error:`, data.error);
      return [];
    }
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn(`⚠️ Climate Risks: No features array in response`);
      return [];
    }
    
    console.log(`✅ Climate Risks: Received ${data.features.length} feature(s) from API`);
    
    // Process features and add distance calculations
    const processedFeatures: ClimateRiskInfo[] = data.features.map((feature: any) => {
      const attrs = feature.attributes || {};
      const geom = feature.geometry;
      
      // Extract coordinates from geometry
      let featureLat: number | null = null;
      let featureLon: number | null = null;
      
      if (geom) {
        if (geom.x !== undefined && geom.y !== undefined) {
          featureLon = geom.x;
          featureLat = geom.y;
        } else if (geom.coordinates && Array.isArray(geom.coordinates)) {
          featureLon = geom.coordinates[0];
          featureLat = geom.coordinates[1];
        }
      }
      
      // Calculate distance if we have coordinates
      let distance_miles: number | undefined = undefined;
      if (featureLat !== null && featureLon !== null) {
        distance_miles = calculateDistance(lat, lon, featureLat, featureLon);
      }
      
      return {
        objectId: attrs.OBJECTID?.toString() || attrs.ObjectId?.toString() || null,
        // RCP26 fields
        rcp26_coast_dwt: attrs.rcp26_coast_dwt ?? null,
        rcp26_fluv_dwt: attrs.rcp26_fluv_dwt ?? null,
        rcp26_pluv_dwt: attrs.rcp26_pluv_dwt ?? null,
        rcp26_total_dwt: attrs.rcp26_total_dwt ?? null,
        rcp26_tc_dam: attrs.rcp26_tc_dam ?? null,
        rcp26_coast_dam: attrs.rcp26_coast_dam ?? null,
        rcp26_fluv_dam: attrs.rcp26_fluv_dam ?? null,
        rcp26_pluv_dam: attrs.rcp26_pluv_dam ?? null,
        rcp26_total_dam: attrs.rcp26_total_dam ?? null,
        rcp26_eq_dam: attrs.rcp26_eq_dam ?? null,
        // RCP45 fields
        rcp45_coast_dwt: attrs.rcp45_coast_dwt ?? null,
        rcp45_fluv_dwt: attrs.rcp45_fluv_dwt ?? null,
        rcp45_pluv_dwt: attrs.rcp45_pluv_dwt ?? null,
        rcp45_total_dwt: attrs.rcp45_total_dwt ?? null,
        rcp45_tc_dam: attrs.rcp45_tc_dam ?? null,
        rcp45_coast_dam: attrs.rcp45_coast_dam ?? null,
        rcp45_fluv_dam: attrs.rcp45_fluv_dam ?? null,
        rcp45_pluv_dam: attrs.rcp45_pluv_dam ?? null,
        rcp45_total_dam: attrs.rcp45_total_dam ?? null,
        rcp45_eq_dam: attrs.rcp45_eq_dam ?? null,
        // RCP85 fields
        rcp85_coast_dwt: attrs.rcp85_coast_dwt ?? null,
        rcp85_fluv_dwt: attrs.rcp85_fluv_dwt ?? null,
        rcp85_pluv_dwt: attrs.rcp85_pluv_dwt ?? null,
        rcp85_total_dwt: attrs.rcp85_total_dwt ?? null,
        rcp85_tc_dam: attrs.rcp85_tc_dam ?? null,
        rcp85_coast_dam: attrs.rcp85_coast_dam ?? null,
        rcp85_fluv_dam: attrs.rcp85_fluv_dam ?? null,
        rcp85_pluv_dam: attrs.rcp85_pluv_dam ?? null,
        rcp85_total_dam: attrs.rcp85_total_dam ?? null,
        rcp85_eq_dam: attrs.rcp85_eq_dam ?? null,
        // PR fields
        pr_coast_dwt: attrs.pr_coast_dwt ?? null,
        pr_fluv_dwt: attrs.pr_fluv_dwt ?? null,
        pr_pluv_dwt: attrs.pr_pluv_dwt ?? null,
        pr_total_dwt: attrs.pr_total_dwt ?? null,
        pr_tc_dam: attrs.pr_tc_dam ?? null,
        pr_coast_dam: attrs.pr_coast_dam ?? null,
        pr_fluv_dam: attrs.pr_fluv_dam ?? null,
        pr_pluv_dam: attrs.pr_pluv_dam ?? null,
        pr_total_dam: attrs.pr_total_dam ?? null,
        pr_eq_dam: attrs.pr_eq_dam ?? null,
        attributes: attrs,
        geometry: geom,
        distance_miles,
        latitude: featureLat,
        longitude: featureLon
      };
    });
    
    // Filter by actual distance (since bounding box is approximate)
    const filteredFeatures = processedFeatures.filter(feature => {
      if (feature.distance_miles === undefined) return false;
      return feature.distance_miles <= cappedRadius;
    });
    
    console.log(`✅ Climate Risks: Filtered to ${filteredFeatures.length} feature(s) within ${cappedRadius} miles`);
    
    return filteredFeatures;
  } catch (error: any) {
    console.error(`❌ Error querying Climate Risks data:`, error);
    return [];
  }
}

/**
 * Query ALL Climate Risks globally (no spatial constraints)
 * Used for global visualization of all climate risk data
 */
export async function getAllClimateRisksData(): Promise<ClimateRiskInfo[]> {
  const BASE_SERVICE_URL = 'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/ArcGIS/rest/services/scenarios_climate_risks/FeatureServer/0';
  
  try {
    const maxRecordCount = 1000;
    console.log(`🌍 Querying ALL Climate Risks globally`);
    
    let allFeatures: any[] = [];
    let resultOffset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const queryUrl = new URL(`${BASE_SERVICE_URL}/query`);
      queryUrl.searchParams.set('f', 'json');
      queryUrl.searchParams.set('where', '1=1');
      queryUrl.searchParams.set('outFields', '*');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      if (resultOffset === 0) {
        console.log(`📊 Querying ALL Climate Risks (no spatial filter)`);
      }
      
      try {
        const response = await fetchWithTimeout(queryUrl.toString(), 30000);
        
        if (!response.ok) {
          console.error(`❌ Climate Risks HTTP error! status: ${response.status}`);
          break;
        }
        
        const data = await response.json();
        
        if (data.error) {
          console.error(`❌ Climate Risks API error:`, data.error);
          break;
        }
        
        if (!data.features || !Array.isArray(data.features) || data.features.length === 0) {
          hasMore = false;
          break;
        }
        
        allFeatures = allFeatures.concat(data.features);
        
        if (data.exceededTransferLimit === true || data.features.length >= maxRecordCount) {
          resultOffset += maxRecordCount;
          hasMore = true;
        } else {
          hasMore = false;
        }
      } catch (error: any) {
        console.error(`❌ Climate Risks query failed:`, error);
        hasMore = false;
      }
    }
    
    // Process features
    const results: ClimateRiskInfo[] = allFeatures.map((feature: any) => {
      const attrs = feature.attributes || {};
      const geom = feature.geometry;
      
      let featureLat: number | null = attrs.latitude ?? null;
      let featureLon: number | null = attrs.longitude ?? null;
      
      if (geom) {
        if (geom.x !== undefined && geom.y !== undefined) {
          featureLon = geom.x;
          featureLat = geom.y;
        } else if (geom.coordinates && Array.isArray(geom.coordinates)) {
          featureLon = geom.coordinates[0];
          featureLat = geom.coordinates[1];
        }
      }
      
      return {
        objectId: attrs.OBJECTID?.toString() || attrs.ObjectId?.toString() || null,
        // RCP26 fields
        rcp26_coast_dwt: attrs.rcp26_coast_dwt ?? null,
        rcp26_fluv_dwt: attrs.rcp26_fluv_dwt ?? null,
        rcp26_pluv_dwt: attrs.rcp26_pluv_dwt ?? null,
        rcp26_total_dwt: attrs.rcp26_total_dwt ?? null,
        rcp26_tc_dam: attrs.rcp26_tc_dam ?? null,
        rcp26_coast_dam: attrs.rcp26_coast_dam ?? null,
        rcp26_fluv_dam: attrs.rcp26_fluv_dam ?? null,
        rcp26_pluv_dam: attrs.rcp26_pluv_dam ?? null,
        rcp26_total_dam: attrs.rcp26_total_dam ?? null,
        rcp26_eq_dam: attrs.rcp26_eq_dam ?? null,
        // RCP45 fields
        rcp45_coast_dwt: attrs.rcp45_coast_dwt ?? null,
        rcp45_fluv_dwt: attrs.rcp45_fluv_dwt ?? null,
        rcp45_pluv_dwt: attrs.rcp45_pluv_dwt ?? null,
        rcp45_total_dwt: attrs.rcp45_total_dwt ?? null,
        rcp45_tc_dam: attrs.rcp45_tc_dam ?? null,
        rcp45_coast_dam: attrs.rcp45_coast_dam ?? null,
        rcp45_fluv_dam: attrs.rcp45_fluv_dam ?? null,
        rcp45_pluv_dam: attrs.rcp45_pluv_dam ?? null,
        rcp45_total_dam: attrs.rcp45_total_dam ?? null,
        rcp45_eq_dam: attrs.rcp45_eq_dam ?? null,
        // RCP85 fields
        rcp85_coast_dwt: attrs.rcp85_coast_dwt ?? null,
        rcp85_fluv_dwt: attrs.rcp85_fluv_dwt ?? null,
        rcp85_pluv_dwt: attrs.rcp85_pluv_dwt ?? null,
        rcp85_total_dwt: attrs.rcp85_total_dwt ?? null,
        rcp85_tc_dam: attrs.rcp85_tc_dam ?? null,
        rcp85_coast_dam: attrs.rcp85_coast_dam ?? null,
        rcp85_fluv_dam: attrs.rcp85_fluv_dam ?? null,
        rcp85_pluv_dam: attrs.rcp85_pluv_dam ?? null,
        rcp85_total_dam: attrs.rcp85_total_dam ?? null,
        rcp85_eq_dam: attrs.rcp85_eq_dam ?? null,
        // PR fields
        pr_coast_dwt: attrs.pr_coast_dwt ?? null,
        pr_fluv_dwt: attrs.pr_fluv_dwt ?? null,
        pr_pluv_dwt: attrs.pr_pluv_dwt ?? null,
        pr_total_dwt: attrs.pr_total_dwt ?? null,
        pr_tc_dam: attrs.pr_tc_dam ?? null,
        pr_coast_dam: attrs.pr_coast_dam ?? null,
        pr_fluv_dam: attrs.pr_fluv_dam ?? null,
        pr_pluv_dam: attrs.pr_pluv_dam ?? null,
        pr_total_dam: attrs.pr_total_dam ?? null,
        pr_eq_dam: attrs.pr_eq_dam ?? null,
        attributes: attrs,
        geometry: geom,
        latitude: featureLat,
        longitude: featureLon
      };
    });
    
    console.log(`✅ Retrieved ${results.length} Climate Risks globally`);
    return results;
  } catch (error: any) {
    console.error(`❌ Error querying all Climate Risks data:`, error);
    return [];
  }
}
