/**
 * LA County LMS Data Adapter
 * Queries LA County LMS Data MapServer for various point of interest data
 * All LMS layers are point layers - proximity queries only
 */

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer';

export interface LACountyLMSDataInfo {
  lmsId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  isContaining?: boolean; // For point-in-polygon queries
  distance_miles?: number; // For proximity queries
}

/**
 * Query LA County LMS Data MapServer for a specific layer
 * All LMS layers are point layers - proximity queries only
 */
export async function getLACountyLMSData(
  layerId: number,
  lat: number,
  lon: number,
  radius?: number
): Promise<LACountyLMSDataInfo[]> {
  try {
    const results: LACountyLMSDataInfo[] = [];
    
    // All LMS layers are point layers - only perform proximity queries
    // Use provided radius or default to 25 miles
    const cappedRadius = Math.min(radius || 25.0, 25.0);
    
    console.log(`🗺️ Querying LA County LMS Data Layer ${layerId} within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = cappedRadius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
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
    
    console.log(`🔗 LA County LMS Data Layer ${layerId} Proximity Query URL: ${queryUrl.toString()}`);
    
    try {
      const proximityData = await fetchJSONSmart(queryUrl.toString());
      
      if (!proximityData.error && proximityData.features && proximityData.features.length > 0) {
        proximityData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const lmsId = attributes.OBJECTID || 
                       attributes.objectid || 
                       attributes.GlobalID ||
                       attributes.GLOBALID ||
                       attributes.ID ||
                       attributes.id ||
                       attributes.NAME ||
                       attributes.Name ||
                       attributes.name ||
                       null;
          
          // Calculate distance for point features
          let distance_miles = 0;
          if (geometry && geometry.x && geometry.y) {
            // Point geometry
            const pointLat = geometry.y;
            const pointLon = geometry.x;
            distance_miles = calculateHaversineDistance(lat, lon, pointLat, pointLon);
          }
          
          results.push({
            lmsId: lmsId ? lmsId.toString() : null,
            attributes,
            geometry,
            distance_miles
          });
        });
        
        console.log(`✅ Found ${proximityData.features.length} LA County LMS Data Layer ${layerId} feature(s) within ${cappedRadius} miles`);
      } else {
        console.log(`ℹ️ No LA County LMS Data Layer ${layerId} features found within ${cappedRadius} miles`);
      }
    } catch (error) {
      console.error(`❌ Proximity query failed for layer ${layerId}:`, error);
    }
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying LA County LMS Data Layer ${layerId}:`, error);
    return [];
  }
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

