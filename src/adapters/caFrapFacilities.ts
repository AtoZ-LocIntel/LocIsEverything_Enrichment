/**
 * CA FRAP Facilities Adapter
 * Queries California State and Local Facilities for Wildland Fire Protection
 * Supports proximity queries
 */

const BASE_SERVICE_URL = 'https://egis.fire.ca.gov/arcgis/rest/services/FRAP/Facilities/FeatureServer';
const LAYER_ID = 0;

export interface CAFRAPFacilityInfo {
  facilityId: string | null;
  facilityStatus: string | null;
  name: string | null;
  cadName: string | null;
  aka: string | null;
  type: string | null;
  unit: string | null;
  cdfUnit: string | null;
  county: string | null;
  owner: string | null;
  funding: string | null;
  staffing: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  phoneNum: string | null;
  latitude: number | null;
  longitude: number | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA FRAP Facilities FeatureServer for proximity
 */
export async function getCAFRAPFacilitiesData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CAFRAPFacilityInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log('ℹ️ CA FRAP Facilities requires a radius for proximity query');
      return [];
    }
    
    // Cap radius at 50 miles
    const cappedRadius = Math.min(radius, 50.0);
    
    console.log(`🔥 Querying CA FRAP Facilities within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CA FRAP Facilities Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA FRAP Facilities API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA FRAP Facilities found within the specified radius');
      return [];
    }
    
    const results: CAFRAPFacilityInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const facilityId = attributes.OBJECTID || 
                        attributes.objectid || 
                        attributes.GlobalID ||
                        attributes.GLOBALID ||
                        null;
      
      // Extract facility information
      const facilityStatus = attributes.FACILITY_STATUS || 
                            attributes.facility_status ||
                            attributes.FacilityStatus ||
                            null;
      
      const name = attributes.NAME || 
                  attributes.name ||
                  attributes.Name ||
                  null;
      
      const cadName = attributes.CAD_NAME || 
                     attributes.cad_name ||
                     attributes.CadName ||
                     null;
      
      const aka = attributes.AKA || 
                 attributes.aka ||
                 attributes.Aka ||
                 null;
      
      const type = attributes.TYPE || 
                  attributes.type ||
                  attributes.Type ||
                  null;
      
      const unit = attributes.UNIT || 
                  attributes.unit ||
                  attributes.Unit ||
                  null;
      
      const cdfUnit = attributes.CDF_UNIT || 
                     attributes.cdf_unit ||
                     attributes.CdfUnit ||
                     null;
      
      const county = attributes.COUNTY || 
                    attributes.county ||
                    attributes.County ||
                    null;
      
      const owner = attributes.OWNER || 
                   attributes.owner ||
                   attributes.Owner ||
                   null;
      
      const funding = attributes.FUNDING || 
                     attributes.funding ||
                     attributes.Funding ||
                     null;
      
      const staffing = attributes.STAFFING || 
                      attributes.staffing ||
                      attributes.Staffing ||
                      null;
      
      const address = attributes.ADDRESS || 
                     attributes.address ||
                     attributes.Address ||
                     null;
      
      const city = attributes.CITY || 
                  attributes.city ||
                  attributes.City ||
                  null;
      
      const zip = attributes.ZIP || 
                 attributes.zip ||
                 attributes.Zip ||
                 attributes.ZIPCODE ||
                 attributes.zipCode ||
                 null;
      
      const phoneNum = attributes.PHONE_NUM || 
                      attributes.phone_num ||
                      attributes.PhoneNum ||
                      attributes.PHONE ||
                      attributes.phone ||
                      null;
      
      const latitude = attributes.LAT !== null && attributes.LAT !== undefined 
                      ? parseFloat(attributes.LAT.toString())
                      : (attributes.latitude !== null && attributes.latitude !== undefined
                         ? parseFloat(attributes.latitude.toString())
                         : null);
      
      const longitude = attributes.LON !== null && attributes.LON !== undefined 
                       ? parseFloat(attributes.LON.toString())
                       : (attributes.longitude !== null && attributes.longitude !== undefined
                          ? parseFloat(attributes.longitude.toString())
                          : null);
      
      // Calculate distance if we have coordinates
      let distance_miles = cappedRadius; // Default to max radius
      if (latitude !== null && longitude !== null) {
        // Use haversine formula to calculate distance
        const R = 3959; // Earth radius in miles
        const dLat = (lat - latitude) * Math.PI / 180;
        const dLon = (lon - longitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance_miles = R * c;
      } else if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
        // Use geometry coordinates if available
        const R = 3959; // Earth radius in miles
        const dLat = (lat - geometry.y) * Math.PI / 180;
        const dLon = (lon - geometry.x) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(geometry.y * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance_miles = R * c;
      }
      
      // Only include facilities within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          facilityId: facilityId ? facilityId.toString() : null,
          facilityStatus,
          name,
          cadName,
          aka,
          type,
          unit,
          cdfUnit,
          county,
          owner,
          funding,
          staffing,
          address,
          city,
          zip,
          phoneNum,
          latitude,
          longitude,
          attributes,
          geometry,
          distance_miles: Number(distance_miles.toFixed(2))
        });
      }
    });
    
    // Sort by distance (closest first)
    results.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${results.length} CA FRAP Facility/Facilities within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA FRAP Facilities:', error);
    return [];
  }
}

