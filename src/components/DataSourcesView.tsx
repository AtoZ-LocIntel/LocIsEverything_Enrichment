import React from 'react';
import { ArrowLeft, Globe, Database, CheckCircle, ExternalLink } from 'lucide-react';

interface DataSourcesViewProps {
  onBackToMain: () => void;
}

const DataSourcesView: React.FC<DataSourcesViewProps> = ({ onBackToMain }) => {
  const dataSources = [
    {
      category: "Geocoding Services",
      sources: [
        {
          name: "Nominatim (OpenStreetMap)",
          description: "Open-source geocoding service providing worldwide address and location data",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "GeoNames",
          description: "Geographic database covering all countries with administrative divisions",
          coverage: "Global",
          accuracy: "High",
          cost: "Free (with limits)"
        },
        {
          name: "Postcodes.io",
          description: "UK postcode lookup service with detailed geographic information",
          coverage: "United Kingdom",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Environmental Data",
      sources: [
        {
          name: "USGS Elevation Data",
          description: "Digital elevation models and terrain data for elevation analysis",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "Air Quality Index (AQI)",
          description: "Real-time air quality measurements and pollution levels",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "Weather Alerts",
          description: "National Weather Service alerts and warnings",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Demographic & Census Data",
      sources: [
        {
          name: "US Census Bureau",
          description: "Population, income, age demographics, and FIPS codes",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "American Community Survey",
          description: "Detailed demographic and economic characteristics",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Points of Interest (POI)",
      sources: [
        {
          name: "OpenStreetMap POIs",
          description: "Community-contributed points of interest including businesses, amenities, and landmarks",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free"
        },
        {
          name: "Google Places API",
          description: "Comprehensive business listings and place information",
          coverage: "Global",
          accuracy: "Very High",
          cost: "Paid"
        },
        {
          name: "Foursquare Places",
          description: "Detailed venue information with categories and ratings",
          coverage: "Global",
          accuracy: "High",
          cost: "Paid"
        }
      ]
    },
    {
      category: "Hazards & Safety",
      sources: [
        {
          name: "FEMA Flood Zones",
          description: "National Flood Hazard Layer with flood zone classifications",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "USGS Earthquakes",
          description: "Historical earthquake events and seismic activity",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "USGS Volcanoes",
          description: "Active and dormant volcano locations and status",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "Wildfire Data",
          description: "Current wildfire incidents and fire perimeters",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Environmental Hazards",
      sources: [
        {
          name: "EPA Superfund Sites",
          description: "Hazardous waste sites including National Priorities List locations",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA Brownfields",
          description: "Assessment, Cleanup and Redevelopment Exchange System sites",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA TRI Facilities",
          description: "Toxics Release Inventory facilities reporting chemical releases",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA Air Facilities",
          description: "Air Facility System - stationary sources of air pollution",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white shadow-lg border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBackToMain}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Main</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <Globe className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Data Sources & APIs</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-8 mt-4">
          {dataSources.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl">
                <h2 className="text-xl font-bold text-white p-4 flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>{category.category}</span>
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                {category.sources.map((source, sourceIndex) => (
                  <div key={sourceIndex} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{source.name}</h3>
                        <p className="text-gray-600 mb-3">{source.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Coverage:</span>
                            <p className="text-gray-600">{source.coverage}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Accuracy:</span>
                            <p className="text-gray-600">{source.accuracy}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Cost:</span>
                            <p className="text-gray-600">{source.cost}</p>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">Available</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Additional Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center space-x-2">
              <ExternalLink className="w-5 h-5" />
              <span>Data Usage & Attribution</span>
            </h3>
            <div className="text-blue-800 space-y-2">
              <p>• All data sources are used in compliance with their respective terms of service</p>
              <p>• Free data sources are prioritized to minimize costs for users</p>
              <p>• Paid APIs are used only when free alternatives are not available</p>
              <p>• Data is cached and rate-limited to respect API quotas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSourcesView;
