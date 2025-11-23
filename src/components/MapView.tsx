import React, { useEffect, useRef, useState } from 'react';
import { EnrichmentResult } from '../App';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { exportEnrichmentResultsToCSV } from '../utils/csvExport';
import { poiConfigManager } from '../lib/poiConfig';

const HEADER_HEIGHT = 60;

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
    key === 'nh_recreation_trails_all' // Skip trails array (handled separately for map drawing)
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
        enrichments.nh_recreation_trails_all.forEach((trail: any) => {
          if (trail.geometry && trail.geometry.paths) {
            try {
              // Convert ESRI polyline paths to Leaflet LatLng arrays
              // ESRI polylines have paths (array of coordinate arrays)
              const paths = trail.geometry.paths;
              if (paths && paths.length > 0) {
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

  const isLandscape = viewportWidth > viewportHeight && viewportHeight > 0;
  const mobileMapHeight = Math.max(viewportHeight - HEADER_HEIGHT, isLandscape ? 240 : 320);

  return (
    <div
      className={`${isMobile ? 'min-h-screen overflow-y-auto' : 'h-screen'} flex flex-col bg-white`}
      style={isMobile ? { minHeight: viewportHeight || undefined } : undefined}
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
        className={`flex-1 relative ${isMobile ? 'map-container' : ''}`}
        style={
          isMobile
            ? {
                height: `${mobileMapHeight}px`,
                minHeight: isLandscape ? '240px' : '320px',
                width: '100%',
                maxWidth: '100%',
                position: 'relative',
                overflow: 'hidden',
                flex: '1 1 auto'
              }
            : {}
        }
      >
        <div 
          ref={mapRef} 
          className={`w-full h-full ${isMobile ? 'mobile-map' : ''}`}
          style={
            isMobile
              ? {
                  height: '100%',
                  width: '100%',
                  minHeight: isLandscape ? '240px' : '320px',
                  position: 'relative',
                  display: 'block',
                  maxWidth: '100%'
                }
              : { height: '100%', width: '100%' }
          }
        />
        
        {/* Dynamic Legend for Single Location Results */}
        {results.length === 1 && legendItems.length > 0 && !isMobile && (
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
