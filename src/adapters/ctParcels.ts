/**
 * CT Parcels Adapter
 * Queries Connecticut State Parcel Layer 2023 from CT Geodata Portal FeatureServer
 * Supports both point-in-polygon (which parcel contains the point) and
 * proximity queries (parcels within a specified radius)
 */

const BASE_SERVICE_URL = 'https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/ArcGIS/rest/services/Connecticut_State_Parcel_Layer_2023/FeatureServer';
const LAYER_ID = 0;

export interface CTParcelData {
  containingParcel: CTParcelInfo | null;
  nearbyParcels: CTParcelInfo[];
}

export interface CTParcelInfo {
  parcelId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  isContaining?: boolean; // Flag to indicate if this is the containing parcel
  distance_miles?: number; // Distance from query point (for nearby parcels)
}

/**
 * Query CT Parcels FeatureServer for point-in-polygon
 * Returns the parcel that contains the given point
 */
async function getContainingParcel(
  lat: number,
  lon: number
): Promise<CTParcelInfo | null> {
  try {
    console.log(`🏠 Querying CT Parcels for containing parcel at [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for point-in-polygon
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
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true'); // Return geometry for map drawing
    
    console.log(`🔗 CT Parcels Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT Parcels API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CT Parcel found containing this location');
      return null;
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    // Extract parcel identifier - try common field names for CT parcels
    const parcelId = attributes.Link || 
                     attributes.link || 
                     attributes.OBJECTID ||
                     attributes.objectid ||
                     attributes.GlobalID ||
                     attributes.globalid ||
                     null;
    
    console.log(`✅ Found containing CT Parcel: ${parcelId}`);
    
    return {
      parcelId,
      attributes,
      geometry,
      isContaining: true
    };
  } catch (error) {
    console.error('❌ Error querying CT Parcels for containing parcel:', error);
    return null;
  }
}

/**
 * Query CT Parcels FeatureServer for proximity search
 * Returns parcels within the specified radius (in miles)
 */
async function getNearbyParcels(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTParcelInfo[]> {
  try {
    console.log(`🏠 Querying CT Parcels for nearby parcels at [${lat}, ${lon}] within ${radiusMiles} miles`);
    
    // Convert miles to meters for the buffer
    const radiusMeters = radiusMiles * 1609.34;
    
    // Create a buffer around the point for proximity search
    // We'll use a simple bounding box approach with a buffer
    // For more accurate results, we could use a proper buffer geometry
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
    
    console.log(`🔗 CT Parcels Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT Parcels API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CT Parcels found nearby');
      return [];
    }
    
    console.log(`✅ Found ${data.features.length} CT Parcels nearby`);
    
    // Process features and calculate distances
    const parcels: CTParcelInfo[] = [];
    
    for (const feature of data.features) {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      // Extract parcel identifier
      const parcelId = attributes.Link || 
                       attributes.link || 
                       attributes.OBJECTID ||
                       attributes.objectid ||
                       attributes.GlobalID ||
                       attributes.globalid ||
                       null;
      
      // Calculate distance from query point to parcel centroid
      // For polygons, we'll use the centroid if available, otherwise estimate from geometry
      let parcelLat = lat;
      let parcelLon = lon;
      
      if (geometry && geometry.rings && geometry.rings.length > 0) {
        // Calculate centroid from polygon rings
        const ring = geometry.rings[0];
        let sumX = 0;
        let sumY = 0;
        for (const point of ring) {
          sumX += point[0];
          sumY += point[1];
        }
        parcelLon = sumX / ring.length;
        parcelLat = sumY / ring.length;
      }
      
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (parcelLat - lat) * Math.PI / 180;
      const dLon = (parcelLon - lon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(parcelLat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;
      const distanceMiles = distanceKm * 0.621371;
      
      parcels.push({
        parcelId,
        attributes,
        geometry,
        isContaining: false,
        distance_miles: Number(distanceMiles.toFixed(2))
      });
    }
    
    // Sort by distance (closest first)
    parcels.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    return parcels;
  } catch (error) {
    console.error('❌ Error querying CT Parcels for nearby parcels:', error);
    return [];
  }
}

/**
 * Main function to get CT Parcel data
 * Returns both containing parcel and nearby parcels
 */
export async function getCTParcelData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<CTParcelData> {
  try {
    // Always get containing parcel
    const containingParcel = await getContainingParcel(lat, lon);
    
    // Get nearby parcels if radius is specified and > 0
    let nearbyParcels: CTParcelInfo[] = [];
    if (radiusMiles !== undefined && radiusMiles > 0) {
      nearbyParcels = await getNearbyParcels(lat, lon, radiusMiles);
      
      // Remove the containing parcel from nearby parcels if it exists
      if (containingParcel && containingParcel.parcelId) {
        nearbyParcels = nearbyParcels.filter(
          p => p.parcelId !== containingParcel.parcelId
        );
      }
    }
    
    return {
      containingParcel,
      nearbyParcels
    };
  } catch (error) {
    console.error('❌ Error getting CT Parcel data:', error);
    return {
      containingParcel: null,
      nearbyParcels: []
    };
  }
}

