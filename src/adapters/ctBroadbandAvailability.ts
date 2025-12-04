/**
 * CT 2025 Broadband Availability by Block Adapter
 * Queries Connecticut 2025 Broadband Availability by Census Block
 * from CT Geodata Portal FeatureServer
 * Supports both point-in-polygon (which block contains the point) and
 * proximity queries (blocks within a specified radius up to 5 miles)
 */

const BASE_SERVICE_URL = 'https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/ArcGIS/rest/services/2025_Broadband_Availability_WFL1/FeatureServer';
const LAYER_ID = 0;

export interface CTBroadbandAvailabilityData {
  containingBlock: CTBroadbandBlockInfo | null;
  nearbyBlocks: CTBroadbandBlockInfo[];
}

export interface CTBroadbandBlockInfo {
  blockId: string | null;
  blockGeoid: string | null;
  blockName: string | null;
  totalLocations: number | null;
  unserved: number | null;
  underserved: number | null;
  served: number | null;
  pctUnserved: number | null;
  pctUnderserved: number | null;
  pctServed: number | null;
  maxDownload: number | null;
  minDownload: number | null;
  nProviders: number | null;
  allProviders: string | null;
  townName: string | null;
  countyName: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number;
}

/**
 * Calculate distance from a point to a polygon (distance to nearest edge)
 */
function calculateDistanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  let minDistance = Infinity;
  
  // Check distance to each ring (outer boundary and holes)
  rings.forEach(ring => {
    // Check distance to each edge of the ring
    for (let i = 0; i < ring.length; i++) {
      const p1 = ring[i];
      const p2 = ring[(i + 1) % ring.length]; // Wrap around to close the polygon
      
      // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
      const lat1 = p1[1];
      const lon1 = p1[0];
      const lat2 = p2[1];
      const lon2 = p2[0];
      
      // Calculate distance from point to line segment
      const distance = pointToLineSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, distance);
    }
  });
  
  return minDistance;
}

/**
 * Calculate distance from a point to a line segment
 */
function pointToLineSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  // Convert to radians
  const lat1 = y1 * Math.PI / 180;
  const lon1 = x1 * Math.PI / 180;
  const lat2 = y2 * Math.PI / 180;
  const lon2 = x2 * Math.PI / 180;
  const latP = py * Math.PI / 180;
  const lonP = px * Math.PI / 180;
  
  // Calculate distance from point to each endpoint
  const d1 = haversineDistance(latP, lonP, lat1, lon1);
  const d2 = haversineDistance(latP, lonP, lat2, lon2);
  
  // Calculate distance along the line segment
  const dSegment = haversineDistance(lat1, lon1, lat2, lon2);
  
  // If segment is very short, just use distance to nearest endpoint
  if (dSegment < 0.001) {
    return Math.min(d1, d2);
  }
  
  // Calculate the closest point on the line segment
  const t = Math.max(0, Math.min(1, 
    ((latP - lat1) * (lat2 - lat1) + (lonP - lon1) * (lon2 - lon1)) / (dSegment * dSegment)
  ));
  
  const latClosest = lat1 + t * (lat2 - lat1);
  const lonClosest = lon1 + t * (lon2 - lon1);
  
  return haversineDistance(latP, lonP, latClosest, lonClosest);
}

/**
 * Haversine distance calculation
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Query CT Broadband Availability FeatureServer for point-in-polygon
 * Returns the block that contains the given point
 */
async function getContainingBlock(
  lat: number,
  lon: number
): Promise<CTBroadbandBlockInfo | null> {
  try {
    console.log(`📡 Querying CT Broadband Availability for containing block at [${lat}, ${lon}]`);
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for point-in-polygon
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
    queryUrl.searchParams.set('returnGeometry', 'true'); // Return geometry for map drawing
    
    console.log(`🔗 CT Broadband Availability Point-in-Polygon Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT Broadband Availability API Error:', data.error);
      return null;
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CT Broadband Availability block found containing this location');
      return null;
    }
    
    // Get the first feature (should only be one for point-in-polygon)
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    // Extract block information
    const blockId = attributes.OBJECTID || 
                   attributes.objectid || 
                   attributes.block_geoid ||
                   attributes.BLOCK_GEOID ||
                   null;
    
    const blockGeoid = attributes.block_geoid || 
                       attributes.BLOCK_GEOID ||
                       attributes.block_geoid_2020 ||
                       null;
    
    const blockName = attributes.block_name || 
                     attributes.BLOCK_NAME ||
                     null;
    
    const totalLocations = attributes.total_locations !== null && attributes.total_locations !== undefined 
      ? parseInt(attributes.total_locations.toString()) 
      : null;
    
    const unserved = attributes.unserved !== null && attributes.unserved !== undefined 
      ? parseInt(attributes.unserved.toString()) 
      : null;
    
    const underserved = attributes.underserved !== null && attributes.underserved !== undefined 
      ? parseInt(attributes.underserved.toString()) 
      : null;
    
    const served = attributes.served !== null && attributes.served !== undefined 
      ? parseInt(attributes.served.toString()) 
      : null;
    
    const pctUnserved = attributes.pct_unserved !== null && attributes.pct_unserved !== undefined 
      ? parseFloat(attributes.pct_unserved.toString()) 
      : null;
    
    const pctUnderserved = attributes.pct_underserved !== null && attributes.pct_underserved !== undefined 
      ? parseFloat(attributes.pct_underserved.toString()) 
      : null;
    
    const pctServed = attributes.pct_served !== null && attributes.pct_served !== undefined 
      ? parseFloat(attributes.pct_served.toString()) 
      : null;
    
    const maxDownload = attributes.max_download !== null && attributes.max_download !== undefined 
      ? parseFloat(attributes.max_download.toString()) 
      : null;
    
    const minDownload = attributes.min_download !== null && attributes.min_download !== undefined 
      ? parseFloat(attributes.min_download.toString()) 
      : null;
    
    const nProviders = attributes.n_providers !== null && attributes.n_providers !== undefined 
      ? parseInt(attributes.n_providers.toString()) 
      : null;
    
    const allProviders = attributes.all_provs || 
                        attributes.ALL_PROVS ||
                        null;
    
    const townName = attributes.town_name || 
                    attributes.TOWN_NAME ||
                    null;
    
    const countyName = attributes.county_name || 
                      attributes.COUNTY_NAME ||
                      null;
    
    console.log(`✅ Found containing CT Broadband Availability block: ${blockName || blockGeoid || blockId}`);
    
    return {
      blockId: blockId ? blockId.toString() : null,
      blockGeoid,
      blockName,
      totalLocations,
      unserved,
      underserved,
      served,
      pctUnserved,
      pctUnderserved,
      pctServed,
      maxDownload,
      minDownload,
      nProviders,
      allProviders,
      townName,
      countyName,
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying CT Broadband Availability for containing block:', error);
    return null;
  }
}

/**
 * Query CT Broadband Availability FeatureServer for proximity search
 * Returns blocks within the specified radius (in miles, up to 5 miles)
 */
async function getNearbyBlocks(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTBroadbandBlockInfo[]> {
  try {
    // Cap radius at 5 miles
    const cappedRadius = Math.min(radiusMiles, 5.0);
    
    console.log(`📡 Querying CT Broadband Availability blocks within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    // Convert miles to meters for the buffer distance
    const radiusMeters = cappedRadius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    // Set query parameters for proximity search
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
    queryUrl.searchParams.set('returnGeometry', 'true'); // Return geometry for map drawing
    queryUrl.searchParams.set('returnDistinctValues', 'false');
    
    console.log(`🔗 CT Broadband Availability Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CT Broadband Availability API Error:', data.error);
      return [];
    }
    
    // Check if we have features
    if (!data.features || data.features.length === 0) {
      console.log(`ℹ️ No CT Broadband Availability blocks found within ${cappedRadius} miles`);
      return [];
    }
    
    // Process all features
    const blocks: CTBroadbandBlockInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      // Extract block information
      const blockId = attributes.OBJECTID || 
                     attributes.objectid || 
                     attributes.block_geoid ||
                     attributes.BLOCK_GEOID ||
                     null;
      
      const blockGeoid = attributes.block_geoid || 
                         attributes.BLOCK_GEOID ||
                         attributes.block_geoid_2020 ||
                         null;
      
      const blockName = attributes.block_name || 
                       attributes.BLOCK_NAME ||
                       null;
      
      const totalLocations = attributes.total_locations !== null && attributes.total_locations !== undefined 
        ? parseInt(attributes.total_locations.toString()) 
        : null;
      
      const unserved = attributes.unserved !== null && attributes.unserved !== undefined 
        ? parseInt(attributes.unserved.toString()) 
        : null;
      
      const underserved = attributes.underserved !== null && attributes.underserved !== undefined 
        ? parseInt(attributes.underserved.toString()) 
        : null;
      
      const served = attributes.served !== null && attributes.served !== undefined 
        ? parseInt(attributes.served.toString()) 
        : null;
      
      const pctUnserved = attributes.pct_unserved !== null && attributes.pct_unserved !== undefined 
        ? parseFloat(attributes.pct_unserved.toString()) 
        : null;
      
      const pctUnderserved = attributes.pct_underserved !== null && attributes.pct_underserved !== undefined 
        ? parseFloat(attributes.pct_underserved.toString()) 
        : null;
      
      const pctServed = attributes.pct_served !== null && attributes.pct_served !== undefined 
        ? parseFloat(attributes.pct_served.toString()) 
        : null;
      
      const maxDownload = attributes.max_download !== null && attributes.max_download !== undefined 
        ? parseFloat(attributes.max_download.toString()) 
        : null;
      
      const minDownload = attributes.min_download !== null && attributes.min_download !== undefined 
        ? parseFloat(attributes.min_download.toString()) 
        : null;
      
      const nProviders = attributes.n_providers !== null && attributes.n_providers !== undefined 
        ? parseInt(attributes.n_providers.toString()) 
        : null;
      
      const allProviders = attributes.all_provs || 
                          attributes.ALL_PROVS ||
                          null;
      
      const townName = attributes.town_name || 
                      attributes.TOWN_NAME ||
                      null;
      
      const countyName = attributes.county_name || 
                        attributes.COUNTY_NAME ||
                        null;
      
      // Calculate distance from search point to nearest edge of polygon
      let distance_miles: number | undefined = undefined;
      if (geometry && geometry.rings && geometry.rings.length > 0) {
        distance_miles = calculateDistanceToPolygon(lat, lon, geometry.rings);
      }
      
      return {
        blockId: blockId ? blockId.toString() : null,
        blockGeoid,
        blockName,
        totalLocations,
        unserved,
        underserved,
        served,
        pctUnserved,
        pctUnderserved,
        pctServed,
        maxDownload,
        minDownload,
        nProviders,
        allProviders,
        townName,
        countyName,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    // Sort by distance (closest first)
    blocks.sort((a, b) => {
      const distA = a.distance_miles ?? Infinity;
      const distB = b.distance_miles ?? Infinity;
      return distA - distB;
    });
    
    console.log(`✅ Found ${blocks.length} nearby CT Broadband Availability blocks`);
    
    return blocks;
  } catch (error) {
    console.error('❌ Error querying CT Broadband Availability for nearby blocks:', error);
    return [];
  }
}

/**
 * Main function to get both containing block and nearby blocks
 */
export async function getCTBroadbandAvailabilityData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<CTBroadbandAvailabilityData | null> {
  try {
    // Get containing block (point-in-polygon)
    const containingBlock = await getContainingBlock(lat, lon);
    
    // Get nearby blocks (proximity search)
    const nearbyBlocks = await getNearbyBlocks(lat, lon, radiusMiles);
    
    return {
      containingBlock,
      nearbyBlocks
    };
  } catch (error) {
    console.error('❌ Error fetching CT Broadband Availability data:', error);
    return null;
  }
}

