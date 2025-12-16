import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services3.arcgis.com/HESxeTbDliKKvec2/arcgis/rest/services/LakeCounty_Planimetrics/FeatureServer/1';

export interface LakeCountyBuildingFootprintInfo {
  objectId: number;
  buildingClass: number;
  featureCode: string;
  shapeArea: number;
  shapeLength: number;
  geometry: any; // ESRI polygon geometry
  lat?: number;
  lon?: number;
  distance?: number;
  containing?: boolean; // True if point is within polygon
  attributes: Record<string, any>;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  if (!rings || rings.length === 0) return false;
  
  const outerRing = rings[0];
  let inside = false;
  
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0];
    const yi = outerRing[i][1];
    const xj = outerRing[j][0];
    const yj = outerRing[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate distance from point to nearest edge of polygon
 */
function distanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  if (!rings || rings.length === 0) return Infinity;
  
  // Check if point is inside polygon
  if (pointInPolygon(lat, lon, rings)) {
    return 0;
  }
  
  // Calculate distance to nearest edge
  let minDistance = Infinity;
  const outerRing = rings[0];
  
  for (let i = 0; i < outerRing.length; i++) {
    const j = (i + 1) % outerRing.length;
    const x1 = outerRing[i][0];
    const y1 = outerRing[i][1];
    const x2 = outerRing[j][0];
    const y2 = outerRing[j][1];
    
    const dist = distanceToLineSegment(lon, lat, x1, y1, x2, y2);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }
  
  return minDistance;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  
  if (lengthSquared === 0) {
    // Line segment is a point
    const dx2 = px - x1;
    const dy2 = py - y1;
    return Math.sqrt(dx2 * dx2 + dy2 * dy2) * 69; // Convert to miles (approximate)
  }
  
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  
  const dx2 = px - projX;
  const dy2 = py - projY;
  const distanceDegrees = Math.sqrt(dx2 * dx2 + dy2 * dy2);
  
  // Convert degrees to miles (approximate at this latitude)
  return distanceDegrees * 69;
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
 * Query Lake County Building Footprints for point-in-polygon and proximity
 * Supports proximity queries up to 1 mile
 */
export async function getLakeCountyBuildingFootprintsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<LakeCountyBuildingFootprintInfo[]> {
  try {
    // Cap radius at 1 mile
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 1.0) : 1.0;
    
    const results: LakeCountyBuildingFootprintInfo[] = [];
    
    // Point-in-polygon query first
    try {
      const pointGeometry = {
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      };
      
      const pointInPolyUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&returnGeometry=true`;
      
      console.log(`🏢 Querying Lake County Building Footprints for point-in-polygon at [${lat}, ${lon}]`);
      
      const pointInPolyData = await fetchJSONSmart(pointInPolyUrl) as any;
      
      if (!pointInPolyData.error && pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const rings = feature.geometry?.rings;
          if (rings && pointInPolygon(lat, lon, rings)) {
            const centroid = calculateCentroid(rings);
            results.push({
              objectId: feature.attributes.OBJECTID || feature.attributes.objectId || 0,
              buildingClass: feature.attributes.BuildingClass || feature.attributes.buildingClass || 0,
              featureCode: feature.attributes.FeatureCode || feature.attributes.featureCode || 'Building General',
              shapeArea: feature.attributes.Shape__Area || feature.attributes.shapeArea || 0,
              shapeLength: feature.attributes.Shape__Length || feature.attributes.shapeLength || 0,
              geometry: feature.geometry,
              lat: centroid?.lat,
              lon: centroid?.lon,
              distance: 0,
              containing: true,
              attributes: feature.attributes
            });
          }
        });
        
        console.log(`✅ Found ${results.length} Lake County Building Footprint(s) containing the point`);
      }
    } catch (error) {
      console.error(`❌ Point-in-polygon query failed:`, error);
    }
    
    // Proximity query (if radius is provided)
    if (maxRadius > 0) {
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
          const proximityUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
          
          if (resultOffset === 0) {
            console.log(`🏢 Querying Lake County Building Footprints for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
          }
          
          const proximityData = await fetchJSONSmart(proximityUrl) as any;
          
          if (proximityData.error) {
            console.error('❌ Lake County Building Footprints API Error:', proximityData.error);
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
        
        console.log(`✅ Fetched ${allFeatures.length} total Lake County Building Footprints for proximity`);
        
        // Process proximity features
        allFeatures.forEach((feature: any) => {
          const rings = feature.geometry?.rings;
          if (!rings) return;
          
          // Check if already added as containing feature
          const objectId = feature.attributes.OBJECTID || feature.attributes.objectId || 0;
          const alreadyAdded = results.some(r => r.objectId === objectId && r.containing);
          
          if (!alreadyAdded) {
            const distance = distanceToPolygon(lat, lon, rings);
            const centroid = calculateCentroid(rings);
            
            if (distance <= maxRadius) {
              results.push({
                objectId: objectId,
                buildingClass: feature.attributes.BuildingClass || feature.attributes.buildingClass || 0,
                featureCode: feature.attributes.FeatureCode || feature.attributes.featureCode || 'Building General',
                shapeArea: feature.attributes.Shape__Area || feature.attributes.shapeArea || 0,
                shapeLength: feature.attributes.Shape__Length || feature.attributes.shapeLength || 0,
                geometry: feature.geometry,
                lat: centroid?.lat,
                lon: centroid?.lon,
                distance: distance,
                containing: false,
                attributes: feature.attributes
              });
            }
          }
        });
        
        console.log(`✅ Found ${results.filter(r => !r.containing).length} Lake County Building Footprint(s) within ${maxRadius} miles`);
      } catch (error) {
        console.error(`❌ Proximity query failed:`, error);
      }
    }
    
    // Sort by containing first, then by distance
    results.sort((a, b) => {
      if (a.containing && !b.containing) return -1;
      if (!a.containing && b.containing) return 1;
      return (a.distance || 0) - (b.distance || 0);
    });
    
    return results;
  } catch (error) {
    console.error('❌ Error querying Lake County Building Footprints data:', error);
    return [];
  }
}

