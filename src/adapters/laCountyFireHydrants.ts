import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://arcgis.gis.lacounty.gov/arcgis/rest/services/Fire/Fire_Hydrants/MapServer/0';

export interface LACountyFireHydrantFeature {
  attributes: {
    OBJECTID_1?: number;
    OBJECTID?: number;
    HYDR_CONFG?: string;
  };
  geometry: {
    x: number;
    y: number;
  };
  distance_miles?: number;
}

export interface LACountyFireHydrantsResponse {
  features: LACountyFireHydrantFeature[];
}

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
 * Query LA County Fire Hydrants (point features) within proximity of a location
 */
export async function getLACountyFireHydrantsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<LACountyFireHydrantFeature[]> {
  try {
    // Convert miles to meters for the query
    const radiusMeters = radiusMiles * 1609.34;

    const queryUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(
      JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      })
    )}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true`;

    const response = await fetchJSONSmart(queryUrl) as LACountyFireHydrantsResponse;

    if (!response || !response.features) {
      console.warn('⚠️ LA County Fire Hydrants: No features in response');
      return [];
    }

    // Calculate distance for each feature
    return response.features.map((feature: LACountyFireHydrantFeature) => ({
      ...feature,
      distance_miles: calculateDistance(lat, lon, feature.geometry.y, feature.geometry.x)
    }));
  } catch (error) {
    console.error('❌ Error querying LA County Fire Hydrants:', error);
    return [];
  }
}

