import React, { useState } from 'react';
import { MapPin, Globe, BarChart3, X, BookOpen, CheckCircle, Zap, Map, Database, Search, FileText, Building2, Truck, Clock, RefreshCw, Bus, Heart } from 'lucide-react';
import AddSourceForm from './AddSourceForm';
import DonateModal from './DonateModal';

interface HeaderProps {
  onViewDataSources?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onViewDataSources }) => {
  const [showDocs, setShowDocs] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [showDonate, setShowDonate] = useState(false);

  const handleResetApp = () => {
    console.log('🔄 Starting comprehensive app reset...');
    
    // Clear all cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        console.log('🗑️ Clearing caches:', names);
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('🗑️ Cleared localStorage and sessionStorage');
    
    // Clear any service worker registrations
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('🗑️ Unregistering service workers:', registrations.length);
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    
    // Clear IndexedDB if available
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            console.log('🗑️ Deleting IndexedDB:', db.name);
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }
    
    // Clear any fetch cache
    if ('fetch' in window) {
      // Force fetch to not use cache by modifying the global fetch
      const originalFetch = window.fetch;
      window.fetch = (input, init) => {
        const newInit: RequestInit = {
          ...init,
          cache: 'no-cache' as RequestCache,
          headers: {
            ...init?.headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        };
        return originalFetch(input, newInit);
      };
    }
    
    // Add cache-busting parameter to force reload
    const timestamp = Date.now();
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_cb', timestamp.toString());
    
    console.log('🔄 Reloading app with cache busting...');
    
    // Force a complete page reload with cache busting
    window.location.href = currentUrl.toString();
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 w-full z-50" style={{ width: '100vw', maxWidth: '100vw' }}>
        <div className="w-full px-0 sm:px-6 lg:px-8" style={{ width: '100vw', maxWidth: '100vw' }}>
          <div className="flex justify-between items-center h-28 px-4 sm:px-0" style={{ width: '100%' }}>
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                {/* Custom Logo - User's new 3D logo with metallic ring and glowing map pin */}
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-lg border-2 border-gray-300 flex-shrink-0">
                  <img 
                    src="/assets/lociseverything.webp"
                    alt="The Location Is Everything Co Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Enrichment Platform Text */}
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold text-black">Location Enrichment Platform</h1>
                  <p className="text-sm text-gray-600">Location Intelligence & Data Enrichment</p>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => {
                  const element = document.querySelector('[data-section="single-search"]');
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="text-gray-600 hover:text-black px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                Single Search
              </button>
              <button 
                onClick={() => {
                  const element = document.querySelector('[data-section="batch-processing"]');
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="text-gray-600 hover:text-black px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Batch Processing
              </button>
              <button 
                onClick={onViewDataSources}
                className="text-gray-600 hover:text-black px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
              >
                <Globe className="w-4 h-4 inline mr-2" />
                Data Sources
              </button>
              <button 
                onClick={() => setShowAddSource(true)}
                className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border border-blue-600 hover:border-blue-700"
              >
                <span className="mr-2">➕</span>
                ADD A SOURCE
              </button>
              <button 
                onClick={() => setShowDonate(true)}
                className="text-red-600 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border border-red-600 hover:border-red-700 flex items-center"
              >
                <Heart className="w-4 h-4 mr-2" />
                Donate
              </button>
            </nav>

            <div className="flex items-center space-x-4 sm:space-x-6">
              <button 
                onClick={() => setShowDocs(true)}
                className="btn btn-outline text-sm flex items-center space-x-2 hidden md:flex text-gray-700 border-gray-400 hover:text-black hover:border-gray-600"
              >
                <BookOpen className="w-4 h-4" />
                <span>Documentation</span>
              </button>
              <button 
                onClick={handleResetApp}
                className="btn btn-outline text-sm flex items-center space-x-2 hidden md:flex text-gray-700 border-gray-400 hover:text-black hover:border-gray-600"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset App</span>
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
                  <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-8 h-8" />
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
                        <li>• Community & commercial services</li>
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

                {/* Rate Limits & Performance */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <span>Rate Limits & Performance</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-900 mb-3">⚠️ Important: Free API Rate Limits</h4>
                      <div className="space-y-3 text-sm text-yellow-800">
                        <div className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium">Nominatim (OpenStreetMap):</span>
                            <p className="text-xs mt-1">• 1 request per second • Global coverage • High accuracy</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium">US Census Bureau:</span>
                            <p className="text-xs mt-1">• 10 requests per second • US addresses only • Official validation</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium">GeoNames:</span>
                            <p className="text-xs mt-1">• 4 requests per second • Geographic database • Global coverage</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">Batch Processing Times</h4>
                        <div className="text-sm text-blue-800 space-y-1">
                          <div>• <strong>1-100 addresses:</strong> 1-2 minutes</div>
                          <div>• <strong>100-500 addresses:</strong> 2-8 minutes</div>
                          <div>• <strong>500-1000 addresses:</strong> 8-20 minutes</div>
                          <div>• <strong>1000+ addresses:</strong> 20+ minutes</div>
                        </div>
                        <p className="text-xs text-blue-700 mt-2">
                          💡 Processing time includes rate limiting delays to respect API limits
                        </p>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2">Performance Features</h4>
                        <div className="text-sm text-green-800 space-y-1">
                          <div>• <strong>Automatic fallbacks</strong> between geocoders</div>
                          <div>• <strong>Progress tracking</strong> with time estimates</div>
                          <div>• <strong>Rate limit compliance</strong> built-in</div>
                          <div>• <strong>Error handling</strong> for failed addresses</div>
                        </div>
                        <p className="text-xs text-green-700 mt-2">
                          ✅ Large batches are fully supported with clear expectations
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Best Practices for Large Batches</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>• <strong>Start with small batches</strong> to test your data format</div>
                        <div>• <strong>Use consistent address formatting</strong> for better geocoding success</div>
                        <div>• <strong>Process during off-peak hours</strong> for better API response times</div>
                        <div>• <strong>Monitor progress</strong> - you can safely leave the page during processing</div>
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
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setShowDocs(false);
                        // Scroll to single search section
                        setTimeout(() => {
                          const singleSearchSection = document.querySelector('#single-search-section');
                          if (singleSearchSection) {
                            singleSearchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Try Single Search
                    </button>
                    <button 
                      className="btn btn-outline"
                      onClick={() => {
                        setShowDocs(false);
                        // Scroll to batch processing section
                        setTimeout(() => {
                          const batchSection = document.querySelector('#batch-processing-section');
                          if (batchSection) {
                            batchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                    >
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

      {/* Data Sources Modal - Now handled by full-screen view */}
      {false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-8 h-8" />
                  <span>Data Sources & Usage Information</span>
                </h2>
                <button
                  onClick={() => {}}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Geocoding Services */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Map className="w-5 h-5 text-primary-600" />
                    <span>Geocoding Services</span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Nominatim (OpenStreetMap)</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div>• <strong>Coverage:</strong> Global</div>
                        <div>• <strong>Rate Limit:</strong> 1 request/second</div>
                        <div>• <strong>Use Case:</strong> International addresses, open data</div>
                        <div>• <strong>Accuracy:</strong> Community-maintained, varies by region</div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">US Census Geocoder</h4>
                      <div className="text-sm text-green-800 space-y-1">
                        <div>• <strong>Coverage:</strong> United States only</div>
                        <div>• <strong>Rate Limit:</strong> 10 requests/second</div>
                        <div>• <strong>Use Case:</strong> US addresses, official validation</div>
                        <div>• <strong>Accuracy:</strong> High for US addresses</div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-2">GeoNames</h4>
                      <div className="text-sm text-purple-800 space-y-1">
                        <div>• <strong>Coverage:</strong> Geographic features worldwide</div>
                        <div>• <strong>Rate Limit:</strong> 4 requests/second</div>
                        <div>• <strong>Use Case:</strong> Place names, geographic entities</div>
                        <div>• <strong>Accuracy:</strong> Excellent for geographic features</div>
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-semibold text-orange-900 mb-2">PLUTO NYC</h4>
                      <div className="text-sm text-orange-800 space-y-1">
                        <div>• <strong>Coverage:</strong> New York City only</div>
                        <div>• <strong>Rate Limit:</strong> No limit</div>
                        <div>• <strong>Use Case:</strong> NYC parcel-level precision</div>
                        <div>• <strong>Accuracy:</strong> Highest for NYC addresses</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enrichment Data Sources */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Database className="w-5 h-5 text-primary-600" />
                    <span>Enrichment Data Sources</span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <h4 className="font-semibold text-indigo-900 mb-2">Environmental & Hazards</h4>
                      <div className="text-sm text-indigo-800 space-y-1">
                        <div>• <strong>Elevation:</strong> Open-Meteo elevation API (converted to feet)</div>
                        <div>• <strong>Air Quality:</strong> EPA air quality monitoring (PM2.5)</div>
                        <div>• <strong>Weather Alerts:</strong> National Weather Service active alerts</div>
                        <div>• <strong>Flood Zones:</strong> FEMA National Flood Hazard Layer (NFHL)</div>
                        <div>• <strong>Wetlands:</strong> USGS National Wetlands Inventory (NWI)</div>
                        <div>• <strong>Earthquakes:</strong> USGS FDSNWS Historical Event Query</div>
                        <div>• <strong>Volcanoes:</strong> USGS Volcano Status & Location API</div>
                        <div>• <strong>Flood Reference Points:</strong> USGS RTFI Real-time Flooding API</div>
                        <div>• <strong>EPA FRS:</strong> Brownfields, Superfund, RCRA, TRI, NPDES</div>
                        <div>• <strong>EPA FRS:</strong> Air facilities, radiation, power generation, oil spill</div>
                      </div>
                    </div>
                    
                    {/* NEW: The Location Is Everything Company AVI Data */}
                    <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300 shadow-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">🦌</span>
                        <h4 className="font-bold text-red-900 text-lg">NEW: Animal-Vehicle Impact (AVI) Data</h4>
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">EXCLUSIVE</span>
                      </div>
                      <div className="text-sm text-red-800 space-y-1">
                        <div>• <strong>Provider:</strong> The Location Is Everything Company</div>
                        <div>• <strong>Coverage:</strong> Nationwide FARS + CA CROS, TXDOT, IADOT, ID Fish and Game, NHDOT</div>
                        <div>• <strong>Data Type:</strong> Animal-vehicle collision records</div>
                        <div>• <strong>Availability:</strong> First time ever available to the public</div>
                        <div>• <strong>Expansion:</strong> More states coming in 2025</div>
                        <div>• <strong>Use Cases:</strong> Safety analysis, risk assessment, insurance</div>
                      </div>
                      <div className="mt-3 p-2 bg-red-100 rounded border border-red-200">
                        <p className="text-xs text-red-700 font-semibold">
                          🎯 <strong>Industry First:</strong> The only platform offering comprehensive AVI data from official sources
                        </p>
                      </div>
                    </div>

                    {/* NEW: NIFC/Esri Current Wildfires */}
                    <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300 shadow-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">🔥</span>
                        <h4 className="font-bold text-orange-900 text-lg">NEW: Current Wildfire Incidents</h4>
                        <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full font-bold">LIVE</span>
                      </div>
                      <div className="text-sm text-orange-800 space-y-1">
                        <div>• <strong>Provider:</strong> NIFC (National Interagency Fire Center) / Esri</div>
                        <div>• <strong>Coverage:</strong> Current wildfire incidents and perimeters nationwide</div>
                        <div>• <strong>Data Type:</strong> Active fire incidents with containment status</div>
                        <div>• <strong>Updates:</strong> Frequently updated from IRWIN and NIFC sources</div>
                        <div>• <strong>Details:</strong> Fire name, location, containment %, discovery date, size</div>
                        <div>• <strong>Use Cases:</strong> Emergency planning, risk assessment, property evaluation</div>
                      </div>
                      <div className="mt-3 p-2 bg-orange-100 rounded border border-orange-200">
                        <p className="text-xs text-orange-700 font-semibold">
                          🔥 <strong>Real-time Data:</strong> Current wildfire incidents from authoritative sources
                        </p>
                      </div>
                    </div>

                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                      <h4 className="font-semibold text-teal-900 mb-2">Demographic & Census</h4>
                      <div className="text-sm text-teal-800 space-y-1">
                        <div>• <strong>Population:</strong> US Census ACS 5-year estimates</div>
                        <div>• <strong>Income:</strong> Median household income data</div>
                        <div>• <strong>Age:</strong> Median age statistics</div>
                        <div>• <strong>Geography:</strong> FIPS codes for state/county/tract</div>
                        <div>• <strong>Census Blocks:</strong> Detailed geographic boundaries</div>
                      </div>
                    </div>
                    <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                      <h4 className="font-semibold text-pink-900 mb-2">Points of Interest (OSM)</h4>
                      <div className="text-sm text-pink-800 space-y-1">
                        <div>• <strong>Education:</strong> Schools, universities, libraries</div>
                        <div>• <strong>Healthcare:</strong> Hospitals, clinics, pharmacies</div>
                        <div>• <strong>Transportation:</strong> Comprehensive transit coverage</div>
                        <div>• <strong>Infrastructure:</strong> Power plants, substations, cell towers</div>
                        <div>• <strong>Emergency:</strong> Police stations, fire stations</div>
                        <div>• <strong>Recreation:</strong> Parks, golf courses, cinemas, theatres</div>
                        <div>• <strong>Community:</strong> Restaurants, cafes, banks, gas stations</div>
                        <div>• <strong>Natural Resources:</strong> Beaches, lakes, rivers, mountains, peaks</div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-900 mb-2">Specialized & Local</h4>
                      <div className="text-sm text-yellow-800 space-y-1">
                        <div>• <strong>Wikipedia:</strong> Nearby points of interest articles</div>
                        <div>• <strong>USDA Local Food:</strong> Farmers markets, CSAs, agritourism</div>
                        <div>• <strong>USDA Local Food:</strong> Food hubs, on-farm markets</div>
                        <div>• <strong>Breweries:</strong> Craft brewery locations</div>
                        <div>• <strong>Hotels:</strong> Accommodation facilities</div>
                        <div>• <strong>Powerlines:</strong> Electrical transmission infrastructure</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comprehensive Transportation Details */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Bus className="w-5 h-5 text-primary-600" />
                    <span>Comprehensive Transportation Coverage</span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Public Transit & Rail</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div>• <strong>Bus:</strong> Bus stops & bus stations</div>
                        <div>• <strong>Train:</strong> Train stations, halts & platforms</div>
                        <div>• <strong>Subway/Metro:</strong> Subway stations & entrances</div>
                        <div>• <strong>Tram:</strong> Tram stops & platforms</div>
                        <div>• <strong>Monorail:</strong> Monorail stations & platforms</div>
                        <div>• <strong>Aerialway:</strong> Gondolas, cable cars & chair lifts</div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Air, Water & Modern Transit</h4>
                      <div className="text-sm text-green-800 space-y-1">
                        <div>• <strong>Ferry:</strong> Ferry terminals & ferry routes</div>
                        <div>• <strong>Airport/Air:</strong> Air terminals, gates & platforms</div>
                        <div>• <strong>Taxi:</strong> Taxi services & stands</div>
                        <div>• <strong>Bike/Scooter Share:</strong> Rental services</div>
                        <div>• <strong>Dockless Hub:</strong> Modern mobility solutions</div>
                        <div>• <strong>Coverage:</strong> Global via OpenStreetMap data</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Natural Resources Details */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <span className="text-2xl">🏔️</span>
                    <span>Natural Resources & Geographic Features</span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Water Features</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div>• <strong>Beaches:</strong> Natural beaches & coastal areas</div>
                        <div>• <strong>Lakes & Ponds:</strong> Water bodies & reservoirs</div>
                        <div>• <strong>Rivers & Streams:</strong> Waterways & brooks</div>
                        <div>• <strong>Coverage:</strong> Global via OpenStreetMap data</div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Terrain & Elevation</h4>
                      <div className="text-sm text-green-800 space-y-1">
                        <div>• <strong>Mountains & Peaks:</strong> High elevation features</div>
                        <div>• <strong>Elevation Data:</strong> Peak heights when available</div>
                        <div>• <strong>Named Features:</strong> Identified peaks & mountains</div>
                        <div>• <strong>Proximity:</strong> Configurable search radii</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Source Details */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Search className="w-5 h-5 text-primary-600" />
                    <span>Data Source Details & APIs</span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Government & Official Sources</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div>• <strong>FEMA NFHL:</strong> National Flood Hazard Layer REST API</div>
                        <div>• <strong>USGS Wetlands:</strong> National Wetlands Inventory (NWI) MapServer</div>
                        <div>• <strong>USGS Earthquakes:</strong> FDSNWS Event Query Service</div>
                        <div>• <strong>USGS Volcanoes:</strong> Volcano Status & Location API</div>
                        <div>• <strong>EPA FRS:</strong> Facility Registry Service REST API</div>
                        <div>• <strong>US Census:</strong> American Community Survey & TIGER/Line</div>
                        <div>• <strong>USDA:</strong> Local Food Portal API (5 categories)</div>
                        <div>• <strong>Open-Meteo:</strong> Real-time weather conditions (default for all lookups)</div>
                        <div>• <strong>NWS:</strong> National Weather Service alerts (default for all lookups)</div>
                        <div>• <strong>USGS:</strong> Geographic names & elevation data</div>
                        <div>• <strong>LocationFriend:</strong> Animal-Vehicle Impact (AVI) data API</div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Open Data & Community</h4>
                      <div className="text-sm text-green-800 space-y-1">
                        <div>• <strong>OpenStreetMap:</strong> Overpass API for POI data (including gas stations, transportation, natural resources)</div>
                        <div>• <strong>Wikipedia:</strong> MediaWiki Geosearch API</div>
                        <div>• <strong>Open-Meteo:</strong> Free elevation & weather APIs</div>
                        <div>• <strong>Nominatim:</strong> OSM geocoding service</div>
                        <div>• <strong>GeoNames:</strong> Geographic database</div>
                        <div>• <strong>PLUTO NYC:</strong> NYC parcel data</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coverage & Capabilities */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                    <span>Coverage & Capabilities</span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-2">Geographic Coverage</h4>
                      <div className="text-sm text-purple-800 space-y-1">
                        <div>• <strong>Global:</strong> Wikipedia, OSM, elevation, weather</div>
                        <div>• <strong>United States:</strong> Census, FEMA, EPA, USDA, NWS</div>
                        <div>• <strong>Regional:</strong> PLUTO NYC, state-specific data</div>
                        <div>• <strong>Proximity:</strong> Configurable search radii (max 25 miles for hazards)</div>
                        <div>• <strong>Bounding Box:</strong> Efficient spatial queries for POIs</div>
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-semibold text-orange-900 mb-2">Data Types & Formats</h4>
                      <div className="text-sm text-orange-800 space-y-1">
                        <div>• <strong>Vector Data:</strong> Points, lines, polygons from OSM</div>
                        <div>• <strong>Raster Data:</strong> Elevation, flood zones</div>
                        <div>• <strong>Tabular Data:</strong> Demographics, facility information</div>
                        <div>• <strong>Real-time:</strong> Current weather conditions (default), weather alerts (default), air quality</div>
                        <div>• <strong>Export Formats:</strong> CSV, GeoJSON, interactive maps</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Quality & Usage */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Quality & Best Practices</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Data Accuracy & Coverage</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>• <strong>Geocoding:</strong> 95%+ success rate for valid addresses</div>
                        <div>• <strong>Enrichment:</strong> 50+ data layers from official sources</div>
                        <div>• <strong>Coverage:</strong> Global with US specializations</div>
                        <div>• <strong>POI Data:</strong> 36+ categories via OpenStreetMap</div>
                        <div>• <strong>Transportation:</strong> 11 comprehensive transit layers</div>
                        <div>• <strong>Natural Resources:</strong> 4 geographic feature layers</div>
                        <div>• <strong>Hazards:</strong> FEMA flood zones, USGS wetlands, earthquakes, volcanoes, flood reference points, NWS weather alerts + 9 EPA FRS layers + <strong>Animal-Vehicle Impact (AVI) data</strong></div>
                        <div>• <strong>Weather:</strong> Open-Meteo real-time conditions + NWS alerts (both default)</div>
                        <div>• <strong>Local Food:</strong> 5 USDA categories for community data</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Usage Guidelines & Features</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>• <strong>Rate Limits:</strong> Built-in compliance with all APIs</div>
                        <div>• <strong>Proximity Search:</strong> Configurable radii (5-25 miles for hazards)</div>
                        <div>• <strong>Export Options:</strong> CSV, interactive maps, GeoJSON</div>
                        <div>• <strong>Mobile Friendly:</strong> Responsive design for all devices</div>
                        <div>• <strong>Real-time Data:</strong> Weather, air quality, alerts</div>
                        <div>• <strong>Batch Processing:</strong> Handle large datasets efficiently</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add A Source Modal */}
      {showAddSource && (
        <AddSourceForm onClose={() => setShowAddSource(false)} />
      )}

      {/* Donate Modal */}
      {showDonate && (
        <DonateModal onClose={() => setShowDonate(false)} />
      )}
    </>
  );
};

export default Header;