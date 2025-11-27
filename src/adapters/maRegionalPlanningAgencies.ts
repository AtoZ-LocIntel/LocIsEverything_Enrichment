/**
 * Adapter for MA Regional Planning Agencies (RPAs)
 * Service: https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/RPAs/FeatureServer/0
 */

export interface MARegionalPlanningAgency {
  objectId?: number;
  RPA_ID?: number;
  RPA_NAME?: string;
  ACRONYM?: string;
  WEBSITE?: string;
  geometry?: any;
  distance_miles?: number;
}

/**
 * Query MA Regional Planning Agencies for point-in-polygon
 */
export async function getMARegionalPlanningAgenciesContainingData(
  lat: number,
  lon: number
): Promise<MARegionalPlanningAgency[]> {
  try {
    const queryUrl = new URL('https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/RPAs/FeatureServer/0/query');
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
    queryUrl.searchParams.set('returnGeometry', 'true');
    queryUrl.searchParams.set('outSR', '4326');
    
    console.log(`🔗 MA Regional Planning Agencies Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`MA Regional Planning Agencies API failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📊 MA Regional Planning Agencies response:`, data);
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No MA Regional Planning Agencies found containing point...`);
      return [];
    }
    
    const agencies = data.features.map((feature: any) => {
      const attrs = feature.attributes || {};
      return {
        objectId: attrs.OBJECTID,
        RPA_ID: attrs.RPA_ID,
        RPA_NAME: attrs.RPA_NAME,
        ACRONYM: attrs.ACRONYM,
        WEBSITE: attrs.WEBSITE,
        geometry: feature.geometry,
        distance_miles: 0 // Point is inside polygon
      };
    });
    
    console.log(`✅ Found ${agencies.length} MA Regional Planning Agencies containing point... first has geometry:`, !!agencies[0]?.geometry, 'has rings:', !!agencies[0]?.geometry?.rings);
    
    return agencies;
  } catch (error) {
    console.error('❌ Error fetching MA Regional Planning Agencies:', error);
    throw error;
  }
}

