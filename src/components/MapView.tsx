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
    key === 'ct_building_footprints_all' || // Skip CT building footprints array (handled separately for map drawing)
    key === 'ct_roads_all' || // Skip CT roads array (handled separately for map drawing)
    key === 'ct_urgent_care_all' || // Skip CT urgent care array (handled separately for map drawing)
    key === 'ct_deep_properties_all' || // Skip CT DEEP properties array (handled separately for map drawing)
    key === 'ct_tribal_lands_all' || // Skip CT Tribal Lands array (handled separately for map drawing)
    key === 'ct_drinking_water_watersheds_all' || // Skip CT Drinking Water Watersheds array (handled separately for map drawing)
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
  // Default to hybrid basemap (no dropdown, fixed basemap)
  const selectedBasemap = 'hybrid';
  const [viewportHeight, setViewportHeight] = useState<number>(() => (
    typeof window !== 'undefined' ? window.innerHeight : 0
  ));
  const [viewportWidth, setViewportWidth] = useState<number>(() => (
    typeof window !== 'undefined' ? window.innerWidth : 0
  ));

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (mapInstanceRef.current) {
      // Force a resize check for mobile
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
      return;
    }

    // Small delay to ensure container is properly sized, especially on mobile
    setTimeout(() => {
      if (!mapRef.current || mapInstanceRef.current) return;
      
      // Initialize map with geocoded location if available, otherwise default US view
      const initialCenter: [number, number] = results && results.length > 0 && results[0]?.location
        ? [results[0].location.lat, results[0].location.lon] as [number, number]
        : [37.0902, -95.7129] as [number, number];
      const initialZoom = results && results.length > 0 && results[0]?.location ? 15 : 4;
      
      const map = L.map(mapRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: !isMobile, // Hide zoom controls on mobile to save space
        attributionControl: true,
      });

      // Initialize with hybrid basemap (fixed, no dropdown)
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
      
      // CRITICAL: Wait for container to be visible and sized before setting view
      // This fixes the issue where map shows default US view until F12
      const waitForContainerAndSetView = (attempt = 0) => {
        if (!mapRef.current || !mapInstanceRef.current) {
          if (attempt < 30) {
            setTimeout(() => waitForContainerAndSetView(attempt + 1), 50);
          }
          return;
        }
        
        const container = mapRef.current;
        const rect = container.getBoundingClientRect();
        const styles = window.getComputedStyle(container);
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         styles.display !== 'none' && 
                         styles.visibility !== 'hidden' &&
                         styles.opacity !== '0';
        
        if (isVisible && rect.width > 100 && rect.height > 100) {
          console.log('🗺️ Container is visible and sized. Size:', rect.width, 'x', rect.height);
          
          // If we have results, set view to geocoded location immediately
          if (results && results.length > 0 && results[0]?.location) {
            mapInstanceRef.current.setView([results[0].location.lat, results[0].location.lon], 15, { animate: false });
          }
          
          // Ensure map is properly sized
          mapInstanceRef.current.invalidateSize();
        } else if (attempt < 30) {
          // Continue checking
          setTimeout(() => waitForContainerAndSetView(attempt + 1), 50);
        }
      };
      
      // Start checking after a brief delay
      setTimeout(() => waitForContainerAndSetView(), 100);
    }, 50);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupsRef.current = null;
        basemapLayerRef.current = null;
      }
    };
  }, [isMobile, results.length]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateViewportDimensions = () => {
      const vv = window.visualViewport;
      const height = vv?.height ?? window.innerHeight;
      const width = vv?.width ?? window.innerWidth;
      setViewportHeight(height);
      setViewportWidth(width);
      if (mapInstanceRef.current) {
        requestAnimationFrame(() => mapInstanceRef.current?.invalidateSize());
      }
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

  useEffect(() => {
    if (!mapInstanceRef.current) {
      return;
    }

    const invalidate = () => mapInstanceRef.current?.invalidateSize();

    // Run immediately and schedule a follow-up once layout stabilizes
    invalidate();
    const frameId = requestAnimationFrame(invalidate);
    const timeoutId = window.setTimeout(invalidate, 300);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [isMobile, results.length]);

  useEffect(() => {
    if (!mapRef.current || !mapInstanceRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    // ResizeObserver to handle container size changes
    // Use debouncing to avoid excessive invalidateSize calls that cause twitching
    let resizeTimeout: NodeJS.Timeout | null = null;
    const observer = new ResizeObserver(() => {
      // Debounce resize events to reduce twitching
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150); // Debounce to 150ms
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

    console.log('🔍 [DEBUG] Clearing layers');
    primary.clearLayers();
    poi.clearLayers();
    
    // CRITICAL: Ensure container has dimensions before proceeding
    const ensureContainerReady = (attempt = 0): void => {
      if (!map) {
        console.warn('🔍 [DEBUG] Map not available, skipping container check');
        return;
      }
      
      const container = map.getContainer();
      const hasDimensions = container && container.offsetWidth > 0 && container.offsetHeight > 0;
      
      console.log(`🔍 [DEBUG] Container check attempt ${attempt + 1}`, {
        width: container?.offsetWidth || 0,
        height: container?.offsetHeight || 0,
        hasDimensions,
        display: container ? window.getComputedStyle(container).display : 'N/A',
        visibility: container ? window.getComputedStyle(container).visibility : 'N/A',
        opacity: container ? window.getComputedStyle(container).opacity : 'N/A'
      });
      
      if (!hasDimensions && attempt < 20) {
        map.invalidateSize(true);
        setTimeout(() => ensureContainerReady(attempt + 1), 100);
        return;
      }
      
      if (!hasDimensions) {
        console.warn('🔍 [DEBUG WARNING] Container still has no dimensions after 20 attempts, proceeding anyway');
      }
      
      console.log('🔍 [DEBUG] Container ready, proceeding with feature addition');
      
      // Force invalidateSize before doing anything
      map.invalidateSize(true);
      
      // STEP 1: Add location marker (view already set during map initialization)
      if (results[0]?.location) {
        // Map view was already set during initialization, just add marker
        const locationMarker = L.marker([results[0].location.lat, results[0].location.lon], {
          title: results[0].location.name,
        });
        locationMarker.bindPopup(createPopupContent(results[0]), { maxWidth: 540 });
        locationMarker.addTo(primary);
        
        console.log('🔍 [DEBUG] Location marker added');
      }
      
      // STEP 2: Add all enrichment features
      // Use requestAnimationFrame only (no setTimeout to reduce twitching)
      let timeoutId: NodeJS.Timeout | null = null;
      const rafId = requestAnimationFrame(() => {
        // Small delay to batch feature additions, but minimal to reduce twitching
        timeoutId = setTimeout(() => {
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

                  // Create polyline with gray color for roads
                  const polyline = L.polyline(latlngs, {
                    color: '#6b7280', // Gray color for roads
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
              color: '#6b7280',
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

                  // Create polyline with orange color for CT roads
                  const polyline = L.polyline(latlngs, {
                    color: '#f97316', // Orange color for CT roads
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
              color: '#f97316',
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
        
        // CRITICAL: After all features are drawn, force a resize and redraw
        // This ensures everything is visible (same as what F12 does)
        if (mapInstanceRef.current) {
          console.log('🗺️ STEP 2: Forcing resize and layer redraw after all features drawn');
          
          // Force multiple resize events in sequence (this is what F12 does)
          const forceRedraw = () => {
            window.dispatchEvent(new Event('resize'));
            mapInstanceRef.current?.invalidateSize();
            
            // Force redraw of all layers
            mapInstanceRef.current?.eachLayer((layer: any) => {
              if (layer.redraw) {
                try {
                  layer.redraw();
                } catch (e) {
                  // Some layers don't have redraw, that's ok
                }
              }
              // For markers, force update by resetting position
              if (layer instanceof L.Marker) {
                const marker = layer as L.Marker;
                const latlng = marker.getLatLng();
                marker.setLatLng([latlng.lat, latlng.lng]);
              }
            });
          };
          
          // Force redraw multiple times
          forceRedraw();
          setTimeout(forceRedraw, 50);
          setTimeout(forceRedraw, 100);
          setTimeout(forceRedraw, 200);
        }
        
            console.log('🔍 [DEBUG] All features added, forcing single refresh');
            
            // Single refresh after all features are added (reduces twitching)
            if (mapInstanceRef.current) {
              // Use requestAnimationFrame to ensure we're in the right render cycle
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (mapInstanceRef.current) {
                    // Single invalidateSize call
                    mapInstanceRef.current.invalidateSize(true);
                    
                    // Single resize event
                    window.dispatchEvent(new Event('resize', { bubbles: true }));
                    
                    console.log('🔍 [DEBUG] Map refreshed after all features added');
                  }
                });
              });
            }
          }, 100); // Closes inner setTimeout
          
          return () => {
            cancelAnimationFrame(rafId);
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
          };
        }); // Closes requestAnimationFrame
    } // Closes ensureContainerReady
    
    // Start the process
    ensureContainerReady();
    } // Closes addFeaturesToMap function
    
    // Cleanup
    return () => {
      console.log('🔍 [DEBUG] useEffect cleanup');
    };
  }, [results, viewportHeight, viewportWidth]);

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
                  <div key={index} className="flex items-center space-x-0.5 text-[9px]">
                    <div 
                      className="w-2 h-2 rounded-full flex items-center justify-center text-[8px] flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.icon}
                    </div>
                    <span className="text-gray-700 truncate">{item.title}</span>
                    <span className="text-gray-500 flex-shrink-0">({item.count})</span>
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
          style={{ height: '100%', width: '100%' }}
        />
        
        {/* Dynamic Legend - Always show when there are legend items (Desktop only) */}
        {legendItems.length > 0 && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Map Legend</h4>
            <div className="space-y-2">
              {legendItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-gray-700">{item.title}</span>
                  <span className="text-gray-500">({item.count})</span>
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
