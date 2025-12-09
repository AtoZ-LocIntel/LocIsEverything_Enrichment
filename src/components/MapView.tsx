import React, { useEffect, useRef, useState } from 'react';
import { EnrichmentResult } from '../App';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { exportEnrichmentResultsToCSV } from '../utils/csvExport';
import { poiConfigManager } from '../lib/poiConfig';

interface MapViewProps {
  results: EnrichmentResult[];
  onBackToConfig: () => void;
  isMobile?: boolean;
  previousViewMode?: string | null;
}

interface LegendItem {
  icon: string;
  color: string;
  title: string;
  count: number;
  ranges?: Array<{ label: string; color: string; count: number }>; // For color-coded layers like broadband
}

// MapTiler Basemap Configuration
const MAPTILER_BASEMAPS: Record<string, { url: string; name: string; attribution: string }> = {
  landscape: {
    url: 'https://api.maptiler.com/maps/landscape/{z}/{x}/{y}.png?key=Ts9pNkQtWsmoz4BHQIxF',
    name: 'Landscape',
    attribution: '© MapTiler © OpenStreetMap contributors'
  },
  hybrid: {
    url: 'https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=Ts9pNkQtWsmoz4BHQIxF',
    name: 'Hybrid',
    attribution: '© MapTiler © OpenStreetMap contributors'
  },
  streets: {
    url: 'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=Ts9pNkQtWsmoz4BHQIxF',
    name: 'Streets',
    attribution: '© MapTiler © OpenStreetMap contributors'
  },
  topo: {
    url: 'https://api.maptiler.com/maps/topo/{z}/{x}/{y}.png?key=Ts9pNkQtWsmoz4BHQIxF',
    name: 'Topographic',
    attribution: '© MapTiler © OpenStreetMap contributors'
  },
  satellite: {
    url: 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=Ts9pNkQtWsmoz4BHQIxF',
    name: 'Satellite',
    attribution: '© MapTiler © OpenStreetMap contributors'
  },
  basic: {
    url: 'https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=Ts9pNkQtWsmoz4BHQIxF',
    name: 'Basic',
    attribution: '© MapTiler © OpenStreetMap contributors'
  },
  bright: {
    url: 'https://api.maptiler.com/maps/bright/{z}/{x}/{y}.png?key=Ts9pNkQtWsmoz4BHQIxF',
    name: 'Bright',
    attribution: '© MapTiler © OpenStreetMap contributors'
  },
  pastel: {
    url: 'https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=Ts9pNkQtWsmoz4BHQIxF',
    name: 'Pastel',
    attribution: '© MapTiler © OpenStreetMap contributors'
  },
  dataviz: {
    url: 'https://api.maptiler.com/maps/dataviz/{z}/{x}/{y}.png?key=Ts9pNkQtWsmoz4BHQIxF',
    name: 'Data Visualization',
    attribution: '© MapTiler © OpenStreetMap contributors'
  },
  winter: {
    url: 'https://api.maptiler.com/maps/winter-v2/{z}/{x}/{y}.png?key=Ts9pNkQtWsmoz4BHQIxF',
    name: 'Winter',
    attribution: '© MapTiler © OpenStreetMap contributors'
  }
};

// Fix for Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// POI Category Icons and Colors
const POI_ICONS: Record<string, { icon: string; color: string; title: string }> = {
  'poi_animal_vehicle_collisions': { icon: '🦌', color: '#dc2626', title: 'Animal-Vehicle Impact (AVI)' },
  'poi_wildfires': { icon: '🔥', color: '#ff4500', title: 'Current Wildfires' },
  'poi_restaurants': { icon: '🍽️', color: '#ef4444', title: 'Restaurants' },
  'poi_hotels': { icon: '🏨', color: '#3b82f6', title: 'Hotels' },
  'poi_breweries': { icon: '🍺', color: '#f59e0b', title: 'Breweries' },
  'poi_police_stations': { icon: '🚔', color: '#1f2937', title: 'Police Stations' },
  'poi_fire_stations': { icon: '🚒', color: '#dc2626', title: 'Fire Stations' },
  'poi_schools': { icon: '🏫', color: '#10b981', title: 'Schools' },
  'poi_hospitals': { icon: '🏥', color: '#f97316', title: 'Hospitals' },
  'poi_pharmacies': { icon: '💊', color: '#06b6d4', title: 'Pharmacies' },
  'poi_parks': { icon: '🏞️', color: '#22c55e', title: 'Parks' },
  'poi_libraries': { icon: '📚', color: '#8b5cf6', title: 'Libraries' },
  'poi_markets': { icon: '🛒', color: '#06b6d4', title: 'Markets' },
  'poi_cafes': { icon: '☕', color: '#a855f7', title: 'Cafes' },
  'poi_banks': { icon: '🏦', color: '#64748b', title: 'Banks' },
  'poi_airports': { icon: '✈️', color: '#6366f1', title: 'Airports' },
  'poi_tnm_trails': { icon: '🥾', color: '#059669', title: 'Trails' },
  'poi_mountain_biking': { icon: '🚵', color: '#10b981', title: 'Mountain Biking & Biking Trails' },
  'poi_wikipedia': { icon: '📖', color: '#1d4ed8', title: 'Wikipedia Articles' },
  'poi_fema_flood_zones': { icon: '🌊', color: '#0891b2', title: 'FEMA Flood Zones' },
  'poi_wetlands': { icon: '🌿', color: '#059669', title: 'USGS Wetlands' },
  'poi_earthquakes': { icon: '🌋', color: '#dc2626', title: 'USGS Earthquakes' },
  'poi_volcanoes': { icon: '🌋', color: '#ea580c', title: 'USGS Volcanoes' },
  'poi_flood_reference_points': { icon: '🚨', color: '#dc2626', title: 'USGS Flood Reference Points' },
  
  // Appalachian Trail Features
  'at_bridges': { icon: '🌉', color: '#8b5cf6', title: 'AT Bridges' },
  'at_campsites': { icon: '🏕️', color: '#059669', title: 'AT Campsites' },
  'at_parking': { icon: '🅿️', color: '#1f2937', title: 'AT Parking' },
  'at_privies': { icon: '🚻', color: '#7c2d12', title: 'AT Privies' },
  'at_shelters': { icon: '🏠', color: '#dc2626', title: 'AT Shelters' },
  'at_vistas': { icon: '🏔️', color: '#0891b2', title: 'AT Vistas' },
  'at_side_trails': { icon: '🥾', color: '#059669', title: 'AT Side Trails' },
  'at_treadway': { icon: '🛤️', color: '#7c3aed', title: 'AT Treadway' },
  'at_assets_trail': { icon: '🔧', color: '#f59e0b', title: 'AT Trail Assets' },
  'at_assets_structures': { icon: '🏗️', color: '#6b7280', title: 'AT Structure Assets' },
  'at_assets_bridges': { icon: '🌉', color: '#8b5cf6', title: 'AT Bridge Assets' },
  'at_centerline': { icon: '🗺️', color: '#dc2626', title: 'AT Centerline' },
  
  // Pacific Crest Trail (PCT)
  'pct_centerline': { icon: '🥾', color: '#dc2626', title: 'PCT Centerline' },
  'pct_sheriff_offices': { icon: '👮', color: '#1e40af', title: 'PCT Sheriff Offices' },
  'pct_side_trails': { icon: '🛤️', color: '#7c2d12', title: 'PCT Side Trails' },
  'pct_mile_markers_2024': { icon: '📍', color: '#dc2626', title: 'PCT 2024 Mile Markers' },
  'pct_tenth_mile_markers_2024': { icon: '📍', color: '#dc2626', title: 'PCT 2025 Tenth/Mile Markers' },
  'pct_resupply_towns': { icon: '🏘️', color: '#059669', title: 'PCT Resupply Towns' },
  'pct_osm_features': { icon: '🏔️', color: '#dc2626', title: 'PCT OSM Features' },
  
  // EPA FRS Environmental Hazards
  'poi_epa_brownfields': { icon: '🏭', color: '#8b4513', title: 'EPA Brownfields' },
  'poi_epa_superfund': { icon: '⚠️', color: '#dc2626', title: 'EPA Superfund Sites' },
  'poi_epa_rcra': { icon: '☣️', color: '#7c2d12', title: 'EPA RCRA Facilities' },
  'poi_epa_npdes': { icon: '💧', color: '#0891b2', title: 'EPA NPDES Permits' },
  'poi_epa_air': { icon: '💨', color: '#6b7280', title: 'EPA Air Facilities' },
  'poi_epa_radiation': { icon: '☢️', color: '#fbbf24', title: 'EPA Radiation Facilities' },
  'poi_epa_power': { icon: '⚡', color: '#f59e0b', title: 'EPA Power Generation' },
  'poi_epa_oil_spill': { icon: '🛢️', color: '#1f2937', title: 'EPA Oil Spill Response' },
  
  // EPA TRI (Toxics Release Inventory) - Comprehensive facility data
  'tri_facilities': { icon: '🧪', color: '#059669', title: 'TRI Facilities' },
  'tri_facilities_tribal': { icon: '🏛️', color: '#7c2d12', title: 'TRI Facilities (Tribal Land)' },
  'tri_all_facilities': { icon: '🏭', color: '#1f2937', title: 'All TRI Facilities' },
  'tri_manufacturing': { icon: '⚙️', color: '#6b7280', title: 'Manufacturing Facilities' },
  'tri_metal_mining': { icon: '⛏️', color: '#92400e', title: 'Metal Mining Facilities' },
  'tri_electric_utility': { icon: '⚡', color: '#f59e0b', title: 'Electric Utility Facilities' },
  'tri_wood_products': { icon: '🪵', color: '#7c2d12', title: 'Wood Products Facilities' },
  'tri_automotive': { icon: '🚗', color: '#1e40af', title: 'Automotive Manufacturing' },
  'tri_pfas': { icon: '🧬', color: '#dc2626', title: 'PFAS Facilities' },
  'tri_lead': { icon: '🔗', color: '#6b7280', title: 'Lead Facilities' },
  'tri_dioxins': { icon: '☠️', color: '#7c2d12', title: 'Dioxins Facilities' },
  'tri_ethylene_oxide': { icon: '💨', color: '#0891b2', title: 'Ethylene Oxide Facilities' },
  'tri_carcinogens': { icon: '⚠️', color: '#dc2626', title: 'Carcinogens Facilities' },
  'tri_mercury': { icon: '🌡️', color: '#fbbf24', title: 'Mercury Facilities' },
  'tri_federal': { icon: '🏛️', color: '#1f2937', title: 'Federal TRI Facilities' },
  
  // Power and Infrastructure
  'poi_powerlines': { icon: '⚡', color: '#f59e0b', title: 'Powerlines' },
  'poi_cell_towers': { icon: '📡', color: '#8b5cf6', title: 'Cell Towers' },
  
  // Recreation and Leisure
  'poi_theatres': { icon: '🎭', color: '#800080', title: 'Theatres' },
  'poi_museums_historic': { icon: '🏛️', color: '#7c3aed', title: 'Museums, Historic Sites & Memorials' },
  'poi_bars_nightlife': { icon: '🍻', color: '#f59e0b', title: 'Bars & Nightlife' },
  
  // USDA Local Food Portal - Farmers Markets & Local Food
  'poi_usda_agritourism': { icon: '🚜', color: '#22c55e', title: 'Agritourism' },
  'poi_usda_csa': { icon: '🧺', color: '#16a34a', title: 'CSA Programs' },
  'poi_usda_farmers_market': { icon: '🍎', color: '#dc2626', title: 'Farmers Markets' },
  'poi_usda_food_hub': { icon: '📦', color: '#f97316', title: 'Food Hubs' },
  'poi_usda_onfarm_market': { icon: '🥕', color: '#eab308', title: 'On-Farm Markets' },
 
  // Transportation
  'poi_bus': { icon: '🚌', color: '#2563eb', title: 'Bus' },
  'poi_train': { icon: '🚂', color: '#7c3aed', title: 'Train' },
  'poi_subway_metro': { icon: '🚇', color: '#dc2626', title: 'Subway/Metro' },
  'poi_tram': { icon: '🚊', color: '#059669', title: 'Tram' },
  'poi_monorail': { icon: '🚝', color: '#ea580c', title: 'Monorail' },
  'poi_aerialway': { icon: '🚡', color: '#0891b2', title: 'Aerialway' },
  'poi_ferry': { icon: '⛴️', color: '#1d4ed8', title: 'Ferry' },
  'poi_airport_air': { icon: '✈️', color: '#7c2d12', title: 'Airport/Air' },
  'poi_taxi': { icon: '🚕', color: '#fbbf24', title: 'Taxi' },
  'poi_bike_scooter_share': { icon: '🚲', color: '#10b981', title: 'Bike/Scooter Share' },
  'poi_dockless_hub': { icon: '🛴️', color: '#8b5cf6', title: 'Dockless Hub' },
  'poi_electric_charging': { icon: '🔌', color: '#10b981', title: 'Electric Charging Stations' },
  'poi_gas_stations': { icon: '⛽', color: '#f59e0b', title: 'Gas Stations' },
  'poi_mail_shipping': { icon: '📮', color: '#3b82f6', title: 'Mail & Shipping' },
  'poi_colleges_universities': { icon: '🎓', color: '#7c3aed', title: 'Colleges & Universities' },
  'ct_urgent_care': { icon: '🏥', color: '#f97316', title: 'CT Urgent Care' },
  'ct_parcels': { icon: '🏠', color: '#059669', title: 'CT Parcels' },
  'ct_tribal_lands': { icon: '🏛️', color: '#8b5cf6', title: 'CT Tribal Lands' },
  'ct_drinking_water_watersheds': { icon: '💧', color: '#0891b2', title: 'CT Drinking Water Watersheds' },
  'ct_broadband_availability': { icon: '📡', color: '#7c3aed', title: 'CT 2025 Broadband Availability by Block' },
  'ct_water_pollution_control': { icon: '💧', color: '#0ea5e9', title: 'CT Water Pollution Control Facilities' },
  'ct_boat_launches': { icon: '🚤', color: '#3b82f6', title: 'CT Boat Launches' },
  'ct_federal_open_space': { icon: '🏞️', color: '#10b981', title: 'CT Federal Open Space' },
  'ct_huc_watersheds': { icon: '🌊', color: '#06b6d4', title: 'CT HUC Watershed Boundaries' },
  'ct_soils_parent_material': { icon: '🌱', color: '#a16207', title: 'CT Soils Parent Material Name' },
  'ca_power_outage_areas': { icon: '⚡', color: '#f59e0b', title: 'CA Power Outage Areas' },
  'ca_fire_perimeters_all': { icon: '🔥', color: '#dc2626', title: 'Historical CA Fire Perimeters (All)' },
  'ca_fire_perimeters_recent_large': { icon: '🔥', color: '#f97316', title: 'CA Recent Large Fire Perimeters' },
  'ca_fire_perimeters_1950': { icon: '🔥', color: '#f59e0b', title: 'CA Fire Perimeters (1950+)' },
  'ca_land_ownership': { icon: '🏛️', color: '#6366f1', title: 'CA Land Ownership' },
  'ca_wildland_fire_direct_protection': { icon: '🔥', color: '#eab308', title: 'CA Wildland Fire Direct Protection Areas' },
  'ca_calvtp_treatment_areas': { icon: '🔥', color: '#fbbf24', title: 'CA CalVTP Treatment Areas' },
  'ca_postfire_damage_inspections': { icon: '🔥', color: '#dc2626', title: 'CA Post-Fire Damage Inspections (DINS)' },
  'ca_medium_heavy_duty_infrastructure': { icon: '🚛', color: '#f97316', title: 'CA Medium & Heavy Duty Infrastructure' },
  'ca_frap_facilities': { icon: '🚒', color: '#dc2626', title: 'CA Facilities for Wildland Fire Protection' },
  'ca_solar_footprints': { icon: '☀️', color: '#fbbf24', title: 'CA Solar Footprints' },
  'ca_natural_gas_service_areas': { icon: '⛽', color: '#8b5cf6', title: 'CA Natural Gas Service Areas' },
  'ca_plss_sections': { icon: '🗺️', color: '#6366f1', title: 'CA Public Land Survey Sections' },
  'ca_geothermal_wells': { icon: '🌋', color: '#ea580c', title: 'CA Geothermal Wells' },
  'ca_oil_gas_wells': { icon: '🛢️', color: '#1f2937', title: 'CA Oil and Gas Wells' },
  'ca_eco_regions': { icon: '🌿', color: '#16a34a', title: 'CA Eco Regions' },
  'ca_la_zoning': { icon: '🏙️', color: '#7c3aed', title: 'City of Los Angeles Zoning' },
  'la_county_arts_recreation': { icon: '🎨', color: '#ec4899', title: 'LA County Arts and Recreation' },
  'la_county_education': { icon: '🎓', color: '#3b82f6', title: 'LA County Education' },
  'la_county_hospitals': { icon: '🏥', color: '#ef4444', title: 'LA County Hospitals' },
  'la_county_municipal_services': { icon: '🏛️', color: '#6366f1', title: 'LA County Municipal Services' },
  'la_county_physical_features': { icon: '🏔️', color: '#10b981', title: 'LA County Physical Features' },
  'la_county_public_safety': { icon: '🚨', color: '#dc2626', title: 'LA County Public Safety' },
  'la_county_transportation': { icon: '🚌', color: '#f59e0b', title: 'LA County Transportation' },
  'la_county_fire_hydrants': { icon: '🚒', color: '#ef4444', title: 'LA County Fire Hydrants' },
  'chicago_311': { icon: '📞', color: '#3b82f6', title: 'Chicago 311 Service Requests' },
  'chicago_traffic_crashes': { icon: '🚗', color: '#dc2626', title: 'Chicago Traffic Crashes' },
  'la_county_historic_cultural_monuments': { icon: '🏛️', color: '#a855f7', title: 'LA County Historic Cultural Monuments' },
  'la_county_housing_lead_risk': { icon: '🏠', color: '#dc2626', title: 'LA County Housing with Potential Lead Risk' },
  'la_county_school_district_boundaries': { icon: '🏫', color: '#3b82f6', title: 'LA County School District Boundaries' },
  'la_county_metro_lines': { icon: '🚇', color: '#7c3aed', title: 'LA County MTA Metro Lines' },
  'la_county_street_inventory': { icon: '🛣️', color: '#fbbf24', title: 'LA County Street Inventory' },
  // LA County Hazards
  'la_county_fire_hazards': { icon: '🔥', color: '#dc2626', title: 'LA County Fire Hazards' },
  'la_county_fire_hazard_responsibility_areas': { icon: '🔥', color: '#ef4444', title: 'LA County Fire Hazard Responsibility Areas' },
  'la_county_fire_hazard_severity_zones': { icon: '🔥', color: '#f97316', title: 'LA County Fire Hazard Severity Zones' },
  'la_county_fire_hazard_severity_zones_lra': { icon: '🔥', color: '#f97316', title: 'LA County Fire Hazard Severity Zones LRA' },
  'la_county_fire_hazard_severity_zones_sra': { icon: '🔥', color: '#f97316', title: 'LA County Fire Hazard Severity Zones SRA' },
  'la_county_earthquake_hazards': { icon: '🌍', color: '#7c2d12', title: 'LA County Earthquake Hazards' },
  'la_county_alquist_priolo_fault_traces': { icon: '⚡', color: '#991b1b', title: 'LA County Alquist-Priolo Fault Traces' },
  'la_county_alquist_priolo_fault_zones': { icon: '⚡', color: '#b91c1c', title: 'LA County Alquist-Priolo Fault Zones' },
  'la_county_usgs_faults': { icon: '⚡', color: '#dc2626', title: 'LA County USGS Faults' },
  'la_county_tsunami_inundation_runup_line': { icon: '🌊', color: '#0ea5e9', title: 'LA County Tsunami Inundation Runup Line' },
  'la_county_tsunami_inundation_zones': { icon: '🌊', color: '#0284c7', title: 'LA County Tsunami Inundation Zones' },
  'la_county_landslide_zones': { icon: '⛰️', color: '#a16207', title: 'LA County Landslide Zones' },
  'la_county_liquefaction_zones': { icon: '🌋', color: '#ca8a04', title: 'LA County Liquefaction Zones' },
  'la_county_flood_hazards': { icon: '💧', color: '#0ea5e9', title: 'LA County Flood Hazards' },
  'la_county_100_year_flood_plain': { icon: '💧', color: '#0284c7', title: 'LA County 100-Year Flood Plain' },
  'la_county_500_year_flood_plain': { icon: '💧', color: '#0369a1', title: 'LA County 500-Year Flood Plain' },
  'la_county_dam_inundation_eta': { icon: '🏗️', color: '#1e40af', title: 'LA County Dam Inundation ETA' },
  'la_county_dam_inundation_areas': { icon: '🏗️', color: '#1e3a8a', title: 'LA County Dam Inundation Areas' },
  // LA County Basemaps and Grids
  'la_county_us_national_grid': { icon: '🗺️', color: '#6366f1', title: 'LA County US National Grid' },
  'la_county_usng_100k': { icon: '🗺️', color: '#818cf8', title: 'LA County USNG 100K' },
  'la_county_usng_10000m': { icon: '🗺️', color: '#a78bfa', title: 'LA County USNG 10000M' },
  'la_county_usng_1000m': { icon: '🗺️', color: '#c084fc', title: 'LA County USNG 1000M' },
  'la_county_usng_100m': { icon: '🗺️', color: '#d8b4fe', title: 'LA County USNG 100M' },
  'la_county_township_range_section_rancho_boundaries': { icon: '📐', color: '#4b5563', title: 'LA County Township Range Section Rancho Boundaries' },
  'ca_state_parks_entry_points': { icon: '🏞️', color: '#059669', title: 'CA State Parks Entry Points' },
  'ca_state_parks_parking_lots': { icon: '🅿️', color: '#0891b2', title: 'CA State Parks Parking Lots' },
  'ca_state_parks_boundaries': { icon: '🏞️', color: '#10b981', title: 'CA State Parks Boundaries' },
  'ca_state_parks_campgrounds': { icon: '⛺', color: '#f59e0b', title: 'CA State Parks Campgrounds' },
  'ca_state_parks_recreational_routes': { icon: '🛤️', color: '#fbbf24', title: 'CA State Parks Recreational Routes' },
  'ca_condor_range': { icon: '🦅', color: '#7c3aed', title: 'CA Condor Range' },
  'ca_black_bear_range': { icon: '🐻', color: '#1f2937', title: 'CA Black Bear Range' },
  'ca_brush_rabbit_range': { icon: '🐰', color: '#92400e', title: 'CA Brush Rabbit Range' },
  'ca_great_gray_owl_range': { icon: '🦉', color: '#374151', title: 'CA Great Gray Owl Range' },
  'ca_sandhill_crane_range': { icon: '🦩', color: '#059669', title: 'CA Sandhill Crane Range' },
  'ca_highway_rest_areas': { icon: '🚗', color: '#dc2626', title: 'CA Highway Rest Areas' },
  'ca_marine_oil_terminals': { icon: '🛢️', color: '#1f2937', title: 'CA Marine Oil Terminals' },
  'de_state_forest': { icon: '🌲', color: '#16a34a', title: 'DE State Forest' },
  'de_pine_plantations': { icon: '🌲', color: '#15803d', title: 'DE Pine Plantations' },
  'de_child_care_centers': { icon: '🏫', color: '#f59e0b', title: 'DE Child Care Centers' },
  'de_fishing_access': { icon: '🎣', color: '#0284c7', title: 'DE Fishing Access' },
  'de_trout_streams': { icon: '🐟', color: '#0ea5e9', title: 'DE Trout Streams' },
  'de_public_schools': { icon: '🏫', color: '#3b82f6', title: 'DE Public Schools' },
  'de_private_schools': { icon: '🏛️', color: '#6366f1', title: 'DE Private Schools' },
  'de_votech_districts': { icon: '🎓', color: '#8b5cf6', title: 'DE VoTech Districts' },
  'de_school_districts': { icon: '📚', color: '#7c3aed', title: 'DE School Districts' },
  'de_stands_blinds_fields': { icon: '🎯', color: '#16a34a', title: 'DE Wildlife Areas Stands Blinds Fields' },
  'de_boat_ramps': { icon: '🚤', color: '#0284c7', title: 'DE Wildlife Areas Boat Ramps' },
  'de_facilities': { icon: '🏢', color: '#dc2626', title: 'DE Wildlife Areas Facilities' },
  'de_parking': { icon: '🅿️', color: '#f59e0b', title: 'DE Wildlife Areas Parking' },
  'de_restrooms': { icon: '🚻', color: '#8b5cf6', title: 'DE Wildlife Areas Restrooms' },
  'de_safety_zones': { icon: '⚠️', color: '#ef4444', title: 'DE Wildlife Areas Safety Zones' },
  'de_wildlife_management_zones': { icon: '🦌', color: '#059669', title: 'DE Wildlife Management Zones' },
  'de_rail_lines': { icon: '🚂', color: '#1f2937', title: 'DE Rail Lines' },
  'nj_parcels': { icon: '🏠', color: '#059669', title: 'NJ Tax Parcels' },
  'nj_address_points': { icon: '📍', color: '#3b82f6', title: 'NJ Address Points' },
  'nj_bus_stops': { icon: '🚌', color: '#f59e0b', title: 'NJ Bus Stops' },
  'nj_safety_service_patrol': { icon: '🚨', color: '#dc2626', title: 'NJ Safety Service Patrol' },
  'nj_service_areas': { icon: '🛣️', color: '#8b5cf6', title: 'NJ Service Areas' },
  'nj_roadway_network': { icon: '🛣️', color: '#fbbf24', title: 'NJ Roadway Network' },
  'nj_known_contaminated_sites': { icon: '⚠️', color: '#dc2626', title: 'NJ Known Contaminated Sites' },
  'nj_alternative_fuel_stations': { icon: '⛽', color: '#10b981', title: 'NJ Alternative Fuel Stations' },
  'nj_power_plants': { icon: '⚡', color: '#f59e0b', title: 'NJ Power Plants' },
  'nj_public_solar_facilities': { icon: '☀️', color: '#fbbf24', title: 'NJ Public Solar Facilities' },
  'nj_public_places_to_keep_cool': { icon: '❄️', color: '#3b82f6', title: 'NJ Public Places to Keep Cool' },
  'de_urban_tree_canopy': { icon: '🌳', color: '#22c55e', title: 'DE Urban Tree Canopy' },
  'de_forest_cover_2007': { icon: '🌲', color: '#166534', title: 'DE Forest Cover 2007' },
  'poi_walkability_index': { icon: '🚶', color: '#10b981', title: 'Walkability Index' },
   
  // Natural Resources
  'poi_beaches': { icon: '🏖️', color: '#fbbf24', title: 'Beaches' },
  'poi_lakes_ponds': { icon: '🏞️', color: '#0891b2', title: 'Lakes & Ponds' },
  'poi_rivers_streams': { icon: '🌊', color: '#1d4ed8', title: 'Rivers & Streams' },
  'poi_mountains_peaks': { icon: '🏔️', color: '#7c2d12', title: 'Mountains & Peaks' },
  'poi_aurora_viewing_sites': { icon: '🌌', color: '#a855f7', title: 'Aurora Viewing Sites' },
  'poi_ebird_hotspots': { icon: '🐦', color: '#1d4ed8', title: 'Birding Hotspots' },
  'ebird_recent_observations': { icon: '🪶', color: '#f97316', title: 'Recent Bird Observations' },
  
  // Public Lands & Protected Areas
  'poi_padus_public_access': { icon: '🏞️', color: '#22c55e', title: 'Public Lands' },
  'poi_padus_protection_status': { icon: '🛡️', color: '#059669', title: 'Protected Areas' },
  
  'default': { icon: '📍', color: '#6b7280', title: 'POI' }
};

// Create custom POI marker icons
const createPOIIcon = (emoji: string, color: string) => {
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${emoji}</div>`,
    className: 'poi-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const createPOIPopupContent = (poi: any, legendTitle: string, key: string): string => {
    // Handle PADUS features specially
    if (key && key.includes('padus_')) {
      const name = poi.unitName || poi.boundaryName || poi.name || 'Unnamed Public Land';
      const categoryInfo = poi.category || poi.featureClass || '';
      const manager = poi.managerName || poi.managerType || 'Unknown';
      const access = poi.publicAccess || 'Unknown';
      const acres = poi.acres ? `${poi.acres.toLocaleString()} acres` : '';
      const state = poi.state || '';
      
      return `
        <div style="min-width: 250px; max-width: 350px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${name}</h3>
          <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
            <div><strong>Category:</strong> ${categoryInfo}</div>
            ${manager ? `<div><strong>Manager:</strong> ${manager}</div>` : ''}
            ${access ? `<div><strong>Access:</strong> ${access}</div>` : ''}
            ${acres ? `<div><strong>Size:</strong> ${acres}</div>` : ''}
            ${state ? `<div><strong>State:</strong> ${state}</div>` : ''}
            ${poi.gapStatus ? `<div><strong>GAP Status:</strong> ${poi.gapStatus}</div>` : ''}
            ${poi.iucnCategory ? `<div><strong>IUCN Category:</strong> ${poi.iucnCategory}</div>` : ''}
          </div>
        </div>
      `;
    }

    if (key === 'poi_ebird_hotspots') {
      const name = poi.name || poi.locName || legendTitle || 'Birding Hotspot';
      const speciesCount = poi.numSpeciesAllTime;
      const latestObservation = poi.latestObsDt
        ? new Date(poi.latestObsDt).toLocaleString()
        : null;
      const distance = poi.distance_miles ?? poi.distanceMiles ?? 'Unknown';
      const url = poi.url;

      return `
        <div style="min-width: 260px; max-width: 360px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${name}</h3>
          <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
            📍 ${distance} miles away
          </div>
          <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
            🐦 Species recorded: ${speciesCount ?? 'Unknown'}
          </div>
          ${latestObservation ? `<div style="margin: 4px 0; font-size: 12px; color: #6b7280;">🗓️ Latest observation: ${latestObservation}</div>` : ''}
          ${url ? `<div style="margin-top: 8px;"><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; text-decoration: underline; font-size: 12px;">View hotspot on eBird</a></div>` : ''}
        </div>
      `;
    }

    if (key === 'ebird_recent_observations') {
      const speciesName = poi.species_common_name || poi.comName || poi.name || 'Bird Observation';
      const scientificName = poi.species_scientific_name || poi.sciName || null;
      const count = poi.howMany ?? 1;
      const observationDate = poi.obsDt ? new Date(poi.obsDt).toLocaleString() : null;
      const locationName = poi.location_name || poi.locName || null;
      const distance = poi.distance_miles ?? 'Unknown';
      const checklistUrl = poi.checklistId ? `https://ebird.org/checklist/${poi.checklistId}` : poi.url;

      return `
        <div style="min-width: 260px; max-width: 360px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${speciesName}</h3>
          ${scientificName ? `<div style="margin: 4px 0; font-size: 12px; color: #6b7280;"><em>${scientificName}</em></div>` : ''}
          <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
            📍 ${distance} miles away${locationName ? ` • ${locationName}` : ''}
          </div>
          <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
            👥 Count observed: ${count}
          </div>
          ${observationDate ? `<div style="margin: 4px 0; font-size: 12px; color: #6b7280;">🗓️ Observed: ${observationDate}</div>` : ''}
          ${checklistUrl ? `<div style="margin-top: 8px;"><a href="${checklistUrl}" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; text-decoration: underline; font-size: 12px;">View checklist</a></div>` : ''}
        </div>
      `;
    }
    
    const name = poi.tags?.name || poi.name || poi.title || 'Unnamed POI';
    const amenity = poi.tags?.amenity || poi.tags?.shop || poi.tags?.tourism || 'POI';
    const distance = poi.distance_miles || 'Unknown';
    
    return `
      <div style="min-width: 250px; max-width: 350px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${name}</h3>
        <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
          📍 ${legendTitle} • ${distance} miles away
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
          🏷️ Type: ${amenity}
        </div>
      </div>
    `;
  };

const formatPopupFieldName = (key: string): string => {
  return key
    .replace(/^poi_/g, 'POI ')
    .replace(/^at_/g, 'AT ')
    .replace(/^pct_/g, 'PCT ')
    .replace(/nws/g, 'NWS')
    .replace(/fws/g, 'FWS')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const formatPopupValue = (value: any, key: string): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (key.includes('elevation') || key.includes('elev')) {
      return `${value.toLocaleString()} ft`;
    }
    if (key.includes('radius_km')) {
      return `${value.toLocaleString()} km`;
    }
    if (key.includes('radius') || key.includes('miles')) {
      return `${value} miles`;
    }
    if (key.includes('income') || key.includes('median_income')) {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None found';
    if (key.includes('_all_pois') || key.includes('_detailed') || key.includes('_elements') || key.includes('_features')) {
      return `${value.length} found (see map/CSV for details)`;
    }
    return `${value.length} items`;
  }
  if (typeof value === 'object') {
    if (value.name) return String(value.name);
    if (value.title) return String(value.title);
    if (value.value) return String(value.value);

    if (key.includes('padus_') && (key.includes('_counts') || key.includes('_count'))) {
      const entries = Object.entries(value).map(([k, v]) => `${k}: ${v}`);
      return entries.join(', ');
    }

    return JSON.stringify(value);
  }
  return String(value);
};

const buildPopupSections = (enrichments: Record<string, any>): Array<{ category: string; items: { label: string; value: string }[] }> => {
  const sections: Record<string, { label: string; value: string }[]> = {};

  const shouldSkipField = (key: string) => (
    key.includes('_all_pois') ||
    key.includes('_detailed') ||
    key.includes('_elements') ||
    key.includes('_features') ||
    key.endsWith('_all') ||
    key.toLowerCase().includes('all_pois') ||
    key.toLowerCase().includes('_geometry') ||
    key.toLowerCase().includes('_raw') ||
    key.toLowerCase().includes('_geojson') ||
    key.includes('_attributes') || // Skip attributes fields (raw JSON data)
    key === 'nh_parcels_all' || // Skip parcels array (handled separately for map drawing)
    key === 'nh_recreation_trails_all' || // Skip trails array (handled separately for map drawing)
    key === 'nh_dot_roads_all' || // Skip roads array (handled separately for map drawing)
    key === 'nh_railroads_all' || // Skip railroads array (handled separately for map drawing)
    key === 'nh_transmission_pipelines_all' || // Skip transmission/pipelines array (handled separately for map drawing)
    key === 'nh_cell_towers_all' || // Skip cell towers array (handled separately for map drawing)
    key === 'nh_underground_storage_tanks_all' || // Skip underground storage tanks array (handled separately for map drawing)
    key === 'nh_water_wells_all' || // Skip water wells array (handled separately for map drawing)
    key === 'nh_public_water_supply_wells_all' || // Skip public water supply wells array (handled separately for map drawing)
    key === 'nh_remediation_sites_all' || // Skip remediation sites array (handled separately for map drawing)
    key === 'nh_automobile_salvage_yards_all' || // Skip automobile salvage yards array (handled separately for map drawing)
    key === 'nh_solid_waste_facilities_all' || // Skip solid waste facilities array (handled separately for map drawing)
    key === 'nh_source_water_protection_area_geometry' || // Skip geometry field (handled separately for map drawing)
    key === 'nh_nwi_plus_geometry' || // Skip geometry field (handled separately for map drawing)
    key === 'nh_nwi_plus_all' || // Skip wetlands array (handled separately for map drawing)
    key === 'nh_ssurgo_all' || // Skip SSURGO soils array (handled separately for map drawing)
    key === 'nh_bedrock_geology_all' || // Skip Bedrock Geology array (handled separately for map drawing)
    key === 'nh_geographic_names_all' || // Skip Geographic Names array (handled separately for map drawing)
    key === 'padus_public_access_all' || // Skip PAD-US public access array (handled separately for map drawing)
    key === 'padus_protection_status_all' || // Skip PAD-US protection status array (handled separately for map drawing)
    key === 'ma_regional_planning_agencies_all' || // Skip MA Regional Planning Agencies array (handled separately for map drawing)
    key === 'ma_acecs_all' || // Skip MA ACECs array (handled separately for map drawing)
    key === 'ma_parcels_all' || // Skip MA parcels array (handled separately for map drawing)
    key === 'ct_parcels_all' || // Skip CT parcels array (handled separately for map drawing)
    key === 'de_parcels_all' || // Skip DE parcels array (handled separately for map drawing)
    key === 'de_lulc_2007_all' || // Skip DE LULC arrays (handled separately for map drawing)
    key === 'de_lulc_2007_revised_all' || // Skip DE LULC arrays (handled separately for map drawing)
    key === 'de_lulc_2012_all' || // Skip DE LULC arrays (handled separately for map drawing)
    key === 'de_lulc_2017_all' || // Skip DE LULC arrays (handled separately for map drawing)
    key === 'de_lulc_2022_all' || // Skip DE LULC arrays (handled separately for map drawing)
    key === 'de_child_care_centers_all' || // Skip DE Child Care Centers array (handled separately for map drawing)
    key === 'de_fishing_access_all' || // Skip DE Fishing Access array (handled separately for map drawing)
    key === 'de_trout_streams_all' || // Skip DE Trout Streams array (handled separately for map drawing)
    key === 'de_public_schools_all' || // Skip DE Public Schools array (handled separately for map drawing)
    key === 'de_private_schools_all' || // Skip DE Private Schools array (handled separately for map drawing)
    key === 'de_votech_districts_all' || // Skip DE VoTech Districts array (handled separately for map drawing)
    key === 'de_school_districts_all' || // Skip DE School Districts array (handled separately for map drawing)
    key === 'de_stands_blinds_fields_all' || // Skip DE Stands Blinds Fields array (handled separately for map drawing)
    key === 'de_boat_ramps_all' || // Skip DE Boat Ramps array (handled separately for map drawing)
    key === 'de_facilities_all' || // Skip DE Facilities array (handled separately for map drawing)
    key === 'de_parking_all' || // Skip DE Parking array (handled separately for map drawing)
    key === 'de_restrooms_all' || // Skip DE Restrooms array (handled separately for map drawing)
    key === 'de_safety_zones_all' || // Skip DE Safety Zones array (handled separately for map drawing)
    key === 'de_wildlife_management_zones_all' || // Skip DE Wildlife Management Zones array (handled separately for map drawing)
    key === 'de_rail_lines_all' || // Skip DE Rail Lines array (handled separately for map drawing)
    key === 'nj_parcels_all' || // Skip NJ Parcels array (handled separately for map drawing)
    key === 'nj_address_points_all' || // Skip NJ Address Points array (handled separately for map drawing)
    key === 'nj_bus_stops_all' || // Skip NJ Bus Stops array (handled separately for map drawing)
    key === 'nj_safety_service_patrol_all' || // Skip NJ Safety Service Patrol array (handled separately for map drawing)
    key === 'nj_service_areas_all' || // Skip NJ Service Areas array (handled separately for map drawing)
    key === 'nj_roadway_network_all' || // Skip NJ Roadway Network array (handled separately for map drawing)
    key === 'nj_known_contaminated_sites_all' || // Skip NJ Known Contaminated Sites array (handled separately for map drawing)
    key === 'nj_alternative_fuel_stations_all' || // Skip NJ Alternative Fuel Stations array (handled separately for map drawing)
    key === 'nj_power_plants_all' || // Skip NJ Power Plants array (handled separately for map drawing)
    key === 'nj_public_solar_facilities_all' || // Skip NJ Public Solar Facilities array (handled separately for map drawing)
    key === 'nj_public_places_to_keep_cool_all' || // Skip NJ Public Places to Keep Cool array (handled separately for map drawing)
    key === 'ct_building_footprints_all' || // Skip CT building footprints array (handled separately for map drawing)
    key === 'ct_roads_all' || // Skip CT roads array (handled separately for map drawing)
    key === 'ct_urgent_care_all' || // Skip CT urgent care array (handled separately for map drawing)
    key === 'ct_deep_properties_all' || // Skip CT DEEP properties array (handled separately for map drawing)
    key === 'ct_tribal_lands_all' || // Skip CT Tribal Lands array (handled separately for map drawing)
    key === 'ct_drinking_water_watersheds_all' || // Skip CT Drinking Water Watersheds array (handled separately for map drawing)
    key === 'ct_broadband_availability_all' || // Skip CT Broadband Availability array (handled separately for map drawing)
    key === 'ct_water_pollution_control_all' || // Skip CT Water Pollution Control array (handled separately for map drawing)
    key === 'ct_boat_launches_all' || // Skip CT Boat Launches array (handled separately for map drawing)
    key === 'ct_federal_open_space_all' || // Skip CT Federal Open Space array (handled separately for map drawing)
    key === 'ct_huc_watersheds_all' || // Skip CT HUC Watersheds array (handled separately for map drawing)
    key === 'ct_soils_parent_material_all' || // Skip CT Soils Parent Material array (handled separately for map drawing)
    key === 'ca_power_outage_areas_all' || // Skip CA Power Outage Areas array (handled separately for map drawing)
    key === 'ca_fire_perimeters_all_all' || // Skip CA Fire Perimeters (All) array (handled separately for map drawing)
    key === 'ca_fire_perimeters_recent_large_all' || // Skip CA Recent Large Fire Perimeters array (handled separately for map drawing)
    key === 'ca_fire_perimeters_1950_all' || // Skip CA Fire Perimeters (1950+) array (handled separately for map drawing)
    key === 'ca_land_ownership_all' || // Skip CA Land Ownership array (handled separately for map drawing)
    key === 'ca_cgs_landslide_zones_all' || // Skip CA CGS Landslide Zones array (handled separately for map drawing)
    key === 'ca_cgs_liquefaction_zones_all' || // Skip CA CGS Liquefaction Zones array (handled separately for map drawing)
    key === 'ca_wildland_fire_direct_protection_all' || // Skip CA Wildland Fire Direct Protection Areas array (handled separately for map drawing)
    key === 'ca_calvtp_treatment_areas_all' || // Skip CA CalVTP Treatment Areas array (handled separately for map drawing)
    key === 'ca_postfire_damage_inspections_all' || // Skip CA Post-Fire Damage Inspections array (handled separately for map drawing)
    key === 'ca_medium_heavy_duty_infrastructure_all' || // Skip CA Medium and Heavy Duty Infrastructure array (handled separately for map drawing)
    key === 'ca_frap_facilities_all' || // Skip CA FRAP Facilities array (handled separately for map drawing)
    key === 'ca_solar_footprints_all' || // Skip CA Solar Footprints array (handled separately for map drawing)
    key === 'ca_natural_gas_service_areas_all' || // Skip CA Natural Gas Service Areas array (handled separately for map drawing)
    key === 'ca_plss_sections_all' || // Skip CA PLSS Sections array (handled separately for map drawing)
    key === 'ca_geothermal_wells_all' || // Skip CA Geothermal Wells array (handled separately for map drawing)
    key === 'ca_oil_gas_wells_all' || // Skip CA Oil and Gas Wells array (handled separately for map drawing)
    key === 'ca_eco_regions_all' || // Skip CA Eco Regions array (handled separately for map drawing)
    key === 'ca_la_zoning_all' || // Skip City of Los Angeles Zoning array (handled separately for map drawing)
    key === 'la_county_arts_recreation_all' || // Skip LA County Arts and Recreation array (handled separately for map drawing)
    key === 'la_county_education_all' || // Skip LA County Education array (handled separately for map drawing)
    key === 'la_county_hospitals_all' || // Skip LA County Hospitals array (handled separately for map drawing)
    key === 'la_county_municipal_services_all' || // Skip LA County Municipal Services array (handled separately for map drawing)
    key === 'la_county_physical_features_all' || // Skip LA County Physical Features array (handled separately for map drawing)
    key === 'la_county_public_safety_all' || // Skip LA County Public Safety array (handled separately for map drawing)
    key === 'la_county_transportation_all' || // Skip LA County Transportation array (handled separately for map drawing)
    key === 'la_county_fire_hydrants_all' || // Skip LA County Fire Hydrants array (handled separately for map drawing)
    key === 'chicago_311_all' || // Skip Chicago 311 array (handled separately for map drawing)
    key === 'chicago_building_footprints_all' || // Skip Chicago Building Footprints array (handled separately for map drawing)
    key === 'chicago_traffic_crashes_all' || // Skip Chicago Traffic Crashes array (handled separately for map drawing)
    key === 'chicago_speed_cameras_all' || // Skip Chicago Speed Cameras array (handled separately for map drawing)
    key === 'chicago_red_light_cameras_all' || // Skip Chicago Red Light Cameras array (handled separately for map drawing)
    key === 'nyc_mappluto_all' || // Skip NYC MapPLUTO array (handled separately for map drawing)
    key === 'nyc_bike_routes_all' || // Skip NYC Bike Routes array (handled separately for map drawing)
    key === 'nyc_neighborhoods_all' || // Skip NYC Neighborhoods array (handled separately for map drawing)
    key === 'nyc_zoning_districts_all' || // Skip NYC Zoning Districts array (handled separately for map drawing)
    key === 'nyc_waterfront_hpb_launch_site_all' || // Skip NYC HPB Launch Site array (handled separately for map drawing)
    key === 'nyc_waterfront_parks_all' || // Skip NYC Waterfront Parks array (handled separately for map drawing)
    key === 'nyc_waterfront_paws_all' || // Skip NYC PAWS array (handled separately for map drawing)
    key === 'nyc_business_improvement_districts_all' || // Skip NYC Business Improvement Districts array (handled separately for map drawing)
    key === 'nyc_community_districts_all' || // Skip NYC Community Districts array (handled separately for map drawing)
    key === 'houston_neighborhoods_all' || // Skip Houston Neighborhoods array (handled separately for map drawing)
    key === 'houston_neighborhoods_2021_all' || // Skip Houston Neighborhoods 2021 array (handled separately for map drawing)
    key === 'la_county_historic_cultural_monuments_all' || // Skip LA County Historic Cultural Monuments array (handled separately for map drawing)
    key === 'la_county_housing_lead_risk_all' || // Skip LA County Housing Lead Risk array (handled separately for map drawing)
    key === 'la_county_school_district_boundaries_all' || // Skip LA County School District Boundaries array (handled separately for map drawing)
    key === 'la_county_metro_lines_all' || // Skip LA County Metro Lines array (handled separately for map drawing)
    key === 'la_county_street_inventory_all' || // Skip LA County Street Inventory array (handled separately for map drawing)
    key === 'la_county_fire_hazards_all' || // Skip LA County Hazards arrays (handled separately for map drawing)
    key === 'la_county_fire_hazard_responsibility_areas_all' ||
    key === 'la_county_fire_hazard_severity_zones_all' ||
    key === 'la_county_fire_hazard_severity_zones_lra_all' ||
    key === 'la_county_fire_hazard_severity_zones_sra_all' ||
    key === 'la_county_earthquake_hazards_all' ||
    key === 'la_county_alquist_priolo_fault_traces_all' ||
    key === 'la_county_alquist_priolo_fault_zones_all' ||
    key === 'la_county_usgs_faults_all' ||
    key === 'la_county_tsunami_inundation_runup_line_all' ||
    key === 'la_county_tsunami_inundation_zones_all' ||
    key === 'la_county_landslide_zones_all' ||
    key === 'la_county_liquefaction_zones_all' ||
    key === 'la_county_flood_hazards_all' ||
    key === 'la_county_100_year_flood_plain_all' ||
    key === 'la_county_500_year_flood_plain_all' ||
    key === 'la_county_dam_inundation_eta_all' ||
    key === 'la_county_dam_inundation_areas_all' ||
    key === 'la_county_us_national_grid_all' || // Skip LA County Basemaps and Grids arrays (handled separately for map drawing)
    key === 'la_county_usng_100k_all' ||
    key === 'la_county_usng_10000m_all' ||
    key === 'la_county_usng_1000m_all' ||
    key === 'la_county_usng_100m_all' ||
    key === 'la_county_township_range_section_rancho_boundaries_all' ||
    key.startsWith('la_county_hydrology_') && key.endsWith('_all') || // Skip LA County Hydrology arrays (handled separately for map drawing)
    key.startsWith('la_county_infrastructure_') && key.endsWith('_all') || // Skip LA County Infrastructure arrays (handled separately for map drawing)
    key.startsWith('la_county_admin_boundaries_') && key.endsWith('_all') || // Skip LA County Administrative Boundaries arrays (handled separately for map drawing)
    key.startsWith('la_county_elevation_') && key.endsWith('_all') || // Skip LA County Elevation arrays (handled separately for map drawing)
    key.startsWith('la_county_elevation_') && key.endsWith('_enabled') || // Skip LA County Elevation raster layer flags (handled separately)
    key.startsWith('la_county_demographics_') && key.endsWith('_all') || // Skip LA County Demographics arrays (handled separately for map drawing)
    (key.startsWith('la_county_redistricting_') && key.endsWith('_all')) || // Skip LA County Redistricting arrays (handled separately for map drawing)
    (key.startsWith('la_county_transportation') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately for map drawing)
    (key.startsWith('la_county_milepost_markers') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately for map drawing)
    (key.startsWith('la_county_rail_transportation') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately for map drawing)
    (key.startsWith('la_county_freeways') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately for map drawing)
    (key.startsWith('la_county_disaster_routes') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately for map drawing)
    (key.startsWith('la_county_highway_shields') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately for map drawing)
    (key.startsWith('la_county_metro_park_ride') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately for map drawing)
    (key.startsWith('la_county_metro_stations') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately for map drawing)
    (key.startsWith('la_county_metrolink') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately for map drawing)
    (key.startsWith('la_county_metro_lines') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately for map drawing)
    (key.startsWith('la_county_railroads') && key.endsWith('_all')) || // Skip LA County Transportation arrays (handled separately for map drawing)
    key === 'ca_state_parks_entry_points_all' || // Skip CA State Parks Entry Points array (handled separately for map drawing)
    key === 'ca_state_parks_parking_lots_all' || // Skip CA State Parks Parking Lots array (handled separately for map drawing)
    key === 'ca_state_parks_boundaries_all' || // Skip CA State Parks Boundaries array (handled separately for map drawing)
    key === 'ca_state_parks_campgrounds_all' || // Skip CA State Parks Campgrounds array (handled separately for map drawing)
    key === 'ca_state_parks_recreational_routes_all' || // Skip CA State Parks Recreational Routes array (handled separately for map drawing)
    key === 'ca_condor_range_all' || // Skip CA Condor Range array (handled separately for map drawing)
    key === 'ca_black_bear_range_all' || // Skip CA Black Bear Range array (handled separately for map drawing)
    key === 'ca_brush_rabbit_range_all' || // Skip CA Brush Rabbit Range array (handled separately for map drawing)
    key === 'ca_great_gray_owl_range_all' || // Skip CA Great Gray Owl Range array (handled separately for map drawing)
    key === 'ca_sandhill_crane_range_all' || // Skip CA Sandhill Crane Range array (handled separately for map drawing)
    key === 'ca_highway_rest_areas_all' || // Skip CA Highway Rest Areas array (handled separately for map drawing)
    key === 'ca_marine_oil_terminals_all' || // Skip CA Marine Oil Terminals array (handled separately for map drawing)
    key === 'national_marine_sanctuaries_all' // Skip National Marine Sanctuaries array (handled separately for map drawing)
  );

  const categorizeField = (key: string) => {
    if (key.includes('elev')) return 'Elevation & Terrain';
    if (key.includes('airq') || key.includes('air_quality')) return 'Air Quality';
    if (key.includes('fips') || key.includes('census') || key.includes('demographic') || key.includes('acs_')) return 'Demographics & Census';
    if (key.includes('fws_')) return 'FWS Species & Wildlife';
    if (key.includes('weather') || key.includes('climate')) return 'Weather & Climate';
    if (key.includes('school') || key.includes('education')) return 'Education';
    if (key.includes('hospital') || key.includes('healthcare') || key.includes('clinic') || key.includes('health')) return 'Healthcare';
    if (key.includes('crime') || key.includes('safety')) return 'Safety & Crime';
    if (key.includes('transport') || key.includes('transit')) return 'Transportation';
    if (key.includes('poi_') && key.includes('count') && !key.includes('wildfire')) return 'Points of Interest Nearby';
    if (key.includes('wildfire') || key.includes('usda_') || key.includes('poi_fema_flood_zones') || key.includes('poi_wetlands') || key.includes('poi_earthquakes') || key.includes('poi_volcanoes') || key.includes('poi_flood_reference_points') || key.includes('poi_animal_vehicle_collisions')) return 'Natural Hazards';
    if (key.includes('poi_epa_') || key.includes('epa_') || key.includes('tri_')) return 'Human Caused Hazards';
    if (key.includes('padus_')) return 'Public Lands & Protected Areas';
    if (key.includes('walkability')) return 'Livability & Walkability';
    if (key.includes('poi_usda_')) return 'Local Food & Agriculture';
    return 'Other';
  };

  Object.entries(enrichments).forEach(([key, value]) => {
    if (shouldSkipField(key)) return;

    const formattedValue = formatPopupValue(value, key);
    if (!formattedValue) return;

    const label = formatPopupFieldName(key);
    const category = categorizeField(key);

    if (!sections[category]) {
      sections[category] = [];
    }

    sections[category].push({ label, value: formattedValue });
  });

  return Object.entries(sections)
    .map(([category, items]) => ({ category, items }))
    .filter(section => section.items.length > 0);
};

// Create popup content for main location
const createPopupContent = (result: EnrichmentResult): string => {
    const { location, enrichments } = result;
    
    let content = `
      <div style="min-width: 400px; max-width: 600px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" style="width: 48px; height: 48px; border-radius: 50%;" />
          <h3 style="margin: 0; color: #1f2937; font-weight: 600; font-size: 16px;">${location.name}</h3>
        </div>
        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 12px;">
          📍 ${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}<br>
          🔍 Source: ${location.source}${location.confidence ? ` • Confidence: ${location.confidence}%` : ''}
        </p>
        
        <!-- Key Summary Values -->
        <div style="margin: 12px 0; padding: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; font-size: 12px;">
    `;
    
    // Add summary values if they exist
    if (enrichments.elevation_ft) {
      content += `
        <div style="text-align: center;">
          <div style="font-weight: 600; color: #374151; font-size: 10px;">Elevation</div>
          <div style="color: #1f2937; font-weight: 600;">${enrichments.elevation_ft.toLocaleString()} ft</div>
        </div>
      `;
    }
    
    if (enrichments.acs_population) {
      content += `
        <div style="text-align: center;">
          <div style="font-weight: 600; color: #374151; font-size: 10px;">Population</div>
          <div style="color: #1f2937; font-weight: 600;">${enrichments.acs_population.toLocaleString()}</div>
        </div>
      `;
    }
    
    if (enrichments.acs_median_income) {
      content += `
        <div style="text-align: center;">
          <div style="font-weight: 600; color: #374151; font-size: 10px;">Median Income</div>
          <div style="color: #1f2937; font-weight: 600;">$${enrichments.acs_median_income.toLocaleString()}</div>
        </div>
      `;
    }
    
    if (enrichments.fips_state) {
      content += `
        <div style="text-align: center;">
          <div style="font-weight: 600; color: #374151; font-size: 10px;">State</div>
          <div style="color: #1f2937; font-weight: 600;">${enrichments.fips_state}</div>
        </div>
      `;
    }
    
    if (enrichments.fips_county) {
      content += `
        <div style="text-align: center;">
          <div style="font-weight: 600; color: #374151; font-size: 10px;">County</div>
          <div style="color: #1f2937; font-weight: 600;">${enrichments.fips_county}</div>
        </div>
      `;
    }
    
    content += `
          </div>
        </div>
    `;
    
    // Add summary/attribution information from enrichments
    const summaryFields: string[] = [];
    
    // PADUS summaries
    if (enrichments.padus_public_access_summary) {
      summaryFields.push(enrichments.padus_public_access_summary);
    }
    if (enrichments.padus_protection_status_summary) {
      summaryFields.push(enrichments.padus_protection_status_summary);
    }
    
    // FWS summary
    if (enrichments.fws_species_count !== undefined) {
      summaryFields.push(`FWS Species: ${enrichments.fws_species_count} species found within ${enrichments.fws_search_radius_miles || 5} miles`);
    }
    
    // Weather summary
    if (enrichments.weather_summary) {
      summaryFields.push(`Weather: ${enrichments.weather_summary}`);
    }
    
    // Wildfire summary
    if (enrichments.poi_wildfires_count !== undefined) {
      summaryFields.push(`Wildfires: ${enrichments.poi_wildfires_count} active fires within ${enrichments.poi_wildfires_proximity_distance || 50} miles`);
    }
    
    // USDA Wildfire Risk
    if (enrichments.usda_wildfire_hazard_potential !== undefined) {
      const riskLevel = enrichments.usda_wildfire_hazard_potential_label || `Level ${enrichments.usda_wildfire_hazard_potential}/5`;
      summaryFields.push(`USDA Wildfire Risk: ${riskLevel}`);
    }
    
    // Add summary section if we have any summaries
    if (summaryFields.length > 0) {
      content += `
        <div style="margin: 12px 0; padding: 12px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
          <h4 style="margin: 0 0 8px 0; color: #1e40af; font-weight: 600; font-size: 12px;">📍 Location Summary</h4>
          <div style="font-size: 11px; color: #1e3a8a; line-height: 1.6;">
      `;
      summaryFields.forEach(summary => {
        content += `<div style="margin-bottom: 6px;">• ${summary}</div>`;
      });
      content += `
          </div>
        </div>
      `;
    }
    
    // Add detailed enrichment sections similar to summary form
    const enrichmentSections = buildPopupSections(enrichments);

    enrichmentSections.forEach(section => {
      content += `
        <div style="margin: 12px 0; padding: 12px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h4 style="margin: 0 0 8px 0; color: #111827; font-weight: 600; font-size: 12px;">${section.category}</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; font-size: 11px; color: #1f2937;">
      `;

      section.items.forEach(item => {
        content += `
            <div>
              <div style="font-weight: 600; color: #374151; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em;">${item.label}</div>
              <div style="color: #111827; font-size: 11px;">${item.value}</div>
            </div>
        `;
      });

      content += `
          </div>
        </div>
      `;
    });

    // Add data source attribution
    const dataSources: string[] = [];
    if (enrichments.padus_public_access_summary || enrichments.padus_protection_status_summary) {
      dataSources.push('PAD-US (Protected Areas Database)');
    }
    if (enrichments.fws_species_count !== undefined) {
      dataSources.push('USFWS (U.S. Fish & Wildlife Service)');
    }
    if (enrichments.poi_wildfires_count !== undefined) {
      dataSources.push('USGS (U.S. Geological Survey)');
    }
    if (enrichments.usda_wildfire_hazard_potential !== undefined) {
      dataSources.push('USDA (U.S. Department of Agriculture)');
    }
    if (enrichments.weather_summary || enrichments.weather_current) {
      dataSources.push('Open-Meteo Weather API');
    }
    if (enrichments.acs_population || enrichments.acs_median_income) {
      dataSources.push('U.S. Census Bureau (ACS)');
    }
    
    if (dataSources.length > 0) {
      content += `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #6b7280; font-size: 10px; font-style: italic;">
            Data Sources: ${dataSources.join(', ')}
          </p>
        </div>
      `;
    }
    
    content += `
      </div>
    `;
    
    return content;
  };

const MapView: React.FC<MapViewProps> = ({
  results,
  onBackToConfig,
  isMobile = false,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<{ primary: L.LayerGroup; poi: L.LayerGroup } | null>(null);
  const basemapLayerRef = useRef<L.TileLayer | null>(null);
  const [legendItems, setLegendItems] = useState<LegendItem[]>([]);
  const [showBatchSuccess, setShowBatchSuccess] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // Store feature metadata for tabbed popup functionality
  const featuresMetadataRef = useRef<Array<{
    layer: L.Layer;
    layerType: string;
    layerTitle: string;
    featureData: any;
    geometry: 'point' | 'polyline' | 'polygon';
  }>>([]);
  // Default to hybrid basemap (no dropdown, fixed basemap)
  const selectedBasemap = 'hybrid';
  // Removed viewportHeight and viewportWidth - not needed and were causing issues

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    // Wait for container to be fully rendered before initializing map
    // This prevents twitchy behavior when transitioning to map view
    const initializeMap = () => {
      if (!mapRef.current) return;

      // Ensure container has dimensions (don't check opacity as it may start at 0 for fade-in)
      const container = mapRef.current;
      const rect = container.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(container);
      // Only check if display is none or visibility is hidden, not opacity (allows fade-in)
      const isHidden = computedStyle.display === 'none' || computedStyle.visibility === 'hidden';
      
      if (rect.width === 0 || rect.height === 0 || isHidden) {
        // Container not ready yet, retry after a short delay
        setTimeout(initializeMap, 50);
        return;
      }

      // Simple, direct initialization - map starts at geocoded location immediately
      const initialCenter: [number, number] = results && results.length > 0 && results[0]?.location
        ? [results[0].location.lat, results[0].location.lon] as [number, number]
        : [37.0902, -95.7129] as [number, number];
      const initialZoom = results && results.length > 0 && results[0]?.location ? 15 : 4;
      
      const map = L.map(mapRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: !isMobile,
        attributionControl: true,
        fadeAnimation: true,
        zoomAnimation: true,
        zoomAnimationThreshold: 4,
      });

      // Initialize with hybrid basemap
      const basemapConfig = MAPTILER_BASEMAPS[selectedBasemap] || MAPTILER_BASEMAPS.hybrid;
      const basemapLayer = L.tileLayer(basemapConfig.url, {
        attribution: basemapConfig.attribution,
        maxZoom: 22,
      }).addTo(map);
      basemapLayerRef.current = basemapLayer;

      const primary = L.layerGroup().addTo(map);
      const poi = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      layerGroupsRef.current = { primary, poi };
      
      // Mark as initialized immediately so other useEffects can proceed
      setIsInitialized(true);

      // After map is initialized, invalidate size to ensure proper rendering
      // Use requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize(false);
            setIsMapReady(true);
          }
        }, 100);
      });
    };

    // Small delay to ensure container is rendered in DOM
    setTimeout(initializeMap, 50);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupsRef.current = null;
        basemapLayerRef.current = null;
      }
      setIsMapReady(false);
      setIsInitialized(false);
    };
  }, [isMobile, results.length, selectedBasemap]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateViewportDimensions = () => {
      // Viewport dimensions no longer tracked - was causing unnecessary invalidateSize calls
      // Map handles sizing naturally
    };

    updateViewportDimensions();

    window.addEventListener('resize', updateViewportDimensions);
    window.addEventListener('orientationchange', updateViewportDimensions);
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', updateViewportDimensions);

    return () => {
      window.removeEventListener('resize', updateViewportDimensions);
      window.removeEventListener('orientationchange', updateViewportDimensions);
      visualViewport?.removeEventListener('resize', updateViewportDimensions);
    };
  }, []);

  // Handle map size invalidation when view becomes visible
  useEffect(() => {
    if (!mapInstanceRef.current || !isInitialized) {
      return;
    }

    // When map view is first shown, ensure proper sizing
    // Use a small delay to allow CSS transitions to complete
    const timeoutId = setTimeout(() => {
      if (mapInstanceRef.current && mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          mapInstanceRef.current.invalidateSize(false);
        }
      }
    }, 300); // Wait for fade-in transition to complete

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isInitialized]);

  useEffect(() => {
    if (!mapRef.current || !mapInstanceRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    // ResizeObserver to handle container size changes
    // Only call invalidateSize when container actually changes size significantly
    let resizeTimeout: NodeJS.Timeout | null = null;
    let lastWidth = 0;
    let lastHeight = 0;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      
      const { width, height } = entry.contentRect;
      
      // Only invalidateSize if size changed significantly (more than 10px difference)
      // This prevents twitching from minor size fluctuations
      if (Math.abs(width - lastWidth) > 10 || Math.abs(height - lastHeight) > 10) {
        lastWidth = width;
        lastHeight = height;
        
        // Debounce to avoid excessive calls
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        resizeTimeout = setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize(false);
          }
        }, 150);
      }
    });

    observer.observe(mapRef.current);

    return () => {
      observer.disconnect();
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, []);

  useEffect(() => {
    console.log('🔍 [DEBUG START] useEffect triggered', {
      hasMap: !!mapInstanceRef.current,
      hasLayerGroups: !!layerGroupsRef.current,
      resultsCount: results?.length || 0,
      timestamp: new Date().toISOString()
    });

    // CRITICAL FIX: Wait for map to be initialized before proceeding
    // The map initializes in a separate useEffect, so we need to wait for it
    if (!mapInstanceRef.current || !layerGroupsRef.current) {
      console.log('🔍 [DEBUG] Map not ready yet, setting up retry mechanism');
      
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds max wait
      const checkMapReady = setInterval(() => {
        attempts++;
        if (mapInstanceRef.current && layerGroupsRef.current) {
          console.log(`🔍 [DEBUG] Map is now ready after ${attempts} attempts, proceeding`);
          clearInterval(checkMapReady);
          // Map is ready, proceed with adding features
          setTimeout(() => {
            if (mapInstanceRef.current && layerGroupsRef.current && results && results.length > 0) {
              addFeaturesToMap();
            }
          }, 200); // Give map a moment to fully initialize
        } else if (attempts >= maxAttempts) {
          console.error('🔍 [DEBUG ERROR] Map never became ready after 100 attempts');
          clearInterval(checkMapReady);
        }
      }, 100);
      
      return () => {
        clearInterval(checkMapReady);
      };
    }
    
    // Map is ready, proceed immediately
    addFeaturesToMap();
    
    function addFeaturesToMap() {
    if (!mapInstanceRef.current || !layerGroupsRef.current) {
      console.warn('🔍 [DEBUG] Map or layer groups not ready, skipping feature addition');
      return;
    }

    const map = mapInstanceRef.current;
    const { primary, poi } = layerGroupsRef.current;

    // Debug initial map state
    const initialContainer = map.getContainer();
    console.log('🔍 [DEBUG] Initial map state', {
      containerExists: !!initialContainer,
      containerWidth: initialContainer?.offsetWidth || 0,
      containerHeight: initialContainer?.offsetHeight || 0,
      containerDisplay: initialContainer ? window.getComputedStyle(initialContainer).display : 'N/A',
      containerVisibility: initialContainer ? window.getComputedStyle(initialContainer).visibility : 'N/A',
      mapCenter: map.getCenter().toString(),
      mapZoom: map.getZoom(),
      primaryLayerCount: primary.getLayers().length,
      poiLayerCount: poi.getLayers().length,
      primaryInMap: map.hasLayer(primary),
      poiInMap: map.hasLayer(poi)
    });

    if (!results || results.length === 0) {
      console.log('🔍 [DEBUG] No results, clearing layers');
      primary.clearLayers();
      poi.clearLayers();
      setLegendItems([]);
      setShowBatchSuccess(false);
      return;
    }

    // Clear layers and add features - simple and direct
    primary.clearLayers();
    poi.clearLayers();
    // Clear feature metadata for tabbed popup
    featuresMetadataRef.current = [];
    
    // Add location marker
    if (results[0]?.location) {
      const locationMarker = L.marker([results[0].location.lat, results[0].location.lon], {
        title: results[0].location.name,
      });
      locationMarker.bindPopup(createPopupContent(results[0]), { maxWidth: 540 });
      locationMarker.addTo(primary);
    }
    
    // Add all enrichment features - use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
        console.log('🗺️ STEP 2: Inside setTimeout, starting to draw features');
        const bounds = L.latLngBounds([]);
        const legendAccumulator: Record<string, LegendItem> = {};
        
        // Re-add location marker to bounds (already added above, but need for bounds calculation)
        if (results[0]?.location) {
          bounds.extend(L.latLng(results[0].location.lat, results[0].location.lon));
        }

    results.forEach((result) => {
      const { location, enrichments } = result;
      if (!location) {
        return;
      }

      const latLng = L.latLng(location.lat, location.lon);
      bounds.extend(latLng);

      // Location marker already added in STEP 1 above, just extend bounds here

      // Draw NH EMS facilities as markers on the map
      if (enrichments.nh_ems_all && Array.isArray(enrichments.nh_ems_all)) {
        enrichments.nh_ems_all.forEach((facility: any) => {
          if (facility.lat && facility.lon) {
            try {
              const facilityLat = facility.lat;
              const facilityLon = facility.lon;
              const facilityName = facility.name || facility.NAME || facility.Name || 'Unknown EMS Facility';
              const facilityType = facility.type || facility.TYPE || facility.Type || 'Unknown Type';
              
              // Create a custom icon for EMS facilities
              const icon = createPOIIcon('🚑', '#ef4444'); // Red icon for emergency services
              
              const marker = L.marker([facilityLat, facilityLon], { icon });
              
              // Build popup content with all EMS facility attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🚑 ${facilityName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    <div><strong>Type:</strong> ${facilityType}</div>
                    ${facility.address ? `<div><strong>Address:</strong> ${facility.address}</div>` : ''}
                    ${facility.city ? `<div><strong>City:</strong> ${facility.city}</div>` : ''}
                    ${facility.telephone ? `<div><strong>Phone:</strong> ${facility.telephone}</div>` : ''}
                    ${facility.owner ? `<div><strong>Owner:</strong> ${facility.owner}</div>` : ''}
                    ${facility.distance_miles !== null && facility.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${facility.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all EMS facility attributes (excluding internal fields)
              const excludeFields = ['name', 'type', 'address', 'city', 'state', 'zip', 'telephone', 'owner', 'lat', 'lon', 'distance_miles'];
              Object.entries(facility).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this EMS facility
              bounds.extend([facilityLat, facilityLon]);
            } catch (error) {
              console.error('Error drawing NH EMS facility marker:', error);
            }
          }
        });
      }

      // Draw NH Places of Worship as markers on the map
      if (enrichments.nh_places_of_worship_all && Array.isArray(enrichments.nh_places_of_worship_all)) {
        enrichments.nh_places_of_worship_all.forEach((place: any) => {
          if (place.lat && place.lon) {
            try {
              const placeLat = place.lat;
              const placeLon = place.lon;
              const placeName = place.name || place.NAME || place.Name || 'Unknown Place of Worship';
              const subtype = place.subtype || place.SUBTYPE || place.Subtype || 'Unknown Type';
              const denom = place.denom || place.DENOM || place.Denom || '';
              
              // Create a custom icon for places of worship
              const icon = createPOIIcon('🕌', '#7c3aed'); // Purple icon for places of worship
              
              const marker = L.marker([placeLat, placeLon], { icon });
              
              // Build popup content with all place of worship attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🕌 ${placeName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    <div><strong>Type:</strong> ${subtype}${denom ? ` - ${denom}` : ''}</div>
                    ${place.address ? `<div><strong>Address:</strong> ${place.address}</div>` : ''}
                    ${place.city ? `<div><strong>City:</strong> ${place.city}</div>` : ''}
                    ${place.telephone ? `<div><strong>Phone:</strong> ${place.telephone}</div>` : ''}
                    ${place.attendance !== null && place.attendance !== undefined ? `<div><strong>Attendance:</strong> ${place.attendance}</div>` : ''}
                    ${place.distance_miles !== null && place.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${place.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all place of worship attributes (excluding internal fields)
              const excludeFields = ['name', 'subtype', 'denom', 'address', 'city', 'state', 'zip', 'telephone', 'attendance', 'lat', 'lon', 'distance_miles'];
              Object.entries(place).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this place of worship
              bounds.extend([placeLat, placeLon]);
            } catch (error) {
              console.error('Error drawing NH Place of Worship marker:', error);
            }
          }
        });
      }

      // Draw NH Access Sites to Public Waters as markers on the map
      if (enrichments.nh_public_waters_access_all && Array.isArray(enrichments.nh_public_waters_access_all)) {
        enrichments.nh_public_waters_access_all.forEach((site: any) => {
          if (site.lat && site.lon) {
            try {
              const siteLat = site.lat;
              const siteLon = site.lon;
              const facilityName = site.facility || site.FACILITY || site.Facility || 'Unknown Access Site';
              const waterBody = site.water_body || site.WATER_BODY || site.WaterBody || 'Unknown Water Body';
              const wbType = site.wb_type || site.WB_TYPE || site.WbType || '';
              const accessTyp = site.access_typ || site.ACCESS_TYP || site.AccessTyp || '';
              
              // Create a custom icon for water access sites
              const icon = createPOIIcon('🌊', '#0ea5e9'); // Blue icon for water access
              
              const marker = L.marker([siteLat, siteLon], { icon });
              
              // Build popup content with all access site attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🌊 ${facilityName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    <div><strong>Water Body:</strong> ${waterBody}${wbType ? ` (${wbType})` : ''}</div>
                    ${accessTyp ? `<div><strong>Access Type:</strong> ${accessTyp}</div>` : ''}
                    ${site.town ? `<div><strong>Town:</strong> ${site.town}</div>` : ''}
                    ${site.county ? `<div><strong>County:</strong> ${site.county}</div>` : ''}
                    ${site.ownership ? `<div><strong>Ownership:</strong> ${site.ownership}</div>` : ''}
                    <div><strong>Amenities:</strong> ${[
                      site.boat === 'Yes' ? 'Boat' : null,
                      site.swim === 'Yes' ? 'Swim' : null,
                      site.fish === 'Yes' ? 'Fish' : null,
                      site.picnic === 'Yes' ? 'Picnic' : null,
                      site.camp === 'Yes' ? 'Camp' : null
                    ].filter(Boolean).join(', ') || 'None'}</div>
                    ${site.distance_miles !== null && site.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${site.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all access site attributes (excluding internal fields)
              const excludeFields = ['facility', 'water_body', 'wb_type', 'access_typ', 'town', 'county', 'ownership', 'boat', 'swim', 'fish', 'picnic', 'camp', 'lat', 'lon', 'distance_miles'];
              Object.entries(site).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this access site
              bounds.extend([siteLat, siteLon]);
            } catch (error) {
              console.error('Error drawing NH Access Site to Public Waters marker:', error);
            }
          }
        });
      }

      // Draw NH Law Enforcement facilities as markers on the map
      if (enrichments.nh_law_enforcement_all && Array.isArray(enrichments.nh_law_enforcement_all)) {
        enrichments.nh_law_enforcement_all.forEach((facility: any) => {
          if (facility.lat && facility.lon) {
            try {
              const facilityLat = facility.lat;
              const facilityLon = facility.lon;
              const facilityName = facility.name || facility.NAME || facility.Name || 'Unknown Law Enforcement Facility';
              const facilityType = facility.type || facility.TYPE || facility.Type || 'Unknown Type';
              
              // Create a custom icon for law enforcement
              const icon = createPOIIcon('🚔', '#1e40af'); // Blue icon for law enforcement
              
              const marker = L.marker([facilityLat, facilityLon], { icon });
              
              // Build popup content with all law enforcement facility attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🚔 ${facilityName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    <div><strong>Type:</strong> ${facilityType}</div>
                    ${facility.address ? `<div><strong>Address:</strong> ${facility.address}</div>` : ''}
                    ${facility.city ? `<div><strong>City:</strong> ${facility.city}</div>` : ''}
                    ${facility.telephone ? `<div><strong>Phone:</strong> ${facility.telephone}</div>` : ''}
                    ${facility.owner ? `<div><strong>Owner:</strong> ${facility.owner}</div>` : ''}
                    ${facility.distance_miles !== null && facility.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${facility.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all law enforcement facility attributes (excluding internal fields)
              const excludeFields = ['name', 'type', 'address', 'city', 'state', 'zip', 'telephone', 'owner', 'lat', 'lon', 'distance_miles'];
              Object.entries(facility).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this law enforcement facility
              bounds.extend([facilityLat, facilityLon]);
            } catch (error) {
              console.error('Error drawing NH Law Enforcement facility marker:', error);
            }
          }
        });
      }

      // Draw NH Recreation Trails as polylines on the map
      if (enrichments.nh_recreation_trails_all && Array.isArray(enrichments.nh_recreation_trails_all)) {
        let trailCount = 0;
        enrichments.nh_recreation_trails_all.forEach((trail: any) => {
          if (trail.geometry && trail.geometry.paths) {
            try {
              // Convert ESRI polyline paths to Leaflet LatLng arrays
              // ESRI polylines have paths (array of coordinate arrays)
              const paths = trail.geometry.paths;
              if (paths && paths.length > 0) {
                trailCount++;
                // For each path in the polyline, create a separate polyline
                paths.forEach((path: number[][]) => {
                  const latlngs = path.map((coord: number[]) => {
                    // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                    // Since we requested outSR=4326, coordinates should already be in WGS84
                    // Convert [lon, lat] to [lat, lon] for Leaflet
                    return [coord[1], coord[0]] as [number, number];
                  });

                  const trailName = trail.name || trail.NAME || trail.Name || 'Unknown Trail';
                  const trailType = trail.trail_type || trail.TRAIL_TYPE || trail.TrailType || trail.type || trail.TYPE || 'Unknown Type';
                  const lengthMiles = trail.length_miles || trail.LENGTH_MILES || trail.LengthMiles || trail.length || trail.LENGTH || null;

                  // Create polyline with green color for trails
                  const polyline = L.polyline(latlngs, {
                    color: '#059669', // Green color for trails
                    weight: 4,
                    opacity: 0.8,
                    smoothFactor: 1
                  });

                  // Build popup content with all trail attributes
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🥾 ${trailName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${trailType ? `<div><strong>Type:</strong> ${trailType}</div>` : ''}
                        ${lengthMiles !== null && lengthMiles !== undefined ? `<div><strong>Length:</strong> ${lengthMiles} miles</div>` : ''}
                        ${trail.distance_miles !== null && trail.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${trail.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all trail attributes (excluding internal fields)
                  const excludeFields = ['name', 'trail_type', 'type', 'length_miles', 'length', 'geometry', 'distance_miles'];
                  Object.entries(trail).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polyline.bindPopup(popupContent, { maxWidth: 400 });
                  polyline.addTo(poi);
                  bounds.extend(polyline.getBounds());
                });
              }
            } catch (error) {
              console.error('Error drawing NH Recreation Trail polyline:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (trailCount > 0) {
          if (!legendAccumulator['nh_recreation_trails']) {
            legendAccumulator['nh_recreation_trails'] = {
              icon: '🥾',
              color: '#059669',
              title: 'NH Recreation Trails',
              count: 0,
            };
          }
          legendAccumulator['nh_recreation_trails'].count += trailCount;
        }
      }

      // Draw NH Stone Walls as polylines on the map
      if (enrichments.nh_stone_walls_all && Array.isArray(enrichments.nh_stone_walls_all)) {
        let wallCount = 0;
        enrichments.nh_stone_walls_all.forEach((wall: any) => {
          if (wall.geometry && wall.geometry.paths) {
            try {
              // Convert ESRI polyline paths to Leaflet LatLng arrays
              const paths = wall.geometry.paths;
              if (paths && paths.length > 0) {
                wallCount++;
                // For each path in the polyline, create a separate polyline
                paths.forEach((path: number[][]) => {
                  const latlngs = path.map((coord: number[]) => {
                    // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                    return [coord[1], coord[0]] as [number, number];
                  });

                  const town = wall.TOWN || wall.town || 'Unknown Town';
                  const user = wall.USER_ || wall.user || null;
                  const shapeLength = wall.Shape__Length || wall.shapeLength || null;

                  // Create polyline with brown/tan color for stone walls
                  const polyline = L.polyline(latlngs, {
                    color: '#8b7355', // Brown/tan color for stone walls
                    weight: 2,
                    opacity: 0.8,
                    smoothFactor: 1
                  });

                  // Build popup content with all stone wall attributes
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🧱 Stone Wall
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${town ? `<div><strong>Town:</strong> ${town}</div>` : ''}
                        ${user ? `<div><strong>Mapped by:</strong> ${user}</div>` : ''}
                        ${shapeLength ? `<div><strong>Length:</strong> ${(shapeLength * 3.28084).toFixed(1)} ft</div>` : ''}
                        ${wall.distance_miles !== null && wall.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${wall.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all stone wall attributes (excluding internal fields)
                  const excludeFields = ['TOWN', 'town', 'USER_', 'user', 'Shape__Length', 'shapeLength', 'geometry', 'distance_miles'];
                  Object.entries(wall).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polyline.bindPopup(popupContent, { maxWidth: 400 });
                  polyline.addTo(poi);
                  bounds.extend(polyline.getBounds());
                });
              }
            } catch (error) {
              console.error('Error drawing NH Stone Wall polyline:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (wallCount > 0) {
          if (!legendAccumulator['nh_stone_walls']) {
            legendAccumulator['nh_stone_walls'] = {
              icon: '🧱',
              color: '#8b7355',
              title: 'NH Stone Walls',
              count: 0,
            };
          }
          legendAccumulator['nh_stone_walls'].count += wallCount;
        }
      }

      // Draw NH DOT Roads as polylines on the map
      if (enrichments.nh_dot_roads_all && Array.isArray(enrichments.nh_dot_roads_all)) {
        let roadCount = 0;
        enrichments.nh_dot_roads_all.forEach((road: any) => {
          if (road.geometry && road.geometry.paths) {
            try {
              // Convert ESRI polyline paths to Leaflet LatLng arrays
              // ESRI polylines have paths (array of coordinate arrays)
              const paths = road.geometry.paths;
              if (paths && paths.length > 0) {
                roadCount++;
                // For each path in the polyline, create a separate polyline
                paths.forEach((path: number[][]) => {
                  const latlngs = path.map((coord: number[]) => {
                    // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                    // Since we requested outSR=4326, coordinates should already be in WGS84
                    // Convert [lon, lat] to [lat, lon] for Leaflet
                    return [coord[1], coord[0]] as [number, number];
                  });

                  const streetName = road.Street || road.STREET || road.street || 'Unknown Road';
                  const roadType = road.road_type || road.ROAD_TYPE || road.RoadType || road.type || road.TYPE || road.fclass || road.FCLASS || 'Unknown Type';
                  const routeNumber = road.route_number || road.ROUTE_NUMBER || road.RouteNumber || road.route || road.ROUTE || road.rt_number || road.RT_NUMBER || null;

                  // Create polyline with yellow color for roads
                  const polyline = L.polyline(latlngs, {
                    color: '#fbbf24', // Yellow color for roads (better visibility on imagery basemap)
                    weight: 3,
                    opacity: 0.7,
                    smoothFactor: 1
                  });

                  // Build popup content with all road attributes
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🛣️ ${streetName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${roadType ? `<div><strong>Type:</strong> ${roadType}</div>` : ''}
                        ${routeNumber ? `<div><strong>Route Number:</strong> ${routeNumber}</div>` : ''}
                        ${road.distance_miles !== null && road.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${road.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all road attributes (excluding internal fields)
                  const excludeFields = ['name', 'road_name', 'street_name', 'road_type', 'type', 'fclass', 'route_number', 'route', 'rt_number', 'geometry', 'distance_miles'];
                  Object.entries(road).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polyline.bindPopup(popupContent, { maxWidth: 400 });
                  polyline.addTo(poi);
                  bounds.extend(polyline.getBounds());
                });
              }
            } catch (error) {
              console.error('Error drawing NH DOT Road polyline:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (roadCount > 0) {
          if (!legendAccumulator['nh_dot_roads']) {
            legendAccumulator['nh_dot_roads'] = {
              icon: '🛣️',
              color: '#fbbf24',
              title: 'NH DOT Roads',
              count: 0,
            };
          }
          legendAccumulator['nh_dot_roads'].count += roadCount;
        }
      }

      // Draw NH Railroads as polylines on the map
      if (enrichments.nh_railroads_all && Array.isArray(enrichments.nh_railroads_all)) {
        let railroadCount = 0;
        enrichments.nh_railroads_all.forEach((railroad: any) => {
          if (railroad.geometry && railroad.geometry.paths) {
            try {
              // Convert ESRI polyline paths to Leaflet LatLng arrays
              // ESRI polylines have paths (array of coordinate arrays)
              const paths = railroad.geometry.paths;
              if (paths && paths.length > 0) {
                railroadCount++;
                // For each path in the polyline, create a separate polyline
                paths.forEach((path: number[][]) => {
                  const latlngs = path.map((coord: number[]) => {
                    // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                    // Since we requested outSR=4326, coordinates should already be in WGS84
                    // Convert [lon, lat] to [lat, lon] for Leaflet
                    return [coord[1], coord[0]] as [number, number];
                  });

                  const railroadName = railroad.name || railroad.NAME || railroad.Name || railroad._name || 'Unknown Railroad';
                  const status = railroad.status || railroad.STATUS || railroad.Status || railroad._status || '';
                  const ownership = railroad.ownership || railroad.OWNERSHIP || railroad.Ownership || railroad._ownership || '';
                  const operator = railroad.operator || railroad.OPERATOR || railroad.Operator || railroad._operator || '';
                  const lengthMiles = railroad.length_miles || railroad.LENGTH_MILES || railroad.LengthMiles || railroad._length_miles || railroad.length || railroad.LENGTH || null;

                  // Create polyline with brown color for railroads
                  // Use different color/style for active vs abandoned
                  const isActive = status && status.toLowerCase().includes('active');
                  const color = isActive ? '#92400e' : '#78716c'; // Brown for active, gray-brown for abandoned
                  const weight = isActive ? 4 : 3;
                  const opacity = isActive ? 0.8 : 0.6;

                  const polyline = L.polyline(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    smoothFactor: 1
                  });

                  // Build popup content with all railroad attributes
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🚂 ${railroadName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${status ? `<div><strong>Status:</strong> ${status}</div>` : ''}
                        ${ownership ? `<div><strong>Ownership:</strong> ${ownership}</div>` : ''}
                        ${operator ? `<div><strong>Operator:</strong> ${operator}</div>` : ''}
                        ${lengthMiles !== null && lengthMiles !== undefined ? `<div><strong>Length:</strong> ${lengthMiles} miles</div>` : ''}
                        ${railroad.distance_miles !== null && railroad.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${railroad.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all railroad attributes (excluding internal fields)
                  const excludeFields = ['name', 'status', 'ownership', 'operator', 'length_miles', 'length', 'geometry', 'distance_miles'];
                  Object.entries(railroad).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polyline.bindPopup(popupContent, { maxWidth: 400 });
                  polyline.addTo(poi);
                  bounds.extend(polyline.getBounds());
                });
              }
            } catch (error) {
              console.error('Error drawing NH Railroad polyline:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (railroadCount > 0) {
          if (!legendAccumulator['nh_railroads']) {
            legendAccumulator['nh_railroads'] = {
              icon: '🚂',
              color: '#92400e',
              title: 'NH Railroads',
              count: 0,
            };
          }
          legendAccumulator['nh_railroads'].count += railroadCount;
        }
      }

      // Draw NH Transmission/Pipelines as polylines on the map
      if (enrichments.nh_transmission_pipelines_all && Array.isArray(enrichments.nh_transmission_pipelines_all)) {
        let tpCount = 0;
        enrichments.nh_transmission_pipelines_all.forEach((tp: any) => {
          if (tp.geometry && tp.geometry.paths) {
            try {
              // Convert ESRI polyline paths to Leaflet LatLng arrays
              // ESRI polylines have paths (array of coordinate arrays)
              const paths = tp.geometry.paths;
              if (paths && paths.length > 0) {
                tpCount++;
                // For each path in the polyline, create a separate polyline
                paths.forEach((path: number[][]) => {
                  const latlngs = path.map((coord: number[]) => {
                    // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                    // Since we requested outSR=4326, coordinates should already be in WGS84
                    // Convert [lon, lat] to [lat, lon] for Leaflet
                    return [coord[1], coord[0]] as [number, number];
                  });

                  const tpType = tp.type || tp.TYPE || tp.Type || tp._type || tp.pipeline_type || tp.PIPELINE_TYPE || 'Unknown Type';
                  const pia = tp.pia || tp.PIA || tp._pia || null;
                  const granitid = tp.granitid || tp.GRANITID || tp.GranitId || tp._granitid || null;

                  // Create polyline with orange color for transmission/pipelines
                  const polyline = L.polyline(latlngs, {
                    color: '#f97316', // Orange color for transmission/pipelines
                    weight: 3,
                    opacity: 0.7,
                    smoothFactor: 1
                  });

                  // Build popup content with all transmission/pipeline attributes
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ⚡ ${tpType || 'Transmission/Pipeline'}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${tpType ? `<div><strong>Type:</strong> ${tpType}</div>` : ''}
                        ${pia !== null && pia !== undefined ? `<div><strong>PIA:</strong> ${pia}</div>` : ''}
                        ${granitid ? `<div><strong>GRANIT ID:</strong> ${granitid}</div>` : ''}
                        ${tp.distance_miles !== null && tp.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${tp.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all transmission/pipeline attributes (excluding internal fields)
                  const excludeFields = ['type', 'pia', 'granitid', 'geometry', 'distance_miles'];
                  Object.entries(tp).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polyline.bindPopup(popupContent, { maxWidth: 400 });
                  polyline.addTo(poi);
                  bounds.extend(polyline.getBounds());
                });
              }
            } catch (error) {
              console.error('Error drawing NH Transmission/Pipeline polyline:', error);
            }
          } else {
          }
        });
        
        
        // Add to legend accumulator
        if (tpCount > 0) {
          if (!legendAccumulator['nh_transmission_pipelines']) {
            legendAccumulator['nh_transmission_pipelines'] = {
              icon: '⚡',
              color: '#f97316',
              title: 'NH Transmission/Pipelines',
              count: 0,
            };
          }
          legendAccumulator['nh_transmission_pipelines'].count += tpCount;
        }
      } else {
      }

      // Draw NH Cell Towers as markers on the map
      if (enrichments.nh_cell_towers_all && Array.isArray(enrichments.nh_cell_towers_all)) {
        let cellTowerCount = 0;
        enrichments.nh_cell_towers_all.forEach((tower: any) => {
          if (tower.lat && tower.lon) {
            try {
              cellTowerCount++;
              const towerLat = tower.lat;
              const towerLon = tower.lon;
              const entityName = tower.entity_name || tower.ENTITY_NAM || tower.EntityName || tower._entity_nam || tower.owner || tower.OWNER || 'Unknown Cell Tower';
              const structureType = tower.structure_type || tower.STRUCTURE_TYPE || tower.StrTyp || tower.str_typ || tower.STR_TYP || tower._str_typ || 'Unknown Type';
              const city = tower.city || tower.CITY || tower.City || tower._city || tower.gismunic || tower.GISMUNIC || '';
              const address = tower.address || tower.ADDRESS || tower.Address || tower.street || tower.STREET || tower.str_street || tower.STR_STREET || '';
              
              // Create a custom icon for cell towers
              const icon = createPOIIcon('📡', '#8b5cf6'); // Purple icon for cell towers
              
              const marker = L.marker([towerLat, towerLon], { icon });
              
              // Build popup content with all cell tower attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    📡 ${entityName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${structureType ? `<div><strong>Structure Type:</strong> ${structureType}</div>` : ''}
                    ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                    ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                    ${tower.height_above_ground_ft !== null && tower.height_above_ground_ft !== undefined ? `<div><strong>Height Above Ground:</strong> ${tower.height_above_ground_ft} ft</div>` : ''}
                    ${tower.elevation_ft !== null && tower.elevation_ft !== undefined ? `<div><strong>Elevation:</strong> ${tower.elevation_ft} ft</div>` : ''}
                    ${tower.distance_miles !== null && tower.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${tower.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all cell tower attributes (excluding internal fields)
              const excludeFields = ['entity_name', 'structure_type', 'city', 'state', 'address', 'height_above_ground_ft', 'elevation_ft', 'lat', 'lon', 'distance_miles'];
              Object.entries(tower).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this cell tower
              bounds.extend([towerLat, towerLon]);
            } catch (error) {
              console.error('Error drawing NH Cell Tower marker:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (cellTowerCount > 0) {
          if (!legendAccumulator['nh_cell_towers']) {
            legendAccumulator['nh_cell_towers'] = {
              icon: '📡',
              color: '#8b5cf6',
              title: 'NH Personal Wireless Service Facilities',
              count: 0,
            };
          }
          legendAccumulator['nh_cell_towers'].count += cellTowerCount;
        }
      }

      // Draw NH Underground Storage Tank Sites as markers on the map
      if (enrichments.nh_underground_storage_tanks_all && Array.isArray(enrichments.nh_underground_storage_tanks_all)) {
        let ustCount = 0;
        enrichments.nh_underground_storage_tanks_all.forEach((site: any) => {
          if (site.lat && site.lon) {
            try {
              ustCount++;
              const siteLat = site.lat;
              const siteLon = site.lon;
              const facilityName = site.facility_name || site.FACILITY_NAME || site.FacilityName || site._facility_name || site.name || site.NAME || site.Name || 'Unknown Facility';
              const facilityAddress = site.facility_address || site.FACILITY_ADDRESS || site.FacilityAddress || site._facility_address || site.address || site.ADDRESS || site.Address || site.street || site.STREET || '';
              const city = site.city || site.CITY || site.City || site._city || site.gismunic || site.GISMUNIC || '';
              const tankCount = site.tank_count || site.TANK_COUNT || site.TankCount || site._tank_count || site.num_tanks || site.NUM_TANKS || site.count || site.COUNT || null;
              
              // Create a custom icon for UST sites
              const icon = createPOIIcon('🛢️', '#dc2626'); // Red icon for UST sites
              
              const marker = L.marker([siteLat, siteLon], { icon });
              
              // Build popup content with all UST site attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🛢️ ${facilityName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${facilityAddress ? `<div><strong>Address:</strong> ${facilityAddress}</div>` : ''}
                    ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                    ${tankCount !== null && tankCount !== undefined ? `<div><strong>Tank Count:</strong> ${tankCount}</div>` : ''}
                    ${site.distance_miles !== null && site.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${site.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all UST site attributes (excluding internal fields)
              const excludeFields = ['facility_name', 'facility_address', 'city', 'state', 'tank_count', 'lat', 'lon', 'distance_miles'];
              Object.entries(site).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this UST site
              bounds.extend([siteLat, siteLon]);
            } catch (error) {
              console.error('Error drawing NH Underground Storage Tank Site marker:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (ustCount > 0) {
          if (!legendAccumulator['nh_underground_storage_tanks']) {
            legendAccumulator['nh_underground_storage_tanks'] = {
              icon: '🛢️',
              color: '#dc2626',
              title: 'NH Underground Storage Tank Sites',
              count: 0,
            };
          }
          legendAccumulator['nh_underground_storage_tanks'].count += ustCount;
        }
      }

      // Draw NH Water Well Inventory as markers on the map
      if (enrichments.nh_water_wells_all && Array.isArray(enrichments.nh_water_wells_all)) {
        let wellCount = 0;
        enrichments.nh_water_wells_all.forEach((well: any) => {
          if (well.lat && well.lon) {
            try {
              wellCount++;
              const wellLat = well.lat;
              const wellLon = well.lon;
              const wellId = well.well_id || well.WELL_ID || well.WellId || well._well_id || well.id || well.ID || well.Id || well.objectid || well.OBJECTID || 'Unknown Well';
              const ownerName = well.owner_name || well.OWNER_NAME || well.OwnerName || well._owner_name || well.owner || well.OWNER || well.Owner || '';
              const address = well.address || well.ADDRESS || well.Address || well._address || well.street || well.STREET || well.street_address || well.STREET_ADDRESS || '';
              const city = well.city || well.CITY || well.City || well._city || well.gismunic || well.GISMUNIC || well.municipality || well.MUNICIPALITY || '';
              const wellDepthFt = well.well_depth_ft || well.WELL_DEPTH_FT || well.WellDepthFt || well._well_depth_ft || well.depth || well.DEPTH || well.well_depth || well.WELL_DEPTH || null;
              const waterDepthFt = well.water_depth_ft || well.WATER_DEPTH_FT || well.WaterDepthFt || well._water_depth_ft || well.water_depth || well.WATER_DEPTH || well.static_water_level || well.STATIC_WATER_LEVEL || null;
              
              // Create a custom icon for water wells
              const icon = createPOIIcon('💧', '#0284c7'); // Blue icon for water wells
              
              const marker = L.marker([wellLat, wellLon], { icon });
              
              // Build popup content with all water well attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    💧 Well ID: ${wellId ? String(wellId) : 'Unknown'}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${ownerName ? `<div><strong>Owner:</strong> ${ownerName}</div>` : ''}
                    ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                    ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                    ${wellDepthFt !== null && wellDepthFt !== undefined ? `<div><strong>Well Depth:</strong> ${wellDepthFt} ft</div>` : ''}
                    ${waterDepthFt !== null && waterDepthFt !== undefined ? `<div><strong>Water Depth:</strong> ${waterDepthFt} ft</div>` : ''}
                    ${well.distance_miles !== null && well.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${well.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all water well attributes (excluding internal fields)
              const excludeFields = ['well_id', 'owner_name', 'address', 'city', 'state', 'well_depth_ft', 'water_depth_ft', 'lat', 'lon', 'distance_miles'];
              Object.entries(well).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this water well
              bounds.extend([wellLat, wellLon]);
            } catch (error) {
              console.error('Error drawing NH Water Well marker:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (wellCount > 0) {
          if (!legendAccumulator['nh_water_wells']) {
            legendAccumulator['nh_water_wells'] = {
              icon: '💧',
              color: '#0284c7',
              title: 'NH Water Well Inventory',
              count: 0,
            };
          }
          legendAccumulator['nh_water_wells'].count += wellCount;
        }
      }

      // Draw NH Public Water Supply Wells as markers on the map
      if (enrichments.nh_public_water_supply_wells_all && Array.isArray(enrichments.nh_public_water_supply_wells_all)) {
        let publicWellCount = 0;
        enrichments.nh_public_water_supply_wells_all.forEach((well: any) => {
          if (well.lat && well.lon) {
            try {
              publicWellCount++;
              const wellLat = well.lat;
              const wellLon = well.lon;
              const wellId = well.well_id || well.WELL_ID || well.WellId || well._well_id || well.id || well.ID || well.Id || well.objectid || well.OBJECTID || 'Unknown Well';
              const facilityName = well.facility_name || well.FACILITY_NAME || well.FacilityName || well._facility_name || well.name || well.NAME || well.Name || '';
              const ownerName = well.owner_name || well.OWNER_NAME || well.OwnerName || well._owner_name || well.owner || well.OWNER || well.Owner || '';
              const address = well.address || well.ADDRESS || well.Address || well._address || well.street || well.STREET || well.street_address || well.STREET_ADDRESS || '';
              const city = well.city || well.CITY || well.City || well._city || well.gismunic || well.GISMUNIC || well.municipality || well.MUNICIPALITY || '';
              const wellDepthFt = well.well_depth_ft || well.WELL_DEPTH_FT || well.WellDepthFt || well._well_depth_ft || well.depth || well.DEPTH || well.well_depth || well.WELL_DEPTH || null;
              const waterDepthFt = well.water_depth_ft || well.WATER_DEPTH_FT || well.WaterDepthFt || well._water_depth_ft || well.water_depth || well.WATER_DEPTH || well.static_water_level || well.STATIC_WATER_LEVEL || null;
              
              // Create a custom icon for public water supply wells
              const icon = createPOIIcon('🚰', '#0ea5e9'); // Sky blue icon for public water supply wells
              
              const marker = L.marker([wellLat, wellLon], { icon });
              
              // Build popup content with all public water supply well attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🚰 ${facilityName || (wellId ? `Well ID: ${String(wellId)}` : 'Public Water Supply Well')}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${ownerName ? `<div><strong>Owner:</strong> ${ownerName}</div>` : ''}
                    ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                    ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                    ${wellId ? `<div><strong>Well ID:</strong> ${String(wellId)}</div>` : ''}
                    ${wellDepthFt !== null && wellDepthFt !== undefined ? `<div><strong>Well Depth:</strong> ${wellDepthFt} ft</div>` : ''}
                    ${waterDepthFt !== null && waterDepthFt !== undefined ? `<div><strong>Water Depth:</strong> ${waterDepthFt} ft</div>` : ''}
                    ${well.distance_miles !== null && well.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${well.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all public water supply well attributes (excluding internal fields)
              const excludeFields = ['well_id', 'facility_name', 'owner_name', 'address', 'city', 'state', 'well_depth_ft', 'water_depth_ft', 'lat', 'lon', 'distance_miles'];
              Object.entries(well).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this public water supply well
              bounds.extend([wellLat, wellLon]);
            } catch (error) {
              console.error('Error drawing NH Public Water Supply Well marker:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (publicWellCount > 0) {
          if (!legendAccumulator['nh_public_water_supply_wells']) {
            legendAccumulator['nh_public_water_supply_wells'] = {
              icon: '🚰',
              color: '#0ea5e9',
              title: 'NH Public Water Supply Wells',
              count: 0,
            };
          }
          legendAccumulator['nh_public_water_supply_wells'].count += publicWellCount;
        }
      }

      // Draw NH Remediation Sites as markers on the map
      if (enrichments.nh_remediation_sites_all && Array.isArray(enrichments.nh_remediation_sites_all)) {
        let remediationCount = 0;
        enrichments.nh_remediation_sites_all.forEach((site: any) => {
          if (site.lat && site.lon) {
            try {
              remediationCount++;
              const siteLat = site.lat;
              const siteLon = site.lon;
              const siteId = site.site_id || site.SITE_ID || site.SiteId || site._site_id || site.id || site.ID || site.Id || site.objectid || site.OBJECTID || 'Unknown Site';
              const siteName = site.site_name || site.SITE_NAME || site.SiteName || site._site_name || site.name || site.NAME || site.Name || '';
              const facilityName = site.facility_name || site.FACILITY_NAME || site.FacilityName || site._facility_name || site.facility || site.FACILITY || '';
              const address = site.address || site.ADDRESS || site.Address || site._address || site.street || site.STREET || site.street_address || site.STREET_ADDRESS || '';
              const city = site.city || site.CITY || site.City || site._city || site.gismunic || site.GISMUNIC || site.municipality || site.MUNICIPALITY || '';
              const siteStatus = site.site_status || site.SITE_STATUS || site.SiteStatus || site._site_status || site.status || site.STATUS || site.Status || '';
              
              // Create a custom icon for remediation sites
              const icon = createPOIIcon('🔧', '#f59e0b'); // Amber/orange icon for remediation sites
              
              const marker = L.marker([siteLat, siteLon], { icon });
              
              // Build popup content with all remediation site attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🔧 ${siteName || facilityName || (siteId ? `Site ID: ${String(siteId)}` : 'Remediation Site')}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${siteId ? `<div><strong>Site ID:</strong> ${String(siteId)}</div>` : ''}
                    ${facilityName ? `<div><strong>Facility:</strong> ${facilityName}</div>` : ''}
                    ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                    ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                    ${siteStatus ? `<div><strong>Status:</strong> ${siteStatus}</div>` : ''}
                    ${site.distance_miles !== null && site.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${site.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all remediation site attributes (excluding internal fields)
              const excludeFields = ['site_id', 'site_name', 'facility_name', 'address', 'city', 'state', 'site_status', 'lat', 'lon', 'distance_miles'];
              Object.entries(site).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this remediation site
              bounds.extend([siteLat, siteLon]);
            } catch (error) {
              console.error('Error drawing NH Remediation Site marker:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (remediationCount > 0) {
          if (!legendAccumulator['nh_remediation_sites']) {
            legendAccumulator['nh_remediation_sites'] = {
              icon: '🔧',
              color: '#f59e0b',
              title: 'NH Remediation Sites',
              count: 0,
            };
          }
          legendAccumulator['nh_remediation_sites'].count += remediationCount;
        }
      }

      // Draw NH Automobile Salvage Yards as markers on the map
      if (enrichments.nh_automobile_salvage_yards_all && Array.isArray(enrichments.nh_automobile_salvage_yards_all)) {
        let salvageYardCount = 0;
        enrichments.nh_automobile_salvage_yards_all.forEach((yard: any) => {
          if (yard.lat && yard.lon) {
            try {
              salvageYardCount++;
              const yardLat = yard.lat;
              const yardLon = yard.lon;
              const facilityId = yard.facility_id || yard.FACILITY_ID || yard.FacilityId || yard._facility_id || yard.id || yard.ID || yard.Id || 'Unknown Facility';
              const siteName = yard.site_name || yard.SITE_NAME || yard.SiteName || yard._site_name || yard.name || yard.NAME || yard.Name || '';
              const address = yard.address || yard.ADDRESS || yard.Address || yard._address || yard.street || yard.STREET || '';
              const address2 = yard.address2 || yard.ADD2 || yard.Add2 || yard._add2 || yard.address2 || yard.ADDRESS2 || yard.Address2 || '';
              const town = yard.town || yard.TOWN || yard.Town || yard._town || yard.city || yard.CITY || yard.City || yard.municipality || yard.MUNICIPALITY || '';
              const status = yard.status || yard.STATUS || yard.Status || yard._status || yard.site_status || yard.SITE_STATUS || '';
              const onestopLink = yard.onestop_link || yard.ONESTOP_LINK || yard.OneStopLink || yard._onestop_link || '';
              
              // Create a custom icon for automobile salvage yards
              const icon = createPOIIcon('🚗', '#ef4444'); // Red icon for salvage yards
              
              const marker = L.marker([yardLat, yardLon], { icon });
              
              // Build popup content with all salvage yard attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🚗 ${siteName || (facilityId ? `Facility ID: ${String(facilityId)}` : 'Automobile Salvage Yard')}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${facilityId ? `<div><strong>Facility ID:</strong> ${String(facilityId)}</div>` : ''}
                    ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                    ${address2 ? `<div><strong>Address 2:</strong> ${address2}</div>` : ''}
                    ${town ? `<div><strong>Town:</strong> ${town}</div>` : ''}
                    ${status ? `<div><strong>Status:</strong> ${status}</div>` : ''}
                    ${onestopLink ? `<div><strong>OneStop Link:</strong> <a href="${onestopLink}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">View Details</a></div>` : ''}
                    ${yard.distance_miles !== null && yard.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${yard.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all salvage yard attributes (excluding internal fields)
              const excludeFields = ['facility_id', 'site_name', 'address', 'address2', 'town', 'state', 'status', 'onestop_link', 'lat', 'lon', 'distance_miles'];
              Object.entries(yard).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this salvage yard
              bounds.extend([yardLat, yardLon]);
            } catch (error) {
              console.error('Error drawing NH Automobile Salvage Yard marker:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (salvageYardCount > 0) {
          if (!legendAccumulator['nh_automobile_salvage_yards']) {
            legendAccumulator['nh_automobile_salvage_yards'] = {
              icon: '🚗',
              color: '#ef4444',
              title: 'NH Automobile Salvage Yards',
              count: 0,
            };
          }
          legendAccumulator['nh_automobile_salvage_yards'].count += salvageYardCount;
        }
      }

      // Draw NH Solid Waste Facilities as markers on the map
      if (enrichments.nh_solid_waste_facilities_all && Array.isArray(enrichments.nh_solid_waste_facilities_all)) {
        let facilityCount = 0;
        enrichments.nh_solid_waste_facilities_all.forEach((facility: any) => {
          if (facility.lat && facility.lon) {
            try {
              facilityCount++;
              const facilityLat = facility.lat;
              const facilityLon = facility.lon;
              const swfLid = facility.swf_lid || facility.SWF_LID || facility.SwfLid || facility._swf_lid || facility.facility_id || facility.FACILITY_ID || facility.id || facility.ID || facility.Id || 'Unknown Facility';
              const swfName = facility.swf_name || facility.SWF_NAME || facility.SwfName || facility._swf_name || facility.name || facility.NAME || facility.Name || '';
              const swfType = facility.swf_type || facility.SWF_TYPE || facility.SwfType || facility._swf_type || facility.type || facility.TYPE || facility.Type || '';
              const swfStatus = facility.swf_status || facility.SWF_STATUS || facility.SwfStatus || facility._swf_status || facility.status || facility.STATUS || facility.Status || '';
              const swfPermit = facility.swf_permit || facility.SWF_PERMIT || facility.SwfPermit || facility._swf_permit || facility.permit || facility.PERMIT || '';
              const address = facility.address || facility.ADDRESS || facility.Address || facility._address || facility.swf_add_1 || facility.SWF_ADD_1 || facility.street || facility.STREET || '';
              const address2 = facility.address2 || facility.ADDRESS2 || facility.Address2 || facility._address2 || facility.swf_add_2 || facility.SWF_ADD_2 || facility.add2 || facility.ADD2 || '';
              const city = facility.city || facility.CITY || facility.City || facility._city || facility.swf_city || facility.SWF_CITY || facility.town || facility.TOWN || facility.municipality || facility.MUNICIPALITY || '';
              const onestopLink = facility.onestop_link || facility.ONESTOP_LINK || facility.OneStopLink || facility._onestop_link || '';
              
              // Create a custom icon for solid waste facilities
              const icon = createPOIIcon('🗑️', '#16a34a'); // Green icon for solid waste facilities
              
              const marker = L.marker([facilityLat, facilityLon], { icon });
              
              // Build popup content with all solid waste facility attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🗑️ ${swfName || (swfLid ? `Facility ID: ${String(swfLid)}` : 'Solid Waste Facility')}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${swfLid ? `<div><strong>Facility ID:</strong> ${String(swfLid)}</div>` : ''}
                    ${swfType ? `<div><strong>Type:</strong> ${swfType}</div>` : ''}
                    ${swfStatus ? `<div><strong>Status:</strong> ${swfStatus}</div>` : ''}
                    ${swfPermit ? `<div><strong>Permit:</strong> ${swfPermit}</div>` : ''}
                    ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                    ${address2 ? `<div><strong>Address 2:</strong> ${address2}</div>` : ''}
                    ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                    ${onestopLink ? `<div><strong>OneStop Link:</strong> <a href="${onestopLink}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">View Details</a></div>` : ''}
                    ${facility.distance_miles !== null && facility.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${facility.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all solid waste facility attributes (excluding internal fields)
              const excludeFields = ['swf_lid', 'swf_name', 'swf_type', 'swf_status', 'swf_permit', 'address', 'address2', 'city', 'state', 'onestop_link', 'lat', 'lon', 'distance_miles'];
              Object.entries(facility).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this solid waste facility
              bounds.extend([facilityLat, facilityLon]);
            } catch (error) {
              console.error('Error drawing NH Solid Waste Facility marker:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (facilityCount > 0) {
          if (!legendAccumulator['nh_solid_waste_facilities']) {
            legendAccumulator['nh_solid_waste_facilities'] = {
              icon: '🗑️',
              color: '#16a34a',
              title: 'NH Solid Waste Facilities',
              count: 0,
            };
          }
          legendAccumulator['nh_solid_waste_facilities'].count += facilityCount;
        }
      }

      // Draw NH Source Water Protection Area polygon on the map
      if (enrichments.nh_source_water_protection_area_geometry) {
        try {
          const geometry = enrichments.nh_source_water_protection_area_geometry;
          if (geometry && geometry.rings) {
            // Convert ESRI polygon rings to Leaflet LatLng array
            // ESRI polygons have rings (outer ring + holes), we'll use the first ring (outer boundary)
            const rings = geometry.rings;
            if (rings && rings.length > 0) {
              const outerRing = rings[0]; // First ring is the outer boundary
              const latlngs = outerRing.map((coord: number[]) => {
                // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                // Since we requested outSR=4326, coordinates should already be in WGS84
                // Convert [lon, lat] to [lat, lon] for Leaflet
                return [coord[1], coord[0]] as [number, number];
              });

              const name = enrichments.nh_source_water_protection_area_name || 'Source Water Protection Area';
              const systemId = enrichments.nh_source_water_protection_area_system_id;
              const allid = enrichments.nh_source_water_protection_area_allid;
              const address = enrichments.nh_source_water_protection_area_address;
              const town = enrichments.nh_source_water_protection_area_town;
              const systemAct = enrichments.nh_source_water_protection_area_system_act;
              const systemTyp = enrichments.nh_source_water_protection_area_system_typ;
              const systemCat = enrichments.nh_source_water_protection_area_system_cat;
              const population = enrichments.nh_source_water_protection_area_population;
              const dwpaType = enrichments.nh_source_water_protection_area_dwpa_type;
              const dwpaRad = enrichments.nh_source_water_protection_area_dwpa_rad;

              // Create polygon with blue color for water protection areas
              const polygon = L.polygon(latlngs, {
                color: '#0284c7', // Blue color for water protection areas
                weight: 3,
                opacity: 0.7,
                fillColor: '#0284c7',
                fillOpacity: 0.2
              });

              // Build popup content with all protection area attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    💧 ${name}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${systemId ? `<div><strong>System ID:</strong> ${String(systemId)}</div>` : ''}
                    ${allid ? `<div><strong>ALLID:</strong> ${String(allid)}</div>` : ''}
                    ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                    ${town ? `<div><strong>Town:</strong> ${town}</div>` : ''}
                    ${systemAct ? `<div><strong>System Activity:</strong> ${systemAct}</div>` : ''}
                    ${systemTyp ? `<div><strong>System Type:</strong> ${systemTyp}</div>` : ''}
                    ${systemCat ? `<div><strong>System Category:</strong> ${systemCat}</div>` : ''}
                    ${population !== null && population !== undefined ? `<div><strong>Population:</strong> ${population.toLocaleString()}</div>` : ''}
                    ${dwpaType ? `<div><strong>DWPA Type:</strong> ${dwpaType}</div>` : ''}
                    ${dwpaRad !== null && dwpaRad !== undefined ? `<div><strong>DWPA Radius:</strong> ${dwpaRad}</div>` : ''}
                  </div>
                </div>
              `;

              polygon.bindPopup(popupContent, { maxWidth: 400 });
              polygon.addTo(primary); // Add to primary layer group (like parcels)
              bounds.extend(polygon.getBounds());
              
              // Add to legend accumulator
              if (!legendAccumulator['nh_source_water_protection_areas']) {
                legendAccumulator['nh_source_water_protection_areas'] = {
                  icon: '💧',
                  color: '#0284c7',
                  title: 'NH Source Water Protection Area',
                  count: 1,
                };
              }
            }
          }
        } catch (error) {
          console.error('Error drawing NH Source Water Protection Area polygon:', error);
        }
      }

      // Draw NH NWI Plus wetlands as polygons on the map
      // Priority: Draw from nh_nwi_plus_all array if it exists (proximity query with radius)
      // Otherwise, draw from nh_nwi_plus_geometry (point-in-polygon only, no radius)
      if (enrichments.nh_nwi_plus_all && Array.isArray(enrichments.nh_nwi_plus_all)) {
        enrichments.nh_nwi_plus_all.forEach((wetland: any) => {
          if (wetland.geometry && wetland.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              // ESRI polygons have rings (outer ring + holes), we'll use the first ring (outer boundary)
              const rings = wetland.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  // Since we requested outSR=4326, coordinates should already be in WGS84
                  // Convert [lon, lat] to [lat, lon] for Leaflet
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = wetland.isContaining;
                const color = isContaining ? '#14b8a6' : '#06b6d4'; // Teal for containing, cyan for nearby
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                // Build popup content with all wetland attributes
                const wetlandId = wetland.wetland_id;
                const wetlandType = wetland.wetland_type;
                const wetlandClass = wetland.wetland_class;
                const distance = wetland.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ${isContaining ? '🌊 Containing Wetland' : '🌊 Nearby Wetland'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; max-height: 400px; overflow-y: auto;">
                `;
                
                // Add wetland ID, type, class, and distance
                if (wetlandId) {
                  popupContent += `<div style="margin-bottom: 4px;"><strong>Wetland ID:</strong> ${String(wetlandId)}</div>`;
                }
                if (wetlandType) {
                  popupContent += `<div style="margin-bottom: 4px;"><strong>Wetland Type:</strong> ${wetlandType}</div>`;
                }
                if (wetlandClass) {
                  popupContent += `<div style="margin-bottom: 4px;"><strong>Wetland Class:</strong> ${wetlandClass}</div>`;
                }
                if (distance !== null && distance !== undefined) {
                  popupContent += `<div style="margin-bottom: 4px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>`;
                }
                
                // Add all other wetland attributes (excluding internal fields)
                const excludeFields = ['wetland_id', 'wetland_type', 'wetland_class', 'isContaining', 'distance_miles', 'geometry'];
                Object.entries(wetland).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary); // Add to primary layer group
                bounds.extend(polygon.getBounds());
                
                // Add to legend accumulator
                if (!legendAccumulator['nh_nwi_plus']) {
                  legendAccumulator['nh_nwi_plus'] = {
                    icon: '🌊',
                    color: '#14b8a6',
                    title: 'NH NWI Plus Wetlands',
                    count: 0,
                  };
                }
                legendAccumulator['nh_nwi_plus'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing NH NWI Plus wetland polygon:', error);
            }
          }
        });
      } else if (enrichments.nh_nwi_plus_geometry && !enrichments.nh_nwi_plus_all) {
        // Fallback: Draw single wetland from point-in-polygon query (no radius, no _all array)
        // Only draw if nh_nwi_plus_all doesn't exist to avoid duplicates
      }

      // Draw NH SSURGO soils as polygons on the map (only the polygon containing the point)
      if (enrichments.nh_ssurgo_all && Array.isArray(enrichments.nh_ssurgo_all)) {
        enrichments.nh_ssurgo_all.forEach((soil: any) => {
          if (soil.geometry && soil.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              const rings = soil.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  return [coord[1], coord[0]] as [number, number];
                });

                // Brown color for soils
                const color = '#92400e';
                const weight = 3;
                const opacity = 0.8;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                // Build popup content with soil attributes
                const areasymbol = soil.areasymbol || 'N/A';
                const muname = soil.muname || 'N/A';
                const mukey = soil.mukey;
                const musym = soil.musym;
                const hydgrpdcd = soil.hydgrpdcd;
                const drclassdcd = soil.drclassdcd;
                const slopegradd = soil.slopegradd;
                const farmlndcl = soil.farmlndcl;
                const acres = soil.acres;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🌱 ${areasymbol} - ${muname}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${mukey ? `<div><strong>Map Unit Key:</strong> ${mukey}</div>` : ''}
                      ${musym ? `<div><strong>Map Unit Symbol:</strong> ${musym}</div>` : ''}
                      ${hydgrpdcd ? `<div><strong>Hydrologic Group:</strong> ${hydgrpdcd}</div>` : ''}
                      ${drclassdcd ? `<div><strong>Drainage Class:</strong> ${drclassdcd}</div>` : ''}
                      ${slopegradd !== null && slopegradd !== undefined ? `<div><strong>Slope Grade:</strong> ${slopegradd}%</div>` : ''}
                      ${farmlndcl ? `<div><strong>Farmland Classification:</strong> ${farmlndcl}</div>` : ''}
                      ${acres ? `<div><strong>Area:</strong> ${acres.toFixed(2)} acres</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all other soil attributes (excluding internal fields)
                const excludeFields = ['areasymbol', 'muname', 'mukey', 'musym', 'hydgrpdcd', 'drclassdcd', 'slopegradd', 'farmlndcl', 'acres', 'geometry', 'distance_miles', 'objectId'];
                Object.entries(soil).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary); // Add to primary layer group
                bounds.extend(polygon.getBounds());
                
                // Add to legend accumulator
                if (!legendAccumulator['nh_ssurgo']) {
                  legendAccumulator['nh_ssurgo'] = {
                    icon: '🌱',
                    color: '#92400e',
                    title: 'NH SSURGO Soils',
                    count: 0,
                  };
                }
                legendAccumulator['nh_ssurgo'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing NH SSURGO soil polygon:', error);
            }
          }
        });
      }

      // Draw NH Bedrock Geology formations as polygons on the map (only the polygon containing the point)
      if (enrichments.nh_bedrock_geology_all && Array.isArray(enrichments.nh_bedrock_geology_all)) {
        enrichments.nh_bedrock_geology_all.forEach((formation: any) => {
          if (formation.geometry && formation.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              const rings = formation.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  return [coord[1], coord[0]] as [number, number];
                });

                // Gray color for bedrock geology
                const color = '#6b7280';
                const weight = 3;
                const opacity = 0.8;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                // Build popup content with formation attributes
                const code = formation.code || 'N/A';
                const fullname = formation.fullname || '';
                const major = formation.major || '';
                const formation1 = formation.formation1 || '';
                const formation2 = formation.formation2 || '';
                const plutonAge = formation.pluton_age || '';
                const rockType = formation.rock_type || '';
                const geologicHistory = formation.geologichistory || '';
                const lithology = formation.lithology || '';
                const source = formation.source || '';

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🪨 ${code}${fullname ? ` - ${fullname}` : ''}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${major ? `<div><strong>Major:</strong> ${major}</div>` : ''}
                      ${formation1 ? `<div><strong>Formation 1:</strong> ${formation1}</div>` : ''}
                      ${formation2 ? `<div><strong>Formation 2:</strong> ${formation2}</div>` : ''}
                      ${plutonAge ? `<div><strong>Pluton Age:</strong> ${plutonAge}</div>` : ''}
                      ${rockType ? `<div><strong>Rock Type:</strong> ${rockType}</div>` : ''}
                      ${geologicHistory ? `<div><strong>Geologic History:</strong> ${geologicHistory}</div>` : ''}
                      ${lithology ? `<div><strong>Lithology:</strong> ${lithology}</div>` : ''}
                      ${source ? `<div><strong>Source:</strong> ${source}</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all other formation attributes (excluding internal fields)
                const excludeFields = ['code', 'major', 'formation1', 'formation2', 'pluton_age', 'rock_type', 'fullname', 'geologichistory', 'lithology', 'source', 'geometry', 'distance_miles', 'objectId'];
                Object.entries(formation).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary); // Add to primary layer group
                bounds.extend(polygon.getBounds());
                
                // Add to legend accumulator
                if (!legendAccumulator['nh_bedrock_geology']) {
                  legendAccumulator['nh_bedrock_geology'] = {
                    icon: '🪨',
                    color: '#6b7280',
                    title: 'NH Bedrock Geology',
                    count: 0,
                  };
                }
                legendAccumulator['nh_bedrock_geology'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing NH Bedrock Geology polygon:', error);
            }
          }
        });
      }

      // Draw DE State Forest polygons on the map
      if (enrichments.de_state_forest_all && Array.isArray(enrichments.de_state_forest_all)) {
        enrichments.de_state_forest_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => {
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = feature.isContaining;
                const color = isContaining ? '#16a34a' : '#22c55e';
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                const county = feature.COUNTY || feature.county || '';
                const acres = feature.ACRES || feature.acres;
                const tract = feature.TRACT || feature.tract || '';
                const forest = feature.FOREST || feature.forest || '';
                const label = feature.LABEL || feature.label || '';
                const distance = feature.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🌲 ${isContaining ? 'State Forest' : 'Nearby State Forest'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280;">
                      ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                      ${acres !== null && acres !== undefined ? `<div><strong>Acres:</strong> ${acres.toLocaleString()}</div>` : ''}
                      ${tract ? `<div><strong>Tract:</strong> ${tract}</div>` : ''}
                      ${forest ? `<div><strong>Forest:</strong> ${forest}</div>` : ''}
                      ${label ? `<div><strong>Label:</strong> ${label}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;

                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());

                if (!legendAccumulator['de_state_forest']) {
                  legendAccumulator['de_state_forest'] = {
                    icon: '🌲',
                    color: '#16a34a',
                    title: 'DE State Forest',
                    count: 0,
                  };
                }
                legendAccumulator['de_state_forest'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE State Forest polygon:', error);
            }
          }
        });
      }

      // Draw DE Pine Plantations polygons on the map
      if (enrichments.de_pine_plantations_all && Array.isArray(enrichments.de_pine_plantations_all)) {
        enrichments.de_pine_plantations_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => {
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = feature.isContaining;
                const color = isContaining ? '#15803d' : '#16a34a';
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                const acres = feature.ACRES || feature.acres;
                const distance = feature.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🌲 ${isContaining ? 'Pine Plantation' : 'Nearby Pine Plantation'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280;">
                      ${acres !== null && acres !== undefined ? `<div><strong>Acres:</strong> ${acres.toLocaleString()}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;

                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());

                if (!legendAccumulator['de_pine_plantations']) {
                  legendAccumulator['de_pine_plantations'] = {
                    icon: '🌲',
                    color: '#15803d',
                    title: 'DE Pine Plantations',
                    count: 0,
                  };
                }
                legendAccumulator['de_pine_plantations'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Pine Plantations polygon:', error);
            }
          }
        });
      }

      // Draw DE Urban Tree Canopy polygons on the map
      if (enrichments.de_urban_tree_canopy_all && Array.isArray(enrichments.de_urban_tree_canopy_all)) {
        enrichments.de_urban_tree_canopy_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => {
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = feature.isContaining;
                const color = isContaining ? '#22c55e' : '#4ade80';
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                const name = feature.NAME || feature.name || '';
                const totalAcres = feature.TOTALACRES || feature.totalAcres || feature.TotalAcres;
                const canopyAcres = feature.CANOPYACRES || feature.canopyAcres || feature.CanopyAcres;
                const canopyPercent = feature.CANOPYPERCENT || feature.canopyPercent || feature.CanopyPercent;
                const areaType = feature.AREATYPE || feature.areaType || feature.AreaType;
                const distance = feature.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🌳 ${isContaining ? 'Urban Tree Canopy' : 'Nearby Urban Tree Canopy'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280;">
                      ${name ? `<div><strong>Name:</strong> ${name}</div>` : ''}
                      ${totalAcres !== null && totalAcres !== undefined ? `<div><strong>Total Acres:</strong> ${totalAcres.toLocaleString()}</div>` : ''}
                      ${canopyAcres !== null && canopyAcres !== undefined ? `<div><strong>Canopy Acres:</strong> ${canopyAcres.toLocaleString()}</div>` : ''}
                      ${canopyPercent !== null && canopyPercent !== undefined ? `<div><strong>Canopy Percent:</strong> ${canopyPercent.toFixed(1)}%</div>` : ''}
                      ${areaType !== null && areaType !== undefined ? `<div><strong>Area Type:</strong> ${areaType === 0 ? 'Municipality' : areaType === 1 ? 'Community' : areaType === 2 ? 'Park' : areaType}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;

                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());

                if (!legendAccumulator['de_urban_tree_canopy']) {
                  legendAccumulator['de_urban_tree_canopy'] = {
                    icon: '🌳',
                    color: '#22c55e',
                    title: 'DE Urban Tree Canopy',
                    count: 0,
                  };
                }
                legendAccumulator['de_urban_tree_canopy'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Urban Tree Canopy polygon:', error);
            }
          }
        });
      }

      // Draw DE Forest Cover 2007 polygons on the map
      if (enrichments.de_forest_cover_2007_all && Array.isArray(enrichments.de_forest_cover_2007_all)) {
        enrichments.de_forest_cover_2007_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => {
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = feature.isContaining;
                const color = isContaining ? '#166534' : '#15803d';
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                const type = feature.TYPE || feature.type || '';
                const acres = feature.ACRES || feature.acres;
                const distance = feature.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🌲 ${isContaining ? 'Forest Cover 2007' : 'Nearby Forest Cover 2007'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280;">
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${acres !== null && acres !== undefined ? `<div><strong>Acres:</strong> ${acres.toLocaleString()}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;

                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());

                if (!legendAccumulator['de_forest_cover_2007']) {
                  legendAccumulator['de_forest_cover_2007'] = {
                    icon: '🌲',
                    color: '#166534',
                    title: 'DE Forest Cover 2007',
                    count: 0,
                  };
                }
                legendAccumulator['de_forest_cover_2007'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Forest Cover 2007 polygon:', error);
            }
          }
        });
      }

      // Draw DE No Build Points - Bay as markers
      if (enrichments.de_no_build_points_bay_all && Array.isArray(enrichments.de_no_build_points_bay_all)) {
        enrichments.de_no_build_points_bay_all.forEach((feature: any) => {
          if (feature.geometry) {
            try {
              const lat = feature.geometry.y || feature.LATITUDE;
              const lon = feature.geometry.x || feature.LONGITUDE;
              if (lat && lon) {
                const marker = L.marker([lat, lon], { icon: L.divIcon({ className: 'custom-marker', html: '🚫', iconSize: [20, 20] }) });
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>No Build Point - Bay</strong>${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                marker.bindPopup(popupContent);
                marker.addTo(poi);
                bounds.extend([lat, lon]);
                if (!legendAccumulator['de_no_build_points_bay']) {
                  legendAccumulator['de_no_build_points_bay'] = { icon: '🚫', color: '#ef4444', title: 'DE No Build Points - Bay', count: 0 };
                }
                legendAccumulator['de_no_build_points_bay'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE No Build Points Bay:', error);
            }
          }
        });
      }

      // Draw DE No Build Line - Bay as polylines
      if (enrichments.de_no_build_line_bay_all && Array.isArray(enrichments.de_no_build_line_bay_all)) {
        enrichments.de_no_build_line_bay_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.paths) {
            try {
              feature.geometry.paths.forEach((path: number[][]) => {
                const latlngs = path.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const polyline = L.polyline(latlngs, { color: '#ef4444', weight: 3, opacity: 0.8 });
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>No Build Line - Bay</strong>${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polyline.bindPopup(popupContent);
                polyline.addTo(primary);
                bounds.extend(polyline.getBounds());
              });
              if (!legendAccumulator['de_no_build_line_bay']) {
                legendAccumulator['de_no_build_line_bay'] = { icon: '🚫', color: '#ef4444', title: 'DE No Build Line - Bay', count: 0 };
              }
              legendAccumulator['de_no_build_line_bay'].count += 1;
            } catch (error) {
              console.error('Error drawing DE No Build Line Bay:', error);
            }
          }
        });
      }

      // Draw DE No Build Points - Ocean as markers
      if (enrichments.de_no_build_points_ocean_all && Array.isArray(enrichments.de_no_build_points_ocean_all)) {
        enrichments.de_no_build_points_ocean_all.forEach((feature: any) => {
          if (feature.geometry) {
            try {
              const lat = feature.geometry.y || feature.LATITUDE;
              const lon = feature.geometry.x || feature.LONGITUDE;
              if (lat && lon) {
                const marker = L.marker([lat, lon], { icon: L.divIcon({ className: 'custom-marker', html: '🚫', iconSize: [20, 20] }) });
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>No Build Point - Ocean</strong>${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                marker.bindPopup(popupContent);
                marker.addTo(poi);
                bounds.extend([lat, lon]);
                if (!legendAccumulator['de_no_build_points_ocean']) {
                  legendAccumulator['de_no_build_points_ocean'] = { icon: '🚫', color: '#ef4444', title: 'DE No Build Points - Ocean', count: 0 };
                }
                legendAccumulator['de_no_build_points_ocean'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE No Build Points Ocean:', error);
            }
          }
        });
      }

      // Draw DE No Build Line - Ocean as polylines
      if (enrichments.de_no_build_line_ocean_all && Array.isArray(enrichments.de_no_build_line_ocean_all)) {
        enrichments.de_no_build_line_ocean_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.paths) {
            try {
              feature.geometry.paths.forEach((path: number[][]) => {
                const latlngs = path.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const polyline = L.polyline(latlngs, { color: '#ef4444', weight: 3, opacity: 0.8 });
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>No Build Line - Ocean</strong>${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polyline.bindPopup(popupContent);
                polyline.addTo(primary);
                bounds.extend(polyline.getBounds());
              });
              if (!legendAccumulator['de_no_build_line_ocean']) {
                legendAccumulator['de_no_build_line_ocean'] = { icon: '🚫', color: '#ef4444', title: 'DE No Build Line - Ocean', count: 0 };
              }
              legendAccumulator['de_no_build_line_ocean'].count += 1;
            } catch (error) {
              console.error('Error drawing DE No Build Line Ocean:', error);
            }
          }
        });
      }

      // Draw DE Park Facilities as markers
      if (enrichments.de_park_facilities_all && Array.isArray(enrichments.de_park_facilities_all)) {
        enrichments.de_park_facilities_all.forEach((feature: any) => {
          if (feature.geometry) {
            try {
              const lat = feature.geometry.y || feature.LATITUDE;
              const lon = feature.geometry.x || feature.LONGITUDE;
              if (lat && lon) {
                const marker = L.marker([lat, lon], { icon: L.divIcon({ className: 'custom-marker', html: '🏞️', iconSize: [20, 20] }) });
                const park = feature.PARK || feature.park || '';
                const facility = feature.FACILITY || feature.facility || '';
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${park || 'Park Facility'}</strong>${facility ? `<br>Facility: ${facility}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                marker.bindPopup(popupContent);
                marker.addTo(poi);
                bounds.extend([lat, lon]);
                if (!legendAccumulator['de_park_facilities']) {
                  legendAccumulator['de_park_facilities'] = { icon: '🏞️', color: '#10b981', title: 'DE Park Facilities', count: 0 };
                }
                legendAccumulator['de_park_facilities'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Park Facilities:', error);
            }
          }
        });
      }

      // Draw DE Child Care Centers as markers
      if (enrichments.de_child_care_centers_all && Array.isArray(enrichments.de_child_care_centers_all)) {
        enrichments.de_child_care_centers_all.forEach((center: any) => {
          if (center.geometry) {
            try {
              const lat = center.geometry.y || center.LATITUDE || center.latitude;
              const lon = center.geometry.x || center.LONGITUDE || center.longitude;
              if (lat && lon) {
                const icon = createPOIIcon('🏫', '#f59e0b');
                const marker = L.marker([lat, lon], { icon });
                const name = center.name || center.RSR_RESO_1 || center.rsr_reso_1 || 'Child Care Center';
                const type = center.type || center.RSR_TYPE_T || center.rsr_type_t || '';
                const address = center.address || center.ADR_STREET || center.adr_street || '';
                const city = center.city || center.ADR_CITYNA || center.adr_cityna || '';
                const state = center.state || center.ADR_STAECO || center.adr_staeco || '';
                const zip = center.zip || center.ADR_ZIP || center.ZIPCODE || center.zipcode || '';
                const phone = center.phone || center.ADR_PHONE_ || center.adr_phone_ || '';
                const county = center.county || center.ADR_COUNTY || center.adr_county || '';
                const capacity = center.capacity || center.RSR_CPCT_N || center.rsr_cpct_n || null;
                const starLevel = center.starLevel || center.DSI_STAR_LEVEL || center.dsi_star_level || center.STARLEVEL || center.starlevel || null;
                const ageRange = center.ageRange || center.RSR_AGE_RA || center.rsr_age_ra || center.AGE_GROUP || center.age_group || '';
                const opens = center.opens || center.RSR_OPENS_ || center.rsr_opens_ || '';
                const closes = center.closes || center.RSR_CLOSES || center.rsr_closes || '';
                const distance = center.distance_miles;
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🏫 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      ${address ? `<div><strong>Address:</strong> ${address}${city ? `, ${city}` : ''}${state ? ` ${state}` : ''}${zip ? ` ${zip}` : ''}</div>` : ''}
                      ${phone ? `<div><strong>Phone:</strong> ${phone}</div>` : ''}
                      ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                      ${capacity !== null ? `<div><strong>Capacity:</strong> ${capacity}</div>` : ''}
                      ${starLevel !== null ? `<div><strong>Star Level:</strong> ${starLevel}</div>` : ''}
                      ${ageRange ? `<div><strong>Age Range:</strong> ${ageRange}</div>` : ''}
                      ${opens && closes ? `<div><strong>Hours:</strong> ${opens} - ${closes}</div>` : ''}
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                marker.addTo(poi);
                bounds.extend([lat, lon]);
                if (!legendAccumulator['de_child_care_centers']) {
                  legendAccumulator['de_child_care_centers'] = { icon: '🏫', color: '#f59e0b', title: 'DE Child Care Centers', count: 0 };
                }
                legendAccumulator['de_child_care_centers'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Child Care Center:', error);
            }
          }
        });
      }

      // Draw DE Fishing Access as markers
      if (enrichments.de_fishing_access_all && Array.isArray(enrichments.de_fishing_access_all)) {
        enrichments.de_fishing_access_all.forEach((access: any) => {
          if (access.geometry) {
            try {
              const lat = access.geometry.y || access.LATITUDE || access.latitude;
              const lon = access.geometry.x || access.LONGITUDE || access.longitude;
              if (lat && lon) {
                const icon = createPOIIcon('🎣', '#0284c7');
                const marker = L.marker([lat, lon], { icon });
                const name = access.name || access.GNIS_NAME || access.gnis_name || 'Fishing Access';
                const facility = access.facility || access.FACILITY || access.facility || '';
                const division = access.division || access.DIVISION || access.division || '';
                const county = access.county || access.COUNTY || access.county || '';
                const tidal = access.tidal || access.TIDAL || access.tidal || '';
                const distance = access.distance_miles;
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🎣 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${facility ? `<div><strong>Facility Type:</strong> ${facility}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      ${division ? `<div><strong>Division:</strong> ${division}</div>` : ''}
                      ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                      ${tidal ? `<div><strong>Tidal:</strong> ${tidal}</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                const excludeFields = ['accessId', 'name', 'GNIS_NAME', 'gnis_name', 'facility', 'FACILITY', 'division', 'DIVISION', 'county', 'COUNTY', 'tidal', 'TIDAL', 'geometry', 'distance_miles', 'OBJECTID', 'objectid'];
                Object.entries(access).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                marker.addTo(poi);
                bounds.extend([lat, lon]);
                if (!legendAccumulator['de_fishing_access']) {
                  legendAccumulator['de_fishing_access'] = { icon: '🎣', color: '#0284c7', title: 'DE Fishing Access', count: 0 };
                }
                legendAccumulator['de_fishing_access'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Fishing Access:', error);
            }
          }
        });
      }

      // Draw DE Trout Streams as polylines
      if (enrichments.de_trout_streams_all && Array.isArray(enrichments.de_trout_streams_all)) {
        let streamCount = 0;
        enrichments.de_trout_streams_all.forEach((stream: any) => {
          if (stream.geometry && stream.geometry.paths) {
            try {
              const paths = stream.geometry.paths;
              if (paths && paths.length > 0) {
                paths.forEach((path: number[][]) => {
                  const latlngs = path.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 2) {
                    console.warn('DE Trout Stream polyline has less than 2 coordinates, skipping');
                    return;
                  }

                  const waterBodyName = stream.waterBodyName || stream.WATERBODYNAME || stream.waterBodyName || 'Trout Stream';
                  const restriction = stream.restriction || stream.RESTRICTION || stream.restriction || '';
                  const description = stream.description || stream.DESCRIPTION || stream.description || '';
                  const gnisName = stream.gnisName || stream.GNIS_NAME || stream.gnis_name || '';
                  
                  // Use different colors based on restriction type
                  let color = '#0ea5e9'; // Default blue
                  if (restriction.includes('Fly Fishing Only')) {
                    color = '#fbbf24'; // Yellow for fly fishing only
                  }
                  
                  const polyline = L.polyline(latlngs, {
                    color: color,
                    weight: 3,
                    opacity: 0.8
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🐟 ${waterBodyName || 'Trout Stream'}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${restriction ? `<div><strong>Restriction:</strong> ${restriction}</div>` : ''}
                        ${stream.distance_miles !== null && stream.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${stream.distance_miles.toFixed(2)} miles</div>` : ''}
                        ${description ? `<div><strong>Description:</strong> ${description}</div>` : ''}
                        ${gnisName ? `<div><strong>GNIS Name:</strong> ${gnisName}</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['streamId', 'waterBodyName', 'WATERBODYNAME', 'restriction', 'RESTRICTION', 'description', 'DESCRIPTION', 'gnisName', 'GNIS_NAME', 'gnis_id', 'GNIS_ID', 'isContaining', 'geometry', 'distance_miles', 'OBJECTID', 'objectid'];
                  Object.entries(stream).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polyline.bindPopup(popupContent, { maxWidth: 400 });
                  polyline.addTo(poi);
                  
                  try {
                    bounds.extend(polyline.getBounds());
                    streamCount++;
                  } catch (boundsError) {
                    console.warn('Error extending bounds for DE Trout Stream polyline:', boundsError);
                  }
                });
              }
            } catch (error) {
              console.error('Error drawing DE Trout Stream:', error);
            }
          }
        });
        
        if (streamCount > 0) {
          if (!legendAccumulator['de_trout_streams']) {
            legendAccumulator['de_trout_streams'] = {
              icon: '🐟',
              color: '#0ea5e9',
              title: 'DE Trout Streams',
              count: 0,
            };
          }
          legendAccumulator['de_trout_streams'].count += streamCount;
        }
      }

      // Draw DE Public Schools as markers
      if (enrichments.de_public_schools_all && Array.isArray(enrichments.de_public_schools_all)) {
        enrichments.de_public_schools_all.forEach((school: any) => {
          if (school.geometry) {
            try {
              const lat = school.geometry.y || school.LATITUDE || school.latitude;
              const lon = school.geometry.x || school.LONGITUDE || school.longitude;
              if (lat && lon) {
                const icon = createPOIIcon('🏫', '#3b82f6');
                const marker = L.marker([lat, lon], { icon });
                const name = school.name || school.NAME || school.SCHOOL_NAME || school.school_name || 'Public School';
                const schoolType = school.schoolType || school.TYPE || school.SCHOOL_TYPE || school.school_type || '';
                const district = school.district || school.DISTRICT || school.DISTRICT_NAME || school.district_name || '';
                const address = school.address || school.ADDRESS || school.STREET || school.street || '';
                const city = school.city || school.CITY || '';
                const state = school.state || school.STATE || 'DE';
                const zip = school.zip || school.ZIP || school.ZIP_CODE || school.zip_code || '';
                const phone = school.phone || school.PHONE || school.TELEPHONE || school.telephone || '';
                const distance = school.distance_miles;
                const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🏫 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${schoolType ? `<div><strong>Type:</strong> ${schoolType}</div>` : ''}
                      ${district ? `<div><strong>District:</strong> ${district}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      ${fullAddress ? `<div><strong>Address:</strong> ${fullAddress}</div>` : ''}
                      ${phone ? `<div><strong>Phone:</strong> ${phone}</div>` : ''}
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                marker.addTo(poi);
                bounds.extend([lat, lon]);
                if (!legendAccumulator['de_public_schools']) {
                  legendAccumulator['de_public_schools'] = { icon: '🏫', color: '#3b82f6', title: 'DE Public Schools', count: 0 };
                }
                legendAccumulator['de_public_schools'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Public School:', error);
            }
          }
        });
      }

      // Draw DE Private Schools as markers
      if (enrichments.de_private_schools_all && Array.isArray(enrichments.de_private_schools_all)) {
        enrichments.de_private_schools_all.forEach((school: any) => {
          if (school.geometry) {
            try {
              const lat = school.geometry.y || school.LATITUDE || school.latitude;
              const lon = school.geometry.x || school.LONGITUDE || school.longitude;
              if (lat && lon) {
                const icon = createPOIIcon('🏛️', '#6366f1');
                const marker = L.marker([lat, lon], { icon });
                const name = school.name || school.NAME || school.SCHOOL_NAME || school.school_name || 'Private School';
                const schoolType = school.schoolType || school.TYPE || school.SCHOOL_TYPE || school.school_type || '';
                const district = school.district || school.DISTRICT || school.DISTRICT_NAME || school.district_name || '';
                const address = school.address || school.ADDRESS || school.STREET || school.street || '';
                const city = school.city || school.CITY || '';
                const state = school.state || school.STATE || 'DE';
                const zip = school.zip || school.ZIP || school.ZIP_CODE || school.zip_code || '';
                const phone = school.phone || school.PHONE || school.TELEPHONE || school.telephone || '';
                const distance = school.distance_miles;
                const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🏛️ ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${schoolType ? `<div><strong>Type:</strong> ${schoolType}</div>` : ''}
                      ${district ? `<div><strong>District:</strong> ${district}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      ${fullAddress ? `<div><strong>Address:</strong> ${fullAddress}</div>` : ''}
                      ${phone ? `<div><strong>Phone:</strong> ${phone}</div>` : ''}
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                marker.addTo(poi);
                bounds.extend([lat, lon]);
                if (!legendAccumulator['de_private_schools']) {
                  legendAccumulator['de_private_schools'] = { icon: '🏛️', color: '#6366f1', title: 'DE Private Schools', count: 0 };
                }
                legendAccumulator['de_private_schools'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Private School:', error);
            }
          }
        });
      }

      // Draw DE VoTech Districts as polygons
      if (enrichments.de_votech_districts_all && Array.isArray(enrichments.de_votech_districts_all)) {
        enrichments.de_votech_districts_all.forEach((district: any) => {
          if (district.geometry && district.geometry.rings) {
            try {
              const rings = district.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => {
                  return [coord[1], coord[0]] as [number, number];
                });

                if (latlngs.length < 3) {
                  console.warn('DE VoTech District polygon has less than 3 coordinates, skipping');
                  return;
                }

                const name = district.name || district.NAME || district.DISTRICT_NAME || district.district_name || 'VoTech District';
                const isContaining = district.isContaining || false;
                
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#5b21b6' : '#8b5cf6',
                  weight: 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#7c3aed' : '#a78bfa',
                  fillOpacity: 0.3
                });

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🎓 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      <div><strong>Type:</strong> VoTech School District</div>
                      ${isContaining ? '<div><strong>Status:</strong> Contains location</div>' : ''}
                    </div>
                  </div>
                `;

                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                
                try {
                  bounds.extend(polygon.getBounds());
                } catch (boundsError) {
                  console.warn('Error extending bounds for DE VoTech District:', boundsError);
                }
                
                if (!legendAccumulator['de_votech_districts']) {
                  legendAccumulator['de_votech_districts'] = {
                    icon: '🎓',
                    color: '#8b5cf6',
                    title: 'DE VoTech Districts',
                    count: 0,
                  };
                }
                legendAccumulator['de_votech_districts'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE VoTech District:', error);
            }
          }
        });
      }

      // Draw DE School Districts as polygons
      if (enrichments.de_school_districts_all && Array.isArray(enrichments.de_school_districts_all)) {
        enrichments.de_school_districts_all.forEach((district: any) => {
          if (district.geometry && district.geometry.rings) {
            try {
              const rings = district.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => {
                  return [coord[1], coord[0]] as [number, number];
                });

                if (latlngs.length < 3) {
                  console.warn('DE School District polygon has less than 3 coordinates, skipping');
                  return;
                }

                const name = district.name || district.NAME || district.DISTRICT_NAME || district.district_name || 'School District';
                const isContaining = district.isContaining || false;
                
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#5b21b6' : '#7c3aed',
                  weight: 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#6d28d9' : '#8b5cf6',
                  fillOpacity: 0.3
                });

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      📚 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      <div><strong>Type:</strong> Public School District</div>
                      ${isContaining ? '<div><strong>Status:</strong> Contains location</div>' : ''}
                    </div>
                  </div>
                `;

                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                
                try {
                  bounds.extend(polygon.getBounds());
                } catch (boundsError) {
                  console.warn('Error extending bounds for DE School District:', boundsError);
                }
                
                if (!legendAccumulator['de_school_districts']) {
                  legendAccumulator['de_school_districts'] = {
                    icon: '📚',
                    color: '#7c3aed',
                    title: 'DE School Districts',
                    count: 0,
                  };
                }
                legendAccumulator['de_school_districts'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE School District:', error);
            }
          }
        });
      }

      // Draw DE Wildlife Areas Stands Blinds and Fields as markers
      if (enrichments.de_stands_blinds_fields_all && Array.isArray(enrichments.de_stands_blinds_fields_all)) {
        enrichments.de_stands_blinds_fields_all.forEach((feature: any) => {
          if (feature.geometry) {
            try {
              const lat = feature.geometry.y || feature.LATITUDE || feature.latitude;
              const lon = feature.geometry.x || feature.LONGITUDE || feature.longitude;
              if (lat && lon) {
                const icon = createPOIIcon('🎯', '#16a34a');
                const marker = L.marker([lat, lon], { icon });
                const name = feature.name || feature.NAME || 'Stands/Blinds/Fields';
                const type = feature.type || feature.TYPE || '';
                const distance = feature.distance_miles;
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🎯 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                marker.addTo(poi);
                bounds.extend([lat, lon]);
                if (!legendAccumulator['de_stands_blinds_fields']) {
                  legendAccumulator['de_stands_blinds_fields'] = { icon: '🎯', color: '#16a34a', title: 'DE Wildlife Areas Stands Blinds Fields', count: 0 };
                }
                legendAccumulator['de_stands_blinds_fields'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Stands Blinds Fields:', error);
            }
          }
        });
      }

      // Draw DE Wildlife Areas Boat Ramps as markers
      if (enrichments.de_boat_ramps_all && Array.isArray(enrichments.de_boat_ramps_all)) {
        enrichments.de_boat_ramps_all.forEach((feature: any) => {
          if (feature.geometry) {
            try {
              const lat = feature.geometry.y || feature.LATITUDE || feature.latitude;
              const lon = feature.geometry.x || feature.LONGITUDE || feature.longitude;
              if (lat && lon) {
                const icon = createPOIIcon('🚤', '#0284c7');
                const marker = L.marker([lat, lon], { icon });
                const name = feature.name || feature.NAME || 'Boat Ramp';
                const type = feature.type || feature.TYPE || '';
                const distance = feature.distance_miles;
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🚤 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                marker.addTo(poi);
                bounds.extend([lat, lon]);
                if (!legendAccumulator['de_boat_ramps']) {
                  legendAccumulator['de_boat_ramps'] = { icon: '🚤', color: '#0284c7', title: 'DE Wildlife Areas Boat Ramps', count: 0 };
                }
                legendAccumulator['de_boat_ramps'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Boat Ramp:', error);
            }
          }
        });
      }

      // Draw DE Wildlife Areas Facilities as markers
      if (enrichments.de_facilities_all && Array.isArray(enrichments.de_facilities_all)) {
        enrichments.de_facilities_all.forEach((feature: any) => {
          if (feature.geometry) {
            try {
              const lat = feature.geometry.y || feature.LATITUDE || feature.latitude;
              const lon = feature.geometry.x || feature.LONGITUDE || feature.longitude;
              if (lat && lon) {
                const icon = createPOIIcon('🏢', '#dc2626');
                const marker = L.marker([lat, lon], { icon });
                const name = feature.name || feature.NAME || 'Facility';
                const type = feature.type || feature.TYPE || '';
                const distance = feature.distance_miles;
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🏢 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                marker.addTo(poi);
                bounds.extend([lat, lon]);
                if (!legendAccumulator['de_facilities']) {
                  legendAccumulator['de_facilities'] = { icon: '🏢', color: '#dc2626', title: 'DE Wildlife Areas Facilities', count: 0 };
                }
                legendAccumulator['de_facilities'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Facility:', error);
            }
          }
        });
      }

      // Draw DE Wildlife Areas Parking as markers
      if (enrichments.de_parking_all && Array.isArray(enrichments.de_parking_all)) {
        enrichments.de_parking_all.forEach((feature: any) => {
          if (feature.geometry) {
            try {
              const lat = feature.geometry.y || feature.LATITUDE || feature.latitude;
              const lon = feature.geometry.x || feature.LONGITUDE || feature.longitude;
              if (lat && lon) {
                const icon = createPOIIcon('🅿️', '#f59e0b');
                const marker = L.marker([lat, lon], { icon });
                const name = feature.name || feature.NAME || 'Parking';
                const type = feature.type || feature.TYPE || '';
                const distance = feature.distance_miles;
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🅿️ ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                marker.addTo(poi);
                bounds.extend([lat, lon]);
                if (!legendAccumulator['de_parking']) {
                  legendAccumulator['de_parking'] = { icon: '🅿️', color: '#f59e0b', title: 'DE Wildlife Areas Parking', count: 0 };
                }
                legendAccumulator['de_parking'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Parking:', error);
            }
          }
        });
      }

      // Draw DE Wildlife Areas Restrooms as markers
      if (enrichments.de_restrooms_all && Array.isArray(enrichments.de_restrooms_all)) {
        enrichments.de_restrooms_all.forEach((feature: any) => {
          if (feature.geometry) {
            try {
              const lat = feature.geometry.y || feature.LATITUDE || feature.latitude;
              const lon = feature.geometry.x || feature.LONGITUDE || feature.longitude;
              if (lat && lon) {
                const icon = createPOIIcon('🚻', '#8b5cf6');
                const marker = L.marker([lat, lon], { icon });
                const name = feature.name || feature.NAME || 'Restroom';
                const type = feature.type || feature.TYPE || '';
                const distance = feature.distance_miles;
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🚻 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                marker.addTo(poi);
                bounds.extend([lat, lon]);
                if (!legendAccumulator['de_restrooms']) {
                  legendAccumulator['de_restrooms'] = { icon: '🚻', color: '#8b5cf6', title: 'DE Wildlife Areas Restrooms', count: 0 };
                }
                legendAccumulator['de_restrooms'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Restroom:', error);
            }
          }
        });
      }

      // Draw DE Wildlife Areas Safety Zones as polygons
      if (enrichments.de_safety_zones_all && Array.isArray(enrichments.de_safety_zones_all)) {
        enrichments.de_safety_zones_all.forEach((zone: any) => {
          if (zone.geometry && zone.geometry.rings) {
            try {
              const rings = zone.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => {
                  return [coord[1], coord[0]] as [number, number];
                });

                if (latlngs.length < 3) {
                  console.warn('DE Safety Zone polygon has less than 3 coordinates, skipping');
                  return;
                }

                const name = zone.name || zone.NAME || 'Safety Zone';
                const type = zone.type || zone.TYPE || '';
                const isContaining = zone.isContaining || false;
                
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#dc2626' : '#ef4444',
                  weight: 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#ef4444' : '#f87171',
                  fillOpacity: 0.3
                });

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ⚠️ ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${isContaining ? '<div><strong>Status:</strong> Contains location</div>' : ''}
                    </div>
                  </div>
                `;

                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                
                try {
                  bounds.extend(polygon.getBounds());
                } catch (boundsError) {
                  console.warn('Error extending bounds for DE Safety Zone:', boundsError);
                }
                
                if (!legendAccumulator['de_safety_zones']) {
                  legendAccumulator['de_safety_zones'] = {
                    icon: '⚠️',
                    color: '#ef4444',
                    title: 'DE Wildlife Areas Safety Zones',
                    count: 0,
                  };
                }
                legendAccumulator['de_safety_zones'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Safety Zone:', error);
            }
          }
        });
      }

      // Draw DE Wildlife Management Zones as polygons
      if (enrichments.de_wildlife_management_zones_all && Array.isArray(enrichments.de_wildlife_management_zones_all)) {
        enrichments.de_wildlife_management_zones_all.forEach((zone: any) => {
          if (zone.geometry && zone.geometry.rings) {
            try {
              const rings = zone.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => {
                  return [coord[1], coord[0]] as [number, number];
                });

                if (latlngs.length < 3) {
                  console.warn('DE Wildlife Management Zone polygon has less than 3 coordinates, skipping');
                  return;
                }

                const name = zone.name || zone.NAME || zone.ZONE || zone.zone || 'Wildlife Management Zone';
                const type = zone.type || zone.TYPE || zone.ZONE_TYPE || zone.zone_type || '';
                const isContaining = zone.isContaining || false;
                
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#047857' : '#059669',
                  weight: 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#059669' : '#10b981',
                  fillOpacity: 0.3
                });

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🦌 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${isContaining ? '<div><strong>Status:</strong> Contains location</div>' : ''}
                    </div>
                  </div>
                `;

                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                
                try {
                  bounds.extend(polygon.getBounds());
                } catch (boundsError) {
                  console.warn('Error extending bounds for DE Wildlife Management Zone:', boundsError);
                }
                
                if (!legendAccumulator['de_wildlife_management_zones']) {
                  legendAccumulator['de_wildlife_management_zones'] = {
                    icon: '🦌',
                    color: '#059669',
                    title: 'DE Wildlife Management Zones',
                    count: 0,
                  };
                }
                legendAccumulator['de_wildlife_management_zones'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Wildlife Management Zone:', error);
            }
          }
        });
      }

      // Draw DE Rail Lines as polylines
      if (enrichments.de_rail_lines_all && Array.isArray(enrichments.de_rail_lines_all)) {
        let railLineCount = 0;
        enrichments.de_rail_lines_all.forEach((railLine: any) => {
          if (railLine.geometry && railLine.geometry.paths) {
            try {
              const paths = railLine.geometry.paths;
              if (paths && paths.length > 0) {
                paths.forEach((path: number[][]) => {
                  const latlngs = path.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 2) {
                    console.warn('DE Rail Line polyline has less than 2 coordinates, skipping');
                    return;
                  }

                  const railId = railLine.railId || railLine.RAIL_ID || railLine.rail_id || '';
                  const trackType = railLine.trackType || railLine.TRACK_TYPE || railLine.track_type || '';
                  const status = railLine.status || railLine.STATUS || railLine.status || '';
                  const lineId = railLine.lineId || railLine.LINE_ID || railLine.line_id || '';
                  const owner = railLine.owner || railLine.OWNER || railLine.owner || '';
                  const operators = railLine.operators || [];
                  
                  const polyline = L.polyline(latlngs, {
                    color: '#1f2937',
                    weight: 3,
                    opacity: 0.8
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🚂 Rail Line${railId ? ` ${railId}` : ''}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${lineId ? `<div><strong>Line ID:</strong> ${lineId}</div>` : ''}
                        ${trackType ? `<div><strong>Track Type:</strong> ${trackType}</div>` : ''}
                        ${status ? `<div><strong>Status:</strong> ${status}</div>` : ''}
                        ${owner ? `<div><strong>Owner:</strong> ${owner}</div>` : ''}
                        ${operators.length > 0 ? `<div><strong>Operator${operators.length > 1 ? 's' : ''}:</strong> ${operators.join(', ')}</div>` : ''}
                        ${railLine.distance_miles !== null && railLine.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${railLine.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['railId', 'RAIL_ID', 'rail_id', 'trackType', 'TRACK_TYPE', 'track_type', 'status', 'STATUS', 'lineId', 'LINE_ID', 'line_id', 'owner', 'OWNER', 'operators', 'OPERATOR1', 'OPERATOR2', 'OPERATOR3', 'OPERATOR4', 'geometry', 'distance_miles', 'OBJECTID', 'objectid'];
                  Object.entries(railLine).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polyline.bindPopup(popupContent, { maxWidth: 400 });
                  polyline.addTo(poi);
                  
                  try {
                    bounds.extend(polyline.getBounds());
                    railLineCount++;
                  } catch (boundsError) {
                    console.warn('Error extending bounds for DE Rail Line polyline:', boundsError);
                  }
                });
              }
            } catch (error) {
              console.error('Error drawing DE Rail Line:', error);
            }
          }
        });
        
        if (railLineCount > 0) {
          if (!legendAccumulator['de_rail_lines']) {
            legendAccumulator['de_rail_lines'] = {
              icon: '🚂',
              color: '#1f2937',
              title: 'DE Rail Lines',
              count: 0,
            };
          }
          legendAccumulator['de_rail_lines'].count += railLineCount;
        }
      }

      // Draw DE Natural Areas polygons
      if (enrichments.de_natural_areas_all && Array.isArray(enrichments.de_natural_areas_all)) {
        enrichments.de_natural_areas_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const isContaining = feature.isContaining;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#a855f7' : '#c084fc',
                  weight: isContaining ? 3 : 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#a855f7' : '#c084fc',
                  fillOpacity: 0.2
                });
                const name = feature.NAME || feature.name || '';
                const acres = feature.ACRES || feature.acres;
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${isContaining ? 'Natural Area' : 'Nearby Natural Area'}</strong>${name ? `<br>Name: ${name}` : ''}${acres !== null && acres !== undefined ? `<br>Acres: ${acres.toLocaleString()}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polygon.bindPopup(popupContent);
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                if (!legendAccumulator['de_natural_areas']) {
                  legendAccumulator['de_natural_areas'] = { icon: '🌿', color: '#a855f7', title: 'DE Natural Areas', count: 0 };
                }
                legendAccumulator['de_natural_areas'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Natural Areas:', error);
            }
          }
        });
      }

      // Draw DE Outdoor Recreation, Parks and Trails Program Lands polygons
      if (enrichments.de_outdoor_recreation_parks_trails_lands_all && Array.isArray(enrichments.de_outdoor_recreation_parks_trails_lands_all)) {
        enrichments.de_outdoor_recreation_parks_trails_lands_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const isContaining = feature.isContaining;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#a855f7' : '#c084fc',
                  weight: isContaining ? 3 : 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#a855f7' : '#c084fc',
                  fillOpacity: 0.2
                });
                const name = feature.NAME || feature.name || '';
                const acres = feature.ACRES || feature.acres;
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${isContaining ? 'Parks & Trails Program Land' : 'Nearby Parks & Trails Program Land'}</strong>${name ? `<br>Name: ${name}` : ''}${acres !== null && acres !== undefined ? `<br>Acres: ${acres.toLocaleString()}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polygon.bindPopup(popupContent);
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                if (!legendAccumulator['de_outdoor_recreation_parks_trails_lands']) {
                  legendAccumulator['de_outdoor_recreation_parks_trails_lands'] = { icon: '🏕️', color: '#a855f7', title: 'DE Parks & Trails Program Lands', count: 0 };
                }
                legendAccumulator['de_outdoor_recreation_parks_trails_lands'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Outdoor Recreation Parks Trails Lands:', error);
            }
          }
        });
      }

      // Draw DE Land and Water Conservation Fund polygons
      if (enrichments.de_land_water_conservation_fund_all && Array.isArray(enrichments.de_land_water_conservation_fund_all)) {
        enrichments.de_land_water_conservation_fund_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const isContaining = feature.isContaining;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#ec4899' : '#f472b6',
                  weight: isContaining ? 3 : 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#ec4899' : '#f472b6',
                  fillOpacity: 0.2
                });
                const name = feature.NAME || feature.name || '';
                const acres = feature.ACRES || feature.acres;
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${isContaining ? 'Land & Water Conservation Fund' : 'Nearby Land & Water Conservation Fund'}</strong>${name ? `<br>Name: ${name}` : ''}${acres !== null && acres !== undefined ? `<br>Acres: ${acres.toLocaleString()}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polygon.bindPopup(popupContent);
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                if (!legendAccumulator['de_land_water_conservation_fund']) {
                  legendAccumulator['de_land_water_conservation_fund'] = { icon: '💧', color: '#ec4899', title: 'DE Land & Water Conservation Fund', count: 0 };
                }
                legendAccumulator['de_land_water_conservation_fund'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Land and Water Conservation Fund:', error);
            }
          }
        });
      }

      // Draw DE Nature Preserves polygons
      if (enrichments.de_nature_preserves_all && Array.isArray(enrichments.de_nature_preserves_all)) {
        enrichments.de_nature_preserves_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const isContaining = feature.isContaining;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#aa5cf7' : '#c084fc',
                  weight: isContaining ? 3 : 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#aa5cf7' : '#c084fc',
                  fillOpacity: 0.2
                });
                const name = feature.NAME || feature.name || '';
                const acres = feature.ACRES || feature.acres;
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${isContaining ? 'Nature Preserve' : 'Nearby Nature Preserve'}</strong>${name ? `<br>Name: ${name}` : ''}${acres !== null && acres !== undefined ? `<br>Acres: ${acres.toLocaleString()}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polygon.bindPopup(popupContent);
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                if (!legendAccumulator['de_nature_preserves']) {
                  legendAccumulator['de_nature_preserves'] = { icon: '🌳', color: '#aa5cf7', title: 'DE Nature Preserves', count: 0 };
                }
                legendAccumulator['de_nature_preserves'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Nature Preserves:', error);
            }
          }
        });
      }

      // Draw DE Outdoor Recreation Areas polygons
      if (enrichments.de_outdoor_recreation_areas_all && Array.isArray(enrichments.de_outdoor_recreation_areas_all)) {
        enrichments.de_outdoor_recreation_areas_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const isContaining = feature.isContaining;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#10b981' : '#34d399',
                  weight: isContaining ? 3 : 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#10b981' : '#34d399',
                  fillOpacity: 0.2
                });
                const name = feature.NAME || feature.name || '';
                const acres = feature.ACRES || feature.acres;
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${isContaining ? 'Outdoor Recreation Area' : 'Nearby Outdoor Recreation Area'}</strong>${name ? `<br>Name: ${name}` : ''}${acres !== null && acres !== undefined ? `<br>Acres: ${acres.toLocaleString()}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polygon.bindPopup(popupContent);
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                if (!legendAccumulator['de_outdoor_recreation_areas']) {
                  legendAccumulator['de_outdoor_recreation_areas'] = { icon: '🏞️', color: '#10b981', title: 'DE Outdoor Recreation Areas', count: 0 };
                }
                legendAccumulator['de_outdoor_recreation_areas'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Outdoor Recreation Areas:', error);
            }
          }
        });
      }

      // Draw DE Outdoor Recreation, Parks and Trails Program Open Space polygons
      if (enrichments.de_outdoor_recreation_parks_trails_open_space_all && Array.isArray(enrichments.de_outdoor_recreation_parks_trails_open_space_all)) {
        enrichments.de_outdoor_recreation_parks_trails_open_space_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const isContaining = feature.isContaining;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#10b981' : '#34d399',
                  weight: isContaining ? 3 : 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#10b981' : '#34d399',
                  fillOpacity: 0.2
                });
                const agency = feature.AGENCY || feature.agency || '';
                const acres = feature.ACRES || feature.acres;
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${isContaining ? 'Parks & Trails Open Space' : 'Nearby Parks & Trails Open Space'}</strong>${agency ? `<br>Agency: ${agency}` : ''}${acres !== null && acres !== undefined ? `<br>Acres: ${acres.toLocaleString()}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polygon.bindPopup(popupContent);
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                if (!legendAccumulator['de_outdoor_recreation_parks_trails_open_space']) {
                  legendAccumulator['de_outdoor_recreation_parks_trails_open_space'] = { icon: '🌳', color: '#10b981', title: 'DE Parks & Trails Open Space', count: 0 };
                }
                legendAccumulator['de_outdoor_recreation_parks_trails_open_space'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Outdoor Recreation Parks Trails Open Space:', error);
            }
          }
        });
      }

      // Draw DE Public Protected Lands polygons
      if (enrichments.de_public_protected_lands_all && Array.isArray(enrichments.de_public_protected_lands_all)) {
        enrichments.de_public_protected_lands_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const isContaining = feature.isContaining;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#10b981' : '#34d399',
                  weight: isContaining ? 3 : 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#10b981' : '#34d399',
                  fillOpacity: 0.2
                });
                const name = feature.NAME || feature.name || '';
                const acres = feature.ACRES || feature.acres;
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${isContaining ? 'Public Protected Land' : 'Nearby Public Protected Land'}</strong>${name ? `<br>Name: ${name}` : ''}${acres !== null && acres !== undefined ? `<br>Acres: ${acres.toLocaleString()}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polygon.bindPopup(popupContent);
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                if (!legendAccumulator['de_public_protected_lands']) {
                  legendAccumulator['de_public_protected_lands'] = { icon: '🛡️', color: '#10b981', title: 'DE Public Protected Lands', count: 0 };
                }
                legendAccumulator['de_public_protected_lands'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Public Protected Lands:', error);
            }
          }
        });
      }

      // Draw DE Conservation Easements polygons
      if (enrichments.de_conservation_easements_all && Array.isArray(enrichments.de_conservation_easements_all)) {
        enrichments.de_conservation_easements_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const isContaining = feature.isContaining;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#10b981' : '#34d399',
                  weight: isContaining ? 3 : 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#10b981' : '#34d399',
                  fillOpacity: 0.2
                });
                const grantor = feature.GRANTOR || feature.grantor || '';
                const acres = feature.ACRES || feature.acres;
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${isContaining ? 'Conservation Easement' : 'Nearby Conservation Easement'}</strong>${grantor ? `<br>Grantor: ${grantor}` : ''}${acres !== null && acres !== undefined ? `<br>Acres: ${acres.toLocaleString()}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polygon.bindPopup(popupContent);
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                if (!legendAccumulator['de_conservation_easements']) {
                  legendAccumulator['de_conservation_easements'] = { icon: '🌿', color: '#10b981', title: 'DE Conservation Easements', count: 0 };
                }
                legendAccumulator['de_conservation_easements'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Conservation Easements:', error);
            }
          }
        });
      }

      // Draw DE Trails and Pathways as polylines
      if (enrichments.de_trails_pathways_all && Array.isArray(enrichments.de_trails_pathways_all)) {
        enrichments.de_trails_pathways_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.paths) {
            try {
              feature.geometry.paths.forEach((path: number[][]) => {
                const latlngs = path.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const polyline = L.polyline(latlngs, { color: '#f59e0b', weight: 3, opacity: 0.8 });
                const trailName = feature.TRAIL_NAME || feature.trailName || feature.trail_name || '';
                const managedUse = feature.MANAGED_USE || feature.managedUse || feature.managed_use || '';
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${trailName || 'Trail'}</strong>${managedUse ? `<br>Use: ${managedUse}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polyline.bindPopup(popupContent);
                polyline.addTo(primary);
                bounds.extend(polyline.getBounds());
              });
              if (!legendAccumulator['de_trails_pathways']) {
                legendAccumulator['de_trails_pathways'] = { icon: '🛤️', color: '#f59e0b', title: 'DE Trails and Pathways', count: 0 };
              }
              legendAccumulator['de_trails_pathways'].count += 1;
            } catch (error) {
              console.error('Error drawing DE Trails and Pathways:', error);
            }
          }
        });
      }

      // Draw DE Seasonal Restricted Areas polygons
      if (enrichments.de_seasonal_restricted_areas_all && Array.isArray(enrichments.de_seasonal_restricted_areas_all)) {
        enrichments.de_seasonal_restricted_areas_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const isContaining = feature.isContaining;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#eab308' : '#facc15',
                  weight: isContaining ? 3 : 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#eab308' : '#facc15',
                  fillOpacity: 0.2
                });
                const park = feature.PARK || feature.park || '';
                const closure = feature.CLOSURE || feature.closure || '';
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${isContaining ? 'Seasonal Restricted Area' : 'Nearby Seasonal Restricted Area'}</strong>${park ? `<br>Park: ${park}` : ''}${closure ? `<br>Closure: ${closure}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polygon.bindPopup(popupContent);
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                if (!legendAccumulator['de_seasonal_restricted_areas']) {
                  legendAccumulator['de_seasonal_restricted_areas'] = { icon: '⚠️', color: '#eab308', title: 'DE Seasonal Restricted Areas', count: 0 };
                }
                legendAccumulator['de_seasonal_restricted_areas'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Seasonal Restricted Areas:', error);
            }
          }
        });
      }

      // Draw DE Permanent Restricted Areas polygons
      if (enrichments.de_permanent_restricted_areas_all && Array.isArray(enrichments.de_permanent_restricted_areas_all)) {
        enrichments.de_permanent_restricted_areas_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const isContaining = feature.isContaining;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#eab308' : '#facc15',
                  weight: isContaining ? 3 : 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#eab308' : '#facc15',
                  fillOpacity: 0.2
                });
                const park = feature.PARK || feature.park || '';
                const closure = feature.CLOSURE || feature.closure || '';
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${isContaining ? 'Permanent Restricted Area' : 'Nearby Permanent Restricted Area'}</strong>${park ? `<br>Park: ${park}` : ''}${closure ? `<br>Closure: ${closure}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polygon.bindPopup(popupContent);
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                if (!legendAccumulator['de_permanent_restricted_areas']) {
                  legendAccumulator['de_permanent_restricted_areas'] = { icon: '🚫', color: '#eab308', title: 'DE Permanent Restricted Areas', count: 0 };
                }
                legendAccumulator['de_permanent_restricted_areas'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Permanent Restricted Areas:', error);
            }
          }
        });
      }

      // Draw DE Wildlife Area Boundaries polygons
      if (enrichments.de_wildlife_area_boundaries_all && Array.isArray(enrichments.de_wildlife_area_boundaries_all)) {
        enrichments.de_wildlife_area_boundaries_all.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.rings) {
            try {
              const rings = feature.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                const isContaining = feature.isContaining;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#fbbf24' : '#fcd34d',
                  weight: isContaining ? 3 : 2,
                  opacity: 0.8,
                  fillColor: isContaining ? '#fbbf24' : '#fcd34d',
                  fillOpacity: 0.2
                });
                const areaName = feature.AREA_NAME || feature.areaName || feature.area_name || '';
                const tractName = feature.TRACT_NAME || feature.tractName || feature.tract_name || '';
                const acres = feature.GIS_ACRES || feature.gisAcres || feature.gis_acres;
                const distance = feature.distance_miles;
                let popupContent = `<div><strong>${isContaining ? 'Wildlife Area' : 'Nearby Wildlife Area'}</strong>${areaName ? `<br>Area: ${areaName}` : ''}${tractName ? `<br>Tract: ${tractName}` : ''}${acres !== null && acres !== undefined ? `<br>Acres: ${acres.toLocaleString()}` : ''}${distance !== null && distance !== undefined ? `<br>Distance: ${distance.toFixed(2)} miles` : ''}</div>`;
                polygon.bindPopup(popupContent);
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                if (!legendAccumulator['de_wildlife_area_boundaries']) {
                  legendAccumulator['de_wildlife_area_boundaries'] = { icon: '🦌', color: '#fbbf24', title: 'DE Wildlife Area Boundaries', count: 0 };
                }
                legendAccumulator['de_wildlife_area_boundaries'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing DE Wildlife Area Boundaries:', error);
            }
          }
        });
      }

      // Draw NH Geographic Names as markers on the map
      if (enrichments.nh_geographic_names_all && Array.isArray(enrichments.nh_geographic_names_all)) {
        enrichments.nh_geographic_names_all.forEach((place: any) => {
          const placeLat = place.lat;
          const placeLon = place.lon;
          
          if (placeLat && placeLon) {
            try {
              const placeName = place.feature || 'Unknown Place';
              const featType = place.feattype || '';
              const county = place.county || '';
              const quad = place.quad || '';
              const distance = place.distance_miles !== null && place.distance_miles !== undefined ? place.distance_miles.toFixed(2) : '';
              
              // Create a custom icon for geographic names
              const icon = createPOIIcon('📍', '#8b5cf6'); // Purple icon for geographic names
              
              const marker = L.marker([placeLat, placeLon], { icon });
              
              // Build popup content with all place attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    📍 ${placeName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${featType ? `<div><strong>Type:</strong> ${featType}</div>` : ''}
                    ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                    ${quad ? `<div><strong>Quad:</strong> ${quad}</div>` : ''}
                    ${distance ? `<div><strong>Distance:</strong> ${distance} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all other place attributes (excluding internal fields)
              const excludeFields = ['feature', 'feattype', 'county', 'quad', 'lat', 'lon', 'distance_miles', 'geometry', 'objectId', 'featid'];
              Object.entries(place).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this place
              bounds.extend([placeLat, placeLon]);
              
              // Add to legend accumulator
              if (!legendAccumulator['nh_geographic_names']) {
                legendAccumulator['nh_geographic_names'] = {
                  icon: '📍',
                  color: '#8b5cf6',
                  title: 'NH Geographic Names',
                  count: 0,
                };
              }
              legendAccumulator['nh_geographic_names'].count += 1;
            } catch (error) {
              console.error('Error drawing NH Geographic Name marker:', error);
            }
          }
        });
      }

      // Draw MA DEP Wetlands as polygons on the map
      if (enrichments.ma_dep_wetlands_all && Array.isArray(enrichments.ma_dep_wetlands_all)) {
        enrichments.ma_dep_wetlands_all.forEach((wetland: any) => {
          if (wetland.geometry && wetland.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              const rings = wetland.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = wetland.distance_miles === 0 || wetland.distance_miles === null;
                const color = isContaining ? '#14b8a6' : '#06b6d4'; // Teal for containing, cyan for nearby
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                // Build popup content with all wetland attributes
                const wetCode = wetland.WETCODE || wetland.wetCode;
                const itValDesc = wetland.IT_VALDESC || wetland.itValDesc;
                const itValc = wetland.IT_VALC || wetland.itValc;
                const polyCode = wetland.POLY_CODE || wetland.polyCode;
                const source = wetland.SOURCE || wetland.source;
                const areaAcres = wetland.AREAACRES || wetland.areaAcres;
                const distance = wetland.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ${isContaining ? '🌊 Containing Wetland' : '🌊 Nearby Wetland'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${itValDesc ? `<div><strong>Type:</strong> ${itValDesc}</div>` : ''}
                      ${itValc ? `<div><strong>Code:</strong> ${itValc}</div>` : ''}
                      ${wetCode ? `<div><strong>Wet Code:</strong> ${wetCode}</div>` : ''}
                      ${polyCode ? `<div><strong>Poly Code:</strong> ${polyCode}</div>` : ''}
                      ${source ? `<div><strong>Source:</strong> ${source}</div>` : ''}
                      ${areaAcres ? `<div><strong>Area:</strong> ${areaAcres.toFixed(2)} acres</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all other wetland attributes (excluding internal fields)
                const excludeFields = ['WETCODE', 'wetCode', 'IT_VALC', 'itValc', 'IT_VALDESC', 'itValDesc', 'POLY_CODE', 'polyCode', 'SOURCE', 'source', 'AREAACRES', 'areaAcres', 'AREASQMI', 'areaSqMi', 'geometry', 'distance_miles'];
                Object.entries(wetland).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                
                // Add to legend accumulator
                if (!legendAccumulator['ma_dep_wetlands']) {
                  legendAccumulator['ma_dep_wetlands'] = {
                    icon: '🌊',
                    color: '#14b8a6',
                    title: 'MA DEP Wetlands',
                    count: 0,
                  };
                }
                legendAccumulator['ma_dep_wetlands'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing MA DEP Wetland polygon:', error);
            }
          }
        });
      }

      // Draw MA Open Space as polygons on the map
      if (enrichments.ma_open_space_all && Array.isArray(enrichments.ma_open_space_all)) {
        console.log(`🗺️ Drawing MA Open Space: ${enrichments.ma_open_space_all.length} features`);
        enrichments.ma_open_space_all.forEach((openSpace: any, index: number) => {
          console.log(`🗺️ MA Open Space ${index}:`, {
            hasGeometry: !!openSpace.geometry,
            geometryType: openSpace.geometry?.type || openSpace.geometry?.rings ? 'rings' : 'unknown',
            hasRings: !!openSpace.geometry?.rings,
            ringsLength: openSpace.geometry?.rings?.length
          });
          if (openSpace.geometry && openSpace.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              const rings = openSpace.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = openSpace.distance_miles === 0 || openSpace.distance_miles === null;
                const color = isContaining ? '#059669' : '#10b981'; // Green for containing, lighter green for nearby
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                // Build popup content with all open space attributes
                const siteName = openSpace.SITE_NAME || openSpace.siteName || openSpace.SiteName || 'Unknown Open Space';
                const siteType = openSpace.SITE_TYPE || openSpace.siteType || openSpace.SiteType || '';
                const ownerType = openSpace.OWNER_TYPE || openSpace.ownerType || openSpace.OwnerType || '';
                const ownerName = openSpace.OWNER_NAME || openSpace.ownerName || openSpace.OwnerName || '';
                const acres = openSpace.ACRES || openSpace.acres || openSpace.Acres;
                const distance = openSpace.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ${isContaining ? '🏞️ Containing Open Space' : '🏞️ Nearby Open Space'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      <div><strong>Name:</strong> ${siteName}</div>
                      ${siteType ? `<div><strong>Type:</strong> ${siteType}</div>` : ''}
                      ${ownerType ? `<div><strong>Owner Type:</strong> ${ownerType}</div>` : ''}
                      ${ownerName ? `<div><strong>Owner:</strong> ${ownerName}</div>` : ''}
                      ${acres ? `<div><strong>Area:</strong> ${acres.toFixed(2)} acres</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all other open space attributes (excluding internal fields)
                const excludeFields = ['SITE_NAME', 'siteName', 'SiteName', 'SITE_TYPE', 'siteType', 'SiteType', 'OWNER_TYPE', 'ownerType', 'OwnerType', 'OWNER_NAME', 'ownerName', 'OwnerName', 'ACRES', 'acres', 'Acres', 'geometry', 'distance_miles'];
                Object.entries(openSpace).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                
                // Add to legend accumulator
                if (!legendAccumulator['ma_open_space']) {
                  legendAccumulator['ma_open_space'] = {
                    icon: '🏞️',
                    color: '#059669',
                    title: 'MA Open Space',
                    count: 0,
                  };
                }
                legendAccumulator['ma_open_space'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing MA Open Space polygon:', error);
            }
          }
        });
      }

      // Draw Cape Cod Zoning as polygons on the map
      if (enrichments.cape_cod_zoning_all && Array.isArray(enrichments.cape_cod_zoning_all)) {
        enrichments.cape_cod_zoning_all.forEach((zoning: any) => {
          if (zoning.geometry && zoning.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              const rings = zoning.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = zoning.distance_miles === 0 || zoning.distance_miles === null;
                const color = isContaining ? '#7c3aed' : '#a78bfa'; // Purple for containing, lighter purple for nearby
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                // Build popup content with ZONECODE at the top
                const zoneCode = zoning.ZONECODE || zoning.ZoneCode || zoning.zonecode || 'Unknown Zone';
                const primUse = zoning.PRIM_USE || zoning.Prim_Use || zoning.prim_use || '';
                const townCode = zoning.TOWNCODE || zoning.TownCode || zoning.towncode || '';
                const primUse2 = zoning.PRIM_USE2 || zoning.Prim_Use2 || zoning.prim_use2 || '';
                const acres = zoning.ACRES || zoning.Acres || zoning.acres;
                const townId = zoning.TOWN_ID || zoning.Town_ID || zoning.town_id;
                const distance = zoning.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ${isContaining ? '🏘️ Containing Zoning District' : '🏘️ Nearby Zoning District'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      <div style="font-weight: 600; font-size: 13px; color: #1f2937; margin-bottom: 4px;"><strong>Zone Code:</strong> ${zoneCode}</div>
                      ${primUse ? `<div><strong>Primary Use:</strong> ${primUse}</div>` : ''}
                      ${primUse2 ? `<div><strong>Primary Use 2:</strong> ${primUse2}</div>` : ''}
                      ${townCode ? `<div><strong>Town Code:</strong> ${townCode}</div>` : ''}
                      ${townId ? `<div><strong>Town ID:</strong> ${townId}</div>` : ''}
                      ${acres ? `<div><strong>Area:</strong> ${acres.toFixed(2)} acres</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all other zoning attributes (excluding internal fields and ZONECODE since it's already shown)
                const excludeFields = ['ZONECODE', 'ZoneCode', 'zonecode', 'PRIM_USE', 'Prim_Use', 'prim_use', 'PRIM_USE2', 'Prim_Use2', 'prim_use2', 'TOWNCODE', 'TownCode', 'towncode', 'TOWN_ID', 'Town_ID', 'town_id', 'ACRES', 'Acres', 'acres', 'geometry', 'distance_miles'];
                Object.entries(zoning).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                
                // Add to legend accumulator
                if (!legendAccumulator['cape_cod_zoning']) {
                  legendAccumulator['cape_cod_zoning'] = {
                    icon: '🏘️',
                    color: '#7c3aed',
                    title: 'Cape Cod Zoning',
                    count: 0,
                  };
                }
                legendAccumulator['cape_cod_zoning'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing Cape Cod Zoning polygon:', error);
            }
          }
        });
      }

      // Draw PAD-US Public Access as polygons on the map
      if (enrichments.padus_public_access_all && Array.isArray(enrichments.padus_public_access_all)) {
        enrichments.padus_public_access_all.forEach((land: any, index: number) => {
          if (!land.geometry || !land.geometry.rings) {
            return;
          }
          
          if (land.geometry && land.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              // ESRI polygons have rings (outer ring + holes), we'll use the first ring (outer boundary)
              const rings = land.geometry.rings;
              
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                
                if (!outerRing || outerRing.length < 3) {
                  return;
                }
                
                // Check spatial reference - PAD-US might return Web Mercator (3857) or other projection
                const spatialRef = land.geometry.spatialReference || land.geometry.spatialref;
                const wkid = spatialRef?.wkid || spatialRef?.latestWkid;
                
                let latlngs: [number, number][];
                
                // If coordinates are in Web Mercator (3857) or look like projected coordinates, convert to WGS84
                if (wkid === 3857 || wkid === 102100 || (!wkid && (Math.abs(outerRing[0]?.[0]) > 180 || Math.abs(outerRing[0]?.[1]) > 90))) {
                  // Convert from Web Mercator to WGS84
                  latlngs = outerRing.map((coord: number[]) => {
                    const x = coord[0];
                    const y = coord[1];
                    // Web Mercator to WGS84 conversion
                    const lon = (x / 20037508.34) * 180;
                    let lat = (y / 20037508.34) * 180;
                    lat = (Math.atan(Math.exp((lat * Math.PI) / 180)) * 360) / Math.PI - 90;
                    return [lat, lon] as [number, number];
                  });
                } else {
                  // Assume WGS84 - coordinates are [lon, lat], convert to [lat, lon] for Leaflet
                  latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                }
                
                const isContaining = land.distance_miles === 0 || land.distance_miles === null || land.distance_miles === undefined;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#16a34a' : '#22c55e', // Darker green for containing, lighter for nearby
                  weight: 2,
                  opacity: 0.7,
                  fillColor: isContaining ? '#16a34a' : '#22c55e',
                  fillOpacity: 0.3
                });

                // Build popup content
                const unitName = land.unitName || land.Unit_Nm || 'Unnamed Public Land';
                const category = land.category || land.Category || '';
                const publicAccess = land.publicAccess || land.Pub_Access || '';
                const managerName = land.managerName || land.MngNm_Desc || '';
                const acres = land.acres || land.GIS_AcrsDb;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🏞️ ${unitName}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${category ? `<div><strong>Category:</strong> ${category}</div>` : ''}
                      ${publicAccess ? `<div><strong>Public Access:</strong> ${publicAccess}</div>` : ''}
                      ${managerName ? `<div><strong>Manager:</strong> ${managerName}</div>` : ''}
                      ${acres ? `<div><strong>Area:</strong> ${acres.toFixed(2)} acres</div>` : ''}
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                
                // Add to legend accumulator (only once per land)
                if (!legendAccumulator['padus_public_access']) {
                  legendAccumulator['padus_public_access'] = {
                    icon: '🏞️',
                    color: '#22c55e',
                    title: 'PAD-US Public Access',
                    count: 0,
                  };
                }
                legendAccumulator['padus_public_access'].count += 1;
              }
            } catch (error) {
              console.error(`❌ Error drawing PAD-US Public Access polygon ${index}:`, error);
            }
          } else {
            console.warn(`⚠️ PAD-US Public Access ${index}: Geometry exists but no rings array`);
          }
        });
      } else {
        console.warn('⚠️ PAD-US Public Access: enrichments.padus_public_access_all is not an array or is missing');
      }

      // Draw PAD-US Protection Status as polygons on the map
      if (enrichments.padus_protection_status_all && Array.isArray(enrichments.padus_protection_status_all)) {
        console.log(`🗺️ Drawing ${enrichments.padus_protection_status_all.length} PAD-US Protection Status features`);
        console.log(`🗺️ Map instance exists:`, !!map);
        console.log(`🗺️ Primary layer group exists:`, !!primary);
        enrichments.padus_protection_status_all.forEach((land: any, index: number) => {
          console.log(`🗺️ PAD-US Protection Status ${index}:`, {
            hasGeometry: !!land.geometry,
            geometryType: land.geometry?.type || (land.geometry?.rings ? 'rings' : 'unknown'),
            hasRings: !!land.geometry?.rings,
            ringsLength: land.geometry?.rings?.length,
            fullLand: land // Log full object for debugging
          });
          
          if (!land.geometry) {
            console.warn(`⚠️ PAD-US Protection Status ${index} has no geometry!`);
            return;
          }
          
          if (!land.geometry.rings) {
            console.warn(`⚠️ PAD-US Protection Status ${index} geometry has no rings! Geometry:`, land.geometry);
            return;
          }
          
          if (land.geometry && land.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              // ESRI polygons have rings (outer ring + holes), we'll use the first ring (outer boundary)
              const rings = land.geometry.rings;
              console.log(`🔍 PAD-US Protection Status ${index}: Processing rings, count: ${rings?.length}`);
              
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                console.log(`🔍 PAD-US Protection Status ${index}: Outer ring has ${outerRing?.length} coordinates`);
                
                if (!outerRing || outerRing.length < 3) {
                  console.warn(`⚠️ PAD-US Protection Status ${index}: Outer ring is invalid (needs at least 3 coordinates)`);
                  return;
                }
                
                // Check spatial reference - PAD-US might return Web Mercator (3857) or other projection
                const spatialRef = land.geometry.spatialReference || land.geometry.spatialref;
                const wkid = spatialRef?.wkid || spatialRef?.latestWkid;
                console.log(`🔍 PAD-US Protection Status ${index}: Spatial Reference WKID: ${wkid}, first coord: [${outerRing[0]?.[0]}, ${outerRing[0]?.[1]}]`);
                
                let latlngs: [number, number][];
                
                // If coordinates are in Web Mercator (3857) or look like projected coordinates, convert to WGS84
                if (wkid === 3857 || wkid === 102100 || (!wkid && (Math.abs(outerRing[0]?.[0]) > 180 || Math.abs(outerRing[0]?.[1]) > 90))) {
                  // Convert from Web Mercator to WGS84
                  console.log(`🔍 PAD-US Protection Status ${index}: Converting from Web Mercator to WGS84`);
                  latlngs = outerRing.map((coord: number[]) => {
                    const x = coord[0];
                    const y = coord[1];
                    // Web Mercator to WGS84 conversion
                    const lon = (x / 20037508.34) * 180;
                    let lat = (y / 20037508.34) * 180;
                    lat = (Math.atan(Math.exp((lat * Math.PI) / 180)) * 360) / Math.PI - 90;
                    return [lat, lon] as [number, number];
                  });
                } else {
                  // Assume WGS84 - coordinates are [lon, lat], convert to [lat, lon] for Leaflet
                  latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                }
                
                console.log(`🔍 PAD-US Protection Status ${index}: Created ${latlngs.length} latlng points, first: [${latlngs[0]?.[0]}, ${latlngs[0]?.[1]}]`);

                const polygon = L.polygon(latlngs, {
                  color: '#059669', // Green color for protected areas
                  weight: 2,
                  opacity: 0.7,
                  fillColor: '#059669',
                  fillOpacity: 0.3
                });
                
                console.log(`✅ PAD-US Protection Status ${index}: Polygon created, adding to map`);

                // Build popup content
                const unitName = land.unitName || land.Unit_Nm || 'Unnamed Protected Area';
                const gapStatus = land.gapStatus || land.GAP_Sts || '';
                const iucnCategory = land.iucnCategory || land.IUCN_Cat || '';
                const category = land.category || land.Category || '';

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🛡️ ${unitName}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${gapStatus ? `<div><strong>GAP Status:</strong> ${gapStatus}</div>` : ''}
                      ${iucnCategory ? `<div><strong>IUCN Category:</strong> ${iucnCategory}</div>` : ''}
                      ${category ? `<div><strong>Category:</strong> ${category}</div>` : ''}
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                
                console.log(`✅ PAD-US Protection Status ${index}: Polygon added to map successfully`);
                
                // Add to legend accumulator (only once per land)
                if (!legendAccumulator['padus_protection_status']) {
                  legendAccumulator['padus_protection_status'] = {
                    icon: '🛡️',
                    color: '#059669',
                    title: 'PAD-US Protection Status',
                    count: 0,
                  };
                }
                legendAccumulator['padus_protection_status'].count += 1;
              } else {
                console.warn(`⚠️ PAD-US Protection Status ${index}: No rings found in geometry`);
              }
            } catch (error) {
              console.error(`❌ Error drawing PAD-US Protection Status polygon ${index}:`, error);
              console.error('Error details:', {
                hasGeometry: !!land.geometry,
                hasRings: !!land.geometry?.rings,
                ringsLength: land.geometry?.rings?.length,
                firstRingLength: land.geometry?.rings?.[0]?.length,
                land: land
              });
            }
          } else {
            console.warn(`⚠️ PAD-US Protection Status ${index}: Geometry exists but no rings array`);
          }
        });
      } else {
        console.warn('⚠️ PAD-US Protection Status: enrichments.padus_protection_status_all is not an array or is missing');
      }

      // Draw MA Lakes and Ponds as polygons on the map
      if (enrichments.ma_lakes_and_ponds_all && Array.isArray(enrichments.ma_lakes_and_ponds_all)) {
        console.log(`🗺️ Drawing ${enrichments.ma_lakes_and_ponds_all.length} MA Lakes and Ponds`);
        enrichments.ma_lakes_and_ponds_all.forEach((lake: any, index: number) => {
          const hasGeometry = !!lake.geometry;
          const hasRings = !!lake.geometry?.rings;
          const ringsLength = lake.geometry?.rings?.length;
          
          console.log(`🗺️ MA Lake/Pond ${index}:`, {
            hasGeometry,
            geometryType: lake.geometry?.type || (hasRings ? 'rings' : 'unknown'),
            hasRings,
            ringsLength,
            distance_miles: lake.distance_miles,
            objectId: lake.objectId || lake.OBJECTID,
            fullLake: lake // Log full object for debugging
          });
          
          if (!hasGeometry) {
            console.warn(`⚠️ MA Lake/Pond ${index} has no geometry!`);
            return;
          }
          
          if (!hasRings) {
            console.warn(`⚠️ MA Lake/Pond ${index} geometry has no rings! Geometry:`, lake.geometry);
            return;
          }
          
          if (lake.geometry && lake.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng arrays
              const rings = lake.geometry.rings;
              rings.forEach((ring: number[][]) => {
                const latlngs = ring.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = lake.distance_miles === 0 || lake.distance_miles === null || lake.distance_miles === undefined;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#0284c7' : '#0ea5e9', // Darker blue for containing, lighter for nearby
                  weight: 2,
                  opacity: 0.7,
                  fillColor: isContaining ? '#0284c7' : '#0ea5e9',
                  fillOpacity: 0.3
                });

                // Build popup content with all lake attributes
                const name = lake.NAME || lake.Name || lake.name || 'Unnamed Lake/Pond';
                const type = lake.TYPE || lake.Type || lake.type || '';
                const sqMeters = lake.SQ_METERS || lake.Sq_Meters || lake.sq_meters || lake['SQ.METERS'];
                const distance = lake.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🏞️ ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${sqMeters ? `<div><strong>Area:</strong> ${(sqMeters * 0.000247105).toFixed(2)} acres</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all other lake attributes (excluding internal fields)
                const excludeFields = ['NAME', 'Name', 'name', 'TYPE', 'Type', 'type', 'SQ_METERS', 'Sq_Meters', 'sq_meters', 'SQ.METERS', 'FEATURE', 'Feature', 'feature', 'geometry', 'distance_miles'];
                Object.entries(lake).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
              });
              
              // Add to legend accumulator (only once per lake, not per ring)
              if (!legendAccumulator['ma_lakes_and_ponds']) {
                legendAccumulator['ma_lakes_and_ponds'] = {
                  icon: '🏞️',
                  color: '#0284c7',
                  title: 'MA Lakes and Ponds',
                  count: 0,
                };
              }
              legendAccumulator['ma_lakes_and_ponds'].count += 1;
            } catch (error) {
              console.error('Error drawing MA Lake/Pond polygon:', error);
            }
          }
        });
      }

      // Draw MA NHESP Natural Communities as polygons on the map
      if (enrichments.ma_nhesp_natural_communities_all && Array.isArray(enrichments.ma_nhesp_natural_communities_all)) {
        console.log(`🗺️ Drawing ${enrichments.ma_nhesp_natural_communities_all.length} MA NHESP Natural Communities`);
        enrichments.ma_nhesp_natural_communities_all.forEach((community: any) => {
          if (community.geometry && community.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng arrays
              const rings = community.geometry.rings;
              rings.forEach((ring: number[][]) => {
                const latlngs = ring.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = community.distance_miles === 0 || community.distance_miles === null || community.distance_miles === undefined;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#059669' : '#10b981', // Darker green for containing, lighter for nearby
                  weight: 2,
                  opacity: 0.7,
                  fillColor: isContaining ? '#059669' : '#10b981',
                  fillOpacity: 0.3
                });

                // Build popup content with all community attributes
                const communNam = community.COMMUN_NAM || community.Commun_Nam || community.commun_nam || community.communNam || 'Unnamed Community';
                const communRan = community.COMMUN_RAN || community.Commun_Ran || community.commun_ran || community.communRan || '';
                const specificD = community.SPECIFIC_D || community.Specific_D || community.specific_d || community.specificD || '';
                const communDes = community.COMMUN_DES || community.Commun_Des || community.commun_des || community.communDes || '';
                const shapeArea = community['SHAPE.AREA'] || community.Shape_Area || community.shape_area || community.shapeArea;
                const distance = community.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🌿 ${communNam}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${communRan ? `<div><strong>Community Rank:</strong> ${communRan}</div>` : ''}
                      ${specificD ? `<div><strong>Specific Occurrence:</strong> ${specificD}</div>` : ''}
                      ${communDes ? `<div><strong>Description:</strong> ${communDes}</div>` : ''}
                      ${shapeArea ? `<div><strong>Area:</strong> ${(shapeArea * 0.000247105).toFixed(2)} acres</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all other community attributes (excluding internal fields)
                const excludeFields = ['COMMUN_NAM', 'Commun_Nam', 'commun_nam', 'communNam', 'COMMUN_RAN', 'Commun_Ran', 'commun_ran', 'communRan', 'SPECIFIC_D', 'Specific_D', 'specific_d', 'specificD', 'COMMUN_DES', 'Commun_Des', 'commun_des', 'communDes', 'SHAPE.AREA', 'Shape_Area', 'shape_area', 'shapeArea', 'SHAPE.LEN', 'Shape_Len', 'shape_len', 'geometry', 'distance_miles'];
                Object.entries(community).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
              });
              
              // Add to legend accumulator (only once per community, not per ring)
              if (!legendAccumulator['ma_nhesp_natural_communities']) {
                legendAccumulator['ma_nhesp_natural_communities'] = {
                  icon: '🌿',
                  color: '#059669',
                  title: 'MA NHESP Natural Communities',
                  count: 0,
                };
              }
              legendAccumulator['ma_nhesp_natural_communities'].count += 1;
            } catch (error) {
              console.error('Error drawing MA NHESP Natural Community polygon:', error);
            }
          }
        });
      }

      // Draw MA Rivers and Streams as polylines on the map
      if (enrichments.ma_rivers_and_streams_all && Array.isArray(enrichments.ma_rivers_and_streams_all)) {
        enrichments.ma_rivers_and_streams_all.forEach((river: any) => {
          if (river.geometry && river.geometry.paths) {
            try {
              // Convert ESRI polyline paths to Leaflet LatLng arrays
              const paths = river.geometry.paths;
              paths.forEach((path: number[][]) => {
                const latlngs = path.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  return [coord[1], coord[0]] as [number, number];
                });

                const polyline = L.polyline(latlngs, {
                  color: '#0ea5e9', // Blue color for rivers/streams
                  weight: 3,
                  opacity: 0.8
                });

                // Build popup content with all river/stream attributes
                const objectId = river.OBJECTID || river.objectId || '';
                const distance = river.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🌊 River/Stream
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${objectId ? `<div><strong>Object ID:</strong> ${objectId}</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all other river/stream attributes (excluding internal fields)
                const excludeFields = ['OBJECTID', 'objectId', 'geometry', 'distance_miles'];
                Object.entries(river).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polyline.bindPopup(popupContent, { maxWidth: 400 });
                polyline.addTo(primary);
                bounds.extend(polyline.getBounds());
              });
              
              // Add to legend accumulator (only once per river, not per path)
              if (!legendAccumulator['ma_rivers_and_streams']) {
                legendAccumulator['ma_rivers_and_streams'] = {
                  icon: '🌊',
                  color: '#0ea5e9',
                  title: 'MA Rivers and Streams',
                  count: 0,
                };
              }
              legendAccumulator['ma_rivers_and_streams'].count += 1;
            } catch (error) {
              console.error('Error drawing MA River/Stream polyline:', error);
            }
          }
        });
      }

      // Draw MA Regional Planning Agencies as polygons on the map
      if (enrichments.ma_regional_planning_agencies_all && Array.isArray(enrichments.ma_regional_planning_agencies_all)) {
        enrichments.ma_regional_planning_agencies_all.forEach((agency: any) => {
          if (agency.geometry && agency.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              const rings = agency.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  // Convert [lon, lat] to [lat, lon] for Leaflet
                  return [coord[1], coord[0]] as [number, number];
                });

                const polygon = L.polygon(latlngs, {
                  color: '#8b5cf6', // Purple color for planning agencies
                  weight: 2,
                  opacity: 0.7,
                  fillColor: '#8b5cf6',
                  fillOpacity: 0.2
                });

                // Build popup content
                const rpaName = agency.RPA_NAME || agency.rpa_name || 'Unknown Regional Planning Agency';
                const acronym = agency.ACRONYM || agency.acronym || '';
                const website = agency.WEBSITE || agency.website || '';

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🏛️ ${rpaName}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${acronym ? `<div><strong>Acronym:</strong> ${acronym}</div>` : ''}
                      ${website ? `<div><strong>Website:</strong> <a href="${website}" target="_blank" rel="noopener noreferrer">${website}</a></div>` : ''}
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                
                // Add to legend accumulator
                if (!legendAccumulator['ma_regional_planning_agencies']) {
                  legendAccumulator['ma_regional_planning_agencies'] = {
                    icon: '🏛️',
                    color: '#8b5cf6',
                    title: 'MA Regional Planning Agencies',
                    count: 0,
                  };
                }
                legendAccumulator['ma_regional_planning_agencies'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing MA Regional Planning Agency polygon:', error);
            }
          }
        });
      }

      // Draw National Marine Sanctuaries as polygons on the map
      if (enrichments.national_marine_sanctuaries_all && Array.isArray(enrichments.national_marine_sanctuaries_all)) {
        enrichments.national_marine_sanctuaries_all.forEach((sanctuary: any) => {
          if (sanctuary.geometry && sanctuary.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              const rings = sanctuary.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                
                // Check if coordinates need conversion from Web Mercator
                const spatialRef = sanctuary.geometry.spatialReference || sanctuary.geometry.spatialref;
                const wkid = spatialRef?.wkid || spatialRef?.latestWkid;
                const firstCoord = outerRing[0];
                const needsConversion = wkid === 3857 || wkid === 102100 || (!wkid && (Math.abs(firstCoord[0]) > 180 || Math.abs(firstCoord[1]) > 90));
                
                let latlngs: [number, number][];
                
                if (needsConversion) {
                  // Convert from Web Mercator to WGS84
                  latlngs = outerRing.map((coord: number[]) => {
                    const x = coord[0];
                    const y = coord[1];
                    const lon = (x / 20037508.34) * 180;
                    let lat = (y / 20037508.34) * 180;
                    lat = (Math.atan(Math.exp((lat * Math.PI) / 180)) * 360) / Math.PI - 90;
                    return [lat, lon] as [number, number];
                  });
                } else {
                  // Assume WGS84 - coordinates are [lon, lat], convert to [lat, lon] for Leaflet
                  latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                }

                const isContaining = sanctuary.distance_miles === 0 || sanctuary.distance_miles === null || sanctuary.distance_miles === undefined;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#0891b2' : '#06b6d4', // Darker cyan for containing, lighter for nearby
                  weight: 2,
                  opacity: 0.7,
                  fillColor: isContaining ? '#0891b2' : '#06b6d4',
                  fillOpacity: 0.2
                });

                // Build popup content
                const siteName = sanctuary.sitename || sanctuary.SITENAME || 'Unknown Marine Sanctuary';
                const unitName = sanctuary.unitname || sanctuary.UNITNAME || '';
                const siteUrl = sanctuary.siteurl || sanctuary.SITEURL || '';
                const citation = sanctuary.citation || sanctuary.CITATION || '';
                const cfrSection = sanctuary.cfrsection || sanctuary.CFRSECTION || '';
                const distance = sanctuary.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🌊 ${siteName}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${unitName ? `<div><strong>Unit:</strong> ${unitName}</div>` : ''}
                      ${siteUrl ? `<div><strong>Website:</strong> <a href="${siteUrl}" target="_blank" rel="noopener noreferrer">${siteUrl}</a></div>` : ''}
                      ${citation ? `<div><strong>Citation:</strong> ${citation}</div>` : ''}
                      ${cfrSection ? `<div><strong>CFR Section:</strong> ${cfrSection}</div>` : ''}
                      ${distance !== null && distance !== undefined && distance > 0 ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                
                // Add to legend accumulator
                if (!legendAccumulator['national_marine_sanctuaries']) {
                  legendAccumulator['national_marine_sanctuaries'] = {
                    icon: '🌊',
                    color: '#0891b2',
                    title: 'National Marine Sanctuaries',
                    count: 0,
                  };
                }
                legendAccumulator['national_marine_sanctuaries'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing National Marine Sanctuary polygon:', error);
            }
          }
        });
      }

      // Draw MA ACECs as polygons on the map
      if (enrichments.ma_acecs_all && Array.isArray(enrichments.ma_acecs_all)) {
        enrichments.ma_acecs_all.forEach((acec: any) => {
          if (acec.geometry && acec.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              const rings = acec.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  // Convert [lon, lat] to [lat, lon] for Leaflet
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = acec.distance_miles === 0 || acec.distance_miles === null || acec.distance_miles === undefined;
                const polygon = L.polygon(latlngs, {
                  color: isContaining ? '#059669' : '#10b981', // Darker green for containing, lighter for nearby
                  weight: 2,
                  opacity: 0.7,
                  fillColor: isContaining ? '#059669' : '#10b981',
                  fillOpacity: 0.2
                });

                // Build popup content
                const name = acec.NAME || acec.name || 'Unknown ACEC';
                const acecId = acec.ACECID || acec.acecid || '';
                const desDate = acec.DES_DATE || acec.des_date || '';
                const secretary = acec.SECRETARY || acec.secretary || '';
                const adminBy = acec.ADMIN_BY || acec.admin_by || '';
                const region = acec.REGION || acec.region || '';
                const polyAcres = acec.POLY_ACRES || acec.poly_acres || '';
                const acecAcres = acec.ACEC_ACRES || acec.acec_acres || '';
                const distance = acec.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🌿 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${acecId ? `<div><strong>ACEC ID:</strong> ${acecId}</div>` : ''}
                      ${desDate ? `<div><strong>Designation Date:</strong> ${desDate}</div>` : ''}
                      ${secretary ? `<div><strong>Secretary:</strong> ${secretary}</div>` : ''}
                      ${adminBy ? `<div><strong>Administered By:</strong> ${adminBy}</div>` : ''}
                      ${region ? `<div><strong>Region:</strong> ${region}</div>` : ''}
                      ${polyAcres ? `<div><strong>Polygon Acres:</strong> ${polyAcres.toLocaleString()}</div>` : ''}
                      ${acecAcres ? `<div><strong>ACEC Acres:</strong> ${acecAcres.toLocaleString()}</div>` : ''}
                      ${distance !== null && distance !== undefined && distance > 0 ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
                
                // Add to legend accumulator
                if (!legendAccumulator['ma_acecs']) {
                  legendAccumulator['ma_acecs'] = {
                    icon: '🌿',
                    color: '#059669',
                    title: 'MA Areas of Critical Environmental Concern',
                    count: 0,
                  };
                }
                legendAccumulator['ma_acecs'].count += 1;
              }
            } catch (error) {
              console.error('Error drawing MA ACEC polygon:', error);
            }
          }
        });
      }

      // Draw MA Trails as polylines on the map
      if (enrichments.ma_trails_all && Array.isArray(enrichments.ma_trails_all)) {
        enrichments.ma_trails_all.forEach((trail: any) => {
          if (trail.geometry && trail.geometry.paths) {
            try {
              // Convert ESRI polyline paths to Leaflet LatLng arrays
              const paths = trail.geometry.paths;
              paths.forEach((path: number[][]) => {
                const latlngs = path.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  return [coord[1], coord[0]] as [number, number];
                });

                const polyline = L.polyline(latlngs, {
                  color: '#10b981', // Green color for trails
                  weight: 3,
                  opacity: 0.8
                });

                // Build popup content with all trail attributes
                const trailName = trail.TRAIL_NAME || trail.Trail_Name || trail.trail_name || trail.altName || trail.ALT_NAME || trail.Alt_Name || 'Unnamed Trail';
                const town = trail.TOWN || trail.Town || trail.town || '';
                const siteName = trail.SITE_NAME || trail.Site_Name || trail.site_name || '';
                const shapeLength = trail.Shape__Length || trail.Shape_Length || trail.shape_length;
                const distance = trail.distance_miles;

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🥾 ${trailName}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${town ? `<div><strong>Town:</strong> ${town}</div>` : ''}
                      ${siteName ? `<div><strong>Site:</strong> ${siteName}</div>` : ''}
                      ${shapeLength ? `<div><strong>Length:</strong> ${(shapeLength * 0.000621371).toFixed(2)} miles</div>` : ''}
                      ${distance !== null && distance !== undefined ? `<div><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all other trail attributes (excluding internal fields)
                const excludeFields = ['TRAIL_NAME', 'Trail_Name', 'trail_name', 'ALT_NAME', 'Alt_Name', 'altName', 'TOWN', 'Town', 'town', 'SITE_NAME', 'Site_Name', 'site_name', 'Shape__Length', 'Shape_Length', 'shape_length', 'geometry', 'distance_miles'];
                Object.entries(trail).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polyline.bindPopup(popupContent, { maxWidth: 400 });
                polyline.addTo(primary);
                bounds.extend(polyline.getBounds());
              });
              
              // Add to legend accumulator (only once per trail, not per path)
              if (!legendAccumulator['ma_trails']) {
                legendAccumulator['ma_trails'] = {
                  icon: '🥾',
                  color: '#10b981',
                  title: 'MA Trails',
                  count: 0,
                };
              }
              legendAccumulator['ma_trails'].count += 1;
            } catch (error) {
              console.error('Error drawing MA Trail polyline:', error);
            }
          }
        });
      } else if (enrichments.nh_nwi_plus_geometry && !enrichments.nh_nwi_plus_all) {
        // Fallback: Draw single wetland from point-in-polygon query (no radius, no _all array)
        // Only draw if nh_nwi_plus_all doesn't exist to avoid duplicates
        try {
          const geometry = enrichments.nh_nwi_plus_geometry;
          if (geometry && geometry.rings) {
            const rings = geometry.rings;
            if (rings && rings.length > 0) {
              const outerRing = rings[0];
              const latlngs = outerRing.map((coord: number[]) => {
                return [coord[1], coord[0]] as [number, number];
              });

              const wetlandId = enrichments.nh_nwi_plus_wetland_id;
              const wetlandType = enrichments.nh_nwi_plus_wetland_type;
              const wetlandClass = enrichments.nh_nwi_plus_wetland_class;

              const polygon = L.polygon(latlngs, {
                color: '#14b8a6',
                weight: 3,
                opacity: 0.7,
                fillColor: '#14b8a6',
                fillOpacity: 0.2
              });

              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🌊 NH National Wetland Inventory (NWI) Plus
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${wetlandId ? `<div><strong>Wetland ID:</strong> ${String(wetlandId)}</div>` : ''}
                    ${wetlandType ? `<div><strong>Wetland Type:</strong> ${wetlandType}</div>` : ''}
                    ${wetlandClass ? `<div><strong>Wetland Class:</strong> ${wetlandClass}</div>` : ''}
                  </div>
                </div>
              `;

              polygon.bindPopup(popupContent, { maxWidth: 400 });
              polygon.addTo(primary);
              bounds.extend(polygon.getBounds());
              
              if (!legendAccumulator['nh_nwi_plus']) {
                legendAccumulator['nh_nwi_plus'] = {
                  icon: '🌊',
                  color: '#14b8a6',
                  title: 'NH NWI Plus Wetland',
                  count: 1,
                };
              }
            }
          }
        } catch (error) {
          console.error('Error drawing NH NWI Plus wetland polygon:', error);
        }
      }

      // Draw NH Hospitals as markers on the map
      if (enrichments.nh_hospitals_all && Array.isArray(enrichments.nh_hospitals_all)) {
        enrichments.nh_hospitals_all.forEach((hospital: any) => {
          if (hospital.lat && hospital.lon) {
            try {
              const hospitalLat = hospital.lat;
              const hospitalLon = hospital.lon;
              const hospitalName = hospital.name || hospital.NAME || hospital.Name || 'Unknown Hospital';
              const facType = hospital.fac_type || hospital.FAC_TYPE || hospital.FacType || 'Unknown Type';
              
              // Create a custom icon for hospitals
              const icon = createPOIIcon('🏥', '#dc2626'); // Red icon for hospitals
              
              const marker = L.marker([hospitalLat, hospitalLon], { icon });
              
              // Build popup content with all hospital attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🏥 ${hospitalName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    <div><strong>Type:</strong> ${facType}</div>
                    ${hospital.address ? `<div><strong>Address:</strong> ${hospital.address}</div>` : ''}
                    ${hospital.city ? `<div><strong>City:</strong> ${hospital.city}</div>` : ''}
                    ${hospital.telephone ? `<div><strong>Phone:</strong> ${hospital.telephone}</div>` : ''}
                    ${hospital.beds !== null && hospital.beds !== undefined ? `<div><strong>Beds:</strong> ${hospital.beds}</div>` : ''}
                    ${hospital.owner ? `<div><strong>Owner:</strong> ${hospital.owner}</div>` : ''}
                    ${hospital.distance_miles !== null && hospital.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${hospital.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all hospital attributes (excluding internal fields)
              const excludeFields = ['name', 'fac_type', 'address', 'city', 'state', 'zip', 'telephone', 'beds', 'owner', 'lat', 'lon', 'distance_miles'];
              Object.entries(hospital).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this hospital
              bounds.extend([hospitalLat, hospitalLon]);
            } catch (error) {
              console.error('Error drawing NH Hospital marker:', error);
            }
          }
        });
      }

      // Draw NH Fire Stations as markers on the map
      if (enrichments.nh_fire_stations_all && Array.isArray(enrichments.nh_fire_stations_all)) {
        enrichments.nh_fire_stations_all.forEach((station: any) => {
          if (station.lat && station.lon) {
            try {
              const stationLat = station.lat;
              const stationLon = station.lon;
              const stationName = station.name || station.NAME || station.Name || 'Unknown Fire Station';
              const stationType = station.type || station.TYPE || station.Type || 'Unknown Type';
              
              // Create a custom icon for fire stations
              const icon = createPOIIcon('🚒', '#dc2626'); // Red icon for fire stations
              
              const marker = L.marker([stationLat, stationLon], { icon });
              
              // Build popup content with all fire station attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🚒 ${stationName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    <div><strong>Type:</strong> ${stationType}</div>
                    ${station.address ? `<div><strong>Address:</strong> ${station.address}</div>` : ''}
                    ${station.city ? `<div><strong>City:</strong> ${station.city}</div>` : ''}
                    ${station.telephone ? `<div><strong>Phone:</strong> ${station.telephone}</div>` : ''}
                    ${station.owner ? `<div><strong>Owner:</strong> ${station.owner}</div>` : ''}
                    ${station.fdid ? `<div><strong>FDID:</strong> ${station.fdid}</div>` : ''}
                    ${station.distance_miles !== null && station.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${station.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all fire station attributes (excluding internal fields)
              const excludeFields = ['name', 'type', 'address', 'city', 'state', 'zip', 'telephone', 'owner', 'fdid', 'lat', 'lon', 'distance_miles'];
              Object.entries(station).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this fire station
              bounds.extend([stationLat, stationLon]);
            } catch (error) {
              console.error('Error drawing NH Fire Station marker:', error);
            }
          }
        });
      }

      // Draw NH Nursing Homes as markers on the map
      if (enrichments.nh_nursing_homes_all && Array.isArray(enrichments.nh_nursing_homes_all)) {
        enrichments.nh_nursing_homes_all.forEach((home: any) => {
          if (home.lat && home.lon) {
            try {
              const homeLat = home.lat;
              const homeLon = home.lon;
              const homeName = home.name || home.NAME || home.Name || 'Unknown Nursing Home';
              const facType = home.fac_type || home.FAC_TYPE || home.FacType || 'Unknown Type';
              
              // Create a custom icon for nursing homes
              const icon = createPOIIcon('🏥', '#dc2626'); // Red icon for healthcare facilities
              
              const marker = L.marker([homeLat, homeLon], { icon });
              
              // Build popup content with all nursing home attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🏥 ${homeName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    <div><strong>Type:</strong> ${facType}</div>
                    ${home.address ? `<div><strong>Address:</strong> ${home.address}</div>` : ''}
                    ${home.city ? `<div><strong>City:</strong> ${home.city}</div>` : ''}
                    ${home.telephone ? `<div><strong>Phone:</strong> ${home.telephone}</div>` : ''}
                    ${home.beds !== null && home.beds !== undefined ? `<div><strong>Beds:</strong> ${home.beds}</div>` : ''}
                    ${home.distance_miles !== null && home.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${home.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all nursing home attributes (excluding internal fields)
              const excludeFields = ['name', 'fac_type', 'address', 'city', 'state', 'zip', 'telephone', 'beds', 'lat', 'lon', 'distance_miles'];
              Object.entries(home).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this nursing home
              bounds.extend([homeLat, homeLon]);
            } catch (error) {
              console.error('Error drawing NH Nursing Home marker:', error);
            }
          }
        });
      }

      // Draw NH Key Destinations as markers on the map
      if (enrichments.nh_key_destinations_all && Array.isArray(enrichments.nh_key_destinations_all)) {
        enrichments.nh_key_destinations_all.forEach((dest: any) => {
          if (dest.lat && dest.lon) {
            try {
              const destLat = dest.lat;
              const destLon = dest.lon;
              const destName = dest.name || dest.NAME || dest.Name || 'Unknown Destination';
              const destType = dest.type || dest.TYPE || dest.Type || 'Unknown Type';
              
              // Create a custom icon for key destinations
              const icon = createPOIIcon('📍', '#8b5cf6'); // Purple icon for destinations
              
              const marker = L.marker([destLat, destLon], { icon });
              
              // Build popup content with all destination attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    📍 ${destName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    <div><strong>Type:</strong> ${destType}</div>
                    ${dest.distance_miles !== null && dest.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${dest.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all destination attributes (excluding internal fields)
              const excludeFields = ['name', 'type', 'lat', 'lon', 'distance_miles'];
              Object.entries(dest).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              
              // Extend bounds to include this destination
              bounds.extend([destLat, destLon]);
            } catch (error) {
              console.error('Error drawing NH Key Destination marker:', error);
            }
          }
        });
      }

      // Draw NH Parcels as polygons on the map
      if (enrichments.nh_parcels_all && Array.isArray(enrichments.nh_parcels_all)) {
        enrichments.nh_parcels_all.forEach((parcel: any) => {
          if (parcel.geometry && parcel.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              // ESRI polygons have rings (outer ring + holes), we'll use the first ring (outer boundary)
              const rings = parcel.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  // Since we requested outSR=4326, coordinates should already be in WGS84
                  // Convert [lon, lat] to [lat, lon] for Leaflet
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = parcel.isContaining;
                const color = isContaining ? '#dc2626' : '#3b82f6'; // Red for containing, blue for nearby
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                // Build popup content with all parcel attributes
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ${isContaining ? '📍 Containing Parcel' : '🏠 Nearby Parcel'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; max-height: 400px; overflow-y: auto;">
                `;
                
                // Add all parcel attributes (excluding internal fields)
                const excludeFields = ['parcelId', 'isContaining', 'distance_miles', 'geometry'];
                Object.entries(parcel).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
              }
            } catch (error) {
              console.error('Error drawing NH parcel polygon:', error);
            }
          }
        });
      }

      // Draw MA Parcels as polygons on the map
      if (enrichments.ma_parcels_all && Array.isArray(enrichments.ma_parcels_all)) {
        enrichments.ma_parcels_all.forEach((parcel: any) => {
          if (parcel.geometry && parcel.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              // ESRI polygons have rings (outer ring + holes), we'll use the first ring (outer boundary)
              const rings = parcel.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  // Since we requested outSR=4326, coordinates should already be in WGS84
                  // Convert [lon, lat] to [lat, lon] for Leaflet
                  return [coord[1], coord[0]] as [number, number];
                });

                const isContaining = parcel.isContaining;
                const color = isContaining ? '#dc2626' : '#3b82f6'; // Red for containing, blue for nearby
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                // Build popup content with all parcel attributes
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ${isContaining ? '📍 Containing Parcel' : '🏠 Nearby Parcel'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; max-height: 400px; overflow-y: auto;">
                `;
                
                // Add all parcel attributes (excluding internal fields)
                const excludeFields = ['parcelId', 'isContaining', 'distance_miles', 'geometry'];
                Object.entries(parcel).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                bounds.extend(polygon.getBounds());
              }
            } catch (error) {
              console.error('Error drawing MA parcel polygon:', error);
            }
          }
        });
      }

      // Draw CT Parcels as polygons on the map
      if (enrichments.ct_parcels_all && Array.isArray(enrichments.ct_parcels_all)) {
        let parcelCount = 0;
        enrichments.ct_parcels_all.forEach((parcel: any) => {
          if (parcel.geometry && parcel.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              const rings = parcel.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  // Since we requested outSR=4326, coordinates should already be in WGS84
                  // Convert [lon, lat] to [lat, lon] for Leaflet
                  return [coord[1], coord[0]] as [number, number];
                });

                // Validate coordinates
                if (latlngs.length < 3) {
                  console.warn('CT Parcel polygon has less than 3 coordinates, skipping');
                  return;
                }

                const isContaining = parcel.isContaining;
                const color = isContaining ? '#059669' : '#10b981'; // Darker green for containing, lighter for nearby
                const weight = isContaining ? 3 : 2;

                const parcelId = parcel.parcelId || parcel.Link || parcel.link || parcel.OBJECTID || 'Unknown';
                const townName = parcel.Town_Name || parcel.TownName || parcel.town_name || '';
                const owner = parcel.Owner || parcel.owner || '';
                const location = parcel.Location || parcel.location || '';
                const assessedTotal = parcel.Assessed_Total || parcel.AssessedTotal || parcel.assessed_total || null;

                // Create polygon
                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: 0.7,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                // Build popup content
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🏠 CT Parcel ${parcelId}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${isContaining ? '<div><strong>Status:</strong> Contains Location</div>' : ''}
                      ${parcel.distance_miles !== null && parcel.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${parcel.distance_miles.toFixed(2)} miles</div>` : ''}
                      ${townName ? `<div><strong>Town:</strong> ${townName}</div>` : ''}
                      ${owner ? `<div><strong>Owner:</strong> ${owner}</div>` : ''}
                      ${location ? `<div><strong>Location:</strong> ${location}</div>` : ''}
                      ${assessedTotal !== null ? `<div><strong>Assessed Total:</strong> $${assessedTotal.toLocaleString()}</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all parcel attributes (excluding internal fields)
                const excludeFields = ['parcelId', 'Link', 'link', 'OBJECTID', 'objectid', 'isContaining', 'geometry', 'distance_miles', 'Town_Name', 'TownName', 'town_name', 'Owner', 'owner', 'Location', 'location', 'Assessed_Total', 'AssessedTotal', 'assessed_total'];
                Object.entries(parcel).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;

                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary); // Add to primary layer group
                
                try {
                  bounds.extend(polygon.getBounds());
                  parcelCount++;
                } catch (boundsError) {
                  console.warn('Error extending bounds for CT Parcel polygon:', boundsError);
                }
              }
            } catch (error) {
              console.error('Error drawing CT Parcel polygon:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (parcelCount > 0) {
          if (!legendAccumulator['ct_parcels']) {
            legendAccumulator['ct_parcels'] = {
              icon: '🏠',
              color: '#059669',
              title: 'CT Parcels',
              count: 0,
            };
          }
          legendAccumulator['ct_parcels'].count += parcelCount;
        }
      }

      // Draw NJ Parcels as polygons on the map
      if (enrichments.nj_parcels_all && Array.isArray(enrichments.nj_parcels_all)) {
        let parcelCount = 0;
        enrichments.nj_parcels_all.forEach((parcel: any) => {
          if (parcel.geometry && parcel.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              const rings = parcel.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  // Since we requested outSR=4326, coordinates should already be in WGS84
                  // Convert [lon, lat] to [lat, lon] for Leaflet
                  return [coord[1], coord[0]] as [number, number];
                });

                // Validate coordinates
                if (latlngs.length < 3) {
                  console.warn('NJ Parcel polygon has less than 3 coordinates, skipping');
                  return;
                }

                const isContaining = parcel.isContaining;
                const color = isContaining ? '#059669' : '#10b981'; // Darker green for containing, lighter for nearby
                const weight = isContaining ? 3 : 2;

                const parcelId = parcel.parcelId || parcel.PAMS_PIN || parcel.pams_pin || parcel.GIS_PIN || parcel.gis_pin || parcel.PIN_NODUP || parcel.pin_nodup || 'Unknown';
                const pin = parcel.pin || parcel.PAMS_PIN || parcel.pams_pin || parcel.GIS_PIN || parcel.gis_pin || parcel.PIN_NODUP || parcel.pin_nodup || '';
                const municipality = parcel.municipality || parcel.MUN_NAME || parcel.mun_name || '';
                const county = parcel.county || parcel.COUNTY || parcel.county || '';
                const block = parcel.block || parcel.PCLBLOCK || parcel.pclblock || '';
                const lot = parcel.lot || parcel.PCLLOT || parcel.pcllot || '';
                const ownerName = parcel.ownerName || parcel.OWNER_NAME || parcel.owner_name || '';
                const streetAddress = parcel.streetAddress || parcel.ST_ADDRESS || parcel.st_address || '';
                const cityState = parcel.cityState || parcel.CITY_STATE || parcel.city_state || '';
                const zipCode = parcel.zipCode || parcel.ZIP_CODE || parcel.zip_code || parcel.ZIP5 || parcel.zip5 || '';
                const landValue = parcel.landValue || parcel.LAND_VAL || parcel.land_val || null;
                const improvementValue = parcel.improvementValue || parcel.IMPRVT_VAL || parcel.imprvt_val || null;
                const netValue = parcel.netValue || parcel.NET_VALUE || parcel.net_value || null;
                const acres = parcel.acres || parcel.CALC_ACRE || parcel.calc_acre || null;

                // Create polygon
                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: 0.7,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                // Build popup content
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🏠 NJ Parcel ${parcelId}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${isContaining ? '<div><strong>Status:</strong> Contains Location</div>' : ''}
                      ${parcel.distance_miles !== null && parcel.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${parcel.distance_miles.toFixed(2)} miles</div>` : ''}
                      ${pin ? `<div><strong>PIN:</strong> ${pin}</div>` : ''}
                      ${municipality ? `<div><strong>Municipality:</strong> ${municipality}</div>` : ''}
                      ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                      ${block ? `<div><strong>Block:</strong> ${block}</div>` : ''}
                      ${lot ? `<div><strong>Lot:</strong> ${lot}</div>` : ''}
                      ${ownerName ? `<div><strong>Owner:</strong> ${ownerName}</div>` : ''}
                      ${streetAddress ? `<div><strong>Address:</strong> ${streetAddress}</div>` : ''}
                      ${cityState ? `<div><strong>City/State:</strong> ${cityState}</div>` : ''}
                      ${zipCode ? `<div><strong>ZIP:</strong> ${zipCode}</div>` : ''}
                      ${landValue !== null ? `<div><strong>Land Value:</strong> $${landValue.toLocaleString()}</div>` : ''}
                      ${improvementValue !== null ? `<div><strong>Improvement Value:</strong> $${improvementValue.toLocaleString()}</div>` : ''}
                      ${netValue !== null ? `<div><strong>Net Value:</strong> $${netValue.toLocaleString()}</div>` : ''}
                      ${acres !== null ? `<div><strong>Acres:</strong> ${acres.toFixed(2)}</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all parcel attributes (excluding internal fields)
                const excludeFields = ['parcelId', 'pin', 'municipality', 'county', 'block', 'lot', 'ownerName', 'streetAddress', 'cityState', 'zipCode', 'landValue', 'improvementValue', 'netValue', 'acres', 'isContaining', 'geometry', 'distance_miles', 'PAMS_PIN', 'pams_pin', 'GIS_PIN', 'gis_pin', 'PIN_NODUP', 'pin_nodup', 'MUN_NAME', 'mun_name', 'COUNTY', 'county', 'PCLBLOCK', 'pclblock', 'PCLLOT', 'pcllot', 'OWNER_NAME', 'owner_name', 'ST_ADDRESS', 'st_address', 'CITY_STATE', 'city_state', 'ZIP_CODE', 'zip_code', 'ZIP5', 'zip5', 'LAND_VAL', 'land_val', 'IMPRVT_VAL', 'imprvt_val', 'NET_VALUE', 'net_value', 'CALC_ACRE', 'calc_acre'];
                Object.entries(parcel).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;

                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary); // Add to primary layer group
                
                try {
                  bounds.extend(polygon.getBounds());
                  parcelCount++;
                } catch (boundsError) {
                  console.warn('Error extending bounds for NJ Parcel polygon:', boundsError);
                }
              }
            } catch (error) {
              console.error('Error drawing NJ Parcel polygon:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (parcelCount > 0) {
          if (!legendAccumulator['nj_parcels']) {
            legendAccumulator['nj_parcels'] = {
              icon: '🏠',
              color: '#059669',
              title: 'NJ Tax Parcels',
              count: 0,
            };
          }
          legendAccumulator['nj_parcels'].count += parcelCount;
        }
      }

      // Draw NJ Address Points as markers on the map
      if (enrichments.nj_address_points_all && Array.isArray(enrichments.nj_address_points_all)) {
        let addressPointCount = 0;
        enrichments.nj_address_points_all.forEach((point: any) => {
          if (point.lat && point.lon) {
            try {
              const pointLat = point.lat;
              const pointLon = point.lon;
              const fullAddress = point.fullAddress || point.FULL_ADDRESS || point.full_address || 'Unknown Address';
              const streetName = point.streetName || point.ST_NAME || point.st_name || point.LST_NAME || point.lst_name || '';
              const streetNumber = point.streetNumber || point.ST_NUMBER || point.st_number || point.LST_NUMBER || point.lst_number || '';
              const municipality = point.municipality || point.INC_MUNI || point.inc_muni || '';
              const county = point.county || point.COUNTY || point.county || '';
              const zipCode = point.zipCode || point.POST_CODE || point.post_code || point.ZIP_CODE || point.zip_code || '';
              const subtype = point.subtype || point.SUBTYPE || point.subtype || '';
              const placement = point.placement || point.PLACEMENT || point.placement || '';
              
              // Create a custom icon for address points
              const icon = createPOIIcon('📍', '#3b82f6'); // Blue icon for address points
              
              const marker = L.marker([pointLat, pointLon], { icon });
              
              // Build popup content with all address point attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    📍 ${fullAddress}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${streetNumber ? `<div><strong>Street Number:</strong> ${streetNumber}</div>` : ''}
                    ${streetName ? `<div><strong>Street Name:</strong> ${streetName}</div>` : ''}
                    ${municipality ? `<div><strong>Municipality:</strong> ${municipality}</div>` : ''}
                    ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                    ${zipCode ? `<div><strong>ZIP Code:</strong> ${zipCode}</div>` : ''}
                    ${subtype ? `<div><strong>Subtype:</strong> ${subtype}</div>` : ''}
                    ${placement ? `<div><strong>Placement:</strong> ${placement}</div>` : ''}
                    ${point.distance_miles !== null && point.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${point.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all address point attributes (excluding internal fields)
              const excludeFields = ['fullAddress', 'streetName', 'streetNumber', 'municipality', 'county', 'zipCode', 'subtype', 'placement', 'lat', 'lon', 'distance_miles', 'FULL_ADDRESS', 'full_address', 'ST_NAME', 'st_name', 'LST_NAME', 'lst_name', 'ST_NUMBER', 'st_number', 'LST_NUMBER', 'lst_number', 'INC_MUNI', 'inc_muni', 'COUNTY', 'county', 'POST_CODE', 'post_code', 'ZIP_CODE', 'zip_code', 'ZIP5', 'zip5', 'SUBTYPE', 'subtype', 'PLACEMENT', 'placement'];
              Object.entries(point).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                    </div>
                  </div>
                `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi); // Add to POI layer group
              
              try {
                bounds.extend([pointLat, pointLon]);
                addressPointCount++;
              } catch (boundsError) {
                console.warn('Error extending bounds for NJ Address Point:', boundsError);
              }
            } catch (error) {
              console.error('Error drawing NJ Address Point:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (addressPointCount > 0) {
          if (!legendAccumulator['nj_address_points']) {
            legendAccumulator['nj_address_points'] = {
              icon: '📍',
              color: '#3b82f6',
              title: 'NJ Address Points',
              count: 0,
            };
          }
          legendAccumulator['nj_address_points'].count += addressPointCount;
        }
      }

      // Draw NJ Bus Stops as markers on the map
      if (enrichments.nj_bus_stops_all && Array.isArray(enrichments.nj_bus_stops_all)) {
        let busStopCount = 0;
        enrichments.nj_bus_stops_all.forEach((stop: any) => {
          if (stop.lat && stop.lon) {
            try {
              const stopLat = stop.lat;
              const stopLon = stop.lon;
              const description = stop.description || stop.DESCRIPTION_BSL || stop.description_bsl || 'Unknown Bus Stop';
              const stopNumber = stop.stopNumber || stop.STOP_NUM || stop.stop_num || '';
              const county = stop.county || stop.COUNTY || stop.county || '';
              const municipality = stop.municipality || stop.MUNICIPALITY || stop.municipality || '';
              const stopType = stop.stopType || stop.STOP_TYPE || stop.stop_type || '';
              const direction = stop.direction || stop.DIRECTION_OP || stop.direction_op || '';
              const streetDirection = stop.streetDirection || stop.STREET_DIR || stop.street_dir || '';
              const allLines = stop.allLines || stop.ALL_LINES || stop.all_lines || '';
              
              // Create a custom icon for bus stops
              const icon = createPOIIcon('🚌', '#f59e0b'); // Orange icon for bus stops
              
              const marker = L.marker([stopLat, stopLon], { icon });
              
              // Build popup content with all bus stop attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🚌 ${description}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${stopNumber ? `<div><strong>Stop Number:</strong> ${stopNumber}</div>` : ''}
                    ${municipality ? `<div><strong>Municipality:</strong> ${municipality}</div>` : ''}
                    ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                    ${stopType ? `<div><strong>Stop Type:</strong> ${stopType}</div>` : ''}
                    ${direction ? `<div><strong>Direction:</strong> ${direction}</div>` : ''}
                    ${streetDirection ? `<div><strong>Street Direction:</strong> ${streetDirection}</div>` : ''}
                    ${allLines ? `<div><strong>Bus Lines:</strong> ${allLines}</div>` : ''}
                    ${stop.distance_miles !== null && stop.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${stop.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all bus stop attributes (excluding internal fields)
              const excludeFields = ['description', 'stopNumber', 'county', 'municipality', 'stopType', 'direction', 'streetDirection', 'allLines', 'lat', 'lon', 'distance_miles', 'DESCRIPTION_BSL', 'description_bsl', 'DESCRIPTION', 'description', 'STOP_NUM', 'stop_num', 'STOP_NUMBER', 'stop_number', 'COUNTY', 'county', 'MUNICIPALITY', 'municipality', 'STOP_TYPE', 'stop_type', 'DIRECTION_OP', 'direction_op', 'DIRECTION', 'direction', 'STREET_DIR', 'street_dir', 'ALL_LINES', 'all_lines', 'LINES', 'lines'];
              Object.entries(stop).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                    </div>
                  </div>
                `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi); // Add to POI layer group
              
              try {
                bounds.extend([stopLat, stopLon]);
                busStopCount++;
              } catch (boundsError) {
                console.warn('Error extending bounds for NJ Bus Stop:', boundsError);
              }
            } catch (error) {
              console.error('Error drawing NJ Bus Stop:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (busStopCount > 0) {
          if (!legendAccumulator['nj_bus_stops']) {
            legendAccumulator['nj_bus_stops'] = {
              icon: '🚌',
              color: '#f59e0b',
              title: 'NJ Bus Stops',
              count: 0,
            };
          }
          legendAccumulator['nj_bus_stops'].count += busStopCount;
        }
      }

      // Draw NJ Safety Service Patrol routes as polylines on the map
      if (enrichments.nj_safety_service_patrol_all && Array.isArray(enrichments.nj_safety_service_patrol_all)) {
        let patrolRouteCount = 0;
        enrichments.nj_safety_service_patrol_all.forEach((route: any) => {
          if (route.geometry && route.geometry.paths) {
            try {
              // Convert ESRI polyline paths to Leaflet LatLng arrays
              const paths = route.geometry.paths;
              if (paths && paths.length > 0) {
                patrolRouteCount++;
                // For each path in the polyline, create a separate polyline
                paths.forEach((path: number[][]) => {
                  const latlngs = path.map((coord: number[]) => {
                    // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                    // Since we requested outSR=4326, coordinates should already be in WGS84
                    // Convert [lon, lat] to [lat, lon] for Leaflet
                    return [coord[1], coord[0]] as [number, number];
                  });

                  const routeName = route.routeName || route.SRI_ || route.sri_ || route.ROUTE || route.route || 'Unknown Route';
                  const sri = route.sri || route.SRI || route.sri || '';
                  const beginMile = route.beginMile !== null && route.beginMile !== undefined ? route.beginMile : null;
                  const endMile = route.endMile !== null && route.endMile !== undefined ? route.endMile : null;
                  const totalMiles = route.totalMiles !== null && route.totalMiles !== undefined ? route.totalMiles : null;
                  const category = route.category || route.CAT || route.cat || '';
                  const categoryType = route.categoryType || route.CAT_1 || route.cat_1 || '';

                  // Create polyline with red color for safety service patrol
                  const polyline = L.polyline(latlngs, {
                    color: '#dc2626', // Red color for safety service patrol
                    weight: 4,
                    opacity: 0.8,
                    smoothFactor: 1
                  });

                  // Build popup content with all route attributes
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🚨 ${routeName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${sri ? `<div><strong>SRI:</strong> ${sri}</div>` : ''}
                        ${beginMile !== null ? `<div><strong>Begin Mile:</strong> ${beginMile.toFixed(2)}</div>` : ''}
                        ${endMile !== null ? `<div><strong>End Mile:</strong> ${endMile.toFixed(2)}</div>` : ''}
                        ${totalMiles !== null ? `<div><strong>Total Miles:</strong> ${totalMiles.toFixed(2)}</div>` : ''}
                        ${category ? `<div><strong>Category:</strong> ${category}</div>` : ''}
                        ${categoryType ? `<div><strong>Category Type:</strong> ${categoryType}</div>` : ''}
                        ${route.distance_miles !== null && route.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${route.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all route attributes (excluding internal fields)
                  const excludeFields = ['routeName', 'sri', 'beginMile', 'endMile', 'totalMiles', 'category', 'categoryType', 'locationError', 'geometry', 'distance_miles', 'SRI_', 'sri_', 'ROUTE', 'route', 'SRI', 'sri', 'BEGIN_MILE', 'begin_mile', 'END_MILEPO', 'end_milepo', 'TOTAL_MILE', 'total_mile', 'CAT', 'cat', 'CAT_1', 'cat_1', 'LOC_ERROR', 'loc_error'];
                  Object.entries(route).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polyline.bindPopup(popupContent, { maxWidth: 400 });
                  polyline.addTo(poi); // Add to POI layer group
                  
                  try {
                    bounds.extend(polyline.getBounds());
                  } catch (boundsError) {
                    console.warn('Error extending bounds for NJ Safety Service Patrol route:', boundsError);
                  }
                });
              }
            } catch (error) {
              console.error('Error drawing NJ Safety Service Patrol route:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (patrolRouteCount > 0) {
          if (!legendAccumulator['nj_safety_service_patrol']) {
            legendAccumulator['nj_safety_service_patrol'] = {
              icon: '🚨',
              color: '#dc2626',
              title: 'NJ Safety Service Patrol',
              count: 0,
            };
          }
          legendAccumulator['nj_safety_service_patrol'].count += patrolRouteCount;
        }
      }

      // Draw NJ Service Areas as markers on the map
      if (enrichments.nj_service_areas_all && Array.isArray(enrichments.nj_service_areas_all)) {
        let serviceAreaCount = 0;
        enrichments.nj_service_areas_all.forEach((area: any) => {
          if (area.lat && area.lon) {
            try {
              const areaLat = area.lat;
              const areaLon = area.lon;
              const name = area.name || area.NAME || area.name || 'Unknown Service Area';
              const route = area.route || area.ROUTE || area.route || '';
              const milepost = area.milepost !== null && area.milepost !== undefined ? area.milepost : null;
              const lineType = area.lineType || area.LINETYPE || area.linetype || '';
              const rotation = area.rotation !== null && area.rotation !== undefined ? area.rotation : null;
              
              // Create a custom icon for service areas
              const icon = createPOIIcon('🛣️', '#8b5cf6'); // Purple icon for service areas
              
              const marker = L.marker([areaLat, areaLon], { icon });
              
              // Build popup content with all service area attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🛣️ ${name}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${route ? `<div><strong>Route:</strong> ${route}</div>` : ''}
                    ${milepost !== null ? `<div><strong>Milepost:</strong> ${milepost.toFixed(2)}</div>` : ''}
                    ${lineType ? `<div><strong>Line Type:</strong> ${lineType}</div>` : ''}
                    ${rotation !== null ? `<div><strong>Rotation:</strong> ${rotation}°</div>` : ''}
                    ${area.distance_miles !== null && area.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${area.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all service area attributes (excluding internal fields)
              const excludeFields = ['name', 'route', 'milepost', 'lineType', 'rotation', 'lat', 'lon', 'distance_miles', 'NAME', 'name', 'ROUTE', 'route', 'MILEPOST', 'milepost', 'LINETYPE', 'linetype', 'ROTATION', 'rotation'];
              Object.entries(area).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                    </div>
                  </div>
                `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi); // Add to POI layer group
              
              try {
                bounds.extend([areaLat, areaLon]);
                serviceAreaCount++;
              } catch (boundsError) {
                console.warn('Error extending bounds for NJ Service Area:', boundsError);
              }
            } catch (error) {
              console.error('Error drawing NJ Service Area:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (serviceAreaCount > 0) {
          if (!legendAccumulator['nj_service_areas']) {
            legendAccumulator['nj_service_areas'] = {
              icon: '🛣️',
              color: '#8b5cf6',
              title: 'NJ Service Areas',
              count: 0,
            };
          }
          legendAccumulator['nj_service_areas'].count += serviceAreaCount;
        }
      }

      // Draw NJ Roadway Network as polylines on the map
      if (enrichments.nj_roadway_network_all && Array.isArray(enrichments.nj_roadway_network_all)) {
        let roadwayCount = 0;
        enrichments.nj_roadway_network_all.forEach((roadway: any) => {
          if (roadway.geometry && roadway.geometry.paths) {
            try {
              // Convert ESRI polyline paths to Leaflet LatLng arrays
              const paths = roadway.geometry.paths;
              if (paths && paths.length > 0) {
                roadwayCount++;
                // For each path in the polyline, create a separate polyline
                paths.forEach((path: number[][]) => {
                  const latlngs = path.map((coord: number[]) => {
                    // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                    // Since we requested outSR=4326, coordinates should already be in WGS84
                    // Convert [lon, lat] to [lat, lon] for Leaflet
                    return [coord[1], coord[0]] as [number, number];
                  });

                  const sldName = roadway.sldName || roadway.SLD_NAME || roadway.sld_name || roadway.NAME || roadway.name || 'Unknown Roadway';
                  const sri = roadway.sri || roadway.SRI || roadway.sri || '';
                  const parentSRI = roadway.parentSRI || roadway.PARENT_SRI || roadway.parent_sri || '';
                  const mpStart = roadway.mpStart !== null && roadway.mpStart !== undefined ? roadway.mpStart : null;
                  const mpEnd = roadway.mpEnd !== null && roadway.mpEnd !== undefined ? roadway.mpEnd : null;
                  const parentMpStart = roadway.parentMpStart !== null && roadway.parentMpStart !== undefined ? roadway.parentMpStart : null;
                  const parentMpEnd = roadway.parentMpEnd !== null && roadway.parentMpEnd !== undefined ? roadway.parentMpEnd : null;
                  const measuredLength = roadway.measuredLength !== null && roadway.measuredLength !== undefined ? roadway.measuredLength : null;
                  const direction = roadway.direction || roadway.DIRECTION || roadway.direction || '';
                  const active = roadway.active || roadway.ACTIVE || roadway.active || '';
                  const routeSubtype = roadway.routeSubtype !== null && roadway.routeSubtype !== undefined ? roadway.routeSubtype : null;
                  const roadNum = roadway.roadNum || roadway.ROAD_NUM || roadway.road_num || '';

                  // Create polyline with yellow color for roadways
                  const polyline = L.polyline(latlngs, {
                    color: '#fbbf24', // Yellow color for roadways (better visibility on imagery basemap)
                    weight: 3,
                    opacity: 0.7,
                    smoothFactor: 1
                  });

                  // Build popup content with all roadway attributes
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🛣️ ${sldName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${sri ? `<div><strong>SRI:</strong> ${sri}</div>` : ''}
                        ${parentSRI ? `<div><strong>Parent SRI:</strong> ${parentSRI}</div>` : ''}
                        ${mpStart !== null ? `<div><strong>MP Start:</strong> ${mpStart.toFixed(3)}</div>` : ''}
                        ${mpEnd !== null ? `<div><strong>MP End:</strong> ${mpEnd.toFixed(3)}</div>` : ''}
                        ${parentMpStart !== null ? `<div><strong>Parent MP Start:</strong> ${parentMpStart.toFixed(3)}</div>` : ''}
                        ${parentMpEnd !== null ? `<div><strong>Parent MP End:</strong> ${parentMpEnd.toFixed(3)}</div>` : ''}
                        ${measuredLength !== null ? `<div><strong>Measured Length:</strong> ${measuredLength.toFixed(3)} mi</div>` : ''}
                        ${direction ? `<div><strong>Direction:</strong> ${direction}</div>` : ''}
                        ${active ? `<div><strong>Active:</strong> ${active}</div>` : ''}
                        ${routeSubtype !== null ? `<div><strong>Route Subtype:</strong> ${routeSubtype}</div>` : ''}
                        ${roadNum ? `<div><strong>Road Number:</strong> ${roadNum}</div>` : ''}
                        ${roadway.distance_miles !== null && roadway.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${roadway.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all roadway attributes (excluding internal fields)
                  const excludeFields = ['sldName', 'sri', 'parentSRI', 'mpStart', 'mpEnd', 'parentMpStart', 'parentMpEnd', 'measuredLength', 'direction', 'active', 'routeSubtype', 'roadNum', 'geometry', 'distance_miles', 'SLD_NAME', 'sld_name', 'NAME', 'name', 'SRI', 'sri', 'PARENT_SRI', 'parent_sri', 'MP_START', 'mp_start', 'MP_END', 'mp_end', 'PARENT_MP_START', 'parent_mp_start', 'PARENT_MP_END', 'parent_mp_end', 'MEASURED_LENGTH', 'measured_length', 'DIRECTION', 'direction', 'ACTIVE', 'active', 'ROUTE_SUBTYPE', 'route_subtype', 'ROAD_NUM', 'road_num'];
                  Object.entries(roadway).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polyline.bindPopup(popupContent, { maxWidth: 400 });
                  polyline.addTo(poi); // Add to POI layer group
                  
                  try {
                    bounds.extend(polyline.getBounds());
                  } catch (boundsError) {
                    console.warn('Error extending bounds for NJ Roadway Network segment:', boundsError);
                  }
                });
              }
            } catch (error) {
              console.error('Error drawing NJ Roadway Network segment:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (roadwayCount > 0) {
          if (!legendAccumulator['nj_roadway_network']) {
            legendAccumulator['nj_roadway_network'] = {
              icon: '🛣️',
              color: '#fbbf24',
              title: 'NJ Roadway Network',
              count: 0,
            };
          }
          legendAccumulator['nj_roadway_network'].count += roadwayCount;
        }
      }

      // Draw NJ Known Contaminated Sites as markers on the map
      if (enrichments.nj_known_contaminated_sites_all && Array.isArray(enrichments.nj_known_contaminated_sites_all)) {
        let contaminatedSiteCount = 0;
        enrichments.nj_known_contaminated_sites_all.forEach((site: any) => {
          if (site.lat !== null && site.lat !== undefined && site.lon !== null && site.lon !== undefined) {
            try {
              contaminatedSiteCount++;
              
              const siteName = site.siteName || site.SITE_NAME || site.site_name || site.NAME || site.name || site.SITE || site.site || 'Unknown Site';
              const address = site.address || site.ADDRESS || site.address || '';
              const municipality = site.municipality || site.MUNICIPALITY || site.municipality || '';
              const county = site.county || site.COUNTY || site.county || '';
              const zipCode = site.zipCode || site.ZIP_CODE || site.zip_code || site.ZIP || site.zip || '';
              const siteType = site.siteType || site.SITE_TYPE || site.site_type || site.TYPE || site.type || '';
              const status = site.status || site.STATUS || site.status || site.SITE_STATUS || site.site_status || '';

              // Create marker with warning icon color
              const marker = L.marker([site.lat, site.lon], {
                icon: L.divIcon({
                  className: 'custom-marker-icon',
                  html: `<div style="background-color: #dc2626; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    <span style="color: white; font-size: 14px;">⚠️</span>
                  </div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })
              });

              // Build popup content with all site attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    ⚠️ ${siteName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                    ${municipality ? `<div><strong>Municipality:</strong> ${municipality}</div>` : ''}
                    ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                    ${zipCode ? `<div><strong>ZIP Code:</strong> ${zipCode}</div>` : ''}
                    ${siteType ? `<div><strong>Site Type:</strong> ${siteType}</div>` : ''}
                    ${status ? `<div><strong>Status:</strong> ${status}</div>` : ''}
                    ${site.distance_miles !== null && site.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${site.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all site attributes (excluding internal fields)
              const excludeFields = ['siteId', 'siteName', 'address', 'municipality', 'county', 'zipCode', 'siteType', 'status', 'lat', 'lon', 'distance_miles', 'SITE_NAME', 'site_name', 'NAME', 'name', 'SITE', 'site', 'ADDRESS', 'address', 'ADDR', 'addr', 'MUNICIPALITY', 'municipality', 'MUNI', 'muni', 'CITY', 'city', 'COUNTY', 'county', 'ZIP_CODE', 'zip_code', 'ZIP', 'zip', 'POSTAL_CODE', 'postal_code', 'SITE_TYPE', 'site_type', 'TYPE', 'type', 'STATUS', 'status', 'SITE_STATUS', 'site_status'];
              Object.entries(site).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;

              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi); // Add to POI layer group
              
              try {
                bounds.extend([site.lat, site.lon]);
              } catch (boundsError) {
                console.warn('Error extending bounds for NJ Known Contaminated Site:', boundsError);
              }
            } catch (error) {
              console.error('Error drawing NJ Known Contaminated Site:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (contaminatedSiteCount > 0) {
          if (!legendAccumulator['nj_known_contaminated_sites']) {
            legendAccumulator['nj_known_contaminated_sites'] = {
              icon: '⚠️',
              color: '#dc2626',
              title: 'NJ Known Contaminated Sites',
              count: 0,
            };
          }
          legendAccumulator['nj_known_contaminated_sites'].count += contaminatedSiteCount;
        }
      }

      // Draw NJ Alternative Fueled Vehicle Fueling Stations as markers on the map
      if (enrichments.nj_alternative_fuel_stations_all && Array.isArray(enrichments.nj_alternative_fuel_stations_all)) {
        let fuelStationCount = 0;
        enrichments.nj_alternative_fuel_stations_all.forEach((station: any) => {
          if (station.lat !== null && station.lat !== undefined && station.lon !== null && station.lon !== undefined) {
            try {
              fuelStationCount++;
              
              const stationName = station.stationName || station.STATION_NAME || station.station_name || station.NAME || station.name || station.FACILITY_NAME || station.facility_name || 'Unknown Station';
              const address = station.address || station.ADDRESS || station.address || '';
              const municipality = station.municipality || station.MUNICIPALITY || station.municipality || '';
              const county = station.county || station.COUNTY || station.county || '';
              const zipCode = station.zipCode || station.ZIP_CODE || station.zip_code || station.ZIP || station.zip || '';
              const fuelType = station.fuelType || station.FUEL_TYPE || station.fuel_type || station.TYPE || station.type || station.ALTERNATIVE_FUEL || station.alternative_fuel || '';
              const stationType = station.stationType || station.STATION_TYPE || station.station_type || station.FACILITY_TYPE || station.facility_type || '';

              // Create marker with green color for fuel stations
              const marker = L.marker([station.lat, station.lon], {
                icon: L.divIcon({
                  className: 'custom-marker-icon',
                  html: `<div style="background-color: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    <span style="color: white; font-size: 14px;">⛽</span>
                  </div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })
              });

              // Build popup content with all station attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    ⛽ ${stationName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                    ${municipality ? `<div><strong>Municipality:</strong> ${municipality}</div>` : ''}
                    ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                    ${zipCode ? `<div><strong>ZIP Code:</strong> ${zipCode}</div>` : ''}
                    ${fuelType ? `<div><strong>Fuel Type:</strong> ${fuelType}</div>` : ''}
                    ${stationType ? `<div><strong>Station Type:</strong> ${stationType}</div>` : ''}
                    ${station.distance_miles !== null && station.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${station.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all station attributes (excluding internal fields)
              const excludeFields = ['stationId', 'stationName', 'address', 'municipality', 'county', 'zipCode', 'fuelType', 'stationType', 'lat', 'lon', 'distance_miles', 'STATION_NAME', 'station_name', 'NAME', 'name', 'FACILITY_NAME', 'facility_name', 'ADDRESS', 'address', 'ADDR', 'addr', 'STREET_ADDRESS', 'street_address', 'MUNICIPALITY', 'municipality', 'MUNI', 'muni', 'CITY', 'city', 'COUNTY', 'county', 'ZIP_CODE', 'zip_code', 'ZIP', 'zip', 'POSTAL_CODE', 'postal_code', 'FUEL_TYPE', 'fuel_type', 'TYPE', 'type', 'ALTERNATIVE_FUEL', 'alternative_fuel', 'STATION_TYPE', 'station_type', 'FACILITY_TYPE', 'facility_type'];
              Object.entries(station).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;

              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi); // Add to POI layer group
              
              try {
                bounds.extend([station.lat, station.lon]);
              } catch (boundsError) {
                console.warn('Error extending bounds for NJ Alternative Fuel Station:', boundsError);
              }
            } catch (error) {
              console.error('Error drawing NJ Alternative Fuel Station:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (fuelStationCount > 0) {
          if (!legendAccumulator['nj_alternative_fuel_stations']) {
            legendAccumulator['nj_alternative_fuel_stations'] = {
              icon: '⛽',
              color: '#10b981',
              title: 'NJ Alternative Fuel Stations',
              count: 0,
            };
          }
          legendAccumulator['nj_alternative_fuel_stations'].count += fuelStationCount;
        }
      }

      // Draw NJ Power Plants as markers on the map
      if (enrichments.nj_power_plants_all && Array.isArray(enrichments.nj_power_plants_all)) {
        let powerPlantCount = 0;
        enrichments.nj_power_plants_all.forEach((plant: any) => {
          if (plant.lat !== null && plant.lat !== undefined && plant.lon !== null && plant.lon !== undefined) {
            try {
              powerPlantCount++;
              
              const plantName = plant.plantName || plant.PLANT_NAME || plant.plant_name || plant.NAME || plant.name || 'Unknown Power Plant';
              const utilityName = plant.utilityName || plant.UTILITY_NAME || plant.utility_name || '';
              const city = plant.city || plant.CITY || plant.city || '';
              const county = plant.county || plant.COUNTY || plant.county || '';
              const streetAddress = plant.streetAddress || plant.STREET_ADD || plant.street_add || plant.ADDRESS || plant.address || '';
              const primarySource = plant.primarySource || plant.PRIMSOURCE || plant.primsource || plant.PRIMARY_SOURCE || plant.primary_source || '';
              const installMW = plant.installMW !== null && plant.installMW !== undefined ? plant.installMW : null;
              const totalMW = plant.totalMW !== null && plant.totalMW !== undefined ? plant.totalMW : null;
              const sourceDescription = plant.sourceDescription || plant.SOURCE_DES || plant.source_des || '';
              const technical = plant.technical || plant.TECHNICAL || plant.technical || '';
              const edc = plant.edc || plant.EDC || plant.edc || '';
              const gridSupply = plant.gridSupply || plant.GRIDSUPPLY || plant.gridsupply || '';
              const dmrLink = plant.dmrLink || plant.DMR_LINK || plant.dmr_link || '';

              // Create marker with orange/yellow color for power plants
              const marker = L.marker([plant.lat, plant.lon], {
                icon: L.divIcon({
                  className: 'custom-marker-icon',
                  html: `<div style="background-color: #f59e0b; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    <span style="color: white; font-size: 14px;">⚡</span>
                  </div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })
              });

              // Build popup content with all plant attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    ⚡ ${plantName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${utilityName ? `<div><strong>Utility:</strong> ${utilityName}</div>` : ''}
                    ${streetAddress ? `<div><strong>Address:</strong> ${streetAddress}</div>` : ''}
                    ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                    ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                    ${primarySource ? `<div><strong>Primary Source:</strong> ${primarySource}</div>` : ''}
                    ${installMW !== null ? `<div><strong>Installed Capacity:</strong> ${installMW.toFixed(1)} MW</div>` : ''}
                    ${totalMW !== null ? `<div><strong>Total Capacity:</strong> ${totalMW.toFixed(1)} MW</div>` : ''}
                    ${sourceDescription ? `<div><strong>Source Description:</strong> ${sourceDescription}</div>` : ''}
                    ${technical ? `<div><strong>Technical:</strong> ${technical}</div>` : ''}
                    ${edc ? `<div><strong>EDC:</strong> ${edc}</div>` : ''}
                    ${gridSupply ? `<div><strong>Grid Supply:</strong> ${gridSupply}</div>` : ''}
                    ${plant.distance_miles !== null && plant.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${plant.distance_miles.toFixed(2)} miles</div>` : ''}
                    ${dmrLink ? `<div><strong><a href="${dmrLink}" target="_blank" rel="noopener noreferrer">DMR Link</a></strong></div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all plant attributes (excluding internal fields)
              const excludeFields = ['plantId', 'plantCode', 'plantName', 'utilityName', 'siteId', 'airPi', 'city', 'county', 'streetAddress', 'primarySource', 'installMW', 'totalMW', 'sourceDescription', 'technical', 'edc', 'gridSupply', 'dmrLink', 'lat', 'lon', 'distance_miles', 'PLANT_NAME', 'plant_name', 'NAME', 'name', 'UTILITY_NAME', 'utility_name', 'CITY', 'city', 'COUNTY', 'county', 'STREET_ADD', 'street_add', 'ADDRESS', 'address', 'PRIMSOURCE', 'primsource', 'PRIMARY_SOURCE', 'primary_source', 'INSTALL_MW', 'install_mw', 'TOTAL_MW', 'total_mw', 'SOURCE_DES', 'source_des', 'SOURCE_DESC', 'source_desc', 'TECHNICAL', 'technical', 'EDC', 'edc', 'GRIDSUPPLY', 'gridsupply', 'GRID_SUPPLY', 'grid_supply', 'DMR_LINK', 'dmr_link', 'DMR', 'dmr', 'LATITUDE', 'LONGITUDE'];
              Object.entries(plant).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;

              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi); // Add to POI layer group
              
              try {
                bounds.extend([plant.lat, plant.lon]);
              } catch (boundsError) {
                console.warn('Error extending bounds for NJ Power Plant:', boundsError);
              }
            } catch (error) {
              console.error('Error drawing NJ Power Plant:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (powerPlantCount > 0) {
          if (!legendAccumulator['nj_power_plants']) {
            legendAccumulator['nj_power_plants'] = {
              icon: '⚡',
              color: '#f59e0b',
              title: 'NJ Power Plants',
              count: 0,
            };
          }
          legendAccumulator['nj_power_plants'].count += powerPlantCount;
        }
      }

      // Draw NJ Public Solar Facilities as markers on the map
      if (enrichments.nj_public_solar_facilities_all && Array.isArray(enrichments.nj_public_solar_facilities_all)) {
        let solarFacilityCount = 0;
        enrichments.nj_public_solar_facilities_all.forEach((facility: any) => {
          if (facility.lat !== null && facility.lat !== undefined && facility.lon !== null && facility.lon !== undefined) {
            try {
              solarFacilityCount++;
              
              const companyName = facility.companyName || facility.COMPNAME || facility.compname || facility.COMPANY_NAME || facility.company_name || facility.NAME || facility.name || 'Unknown Facility';
              const systemSize = facility.systemSize !== null && facility.systemSize !== undefined ? facility.systemSize : null;
              const customerType = facility.customerType || facility.CUSTOMERTYPE || facility.customertype || facility.CUSTOMER_TYPE || facility.customer_type || '';
              const installAddress = facility.installAddress || facility.INSTALLADD || facility.installadd || facility.INSTALL_ADDRESS || facility.install_address || facility.ADDRESS || facility.address || '';
              const installCity = facility.installCity || facility.INSTALLCITY || facility.installcity || facility.INSTALL_CITY || facility.install_city || facility.CITY || facility.city || '';
              const installZip = facility.installZip || facility.INSTALLZIP || facility.installzip || facility.INSTALL_ZIP || facility.install_zip || facility.ZIP || facility.zip || '';
              const installer = facility.installer || facility.INSTALLER || facility.installer || '';
              const accountNumber = facility.accountNumber || facility.ACCOUNT_NUMBER || facility.account_number || '';
              const statusDate = facility.statusDate !== null && facility.statusDate !== undefined ? facility.statusDate : null;
              
              // Format status date if available (it's a timestamp in milliseconds)
              let statusDateFormatted = '';
              if (statusDate !== null) {
                try {
                  const date = new Date(statusDate);
                  statusDateFormatted = date.toLocaleDateString();
                } catch (e) {
                  statusDateFormatted = statusDate.toString();
                }
              }

              // Create marker with yellow/gold color for solar facilities
              const marker = L.marker([facility.lat, facility.lon], {
                icon: L.divIcon({
                  className: 'custom-marker-icon',
                  html: `<div style="background-color: #fbbf24; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    <span style="color: white; font-size: 14px;">☀️</span>
                  </div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })
              });

              // Build popup content with all facility attributes
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    ☀️ ${companyName}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${systemSize !== null ? `<div><strong>System Size:</strong> ${systemSize.toFixed(2)} kW</div>` : ''}
                    ${customerType ? `<div><strong>Customer Type:</strong> ${customerType}</div>` : ''}
                    ${installAddress ? `<div><strong>Address:</strong> ${installAddress}</div>` : ''}
                    ${installCity ? `<div><strong>City:</strong> ${installCity}</div>` : ''}
                    ${installZip ? `<div><strong>ZIP Code:</strong> ${installZip}</div>` : ''}
                    ${installer ? `<div><strong>Installer:</strong> ${installer}</div>` : ''}
                    ${accountNumber ? `<div><strong>Account Number:</strong> ${accountNumber}</div>` : ''}
                    ${statusDateFormatted ? `<div><strong>Status Date:</strong> ${statusDateFormatted}</div>` : ''}
                    ${facility.distance_miles !== null && facility.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${facility.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all facility attributes (excluding internal fields)
              const excludeFields = ['facilityId', 'accountNumber', 'companyName', 'systemSize', 'customerType', 'installAddress', 'installCity', 'installZip', 'installer', 'statusDate', 'lat', 'lon', 'distance_miles', 'COMPNAME', 'compname', 'COMPANY_NAME', 'company_name', 'NAME', 'name', 'SYSTEMSIZE', 'systemsize', 'CUSTOMERTYPE', 'customertype', 'CUSTOMER_TYPE', 'customer_type', 'INSTALLADD', 'installadd', 'INSTALL_ADDRESS', 'install_address', 'ADDRESS', 'address', 'INSTALLCITY', 'installcity', 'INSTALL_CITY', 'install_city', 'CITY', 'city', 'INSTALLZIP', 'installzip', 'INSTALL_ZIP', 'install_zip', 'ZIP', 'zip', 'INSTALLER', 'installer', 'ACCOUNT_NUMBER', 'account_number', 'ACCOUNT', 'account', 'STATUSDATE', 'statusdate', 'LATITUDE', 'LONGITUDE'];
              Object.entries(facility).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;

              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi); // Add to POI layer group
              
              try {
                bounds.extend([facility.lat, facility.lon]);
              } catch (boundsError) {
                console.warn('Error extending bounds for NJ Public Solar Facility:', boundsError);
              }
            } catch (error) {
              console.error('Error drawing NJ Public Solar Facility:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (solarFacilityCount > 0) {
          if (!legendAccumulator['nj_public_solar_facilities']) {
            legendAccumulator['nj_public_solar_facilities'] = {
              icon: '☀️',
              color: '#fbbf24',
              title: 'NJ Public Solar Facilities',
              count: 0,
            };
          }
          legendAccumulator['nj_public_solar_facilities'].count += solarFacilityCount;
        }
      }

      // Draw NJ Public Places to Keep Cool as markers on the map
      if (enrichments.nj_public_places_to_keep_cool_all && Array.isArray(enrichments.nj_public_places_to_keep_cool_all)) {
        let placeCount = 0;
        enrichments.nj_public_places_to_keep_cool_all.forEach((place: any) => {
          if (place.lat !== null && place.lat !== undefined && place.lon !== null && place.lon !== undefined) {
            try {
              placeCount++;
              
              const featureName = place.featureName || place.FEATURE_NAME || place.feature_name || place.NAME || place.name || 'Unknown Place';
              const featureType = place.featureType || place.FEATURE_TYPE || place.feature_type || place.FeatureType || '';
              const address = place.address || place.ADDRESS || place.address || '';
              const city = place.city || place.CITY || place.city || '';
              const zip = place.zip || place.ZIP || place.zip || '';
              const municipality = place.municipality || place.MUNICIPALITY || place.municipality || '';
              const county = place.county || place.COUNTY || place.county || '';
              const website = place.website || place.WEBSITE || place.website || '';
              const phoneNumber = place.phoneNumber || place.PHONE_NUMBER || place.phone_number || place.PHONE || place.phone || '';
              const admission = place.admission || place.ADMISSION || place.admission || '';
              const in211 = place.in211 || place.IN_211 || place.in_211 || place.IN211 || place.in211 || '';
              const notes = place.notes || place.NOTES || place.notes || '';
              const distanceMiles = place.distance_miles !== null && place.distance_miles !== undefined ? place.distance_miles : null;

              // Create marker with blue color for cooling places
              const marker = L.marker([place.lat, place.lon], {
                icon: L.divIcon({
                  className: 'custom-marker',
                  html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">❄️</div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                }),
              });

              // Build popup content
              let popupContent = `
                <div style="max-width: 300px;">
                  <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1e40af;">
                    ${featureName}
                  </div>
                  <div style="font-size: 12px; color: #4b5563;">
              `;

              if (featureType) {
                popupContent += `<div style="margin-bottom: 4px;"><strong>Type:</strong> ${featureType}</div>`;
              }
              if (address) {
                popupContent += `<div style="margin-bottom: 4px;"><strong>Address:</strong> ${address}</div>`;
              }
              if (city) {
                popupContent += `<div style="margin-bottom: 4px;"><strong>City:</strong> ${city}</div>`;
              }
              if (zip) {
                popupContent += `<div style="margin-bottom: 4px;"><strong>ZIP:</strong> ${zip}</div>`;
              }
              if (municipality) {
                popupContent += `<div style="margin-bottom: 4px;"><strong>Municipality:</strong> ${municipality}</div>`;
              }
              if (county) {
                popupContent += `<div style="margin-bottom: 4px;"><strong>County:</strong> ${county}</div>`;
              }
              if (phoneNumber) {
                popupContent += `<div style="margin-bottom: 4px;"><strong>Phone:</strong> ${phoneNumber}</div>`;
              }
              if (website) {
                popupContent += `<div style="margin-bottom: 4px;"><strong>Website:</strong> <a href="${website}" target="_blank" rel="noopener noreferrer">${website}</a></div>`;
              }
              if (admission) {
                popupContent += `<div style="margin-bottom: 4px;"><strong>Admission:</strong> ${admission}</div>`;
              }
              if (in211) {
                popupContent += `<div style="margin-bottom: 4px;"><strong>In 211:</strong> ${in211}</div>`;
              }
              if (notes) {
                popupContent += `<div style="margin-bottom: 4px;"><strong>Notes:</strong> ${notes}</div>`;
              }
              if (distanceMiles !== null) {
                popupContent += `<div style="margin-bottom: 4px;"><strong>Distance:</strong> ${distanceMiles.toFixed(2)} miles</div>`;
              }

              // Add all other attributes
              Object.keys(place).forEach(key => {
                if (!['lat', 'lon', 'distance_miles', 'featureName', 'FEATURE_NAME', 'feature_name', 'NAME', 'name', 'featureType', 'FEATURE_TYPE', 'feature_type', 'FeatureType', 'address', 'ADDRESS', 'address', 'city', 'CITY', 'city', 'zip', 'ZIP', 'zip', 'municipality', 'MUNICIPALITY', 'municipality', 'county', 'COUNTY', 'county', 'website', 'WEBSITE', 'website', 'phoneNumber', 'PHONE_NUMBER', 'phone_number', 'PHONE', 'phone', 'admission', 'ADMISSION', 'admission', 'in211', 'IN_211', 'in_211', 'IN211', 'in211', 'notes', 'NOTES', 'notes'].includes(key)) {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = place[key];
                  
                  if (typeof displayValue === 'object') {
                    displayValue = JSON.stringify(displayValue);
                  } else if (typeof displayValue === 'number') {
                    displayValue = displayValue.toLocaleString();
                  } else {
                    displayValue = String(displayValue);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;

              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi); // Add to POI layer group
              
              try {
                bounds.extend([place.lat, place.lon]);
              } catch (boundsError) {
                console.warn('Error extending bounds for NJ Public Place to Keep Cool:', boundsError);
              }
            } catch (error) {
              console.error('Error drawing NJ Public Place to Keep Cool:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (placeCount > 0) {
          if (!legendAccumulator['nj_public_places_to_keep_cool']) {
            legendAccumulator['nj_public_places_to_keep_cool'] = {
              icon: '❄️',
              color: '#3b82f6',
              title: 'NJ Public Places to Keep Cool',
              count: 0,
            };
          }
          legendAccumulator['nj_public_places_to_keep_cool'].count += placeCount;
        }
      }

      // Draw DE Parcels as polygons on the map
      if (enrichments.de_parcels_all && Array.isArray(enrichments.de_parcels_all)) {
        let parcelCount = 0;
        enrichments.de_parcels_all.forEach((parcel: any) => {
          if (parcel.geometry && parcel.geometry.rings) {
            try {
              const rings = parcel.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0];
                const latlngs = outerRing.map((coord: number[]) => {
                  return [coord[1], coord[0]] as [number, number];
                });

                if (latlngs.length < 3) {
                  console.warn('DE Parcel polygon has less than 3 coordinates, skipping');
                  return;
                }

                const isContaining = parcel.isContaining;
                const color = isContaining ? '#dc2626' : '#3b82f6';
                const weight = isContaining ? 3 : 2;

                const parcelId = parcel.parcelId || parcel.PIN || parcel.pin || parcel.OBJECTID || 'Unknown';
                const pin = parcel.PIN || parcel.pin || '';
                const acres = parcel.ACRES || parcel.acres || null;
                const county = parcel.COUNTY || parcel.county || '';

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: 0.7,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🏠 DE Parcel ${parcelId}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${isContaining ? '<div><strong>Status:</strong> Contains Location</div>' : ''}
                      ${parcel.distance_miles !== null && parcel.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${parcel.distance_miles.toFixed(2)} miles</div>` : ''}
                      ${pin ? `<div><strong>PIN:</strong> ${pin}</div>` : ''}
                      ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                      ${acres !== null ? `<div><strong>Acres:</strong> ${acres.toLocaleString()}</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                const excludeFields = ['parcelId', 'PIN', 'pin', 'OBJECTID', 'objectid', 'isContaining', 'geometry', 'distance_miles', 'ACRES', 'acres', 'COUNTY', 'county'];
                Object.entries(parcel).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;

                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                
                try {
                  bounds.extend(polygon.getBounds());
                  parcelCount++;
                } catch (boundsError) {
                  console.warn('Error extending bounds for DE Parcel polygon:', boundsError);
                }
              }
            } catch (error) {
              console.error('Error drawing DE Parcel polygon:', error);
            }
          }
        });
        
        if (parcelCount > 0) {
          if (!legendAccumulator['de_parcels']) {
            legendAccumulator['de_parcels'] = {
              icon: '🏠',
              color: '#dc2626',
              title: 'DE Parcels',
              count: 0,
            };
          }
          legendAccumulator['de_parcels'].count += parcelCount;
        }
      }

      // Draw DE LULC layers as polygons on the map
      const lulcLayers = [
        { key: 'de_lulc_2007_all', year: '2007', color: '#8b5cf6' },
        { key: 'de_lulc_2007_revised_all', year: '2007 Revised', color: '#7c3aed' },
        { key: 'de_lulc_2012_all', year: '2012', color: '#6366f1' },
        { key: 'de_lulc_2017_all', year: '2017', color: '#4f46e5' },
        { key: 'de_lulc_2022_all', year: '2022', color: '#4338ca' }
      ];

      lulcLayers.forEach(({ key, year, color }) => {
        if (enrichments[key] && Array.isArray(enrichments[key])) {
          let lulcCount = 0;
          enrichments[key].forEach((lulc: any) => {
            if (lulc.geometry && lulc.geometry.rings) {
              try {
                const rings = lulc.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn(`DE LULC ${year} polygon has less than 3 coordinates, skipping`);
                    return;
                  }

                  const lulcCode = lulc.lulcCode || lulc.LULC_CODE2007 || lulc.LULC_CODE2012 || lulc.LULC_CODE2017 || lulc.LULC_CODE2022 || null;
                  const lulcCategory = lulc.lulcCategory || lulc.LULC_CATEGORY2007 || lulc.LULC_CATEGORY2012 || lulc.LULC_CATEGORY2017 || lulc.LULC_CATEGORY2022 || 'Unknown';

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: 2,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.3
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🗺️ DE LULC ${year}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${lulcCode !== null ? `<div><strong>LULC Code:</strong> ${lulcCode}</div>` : ''}
                        ${lulcCategory ? `<div><strong>Category:</strong> ${lulcCategory}</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['lulcCode', 'lulcCategory', 'geometry', 'LULC_CODE2007', 'LULC_CATEGORY2007', 'LULC_CODE2012', 'LULC_CATEGORY2012', 'LULC_CODE2017', 'LULC_CATEGORY2017', 'LULC_CODE2022', 'LULC_CATEGORY2022'];
                  Object.entries(lulc).forEach(([fieldKey, value]) => {
                    if (!excludeFields.includes(fieldKey) && value !== null && value !== undefined && value !== '') {
                      const displayKey = fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent, { maxWidth: 400 });
                  polygon.addTo(primary);
                  
                  try {
                    bounds.extend(polygon.getBounds());
                    lulcCount++;
                  } catch (boundsError) {
                    console.warn(`Error extending bounds for DE LULC ${year} polygon:`, boundsError);
                  }
                }
              } catch (error) {
                console.error(`Error drawing DE LULC ${year} polygon:`, error);
              }
            }
          });
          
          if (lulcCount > 0) {
            if (!legendAccumulator[key.replace('_all', '')]) {
              legendAccumulator[key.replace('_all', '')] = {
                icon: '🗺️',
                color: color,
                title: `DE LULC ${year}`,
                count: 0,
              };
            }
            legendAccumulator[key.replace('_all', '')].count += lulcCount;
          }
        }
      });

      // Draw CT Building Footprints as polygons on the map
      if (enrichments.ct_building_footprints_all && Array.isArray(enrichments.ct_building_footprints_all)) {
        let buildingCount = 0;
        enrichments.ct_building_footprints_all.forEach((building: any) => {
          if (building.geometry && building.geometry.rings) {
            try {
              // Convert ESRI polygon rings to Leaflet LatLng array
              // ESRI polygons have rings (outer ring + holes), we'll use the first ring (outer boundary)
              const rings = building.geometry.rings;
              if (rings && rings.length > 0) {
                const outerRing = rings[0]; // First ring is the outer boundary
                const latlngs = outerRing.map((coord: number[]) => {
                  // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                  // Since we requested outSR=4326, coordinates should already be in WGS84
                  // Convert [lon, lat] to [lat, lon] for Leaflet
                  return [coord[1], coord[0]] as [number, number];
                });

                // Validate coordinates
                if (latlngs.length < 3) {
                  console.warn('CT Building Footprint polygon has less than 3 coordinates, skipping');
                  return;
                }

                const isContaining = building.isContaining;
                const color = isContaining ? '#dc2626' : '#3b82f6'; // Red for containing, blue for nearby
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;

                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });

                // Build popup content with all building attributes
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ${isContaining ? '📍 Containing Building' : '🏢 Nearby Building'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; max-height: 400px; overflow-y: auto;">
                `;
                
                // Add all building attributes (excluding internal fields)
                const excludeFields = ['buildingId', 'isContaining', 'distance_miles', 'geometry'];
                Object.entries(building).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let displayValue = '';
                    
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else {
                      displayValue = String(value);
                    }
                    
                    popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                polygon.addTo(primary);
                
                try {
                  bounds.extend(polygon.getBounds());
                  buildingCount++;
                } catch (boundsError) {
                  console.warn('Error extending bounds for CT Building Footprint polygon:', boundsError);
                }
              }
            } catch (error) {
              console.error('Error drawing CT building footprint polygon:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (buildingCount > 0) {
          if (!legendAccumulator['ct_building_footprints']) {
            legendAccumulator['ct_building_footprints'] = {
              icon: '🏢',
              color: '#3b82f6',
              title: 'CT 2D Building Footprints',
              count: 0,
            };
          }
          legendAccumulator['ct_building_footprints'].count += buildingCount;
        }
      }

      // Draw CT Roads and Trails as polylines on the map
      if (enrichments.ct_roads_all && Array.isArray(enrichments.ct_roads_all)) {
        let roadCount = 0;
        enrichments.ct_roads_all.forEach((road: any) => {
          if (road.geometry && road.geometry.paths) {
            try {
              // Convert ESRI polyline paths to Leaflet LatLng arrays
              // ESRI polylines have paths (array of coordinate arrays)
              const paths = road.geometry.paths;
              if (paths && paths.length > 0) {
                roadCount++;
                // For each path in the polyline, create a separate polyline
                paths.forEach((path: number[][]) => {
                  const latlngs = path.map((coord: number[]) => {
                    // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                    // Since we requested outSR=4326, coordinates should already be in WGS84
                    // Convert [lon, lat] to [lat, lon] for Leaflet
                    return [coord[1], coord[0]] as [number, number];
                  });

                  const roadClass = road.roadClass || road.ROAD_CLASS || road.RoadClass || 'Unknown Road';
                  const avLegend = road.avLegend || road.AV_LEGEND || road.AvLegend || null;
                  const imsLegend = road.imsLegend || road.IMS_LEGEND || road.ImsLegend || null;
                  const lengthMiles = road.lengthMiles !== null && road.lengthMiles !== undefined ? road.lengthMiles : null;

                  // Create polyline with yellow color for CT roads
                  const polyline = L.polyline(latlngs, {
                    color: '#fbbf24', // Yellow color for CT roads (better visibility on imagery basemap)
                    weight: 3,
                    opacity: 0.7,
                    smoothFactor: 1
                  });

                  // Build popup content with all road attributes
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🛣️ ${roadClass}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${avLegend ? `<div><strong>AV Legend:</strong> ${avLegend}</div>` : ''}
                        ${imsLegend ? `<div><strong>IMS Legend:</strong> ${imsLegend}</div>` : ''}
                        ${lengthMiles !== null ? `<div><strong>Length:</strong> ${lengthMiles.toFixed(2)} miles</div>` : ''}
                        ${road.distance_miles !== null && road.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${road.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all road attributes (excluding internal fields)
                  const excludeFields = ['roadClass', 'ROAD_CLASS', 'RoadClass', 'avLegend', 'AV_LEGEND', 'AvLegend', 'imsLegend', 'IMS_LEGEND', 'ImsLegend', 'lengthMiles', 'LENGTH_MI', 'length_mi', 'geometry', 'distance_miles'];
                  Object.entries(road).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polyline.bindPopup(popupContent, { maxWidth: 400 });
                  polyline.addTo(poi);
                  bounds.extend(polyline.getBounds());
                });
              }
            } catch (error) {
              console.error('Error drawing CT Road polyline:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (roadCount > 0) {
          if (!legendAccumulator['ct_roads']) {
            legendAccumulator['ct_roads'] = {
              icon: '🛣️',
              color: '#fbbf24',
              title: 'CT Roads and Trails',
              count: 0,
            };
          }
          legendAccumulator['ct_roads'].count += roadCount;
        }
      }

      // Draw CT Urgent Care facilities as points on the map
      if (enrichments.ct_urgent_care_all && Array.isArray(enrichments.ct_urgent_care_all)) {
        let facilityCount = 0;
        enrichments.ct_urgent_care_all.forEach((facility: any) => {
          if (facility.lat && facility.lon) {
            try {
              facilityCount++;
              
              // Create marker icon for urgent care facilities
              const urgentCareIcon = L.divIcon({
                className: 'custom-marker-icon',
                html: `<div style="background-color: #f97316; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><span style="color: white; font-size: 14px;">🏥</span></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              });
              
              const marker = L.marker([facility.lat, facility.lon], { icon: urgentCareIcon });
              
              // Build popup content
              const name = facility.name || facility.NAME || 'Unnamed Urgent Care';
              const address = facility.address || facility.ADDRESS || '';
              const city = facility.city || facility.CITY || '';
              const state = facility.state || facility.STATE || 'CT';
              const zip = facility.zip || facility.ZIP || '';
              const phone = facility.phone || facility.PHONE || '';
              const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
              
              let popupContent = `
                <div style="min-width: 250px; max-width: 400px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                    🏥 ${name}
                  </h3>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${fullAddress ? `<div><strong>Address:</strong> ${fullAddress}</div>` : ''}
                    ${phone ? `<div><strong>Phone:</strong> ${phone}</div>` : ''}
                    ${facility.distance_miles !== null && facility.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${facility.distance_miles.toFixed(2)} miles</div>` : ''}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              `;
              
              // Add all facility attributes (excluding internal fields)
              const excludeFields = ['id', 'ID', 'name', 'NAME', 'address', 'ADDRESS', 'city', 'CITY', 'state', 'STATE', 'zip', 'ZIP', 'phone', 'PHONE', 'lat', 'lon', 'LATITUDE', 'LONGITUDE', 'distance_miles', 'attributes'];
              const attrs = facility.attributes || facility;
              Object.entries(attrs).forEach(([key, value]) => {
                if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = '';
                  
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else {
                    displayValue = String(value);
                  }
                  
                  popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                }
              });
              
              popupContent += `
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { maxWidth: 400 });
              marker.addTo(poi);
              bounds.extend([facility.lat, facility.lon]);
            } catch (error) {
              console.error('Error drawing CT Urgent Care marker:', error);
            }
          }
        });
        
        // Add to legend accumulator
        if (facilityCount > 0) {
          if (!legendAccumulator['ct_urgent_care']) {
            legendAccumulator['ct_urgent_care'] = {
              icon: '🏥',
              color: '#f97316',
              title: 'CT Urgent Care',
              count: 0,
            };
          }
          legendAccumulator['ct_urgent_care'].count += facilityCount;
        }
      }

      // Draw CT DEEP Properties as polygons on the map
      try {
        if (enrichments.ct_deep_properties_all && Array.isArray(enrichments.ct_deep_properties_all)) {
          let propertyCount = 0;
          enrichments.ct_deep_properties_all.forEach((property: any) => {
            if (property.geometry && property.geometry.rings) {
              try {
                // Convert ESRI polygon rings to Leaflet LatLng array
                const rings = property.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0]; // First ring is the outer boundary
                  const latlngs = outerRing.map((coord: number[]) => {
                    // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                    // Since we requested outSR=4326, coordinates should already be in WGS84
                    // Convert [lon, lat] to [lat, lon] for Leaflet
                    return [coord[1], coord[0]] as [number, number];
                  });

                  // Validate coordinates
                  if (latlngs.length < 3) {
                    console.warn('CT DEEP Property polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const isContaining = property.isContaining;
                  const color = isContaining ? '#059669' : '#10b981'; // Darker green for containing, lighter for nearby
                  const weight = isContaining ? 3 : 2;

                  const propertyName = property.propertyName || property.PROPERTY || property.property || 'CT DEEP Property';
                  const avLegend = property.avLegend || property.AV_LEGEND || null;
                  const imsLegend = property.imsLegend || property.IMS_LEGEND || null;
                  const depId = property.depId || property.DEP_ID || null;
                  const agencyFunctionCode = property.agencyFunctionCode || property.AGNCYFN_CD || null;
                  const acreage = property.acreage !== null && property.acreage !== undefined ? property.acreage : null;

                  // Create polygon
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  // Build popup content with all property attributes
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🏞️ ${propertyName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${isContaining ? '<div><strong>Status:</strong> Contains Location</div>' : ''}
                        ${property.distance_miles !== null && property.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${property.distance_miles.toFixed(2)} miles</div>` : ''}
                        ${avLegend ? `<div><strong>AV Legend:</strong> ${avLegend}</div>` : ''}
                        ${imsLegend ? `<div><strong>IMS Legend:</strong> ${imsLegend}</div>` : ''}
                        ${depId ? `<div><strong>DEP ID:</strong> ${depId}</div>` : ''}
                        ${agencyFunctionCode ? `<div><strong>Agency Function Code:</strong> ${agencyFunctionCode}</div>` : ''}
                        ${acreage !== null ? `<div><strong>Acreage:</strong> ${acreage.toFixed(2)} acres</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all property attributes (excluding internal fields)
                  const excludeFields = ['propertyId', 'propertyName', 'PROPERTY', 'property', 'avLegend', 'AV_LEGEND', 'AvLegend', 'imsLegend', 'IMS_LEGEND', 'ImsLegend', 'depId', 'DEP_ID', 'agencyFunctionCode', 'AGNCYFN_CD', 'acreage', 'ACRE_GIS', 'acre_gis', 'geometry', 'distance_miles', 'isContaining'];
                  Object.entries(property).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent, { maxWidth: 400 });
                  polygon.addTo(primary); // Add to primary layer group
                  
                  try {
                    bounds.extend(polygon.getBounds());
                  } catch (boundsError) {
                    console.warn('Error extending bounds for CT DEEP Property polygon:', boundsError);
                  }
                  
                  propertyCount++;
                }
              } catch (error) {
                console.error('Error drawing CT DEEP Property polygon:', error);
              }
            }
          });
          
          // Add to legend accumulator
          if (propertyCount > 0) {
            if (!legendAccumulator['ct_deep_properties']) {
              legendAccumulator['ct_deep_properties'] = {
                icon: '🏞️',
                color: '#059669',
                title: 'CT DEEP Properties',
                count: 0,
              };
            }
            legendAccumulator['ct_deep_properties'].count += propertyCount;
          }
        }
      } catch (error) {
        console.error('Error processing CT DEEP Properties:', error);
      }

      // Draw CT Tribal Lands as polygons on the map
      try {
        if (enrichments.ct_tribal_lands_all && Array.isArray(enrichments.ct_tribal_lands_all)) {
          let tribalLandCount = 0;
          enrichments.ct_tribal_lands_all.forEach((tribalLand: any) => {
            if (tribalLand.geometry && tribalLand.geometry.rings) {
              try {
                const rings = tribalLand.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CT Tribal Land polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const isContaining = tribalLand.isContaining;
                  // Use different colors based on recognition type
                  let color = '#8b5cf6'; // Default purple
                  if (tribalLand.recognitionType === 'Federally Recognized') {
                    color = isContaining ? '#059669' : '#10b981'; // Green shades
                  } else if (tribalLand.recognitionType === 'State Recognized') {
                    color = isContaining ? '#dc2626' : '#ef4444'; // Red shades
                  }
                  const weight = isContaining ? 3 : 2;

                  const name = tribalLand.name || tribalLand.NAME || 'CT Tribal Land';
                  const nameLsad = tribalLand.nameLsad || tribalLand.NAMELSAD || null;
                  const recognitionType = tribalLand.recognitionType || null;

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🏛️ ${name}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${isContaining ? '<div><strong>Status:</strong> Contains Location</div>' : ''}
                        ${tribalLand.distance_miles !== null && tribalLand.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${tribalLand.distance_miles.toFixed(2)} miles</div>` : ''}
                        ${recognitionType ? `<div><strong>Recognition:</strong> ${recognitionType}</div>` : ''}
                        ${nameLsad ? `<div><strong>Full Name:</strong> ${nameLsad}</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['tribalLandId', 'name', 'NAME', 'nameLsad', 'NAMELSAD', 'recognitionType', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid'];
                  Object.entries(tribalLand).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent, { maxWidth: 400 });
                  polygon.addTo(primary);
                  
                  try {
                    bounds.extend(polygon.getBounds());
                    tribalLandCount++;
                  } catch (boundsError) {
                    console.warn('Error extending bounds for CT Tribal Land polygon:', boundsError);
                  }
                }
              } catch (error) {
                console.error('Error drawing CT Tribal Land polygon:', error);
              }
            }
          });
          
          if (tribalLandCount > 0) {
            if (!legendAccumulator['ct_tribal_lands']) {
              legendAccumulator['ct_tribal_lands'] = {
                icon: '🏛️',
                color: '#8b5cf6',
                title: 'CT Tribal Lands',
                count: 0,
              };
            }
            legendAccumulator['ct_tribal_lands'].count += tribalLandCount;
          }
        }
      } catch (error) {
        console.error('Error processing CT Tribal Lands:', error);
      }

      // Draw CT Drinking Water Watersheds as polygons on the map
      try {
        if (enrichments.ct_drinking_water_watersheds_all && Array.isArray(enrichments.ct_drinking_water_watersheds_all)) {
          let watershedCount = 0;
          enrichments.ct_drinking_water_watersheds_all.forEach((watershed: any) => {
            if (watershed.geometry && watershed.geometry.rings) {
              try {
                const rings = watershed.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CT Drinking Water Watershed polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const isContaining = watershed.isContaining;
                  const color = isContaining ? '#0891b2' : '#06b6d4'; // Darker blue for containing, lighter for nearby
                  const weight = isContaining ? 3 : 2;

                  const pwsName = watershed.pwsName || watershed.pws_name || watershed.PWS_NAME || 'CT Drinking Water Watershed';
                  const pwsId = watershed.pwsId || watershed.pws_id || watershed.PWS_ID || null;
                  const shed = watershed.shed || watershed.SHED || null;
                  const status = watershed.status || watershed.STATUS || null;
                  const acres = watershed.acres !== null && watershed.acres !== undefined ? watershed.acres : null;

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        💧 ${pwsName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${isContaining ? '<div><strong>Status:</strong> Contains Location</div>' : ''}
                        ${watershed.distance_miles !== null && watershed.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${watershed.distance_miles.toFixed(2)} miles</div>` : ''}
                        ${pwsId ? `<div><strong>PWS ID:</strong> ${pwsId}</div>` : ''}
                        ${shed ? `<div><strong>Watershed:</strong> ${shed}</div>` : ''}
                        ${status ? `<div><strong>Status:</strong> ${status}</div>` : ''}
                        ${acres !== null ? `<div><strong>Acres:</strong> ${acres.toFixed(2)} acres</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['watershedId', 'pwsName', 'pws_name', 'PWS_NAME', 'pwsId', 'pws_id', 'PWS_ID', 'shed', 'SHED', 'status', 'STATUS', 'acres', 'ACRES', 'st_area_sh', 'ST_AREA_SH', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid'];
                  Object.entries(watershed).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = '';
                      
                      if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      } else {
                        displayValue = String(value);
                      }
                      
                      popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent, { maxWidth: 400 });
                  polygon.addTo(primary);
                  
                  try {
                    bounds.extend(polygon.getBounds());
                    watershedCount++;
                  } catch (boundsError) {
                    console.warn('Error extending bounds for CT Drinking Water Watershed polygon:', boundsError);
                  }
                }
              } catch (error) {
                console.error('Error drawing CT Drinking Water Watershed polygon:', error);
              }
            }
          });
          
          if (watershedCount > 0) {
            if (!legendAccumulator['ct_drinking_water_watersheds']) {
              legendAccumulator['ct_drinking_water_watersheds'] = {
                icon: '💧',
                color: '#0891b2',
                title: 'CT Drinking Water Watersheds',
                count: 0,
              };
            }
            legendAccumulator['ct_drinking_water_watersheds'].count += watershedCount;
          }
        }
      } catch (error) {
        console.error('Error processing CT Drinking Water Watersheds:', error);
      }

      // Draw CT Broadband Availability blocks
      try {
        if (enrichments.ct_broadband_availability_all && Array.isArray(enrichments.ct_broadband_availability_all)) {
          let blockCount = 0;
          // Track counts for each served range
          const rangeCounts: Record<string, { label: string; color: string; count: number }> = {
            'no_data': { label: 'No Data', color: '#9ca3af', count: 0 },
            '0': { label: '0 served', color: '#dc2626', count: 0 },
            '1-10': { label: '1-10 served', color: '#f97316', count: 0 },
            '11-25': { label: '11-25 served', color: '#fb923c', count: 0 },
            '26-50': { label: '26-50 served', color: '#eab308', count: 0 },
            '51-100': { label: '51-100 served', color: '#22c55e', count: 0 },
            '101-250': { label: '101-250 served', color: '#16a34a', count: 0 },
            '251+': { label: '251+ served', color: '#15803d', count: 0 }
          };
          
          enrichments.ct_broadband_availability_all.forEach((block: any) => {
            if (block.geometry && block.geometry.rings) {
              try {
                const rings = block.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CT Broadband Availability block polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const isContaining = block.isContaining;
                  
                  // Get served count for color coding
                  const served = block.served !== null && block.served !== undefined 
                    ? parseInt(block.served.toString()) 
                    : (block.served_locations !== null && block.served_locations !== undefined 
                      ? parseInt(block.served_locations.toString()) 
                      : null);
                  
                  // Color code based on served count ranges
                  let color: string;
                  let colorLabel: string;
                  let rangeKey: string;
                  if (served === null || served === undefined) {
                    // No data - gray
                    color = '#9ca3af';
                    colorLabel = 'No Data';
                    rangeKey = 'no_data';
                  } else if (served === 0) {
                    // 0 served - red
                    color = '#dc2626';
                    colorLabel = '0 served';
                    rangeKey = '0';
                  } else if (served <= 10) {
                    // 1-10 served - orange-red
                    color = '#f97316';
                    colorLabel = '1-10 served';
                    rangeKey = '1-10';
                  } else if (served <= 25) {
                    // 11-25 served - orange
                    color = '#fb923c';
                    colorLabel = '11-25 served';
                    rangeKey = '11-25';
                  } else if (served <= 50) {
                    // 26-50 served - yellow
                    color = '#eab308';
                    colorLabel = '26-50 served';
                    rangeKey = '26-50';
                  } else if (served <= 100) {
                    // 51-100 served - light green
                    color = '#22c55e';
                    colorLabel = '51-100 served';
                    rangeKey = '51-100';
                  } else if (served <= 250) {
                    // 101-250 served - green
                    color = '#16a34a';
                    colorLabel = '101-250 served';
                    rangeKey = '101-250';
                  } else {
                    // 251+ served - dark green
                    color = '#15803d';
                    colorLabel = '251+ served';
                    rangeKey = '251+';
                  }
                  
                  // Increment count for this range
                  if (rangeCounts[rangeKey]) {
                    rangeCounts[rangeKey].count++;
                  }
                  
                  const weight = isContaining ? 3 : 2;

                  const blockName = block.blockName || block.block_name || block.BLOCK_NAME || 'CT Broadband Block';
                  const blockGeoid = block.blockGeoid || block.block_geoid || block.BLOCK_GEOID || null;
                  const pctUnserved = block.pctUnserved !== null && block.pctUnserved !== undefined ? block.pctUnserved : null;
                  const maxDownload = block.maxDownload !== null && block.maxDownload !== undefined ? block.maxDownload : null;
                  const nProviders = block.nProviders !== null && block.nProviders !== undefined ? block.nProviders : null;
                  const townName = block.townName || block.town_name || block.TOWN_NAME || null;
                  const countyName = block.countyName || block.county_name || block.COUNTY_NAME || null;

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.8,
                    fillColor: color,
                    fillOpacity: 0.3
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        📡 ${blockName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${isContaining ? '<div><strong>Status:</strong> Contains Location</div>' : ''}
                        ${block.distance_miles !== null && block.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${block.distance_miles.toFixed(2)} miles</div>` : ''}
                        ${served !== null ? `<div><strong>Served Locations:</strong> ${served} <span style="color: ${color}; font-weight: 600;">(${colorLabel})</span></div>` : ''}
                        ${blockGeoid ? `<div><strong>Block GEOID:</strong> ${blockGeoid}</div>` : ''}
                        ${townName ? `<div><strong>Town:</strong> ${townName}</div>` : ''}
                        ${countyName ? `<div><strong>County:</strong> ${countyName}</div>` : ''}
                        ${pctUnserved !== null ? `<div><strong>% Unserved:</strong> ${pctUnserved.toFixed(2)}%</div>` : ''}
                        ${maxDownload !== null ? `<div><strong>Max Download:</strong> ${maxDownload.toFixed(2)} Mbps</div>` : ''}
                        ${nProviders !== null ? `<div><strong>Number of Providers:</strong> ${nProviders}</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['blockId', 'block_id', 'BLOCK_ID', 'blockGeoid', 'block_geoid', 'BLOCK_GEOID', 'blockName', 'block_name', 'BLOCK_NAME', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid'];
                  Object.entries(block).forEach(([key, value]) => {
                    if (excludeFields.includes(key) || value === null || value === undefined || value === '') {
                      return;
                    }
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  blockCount++;
                }
              } catch (error) {
                console.error('Error drawing CT Broadband Availability block polygon:', error);
              }
            }
          });
          
          if (blockCount > 0) {
            // Create ranges array with only ranges that have counts > 0
            const ranges = Object.values(rangeCounts)
              .filter(range => range.count > 0)
              .sort((a, b) => {
                // Sort by served count (approximate order)
                const order: Record<string, number> = {
                  'No Data': 0,
                  '0 served': 1,
                  '1-10 served': 2,
                  '11-25 served': 3,
                  '26-50 served': 4,
                  '51-100 served': 5,
                  '101-250 served': 6,
                  '251+ served': 7
                };
                return (order[a.label] || 999) - (order[b.label] || 999);
              });
            
            if (!legendAccumulator['ct_broadband_availability']) {
              legendAccumulator['ct_broadband_availability'] = {
                icon: '📡',
                color: '#7c3aed',
                title: 'CT 2025 Broadband Availability by Block',
                count: blockCount,
                ranges: ranges
              };
            } else {
              legendAccumulator['ct_broadband_availability'].count += blockCount;
              // Merge ranges (in case blocks are processed in multiple batches)
              if (legendAccumulator['ct_broadband_availability'].ranges) {
                ranges.forEach(newRange => {
                  const existingRange = legendAccumulator['ct_broadband_availability'].ranges!.find(r => r.label === newRange.label);
                  if (existingRange) {
                    existingRange.count += newRange.count;
                  } else {
                    legendAccumulator['ct_broadband_availability'].ranges!.push(newRange);
                  }
                });
                // Re-sort after merging
                legendAccumulator['ct_broadband_availability'].ranges!.sort((a, b) => {
                  const order: Record<string, number> = {
                    'No Data': 0,
                    '0 served': 1,
                    '1-10 served': 2,
                    '11-25 served': 3,
                    '26-50 served': 4,
                    '51-100 served': 5,
                    '101-250 served': 6,
                    '251+ served': 7
                  };
                  return (order[a.label] || 999) - (order[b.label] || 999);
                });
              } else {
                legendAccumulator['ct_broadband_availability'].ranges = ranges;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing CT Broadband Availability:', error);
      }

      // Draw CT Water Pollution Control Facilities
      try {
        if (enrichments.ct_water_pollution_control_all && Array.isArray(enrichments.ct_water_pollution_control_all)) {
          let facilityCount = 0;
          enrichments.ct_water_pollution_control_all.forEach((facility: any) => {
            if (facility.lat !== null && facility.lon !== null) {
              try {
                const facilityName = facility.facilityName || facility.FACILITY_Name || facility.facility_name || 'CT Water Pollution Control Facility';
                const permittee = facility.permittee || facility.Permitte || null;
                const address = facility.address || facility.FACILITY_Address || facility.facility_address || null;
                const city = facility.city || facility.TOWN || facility.town || null;
                const permitId = facility.permitId || facility.Permit_ID || facility.permit_id || null;
                const receivingWaterbody = facility.receivingWaterbody || facility.Receiving_Waterbody || null;
                const facilityClass = facility.facilityClass || facility.CLASS || facility.class || null;

                const marker = L.marker([facility.lat, facility.lon], {
                  icon: createPOIIcon('💧', '#0ea5e9')
                });

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      💧 ${facilityName}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${facility.distance_miles !== null && facility.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${facility.distance_miles.toFixed(2)} miles</div>` : ''}
                      ${permittee ? `<div><strong>Permittee:</strong> ${permittee}</div>` : ''}
                      ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                      ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                      ${permitId ? `<div><strong>Permit ID:</strong> ${permitId}</div>` : ''}
                      ${receivingWaterbody ? `<div><strong>Receiving Waterbody:</strong> ${receivingWaterbody}</div>` : ''}
                      ${facilityClass ? `<div><strong>Class:</strong> ${facilityClass}</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                const excludeFields = ['facilityId', 'facility_id', 'FACILITY_ID', 'facilityName', 'facility_name', 'FACILITY_Name', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid', 'lat', 'lon'];
                Object.entries(facility).forEach(([key, value]) => {
                  if (excludeFields.includes(key) || value === null || value === undefined || value === '') {
                    return;
                  }
                  if (typeof value === 'object' && !Array.isArray(value)) {
                    return;
                  }
                  const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                  popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                });
                
                popupContent += `
                    </div>
                  </div>
                `;

                marker.bindPopup(popupContent);
                marker.addTo(poi);
                bounds.extend([facility.lat, facility.lon]);
                facilityCount++;
              } catch (error) {
                console.error('Error drawing CT Water Pollution Control Facility marker:', error);
              }
            }
          });
          
          if (facilityCount > 0) {
            if (!legendAccumulator['ct_water_pollution_control']) {
              legendAccumulator['ct_water_pollution_control'] = {
                icon: '💧',
                color: '#0ea5e9',
                title: 'CT Water Pollution Control Facilities',
                count: 0,
              };
            }
            legendAccumulator['ct_water_pollution_control'].count += facilityCount;
          }
        }
      } catch (error) {
        console.error('Error processing CT Water Pollution Control Facilities:', error);
      }

      // Draw CT Boat Launches
      try {
        if (enrichments.ct_boat_launches_all && Array.isArray(enrichments.ct_boat_launches_all)) {
          let launchCount = 0;
          enrichments.ct_boat_launches_all.forEach((launch: any) => {
            if (launch.lat !== null && launch.lon !== null) {
              try {
                const name = launch.name || launch.NAME || launch.Name || 'CT Boat Launch';
                const address = launch.address || launch.ADDRESS || launch.Address || null;
                const city = launch.city || launch.CITY || launch.City || null;
                const phone = launch.phone || launch.PHONE || launch.Phone || null;

                const marker = L.marker([launch.lat, launch.lon], {
                  icon: createPOIIcon('🚤', '#3b82f6')
                });

                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🚤 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${launch.distance_miles !== null && launch.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${launch.distance_miles.toFixed(2)} miles</div>` : ''}
                      ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                      ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                      ${phone ? `<div><strong>Phone:</strong> ${phone}</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                const excludeFields = ['launchId', 'launch_id', 'LAUNCH_ID', 'name', 'NAME', 'Name', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid', 'lat', 'lon'];
                Object.entries(launch).forEach(([key, value]) => {
                  if (excludeFields.includes(key) || value === null || value === undefined || value === '') {
                    return;
                  }
                  if (typeof value === 'object' && !Array.isArray(value)) {
                    return;
                  }
                  const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                  popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                });
                
                popupContent += `
                    </div>
                  </div>
                `;

                marker.bindPopup(popupContent);
                marker.addTo(poi);
                bounds.extend([launch.lat, launch.lon]);
                launchCount++;
              } catch (error) {
                console.error('Error drawing CT Boat Launch marker:', error);
              }
            }
          });
          
          if (launchCount > 0) {
            if (!legendAccumulator['ct_boat_launches']) {
              legendAccumulator['ct_boat_launches'] = {
                icon: '🚤',
                color: '#3b82f6',
                title: 'CT Boat Launches',
                count: 0,
              };
            }
            legendAccumulator['ct_boat_launches'].count += launchCount;
          }
        }
      } catch (error) {
        console.error('Error processing CT Boat Launches:', error);
      }

      // Draw CT Federal Open Space
      try {
        if (enrichments.ct_federal_open_space_all && Array.isArray(enrichments.ct_federal_open_space_all)) {
          let openSpaceCount = 0;
          enrichments.ct_federal_open_space_all.forEach((openSpace: any) => {
            if (openSpace.geometry && openSpace.geometry.rings) {
              try {
                const rings = openSpace.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CT Federal Open Space polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const isContaining = openSpace.isContaining;
                  const color = isContaining ? '#10b981' : '#34d399'; // Darker green for containing, lighter for nearby
                  const weight = isContaining ? 3 : 2;

                  const name = openSpace.name || openSpace.NAME || openSpace.Name || 'CT Federal Open Space';
                  const agency = openSpace.agency || openSpace.AGENCY || openSpace.Agency || null;

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🏞️ ${name}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${isContaining ? '<div><strong>Status:</strong> Contains Location</div>' : ''}
                        ${openSpace.distance_miles !== null && openSpace.distance_miles !== undefined ? `<div><strong>Distance:</strong> ${openSpace.distance_miles.toFixed(2)} miles</div>` : ''}
                        ${agency ? `<div><strong>Agency:</strong> ${agency}</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['openSpaceId', 'open_space_id', 'OPEN_SPACE_ID', 'name', 'NAME', 'Name', 'agency', 'AGENCY', 'Agency', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid'];
                  Object.entries(openSpace).forEach(([key, value]) => {
                    if (excludeFields.includes(key) || value === null || value === undefined || value === '') {
                      return;
                    }
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  openSpaceCount++;
                }
              } catch (error) {
                console.error('Error drawing CT Federal Open Space polygon:', error);
              }
            }
          });
          
          if (openSpaceCount > 0) {
            if (!legendAccumulator['ct_federal_open_space']) {
              legendAccumulator['ct_federal_open_space'] = {
                icon: '🏞️',
                color: '#10b981',
                title: 'CT Federal Open Space',
                count: 0,
              };
            }
            legendAccumulator['ct_federal_open_space'].count += openSpaceCount;
          }
        }
      } catch (error) {
        console.error('Error processing CT Federal Open Space:', error);
      }

      // Draw CT HUC Watershed Boundaries
      try {
        if (enrichments.ct_huc_watersheds_all && Array.isArray(enrichments.ct_huc_watersheds_all)) {
          let watershedCount = 0;
          enrichments.ct_huc_watersheds_all.forEach((watershed: any) => {
            if (watershed.geometry && watershed.geometry.rings) {
              try {
                const rings = watershed.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CT HUC Watershed polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const color = '#06b6d4'; // Cyan for HUC watersheds
                  const weight = 3;

                  const huc12Name = watershed.huc12Name || watershed.HU_12_NAME || watershed.hu_12_name || null;
                  const huc10Name = watershed.huc10Name || watershed.HU_10_NAME || watershed.hu_10_name || null;
                  const huc12 = watershed.huc12 || watershed.HUC_12 || watershed.huc_12 || null;
                  const huc10 = watershed.huc10 || watershed.HUC_10 || watershed.huc_10 || null;
                  const huc8 = watershed.huc8 || watershed.HUC_8 || watershed.huc_8 || null;
                  const acres = watershed.acres !== null && watershed.acres !== undefined ? watershed.acres : (watershed.ACRES !== undefined ? watershed.ACRES : null);
                  const states = watershed.states || watershed.STATES || null;

                  const watershedName = huc12Name || huc10Name || `HUC ${huc12 || huc10 || huc8 || 'Unknown'}`;

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🌊 ${watershedName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        <div><strong>Status:</strong> Contains Location</div>
                        ${huc12 ? `<div><strong>HUC-12:</strong> ${huc12}</div>` : ''}
                        ${huc12Name ? `<div><strong>HUC-12 Name:</strong> ${huc12Name}</div>` : ''}
                        ${huc10 ? `<div><strong>HUC-10:</strong> ${huc10}</div>` : ''}
                        ${huc10Name ? `<div><strong>HUC-10 Name:</strong> ${huc10Name}</div>` : ''}
                        ${huc8 ? `<div><strong>HUC-8:</strong> ${huc8}</div>` : ''}
                        ${acres !== null ? `<div><strong>Acres:</strong> ${acres.toFixed(2)} acres</div>` : ''}
                        ${states ? `<div><strong>States:</strong> ${states}</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['watershedId', 'watershed_id', 'WATERSHED_ID', 'huc8', 'HUC_8', 'huc_8', 'huc10', 'HUC_10', 'huc_10', 'huc12', 'HUC_12', 'huc_12', 'huc10Name', 'HU_10_NAME', 'hu_10_name', 'huc12Name', 'HU_12_NAME', 'hu_12_name', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid'];
                  Object.entries(watershed).forEach(([key, value]) => {
                    if (excludeFields.includes(key) || value === null || value === undefined || value === '') {
                      return;
                    }
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  watershedCount++;
                }
              } catch (error) {
                console.error('Error drawing CT HUC Watershed polygon:', error);
              }
            }
          });
          
          if (watershedCount > 0) {
            if (!legendAccumulator['ct_huc_watersheds']) {
              legendAccumulator['ct_huc_watersheds'] = {
                icon: '🌊',
                color: '#06b6d4',
                title: 'CT HUC Watershed Boundaries',
                count: 0,
              };
            }
            legendAccumulator['ct_huc_watersheds'].count += watershedCount;
          }
        }
      } catch (error) {
        console.error('Error processing CT HUC Watershed Boundaries:', error);
      }

      // Draw CT Soils Parent Material Name
      try {
        if (enrichments.ct_soils_parent_material_all && Array.isArray(enrichments.ct_soils_parent_material_all)) {
          let soilCount = 0;
          enrichments.ct_soils_parent_material_all.forEach((soil: any) => {
            if (soil.geometry && soil.geometry.rings) {
              try {
                const rings = soil.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CT Soils Parent Material polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const color = '#a16207'; // Brown/tan for soils
                  const weight = 3;

                  const parentMaterialName = soil.parentMaterialName || soil.ParMatNm || soil.parmatnm || 'Unknown Soil';
                  const mukey = soil.mukey || soil.MUKEY || soil.mukey || null;
                  const musym = soil.musym || soil.MUSYM || soil.musym || null;
                  const areaSymbol = soil.areaSymbol || soil.AREASYMBOL || soil.areasymbol || null;

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🌱 ${parentMaterialName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        <div><strong>Status:</strong> Contains Location</div>
                        ${mukey ? `<div><strong>Map Unit Key (MUKEY):</strong> ${mukey}</div>` : ''}
                        ${musym ? `<div><strong>Map Unit Symbol (MUSYM):</strong> ${musym}</div>` : ''}
                        ${areaSymbol ? `<div><strong>Area Symbol:</strong> ${areaSymbol}</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['soilId', 'soil_id', 'SOIL_ID', 'parentMaterialName', 'ParMatNm', 'parmatnm', 'mukey', 'MUKEY', 'musym', 'MUSYM', 'areaSymbol', 'AREASYMBOL', 'areasymbol', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid'];
                  Object.entries(soil).forEach(([key, value]) => {
                    if (excludeFields.includes(key) || value === null || value === undefined || value === '') {
                      return;
                    }
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  soilCount++;
                }
              } catch (error) {
                console.error('Error drawing CT Soils Parent Material polygon:', error);
              }
            }
          });
          
          if (soilCount > 0) {
            if (!legendAccumulator['ct_soils_parent_material']) {
              legendAccumulator['ct_soils_parent_material'] = {
                icon: '🌱',
                color: '#a16207',
                title: 'CT Soils Parent Material Name',
                count: 0,
              };
            }
            legendAccumulator['ct_soils_parent_material'].count += soilCount;
          }
        }
      } catch (error) {
        console.error('Error processing CT Soils Parent Material Name:', error);
      }

      // Draw CA Power Outage Areas
      try {
        if (enrichments.ca_power_outage_areas_all && Array.isArray(enrichments.ca_power_outage_areas_all)) {
          let outageCount = 0;
          enrichments.ca_power_outage_areas_all.forEach((outage: any) => {
            if (outage.geometry && outage.geometry.rings) {
              try {
                const rings = outage.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CA Power Outage Area polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  // Color based on outage type: orange for "Not Planned", yellow for "Planned"
                  const isPlanned = outage.outageType === 'Planned' || outage.OutageType === 'Planned';
                  const color = isPlanned ? '#fbbf24' : '#f59e0b'; // Yellow for planned, orange for not planned
                  const weight = 3;

                  const utilityCompany = outage.utilityCompany || outage.UtilityCompany || 'Unknown Utility';
                  const outageStatus = outage.outageStatus || outage.OutageStatus || 'Unknown';
                  const outageType = outage.outageType || outage.OutageType || 'Unknown';
                  const incidentId = outage.incidentId || outage.IncidentId || outage.outageId || 'N/A';
                  const impactedCustomers = outage.impactedCustomers !== null && outage.impactedCustomers !== undefined 
                    ? outage.impactedCustomers 
                    : (outage.ImpactedCustomers !== null && outage.ImpactedCustomers !== undefined 
                      ? outage.ImpactedCustomers 
                      : null);
                  const county = outage.county || outage.County || null;
                  const cause = outage.cause || outage.Cause || null;
                  const startDate = outage.startDate || outage.StartDate ? new Date(outage.startDate || outage.StartDate).toLocaleString() : null;
                  const estimatedRestoreDate = outage.estimatedRestoreDate || outage.EstimatedRestoreDate ? new Date(outage.estimatedRestoreDate || outage.EstimatedRestoreDate).toLocaleString() : null;

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.8,
                    fillColor: color,
                    fillOpacity: 0.3
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ⚡ Power Outage Area
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        <div><strong>Incident ID:</strong> ${incidentId}</div>
                        <div><strong>Utility Company:</strong> ${utilityCompany}</div>
                        <div><strong>Status:</strong> ${outageStatus}</div>
                        <div><strong>Type:</strong> ${outageType}</div>
                        ${impactedCustomers !== null ? `<div><strong>Impacted Customers:</strong> ${impactedCustomers.toLocaleString()}</div>` : ''}
                        ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                        ${cause ? `<div><strong>Cause:</strong> ${cause}</div>` : ''}
                        ${startDate ? `<div><strong>Start Date:</strong> ${startDate}</div>` : ''}
                        ${estimatedRestoreDate ? `<div><strong>Estimated Restoration:</strong> ${estimatedRestoreDate}</div>` : ''}
                        ${outage.isContaining ? '<div style="color: #dc2626; font-weight: 600; margin-top: 8px;">📍 Contains Location</div>' : ''}
                        ${outage.distance_miles && outage.distance_miles > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${outage.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['outageId', 'OutageId', 'incidentId', 'IncidentId', 'utilityCompany', 'UtilityCompany', 'outageStatus', 'OutageStatus', 'outageType', 'OutageType', 'impactedCustomers', 'ImpactedCustomers', 'county', 'County', 'cause', 'Cause', 'startDate', 'StartDate', 'estimatedRestoreDate', 'EstimatedRestoreDate', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid'];
                  Object.entries(outage).forEach(([key, value]) => {
                    if (excludeFields.includes(key) || value === null || value === undefined || value === '') {
                      return;
                    }
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  outageCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Power Outage Area polygon:', error);
              }
            }
          });
          
          if (outageCount > 0) {
            if (!legendAccumulator['ca_power_outage_areas']) {
              legendAccumulator['ca_power_outage_areas'] = {
                icon: '⚡',
                color: '#f59e0b',
                title: 'CA Power Outage Areas',
                count: 0,
              };
            }
            legendAccumulator['ca_power_outage_areas'].count += outageCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Power Outage Areas:', error);
      }

      // Draw CA Fire Perimeters (All)
      try {
        if (enrichments.ca_fire_perimeters_all_all && Array.isArray(enrichments.ca_fire_perimeters_all_all)) {
          let fireCount = 0;
          enrichments.ca_fire_perimeters_all_all.forEach((fire: any) => {
            if (fire.geometry && fire.geometry.rings) {
              try {
                const rings = fire.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CA Fire Perimeter polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const color = '#dc2626'; // Red for historical fire perimeters
                  const weight = 2;

                  const fireName = fire.fireName || fire.FIRE_NAME || fire.Name || fire.name || 'Unknown Fire';
                  const fireYear = fire.fireYear !== null && fire.fireYear !== undefined ? fire.fireYear : (fire.YEAR_ !== null && fire.YEAR_ !== undefined ? fire.YEAR_ : null);
                  const acres = fire.acres !== null && fire.acres !== undefined ? fire.acres : (fire.ACRES !== null && fire.ACRES !== undefined ? fire.ACRES : null);

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🔥 ${fireName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${fireYear ? `<div><strong>Year:</strong> ${fireYear}</div>` : ''}
                        ${acres !== null ? `<div><strong>Acres:</strong> ${acres.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>` : ''}
                        ${fire.isContaining ? '<div style="color: #dc2626; font-weight: 600; margin-top: 8px;">📍 Contains Location</div>' : ''}
                        ${fire.distance_miles && fire.distance_miles > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${fire.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  fireCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Fire Perimeter polygon:', error);
              }
            }
          });
          
          if (fireCount > 0) {
            if (!legendAccumulator['ca_fire_perimeters_all']) {
              legendAccumulator['ca_fire_perimeters_all'] = {
                icon: '🔥',
                color: '#dc2626',
                title: 'Historical CA Fire Perimeters (All)',
                count: 0,
              };
            }
            legendAccumulator['ca_fire_perimeters_all'].count += fireCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Fire Perimeters (All):', error);
      }

      // Draw CA Recent Large Fire Perimeters
      try {
        if (enrichments.ca_fire_perimeters_recent_large_all && Array.isArray(enrichments.ca_fire_perimeters_recent_large_all)) {
          let fireCount = 0;
          enrichments.ca_fire_perimeters_recent_large_all.forEach((fire: any) => {
            if (fire.geometry && fire.geometry.rings) {
              try {
                const rings = fire.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CA Recent Large Fire Perimeter polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const color = '#f97316'; // Orange for recent large fires
                  const weight = 2;

                  const fireName = fire.fireName || fire.FIRE_NAME || fire.Name || fire.name || 'Unknown Fire';
                  const fireYear = fire.fireYear !== null && fire.fireYear !== undefined ? fire.fireYear : (fire.YEAR_ !== null && fire.YEAR_ !== undefined ? fire.YEAR_ : null);
                  const acres = fire.acres !== null && fire.acres !== undefined ? fire.acres : (fire.ACRES !== null && fire.ACRES !== undefined ? fire.ACRES : null);

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🔥 ${fireName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${fireYear ? `<div><strong>Year:</strong> ${fireYear}</div>` : ''}
                        ${acres !== null ? `<div><strong>Acres:</strong> ${acres.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>` : ''}
                        ${fire.isContaining ? '<div style="color: #dc2626; font-weight: 600; margin-top: 8px;">📍 Contains Location</div>' : ''}
                        ${fire.distance_miles && fire.distance_miles > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${fire.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  fireCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Recent Large Fire Perimeter polygon:', error);
              }
            }
          });
          
          if (fireCount > 0) {
            if (!legendAccumulator['ca_fire_perimeters_recent_large']) {
              legendAccumulator['ca_fire_perimeters_recent_large'] = {
                icon: '🔥',
                color: '#ea580c',
                title: 'CA Recent Large Fire Perimeters',
                count: 0,
              };
            }
            legendAccumulator['ca_fire_perimeters_recent_large'].count += fireCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Recent Large Fire Perimeters:', error);
      }

      // Draw CA Fire Perimeters (1950+)
      try {
        if (enrichments.ca_fire_perimeters_1950_all && Array.isArray(enrichments.ca_fire_perimeters_1950_all)) {
          let fireCount = 0;
          enrichments.ca_fire_perimeters_1950_all.forEach((fire: any) => {
            if (fire.geometry && fire.geometry.rings) {
              try {
                const rings = fire.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CA Fire Perimeter (1950+) polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const color = '#f59e0b'; // Amber/orange for 1950+ fires
                  const weight = 2;

                  const fireName = fire.fireName || fire.FIRE_NAME || fire.Name || fire.name || 'Unknown Fire';
                  const fireYear = fire.fireYear !== null && fire.fireYear !== undefined ? fire.fireYear : (fire.YEAR_ !== null && fire.YEAR_ !== undefined ? fire.YEAR_ : null);
                  const acres = fire.acres !== null && fire.acres !== undefined ? fire.acres : (fire.ACRES !== null && fire.ACRES !== undefined ? fire.ACRES : null);

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🔥 ${fireName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${fireYear ? `<div><strong>Year:</strong> ${fireYear}</div>` : ''}
                        ${acres !== null ? `<div><strong>Acres:</strong> ${acres.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>` : ''}
                        ${fire.isContaining ? '<div style="color: #dc2626; font-weight: 600; margin-top: 8px;">📍 Contains Location</div>' : ''}
                        ${fire.distance_miles && fire.distance_miles > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${fire.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  fireCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Fire Perimeter (1950+) polygon:', error);
              }
            }
          });
          
          if (fireCount > 0) {
            if (!legendAccumulator['ca_fire_perimeters_1950']) {
              legendAccumulator['ca_fire_perimeters_1950'] = {
                icon: '🔥',
                color: '#f97316',
                title: 'CA Fire Perimeters (1950+)',
                count: 0,
              };
            }
            legendAccumulator['ca_fire_perimeters_1950'].count += fireCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Fire Perimeters (1950+):', error);
      }

      // Draw CA Land Ownership
      try {
        if (enrichments.ca_land_ownership_all && Array.isArray(enrichments.ca_land_ownership_all)) {
          let ownershipCount = 0;
          enrichments.ca_land_ownership_all.forEach((ownership: any) => {
            if (ownership.geometry && ownership.geometry.rings) {
              try {
                const rings = ownership.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CA Land Ownership polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const color = '#6366f1'; // Indigo for land ownership
                  const weight = 2;

                  const ownGroup = ownership.ownGroup || ownership.OWN_GROUP || ownership.own_group || 'Unknown';
                  const ownAgency = ownership.ownAgency || ownership.OWN_AGENCY || ownership.own_agency || null;
                  const ownLevel = ownership.ownLevel || ownership.OWN_LEVEL || ownership.own_level || null;

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🏛️ ${ownGroup}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        <div><strong>Status:</strong> Contains Location</div>
                        ${ownAgency ? `<div><strong>Agency:</strong> ${ownAgency}</div>` : ''}
                        ${ownLevel ? `<div><strong>Level:</strong> ${ownLevel}</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['ownershipId', 'ownership_id', 'OWNERSHIP_ID', 'ownLevel', 'OWN_LEVEL', 'own_level', 'ownAgency', 'OWN_AGENCY', 'own_agency', 'ownGroup', 'OWN_GROUP', 'own_group', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid'];
                  Object.entries(ownership).forEach(([key, value]) => {
                    if (excludeFields.includes(key) || value === null || value === undefined || value === '') {
                      return;
                    }
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  ownershipCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Land Ownership polygon:', error);
              }
            }
          });
          
          if (ownershipCount > 0) {
            if (!legendAccumulator['ca_land_ownership']) {
              legendAccumulator['ca_land_ownership'] = {
                icon: '🏛️',
                color: '#6366f1',
                title: 'CA Land Ownership',
                count: 0,
              };
            }
            legendAccumulator['ca_land_ownership'].count += ownershipCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Land Ownership:', error);
      }

      // Draw CA CGS Landslide Zones
      try {
        if (enrichments.ca_cgs_landslide_zones_all && Array.isArray(enrichments.ca_cgs_landslide_zones_all)) {
          let landslideCount = 0;
          enrichments.ca_cgs_landslide_zones_all.forEach((zone: any) => {
            if (zone.geometry && zone.geometry.rings) {
              try {
                const rings = zone.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CA CGS Landslide Zone polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const color = '#f59e0b'; // Amber/orange for landslide zones
                  const weight = 2;

                  const zoneName = zone.zoneName || zone.NAME || zone.name || zone.Name || 'Unknown Landslide Zone';
                  const zoneType = zone.zoneType || zone.TYPE || zone.type || zone.Type || null;

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🏔️ ${zoneName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${zoneType ? `<div><strong>Type:</strong> ${zoneType}</div>` : ''}
                        ${zone.isContaining ? '<div style="color: #f59e0b; font-weight: 600; margin-top: 8px;">📍 Contains Location</div>' : ''}
                        ${zone.distance_miles && zone.distance_miles > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${zone.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['landslideZoneId', 'landslide_zone_id', 'LANDSLIDE_ZONE_ID', 'zoneName', 'zone_name', 'ZONE_NAME', 'zoneType', 'zone_type', 'ZONE_TYPE', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid'];
                  
                  // Check for link fields first and add them prominently
                  const geoPdfLink = zone.GEOPDFLINK || zone.geopdflink || zone.GeoPdfLink || null;
                  const reportLink = zone.REPORTLINK || zone.reportlink || zone.ReportLink || null;
                  
                  if (geoPdfLink || reportLink) {
                    popupContent += `<div style="margin-bottom: 8px; padding: 8px; background-color: #f3f4f6; border-radius: 4px;">`;
                    if (geoPdfLink) {
                      popupContent += `<div style="margin-bottom: 4px;"><strong>GeoPDF:</strong> <a href="${geoPdfLink}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${geoPdfLink}</a></div>`;
                    }
                    if (reportLink) {
                      popupContent += `<div><strong>Report:</strong> <a href="${reportLink}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${reportLink}</a></div>`;
                    }
                    popupContent += `</div>`;
                  }
                  
                  Object.entries(zone).forEach(([key, value]) => {
                    // Skip excluded fields and link fields (already handled above)
                    if (excludeFields.includes(key) || 
                        key.toUpperCase() === 'GEOPDFLINK' || 
                        key.toUpperCase() === 'REPORTLINK' ||
                        value === null || 
                        value === undefined || 
                        value === '') {
                      return;
                    }
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  landslideCount++;
                }
              } catch (error) {
                console.error('Error drawing CA CGS Landslide Zone polygon:', error);
              }
            }
          });
          
          if (landslideCount > 0) {
            if (!legendAccumulator['ca_cgs_landslide_zones']) {
              legendAccumulator['ca_cgs_landslide_zones'] = {
                icon: '🏔️',
                color: '#f59e0b',
                title: 'CA CGS Landslide Zones',
                count: 0,
              };
            }
            legendAccumulator['ca_cgs_landslide_zones'].count += landslideCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA CGS Landslide Zones:', error);
      }

      // Draw CA CGS Liquefaction Zones
      try {
        if (enrichments.ca_cgs_liquefaction_zones_all && Array.isArray(enrichments.ca_cgs_liquefaction_zones_all)) {
          let liquefactionCount = 0;
          enrichments.ca_cgs_liquefaction_zones_all.forEach((zone: any) => {
            if (zone.geometry && zone.geometry.rings) {
              try {
                const rings = zone.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CA CGS Liquefaction Zone polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const color = '#10b981'; // Green for liquefaction zones (different from landslide amber)
                  const weight = 2;

                  const zoneName = zone.zoneName || zone.NAME || zone.name || zone.Name || 'Unknown Liquefaction Zone';
                  const zoneType = zone.zoneType || zone.TYPE || zone.type || zone.Type || null;

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🌊 ${zoneName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${zoneType ? `<div><strong>Type:</strong> ${zoneType}</div>` : ''}
                        ${zone.isContaining ? '<div style="color: #10b981; font-weight: 600; margin-top: 8px;">📍 Contains Location</div>' : ''}
                        ${zone.distance_miles && zone.distance_miles > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${zone.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Check for link fields first and add them prominently
                  const geoPdfLink = zone.GEOPDFLINK || zone.geopdflink || zone.GeoPdfLink || null;
                  const reportLink = zone.REPORTLINK || zone.reportlink || zone.ReportLink || null;
                  
                  if (geoPdfLink || reportLink) {
                    popupContent += `<div style="margin-bottom: 8px; padding: 8px; background-color: #f3f4f6; border-radius: 4px;">`;
                    if (geoPdfLink) {
                      popupContent += `<div style="margin-bottom: 4px;"><strong>GeoPDF:</strong> <a href="${geoPdfLink}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${geoPdfLink}</a></div>`;
                    }
                    if (reportLink) {
                      popupContent += `<div><strong>Report:</strong> <a href="${reportLink}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${reportLink}</a></div>`;
                    }
                    popupContent += `</div>`;
                  }
                  
                  const excludeFields = ['liquefactionZoneId', 'liquefaction_zone_id', 'LIQUEFACTION_ZONE_ID', 'zoneName', 'zone_name', 'ZONE_NAME', 'zoneType', 'zone_type', 'ZONE_TYPE', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid', 'GEOPDFLINK', 'geopdflink', 'GeoPdfLink', 'REPORTLINK', 'reportlink', 'ReportLink'];
                  Object.entries(zone).forEach(([key, value]) => {
                    // Skip excluded fields and link fields (already handled above)
                    if (excludeFields.includes(key) || 
                        value === null || 
                        value === undefined || 
                        value === '') {
                      return;
                    }
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  liquefactionCount++;
                }
              } catch (error) {
                console.error('Error drawing CA CGS Liquefaction Zone polygon:', error);
              }
            }
          });
          
          if (liquefactionCount > 0) {
            if (!legendAccumulator['ca_cgs_liquefaction_zones']) {
              legendAccumulator['ca_cgs_liquefaction_zones'] = {
                icon: '🌊',
                color: '#10b981',
                title: 'CA CGS Liquefaction Zones',
                count: 0,
              };
            }
            legendAccumulator['ca_cgs_liquefaction_zones'].count += liquefactionCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA CGS Liquefaction Zones:', error);
      }

      // Draw CA Wildland Fire Direct Protection Areas
      try {
        if (enrichments.ca_wildland_fire_direct_protection_all && Array.isArray(enrichments.ca_wildland_fire_direct_protection_all)) {
          let protectionCount = 0;
          enrichments.ca_wildland_fire_direct_protection_all.forEach((protection: any) => {
            if (protection.geometry && protection.geometry.rings) {
              try {
                const rings = protection.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CA Wildland Fire Direct Protection Area polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const color = '#eab308'; // Yellow for fire protection areas
                  const weight = 2;

                  const dpaAgency = protection.dpaAgency || protection.DPA_AGENCY || protection.dpa_agency || 'Unknown';
                  const dpaGroup = protection.dpaGroup || protection.DPA_GROUP || protection.dpa_group || null;
                  const respondId = protection.respondId || protection.RESPOND_ID || protection.respond_id || null;
                  const nwcgUnitId = protection.nwcgUnitId || protection.NWCG_UNITID || protection.nwcg_unitid || null;
                  const agreements = protection.agreements || protection.AGREEMENTS || protection.agreements || null;
                  const costAppor = protection.costAppor || protection.COST_APPOR || protection.cost_appor || null;

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🔥 ${dpaAgency}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        <div><strong>Status:</strong> Contains Location</div>
                        ${dpaGroup ? `<div><strong>Group:</strong> ${dpaGroup}</div>` : ''}
                        ${respondId ? `<div><strong>Respond ID:</strong> ${respondId}</div>` : ''}
                        ${nwcgUnitId ? `<div><strong>NWCG Unit ID:</strong> ${nwcgUnitId}</div>` : ''}
                        ${agreements ? `<div><strong>Agreements:</strong> ${agreements}</div>` : ''}
                        ${costAppor ? `<div><strong>Cost Apportionment:</strong> ${costAppor}</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['protectionAreaId', 'protection_area_id', 'PROTECTION_AREA_ID', 'dpaAgency', 'DPA_AGENCY', 'dpa_agency', 'dpaGroup', 'DPA_GROUP', 'dpa_group', 'respondId', 'RESPOND_ID', 'respond_id', 'nwcgUnitId', 'NWCG_UNITID', 'nwcg_unitid', 'agreements', 'AGREEMENTS', 'costAppor', 'COST_APPOR', 'cost_appor', 'comments', 'COMMENTS', 'isContaining', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid'];
                  Object.entries(protection).forEach(([key, value]) => {
                    if (excludeFields.includes(key) || value === null || value === undefined || value === '') {
                      return;
                    }
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  protectionCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Wildland Fire Direct Protection Area polygon:', error);
              }
            }
          });
          
          if (protectionCount > 0) {
            if (!legendAccumulator['ca_wildland_fire_direct_protection']) {
              legendAccumulator['ca_wildland_fire_direct_protection'] = {
                icon: '🔥',
                color: '#eab308',
                title: 'CA Wildland Fire Direct Protection Areas',
                count: 0,
              };
            }
            legendAccumulator['ca_wildland_fire_direct_protection'].count += protectionCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Wildland Fire Direct Protection Areas:', error);
      }

      // Draw CA CalVTP Treatment Areas as polygons on the map
      try {
        if (enrichments.ca_calvtp_treatment_areas_all && Array.isArray(enrichments.ca_calvtp_treatment_areas_all)) {
          let treatmentAreaCount = 0;
          enrichments.ca_calvtp_treatment_areas_all.forEach((area: any) => {
            if (area.geometry && area.geometry.rings) {
              try {
                const rings = area.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latLngs = outerRing.map((coord: number[]) => [coord[1], coord[0]]);
                  
                  const projectId = area.projectId || area.Project_ID || area.project_id || 'Unknown Project';
                  const treatmentStage = area.treatmentStage || area.TreatmentStage || area.treatment_stage || null;
                  const treatmentAcres = area.treatmentAcres || area.Treatment_Acres || area.treatment_acres || null;
                  const county = area.county || area.County || null;
                  const fuelType = area.fuelType || area.Fuel_Type || area.fuel_type || null;
                  const dateCompleted = area.dateCompleted || area.Date_Completed || area.date_completed || null;
                  const distance = area.distance_miles !== null && area.distance_miles !== undefined ? area.distance_miles : 0;
                  
                  const polygon = L.polygon(latLngs, {
                    color: '#fbbf24',
                    fillColor: '#fbbf24',
                    fillOpacity: 0.3,
                    weight: 2
                  });
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 10px 0; font-weight: bold; color: #991b1b;">🔥 ${projectId}</h3>
                  `;
                  
                  if (treatmentStage) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Treatment Stage:</strong> ${treatmentStage}</p>`;
                  }
                  
                  if (treatmentAcres) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Treatment Acres:</strong> ${treatmentAcres.toFixed(2)}</p>`;
                  }
                  
                  if (county) {
                    popupContent += `<p style="margin: 5px 0;"><strong>County:</strong> ${county}</p>`;
                  }
                  
                  if (fuelType) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Fuel Type:</strong> ${fuelType}</p>`;
                  }
                  
                  if (dateCompleted) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Date Completed:</strong> ${dateCompleted}</p>`;
                  }
                  
                  if (distance > 0) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</p>`;
                  }
                  
                  // Add all other attributes
                  const allAttributes = { ...area };
                  delete allAttributes.geometry;
                  delete allAttributes.projectId;
                  delete allAttributes.treatmentStage;
                  delete allAttributes.treatmentAcres;
                  delete allAttributes.county;
                  delete allAttributes.fuelType;
                  delete allAttributes.dateCompleted;
                  delete allAttributes.distance_miles;
                  delete allAttributes.treatmentAreaId;
                  
                  const remainingAttributes = Object.entries(allAttributes)
                    .filter(([, value]) => value !== null && value !== undefined && value !== '')
                    .map(([attrKey, attrValue]) => `<p style="margin: 5px 0;"><strong>${formatPopupFieldName(attrKey)}:</strong> ${attrValue}</p>`)
                    .join('');
                  
                  if (remainingAttributes) {
                    popupContent += remainingAttributes;
                  }
                  
                  popupContent += `</div>`;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(map);
                  treatmentAreaCount++;
                }
              } catch (error) {
                console.error('Error drawing CA CalVTP Treatment Area polygon:', error);
              }
            }
          });
          
          if (treatmentAreaCount > 0) {
            if (!legendAccumulator['ca_calvtp_treatment_areas']) {
              legendAccumulator['ca_calvtp_treatment_areas'] = {
                icon: '🔥',
                color: '#fbbf24',
                title: 'CA CalVTP Treatment Areas',
                count: 0,
              };
            }
            legendAccumulator['ca_calvtp_treatment_areas'].count += treatmentAreaCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA CalVTP Treatment Areas:', error);
      }

      // Draw CA Post-Fire Damage Inspections (DINS) as point markers on the map
      try {
        if (enrichments.ca_postfire_damage_inspections_all && Array.isArray(enrichments.ca_postfire_damage_inspections_all)) {
          let inspectionCount = 0;
          enrichments.ca_postfire_damage_inspections_all.forEach((inspection: any) => {
            // Check for geometry with x/y (point geometry) or latitude/longitude fields
            const lat = inspection.geometry?.y || inspection.Latitude || inspection.latitude || null;
            const lon = inspection.geometry?.x || inspection.Longitude || inspection.longitude || null;
            
            if (lat !== null && lon !== null) {
              try {
                const damage = inspection.damage || inspection.DAMAGE || inspection.Damage || 'Unknown';
                const siteAddress = inspection.siteAddress || inspection.SITEADDRESS || inspection.SiteAddress || null;
                const streetNumber = inspection.streetNumber || inspection.STREETNUMBER || inspection.StreetNumber || null;
                const streetName = inspection.streetName || inspection.STREETNAME || inspection.StreetName || null;
                const streetType = inspection.streetType || inspection.STREETTYPE || inspection.StreetType || null;
                const city = inspection.city || inspection.CITY || inspection.City || null;
                const county = inspection.county || inspection.COUNTY || inspection.County || null;
                const incidentName = inspection.incidentName || inspection.INCIDENTNAME || inspection.IncidentName || null;
                const incidentNum = inspection.incidentNum || inspection.INCIDENTNUM || inspection.IncidentNum || null;
                const incidentStartDate = inspection.incidentStartDate || inspection.INCIDENTSTARTDATE || inspection.IncidentStartDate || null;
                const fireName = inspection.fireName || inspection.FIRENAME || inspection.FireName || null;
                const structureType = inspection.structureType || inspection.STRUCTURETYPE || inspection.StructureType || null;
                const structureCategory = inspection.structureCategory || inspection.STRUCTURECATEGORY || inspection.StructureCategory || null;
                const roofConstruction = inspection.roofConstruction || inspection.ROOFCONSTRUCTION || inspection.RoofConstruction || null;
                const yearBuilt = inspection.yearBuilt || inspection.YEARBUILT || inspection.YearBuilt || null;
                const apn = inspection.apn || inspection.APN || inspection.Apn || null;
                const assessedImprovedValue = inspection.assessedImprovedValue || inspection.ASSESSEDIMPROVEDVALUE || inspection.AssessedImprovedValue || null;
                const calFireUnit = inspection.calFireUnit || inspection.CALFIREUNIT || inspection.CalFireUnit || null;
                const distance = inspection.distance_miles !== null && inspection.distance_miles !== undefined ? inspection.distance_miles : 0;
                
                // Determine icon color based on damage level
                let iconColor = '#dc2626'; // Red for damaged/destroyed
                if (damage && (damage.toLowerCase().includes('no damage') || damage.toLowerCase().includes('affected'))) {
                  iconColor = '#f59e0b'; // Amber for affected/no damage
                }
                
                const marker = L.marker([lat, lon], {
                  icon: createPOIIcon('🔥', iconColor)
                });
                
                // Build address string
                let addressString = siteAddress || '';
                if (!addressString && (streetNumber || streetName || streetType)) {
                  const addressParts = [streetNumber, streetName, streetType].filter(part => part);
                  addressString = addressParts.join(' ');
                }
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🔥 ${damage}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${addressString ? `<div><strong>Address:</strong> ${addressString}</div>` : ''}
                      ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                      ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                      ${fireName ? `<div><strong>Fire Name:</strong> ${fireName}</div>` : ''}
                      ${incidentName ? `<div><strong>Incident:</strong> ${incidentName}</div>` : ''}
                      ${incidentNum ? `<div><strong>Incident #:</strong> ${incidentNum}</div>` : ''}
                      ${incidentStartDate ? `<div><strong>Incident Date:</strong> ${incidentStartDate}</div>` : ''}
                      ${structureType ? `<div><strong>Structure Type:</strong> ${structureType}</div>` : ''}
                      ${structureCategory ? `<div><strong>Structure Category:</strong> ${structureCategory}</div>` : ''}
                      ${roofConstruction ? `<div><strong>Roof Construction:</strong> ${roofConstruction}</div>` : ''}
                      ${yearBuilt ? `<div><strong>Year Built:</strong> ${yearBuilt}</div>` : ''}
                      ${apn ? `<div><strong>APN:</strong> ${apn}</div>` : ''}
                      ${assessedImprovedValue !== null && assessedImprovedValue !== undefined ? `<div><strong>Assessed Value:</strong> $${assessedImprovedValue.toLocaleString()}</div>` : ''}
                      ${calFireUnit ? `<div><strong>CAL FIRE Unit:</strong> ${calFireUnit}</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all inspection attributes (excluding internal fields)
                const excludeFields = ['damage', 'DAMAGE', 'Damage', 'siteAddress', 'SITEADDRESS', 'SiteAddress', 'streetNumber', 'STREETNUMBER', 'StreetNumber', 'streetName', 'STREETNAME', 'StreetName', 'streetType', 'STREETTYPE', 'StreetType', 'city', 'CITY', 'City', 'county', 'COUNTY', 'County', 'zipCode', 'ZIPCODE', 'ZipCode', 'incidentName', 'INCIDENTNAME', 'IncidentName', 'incidentNum', 'INCIDENTNUM', 'IncidentNum', 'incidentStartDate', 'INCIDENTSTARTDATE', 'IncidentStartDate', 'fireName', 'FIRENAME', 'FireName', 'structureType', 'STRUCTURETYPE', 'StructureType', 'structureCategory', 'STRUCTURECATEGORY', 'StructureCategory', 'roofConstruction', 'ROOFCONSTRUCTION', 'RoofConstruction', 'yearBuilt', 'YEARBUILT', 'YearBuilt', 'apn', 'APN', 'Apn', 'assessedImprovedValue', 'ASSESSEDIMPROVEDVALUE', 'AssessedImprovedValue', 'calFireUnit', 'CALFIREUNIT', 'CalFireUnit', 'battalion', 'BATTALION', 'Battalion', 'latitude', 'Latitude', 'LATITUDE', 'longitude', 'Longitude', 'LONGITUDE', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid', 'GlobalID', 'GLOBALID'];
                Object.entries(inspection).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                inspectionCount++;
              } catch (error) {
                console.error('Error drawing CA Post-Fire Damage Inspection marker:', error);
              }
            }
          });
          
          if (inspectionCount > 0) {
            if (!legendAccumulator['ca_postfire_damage_inspections']) {
              legendAccumulator['ca_postfire_damage_inspections'] = {
                icon: '🔥',
                color: '#dc2626',
                title: 'CA Post-Fire Damage Inspections (DINS)',
                count: 0,
              };
            }
            legendAccumulator['ca_postfire_damage_inspections'].count += inspectionCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Post-Fire Damage Inspections:', error);
      }

      // Draw CA Medium and Heavy Duty Infrastructure as point markers on the map
      try {
        if (enrichments.ca_medium_heavy_duty_infrastructure_all && Array.isArray(enrichments.ca_medium_heavy_duty_infrastructure_all)) {
          let stationCount = 0;
          enrichments.ca_medium_heavy_duty_infrastructure_all.forEach((station: any) => {
            // Check for geometry with x/y (point geometry) or latitude/longitude fields
            const lat = station.geometry?.y || station.Latitude || station.latitude || null;
            const lon = station.geometry?.x || station.Longitude || station.longitude || null;
            
            if (lat !== null && lon !== null) {
              try {
                const chargingOrHydrogen = station.chargingOrHydrogen || station.Charging_or_Hydrogen || station.ChargingOrHydrogen || 'Unknown';
                const address = station.address || station.Address || station.ADDRESS || null;
                const chargerOrDispenserCount = station.chargerOrDispenserCount || station.Charger_or_Dispenser_Count || station.ChargerOrDispenserCount || null;
                const nozzleCount = station.nozzleCount || station.Nozzle_Count || station.NozzleCount || null;
                const fundingAgencies = station.fundingAgencies || station.Funding_Agencies || station.FundingAgencies || null;
                const operator = station.operator || station.Operator || station.OPERATOR || null;
                const eligible = station.eligible || station.Eligible || station.ELIGIBLE || null;
                const liquidGaseous = station.liquidGaseous || station.Liquid_Gaseous || station.LiquidGaseous || null;
                const chargingCapacity = station.chargingCapacity || station.Charging_Capacity || station.ChargingCapacity || null;
                const maximumCharging = station.maximumCharging || station.Maximum_Charging || station.MaximumCharging || null;
                const projectStatus = station.projectStatus || station.ProjectStatus || station.Project_Status || null;
                const distance = station.distance_miles !== null && station.distance_miles !== undefined ? station.distance_miles : 0;
                
                // Determine icon color based on type
                let iconColor = '#f97316'; // Orange default
                if (chargingOrHydrogen && chargingOrHydrogen.toLowerCase().includes('hydrogen')) {
                  iconColor = '#3b82f6'; // Blue for hydrogen
                } else if (chargingOrHydrogen && chargingOrHydrogen.toLowerCase().includes('both')) {
                  iconColor = '#8b5cf6'; // Purple for both
                }
                
                const marker = L.marker([lat, lon], {
                  icon: createPOIIcon('🚛', iconColor)
                });
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🚛 ${chargingOrHydrogen} Station
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                      ${projectStatus ? `<div><strong>Status:</strong> ${projectStatus}</div>` : ''}
                      ${operator ? `<div><strong>Operator:</strong> ${operator}</div>` : ''}
                      ${chargerOrDispenserCount ? `<div><strong>Charger/Dispenser Count:</strong> ${chargerOrDispenserCount}</div>` : ''}
                      ${nozzleCount ? `<div><strong>Nozzle Count:</strong> ${nozzleCount}</div>` : ''}
                      ${chargingCapacity ? `<div><strong>Charging Capacity:</strong> ${chargingCapacity}</div>` : ''}
                      ${maximumCharging ? `<div><strong>Maximum Charging:</strong> ${maximumCharging}</div>` : ''}
                      ${liquidGaseous ? `<div><strong>Liquid/Gaseous:</strong> ${liquidGaseous}</div>` : ''}
                      ${eligible ? `<div><strong>Eligible:</strong> ${eligible}</div>` : ''}
                      ${fundingAgencies ? `<div><strong>Funding Agencies:</strong> ${fundingAgencies}</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all station attributes (excluding internal fields)
                const excludeFields = ['chargingOrHydrogen', 'Charging_or_Hydrogen', 'ChargingOrHydrogen', 'chargerOrDispenserCount', 'Charger_or_Dispenser_Count', 'ChargerOrDispenserCount', 'nozzleCount', 'Nozzle_Count', 'NozzleCount', 'address', 'Address', 'ADDRESS', 'latitude', 'Latitude', 'LATITUDE', 'longitude', 'Longitude', 'LONGITUDE', 'fundingAgencies', 'Funding_Agencies', 'FundingAgencies', 'operator', 'Operator', 'OPERATOR', 'eligible', 'Eligible', 'ELIGIBLE', 'liquidGaseous', 'Liquid_Gaseous', 'LiquidGaseous', 'chargingCapacity', 'Charging_Capacity', 'ChargingCapacity', 'maximumCharging', 'Maximum_Charging', 'MaximumCharging', 'projectStatus', 'ProjectStatus', 'Project_Status', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid', 'GlobalID', 'GLOBALID'];
                Object.entries(station).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                stationCount++;
              } catch (error) {
                console.error('Error drawing CA Medium and Heavy Duty Infrastructure marker:', error);
              }
            }
          });
          
          if (stationCount > 0) {
            if (!legendAccumulator['ca_medium_heavy_duty_infrastructure']) {
              legendAccumulator['ca_medium_heavy_duty_infrastructure'] = {
                icon: '🚛',
                color: '#f97316',
                title: 'CA Medium & Heavy Duty Infrastructure',
                count: 0,
              };
            }
            legendAccumulator['ca_medium_heavy_duty_infrastructure'].count += stationCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Medium and Heavy Duty Infrastructure:', error);
      }

      // Draw CA FRAP Facilities as point markers on the map
      try {
        if (enrichments.ca_frap_facilities_all && Array.isArray(enrichments.ca_frap_facilities_all)) {
          let facilityCount = 0;
          enrichments.ca_frap_facilities_all.forEach((facility: any) => {
            // Check for geometry with x/y (point geometry) or latitude/longitude fields
            const lat = facility.geometry?.y || facility.LAT || facility.latitude || null;
            const lon = facility.geometry?.x || facility.LON || facility.longitude || null;
            
            if (lat !== null && lon !== null) {
              try {
                const name = facility.name || facility.NAME || facility.Name || 'Unknown Facility';
                const facilityStatus = facility.facilityStatus || facility.FACILITY_STATUS || facility.FacilityStatus || null;
                const cadName = facility.cadName || facility.CAD_NAME || facility.CadName || null;
                const aka = facility.aka || facility.AKA || facility.Aka || null;
                const type = facility.type || facility.TYPE || facility.Type || null;
                const unit = facility.unit || facility.UNIT || facility.Unit || null;
                const cdfUnit = facility.cdfUnit || facility.CDF_UNIT || facility.CdfUnit || null;
                const county = facility.county || facility.COUNTY || facility.County || null;
                const owner = facility.owner || facility.OWNER || facility.Owner || null;
                const funding = facility.funding || facility.FUNDING || facility.Funding || null;
                const staffing = facility.staffing || facility.STAFFING || facility.Staffing || null;
                const address = facility.address || facility.ADDRESS || facility.Address || null;
                const city = facility.city || facility.CITY || facility.City || null;
                const zip = facility.zip || facility.ZIP || facility.Zip || null;
                const phoneNum = facility.phoneNum || facility.PHONE_NUM || facility.PhoneNum || facility.PHONE || facility.phone || null;
                const distance = facility.distance_miles !== null && facility.distance_miles !== undefined ? facility.distance_miles : 0;
                
                // Use fire truck icon with red color for fire facilities
                const iconColor = '#dc2626'; // Red for fire facilities
                
                const marker = L.marker([lat, lon], {
                  icon: createPOIIcon('🚒', iconColor)
                });
                
                // Build address string
                let addressString = address || '';
                if (city || zip) {
                  const addressParts = [address, city, zip].filter(part => part);
                  addressString = addressParts.join(', ');
                }
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🚒 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${facilityStatus ? `<div><strong>Status:</strong> ${facilityStatus}</div>` : ''}
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${cadName ? `<div><strong>CAD Name:</strong> ${cadName}</div>` : ''}
                      ${aka ? `<div><strong>Also Known As:</strong> ${aka}</div>` : ''}
                      ${addressString ? `<div><strong>Address:</strong> ${addressString}</div>` : ''}
                      ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                      ${unit ? `<div><strong>Unit:</strong> ${unit}</div>` : ''}
                      ${cdfUnit ? `<div><strong>CDF Unit:</strong> ${cdfUnit}</div>` : ''}
                      ${owner ? `<div><strong>Owner:</strong> ${owner}</div>` : ''}
                      ${funding ? `<div><strong>Funding:</strong> ${funding}</div>` : ''}
                      ${staffing ? `<div><strong>Staffing:</strong> ${staffing}</div>` : ''}
                      ${phoneNum ? `<div><strong>Phone:</strong> ${phoneNum}</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all facility attributes (excluding internal fields)
                const excludeFields = ['name', 'NAME', 'Name', 'facilityStatus', 'FACILITY_STATUS', 'FacilityStatus', 'cadName', 'CAD_NAME', 'CadName', 'aka', 'AKA', 'Aka', 'type', 'TYPE', 'Type', 'unit', 'UNIT', 'Unit', 'cdfUnit', 'CDF_UNIT', 'CdfUnit', 'county', 'COUNTY', 'County', 'owner', 'OWNER', 'Owner', 'funding', 'FUNDING', 'Funding', 'staffing', 'STAFFING', 'Staffing', 'address', 'ADDRESS', 'Address', 'city', 'CITY', 'City', 'zip', 'ZIP', 'Zip', 'ZIPCODE', 'zipCode', 'phoneNum', 'PHONE_NUM', 'PhoneNum', 'PHONE', 'phone', 'latitude', 'Latitude', 'LATITUDE', 'LAT', 'lat', 'longitude', 'Longitude', 'LONGITUDE', 'LON', 'lon', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid', 'GlobalID', 'GLOBALID'];
                Object.entries(facility).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                facilityCount++;
              } catch (error) {
                console.error('Error drawing CA FRAP Facility marker:', error);
              }
            }
          });
          
          if (facilityCount > 0) {
            if (!legendAccumulator['ca_frap_facilities']) {
              legendAccumulator['ca_frap_facilities'] = {
                icon: '🚒',
                color: '#dc2626',
                title: 'CA Facilities for Wildland Fire Protection',
                count: 0,
              };
            }
            legendAccumulator['ca_frap_facilities'].count += facilityCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA FRAP Facilities:', error);
      }

      // Draw CA Solar Footprints as polygons on the map
      try {
        if (enrichments.ca_solar_footprints_all && Array.isArray(enrichments.ca_solar_footprints_all)) {
          let footprintCount = 0;
          enrichments.ca_solar_footprints_all.forEach((footprint: any) => {
            if (footprint.geometry && footprint.geometry.rings) {
              try {
                const rings = footprint.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('CA Solar Footprint polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = footprint.isContaining;
                  const color = isContaining ? '#fbbf24' : '#fcd34d'; // Yellow/amber for solar
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const countyName = footprint.countyName || footprint.COUNTYNAME || footprint.CountyName || '';
                  const acres = footprint.acres || footprint.Acres;
                  const type = footprint.type || footprint.Type || footprint.TYPE || 'Unknown';
                  const urbanRural = footprint.urbanRural || footprint.Urban_Rural || footprint.UrbanRural || null;
                  const combinedClass = footprint.combinedClass || footprint.Combined_Class || footprint.CombinedClass || null;
                  const distance = footprint.distance_miles !== null && footprint.distance_miles !== undefined ? footprint.distance_miles : 0;
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ☀️ Solar Footprint
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                        ${combinedClass ? `<div><strong>Class:</strong> ${combinedClass}</div>` : ''}
                        ${urbanRural ? `<div><strong>Urban/Rural:</strong> ${urbanRural}</div>` : ''}
                        ${countyName ? `<div><strong>County:</strong> ${countyName}</div>` : ''}
                        ${acres !== null && acres !== undefined ? `<div><strong>Acres:</strong> ${acres.toFixed(2)}</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this solar footprint</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all footprint attributes (excluding internal fields)
                  const excludeFields = ['countyName', 'COUNTYNAME', 'CountyName', 'COUNTY', 'county', 'acres', 'Acres', 'ACRES', 'type', 'Type', 'TYPE', 'urbanRural', 'Urban_Rural', 'UrbanRural', 'URBAN_RURAL', 'combinedClass', 'Combined_Class', 'CombinedClass', 'COMBINED_CLASS', 'geometry', 'distance_miles', 'isContaining', 'FID', 'fid', 'OBJECTID', 'objectid', 'GlobalID', 'GLOBALID'];
                  Object.entries(footprint).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds.getNorthEast());
                  bounds.extend(polygonBounds.getSouthWest());
                  
                  footprintCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Solar Footprint polygon:', error);
              }
            }
          });
          
          if (footprintCount > 0) {
            if (!legendAccumulator['ca_solar_footprints']) {
              legendAccumulator['ca_solar_footprints'] = {
                icon: '☀️',
                color: '#fbbf24',
                title: 'CA Solar Footprints',
                count: 0,
              };
            }
            legendAccumulator['ca_solar_footprints'].count += footprintCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Solar Footprints:', error);
      }

      // Draw CA Natural Gas Service Areas as polygons on the map
      try {
        if (enrichments.ca_natural_gas_service_areas_all && Array.isArray(enrichments.ca_natural_gas_service_areas_all)) {
          let serviceAreaCount = 0;
          enrichments.ca_natural_gas_service_areas_all.forEach((area: any) => {
            if (area.geometry && area.geometry.rings) {
              try {
                const rings = area.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('CA Natural Gas Service Area polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = area.isContaining;
                  const color = isContaining ? '#8b5cf6' : '#a78bfa'; // Purple for natural gas
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const serviceAreaId = area.serviceAreaId || area.OBJECTID || area.objectid || 'Unknown';
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ⛽ Natural Gas Service Area
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${serviceAreaId ? `<div><strong>Service Area ID:</strong> ${serviceAreaId}</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this service area</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all service area attributes (excluding internal fields)
                  const excludeFields = ['serviceAreaId', 'OBJECTID', 'objectid', 'geometry', 'isContaining', 'FID', 'fid', 'GlobalID', 'GLOBALID'];
                  Object.entries(area).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds.getNorthEast());
                  bounds.extend(polygonBounds.getSouthWest());
                  
                  serviceAreaCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Natural Gas Service Area polygon:', error);
              }
            }
          });
          
          if (serviceAreaCount > 0) {
            if (!legendAccumulator['ca_natural_gas_service_areas']) {
              legendAccumulator['ca_natural_gas_service_areas'] = {
                icon: '⛽',
                color: '#8b5cf6',
                title: 'CA Natural Gas Service Areas',
                count: 0,
              };
            }
            legendAccumulator['ca_natural_gas_service_areas'].count += serviceAreaCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Natural Gas Service Areas:', error);
      }

      // Draw CA PLSS Sections as polygons on the map
      try {
        if (enrichments.ca_plss_sections_all && Array.isArray(enrichments.ca_plss_sections_all)) {
          let sectionCount = 0;
          enrichments.ca_plss_sections_all.forEach((section: any) => {
            if (section.geometry && section.geometry.rings) {
              try {
                const rings = section.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('CA PLSS Section polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = section.isContaining;
                  const color = isContaining ? '#6366f1' : '#818cf8'; // Indigo for PLSS
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const township = section.township || section.TOWNSHIP || section.Township || null;
                  const range = section.range || section.RANGE || section.Range || null;
                  const sectionNum = section.section || section.SECTION || section.Section || null;
                  const meridian = section.meridian || section.MERIDIAN || section.Meridian || null;
                  const sectionId = section.sectionId || section.OBJECTID || section.objectid || 'Unknown';
                  
                  // Format PLSS string
                  let plssString = '';
                  if (township && range) {
                    plssString = `T${township} R${range}`;
                    if (sectionNum) {
                      plssString += ` S${sectionNum}`;
                    }
                    if (meridian) {
                      plssString += ` ${meridian}`;
                    }
                  } else {
                    plssString = sectionId.toString();
                  }
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🗺️ PLSS Section
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${plssString ? `<div><strong>PLSS:</strong> ${plssString}</div>` : ''}
                        ${township ? `<div><strong>Township:</strong> ${township}</div>` : ''}
                        ${range ? `<div><strong>Range:</strong> ${range}</div>` : ''}
                        ${sectionNum ? `<div><strong>Section:</strong> ${sectionNum}</div>` : ''}
                        ${meridian ? `<div><strong>Meridian:</strong> ${meridian}</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this section</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all section attributes (excluding internal fields)
                  const excludeFields = ['sectionId', 'township', 'TOWNSHIP', 'Township', 'TWP', 'Twp', 'twp', 'range', 'RANGE', 'Range', 'RNG', 'Rng', 'rng', 'section', 'SECTION', 'Section', 'SEC', 'Sec', 'sec', 'meridian', 'MERIDIAN', 'Meridian', 'MER', 'Mer', 'mer', 'geometry', 'isContaining', 'OBJECTID', 'objectid', 'FID', 'fid', 'GlobalID', 'GLOBALID'];
                  Object.entries(section).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds.getNorthEast());
                  bounds.extend(polygonBounds.getSouthWest());
                  
                  sectionCount++;
                }
              } catch (error) {
                console.error('Error drawing CA PLSS Section polygon:', error);
              }
            }
          });
          
          if (sectionCount > 0) {
            if (!legendAccumulator['ca_plss_sections']) {
              legendAccumulator['ca_plss_sections'] = {
                icon: '🗺️',
                color: '#6366f1',
                title: 'CA Public Land Survey Sections',
                count: 0,
              };
            }
            legendAccumulator['ca_plss_sections'].count += sectionCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA PLSS Sections:', error);
      }

      // Draw CA Geothermal Wells as point markers on the map
      try {
        if (enrichments.ca_geothermal_wells_all && Array.isArray(enrichments.ca_geothermal_wells_all)) {
          let wellCount = 0;
          enrichments.ca_geothermal_wells_all.forEach((well: any) => {
            // Check for geometry with x/y (point geometry) or latitude/longitude fields
            const lat = well.geometry?.y || well.LATITUDE || well.latitude || well.LAT || well.lat || null;
            const lon = well.geometry?.x || well.LONGITUDE || well.longitude || well.LON || well.lon || null;
            
            if (lat !== null && lon !== null) {
              try {
                const wellId = well.wellId || well.WELL_ID || well.Well_ID || well.well_id || well.API || well.api || well.OBJECTID || well.objectid || 'Unknown';
                const distance = well.distance_miles !== null && well.distance_miles !== undefined ? well.distance_miles : 0;
                
                // Use volcano/geothermal icon with orange color
                const iconColor = '#ea580c'; // Orange for geothermal
                
                const marker = L.marker([lat, lon], {
                  icon: createPOIIcon('🌋', iconColor)
                });
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🌋 Geothermal Well
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${wellId ? `<div><strong>Well ID:</strong> ${wellId}</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all well attributes (excluding internal fields)
                const excludeFields = ['wellId', 'WELL_ID', 'Well_ID', 'well_id', 'API', 'api', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid', 'GlobalID', 'GLOBALID', 'LATITUDE', 'latitude', 'LAT', 'lat', 'LONGITUDE', 'longitude', 'LON', 'lon'];
                Object.entries(well).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                wellCount++;
              } catch (error) {
                console.error('Error drawing CA Geothermal Well marker:', error);
              }
            }
          });
          
          if (wellCount > 0) {
            if (!legendAccumulator['ca_geothermal_wells']) {
              legendAccumulator['ca_geothermal_wells'] = {
                icon: '🌋',
                color: '#ea580c',
                title: 'CA Geothermal Wells',
                count: 0,
              };
            }
            legendAccumulator['ca_geothermal_wells'].count += wellCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Geothermal Wells:', error);
      }

      // Draw CA Oil and Gas Wells as point markers on the map
      try {
        if (enrichments.ca_oil_gas_wells_all && Array.isArray(enrichments.ca_oil_gas_wells_all)) {
          let wellCount = 0;
          enrichments.ca_oil_gas_wells_all.forEach((well: any) => {
            // Check for geometry with x/y (point geometry) or latitude/longitude fields
            const lat = well.geometry?.y || well.LATITUDE || well.latitude || well.LAT || well.lat || null;
            const lon = well.geometry?.x || well.LONGITUDE || well.longitude || well.LON || well.lon || null;
            
            if (lat !== null && lon !== null) {
              try {
                const wellId = well.wellId || well.WELL_ID || well.Well_ID || well.well_id || well.API || well.api || well.OBJECTID || well.objectid || 'Unknown';
                const distance = well.distance_miles !== null && well.distance_miles !== undefined ? well.distance_miles : 0;
                
                // Use oil/gas icon with dark gray/black color
                const iconColor = '#1f2937'; // Dark gray/black for oil and gas
                
                const marker = L.marker([lat, lon], {
                  icon: createPOIIcon('🛢️', iconColor)
                });
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🛢️ Oil and Gas Well
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${wellId ? `<div><strong>Well ID:</strong> ${wellId}</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all well attributes (excluding internal fields)
                const excludeFields = ['wellId', 'WELL_ID', 'Well_ID', 'well_id', 'API', 'api', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid', 'GlobalID', 'GLOBALID', 'LATITUDE', 'latitude', 'LAT', 'lat', 'LONGITUDE', 'longitude', 'LON', 'lon'];
                Object.entries(well).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                wellCount++;
              } catch (error) {
                console.error('Error drawing CA Oil and Gas Well marker:', error);
              }
            }
          });
          
          if (wellCount > 0) {
            if (!legendAccumulator['ca_oil_gas_wells']) {
              legendAccumulator['ca_oil_gas_wells'] = {
                icon: '🛢️',
                color: '#1f2937',
                title: 'CA Oil and Gas Wells',
                count: 0,
              };
            }
            legendAccumulator['ca_oil_gas_wells'].count += wellCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Oil and Gas Wells:', error);
      }

      // Draw CA Eco Regions as polygons on the map
      try {
        if (enrichments.ca_eco_regions_all && Array.isArray(enrichments.ca_eco_regions_all)) {
          let regionCount = 0;
          enrichments.ca_eco_regions_all.forEach((region: any) => {
            if (region.geometry && region.geometry.rings) {
              try {
                const rings = region.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('CA Eco Region polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = region.isContaining;
                  const color = isContaining ? '#16a34a' : '#22c55e'; // Green for eco regions
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const usL3Code = region.US_L3CODE || region.us_l3code || region.US_L3_CODE || null;
                  const usL3Name = region.US_L3NAME || region.us_l3name || region.US_L3_NAME || null;
                  const regionId = region.regionId || region.OBJECTID || region.objectid || 'Unknown';
                  const regionName = usL3Name || usL3Code || regionId.toString();
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🌿 Eco Region
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${regionName ? `<div><strong>Region:</strong> ${regionName}</div>` : ''}
                        ${usL3Code ? `<div><strong>L3 Code:</strong> ${usL3Code}</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this eco region</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all region attributes (excluding internal fields)
                  const excludeFields = ['regionId', 'US_L3CODE', 'us_l3code', 'US_L3_CODE', 'US_L3NAME', 'us_l3name', 'US_L3_NAME', 'geometry', 'isContaining', 'OBJECTID', 'objectid', 'FID', 'fid', 'GlobalID', 'GLOBALID'];
                  Object.entries(region).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds.getNorthEast());
                  bounds.extend(polygonBounds.getSouthWest());
                  
                  regionCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Eco Region polygon:', error);
              }
            }
          });
          
          if (regionCount > 0) {
            if (!legendAccumulator['ca_eco_regions']) {
              legendAccumulator['ca_eco_regions'] = {
                icon: '🌿',
                color: '#16a34a',
                title: 'CA Eco Regions',
                count: 0,
              };
            }
            legendAccumulator['ca_eco_regions'].count += regionCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Eco Regions:', error);
      }

      // Draw City of Los Angeles Zoning as polygons on the map
      try {
        if (enrichments.ca_la_zoning_all && Array.isArray(enrichments.ca_la_zoning_all)) {
          let zoningCount = 0;
          enrichments.ca_la_zoning_all.forEach((zone: any) => {
            if (zone.geometry && zone.geometry.rings) {
              try {
                const rings = zone.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('City of Los Angeles Zoning polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = zone.isContaining;
                  const color = isContaining ? '#7c3aed' : '#a78bfa'; // Purple for zoning
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const zoningId = zone.zoningId || zone.OBJECTID || zone.objectid || 'Unknown';
                  const distance = zone.distance_miles !== null && zone.distance_miles !== undefined ? zone.distance_miles : 0;
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🏙️ Zoning Polygon
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${zoningId ? `<div><strong>Zoning ID:</strong> ${zoningId}</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this zoning polygon</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all zoning attributes (excluding internal fields)
                  const excludeFields = ['zoningId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'isContaining', 'FID', 'fid', 'GlobalID', 'GLOBALID'];
                  Object.entries(zone).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds.getNorthEast());
                  bounds.extend(polygonBounds.getSouthWest());
                  
                  zoningCount++;
                }
              } catch (error) {
                console.error('Error drawing City of Los Angeles Zoning polygon:', error);
              }
            }
          });
          
          if (zoningCount > 0) {
            if (!legendAccumulator['ca_la_zoning']) {
              legendAccumulator['ca_la_zoning'] = {
                icon: '🏙️',
                color: '#7c3aed',
                title: 'City of Los Angeles Zoning',
                count: 0,
              };
            }
            legendAccumulator['ca_la_zoning'].count += zoningCount;
          }
        }
      } catch (error) {
        console.error('Error processing City of Los Angeles Zoning:', error);
      }

      // Draw LA County Points of Interest as point markers on the map
      const laCountyPOILayers = [
        { key: 'la_county_arts_recreation_all', icon: '🎨', color: '#ec4899', title: 'LA County Arts and Recreation' },
        { key: 'la_county_education_all', icon: '🎓', color: '#3b82f6', title: 'LA County Education' },
        { key: 'la_county_hospitals_all', icon: '🏥', color: '#ef4444', title: 'LA County Hospitals' },
        { key: 'la_county_municipal_services_all', icon: '🏛️', color: '#6366f1', title: 'LA County Municipal Services' },
        { key: 'la_county_physical_features_all', icon: '🏔️', color: '#10b981', title: 'LA County Physical Features' },
        { key: 'la_county_public_safety_all', icon: '🚨', color: '#dc2626', title: 'LA County Public Safety' },
        { key: 'la_county_transportation_all', icon: '🚌', color: '#f59e0b', title: 'LA County Transportation' },
        { key: 'la_county_fire_hydrants_all', icon: '🚒', color: '#ef4444', title: 'LA County Fire Hydrants' }
      ];

      laCountyPOILayers.forEach(({ key, icon, color, title }) => {
        try {
          if (enrichments[key] && Array.isArray(enrichments[key])) {
            let poiCount = 0;
            enrichments[key].forEach((poi: any) => {
              // Check for geometry with x/y (point geometry) or latitude/longitude fields
              const lat = poi.geometry?.y || poi.LATITUDE || poi.latitude || poi.LAT || poi.lat || null;
              const lon = poi.geometry?.x || poi.LONGITUDE || poi.longitude || poi.LON || poi.lon || null;
              
              if (lat !== null && lon !== null) {
                try {
                  // Special handling for fire hydrants - prioritize OBJECTID_1
                  const poiId = key === 'la_county_fire_hydrants_all' 
                    ? (poi.OBJECTID_1 || poi.OBJECTID || poi.objectid || 'Unknown')
                    : (poi.poiId || poi.OBJECTID || poi.objectid || 'Unknown');
                  const distance = poi.distance_miles !== null && poi.distance_miles !== undefined ? poi.distance_miles : 0;
                  
                  const marker = L.marker([lat, lon], {
                    icon: createPOIIcon(icon, color)
                  });
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ${icon} ${title}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${poiId ? `<div><strong>POI ID:</strong> ${poiId}</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all POI attributes (excluding internal fields)
                  const excludeFields = ['poiId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'LATITUDE', 'latitude', 'LAT', 'lat', 'LONGITUDE', 'longitude', 'LON', 'lon'];
                  Object.entries(poi).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  marker.bindPopup(popupContent);
                  marker.addTo(primary);
                  bounds.extend([lat, lon]);
                  poiCount++;
                } catch (error) {
                  console.error(`Error drawing ${title} marker:`, error);
                }
              }
            });
            
            if (poiCount > 0) {
              const legendKey = key.replace('_all', '');
              if (!legendAccumulator[legendKey]) {
                legendAccumulator[legendKey] = {
                  icon: icon,
                  color: color,
                  title: title,
                  count: 0,
                };
              }
              legendAccumulator[legendKey].count += poiCount;
            }
          }
        } catch (error) {
          console.error(`Error processing ${title}:`, error);
        }
      });

      // Draw Chicago 311 Service Requests as point markers with color-coding by SR_TYPE
      try {
        if (enrichments.chicago_311_all && Array.isArray(enrichments.chicago_311_all)) {
          let chicago311Count = 0;
          
          // Color mapping function for SR_TYPE
          const getColorForSRType = (srType: string): string => {
            if (!srType) return '#6b7280'; // Default gray
            
            const type = srType.toLowerCase();
            // Common 311 request types with distinct colors
            if (type.includes('graffiti') || type.includes('vandalism')) return '#dc2626'; // Red
            if (type.includes('pothole') || type.includes('street')) return '#f59e0b'; // Orange
            if (type.includes('tree') || type.includes('parkway')) return '#10b981'; // Green
            if (type.includes('alley') || type.includes('light')) return '#3b82f6'; // Blue
            if (type.includes('garbage') || type.includes('trash') || type.includes('sanitation')) return '#8b5cf6'; // Purple
            if (type.includes('water') || type.includes('sewer')) return '#06b6d4'; // Cyan
            if (type.includes('building') || type.includes('housing')) return '#ef4444'; // Pink-red
            if (type.includes('rodent') || type.includes('animal')) return '#92400e'; // Brown
            if (type.includes('sidewalk') || type.includes('curb')) return '#6366f1'; // Indigo
            if (type.includes('traffic') || type.includes('sign')) return '#f97316'; // Orange-red
            
            // Default colors for other types (use hash of string for consistency)
            const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1'];
            const hash = srType.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return colors[hash % colors.length];
          };
          
          enrichments.chicago_311_all.forEach((request: any) => {
            try {
              const lat = request.latitude || request.geometry?.y || null;
              const lon = request.longitude || request.geometry?.x || null;
              
              if (lat !== null && lon !== null) {
                const srType = request.sr_type || request.SR_TYPE || 'Unknown';
                const srNumber = request.sr_number || request.SR_NUMBER || 'Unknown';
                const color = getColorForSRType(srType);
                const distance = request.distance_miles !== null && request.distance_miles !== undefined ? request.distance_miles : 0;
                
                const marker = L.marker([lat, lon], {
                  icon: createPOIIcon('📞', color)
                });
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      📞 Chicago 311 Service Request
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${srNumber ? `<div><strong>SR Number:</strong> ${srNumber}</div>` : ''}
                      ${srType ? `<div><strong>Type:</strong> ${srType}</div>` : ''}
                      ${request.status ? `<div><strong>Status:</strong> ${request.status}</div>` : ''}
                      ${request.street_address ? `<div><strong>Address:</strong> ${request.street_address}</div>` : ''}
                      ${request.community_area ? `<div><strong>Community Area:</strong> ${request.community_area}</div>` : ''}
                      ${request.ward ? `<div><strong>Ward:</strong> ${request.ward}</div>` : ''}
                      ${request.created_date ? `<div><strong>Created:</strong> ${new Date(request.created_date).toLocaleDateString()}</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all request attributes (excluding internal fields)
                const excludeFields = ['geometry', 'distance_miles', 'latitude', 'longitude', 'location', 'sr_number', 'SR_NUMBER', 'sr_type', 'SR_TYPE', 'status', 'street_address', 'community_area', 'ward', 'created_date'];
                Object.entries(request).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                chicago311Count++;
              }
            } catch (error) {
              console.error('Error drawing Chicago 311 marker:', error);
            }
          });
          
          if (chicago311Count > 0) {
            if (!legendAccumulator['chicago_311']) {
              legendAccumulator['chicago_311'] = {
                icon: '📞',
                color: '#3b82f6',
                title: 'Chicago 311 Service Requests',
                count: 0,
              };
            }
            legendAccumulator['chicago_311'].count += chicago311Count;
          }
        }
      } catch (error) {
        console.error('Error processing Chicago 311:', error);
      }

      // Draw Chicago Traffic Crashes as point markers
      try {
        if (enrichments.chicago_traffic_crashes_all && Array.isArray(enrichments.chicago_traffic_crashes_all)) {
          let chicagoTrafficCrashesCount = 0;
          
          enrichments.chicago_traffic_crashes_all.forEach((crash: any) => {
            try {
              const lat = crash.latitude || crash.geometry?.y || null;
              const lon = crash.longitude || crash.geometry?.x || null;
              
              if (lat !== null && lon !== null) {
                // Create marker with crash icon
                const marker = L.marker([lat, lon], {
                  icon: L.divIcon({
                    className: 'custom-marker-icon',
                    html: `<div style="background-color: #dc2626; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🚗</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  })
                });
                
                // Build popup content
                const crashId = crash.crash_record_id || crash.CRASH_RECORD_ID || 'Unknown';
                const crashDate = crash.crash_date || crash.CRASH_DATE || '';
                const crashType = crash.crash_type || crash.CRASH_TYPE || '';
                const firstCrashType = crash.first_crash_type || crash.FIRST_CRASH_TYPE || '';
                const primCause = crash.prim_contributory_cause || crash.PRIM_CONTRIBUTORY_CAUSE || '';
                const streetName = crash.street_name || crash.STREET_NAME || '';
                const streetNo = crash.street_no || crash.STREET_NO || '';
                const streetDir = crash.street_direction || crash.STREET_DIRECTION || '';
                const injuriesTotal = crash.injuries_total !== null && crash.injuries_total !== undefined ? crash.injuries_total : 0;
                const mostSevereInjury = crash.most_severe_injury || crash.MOST_SEVERE_INJURY || '';
                const distance = crash.distance_miles !== null && crash.distance_miles !== undefined ? crash.distance_miles.toFixed(2) : '';
                
                // Build address
                let address = '';
                if (streetNo) address += streetNo;
                if (streetDir) address += ` ${streetDir}`;
                if (streetName) address += ` ${streetName}`;
                
                let popupContent = `
                  <div style="max-width: 300px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1f2937;">
                      🚗 Traffic Crash
                    </div>
                    <div style="font-size: 12px; color: #4b5563;">
                      ${crashId ? `<div><strong>Crash ID:</strong> ${crashId}</div>` : ''}
                      ${crashDate ? `<div><strong>Date:</strong> ${new Date(crashDate).toLocaleString()}</div>` : ''}
                      ${address ? `<div><strong>Location:</strong> ${address.trim()}</div>` : ''}
                      ${crashType ? `<div><strong>Crash Type:</strong> ${crashType}</div>` : ''}
                      ${firstCrashType ? `<div><strong>First Crash Type:</strong> ${firstCrashType}</div>` : ''}
                      ${primCause ? `<div><strong>Primary Cause:</strong> ${primCause}</div>` : ''}
                      ${injuriesTotal > 0 ? `<div><strong>Injuries:</strong> ${injuriesTotal}</div>` : ''}
                      ${mostSevereInjury ? `<div><strong>Most Severe Injury:</strong> ${mostSevereInjury}</div>` : ''}
                      ${distance ? `<div><strong>Distance:</strong> ${distance} miles</div>` : ''}
                `;
                
                // Add all crash attributes (excluding internal fields)
                const excludeFields = ['geometry', 'distance_miles', 'latitude', 'longitude', 'location', 'crash_record_id', 'CRASH_RECORD_ID', 'crash_date', 'CRASH_DATE', 'crash_type', 'CRASH_TYPE', 'first_crash_type', 'FIRST_CRASH_TYPE', 'prim_contributory_cause', 'PRIM_CONTRIBUTORY_CAUSE', 'street_name', 'STREET_NAME', 'street_no', 'STREET_NO', 'street_direction', 'STREET_DIRECTION', 'injuries_total', 'INJURIES_TOTAL', 'most_severe_injury', 'MOST_SEVERE_INJURY'];
                Object.entries(crash).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                chicagoTrafficCrashesCount++;
              }
            } catch (error) {
              console.error('Error drawing Chicago Traffic Crash marker:', error);
            }
          });
          
          if (chicagoTrafficCrashesCount > 0) {
            if (!legendAccumulator['chicago_traffic_crashes']) {
              legendAccumulator['chicago_traffic_crashes'] = {
                icon: '🚗',
                color: '#dc2626',
                title: 'Chicago Traffic Crashes',
                count: 0,
              };
            }
            legendAccumulator['chicago_traffic_crashes'].count += chicagoTrafficCrashesCount;
          }
        }
      } catch (error) {
        console.error('Error processing Chicago Traffic Crashes:', error);
      }

      // Draw Chicago Building Centroids as point markers
      try {
        if (enrichments.chicago_building_footprints_all && Array.isArray(enrichments.chicago_building_footprints_all)) {
          let chicagoBuildingFootprintsCount = 0;
          
          enrichments.chicago_building_footprints_all.forEach((footprint: any) => {
            try {
              // Use centroid coordinates (latitude/longitude) from the adapter
              const lat = footprint.latitude;
              const lon = footprint.longitude;
              
              if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
                // Create marker with building icon
                const marker = L.marker([lat, lon], {
                  icon: L.divIcon({
                    className: 'custom-marker-icon',
                    html: `<div style="background-color: #8b5cf6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏢</div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                  })
                });
                
                // Build popup content
                const bldgId = footprint.bldg_id || footprint.BLDG_ID || 'Unknown';
                const bldgName1 = footprint.bldg_name1 || footprint.BLDG_NAME1 || '';
                const bldgName2 = footprint.bldg_name2 || footprint.BLDG_NAME2 || '';
                const bldgName = bldgName1 || bldgName2 || '';
                const unitName = footprint.unit_name || footprint.UNIT_NAME || '';
                const fAdd1 = footprint.f_add1 || footprint.F_ADD1 || '';
                const tAdd1 = footprint.t_add1 || footprint.T_ADD1 || '';
                const preDir1 = footprint.pre_dir1 || footprint.PRE_DIR1 || '';
                const stName1 = footprint.st_name1 || footprint.ST_NAME1 || '';
                const stType1 = footprint.st_type1 || footprint.ST_TYPE1 || '';
                const sufDir1 = footprint.suf_dir1 || footprint.SUF_DIR1 || '';
                const yearBuilt = footprint.year_built || footprint.YEAR_BUILT || '';
                const stories = footprint.stories || footprint.STORIES || footprint.no_stories || footprint.NO_STORIES || '';
                const distance = footprint.distance_miles !== null && footprint.distance_miles !== undefined ? footprint.distance_miles.toFixed(2) : '';
                
                // Build address from components
                let address = '';
                if (fAdd1 || tAdd1) {
                  address = `${fAdd1}${tAdd1 ? `-${tAdd1}` : ''}`;
                }
                if (preDir1 || stName1 || stType1 || sufDir1) {
                  address += ` ${preDir1 || ''} ${stName1 || ''} ${stType1 || ''} ${sufDir1 || ''}`.trim();
                }
                if (unitName) {
                  address += ` ${unitName}`;
                }
                
                let popupContent = `
                  <div style="max-width: 300px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1f2937;">
                      🏢 Building Centroid
                    </div>
                    <div style="font-size: 12px; color: #4b5563;">
                      ${bldgName ? `<div><strong>Name:</strong> ${bldgName}</div>` : ''}
                      ${bldgId ? `<div><strong>Building ID:</strong> ${bldgId}</div>` : ''}
                      ${address ? `<div><strong>Address:</strong> ${address.trim()}</div>` : ''}
                      ${yearBuilt ? `<div><strong>Year Built:</strong> ${yearBuilt}</div>` : ''}
                      ${stories ? `<div><strong>Stories:</strong> ${stories}</div>` : ''}
                      ${distance ? `<div><strong>Distance:</strong> ${distance} miles</div>` : ''}
                `;
                
                // Add all footprint attributes (excluding internal fields)
                const excludeFields = ['the_geom', 'geometry', 'distance_miles', 'latitude', 'longitude', 'location', 'bldg_id', 'BLDG_ID', 'bldg_name1', 'BLDG_NAME1', 'bldg_name2', 'BLDG_NAME2', 'unit_name', 'UNIT_NAME', 'f_add1', 'F_ADD1', 't_add1', 'T_ADD1', 'pre_dir1', 'PRE_DIR1', 'st_name1', 'ST_NAME1', 'st_type1', 'ST_TYPE1', 'suf_dir1', 'SUF_DIR1', 'year_built', 'YEAR_BUILT', 'stories', 'STORIES', 'no_stories', 'NO_STORIES'];
                Object.entries(footprint).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                chicagoBuildingFootprintsCount++;
              }
            } catch (error) {
              console.error('Error drawing Chicago Building Centroid:', error);
            }
          });
          
          if (chicagoBuildingFootprintsCount > 0) {
            if (!legendAccumulator['chicago_building_footprints']) {
              legendAccumulator['chicago_building_footprints'] = {
                icon: '🏢',
                color: '#8b5cf6',
                title: 'Chicago Building Centroids',
                count: 0,
              };
            }
            legendAccumulator['chicago_building_footprints'].count += chicagoBuildingFootprintsCount;
          }
        }
      } catch (error) {
        console.error('Error processing Chicago Building Centroids:', error);
      }

      // Draw Chicago Speed Camera Locations as point markers
      try {
        if (enrichments.chicago_speed_cameras_all && Array.isArray(enrichments.chicago_speed_cameras_all)) {
          let chicagoSpeedCamerasCount = 0;
          
          enrichments.chicago_speed_cameras_all.forEach((camera: any) => {
            try {
              const lat = camera.latitude || camera.geometry?.y || null;
              const lon = camera.longitude || camera.geometry?.x || null;
              
              if (lat !== null && lon !== null) {
                // Create marker with camera icon
                const marker = L.marker([lat, lon], {
                  icon: L.divIcon({
                    className: 'custom-marker-icon',
                    html: `<div style="background-color: #f59e0b; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📷</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  })
                });
                
                // Build popup content
                const cameraId = camera.camera_id || camera.CAMERA_ID || 'Unknown';
                const address = camera.address || camera.ADDRESS || '';
                const distance = camera.distance_miles !== null && camera.distance_miles !== undefined ? camera.distance_miles.toFixed(2) : '';
                
                let popupContent = `
                  <div style="max-width: 300px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1f2937;">
                      📷 Speed Camera
                    </div>
                    <div style="font-size: 12px; color: #4b5563;">
                      ${cameraId ? `<div><strong>Camera ID:</strong> ${cameraId}</div>` : ''}
                      ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                      ${distance ? `<div><strong>Distance:</strong> ${distance} miles</div>` : ''}
                `;
                
                // Add all camera attributes (excluding internal fields)
                const excludeFields = ['geometry', 'distance_miles', 'latitude', 'longitude', 'location', 'camera_id', 'CAMERA_ID', 'address', 'ADDRESS'];
                Object.entries(camera).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                marker.addTo(primary);
                bounds.extend(marker.getLatLng());
                
                chicagoSpeedCamerasCount++;
              }
            } catch (error) {
              console.error('Error drawing Chicago Speed Camera marker:', error);
            }
          });
          
          if (chicagoSpeedCamerasCount > 0) {
            if (!legendAccumulator['chicago_speed_cameras']) {
              legendAccumulator['chicago_speed_cameras'] = {
                icon: '📷',
                color: '#f59e0b',
                title: 'Chicago Speed Camera Locations',
                count: 0,
              };
            }
            legendAccumulator['chicago_speed_cameras'].count += chicagoSpeedCamerasCount;
          }
        }
      } catch (error) {
        console.error('Error processing Chicago Speed Camera Locations:', error);
      }

      // Draw Chicago Red Light Camera Locations as point markers
      try {
        if (enrichments.chicago_red_light_cameras_all && Array.isArray(enrichments.chicago_red_light_cameras_all)) {
          let chicagoRedLightCamerasCount = 0;
          
          enrichments.chicago_red_light_cameras_all.forEach((camera: any) => {
            try {
              const lat = camera.latitude || camera.geometry?.y || null;
              const lon = camera.longitude || camera.geometry?.x || null;
              
              if (lat !== null && lon !== null) {
                // Create marker with red light camera icon
                const marker = L.marker([lat, lon], {
                  icon: L.divIcon({
                    className: 'custom-marker-icon',
                    html: `<div style="background-color: #dc2626; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🚦</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  })
                });
                
                // Build popup content
                const cameraId = camera.camera_id || camera.CAMERA_ID || 'Unknown';
                const address = camera.address || camera.ADDRESS || '';
                const distance = camera.distance_miles !== null && camera.distance_miles !== undefined ? camera.distance_miles.toFixed(2) : '';
                
                let popupContent = `
                  <div style="max-width: 300px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1f2937;">
                      🚦 Red Light Camera
                    </div>
                    <div style="font-size: 12px; color: #4b5563;">
                      ${cameraId ? `<div><strong>Camera ID:</strong> ${cameraId}</div>` : ''}
                      ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                      ${distance ? `<div><strong>Distance:</strong> ${distance} miles</div>` : ''}
                `;
                
                // Add all camera attributes (excluding internal fields)
                const excludeFields = ['geometry', 'distance_miles', 'latitude', 'longitude', 'location', 'camera_id', 'CAMERA_ID', 'address', 'ADDRESS'];
                Object.entries(camera).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                marker.addTo(primary);
                bounds.extend(marker.getLatLng());
                
                chicagoRedLightCamerasCount++;
              }
            } catch (error) {
              console.error('Error drawing Chicago Red Light Camera marker:', error);
            }
          });
          
          if (chicagoRedLightCamerasCount > 0) {
            if (!legendAccumulator['chicago_red_light_cameras']) {
              legendAccumulator['chicago_red_light_cameras'] = {
                icon: '🚦',
                color: '#dc2626',
                title: 'Chicago Red Light Camera Locations',
                count: 0,
              };
            }
            legendAccumulator['chicago_red_light_cameras'].count += chicagoRedLightCamerasCount;
          }
        }
      } catch (error) {
        console.error('Error processing Chicago Red Light Camera Locations:', error);
      }

      // Draw NYC MapPLUTO Tax Lots as polygons on the map
      try {
        if (enrichments.nyc_mappluto_all && Array.isArray(enrichments.nyc_mappluto_all)) {
          let taxLotCount = 0;
          enrichments.nyc_mappluto_all.forEach((taxLot: any) => {
            if (taxLot.geometry && taxLot.geometry.rings) {
              try {
                const rings = taxLot.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('NYC MapPLUTO tax lot polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = taxLot.isContaining;
                  const color = isContaining ? '#3b82f6' : '#60a5fa'; // Blue for tax lots
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const bbl = taxLot.bbl || taxLot.BBL || taxLot.bbl || null;
                  const address = taxLot.address || taxLot.Address || taxLot.ADDRESS || null;
                  const borough = taxLot.borough || taxLot.Borough || taxLot.BOROUGH || null;
                  const block = taxLot.block || taxLot.Block || taxLot.BLOCK || null;
                  const lot = taxLot.lot || taxLot.Lot || taxLot.LOT || null;
                  const ownerName = taxLot.ownerName || taxLot.OwnerName || taxLot.OWNERNAME || null;
                  const landUse = taxLot.landUse || taxLot.LandUse || taxLot.LANDUSE || null;
                  const yearBuilt = taxLot.yearBuilt || taxLot.YearBuilt || taxLot.YEARBUILT || null;
                  const bldgClass = taxLot.bldgClass || taxLot.BldgClass || taxLot.BLDGCLASS || null;
                  const lotArea = taxLot.lotArea || taxLot.LotArea || taxLot.LOTAREA || null;
                  const bldgArea = taxLot.bldgArea || taxLot.BldgArea || taxLot.BLDGAREA || null;
                  const numBldgs = taxLot.numBldgs || taxLot.NumBldgs || taxLot.NUMBLDGS || null;
                  const numFloors = taxLot.numFloors || taxLot.NumFloors || taxLot.NUMFLOORS || null;
                  const unitsRes = taxLot.unitsRes || taxLot.UnitsRes || taxLot.UNITSRES || null;
                  const unitsTotal = taxLot.unitsTotal || taxLot.UnitsTotal || taxLot.UNITSTOTAL || null;
                  const assessLand = taxLot.assessLand || taxLot.AssessLand || taxLot.ASSESSLAND || null;
                  const assessTot = taxLot.assessTot || taxLot.AssessTot || taxLot.ASSESSTOT || null;
                  const zoneDist1 = taxLot.zoneDist1 || taxLot.ZoneDist1 || taxLot.ZONEDIST1 || null;
                  const zipCode = taxLot.zipCode || taxLot.ZipCode || taxLot.ZIPCODE || null;
                  const distance = taxLot.distance_miles !== null && taxLot.distance_miles !== undefined ? taxLot.distance_miles : 0;
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ${isContaining ? '🏢 Containing Tax Lot' : '🏢 Nearby Tax Lot'}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${bbl ? `<div><strong>BBL:</strong> ${bbl}</div>` : ''}
                        ${address ? `<div><strong>Address:</strong> ${address}</div>` : ''}
                        ${borough ? `<div><strong>Borough:</strong> ${borough}</div>` : ''}
                        ${block ? `<div><strong>Block:</strong> ${block}</div>` : ''}
                        ${lot ? `<div><strong>Lot:</strong> ${lot}</div>` : ''}
                        ${zipCode ? `<div><strong>Zip Code:</strong> ${zipCode}</div>` : ''}
                        ${ownerName ? `<div><strong>Owner:</strong> ${ownerName}</div>` : ''}
                        ${landUse ? `<div><strong>Land Use:</strong> ${landUse}</div>` : ''}
                        ${yearBuilt ? `<div><strong>Year Built:</strong> ${yearBuilt}</div>` : ''}
                        ${bldgClass ? `<div><strong>Building Class:</strong> ${bldgClass}</div>` : ''}
                        ${lotArea !== null && lotArea !== undefined ? `<div><strong>Lot Area:</strong> ${lotArea.toLocaleString()} sq ft</div>` : ''}
                        ${bldgArea !== null && bldgArea !== undefined ? `<div><strong>Building Area:</strong> ${bldgArea.toLocaleString()} sq ft</div>` : ''}
                        ${numBldgs !== null && numBldgs !== undefined ? `<div><strong>Number of Buildings:</strong> ${numBldgs}</div>` : ''}
                        ${numFloors ? `<div><strong>Number of Floors:</strong> ${numFloors}</div>` : ''}
                        ${unitsRes !== null && unitsRes !== undefined ? `<div><strong>Residential Units:</strong> ${unitsRes}</div>` : ''}
                        ${unitsTotal !== null && unitsTotal !== undefined ? `<div><strong>Total Units:</strong> ${unitsTotal}</div>` : ''}
                        ${assessLand !== null && assessLand !== undefined ? `<div><strong>Assessed Land Value:</strong> $${assessLand.toLocaleString()}</div>` : ''}
                        ${assessTot !== null && assessTot !== undefined ? `<div><strong>Total Assessed Value:</strong> $${assessTot.toLocaleString()}</div>` : ''}
                        ${zoneDist1 ? `<div><strong>Zoning District:</strong> ${zoneDist1}</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this tax lot</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all tax lot attributes (excluding internal fields)
                  const excludeFields = ['objectId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'bbl', 'BBL', 'bbl', 'address', 'Address', 'ADDRESS', 'borough', 'Borough', 'BOROUGH', 'block', 'Block', 'BLOCK', 'lot', 'Lot', 'LOT', 'zipCode', 'ZipCode', 'ZIPCODE', 'ownerName', 'OwnerName', 'OWNERNAME', 'landUse', 'LandUse', 'LANDUSE', 'yearBuilt', 'YearBuilt', 'YEARBUILT', 'bldgClass', 'BldgClass', 'BLDGCLASS', 'lotArea', 'LotArea', 'LOTAREA', 'bldgArea', 'BldgArea', 'BLDGAREA', 'numBldgs', 'NumBldgs', 'NUMBLDGS', 'numFloors', 'NumFloors', 'NUMFLOORS', 'unitsRes', 'UnitsRes', 'UNITSRES', 'unitsTotal', 'UnitsTotal', 'UNITSTOTAL', 'assessLand', 'AssessLand', 'ASSESSLAND', 'assessTot', 'AssessTot', 'ASSESSTOT', 'zoneDist1', 'ZoneDist1', 'ZONEDIST1', 'isContaining'];
                  Object.entries(taxLot).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds);
                  
                  taxLotCount++;
                }
              } catch (error) {
                console.error('Error drawing NYC MapPLUTO tax lot polygon:', error);
              }
            }
          });
          
          if (taxLotCount > 0) {
            if (!legendAccumulator['nyc_mappluto']) {
              legendAccumulator['nyc_mappluto'] = {
                icon: '🏢',
                color: '#3b82f6',
                title: 'NYC MapPLUTO Tax Lots',
                count: 0,
              };
            }
            legendAccumulator['nyc_mappluto'].count += taxLotCount;
          }
        }
      } catch (error) {
        console.error('Error processing NYC MapPLUTO Tax Lots:', error);
      }

      // Draw NYC Bike Routes as polylines on the map
      try {
        if (enrichments.nyc_bike_routes_all && Array.isArray(enrichments.nyc_bike_routes_all)) {
          let bikeRouteCount = 0;
          enrichments.nyc_bike_routes_all.forEach((route: any) => {
            if (route.geometry && route.geometry.paths) {
              try {
                const paths = route.geometry.paths;
                if (paths && paths.length > 0) {
                  paths.forEach((path: number[][]) => {
                    const latlngs = path.map((coord: number[]) => {
                      return [coord[1], coord[0]] as [number, number];
                    });
                    
                    if (latlngs.length < 2) {
                      return;
                    }
                    
                    const polyline = L.polyline(latlngs, {
                      color: '#10b981',
                      weight: 3,
                      opacity: 0.8
                    });
                    
                    const routeName = route.name || route.NAME || route.Name || 'Unknown Route';
                    const routeType = route.routeType || route.ROUTE_TYPE || route.route_type || route.TYPE || route.type || '';
                    const status = route.status || route.STATUS || route.Status || '';
                    const distance = route.distance_miles !== null && route.distance_miles !== undefined ? route.distance_miles.toFixed(2) : '';
                    
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          🚴 Bike Route
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${routeName ? `<div><strong>Name:</strong> ${routeName}</div>` : ''}
                          ${routeType ? `<div><strong>Route Type:</strong> ${routeType}</div>` : ''}
                          ${status ? `<div><strong>Status:</strong> ${status}</div>` : ''}
                          ${distance ? `<div><strong>Distance:</strong> ${distance} miles</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    // Add all route attributes (excluding internal fields)
                    const excludeFields = ['geometry', 'distance_miles', 'routeId', 'ROUTE_ID', 'route_id', 'OBJECTID', 'objectid', 'name', 'NAME', 'Name', 'routeType', 'ROUTE_TYPE', 'route_type', 'TYPE', 'type', 'status', 'STATUS', 'Status'];
                    Object.entries(route).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polyline.bindPopup(popupContent);
                    polyline.addTo(primary);
                    
                    // Extend bounds to include polyline
                    const polylineBounds = L.latLngBounds(latlngs);
                    bounds.extend(polylineBounds);
                    
                    bikeRouteCount++;
                  });
                }
              } catch (error) {
                console.error('Error drawing NYC Bike Route polyline:', error);
              }
            }
          });
          
          if (bikeRouteCount > 0) {
            if (!legendAccumulator['nyc_bike_routes']) {
              legendAccumulator['nyc_bike_routes'] = {
                icon: '🚴',
                color: '#10b981',
                title: 'NYC Bike Routes',
                count: 0,
              };
            }
            legendAccumulator['nyc_bike_routes'].count += bikeRouteCount;
          }
        }
      } catch (error) {
        console.error('Error processing NYC Bike Routes:', error);
      }

      // Draw NYC Neighborhoods as polygons on the map
      try {
        if (enrichments.nyc_neighborhoods_all && Array.isArray(enrichments.nyc_neighborhoods_all)) {
          let neighborhoodCount = 0;
          enrichments.nyc_neighborhoods_all.forEach((neighborhood: any) => {
            if (neighborhood.geometry && neighborhood.geometry.rings) {
              try {
                const rings = neighborhood.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('NYC Neighborhood polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = neighborhood.isContaining;
                  const color = isContaining ? '#06b6d4' : '#67e8f9'; // Cyan for neighborhoods
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const ntaCode = neighborhood.ntaCode || neighborhood.NTACode || neighborhood.NTA_CODE || neighborhood.nta_code || null;
                  const ntaName = neighborhood.ntaName || neighborhood.NTAName || neighborhood.NTA_NAME || neighborhood.nta_name || neighborhood.Name || neighborhood.name || null;
                  const borough = neighborhood.borough || neighborhood.Borough || neighborhood.BOROUGH || null;
                  const distance = neighborhood.distance_miles !== null && neighborhood.distance_miles !== undefined ? neighborhood.distance_miles : 0;
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ${isContaining ? '🏘️ Containing Neighborhood' : '🏘️ Nearby Neighborhood'}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${ntaName ? `<div><strong>Neighborhood:</strong> ${ntaName}</div>` : ''}
                        ${ntaCode ? `<div><strong>NTA Code:</strong> ${ntaCode}</div>` : ''}
                        ${borough ? `<div><strong>Borough:</strong> ${borough}</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this neighborhood</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all neighborhood attributes (excluding internal fields)
                  const excludeFields = ['neighborhoodId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'ntaCode', 'NTACode', 'NTA_CODE', 'nta_code', 'ntaName', 'NTAName', 'NTA_NAME', 'nta_name', 'Name', 'name', 'borough', 'Borough', 'BOROUGH', 'isContaining'];
                  Object.entries(neighborhood).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds);
                  
                  neighborhoodCount++;
                }
              } catch (error) {
                console.error('Error drawing NYC Neighborhood polygon:', error);
              }
            }
          });
          
          if (neighborhoodCount > 0) {
            if (!legendAccumulator['nyc_neighborhoods']) {
              legendAccumulator['nyc_neighborhoods'] = {
                icon: '🏘️',
                color: '#06b6d4',
                title: 'NYC Neighborhoods',
                count: 0,
              };
            }
            legendAccumulator['nyc_neighborhoods'].count += neighborhoodCount;
          }
        }
      } catch (error) {
        console.error('Error processing NYC Neighborhoods:', error);
      }

      // Draw NYC Zoning Districts as polygons on the map
      try {
        if (enrichments.nyc_zoning_districts_all && Array.isArray(enrichments.nyc_zoning_districts_all)) {
          let districtCount = 0;
          enrichments.nyc_zoning_districts_all.forEach((district: any) => {
            if (district.geometry && district.geometry.rings) {
              try {
                const rings = district.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('NYC Zoning District polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = district.isContaining;
                  const color = isContaining ? '#8b5cf6' : '#a78bfa'; // Purple for zoning
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const zoneDistrict = district.zoneDistrict || district.ZONEDIST || district.zonedist || null;
                  const zoneSubdistrict = district.zoneSubdistrict || district.ZONESUBDIST || district.zonesubdist || null;
                  const distance = district.distance_miles !== null && district.distance_miles !== undefined ? district.distance_miles : 0;
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ${isContaining ? '🏛️ Containing Zoning District' : '🏛️ Nearby Zoning District'}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${zoneDistrict ? `<div><strong>Zone District:</strong> ${zoneDistrict}</div>` : ''}
                        ${zoneSubdistrict ? `<div><strong>Zone Subdistrict:</strong> ${zoneSubdistrict}</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this zoning district</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all district attributes (excluding internal fields)
                  const excludeFields = ['districtId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'zoneDistrict', 'ZONEDIST', 'zonedist', 'ZoneDist', 'ZONE_DIST', 'zoneSubdistrict', 'ZONESUBDIST', 'zonesubdist', 'ZoneSubdist', 'ZONE_SUBDIST', 'isContaining'];
                  Object.entries(district).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent, { maxWidth: 400 });
                  // Store metadata for tabbed popup
                  (polygon as any).__layerType = 'nyc_zoning_districts';
                  (polygon as any).__layerTitle = 'NYC Zoning Districts';
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds);
                  
                  districtCount++;
                }
              } catch (error) {
                console.error('Error drawing NYC Zoning District polygon:', error);
              }
            }
          });
          
          if (districtCount > 0) {
            if (!legendAccumulator['nyc_zoning_districts']) {
              legendAccumulator['nyc_zoning_districts'] = {
                icon: '🏛️',
                color: '#8b5cf6',
                title: 'NYC Zoning Districts',
                count: 0,
              };
            }
            legendAccumulator['nyc_zoning_districts'].count += districtCount;
          }
        }
      } catch (error) {
        console.error('Error processing NYC Zoning Districts:', error);
      }

      // Draw NYC Waterfront Access - HPB Launch Site as points on the map
      try {
        if (enrichments.nyc_waterfront_hpb_launch_site_all && Array.isArray(enrichments.nyc_waterfront_hpb_launch_site_all)) {
          let launchSiteCount = 0;
          enrichments.nyc_waterfront_hpb_launch_site_all.forEach((site: any) => {
            if (site.geometry && site.geometry.x !== undefined && site.geometry.y !== undefined) {
              try {
                const lat = site.geometry.y;
                const lon = site.geometry.x;
                const name = site.name || site.NAME || site.Name || site.SITE_NAME || site.site_name || 'Unknown Launch Site';
                const type = site.type || site.TYPE || site.Type || null;
                const distance = site.distance_miles !== null && site.distance_miles !== undefined ? site.distance_miles.toFixed(2) : '';
                
                const icon = createPOIIcon('🚤', '#0891b2'); // Teal for waterfront
                const marker = L.marker([lat, lon], { icon });
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🚤 HPB Launch Site
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${name ? `<div><strong>Name:</strong> ${name}</div>` : ''}
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${distance ? `<div><strong>Distance:</strong> ${distance} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all site attributes (excluding internal fields)
                const excludeFields = ['featureId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'name', 'NAME', 'Name', 'SITE_NAME', 'site_name', 'type', 'TYPE', 'Type', 'layerId', 'isContaining'];
                Object.entries(site).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                // Store metadata for tabbed popup
                (marker as any).__layerType = 'nyc_waterfront_hpb_launch_site';
                (marker as any).__layerTitle = 'NYC HPB Launch Site';
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                
                launchSiteCount++;
              } catch (error) {
                console.error('Error drawing NYC HPB Launch Site marker:', error);
              }
            }
          });
          
          if (launchSiteCount > 0) {
            if (!legendAccumulator['nyc_waterfront_hpb_launch_site']) {
              legendAccumulator['nyc_waterfront_hpb_launch_site'] = {
                icon: '🚤',
                color: '#0891b2',
                title: 'NYC HPB Launch Site',
                count: 0,
              };
            }
            legendAccumulator['nyc_waterfront_hpb_launch_site'].count += launchSiteCount;
          }
        }
      } catch (error) {
        console.error('Error processing NYC HPB Launch Site:', error);
      }

      // Draw NYC Waterfront Access - Waterfront Parks as polygons on the map
      try {
        if (enrichments.nyc_waterfront_parks_all && Array.isArray(enrichments.nyc_waterfront_parks_all)) {
          let parkCount = 0;
          enrichments.nyc_waterfront_parks_all.forEach((park: any) => {
            if (park.geometry && park.geometry.rings) {
              try {
                const rings = park.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('NYC Waterfront Park polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = park.isContaining;
                  const color = isContaining ? '#10b981' : '#34d399'; // Green for parks
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const name = park.name || park.NAME || park.Name || park.PARK_NAME || park.park_name || 'Unknown Park';
                  const type = park.type || park.TYPE || park.Type || null;
                  const distance = park.distance_miles !== null && park.distance_miles !== undefined ? park.distance_miles : 0;
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ${isContaining ? '🌳 Containing Waterfront Park' : '🌳 Nearby Waterfront Park'}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${name ? `<div><strong>Name:</strong> ${name}</div>` : ''}
                        ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this park</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all park attributes (excluding internal fields)
                  const excludeFields = ['featureId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'name', 'NAME', 'Name', 'PARK_NAME', 'park_name', 'type', 'TYPE', 'Type', 'layerId', 'isContaining'];
                  Object.entries(park).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent, { maxWidth: 400 });
                  // Store metadata for tabbed popup
                  (polygon as any).__layerType = 'nyc_waterfront_parks';
                  (polygon as any).__layerTitle = 'NYC Waterfront Parks';
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds);
                  
                  parkCount++;
                }
              } catch (error) {
                console.error('Error drawing NYC Waterfront Park polygon:', error);
              }
            }
          });
          
          if (parkCount > 0) {
            if (!legendAccumulator['nyc_waterfront_parks']) {
              legendAccumulator['nyc_waterfront_parks'] = {
                icon: '🌳',
                color: '#10b981',
                title: 'NYC Waterfront Parks',
                count: 0,
              };
            }
            legendAccumulator['nyc_waterfront_parks'].count += parkCount;
          }
        }
      } catch (error) {
        console.error('Error processing NYC Waterfront Parks:', error);
      }

      // Draw NYC Waterfront Access - PAWS as polygons on the map
      try {
        if (enrichments.nyc_waterfront_paws_all && Array.isArray(enrichments.nyc_waterfront_paws_all)) {
          let pawsCount = 0;
          enrichments.nyc_waterfront_paws_all.forEach((paws: any) => {
            if (paws.geometry && paws.geometry.rings) {
              try {
                const rings = paws.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('NYC PAWS polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = paws.isContaining;
                  const color = isContaining ? '#06b6d4' : '#22d3ee'; // Cyan for PAWS
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const name = paws.name || paws.NAME || paws.Name || paws.SITE_NAME || paws.site_name || 'Unknown PAWS';
                  const type = paws.type || paws.TYPE || paws.Type || null;
                  const distance = paws.distance_miles !== null && paws.distance_miles !== undefined ? paws.distance_miles : 0;
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ${isContaining ? '🌊 Containing PAWS' : '🌊 Nearby PAWS'}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${name ? `<div><strong>Name:</strong> ${name}</div>` : ''}
                        ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this PAWS</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all PAWS attributes (excluding internal fields)
                  const excludeFields = ['featureId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'name', 'NAME', 'Name', 'SITE_NAME', 'site_name', 'type', 'TYPE', 'Type', 'layerId', 'isContaining'];
                  Object.entries(paws).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent, { maxWidth: 400 });
                  // Store metadata for tabbed popup
                  (polygon as any).__layerType = 'nyc_waterfront_paws';
                  (polygon as any).__layerTitle = 'NYC PAWS Publicly Accessible Waterfront Spaces';
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds);
                  
                  pawsCount++;
                }
              } catch (error) {
                console.error('Error drawing NYC PAWS polygon:', error);
              }
            }
          });
          
          if (pawsCount > 0) {
            if (!legendAccumulator['nyc_waterfront_paws']) {
              legendAccumulator['nyc_waterfront_paws'] = {
                icon: '🌊',
                color: '#06b6d4',
                title: 'NYC PAWS Publicly Accessible Waterfront Spaces',
                count: 0,
              };
            }
            legendAccumulator['nyc_waterfront_paws'].count += pawsCount;
          }
        }
      } catch (error) {
        console.error('Error processing NYC PAWS:', error);
      }

      // Draw NYC Business Improvement Districts as polygons on the map
      try {
        if (enrichments.nyc_business_improvement_districts_all && Array.isArray(enrichments.nyc_business_improvement_districts_all)) {
          let bidCount = 0;
          enrichments.nyc_business_improvement_districts_all.forEach((bid: any) => {
            // Check if geometry is available (could be GeoJSON polygon)
            if (bid.geometry && (bid.geometry.type === 'Polygon' || bid.geometry.type === 'MultiPolygon')) {
              try {
                let latlngs: [number, number][] = [];
                
                // Extract coordinates from GeoJSON geometry
                if (bid.geometry.type === 'Polygon' && bid.geometry.coordinates && bid.geometry.coordinates[0]) {
                  latlngs = bid.geometry.coordinates[0].map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number]; // GeoJSON is [lon, lat], Leaflet needs [lat, lon]
                  });
                } else if (bid.geometry.type === 'MultiPolygon' && bid.geometry.coordinates && bid.geometry.coordinates[0] && bid.geometry.coordinates[0][0]) {
                  latlngs = bid.geometry.coordinates[0][0].map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                }
                
                if (latlngs.length < 3) {
                  console.warn('NYC Business Improvement District polygon has less than 3 coordinates, skipping');
                  return;
                }
                
                const isContaining = bid.isContaining;
                const color = isContaining ? '#f59e0b' : '#fbbf24'; // Amber for BIDs
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;
                
                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });
                
                const name = bid.name || bid.bid_name || bid.bidName || bid.BID_NAME || bid.NAME || bid.Name || 'Unknown BID';
                const borough = bid.borough || bid.Borough || bid.BOROUGH || null;
                const distance = bid.distance_miles !== null && bid.distance_miles !== undefined ? bid.distance_miles : 0;
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ${isContaining ? '🏢 Containing Business Improvement District' : '🏢 Nearby Business Improvement District'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${name ? `<div><strong>Name:</strong> ${name}</div>` : ''}
                      ${borough ? `<div><strong>Borough:</strong> ${borough}</div>` : ''}
                      ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this BID</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all BID attributes (excluding internal fields)
                const excludeFields = ['districtId', 'bid_id', 'bidId', 'BID_ID', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'name', 'bid_name', 'bidName', 'BID_NAME', 'NAME', 'Name', 'borough', 'Borough', 'BOROUGH', 'isContaining', '__calculatedDistance'];
                Object.entries(bid).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value) && key !== 'the_geom') {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                // Store metadata for tabbed popup
                (polygon as any).__layerType = 'nyc_business_improvement_districts';
                (polygon as any).__layerTitle = 'NYC Business Improvement Districts';
                (polygon as any).__popupContent = popupContent;
                polygon.addTo(primary);
                
                // Extend bounds to include polygon
                const polygonBounds = L.latLngBounds(latlngs);
                bounds.extend(polygonBounds);
                
                bidCount++;
              } catch (error) {
                console.error('Error drawing NYC Business Improvement District polygon:', error);
              }
            } else if (bid.latitude && bid.longitude) {
              // Fallback: if no polygon geometry, render as point marker
              try {
                const lat = bid.latitude;
                const lon = bid.longitude;
                const name = bid.name || bid.bid_name || bid.bidName || bid.BID_NAME || bid.NAME || bid.Name || 'Unknown BID';
                const borough = bid.borough || bid.Borough || bid.BOROUGH || null;
                const distance = bid.distance_miles !== null && bid.distance_miles !== undefined ? bid.distance_miles.toFixed(2) : '';
                
                const icon = createPOIIcon('🏢', '#f59e0b'); // Amber for BIDs
                const marker = L.marker([lat, lon], { icon });
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🏢 Business Improvement District
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${name ? `<div><strong>Name:</strong> ${name}</div>` : ''}
                      ${borough ? `<div><strong>Borough:</strong> ${borough}</div>` : ''}
                      ${distance ? `<div><strong>Distance:</strong> ${distance} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all BID attributes
                const excludeFields = ['districtId', 'bid_id', 'bidId', 'BID_ID', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'latitude', 'lat', 'LATITUDE', 'LAT', 'longitude', 'lon', 'LONGITUDE', 'LON', 'lng', 'LNG', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'name', 'bid_name', 'bidName', 'BID_NAME', 'NAME', 'Name', 'borough', 'Borough', 'BOROUGH', 'isContaining', '__calculatedDistance'];
                Object.entries(bid).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent, { maxWidth: 400 });
                // Store metadata for tabbed popup
                (marker as any).__layerType = 'nyc_business_improvement_districts';
                (marker as any).__layerTitle = 'NYC Business Improvement Districts';
                (marker as any).__popupContent = popupContent;
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                
                bidCount++;
              } catch (error) {
                console.error('Error drawing NYC Business Improvement District marker:', error);
              }
            }
          });
          
          if (bidCount > 0) {
            if (!legendAccumulator['nyc_business_improvement_districts']) {
              legendAccumulator['nyc_business_improvement_districts'] = {
                icon: '🏢',
                color: '#f59e0b',
                title: 'NYC Business Improvement Districts',
                count: 0,
              };
            }
            legendAccumulator['nyc_business_improvement_districts'].count += bidCount;
          }
        }
      } catch (error) {
        console.error('Error processing NYC Business Improvement Districts:', error);
      }

      // Draw NYC Community Districts as polygons on the map
      try {
        if (enrichments.nyc_community_districts_all && Array.isArray(enrichments.nyc_community_districts_all)) {
          let districtCount = 0;
          enrichments.nyc_community_districts_all.forEach((district: any) => {
            // Check if geometry is available (ESRI polygon geometry)
            if (district.geometry && district.geometry.rings && Array.isArray(district.geometry.rings)) {
              try {
                // Convert ESRI rings to Leaflet latlngs
                const rings = district.geometry.rings;
                const latlngs: [number, number][] = [];
                
                // Use the first ring (outer boundary)
                if (rings[0] && Array.isArray(rings[0])) {
                  for (const coord of rings[0]) {
                    if (Array.isArray(coord) && coord.length >= 2) {
                      // ESRI geometry might be in Web Mercator or WGS84
                      // Convert if needed
                      let lat: number;
                      let lon: number;
                      
                      if (Math.abs(coord[0]) > 180 || Math.abs(coord[1]) > 90) {
                        // Web Mercator to WGS84
                        lon = (coord[0] / 20037508.34) * 180;
                        let latRad = (coord[1] / 20037508.34) * 180;
                        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(latRad * Math.PI / 180)) - Math.PI / 2);
                      } else {
                        // Already WGS84
                        lon = coord[0];
                        lat = coord[1];
                      }
                      
                      latlngs.push([lat, lon]);
                    }
                  }
                }
                
                if (latlngs.length < 3) {
                  console.warn('NYC Community District polygon has less than 3 coordinates, skipping');
                  return;
                }
                
                const isContaining = district.isContaining;
                const color = isContaining ? '#3b82f6' : '#60a5fa'; // Blue for Community Districts
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;
                
                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });
                
                const boroCD = district.boroCD || district.BoroCD || district.BOROCD || district.districtId || 'Unknown';
                const distance = district.distance_miles !== null && district.distance_miles !== undefined ? district.distance_miles : 0;
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ${isContaining ? '🏘️ Containing Community District' : '🏘️ Nearby Community District'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${boroCD ? `<div><strong>Community District:</strong> ${boroCD}</div>` : ''}
                      ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this district</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all district attributes (excluding internal fields)
                const excludeFields = ['districtId', 'boroCD', 'BoroCD', 'BOROCD', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining', '__calculatedDistance'];
                Object.entries(district).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value) && key !== 'the_geom') {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                // Store metadata for tabbed popup
                (polygon as any).__layerType = 'nyc_community_districts';
                (polygon as any).__layerTitle = 'NYC Community Districts';
                (polygon as any).__popupContent = popupContent;
                polygon.addTo(primary);
                
                // Extend bounds to include polygon
                const polygonBounds = L.latLngBounds(latlngs);
                bounds.extend(polygonBounds);
                
                districtCount++;
              } catch (error) {
                console.error('Error drawing NYC Community District polygon:', error);
              }
            }
          });
          
          if (districtCount > 0) {
            if (!legendAccumulator['nyc_community_districts']) {
              legendAccumulator['nyc_community_districts'] = {
                icon: '🏘️',
                color: '#3b82f6',
                title: 'NYC Community Districts',
                count: 0,
              };
            }
            legendAccumulator['nyc_community_districts'].count += districtCount;
          }
        }
      } catch (error) {
        console.error('Error processing NYC Community Districts:', error);
      }

      // Draw Houston Neighborhoods as polygons on the map
      try {
        if (enrichments.houston_neighborhoods_all && Array.isArray(enrichments.houston_neighborhoods_all)) {
          let neighborhoodCount = 0;
          enrichments.houston_neighborhoods_all.forEach((neighborhood: any) => {
            // Check if geometry is available (ESRI polygon geometry)
            if (neighborhood.geometry && neighborhood.geometry.rings && Array.isArray(neighborhood.geometry.rings)) {
              try {
                // Convert ESRI rings to Leaflet latlngs
                const rings = neighborhood.geometry.rings;
                const latlngs: [number, number][] = [];
                
                // Use the first ring (outer boundary)
                if (rings[0] && Array.isArray(rings[0])) {
                  for (const coord of rings[0]) {
                    if (Array.isArray(coord) && coord.length >= 2) {
                      // ESRI geometry might be in Web Mercator or WGS84
                      // Convert if needed
                      let lat: number;
                      let lon: number;
                      
                      if (Math.abs(coord[0]) > 180 || Math.abs(coord[1]) > 90) {
                        // Web Mercator to WGS84
                        lon = (coord[0] / 20037508.34) * 180;
                        let latRad = (coord[1] / 20037508.34) * 180;
                        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(latRad * Math.PI / 180)) - Math.PI / 2);
                      } else {
                        // Already WGS84
                        lon = coord[0];
                        lat = coord[1];
                      }
                      
                      latlngs.push([lat, lon]);
                    }
                  }
                }
                
                if (latlngs.length < 3) {
                  console.warn('Houston Neighborhood polygon has less than 3 coordinates, skipping');
                  return;
                }
                
                const isContaining = neighborhood.isContaining;
                const color = isContaining ? '#10b981' : '#34d399'; // Green for neighborhoods
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;
                
                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });
                
                const nameLabel = neighborhood.nameLabel || neighborhood.NAME_LABEL || neighborhood.name_label || null;
                const nname = neighborhood.nname || neighborhood.NNAME || null;
                const name1 = neighborhood.name1 || neighborhood.NAME_1 || null;
                const name2 = neighborhood.name2 || neighborhood.NAME_2 || null;
                const codeNum = neighborhood.codeNum || neighborhood.CODE_NUM || neighborhood.code_num || null;
                const comment = neighborhood.comment || neighborhood.COMMENT || null;
                const distance = neighborhood.distance_miles !== null && neighborhood.distance_miles !== undefined ? neighborhood.distance_miles : 0;
                
                const displayName = nameLabel || nname || name1 || name2 || 'Unknown Neighborhood';
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ${isContaining ? '🏘️ Containing Neighborhood' : '🏘️ Nearby Neighborhood'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${displayName ? `<div><strong>Neighborhood:</strong> ${displayName}</div>` : ''}
                      ${nname ? `<div><strong>NNAME:</strong> ${nname}</div>` : ''}
                      ${codeNum !== null ? `<div><strong>Code Number:</strong> ${codeNum}</div>` : ''}
                      ${comment ? `<div><strong>Comment:</strong> ${comment}</div>` : ''}
                      ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this neighborhood</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all neighborhood attributes (excluding internal fields)
                const excludeFields = ['objectId', 'OBJECTID', 'objectid', 'nname', 'NNAME', 'nameLabel', 'NAME_LABEL', 'name_label', 'name1', 'NAME_1', 'name_1', 'name2', 'NAME_2', 'name_2', 'codeNum', 'CODE_NUM', 'code_num', 'comment', 'COMMENT', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining', '__calculatedDistance'];
                Object.entries(neighborhood).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value) && key !== 'the_geom') {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                // Store metadata for tabbed popup
                (polygon as any).__layerType = 'houston_neighborhoods';
                (polygon as any).__layerTitle = 'Houston Neighborhoods';
                (polygon as any).__popupContent = popupContent;
                polygon.addTo(primary);
                
                // Extend bounds to include polygon
                const polygonBounds = L.latLngBounds(latlngs);
                bounds.extend(polygonBounds);
                
                neighborhoodCount++;
              } catch (error) {
                console.error('Error drawing Houston Neighborhood polygon:', error);
              }
            }
          });
          
          if (neighborhoodCount > 0) {
            if (!legendAccumulator['houston_neighborhoods']) {
              legendAccumulator['houston_neighborhoods'] = {
                icon: '🏘️',
                color: '#10b981',
                title: 'Houston Neighborhoods',
                count: 0,
              };
            }
            legendAccumulator['houston_neighborhoods'].count += neighborhoodCount;
          }
        }
      } catch (error) {
        console.error('Error processing Houston Neighborhoods:', error);
      }

      // Draw Houston Neighborhoods 2021 as polygons on the map
      try {
        if (enrichments.houston_neighborhoods_2021_all && Array.isArray(enrichments.houston_neighborhoods_2021_all)) {
          let neighborhoodCount = 0;
          enrichments.houston_neighborhoods_2021_all.forEach((neighborhood: any) => {
            // Check if geometry is available (ESRI polygon geometry)
            if (neighborhood.geometry && neighborhood.geometry.rings && Array.isArray(neighborhood.geometry.rings)) {
              try {
                // Convert ESRI rings to Leaflet latlngs
                const rings = neighborhood.geometry.rings;
                const latlngs: [number, number][] = [];
                
                // Use the first ring (outer boundary)
                if (rings[0] && Array.isArray(rings[0])) {
                  for (const coord of rings[0]) {
                    if (Array.isArray(coord) && coord.length >= 2) {
                      // ESRI geometry might be in Web Mercator or WGS84
                      // Convert if needed
                      let lat: number;
                      let lon: number;
                      
                      if (Math.abs(coord[0]) > 180 || Math.abs(coord[1]) > 90) {
                        // Web Mercator to WGS84
                        lon = (coord[0] / 20037508.34) * 180;
                        let latRad = (coord[1] / 20037508.34) * 180;
                        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(latRad * Math.PI / 180)) - Math.PI / 2);
                      } else {
                        // Already WGS84
                        lon = coord[0];
                        lat = coord[1];
                      }
                      
                      latlngs.push([lat, lon]);
                    }
                  }
                }
                
                if (latlngs.length < 3) {
                  console.warn('Houston Neighborhood 2021 polygon has less than 3 coordinates, skipping');
                  return;
                }
                
                const isContaining = neighborhood.isContaining;
                const color = isContaining ? '#10b981' : '#34d399'; // Green for neighborhoods
                const weight = isContaining ? 3 : 2;
                const opacity = isContaining ? 0.8 : 0.5;
                
                const polygon = L.polygon(latlngs, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  fillColor: color,
                  fillOpacity: 0.2
                });
                
                const objName = neighborhood.objName || neighborhood.OBJ_NAME || null;
                const objTyp = neighborhood.objTyp || neighborhood.OBJ_TYP || null;
                const objSubtcd = neighborhood.objSubtcd || neighborhood.OBJ_SUBTCD || null;
                const objSubtyp = neighborhood.objSubtyp || neighborhood.OBJ_SUBTYP || null;
                const metro = neighborhood.metro || neighborhood.METRO || null;
                const reldate = neighborhood.reldate || neighborhood.RELDATE || null;
                const objArea = neighborhood.objArea || neighborhood.OBJ_AREA || null;
                const distance = neighborhood.distance_miles !== null && neighborhood.distance_miles !== undefined ? neighborhood.distance_miles : 0;
                
                const displayName = objName || objTyp || 'Unknown Neighborhood';
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ${isContaining ? '🏘️ Containing Neighborhood' : '🏘️ Nearby Neighborhood'}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${displayName ? `<div><strong>Neighborhood:</strong> ${displayName}</div>` : ''}
                      ${objTyp ? `<div><strong>Type:</strong> ${objTyp}</div>` : ''}
                      ${objSubtcd ? `<div><strong>Sub Type Code:</strong> ${objSubtcd}</div>` : ''}
                      ${objSubtyp ? `<div><strong>Sub Type:</strong> ${objSubtyp}</div>` : ''}
                      ${metro ? `<div><strong>Metro:</strong> ${metro}</div>` : ''}
                      ${reldate ? `<div><strong>Release Date:</strong> ${reldate}</div>` : ''}
                      ${objArea !== null ? `<div><strong>Area:</strong> ${objArea.toLocaleString()}</div>` : ''}
                      ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this neighborhood</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all neighborhood attributes (excluding internal fields)
                const excludeFields = ['objectId', 'OBJECTID', 'objectid', 'FID', 'fid', 'objName', 'OBJ_NAME', 'objTyp', 'OBJ_TYP', 'objSubtcd', 'OBJ_SUBTCD', 'objSubtyp', 'OBJ_SUBTYP', 'country', 'COUNTRY', 'metro', 'METRO', 'lat', 'LAT', 'lon', 'LON', 'reldate', 'RELDATE', 'objArea', 'OBJ_AREA', 'geometry', 'distance_miles', 'GlobalID', 'GLOBALID', 'isContaining', '__calculatedDistance'];
                Object.entries(neighborhood).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value) && key !== 'the_geom') {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                polygon.bindPopup(popupContent, { maxWidth: 400 });
                // Store metadata for tabbed popup
                (polygon as any).__layerType = 'houston_neighborhoods_2021';
                (polygon as any).__layerTitle = 'Houston Neighborhoods';
                (polygon as any).__popupContent = popupContent;
                polygon.addTo(primary);
                
                // Extend bounds to include polygon
                const polygonBounds = L.latLngBounds(latlngs);
                bounds.extend(polygonBounds);
                
                neighborhoodCount++;
              } catch (error) {
                console.error('Error drawing Houston Neighborhood 2021 polygon:', error);
              }
            }
          });
          
          if (neighborhoodCount > 0) {
            if (!legendAccumulator['houston_neighborhoods_2021']) {
              legendAccumulator['houston_neighborhoods_2021'] = {
                icon: '🏘️',
                color: '#10b981',
                title: 'Houston Neighborhoods',
                count: 0,
              };
            }
            legendAccumulator['houston_neighborhoods_2021'].count += neighborhoodCount;
          }
        }
      } catch (error) {
        console.error('Error processing Houston Neighborhoods 2021:', error);
      }

      // Draw LA County Historic Cultural Monuments as polygons on the map
      try {
        if (enrichments.la_county_historic_cultural_monuments_all && Array.isArray(enrichments.la_county_historic_cultural_monuments_all)) {
          let monumentCount = 0;
          enrichments.la_county_historic_cultural_monuments_all.forEach((monument: any) => {
            if (monument.geometry && monument.geometry.rings) {
              try {
                const rings = monument.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('LA County Historic Cultural Monument polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = monument.isContaining;
                  const color = isContaining ? '#a855f7' : '#c084fc'; // Purple for monuments
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const name = monument.name || monument.NAME || monument.Name || 'Unknown Monument';
                  const monumentId = monument.monumentId || monument.OBJECTID || monument.objectid || null;
                  const histType = monument.histType || monument.HIST_TYPE || monument.hist_type || null;
                  const mntType = monument.mntType || monument.MNT_TYPE || monument.mnt_type || null;
                  const mntNum = monument.mntNum || monument.MNT_NUM || monument.mnt_num || null;
                  const location = monument.location || monument.LOCATION || monument.Location || null;
                  const dateActive = monument.dateActive || monument.DATE_ACTIVE || monument.date_active || null;
                  const notes = monument.notes || monument.NOTES || monument.Notes || null;
                  const shapeArea = monument.shapeArea || monument.Shape__Area || monument.shape_area || null;
                  const distance = monument.distance_miles !== null && monument.distance_miles !== undefined ? monument.distance_miles : 0;
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🏛️ Historic Cultural Monument
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${name ? `<div><strong>Name:</strong> ${name}</div>` : ''}
                        ${monumentId ? `<div><strong>Monument ID:</strong> ${monumentId}</div>` : ''}
                        ${mntNum ? `<div><strong>Monument Number:</strong> ${mntNum}</div>` : ''}
                        ${histType ? `<div><strong>Historic Type:</strong> ${histType}</div>` : ''}
                        ${mntType ? `<div><strong>Monument Type:</strong> ${mntType}</div>` : ''}
                        ${location ? `<div><strong>Location:</strong> ${location}</div>` : ''}
                        ${dateActive ? `<div><strong>Date Active:</strong> ${dateActive}</div>` : ''}
                        ${notes ? `<div><strong>Notes:</strong> ${notes}</div>` : ''}
                        ${shapeArea !== null && shapeArea !== undefined ? `<div><strong>Area:</strong> ${shapeArea.toFixed(2)} sq units</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this monument</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all monument attributes (excluding internal fields)
                  const excludeFields = ['monumentId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'name', 'NAME', 'Name', 'histType', 'HIST_TYPE', 'hist_type', 'mntType', 'MNT_TYPE', 'mnt_type', 'mntNum', 'MNT_NUM', 'mnt_num', 'location', 'LOCATION', 'Location', 'dateActive', 'DATE_ACTIVE', 'date_active', 'notes', 'NOTES', 'Notes', 'shapeArea', 'Shape__Area', 'shape_area', 'shapeLength', 'Shape__Length', 'shape_length', 'isContaining'];
                  Object.entries(monument).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds);
                  
                  monumentCount++;
                }
              } catch (error) {
                console.error('Error drawing LA County Historic Cultural Monument polygon:', error);
              }
            }
          });
          
          if (monumentCount > 0) {
            if (!legendAccumulator['la_county_historic_cultural_monuments']) {
              legendAccumulator['la_county_historic_cultural_monuments'] = {
                icon: '🏛️',
                color: '#a855f7',
                title: 'LA County Historic Cultural Monuments',
                count: 0,
              };
            }
            legendAccumulator['la_county_historic_cultural_monuments'].count += monumentCount;
          }
        }
      } catch (error) {
        console.error('Error processing LA County Historic Cultural Monuments:', error);
      }

      // Draw LA County Housing with Potential Lead Risk as polygons on the map
      try {
        if (enrichments.la_county_housing_lead_risk_all && Array.isArray(enrichments.la_county_housing_lead_risk_all)) {
          let housingAreaCount = 0;
          enrichments.la_county_housing_lead_risk_all.forEach((area: any) => {
            if (area.geometry && area.geometry.rings) {
              try {
                const rings = area.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('LA County Housing Lead Risk polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = area.isContaining;
                  const color = isContaining ? '#dc2626' : '#ef4444'; // Red for lead risk
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const ct20 = area.ct20 || area.CT20 || area.Ct20 || null;
                  const housingRisk = area.housingRisk !== null && area.housingRisk !== undefined 
                                     ? parseFloat(area.housingRisk.toString())
                                     : (area.housing_risk !== null && area.housing_risk !== undefined
                                        ? parseFloat(area.housing_risk.toString())
                                        : null);
                  const laCity = area.laCity || area.la_city || area.LA_CITY || area.LaCity || null;
                  const housingId = area.housingId || area.OBJECTID || area.objectid || null;
                  const shapeArea = area.shapeArea || area.Shape__Area || area.shape_area || null;
                  const distance = area.distance_miles !== null && area.distance_miles !== undefined ? area.distance_miles : 0;
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🏠 Housing with Potential Lead Risk
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${ct20 ? `<div><strong>Census Tract (2020):</strong> ${ct20}</div>` : ''}
                        ${housingRisk !== null && housingRisk !== undefined ? `<div><strong>Housing Risk:</strong> ${housingRisk.toFixed(1)}%</div>` : ''}
                        ${laCity ? `<div><strong>LA City:</strong> ${laCity}</div>` : ''}
                        ${housingId ? `<div><strong>Area ID:</strong> ${housingId}</div>` : ''}
                        ${shapeArea !== null && shapeArea !== undefined ? `<div><strong>Area:</strong> ${shapeArea.toFixed(2)} sq units</div>` : ''}
                        ${isContaining ? `<div style="color: #dc2626; font-weight: 600; margin-top: 8px;">⚠️ Location is within this lead risk area</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all area attributes (excluding internal fields)
                  const excludeFields = ['housingId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'ct20', 'CT20', 'Ct20', 'housingRisk', 'housing_risk', 'HousingRisk', 'laCity', 'la_city', 'LA_CITY', 'LaCity', 'shapeArea', 'Shape__Area', 'shape_area', 'shapeLength', 'Shape__Length', 'shape_length', 'isContaining'];
                  Object.entries(area).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds);
                  
                  housingAreaCount++;
                }
              } catch (error) {
                console.error('Error drawing LA County Housing Lead Risk polygon:', error);
              }
            }
          });
          
          if (housingAreaCount > 0) {
            if (!legendAccumulator['la_county_housing_lead_risk']) {
              legendAccumulator['la_county_housing_lead_risk'] = {
                icon: '🏠',
                color: '#dc2626',
                title: 'LA County Housing with Potential Lead Risk',
                count: 0,
              };
            }
            legendAccumulator['la_county_housing_lead_risk'].count += housingAreaCount;
          }
        }
      } catch (error) {
        console.error('Error processing LA County Housing with Potential Lead Risk:', error);
      }

      // Draw LA County School District Boundaries as polygons on the map
      try {
        if (enrichments.la_county_school_district_boundaries_all && Array.isArray(enrichments.la_county_school_district_boundaries_all)) {
          let districtCount = 0;
          enrichments.la_county_school_district_boundaries_all.forEach((district: any) => {
            if (district.geometry && district.geometry.rings) {
              try {
                const rings = district.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });
                  
                  if (latlngs.length < 3) {
                    console.warn('LA County School District Boundary polygon has less than 3 coordinates, skipping');
                    return;
                  }
                  
                  const isContaining = district.isContaining;
                  const color = isContaining ? '#3b82f6' : '#60a5fa'; // Blue for school districts
                  const weight = isContaining ? 3 : 2;
                  const opacity = isContaining ? 0.8 : 0.5;
                  
                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    fillColor: color,
                    fillOpacity: 0.2
                  });
                  
                  const districtName = district.districtName || district.LABEL || district.label || district.Label || null;
                  const districtCode = district.districtCode || district.ABBR || district.abbr || district.Abbr || null;
                  const districtType = district.districtType || district.DISTRICT_TYPE || district.district_type || district.DistrictType || null;
                  const districtId = district.districtId || district.OBJECTID || district.objectid || null;
                  const shapeArea = district.shapeArea || district.Shape__Area || district.shape_area || null;
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🏫 School District Boundary
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${districtName ? `<div><strong>District Name:</strong> ${districtName}</div>` : ''}
                        ${districtCode ? `<div><strong>District Code:</strong> ${districtCode}</div>` : ''}
                        ${districtType ? `<div><strong>District Type:</strong> ${districtType}</div>` : ''}
                        ${districtId ? `<div><strong>District ID:</strong> ${districtId}</div>` : ''}
                        ${shapeArea !== null && shapeArea !== undefined ? `<div><strong>Area:</strong> ${shapeArea.toFixed(2)} sq units</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this school district</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  // Add all district attributes (excluding internal fields)
                  const excludeFields = ['districtId', 'OBJECTID', 'objectid', 'geometry', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'districtName', 'LABEL', 'label', 'Label', 'districtCode', 'ABBR', 'abbr', 'Abbr', 'districtType', 'DISTRICT_TYPE', 'district_type', 'DistrictType', 'shapeArea', 'Shape__Area', 'shape_area', 'shapeLength', 'Shape__Length', 'shape_length', 'isContaining'];
                  Object.entries(district).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  
                  // Extend bounds to include polygon
                  const polygonBounds = L.latLngBounds(latlngs);
                  bounds.extend(polygonBounds);
                  
                  districtCount++;
                }
              } catch (error) {
                console.error('Error drawing LA County School District Boundary polygon:', error);
              }
            }
          });
          
          if (districtCount > 0) {
            if (!legendAccumulator['la_county_school_district_boundaries']) {
              legendAccumulator['la_county_school_district_boundaries'] = {
                icon: '🏫',
                color: '#3b82f6',
                title: 'LA County School District Boundaries',
                count: 0,
              };
            }
            legendAccumulator['la_county_school_district_boundaries'].count += districtCount;
          }
        }
      } catch (error) {
        console.error('Error processing LA County School District Boundaries:', error);
      }

      // Draw LA County Street Inventory as polylines on the map
      try {
        if (enrichments.la_county_street_inventory_all && Array.isArray(enrichments.la_county_street_inventory_all)) {
          let streetCount = 0;
          enrichments.la_county_street_inventory_all.forEach((street: any) => {
            if (street.geometry && street.geometry.paths) {
              try {
                // Convert ESRI polyline paths to Leaflet LatLng arrays
                const paths = street.geometry.paths;
                if (paths && paths.length > 0) {
                  streetCount++;
                  // For each path in the polyline, create a separate polyline
                  paths.forEach((path: number[][]) => {
                    const latlngs = path.map((coord: number[]) => {
                      // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                      // Since we requested outSR=4326, coordinates should already be in WGS84
                      // Convert [lon, lat] to [lat, lon] for Leaflet
                      return [coord[1], coord[0]] as [number, number];
                    });

                    const streetName = street.streetName || street.ST_NAME || street.st_name || street.Name || street.NAME || 'Unknown Street';
                    const streetDir = street.streetDir || street.ST_DIR || street.st_dir || street.Dir || street.DIR || null;
                    const streetType = street.streetType || street.ST_TYPE || street.st_type || street.Type || street.TYPE || null;
                    const streetFrom = street.streetFrom || street.ST_FROM || street.st_from || street.From || street.FROM || null;
                    const streetTo = street.streetTo || street.ST_TO || street.st_to || street.To || street.TO || null;
                    const streetSurface = street.streetSurface || street.ST_SURFACE || street.st_surface || street.Surface || street.SURFACE || null;
                    const pciStatus = street.pciStatus || street.PCI_STATUS || street.pci_status || street.PciStatus || street.Status || street.STATUS || null;
                    const ncName = street.ncName || street.NC_NAME || street.nc_name || street.NcName || street.NCNAME || null;
                    const sectId = street.sectId || street.SECT_ID || street.sect_id || null;
                    const streetLength = street.streetLength || street.ST_LENGTH || street.st_length || null;
                    const streetWidth = street.streetWidth || street.ST_WIDTH || street.st_width || null;
                    const shapeLength = street.shapeLength || street.Shape__Length || street.shape_length || null;
                    const streetId = street.streetId || street.OBJECTID || street.objectid || null;
                    const distance = street.distance_miles !== null && street.distance_miles !== undefined ? street.distance_miles : 0;

                    // Build full street name
                    const fullStreetName = [streetDir, streetName, streetType].filter(Boolean).join(' ').trim() || streetName;

                    // Create polyline with yellow color for street inventory
                    const polyline = L.polyline(latlngs, {
                      color: '#fbbf24', // Yellow color for streets (better visibility on imagery basemap)
                      weight: 3,
                      opacity: 0.7,
                      smoothFactor: 1
                    });

                    // Build popup content with all street attributes
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          🛣️ ${fullStreetName}
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${streetFrom && streetTo ? `<div><strong>From:</strong> ${streetFrom} <strong>To:</strong> ${streetTo}</div>` : ''}
                          ${streetSurface ? `<div><strong>Surface:</strong> ${streetSurface}</div>` : ''}
                          ${pciStatus ? `<div><strong>PCI Status:</strong> ${pciStatus}</div>` : ''}
                          ${ncName ? `<div><strong>Neighborhood:</strong> ${ncName}</div>` : ''}
                          ${sectId ? `<div><strong>Section ID:</strong> ${sectId}</div>` : ''}
                          ${streetLength !== null && streetLength !== undefined ? `<div><strong>Length:</strong> ${streetLength} ft</div>` : ''}
                          ${streetWidth !== null && streetWidth !== undefined ? `<div><strong>Width:</strong> ${streetWidth} ft</div>` : ''}
                          ${shapeLength !== null && shapeLength !== undefined ? `<div><strong>Shape Length:</strong> ${shapeLength.toFixed(2)} meters</div>` : ''}
                          ${streetId ? `<div><strong>Street ID:</strong> ${streetId}</div>` : ''}
                          ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    // Add all street attributes (excluding internal fields)
                    const excludeFields = ['streetId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'sectId', 'SECT_ID', 'sect_id', 'streetName', 'ST_NAME', 'st_name', 'Name', 'NAME', 'streetDir', 'ST_DIR', 'st_dir', 'Dir', 'DIR', 'streetType', 'ST_TYPE', 'st_type', 'Type', 'TYPE', 'streetFrom', 'ST_FROM', 'st_from', 'From', 'FROM', 'streetTo', 'ST_TO', 'st_to', 'To', 'TO', 'streetSurface', 'ST_SURFACE', 'st_surface', 'Surface', 'SURFACE', 'streetLength', 'ST_LENGTH', 'st_length', 'streetWidth', 'ST_WIDTH', 'st_width', 'pciStatus', 'PCI_STATUS', 'pci_status', 'PciStatus', 'Status', 'STATUS', 'ncName', 'NC_NAME', 'nc_name', 'NcName', 'NCNAME', 'ncname', 'shapeLength', 'Shape__Length', 'shape_length'];
                    Object.entries(street).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polyline.bindPopup(popupContent);
                    polyline.addTo(primary);
                    
                    // Extend bounds to include polyline
                    const polylineBounds = L.latLngBounds(latlngs);
                    bounds.extend(polylineBounds);
                  });
                }
              } catch (error) {
                console.error('Error drawing LA County Street Inventory polyline:', error);
              }
            }
          });
          
          if (streetCount > 0) {
            if (!legendAccumulator['la_county_street_inventory']) {
              legendAccumulator['la_county_street_inventory'] = {
                icon: '🛣️',
                color: '#fbbf24',
                title: 'LA County Street Inventory',
                count: 0,
              };
            }
            legendAccumulator['la_county_street_inventory'].count += streetCount;
          }
        }
      } catch (error) {
        console.error('Error processing LA County Street Inventory:', error);
      }

      // Draw LA County Hazards layers
      const laCountyHazardsLayers = [
        { key: 'la_county_fire_hazards_all', layerId: 0, icon: '🔥', color: '#dc2626', title: 'LA County Fire Hazards', isPoint: true },
        { key: 'la_county_fire_hazard_responsibility_areas_all', layerId: 1, icon: '🔥', color: '#ef4444', title: 'LA County Fire Hazard Responsibility Areas', isPoint: false },
        { key: 'la_county_fire_hazard_severity_zones_all', layerId: 2, icon: '🔥', color: '#f97316', title: 'LA County Fire Hazard Severity Zones', isPoint: false },
        { key: 'la_county_fire_hazard_severity_zones_lra_all', layerId: 18, icon: '🔥', color: '#f97316', title: 'LA County Fire Hazard Severity Zones LRA', isPoint: false },
        { key: 'la_county_fire_hazard_severity_zones_sra_all', layerId: 19, icon: '🔥', color: '#f97316', title: 'LA County Fire Hazard Severity Zones SRA', isPoint: false },
        { key: 'la_county_earthquake_hazards_all', layerId: 3, icon: '🌍', color: '#7c2d12', title: 'LA County Earthquake Hazards', isPoint: true },
        { key: 'la_county_alquist_priolo_fault_traces_all', layerId: 4, icon: '⚡', color: '#991b1b', title: 'LA County Alquist-Priolo Fault Traces', isPoint: false, isLine: true },
        { key: 'la_county_alquist_priolo_fault_zones_all', layerId: 5, icon: '⚡', color: '#b91c1c', title: 'LA County Alquist-Priolo Fault Zones', isPoint: false },
        { key: 'la_county_usgs_faults_all', layerId: 17, icon: '⚡', color: '#dc2626', title: 'LA County USGS Faults', isPoint: false, isLine: true },
        { key: 'la_county_tsunami_inundation_runup_line_all', layerId: 6, icon: '🌊', color: '#0ea5e9', title: 'LA County Tsunami Inundation Runup Line', isPoint: false, isLine: true },
        { key: 'la_county_tsunami_inundation_zones_all', layerId: 7, icon: '🌊', color: '#0284c7', title: 'LA County Tsunami Inundation Zones', isPoint: false },
        { key: 'la_county_landslide_zones_all', layerId: 8, icon: '⛰️', color: '#a16207', title: 'LA County Landslide Zones', isPoint: false },
        { key: 'la_county_liquefaction_zones_all', layerId: 9, icon: '🌋', color: '#ca8a04', title: 'LA County Liquefaction Zones', isPoint: false },
        { key: 'la_county_flood_hazards_all', layerId: 10, icon: '💧', color: '#0ea5e9', title: 'LA County Flood Hazards', isPoint: true },
        { key: 'la_county_100_year_flood_plain_all', layerId: 11, icon: '💧', color: '#0284c7', title: 'LA County 100-Year Flood Plain', isPoint: false },
        { key: 'la_county_500_year_flood_plain_all', layerId: 12, icon: '💧', color: '#0369a1', title: 'LA County 500-Year Flood Plain', isPoint: false },
        { key: 'la_county_dam_inundation_eta_all', layerId: 13, icon: '🏗️', color: '#1e40af', title: 'LA County Dam Inundation ETA', isPoint: false, isLine: true },
        { key: 'la_county_dam_inundation_areas_all', layerId: 14, icon: '🏗️', color: '#1e3a8a', title: 'LA County Dam Inundation Areas', isPoint: false }
      ];

      laCountyHazardsLayers.forEach(({ key, icon, color, title, isPoint, isLine }) => {
        try {
          if (enrichments[key] && Array.isArray(enrichments[key])) {
            let featureCount = 0;
            enrichments[key].forEach((hazard: any) => {
              try {
                const geometry = hazard.geometry;
                const isContaining = hazard.isContaining;
                const distance = hazard.distance_miles !== null && hazard.distance_miles !== undefined ? hazard.distance_miles : 0;
                const hazardId = hazard.hazardId || hazard.OBJECTID || hazard.objectid || 'Unknown';
                
                // Check for point geometry (either from geometry.x/y or from attributes)
                const pointLat = isPoint ? (geometry?.y || geometry?.latitude || hazard.latitude || hazard.LATITUDE || hazard.lat || hazard.LAT) : null;
                const pointLon = isPoint ? (geometry?.x || geometry?.longitude || hazard.longitude || hazard.LONGITUDE || hazard.lon || hazard.LON) : null;
                
                if (isPoint && pointLat !== null && pointLat !== undefined && pointLon !== null && pointLon !== undefined) {
                  // Point geometry
                  const lat = pointLat;
                  const lon = pointLon;
                  
                  const marker = L.marker([lat, lon], {
                    icon: createPOIIcon(icon, color)
                  });
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ${icon} ${title}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${hazardId ? `<div><strong>Hazard ID:</strong> ${hazardId}</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['hazardId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                  Object.entries(hazard).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  marker.bindPopup(popupContent);
                  marker.addTo(primary);
                  bounds.extend([lat, lon]);
                  featureCount++;
                } else if (isLine && geometry && geometry.paths) {
                  // Polyline geometry
                  const paths = geometry.paths;
                  if (paths && paths.length > 0) {
                    paths.forEach((path: number[][]) => {
                      const latlngs = path.map((coord: number[]) => {
                        return [coord[1], coord[0]] as [number, number];
                      });
                      
                      const polyline = L.polyline(latlngs, {
                        color: color,
                        weight: 3,
                        opacity: 0.8,
                        smoothFactor: 1
                      });
                      
                      let popupContent = `
                        <div style="min-width: 250px; max-width: 400px;">
                          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                            ${icon} ${title}
                          </h3>
                          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                            ${hazardId ? `<div><strong>Hazard ID:</strong> ${hazardId}</div>` : ''}
                            ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                          </div>
                          <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                      `;
                      
                      const excludeFields = ['hazardId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                      Object.entries(hazard).forEach(([key, value]) => {
                        if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                          if (typeof value === 'object' && !Array.isArray(value)) {
                            return;
                          }
                          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                          popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                        }
                      });
                      
                      popupContent += `
                          </div>
                        </div>
                      `;
                      
                      polyline.bindPopup(popupContent);
                      polyline.addTo(primary);
                      const polylineBounds = L.latLngBounds(latlngs);
                      bounds.extend(polylineBounds);
                    });
                    featureCount++;
                  }
                } else if (!isPoint && geometry && geometry.rings) {
                  // Polygon geometry
                  const rings = geometry.rings;
                  if (rings && rings.length > 0) {
                    const outerRing = rings[0];
                    const latlngs = outerRing.map((coord: number[]) => {
                      return [coord[1], coord[0]] as [number, number];
                    });
                    
                    if (latlngs.length < 3) {
                      console.warn(`${title} polygon has less than 3 coordinates, skipping`);
                      return;
                    }
                    
                    const polygonColor = isContaining ? color : color.replace('ff', 'cc'); // Lighter if not containing
                    const weight = isContaining ? 3 : 2;
                    const opacity = isContaining ? 0.8 : 0.5;
                    
                    const polygon = L.polygon(latlngs, {
                      color: polygonColor,
                      weight: weight,
                      opacity: opacity,
                      fillColor: color,
                      fillOpacity: 0.2
                    });
                    
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          ${icon} ${title}
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${hazardId ? `<div><strong>Hazard ID:</strong> ${hazardId}</div>` : ''}
                          ${isContaining ? `<div style="color: #dc2626; font-weight: 600; margin-top: 8px;">⚠️ Location is within this hazard area</div>` : ''}
                          ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    const excludeFields = ['hazardId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                    Object.entries(hazard).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polygon.bindPopup(popupContent);
                    polygon.addTo(primary);
                    const polygonBounds = L.latLngBounds(latlngs);
                    bounds.extend(polygonBounds);
                    featureCount++;
                  }
                }
              } catch (error) {
                console.error(`Error drawing ${title} feature:`, error);
              }
            });
            
            if (featureCount > 0) {
              const legendKey = key.replace('_all', '');
              if (!legendAccumulator[legendKey]) {
                legendAccumulator[legendKey] = {
                  icon: icon,
                  color: color,
                  title: title,
                  count: 0,
                };
              }
              legendAccumulator[legendKey].count += featureCount;
            }
          }
        } catch (error) {
          console.error(`Error processing ${title}:`, error);
        }
      });

      // Draw LA County Basemaps and Grids layers
      const laCountyBasemapsGridsLayers = [
        { key: 'la_county_us_national_grid_all', layerId: 0, icon: '🗺️', color: '#6366f1', title: 'LA County US National Grid' },
        { key: 'la_county_usng_100k_all', layerId: 1, icon: '🗺️', color: '#818cf8', title: 'LA County USNG 100K' },
        { key: 'la_county_usng_10000m_all', layerId: 2, icon: '🗺️', color: '#a78bfa', title: 'LA County USNG 10000M' },
        { key: 'la_county_usng_1000m_all', layerId: 3, icon: '🗺️', color: '#c084fc', title: 'LA County USNG 1000M' },
        { key: 'la_county_usng_100m_all', layerId: 4, icon: '🗺️', color: '#d8b4fe', title: 'LA County USNG 100M' },
        { key: 'la_county_township_range_section_rancho_boundaries_all', layerId: 8, icon: '📐', color: '#4b5563', title: 'LA County Township Range Section Rancho Boundaries' }
      ];

      laCountyBasemapsGridsLayers.forEach(({ key, icon, color, title }) => {
        try {
          if (enrichments[key] && Array.isArray(enrichments[key])) {
            let featureCount = 0;
            enrichments[key].forEach((grid: any) => {
              if (grid.geometry && grid.geometry.rings) {
                try {
                  const rings = grid.geometry.rings;
                  if (rings && rings.length > 0) {
                    const outerRing = rings[0];
                    const latlngs = outerRing.map((coord: number[]) => {
                      return [coord[1], coord[0]] as [number, number];
                    });
                    
                    if (latlngs.length < 3) {
                      console.warn(`${title} polygon has less than 3 coordinates, skipping`);
                      return;
                    }
                    
                    const isContaining = grid.isContaining;
                    const polygonColor = isContaining ? color : color.replace('ff', 'cc');
                    const weight = isContaining ? 3 : 2;
                    const opacity = isContaining ? 0.8 : 0.5;
                    
                    const polygon = L.polygon(latlngs, {
                      color: polygonColor,
                      weight: weight,
                      opacity: opacity,
                      fillColor: color,
                      fillOpacity: 0.15
                    });
                    
                    const gridId = grid.gridId || grid.OBJECTID || grid.objectid || 'Unknown';
                    
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          ${icon} ${title}
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${gridId ? `<div><strong>Grid ID:</strong> ${gridId}</div>` : ''}
                          ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this grid/boundary</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    const excludeFields = ['gridId', 'OBJECTID', 'objectid', 'geometry', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                    Object.entries(grid).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polygon.bindPopup(popupContent);
                    polygon.addTo(primary);
                    const polygonBounds = L.latLngBounds(latlngs);
                    bounds.extend(polygonBounds);
                    featureCount++;
                  }
                } catch (error) {
                  console.error(`Error drawing ${title} polygon:`, error);
                }
              }
            });
            
            if (featureCount > 0) {
              const legendKey = key.replace('_all', '');
              if (!legendAccumulator[legendKey]) {
                legendAccumulator[legendKey] = {
                  icon: icon,
                  color: color,
                  title: title,
                  count: 0,
                };
              }
              legendAccumulator[legendKey].count += featureCount;
            }
          }
        } catch (error) {
          console.error(`Error processing ${title}:`, error);
        }
      });

      // Draw LA County Hydrology layers
      const laCountyHydrologyLayers = [
        { key: 'la_county_hydrology_complete_all', layerId: 0, icon: '💧', color: '#0ea5e9', title: 'LA County Hydrology (Complete)', isPoint: false },
        { key: 'la_county_hydrology_lakes_all', layerId: 2, icon: '🏞️', color: '#0284c7', title: 'LA County Lakes', isPoint: false },
        { key: 'la_county_hydrology_streams_rivers_all', layerId: 3, icon: '🌊', color: '#0369a1', title: 'LA County Streams and Rivers', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_watershed_boundaries_all', layerId: 4, icon: '🗺️', color: '#075985', title: 'LA County Watershed Boundaries', isPoint: false },
        { key: 'la_county_hydrology_wbd_hu12_all', layerId: 5, icon: '🗺️', color: '#0c4a6e', title: 'LA County WBD HU12', isPoint: false },
        { key: 'la_county_hydrology_wbd_hu10_all', layerId: 6, icon: '🗺️', color: '#082f49', title: 'LA County WBD HU10', isPoint: false },
        { key: 'la_county_hydrology_wbd_hu8_all', layerId: 7, icon: '🗺️', color: '#164e63', title: 'LA County WBD HU8', isPoint: false },
        { key: 'la_county_hydrology_simpler_all', layerId: 8, icon: '💧', color: '#0891b2', title: 'LA County Hydrology (Simpler)', isPoint: false },
        { key: 'la_county_hydrology_lakes_simpler_all', layerId: 9, icon: '🏞️', color: '#0e7490', title: 'LA County Lakes (Simpler)', isPoint: false },
        { key: 'la_county_hydrology_nhd_streams_all', layerId: 10, icon: '🌊', color: '#155e75', title: 'LA County NHD Streams', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_storm_drain_network_all', layerId: 11, icon: '🌧️', color: '#164e63', title: 'LA County Storm Drain Network', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_inlets_outlets_all', layerId: 12, icon: '🚰', color: '#1e40af', title: 'LA County Inlets/Outlets', isPoint: true },
        { key: 'la_county_hydrology_maintenance_holes_all', layerId: 13, icon: '🕳️', color: '#1e3a8a', title: 'LA County Maintenance Holes', isPoint: true },
        { key: 'la_county_hydrology_maintenance_holes_lacfcd_all', layerId: 14, icon: '🕳️', color: '#1e3a8a', title: 'LA County Maintenance Holes (LACFCD)', isPoint: true },
        { key: 'la_county_hydrology_maintenance_holes_city_all', layerId: 15, icon: '🕳️', color: '#1e3a8a', title: 'LA County Maintenance Holes (City)', isPoint: true },
        { key: 'la_county_hydrology_maintenance_holes_unknown_all', layerId: 16, icon: '🕳️', color: '#1e3a8a', title: 'LA County Maintenance Holes (Unknown)', isPoint: true },
        { key: 'la_county_hydrology_basins_all', layerId: 17, icon: '🏗️', color: '#2563eb', title: 'LA County Basins', isPoint: false },
        { key: 'la_county_hydrology_debris_basins_lacfcd_all', layerId: 18, icon: '🏗️', color: '#2563eb', title: 'LA County Debris Basins (LACFCD)', isPoint: false },
        { key: 'la_county_hydrology_debris_basins_city_all', layerId: 19, icon: '🏗️', color: '#2563eb', title: 'LA County Debris Basins (City)', isPoint: false },
        { key: 'la_county_hydrology_debris_basins_caltrans_all', layerId: 20, icon: '🏗️', color: '#2563eb', title: 'LA County Debris Basins (Caltrans)', isPoint: false },
        { key: 'la_county_hydrology_debris_basins_unknown_all', layerId: 21, icon: '🏗️', color: '#2563eb', title: 'LA County Debris Basins (Unknown)', isPoint: false },
        { key: 'la_county_hydrology_catch_basins_all', layerId: 22, icon: '🏗️', color: '#3b82f6', title: 'LA County Catch Basins', isPoint: false },
        { key: 'la_county_hydrology_catch_basins_lacfcd_all', layerId: 23, icon: '🏗️', color: '#3b82f6', title: 'LA County Catch Basins (LACFCD)', isPoint: false },
        { key: 'la_county_hydrology_catch_basins_city_all', layerId: 24, icon: '🏗️', color: '#3b82f6', title: 'LA County Catch Basins (City)', isPoint: false },
        { key: 'la_county_hydrology_catch_basins_rmd_all', layerId: 25, icon: '🏗️', color: '#3b82f6', title: 'LA County Catch Basins (RMD)', isPoint: false },
        { key: 'la_county_hydrology_catch_basins_others_all', layerId: 26, icon: '🏗️', color: '#3b82f6', title: 'LA County Catch Basins (Others)', isPoint: false },
        { key: 'la_county_hydrology_catch_basins_caltrans_all', layerId: 27, icon: '🏗️', color: '#3b82f6', title: 'LA County Catch Basins (Caltrans)', isPoint: false },
        { key: 'la_county_hydrology_catch_basins_unknown_all', layerId: 28, icon: '🏗️', color: '#3b82f6', title: 'LA County Catch Basins (Unknown)', isPoint: false },
        { key: 'la_county_hydrology_low_flow_diversion_all', layerId: 29, icon: '🌊', color: '#60a5fa', title: 'LA County Low Flow Diversion', isPoint: false },
        { key: 'la_county_hydrology_lfd_lacfcd_all', layerId: 30, icon: '🌊', color: '#60a5fa', title: 'LA County LFD (LACFCD)', isPoint: false },
        { key: 'la_county_hydrology_lfd_city_all', layerId: 31, icon: '🌊', color: '#60a5fa', title: 'LA County LFD (City)', isPoint: false },
        { key: 'la_county_hydrology_lfd_unknown_all', layerId: 32, icon: '🌊', color: '#60a5fa', title: 'LA County LFD (Unknown)', isPoint: false },
        { key: 'la_county_hydrology_pump_stations_all', layerId: 33, icon: '⚙️', color: '#93c5fd', title: 'LA County Pump Stations', isPoint: true },
        { key: 'la_county_hydrology_pump_stations_completed_all', layerId: 34, icon: '⚙️', color: '#93c5fd', title: 'LA County Pump Stations (Completed)', isPoint: true },
        { key: 'la_county_hydrology_pump_stations_city_la_all', layerId: 35, icon: '⚙️', color: '#93c5fd', title: 'LA County Pump Stations (City of LA)', isPoint: true },
        { key: 'la_county_hydrology_pump_stations_investigate_all', layerId: 36, icon: '⚙️', color: '#93c5fd', title: 'LA County Pump Stations (To Investigate)', isPoint: true },
        { key: 'la_county_hydrology_channels_all', layerId: 37, icon: '🏞️', color: '#bfdbfe', title: 'LA County Channels', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_channels_lacfcd_all', layerId: 38, icon: '🏞️', color: '#bfdbfe', title: 'LA County Channels (LACFCD)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_channels_city_all', layerId: 39, icon: '🏞️', color: '#bfdbfe', title: 'LA County Channels (City)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_channels_usace_all', layerId: 40, icon: '🏞️', color: '#bfdbfe', title: 'LA County Channels (USACE)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_channels_caltrans_all', layerId: 41, icon: '🏞️', color: '#bfdbfe', title: 'LA County Channels (Caltrans)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_channels_unknown_all', layerId: 42, icon: '🏞️', color: '#bfdbfe', title: 'LA County Channels (Unknown)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_drains_all', layerId: 43, icon: '🌧️', color: '#dbeafe', title: 'LA County Drains', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_drains_lacfcd_all', layerId: 44, icon: '🌧️', color: '#dbeafe', title: 'LA County Drains (LACFCD)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_drains_city_all', layerId: 45, icon: '🌧️', color: '#dbeafe', title: 'LA County Drains (City)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_drains_road_all', layerId: 46, icon: '🌧️', color: '#dbeafe', title: 'LA County Drains (Road)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_drains_metro_parks_all', layerId: 47, icon: '🌧️', color: '#dbeafe', title: 'LA County Drains (Metro/Parks)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_drains_private_all', layerId: 48, icon: '🌧️', color: '#dbeafe', title: 'LA County Drains (Private)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_drains_caltrans_all', layerId: 49, icon: '🌧️', color: '#dbeafe', title: 'LA County Drains (Caltrans)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_drains_unknown_all', layerId: 50, icon: '🌧️', color: '#dbeafe', title: 'LA County Drains (Unknown)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_laterals_all', layerId: 51, icon: '🌊', color: '#eff6ff', title: 'LA County Laterals', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_laterals_lacfcd_all', layerId: 52, icon: '🌊', color: '#eff6ff', title: 'LA County Laterals (LACFCD)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_laterals_city_all', layerId: 53, icon: '🌊', color: '#eff6ff', title: 'LA County Laterals (City)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_laterals_road_all', layerId: 54, icon: '🌊', color: '#eff6ff', title: 'LA County Laterals (Road)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_laterals_metro_parks_all', layerId: 55, icon: '🌊', color: '#eff6ff', title: 'LA County Laterals (Metro/Parks)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_laterals_private_all', layerId: 56, icon: '🌊', color: '#eff6ff', title: 'LA County Laterals (Private)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_laterals_caltrans_all', layerId: 57, icon: '🌊', color: '#eff6ff', title: 'LA County Laterals (Caltrans)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_laterals_unknown_all', layerId: 58, icon: '🌊', color: '#eff6ff', title: 'LA County Laterals (Unknown)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_culverts_all', layerId: 59, icon: '🚇', color: '#f0f9ff', title: 'LA County Culverts', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_culverts_completed_all', layerId: 60, icon: '🚇', color: '#f0f9ff', title: 'LA County Culverts (Completed)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_culverts_investigate_all', layerId: 61, icon: '🚇', color: '#f0f9ff', title: 'LA County Culverts (To Investigate)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_culverts_city_la_all', layerId: 62, icon: '🚇', color: '#f0f9ff', title: 'LA County Culverts (City of LA)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_permitted_connections_all', layerId: 63, icon: '🔌', color: '#e0f2fe', title: 'LA County Permitted Connections', isPoint: true },
        { key: 'la_county_hydrology_force_mains_all', layerId: 64, icon: '💧', color: '#bae6fd', title: 'LA County Force Mains', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_force_mains_completed_all', layerId: 65, icon: '💧', color: '#bae6fd', title: 'LA County Force Mains (Completed)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_force_mains_investigate_all', layerId: 66, icon: '💧', color: '#bae6fd', title: 'LA County Force Mains (To Investigate)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_force_mains_city_la_all', layerId: 67, icon: '💧', color: '#bae6fd', title: 'LA County Force Mains (City of LA)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_force_mains_caltrans_all', layerId: 68, icon: '💧', color: '#bae6fd', title: 'LA County Force Mains (Caltrans)', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_natural_drainage_all', layerId: 69, icon: '🌿', color: '#7dd3fc', title: 'LA County Natural Drainage', isPoint: false },
        { key: 'la_county_hydrology_pseudo_line_all', layerId: 70, icon: '📏', color: '#38bdf8', title: 'LA County Pseudo Line', isPoint: false, isLine: true },
        { key: 'la_county_hydrology_embankment_all', layerId: 71, icon: '⛰️', color: '#0ea5e9', title: 'LA County Embankment', isPoint: false }
      ];

      laCountyHydrologyLayers.forEach(({ key, icon, color, title, isPoint, isLine }) => {
        try {
          if (enrichments[key] && Array.isArray(enrichments[key])) {
            let featureCount = 0;
            enrichments[key].forEach((hydrology: any) => {
              try {
                const geometry = hydrology.geometry;
                const isContaining = hydrology.isContaining;
                const distance = hydrology.distance_miles !== null && hydrology.distance_miles !== undefined ? hydrology.distance_miles : 0;
                const hydrologyId = hydrology.hydrologyId || hydrology.OBJECTID || hydrology.objectid || 'Unknown';
                
                // Check for point geometry (either from geometry.x/y or from attributes)
                const pointLat = isPoint ? (geometry?.y || geometry?.latitude || hydrology.latitude || hydrology.LATITUDE || hydrology.lat || hydrology.LAT) : null;
                const pointLon = isPoint ? (geometry?.x || geometry?.longitude || hydrology.longitude || hydrology.LONGITUDE || hydrology.lon || hydrology.LON) : null;
                
                if (isPoint && pointLat !== null && pointLat !== undefined && pointLon !== null && pointLon !== undefined) {
                  // Point geometry
                  const lat = pointLat;
                  const lon = pointLon;
                  
                  const marker = L.marker([lat, lon], {
                    icon: createPOIIcon(icon, color)
                  });
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ${icon} ${title}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${hydrologyId ? `<div><strong>ID:</strong> ${hydrologyId}</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['hydrologyId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                  Object.entries(hydrology).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  marker.bindPopup(popupContent);
                  marker.addTo(primary);
                  bounds.extend([lat, lon]);
                  featureCount++;
                } else if (isLine && (geometry?.paths || geometry?.rings)) {
                  // Line geometry
                  const paths = geometry.paths || (geometry.rings ? geometry.rings : []);
                  if (paths && paths.length > 0) {
                    paths.forEach((path: number[][]) => {
                      const latlngs = path.map((coord: number[]) => {
                        return [coord[1], coord[0]] as [number, number];
                      });
                      
                      if (latlngs.length < 2) {
                        console.warn(`${title} line has less than 2 coordinates, skipping`);
                        return;
                      }
                      
                      const polyline = L.polyline(latlngs, {
                        color: color,
                        weight: 3,
                        opacity: 0.8
                      });
                      
                      let popupContent = `
                        <div style="min-width: 250px; max-width: 400px;">
                          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                            ${icon} ${title}
                          </h3>
                          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                            ${hydrologyId ? `<div><strong>ID:</strong> ${hydrologyId}</div>` : ''}
                            ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                          </div>
                          <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                      `;
                      
                      const excludeFields = ['hydrologyId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                      Object.entries(hydrology).forEach(([key, value]) => {
                        if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                          if (typeof value === 'object' && !Array.isArray(value)) {
                            return;
                          }
                          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                          popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                        }
                      });
                      
                      popupContent += `
                          </div>
                        </div>
                      `;
                      
                      polyline.bindPopup(popupContent);
                      polyline.addTo(primary);
                      const polylineBounds = L.latLngBounds(latlngs);
                      bounds.extend(polylineBounds);
                      featureCount++;
                    });
                  }
                } else if (geometry && geometry.rings) {
                  // Polygon geometry
                  const rings = geometry.rings;
                  if (rings && rings.length > 0) {
                    const outerRing = rings[0];
                    const latlngs = outerRing.map((coord: number[]) => {
                      return [coord[1], coord[0]] as [number, number];
                    });
                    
                    if (latlngs.length < 3) {
                      console.warn(`${title} polygon has less than 3 coordinates, skipping`);
                      return;
                    }
                    
                    const polygonColor = isContaining ? color : color.replace('ff', 'cc');
                    const weight = isContaining ? 3 : 2;
                    const opacity = isContaining ? 0.8 : 0.5;
                    
                    const polygon = L.polygon(latlngs, {
                      color: polygonColor,
                      weight: weight,
                      opacity: opacity,
                      fillColor: color,
                      fillOpacity: 0.15
                    });
                    
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          ${icon} ${title}
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${hydrologyId ? `<div><strong>ID:</strong> ${hydrologyId}</div>` : ''}
                          ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this feature</div>` : ''}
                          ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    const excludeFields = ['hydrologyId', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                    Object.entries(hydrology).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polygon.bindPopup(popupContent);
                    polygon.addTo(primary);
                    const polygonBounds = L.latLngBounds(latlngs);
                    bounds.extend(polygonBounds);
                    featureCount++;
                  }
                }
              } catch (error) {
                console.error(`Error drawing ${title} feature:`, error);
              }
            });
            
            if (featureCount > 0) {
              const legendKey = key.replace('_all', '');
              if (!legendAccumulator[legendKey]) {
                legendAccumulator[legendKey] = {
                  icon: icon,
                  color: color,
                  title: title,
                  count: 0,
                };
              }
              legendAccumulator[legendKey].count += featureCount;
            }
          }
        } catch (error) {
          console.error(`Error processing ${title}:`, error);
        }
      });

      // Draw LA County Infrastructure layers
      const laCountyInfrastructureLayers = [
        { key: 'la_county_infrastructure_county_facilities_all', layerId: 0, icon: '🏛️', color: '#7c3aed', title: 'LA County Facilities', isPoint: true },
        { key: 'la_county_infrastructure_county_buildings_all', layerId: 1, icon: '🏢', color: '#8b5cf6', title: 'LA County-owned Buildings', isPoint: false },
        { key: 'la_county_infrastructure_schools_all', layerId: 2, icon: '🏫', color: '#a78bfa', title: 'LA County Schools', isPoint: false },
        { key: 'la_county_infrastructure_county_parcels_all', layerId: 3, icon: '📋', color: '#c084fc', title: 'LA County-owned Parcels', isPoint: false },
        { key: 'la_county_infrastructure_government_parcels_all', layerId: 4, icon: '📋', color: '#d8b4fe', title: 'LA County Government-owned Parcels', isPoint: false }
      ];

      laCountyInfrastructureLayers.forEach(({ key, icon, color, title, isPoint }) => {
        try {
          if (enrichments[key] && Array.isArray(enrichments[key])) {
            let featureCount = 0;
            enrichments[key].forEach((infrastructure: any) => {
              try {
                const geometry = infrastructure.geometry;
                const isContaining = infrastructure.isContaining;
                const distance = infrastructure.distance_miles !== null && infrastructure.distance_miles !== undefined ? infrastructure.distance_miles : 0;
                const infrastructureId = infrastructure.infrastructureId || infrastructure.LACO || infrastructure.laco || infrastructure.OBJECTID || infrastructure.objectid || 'Unknown';
                
                // Check for point geometry
                const pointLat = isPoint ? (geometry?.y || geometry?.latitude || infrastructure.latitude || infrastructure.LATITUDE || infrastructure.lat || infrastructure.LAT) : null;
                const pointLon = isPoint ? (geometry?.x || geometry?.longitude || infrastructure.longitude || infrastructure.LONGITUDE || infrastructure.lon || infrastructure.LON) : null;
                
                if (isPoint && pointLat !== null && pointLat !== undefined && pointLon !== null && pointLon !== undefined) {
                  // Point geometry
                  const lat = pointLat;
                  const lon = pointLon;
                  
                  const marker = L.marker([lat, lon], {
                    icon: createPOIIcon(icon, color)
                  });
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ${icon} ${title}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${infrastructureId ? `<div><strong>ID:</strong> ${infrastructureId}</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['infrastructureId', 'LACO', 'laco', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                  Object.entries(infrastructure).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  marker.bindPopup(popupContent);
                  marker.addTo(primary);
                  bounds.extend([lat, lon]);
                  featureCount++;
                } else if (geometry && geometry.rings) {
                  // Polygon geometry
                  const rings = geometry.rings;
                  if (rings && rings.length > 0) {
                    const outerRing = rings[0];
                    const latlngs = outerRing.map((coord: number[]) => {
                      return [coord[1], coord[0]] as [number, number];
                    });
                    
                    if (latlngs.length < 3) {
                      console.warn(`${title} polygon has less than 3 coordinates, skipping`);
                      return;
                    }
                    
                    const polygonColor = isContaining ? color : color.replace('ff', 'cc');
                    const weight = isContaining ? 3 : 2;
                    const opacity = isContaining ? 0.8 : 0.5;
                    
                    const polygon = L.polygon(latlngs, {
                      color: polygonColor,
                      weight: weight,
                      opacity: opacity,
                      fillColor: color,
                      fillOpacity: 0.15
                    });
                    
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          ${icon} ${title}
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${infrastructureId ? `<div><strong>ID:</strong> ${infrastructureId}</div>` : ''}
                          ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this feature</div>` : ''}
                          ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    const excludeFields = ['infrastructureId', 'LACO', 'laco', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                    Object.entries(infrastructure).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polygon.bindPopup(popupContent);
                    polygon.addTo(primary);
                    const polygonBounds = L.latLngBounds(latlngs);
                    bounds.extend(polygonBounds);
                    featureCount++;
                  }
                }
              } catch (error) {
                console.error(`Error drawing ${title} feature:`, error);
              }
            });
            
            if (featureCount > 0) {
              const legendKey = key.replace('_all', '');
              if (!legendAccumulator[legendKey]) {
                legendAccumulator[legendKey] = {
                  icon: icon,
                  color: color,
                  title: title,
                  count: 0,
                };
              }
              legendAccumulator[legendKey].count += featureCount;
            }
          }
        } catch (error) {
          console.error(`Error processing ${title}:`, error);
        }
      });

      // Draw LA County Administrative Boundaries layers
      const laCountyAdminBoundariesLayers = [
        { key: 'la_county_admin_boundaries_isd_facilities_all', layerId: 24, icon: '🏢', color: '#6366f1', title: 'LA County ISD Facilities Operations Service Maintenance Districts' },
        { key: 'la_county_admin_boundaries_school_districts_all', layerId: 0, icon: '🏫', color: '#7c3aed', title: 'LA County School District Boundaries' },
        { key: 'la_county_admin_boundaries_park_planning_areas_all', layerId: 1, icon: '🏞️', color: '#8b5cf6', title: 'LA County Park Planning Areas' },
        { key: 'la_county_admin_boundaries_dcfs_office_all', layerId: 2, icon: '🏛️', color: '#a78bfa', title: 'LA County DCFS Office Boundaries' },
        { key: 'la_county_admin_boundaries_health_districts_2022_all', layerId: 22, icon: '🏥', color: '#c084fc', title: 'LA County Health Districts (2022)' },
        { key: 'la_county_admin_boundaries_health_districts_2012_all', layerId: 3, icon: '🏥', color: '#c084fc', title: 'LA County Health Districts (2012)' },
        { key: 'la_county_admin_boundaries_service_planning_areas_2022_all', layerId: 23, icon: '🗺️', color: '#d8b4fe', title: 'LA County Service Planning Areas (2022)' },
        { key: 'la_county_admin_boundaries_service_planning_areas_2012_all', layerId: 4, icon: '🗺️', color: '#d8b4fe', title: 'LA County Service Planning Areas (2012)' },
        { key: 'la_county_admin_boundaries_disaster_management_areas_all', layerId: 18, icon: '⚠️', color: '#e879f9', title: 'LA County Disaster Management Areas' },
        { key: 'la_county_admin_boundaries_zipcodes_all', layerId: 5, icon: '📮', color: '#f0abfc', title: 'LA County Zipcodes' },
        { key: 'la_county_admin_boundaries_regional_centers_all', layerId: 6, icon: '📍', color: '#f5d0fe', title: 'LA County Regional Centers (2014)' },
        { key: 'la_county_admin_boundaries_public_safety_all', layerId: 7, icon: '🚨', color: '#fae8ff', title: 'LA County Public Safety' },
        { key: 'la_county_admin_boundaries_reporting_districts_all', layerId: 8, icon: '📊', color: '#fce7f3', title: 'LA County Reporting Districts' },
        { key: 'la_county_admin_boundaries_station_boundaries_all', layerId: 9, icon: '🚓', color: '#fdf2f8', title: 'LA County Station Boundaries' },
        { key: 'la_county_admin_boundaries_fire_station_boundaries_all', layerId: 19, icon: '🚒', color: '#fef3c7', title: 'LA County Fire Station Boundaries' },
        { key: 'la_county_admin_boundaries_psap_boundaries_all', layerId: 20, icon: '📞', color: '#fde68a', title: 'LA County PSAP Boundaries' },
        { key: 'la_county_admin_boundaries_library_all', layerId: 10, icon: '📚', color: '#fcd34d', title: 'LA County Library' },
        { key: 'la_county_admin_boundaries_library_planning_areas_all', layerId: 11, icon: '📚', color: '#fbbf24', title: 'LA County Library Planning Areas' },
        { key: 'la_county_admin_boundaries_library_service_areas_all', layerId: 12, icon: '📚', color: '#f59e0b', title: 'LA County Library Service Areas' },
        { key: 'la_county_admin_boundaries_state_enterprise_zones_all', layerId: 16, icon: '💼', color: '#d97706', title: 'LA County State Enterprise Zones' },
        { key: 'la_county_admin_boundaries_animal_care_control_all', layerId: 21, icon: '🐾', color: '#92400e', title: 'LA County Animal Care and Control Service Areas' }
      ];

      laCountyAdminBoundariesLayers.forEach(({ key, icon, color, title }) => {
        try {
          if (enrichments[key] && Array.isArray(enrichments[key])) {
            let featureCount = 0;
            enrichments[key].forEach((boundary: any) => {
              if (boundary.geometry && boundary.geometry.rings) {
                try {
                  const rings = boundary.geometry.rings;
                  if (rings && rings.length > 0) {
                    const outerRing = rings[0];
                    const latlngs = outerRing.map((coord: number[]) => {
                      return [coord[1], coord[0]] as [number, number];
                    });
                    
                    if (latlngs.length < 3) {
                      console.warn(`${title} polygon has less than 3 coordinates, skipping`);
                      return;
                    }
                    
                    const isContaining = boundary.isContaining;
                    const polygonColor = isContaining ? color : color.replace('ff', 'cc');
                    const weight = isContaining ? 3 : 2;
                    const opacity = isContaining ? 0.8 : 0.5;
                    
                    const polygon = L.polygon(latlngs, {
                      color: polygonColor,
                      weight: weight,
                      opacity: opacity,
                      fillColor: color,
                      fillOpacity: 0.15
                    });
                    
                    const boundaryId = boundary.boundaryId || boundary.NAME || boundary.Name || boundary.name || boundary.OBJECTID || boundary.objectid || 'Unknown';
                    const distance = boundary.distance_miles !== null && boundary.distance_miles !== undefined ? boundary.distance_miles : 0;
                    
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          ${icon} ${title}
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${boundaryId ? `<div><strong>Boundary ID:</strong> ${boundaryId}</div>` : ''}
                          ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this boundary</div>` : ''}
                          ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    const excludeFields = ['boundaryId', 'NAME', 'Name', 'name', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                    Object.entries(boundary).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polygon.bindPopup(popupContent);
                    polygon.addTo(primary);
                    const polygonBounds = L.latLngBounds(latlngs);
                    bounds.extend(polygonBounds);
                    featureCount++;
                  }
                } catch (error) {
                  console.error(`Error drawing ${title} polygon:`, error);
                }
              }
            });
            
            if (featureCount > 0) {
              const legendKey = key.replace('_all', '');
              if (!legendAccumulator[legendKey]) {
                legendAccumulator[legendKey] = {
                  icon: icon,
                  color: color,
                  title: title,
                  count: 0,
                };
              }
              legendAccumulator[legendKey].count += featureCount;
            }
          }
        } catch (error) {
          console.error(`Error processing ${title}:`, error);
        }
      });

      // Draw LA County Elevation layers (contours and points)
      const laCountyElevationLayers = [
        { key: 'la_county_elevation_contours_l4_all', layerId: 10, icon: '⛰️', color: '#8b5cf6', title: 'LA County Contours L4', isLine: true },
        { key: 'la_county_elevation_contours_1000ft_l4_all', layerId: 11, icon: '⛰️', color: '#7c3aed', title: 'LA County LARIAC Contours 1000FT L4', isLine: true },
        { key: 'la_county_elevation_contours_250ft_l4_all', layerId: 12, icon: '⛰️', color: '#6366f1', title: 'LA County LARIAC Contours 250FT L4', isLine: true },
        { key: 'la_county_elevation_contours_50ft_l4_all', layerId: 13, icon: '⛰️', color: '#5b21b6', title: 'LA County LARIAC Contours 50FT L4', isLine: true },
        { key: 'la_county_elevation_contours_10ft_l4_all', layerId: 14, icon: '⛰️', color: '#4c1d95', title: 'LA County LARIAC Contours 10FT L4', isLine: true },
        { key: 'la_county_elevation_contours_2ft_l4_all', layerId: 15, icon: '⛰️', color: '#3b0764', title: 'LA County LARIAC Contours 2FT L4', isLine: true },
        { key: 'la_county_elevation_contours_1ft_l4_all', layerId: 16, icon: '⛰️', color: '#2e1065', title: 'LA County LARIAC Contours 1FT L4', isLine: true },
        { key: 'la_county_elevation_contours_all', layerId: 0, icon: '⛰️', color: '#a78bfa', title: 'LA County Contours', isLine: true },
        { key: 'la_county_elevation_contours_250ft_all', layerId: 1, icon: '⛰️', color: '#9333ea', title: 'LA County LARIAC Contours 250ft', isLine: true },
        { key: 'la_county_elevation_contours_50ft_all', layerId: 2, icon: '⛰️', color: '#7e22ce', title: 'LA County LARIAC Contours 50ft', isLine: true },
        { key: 'la_county_elevation_contours_10ft_all', layerId: 3, icon: '⛰️', color: '#6b21a8', title: 'LA County LARIAC Contours 10ft', isLine: true },
        { key: 'la_county_elevation_points_all', layerId: 9, icon: '📍', color: '#ec4899', title: 'LA County Elevation Points', isLine: false }
      ];

      laCountyElevationLayers.forEach(({ key, icon, color, title, isLine }) => {
        try {
          if (enrichments[key] && Array.isArray(enrichments[key])) {
            let featureCount = 0;
            enrichments[key].forEach((elevation: any) => {
              if (isLine && elevation.geometry && elevation.geometry.paths) {
                // Draw contour lines (polylines)
                try {
                  const paths = elevation.geometry.paths;
                  paths.forEach((path: number[][]) => {
                    const latlngs = path.map((coord: number[]) => {
                      return [coord[1], coord[0]] as [number, number];
                    });
                    
                    if (latlngs.length < 2) {
                      return;
                    }
                    
                    const polyline = L.polyline(latlngs, {
                      color: color,
                      weight: 2,
                      opacity: 0.7
                    });
                    
                    const elevationId = elevation.elevationId || elevation.ELEVATION || elevation.Elevation || elevation.CONTOUR || elevation.Contour || 'Unknown';
                    const distance = elevation.distance_miles !== null && elevation.distance_miles !== undefined ? elevation.distance_miles : 0;
                    
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          ${icon} ${title}
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${elevationId ? `<div><strong>Elevation/Contour:</strong> ${elevationId}</div>` : ''}
                          ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    const excludeFields = ['elevationId', 'ELEVATION', 'Elevation', 'elevation', 'CONTOUR', 'Contour', 'contour', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID'];
                    Object.entries(elevation).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polyline.bindPopup(popupContent);
                    polyline.addTo(primary);
                    const polylineBounds = L.latLngBounds(latlngs);
                    bounds.extend(polylineBounds);
                    featureCount++;
                  });
                } catch (error) {
                  console.error(`Error drawing ${title} polyline:`, error);
                }
              } else if (!isLine && elevation.geometry && elevation.geometry.x !== undefined && elevation.geometry.y !== undefined) {
                // Draw elevation points
                try {
                  const pointLat = elevation.geometry.y;
                  const pointLon = elevation.geometry.x;
                  
                  const marker = L.marker([pointLat, pointLon], {
                    icon: L.divIcon({
                      className: 'custom-marker-icon',
                      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px;">${icon}</div>`,
                      iconSize: [20, 20],
                      iconAnchor: [10, 10]
                    })
                  });
                  
                  const elevationId = elevation.elevationId || elevation.ELEVATION || elevation.Elevation || 'Unknown';
                  const distance = elevation.distance_miles !== null && elevation.distance_miles !== undefined ? elevation.distance_miles : 0;
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ${icon} ${title}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${elevationId ? `<div><strong>Elevation:</strong> ${elevationId}</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['elevationId', 'ELEVATION', 'Elevation', 'elevation', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID'];
                  Object.entries(elevation).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  marker.bindPopup(popupContent);
                  marker.addTo(primary);
                  bounds.extend([pointLat, pointLon]);
                  featureCount++;
                } catch (error) {
                  console.error(`Error drawing ${title} point:`, error);
                }
              }
            });
            
            if (featureCount > 0) {
              const legendKey = key.replace('_all', '');
              if (!legendAccumulator[legendKey]) {
                legendAccumulator[legendKey] = {
                  icon: icon,
                  color: color,
                  title: title,
                  count: 0,
                };
              }
              legendAccumulator[legendKey].count += featureCount;
            }
          }
        } catch (error) {
          console.error(`Error processing ${title}:`, error);
        }
      });

      // Add raster layers for visualization (if enabled)
      // Use ArcGIS MapServer export endpoint with proper coordinate system
      const rasterLayers = [
        { key: 'la_county_elevation_raster_enabled', layerId: 5, title: 'LA County Elevation Data (Raster)', icon: '🗺️', color: '#8b5cf6' },
        { key: 'la_county_elevation_hillshade_enabled', layerId: 6, title: 'LA County LARIAC Hillshade (2006)', icon: '⛰️', color: '#7c3aed' },
        { key: 'la_county_elevation_dem_enabled', layerId: 7, title: 'LA County LARIAC Digital Elevation Model (2006)', icon: '🏔️', color: '#6366f1' },
        { key: 'la_county_elevation_dsm_enabled', layerId: 8, title: 'LA County LARIAC Digital Surface Model (2006)', icon: '⛰️', color: '#5b21b6' }
      ];

      rasterLayers.forEach(({ key, layerId, title, icon, color }) => {
        try {
          if (enrichments[key] && map && map.getBounds) {
            const mapBounds = map.getBounds();
            const sw = mapBounds.getSouthWest();
            const ne = mapBounds.getNorthEast();
            
            // Get map container size for image size
            const mapSize = map.getSize();
            const imageWidth = Math.max(512, Math.min(2048, mapSize.x || 1024));
            const imageHeight = Math.max(512, Math.min(2048, mapSize.y || 1024));
            
            // Service uses spatial reference 2229 (California State Plane Zone 5)
            // But we'll request in 4326 and let ArcGIS transform, or try Web Mercator (3857)
            // Format: minX,minY,maxX,maxY
            const bbox4326 = `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`;
            
            // Convert to Web Mercator (3857) - standard for web maps
            const toWebMercator = (lat: number, lon: number) => {
              const x = lon * 20037508.34 / 180;
              let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
              y = y * 20037508.34 / 180;
              return { x, y };
            };
            
            const swMerc = toWebMercator(sw.lat, sw.lng);
            const neMerc = toWebMercator(ne.lat, ne.lng);
            const bbox3857 = `${swMerc.x},${swMerc.y},${neMerc.x},${neMerc.y}`;
            
            // Try Web Mercator first (most reliable for web maps)
            let exportUrl = `https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Elevation/MapServer/export?bbox=${bbox3857}&bboxSR=3857&imageSR=3857&size=${imageWidth},${imageHeight}&f=image&layers=show:${layerId}&transparent=true&format=png`;
            
            console.log(`🗺️ Adding ${title} raster layer (Layer ${layerId})`);
            console.log(`   Map bounds:`, { sw: sw, ne: ne });
            console.log(`   Image size:`, { width: imageWidth, height: imageHeight });
            console.log(`   Export URL:`, exportUrl);
            
            // Create ImageOverlay with current map bounds
            const imageOverlay = L.imageOverlay(exportUrl, mapBounds, {
              opacity: 0.7,
              zIndex: 100,
              attribution: 'LA County Public GIS',
              interactive: false
            });
            
            // Add error handler - if Web Mercator fails, try WGS84
            imageOverlay.on('error', () => {
              console.warn(`⚠️ Web Mercator export failed for ${title}, trying WGS84...`);
              
              // Fallback to WGS84
              const fallbackUrl = `https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Elevation/MapServer/export?bbox=${bbox4326}&bboxSR=4326&imageSR=4326&size=${imageWidth},${imageHeight}&f=image&layers=show:${layerId}&transparent=true&format=png`;
              
              // Remove failed overlay and try again
              if (map.hasLayer(imageOverlay)) {
                imageOverlay.remove();
              }
              
              const fallbackOverlay = L.imageOverlay(fallbackUrl, mapBounds, {
                opacity: 0.7,
                zIndex: 100,
                attribution: 'LA County Public GIS',
                interactive: false
              });
              
              fallbackOverlay.on('error', (err: any) => {
                console.error(`❌ Failed to load ${title} raster image with both coordinate systems:`, err);
              });
              
              fallbackOverlay.on('load', () => {
                console.log(`✅ Successfully loaded ${title} raster image using WGS84 fallback`);
              });
              
              fallbackOverlay.addTo(map);
            });
            
            imageOverlay.on('load', () => {
              console.log(`✅ Successfully loaded ${title} raster image using Web Mercator`);
            });
            
            imageOverlay.addTo(map);
            
            // Add to legend
            const legendKey = key.replace('_enabled', '');
            if (!legendAccumulator[legendKey]) {
              legendAccumulator[legendKey] = {
                icon: icon,
                color: color,
                title: title,
                count: 1, // Raster layers show as enabled
              };
            }
            
            console.log(`✅ Added ${title} raster layer to map`);
          } else {
            console.log(`⚠️ ${title} not enabled or map not ready:`, { 
              enabled: enrichments[key], 
              hasMap: !!map,
              hasGetBounds: map && typeof map.getBounds === 'function',
              mapReady: map !== null
            });
          }
        } catch (error) {
          console.error(`❌ Error adding ${title} raster layer:`, error);
        }
      });

      // Draw LA County Demographics layers
      const laCountyDemographicsLayers = [
        { key: 'la_county_demographics_2020_census_all', layerId: 13, icon: '📊', color: '#8b5cf6', title: 'LA County 2020 Census' },
        { key: 'la_county_demographics_2020_tracts_all', layerId: 14, icon: '📊', color: '#7c3aed', title: 'LA County 2020 Census Tracts' },
        { key: 'la_county_demographics_2020_block_groups_all', layerId: 15, icon: '📊', color: '#6366f1', title: 'LA County 2020 Census Block Groups' },
        { key: 'la_county_demographics_2020_blocks_all', layerId: 16, icon: '📊', color: '#5b21b6', title: 'LA County 2020 Census Blocks' },
        { key: 'la_county_demographics_2018_estimates_all', layerId: 10, icon: '📈', color: '#4c1d95', title: 'LA County 2018 Estimates' },
        { key: 'la_county_demographics_2018_population_poverty_all', layerId: 11, icon: '📈', color: '#3b0764', title: 'LA County 2018 Population and Poverty by Tract' },
        { key: 'la_county_demographics_2018_median_income_all', layerId: 12, icon: '📈', color: '#2e1065', title: 'LA County 2018 Median Household Income by Tract' },
        { key: 'la_county_demographics_2010_census_all', layerId: 0, icon: '📋', color: '#a78bfa', title: 'LA County 2010 Census' },
        { key: 'la_county_demographics_2010_tracts_all', layerId: 1, icon: '📋', color: '#9333ea', title: 'LA County 2010 Census Data by Tract' },
        { key: 'la_county_demographics_2010_block_groups_all', layerId: 2, icon: '📋', color: '#7e22ce', title: 'LA County 2010 Census Block Groups' },
        { key: 'la_county_demographics_2010_blocks_all', layerId: 3, icon: '📋', color: '#6b21a8', title: 'LA County 2010 Census Data By Block' },
        { key: 'la_county_demographics_2000_census_all', layerId: 4, icon: '📄', color: '#ec4899', title: 'LA County 2000 Census' },
        { key: 'la_county_demographics_2000_tracts_all', layerId: 5, icon: '📄', color: '#db2777', title: 'LA County 2000 Census Tracts' },
        { key: 'la_county_demographics_2000_block_groups_all', layerId: 6, icon: '📄', color: '#be185d', title: 'LA County 2000 Census Block Groups' },
        { key: 'la_county_demographics_2000_blocks_all', layerId: 7, icon: '📄', color: '#9f1239', title: 'LA County 2000 Census Blocks' },
        { key: 'la_county_demographics_1990_census_all', layerId: 8, icon: '📜', color: '#f472b6', title: 'LA County 1990 Census' },
        { key: 'la_county_demographics_1990_tracts_all', layerId: 9, icon: '📜', color: '#f43f5e', title: 'LA County 1990 Census Tracts' }
      ];

      laCountyDemographicsLayers.forEach(({ key, icon, color, title }) => {
        try {
          if (enrichments[key] && Array.isArray(enrichments[key])) {
            let featureCount = 0;
            enrichments[key].forEach((demographic: any) => {
              if (demographic.geometry && demographic.geometry.rings) {
                try {
                  const rings = demographic.geometry.rings;
                  if (rings && rings.length > 0) {
                    const outerRing = rings[0];
                    const latlngs = outerRing.map((coord: number[]) => {
                      return [coord[1], coord[0]] as [number, number];
                    });
                    
                    if (latlngs.length < 3) {
                      console.warn(`${title} polygon has less than 3 coordinates, skipping`);
                      return;
                    }
                    
                    const isContaining = demographic.isContaining;
                    const polygonColor = isContaining ? color : color.replace('ff', 'cc');
                    const weight = isContaining ? 3 : 2;
                    const opacity = isContaining ? 0.8 : 0.5;
                    
                    const polygon = L.polygon(latlngs, {
                      color: polygonColor,
                      weight: weight,
                      opacity: opacity,
                      fillColor: color,
                      fillOpacity: 0.15
                    });
                    
                    const demographicId = demographic.demographicId || demographic.GEOID || demographic.geoid || demographic.TRACT || demographic.tract || demographic.BLOCK_GROUP || demographic.block_group || demographic.BLOCK || demographic.block || demographic.OBJECTID || demographic.objectid || 'Unknown';
                    const distance = demographic.distance_miles !== null && demographic.distance_miles !== undefined ? demographic.distance_miles : 0;
                    
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          ${icon} ${title}
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${demographicId ? `<div><strong>ID:</strong> ${demographicId}</div>` : ''}
                          ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this boundary</div>` : ''}
                          ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    const excludeFields = ['demographicId', 'GEOID', 'geoid', 'TRACT', 'tract', 'BLOCK_GROUP', 'block_group', 'BLOCK', 'block', 'NAME', 'Name', 'name', 'OBJECTID', 'objectid', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                    Object.entries(demographic).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polygon.bindPopup(popupContent);
                    polygon.addTo(primary);
                    const polygonBounds = L.latLngBounds(latlngs);
                    bounds.extend(polygonBounds);
                    featureCount++;
                  }
                } catch (error) {
                  console.error(`Error drawing ${title} polygon:`, error);
                }
              }
            });
            
            if (featureCount > 0) {
              const legendKey = key.replace('_all', '');
              if (!legendAccumulator[legendKey]) {
                legendAccumulator[legendKey] = {
                  icon: icon,
                  color: color,
                  title: title,
                  count: 0,
                };
              }
              legendAccumulator[legendKey].count += featureCount;
            }
          }
        } catch (error) {
          console.error(`Error processing ${title}:`, error);
        }
      });

      // Draw LA County LMS Data layers
      // Create a comprehensive list of all LMS layers with their metadata
      const laCountyLMSLayers = Array.from({ length: 193 }, (_, i) => {
        const layerNames: Record<number, { key: string; icon: string; color: string; title: string }> = {
          0: { key: 'la_county_lms_arts_recreation_all', icon: '🎨', color: '#ef4444', title: 'LA County LMS Data Arts and Recreation' },
          1: { key: 'la_county_lms_beaches_marinas_all', icon: '🏖️', color: '#f59e0b', title: 'LA County LMS Data Beaches and Marinas' },
          2: { key: 'la_county_lms_campgrounds_all', icon: '⛺', color: '#10b981', title: 'LA County LMS Data Campgrounds' },
          3: { key: 'la_county_lms_cruise_line_terminals_all', icon: '🚢', color: '#3b82f6', title: 'LA County LMS Data Cruise Line Terminals' },
          4: { key: 'la_county_lms_cultural_performing_arts_all', icon: '🎭', color: '#8b5cf6', title: 'LA County LMS Data Cultural and Performing Arts Centers' },
          5: { key: 'la_county_lms_golf_courses_all', icon: '⛳', color: '#06b6d4', title: 'LA County LMS Data Golf Courses' },
          6: { key: 'la_county_lms_museums_aquariums_all', icon: '🏛️', color: '#6366f1', title: 'LA County LMS Data Museums and Aquariums' },
          7: { key: 'la_county_lms_natural_areas_wildlife_all', icon: '🌿', color: '#14b8a6', title: 'LA County LMS Data Natural Areas and Wildlife Sanctuaries' },
          8: { key: 'la_county_lms_parks_gardens_all', icon: '🌳', color: '#22c55e', title: 'LA County LMS Data Parks and Gardens' },
          9: { key: 'la_county_lms_picnic_areas_all', icon: '🧺', color: '#84cc16', title: 'LA County LMS Data Picnic Areas' },
          10: { key: 'la_county_lms_pools_all', icon: '🏊', color: '#65a30d', title: 'LA County LMS Data Pools' },
          11: { key: 'la_county_lms_ranches_all', icon: '🐴', color: '#a3e635', title: 'LA County LMS Data Ranches' },
          12: { key: 'la_county_lms_recreation_centers_all', icon: '🏃', color: '#4ade80', title: 'LA County LMS Data Recreation Centers' },
          13: { key: 'la_county_lms_recreation_clubs_all', icon: '🎪', color: '#34d399', title: 'LA County LMS Data Recreation Clubs' },
          14: { key: 'la_county_lms_recreation_programs_all', icon: '🎯', color: '#2dd4bf', title: 'LA County LMS Data Recreation Programs' },
          15: { key: 'la_county_lms_ski_areas_all', icon: '⛷️', color: '#06b6d4', title: 'LA County LMS Data Ski Areas' },
          16: { key: 'la_county_lms_sports_venues_all', icon: '🏟️', color: '#0ea5e9', title: 'LA County LMS Data Sports Venues' },
          17: { key: 'la_county_lms_tourist_assistance_all', icon: '🗺️', color: '#3b82f6', title: 'LA County LMS Data Tourist Assistance' },
          18: { key: 'la_county_lms_trails_all', icon: '🥾', color: '#2563eb', title: 'LA County LMS Data Trails' },
          19: { key: 'la_county_lms_wineries_all', icon: '🍷', color: '#1d4ed8', title: 'LA County LMS Data Wineries' },
          20: { key: 'la_county_lms_communications_all', icon: '📡', color: '#7c3aed', title: 'LA County LMS Data Communications' },
          21: { key: 'la_county_lms_am_antennas_all', icon: '📻', color: '#6d28d9', title: 'LA County LMS Data AM Antennas' },
          22: { key: 'la_county_lms_antenna_structure_registration_all', icon: '📡', color: '#5b21b6', title: 'LA County LMS Data Antenna Structure Registration' },
          23: { key: 'la_county_lms_brs_ebs_transmitters_all', icon: '📺', color: '#4c1d95', title: 'LA County LMS Data BRS and EBS Transmitters' },
          24: { key: 'la_county_lms_cellular_towers_all', icon: '📱', color: '#3b0764', title: 'LA County LMS Data Cellular Towers' },
          25: { key: 'la_county_lms_digital_tv_all', icon: '📺', color: '#2e1065', title: 'LA County LMS Data Digital TV' },
          26: { key: 'la_county_lms_fm_antennas_all', icon: '📻', color: '#1e1b4b', title: 'LA County LMS Data FM Antennas' },
          27: { key: 'la_county_lms_internet_exchange_points_all', icon: '🌐', color: '#9333ea', title: 'LA County LMS Data Internet Exchange Points' },
          28: { key: 'la_county_lms_internet_service_providers_all', icon: '💻', color: '#a855f7', title: 'LA County LMS Data Internet Service Providers' },
          29: { key: 'la_county_lms_it_portal_locations_all', icon: '🖥️', color: '#c084fc', title: 'LA County LMS Data IT Portal Locations' },
          30: { key: 'la_county_lms_land_mobile_broadcast_all', icon: '📡', color: '#d946ef', title: 'LA County LMS Data Land Mobile Broadcast' },
          31: { key: 'la_county_lms_land_mobile_commercial_towers_all', icon: '📡', color: '#e879f9', title: 'LA County LMS Data Land Mobile Commercial Towers' },
          32: { key: 'la_county_lms_land_mobile_private_all', icon: '📡', color: '#f0abfc', title: 'LA County LMS Data Land Mobile Private' },
          33: { key: 'la_county_lms_microwave_towers_all', icon: '📡', color: '#f472b6', title: 'LA County LMS Data Microwave Towers' },
          34: { key: 'la_county_lms_ntsc_tv_all', icon: '📺', color: '#fb7185', title: 'LA County LMS Data NTSC TV' },
          35: { key: 'la_county_lms_paging_towers_all', icon: '📡', color: '#fda4af', title: 'LA County LMS Data Paging Towers' },
          36: { key: 'la_county_lms_towers_all', icon: '📡', color: '#fecdd3', title: 'LA County LMS Data Towers' },
          37: { key: 'la_county_lms_community_groups_all', icon: '👥', color: '#ec4899', title: 'LA County LMS Data Community Groups' },
          38: { key: 'la_county_lms_churches_all', icon: '⛪', color: '#db2777', title: 'LA County LMS Data Churches' },
          39: { key: 'la_county_lms_community_organizations_all', icon: '🤝', color: '#be185d', title: 'LA County LMS Data Community Organizations' },
          40: { key: 'la_county_lms_farmers_markets_all', icon: '🥬', color: '#9f1239', title: 'LA County LMS Data Farmers Markets' },
          41: { key: 'la_county_lms_red_cross_offices_all', icon: '➕', color: '#831843', title: 'LA County LMS Data Red Cross Offices' },
          42: { key: 'la_county_lms_volunteer_opportunities_all', icon: '🙋', color: '#701a75', title: 'LA County LMS Data Volunteer Opportunities' },
          43: { key: 'la_county_lms_education_all', icon: '📚', color: '#dc2626', title: 'LA County LMS Data Education' },
          44: { key: 'la_county_lms_adult_education_all', icon: '👨‍🎓', color: '#b91c1c', title: 'LA County LMS Data Adult Education' },
          45: { key: 'la_county_lms_colleges_universities_all', icon: '🏫', color: '#991b1b', title: 'LA County LMS Data Colleges and Universities' },
          46: { key: 'la_county_lms_early_childhood_education_all', icon: '🧒', color: '#7f1d1d', title: 'LA County LMS Data Early Childhood Education and Head Start' },
          47: { key: 'la_county_lms_guidance_tutoring_all', icon: '📖', color: '#450a0a', title: 'LA County LMS Data Guidance and Tutoring Programs' },
          48: { key: 'la_county_lms_private_charter_schools_all', icon: '🏫', color: '#f97316', title: 'LA County LMS Data Private and Charter Schools' },
          49: { key: 'la_county_lms_public_elementary_schools_all', icon: '🏫', color: '#ea580c', title: 'LA County LMS Data Public Elementary Schools' },
          50: { key: 'la_county_lms_public_high_schools_all', icon: '🏫', color: '#c2410c', title: 'LA County LMS Data Public High Schools' },
          51: { key: 'la_county_lms_public_middle_school_all', icon: '🏫', color: '#9a3412', title: 'LA County LMS Data Public Middle School' },
          52: { key: 'la_county_lms_school_districts_all', icon: '🏛️', color: '#7c2d12', title: 'LA County LMS Data School Districts' },
          53: { key: 'la_county_lms_special_curriculum_schools_all', icon: '🎓', color: '#431407', title: 'LA County LMS Data Special Curriculum Schools and Programs' },
          54: { key: 'la_county_lms_emergency_response_all', icon: '🚨', color: '#f59e0b', title: 'LA County LMS Data Emergency Response' },
          55: { key: 'la_county_lms_cooling_centers_all', icon: '❄️', color: '#d97706', title: 'LA County LMS Data Cooling Centers' },
          56: { key: 'la_county_lms_emergency_disaster_offices_all', icon: '🏢', color: '#b45309', title: 'LA County LMS Data Emergency and Disaster Offices' },
          57: { key: 'la_county_lms_environment_all', icon: '🌍', color: '#84cc16', title: 'LA County LMS Data Environment' },
          58: { key: 'la_county_lms_conservation_programs_all', icon: '🌱', color: '#65a30d', title: 'LA County LMS Data Conservation Programs' },
          59: { key: 'la_county_lms_epa_facility_registration_all', icon: '🏭', color: '#4ade80', title: 'LA County LMS Data EPA Facility Registration System' },
          60: { key: 'la_county_lms_epa_superfund_sites_all', icon: '⚠️', color: '#22c55e', title: 'LA County LMS Data EPA Superfund Sites' },
          61: { key: 'la_county_lms_hazardous_waste_disposal_all', icon: '☢️', color: '#16a34a', title: 'LA County LMS Data Hazardous Waste Disposal' },
          62: { key: 'la_county_lms_historic_earthquakes_all', icon: '🌋', color: '#15803d', title: 'LA County LMS Data Historic Earthquakes' },
          63: { key: 'la_county_lms_recycling_all', icon: '♻️', color: '#166534', title: 'LA County LMS Data Recycling' },
          64: { key: 'la_county_lms_tsunami_tide_gauges_all', icon: '🌊', color: '#14532d', title: 'LA County LMS Data Tsunami Tide Gauges' },
          65: { key: 'la_county_lms_government_all', icon: '🏛️', color: '#0ea5e9', title: 'LA County LMS Data Government' },
          66: { key: 'la_county_lms_chambers_of_commerce_all', icon: '💼', color: '#0284c7', title: 'LA County LMS Data Chambers of Commerce' },
          67: { key: 'la_county_lms_city_halls_all', icon: '🏛️', color: '#0369a1', title: 'LA County LMS Data City Halls' },
          68: { key: 'la_county_lms_consulate_offices_all', icon: '🏢', color: '#075985', title: 'LA County LMS Data Consulate Offices' },
          69: { key: 'la_county_lms_county_offices_all', icon: '🏛️', color: '#0c4a6e', title: 'LA County LMS Data County Offices' },
          70: { key: 'la_county_lms_government_offices_all', icon: '🏢', color: '#082f49', title: 'LA County LMS Data Government Offices' },
          71: { key: 'la_county_lms_passports_all', icon: '📘', color: '#3b82f6', title: 'LA County LMS Data Passports' },
          72: { key: 'la_county_lms_representative_offices_all', icon: '👤', color: '#2563eb', title: 'LA County LMS Data Representative Offices' },
          73: { key: 'la_county_lms_social_security_administration_all', icon: '💳', color: '#1d4ed8', title: 'LA County LMS Data Social Security Administration' },
          74: { key: 'la_county_lms_health_mental_health_all', icon: '🏥', color: '#ef4444', title: 'LA County LMS Data Health and Mental Health' },
          75: { key: 'la_county_lms_dental_care_all', icon: '🦷', color: '#dc2626', title: 'LA County LMS Data Dental Care' },
          76: { key: 'la_county_lms_dhs_health_clinics_all', icon: '🏥', color: '#b91c1c', title: 'LA County LMS Data DHS Health Clinics' },
          77: { key: 'la_county_lms_health_centers_all', icon: '🏥', color: '#991b1b', title: 'LA County LMS Data Health Centers' },
          78: { key: 'la_county_lms_health_clinics_all', icon: '🏥', color: '#7f1d1d', title: 'LA County LMS Data Health Clinics' },
          79: { key: 'la_county_lms_health_education_counseling_all', icon: '💬', color: '#450a0a', title: 'LA County LMS Data Health Education and Counseling' },
          80: { key: 'la_county_lms_health_screening_testing_all', icon: '🧪', color: '#f97316', title: 'LA County LMS Data Health Screening and Testing' },
          81: { key: 'la_county_lms_hospitals_medical_centers_all', icon: '🏥', color: '#ea580c', title: 'LA County LMS Data Hospitals and Medical Centers' },
          82: { key: 'la_county_lms_immunization_all', icon: '💉', color: '#c2410c', title: 'LA County LMS Data Immunization' },
          83: { key: 'la_county_lms_medicare_medicaid_offices_all', icon: '💊', color: '#9a3412', title: 'LA County LMS Data Medicare and Medicaid Offices' },
          84: { key: 'la_county_lms_mental_health_centers_all', icon: '🧠', color: '#7c2d12', title: 'LA County LMS Data Mental Health Centers' },
          85: { key: 'la_county_lms_mental_health_counseling_all', icon: '💭', color: '#431407', title: 'LA County LMS Data Mental Health Counseling' },
          86: { key: 'la_county_lms_mental_health_programs_all', icon: '🧘', color: '#f59e0b', title: 'LA County LMS Data Mental Health Programs' },
          87: { key: 'la_county_lms_public_health_programs_all', icon: '🏥', color: '#d97706', title: 'LA County LMS Data Public Health Programs' },
          88: { key: 'la_county_lms_safe_havens_all', icon: '🛡️', color: '#b45309', title: 'LA County LMS Data Safe Havens' },
          89: { key: 'la_county_lms_substance_abuse_programs_all', icon: '💊', color: '#92400e', title: 'LA County LMS Data Substance Abuse Programs' },
          90: { key: 'la_county_lms_municipal_services_all', icon: '🏛️', color: '#10b981', title: 'LA County LMS Data Municipal Services' },
          91: { key: 'la_county_lms_animals_pets_all', icon: '🐾', color: '#059669', title: 'LA County LMS Data Animals and Pets' },
          92: { key: 'la_county_lms_building_inspections_all', icon: '🔍', color: '#047857', title: 'LA County LMS Data Building Inspections' },
          93: { key: 'la_county_lms_cemeteries_all', icon: '🪦', color: '#065f46', title: 'LA County LMS Data Cemeteries' },
          94: { key: 'la_county_lms_community_services_all', icon: '🤝', color: '#064e3b', title: 'LA County LMS Data Community Services' },
          95: { key: 'la_county_lms_consumer_services_all', icon: '🛒', color: '#022c22', title: 'LA County LMS Data Consumer Services' },
          96: { key: 'la_county_lms_economic_development_all', icon: '💼', color: '#06b6d4', title: 'LA County LMS Data Economic Development' },
          97: { key: 'la_county_lms_elections_all', icon: '🗳️', color: '#0891b2', title: 'LA County LMS Data Elections' },
          98: { key: 'la_county_lms_environmental_programs_all', icon: '🌱', color: '#0e7490', title: 'LA County LMS Data Environmental Programs' },
          99: { key: 'la_county_lms_health_housing_inspections_all', icon: '🏠', color: '#155e75', title: 'LA County LMS Data Health and Housing Inspections' },
          100: { key: 'la_county_lms_libraries_all', icon: '📚', color: '#164e63', title: 'LA County LMS Data Libraries' },
          101: { key: 'la_county_lms_licenses_permits_all', icon: '📄', color: '#083344', title: 'LA County LMS Data Licenses and Permits' },
          102: { key: 'la_county_lms_planning_zoning_all', icon: '🗺️', color: '#6366f1', title: 'LA County LMS Data Planning and Zoning' },
          103: { key: 'la_county_lms_property_tax_all', icon: '💰', color: '#4f46e5', title: 'LA County LMS Data Property and Tax' },
          104: { key: 'la_county_lms_public_internet_access_all', icon: '💻', color: '#4338ca', title: 'LA County LMS Data Public Internet Access' },
          105: { key: 'la_county_lms_public_records_all', icon: '📋', color: '#3730a3', title: 'LA County LMS Data Public Records' },
          106: { key: 'la_county_lms_rubbish_disposal_all', icon: '🗑️', color: '#312e81', title: 'LA County LMS Data Rubbish Disposal' },
          107: { key: 'la_county_lms_street_maintenance_all', icon: '🛣️', color: '#1e1b4b', title: 'LA County LMS Data Street Maintenance' },
          108: { key: 'la_county_lms_utilities_all', icon: '⚡', color: '#9333ea', title: 'LA County LMS Data Utilities' },
          109: { key: 'la_county_lms_physical_features_all', icon: '🏔️', color: '#8b5cf6', title: 'LA County LMS Data Physical Features' },
          110: { key: 'la_county_lms_electrical_substations_all', icon: '⚡', color: '#7c3aed', title: 'LA County LMS Data Electrical Sub-Stations' },
          111: { key: 'la_county_lms_named_locations_all', icon: '📍', color: '#6d28d9', title: 'LA County LMS Data Named Locations' },
          112: { key: 'la_county_lms_power_plants_all', icon: '🏭', color: '#5b21b6', title: 'LA County LMS Data Power Plants' },
          113: { key: 'la_county_lms_water_all', icon: '💧', color: '#4c1d95', title: 'LA County LMS Data Water' },
          114: { key: 'la_county_lms_postal_all', icon: '📮', color: '#f59e0b', title: 'LA County LMS Data Postal' },
          115: { key: 'la_county_lms_dhl_locations_all', icon: '📦', color: '#d97706', title: 'LA County LMS Data DHL Locations' },
          116: { key: 'la_county_lms_federal_express_locations_all', icon: '📦', color: '#b45309', title: 'LA County LMS Data Federal Express Locations' },
          117: { key: 'la_county_lms_post_offices_all', icon: '📮', color: '#92400e', title: 'LA County LMS Data Post Offices' },
          118: { key: 'la_county_lms_private_non_retail_shipping_all', icon: '📦', color: '#78350f', title: 'LA County LMS Data Private Non Retail Shipping Locations' },
          119: { key: 'la_county_lms_ups_locations_all', icon: '📦', color: '#713f12', title: 'LA County LMS Data UPS Locations' },
          120: { key: 'la_county_lms_usps_mail_collection_boxes_all', icon: '📬', color: '#65a30d', title: 'LA County LMS Data USPS Mail Collection Boxes' },
          121: { key: 'la_county_lms_private_industry_all', icon: '🏭', color: '#4ade80', title: 'LA County LMS Data Private Industry' },
          122: { key: 'la_county_lms_agriculture_food_all', icon: '🌾', color: '#22c55e', title: 'LA County LMS Data Agriculture and Food' },
          123: { key: 'la_county_lms_banking_finance_all', icon: '🏦', color: '#16a34a', title: 'LA County LMS Data Banking and Finance' },
          124: { key: 'la_county_lms_business_centers_all', icon: '🏢', color: '#15803d', title: 'LA County LMS Data Business Centers' },
          125: { key: 'la_county_lms_corporate_headquarters_all', icon: '🏢', color: '#166534', title: 'LA County LMS Data Corporate Headquarters' },
          126: { key: 'la_county_lms_manufacturing_all', icon: '🏭', color: '#14532d', title: 'LA County LMS Data Manufacturing' },
          127: { key: 'la_county_lms_mines_all', icon: '⛏️', color: '#0ea5e9', title: 'LA County LMS Data Mines' },
          128: { key: 'la_county_lms_oilfields_all', icon: '🛢️', color: '#0284c7', title: 'LA County LMS Data Oilfields' },
          129: { key: 'la_county_lms_shopping_centers_all', icon: '🛍️', color: '#0369a1', title: 'LA County LMS Data Shopping Centers' },
          130: { key: 'la_county_lms_tv_movie_studios_all', icon: '🎬', color: '#075985', title: 'LA County LMS Data TV and Movie Studios' },
          131: { key: 'la_county_lms_public_safety_all', icon: '🚨', color: '#0c4a6e', title: 'LA County LMS Data Public Safety' },
          132: { key: 'la_county_lms_courthouses_all', icon: '⚖️', color: '#082f49', title: 'LA County LMS Data Courthouses' },
          133: { key: 'la_county_lms_crime_prevention_support_all', icon: '🛡️', color: '#3b82f6', title: 'LA County LMS Data Crime Prevention and Support' },
          134: { key: 'la_county_lms_crime_reporting_investigation_all', icon: '🔍', color: '#2563eb', title: 'LA County LMS Data Crime Reporting and Investigation' },
          135: { key: 'la_county_lms_district_attorney_all', icon: '⚖️', color: '#1d4ed8', title: 'LA County LMS Data District Attorney' },
          136: { key: 'la_county_lms_fingerprinting_all', icon: '👆', color: '#1e40af', title: 'LA County LMS Data Fingerprinting' },
          137: { key: 'la_county_lms_fire_stations_all', icon: '🚒', color: '#1e3a8a', title: 'LA County LMS Data Fire Stations' },
          138: { key: 'la_county_lms_jails_prisons_all', icon: '🔒', color: '#172554', title: 'LA County LMS Data Jails and Prisons' },
          139: { key: 'la_county_lms_legal_services_counseling_all', icon: '⚖️', color: '#0f172a', title: 'LA County LMS Data Legal Services and Counseling' },
          140: { key: 'la_county_lms_lifeguard_towers_all', icon: '🏖️', color: '#ef4444', title: 'LA County LMS Data Lifeguard Towers' },
          141: { key: 'la_county_lms_parole_offender_assistance_all', icon: '👤', color: '#dc2626', title: 'LA County LMS Data Parole and Offender Assistance' },
          142: { key: 'la_county_lms_probation_camps_juvenile_halls_all', icon: '🏫', color: '#b91c1c', title: 'LA County LMS Data Probation Camps and Juvenile Halls' },
          143: { key: 'la_county_lms_probation_offices_all', icon: '🏢', color: '#991b1b', title: 'LA County LMS Data Probation Offices' },
          144: { key: 'la_county_lms_public_defender_all', icon: '⚖️', color: '#7f1d1d', title: 'LA County LMS Data Public Defender' },
          145: { key: 'la_county_lms_self_help_legal_centers_all', icon: '📚', color: '#450a0a', title: 'LA County LMS Data Self-Help Legal Centers' },
          146: { key: 'la_county_lms_sheriff_police_stations_all', icon: '🚔', color: '#f97316', title: 'LA County LMS Data Sheriff and Police Stations' },
          147: { key: 'la_county_lms_social_services_all', icon: '🤝', color: '#ea580c', title: 'LA County LMS Data Social Services' },
          148: { key: 'la_county_lms_adoption_all', icon: '👶', color: '#c2410c', title: 'LA County LMS Data Adoption' },
          149: { key: 'la_county_lms_child_care_all', icon: '👶', color: '#9a3412', title: 'LA County LMS Data Child Care' },
          150: { key: 'la_county_lms_child_support_services_all', icon: '👨‍👩‍👧‍👦', color: '#7c2d12', title: 'LA County LMS Data Child Support Services' },
          151: { key: 'la_county_lms_children_family_services_all', icon: '👨‍👩‍👧‍👦', color: '#431407', title: 'LA County LMS Data Children and Family Services' },
          152: { key: 'la_county_lms_clothing_all', icon: '👕', color: '#f59e0b', title: 'LA County LMS Data Clothing' },
          153: { key: 'la_county_lms_disability_support_services_all', icon: '♿', color: '#d97706', title: 'LA County LMS Data Disability Support Services' },
          154: { key: 'la_county_lms_domestic_violence_services_all', icon: '🛡️', color: '#b45309', title: 'LA County LMS Data Domestic Violence Services' },
          155: { key: 'la_county_lms_donation_services_all', icon: '🎁', color: '#92400e', title: 'LA County LMS Data Donation Services' },
          156: { key: 'la_county_lms_food_assistance_all', icon: '🍽️', color: '#78350f', title: 'LA County LMS Data Food Assistance' },
          157: { key: 'la_county_lms_forms_assistance_all', icon: '📝', color: '#713f12', title: 'LA County LMS Data Forms Assistance' },
          158: { key: 'la_county_lms_homeless_shelters_services_all', icon: '🏠', color: '#65a30d', title: 'LA County LMS Data Homeless Shelters and Services' },
          159: { key: 'la_county_lms_housing_assistance_information_all', icon: '🏘️', color: '#4ade80', title: 'LA County LMS Data Housing Assistance and Information' },
          160: { key: 'la_county_lms_immigration_all', icon: '🛂', color: '#22c55e', title: 'LA County LMS Data Immigration' },
          161: { key: 'la_county_lms_job_training_all', icon: '💼', color: '#16a34a', title: 'LA County LMS Data Job Training' },
          162: { key: 'la_county_lms_neg_program_worksource_centers_all', icon: '💼', color: '#15803d', title: 'LA County LMS Data NEG Program WorkSource Centers' },
          163: { key: 'la_county_lms_payment_assistance_all', icon: '💰', color: '#166534', title: 'LA County LMS Data Payment Assistance' },
          164: { key: 'la_county_lms_public_housing_all', icon: '🏘️', color: '#14532d', title: 'LA County LMS Data Public Housing' },
          165: { key: 'la_county_lms_public_information_services_all', icon: 'ℹ️', color: '#0ea5e9', title: 'LA County LMS Data Public Information Services' },
          166: { key: 'la_county_lms_senior_services_all', icon: '👴', color: '#0284c7', title: 'LA County LMS Data Senior Services' },
          167: { key: 'la_county_lms_support_groups_all', icon: '👥', color: '#0369a1', title: 'LA County LMS Data Support Groups' },
          168: { key: 'la_county_lms_thrift_shops_all', icon: '🛍️', color: '#075985', title: 'LA County LMS Data Thrift Shops' },
          169: { key: 'la_county_lms_transportation_assistance_all', icon: '🚗', color: '#0c4a6e', title: 'LA County LMS Data Transportation Assistance' },
          170: { key: 'la_county_lms_unemployment_insurance_offices_all', icon: '💼', color: '#082f49', title: 'LA County LMS Data Unemployment Insurance Offices' },
          171: { key: 'la_county_lms_veterans_services_all', icon: '🎖️', color: '#3b82f6', title: 'LA County LMS Data Veterans Services' },
          172: { key: 'la_county_lms_welfare_offices_programs_all', icon: '💳', color: '#2563eb', title: 'LA County LMS Data Welfare Offices and Programs' },
          173: { key: 'la_county_lms_transportation_all', icon: '🚗', color: '#1d4ed8', title: 'LA County LMS Data Transportation' },
          174: { key: 'la_county_lms_airports_all', icon: '✈️', color: '#1e40af', title: 'LA County LMS Data Airports' },
          175: { key: 'la_county_lms_alternative_fuel_all', icon: '⛽', color: '#1e3a8a', title: 'LA County LMS Data Alternative Fuel' },
          176: { key: 'la_county_lms_amtrak_stations_all', icon: '🚂', color: '#172554', title: 'LA County LMS Data Amtrak Stations' },
          177: { key: 'la_county_lms_anchorages_all', icon: '⚓', color: '#0f172a', title: 'LA County LMS Data Anchorages' },
          178: { key: 'la_county_lms_automatic_traffic_counters_all', icon: '📊', color: '#ef4444', title: 'LA County LMS Data Automatic Traffic Counters' },
          179: { key: 'la_county_lms_breakwaters_all', icon: '🌊', color: '#dc2626', title: 'LA County LMS Data Breakwaters' },
          180: { key: 'la_county_lms_bridges_all', icon: '🌉', color: '#b91c1c', title: 'LA County LMS Data Bridges' },
          181: { key: 'la_county_lms_ferries_all', icon: '⛴️', color: '#991b1b', title: 'LA County LMS Data Ferries' },
          182: { key: 'la_county_lms_freeway_exits_all', icon: '🛣️', color: '#7f1d1d', title: 'LA County LMS Data Freeway Exits' },
          183: { key: 'la_county_lms_heliports_all', icon: '🚁', color: '#450a0a', title: 'LA County LMS Data Heliports' },
          184: { key: 'la_county_lms_intermodal_terminal_facilities_all', icon: '🚚', color: '#f97316', title: 'LA County LMS Data Intermodal Terminal Facilities' },
          185: { key: 'la_county_lms_metro_stations_all', icon: '🚇', color: '#ea580c', title: 'LA County LMS Data Metro Stations' },
          186: { key: 'la_county_lms_metrolink_stations_all', icon: '🚆', color: '#c2410c', title: 'LA County LMS Data Metrolink Stations' },
          187: { key: 'la_county_lms_park_and_ride_locations_all', icon: '🅿️', color: '#9a3412', title: 'LA County LMS Data Park and Ride Locations' },
          188: { key: 'la_county_lms_transit_systems_all', icon: '🚌', color: '#7c2d12', title: 'LA County LMS Data Transit Systems' },
          189: { key: 'la_county_lms_tunnels_all', icon: '🚇', color: '#431407', title: 'LA County LMS Data Tunnels' },
          190: { key: 'la_county_lms_county_fueling_stations_all', icon: '⛽', color: '#f59e0b', title: 'LA County LMS Data County Fueling Stations' },
          191: { key: 'la_county_lms_county_electric_charging_stations_all', icon: '🔌', color: '#d97706', title: 'LA County LMS Data County Electric Charging Stations' },
          192: { key: 'la_county_lms_warming_centers_all', icon: '🔥', color: '#b45309', title: 'LA County LMS Data Warming Centers' }
        };
        return layerNames[i] || { key: `la_county_lms_layer_${i}_all`, icon: '📍', color: '#6366f1', title: `LA County LMS Data Layer ${i}` };
      });

      laCountyLMSLayers.forEach(({ key, icon, color, title }) => {
        try {
          if (enrichments[key] && Array.isArray(enrichments[key])) {
            let featureCount = 0;
            enrichments[key].forEach((lmsFeature: any) => {
              try {
                // Handle point geometry
                if (lmsFeature.geometry && lmsFeature.geometry.x && lmsFeature.geometry.y) {
                  const lat = lmsFeature.geometry.y;
                  const lon = lmsFeature.geometry.x;
                  
                  const marker = L.marker([lat, lon], {
                    icon: createPOIIcon(icon, color)
                  });
                  
                  const lmsId = lmsFeature.lmsId || lmsFeature.OBJECTID || lmsFeature.objectid || lmsFeature.ID || lmsFeature.id || lmsFeature.NAME || lmsFeature.Name || lmsFeature.name || 'Unknown';
                  const distance = lmsFeature.distance_miles !== null && lmsFeature.distance_miles !== undefined ? lmsFeature.distance_miles : 0;
                  const isContaining = lmsFeature.isContaining;
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ${icon} ${title}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${lmsId ? `<div><strong>ID:</strong> ${lmsId}</div>` : ''}
                        ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this feature</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['lmsId', 'OBJECTID', 'objectid', 'ID', 'id', 'NAME', 'Name', 'name', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                  Object.entries(lmsFeature).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  marker.bindPopup(popupContent);
                  marker.addTo(primary);
                  bounds.extend([lat, lon]);
                  featureCount++;
                }
                // Handle polygon geometry
                else if (lmsFeature.geometry && lmsFeature.geometry.rings) {
                  const rings = lmsFeature.geometry.rings;
                  if (rings && rings.length > 0) {
                    const outerRing = rings[0];
                    const latlngs = outerRing.map((coord: number[]) => {
                      return [coord[1], coord[0]] as [number, number];
                    });
                    
                    if (latlngs.length < 3) {
                      console.warn(`${title} polygon has less than 3 coordinates, skipping`);
                      return;
                    }
                    
                    const isContaining = lmsFeature.isContaining;
                    const polygonColor = isContaining ? color : color.replace('ff', 'cc');
                    const weight = isContaining ? 3 : 2;
                    const opacity = isContaining ? 0.8 : 0.5;
                    
                    const polygon = L.polygon(latlngs, {
                      color: polygonColor,
                      weight: weight,
                      opacity: opacity,
                      fillColor: color,
                      fillOpacity: 0.15
                    });
                    
                    const lmsId = lmsFeature.lmsId || lmsFeature.OBJECTID || lmsFeature.objectid || lmsFeature.ID || lmsFeature.id || lmsFeature.NAME || lmsFeature.Name || lmsFeature.name || 'Unknown';
                    const distance = lmsFeature.distance_miles !== null && lmsFeature.distance_miles !== undefined ? lmsFeature.distance_miles : 0;
                    
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          ${icon} ${title}
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${lmsId ? `<div><strong>ID:</strong> ${lmsId}</div>` : ''}
                          ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this boundary</div>` : ''}
                          ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    const excludeFields = ['lmsId', 'OBJECTID', 'objectid', 'ID', 'id', 'NAME', 'Name', 'name', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                    Object.entries(lmsFeature).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polygon.bindPopup(popupContent);
                    polygon.addTo(primary);
                    const polygonBounds = L.latLngBounds(latlngs);
                    bounds.extend(polygonBounds);
                    featureCount++;
                  }
                }
                // Handle polyline geometry
                else if (lmsFeature.geometry && lmsFeature.geometry.paths) {
                  const paths = lmsFeature.geometry.paths;
                  if (paths && paths.length > 0) {
                    paths.forEach((path: number[][]) => {
                      const latlngs = path.map((coord: number[]) => {
                        return [coord[1], coord[0]] as [number, number];
                      });
                      
                      const isContaining = lmsFeature.isContaining;
                      const lineColor = isContaining ? color : color.replace('ff', 'cc');
                      const weight = isContaining ? 4 : 2;
                      const opacity = isContaining ? 0.9 : 0.6;
                      
                      const polyline = L.polyline(latlngs, {
                        color: lineColor,
                        weight: weight,
                        opacity: opacity
                      });
                      
                      const lmsId = lmsFeature.lmsId || lmsFeature.OBJECTID || lmsFeature.objectid || lmsFeature.ID || lmsFeature.id || lmsFeature.NAME || lmsFeature.Name || lmsFeature.name || 'Unknown';
                      const distance = lmsFeature.distance_miles !== null && lmsFeature.distance_miles !== undefined ? lmsFeature.distance_miles : 0;
                      
                      let popupContent = `
                        <div style="min-width: 250px; max-width: 400px;">
                          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                            ${icon} ${title}
                          </h3>
                          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                            ${lmsId ? `<div><strong>ID:</strong> ${lmsId}</div>` : ''}
                            ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is on this line</div>` : ''}
                            ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                          </div>
                          <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                      `;
                      
                      const excludeFields = ['lmsId', 'OBJECTID', 'objectid', 'ID', 'id', 'NAME', 'Name', 'name', 'geometry', 'distance_miles', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                      Object.entries(lmsFeature).forEach(([key, value]) => {
                        if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                          if (typeof value === 'object' && !Array.isArray(value)) {
                            return;
                          }
                          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                          popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                        }
                      });
                      
                      popupContent += `
                          </div>
                        </div>
                      `;
                      
                      polyline.bindPopup(popupContent);
                      polyline.addTo(primary);
                      const polylineBounds = L.latLngBounds(latlngs);
                      bounds.extend(polylineBounds);
                      featureCount++;
                    });
                  }
                }
              } catch (error) {
                console.error(`Error drawing ${title} feature:`, error);
              }
            });
            
            if (featureCount > 0) {
              const legendKey = key.replace('_all', '');
              if (!legendAccumulator[legendKey]) {
                legendAccumulator[legendKey] = {
                  icon: icon,
                  color: color,
                  title: title,
                  count: 0,
                };
              }
              legendAccumulator[legendKey].count += featureCount;
            }
          }
        } catch (error) {
          console.error(`Error processing ${title}:`, error);
        }
      });

      // Draw LA County Political Boundaries layers
      const laCountyPoliticalBoundariesLayers = [
        { key: 'la_county_political_boundaries_districts_2021_all', layerId: 24, icon: '🗳️', color: '#3b82f6', title: 'LA County Districts (2021)' },
        { key: 'la_county_political_boundaries_supervisorial_current_all', layerId: 27, icon: '🏛️', color: '#2563eb', title: 'LA County Supervisorial District (Current)' },
        { key: 'la_county_political_boundaries_supervisorial_2021_all', layerId: 26, icon: '🏛️', color: '#1d4ed8', title: 'LA County Supervisorial District (2021)' },
        { key: 'la_county_political_boundaries_congressional_2021_all', layerId: 29, icon: '🏛️', color: '#1e40af', title: 'LA County Congressional District (2021)' },
        { key: 'la_county_political_boundaries_state_assembly_2021_all', layerId: 30, icon: '🏛️', color: '#1e3a8a', title: 'LA County State Assembly District (2021)' },
        { key: 'la_county_political_boundaries_state_senate_2021_all', layerId: 31, icon: '🏛️', color: '#172554', title: 'LA County State Senate District (2021)' },
        { key: 'la_county_political_boundaries_board_equalization_2021_all', layerId: 32, icon: '⚖️', color: '#0f172a', title: 'LA County Board of Equalization (2021)' },
        { key: 'la_county_political_boundaries_city_council_2021_all', layerId: 33, icon: '🏛️', color: '#6366f1', title: 'LA City Council Districts (2021)' },
        { key: 'la_county_political_boundaries_districts_2011_all', layerId: 0, icon: '🗳️', color: '#4f46e5', title: 'LA County Districts (2011)' },
        { key: 'la_county_political_boundaries_supervisorial_2011_all', layerId: 1, icon: '🏛️', color: '#4338ca', title: 'LA County Supervisorial District (2011)' },
        { key: 'la_county_political_boundaries_congressional_2011_all', layerId: 2, icon: '🏛️', color: '#3730a3', title: 'LA County Congressional District (2011)' },
        { key: 'la_county_political_boundaries_state_assembly_2011_all', layerId: 3, icon: '🏛️', color: '#312e81', title: 'LA County State Assembly District (2011)' },
        { key: 'la_county_political_boundaries_state_senate_2011_all', layerId: 4, icon: '🏛️', color: '#1e1b4b', title: 'LA County State Senate District (2011)' },
        { key: 'la_county_political_boundaries_board_equalization_2011_all', layerId: 5, icon: '⚖️', color: '#9333ea', title: 'LA County Board of Equalization (2011)' },
        { key: 'la_county_political_boundaries_city_council_2012_all', layerId: 6, icon: '🏛️', color: '#8b5cf6', title: 'LA City Council Districts (2012)' },
        { key: 'la_county_political_boundaries_districts_2001_all', layerId: 7, icon: '🗳️', color: '#7c3aed', title: 'LA County Districts (2001)' },
        { key: 'la_county_political_boundaries_supervisorial_2001_all', layerId: 8, icon: '🏛️', color: '#6d28d9', title: 'LA County Supervisorial Districts (2001)' },
        { key: 'la_county_political_boundaries_congressional_2001_all', layerId: 9, icon: '🏛️', color: '#5b21b6', title: 'LA County Congressional Districts (2001)' },
        { key: 'la_county_political_boundaries_state_assembly_2001_all', layerId: 10, icon: '🏛️', color: '#4c1d95', title: 'LA County State Assembly Districts (2001)' },
        { key: 'la_county_political_boundaries_state_senate_2001_all', layerId: 11, icon: '🏛️', color: '#3b0764', title: 'LA County State Senate Districts (2001)' },
        { key: 'la_county_political_boundaries_city_council_2002_all', layerId: 12, icon: '🏛️', color: '#2e1065', title: 'LA City Council Districts (2002)' },
        { key: 'la_county_political_boundaries_districts_1971_1991_all', layerId: 13, icon: '🗳️', color: '#1e1b4b', title: 'LA County Districts (1971-1991)' },
        { key: 'la_county_political_boundaries_supervisorial_1991_all', layerId: 14, icon: '🏛️', color: '#ec4899', title: 'LA County Supervisorial Districts (1991)' },
        { key: 'la_county_political_boundaries_supervisorial_1981_all', layerId: 15, icon: '🏛️', color: '#db2777', title: 'LA County Supervisorial Districts (1981)' },
        { key: 'la_county_political_boundaries_supervisorial_1971_all', layerId: 16, icon: '🏛️', color: '#be185d', title: 'LA County Supervisorial Districts (1971)' },
        { key: 'la_county_political_boundaries_other_all', layerId: 36, icon: '🗺️', color: '#9f1239', title: 'LA County Other Political Boundaries' },
        { key: 'la_county_political_boundaries_school_districts_all', layerId: 25, icon: '🏫', color: '#831843', title: 'LA County School Districts' },
        { key: 'la_county_political_boundaries_registrar_precincts_all', layerId: 34, icon: '🗳️', color: '#701a75', title: 'LA County Registrar Recorder Precincts' },
        { key: 'la_county_political_boundaries_election_precincts_all', layerId: 37, icon: '🗳️', color: '#f59e0b', title: 'LA County Registrar Recorder Election Precincts' },
        { key: 'la_county_political_boundaries_city_county_all', layerId: 17, icon: '🏘️', color: '#d97706', title: 'LA County City and County Boundaries' },
        { key: 'la_county_political_boundaries_county_boundaries_all', layerId: 18, icon: '🗺️', color: '#b45309', title: 'LA County County Boundaries' },
        { key: 'la_county_political_boundaries_city_boundaries_all', layerId: 19, icon: '🏘️', color: '#92400e', title: 'LA County City Boundaries' },
        { key: 'la_county_political_boundaries_community_boundaries_all', layerId: 23, icon: '🏘️', color: '#78350f', title: 'LA County Community Boundaries (CSA)' },
        { key: 'la_county_political_boundaries_city_annexations_all', layerId: 21, icon: '📋', color: '#713f12', title: 'LA County City Annexations' }
      ];

      laCountyPoliticalBoundariesLayers.forEach(({ key, icon, color, title }) => {
        try {
          if (enrichments[key] && Array.isArray(enrichments[key])) {
            let featureCount = 0;
            enrichments[key].forEach((boundary: any) => {
              if (boundary.geometry && boundary.geometry.rings) {
                try {
                  const rings = boundary.geometry.rings;
                  if (rings && rings.length > 0) {
                    const outerRing = rings[0];
                    const latlngs = outerRing.map((coord: number[]) => {
                      return [coord[1], coord[0]] as [number, number];
                    });
                    
                    if (latlngs.length < 3) {
                      console.warn(`${title} polygon has less than 3 coordinates, skipping`);
                      return;
                    }
                    
                    const isContaining = boundary.isContaining;
                    const polygonColor = isContaining ? color : color.replace('ff', 'cc');
                    const weight = isContaining ? 3 : 2;
                    const opacity = isContaining ? 0.8 : 0.5;
                    
                    const polygon = L.polygon(latlngs, {
                      color: polygonColor,
                      weight: weight,
                      opacity: opacity,
                      fillColor: color,
                      fillOpacity: 0.15
                    });
                    
                    const boundaryId = boundary.boundaryId || boundary.DISTRICT || boundary.district || boundary.DISTRICT_NUM || boundary.district_num || boundary.DISTRICT_NUMBER || boundary.district_number || boundary.NAME || boundary.Name || boundary.name || boundary.OBJECTID || boundary.objectid || 'Unknown';
                    
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          ${icon} ${title}
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${boundaryId ? `<div><strong>ID:</strong> ${boundaryId}</div>` : ''}
                          ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this boundary</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    const excludeFields = ['boundaryId', 'DISTRICT', 'district', 'DISTRICT_NUM', 'district_num', 'DISTRICT_NUMBER', 'district_number', 'NAME', 'Name', 'name', 'OBJECTID', 'objectid', 'geometry', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining'];
                    Object.entries(boundary).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polygon.bindPopup(popupContent);
                    polygon.addTo(primary);
                    const polygonBounds = L.latLngBounds(latlngs);
                    bounds.extend(polygonBounds);
                    featureCount++;
                  }
                } catch (error) {
                  console.error(`Error drawing ${title} polygon:`, error);
                }
              }
            });
            
            if (featureCount > 0) {
              const legendKey = key.replace('_all', '');
              if (!legendAccumulator[legendKey]) {
                legendAccumulator[legendKey] = {
                  icon: icon,
                  color: color,
                  title: title,
                  count: 0,
                };
              }
              legendAccumulator[legendKey].count += featureCount;
            }
          }
        } catch (error) {
          console.error(`Error processing ${title}:`, error);
        }
      });

      // Draw LA County Redistricting Data layers
      // Create a comprehensive list of all redistricting layers with their metadata
      const laCountyRedistrictingLayers = [
        { key: 'la_county_redistricting_geography_all', layerId: 0, icon: '🗺️', color: '#3b82f6', title: 'LA County Redistricting Geography' },
        { key: 'la_county_redistricting_communities_2011_all', layerId: 1, icon: '🏘️', color: '#2563eb', title: 'LA County Redistricting Communities (2011)' },
        { key: 'la_county_redistricting_home_income_info_all', layerId: 3, icon: '🏠', color: '#1d4ed8', title: 'LA County Home and Income Information' },
        { key: 'la_county_redistricting_housing_data_all', layerId: 4, icon: '🏘️', color: '#1e40af', title: 'LA County Housing Data' },
        { key: 'la_county_redistricting_pct_owners_all', layerId: 5, icon: '🏡', color: '#1e3a8a', title: 'LA County % Owners' },
        { key: 'la_county_redistricting_pct_renters_all', layerId: 6, icon: '🏠', color: '#172554', title: 'LA County % Renters' },
        { key: 'la_county_redistricting_homes_lt_200k_all', layerId: 7, icon: '💰', color: '#0f172a', title: 'LA County % Homes < $200,000' },
        { key: 'la_county_redistricting_homes_200k_399k_all', layerId: 8, icon: '💰', color: '#6366f1', title: 'LA County % Homes $200,000 - $399,000' },
        { key: 'la_county_redistricting_homes_400k_749k_all', layerId: 9, icon: '💰', color: '#4f46e5', title: 'LA County % Homes $400,000 - $749,000' },
        { key: 'la_county_redistricting_homes_750k_plus_all', layerId: 10, icon: '💰', color: '#4338ca', title: 'LA County % Homes $750,000+' },
        { key: 'la_county_redistricting_home_value_preponderance_all', layerId: 11, icon: '📊', color: '#3730a3', title: 'LA County Home Value Preponderance' },
        { key: 'la_county_redistricting_income_data_all', layerId: 12, icon: '💵', color: '#312e81', title: 'LA County Income Data' },
        { key: 'la_county_redistricting_income_lt_25k_all', layerId: 13, icon: '💵', color: '#1e1b4b', title: 'LA County % Households w/ Income < $25,000' },
        { key: 'la_county_redistricting_income_25k_49k_all', layerId: 14, icon: '💵', color: '#9333ea', title: 'LA County % Households w/ Income $25,000 - $49,999' },
        { key: 'la_county_redistricting_income_50k_99k_all', layerId: 15, icon: '💵', color: '#8b5cf6', title: 'LA County % Households w/ Income $50,000 - $99,999' },
        { key: 'la_county_redistricting_income_100k_plus_all', layerId: 16, icon: '💵', color: '#7c3aed', title: 'LA County % Households w/ Income $100,000+' },
        { key: 'la_county_redistricting_income_preponderance_all', layerId: 17, icon: '📊', color: '#6d28d9', title: 'LA County Household Income Preponderance' },
        { key: 'la_county_redistricting_other_all', layerId: 18, icon: '📋', color: '#5b21b6', title: 'LA County Other' },
        { key: 'la_county_redistricting_population_density_all', layerId: 19, icon: '👥', color: '#4c1d95', title: 'LA County Population Density (Residential)' },
        { key: 'la_county_redistricting_pct_over_18_all', layerId: 20, icon: '👤', color: '#3b0764', title: 'LA County % Population Over 18' },
        { key: 'la_county_redistricting_pct_no_hs_diploma_all', layerId: 21, icon: '🎓', color: '#2e1065', title: 'LA County % No High School Diploma' },
        { key: 'la_county_redistricting_pct_below_poverty_all', layerId: 22, icon: '📉', color: '#1e1b4b', title: 'LA County % Below Poverty Level' },
        { key: 'la_county_redistricting_voter_registration_all', layerId: 23, icon: '🗳️', color: '#ec4899', title: 'LA County Voter Registration Data' },
        { key: 'la_county_redistricting_registration_by_age_all', layerId: 24, icon: '👥', color: '#db2777', title: 'LA County Registration by Age' },
        { key: 'la_county_redistricting_voter_age_18_34_all', layerId: 25, icon: '👤', color: '#be185d', title: 'LA County % Voter Age 18 to 34' },
        { key: 'la_county_redistricting_voter_age_35_49_all', layerId: 26, icon: '👤', color: '#9f1239', title: 'LA County % Voter Age 35 - 49' },
        { key: 'la_county_redistricting_voter_age_50_64_all', layerId: 27, icon: '👤', color: '#831843', title: 'LA County % Voter Age 50 - 64' },
        { key: 'la_county_redistricting_voter_age_65_plus_all', layerId: 28, icon: '👤', color: '#701a75', title: 'LA County % Voter Age 65+' },
        { key: 'la_county_redistricting_registration_by_surname_all', layerId: 29, icon: '📝', color: '#f59e0b', title: 'LA County Registration by Surname' },
        { key: 'la_county_redistricting_surname_not_classified_all', layerId: 30, icon: '❓', color: '#d97706', title: 'LA County % Surname Not Classified' },
        { key: 'la_county_redistricting_surname_spanish_all', layerId: 31, icon: '🇪🇸', color: '#b45309', title: 'LA County % Spanish Surname' },
        { key: 'la_county_redistricting_surname_asian_all', layerId: 32, icon: '🇦🇸', color: '#92400e', title: 'LA County % Asian Surname' },
        { key: 'la_county_redistricting_registration_by_party_all', layerId: 33, icon: '🏛️', color: '#78350f', title: 'LA County Registration by Party' },
        { key: 'la_county_redistricting_party_decline_to_state_all', layerId: 34, icon: '⚪', color: '#713f12', title: 'LA County % Decline to State' },
        { key: 'la_county_redistricting_party_republican_all', layerId: 35, icon: '🔴', color: '#dc2626', title: 'LA County % Republican' },
        { key: 'la_county_redistricting_party_democratic_all', layerId: 36, icon: '🔵', color: '#2563eb', title: 'LA County % Democratic Registration' },
        { key: 'la_county_redistricting_registration_by_sex_all', layerId: 37, icon: '👥', color: '#1d4ed8', title: 'LA County Registration by Sex' },
        { key: 'la_county_redistricting_sex_male_all', layerId: 38, icon: '♂️', color: '#1e40af', title: 'LA County % Male' },
        { key: 'la_county_redistricting_sex_female_all', layerId: 39, icon: '♀️', color: '#1e3a8a', title: 'LA County % Female' },
        { key: 'la_county_redistricting_citizen_voting_age_pop_all', layerId: 40, icon: '🗳️', color: '#172554', title: 'LA County Citizen Voting Age Population' },
        { key: 'la_county_redistricting_cvap_hispanic_all', layerId: 41, icon: '👤', color: '#0f172a', title: 'LA County % Hispanic Citizen Voting Age' },
        { key: 'la_county_redistricting_cvap_white_all', layerId: 42, icon: '👤', color: '#6366f1', title: 'LA County % White Citizen Voting Age' },
        { key: 'la_county_redistricting_cvap_african_american_all', layerId: 43, icon: '👤', color: '#4f46e5', title: 'LA County % African American Citizen Voting Age' },
        { key: 'la_county_redistricting_cvap_asian_all', layerId: 44, icon: '👤', color: '#4338ca', title: 'LA County % Asian Citizen Voting Age' },
        { key: 'la_county_redistricting_demographic_data_all', layerId: 45, icon: '📊', color: '#3730a3', title: 'LA County Demographic Data' },
        { key: 'la_county_redistricting_pop_2010_by_race_all', layerId: 46, icon: '👥', color: '#312e81', title: 'LA County 2010 Population by Race' },
        { key: 'la_county_redistricting_pop_2010_hispanic_all', layerId: 47, icon: '👤', color: '#1e1b4b', title: 'LA County % 2010 Population that is Hispanic' },
        { key: 'la_county_redistricting_pop_2010_nh_white_all', layerId: 48, icon: '👤', color: '#9333ea', title: 'LA County % 2010 Population that is NH-White' },
        { key: 'la_county_redistricting_pop_2010_nh_african_american_all', layerId: 49, icon: '👤', color: '#8b5cf6', title: 'LA County % 2010 Population that is NH-African American' },
        { key: 'la_county_redistricting_pop_2010_nh_asian_all', layerId: 50, icon: '👤', color: '#7c3aed', title: 'LA County % 2010 Population that is NH-Asian' },
        { key: 'la_county_redistricting_pop_2010_over_18_by_race_all', layerId: 51, icon: '👥', color: '#6d28d9', title: 'LA County 2010 Population over 18 by Race' },
        { key: 'la_county_redistricting_pop_over_18_hispanic_all', layerId: 52, icon: '👤', color: '#5b21b6', title: 'LA County % 2010 Pop over 18 - Hispanic' },
        { key: 'la_county_redistricting_pop_over_18_nh_white_all', layerId: 53, icon: '👤', color: '#4c1d95', title: 'LA County % 2010 Pop over 18 - NH-White' },
        { key: 'la_county_redistricting_pop_over_18_nh_african_american_all', layerId: 54, icon: '👤', color: '#3b0764', title: 'LA County % 2010 Pop over 18 - NH-African American' },
        { key: 'la_county_redistricting_pop_over_18_nh_asian_all', layerId: 55, icon: '👤', color: '#2e1065', title: 'LA County % 2010 Pop over 18 - NH-Asian' },
        { key: 'la_county_redistricting_pop_2010_by_race_inclusive_all', layerId: 56, icon: '👥', color: '#1e1b4b', title: 'LA County 2010 Population by Race (Inclusive)' },
        { key: 'la_county_redistricting_pop_incl_hispanic_all', layerId: 57, icon: '👤', color: '#ec4899', title: 'LA County % 2010 Pop (Incl) - Hispanic' },
        { key: 'la_county_redistricting_pop_incl_nh_white_all', layerId: 58, icon: '👤', color: '#db2777', title: 'LA County % 2010 Pop (Incl) - NH-White' },
        { key: 'la_county_redistricting_pop_incl_nh_african_american_all', layerId: 59, icon: '👤', color: '#be185d', title: 'LA County % 2010 Pop (Incl) - NH-African American' },
        { key: 'la_county_redistricting_pop_incl_nh_asian_all', layerId: 60, icon: '👤', color: '#9f1239', title: 'LA County % 2010 Pop (Incl) - NH-Asian' },
        { key: 'la_county_redistricting_cvap_2010_all', layerId: 61, icon: '🗳️', color: '#831843', title: 'LA County 2010 Citizen Voting Age Population (CVAP)' },
        { key: 'la_county_redistricting_cvap_2010_hispanic_all', layerId: 62, icon: '👤', color: '#701a75', title: 'LA County % 2010 CVAP Population - Hispanic' },
        { key: 'la_county_redistricting_cvap_2010_nh_white_all', layerId: 63, icon: '👤', color: '#f59e0b', title: 'LA County % 2010 CVAP Population - NH-White' },
        { key: 'la_county_redistricting_cvap_2010_nh_african_american_all', layerId: 64, icon: '👤', color: '#d97706', title: 'LA County % 2010 CVAP Population - NH-African American' },
        { key: 'la_county_redistricting_cvap_2010_nh_asian_all', layerId: 65, icon: '👤', color: '#b45309', title: 'LA County % 2010 CVAP Population - NH-Asian' },
        { key: 'la_county_redistricting_language_all', layerId: 66, icon: '🗣️', color: '#92400e', title: 'LA County Language' },
        { key: 'la_county_redistricting_pct_not_fluent_english_all', layerId: 67, icon: '❌', color: '#78350f', title: 'LA County % Not Fluent in English' },
        { key: 'la_county_redistricting_lang_arabic_all', layerId: 68, icon: '🇸🇦', color: '#713f12', title: 'LA County % Arabic Primary Language' },
        { key: 'la_county_redistricting_lang_armenian_all', layerId: 69, icon: '🇦🇲', color: '#dc2626', title: 'LA County % Armenian Primary Language' },
        { key: 'la_county_redistricting_lang_chinese_all', layerId: 70, icon: '🇨🇳', color: '#2563eb', title: 'LA County % Chinese Primary Language' },
        { key: 'la_county_redistricting_lang_cambodian_all', layerId: 71, icon: '🇰🇭', color: '#1d4ed8', title: 'LA County % Cambodian Primary Language' },
        { key: 'la_county_redistricting_lang_english_all', layerId: 72, icon: '🇺🇸', color: '#1e40af', title: 'LA County % English Primary Language' },
        { key: 'la_county_redistricting_lang_farsi_all', layerId: 73, icon: '🇮🇷', color: '#1e3a8a', title: 'LA County % Farsi Primary Language' },
        { key: 'la_county_redistricting_lang_korean_all', layerId: 74, icon: '🇰🇷', color: '#172554', title: 'LA County % Korean Primary Language' },
        { key: 'la_county_redistricting_lang_russian_all', layerId: 75, icon: '🇷🇺', color: '#0f172a', title: 'LA County % Russian Primary Language' },
        { key: 'la_county_redistricting_lang_spanish_all', layerId: 76, icon: '🇪🇸', color: '#6366f1', title: 'LA County % Spanish Primary Language' },
        { key: 'la_county_redistricting_lang_tagalog_all', layerId: 77, icon: '🇵🇭', color: '#4f46e5', title: 'LA County % Tagalog Primary Language' },
        { key: 'la_county_redistricting_lang_vietnamese_all', layerId: 78, icon: '🇻🇳', color: '#4338ca', title: 'LA County % Vietnamese Primary Language' },
        { key: 'la_county_redistricting_lang_other_all', layerId: 79, icon: '🌐', color: '#3730a3', title: 'LA County % Some Other Language Primary Language' }
      ];

      laCountyRedistrictingLayers.forEach(({ key, icon, color, title }) => {
        try {
          if (enrichments[key] && Array.isArray(enrichments[key])) {
            let featureCount = 0;
            enrichments[key].forEach((redistricting: any) => {
              if (redistricting.geometry && redistricting.geometry.rings) {
                try {
                  const rings = redistricting.geometry.rings;
                  if (rings && rings.length > 0) {
                    const outerRing = rings[0];
                    const latlngs = outerRing.map((coord: number[]) => {
                      return [coord[1], coord[0]] as [number, number];
                    });
                    
                    if (latlngs.length < 3) {
                      console.warn(`${title} polygon has less than 3 coordinates, skipping`);
                      return;
                    }
                    
                    const isContaining = redistricting.isContaining;
                    const polygonColor = isContaining ? color : color.replace('ff', 'cc');
                    const weight = isContaining ? 3 : 2;
                    const opacity = isContaining ? 0.8 : 0.5;
                    
                    const polygon = L.polygon(latlngs, {
                      color: polygonColor,
                      weight: weight,
                      opacity: opacity,
                      fillColor: color,
                      fillOpacity: 0.15
                    });
                    
                    const redistrictingId = redistricting.redistrictingId || redistricting.COMMUNITY || redistricting.community || redistricting.COMMUNITY_NAME || redistricting.community_name || redistricting.NAME || redistricting.Name || redistricting.name || redistricting.OBJECTID || redistricting.objectid || 'Unknown';
                    
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          ${icon} ${title}
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${redistrictingId ? `<div><strong>ID:</strong> ${redistrictingId}</div>` : ''}
                          ${isContaining ? `<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Location is within this boundary</div>` : ''}
                          ${redistricting.distance_miles !== null && redistricting.distance_miles !== undefined && redistricting.distance_miles > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${redistricting.distance_miles.toFixed(2)} miles</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    const excludeFields = ['redistrictingId', 'COMMUNITY', 'community', 'COMMUNITY_NAME', 'community_name', 'NAME', 'Name', 'name', 'OBJECTID', 'objectid', 'geometry', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'isContaining', 'distance_miles'];
                    Object.entries(redistricting).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polygon.bindPopup(popupContent);
                    polygon.addTo(primary);
                    const polygonBounds = L.latLngBounds(latlngs);
                    bounds.extend(polygonBounds);
                    featureCount++;
                  }
                } catch (error) {
                  console.error(`Error drawing ${title} polygon:`, error);
                }
              }
            });
            
            if (featureCount > 0) {
              const legendKey = key.replace('_all', '');
              if (!legendAccumulator[legendKey]) {
                legendAccumulator[legendKey] = {
                  icon: icon,
                  color: color,
                  title: title,
                  count: 0,
                };
              }
              legendAccumulator[legendKey].count += featureCount;
            }
          }
        } catch (error) {
          console.error(`Error processing ${title}:`, error);
        }
      });

      // Draw LA County Transportation layers
      const laCountyTransportationLayers = [
        { key: 'la_county_transportation_all', layerId: 0, icon: '🚗', color: '#3b82f6', title: 'LA County Transportation', isPoint: true, isLine: true },
        { key: 'la_county_milepost_markers_all', layerId: 1, icon: '📍', color: '#2563eb', title: 'LA County Milepost Markers', isPoint: true, isLine: false },
        { key: 'la_county_rail_transportation_all', layerId: 2, icon: '🚂', color: '#1d4ed8', title: 'LA County Rail Transportation', isPoint: true, isLine: true },
        { key: 'la_county_freeways_all', layerId: 3, icon: '🛣️', color: '#1e40af', title: 'LA County Freeways', isPoint: true, isLine: true },
        { key: 'la_county_disaster_routes_all', layerId: 4, icon: '🚨', color: '#1e3a8a', title: 'LA County Disaster Routes', isPoint: false, isLine: true },
        { key: 'la_county_highway_shields_all', layerId: 5, icon: '🛡️', color: '#172554', title: 'LA County Highway Shields', isPoint: true, isLine: false },
        { key: 'la_county_freeways_lines_all', layerId: 6, icon: '🛣️', color: '#0f172a', title: 'LA County Freeways (Lines)', isPoint: false, isLine: true },
        { key: 'la_county_metro_park_ride_all', layerId: 7, icon: '🅿️', color: '#6366f1', title: 'LA County Metro Park and Ride', isPoint: true, isLine: false },
        { key: 'la_county_metro_stations_all', layerId: 8, icon: '🚇', color: '#4f46e5', title: 'LA County Metro Stations', isPoint: true, isLine: false },
        { key: 'la_county_metrolink_stations_all', layerId: 9, icon: '🚆', color: '#4338ca', title: 'LA County Metrolink Stations', isPoint: true, isLine: false },
        { key: 'la_county_metrolink_lines_all', layerId: 10, icon: '🚆', color: '#3730a3', title: 'LA County Metrolink Lines', isPoint: false, isLine: true },
        { key: 'la_county_metro_lines_all', layerId: 11, icon: '🚇', color: '#312e81', title: 'LA County Metro Lines', isPoint: false, isLine: true },
        { key: 'la_county_railroads_all', layerId: 12, icon: '🚂', color: '#1e1b4b', title: 'LA County Railroads', isPoint: false, isLine: true }
      ];

      laCountyTransportationLayers.forEach(({ key, icon, color, title, isPoint, isLine }) => {
        try {
          if (enrichments[key] && Array.isArray(enrichments[key])) {
            let featureCount = 0;
            enrichments[key].forEach((transportation: any) => {
              try {
                // Handle point geometry
                if (isPoint && transportation.geometry && transportation.geometry.x !== undefined && transportation.geometry.y !== undefined) {
                  const lat = transportation.geometry.y;
                  const lon = transportation.geometry.x;
                  
                  const transportationId = transportation.transportationId || transportation.STATION_NAME || transportation.station_name || transportation.STATION || transportation.station || transportation.NAME || transportation.Name || transportation.name || transportation.OBJECTID || transportation.objectid || 'Unknown';
                  const distance = transportation.distance_miles !== null && transportation.distance_miles !== undefined ? transportation.distance_miles : 0;
                  
                  const marker = L.marker([lat, lon], {
                    icon: L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${icon}</div>`,
                      iconSize: [24, 24],
                      iconAnchor: [12, 12]
                    })
                  });
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        ${icon} ${title}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${transportationId ? `<div><strong>ID:</strong> ${transportationId}</div>` : ''}
                        ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                      </div>
                      <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  `;
                  
                  const excludeFields = ['transportationId', 'STATION_NAME', 'station_name', 'STATION', 'station', 'NAME', 'Name', 'name', 'OBJECTID', 'objectid', 'geometry', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'distance_miles'];
                  Object.entries(transportation).forEach(([key, value]) => {
                    if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                      if (typeof value === 'object' && !Array.isArray(value)) {
                        return;
                      }
                      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                      popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                    }
                  });
                  
                  popupContent += `
                      </div>
                    </div>
                  `;
                  
                  marker.bindPopup(popupContent);
                  marker.addTo(primary);
                  bounds.extend([lat, lon]);
                  featureCount++;
                }
                // Handle line geometry
                else if (isLine && transportation.geometry && transportation.geometry.paths) {
                  const paths = transportation.geometry.paths;
                  if (paths && paths.length > 0) {
                    paths.forEach((path: number[][]) => {
                      const latlngs = path.map((coord: number[]) => {
                        return [coord[1], coord[0]] as [number, number];
                      });
                      
                      const transportationId = transportation.transportationId || transportation.LINE || transportation.line || transportation.ROUTE || transportation.route || transportation.NAME || transportation.Name || transportation.name || 'Unknown';
                      const distance = transportation.distance_miles !== null && transportation.distance_miles !== undefined ? transportation.distance_miles : 0;
                      
                      const polyline = L.polyline(latlngs, {
                        color: color,
                        weight: 3,
                        opacity: 0.7,
                        smoothFactor: 1
                      });
                      
                      let popupContent = `
                        <div style="min-width: 250px; max-width: 400px;">
                          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                            ${icon} ${title}
                          </h3>
                          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                            ${transportationId ? `<div><strong>ID:</strong> ${transportationId}</div>` : ''}
                            ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                          </div>
                          <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                      `;
                      
                      const excludeFields = ['transportationId', 'LINE', 'line', 'ROUTE', 'route', 'NAME', 'Name', 'name', 'OBJECTID', 'objectid', 'geometry', 'FID', 'fid', 'GlobalID', 'GLOBALID', 'distance_miles'];
                      Object.entries(transportation).forEach(([key, value]) => {
                        if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                          if (typeof value === 'object' && !Array.isArray(value)) {
                            return;
                          }
                          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                          popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                        }
                      });
                      
                      popupContent += `
                          </div>
                        </div>
                      `;
                      
                      polyline.bindPopup(popupContent);
                      polyline.addTo(primary);
                      const polylineBounds = L.latLngBounds(latlngs);
                      bounds.extend(polylineBounds);
                      featureCount++;
                    });
                  }
                }
              } catch (error) {
                console.error(`Error drawing ${title} feature:`, error);
              }
            });
            
            if (featureCount > 0) {
              const legendKey = key.replace('_all', '');
              if (!legendAccumulator[legendKey]) {
                legendAccumulator[legendKey] = {
                  icon: icon,
                  color: color,
                  title: title,
                  count: 0,
                };
              }
              legendAccumulator[legendKey].count += featureCount;
            }
          }
        } catch (error) {
          console.error(`Error processing ${title}:`, error);
        }
      });

      // Draw CA State Parks Entry Points
      try {
        if (enrichments.ca_state_parks_entry_points_all && Array.isArray(enrichments.ca_state_parks_entry_points_all)) {
          let entryPointCount = 0;
          enrichments.ca_state_parks_entry_points_all.forEach((entryPoint: any) => {
            if (entryPoint.geometry && entryPoint.geometry.x && entryPoint.geometry.y) {
              try {
                const lat = entryPoint.geometry.y;
                const lon = entryPoint.geometry.x;
                
                const parkUnitName = entryPoint.parkUnitName || entryPoint.PARK_NAME || entryPoint.park_name || entryPoint.ParkName || entryPoint.NAME || entryPoint.name || 'Unknown Park';
                const streetAddress = entryPoint.streetAddress || entryPoint.ADDRESS || entryPoint.address || entryPoint.Address || null;
                const city = entryPoint.city || entryPoint.CITY || entryPoint.City || null;
                const zipCode = entryPoint.zipCode || entryPoint.ZIP || entryPoint.zip || entryPoint.ZIP_CODE || entryPoint.zip_code || null;
                const phone = entryPoint.phone || entryPoint.PHONE || entryPoint.Phone || null;
                const website = entryPoint.website || entryPoint.WEBSITE || entryPoint.Website || entryPoint.URL || entryPoint.url || null;
                const distance = entryPoint.distance_miles !== null && entryPoint.distance_miles !== undefined ? entryPoint.distance_miles : 0;
                
                const marker = L.marker([lat, lon], {
                  icon: createPOIIcon('🏞️', '#059669')
                });
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🏞️ ${parkUnitName}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${streetAddress ? `<div><strong>Address:</strong> ${streetAddress}</div>` : ''}
                      ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                      ${zipCode ? `<div><strong>ZIP:</strong> ${zipCode}</div>` : ''}
                      ${phone ? `<div><strong>Phone:</strong> ${phone}</div>` : ''}
                      ${website ? `<div><strong>Website:</strong> <a href="${website}" target="_blank" rel="noopener noreferrer">${website}</a></div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                entryPointCount++;
              } catch (error) {
                console.error('Error drawing CA State Parks Entry Point:', error);
              }
            }
          });
          
          if (entryPointCount > 0) {
            if (!legendAccumulator['ca_state_parks_entry_points']) {
              legendAccumulator['ca_state_parks_entry_points'] = {
                icon: '🏞️',
                color: '#059669',
                title: 'CA State Parks Entry Points',
                count: 0,
              };
            }
            legendAccumulator['ca_state_parks_entry_points'].count += entryPointCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA State Parks Entry Points:', error);
      }

      // Draw CA State Parks Parking Lots
      try {
        if (enrichments.ca_state_parks_parking_lots_all && Array.isArray(enrichments.ca_state_parks_parking_lots_all)) {
          let parkingLotCount = 0;
          enrichments.ca_state_parks_parking_lots_all.forEach((parkingLot: any) => {
            if (parkingLot.geometry && parkingLot.geometry.x && parkingLot.geometry.y) {
              try {
                const lat = parkingLot.geometry.y;
                const lon = parkingLot.geometry.x;
                
                const name = parkingLot.name || parkingLot.NAME || parkingLot.Name || 'Unknown Parking Lot';
                const unitName = parkingLot.unitName || parkingLot.UNITNAME || parkingLot.unitName || null;
                const type = parkingLot.type || parkingLot.TYPE || parkingLot.Type || null;
                const subType = parkingLot.subType || parkingLot.SUBTYPE || parkingLot.subType || null;
                const useType = parkingLot.useType || parkingLot.USETYPE || parkingLot.useType || null;
                const trailhead = parkingLot.trailhead || parkingLot.TRAILHEAD || parkingLot.trailhead || null;
                const distance = parkingLot.distance_miles !== null && parkingLot.distance_miles !== undefined ? parkingLot.distance_miles : 0;
                
                const marker = L.marker([lat, lon], {
                  icon: createPOIIcon('🅿️', '#0891b2')
                });
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🅿️ ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${unitName ? `<div><strong>Park Unit:</strong> ${unitName}</div>` : ''}
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${subType ? `<div><strong>Sub Type:</strong> ${subType}</div>` : ''}
                      ${useType ? `<div><strong>Use Type:</strong> ${useType}</div>` : ''}
                      ${trailhead ? `<div><strong>Trailhead:</strong> ${trailhead}</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                parkingLotCount++;
              } catch (error) {
                console.error('Error drawing CA State Parks Parking Lot:', error);
              }
            }
          });
          
          if (parkingLotCount > 0) {
            if (!legendAccumulator['ca_state_parks_parking_lots']) {
              legendAccumulator['ca_state_parks_parking_lots'] = {
                icon: '🅿️',
                color: '#0891b2',
                title: 'CA State Parks Parking Lots',
                count: 0,
              };
            }
            legendAccumulator['ca_state_parks_parking_lots'].count += parkingLotCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA State Parks Parking Lots:', error);
      }

      // Draw CA State Parks Boundaries
      try {
        if (enrichments.ca_state_parks_boundaries_all && Array.isArray(enrichments.ca_state_parks_boundaries_all)) {
          let boundaryCount = 0;
          enrichments.ca_state_parks_boundaries_all.forEach((boundary: any) => {
            if (boundary.geometry && boundary.geometry.rings) {
              try {
                const rings = boundary.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latlngs = outerRing.map((coord: number[]) => {
                    return [coord[1], coord[0]] as [number, number];
                  });

                  if (latlngs.length < 3) {
                    console.warn('CA State Parks Boundary polygon has less than 3 coordinates, skipping');
                    return;
                  }

                  const color = '#10b981'; // Green for park boundaries
                  const weight = 2;

                  const unitName = boundary.unitName || boundary.UNITNAME || boundary.unitName || 'Unknown Park';
                  const subType = boundary.subType || boundary.SUBTYPE || boundary.subType || null;
                  const unitNbr = boundary.unitNbr || boundary.UNITNBR || boundary.unitNbr || null;

                  const polygon = L.polygon(latlngs, {
                    color: color,
                    weight: weight,
                    opacity: 0.7,
                    fillColor: color,
                    fillOpacity: 0.2
                  });

                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                        🏞️ ${unitName}
                      </h3>
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                        ${subType ? `<div><strong>Sub Type:</strong> ${subType}</div>` : ''}
                        ${unitNbr ? `<div><strong>Unit Number:</strong> ${unitNbr}</div>` : ''}
                        ${boundary.isContaining ? '<div style="color: #059669; font-weight: 600; margin-top: 8px;">📍 Contains Location</div>' : ''}
                        ${boundary.distance_miles && boundary.distance_miles > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${boundary.distance_miles.toFixed(2)} miles</div>` : ''}
                      </div>
                    </div>
                  `;

                  polygon.bindPopup(popupContent);
                  polygon.addTo(primary);
                  bounds.extend(polygon.getBounds());
                  boundaryCount++;
                }
              } catch (error) {
                console.error('Error drawing CA State Parks Boundary polygon:', error);
              }
            }
          });
          
          if (boundaryCount > 0) {
            if (!legendAccumulator['ca_state_parks_boundaries']) {
              legendAccumulator['ca_state_parks_boundaries'] = {
                icon: '🏞️',
                color: '#10b981',
                title: 'CA State Parks Boundaries',
                count: 0,
              };
            }
            legendAccumulator['ca_state_parks_boundaries'].count += boundaryCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA State Parks Boundaries:', error);
      }

      // Draw CA State Parks Campgrounds
      try {
        if (enrichments.ca_state_parks_campgrounds_all && Array.isArray(enrichments.ca_state_parks_campgrounds_all)) {
          let campgroundCount = 0;
          enrichments.ca_state_parks_campgrounds_all.forEach((campground: any) => {
            if (campground.geometry && campground.geometry.x && campground.geometry.y) {
              try {
                const lat = campground.geometry.y;
                const lon = campground.geometry.x;
                
                const name = campground.name || campground.NAME || campground.Name || 'Unknown Campground';
                const unitName = campground.unitName || campground.UNITNAME || campground.unitName || null;
                const type = campground.type || campground.TYPE || campground.Type || null;
                const subType = campground.subType || campground.SUBTYPE || campground.subType || null;
                const useType = campground.useType || campground.USETYPE || campground.useType || null;
                const distance = campground.distance_miles !== null && campground.distance_miles !== undefined ? campground.distance_miles : 0;
                
                const marker = L.marker([lat, lon], {
                  icon: createPOIIcon('⛺', '#f59e0b')
                });
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      ⛺ ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${unitName ? `<div><strong>Park Unit:</strong> ${unitName}</div>` : ''}
                      ${type ? `<div><strong>Type:</strong> ${type}</div>` : ''}
                      ${subType ? `<div><strong>Sub Type:</strong> ${subType}</div>` : ''}
                      ${useType ? `<div><strong>Use Type:</strong> ${useType}</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                campgroundCount++;
              } catch (error) {
                console.error('Error drawing CA State Parks Campground:', error);
              }
            }
          });
          
          if (campgroundCount > 0) {
            if (!legendAccumulator['ca_state_parks_campgrounds']) {
              legendAccumulator['ca_state_parks_campgrounds'] = {
                icon: '⛺',
                color: '#f59e0b',
                title: 'CA State Parks Campgrounds',
                count: 0,
              };
            }
            legendAccumulator['ca_state_parks_campgrounds'].count += campgroundCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA State Parks Campgrounds:', error);
      }

      // Draw CA State Parks Recreational Routes as polylines on the map
      try {
        if (enrichments.ca_state_parks_recreational_routes_all && Array.isArray(enrichments.ca_state_parks_recreational_routes_all)) {
          let routeCount = 0;
          enrichments.ca_state_parks_recreational_routes_all.forEach((route: any) => {
            if (route.geometry && route.geometry.paths) {
              try {
                // Convert ESRI polyline paths to Leaflet LatLng arrays
                const paths = route.geometry.paths;
                if (paths && paths.length > 0) {
                  routeCount++;
                  // For each path in the polyline, create a separate polyline
                  paths.forEach((path: number[][]) => {
                    const latlngs = path.map((coord: number[]) => {
                      // ESRI geometry coordinates are [x, y] which is [lon, lat] in WGS84
                      // Since we requested outSR=4326, coordinates should already be in WGS84
                      // Convert [lon, lat] to [lat, lon] for Leaflet
                      return [coord[1], coord[0]] as [number, number];
                    });

                    const routeName = route.routeName || route.ROUTENAME || route.RouteName || route.NAME || route.name || 'Unknown Route';
                    const routeClass = route.routeClass || route.ROUTECLASS || route.RouteClass || null;
                    const routeCategory = route.routeCategory || route.ROUTECAT || route.RouteCat || route.routeCat || null;
                    const routeType = route.routeType || route.ROUTETYPE || route.RouteType || null;
                    const unitName = route.unitName || route.UNITNAME || route.UnitName || null;
                    const segmentLength = route.segmentLength || route.SEGLNGTH || route.segLngth || route.Shape_Length || route.shape_length || null;
                    const share = route.share || route.SHARE || route.Share || null;
                    const routeDescription = route.routeDescription || route.ROUTEDES || route.routeDes || null;
                    const trailDescription = route.trailDescription || route.TRAILDES || route.trailDes || null;
                    const distance = route.distance_miles !== null && route.distance_miles !== undefined ? route.distance_miles : 0;

                    // Create polyline with green color for recreational routes
                    const polyline = L.polyline(latlngs, {
                      color: '#fbbf24', // Yellow color for recreational routes (better visibility on imagery basemap)
                      weight: 3,
                      opacity: 0.8,
                      smoothFactor: 1
                    });

                    // Build popup content with all route attributes
                    let popupContent = `
                      <div style="min-width: 250px; max-width: 400px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                          🛤️ ${routeName}
                        </h3>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          ${unitName ? `<div><strong>Park Unit:</strong> ${unitName}</div>` : ''}
                          ${routeClass ? `<div><strong>Class:</strong> ${routeClass}</div>` : ''}
                          ${routeCategory ? `<div><strong>Category:</strong> ${routeCategory}</div>` : ''}
                          ${routeType ? `<div><strong>Type:</strong> ${routeType}</div>` : ''}
                          ${segmentLength !== null && segmentLength !== undefined ? `<div><strong>Segment Length:</strong> ${segmentLength.toFixed(2)} meters</div>` : ''}
                          ${share ? `<div><strong>Share:</strong> ${share}</div>` : ''}
                          ${routeDescription ? `<div><strong>Route Description:</strong> ${routeDescription}</div>` : ''}
                          ${trailDescription ? `<div><strong>Trail Description:</strong> ${trailDescription}</div>` : ''}
                          ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                    `;
                    
                    // Add all route attributes (excluding internal fields)
                    const excludeFields = ['routeName', 'routeClass', 'routeCategory', 'routeType', 'unitName', 'segmentLength', 'share', 'routeDescription', 'trailDescription', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid', 'GlobalID', 'ROUTENAME', 'ROUTECLASS', 'ROUTECAT', 'ROUTETYPE', 'UNITNAME', 'SEGLNGTH', 'SHARE', 'ROUTEDES', 'TRAILDES'];
                    Object.entries(route).forEach(([key, value]) => {
                      if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                          return;
                        }
                        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        let displayValue = '';
                        
                        if (typeof value === 'object') {
                          displayValue = JSON.stringify(value);
                        } else if (typeof value === 'number') {
                          displayValue = value.toLocaleString();
                        } else {
                          displayValue = String(value);
                        }
                        
                        popupContent += `<div style="margin-bottom: 4px;"><strong>${displayKey}:</strong> ${displayValue}</div>`;
                      }
                    });
                    
                    popupContent += `
                        </div>
                      </div>
                    `;
                    
                    polyline.bindPopup(popupContent, { maxWidth: 400 });
                    polyline.addTo(poi);
                    bounds.extend(polyline.getBounds());
                  });
                }
              } catch (error) {
                console.error('Error drawing CA State Parks Recreational Route polyline:', error);
              }
            }
          });
          
          if (routeCount > 0) {
            if (!legendAccumulator['ca_state_parks_recreational_routes']) {
              legendAccumulator['ca_state_parks_recreational_routes'] = {
                icon: '🛤️',
                color: '#fbbf24',
                title: 'CA State Parks Recreational Routes',
                count: 0,
              };
            }
            legendAccumulator['ca_state_parks_recreational_routes'].count += routeCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA State Parks Recreational Routes:', error);
      }

      // Draw CA Condor Range as polygons on the map
      try {
        if (enrichments.ca_condor_range_all && Array.isArray(enrichments.ca_condor_range_all)) {
          let rangeCount = 0;
          enrichments.ca_condor_range_all.forEach((range: any) => {
            if (range.geometry && range.geometry.rings) {
              try {
                const rings = range.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latLngs = outerRing.map((coord: number[]) => [coord[1], coord[0]]);
                  
                  const shapeName = range.shapeName || range.Shape_Name || range.ShapeName || 'Unknown Range';
                  const commonName = range.commonName || range.CName || range.cname || null;
                  const scientificName = range.scientificName || range.SName || range.sname || null;
                  const symbol = range.symbol || range.Symbol || null;
                  const occYears = range.occYears || range.Occ_Years || range.OccYears || null;
                  const distance = range.distance_miles !== null && range.distance_miles !== undefined ? range.distance_miles : 0;
                  
                  const polygon = L.polygon(latLngs, {
                    color: '#7c3aed',
                    fillColor: '#7c3aed',
                    fillOpacity: 0.3,
                    weight: 2
                  });
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 10px 0; font-weight: bold; color: #7c3aed;">🦅 ${shapeName}</h3>
                  `;
                  
                  if (commonName) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Common Name:</strong> ${commonName}</p>`;
                  }
                  
                  if (scientificName) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Scientific Name:</strong> ${scientificName}</p>`;
                  }
                  
                  if (symbol) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Symbol:</strong> ${symbol}</p>`;
                  }
                  
                  if (occYears) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Occurrence Years:</strong> ${occYears}</p>`;
                  }
                  
                  if (distance > 0) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</p>`;
                  }
                  
                  // Add all other attributes
                  const allAttributes = { ...range };
                  delete allAttributes.geometry;
                  delete allAttributes.shapeName;
                  delete allAttributes.commonName;
                  delete allAttributes.scientificName;
                  delete allAttributes.symbol;
                  delete allAttributes.occYears;
                  delete allAttributes.distance_miles;
                  delete allAttributes.rangeId;
                  
                  const remainingAttributes = Object.entries(allAttributes)
                    .filter(([, value]) => value !== null && value !== undefined && value !== '')
                    .map(([attrKey, attrValue]) => `<p style="margin: 5px 0;"><strong>${formatPopupFieldName(attrKey)}:</strong> ${attrValue}</p>`)
                    .join('');
                  
                  if (remainingAttributes) {
                    popupContent += remainingAttributes;
                  }
                  
                  popupContent += `</div>`;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(map);
                  rangeCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Condor Range polygon:', error);
              }
            }
          });
          
          if (rangeCount > 0) {
            if (!legendAccumulator['ca_condor_range']) {
              legendAccumulator['ca_condor_range'] = {
                icon: '🦅',
                color: '#7c3aed',
                title: 'CA Condor Range',
                count: 0,
              };
            }
            legendAccumulator['ca_condor_range'].count += rangeCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Condor Range:', error);
      }

      // Draw CA Black Bear Range as polygons on the map
      try {
        if (enrichments.ca_black_bear_range_all && Array.isArray(enrichments.ca_black_bear_range_all)) {
          let rangeCount = 0;
          enrichments.ca_black_bear_range_all.forEach((range: any) => {
            if (range.geometry && range.geometry.rings) {
              try {
                const rings = range.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latLngs = outerRing.map((coord: number[]) => [coord[1], coord[0]]);
                  
                  const shapeName = range.shapeName || range.Shape_Name || range.ShapeName || 'Unknown Range';
                  const commonName = range.commonName || range.CName || range.cname || null;
                  const scientificName = range.scientificName || range.SName || range.sname || null;
                  const symbol = range.symbol || range.Symbol || null;
                  const occYears = range.occYears || range.Occ_Years || range.OccYears || null;
                  const distance = range.distance_miles !== null && range.distance_miles !== undefined ? range.distance_miles : 0;
                  
                  const polygon = L.polygon(latLngs, {
                    color: '#1f2937',
                    fillColor: '#1f2937',
                    fillOpacity: 0.3,
                    weight: 2
                  });
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 10px 0; font-weight: bold; color: #1f2937;">🐻 ${shapeName}</h3>
                  `;
                  
                  if (commonName) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Common Name:</strong> ${commonName}</p>`;
                  }
                  
                  if (scientificName) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Scientific Name:</strong> ${scientificName}</p>`;
                  }
                  
                  if (symbol) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Symbol:</strong> ${symbol}</p>`;
                  }
                  
                  if (occYears) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Occurrence Years:</strong> ${occYears}</p>`;
                  }
                  
                  if (distance > 0) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</p>`;
                  }
                  
                  const allAttributes = { ...range };
                  delete allAttributes.geometry;
                  delete allAttributes.shapeName;
                  delete allAttributes.commonName;
                  delete allAttributes.scientificName;
                  delete allAttributes.symbol;
                  delete allAttributes.occYears;
                  delete allAttributes.distance_miles;
                  delete allAttributes.rangeId;
                  
                  const remainingAttributes = Object.entries(allAttributes)
                    .filter(([, value]) => value !== null && value !== undefined && value !== '')
                    .map(([attrKey, attrValue]) => `<p style="margin: 5px 0;"><strong>${formatPopupFieldName(attrKey)}:</strong> ${attrValue}</p>`)
                    .join('');
                  
                  if (remainingAttributes) {
                    popupContent += remainingAttributes;
                  }
                  
                  popupContent += `</div>`;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(map);
                  rangeCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Black Bear Range polygon:', error);
              }
            }
          });
          
          if (rangeCount > 0) {
            if (!legendAccumulator['ca_black_bear_range']) {
              legendAccumulator['ca_black_bear_range'] = {
                icon: '🐻',
                color: '#1f2937',
                title: 'CA Black Bear Range',
                count: 0,
              };
            }
            legendAccumulator['ca_black_bear_range'].count += rangeCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Black Bear Range:', error);
      }

      // Draw CA Brush Rabbit Range as polygons on the map
      try {
        if (enrichments.ca_brush_rabbit_range_all && Array.isArray(enrichments.ca_brush_rabbit_range_all)) {
          let rangeCount = 0;
          enrichments.ca_brush_rabbit_range_all.forEach((range: any) => {
            if (range.geometry && range.geometry.rings) {
              try {
                const rings = range.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latLngs = outerRing.map((coord: number[]) => [coord[1], coord[0]]);
                  
                  const shapeName = range.shapeName || range.Shape_Name || range.ShapeName || 'Unknown Range';
                  const commonName = range.commonName || range.CName || range.cname || null;
                  const scientificName = range.scientificName || range.SName || range.sname || null;
                  const symbol = range.symbol || range.Symbol || null;
                  const occYears = range.occYears || range.Occ_Years || range.OccYears || null;
                  const distance = range.distance_miles !== null && range.distance_miles !== undefined ? range.distance_miles : 0;
                  
                  const polygon = L.polygon(latLngs, {
                    color: '#92400e',
                    fillColor: '#92400e',
                    fillOpacity: 0.3,
                    weight: 2
                  });
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">🐰 ${shapeName}</h3>
                  `;
                  
                  if (commonName) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Common Name:</strong> ${commonName}</p>`;
                  }
                  
                  if (scientificName) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Scientific Name:</strong> ${scientificName}</p>`;
                  }
                  
                  if (symbol) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Symbol:</strong> ${symbol}</p>`;
                  }
                  
                  if (occYears) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Occurrence Years:</strong> ${occYears}</p>`;
                  }
                  
                  if (distance > 0) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</p>`;
                  }
                  
                  const allAttributes = { ...range };
                  delete allAttributes.geometry;
                  delete allAttributes.shapeName;
                  delete allAttributes.commonName;
                  delete allAttributes.scientificName;
                  delete allAttributes.symbol;
                  delete allAttributes.occYears;
                  delete allAttributes.distance_miles;
                  delete allAttributes.rangeId;
                  
                  const remainingAttributes = Object.entries(allAttributes)
                    .filter(([, value]) => value !== null && value !== undefined && value !== '')
                    .map(([attrKey, attrValue]) => `<p style="margin: 5px 0;"><strong>${formatPopupFieldName(attrKey)}:</strong> ${attrValue}</p>`)
                    .join('');
                  
                  if (remainingAttributes) {
                    popupContent += remainingAttributes;
                  }
                  
                  popupContent += `</div>`;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(map);
                  rangeCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Brush Rabbit Range polygon:', error);
              }
            }
          });
          
          if (rangeCount > 0) {
            if (!legendAccumulator['ca_brush_rabbit_range']) {
              legendAccumulator['ca_brush_rabbit_range'] = {
                icon: '🐰',
                color: '#92400e',
                title: 'CA Brush Rabbit Range',
                count: 0,
              };
            }
            legendAccumulator['ca_brush_rabbit_range'].count += rangeCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Brush Rabbit Range:', error);
      }

      // Draw CA Great Gray Owl Range as polygons on the map
      try {
        if (enrichments.ca_great_gray_owl_range_all && Array.isArray(enrichments.ca_great_gray_owl_range_all)) {
          let rangeCount = 0;
          enrichments.ca_great_gray_owl_range_all.forEach((range: any) => {
            if (range.geometry && range.geometry.rings) {
              try {
                const rings = range.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latLngs = outerRing.map((coord: number[]) => [coord[1], coord[0]]);
                  
                  const shapeName = range.shapeName || range.Shape_Name || range.ShapeName || 'Unknown Range';
                  const commonName = range.commonName || range.CName || range.cname || null;
                  const scientificName = range.scientificName || range.SName || range.sname || null;
                  const symbol = range.symbol || range.Symbol || null;
                  const occYears = range.occYears || range.Occ_Years || range.OccYears || null;
                  const distance = range.distance_miles !== null && range.distance_miles !== undefined ? range.distance_miles : 0;
                  
                  const polygon = L.polygon(latLngs, {
                    color: '#374151',
                    fillColor: '#374151',
                    fillOpacity: 0.3,
                    weight: 2
                  });
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 10px 0; font-weight: bold; color: #374151;">🦉 ${shapeName}</h3>
                  `;
                  
                  if (commonName) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Common Name:</strong> ${commonName}</p>`;
                  }
                  
                  if (scientificName) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Scientific Name:</strong> ${scientificName}</p>`;
                  }
                  
                  if (symbol) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Symbol:</strong> ${symbol}</p>`;
                  }
                  
                  if (occYears) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Occurrence Years:</strong> ${occYears}</p>`;
                  }
                  
                  if (distance > 0) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</p>`;
                  }
                  
                  const allAttributes = { ...range };
                  delete allAttributes.geometry;
                  delete allAttributes.shapeName;
                  delete allAttributes.commonName;
                  delete allAttributes.scientificName;
                  delete allAttributes.symbol;
                  delete allAttributes.occYears;
                  delete allAttributes.distance_miles;
                  delete allAttributes.rangeId;
                  
                  const remainingAttributes = Object.entries(allAttributes)
                    .filter(([, value]) => value !== null && value !== undefined && value !== '')
                    .map(([attrKey, attrValue]) => `<p style="margin: 5px 0;"><strong>${formatPopupFieldName(attrKey)}:</strong> ${attrValue}</p>`)
                    .join('');
                  
                  if (remainingAttributes) {
                    popupContent += remainingAttributes;
                  }
                  
                  popupContent += `</div>`;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(map);
                  rangeCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Great Gray Owl Range polygon:', error);
              }
            }
          });
          
          if (rangeCount > 0) {
            if (!legendAccumulator['ca_great_gray_owl_range']) {
              legendAccumulator['ca_great_gray_owl_range'] = {
                icon: '🦉',
                color: '#374151',
                title: 'CA Great Gray Owl Range',
                count: 0,
              };
            }
            legendAccumulator['ca_great_gray_owl_range'].count += rangeCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Great Gray Owl Range:', error);
      }

      // Draw CA Sandhill Crane Range as polygons on the map
      try {
        if (enrichments.ca_sandhill_crane_range_all && Array.isArray(enrichments.ca_sandhill_crane_range_all)) {
          let rangeCount = 0;
          enrichments.ca_sandhill_crane_range_all.forEach((range: any) => {
            if (range.geometry && range.geometry.rings) {
              try {
                const rings = range.geometry.rings;
                if (rings && rings.length > 0) {
                  const outerRing = rings[0];
                  const latLngs = outerRing.map((coord: number[]) => [coord[1], coord[0]]);
                  
                  const shapeName = range.shapeName || range.Shape_Name || range.ShapeName || 'Unknown Range';
                  const commonName = range.commonName || range.CName || range.cname || null;
                  const scientificName = range.scientificName || range.SName || range.sname || null;
                  const symbol = range.symbol || range.Symbol || null;
                  const occYears = range.occYears || range.Occ_Years || range.OccYears || null;
                  const distance = range.distance_miles !== null && range.distance_miles !== undefined ? range.distance_miles : 0;
                  
                  const polygon = L.polygon(latLngs, {
                    color: '#059669',
                    fillColor: '#059669',
                    fillOpacity: 0.3,
                    weight: 2
                  });
                  
                  let popupContent = `
                    <div style="min-width: 250px; max-width: 400px;">
                      <h3 style="margin: 0 0 10px 0; font-weight: bold; color: #059669;">🦩 ${shapeName}</h3>
                  `;
                  
                  if (commonName) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Common Name:</strong> ${commonName}</p>`;
                  }
                  
                  if (scientificName) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Scientific Name:</strong> ${scientificName}</p>`;
                  }
                  
                  if (symbol) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Symbol:</strong> ${symbol}</p>`;
                  }
                  
                  if (occYears) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Occurrence Years:</strong> ${occYears}</p>`;
                  }
                  
                  if (distance > 0) {
                    popupContent += `<p style="margin: 5px 0;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</p>`;
                  }
                  
                  const allAttributes = { ...range };
                  delete allAttributes.geometry;
                  delete allAttributes.shapeName;
                  delete allAttributes.commonName;
                  delete allAttributes.scientificName;
                  delete allAttributes.symbol;
                  delete allAttributes.occYears;
                  delete allAttributes.distance_miles;
                  delete allAttributes.rangeId;
                  
                  const remainingAttributes = Object.entries(allAttributes)
                    .filter(([, value]) => value !== null && value !== undefined && value !== '')
                    .map(([attrKey, attrValue]) => `<p style="margin: 5px 0;"><strong>${formatPopupFieldName(attrKey)}:</strong> ${attrValue}</p>`)
                    .join('');
                  
                  if (remainingAttributes) {
                    popupContent += remainingAttributes;
                  }
                  
                  popupContent += `</div>`;
                  
                  polygon.bindPopup(popupContent);
                  polygon.addTo(map);
                  rangeCount++;
                }
              } catch (error) {
                console.error('Error drawing CA Sandhill Crane Range polygon:', error);
              }
            }
          });
          
          if (rangeCount > 0) {
            if (!legendAccumulator['ca_sandhill_crane_range']) {
              legendAccumulator['ca_sandhill_crane_range'] = {
                icon: '🦩',
                color: '#059669',
                title: 'CA Sandhill Crane Range',
                count: 0,
              };
            }
            legendAccumulator['ca_sandhill_crane_range'].count += rangeCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Sandhill Crane Range:', error);
      }

      // Draw CA Highway Rest Areas as point markers on the map
      try {
        if (enrichments.ca_highway_rest_areas_all && Array.isArray(enrichments.ca_highway_rest_areas_all)) {
          let restAreaCount = 0;
          enrichments.ca_highway_rest_areas_all.forEach((restArea: any) => {
            if (restArea.geometry && restArea.geometry.x && restArea.geometry.y) {
              try {
                const lat = restArea.geometry.y;
                const lon = restArea.geometry.x;
                
                const name = restArea.name || restArea.Name || restArea.NAME || restArea.REST_AREA_NAME || restArea.rest_area_name || 'Unknown Rest Area';
                const route = restArea.route || restArea.Route || restArea.ROUTE || null;
                const direction = restArea.direction || restArea.Direction || restArea.DIRECTION || null;
                const county = restArea.county || restArea.County || restArea.COUNTY || null;
                const city = restArea.city || restArea.City || restArea.CITY || null;
                const amenities = restArea.amenities || restArea.Amenities || restArea.AMENITIES || null;
                const distance = restArea.distance_miles !== null && restArea.distance_miles !== undefined ? restArea.distance_miles : 0;
                
                const marker = L.marker([lat, lon], {
                  icon: createPOIIcon('🚗', '#dc2626')
                });
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🚗 ${name}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${route ? `<div><strong>Route:</strong> ${route}</div>` : ''}
                      ${direction ? `<div><strong>Direction:</strong> ${direction}</div>` : ''}
                      ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                      ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                      ${amenities ? `<div><strong>Amenities:</strong> ${amenities}</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(map);
                restAreaCount++;
              } catch (error) {
                console.error('Error drawing CA Highway Rest Area marker:', error);
              }
            }
          });
          
          if (restAreaCount > 0) {
            if (!legendAccumulator['ca_highway_rest_areas']) {
              legendAccumulator['ca_highway_rest_areas'] = {
                icon: '🚗',
                color: '#dc2626',
                title: 'CA Highway Rest Areas',
                count: 0,
              };
            }
            legendAccumulator['ca_highway_rest_areas'].count += restAreaCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Highway Rest Areas:', error);
      }

      // Draw CA Marine Oil Terminals as point markers on the map
      try {
        if (enrichments.ca_marine_oil_terminals_all && Array.isArray(enrichments.ca_marine_oil_terminals_all)) {
          let terminalCount = 0;
          enrichments.ca_marine_oil_terminals_all.forEach((terminal: any) => {
            // Check for geometry with x/y (point geometry)
            const lat = terminal.geometry?.y || terminal.latitude || null;
            const lon = terminal.geometry?.x || terminal.longitude || null;
            
            if (lat !== null && lon !== null) {
              try {
                const terminalName = terminal.terminalName || terminal.Terminal_Name || terminal.terminal_name || terminal.NAME || terminal.name || 'Unknown Terminal';
                const wo = terminal.wo || terminal.WO_ || terminal.wo_ || null;
                const woBerthId = terminal.woBerthId || terminal.WO_Berth_ID || terminal.wo_berth_id || null;
                const city = terminal.city || terminal.City || terminal.CITY || null;
                const county = terminal.county || terminal.County || terminal.COUNTY || null;
                const displayName = terminal.displayName || terminal.DisplayName || terminal.display_name || null;
                const distance = terminal.distance_miles !== null && terminal.distance_miles !== undefined ? terminal.distance_miles : 0;
                
                const marker = L.marker([lat, lon], {
                  icon: createPOIIcon('🛢️', '#1f2937')
                });
                
                let popupContent = `
                  <div style="min-width: 250px; max-width: 400px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
                      🛢️ ${terminalName}
                    </h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${displayName ? `<div><strong>Display Name:</strong> ${displayName}</div>` : ''}
                      ${wo ? `<div><strong>WO:</strong> ${wo}</div>` : ''}
                      ${woBerthId ? `<div><strong>Berth ID:</strong> ${woBerthId}</div>` : ''}
                      ${city ? `<div><strong>City:</strong> ${city}</div>` : ''}
                      ${county ? `<div><strong>County:</strong> ${county}</div>` : ''}
                      ${distance > 0 ? `<div style="margin-top: 8px;"><strong>Distance:</strong> ${distance.toFixed(2)} miles</div>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                `;
                
                // Add all terminal attributes (excluding internal fields)
                const excludeFields = ['terminalName', 'terminal_name', 'Terminal_Name', 'wo', 'WO_', 'wo_', 'woBerthId', 'WO_Berth_ID', 'wo_berth_id', 'city', 'City', 'CITY', 'county', 'County', 'COUNTY', 'displayName', 'DisplayName', 'display_name', 'latitude', 'Latitude', 'LATITUDE', 'longitude', 'Longitude', 'LONGITUDE', 'geometry', 'distance_miles', 'FID', 'fid', 'OBJECTID', 'objectid', 'GlobalID'];
                Object.entries(terminal).forEach(([key, value]) => {
                  if (!excludeFields.includes(key) && value !== null && value !== undefined && value !== '') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      return;
                    }
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                    popupContent += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
                  }
                });
                
                popupContent += `
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(primary);
                bounds.extend([lat, lon]);
                terminalCount++;
              } catch (error) {
                console.error('Error drawing CA Marine Oil Terminal marker:', error);
              }
            }
          });
          
          if (terminalCount > 0) {
            if (!legendAccumulator['ca_marine_oil_terminals']) {
              legendAccumulator['ca_marine_oil_terminals'] = {
                icon: '🛢️',
                color: '#1f2937',
                title: 'CA Marine Oil Terminals',
                count: 0,
              };
            }
            legendAccumulator['ca_marine_oil_terminals'].count += terminalCount;
          }
        }
      } catch (error) {
        console.error('Error processing CA Marine Oil Terminals:', error);
      }

      // All enrichment features are drawn here (map already zoomed in STEP 1 above)
      Object.entries(enrichments).forEach(([key, value]) => {
        if (!Array.isArray(value)) {
          return;
        }

        if (!/_detailed$|_elements$|_features$|_facilities$|_all_pois$/i.test(key)) {
          return;
        }

        // Skip PAD-US features arrays - they're handled separately with geometry drawing
        if (key.includes('padus_public_access_nearby_features') || key.includes('padus_protection_status_nearby_features')) {
          return;
        }

        const baseKey = key.replace(/_(detailed|elements|features|facilities|all_pois)$/i, '');
        const poiInfo = POI_ICONS[baseKey] || POI_ICONS['default'];
        const poiMeta = poiConfigManager.getPOIType(baseKey);
        const iconEmoji = poiInfo.icon || '📍';
        const iconColor = poiInfo.color || '#2563eb';
        const legendTitle = poiMeta?.label || poiInfo.title || formatPopupFieldName(baseKey);

        if (!legendAccumulator[baseKey]) {
          legendAccumulator[baseKey] = {
            icon: iconEmoji,
            color: iconColor,
            title: legendTitle,
            count: 0,
          };
        }

        const itemsArray = value as Array<any>;
        
        // Debug logging for mail shipping
        if (baseKey === 'poi_mail_shipping') {
          console.log(`🗺️ Mail & Shipping: Processing ${itemsArray.length} items for map display`);
        }
        
        // Add to legend count - use full array length for accurate count (shows total available)
        legendAccumulator[baseKey].count += itemsArray.length;

        const leafletIcon = createPOIIcon(iconEmoji, iconColor);

        // Map all POIs - they are already limited by proximity/radius in the query
        // No need for additional limiting here - map ALL items
        let mappedCount = 0;
        itemsArray.forEach((item) => {
          const poiLat =
            item.lat ??
            item.latitude ??
            item.LATITUDE ??
            item.location?.lat ??
            item.center?.lat ??
            item.geometry?.coordinates?.[1];
          const poiLon =
            item.lon ??
            item.longitude ??
            item.LONGITUDE ??
            item.location?.lon ??
            item.center?.lon ??
            item.geometry?.coordinates?.[0];

          if (typeof poiLat !== 'number' || typeof poiLon !== 'number') {
            // Debug logging for items that can't be mapped
            if (baseKey.includes('tri_') || baseKey.includes('epa_')) {
              console.warn(`⚠️ ${baseKey}: Skipping item with invalid coordinates:`, {
                hasLat: !!item.lat || !!item.latitude || !!item.LATITUDE,
                hasLon: !!item.lon || !!item.longitude || !!item.LONGITUDE,
                itemKeys: Object.keys(item)
              });
            }
            return;
          }

          const poiMarker = L.marker([poiLat, poiLon], { icon: leafletIcon });
          poiMarker.bindPopup(createPOIPopupContent(item, legendTitle, baseKey), { maxWidth: 360 });
          poiMarker.addTo(poi);
          mappedCount++;
        });
        
        // Debug logging for mail shipping
        if (baseKey === 'poi_mail_shipping') {
          console.log(`🗺️ Mail & Shipping: Mapped ${mappedCount} markers out of ${itemsArray.length} items`);
        }
      });
    }); // Close results.forEach

        console.log('🗺️ STEP 2: Finished drawing all features, setting legend items');
        setLegendItems(
          Object.values(legendAccumulator)
            .filter(item => item.count > 0) // Filter out items with zero count
            .sort((a, b) => b.count - a.count)
        );
        setShowBatchSuccess(results.length > 1);
        
        // Features drawn - smoothly animate to geocoded location if needed
        // Wait for map to be fully ready before animating
        if (mapInstanceRef.current && isMapReady && results && results.length > 0 && results[0]?.location) {
          const targetLat = results[0].location.lat;
          const targetLon = results[0].location.lon;
          const currentCenter = mapInstanceRef.current.getCenter();
          const currentZoom = mapInstanceRef.current.getZoom();
          
          // Calculate distance between current center and target
          const distance = mapInstanceRef.current.distance(currentCenter, L.latLng(targetLat, targetLon));
          
          // Only animate if we're significantly away from the target (more than 100 meters)
          // or if zoom level is not appropriate
          const targetZoom = results.length === 1 ? 15 : 12;
          const shouldAnimate = distance > 100 || Math.abs(currentZoom - targetZoom) > 2;
          
          if (shouldAnimate) {
            // Smoothly fly to the geocoded location
            // Use a longer delay to ensure map tiles are loaded and map is stable
            setTimeout(() => {
              if (mapInstanceRef.current) {
                try {
                  mapInstanceRef.current.flyTo(
                    [targetLat, targetLon],
                    targetZoom,
                    {
                      duration: 1.2, // Smooth 1.2 second animation
                      easeLinearity: 0.25
                    }
                  );
                } catch (error) {
                  // Fallback to setView if flyTo fails
                  console.warn('flyTo failed, using setView instead:', error);
                  mapInstanceRef.current.setView([targetLat, targetLon], targetZoom, { animate: true });
                }
              }
            }, 400); // Longer delay to ensure map is fully ready
          } else {
            // Just ensure we're at the right location without animation
            mapInstanceRef.current.setView([targetLat, targetLon], targetZoom, { animate: false });
          }
        }
        
        console.log('🗺️ All features drawn');
        
        // Add map click handler for tabbed popup functionality
        setupTabbedPopupHandler();
      });
    }
  }, [results]);

  // Setup tabbed popup handler for overlapping features
  const setupTabbedPopupHandler = () => {
    console.log('🔍 [TABBED POPUP] Setting up handler...');
    if (!mapInstanceRef.current || !layerGroupsRef.current) {
      console.error('❌ [TABBED POPUP] Map or layer groups not ready');
      return;
    }
    
    const map = mapInstanceRef.current;
    const { primary } = layerGroupsRef.current;
    console.log('🔍 [TABBED POPUP] Map instance found:', !!map);
    console.log('🔍 [TABBED POPUP] Primary layer group:', primary);
    
    // Remove existing click handlers
    map.off('click', handleMapClick);
    
    // Add map click handler (for clicks on empty areas)
    map.on('click', handleMapClick);
    
    // Also intercept clicks on features - prevent default popup and check for overlaps
    let featureHandlerCount = 0;
    primary.eachLayer((layer: L.Layer) => {
      // Skip location marker
      if (layer instanceof L.Marker && (layer as any).options?.title === results[0]?.location?.name) {
        return;
      }
      
      // Remove existing click handlers
      layer.off('click', handleFeatureClick);
      
      // Store original popup content before unbinding (we'll use it in our handler)
      let originalPopupContent = '';
      if (layer instanceof L.Marker || layer instanceof L.Polygon || layer instanceof L.Polyline) {
        const popup = (layer as any).getPopup();
        if (popup) {
          originalPopupContent = popup.getContent() as string;
        }
        // Unbind default popup to prevent it from opening automatically
        (layer as any).unbindPopup();
        // Re-bind popup but don't auto-open it
        if (originalPopupContent) {
          (layer as any).bindPopup(originalPopupContent, { 
            autoOpen: false,  // Don't auto-open on click
            closeOnClick: false 
          });
        }
      }
      
      // Add click handler that checks for overlapping features (with higher priority)
      layer.on('click', handleFeatureClick);
      featureHandlerCount++;
    });
    
    console.log('✅ [TABBED POPUP] Handler set up successfully');
    console.log('🔍 [TABBED POPUP] Attached handlers to', featureHandlerCount, 'features');
  };
  
  // Handle feature click to check for overlapping features
  const handleFeatureClick = (e: L.LeafletMouseEvent) => {
    console.log('🔍 [TABBED POPUP] ========== FEATURE CLICK DETECTED ==========');
    console.log('🔍 [TABBED POPUP] Feature click event:', e);
    console.log('🔍 [TABBED POPUP] Clicked layer:', e.target);
    console.log('🔍 [TABBED POPUP] Event type:', e.type);
    
    // Stop event propagation to prevent default popup
    if (e.originalEvent) {
      e.originalEvent.stopImmediatePropagation();
      e.originalEvent.preventDefault();
    }
    
    // Get the click point from the event
    let clickPoint = e.latlng;
    if (e.target instanceof L.Marker) {
      clickPoint = (e.target as L.Marker).getLatLng();
    } else if (e.target instanceof L.Polygon || e.target instanceof L.Polyline) {
      // For polygons/polylines, use the click latlng from the event
      clickPoint = e.latlng;
    }
    console.log('🔍 [TABBED POPUP] Click point from feature:', clickPoint);
    
    // Close any existing popups immediately
    if (mapInstanceRef.current) {
      mapInstanceRef.current.closePopup();
    }
    
    // Create a synthetic map click event to use the same handler
    const syntheticEvent = {
      ...e,
      latlng: clickPoint
    } as L.LeafletMouseEvent;
    
    // Use the same logic as map click to find all features at this point
    // Small delay to ensure popup is closed
    setTimeout(() => {
      handleMapClick(syntheticEvent);
    }, 10);
  };

  // Handle map click to show tabbed popup for overlapping features
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    console.log('🔍 [TABBED POPUP] ========== MAP CLICK DETECTED ==========');
    console.log('🔍 [TABBED POPUP] Click event:', e);
    
    if (!mapInstanceRef.current || !layerGroupsRef.current) {
      console.error('❌ [TABBED POPUP] Map or layer groups not ready');
      console.log('🔍 [TABBED POPUP] mapInstanceRef.current:', !!mapInstanceRef.current);
      console.log('🔍 [TABBED POPUP] layerGroupsRef.current:', !!layerGroupsRef.current);
      return;
    }
    
    const clickPoint = e.latlng;
    const { primary } = layerGroupsRef.current;
    
    console.log('🔍 [TABBED POPUP] Click point:', clickPoint);
    console.log('🔍 [TABBED POPUP] Primary layer group:', primary);
    
    // Close any existing popups first
    mapInstanceRef.current.closePopup();
    
    // Collect all features at click point
    const featuresAtPoint: Array<{
      layer: L.Layer;
      layerType: string;
      layerTitle: string;
      popupContent: string;
    }> = [];
    
    let layerCount = 0;
    let markerCount = 0;
    let polygonCount = 0;
    let polylineCount = 0;
    
    console.log('🔍 [TABBED POPUP] Starting to check layers...');
    // Check all layers in primary group
    primary.eachLayer((layer: L.Layer) => {
      layerCount++;
      // Skip location marker
      if (layer instanceof L.Marker && (layer as any).options?.title === results[0]?.location?.name) {
        console.log('🔍 [TABBED POPUP] Skipping location marker');
        return;
      }
      
      let intersects = false;
      let layerType = 'unknown';
      let layerTitle = 'Unknown Layer';
      let popupContent = '';
      
      // Check for stored metadata first
      const storedType = (layer as any).__layerType;
      const storedTitle = (layer as any).__layerTitle;
      console.log(`🔍 [TABBED POPUP] Layer ${layerCount}:`, {
        type: layer instanceof L.Marker ? 'Marker' : layer instanceof L.Polygon ? 'Polygon' : layer instanceof L.Polyline ? 'Polyline' : 'Unknown',
        storedType,
        storedTitle
      });
      
      // Check if click point intersects with this layer
      if (layer instanceof L.Marker) {
        markerCount++;
        // Point feature - check distance (within 15 pixels)
        const markerLatLng = (layer as L.Marker).getLatLng();
        const containerPoint = mapInstanceRef.current!.latLngToContainerPoint(markerLatLng);
        const clickContainerPoint = mapInstanceRef.current!.latLngToContainerPoint(clickPoint);
        const pixelDistance = Math.sqrt(
          Math.pow(containerPoint.x - clickContainerPoint.x, 2) + 
          Math.pow(containerPoint.y - clickContainerPoint.y, 2)
        );
        intersects = pixelDistance <= 15; // 15 pixels tolerance
        
        if (intersects) {
          console.log(`🔍 [TABBED POPUP] Marker ${markerCount} intersects!`);
          const popup = (layer as L.Marker).getPopup();
          if (popup) {
            popupContent = popup.getContent() as string;
            console.log('🔍 [TABBED POPUP] Marker popup content length:', popupContent?.length || 0);
          } else {
            // Fallback to stored popup content
            popupContent = (layer as any).__popupContent || '';
            console.warn('⚠️ [TABBED POPUP] Marker has no popup, using stored content:', popupContent?.length || 0);
          }
          layerType = storedType || extractLayerTypeFromPopup(popupContent) || 'point';
          layerTitle = storedTitle || extractLayerTitleFromPopup(popupContent) || 'Point Feature';
          console.log('🔍 [TABBED POPUP] Marker layer type:', layerType, 'title:', layerTitle);
        }
      } else if (layer instanceof L.Polygon) {
        polygonCount++;
        // Polygon feature - check if point is inside
        const bounds = (layer as L.Polygon).getBounds();
        if (bounds.contains(clickPoint)) {
          // More precise check using point-in-polygon
          const latlngs = (layer as L.Polygon).getLatLngs()[0] as L.LatLng[];
          if (Array.isArray(latlngs) && latlngs.length > 0) {
            intersects = isPointInPolygon(clickPoint, latlngs);
            
            if (intersects) {
              console.log(`🔍 [TABBED POPUP] Polygon ${polygonCount} intersects!`);
              const popup = (layer as L.Polygon).getPopup();
              if (popup) {
                popupContent = popup.getContent() as string;
                console.log('🔍 [TABBED POPUP] Polygon popup content length:', popupContent?.length || 0);
              } else {
                // Fallback to stored popup content
                popupContent = (layer as any).__popupContent || '';
                console.warn('⚠️ [TABBED POPUP] Polygon has no popup, using stored content:', popupContent?.length || 0);
              }
              layerType = storedType || extractLayerTypeFromPopup(popupContent) || 'polygon';
              layerTitle = storedTitle || extractLayerTitleFromPopup(popupContent) || 'Polygon Feature';
              console.log('🔍 [TABBED POPUP] Polygon layer type:', layerType, 'title:', layerTitle);
            }
          }
        }
      } else if (layer instanceof L.Polyline) {
        polylineCount++;
        // Polyline feature - check distance to line (within 15 pixels)
        const latlngs = (layer as L.Polyline).getLatLngs() as L.LatLng[];
        if (Array.isArray(latlngs) && latlngs.length > 0) {
          let minPixelDistance = Infinity;
          for (let i = 0; i < latlngs.length; i++) {
            const point = latlngs[i];
            const containerPoint = mapInstanceRef.current!.latLngToContainerPoint(point);
            const clickContainerPoint = mapInstanceRef.current!.latLngToContainerPoint(clickPoint);
            const pixelDistance = Math.sqrt(
              Math.pow(containerPoint.x - clickContainerPoint.x, 2) + 
              Math.pow(containerPoint.y - clickContainerPoint.y, 2)
            );
            if (pixelDistance < minPixelDistance) {
              minPixelDistance = pixelDistance;
            }
          }
          intersects = minPixelDistance <= 15; // 15 pixels tolerance
          
          if (intersects) {
            console.log(`🔍 [TABBED POPUP] Polyline ${polylineCount} intersects!`);
            const popup = (layer as L.Polyline).getPopup();
            if (popup) {
              popupContent = popup.getContent() as string;
              console.log('🔍 [TABBED POPUP] Polyline popup content length:', popupContent?.length || 0);
            } else {
              // Fallback to stored popup content
              popupContent = (layer as any).__popupContent || '';
              console.warn('⚠️ [TABBED POPUP] Polyline has no popup, using stored content:', popupContent?.length || 0);
            }
            layerType = storedType || extractLayerTypeFromPopup(popupContent) || 'polyline';
            layerTitle = storedTitle || extractLayerTitleFromPopup(popupContent) || 'Line Feature';
            console.log('🔍 [TABBED POPUP] Polyline layer type:', layerType, 'title:', layerTitle);
          }
        }
      }
      
      if (intersects && popupContent) {
        console.log('✅ [TABBED POPUP] Found intersecting feature:', { 
          layerType, 
          layerTitle,
          hasPopup: !!popupContent,
          popupLength: popupContent.length
        });
        featuresAtPoint.push({
          layer,
          layerType,
          layerTitle,
          popupContent
        });
      } else if (intersects && !popupContent) {
        console.warn('⚠️ [TABBED POPUP] Feature intersects but has no popup content');
      }
    });
    
    console.log('🔍 [TABBED POPUP] ========== LAYER CHECK COMPLETE ==========');
    console.log('🔍 [TABBED POPUP] Total layers checked:', layerCount);
    console.log('🔍 [TABBED POPUP] Markers:', markerCount, 'Polygons:', polygonCount, 'Polylines:', polylineCount);
    console.log('🔍 [TABBED POPUP] Features found at point:', featuresAtPoint.length);
    console.log('🔍 [TABBED POPUP] Features details:', featuresAtPoint.map(f => ({ type: f.layerType, title: f.layerTitle })));
    
    // If we found multiple features, show tabbed popup
    if (featuresAtPoint.length > 1) {
      console.log('🔍 [TABBED POPUP] ========== MULTIPLE FEATURES FOUND ==========');
      console.log('🔍 [TABBED POPUP] Features count:', featuresAtPoint.length);
      console.log('🔍 [TABBED POPUP] All features details:', featuresAtPoint.map((f, i) => ({
        index: i,
        layerType: f.layerType,
        layerTitle: f.layerTitle,
        hasPopup: !!f.popupContent,
        popupPreview: f.popupContent?.substring(0, 100)
      })));
      
      // Group by layer type
      const groupedFeatures = groupFeaturesByType(featuresAtPoint);
      console.log('🔍 [TABBED POPUP] Grouped features:', groupedFeatures);
      console.log('🔍 [TABBED POPUP] Layer types:', Object.keys(groupedFeatures));
      console.log('🔍 [TABBED POPUP] Features per type:', Object.entries(groupedFeatures).map(([type, features]) => ({
        type,
        count: features.length,
        titles: features.map(f => f.layerTitle)
      })));
      
      // Limit to max 10 tabs
      const layerTypes = Object.keys(groupedFeatures).slice(0, 10);
      console.log('🔍 [TABBED POPUP] Layer types (limited to 10):', layerTypes);
      
      console.log('🔍 [TABBED POPUP] Layer types count:', layerTypes.length);
      console.log('🔍 [TABBED POPUP] Features per type:', layerTypes.map(lt => ({ type: lt, count: groupedFeatures[lt].length })));
      
      // Show tabs if we have multiple layer types OR multiple features of the same type
      const totalFeatures = featuresAtPoint.length;
      const shouldShowTabs = layerTypes.length > 1 || (layerTypes.length === 1 && totalFeatures > 1);
      
      console.log('🔍 [TABBED POPUP] Should show tabs?', shouldShowTabs, '(layerTypes:', layerTypes.length, ', totalFeatures:', totalFeatures, ')');
      
      if (shouldShowTabs) {
        console.log('🔍 [TABBED POPUP] Creating popup with', layerTypes.length, 'tabs');
        const tabbedPopupContent = createTabbedPopupContent(groupedFeatures, layerTypes);
        console.log('🔍 [TABBED POPUP] Popup content length:', tabbedPopupContent.length);
        console.log('🔍 [TABBED POPUP] Popup content preview (first 500 chars):', tabbedPopupContent.substring(0, 500));
        
        // Use setTimeout to ensure popup opens after any default popups are closed
        setTimeout(() => {
          console.log('🔍 [TABBED POPUP] Opening popup...');
          const popup = L.popup({ 
            maxWidth: 500, 
            maxHeight: 500,
            className: 'tabbed-popup', 
            autoPan: true,
            autoClose: false,
            closeOnClick: false
          })
            .setLatLng(clickPoint)
            .setContent(tabbedPopupContent);
          popup.openOn(mapInstanceRef.current!);
          console.log('✅ [TABBED POPUP] Popup opened on map');
          
          // Attach event listeners after popup is added to DOM
          setTimeout(() => {
            console.log('🔍 [TABBED POPUP] Looking for popup element in DOM...');
            const popupElement = document.querySelector('.tabbed-popup .leaflet-popup-content-wrapper');
            console.log('🔍 [TABBED POPUP] Popup element found:', !!popupElement);
            if (popupElement) {
              console.log('🔍 [TABBED POPUP] Popup element HTML:', popupElement.innerHTML.substring(0, 200));
              const tabs = popupElement.querySelectorAll('.tabbed-popup-tab');
              console.log('🔍 [TABBED POPUP] Tabs found:', tabs.length);
              const contents = popupElement.querySelectorAll('.tabbed-popup-content');
              console.log('🔍 [TABBED POPUP] Content panels found:', contents.length);
              
              // Use event delegation for tab clicks
              popupElement.addEventListener('click', (e: Event) => {
                const target = e.target as HTMLElement;
                console.log('🔍 [TABBED POPUP] Click in popup:', target);
                if (target.classList.contains('tabbed-popup-tab') || target.closest('.tabbed-popup-tab')) {
                  const tab = target.classList.contains('tabbed-popup-tab') ? target : target.closest('.tabbed-popup-tab') as HTMLElement;
                  const tabIndex = tab.getAttribute('data-tab-index');
                  console.log('🔍 [TABBED POPUP] Tab clicked, index:', tabIndex);
                  if (tabIndex !== null) {
                    // Update all tabs
                    popupElement.querySelectorAll('.tabbed-popup-tab').forEach((t: Element) => {
                      const tabEl = t as HTMLElement;
                      tabEl.style.backgroundColor = 'transparent';
                      tabEl.style.color = '#6b7280';
                      tabEl.style.fontWeight = '400';
                      tabEl.style.borderBottomColor = 'transparent';
                      tabEl.classList.remove('active');
                    });
                    // Update all content panels
                    popupElement.querySelectorAll('.tabbed-popup-content').forEach((c: Element) => {
                      (c as HTMLElement).style.display = 'none';
                    });
                    // Activate clicked tab
                    tab.style.backgroundColor = '#3b82f6';
                    tab.style.color = 'white';
                    tab.style.fontWeight = '600';
                    tab.style.borderBottomColor = '#3b82f6';
                    tab.classList.add('active');
                    // Show corresponding content
                    const content = popupElement.querySelector(`#tab-content-${tabIndex}`) as HTMLElement;
                    if (content) {
                      content.style.display = 'block';
                      console.log('✅ [TABBED POPUP] Tab switched to index:', tabIndex);
                    } else {
                      console.error('❌ [TABBED POPUP] Content panel not found for index:', tabIndex);
                    }
                  }
                }
              });
              console.log('✅ [TABBED POPUP] Event listeners attached');
            } else {
              console.error('❌ [TABBED POPUP] Popup element not found in DOM');
            }
          }, 100);
          
          console.log('✅ [TABBED POPUP] Popup creation complete');
        }, 50);
      } else {
        console.log('⚠️ [TABBED POPUP] Not showing tabs. Layer types:', layerTypes.length, 'Total features:', totalFeatures);
        // If we have multiple features but only one type, still show them in a scrollable popup
        if (totalFeatures > 1) {
          console.log('🔍 [TABBED POPUP] Multiple features of same type, creating single-tab popup');
          const singleTabContent = createTabbedPopupContent(groupedFeatures, layerTypes);
          setTimeout(() => {
            const popup = L.popup({ 
              maxWidth: 500, 
              maxHeight: 500,
              className: 'tabbed-popup', 
              autoPan: true,
              autoClose: false,
              closeOnClick: false
            })
              .setLatLng(clickPoint)
              .setContent(singleTabContent);
            popup.openOn(mapInstanceRef.current!);
          }, 10);
        }
      }
    } else if (featuresAtPoint.length === 1) {
      // Single feature - open its popup manually since autoOpen is false
      console.log('🔍 [TABBED POPUP] Single feature found, opening popup manually');
      const singleFeature = featuresAtPoint[0];
      if (singleFeature.popupContent) {
        const popup = L.popup({ 
          maxWidth: 500, 
          maxHeight: 500,
          autoPan: true,
          autoClose: false,
          closeOnClick: false
        })
          .setLatLng(clickPoint)
          .setContent(singleFeature.popupContent);
        popup.openOn(mapInstanceRef.current!);
        console.log('✅ [TABBED POPUP] Single feature popup opened');
      } else {
        // Fallback: try to get popup from layer
        const layerPopup = singleFeature.layer.getPopup();
        if (layerPopup) {
          layerPopup.openOn(mapInstanceRef.current!);
          console.log('✅ [TABBED POPUP] Single feature popup opened from layer');
        } else {
          console.warn('⚠️ [TABBED POPUP] Single feature has no popup content');
        }
      }
    } else {
      console.log('ℹ️ [TABBED POPUP] No features found at click point');
    }
    console.log('🔍 [TABBED POPUP] ========== HANDLER COMPLETE ==========');
  };

  // Helper function to check if point is in polygon
  const isPointInPolygon = (point: L.LatLng, polygon: L.LatLng[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng, yi = polygon[i].lat;
      const xj = polygon[j].lng, yj = polygon[j].lat;
      const intersect = ((yi > point.lat) !== (yj > point.lat)) && 
                       (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };


  // Helper function to extract layer type from popup content
  const extractLayerTypeFromPopup = (popupContent: string): string | null => {
    if (!popupContent) return null;
    // Try to extract from popup content - look for common patterns
    const match = popupContent.match(/data-layer-type=["']([^"']+)["']/);
    if (match) return match[1];
    // Fallback: try to extract from title
    const titleMatch = popupContent.match(/<h3[^>]*>([^<]+)<\/h3>/);
    if (titleMatch) {
      const title = titleMatch[1].toLowerCase();
      // NYC layers
      if (title.includes('bike route')) return 'nyc_bike_routes';
      if (title.includes('neighborhood')) return 'nyc_neighborhoods';
      if (title.includes('tax lot') || title.includes('mappluto')) return 'nyc_mappluto';
      // LA County layers
      if (title.includes('historic cultural monument')) return 'la_county_historic_cultural_monuments';
      if (title.includes('housing') && title.includes('lead')) return 'la_county_housing_lead_risk';
      if (title.includes('school district')) return 'la_county_school_district_boundaries';
      if (title.includes('metro line')) return 'la_county_metro_lines';
      if (title.includes('street inventory')) return 'la_county_street_inventory';
      // Chicago layers
      if (title.includes('311') || title.includes('service request')) return 'chicago_311';
      if (title.includes('building') && (title.includes('centroid') || title.includes('footprint'))) return 'chicago_building_footprints';
      if (title.includes('traffic crash')) return 'chicago_traffic_crashes';
      if (title.includes('speed camera')) return 'chicago_speed_cameras';
      if (title.includes('red light camera')) return 'chicago_red_light_cameras';
      // Generic patterns
      if (title.includes('parcel')) return 'parcels';
      if (title.includes('polygon')) return 'polygon';
      if (title.includes('line') || title.includes('route')) return 'polyline';
    }
    return null;
  };

  // Helper function to extract layer title from popup content
  const extractLayerTitleFromPopup = (popupContent: string): string | null => {
    if (!popupContent) return null;
    const titleMatch = popupContent.match(/<h3[^>]*>([^<]+)<\/h3>/);
    if (titleMatch) {
      // Remove emojis and clean up title
      let title = titleMatch[1].replace(/[🚴🏘️🏢🚑🚇🚆🚂💧🏛️🏠🌲🔥🌊⛰️🏔️🌋🌍🌎🌏🗺️📍]/g, '').trim();
      // Remove common prefixes like "Containing" or "Nearby"
      title = title.replace(/^(Containing|Nearby)\s+/i, '');
      return title || 'Feature';
    }
    return null;
  };

  // Helper function to group features by layer type
  const groupFeaturesByType = (features: Array<{layerType: string; layerTitle: string; popupContent: string}>) => {
    const grouped: Record<string, Array<{layerTitle: string; popupContent: string}>> = {};
    console.log('🔍 [TABBED POPUP] Grouping', features.length, 'features...');
    features.forEach((feature, index) => {
      // Use layerTitle as the key if layerType is 'unknown' or not specific enough
      // This ensures different layers get separate tabs even if type detection fails
      const key = feature.layerType && feature.layerType !== 'unknown' 
        ? feature.layerType 
        : (feature.layerTitle || `feature_${index}`);
      
      console.log(`🔍 [TABBED POPUP] Feature ${index}: type="${feature.layerType}", title="${feature.layerTitle}", key="${key}"`);
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push({
        layerTitle: feature.layerTitle,
        popupContent: feature.popupContent
      });
    });
    console.log('🔍 [TABBED POPUP] Grouping result:', Object.keys(grouped).map(k => ({ key: k, count: grouped[k].length })));
    return grouped;
  };

  // Helper function to create tabbed popup content
  const createTabbedPopupContent = (
    groupedFeatures: Record<string, Array<{layerTitle: string; popupContent: string}>>,
    layerTypes: string[]
  ): string => {
    let html = `
      <div class="tabbed-popup-container" style="min-width: 300px; max-width: 500px;">
        <div class="tabbed-popup-tabs" style="display: flex; border-bottom: 2px solid #e5e7eb; margin-bottom: 12px; overflow-x: auto;">
    `;
    
    layerTypes.forEach((layerType, index) => {
      const features = groupedFeatures[layerType];
      const count = features.length;
      const title = features[0]?.layerTitle || layerType;
      const isActive = index === 0 ? 'active' : '';
      html += `
        <button 
          class="tabbed-popup-tab ${isActive}" 
          data-tab-index="${index}"
          style="
            padding: 8px 12px;
            border: none;
            background: ${index === 0 ? '#3b82f6' : 'transparent'};
            color: ${index === 0 ? 'white' : '#6b7280'};
            cursor: pointer;
            font-size: 12px;
            font-weight: ${index === 0 ? '600' : '400'};
            border-bottom: 2px solid ${index === 0 ? '#3b82f6' : 'transparent'};
            margin-bottom: -2px;
            white-space: nowrap;
            flex-shrink: 0;
          "
          onmouseover="this.style.backgroundColor='${index === 0 ? '#3b82f6' : '#f3f4f6'}'"
          onmouseout="this.style.backgroundColor='${index === 0 ? '#3b82f6' : 'transparent'}'"
        >
          ${title}${count > 1 ? ` (${count})` : ''}
        </button>
      `;
    });
    
    html += `
        </div>
        <div class="tabbed-popup-contents" style="max-height: 400px; overflow-y: auto; overflow-x: hidden;">
    `;
    
    layerTypes.forEach((layerType, index) => {
      const features = groupedFeatures[layerType];
      const isActive = index === 0 ? 'block' : 'none';
      html += `
        <div id="tab-content-${index}" class="tabbed-popup-content" style="display: ${isActive};">
      `;
      
      features.forEach((feature, featureIndex) => {
        if (features.length > 1) {
          html += `<div style="margin-bottom: ${featureIndex < features.length - 1 ? '16px' : '0'}; padding-bottom: ${featureIndex < features.length - 1 ? '16px' : '0'}; border-bottom: ${featureIndex < features.length - 1 ? '1px solid #e5e7eb' : 'none'};">
            ${feature.popupContent}
          </div>`;
        } else {
          html += feature.popupContent;
        }
      });
      
      html += `</div>`;
    });
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  };

  // CSV export now handled by shared utility function

  // Mobile: Full screen map with overlay back button
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 bg-white"
        style={{ 
          height: '100dvh', 
          width: '100vw',
          zIndex: 9999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          margin: 0,
          padding: 0
        }}
      >
        {/* Map Container - Full Screen */}
        <div 
          ref={mapRef} 
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            margin: 0,
            padding: 0
          }}
        />
          
          {/* Back Button Overlay - Top Left (very compact for mobile) */}
          <button
            onClick={onBackToConfig}
            className="absolute top-1 left-1 z-[1000] bg-white rounded shadow-md px-1.5 py-1 flex items-center text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            style={{ zIndex: 1000 }}
          >
            <span className="text-sm">←</span>
            <span className="text-[10px] font-medium ml-0.5">Back</span>
          </button>
          
          {/* Download Button Overlay - Top Right (icon only, very compact for mobile) */}
          {results.length === 1 && (
            <button
              onClick={() => exportEnrichmentResultsToCSV(results)}
              className="absolute top-1 right-1 z-[1000] bg-blue-600 text-white rounded shadow-md p-1.5 hover:bg-blue-700 transition-colors"
              style={{ zIndex: 1000, minWidth: 'auto', width: 'auto' }}
              title="Download all proximity layers and distances for this location"
            >
              <span className="text-xs">⬇️</span>
            </button>
          )}
          
          {/* Mobile Legend - Bottom Right (very compact for mobile) */}
          {legendItems.length > 0 && (
            <div className="absolute bottom-1 right-1 bg-white rounded shadow-md p-1.5 max-w-[160px] z-[1000] max-h-[40vh] overflow-y-auto">
              <h4 className="text-[9px] font-semibold text-gray-900 mb-1">Legend</h4>
              <div className="space-y-0.5">
                {legendItems.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center space-x-0.5 text-[9px]">
                      <div 
                        className="w-2 h-2 rounded-full flex items-center justify-center text-[8px] flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.icon}
                      </div>
                      <span className="text-gray-700 truncate">{item.title}</span>
                      <span className="text-gray-500 flex-shrink-0">({item.count})</span>
                    </div>
                    {/* Show ranges for broadband layer */}
                    {item.ranges && item.ranges.length > 0 && (
                      <div className="ml-3 mt-0.5 space-y-0.5">
                        {item.ranges.map((range, rangeIndex) => (
                          <div key={rangeIndex} className="flex items-center space-x-1 text-[8px]">
                            <div 
                              className="w-1.5 h-1.5 rounded flex-shrink-0"
                              style={{ backgroundColor: range.color }}
                            />
                            <span className="text-gray-600 truncate">{range.label}</span>
                            <span className="text-gray-400 flex-shrink-0">({range.count})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Batch Success Message - Mobile */}
          {showBatchSuccess && (
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-1.5 py-1 rounded shadow-md z-[1000]">
              <div className="flex items-center space-x-0.5">
                <span className="text-[10px]">✅</span>
                <span className="text-[9px] font-medium">Batch completed!</span>
              </div>
            </div>
          )}
      </div>
    );
  }

  // Desktop: Original layout with header
  return (
    <div
      className="h-screen flex flex-col bg-white"
    >
      {/* Results Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToConfig}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="w-5 h-5">←</span>
            <span className="text-sm font-medium">Back to Configuration</span>
          </button>
          
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">{results.length} location{results.length !== 1 ? 's' : ''} processed</p>
          </div>
          
          {/* Prominent Download Button for Single Lookup */}
          {results.length === 1 && (
            <button
              onClick={() => exportEnrichmentResultsToCSV(results)}
              className="btn btn-primary flex items-center space-x-2 px-4 py-2"
              title="Download all proximity layers and distances for this location"
            >
              <span className="w-4 h-4">⬇️</span>
              <span>Download Results</span>
            </button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div 
        className="flex-1 relative"
      >
        <div 
          ref={mapRef} 
          className="w-full h-full"
          style={{ 
            height: '100%', 
            width: '100%',
            opacity: isMapReady ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
        
        {/* Dynamic Legend - Always show when there are legend items (Desktop only) */}
        {legendItems.length > 0 && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-6 max-w-md z-10">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Map Legend</h4>
            <div className="space-y-3">
              {legendItems.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center space-x-3 text-base">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.icon}
                    </div>
                    <span className="text-gray-700 font-medium flex-1">{item.title}</span>
                    <span className="text-gray-600 font-semibold ml-auto">{item.count || 0}</span>
                  </div>
                  {/* Show ranges for broadband layer */}
                  {item.ranges && item.ranges.length > 0 && (
                    <div className="ml-11 mt-2 space-y-2">
                      {item.ranges.map((range, rangeIndex) => (
                        <div key={rangeIndex} className="flex items-center space-x-3 text-sm">
                          <div 
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ backgroundColor: range.color }}
                          />
                          <span className="text-gray-600">{range.label}</span>
                          <span className="text-gray-400">({range.count})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Batch Success Message */}
        {showBatchSuccess && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span className="text-sm font-medium">Batch processing completed successfully!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
export { MapView };
