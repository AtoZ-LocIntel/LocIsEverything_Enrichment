/**
 * Houston OLC Grids Adapter
 * Queries Houston OLC (Open Location Code) Grids polygonal feature service
 * Supports point-in-polygon and proximity queries (max 5 miles)
 * Two layers: 6-digit grids (layer 0) and 8-digit grids (layer 1)
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_OLC_GRIDS/FeatureServer';

export interface HoustonOLCGridInfo {
  objectId: string | null;
  olcCode: string | null;
  gridSize: '6-digit' | '8-digit';
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
 * Query Houston OLC Grids for a specific layer
 * Supports both point-in-polygon and proximity queries (max 5 miles)
 */
export async function getHoustonOLCGridsData(
  layerId: number,
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<HoustonOLCGridInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Validate layer ID
    if (layerId !== 0 && layerId !== 1) {
      console.error(`❌ Invalid layer ID: ${layerId}. Must be 0 (6-digit) or 1 (8-digit)`);
      return [];
    }
    
    const gridSize = layerId === 0 ? '6-digit' : '8-digit';
    const serviceUrl = `${BASE_SERVICE_URL}/${layerId}`;
    
    // Convert lat/lon to Web Mercator for ESRI query
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const features: HoustonOLCGridInfo[] = [];
    
    // Point-in-polygon query (always run for polygons)
    try {
      // Build query URL manually to ensure proper encoding
      const geometryStr = encodeURIComponent(JSON.stringify(geometry));
      const pointInPolyUrl = `${serviceUrl}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🗺️ Querying Houston OLC Grid ${gridSize} for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 Houston OLC Grid ${gridSize} Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      // Log the full response for debugging
      console.log(`📊 Houston OLC Grid ${gridSize} Point-in-Polygon Response:`, {
        hasError: !!pointInPolyData.error,
        error: pointInPolyData.error,
        featureCount: pointInPolyData.features?.length || 0,
        hasFeatures: !!pointInPolyData.features
      });
      
      if (pointInPolyData.error) {
        console.error(`❌ Houston OLC Grid ${gridSize} API Error:`, pointInPolyData.error);
      } else if (pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const objectId = attributes.OBJECTID || attributes.objectid || null;
          // Try to find OLC code field (field name may vary)
          const olcCode = attributes.OLC_CODE || attributes.olc_code || attributes.OLCCode || attributes.olcCode || 
                         attributes.CODE || attributes.code || attributes.GRID_CODE || attributes.grid_code || null;
          
          features.push({
            objectId: objectId ? objectId.toString() : null,
            olcCode: olcCode || null,
            gridSize: gridSize,
            geometry: geometry,
            distance_miles: 0,
            isContaining: true,
            attributes: attributes
          });
        });
      }
    } catch (error) {
      console.warn(`⚠️ Houston OLC Grid ${gridSize}: Point-in-polygon query failed:`, error);
    }
    
    // Proximity query (if radius is provided and <= 5 miles)
    if (radiusMiles && radiusMiles > 0 && radiusMiles <= 5.0) {
      try {
        const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
        // Build query URL manually to ensure proper encoding
        const geometryStr = encodeURIComponent(JSON.stringify(geometry));
        const proximityUrl = `${serviceUrl}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true`;
        
        console.log(`🗺️ Querying Houston OLC Grid ${gridSize} for proximity (${radiusMiles} miles) at [${lat}, ${lon}]`);
        console.log(`🔗 Houston OLC Grid ${gridSize} Proximity Query URL: ${proximityUrl}`);
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        // Log the full response for debugging
        console.log(`📊 Houston OLC Grid ${gridSize} Proximity Response:`, {
          hasError: !!proximityData.error,
          error: proximityData.error,
          featureCount: proximityData.features?.length || 0,
          hasFeatures: !!proximityData.features
        });
        
        if (proximityData.error) {
          console.error(`❌ Houston OLC Grid ${gridSize} API Error:`, proximityData.error);
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
            
            // Try to find OLC code field (field name may vary)
            const olcCode = attributes.OLC_CODE || attributes.olc_code || attributes.OLCCode || attributes.olcCode || 
                           attributes.CODE || attributes.code || attributes.GRID_CODE || attributes.grid_code || null;
            
            features.push({
              objectId: objectId ? objectId.toString() : null,
              olcCode: olcCode || null,
              gridSize: gridSize,
              geometry: geometry,
              distance_miles: distance,
              isContaining: false,
              attributes: attributes
            });
          });
        }
      } catch (error) {
        console.warn(`⚠️ Houston OLC Grid ${gridSize}: Proximity query failed:`, error);
      }
    }
    
    // Sort by containing first, then by distance
    features.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      return (a.distance_miles || 0) - (b.distance_miles || 0);
    });
    
    console.log(`✅ Houston OLC Grid ${gridSize}: Found ${features.length} grid cell(s)`);
    return features;
  } catch (error) {
    console.error(`❌ Error querying Houston OLC Grid ${layerId === 0 ? '6-digit' : '8-digit'} data:`, error);
    throw error;
  }
}

