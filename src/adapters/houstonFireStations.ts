/**
 * Houston Fire Stations Adapter
 * Queries Houston Fire Stations point feature service
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/NummVBqZSIJKUeVR/ArcGIS/rest/services/HFD_FireStations_AOI_SZ/FeatureServer/15';

export interface HoustonFireStationInfo {
  objectId: string | null;
  label: number | null;
  distSta: string | null;
  inDist: number | null;
  text: string | null;
  admin: string | null;
  xCoord: number | null;
  yCoord: number | null;
  lat: number | null;
  long: number | null;
  ladders: string | null;
  globalId: string | null;
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
 * Query Houston Fire Stations within proximity of a location
 * Supports proximity queries up to 25 miles
 */
export async function getHoustonFireStationsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<HoustonFireStationInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 25 miles
    if (radiusMiles && radiusMiles > 25.0) {
      radiusMiles = 25.0;
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
    
    const features: HoustonFireStationInfo[] = [];
    
    // Proximity query (required for points) with pagination to get all results
    try {
      const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
      const allFeatures: any[] = [];
      let resultOffset = 0;
      const batchSize = 2000; // ESRI FeatureServer max per request
      let hasMore = true;
      
      // Fetch all results in batches
      while (hasMore) {
        // Build query URL manually to ensure proper encoding
        const geometryStr = encodeURIComponent(JSON.stringify(geometry));
        const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        
        if (resultOffset === 0) {
          console.log(`🚒 Querying Houston Fire Stations for proximity (${radiusMiles} miles) at [${lat}, ${lon}]`);
        }
        console.log(`🔗 Houston Fire Stations Proximity Query URL (offset ${resultOffset}): ${proximityUrl}`);
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        // Log the full response for debugging
        console.log(`📊 Houston Fire Stations Proximity Response (offset ${resultOffset}):`, {
          hasError: !!proximityData.error,
          error: proximityData.error,
          featureCount: proximityData.features?.length || 0,
          hasFeatures: !!proximityData.features,
          exceededTransferLimit: proximityData.exceededTransferLimit
        });
        
        if (proximityData.error) {
          console.error('❌ Houston Fire Stations API Error:', proximityData.error);
          break;
        }
        
        if (!proximityData.features || proximityData.features.length === 0) {
          hasMore = false;
          break;
        }
        
        allFeatures.push(...proximityData.features);
        console.log(`📦 Fetched batch: ${proximityData.features.length} fire stations (total so far: ${allFeatures.length})`);
        
        // Check if there are more records to fetch
        if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
          resultOffset += batchSize;
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }
      
      console.log(`✅ Fetched ${allFeatures.length} total Houston Fire Stations (${Math.ceil(allFeatures.length / batchSize)} batches)`);
      
      // Process all features
      if (allFeatures.length > 0) {
        allFeatures.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          // Extract coordinates from geometry
          let featureLat = lat;
          let featureLon = lon;
          
          if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
            // Geometry is already in WGS84 (we requested outSR=4326)
            featureLon = geometry.x;
            featureLat = geometry.y;
          } else if (attributes.LAT && attributes.LONG) {
            // Fallback to LAT/LONG fields if geometry not available
            featureLat = Number(attributes.LAT);
            featureLon = Number(attributes.LONG);
          } else if (attributes.X_COORD && attributes.Y_COORD) {
            // Fallback to X_COORD/Y_COORD if available (may need conversion)
            const x = Number(attributes.X_COORD);
            const y = Number(attributes.Y_COORD);
            // Check if they look like lat/lon
            if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
              featureLon = x;
              featureLat = y;
            }
          }
          
          const distance = calculateDistance(lat, lon, featureLat, featureLon);
          
          const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
          const label = attributes.LABEL !== null && attributes.LABEL !== undefined ? Number(attributes.LABEL) : null;
          const distSta = attributes.DIST_STA || null;
          const inDist = attributes.IN_DIST !== null && attributes.IN_DIST !== undefined ? Number(attributes.IN_DIST) : null;
          const text = attributes.TEXT_ || null;
          const admin = attributes.Admin || attributes.ADMIN || null;
          const xCoord = attributes.X_COORD !== null && attributes.X_COORD !== undefined ? Number(attributes.X_COORD) : null;
          const yCoord = attributes.Y_COORD !== null && attributes.Y_COORD !== undefined ? Number(attributes.Y_COORD) : null;
          const latCoord = attributes.LAT !== null && attributes.LAT !== undefined ? Number(attributes.LAT) : null;
          const longCoord = attributes.LONG !== null && attributes.LONG !== undefined ? Number(attributes.LONG) : null;
          const ladders = attributes.LADDERS || null;
          const globalId = attributes.GlobalID || attributes.GLOBALID || null;
          
          features.push({
            objectId: objectId,
            label: label,
            distSta: distSta,
            inDist: inDist,
            text: text,
            admin: admin,
            xCoord: xCoord,
            yCoord: yCoord,
            lat: latCoord,
            long: longCoord,
            ladders: ladders,
            globalId: globalId,
            geometry: geometry,
            distance_miles: distance,
            attributes: attributes
          });
        });
      }
    } catch (error) {
      console.warn('⚠️ Houston Fire Stations: Proximity query failed:', error);
    }
    
    // Sort by distance
    features.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Houston Fire Stations: Found ${features.length} fire station(s)`);
    return features;
  } catch (error) {
    console.error('❌ Error querying Houston Fire Stations data:', error);
    throw error;
  }
}

