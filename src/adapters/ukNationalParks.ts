/**
 * UK National Parks Adapter
 * Queries UK Office for National Statistics National Parks (December 2022) Boundaries GB BFE (V3) polygon feature service
 * Supports point-in-polygon and proximity queries up to 50 miles
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

export interface UKNationalParkInfo {
  objectId: number;
  npark22cd: string | null;
  npark22nm: string | null;
  npark22nmw: string | null;
  bngE: number | null;
  bngN: number | null;
  long: number | null;
  lat: number | null;
  shapeArea: number | null;
  shapeLength: number | null;
  globalId: string | null;
  distance_miles?: number;
  isContaining?: boolean;
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

// Calculate polygon centroid for distance calculation
function calculatePolygonCentroid(rings: number[][][]): [number, number] | null {
  if (!rings || rings.length === 0 || !rings[0] || rings[0].length === 0) {
    return null;
  }
  
  const outerRing = rings[0];
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  
  for (const point of outerRing) {
    if (point && point.length >= 2) {
      sumLon += point[0];
      sumLat += point[1];
      count++;
    }
  }
  
  if (count === 0) return null;
  
  return [sumLon / count, sumLat / count];
}

export async function getUKNationalParksData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<{
  containing: UKNationalParkInfo[];
  nearby_features: UKNationalParkInfo[];
  _all: UKNationalParkInfo[];
}> {
  const baseUrl = 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/NPARK_DEC_2022_GB_BFE_V3/FeatureServer/0';
  
  const containing: UKNationalParkInfo[] = [];
  const nearby_features: UKNationalParkInfo[] = [];
  const _all: UKNationalParkInfo[] = [];
  
  try {
    // Cap radius at 50 miles
    if (radiusMiles > 50.0) {
      radiusMiles = 50.0;
    }
    
    const effectiveRadiusMiles = Math.max(radiusMiles, 0);
    
    // Point-in-polygon query (always run, even for radius 0)
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const containsUrl = `${baseUrl}/query?f=json&where=1=1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=2000`;
      
      const containsData = await fetchJSONSmart(containsUrl) as any;
      
      if (containsData && containsData.features && containsData.features.length > 0) {
        for (const feature of containsData.features) {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry;
          
          const parkInfo: UKNationalParkInfo = {
            objectId: attributes.OBJECTID || attributes.FID || attributes.ESRI_OID || 0,
            npark22cd: attributes.NPARK22CD || attributes.npark22cd || null,
            npark22nm: attributes.NPARK22NM || attributes.npark22nm || null,
            npark22nmw: attributes.NPARK22NMW || attributes.npark22nmw || null,
            bngE: attributes.BNG_E !== null && attributes.BNG_E !== undefined ? Number(attributes.BNG_E) : 
                  (attributes.bng_e !== null && attributes.bng_e !== undefined ? Number(attributes.bng_e) : null),
            bngN: attributes.BNG_N !== null && attributes.BNG_N !== undefined ? Number(attributes.BNG_N) : 
                  (attributes.bng_n !== null && attributes.bng_n !== undefined ? Number(attributes.bng_n) : null),
            long: attributes.LONG !== null && attributes.LONG !== undefined ? Number(attributes.LONG) : 
                  (attributes.long !== null && attributes.long !== undefined ? Number(attributes.long) : null),
            lat: attributes.LAT !== null && attributes.LAT !== undefined ? Number(attributes.LAT) : 
                 (attributes.lat !== null && attributes.lat !== undefined ? Number(attributes.lat) : null),
            shapeArea: attributes.Shape__Area !== null && attributes.Shape__Area !== undefined ? Number(attributes.Shape__Area) : 
                      (attributes.shapeArea !== null && attributes.shapeArea !== undefined ? Number(attributes.shapeArea) : null),
            shapeLength: attributes.Shape__Length !== null && attributes.Shape__Length !== undefined ? Number(attributes.Shape__Length) : 
                         (attributes.shapeLength !== null && attributes.shapeLength !== undefined ? Number(attributes.shapeLength) : null),
            globalId: attributes.GlobalID || attributes.globalId || attributes.GLOBALID || null,
            distance_miles: 0,
            isContaining: true,
            geometry: geometry,
            ...attributes
          };
          
          containing.push(parkInfo);
          _all.push(parkInfo);
        }
      }
    } catch (error) {
      console.error('Error fetching containing National Parks:', error);
    }
    
    // Proximity query (if radius is provided)
    if (effectiveRadiusMiles > 0) {
      try {
        const radiusMeters = effectiveRadiusMiles * 1609.34;
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
          const proximityUrl = `${baseUrl}/query?f=json&where=1=1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error('❌ UK National Parks API Error:', proximityData.error);
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
        
        // Process proximity features
        for (const feature of allFeatures) {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry;
          
          // Skip if already in containing array
          const parkCode = attributes.NPARK22CD || attributes.npark22cd;
          const alreadyContaining = containing.some(p => 
            (p.npark22cd === parkCode) || 
            (p.objectId === (attributes.OBJECTID || attributes.FID || attributes.ESRI_OID))
          );
          
          if (alreadyContaining) {
            continue; // Skip, already added as containing
          }
          
          // Calculate distance to polygon centroid
          let distance = effectiveRadiusMiles;
          if (geometry && geometry.rings && geometry.rings.length > 0) {
            const centroid = calculatePolygonCentroid(geometry.rings);
            if (centroid) {
              distance = haversineDistance(lat, lon, centroid[1], centroid[0]);
            } else if (attributes.LAT && attributes.LONG) {
              distance = haversineDistance(lat, lon, Number(attributes.LAT), Number(attributes.LONG));
            }
          } else if (attributes.LAT && attributes.LONG) {
            distance = haversineDistance(lat, lon, Number(attributes.LAT), Number(attributes.LONG));
          }
          
          if (distance <= effectiveRadiusMiles) {
            const parkInfo: UKNationalParkInfo = {
              objectId: attributes.OBJECTID || attributes.FID || attributes.ESRI_OID || 0,
              npark22cd: attributes.NPARK22CD || attributes.npark22cd || null,
              npark22nm: attributes.NPARK22NM || attributes.npark22nm || null,
              npark22nmw: attributes.NPARK22NMW || attributes.npark22nmw || null,
              bngE: attributes.BNG_E !== null && attributes.BNG_E !== undefined ? Number(attributes.BNG_E) : 
                    (attributes.bng_e !== null && attributes.bng_e !== undefined ? Number(attributes.bng_e) : null),
              bngN: attributes.BNG_N !== null && attributes.BNG_N !== undefined ? Number(attributes.BNG_N) : 
                    (attributes.bng_n !== null && attributes.bng_n !== undefined ? Number(attributes.bng_n) : null),
              long: attributes.LONG !== null && attributes.LONG !== undefined ? Number(attributes.LONG) : 
                    (attributes.long !== null && attributes.long !== undefined ? Number(attributes.long) : null),
              lat: attributes.LAT !== null && attributes.LAT !== undefined ? Number(attributes.LAT) : 
                   (attributes.lat !== null && attributes.lat !== undefined ? Number(attributes.lat) : null),
              shapeArea: attributes.Shape__Area !== null && attributes.Shape__Area !== undefined ? Number(attributes.Shape__Area) : 
                        (attributes.shapeArea !== null && attributes.shapeArea !== undefined ? Number(attributes.shapeArea) : null),
              shapeLength: attributes.Shape__Length !== null && attributes.Shape__Length !== undefined ? Number(attributes.Shape__Length) : 
                           (attributes.shapeLength !== null && attributes.shapeLength !== undefined ? Number(attributes.shapeLength) : null),
              globalId: attributes.GlobalID || attributes.globalId || attributes.GLOBALID || null,
              distance_miles: distance,
              isContaining: false,
              geometry: geometry,
              ...attributes
            };
            
            nearby_features.push(parkInfo);
            _all.push(parkInfo);
          }
        }
        
        // Sort nearby features by distance
        nearby_features.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
        
      } catch (error) {
        console.error('Error fetching nearby National Parks:', error);
      }
    }
    
  } catch (error) {
    console.error('Error fetching UK National Parks data:', error);
  }
  
  return {
    containing,
    nearby_features,
    _all
  };
}

