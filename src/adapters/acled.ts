// @ts-nocheck
/**
 * ACLED (Armed Conflict Location & Event Data) Adapter
 * Service: https://services8.arcgis.com/xu983xJB6fIDCjpX/ArcGIS/rest/services/ACLED/FeatureServer/0
 * Supports proximity queries up to 1000 miles
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services8.arcgis.com/xu983xJB6fIDCjpX/ArcGIS/rest/services/ACLED/FeatureServer/0';

export interface ACLEDFeature {
  objectId: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // Distance from query point
}

/**
 * Calculate Haversine distance between two points in miles
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
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
 * Query ACLED data within a radius of a location
 * Supports proximity queries up to 1000 miles
 */
export async function getACLEDData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<ACLEDFeature[]> {
  try {
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 1000) : 1000; // Cap at 1000 miles
    const radiusMeters = maxRadius * 1609.34; // Convert to meters
    
    console.log(`⚔️ Querying ACLED data for [${lat}, ${lon}] within ${maxRadius} miles`);
    
    const results: ACLEDFeature[] = [];
    const processedFeatureIds = new Set<number>();
    let resultOffset = 0;
    const maxRecordCount = 1000; // Service max record count
    let hasMore = true;
    
    while (hasMore) {
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
      queryUrl.searchParams.set('resultRecordCount', maxRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      console.log(`🔗 ACLED Query URL: ${queryUrl.toString()}`);
      
      const response = await fetchJSONSmart(queryUrl.toString());
      
      if (response.error) {
        throw new Error(`ACLED API error: ${JSON.stringify(response.error)}`);
      }
      
      const features = response.features || [];
      
      features.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        const objectId = attributes.ObjectId || attributes.objectId || 0;
        
        // Skip if we've already processed this feature
        if (processedFeatureIds.has(objectId)) {
          return;
        }
        processedFeatureIds.add(objectId);
        
        // Calculate distance
        let distanceMiles = maxRadius;
        if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
          distanceMiles = calculateHaversineDistance(lat, lon, geometry.y, geometry.x);
        } else if (attributes.centroid_latitude && attributes.centroid_longitude) {
          distanceMiles = calculateHaversineDistance(
            lat, 
            lon, 
            attributes.centroid_latitude, 
            attributes.centroid_longitude
          );
        }
        
        results.push({
          objectId,
          attributes,
          geometry,
          distance_miles: distanceMiles
        });
      });
      
      hasMore = features.length === maxRecordCount || response.exceededTransferLimit === true;
      resultOffset += features.length;
      
      if (resultOffset > 100000) {
        console.warn(`⚠️ ACLED: Stopping pagination at 100k records for safety`);
        hasMore = false;
      }
      
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Sort by distance
    results.sort((a, b) => {
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });
    
    console.log(`✅ Found ${results.length} ACLED feature(s) within ${maxRadius} miles`);
    
    return results;
  } catch (error) {
    console.error(`❌ ACLED API Error:`, error);
    throw error;
  }
}
