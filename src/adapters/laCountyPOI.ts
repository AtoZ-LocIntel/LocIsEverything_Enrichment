/**
 * LA County Points of Interest Adapter
 * Queries LA County Points of Interest FeatureServer
 * Supports proximity queries for multiple layer types
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Points_of_Interest/FeatureServer';

export interface LACountyPOIInfo {
  poiId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query LA County POI FeatureServer for proximity
 */
async function getLACountyPOIData(
  layerId: number,
  lat: number,
  lon: number,
  radius?: number
): Promise<LACountyPOIInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log(`ℹ️ LA County POI Layer ${layerId} requires a radius for proximity query`);
      return [];
    }
    
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radius, 25.0);
    
    const layerNames = [
      'Arts and Recreation',
      'Education',
      'Hospitals',
      'Municipal Services',
      'Physical Features',
      'Public Safety',
      'Transportation'
    ];
    
    const layerName = layerNames[layerId] || `Layer ${layerId}`;
    
    console.log(`🏛️ Querying LA County ${layerName} within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = cappedRadius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
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
    
    console.log(`🔗 LA County ${layerName} Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error(`❌ LA County ${layerName} API Error:`, data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No LA County ${layerName} found within the specified radius`);
      return [];
    }
    
    const results: LACountyPOIInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const poiId = attributes.OBJECTID || 
                   attributes.objectid || 
                   attributes.GlobalID ||
                   attributes.GLOBALID ||
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
        const poiLat = attributes.LATITUDE !== null && attributes.LATITUDE !== undefined 
                      ? parseFloat(attributes.LATITUDE.toString())
                      : (attributes.latitude !== null && attributes.latitude !== undefined
                         ? parseFloat(attributes.latitude.toString())
                         : (attributes.LAT !== null && attributes.LAT !== undefined
                            ? parseFloat(attributes.LAT.toString())
                            : null));
        
        const poiLon = attributes.LONGITUDE !== null && attributes.LONGITUDE !== undefined 
                      ? parseFloat(attributes.LONGITUDE.toString())
                      : (attributes.longitude !== null && attributes.longitude !== undefined
                         ? parseFloat(attributes.longitude.toString())
                         : (attributes.LON !== null && attributes.LON !== undefined
                            ? parseFloat(attributes.LON.toString())
                            : null));
        
        if (poiLat !== null && poiLon !== null) {
          // Use haversine formula to calculate distance
          const R = 3959; // Earth radius in miles
          const dLat = (lat - poiLat) * Math.PI / 180;
          const dLon = (lon - poiLon) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(poiLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance_miles = R * c;
        }
      }
      
      // Only include POIs within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          poiId: poiId ? poiId.toString() : null,
          attributes,
          geometry,
          distance_miles: Number(distance_miles.toFixed(2))
        });
      }
    });
    
    // Sort by distance (closest first)
    results.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${results.length} LA County ${layerName} within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error(`❌ Error querying LA County POI Layer ${layerId}:`, error);
    return [];
  }
}

// Export functions for each layer
export async function getLACountyArtsRecreationData(lat: number, lon: number, radius?: number): Promise<LACountyPOIInfo[]> {
  return getLACountyPOIData(0, lat, lon, radius);
}

export async function getLACountyEducationData(lat: number, lon: number, radius?: number): Promise<LACountyPOIInfo[]> {
  return getLACountyPOIData(1, lat, lon, radius);
}

export async function getLACountyHospitalsData(lat: number, lon: number, radius?: number): Promise<LACountyPOIInfo[]> {
  return getLACountyPOIData(2, lat, lon, radius);
}

export async function getLACountyMunicipalServicesData(lat: number, lon: number, radius?: number): Promise<LACountyPOIInfo[]> {
  return getLACountyPOIData(3, lat, lon, radius);
}

export async function getLACountyPhysicalFeaturesData(lat: number, lon: number, radius?: number): Promise<LACountyPOIInfo[]> {
  return getLACountyPOIData(4, lat, lon, radius);
}

export async function getLACountyPublicSafetyData(lat: number, lon: number, radius?: number): Promise<LACountyPOIInfo[]> {
  return getLACountyPOIData(5, lat, lon, radius);
}

export async function getLACountyTransportationData(lat: number, lon: number, radius?: number): Promise<LACountyPOIInfo[]> {
  return getLACountyPOIData(6, lat, lon, radius);
}

