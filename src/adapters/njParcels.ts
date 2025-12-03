/**
 * NJ Parcels Adapter
 * Queries New Jersey Tax Parcels from NJGIN FeatureServer
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_Composite_NJ_WM/FeatureServer';
const PARCELS_LAYER_ID = 0;

export interface NJParcelInfo {
  parcelId: string | null;
  pin: string | null;
  municipality: string | null;
  county: string | null;
  block: string | null;
  lot: string | null;
  ownerName: string | null;
  streetAddress: string | null;
  cityState: string | null;
  zipCode: string | null;
  landValue: number | null;
  improvementValue: number | null;
  netValue: number | null;
  acres: number | null;
  attributes: Record<string, any>;
  geometry?: any;
  isContaining?: boolean;
  distance_miles?: number;
}

/**
 * Calculate distance between two lat/lon points using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate distance from a point to a polygon (distance to nearest point on polygon boundary)
 */
function calculateDistanceToPolygon(lat: number, lon: number, rings: number[][][]): number {
  let minDistance = Infinity;
  
  rings.forEach(ring => {
    for (let i = 0; i < ring.length; i++) {
      const p1 = ring[i];
      const p2 = ring[(i + 1) % ring.length];
      
      // ESRI geometry coordinates with outSR=4326 are [x, y] which is [lon, lat] in degrees
      const lon1 = p1[0];
      const lat1 = p1[1];
      const lon2 = p2[0];
      const lat2 = p2[1];
      
      // Calculate distance from point to line segment
      const distance = pointToLineSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
      minDistance = Math.min(minDistance, distance);
    }
  });
  
  return minDistance;
}

function pointToLineSegmentDistance(
  pointLat: number, pointLon: number,
  segLat1: number, segLon1: number,
  segLat2: number, segLon2: number
): number {
  // Calculate distances to endpoints
  const d1 = haversineDistance(pointLat, pointLon, segLat1, segLon1);
  const d2 = haversineDistance(pointLat, pointLon, segLat2, segLon2);
  const dSegment = haversineDistance(segLat1, segLon1, segLat2, segLon2);
  
  // If segment is very short, just return distance to nearest endpoint
  if (dSegment < 0.001) {
    return Math.min(d1, d2);
  }
  
  // Calculate the closest point on the line segment
  // Using vector projection
  const dx = segLon2 - segLon1;
  const dy = segLat2 - segLat1;
  const t = Math.max(0, Math.min(1, 
    ((pointLon - segLon1) * dx + (pointLat - segLat1) * dy) / (dx * dx + dy * dy)
  ));
  
  const closestLon = segLon1 + t * dx;
  const closestLat = segLat1 + t * dy;
  
  return haversineDistance(pointLat, pointLon, closestLat, closestLon);
}

/**
 * Query NJ Parcels FeatureServer for point-in-polygon and proximity search
 */
export async function getNJParcelsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<{ containing: NJParcelInfo | null; nearby: NJParcelInfo[] }> {
  try {
    if (radiusMiles && radiusMiles > 0) {
      // Proximity query
      console.log(`🏠 Querying NJ Parcels within ${radiusMiles} miles of [${lat}, ${lon}]`);
      
      const radiusMeters = radiusMiles * 1609.34;
      const queryUrl = new URL(`${BASE_SERVICE_URL}/${PARCELS_LAYER_ID}/query`);
      
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
      
      const response = await fetch(queryUrl.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.error) {
        console.error('❌ NJ Parcels API Error:', data.error);
        return { containing: null, nearby: [] };
      }
      
      if (!data.features || data.features.length === 0) {
        console.log(`ℹ️ No NJ Parcels found within ${radiusMiles} miles`);
        return { containing: null, nearby: [] };
      }
      
      const parcels: NJParcelInfo[] = data.features.map((feature: any) => {
        const attributes = feature.attributes || {};
        const geometry = feature.geometry || null;
        
        const pin = attributes.PAMS_PIN || attributes.pams_pin || attributes.GIS_PIN || attributes.gis_pin || attributes.PIN_NODUP || attributes.pin_nodup || null;
        const municipality = attributes.MUN_NAME || attributes.mun_name || null;
        const county = attributes.COUNTY || attributes.county || null;
        const block = attributes.PCLBLOCK || attributes.pclblock || null;
        const lot = attributes.PCLLOT || attributes.pcllot || null;
        const ownerName = attributes.OWNER_NAME || attributes.owner_name || null;
        const streetAddress = attributes.ST_ADDRESS || attributes.st_address || null;
        const cityState = attributes.CITY_STATE || attributes.city_state || null;
        const zipCode = attributes.ZIP_CODE || attributes.zip_code || attributes.ZIP5 || attributes.zip5 || null;
        const landValue = attributes.LAND_VAL || attributes.land_val || null;
        const improvementValue = attributes.IMPRVT_VAL || attributes.imprvt_val || null;
        const netValue = attributes.NET_VALUE || attributes.net_value || null;
        const acres = attributes.CALC_ACRE || attributes.calc_acre || null;
        
        const parcelId = attributes.OBJECTID || attributes.objectid || pin || null;
        
        // Check if point is inside polygon
        let isContaining = false;
        if (geometry && geometry.rings) {
          isContaining = pointInPolygon(lat, lon, geometry.rings);
        }
        
        let distance_miles: number | undefined = undefined;
        if (!isContaining && geometry && geometry.rings) {
          distance_miles = calculateDistanceToPolygon(lat, lon, geometry.rings);
        } else if (isContaining) {
          distance_miles = 0;
        }
        
        return {
          parcelId: parcelId ? parcelId.toString() : null,
          pin,
          municipality,
          county,
          block,
          lot,
          ownerName,
          streetAddress,
          cityState,
          zipCode,
          landValue: landValue ? parseFloat(landValue.toString()) : null,
          improvementValue: improvementValue ? parseFloat(improvementValue.toString()) : null,
          netValue: netValue ? parseFloat(netValue.toString()) : null,
          acres: acres ? parseFloat(acres.toString()) : null,
          attributes,
          geometry,
          isContaining,
          distance_miles
        };
      });
      
      // Separate containing and nearby parcels
      const containingParcel = parcels.find(p => p.isContaining) || null;
      const nearbyParcels = parcels
        .filter(p => !p.isContaining && p.distance_miles !== undefined && p.distance_miles <= radiusMiles)
        .sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
      
      console.log(`✅ Found ${containingParcel ? 1 : 0} containing parcel and ${nearbyParcels.length} nearby NJ Parcels within ${radiusMiles} miles`);
      return { containing: containingParcel, nearby: nearbyParcels };
    } else {
      // Point-in-polygon only query
      console.log(`🏠 Querying NJ Parcels for point [${lat}, ${lon}]`);
      
      const queryUrl = new URL(`${BASE_SERVICE_URL}/${PARCELS_LAYER_ID}/query`);
      
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
      queryUrl.searchParams.set('inSR', '4326');
      queryUrl.searchParams.set('outSR', '4326');
      queryUrl.searchParams.set('returnGeometry', 'true');
      
      const response = await fetch(queryUrl.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.error) {
        console.error('❌ NJ Parcels API Error:', data.error);
        return { containing: null, nearby: [] };
      }
      
      if (!data.features || data.features.length === 0) {
        console.log(`ℹ️ No NJ Parcels found containing the point`);
        return { containing: null, nearby: [] };
      }
      
      const containingFeature = data.features[0];
      const attributes = containingFeature.attributes || {};
      const geometry = containingFeature.geometry || null;
      
      const pin = attributes.PAMS_PIN || attributes.pams_pin || attributes.GIS_PIN || attributes.gis_pin || attributes.PIN_NODUP || attributes.pin_nodup || null;
      const municipality = attributes.MUN_NAME || attributes.mun_name || null;
      const county = attributes.COUNTY || attributes.county || null;
      const block = attributes.PCLBLOCK || attributes.pclblock || null;
      const lot = attributes.PCLLOT || attributes.pcllot || null;
      const ownerName = attributes.OWNER_NAME || attributes.owner_name || null;
      const streetAddress = attributes.ST_ADDRESS || attributes.st_address || null;
      const cityState = attributes.CITY_STATE || attributes.city_state || null;
      const zipCode = attributes.ZIP_CODE || attributes.zip_code || attributes.ZIP5 || attributes.zip5 || null;
      const landValue = attributes.LAND_VAL || attributes.land_val || null;
      const improvementValue = attributes.IMPRVT_VAL || attributes.imprvt_val || null;
      const netValue = attributes.NET_VALUE || attributes.net_value || null;
      const acres = attributes.CALC_ACRE || attributes.calc_acre || null;
      
      const parcelId = attributes.OBJECTID || attributes.objectid || pin || null;
      
      const parcel: NJParcelInfo = {
        parcelId: parcelId ? parcelId.toString() : null,
        pin,
        municipality,
        county,
        block,
        lot,
        ownerName,
        streetAddress,
        cityState,
        zipCode,
        landValue: landValue ? parseFloat(landValue.toString()) : null,
        improvementValue: improvementValue ? parseFloat(improvementValue.toString()) : null,
        netValue: netValue ? parseFloat(netValue.toString()) : null,
        acres: acres ? parseFloat(acres.toString()) : null,
        attributes,
        geometry,
        isContaining: true,
        distance_miles: 0
      };
      
      console.log(`✅ Found NJ Parcel containing the point: ${pin || parcelId || 'Unknown'}`);
      return { containing: parcel, nearby: [] };
    }
  } catch (error) {
    console.error('❌ Error querying NJ Parcels:', error);
    return { containing: null, nearby: [] };
  }
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(lat: number, lon: number, rings: number[][][]): boolean {
  let inside = false;
  
  rings.forEach(ring => {
    if (ring.length < 3) return;
    
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      
      // ESRI geometry coordinates with outSR=4326 are [x, y] which is [lon, lat] in degrees
      const lon1 = xi;
      const lat1 = yi;
      const lon2 = xj;
      const lat2 = yj;
      
      const intersect = ((lat1 > lat) !== (lat2 > lat)) && (lon < (lon2 - lon1) * (lat - lat1) / (lat2 - lat1) + lon1);
      if (intersect) inside = !inside;
    }
  });
  
  return inside;
}

