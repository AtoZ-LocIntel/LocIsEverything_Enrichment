export interface POIConfig {
  id: string;
  label: string;
  description: string;
  isPOI: boolean;
  defaultRadius: number;
  maxRadius?: number;
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
    title: 'Human Caused Hazards',
    description: 'Man-made environmental hazards and pollution sources',
    icon: '🌊'
  },
  {
    id: 'wildfire',
    title: 'Natural Hazards',
    description: 'Natural hazard assessments including wildfire, flood, volcano, and earthquake risk',
    icon: 'natural_hazards.webp'
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
    id: 'natural_resources',
    title: 'Natural Resources',
    description: 'Beaches, water bodies, mountains, and natural features',
    icon: '🏔️'
  },
  {
    id: 'public_lands',
    title: 'Public Lands & Protected Areas',
    description: 'Comprehensive coverage of public lands, parks, and protected areas',
    icon: '🏞️'
  },
  {
    id: 'quirky',
    title: 'Quirky & Fun',
    description: 'Interesting and unique nearby places',
    icon: '☕'
  },
  {
    id: 'at',
    title: 'Appalachian Trail',
    description: 'Appalachian Trail facilities, infrastructure, and trail features',
    icon: 'at.webp'
  },
  {
    id: 'pct',
    title: 'Pacific Crest Trail',
    description: 'Pacific Crest Trail facilities, infrastructure, and trail features',
    icon: 'pct.webp'
  },
  {
    id: 'nh',
    title: 'New Hampshire Open Data',
    description: 'New Hampshire state open data services and layers',
    icon: 'newhampshire.webp'
  },
  {
    id: 'ma',
    title: 'Massachusetts Open Data',
    description: 'Massachusetts state open data services and layers',
    icon: 'MA.webp'
  },
  {
    id: 'ri',
    title: 'Rhode Island Open Data',
    description: 'Rhode Island state open data services and layers',
    icon: 'RI.webp'
  },
  {
    id: 'ct',
    title: 'Connecticut Open Data',
    description: 'Connecticut state open data services and layers',
    icon: 'CT.webp'
  },
  {
    id: 'ny',
    title: 'New York Open Data',
    description: 'New York state open data services and layers',
    icon: 'NY.webp'
  },
  {
    id: 'vt',
    title: 'Vermont Open Data',
    description: 'Vermont state open data services and layers',
    icon: 'VT.webp'
  },
  {
    id: 'me',
    title: 'Maine Open Data',
    description: 'Maine state open data services and layers',
    icon: 'ME.webp'
  },
  {
    id: 'nj',
    title: 'New Jersey Open Data',
    description: 'New Jersey state open data services and layers',
    icon: 'NJ.webp'
  },
  {
    id: 'pa',
    title: 'Pennsylvania Open Data',
    description: 'Pennsylvania state open data services and layers',
    icon: 'PA.webp'
  },
  {
    id: 'de',
    title: 'Delaware Open Data',
    description: 'Delaware state open data services and layers',
    icon: 'DE.webp'
  }
];

// Default POI types (built-in)
export const DEFAULT_POI_TYPES: POIConfig[] = [
  // Community and Services
  { id: 'poi_gas_stations', label: 'Gas Stations', description: 'Gas/petrol stations via OSM Overpass API', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
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
  { id: 'poi_bus', label: 'Bus', description: 'Bus stops and bus stations', isPOI: true, defaultRadius: 3, category: 'transportation', section: 'transportation' },
  { id: 'poi_train', label: 'Train', description: 'Train stations, halts, and platforms', isPOI: true, defaultRadius: 5, category: 'transportation', section: 'transportation' },
  { id: 'poi_subway_metro', label: 'Subway/Metro', description: 'Subway stations, entrances, and platforms', isPOI: true, defaultRadius: 5, category: 'transportation', section: 'transportation' },
  { id: 'poi_tram', label: 'Tram', description: 'Tram stops and platforms', isPOI: true, defaultRadius: 5, category: 'transportation', section: 'transportation' },
  { id: 'poi_monorail', label: 'Monorail', description: 'Monorail stations and platforms', isPOI: true, defaultRadius: 5, category: 'transportation', section: 'transportation' },
  { id: 'poi_aerialway', label: 'Aerialway', description: 'Gondolas, cable cars, chair lifts, and stations', isPOI: true, defaultRadius: 5, category: 'transportation', section: 'transportation' },
  { id: 'poi_ferry', label: 'Ferry', description: 'Ferry terminals and ferry routes', isPOI: true, defaultRadius: 5, category: 'transportation', section: 'transportation' },
  { id: 'poi_airport_air', label: 'Airport/Air', description: 'Air terminals, gates, and platforms', isPOI: true, defaultRadius: 5, category: 'transportation', section: 'transportation' },
  { id: 'poi_taxi', label: 'Taxi', description: 'Taxi services and stands', isPOI: true, defaultRadius: 3, category: 'transportation', section: 'transportation' },
  { id: 'poi_bike_scooter_share', label: 'Bike/Scooter Share', description: 'Bicycle and scooter rental services', isPOI: true, defaultRadius: 3, category: 'transportation', section: 'transportation' },
  { id: 'poi_dockless_hub', label: 'Dockless Hub', description: 'Dockless transportation hubs', isPOI: true, defaultRadius: 3, category: 'transportation', section: 'transportation' },
  { id: 'poi_electric_charging', label: 'Electric Charging Stations', description: 'EV charging stations via OpenChargeMap API', isPOI: true, defaultRadius: 25, category: 'transportation', section: 'transportation' },
  
  // Infrastructure
  { id: 'poi_power_plants_openei', label: 'Power Plants', description: 'Electric power generation facilities', isPOI: true, defaultRadius: 25, category: 'infrastructure', section: 'infrastructure' },
  { id: 'poi_substations', label: 'Substations', description: 'Electrical substations', isPOI: true, defaultRadius: 6, category: 'infrastructure', section: 'infrastructure' },
  { id: 'poi_powerlines', label: 'Powerlines', description: 'Electrical power transmission and distribution lines', isPOI: true, defaultRadius: 5, category: 'infrastructure', section: 'infrastructure' },
  { id: 'poi_cell_towers', label: 'Cell Towers', description: 'Cellular communication towers and masts', isPOI: true, defaultRadius: 5, category: 'infrastructure', section: 'infrastructure' },
  
  // Recreation
  { id: 'poi_tnm_trailheads', label: 'Trailheads', description: 'Hiking trail starting points', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_tnm_trails', label: 'Trails', description: 'Hiking and biking trails', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_cinemas', label: 'Cinemas', description: 'Movie theaters and cinemas', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_theatres', label: 'Theatres', description: 'Live performance venues for plays, concerts, and shows', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_museums_historic', label: 'Museums, Historic Sites & Memorials', description: 'Museums, historic landmarks, memorials, and cultural heritage sites', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_hotels', label: 'Hotels', description: 'Accommodation options', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_golf_courses', label: 'Golf Courses', description: 'Golf courses and country clubs', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_boat_ramps', label: 'Boat Ramps', description: 'Boat ramps and marinas', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  { id: 'poi_bars_nightlife', label: 'Bars & Nightlife', description: 'Bars, taverns, nightclubs, and live music venues', isPOI: true, defaultRadius: 2, category: 'recreation', section: 'recreation' },
  { id: 'poi_mountain_biking', label: 'Mountain Biking & Biking Trails', description: 'Mountain bike trails, bike paths, and cycling routes via OpenStreetMap', isPOI: true, defaultRadius: 5, category: 'recreation', section: 'recreation' },
  
  // Natural Resources
  { id: 'poi_beaches', label: 'Beaches', description: 'Natural beaches and coastal areas', isPOI: true, defaultRadius: 5, category: 'natural_resources', section: 'natural_resources' },
  { id: 'poi_lakes_ponds', label: 'Lakes & Ponds', description: 'Lakes, ponds, and water bodies', isPOI: true, defaultRadius: 5, category: 'natural_resources', section: 'natural_resources' },
  { id: 'poi_rivers_streams', label: 'Rivers & Streams', description: 'Rivers, streams, brooks, and waterways', isPOI: true, defaultRadius: 5, category: 'natural_resources', section: 'natural_resources' },
  { id: 'poi_mountains_peaks', label: 'Mountains & Peaks', description: 'Mountain peaks and high elevation features', isPOI: true, defaultRadius: 5, category: 'natural_resources', section: 'natural_resources' },
  { id: 'poi_fws_species', label: 'FWS Species & Critical Habitat', description: 'US Fish and Wildlife Service - endangered/threatened species, critical habitat, wildlife refuges, wetlands, marine mammals, migratory birds, and fish hatcheries within proximity', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'natural_resources', section: 'natural_resources' },
  { id: 'poi_aurora_viewing_sites', label: 'Aurora Viewing Sites', description: 'Auroras.live curated northern/southern lights viewing locations', isPOI: true, defaultRadius: 100, maxRadius: 100, category: 'natural_resources', section: 'natural_resources' },
  { id: 'poi_ebird_hotspots', label: 'Birding Hotspots', description: 'Nearby eBird lister hotspots with species richness and recent activity', isPOI: true, defaultRadius: 25, maxRadius: 50, category: 'natural_resources', section: 'natural_resources' },
  { id: 'ebird_recent_observations', label: 'Recent Bird Observations', description: 'Recent species observations reported to eBird near this location (25-mile default search radius)', isPOI: false, defaultRadius: 25, category: 'natural_resources', section: 'natural_resources' },
  { id: 'soil_organic_carbon_density', label: 'Soil Organic Carbon Density', description: 'ISRIC Soilgrids via ESRI Living Atlas - World Soils 250m Organic Carbon Density (kg/m²) at point location', isPOI: false, defaultRadius: 0, category: 'natural_resources', section: 'natural_resources' },
  { id: 'national_marine_sanctuaries', label: 'National Marine Sanctuaries', description: 'NOAA - National Marine Sanctuaries (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'natural_resources', section: 'natural_resources' },
  
  // Quirky
  { id: 'poi_breweries', label: 'Breweries', description: 'Craft breweries with names, types, addresses, contact info', isPOI: true, defaultRadius: 5, category: 'quirky', section: 'quirky' },
  { id: 'poi_wikipedia', label: 'Wikipedia Articles', description: 'Haunted sites, historic oddities, museums, and quirky landmarks with intelligent categorization', isPOI: true, defaultRadius: 5, category: 'quirky', section: 'quirky' },

  // Human Caused Hazards (man-made environmental hazards)
  { id: 'poi_animal_vehicle_collisions', label: 'Animal-Vehicle Impacts (AVIs)', description: 'The Location Is Everything Company preview data for CA (CA CROS), TX (DOT), ID (Fish&Wildlife), IA (DOT), NH (DOT), and FARS.', isPOI: true, defaultRadius: 5, category: 'wildfire', section: 'wildfire' },
  

    
  
  // EPA FRS Environmental Hazards
  { id: 'poi_epa_brownfields', label: 'EPA Brownfields', description: 'Assessment, Cleanup and Redevelopment Exchange System (ACRES) - brownfield redevelopment sites', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_superfund', label: 'EPA Superfund Sites', description: 'Hazardous waste sites including National Priorities List (NPL) Superfund locations', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_rcra', label: 'EPA RCRA Facilities', description: 'Resource Conservation and Recovery Act - hazardous waste generators, treaters, storers, transporters, and disposers', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  // EPA TRI (Toxics Release Inventory) - Comprehensive facility data
  { id: 'tri_facilities', label: 'TRI Facilities', description: 'TRI facilities reporting toxic chemical releases', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_facilities_tribal', label: 'TRI Facilities (Tribal Land)', description: 'TRI facilities located on tribal lands', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_all_facilities', label: 'All TRI Facilities', description: 'Complete list of all TRI reporting facilities', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_manufacturing', label: 'Manufacturing Facilities', description: 'TRI manufacturing facilities with toxic releases', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_metal_mining', label: 'Metal Mining Facilities', description: 'TRI metal mining facilities and their releases', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_electric_utility', label: 'Electric Utility Facilities', description: 'TRI electric utility facilities and emissions', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_wood_products', label: 'Wood Products Facilities', description: 'TRI wood products manufacturing facilities', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_automotive', label: 'Automotive Manufacturing', description: 'TRI automotive manufacturing facilities', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_pfas', label: 'PFAS Facilities', description: 'TRI facilities reporting PFAS (forever chemicals) releases', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_lead', label: 'Lead Facilities', description: 'TRI facilities reporting lead releases', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_dioxins', label: 'Dioxins Facilities', description: 'TRI facilities reporting dioxin releases', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_ethylene_oxide', label: 'Ethylene Oxide Facilities', description: 'TRI facilities reporting ethylene oxide releases', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_carcinogens', label: 'Carcinogens Facilities', description: 'TRI facilities reporting carcinogenic chemical releases', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_mercury', label: 'Mercury Facilities', description: 'TRI facilities reporting mercury releases', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'tri_federal', label: 'Federal TRI Facilities', description: 'Federal facilities reporting to TRI', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_npdes', label: 'EPA NPDES Permits', description: 'National Pollutant Discharge Elimination System - permitted wastewater discharge facilities', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_air', label: 'EPA Air Facilities', description: 'Air Facility System (AFS/ICIS-AIR) - stationary sources of air pollution', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_radiation', label: 'EPA Radiation Facilities', description: 'RADINFO - facilities dealing with radioactivity or radiation', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_power', label: 'EPA Power Generation', description: 'EGRID/EIA-860 - power plant and generation facilities', isPOI: true, defaultRadius: 25, category: 'hazards', section: 'hazards' },
  { id: 'poi_epa_oil_spill', label: 'EPA Oil Spill Response', description: 'SPCC/FRP - countermeasure and facility response plan subject facilities', isPOI: true, defaultRadius: 5, category: 'hazards', section: 'hazards' },
  
  // Public Lands & Protected Areas
  { id: 'poi_padus_public_access', label: 'PAD-US Public Access', description: 'USGS Protected Areas Database - public land boundaries, manager info, and access status', isPOI: true, defaultRadius: 5, category: 'public_lands', section: 'public_lands' },
  { id: 'poi_padus_protection_status', label: 'PAD-US Protection Status', description: 'GAP status codes and IUCN categories for protected areas', isPOI: true, defaultRadius: 5, category: 'public_lands', section: 'public_lands' },
  { id: 'poi_community_centers', label: 'Community Centers', description: 'Community centers and gathering places via OSM Overpass API', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_mail_shipping', label: 'Mail & Shipping', description: 'Post offices, parcel lockers, UPS/FedEx/DHL stores, shipping centers, and courier services', isPOI: true, defaultRadius: 5, category: 'community', section: 'community' },
  { id: 'poi_colleges_universities', label: 'Colleges & Universities', description: 'Colleges, universities, and educational institutions via OSM Overpass API', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'community', section: 'community' },
  
  // Natural Hazards - Wildfire Risk & Monitoring (grouped at top)
  { id: 'poi_wildfires', label: 'Current Wildfires', description: 'NIFC/Esri USA Wildfires - current wildfire incidents and perimeters with incident names, containment status, and discovery dates', isPOI: true, defaultRadius: 50, category: 'wildfire', section: 'wildfire' },
  { id: 'usda_wildfire_hazard_potential', label: 'Wildfire Hazard Potential', description: 'USDA Forest Service - Composite wildfire risk index (1-5: Very Low to Very High) with automatic proximity search', isPOI: false, defaultRadius: 0, category: 'wildfire', section: 'wildfire' },
  { id: 'usda_burn_probability', label: 'Burn Probability', description: 'USDA Forest Service - Annual probability of wildfire occurrence (0-1 scale) with automatic proximity search', isPOI: false, defaultRadius: 0, category: 'wildfire', section: 'wildfire' },
  { id: 'usda_conditional_flame_length', label: 'Conditional Flame Length', description: 'USDA Forest Service - Expected flame length if fire occurs (feet) with automatic proximity search', isPOI: false, defaultRadius: 0, category: 'wildfire', section: 'wildfire' },
  { id: 'usda_risk_to_structures', label: 'Risk to Potential Structures', description: 'USDA Forest Service - Structure exposure risk assessment (integer score) with automatic proximity search', isPOI: false, defaultRadius: 0, category: 'wildfire', section: 'wildfire' },
  { id: 'usda_conditional_risk_to_structures', label: 'Conditional Risk to Structures', description: 'USDA Forest Service - Refined structure risk with probability factors (integer score) with automatic proximity search', isPOI: false, defaultRadius: 0, category: 'wildfire', section: 'wildfire' },
  { id: 'usda_exposure_type', label: 'Wildfire Exposure Type', description: 'USDA Forest Service - Direct, Indirect, or No Exposure classification with automatic proximity search', isPOI: false, defaultRadius: 0, category: 'wildfire', section: 'wildfire' },
  
  // Natural Hazards - Flood & Water Risk
  { id: 'poi_fema_flood_zones', label: 'FEMA Flood Zones', description: 'FEMA National Flood Hazard Layer - flood zone classification and risk assessment', isPOI: true, defaultRadius: 5, category: 'wildfire', section: 'wildfire' },
  { id: 'poi_flood_reference_points', label: 'USGS Flood Reference Points', description: 'Real-time flooding reference points - actively flooding locations within proximity', isPOI: true, defaultRadius: 25, category: 'wildfire', section: 'wildfire' },
  { id: 'poi_wetlands', label: 'USGS Wetlands', description: 'National Wetlands Inventory - wetland types, locations, and proximity analysis', isPOI: true, defaultRadius: 2, category: 'wildfire', section: 'wildfire' },
  
  // Natural Hazards - Geological Risk
  { id: 'poi_earthquakes', label: 'USGS Earthquakes', description: 'Historical earthquake events - frequency, magnitude, and proximity analysis for risk assessment', isPOI: true, defaultRadius: 25, category: 'wildfire', section: 'wildfire' },
  { id: 'poi_volcanoes', label: 'USGS Volcanoes', description: 'Active and dormant volcanoes - status, location, and proximity analysis for volcanic risk assessment', isPOI: true, defaultRadius: 50, category: 'wildfire', section: 'wildfire' },

  // Appalachian Trail Facilities and Infrastructure
  { id: 'at_bridges', label: 'AT Bridges', description: 'Appalachian Trail bridges and crossings', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  { id: 'at_campsites', label: 'AT Campsites', description: 'Appalachian Trail campsites and camping areas', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  { id: 'at_parking', label: 'AT Parking', description: 'Appalachian Trail parking areas and trailheads', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  { id: 'at_privies', label: 'AT Privies', description: 'Appalachian Trail privies and restroom facilities', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  { id: 'at_shelters', label: 'AT Shelters', description: 'Appalachian Trail shelters and lean-tos', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  { id: 'at_vistas', label: 'AT Vistas', description: 'Appalachian Trail scenic viewpoints and overlooks', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  { id: 'at_side_trails', label: 'AT Side Trails', description: 'Appalachian Trail side trails and connector trails', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  { id: 'at_treadway', label: 'AT Treadway', description: 'Appalachian Trail main treadway and trail segments', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  { id: 'at_assets_bridges', label: 'AT Bridge Assets', description: 'Appalachian Trail bridge infrastructure and maintenance records', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  { id: 'at_assets_structures', label: 'AT Structure Assets', description: 'Appalachian Trail structure assets and maintenance records', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  { id: 'at_assets_trail', label: 'AT Trail Assets', description: 'Appalachian Trail trail assets and maintenance records', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  { id: 'at_centerline', label: 'AT Centerline', description: 'Appalachian Trail main centerline and trail segments', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  { id: 'at_osm_features', label: 'AT OSM Features', description: 'OpenStreetMap Appalachian Trail features (trail segments, shelters, POIs, crossings)', isPOI: true, defaultRadius: 5, category: 'at', section: 'at' },
  
  // Pacific Crest Trail (PCT)
  { id: 'pct_centerline', label: 'PCT Centerline', description: 'Pacific Crest Trail centerline and main trail segments', isPOI: true, defaultRadius: 5, category: 'pct', section: 'pct' },
  { id: 'pct_sheriff_offices', label: 'PCT Sheriff Offices', description: 'Sheriff offices along the Pacific Crest Trail', isPOI: true, defaultRadius: 5, category: 'pct', section: 'pct' },
  { id: 'pct_side_trails', label: 'PCT Side Trails', description: 'Side trails and connecting routes to the Pacific Crest Trail', isPOI: true, defaultRadius: 5, category: 'pct', section: 'pct' },
  { id: 'pct_mile_markers_2024', label: 'PCT 2024 Mile Markers', description: 'Pacific Crest Trail mile markers for 2024', isPOI: true, defaultRadius: 5, category: 'pct', section: 'pct' },
  { id: 'pct_tenth_mile_markers_2024', label: 'PCT 2025 Tenth/Mile Markers', description: 'Pacific Crest Trail tenth-mile markers for 2024', isPOI: true, defaultRadius: 5, category: 'pct', section: 'pct' },
  { id: 'pct_resupply_towns', label: 'PCT Resupply Towns', description: 'Resupply towns and services along the Pacific Crest Trail', isPOI: true, defaultRadius: 5, category: 'pct', section: 'pct' },
  { id: 'pct_osm_features', label: 'PCT OSM Features', description: 'OpenStreetMap Pacific Crest Trail features (trail segments, shelters, POIs, crossings)', isPOI: true, defaultRadius: 5, category: 'pct', section: 'pct' },
  
  // New Hampshire GRANIT Data Layers
  { id: 'nh_house_districts_2022', label: 'New Hampshire House of Representatives District Boundaries - 2022', description: 'NH GRANIT - House district boundaries for point-in-polygon query', isPOI: false, defaultRadius: 0, category: 'nh', section: 'nh' },
  { id: 'nh_voting_wards', label: 'New Hampshire Political Districts (Voting Wards)', description: 'NH GRANIT - Voting ward boundaries for point-in-polygon query', isPOI: false, defaultRadius: 0, category: 'nh', section: 'nh' },
  { id: 'nh_senate_districts_2022', label: 'New Hampshire Senate District Boundaries - 2022', description: 'NH GRANIT - Senate district boundaries for point-in-polygon query', isPOI: false, defaultRadius: 0, category: 'nh', section: 'nh' },
  { id: 'nh_ssurgo', label: 'Soil Survey Geographic (SSURGO) database for New Hampshire', description: 'NH GRANIT - SSURGO soil survey data for point-in-polygon query', isPOI: false, defaultRadius: 0, category: 'nh', section: 'nh' },
  { id: 'nh_bedrock_geology', label: 'NH Bedrock Geology - Formations', description: 'NH GRANIT - Bedrock geology formations for point-in-polygon query', isPOI: false, defaultRadius: 0, category: 'nh', section: 'nh' },
  { id: 'nh_geographic_names', label: 'NH Geographic Names Information System (Places of Interest)', description: 'NH GRANIT - Geographic names and places of interest - proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_parcels', label: 'New Hampshire Parcels', description: 'NH GRANIT - Parcel boundaries for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 0.25, maxRadius: 1.0, category: 'nh', section: 'nh' },
  { id: 'nh_key_destinations', label: 'NH Key Destinations - Points', description: 'NH GRANIT - Key destinations including hospitals, schools, municipal offices, places of worship, and more', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_nursing_homes', label: 'NH Nursing Homes', description: 'NH GRANIT - Nursing homes and assisted living facilities', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_ems', label: 'NH Emergency Medical Services', description: 'NH GRANIT - Emergency Medical Services (EMS) facilities', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_fire_stations', label: 'NH Fire Stations', description: 'NH GRANIT - Fire stations and fire departments', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_places_of_worship', label: 'NH Places of Worship', description: 'NH GRANIT - Churches, synagogues, mosques, and other places of worship', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_hospitals', label: 'NH Hospitals', description: 'NH GRANIT - Hospitals and medical facilities', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_public_waters_access', label: 'NH Access Sites to Public Waters', description: 'NH GRANIT - Public access sites to lakes, rivers, and other water bodies', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_law_enforcement', label: 'NH Law Enforcement', description: 'NH GRANIT - Police departments, sheriff offices, and law enforcement facilities', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_recreation_trails', label: 'NH Recreation Trails', description: 'NH GRANIT - Recreation trails and hiking paths', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_stone_walls', label: 'NH Stone Walls', description: 'New Hampshire stone walls (line features)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_dot_roads', label: 'NH DOT Roads', description: 'NH GRANIT - New Hampshire Department of Transportation road network', isPOI: true, defaultRadius: 0.5, maxRadius: 10, category: 'nh', section: 'nh' },
  { id: 'nh_railroads', label: 'NH Railroads', description: 'NH GRANIT - New Hampshire railroad network (active and abandoned)', isPOI: true, defaultRadius: 0.5, maxRadius: 10, category: 'nh', section: 'nh' },
  { id: 'nh_transmission_pipelines', label: 'NH Transmission/Pipelines', description: 'NH GRANIT - New Hampshire transmission lines and pipelines', isPOI: true, defaultRadius: 0.5, maxRadius: 10, category: 'nh', section: 'nh' },
  { id: 'nh_cell_towers', label: 'NH Personal Wireless Service Facilities', description: 'NH GRANIT - New Hampshire cell towers and wireless communication facilities', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_underground_storage_tanks', label: 'NH Underground Storage Tank Sites', description: 'NH DES - New Hampshire underground storage tank sites', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_water_wells', label: 'NH Water Well Inventory', description: 'NH DES - New Hampshire water well inventory', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_public_water_supply_wells', label: 'NH Public Water Supply Wells', description: 'NH DES - New Hampshire public water supply wells', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_remediation_sites', label: 'NH Remediation Sites', description: 'NH DES - New Hampshire remediation sites', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_automobile_salvage_yards', label: 'NH Automobile Salvage Yards', description: 'NH DES - New Hampshire automobile salvage yards', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_solid_waste_facilities', label: 'NH Solid Waste Facilities', description: 'NH DES - New Hampshire solid waste facilities', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nh', section: 'nh' },
  { id: 'nh_source_water_protection_areas', label: 'NH Source Water Protection Areas', description: 'NH DES - New Hampshire source water protection areas (point-in-polygon)', isPOI: false, defaultRadius: 0, category: 'nh', section: 'nh' },
  { id: 'nh_nwi_plus', label: 'NH National Wetland Inventory (NWI) Plus', description: 'NH DES - New Hampshire National Wetland Inventory Plus (point-in-polygon and proximity)', isPOI: true, defaultRadius: 0.25, maxRadius: 1.0, category: 'nh', section: 'nh' },
  { id: 'ma_parcels', label: 'Massachusetts Property Tax Parcels', description: 'MassGIS - Massachusetts property tax parcels for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 0.3, maxRadius: 1.0, category: 'ma', section: 'ma' },
  { id: 'ma_dep_wetlands', label: 'MA DEP Wetland Areas', description: 'MassGIS - Massachusetts Department of Environmental Protection wetland areas (point-in-polygon and proximity)', isPOI: true, defaultRadius: 0.25, maxRadius: 1.0, category: 'ma', section: 'ma' },
  { id: 'ma_open_space', label: 'MA Protected and Recreational Open Space', description: 'MassGIS - Massachusetts protected and recreational open space (point-in-polygon and proximity)', isPOI: true, defaultRadius: 0.25, maxRadius: 1.0, category: 'ma', section: 'ma' },
  { id: 'cape_cod_zoning', label: 'Cape Cod Zoning Map', description: 'Cape Cod Commission - Cape Cod zoning districts (point-in-polygon and proximity)', isPOI: true, defaultRadius: 0.25, maxRadius: 1.0, category: 'ma', section: 'ma' },
  { id: 'ma_trails', label: 'MA Hiking and Wilderness Trails', description: 'MassGIS - Massachusetts hiking and wilderness trails (proximity)', isPOI: true, defaultRadius: 0.5, maxRadius: 10, category: 'ma', section: 'ma' },
  { id: 'ma_nhesp_natural_communities', label: 'MA NHESP Natural Communities', description: 'MassGIS - Massachusetts Natural Heritage & Endangered Species Program natural communities (point-in-polygon and proximity)', isPOI: true, defaultRadius: 0.25, maxRadius: 1.0, category: 'ma', section: 'ma' },
  { id: 'ma_lakes_and_ponds', label: 'MA Lakes and Ponds', description: 'MassGIS - Massachusetts lakes and ponds (point-in-polygon and proximity)', isPOI: true, defaultRadius: 0.25, maxRadius: 5.0, category: 'ma', section: 'ma' },
  { id: 'ma_rivers_and_streams', label: 'MA Rivers and Streams', description: 'MassGIS - Massachusetts rivers and streams (proximity queries)', isPOI: true, defaultRadius: 0.5, maxRadius: 10, category: 'ma', section: 'ma' },
  { id: 'ma_regional_planning_agencies', label: 'MA Regional Planning Agencies', description: 'MassGIS - Massachusetts Regional Planning Agencies (point-in-polygon)', isPOI: false, defaultRadius: 0, category: 'ma', section: 'ma' },
  { id: 'ma_acecs', label: 'MA Areas of Critical Environmental Concern', description: 'MassGIS - Massachusetts Areas of Critical Environmental Concern (ACECs) (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ma', section: 'ma' },
  { id: 'ct_parcels', label: 'CT Parcels', description: 'CT Geodata Portal - Connecticut State Parcel Layer 2023 for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 0.25, maxRadius: 1.0, category: 'ct', section: 'ct' },
  { id: 'ct_building_footprints', label: 'CT 2D Building Footprints', description: 'CT Geodata Portal - Connecticut 2D building footprints for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 0.25, maxRadius: 1.0, category: 'ct', section: 'ct' },
  { id: 'ct_roads', label: 'CT Roads and Trails', description: 'CT Geodata Portal - Connecticut roads and trails network for proximity queries', isPOI: true, defaultRadius: 0.5, maxRadius: 5.0, category: 'ct', section: 'ct' },
  { id: 'ct_urgent_care', label: 'CT Urgent Care', description: 'CT Geodata Portal - Connecticut urgent care facilities for proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ct', section: 'ct' },
  { id: 'ct_deep_properties', label: 'CT DEEP Properties', description: 'CT Geodata Portal - Connecticut Department of Energy and Environmental Protection (DEEP) properties for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ct', section: 'ct' },
  { id: 'ct_tribal_lands', label: 'CT Tribal Lands', description: 'CT Geodata Portal - Connecticut Tribal Lands (State and Federally Recognized) for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ct', section: 'ct' },
  { id: 'ct_drinking_water_watersheds', label: 'CT Drinking Water Watersheds', description: 'CT Geodata Portal - Connecticut Drinking Water Watersheds for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ct', section: 'ct' },
  { id: 'ct_broadband_availability', label: 'CT 2025 Broadband Availability by Block', description: 'CT Geodata Portal - Connecticut 2025 Broadband Availability by Census Block for point-in-polygon and proximity queries up to 5 miles', isPOI: true, defaultRadius: 0.5, maxRadius: 5.0, category: 'ct', section: 'ct' },
  { id: 'ct_water_pollution_control', label: 'CT Water Pollution Control Facilities', description: 'CT Geodata Portal - Connecticut Water Pollution Control Facilities for proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ct', section: 'ct' },
  { id: 'ct_boat_launches', label: 'CT Boat Launches', description: 'CT Geodata Portal - Connecticut DEEP Boat Launches for proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ct', section: 'ct' },
  { id: 'ct_federal_open_space', label: 'CT Federal Open Space', description: 'CT Geodata Portal - Connecticut Federal Open Space for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ct', section: 'ct' },
  { id: 'ct_huc_watersheds', label: 'CT HUC Watershed Boundaries', description: 'CT Geodata Portal - Connecticut HUC (Hydrologic Unit Code) Watershed Boundaries for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ct', section: 'ct' },
  
  // Delaware FirstMap layers
  { id: 'de_parcels', label: 'DE State Parcels', description: 'DE FirstMap - Delaware state parcels with ownership information for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 0.3, maxRadius: 1.0, category: 'de', section: 'de' },
  { id: 'de_state_forest', label: 'State Forest', description: 'DE FirstMap - State Forest lands in Delaware managed by the Delaware Forest Service for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_pine_plantations', label: 'Pine Plantations', description: 'DE FirstMap - Locations of Pine Plantations in Delaware for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_urban_tree_canopy', label: 'Urban Tree Canopy Estimates', description: 'DE FirstMap - Urban Tree Canopy calculations for Delaware municipalities, communities, and parks for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_forest_cover_2007', label: 'Forest Cover 2007', description: 'DE FirstMap - 2007 Aerial imagery based forest cover for Delaware for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_no_build_points_bay', label: 'No Build Points - Bay', description: 'DE FirstMap - No Build Points along Delaware Bay coast for proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_no_build_line_bay', label: 'No Build Line - Bay', description: 'DE FirstMap - No Build Line along Delaware Bay coast for proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_no_build_points_ocean', label: 'No Build Points - Ocean', description: 'DE FirstMap - No Build Points along Delaware Ocean coast for proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_no_build_line_ocean', label: 'No Build Line - Ocean', description: 'DE FirstMap - No Build Line along Delaware Ocean coast for proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_park_facilities', label: 'Park Facilities', description: 'DE FirstMap - Outdoor recreational facilities throughout Delaware for proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_natural_areas', label: 'Natural Areas', description: 'DE FirstMap - Natural Areas Inventory boundaries for voluntary land protection for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_outdoor_recreation_parks_trails_lands', label: 'Outdoor Recreation, Parks and Trails Program Lands', description: 'DE FirstMap - Lands where Delaware Outdoor Recreation, Parks and Trails Program monies have been invested for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_land_water_conservation_fund', label: 'Land and Water Conservation Fund', description: 'DE FirstMap - Lands protected under the Land and Water Conservation Fund for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_nature_preserves', label: 'Nature Preserves', description: 'DE FirstMap - Lands preserved under the Delaware Nature Preserves Program for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_outdoor_recreation_areas', label: 'Outdoor Recreation Areas', description: 'DE FirstMap - Outdoor Recreation Inventory (ORI) - publicly and privately owned protected lands for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_outdoor_recreation_parks_trails_open_space', label: 'Outdoor Recreation, Parks and Trails Program Open Space', description: 'DE FirstMap - Land protected in perpetuity under the Outdoor Recreation, Parks and Trails Program for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_public_protected_lands', label: 'Public Protected Lands', description: 'DE FirstMap - Lands that are publicly owned and open to public access for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_conservation_easements', label: 'Conservation Easements', description: 'DE FirstMap - Conservation Easements held by Delaware State Parks and other agencies/NGOs for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_trails_pathways', label: 'Trails and Pathways', description: 'DE FirstMap - Recreational trails and pathways throughout Delaware for proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_seasonal_restricted_areas', label: 'Seasonal Restricted Areas', description: 'DE FirstMap - Portions of Delaware State Parks closed to public access during different seasons for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_permanent_restricted_areas', label: 'Permanent Restricted Areas', description: 'DE FirstMap - Portions of Delaware State Parks closed to public access all year long for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_wildlife_area_boundaries', label: 'Wildlife Area Boundaries', description: 'DE FirstMap - Wildlife Area locations within the State of Delaware for point-in-polygon and proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_lulc_2007', label: 'DE Land Use Land Cover 2007', description: 'DE FirstMap - 2007 Land Use Land Cover for Delaware (point-in-polygon)', isPOI: false, defaultRadius: 0, category: 'de', section: 'de' },
  { id: 'de_lulc_2007_revised', label: 'DE Land Use Land Cover 2007 (Revised)', description: 'DE FirstMap - 2007 Land Use Land Cover (Revised) for Delaware (point-in-polygon)', isPOI: false, defaultRadius: 0, category: 'de', section: 'de' },
  { id: 'de_lulc_2012', label: 'DE Land Use Land Cover 2012', description: 'DE FirstMap - 2012 Land Use Land Cover for Delaware (point-in-polygon)', isPOI: false, defaultRadius: 0, category: 'de', section: 'de' },
  { id: 'de_lulc_2017', label: 'DE Land Use Land Cover 2017', description: 'DE FirstMap - 2017 Land Use Land Cover for Delaware (point-in-polygon)', isPOI: false, defaultRadius: 0, category: 'de', section: 'de' },
  { id: 'de_lulc_2022', label: 'DE Land Use Land Cover 2022', description: 'DE FirstMap - 2022 Land Use Land Cover for Delaware (point-in-polygon)', isPOI: false, defaultRadius: 0, category: 'de', section: 'de' },
  { id: 'de_child_care_centers', label: 'DE Child Care Centers', description: 'DE FirstMap - Delaware Child Care Centers (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_fishing_access', label: 'DE Fishing Access', description: 'DE FirstMap - Delaware Fishing Access locations (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_trout_streams', label: 'DE Trout Streams', description: 'DE FirstMap - Delaware Trout Streams (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_public_schools', label: 'DE Public Schools', description: 'DE FirstMap - Delaware Public Schools (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_private_schools', label: 'DE Private Schools', description: 'DE FirstMap - Delaware Private Schools (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_votech_districts', label: 'DE VoTech School Districts', description: 'DE FirstMap - Delaware VoTech School Districts (point-in-polygon)', isPOI: false, defaultRadius: 0, category: 'de', section: 'de' },
  { id: 'de_school_districts', label: 'DE School Districts', description: 'DE FirstMap - Delaware School Districts (point-in-polygon)', isPOI: false, defaultRadius: 0, category: 'de', section: 'de' },
  { id: 'de_stands_blinds_fields', label: 'DE Wildlife Areas Stands Blinds and Fields', description: 'DE FirstMap - Wildlife Area Stands, Blinds, and Fields (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_boat_ramps', label: 'DE Wildlife Areas Boat Ramps', description: 'DE FirstMap - Wildlife Area Boat Ramps (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_facilities', label: 'DE Wildlife Areas Facilities', description: 'DE FirstMap - Wildlife Area Facilities (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_parking', label: 'DE Wildlife Areas Parking', description: 'DE FirstMap - Wildlife Area Parking (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_restrooms', label: 'DE Wildlife Areas Restrooms', description: 'DE FirstMap - Wildlife Area Restrooms (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_safety_zones', label: 'DE Wildlife Areas Safety Zones', description: 'DE FirstMap - Wildlife Area Safety Zones (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_wildlife_management_zones', label: 'DE Wildlife Management Zones', description: 'DE FirstMap - Wildlife Management Zones (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'de_rail_lines', label: 'DE Rail Lines', description: 'DE FirstMap - Delaware Rail Lines (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'de', section: 'de' },
  { id: 'nj_parcels', label: 'NJ Tax Parcels', description: 'NJGIN - New Jersey Tax Parcels (point-in-polygon and proximity queries up to 1 mile)', isPOI: true, defaultRadius: 0.25, maxRadius: 1.0, category: 'nj', section: 'nj' },
  { id: 'nj_address_points', label: 'NJ Address Points', description: 'NJGIN - New Jersey Address Points (proximity queries up to 5 miles)', isPOI: true, defaultRadius: 0.3, maxRadius: 5, category: 'nj', section: 'nj' },
  { id: 'nj_bus_stops', label: 'NJ Bus Stops', description: 'NJGIN - New Jersey Transit Bus Stops (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nj', section: 'nj' },
  { id: 'nj_safety_service_patrol', label: 'NJ Safety Service Patrol', description: 'NJGIN - New Jersey Department of Transportation Safety Service Patrol routes (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nj', section: 'nj' },
  { id: 'nj_service_areas', label: 'NJ Service Areas', description: 'NJGIN - New Jersey Service Areas (proximity queries up to 50 miles)', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'nj', section: 'nj' },
  { id: 'nj_roadway_network', label: 'NJ Roadway Network', description: 'NJGIN - New Jersey Department of Transportation Roadway Network (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nj', section: 'nj' },
  { id: 'nj_known_contaminated_sites', label: 'NJ Known Contaminated Sites', description: 'NJDEP - New Jersey Department of Environmental Protection Known Contaminated Sites (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nj', section: 'nj' },
  { id: 'nj_alternative_fuel_stations', label: 'NJ Alternative Fueled Vehicle Fueling Stations', description: 'NJDEP - New Jersey Department of Environmental Protection Alternative Fueled Vehicle Fueling Stations (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nj', section: 'nj' },
  { id: 'nj_power_plants', label: 'NJ Power Plants', description: 'NJDEP - New Jersey Department of Environmental Protection Power Plants (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nj', section: 'nj' },
  { id: 'nj_public_solar_facilities', label: 'NJ Public Solar Facilities', description: 'NJDEP - New Jersey Department of Environmental Protection Solar PV at Public Facilities (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nj', section: 'nj' },
  { id: 'nj_public_places_to_keep_cool', label: 'NJ Public Places to Keep Cool', description: 'NJDEP - New Jersey Department of Environmental Protection Public Places to Keep Cool (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nj', section: 'nj' }
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
