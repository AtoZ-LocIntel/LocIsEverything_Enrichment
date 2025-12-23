/**
 * US Historical Hydrographic Points Adapter
 * Queries GNIS Historical Hydrographic Points FeatureServer for point features
 * Supports proximity queries up to 50 miles
 */

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/GNIS_Historical_Hydrographic_Points_v/FeatureServer';

export interface USHistoricalHydrographicPointInfo {
  pointId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles: number; // Distance from query point
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Query US Historical Hydrographic Points FeatureServer
 * Supports proximity queries up to 50 miles
 */
export async function getUSHistoricalHydrographicPointsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<USHistoricalHydrographicPointInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log(`ℹ️ US Historical Hydrographic Points requires a radius for proximity query`);
      return [];
    }
    
    // Cap radius at 50 miles
    const cappedRadius = Math.min(radius, 50.0);
    
    console.log(`💧 Querying US Historical Hydrographic Points within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = cappedRadius * 1609.34;
    
    const results: USHistoricalHydrographicPointInfo[] = [];
    const processedFeatureIds = new Set<string>();
    
    // Proximity query with pagination support
    const allFeatures: any[] = [];
    let resultOffset = 0;
    const batchSize = 2000; // Max record count per request
    let hasMore = true;
    
    while (hasMore) {
      const queryUrl = new URL(`${BASE_SERVICE_URL}/0/query`);
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
      queryUrl.searchParams.set('resultRecordCount', batchSize.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      if (resultOffset === 0) {
        console.log(`🔗 US Historical Hydrographic Points Proximity Query URL: ${queryUrl.toString()}`);
      }
      
      try {
        const proximityData = await fetchJSONSmart(queryUrl.toString());
        
        if (proximityData.error) {
          console.error(`❌ US Historical Hydrographic Points API Error:`, proximityData.error);
          break;
        }
        
        if (!proximityData.features || proximityData.features.length === 0) {
          hasMore = false;
          break;
        }
        
        allFeatures.push(...proximityData.features);
        
        if (resultOffset === 0) {
          console.log(`✅ US Historical Hydrographic Points returned ${proximityData.features.length} feature(s) from proximity query`);
        }
        
        // Check if we need to fetch more results
        if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
          resultOffset += batchSize;
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(`❌ Error fetching US Historical Hydrographic Points (offset ${resultOffset}):`, error);
        hasMore = false;
      }
    }
    
    console.log(`✅ Fetched ${allFeatures.length} total US Historical Hydrographic Points features`);
    
    // Process features and calculate distances
    allFeatures.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const pointId = attributes.OBJECTID || 
                     attributes.objectid || 
                     attributes.gaz_id ||
                     attributes.GAZ_ID ||
                     attributes.gaz_name ||
                     attributes.GAZ_NAME ||
                     null;
      
      const featureId = pointId ? pointId.toString() : `${feature.OBJECTID || feature.objectid || Math.random()}`;
      
      // Skip if we already processed this feature
      if (processedFeatureIds.has(featureId)) {
        return;
      }
      
      // Calculate distance for point features
      let distance_miles = 0;
      if (geometry) {
        // Handle multipoint geometry (can have multiple points)
        if (geometry.points && geometry.points.length > 0) {
          // Calculate distance to nearest point
          let minDistance = Infinity;
          geometry.points.forEach((point: number[]) => {
            const pointLon = point[0];
            const pointLat = point[1];
            const dist = calculateHaversineDistance(lat, lon, pointLat, pointLon);
            if (dist < minDistance) minDistance = dist;
          });
          distance_miles = minDistance;
        } else if (geometry.x !== undefined && geometry.y !== undefined) {
          // Single point geometry
          distance_miles = calculateHaversineDistance(lat, lon, geometry.y, geometry.x);
        }
      }
      
      results.push({
        pointId: pointId ? pointId.toString() : null,
        attributes,
        geometry,
        distance_miles
      });
      
      processedFeatureIds.add(featureId);
    });
    
    // Sort by distance (closest first)
    results.sort((a, b) => a.distance_miles - b.distance_miles);
    
    console.log(`✅ Processed ${results.length} US Historical Hydrographic Points feature(s) within ${cappedRadius} miles`);
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying US Historical Hydrographic Points:`, error);
    return [];
  }
}

