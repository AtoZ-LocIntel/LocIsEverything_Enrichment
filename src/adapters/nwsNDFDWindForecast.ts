import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NDFD_WindForecast_v1/FeatureServer';

export interface NWSNDFDWindForecastInfo {
  objectId: number;
  attributes: Record<string, any>;
  geometry: any; // ESRI geometry (point)
  lat?: number;
  lon?: number;
  distance?: number;
  containing?: boolean; // True if point is at location
  layerId: number;
  layerName: string;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query NWS NDFD Wind Forecast for proximity
 * Supports proximity queries up to 25 miles
 */
export async function getNWSNDFDWindForecastData(
  lat: number,
  lon: number,
  layerId: number,
  layerName: string,
  radiusMiles?: number
): Promise<NWSNDFDWindForecastInfo[]> {
  try {
    // Cap radius at 10 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 10.0) : 10.0;
    
    const results: NWSNDFDWindForecastInfo[] = [];
    const serviceUrl = `${BASE_SERVICE_URL}/${layerId}`;
    
    if (maxRadius <= 0) {
      return [];
    }
    
    // Proximity query - use standard approach like other point layers
    try {
      const radiusMeters = maxRadius * 1609.34;
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
        const proximityUrl = `${serviceUrl}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        
        if (resultOffset === 0) {
          console.log(`💨 Querying NWS ${layerName} (Layer ${layerId}) for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          console.log(`🔗 NWS NDFD Wind Forecast Proximity Query URL: ${proximityUrl}`);
        }
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityData.error) {
          console.error(`❌ NWS ${layerName} Proximity API Error:`, proximityData.error);
          if (resultOffset === 0) {
            console.error(`❌ Full error details:`, JSON.stringify(proximityData.error, null, 2));
          }
          break;
        }
        
        if (!proximityData.features || proximityData.features.length === 0) {
          hasMore = false;
          break;
        }
        
        allFeatures.push(...proximityData.features);
        console.log(`💨 Batch ${resultOffset / batchSize + 1}: Added ${proximityData.features.length} features (total: ${allFeatures.length}), exceededTransferLimit: ${proximityData.exceededTransferLimit}`);
        
        // Continue if we hit the transfer limit or got a full batch
        if (proximityData.exceededTransferLimit === true || proximityData.features.length === batchSize) {
          resultOffset += batchSize;
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }
      
      console.log(`✅ Fetched ${allFeatures.length} total NWS ${layerName} features for proximity`);
      console.log(`💨 Sample feature structure:`, allFeatures.length > 0 ? JSON.stringify(allFeatures[0], null, 2) : 'No features');
      
      // Process all features
      allFeatures.forEach((feature: any, featureIndex: number) => {
        const attrs = feature.attributes || {};
        const geom = feature.geometry;
        
        if (!geom) {
          console.warn(`💨 Feature ${featureIndex} has no geometry`);
          return;
        }
        
        // Handle multipoint geometry (points array)
        if (geom.points && Array.isArray(geom.points) && geom.points.length > 0) {
          console.log(`💨 Feature ${featureIndex} has ${geom.points.length} point(s) in multipoint`);
          // Process each point in the multipoint
          geom.points.forEach((point: number[], pointIndex: number) => {
            if (point && point.length >= 2) {
              let pointLon = point[0];
              let pointLat = point[1];
              
              console.log(`💨 Processing point ${pointIndex}: [${pointLon}, ${pointLat}] (Web Mercator)`);
              
              // Coordinates are in Web Mercator (3857) - convert to WGS84
              const isWebMercator = Math.abs(pointLon) > 180 || Math.abs(pointLat) > 90;
              
              if (isWebMercator) {
                // Convert from Web Mercator to WGS84
                pointLon = (pointLon / 20037508.34) * 180;
                let mercLat = (pointLat / 20037508.34) * 180;
                pointLat = 180 / Math.PI * (2 * Math.atan(Math.exp(mercLat * Math.PI / 180)) - Math.PI / 2);
                console.log(`💨 Converted to WGS84: [${pointLon}, ${pointLat}]`);
              }
              
              // Calculate distance for display purposes
              const distance = haversineDistance(lat, lon, pointLat, pointLon);
              console.log(`💨 Distance from query point: ${distance.toFixed(3)} miles (maxRadius: ${maxRadius} miles)`);
              
              // Filter by distance (bounding box query may return features outside radius)
              if (distance > maxRadius) {
                console.log(`💨 Point ${pointIndex} is outside radius (${distance.toFixed(3)} > ${maxRadius}), skipping`);
                return;
              }
              
              // Consider point as containing if very close (within 0.01 miles)
              const isContaining = distance < 0.01;
              
              const resultItem = {
                objectId: attrs.OBJECTID || attrs.objectId || 0,
                attributes: attrs,
                geometry: {
                  ...geom,
                  x: pointLon,
                  y: pointLat
                },
                lat: pointLat,
                lon: pointLon,
                distance: distance,
                containing: isContaining,
                layerId: layerId,
                layerName: layerName
              };
              
              console.log(`💨 Adding result item:`, resultItem);
              results.push(resultItem);
            } else {
              console.warn(`💨 Point ${pointIndex} in feature ${featureIndex} is invalid`);
            }
          });
        } else if (geom.x !== undefined && geom.y !== undefined) {
          // Single point geometry (fallback)
          let pointLon = geom.x;
          let pointLat = geom.y;
          
          // Check if coordinates are in Web Mercator (3857) or WGS84 (4326)
          const isWebMercator = Math.abs(pointLon) > 180 || Math.abs(pointLat) > 90;
          
          if (isWebMercator) {
            // Convert from Web Mercator to WGS84
            pointLon = (pointLon / 20037508.34) * 180;
            let mercLat = (pointLat / 20037508.34) * 180;
            pointLat = 180 / Math.PI * (2 * Math.atan(Math.exp(mercLat * Math.PI / 180)) - Math.PI / 2);
          }
          
          // Calculate distance for display purposes
          const distance = haversineDistance(lat, lon, pointLat, pointLon);
          
          // Consider point as containing if very close (within 0.01 miles)
          const isContaining = distance < 0.01;
          
          // Trust server-side spatial query - if feature is returned, it's within radius
          results.push({
            objectId: attrs.OBJECTID || attrs.objectId || 0,
            attributes: attrs,
            geometry: geom,
            lat: pointLat,
            lon: pointLon,
            distance: distance,
            containing: isContaining,
            layerId: layerId,
            layerName: layerName
          });
        } else {
          console.warn(`💨 Feature ${featureIndex} has unrecognized geometry type:`, Object.keys(geom));
        }
      });
      
      console.log(`✅ Processed ${allFeatures.length} features into ${results.length} results for NWS ${layerName}`);
    } catch (error) {
      console.error(`❌ Proximity query failed for NWS ${layerName}:`, error);
    }
    
    console.log(`✅ Found ${results.length} NWS ${layerName} feature(s) within ${maxRadius} miles`);
    console.log(`💨 Returning ${results.length} results from adapter for NWS ${layerName}`);
    if (results.length > 0) {
      console.log(`💨 Sample result structure:`, {
        objectId: results[0].objectId,
        hasLat: results[0].lat !== undefined,
        hasLon: results[0].lon !== undefined,
        hasGeometry: !!results[0].geometry,
        hasAttributes: !!results[0].attributes,
        layerId: results[0].layerId,
        layerName: results[0].layerName
      });
    }
    
    return results;
  } catch (error) {
    console.error(`❌ Error querying NWS ${layerName} data:`, error);
    return [];
  }
}

