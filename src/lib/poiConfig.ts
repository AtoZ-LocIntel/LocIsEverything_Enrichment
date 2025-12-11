export interface POIConfig {
  id: string;
  label: string;
  description: string;
  isPOI: boolean;
  defaultRadius: number;
  maxRadius?: number;
  category: string;
  section: string;
  subCategory?: string; // For organizing layers within a section (e.g., LA County categories)
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
    id: 'tiger',
    title: 'US Census TIGER Data',
    description: 'US Census Bureau TIGER geographic data including roads, boundaries, water features, and other geographic features',
    icon: 'TIGERweb.webp'
  },
  {
    id: 'eu',
    title: 'European Union Data',
    description: 'European Union geographic and statistical data',
    icon: 'EU.webp'
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
  },
  {
    id: 'wv',
    title: 'West Virginia Open Data',
    description: 'West Virginia state open data services and layers',
    icon: 'WV.webp'
  },
  {
    id: 'ca',
    title: 'California Open Data',
    description: 'California state open data services and layers',
    icon: 'CA.webp'
  },
  {
    id: 'ga',
    title: 'Georgia Open Data',
    description: 'Georgia state open data services and layers',
    icon: 'GA.webp'
  },
  {
    id: 'sc',
    title: 'South Carolina Open Data',
    description: 'South Carolina state open data services and layers',
    icon: 'SC.webp'
  },
  {
    id: 'nc',
    title: 'North Carolina Open Data',
    description: 'North Carolina state open data services and layers',
    icon: 'NC.webp'
  },
  {
    id: 'md',
    title: 'Maryland Open Data',
    description: 'Maryland state open data services and layers',
    icon: 'MD.webp'
  },
  {
    id: 'dc',
    title: 'District of Columbia Open Data',
    description: 'District of Columbia open data services and layers',
    icon: 'DC.webp'
  },
  {
    id: 'va',
    title: 'Virginia Open Data',
    description: 'Virginia state open data services and layers',
    icon: 'VA.webp'
  },
  {
    id: 'fl',
    title: 'Florida Open Data',
    description: 'Florida state open data services and layers',
    icon: 'FL.webp'
  },
  {
    id: 'tx',
    title: 'Texas Open Data',
    description: 'Texas state open data services and layers',
    icon: 'TX.webp'
  },
  {
    id: 'nm',
    title: 'New Mexico Open Data',
    description: 'New Mexico state open data services and layers',
    icon: 'NM.webp'
  },
  {
    id: 'az',
    title: 'Arizona Open Data',
    description: 'Arizona state open data services and layers',
    icon: 'AZ.webp'
  },
  {
    id: 'ak',
    title: 'Alaska Open Data',
    description: 'Alaska state open data services and layers',
    icon: 'AK.webp'
  },
  {
    id: 'hi',
    title: 'Hawaii Open Data',
    description: 'Hawaii state open data services and layers',
    icon: 'HI.webp'
  },
  {
    id: 'wa',
    title: 'Washington Open Data',
    description: 'Washington state open data services and layers',
    icon: 'WA.webp'
  },
  {
    id: 'or',
    title: 'Oregon Open Data',
    description: 'Oregon state open data services and layers',
    icon: 'OR.webp'
  },
  {
    id: 'mt',
    title: 'Montana Open Data',
    description: 'Montana state open data services and layers',
    icon: 'MT.webp'
  },
  {
    id: 'wy',
    title: 'Wyoming Open Data',
    description: 'Wyoming state open data services and layers',
    icon: 'WY.webp'
  },
  {
    id: 'nv',
    title: 'Nevada Open Data',
    description: 'Nevada state open data services and layers',
    icon: 'NV.webp'
  },
  {
    id: 'id',
    title: 'Idaho Open Data',
    description: 'Idaho state open data services and layers',
    icon: 'ID.webp'
  },
  {
    id: 'ut',
    title: 'Utah Open Data',
    description: 'Utah state open data services and layers',
    icon: 'UT.webp'
  },
  {
    id: 'co',
    title: 'Colorado Open Data',
    description: 'Colorado state open data services and layers',
    icon: 'CO.webp'
  },
  {
    id: 'il',
    title: 'Illinois Open Data',
    description: 'Illinois state open data services and layers',
    icon: 'IL.webp'
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
  { id: 'nri_rivers', label: 'Nationwide Rivers Inventory', description: 'Free-flowing river segments with outstandingly remarkable natural or cultural values (proximity queries up to 50 miles)', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'natural_resources', section: 'natural_resources' },
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
  { id: 'poi_padus_public_access', label: 'PAD-US Public Access', description: 'USGS Protected Areas Database - public land boundaries, manager info, and access status for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'poi_padus_protection_status', label: 'PAD-US Protection Status', description: 'GAP status codes and IUCN categories for protected areas for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_trails', label: 'BLM National GTLF Public Managed Trails', description: 'BLM National GTLF Public Managed Trails - linear trail network for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_motorized_trails', label: 'BLM National GTLF Public Motorized Trails', description: 'BLM National GTLF Public Motorized Trails - linear motorized trail network for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_nonmotorized_trails', label: 'BLM National GTLF Public Nonmotorized Trails', description: 'BLM National GTLF Public Nonmotorized Trails - linear nonmotorized trail network for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_limited_motorized_roads', label: 'BLM National GTLF Limited Public Motorized Roads', description: 'BLM National GTLF Limited Public Motorized Roads - limited motorized road routes for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_public_motorized_roads', label: 'BLM National GTLF Public Motorized Roads', description: 'BLM National GTLF Public Motorized Roads - public motorized road routes for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_grazing_pastures', label: 'BLM National Grazing Pasture Polygons', description: 'BLM National Grazing Pasture Polygons - grazing allotment and pasture boundaries for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_acec', label: 'BLM National Areas of Critical Environmental Concern', description: 'BLM National Areas of Critical Environmental Concern - designated areas requiring special management attention for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_sheep_goat_grazing', label: 'BLM National Sheep and Goat Billed Grazing Allotments', description: 'BLM National Sheep and Goat Billed Grazing Allotments - sheep and goat grazing allotment boundaries for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_sheep_goat_authorized_grazing', label: 'BLM National Sheep and Goat Authorized Grazing Allotments', description: 'BLM National Sheep and Goat Authorized Grazing Allotments - authorized sheep and goat grazing allotment boundaries for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_nlcs_monuments_ncas', label: 'BLM National NLCS National Monuments and National Conservation Areas', description: 'BLM National NLCS National Monuments and National Conservation Areas - designated monuments and conservation areas for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_wild_horse_burro_herd_areas', label: 'BLM National Wild Horse and Burro Herd Areas', description: 'BLM National Wild Horse and Burro Herd Areas - wild horse and burro herd management areas for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_recreation_sites', label: 'BLM National Recreation Site Polygons', description: 'BLM National Recreation Site Polygons - campgrounds, day use areas, OHV areas, and other recreation sites for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_fire_perimeters', label: 'BLM National Fire Perimeters', description: 'BLM National Fire Perimeters - final fire perimeters (FPER) used for vegetation analysis, habitat suitability, fire planning, and post-fire stabilization activities for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'blm_national_lwcf', label: 'BLM National Land and Water Conservation Fund (LWCF) Polygons', description: 'BLM National Land and Water Conservation Fund (LWCF) Polygons - federally funded land acquisition projects for recreation and conservation purposes for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_forest_boundaries', label: 'USFS Forest Boundaries', description: 'USFS Forest System Boundaries - US Forest Service national forest and grassland boundaries for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_wilderness_areas', label: 'USFS National Wilderness Areas', description: 'USFS National Wilderness Areas - designated wilderness areas managed by the US Forest Service for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_national_grasslands', label: 'USFS National Grassland Units', description: 'USFS National Grassland Units - national grassland units managed by the US Forest Service for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_hazardous_sites', label: 'USFS Hazardous Sites (CERCLA Sites)', description: 'USFS Hazardous Sites (CERCLA Sites) - hazardous waste sites on public lands managed by the US Forest Service for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_office_locations', label: 'USFS Office Locations', description: 'USFS Office Locations - US Forest Service office locations for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_special_uses_communications_sites', label: 'USFS Special Uses Communications Sites', description: 'USFS Special Uses Communications Sites - communications sites on public lands managed by the US Forest Service for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_administrative_boundaries', label: 'USFS Administrative Boundaries', description: 'USFS Administrative Boundaries - administrative boundaries managed by the US Forest Service for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_recreation_opportunities', label: 'USFS Recreation Opportunities', description: 'USFS Recreation Opportunities - recreation opportunities on public lands managed by the US Forest Service for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_recreation_area_activities', label: 'USFS Recreation Area Activities', description: 'USFS Recreation Area Activities - recreation area activities on public lands managed by the US Forest Service for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_roads_closed_to_motorized', label: 'USFS Roads Closed to Motorized Uses', description: 'USFS Roads Closed to Motorized Uses - National Forest System roads closed to motorized uses for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_system_roads', label: 'USFS System Roads', description: 'USFS System Roads - National Forest Service System Roads for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_mvum', label: 'USFS Motor Vehicle Use Map (MVUM)', description: 'USFS Motor Vehicle Use Map (MVUM) - designated routes showing specific types of motorized vehicles allowed and their seasons of use for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'usfs_co_roadless_areas', label: 'USFS Colorado Roadless Areas', description: 'USFS Colorado Roadless Areas - Colorado roadless areas managed by the US Forest Service for point-in-polygon and proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  
  // National Park Service (NPS)
  { id: 'nps_national_parks', label: 'NPS National Parks', description: 'National Park Service National Parks - national parks, monuments, and historic sites for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'nps_campgrounds', label: 'NPS Campgrounds', description: 'National Park Service Campgrounds - campground facilities within national parks for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'nps_visitor_centers', label: 'NPS Visitor Centers', description: 'National Park Service Visitor Centers - visitor center facilities within national parks for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
  { id: 'nps_nrhp_locations', label: 'NPS National Register of Historic Places', description: 'National Park Service National Register of Historic Places - historic properties listed on the National Register for proximity queries (up to 50 miles)', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'public_lands', section: 'public_lands' },
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
  { id: 'ct_soils_parent_material', label: 'CT Soils Parent Material Name', description: 'CT Geodata Portal - Connecticut Soils Parent Material Name (SSURGO) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ct', section: 'ct' },
  
  // California Open Data Portal layers
  { id: 'ca_power_outage_areas', label: 'CA Power Outage Areas', description: 'CA Open Data Portal - California Power Outage Areas for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  // Fire-related layers grouped together
  { id: 'ca_fire_perimeters_all', label: 'CA Fire Perimeters (All)', description: 'CA Open Data Portal - California Historic Fire Perimeters (all historical fires) for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_fire_perimeters_recent_large', label: 'CA Recent Large Fire Perimeters', description: 'CA Open Data Portal - California Recent Large Fire Perimeters (GT 5000 acres) for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_fire_perimeters_1950', label: 'CA Fire Perimeters (1950+)', description: 'CA Open Data Portal - California Fire Perimeters (1950+) for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_wildland_fire_direct_protection', label: 'CA Wildland Fire Direct Protection Areas', description: 'CA Open Data Portal - California Wildland Fire Direct Protection Areas (USFS) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca' },
  { id: 'ca_calvtp_treatment_areas', label: 'CA CalVTP Treatment Areas', description: 'CA Open Data Portal - California CalVTP Treatment Areas (CAL FIRE) for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_postfire_damage_inspections', label: 'CA Post-Fire Damage Inspections (DINS)', description: 'CAL FIRE - Damage Inspection Program (DINS) database of structures damaged/destroyed by wildland fire in California since 2013. Proximity queries up to 50 miles.', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'ca', section: 'ca' },
  { id: 'ca_medium_heavy_duty_infrastructure', label: 'CA Medium & Heavy Duty Infrastructure', description: 'CA State - Medium and Heavy Duty (MDHD) hydrogen refueling and charging stations in varying stages of development. Proximity queries up to 25 miles.', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_frap_facilities', label: 'CA Facilities for Wildland Fire Protection', description: 'CAL FIRE - State and Local Facilities for Wildland Fire Protection. Fire stations, command centers, and fire protection facilities. Proximity queries up to 50 miles.', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'ca', section: 'ca' },
  { id: 'ca_solar_footprints', label: 'CA Solar Footprints', description: 'CA State - Solar footprint polygons representing medium to large scale solar facilities in California. Updated August 2023. Proximity queries up to 25 miles.', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_natural_gas_service_areas', label: 'CA Natural Gas Service Areas', description: 'CA State - Natural Gas Service Areas for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca' },
  { id: 'ca_plss_sections', label: 'CA Public Land Survey Sections', description: 'CA State - Public Land Survey System (PLSS) Sections for point-in-polygon queries to extract Township and Range values', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca' },
  { id: 'ca_geothermal_wells', label: 'CA Geothermal Wells', description: 'CA State - Geothermal Wells from WellSTAR database. Proximity queries up to 25 miles.', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_oil_gas_wells', label: 'CA Oil and Gas Wells', description: 'CA State - Oil and Gas Wells from WellSTAR database. Proximity queries up to 25 miles.', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_eco_regions', label: 'CA Eco Regions', description: 'USDA - Ecoregion Sections for California. Point-in-polygon queries to identify ecoregion classification.', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca' },
  { id: 'ca_la_zoning', label: 'City of Los Angeles Zoning', description: 'City of Los Angeles - Zoning polygons for point-in-polygon and proximity queries (up to 1 mile)', isPOI: true, defaultRadius: 0.25, maxRadius: 1, category: 'ca', section: 'ca' },
  // LA County Hazards - grouped together at top
  { id: 'la_county_fire_hazards', label: 'LA County Fire Hazards', description: 'LA County - Fire Hazards for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_fire_hazard_responsibility_areas', label: 'LA County Fire Hazard Responsibility Areas', description: 'LA County - Fire Hazard Responsibility Areas for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_fire_hazard_severity_zones', label: 'LA County Fire Hazard Severity Zones', description: 'LA County - Fire Hazard Severity Zones for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_fire_hazard_severity_zones_lra', label: 'LA County Fire Hazard Severity Zones LRA', description: 'LA County - Fire Hazard Severity Zones LRA for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_fire_hazard_severity_zones_sra', label: 'LA County Fire Hazard Severity Zones SRA', description: 'LA County - Fire Hazard Severity Zones SRA for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_earthquake_hazards', label: 'LA County Earthquake Hazards', description: 'LA County - Earthquake Hazards for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_alquist_priolo_fault_traces', label: 'LA County Alquist-Priolo Fault Traces', description: 'LA County - Alquist-Priolo Fault Traces for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_alquist_priolo_fault_zones', label: 'LA County Alquist-Priolo Fault Zones', description: 'LA County - Alquist-Priolo Fault Zones for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_usgs_faults', label: 'LA County USGS Faults', description: 'LA County - USGS Faults for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_tsunami_inundation_runup_line', label: 'LA County Tsunami Inundation Runup Line', description: 'LA County - Tsunami Inundation Runup Line for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_tsunami_inundation_zones', label: 'LA County Tsunami Inundation Zones', description: 'LA County - Tsunami Inundation Zones for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_landslide_zones', label: 'LA County Landslide Zones', description: 'LA County - Landslide Zones for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_liquefaction_zones', label: 'LA County Liquefaction Zones', description: 'LA County - Liquefaction Zones for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_flood_hazards', label: 'LA County Flood Hazards', description: 'LA County - Flood Hazards for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_100_year_flood_plain', label: 'LA County 100-Year Flood Plain', description: 'LA County - 100-Year Flood Plain for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_500_year_flood_plain', label: 'LA County 500-Year Flood Plain', description: 'LA County - 500-Year Flood Plain for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_dam_inundation_eta', label: 'LA County Dam Inundation ETA', description: 'LA County - Dam Inundation ETA for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'la_county_dam_inundation_areas', label: 'LA County Dam Inundation Areas', description: 'LA County - Dam Inundation Areas for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca' },
  // LA County Basemaps and Grids - grouped together
  { id: 'la_county_us_national_grid', label: 'LA County US National Grid', description: 'LA County - US National Grid for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Basemaps & Grids' },
  { id: 'la_county_usng_100k', label: 'LA County USNG 100K', description: 'LA County - USNG 100K Grid for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Basemaps & Grids' },
  { id: 'la_county_usng_10000m', label: 'LA County USNG 10000M', description: 'LA County - USNG 10000M Grid for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Basemaps & Grids' },
  { id: 'la_county_usng_1000m', label: 'LA County USNG 1000M', description: 'LA County - USNG 1000M Grid for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Basemaps & Grids' },
  { id: 'la_county_usng_100m', label: 'LA County USNG 100M', description: 'LA County - USNG 100M Grid for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Basemaps & Grids' },
  { id: 'la_county_township_range_section_rancho_boundaries', label: 'LA County Township Range Section Rancho Boundaries', description: 'LA County - Township Range Section Rancho Boundaries for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Basemaps & Grids' },
  // LA County Hydrology - grouped together
  { id: 'la_county_hydrology_complete', label: 'LA County Hydrology (Complete)', description: 'LA County - Complete Hydrology for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_lakes', label: 'LA County Lakes', description: 'LA County - Lakes for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_streams_rivers', label: 'LA County Streams and Rivers', description: 'LA County - Streams and Rivers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_watershed_boundaries', label: 'LA County Watershed Boundaries', description: 'LA County - Watershed Boundaries for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_wbd_hu12', label: 'LA County WBD HU12', description: 'LA County - Watershed Boundary Dataset HU12 for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_wbd_hu10', label: 'LA County WBD HU10', description: 'LA County - Watershed Boundary Dataset HU10 for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_wbd_hu8', label: 'LA County WBD HU8', description: 'LA County - Watershed Boundary Dataset HU8 for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_simpler', label: 'LA County Hydrology (Simpler)', description: 'LA County - Simpler Hydrology for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_lakes_simpler', label: 'LA County Lakes (Simpler)', description: 'LA County - Lakes (Simpler) for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_nhd_streams', label: 'LA County NHD Streams', description: 'LA County - NHD Streams (medium scale) for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_storm_drain_network', label: 'LA County Storm Drain Network', description: 'LA County - Storm Drain Network for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_inlets_outlets', label: 'LA County Inlets/Outlets', description: 'LA County - Inlets/Outlets for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_maintenance_holes', label: 'LA County Maintenance Holes', description: 'LA County - Maintenance Holes for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_maintenance_holes_lacfcd', label: 'LA County Maintenance Holes (LACFCD)', description: 'LA County - Maintenance Holes Maintained by LACFCD for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_maintenance_holes_city', label: 'LA County Maintenance Holes (City)', description: 'LA County - Maintenance Holes Maintained by City for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_maintenance_holes_unknown', label: 'LA County Maintenance Holes (Unknown)', description: 'LA County - Maintenance Holes Maintenance Unknown for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_basins', label: 'LA County Basins', description: 'LA County - Basins for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_debris_basins_lacfcd', label: 'LA County Debris Basins (LACFCD)', description: 'LA County - Debris Basins Maintained by LACFCD for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_debris_basins_city', label: 'LA County Debris Basins (City)', description: 'LA County - Debris Basins Maintained by City for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_debris_basins_caltrans', label: 'LA County Debris Basins (Caltrans)', description: 'LA County - Debris Basins Maintained by Caltrans for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_debris_basins_unknown', label: 'LA County Debris Basins (Unknown)', description: 'LA County - Debris Basins Maintenance Unknown for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_catch_basins', label: 'LA County Catch Basins', description: 'LA County - Catch Basins for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_catch_basins_lacfcd', label: 'LA County Catch Basins (LACFCD)', description: 'LA County - Catch Basins Maintained by LACFCD for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_catch_basins_city', label: 'LA County Catch Basins (City)', description: 'LA County - Catch Basins Maintained by City for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_catch_basins_rmd', label: 'LA County Catch Basins (RMD)', description: 'LA County - Catch Basins Maintained by RMD for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_catch_basins_others', label: 'LA County Catch Basins (Others)', description: 'LA County - Catch Basins Maintained by Others for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_catch_basins_caltrans', label: 'LA County Catch Basins (Caltrans)', description: 'LA County - Catch Basins Maintained by Caltrans for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_catch_basins_unknown', label: 'LA County Catch Basins (Unknown)', description: 'LA County - Catch Basins Maintenance Unknown for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_low_flow_diversion', label: 'LA County Low Flow Diversion', description: 'LA County - Low Flow Diversion for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_lfd_lacfcd', label: 'LA County LFD (LACFCD)', description: 'LA County - LFD Maintained by LACFCD for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_lfd_city', label: 'LA County LFD (City)', description: 'LA County - LFD Maintained by City for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_lfd_unknown', label: 'LA County LFD (Unknown)', description: 'LA County - LFD Maintenance Unknown for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_pump_stations', label: 'LA County Pump Stations', description: 'LA County - Pump Stations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_pump_stations_completed', label: 'LA County Pump Stations (Completed)', description: 'LA County - Pump Stations Completed for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_pump_stations_city_la', label: 'LA County Pump Stations (City of LA)', description: 'LA County - Pump Stations Maintained by City of LA for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_pump_stations_investigate', label: 'LA County Pump Stations (To Investigate)', description: 'LA County - Pump Stations to Investigate for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_channels', label: 'LA County Channels', description: 'LA County - Channels for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_channels_lacfcd', label: 'LA County Channels (LACFCD)', description: 'LA County - Channels Maintained by LACFCD for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_channels_city', label: 'LA County Channels (City)', description: 'LA County - Channels Maintained by City for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_channels_usace', label: 'LA County Channels (USACE)', description: 'LA County - Channels Maintained by US Army Corps of Engineers for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_channels_caltrans', label: 'LA County Channels (Caltrans)', description: 'LA County - Channels Maintained by Caltrans for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_channels_unknown', label: 'LA County Channels (Unknown)', description: 'LA County - Channels Maintenance Unknown for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_drains', label: 'LA County Drains', description: 'LA County - Drains for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_drains_lacfcd', label: 'LA County Drains (LACFCD)', description: 'LA County - Drains Maintained by LACFCD for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_drains_city', label: 'LA County Drains (City)', description: 'LA County - Drains Maintained by City for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_drains_road', label: 'LA County Drains (Road)', description: 'LA County - Drains Maintained by Road for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_drains_metro_parks', label: 'LA County Drains (Metro/Parks)', description: 'LA County - Drains Maintained by Metro/Parks & Recreation for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_drains_private', label: 'LA County Drains (Private)', description: 'LA County - Drains Maintained by Private/Permittee/Others for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_drains_caltrans', label: 'LA County Drains (Caltrans)', description: 'LA County - Drains Maintained by Caltrans for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_drains_unknown', label: 'LA County Drains (Unknown)', description: 'LA County - Drains Maintenance Unknown for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_laterals', label: 'LA County Laterals', description: 'LA County - Laterals for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_laterals_lacfcd', label: 'LA County Laterals (LACFCD)', description: 'LA County - Laterals Maintained by LACFCD for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_laterals_city', label: 'LA County Laterals (City)', description: 'LA County - Laterals Maintained by City for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_laterals_road', label: 'LA County Laterals (Road)', description: 'LA County - Laterals Maintained by Road for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_laterals_metro_parks', label: 'LA County Laterals (Metro/Parks)', description: 'LA County - Laterals Maintained by Metro/Parks & Recreation for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_laterals_private', label: 'LA County Laterals (Private)', description: 'LA County - Laterals Maintained by Private/Permittee/Others for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_laterals_caltrans', label: 'LA County Laterals (Caltrans)', description: 'LA County - Laterals Maintained by Caltrans for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_laterals_unknown', label: 'LA County Laterals (Unknown)', description: 'LA County - Laterals Maintenance Unknown for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_culverts', label: 'LA County Culverts', description: 'LA County - Culverts for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_culverts_completed', label: 'LA County Culverts (Completed)', description: 'LA County - Culverts Completed for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_culverts_investigate', label: 'LA County Culverts (To Investigate)', description: 'LA County - Culverts to Investigate for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_culverts_city_la', label: 'LA County Culverts (City of LA)', description: 'LA County - Culverts Maintained by City of LA for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_permitted_connections', label: 'LA County Permitted Connections', description: 'LA County - Permitted Connections for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_force_mains', label: 'LA County Force Mains', description: 'LA County - Force Mains for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_force_mains_completed', label: 'LA County Force Mains (Completed)', description: 'LA County - Force Mains Completed for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_force_mains_investigate', label: 'LA County Force Mains (To Investigate)', description: 'LA County - Force Mains to Investigate for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_force_mains_city_la', label: 'LA County Force Mains (City of LA)', description: 'LA County - Force Mains Maintained by City of LA for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_force_mains_caltrans', label: 'LA County Force Mains (Caltrans)', description: 'LA County - Force Mains Maintained by Caltrans for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_natural_drainage', label: 'LA County Natural Drainage', description: 'LA County - Natural Drainage for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_pseudo_line', label: 'LA County Pseudo Line', description: 'LA County - Pseudo Line for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  { id: 'la_county_hydrology_embankment', label: 'LA County Embankment', description: 'LA County - Embankment for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Hydrology' },
  // LA County Infrastructure - grouped together
  { id: 'la_county_infrastructure_county_facilities', label: 'LA County Facilities', description: 'LA County - County Facilities for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Infrastructure' },
  { id: 'la_county_infrastructure_county_buildings', label: 'LA County-owned Buildings', description: 'LA County - County-owned Buildings for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Infrastructure' },
  { id: 'la_county_fire_hydrants', label: 'LA County Fire Hydrants', description: 'LA County - Fire hydrants within the Los Angeles County Fire Department jurisdiction for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Infrastructure' },
  // Chicago Data Portal
  { id: 'chicago_311', label: 'Chicago 311 Service Requests', description: 'Chicago - 311 service requests from the City of Chicago Data Portal for proximity queries (up to 1 mile)', isPOI: true, defaultRadius: 0.25, maxRadius: 1, category: 'il', section: 'il', subCategory: 'Chicago Data Portal' },
  { id: 'chicago_building_footprints', label: 'Chicago Building Centroids', description: 'Chicago - Building centroids from the City of Chicago Data Portal for proximity queries (up to 1 mile)', isPOI: true, defaultRadius: 0.25, maxRadius: 1, category: 'il', section: 'il', subCategory: 'Chicago Data Portal' },
  { id: 'chicago_traffic_crashes', label: 'Chicago Traffic Crashes', description: 'Chicago - Traffic crashes from the City of Chicago Data Portal for proximity queries (up to 1 mile)', isPOI: true, defaultRadius: 0.25, maxRadius: 1, category: 'il', section: 'il', subCategory: 'Chicago Data Portal' },
  { id: 'chicago_speed_cameras', label: 'Chicago Speed Camera Locations', description: 'Chicago - Speed camera locations from the City of Chicago Data Portal for proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'il', section: 'il', subCategory: 'Chicago Data Portal' },
  { id: 'chicago_red_light_cameras', label: 'Chicago Red Light Camera Locations', description: 'Chicago - Red light camera locations from the City of Chicago Data Portal for proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'il', section: 'il', subCategory: 'Chicago Data Portal' },
  // NYC Data Portal
  { id: 'nyc_mappluto', label: 'NYC MapPLUTO Tax Lots', description: 'NYC - Tax lots from NYC MapPLUTO for point-in-polygon and proximity queries (up to 1 mile)', isPOI: true, defaultRadius: 0.25, maxRadius: 1, category: 'ny', section: 'ny', subCategory: 'NYC Data Portal' },
  { id: 'nyc_bike_routes', label: 'NYC Bike Routes', description: 'NYC - Bike routes network for proximity queries (0.5, 1.0, 2.5, and 5 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 5, category: 'ny', section: 'ny', subCategory: 'NYC Data Portal' },
  { id: 'nyc_neighborhoods', label: 'NYC Neighborhoods', description: 'NYC - Neighborhood Tabulation Areas 2020 for point-in-polygon and proximity queries (up to 1 mile)', isPOI: true, defaultRadius: 0.25, maxRadius: 1, category: 'ny', section: 'ny', subCategory: 'NYC Data Portal' },
  { id: 'houston_neighborhoods', label: 'HoustonCO Neighborhoods', description: 'HoustonCO - Neighborhoods for point-in-polygon and proximity queries (up to 10 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 10, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_neighborhoods_2021', label: 'Houston Neighborhoods', description: 'Houston - Neighborhoods 2021 for point-in-polygon and proximity queries (up to 10 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 10, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_site_addresses', label: 'Houston Site Addresses', description: 'Houston - Site Addresses for proximity queries (up to 1 mile)', isPOI: true, defaultRadius: 0.25, maxRadius: 1, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_roads_centerline', label: 'Houston Roads Centerline', description: 'Houston - Roads Centerline for proximity queries (up to 1 mile)', isPOI: true, defaultRadius: 0.25, maxRadius: 1, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_olc_grid_6digit', label: 'Houston OLC Grid - 6 Digits', description: 'Houston - OLC Grid 6-digit cells for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_olc_grid_8digit', label: 'Houston OLC Grid - 8 Digits', description: 'Houston - OLC Grid 8-digit cells for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_fire_stations', label: 'Houston Fire Stations', description: 'Houston - HFD Fire Stations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 25, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_tirz', label: 'Houston Tax Incentive Reinvestment Zones', description: 'Houston - Tax Incentive Reinvestment Zones (TIRZ) for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 0.25, maxRadius: 10, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_metro_bus_routes', label: 'Houston Metro Bus Routes', description: 'Houston - Metro Bus Routes for proximity queries (0.25, 0.50, 0.75, 1.0, 5.0 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_metro_park_and_ride', label: 'Houston METRO Park and Ride Locations', description: 'Houston - METRO Park and Ride Locations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 25, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_metro_transit_centers', label: 'Houston METRO Transit Centers', description: 'Houston - METRO Transit Centers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 25, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_metro_rail_stations', label: 'Houston METRO Rail Stations', description: 'Houston - METRO Rail Stations (current) for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 25, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_airports', label: 'Houston Airports', description: 'Houston - Airports for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 25, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'houston_bikeways', label: 'Houston Bikeways (Existing)', description: 'Houston - Bikeways Existing linear network for proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'tx', section: 'tx', subCategory: 'Houston Data Portal' },
  { id: 'nyc_zoning_districts', label: 'NYC Zoning Districts', description: 'NYC - Zoning districts for point-in-polygon and proximity queries (up to 1 mile)', isPOI: true, defaultRadius: 0.25, maxRadius: 1, category: 'ny', section: 'ny', subCategory: 'NYC Data Portal' },
  { id: 'nyc_waterfront_hpb_launch_site', label: 'NYC HPB Launch Site', description: 'NYC - HPB Launch Site points for proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 5, category: 'ny', section: 'ny', subCategory: 'NYC Data Portal' },
  { id: 'nyc_waterfront_parks', label: 'NYC Waterfront Parks', description: 'NYC - Waterfront Parks polygons for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 5, category: 'ny', section: 'ny', subCategory: 'NYC Data Portal' },
  { id: 'nyc_waterfront_paws', label: 'NYC PAWS Publicly Accessible Waterfront Spaces', description: 'NYC - PAWS Publicly Accessible Waterfront Spaces polygons for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 5, category: 'ny', section: 'ny', subCategory: 'NYC Data Portal' },
  { id: 'nyc_business_improvement_districts', label: 'NYC Business Improvement Districts', description: 'NYC - Business Improvement Districts for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 5, category: 'ny', section: 'ny', subCategory: 'NYC Data Portal' },
  { id: 'nyc_community_districts', label: 'NYC Community Districts', description: 'NYC - Community Districts for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.5, maxRadius: 5, category: 'ny', section: 'ny', subCategory: 'NYC Data Portal' },
  { id: 'la_county_infrastructure_schools', label: 'LA County Schools', description: 'LA County - Schools for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Infrastructure' },
  { id: 'la_county_infrastructure_county_parcels', label: 'LA County-owned Parcels', description: 'LA County - County-owned Parcels for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Infrastructure' },
  { id: 'la_county_infrastructure_government_parcels', label: 'LA County Government-owned Parcels', description: 'LA County - Government-owned Parcels for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Infrastructure' },
  // LA County Administrative Boundaries - grouped together
  { id: 'la_county_admin_boundaries_isd_facilities', label: 'LA County ISD Facilities Operations Service Maintenance Districts', description: 'LA County - ISD Facilities Operations Service Maintenance Districts for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_school_districts', label: 'LA County School District Boundaries', description: 'LA County - School District Boundaries for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_park_planning_areas', label: 'LA County Park Planning Areas', description: 'LA County - Park Planning Areas for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_dcfs_office', label: 'LA County DCFS Office Boundaries', description: 'LA County - DCFS Office Boundaries for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_health_districts_2022', label: 'LA County Health Districts (2022)', description: 'LA County - Health Districts (2022) for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_health_districts_2012', label: 'LA County Health Districts (2012)', description: 'LA County - Health Districts (2012) for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_service_planning_areas_2022', label: 'LA County Service Planning Areas (2022)', description: 'LA County - Service Planning Areas (2022) for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_service_planning_areas_2012', label: 'LA County Service Planning Areas (2012)', description: 'LA County - Service Planning Areas (2012) for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_disaster_management_areas', label: 'LA County Disaster Management Areas', description: 'LA County - Disaster Management Areas for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_zipcodes', label: 'LA County Zipcodes', description: 'LA County - Zipcodes for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_regional_centers', label: 'LA County Regional Centers (2014)', description: 'LA County - Regional Centers (2014) for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_public_safety', label: 'LA County Public Safety', description: 'LA County - Public Safety for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_reporting_districts', label: 'LA County Reporting Districts', description: 'LA County - Reporting Districts for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_station_boundaries', label: 'LA County Station Boundaries', description: 'LA County - Station Boundaries for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_fire_station_boundaries', label: 'LA County Fire Station Boundaries', description: 'LA County - Fire Station Boundaries for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_psap_boundaries', label: 'LA County PSAP Boundaries', description: 'LA County - Public Safety Answering Point (PSAP) Boundaries for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_library', label: 'LA County Library', description: 'LA County - Library for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_library_planning_areas', label: 'LA County Library Planning Areas', description: 'LA County - Library Planning Areas for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_library_service_areas', label: 'LA County Library Service Areas', description: 'LA County - Library Service Areas for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_state_enterprise_zones', label: 'LA County State Enterprise Zones', description: 'LA County - State Enterprise Zones for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  { id: 'la_county_admin_boundaries_animal_care_control', label: 'LA County Animal Care and Control Service Areas', description: 'LA County - Animal Care and Control Service Areas for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Administrative Boundaries' },
  // LA County Elevation - grouped together
  { id: 'la_county_elevation_contours_l4', label: 'LA County Contours L4', description: 'LA County - Contours L4 for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_contours_1000ft_l4', label: 'LA County LARIAC Contours 1000FT L4', description: 'LA County - LARIAC Contours 1000FT L4 for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_contours_250ft_l4', label: 'LA County LARIAC Contours 250FT L4', description: 'LA County - LARIAC Contours 250FT L4 for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_contours_50ft_l4', label: 'LA County LARIAC Contours 50FT L4', description: 'LA County - LARIAC Contours 50FT L4 for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_contours_10ft_l4', label: 'LA County LARIAC Contours 10FT L4', description: 'LA County - LARIAC Contours 10FT L4 for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_contours_2ft_l4', label: 'LA County LARIAC Contours 2FT L4', description: 'LA County - LARIAC Contours 2FT L4 for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_contours_1ft_l4', label: 'LA County LARIAC Contours 1FT L4', description: 'LA County - LARIAC Contours 1FT L4 for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_contours', label: 'LA County Contours', description: 'LA County - Contours for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_contours_250ft', label: 'LA County LARIAC Contours 250ft', description: 'LA County - LARIAC Contours 250ft for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_contours_50ft', label: 'LA County LARIAC Contours 50ft', description: 'LA County - LARIAC Contours 50ft for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_contours_10ft', label: 'LA County LARIAC Contours 10ft', description: 'LA County - LARIAC Contours 10ft for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_raster', label: 'LA County Elevation Data (Raster)', description: 'LA County - Elevation Data (Raster) - Visualization only, toggle on/off for map display', isPOI: false, defaultRadius: 0, maxRadius: 0, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_hillshade', label: 'LA County LARIAC Hillshade (2006)', description: 'LA County - LARIAC Hillshade (2006) - Visualization only, toggle on/off for map display', isPOI: false, defaultRadius: 0, maxRadius: 0, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_dem', label: 'LA County LARIAC Digital Elevation Model (2006)', description: 'LA County - LARIAC Digital Elevation Model (2006) - Visualization only, toggle on/off for map display', isPOI: false, defaultRadius: 0, maxRadius: 0, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_dsm', label: 'LA County LARIAC Digital Surface Model (2006)', description: 'LA County - LARIAC Digital Surface Model (2006) - Visualization only, toggle on/off for map display', isPOI: false, defaultRadius: 0, maxRadius: 0, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  { id: 'la_county_elevation_points', label: 'LA County Elevation Points (For Profile Tool)', description: 'LA County - Elevation Points (For Profile Tool) for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Elevation' },
  // LA County Demographics - grouped together
  { id: 'la_county_demographics_2020_census', label: 'LA County 2020 Census', description: 'LA County - 2020 Census for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2020_tracts', label: 'LA County 2020 Census Tracts', description: 'LA County - 2020 Census Tracts for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2020_block_groups', label: 'LA County 2020 Census Block Groups', description: 'LA County - 2020 Census Block Groups for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2020_blocks', label: 'LA County 2020 Census Blocks', description: 'LA County - 2020 Census Blocks for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2018_estimates', label: 'LA County 2018 Estimates', description: 'LA County - 2018 Estimates for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2018_population_poverty', label: 'LA County 2018 Population and Poverty by Tract', description: 'LA County - 2018 Population and Poverty by Tract for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2018_median_income', label: 'LA County 2018 Median Household Income by Tract', description: 'LA County - 2018 Median Household Income by Tract for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2010_census', label: 'LA County 2010 Census', description: 'LA County - 2010 Census for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2010_tracts', label: 'LA County 2010 Census Data by Tract', description: 'LA County - 2010 Census Data by Tract for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2010_block_groups', label: 'LA County 2010 Census Block Groups (Geography Only)', description: 'LA County - 2010 Census Block Groups (Geography Only) for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2010_blocks', label: 'LA County 2010 Census Data By Block', description: 'LA County - 2010 Census Data By Block for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2000_census', label: 'LA County 2000 Census', description: 'LA County - 2000 Census for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2000_tracts', label: 'LA County 2000 Census Tracts', description: 'LA County - 2000 Census Tracts for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2000_block_groups', label: 'LA County 2000 Census Block Groups', description: 'LA County - 2000 Census Block Groups for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_2000_blocks', label: 'LA County 2000 Census Blocks', description: 'LA County - 2000 Census Blocks for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_1990_census', label: 'LA County 1990 Census', description: 'LA County - 1990 Census for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_demographics_1990_tracts', label: 'LA County 1990 Census Tracts', description: 'LA County - 1990 Census Tracts for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Demographics' },
  { id: 'la_county_arts_recreation', label: 'LA County Arts and Recreation', description: 'LA County - Arts and Recreation Points of Interest. Proximity queries up to 25 miles.', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Points of Interest' },
  { id: 'la_county_education', label: 'LA County Education', description: 'LA County - Education Points of Interest. Proximity queries up to 25 miles.', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Points of Interest' },
  { id: 'la_county_hospitals', label: 'LA County Hospitals', description: 'LA County - Hospitals Points of Interest. Proximity queries up to 25 miles.', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Points of Interest' },
  { id: 'la_county_municipal_services', label: 'LA County Municipal Services', description: 'LA County - Municipal Services Points of Interest. Proximity queries up to 25 miles.', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Points of Interest' },
  { id: 'la_county_physical_features', label: 'LA County Physical Features', description: 'LA County - Physical Features Points of Interest. Proximity queries up to 25 miles.', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Points of Interest' },
  { id: 'la_county_public_safety', label: 'LA County Public Safety', description: 'LA County - Public Safety Points of Interest. Proximity queries up to 25 miles.', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Points of Interest' },
  { id: 'la_county_transportation', label: 'LA County Transportation', description: 'LA County - Transportation Points of Interest. Proximity queries up to 25 miles.', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Points of Interest' },
  { id: 'la_county_historic_cultural_monuments', label: 'LA County Historic Cultural Monuments', description: 'City of Los Angeles - Historic Cultural Monuments for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Cultural & Historic' },
  { id: 'la_county_housing_lead_risk', label: 'LA County Housing with Potential Lead Risk', description: 'LA County - Housing with Potential Lead Risk areas for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Housing & Health' },
  { id: 'la_county_school_district_boundaries', label: 'LA County School District Boundaries', description: 'LA County - School District Boundaries for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Housing & Health' },
  { id: 'la_county_street_inventory', label: 'LA County Street Inventory', description: 'LA County - StreetsLA GeoHub Street Inventory for proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  // LA County Transportation layers - All layers support proximity queries up to 25 miles
  { id: 'la_county_transportation', label: 'LA County Transportation', description: 'LA County Transportation - Transportation for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  { id: 'la_county_milepost_markers', label: 'LA County Milepost Markers', description: 'LA County Transportation - Milepost Markers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  { id: 'la_county_rail_transportation', label: 'LA County Rail Transportation', description: 'LA County Transportation - Rail Transportation for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  { id: 'la_county_freeways', label: 'LA County Freeways', description: 'LA County Transportation - Freeways for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  { id: 'la_county_disaster_routes', label: 'LA County Disaster Routes', description: 'LA County Transportation - Disaster Routes for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  { id: 'la_county_highway_shields', label: 'LA County Highway Shields', description: 'LA County Transportation - Highway Shields for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  { id: 'la_county_freeways_lines', label: 'LA County Freeways (Lines)', description: 'LA County Transportation - Freeways (Lines) for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  { id: 'la_county_metro_park_ride', label: 'LA County Metro Park and Ride', description: 'LA County Transportation - Metro Park and Ride for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  { id: 'la_county_metro_stations', label: 'LA County Metro Stations', description: 'LA County Transportation - Metro Stations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  { id: 'la_county_metrolink_stations', label: 'LA County Metrolink Stations', description: 'LA County Transportation - Metrolink Stations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  { id: 'la_county_metrolink_lines', label: 'LA County Metrolink Lines', description: 'LA County Transportation - Metrolink Lines for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  { id: 'la_county_metro_lines', label: 'LA County Metro Lines', description: 'LA County Transportation - Metro Lines for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  { id: 'la_county_railroads', label: 'LA County Railroads', description: 'LA County Transportation - Railroads for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'Transportation' },
  // LA County LMS Data - Arts and Recreation (0-19)
  { id: 'la_county_lms_arts_recreation', label: 'LA County LMS Arts and Recreation', description: 'LA County LMS Data - Arts and Recreation for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_beaches_marinas', label: 'LA County LMS Beaches and Marinas', description: 'LA County LMS Data - Beaches and Marinas for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_campgrounds', label: 'LA County LMS Campgrounds', description: 'LA County LMS Data - Campgrounds for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_cruise_line_terminals', label: 'LA County LMS Cruise Line Terminals', description: 'LA County LMS Data - Cruise Line Terminals for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_cultural_performing_arts', label: 'LA County LMS Cultural and Performing Arts Centers', description: 'LA County LMS Data - Cultural and Performing Arts Centers for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_golf_courses', label: 'LA County LMS Golf Courses', description: 'LA County LMS Data - Golf Courses for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_museums_aquariums', label: 'LA County LMS Museums and Aquariums', description: 'LA County LMS Data - Museums and Aquariums for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_natural_areas_wildlife', label: 'LA County LMS Natural Areas and Wildlife Sanctuaries', description: 'LA County LMS Data - Natural Areas and Wildlife Sanctuaries for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_parks_gardens', label: 'LA County LMS Parks and Gardens', description: 'LA County LMS Data - Parks and Gardens for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_picnic_areas', label: 'LA County LMS Picnic Areas', description: 'LA County LMS Data - Picnic Areas for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_pools', label: 'LA County LMS Pools', description: 'LA County LMS Data - Pools for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_ranches', label: 'LA County LMS Ranches', description: 'LA County LMS Data - Ranches for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_recreation_centers', label: 'LA County LMS Recreation Centers', description: 'LA County LMS Data - Recreation Centers for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_recreation_clubs', label: 'LA County LMS Recreation Clubs', description: 'LA County LMS Data - Recreation Clubs for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_recreation_programs', label: 'LA County LMS Recreation Programs', description: 'LA County LMS Data - Recreation Programs for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_ski_areas', label: 'LA County LMS Ski Areas', description: 'LA County LMS Data - Ski Areas for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_sports_venues', label: 'LA County LMS Sports Venues', description: 'LA County LMS Data - Sports Venues for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_tourist_assistance', label: 'LA County LMS Tourist Assistance', description: 'LA County LMS Data - Tourist Assistance for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_trails', label: 'LA County LMS Trails', description: 'LA County LMS Data - Trails for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_wineries', label: 'LA County LMS Wineries', description: 'LA County LMS Data - Wineries for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Communications (20-36)
  { id: 'la_county_lms_communications', label: 'LA County LMS Communications', description: 'LA County LMS Data - Communications for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_am_antennas', label: 'LA County LMS AM Antennas', description: 'LA County LMS Data - AM Antennas for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_antenna_structure_registration', label: 'LA County LMS Antenna Structure Registration', description: 'LA County LMS Data - Antenna Structure Registration for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_brs_ebs_transmitters', label: 'LA County LMS BRS and EBS Transmitters', description: 'LA County LMS Data - BRS and EBS Transmitters for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_cellular_towers', label: 'LA County LMS Cellular Towers', description: 'LA County LMS Data - Cellular Towers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_digital_tv', label: 'LA County LMS Digital TV', description: 'LA County LMS Data - Digital TV for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_fm_antennas', label: 'LA County LMS FM Antennas', description: 'LA County LMS Data - FM Antennas for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_internet_exchange_points', label: 'LA County LMS Internet Exchange Points', description: 'LA County LMS Data - Internet Exchange Points for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_internet_service_providers', label: 'LA County LMS Internet Service Providers', description: 'LA County LMS Data - Internet Service Providers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_it_portal_locations', label: 'LA County LMS IT Portal Locations', description: 'LA County LMS Data - IT Portal Locations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_land_mobile_broadcast', label: 'LA County LMS Land Mobile Broadcast', description: 'LA County LMS Data - Land Mobile Broadcast for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_land_mobile_commercial_towers', label: 'LA County LMS Land Mobile Commercial Towers', description: 'LA County LMS Data - Land Mobile Commercial Towers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_land_mobile_private', label: 'LA County LMS Land Mobile Private', description: 'LA County LMS Data - Land Mobile Private for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_microwave_towers', label: 'LA County LMS Microwave Towers', description: 'LA County LMS Data - Microwave Towers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_ntsc_tv', label: 'LA County LMS NTSC TV', description: 'LA County LMS Data - NTSC TV for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_paging_towers', label: 'LA County LMS Paging Towers', description: 'LA County LMS Data - Paging Towers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_towers', label: 'LA County LMS Towers', description: 'LA County LMS Data - Towers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Community Groups (37-42)
  { id: 'la_county_lms_community_groups', label: 'LA County LMS Community Groups', description: 'LA County LMS Data - Community Groups for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_churches', label: 'LA County LMS Churches', description: 'LA County LMS Data - Churches for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_community_organizations', label: 'LA County LMS Community Organizations', description: 'LA County LMS Data - Community Organizations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_farmers_markets', label: 'LA County LMS Farmers Markets', description: 'LA County LMS Data - Farmers Markets for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_red_cross_offices', label: 'LA County LMS Red Cross Offices', description: 'LA County LMS Data - Red Cross Offices for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_volunteer_opportunities', label: 'LA County LMS Volunteer Opportunities', description: 'LA County LMS Data - Volunteer Opportunities for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Education (43-53)
  { id: 'la_county_lms_education', label: 'LA County LMS Education', description: 'LA County LMS Data - Education for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_adult_education', label: 'LA County LMS Adult Education', description: 'LA County LMS Data - Adult Education for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_colleges_universities', label: 'LA County LMS Colleges and Universities', description: 'LA County LMS Data - Colleges and Universities for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_early_childhood_education', label: 'LA County LMS Early Childhood Education and Head Start', description: 'LA County LMS Data - Early Childhood Education and Head Start for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_guidance_tutoring', label: 'LA County LMS Guidance and Tutoring Programs', description: 'LA County LMS Data - Guidance and Tutoring Programs for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_private_charter_schools', label: 'LA County LMS Private and Charter Schools', description: 'LA County LMS Data - Private and Charter Schools for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_public_elementary_schools', label: 'LA County LMS Public Elementary Schools', description: 'LA County LMS Data - Public Elementary Schools for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_public_high_schools', label: 'LA County LMS Public High Schools', description: 'LA County LMS Data - Public High Schools for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_public_middle_school', label: 'LA County LMS Public Middle School', description: 'LA County LMS Data - Public Middle School for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_school_districts', label: 'LA County LMS School Districts', description: 'LA County LMS Data - School Districts for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_special_curriculum_schools', label: 'LA County LMS Special Curriculum Schools and Programs', description: 'LA County LMS Data - Special Curriculum Schools and Programs for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Emergency Response (54, 55, 56, 192)
  { id: 'la_county_lms_emergency_response', label: 'LA County LMS Emergency Response', description: 'LA County LMS Data - Emergency Response for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_warming_centers', label: 'LA County LMS Warming Centers', description: 'LA County LMS Data - Warming Centers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_cooling_centers', label: 'LA County LMS Cooling Centers', description: 'LA County LMS Data - Cooling Centers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_emergency_disaster_offices', label: 'LA County LMS Emergency and Disaster Offices', description: 'LA County LMS Data - Emergency and Disaster Offices for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Environment (57-64)
  { id: 'la_county_lms_environment', label: 'LA County LMS Environment', description: 'LA County LMS Data - Environment for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_conservation_programs', label: 'LA County LMS Conservation Programs', description: 'LA County LMS Data - Conservation Programs for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_epa_facility_registration', label: 'LA County LMS EPA Facility Registration System', description: 'LA County LMS Data - EPA Facility Registration System for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_epa_superfund_sites', label: 'LA County LMS EPA Superfund Sites', description: 'LA County LMS Data - EPA Superfund Sites for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_hazardous_waste_disposal', label: 'LA County LMS Hazardous Waste Disposal', description: 'LA County LMS Data - Hazardous Waste Disposal for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_historic_earthquakes', label: 'LA County LMS Historic Earthquakes', description: 'LA County LMS Data - Historic Earthquakes for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_recycling', label: 'LA County LMS Recycling', description: 'LA County LMS Data - Recycling for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_tsunami_tide_gauges', label: 'LA County LMS Tsunami Tide Gauges', description: 'LA County LMS Data - Tsunami Tide Gauges for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Government (65-73)
  { id: 'la_county_lms_government', label: 'LA County LMS Government', description: 'LA County LMS Data - Government for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_chambers_of_commerce', label: 'LA County LMS Chambers of Commerce', description: 'LA County LMS Data - Chambers of Commerce for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_city_halls', label: 'LA County LMS City Halls', description: 'LA County LMS Data - City Halls for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_consulate_offices', label: 'LA County LMS Consulate Offices', description: 'LA County LMS Data - Consulate Offices for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_county_offices', label: 'LA County LMS County Offices', description: 'LA County LMS Data - County Offices for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_government_offices', label: 'LA County LMS Government Offices', description: 'LA County LMS Data - Government Offices for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_passports', label: 'LA County LMS Passports', description: 'LA County LMS Data - Passports for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_representative_offices', label: 'LA County LMS Representative Offices', description: 'LA County LMS Data - Representative Offices for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_social_security_administration', label: 'LA County LMS Social Security Administration', description: 'LA County LMS Data - Social Security Administration for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Health and Mental Health (74-89)
  { id: 'la_county_lms_health_mental_health', label: 'LA County LMS Health and Mental Health', description: 'LA County LMS Data - Health and Mental Health for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_dental_care', label: 'LA County LMS Dental Care', description: 'LA County LMS Data - Dental Care for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_dhs_health_clinics', label: 'LA County LMS DHS Health Clinics', description: 'LA County LMS Data - DHS Health Clinics for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_health_centers', label: 'LA County LMS Health Centers', description: 'LA County LMS Data - Health Centers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_health_clinics', label: 'LA County LMS Health Clinics', description: 'LA County LMS Data - Health Clinics for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_health_education_counseling', label: 'LA County LMS Health Education and Counseling', description: 'LA County LMS Data - Health Education and Counseling for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_health_screening_testing', label: 'LA County LMS Health Screening and Testing', description: 'LA County LMS Data - Health Screening and Testing for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_hospitals_medical_centers', label: 'LA County LMS Hospitals and Medical Centers', description: 'LA County LMS Data - Hospitals and Medical Centers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_immunization', label: 'LA County LMS Immunization', description: 'LA County LMS Data - Immunization for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_medicare_medicaid_offices', label: 'LA County LMS Medicare and Medicaid Offices', description: 'LA County LMS Data - Medicare and Medicaid Offices for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_mental_health_centers', label: 'LA County LMS Mental Health Centers', description: 'LA County LMS Data - Mental Health Centers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_mental_health_counseling', label: 'LA County LMS Mental Health Counseling', description: 'LA County LMS Data - Mental Health Counseling for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_mental_health_programs', label: 'LA County LMS Mental Health Programs', description: 'LA County LMS Data - Mental Health Programs for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_public_health_programs', label: 'LA County LMS Public Health Programs', description: 'LA County LMS Data - Public Health Programs for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_safe_havens', label: 'LA County LMS Safe Havens', description: 'LA County LMS Data - Safe Havens for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_substance_abuse_programs', label: 'LA County LMS Substance Abuse Programs', description: 'LA County LMS Data - Substance Abuse Programs for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Municipal Services (90-108)
  { id: 'la_county_lms_municipal_services', label: 'LA County LMS Municipal Services', description: 'LA County LMS Data - Municipal Services for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_animals_pets', label: 'LA County LMS Animals and Pets', description: 'LA County LMS Data - Animals and Pets for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_building_inspections', label: 'LA County LMS Building Inspections', description: 'LA County LMS Data - Building Inspections for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_cemeteries', label: 'LA County LMS Cemeteries', description: 'LA County LMS Data - Cemeteries for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_community_services', label: 'LA County LMS Community Services', description: 'LA County LMS Data - Community Services for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_consumer_services', label: 'LA County LMS Consumer Services', description: 'LA County LMS Data - Consumer Services for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_economic_development', label: 'LA County LMS Economic Development', description: 'LA County LMS Data - Economic Development for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_elections', label: 'LA County LMS Elections', description: 'LA County LMS Data - Elections for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_environmental_programs', label: 'LA County LMS Environmental Programs', description: 'LA County LMS Data - Environmental Programs for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_health_housing_inspections', label: 'LA County LMS Health and Housing Inspections', description: 'LA County LMS Data - Health and Housing Inspections for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_libraries', label: 'LA County LMS Libraries', description: 'LA County LMS Data - Libraries for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_licenses_permits', label: 'LA County LMS Licenses and Permits', description: 'LA County LMS Data - Licenses and Permits for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_planning_zoning', label: 'LA County LMS Planning and Zoning', description: 'LA County LMS Data - Planning and Zoning for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_property_tax', label: 'LA County LMS Property and Tax', description: 'LA County LMS Data - Property and Tax for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_public_internet_access', label: 'LA County LMS Public Internet Access', description: 'LA County LMS Data - Public Internet Access for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_public_records', label: 'LA County LMS Public Records', description: 'LA County LMS Data - Public Records for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_rubbish_disposal', label: 'LA County LMS Rubbish Disposal', description: 'LA County LMS Data - Rubbish Disposal for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_street_maintenance', label: 'LA County LMS Street Maintenance', description: 'LA County LMS Data - Street Maintenance for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_utilities', label: 'LA County LMS Utilities', description: 'LA County LMS Data - Utilities for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Physical Features (109-113)
  { id: 'la_county_lms_physical_features', label: 'LA County LMS Physical Features', description: 'LA County LMS Data - Physical Features for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_electrical_substations', label: 'LA County LMS Electrical Sub-Stations', description: 'LA County LMS Data - Electrical Sub-Stations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_named_locations', label: 'LA County LMS Named Locations', description: 'LA County LMS Data - Named Locations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_power_plants', label: 'LA County LMS Power Plants', description: 'LA County LMS Data - Power Plants for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_water', label: 'LA County LMS Water', description: 'LA County LMS Data - Water for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Postal (114-120)
  { id: 'la_county_lms_postal', label: 'LA County LMS Postal', description: 'LA County LMS Data - Postal for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_dhl_locations', label: 'LA County LMS DHL Locations', description: 'LA County LMS Data - DHL Locations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_federal_express_locations', label: 'LA County LMS Federal Express Locations', description: 'LA County LMS Data - Federal Express Locations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_post_offices', label: 'LA County LMS Post Offices', description: 'LA County LMS Data - Post Offices for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_private_non_retail_shipping', label: 'LA County LMS Private Non Retail Shipping Locations', description: 'LA County LMS Data - Private Non Retail Shipping Locations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_ups_locations', label: 'LA County LMS UPS Locations', description: 'LA County LMS Data - UPS Locations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_usps_mail_collection_boxes', label: 'LA County LMS USPS Mail Collection Boxes', description: 'LA County LMS Data - USPS Mail Collection Boxes for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Private Industry (121-130)
  { id: 'la_county_lms_private_industry', label: 'LA County LMS Private Industry', description: 'LA County LMS Data - Private Industry for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_agriculture_food', label: 'LA County LMS Agriculture and Food', description: 'LA County LMS Data - Agriculture and Food for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_banking_finance', label: 'LA County LMS Banking and Finance', description: 'LA County LMS Data - Banking and Finance for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_business_centers', label: 'LA County LMS Business Centers', description: 'LA County LMS Data - Business Centers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_corporate_headquarters', label: 'LA County LMS Corporate Headquarters', description: 'LA County LMS Data - Corporate Headquarters for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_manufacturing', label: 'LA County LMS Manufacturing', description: 'LA County LMS Data - Manufacturing for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_mines', label: 'LA County LMS Mines', description: 'LA County LMS Data - Mines for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_oilfields', label: 'LA County LMS Oilfields', description: 'LA County LMS Data - Oilfields for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_shopping_centers', label: 'LA County LMS Shopping Centers', description: 'LA County LMS Data - Shopping Centers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_tv_movie_studios', label: 'LA County LMS TV and Movie Studios', description: 'LA County LMS Data - TV and Movie Studios for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Public Safety (131-146)
  { id: 'la_county_lms_public_safety', label: 'LA County LMS Public Safety', description: 'LA County LMS Data - Public Safety for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_courthouses', label: 'LA County LMS Courthouses', description: 'LA County LMS Data - Courthouses for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_crime_prevention_support', label: 'LA County LMS Crime Prevention and Support', description: 'LA County LMS Data - Crime Prevention and Support for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_crime_reporting_investigation', label: 'LA County LMS Crime Reporting and Investigation', description: 'LA County LMS Data - Crime Reporting and Investigation for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_district_attorney', label: 'LA County LMS District Attorney', description: 'LA County LMS Data - District Attorney for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_fingerprinting', label: 'LA County LMS Fingerprinting', description: 'LA County LMS Data - Fingerprinting for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_fire_stations', label: 'LA County LMS Fire Stations', description: 'LA County LMS Data - Fire Stations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_jails_prisons', label: 'LA County LMS Jails and Prisons', description: 'LA County LMS Data - Jails and Prisons for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_legal_services_counseling', label: 'LA County LMS Legal Services and Counseling', description: 'LA County LMS Data - Legal Services and Counseling for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_lifeguard_towers', label: 'LA County LMS Lifeguard Towers', description: 'LA County LMS Data - Lifeguard Towers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_parole_offender_assistance', label: 'LA County LMS Parole and Offender Assistance', description: 'LA County LMS Data - Parole and Offender Assistance for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_probation_camps_juvenile_halls', label: 'LA County LMS Probation Camps and Juvenile Halls', description: 'LA County LMS Data - Probation Camps and Juvenile Halls for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_probation_offices', label: 'LA County LMS Probation Offices', description: 'LA County LMS Data - Probation Offices for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_public_defender', label: 'LA County LMS Public Defender', description: 'LA County LMS Data - Public Defender for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_self_help_legal_centers', label: 'LA County LMS Self-Help Legal Centers', description: 'LA County LMS Data - Self-Help Legal Centers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_sheriff_police_stations', label: 'LA County LMS Sheriff and Police Stations', description: 'LA County LMS Data - Sheriff and Police Stations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Social Services (147-172)
  { id: 'la_county_lms_social_services', label: 'LA County LMS Social Services', description: 'LA County LMS Data - Social Services for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_adoption', label: 'LA County LMS Adoption', description: 'LA County LMS Data - Adoption for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_child_care', label: 'LA County LMS Child Care', description: 'LA County LMS Data - Child Care for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_child_support_services', label: 'LA County LMS Child Support Services', description: 'LA County LMS Data - Child Support Services for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_children_family_services', label: 'LA County LMS Children and Family Services', description: 'LA County LMS Data - Children and Family Services for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_clothing', label: 'LA County LMS Clothing', description: 'LA County LMS Data - Clothing for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_disability_support_services', label: 'LA County LMS Disability Support Services', description: 'LA County LMS Data - Disability Support Services for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_domestic_violence_services', label: 'LA County LMS Domestic Violence Services', description: 'LA County LMS Data - Domestic Violence Services for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_donation_services', label: 'LA County LMS Donation Services', description: 'LA County LMS Data - Donation Services for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_food_assistance', label: 'LA County LMS Food Assistance', description: 'LA County LMS Data - Food Assistance for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_forms_assistance', label: 'LA County LMS Forms Assistance', description: 'LA County LMS Data - Forms Assistance for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_homeless_shelters_services', label: 'LA County LMS Homeless Shelters and Services', description: 'LA County LMS Data - Homeless Shelters and Services for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_housing_assistance_information', label: 'LA County LMS Housing Assistance and Information', description: 'LA County LMS Data - Housing Assistance and Information for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_immigration', label: 'LA County LMS Immigration', description: 'LA County LMS Data - Immigration for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_job_training', label: 'LA County LMS Job Training', description: 'LA County LMS Data - Job Training for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_neg_program_worksource_centers', label: 'LA County LMS NEG Program WorkSource Centers', description: 'LA County LMS Data - NEG Program WorkSource Centers for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_payment_assistance', label: 'LA County LMS Payment Assistance', description: 'LA County LMS Data - Payment Assistance for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_public_housing', label: 'LA County LMS Public Housing', description: 'LA County LMS Data - Public Housing for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_public_information_services', label: 'LA County LMS Public Information Services', description: 'LA County LMS Data - Public Information Services for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_senior_services', label: 'LA County LMS Senior Services', description: 'LA County LMS Data - Senior Services for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_support_groups', label: 'LA County LMS Support Groups', description: 'LA County LMS Data - Support Groups for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_thrift_shops', label: 'LA County LMS Thrift Shops', description: 'LA County LMS Data - Thrift Shops for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_transportation_assistance', label: 'LA County LMS Transportation Assistance', description: 'LA County LMS Data - Transportation Assistance for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_unemployment_insurance_offices', label: 'LA County LMS Unemployment Insurance Offices', description: 'LA County LMS Data - Unemployment Insurance Offices for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_veterans_services', label: 'LA County LMS Veterans Services', description: 'LA County LMS Data - Veterans Services for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_welfare_offices_programs', label: 'LA County LMS Welfare Offices and Programs', description: 'LA County LMS Data - Welfare Offices and Programs for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County LMS Data - Transportation (173-191)
  { id: 'la_county_lms_transportation', label: 'LA County LMS Transportation', description: 'LA County LMS Data - Transportation for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_airports', label: 'LA County LMS Airports', description: 'LA County LMS Data - Airports for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_alternative_fuel', label: 'LA County LMS Alternative Fuel', description: 'LA County LMS Data - Alternative Fuel for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_amtrak_stations', label: 'LA County LMS Amtrak Stations', description: 'LA County LMS Data - Amtrak Stations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_anchorages', label: 'LA County LMS Anchorages', description: 'LA County LMS Data - Anchorages for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_automatic_traffic_counters', label: 'LA County LMS Automatic Traffic Counters', description: 'LA County LMS Data - Automatic Traffic Counters for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_breakwaters', label: 'LA County LMS Breakwaters', description: 'LA County LMS Data - Breakwaters for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_bridges', label: 'LA County LMS Bridges', description: 'LA County LMS Data - Bridges for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_ferries', label: 'LA County LMS Ferries', description: 'LA County LMS Data - Ferries for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_freeway_exits', label: 'LA County LMS Freeway Exits', description: 'LA County LMS Data - Freeway Exits for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_heliports', label: 'LA County LMS Heliports', description: 'LA County LMS Data - Heliports for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_intermodal_terminal_facilities', label: 'LA County LMS Intermodal Terminal Facilities', description: 'LA County LMS Data - Intermodal Terminal Facilities for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_metro_stations', label: 'LA County LMS Metro Stations', description: 'LA County LMS Data - Metro Stations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_metrolink_stations', label: 'LA County LMS Metrolink Stations', description: 'LA County LMS Data - Metrolink Stations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_park_and_ride_locations', label: 'LA County LMS Park and Ride Locations', description: 'LA County LMS Data - Park and Ride Locations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_transit_systems', label: 'LA County LMS Transit Systems', description: 'LA County LMS Data - Transit Systems for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_tunnels', label: 'LA County LMS Tunnels', description: 'LA County LMS Data - Tunnels for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_county_fueling_stations', label: 'LA County LMS County Fueling Stations', description: 'LA County LMS Data - County Fueling Stations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  { id: 'la_county_lms_county_electric_charging_stations', label: 'LA County LMS County Electric Charging Stations', description: 'LA County LMS Data - County Electric Charging Stations for proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca', subCategory: 'LMS Data' },
  // LA County Political Boundaries - Districts (2021)
  { id: 'la_county_political_boundaries_districts_2021', label: 'LA County Districts (2021)', description: 'LA County Political Boundaries - Districts (2021) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_supervisorial_current', label: 'LA County Supervisorial District (Current)', description: 'LA County Political Boundaries - Supervisorial District (Current) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_supervisorial_2021', label: 'LA County Supervisorial District (2021)', description: 'LA County Political Boundaries - Supervisorial District (2021) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_congressional_2021', label: 'LA County Congressional District (2021)', description: 'LA County Political Boundaries - Congressional District (2021) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_state_assembly_2021', label: 'LA County State Assembly District (2021)', description: 'LA County Political Boundaries - State Assembly District (2021) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_state_senate_2021', label: 'LA County State Senate District (2021)', description: 'LA County Political Boundaries - State Senate District (2021) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_board_equalization_2021', label: 'LA County Board of Equalization (2021)', description: 'LA County Political Boundaries - Board of Equalization (2021) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_city_council_2021', label: 'LA City Council Districts (2021)', description: 'LA County Political Boundaries - LA City Council Districts (2021) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  // LA County Political Boundaries - Districts (2011)
  { id: 'la_county_political_boundaries_districts_2011', label: 'LA County Districts (2011)', description: 'LA County Political Boundaries - Districts (2011) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_supervisorial_2011', label: 'LA County Supervisorial District (2011)', description: 'LA County Political Boundaries - Supervisorial District (2011) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_congressional_2011', label: 'LA County Congressional District (2011)', description: 'LA County Political Boundaries - Congressional District (2011) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_state_assembly_2011', label: 'LA County State Assembly District (2011)', description: 'LA County Political Boundaries - State Assembly District (2011) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_state_senate_2011', label: 'LA County State Senate District (2011)', description: 'LA County Political Boundaries - State Senate District (2011) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_board_equalization_2011', label: 'LA County Board of Equalization (2011)', description: 'LA County Political Boundaries - Board of Equalization (2011) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_city_council_2012', label: 'LA City Council Districts (2012)', description: 'LA County Political Boundaries - LA City Council Districts (2012) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  // LA County Political Boundaries - Districts (2001)
  { id: 'la_county_political_boundaries_districts_2001', label: 'LA County Districts (2001)', description: 'LA County Political Boundaries - Districts (2001) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_supervisorial_2001', label: 'LA County Supervisorial Districts (2001)', description: 'LA County Political Boundaries - Supervisorial Districts (2001) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_congressional_2001', label: 'LA County Congressional Districts (2001)', description: 'LA County Political Boundaries - Congressional Districts (2001) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_state_assembly_2001', label: 'LA County State Assembly Districts (2001)', description: 'LA County Political Boundaries - State Assembly Districts (2001) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_state_senate_2001', label: 'LA County State Senate Districts (2001)', description: 'LA County Political Boundaries - State Senate Districts (2001) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_city_council_2002', label: 'LA City Council Districts (2002)', description: 'LA County Political Boundaries - LA City Council Districts (2002) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  // LA County Political Boundaries - Districts (1971-1991)
  { id: 'la_county_political_boundaries_districts_1971_1991', label: 'LA County Districts (1971-1991)', description: 'LA County Political Boundaries - Districts (1971-1991) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_supervisorial_1991', label: 'LA County Supervisorial Districts (1991)', description: 'LA County Political Boundaries - Supervisorial Districts (1991) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_supervisorial_1981', label: 'LA County Supervisorial Districts (1981)', description: 'LA County Political Boundaries - Supervisorial Districts (1981) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_supervisorial_1971', label: 'LA County Supervisorial Districts (1971)', description: 'LA County Political Boundaries - Supervisorial Districts (1971) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  // LA County Political Boundaries - Other Political Boundaries
  { id: 'la_county_political_boundaries_other', label: 'LA County Other Political Boundaries', description: 'LA County Political Boundaries - Other Political Boundaries for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_school_districts', label: 'LA County School Districts', description: 'LA County Political Boundaries - School Districts for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_registrar_precincts', label: 'LA County Registrar Recorder Precincts', description: 'LA County Political Boundaries - Registrar Recorder Precincts for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_election_precincts', label: 'LA County Registrar Recorder Election Precincts', description: 'LA County Political Boundaries - Registrar Recorder Election Precincts for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  // LA County Political Boundaries - City and County Boundaries
  { id: 'la_county_political_boundaries_city_county', label: 'LA County City and County Boundaries', description: 'LA County Political Boundaries - City and County Boundaries for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_county_boundaries', label: 'LA County County Boundaries', description: 'LA County Political Boundaries - County Boundaries for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_city_boundaries', label: 'LA County City Boundaries', description: 'LA County Political Boundaries - City Boundaries for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_community_boundaries', label: 'LA County Community Boundaries (CSA)', description: 'LA County Political Boundaries - Community Boundaries (CSA) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  { id: 'la_county_political_boundaries_city_annexations', label: 'LA County City Annexations', description: 'LA County Political Boundaries - City Annexations for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca', subCategory: 'Political Boundaries' },
  // LA County Redistricting Data (2011) - All layers support point-in-polygon and proximity up to 5 miles
  { id: 'la_county_redistricting_geography', label: 'LA County Redistricting Geography', description: 'LA County Redistricting Data - Redistricting Geography for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_communities_2011', label: 'LA County Redistricting Communities (2011)', description: 'LA County Redistricting Data - Redistricting Communities (2011) for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_home_income_info', label: 'LA County Home and Income Information', description: 'LA County Redistricting Data - Home and Income Information for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_housing_data', label: 'LA County Housing Data', description: 'LA County Redistricting Data - Housing Data for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pct_owners', label: 'LA County % Owners', description: 'LA County Redistricting Data - % Owners for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pct_renters', label: 'LA County % Renters', description: 'LA County Redistricting Data - % Renters for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_homes_lt_200k', label: 'LA County % Homes < $200,000', description: 'LA County Redistricting Data - % Homes < $200,000 for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_homes_200k_399k', label: 'LA County % Homes $200,000 - $399,000', description: 'LA County Redistricting Data - % Homes $200,000 - $399,000 for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_homes_400k_749k', label: 'LA County % Homes $400,000 - $749,000', description: 'LA County Redistricting Data - % Homes $400,000 - $749,000 for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_homes_750k_plus', label: 'LA County % Homes $750,000+', description: 'LA County Redistricting Data - % Homes $750,000+ for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_home_value_preponderance', label: 'LA County Home Value Preponderance', description: 'LA County Redistricting Data - Home Value Preponderance for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_income_data', label: 'LA County Income Data', description: 'LA County Redistricting Data - Income Data for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_income_lt_25k', label: 'LA County % Households w/ Income < $25,000', description: 'LA County Redistricting Data - % Households w/ Income < $25,000 for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_income_25k_49k', label: 'LA County % Households w/ Income $25,000 - $49,999', description: 'LA County Redistricting Data - % Households w/ Income $25,000 - $49,999 for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_income_50k_99k', label: 'LA County % Households w/ Income $50,000 - $99,999', description: 'LA County Redistricting Data - % Households w/ Income $50,000 - $99,999 for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_income_100k_plus', label: 'LA County % Households w/ Income $100,000+', description: 'LA County Redistricting Data - % Households w/ Income $100,000+ for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_income_preponderance', label: 'LA County Household Income Preponderance', description: 'LA County Redistricting Data - Household Income Preponderance for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_other', label: 'LA County Other', description: 'LA County Redistricting Data - Other for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_population_density', label: 'LA County Population Density (Residential)', description: 'LA County Redistricting Data - Population Density (Residential) for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pct_over_18', label: 'LA County % Population Over 18', description: 'LA County Redistricting Data - % Population Over 18 for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pct_no_hs_diploma', label: 'LA County % No High School Diploma', description: 'LA County Redistricting Data - % No High School Diploma for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pct_below_poverty', label: 'LA County % Below Poverty Level', description: 'LA County Redistricting Data - % Below Poverty Level for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_voter_registration', label: 'LA County Voter Registration Data', description: 'LA County Redistricting Data - Voter Registration Data for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_registration_by_age', label: 'LA County Registration by Age', description: 'LA County Redistricting Data - Registration by Age for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_voter_age_18_34', label: 'LA County % Voter Age 18 to 34', description: 'LA County Redistricting Data - % Voter Age 18 to 34 for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_voter_age_35_49', label: 'LA County % Voter Age 35 - 49', description: 'LA County Redistricting Data - % Voter Age 35 - 49 for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_voter_age_50_64', label: 'LA County % Voter Age 50 - 64', description: 'LA County Redistricting Data - % Voter Age 50 - 64 for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_voter_age_65_plus', label: 'LA County % Voter Age 65+', description: 'LA County Redistricting Data - % Voter Age 65+ for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_registration_by_surname', label: 'LA County Registration by Surname', description: 'LA County Redistricting Data - Registration by Surname for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_surname_not_classified', label: 'LA County % Surname Not Classified', description: 'LA County Redistricting Data - % Surname Not Classified for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_surname_spanish', label: 'LA County % Spanish Surname', description: 'LA County Redistricting Data - % Spanish Surname for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_surname_asian', label: 'LA County % Asian Surname', description: 'LA County Redistricting Data - % Asian Surname for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_registration_by_party', label: 'LA County Registration by Party', description: 'LA County Redistricting Data - Registration by Party for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_party_decline_to_state', label: 'LA County % Decline to State', description: 'LA County Redistricting Data - % Decline to State for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_party_republican', label: 'LA County % Republican', description: 'LA County Redistricting Data - % Republican for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_party_democratic', label: 'LA County % Democratic Registration', description: 'LA County Redistricting Data - % Democratic Registration for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_registration_by_sex', label: 'LA County Registration by Sex', description: 'LA County Redistricting Data - Registration by Sex for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_sex_male', label: 'LA County % Male', description: 'LA County Redistricting Data - % Male for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_sex_female', label: 'LA County % Female', description: 'LA County Redistricting Data - % Female for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_citizen_voting_age_pop', label: 'LA County Citizen Voting Age Population', description: 'LA County Redistricting Data - Citizen Voting Age Population for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_cvap_hispanic', label: 'LA County % Hispanic Citizen Voting Age', description: 'LA County Redistricting Data - % Hispanic Citizen Voting Age for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_cvap_white', label: 'LA County % White Citizen Voting Age', description: 'LA County Redistricting Data - % White Citizen Voting Age for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_cvap_african_american', label: 'LA County % African American Citizen Voting Age', description: 'LA County Redistricting Data - % African American Citizen Voting Age for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_cvap_asian', label: 'LA County % Asian Citizen Voting Age', description: 'LA County Redistricting Data - % Asian Citizen Voting Age for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_demographic_data', label: 'LA County Demographic Data', description: 'LA County Redistricting Data - Demographic Data for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_2010_by_race', label: 'LA County 2010 Population by Race', description: 'LA County Redistricting Data - 2010 Population by Race for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_2010_hispanic', label: 'LA County % 2010 Population that is Hispanic', description: 'LA County Redistricting Data - % 2010 Population that is Hispanic for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_2010_nh_white', label: 'LA County % 2010 Population that is NH-White', description: 'LA County Redistricting Data - % 2010 Population that is NH-White for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_2010_nh_african_american', label: 'LA County % 2010 Population that is NH-African American', description: 'LA County Redistricting Data - % 2010 Population that is NH-African American for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_2010_nh_asian', label: 'LA County % 2010 Population that is NH-Asian', description: 'LA County Redistricting Data - % 2010 Population that is NH-Asian for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_2010_over_18_by_race', label: 'LA County 2010 Population over 18 by Race', description: 'LA County Redistricting Data - 2010 Population over 18 by Race for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_over_18_hispanic', label: 'LA County % 2010 Pop over 18 - Hispanic', description: 'LA County Redistricting Data - % 2010 Pop over 18 - Hispanic for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_over_18_nh_white', label: 'LA County % 2010 Pop over 18 - NH-White', description: 'LA County Redistricting Data - % 2010 Pop over 18 - NH-White for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_over_18_nh_african_american', label: 'LA County % 2010 Pop over 18 - NH-African American', description: 'LA County Redistricting Data - % 2010 Pop over 18 - NH-African American for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_over_18_nh_asian', label: 'LA County % 2010 Pop over 18 - NH-Asian', description: 'LA County Redistricting Data - % 2010 Pop over 18 - NH-Asian for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_2010_by_race_inclusive', label: 'LA County 2010 Population by Race (Inclusive)', description: 'LA County Redistricting Data - 2010 Population by Race (Inclusive) for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_incl_hispanic', label: 'LA County % 2010 Pop (Incl) - Hispanic', description: 'LA County Redistricting Data - % 2010 Pop (Incl) - Hispanic for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_incl_nh_white', label: 'LA County % 2010 Pop (Incl) - NH-White', description: 'LA County Redistricting Data - % 2010 Pop (Incl) - NH-White for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_incl_nh_african_american', label: 'LA County % 2010 Pop (Incl) - NH-African American', description: 'LA County Redistricting Data - % 2010 Pop (Incl) - NH-African American for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pop_incl_nh_asian', label: 'LA County % 2010 Pop (Incl) - NH-Asian', description: 'LA County Redistricting Data - % 2010 Pop (Incl) - NH-Asian for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_cvap_2010', label: 'LA County 2010 Citizen Voting Age Population (CVAP)', description: 'LA County Redistricting Data - 2010 Citizen Voting Age Population (CVAP) for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_cvap_2010_hispanic', label: 'LA County % 2010 CVAP Population - Hispanic', description: 'LA County Redistricting Data - % 2010 CVAP Population - Hispanic for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_cvap_2010_nh_white', label: 'LA County % 2010 CVAP Population - NH-White', description: 'LA County Redistricting Data - % 2010 CVAP Population - NH-White for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_cvap_2010_nh_african_american', label: 'LA County % 2010 CVAP Population - NH-African American', description: 'LA County Redistricting Data - % 2010 CVAP Population - NH-African American for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_cvap_2010_nh_asian', label: 'LA County % 2010 CVAP Population - NH-Asian', description: 'LA County Redistricting Data - % 2010 CVAP Population - NH-Asian for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_language', label: 'LA County Language', description: 'LA County Redistricting Data - Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_pct_not_fluent_english', label: 'LA County % Not Fluent in English', description: 'LA County Redistricting Data - % Not Fluent in English for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_lang_arabic', label: 'LA County % Arabic Primary Language', description: 'LA County Redistricting Data - % Arabic Primary Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_lang_armenian', label: 'LA County % Armenian Primary Language', description: 'LA County Redistricting Data - % Armenian Primary Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_lang_chinese', label: 'LA County % Chinese Primary Language', description: 'LA County Redistricting Data - % Chinese Primary Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_lang_cambodian', label: 'LA County % Cambodian Primary Language', description: 'LA County Redistricting Data - % Cambodian Primary Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_lang_english', label: 'LA County % English Primary Language', description: 'LA County Redistricting Data - % English Primary Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_lang_farsi', label: 'LA County % Farsi Primary Language', description: 'LA County Redistricting Data - % Farsi Primary Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_lang_korean', label: 'LA County % Korean Primary Language', description: 'LA County Redistricting Data - % Korean Primary Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_lang_russian', label: 'LA County % Russian Primary Language', description: 'LA County Redistricting Data - % Russian Primary Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_lang_spanish', label: 'LA County % Spanish Primary Language', description: 'LA County Redistricting Data - % Spanish Primary Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_lang_tagalog', label: 'LA County % Tagalog Primary Language', description: 'LA County Redistricting Data - % Tagalog Primary Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_lang_vietnamese', label: 'LA County % Vietnamese Primary Language', description: 'LA County Redistricting Data - % Vietnamese Primary Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  { id: 'la_county_redistricting_lang_other', label: 'LA County % Some Other Language Primary Language', description: 'LA County Redistricting Data - % Some Other Language Primary Language for point-in-polygon and proximity queries (up to 5 miles)', isPOI: true, defaultRadius: 0.25, maxRadius: 5, category: 'ca', section: 'ca', subCategory: 'Redistricting Data' },
  // CGS Geological Hazard Zones grouped together
  { id: 'ca_cgs_landslide_zones', label: 'CA CGS Landslide Zones', description: 'CA Open Data Portal - California Geological Survey (CGS) Landslide Zones for point-in-polygon and proximity queries (up to 10 miles)', isPOI: true, defaultRadius: 5, maxRadius: 10, category: 'ca', section: 'ca' },
  { id: 'ca_cgs_liquefaction_zones', label: 'CA CGS Liquefaction Zones', description: 'CA Open Data Portal - California Geological Survey (CGS) Liquefaction Zones for point-in-polygon and proximity queries (up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_land_ownership', label: 'CA Land Ownership', description: 'CA Open Data Portal - California Land Ownership (CAL FIRE FRAP) for point-in-polygon queries', isPOI: false, defaultRadius: 0, category: 'ca', section: 'ca' },
  { id: 'ca_state_parks_entry_points', label: 'CA State Parks Entry Points', description: 'CA Open Data Portal - California State Parks Entry Points for proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_state_parks_parking_lots', label: 'CA State Parks Parking Lots', description: 'CA Open Data Portal - California State Parks Parking Lots for proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_state_parks_boundaries', label: 'CA State Parks Boundaries', description: 'CA Open Data Portal - California State Parks Boundaries for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_state_parks_campgrounds', label: 'CA State Parks Campgrounds', description: 'CA Open Data Portal - California State Parks Campgrounds for proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_state_parks_recreational_routes', label: 'CA State Parks Recreational Routes', description: 'CA Open Data Portal - California State Parks Recreational Routes (linear features) for proximity queries up to 25 miles', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_condor_range', label: 'CA Condor Range', description: 'CA Open Data Portal - California Condor Range (CDFW BIOS) for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_black_bear_range', label: 'CA Black Bear Range', description: 'CA Open Data Portal - California Black Bear Range (CDFW BIOS) for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_brush_rabbit_range', label: 'CA Brush Rabbit Range', description: 'CA Open Data Portal - California Brush Rabbit Range (CDFW BIOS) for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_great_gray_owl_range', label: 'CA Great Gray Owl Range', description: 'CA Open Data Portal - California Great Gray Owl Range (CDFW BIOS) for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_sandhill_crane_range', label: 'CA Sandhill Crane Range', description: 'CA Open Data Portal - California Sandhill Crane Range (CDFW BIOS) for point-in-polygon and proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ca', section: 'ca' },
  { id: 'ca_highway_rest_areas', label: 'CA Highway Rest Areas', description: 'CA Open Data Portal - California Highway Rest Areas (Caltrans GIS) for proximity queries', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'ca', section: 'ca' },
  { id: 'ca_marine_oil_terminals', label: 'CA Marine Oil Terminals', description: 'CA State - California Marine Oil Terminals for proximity queries up to 50 miles', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'ca', section: 'ca' },
  
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
  { id: 'nj_public_places_to_keep_cool', label: 'NJ Public Places to Keep Cool', description: 'NJDEP - New Jersey Department of Environmental Protection Public Places to Keep Cool (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'nj', section: 'nj' },
  // TIGER Transportation Layers
  { id: 'tiger_primary_roads_interstates_5m', label: 'TIGER Primary Roads Interstates 5M', description: 'US Census TIGER - Primary Roads Interstates 5M scale (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_primary_roads_2_1m', label: 'TIGER Primary Roads 2_1M', description: 'US Census TIGER - Primary Roads 2_1M scale (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_primary_roads', label: 'TIGER Primary Roads', description: 'US Census TIGER - Primary Roads (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_secondary_roads_interstates_us', label: 'TIGER Secondary Roads Interstates and US Highways', description: 'US Census TIGER - Secondary Roads Interstates and US Highways (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_secondary_roads_578k', label: 'TIGER Secondary Roads 578k', description: 'US Census TIGER - Secondary Roads 578k scale (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_secondary_roads_289_144k', label: 'TIGER Secondary Roads 289_144k', description: 'US Census TIGER - Secondary Roads 289_144k scale (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_secondary_roads_72_1k', label: 'TIGER Secondary Roads 72_1k', description: 'US Census TIGER - Secondary Roads 72_1k scale (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_local_roads_72k', label: 'TIGER Local Roads 72k', description: 'US Census TIGER - Local Roads 72k scale (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_local_roads', label: 'TIGER Local Roads', description: 'US Census TIGER - Local Roads (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_railroads', label: 'TIGER Railroads', description: 'US Census TIGER - Railroads (proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  // TIGER School Districts Layers
  { id: 'tiger_unified_school_districts', label: 'TIGER Unified School Districts', description: 'US Census TIGER - Unified School Districts (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_secondary_school_districts', label: 'TIGER Secondary School Districts', description: 'US Census TIGER - Secondary School Districts (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_elementary_school_districts', label: 'TIGER Elementary School Districts', description: 'US Census TIGER - Elementary School Districts (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_school_district_admin_areas', label: 'TIGER School District Administrative Areas', description: 'US Census TIGER - School District Administrative Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_unified_school_districts', label: 'TIGER BAS 2025 Unified School Districts', description: 'US Census TIGER - BAS 2025 Unified School Districts (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_secondary_school_districts', label: 'TIGER BAS 2025 Secondary School Districts', description: 'US Census TIGER - BAS 2025 Secondary School Districts (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_elementary_school_districts', label: 'TIGER BAS 2025 Elementary School Districts', description: 'US Census TIGER - BAS 2025 Elementary School Districts (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_school_district_admin_areas', label: 'TIGER BAS 2025 School District Administrative Areas', description: 'US Census TIGER - BAS 2025 School District Administrative Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_unified_school_districts', label: 'TIGER ACS 2024 Unified School Districts', description: 'US Census TIGER - ACS 2024 Unified School Districts (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_secondary_school_districts', label: 'TIGER ACS 2024 Secondary School Districts', description: 'US Census TIGER - ACS 2024 Secondary School Districts (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_elementary_school_districts', label: 'TIGER ACS 2024 Elementary School Districts', description: 'US Census TIGER - ACS 2024 Elementary School Districts (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_school_district_admin_areas', label: 'TIGER ACS 2024 School District Administrative Areas', description: 'US Census TIGER - ACS 2024 School District Administrative Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_unified_school_districts', label: 'TIGER Census 2020 Unified School Districts', description: 'US Census TIGER - Census 2020 Unified School Districts (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_secondary_school_districts', label: 'TIGER Census 2020 Secondary School Districts', description: 'US Census TIGER - Census 2020 Secondary School Districts (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_elementary_school_districts', label: 'TIGER Census 2020 Elementary School Districts', description: 'US Census TIGER - Census 2020 Elementary School Districts (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  // TIGER Special Land Use Areas Layers
  { id: 'tiger_nps_areas', label: 'TIGER National Park Service Areas', description: 'US Census TIGER - National Park Service Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_correctional_facilities', label: 'TIGER Correctional Facilities', description: 'US Census TIGER - Correctional Facilities (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_colleges_universities', label: 'TIGER Colleges and Universities', description: 'US Census TIGER - Colleges and Universities (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_military_installations', label: 'TIGER Military Installations', description: 'US Census TIGER - Military Installations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  // TIGER Native Lands Layers - Base (Layers 0-10)
  { id: 'tiger_anrc', label: 'TIGER Alaska Native Regional Corporations', description: 'US Census TIGER - Alaska Native Regional Corporations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_tribal_subdivisions', label: 'TIGER Tribal Subdivisions', description: 'US Census TIGER - Tribal Subdivisions (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_federal_air', label: 'TIGER Federal American Indian Reservations', description: 'US Census TIGER - Federal American Indian Reservations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_off_reservation_trust', label: 'TIGER Off-Reservation Trust Lands', description: 'US Census TIGER - Off-Reservation Trust Lands (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_state_air', label: 'TIGER State American Indian Reservations', description: 'US Census TIGER - State American Indian Reservations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_hhl', label: 'TIGER Hawaiian Home Lands', description: 'US Census TIGER - Hawaiian Home Lands (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_anvsa', label: 'TIGER Alaska Native Village Statistical Areas', description: 'US Census TIGER - Alaska Native Village Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_otsa', label: 'TIGER Oklahoma Tribal Statistical Areas', description: 'US Census TIGER - Oklahoma Tribal Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_sdtsa', label: 'TIGER State Designated Tribal Statistical Areas', description: 'US Census TIGER - State Designated Tribal Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_tdsa', label: 'TIGER Tribal Designated Statistical Areas', description: 'US Census TIGER - Tribal Designated Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_aijua', label: 'TIGER American Indian Joint-Use Areas', description: 'US Census TIGER - American Indian Joint-Use Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  // TIGER Native Lands Layers - BAS 2025 (Layers 12-22)
  { id: 'tiger_bas2025_anrc', label: 'TIGER BAS 2025 Alaska Native Regional Corporations', description: 'US Census TIGER - BAS 2025 Alaska Native Regional Corporations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_tribal_subdivisions', label: 'TIGER BAS 2025 Tribal Subdivisions', description: 'US Census TIGER - BAS 2025 Tribal Subdivisions (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_federal_air', label: 'TIGER BAS 2025 Federal American Indian Reservations', description: 'US Census TIGER - BAS 2025 Federal American Indian Reservations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_off_reservation_trust', label: 'TIGER BAS 2025 Off-Reservation Trust Lands', description: 'US Census TIGER - BAS 2025 Off-Reservation Trust Lands (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_state_air', label: 'TIGER BAS 2025 State American Indian Reservations', description: 'US Census TIGER - BAS 2025 State American Indian Reservations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_hhl', label: 'TIGER BAS 2025 Hawaiian Home Lands', description: 'US Census TIGER - BAS 2025 Hawaiian Home Lands (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_anvsa', label: 'TIGER BAS 2025 Alaska Native Village Statistical Areas', description: 'US Census TIGER - BAS 2025 Alaska Native Village Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_otsa', label: 'TIGER BAS 2025 Oklahoma Tribal Statistical Areas', description: 'US Census TIGER - BAS 2025 Oklahoma Tribal Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_sdtsa', label: 'TIGER BAS 2025 State Designated Tribal Statistical Areas', description: 'US Census TIGER - BAS 2025 State Designated Tribal Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_tdsa', label: 'TIGER BAS 2025 Tribal Designated Statistical Areas', description: 'US Census TIGER - BAS 2025 Tribal Designated Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_aijua', label: 'TIGER BAS 2025 American Indian Joint-Use Areas', description: 'US Census TIGER - BAS 2025 American Indian Joint-Use Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  // TIGER Native Lands Layers - ACS 2024 (Layers 24-34)
  { id: 'tiger_acs2024_anrc', label: 'TIGER ACS 2024 Alaska Native Regional Corporations', description: 'US Census TIGER - ACS 2024 Alaska Native Regional Corporations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_tribal_subdivisions', label: 'TIGER ACS 2024 Tribal Subdivisions', description: 'US Census TIGER - ACS 2024 Tribal Subdivisions (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_federal_air', label: 'TIGER ACS 2024 Federal American Indian Reservations', description: 'US Census TIGER - ACS 2024 Federal American Indian Reservations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_off_reservation_trust', label: 'TIGER ACS 2024 Off-Reservation Trust Lands', description: 'US Census TIGER - ACS 2024 Off-Reservation Trust Lands (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_state_air', label: 'TIGER ACS 2024 State American Indian Reservations', description: 'US Census TIGER - ACS 2024 State American Indian Reservations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_hhl', label: 'TIGER ACS 2024 Hawaiian Home Lands', description: 'US Census TIGER - ACS 2024 Hawaiian Home Lands (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_anvsa', label: 'TIGER ACS 2024 Alaska Native Village Statistical Areas', description: 'US Census TIGER - ACS 2024 Alaska Native Village Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_otsa', label: 'TIGER ACS 2024 Oklahoma Tribal Statistical Areas', description: 'US Census TIGER - ACS 2024 Oklahoma Tribal Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_sdtsa', label: 'TIGER ACS 2024 State Designated Tribal Statistical Areas', description: 'US Census TIGER - ACS 2024 State Designated Tribal Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_tdsa', label: 'TIGER ACS 2024 Tribal Designated Statistical Areas', description: 'US Census TIGER - ACS 2024 Tribal Designated Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_aijua', label: 'TIGER ACS 2024 American Indian Joint-Use Areas', description: 'US Census TIGER - ACS 2024 American Indian Joint-Use Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  // TIGER Native Lands Layers - Census 2020 (Layers 36-46)
  { id: 'tiger_census2020_anrc', label: 'TIGER Census 2020 Alaska Native Regional Corporations', description: 'US Census TIGER - Census 2020 Alaska Native Regional Corporations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_tribal_subdivisions', label: 'TIGER Census 2020 Tribal Subdivisions', description: 'US Census TIGER - Census 2020 Tribal Subdivisions (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_federal_air', label: 'TIGER Census 2020 Federal American Indian Reservations', description: 'US Census TIGER - Census 2020 Federal American Indian Reservations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_off_reservation_trust', label: 'TIGER Census 2020 Off-Reservation Trust Lands', description: 'US Census TIGER - Census 2020 Off-Reservation Trust Lands (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_state_air', label: 'TIGER Census 2020 State American Indian Reservations', description: 'US Census TIGER - Census 2020 State American Indian Reservations (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_hhl', label: 'TIGER Census 2020 Hawaiian Home Lands', description: 'US Census TIGER - Census 2020 Hawaiian Home Lands (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_anvsa', label: 'TIGER Census 2020 Alaska Native Village Statistical Areas', description: 'US Census TIGER - Census 2020 Alaska Native Village Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_otsa', label: 'TIGER Census 2020 Oklahoma Tribal Statistical Areas', description: 'US Census TIGER - Census 2020 Oklahoma Tribal Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_sdtsa', label: 'TIGER Census 2020 State Designated Tribal Statistical Areas', description: 'US Census TIGER - Census 2020 State Designated Tribal Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_tdsa', label: 'TIGER Census 2020 Tribal Designated Statistical Areas', description: 'US Census TIGER - Census 2020 Tribal Designated Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_aijua', label: 'TIGER Census 2020 American Indian Joint-Use Areas', description: 'US Census TIGER - Census 2020 American Indian Joint-Use Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  
  // TIGER CBSA Layers - Base (Layers 0-4)
  { id: 'tiger_cbsa_combined_statistical_areas', label: 'TIGER Combined Statistical Areas', description: 'US Census TIGER - Combined Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_cbsa_metro_micropolitan_statistical_areas', label: 'TIGER Metropolitan and Micropolitan Statistical Areas', description: 'US Census TIGER - Metropolitan and Micropolitan Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_cbsa_metropolitan_divisions', label: 'TIGER Metropolitan Divisions', description: 'US Census TIGER - Metropolitan Divisions (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_cbsa_metropolitan_statistical_areas', label: 'TIGER Metropolitan Statistical Areas', description: 'US Census TIGER - Metropolitan Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_cbsa_micropolitan_statistical_areas', label: 'TIGER Micropolitan Statistical Areas', description: 'US Census TIGER - Micropolitan Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  // TIGER CBSA Layers - BAS 2025 (Layers 6-10)
  { id: 'tiger_bas2025_cbsa_combined_statistical_areas', label: 'TIGER BAS 2025 Combined Statistical Areas', description: 'US Census TIGER - BAS 2025 Combined Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_cbsa_metro_micropolitan_statistical_areas', label: 'TIGER BAS 2025 Metropolitan and Micropolitan Statistical Areas', description: 'US Census TIGER - BAS 2025 Metropolitan and Micropolitan Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_cbsa_metropolitan_divisions', label: 'TIGER BAS 2025 Metropolitan Divisions', description: 'US Census TIGER - BAS 2025 Metropolitan Divisions (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_cbsa_metropolitan_statistical_areas', label: 'TIGER BAS 2025 Metropolitan Statistical Areas', description: 'US Census TIGER - BAS 2025 Metropolitan Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_bas2025_cbsa_micropolitan_statistical_areas', label: 'TIGER BAS 2025 Micropolitan Statistical Areas', description: 'US Census TIGER - BAS 2025 Micropolitan Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  // TIGER CBSA Layers - ACS 2024 (Layers 12-16)
  { id: 'tiger_acs2024_cbsa_combined_statistical_areas', label: 'TIGER ACS 2024 Combined Statistical Areas', description: 'US Census TIGER - ACS 2024 Combined Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_cbsa_metro_micropolitan_statistical_areas', label: 'TIGER ACS 2024 Metropolitan and Micropolitan Statistical Areas', description: 'US Census TIGER - ACS 2024 Metropolitan and Micropolitan Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_cbsa_metropolitan_divisions', label: 'TIGER ACS 2024 Metropolitan Divisions', description: 'US Census TIGER - ACS 2024 Metropolitan Divisions (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_cbsa_metropolitan_statistical_areas', label: 'TIGER ACS 2024 Metropolitan Statistical Areas', description: 'US Census TIGER - ACS 2024 Metropolitan Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_acs2024_cbsa_micropolitan_statistical_areas', label: 'TIGER ACS 2024 Micropolitan Statistical Areas', description: 'US Census TIGER - ACS 2024 Micropolitan Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  // TIGER CBSA Layers - Census 2020 (Layers 18-27)
  { id: 'tiger_census2020_cbsa_combined_new_england_city_town_areas', label: 'TIGER Census 2020 Combined New England City and Town Areas', description: 'US Census TIGER - Census 2020 Combined New England City and Town Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_cbsa_new_england_city_town_areas', label: 'TIGER Census 2020 New England City and Town Areas', description: 'US Census TIGER - Census 2020 New England City and Town Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_cbsa_new_england_city_town_area_divisions', label: 'TIGER Census 2020 New England City and Town Area Divisions', description: 'US Census TIGER - Census 2020 New England City and Town Area Divisions (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_cbsa_metropolitan_new_england_city_town_areas', label: 'TIGER Census 2020 Metropolitan New England City and Town Areas', description: 'US Census TIGER - Census 2020 Metropolitan New England City and Town Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_cbsa_micropolitan_new_england_city_town_areas', label: 'TIGER Census 2020 Micropolitan New England City and Town Areas', description: 'US Census TIGER - Census 2020 Micropolitan New England City and Town Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_cbsa_combined_statistical_areas', label: 'TIGER Census 2020 Combined Statistical Areas', description: 'US Census TIGER - Census 2020 Combined Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_cbsa_metro_micropolitan_statistical_areas', label: 'TIGER Census 2020 Metropolitan and Micropolitan Statistical Areas', description: 'US Census TIGER - Census 2020 Metropolitan and Micropolitan Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_cbsa_metropolitan_divisions', label: 'TIGER Census 2020 Metropolitan Divisions', description: 'US Census TIGER - Census 2020 Metropolitan Divisions (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_cbsa_metropolitan_statistical_areas', label: 'TIGER Census 2020 Metropolitan Statistical Areas', description: 'US Census TIGER - Census 2020 Metropolitan Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_census2020_cbsa_micropolitan_statistical_areas', label: 'TIGER Census 2020 Micropolitan Statistical Areas', description: 'US Census TIGER - Census 2020 Micropolitan Statistical Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  // TIGER Urban Areas Layers
  { id: 'tiger_urban_2020_urban_areas', label: 'TIGER 2020 Urban Areas', description: 'US Census TIGER - 2020 Urban Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_urban_bas2025_2020_urban_areas', label: 'TIGER BAS 2025 2020 Urban Areas', description: 'US Census TIGER - BAS 2025 2020 Urban Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_urban_acs2024_2020_urban_areas', label: 'TIGER ACS 2024 2020 Urban Areas', description: 'US Census TIGER - ACS 2024 2020 Urban Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_urban_census2020_2020_urban_areas_corrected', label: 'TIGER Census 2020 2020 Urban Areas - Corrected', description: 'US Census TIGER - Census 2020 2020 Urban Areas - Corrected (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_urban_census2020_2020_urban_areas', label: 'TIGER Census 2020 2020 Urban Areas', description: 'US Census TIGER - Census 2020 2020 Urban Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  { id: 'tiger_urban_urban_areas', label: 'TIGER Urban Areas', description: 'US Census TIGER - Urban Areas (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'tiger', section: 'tiger' },
  
  // Ireland Data
  { id: 'ireland_provinces', label: 'Ireland Provinces', description: 'Ireland Provinces - OSi National Statutory Boundaries (point-in-polygon and proximity queries up to 25 miles)', isPOI: true, defaultRadius: 5, maxRadius: 25, category: 'ireland', section: 'eu' },
  { id: 'ireland_built_up_areas', label: 'Ireland Built-Up Areas', description: 'Ireland Built-Up Areas - OSi National 1m Map of Ireland (point-in-polygon and proximity queries up to 50 miles)', isPOI: true, defaultRadius: 5, maxRadius: 50, category: 'ireland', section: 'eu' }
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
