/**
 * Houston Roads Centerline Adapter
 * Queries Houston Roads Centerline polyline feature service
 * Supports proximity queries up to 1 mile only
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_RoadCenterline/FeatureServer/8';

export interface HoustonRoadsCenterlineInfo {
  objectId: string | null;
  centerlineid: number | null;
  source: string | null;
  roadclass: string | null;
  fromleft: number | null;
  fromright: number | null;
  toleft: number | null;
  toright: number | null;
  prefix: string | null;
  roadname: string | null;
  roadtype: string | null;
  suffix: string | null;
  fullname: string | null;
  parityleft: string | null;
  parityright: string | null;
  onewaydir: string | null;
  munileft: string | null;
  muniright: string | null;
  countyleft: string | null;
  countyright: string | null;
  zipleft: string | null;
  zipright: string | null;
  speed: number | null;
  shapeLength: number | null;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
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
 * Query Houston Roads Centerline within proximity of a location
 * Supports proximity queries up to 1 mile only
 */
export async function getHoustonRoadsCenterlineData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<HoustonRoadsCenterlineInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 1 mile
    if (radiusMiles && radiusMiles > 1.0) {
      radiusMiles = 1.0;
    }
    
    if (!radiusMiles || radiusMiles <= 0) {
      return [];
    }
    
    // Convert lat/lon to Web Mercator for ESRI query
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const features: HoustonRoadsCenterlineInfo[] = [];
    
    // Proximity query (required for polylines)
    try {
      const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
      // Build query URL manually to ensure proper encoding
      const geometryStr = encodeURIComponent(JSON.stringify(geometry));
      const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🛣️ Querying Houston Roads Centerline for proximity (${radiusMiles} miles) at [${lat}, ${lon}]`);
      console.log(`🔗 Houston Roads Centerline Proximity Query URL: ${proximityUrl}`);
      
      const proximityData = await fetchJSONSmart(proximityUrl) as any;
      
      // Log the full response for debugging
      console.log(`📊 Houston Roads Centerline Proximity Response:`, {
        hasError: !!proximityData.error,
        error: proximityData.error,
        featureCount: proximityData.features?.length || 0,
        hasFeatures: !!proximityData.features
      });
      
      if (proximityData.error) {
        console.error('❌ Houston Roads Centerline API Error:', proximityData.error);
      } else if (proximityData.features && proximityData.features.length > 0) {
        proximityData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          // Calculate distance from point to nearest point on polyline
          let distance_miles = radiusMiles!; // Default to max radius
          
          if (geometry && geometry.paths) {
            // Find minimum distance to any point on any path of the polyline
            let minDistance = Infinity;
            geometry.paths.forEach((path: number[][]) => {
              path.forEach((coord: number[]) => {
                // Note: ESRI geometry paths are in [x, y] format (lon, lat)
                const distance = calculateDistance(lat, lon, coord[1], coord[0]);
                if (distance < minDistance) minDistance = distance;
              });
            });
            distance_miles = minDistance;
          } else if (geometry && geometry.rings) {
            // Handle polygon geometry (shouldn't happen for centerlines, but just in case)
            let minDistancePoly = Infinity;
            geometry.rings.forEach((ring: number[][]) => {
              ring.forEach((coord: number[]) => {
                const distance = calculateDistance(lat, lon, coord[1], coord[0]);
                if (distance < minDistancePoly) minDistancePoly = distance;
              });
            });
            distance_miles = minDistancePoly;
          }
          
          // Only include roads within the specified radius
          if (distance_miles <= radiusMiles!) {
            const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
            const centerlineid = attributes.centerlineid !== null && attributes.centerlineid !== undefined ? Number(attributes.centerlineid) : null;
            const source = attributes.source || null;
            const roadclass = attributes.roadclass || null;
            const fromleft = attributes.fromleft !== null && attributes.fromleft !== undefined ? Number(attributes.fromleft) : null;
            const fromright = attributes.fromright !== null && attributes.fromright !== undefined ? Number(attributes.fromright) : null;
            const toleft = attributes.toleft !== null && attributes.toleft !== undefined ? Number(attributes.toleft) : null;
            const toright = attributes.toright !== null && attributes.toright !== undefined ? Number(attributes.toright) : null;
            const prefix = attributes.prefix || null;
            const roadname = attributes.roadname || null;
            const roadtype = attributes.roadtype || null;
            const suffix = attributes.suffix || null;
            const fullname = attributes.fullname || null;
            const parityleft = attributes.parityleft || null;
            const parityright = attributes.parityright || null;
            const onewaydir = attributes.onewaydir || null;
            const munileft = attributes.munileft || null;
            const muniright = attributes.muniright || null;
            const countyleft = attributes.countyleft || null;
            const countyright = attributes.countyright || null;
            const zipleft = attributes.zipleft || null;
            const zipright = attributes.zipright || null;
            const speed = attributes.speed !== null && attributes.speed !== undefined ? Number(attributes.speed) : null;
            const shapeLength = attributes.Shape__Length !== null && attributes.Shape__Length !== undefined 
                             ? parseFloat(attributes.Shape__Length.toString())
                             : (attributes.shape_length !== null && attributes.shape_length !== undefined
                                ? parseFloat(attributes.shape_length.toString())
                                : null);
            
            features.push({
              objectId: objectId,
              centerlineid: centerlineid,
              source: source,
              roadclass: roadclass,
              fromleft: fromleft,
              fromright: fromright,
              toleft: toleft,
              toright: toright,
              prefix: prefix,
              roadname: roadname,
              roadtype: roadtype,
              suffix: suffix,
              fullname: fullname,
              parityleft: parityleft,
              parityright: parityright,
              onewaydir: onewaydir,
              munileft: munileft,
              muniright: muniright,
              countyleft: countyleft,
              countyright: countyright,
              zipleft: zipleft,
              zipright: zipright,
              speed: speed,
              shapeLength: shapeLength,
              geometry: geometry,
              distance_miles: Number(distance_miles.toFixed(2)),
              attributes: attributes
            });
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Houston Roads Centerline: Proximity query failed:', error);
    }
    
    // Sort by distance
    features.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Houston Roads Centerline: Found ${features.length} road segment(s)`);
    return features;
  } catch (error) {
    console.error('❌ Error querying Houston Roads Centerline data:', error);
    throw error;
  }
}

