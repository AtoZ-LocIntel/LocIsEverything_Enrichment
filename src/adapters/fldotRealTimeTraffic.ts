/**
 * Adapter for FLDOT Real-Time Traffic Volume and Speed Feature Service
 * Service URL: https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Real_Time_Traffic_Volume_and_Speed_All_Intervals_All_Directions_TDA/FeatureServer/0
 */

export interface FLDOTRealTimeTrafficInfo {
  objectId: string | null;
  roadway: string | null;
  milePost: number | null;
  county: string | null;
  site: string | null;
  cosite: string | null;
  countyName: string | null;
  localName: string | null;
  month: string | null;
  monthNum: number | null;
  day: string | null;
  year: number | null;
  weekday: string | null;
  hour: string | null;
  direction: string | null;
  currentVolume: number | null;
  averageVolume: number | null;
  percentDiff: number | null;
  percentDiffText: string | null;
  currentAvgSpeed: number | null;
  maxSpeedRight: number | null;
  maxSpeedLeft: number | null;
  speedPercentDiff: number | null;
  latitude: number | null;
  longitude: number | null;
  dateTimeString: string | null;
  idString: string | null;
  labelValue: string | null;
  idStringNoDir: string | null;
  dateTimeStamp2: string | null;
  managementDistrict: number | null;
  hours2: string | null;
  measureDate: string | null;
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

export async function getFLDOTRealTimeTrafficData(
  lat: number,
  lon: number,
  radius?: number
): Promise<FLDOTRealTimeTrafficInfo[]> {
  const BASE_SERVICE_URL = 'https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Real_Time_Traffic_Volume_and_Speed_All_Intervals_All_Directions_TDA/FeatureServer/0';
  
  try {
    if (!radius || radius <= 0) {
      console.log(`🚦 FLDOT Real-Time Traffic: No radius provided, skipping proximity query`);
      return [];
    }
    
    // Cap radius at 10 miles
    const cappedRadius = Math.min(radius, 10.0);
    
    console.log(`🚦 Querying FLDOT Real-Time Traffic within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 FLDOT Real-Time Traffic Query URL: ${queryUrl.toString()}`);
    
    const response = await fetchWithTimeout(queryUrl.toString(), 30000);
    
    if (!response.ok) {
      console.error(`❌ FLDOT Real-Time Traffic HTTP error! status: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ FLDOT Real-Time Traffic API Error:', data.error);
      return [];
    }
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn('No features array in FLDOT Real-Time Traffic response');
      return [];
    }
    
    const trafficPoints: FLDOTRealTimeTrafficInfo[] = [];
    
    // Use a Set to track unique sites (cosite) to deduplicate
    const seenSites = new Set<string>();
    
    for (const feature of data.features) {
      try {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        if (!geometry || (typeof geometry.x !== 'number' || typeof geometry.y !== 'number')) {
          // Try to use LATITUDE and LNGITUDE fields if geometry is missing
          const latValue = attributes.LATITUDE !== null && attributes.LATITUDE !== undefined ? Number(attributes.LATITUDE) : null;
          const lonValue = attributes.LNGITUDE !== null && attributes.LNGITUDE !== undefined ? Number(attributes.LNGITUDE) : null;
          
          if (!latValue || !lonValue) {
            continue;
          }
          
          // Create geometry from lat/lon
          geometry.x = lonValue;
          geometry.y = latValue;
          geometry.spatialReference = { wkid: 4326 };
        }
        
        // Deduplicate by cosite (unique site identifier)
        const cosite = attributes.COSITE ? String(attributes.COSITE) : null;
        if (cosite && seenSites.has(cosite)) {
          continue; // Skip duplicate site
        }
        if (cosite) {
          seenSites.add(cosite);
        }
        
        // Calculate distance
        const pointLat = geometry.y;
        const pointLon = geometry.x;
        const distance_miles = calculateDistance(lat, lon, pointLat, pointLon);
        
        // Only include if within radius
        if (distance_miles > cappedRadius) {
          continue;
        }
        
        const trafficInfo: FLDOTRealTimeTrafficInfo = {
          objectId: attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? String(attributes.OBJECTID) : null,
          roadway: attributes.ROADWAY || null,
          milePost: attributes.MILE_POST !== null && attributes.MILE_POST !== undefined ? Number(attributes.MILE_POST) : null,
          county: attributes.COUNTY || null,
          site: attributes.SITE || null,
          cosite: cosite,
          countyName: attributes.COUNTYNM || null,
          localName: attributes.LOCALNAM || null,
          month: attributes.MONTH_ || null,
          monthNum: attributes.MNTHNUM !== null && attributes.MNTHNUM !== undefined ? Number(attributes.MNTHNUM) : null,
          day: attributes.DAY_ || null,
          year: attributes.YR !== null && attributes.YR !== undefined ? Number(attributes.YR) : null,
          weekday: attributes.WEEKDAY || null,
          hour: attributes.HOUR_ || null,
          direction: attributes.DIRECTION || null,
          currentVolume: attributes.CURVOL !== null && attributes.CURVOL !== undefined ? Number(attributes.CURVOL) : null,
          averageVolume: attributes.HAVGVOL !== null && attributes.HAVGVOL !== undefined ? Number(attributes.HAVGVOL) : null,
          percentDiff: attributes.PCT_DIFF !== null && attributes.PCT_DIFF !== undefined ? Number(attributes.PCT_DIFF) : null,
          percentDiffText: attributes.PCTDIFTX || null,
          currentAvgSpeed: attributes.CURAVSPD !== null && attributes.CURAVSPD !== undefined ? Number(attributes.CURAVSPD) : null,
          maxSpeedRight: attributes.MAXSPEEDR !== null && attributes.MAXSPEEDR !== undefined ? Number(attributes.MAXSPEEDR) : null,
          maxSpeedLeft: attributes.MAXSPEEDL !== null && attributes.MAXSPEEDL !== undefined ? Number(attributes.MAXSPEEDL) : null,
          speedPercentDiff: attributes.SPPCTDF !== null && attributes.SPPCTDF !== undefined ? Number(attributes.SPPCTDF) : null,
          latitude: attributes.LATITUDE !== null && attributes.LATITUDE !== undefined ? Number(attributes.LATITUDE) : null,
          longitude: attributes.LNGITUDE !== null && attributes.LNGITUDE !== undefined ? Number(attributes.LNGITUDE) : null,
          dateTimeString: attributes.DTSTR || null,
          idString: attributes.IDSTR || null,
          labelValue: attributes.LBLVAL || null,
          idStringNoDir: attributes.IDSTRND || null,
          dateTimeStamp2: attributes.DTSTMP2 || null,
          managementDistrict: attributes.MNG_DIST !== null && attributes.MNG_DIST !== undefined ? Number(attributes.MNG_DIST) : null,
          hours2: attributes.HOURS2 || null,
          measureDate: attributes.MEAS_DT || null,
          lat: pointLat,
          lon: pointLon,
          attributes: attributes,
          geometry: geometry,
          distance_miles: distance_miles
        };
        
        trafficPoints.push(trafficInfo);
      } catch (error: any) {
        console.error('Error processing FLDOT Real-Time Traffic feature:', error);
        continue;
      }
    }
    
    console.log(`🚦 Retrieved ${trafficPoints.length} unique FLDOT Real-Time Traffic points (after deduplication)`);
    return trafficPoints;
    
  } catch (error: any) {
    console.error('❌ Error fetching FLDOT Real-Time Traffic:', error);
    return [];
  }
}
