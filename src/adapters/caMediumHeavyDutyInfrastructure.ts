/**
 * CA Medium and Heavy Duty Infrastructure Adapter
 * Queries California Medium and Heavy Duty (MDHD) hydrogen refueling and charging stations
 * Supports proximity queries
 */

const BASE_SERVICE_URL = 'https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/MDHD_Dashboard_ArcGIS_Updated_Nov/FeatureServer';
const LAYER_ID = 0;

export interface CAMediumHeavyDutyInfrastructureInfo {
  stationId: string | null;
  chargingOrHydrogen: string | null;
  chargerOrDispenserCount: string | null;
  nozzleCount: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  fundingAgencies: string | null;
  operator: string | null;
  eligible: string | null;
  liquidGaseous: string | null;
  chargingCapacity: string | null;
  maximumCharging: string | null;
  projectStatus: string | null;
  attributes: Record<string, any>;
  geometry?: any; // ESRI geometry for drawing on map
  distance_miles?: number; // For proximity queries
}

/**
 * Query CA Medium and Heavy Duty Infrastructure FeatureServer for proximity
 */
export async function getCAMediumHeavyDutyInfrastructureData(
  lat: number,
  lon: number,
  radius?: number
): Promise<CAMediumHeavyDutyInfrastructureInfo[]> {
  try {
    if (!radius || radius <= 0) {
      console.log('ℹ️ CA Medium and Heavy Duty Infrastructure requires a radius for proximity query');
      return [];
    }
    
    // Cap radius at 25 miles
    const cappedRadius = Math.min(radius, 25.0);
    
    console.log(`🚛 Querying CA Medium and Heavy Duty Infrastructure within ${cappedRadius} miles of [${lat}, ${lon}]`);
    
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
    
    console.log(`🔗 CA Medium and Heavy Duty Infrastructure Proximity Query URL: ${queryUrl.toString()}`);
    
    const response = await fetch(queryUrl.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ CA Medium and Heavy Duty Infrastructure API Error:', data.error);
      return [];
    }
    
    if (!data.features || data.features.length === 0) {
      console.log('ℹ️ No CA Medium and Heavy Duty Infrastructure found within the specified radius');
      return [];
    }
    
    const results: CAMediumHeavyDutyInfrastructureInfo[] = [];
    
    data.features.forEach((feature: any) => {
      const attributes = feature.attributes || {};
      const geometry = feature.geometry || null;
      
      const stationId = attributes.OBJECTID || 
                        attributes.objectid || 
                        attributes.GlobalID ||
                        attributes.GLOBALID ||
                        null;
      
      // Extract station information
      const chargingOrHydrogen = attributes.Charging_or_Hydrogen || 
                                attributes.charging_or_hydrogen ||
                                attributes.ChargingOrHydrogen ||
                                null;
      
      const chargerOrDispenserCount = attributes.Charger_or_Dispenser_Count || 
                                     attributes.charger_or_dispenser_count ||
                                     attributes.ChargerOrDispenserCount ||
                                     null;
      
      const nozzleCount = attributes.Nozzle_Count || 
                         attributes.nozzle_count ||
                         attributes.NozzleCount ||
                         null;
      
      const address = attributes.Address || 
                     attributes.address ||
                     attributes.ADDRESS ||
                     null;
      
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
      
      const fundingAgencies = attributes.Funding_Agencies || 
                             attributes.funding_agencies ||
                             attributes.FundingAgencies ||
                             null;
      
      const operator = attributes.Operator || 
                      attributes.operator ||
                      attributes.OPERATOR ||
                      null;
      
      const eligible = attributes.Eligible || 
                      attributes.eligible ||
                      attributes.ELIGIBLE ||
                      null;
      
      const liquidGaseous = attributes.Liquid_Gaseous || 
                           attributes.liquid_gaseous ||
                           attributes.LiquidGaseous ||
                           null;
      
      const chargingCapacity = attributes.Charging_Capacity || 
                              attributes.charging_capacity ||
                              attributes.ChargingCapacity ||
                              null;
      
      const maximumCharging = attributes.Maximum_Charging || 
                             attributes.maximum_charging ||
                             attributes.MaximumCharging ||
                             null;
      
      const projectStatus = attributes.ProjectStatus || 
                           attributes.project_status ||
                           attributes.Project_Status ||
                           attributes.projectStatus ||
                           null;
      
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
      
      // Only include stations within the specified radius
      if (distance_miles <= cappedRadius) {
        results.push({
          stationId: stationId ? stationId.toString() : null,
          chargingOrHydrogen,
          chargerOrDispenserCount,
          nozzleCount,
          address,
          latitude,
          longitude,
          fundingAgencies,
          operator,
          eligible,
          liquidGaseous,
          chargingCapacity,
          maximumCharging,
          projectStatus,
          attributes,
          geometry,
          distance_miles: Number(distance_miles.toFixed(2))
        });
      }
    });
    
    // Sort by distance (closest first)
    results.sort((a, b) => (a.distance_miles || Infinity) - (b.distance_miles || Infinity));
    
    console.log(`✅ Found ${results.length} CA Medium and Heavy Duty Infrastructure station(s) within ${cappedRadius} miles`);
    return results;
  } catch (error) {
    console.error('❌ Error querying CA Medium and Heavy Duty Infrastructure:', error);
    return [];
  }
}

