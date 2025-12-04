/**
 * CA Power Outage Areas Adapter
 * Queries California Power Outage Areas from CA Open Data Portal FeatureServer
 * Supports point-in-polygon and proximity queries
 */

const BASE_SERVICE_URL = 'https://services.arcgis.com/BLN4oKB0N1YSgvY8/arcgis/rest/services/Power_Outages_(View)/FeatureServer';
const LAYER_ID = 1;

export interface CAPowerOutageAreaInfo {
  outageId: string | null;
  utilityCompany: string | null;
  startDate: string | null;
  estimatedRestoreDate: string | null;
  cause: string | null;
  impactedCustomers: number | null;
  county: string | null;
  outageStatus: string | null;
  outageType: string | null;
  incidentId: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA Power Outage Areas FeatureServer for point-in-polygon
 * Returns the outage area that contains the given point
 */
export async function getCAPowerOutageAreaData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CAPowerOutageAreaInfo[]> {
  try {
    const results: CAPowerOutageAreaInfo[] = [];
    
    // Point-in-polygon query
    console.log(`⚡ Querying CA Power Outage Areas for containing outage area at [${lat}, ${lon}]`);
    
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
          
          const outageId = attributes.OBJECTID || 
                          attributes.objectid || 
                          attributes.GlobalID ||
                          attributes.IncidentId ||
                          null;
          
          results.push({
            outageId: outageId ? outageId.toString() : null,
            utilityCompany: attributes.UtilityCompany || attributes.utilityCompany || null,
            startDate: attributes.StartDate ? new Date(attributes.StartDate).toISOString() : null,
            estimatedRestoreDate: attributes.EstimatedRestoreDate ? new Date(attributes.EstimatedRestoreDate).toISOString() : null,
            cause: attributes.Cause || attributes.cause || null,
            impactedCustomers: attributes.ImpactedCustomers !== null && attributes.ImpactedCustomers !== undefined 
              ? parseInt(attributes.ImpactedCustomers.toString()) 
              : (attributes.impactedCustomers !== null && attributes.impactedCustomers !== undefined 
                ? parseInt(attributes.impactedCustomers.toString()) 
                : null),
            county: attributes.County || attributes.county || null,
            outageStatus: attributes.OutageStatus || attributes.outageStatus || null,
            outageType: attributes.OutageType || attributes.outageType || null,
            incidentId: attributes.IncidentId || attributes.incidentId || null,
            attributes,
            geometry,
            distance_miles: 0 // Containing polygon
          });
        });
      }
    }
    
    // Proximity query if radius is provided
    if (radius && radius > 0) {
      console.log(`⚡ Querying CA Power Outage Areas within ${radius} miles of [${lat}, ${lon}]`);
      
      // Convert radius from miles to meters for buffer
      const radiusMeters = radius * 1609.34;
      
      // Create a buffer around the point for proximity search
      // Using a simple bounding box approach for proximity
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
            
            const outageId = attributes.OBJECTID || 
                            attributes.objectid || 
                            attributes.GlobalID ||
                            attributes.IncidentId ||
                            null;
            
            // Check if this outage is already in results (from point-in-polygon)
            const existingIndex = results.findIndex(r => 
              (r.outageId && r.outageId === (outageId ? outageId.toString() : null)) ||
              (r.incidentId && r.incidentId === (attributes.IncidentId || attributes.incidentId || null))
            );
            
            if (existingIndex === -1) {
              // Calculate distance for proximity results
              // For now, we'll use a placeholder - actual distance calculation would require geometry processing
              const distance_miles = radius; // Approximate, will be refined if needed
              
              results.push({
                outageId: outageId ? outageId.toString() : null,
                utilityCompany: attributes.UtilityCompany || attributes.utilityCompany || null,
                startDate: attributes.StartDate ? new Date(attributes.StartDate).toISOString() : null,
                estimatedRestoreDate: attributes.EstimatedRestoreDate ? new Date(attributes.EstimatedRestoreDate).toISOString() : null,
                cause: attributes.Cause || attributes.cause || null,
                impactedCustomers: attributes.ImpactedCustomers !== null && attributes.ImpactedCustomers !== undefined 
                  ? parseInt(attributes.ImpactedCustomers.toString()) 
                  : (attributes.impactedCustomers !== null && attributes.impactedCustomers !== undefined 
                    ? parseInt(attributes.impactedCustomers.toString()) 
                    : null),
                county: attributes.County || attributes.county || null,
                outageStatus: attributes.OutageStatus || attributes.outageStatus || null,
                outageType: attributes.OutageType || attributes.outageType || null,
                incidentId: attributes.IncidentId || attributes.incidentId || null,
                attributes,
                geometry,
                distance_miles
              });
            }
          });
        }
      }
    }
    
    console.log(`✅ Found ${results.length} CA Power Outage Area(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA Power Outage Areas:', error);
    return [];
  }
}

