/**
 * Houston Neighborhoods Adapter
 * Queries Houston Neighborhoods polygonal feature service
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/NummVBqZSIJKUeVR/ArcGIS/rest/services/CoHoustonNeighborhoods/FeatureServer/0';

export interface HoustonNeighborhoodInfo {
  objectId: string | null;
  nname: string | null;
  nameLabel: string | null;
  name1: string | null;
  name2: string | null;
  codeNum: number | null;
  comment: string | null;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // For point-in-polygon queries
  attributes: Record<string, any>;
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
 * Calculate centroid of a polygon ring
 */
function calculatePolygonCentroid(ring: number[][]): [number, number] {
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  
  for (const coord of ring) {
    if (coord.length >= 2) {
      sumX += coord[0];
      sumY += coord[1];
      count++;
    }
  }
  
  return count > 0 ? [sumX / count, sumY / count] : [0, 0];
}

/**
 * Convert ESRI geometry coordinates to lat/lon
 * ESRI geometry can be in various coordinate systems, but we'll assume Web Mercator or WGS84
 */
function esriToLatLon(x: number, y: number): [number, number] {
  // If coordinates look like Web Mercator (large numbers), convert to WGS84
  if (Math.abs(x) > 180 || Math.abs(y) > 90) {
    // Web Mercator to WGS84 conversion
    const lon = (x / 20037508.34) * 180;
    let lat = (y / 20037508.34) * 180;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    return [lat, lon];
  }
  // Assume already in WGS84
  return [y, x]; // ESRI uses [x, y] but we need [lat, lon]
}

/**
 * Query Houston Neighborhoods within proximity of a location
 * Supports both point-in-polygon and proximity queries (max 10 miles)
 */
export async function getHoustonNeighborhoodsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<HoustonNeighborhoodInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Convert lat/lon to Web Mercator for ESRI query (if needed)
    // For now, use WGS84 directly
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const features: HoustonNeighborhoodInfo[] = [];
    
    // Point-in-polygon query (always run for polygons)
    try {
      // Build query URL manually to ensure proper encoding (same pattern as NYC Community Districts)
      const geometryStr = encodeURIComponent(JSON.stringify(geometry));
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🏘️ Querying Houston Neighborhoods for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 Houston Neighborhoods Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      // Log the full response for debugging
      console.log(`📊 Houston Neighborhoods Point-in-Polygon Response:`, {
        hasError: !!pointInPolyData.error,
        error: pointInPolyData.error,
        featureCount: pointInPolyData.features?.length || 0,
        hasFeatures: !!pointInPolyData.features,
        fullResponse: pointInPolyData
      });
      
      if (pointInPolyData.error) {
        console.error('❌ Houston Neighborhoods API Error:', pointInPolyData.error);
      } else if (pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const objectId = attributes.OBJECTID || attributes.objectid || null;
          const nname = attributes.NNAME || attributes.nname || null;
          const nameLabel = attributes.NAME_LABEL || attributes.name_label || attributes.NAME_LABEL || null;
          const name1 = attributes.NAME_1 || attributes.name_1 || null;
          const name2 = attributes.NAME_2 || attributes.name_2 || null;
          const codeNum = attributes.CODE_NUM !== null && attributes.CODE_NUM !== undefined ? attributes.CODE_NUM : (attributes.code_num !== null && attributes.code_num !== undefined ? attributes.code_num : null);
          const comment = attributes.COMMENT || attributes.comment || null;
          
          features.push({
            objectId: objectId ? objectId.toString() : null,
            nname: nname || null,
            nameLabel: nameLabel || null,
            name1: name1 || null,
            name2: name2 || null,
            codeNum: codeNum !== null && codeNum !== undefined ? Number(codeNum) : null,
            comment: comment || null,
            geometry: geometry,
            distance_miles: 0,
            isContaining: true,
            attributes: attributes
          });
        });
      }
    } catch (error) {
      console.warn('⚠️ Houston Neighborhoods: Point-in-polygon query failed:', error);
    }
    
    // Proximity query (if radius is provided and <= 10 miles)
    if (radiusMiles && radiusMiles > 0 && radiusMiles <= 10.0) {
      try {
        const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
        // Build query URL manually to ensure proper encoding
        const geometryStr = encodeURIComponent(JSON.stringify(geometry));
        const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true`;
        
        console.log(`🏘️ Querying Houston Neighborhoods for proximity (${radiusMiles} miles) at [${lat}, ${lon}]`);
        console.log(`🔗 Houston Neighborhoods Proximity Query URL: ${proximityUrl}`);
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        // Log the full response for debugging
        console.log(`📊 Houston Neighborhoods Proximity Response:`, {
          hasError: !!proximityData.error,
          error: proximityData.error,
          featureCount: proximityData.features?.length || 0,
          hasFeatures: !!proximityData.features,
          fullResponse: proximityData
        });
        
        if (proximityData.error) {
          console.error('❌ Houston Neighborhoods API Error:', proximityData.error);
        } else if (proximityData.features && proximityData.features.length > 0) {
          proximityData.features.forEach((feature: any) => {
            // Skip if already added from point-in-polygon query
            const objectId = feature.attributes.OBJECTID || feature.attributes.objectid || null;
            const existingIndex = features.findIndex(f => f.objectId === (objectId ? objectId.toString() : null));
            
            if (existingIndex >= 0) {
              // Already added, skip
              return;
            }
            
            const attributes = feature.attributes || {};
            const geometry = feature.geometry || null;
            
            // Calculate centroid for distance calculation
            let centroidLat = lat;
            let centroidLon = lon;
            
            if (geometry && geometry.rings && Array.isArray(geometry.rings) && geometry.rings.length > 0) {
              const firstRing = geometry.rings[0];
              if (Array.isArray(firstRing) && firstRing.length > 0) {
                const centroid = calculatePolygonCentroid(firstRing);
                const [latCoord, lonCoord] = esriToLatLon(centroid[0], centroid[1]);
                centroidLat = latCoord;
                centroidLon = lonCoord;
              }
            }
            
            const distance = calculateDistance(lat, lon, centroidLat, centroidLon);
            
            const nname = attributes.NNAME || attributes.nname || null;
            const nameLabel = attributes.NAME_LABEL || attributes.name_label || attributes.NAME_LABEL || null;
            const name1 = attributes.NAME_1 || attributes.name_1 || null;
            const name2 = attributes.NAME_2 || attributes.name_2 || null;
            const codeNum = attributes.CODE_NUM !== null && attributes.CODE_NUM !== undefined ? attributes.CODE_NUM : (attributes.code_num !== null && attributes.code_num !== undefined ? attributes.code_num : null);
            const comment = attributes.COMMENT || attributes.comment || null;
            
            features.push({
              objectId: objectId ? objectId.toString() : null,
              nname: nname || null,
              nameLabel: nameLabel || null,
              name1: name1 || null,
              name2: name2 || null,
              codeNum: codeNum !== null && codeNum !== undefined ? Number(codeNum) : null,
              comment: comment || null,
              geometry: geometry,
              distance_miles: distance,
              isContaining: false,
              attributes: attributes
            });
          });
        }
      } catch (error) {
        console.warn('⚠️ Houston Neighborhoods: Proximity query failed:', error);
      }
    }
    
    // Sort by containing first, then by distance
    features.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      return (a.distance_miles || 0) - (b.distance_miles || 0);
    });
    
    console.log(`✅ Houston Neighborhoods: Found ${features.length} neighborhood(s)`);
    return features;
  } catch (error) {
    console.error('❌ Error querying Houston Neighborhoods data:', error);
    throw error;
  }
}

