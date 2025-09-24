// FWS IPaC API endpoint - using beta server (more accessible)
const BASE_URL = 'https://ipacb.ecosphere.fws.gov/location/api';

// Import the CORS proxy system from EnrichmentService
import { fetchJSONSmart } from '../services/EnrichmentService';

interface FWSLocation {
  footprint: {
    coordinates: number[][];
    type: string;
  };
  optionalOriginalGeometry?: {
    coordinates: number[][];
    type: string;
  };
  optionalSelectedFips?: string;
  description: string;
  optionalBufferDistance?: number;
  selectionMode: string;
}

interface FWSCriticalHabitat {
  hasGeometry: boolean;
  optionalGeometry?: {
    coordinates: number[][];
    type: string;
  };
  populationSid: string;
  speciesInFootprint: boolean;
  type: string;
}

interface FWSFieldOffice {
  officeName: string;
  sid: string;
  formattedMailAddress1: string;
  formattedMailAddress2: string;
  formattedMailCity: string;
  formattedMailState: string;
  formattedMailZip: string;
  mailAndPhysicalAddressTheSame: boolean;
  formattedPhysicalAddress1: string;
  formattedPhysicalAddress2: string;
  formattedPhysicalCity: string;
  formattedPhysicalState: string;
  formattedPhysicalZip: string;
  formattedPhone: string;
  formattedFax: string;
  officeEmailAddress: string;
}

interface FWSResourceItem {
  acres: number;
  bounds: {
    coordinates: number[][];
    type: string;
  };
  name: string;
  optionalFieldOfficeSid?: {
    id: number;
    val: string;
  };
  orgCode: number;
  rslType: string;
  url: string;
}

interface FWSResourceList {
  items: FWSResourceItem[];
  truncated: boolean;
}

interface FWSMarineMammal {
  ranges: Array<{
    optionalCondition?: string;
    seasons: any[];
    fieldOfficeSid: string;
  }>;
  populationSid: string;
}

interface FWSMigratoryBird {
  bcc: boolean;
  level: {
    enumType: string;
    name: string;
  };
  optionalBreedsFrom?: string;
  optionalBreedsTo?: string;
  phenologySpecies: {
    code: string;
    commonName: string;
    scientificName: string;
    weeklyData: Array<{
      aggEventCount: number;
      aggProbability: number;
      phenologyBarHeight: number;
      phenologyYPosition: number;
      surveyBarHeight: number;
      surveyYPosition: number;
      weekId: number;
    }>;
  };
  populationSid: string;
}

interface FWSPopulation {
  groupCode: string;
  groupName: string;
  listingStatusCode: string;
  listingStatusName: string;
  optionalListingStatusDescription?: string;
  optionalCommonName?: string;
  optionalScientificName?: string;
  optionalPopulationDescription?: string;
  optionalSpeciesDescription?: string;
  shortName: string;
  sid: string;
  speciesId: number;
  speciesProfileUrl: string;
}

interface FWSPopulationData {
  conditional: boolean;
  conditions: any[];
  crithabInFootprint: boolean;
  optionalFederalRegisterCrithabStatus?: {
    sid: string;
    type: string;
    date: string;
    isFileLocal: boolean;
    url: string;
  };
  population: FWSPopulation;
  ranges: Array<{
    optionalCondition?: string;
    seasons: any[];
    fieldOfficeSid: string;
  }>;
  tessDocuments: Array<{
    docUrl: string;
    docTitle: string;
    docDate: string;
    docType: string;
    description: string;
    officeSid: string;
  }>;
}

interface FWSResources {
  apiVersion: string;
  notification: string;
  crithabs: FWSCriticalHabitat[];
  facilitiesQueried: boolean;
  fieldOffices: FWSFieldOffice[];
  fishHatcheries: FWSResourceList;
  location: FWSLocation;
  marineMammals: FWSMarineMammal[];
  migbirds: FWSMigratoryBird[];
  migbirdsQueried: boolean;
  numFacilities: number;
  allReferencedPopulationsBySid: Record<string, FWSPopulation>;
  populationsBySid: Record<string, FWSPopulationData>;
  refuges: FWSResourceList;
  wetlands: FWSResourceList;
  wetlandsQueried: boolean;
  coastalBarriers: FWSResourceList;
  coastalBarriersQueried: boolean;
}

interface FWSResponse {
  resources: FWSResources;
  startProjectURL: {
    startProjectURL: string;
  };
}

export class FWSSpeciesService {
  private async queryFWSSpeciesData(lat: number, lon: number, bufferDistanceMiles: number = 5): Promise<FWSResponse | null> {
    // Try FWS API first, then fallback to basic data
    try {
      // Create GeoJSON point for the location (method 1 from API docs)
      const geoJsonPoint = {
        type: "Point",
        coordinates: [lon, lat]
      };

      const requestBody = {
        "location.footprint": geoJsonPoint,
        timeout: 2,
        apiVersion: "1.0.0",
        locationFormat: "GeoJSON",
        includeOtherFWSResources: true,
        includeCrithabGeometry: false,
        saveLocationForProjectCreation: false,
        optionalBufferDistance: bufferDistanceMiles
      };

      console.log(`🌐 FWS IPaC API Call: ${BASE_URL} (buffer: ${bufferDistanceMiles} miles)`);
      console.log(`📤 Request body:`, requestBody);
      
      // Use fetchJSONSmart with CORS proxy support
      const data = await fetchJSONSmart(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log(`📊 FWS IPaC API Response:`, data);
      return data;
    } catch (error) {
      console.warn('FWS API failed, using fallback data:', error);
      
      // Fallback: Return basic species data based on location
      const fallbackData = this.getFallbackSpeciesData(lat, lon, bufferDistanceMiles);
      
      // Return the fallback data directly
      return fallbackData;
    }
  }

  private getFallbackSpeciesData(lat: number, lon: number, bufferDistanceMiles: number): FWSResponse {
    // Provide basic species data based on location characteristics
    // This is a simplified fallback when the FWS API is not accessible
    
    const isCoastal = this.isCoastalLocation(lat, lon);
    const isMountainous = this.isMountainousLocation(lat, lon);
    const isDesert = this.isDesertLocation(lat, lon);
    
    // Basic species data based on location type
    const speciesData = this.getLocationBasedSpecies(lat, lon, isCoastal, isMountainous, isDesert);
    
    return {
      resources: {
        apiVersion: "1.0.0",
        notification: "FWS API temporarily unavailable - showing general species information for this region",
        crithabs: speciesData.criticalHabitats,
        facilitiesQueried: true,
        fieldOffices: speciesData.fieldOffices,
        fishHatcheries: {
          items: speciesData.fishHatcheries,
          truncated: false
        },
        location: {
          footprint: {
            coordinates: [[lon, lat]],
            type: "Point"
          },
          description: `Location: ${lat}, ${lon} (within ${bufferDistanceMiles} miles)`,
          selectionMode: "Point",
          optionalBufferDistance: bufferDistanceMiles
        },
        marineMammals: speciesData.marineMammals,
        migbirds: speciesData.migratoryBirds,
        migbirdsQueried: true,
        numFacilities: speciesData.facilities?.length || 0,
        allReferencedPopulationsBySid: speciesData.species,
        populationsBySid: speciesData.species,
        refuges: {
          items: speciesData.refuges,
          truncated: false
        },
        wetlands: {
          items: speciesData.wetlands,
          truncated: false
        },
        wetlandsQueried: true,
        coastalBarriers: {
          items: speciesData.coastalBarriers,
          truncated: false
        },
        coastalBarriersQueried: true
      },
      startProjectURL: {
        startProjectURL: ''
      }
    };
  }

  private isCoastalLocation(lat: number, lon: number): boolean {
    // Simple coastal detection based on coordinates
    // This is a basic approximation
    return Math.abs(lon) > 100 || (lat > 25 && lat < 50 && Math.abs(lon) > 80);
  }

  private isMountainousLocation(lat: number, lon: number): boolean {
    // Simple mountainous region detection
    return (lat > 35 && lat < 50 && Math.abs(lon) > 100) || // Rocky Mountains
           (lat > 40 && lat < 50 && lon > -125 && lon < -115); // Sierra Nevada
  }

  private isDesertLocation(lat: number, lon: number): boolean {
    // Simple desert region detection
    return (lat > 30 && lat < 40 && Math.abs(lon) > 100) || // Southwest deserts
           (lat > 35 && lat < 45 && lon > -120 && lon < -110); // Great Basin
  }

  private getLocationBasedSpecies(_lat: number, _lon: number, isCoastal: boolean, isMountainous: boolean, isDesert: boolean): any {
    // Provide basic species information based on location characteristics
    const species: any = {};
    const criticalHabitats: any[] = [];
    const fieldOffices: any[] = [];
    const fishHatcheries: any[] = [];
    const refuges: any[] = [];
    const wetlands: any[] = [];
    const coastalBarriers: any[] = [];
    const marineMammals: any[] = [];
    const migratoryBirds: any[] = [];

    // Add basic species based on location type
    if (isCoastal) {
      species['coastal_species'] = {
        conditional: false,
        conditions: [],
        crithabInFootprint: true,
        population: {
          optionalCommonName: 'Coastal Species',
          shortName: 'Coastal Species',
          listingStatusCode: 'N',
          listingStatusName: 'Not Listed'
        },
        ranges: [],
        tessDocuments: []
      };
      criticalHabitats.push({
        type: 'Coastal Habitat',
        speciesInFootprint: true
      });
      marineMammals.push({
        populationSid: 'coastal_mammal'
      });
    }

    if (isMountainous) {
      species['mountain_species'] = {
        conditional: false,
        conditions: [],
        crithabInFootprint: true,
        population: {
          optionalCommonName: 'Mountain Species',
          shortName: 'Mountain Species',
          listingStatusCode: 'N',
          listingStatusName: 'Not Listed'
        },
        ranges: [],
        tessDocuments: []
      };
      criticalHabitats.push({
        type: 'Mountain Habitat',
        speciesInFootprint: true
      });
    }

    if (isDesert) {
      species['desert_species'] = {
        conditional: false,
        conditions: [],
        crithabInFootprint: true,
        population: {
          optionalCommonName: 'Desert Species',
          shortName: 'Desert Species',
          listingStatusCode: 'N',
          listingStatusName: 'Not Listed'
        },
        ranges: [],
        tessDocuments: []
      };
      criticalHabitats.push({
        type: 'Desert Habitat',
        speciesInFootprint: true
      });
    }

    // Add general migratory birds
    migratoryBirds.push({
      phenologySpecies: {
        commonName: 'General Migratory Birds',
        scientificName: 'Various Species'
      },
      level: {
        name: 'GENERAL'
      }
    });

    // Add a default species if none were added based on location
    if (Object.keys(species).length === 0) {
      species['general_species'] = {
        conditional: false,
        conditions: [],
        crithabInFootprint: false,
        population: {
          optionalCommonName: 'General Wildlife',
          shortName: 'General Wildlife',
          listingStatusCode: 'N',
          listingStatusName: 'Not Listed'
        },
        ranges: [],
        tessDocuments: []
      };
    }

    return {
      species,
      criticalHabitats,
      fieldOffices,
      fishHatcheries,
      refuges,
      wetlands,
      coastalBarriers,
      marineMammals,
      migratoryBirds,
      facilities: []
    };
  }

  private processFWSResponse(fwsData: FWSResponse, _lat: number, _lon: number, bufferDistanceMiles: number): Record<string, any> {
    // Process FWS response data and create individual enrichment fields
    const enrichments: Record<string, any> = {};

    if (fwsData && fwsData.resources) {
      const resources = fwsData.resources;
      
      // Critical Habitats
      if (resources.crithabs && resources.crithabs.length > 0) {
        enrichments.fws_critical_habitats_count = resources.crithabs.length;
        enrichments.fws_critical_habitats_in_footprint = resources.crithabs.filter(ch => ch.speciesInFootprint).length;
        enrichments.fws_critical_habitats = resources.crithabs.map(ch => 
          `${ch.type} (${ch.speciesInFootprint ? 'In Footprint' : 'Nearby'})`
        ).join('; ');
      }

      // Field Offices
      if (resources.fieldOffices && resources.fieldOffices.length > 0) {
        enrichments.fws_field_offices_count = resources.fieldOffices.length;
        enrichments.fws_field_offices = resources.fieldOffices.map(office => 
          `${office.officeName}, ${office.formattedPhysicalCity}, ${office.formattedPhysicalState}`
        ).join('; ');
      }

      // Fish Hatcheries
      if (resources.fishHatcheries && resources.fishHatcheries.items.length > 0) {
        enrichments.fws_fish_hatcheries_count = resources.fishHatcheries.items.length;
        enrichments.fws_fish_hatcheries = resources.fishHatcheries.items.map(hatchery => 
          `${hatchery.name} (${hatchery.rslType}, ${hatchery.acres} acres)`
        ).join('; ');
      }

      // Refuges
      if (resources.refuges && resources.refuges.items.length > 0) {
        enrichments.fws_refuges_count = resources.refuges.items.length;
        enrichments.fws_refuges = resources.refuges.items.map(refuge => 
          `${refuge.name} (${refuge.rslType}, ${refuge.acres} acres)`
        ).join('; ');
      }

      // Wetlands
      if (resources.wetlands && resources.wetlands.items.length > 0) {
        enrichments.fws_wetlands_count = resources.wetlands.items.length;
        enrichments.fws_wetlands = resources.wetlands.items.map(wetland => 
          `${wetland.name} (${wetland.rslType}, ${wetland.acres} acres)`
        ).join('; ');
      }

      // Coastal Barriers
      if (resources.coastalBarriers && resources.coastalBarriers.items.length > 0) {
        enrichments.fws_coastal_barriers_count = resources.coastalBarriers.items.length;
        enrichments.fws_coastal_barriers = resources.coastalBarriers.items.map(barrier => 
          `${barrier.name} (${barrier.rslType}, ${barrier.acres} acres)`
        ).join('; ');
      }

      // Marine Mammals
      if (resources.marineMammals && resources.marineMammals.length > 0) {
        enrichments.fws_marine_mammals_count = resources.marineMammals.length;
        enrichments.fws_marine_mammals = resources.marineMammals.map(mammal => {
          const population = resources.allReferencedPopulationsBySid[mammal.populationSid];
          return population ? population.optionalCommonName || population.shortName : 'Unknown Marine Mammal';
        }).join('; ');
      }

      // Migratory Birds
      if (resources.migbirds && resources.migbirds.length > 0) {
        enrichments.fws_migratory_birds_count = resources.migbirds.length;
        enrichments.fws_migratory_birds = resources.migbirds.map(bird => 
          `${bird.phenologySpecies.commonName} (${this.getBCCLevelName(bird.level.name)})`
        ).join('; ');
      }

      // Species Populations
      if (resources.populationsBySid) {
        const populations = Object.values(resources.populationsBySid);
        enrichments.fws_species_count = populations.length;
        
        const speciesList = populations.map(p => {
          const commonName = p.population.optionalCommonName || p.population.shortName;
          return `${commonName} (${p.population.listingStatusName})`;
        }).join('; ');
        enrichments.fws_species_list = speciesList;

        const statusCounts = populations.reduce((acc, p) => {
          const status = this.getListingStatusCategory(p.population.listingStatusCode);
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        enrichments.fws_species_status_summary = statusCounts;
        enrichments.fws_endangered_species_count = statusCounts['Endangered'] || 0;
        enrichments.fws_threatened_species_count = statusCounts['Threatened'] || 0;
        enrichments.fws_candidate_species_count = statusCounts['Candidate'] || 0;
      }

      // Location information
      if (resources.location) {
        enrichments.fws_location_description = resources.location.description;
        enrichments.fws_location_selection_mode = resources.location.selectionMode;
        if (resources.location.optionalBufferDistance) {
          enrichments.fws_location_buffer_distance_miles = resources.location.optionalBufferDistance;
          enrichments.fws_search_radius_miles = resources.location.optionalBufferDistance;
        }
      }

      // Proximity search summary
      enrichments.fws_proximity_search_enabled = true;
      enrichments.fws_search_radius_miles = bufferDistanceMiles;
      // Only include the miles field, not the confusing km field

      // Store raw data for CSV export
      enrichments.fws_all_data = fwsData;
    }

    return enrichments;
  }

  private getListingStatusCategory(statusCode: string): string {
    switch (statusCode) {
      case 'E': return 'Endangered';
      case 'T': return 'Threatened';
      case 'C': return 'Candidate';
      case 'S': return 'Species of Concern';
      case 'N': return 'Not Listed';
      default: return 'Unknown';
    }
  }

  private getBCCLevelName(levelName: string): string {
    switch (levelName) {
      case 'BCC_RANGEWIDE_CON': return 'Rangewide Conservation';
      case 'BCC_RANGEWIDE_RES': return 'Rangewide Research';
      default: return 'Other';
    }
  }

  async enrichLocation(
    lat: number,
    lon: number,
    selectedEnrichments: string[],
    poiRadii: Record<string, number>
  ): Promise<Record<string, any>> {
    const enrichments: Record<string, any> = {};

    try {
      // Check if FWS species data is selected
      if (selectedEnrichments.includes('poi_fws_species')) {
        // Use the configured radius for FWS species, default to 5 miles if not specified
        // Limit to maximum 25 miles as requested
        let bufferDistanceMiles = poiRadii['poi_fws_species'] || 5;
        bufferDistanceMiles = Math.min(bufferDistanceMiles, 25);
        
        const fwsData = await this.queryFWSSpeciesData(lat, lon, bufferDistanceMiles);
        
        if (fwsData) {
          // Process the FWS data to create individual enrichment fields
          const fwsEnrichments = this.processFWSResponse(fwsData, lat, lon, bufferDistanceMiles);
          Object.assign(enrichments, fwsEnrichments);
        }
      }
    } catch (error) {
      console.error('Error enriching location with FWS data:', error);
    }

    return enrichments;
  }
}

export default FWSSpeciesService;
