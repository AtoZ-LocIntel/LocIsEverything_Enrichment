import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services3.arcgis.com/HESxeTbDliKKvec2/arcgis/rest/services/OpenData_ParcelPolygons/FeatureServer/1';

export interface LakeCountyParcelPointInfo {
  objectId: number;
  attributes: Record<string, any>;
  lat: number;
  lon: number;
  distance?: number;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query Lake County Parcel Points for proximity
 * Supports proximity queries up to 1 mile
 */
export async function getLakeCountyParcelPointsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<LakeCountyParcelPointInfo[]> {
  try {
    // Cap radius at 1 mile
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 1.0) : 1.0;
    
    if (maxRadius <= 0) {
      return [];
    }
    
    const radiusMeters = maxRadius * 1609.34;
    const proximityGeometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const allFeatures: any[] = [];
    let resultOffset = 0;
    const batchSize = 2000;
    let hasMore = true;
    
    while (hasMore) {
      const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
      
      if (resultOffset === 0) {
        console.log(`📍 Querying Lake County Parcel Points for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
      }
      
      const proximityData = await fetchJSONSmart(proximityUrl) as any;
      
      if (proximityData.error) {
        console.error('❌ Lake County Parcel Points API Error:', proximityData.error);
        break;
      }
      
      if (!proximityData.features || proximityData.features.length === 0) {
        hasMore = false;
        break;
      }
      
      allFeatures.push(...proximityData.features);
      
      if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
        resultOffset += batchSize;
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        hasMore = false;
      }
    }
    
    console.log(`✅ Fetched ${allFeatures.length} total Lake County Parcel Points for proximity`);
    
    // Process features and calculate distances
    const results: LakeCountyParcelPointInfo[] = allFeatures
      .map((feature: any) => {
        const geometry = feature.geometry;
        if (!geometry || (geometry.x === undefined && geometry.y === undefined)) {
          return null;
        }
        
        // Extract coordinates (may be in different spatial reference)
        let featureLon = geometry.x;
        let featureLat = geometry.y;
        
        // If coordinates are in Web Mercator (3857), convert to WGS84
        if (Math.abs(featureLon) > 180 || Math.abs(featureLat) > 90) {
          // Likely Web Mercator, convert to WGS84
          featureLon = (featureLon / 20037508.34) * 180;
          featureLat = (featureLat / 20037508.34) * 180;
          featureLat = 180 / Math.PI * (2 * Math.atan(Math.exp(featureLat * Math.PI / 180)) - Math.PI / 2);
        }
        
        const distance = calculateDistance(lat, lon, featureLat, featureLon);
        
        if (distance <= maxRadius) {
          return {
            objectId: feature.attributes.OBJECTID || feature.attributes.objectId || 0,
            lat: featureLat,
            lon: featureLon,
            distance: distance,
            attributes: feature.attributes
          };
        }
        
        return null;
      })
      .filter((point): point is LakeCountyParcelPointInfo => point !== null)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    console.log(`✅ Found ${results.length} Lake County Parcel Point(s) within ${maxRadius} miles`);
    
    return results;
  } catch (error) {
    console.error('❌ Error querying Lake County Parcel Points data:', error);
    return [];
  }
}

