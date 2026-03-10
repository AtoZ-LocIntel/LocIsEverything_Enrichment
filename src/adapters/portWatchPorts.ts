/**
 * Adapter for Port Watch Ports Feature Service
 * Service URL: https://services9.arcgis.com/weJ1QsnbMYJlCHdG/ArcGIS/rest/services/PortWatch_ports/FeatureServer/1
 */

export interface PortWatchPortInfo {
  OBJECTID: number;
  portid?: string;
  portname?: string;
  country?: string;
  ISO3?: string;
  countrydisplayname?: string;
  continent?: string;
  fullname?: string;
  lat?: number;
  long?: number;
  vessel_count_total?: number;
  vessel_count_container?: number;
  vessel_count_dry_bulk?: number;
  vessel_count_general_cargo?: number;
  vessel_count_roro?: number;
  vessel_count_tanker?: number;
  industry_top1?: string;
  industry_top2?: string;
  industry_top3?: string;
  share_country_maritime_import?: number;
  share_country_maritime_export?: number;
  LOCODE?: string;
  portclass?: string;
  distance?: number; // Distance in miles from query point
}

const FEATURE_SERVER_URL = 'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/ArcGIS/rest/services/PortWatch_ports/FeatureServer/1';

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
 * Query Port Watch Ports within a radius of a location
 */
export async function getPortWatchPortsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<PortWatchPortInfo[]> {
  try {
    const maxRadius = radiusMiles || 1000; // Default to 1000 miles
    
    // Convert miles to degrees (approximate)
    // 1 degree latitude ≈ 69 miles
    // 1 degree longitude ≈ 69 * cos(latitude) miles
    const latRadius = maxRadius / 69;
    const lonRadius = maxRadius / (69 * Math.cos(lat * Math.PI / 180));
    
    const geometry = {
      xmin: lon - lonRadius,
      ymin: lat - latRadius,
      xmax: lon + lonRadius,
      ymax: lat + latRadius,
      spatialReference: { wkid: 4326 }
    };
    
    const params = new URLSearchParams({
      f: 'json',
      where: '1=1',
      geometry: JSON.stringify(geometry),
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      outSR: '4326',
      returnGeometry: 'true'
    });
    
    const response = await fetch(`${FEATURE_SERVER_URL}/query?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Port Watch Ports API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Port Watch Ports API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    if (!data.features || !Array.isArray(data.features)) {
      return [];
    }
    
    // Process features and calculate distances
    const ports: PortWatchPortInfo[] = data.features
      .map((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || {};
        
        const portLat = attributes.lat || geometry.y || geometry.latitude;
        const portLon = attributes.long || geometry.x || geometry.longitude;
        
        if (portLat == null || portLon == null) {
          return null;
        }
        
        const distance = calculateDistance(lat, lon, portLat, portLon);
        
        return {
          ...attributes,
          lat: portLat,
          long: portLon,
          distance
        };
      })
      .filter((port: PortWatchPortInfo | null): port is PortWatchPortInfo => port !== null)
      .filter((port: PortWatchPortInfo) => (port.distance ?? Infinity) <= maxRadius)
      .sort((a: PortWatchPortInfo, b: PortWatchPortInfo) => (a.distance || 0) - (b.distance || 0));
    
    return ports;
  } catch (error) {
    console.error('Error fetching Port Watch Ports data:', error);
    throw error;
  }
}

/**
 * Get all Port Watch Ports globally (for Global Risk map view)
 */
export async function getAllPortWatchPortsData(): Promise<PortWatchPortInfo[]> {
  try {
    const params = new URLSearchParams({
      f: 'json',
      where: '1=1',
      outFields: '*',
      outSR: '4326',
      returnGeometry: 'true',
      returnIdsOnly: 'false',
      returnCountOnly: 'false'
    });
    
    const response = await fetch(`${FEATURE_SERVER_URL}/query?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Port Watch Ports API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Port Watch Ports API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    if (!data.features || !Array.isArray(data.features)) {
      return [];
    }
    
    // Process features
    const ports: PortWatchPortInfo[] = data.features
      .map((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || {};
        
        const portLat = attributes.lat || geometry.y || geometry.latitude;
        const portLon = attributes.long || geometry.x || geometry.longitude;
        
        if (portLat == null || portLon == null) {
          return null;
        }
        
        return {
          ...attributes,
          lat: portLat,
          long: portLon
        };
      })
      .filter((port: PortWatchPortInfo | null): port is PortWatchPortInfo => port !== null);
    
    return ports;
  } catch (error) {
    console.error('Error fetching all Port Watch Ports data:', error);
    throw error;
  }
}
