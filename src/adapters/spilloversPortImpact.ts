/**
 * Adapter for Spillovers Port Level Impact ArcGIS Feature Service
 * Service URL: https://services9.arcgis.com/weJ1QsnbMYJlCHdG/ArcGIS/rest/services/spillovers_port_level_impact_geo_v2/FeatureServer/0
 */

export interface SpilloversPortImpactInfo {
  objectId: string | null;
  from_portid: string | null;
  from_portname: string | null;
  from_country: string | null;
  from_iso3: string | null;
  to_portid: string | null;
  to_portname: string | null;
  to_country: string | null;
  to_iso3: string | null;
  to_lat: number | null;
  to_lon: number | null;
  transit_days: number | null;
  capacity_d1_act: number | null;
  capacity_d7_act: number | null;
  capacity_d14_act: number | null;
  capacity_d30_act: number | null;
  capacity_d90_act: number | null;
  capacity_d1_rel: number | null;
  capacity_d7_rel: number | null;
  capacity_d14_rel: number | null;
  capacity_d30_rel: number | null;
  capacity_d90_rel: number | null;
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

export async function getSpilloversPortImpactData(
  lat: number,
  lon: number,
  radius?: number
): Promise<SpilloversPortImpactInfo[]> {
  const BASE_SERVICE_URL = 'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/ArcGIS/rest/services/spillovers_port_level_impact_geo_v2/FeatureServer/0';
  
  try {
    if (!radius || radius <= 0) {
      console.log(`🌊 Spillovers Port Impact: No radius provided, skipping proximity query`);
      return [];
    }
    
    // Cap radius at 100 miles
    const cappedRadius = Math.min(radius, 100.0);
    
    console.log(`🌊 Querying Spillovers Port Impact within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 Spillovers Port Impact Query URL: ${queryUrl.toString()}`);
    
    const response = await fetchWithTimeout(queryUrl.toString(), 30000);
    
    if (!response.ok) {
      console.error(`❌ Spillovers Port Impact HTTP error! status: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error(`❌ Spillovers Port Impact API error:`, data.error);
      return [];
    }
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn(`⚠️ Spillovers Port Impact: No features array in response`);
      return [];
    }
    
    console.log(`✅ Spillovers Port Impact: Received ${data.features.length} feature(s) from API`);
    
    // Process features and add distance calculations
    const processedFeatures: SpilloversPortImpactInfo[] = data.features.map((feature: any) => {
      const attrs = feature.attributes || {};
      const geom = feature.geometry;
      
      // Extract coordinates from geometry or use to_lat/to_lon
      let featureLat: number | null = attrs.to_lat ?? null;
      let featureLon: number | null = attrs.to_lon ?? null;
      
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
        from_portid: attrs.from_portid ?? null,
        from_portname: attrs.from_portname ?? null,
        from_country: attrs.from_country ?? null,
        from_iso3: attrs.from_iso3 ?? null,
        to_portid: attrs.to_portid ?? null,
        to_portname: attrs.to_portname ?? null,
        to_country: attrs.to_country ?? null,
        to_iso3: attrs.to_iso3 ?? null,
        to_lat: attrs.to_lat ?? null,
        to_lon: attrs.to_lon ?? null,
        transit_days: attrs.transit_days ?? null,
        capacity_d1_act: attrs.capacity_d1_act ?? null,
        capacity_d7_act: attrs.capacity_d7_act ?? null,
        capacity_d14_act: attrs.capacity_d14_act ?? null,
        capacity_d30_act: attrs.capacity_d30_act ?? null,
        capacity_d90_act: attrs.capacity_d90_act ?? null,
        capacity_d1_rel: attrs.capacity_d1_rel ?? null,
        capacity_d7_rel: attrs.capacity_d7_rel ?? null,
        capacity_d14_rel: attrs.capacity_d14_rel ?? null,
        capacity_d30_rel: attrs.capacity_d30_rel ?? null,
        capacity_d90_rel: attrs.capacity_d90_rel ?? null,
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
    
    console.log(`✅ Spillovers Port Impact: Filtered to ${filteredFeatures.length} feature(s) within ${cappedRadius} miles`);
    
    return filteredFeatures;
  } catch (error: any) {
    console.error(`❌ Error querying Spillovers Port Impact data:`, error);
    return [];
  }
}

/**
 * Query ALL Spillovers Port Impact globally (no spatial constraints)
 * Used for global visualization of all spillover impact data
 */
export async function getAllSpilloversPortImpactData(): Promise<SpilloversPortImpactInfo[]> {
  const BASE_SERVICE_URL = 'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/ArcGIS/rest/services/spillovers_port_level_impact_geo_v2/FeatureServer/0';
  
  try {
    const maxRecordCount = 1000;
    console.log(`🌊 Querying ALL Spillovers Port Impact globally`);
    
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
        console.log(`📊 Querying ALL Spillovers Port Impact (no spatial filter)`);
      }
      
      try {
        const response = await fetchWithTimeout(queryUrl.toString(), 30000);
        
        if (!response.ok) {
          console.error(`❌ Spillovers Port Impact HTTP error! status: ${response.status}`);
          break;
        }
        
        const data = await response.json();
        
        if (data.error) {
          console.error(`❌ Spillovers Port Impact API error:`, data.error);
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
        console.error(`❌ Spillovers Port Impact query failed:`, error);
        hasMore = false;
      }
    }
    
    // Process features
    const results: SpilloversPortImpactInfo[] = allFeatures.map((feature: any) => {
      const attrs = feature.attributes || {};
      const geom = feature.geometry;
      
      let featureLat: number | null = attrs.to_lat ?? null;
      let featureLon: number | null = attrs.to_lon ?? null;
      
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
        from_portid: attrs.from_portid ?? null,
        from_portname: attrs.from_portname ?? null,
        from_country: attrs.from_country ?? null,
        from_iso3: attrs.from_iso3 ?? null,
        to_portid: attrs.to_portid ?? null,
        to_portname: attrs.to_portname ?? null,
        to_country: attrs.to_country ?? null,
        to_iso3: attrs.to_iso3 ?? null,
        to_lat: attrs.to_lat ?? null,
        to_lon: attrs.to_lon ?? null,
        transit_days: attrs.transit_days ?? null,
        capacity_d1_act: attrs.capacity_d1_act ?? null,
        capacity_d7_act: attrs.capacity_d7_act ?? null,
        capacity_d14_act: attrs.capacity_d14_act ?? null,
        capacity_d30_act: attrs.capacity_d30_act ?? null,
        capacity_d90_act: attrs.capacity_d90_act ?? null,
        capacity_d1_rel: attrs.capacity_d1_rel ?? null,
        capacity_d7_rel: attrs.capacity_d7_rel ?? null,
        capacity_d14_rel: attrs.capacity_d14_rel ?? null,
        capacity_d30_rel: attrs.capacity_d30_rel ?? null,
        capacity_d90_rel: attrs.capacity_d90_rel ?? null,
        attributes: attrs,
        geometry: geom,
        latitude: featureLat ?? undefined,
        longitude: featureLon ?? undefined
      };
    });
    
    console.log(`✅ Retrieved ${results.length} Spillovers Port Impact globally`);
    return results;
  } catch (error: any) {
    console.error(`❌ Error querying all Spillovers Port Impact data:`, error);
    return [];
  }
}
