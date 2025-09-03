import React from 'react';
import { Map, Download, ArrowLeft } from 'lucide-react';
import { EnrichmentResult } from '../App';

interface DesktopResultsViewProps {
  results: EnrichmentResult[];
  selectedEnrichments: string[];
  onViewMap: () => void;
  onBackToSearch: () => void;
  onDownloadCSV: () => void;
}

const DesktopResultsView: React.FC<DesktopResultsViewProps> = ({
  results,
  selectedEnrichments,
  onViewMap,
  onBackToSearch,
  onDownloadCSV
}) => {
  const formatFieldName = (key: string): string => {
    return key
      .replace(/^poi_/g, 'POI ')
      .replace(/^at_/g, 'AT ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

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
      if (key.includes('_all_pois') || key.includes('_detailed') || key.includes('_elements') || key.includes('_features')) {
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
    const grouped = Object.entries(enrichments).reduce((acc, [key, value]) => {
      // Skip POI "All" fields completely - they should not appear in the form
      // This includes any field that contains detailed POI data
      if (key.includes('_all_pois') || 
          key.includes('_detailed') || 
          key.includes('_elements') ||
          key.includes('_features') ||
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
      } else if (key.includes('poi_') && key.includes('count') && !key.includes('wildfire')) {
        category = 'Points of Interest Nearby';
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
      } else if (key.includes('wildfire') || key.includes('usda_') || key.includes('poi_fema_flood_zones') || key.includes('poi_wetlands') || key.includes('poi_earthquakes') || key.includes('poi_volcanoes') || key.includes('poi_flood_reference_points') || key.includes('poi_animal_vehicle_collisions') || (key.includes('poi_') && key.includes('count') && key.includes('wildfire'))) {
        category = 'Natural Hazards';
      } else if (key.includes('poi_epa_')) {
        category = 'Human Caused Hazards';
      } else if (key.includes('at_')) {
        category = 'Appalachian Trail';
      } else if (key.includes('poi_') && (key.includes('grocery') || key.includes('restaurant') || key.includes('bank') || key.includes('pharmacy') || key.includes('convenience') || key.includes('hardware') || key.includes('liquor') || key.includes('bakery') || key.includes('butcher') || key.includes('seafood') || key.includes('sporting') || key.includes('bookstore') || key.includes('clothing') || key.includes('shoes') || key.includes('thrift') || key.includes('pet') || key.includes('florist') || key.includes('variety') || key.includes('gas_stations') || key.includes('car_wash') || key.includes('auto_repair') || key.includes('auto_parts') || key.includes('auto_dealers'))) {
        category = 'Retail & Commerce';
      } else if (key.includes('poi_') && (key.includes('gym') || key.includes('dentist') || key.includes('doctor') || key.includes('chiropractor') || key.includes('optometry') || key.includes('veterinary') || key.includes('hospital') || key.includes('police_stations') || key.includes('fire_stations') || key.includes('urgent_care'))) {
        category = 'Health & Wellness';
      } else if (key.includes('poi_') && (key.includes('park') || key.includes('trail') || key.includes('recreation') || key.includes('bowling') || key.includes('arcade') || key.includes('cinema') || key.includes('theatre') || key.includes('hotel') || key.includes('rv_park') || key.includes('campground') || key.includes('wikipedia') || key.includes('brewery'))) {
        category = 'Recreation & Leisure';
      } else if (key.includes('poi_') && (key.includes('power') || key.includes('substation') || key.includes('grid') || key.includes('cell_tower'))) {
        category = 'Power & Infrastructure';
      } else if (key.includes('poi_') && (key.includes('beach') || key.includes('mountain') || key.includes('lake') || key.includes('water'))) {
        category = 'Natural Resources';
      } else if (key.includes('poi_') && (key.includes('national_park') || key.includes('state_park') || key.includes('wildlife') || key.includes('trailhead') || key.includes('picnic') || key.includes('visitor_center') || key.includes('ranger_station'))) {
        category = 'Public Lands & Protected Areas';
      } else if (key.includes('poi_') && (key.includes('school') || key.includes('college') || key.includes('childcare') || key.includes('community_centre') || key.includes('town_hall') || key.includes('courthouse') || key.includes('post_office') || key.includes('parcel_locker') || key.includes('worship'))) {
        category = 'Community & Services';
      }

      if (!acc[category]) {
        acc[category] = [];
      }

      acc[category].push({ key, value });
      return acc;
    }, {} as Record<string, Array<{ key: string; value: any }>>);

    // Sort categories to prioritize those containing selected enrichments
    const sortedEntries = Object.entries(grouped).sort(([categoryA, itemsA], [categoryB, itemsB]) => {
      // Check if category contains any selected enrichments
      const hasSelectedA = itemsA.some(item => 
        selectedEnrichments.some(selected => 
          item.key.includes(selected) || item.key.startsWith(selected + '_')
        )
      );
      const hasSelectedB = itemsB.some(item => 
        selectedEnrichments.some(selected => 
          item.key.includes(selected) || item.key.startsWith(selected + '_')
        )
      );
      
      // Categories with selected enrichments come first
      if (hasSelectedA && !hasSelectedB) return -1;
      if (!hasSelectedA && hasSelectedB) return 1;
      
      // Within each group, maintain alphabetical order
      return categoryA.localeCompare(categoryB);
    });

    // Convert back to object with sorted order
    return Object.fromEntries(sortedEntries);
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
                <div className="bg-black rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-center space-x-6">
                      {/* Logo */}
                      <div className="flex-shrink-0">
                        <img 
                          src="/assets/lociseverything.webp"
                          alt="The Location Is Everything Co Logo" 
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </div>
                      {/* Location Info */}
                      <div className="flex-1 text-center">
                        <h1 className="text-2xl font-bold text-white mb-3">{location.name}</h1>
                        <div className="text-gray-300 space-y-1">
                          <p>Coordinates: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}</p>
                          <p>Source: {location.source}</p>
                          <p>Confidence: {location.confidence}%</p>
                        </div>
                      </div>
                    </div>
                      
                      {/* Key Summary Values */}
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-base">
                          {enrichments.elevation_ft && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Elevation</div>
                              <div className="text-white font-bold text-lg">{enrichments.elevation_ft} ft</div>
                            </div>
                          )}
                          {enrichments.open_meteo_weather_description && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Weather</div>
                              <div className="text-white font-bold text-lg">{enrichments.open_meteo_weather_description}</div>
                            </div>
                          )}
                          {enrichments.open_meteo_weather_summary && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Weather Summary</div>
                              <div className="text-white font-bold text-lg">{enrichments.open_meteo_weather_summary}</div>
                            </div>
                          )}
                          {enrichments.nws_alerts_summary && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Alerts</div>
                              <div className="text-white font-bold text-lg">{enrichments.nws_alerts_summary}</div>
                            </div>
                          )}
                          {enrichments.acs_population && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Population</div>
                              <div className="text-white font-bold text-lg">{enrichments.acs_population.toLocaleString()}</div>
                            </div>
                          )}
                          {enrichments.acs_name && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Area</div>
                              <div className="text-white font-bold text-lg">{enrichments.acs_name}</div>
                            </div>
                          )}
                          {enrichments.terrain_slope && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Slope</div>
                              <div className="text-white font-bold text-lg">{enrichments.terrain_slope}°</div>
                            </div>
                          )}
                          {enrichments.terrain_slope_direction && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Aspect</div>
                              <div className="text-white font-bold text-lg">{enrichments.terrain_slope_direction}</div>
                            </div>
                          )}
                          {enrichments.open_meteo_weather_timezone_abbreviation && (
                            <div className="text-center">
                              <div className="font-bold text-gray-300 text-sm">Timezone</div>
                              <div className="text-white font-bold text-lg">{enrichments.open_meteo_weather_timezone_abbreviation}</div>
                            </div>
                          )}
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
                            <label className="text-base font-bold text-gray-700 capitalize">
                              {formatFieldName(key)}
                            </label>
                            <div className="text-gray-900 bg-gray-50 p-3 rounded-lg text-base font-bold break-words">
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
        
        {/* Bottom Action Buttons */}
        <div className="bg-white border-t border-gray-200 sticky bottom-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-center space-x-4">
              <button
                onClick={onBackToSearch}
                className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold shadow-md"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Search</span>
              </button>
              
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
    </div>
  );
};

export default DesktopResultsView;
