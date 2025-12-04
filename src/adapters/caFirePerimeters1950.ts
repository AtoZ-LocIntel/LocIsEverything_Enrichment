/**
 * CA Fire Perimeters (1950+) Adapter
 * Queries California Fire Perimeters (1950+) from CA Open Data Portal FeatureServer
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer';
const LAYER_ID = 2;

export interface CAFirePerimeterInfo {
  fireId: string | null;
  fireName: string | null;
  fireYear: number | null;
  acres: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA Fire Perimeters (1950+) FeatureServer for point-in-polygon and proximity
 */
export async function getCAFirePerimeters1950Data(
  lat: number,
  lon: number,
  radius?: number
): Promise<CAFirePerimeterInfo[]> {
  try {
    const results: CAFirePerimeterInfo[] = [];
    
    // Point-in-polygon query
    console.log(`🔥 Querying CA Fire Perimeters (1950+) for containing fire at [${lat}, ${lon}]`);
    
    const pointInPolyUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
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
    
    const pointInPolyResponse = await fetch(pointInPolyUrl.toString());
    
    if (pointInPolyResponse.ok) {
      const pointInPolyData = await pointInPolyResponse.json();
      
      if (pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const fireId = attributes.OBJECTID || 
                         attributes.objectid || 
                         attributes.GlobalID ||
                         null;
          
          results.push({
            fireId: fireId ? fireId.toString() : null,
            fireName: attributes.FIRE_NAME || attributes.fire_name || attributes.Name || attributes.name || null,
            fireYear: attributes.YEAR_ !== null && attributes.YEAR_ !== undefined 
              ? parseInt(attributes.YEAR_.toString()) 
              : (attributes.year !== null && attributes.year !== undefined 
                ? parseInt(attributes.year.toString()) 
                : (attributes.Year !== null && attributes.Year !== undefined 
                  ? parseInt(attributes.Year.toString()) 
                  : null)),
            acres: attributes.ACRES !== null && attributes.ACRES !== undefined 
              ? parseFloat(attributes.ACRES.toString()) 
              : (attributes.acres !== null && attributes.acres !== undefined 
                ? parseFloat(attributes.acres.toString()) 
                : null),
            attributes,
            geometry,
            distance_miles: 0 // Containing polygon
          });
        });
      }
    }
    
    // Proximity query if radius is provided
    if (radius && radius > 0) {
      console.log(`🔥 Querying CA Fire Perimeters (1950+) within ${radius} miles of [${lat}, ${lon}]`);
      
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
            
            const fireId = attributes.OBJECTID || 
                          attributes.objectid || 
                          attributes.GlobalID ||
                          null;
            
            // Check if this fire is already in results (from point-in-polygon)
            const existingIndex = results.findIndex(r => 
              (r.fireId && r.fireId === (fireId ? fireId.toString() : null))
            );
            
            if (existingIndex === -1) {
              const distance_miles = radius; // Approximate
              
              results.push({
                fireId: fireId ? fireId.toString() : null,
                fireName: attributes.FIRE_NAME || attributes.fire_name || attributes.Name || attributes.name || null,
                fireYear: attributes.YEAR_ !== null && attributes.YEAR_ !== undefined 
                  ? parseInt(attributes.YEAR_.toString()) 
                  : (attributes.year !== null && attributes.year !== undefined 
                    ? parseInt(attributes.year.toString()) 
                    : (attributes.Year !== null && attributes.Year !== undefined 
                      ? parseInt(attributes.Year.toString()) 
                      : null)),
                acres: attributes.ACRES !== null && attributes.ACRES !== undefined 
                  ? parseFloat(attributes.ACRES.toString()) 
                  : (attributes.acres !== null && attributes.acres !== undefined 
                    ? parseFloat(attributes.acres.toString()) 
                    : null),
                attributes,
                geometry,
                distance_miles
              });
            }
          });
        }
      }
    }
    
    console.log(`✅ Found ${results.length} CA Fire Perimeter(s) (1950+)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA Fire Perimeters (1950+):', error);
    return [];
  }
}

