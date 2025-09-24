import React, { useEffect, useRef, useState } from 'react';
import { EnrichmentResult } from '../App';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { exportEnrichmentResultsToCSV } from '../utils/csvExport';

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
  'poi_animal_vehicle_collisions': { icon: '🦌', color: '#dc2626', title: 'Animal Vehicle Collisions' },
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

const MapView: React.FC<MapViewProps> = ({ results, onBackToConfig, isMobile = false, previousViewMode = null }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [legendItems, setLegendItems] = useState<LegendItem[]>([]);
  const [showBatchSuccess, setShowBatchSuccess] = useState(false);

  // CSV export now handled by shared utility function

  return (
    <div className={`${isMobile ? 'h-screen' : 'h-screen'} flex flex-col bg-white`}>
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
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default MapView;
