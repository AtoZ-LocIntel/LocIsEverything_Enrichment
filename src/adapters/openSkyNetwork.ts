import { fetchJSONSmart } from '../services/EnrichmentService';

export interface OpenSkyAircraftState {
  icao24: string;
  callsign: string | null;
  origin_country: string | null;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  velocity: number | null;
  heading: number | null;
  on_ground: boolean | null;
  vertical_rate: number | null;
  squawk: string | null;
  spi: boolean | null;
  position_source: number | null;
  time_position: number | null;
  last_contact: number | null;
}

const OPENSKY_API_URL = 'https://opensky-network.org/api/states/all';

/**
 * Query OpenSky Network for all aircraft states globally
 * Returns real-time aircraft positions worldwide
 */
export async function getAllOpenSkyAircraftStates(): Promise<OpenSkyAircraftState[]> {
  try {
    console.log(`✈️ Querying OpenSky Network for all aircraft states`);
    
    const response = await fetchJSONSmart(OPENSKY_API_URL) as any;
    
    if (!response || !response.states || !Array.isArray(response.states)) {
      console.warn('⚠️ OpenSky Network response missing states array');
      return [];
    }
    
    // OpenSky returns states as arrays, not objects
    // Format: [icao24, callsign, origin_country, time_position, last_contact, longitude, latitude, baro_altitude, on_ground, velocity, heading, vertical_rate, sensors, geo_altitude, squawk, spi, position_source]
    const aircraftStates: OpenSkyAircraftState[] = response.states
      .filter((state: any[]) => state && state.length >= 7) // Ensure we have at least lat/lon
      .map((state: any[]) => {
        const icao24 = state[0] || '';
        const callsign = state[1] || null;
        const origin_country = state[2] || null;
        const time_position = state[3] || null;
        const last_contact = state[4] || null;
        const longitude = state[5] !== null && state[5] !== undefined ? state[5] : null;
        const latitude = state[6] !== null && state[6] !== undefined ? state[6] : null;
        const baro_altitude = state[7] !== null && state[7] !== undefined ? state[7] : null;
        const on_ground = state[8] !== null && state[8] !== undefined ? state[8] : null;
        const velocity = state[9] !== null && state[9] !== undefined ? state[9] : null;
        const heading = state[10] !== null && state[10] !== undefined ? state[10] : null;
        const vertical_rate = state[11] !== null && state[11] !== undefined ? state[11] : null;
        // Sensors and geo_altitude are available in state[12] and state[13] but not currently used
        // Keeping commented for potential future use:
        // const sensors = state[12] || null;
        // const geo_altitude = state[13] !== null && state[13] !== undefined ? state[13] : null;
        const squawk = state[14] || null;
        const spi = state[15] !== null && state[15] !== undefined ? state[15] : null;
        const position_source = state[16] !== null && state[16] !== undefined ? state[16] : null;
        
        // Only include aircraft with valid coordinates
        if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
          return null;
        }
        
        return {
          icao24,
          callsign,
          origin_country,
          longitude,
          latitude,
          baro_altitude,
          velocity,
          heading,
          on_ground,
          vertical_rate,
          squawk,
          spi,
          position_source,
          time_position,
          last_contact
        };
      })
      .filter((state: OpenSkyAircraftState | null) => state !== null) as OpenSkyAircraftState[];
    
    console.log(`✅ Retrieved ${aircraftStates.length} aircraft states from OpenSky Network`);
    return aircraftStates;
  } catch (error: any) {
    console.error('❌ Error querying OpenSky Network:', error);
    return [];
  }
}
