/**
 * Adapter for WFIGS (Wildland Fire Interagency Geospatial Services) API
 * Service URL: https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0
 * 
 * Provides current wildland fire incident locations from IRWIN (Integrated Reporting of Wildland Fire Information)
 * - Current wildfires, prescribed fires, and incident complexes
 * - Updates every 5 minutes
 * - Fall-off rules for stale records
 */

export interface WFIGSWildfireInfo {
  objectid: number;
  incident_name?: string;
  incident_type?: string; // WF (Wildfire), RX (Prescribed Fire), CX (Incident Complex)
  incident_size?: number; // Acres
  incident_size_class?: string; // A, B, C, D-L
  percent_contained?: number;
  latitude: number;
  longitude: number;
  modified_on_date_time?: string;
  created_on_date_time?: string;
  discovery_date?: string;
  fire_cause?: string;
  fire_cause_general?: string;
  poo_state?: string; // Point of origin state
  poo_county?: string; // Point of origin county
  distance?: number; // Distance in miles from query point
}

const WFIGS_API_URL = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query';

/**
 * Get all current WFIGS wildfire incidents
 * Returns all active wildfires, prescribed fires, and incident complexes
 */
export async function getAllWFIGSWildfires(): Promise<WFIGSWildfireInfo[]> {
  try {
    console.log('🔥 Fetching WFIGS current wildfire incidents...');
    
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      f: 'json',
      returnGeometry: 'true'
    });
    
    const response = await fetch(`${WFIGS_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`WFIGS API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn('⚠️ WFIGS response missing features array');
      return [];
    }
    
    const wildfires: WFIGSWildfireInfo[] = data.features
      .map((feature: any) => {
        const attrs = feature.attributes || {};
        const geometry = feature.geometry || {};
        
        // Extract coordinates from geometry
        const longitude = geometry.x || geometry.longitude || attrs.longitude;
        const latitude = geometry.y || geometry.latitude || attrs.latitude;
        
        if (latitude === null || latitude === undefined || longitude === null || longitude === undefined ||
            isNaN(latitude) || isNaN(longitude)) {
          return null;
        }
        
        return {
          objectid: attrs.objectid || attrs.OBJECTID || 0,
          incident_name: attrs.incident_name || attrs.IncidentName || '',
          incident_type: attrs.incident_type || attrs.IncidentType || '',
          incident_size: attrs.incident_size || attrs.IncidentSize || 0,
          incident_size_class: attrs.incident_size_class || attrs.IncidentSizeClass || '',
          percent_contained: attrs.percent_contained || attrs.PercentContained || 0,
          latitude: parseFloat(String(latitude)),
          longitude: parseFloat(String(longitude)),
          modified_on_date_time: attrs.modified_on_date_time || attrs.ModifiedOnDateTime_dt || '',
          created_on_date_time: attrs.created_on_date_time || attrs.CreatedOnDateTime_dt || '',
          discovery_date: attrs.discovery_date || attrs.DiscoveryDate || '',
          fire_cause: attrs.fire_cause || attrs.FireCause || '',
          fire_cause_general: attrs.fire_cause_general || attrs.FireCauseGeneral || '',
          poo_state: attrs.poo_state || attrs.POOState || '',
          poo_county: attrs.poo_county || attrs.POOCounty || ''
        };
      })
      .filter((fire: WFIGSWildfireInfo | null) => fire !== null) as WFIGSWildfireInfo[];
    
    console.log(`✅ Retrieved ${wildfires.length} WFIGS wildfire incidents`);
    return wildfires;
  } catch (error: any) {
    console.error('❌ Error fetching WFIGS wildfires:', error);
    return [];
  }
}
