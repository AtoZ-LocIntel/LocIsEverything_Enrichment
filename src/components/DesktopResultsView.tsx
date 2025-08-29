import React from 'react';
import { Map, Download, ArrowLeft } from 'lucide-react';
import { EnrichmentResult } from '../App';

interface DesktopResultsViewProps {
  results: EnrichmentResult[];
  onViewMap: () => void;
  onBackToSearch: () => void;
  onDownloadCSV: () => void;
}

const DesktopResultsView: React.FC<DesktopResultsViewProps> = ({
  results,
  onViewMap,
  onBackToSearch,
  onDownloadCSV
}) => {
  const formatValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (key.includes('elevation') || key.includes('elev')) {
        return `${value.toLocaleString()} ft`;
      }
      if (key.includes('radius') || key.includes('miles')) {
        return `${value} miles`;
      }
      return value.toLocaleString();
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return 'None found';
      
      // For detailed POI data, show count only in form view
      if (key.includes('_all_pois') || key.includes('_detailed') || key.includes('_elements')) {
        return `${value.length} found (see CSV for details)`;
      }
      
      // Special handling for AVI data - show count only
      if (key.includes('poi_animal_vehicle_collisions_all_pois')) {
        return `${value.length} incidents found (see CSV for details)`;
      }
      
      // Special handling for Wildfire data - show count only
      if (key.includes('poi_wildfires_all_pois') || key.includes('poi_wildfires_detailed') || key.includes('poi_wildfires_elements')) {
        return `${value.length} fires found (see CSV for details)`;
      }
      
      // Regular array handling for non-POI data
      return value.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return item.name || item.title || JSON.stringify(item);
        }
        return String(item);
      }).join('; ');
    }
    
    // Handle objects
    if (typeof value === 'object') {
      if (value.name) return String(value.name);
      if (value.title) return String(value.title);
      if (value.value) return String(value.value);
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  const groupEnrichments = (enrichments: Record<string, any>) => {
    return Object.entries(enrichments).reduce((acc, [key, value]) => {
      // Skip POI "All" fields completely - they should not appear in the form
      // This includes any field that contains detailed POI data
      if (key.includes('_all_pois') || 
          key.includes('_detailed') || 
          key.includes('_elements') ||
          key.endsWith('_all') ||
          key.endsWith(' All') ||
          key.includes('_all') ||
          (key.includes('poi_') && key.includes('_all')) ||
          // Catch specific patterns like "Poi Cafes Coffee All" and "Poi Banks All"
          (key.toLowerCase().includes('poi') && key.toLowerCase().includes('all')) ||
          // Catch any field that ends with "All" regardless of case
          key.toLowerCase().endsWith('all')) {
        return acc;
      }
      
      let category = 'Other';
      
      if (key.includes('elev') || key.includes('elevation')) {
        category = 'Elevation & Terrain';
      } else if (key.includes('airq') || key.includes('air_quality')) {
        category = 'Air Quality';
      } else if (key.includes('fips') || key.includes('census') || key.includes('demographic')) {
        category = 'Demographics & Census';
      } else if (key.includes('poi_') && key.includes('count')) {
        category = 'Points of Interest';
      } else if (key.includes('weather') || key.includes('climate')) {
        category = 'Weather & Climate';
      } else if (key.includes('school') || key.includes('education')) {
        category = 'Education';
      } else if (key.includes('hospital') || key.includes('healthcare')) {
        category = 'Healthcare';
      } else if (key.includes('crime') || key.includes('safety')) {
        category = 'Safety & Crime';
      } else if (key.includes('transport') || key.includes('transit')) {
        category = 'Transportation';
      } else if (key.includes('wildfire') || key.includes('natural_disaster')) {
        category = 'Natural Disasters';
      } else if (key.includes('animal') || key.includes('collision')) {
        category = 'Wildlife & Accidents';
      }

      if (!acc[category]) {
        acc[category] = [];
      }

      acc[category].push({ key, value });
      return acc;
    }, {} as Record<string, Array<{ key: string; value: any }>>);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Action Buttons */}
      <div className="bg-white shadow-lg border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBackToSearch}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Search</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={onViewMap}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
              >
                <Map className="w-5 h-5" />
                <span>View in Map</span>
              </button>
              
              <button
                onClick={onDownloadCSV}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-8 mt-4">
          {results.map((result, index) => {
            const { location, enrichments } = result;
            const groupedEnrichments = groupEnrichments(enrichments);

            return (
              <div key={index} className="space-y-6">
                {/* Location Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-900 mb-3">{location.name}</h1>
                      <div className="text-gray-600 space-y-1">
                        <p>Coordinates: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}</p>
                        <p>Source: {location.source}</p>
                        <p>Confidence: {location.confidence}%</p>
                      </div>
                      
                      {/* Key Summary Values */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                          {enrichments.elevation_ft && (
                            <div className="text-center">
                              <div className="font-semibold text-gray-700">Elevation</div>
                              <div className="text-gray-900">{enrichments.elevation_ft} ft</div>
                            </div>
                          )}
                          {enrichments.open_meteo_weather_description && (
                            <div className="text-center">
                              <div className="font-semibold text-gray-700">Weather</div>
                              <div className="text-gray-900">{enrichments.open_meteo_weather_description}</div>
                            </div>
                          )}
                          {enrichments.nws_alerts_summary && (
                            <div className="text-center">
                              <div className="font-semibold text-gray-700">Alerts</div>
                              <div className="text-gray-900">{enrichments.nws_alerts_summary}</div>
                            </div>
                          )}
                          {enrichments.acs_population && (
                            <div className="text-center">
                              <div className="font-semibold text-gray-700">Population</div>
                              <div className="text-gray-900">{enrichments.acs_population.toLocaleString()}</div>
                            </div>
                          )}
                          {enrichments.acs_name && (
                            <div className="text-center">
                              <div className="font-semibold text-gray-700">Area</div>
                              <div className="text-gray-900">{enrichments.acs_name}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enrichment Data */}
                {Object.entries(groupedEnrichments).map(([category, items]) => (
                  <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl">
                      <h2 className="text-xl font-bold text-white p-4">{category}</h2>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {items.map(({ key, value }) => (
                        <div key={key} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                          <div className="flex flex-col space-y-2">
                            <label className="text-sm font-semibold text-gray-700 capitalize">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </label>
                            <div className="text-gray-900 bg-gray-50 p-3 rounded-lg break-words">
                              {formatValue(value, key)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DesktopResultsView;
