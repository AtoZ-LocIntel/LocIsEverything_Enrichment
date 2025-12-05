/**
 * CA Post-Fire Damage Inspections (DINS) Adapter
 * Queries California CAL FIRE Damage Inspection Program (DINS) database
 * Structures damaged and destroyed by wildland fire in California since 2013
 * Supports proximity queries
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/POSTFIRE_MASTER_DATA_SHARE/FeatureServer';
const LAYER_ID = 0;

export interface CAPostfireDamageInspectionInfo {
  inspectionId: string | null;
  damage: string | null;
  siteAddress: string | null;
  streetNumber: string | null;
  streetName: string | null;
  streetType: string | null;
  city: string | null;
  county: string | null;
  zipCode: string | null;
  incidentName: string | null;
  incidentNum: string | null;
  incidentStartDate: string | null;
  fireName: string | null;
  structureType: string | null;
  structureCategory: string | null;
  roofConstruction: string | null;
  yearBuilt: number | null;
  apn: string | null;
  assessedImprovedValue: number | null;
  calFireUnit: string | null;
  battalion: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA Post-Fire Damage Inspections FeatureServer for proximity
 */
export async function getCAPostfireDamageInspectionsData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CAPostfireDamageInspectionInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log('ℹ️ CA Post-Fire Damage Inspections requires a radius for proximity query');
      return [];
    }
    
    // Cap radius at 50 miles
    const cappedRadius = Math.min(radius, 50.0);
    
    console.log(`🔥 Querying CA Post-Fire Damage Inspections within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CA Post-Fire Damage Inspections Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA Post-Fire Damage Inspections API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA Post-Fire Damage Inspections found within the specified radius');
      return [];
    }
    
    const results: CAPostfireDamageInspectionInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const inspectionId = attributes.OBJECTID || 
                           attributes.objectid || 
                           attributes.GlobalID ||
                           attributes.GLOBALID ||
                           null;
      
      // Extract inspection information
      const damage = attributes.DAMAGE || 
                    attributes.damage ||
                    attributes.Damage ||
                    null;
      
      const siteAddress = attributes.SITEADDRESS || 
                         attributes.siteAddress ||
                         attributes.SiteAddress ||
                         attributes.site_address ||
                         null;
      
      const streetNumber = attributes.STREETNUMBER || 
                          attributes.streetNumber ||
                          attributes.StreetNumber ||
                          attributes.STREET_NUMBER ||
                          null;
      
      const streetName = attributes.STREETNAME || 
                        attributes.streetName ||
                        attributes.StreetName ||
                        attributes.STREET_NAME ||
                        null;
      
      const streetType = attributes.STREETTYPE || 
                        attributes.streetType ||
                        attributes.StreetType ||
                        attributes.STREET_TYPE ||
                        null;
      
      const city = attributes.CITY || 
                  attributes.city ||
                  attributes.City ||
                  null;
      
      const county = attributes.COUNTY || 
                    attributes.county ||
                    attributes.County ||
                    null;
      
      const zipCode = attributes.ZIPCODE || 
                     attributes.zipCode ||
                     attributes.ZipCode ||
                     attributes.ZIP_CODE ||
                     attributes.zip_code ||
                     null;
      
      const incidentName = attributes.INCIDENTNAME || 
                          attributes.incidentName ||
                          attributes.IncidentName ||
                          attributes.INCIDENT_NAME ||
                          null;
      
      const incidentNum = attributes.INCIDENTNUM || 
                         attributes.incidentNum ||
                         attributes.IncidentNum ||
                         attributes.INCIDENT_NUM ||
                         null;
      
      const incidentStartDate = attributes.INCIDENTSTARTDATE || 
                               attributes.incidentStartDate ||
                               attributes.IncidentStartDate ||
                               attributes.INCIDENT_START_DATE ||
                               null;
      
      const fireName = attributes.FIRENAME || 
                      attributes.fireName ||
                      attributes.FireName ||
                      attributes.FIRE_NAME ||
                      null;
      
      const structureType = attributes.STRUCTURETYPE || 
                           attributes.structureType ||
                           attributes.StructureType ||
                           attributes.STRUCTURE_TYPE ||
                           null;
      
      const structureCategory = attributes.STRUCTURECATEGORY || 
                               attributes.structureCategory ||
                               attributes.StructureCategory ||
                               attributes.STRUCTURE_CATEGORY ||
                               null;
      
      const roofConstruction = attributes.ROOFCONSTRUCTION || 
                              attributes.roofConstruction ||
                              attributes.RoofConstruction ||
                              attributes.ROOF_CONSTRUCTION ||
                              null;
      
      const yearBuilt = attributes.YEARBUILT !== null && attributes.YEARBUILT !== undefined 
                       ? parseInt(attributes.YEARBUILT.toString())
                       : (attributes.yearBuilt !== null && attributes.yearBuilt !== undefined
                          ? parseInt(attributes.yearBuilt.toString())
                          : null);
      
      const apn = attributes.APN || 
                 attributes.apn ||
                 attributes.Apn ||
                 null;
      
      const assessedImprovedValue = attributes.ASSESSEDIMPROVEDVALUE !== null && attributes.ASSESSEDIMPROVEDVALUE !== undefined 
                                   ? parseFloat(attributes.ASSESSEDIMPROVEDVALUE.toString())
                                   : (attributes.assessedImprovedValue !== null && attributes.assessedImprovedValue !== undefined
                                      ? parseFloat(attributes.assessedImprovedValue.toString())
                                      : null);
      
      const calFireUnit = attributes.CALFIREUNIT || 
                         attributes.calFireUnit ||
                         attributes.CalFireUnit ||
                         attributes.CAL_FIRE_UNIT ||
                         null;
      
      const battalion = attributes.BATTALION || 
                       attributes.battalion ||
                       attributes.Battalion ||
                       null;
      
      // Calculate distance if we have coordinates
      let distance_miles = cappedRadius; // Default to max radius
      const latitude = attributes.Latitude !== null && attributes.Latitude !== undefined 
                      ? parseFloat(attributes.Latitude.toString())
                      : (attributes.latitude !== null && attributes.latitude !== undefined
                         ? parseFloat(attributes.latitude.toString())
                         : null);
      
      const longitude = attributes.Longitude !== null && attributes.Longitude !== undefined 
                       ? parseFloat(attributes.Longitude.toString())
                       : (attributes.longitude !== null && attributes.longitude !== undefined
                          ? parseFloat(attributes.longitude.toString())
                          : null);
      
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
      
      // Only include inspections within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          inspectionId: inspectionId ? inspectionId.toString() : null,
          damage,
          siteAddress,
          streetNumber,
          streetName,
          streetType,
          city,
          county,
          zipCode,
          incidentName,
          incidentNum,
          incidentStartDate,
          fireName,
          structureType,
          structureCategory,
          roofConstruction,
          yearBuilt,
          apn,
          assessedImprovedValue,
          calFireUnit,
          battalion,
          attributes,
          geometry,
          distance_miles: Number(distance_miles.toFixed(2))
        });
      }
    });
    
    // Sort by distance (closest first)
    results.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${results.length} CA Post-Fire Damage Inspection(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA Post-Fire Damage Inspections:', error);
    return [];
  }
}

