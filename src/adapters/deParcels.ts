/**
 * DE Parcels Adapter
 * Queries Delaware State Parcels from DE FirstMap FeatureServer
 * Supports both point-in-polygon (which parcel contains the point) and
 * proximity queries (parcels within a specified radius)
 */

const BASE_SERVICE_URL = 'https://enterprise.firstmap.delaware.gov/arcgis/rest/services/PlanningCadastre/DE_StateParcels/FeatureServer';
const LAYER_ID = 0; // State Parcels (polygons)

export interface DEParcelData {
  containingParcel: DEParcelInfo | null;
  nearbyParcels: DEParcelInfo[];
}

export interface DEParcelInfo {
  parcelId: string | null;
  attributes: Record<string, any>;
  geometry?: any;
  distance_miles?: number;
}

/**
 * Query DE Parcels FeatureServer for point-in-polygon
 * Returns the parcel that contains the given point
 */
async function getContainingParcel(
  lat: number,
  lon: number
): Promise<DEParcelInfo | null> {
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
    
    const feature = data.features[0];
    const attributes = feature.attributes || {};
    const geometry = feature.geometry || null;
    
    const parcelId = attributes.PIN || attributes.pin || attributes.OBJECTID || null;
    
    return {
      parcelId,
      attributes,
      geometry
    };
  } catch (error) {
    console.error('❌ Error querying DE Parcels for containing parcel:', error);
    return null;
  }
}

/**
 * Query DE Parcels FeatureServer for proximity search
 * Returns parcels within the specified radius (in miles)
 */
async function getNearbyParcels(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<DEParcelInfo[]> {
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
    
    const parcels: DEParcelInfo[] = data.features.map((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      const parcelId = attributes.PIN || attributes.pin || attributes.OBJECTID || null;
      
      // Calculate distance from centroid
      let distance_miles: number | undefined;
      if (geometry?.rings?.[0]) {
        const ring = geometry.rings[0];
        const centroidLon = ring.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / ring.length;
        const centroidLat = ring.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / ring.length;
        distance_miles = calculateDistance(lat, lon, centroidLat, centroidLon);
      }
      
      return {
        parcelId,
        attributes,
        geometry,
        distance_miles
      };
    });
    
    parcels.sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    return parcels;
  } catch (error) {
    console.error('❌ Error querying DE Parcels for nearby parcels:', error);
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

export async function getDEParcelData(
  lat: number,
  lon: number,
  radiusMiles: number = 0
): Promise<DEParcelData> {
  const containingParcel = radiusMiles === 0 ? await getContainingParcel(lat, lon) : null;
  const nearbyParcels = radiusMiles > 0 ? await getNearbyParcels(lat, lon, radiusMiles) : [];
  return { containingParcel, nearbyParcels };
}

