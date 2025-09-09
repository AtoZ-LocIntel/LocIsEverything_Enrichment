// Remove unused import

const BASE_URL = 'https://geodata.epa.gov/arcgis/rest/services/OCSPP/TRI_NA_WhereYouLive_2023/MapServer';

// TRI Layer IDs
const TRI_LAYERS = {
  // Proximity Queries (Facilities)
  FACILITIES: 30,
  FACILITIES_TRIBAL_LAND: 31,
  ALL_FACILITIES: 32,
  ALL_MANUFACTURING: 33,
  METAL_MINING: 34,
  ELECTRIC_UTILITY: 35,
  WOOD_PRODUCTS: 36,
  AUTOMOTIVE_MANUFACTURING: 37,
  FACILITIES_PFAS: 38,
  FACILITIES_LEAD: 39,
  FACILITIES_DIOXINS: 40,
  FACILITIES_ETHYLENE_OXIDE: 41,
  FACILITIES_CARCINOGENS: 42,
  FACILITIES_MERCURY: 43,
  FEDERAL_FACILITIES: 44,
  
  // Point-in-Poly Queries (County Data)
  COUNTIES: 6,
  COUNTIES_TOTAL_RELEASES: 7,
  COUNTIES_AIR_RELEASES: 8,
  COUNTIES_WATER_RELEASES: 9,
  COUNTIES_LAND_RELEASES: 10,
  COUNTIES_POPULATION: 11
};

// Remove unused constants

interface TRIFacility {
  FACILITY_NAME: string;
  ADDRESS: string;
  CITY: string;
  STATE: string;
  ZIP_CODE: string;
  LATITUDE: number;
  LONGITUDE: number;
  INDUSTRY_SECTOR: string;
  CHEMICAL_NAME?: string;
  TOTAL_RELEASES?: number;
  AIR_RELEASES?: number;
  WATER_RELEASES?: number;
  LAND_RELEASES?: number;
  DISTANCE_MILES?: number;
}

interface TRICountyData {
  COUNTY_NAME: string;
  STATE: string;
  TOTAL_RELEASES?: number;
  AIR_RELEASES?: number;
  WATER_RELEASES?: number;
  LAND_RELEASES?: number;
  POPULATION_2020?: number;
}

export class EPATRIService {
  private async queryLayer(
    layerId: number,
    lat: number,
    lon: number,
    radiusMiles: number = 5
  ): Promise<any[]> {
    const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
    
    const params = new URLSearchParams({
      f: 'json',
      where: '1=1',
      outFields: '*',
      geometry: `${lon},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      distance: radiusMeters.toString(),
      units: 'esriSRUnit_Meter',
      returnGeometry: 'true',
      outSR: '4326'
    });

    const url = `${BASE_URL}/${layerId}/query?${params}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.features || [];
    } catch (error) {
      console.error(`Error querying TRI layer ${layerId}:`, error);
      return [];
    }
  }

  private async queryCountyData(lat: number, lon: number): Promise<TRICountyData | null> {
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

    const url = `${BASE_URL}/${TRI_LAYERS.COUNTIES}/query?${params}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const county = data.features[0].attributes;
        return {
          COUNTY_NAME: county.COUNTY_NAME || 'Unknown',
          STATE: county.STATE || 'Unknown',
          TOTAL_RELEASES: county.TOTAL_RELEASES || 0,
          AIR_RELEASES: county.AIR_RELEASES || 0,
          WATER_RELEASES: county.WATER_RELEASES || 0,
          LAND_RELEASES: county.LAND_RELEASES || 0,
          POPULATION_2020: county.POPULATION_2020 || 0
        };
      }
      return null;
    } catch (error) {
      console.error('Error querying TRI county data:', error);
      return null;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async enrichLocation(
    lat: number,
    lon: number,
    selectedEnrichments: string[],
    poiRadii: Record<string, number>
  ): Promise<Record<string, any>> {
    const enrichments: Record<string, any> = {};

    try {
      // Get county data first
      const countyData = await this.queryCountyData(lat, lon);
      if (countyData) {
        enrichments.tri_county_name = countyData.COUNTY_NAME;
        enrichments.tri_county_state = countyData.STATE;
        enrichments.tri_county_total_releases = countyData.TOTAL_RELEASES;
        enrichments.tri_county_air_releases = countyData.AIR_RELEASES;
        enrichments.tri_county_water_releases = countyData.WATER_RELEASES;
        enrichments.tri_county_land_releases = countyData.LAND_RELEASES;
        enrichments.tri_county_population_2020 = countyData.POPULATION_2020;
      }

      // Process facility layers based on selected enrichments
      const facilityLayers = [
        { key: 'tri_facilities', layerId: TRI_LAYERS.FACILITIES, radius: poiRadii.tri_facilities || 5 },
        { key: 'tri_facilities_tribal', layerId: TRI_LAYERS.FACILITIES_TRIBAL_LAND, radius: poiRadii.tri_facilities_tribal || 5 },
        { key: 'tri_all_facilities', layerId: TRI_LAYERS.ALL_FACILITIES, radius: poiRadii.tri_all_facilities || 5 },
        { key: 'tri_manufacturing', layerId: TRI_LAYERS.ALL_MANUFACTURING, radius: poiRadii.tri_manufacturing || 5 },
        { key: 'tri_metal_mining', layerId: TRI_LAYERS.METAL_MINING, radius: poiRadii.tri_metal_mining || 5 },
        { key: 'tri_electric_utility', layerId: TRI_LAYERS.ELECTRIC_UTILITY, radius: poiRadii.tri_electric_utility || 5 },
        { key: 'tri_wood_products', layerId: TRI_LAYERS.WOOD_PRODUCTS, radius: poiRadii.tri_wood_products || 5 },
        { key: 'tri_automotive', layerId: TRI_LAYERS.AUTOMOTIVE_MANUFACTURING, radius: poiRadii.tri_automotive || 5 },
        { key: 'tri_pfas', layerId: TRI_LAYERS.FACILITIES_PFAS, radius: poiRadii.tri_pfas || 5 },
        { key: 'tri_lead', layerId: TRI_LAYERS.FACILITIES_LEAD, radius: poiRadii.tri_lead || 5 },
        { key: 'tri_dioxins', layerId: TRI_LAYERS.FACILITIES_DIOXINS, radius: poiRadii.tri_dioxins || 5 },
        { key: 'tri_ethylene_oxide', layerId: TRI_LAYERS.FACILITIES_ETHYLENE_OXIDE, radius: poiRadii.tri_ethylene_oxide || 5 },
        { key: 'tri_carcinogens', layerId: TRI_LAYERS.FACILITIES_CARCINOGENS, radius: poiRadii.tri_carcinogens || 5 },
        { key: 'tri_mercury', layerId: TRI_LAYERS.FACILITIES_MERCURY, radius: poiRadii.tri_mercury || 5 },
        { key: 'tri_federal', layerId: TRI_LAYERS.FEDERAL_FACILITIES, radius: poiRadii.tri_federal || 5 }
      ];

      for (const facility of facilityLayers) {
        if (selectedEnrichments.includes(facility.key)) {
          const features = await this.queryLayer(facility.layerId, lat, lon, facility.radius);
          
          // Process facilities
          const facilities: TRIFacility[] = features.map((feature: any) => {
            const attrs = feature.attributes;
            const geom = feature.geometry;
            
            return {
              FACILITY_NAME: attrs.FACILITY_NAME || 'Unknown',
              ADDRESS: attrs.ADDRESS || '',
              CITY: attrs.CITY || '',
              STATE: attrs.STATE || '',
              ZIP_CODE: attrs.ZIP_CODE || '',
              LATITUDE: geom?.y || attrs.LATITUDE || 0,
              LONGITUDE: geom?.x || attrs.LONGITUDE || 0,
              INDUSTRY_SECTOR: attrs.INDUSTRY_SECTOR || '',
              CHEMICAL_NAME: attrs.CHEMICAL_NAME || '',
              TOTAL_RELEASES: attrs.TOTAL_RELEASES || 0,
              AIR_RELEASES: attrs.AIR_RELEASES || 0,
              WATER_RELEASES: attrs.WATER_RELEASES || 0,
              LAND_RELEASES: attrs.LAND_RELEASES || 0,
              DISTANCE_MILES: this.calculateDistance(
                lat, lon, 
                geom?.y || attrs.LATITUDE || 0, 
                geom?.x || attrs.LONGITUDE || 0
              )
            };
          });

          // Add count and detailed data
          enrichments[`${facility.key}_count`] = facilities.length;
          enrichments[`${facility.key}_all_pois`] = facilities;
          
          // Add summary statistics
          if (facilities.length > 0) {
            enrichments[`${facility.key}_total_releases`] = facilities.reduce((sum, f) => sum + (f.TOTAL_RELEASES || 0), 0);
            enrichments[`${facility.key}_air_releases`] = facilities.reduce((sum, f) => sum + (f.AIR_RELEASES || 0), 0);
            enrichments[`${facility.key}_water_releases`] = facilities.reduce((sum, f) => sum + (f.WATER_RELEASES || 0), 0);
            enrichments[`${facility.key}_land_releases`] = facilities.reduce((sum, f) => sum + (f.LAND_RELEASES || 0), 0);
            enrichments[`${facility.key}_closest_distance`] = Math.min(...facilities.map(f => f.DISTANCE_MILES || Infinity));
          }
        }
      }

    } catch (error) {
      console.error('Error enriching location with TRI data:', error);
    }

    return enrichments;
  }
}

export default EPATRIService;
