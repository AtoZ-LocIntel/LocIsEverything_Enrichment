/**
 * Adapter for Chicago Traffic Crashes data from Socrata API
 * Dataset: Traffic Crashes - Crashes
 * API endpoint: https://data.cityofchicago.org/api/v3/views/85ca-t3if/query.json
 * SODA2 format: https://data.cityofchicago.org/resource/85ca-t3if.json
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

// Socrata API endpoint - using SODA2 format
const BASE_API_URL = 'https://data.cityofchicago.org/resource/85ca-t3if';

export interface ChicagoTrafficCrashFeature {
  crash_record_id?: string;
  crash_date?: string;
  crash_date_est_i?: string;
  posted_speed_limit?: number;
  traffic_control_device?: string;
  device_condition?: string;
  weather_condition?: string;
  lighting_condition?: string;
  first_crash_type?: string;
  trafficway_type?: string;
  lane_cnt?: number;
  alignment?: string;
  roadway_surface_cond?: string;
  road_defect?: string;
  report_type?: string;
  crash_type?: string;
  intersection_related_i?: string;
  private_property_i?: string;
  hit_and_run_i?: string;
  damage?: string;
  date_police_notified?: string;
  prim_contributory_cause?: string;
  sec_contributory_cause?: string;
  street_no?: number;
  street_direction?: string;
  street_name?: string;
  beat_of_occurrence?: number;
  photos_taken_i?: string;
  statements_taken_i?: string;
  dooring_i?: string;
  work_zone_i?: string;
  work_zone_type?: string;
  workers_present_i?: string;
  num_units?: number;
  most_severe_injury?: string;
  injuries_total?: number;
  injuries_fatal?: number;
  injuries_incapacitating?: number;
  injuries_non_incapacitating?: number;
  injuries_reported_not_evident?: number;
  injuries_no_indication?: number;
  injuries_unknown?: number;
  crash_hour?: number;
  crash_day_of_week?: number;
  crash_month?: number;
  latitude?: number;
  longitude?: number;
  location?: any;
  distance_miles?: number;
}

export type ChicagoTrafficCrashesResponse = ChicagoTrafficCrashFeature[];

/**
 * Extract year from crash_date field
 */
function extractYear(crashDate: string | undefined): number | null {
  if (!crashDate) return null;
  
  // crash_date is a Floating Timestamp, format: "2017-09-01T00:00:00.000"
  const match = crashDate.match(/^(\d{4})/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Query Chicago Traffic Crashes within proximity of a location
 * Uses Socrata API with bounding box and distance filtering
 */
export async function getChicagoTrafficCrashesData(
  lat: number,
  lon: number,
  radiusMiles: number,
  year?: number
): Promise<ChicagoTrafficCrashFeature[]> {
  try {
    // Calculate bounding box for the query (approximate)
    // 1 degree latitude ≈ 69 miles, 1 degree longitude ≈ 69 * cos(latitude) miles
    const latDelta = radiusMiles / 69;
    const lonDelta = radiusMiles / (69 * Math.cos(lat * Math.PI / 180));
    
    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;

    // Build Socrata query with bounding box filter
    // Using $where clause to filter by latitude/longitude bounds
    // Note: Year filtering is done client-side for consistency with Chicago 311
    const whereClause = `latitude >= ${minLat} AND latitude <= ${maxLat} AND longitude >= ${minLon} AND longitude <= ${maxLon}`;
    
    // Socrata resource API format: /resource/{dataset-id}.json with query parameters
    // Set very high limit to get all features within bounding box, then filter by distance and year
    // Socrata default limit is 1000, so we set a high limit to get more results
    const queryUrl = `${BASE_API_URL}.json?$where=${encodeURIComponent(whereClause)}&$limit=50000`;

    const response = await fetchJSONSmart(queryUrl) as ChicagoTrafficCrashesResponse;

    if (!response || !Array.isArray(response)) {
      console.warn('⚠️ Chicago Traffic Crashes: No data in response');
      return [];
    }

    // Filter by actual distance and optionally by year
    const filteredFeatures = response
      .filter(feature => {
        const featureLat = feature.latitude;
        const featureLon = feature.longitude;
        
        if (featureLat === null || featureLat === undefined || featureLon === null || featureLon === undefined) {
          return false;
        }
        
        // Calculate distance using Haversine formula
        const R = 3959; // Earth radius in miles
        const dLat = (featureLat - lat) * Math.PI / 180;
        const dLon = (featureLon - lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(featureLat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        // Filter by distance
        if (distance > radiusMiles) {
          return false;
        }
        
        // Filter by year if provided (client-side check in case API filter didn't work)
        if (year) {
          const crashYear = extractYear(feature.crash_date);
          if (crashYear !== year) {
            return false;
          }
        }
        
        return true;
      })
      .map(feature => {
        const featureLat = feature.latitude!;
        const featureLon = feature.longitude!;
        
        // Calculate distance using Haversine formula
        const R = 3959; // Earth radius in miles
        const dLat = (featureLat - lat) * Math.PI / 180;
        const dLon = (featureLon - lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(featureLat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return {
          ...feature,
          distance_miles: distance
        };
      })
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Chicago Traffic Crashes: Filtered to ${filteredFeatures.length} crashes within ${radiusMiles} miles${year ? ` for year ${year}` : ''}`);

    return filteredFeatures;
  } catch (error) {
    console.error('❌ Error querying Chicago Traffic Crashes data:', error);
    return [];
  }
}

