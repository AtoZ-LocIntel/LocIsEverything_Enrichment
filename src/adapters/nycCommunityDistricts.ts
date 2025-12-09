/**
 * NYC Community Districts Adapter
 * Queries NYC Community Districts from ArcGIS FeatureServer
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/NYC_Community_Districts_Water_Included/FeatureServer/0';

export interface NYCCommunityDistrictInfo {
  districtId: string | null;
  boroCD: string | null;
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
 * Check if a point is inside a polygon
 */
function isPointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
  }
  
  return inside;
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
 * Query NYC Community Districts within proximity of a location
 * Supports both point-in-polygon and proximity queries
 */
export async function getNYCCommunityDistrictsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<NYCCommunityDistrictInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Convert lat/lon to Web Mercator for ESRI query (if needed)
    // For now, use WGS84 directly
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const features: NYCCommunityDistrictInfo[] = [];
    
    // Point-in-polygon query (always run for polygons)
    try {
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(geometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🏘️ NYC Community Districts: Running point-in-polygon query`);
      
      const pointInPolyResponse = await fetchJSONSmart(pointInPolyUrl) as any;
      
      if (pointInPolyResponse.features && Array.isArray(pointInPolyResponse.features)) {
        for (const feature of pointInPolyResponse.features) {
          if (feature.geometry && feature.attributes) {
            const boroCD = feature.attributes.BoroCD || feature.attributes.boroCD || feature.attributes.BOROCD || feature.attributes.objectid || feature.attributes.OBJECTID || null;
            
            features.push({
              districtId: boroCD ? boroCD.toString() : null,
              boroCD: boroCD ? boroCD.toString() : null,
              geometry: feature.geometry,
              distance_miles: 0,
              isContaining: true,
              attributes: feature.attributes
            });
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ NYC Community Districts: Point-in-polygon query failed:', error);
    }
    
    // Proximity query (if radius is provided)
    if (radiusMiles && radiusMiles > 0) {
      try {
        const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
        const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(geometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true`;
        
        console.log(`🏘️ NYC Community Districts: Running proximity query (${radiusMiles} miles)`);
        
        const proximityResponse = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityResponse.features && Array.isArray(proximityResponse.features)) {
          for (const feature of proximityResponse.features) {
            // Skip if already added from point-in-polygon query
            const boroCD = feature.attributes.BoroCD || feature.attributes.boroCD || feature.attributes.BOROCD || feature.attributes.objectid || feature.attributes.OBJECTID || null;
            const existingIndex = features.findIndex(f => f.boroCD === (boroCD ? boroCD.toString() : null));
            
            if (existingIndex >= 0) {
              // Already added, skip
              continue;
            }
            
            if (feature.geometry && feature.attributes) {
              // Calculate centroid for distance calculation
              let centroidLat = lat;
              let centroidLon = lon;
              
              if (feature.geometry.rings && Array.isArray(feature.geometry.rings) && feature.geometry.rings.length > 0) {
                const firstRing = feature.geometry.rings[0];
                if (Array.isArray(firstRing) && firstRing.length > 0) {
                  const centroid = calculatePolygonCentroid(firstRing);
                  const [latCoord, lonCoord] = esriToLatLon(centroid[0], centroid[1]);
                  centroidLat = latCoord;
                  centroidLon = lonCoord;
                }
              }
              
              const distance = calculateDistance(lat, lon, centroidLat, centroidLon);
              
              features.push({
                districtId: boroCD ? boroCD.toString() : null,
                boroCD: boroCD ? boroCD.toString() : null,
                geometry: feature.geometry,
                distance_miles: distance,
                isContaining: false,
                attributes: feature.attributes
              });
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ NYC Community Districts: Proximity query failed:', error);
      }
    }
    
    // Sort by containing first, then by distance
    features.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      return (a.distance_miles || 0) - (b.distance_miles || 0);
    });
    
    console.log(`✅ NYC Community Districts: Found ${features.length} district(s)`);
    return features;
  } catch (error) {
    console.error('❌ Error querying NYC Community Districts data:', error);
    throw error;
  }
}

