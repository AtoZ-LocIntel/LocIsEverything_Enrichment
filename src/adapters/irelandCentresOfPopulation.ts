import { fetchJSONSmart } from '../services/EnrichmentService';

export interface IrelandCentreOfPopulationInfo {
  objectId: number;
  county: string;
  contae: string;
  localGove: string;
  limistear: string;
  classification: string;
  cineal: string;
  gaeltacht: string;
  townClass: string;
  id: string;
  englishName: string;
  irishName: string;
  foirmGhin: string;
  alternative: string;
  igE: number;
  igN: number;
  itmE: number;
  itmN: number;
  irishVali: number;
  legislation: number;
  validated: string;
  date: number;
  comment: string;
  lat: number;
  lon: number;
  distance_miles: number;
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

export async function getIrelandCentresOfPopulationData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<IrelandCentreOfPopulationInfo[]> {
  const baseUrl = 'https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/Centres_of_Population___OSi_National_Placenames_Gazetteer/FeatureServer/0';
  
  const results: IrelandCentreOfPopulationInfo[] = [];
  
  try {
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
      const response = await fetchJSONSmart(url);
      
      if (!response || !response.features || response.features.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const feature of response.features) {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        // Extract coordinates from geometry (ESRI returns in WGS84 when outSR=4326)
        let featureLat: number | null = null;
        let featureLon: number | null = null;
        
        if (geometry) {
          if (geometry.y !== undefined && geometry.x !== undefined) {
            // ESRI geometry format: {x: lon, y: lat}
            featureLat = geometry.y;
            featureLon = geometry.x;
          } else if (geometry.coordinates && Array.isArray(geometry.coordinates)) {
            // GeoJSON format: [lon, lat]
            featureLon = geometry.coordinates[0];
            featureLat = geometry.coordinates[1];
          }
        }
        
        if (featureLat === null || featureLon === null || isNaN(featureLat) || isNaN(featureLon)) {
          console.warn('⚠️ Centre of Population missing valid coordinates. Available fields:', Object.keys(attributes));
          continue;
        }
        
        // Calculate distance using Haversine formula
        const distance = haversineDistance(lat, lon, featureLat, featureLon);
        
        // Only include features within the specified radius
        if (distance <= radiusMiles) {
          const centreInfo: IrelandCentreOfPopulationInfo = {
            objectId: attributes.OBJECTID_1 || 0,
            county: attributes.County || '',
            contae: attributes.Contae || '',
            localGove: attributes.Local_Gove || '',
            limistear: attributes.Limistéar || '',
            classification: attributes.Classifica || '',
            cineal: attributes.Cineál || '',
            gaeltacht: attributes.Gaeltacht || '',
            townClass: attributes.Town_Class || '',
            id: attributes.ID || '',
            englishName: attributes.English_Na || '',
            irishName: attributes.Irish_Name || '',
            foirmGhin: attributes.Foirm_Ghin || '',
            alternative: attributes.Alternativ || '',
            igE: attributes.IG_E || 0,
            igN: attributes.IG_N || 0,
            itmE: attributes.ITM_E || 0,
            itmN: attributes.ITM_N || 0,
            irishVali: attributes.Irish_Vali || 0,
            legislation: attributes.Legislatio || 0,
            validated: attributes.Validated_ || '',
            date: attributes.Date_ || 0,
            comment: attributes.Comment_ || '',
            lat: featureLat,
            lon: featureLon,
            distance_miles: distance,
            ...attributes
          };
          
          results.push(centreInfo);
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
    results.sort((a, b) => a.distance_miles - b.distance_miles);
    
  } catch (error) {
    console.error('Error fetching Ireland Centres of Population data:', error);
  }
  
  return results;
}

