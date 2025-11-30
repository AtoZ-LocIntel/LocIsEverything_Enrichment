/**
 * CT Urgent Care Adapter
 * Queries Connecticut Urgent Care Facilities from CT Geodata Portal FeatureServer
 * Supports proximity queries (urgent care facilities within a specified radius)
 */

const BASE_SERVICE_URL = 'https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/ArcGIS/rest/services/CTUrgentCare/FeatureServer';
const LAYER_ID = 26;

export interface CTUrgentCareInfo {
  id: string | null;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  attributes: Record<string, any>;
  lat: number;
  lon: number;
  distance_miles?: number;
}

/**
 * Query CT Urgent Care FeatureServer for proximity search
 * Returns urgent care facilities within the specified radius (in miles)
 */
export async function getCTUrgentCareData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTUrgentCareInfo[]> {
  try {
    console.log(`🏥 Querying CT Urgent Care facilities at [${lat}, ${lon}] within ${radiusMiles} miles`);
    
    // Convert miles to meters for the buffer
    const radiusMeters = radiusMiles * 1609.34;
    
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
    
    console.log(`🔗 CT Urgent Care Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT Urgent Care API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CT Urgent Care facilities found nearby');
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} CT Urgent Care facilities nearby`);
    
    // Process features and calculate distances
    const facilities: CTUrgentCareInfo[] = [];
    
    for (const feature of data.features) {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || {};
      
      // Extract coordinates - use LATITUDE/LONGITUDE fields if available, otherwise use geometry
      let facilityLat = attributes.LATITUDE || geometry.y || lat;
      let facilityLon = attributes.LONGITUDE || geometry.x || lon;
      
      // If coordinates are not valid, skip this feature
      if (typeof facilityLat !== 'number' || typeof facilityLon !== 'number' || 
          isNaN(facilityLat) || isNaN(facilityLon)) {
        console.warn(`⚠️ Skipping CT Urgent Care facility ${attributes.OBJECTID || 'unknown'} - invalid coordinates`);
        continue;
      }
      
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (facilityLat - lat) * Math.PI / 180;
      const dLon = (facilityLon - lon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(facilityLat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;
      const distanceMiles = distanceKm * 0.621371;
      
      // Only include facilities within the specified radius
      if (distanceMiles <= radiusMiles) {
        facilities.push({
          id: attributes.ID || attributes.OBJECTID?.toString() || null,
          name: attributes.NAME || 'Unnamed Urgent Care',
          address: attributes.ADDRESS || null,
          city: attributes.CITY || null,
          state: attributes.STATE || 'CT',
          zip: attributes.ZIP || null,
          phone: attributes.PHONE || null,
          attributes,
          lat: facilityLat,
          lon: facilityLon,
          distance_miles: Number(distanceMiles.toFixed(2))
        });
      }
    }
    
    // Sort by distance (closest first)
    facilities.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Found ${facilities.length} CT Urgent Care facilities within ${radiusMiles} miles (after distance filtering)`);
    
    return facilities;
  } catch (error) {
    console.error('❌ Error querying CT Urgent Care facilities:', error);
    return [];
  }
}

