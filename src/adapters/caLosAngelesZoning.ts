/**
 * City of Los Angeles Zoning Polygons Adapter
 * Queries City of Los Angeles Zoning Polygons (polygonal feature service)
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Zoning/FeatureServer';
const LAYER_ID = 15;

export interface CALosAngelesZoningInfo {
  zoningId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // For point-in-polygon queries
}

/**
 * Query City of Los Angeles Zoning Polygons FeatureServer for point-in-polygon and proximity
 */
export async function getCALosAngelesZoningData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CALosAngelesZoningInfo[]> {
  try {
    // If no radius provided, do point-in-polygon query only
    if (!radius || radius <= 0) {
      console.log(`🏙️ Querying City of Los Angeles Zoning for point-in-polygon at [${lat}, ${lon}]`);
      
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
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      
      console.log(`🔗 City of Los Angeles Zoning Point-in-Polygon Query URL: ${queryUrl.toString()}`);
      
      const response = await fetch(queryUrl.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ City of Los Angeles Zoning API Error:', data.error);
        return [];
      }
      
      if (!data.features || data.features.length === 0) {
        console.log('ℹ️ No City of Los Angeles Zoning polygons found containing the point');
        return [];
      }
      
      const results: CALosAngelesZoningInfo[] = [];
      
      data.features.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || null;
        
        const zoningId = attributes.OBJECTID || 
                        attributes.objectid || 
                        attributes.GlobalID ||
                        attributes.GLOBALID ||
                        null;
        
        // Check if point is inside polygon (point-in-polygon)
        let isContaining = false;
        
        if (geometry && geometry.rings) {
          const rings = geometry.rings;
          if (rings && rings.length > 0) {
            const outerRing = rings[0];
            let inside = false;
            for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
              const xi = outerRing[i][0], yi = outerRing[i][1];
              const xj = outerRing[j][0], yj = outerRing[j][1];
              const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
              if (intersect) inside = !inside;
            }
            isContaining = inside;
          }
        }
        
        // Only include zones that contain the point
        if (isContaining) {
          results.push({
            zoningId: zoningId ? zoningId.toString() : null,
            attributes,
            geometry,
            isContaining: true,
            distance_miles: 0
          });
        }
      });
      
      console.log(`✅ Found ${results.length} City of Los Angeles Zoning polygon(s) containing the point`);
      return results;
    }
    
    // Proximity query
    const cappedRadius = Math.min(radius, 1.0); // Cap at 1 mile
    
    console.log(`🏙️ Querying City of Los Angeles Zoning within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 City of Los Angeles Zoning Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ City of Los Angeles Zoning API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No City of Los Angeles Zoning polygons found within the specified radius');
      return [];
    }
    
    const results: CALosAngelesZoningInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const zoningId = attributes.OBJECTID || 
                      attributes.objectid || 
                      attributes.GlobalID ||
                      attributes.GLOBALID ||
                      null;
      
      // Calculate distance from point to polygon centroid or nearest edge
      let distance_miles = cappedRadius; // Default to max radius
      let isContaining = false;
      
      if (geometry && geometry.rings) {
        // Check if point is inside polygon (point-in-polygon)
        const rings = geometry.rings;
        if (rings && rings.length > 0) {
          const outerRing = rings[0];
          let inside = false;
          for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
            const xi = outerRing[i][0], yi = outerRing[i][1];
            const xj = outerRing[j][0], yj = outerRing[j][1];
            const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
          }
          
          if (inside) {
            isContaining = true;
            distance_miles = 0;
          } else {
            // Calculate distance to nearest point on polygon
            let minDistance = Infinity;
            outerRing.forEach((coord: number[]) => {
              const R = 3959; // Earth radius in miles
              const dLat = (lat - coord[1]) * Math.PI / 180;
              const dLon = (lon - coord[0]) * Math.PI / 180;
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(coord[1] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = R * c;
              if (distance < minDistance) minDistance = distance;
            });
            distance_miles = minDistance;
          }
        }
      }
      
      // Only include zones within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          zoningId: zoningId ? zoningId.toString() : null,
          attributes,
          geometry,
          distance_miles: Number(distance_miles.toFixed(2)),
          isContaining
        });
      }
    });
    
    // Sort by distance (closest first), containing polygons first
    results.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      return (a.distance_miles || Infinity) - (b.distance_miles || Infinity);
    });
    
    console.log(`✅ Found ${results.length} City of Los Angeles Zoning polygon(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying City of Los Angeles Zoning:', error);
    return [];
  }
}

