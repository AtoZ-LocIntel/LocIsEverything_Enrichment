/**
 * LA County Transportation Adapter
 * Queries LA County Transportation MapServer for various transportation data
 * All layers are points or lines - proximity queries only (up to 25 miles)
 */

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Transportation/MapServer';

export interface LACountyTransportationInfo {
  transportationId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query LA County Transportation MapServer for a specific layer
 * All layers are points or lines - proximity queries only (up to 25 miles)
 */
export async function getLACountyTransportationData(
  layerId: number,
  lat: number,
  lon: number,
  radius?: number
): Promise<LACountyTransportationInfo[]> {
  try {
    const results: LACountyTransportationInfo[] = [];
    const maxRadius = radius ? Math.min(radius, 25) : 25; // Cap at 25 miles
    
    console.log(`🗺️ Querying LA County Transportation Layer ${layerId} for proximity at [${lat}, ${lon}]`);
    
    // Proximity query only (all layers are points or lines)
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
      
      console.log(`🔗 LA County Transportation Layer ${layerId} Proximity Query URL: ${proximityUrl.toString()}`);
      
      try {
        const proximityData = await fetchJSONSmart(proximityUrl.toString());
        
        if (!proximityData.error && proximityData.features && proximityData.features.length > 0) {
          proximityData.features.forEach((feature: any) => {
            const attributes = feature.attributes || {};
            const geometry = feature.geometry || null;
            
            const transportationId = attributes.OBJECTID || 
                                     attributes.objectid || 
                                     attributes.GlobalID ||
                                     attributes.GLOBALID ||
                                     attributes.ID ||
                                     attributes.id ||
                                     attributes.NAME ||
                                     attributes.Name ||
                                     attributes.name ||
                                     attributes.STATION_NAME ||
                                     attributes.station_name ||
                                     attributes.STATION ||
                                     attributes.station ||
                                     attributes.LINE ||
                                     attributes.line ||
                                     attributes.ROUTE ||
                                     attributes.route ||
                                     null;
            
            // Calculate distance using Haversine formula
            let distance_miles = 0;
            if (geometry) {
              let featureLat = lat;
              let featureLon = lon;
              
              // Handle point geometry
              if (geometry.x !== undefined && geometry.y !== undefined) {
                featureLon = geometry.x;
                featureLat = geometry.y;
              }
              // Handle polyline geometry (use first coordinate)
              else if (geometry.paths && geometry.paths.length > 0 && geometry.paths[0].length > 0) {
                const firstCoord = geometry.paths[0][0];
                featureLon = firstCoord[0];
                featureLat = firstCoord[1];
              }
              
              const R = 3959; // Earth's radius in miles
              const dLat = (featureLat - lat) * Math.PI / 180;
              const dLon = (featureLon - lon) * Math.PI / 180;
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(lat * Math.PI / 180) * Math.cos(featureLat * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              distance_miles = R * c;
            }
            
            if (distance_miles <= maxRadius) {
              results.push({
                transportationId: transportationId ? transportationId.toString() : null,
                attributes,
                geometry,
                distance_miles
              });
            }
          });
        }
      } catch (error) {
        console.error(`❌ Proximity query failed for layer ${layerId}:`, error);
      }
    }
    
    console.log(`✅ Found ${results.length} LA County Transportation Layer ${layerId} feature(s)`);
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying LA County Transportation Layer ${layerId}:`, error);
    return [];
  }
}

