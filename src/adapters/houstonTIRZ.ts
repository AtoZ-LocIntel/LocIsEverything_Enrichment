/**
 * Houston Tax Incentive Reinvestment Zones (TIRZ) Adapter
 * Queries Houston TIRZ polygonal feature service
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_Tax_Incentive_Reinvestment_Zones_view/FeatureServer/5';

export interface HoustonTIRZInfo {
  objectId: string | null;
  name: string | null;
  siteNo: number | null;
  perimeter: number | null;
  shapeArea: number | null;
  shapeLength: number | null;
  globalId: string | null;
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
 * Query Houston TIRZ within proximity of a location
 * Supports both point-in-polygon and proximity queries
 */
export async function getHoustonTIRZData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<HoustonTIRZInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Convert lat/lon to Web Mercator for ESRI query
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const features: HoustonTIRZInfo[] = [];
    
    // Point-in-polygon query (always run for polygons)
    try {
      // Build query URL manually to ensure proper encoding
      const geometryStr = encodeURIComponent(JSON.stringify(geometry));
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🏛️ Querying Houston TIRZ for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 Houston TIRZ Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      // Log the full response for debugging
      console.log(`📊 Houston TIRZ Point-in-Polygon Response:`, {
        hasError: !!pointInPolyData.error,
        error: pointInPolyData.error,
        featureCount: pointInPolyData.features?.length || 0,
        hasFeatures: !!pointInPolyData.features
      });
      
      if (pointInPolyData.error) {
        console.error('❌ Houston TIRZ API Error:', pointInPolyData.error);
      } else if (pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const objectId = attributes.OBJECTID || attributes.objectid || null;
          const name = attributes.NAME || attributes.name || null;
          const siteNo = attributes.SITENO !== null && attributes.SITENO !== undefined ? Number(attributes.SITENO) : null;
          const perimeter = attributes.PERIMETER !== null && attributes.PERIMETER !== undefined ? parseFloat(attributes.PERIMETER.toString()) : null;
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
          const globalId = attributes.GlobalID || attributes.GLOBALID || null;
          
          features.push({
            objectId: objectId ? objectId.toString() : null,
            name: name || null,
            siteNo: siteNo,
            perimeter: perimeter,
            shapeArea: shapeArea,
            shapeLength: shapeLength,
            globalId: globalId,
            geometry: geometry,
            distance_miles: 0,
            isContaining: true,
            attributes: attributes
          });
        });
      }
    } catch (error) {
      console.warn('⚠️ Houston TIRZ: Point-in-polygon query failed:', error);
    }
    
    // Proximity query (if radius is provided)
    if (radiusMiles && radiusMiles > 0) {
      try {
        const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
        // Build query URL manually to ensure proper encoding
        const geometryStr = encodeURIComponent(JSON.stringify(geometry));
        const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true`;
        
        console.log(`🏛️ Querying Houston TIRZ for proximity (${radiusMiles} miles) at [${lat}, ${lon}]`);
        console.log(`🔗 Houston TIRZ Proximity Query URL: ${proximityUrl}`);
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        // Log the full response for debugging
        console.log(`📊 Houston TIRZ Proximity Response:`, {
          hasError: !!proximityData.error,
          error: proximityData.error,
          featureCount: proximityData.features?.length || 0,
          hasFeatures: !!proximityData.features
        });
        
        if (proximityData.error) {
          console.error('❌ Houston TIRZ API Error:', proximityData.error);
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
            
            const name = attributes.NAME || attributes.name || null;
            const siteNo = attributes.SITENO !== null && attributes.SITENO !== undefined ? Number(attributes.SITENO) : null;
            const perimeter = attributes.PERIMETER !== null && attributes.PERIMETER !== undefined ? parseFloat(attributes.PERIMETER.toString()) : null;
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
            const globalId = attributes.GlobalID || attributes.GLOBALID || null;
            
            features.push({
              objectId: objectId ? objectId.toString() : null,
              name: name || null,
              siteNo: siteNo,
              perimeter: perimeter,
              shapeArea: shapeArea,
              shapeLength: shapeLength,
              globalId: globalId,
              geometry: geometry,
              distance_miles: distance,
              isContaining: false,
              attributes: attributes
            });
          });
        }
      } catch (error) {
        console.warn('⚠️ Houston TIRZ: Proximity query failed:', error);
      }
    }
    
    // Sort by containing first, then by distance
    features.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      return (a.distance_miles || 0) - (b.distance_miles || 0);
    });
    
    console.log(`✅ Houston TIRZ: Found ${features.length} zone(s)`);
    return features;
  } catch (error) {
    console.error('❌ Error querying Houston TIRZ data:', error);
    throw error;
  }
}

