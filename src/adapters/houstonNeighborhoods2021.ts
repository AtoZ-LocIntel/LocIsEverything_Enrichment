/**
 * Houston Neighborhoods 2021 Adapter
 * Queries Houston Neighborhoods 2021 polygonal feature service
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/NummVBqZSIJKUeVR/ArcGIS/rest/services/Neighborhood_2021/FeatureServer/0';

export interface HoustonNeighborhood2021Info {
  objectId: string | null;
  objId: number | null;
  objName: string | null;
  objTyp: string | null;
  objSubtcd: string | null;
  objSubtyp: string | null;
  country: string | null;
  metro: string | null;
  lat: number | null;
  lon: number | null;
  reldate: string | null;
  objArea: number | null;
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
 * Query Houston Neighborhoods 2021 within proximity of a location
 * Supports both point-in-polygon and proximity queries (max 10 miles)
 */
export async function getHoustonNeighborhoods2021Data(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<HoustonNeighborhood2021Info[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Convert lat/lon to Web Mercator for ESRI query (if needed)
    // For now, use WGS84 directly - ArcGIS will handle coordinate transformation
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const features: HoustonNeighborhood2021Info[] = [];
    
    // Point-in-polygon query (always run for polygons)
    try {
      // Build query URL manually to ensure proper encoding
      const geometryStr = encodeURIComponent(JSON.stringify(geometry));
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🏘️ Querying Houston Neighborhoods 2021 for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 Houston Neighborhoods 2021 Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      // Log the full response for debugging
      console.log(`📊 Houston Neighborhoods 2021 Point-in-Polygon Response:`, {
        hasError: !!pointInPolyData.error,
        error: pointInPolyData.error,
        featureCount: pointInPolyData.features?.length || 0,
        hasFeatures: !!pointInPolyData.features
      });
      
      if (pointInPolyData.error) {
        console.error('❌ Houston Neighborhoods 2021 API Error:', pointInPolyData.error);
      } else if (pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const objectId = attributes.FID !== null && attributes.FID !== undefined ? attributes.FID.toString() : null;
          const objId = attributes.OBJ_ID !== null && attributes.OBJ_ID !== undefined ? Number(attributes.OBJ_ID) : null;
          const objName = attributes.OBJ_NAME || null;
          const objTyp = attributes.OBJ_TYP || null;
          const objSubtcd = attributes.OBJ_SUBTCD || null;
          const objSubtyp = attributes.OBJ_SUBTYP || null;
          const country = attributes.COUNTRY || null;
          const metro = attributes.METRO || null;
          const lat = attributes.LAT !== null && attributes.LAT !== undefined ? Number(attributes.LAT) : null;
          const lon = attributes.LON !== null && attributes.LON !== undefined ? Number(attributes.LON) : null;
          const reldate = attributes.RELDATE || null;
          const objArea = attributes.OBJ_AREA !== null && attributes.OBJ_AREA !== undefined ? Number(attributes.OBJ_AREA) : null;
          
          features.push({
            objectId: objectId,
            objId: objId,
            objName: objName,
            objTyp: objTyp,
            objSubtcd: objSubtcd,
            objSubtyp: objSubtyp,
            country: country,
            metro: metro,
            lat: lat,
            lon: lon,
            reldate: reldate,
            objArea: objArea,
            geometry: geometry,
            distance_miles: 0,
            isContaining: true,
            attributes: attributes
          });
        });
      }
    } catch (error) {
      console.warn('⚠️ Houston Neighborhoods 2021: Point-in-polygon query failed:', error);
    }
    
    // Proximity query (if radius is provided and <= 10 miles)
    if (radiusMiles && radiusMiles > 0 && radiusMiles <= 10.0) {
      try {
        const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
        // Build query URL manually to ensure proper encoding
        const geometryStr = encodeURIComponent(JSON.stringify(geometry));
        const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true`;
        
        console.log(`🏘️ Querying Houston Neighborhoods 2021 for proximity (${radiusMiles} miles) at [${lat}, ${lon}]`);
        console.log(`🔗 Houston Neighborhoods 2021 Proximity Query URL: ${proximityUrl}`);
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        // Log the full response for debugging
        console.log(`📊 Houston Neighborhoods 2021 Proximity Response:`, {
          hasError: !!proximityData.error,
          error: proximityData.error,
          featureCount: proximityData.features?.length || 0,
          hasFeatures: !!proximityData.features
        });
        
        if (proximityData.error) {
          console.error('❌ Houston Neighborhoods 2021 API Error:', proximityData.error);
        } else if (proximityData.features && proximityData.features.length > 0) {
          proximityData.features.forEach((feature: any) => {
            // Skip if already added from point-in-polygon query
            const objectId = feature.attributes.FID !== null && feature.attributes.FID !== undefined ? feature.attributes.FID.toString() : null;
            const existingIndex = features.findIndex(f => f.objectId === objectId);
            
            if (existingIndex >= 0) {
              // Already added, skip
              return;
            }
            
            const attributes = feature.attributes || {};
            const geometry = feature.geometry || null;
            
            // Calculate centroid for distance calculation
            let centroidLat = lat;
            let centroidLon = lon;
            
            // Use LAT/LON fields if available, otherwise calculate from geometry
            if (attributes.LAT !== null && attributes.LAT !== undefined && attributes.LON !== null && attributes.LON !== undefined) {
              centroidLat = Number(attributes.LAT);
              centroidLon = Number(attributes.LON);
            } else if (geometry && geometry.rings && Array.isArray(geometry.rings) && geometry.rings.length > 0) {
              const firstRing = geometry.rings[0];
              if (Array.isArray(firstRing) && firstRing.length > 0) {
                const centroid = calculatePolygonCentroid(firstRing);
                const [latCoord, lonCoord] = esriToLatLon(centroid[0], centroid[1]);
                centroidLat = latCoord;
                centroidLon = lonCoord;
              }
            }
            
            const distance = calculateDistance(lat, lon, centroidLat, centroidLon);
            
            const objId = attributes.OBJ_ID !== null && attributes.OBJ_ID !== undefined ? Number(attributes.OBJ_ID) : null;
            const objName = attributes.OBJ_NAME || null;
            const objTyp = attributes.OBJ_TYP || null;
            const objSubtcd = attributes.OBJ_SUBTCD || null;
            const objSubtyp = attributes.OBJ_SUBTYP || null;
            const country = attributes.COUNTRY || null;
            const metro = attributes.METRO || null;
            const featureLat = attributes.LAT !== null && attributes.LAT !== undefined ? Number(attributes.LAT) : null;
            const featureLon = attributes.LON !== null && attributes.LON !== undefined ? Number(attributes.LON) : null;
            const reldate = attributes.RELDATE || null;
            const objArea = attributes.OBJ_AREA !== null && attributes.OBJ_AREA !== undefined ? Number(attributes.OBJ_AREA) : null;
            
            features.push({
              objectId: objectId,
              objId: objId,
              objName: objName,
              objTyp: objTyp,
              objSubtcd: objSubtcd,
              objSubtyp: objSubtyp,
              country: country,
              metro: metro,
              lat: featureLat,
              lon: featureLon,
              reldate: reldate,
              objArea: objArea,
              geometry: geometry,
              distance_miles: distance,
              isContaining: false,
              attributes: attributes
            });
          });
        }
      } catch (error) {
        console.warn('⚠️ Houston Neighborhoods 2021: Proximity query failed:', error);
      }
    }
    
    // Sort by containing first, then by distance
    features.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      return (a.distance_miles || 0) - (b.distance_miles || 0);
    });
    
    console.log(`✅ Houston Neighborhoods 2021: Found ${features.length} neighborhood(s)`);
    return features;
  } catch (error) {
    console.error('❌ Error querying Houston Neighborhoods 2021 data:', error);
    throw error;
  }
}

