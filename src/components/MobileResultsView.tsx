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
      if (key.includes('poi_') && value.length > 3) {
        return `${value.slice(0, 3).map((item: any) => item.name || item.title || item).join(', ')} +${value.length - 3} more`;
      }
      return value.map((item: any) => item.name || item.title || item).join(', ');
    }
    return String(value);
  };

  const getEnrichmentCategory = (key: string): string => {
    if (key.includes('poi_fema_flood_zones') || key.includes('poi_wetlands') || key.includes('poi_earthquakes') || key.includes('poi_volcanoes') || key.includes('poi_flood_reference_points')) {
      return 'Hazards & Safety';
    }
                if (key.includes('open_meteo_weather')) {
              return 'Weather & Alerts';
            }
            if (key.includes('nws_weather_alerts')) {
              return 'Weather & Alerts';
            }
    if (key.includes('poi_bus') || key.includes('poi_train') || key.includes('poi_subway_metro') || key.includes('poi_tram') || key.includes('poi_monorail') || key.includes('poi_aerialway') || key.includes('poi_ferry') || key.includes('poi_airport_air') || key.includes('poi_taxi') || key.includes('poi_bike_scooter_share') || key.includes('poi_dockless_hub')) {
      return 'Transportation';
    }
    if (key.includes('poi_beaches') || key.includes('poi_lakes_ponds') || key.includes('poi_rivers_streams') || key.includes('poi_mountains_peaks')) {
      return 'Natural Resources';
    }
    if (key.includes('poi_schools') || key.includes('poi_hospitals') || key.includes('poi_parks') || key.includes('poi_grocery') || key.includes('poi_restaurants') || key.includes('poi_banks') || key.includes('poi_pharmacies') || key.includes('poi_worship') || key.includes('poi_doctors_clinics') || key.includes('poi_dentists') || key.includes('poi_gyms') || key.includes('poi_cinemas') || key.includes('poi_theatres') || key.includes('poi_museums_historic') || key.includes('poi_hotels') || key.includes('poi_breweries')) {
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
    return 'Other';
  };

  const groupedEnrichments = Object.entries(enrichments).reduce((acc, [key, value]) => {
    const category = getEnrichmentCategory(key);
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key, value });
    return acc;
  }, {} as Record<string, Array<{ key: string; value: any }>>);

  return (
    <div className="min-h-screen bg-gray-50 md:hidden pt-28">
      {/* Header with Action Buttons */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-28 z-40">
        <div className="flex items-center justify-between p-4">
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
      <div className="p-4 space-y-6">
        {/* Location Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{location.name}</h1>
            <div className="text-gray-600 space-y-1">
              <p>Coordinates: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}</p>
              <p>Source: {location.source}</p>
              <p>Confidence: {location.confidence}%</p>
            </div>
          </div>
        </div>

        {/* Enrichment Data */}
        {Object.entries(groupedEnrichments).map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">{category}</h2>
            </div>
            
            <div className="p-6 space-y-4">
              {items.map(({ key, value }) => (
                <div key={key} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700 capitalize">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {formatValue(value, key)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bottom Action Buttons */}
        <div className="flex space-x-4 pb-8">
          <button
            onClick={onViewMap}
            className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Map className="w-5 h-5" />
            <span>View in Map</span>
          </button>
          
          <button
            onClick={onDownloadCSV}
            className="flex-1 bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileResultsView;
