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
  'poi_gas': { icon: '⛽', color: '#fbbf24', title: 'Gas Stations' },
  'poi_airports': { icon: '✈️', color: '#6366f1', title: 'Airports' },
  'poi_tnm_trails': { icon: '🥾', color: '#059669', title: 'Trails' },
  'poi_tnm_railroads': { icon: '🚂', color: '#7c3aed', title: 'Railroads' },
  'poi_train_stations': { icon: '🚉', color: '#dc2626', title: 'Train Stations' },
  'poi_bus_stations': { icon: '🚌', color: '#2563eb', title: 'Bus Stations' },
  'poi_bus_stops': { icon: '🚏', color: '#0891b2', title: 'Bus Stops' },
  'poi_wikipedia': { icon: '📖', color: '#1d4ed8', title: 'Wikipedia Articles' },
  'poi_fema_flood_zones': { icon: '🌊', color: '#0891b2', title: 'FEMA Flood Zones' },
  'poi_wetlands': { icon: '🌿', color: '#059669', title: 'USGS Wetlands' },
  'poi_earthquakes': { icon: '🌋', color: '#dc2626', title: 'USGS Earthquakes' },
  
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

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // Clean up resize event listener
      window.removeEventListener('resize', handleResize);
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
    
    // Update legend state
    setLegendItems(currentLegendItems);
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
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${name}</h3>
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
    const minWidth = isMobile ? '250px' : '300px';
    const maxWidth = isMobile ? '350px' : '400px';
    const fontSize = isMobile ? '11px' : '12px';
    const headerFontSize = isMobile ? '14px' : '16px';
    
    let content = `
      <div style="min-width: ${minWidth}; max-width: ${maxWidth};">
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-weight: 600; font-size: ${headerFontSize};">${location.name}</h3>
        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: ${fontSize};">
          📍 ${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}<br>
          🔍 Source: ${location.source}
        </p>
    `;

    if (Object.keys(enrichments).length > 0) {
      content += '<hr style="margin: 12px 0; border-color: #e5e7eb;">';
      content += `<h4 style="margin: 0 0 12px 0; color: #374151; font-size: ${isMobile ? '12px' : '14px'}; font-weight: 600;">Enrichment Data:</h4>`;
      
      // Special handling for FEMA flood zones - show only two clean rows
      if (enrichments.poi_fema_flood_zones_current || enrichments.poi_fema_flood_zones_nearby) {
        content += `<div style="margin: 4px 0; font-size: ${fontSize}; display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">FEMA Flood Zone:</span>
          <span style="color: #1f2937; font-weight: 500;">${enrichments.poi_fema_flood_zones_current || 'None'}</span>
        </div>`;
        
        if (enrichments.poi_fema_flood_zones_nearby && Array.isArray(enrichments.poi_fema_flood_zones_nearby) && enrichments.poi_fema_flood_zones_nearby.length > 0) {
          const nearestZone = enrichments.poi_fema_flood_zones_nearby[0];
          const zoneName = nearestZone.zone || 'Unknown Zone';
          const distance = nearestZone.distance_miles || 5;
          content += `<div style="margin: 4px 0; font-size: ${fontSize}; display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">FEMA Flood Zone within ${distance} mi:</span>
            <span style="color: #1f2937; font-weight: 500;">${zoneName}</span>
          </div>`;
        }
      }
      
      // Special handling for USGS Wetlands - show two simple Yes/No fields with dynamic distance
      if (enrichments.poi_wetlands_point_in_wetland !== undefined) {
        // Get the actual proximity distance from the enrichment data or use default
        const proximityDistance = enrichments.poi_wetlands_proximity_distance || 2; // Default to 2 miles if not specified
        
        content += `<div style="margin: 4px 0; font-size: ${fontSize}; display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Point in Wetland:</span>
          <span style="color: #1f2937; font-weight: 500;">${enrichments.poi_wetlands_point_in_wetland ? 'Yes' : 'No'}</span>
        </div>`;
        content += `<div style="margin: 4px 0; font-size: ${fontSize}; display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Wetlands Within ${proximityDistance} mi:</span>
          <span style="color: #1f2937; font-weight: 500;">${(enrichments.poi_wetlands_count || 0) > 0 ? 'Yes' : 'No'}</span>
        </div>`;
      }
      
      // Special handling for USGS Earthquakes - show count and largest magnitude with dynamic distance
      if (enrichments.poi_earthquakes_count !== undefined) {
        // Get the actual proximity distance from the enrichment data or use default
        const proximityDistance = enrichments.poi_earthquakes_proximity_distance || 25; // Default to 25 miles if not specified
        
        content += `<div style="margin: 4px 0; font-size: ${fontSize}; display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Earthquakes Within ${proximityDistance} mi:</span>
          <span style="color: #1f2937; font-weight: 500;">${enrichments.poi_earthquakes_count || 0} found</span>
        </div>`;
        
        if (enrichments.poi_earthquakes_largest_magnitude > 0) {
          content += `<div style="margin: 4px 0; font-size: ${fontSize}; display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">Largest Magnitude:</span>
            <span style="color: #1f2937; font-weight: 500;">M${enrichments.poi_earthquakes_largest_magnitude.toFixed(1)}</span>
          </div>`;
        }
      }
      
      // Display all other enrichments as simple name: count pairs
      Object.entries(enrichments).forEach(([key, value]) => {
        // Skip FEMA flood zone fields as they're handled above
        if (key.includes('poi_fema_flood_zones')) {
          return;
        }
        
        // Skip wetlands fields as they're handled above
        if (key.includes('poi_wetlands')) {
          return;
        }
        
        // Skip earthquake fields as they're handled above
        if (key.includes('poi_earthquakes')) {
          return;
        }
        
        // Skip Wikipedia summary fields (redundant with count)
        if (key.includes('poi_wikipedia_summary')) {
          return;
        }
        
        // Skip EPA summary fields (redundant with count)
        if (key.includes('_summary') && key.includes('poi_epa_')) {
          return;
        }
        
        if (value !== null && value !== undefined && value !== '') {
          // Skip detailed POI arrays and complex objects
          if (key.includes('_detailed') || key.includes('_facilities') || key.includes('_nearby')) {
            return;
          }
          
          // Skip complex objects, only show simple values
          if (typeof value === 'object' && value !== null) {
            return;
          }
          
          const label = formatEnrichmentLabel(key);
          const displayValue = formatEnrichmentValue(key, value);
          
          content += `<div style="margin: 4px 0; font-size: ${fontSize}; display: flex; justify-content: space-between; flex-wrap: wrap;">
            <span style="color: #6b7280; margin-right: 8px;">${label}:</span>
            <span style="color: #1f2937; font-weight: 500; text-align: right;">${displayValue}</span>
          </div>`;
        }
      });
    } else {
      content += '<p style="margin: 12px 0; color: #6b7280; font-style: italic; font-size: 13px;">No enrichments selected or available for this location.</p>';
    }
    
    content += '</div>';
    return content;
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
      poi_wetlands_count: 'USGS Wetlands',
      poi_wetlands_point_in_wetland: 'Point in Wetland',
      poi_wetlands_summary: 'Wetlands Summary',
      poi_earthquakes_count: 'USGS Earthquakes',
      poi_earthquakes_largest_magnitude: 'Largest Magnitude',
      poi_earthquakes_summary: 'Earthquake Summary',
      
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
    const poiHeaders = ['POI_Type', 'POI_Name', 'POI_Latitude', 'POI_Longitude', 'Distance_Miles', 'POI_Category', 'POI_Address', 'POI_Phone', 'POI_Website'];
    
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
             poi.tags?.website || ''
           ]);
         });
       } else if (key.includes('_all') && Array.isArray(value)) {
         // Handle ALL POI arrays (complete dataset for CSV)
         value.forEach((poi: any) => {
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
             poi.tags?.website || ''
           ]);
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
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `single_lookup_results_${result.location.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.csv`;
    
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
    <div className="h-full flex flex-col bg-white pt-28">
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
      <div className="flex-1 relative map-view-container">
        <div ref={mapRef} className="w-full h-full map-container" />
        
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
        
                         {/* Results Summary Panel */}
        {!isMobile && results.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm max-h-80 overflow-y-auto z-[9999]">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <span className="w-4 h-4 text-primary-600">ℹ️</span>
                <span>Results Summary</span>
              </h3>
            </div>
            
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0">📍</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {result.location.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {result.location.lat.toFixed(4)}, {result.location.lon.toFixed(4)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Source: {result.location.source}
                      </p>
                    </div>
                  </div>
                  
                  {Object.keys(result.enrichments).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">Enrichments:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(result.enrichments).slice(0, 3).map(([key, value]) => (
                          <span key={key} className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
                            {formatEnrichmentLabel(key)}: {formatEnrichmentValue(key, value)}
                          </span>
                        ))}
                        {Object.keys(result.enrichments).length > 3 && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{Object.keys(result.enrichments).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
