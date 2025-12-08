import React from 'react';
import { ArrowLeft, Globe, Database, CheckCircle, ExternalLink } from 'lucide-react';

interface DataSourcesViewProps {
  onBackToMain: () => void;
}

const DataSourcesView: React.FC<DataSourcesViewProps> = ({ onBackToMain }) => {
  const dataSources = [
    {
      category: "Geocoding Services",
      sources: [
        {
          name: "Nominatim (OpenStreetMap)",
          description: "Open-source geocoding service providing worldwide address and location data",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "US Census Bureau Geocoding",
          description: "Official US address validation and geocoding with high precision",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "GeoNames",
          description: "Geographic database covering all countries with administrative divisions",
          coverage: "Global",
          accuracy: "High",
          cost: "Free (with limits)"
        },
        {
          name: "NYC PLUTO",
          description: "NYC parcel-level precision geocoding for New York City addresses",
          coverage: "New York City",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "Postcodes.io",
          description: "UK postcode lookup service with detailed geographic information",
          coverage: "United Kingdom",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Environmental Data",
      sources: [
        {
          name: "Open-Meteo Elevation API",
          description: "Global elevation data with high precision, converted to feet for US users",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "Open-Meteo Weather API",
          description: "Current weather conditions, forecasts, and historical weather data",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "Air Quality Index (AQI)",
          description: "Real-time air quality measurements and pollution levels",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "National Weather Service Alerts",
          description: "Active weather alerts, warnings, and advisories",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "EPA Walkability Index",
          description: "Neighborhood walkability scores based on street connectivity, population density, and land use mix",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Demographic & Census Data",
      sources: [
        {
          name: "US Census Bureau",
          description: "Population, income, age demographics, and FIPS codes",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "American Community Survey",
          description: "Detailed demographic and economic characteristics",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Points of Interest (POI)",
      sources: [
        {
          name: "OpenStreetMap Overpass API",
          description: "Community-contributed points of interest including businesses, amenities, and landmarks",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free"
        },
        {
          name: "USDA Local Food Portal",
          description: "Farmers markets, CSA programs, agritourism, food hubs, and on-farm markets",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "OpenChargeMap API",
          description: "Electric vehicle charging stations and infrastructure",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "USGS Trail and National Map",
          description: "Hiking trailheads, trails, and outdoor recreation data",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "Wikipedia API",
          description: "Haunted sites, historic oddities, museums, and quirky landmarks",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free"
        }
      ]
    },
    {
      category: "Natural Hazards",
      sources: [
        {
          name: "WFIGS Current Wildfires",
          description: "Wildland Fire Interagency Geospatial Services - current wildfire incidents, perimeters, and containment status",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "USDA Wildfire Hazard Potential",
          description: "USDA Forest Service - Composite wildfire risk index (1-5: Very Low to Very High) with automatic proximity search",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "USDA Burn Probability",
          description: "USDA Forest Service - Annual probability of wildfire occurrence (0-1 scale) with automatic proximity search",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "USDA Conditional Flame Length",
          description: "USDA Forest Service - Expected flame length if fire occurs (feet) with automatic proximity search",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "USDA Risk to Potential Structures",
          description: "USDA Forest Service - Structure exposure risk assessment with automatic proximity search",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "USDA Housing Unit Risk",
          description: "USDA Forest Service - Housing unit count, density, exposure, impact, and risk assessments",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "USDA Population Count",
          description: "USDA Forest Service - Population count and density data for wildfire risk assessment",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "FEMA Flood Zones",
          description: "National Flood Hazard Layer with flood zone classifications",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "USGS Earthquakes",
          description: "Historical earthquake events and seismic activity",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "USGS Volcanoes",
          description: "Active and dormant volcano locations and status",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "USGS Wetlands",
          description: "National Wetlands Inventory - wetland types and locations",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "USGS Flood Reference Points",
          description: "Real-time flooding reference points and actively flooding locations",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Space Weather & Aurora",
      sources: [
        {
          name: "Auroras.live API",
          description: "Aurora hunting data including curated viewing locations and live solar wind metrics (Bz, speed, density, Kp forecasts)",
          coverage: "High-latitude regions worldwide",
          accuracy: "High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Human Caused Hazards",
      sources: [
        {
          name: "Animal-Vehicle Impact (AVI)",
          description: "The Location Is Everything Company data - Live API from LocationFriend with collision records for CA, TX, ID, IA, NH, and FARS",
          coverage: "United States (CA, TX, ID, IA, NH)",
          accuracy: "High",
          cost: "Paid"
        },
        {
          name: "EPA Superfund Sites",
          description: "Hazardous waste sites including National Priorities List locations",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA Brownfields",
          description: "Assessment, Cleanup and Redevelopment Exchange System sites",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA TRI Facilities",
          description: "Toxics Release Inventory facilities reporting chemical releases. Includes: All TRI Facilities, TRI Facilities (Tribal Land), Manufacturing Facilities, Metal Mining Facilities, Electric Utility Facilities, Wood Products Facilities, Automotive Manufacturing, PFAS Facilities, Lead Facilities, Dioxins Facilities, Ethylene Oxide Facilities, Carcinogens Facilities, Mercury Facilities, and Federal TRI Facilities",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA Air Facilities",
          description: "Air Facility System - stationary sources of air pollution",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA RCRA Facilities",
          description: "Resource Conservation and Recovery Act - hazardous waste generators, treaters, storers, transporters, and disposers",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA NPDES Permits",
          description: "National Pollutant Discharge Elimination System - permitted wastewater discharge facilities",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA Radiation Facilities",
          description: "RADINFO - facilities dealing with radioactivity or radiation",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA Power Generation",
          description: "EGRID/EIA-860 - power plant and generation facilities",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA Oil Spill Response",
          description: "SPCC/FRP - countermeasure and facility response plan subject facilities",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Infrastructure & Utilities",
      sources: [
        {
          name: "OpenEI Power Plants",
          description: "Electric power generation facilities and energy infrastructure",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "OpenStreetMap Infrastructure",
          description: "Electrical substations, powerlines, and cellular communication towers",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free"
        }
      ]
    },
    {
      category: "Community & Services",
      sources: [
        {
          name: "OpenStreetMap Community Services",
          description: "Colleges, universities, gas stations, mail & shipping locations, schools, hospitals, parks, and other community facilities via OSM Overpass API",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free"
        }
      ]
    },
    {
      category: "Recreation & Entertainment",
      sources: [
        {
          name: "OpenStreetMap Recreation",
          description: "Cinemas, theatres, museums, historic sites, hotels, golf courses, boat ramps, and nightlife venues",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free"
        }
      ]
    },
    {
      category: "Natural Resources & Geography",
      sources: [
        {
          name: "OpenStreetMap Natural Features",
          description: "Beaches, lakes, ponds, rivers, streams, mountains, and peaks",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free"
        },
        {
          name: "US Fish and Wildlife Service (FWS)",
          description: "Endangered/threatened species, critical habitat, wildlife refuges, wetlands, marine mammals, migratory birds, and fish hatcheries within proximity",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "eBird API (Cornell Lab of Ornithology)",
          description: "Birding hotspots, recent species observations, and community-sourced ornithological data",
          coverage: "Global (observer-dependent)",
          accuracy: "Community reported / curated",
          cost: "Free (API key)"
        },
        {
          name: "NOAA National Marine Sanctuaries",
          description: "National Marine Sanctuaries - point-in-polygon and proximity queries (up to 25 miles)",
          coverage: "United States (coastal waters)",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "ISRIC SoilGrids (via ESRI Living Atlas)",
          description: "World Soils 250m Organic Carbon Density - point-in-pixel queries for soil organic carbon density (kg/m²)",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Public Lands & Protected Areas",
      sources: [
        {
          name: "USGS PAD-US Database",
          description: "Protected Areas Database - public land boundaries, manager info, access status, and protection levels",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Specialized & Quirky Data",
      sources: [
        {
          name: "Craft Brewery Database",
          description: "Craft breweries with names, types, addresses, and contact information",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Trail & Recreation Data",
      sources: [
        {
          name: "Appalachian Trail (AT) Features",
          description: "AT facilities including bridges, campsites, parking, shelters, water sources, and trail features via ArcGIS services",
          coverage: "Appalachian Trail Corridor",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "Pacific Crest Trail (PCT) Features",
          description: "PCT centerline, sheriff offices, side trails, mile markers, and resupply towns via ArcGIS services",
          coverage: "Pacific Crest Trail Corridor",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "New Hampshire Data (NH GRANIT)",
      sources: [
        {
          name: "NH SSURGO Soils",
          description: "Soil Survey Geographic (SSURGO) database for New Hampshire - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Bedrock Geology - Formations",
          description: "New Hampshire bedrock geology formations - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Geographic Names Information System (Places of Interest)",
          description: "New Hampshire geographic names and places of interest - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH House of Representatives Districts",
          description: "New Hampshire House of Representatives district boundaries for 2022 - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Voting Wards",
          description: "New Hampshire political districts and voting wards - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Senate Districts",
          description: "New Hampshire Senate district boundaries for 2022 - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Parcels",
          description: "New Hampshire parcel mosaics with proximity queries (0.25, 0.50, 0.75, 1.0 miles) - identifies containing parcel and nearby parcels",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Key Destinations",
          description: "New Hampshire key destination points - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Nursing Homes",
          description: "New Hampshire nursing homes and long-term care facilities - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Emergency Medical Services",
          description: "New Hampshire EMS facilities and emergency medical services - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Fire Stations",
          description: "New Hampshire fire stations and fire department facilities - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Places of Worship",
          description: "New Hampshire places of worship including churches, synagogues, mosques, and other religious facilities - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Hospitals",
          description: "New Hampshire hospitals and medical facilities - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Access Sites to Public Waters",
          description: "New Hampshire public access sites to lakes, rivers, and other water bodies - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Law Enforcement",
          description: "New Hampshire police departments, sheriff offices, and law enforcement facilities - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Recreation Trails",
          description: "New Hampshire recreation trails and hiking paths - line dataset with proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH DOT Roads",
          description: "New Hampshire Department of Transportation road network - line dataset with proximity queries (0.5, 1, 2.5, 5, 10 miles)",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Railroads",
          description: "New Hampshire railroad network including active and abandoned lines - line dataset with proximity queries (0.5, 1, 2.5, 5, 10 miles)",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Transmission/Pipelines",
          description: "New Hampshire transmission lines and pipelines - line dataset with proximity queries (0.5, 1, 2.5, 5, 10 miles)",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Personal Wireless Service Facilities",
          description: "New Hampshire cell towers and wireless communication facilities - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Stone Walls",
          description: "New Hampshire stone walls - line dataset with proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "New Hampshire Data (NH DES)",
      sources: [
        {
          name: "NH Underground Storage Tank Sites",
          description: "New Hampshire underground storage tank sites from the Department of Environmental Services - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Water Well Inventory",
          description: "New Hampshire water well inventory from the Department of Environmental Services - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Public Water Supply Wells",
          description: "New Hampshire public water supply wells from the Department of Environmental Services - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Remediation Sites",
          description: "New Hampshire remediation sites from the Department of Environmental Services - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Automobile Salvage Yards",
          description: "New Hampshire automobile salvage yards from the Department of Environmental Services - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Solid Waste Facilities",
          description: "New Hampshire solid waste facilities from the Department of Environmental Services - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH Source Water Protection Areas",
          description: "New Hampshire source water protection areas from the Department of Environmental Services - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NH National Wetland Inventory (NWI) Plus",
          description: "New Hampshire National Wetland Inventory Plus from the Department of Environmental Services - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Massachusetts Data (MassGIS)",
      sources: [
        {
          name: "MA DEP Wetland Areas",
          description: "Massachusetts Department of Environmental Protection wetland areas - point-in-polygon and proximity queries",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "MA Protected and Recreational Open Space",
          description: "Massachusetts protected and recreational open space areas - point-in-polygon and proximity queries",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "MA Hiking and Wilderness Trails",
          description: "Massachusetts hiking and wilderness trails - line dataset with proximity queries up to 25 miles",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "MA NHESP Natural Communities",
          description: "Massachusetts Natural Heritage & Endangered Species Program (NHESP) natural communities - point-in-polygon and proximity queries (0.1, 0.25, 0.5, 0.75, 1.0 miles)",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "MA Lakes and Ponds",
          description: "Massachusetts lakes and ponds from MassGIS Hydro_Major FeatureServer - point-in-polygon and proximity queries (0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0 miles)",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "MA Rivers and Streams",
          description: "Massachusetts rivers and streams from MassGIS Hydro_Major FeatureServer - proximity queries (0.5, 1, 2.5, 5, 10 miles)",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "MA Regional Planning Agencies",
          description: "Massachusetts Regional Planning Agencies (RPAs) from MassGIS - point-in-polygon queries",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "MA Areas of Critical Environmental Concern (ACECs)",
          description: "MassGIS - Massachusetts Areas of Critical Environmental Concern (point-in-polygon and proximity queries up to 25 miles)",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "Massachusetts Property Tax Parcels",
          description: "MassGIS Level 3 Assessors' Parcel Mapping data - point-in-polygon and proximity queries (0.3, 0.5, 0.75, 1.0 miles)",
          coverage: "Massachusetts (350 of 351 cities and towns)",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "Cape Cod Zoning Map",
          description: "Cape Cod zoning districts and boundaries - point-in-polygon and proximity queries",
          coverage: "Cape Cod, Massachusetts",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Connecticut Data (CT Geodata Portal)",
      sources: [
        {
          name: "CT Parcels",
          description: "Connecticut State Parcel Layer 2023 - point-in-polygon and proximity queries (0.25, 0.5, 0.75, 1.0 miles)",
          coverage: "Connecticut (169 municipalities)",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT 2D Building Footprints",
          description: "Connecticut 2D building footprints - point-in-polygon and proximity queries (0.25, 0.5, 0.75, 1.0 miles)",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT Roads and Trails",
          description: "Connecticut roads and trails network - proximity queries up to 5 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT Urgent Care",
          description: "Connecticut urgent care facilities - proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT DEEP Properties",
          description: "Connecticut Department of Energy and Environmental Protection (DEEP) properties - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT Tribal Lands",
          description: "Connecticut Tribal Lands (State and Federally Recognized) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT Drinking Water Watersheds",
          description: "Connecticut Drinking Water Watersheds - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT 2025 Broadband Availability by Block",
          description: "Connecticut 2025 Broadband Availability by Census Block - point-in-polygon and proximity queries up to 5 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT Water Pollution Control Facilities",
          description: "Connecticut Water Pollution Control Facilities - proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT Boat Launches",
          description: "Connecticut DEEP Boat Launches - proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT Federal Open Space",
          description: "Connecticut Federal Open Space - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT HUC Watershed Boundaries",
          description: "Connecticut HUC (Hydrologic Unit Code) Watershed Boundaries - point-in-polygon queries",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT Soils Parent Material Name",
          description: "Connecticut Soils Parent Material Name (SSURGO) - point-in-polygon queries",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "California Data (CA Open Data Portal)",
      sources: [
        {
          name: "CA Power Outage Areas",
          description: "California Power Outage Areas - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Fire Perimeters (All)",
          description: "California Historic Fire Perimeters (all historical fires) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Recent Large Fire Perimeters",
          description: "California Recent Large Fire Perimeters (GT 5000 acres) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Fire Perimeters (1950+)",
          description: "California Fire Perimeters (1950+) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Land Ownership",
          description: "California Land Ownership (CAL FIRE FRAP) - point-in-polygon queries",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Wildland Fire Direct Protection Areas",
          description: "California Wildland Fire Direct Protection Areas (USFS) - point-in-polygon queries",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA CalVTP Treatment Areas",
          description: "California CalVTP Treatment Areas (CAL FIRE) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA State Parks Entry Points",
          description: "California State Parks Entry Points - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA State Parks Parking Lots",
          description: "California State Parks Parking Lots - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA State Parks Boundaries",
          description: "California State Parks Boundaries - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA State Parks Campgrounds",
          description: "California State Parks Campgrounds - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Condor Range",
          description: "California Condor Range (CDFW BIOS) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Black Bear Range",
          description: "California Black Bear Range (CDFW BIOS) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Brush Rabbit Range",
          description: "California Brush Rabbit Range (CDFW BIOS) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Great Gray Owl Range",
          description: "California Great Gray Owl Range (CDFW BIOS) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Sandhill Crane Range",
          description: "California Sandhill Crane Range (CDFW BIOS) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Highway Rest Areas",
          description: "California Highway Rest Areas (Caltrans GIS) - proximity queries up to 50 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA CGS Landslide Zones",
          description: "California Geological Survey (CGS) Landslide Zones - point-in-polygon and proximity queries up to 10 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA CGS Liquefaction Zones",
          description: "California Geological Survey (CGS) Liquefaction Zones - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA State Parks Recreational Routes",
          description: "California State Parks Recreational Routes - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Marine Oil Terminals",
          description: "California Marine Oil Terminals - proximity queries up to 50 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Post-Fire Damage Inspections (DINS)",
          description: "CAL FIRE Damage Inspection Program (DINS) database of structures damaged and destroyed by wildland fire since 2013 - proximity queries up to 50 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Medium and Heavy Duty Infrastructure",
          description: "Location of publicly accessible medium- and heavy-duty (MDHD) hydrogen refueling and charging stations - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Facilities for Wildland Fire Protection",
          description: "California State and Local Facilities for Wildland Fire Protection - proximity queries up to 50 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Solar Footprints",
          description: "Solar footprint feature class combining existing datasets with imagery interpretation to create footprints of medium to large scale solar facilities - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Natural Gas Service Areas",
          description: "California Natural Gas Service Areas - point-in-polygon queries",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Public Land Survey Sections",
          description: "California Public Land Survey Sections (PLSS) - point-in-polygon queries to identify Township and Range values",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Geothermal Wells",
          description: "California Geothermal Wells (WellSTAR) - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Oil and Gas Wells",
          description: "California Oil and Gas Wells (WellSTAR) - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CA Eco Regions",
          description: "USDA Ecoregion Sections for California - point-in-polygon queries",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "City of Los Angeles Zoning Polygons",
          description: "City of Los Angeles Zoning Polygons - point-in-polygon and proximity queries up to 1 mile",
          coverage: "Los Angeles, California",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Los Angeles County Data",
      sources: [
        {
          name: "LA County Street Inventory",
          description: "StreetsLA GeoHub Street Inventory - proximity queries up to 5 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Points of Interest",
          description: "Los Angeles County Points of Interest including Arts and Recreation, Education, Hospitals, Municipal Services, Physical Features, Public Safety, and Transportation - proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Historic Cultural Monuments",
          description: "Los Angeles County Historic Cultural Monuments - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Housing with Potential Lead Risk",
          description: "Los Angeles County Housing with Potential Lead Risk - point-in-polygon and proximity queries up to 5 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County School District Boundaries",
          description: "Los Angeles County School District Boundaries - point-in-polygon queries",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County MTA Metro Lines",
          description: "Los Angeles County Metropolitan Transportation Authority (MTA) Metro Lines - proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Hazards",
          description: "Los Angeles County Hazards including Fire Hazards, Fire Hazard Responsibility Areas, Fire Hazard Severity Zones, Earthquake Hazards, Alquist-Priolo Fault Traces and Zones, USGS Faults, Tsunami Inundation Zones, Landslide Zones, Liquefaction Zones, Flood Hazards, 100-Year and 500-Year Flood Plains, and Dam Inundation Areas - point-in-polygon and proximity queries",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Basemaps and Grids",
          description: "Los Angeles County Basemaps and Grids including US National Grid (USNG) at various scales and Township Range Section Rancho Boundaries - point-in-polygon queries",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Hydrology",
          description: "Los Angeles County Hydrology data including Lakes, Streams, Watershed Boundaries, and comprehensive Storm Drain Network components (Inlets/Outlets, Maintenance Holes, Basins, Catch Basins, Low Flow Diversions, Pump Stations, Channels, Drains, Laterals, Culverts, Permitted Connections, Force Mains, Natural Drainage) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Infrastructure",
          description: "Los Angeles County Infrastructure including County Facilities, County-owned Buildings, County-owned Parcels, Government-owned Parcels, and Schools - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Fire Hydrants",
          description: "Fire hydrants within the Los Angeles County Fire Department's jurisdiction and surrounding areas - proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/Fire/Fire_Hydrants/MapServer/0"
        },
        {
          name: "Chicago 311 Service Requests",
          description: "311 service requests from the City of Chicago Data Portal - proximity queries up to 25 miles, color-coded by request type",
          coverage: "City of Chicago, Illinois",
          accuracy: "Very High",
          cost: "Free",
          url: "https://data.cityofchicago.org/api/v3/views/v6vf-nfxy"
        },
        {
          name: "LA County Administrative Boundaries",
          description: "Los Angeles County Administrative Boundaries including ISD Facilities Operations Service Maintenance Districts, School District Boundaries, Park Planning Areas, DCFS Office Boundaries, Health Districts, Service Planning Areas, Disaster Management Areas, Zipcodes, Regional Centers, Public Safety, Reporting Districts, Station Boundaries, Fire Station Boundaries, PSAP Boundaries, Library, Planning Areas, Service Areas, State Enterprise Zones, and Animal Care and Control Service Areas - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Elevation",
          description: "Los Angeles County Elevation data including Contours at various scales (LARIAC Contours 1000FT, 250FT, 50FT, 10FT, 2FT, 1FT), Elevation Points, Elevation Data (Raster), LARIAC Hillshade, Digital Elevation Model (DEM), and Digital Surface Model (DSM) - proximity queries for queryable layers, raster visualization for raster layers",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Demographics",
          description: "Los Angeles County Demographics including Census data from 1990, 2000, 2010, and 2020, as well as 2018 Estimates - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County LMS Data",
          description: "Los Angeles County Location Management System (LMS) Data - comprehensive dataset of 193 layers covering various points of interest, facilities, and infrastructure - proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Political Boundaries",
          description: "Los Angeles County Political Boundaries including Districts (2021, 2011, 2001, 1971-1991), Supervisorial Districts, Congressional Districts, State Assembly Districts, State Senate Districts, Board of Equalization, LA City Council Districts, School Districts, Registrar Recorder Precincts, Election Precincts, City and County Boundaries, Community Boundaries, and City Annexations - point-in-polygon queries",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Redistricting Data (2011)",
          description: "Los Angeles County Redistricting Data from 2011 including Redistricting Geography, Communities, Home and Income Information, Housing Data, Income Data, Population Density, Voter Registration Data, Citizen Voting Age Population, Demographic Data, and Language data - point-in-polygon and proximity queries up to 5 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "LA County Transportation",
          description: "Los Angeles County Transportation data including Transportation, Milepost Markers, Rail Transportation, Freeways, Disaster Routes, Highway Shields, Metro Park and Ride, Metro Stations, Metrolink Stations, Metrolink Lines, Metro Lines, and Railroads - proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "New Jersey Data (NJGIN)",
      sources: [
        {
          name: "NJ Tax Parcels",
          description: "New Jersey Tax Parcels from NJGIN - point-in-polygon and proximity queries (0.25, 0.50, 0.75, 1.0 miles)",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NJ Address Points",
          description: "New Jersey Address Points from NJGIN - comprehensive statewide NG9-1-1 database meeting NENA 2018 NG9-1-1 GIS Data Standard - proximity queries up to 5 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NJ Bus Stops",
          description: "New Jersey Transit Bus Stops from NJGIN - single point bus stops for NJ Transit routes - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NJ Safety Service Patrol",
          description: "New Jersey Department of Transportation Safety Service Patrol routes from NJGIN - highway patrol coverage areas - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NJ Service Areas",
          description: "New Jersey Service Areas from NJGIN - highway service areas and rest stops - proximity queries up to 50 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NJ Roadway Network",
          description: "New Jersey Department of Transportation Roadway Network from NJGIN - comprehensive road network including highways, routes, and ramps - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NJ Known Contaminated Sites",
          description: "New Jersey Department of Environmental Protection (NJDEP) Known Contaminated Sites from Environmental NJEMS - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NJ Alternative Fueled Vehicle Fueling Stations",
          description: "New Jersey Department of Environmental Protection (NJDEP) Alternative Fueled Vehicle Fueling Stations from Structures MapServer - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NJ Power Plants",
          description: "New Jersey Department of Environmental Protection (NJDEP) Power Plants from Utilities MapServer - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "NJ Public Solar Facilities",
          description: "New Jersey Department of Environmental Protection (NJDEP) Solar PV at Public Facilities from Utilities MapServer - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
        },
        {
          name: "NJ Public Places to Keep Cool",
          description: "New Jersey Department of Environmental Protection (NJDEP) Public Places to Keep Cool from FeatureServer - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Delaware Data (DE FirstMap)",
      sources: [
        {
          name: "DE State Forest",
          description: "Delaware State Forest lands managed by the Delaware Forest Service - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Pine Plantations",
          description: "Locations of Pine Plantations in Delaware - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Urban Tree Canopy Estimates",
          description: "Urban Tree Canopy calculations for Delaware municipalities, communities, and parks - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Forest Cover 2007",
          description: "2007 Aerial imagery based forest cover for Delaware - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE No Build Points - Bay",
          description: "No Build Points along Delaware Bay coast - proximity queries up to 25 miles",
          coverage: "Delaware Bay Coast",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE No Build Line - Bay",
          description: "No Build Line along Delaware Bay coast - proximity queries up to 25 miles",
          coverage: "Delaware Bay Coast",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE No Build Points - Ocean",
          description: "No Build Points along Delaware Ocean coast - proximity queries up to 25 miles",
          coverage: "Delaware Ocean Coast",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE No Build Line - Ocean",
          description: "No Build Line along Delaware Ocean coast - proximity queries up to 25 miles",
          coverage: "Delaware Ocean Coast",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Park Facilities",
          description: "Outdoor recreational facilities throughout Delaware - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Natural Areas",
          description: "Natural Areas Inventory boundaries for voluntary land protection - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Outdoor Recreation, Parks and Trails Program Lands",
          description: "Lands where Delaware Outdoor Recreation, Parks and Trails Program monies have been invested - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Land and Water Conservation Fund",
          description: "Lands protected under the Land and Water Conservation Fund - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Nature Preserves",
          description: "Lands preserved under the Delaware Nature Preserves Program - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Outdoor Recreation Areas",
          description: "Outdoor Recreation Inventory (ORI) - publicly and privately owned protected lands - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Outdoor Recreation, Parks and Trails Program Open Space",
          description: "Land protected in perpetuity under the Outdoor Recreation, Parks and Trails Program - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Public Protected Lands",
          description: "Lands that are publicly owned and open to public access - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Conservation Easements",
          description: "Conservation Easements held by Delaware State Parks and other agencies/NGOs - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Trails and Pathways",
          description: "Recreational trails and pathways throughout Delaware - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Seasonal Restricted Areas",
          description: "Portions of Delaware State Parks closed to public access during different seasons - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Permanent Restricted Areas",
          description: "Portions of Delaware State Parks closed to public access all year long - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Wildlife Area Boundaries",
          description: "Wildlife Area locations within the State of Delaware - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE State Parcels",
          description: "Delaware state parcels with ownership information - point-in-polygon and proximity queries up to 1 mile",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Land Use Land Cover 2007",
          description: "2007 Land Use Land Cover for Delaware based on Delaware Modified Anderson System - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Land Use Land Cover 2007 (Revised)",
          description: "Revised 2007 Land Use Land Cover for Delaware - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Land Use Land Cover 2012",
          description: "2012 Land Use Land Cover for Delaware - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Land Use Land Cover 2017",
          description: "2017 Land Use Land Cover for Delaware - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Land Use Land Cover 2022",
          description: "2022 Land Use Land Cover for Delaware - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Child Care Centers",
          description: "Delaware Child Care Centers - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Fishing Access",
          description: "Delaware Fishing Access locations (boat docks, ramps, piers, shoreline fishing) - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Trout Streams",
          description: "Delaware Trout Streams in New Castle County - proximity queries up to 25 miles",
          coverage: "New Castle County, Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Public Schools",
          description: "Delaware Public Schools - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Private Schools",
          description: "Delaware Private Schools - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE VoTech School Districts",
          description: "Delaware VoTech School Districts - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE School Districts",
          description: "Delaware Public School Districts - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Wildlife Areas Stands Blinds and Fields",
          description: "Wildlife Area Stands, Blinds, and Fields - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Wildlife Areas Boat Ramps",
          description: "Wildlife Area Boat Ramps - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Wildlife Areas Facilities",
          description: "Wildlife Area Facilities - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Wildlife Areas Parking",
          description: "Wildlife Area Parking - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Wildlife Areas Restrooms",
          description: "Wildlife Area Restrooms - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Wildlife Areas Safety Zones",
          description: "Wildlife Area Safety Zones - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Wildlife Management Zones",
          description: "Wildlife Management Zones for deer harvesting - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "DE Rail Lines",
          description: "Delaware Rail Lines - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Mapping & Basemap Services",
      sources: [
        {
          name: "MapTiler",
          description: "Professional basemap tiles including streets, satellite, topographic, hybrid, landscape, and specialized map styles",
          coverage: "Global",
          accuracy: "Very High",
          cost: "Free (with API key)"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white shadow-lg border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBackToMain}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Main</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <Globe className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Data Sources & APIs</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-8 mt-4">
          {dataSources.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl">
                <h2 className="text-xl font-bold text-white p-4 flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>{category.category}</span>
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                {category.sources.map((source, sourceIndex) => (
                  <div key={sourceIndex} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{source.name}</h3>
                        <p className="text-gray-600 mb-3">{source.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Coverage:</span>
                            <p className="text-gray-600">{source.coverage}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Accuracy:</span>
                            <p className="text-gray-600">{source.accuracy}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Cost:</span>
                            <p className="text-gray-600">{source.cost}</p>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">Available</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Additional Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center space-x-2">
              <ExternalLink className="w-5 h-5" />
              <span>Data Usage & Attribution</span>
            </h3>
            <div className="text-blue-800 space-y-2">
              <p>• All data sources are used in compliance with their respective terms of service</p>
              <p>• Free data sources are prioritized to minimize costs for users</p>
              <p>• Paid APIs are used only when free alternatives are not available</p>
              <p>• Data is cached and rate-limited to respect API quotas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSourcesView;
