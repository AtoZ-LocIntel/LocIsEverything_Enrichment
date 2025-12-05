/**
 * CA Black Bear Range Adapter
 * Queries California Black Bear Range from CDFW BIOS FeatureServer
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services2.arcgis.com/Uq9r85Potqm3MfRV/arcgis/rest/services/biosds792_fpu/FeatureServer';
const LAYER_ID = 0;

export interface CABlackBearRangeInfo {
  rangeId: string | null;
  shapeName: string | null;
  commonName: string | null;
  scientificName: string | null;
  symbol: string | null;
  occYears: string | null;
  rangeStart: string | null;
  rangeEnd: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA Black Bear Range FeatureServer for point-in-polygon and proximity
 */
export async function getCABlackBearRangeData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CABlackBearRangeInfo[]> {
  try {
    const results: CABlackBearRangeInfo[] = [];
    
    // Point-in-polygon query
    console.log(`🐻 Querying CA Black Bear Range for containing range at [${lat}, ${lon}]`);
    
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
          
          const rangeId = attributes.OBJECTID || 
                        attributes.objectid || 
                        attributes.FID ||
                        attributes.fid ||
                        attributes.GlobalID ||
                        null;
          
          results.push({
            rangeId: rangeId ? rangeId.toString() : null,
            shapeName: attributes.Shape_Name || attributes.shape_name || attributes.ShapeName || null,
            commonName: attributes.CName || attributes.cname || attributes.CName || null,
            scientificName: attributes.SName || attributes.sname || attributes.SName || null,
            symbol: attributes.Symbol || attributes.symbol || null,
            occYears: attributes.Occ_Years || attributes.occ_years || attributes.OccYears || null,
            rangeStart: attributes.RangeStart || attributes.range_start || attributes.RangeStart || null,
            rangeEnd: attributes.RangeEnd || attributes.range_end || attributes.RangeEnd || null,
            attributes,
            geometry,
            distance_miles: 0 // Containing polygon
          });
        });
      }
    }
    
    // Proximity query if radius is provided
    if (radius && radius > 0) {
      console.log(`🐻 Querying CA Black Bear Range within ${radius} miles of [${lat}, ${lon}]`);
      
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
            
            const rangeId = attributes.OBJECTID || 
                          attributes.objectid || 
                          attributes.FID ||
                          attributes.fid ||
                          attributes.GlobalID ||
                          null;
            
            // Check if this range is already in results (from point-in-polygon)
            const existingIndex = results.findIndex(r => 
              (r.rangeId && r.rangeId === (rangeId ? rangeId.toString() : null))
            );
            
            if (existingIndex === -1) {
              const distance_miles = radius; // Approximate
              
              results.push({
                rangeId: rangeId ? rangeId.toString() : null,
                shapeName: attributes.Shape_Name || attributes.shape_name || attributes.ShapeName || null,
                commonName: attributes.CName || attributes.cname || attributes.CName || null,
                scientificName: attributes.SName || attributes.sname || attributes.SName || null,
                symbol: attributes.Symbol || attributes.symbol || null,
                occYears: attributes.Occ_Years || attributes.occ_years || attributes.OccYears || null,
                rangeStart: attributes.RangeStart || attributes.range_start || attributes.RangeStart || null,
                rangeEnd: attributes.RangeEnd || attributes.range_end || attributes.RangeEnd || null,
                attributes,
                geometry,
                distance_miles
              });
            }
          });
        }
      }
    }
    
    console.log(`✅ Found ${results.length} CA Black Bear Range/Ranges`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA Black Bear Range:', error);
    return [];
  }
}

