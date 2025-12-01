/**
 * DE No Build Line - Bay Adapter
 * Queries Delaware No Build Line - Bay from DE FirstMap FeatureServer
 * Supports proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer';
const LAYER_ID = 1;

export interface DENoBuildLineBayInfo {
  attributes: Record<string, any>;
  geometry?: any;
  distance_miles?: number;
}

export async function getDENoBuildLineBayData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DENoBuildLineBayInfo[]> {
  try {
    const radiusMeters = radiusMiles * 1609.34;
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', `${lon},${lat}`);
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', radiusMeters.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    const response = await fetch(queryUrl.toString());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    if (data.error) return [];
    if (!data.features || data.features.length === 0) return [];
    
    const features: DENoBuildLineBayInfo[] = data.features.map((feature: any) => {
      let distance_miles: number | undefined;
      if (feature.geometry?.paths?.[0]) {
        const path = feature.geometry.paths[0];
        const centroidLon = path.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / path.length;
        const centroidLat = path.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / path.length;
        distance_miles = calculateDistance(lat, lon, centroidLat, centroidLon);
      }
      
      return {
        attributes: feature.attributes || {},
        geometry: feature.geometry || null,
        distance_miles
      };
    });
    
    features.sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    return features;
  } catch (error) {
    console.error('❌ Error querying DE No Build Line - Bay:', error);
    return [];
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

