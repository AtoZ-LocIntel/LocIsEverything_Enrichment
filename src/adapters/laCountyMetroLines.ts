/**
 * LA County MTA Metro Lines Adapter
 * Queries LA County MTA Metro Lines (linear feature service)
 * Supports proximity queries (max 25 miles)
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/MTA_Metro_Lines/FeatureServer';
const LAYER_ID = 0;

export interface LACountyMetroLineInfo {
  lineId: string | null;
  name: string | null;
  label: string | null;
  status: string | null;
  type: string | null;
  shapeLength: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query LA County MTA Metro Lines FeatureServer for proximity
 */
export async function getLACountyMetroLinesData(
  lat: number,
  lon: number,
  radius?: number
): Promise<LACountyMetroLineInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log(`ℹ️ LA County Metro Lines requires a radius for proximity query`);
      return [];
    }
    
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radius, 25.0);
    
    console.log(`🚇 Querying LA County MTA Metro Lines within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = cappedRadius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
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
    
    console.log(`🔗 LA County Metro Lines Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ LA County Metro Lines API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No LA County Metro Lines found within the specified radius');
      return [];
    }
    
    const results: LACountyMetroLineInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const lineId = attributes.OBJECTID || 
                    attributes.objectid || 
                    attributes.GlobalID ||
                    attributes.GLOBALID ||
                    null;
      
      // Extract line information
      const name = attributes.NAME || 
                  attributes.name ||
                  attributes.Name ||
                  null;
      
      const label = attributes.LABEL || 
                   attributes.label ||
                   attributes.Label ||
                   null;
      
      const status = attributes.STATUS || 
                    attributes.status ||
                    attributes.Status ||
                    null;
      
      const type = attributes.TYPE || 
                  attributes.type ||
                  attributes.Type ||
                  null;
      
      const shapeLength = attributes.Shape__Length !== null && attributes.Shape__Length !== undefined 
                         ? parseFloat(attributes.Shape__Length.toString())
                         : (attributes.shape_length !== null && attributes.shape_length !== undefined
                            ? parseFloat(attributes.shape_length.toString())
                            : null);
      
      // Calculate distance from point to nearest point on polyline
      let distance_miles = cappedRadius; // Default to max radius
      
      if (geometry && geometry.paths) {
        // Find minimum distance to any point on any path of the polyline
        let minDistance = Infinity;
        geometry.paths.forEach((path: number[][]) => {
          path.forEach((coord: number[]) => {
            const R = 3959; // Earth radius in miles
            const dLat = (lat - coord[1]) * Math.PI / 180;
            const dLon = (lon - coord[0]) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(coord[1] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            if (distance < minDistance) minDistance = distance;
          });
        });
        distance_miles = minDistance;
      }
      
      // Only include lines within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          lineId: lineId ? lineId.toString() : null,
          name,
          label,
          status,
          type,
          shapeLength,
          attributes,
          geometry,
          distance_miles: Number(distance_miles.toFixed(2))
        });
      }
    });
    
    // Sort by distance (closest first)
    results.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${results.length} LA County Metro Line(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying LA County MTA Metro Lines:', error);
    return [];
  }
}

