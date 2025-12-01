/**
 * DE Conservation Easements Adapter
 * Supports both point-in-polygon and proximity queries up to 25 miles
 */

const BASE_SERVICE_URL = 'https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer';
const LAYER_ID = 12;

export interface DEConservationEasementData {
  containingFeature: DEConservationEasementInfo | null;
  nearbyFeatures: DEConservationEasementInfo[];
}

export interface DEConservationEasementInfo {
  attributes: Record<string, any>;
  geometry?: any;
  distance_miles?: number;
}

async function getContainingFeature(lat: number, lon: number): Promise<DEConservationEasementInfo | null> {
  try {
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', `${lon},${lat}`);
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    const response = await fetch(queryUrl.toString());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    if (data.error || !data.features || data.features.length === 0) return null;
    
    return {
      attributes: data.features[0].attributes || {},
      geometry: data.features[0].geometry || null
    };
  } catch (error) {
    console.error('❌ Error querying DE Conservation Easements:', error);
    return null;
  }
}

async function getNearbyFeatures(lat: number, lon: number, radiusMiles: number): Promise<DEConservationEasementInfo[]> {
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
    if (data.error || !data.features || data.features.length === 0) return [];
    
    const features: DEConservationEasementInfo[] = data.features.map((feature: any) => {
      let distance_miles: number | undefined;
      if (feature.geometry?.rings?.[0]) {
        const ring = feature.geometry.rings[0];
        const centroidLon = ring.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / ring.length;
        const centroidLat = ring.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / ring.length;
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
    console.error('❌ Error querying DE Conservation Easements:', error);
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

export async function getDEConservationEasementsData(
  lat: number,
  lon: number,
  radiusMiles: number = 0
): Promise<DEConservationEasementData> {
  const containingFeature = radiusMiles === 0 ? await getContainingFeature(lat, lon) : null;
  const nearbyFeatures = radiusMiles > 0 ? await getNearbyFeatures(lat, lon, radiusMiles) : [];
  return { containingFeature, nearbyFeatures };
}

