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

const MapView: React.FC<MapViewProps> = ({ results, onBackToConfig, isMobile = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [legendItems, setLegendItems] = useState<LegendItem[]>([]);
  const [showBatchSuccess, setShowBatchSuccess] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = () => {
      if (!mapRef.current) return;

      console.log('🗺️ Initializing map...');
      
      const map = L.map(mapRef.current, {
        center: [39.8283, -98.5795], // Center of USA
        zoom: 4,
        zoomControl: true,
        minZoom: 2,
        maxZoom: 19
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    };

    initMap();

    // Force map resize on mobile after initialization
    if (isMobile) {
      // Multiple resize attempts for mobile
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
      
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 500);
      
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 1000);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMobile]);

  // Add mobile resize listener
  useEffect(() => {
    if (!isMobile || !mapInstanceRef.current) return;

    const handleResize = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isMobile]);

  // Add markers to map
  useEffect(() => {
    if (!mapInstanceRef.current || !results.length) return;

    const map = mapInstanceRef.current;
    
    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    markersRef.current = [];

    // Add main location markers
    const bounds = L.latLngBounds([]);
    let firstMarker: L.Marker | null = null;
    
    results.forEach((result, index) => {
      const { lat, lon } = result.location;
      
      if (lat && lon) {
        // Add main location marker
        const mainMarker = L.marker([lat, lon], {
          icon: L.divIcon({
            html: `<div style="
              background-color: #2563eb;
              border: 3px solid white;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              color: white;
              box-shadow: 0 3px 6px rgba(0,0,0,0.4);
            ">📍</div>`,
            className: 'main-location-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
          })
        })
          .bindPopup(createPopupContent(result))
          .addTo(map);
        
        markersRef.current.push(mainMarker);
        
        // Extend bounds for batch results
        if (results.length > 1) {
          bounds.extend([lat, lon]);
        }
        
        // Store reference to first marker
        if (index === 0) {
          firstMarker = mainMarker;
        }

        // For single search results, set initial map view
        if (results.length === 1) {
          map.setView([lat, lon], 16, { animate: true });
          addPOIMarkers(map, result);
        }
      }
    });

    // Fit map to show all markers for batch results
    if (bounds.isValid() && results.length > 1) {
      map.fitBounds(bounds, { 
        padding: [20, 20],
        maxZoom: 16
      });
    }

    // Auto-open popup for first marker
    if (firstMarker) {
      setTimeout(() => {
        firstMarker?.openPopup();
      }, 500);
    }

    // Show batch success message if multiple results
    if (results.length > 1) {
      setShowBatchSuccess(true);
      setTimeout(() => {
        setShowBatchSuccess(false);
      }, 5000);
    }
  }, [results]);

  // Add POI markers to the map
  const addPOIMarkers = (map: L.Map, result: EnrichmentResult) => {
    console.log('📍 Adding POI markers');
    
    const currentLegendItems: LegendItem[] = [];
    
    // Extract POI data from enrichment results
    Object.entries(result.enrichments).forEach(([key, value]) => {
      if ((key.includes('poi_') || key.includes('at_') || key.includes('pct_')) && Array.isArray(value)) {
        const poiType = key.replace('_detailed', '');
        const iconConfig = POI_ICONS[poiType] || POI_ICONS.default;
        
        // Add to legend if we have POIs
        if (value.length > 0) {
          currentLegendItems.push({
            icon: iconConfig.icon,
            color: iconConfig.color,
            title: iconConfig.title,
            count: value.length
          });
        }
        
        // Add markers for each POI
        value.forEach((poi: any) => {
          const poiName = poi.name || poi.title;
          
          if (poi.lat && poi.lon && poiName) {
            const poiMarker = L.marker([poi.lat, poi.lon], {
              icon: createPOIIcon(iconConfig.icon, iconConfig.color)
            })
              .bindPopup(createPOIPopupContent(poi, iconConfig.title))
              .addTo(map);
            
            markersRef.current.push(poiMarker);
          }
        });
      }
    });

    // Update legend state
    setLegendItems(currentLegendItems);
  };

  // Create popup content for POI markers
  const createPOIPopupContent = (poi: any, category: string): string => {
    const name = poi.tags?.name || poi.name || poi.title || 'Unnamed POI';
    const amenity = poi.tags?.amenity || poi.tags?.shop || poi.tags?.tourism || 'POI';
    const distance = poi.distance_miles || 'Unknown';
    
    return `
      <div style="min-width: 250px; max-width: 350px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${name}</h3>
        <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
          📍 ${category} • ${distance} miles away
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
          🏷️ Type: ${amenity}
        </div>
      </div>
    `;
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
          🔍 Source: ${location.source}
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
          <div style="color: #1f2937; font-weight: 600;">${enrichments.elevation_ft} ft</div>
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
    
    content += `
          </div>
        </div>
      </div>
    `;
    
    return content;
  };

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
      <div className={`flex-1 relative ${isMobile ? 'map-container' : ''}`}>
        <div ref={mapRef} className={`w-full h-full ${isMobile ? 'mobile-map' : ''}`} />
        
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
