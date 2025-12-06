/**
 * LA County Housing with Potential Lead Risk Adapter
 * Queries LA County Housing with Potential Lead Risk (polygonal feature service)
 * Supports point-in-polygon and proximity queries (max 5 miles)
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Housing_with_Potential_Lead_Risk/FeatureServer';
const LAYER_ID = 0;

export interface LACountyHousingLeadRiskInfo {
  housingId: string | null;
  ct20: string | null;
  housingRisk: number | null;
  laCity: string | null;
  shapeArea: number | null;
  shapeLength: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // For point-in-polygon queries
}

/**
 * Query LA County Housing with Potential Lead Risk FeatureServer for point-in-polygon and proximity
 */
export async function getLACountyHousingLeadRiskData(
  lat: number,
  lon: number,
  radius?: number
): Promise<LACountyHousingLeadRiskInfo[]> {
  try {
    // If no radius provided, do point-in-polygon query only
    if (!radius || radius <= 0) {
      console.log(`🏠 Querying LA County Housing with Potential Lead Risk for point-in-polygon at [${lat}, ${lon}]`);
      
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
      
      console.log(`🔗 LA County Housing Lead Risk Point-in-Polygon Query URL: ${queryUrl.toString()}`);
      
      const response = await fetch(queryUrl.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ LA County Housing Lead Risk API Error:', data.error);
        return [];
      }
      
      if (!data.features || data.features.length === 0) {
        console.log('ℹ️ No LA County Housing Lead Risk areas found containing the point');
        return [];
      }
      
      const results: LACountyHousingLeadRiskInfo[] = [];
      
      data.features.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || null;
        
        const housingId = attributes.OBJECTID || 
                          attributes.objectid || 
                          attributes.GlobalID ||
                          attributes.GLOBALID ||
                          null;
        
        // Extract housing risk information
        const ct20 = attributes.CT20 !== null && attributes.CT20 !== undefined 
                    ? attributes.CT20.toString()
                    : (attributes.ct20 !== null && attributes.ct20 !== undefined
                       ? attributes.ct20.toString()
                       : null);
        
        const housingRisk = attributes.housing_risk !== null && attributes.housing_risk !== undefined 
                           ? parseFloat(attributes.housing_risk.toString())
                           : (attributes.housingRisk !== null && attributes.housingRisk !== undefined
                              ? parseFloat(attributes.housingRisk.toString())
                              : null);
        
        const laCity = attributes.la_city || 
                      attributes.laCity ||
                      attributes.LA_CITY ||
                      attributes.LaCity ||
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
        
        // Only include areas that contain the point
        if (isContaining) {
          results.push({
            housingId: housingId ? housingId.toString() : null,
            ct20,
            housingRisk,
            laCity,
            shapeArea,
            shapeLength,
            attributes,
            geometry,
            isContaining: true,
            distance_miles: 0
          });
        }
      });
      
      console.log(`✅ Found ${results.length} LA County Housing Lead Risk area(s) containing the point`);
      return results;
    }
    
    // Proximity query
    const cappedRadius = Math.min(radius, 5.0); // Cap at 5 miles
    
    console.log(`🏠 Querying LA County Housing with Potential Lead Risk within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 LA County Housing Lead Risk Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ LA County Housing Lead Risk API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No LA County Housing Lead Risk areas found within the specified radius');
      return [];
    }
    
    const results: LACountyHousingLeadRiskInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const housingId = attributes.OBJECTID || 
                        attributes.objectid || 
                        attributes.GlobalID ||
                        attributes.GLOBALID ||
                        null;
      
      // Extract housing risk information
      const ct20 = attributes.CT20 !== null && attributes.CT20 !== undefined 
                  ? attributes.CT20.toString()
                  : (attributes.ct20 !== null && attributes.ct20 !== undefined
                     ? attributes.ct20.toString()
                     : null);
      
      const housingRisk = attributes.housing_risk !== null && attributes.housing_risk !== undefined 
                         ? parseFloat(attributes.housing_risk.toString())
                         : (attributes.housingRisk !== null && attributes.housingRisk !== undefined
                            ? parseFloat(attributes.housingRisk.toString())
                            : null);
      
      const laCity = attributes.la_city || 
                    attributes.laCity ||
                    attributes.LA_CITY ||
                    attributes.LaCity ||
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
      
      // Only include areas within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          housingId: housingId ? housingId.toString() : null,
          ct20,
          housingRisk,
          laCity,
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
    
    console.log(`✅ Found ${results.length} LA County Housing Lead Risk area(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying LA County Housing with Potential Lead Risk:', error);
    return [];
  }
}

