/**
 * CA State Parks Boundaries Adapter
 * Queries California State Parks Boundaries from CA State Parks FeatureServer
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/ParkBoundaries/FeatureServer';
const LAYER_ID = 0;

export interface CAStateParkBoundaryInfo {
  boundaryId: string | null;
  unitName: string | null;
  gisId: string | null;
  subType: string | null;
  unitNbr: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA State Parks Boundaries FeatureServer for point-in-polygon and proximity
 */
export async function getCAStateParksBoundariesData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CAStateParkBoundaryInfo[]> {
  try {
    const results: CAStateParkBoundaryInfo[] = [];
    
    // Point-in-polygon query
    console.log(`🏞️ Querying CA State Parks Boundaries for containing park at [${lat}, ${lon}]`);
    
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
          
          const boundaryId = attributes.FID || 
                            attributes.fid || 
                            attributes.OBJECTID ||
                            attributes.objectid ||
                            attributes.GlobalID ||
                            null;
          
          results.push({
            boundaryId: boundaryId ? boundaryId.toString() : null,
            unitName: attributes.UNITNAME || attributes.unitName || attributes.UnitName || null,
            gisId: attributes.GISID || attributes.gisId || attributes.GisId || null,
            subType: attributes.SUBTYPE || attributes.subType || attributes.SubType || null,
            unitNbr: attributes.UNITNBR || attributes.unitNbr || attributes.UnitNbr || null,
            attributes,
            geometry,
            distance_miles: 0 // Containing polygon
          });
        });
      }
    }
    
    // Proximity query if radius is provided
    if (radius && radius > 0) {
      console.log(`🏞️ Querying CA State Parks Boundaries within ${radius} miles of [${lat}, ${lon}]`);
      
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
            
            const boundaryId = attributes.FID || 
                              attributes.fid || 
                              attributes.OBJECTID ||
                              attributes.objectid ||
                              attributes.GlobalID ||
                              null;
            
            // Check if this boundary is already in results (from point-in-polygon)
            const existingIndex = results.findIndex(r => 
              (r.boundaryId && r.boundaryId === (boundaryId ? boundaryId.toString() : null))
            );
            
            if (existingIndex === -1) {
              const distance_miles = radius; // Approximate
              
              results.push({
                boundaryId: boundaryId ? boundaryId.toString() : null,
                unitName: attributes.UNITNAME || attributes.unitName || attributes.UnitName || null,
                gisId: attributes.GISID || attributes.gisId || attributes.GisId || null,
                subType: attributes.SUBTYPE || attributes.subType || attributes.SubType || null,
                unitNbr: attributes.UNITNBR || attributes.unitNbr || attributes.UnitNbr || null,
                attributes,
                geometry,
                distance_miles
              });
            }
          });
        }
      }
    }
    
    console.log(`✅ Found ${results.length} CA State Park Boundary/Boundaries`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA State Parks Boundaries:', error);
    return [];
  }
}

