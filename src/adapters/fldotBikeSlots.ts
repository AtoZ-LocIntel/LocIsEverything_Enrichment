/**
 * Adapter for FLDOT Bike Slots Feature Service
 * Service URL: https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Bike_Slot_TDA/FeatureServer/0
 * Description: Stripe-separated portions of the roadway between a through lane and a right turn lane at intersections
 */

export interface FLDOTBikeSlotInfo {
  fid: number | null;
  roadway: string | null;
  roadSide: string | null;
  lncd: number | null;
  description: string | null;
  district: number | null;
  countyDot: number | null;
  county: string | null;
  managementDistrict: number | null;
  beginPost: number | null;
  endPost: number | null;
  shapeLength: number | null;
  lat: number | null;
  lon: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map (polyline)
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

// Helper function to get the center point of a polyline for distance calculation
function getPolylineCenter(geometry: any): { lat: number; lon: number } | null {
  if (!geometry || !geometry.paths || !Array.isArray(geometry.paths) || geometry.paths.length === 0) {
    return null;
  }
  
  // Get all coordinates from all paths
  const allCoords: number[][] = [];
  geometry.paths.forEach((path: number[][]) => {
    if (Array.isArray(path)) {
      path.forEach((coord: number[]) => {
        if (Array.isArray(coord) && coord.length >= 2) {
          allCoords.push([coord[1], coord[0]]); // [lat, lon] - note: ESRI geometry is [lon, lat] in State Plane
        }
      });
    }
  });
  
  if (allCoords.length === 0) {
    return null;
  }
  
  // Calculate center (average of all coordinates)
  const sumLat = allCoords.reduce((sum, coord) => sum + coord[0], 0);
  const sumLon = allCoords.reduce((sum, coord) => sum + coord[1], 0);
  
  return {
    lat: sumLat / allCoords.length,
    lon: sumLon / allCoords.length
  };
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

export async function getFLDOTBikeSlotsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<FLDOTBikeSlotInfo[]> {
  const BASE_SERVICE_URL = 'https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Bike_Slot_TDA/FeatureServer/0';
  
  try {
    if (!radius || radius <= 0) {
      console.log(`🚴 FLDOT Bike Slots: No radius provided, skipping proximity query`);
      return [];
    }
    
    // Cap radius at 50 miles
    const cappedRadius = Math.min(radius, 50.0);
    
    console.log(`🚴 Querying FLDOT Bike Slots within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 FLDOT Bike Slots Query URL: ${queryUrl.toString()}`);
    
    const response = await fetchWithTimeout(queryUrl.toString(), 30000);
    
    if (!response.ok) {
      console.error(`❌ FLDOT Bike Slots HTTP error! status: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ FLDOT Bike Slots API Error:', data.error);
      return [];
    }
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn('No features array in FLDOT Bike Slots response');
      return [];
    }
    
    const bikeSlots: FLDOTBikeSlotInfo[] = [];
    
    for (const feature of data.features) {
      try {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        if (!geometry || !geometry.paths) {
          continue;
        }
        
        // Get center point for distance calculation
        const center = getPolylineCenter(geometry);
        let distance_miles: number | undefined = undefined;
        
        if (center) {
          distance_miles = calculateDistance(lat, lon, center.lat, center.lon);
          // Only include if within radius
          if (distance_miles > cappedRadius) {
            continue;
          }
        }
        
        const bikeSlotInfo: FLDOTBikeSlotInfo = {
          fid: attributes.FID !== null && attributes.FID !== undefined ? Number(attributes.FID) : null,
          roadway: attributes.ROADWAY || null,
          roadSide: attributes.ROAD_SIDE || attributes.ROAD_SIDE || null,
          lncd: attributes.LNCD !== null && attributes.LNCD !== undefined ? Number(attributes.LNCD) : null,
          description: attributes.DESCR || attributes.DESCR || null,
          district: attributes.DISTRICT !== null && attributes.DISTRICT !== undefined ? Number(attributes.DISTRICT) : null,
          countyDot: attributes.COUNTYDOT !== null && attributes.COUNTYDOT !== undefined ? Number(attributes.COUNTYDOT) : null,
          county: attributes.COUNTY || null,
          managementDistrict: attributes.MNG_DIST !== null && attributes.MNG_DIST !== undefined ? Number(attributes.MNG_DIST) : null,
          beginPost: attributes.BEGIN_POST !== null && attributes.BEGIN_POST !== undefined ? Number(attributes.BEGIN_POST) : null,
          endPost: attributes.END_POST !== null && attributes.END_POST !== undefined ? Number(attributes.END_POST) : null,
          shapeLength: attributes.Shape_Leng !== null && attributes.Shape_Leng !== undefined ? Number(attributes.Shape_Leng) : 
                      (attributes.Shape__Length !== null && attributes.Shape__Length !== undefined ? Number(attributes.Shape__Length) : null),
          lat: center ? center.lat : null,
          lon: center ? center.lon : null,
          attributes: attributes,
          geometry: geometry,
          distance_miles: distance_miles
        };
        
        bikeSlots.push(bikeSlotInfo);
      } catch (error: any) {
        console.error('Error processing FLDOT Bike Slot feature:', error);
        continue;
      }
    }
    
    console.log(`🚴 Retrieved ${bikeSlots.length} FLDOT Bike Slots`);
    return bikeSlots;
    
  } catch (error: any) {
    console.error('❌ Error fetching FLDOT Bike Slots:', error);
    return [];
  }
}
