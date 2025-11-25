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
    key === 'nh_nwi_plus_all' // Skip wetlands array (handled separately for map drawing)
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
  const [legendItems, setLegendItems] = useState<LegendItem[]>([]);
  const [showBatchSuccess, setShowBatchSuccess] = useState(false);
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
      mapInstanceRef.current.invalidateSize();
      return;
    }

    const map = L.map(mapRef.current, {
      center: [37.0902, -95.7129],
      zoom: 4,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const primary = L.layerGroup().addTo(map);
    const poi = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    layerGroupsRef.current = { primary, poi };

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupsRef.current = null;
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

    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });

    observer.observe(mapRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupsRef.current) {
      return;
    }

    const map = mapInstanceRef.current;
    const { primary, poi } = layerGroupsRef.current;

    primary.clearLayers();
    poi.clearLayers();

    if (!results || results.length === 0) {
      setLegendItems([]);
      setShowBatchSuccess(false);
      return;
    }

    const bounds = L.latLngBounds([]);
    const legendAccumulator: Record<string, LegendItem> = {};

    results.forEach((result) => {
      const { location, enrichments } = result;
      if (!location) {
        return;
      }

      const latLng = L.latLng(location.lat, location.lon);
      bounds.extend(latLng);

      const locationMarker = L.marker(latLng, {
        title: location.name,
      });

      locationMarker.bindPopup(createPopupContent(result), { maxWidth: 540 });
      // Location marker always visible, add directly to primary
      locationMarker.addTo(primary);

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
        console.log(`🔍 NH Transmission/Pipelines: Found ${enrichments.nh_transmission_pipelines_all.length} items`);
        let tpCount = 0;
        enrichments.nh_transmission_pipelines_all.forEach((tp: any, index: number) => {
          console.log(`🔍 TP ${index}:`, { hasGeometry: !!tp.geometry, hasPaths: !!(tp.geometry && tp.geometry.paths), geometry: tp.geometry });
          if (tp.geometry && tp.geometry.paths) {
            try {
              // Convert ESRI polyline paths to Leaflet LatLng arrays
              // ESRI polylines have paths (array of coordinate arrays)
              const paths = tp.geometry.paths;
              if (paths && paths.length > 0) {
                tpCount++;
                console.log(`✅ Drawing TP ${index} with ${paths.length} paths`);
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
            console.warn(`⚠️ TP ${index}: Missing geometry or paths`, tp);
          }
        });
        
        console.log(`✅ NH Transmission/Pipelines: Drew ${tpCount} items`);
        
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
        console.log('ℹ️ NH Transmission/Pipelines: No data or not an array', enrichments.nh_transmission_pipelines_all);
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

      // Draw MA DEP Wetlands as polygons on the map
      if (enrichments.ma_dep_wetlands_all && Array.isArray(enrichments.ma_dep_wetlands_all)) {
        console.log(`🗺️ Drawing MA DEP Wetlands: ${enrichments.ma_dep_wetlands_all.length} features`);
        enrichments.ma_dep_wetlands_all.forEach((wetland: any, index: number) => {
          console.log(`🗺️ MA DEP Wetland ${index}:`, {
            hasGeometry: !!wetland.geometry,
            geometryType: wetland.geometry?.type || wetland.geometry?.rings ? 'rings' : 'unknown',
            hasRings: !!wetland.geometry?.rings,
            ringsLength: wetland.geometry?.rings?.length
          });
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

      // Draw MA NHESP Natural Communities as polygons on the map
      if (enrichments.ma_nhesp_natural_communities_all && Array.isArray(enrichments.ma_nhesp_natural_communities_all)) {
        console.log(`🗺️ Drawing ${enrichments.ma_nhesp_natural_communities_all.length} MA NHESP Natural Communities`);
        enrichments.ma_nhesp_natural_communities_all.forEach((community: any, index: number) => {
          console.log(`🗺️ MA NHESP Natural Community ${index}:`, {
            hasGeometry: !!community.geometry,
            geometryType: community.geometry?.type || (community.geometry?.rings ? 'rings' : 'unknown'),
            hasRings: !!community.geometry?.rings,
            ringsLength: community.geometry?.rings?.length
          });
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
              console.error('Error drawing parcel polygon:', error);
            }
          }
        });
      }

      Object.entries(enrichments).forEach(([key, value]) => {
        if (!Array.isArray(value)) {
          return;
        }

        if (!/_detailed$|_elements$|_features$/i.test(key)) {
          return;
        }

        const baseKey = key.replace(/_(detailed|elements|features)$/i, '');
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
        legendAccumulator[baseKey].count += itemsArray.length;

        const leafletIcon = createPOIIcon(iconEmoji, iconColor);

        itemsArray.slice(0, 100).forEach((item) => {
          const poiLat =
            item.lat ??
            item.latitude ??
            item.location?.lat ??
            item.center?.lat ??
            item.geometry?.coordinates?.[1];
          const poiLon =
            item.lon ??
            item.longitude ??
            item.location?.lon ??
            item.center?.lon ??
            item.geometry?.coordinates?.[0];

          if (typeof poiLat !== 'number' || typeof poiLon !== 'number') {
            return;
          }

          const poiMarker = L.marker([poiLat, poiLon], { icon: leafletIcon });
          poiMarker.bindPopup(createPOIPopupContent(item, legendTitle, baseKey), { maxWidth: 360 });
          poiMarker.addTo(poi);
        });
      });
    });

    // Always center on the geocoded location, don't zoom out to show all features
    if (results[0]?.location) {
      map.setView([results[0].location.lat, results[0].location.lon], 12);
    }

    setLegendItems(
      Object.values(legendAccumulator).sort((a, b) => b.count - a.count)
    );
    setShowBatchSuccess(results.length > 1);
  }, [results, viewportHeight, viewportWidth]);

  // CSV export now handled by shared utility function

  // Mobile: Full screen map with overlay back button
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 w-full h-full bg-white"
        style={{ 
          height: '100vh', 
          width: '100vw',
          zIndex: 9999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
        {/* Map Container - Full Screen */}
        <div 
          className="relative w-full h-full"
          style={{
            height: '100vh',
            width: '100vw',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div 
            ref={mapRef} 
            className="w-full h-full"
            style={{
              height: '100vh',
              width: '100vw',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1
            }}
          />
          
          {/* Back Button Overlay - Top Left */}
          <button
            onClick={onBackToConfig}
            className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            style={{ zIndex: 1000 }}
          >
            <span className="text-lg">←</span>
            <span className="text-sm font-medium">Back</span>
          </button>
          
          {/* Download Button Overlay - Top Right (for single location) */}
          {results.length === 1 && (
            <button
              onClick={() => exportEnrichmentResultsToCSV(results)}
              className="absolute top-4 right-4 z-[1000] bg-blue-600 text-white rounded-lg shadow-lg px-3 py-2 flex items-center space-x-2 hover:bg-blue-700 transition-colors"
              style={{ zIndex: 1000 }}
              title="Download all proximity layers and distances for this location"
            >
              <span className="text-sm">⬇️</span>
              <span className="text-sm font-medium">Download</span>
            </button>
          )}
          
          {/* Mobile Legend - Bottom Right */}
          {legendItems.length > 0 && (
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-[200px] z-[1000] max-h-[60vh] overflow-y-auto">
              <h4 className="text-xs font-semibold text-gray-900 mb-2">Legend</h4>
              <div className="space-y-1.5">
                {legendItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-1.5 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
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
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg z-[1000]">
              <div className="flex items-center space-x-2">
                <span>✅</span>
                <span className="text-xs font-medium">Batch completed!</span>
              </div>
            </div>
          )}
        </div>
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
