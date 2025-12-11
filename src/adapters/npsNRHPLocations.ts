/**
 * NPS National Register of Historic Places Locations Adapter
 * Queries NPS ArcGIS FeatureServer for NRHP locations (points)
 * Supports proximity queries up to 50 miles
 * API: https://mapservices.nps.gov/arcgis/rest/services/cultural_resources/nrhp_locations/MapServer/0
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://mapservices.nps.gov/arcgis/rest/services/cultural_resources/nrhp_locations/MapServer/0';

export interface NPSNRHPLocationInfo {
  objectId: number | null;
  resourceName: string | null;
  resourceId: string | null;
  nrhpNumber: string | null;
  state: string | null;
  county: string | null;
  city: string | null;
  address: string | null;
  propertyType: string | null;
  dateListed: string | null;
  dateAdded: string | null;
  lat: number;
  lon: number;
  distance_miles?: number;
  attributes: Record<string, any>;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
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
 * Query NPS NRHP Locations FeatureServer for proximity search
 * Returns NRHP locations within the specified radius (in miles)
 */
export async function getNPSNRHPLocationsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NPSNRHPLocationInfo[]> {
  try {
    console.log(`🏛️ Querying NPS NRHP Locations within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    // Cap radius at 50 miles
    const cappedRadius = Math.min(radiusMiles, 50.0);
    
    // Convert miles to meters for the buffer distance
    const radiusMeters = cappedRadius * 1609.34;
    
    // Build geometry point for proximity query
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const allFeatures: any[] = [];
    let resultOffset = 0;
    const batchSize = 2000; // ESRI FeatureServer max per request
    let hasMore = true;
    
    // Fetch all results in batches
    while (hasMore) {
      const geometryStr = encodeURIComponent(JSON.stringify(geometry));
      const queryUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
      
      if (resultOffset === 0) {
        console.log(`🔗 NPS NRHP Locations Query URL: ${queryUrl.substring(0, 200)}...`);
      }
      
      const data = await fetchJSONSmart(queryUrl) as any;
      
      if (data.error) {
        console.error('❌ NPS NRHP Locations API Error:', data.error);
        break;
      }
      
      if (!data.features || data.features.length === 0) {
        if (resultOffset === 0) {
          console.log(`ℹ️ No NPS NRHP Locations found within ${cappedRadius} miles`);
        }
        hasMore = false;
        break;
      }
      
      allFeatures.push(...data.features);
      
      // Check if there are more results
      if (data.exceededTransferLimit || data.features.length === batchSize) {
        resultOffset += batchSize;
        console.log(`📊 NPS NRHP Locations: Fetched ${allFeatures.length} features so far, continuing...`);
      } else {
        hasMore = false;
      }
    }
    
    if (allFeatures.length === 0) {
      return [];
    }
    
    console.log(`📊 NPS NRHP Locations: Processing ${allFeatures.length} features`);
    
    // Process features and calculate distance
    const locations: NPSNRHPLocationInfo[] = allFeatures
      .map((feature: any): NPSNRHPLocationInfo | null => {
        const attrs = feature.attributes || {};
        const geom = feature.geometry;
        
        // Extract coordinates from geometry
        let featureLat: number | null = null;
        let featureLon: number | null = null;
        
        if (geom) {
          if (geom.x !== undefined && geom.y !== undefined) {
            // Point geometry
            featureLon = geom.x;
            featureLat = geom.y;
          } else if (geom.coordinates && Array.isArray(geom.coordinates)) {
            // GeoJSON format
            featureLon = geom.coordinates[0];
            featureLat = geom.coordinates[1];
          }
        }
        
        // Fallback to attribute fields if geometry doesn't have coordinates
        if (featureLat === null || featureLon === null) {
          featureLat = attrs.LATITUDE || attrs.latitude || attrs.LAT || attrs.lat || attrs.Y || attrs.y || null;
          featureLon = attrs.LONGITUDE || attrs.longitude || attrs.LON || attrs.lon || attrs.X || attrs.x || null;
        }
        
        if (featureLat === null || featureLon === null || isNaN(featureLat) || isNaN(featureLon)) {
          console.warn(`⚠️ NPS NRHP Location missing coordinates. ObjectID: ${attrs.OBJECTID || attrs.objectId || 'unknown'}`);
          return null;
        }
        
        // Calculate distance
        const distance = calculateDistance(lat, lon, featureLat, featureLon);
        
        if (distance > cappedRadius) {
          return null;
        }
        
        return {
          objectId: attrs.OBJECTID || attrs.objectId || null,
          resourceName: attrs.RESNAME || attrs.resname || attrs.RESOURCE_NAME || attrs.resource_name || attrs.NAME || attrs.name || null,
          resourceId: attrs.RESID || attrs.resid || attrs.RESOURCE_ID || attrs.resource_id || null,
          nrhpNumber: attrs.NRHP_NUMBER || attrs.nrhp_number || attrs.NRHP || attrs.nrhp || null,
          state: attrs.STATE || attrs.state || attrs.STATE_CODE || attrs.state_code || null,
          county: attrs.COUNTY || attrs.county || null,
          city: attrs.CITY || attrs.city || null,
          address: attrs.ADDRESS || attrs.address || null,
          propertyType: attrs.PROPERTY_TYPE || attrs.property_type || attrs.TYPE || attrs.type || null,
          dateListed: attrs.DATE_LISTED || attrs.date_listed || attrs.LISTED_DATE || attrs.listed_date || null,
          dateAdded: attrs.DATE_ADDED || attrs.date_added || attrs.ADDED_DATE || attrs.added_date || null,
          lat: featureLat,
          lon: featureLon,
          distance_miles: Number(distance.toFixed(2)),
          attributes: attrs
        };
      })
      .filter((location): location is NPSNRHPLocationInfo => {
        // Filter out null locations
        return location !== null;
      })
      .sort((a: NPSNRHPLocationInfo, b: NPSNRHPLocationInfo) => {
        // Sort by distance
        const distA = a.distance_miles || Infinity;
        const distB = b.distance_miles || Infinity;
        return distA - distB;
      });
    
    console.log(`✅ NPS NRHP Locations: Found ${locations.length} locations within ${cappedRadius} miles`);
    
    return locations;
    
  } catch (error) {
    console.error('❌ NPS NRHP Locations query failed:', error);
    return [];
  }
}

