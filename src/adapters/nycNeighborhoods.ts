/**
 * NYC Neighborhoods Adapter
 * Queries NYC Neighborhood Tabulation Areas 2020 (polygonal feature service)
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/ArcGIS/rest/services/NYC_Neighborhood_Tabulation_Areas_2020/FeatureServer';
const LAYER_ID = 0;

export interface NYCNeighborhoodInfo {
  neighborhoodId: string | null;
  ntaCode: string | null;
  ntaName: string | null;
  borough: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // For point-in-polygon queries
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
 * Query NYC Neighborhoods FeatureServer for point-in-polygon and proximity
 */
export async function getNYCNeighborhoodsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<NYCNeighborhoodInfo[]> {
  try {
    const results: NYCNeighborhoodInfo[] = [];
    
    // Always do point-in-polygon query first
    console.log(`🏘️ Querying NYC Neighborhoods for point-in-polygon at [${lat}, ${lon}]`);
    
    const pointInPolyQueryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
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
    
    console.log(`🔗 NYC Neighborhoods Point-in-Polygon Query URL: ${pointInPolyQueryUrl.toString()}`);
    
    const pointInPolyResponse = await fetch(pointInPolyQueryUrl.toString());
    
    if (!pointInPolyResponse.ok) {
      throw new Error(`HTTP error! status: ${pointInPolyResponse.status}`);
    }
    
    const pointInPolyData = await pointInPolyResponse.json();
    
    if (pointInPolyData.error) {
      console.error('❌ NYC Neighborhoods API Error:', pointInPolyData.error);
    } else if (pointInPolyData.features && pointInPolyData.features.length > 0) {
      pointInPolyData.features.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || null;
        
        const neighborhoodId = attributes.OBJECTID || attributes.objectid || null;
        const ntaCode = attributes.NTACode || attributes.ntaCode || attributes.NTA_CODE || attributes.nta_code || null;
        const ntaName = attributes.NTAName || attributes.ntaName || attributes.NTA_NAME || attributes.nta_name || attributes.Name || attributes.name || null;
        const borough = attributes.Borough || attributes.borough || attributes.BOROUGH || null;
        
        results.push({
          neighborhoodId: neighborhoodId ? neighborhoodId.toString() : null,
          ntaCode: ntaCode ? ntaCode.toString() : null,
          ntaName,
          borough,
          attributes,
          geometry,
          distance_miles: 0,
          isContaining: true
        });
      });
    }
    
    // If radius provided, also do proximity query
    if (radius && radius > 0) {
      console.log(`🏘️ Querying NYC Neighborhoods for proximity within ${radius} miles at [${lat}, ${lon}]`);
      
      // Convert radius from miles to meters
      const radiusMeters = radius * 1609.34;
      
      const proximityQueryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
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
      
      console.log(`🔗 NYC Neighborhoods Proximity Query URL: ${proximityQueryUrl.toString()}`);
      
      const proximityResponse = await fetch(proximityQueryUrl.toString());
      
      if (!proximityResponse.ok) {
        throw new Error(`HTTP error! status: ${proximityResponse.status}`);
      }
      
      const proximityData = await proximityResponse.json();
      
      if (proximityData.error) {
        console.error('❌ NYC Neighborhoods Proximity API Error:', proximityData.error);
      } else if (proximityData.features && proximityData.features.length > 0) {
        proximityData.features.forEach((feature: any) => {
          // Skip if already in results (from point-in-polygon query)
          const attributes = feature.attributes || {};
          const neighborhoodId = attributes.OBJECTID || attributes.objectid || null;
          const existingIndex = results.findIndex(r => r.neighborhoodId === (neighborhoodId ? neighborhoodId.toString() : null) && r.isContaining);
          
          if (existingIndex >= 0) {
            // Already in results from point-in-polygon, skip
            return;
          }
          
          const geometry = feature.geometry || null;
          
          // Calculate distance to polygon centroid or nearest point
          let distance = radius; // Default to max radius
          if (geometry && geometry.rings && geometry.rings.length > 0) {
            // Calculate centroid of polygon
            // ESRI polygon geometry: rings is an array of rings (outer ring + holes)
            // Each ring is an array of [x, y] or [x, y, z] coordinates
            let sumLat = 0;
            let sumLon = 0;
            let coordCount = 0;
            
            // Use the first ring (outer boundary) for centroid calculation
            const outerRing = geometry.rings[0];
            if (outerRing && outerRing.length > 0) {
              outerRing.forEach((coord: number[]) => {
                if (coord && coord.length >= 2) {
                  // ESRI coordinates are [x, y] where x is longitude and y is latitude
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
          
          const ntaCode = attributes.NTACode || attributes.ntaCode || attributes.NTA_CODE || attributes.nta_code || null;
          const ntaName = attributes.NTAName || attributes.ntaName || attributes.NTA_NAME || attributes.nta_name || attributes.Name || attributes.name || null;
          const borough = attributes.Borough || attributes.borough || attributes.BOROUGH || null;
          
          results.push({
            neighborhoodId: neighborhoodId ? neighborhoodId.toString() : null,
            ntaCode: ntaCode ? ntaCode.toString() : null,
            ntaName,
            borough,
            attributes,
            geometry,
            distance_miles: distance,
            isContaining: false
          });
        });
      }
    }
    
    console.log(`✅ NYC Neighborhoods: Found ${results.length} neighborhood(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying NYC Neighborhoods data:', error);
    throw error;
  }
}

