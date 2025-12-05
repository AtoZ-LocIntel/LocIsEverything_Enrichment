/**
 * CA Highway Rest Areas Adapter
 * Queries California Highway Rest Areas from Caltrans GIS FeatureServer
 * Supports proximity queries
 */

const BASE_SERVICE_URL = 'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/Rest_Areas/FeatureServer';
const LAYER_ID = 0;

export interface CAHighwayRestAreaInfo {
  restAreaId: string | null;
  name: string | null;
  route: string | null;
  direction: string | null;
  county: string | null;
  city: string | null;
  amenities: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA Highway Rest Areas FeatureServer for proximity
 */
export async function getCAHighwayRestAreasData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CAHighwayRestAreaInfo[]> {
  try {
    const results: CAHighwayRestAreaInfo[] = [];
    
    // Proximity query if radius is provided
    if (radius && radius > 0) {
      console.log(`🚗 Querying CA Highway Rest Areas within ${radius} miles of [${lat}, ${lon}]`);
      
      const radiusMeters = radius * 1609.34;
      
      const proximityUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
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
      proximityUrl.searchParams.set('distance', radiusMeters.toString());
      proximityUrl.searchParams.set('units', 'esriSRUnit_Meter');
      proximityUrl.searchParams.set('inSR', '4326');
      proximityUrl.searchParams.set('outSR', '4326');
      proximityUrl.searchParams.set('returnGeometry', 'true');
      
      const proximityResponse = await fetch(proximityUrl.toString());
      
      if (proximityResponse.ok) {
        const proximityData = await proximityResponse.json();
        
        if (proximityData.features && proximityData.features.length > 0) {
          proximityData.features.forEach((feature: any) => {
            const attributes = feature.attributes || {};
            const geometry = feature.geometry || null;
            
            const restAreaId = attributes.OBJECTID || 
                          attributes.objectid || 
                          attributes.FID ||
                          attributes.fid ||
                          attributes.GlobalID ||
                          null;
            
            // Calculate distance (approximate)
            let distance_miles = radius;
            if (geometry && geometry.x && geometry.y) {
              // Simple distance calculation (Haversine would be more accurate but this is fine for approximation)
              const latDiff = Math.abs(lat - geometry.y);
              const lonDiff = Math.abs(lon - geometry.x);
              const distanceDegrees = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
              distance_miles = distanceDegrees * 69; // Rough conversion
            }
            
            results.push({
              restAreaId: restAreaId ? restAreaId.toString() : null,
              name: attributes.Name || attributes.NAME || attributes.name || attributes.REST_AREA_NAME || attributes.rest_area_name || null,
              route: attributes.Route || attributes.ROUTE || attributes.route || null,
              direction: attributes.Direction || attributes.DIRECTION || attributes.direction || null,
              county: attributes.County || attributes.COUNTY || attributes.county || null,
              city: attributes.City || attributes.CITY || attributes.city || null,
              amenities: attributes.Amenities || attributes.AMENITIES || attributes.amenities || null,
              attributes,
              geometry,
              distance_miles
            });
          });
        }
      }
    }
    
    console.log(`✅ Found ${results.length} CA Highway Rest Areas`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA Highway Rest Areas:', error);
    return [];
  }
}

