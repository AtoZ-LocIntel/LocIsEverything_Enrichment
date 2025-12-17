import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Globe, Database, CheckCircle, ExternalLink, X } from 'lucide-react';

interface DataSourcesViewProps {
  onBackToMain: () => void;
}

export interface DataSource {
  name: string;
  description: string;
  coverage: string;
  accuracy: string;
  cost: string;
  url?: string;
}

export interface DataSourceCategory {
  category: string;
  sources: DataSource[];
}

// Export the dataSources array so it can be shared with mobile view
export const getDataSources = (): DataSourceCategory[] => {
  return [
    {
      category: "Geocoding Services",
      sources: [
        {
          name: "Nominatim (OpenStreetMap)",
          description: "Open-source geocoding service providing worldwide address and location data",
          coverage: "Global",
          accuracy: "High",
          cost: "Free",
          url: "https://nominatim.openstreetmap.org/"
        },
        {
          name: "US Census Bureau Geocoding",
          description: "Official US address validation and geocoding with high precision",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://geocoding.geo.census.gov/geocoder/"
        },
        {
          name: "GeoNames",
          description: "Geographic database covering all countries with administrative divisions",
          coverage: "Global",
          accuracy: "High",
          cost: "Free (with limits)",
          url: "https://www.geonames.org/"
        },
        {
          name: "Postcodes.io",
          description: "UK postcode lookup service with detailed geographic information",
          coverage: "United Kingdom",
          accuracy: "Very High",
          cost: "Free",
          url: "https://postcodes.io/"
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
          cost: "Free",
          url: "https://api.open-meteo.com/v1/elevation"
        },
        {
          name: "Open-Meteo Weather API",
          description: "Current weather conditions, forecasts, and historical weather data",
          coverage: "Global",
          accuracy: "High",
          cost: "Free",
          url: "https://api.open-meteo.com/"
        },
        {
          name: "Air Quality Index (AQI)",
          description: "Real-time air quality measurements and pollution levels",
          coverage: "Global",
          accuracy: "High",
          cost: "Free",
          url: "https://api.waqi.info/"
        },
        {
          name: "National Weather Service Alerts",
          description: "Active weather alerts, warnings, and advisories",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://api.weather.gov/alerts"
        },
        {
          name: "EPA Walkability Index",
          description: "Neighborhood walkability scores based on street connectivity, population density, and land use mix",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://edg.epa.gov/EPADataCommons/public/OA/EPA_SmartLocationDatabase_V3_Jan_2021_Final.csv"
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
          cost: "Free",
          url: "https://www.census.gov/data/developers/data-sets.html"
        },
        {
          name: "American Community Survey",
          description: "Detailed demographic and economic characteristics",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://www.census.gov/data/developers/data-sets/acs-5year.html"
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
          cost: "Free",
          url: "https://overpass-api.de/"
        },
        {
          name: "USDA Local Food Portal",
          description: "Farmers markets, CSA programs, agritourism, food hubs, and on-farm markets",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://data.nal.usda.gov/dataset/local-food-directories"
        },
        {
          name: "OpenChargeMap API",
          description: "Electric vehicle charging stations and infrastructure",
          coverage: "Global",
          accuracy: "High",
          cost: "Free",
          url: "https://openchargemap.org/site/develop/api"
        },
        {
          name: "USGS Trail and National Map",
          description: "Hiking trailheads, trails, and outdoor recreation data",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://apps.nationalmap.gov/services/"
        },
        {
          name: "Wikipedia API",
          description: "Haunted sites, historic oddities, museums, and quirky landmarks",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free",
          url: "https://www.mediawiki.org/wiki/API:Main_page"
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
          cost: "Free",
          url: "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Current_Wildland_Fire_Locations/FeatureServer"
        },
        {
          name: "USDA Wildfire Hazard Potential",
          description: "USDA Forest Service - Composite wildfire risk index (1-5: Very Low to Very High) with automatic proximity search",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://www.fs.usda.gov/"
        },
        {
          name: "USDA Burn Probability",
          description: "USDA Forest Service - Annual probability of wildfire occurrence (0-1 scale) with automatic proximity search",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://www.fs.usda.gov/"
        },
        {
          name: "USDA Conditional Flame Length",
          description: "USDA Forest Service - Expected flame length if fire occurs (feet) with automatic proximity search",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://www.fs.usda.gov/"
        },
        {
          name: "USDA Risk to Potential Structures",
          description: "USDA Forest Service - Structure exposure risk assessment with automatic proximity search",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://www.fs.usda.gov/"
        },
        {
          name: "USDA Housing Unit Risk",
          description: "USDA Forest Service - Housing unit count, density, exposure, impact, and risk assessments",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://www.fs.usda.gov/"
        },
        {
          name: "USDA Population Count",
          description: "USDA Forest Service - Population count and density data for wildfire risk assessment",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://www.fs.usda.gov/"
        },
        {
          name: "FEMA Flood Zones",
          description: "National Flood Hazard Layer with flood zone classifications",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer"
        },
        {
          name: "FEMA NFHL Availability",
          description: "NFHL availability footprint (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/0"
        },
        {
          name: "FEMA FIRM Panels",
          description: "FIRM panels index (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/1"
        },
        {
          name: "FEMA LOMRs",
          description: "Letters of Map Revision (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/2"
        },
        {
          name: "FEMA LOMAs",
          description: "Letters of Map Amendment (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/3"
        },
        {
          name: "FEMA Political Jurisdictions",
          description: "FEMA political jurisdictions (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/4"
        },
        {
          name: "FEMA Profile Baselines",
          description: "Profile baselines (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/5"
        },
        {
          name: "FEMA Water Lines",
          description: "Water lines (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/6"
        },
        {
          name: "FEMA Cross-Sections",
          description: "Cross-sections (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/7"
        },
        {
          name: "FEMA Base Flood Elevations",
          description: "Base flood elevations (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/8"
        },
        {
          name: "FEMA Levees",
          description: "Levees (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/9"
        },
        {
          name: "FEMA Submittal Info",
          description: "Submittal information (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/11"
        },
        {
          name: "FEMA Coastal Transects",
          description: "Coastal transects (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/12"
        },
        {
          name: "FEMA Transect Baselines",
          description: "Transect baselines (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/13"
        },
        {
          name: "FEMA General Structures",
          description: "General structures (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/14"
        },
        {
          name: "FEMA River Mile Markers",
          description: "River mile markers (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/15"
        },
        {
          name: "FEMA Water Areas",
          description: "Water areas (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/16"
        },
        {
          name: "FEMA PLSS",
          description: "Public Land Survey System (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/17"
        },
        {
          name: "FEMA Limit of Moderate Wave Action",
          description: "LiMWA (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/18"
        },
        {
          name: "FEMA Flood Hazard Boundaries",
          description: "Flood hazard boundaries (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/19"
        },
        {
          name: "FEMA Flood Hazard Zones",
          description: "Flood hazard zones (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/20"
        },
        {
          name: "FEMA Primary Frontal Dunes",
          description: "Primary frontal dunes (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/21"
        },
        {
          name: "FEMA Base Index",
          description: "Base index (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/22"
        },
        {
          name: "FEMA Topographic Low Confidence Areas",
          description: "Topographic low confidence areas (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/23"
        },
        {
          name: "FEMA Datum Conversion Points",
          description: "Datum conversion points (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/24"
        },
        {
          name: "FEMA Coastal Gages",
          description: "Coastal gages (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/25"
        },
        {
          name: "FEMA Gages",
          description: "Gages (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/26"
        },
        {
          name: "FEMA Nodes",
          description: "Nodes (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/27"
        },
        {
          name: "FEMA High Water Marks",
          description: "High water marks (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/28"
        },
        {
          name: "FEMA Station Start Points",
          description: "Station start points (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/29"
        },
        {
          name: "FEMA Hydrologic Reaches",
          description: "Hydrologic reaches (proximity up to 10 miles)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/30"
        },
        {
          name: "FEMA Alluvial Fans",
          description: "Alluvial fans (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/31"
        },
        {
          name: "FEMA Subbasins",
          description: "Subbasins (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/32"
        },
        {
          name: "2023 National Seismic Hazard Model",
          description: "USGS Modified Mercalli Intensity polygons (point-in-polygon)",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/2023_National_Seismic_Hazard_Model/FeatureServer/0"
        },
        {
          name: "Tornado Tracks 1950-2017",
          description: "Historical tornado tracks (polyline) with proximity up to 50 miles",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/Tornado_Tracks_1950_2017_1/FeatureServer/0"
        },
        {
          name: "USGS Earthquakes",
          description: "Historical earthquake events and seismic activity",
          coverage: "Global",
          accuracy: "High",
          cost: "Free",
          url: "https://earthquake.usgs.gov/earthquakes/feed/"
        },
        {
          name: "USGS Volcanoes",
          description: "Active and dormant volcano locations and status",
          coverage: "Global",
          accuracy: "High",
          cost: "Free",
          url: "https://volcanoes.usgs.gov/vsc/api/volcanoApi/geojson"
        },
        {
          name: "USGS Wetlands",
          description: "National Wetlands Inventory - wetland types and locations",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://www.fws.gov/program/national-wetlands-inventory"
        },
        {
          name: "USGS Flood Reference Points",
          description: "Real-time flooding reference points and actively flooding locations",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://waterwatch.usgs.gov/"
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
          cost: "Free",
          url: "https://auroras.live/#/"
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
          cost: "Paid",
          url: "https://locationfriend.com/"
        },
        {
          name: "EPA Superfund Sites",
          description: "Hazardous waste sites including National Priorities List locations",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://www.epa.gov/superfund/search-superfund-sites-where-you-live"
        },
        {
          name: "EPA Brownfields",
          description: "Assessment, Cleanup and Redevelopment Exchange System sites",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://www.epa.gov/brownfields"
        },
        {
          name: "EPA TRI Facilities",
          description: "Toxics Release Inventory facilities reporting chemical releases. Includes: All TRI Facilities, TRI Facilities (Tribal Land), Manufacturing Facilities, Metal Mining Facilities, Electric Utility Facilities, Wood Products Facilities, Automotive Manufacturing, PFAS Facilities, Lead Facilities, Dioxins Facilities, Ethylene Oxide Facilities, Carcinogens Facilities, Mercury Facilities, and Federal TRI Facilities",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://geodata.epa.gov/arcgis/rest/services/OCSPP/TRI_NA_WhereYouLive_2023/MapServer"
        },
        {
          name: "EPA Air Facilities",
          description: "Air Facility System - stationary sources of air pollution",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://echo.epa.gov/"
        },
        {
          name: "EPA RCRA Facilities",
          description: "Resource Conservation and Recovery Act - hazardous waste generators, treaters, storers, transporters, and disposers",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://echo.epa.gov/"
        },
        {
          name: "EPA NPDES Permits",
          description: "National Pollutant Discharge Elimination System - permitted wastewater discharge facilities",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://echo.epa.gov/"
        },
        {
          name: "EPA Radiation Facilities",
          description: "RADINFO - facilities dealing with radioactivity or radiation",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://www.epa.gov/radnet"
        },
        {
          name: "EPA Power Generation",
          description: "EGRID/EIA-860 - power plant and generation facilities",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://www.epa.gov/egrid"
        },
        {
          name: "EPA Oil Spill Response",
          description: "SPCC/FRP - countermeasure and facility response plan subject facilities",
          coverage: "United States",
          accuracy: "High",
          cost: "Free",
          url: "https://www.epa.gov/oil-spills-prevention-and-preparedness-regulations"
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
          cost: "Free",
          url: "https://data.openei.org/api/views/f9yf-3pn4/rows.geojson"
        },
        {
          name: "OSM Health & Wellness - Medical Care",
          description: "OpenStreetMap - Hospitals, clinics, doctors, specialists via Overpass API (proximity queries up to 25 miles)",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free",
          url: "https://overpass-api.de/"
        },
        {
          name: "OSM Health & Wellness - Mental & Behavioral Health",
          description: "OpenStreetMap - Psychotherapists, psychologists, psychiatrists, mental health clinics via Overpass API (proximity queries up to 25 miles)",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free",
          url: "https://overpass-api.de/"
        },
        {
          name: "OSM Health & Wellness - Pharmacy & Diagnostics",
          description: "OpenStreetMap - Pharmacies, laboratories, diagnostic centers via Overpass API (proximity queries up to 25 miles)",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free",
          url: "https://overpass-api.de/"
        },
        {
          name: "OSM Health & Wellness - Fitness & Movement",
          description: "OpenStreetMap - Fitness centers, gyms, sports centers, physiotherapists via Overpass API (proximity queries up to 25 miles)",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free",
          url: "https://overpass-api.de/"
        },
        {
          name: "OSM Health & Wellness - Wellness & Alternative Care",
          description: "OpenStreetMap - Chiropractors, acupuncturists, massage, naturopaths, osteopaths via Overpass API (proximity queries up to 25 miles)",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free",
          url: "https://overpass-api.de/"
        },
        {
          name: "OSM Health & Wellness - Dental & Vision",
          description: "OpenStreetMap - Dentists, orthodontists, oral surgeons, optometrists, ophthalmologists via Overpass API (proximity queries up to 25 miles)",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free",
          url: "https://overpass-api.de/"
        },
        {
          name: "OSM Health & Wellness - Public & Community Health",
          description: "OpenStreetMap - Public health facilities, community health centers via Overpass API (proximity queries up to 25 miles)",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free",
          url: "https://overpass-api.de/"
        },
        {
          name: "OSM Health & Wellness - Senior & Assisted Care",
          description: "OpenStreetMap - Nursing homes, assisted living, rehabilitation, hospices via Overpass API (proximity queries up to 25 miles)",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free",
          url: "https://overpass-api.de/"
        },
        {
          name: "OpenStreetMap Infrastructure",
          description: "Electrical substations, powerlines, and cellular communication towers",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free",
          url: "https://overpass-api.de/"
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
          cost: "Free",
          url: "https://overpass-api.de/"
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
          cost: "Free",
          url: "https://overpass-api.de/"
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
          cost: "Free",
          url: "https://overpass-api.de/"
        },
        {
          name: "US Fish and Wildlife Service (FWS)",
          description: "Endangered/threatened species, critical habitat, wildlife refuges, wetlands, marine mammals, migratory birds, and fish hatcheries within proximity",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://ecos.fws.gov/ecp/"
        },
        {
          name: "eBird API (Cornell Lab of Ornithology)",
          description: "Birding hotspots, recent species observations, and community-sourced ornithological data",
          coverage: "Global (observer-dependent)",
          accuracy: "Community reported / curated",
          cost: "Free (API key)",
          url: "https://ebird.org/api/v2/"
        },
        {
          name: "NOAA National Marine Sanctuaries",
          description: "National Marine Sanctuaries - point-in-polygon and proximity queries (up to 25 miles)",
          coverage: "United States (coastal waters)",
          accuracy: "Very High",
          cost: "Free",
          url: "https://sanctuaries.noaa.gov/"
        },
        {
          name: "ISRIC SoilGrids (via ESRI Living Atlas)",
          description: "World Soils 250m Organic Carbon Density - point-in-pixel queries for soil organic carbon density (kg/m²)",
          coverage: "Global",
          accuracy: "High",
          cost: "Free",
          url: "https://www.isric.org/explore/soilgrids"
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
          cost: "Free",
          url: "https://services.arcgis.com/v01gqwM5QqNysAAi/ArcGIS/rest/services/PADUS_Public_Access/FeatureServer"
        },
        {
          name: "BLM National GTLF Public Managed Trails",
          description: "Bureau of Land Management - National GTLF Public Managed Trails - proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_GTLF_Public_Managed_Trails/FeatureServer/2"
        },
        {
          name: "BLM National GTLF Public Motorized Trails",
          description: "Bureau of Land Management - National GTLF Public Motorized Trails - proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_GTLF_Public_Motorized_Trails/FeatureServer/4"
        },
        {
          name: "BLM National GTLF Public Nonmotorized Trails",
          description: "Bureau of Land Management - National GTLF Public Nonmotorized Trails - proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_GTLF_Public_Nonmotorized_Trails/FeatureServer/6"
        },
        {
          name: "BLM National GTLF Limited Public Motorized Roads",
          description: "Bureau of Land Management - National GTLF Limited Public Motorized Roads - proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_GTLF_Limited_Public_Motorized_Roads/FeatureServer/0"
        },
        {
          name: "BLM National GTLF Public Motorized Roads",
          description: "Bureau of Land Management - National GTLF Public Motorized Roads - proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_GTLF_Public_Motorized_Roads/FeatureServer/3"
        },
        {
          name: "BLM National Grazing Pasture Polygons",
          description: "Bureau of Land Management - National Grazing Pasture Polygons - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Grazing_Pasture_Polygons/FeatureServer/0"
        },
        {
          name: "BLM National Areas of Critical Environmental Concern",
          description: "Bureau of Land Management - National Areas of Critical Environmental Concern - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Areas_of_Critical_Environmental_Concern/FeatureServer/1"
        },
        {
          name: "BLM National Sheep and Goat Billed Grazing Allotments",
          description: "Bureau of Land Management - National Sheep and Goat Billed Grazing Allotments - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Sheep_and_Goat_Billed_Grazing_Allotments/FeatureServer/3"
        },
        {
          name: "BLM National Sheep and Goat Authorized Grazing Allotments",
          description: "Bureau of Land Management - National Sheep and Goat Authorized Grazing Allotments - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Sheep_and_Goat_Authorized_Grazing_Allotments/FeatureServer/2"
        },
        {
          name: "BLM National NLCS National Monuments and National Conservation Areas",
          description: "Bureau of Land Management - National NLCS National Monuments and National Conservation Areas - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_NLCS_National_Monuments_National_Conservation_Areas_Polygons/FeatureServer/0"
        },
        {
          name: "BLM National Wild Horse and Burro Herd Areas",
          description: "Bureau of Land Management - National Wild Horse and Burro Herd Areas - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Wild_Horse_and_Burro_Heard_Area_Polygons/FeatureServer/4"
        },
        {
          name: "BLM National Recreation Site Polygons",
          description: "Bureau of Land Management - National Recreation Site Polygons - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Recreation_Site_Polygons/FeatureServer/3"
        },
        {
          name: "BLM National Fire Perimeters",
          description: "Bureau of Land Management - National Fire Perimeters - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Fire_Perimeters_Polygon/FeatureServer/0"
        },
        {
          name: "BLM National Land and Water Conservation Fund (LWCF) Polygons",
          description: "Bureau of Land Management - National Land and Water Conservation Fund (LWCF) Polygons - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Land_and_Water_Conservation_Fund_LWCF_Polygons/FeatureServer/2"
        },
        {
          name: "USFS Forest System Boundaries",
          description: "US Forest Service - Forest System Boundaries - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://www.fs.usda.gov/"
        },
        {
          name: "USFS National Wilderness Areas",
          description: "US Forest Service - National Wilderness Areas - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://www.fs.usda.gov/"
        },
        {
          name: "USFS National Grassland Units",
          description: "US Forest Service - National Grassland Units - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://www.fs.usda.gov/"
        },
        {
          name: "NPS National Parks",
          description: "National Parks Service - National Parks boundaries - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services.arcgis.com/v01gqwM5QqNysAAi/ArcGIS/rest/services/PADUS_Public_Access/FeatureServer/0"
        },
        {
          name: "NPS National Register of Historic Places (NRHP) Locations",
          description: "National Parks Service - National Register of Historic Places locations - proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://mapservices.nps.gov/arcgis/rest/services/cultural_resources/nrhp_locations/MapServer/0"
        },
        {
          name: "National Rivers Inventory (NRI) Rivers",
          description: "National Parks Service - National Rivers Inventory rivers - proximity queries up to 50 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/Nationwide_Rivers_Inventory_Official/FeatureServer/0"
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
          cost: "Free",
          url: "https://www.openbrewerydb.org/"
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
          cost: "Free",
          url: "https://services1.arcgis.com/4ez8hDeiCPBjc5e7/arcgis/rest/services/Appalachian_Trail_Features/FeatureServer"
        },
        {
          name: "Pacific Crest Trail (PCT) Features",
          description: "PCT centerline, sheriff offices, side trails, mile markers, and resupply towns via ArcGIS services",
          coverage: "Pacific Crest Trail Corridor",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services5.arcgis.com/ZldHa25efPFpMmfB/ArcGIS/rest/services/PCT_Centerline/FeatureServer"
        }
      ]
    },
    {
      category: "US Census TIGER Data",
      sources: [
        {
          name: "TIGER Transportation - Primary Roads",
          description: "US Census TIGER - Primary Roads including Interstates (5M scale, 2.1M scale, and standard) - proximity queries up to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer"
        },
        {
          name: "TIGER Transportation - Secondary Roads",
          description: "US Census TIGER - Secondary Roads including Interstates and US Highways (578k scale, 289-144k scale, 72-1k scale) - proximity queries up to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer"
        },
        {
          name: "TIGER Transportation - Local Roads",
          description: "US Census TIGER - Local Roads (72k scale and standard) - proximity queries up to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer"
        },
        {
          name: "TIGER Transportation - Railroads",
          description: "US Census TIGER - Railroad lines - proximity queries up to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer"
        },
        {
          name: "TIGER School Districts - Unified, Secondary, Elementary, and Administrative Areas",
          description: "US Census TIGER - School District boundaries (BAS 2025, ACS 2024, Census 2020) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/School/MapServer"
        },
        {
          name: "TIGER Special Land Use Areas - National Park Service Areas",
          description: "US Census TIGER - National Park Service Areas - point-in-polygon and proximity queries up to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Special_Land_Use_Areas/MapServer"
        },
        {
          name: "TIGER Special Land Use Areas - Correctional Facilities",
          description: "US Census TIGER - Correctional Facilities - point-in-polygon and proximity queries up to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Special_Land_Use_Areas/MapServer"
        },
        {
          name: "TIGER Special Land Use Areas - Colleges and Universities",
          description: "US Census TIGER - Colleges and Universities - point-in-polygon and proximity queries up to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Special_Land_Use_Areas/MapServer"
        },
        {
          name: "TIGER Special Land Use Areas - Military Installations",
          description: "US Census TIGER - Military Installations - point-in-polygon and proximity queries up to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Special_Land_Use_Areas/MapServer"
        },
        {
          name: "TIGER Native Lands - Alaska Native Regional Corporations",
          description: "US Census TIGER - Alaska Native Regional Corporations (ANRC) boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States (Alaska)",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer"
        },
        {
          name: "TIGER Native Lands - Tribal Subdivisions",
          description: "US Census TIGER - Tribal Subdivisions boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer"
        },
        {
          name: "TIGER Native Lands - Federal American Indian Reservations",
          description: "US Census TIGER - Federal American Indian Reservations (AIR) boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer"
        },
        {
          name: "TIGER Native Lands - Off-Reservation Trust Lands",
          description: "US Census TIGER - Off-Reservation Trust Lands boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer"
        },
        {
          name: "TIGER Native Lands - State American Indian Reservations",
          description: "US Census TIGER - State American Indian Reservations (SAIR) boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer"
        },
        {
          name: "TIGER Native Lands - Hawaiian Home Lands",
          description: "US Census TIGER - Hawaiian Home Lands (HHL) boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States (Hawaii)",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer"
        },
        {
          name: "TIGER Native Lands - Alaska Native Village Statistical Areas",
          description: "US Census TIGER - Alaska Native Village Statistical Areas (ANVSA) boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States (Alaska)",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer"
        },
        {
          name: "TIGER Native Lands - Oklahoma Tribal Statistical Areas",
          description: "US Census TIGER - Oklahoma Tribal Statistical Areas (OTSA) boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States (Oklahoma)",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer"
        },
        {
          name: "TIGER Native Lands - State Designated Tribal Statistical Areas",
          description: "US Census TIGER - State Designated Tribal Statistical Areas (SDTSA) boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer"
        },
        {
          name: "TIGER Native Lands - Tribal Designated Statistical Areas",
          description: "US Census TIGER - Tribal Designated Statistical Areas (TDSA) boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer"
        },
        {
          name: "TIGER Native Lands - American Indian Joint-Use Areas",
          description: "US Census TIGER - American Indian Joint-Use Areas (AIJUA) boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer"
        },
        {
          name: "TIGER CBSA - Combined Statistical Areas",
          description: "US Census TIGER - Combined Statistical Areas (CSA) boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/CBSA/MapServer"
        },
        {
          name: "TIGER CBSA - Metropolitan and Micropolitan Statistical Areas",
          description: "US Census TIGER - Metropolitan and Micropolitan Statistical Areas boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/CBSA/MapServer"
        },
        {
          name: "TIGER CBSA - Metropolitan Divisions",
          description: "US Census TIGER - Metropolitan Divisions boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/CBSA/MapServer"
        },
        {
          name: "TIGER CBSA - Metropolitan Statistical Areas",
          description: "US Census TIGER - Metropolitan Statistical Areas (MSA) boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/CBSA/MapServer"
        },
        {
          name: "TIGER CBSA - Micropolitan Statistical Areas",
          description: "US Census TIGER - Micropolitan Statistical Areas (μSA) boundaries - point-in-polygon and proximity queries up to 25 miles. Includes base layer, BAS 2025, ACS 2024, and Census 2020 versions.",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/CBSA/MapServer"
        },
        {
          name: "TIGER CBSA - New England City and Town Areas",
          description: "US Census TIGER - New England City and Town Areas (NECTA) boundaries - point-in-polygon and proximity queries up to 25 miles. Census 2020 version only.",
          coverage: "United States (New England)",
          accuracy: "Very High",
          cost: "Free",
          url: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/CBSA/MapServer"
        }
      ]
    },
    {
      category: "Massachusetts Sources",
      sources: [
        {
          name: "MA DEP Wetland Areas",
          description: "Massachusetts Department of Environmental Protection wetland areas - point-in-polygon and proximity queries",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/DEP_Wetlands/FeatureServer/1"
        },
        {
          name: "MA Protected and Recreational Open Space",
          description: "Massachusetts protected and recreational open space areas - point-in-polygon and proximity queries",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/openspace/FeatureServer/0"
        },
        {
          name: "MA Hiking and Wilderness Trails",
          description: "Massachusetts hiking and wilderness trails - line dataset with proximity queries up to 25 miles",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Trails/FeatureServer/0"
        },
        {
          name: "MA NHESP Natural Communities",
          description: "Massachusetts Natural Heritage & Endangered Species Program (NHESP) natural communities - point-in-polygon and proximity queries (0.1, 0.25, 0.5, 0.75, 1.0 miles)",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/NHESP_Natural_Communities/FeatureServer/0"
        },
        {
          name: "MA Lakes and Ponds",
          description: "Massachusetts lakes and ponds from MassGIS Hydro_Major FeatureServer - point-in-polygon and proximity queries (0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0 miles)",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Hydro_Major/FeatureServer/2"
        },
        {
          name: "MA Rivers and Streams",
          description: "Massachusetts rivers and streams from MassGIS Hydro_Major FeatureServer - proximity queries (0.5, 1, 2.5, 5, 10 miles)",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Hydro_Major/FeatureServer/1"
        },
        {
          name: "MA Regional Planning Agencies",
          description: "Massachusetts Regional Planning Agencies (RPAs) from MassGIS - point-in-polygon queries",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/RPAs/FeatureServer/0"
        },
        {
          name: "MA Areas of Critical Environmental Concern (ACECs)",
          description: "MassGIS - Massachusetts Areas of Critical Environmental Concern (point-in-polygon and proximity queries up to 25 miles)",
          coverage: "Massachusetts",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/ACECs/FeatureServer/0"
        },
        {
          name: "Massachusetts Property Tax Parcels",
          description: "MassGIS Level 3 Assessors' Parcel Mapping data - point-in-polygon and proximity queries (0.3, 0.5, 0.75, 1.0 miles)",
          coverage: "Massachusetts (350 of 351 cities and towns)",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/hGdibHYSPO59RG1h/ArcGIS/rest/services/L3_TAXPAR_POLY_ASSESS_gdb/FeatureServer/0"
        },
        {
          name: "Cape Cod Zoning Map",
          description: "Cape Cod zoning districts and boundaries - point-in-polygon and proximity queries",
          coverage: "Cape Cod, Massachusetts",
          accuracy: "Very High",
          cost: "Free",
          url: "https://gis-services.capecodcommission.org/arcgis/rest/services/Reference/Boundaries/MapServer/20"
        }
      ]
    },
    {
      category: "Connecticut Sources",
      sources: [
        {
          name: "CT Parcels",
          description: "Connecticut State Parcel Layer 2023 - point-in-polygon and proximity queries (0.25, 0.5, 0.75, 1.0 miles)",
          coverage: "Connecticut (169 municipalities)",
          url: "https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/ArcGIS/rest/services/Connecticut_State_Parcel_Layer_2023/FeatureServer/0",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "CT 2D Building Footprints",
          description: "Connecticut 2D building footprints - point-in-polygon and proximity queries (0.25, 0.5, 0.75, 1.0 miles)",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/arcgis/rest/services/2D_Building_Footprints/FeatureServer/0"
        },
        {
          name: "CT Roads and Trails",
          description: "Connecticut roads and trails network - proximity queries up to 5 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/Road/FeatureServer/0"
        },
        {
          name: "CT Urgent Care",
          description: "Connecticut urgent care facilities - proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/ArcGIS/rest/services/CTUrgentCare/FeatureServer/26"
        },
        {
          name: "CT DEEP Properties",
          description: "Connecticut Department of Energy and Environmental Protection (DEEP) properties - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/Connecticut_DEEP_Property/FeatureServer/0"
        },
        {
          name: "CT Tribal Lands",
          description: "Connecticut Tribal Lands (State and Federally Recognized) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/ArcGIS/rest/services/Connecticut_Tribal_Lands/FeatureServer/0"
        },
        {
          name: "CT Drinking Water Watersheds",
          description: "Connecticut Drinking Water Watersheds - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/ArcGIS/rest/services/Drinking_Water_Watersheds/FeatureServer/0"
        },
        {
          name: "CT 2025 Broadband Availability by Block",
          description: "Connecticut 2025 Broadband Availability by Census Block - point-in-polygon and proximity queries up to 5 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/ArcGIS/rest/services/2025_Broadband_Availability_WFL1/FeatureServer/0"
        },
        {
          name: "CT Water Pollution Control Facilities",
          description: "Connecticut Water Pollution Control Facilities - proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/WATER_POLLUTION_CONTROL_FACILITIES/FeatureServer/0"
        },
        {
          name: "CT Boat Launches",
          description: "Connecticut DEEP Boat Launches - proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/Connecticut_DEEP_Boat_Launches/FeatureServer/0"
        },
        {
          name: "CT Federal Open Space",
          description: "Connecticut Federal Open Space - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/Federal_Open_Space/FeatureServer/0"
        },
        {
          name: "CT HUC Watershed Boundaries",
          description: "Connecticut HUC (Hydrologic Unit Code) Watershed Boundaries - point-in-polygon queries",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/Watershed_Boundary_Dataset/FeatureServer/2"
        },
        {
          name: "CT Soils Parent Material Name",
          description: "Connecticut Soils Parent Material Name (SSURGO) - point-in-polygon queries",
          coverage: "Connecticut",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/FjPcSmEFuDYlIdKC/arcgis/rest/services/Soils_Parent_Material_Name/FeatureServer/1"
        }
      ]
    },
    {
      category: "California Sources",
      sources: [
        {
          name: "CA Power Outage Areas",
          description: "California Power Outage Areas - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services.arcgis.com/BLN4oKB0N1YSgvY8/arcgis/rest/services/Power_Outages_(View)/FeatureServer/1"
        },
        {
          name: "CA Fire Perimeters (All)",
          description: "California Historic Fire Perimeters (all historical fires) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer/0"
        },
        {
          name: "CA Recent Large Fire Perimeters",
          description: "California Recent Large Fire Perimeters (GT 5000 acres) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer/1"
        },
        {
          name: "CA Fire Perimeters (1950+)",
          description: "California Fire Perimeters (1950+) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer/2"
        },
        {
          name: "CA Land Ownership",
          description: "California Land Ownership (CAL FIRE FRAP) - point-in-polygon queries",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://egis.fire.ca.gov/arcgis/rest/services/FRAP/ownership/FeatureServer/0"
        },
        {
          name: "CA Wildland Fire Direct Protection Areas",
          description: "California Wildland Fire Direct Protection Areas (USFS) - point-in-polygon queries",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/CA_WF_Direct_Protection_Areas_Public/FeatureServer/0"
        },
        {
          name: "CA CalVTP Treatment Areas",
          description: "California CalVTP Treatment Areas (CAL FIRE) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/CalVTP_treatement_areas_public_view/FeatureServer/0"
        },
        {
          name: "CA State Parks Entry Points",
          description: "California State Parks Entry Points - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/ParkEntryPoints/FeatureServer/2"
        },
        {
          name: "CA State Parks Parking Lots",
          description: "California State Parks Parking Lots - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/ParkingPoints/FeatureServer/0"
        },
        {
          name: "CA State Parks Boundaries",
          description: "California State Parks Boundaries - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/ParkBoundaries/FeatureServer/0"
        },
        {
          name: "CA State Parks Campgrounds",
          description: "California State Parks Campgrounds - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/Campgrounds/FeatureServer/0"
        },
        {
          name: "CA Condor Range",
          description: "California Condor Range (CDFW BIOS) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/Uq9r85Potqm3MfRV/arcgis/rest/services/biosds916_fpu/FeatureServer/0"
        },
        {
          name: "CA Black Bear Range",
          description: "California Black Bear Range (CDFW BIOS) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/Uq9r85Potqm3MfRV/arcgis/rest/services/biosds792_fpu/FeatureServer/0"
        },
        {
          name: "CA Brush Rabbit Range",
          description: "California Brush Rabbit Range (CDFW BIOS) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/Uq9r85Potqm3MfRV/arcgis/rest/services/biosds1839_fpu/FeatureServer/0"
        },
        {
          name: "CA Great Gray Owl Range",
          description: "California Great Gray Owl Range (CDFW BIOS) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/Uq9r85Potqm3MfRV/arcgis/rest/services/biosds898_fpu/FeatureServer/0"
        },
        {
          name: "CA Sandhill Crane Range",
          description: "California Sandhill Crane Range (CDFW BIOS) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/Uq9r85Potqm3MfRV/arcgis/rest/services/biosds1459_fpu/FeatureServer/0"
        },
        {
          name: "CA Highway Rest Areas",
          description: "California Highway Rest Areas (Caltrans GIS) - proximity queries up to 50 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/Rest_Areas/FeatureServer/0"
        },
        {
          name: "CA CGS Landslide Zones",
          description: "California Geological Survey (CGS) Landslide Zones - point-in-polygon and proximity queries up to 10 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Landslide_Zones/FeatureServer/0"
        },
        {
          name: "CA CGS Liquefaction Zones",
          description: "California Geological Survey (CGS) Liquefaction Zones - point-in-polygon and proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Liquefaction_Zones/FeatureServer/0"
        },
        {
          name: "CA State Parks Recreational Routes",
          description: "California State Parks Recreational Routes - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/RecreationalRoutes/FeatureServer/0"
        },
        {
          name: "CA Marine Oil Terminals",
          description: "California Marine Oil Terminals - proximity queries up to 50 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/5aaQCuq3e4GRvkFG/arcgis/rest/services/Marine_Oil_Terminals/FeatureServer/0"
        },
        {
          name: "CA Post-Fire Damage Inspections (DINS)",
          description: "CAL FIRE Damage Inspection Program (DINS) database of structures damaged and destroyed by wildland fire since 2013 - proximity queries up to 50 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/POSTFIRE_MASTER_DATA_SHARE/FeatureServer/0"
        },
        {
          name: "CA Medium and Heavy Duty Infrastructure",
          description: "Location of publicly accessible medium- and heavy-duty (MDHD) hydrogen refueling and charging stations - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/MDHD_Dashboard_ArcGIS_Updated_Nov/FeatureServer/0"
        },
        {
          name: "CA Facilities for Wildland Fire Protection",
          description: "California State and Local Facilities for Wildland Fire Protection - proximity queries up to 50 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://egis.fire.ca.gov/arcgis/rest/services/FRAP/Facilities/FeatureServer/0"
        },
        {
          name: "CA Solar Footprints",
          description: "Solar footprint feature class combining existing datasets with imagery interpretation to create footprints of medium to large scale solar facilities - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Solar_Footprints_V2/FeatureServer/0"
        },
        {
          name: "CA Natural Gas Service Areas",
          description: "California Natural Gas Service Areas - point-in-polygon queries",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Natural_Gas_Service_Area/FeatureServer/0"
        },
        {
          name: "CA Public Land Survey Sections",
          description: "California Public Land Survey Sections (PLSS) - point-in-polygon queries to identify Township and Range values",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://gis.conservation.ca.gov/server/rest/services/Base/Base_PLSS/MapServer/1"
        },
        {
          name: "CA Geothermal Wells",
          description: "California Geothermal Wells (WellSTAR) - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://gis.conservation.ca.gov/server/rest/services/WellSTAR/Wells/MapServer/1"
        },
        {
          name: "CA Oil and Gas Wells",
          description: "California Oil and Gas Wells (WellSTAR) - proximity queries up to 25 miles",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://gis.conservation.ca.gov/server/rest/services/WellSTAR/Wells/MapServer/0"
        },
        {
          name: "CA Eco Regions",
          description: "USDA Ecoregion Sections for California - point-in-polygon queries",
          coverage: "California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services8.arcgis.com/JFYbogndXme7ddg8/arcgis/rest/services/USDA_Ecoregion_Sections_07_3__California/FeatureServer/0"
        },
        {
          name: "City of Los Angeles Zoning Polygons",
          description: "City of Los Angeles Zoning Polygons - point-in-polygon and proximity queries up to 1 mile",
          coverage: "Los Angeles, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/12"
        },
        {
          name: "LA County Street Inventory",
          description: "StreetsLA GeoHub Street Inventory - proximity queries up to 5 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/22"
        },
        {
          name: "LA County Points of Interest",
          description: "Los Angeles County Points of Interest including Arts and Recreation, Education, Hospitals, Municipal Services, Physical Features, Public Safety, and Transportation - proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/27"
        },
        {
          name: "LA County Historic Cultural Monuments",
          description: "Los Angeles County Historic Cultural Monuments - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/26"
        },
        {
          name: "LA County Housing with Potential Lead Risk",
          description: "Los Angeles County Housing with Potential Lead Risk - point-in-polygon and proximity queries up to 5 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/25"
        },
        {
          name: "LA County School District Boundaries",
          description: "Los Angeles County School District Boundaries - point-in-polygon queries",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/24"
        },
        {
          name: "LA County MTA Metro Lines",
          description: "Los Angeles County Metropolitan Transportation Authority (MTA) Metro Lines - proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/23"
        },
        {
          name: "LA County Hazards",
          description: "Los Angeles County Hazards including Fire Hazards, Fire Hazard Responsibility Areas, Fire Hazard Severity Zones, Earthquake Hazards, Alquist-Priolo Fault Traces and Zones, USGS Faults, Tsunami Inundation Zones, Landslide Zones, Liquefaction Zones, Flood Hazards, 100-Year and 500-Year Flood Plains, and Dam Inundation Areas - point-in-polygon and proximity queries",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/20"
        },
        {
          name: "LA County Basemaps and Grids",
          description: "Los Angeles County Basemaps and Grids including US National Grid (USNG) at various scales and Township Range Section Rancho Boundaries - point-in-polygon queries",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/21"
        },
        {
          name: "LA County Hydrology",
          description: "Los Angeles County Hydrology data including Lakes, Streams, Watershed Boundaries, and comprehensive Storm Drain Network components (Inlets/Outlets, Maintenance Holes, Basins, Catch Basins, Low Flow Diversions, Pump Stations, Channels, Drains, Laterals, Culverts, Permitted Connections, Force Mains, Natural Drainage) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/19"
        },
        {
          name: "LA County Infrastructure",
          description: "Los Angeles County Infrastructure including County Facilities, County-owned Buildings, County-owned Parcels, Government-owned Parcels, and Schools - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/18"
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
          name: "LA County Administrative Boundaries",
          description: "Los Angeles County Administrative Boundaries including ISD Facilities Operations Service Maintenance Districts, School District Boundaries, Park Planning Areas, DCFS Office Boundaries, Health Districts, Service Planning Areas, Disaster Management Areas, Zipcodes, Regional Centers, Public Safety, Reporting Districts, Station Boundaries, Fire Station Boundaries, PSAP Boundaries, Library, Planning Areas, Service Areas, State Enterprise Zones, and Animal Care and Control Service Areas - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/17"
        },
        {
          name: "LA County Elevation",
          description: "Los Angeles County Elevation data including Contours at various scales (LARIAC Contours 1000FT, 250FT, 50FT, 10FT, 2FT, 1FT), Elevation Points, Elevation Data (Raster), LARIAC Hillshade, Digital Elevation Model (DEM), and Digital Surface Model (DSM) - proximity queries for queryable layers, raster visualization for raster layers",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/16"
        },
        {
          name: "LA County Demographics",
          description: "Los Angeles County Demographics including Census data from 1990, 2000, 2010, and 2020, as well as 2018 Estimates - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/15"
        },
        {
          name: "LA County LMS Data",
          description: "Los Angeles County Location Management System (LMS) Data - comprehensive dataset of 193 layers covering various points of interest, facilities, and infrastructure - proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer"
        },
        {
          name: "LA County Political Boundaries",
          description: "Los Angeles County Political Boundaries including Districts (2021, 2011, 2001, 1971-1991), Supervisorial Districts, Congressional Districts, State Assembly Districts, State Senate Districts, Board of Equalization, LA City Council Districts, School Districts, Registrar Recorder Precincts, Election Precincts, City and County Boundaries, Community Boundaries, and City Annexations - point-in-polygon queries",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/13"
        },
        {
          name: "LA County Redistricting Data (2011)",
          description: "Los Angeles County Redistricting Data from 2011 including Redistricting Geography, Communities, Home and Income Information, Housing Data, Income Data, Population Density, Voter Registration Data, Citizen Voting Age Population, Demographic Data, and Language data - point-in-polygon and proximity queries up to 5 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/12"
        },
        {
          name: "LA County Transportation",
          description: "Los Angeles County Transportation data including Transportation, Milepost Markers, Rail Transportation, Freeways, Disaster Routes, Highway Shields, Metro Park and Ride, Metro Stations, Metrolink Stations, Metrolink Lines, Metro Lines, and Railroads - proximity queries up to 25 miles",
          coverage: "Los Angeles County, California",
          accuracy: "Very High",
          cost: "Free",
          url: "https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/LMS_Data_Public_2014/MapServer/11"
        }
      ]
    },
    {
      category: "Illinois Sources",
      sources: [
        {
          name: "Chicago 311 Service Requests",
          description: "311 service requests from the City of Chicago Data Portal - proximity queries up to 1 mile, color-coded by request type",
          coverage: "City of Chicago, Illinois",
          accuracy: "Very High",
          cost: "Free",
          url: "https://data.cityofchicago.org/api/v3/views/v6vf-nfxy"
        },
        {
          name: "Lake County Building Footprints",
          description: "Building footprints from Lake County Planimetrics - point-in-polygon and proximity queries from 0.25 to 1 mile",
          coverage: "Lake County, Illinois",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/HESxeTbDliKKvec2/arcgis/rest/services/LakeCounty_Planimetrics/FeatureServer/1"
        },
        {
          name: "Lake County Pavement Boundaries",
          description: "Pavement boundaries (roads, parking) traced from aerial photography (March-April 2018) - point-in-polygon and proximity queries from 0.25 to 1 mile",
          coverage: "Lake County, Illinois",
          accuracy: "National Map Accuracy Standards for 1:1200 product",
          cost: "Free",
          url: "https://services3.arcgis.com/HESxeTbDliKKvec2/arcgis/rest/services/LakeCounty_Planimetrics/FeatureServer/0"
        },
        {
          name: "Lake County Parcel Points",
          description: "Tax parcel point locations - proximity queries from 0.25 to 1 mile",
          coverage: "Lake County, Illinois",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/HESxeTbDliKKvec2/arcgis/rest/services/OpenData_ParcelPolygons/FeatureServer/1"
        },
        {
          name: "Lake County Parcels",
          description: "Tax parcel polygons - point-in-polygon and proximity queries from 0.25 to 1 mile",
          coverage: "Lake County, Illinois",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/HESxeTbDliKKvec2/arcgis/rest/services/OpenData_ParcelPolygons/FeatureServer/0"
        },
        {
          name: "Lake County Facility Site Polygons",
          description: "Facility site polygons (parks, libraries, community centers, museums, etc.) - point-in-polygon and proximity queries from 0.25 to 5 miles",
          coverage: "Lake County, Illinois",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/HESxeTbDliKKvec2/arcgis/rest/services/LakeCounty_Landmarks/FeatureServer/1"
        },
        {
          name: "Lake County High School Districts",
          description: "High school district boundaries - point-in-polygon and proximity queries from 0.25 to 25 miles",
          coverage: "Lake County, Illinois",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services3.arcgis.com/HESxeTbDliKKvec2/arcgis/rest/services/LakeCounty_TaxDistricts/FeatureServer/6"
        },
      ]
    },
    {
      category: "National Weather Service Watches and Warnings",
      sources: [
        {
          name: "NWS Public Forecast Zones",
          description: "Public forecast zones - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/1"
        },
        {
          name: "NWS Fire Forecast Zones",
          description: "Fire forecast zones - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/2"
        },
        {
          name: "NWS US Counties",
          description: "US counties - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/3"
        },
        {
          name: "NWS US States and Territories",
          description: "US states and territories - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/4"
        },
        {
          name: "NWS Coastal and Offshore Marine Zones",
          description: "Coastal and offshore marine zones - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/5"
        },
        {
          name: "NWS Events Ordered by Size and Severity",
          description: "Events ordered by size and severity - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/6"
        },
        {
          name: "NWS Extreme Events",
          description: "Extreme weather events - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/8"
        },
        {
          name: "NWS Severe Events",
          description: "Severe weather events - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/9"
        },
        {
          name: "NWS Moderate Events",
          description: "Moderate weather events - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/10"
        },
        {
          name: "NWS Minor Events",
          description: "Minor weather events - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/11"
        },
        {
          name: "NWS Other Events",
          description: "Other weather events - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/12"
        },
        {
          name: "NWS Current Drought Conditions",
          description: "Current drought intensity conditions - point-in-polygon queries only",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/US_Drought_Intensity_v1/FeatureServer/3"
        },
        {
          name: "NWS Hurricane Forecast Position",
          description: "Hurricane forecast positions - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Active_Hurricanes_v1/FeatureServer/0"
        },
        {
          name: "NWS Hurricane Observed Position",
          description: "Hurricane observed positions - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Active_Hurricanes_v1/FeatureServer/1"
        },
        {
          name: "NWS Hurricane Forecast Track",
          description: "Hurricane forecast tracks - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Active_Hurricanes_v1/FeatureServer/2"
        },
        {
          name: "NWS Hurricane Observed Track",
          description: "Hurricane observed tracks - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Active_Hurricanes_v1/FeatureServer/3"
        },
        {
          name: "NWS Hurricane Forecast Error Cone",
          description: "Hurricane forecast error cone and danger area - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Active_Hurricanes_v1/FeatureServer/4"
        },
        {
          name: "NWS Hurricane Watches and Warnings",
          description: "Hurricane watches and warnings - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Active_Hurricanes_v1/FeatureServer/5"
        },
        {
          name: "NWS Tropical Storm Force (34kts)",
          description: "Tropical storm force wind areas (34kts) - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Active_Hurricanes_v1/FeatureServer/7"
        },
        {
          name: "NWS Strong Tropical Storm (50kts)",
          description: "Strong tropical storm wind areas (50kts) - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Active_Hurricanes_v1/FeatureServer/8"
        },
        {
          name: "NWS Hurricane Force (64kts+)",
          description: "Hurricane force wind areas (64kts+) - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Active_Hurricanes_v1/FeatureServer/9"
        },
        {
          name: "NWS Hurricane Raw Data",
          description: "Raw 1/10th degree hurricane data - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Active_Hurricanes_v1/FeatureServer/10"
        },
        {
          name: "NWS Hurricane Observed Wind Swath",
          description: "Hurricane observed wind swath - point-in-polygon and proximity queries from 0.25 to 100 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Active_Hurricanes_v1/FeatureServer/11"
        },
        {
          name: "NWS NDFD Wind Forecast - National",
          description: "NDFD Wind Forecast at National Level - proximity queries from 0.25 to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NDFD_WindForecast_v1/FeatureServer/0"
        },
        {
          name: "NWS NDFD Wind Forecast - Regional",
          description: "NDFD Wind Forecast at Regional Level - proximity queries from 0.25 to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NDFD_WindForecast_v1/FeatureServer/1"
        },
        {
          name: "NWS NDFD Wind Forecast - State",
          description: "NDFD Wind Forecast at State Level - proximity queries from 0.25 to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NDFD_WindForecast_v1/FeatureServer/2"
        },
        {
          name: "NWS NDFD Wind Forecast - County",
          description: "NDFD Wind Forecast at County Level - proximity queries from 0.25 to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NDFD_WindForecast_v1/FeatureServer/3"
        },
        {
          name: "NWS NDFD Wind Forecast - District",
          description: "NDFD Wind Forecast at District Level - proximity queries from 0.25 to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NDFD_WindForecast_v1/FeatureServer/4"
        },
        {
          name: "NWS NDFD Wind Forecast - Block Group",
          description: "NDFD Wind Forecast at Block Group Level - proximity queries from 0.25 to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NDFD_WindForecast_v1/FeatureServer/5"
        },
        {
          name: "NWS NDFD Wind Forecast - City",
          description: "NDFD Wind Forecast at City Level - proximity queries from 0.25 to 25 miles",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NDFD_WindForecast_v1/FeatureServer/6"
        },
        {
          name: "Chicago Building Centroids",
          description: "Building centroids from the City of Chicago Data Portal - proximity queries from 0.25 to 1 mile",
          coverage: "City of Chicago, Illinois",
          accuracy: "Very High",
          cost: "Free",
          url: "https://data.cityofchicago.org/api/v3/views/syp8-uezg"
        },
        {
          name: "Chicago Traffic Crashes",
          description: "Traffic crashes from the City of Chicago Data Portal - proximity queries from 0.25 to 1 mile with optional year filtering",
          coverage: "City of Chicago, Illinois",
          accuracy: "Very High",
          cost: "Free",
          url: "https://data.cityofchicago.org/api/v3/views/85ca-t3if"
        },
        {
          name: "Chicago Speed Camera Locations",
          description: "Speed camera locations from the City of Chicago Data Portal - proximity queries up to 5 miles",
          coverage: "City of Chicago, Illinois",
          accuracy: "Very High",
          cost: "Free",
          url: "https://data.cityofchicago.org/api/v3/views/4i42-qv3h"
        },
        {
          name: "Chicago Red Light Camera Locations",
          description: "Red light camera locations from the City of Chicago Data Portal - proximity queries up to 5 miles",
          coverage: "City of Chicago, Illinois",
          accuracy: "Very High",
          cost: "Free",
          url: "https://data.cityofchicago.org/api/v3/views/thvf-6diy"
        }
      ]
    },
    {
      category: "New York Sources",
      sources: [
        {
          name: "NYC PLUTO",
          description: "NYC parcel-level precision geocoding for New York City addresses",
          coverage: "New York City, New York",
          accuracy: "Very High",
          cost: "Free",
          url: "https://www1.nyc.gov/site/planning/data-maps/open-data/dwn-pluto-mappluto.page"
        },
        {
          name: "NYC MapPLUTO Tax Lots",
          description: "Tax lots from NYC MapPLUTO - point-in-polygon and proximity queries up to 1 mile",
          coverage: "New York City, New York",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer/0"
        },
        {
          name: "NYC Bike Routes",
          description: "Bike routes network from NYC Department of Transportation - proximity queries (0.5, 1.0, 2.5, and 5 miles)",
          coverage: "New York City, New York",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/ArcGIS/rest/services/Bike_Routes/FeatureServer/0"
        },
        {
          name: "NYC Neighborhoods",
          description: "Neighborhood Tabulation Areas 2020 from NYC Department of City Planning - point-in-polygon and proximity queries up to 1 mile",
          coverage: "New York City, New York",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/ArcGIS/rest/services/NYC_Neighborhood_Tabulation_Areas_2020/FeatureServer/0"
        },
        {
          name: "NYC Zoning Districts",
          description: "Zoning districts from NYC Department of City Planning - point-in-polygon and proximity queries up to 1 mile",
          coverage: "New York City, New York",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/ArcGIS/rest/services/ZoningDistricts/FeatureServer/0"
        },
        {
          name: "NYC Waterfront Access - HPB Launch Site",
          description: "HPB Launch Site points from NYC Department of City Planning - proximity queries up to 5 miles",
          coverage: "New York City, New York",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/ArcGIS/rest/services/WaterfrontAccessMap_520/FeatureServer/0"
        },
        {
          name: "NYC Waterfront Access - Waterfront Parks",
          description: "Waterfront Parks polygons from NYC Department of City Planning - point-in-polygon and proximity queries up to 5 miles",
          coverage: "New York City, New York",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/ArcGIS/rest/services/WaterfrontAccessMap_520/FeatureServer/1"
        },
        {
          name: "NYC Waterfront Access - PAWS Publicly Accessible Waterfront Spaces",
          description: "PAWS Publicly Accessible Waterfront Spaces polygons from NYC Department of City Planning - point-in-polygon and proximity queries up to 5 miles",
          coverage: "New York City, New York",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/ArcGIS/rest/services/WaterfrontAccessMap_520/FeatureServer/2"
        },
        {
          name: "NYC Business Improvement Districts",
          description: "Business Improvement Districts from NYC Department of Small Business Services - point-in-polygon and proximity queries up to 5 miles",
          coverage: "New York City, New York",
          accuracy: "Very High",
          cost: "Free",
          url: "https://data.cityofnewyork.us/api/v3/views/7jdm-inj8/query.json"
        },
        {
          name: "NYC Community Districts",
          description: "Community Districts from NYC Department of City Planning - point-in-polygon and proximity queries up to 5 miles",
          coverage: "New York City, New York",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/NYC_Community_Districts_Water_Included/FeatureServer/0"
        }
      ]
    },
    {
      category: "Texas Sources",
      sources: [
        {
          name: "HoustonCO Neighborhoods",
          description: "HoustonCO Neighborhoods from City of Houston - point-in-polygon and proximity queries up to 10 miles",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/ArcGIS/rest/services/CoHoustonNeighborhoods/FeatureServer/0"
        },
        {
          name: "Houston Neighborhoods",
          description: "Houston Neighborhoods 2021 from City of Houston - point-in-polygon and proximity queries up to 10 miles",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/ArcGIS/rest/services/Neighborhood_2021/FeatureServer/0"
        },
        {
          name: "Houston Site Addresses",
          description: "Houston Site Addresses from City of Houston - proximity queries up to 1 mile (0.25, 0.50, 0.75, 1.0 miles)",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_SiteAddresses/FeatureServer/3"
        },
        {
          name: "Houston Roads Centerline",
          description: "Houston Roads Centerline from City of Houston - proximity queries up to 1 mile (0.25, 0.50, 0.75, 1.0 miles)",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_RoadCenterline/FeatureServer/8"
        },
        {
          name: "Houston OLC Grids",
          description: "Houston OLC (Open Location Code) Grids from City of Houston - 6-digit and 8-digit grid cells for point-in-polygon and proximity queries up to 5 miles",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_OLC_GRIDS/FeatureServer/0"
        },
        {
          name: "Houston Fire Stations",
          description: "Houston Fire Department (HFD) Fire Stations from City of Houston - proximity queries up to 25 miles",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/ArcGIS/rest/services/HFD_FireStations_AOI_SZ/FeatureServer/15"
        },
        {
          name: "Houston Fire Hydrants",
          description: "Houston Fire Hydrants from City of Houston - proximity queries up to 1 mile",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_Houston_Fire_Hydrant_view/FeatureServer/9"
        },
        {
          name: "Houston Tax Incentive Reinvestment Zones",
          description: "Houston Tax Incentive Reinvestment Zones (TIRZ) from City of Houston - point-in-polygon and proximity queries",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_Tax_Incentive_Reinvestment_Zones_view/FeatureServer/5"
        },
        {
          name: "Houston Affordability (by Census Tract)",
          description: "Houston Affordability by Census Tract (HTA Index) from City of Houston - point-in-polygon and proximity queries up to 5 miles. Housing and Transportation Affordability Index by census tract.",
          coverage: "Houston, Texas",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/ArcGIS/rest/services/Affordability/FeatureServer"
        },
        {
          name: "Houston Metro Bus Routes",
          description: "Houston METRO Bus Routes from City of Houston - proximity queries up to 25 miles",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_METRO_Bus_Routes_view/FeatureServer/29"
        },
        {
          name: "Houston Metro Park and Ride",
          description: "Houston METRO Park and Ride locations from City of Houston - proximity queries up to 25 miles",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_METRO_Park_and_Ride_Locations_view/FeatureServer/9"
        },
        {
          name: "Houston Metro Transit Centers",
          description: "Houston METRO Transit Centers from City of Houston - proximity queries up to 25 miles",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_Metro_Transit_Centers_view/FeatureServer/7"
        },
        {
          name: "Houston Metro Rail Stations",
          description: "Houston METRO Rail Stations (current) from City of Houston - proximity queries up to 25 miles",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_Metro_Rail_Stations_(current)_view/FeatureServer/13"
        },
        {
          name: "Houston Bikeways",
          description: "Houston Bikeways (Existing) from City of Houston - proximity queries up to 25 miles",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_Bikeways_Existing_LC_view/FeatureServer/28"
        },
        {
          name: "Houston Airports",
          description: "Houston Airports from City of Houston - point-in-polygon and proximity queries up to 50 miles",
          coverage: "Houston, Texas",
          accuracy: "High",
          cost: "Free",
          url: "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/COH_Airports_view/FeatureServer/18"
        }
      ]
    },
    {
      category: "New Hampshire Sources",
      sources: [
        {
          name: "NH SSURGO Soils",
          description: "Soil Survey Geographic (SSURGO) database for New Hampshire - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/GG_SSURGO_Soils/FeatureServer/0"
        },
        {
          name: "NH Bedrock Geology - Formations",
          description: "New Hampshire bedrock geology formations - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/GG_BedrockGeology/FeatureServer/1"
        },
        {
          name: "NH Geographic Names Information System (Places of Interest)",
          description: "New Hampshire geographic names and places of interest - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/GV_BaseLayers/FeatureServer/0"
        },
        {
          name: "NH House of Representatives Districts",
          description: "New Hampshire House of Representatives district boundaries for 2022 - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/APB_ElectoralDistricts/FeatureServer/8"
        },
        {
          name: "NH Voting Wards",
          description: "New Hampshire political districts and voting wards - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/APB_ElectoralDistricts/FeatureServer/5"
        },
        {
          name: "NH Senate Districts",
          description: "New Hampshire Senate district boundaries for 2022 - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/APB_ElectoralDistricts/FeatureServer/10"
        },
        {
          name: "NH Parcels",
          description: "New Hampshire parcel mosaics with proximity queries (0.25, 0.50, 0.75, 1.0 miles) - identifies containing parcel and nearby parcels",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CAD_ParcelMosaic/FeatureServer/1"
        },
        {
          name: "NH Key Destinations",
          description: "New Hampshire key destination points - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_OpenData_MiscVectorData/FeatureServer/3"
        },
        {
          name: "NH Nursing Homes",
          description: "New Hampshire nursing homes and long-term care facilities - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_HSIP_ServiceFacilities/FeatureServer/5"
        },
        {
          name: "NH Emergency Medical Services",
          description: "New Hampshire EMS facilities and emergency medical services - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_HSIP_ServiceFacilities/FeatureServer/1"
        },
        {
          name: "NH Fire Stations",
          description: "New Hampshire fire stations and fire department facilities - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_HSIP_ServiceFacilities/FeatureServer/2"
        },
        {
          name: "NH Places of Worship",
          description: "New Hampshire places of worship including churches, synagogues, mosques, and other religious facilities - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_HSIP_ServiceFacilities/FeatureServer/6"
        },
        {
          name: "NH Hospitals",
          description: "New Hampshire hospitals and medical facilities - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_HSIP_ServiceFacilities/FeatureServer/3"
        },
        {
          name: "NH Access Sites to Public Waters",
          description: "New Hampshire public access sites to lakes, rivers, and other water bodies - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_RecreationResources/FeatureServer/0"
        },
        {
          name: "NH Law Enforcement",
          description: "New Hampshire police departments, sheriff offices, and law enforcement facilities - proximity queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_HSIP_ServiceFacilities/FeatureServer/4"
        },
        {
          name: "NH Recreation Trails",
          description: "New Hampshire recreation trails and hiking paths - line dataset with proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/CSD_RecreationResources/FeatureServer/2"
        },
        {
          name: "NH DOT Roads",
          description: "New Hampshire Department of Transportation road network - line dataset with proximity queries (0.5, 1, 2.5, 5, 10 miles)",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/GV_BaseLayers/FeatureServer/18"
        },
        {
          name: "NH Railroads",
          description: "New Hampshire railroad network including active and abandoned lines - line dataset with proximity queries (0.5, 1, 2.5, 5, 10 miles)",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/GV_BaseLayers/FeatureServer/11"
        },
        {
          name: "NH Transmission/Pipelines",
          description: "New Hampshire transmission lines and pipelines - line dataset with proximity queries (0.5, 1, 2.5, 5, 10 miles)",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/GV_BaseLayers/FeatureServer/17"
        },
        {
          name: "NH Personal Wireless Service Facilities",
          description: "New Hampshire cell towers and wireless communication facilities - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/GV_BaseLayers/FeatureServer/1"
        },
        {
          name: "NH Stone Walls",
          description: "New Hampshire stone walls - line dataset with proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services9.arcgis.com/wnvDDrXX8EouLkZP/arcgis/rest/services/NH_Stone_Wall_Layer_Public_View/FeatureServer/0"
        },
        {
          name: "NH Underground Storage Tank Sites",
          description: "New Hampshire underground storage tank sites from the Department of Environmental Services - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Public/MapServer/13"
        },
        {
          name: "NH Water Well Inventory",
          description: "New Hampshire water well inventory from the Department of Environmental Services - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Secure/MapServer/6"
        },
        {
          name: "NH Public Water Supply Wells",
          description: "New Hampshire public water supply wells from the Department of Environmental Services - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Secure/MapServer/2"
        },
        {
          name: "NH Remediation Sites",
          description: "New Hampshire remediation sites from the Department of Environmental Services - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Public/MapServer/11"
        },
        {
          name: "NH Automobile Salvage Yards",
          description: "New Hampshire automobile salvage yards from the Department of Environmental Services - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Public/MapServer/3"
        },
        {
          name: "NH Solid Waste Facilities",
          description: "New Hampshire solid waste facilities from the Department of Environmental Services - proximity queries up to 25 miles",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Public/MapServer/12"
        },
        {
          name: "NH Source Water Protection Areas",
          description: "New Hampshire source water protection areas from the Department of Environmental Services - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://gis.des.nh.gov/server/rest/services/Core_GIS_Datasets/DES_Data_Secure/MapServer/4"
        },
        {
          name: "NH National Wetland Inventory (NWI) Plus",
          description: "New Hampshire National Wetland Inventory Plus from the Department of Environmental Services - point-in-polygon queries",
          coverage: "New Hampshire",
          accuracy: "Very High",
          cost: "Free",
          url: "https://nhgeodata.unh.edu/hosting/rest/services/Hosted/GG_NWI_Plus/FeatureServer/0"
        }
      ]
    },
    {
      category: "New Jersey Sources",
      sources: [
        {
          name: "NJ Tax Parcels",
          description: "New Jersey Tax Parcels from NJGIN - point-in-polygon and proximity queries (0.25, 0.50, 0.75, 1.0 miles)",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_Composite_NJ_WM/FeatureServer/0"
        },
        {
          name: "NJ Address Points",
          description: "New Jersey Address Points from NJGIN - comprehensive statewide NG9-1-1 database meeting NENA 2018 NG9-1-1 GIS Data Standard - proximity queries up to 5 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/ArcGIS/rest/services/AddressPoints/FeatureServer/3"
        },
        {
          name: "NJ Bus Stops",
          description: "New Jersey Transit Bus Stops from NJGIN - single point bus stops for NJ Transit routes - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services6.arcgis.com/M0t0HPE53pFK525U/arcgis/rest/services/Single_Point_Bus_Stops_of_NJ_Transit/FeatureServer/0"
        },
        {
          name: "NJ Safety Service Patrol",
          description: "New Jersey Department of Transportation Safety Service Patrol routes from NJGIN - highway patrol coverage areas - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services.arcgis.com/HggmsDF7UJsNN1FK/arcgis/rest/services/Safety_Service_Patrol/FeatureServer/0"
        },
        {
          name: "NJ Service Areas",
          description: "New Jersey Service Areas from NJGIN - highway service areas and rest stops - proximity queries up to 50 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services.arcgis.com/HggmsDF7UJsNN1FK/arcgis/rest/services/NJServiceArea/FeatureServer/0"
        },
        {
          name: "NJ Roadway Network",
          description: "New Jersey Department of Transportation Roadway Network from NJGIN - comprehensive road network including highways, routes, and ramps - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services.arcgis.com/HggmsDF7UJsNN1FK/arcgis/rest/services/NJDOT_Roadway_Network/FeatureServer/0"
        },
        {
          name: "NJ Known Contaminated Sites",
          description: "New Jersey Department of Environmental Protection (NJDEP) Known Contaminated Sites from Environmental NJEMS - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free",
          url: "https://mapsdep.nj.gov/arcgis/rest/services/Features/Environmental_NJEMS/MapServer/0"
        },
        {
          name: "NJ Alternative Fueled Vehicle Fueling Stations",
          description: "New Jersey Department of Environmental Protection (NJDEP) Alternative Fueled Vehicle Fueling Stations from Structures MapServer - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free",
          url: "https://mapsdep.nj.gov/arcgis/rest/services/Features/Structures/MapServer/1"
        },
        {
          name: "NJ Power Plants",
          description: "New Jersey Department of Environmental Protection (NJDEP) Power Plants from Utilities MapServer - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free",
          url: "https://mapsdep.nj.gov/arcgis/rest/services/Features/Utilities/MapServer/20"
        },
        {
          name: "NJ Public Solar Facilities",
          description: "New Jersey Department of Environmental Protection (NJDEP) Solar PV at Public Facilities from Utilities MapServer - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free",
          url: "https://mapsdep.nj.gov/arcgis/rest/services/Features/Utilities/MapServer/17"
        },
        {
          name: "NJ Public Places to Keep Cool",
          description: "New Jersey Department of Environmental Protection (NJDEP) Public Places to Keep Cool from FeatureServer - proximity queries up to 25 miles",
          coverage: "New Jersey",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/QWdNfRs7lkPq4g4Q/arcgis/rest/services/Public_Places_to_Keep_Cool_in_New_Jersey/FeatureServer/0"
        }
      ]
    },
    {
      category: "Delaware Sources",
      sources: [
        {
          name: "DE State Forest",
          description: "Delaware State Forest lands managed by the Delaware Forest Service - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Biota/DE_Forestry/FeatureServer/0"
        },
        {
          name: "DE Pine Plantations",
          description: "Locations of Pine Plantations in Delaware - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Biota/DE_Forestry/FeatureServer/1"
        },
        {
          name: "DE Urban Tree Canopy Estimates",
          description: "Urban Tree Canopy calculations for Delaware municipalities, communities, and parks - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Biota/DE_Forestry/FeatureServer/2"
        },
        {
          name: "DE Forest Cover 2007",
          description: "2007 Aerial imagery based forest cover for Delaware - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Biota/DE_Forestry/FeatureServer/3"
        },
        {
          name: "DE No Build Points - Bay",
          description: "No Build Points along Delaware Bay coast - proximity queries up to 25 miles",
          coverage: "Delaware Bay Coast",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/0"
        },
        {
          name: "DE No Build Line - Bay",
          description: "No Build Line along Delaware Bay coast - proximity queries up to 25 miles",
          coverage: "Delaware Bay Coast",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/1"
        },
        {
          name: "DE No Build Points - Ocean",
          description: "No Build Points along Delaware Ocean coast - proximity queries up to 25 miles",
          coverage: "Delaware Ocean Coast",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/2"
        },
        {
          name: "DE No Build Line - Ocean",
          description: "No Build Line along Delaware Ocean coast - proximity queries up to 25 miles",
          coverage: "Delaware Ocean Coast",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/3"
        },
        {
          name: "DE Park Facilities",
          description: "Outdoor recreational facilities throughout Delaware - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/4"
        },
        {
          name: "DE Natural Areas",
          description: "Natural Areas Inventory boundaries for voluntary land protection - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/5"
        },
        {
          name: "DE Outdoor Recreation, Parks and Trails Program Lands",
          description: "Lands where Delaware Outdoor Recreation, Parks and Trails Program monies have been invested - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/6"
        },
        {
          name: "DE Land and Water Conservation Fund",
          description: "Lands protected under the Land and Water Conservation Fund - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/7"
        },
        {
          name: "DE Nature Preserves",
          description: "Lands preserved under the Delaware Nature Preserves Program - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/8"
        },
        {
          name: "DE Outdoor Recreation Areas",
          description: "Outdoor Recreation Inventory (ORI) - publicly and privately owned protected lands - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/9"
        },
        {
          name: "DE Outdoor Recreation, Parks and Trails Program Open Space",
          description: "Land protected in perpetuity under the Outdoor Recreation, Parks and Trails Program - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/10"
        },
        {
          name: "DE Public Protected Lands",
          description: "Lands that are publicly owned and open to public access - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/11"
        },
        {
          name: "DE Conservation Easements",
          description: "Conservation Easements held by Delaware State Parks and other agencies/NGOs - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/12"
        },
        {
          name: "DE Trails and Pathways",
          description: "Recreational trails and pathways throughout Delaware - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/13"
        },
        {
          name: "DE Seasonal Restricted Areas",
          description: "Portions of Delaware State Parks closed to public access during different seasons - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/14"
        },
        {
          name: "DE Permanent Restricted Areas",
          description: "Portions of Delaware State Parks closed to public access all year long - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/15"
        },
        {
          name: "DE Wildlife Area Boundaries",
          description: "Wildlife Area locations within the State of Delaware - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Environmental/DE_Protected_Natural_Resources/FeatureServer/17"
        },
        {
          name: "DE State Parcels",
          description: "Delaware state parcels with ownership information - point-in-polygon and proximity queries up to 1 mile",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/PlanningCadastre/DE_StateParcels/FeatureServer/0"
        },
        {
          name: "DE Land Use Land Cover 2007",
          description: "2007 Land Use Land Cover for Delaware based on Delaware Modified Anderson System - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/PlanningCadastre/DE_LULC/FeatureServer/0"
        },
        {
          name: "DE Land Use Land Cover 2007 (Revised)",
          description: "Revised 2007 Land Use Land Cover for Delaware - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/PlanningCadastre/DE_LULC/FeatureServer/1"
        },
        {
          name: "DE Land Use Land Cover 2012",
          description: "2012 Land Use Land Cover for Delaware - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/PlanningCadastre/DE_LULC/FeatureServer/2"
        },
        {
          name: "DE Land Use Land Cover 2017",
          description: "2017 Land Use Land Cover for Delaware - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/PlanningCadastre/DE_LULC/FeatureServer/3"
        },
        {
          name: "DE Land Use Land Cover 2022",
          description: "2022 Land Use Land Cover for Delaware - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/PlanningCadastre/DE_LULC/FeatureServer/4"
        },
        {
          name: "DE Child Care Centers",
          description: "Delaware Child Care Centers - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_ChildCareCenters/FeatureServer/0"
        },
        {
          name: "DE Fishing Access",
          description: "Delaware Fishing Access locations (boat docks, ramps, piers, shoreline fishing) - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Fishing_Access/FeatureServer/0"
        },
        {
          name: "DE Trout Streams",
          description: "Delaware Trout Streams in New Castle County - proximity queries up to 25 miles",
          coverage: "New Castle County, Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Fishing_Access/FeatureServer/1"
        },
        {
          name: "DE Public Schools",
          description: "Delaware Public Schools - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Schools/FeatureServer/0"
        },
        {
          name: "DE Private Schools",
          description: "Delaware Private Schools - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Schools/FeatureServer/1"
        },
        {
          name: "DE VoTech School Districts",
          description: "Delaware VoTech School Districts - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Schools/FeatureServer/2"
        },
        {
          name: "DE School Districts",
          description: "Delaware Public School Districts - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Schools/FeatureServer/3"
        },
        {
          name: "DE Wildlife Areas Stands Blinds and Fields",
          description: "Wildlife Area Stands, Blinds, and Fields - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Wildlife/FeatureServer/0"
        },
        {
          name: "DE Wildlife Areas Boat Ramps",
          description: "Wildlife Area Boat Ramps - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Wildlife/FeatureServer/1"
        },
        {
          name: "DE Wildlife Areas Facilities",
          description: "Wildlife Area Facilities - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Wildlife/FeatureServer/2"
        },
        {
          name: "DE Wildlife Areas Parking",
          description: "Wildlife Area Parking - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Wildlife/FeatureServer/3"
        },
        {
          name: "DE Wildlife Areas Restrooms",
          description: "Wildlife Area Restrooms - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Wildlife/FeatureServer/4"
        },
        {
          name: "DE Wildlife Areas Safety Zones",
          description: "Wildlife Area Safety Zones - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Wildlife/FeatureServer/5"
        },
        {
          name: "DE Wildlife Management Zones",
          description: "Wildlife Management Zones for deer harvesting - point-in-polygon queries",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Society/DE_Wildlife/FeatureServer/6"
        },
        {
          name: "DE Rail Lines",
          description: "Delaware Rail Lines - proximity queries up to 25 miles",
          coverage: "Delaware",
          accuracy: "Very High",
          cost: "Free",
          url: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/Transportation/DE_Multimodal/FeatureServer/18"
        }
      ]
    },
    {
      category: "Alabama Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Alabama will be added in future updates",
          coverage: "Alabama",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Alaska Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Alaska will be added in future updates",
          coverage: "Alaska",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Arizona Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Arizona will be added in future updates",
          coverage: "Arizona",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Arkansas Sources",
      sources: [
        {
          name: "Open Data Sources Coming Soon!",
          description: "We're working on adding data layers for this state. Check back soon for updates!",
          coverage: "Arkansas",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Colorado Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Colorado will be added in future updates",
          coverage: "Colorado",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Florida Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Florida will be added in future updates",
          coverage: "Florida",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Georgia Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Georgia will be added in future updates",
          coverage: "Georgia",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Hawaii Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Hawaii will be added in future updates",
          coverage: "Hawaii",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Idaho Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Idaho will be added in future updates",
          coverage: "Idaho",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Indiana Sources",
      sources: [
        {
          name: "Open Data Sources Coming Soon!",
          description: "We're working on adding data layers for this state. Check back soon for updates!",
          coverage: "Indiana",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Iowa Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Iowa will be added in future updates",
          coverage: "Iowa",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Kansas Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Kansas will be added in future updates",
          coverage: "Kansas",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Kentucky Sources",
      sources: [
        {
          name: "Open Data Sources Coming Soon!",
          description: "We're working on adding data layers for this state. Check back soon for updates!",
          coverage: "Kentucky",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Louisiana Sources",
      sources: [
        {
          name: "Open Data Sources Coming Soon!",
          description: "We're working on adding data layers for this state. Check back soon for updates!",
          coverage: "Louisiana",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Maine Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Maine will be added in future updates",
          coverage: "Maine",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Maryland Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Maryland will be added in future updates",
          coverage: "Maryland",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Michigan Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Michigan will be added in future updates",
          coverage: "Michigan",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Minnesota Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Minnesota will be added in future updates",
          coverage: "Minnesota",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Mississippi Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Mississippi will be added in future updates",
          coverage: "Mississippi",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Missouri Sources",
      sources: [
        {
          name: "Open Data Sources Coming Soon!",
          description: "We're working on adding data layers for this state. Check back soon for updates!",
          coverage: "Missouri",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Montana Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Montana will be added in future updates",
          coverage: "Montana",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Nebraska Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Nebraska will be added in future updates",
          coverage: "Nebraska",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Nevada Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Nevada will be added in future updates",
          coverage: "Nevada",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "North Carolina Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for North Carolina will be added in future updates",
          coverage: "North Carolina",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "North Dakota Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for North Dakota will be added in future updates",
          coverage: "North Dakota",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Ohio Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Ohio will be added in future updates",
          coverage: "Ohio",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Oklahoma Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Oklahoma will be added in future updates",
          coverage: "Oklahoma",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Oregon Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Oregon will be added in future updates",
          coverage: "Oregon",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Pennsylvania Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Pennsylvania will be added in future updates",
          coverage: "Pennsylvania",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Rhode Island Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Rhode Island will be added in future updates",
          coverage: "Rhode Island",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "South Carolina Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for South Carolina will be added in future updates",
          coverage: "South Carolina",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "South Dakota Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for South Dakota will be added in future updates",
          coverage: "South Dakota",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Tennessee Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Tennessee will be added in future updates",
          coverage: "Tennessee",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Utah Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Utah will be added in future updates",
          coverage: "Utah",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Vermont Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Vermont will be added in future updates",
          coverage: "Vermont",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Virginia Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Virginia will be added in future updates",
          coverage: "Virginia",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Washington Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Washington will be added in future updates",
          coverage: "Washington",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "West Virginia Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for West Virginia will be added in future updates",
          coverage: "West Virginia",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Wisconsin Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Wisconsin will be added in future updates",
          coverage: "Wisconsin",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "Wyoming Sources",
      sources: [
        {
          name: "Sources Coming Soon...",
          description: "State-specific data sources for Wyoming will be added in future updates",
          coverage: "Wyoming",
          accuracy: "N/A",
          cost: "N/A"
        }
      ]
    },
    {
      category: "UK Open Data",
      sources: [
        {
          name: "UK Built-Up Areas (Dec 2024)",
          description: "UK Office for National Statistics - Built-Up Areas 2024 (England & Wales) - point-in-polygon and proximity queries up to 25 miles",
          coverage: "England & Wales",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/main_ONS_BUA_2024_EW/FeatureServer/0"
        },
        {
          name: "Wales Local Health Boards",
          description: "UK Office for National Statistics - Wales Local Health Boards December 2023 - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Wales",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Local_Health_Boards_December_2023_WA_BFC/FeatureServer/0"
        },
        {
          name: "NSPL Latest Postcode Centroids",
          description: "UK Office for National Statistics - NSPL Latest Postcode Centroids - proximity queries up to 5 miles",
          coverage: "United Kingdom",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/NSPL_LATEST_UK/FeatureServer/1"
        },
        {
          name: "National Parks (December 2022) Boundaries GB BFE (V3)",
          description: "UK Office for National Statistics - National Parks (December 2022) Boundaries GB BFE (V3) - point-in-polygon and proximity queries up to 50 miles",
          coverage: "Great Britain",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/NPARK_DEC_2022_GB_BFE_V3/FeatureServer/0"
        },
        {
          name: "UK Local Authority Districts",
          description: "UK Office for National Statistics - Local Authority Districts (LAD) - point-in-polygon and proximity queries up to 50 miles",
          coverage: "United Kingdom",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/LAD_MAY_2025_UK_BUC/FeatureServer/0"
        },
        {
          name: "UK Counties & Unitary Authorities",
          description: "UK Office for National Statistics - Counties and Unitary Authorities (point-in-polygon and proximity queries up to 50 miles)",
          coverage: "United Kingdom",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Counties_and_Unitary_Authorities_December_2021_UK_BGC_2022/FeatureServer/0"
        },
        {
          name: "Cancer Alliances (July 2023)",
          description: "Cancer Alliances July 2023 Boundaries (England) - point-in-polygon and proximity queries up to 50 miles",
          coverage: "England",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Cancer_Alliances_July_2023_Boundaries_EN_BFC/FeatureServer/0"
        },
        {
          name: "GEOSTAT Grid (2011)",
          description: "GEOSTAT Dec 2011 Grid in the United Kingdom - population and households (point-in-polygon and proximity queries up to 50 miles)",
          coverage: "United Kingdom",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/GEOSTAT_Dec_2011_GEC_in_the_United_Kingdom_2022/FeatureServer/0"
        },
        {
          name: "Fire & Rescue Authorities (Dec 2023)",
          description: "Fire and Rescue Authorities December 2023 Boundaries (England & Wales) - point-in-polygon and proximity queries up to 50 miles",
          coverage: "England & Wales",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Fire_and_Rescue_Authorities_December_2023_EW_BFC/FeatureServer/0"
        },
        {
          name: "Police Force Areas (Dec 2023)",
          description: "Police Force Areas December 2023 Boundaries (England & Wales) - point-in-polygon and proximity queries up to 50 miles",
          coverage: "England & Wales",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Police_Force_Areas_December_2023_EW_BFC/FeatureServer/0"
        },
        {
          name: "Workplace Zones (2011)",
          description: "Workplace Zones December 2011 Boundaries (England & Wales) - point-in-polygon and proximity queries up to 50 miles",
          coverage: "England & Wales",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Workplace_Zones_Dec_2011_FCB_in_England_and_Wales_2022/FeatureServer/0"
        },
        {
          name: "LSOA 2021 (Rural-Urban Classification)",
          description: "Lower Layer Super Output Areas 2021 (England & Wales) with Rural-Urban Classification - point-in-polygon and proximity queries up to 50 miles",
          coverage: "England & Wales",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/LSOA_2021_EW_BSC_V4_RUC/FeatureServer/0"
      },
      {
        name: "European Electoral Regions (Dec 2018)",
        description: "European Electoral Regions December 2018 Boundaries (United Kingdom) - point-in-polygon and proximity queries up to 25 miles",
        coverage: "United Kingdom",
        accuracy: "Very High",
        cost: "Free",
        url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/European_Electoral_Regions_Dec_2018_FCB_UK_2022/FeatureServer/0"
        }
      ]
    },
    {
      category: "Ireland Sources",
      sources: [
        {
          name: "OSi Ireland Provinces",
          description: "Ireland Provinces - OSi National Statutory Boundaries - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/Provinces___OSi_National_Statutory_Boundaries/FeatureServer/0"
        },
        {
          name: "OSi Ireland Built-Up Areas",
          description: "Ireland Built-Up Areas - OSi National 1m Map of Ireland - point-in-polygon and proximity queries up to 50 miles",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/arcgis/rest/services/Built_Up_Areas___OSi_National_1m_Map_Of_Ireland/FeatureServer/0"
        },
        {
          name: "OSi Ireland Small Areas",
          description: "Ireland Small Areas - OSi Ungeneralised - point-in-polygon and proximity queries up to 50 miles",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/Small_Areas_Ungeneralised/FeatureServer/0"
        },
        {
          name: "OSi Ireland Centres of Population",
          description: "Ireland Centres of Population - OSi National Placenames Gazetteer - proximity queries up to 25 miles",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/arcgis/rest/services/Centres_of_Population___OSi_National_Placenames_Gazetteer/FeatureServer/0"
        },
        {
          name: "CSO Ireland Electoral Divisions",
          description: "Irish Electoral Divisions - CSO Electoral Divisions Ungeneralised - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/CSO_Electoral_Divisions_Ungeneralised/FeatureServer/0"
        },
        {
          name: "Ireland NUTS3 Boundaries",
          description: "Irish NUTS3 Boundaries - Nomenclature of Territorial Units for Statistics (NUTS) boundaries ungeneralised - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/NUTS3_Boundaries_Ungeneralised/FeatureServer/0"
        },
        {
          name: "OSi Ireland Civil Parishes",
          description: "Irish Civil Parishes - National Statutory Boundaries Ungeneralised 2024 - point-in-polygon and proximity queries up to 25 miles",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/CivilParishes_urbanareas_NationalStatutoryBoundaries_Ungeneralised_2024/FeatureServer/1"
        },
        {
          name: "OSi Ireland Buildings - Residential",
          description: "Irish Buildings - Residential - point-in-polygon and proximity queries up to 5 miles",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/Buildings_OpenDatatest3view/FeatureServer/0"
        },
        {
          name: "OSi Ireland Buildings - Residential/Commercial",
          description: "Irish Buildings - Residential/Commercial - point-in-polygon and proximity queries up to 5 miles",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/Buildings_OpenDatatest3view/FeatureServer/1"
        },
        {
          name: "OSi Ireland Buildings - Commercial",
          description: "Irish Buildings - Commercial - point-in-polygon and proximity queries up to 5 miles",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/Buildings_OpenDatatest3view/FeatureServer/2"
        },
        {
          name: "OSi Ireland Mountain Peaks",
          description: "Irish Mountain Peaks - OSi National 1m Map Of Ireland - proximity queries up to 50 miles. Point file of Mountains taken from the National 1:1Million Map Of Ireland. This dataset is provided by Tailte Éireann",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/arcgis/rest/services/Mountains___OSi_National_1m_Map_Of_Ireland/FeatureServer/0"
        },
        {
          name: "OSi Ireland Coastal High Water Marks",
          description: "Irish Coastal High Water Marks - OSi National Water Marks Ungeneralised 2024 - proximity queries up to 25 miles. Digital representation of high water marks (polyline dataset). This dataset is provided by Tailte Éireann",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/HighWaterMark_NationalWaterMarks_Ungeneralised_2024/FeatureServer/0"
        },
        {
          name: "OSi Ireland Vegetation Areas",
          description: "Irish Vegetation Areas - OSi National 250K Map of Ireland - point-in-polygon and proximity queries up to 25 miles. Land used for growing vegetation (polygon dataset). This dataset is provided by Tailte Éireann",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/Vegetation_Areas___OSi_National_250K_Map_of_Ireland/FeatureServer/0"
        },
        {
          name: "OSi Ireland Points of Interest",
          description: "Irish Points of Interest - OSi Geodirectory GeoJSON - proximity queries up to 25 miles. Points of interest including organizations, businesses, and facilities with address information (point dataset). This dataset is provided by Tailte Éireann",
          coverage: "Ireland",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/ArcGIS/rest/services/Geodirectory_GeoJSON/FeatureServer/0"
        }
      ]
    },
    {
      category: "Australia Sources",
      sources: [
        {
          name: "Digital Atlas AUS - Railway Lines",
          description: "Australia Railways - Digital Atlas AUS Railway Lines - proximity queries up to 50 miles. Railway infrastructure including operational status, track gauge, and ownership information (polyline dataset). This dataset is provided by the Department of Natural Resources, Mines and Energy, Queensland",
          coverage: "Australia",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/Railway_Lines_vw/FeatureServer/0"
        },
        {
          name: "Digital Atlas AUS - Tram Lines",
          description: "Australia Trams - Digital Atlas AUS Tram Lines - proximity queries up to 50 miles. Tram infrastructure including operational status, track gauge, and ownership information (polyline dataset). This dataset is provided by the Department of Natural Resources, Mines and Energy, Queensland",
          coverage: "Australia",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/Tram_Lines_vw/FeatureServer/0"
        },
        {
            name: "Digital Atlas AUS - Recent Bushfire Accumulation",
          description: "Recent Australia Bushfires - Digital Atlas AUS 3-Hourly Bushfire Accumulation - point-in-polygon and proximity queries up to 50 miles. Bushfire location points and extents including fire accumulation data (point and polygon dataset). This dataset is provided by the Department of Natural Resources, Mines and Energy, Queensland",
          coverage: "Australia",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/ArcGIS/rest/services/3-Hourly_Bushfire_Accumulation_2_view/FeatureServer"
        },
        {
          name: "Geoscience Australia - Australian Operating Mines",
          description: "Australia Operating Mines - Geoscience Australia Operating Mines - proximity queries up to 50 miles. Location and status of Australian operating mines including commodity and state information (point dataset). This dataset is provided by Geoscience Australia under Creative Commons Attribution 4.0 International Licence.",
          coverage: "Australia",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services.ga.gov.au/gis/rest/services/AustralianOperatingMines/MapServer"
        },
        {
          name: "Geoscience Australia - Australian Developing Mines",
          description: "Australia Developing Mines - Geoscience Australia Developing Mines - proximity queries up to 50 miles. Mines under development where the project has a positive feasibility study, development has commenced or all approvals have been received (point dataset). This dataset is provided by Geoscience Australia under Creative Commons Attribution 4.0 International Licence.",
          coverage: "Australia",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services.ga.gov.au/gis/rest/services/AustralianOperatingMines/MapServer"
        },
        {
          name: "Geoscience Australia - Australian Care/Maintenance Mines",
          description: "Australia Care/Maintenance Mines - Geoscience Australia Mines Under Care and Maintenance - proximity queries up to 50 miles. Mines under care and maintenance with known resource estimations that may be mined or developed in the future (point dataset). This dataset is provided by Geoscience Australia under Creative Commons Attribution 4.0 International Licence.",
          coverage: "Australia",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services.ga.gov.au/gis/rest/services/AustralianOperatingMines/MapServer"
        },
        {
          name: "Digital Atlas AUS - Australia Built-Up Areas",
          description: "Australia Built-Up Areas - Digital Atlas AUS Built-Up Areas (point-in-polygon and proximity queries up to 50 miles). Built up area polygons represent where buildings are clustered together, such as urban areas. The product has been designed for AUSTopo - Australian Digital Topographic Map Series 250k.",
          coverage: "Australia",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/Built_Up_Areas/FeatureServer/0"
        },
        {
          name: "Digital Atlas AUS - National Pollutant Inventory Facilities",
          description: "Australia National Pollutant Inventory Facilities - Industrial facilities that report to the NPI (proximity queries up to 50 miles). The NPI dataset features over 8,000 facilities including mines, power stations, factories, waste management sites, and intensive animal agricultural facilities. Attributes provide identifying details, business information, main activities, industry classification, location and links to latest reports.",
          coverage: "Australia",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/National_Pollutant_Inventory/FeatureServer/0"
        },
        {
          name: "Geoscience Australia - Waste Management Facilities",
          description: "Australia Waste Management Facilities - Geoscience Australia Waste Management Facilities (proximity queries up to 50 miles). Point feature service for waste management facilities across Australia.",
          coverage: "Australia",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services.ga.gov.au/gis/rest/services/Waste_Management_Facilities/MapServer/0"
        },
        {
          name: "Digital Atlas AUS - Major Maritime Ports",
          description: "Australia Maritime Ports - Major maritime ports and facilities (proximity queries up to 50 miles). Point feature service for major maritime ports across Australia.",
          coverage: "Australia",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/Major_Maritime_Ports_vw/FeatureServer/0"
        },
        {
          name: "Digital Atlas AUS - National Roads",
          description: "Australia National Roads - Comprehensive national road network from Digital Atlas AUS (proximity queries up to 1 mile: 0.25, 0.50, 0.75, 1.0 miles). Includes all road types with attributes for street names, hierarchy, status, surface type, state, and lane information.",
          coverage: "Australia",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/National_Roads/FeatureServer/0"
        },
        {
          name: "Digital Atlas AUS - Major Roads",
          description: "Australia Major Roads - Major road network from Digital Atlas AUS (proximity queries up to 1 mile: 0.25, 0.50, 0.75, 1.0 miles). Includes major highways, arterials, and primary roads with attributes for street names, hierarchy, status, surface type, state, and lane information.",
          coverage: "Australia",
          accuracy: "Very High",
          cost: "Free",
          url: "https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/MajorRoads/FeatureServer/0"
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
          cost: "Free (with API key)",
          url: "https://www.maptiler.com/"
        }
      ]
    }
  ];
};

const DataSourcesView: React.FC<DataSourcesViewProps> = ({ onBackToMain }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use fixed positioning instead of sticky due to root overflow issue
  useEffect(() => {
    // The root div has overflow which breaks sticky, so we'll use fixed positioning
    // and add padding to the content to account for the fixed header
    if (headerRef.current && containerRef.current) {
      const headerHeight = headerRef.current.offsetHeight;
      // Add padding to content to account for fixed header
      const content = containerRef.current.querySelector('.content-wrapper') as HTMLElement;
      if (content) {
        content.style.paddingTop = `${headerHeight}px`;
      }
    }
  }, []);
  
  const dataSources = getDataSources();

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50" style={{ position: 'relative' }}>
      {/* Header with Back Button - Fixed Header (using fixed instead of sticky due to root overflow) */}
      <div 
        ref={headerRef}
        className="bg-white shadow-lg border-b border-gray-300"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: '#ffffff',
          width: '100%'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBackToMain}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Main</span>
            </button>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-2 sm:mx-4" style={{ minWidth: '200px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  fontSize: '16px', 
                  zIndex: 10, 
                  pointerEvents: 'none',
                  color: '#9ca3af'
                }}>🔍</span>
                <input
                  id="data-sources-search-input"
                  type="text"
                  placeholder="Search data sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%',
                    backgroundColor: '#ffffff',
                    paddingLeft: '36px',
                    paddingRight: searchQuery ? '36px' : '12px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '400',
                    color: '#111827',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#6b7280';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af';
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Globe className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Data Sources & APIs</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Add padding for fixed header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8" style={{ paddingTop: '80px' }}>
        <div className="space-y-8 mt-4">
          {(() => {
            // Filter data sources based on search query
            // Prioritizes exact layer name matches (the hyperlink text) for more granular filtering
            const filteredDataSources = searchQuery.trim() === '' 
              ? dataSources 
              : dataSources.map(category => {
                  const searchLower = searchQuery.toLowerCase().trim();
                  const filteredSources = category.sources.filter(source => {
                    const nameLower = source.name.toLowerCase();
                    const descriptionLower = source.description.toLowerCase();
                    const coverageLower = source.coverage.toLowerCase();
                    const accuracyLower = source.accuracy.toLowerCase();
                    const costLower = source.cost.toLowerCase();
                    const categoryLower = category.category.toLowerCase();
                    
                    // Check for matches - layer name (hyperlink text) is checked first for priority
                    return nameLower.includes(searchLower) ||
                           nameLower.startsWith(searchLower) || // Prioritize starts-with matches on layer name
                           descriptionLower.includes(searchLower) ||
                           coverageLower.includes(searchLower) ||
                           accuracyLower.includes(searchLower) ||
                           costLower.includes(searchLower) ||
                           categoryLower.includes(searchLower);
                  });
                  // Only include category if it has matching sources
                  return filteredSources.length > 0 
                    ? { ...category, sources: filteredSources }
                    : null;
                }).filter(category => category !== null) as typeof dataSources;
            
            return filteredDataSources.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl">
                <h2 className="text-xl font-bold text-white p-4 flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>{category.category}</span>
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                {category.sources.map((source: DataSource, sourceIndex) => (
                  <div key={sourceIndex} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {source.url ? (
                            <a 
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <span>{source.name}</span>
                              <ExternalLink className="w-4 h-4 ml-1" />
                            </a>
                          ) : (
                            <span className="text-gray-900">{source.name}</span>
                          )}
                        </h3>
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
            ));
          })()}
          
          {/* Show message if no results found */}
          {searchQuery.trim() !== '' && (() => {
            const searchLower = searchQuery.toLowerCase().trim();
            const hasResults = dataSources.some(category => 
              category.sources.some(source => {
                const nameLower = source.name.toLowerCase();
                const descriptionLower = source.description.toLowerCase();
                const coverageLower = source.coverage.toLowerCase();
                const accuracyLower = source.accuracy.toLowerCase();
                const costLower = source.cost.toLowerCase();
                const categoryLower = category.category.toLowerCase();
                
                // Check for matches - layer name (hyperlink text) is checked first
                return nameLower.includes(searchLower) ||
                       nameLower.startsWith(searchLower) ||
                       descriptionLower.includes(searchLower) ||
                       coverageLower.includes(searchLower) ||
                       accuracyLower.includes(searchLower) ||
                       costLower.includes(searchLower) ||
                       categoryLower.includes(searchLower);
              })
            );
            
            if (!hasResults) {
              return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <p className="text-gray-600 text-lg">
                    No data sources found matching "{searchQuery}"
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Try searching with different keywords
                  </p>
                </div>
              );
            }
            return null;
          })()}
          
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
