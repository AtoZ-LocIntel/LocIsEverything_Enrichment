/**
 * CA CalVTP Treatment Areas Adapter
 * Queries California CalVTP Treatment Areas from CAL FIRE FeatureServer
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/CalVTP_treatement_areas_public_view/FeatureServer';
const LAYER_ID = 0;

export interface CACalVTPTreatmentAreaInfo {
  treatmentAreaId: string | null;
  projectId: string | null;
  dateCompleted: string | null;
  treatmentType: string | null;
  treatmentActivity: string | null;
  treatmentAcres: number | null;
  county: string | null;
  fuelType: string | null;
  coastalZone: string | null;
  grantType: string | null;
  status: string | null;
  affiliation: string | null;
  treatmentStage: string | null;
  contactName: string | null;
  contactNumber: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
  comments: string | null;
  reviewed: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA CalVTP Treatment Areas FeatureServer for point-in-polygon and proximity
 */
export async function getCACalVTPTreatmentAreasData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CACalVTPTreatmentAreaInfo[]> {
  try {
    const results: CACalVTPTreatmentAreaInfo[] = [];
    
    // Point-in-polygon query
    console.log(`🔥 Querying CA CalVTP Treatment Areas for containing treatment area at [${lat}, ${lon}]`);
    
    const pointInPolyUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
    pointInPolyUrl.searchParams.set('f', 'json');
    pointInPolyUrl.searchParams.set('where', '1=1');
    pointInPolyUrl.searchParams.set('outFields', '*');
    pointInPolyUrl.searchParams.set('geometry', JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }));
    pointInPolyUrl.searchParams.set('geometryType', 'esriGeometryPoint');
    pointInPolyUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    pointInPolyUrl.searchParams.set('inSR', '4326');
    pointInPolyUrl.searchParams.set('outSR', '4326');
    pointInPolyUrl.searchParams.set('returnGeometry', 'true');
    
    const pointInPolyResponse = await fetch(pointInPolyUrl.toString());
    
    if (pointInPolyResponse.ok) {
      const pointInPolyData = await pointInPolyResponse.json();
      
      if (pointInPolyData.features && pointInPolyData.features.length > 0) {
        pointInPolyData.features.forEach((feature: any) => {
          const attributes = feature.attributes || {};
          const geometry = feature.geometry || null;
          
          const treatmentAreaId = attributes.OBJECTID || 
                        attributes.objectid || 
                        attributes.FID ||
                        attributes.fid ||
                        attributes.GlobalID ||
                        null;
          
          results.push({
            treatmentAreaId: treatmentAreaId ? treatmentAreaId.toString() : null,
            projectId: attributes.Project_ID || attributes.project_id || attributes.ProjectID || null,
            dateCompleted: attributes.Date_Completed || attributes.date_completed || attributes.DateCompleted || null,
            treatmentType: attributes.Treatment_Type || attributes.treatment_type || attributes.TreatmentType || null,
            treatmentActivity: attributes.Treatment_Activity || attributes.treatment_activity || attributes.TreatmentActivity || null,
            treatmentAcres: attributes.Treatment_Acres || attributes.treatment_acres || attributes.TreatmentAcres || null,
            county: attributes.County || attributes.county || null,
            fuelType: attributes.Fuel_Type || attributes.fuel_type || attributes.FuelType || null,
            coastalZone: attributes.Coastal_Zone || attributes.coastal_zone || attributes.CoastalZone || null,
            grantType: attributes.Grant_Type || attributes.grant_type || attributes.GrantType || null,
            status: attributes.Status || attributes.status || null,
            affiliation: attributes.Affiliation || attributes.affiliation || null,
            treatmentStage: attributes.TreatmentStage || attributes.treatment_stage || attributes.TreatmentStage || null,
            contactName: attributes.ContactName || attributes.contact_name || attributes.ContactName || null,
            contactNumber: attributes.ContactNumber || attributes.contact_number || attributes.ContactNumber || null,
            contactEmail: attributes.ContactEmail || attributes.contact_email || attributes.ContactEmail || null,
            contactAddress: attributes.ContactAddress || attributes.contact_address || attributes.ContactAddress || null,
            comments: attributes.Comments || attributes.comments || null,
            reviewed: attributes.Reviewed || attributes.reviewed || null,
            attributes,
            geometry,
            distance_miles: 0 // Containing polygon
          });
        });
      }
    }
    
    // Proximity query if radius is provided
    if (radius && radius > 0) {
      console.log(`🔥 Querying CA CalVTP Treatment Areas within ${radius} miles of [${lat}, ${lon}]`);
      
      const radiusMeters = radius * 1609.34;
      
      const proximityUrl = new URL(`${BASE_SERVICE_URL}/${LAYER_ID}/query`);
      proximityUrl.searchParams.set('f', 'json');
      proximityUrl.searchParams.set('where', '1=1');
      proximityUrl.searchParams.set('outFields', '*');
      proximityUrl.searchParams.set('geometry', JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
      }));
      proximityUrl.searchParams.set('geometryType', 'esriGeometryPoint');
      proximityUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      proximityUrl.searchParams.set('distance', radiusMeters.toString());
      proximityUrl.searchParams.set('units', 'esriSRUnit_Meter');
      proximityUrl.searchParams.set('inSR', '4326');
      proximityUrl.searchParams.set('outSR', '4326');
      proximityUrl.searchParams.set('returnGeometry', 'true');
      
      const proximityResponse = await fetch(proximityUrl.toString());
      
      if (proximityResponse.ok) {
        const proximityData = await proximityResponse.json();
        
        if (proximityData.features && proximityData.features.length > 0) {
          proximityData.features.forEach((feature: any) => {
            const attributes = feature.attributes || {};
            const geometry = feature.geometry || null;
            
            const treatmentAreaId = attributes.OBJECTID || 
                          attributes.objectid || 
                          attributes.FID ||
                          attributes.fid ||
                          attributes.GlobalID ||
                          null;
            
            // Check if this treatment area is already in results (from point-in-polygon)
            const existingIndex = results.findIndex(r => 
              (r.treatmentAreaId && r.treatmentAreaId === (treatmentAreaId ? treatmentAreaId.toString() : null))
            );
            
            if (existingIndex === -1) {
              const distance_miles = radius; // Approximate
              
              results.push({
                treatmentAreaId: treatmentAreaId ? treatmentAreaId.toString() : null,
                projectId: attributes.Project_ID || attributes.project_id || attributes.ProjectID || null,
                dateCompleted: attributes.Date_Completed || attributes.date_completed || attributes.DateCompleted || null,
                treatmentType: attributes.Treatment_Type || attributes.treatment_type || attributes.TreatmentType || null,
                treatmentActivity: attributes.Treatment_Activity || attributes.treatment_activity || attributes.TreatmentActivity || null,
                treatmentAcres: attributes.Treatment_Acres || attributes.treatment_acres || attributes.TreatmentAcres || null,
                county: attributes.County || attributes.county || null,
                fuelType: attributes.Fuel_Type || attributes.fuel_type || attributes.FuelType || null,
                coastalZone: attributes.Coastal_Zone || attributes.coastal_zone || attributes.CoastalZone || null,
                grantType: attributes.Grant_Type || attributes.grant_type || attributes.GrantType || null,
                status: attributes.Status || attributes.status || null,
                affiliation: attributes.Affiliation || attributes.affiliation || null,
                treatmentStage: attributes.TreatmentStage || attributes.treatment_stage || attributes.TreatmentStage || null,
                contactName: attributes.ContactName || attributes.contact_name || attributes.ContactName || null,
                contactNumber: attributes.ContactNumber || attributes.contact_number || attributes.ContactNumber || null,
                contactEmail: attributes.ContactEmail || attributes.contact_email || attributes.ContactEmail || null,
                contactAddress: attributes.ContactAddress || attributes.contact_address || attributes.ContactAddress || null,
                comments: attributes.Comments || attributes.comments || null,
                reviewed: attributes.Reviewed || attributes.reviewed || null,
                attributes,
                geometry,
                distance_miles
              });
            }
          });
        }
      }
    }
    
    console.log(`✅ Found ${results.length} CA CalVTP Treatment Areas`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA CalVTP Treatment Areas:', error);
    return [];
  }
}

