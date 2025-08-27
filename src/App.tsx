import { useState, useEffect } from 'react';
import Header from './components/Header';
import SingleSearch from './components/SingleSearch';
import BatchProcessing from './components/BatchProcessing';
import MapView from './components/MapView';
import MobileResultsView from './components/MobileResultsView';
import EnrichmentConfig from './components/EnrichmentConfig';
import { EnrichmentService } from './services/EnrichmentService';
import { GeocodeResult } from './lib/types';

export type ViewMode = 'config' | 'map' | 'mobile-results';

export interface EnrichmentResult {
  location: GeocodeResult;
  enrichments: Record<string, any>;
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('config');
  const [enrichmentResults, setEnrichmentResults] = useState<EnrichmentResult[]>([]);
  const [selectedEnrichments, setSelectedEnrichments] = useState<string[]>(['elev', 'airq', 'fips']);
  const [poiRadii, setPoiRadii] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSingleSearch = async (address: string) => {
    try {
      setError(null);
      const enrichmentService = new EnrichmentService();
      const result = await enrichmentService.enrichSingleLocation(address, selectedEnrichments, poiRadii);
      setEnrichmentResults([result]);
      
      // On mobile, show mobile results view; on desktop, show map
      if (isMobile) {
        setViewMode('mobile-results');
      } else {
        setViewMode('map');
      }
    } catch (error) {
      console.error('Single search failed:', error);
      setError(error instanceof Error ? error.message : 'Search failed. Please try again.');
    }
  };

  const handleLocationSearch = async () => {
    try {
      setError(null);
      
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Create a location string for the enrichment service
      const locationString = `${latitude}, ${longitude}`;
      
      // Use the enrichment service to get data for current location
      const enrichmentService = new EnrichmentService();
      const result = await enrichmentService.enrichSingleLocation(locationString, selectedEnrichments, poiRadii);
      setEnrichmentResults([result]);
      
      // On mobile, show mobile results view; on desktop, show map
      if (isMobile) {
        setViewMode('mobile-results');
      } else {
        setViewMode('map');
      }
    } catch (error) {
      console.error('Location search failed:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        setError('Location request timed out. Please try again or use manual address entry.');
      } else if (error instanceof Error && error.message.includes('denied')) {
        setError('Location access denied. Please enable location services or use manual address entry.');
      } else {
        setError(error instanceof Error ? error.message : 'Location search failed. Please try again or use manual address entry.');
      }
    }
  };

  const handleViewMap = () => {
    setViewMode('map');
  };

  const handleBackToSearch = () => {
    setViewMode('config');
  };

  const handleDownloadCSV = () => {
    if (enrichmentResults.length > 0) {
      downloadBatchResults(enrichmentResults);
    }
  };

  const handleBatchComplete = (results: EnrichmentResult[]) => {
    setEnrichmentResults(results);
    setViewMode('map');
    
    // Automatically download CSV after batch processing completes
    if (results.length > 0) {
      setTimeout(() => {
        downloadBatchResults(results);
      }, 1000); // Small delay to ensure map is loaded
    }
  };

  const formatCSVValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '';
      
      // Special handling for detailed POI arrays
      if (key.includes('_all_pois') || key.includes('_detailed') || key.includes('_elements')) {
        return value.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            const parts = [];
            if (item.name) parts.push(item.name);
            if (item.source) parts.push(`(${item.source})`);
            if (item.distance_miles) parts.push(`${item.distance_miles}mi`);
            return parts.join(' ');
          }
          return String(item);
        }).join('; ');
      }
      
      // Regular array handling
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

  const downloadBatchResults = (results: EnrichmentResult[]) => {
    if (!results.length) return;

    // Convert results to CSV format
    const headers = ['Address', 'Latitude', 'Longitude', 'Source', 'Confidence'];
    const enrichmentKeys = new Set<string>();
    
    results.forEach(result => {
      Object.keys(result.enrichments).forEach(key => enrichmentKeys.add(key));
    });

    // Add special Wikipedia article columns
    if (enrichmentKeys.has('poi_wikipedia_articles')) {
      enrichmentKeys.add('poi_wikipedia_top_articles');
      enrichmentKeys.add('poi_wikipedia_categories');
    }

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
          let value = result.enrichments[key] || '';
          
          // Special handling for Wikipedia POI data
          if (key === 'poi_wikipedia_top_articles') {
            const articles = result.enrichments.poi_wikipedia_articles;
            if (Array.isArray(articles) && articles.length > 0) {
              const topArticles = articles.slice(0, 3).map((a: any) => a.title).join('; ');
              value = topArticles;
            }
          } else if (key === 'poi_wikipedia_categories') {
            const articles = result.enrichments.poi_wikipedia_articles;
            if (Array.isArray(articles) && articles.length > 0) {
              const allCategories = new Set<string>();
              articles.forEach((a: any) => {
                if (Array.isArray(a.categories)) {
                  a.categories.forEach((c: string) => allCategories.add(c));
                }
              });
              value = Array.from(allCategories).join('; ');
            }
          } else if (key === 'poi_animal_vehicle_collisions_count') {
            // Special handling for AVI data - include source information
            const aviData = result.enrichments.poi_animal_vehicle_collisions_all_pois;
            if (Array.isArray(aviData) && aviData.length > 0) {
              const sources = [...new Set(aviData.map((c: any) => c.source || 'Unknown'))];
              const years = [...new Set(aviData.map((c: any) => c.crash_year || 'Unknown'))];
              value = `${value} (Sources: ${sources.join(', ')}, Years: ${years.join(', ')})`;
            }
          } else if (key === 'poi_animal_vehicle_collisions_source') {
            // Include AVI source field directly
            value = value || 'FARS, CA CROS, TXDOT, IADOT, ID Fish & Game, NHDOT';
          } else if (key === 'poi_wildfires_count') {
            // Special handling for Wildfire data - include incident details
            const wildfireData = result.enrichments.poi_wildfires_all_pois;
            if (Array.isArray(wildfireData) && wildfireData.length > 0) {
              const incidents = wildfireData.slice(0, 3).map((fire: any) => 
                `${fire.name || 'Unnamed'} (${fire.containment || 0}% contained)`
              );
              if (wildfireData.length > 3) {
                incidents.push(`+${wildfireData.length - 3} more`);
              }
              value = `${value} (${incidents.join(', ')})`;
            }
          } else {
            // Generic handling for complex data types
            value = formatCSVValue(value, key);
          }
          
          row.push(value);
        });
        
        return row.join(',');
      })
    ].join('\n');

    // Create and download file with timestamp
    const timestamp = new Date().toISOString().slice(0, 10); // Just YYYY-MM-DD
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBackToConfig = () => {
    setViewMode('config');
    setError(null);
  };

  return (
    <div className={`${viewMode === 'map' ? 'h-screen' : 'min-h-screen'} bg-black flex flex-col`}>
      <Header />
      
      {viewMode === 'config' ? (
        <div className="pt-28 px-2 sm:px-4 md:px-6 lg:px-8">
          {/* Main Content */}
          <div className="max-w-7xl mx-auto w-full" style={{ maxWidth: isMobile ? 'calc(100vw - 16px)' : '', margin: isMobile ? '0 8px' : 'auto' }}>
            {/* Mobile Instructions */}
            {isMobile && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-blue-800 font-medium">
                  📱 <strong>Mobile Optimized:</strong> Enter an address below to get instant enrichment results
                </p>
              </div>
            )}
            
            <div className="text-center mb-12 mt-16">
              <h1 className="text-4xl font-bold text-gradient mb-4">
                Advanced Location Intelligence
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Professional geocoding and enrichment platform with multi-source data integration. 
                Single address lookup or batch CSV processing with comprehensive location insights.
              </p>
              <p className="text-lg text-primary-400 font-medium mt-4">
                Powered by The Location Is Everything Co
              </p>
            </div>

            {/* Enrichment Options Preview */}
            <div className="mb-8 p-3 md:p-4 lg:p-6 bg-gradient-to-r from-gray-600 to-gray-900 rounded-xl border-2 border-white shadow-2xl overflow-hidden">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center space-x-4 mx-auto">
                    <img src="/assets/new-logo.png" alt="The Location Is Everything Co" className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
                    <span>Available Enrichment Options</span>
                  </h2>
                  <p className="text-blue-200">Configure your search to include any combination of these data sources</p>
                </div>
                
                <div className={`${isMobile ? 'flex flex-col space-y-3 px-2' : 'grid grid-cols-1 md:grid-cols-3 gap-4'} text-sm`}>
                  <div className={`bg-gray-500 rounded-lg border border-gray-600 shadow-lg ${isMobile ? 'p-2 mx-1' : 'p-3 md:p-4'}`}>
                    <h3 className={`font-semibold text-white mb-2 ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>📍 Core Location Data</h3>
                    <ul className={`text-white space-y-1 ${isMobile ? 'text-xs' : 'text-xs md:text-sm'}`}>
                      <li>• Elevation & Air Quality</li>
                      <li>• Census FIPS Codes</li>
                      <li>• Demographics (Population, Income, Age)</li>
                      <li>• Weather Alerts</li>
                    </ul>
                  </div>
                  
                  <div className={`bg-gray-700 rounded-lg border border-gray-800 shadow-lg ${isMobile ? 'p-2 mx-1' : 'p-3 md:p-4'}`}>
                    <h3 className={`font-semibold text-white mb-2 ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>🏢 Points of Interest</h3>
                    <ul className={`text-white space-y-1 ${isMobile ? 'text-xs' : 'text-xs md:text-sm'}`}>
                      <li>• Schools, Hospitals, Parks, Police & Fire</li>
                      <li>• Retail & Restaurants</li>
                      <li>• Transportation & Infrastructure</li>
                      <li>• Health & Professional Services</li>
                    </ul>
                  </div>
                  
                  <div className={`bg-gray-800 rounded-lg border border-gray-900 shadow-lg ${isMobile ? 'p-2 mx-1' : 'p-3 md:p-4'}`}>
                    <h3 className={`font-semibold text-white mb-2 ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>🌍 Specialized Data</h3>
                    <ul className={`text-white space-y-1 ${isMobile ? 'text-xs' : 'text-xs md:text-sm'}`}>
                      <li>• <span className="text-yellow-300 font-bold">🦌 NEW: Animal-Vehicle Impact (AVI) Data</span> <span className={`text-blue-200 ${isMobile ? 'text-xs' : 'text-xs md:text-sm'}`}>(FARS + CA CROS, TXDOT, IADOT, ID Fish & Game, NHDOT)</span></li>
                      <li>• Environmental Hazards</li>
                      <li>• Power Plants & Cell Towers</li>
                      <li>• Breweries & Enhanced Wikipedia (haunted sites, oddities, museums)</li>
                      <li>• Recreation & Entertainment (Golf, Boating, Cinemas)</li>
                      <li>• Public Lands & Protected Areas (PAD-US)</li>
                    </ul>
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-white text-sm">
                    💡 <strong>Scroll down</strong> to see the full configuration panel with all options and customizable search radii
                  </p>
                </div>
              </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-red-800 rounded-full flex items-center justify-center">
                    <span className="text-red-300 text-sm">!</span>
                  </div>
                  <p className="text-red-200 font-medium">Search Error</p>
                </div>
                <p className="text-red-300 mt-2">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-red-400 hover:text-red-200 underline text-sm"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8 mb-8 mobile-stack">
              <div data-section="single-search" className={isMobile ? "lg:col-span-2" : ""}>
                <SingleSearch 
                  onSearch={handleSingleSearch} 
                  onLocationSearch={handleLocationSearch}
                  isMobile={isMobile}
                />
              </div>
              {!isMobile && (
                <div data-section="batch-processing">
                  <BatchProcessing 
                    onComplete={handleBatchComplete} 
                    selectedEnrichments={selectedEnrichments}
                    poiRadii={poiRadii}
                  />
                </div>
              )}
            </div>

            <EnrichmentConfig
              selectedEnrichments={selectedEnrichments}
              onSelectionChange={setSelectedEnrichments}
              poiRadii={poiRadii}
              onPoiRadiiChange={setPoiRadii}
            />
          </div>
        </div>
      ) : viewMode === 'mobile-results' ? (
        <MobileResultsView
          result={enrichmentResults[0]}
          onViewMap={handleViewMap}
          onBackToSearch={handleBackToSearch}
          onDownloadCSV={handleDownloadCSV}
        />
      ) : (
        <div className="flex-1">
          <MapView
            results={enrichmentResults}
            onBackToConfig={handleBackToConfig}
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  );
}

export default App;
