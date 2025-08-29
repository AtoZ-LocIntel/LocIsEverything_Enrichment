import React from 'react';
import { Map, Download, ArrowLeft } from 'lucide-react';
import { EnrichmentResult } from '../App';

interface MobileResultsViewProps {
  result: EnrichmentResult;
  onViewMap: () => void;
  onBackToSearch: () => void;
  onDownloadCSV: () => void;
}

const MobileResultsView: React.FC<MobileResultsViewProps> = ({
  result,
  onViewMap,
  onBackToSearch,
  onDownloadCSV
}) => {
  const { location, enrichments } = result;

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
      
      // For detailed POI data, show count only in mobile form view
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
    if (typeof value === 'object' && value !== null) {
      // Try to extract meaningful information from objects
      if (value.name) return String(value.name);
      if (value.title) return String(value.title);
      if (value.value) return String(value.value);
      
      // For complex objects, show key-value pairs
      const entries = Object.entries(value).slice(0, 3);
      if (entries.length > 0) {
        return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
      }
      
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  const getEnrichmentCategory = (key: string): string => {
    // Geographic Information
    if (key.includes('elevation') || key.includes('fips_') || key.includes('county_') || key.includes('state_') || key.includes('census_') || key.includes('city_') || key.includes('urban_area_') || key.includes('metro_area_') || key.includes('subdivision_')) {
      return 'Geographic Info';
    }
    
    // Political Districts
    if (key.includes('congressional_') || key.includes('state_senate_') || key.includes('state_house_')) {
      return 'Political Districts';
    }
    
    // Demographics
    if (key.includes('acs_')) {
      return 'Demographics';
    }
    
    if (key.includes('poi_fema_flood_zones') || key.includes('poi_wetlands') || key.includes('poi_earthquakes') || key.includes('poi_volcanoes') || key.includes('poi_flood_reference_points') || key.includes('poi_animal_vehicle_collisions') || key.includes('poi_wildfires')) {
      return 'Hazards & Safety';
    }
                if (key.includes('open_meteo_weather')) {
              return 'Weather & Alerts';
            }
            if (key.includes('nws_weather_alerts')) {
              return 'Weather & Alerts';
            }
    if (key.includes('poi_bus') || key.includes('poi_train') || key.includes('poi_subway_metro') || key.includes('poi_tram') || key.includes('poi_monorail') || key.includes('poi_aerialway') || key.includes('poi_ferry') || key.includes('poi_airport_air') || key.includes('poi_taxi') || key.includes('poi_bike_scooter_share') || key.includes('poi_dockless_hub') || key.includes('poi_electric_charging')) {
      return 'Transportation';
    }
    if (key.includes('poi_beaches') || key.includes('poi_lakes_ponds') || key.includes('poi_rivers_streams') || key.includes('poi_mountains_peaks')) {
      return 'Natural Resources';
    }
    if (key.includes('poi_schools') || key.includes('poi_hospitals') || key.includes('poi_parks') || key.includes('poi_grocery') || key.includes('poi_restaurants') || key.includes('poi_banks') || key.includes('poi_pharmacies') || key.includes('poi_worship') || key.includes('poi_doctors_clinics') || key.includes('poi_dentists') || key.includes('poi_gyms') || key.includes('poi_cinemas') || key.includes('poi_theatres') || key.includes('poi_museums_historic') || key.includes('poi_hotels') || key.includes('poi_breweries') || key.includes('poi_gas_stations')) {
      return 'Community & Services';
    }
    if (key.includes('poi_police_stations') || key.includes('poi_fire_stations') || key.includes('poi_urgent_care')) {
      return 'Emergency Services';
    }
    if (key.includes('poi_airports') || key.includes('poi_substations') || key.includes('poi_powerlines') || key.includes('poi_power_plants') || key.includes('poi_railroads') || key.includes('poi_gas') || key.includes('poi_cell_towers')) {
      return 'Infrastructure';
    }
    if (key.includes('poi_epa_') || key.includes('poi_usda_')) {
      return 'Environmental & Regulatory';
    }
    if (key.includes('poi_wikipedia')) {
      return 'Local Knowledge';
    }
    if (key.includes('poi_padus_public_access') || key.includes('poi_padus_protection_status')) {
      return 'Public Lands';
    }
    if (key.includes('poi_epa_power') || key.includes('poi_epa_oil_spill')) {
      return 'Hazards & Safety';
    }
    return 'Other';
  };

  const groupedEnrichments = Object.entries(enrichments).reduce((acc, [key, value]) => {
    // Filter out detailed POI data from mobile form display (same as desktop)
    if (key.includes('_all_pois') ||
        key.includes('_detailed') ||
        key.includes('_elements') ||
        key.endsWith('_all') ||
        key.endsWith(' All') ||
        key.includes('_all') ||
        (key.includes('poi_') && key.includes('_all')) ||
        (key.toLowerCase().includes('poi') && key.toLowerCase().includes('all')) ||
        key.toLowerCase().endsWith('all')) {
      return acc;
    }
    
    const category = getEnrichmentCategory(key);
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key, value });
    return acc;
  }, {} as Record<string, Array<{ key: string; value: any }>>);

  return (
    <div className="min-h-screen bg-gray-50 md:hidden pt-4 mobile-results-container">
      {/* Header with Action Buttons */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 mobile-header">
        <div className="flex items-center justify-between mobile-header-content">
          <button
            onClick={onBackToSearch}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Search</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onViewMap}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Map className="w-4 h-4" />
              <span>View in Map</span>
            </button>
            
            <button
              onClick={onDownloadCSV}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="py-4 space-y-4 mobile-content">
        {/* Location Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mobile-card">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">{location.name}</h1>
            <div className="text-gray-600 space-y-1 text-sm sm:text-base">
              <p className="break-all">Coordinates: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}</p>
              <p className="break-words">Source: {location.source}</p>
              <p>Confidence: {location.confidence}%</p>
            </div>
            
            {/* Key Summary Values */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                {enrichments.elevation_ft && (
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">Elevation</div>
                    <div className="text-gray-900">{enrichments.elevation_ft} ft</div>
                  </div>
                )}
                {enrichments.open_meteo_weather_description && (
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">Weather</div>
                    <div className="text-gray-900 text-xs">{enrichments.open_meteo_weather_description}</div>
                  </div>
                )}
                {enrichments.nws_alerts_summary && (
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">Alerts</div>
                    <div className="text-gray-900 text-xs">{enrichments.nws_alerts_summary}</div>
                  </div>
                )}
                {enrichments.acs_population && (
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">Population</div>
                    <div className="text-gray-900">{enrichments.acs_population.toLocaleString()}</div>
                  </div>
                )}
                {enrichments.acs_name && (
                  <div className="text-center col-span-2">
                    <div className="font-semibold text-gray-700">Area</div>
                    <div className="text-gray-900 text-xs">{enrichments.acs_name}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enrichment Data */}
        {Object.entries(groupedEnrichments).map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 mobile-card">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl mobile-card-header">
              <h2 className="text-lg font-bold text-white">{category}</h2>
            </div>
            
            <div className="space-y-3 mobile-card-body">
              {items.map(({ key, value }) => (
                <div key={key} className="border-b border-gray-100 last:border-b-0 pb-3 sm:pb-4 last:pb-0">
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 capitalize break-words">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <div className="text-gray-900 bg-gray-50 p-2 sm:p-3 rounded-lg text-sm sm:text-base break-words overflow-hidden">
                      {formatValue(value, key)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bottom Action Buttons */}
        <div className="flex flex-col gap-3 pb-8 mobile-buttons">
          <button
            onClick={onViewMap}
            className="flex-1 bg-blue-600 text-white py-3 sm:py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Map className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>View in Map</span>
          </button>
          
          <button
            onClick={onDownloadCSV}
            className="flex-1 bg-green-600 text-white py-3 sm:py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileResultsView;
