/**
 * LA County Historic Cultural Monuments Adapter
 * Queries City of Los Angeles Historic Cultural Monuments (polygonal feature service)
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Historic_Cultural_Monuments/FeatureServer';
const LAYER_ID = 4;

export interface LACountyHistoricCulturalMonumentInfo {
  monumentId: string | null;
  histType: string | null;
  mntType: string | null;
  mntNum: string | null;
  name: string | null;
  location: string | null;
  dateActive: string | null;
  notes: string | null;
  shapeArea: number | null;
  shapeLength: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // For point-in-polygon queries
}

/**
 * Query LA County Historic Cultural Monuments FeatureServer for point-in-polygon and proximity
 */
export async function getLACountyHistoricCulturalMonumentsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<LACountyHistoricCulturalMonumentInfo[]> {
  try {
    // If no radius provided, do point-in-polygon query only
    if (!radius || radius <= 0) {
      console.log(`🏛️ Querying LA County Historic Cultural Monuments for point-in-polygon at [${lat}, ${lon}]`);
      
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
      
      console.log(`🔗 LA County Historic Cultural Monuments Point-in-Polygon Query URL: ${queryUrl.toString()}`);
      
      const response = await fetch(queryUrl.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ LA County Historic Cultural Monuments API Error:', data.error);
        return [];
      }
      
      if (!data.features || data.features.length === 0) {
        console.log('ℹ️ No LA County Historic Cultural Monuments found containing the point');
        return [];
      }
      
      const results: LACountyHistoricCulturalMonumentInfo[] = [];
      
      data.features.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || null;
        
        const monumentId = attributes.OBJECTID || 
                          attributes.objectid || 
                          attributes.GlobalID ||
                          attributes.GLOBALID ||
                          null;
        
        // Extract monument information
        const histType = attributes.HIST_TYPE || 
                        attributes.hist_type ||
                        attributes.HistType ||
                        null;
        
        const mntType = attributes.MNT_TYPE || 
                       attributes.mnt_type ||
                       attributes.MntType ||
                       null;
        
        const mntNum = attributes.MNT_NUM !== null && attributes.MNT_NUM !== undefined 
                      ? attributes.MNT_NUM.toString()
                      : (attributes.mnt_num !== null && attributes.mnt_num !== undefined
                         ? attributes.mnt_num.toString()
                         : null);
        
        const name = attributes.NAME || 
                    attributes.name ||
                    attributes.Name ||
                    null;
        
        const location = attributes.LOCATION || 
                       attributes.location ||
                       attributes.Location ||
                       null;
        
        const dateActive = attributes.DATE_ACTIVE || 
                          attributes.date_active ||
                          attributes.DateActive ||
                          null;
        
        const notes = attributes.NOTES || 
                     attributes.notes ||
                     attributes.Notes ||
                     null;
        
        const shapeArea = attributes.Shape__Area !== null && attributes.Shape__Area !== undefined 
                         ? parseFloat(attributes.Shape__Area.toString())
                         : (attributes.shape_area !== null && attributes.shape_area !== undefined
                            ? parseFloat(attributes.shape_area.toString())
                            : null);
        
        const shapeLength = attributes.Shape__Length !== null && attributes.Shape__Length !== undefined 
                           ? parseFloat(attributes.Shape__Length.toString())
                           : (attributes.shape_length !== null && attributes.shape_length !== undefined
                              ? parseFloat(attributes.shape_length.toString())
                              : null);
        
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
        
        // Only include monuments that contain the point
        if (isContaining) {
          results.push({
            monumentId: monumentId ? monumentId.toString() : null,
            histType,
            mntType,
            mntNum,
            name,
            location,
            dateActive,
            notes,
            shapeArea,
            shapeLength,
            attributes,
            geometry,
            isContaining: true,
            distance_miles: 0
          });
        }
      });
      
      console.log(`✅ Found ${results.length} LA County Historic Cultural Monument(s) containing the point`);
      return results;
    }
    
    // Proximity query
    const cappedRadius = Math.min(radius, 25.0); // Cap at 25 miles
    
    console.log(`🏛️ Querying LA County Historic Cultural Monuments within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 LA County Historic Cultural Monuments Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ LA County Historic Cultural Monuments API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No LA County Historic Cultural Monuments found within the specified radius');
      return [];
    }
    
    const results: LACountyHistoricCulturalMonumentInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const monumentId = attributes.OBJECTID || 
                        attributes.objectid || 
                        attributes.GlobalID ||
                        attributes.GLOBALID ||
                        null;
      
      // Extract monument information
      const histType = attributes.HIST_TYPE || 
                      attributes.hist_type ||
                      attributes.HistType ||
                      null;
      
      const mntType = attributes.MNT_TYPE || 
                     attributes.mnt_type ||
                     attributes.MntType ||
                     null;
      
      const mntNum = attributes.MNT_NUM !== null && attributes.MNT_NUM !== undefined 
                    ? attributes.MNT_NUM.toString()
                    : (attributes.mnt_num !== null && attributes.mnt_num !== undefined
                       ? attributes.mnt_num.toString()
                       : null);
      
      const name = attributes.NAME || 
                  attributes.name ||
                  attributes.Name ||
                  null;
      
      const location = attributes.LOCATION || 
                     attributes.location ||
                     attributes.Location ||
                     null;
      
      const dateActive = attributes.DATE_ACTIVE || 
                        attributes.date_active ||
                        attributes.DateActive ||
                        null;
      
      const notes = attributes.NOTES || 
                   attributes.notes ||
                   attributes.Notes ||
                   null;
      
      const shapeArea = attributes.Shape__Area !== null && attributes.Shape__Area !== undefined 
                       ? parseFloat(attributes.Shape__Area.toString())
                       : (attributes.shape_area !== null && attributes.shape_area !== undefined
                          ? parseFloat(attributes.shape_area.toString())
                          : null);
      
      const shapeLength = attributes.Shape__Length !== null && attributes.Shape__Length !== undefined 
                         ? parseFloat(attributes.Shape__Length.toString())
                         : (attributes.shape_length !== null && attributes.shape_length !== undefined
                            ? parseFloat(attributes.shape_length.toString())
                            : null);
      
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
      
      // Only include monuments within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          monumentId: monumentId ? monumentId.toString() : null,
          histType,
          mntType,
          mntNum,
          name,
          location,
          dateActive,
          notes,
          shapeArea,
          shapeLength,
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
    
    console.log(`✅ Found ${results.length} LA County Historic Cultural Monument(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying LA County Historic Cultural Monuments:', error);
    return [];
  }
}

