/**
 * Nationwide Rivers Inventory (NRI) Adapter
 * Queries NRI FeatureServer for free-flowing river segments with outstandingly remarkable values
 * Supports proximity queries up to 50 miles
 * API: https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/Nationwide_Rivers_Inventory_Official/FeatureServer/0
 */

import { fetchJSONSmart } from '../services/EnrichmentService';

const BASE_SERVICE_URL = 'https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/Nationwide_Rivers_Inventory_Official/FeatureServer/0';

export interface NRIRiverInfo {
  nriId: string | null;
  river: string | null;
  reach: string | null;
  originalMiles: number | null;
  gisMiles: number | null;
  classification: string | null;
  managementAreaName: string | null;
  gnisName: string | null;
  description: string | null;
  state1: string | null;
  county: string | null;
  orv: string | null; // Outstandingly Remarkable Values
  managementEntityFed1: string | null;
  watershedName6: string | null;
  hucCode6: string | null;
  watershedName8: string | null;
  hucCode8: string | null;
  yrListed: number | null;
  yrUpdated: number | null;
  geometry: any; // ESRI polyline geometry for drawing on map
  distance_miles?: number;
  attributes: Record<string, any>;
}

/**
 * Calculate distance from a point to the nearest point on a polyline
 */
function calculateDistanceToPolyline(lat: number, lon: number, paths: number[][][]): number {
  let minDistance = Infinity;
  
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      // Calculate distance from point to line segment
      const dist = pointToLineSegmentDistance(lat, lon, p1[1], p1[0], p2[1], p2[0]);
      minDistance = Math.min(minDistance, dist);
    }
  }
  
  return minDistance;
}

/**
 * Calculate distance from a point to a line segment using perpendicular distance
 */
function pointToLineSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx: number, yy: number;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  
  return haversineDistance(py, px, yy, xx);
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
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
 * Query NRI FeatureServer for proximity search
 * Returns river segments within the specified radius (in miles)
 */
export async function getNRIRiversData(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<NRIRiverInfo[]> {
  try {
    console.log(`🌊 Querying NRI Rivers within ${radiusMiles} miles of [${lat}, ${lon}]`);
    
    // Cap radius at 50 miles
    const cappedRadius = Math.min(radiusMiles, 50.0);
    
    // Convert miles to meters for the buffer distance
    const radiusMeters = cappedRadius * 1609.34;
    
    // Build geometry point for proximity query
    const geometry = {
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    };
    
    const allFeatures: any[] = [];
    let resultOffset = 0;
    const batchSize = 2000; // ESRI FeatureServer max per request
    let hasMore = true;
    
    // Fetch all results in batches
    while (hasMore) {
      const geometryStr = encodeURIComponent(JSON.stringify(geometry));
      const queryUrl = `${BASE_SERVICE_URL}/query?f=json&where=1%3D1&outFields=*&geometry=${geometryStr}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
      
      if (resultOffset === 0) {
        console.log(`🔗 NRI Rivers Query URL: ${queryUrl.substring(0, 200)}...`);
      }
      
      const data = await fetchJSONSmart(queryUrl) as any;
      
      if (data.error) {
        console.error('❌ NRI Rivers API Error:', data.error);
        break;
      }
      
      if (!data.features || data.features.length === 0) {
        if (resultOffset === 0) {
          console.log(`ℹ️ No NRI Rivers found within ${cappedRadius} miles`);
        }
        hasMore = false;
        break;
      }
      
      allFeatures.push(...data.features);
      
      // Check if there are more results
      if (data.exceededTransferLimit || data.features.length === batchSize) {
        resultOffset += batchSize;
        console.log(`📊 NRI Rivers: Fetched ${allFeatures.length} features so far, continuing...`);
      } else {
        hasMore = false;
      }
    }
    
    if (allFeatures.length === 0) {
      return [];
    }
    
    console.log(`📊 NRI Rivers: Processing ${allFeatures.length} features`);
    
    // Process features and calculate distance to nearest point on polyline
    const rivers: NRIRiverInfo[] = allFeatures.map((feature: any) => {
      const attrs = feature.attributes || {};
      const geom = feature.geometry;
      
      // Calculate distance to nearest point on polyline
      let distance = Infinity;
      if (geom && geom.paths && Array.isArray(geom.paths)) {
        distance = calculateDistanceToPolyline(lat, lon, geom.paths);
      }
      
      return {
        nriId: attrs.NRI_ID || attrs.nri_id || null,
        river: attrs.River || attrs.river || null,
        reach: attrs.Reach || attrs.reach || null,
        originalMiles: attrs.Original_Miles !== null && attrs.Original_Miles !== undefined ? parseFloat(attrs.Original_Miles) : null,
        gisMiles: attrs.GIS_Miles !== null && attrs.GIS_Miles !== undefined ? parseFloat(attrs.GIS_Miles) : null,
        classification: attrs.Classification || attrs.classification || null,
        managementAreaName: attrs.Management_Area_Name || attrs.management_area_name || null,
        gnisName: attrs.GNIS_Name || attrs.gnis_name || null,
        description: attrs.Description || attrs.description || null,
        state1: attrs.State1 || attrs.state1 || null,
        county: attrs.County || attrs.county || null,
        orv: attrs.ORV || attrs.orv || null,
        managementEntityFed1: attrs.Management_Entity_Fed1 || attrs.management_entity_fed1 || null,
        watershedName6: attrs.Watershed_Name6 || attrs.watershed_name6 || null,
        hucCode6: attrs.HUC_Code6 || attrs.huc_code6 || null,
        watershedName8: attrs.Watershed_Name8 || attrs.watershed_name8 || null,
        hucCode8: attrs.HUC_Code8 || attrs.huc_code8 || null,
        yrListed: attrs.YR_Listed !== null && attrs.YR_Listed !== undefined ? parseInt(attrs.YR_Listed) : null,
        yrUpdated: attrs.YR_Updated !== null && attrs.YR_Updated !== undefined ? parseInt(attrs.YR_Updated) : null,
        geometry: geom,
        distance_miles: distance !== Infinity ? Number(distance.toFixed(2)) : undefined,
        attributes: attrs
      };
    }).filter((river: NRIRiverInfo) => {
      // Filter by actual distance (within radius)
      return river.distance_miles !== undefined && river.distance_miles <= cappedRadius;
    }).sort((a: NRIRiverInfo, b: NRIRiverInfo) => {
      // Sort by distance
      const distA = a.distance_miles || Infinity;
      const distB = b.distance_miles || Infinity;
      return distA - distB;
    });
    
    console.log(`✅ NRI Rivers: Found ${rivers.length} rivers within ${cappedRadius} miles`);
    
    return rivers;
    
  } catch (error) {
    console.error('❌ NRI Rivers query failed:', error);
    return [];
  }
}

