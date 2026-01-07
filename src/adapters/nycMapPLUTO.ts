/**
 * NYC MapPLUTO Adapter
 * Queries NYC MapPLUTO (tax lots) polygonal feature service
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer';
const LAYER_ID = 0;

export interface NYCMapPLUTOInfo {
  objectId: string | null;
  borough: string | null;
  block: string | null;
  lot: string | null;
  address: string | null;
  bbl: string | null;
  zipCode: string | null;
  ownerName: string | null;
  landUse: string | null;
  yearBuilt: string | null;
  bldgClass: string | null;
  lotArea: number | null;
  bldgArea: number | null;
  numBldgs: number | null;
  numFloors: string | null;
  unitsRes: number | null;
  unitsTotal: number | null;
  assessLand: number | null;
  assessTot: number | null;
  zoneDist1: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // For point-in-polygon queries
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Helper function to fetch with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Query NYC MapPLUTO FeatureServer for point-in-polygon and proximity
 */
export async function getNYCMapPLUTOData(
  lat: number,
  lon: number,
  radius?: number,
  whereClause?: string
): Promise<NYCMapPLUTOInfo[]> {
  try {
    const results: NYCMapPLUTOInfo[] = [];
    
    // Use provided where clause or default to '1=1' (all records)
    const where = whereClause || '1=1';
    
    // Always do point-in-polygon query first
    console.log(`🏢 Querying NYC MapPLUTO for point-in-polygon at [${lat}, ${lon}]${whereClause ? ` with filter: ${whereClause}` : ''}`);
    
    const pointInPolyQueryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    pointInPolyQueryUrl.searchParams.set('f', 'json');
    pointInPolyQueryUrl.searchParams.set('where', where);
    pointInPolyQueryUrl.searchParams.set('outFields', '*');
    pointInPolyQueryUrl.searchParams.set('geometry', JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }));
    pointInPolyQueryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    pointInPolyQueryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    pointInPolyQueryUrl.searchParams.set('inSR', '4326');
    pointInPolyQueryUrl.searchParams.set('outSR', '4326');
    pointInPolyQueryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 NYC MapPLUTO Point-in-Polygon Query URL: ${pointInPolyQueryUrl.toString()}`);
    
    let pointInPolyData: any;
    try {
      const pointInPolyResponse = await fetchWithTimeout(pointInPolyQueryUrl.toString(), 30000);
      
      if (!pointInPolyResponse.ok) {
        console.error(`❌ NYC MapPLUTO HTTP error! status: ${pointInPolyResponse.status}`);
        return results; // Return empty results instead of throwing
      }
      
      pointInPolyData = await pointInPolyResponse.json();
    } catch (error: any) {
      console.error('❌ NYC MapPLUTO Point-in-Polygon fetch error:', error.message || error);
      return results; // Return empty results on fetch/parse errors
    }
    
    if (pointInPolyData.error) {
      console.error('❌ NYC MapPLUTO API Error:', pointInPolyData.error);
      // Don't throw - return empty results so the function completes
      // Continue to proximity query if radius is provided
    } else if (pointInPolyData.features && pointInPolyData.features.length > 0) {
      pointInPolyData.features.forEach((feature: any) => {
        try {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const objectId = attributes.OBJECTID || attributes.objectid || null;
          const borough = attributes.Borough || attributes.borough || null;
          const block = attributes.Block !== null && attributes.Block !== undefined ? attributes.Block.toString() : (attributes.block !== null && attributes.block !== undefined ? attributes.block.toString() : null);
          const lot = attributes.Lot !== null && attributes.Lot !== undefined ? attributes.Lot.toString() : (attributes.lot !== null && attributes.lot !== undefined ? attributes.lot.toString() : null);
          const address = attributes.Address || attributes.address || null;
          const bbl = attributes.BBL || attributes.bbl || null;
          const zipCode = attributes.ZipCode || attributes.zipCode || attributes.ZIPCODE || attributes.zipcode || null;
          const ownerName = attributes.OwnerName || attributes.ownerName || attributes.OWNERNAME || attributes.ownername || null;
          const landUse = attributes.LandUse || attributes.landUse || attributes.LANDUSE || attributes.landuse || null;
          const yearBuilt = attributes.YearBuilt !== null && attributes.YearBuilt !== undefined ? attributes.YearBuilt.toString() : (attributes.yearBuilt !== null && attributes.yearBuilt !== undefined ? attributes.yearBuilt.toString() : null);
          const bldgClass = attributes.BldgClass || attributes.bldgClass || attributes.BLDGCLASS || attributes.bldgclass || null;
          const lotArea = attributes.LotArea !== null && attributes.LotArea !== undefined ? attributes.LotArea : (attributes.lotArea !== null && attributes.lotArea !== undefined ? attributes.lotArea : null);
          const bldgArea = attributes.BldgArea !== null && attributes.BldgArea !== undefined ? attributes.BldgArea : (attributes.bldgArea !== null && attributes.bldgArea !== undefined ? attributes.bldgArea : null);
          const numBldgs = attributes.NumBldgs !== null && attributes.NumBldgs !== undefined ? attributes.NumBldgs : (attributes.numBldgs !== null && attributes.numBldgs !== undefined ? attributes.numBldgs : null);
          const numFloors = attributes.NumFloors !== null && attributes.NumFloors !== undefined ? attributes.NumFloors.toString() : (attributes.numFloors !== null && attributes.numFloors !== undefined ? attributes.numFloors.toString() : null);
          const unitsRes = attributes.UnitsRes !== null && attributes.UnitsRes !== undefined ? attributes.UnitsRes : (attributes.unitsRes !== null && attributes.unitsRes !== undefined ? attributes.unitsRes : null);
          const unitsTotal = attributes.UnitsTotal !== null && attributes.UnitsTotal !== undefined ? attributes.UnitsTotal : (attributes.unitsTotal !== null && attributes.unitsTotal !== undefined ? attributes.unitsTotal : null);
          const assessLand = attributes.AssessLand !== null && attributes.AssessLand !== undefined ? attributes.AssessLand : (attributes.assessLand !== null && attributes.assessLand !== undefined ? attributes.assessLand : null);
          const assessTot = attributes.AssessTot !== null && attributes.AssessTot !== undefined ? attributes.AssessTot : (attributes.assessTot !== null && attributes.assessTot !== undefined ? attributes.assessTot : null);
          const zoneDist1 = attributes.ZoneDist1 || attributes.zoneDist1 || attributes.ZONEDIST1 || attributes.zonedist1 || null;
          
          results.push({
            objectId: objectId ? objectId.toString() : null,
            borough,
            block,
            lot,
            address,
            bbl: bbl ? bbl.toString() : null,
            zipCode: zipCode ? zipCode.toString() : null,
            ownerName,
            landUse: landUse ? landUse.toString() : null,
            yearBuilt,
            bldgClass,
            lotArea,
            bldgArea,
            numBldgs,
            numFloors,
            unitsRes,
            unitsTotal,
            assessLand,
            assessTot,
            zoneDist1,
            attributes,
            geometry,
            distance_miles: 0,
            isContaining: true
          });
        } catch (error: any) {
          console.error('❌ Error processing NYC MapPLUTO feature:', error.message || error);
          // Continue processing other features
        }
      });
    }
    
    // If radius provided, also do proximity query
    if (radius && radius > 0) {
      console.log(`🏢 Querying NYC MapPLUTO for proximity within ${radius} miles at [${lat}, ${lon}]`);
      
      // Convert radius from miles to meters
      const radiusMeters = radius * 1609.34;
      
      const proximityQueryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
      proximityQueryUrl.searchParams.set('f', 'json');
      proximityQueryUrl.searchParams.set('where', where);
      proximityQueryUrl.searchParams.set('outFields', '*');
      proximityQueryUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      proximityQueryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      proximityQueryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      proximityQueryUrl.searchParams.set('distance', radiusMeters.toString());
      proximityQueryUrl.searchParams.set('units', 'esriSRUnit_Meter');
      proximityQueryUrl.searchParams.set('inSR', '4326');
      proximityQueryUrl.searchParams.set('outSR', '4326');
      proximityQueryUrl.searchParams.set('returnGeometry', 'true');
      
      console.log(`🔗 NYC MapPLUTO Proximity Query URL: ${proximityQueryUrl.toString()}`);
      
      let proximityData: any;
      try {
        const proximityResponse = await fetchWithTimeout(proximityQueryUrl.toString(), 30000);
        
        if (!proximityResponse.ok) {
          console.error(`❌ NYC MapPLUTO Proximity HTTP error! status: ${proximityResponse.status}`);
          // Continue and return what we have so far
        } else {
          proximityData = await proximityResponse.json();
        }
      } catch (error: any) {
        console.error('❌ NYC MapPLUTO Proximity fetch error:', error.message || error);
        // Continue and return what we have so far
        proximityData = null;
      }
      
      if (proximityData && proximityData.error) {
        console.error('❌ NYC MapPLUTO Proximity API Error:', proximityData.error);
        // Don't throw - return what we have so far
      } else if (proximityData && proximityData.features && proximityData.features.length > 0) {
        proximityData.features.forEach((feature: any) => {
          try {
            // Skip if already in results (from point-in-polygon query)
            const attributes = feature.attributes || {};
            const objectId = attributes.OBJECTID || attributes.objectid || null;
            const existingIndex = results.findIndex(r => r.objectId === (objectId ? objectId.toString() : null) && r.isContaining);
            
            if (existingIndex >= 0) {
              // Already in results from point-in-polygon, skip
              return;
            }
            
            const geometry = feature.geometry || null;
            
            // Calculate distance to polygon centroid or nearest point
            let distance = radius || 0; // Default to max radius
            if (geometry && geometry.rings && geometry.rings.length > 0) {
              try {
                // Calculate centroid of polygon
                let sumLat = 0;
                let sumLon = 0;
                let coordCount = 0;
                
                const outerRing = geometry.rings[0];
                if (outerRing && Array.isArray(outerRing)) {
                  outerRing.forEach((coord: number[]) => {
                    if (coord && Array.isArray(coord) && coord.length >= 2) {
                      sumLon += coord[0];
                      sumLat += coord[1];
                      coordCount++;
                    }
                  });
                }
                
                if (coordCount > 0) {
                  const centroidLat = sumLat / coordCount;
                  const centroidLon = sumLon / coordCount;
                  distance = calculateDistance(lat, lon, centroidLat, centroidLon);
                }
              } catch (geoError: any) {
                console.warn('⚠️ Error calculating distance for proximity feature:', geoError.message || geoError);
                // Use default distance
              }
            }
          
          const borough = attributes.Borough || attributes.borough || null;
          const block = attributes.Block !== null && attributes.Block !== undefined ? attributes.Block.toString() : (attributes.block !== null && attributes.block !== undefined ? attributes.block.toString() : null);
          const lot = attributes.Lot !== null && attributes.Lot !== undefined ? attributes.Lot.toString() : (attributes.lot !== null && attributes.lot !== undefined ? attributes.lot.toString() : null);
          const address = attributes.Address || attributes.address || null;
          const bbl = attributes.BBL || attributes.bbl || null;
          const zipCode = attributes.ZipCode || attributes.zipCode || attributes.ZIPCODE || attributes.zipcode || null;
          const ownerName = attributes.OwnerName || attributes.ownerName || attributes.OWNERNAME || attributes.ownername || null;
          const landUse = attributes.LandUse || attributes.landUse || attributes.LANDUSE || attributes.landuse || null;
          const yearBuilt = attributes.YearBuilt !== null && attributes.YearBuilt !== undefined ? attributes.YearBuilt.toString() : (attributes.yearBuilt !== null && attributes.yearBuilt !== undefined ? attributes.yearBuilt.toString() : null);
          const bldgClass = attributes.BldgClass || attributes.bldgClass || attributes.BLDGCLASS || attributes.bldgclass || null;
          const lotArea = attributes.LotArea !== null && attributes.LotArea !== undefined ? attributes.LotArea : (attributes.lotArea !== null && attributes.lotArea !== undefined ? attributes.lotArea : null);
          const bldgArea = attributes.BldgArea !== null && attributes.BldgArea !== undefined ? attributes.BldgArea : (attributes.bldgArea !== null && attributes.bldgArea !== undefined ? attributes.bldgArea : null);
          const numBldgs = attributes.NumBldgs !== null && attributes.NumBldgs !== undefined ? attributes.NumBldgs : (attributes.numBldgs !== null && attributes.numBldgs !== undefined ? attributes.numBldgs : null);
          const numFloors = attributes.NumFloors !== null && attributes.NumFloors !== undefined ? attributes.NumFloors.toString() : (attributes.numFloors !== null && attributes.numFloors !== undefined ? attributes.numFloors.toString() : null);
          const unitsRes = attributes.UnitsRes !== null && attributes.UnitsRes !== undefined ? attributes.UnitsRes : (attributes.unitsRes !== null && attributes.unitsRes !== undefined ? attributes.unitsRes : null);
          const unitsTotal = attributes.UnitsTotal !== null && attributes.UnitsTotal !== undefined ? attributes.UnitsTotal : (attributes.unitsTotal !== null && attributes.unitsTotal !== undefined ? attributes.unitsTotal : null);
          const assessLand = attributes.AssessLand !== null && attributes.AssessLand !== undefined ? attributes.AssessLand : (attributes.assessLand !== null && attributes.assessLand !== undefined ? attributes.assessLand : null);
          const assessTot = attributes.AssessTot !== null && attributes.AssessTot !== undefined ? attributes.AssessTot : (attributes.assessTot !== null && attributes.assessTot !== undefined ? attributes.assessTot : null);
            const zoneDist1 = attributes.ZoneDist1 || attributes.zoneDist1 || attributes.ZONEDIST1 || attributes.zonedist1 || null;
            
            results.push({
              objectId: objectId ? objectId.toString() : null,
              borough,
              block,
              lot,
              address,
              bbl: bbl ? bbl.toString() : null,
              zipCode: zipCode ? zipCode.toString() : null,
              ownerName,
              landUse: landUse ? landUse.toString() : null,
              yearBuilt,
              bldgClass,
              lotArea,
              bldgArea,
              numBldgs,
              numFloors,
              unitsRes,
              unitsTotal,
              assessLand,
              assessTot,
              zoneDist1,
              attributes,
              geometry,
              distance_miles: distance,
              isContaining: false
            });
          } catch (error: any) {
            console.error('❌ Error processing NYC MapPLUTO proximity feature:', error.message || error);
            // Continue processing other features
          }
        });
      }
    }
    
    console.log(`✅ NYC MapPLUTO: Found ${results.length} tax lot(s)`);
    return results;
  } catch (error: any) {
    console.error('❌ Error querying NYC MapPLUTO data:', error.message || error);
    // Return empty array instead of throwing to ensure function always completes
    return [];
  }
}

