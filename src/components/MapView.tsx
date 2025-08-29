import React, { useEffect, useRef, useState } from 'react';
import { EnrichmentResult } from '../App';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  results: EnrichmentResult[];
  onBackToConfig: () => void;
  isMobile?: boolean;
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
  
  
  
  // EPA FRS Environmental Hazards
  'poi_epa_brownfields': { icon: '🏭', color: '#8b4513', title: 'EPA Brownfields' },
  'poi_epa_superfund': { icon: '⚠️', color: '#dc2626', title: 'EPA Superfund Sites' },
  'poi_epa_rcra': { icon: '☣️', color: '#7c2d12', title: 'EPA RCRA Facilities' },
  'poi_epa_tri': { icon: '🧪', color: '#059669', title: 'EPA TRI Facilities' },
  'poi_epa_npdes': { icon: '💧', color: '#0891b2', title: 'EPA NPDES Permits' },
  'poi_epa_air': { icon: '💨', color: '#6b7280', title: 'EPA Air Facilities' },
  'poi_epa_radiation': { icon: '☢️', color: '#fbbf24', title: 'EPA Radiation Facilities' },
  'poi_epa_power': { icon: '⚡', color: '#f59e0b', title: 'EPA Power Generation' },
  'poi_epa_oil_spill': { icon: '🛢️', color: '#1f2937', title: 'EPA Oil Spill Response' },
  
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
  const tabContentBackup = useRef<Map<string, string>>(new Map());
  const weatherTabCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map with mobile-appropriate settings
    const isMobileView = window.innerWidth <= 768;
    const initialZoom = isMobileView ? 15 : 4; // Lower zoom for mobile to show more area
    
    const map = L.map(mapRef.current, {
      center: [39.8283, -98.5795], // Center of USA
      zoom: initialZoom,
      zoomControl: true,
      // Mobile-specific settings
      maxBounds: isMobileView ? undefined : undefined, // Allow full movement on mobile
      minZoom: isMobileView ? 10 : 2, // Lower minimum zoom for mobile
      maxZoom: 19,
    });

    // Add OpenStreetMap tiles as default
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add MapTiler basemap options
    const maptilerKey = 'Ts9pNkQtWsmoz4BHQIxF'; // Your MapTiler key
    const maptilerLayers = {
      'Streets': L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${maptilerKey}`, {
        attribution: '© MapTiler & OSM',
        maxZoom: 19,
      }),
      'Satellite': L.tileLayer(`https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${maptilerKey}`, {
        attribution: '© MapTiler & OSM',
        maxZoom: 19,
      }),
      'Topo': L.tileLayer(`https://api.maptiler.com/maps/topo/{z}/{x}/{y}.png?key=${maptilerKey}`, {
        attribution: '© MapTiler & OSM',
        maxZoom: 19,
      }),
      'OpenStreetMap': osmLayer
    };

    // Add layer control to map (hidden on mobile for better UX)
    const layerControl = L.control.layers(maptilerLayers, {}, {
      position: 'topright',
      collapsed: false
    });
    
    let layerControlAdded = false;
    
    // Only add layer control on larger screens (hide on mobile)
    if (window.innerWidth > 768) {
      layerControl.addTo(map);
      layerControlAdded = true;
    }
    
    // Listen for window resize to show/hide layer control
    const handleResize = () => {
      if (window.innerWidth > 768) {
        if (!layerControlAdded) {
          layerControl.addTo(map);
          layerControlAdded = true;
        }
      } else {
        if (layerControlAdded) {
          map.removeControl(layerControl);
          layerControlAdded = false;
        }
      }
    };
    
    window.addEventListener('resize', handleResize);

    mapInstanceRef.current = map;

    // Add global tab switching function to window object
    (window as any).handleTabSwitch = (tabName: string) => {
      console.log('🔄 Tab switching called for:', tabName);
      handleTabSwitch(tabName);
    };

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // Clean up resize event listener
      window.removeEventListener('resize', handleResize);
      // Clean up global function
      delete (window as any).handleTabSwitch;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !results.length) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add main location markers and POI markers for each result
    const bounds = L.latLngBounds([]);
    let firstMarker: L.Marker | null = null;
    
    results.forEach((result, index) => {
      const { lat, lon } = result.location;
      
      if (lat && lon) {
        // Add main location marker (larger, blue)
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
              z-index: 1000;
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
        
        // Only extend bounds for batch results, not single results
        if (results.length > 1) {
          bounds.extend([lat, lon]);
        }
        
        // Store reference to first marker to auto-open its popup
        if (index === 0) {
          firstMarker = mainMarker;
        }

        // For single search results, set initial map view to the geocoded location
        if (results.length === 1) {
          console.log(`🎯 Setting initial map view to geocoded location: [${lat}, ${lon}]`);
          
          // Set the initial view with appropriate zoom for mobile vs desktop
          const targetZoom = isMobile ? 16 : 18; // Lower zoom on mobile to show more area
          map.setView([lat, lon], targetZoom, { animate: true });
          
          // Add POI markers
          addPOIMarkers(map, result);
        }
  }
});

// Fit map to show all markers with padding (only for batch results now)
if (bounds.isValid() && results.length > 1) {
  // For batch results, fit bounds as before
  map.fitBounds(bounds, { 
    padding: [20, 20],
    maxZoom: 16
  });
}

    // Auto-open popup for first marker after a short delay to ensure map is ready (only on desktop)
    if (firstMarker && !isMobile) {
      setTimeout(() => {
        // Simply open the popup - let the map handle positioning naturally
        firstMarker?.openPopup();
      }, 500);
    }

    // Show batch success message if multiple results
    if (results.length > 1) {
      setShowBatchSuccess(true);
      setTimeout(() => {
        setShowBatchSuccess(false);
      }, 5000); // Hide after 5 seconds
    }
  }, [results]);

    // Add POI markers to the map for single search results (SIMPLIFIED - NO MAP INTERFERENCE)
  const addPOIMarkers = (map: L.Map, result: EnrichmentResult) => {
    console.log('📍 Adding POI markers (simplified)');
    
    const currentLegendItems: LegendItem[] = [];
    
    // Extract POI data from enrichment results
    console.log(`📍 Processing enrichments:`, Object.keys(result.enrichments));
    Object.entries(result.enrichments).forEach(([key, value]) => {
      // Look for POI arrays that contain detailed location data
      if (key.includes('poi_') && Array.isArray(value)) {
        console.log(`📍 Found POI array for ${key} with ${value.length} items`);
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
          // Check for either name or title (for Wikipedia articles)
          const poiName = poi.name || poi.title;
          
          if (poi.lat && poi.lon && poiName) {
            console.log(`📍 Adding POI marker: ${poiName} at [${poi.lat}, ${poi.lon}]`);
            const poiMarker = L.marker([poi.lat, poi.lon], {
              icon: createPOIIcon(iconConfig.icon, iconConfig.color)
            })
              .bindPopup(createPOIPopupContent(poi, iconConfig.title))
              .addTo(map);
            
            markersRef.current.push(poiMarker);
          } else {
            console.log(`❌ Skipping POI - missing required data for ${key}:`, {
              name: poiName,
              lat: poi.lat,
              lon: poi.lon
            });
          }
        });
      }
    });

    // Add Wikipedia articles
    if (result.enrichments.poi_wikipedia_articles && Array.isArray(result.enrichments.poi_wikipedia_articles)) {
      const articles = result.enrichments.poi_wikipedia_articles;
      console.log(`📍 Found ${articles.length} Wikipedia articles`);
      const iconConfig = POI_ICONS.poi_wikipedia || POI_ICONS.default;
      
      // Add to legend if we have Wikipedia articles
      if (articles.length > 0) {
        currentLegendItems.push({
          icon: iconConfig.icon,
          color: iconConfig.color,
          title: iconConfig.title,
          count: articles.length
        });
      }
      
      articles.forEach((article: any) => {
        if (article.lat && article.lon && article.title) {
          console.log(`📍 Adding Wikipedia marker: ${article.title} at [${article.lat}, ${article.lon}]`);
          const wikiMarker = L.marker([article.lat, article.lon], {
            icon: createPOIIcon(iconConfig.icon, iconConfig.color)
          })
            .bindPopup(createWikipediaPopupContent(article))
            .addTo(map);
          
          markersRef.current.push(wikiMarker);
        } else {
          console.log(`❌ Skipping Wikipedia article - missing data:`, {
            title: article.title,
            lat: article.lat,
            lon: article.lon
          });
        }
      });
    } else {
      console.log(`❌ No Wikipedia articles found in enrichments`);
    }
    
    // Add EPA FRS Environmental Hazards facilities
    const epaPrograms = [
      'poi_epa_brownfields',
      'poi_epa_superfund', 
      'poi_epa_rcra',
      'poi_epa_tri',
      'poi_epa_npdes',
      'poi_epa_air',
      'poi_epa_radiation',
      'poi_epa_power',
      'poi_epa_oil_spill'
    ];
    
    epaPrograms.forEach(programKey => {
      const facilities = result.enrichments[`${programKey}_facilities`];
      if (facilities && Array.isArray(facilities) && facilities.length > 0) {
        console.log(`🏭 Found ${facilities.length} EPA FRS ${programKey} facilities`);
        const iconConfig = POI_ICONS[programKey] || POI_ICONS.default;
        
        // Add to legend
        currentLegendItems.push({
          icon: iconConfig.icon,
          color: iconConfig.color,
          title: iconConfig.title,
          count: facilities.length
        });
        
        // Add markers for each facility
        facilities.forEach((facility: any) => {
          if (facility.lat && facility.lon && facility.name) {
            console.log(`🏭 Adding EPA FRS marker: ${facility.name} at [${facility.lat}, ${facility.lon}]`);
            const facilityMarker = L.marker([facility.lat, facility.lon], {
              icon: createPOIIcon(iconConfig.icon, iconConfig.color)
            })
              .bindPopup(createEPAFRSPopupContent(facility))
              .addTo(map);
            
            markersRef.current.push(facilityMarker);
          }
        });
      }
    });
    
    // Add USDA Local Food Portal facilities
    const usdaPrograms = [
      'poi_usda_agritourism',
      'poi_usda_csa',
      'poi_usda_farmers_market',
      'poi_usda_food_hub',
      'poi_usda_onfarm_market'
    ];
    
    usdaPrograms.forEach(programKey => {
      const facilities = result.enrichments[`${programKey}_facilities`];
      if (facilities && Array.isArray(facilities) && facilities.length > 0) {
        console.log(`🌾 Found ${facilities.length} USDA ${programKey} facilities`);
        const iconConfig = POI_ICONS[programKey] || POI_ICONS.default;
        
        // Add to legend
        currentLegendItems.push({
          icon: iconConfig.icon,
          color: iconConfig.color,
          title: iconConfig.title,
          count: facilities.length
        });
        
        // Add markers for each facility
        facilities.forEach((facility: any) => {
          if (facility.lat && facility.lon && facility.name) {
            console.log(`🌾 Adding USDA marker: ${facility.name} at [${facility.lat}, ${facility.lon}]`);
            const facilityMarker = L.marker([facility.lat, facility.lon], {
              icon: createPOIIcon(iconConfig.icon, iconConfig.color)
            })
              .bindPopup(createUSDAFacilityPopupContent(facility))
              .addTo(map);
            
            markersRef.current.push(facilityMarker);
          }
        });
      }
    });
    
          // Special handling for Wildfires data - draw all wildfire incidents within user radius
      if (result.enrichments.poi_wildfires_elements && Array.isArray(result.enrichments.poi_wildfires_elements)) {
        const wildfires = result.enrichments.poi_wildfires_elements;
        console.log(`🔥 Found ${wildfires.length} wildfire incidents - drawing on map`);
        const iconConfig = POI_ICONS.poi_wildfires;
        
        // Add to legend
        currentLegendItems.push({
          icon: iconConfig.icon,
          color: iconConfig.color,
          title: iconConfig.title,
          count: wildfires.length
        });
        
        // Create markers for each wildfire
        wildfires.forEach((wildfire: any) => {
          if (wildfire.lat && wildfire.lon) {
            const marker = L.marker([wildfire.lat, wildfire.lon], {
              icon: L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: ${iconConfig.color}; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${iconConfig.icon}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })
            });

            // Create wildfire popup content
            const popupContent = createWildfirePopupContent(wildfire);
            marker.bindPopup(popupContent);
            
            marker.addTo(map);
            markersRef.current.push(marker);
          }
        });
      }

          // Special handling for AVI data - draw points within 2 miles for map display, CSV gets full user proximity data
      if (result.enrichments.poi_animal_vehicle_collisions_elements && Array.isArray(result.enrichments.poi_animal_vehicle_collisions_elements)) {
        const mapAVICollisions = result.enrichments.poi_animal_vehicle_collisions_elements;
        console.log(`🦌 Found ${mapAVICollisions.length} AVI collisions within 2 miles - drawing on map for pattern detection`);
        const iconConfig = POI_ICONS.poi_animal_vehicle_collisions;
        
        // Add to legend
        currentLegendItems.push({
          icon: iconConfig.icon,
          color: iconConfig.color,
          title: `${iconConfig.title} (2 mi map view)`,
          count: mapAVICollisions.length
        });
        
        // Add markers for AVI collisions within 2 miles (map display only)
        mapAVICollisions.forEach((collision: any) => {
          if (collision.lat && collision.lon) {
            console.log(`🦌 Adding AVI marker: Collision at [${collision.lat}, ${collision.lon}]`);
            const aviMarker = L.marker([collision.lat, collision.lon], {
              icon: createPOIIcon(iconConfig.icon, iconConfig.color)
            })
              .bindPopup(createAVIPopupContent(collision))
              .addTo(map);
            
            markersRef.current.push(aviMarker);
          }
        });
      }
    
    // Update legend state
    setLegendItems(currentLegendItems);
  };

  // Create popup content for AVI collisions
  const createAVIPopupContent = (collision: any): string => {
    const source = collision.source || 'Unknown';
    const crashYear = collision.crash_year || 'Unknown';
    const stCase = collision.st_case || 'N/A';
    const distance = collision.distance_miles || 'Unknown';
    
    let content = `
      <div style="min-width: 250px; max-width: 350px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <img src="/assets/new-logo.png" alt="The Location Is Everything Co" style="width: 48px; height: 48px; border-radius: 50%;" />
          <h3 style="margin: 0; color: #1f2937; font-weight: 600; font-size: 14px;">Animal Vehicle Collision</h3>
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
          🦌 Collision Record • ${distance} miles away
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #374151;">
          <strong>Source:</strong> ${source}
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #374151;">
          <strong>Year:</strong> ${crashYear}
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #374151;">
          <strong>Case ID:</strong> ${stCase}
        </div>
    `;

    // Add coordinates
    if (collision.lat && collision.lon) {
      content += `<div style="margin: 6px 0 4px 0; font-size: 11px; color: #9ca3af;">
        ${collision.lat.toFixed(6)}, ${collision.lon.toFixed(6)}
      </div>`;
    }

    content += '</div>';
    return content;
  };

  // Create popup content for Wildfire incidents
  const createWildfirePopupContent = (wildfire: any): string => {
    const name = wildfire.name || 'Unnamed Fire';
    const state = wildfire.state || 'Unknown';
    const containment = wildfire.containment || 0;
    const discoveryDate = wildfire.discovery_date || 'Unknown';
    const sizeAcres = wildfire.size_acres || 'Unknown';
    const distance = wildfire.distance_miles || 'Unknown';
    
    let content = `
      <div style="min-width: 250px; max-width: 350px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <img src="/assets/new-logo.png" alt="The Location Is Everything Co" style="width: 48px; height: 48px; border-radius: 50%;" />
          <h3 style="margin: 0; color: #1f2937; font-weight: 600; font-size: 14px;">Current Wildfire</h3>
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
          🔥 ${name} • ${distance} miles away
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #374151;">
          <strong>State:</strong> ${state}
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #374151;">
          <strong>Containment:</strong> ${containment}%
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #374151;">
          <strong>Discovery Date:</strong> ${discoveryDate}
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #374151;">
          <strong>Size:</strong> ${sizeAcres} acres
        </div>`;

    // Add coordinates if available
    if (wildfire.lat && wildfire.lon) {
      content += `
      <div style="margin: 8px 0 4px 0; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px;">
        📍 Coordinates: ${wildfire.lat.toFixed(6)}, ${wildfire.lon.toFixed(6)}
      </div>`;
    }

    content += '</div>';
    return content;
  };

  // Create popup content for EPA FRS facilities
  const createEPAFRSPopupContent = (facility: any): string => {
    const name = facility.name || 'Unnamed Facility';
    const program = facility.program || 'EPA Facility';
    const status = facility.status || 'Unknown';
    const address = facility.address || 'N/A';
    const city = facility.city || 'N/A';
    const state = facility.state || 'N/A';
    const distance = facility.distance_miles?.toFixed(2) || 'Unknown';
    
    let content = `
      <div style="min-width: 250px; max-width: 350px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${name}</h3>
        <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
          🏭 ${program} • ${distance} miles away
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #374151;">
          <strong>Status:</strong> ${status}
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #374151;">
          <strong>Address:</strong> ${address}, ${city}, ${state}
        </div>
        <div style="margin: 6px 0 4px 0; font-size: 11px; color: #9ca3af;">
          ${facility.lat?.toFixed(6)}, ${facility.lon?.toFixed(6)}
        </div>
      </div>
    `;
    
    return content;
  };

  // Create popup content for USDA facilities
  const createUSDAFacilityPopupContent = (facility: any): string => {
    const name = facility.name || 'Unnamed Facility';
    const program = facility.program || 'USDA Program';
    const distance = facility.distance_miles || 'Unknown';
    
    let content = `
      <div style="min-width: 250px; max-width: 350px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${name}</h3>
        <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
          🌾 ${program} • ${distance} miles away
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
          🏷️ Type: ${facility.tags?.amenity || facility.tags?.shop || facility.tags?.tourism || 'Facility'}
        </div>
    `;

    // Add address if available
    const address = facility.tags?.['addr:street'] || facility.address || facility.tags?.['addr:full'];
    if (address) {
      content += `<div style="margin: 4px 0; font-size: 12px; color: #6b7280;">📍 ${address}</div>`;
    }

    // Add phone if available
    if (facility.tags?.phone) {
      content += `<div style="margin: 4px 0; font-size: 12px; color: #6b7280;">📞 ${facility.tags.phone}</div>`;
    }

    // Add website if available
    if (facility.tags?.website) {
      content += `<div style="margin: 4px 0; font-size: 12px;">
        🌐 <a href="${facility.tags.website}" target="_blank" style="color: #3b82f6;">Website</a>
      </div>`;
    }

    // Add coordinates
    const lat = facility.lat || facility.center?.lat;
    const lon = facility.lon || facility.center?.lon;
    if (lat && lon) {
      content += `<div style="margin: 6px 0 4px 0; font-size: 11px; color: #9ca3af;">
        ${lat.toFixed(6)}, ${lon.toFixed(6)}
      </div>`;
    }

    // Add OSM ID for reference
    if (facility.id) {
      content += `<div style="margin: 2px 0; font-size: 10px; color: #d1d5db;">
        OSM ID: ${facility.id}
      </div>`;
    }

    content += '</div>';
    return content;
  };

  // Create popup content for POI markers
  const createPOIPopupContent = (poi: any, category: string): string => {
    const name = poi.tags?.name || poi.name || poi.title || 'Unnamed POI';
    const amenity = poi.tags?.amenity || poi.tags?.shop || poi.tags?.tourism || 'POI';
    const distance = poi.distance_miles || 'Unknown';
    
    let content = `
      <div style="min-width: 250px; max-width: 350px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <img src="/assets/new-logo.png" alt="The Location Is Everything Co" style="width: 48px; height: 48px; border-radius: 50%;" />
          <h3 style="margin: 0; color: #1f2937; font-weight: 600; font-size: 14px;">${name}</h3>
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
          📍 ${category} • ${distance} miles away
        </div>
        <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
          🏷️ Type: ${amenity}
        </div>
    `;

    // Add address if available
    const address = poi.tags?.['addr:street'] || poi.address || poi.tags?.['addr:full'];
    if (address) {
      content += `<div style="margin: 4px 0; font-size: 12px; color: #6b7280;">📍 ${address}</div>`;
    }

    // Add phone if available
    if (poi.tags?.phone) {
      content += `<div style="margin: 4px 0; font-size: 12px; color: #6b7280;">📞 ${poi.tags.phone}</div>`;
    }

    // Add website if available
    if (poi.tags?.website) {
      content += `<div style="margin: 4px 0; font-size: 12px;">
        🌐 <a href="${poi.tags.website}" target="_blank" style="color: #3b82f6;">Website</a>
      </div>`;
    }

    // Add coordinates
    const lat = poi.lat || poi.center?.lat;
    const lon = poi.lon || poi.center?.lon;
    if (lat && lon) {
      content += `<div style="margin: 6px 0 4px 0; font-size: 11px; color: #9ca3af;">
        ${lat.toFixed(6)}, ${lon.toFixed(6)}
      </div>`;
    }

    // Add OSM ID for reference
    if (poi.id) {
      content += `<div style="margin: 2px 0; font-size: 10px; color: #d1d5db;">
        OSM ID: ${poi.id}
      </div>`;
    }

    content += '</div>';
    return content;
  };

  // Create popup content for Wikipedia articles
  const createWikipediaPopupContent = (article: any): string => {
    const distance = article.distance_miles || Math.round((article.distance_km || 0) * 0.621371 * 100) / 100;
    
    return `
      <div style="min-width: 250px; max-width: 350px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${article.title}</h3>
        <div style="margin: 4px 0; font-size: 12px; color: #6b7280;">
          📖 Wikipedia Article • ${distance} miles away
        </div>
        ${article.extract ? `<div style="margin: 8px 0; font-size: 12px; color: #374151; line-height: 1.4;">
          ${article.extract.substring(0, 200)}${article.extract.length > 200 ? '...' : ''}
        </div>` : ''}
        <div style="margin: 8px 0; font-size: 12px;">
          <a href="${article.url}" target="_blank" style="color: #3b82f6; text-decoration: none;">
            📖 Read Full Article →
          </a>
        </div>
        <div style="margin: 6px 0 4px 0; font-size: 11px; color: #9ca3af;">
          ${article.lat?.toFixed(6)}, ${article.lon?.toFixed(6)}
        </div>
      </div>
    `;
  };

  const createPopupContent = (result: EnrichmentResult): string => {
    const { location, enrichments } = result;
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    const minWidth = isMobile ? '300px' : '700px';
    const maxWidth = isMobile ? '400px' : '800px';
    const fontSize = isMobile ? '11px' : '12px';
    const headerFontSize = isMobile ? '14px' : '16px';
    
    // Group enrichments by category
    const enrichmentCategories: Record<string, Array<{key: string, value: any}>> = {
      'Weather & Alerts': [],
      'Geographic Info': [],
      'Political Districts': [],
      'Demographics': [],
      'Hazards & Safety': [],
      'Transportation': [],
      'Natural Resources': [],
      'Public Lands': [],
      'Environmental Hazards': [],
      'Community & Services': [],
      'Recreation & Leisure': [],
      'Local Food & Agriculture': [],
      'Other': []
    };
    
         // Helper function to categorize enrichments
     const categorizeEnrichment = (key: string, value: any) => {
       if (key.includes('open_meteo_weather') || key.includes('nws_weather_alerts')) {
         enrichmentCategories['Weather & Alerts'].push({ key, value });
       } else if (key.includes('elevation') || key.includes('fips_') || key.includes('county_') || key.includes('state_') || key.includes('census_') || key.includes('city_') || key.includes('urban_area_') || key.includes('metro_area_') || key.includes('subdivision_')) {
         enrichmentCategories['Geographic Info'].push({ key, value });
       } else if (key.includes('congressional_') || key.includes('state_senate_') || key.includes('state_house_')) {
         enrichmentCategories['Political Districts'].push({ key, value });
       } else if (key.includes('acs_')) {
         enrichmentCategories['Demographics'].push({ key, value });
       } else if (key.includes('poi_wetlands') || key.includes('poi_animal_vehicle_collisions') || key.includes('poi_earthquakes') || key.includes('poi_volcanoes') || key.includes('poi_flood_reference_points') || key.includes('poi_fema_flood_zones') || key.includes('poi_wildfires')) {
         enrichmentCategories['Hazards & Safety'].push({ key, value });
       } else if (key.includes('poi_bus') || key.includes('poi_train') || key.includes('poi_subway') || key.includes('poi_tram') || key.includes('poi_monorail') || key.includes('poi_aerialway') || key.includes('poi_ferry') || key.includes('poi_airport_air') || key.includes('poi_taxi') || key.includes('poi_bike_scooter_share') || key.includes('poi_dockless_hub') || key.includes('poi_electric_charging')) {
         enrichmentCategories['Transportation'].push({ key, value });
       } else if (key.includes('poi_beaches') || key.includes('poi_lakes_ponds') || key.includes('poi_rivers_streams') || key.includes('poi_mountains_peaks')) {
         enrichmentCategories['Natural Resources'].push({ key, value });
       } else if (key.includes('padus_')) {
         enrichmentCategories['Public Lands'].push({ key, value });
       } else if (key.includes('poi_epa_')) {
         enrichmentCategories['Environmental Hazards'].push({ key, value });
       } else if (key.includes('poi_parks') || key.includes('poi_theatres') || key.includes('poi_museums_historic') || key.includes('poi_bars_nightlife')) {
         enrichmentCategories['Recreation & Leisure'].push({ key, value });
       } else if (key.includes('poi_usda_')) {
         enrichmentCategories['Local Food & Agriculture'].push({ key, value });
       } else if (key.includes('poi_gas_stations') || key.includes('poi_community_centers') || key.includes('poi_restaurants') || key.includes('poi_hotels') || key.includes('poi_breweries') || key.includes('poi_police_stations') || key.includes('poi_fire_stations') || key.includes('poi_schools') || key.includes('poi_hospitals') || key.includes('poi_libraries') || key.includes('poi_markets') || key.includes('poi_cafes') || key.includes('poi_banks')) {
         // Community & Services - put gas stations first
         if (key.includes('poi_gas_stations')) {
           enrichmentCategories['Community & Services'].unshift({ key, value });
         } else {
           enrichmentCategories['Community & Services'].push({ key, value });
         }
       } else {
         enrichmentCategories['Other'].push({ key, value });
       }
     };
    
    // Categorize all enrichments
    Object.entries(enrichments).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Skip detailed arrays and complex objects
        if (key.includes('_detailed') || key.includes('_facilities') || key.includes('_nearby') || key.includes('_summary')) {
          return;
        }
        if (typeof value === 'object' && value !== null) {
          return;
        }
        categorizeEnrichment(key, value);
      }
    });
    
    // Add special enrichments that need custom handling
    if (enrichments.poi_fema_flood_zones_current || enrichments.poi_fema_flood_zones_nearby) {
      enrichmentCategories['Hazards & Safety'].push({ key: 'poi_fema_flood_zones', value: 'FEMA Flood Zones' });
    }
    
    if (enrichments.poi_wikipedia_count) {
      enrichmentCategories['Recreation & Leisure'].push({ key: 'poi_wikipedia_count', value: enrichments.poi_wikipedia_count });
    }
    
    // Add EPA facilities to Environmental Hazards
    Object.entries(enrichments).forEach(([key, value]) => {
      if (key.includes('poi_epa_') && key.includes('_count') && value > 0) {
        enrichmentCategories['Environmental Hazards'].push({ key, value });
      }
    });
    
    // AVI source field is now displayed automatically with the count field
    // No need to add it separately to the category
    
    // Filter out empty categories
    const nonEmptyCategories = Object.entries(enrichmentCategories).filter(([_, items]) => items.length > 0);
    
    // Debug: Log what's in Hazards & Safety category
    console.log('🦌 Hazards & Safety category contents:', enrichmentCategories['Hazards & Safety']);
    console.log('🦌 All enrichment categories:', enrichmentCategories);
    
    let content = `
      <div style="min-width: ${minWidth}; max-width: ${maxWidth};">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <img src="/assets/new-logo.png" alt="The Location Is Everything Co" style="width: 48px; height: 48px; border-radius: 50%;" />
          <h3 style="margin: 0; color: #1f2937; font-weight: 600; font-size: ${headerFontSize};">${location.name}</h3>
        </div>
        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: ${fontSize};">
          📍 ${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}<br>
          🔍 Source: ${location.source}
        </p>
        
        <!-- Key Summary Values -->
        <div style="margin: 12px 0; padding: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; font-size: ${fontSize};">
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
    
    if (enrichments.open_meteo_weather_description) {
      content += `
        <div style="text-align: center;">
          <div style="font-weight: 600; color: #374151; font-size: 10px;">Weather</div>
          <div style="color: #1f2937; font-weight: 600;">${enrichments.open_meteo_weather_description}</div>
        </div>
      `;
    }
    
    if (enrichments.open_meteo_weather_summary) {
      content += `
        <div style="text-align: center;">
          <div style="font-weight: 600; color: #374151; font-size: 10px;">Weather Summary</div>
          <div style="color: #1f2937; font-weight: 600; font-size: 10px;">${enrichments.open_meteo_weather_summary}</div>
        </div>
      `;
    }
    
    if (enrichments.nws_alerts_summary) {
      content += `
        <div style="text-align: center;">
          <div style="font-weight: 600; color: #374151; font-size: 10px;">Alerts</div>
          <div style="color: #1f2937; font-weight: 600; font-size: 10px;">${enrichments.nws_alerts_summary}</div>
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
    
    if (enrichments.acs_name) {
      content += `
        <div style="text-align: center;">
          <div style="font-weight: 600; color: #374151; font-size: 10px;">Area</div>
          <div style="color: #1f2937; font-weight: 600; font-size: 10px;">${enrichments.acs_name}</div>
        </div>
      `;
    }
    
    content += `
          </div>
        </div>
    `;

    if (nonEmptyCategories.length > 0) {
      content += '<hr style="margin: 12px 0; border-color: #e5e7eb;">';
      
      // Create tabs
      content += '<div style="margin-bottom: 16px;">';
      content += '<div class="tab-container">';
      
      nonEmptyCategories.forEach(([categoryName], index) => {
        const isActive = index === 0; // First tab is active by default
        const tabClass = isActive ? 'tab active' : 'tab';
        const tabId = categoryName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        
        // Add icons to tab names for better visual organization
        const getTabIcon = (name: string): string => {
          if (name === 'Weather & Alerts') return '🌤️';
          if (name === 'Geographic Info') return '🌍';
          if (name === 'Political Districts') return '🏛️';
          if (name === 'Demographics') return '📊';
          if (name === 'Hazards & Safety') return '⚠️';
          if (name === 'Transportation') return '🚌';
          if (name === 'Natural Resources') return '🌲';
          if (name === 'Public Lands') return '🏞️';
          if (name === 'Environmental Hazards') return '☢️';
          if (name === 'Community & Services') return '🏪';
          if (name === 'Recreation & Leisure') return '🎯';
          if (name === 'Local Food & Agriculture') return '🌾';
          return '📍';
        };
        
        const tabIcon = getTabIcon(categoryName);
        content += `<button 
          data-tab="${tabId}"
          class="${tabClass}"
          onclick="window.handleTabSwitch && window.handleTabSwitch('${tabId}')"
        >${tabIcon} ${categoryName}</button>`;
      });
      
      content += '</div>';
      
      // Create tab content
      nonEmptyCategories.forEach(([categoryName, items], index) => {
        const isActive = index === 0;
        const displayStyle = isActive ? 'block' : 'none';
        const tabId = categoryName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        
        content += `<div id="tab_${tabId}" style="display: ${displayStyle}; padding: 8px 0;">`;
        
        items.forEach(({ key, value }) => {
          console.log(`🦌 Processing item in ${categoryName}:`, { key, value });
          const label = formatEnrichmentLabel(key);
          const displayValue = formatEnrichmentValue(key, value);
          
          console.log(`🦌 Formatted:`, { label, displayValue });
          
          // Special formatting for certain fields
          let formattedValue = displayValue;
          if (key === 'poi_fema_flood_zones') {
            // Special handling for FEMA flood zones
            if (enrichments.poi_fema_flood_zones_current) {
              content += `<div style="margin: 4px 0; font-size: ${fontSize}; display: flex; justify-content: space-between; flex-wrap: wrap;">
                <span style="color: #6b7280; margin-right: 8px;">FEMA Flood Zone:</span>
                <span style="color: #1f2937; font-weight: 500; text-align: right;">${enrichments.poi_fema_flood_zones_current}</span>
              </div>`;
            }
            if (enrichments.poi_fema_flood_zones_nearby && Array.isArray(enrichments.poi_fema_flood_zones_nearby) && enrichments.poi_fema_flood_zones_nearby.length > 0) {
              const nearestZone = enrichments.poi_fema_flood_zones_nearby[0];
              const zoneName = nearestZone.zone || 'Unknown Zone';
              const distance = nearestZone.distance_miles || 5;
              content += `<div style="margin: 4px 0; font-size: ${fontSize}; display: flex; justify-content: space-between; flex-wrap: wrap;">
                <span style="color: #6b7280; margin-right: 8px;">FEMA Flood Zone within ${distance} mi:</span>
                <span style="color: #1f2937; font-weight: 500; text-align: right;">${zoneName}</span>
              </div>`;
            }
            return; // Skip the default display for this item
          } else if (key === 'poi_wetlands_point_in_wetland') {
            formattedValue = value ? 'Yes' : 'No';
          } else if (key === 'poi_wetlands_count' && value > 0) {
            const proximityDistance = enrichments.poi_wetlands_proximity_distance || 2;
            formattedValue = `Yes (${value} found within ${proximityDistance} mi)`;
          } else if (key === 'poi_earthquakes_count' && value > 0) {
            const proximityDistance = enrichments.poi_earthquakes_proximity_distance || 25;
            formattedValue = `${value} found within ${proximityDistance} mi (1900-2024)`;
          } else if (key === 'poi_volcanoes_count' && value > 0) {
            const proximityDistance = enrichments.poi_volcanoes_proximity_distance || 50;
            formattedValue = `${value} found within ${proximityDistance} mi`;
          } else if (key === 'poi_animal_vehicle_collisions_count') {
            // Special handling for AVI count - add source field right after
            const proximityDistance = enrichments.poi_animal_vehicle_collisions_proximity_distance || 5;
            formattedValue = value > 0 ? `${value} found within ${proximityDistance} mi` : '0 found';
            
            console.log('🦌 Processing AVI count, checking for source field...');
            console.log('🦌 Available enrichments:', Object.keys(enrichments).filter(k => k.includes('avi') || k.includes('animal')));
            console.log('🦌 AVI source field value:', enrichments.poi_animal_vehicle_collisions_source);
            
            // ALWAYS add AVI source field immediately after count - even if empty
            content += `<div style="margin: 4px 0; font-size: ${fontSize}; display: flex; justify-content: space-between; flex-wrap: wrap;">
              <span style="color: #6b7280; margin-right: 8px;">AVI Source:</span>
              <span style="color: #1f2937; font-weight: 500; text-align: right;">${enrichments.poi_animal_vehicle_collisions_source || 'No source data available'}</span>
            </div>`;
          } else if (key === 'poi_flood_reference_points_count' && value > 0) {
            const proximityDistance = enrichments.poi_flood_reference_points_proximity_distance || 25;
            formattedValue = `${value} found within ${proximityDistance} mi`;
          } else if (key === 'poi_wildfires_count' && value > 0) {
            const proximityDistance = enrichments.poi_wildfires_proximity_distance || 50;
            formattedValue = `${value} found within ${proximityDistance} mi`;
          } else if (key === 'open_meteo_weather_temperature_f') {
            formattedValue = `${value.toFixed(1)}°F`;
          } else if (key === 'open_meteo_weather_windspeed_mph') {
            formattedValue = `${value.toFixed(1)} mph`;
          }
          
          content += `<div style="margin: 4px 0; font-size: ${fontSize}; display: flex; justify-content: space-between; flex-wrap: wrap;">
            <span style="color: #6b7280; margin-right: 8px;">${label}:</span>
            <span style="color: #1f2937; font-weight: 500; text-align: right;">${formattedValue}</span>
          </div>`;
          
          // If this was the AVI count field, always add the source field right after
          if (key === 'poi_animal_vehicle_collisions_count' && enrichments.poi_animal_vehicle_collisions_source) {
            content += `<div style="margin: 4px 0; font-size: ${fontSize}; display: flex; justify-content: space-between; flex-wrap: wrap;">
              <span style="color: #6b7280; margin-right: 8px;">AVI Source:</span>
              <span style="color: #1f2937; font-weight: 500; text-align: right;">${enrichments.poi_animal_vehicle_collisions_source}</span>
            </div>`;
          }
        });
        
        content += '</div>';
      });
      
      content += '</div>';
      
      // Tab switching will be handled by the global handleTabSwitch function
    } else {
      content += '<p style="margin: 12px 0; color: #6b7280; font-style: italic; font-size: 13px;">No enrichments selected or available for this location.</p>';
    }
    
    content += '</div>';
    return content;
  };

  // Function to handle tab switching
  const handleTabSwitch = (tabName: string) => {
    console.log('🔄 handleTabSwitch called with:', tabName);
    
    // Find the popup content container dynamically
    const popup = document.querySelector('.leaflet-popup-content');
    console.log('🔍 Found popup:', popup);
    
    if (popup) {
      // First, let's verify all tab contents exist and have their original content
      const tabContents = popup.querySelectorAll('[id^="tab_"]');
      console.log('🔍 Found tab contents:', tabContents.length);
      
      // CRITICAL: Backup content BEFORE hiding tabs!
      console.log('💾 === BACKING UP CONTENT BEFORE HIDING ===');
      tabContents.forEach((content: Element, index: number) => {
        const tabId = content.id;
        const currentContent = content.innerHTML;
        const contentLength = currentContent.trim().length;
        
        console.log(`🔍 Tab ${index}: ${tabId}, content length: ${contentLength}`);
        
        // Cache weather tab content specifically
        if (tabId.includes('Weather')) {
          weatherTabCache.current.set(tabId, currentContent);
          console.log(`🌤️ CACHED WEATHER: ${tabId} with ${contentLength} chars`);
        }
        
        // Regular backup for all tabs
        tabContentBackup.current.set(tabId, currentContent);
        console.log(`💾 Backed up: ${tabId} with ${contentLength} chars`);
      });
      
      // Now hide all tab contents
      console.log('🙈 === HIDING ALL TABS ===');
      tabContents.forEach((content: Element) => {
        (content as HTMLElement).style.display = 'none';
      });
      
      // Remove active state from all tabs
      const tabButtons = popup.querySelectorAll('button[data-tab]');
      console.log('🔍 Found tab buttons:', tabButtons.length);
      tabButtons.forEach((tab: Element) => {
        tab.classList.remove('active');
      });
      
        // Show selected tab content
        const selectedContent = popup.querySelector('#tab_' + tabName);
        console.log('🔍 Selected content:', selectedContent);
        if (selectedContent) {
          (selectedContent as HTMLElement).style.display = 'block';
          
          // Verify the content is still there after showing
          const contentAfterShow = selectedContent.innerHTML.trim().length;
          console.log(`🔍 Content length after showing tab ${tabName}:`, contentAfterShow);
          
          // If content is missing, restore it from backup
          if (contentAfterShow === 0) {
            console.log(`⚠️ Tab ${tabName} is empty (${contentAfterShow} chars), attempting restoration...`);
            
            // Try weather cache first for weather tabs
            if (tabName.includes('Weather')) {
              const weatherContent = weatherTabCache.current.get('tab_' + tabName);
              console.log(`🌤️ Weather cache check for tab_${tabName}:`, weatherContent ? `${weatherContent.length} chars` : 'NOT FOUND');
              
              if (weatherContent) {
                selectedContent.innerHTML = weatherContent;
                console.log(`🌤️ ✅ SUCCESS: Restored weather tab content from cache (${weatherContent.length} chars)`);
                return;
              } else {
                console.log(`🌤️ ❌ FAILED: No weather cache found for tab_${tabName}`);
              }
            }
            
            // Fall back to regular backup
            const backupContent = tabContentBackup.current.get('tab_' + tabName);
            console.log(`💾 Regular backup check for tab_${tabName}:`, backupContent ? `${backupContent.length} chars` : 'NOT FOUND');
            
            if (backupContent) {
              selectedContent.innerHTML = backupContent;
              console.log(`✅ SUCCESS: Restored tab content from regular backup (${backupContent.length} chars)`);
            } else {
              console.log(`❌ FAILED: No backup content found for tab_${tabName}`);
            }
          } else {
            console.log(`✅ Tab ${tabName} already has content (${contentAfterShow} chars), no restoration needed`);
          }
        }
      
      // Set active state for selected tab
      const activeButton = popup.querySelector(`button[data-tab="${tabName}"]`);
      console.log('🔍 Active button:', activeButton);
      if (activeButton) {
        activeButton.classList.add('active');
      }
      
      // Final verification - check if the selected tab is visible and has content
      setTimeout(() => {
        const finalCheck = popup.querySelector('#tab_' + tabName);
        if (finalCheck) {
          const finalDisplay = (finalCheck as HTMLElement).style.display;
          const finalContent = finalCheck.innerHTML.trim().length;
          console.log(`🔍 Final check - Tab ${tabName}: display=${finalDisplay}, contentLength=${finalContent}`);
        }
      }, 100);
    } else {
      console.log('⚠️ No popup found');
    }
  };

  const formatEnrichmentLabel = (key: string): string => {
    const labels: Record<string, string> = {
      elevation_ft: 'Elevation',
      pm25: 'Air Quality (PM2.5)',
      fips_state: 'FIPS State',
      fips_county: 'FIPS County',
      county_name: 'County',
      state_code: 'State',
      fips_tract: 'Census Tract',
      
      // Rich Census/Geographic Data
      state_name: 'State Name',
      state_region: 'US Region',
      state_division: 'US Division',
      county_geoid: 'County GEOID',
      census_tract_name: 'Census Tract Name',
      census_tract_geoid: 'Census Tract GEOID',
      census_block_name: 'Census Block Name',
      census_block_geoid: 'Census Block GEOID',
      census_block_urban_rural: 'Urban/Rural',
      city_name: 'City/Place',
      city_geoid: 'City GEOID',
      urban_area_name: 'Urban Area',
      metro_area_name: 'Metro Area (CSA)',
      subdivision_name: 'County Subdivision',
      congressional_district: 'Congressional District',
      congressional_district_number: 'Congressional District #',
      state_senate_district: 'State Senate District',
      state_house_district: 'State House District',
      acs_population: 'Population',
      acs_median_hh_income: 'Median Income',
      acs_median_age: 'Median Age',
      nws_active_alerts: 'Weather Alerts',
      poi_wikipedia_count: 'Wikipedia Articles',
      
      // EPA FRS Environmental Hazards
      poi_epa_brownfields_count: 'EPA Brownfields',
      poi_epa_superfund_count: 'EPA Superfund Sites',
      poi_epa_rcra_count: 'EPA RCRA Facilities',
      poi_epa_tri_count: 'EPA TRI Facilities',
      poi_epa_npdes_count: 'EPA NPDES Permits',
      poi_epa_air_count: 'EPA Air Facilities',
      poi_epa_radiation_count: 'EPA Radiation Facilities',
      poi_epa_power_count: 'EPA Power Generation',
      poi_epa_oil_spill_count: 'EPA Oil Spill Response',
      
      // Hazards
      poi_animal_vehicle_collisions_count: 'Animal Vehicle Collisions',
      poi_animal_vehicle_collisions_source: 'AVI Data Source',
      poi_wildfires_count: 'Current Wildfires',
      poi_wetlands_count: 'USGS Wetlands',
      poi_wetlands_point_in_wetland: 'Point in Wetland',
      poi_wetlands_summary: 'Wetlands Summary',
             poi_earthquakes_count: 'USGS Earthquakes',
       poi_earthquakes_largest_magnitude: 'Largest Magnitude',
       poi_earthquakes_summary: 'Earthquake Summary',
       poi_volcanoes_count: 'NOAA Volcanoes',
       poi_volcanoes_active: 'Active Volcanoes',
       poi_volcanoes_summary: 'Volcano Summary',
       poi_flood_reference_points_count: 'USGS Flood Reference Points',
       poi_flood_reference_points_active_flooding: 'Actively Flooding Points',
       poi_flood_reference_points_summary: 'Flood Reference Summary',

      // Transportation
      poi_bus_count: 'Bus',
      poi_train_count: 'Train',
      poi_subway_metro_count: 'Subway/Metro',
      poi_tram_count: 'Tram',
      poi_monorail_count: 'Monorail',
      poi_aerialway_count: 'Aerialway',
      poi_ferry_count: 'Ferry',
      poi_airport_air_count: 'Airport/Air',
      poi_taxi_count: 'Taxi',
      poi_bike_scooter_share_count: 'Bike/Scooter Share',
      poi_dockless_hub_count: 'Dockless Hub',
              poi_electric_charging_count: 'Electric Charging Stations',
        poi_gas_stations_count: 'Gas Stations',

       // Natural Resources
       poi_beaches_count: 'Beaches',
       poi_lakes_ponds_count: 'Lakes & Ponds',
       poi_rivers_streams_count: 'Rivers & Streams',
       poi_mountains_peaks_count: 'Mountains & Peaks',
       
       // Recreation and Leisure
      poi_museums_historic_count: 'Museums, Historic Sites & Memorials'
    };

    // Handle POI counts
    const poiMatch = key.match(/^poi_([a-z_]+)_count_(\d+(?:\.\d+)?)mi$/);
    if (poiMatch) {
      const poiType = poiMatch[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const radius = poiMatch[2];
      return `${poiType} (${radius} mi)`;
    }

    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatEnrichmentValue = (key: string, value: any): string => {
    if (key === 'elevation_ft') return `${value} ft`;
    if (key === 'pm25') return `${value} µg/m³`;
    if (key === 'acs_median_hh_income') return `$${value?.toLocaleString() || value}`;
    
    // Handle wetlands data
    if (key === 'poi_wetlands_point_in_wetland') {
      return value ? 'Yes' : 'No';
    }
    if (key === 'poi_wetlands_summary') {
      return value || 'No data available';
    }
    
         // Handle earthquake data
     if (key === 'poi_earthquakes_largest_magnitude') {
       return value > 0 ? `M${value.toFixed(1)}` : 'None';
     }
     if (key === 'poi_earthquakes_summary') {
       return value || 'No data available';
     }
     
     // Handle volcano data
     if (key === 'poi_volcanoes_active') {
       return value > 0 ? `${value} active` : 'None active';
     }
     if (key === 'poi_volcanoes_summary') {
       return value || 'No data available';
     }
     
     // Handle flood reference points data
     if (key === 'poi_flood_reference_points_active_flooding') {
       return value > 0 ? `${value} points` : 'None active';
     }
     if (key === 'poi_flood_reference_points_summary') {
       return value || 'No data available';
     }
     
     // Handle AVI data source
     if (key === 'poi_animal_vehicle_collisions_source') {
       return value || 'No source data available';
     }

     

    
    // Handle POI counts specifically
    if (key.includes('_count') || key.includes('poi_')) {
      if (typeof value === 'number') {
        return `${value} found`;
      } else if (typeof value === 'string' && value.includes('found')) {
        return value;
      } else {
        return '0 found';
      }
    }
    
    // For any other values, convert to string safely
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return 'See map markers';
    
    return String(value);
  };



  // Download single lookup results with detailed POI data
  const downloadSingleLookupResults = (result: EnrichmentResult) => {
    if (!result) return;

    console.log('📥 Starting CSV download for single lookup results...');
    console.log('📍 Location:', result.location);
    console.log('🔍 Enrichments:', Object.keys(result.enrichments));

    // Create comprehensive CSV with all POI details
    const headers = ['Address', 'Latitude', 'Longitude', 'Source', 'Confidence'];
    const poiHeaders = ['POI_Type', 'POI_Name', 'POI_Latitude', 'POI_Longitude', 'Distance_Miles', 'POI_Category', 'POI_Address', 'POI_Phone', 'POI_Website', 'POI_Source'];
    
    const allHeaders = [...headers, ...poiHeaders];
    
    // Start with the main location
    const rows = [
      [
        result.location.name,
        result.location.lat,
        result.location.lon,
        result.location.source,
        result.location.confidence || 'N/A',
        'MAIN_LOCATION',
        result.location.name,
        result.location.lat,
        result.location.lon,
        '0.0',
        'Geocoded Address',
        '',
        '',
        ''
      ]
    ];

         // Add all POI data
     Object.entries(result.enrichments).forEach(([key, value]) => {
       console.log(`🔍 Processing enrichment key: ${key}`, value);
       
       // Check for both detailed_pois (map display) and all_pois (complete dataset)
       if (key.includes('_detailed') && Array.isArray(value)) {
         // Handle detailed POI arrays (limited to 50 for map)
         value.forEach((poi: any) => {
           // Special handling for AVI data
           if (key.includes('animal_vehicle_collisions')) {
             const aviName = `AVI-${poi.case_id || poi.id || 'Unknown'}`;
             const aviType = `${poi.source || 'AVI'} ${poi.year || ''}`.trim();
             rows.push([
               result.location.name,
               result.location.lat,
               result.location.lon,
               result.location.source,
               result.location.confidence || 'N/A',
               'ANIMAL_VEHICLE_COLLISION',
               aviName,
               poi.lat || '',
               poi.lon || '',
               poi.distance_miles || 'Unknown',
               aviType,
               poi.location || poi.address || '',
               '',
               '',
               poi.source || 'N/A'
             ]);
           } else {
             // Regular POI handling
             rows.push([
               result.location.name,
               result.location.lat,
               result.location.lon,
               result.location.source,
               result.location.confidence || 'N/A',
               key.replace('_detailed', '').replace('poi_', '').toUpperCase(),
               poi.name || poi.title || 'Unnamed',
               poi.lat || poi.center?.lat || '',
               poi.lon || poi.center?.lon || '',
               poi.distance_miles || 'Unknown',
               poi.tags?.amenity || poi.tags?.shop || poi.tags?.tourism || 'POI',
               poi.tags?.['addr:street'] || poi.address || poi.tags?.['addr:full'] || '',
               poi.tags?.phone || '',
               poi.tags?.website || '',
               poi.source || 'N/A'
             ]);
           }
         });
       } else if (key.includes('_all') && Array.isArray(value)) {
         // Handle ALL POI arrays (complete dataset for CSV)
         value.forEach((poi: any) => {
           // Special handling for AVI data
           if (key.includes('animal_vehicle_collisions')) {
             const aviName = `AVI-${poi.case_id || poi.id || 'Unknown'}`;
             const aviType = `${poi.source || 'AVI'} ${poi.year || ''}`.trim();
             rows.push([
               result.location.name,
               result.location.lat,
               result.location.lon,
               result.location.source,
               result.location.confidence || 'N/A',
               'ANIMAL_VEHICLE_COLLISION',
               aviName,
               poi.lat || '',
               poi.lon || '',
               poi.distance_miles || 'Unknown',
               aviType,
               poi.location || poi.address || '',
               '',
               '',
               poi.source || 'N/A'
             ]);
           } else {
             // Regular POI handling
             rows.push([
               result.location.name,
               result.location.lat,
               result.location.lon,
               result.location.source,
               result.location.confidence || 'N/A',
               key.replace('_all', '').replace('poi_', '').toUpperCase(),
               poi.name || poi.title || 'Unnamed',
               poi.lat || poi.center?.lat || '',
               poi.lon || poi.center?.lon || '',
               poi.distance_miles || 'Unknown',
               poi.tags?.amenity || poi.tags?.shop || poi.tags?.tourism || 'POI',
               poi.tags?.['addr:street'] || poi.address || poi.tags?.['addr:full'] || '',
               poi.tags?.phone || '',
               poi.tags?.website || '',
               poi.source || 'N/A'
             ]);
           }
         });
       } else if (key === 'poi_wikipedia_articles' && Array.isArray(value)) {
        // Handle Wikipedia articles
        value.forEach((article: any) => {
          rows.push([
            result.location.name,
            result.location.lat,
            result.location.lon,
            result.location.source,
            result.location.confidence || 'N/A',
            'WIKIPEDIA',
            article.title,
            article.lat,
            article.lon,
            article.distance_miles || Math.round((article.distance_km || 0) * 0.621371 * 100) / 100,
            'Wikipedia Article',
            '',
            '',
            article.url
          ]);
        });
      }
      
      // Add museums, historic sites, and memorials data
      if (key === 'poi_museums_historic_detailed' && Array.isArray(value)) {
        value.forEach((poi: any) => {
          rows.push([
            result.location.name,
            result.location.lat,
            result.location.lon,
            result.location.source,
            result.location.confidence || 'N/A',
            'MUSEUMS_HISTORIC',
            poi.name || poi.title || 'Unnamed',
            poi.lat || poi.center?.lat || '',
            poi.lon || poi.center?.lon || '',
            poi.distance_miles || 'Unknown',
            poi.tags?.tourism || poi.tags?.historic || 'Cultural Site',
            poi.tags?.['addr:street'] || poi.address || poi.tags?.['addr:full'] || '',
            poi.tags?.phone || '',
            poi.tags?.website || ''
          ]);
        });
      }
      
             // Special handling for AVI data - include source field
       if (key === 'poi_animal_vehicle_collisions_all_pois' && Array.isArray(value)) {
         value.forEach((collision: any) => {
           rows.push([
             result.location.name,
             result.location.lat,
             result.location.lon,
             result.location.source,
             result.location.confidence || 'N/A',
             'ANIMAL_VEHICLE_COLLISION',
             'Collision Record',
             collision.lat || '',
             collision.lon || '',
             collision.distance_miles || 'Unknown',
             'Hazard Assessment',
             `Source: ${collision.source || 'Unknown'}, Year: ${collision.crash_year || 'Unknown'}, Case: ${collision.st_case || 'N/A'}`,
             '',
             '',
             collision.source || 'Unknown'
           ]);
         });
       }
       
       
    });

    // Add FEMA flood zone data
    if (result.enrichments.poi_fema_flood_zones_current) {
      rows.push([
        result.location.name,
        result.location.lat,
        result.location.lon,
        result.location.source,
        result.location.confidence || 'N/A',
        'FEMA_FLOOD_ZONE',
        'Current Zone',
        result.location.lat,
        result.location.lon,
        '0.0',
        'Flood Zone Assessment',
        result.enrichments.poi_fema_flood_zones_current,
        '',
        ''
      ]);
    }
    
    if (result.enrichments.poi_fema_flood_zones_nearby && Array.isArray(result.enrichments.poi_fema_flood_zones_nearby) && result.enrichments.poi_fema_flood_zones_nearby.length > 0) {
      const nearestZone = result.enrichments.poi_fema_flood_zones_nearby[0];
      rows.push([
        result.location.name,
        result.location.lat,
        result.location.lon,
        result.location.source,
        result.location.confidence || 'N/A',
        'FEMA_FLOOD_ZONE',
        'Nearest Zone',
        result.location.lat,
        result.location.lon,
        nearestZone.distance_miles || '5.0',
        'Flood Zone Assessment',
        nearestZone.zone || 'Unknown Zone',
        '',
        ''
      ]);
    }
    
    // Add USGS Wetlands data - simplified Yes/No format
    if (result.enrichments.poi_wetlands_point_in_wetland !== undefined) {
      rows.push([
        result.location.name,
        result.location.lat,
        result.location.lon,
        result.location.source,
        result.location.confidence || 'N/A',
        'USGS_WETLANDS',
        'Point in Wetland',
        result.location.lat,
        result.location.lon,
        '0.0',
        'Wetland Assessment',
        result.enrichments.poi_wetlands_point_in_wetland ? 'Yes' : 'No',
        '',
        ''
      ]);
      
             rows.push([
         result.location.name,
         result.location.lat,
         result.location.lon,
         result.location.source,
         result.location.confidence || 'N/A',
         'USGS_WETLANDS',
         'Wetlands Within Distance',
         result.location.lat,
         result.location.lon,
         (result.enrichments.poi_wetlands_proximity_distance || 2.0).toFixed(1), // Use actual proximity distance
         'Wetland Assessment',
         (result.enrichments.poi_wetlands_count || 0) > 0 ? 'Yes' : 'No',
         '',
         ''
       ]);
    }
    
         // Add USGS Earthquake data
     if (result.enrichments.poi_earthquakes_count !== undefined) {
       rows.push([
         result.location.name,
         result.location.lat,
         result.location.lon,
         result.location.source,
         result.location.confidence || 'N/A',
         'USGS_EARTHQUAKES',
         'Historical Earthquakes',
         result.location.lat,
         result.location.lon,
         (result.enrichments.poi_earthquakes_proximity_distance || 25.0).toFixed(1), // Use actual proximity distance
         'Seismic Assessment',
         `${result.enrichments.poi_earthquakes_count || 0} found`,
         '',
         ''
       ]);
       
       if (result.enrichments.poi_earthquakes_largest_magnitude > 0) {
         rows.push([
           result.location.name,
           result.location.lat,
           result.location.lon,
           result.location.source,
           result.location.confidence || 'N/A',
           'USGS_EARTHQUAKES',
           'Largest Magnitude',
           result.location.lat,
           result.location.lon,
           '0.0',
           'Seismic Assessment',
           `M${result.enrichments.poi_earthquakes_largest_magnitude.toFixed(1)}`,
           '',
           ''
         ]);
       }
     }
     
     // Add USGS Volcano data
     if (result.enrichments.poi_volcanoes_count !== undefined) {
       rows.push([
         result.location.name,
         result.location.lat,
         result.location.lon,
         result.location.source,
         result.location.confidence || 'N/A',
         'NOAA_VOLCANOES',
         'Volcanoes',
         result.location.lat,
         result.location.lon,
         (result.enrichments.poi_volcanoes_proximity_distance || 50.0).toFixed(1), // Use actual proximity distance
         'Volcanic Assessment',
         `${result.enrichments.poi_volcanoes_count || 0} found`,
         '',
         ''
       ]);
       
       if (result.enrichments.poi_volcanoes_active > 0) {
         rows.push([
           result.location.name,
           result.location.lat,
           result.location.lon,
           result.location.source,
           result.location.confidence || 'N/A',
           'NOAA_VOLCANOES',
           'Active Volcanoes',
           result.location.lat,
           result.location.lon,
           '0.0',
           'Volcanic Assessment',
           `${result.enrichments.poi_volcanoes_active} active`,
           '',
           ''
         ]);
       }
     }
     
     // Add Flood Reference Points data
     if (result.enrichments.poi_flood_reference_points_count !== undefined) {
       rows.push([
         result.location.name,
         result.location.lat,
         result.location.lon,
         result.location.source,
         result.location.confidence || 'N/A',
         'USGS_FLOOD_REFERENCE_POINTS',
         'Flood Reference Points',
         result.location.lat,
         result.location.lon,
         (result.enrichments.poi_flood_reference_points_proximity_distance || 25.0).toFixed(1), // Use actual proximity distance
         'Flood Reference Assessment',
         `${result.enrichments.poi_flood_reference_points_count || 0} found`,
         '',
         ''
       ]);
       
       if (result.enrichments.poi_flood_reference_points_active_flooding > 0) {
         rows.push([
           result.location.name,
           result.location.lat,
           result.location.lon,
           result.location.source,
           result.location.confidence || 'N/A',
           'USGS_FLOOD_REFERENCE_POINTS',
           'Actively Flooding Points',
           result.location.lat,
           result.location.lon,
           '0.0',
           'Flood Reference Assessment',
           `${result.enrichments.poi_flood_reference_points_active_flooding} points`,
           '',
           ''
         ]);
       }
     }
     
                    // Add Open-Meteo Weather data
               if (result.enrichments.open_meteo_weather_temperature_f !== undefined) {
                 rows.push([
                   result.location.name,
                   result.location.lat,
                   result.location.lon,
                   result.location.source,
                   result.location.confidence || 'N/A',
                   'OPEN_METEO_WEATHER',
                   'Current Weather Conditions',
                   result.location.lat,
                   result.location.lon,
                   '0.0',
                   'Real-time Weather Data',
                   `${result.enrichments.open_meteo_weather_temperature_f.toFixed(1)}°F (${result.enrichments.open_meteo_weather_temperature_c}°C)`,
                   result.enrichments.open_meteo_weather_weather_description || 'Unknown',
                   result.enrichments.open_meteo_weather_windspeed_mph ? `${result.enrichments.open_meteo_weather_windspeed_mph.toFixed(1)} mph (${result.enrichments.open_meteo_weather_windspeed} km/h)` : 'Unknown'
                 ]);
               }

               // Add PAD-US Public Access data
               if (result.enrichments.padus_public_access_inside !== undefined) {
                 // Add point-in-polygon status
                 rows.push([
                   result.location.name,
                   result.location.lat,
                   result.location.lon,
                   result.location.source,
                   result.location.confidence || 'N/A',
                   'PADUS_PUBLIC_ACCESS',
                   'Point-in-Polygon Status',
                   result.location.lat,
                   result.location.lon,
                   '0.0',
                   'Public Lands Assessment',
                   result.enrichments.padus_public_access_inside ? 'Inside Public Land' : 'Not Inside Public Land',
                   result.enrichments.padus_public_access_inside_info?.unitName || 'N/A',
                   result.enrichments.padus_public_access_inside_info?.managerName || 'N/A'
                 ]);
                 
                 
                 // Add detailed nearby features
                 if (result.enrichments.padus_public_access_nearby_features && Array.isArray(result.enrichments.padus_public_access_nearby_features)) {
                   result.enrichments.padus_public_access_nearby_features.forEach((feature: any) => {
                     rows.push([
                       result.location.name,
                       result.location.lat,
                       result.location.lon,
                       result.location.source,
                       result.location.confidence || 'N/A',
                       'PADUS_PUBLIC_ACCESS',
                       feature.unitName || 'Unnamed Public Land',
                       result.location.lat,
                       result.location.lon,
                       (result.enrichments.padus_public_access_proximity_distance || 5.0).toFixed(1),
                       'Public Lands Feature',
                       `${feature.managerName || 'Unknown'} - ${feature.publicAccess || 'Unknown'} access`,
                       feature.category || 'Unknown',
                       feature.acres ? `${feature.acres.toLocaleString()} acres` : 'Unknown'
                     ]);
                   });
                 }
               }

                              // Add PAD-US Protection Status data
               if (result.enrichments.padus_protection_status_nearby_features && Array.isArray(result.enrichments.padus_protection_status_nearby_features)) {
                 result.enrichments.padus_protection_status_nearby_features.forEach((feature: any) => {
                   rows.push([
                     result.location.name,
                     result.location.lat,
                     result.location.lon,
                     result.location.source,
                     result.location.confidence || 'N/A',
                     'PADUS_PROTECTION_STATUS',
                     feature.unitName || 'Unnamed Protected Area',
                     result.location.lat,
                     result.location.lon,
                     (result.enrichments.padus_protection_status_proximity_distance || 5.0).toFixed(1),
                     'Protection Status Feature',
                     `${feature.gapStatus || 'Unknown'} - ${feature.iucnCategory || 'Unknown'}`,
                     feature.category || 'Unknown',
                     feature.publicAccess || 'Unknown'
                   ]);
                 });
               }

               // Add NWS Weather Alerts data
               if (result.enrichments.nws_weather_alerts_count !== undefined) {
                 const alertRadius = result.enrichments.nws_weather_alerts_radius_miles || 25.0;
                 rows.push([
                   result.location.name,
                   result.location.lat,
                   result.location.lon,
                   result.location.source,
                   result.location.confidence || 'N/A',
                   'NWS_WEATHER_ALERTS',
                   'Active Weather Alerts',
                   result.location.lat,
                   result.location.lon,
                   alertRadius.toFixed(1),
                   'Weather Alert Assessment',
                   `${result.enrichments.nws_weather_alerts_count || 0} active alerts`,
                   '',
                   ''
                 ]);

                 // Add individual alert details if available
                 if (result.enrichments.nws_weather_alerts_details && result.enrichments.nws_weather_alerts_details.length > 0) {
                   result.enrichments.nws_weather_alerts_details.forEach((alert: any) => {
                     rows.push([
                       result.location.name,
                       result.location.lat,
                       result.location.lon,
                       result.location.source,
                       result.location.confidence || 'N/A',
                       'NWS_WEATHER_ALERTS',
                       alert.event || 'Unknown Event',
                       result.location.lat,
                       result.location.lon,
                       alertRadius.toFixed(1),
                       `${alert.severity} - ${alert.urgency} - ${alert.certainty}`,
                       alert.headline || 'No headline',
                       alert.area_desc || 'Unknown area',
                       alert.effective || 'Unknown'
                     ]);
                   });
                 }
               }
     
     // Add Transportation data
     const transportationPOIs = [
       'poi_bus', 'poi_train', 'poi_subway_metro', 'poi_tram', 'poi_monorail',
       'poi_aerialway', 'poi_ferry', 'poi_airport_air', 'poi_taxi', 
               'poi_bike_scooter_share', 'poi_dockless_hub', 'poi_electric_charging', 'poi_gas_stations'
     ];
     
     transportationPOIs.forEach(poiType => {
       const count = result.enrichments[`${poiType}_count`];
       if (count !== undefined) {
         const label = poiType.replace('poi_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
         rows.push([
           result.location.name,
           result.location.lat,
           result.location.lon,
           result.location.source,
           result.location.confidence || 'N/A',
           'TRANSPORTATION',
           label,
           result.location.lat,
           result.location.lon,
           (result.enrichments[`${poiType}_proximity_distance`] || 5.0).toFixed(1), // Use actual proximity distance
           'Transportation Assessment',
           `${count || 0} found`,
           '',
           ''
         ]);
       }
     });
     
     // Add Natural Resources data
     const naturalResourcePOIs = [
       'poi_beaches', 'poi_lakes_ponds', 'poi_rivers_streams', 'poi_mountains_peaks'
     ];
     
     naturalResourcePOIs.forEach(poiType => {
       const count = result.enrichments[`${poiType}_count`];
       if (count !== undefined) {
         const label = poiType.replace('poi_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
         rows.push([
           result.location.name,
           result.location.lat,
           result.location.lon,
           result.location.source,
           result.location.confidence || 'N/A',
           'NATURAL_RESOURCES',
           label,
           result.location.lat,
           result.location.lon,
           (result.enrichments[`${poiType}_proximity_distance`] || 5.0).toFixed(1), // Use actual proximity distance
           'Natural Resources Assessment',
           `${count || 0} found`,
           '',
           ''
         ]);
       }
     });
     
     // Add EPA FRS Environmental Hazards data
    const epaPrograms = [
      'poi_epa_brownfields',
      'poi_epa_superfund', 
      'poi_epa_rcra',
      'poi_epa_tri',
      'poi_epa_npdes',
      'poi_epa_air',
      'poi_epa_radiation',
      'poi_epa_power',
      'poi_epa_oil_spill'
    ];
    
    epaPrograms.forEach(programKey => {
      const facilities = result.enrichments[`${programKey}_facilities`];
      if (facilities && Array.isArray(facilities) && facilities.length > 0) {
        facilities.forEach((facility: any) => {
          rows.push([
            result.location.name,
            result.location.lat,
            result.location.lon,
            result.location.source,
            result.location.confidence || 'N/A',
            programKey.replace('poi_', '').toUpperCase(),
            facility.name || 'Unnamed Facility',
            facility.lat,
            facility.lon,
            facility.distance_miles?.toFixed(2) || 'Unknown',
            facility.program || 'EPA Facility',
            facility.address || '',
            '',
            ''
          ]);
        });
      }
    });

    // Add USDA Local Food Portal facilities
    const usdaPrograms = [
      'poi_usda_agritourism',
      'poi_usda_csa',
      'poi_usda_farmers_market',
      'poi_usda_food_hub',
      'poi_usda_onfarm_market'
    ];
    
    usdaPrograms.forEach(programKey => {
      const facilities = result.enrichments[`${programKey}_facilities`];
      if (facilities && Array.isArray(facilities) && facilities.length > 0) {
        facilities.forEach((facility: any) => {
          rows.push([
            result.location.name,
            result.location.lat,
            result.location.lon,
            result.location.source,
            result.location.confidence || 'N/A',
            programKey.replace('poi_', '').toUpperCase(),
            facility.name || 'Unnamed Facility',
            facility.lat,
            facility.lon,
            facility.distance_miles?.toFixed(2) || 'Unknown',
            facility.program || 'USDA Program',
            facility.address || '',
            '',
            ''
          ]);
        });
      }
    });

    console.log(`📊 CSV will contain ${rows.length} rows with headers:`, allHeaders);

    const csvContent = [
      allHeaders.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create and download file with timestamp
    const timestamp = new Date().toISOString().slice(0, 10); // Just YYYY-MM-DD
    const cleanName = result.location.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20); // Limit to 20 chars, remove special chars
    const filename = `enrichment_${cleanName}_${timestamp}.csv`;
    
    console.log(`💾 Downloading CSV file: ${filename}`);
    
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      console.log('✅ CSV download completed successfully');
    } catch (error) {
      console.error('❌ Error downloading CSV:', error);
      // Fallback: try to open in new window
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<pre>${csvContent}</pre>`);
        newWindow.document.title = filename;
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white" style={{ height: '100vh', paddingTop: isMobile ? '0' : '7rem' }}>
      {/* Results Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <button
          onClick={onBackToConfig}
          className="btn btn-outline flex items-center space-x-2 text-sm sm:text-base"
        >
          <span className="w-4 h-4">←</span>
          <span className="hidden sm:inline">Back to Configuration</span>
          <span className="sm:hidden">Back</span>
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">Location Results</h2>
            <p className="text-sm text-gray-600">{results.length} location{results.length !== 1 ? 's' : ''} processed</p>
          </div>
          
          {/* Prominent Download Button for Single Lookup */}
          {results.length === 1 && (
            <button
              onClick={() => downloadSingleLookupResults(results[0])}
              className="btn btn-primary flex items-center space-x-2 px-4 py-2"
              title="Download all proximity layers and distances for this location"
            >
              <span className="w-4 h-4">⬇️</span>
              <span>Download Results</span>
            </button>
          )}
        </div>
      </div>

             {/* Dynamic Legend for Single Location Results */}
       {results.length === 1 && legendItems.length > 0 && (
         <div className="bg-white border-b border-gray-200 p-3">
                       <div className="flex items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 text-blue-600">ℹ️</span>
                <span className="text-sm font-medium text-gray-700">Map Legend</span>
              </div>
            </div>
           <div className="flex flex-wrap gap-3">
             {legendItems.map((item, index) => (
               <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                 <span 
                   className="text-sm font-semibold" 
                   style={{ color: item.color }}
                 >
                   {item.icon}
                 </span>
                 <span className="text-xs text-gray-600">
                   {item.title} ({item.count})
                 </span>
               </div>
             ))}
           </div>
         </div>
       )}

      {/* Map Container */}
      <div className="flex-1 relative map-view-container" style={{ minHeight: isMobile ? 'calc(100vh - 8rem)' : 'calc(100vh - 14rem)' }}>
        <div ref={mapRef} className="w-full h-full map-container" style={{ minHeight: isMobile ? 'calc(100vh - 8rem)' : 'calc(100vh - 14rem)' }} />
        
        {/* Batch Success Message */}
        {showBatchSuccess && (
          <div className="absolute top-4 left-4 bg-green-50 border border-green-200 rounded-lg shadow-lg max-w-sm">
            <div className="p-4 flex items-center space-x-3">
              <span className="w-5 h-5 text-green-600">✅</span>
              <div>
                <h3 className="font-medium text-green-900">Batch Processing Complete!</h3>
                <p className="text-sm text-green-700">CSV download started automatically</p>
              </div>
            </div>
          </div>
        )}
        
                 
      </div>
    </div>
  );
};

export default MapView;
