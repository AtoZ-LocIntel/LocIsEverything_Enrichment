/**
 * Adapter for USGS Earthquake API
 * Service URL: https://earthquake.usgs.gov/fdsnws/event/1/query
 * 
 * Provides earthquake data from the USGS Earthquake Hazards Program
 * - Global coverage
 * - Near-real-time data
 * - Historical data support
 * - GeoJSON format
 * - No API key required
 */

export interface USGSEarthquakeInfo {
  id: string;
  mag?: number;
  place?: string;
  time?: number;
  updated?: number;
  tz?: number;
  url?: string;
  detail?: string;
  felt?: number;
  cdi?: number;
  mmi?: number;
  alert?: string;
  status?: string;
  tsunami?: number;
  sig?: number;
  net?: string;
  code?: string;
  ids?: string;
  sources?: string;
  types?: string;
  nst?: number;
  dmin?: number;
  rms?: number;
  gap?: number;
  magType?: string;
  type?: string;
  title?: string;
  lat: number;
  lon: number;
  depth?: number;
  distance?: number; // Distance in miles from query point
}

const BASE_API_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

/**
 * Calculate distance between two points using Haversine formula
 */
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

/**
 * Query USGS Earthquakes within a radius of a location
 * Supports proximity queries up to 500 miles
 * Returns ALL historical earthquakes (no time limit)
 */
export async function getUSGSEarthquakesData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<USGSEarthquakeInfo[]> {
  try {
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 500) : 500; // Cap at 500 miles
    
    // Convert miles to kilometers (USGS API uses kilometers)
    const maxRadiusKm = maxRadius * 1.60934;
    
    // No time limit - query all historical earthquakes
    // USGS API supports querying without starttime/endtime for all historical data
    const params = new URLSearchParams({
      format: 'geojson',
      latitude: lat.toString(),
      longitude: lon.toString(),
      maxradiuskm: maxRadiusKm.toString(),
      minmagnitude: '2.5', // Minimum magnitude to reduce noise
      orderby: 'time',
      limit: '20000' // Higher limit for historical data
    });
    
    console.log(`🌍 Querying USGS Earthquakes for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
    
    const response = await fetch(`${BASE_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`USGS Earthquakes API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`USGS Earthquakes API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    if (!data.features || !Array.isArray(data.features)) {
      return [];
    }
    
    // Process features and calculate distances
    const earthquakes: USGSEarthquakeInfo[] = data.features
      .map((feature: any) => {
        const properties = feature.properties || {};
        const geometry = feature.geometry || {};
        const coordinates = geometry.coordinates || [];
        
        // GeoJSON coordinates are [lon, lat, depth]
        const earthquakeLon = coordinates[0];
        const earthquakeLat = coordinates[1];
        const depth = coordinates[2];
        
        if (earthquakeLat == null || earthquakeLon == null) {
          return null;
        }
        
        const distance = calculateDistance(lat, lon, earthquakeLat, earthquakeLon);
        
        return {
          id: properties.id || feature.id || `${earthquakeLat}_${earthquakeLon}_${properties.time}`,
          mag: properties.mag,
          place: properties.place,
          time: properties.time,
          updated: properties.updated,
          tz: properties.tz,
          url: properties.url,
          detail: properties.detail,
          felt: properties.felt,
          cdi: properties.cdi,
          mmi: properties.mmi,
          alert: properties.alert,
          status: properties.status,
          tsunami: properties.tsunami,
          sig: properties.sig,
          net: properties.net,
          code: properties.code,
          ids: properties.ids,
          sources: properties.sources,
          types: properties.types,
          nst: properties.nst,
          dmin: properties.dmin,
          rms: properties.rms,
          gap: properties.gap,
          magType: properties.magType,
          type: properties.type,
          title: properties.title,
          lat: earthquakeLat,
          lon: earthquakeLon,
          depth: depth,
          distance
        };
      })
      .filter((eq: USGSEarthquakeInfo | null): eq is USGSEarthquakeInfo => eq !== null)
      .filter((eq: USGSEarthquakeInfo) => (eq.distance ?? Infinity) <= maxRadius)
      .sort((a: USGSEarthquakeInfo, b: USGSEarthquakeInfo) => {
        // Sort by time (most recent first), then by magnitude (largest first)
        if (a.time && b.time) {
          return b.time - a.time;
        }
        if (a.mag && b.mag) {
          return (b.mag || 0) - (a.mag || 0);
        }
        return (a.distance || 0) - (b.distance || 0);
      });
    
    console.log(`✅ USGS Earthquakes query completed: ${earthquakes.length} earthquakes found`);
    
    return earthquakes;
  } catch (error) {
    console.error('Error fetching USGS Earthquakes data:', error);
    throw error;
  }
}

/**
 * Get all earthquakes globally from the last 48 hours (for Global Risk map view)
 * Uses the prebuilt feed API for better performance
 */
export async function getAllUSGSEarthquakesData(): Promise<USGSEarthquakeInfo[]> {
  try {
    console.log(`🌍 Querying ALL USGS Earthquakes globally (last 48 hours)`);
    
    // Use the 48-hour feed (all_day covers last 24 hours, but we'll use all_day and extend if needed)
    // For 48 hours, we'll query the API directly with a 48-hour window
    const endTime = new Date();
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 48);
    
    const params = new URLSearchParams({
      format: 'geojson',
      starttime: startTime.toISOString(),
      endtime: endTime.toISOString(),
      minmagnitude: '2.5', // Minimum magnitude to reduce noise
      orderby: 'time',
      limit: '10000' // Higher limit for global view
    });
    
    const response = await fetch(`${BASE_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`USGS Earthquakes API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`USGS Earthquakes API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    if (!data.features || !Array.isArray(data.features)) {
      return [];
    }
    
    // Process features
    const earthquakes: USGSEarthquakeInfo[] = data.features
      .map((feature: any) => {
        const properties = feature.properties || {};
        const geometry = feature.geometry || {};
        const coordinates = geometry.coordinates || [];
        
        // GeoJSON coordinates are [lon, lat, depth]
        const earthquakeLon = coordinates[0];
        const earthquakeLat = coordinates[1];
        const depth = coordinates[2];
        
        if (earthquakeLat == null || earthquakeLon == null) {
          return null;
        }
        
        return {
          id: properties.id || feature.id || `${earthquakeLat}_${earthquakeLon}_${properties.time}`,
          mag: properties.mag,
          place: properties.place,
          time: properties.time,
          updated: properties.updated,
          tz: properties.tz,
          url: properties.url,
          detail: properties.detail,
          felt: properties.felt,
          cdi: properties.cdi,
          mmi: properties.mmi,
          alert: properties.alert,
          status: properties.status,
          tsunami: properties.tsunami,
          sig: properties.sig,
          net: properties.net,
          code: properties.code,
          ids: properties.ids,
          sources: properties.sources,
          types: properties.types,
          nst: properties.nst,
          dmin: properties.dmin,
          rms: properties.rms,
          gap: properties.gap,
          magType: properties.magType,
          type: properties.type,
          title: properties.title,
          lat: earthquakeLat,
          lon: earthquakeLon,
          depth: depth
        };
      })
      .filter((eq: USGSEarthquakeInfo | null): eq is USGSEarthquakeInfo => eq !== null)
      .sort((a: USGSEarthquakeInfo, b: USGSEarthquakeInfo) => {
        // Sort by time (most recent first), then by magnitude (largest first)
        if (a.time && b.time) {
          return b.time - a.time;
        }
        if (a.mag && b.mag) {
          return (b.mag || 0) - (a.mag || 0);
        }
        return 0;
      });
    
    console.log(`✅ Retrieved ${earthquakes.length} USGS Earthquakes globally (last 48 hours)`);
    
    return earthquakes;
  } catch (error) {
    console.error('Error fetching all USGS Earthquakes data:', error);
    throw error;
  }
}
