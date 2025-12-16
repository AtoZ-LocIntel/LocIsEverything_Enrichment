import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/US_Drought_Intensity_v1/FeatureServer/3';

export interface NWSDroughtCurrentInfo {
  objectId: number;
  period?: string;
  dm?: number; // Drought Monitor Class (0-4)
  filename?: string;
  endyear?: number;
  endmonth?: number;
  endday?: number;
  ddate?: string;
  zipname?: string;
  source?: string;
  nothing?: number; // Nothing Percentage
  d0?: number; // D0 Percentage
  d1?: number; // D1 Percentage
  d2?: number; // D2 Percentage
  d3?: number; // D3 Percentage
  d4?: number; // D4 Percentage
  d0_d4?: number; // D0 - D4 Percentage
  d1_d4?: number; // D1 - D4 Percentage
  d2_d4?: number; // D2 - D4 Percentage
  d3_d4?: number; // D3 - D4 Percentage
  shapeArea?: number;
  shapeLength?: number;
  geometry: any; // ESRI polygon geometry
  lat?: number;
  lon?: number;
  containing?: boolean; // True if point is within polygon
  attributes: Record<string, any>;
}

/**
 * Calculate polygon centroid
 */
function calculateCentroid(rings: number[][][]): { lat: number; lon: number } | null {
  if (!rings || rings.length === 0) return null;
  
  const outerRing = rings[0];
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  
  for (const coord of outerRing) {
    if (coord && coord.length >= 2) {
      sumLon += coord[0];
      sumLat += coord[1];
      count++;
    }
  }
  
  if (count === 0) return null;
  
  return {
    lat: sumLat / count,
    lon: sumLon / count
  };
}

/**
 * Convert Web Mercator (3857) to WGS84 (4326)
 */
function webMercatorToWGS84(x: number, y: number): { lat: number; lon: number } {
  const lon = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
  return { lat, lon };
}

/**
 * Query NWS Current Drought Conditions for point-in-polygon only
 */
export async function getNWSDroughtCurrentData(
  lat: number,
  lon: number
): Promise<NWSDroughtCurrentInfo[]> {
  try {
    const results: NWSDroughtCurrentInfo[] = [];
    
    // Use WGS84 directly - ArcGIS services handle conversion server-side
    const pointGeometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    // Point-in-polygon query
    try {
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🌦️ Querying NWS Current Drought Conditions for point-in-polygon at [${lat}, ${lon}]`);
      console.log(`🔗 NWS Drought Point-in-Polygon Query URL: ${pointInPolyUrl}`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      if (pointInPolyData.error) {
        console.error(`❌ NWS Current Drought Conditions API Error:`, pointInPolyData.error);
      }
      
      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        console.log(`✅ NWS Current Drought Conditions returned ${pointInPolyData.features.length} feature(s) from point-in-polygon query`);
        
        pointInPolyData.features.forEach((feature: any) => {
          const attrs = feature.attributes || {};
          const geom = feature.geometry;
          
          let centroid: { lat: number; lon: number } | null = null;
          
          if (geom && geom.rings) {
            // Calculate centroid for CSV export
            // Check if coordinates are in Web Mercator (large values) or WGS84
            const firstCoord = geom.rings[0]?.[0];
            const isWebMercator = firstCoord && (Math.abs(firstCoord[0]) > 180 || Math.abs(firstCoord[1]) > 90);
            
            const ringsWGS84 = geom.rings.map((ring: number[][]) => 
              ring.map((coord: number[]) => {
                if (isWebMercator) {
                  // Convert from Web Mercator to WGS84
                  const wgs84 = webMercatorToWGS84(coord[0], coord[1]);
                  return [wgs84.lon, wgs84.lat];
                } else {
                  // Already in WGS84 - ESRI format is [lon, lat]
                  return [coord[0], coord[1]];
                }
              })
            );
            centroid = calculateCentroid(ringsWGS84);
          }
          
          // Trust server-side spatial query - if feature is returned, it contains the point
          results.push({
            objectId: attrs.OBJECTID || attrs.objectId || 0,
            period: attrs.period || '',
            dm: attrs.dm !== undefined && attrs.dm !== null ? attrs.dm : undefined,
            filename: attrs.filename || '',
            endyear: attrs.endyear,
            endmonth: attrs.endmonth,
            endday: attrs.endday,
            ddate: attrs.ddate || '',
            zipname: attrs.zipname || '',
            source: attrs.source || '',
            nothing: attrs.nothing,
            d0: attrs.d0,
            d1: attrs.d1,
            d2: attrs.d2,
            d3: attrs.d3,
            d4: attrs.d4,
            d0_d4: attrs.D0_D4 || attrs.d0_d4,
            d1_d4: attrs.D1_D4 || attrs.d1_d4,
            d2_d4: attrs.D2_D4 || attrs.d2_d4,
            d3_d4: attrs.D3_D4 || attrs.d3_d4,
            shapeArea: attrs.Shape__Area || attrs.shapeArea,
            shapeLength: attrs.Shape__Length || attrs.shapeLength,
            geometry: geom,
            lat: centroid?.lat,
            lon: centroid?.lon,
            containing: true,
            attributes: attrs
          });
        });
        
        console.log(`✅ Found ${results.length} NWS Current Drought Condition feature(s) containing the point`);
      } else {
        console.log(`ℹ️ No NWS Current Drought Conditions features found containing the point`);
      }
    } catch (error) {
      console.error(`❌ Point-in-polygon query failed for NWS Current Drought Conditions:`, error);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error querying NWS Current Drought Conditions data:', error);
    return [];
  }
}

