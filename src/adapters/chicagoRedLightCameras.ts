/**
 * Adapter for Chicago Red Light Camera Locations data from Socrata API
 * Dataset: Red Light Camera Locations
 * API endpoint: https://data.cityofchicago.org/api/v3/views/thvf-6diy/query.json
 * SODA2 format: https://data.cityofchicago.org/resource/thvf-6diy.json
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

// Socrata API endpoint - using SODA2 format
const BASE_API_URL = 'https://data.cityofchicago.org/resource/thvf-6diy';

export interface ChicagoRedLightCameraFeature {
  camera_id?: string;
  address?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  latitude?: number;
  longitude?: number;
  distance_miles?: number;
  [key: string]: any; // Allow for additional fields
}

export type ChicagoRedLightCamerasResponse = ChicagoRedLightCameraFeature[];

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query Chicago Red Light Camera Locations within proximity of a location
 * Uses Socrata API with bounding box and distance filtering
 */
export async function getChicagoRedLightCamerasData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<ChicagoRedLightCameraFeature[]> {
  try {
    // Try using within_circle spatial query on location field (similar to Chicago 311)
    // Convert radius from miles to meters (1 mile ≈ 1609.34 meters)
    const radiusMeters = radiusMiles * 1609.34;
    
    // Build spatial query using within_circle
    // Format: within_circle(location, latitude, longitude, radius_in_meters)
    const whereClause = `within_circle(location, ${lat}, ${lon}, ${radiusMeters})`;
    
    // Socrata resource API format: /resource/{dataset-id}.json with query parameters
    const queryUrl = `${BASE_API_URL}.json?$where=${encodeURIComponent(whereClause)}&$limit=50000`;

    console.log(`🔍 Chicago Red Light Cameras: Querying with spatial filter (within_circle): ${queryUrl}`);
    
    let response: ChicagoRedLightCamerasResponse;
    try {
      response = await fetchJSONSmart(queryUrl) as ChicagoRedLightCamerasResponse;
    } catch (error: any) {
      // If within_circle fails with 403 or other error, fall back to bounding box approach
      if (error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
        console.warn('⚠️ Chicago Red Light Cameras: within_circle query returned 403, trying bounding box approach');
      } else {
        throw error;
      }
      
      // Calculate bounding box for the query (approximate)
      const latDelta = radiusMiles / 69;
      const lonDelta = radiusMiles / (69 * Math.cos(lat * Math.PI / 180));
      
      const minLat = lat - latDelta;
      const maxLat = lat + latDelta;
      const minLon = lon - lonDelta;
      const maxLon = lon + lonDelta;

      // Build Socrata query with bounding box filter
      const bboxWhereClause = `latitude >= ${minLat} AND latitude <= ${maxLat} AND longitude >= ${minLon} AND longitude <= ${maxLon}`;
      const bboxQueryUrl = `${BASE_API_URL}.json?$where=${encodeURIComponent(bboxWhereClause)}&$limit=50000`;
      
      console.log(`🔍 Chicago Red Light Cameras: Trying bounding box query: ${bboxQueryUrl}`);
      response = await fetchJSONSmart(bboxQueryUrl) as ChicagoRedLightCamerasResponse;
    }

    if (!response || !Array.isArray(response)) {
      console.warn('⚠️ Chicago Red Light Cameras: No data in response');
      return [];
    }

    // Filter by actual distance and extract coordinates
    const filteredFeatures = response
      .map(feature => {
        // Extract latitude/longitude from location field or direct fields
        let featureLat: number | undefined;
        let featureLon: number | undefined;

        if (feature.location && feature.location.coordinates) {
          // location.coordinates is [longitude, latitude]
          featureLon = feature.location.coordinates[0];
          featureLat = feature.location.coordinates[1];
        } else if (feature.latitude !== undefined && feature.longitude !== undefined) {
          featureLat = feature.latitude;
          featureLon = feature.longitude;
        }

        if (featureLat === undefined || featureLon === undefined) {
          return null;
        }

        // Calculate distance using Haversine formula
        const distance = calculateDistance(lat, lon, featureLat, featureLon);

        // Filter by distance
        if (distance > radiusMiles) {
          return null;
        }

        return {
          ...feature,
          latitude: featureLat,
          longitude: featureLon,
          distance_miles: distance
        } as ChicagoRedLightCameraFeature;
      })
      .filter((feature): feature is ChicagoRedLightCameraFeature => feature !== null);

    console.log(`✅ Chicago Red Light Cameras: Filtered to ${filteredFeatures.length} features within ${radiusMiles} miles`);
    return filteredFeatures;
  } catch (error) {
    console.error('❌ Error querying Chicago Red Light Cameras data:', error);
    throw error;
  }
}

