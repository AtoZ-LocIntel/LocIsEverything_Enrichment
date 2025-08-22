import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, MapPin, Info, CheckCircle } from 'lucide-react';
import { EnrichmentResult } from '../App';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  results: EnrichmentResult[];
  onBackToConfig: () => void;
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
  'poi_wikipedia': { icon: '📖', color: '#1d4ed8', title: 'Wikipedia Articles' },
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

const MapView: React.FC<MapViewProps> = ({ results, onBackToConfig }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [showBatchSuccess, setShowBatchSuccess] = useState(false);
  const [legendItems, setLegendItems] = useState<LegendItem[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [39.8283, -98.5795], // Center of USA
      zoom: 4,
      zoomControl: true,
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

    // Add layer control to map
    L.control.layers(maptilerLayers, {}, {
      position: 'topright',
      collapsed: false
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
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

        // For single search results, FORCE the map to stay at the geocoded location
        if (results.length === 1) {
          console.log(`🎯 FORCING map to geocoded location: [${lat}, ${lon}]`);
          
                     // Set the view immediately with much higher zoom for block-level detail
           map.setView([lat, lon], 19, { animate: false });
          
          // Add POI markers (but don't let them affect the map view)
          addPOIMarkers(map, result);
          
                     // Force the map back every 100ms for the next 1 second to ensure it stays put
           const forceView = () => {
             map.setView([lat, lon], 19, { animate: false });
           };
          
          setTimeout(forceView, 50);
          setTimeout(forceView, 100);
          setTimeout(forceView, 200);
          setTimeout(forceView, 300);
          setTimeout(forceView, 500);
          setTimeout(forceView, 1000);
          
          // Also force view whenever the map tries to move
          const onMoveEnd = () => {
            const currentCenter = map.getCenter();
            const targetLat = lat;
            const targetLon = lon;
            
                         // If map moved more than 0.01 degrees from target, force it back
             if (Math.abs(currentCenter.lat - targetLat) > 0.01 || Math.abs(currentCenter.lng - targetLon) > 0.01) {
               console.log(`🚫 Map moved to [${currentCenter.lat}, ${currentCenter.lng}], forcing back to [${targetLat}, ${targetLon}]`);
               map.setView([targetLat, targetLon], 19, { animate: false });
             }
          };
          
          map.on('moveend', onMoveEnd);
          
          // Remove the event listener after 5 seconds
          setTimeout(() => {
            map.off('moveend', onMoveEnd);
          }, 5000);
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

    // Auto-open popup for first marker after a short delay to ensure map is ready
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
    
    // Update legend state
    setLegendItems(currentLegendItems);
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
    
    let content = `
      <div style="min-width: 300px; max-width: 400px;">
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-weight: 600; font-size: 16px;">${location.name}</h3>
        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px;">
          📍 ${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}<br>
          🔍 Source: ${location.source}
        </p>
    `;

    if (Object.keys(enrichments).length > 0) {
      content += '<hr style="margin: 12px 0; border-color: #e5e7eb;">';
      content += '<h4 style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">Enrichment Data:</h4>';
      
      // Group enrichments by category for better organization
      const coreEnrichments: Record<string, any> = {};
      const poiEnrichments: Record<string, any> = {};
      
      Object.entries(enrichments).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (key.includes('poi_') || key.includes('_count_')) {
            poiEnrichments[key] = value;
          } else {
            coreEnrichments[key] = value;
          }
        }
      });

      // Display core enrichments first
      if (Object.keys(coreEnrichments).length > 0) {
        content += '<div style="margin-bottom: 12px;">';
        content += '<h5 style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; font-weight: 500;">Core Attributes:</h5>';
        Object.entries(coreEnrichments).forEach(([key, value]) => {
          const label = formatEnrichmentLabel(key);
          content += `<div style="margin: 4px 0; font-size: 12px; display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">${label}:</span>
            <span style="color: #1f2937; font-weight: 500;">${formatEnrichmentValue(key, value)}</span>
          </div>`;
        });
        content += '</div>';
      }

      // Display POI enrichments
      if (Object.keys(poiEnrichments).length > 0) {
        content += '<div>';
        content += '<h5 style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; font-weight: 500;">Nearby Points of Interest:</h5>';
        
        // Special handling for Wikipedia POIs to show article details
        if (poiEnrichments.poi_wikipedia_articles && Array.isArray(poiEnrichments.poi_wikipedia_articles)) {
          const articles = poiEnrichments.poi_wikipedia_articles;
          const count = poiEnrichments.poi_wikipedia_count || articles.length;
          
          content += `<div style="margin: 4px 0; font-size: 12px; display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">Wikipedia Articles:</span>
            <span style="color: #1f2937; font-weight: 500;">${count} found</span>
          </div>`;
          
          // Show top articles with names
          if (articles.length > 0) {
            const topArticles = articles.slice(0, 5); // Show top 5
            content += '<div style="margin: 8px 0; padding: 8px; background: #f9fafb; border-radius: 4px;">';
            content += '<div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Top articles:</div>';
            topArticles.forEach((article: any) => {
              const distance = article.distance_miles || Math.round((article.distance_km || 0) * 0.621371 * 100) / 100;
              content += `<div style="font-size: 11px; margin: 2px 0; color: #374151;">
                • <a href="${article.url}" target="_blank" style="color: #3b82f6; text-decoration: none;">${article.title}</a>
                <span style="color: #9ca3af;"> (${distance} mi)</span>
              </div>`;
            });
            if (articles.length > 5) {
              content += `<div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">...and ${articles.length - 5} more</div>`;
            }
            content += '</div>';
          }
        }
        
                 // Handle other POI types - just show counts, not detailed data
         Object.entries(poiEnrichments).forEach(([key, value]) => {
           if (key === 'poi_wikipedia_articles' || key === 'poi_wikipedia_by_category' || key === 'poi_wikipedia_summary') {
             return; // Skip these as they're handled above
           }
           
           // Only show POI counts, not detailed arrays
           if (key.includes('_detailed')) {
             return; // Skip detailed POI arrays
           }
           
           const label = formatEnrichmentLabel(key);
           content += `<div style="margin: 4px 0; font-size: 12px; display: flex; justify-content: space-between;">
             <span style="color: #6b7280;">${label}:</span>
             <span style="color: #1f2937; font-weight: 500;">${formatEnrichmentValue(key, value)}</span>
           </div>`;
         });
        content += '</div>';
      }
    } else {
      content += '<p style="margin: 12px 0; color: #6b7280; font-style: italic; font-size: 13px;">No enrichments selected or available for this location.</p>';
    }

    content += '</div>';
    return content;
  };

  const formatEnrichmentLabel = (key: string): string => {
    const labels: Record<string, string> = {
      elevation_m: 'Elevation',
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
      poi_wikipedia_summary: 'Wikipedia Summary'
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
    if (key === 'elevation_m') return `${value} m`;
    if (key === 'pm25') return `${value} µg/m³`;
    if (key === 'acs_median_hh_income') return `$${value?.toLocaleString() || value}`;
    if (key.endsWith('_count_')) return `${value} found`;
    if (key === 'poi_wikipedia_summary') return value || 'No summary available';
    
    // Handle POI counts specifically
    if (key.includes('_count_')) {
      return `${value} found`;
    }
    
    // For any other values, convert to string safely
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return 'See map markers';
    
    return String(value);
  };

  const downloadResults = () => {
    if (!results.length) return;

    // Convert results to CSV format
    const headers = ['Address', 'Latitude', 'Longitude', 'Source', 'Confidence'];
    const enrichmentKeys = new Set<string>();
    
    results.forEach(result => {
      Object.keys(result.enrichments).forEach(key => enrichmentKeys.add(key));
    });

    const allHeaders = [...headers, ...Array.from(enrichmentKeys)];
    
    const csvContent = [
      allHeaders.join(','),
      ...results.map(result => {
        const row = [
          result.location.name,
          result.location.lat,
          result.location.lon,
          result.location.source,
          result.location.confidence
        ];
        
        enrichmentKeys.forEach(key => {
          row.push(result.enrichments[key] || '');
        });
        
        return row.join(',');
      })
    ].join('\n');

    // Create and download file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrichment_results_${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Download single lookup results with detailed POI data
  const downloadSingleLookupResults = (result: EnrichmentResult) => {
    if (!result) return;

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
        result.location.confidence,
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
      if (key.includes('_detailed') && Array.isArray(value)) {
        // Handle detailed POI arrays
        value.forEach((poi: any) => {
          rows.push([
            result.location.name,
            result.location.lat,
            result.location.lon,
            result.location.source,
            result.location.confidence,
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
      } else if (key === 'poi_wikipedia_articles' && Array.isArray(value)) {
        // Handle Wikipedia articles
        value.forEach((article: any) => {
          rows.push([
            result.location.name,
            result.location.lat,
            result.location.lon,
            result.location.source,
            result.location.confidence,
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
    });

    const csvContent = [
      allHeaders.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `single_lookup_results_${result.location.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Results Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={onBackToConfig}
          className="btn btn-outline flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Configuration</span>
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">Location Results</h2>
            <p className="text-sm text-gray-600">{results.length} location{results.length !== 1 ? 's' : ''} processed</p>
          </div>

          <button
            onClick={downloadResults}
            disabled={!results.length}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

             {/* Dynamic Legend for Single Location Results */}
       {results.length === 1 && legendItems.length > 0 && (
         <div className="bg-white border-b border-gray-200 p-3">
           <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
               <Info className="h-4 w-4 text-blue-600" />
               <span className="text-sm font-medium text-gray-700">Map Legend</span>
             </div>
             
             {/* Download Single Lookup Results Button */}
             <button
               onClick={() => downloadSingleLookupResults(results[0])}
               className="btn btn-primary btn-sm flex items-center gap-2 px-3 py-1"
               title="Download all proximity layers and distances for this location"
             >
               <Download className="h-3 w-3" />
               <span className="text-xs">Download Results</span>
             </button>
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
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900">Batch Processing Complete!</h3>
                <p className="text-sm text-green-700">CSV download started automatically</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Results Summary Panel */}
        {results.length > 0 && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Info className="w-4 h-4 text-primary-600" />
                <span>Results Summary</span>
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {results.map((result, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
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
