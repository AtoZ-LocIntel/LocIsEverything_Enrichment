/**
 * LA County Redistricting Data Adapter
 * Queries LA County Redistricting Data MapServer for various redistricting and demographic data
 * All layers are polygon layers - point-in-polygon and proximity queries (up to 5 miles)
 */

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Redistricting_Data_2011/MapServer';

export interface LACountyRedistrictingInfo {
  redistrictingId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  isContaining?: boolean; // For point-in-polygon queries
  distance_miles?: number; // For proximity queries
}

/**
 * Query LA County Redistricting Data MapServer for a specific layer
 * All layers are polygon layers - point-in-polygon and proximity queries (up to 5 miles)
 */
export async function getLACountyRedistrictingData(
  layerId: number,
  lat: number,
  lon: number,
  radius?: number
): Promise<LACountyRedistrictingInfo[]> {
  try {
    const results: LACountyRedistrictingInfo[] = [];
    const maxRadius = radius ? Math.min(radius, 5) : 5; // Cap at 5 miles
    
    console.log(`🗺️ Querying LA County Redistricting Data Layer ${layerId} for point-in-polygon and proximity at [${lat}, ${lon}]`);
    
    // Point-in-polygon query
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
    
    console.log(`🔗 LA County Redistricting Data Layer ${layerId} Point-in-Polygon Query URL: ${pointInPolyUrl.toString()}`);
    
    try {
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl.toString());
      
      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const redistrictingId = attributes.OBJECTID || 
                                 attributes.objectid || 
                                 attributes.GlobalID ||
                                 attributes.GLOBALID ||
                                 attributes.ID ||
                                 attributes.id ||
                                 attributes.NAME ||
                                 attributes.Name ||
                                 attributes.name ||
                                 attributes.COMMUNITY ||
                                 attributes.community ||
                                 attributes.COMMUNITY_NAME ||
                                 attributes.community_name ||
                                 null;
          
          // Verify point-in-polygon with ray casting
          let isContaining = false;
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
          
          if (isContaining) {
            results.push({
              redistrictingId: redistrictingId ? redistrictingId.toString() : null,
              attributes,
              geometry,
              isContaining: true,
              distance_miles: 0
            });
          }
        });
      }
    } catch (error) {
      console.error(`❌ Point-in-polygon query failed for layer ${layerId}:`, error);
    }
    
    // Proximity query (if radius is provided and less than 5 miles)
    if (maxRadius > 0) {
      const proximityUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
      proximityUrl.searchParams.set('f', 'json');
      proximityUrl.searchParams.set('where', '1=1');
      proximityUrl.searchParams.set('outFields', '*');
      proximityUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      proximityUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      proximityUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      proximityUrl.searchParams.set('distance', (maxRadius * 1609.34).toString()); // Convert miles to meters
      proximityUrl.searchParams.set('units', 'esriSRUnit_Meter');
      proximityUrl.searchParams.set('inSR', '4326');
      proximityUrl.searchParams.set('outSR', '4326');
      proximityUrl.searchParams.set('returnGeometry', 'true');
      
      console.log(`🔗 LA County Redistricting Data Layer ${layerId} Proximity Query URL: ${proximityUrl.toString()}`);
      
      try {
        const proximityData = await fetchJSONSmart(proximityUrl.toString());
        
        if (!proximityData.error && proximityData.features && proximityData.features.length > 0) {
          proximityData.features.forEach((feature: any) => {
            const attributes = feature.attributes || {};
            const geometry = feature.geometry || null;
            
            const redistrictingId = attributes.OBJECTID || 
                                   attributes.objectid || 
                                   attributes.GlobalID ||
                                   attributes.GLOBALID ||
                                   attributes.ID ||
                                   attributes.id ||
                                   attributes.NAME ||
                                   attributes.Name ||
                                   attributes.name ||
                                   attributes.COMMUNITY ||
                                   attributes.community ||
                                   attributes.COMMUNITY_NAME ||
                                   attributes.community_name ||
                                   null;
            
            // Calculate distance using Haversine formula
            let distance_miles = 0;
            if (geometry && geometry.rings && geometry.rings.length > 0) {
              const outerRing = geometry.rings[0];
              if (outerRing && outerRing.length > 0) {
                const firstCoord = outerRing[0];
                const featureLat = firstCoord[1];
                const featureLon = firstCoord[0];
                
                const R = 3959; // Earth's radius in miles
                const dLat = (featureLat - lat) * Math.PI / 180;
                const dLon = (featureLon - lon) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                          Math.cos(lat * Math.PI / 180) * Math.cos(featureLat * Math.PI / 180) *
                          Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                distance_miles = R * c;
              }
            }
            
            // Only add if not already in results (from point-in-polygon) or if it's closer
            const existingIndex = results.findIndex(r => 
              r.redistrictingId === (redistrictingId ? redistrictingId.toString() : null)
            );
            
            if (existingIndex === -1 && distance_miles <= maxRadius) {
              results.push({
                redistrictingId: redistrictingId ? redistrictingId.toString() : null,
                attributes,
                geometry,
                isContaining: false,
                distance_miles
              });
            } else if (existingIndex !== -1 && distance_miles < (results[existingIndex].distance_miles || Infinity)) {
              results[existingIndex].distance_miles = distance_miles;
            }
          });
        }
      } catch (error) {
        console.error(`❌ Proximity query failed for layer ${layerId}:`, error);
      }
    }
    
    console.log(`✅ Found ${results.length} LA County Redistricting Data Layer ${layerId} feature(s)`);
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying LA County Redistricting Data Layer ${layerId}:`, error);
    return [];
  }
}

