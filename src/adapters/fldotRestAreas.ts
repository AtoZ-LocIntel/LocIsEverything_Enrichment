/**
 * Adapter for FLDOT Rest Areas & Welcome Centers Feature Service
 * Service URL: https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Rest_Welcome_FDOT_TDA/FeatureServer/0
 * Description: Rest areas, welcome centers, wayside parks, and weigh stations along roadways from FDOT Roadway Characteristics Inventory
 */

export interface FLDOTRestAreaInfo {
  fid: number | null;
  roadway: string | null;
  type: string | null; // RSTAREAS, RSTARFAC, WAYSDPKS, WEIGHSTA, WELCMSTA
  direction: string | null; // L or R
  district: number | null;
  countyDot: number | null;
  county: string | null;
  managementDistrict: number | null;
  beginPost: number | null;
  numFacilities: number | null;
  lat: number | null;
  lon: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
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

export async function getFLDOTRestAreasData(
  lat: number,
  lon: number,
  radius?: number
): Promise<FLDOTRestAreaInfo[]> {
  const BASE_SERVICE_URL = 'https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Rest_Welcome_FDOT_TDA/FeatureServer/0';
  
  try {
    if (!radius || radius <= 0) {
      console.log(`🚻 FLDOT Rest Areas: No radius provided, skipping proximity query`);
      return [];
    }
    
    // Cap radius at 50 miles
    const cappedRadius = Math.min(radius, 50.0);
    
    console.log(`🚻 Querying FLDOT Rest Areas & Welcome Centers within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 FLDOT Rest Areas Query URL: ${queryUrl.toString()}`);
    
    const response = await fetchWithTimeout(queryUrl.toString(), 30000);
    
    if (!response.ok) {
      console.error(`❌ FLDOT Rest Areas HTTP error! status: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ FLDOT Rest Areas API Error:', data.error);
      return [];
    }
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn('No features array in FLDOT Rest Areas response');
      return [];
    }
    
    const restAreas: FLDOTRestAreaInfo[] = [];
    
    // Use a Set to track unique rest areas by FID to deduplicate
    const seenFids = new Set<number>();
    
    for (const feature of data.features) {
      try {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        if (!geometry || (typeof geometry.x !== 'number' || typeof geometry.y !== 'number')) {
          continue;
        }
        
        // Deduplicate by FID (unique identifier)
        const fid = attributes.FID !== null && attributes.FID !== undefined ? Number(attributes.FID) : null;
        if (fid !== null && seenFids.has(fid)) {
          continue; // Skip duplicate rest area
        }
        if (fid !== null) {
          seenFids.add(fid);
        }
        
        // Calculate distance
        const pointLat = geometry.y;
        const pointLon = geometry.x;
        const distance_miles = calculateDistance(lat, lon, pointLat, pointLon);
        
        // Only include if within radius
        if (distance_miles > cappedRadius) {
          continue;
        }
        
        const restAreaInfo: FLDOTRestAreaInfo = {
          fid: fid,
          roadway: attributes.ROADWAY || null,
          type: attributes.TYPE_ || null, // RSTAREAS, RSTARFAC, WAYSDPKS, WEIGHSTA, WELCMSTA
          direction: attributes.DIR || null, // L or R
          district: attributes.DISTRICT !== null && attributes.DISTRICT !== undefined ? Number(attributes.DISTRICT) : null,
          countyDot: attributes.COUNTYDOT !== null && attributes.COUNTYDOT !== undefined ? Number(attributes.COUNTYDOT) : null,
          county: attributes.COUNTY || null,
          managementDistrict: attributes.MNG_DIST !== null && attributes.MNG_DIST !== undefined ? Number(attributes.MNG_DIST) : null,
          beginPost: attributes.BEGIN_POST !== null && attributes.BEGIN_POST !== undefined ? Number(attributes.BEGIN_POST) : null,
          numFacilities: attributes.NUM_FAC !== null && attributes.NUM_FAC !== undefined ? Number(attributes.NUM_FAC) : null,
          lat: pointLat,
          lon: pointLon,
          attributes: attributes,
          geometry: geometry,
          distance_miles: distance_miles
        };
        
        restAreas.push(restAreaInfo);
      } catch (error: any) {
        console.error('Error processing FLDOT Rest Area feature:', error);
        continue;
      }
    }
    
    console.log(`🚻 Retrieved ${restAreas.length} unique FLDOT Rest Areas & Welcome Centers (after deduplication)`);
    return restAreas;
    
  } catch (error: any) {
    console.error('❌ Error fetching FLDOT Rest Areas:', error);
    return [];
  }
}
