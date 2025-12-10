/**
 * Houston METRO Park and Ride Locations Adapter
 * Queries Houston METRO Park and Ride Locations point feature service
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_METRO_Park_and_Ride_Locations_view/FeatureServer/9';

export interface HoustonMetroParkAndRideInfo {
  objectId: string | null;
  name: string | null;
  address: string | null;
  canopy: string | null;
  seat: string | null;
  kiosk: string | null;
  parkingSpaces: number | null;
  bikeRack: string | null;
  telephone: string | null;
  restroom: string | null;
  securityBooth: string | null;
  routesServed: string | null;
  keyMap: string | null;
  busStopId: number | null;
  fareZone: number | null;
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
 * Query Houston METRO Park and Ride Locations within proximity of a location
 * Supports proximity queries up to 25 miles
 */
export async function getHoustonMetroParkAndRideData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<HoustonMetroParkAndRideInfo[]> {
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
    
    const features: HoustonMetroParkAndRideInfo[] = [];
    
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
          console.log(`🚗 Querying Houston METRO Park and Ride Locations for proximity (${radiusMiles} miles) at [${lat}, ${lon}]`);
        }
        console.log(`🔗 Houston METRO Park and Ride Locations Proximity Query URL (offset ${resultOffset}): ${proximityUrl}`);
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        // Log the full response for debugging
        console.log(`📊 Houston METRO Park and Ride Locations Proximity Response (offset ${resultOffset}):`, {
          hasError: !!proximityData.error,
          error: proximityData.error,
          featureCount: proximityData.features?.length || 0,
          hasFeatures: !!proximityData.features,
          exceededTransferLimit: proximityData.exceededTransferLimit
        });
        
        if (proximityData.error) {
          console.error('❌ Houston METRO Park and Ride Locations API Error:', proximityData.error);
          break;
        }
        
        if (!proximityData.features || proximityData.features.length === 0) {
          hasMore = false;
          break;
        }
        
        allFeatures.push(...proximityData.features);
        console.log(`📦 Fetched batch: ${proximityData.features.length} park and ride locations (total so far: ${allFeatures.length})`);
        
        // Check if there are more records to fetch
        if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
          resultOffset += batchSize;
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }
      
      console.log(`✅ Fetched ${allFeatures.length} total Houston METRO Park and Ride Locations (${Math.ceil(allFeatures.length / batchSize)} batches)`);
      
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
          }
          
          const distance = calculateDistance(lat, lon, featureLat, featureLon);
          
          const objectId = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID.toString() : null;
          const name = attributes.NAME1 || null;
          const address = attributes.ADDRESS || null;
          const canopy = attributes.CANOPY || null;
          const seat = attributes.SEAT || null;
          const kiosk = attributes.KIOSK || null;
          const parkingSpaces = attributes.PSPACES !== null && attributes.PSPACES !== undefined ? Number(attributes.PSPACES) : null;
          const bikeRack = attributes.BIKERACK || null;
          const telephone = attributes.TEL || null;
          const restroom = attributes.RESTRM || null;
          const securityBooth = attributes.SECBOOTH || null;
          const routesServed = attributes.ROUTES_SER || null;
          const keyMap = attributes.KEYMAP || null;
          const busStopId = attributes.BusStopID !== null && attributes.BusStopID !== undefined ? Number(attributes.BusStopID) : null;
          const fareZone = attributes.FareZone !== null && attributes.FareZone !== undefined ? Number(attributes.FareZone) : null;
          
          features.push({
            objectId: objectId,
            name: name,
            address: address,
            canopy: canopy,
            seat: seat,
            kiosk: kiosk,
            parkingSpaces: parkingSpaces,
            bikeRack: bikeRack,
            telephone: telephone,
            restroom: restroom,
            securityBooth: securityBooth,
            routesServed: routesServed,
            keyMap: keyMap,
            busStopId: busStopId,
            fareZone: fareZone,
            geometry: geometry,
            distance_miles: distance,
            attributes: attributes
          });
        });
      }
    } catch (error) {
      console.warn('⚠️ Houston METRO Park and Ride Locations: Proximity query failed:', error);
    }
    
    // Sort by distance
    features.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
    
    console.log(`✅ Houston METRO Park and Ride Locations: Found ${features.length} location(s)`);
    return features;
  } catch (error) {
    console.error('❌ Error querying Houston METRO Park and Ride Locations data:', error);
    throw error;
  }
}

