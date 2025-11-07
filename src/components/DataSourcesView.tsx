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
          name: "US Census Bureau Geocoding",
          description: "Official US address validation and geocoding with high precision",
          coverage: "United States",
          accuracy: "Very High",
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
          name: "NYC PLUTO",
          description: "NYC parcel-level precision geocoding for New York City addresses",
          coverage: "New York City",
          accuracy: "Very High",
          cost: "Free"
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
          name: "Open-Meteo Elevation API",
          description: "Global elevation data with high precision, converted to feet for US users",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "Open-Meteo Weather API",
          description: "Current weather conditions, forecasts, and historical weather data",
          coverage: "Global",
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
          name: "National Weather Service Alerts",
          description: "Active weather alerts, warnings, and advisories",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "EPA Walkability Index",
          description: "Neighborhood walkability scores based on street connectivity, population density, and land use mix",
          coverage: "United States",
          accuracy: "High",
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
          name: "OpenStreetMap Overpass API",
          description: "Community-contributed points of interest including businesses, amenities, and landmarks",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free"
        },
        {
          name: "USDA Local Food Portal",
          description: "Farmers markets, CSA programs, agritourism, food hubs, and on-farm markets",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "OpenChargeMap API",
          description: "Electric vehicle charging stations and infrastructure",
          coverage: "Global",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "USGS Trail and National Map",
          description: "Hiking trailheads, trails, and outdoor recreation data",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "Wikipedia API",
          description: "Haunted sites, historic oddities, museums, and quirky landmarks",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free"
        }
      ]
    },
    {
      category: "Natural Hazards",
      sources: [
        {
          name: "WFIGS Current Wildfires",
          description: "Wildland Fire Interagency Geospatial Services - current wildfire incidents, perimeters, and containment status",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "USDA Wildfire Hazard Potential",
          description: "USDA Forest Service - Composite wildfire risk index (1-5: Very Low to Very High) with automatic proximity search",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "USDA Burn Probability",
          description: "USDA Forest Service - Annual probability of wildfire occurrence (0-1 scale) with automatic proximity search",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "USDA Conditional Flame Length",
          description: "USDA Forest Service - Expected flame length if fire occurs (feet) with automatic proximity search",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "USDA Risk to Potential Structures",
          description: "USDA Forest Service - Structure exposure risk assessment with automatic proximity search",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "USDA Housing Unit Risk",
          description: "USDA Forest Service - Housing unit count, density, exposure, impact, and risk assessments",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "USDA Population Count",
          description: "USDA Forest Service - Population count and density data for wildfire risk assessment",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        },
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
          name: "USGS Wetlands",
          description: "National Wetlands Inventory - wetland types and locations",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "USGS Flood Reference Points",
          description: "Real-time flooding reference points and actively flooding locations",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Human Caused Hazards",
      sources: [
        {
          name: "Animal-Vehicle Impact (AVI)",
          description: "The Location Is Everything Company data - Live API from LocationFriend with collision records for CA, TX, ID, IA, NH, and FARS",
          coverage: "United States (CA, TX, ID, IA, NH)",
          accuracy: "High",
          cost: "Paid"
        },
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
        },
        {
          name: "EPA RCRA Facilities",
          description: "Resource Conservation and Recovery Act - hazardous waste generators, treaters, storers, transporters, and disposers",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA NPDES Permits",
          description: "National Pollutant Discharge Elimination System - permitted wastewater discharge facilities",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA Radiation Facilities",
          description: "RADINFO - facilities dealing with radioactivity or radiation",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA Power Generation",
          description: "EGRID/EIA-860 - power plant and generation facilities",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "EPA Oil Spill Response",
          description: "SPCC/FRP - countermeasure and facility response plan subject facilities",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Infrastructure & Utilities",
      sources: [
        {
          name: "OpenEI Power Plants",
          description: "Electric power generation facilities and energy infrastructure",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        },
        {
          name: "OpenStreetMap Infrastructure",
          description: "Electrical substations, powerlines, and cellular communication towers",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free"
        }
      ]
    },
    {
      category: "Recreation & Entertainment",
      sources: [
        {
          name: "OpenStreetMap Recreation",
          description: "Cinemas, theatres, museums, historic sites, hotels, golf courses, boat ramps, and nightlife venues",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free"
        }
      ]
    },
    {
      category: "Natural Resources & Geography",
      sources: [
        {
          name: "OpenStreetMap Natural Features",
          description: "Beaches, lakes, ponds, rivers, streams, mountains, and peaks",
          coverage: "Global",
          accuracy: "Variable",
          cost: "Free"
        },
        {
          name: "US Fish and Wildlife Service (FWS)",
          description: "Endangered/threatened species, critical habitat, wildlife refuges, wetlands, marine mammals, migratory birds, and fish hatcheries within proximity",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Public Lands & Protected Areas",
      sources: [
        {
          name: "USGS PAD-US Database",
          description: "Protected Areas Database - public land boundaries, manager info, access status, and protection levels",
          coverage: "United States",
          accuracy: "Very High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Specialized & Quirky Data",
      sources: [
        {
          name: "Craft Brewery Database",
          description: "Craft breweries with names, types, addresses, and contact information",
          coverage: "United States",
          accuracy: "High",
          cost: "Free"
        }
      ]
    },
    {
      category: "Trail & Recreation Data",
      sources: [
        {
          name: "Appalachian Trail (AT) Features",
          description: "AT facilities including bridges, campsites, parking, shelters, water sources, and trail features via ArcGIS services",
          coverage: "Appalachian Trail Corridor",
          accuracy: "Very High",
          cost: "Free"
        },
        {
          name: "Pacific Crest Trail (PCT) Features",
          description: "PCT centerline, sheriff offices, side trails, mile markers, and resupply towns via ArcGIS services",
          coverage: "Pacific Crest Trail Corridor",
          accuracy: "Very High",
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
