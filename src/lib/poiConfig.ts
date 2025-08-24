export interface POIConfig {
  id: string;
  label: string;
  description: string;
  isPOI: boolean;
  defaultRadius: number;
  category: string;
  section: string;
  csvMapping?: Record<string, string>;
  csvData?: any[];
}

export interface POISection {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// Default POI sections
export const DEFAULT_POI_SECTIONS: POISection[] = [
  {
    id: 'hazards',
    title: 'Hazards & Risk Assessment',
    description: 'Natural and man-made hazard assessments',
    icon: '🌊'
  },
  {
    id: 'community',
    title: 'Community & Services',
    description: 'Schools, hospitals, parks, and community facilities',
    icon: '👥'
  },
  {
    id: 'retail',
    title: 'Retail & Commerce',
    description: 'Shopping, dining, and commercial services',
    icon: '🏢'
  },
  {
    id: 'health',
    title: 'Health & Wellness',
    description: 'Healthcare, fitness, and wellness services',
    icon: '❤️'
  },
  {
    id: 'transportation',
    title: 'Transportation',
    description: 'Public transit, airports, and transportation hubs',
    icon: '🚌'
  },
  {
    id: 'infrastructure',
    title: 'Power & Infrastructure',
    description: 'Utilities, power plants, and infrastructure',
    icon: '⚡'
  },
  {
    id: 'recreation',
    title: 'Recreation & Leisure',
    description: 'Entertainment, sports, and outdoor activities',
    icon: '🎯'
  },
  {
    id: 'quirky',
    title: 'Quirky & Fun',
    description: 'Interesting and unique nearby places',
    icon: '☕'
  }
];

// Default POI types (built-in)
export const DEFAULT_POI_TYPES: POIConfig[] = [
  // Community and Services
  { id: 'poi_schools', label: 'Schools', description: 'Educational institutions', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_hospitals', label: 'Hospitals', description: 'Medical facilities and hospitals', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_parks', label: 'Parks', description: 'Public parks and recreation areas', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_grocery', label: 'Grocery Stores', description: 'Supermarkets and grocery stores', isPOI: true, defaultRadius: 3, category: 'community', section: 'community' },
  { id: 'poi_restaurants', label: 'Restaurants', description: 'Dining establishments', isPOI: true, defaultRadius: 3, category: 'community', section: 'community' },
  { id: 'poi_banks', label: 'Banks & ATMs', description: 'Financial institutions and ATMs', isPOI: true, defaultRadius: 3, category: 'community', section: 'community' },
  { id: 'poi_pharmacies', label: 'Pharmacies', description: 'Drug stores and pharmacies', isPOI: true, defaultRadius: 3, category: 'community', section: 'community' },
  { id: 'poi_worship', label: 'Places of Worship', description: 'Churches, temples, and religious sites', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_doctors_clinics', label: 'Doctors & Clinics', description: 'Medical offices and clinics', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_dentists', label: 'Dentists', description: 'Dental offices and clinics', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_police_stations', label: 'Police Stations', description: 'Law enforcement facilities', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_fire_stations', label: 'Fire Stations', description: 'Fire and emergency services', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_urgent_care', label: 'Urgent Care', description: 'Urgent care facilities', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_cafes_coffee', label: 'Cafes & Coffee', description: 'Coffee shops and cafes', isPOI: true, defaultRadius: 3, category: 'community', section: 'community' },
  { id: 'poi_markets', label: 'Markets', description: 'Marketplaces and bazaars', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  // USDA Local Food Portal - Farmers Markets & Local Food
  { id: 'poi_usda_agritourism', label: 'Agritourism', description: 'Farm tours, pick-your-own, and farm experiences', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_usda_csa', label: 'CSA Programs', description: 'Community Supported Agriculture farm shares', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_usda_farmers_market', label: 'Farmers Markets', description: 'Traditional farmers markets and farm stands', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_usda_food_hub', label: 'Food Hubs', description: 'Local food distribution and aggregation centers', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_usda_onfarm_market', label: 'On-Farm Markets', description: 'Direct farm sales and on-site markets', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  
  // Retail
  { id: 'poi_grocery', label: 'Grocery Stores', description: 'Supermarkets and food markets', isPOI: true, defaultRadius: 3, category: 'retail', section: 'retail' },
  { id: 'poi_restaurants', label: 'Restaurants', description: 'Dining establishments', isPOI: true, defaultRadius: 3, category: 'retail', section: 'retail' },
  { id: 'poi_banks', label: 'Banks & ATMs', description: 'Financial institutions', isPOI: true, defaultRadius: 3, category: 'retail', section: 'retail' },
  { id: 'poi_pharmacies', label: 'Pharmacies', description: 'Drug stores and pharmacies', isPOI: true, defaultRadius: 3, category: 'retail', section: 'retail' },
  { id: 'poi_cafes_coffee', label: 'Cafes & Coffee', description: 'Coffee shops, cafes, and tea houses', isPOI: true, defaultRadius: 3, category: 'retail', section: 'retail' },
  { id: 'poi_markets', label: 'Markets & Bazaars', description: 'Marketplaces, bazaars, fairs, and flea markets', isPOI: true, defaultRadius: 5, category: 'retail', section: 'retail' },
  
  // Health
  { id: 'poi_doctors_clinics', label: 'Doctors & Clinics', description: 'Medical practices', isPOI: true, defaultRadius: 3, category: 'health', section: 'health' },
  { id: 'poi_dentists', label: 'Dentists', description: 'Dental care providers', isPOI: true, defaultRadius: 3, category: 'health', section: 'health' },
  { id: 'poi_gyms', label: 'Gyms & Fitness', description: 'Fitness centers and gyms', isPOI: true, defaultRadius: 3, category: 'health', section: 'health' },
  
  // Transportation
  { id: 'poi_tnm_airports', label: 'Airports', description: 'Commercial and private airports', isPOI: true, defaultRadius: 5, category: 'transportation', section: 'transportation' },
  { id: 'poi_tnm_railroads', label: 'Railroads', description: 'Rail lines and stations', isPOI: true, defaultRadius: 5, category: 'transportation', section: 'transportation' },
  { id: 'poi_train_stations', label: 'Train Stations', description: 'Passenger train stations, subways, and rail hubs', isPOI: true, defaultRadius: 5, category: 'transportation', section: 'transportation' },
  { id: 'poi_bus_stations', label: 'Bus Stations', description: 'Major bus terminals and transfer stations', isPOI: true, defaultRadius: 3, category: 'transportation', section: 'transportation' },
  { id: 'poi_bus_stops', label: 'Bus Stops', description: 'Individual bus stops and platforms', isPOI: true, defaultRadius: 2, category: 'transportation', section: 'transportation' },
  
  // Infrastructure
  { id: 'poi_power_plants_openei', label: 'Power Plants', description: 'Electric power generation facilities', isPOI: true, defaultRadius: 25, category: 'infrastructure', section: 'infrastructure' },
  { id: 'poi_substations', label: 'Substations', description: 'Electrical substations', isPOI: true, defaultRadius: 6, category: 'infrastructure', section: 'infrastructure' },
  { id: 'poi_powerlines', label: 'Powerlines', description: 'Electrical power transmission and distribution lines', isPOI: true, defaultRadius: 5, category: 'infrastructure', section: 'infrastructure' },
  
  // Recreation
  { id: 'poi_tnm_trailheads', label: 'Trailheads', description: 'Hiking trail starting points', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_tnm_trails', label: 'Trails', description: 'Hiking and biking trails', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_cinemas', label: 'Cinemas', description: 'Movie theaters and cinemas', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_theatres', label: 'Theatres', description: 'Live performance venues for plays, concerts, and shows', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_museums_historic', label: 'Museums, Historic Sites & Memorials', description: 'Museums, historic landmarks, memorials, and cultural heritage sites', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_hotels', label: 'Hotels', description: 'Accommodation options', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_golf_courses', label: 'Golf Courses', description: 'Golf courses and country clubs', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_boat_ramps', label: 'Boat Ramps', description: 'Boat ramps and marinas', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  
  // Quirky
  { id: 'poi_breweries', label: 'Breweries', description: 'Craft breweries with names, types, addresses, contact info', isPOI: true, defaultRadius: 5, category: 'quirky', section: 'quirky' },
  { id: 'poi_wikipedia', label: 'Wikipedia Articles', description: 'Haunted sites, historic oddities, museums, and quirky landmarks with intelligent categorization', isPOI: true, defaultRadius: 5, category: 'quirky', section: 'quirky' },

  // Hazards
  { id: 'poi_fema_flood_zones', label: 'FEMA Flood Zones', description: 'FEMA National Flood Hazard Layer - flood zone classification and risk assessment', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  
  // EPA FRS Environmental Hazards
  { id: 'poi_epa_brownfields', label: 'EPA Brownfields', description: 'Assessment, Cleanup and Redevelopment Exchange System (ACRES) - brownfield redevelopment sites', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_superfund', label: 'EPA Superfund Sites', description: 'Hazardous waste sites including National Priorities List (NPL) Superfund locations', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_rcra', label: 'EPA RCRA Facilities', description: 'Resource Conservation and Recovery Act - hazardous waste generators, treaters, storers, transporters, and disposers', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_tri', label: 'EPA TRI Facilities', description: 'Toxics Release Inventory - facilities reporting releases of listed toxic chemicals', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_npdes', label: 'EPA NPDES Permits', description: 'National Pollutant Discharge Elimination System - permitted wastewater discharge facilities', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_air', label: 'EPA Air Facilities', description: 'Air Facility System (AFS/ICIS-AIR) - stationary sources of air pollution', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_radiation', label: 'EPA Radiation Facilities', description: 'RADINFO - facilities dealing with radioactivity or radiation', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_power', label: 'EPA Power Generation', description: 'EGRID/EIA-860 - power plant and generation facilities', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_oil_spill', label: 'EPA Oil Spill Response', description: 'SPCC/FRP - countermeasure and facility response plan subject facilities', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' }
];

class POIConfigManager {
  private static instance: POIConfigManager;
  private customPOIs: Map<string, POIConfig> = new Map();
  private storageKey = 'custom_poi_configs';

  private constructor() {
    this.loadCustomPOIs();
  }

  static getInstance(): POIConfigManager {
    if (!POIConfigManager.instance) {
      POIConfigManager.instance = new POIConfigManager();
    }
    return POIConfigManager.instance;
  }

  // Get all POI types (built-in + custom)
  getAllPOITypes(): POIConfig[] {
    return [...DEFAULT_POI_TYPES, ...Array.from(this.customPOIs.values())];
  }

  // Get POI types by section
  getPOITypesBySection(sectionId: string): POIConfig[] {
    return this.getAllPOITypes().filter(poi => poi.section === sectionId);
  }

  // Get all sections with their POI types
  getAllSections(): POISection[] {
    // Only return built-in sections, no custom section for regular users
    return DEFAULT_POI_SECTIONS.filter(section => section.id !== 'custom');
  }

  // Add a new custom POI type
  addCustomPOI(poiConfig: POIConfig): void {
    this.customPOIs.set(poiConfig.id, poiConfig);
    this.saveCustomPOIs();
  }

  // Remove a custom POI type
  removeCustomPOI(poiId: string): boolean {
    const removed = this.customPOIs.delete(poiId);
    if (removed) {
      this.saveCustomPOIs();
    }
    return removed;
  }

  // Get a specific POI type
  getPOIType(poiId: string): POIConfig | undefined {
    return this.getAllPOITypes().find(poi => poi.id === poiId);
  }

  // Check if a POI type is custom
  isCustomPOI(poiId: string): boolean {
    return this.customPOIs.has(poiId);
  }

  // Get custom POI data for enrichment service
  getCustomPOIData(poiId: string): { poi: POIConfig; data: any[]; mapping: Record<string, string> } | null {
    const poi = this.customPOIs.get(poiId);
    if (!poi || !poi.csvData || !poi.csvMapping) {
      return null;
    }
    
    return {
      poi,
      data: poi.csvData,
      mapping: poi.csvMapping
    };
  }

  // Load custom POIs from localStorage
  private loadCustomPOIs(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const customPOIsArray = JSON.parse(stored);
        this.customPOIs.clear();
        customPOIsArray.forEach((poi: POIConfig) => {
          this.customPOIs.set(poi.id, poi);
        });
      }
    } catch (error) {
      console.error('Error loading custom POI configs:', error);
    }
  }

  // Save custom POIs to localStorage
  private saveCustomPOIs(): void {
    try {
      const customPOIsArray = Array.from(this.customPOIs.values());
      localStorage.setItem(this.storageKey, JSON.stringify(customPOIsArray));
    } catch (error) {
      console.error('Error saving custom POI configs:', error);
    }
  }
}

export const poiConfigManager = POIConfigManager.getInstance();
