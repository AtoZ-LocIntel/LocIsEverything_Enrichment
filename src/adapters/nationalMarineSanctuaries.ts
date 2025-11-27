/**
 * Adapter for National Marine Sanctuaries
 * Service: https://coast.noaa.gov/arcgis/rest/services/Hosted/NationalMarineSanctuaries/FeatureServer/0
 */

export interface NationalMarineSanctuary {
  objectId?: number;
  sitename?: string;
  unitname?: string;
  siteurl?: string;
  citation?: string;
  cfrsection?: string;
  SHAPE__Length?: number;
  SHAPE__Area?: number;
  geometry?: any;
  distance_miles?: number;
}

/**
 * Query National Marine Sanctuaries for point-in-polygon
 */
export async function getNationalMarineSanctuariesContainingData(
  lat: number,
  lon: number
): Promise<NationalMarineSanctuary[]> {
  try {
    const queryUrl = new URL('https://coast.noaa.gov/arcgis/rest/services/Hosted/NationalMarineSanctuaries/FeatureServer/0/query');
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
    
    console.log(`🔗 National Marine Sanctuaries Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`National Marine Sanctuaries API failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📊 National Marine Sanctuaries response:`, data);
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No National Marine Sanctuaries found containing point...`);
      return [];
    }
    
    const sanctuaries = data.features.map((feature: any) => {
      const attrs = feature.attributes || {};
      return {
        objectId: attrs.OBJECTID || attrs.objectid,
        sitename: attrs.SITENAME || attrs.sitename,
        unitname: attrs.UNITNAME || attrs.unitname,
        siteurl: attrs.SITEURL || attrs.siteurl,
        citation: attrs.CITATION || attrs.citation,
        cfrsection: attrs.CFRSECTION || attrs.cfrsection,
        SHAPE__Length: attrs.SHAPE__Length || attrs.SHAPE__AREA,
        SHAPE__Area: attrs.SHAPE__Area || attrs.SHAPE__AREA,
        geometry: feature.geometry,
        distance_miles: 0 // Point is inside polygon
      };
    });
    
    console.log(`✅ Found ${sanctuaries.length} National Marine Sanctuaries containing point... first has geometry:`, !!sanctuaries[0]?.geometry, 'has rings:', !!sanctuaries[0]?.geometry?.rings);
    
    return sanctuaries;
  } catch (error) {
    console.error('❌ Error fetching National Marine Sanctuaries:', error);
    throw error;
  }
}

/**
 * Query National Marine Sanctuaries for proximity (nearby)
 */
export async function getNationalMarineSanctuariesNearbyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NationalMarineSanctuary[]> {
  try {
    const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
    
    const queryUrl = new URL('https://coast.noaa.gov/arcgis/rest/services/Hosted/NationalMarineSanctuaries/FeatureServer/0/query');
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
    
    console.log(`🔗 National Marine Sanctuaries Nearby Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`National Marine Sanctuaries Nearby API failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📊 National Marine Sanctuaries Nearby response:`, data);
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No National Marine Sanctuaries found within ${radiusMiles} miles...`);
      return [];
    }
    
    // Calculate distance for each sanctuary
    const sanctuaries = data.features.map((feature: any) => {
      const attrs = feature.attributes || {};
      
      // Calculate distance to nearest point on polygon boundary
      let distanceMiles = 0;
      if (feature.geometry && feature.geometry.rings) {
        // For now, use a simple centroid-based distance calculation
        // A more accurate method would calculate distance to polygon boundary
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
        sitename: attrs.SITENAME || attrs.sitename,
        unitname: attrs.UNITNAME || attrs.unitname,
        siteurl: attrs.SITEURL || attrs.siteurl,
        citation: attrs.CITATION || attrs.citation,
        cfrsection: attrs.CFRSECTION || attrs.cfrsection,
        SHAPE__Length: attrs.SHAPE__Length || attrs.SHAPE__AREA,
        SHAPE__Area: attrs.SHAPE__Area || attrs.SHAPE__AREA,
        geometry: feature.geometry,
        distance_miles: distanceMiles
      };
    });
    
    // Sort by distance
    sanctuaries.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Found ${sanctuaries.length} National Marine Sanctuaries within ${radiusMiles} miles... first has geometry:`, !!sanctuaries[0]?.geometry, 'has rings:', !!sanctuaries[0]?.geometry?.rings);
    
    return sanctuaries;
  } catch (error) {
    console.error('❌ Error fetching National Marine Sanctuaries nearby:', error);
    throw error;
  }
}

