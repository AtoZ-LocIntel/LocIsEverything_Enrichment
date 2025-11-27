export interface NHSSURGO {
  objectId?: number;
  areasymbol?: string; // Soils code
  muname?: string; // Soil name
  mukey?: number;
  musym?: string;
  hydgrpdcd?: string;
  drclassdcd?: string;
  slopegradd?: number;
  farmlndcl?: string;
  nhiforsoig?: string;
  hydclprs?: number;
  spatialver?: number;
  acres?: number;
  geometry?: any;
  distance_miles?: number;
}

export async function getNHSSURGOContainingData(
  lat: number,
  lon: number
): Promise<NHSSURGO[]> {
  try {
    const queryUrl = new URL('https://nhgeodata.unh.edu/hosting/rest/services/Hosted/GG_SoilsResources/FeatureServer/0/query');
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

    console.log(`🔗 NH SSURGO Query URL: ${queryUrl.toString()}`);

    const response = await fetch(queryUrl.toString());

    if (!response.ok) {
      throw new Error(`NH SSURGO API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 NH SSURGO response:`, data);

    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH SSURGO soils found containing point...`);
      return [];
    }

    const soils = data.features.map((feature: any) => {
      const attrs = feature.attributes || {};
      return {
        objectId: attrs.OBJECTID || attrs.objectId,
        areasymbol: attrs.AREASYMBOL || attrs.areasymbol,
        muname: attrs.MUNAME || attrs.muname,
        mukey: attrs.MUKEY || attrs.mukey,
        musym: attrs.MUSYM || attrs.musym,
        hydgrpdcd: attrs.HYDGRPDCD || attrs.hydgrpdcd,
        drclassdcd: attrs.DRCLASSDCD || attrs.drclassdcd,
        slopegradd: attrs.SLOPEGRADD || attrs.slopegradd,
        farmlndcl: attrs.FARMLNDCL || attrs.farmlndcl,
        nhiforsoig: attrs.NHIFORSOIG || attrs.nhiforsoig,
        hydclprs: attrs.HYDCLPRS || attrs.hydclprs,
        spatialver: attrs.SPATIALVER || attrs.spatialver,
        acres: attrs.ACRES || attrs.acres,
        geometry: feature.geometry,
        distance_miles: 0 // Point is inside polygon
      };
    });

    console.log(`✅ Found ${soils.length} NH SSURGO soil(s) containing point... first has geometry:`, !!soils[0]?.geometry, 'has rings:', !!soils[0]?.geometry?.rings);

    return soils;
  } catch (error) {
    console.error('❌ Error fetching NH SSURGO:', error);
    throw error;
  }
}

