const BASE_URL = 'https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0';

interface WalkabilityData {
  // Core identifiers
  GEOID10: string; // Census block group 12-digit FIPS code (2010)
  GEOID20: string; // Census block group 12-digit FIPS code (2018)
  STATEFP: string; // State FIPS code
  COUNTYFP: string; // County FIPS code
  TRACTCE: string; // Census tract FIPS code
  BLKGRPCE: string; // Census block group FIPS code
  
  // Geographic areas
  CSA: string; // Combined Statistical Area Code
  CSA_Name: string; // Name of CSA
  CBSA: string; // Core-Based Statistical Area FIPS
  CBSA_Name: string; // Name of CBSA
  CBSA_POP: number; // Total population in CBSA
  CBSA_EMP: number; // Total employment in CBSA
  CBSA_WRK: number; // Total workers in CBSA
  
  // Area measurements
  Ac_Total: number; // Total geometric area (acres)
  Ac_Water: number; // Total water area (acres)
  Ac_Land: number; // Total land area (acres)
  Ac_Unpr: number; // Unprotected area (acres)
  
  // Walkability Index (main field)
  NatWalkInd: number; // Walkability Index (1-5.75 scale)
  
  // Demographics
  Households: number; // Number of households
  Workers_1: number; // Number of workers
  Residents: number; // Number of residents
  Drivers: number; // Number of drivers
  Vehicles: number; // Number of vehicles available
  White: number; // Number of white residents
  Male: number; // Number of male residents
  
  // Wage categories
  Lowwage: number; // Number of low wage residents
  Medwage: number; // Number of medium wage residents
  Highwage: number; // Number of high wage residents
  W_P_Lowwage: number; // Percent low wage workers (workplace)
  W_P_Medwage: number; // Percent medium wage workers (workplace)
  W_P_Highwage: number; // Percent high wage workers (workplace)
  
  // Transportation metrics
  GasPrice: number; // 2020 statewide average gas price (cents)
  UPTpercap: number; // Unlinked passenger trips per capita for CBSA
  
  // Walkability components
  D1a: number; // Residential density
  D1c: number; // Employment density
  D3aao: number; // Auto network density
  D3apo: number; // Pedestrian network density
  D4b025: number; // 1/4 mile job accessibility to fixed guideway transit
  D5dei: number; // Regional centrality index - transit
  D4d: number; // Frequency of transit service
  
  // VMT (Vehicle Miles Traveled) models
  NonCom_VMT_Per_Worker: number; // Mean non-commute VMT per worker
  Com_VMT_Per_Worker: number; // Mean commute VMT per worker
  VMT_per_worker: number; // Mean total work-related VMT per worker
  VMT_tot_min: number; // Minimum average daily VMT per worker in county
  VMT_tot_max: number; // Maximum average daily VMT per worker in county
  VMT_tot_avg: number; // Weighted average daily VMT per worker in county
  
  // GHG (Greenhouse Gas) emissions
  GHG_per_worker: number; // Estimated average daily GHG per worker
  Annual_GHG: number; // Total estimated annual GHG per worker
  
  // Regional data
  Region: string; // Region used to normalize VMT
  C_R_Households: number; // Households in county
  C_R_Pop: number; // Residents in county
  C_R_Workers: number; // Workers in county
  C_R_Drivers: number; // Drivers in county
  C_R_Vehicles: number; // Vehicles in county
  C_R_White: number; // Percent white in county
  C_R_Male: number; // Percent male in county
  C_R_Lowwage: number; // Percent low wage workers in county
  C_R_Medwage: number; // Percent medium wage workers in county
  C_R_Highwage: number; // Percent high wage workers in county
  C_R_DrmV: number; // Household drivers minus vehicles, county average
  
  // Additional metrics
  SLC_score: number; // Smart Location Database score
}

export class EPAWalkabilityService {
  private async queryWalkabilityData(lat: number, lon: number): Promise<WalkabilityData | null> {
    const params = new URLSearchParams({
      f: 'json',
      where: '1=1',
      outFields: '*',
      geometry: `${lon},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      returnGeometry: 'false',
      outSR: '4326'
    });

    const url = `${BASE_URL}/query?${params}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Walkability API response:', data);
      if (data.features && data.features.length > 0) {
        const attributes = data.features[0].attributes;
        console.log('Walkability attributes:', attributes);
        
        // Map the attributes to our interface
        return {
          // Core identifiers
          GEOID10: attributes.GEOID10_ || '',
          GEOID20: attributes.GEOID20_ || '',
          STATEFP: attributes.STATEFP_ || '',
          COUNTYFP: attributes.COUNTYFP_ || '',
          TRACTCE: attributes.TRACTCE_ || '',
          BLKGRPCE: attributes.BLKGRPCE_ || '',
          
          // Geographic areas
          CSA: attributes.CSA_ || '',
          CSA_Name: attributes.CSA_Name_ || '',
          CBSA: attributes.CBSA_ || '',
          CBSA_Name: attributes.CBSA_Name_ || '',
          CBSA_POP: attributes.CBSA_POP_ || 0,
          CBSA_EMP: attributes.CBSA_EMP_ || 0,
          CBSA_WRK: attributes.CBSA_WRK_ || 0,
          
          // Area measurements
          Ac_Total: attributes.Ac_Total_ || 0,
          Ac_Water: attributes.Ac_Water_ || 0,
          Ac_Land: attributes.Ac_Land_ || 0,
          Ac_Unpr: attributes.Ac_Unpr_ || 0,
          
          // Walkability Index (main field)
          NatWalkInd: attributes.NatWalkInd || 0,
          
          // Demographics
          Households: attributes.Households_ || 0,
          Workers_1: attributes.Workers_1_ || 0,
          Residents: attributes.Residents_ || 0,
          Drivers: attributes.Drivers_ || 0,
          Vehicles: attributes.Vehicles_ || 0,
          White: attributes.White_ || 0,
          Male: attributes.Male_ || 0,
          
          // Wage categories
          Lowwage: attributes.Lowwage_ || 0,
          Medwage: attributes.Medwage_ || 0,
          Highwage: attributes.Highwage_ || 0,
          W_P_Lowwage: attributes.W_P_Lowwage_ || 0,
          W_P_Medwage: attributes.W_P_Medwage_ || 0,
          W_P_Highwage: attributes.W_P_Highwage_ || 0,
          
          // Transportation metrics
          GasPrice: attributes.GasPrice_ || 0,
          UPTpercap: attributes.UPTpercap_ || 0,
          
          // Walkability components
          D1a: attributes.D1a_ || 0,
          D1c: attributes.D1c_ || 0,
          D3aao: attributes.D3aao_ || 0,
          D3apo: attributes.D3apo_ || 0,
          D4b025: attributes.d4bo25_ || 0,
          D5dei: attributes.d5dei_1_ || 0,
          D4d: attributes.logd4d_ || 0,
          
          // VMT models
          NonCom_VMT_Per_Worker: attributes.NonCom_VMT_Per_Worker_ || 0,
          Com_VMT_Per_Worker: attributes.Com_VMT_Per_Worker_ || 0,
          VMT_per_worker: attributes.VMT_per_worker_ || 0,
          VMT_tot_min: attributes.VMT_tot_min_ || 0,
          VMT_tot_max: attributes.VMT_tot_max_ || 0,
          VMT_tot_avg: attributes.VMT_tot_avg_ || 0,
          
          // GHG emissions
          GHG_per_worker: attributes.GHG_per_worker_ || 0,
          Annual_GHG: attributes.Annual_GHG_ || 0,
          
          // Regional data
          Region: attributes.Region_ || '',
          C_R_Households: attributes.C_R_Households_ || 0,
          C_R_Pop: attributes.C_R_Pop_ || 0,
          C_R_Workers: attributes.C_R_Workers_ || 0,
          C_R_Drivers: attributes.C_R_Drivers_ || 0,
          C_R_Vehicles: attributes.C_R_Vehicles_ || 0,
          C_R_White: attributes.C_R_White_ || 0,
          C_R_Male: attributes.C_R_Male_ || 0,
          C_R_Lowwage: attributes.C_R_Lowwage_ || 0,
          C_R_Medwage: attributes.C_R_Medwage_ || 0,
          C_R_Highwage: attributes.C_R_Highwage_ || 0,
          C_R_DrmV: attributes.C_R_DrmV_ || 0,
          
          // Additional metrics
          SLC_score: attributes.SLC_score_ || 0
        };
      }
      return null;
    } catch (error) {
      console.error('Error querying EPA Walkability data:', error);
      return null;
    }
  }

  private getWalkabilityCategory(walkabilityIndex: number): string {
    if (walkabilityIndex >= 15.26) return 'Most Walkable (15.26-20)';
    if (walkabilityIndex >= 10.51) return 'Above Average Walkable (10.51-15.25)';
    if (walkabilityIndex >= 5.76) return 'Below Average Walkable (5.76-10.50)';
    return 'Least Walkable (1-5.75)';
  }

  async enrichLocation(
    lat: number,
    lon: number,
    selectedEnrichments: string[],
    _poiRadii: Record<string, number>
  ): Promise<Record<string, any>> {
    const enrichments: Record<string, any> = {};

    try {
      // Check if walkability is selected
      if (selectedEnrichments.includes('poi_walkability_index')) {
        const walkabilityData = await this.queryWalkabilityData(lat, lon);
        
        if (walkabilityData) {
          // Main walkability index for summary
          enrichments.walkability_index = walkabilityData.NatWalkInd;
          enrichments.walkability_category = this.getWalkabilityCategory(walkabilityData.NatWalkInd);
          
          // Core geographic data
          enrichments.walkability_geoid10 = walkabilityData.GEOID10;
          enrichments.walkability_geoid20 = walkabilityData.GEOID20;
          enrichments.walkability_csa_name = walkabilityData.CSA_Name;
          enrichments.walkability_cbsa_name = walkabilityData.CBSA_Name;
          enrichments.walkability_cbsa_population = walkabilityData.CBSA_POP;
          enrichments.walkability_cbsa_employment = walkabilityData.CBSA_EMP;
          
          // Area data
          enrichments.walkability_total_acres = walkabilityData.Ac_Total;
          enrichments.walkability_land_acres = walkabilityData.Ac_Land;
          enrichments.walkability_water_acres = walkabilityData.Ac_Water;
          
          // Demographics
          enrichments.walkability_households = walkabilityData.Households;
          enrichments.walkability_residents = walkabilityData.Residents;
          enrichments.walkability_workers = walkabilityData.Workers_1;
          enrichments.walkability_drivers = walkabilityData.Drivers;
          enrichments.walkability_vehicles = walkabilityData.Vehicles;
          
          // Walkability components
          enrichments.walkability_residential_density = walkabilityData.D1a;
          enrichments.walkability_employment_density = walkabilityData.D1c;
          enrichments.walkability_auto_network_density = walkabilityData.D3aao;
          enrichments.walkability_pedestrian_network_density = walkabilityData.D3apo;
          enrichments.walkability_transit_accessibility = walkabilityData.D4b025;
          enrichments.walkability_transit_centrality = walkabilityData.D5dei;
          enrichments.walkability_transit_frequency = walkabilityData.D4d;
          
          // Transportation metrics
          enrichments.walkability_gas_price_cents = walkabilityData.GasPrice;
          enrichments.walkability_transit_trips_per_capita = walkabilityData.UPTpercap;
          
          // VMT data
          enrichments.walkability_commute_vmt_per_worker = walkabilityData.Com_VMT_Per_Worker;
          enrichments.walkability_non_commute_vmt_per_worker = walkabilityData.NonCom_VMT_Per_Worker;
          enrichments.walkability_total_vmt_per_worker = walkabilityData.VMT_per_worker;
          enrichments.walkability_county_vmt_min = walkabilityData.VMT_tot_min;
          enrichments.walkability_county_vmt_max = walkabilityData.VMT_tot_max;
          enrichments.walkability_county_vmt_avg = walkabilityData.VMT_tot_avg;
          
          // GHG emissions
          enrichments.walkability_daily_ghg_per_worker = walkabilityData.GHG_per_worker;
          enrichments.walkability_annual_ghg_per_worker = walkabilityData.Annual_GHG;
          
          // Wage demographics
          enrichments.walkability_low_wage_residents = walkabilityData.Lowwage;
          enrichments.walkability_medium_wage_residents = walkabilityData.Medwage;
          enrichments.walkability_high_wage_residents = walkabilityData.Highwage;
          enrichments.walkability_low_wage_workers_percent = walkabilityData.W_P_Lowwage;
          enrichments.walkability_medium_wage_workers_percent = walkabilityData.W_P_Medwage;
          enrichments.walkability_high_wage_workers_percent = walkabilityData.W_P_Highwage;
          
          // Regional data
          enrichments.walkability_region = walkabilityData.Region;
          enrichments.walkability_county_households = walkabilityData.C_R_Households;
          enrichments.walkability_county_population = walkabilityData.C_R_Pop;
          enrichments.walkability_county_workers = walkabilityData.C_R_Workers;
          enrichments.walkability_county_drivers = walkabilityData.C_R_Drivers;
          enrichments.walkability_county_vehicles = walkabilityData.C_R_Vehicles;
          enrichments.walkability_county_white_percent = walkabilityData.C_R_White;
          enrichments.walkability_county_male_percent = walkabilityData.C_R_Male;
          
          // Additional metrics
          enrichments.walkability_slc_score = walkabilityData.SLC_score;
          
          // Store all raw data for CSV export
          enrichments.walkability_all_attributes = walkabilityData;
        }
      }
    } catch (error) {
      console.error('Error enriching location with walkability data:', error);
    }

    return enrichments;
  }
}

export default EPAWalkabilityService;
