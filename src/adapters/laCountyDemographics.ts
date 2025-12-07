/**
 * LA County Demographics Adapter
 * Queries LA County Demographics MapServer for census and demographic data
 * Supports point-in-polygon queries for polygon layers
 */

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Demographics/MapServer';

export interface LACountyDemographicInfo {
  demographicId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  isContaining?: boolean; // For point-in-polygon queries
  distance_miles?: number; // For proximity queries
}

/**
 * Query LA County Demographics MapServer for a specific layer
 * Supports point-in-polygon queries for polygon layers (all demographic layers are polygons)
 */
export async function getLACountyDemographicsData(
  layerId: number,
  lat: number,
  lon: number,
  radius?: number
): Promise<LACountyDemographicInfo[]> {
  try {
    // All demographic layers are polygon layers
    const results: LACountyDemographicInfo[] = [];
    const processedFeatureIds = new Set<string>();
    
    // Always try point-in-polygon first (for containing features)
    console.log(`🗺️ Querying LA County Demographics Layer ${layerId} for point-in-polygon at [${lat}, ${lon}]`);
    
    const pointInPolyUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
    pointInPolyUrl.searchParams.set('f', 'json');
    pointInPolyUrl.searchParams.set('where', '1=1');
    pointInPolyUrl.searchParams.set('outFields', '*');
    pointInPolyUrl.searchParams.set('geometry', JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }));
    pointInPolyUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    pointInPolyUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    pointInPolyUrl.searchParams.set('inSR', '4326');
    pointInPolyUrl.searchParams.set('outSR', '4326');
    pointInPolyUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 LA County Demographics Layer ${layerId} Point-in-Polygon Query URL: ${pointInPolyUrl.toString()}`);
    
    try {
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl.toString());
      
      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const demographicId = attributes.OBJECTID || 
                              attributes.objectid || 
                              attributes.GlobalID ||
                              attributes.GLOBALID ||
                              attributes.GEOID ||
                              attributes.geoid ||
                              attributes.TRACT ||
                              attributes.tract ||
                              attributes.BLOCK_GROUP ||
                              attributes.block_group ||
                              attributes.BLOCK ||
                              attributes.block ||
                              attributes.NAME ||
                              attributes.Name ||
                              attributes.name ||
                              null;
          
          const featureId = demographicId ? demographicId.toString() : `${feature.OBJECTID || feature.objectid || Math.random()}`;
          
          // For point-in-polygon, if the service returned it, it's likely containing
          // Use the spatialRel=esriSpatialRelIntersects result as containing
          let isContaining = true; // If service returned it with Intersects, it contains the point
          
          // Double-check with ray casting if geometry is available
          if (geometry && geometry.rings) {
            const rings = geometry.rings;
            if (rings && rings.length > 0) {
              const outerRing = rings[0];
              let inside = false;
              for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
                const xi = outerRing[i][0], yi = outerRing[i][1];
                const xj = outerRing[j][0], yj = outerRing[j][1];
                const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
              }
              isContaining = inside;
            }
          }
          
          // Include all features returned by point-in-polygon query (they intersect/contain)
          results.push({
            demographicId: demographicId ? demographicId.toString() : null,
            attributes,
            geometry,
            isContaining: isContaining,
            distance_miles: 0
          });
          processedFeatureIds.add(featureId);
        });
        
        console.log(`✅ Found ${results.length} LA County Demographics Layer ${layerId} feature(s) containing the point`);
      }
    } catch (error) {
      console.warn(`⚠️ Point-in-polygon query failed for layer ${layerId}, continuing with proximity:`, error);
    }
    
    // Always do proximity query (to supplement point-in-polygon with nearby features)
    // Use provided radius or default to 25 miles
    const cappedRadius = Math.min(radius || 25.0, 25.0);
    
    console.log(`⚠️ Querying LA County Demographics Layer ${layerId} within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 LA County Demographics Layer ${layerId} Proximity Query URL: ${queryUrl.toString()}`);
    
    try {
      const proximityData = await fetchJSONSmart(queryUrl.toString());
      
      if (!proximityData.error && proximityData.features && proximityData.features.length > 0) {
        proximityData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const demographicId = attributes.OBJECTID || 
                            attributes.objectid || 
                            attributes.GlobalID ||
                            attributes.GLOBALID ||
                            attributes.GEOID ||
                            attributes.geoid ||
                            attributes.TRACT ||
                            attributes.tract ||
                            attributes.BLOCK_GROUP ||
                            attributes.block_group ||
                            attributes.BLOCK ||
                            attributes.block ||
                            attributes.NAME ||
                            attributes.Name ||
                            attributes.name ||
                            null;
          
          const featureId = demographicId ? demographicId.toString() : `${feature.OBJECTID || feature.objectid || Math.random()}`;
          
          // Skip if we already have this feature from point-in-polygon
          if (processedFeatureIds.has(featureId)) {
            return;
          }
          
          // Calculate distance for proximity queries
          let distance_miles = 0;
          if (geometry && geometry.rings) {
            // Polygon geometry - calculate distance to nearest point
            const rings = geometry.rings;
            if (rings && rings.length > 0) {
              const outerRing = rings[0];
              let minDistance = Infinity;
              outerRing.forEach((coord: number[]) => {
                const coordLat = coord[1];
                const coordLon = coord[0];
                const dist = calculateHaversineDistance(lat, lon, coordLat, coordLon);
                if (dist < minDistance) minDistance = dist;
              });
              distance_miles = minDistance;
            }
          }
          
          results.push({
            demographicId: demographicId ? demographicId.toString() : null,
            attributes,
            geometry,
            distance_miles
          });
          processedFeatureIds.add(featureId);
        });
        
        console.log(`✅ Found ${proximityData.features.length} LA County Demographics Layer ${layerId} feature(s) within ${cappedRadius} miles (${results.length} total including containing)`);
      }
    } catch (error) {
      console.warn(`⚠️ Proximity query failed for layer ${layerId}:`, error);
    }
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying LA County Demographics Layer ${layerId}:`, error);
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

