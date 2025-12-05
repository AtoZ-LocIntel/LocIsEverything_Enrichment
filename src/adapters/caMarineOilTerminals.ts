/**
 * CA Marine Oil Terminals Adapter
 * Queries California Marine Oil Terminals from CA State FeatureServer
 * Supports proximity queries
 */

const BASE_SERVICE_URL = 'https://services3.arcgis.com/5aaQCuq3e4GRvkFG/arcgis/rest/services/Marine_Oil_Terminals/FeatureServer';
const LAYER_ID = 0;

export interface CAMarineOilTerminalInfo {
  terminalId: string | null;
  terminalName: string | null;
  wo: string | null;
  woBerthId: string | null;
  city: string | null;
  county: string | null;
  displayName: string | null;
  latitude: number | null;
  longitude: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA Marine Oil Terminals FeatureServer for proximity
 */
export async function getCAMarineOilTerminalsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CAMarineOilTerminalInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log('ℹ️ CA Marine Oil Terminals requires a radius for proximity query');
      return [];
    }
    
    // Cap radius at 50 miles
    const cappedRadius = Math.min(radius, 50.0);
    
    console.log(`🛢️ Querying CA Marine Oil Terminals within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CA Marine Oil Terminals Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA Marine Oil Terminals API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA Marine Oil Terminals found within the specified radius');
      return [];
    }
    
    const results: CAMarineOilTerminalInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const terminalId = attributes.OBJECTID || 
                        attributes.objectid || 
                        attributes.GlobalID ||
                        null;
      
      // Extract terminal information
      const terminalName = attributes.Terminal_Name || 
                          attributes.terminal_name ||
                          attributes.TerminalName ||
                          attributes.NAME ||
                          attributes.name ||
                          null;
      
      const wo = attributes.WO_ || 
                 attributes.wo_ ||
                 attributes.WO ||
                 attributes.wo ||
                 null;
      
      const woBerthId = attributes.WO_Berth_ID || 
                        attributes.wo_berth_id ||
                        attributes.WOBerthID ||
                        attributes.woBerthId ||
                        null;
      
      const city = attributes.City || 
                  attributes.city ||
                  attributes.City ||
                  null;
      
      const county = attributes.County || 
                    attributes.county ||
                    attributes.County ||
                    null;
      
      const displayName = attributes.DisplayName || 
                         attributes.displayName ||
                         attributes.DisplayName ||
                         attributes.display_name ||
                         null;
      
      const latitude = attributes.Latitude !== null && attributes.Latitude !== undefined 
                      ? parseFloat(attributes.Latitude.toString())
                      : (attributes.latitude !== null && attributes.latitude !== undefined
                         ? parseFloat(attributes.latitude.toString())
                         : null);
      
      const longitude = attributes.Longitude !== null && attributes.Longitude !== undefined 
                       ? parseFloat(attributes.Longitude.toString())
                       : (attributes.longitude !== null && attributes.longitude !== undefined
                          ? parseFloat(attributes.longitude.toString())
                          : null);
      
      // Calculate distance if we have coordinates
      let distance_miles = cappedRadius; // Default to max radius
      if (latitude !== null && longitude !== null) {
        // Use haversine formula to calculate distance
        const R = 3959; // Earth radius in miles
        const dLat = (lat - latitude) * Math.PI / 180;
        const dLon = (lon - longitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance_miles = R * c;
      } else if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
        // Use geometry coordinates if available
        const R = 3959; // Earth radius in miles
        const dLat = (lat - geometry.y) * Math.PI / 180;
        const dLon = (lon - geometry.x) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(geometry.y * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance_miles = R * c;
      }
      
      // Only include terminals within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          terminalId: terminalId ? terminalId.toString() : null,
          terminalName,
          wo,
          woBerthId,
          city,
          county,
          displayName,
          latitude,
          longitude,
          attributes,
          geometry,
          distance_miles: Number(distance_miles.toFixed(2))
        });
      }
    });
    
    // Sort by distance (closest first)
    results.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${results.length} CA Marine Oil Terminal(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA Marine Oil Terminals:', error);
    return [];
  }
}

