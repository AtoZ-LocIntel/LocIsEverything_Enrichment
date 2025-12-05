/**
 * CA CGS Liquefaction Zones Adapter
 * Queries California Geological Survey (CGS) Liquefaction Zones from CA Open Data Portal FeatureServer
 * Supports point-in-polygon and proximity queries (up to 25 miles)
 */

const BASE_SERVICE_URL = 'https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Liquefaction_Zones/FeatureServer';
const LAYER_ID = 0;

export interface CACGSLiquefactionZoneInfo {
  liquefactionZoneId: string | null;
  zoneName: string | null;
  zoneType: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA CGS Liquefaction Zones FeatureServer for point-in-polygon and proximity
 * Proximity queries are limited to 25 miles maximum
 */
export async function getCACGSLiquefactionZonesData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CACGSLiquefactionZoneInfo[]> {
  try {
    const results: CACGSLiquefactionZoneInfo[] = [];
    
    // Limit radius to 25 miles maximum as specified
    const maxRadius = 25;
    const queryRadius = radius && radius > 0 ? Math.min(radius, maxRadius) : undefined;
    
    // Point-in-polygon query
    console.log(`🌊 Querying CA CGS Liquefaction Zones for containing zone at [${lat}, ${lon}]`);
    
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
          
          const zoneId = attributes.OBJECTID || 
                         attributes.objectid || 
                         attributes.GlobalID ||
                         attributes.FID ||
                         null;
          
          results.push({
            liquefactionZoneId: zoneId ? zoneId.toString() : null,
            zoneName: attributes.NAME || attributes.name || attributes.Name || attributes.ZONE_NAME || attributes.zone_name || null,
            zoneType: attributes.TYPE || attributes.type || attributes.Type || attributes.ZONE_TYPE || attributes.zone_type || null,
            attributes,
            geometry,
            distance_miles: 0 // Containing polygon
          });
        });
      }
    }
    
    // Proximity query if radius is provided (limited to 25 miles)
    if (queryRadius && queryRadius > 0) {
      console.log(`🌊 Querying CA CGS Liquefaction Zones within ${queryRadius} miles of [${lat}, ${lon}]`);
      
      const radiusMeters = queryRadius * 1609.34;
      
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
            
            const zoneId = attributes.OBJECTID || 
                          attributes.objectid || 
                          attributes.GlobalID ||
                          attributes.FID ||
                          null;
            
            // Check if this zone is already in results (from point-in-polygon)
            const existingIndex = results.findIndex(r => 
              (r.liquefactionZoneId && r.liquefactionZoneId === (zoneId ? zoneId.toString() : null))
            );
            
            if (existingIndex === -1) {
              const distance_miles = queryRadius; // Approximate
              
              results.push({
                liquefactionZoneId: zoneId ? zoneId.toString() : null,
                zoneName: attributes.NAME || attributes.name || attributes.Name || attributes.ZONE_NAME || attributes.zone_name || null,
                zoneType: attributes.TYPE || attributes.type || attributes.Type || attributes.ZONE_TYPE || attributes.zone_type || null,
                attributes,
                geometry,
                distance_miles
              });
            }
          });
        }
      }
    }
    
    console.log(`✅ Found ${results.length} CA CGS Liquefaction Zone(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA CGS Liquefaction Zones:', error);
    return [];
  }
}

