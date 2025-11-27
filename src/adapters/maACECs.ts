/**
 * Adapter for MA Areas of Critical Environmental Concern (ACECs)
 * Service: https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/ACECs/FeatureServer/0
 */

export interface MAACEC {
  objectId?: number;
  ACECID?: number;
  NAME?: string;
  DES_DATE?: string;
  SECRETARY?: string;
  ADMIN_BY?: string;
  REGION?: string;
  POLY_ACRES?: number;
  ACEC_ACRES?: number;
  geometry?: any;
  distance_miles?: number;
}

/**
 * Query MA ACECs for point-in-polygon
 */
export async function getMAACECsContainingData(
  lat: number,
  lon: number
): Promise<MAACEC[]> {
  try {
    const queryUrl = new URL('https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/ACECs/FeatureServer/0/query');
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
    
    console.log(`🔗 MA ACECs Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`MA ACECs API failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📊 MA ACECs response:`, data);
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No MA ACECs found containing point...`);
      return [];
    }
    
    const acecs = data.features.map((feature: any) => {
      const attrs = feature.attributes || {};
      return {
        objectId: attrs.OBJECTID || attrs.objectid,
        ACECID: attrs.ACECID || attrs.acecid,
        NAME: attrs.NAME || attrs.name,
        DES_DATE: attrs.DES_DATE || attrs.des_date,
        SECRETARY: attrs.SECRETARY || attrs.secretary,
        ADMIN_BY: attrs.ADMIN_BY || attrs.admin_by,
        REGION: attrs.REGION || attrs.region,
        POLY_ACRES: attrs.POLY_ACRES || attrs.poly_acres,
        ACEC_ACRES: attrs.ACEC_ACRES || attrs.acec_acres,
        geometry: feature.geometry,
        distance_miles: 0 // Point is inside polygon
      };
    });
    
    console.log(`✅ Found ${acecs.length} MA ACECs containing point... first has geometry:`, !!acecs[0]?.geometry, 'has rings:', !!acecs[0]?.geometry?.rings);
    
    return acecs;
  } catch (error) {
    console.error('❌ Error fetching MA ACECs:', error);
    throw error;
  }
}

/**
 * Query MA ACECs for proximity (nearby)
 */
export async function getMAACECsNearbyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<MAACEC[]> {
  try {
    const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
    
    const queryUrl = new URL('https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/ACECs/FeatureServer/0/query');
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
    queryUrl.searchParams.set('returnGeometry', 'true');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('maxRecordCount', '1000');
    
    console.log(`🔗 MA ACECs Nearby Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`MA ACECs Nearby API failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📊 MA ACECs Nearby response:`, data);
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No MA ACECs found within ${radiusMiles} miles...`);
      return [];
    }
    
    // Calculate distance for each ACEC
    const acecs = data.features.map((feature: any) => {
      const attrs = feature.attributes || {};
      
      // Calculate distance to nearest point on polygon boundary
      let distanceMiles = 0;
      if (feature.geometry && feature.geometry.rings) {
        // For now, use a simple centroid-based distance calculation
        const rings = feature.geometry.rings;
        if (rings && rings.length > 0 && rings[0].length > 0) {
          const firstCoord = rings[0][0];
          const centroidLon = firstCoord[0];
          const centroidLat = firstCoord[1];
          
          // Haversine distance calculation
          const R = 3959; // Earth's radius in miles
          const dLat = (centroidLat - lat) * Math.PI / 180;
          const dLon = (centroidLon - lon) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(centroidLat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distanceMiles = R * c;
        }
      }
      
      return {
        objectId: attrs.OBJECTID || attrs.objectid,
        ACECID: attrs.ACECID || attrs.acecid,
        NAME: attrs.NAME || attrs.name,
        DES_DATE: attrs.DES_DATE || attrs.des_date,
        SECRETARY: attrs.SECRETARY || attrs.secretary,
        ADMIN_BY: attrs.ADMIN_BY || attrs.admin_by,
        REGION: attrs.REGION || attrs.region,
        POLY_ACRES: attrs.POLY_ACRES || attrs.poly_acres,
        ACEC_ACRES: attrs.ACEC_ACRES || attrs.acec_acres,
        geometry: feature.geometry,
        distance_miles: distanceMiles
      };
    });
    
    // Sort by distance
    acecs.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Found ${acecs.length} MA ACECs within ${radiusMiles} miles... first has geometry:`, !!acecs[0]?.geometry, 'has rings:', !!acecs[0]?.geometry?.rings);
    
    return acecs;
  } catch (error) {
    console.error('❌ Error fetching MA ACECs nearby:', error);
    throw error;
  }
}

