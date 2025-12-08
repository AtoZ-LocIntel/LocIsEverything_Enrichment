import { fetchJSONSmart } from '../services/EnrichmentService';

// Socrata API endpoint - using resource API instead of views API
const BASE_API_URL = 'https://data.cityofchicago.org/resource/v6vf-nfxy';

export interface Chicago311Feature {
  sr_number: string;
  sr_type: string;
  sr_short_code?: string;
  created_department?: string;
  owner_department?: string;
  status?: string;
  origin?: string;
  created_date?: string;
  last_modified_date?: string;
  closed_date?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  street_number?: string;
  street_direction?: string;
  street_name?: string;
  street_type?: string;
  duplicate?: boolean;
  legacy_record?: boolean;
  legacy_sr_number?: string;
  parent_sr_number?: string;
  community_area?: number;
  ward?: number;
  electrical_district?: string;
  electricity_grid?: string;
  police_sector?: string;
  police_district?: string;
  police_beat?: string;
  precinct?: string;
  sanitation_division_days?: string;
  created_hour?: number;
  created_day_of_week?: number;
  created_month?: number;
  x_coordinate?: number;
  y_coordinate?: number;
  latitude: number;
  longitude: number;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  distance_miles?: number;
}

// Socrata resource API returns an array directly, not wrapped in a data property
export type Chicago311Response = Chicago311Feature[];

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
 * Extract year from created_date string (format: "1/1/2018" or ISO date)
 */
function extractYear(createdDate: string | undefined): number | null {
  if (!createdDate) return null;
  
  // Try parsing as date string (format: "1/1/2018")
  const dateMatch = createdDate.match(/\/(\d{4})/);
  if (dateMatch) {
    return parseInt(dateMatch[1], 10);
  }
  
  // Try parsing as ISO date or timestamp
  const date = new Date(createdDate);
  if (!isNaN(date.getTime())) {
    return date.getFullYear();
  }
  
  return null;
}

/**
 * Query Chicago 311 Service Requests within proximity of a location
 * Uses Socrata API with bounding box and distance filtering
 * Optionally filters by year based on created_date field
 */
export async function getChicago311Data(
  lat: number,
  lon: number,
  radiusMiles: number,
  year?: number
): Promise<Chicago311Feature[]> {
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
    const whereClause = `latitude >= ${minLat} AND latitude <= ${maxLat} AND longitude >= ${minLon} AND longitude <= ${maxLon}`;
    
    // Socrata resource API format: /resource/{dataset-id}.json with query parameters
    // Set very high limit to get all features within bounding box, then filter by distance
    // Socrata default limit is 1000, so we set a high limit to get more results
    const queryUrl = `${BASE_API_URL}.json?$where=${encodeURIComponent(whereClause)}&$limit=50000`;

    const response = await fetchJSONSmart(queryUrl) as Chicago311Response;

    if (!response || !Array.isArray(response)) {
      console.warn('⚠️ Chicago 311: No data in response');
      return [];
    }

    // Filter by actual distance and optionally by year
    const filteredFeatures = response
      .filter(feature => {
        if (!feature.latitude || !feature.longitude) return false;
        
        // Filter by distance
        const distance = calculateDistance(lat, lon, feature.latitude, feature.longitude);
        if (distance > radiusMiles) return false;
        
        // Filter by year if specified
        if (year !== undefined && year !== null) {
          const featureYear = extractYear(feature.created_date);
          if (featureYear !== year) return false;
        }
        
        return true;
      })
      .map(feature => ({
        ...feature,
        distance_miles: calculateDistance(lat, lon, feature.latitude!, feature.longitude!)
      }))
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));

    return filteredFeatures;
  } catch (error) {
    console.error('❌ Error querying Chicago 311 data:', error);
    return [];
  }
}

