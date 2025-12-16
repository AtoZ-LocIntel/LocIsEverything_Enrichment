/**
 * UK NSPL Latest Postcode Centroids Adapter
 * Queries UK Office for National Statistics NSPL Latest Postcode Centroids point feature service
 * Supports proximity queries up to 5 miles
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

export interface UKNSPLPostcodeCentroidInfo {
  objectId: number;
  pcd7: string | null;
  pcd8: string | null;
  pcds: string | null;
  lat: number | null;
  lon: number | null; // Use 'lon' for MapView compatibility
  long?: number | null; // Keep 'long' for backward compatibility
  oa21cd: string | null;
  lad25cd: string | null;
  lsoa21cd: string | null;
  msoa21cd: string | null;
  distance_miles?: number;
  geometry?: any;
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

export async function getUKNSPLPostcodeCentroidsData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<{
  nearby_features: UKNSPLPostcodeCentroidInfo[];
  _all: UKNSPLPostcodeCentroidInfo[];
}> {
  const baseUrl = 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/NSPL_LATEST_UK/FeatureServer/1';
  
  const nearby_features: UKNSPLPostcodeCentroidInfo[] = [];
  const _all: UKNSPLPostcodeCentroidInfo[] = [];
  
  try {
    // Cap radius at 1 mile
    if (radiusMiles > 1.0) {
      radiusMiles = 1.0;
    }
    
    if (radiusMiles <= 0) {
      return { nearby_features, _all };
    }
    
    // Convert radius from miles to meters for ESRI query
    const radiusMeters = radiusMiles * 1609.34;
    
    // Create a buffer geometry for proximity query
    const bufferGeometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    // Query for features within the buffer (proximity)
    const queryUrl = `${baseUrl}/query?f=json&where=1=1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(bufferGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=2000`;
    
    let hasMore = true;
    let resultOffset = 0;
    const resultRecordCount = 2000;
    
    while (hasMore) {
      const url = `${queryUrl}&resultOffset=${resultOffset}`;
      const response = await fetchJSONSmart(url) as any;
      
      if (!response || !response.features || response.features.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const feature of response.features) {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        // Extract coordinates from geometry or attributes
        let featureLat: number | null = null;
        let featureLon: number | null = null;
        
        if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
          featureLon = geometry.x;
          featureLat = geometry.y;
        } else if (attributes.LAT !== null && attributes.LAT !== undefined && attributes.LONG !== null && attributes.LONG !== undefined) {
          featureLat = Number(attributes.LAT);
          featureLon = Number(attributes.LONG);
        } else if (attributes.lat !== null && attributes.lat !== undefined && attributes.long !== null && attributes.long !== undefined) {
          featureLat = Number(attributes.lat);
          featureLon = Number(attributes.long);
        }
        
        if (featureLat === null || featureLon === null) {
          continue; // Skip features without valid coordinates
        }
        
        // Calculate distance
        const distance = haversineDistance(lat, lon, featureLat, featureLon);
        
        if (distance <= radiusMiles) {
          const postcodeInfo: UKNSPLPostcodeCentroidInfo = {
            objectId: attributes.OBJECTID || attributes.FID || attributes.ESRI_OID || 0,
            pcd7: attributes.PCD7 || attributes.pcd7 || null,
            pcd8: attributes.PCD8 || attributes.pcd8 || null,
            pcds: attributes.PCDS || attributes.pcds || null,
            lat: featureLat,
            lon: featureLon, // Use 'lon' instead of 'long' for MapView compatibility
            long: featureLon, // Keep 'long' for backward compatibility
            oa21cd: attributes.OA21CD || attributes.oa21cd || null,
            lad25cd: attributes.LAD25CD || attributes.lad25cd || null,
            lsoa21cd: attributes.LSOA21CD || attributes.lsoa21cd || null,
            msoa21cd: attributes.MSOA21CD || attributes.msoa21cd || null,
            distance_miles: distance,
            geometry: geometry,
            ...attributes
          };
          
          nearby_features.push(postcodeInfo);
          _all.push(postcodeInfo);
        }
      }
      
      // Check if there are more results
      if (response.exceededTransferLimit === true || response.features.length === resultRecordCount) {
        resultOffset += resultRecordCount;
      } else {
        hasMore = false;
      }
    }
    
    // Sort nearby features by distance
    nearby_features.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
  } catch (error) {
    console.error('Error fetching UK NSPL Postcode Centroids data:', error);
  }
  
  return {
    nearby_features,
    _all
  };
}

