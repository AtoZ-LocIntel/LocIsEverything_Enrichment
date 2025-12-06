/**
 * CA Geothermal Wells Adapter
 * Queries California Geothermal Wells (point feature service)
 * Supports proximity queries
 */

const BASE_SERVICE_URL = 'https://gis.conservation.ca.gov/server/rest/services/WellSTAR/Wells/MapServer';
const LAYER_ID = 1;

export interface CAGeothermalWellInfo {
  wellId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA Geothermal Wells MapServer for proximity
 */
export async function getCAGeothermalWellsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CAGeothermalWellInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log('ℹ️ CA Geothermal Wells requires a radius for proximity query');
      return [];
    }
    
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radius, 25.0);
    
    console.log(`🌋 Querying CA Geothermal Wells within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CA Geothermal Wells Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA Geothermal Wells API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA Geothermal Wells found within the specified radius');
      return [];
    }
    
    const results: CAGeothermalWellInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const wellId = attributes.OBJECTID || 
                    attributes.objectid || 
                    attributes.GlobalID ||
                    attributes.GLOBALID ||
                    attributes.WELL_ID ||
                    attributes.Well_ID ||
                    attributes.well_id ||
                    attributes.API ||
                    attributes.api ||
                    null;
      
      // Calculate distance if we have coordinates
      let distance_miles = cappedRadius; // Default to max radius
      
      if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
        // Use geometry coordinates if available
        const R = 3959; // Earth radius in miles
        const dLat = (lat - geometry.y) * Math.PI / 180;
        const dLon = (lon - geometry.x) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(geometry.y * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance_miles = R * c;
      } else {
        // Try to get coordinates from attributes
        const wellLat = attributes.LATITUDE !== null && attributes.LATITUDE !== undefined 
                       ? parseFloat(attributes.LATITUDE.toString())
                       : (attributes.latitude !== null && attributes.latitude !== undefined
                          ? parseFloat(attributes.latitude.toString())
                          : (attributes.LAT !== null && attributes.LAT !== undefined
                             ? parseFloat(attributes.LAT.toString())
                             : null));
        
        const wellLon = attributes.LONGITUDE !== null && attributes.LONGITUDE !== undefined 
                       ? parseFloat(attributes.LONGITUDE.toString())
                       : (attributes.longitude !== null && attributes.longitude !== undefined
                          ? parseFloat(attributes.longitude.toString())
                          : (attributes.LON !== null && attributes.LON !== undefined
                             ? parseFloat(attributes.LON.toString())
                             : null));
        
        if (wellLat !== null && wellLon !== null) {
          // Use haversine formula to calculate distance
          const R = 3959; // Earth radius in miles
          const dLat = (lat - wellLat) * Math.PI / 180;
          const dLon = (lon - wellLon) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(wellLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance_miles = R * c;
        }
      }
      
      // Only include wells within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          wellId: wellId ? wellId.toString() : null,
          attributes,
          geometry,
          distance_miles: Number(distance_miles.toFixed(2))
        });
      }
    });
    
    // Sort by distance (closest first)
    results.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${results.length} CA Geothermal Well(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA Geothermal Wells:', error);
    return [];
  }
}

