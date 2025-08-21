import React, { useState } from 'react';
import { MapPin, Globe, BarChart3, X, BookOpen, CheckCircle, Zap, Map, Database, Download, Search, FileText, Building2, Truck } from 'lucide-react';

const Header: React.FC = () => {
  const [showDocs, setShowDocs] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-28">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                {/* Custom Logo - User's actual logo.png with proper spacing */}
                <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg border-2 border-gray-200 flex-shrink-0">
                  <img 
                    src="/assets/logo.png" 
                    alt="The Location Is Everything Co Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-gray-900">The Location Is Everything Co</h1>
                  <p className="text-sm text-gray-500">Enrichment Platform</p>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <MapPin className="w-4 h-4 inline mr-2" />
                Single Search
              </a>
              <a href="#" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Batch Processing
              </a>
              <a href="#" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <Globe className="w-4 h-4 inline mr-2" />
                Data Sources
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowDocs(true)}
                className="btn btn-outline text-sm flex items-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Documentation</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Documentation Modal */}
      {showDocs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                  <span>Platform Features & Documentation</span>
                </h2>
                <button
                  onClick={() => setShowDocs(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Overview */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Platform Overview</h3>
                  <p className="text-gray-600 leading-relaxed">
                    The Location Is Everything Co Enrichment Platform is a professional geocoding and location intelligence solution 
                    that provides comprehensive data enrichment through multi-source integration. Our platform transforms simple 
                    addresses into rich, actionable location insights for businesses, researchers, and developers.
                  </p>
                </div>

                {/* Core Features */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-primary-600" />
                    <span>Core Features</span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                        <Search className="w-4 h-4" />
                        <span>Single Address Search</span>
                      </h4>
                      <p className="text-blue-800 text-sm">
                        Geocode individual addresses with real-time enrichment. Get coordinates, demographics, 
                        environmental data, and nearby points of interest in seconds.
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Batch CSV Processing</span>
                      </h4>
                      <p className="text-green-800 text-sm">
                        Process thousands of addresses simultaneously. Upload CSV files, map columns, 
                        and get enriched results with automatic CSV download.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Geocoding Services */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Map className="w-5 h-5 text-primary-600" />
                    <span>Multi-Source Geocoding</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">OpenStreetMap Nominatim</span>
                      <span className="text-sm text-gray-600">- Global coverage, high accuracy</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">US Census Bureau</span>
                      <span className="text-sm text-gray-600">- Official US address validation</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="font-medium">GeoNames</span>
                      <span className="text-sm text-gray-600">- Geographic database integration</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="font-medium">NYC PLUTO</span>
                      <span className="text-sm text-gray-600">- NYC parcel-level precision</span>
                    </div>
                  </div>
                </div>

                {/* Enrichment Data */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Database className="w-5 h-5 text-primary-600" />
                    <span>Comprehensive Enrichment</span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Core Attributes</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Elevation data (Open-Meteo)</li>
                        <li>• Air quality metrics (PM2.5)</li>
                        <li>• Census FIPS codes & demographics</li>
                        <li>• Weather alerts (National Weather Service)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Points of Interest</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Schools, hospitals, parks</li>
                        <li>• Retail & commercial services</li>
                        <li>• Transportation & infrastructure</li>
                        <li>• Environmental hazards & recreation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Technical Features */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-primary-600" />
                    <span>Technical Features</span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">CORS proxy handling</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">Rate limiting & fallbacks</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">Interactive Leaflet maps</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">CSV export with timestamps</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">Configurable search radii</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">Real-time progress tracking</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Use Cases */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Common Use Cases</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Real Estate</h4>
                      <p className="text-sm text-gray-600">Property valuation, market analysis, neighborhood insights</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Truck className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Logistics</h4>
                      <p className="text-sm text-gray-600">Route optimization, delivery planning, facility location</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Analytics</h4>
                      <p className="text-sm text-gray-600">Demographic analysis, market research, risk assessment</p>
                    </div>
                  </div>
                </div>

                {/* Getting Started */}
                <div className="bg-primary-50 p-6 rounded-lg border border-primary-200">
                  <h3 className="text-xl font-semibold text-primary-900 mb-3">Ready to Get Started?</h3>
                  <p className="text-primary-800 mb-4">
                    Upload a CSV file or search for a single address to experience the power of location enrichment.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button className="btn btn-primary">
                      <Search className="w-4 h-4 mr-2" />
                      Try Single Search
                    </button>
                    <button className="btn btn-outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Upload CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
