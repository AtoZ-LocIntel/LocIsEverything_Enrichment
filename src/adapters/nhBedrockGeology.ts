export interface NHBedrockGeology {
  objectId?: number;
  code?: string; // Bedrock code
  major?: string;
  formation1?: string;
  formation2?: string;
  pluton_age?: string;
  rock_type?: string;
  fullname?: string;
  geologichistory?: string;
  lithology?: string;
  source?: string;
  geometry?: any;
  distance_miles?: number;
}

export async function getNHBedrockGeologyContainingData(
  lat: number,
  lon: number
): Promise<NHBedrockGeology[]> {
  try {
    const queryUrl = new URL('https://nhgeodata.unh.edu/hosting/rest/services/Hosted/GG_BedrockGeology/FeatureServer/1/query');
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

    console.log(`🔗 NH Bedrock Geology Query URL: ${queryUrl.toString()}`);

    const response = await fetch(queryUrl.toString());

    if (!response.ok) {
      throw new Error(`NH Bedrock Geology API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 NH Bedrock Geology response:`, data);

    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Bedrock Geology formations found containing point...`);
      return [];
    }

    const formations = data.features.map((feature: any) => {
      const attrs = feature.attributes || {};
      return {
        objectId: attrs.OBJECTID || attrs.objectId,
        code: attrs.CODE || attrs.code,
        major: attrs.MAJOR || attrs.major,
        formation1: attrs.FORMATION1 || attrs.formation1 || attrs.FORMATION || attrs.formation,
        formation2: attrs.FORMATION2 || attrs.formation2,
        pluton_age: attrs.PLUTON_AGE || attrs.pluton_age || attrs.PLUTONAGE || attrs.plutonage,
        rock_type: attrs.ROCK_TYPE || attrs.rock_type || attrs.ROCKTYPE || attrs.rocktype,
        fullname: attrs.FULLNAME || attrs.fullname || attrs.FULL_NAME || attrs.full_name,
        geologichistory: attrs.GEOLOGICHISTORY || attrs.geologichistory || attrs.GEOLOGIC_HISTORY || attrs.geologic_history,
        lithology: attrs.LITHOLOGY || attrs.lithology,
        source: attrs.SOURCE || attrs.source,
        geometry: feature.geometry,
        distance_miles: 0 // Point is inside polygon
      };
    });

    console.log(`✅ Found ${formations.length} NH Bedrock Geology formation(s) containing point... first has geometry:`, !!formations[0]?.geometry, 'has rings:', !!formations[0]?.geometry?.rings);

    return formations;
  } catch (error) {
    console.error('❌ Error fetching NH Bedrock Geology:', error);
    throw error;
  }
}

