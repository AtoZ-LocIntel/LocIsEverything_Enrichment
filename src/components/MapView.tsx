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

      const container = mapRef.current;
      
      // CRITICAL: Force explicit dimensions BEFORE Leaflet initialization (mobile fix)
      if (isMobile) {
        const vh = window.innerHeight || window.screen.height;
        const headerHeight = 60; // Approximate header height
        const calculatedHeight = Math.max(vh - headerHeight, 400);
        const calculatedWidth = window.innerWidth || window.screen.width;
        
        // Set explicit pixel dimensions
        container.style.height = `${calculatedHeight}px`;
        container.style.width = `${calculatedWidth}px`;
        container.style.minHeight = '400px';
        container.style.position = 'relative';
        container.style.display = 'block';
        container.style.overflow = 'hidden';
        
        console.log('🗺️ Forced container dimensions:', {
          height: calculatedHeight,
          width: calculatedWidth,
          vh,
          headerHeight,
          offsetHeight: container.offsetHeight,
          offsetWidth: container.offsetWidth
        });
        
        // Wait for styles to apply
        requestAnimationFrame(() => {
          if (!mapRef.current) return;
          
          const finalRect = mapRef.current.getBoundingClientRect();
          console.log('🗺️ Final container dimensions:', {
            height: finalRect.height,
            width: finalRect.width,
            offsetHeight: mapRef.current.offsetHeight,
            offsetWidth: mapRef.current.offsetWidth
          });
          
          // Only proceed if dimensions are valid
          if (finalRect.height > 0 && finalRect.width > 0) {
            initializeLeafletMap();
          } else {
            console.error('🗺️ Container still has zero dimensions, using fallback');
            mapRef.current.style.height = `${window.innerHeight - 60}px`;
            mapRef.current.style.width = `${window.innerWidth}px`;
            setTimeout(() => initializeLeafletMap(), 100);
          }
        });
      } else {
        initializeLeafletMap();
      }
    };
    
    const initializeLeafletMap = () => {
      if (!mapRef.current) return;
      
      console.log('🗺️ Initializing Leaflet map...', { 
        isMobile, 
        containerHeight: mapRef.current.offsetHeight, 
        containerWidth: mapRef.current.offsetWidth 
      });
      
      const map = L.map(mapRef.current, {
        center: [39.8283, -98.5795], // Center of USA
        zoom: 4,
        zoomControl: !isMobile, // Hide zoom controls on mobile
        minZoom: 2,
        maxZoom: 19,
        // Mobile-optimized settings
        touchZoom: true,
        doubleClickZoom: !isMobile,
        boxZoom: false,
        keyboard: !isMobile,
        scrollWheelZoom: !isMobile,
        // Better mobile performance
        dragging: true,
        inertia: true,
        inertiaDeceleration: 3000,
        inertiaMaxSpeed: 1500,
        preferCanvas: false
      });

      // Add OpenStreetMap tiles with better mobile compatibility
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        // Better mobile tile loading
        crossOrigin: true,
        // Retry failed tiles
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      }).addTo(map);
      
      // Add error handling for tile loading
      map.on('tileerror', (error: any) => {
        console.warn('🗺️ Tile loading error:', error);
      });

      mapInstanceRef.current = map;

      // Force multiple invalidateSize calls on mobile
      if (isMobile) {
        const invalidateSize = () => {
          if (mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current.invalidateSize(true);
            console.log('🗺️ Map size invalidated (mobile)', { 
              containerHeight: mapRef.current.offsetHeight, 
              containerWidth: mapRef.current.offsetWidth 
            });
          }
        };
        
        // Multiple invalidate calls with different delays
        requestAnimationFrame(invalidateSize);
        setTimeout(invalidateSize, 50);
        setTimeout(invalidateSize, 200);
        setTimeout(invalidateSize, 500);
      }
    };

    // For mobile, delay initialization to ensure container is sized and visible
    if (isMobile) {
      // Wait for DOM to be fully ready and container to be visible
      const checkAndInit = () => {
        if (mapRef.current) {
          const rect = mapRef.current.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           mapRef.current.offsetParent !== null;
          
          if (isVisible) {
            console.log('🗺️ Container is visible, initializing map');
            initMap();
          } else {
            console.log('🗺️ Container not yet visible, retrying...', rect);
            setTimeout(checkAndInit, 100);
          }
        }
      };
      
      // Initial delay, then check visibility
      setTimeout(() => {
        checkAndInit();
      }, 200);
    } else {
      initMap();
    }

    // Cleanup function
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
    const legendAccumulator: Record<string, { icon: string; color: string; poiSet: Set<string> }> = {};
    
    // First, collect all POI keys and prioritize the most detailed version
    const poiKeys: string[] = [];
    Object.keys(result.enrichments).forEach(key => {
      if ((key.includes('poi_') || key.includes('at_') || key.includes('pct_') || key.includes('padus_')) && 
          Array.isArray(result.enrichments[key]) && 
          result.enrichments[key].length > 0) {
        poiKeys.push(key);
      }
    });
    
    // Sort to prioritize detailed versions (process _detailed first, then _all_pois, etc.)
    poiKeys.sort((a, b) => {
      const aPriority = a.includes('_detailed') ? 0 : a.includes('_all_pois') ? 1 : 2;
      const bPriority = b.includes('_detailed') ? 0 : b.includes('_all_pois') ? 1 : 2;
      return aPriority - bPriority;
    });
    
    // Extract POI data from enrichment results, using deduplication
    poiKeys.forEach(key => {
      const value = result.enrichments[key];
      if (!Array.isArray(value)) return;
      
      // Extract base POI type by removing common suffixes
      let poiType = key
        .replace('_detailed', '')
        .replace('_all_pois', '')
        .replace('_elements', '')
        .replace('_nearby_features', '')
        .replace('_features', '')
        .replace('_all', '')
        .replace(/_count$/,'');
      
      // Handle PADUS keys specially
      if (key.includes('padus_public_access_nearby_features')) {
        poiType = 'poi_padus_public_access';
      } else if (key.includes('padus_protection_status_nearby_features')) {
        poiType = 'poi_padus_protection_status';
      }

      // Fallback: try to find a POI_ICONS key that prefixes the actual key
      if (!POI_ICONS[poiType]) {
        const prefixKey = Object.keys(POI_ICONS).find(k => key.startsWith(k));
        if (prefixKey) {
          poiType = prefixKey;
        }
      }

      // Get icon config from POI_ICONS (final fallback to default)
      const iconConfig = POI_ICONS[poiType] || POI_ICONS.default;
      
      // Get actual label from POI config manager, fallback to iconConfig title
      let legendTitle = iconConfig.title;
      try {
        const poiConfig = poiConfigManager.getPOIType(poiType);
        if (poiConfig && poiConfig.label) {
          legendTitle = poiConfig.label;
        }
      } catch (e) {
        // If getPOIType fails, use the iconConfig title
        console.log('Could not find POI config for:', poiType);
      }
      
      // Initialize legend accumulator for this title if needed
      if (!legendAccumulator[legendTitle]) {
        legendAccumulator[legendTitle] = {
          icon: iconConfig.icon,
          color: iconConfig.color,
          poiSet: new Set<string>()
        };
      }
      
      // Add markers for each POI, using lat/lon as unique identifier to avoid duplicates
      value.forEach((poi: any) => {
        let poiName = poi.name || poi.title || poi.unitName || poi.boundaryName;
        let lat = poi.lat || poi.latitude;
        let lon = poi.lon || poi.longitude;
        
        // Handle PADUS features - they don't have lat/lon, need to calculate centroid
        if (key.includes('padus_') && (!lat || !lon)) {
          // Check if we have geometry data
          if (poi.geometry) {
            console.log('PADUS feature has geometry, calculating centroid:', poiName, poi.geometry);
            // Calculate centroid from polygon geometry
            const centroid = calculatePolygonCentroid(poi.geometry);
            if (centroid) {
              lat = centroid.lat;
              lon = centroid.lon;
              console.log('PADUS centroid calculated:', lat, lon, 'for', poiName);
            } else {
              console.log('Failed to calculate centroid for PADUS feature:', poiName);
            }
          } else {
            console.log('PADUS feature has no geometry:', poiName, poi);
          }
          // If still no coordinates, skip this feature
          if (!lat || !lon) {
            console.log('Skipping PADUS feature without coordinates:', poiName);
            return;
          }
        }
        
        if (lat && lon && poiName) {
          // Create unique key from coordinates (rounded to avoid floating point issues)
          const poiKey = `${legendTitle}_${lat.toFixed(6)}_${lon.toFixed(6)}`;
          
          // Only add if we haven't seen this POI before
          if (!legendAccumulator[legendTitle].poiSet.has(poiKey)) {
            legendAccumulator[legendTitle].poiSet.add(poiKey);
            
            const poiMarker = L.marker([lat, lon], {
              icon: createPOIIcon(iconConfig.icon, iconConfig.color)
            })
              .bindPopup(createPOIPopupContent(poi, legendTitle, key))
              .addTo(map);
            
            markersRef.current.push(poiMarker);
          }
        }
      });
    });

    // Convert accumulated POI sets to counts for legend
    Object.entries(legendAccumulator).forEach(([title, data]) => {
      if (data.poiSet.size > 0) {
        currentLegendItems.push({ 
          icon: data.icon, 
          color: data.color, 
          title, 
          count: data.poiSet.size 
        });
      }
    });

    // Update legend state
    setLegendItems(currentLegendItems);
  };

  // Convert Web Mercator (EPSG:3857) to WGS84 (EPSG:4326) lat/lon
  const webMercatorToWGS84 = (x: number, y: number): { lat: number; lon: number } => {
    const lon = (x / 20037508.34) * 180;
    let lat = (y / 20037508.34) * 180;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    return { lat, lon };
  };

  // Calculate centroid from polygon geometry (for PADUS features)
  const calculatePolygonCentroid = (geometry: any): { lat: number; lon: number } | null => {
    if (!geometry) {
      console.log('No geometry provided for centroid calculation');
      return null;
    }
    
    // Check spatial reference - ArcGIS might return Web Mercator or WGS84
    const spatialRef = geometry.spatialReference;
    const isWebMercator = spatialRef && (
      spatialRef.wkid === 3857 || 
      spatialRef.wkid === 102100 || 
      spatialRef.latestWkid === 3857 ||
      spatialRef.latestWkid === 102100
    );
    
    // Handle ArcGIS polygon geometry
    if (geometry.rings && Array.isArray(geometry.rings) && geometry.rings.length > 0) {
      // Get first ring (outer boundary)
      const ring = geometry.rings[0];
      if (ring && ring.length > 0) {
        // Calculate centroid by averaging all points
        let sumX = 0;
        let sumY = 0;
        ring.forEach((point: number[]) => {
          if (point && point.length >= 2) {
            sumX += point[0]; // x coordinate
            sumY += point[1]; // y coordinate
          }
        });
        
        const avgX = sumX / ring.length;
        const avgY = sumY / ring.length;
        
        // Check if coordinates need conversion (Web Mercator has large values)
        if (isWebMercator || Math.abs(avgX) > 180 || Math.abs(avgY) > 90) {
          // Convert from Web Mercator to WGS84
          const converted = webMercatorToWGS84(avgX, avgY);
          console.log('Converted PADUS centroid from Web Mercator to WGS84:', converted, 'from', { x: avgX, y: avgY });
          return converted;
        } else {
          // Already in WGS84 (lat/lon)
          const centroid = {
            lat: avgY, // y is latitude in WGS84
            lon: avgX  // x is longitude in WGS84
          };
          console.log('Calculated PADUS centroid from ArcGIS rings (WGS84):', centroid);
          return centroid;
        }
      }
    }
    
    // Handle GeoJSON polygon
    if (geometry.type === 'Polygon' && geometry.coordinates && geometry.coordinates.length > 0) {
      const ring = geometry.coordinates[0];
      if (ring && ring.length > 0) {
        let sumLat = 0;
        let sumLon = 0;
        ring.forEach((point: number[]) => {
          if (point && point.length >= 2) {
            sumLon += point[0]; // GeoJSON is [lon, lat]
            sumLat += point[1];
          }
        });
        const centroid = {
          lat: sumLat / ring.length,
          lon: sumLon / ring.length
        };
        console.log('Calculated PADUS centroid from GeoJSON:', centroid);
        return centroid;
      }
    }
    
    console.log('Could not calculate centroid - geometry format not recognized:', geometry);
    return null;
  };

  // Create popup content for POI markers
  const createPOIPopupContent = (poi: any, category: string, key?: string): string => {
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
      <div 
        className={`flex-1 relative ${isMobile ? 'map-container' : ''}`}
        style={isMobile ? { 
          height: 'calc(100vh - 60px)', 
          minHeight: '400px',
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        } : {}}
      >
        <div 
          ref={mapRef} 
          className={`w-full h-full ${isMobile ? 'mobile-map' : ''}`}
          style={isMobile ? { 
            height: '100%', 
            width: '100%', 
            minHeight: '400px',
            position: 'relative',
            display: 'block'
          } : { height: '100%', width: '100%' }}
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
