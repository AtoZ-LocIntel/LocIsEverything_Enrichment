import React from 'react';
import { Download, ArrowLeft } from 'lucide-react';
import { EnrichmentResult } from '../App';

interface MobileResultsViewProps {
  result: EnrichmentResult;
  selectedEnrichments: string[];
  onBackToSearch: () => void;
  onDownloadCSV: () => void;
}

const MobileResultsView: React.FC<MobileResultsViewProps> = ({
  result,
  selectedEnrichments,
  onBackToSearch,
  onDownloadCSV
}) => {
  const { location, enrichments } = result;

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
      
      // For detailed POI data, show count only in mobile form view
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
    
    // Handle USDA Wildfire Risk data
    if (key === 'usda_wildfire_hazard_potential') {
      return `Class ${value} of 5`;
    }
    if (key === 'usda_wildfire_hazard_potential_label') {
      return value || 'Unknown Risk Level';
    }
    if (key === 'usda_burn_probability') {
      return value ? value.toFixed(6) : '0.000000';
    }
    if (key === 'usda_burn_probability_percentage') {
      return value ? `${value.toFixed(3)}%` : '0.000%';
    }
    if (key === 'usda_conditional_flame_length') {
      return value ? `${value.toFixed(1)} feet` : 'N/A';
    }
    if (key === 'usda_conditional_flame_length_label') {
      return value || 'Unknown Flame Category';
    }
    if (key === 'usda_risk_to_structures' || key === 'usda_conditional_risk_to_structures') {
      return value ? `Risk Score: ${value}` : 'N/A';
    }
    if (key === 'usda_exposure_type') {
      return `Type ${value}`;
    }
    if (key === 'usda_exposure_type_label') {
      return value || 'Unknown Exposure';
    }
    if (key === 'usda_wildfire_risk_source') {
      return value || 'USDA Forest Service';
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
    
    if (key.includes('wildfire') || key.includes('usda_') || key.includes('poi_fema_flood_zones') || key.includes('poi_wetlands') || key.includes('poi_earthquakes') || key.includes('poi_volcanoes') || key.includes('poi_flood_reference_points') || key.includes('poi_wildfires') || key.includes('poi_animal_vehicle_collisions') || (key.includes('poi_') && key.includes('count') && key.includes('wildfire'))) {
      return 'Natural Hazards';
    }
    
    if (key.includes('poi_epa_')) {
      return 'Human Caused Hazards';
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
    if (key.includes('poi_schools') || key.includes('poi_hospitals') || key.includes('poi_parks') || key.includes('poi_worship') || key.includes('poi_community_centres') || key.includes('poi_town_halls') || key.includes('poi_courthouses') || key.includes('poi_post_offices') || key.includes('poi_parcel_lockers') || key.includes('poi_colleges') || key.includes('poi_childcare') || key.includes('poi_mail_shipping')) {
      return 'Community & Services';
    }
    if (key.includes('poi_grocery') || key.includes('poi_restaurants') || key.includes('poi_banks') || key.includes('poi_pharmacies') || key.includes('poi_convenience') || key.includes('poi_hardware') || key.includes('poi_liquor') || key.includes('poi_bakery') || key.includes('poi_butcher') || key.includes('poi_seafood') || key.includes('poi_sporting') || key.includes('poi_bookstore') || key.includes('poi_clothing') || key.includes('poi_shoes') || key.includes('poi_thrift') || key.includes('poi_pet') || key.includes('poi_florist') || key.includes('poi_variety') || key.includes('poi_gas_stations') || key.includes('poi_car_wash') || key.includes('poi_auto_repair') || key.includes('poi_auto_parts') || key.includes('poi_auto_dealers')) {
      return 'Retail & Commerce';
    }
    if (key.includes('poi_doctors_clinics') || key.includes('poi_dentists') || key.includes('poi_gyms') || key.includes('poi_chiropractor') || key.includes('poi_optometry') || key.includes('poi_veterinary') || key.includes('poi_hospitals') || key.includes('poi_police_stations') || key.includes('poi_fire_stations') || key.includes('poi_urgent_care')) {
      return 'Health & Wellness';
    }
    if (key.includes('poi_cinemas') || key.includes('poi_theatres') || key.includes('poi_museums_historic') || key.includes('poi_hotels') || key.includes('poi_breweries') || key.includes('poi_bowling') || key.includes('poi_arcade') || key.includes('poi_rv_park') || key.includes('poi_campground') || key.includes('poi_wikipedia')) {
      return 'Recreation & Leisure';
    }
    if (key.includes('poi_substations') || key.includes('poi_powerlines') || key.includes('poi_power_plants') || key.includes('poi_cell_towers') || key.includes('poi_grid')) {
      return 'Power & Infrastructure';
    }
    if (key.includes('poi_airports') || key.includes('poi_railroads') || key.includes('poi_gas')) {
      return 'Transportation';
    }
    if (key.includes('at_')) {
      return 'Appalachian Trail';
    }
    
    // Catch-all for POI counts that don't fit other categories
    if (key.includes('poi_') && key.includes('count')) {
      return 'Points of Interest Nearby';
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
        key.includes('_features') ||
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

  // Sort categories to prioritize those containing selected enrichments
  const sortedCategories = Object.entries(groupedEnrichments).sort(([categoryA, itemsA], [categoryB, itemsB]) => {
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
        <div className="bg-black rounded-xl shadow-sm border border-gray-200 mobile-card">
          <div className="p-4">
            <div className="flex items-center space-x-4 mb-3">
              {/* Logo */}
              <div className="flex-shrink-0">
                <img 
                  src="/assets/lociseverything.webp"
                  alt="The Location Is Everything Co Logo" 
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              {/* Location Info */}
              <div className="flex-1 text-center">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 break-words">{location.name}</h1>
                <div className="text-gray-300 space-y-1 text-sm sm:text-base">
                  <p className="break-all">Coordinates: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}</p>
                  <p className="break-words">Source: {location.source}</p>
                  <p>Confidence: {location.confidence}%</p>
                </div>
              </div>
            </div>
            
            {/* Key Summary Values */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="grid grid-cols-2 gap-3 text-base sm:text-base">
                {enrichments.elevation_ft && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Elevation</div>
                    <div className="text-white font-bold text-base sm:text-base">{enrichments.elevation_ft} ft</div>
                  </div>
                )}
                {enrichments.open_meteo_weather_description && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Weather</div>
                    <div className="text-white font-bold text-sm sm:text-sm">{enrichments.open_meteo_weather_description}</div>
                  </div>
                )}
                {enrichments.open_meteo_weather_summary && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Weather Summary</div>
                    <div className="text-white font-bold text-sm sm:text-sm">{enrichments.open_meteo_weather_summary}</div>
                  </div>
                )}
                {enrichments.nws_alerts_summary && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Alerts</div>
                    <div className="text-white font-bold text-sm sm:text-sm">{enrichments.nws_alerts_summary}</div>
                  </div>
                )}
                {enrichments.acs_population && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Population</div>
                    <div className="text-white font-bold text-base sm:text-base">{enrichments.acs_population.toLocaleString()}</div>
                  </div>
                )}
                {enrichments.acs_name && (
                  <div className="text-center col-span-2">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Area</div>
                    <div className="text-white font-bold text-sm sm:text-sm">{enrichments.acs_name}</div>
                  </div>
                )}
                {enrichments.terrain_slope && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Slope</div>
                    <div className="text-white font-bold text-base sm:text-base">{enrichments.terrain_slope}°</div>
                  </div>
                )}
                {enrichments.terrain_slope_direction && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Aspect</div>
                    <div className="text-white font-bold text-base sm:text-base">{enrichments.terrain_slope_direction}</div>
                  </div>
                )}
                {enrichments.open_meteo_weather_timezone_abbreviation && (
                  <div className="text-center">
                    <div className="font-bold text-gray-300 text-sm sm:text-sm">Timezone</div>
                    <div className="text-white font-bold text-base sm:text-base">{enrichments.open_meteo_weather_timezone_abbreviation}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enrichment Data */}
        {sortedCategories.map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 mobile-card">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl mobile-card-header">
              <h2 className="text-lg font-bold text-white">{category}</h2>
            </div>
            
            <div className="space-y-3 mobile-card-body">
              {items.map(({ key, value }) => (
                <div key={key} className="border-b border-gray-100 last:border-b-0 pb-3 sm:pb-4 last:pb-0">
                  <div className="flex flex-col space-y-2">
                    <label className="text-base sm:text-base font-bold text-gray-700 capitalize break-words">
                      {formatFieldName(key)}
                    </label>
                    <div className="text-gray-900 bg-gray-50 p-2 sm:p-3 rounded-lg text-lg sm:text-lg font-bold break-words overflow-hidden">
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
            onClick={onBackToSearch}
            className="flex-1 bg-gray-600 text-white py-3 sm:py-4 rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back to Search</span>
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
