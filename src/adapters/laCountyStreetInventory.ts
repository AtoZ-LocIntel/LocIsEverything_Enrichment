/**
 * LA County Street Inventory Adapter
 * Queries LA County StreetsLA GeoHub Street Inventory (linear feature service)
 * Supports proximity queries (max 5 miles)
 */

const BASE_SERVICE_URL = 'https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/StreetsLA_GeoHub_Street_Inventory/FeatureServer';
const LAYER_ID = 0;

export interface LACountyStreetInventoryInfo {
  streetId: string | null;
  sectId: string | null;
  streetName: string | null;
  streetDir: string | null;
  streetType: string | null;
  streetFrom: string | null;
  streetTo: string | null;
  streetSurface: string | null;
  streetLength: number | null;
  streetWidth: number | null;
  pciStatus: string | null;
  ncName: string | null;
  shapeLength: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query LA County Street Inventory FeatureServer for proximity
 */
export async function getLACountyStreetInventoryData(
  lat: number,
  lon: number,
  radius?: number
): Promise<LACountyStreetInventoryInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log(`ℹ️ LA County Street Inventory requires a radius for proximity query`);
      return [];
    }
    
    // Cap radius at 5 miles
    const cappedRadius = Math.min(radius, 5.0);
    
    console.log(`🛣️ Querying LA County Street Inventory within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    const radiusMeters = cappedRadius * 1609.34;
    
    const queryUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    queryUrl.searchParams.set('f', 'json');
    queryUrl.searchParams.set('where', '1=1');
    queryUrl.searchParams.set('outFields', '*');
    queryUrl.searchParams.set('geometry', JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }));
    queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    queryUrl.searchParams.set('distance', radiusMeters.toString());
    queryUrl.searchParams.set('units', 'esriSRUnit_Meter');
    queryUrl.searchParams.set('inSR', '4326');
    queryUrl.searchParams.set('outSR', '4326');
    queryUrl.searchParams.set('returnGeometry', 'true');
    
    console.log(`🔗 LA County Street Inventory Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ LA County Street Inventory API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No LA County Street Inventory segments found within the specified radius');
      return [];
    }
    
    const results: LACountyStreetInventoryInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const streetId = attributes.OBJECTID || 
                      attributes.objectid || 
                      attributes.GlobalID ||
                      attributes.GLOBALID ||
                      null;
      
      // Extract street information
      const sectId = attributes.SECT_ID !== null && attributes.SECT_ID !== undefined 
                   ? attributes.SECT_ID.toString()
                   : (attributes.sect_id !== null && attributes.sect_id !== undefined
                      ? attributes.sect_id.toString()
                      : null);
      
      const streetName = attributes.ST_NAME || 
                        attributes.st_name ||
                        attributes.StName ||
                        attributes.NAME ||
                        attributes.name ||
                        null;
      
      const streetDir = attributes.ST_DIR || 
                       attributes.st_dir ||
                       attributes.StDir ||
                       attributes.DIR ||
                       attributes.dir ||
                       null;
      
      const streetType = attributes.ST_TYPE || 
                        attributes.st_type ||
                        attributes.StType ||
                        attributes.TYPE ||
                        attributes.type ||
                        null;
      
      const streetFrom = attributes.ST_FROM || 
                        attributes.st_from ||
                        attributes.StFrom ||
                        attributes.FROM ||
                        attributes.from ||
                        null;
      
      const streetTo = attributes.ST_TO || 
                      attributes.st_to ||
                      attributes.StTo ||
                      attributes.TO ||
                      attributes.to ||
                      null;
      
      const streetSurface = attributes.ST_SURFACE || 
                           attributes.st_surface ||
                           attributes.StSurface ||
                           attributes.SURFACE ||
                           attributes.surface ||
                           null;
      
      const streetLength = attributes.ST_LENGTH !== null && attributes.ST_LENGTH !== undefined 
                          ? parseFloat(attributes.ST_LENGTH.toString())
                          : (attributes.st_length !== null && attributes.st_length !== undefined
                             ? parseFloat(attributes.st_length.toString())
                             : null);
      
      const streetWidth = attributes.ST_WIDTH !== null && attributes.ST_WIDTH !== undefined 
                         ? parseFloat(attributes.ST_WIDTH.toString())
                         : (attributes.st_width !== null && attributes.st_width !== undefined
                            ? parseFloat(attributes.st_width.toString())
                            : null);
      
      const pciStatus = attributes.PCI_STATUS || 
                       attributes.pci_status ||
                       attributes.PciStatus ||
                       attributes.STATUS ||
                       attributes.status ||
                       null;
      
      const ncName = attributes.NC_NAME || 
                    attributes.nc_name ||
                    attributes.NcName ||
                    attributes.NCNAME ||
                    attributes.ncname ||
                    null;
      
      const shapeLength = attributes.Shape__Length !== null && attributes.Shape__Length !== undefined 
                         ? parseFloat(attributes.Shape__Length.toString())
                         : (attributes.shape_length !== null && attributes.shape_length !== undefined
                            ? parseFloat(attributes.shape_length.toString())
                            : null);
      
      // Calculate distance from point to nearest point on polyline
      let distance_miles = cappedRadius; // Default to max radius
      
      if (geometry && geometry.paths) {
        // Find minimum distance to any point on any path of the polyline
        let minDistance = Infinity;
        geometry.paths.forEach((path: number[][]) => {
          path.forEach((coord: number[]) => {
            const R = 3959; // Earth radius in miles
            const dLat = (lat - coord[1]) * Math.PI / 180;
            const dLon = (lon - coord[0]) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(coord[1] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            if (distance < minDistance) minDistance = distance;
          });
        });
        distance_miles = minDistance;
      }
      
      // Only include streets within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          streetId: streetId ? streetId.toString() : null,
          sectId,
          streetName,
          streetDir,
          streetType,
          streetFrom,
          streetTo,
          streetSurface,
          streetLength,
          streetWidth,
          pciStatus,
          ncName,
          shapeLength,
          attributes,
          geometry,
          distance_miles: Number(distance_miles.toFixed(2))
        });
      }
    });
    
    // Sort by distance (closest first)
    results.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${results.length} LA County Street Inventory segment(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying LA County Street Inventory:', error);
    return [];
  }
}

