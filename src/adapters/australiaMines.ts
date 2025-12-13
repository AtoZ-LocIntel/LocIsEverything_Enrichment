/**
 * Australia Operating Mines Adapter
 * Queries Geoscience Australia Australian Operating Mines MapServer
 * Point feature service for operating mines, developing mines, and care/maintenance mines
 * Supports proximity queries up to 50 miles
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services.ga.gov.au/gis/rest/services/AustralianOperatingMines/MapServer';

export interface AustraliaMineInfo {
  objectId: number;
  mineName: string | null;
  status: string | null;
  commodity: string | null;
  state: string | null;
  lat: number;
  lon: number;
  distance_miles?: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
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

export async function getAustraliaMinesData(
  lat: number,
  lon: number,
  radiusMiles: number,
  layerId: number // 0 = Operating_Mines, 1 = Developing_Mines, 2 = Care_Maintenance_Mines
): Promise<AustraliaMineInfo[]> {
  try {
    const layerNames = ['Operating_Mines', 'Developing_Mines', 'Care_Maintenance_Mines'];
    const layerName = layerNames[layerId] || 'Operating_Mines';
    
    console.log(`⛏️ Querying Australia ${layerName} within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    // Convert radius from miles to meters for ESRI query
    const radiusMeters = radiusMiles * 1609.34;
    
    const mines: AustraliaMineInfo[] = [];
    let hasMore = true;
    let resultOffset = 0;
    const resultRecordCount = 2000;
    
    while (hasMore) {
      // Build query URL using URL API for better reliability
      const queryUrl = new URL(`${BASE_SERVICE_URL}/${layerId}/query`);
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
      
      console.log(`🔗 Australia ${layerName} Query URL: ${queryUrl.toString()}`);
      
      const response = await fetchJSONSmart(queryUrl.toString());
      
      if (response.error) {
        console.error(`❌ Australia ${layerName} API Error:`, response.error);
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
        
        if (!geometry) {
          continue;
        }
        
        // Extract coordinates - could be point or polygon
        let mineLat: number | null = null;
        let mineLon: number | null = null;
        
        if (geometry.x !== undefined && geometry.y !== undefined) {
          // Point geometry
          mineLon = geometry.x;
          mineLat = geometry.y;
        } else if (geometry.rings && geometry.rings.length > 0) {
          // Polygon geometry - use centroid or first point
          const ring = geometry.rings[0];
          if (ring && ring.length > 0) {
            const [firstPoint] = ring;
            mineLon = firstPoint[0];
            mineLat = firstPoint[1];
          }
        }
        
        if (mineLat == null || mineLon == null) {
          continue;
        }
        
        // Calculate distance from search point
        const distance = haversineDistance(lat, lon, mineLat, mineLon);
        
        // Only include if within radius
        if (distance <= radiusMiles) {
          const mineInfo: AustraliaMineInfo = {
            objectId: attributes.objectid || attributes.OBJECTID || attributes.ESRI_OID || 0,
            mineName: attributes.mine_name || attributes.MINE_NAME || attributes.name || attributes.Name || null,
            status: layerName, // Use layer name as status
            commodity: attributes.commodity || attributes.COMMODITY || null,
            state: attributes.state || attributes.STATE || null,
            lat: mineLat,
            lon: mineLon,
            distance_miles: distance,
            attributes,
            geometry,
            ...attributes
          };
          
          mines.push(mineInfo);
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
    mines.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${mines.length} Australia ${layerName}`);
    
    return mines;
  } catch (error) {
    console.error(`❌ Error querying Australia ${layerId === 0 ? 'Operating' : layerId === 1 ? 'Developing' : 'Care/Maintenance'} Mines:`, error);
    return [];
  }
}

