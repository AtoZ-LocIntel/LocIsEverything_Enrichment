import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, MapPin, Info, CheckCircle } from 'lucide-react';
import { EnrichmentResult } from '../App';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  results: EnrichmentResult[];
  onBackToConfig: () => void;
}

// Fix for Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView: React.FC<MapViewProps> = ({ results, onBackToConfig }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [showBatchSuccess, setShowBatchSuccess] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [39.8283, -98.5795], // Center of USA
      zoom: 4,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
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

    // Add markers for each result
    const bounds = L.latLngBounds([]);
    let firstMarker: L.Marker | null = null;
    
    results.forEach((result, index) => {
      const { lat, lon } = result.location;
      
      if (lat && lon) {
        const marker = L.marker([lat, lon])
          .bindPopup(createPopupContent(result))
          .addTo(map);
        
        markersRef.current.push(marker);
        bounds.extend([lat, lon]);
        
        // Store reference to first marker to auto-open its popup
        if (index === 0) {
          firstMarker = marker;
        }
      }
    });

    // Fit map to show all markers with padding
    if (bounds.isValid()) {
      map.fitBounds(bounds, { 
        padding: [20, 20],
        maxZoom: 16 // Prevent zooming in too far for single points
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
        
        // Handle other POI types
        Object.entries(poiEnrichments).forEach(([key, value]) => {
          if (key === 'poi_wikipedia_articles' || key === 'poi_wikipedia_by_category' || key === 'poi_wikipedia_summary') {
            return; // Skip these as they're handled above
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
