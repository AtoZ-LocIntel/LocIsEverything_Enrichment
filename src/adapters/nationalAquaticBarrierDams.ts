/**
 * National Aquatic Barrier Dam Inventory Adapter
 * Queries National Aquatic Barrier Dam Inventory points from ArcGIS FeatureServer
 * Supports proximity queries up to 25 miles
 * Layer: National_Aquatic_Barrier_Inventory_Dams_06272024 (Layer 0) - Points
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/QVENGdaPbd4LUkLV/arcgis/rest/services/Dams_National_Aquatic_Barrier_Inventory_Dec_2023/FeatureServer';
const LAYER_ID = 0;

export interface NationalAquaticBarrierDamInfo {
  objectid: number | null;
  barrierName: string | null;
  otherBarrierName: string | null;
  stateAbbreviation: string | null;
  county: string | null;
  river: string | null;
  height: number | null;
  width: number | null;
  length: number | null;
  yearCompleted: number | null;
  structureCategory: number | null;
  structureClass: number | null;
  purposeCategory: number | null;
  lat: number | null;
  lon: number | null;
  distance_miles?: number;
  attributes: Record<string, any>;
}

/**
 * Calculate Haversine distance between two points
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Query National Aquatic Barrier Dam Inventory for proximity
 * Supports proximity queries up to 25 miles
 */
export async function getNationalAquaticBarrierDamsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<NationalAquaticBarrierDamInfo[]> {
  try {
    const { fetchJSONSmart } = await import('../services/EnrichmentService');
    
    // Cap radius at 25 miles
    const maxRadius = radiusMiles ? Math.min(radiusMiles, 25.0) : 25.0;
    
    if (maxRadius <= 0) {
      return [];
    }
    
    const results: NationalAquaticBarrierDamInfo[] = [];
    const processedIds = new Set<number>();
    
    // Proximity query with pagination
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
        const proximityUrl = `${BASE_SERVICE_URL}/${LAYER_ID}/query?f=json&where=1%3D1&outFields=*&geometry=${encodeURIComponent(JSON.stringify(proximityGeometry))}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&distance=${radiusMeters}&units=esriSRUnit_Meter&inSR=4326&outSR=4326&returnGeometry=true&resultRecordCount=${batchSize}&resultOffset=${resultOffset}`;
        
        if (resultOffset === 0) {
          console.log(`🏗️ Querying National Aquatic Barrier Dam Inventory for proximity (${maxRadius} miles) at [${lat}, ${lon}]`);
        }
        
        const proximityData = await fetchJSONSmart(proximityUrl) as any;
        
        if (proximityData.error) {
          console.error('❌ National Aquatic Barrier Dam Inventory API Error:', proximityData.error);
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
      
      console.log(`✅ Fetched ${allFeatures.length} total National Aquatic Barrier Dam Inventory features for proximity`);
      
      // Process all features and calculate accurate distances
      allFeatures.forEach((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || {};
        
        const objectid = attributes.OBJECTID !== null && attributes.OBJECTID !== undefined ? attributes.OBJECTID : null;
        
        if (objectid === null || processedIds.has(objectid)) {
          return;
        }
        
        // Extract coordinates from point geometry
        const featureLat = geometry.y !== null && geometry.y !== undefined ? geometry.y : null;
        const featureLon = geometry.x !== null && geometry.x !== undefined ? geometry.x : null;
        
        if (featureLat === null || featureLon === null) {
          return;
        }
        
        // Calculate Haversine distance
        const distance = haversineDistance(lat, lon, featureLat, featureLon);
        
        // Only include features within the specified radius
        if (distance <= maxRadius) {
          const barrierName = attributes.Barrier_Name || attributes.barrier_name || attributes.BarrierName || null;
          const otherBarrierName = attributes.Other_Barrier_Name || attributes.other_barrier_name || attributes.OtherBarrierName || null;
          const stateAbbreviation = attributes.StateAbbreviation || attributes.state_abbreviation || attributes.stateAbbreviation || null;
          const county = attributes.COUNTY || attributes.county || attributes.County || null;
          const river = attributes.RIVER || attributes.river || attributes.River || null;
          const height = attributes.HEIGHT !== null && attributes.HEIGHT !== undefined ? attributes.HEIGHT : null;
          const width = attributes.WIDTH !== null && attributes.WIDTH !== undefined ? attributes.WIDTH : null;
          const length = attributes.LENGTH !== null && attributes.LENGTH !== undefined ? attributes.LENGTH : null;
          const yearCompleted = attributes.YEAR_COMPLETED !== null && attributes.YEAR_COMPLETED !== undefined ? attributes.YEAR_COMPLETED : null;
          const structureCategory = attributes.StructureCategory !== null && attributes.StructureCategory !== undefined ? attributes.StructureCategory : null;
          const structureClass = attributes.StructureClass !== null && attributes.StructureClass !== undefined ? attributes.StructureClass : null;
          const purposeCategory = attributes.PurposeCategory !== null && attributes.PurposeCategory !== undefined ? attributes.PurposeCategory : null;
          
          results.push({
            objectid: objectid,
            barrierName: barrierName,
            otherBarrierName: otherBarrierName,
            stateAbbreviation: stateAbbreviation,
            county: county,
            river: river,
            height: height,
            width: width,
            length: length,
            yearCompleted: yearCompleted,
            structureCategory: structureCategory,
            structureClass: structureClass,
            purposeCategory: purposeCategory,
            lat: featureLat,
            lon: featureLon,
            distance_miles: distance,
            attributes: attributes
          });
          
          processedIds.add(objectid);
        }
      });
      
      // Sort by distance
      results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
      
      console.log(`✅ Found ${results.length} National Aquatic Barrier Dam(s) within ${maxRadius} miles`);
    } catch (error) {
      console.error('❌ Proximity query failed for National Aquatic Barrier Dam Inventory:', error);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error querying National Aquatic Barrier Dam Inventory data:', error);
    return [];
  }
}

