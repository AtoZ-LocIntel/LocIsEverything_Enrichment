/**
 * Australia Waste Management Facilities Adapter
 * Queries Geoscience Australia Waste Management Facilities FeatureServer
 * Point feature service for waste management facilities
 * Supports proximity queries up to 50 miles
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services.ga.gov.au/gis/rest/services/Waste_Management_Facilities/MapServer/0';

export interface AustraliaWasteManagementFacilityInfo {
  objectId: number;
  latitude: number;
  longitude: number;
  distance_miles?: number;
  attributes: Record<string, any>;
  geometry?: any;
  [key: string]: any; // For other attributes
}

// Haversine distance calculation
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface AustraliaWasteManagementFacilityData {
  facilities: AustraliaWasteManagementFacilityInfo[];
}

export async function getAustraliaWasteManagementFacilitiesData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<AustraliaWasteManagementFacilityData> {
  try {
    console.log(`🗑️ Querying Australia Waste Management Facilities for [${lat}, ${lon}] within ${radiusMiles} miles`);
    
    // Cap radius at 50 miles
    const cappedRadius = Math.min(radiusMiles, 50.0);
    
    // Convert radius from miles to meters for ESRI query
    const radiusMeters = cappedRadius * 1609.34;
    
    const facilities: AustraliaWasteManagementFacilityInfo[] = [];
    
    let hasMore = true;
    let resultOffset = 0;
    const resultRecordCount = 2000;
    
    while (hasMore) {
      // Build query URL using URL API for better reliability
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
      queryUrl.searchParams.set('resultRecordCount', resultRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      console.log(`🔗 Australia Waste Management Facilities Query URL: ${queryUrl.toString()}`);
      
      const response = await fetchJSONSmart(queryUrl.toString());
      
      if (response.error) {
        console.error(`❌ Australia Waste Management Facilities API Error:`, response.error);
        hasMore = false;
        break;
      }
      
      if (!response || !response.features || response.features.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const feature of response.features) {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        // Get coordinates from geometry or attributes
        let facilityLat: number | null = null;
        let facilityLon: number | null = null;
        
        if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
          facilityLon = geometry.x;
          facilityLat = geometry.y;
        } else if (geometry && geometry.y !== undefined && geometry.x !== undefined) {
          facilityLat = geometry.y;
          facilityLon = geometry.x;
        } else if (attributes.latitude !== undefined && attributes.longitude !== undefined) {
          facilityLat = attributes.latitude;
          facilityLon = attributes.longitude;
        } else if (attributes.LATITUDE !== undefined && attributes.LONGITUDE !== undefined) {
          facilityLat = attributes.LATITUDE;
          facilityLon = attributes.LONGITUDE;
        } else if (attributes.Lat !== undefined && attributes.Lon !== undefined) {
          facilityLat = attributes.Lat;
          facilityLon = attributes.Lon;
        }
        
        if (facilityLat == null || facilityLon == null || !Number.isFinite(facilityLat) || !Number.isFinite(facilityLon)) {
          console.warn(`⚠️ Skipping Waste Management Facility ${attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 'unknown'} - missing coordinates`);
          continue;
        }
        
        // Calculate distance in miles
        const distanceMiles = haversineDistance(lat, lon, facilityLat, facilityLon);
        
        // Only include facilities within the specified radius
        if (Number.isFinite(distanceMiles) && distanceMiles <= cappedRadius) {
          const facilityInfo: AustraliaWasteManagementFacilityInfo = {
            objectId: attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 0,
            latitude: facilityLat,
            longitude: facilityLon,
            distance_miles: Number(distanceMiles.toFixed(2)),
            attributes,
            geometry,
            ...attributes
          };
          
          facilities.push(facilityInfo);
        }
      }
      
      // Check if there are more results
      if (response.exceededTransferLimit === true || response.features.length === resultRecordCount) {
        resultOffset += resultRecordCount;
      } else {
        hasMore = false;
      }
    }
    
    // Sort by distance (closest first)
    facilities.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${facilities.length} Australia Waste Management Facilities within ${cappedRadius} miles`);
    
    return {
      facilities
    };
  } catch (error) {
    console.error('❌ Error querying Australia Waste Management Facilities:', error);
    return {
      facilities: []
    };
  }
}

