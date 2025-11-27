export interface NHGeographicName {
  objectId?: number;
  feature?: string;
  featid?: number;
  feattype?: string;
  county?: string;
  quad?: string;
  lat?: number;
  lon?: number;
  geometry?: any;
  distance_miles?: number;
}

export async function getNHGeographicNamesNearbyData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NHGeographicName[]> {
  try {
    // Convert miles to meters for the buffer
    const radiusMeters = radiusMiles * 1609.34;
    
    const queryUrl = new URL('https://nhgeodata.unh.edu/hosting/rest/services/Hosted/GV_BaseLayers/FeatureServer/0/query');
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

    console.log(`🔗 NH Geographic Names Query URL: ${queryUrl.toString()}`);

    const response = await fetch(queryUrl.toString());

    if (!response.ok) {
      throw new Error(`NH Geographic Names API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 NH Geographic Names response:`, data);

    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No NH Geographic Names found within ${radiusMiles} miles...`);
      return [];
    }

    const places = data.features.map((feature: any) => {
      const attrs = feature.attributes || {};
      
      // Extract coordinates from geometry if available
      let placeLat = null;
      let placeLon = null;
      if (feature.geometry) {
        if (feature.geometry.x !== undefined && feature.geometry.y !== undefined) {
          placeLon = feature.geometry.x;
          placeLat = feature.geometry.y;
        } else if (feature.geometry.coordinates) {
          placeLon = feature.geometry.coordinates[0];
          placeLat = feature.geometry.coordinates[1];
        }
      }
      
      // Calculate distance using Haversine formula if we have coordinates
      let distance_miles = null;
      if (placeLat && placeLon) {
        const R = 3959; // Earth's radius in miles
        const placeLatRad = placeLat * Math.PI / 180;
        const placeLonRad = placeLon * Math.PI / 180;
        const searchLatRad = lat * Math.PI / 180;
        const searchLonRad = lon * Math.PI / 180;
        const dLat = placeLatRad - searchLatRad;
        const dLon = placeLonRad - searchLonRad;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(searchLatRad) * Math.cos(placeLatRad) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance_miles = R * c;
      }
      
      return {
        objectId: attrs.OBJECTID || attrs.objectId,
        feature: attrs.FEATURE || attrs.feature,
        featid: attrs.FEATID || attrs.featid,
        feattype: attrs.FEATTYPE || attrs.feattype,
        county: attrs.COUNTY || attrs.county,
        quad: attrs.QUAD || attrs.quad,
        lat: placeLat || attrs.Y || attrs.y,
        lon: placeLon || attrs.X || attrs.x,
        geometry: feature.geometry,
        distance_miles: distance_miles
      };
    });

    // Sort by distance (closest first)
    places.sort((a, b) => {
      const distA = a.distance_miles ?? Infinity;
      const distB = b.distance_miles ?? Infinity;
      return distA - distB;
    });

    console.log(`✅ Found ${places.length} NH Geographic Names within ${radiusMiles} miles...`);

    return places;
  } catch (error) {
    console.error('❌ Error fetching NH Geographic Names:', error);
    throw error;
  }
}

