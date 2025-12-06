/**
 * CA Solar Footprints Adapter
 * Queries California Solar Footprints (polygonal feature service)
 * Supports proximity queries
 */

const BASE_SERVICE_URL = 'https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Solar_Footprints_V2/FeatureServer';
const LAYER_ID = 0;

export interface CASolarFootprintInfo {
  footprintId: string | null;
  countyName: string | null;
  acres: number | null;
  type: string | null;
  urbanRural: string | null;
  combinedClass: string | null;
  distSubGTET100Miles: number | null;
  percentileGTET100Miles: string | null;
  nameSubGTET100: string | null;
  hifldIdSubGTET100: string | null;
  distSubGTET200Miles: number | null;
  percentileGTET200Miles: string | null;
  nameSubGTET200: string | null;
  hifldIdSubGTET200: string | null;
  distSubCAISOMiles: number | null;
  percentileGTETCAISOMiles: string | null;
  nameSubCASIO: string | null;
  hifldIdSubCAISO: string | null;
  solarTechnoeconomicIntersec: string | null;
  shapeArea: number | null;
  shapeLength: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
  isContaining?: boolean; // For point-in-polygon queries
}

/**
 * Query CA Solar Footprints FeatureServer for proximity
 */
export async function getCASolarFootprintsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CASolarFootprintInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log('ℹ️ CA Solar Footprints requires a radius for proximity query');
      return [];
    }
    
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radius, 25.0);
    
    console.log(`☀️ Querying CA Solar Footprints within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CA Solar Footprints Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA Solar Footprints API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA Solar Footprints found within the specified radius');
      return [];
    }
    
    const results: CASolarFootprintInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const footprintId = attributes.OBJECTID || 
                          attributes.objectid || 
                          attributes.GlobalID ||
                          attributes.GLOBALID ||
                          null;
      
      // Extract footprint information
      const countyName = attributes.COUNTYNAME || 
                        attributes.countyName ||
                        attributes.CountyName ||
                        attributes.COUNTY ||
                        attributes.county ||
                        null;
      
      const acres = attributes.Acres !== null && attributes.Acres !== undefined 
                   ? parseFloat(attributes.Acres.toString())
                   : (attributes.acres !== null && attributes.acres !== undefined
                      ? parseFloat(attributes.acres.toString())
                      : null);
      
      const type = attributes.Type || 
                  attributes.type ||
                  attributes.TYPE ||
                  null;
      
      const urbanRural = attributes.Urban_Rural || 
                        attributes.urban_rural ||
                        attributes.UrbanRural ||
                        attributes.URBAN_RURAL ||
                        null;
      
      const combinedClass = attributes.Combined_Class || 
                           attributes.combined_class ||
                           attributes.CombinedClass ||
                           attributes.COMBINED_CLASS ||
                           null;
      
      const distSubGTET100Miles = attributes.Dist_Sub_GTET_100_Miles !== null && attributes.Dist_Sub_GTET_100_Miles !== undefined 
                                  ? parseFloat(attributes.Dist_Sub_GTET_100_Miles.toString())
                                  : (attributes.dist_sub_gte_100_miles !== null && attributes.dist_sub_gte_100_miles !== undefined
                                     ? parseFloat(attributes.dist_sub_gte_100_miles.toString())
                                     : null);
      
      const percentileGTET100Miles = attributes.Precentile_GTET_100_Miles || 
                                    attributes.precentile_gte_100_miles ||
                                    attributes.PercentileGTET100Miles ||
                                    null;
      
      const nameSubGTET100 = attributes.Name_Sub_GTET_100 || 
                             attributes.name_sub_gte_100 ||
                             attributes.NameSubGTET100 ||
                             null;
      
      const hifldIdSubGTET100 = attributes.HIFLD_ID_Sub_GTET_100 || 
                                attributes.hifld_id_sub_gte_100 ||
                                attributes.HifldIdSubGTET100 ||
                                null;
      
      const distSubGTET200Miles = attributes.Dist_Sub_GTET_200_Miles !== null && attributes.Dist_Sub_GTET_200_Miles !== undefined 
                                  ? parseFloat(attributes.Dist_Sub_GTET_200_Miles.toString())
                                  : (attributes.dist_sub_gte_200_miles !== null && attributes.dist_sub_gte_200_miles !== undefined
                                     ? parseFloat(attributes.dist_sub_gte_200_miles.toString())
                                     : null);
      
      const percentileGTET200Miles = attributes.Precentile_GTET_200_Miles || 
                                     attributes.precentile_gte_200_miles ||
                                     attributes.PercentileGTET200Miles ||
                                     null;
      
      const nameSubGTET200 = attributes.Name_Sub_GTET_200 || 
                            attributes.name_sub_gte_200 ||
                            attributes.NameSubGTET200 ||
                            null;
      
      const hifldIdSubGTET200 = attributes.HIFLD_ID_Sub_GTET_200 || 
                               attributes.hifld_id_sub_gte_200 ||
                               attributes.HifldIdSubGTET200 ||
                               null;
      
      const distSubCAISOMiles = attributes.Dist_Sub_CAISO_Miles !== null && attributes.Dist_Sub_CAISO_Miles !== undefined 
                               ? parseFloat(attributes.Dist_Sub_CAISO_Miles.toString())
                               : (attributes.dist_sub_caiso_miles !== null && attributes.dist_sub_caiso_miles !== undefined
                                  ? parseFloat(attributes.dist_sub_caiso_miles.toString())
                                  : null);
      
      const percentileGTETCAISOMiles = attributes.Precentile_GTET_CAISO_Miles || 
                                       attributes.precentile_gte_caiso_miles ||
                                       attributes.PercentileGTETCAISOMiles ||
                                       null;
      
      const nameSubCASIO = attributes.Name_Sub_CASIO || 
                          attributes.name_sub_casio ||
                          attributes.NameSubCASIO ||
                          null;
      
      const hifldIdSubCAISO = attributes.HIFLD_ID_Sub_CAISO || 
                             attributes.hifld_id_sub_caiso ||
                             attributes.HifldIdSubCAISO ||
                             null;
      
      const solarTechnoeconomicIntersec = attributes.Solar_Technoeconomic_Intersec || 
                                         attributes.solar_technoeconomic_intersec ||
                                         attributes.SolarTechnoeconomicIntersec ||
                                         null;
      
      const shapeArea = attributes.Shape__Area !== null && attributes.Shape__Area !== undefined 
                       ? parseFloat(attributes.Shape__Area.toString())
                       : (attributes.shape_area !== null && attributes.shape_area !== undefined
                          ? parseFloat(attributes.shape_area.toString())
                          : null);
      
      const shapeLength = attributes.Shape__Length !== null && attributes.Shape__Length !== undefined 
                         ? parseFloat(attributes.Shape__Length.toString())
                         : (attributes.shape_length !== null && attributes.shape_length !== undefined
                            ? parseFloat(attributes.shape_length.toString())
                            : null);
      
      // Calculate distance from point to polygon centroid or nearest edge
      let distance_miles = cappedRadius; // Default to max radius
      let isContaining = false;
      
      if (geometry && geometry.rings) {
        // Check if point is inside polygon (point-in-polygon)
        const rings = geometry.rings;
        if (rings && rings.length > 0) {
          const outerRing = rings[0];
          let inside = false;
          for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
            const xi = outerRing[i][0], yi = outerRing[i][1];
            const xj = outerRing[j][0], yj = outerRing[j][1];
            const intersect = ((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
          }
          
          if (inside) {
            isContaining = true;
            distance_miles = 0;
          } else {
            // Calculate distance to nearest point on polygon
            let minDistance = Infinity;
            outerRing.forEach((coord: number[]) => {
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
            distance_miles = minDistance;
          }
        }
      }
      
      // Only include footprints within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          footprintId: footprintId ? footprintId.toString() : null,
          countyName,
          acres,
          type,
          urbanRural,
          combinedClass,
          distSubGTET100Miles,
          percentileGTET100Miles,
          nameSubGTET100,
          hifldIdSubGTET100,
          distSubGTET200Miles,
          percentileGTET200Miles,
          nameSubGTET200,
          hifldIdSubGTET200,
          distSubCAISOMiles,
          percentileGTETCAISOMiles,
          nameSubCASIO,
          hifldIdSubCAISO,
          solarTechnoeconomicIntersec,
          shapeArea,
          shapeLength,
          attributes,
          geometry,
          distance_miles: Number(distance_miles.toFixed(2)),
          isContaining
        });
      }
    });
    
    // Sort by distance (closest first), containing polygons first
    results.sort((a, b) => {
      if (a.isContaining && !b.isContaining) return -1;
      if (!a.isContaining && b.isContaining) return 1;
      return (a.distance_miles || Infinity) - (b.distance_miles || Infinity);
    });
    
    console.log(`✅ Found ${results.length} CA Solar Footprint(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA Solar Footprints:', error);
    return [];
  }
}

