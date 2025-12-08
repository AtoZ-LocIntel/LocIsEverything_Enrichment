/**
 * NYC Waterfront Access Adapter
 * Queries NYC Waterfront Access layers (points and polygons)
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/ArcGIS/rest/services/WaterfrontAccessMap_520/FeatureServer';

export interface NYCWaterfrontAccessInfo {
  featureId: string | null;
  name: string | null;
  type: string | null;
  layerId: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // For point-in-polygon queries (polygons only)
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query NYC Waterfront Access FeatureServer for a specific layer
 */
export async function getNYCWaterfrontAccessData(
  lat: number,
  lon: number,
  layerId: number,
  radius?: number
): Promise<NYCWaterfrontAccessInfo[]> {
  try {
    const results: NYCWaterfrontAccessInfo[] = [];
    const isPointLayer = layerId === 0; // HPB Launch Site is points
    const isPolygonLayer = layerId === 1 || layerId === 2; // Parks and PAWS are polygons
    
    // For polygons, always do point-in-polygon query first
    if (isPolygonLayer) {
      console.log(`🌊 Querying NYC Waterfront Access Layer ${layerId} for point-in-polygon at [${lat}, ${lon}]`);
      
      const pointInPolyQueryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
      pointInPolyQueryUrl.searchParams.set('f', 'json');
      pointInPolyQueryUrl.searchParams.set('where', '1=1');
      pointInPolyQueryUrl.searchParams.set('outFields', '*');
      pointInPolyQueryUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      pointInPolyQueryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      pointInPolyQueryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      pointInPolyQueryUrl.searchParams.set('inSR', '4326');
      pointInPolyQueryUrl.searchParams.set('outSR', '4326');
      pointInPolyQueryUrl.searchParams.set('returnGeometry', 'true');
      
      console.log(`🔗 NYC Waterfront Access Layer ${layerId} Point-in-Polygon Query URL: ${pointInPolyQueryUrl.toString()}`);
      
      const pointInPolyResponse = await fetch(pointInPolyQueryUrl.toString());
      
      if (!pointInPolyResponse.ok) {
        throw new Error(`HTTP error! status: ${pointInPolyResponse.status}`);
      }
      
      const pointInPolyData = await pointInPolyResponse.json();
      
      if (pointInPolyData.error) {
        console.error(`❌ NYC Waterfront Access Layer ${layerId} API Error:`, pointInPolyData.error);
      } else if (pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const featureId = attributes.OBJECTID || attributes.objectid || null;
          const name = attributes.NAME || attributes.name || attributes.Name || 
                      attributes.SITE_NAME || attributes.site_name || 
                      attributes.PARK_NAME || attributes.park_name || null;
          const type = attributes.TYPE || attributes.type || attributes.Type || null;
          
          results.push({
            featureId: featureId ? featureId.toString() : null,
            name,
            type,
            layerId,
            attributes,
            geometry,
            distance_miles: 0,
            isContaining: true
          });
        });
      }
    }
    
    // If radius provided, do proximity query (for both points and polygons)
    if (radius && radius > 0) {
      console.log(`🌊 Querying NYC Waterfront Access Layer ${layerId} for proximity within ${radius} miles at [${lat}, ${lon}]`);
      
      // Convert radius from miles to meters
      const radiusMeters = radius * 1609.34;
      
      const proximityQueryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
      proximityQueryUrl.searchParams.set('f', 'json');
      proximityQueryUrl.searchParams.set('where', '1=1');
      proximityQueryUrl.searchParams.set('outFields', '*');
      proximityQueryUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      proximityQueryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      proximityQueryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      proximityQueryUrl.searchParams.set('distance', radiusMeters.toString());
      proximityQueryUrl.searchParams.set('units', 'esriSRUnit_Meter');
      proximityQueryUrl.searchParams.set('inSR', '4326');
      proximityQueryUrl.searchParams.set('outSR', '4326');
      proximityQueryUrl.searchParams.set('returnGeometry', 'true');
      
      console.log(`🔗 NYC Waterfront Access Layer ${layerId} Proximity Query URL: ${proximityQueryUrl.toString()}`);
      
      const proximityResponse = await fetch(proximityQueryUrl.toString());
      
      if (!proximityResponse.ok) {
        throw new Error(`HTTP error! status: ${proximityResponse.status}`);
      }
      
      const proximityData = await proximityResponse.json();
      
      if (proximityData.error) {
        console.error(`❌ NYC Waterfront Access Layer ${layerId} Proximity API Error:`, proximityData.error);
      } else if (proximityData.features && proximityData.features.length > 0) {
        proximityData.features.forEach((feature: any) => {
          // For polygons, skip if already in results (from point-in-polygon query)
          if (isPolygonLayer) {
            const attributes = feature.attributes || {};
            const featureId = attributes.OBJECTID || attributes.objectid || null;
            const existingIndex = results.findIndex(r => r.featureId === (featureId ? featureId.toString() : null) && r.isContaining);
            
            if (existingIndex >= 0) {
              // Already in results from point-in-polygon, skip
              return;
            }
          }
          
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          // Calculate distance
          let distance = radius; // Default to max radius
          
          if (isPointLayer && geometry && geometry.x !== undefined && geometry.y !== undefined) {
            // Point feature - calculate distance directly
            distance = calculateDistance(lat, lon, geometry.y, geometry.x);
          } else if (isPolygonLayer && geometry && geometry.rings && geometry.rings.length > 0) {
            // Polygon feature - calculate distance to centroid
            let sumLat = 0;
            let sumLon = 0;
            let coordCount = 0;
            
            const outerRing = geometry.rings[0];
            if (outerRing && outerRing.length > 0) {
              outerRing.forEach((coord: number[]) => {
                if (coord && coord.length >= 2) {
                  sumLon += coord[0];
                  sumLat += coord[1];
                  coordCount++;
                }
              });
            }
            
            if (coordCount > 0) {
              const centroidLat = sumLat / coordCount;
              const centroidLon = sumLon / coordCount;
              distance = calculateDistance(lat, lon, centroidLat, centroidLon);
            }
          }
          
          const featureId = attributes.OBJECTID || attributes.objectid || null;
          const name = attributes.NAME || attributes.name || attributes.Name || 
                      attributes.SITE_NAME || attributes.site_name || 
                      attributes.PARK_NAME || attributes.park_name || null;
          const type = attributes.TYPE || attributes.type || attributes.Type || null;
          
          results.push({
            featureId: featureId ? featureId.toString() : null,
            name,
            type,
            layerId,
            attributes,
            geometry,
            distance_miles: distance,
            isContaining: false
          });
        });
      }
    }
    
    console.log(`✅ NYC Waterfront Access Layer ${layerId}: Found ${results.length} feature(s)`);
    return results;
  } catch (error) {
    console.error(`❌ Error querying NYC Waterfront Access Layer ${layerId} data:`, error);
    throw error;
  }
}

