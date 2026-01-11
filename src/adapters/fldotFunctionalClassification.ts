/**
 * Adapter for FLDOT Functional Classification Feature Service
 * Service URL: https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Functional_Classification_TDA/FeatureServer/0
 * 
 * Summary:
 * The Functional Classification System feature class shows roadway functional classifications as derived from event mapping Feature 121, 
 * characteristic FUNCLASS from the FDOT Roadway Characteristics Inventory data. This data represents the information collected and reported 
 * as of the most recent inventory performed and may not reflect the current conditions.
 * 
 * The FDOT GIS Functional Classification Roadways feature class provides spatial information on the assignment of roads into systems. 
 * The two-digit Functional Classification (FUNCLASS) code is used in Federal reports. FUNCLASS is the assignment of roadways into systems 
 * according to the character of service they provide in relation to the total roadway network. Florida uses the Federal Functional Classification System, 
 * which is common to all states. The original Florida Functional Classification System was eliminated in 1995 by the repeal of Chapter 335.04, F.S. 
 * The SHS is determined by mutual agreement and not by functional classification. FUNCLASS determines whether a roadway is STP or FA None, 
 * which determines funding categories. FEMA provides emergency funds for roadways that are not on the Federal Highway System. 
 * This is required for roadways On or Off the SHS that are NHS or functionally classified. This dataset is maintained by the Transportation Data & Analytics office (TDA).
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/O1JpcwDW8sjYuddV/arcgis/rest/services/Functional_Classification_TDA/FeatureServer';
const LAYER_ID = 0;

export interface FLDOTFunctionalClassificationInfo {
  objectId?: number;
  roadway?: string;
  funclass?: string;
  district?: number;
  countydot?: number;
  county?: string;
  mngDist?: number;
  beginPost?: number;
  endPost?: number;
  shapeLength?: number;
  lat?: number;
  lon?: number;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to get the center point of a polyline for distance calculation
function getPolylineCenter(geometry: any): { lat: number; lon: number } | null {
  if (!geometry || !geometry.paths || !Array.isArray(geometry.paths) || geometry.paths.length === 0) {
    return null;
  }
  
  // Get all coordinates from all paths
  const allCoords: number[][] = [];
  geometry.paths.forEach((path: number[][]) => {
    if (Array.isArray(path)) {
      path.forEach((coord: number[]) => {
        if (Array.isArray(coord) && coord.length >= 2) {
          allCoords.push([coord[1], coord[0]]); // [lat, lon] - ESRI geometry uses [x, y] = [lon, lat]
        }
      });
    }
  });
  
  if (allCoords.length === 0) {
    return null;
  }
  
  // Calculate center (average of all coordinates)
  const sumLat = allCoords.reduce((sum, coord) => sum + coord[0], 0);
  const sumLon = allCoords.reduce((sum, coord) => sum + coord[1], 0);
  
  return {
    lat: sumLat / allCoords.length,
    lon: sumLon / allCoords.length
  };
}

/**
 * Query FLDOT Functional Classification FeatureServer for proximity search
 * Returns functional classification features within the specified radius (in miles)
 */
export async function getFLDOTFunctionalClassificationData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<FLDOTFunctionalClassificationInfo[]> {
  try {
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radiusMiles || 25.0, 25.0);
    
    console.log(`🛣️ Querying FLDOT Functional Classification within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
    // Convert radius from miles to meters
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
    queryUrl.searchParams.set('geometryPrecision', '6');
    queryUrl.searchParams.set('maxAllowableOffset', '0');
    
    console.log(`🔗 FLDOT Functional Classification Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ FLDOT Functional Classification API Error:', data.error);
      return [];
    }
    
    if (!data.features || !Array.isArray(data.features)) {
      console.log(`ℹ️ No FLDOT Functional Classification features found within ${cappedRadius} miles`);
      return [];
    }
    
    const features: FLDOTFunctionalClassificationInfo[] = [];
    
    for (const feature of data.features) {
      try {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry;
        
        if (!geometry || !geometry.paths) {
          continue;
        }
        
        // Get center point for distance calculation
        const center = getPolylineCenter(geometry);
        let distance_miles: number | undefined = undefined;
        
        if (center) {
          distance_miles = calculateDistance(lat, lon, center.lat, center.lon);
          // Only include if within radius
          if (distance_miles > cappedRadius) {
            continue;
          }
        }
        
        const featureInfo: FLDOTFunctionalClassificationInfo = {
          objectId: attributes.FID !== null && attributes.FID !== undefined ? Number(attributes.FID) : undefined,
          roadway: attributes.ROADWAY || undefined,
          funclass: attributes.FUNCLASS || undefined,
          district: attributes.DISTRICT !== null && attributes.DISTRICT !== undefined ? Number(attributes.DISTRICT) : undefined,
          countydot: attributes.COUNTYDOT !== null && attributes.COUNTYDOT !== undefined ? Number(attributes.COUNTYDOT) : undefined,
          county: attributes.COUNTY || undefined,
          mngDist: attributes.MNG_DIST !== null && attributes.MNG_DIST !== undefined ? Number(attributes.MNG_DIST) : undefined,
          beginPost: attributes.BEGIN_POST !== null && attributes.BEGIN_POST !== undefined ? Number(attributes.BEGIN_POST) : undefined,
          endPost: attributes.END_POST !== null && attributes.END_POST !== undefined ? Number(attributes.END_POST) : undefined,
          shapeLength: attributes.Shape_Leng !== null && attributes.Shape_Leng !== undefined ? Number(attributes.Shape_Leng) : undefined,
          lat: center ? center.lat : undefined,
          lon: center ? center.lon : undefined,
          attributes: attributes,
          geometry: geometry,
          distance_miles: distance_miles
        };
        
        features.push(featureInfo);
      } catch (error: any) {
        console.error('Error processing FLDOT Functional Classification feature:', error);
        continue;
      }
    }
    
    // Sort by distance
    features.sort((a, b) => {
      const distA = a.distance_miles ?? Infinity;
      const distB = b.distance_miles ?? Infinity;
      return distA - distB;
    });
    
    console.log(`✅ Found ${features.length} FLDOT Functional Classification feature(s)`);
    
    return features;
  } catch (error) {
    console.error('❌ Error querying FLDOT Functional Classification:', error);
    return [];
  }
}
