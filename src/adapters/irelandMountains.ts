import { fetchJSONSmart } from '../services/EnrichmentService';

export interface IrelandMountainInfo {
  objectId: number;
  fCode: string;
  name: string;
  lat: number;
  lon: number;
  distance_miles?: number;
  [key: string]: any; // For other attributes
}

// Haversine distance calculation
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getIrelandMountainsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<IrelandMountainInfo[]> {
  const BASE_SERVICE_URL = 'https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/arcgis/rest/services/Mountains___OSi_National_1m_Map_Of_Ireland/FeatureServer/0';
  
  const mountains: IrelandMountainInfo[] = [];
  
  try {
    console.log(`🏔️ Querying Ireland Mountains within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    // Convert radius from miles to meters for ESRI query
    const radiusMeters = radiusMiles * 1609.34;
    
    let hasMore = true;
    let resultOffset = 0;
    const resultRecordCount = 2000;
    
    while (hasMore) {
      // Build query URL using URL API for better reliability
      const queryUrl = new URL(`${BASE_SERVICE_URL}/query`);
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
      queryUrl.searchParams.set('returnGeometry', 'true');
      queryUrl.searchParams.set('resultRecordCount', resultRecordCount.toString());
      queryUrl.searchParams.set('resultOffset', resultOffset.toString());
      
      console.log(`🔗 Ireland Mountains Query URL: ${queryUrl.toString()}`);
      
      const response = await fetchJSONSmart(queryUrl.toString());
      
      if (response.error) {
        console.error(`❌ Ireland Mountains API Error:`, response.error);
        hasMore = false;
        break;
      }
      
      if (!response || !response.features || response.features.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const feature of response.features) {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        // Extract coordinates
        let pointLat = 0;
        let pointLon = 0;
        
        if (geometry) {
          if (geometry.x !== undefined && geometry.y !== undefined) {
            pointLon = geometry.x;
            pointLat = geometry.y;
          } else if (geometry.longitude !== undefined && geometry.latitude !== undefined) {
            pointLon = geometry.longitude;
            pointLat = geometry.latitude;
          } else if (Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
            // GeoJSON format [lon, lat]
            pointLon = geometry.coordinates[0];
            pointLat = geometry.coordinates[1];
          }
        }
        
        // Skip if no valid coordinates
        if (pointLat === 0 && pointLon === 0) {
          continue;
        }
        
        // Calculate distance
        const distance = haversineDistance(lat, lon, pointLat, pointLon);
        
        // Only include if within radius
        if (distance <= radiusMiles) {
          const mountainInfo: IrelandMountainInfo = {
            objectId: attributes.OBJECTID || attributes.ESRI_OID || 0,
            fCode: attributes.F_CODE || '',
            name: attributes.NAMN1 || '',
            lat: pointLat,
            lon: pointLon,
            distance_miles: distance,
            ...attributes
          };
          
          mountains.push(mountainInfo);
        }
      }
      
      // Check if there are more results
      if (response.exceededTransferLimit === true || response.features.length === resultRecordCount) {
        resultOffset += resultRecordCount;
      } else {
        hasMore = false;
      }
    }
    
    // Sort by distance
    mountains.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
  } catch (error) {
    console.error('Error fetching Ireland Mountains data:', error);
  }
  
  return mountains;
}

