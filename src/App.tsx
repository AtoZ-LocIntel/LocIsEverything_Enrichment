import { useState, useEffect } from 'react';
import Header from './components/Header';
import SingleSearch from './components/SingleSearch';
import BatchProcessing from './components/BatchProcessing';
import MapView from './components/MapView';
import MobileResultsView from './components/MobileResultsView';
import DesktopResultsView from './components/DesktopResultsView';
import DataSourcesView from './components/DataSourcesView';
import EnrichmentCategoryView from './components/EnrichmentCategoryView';
import EnrichmentConfig from './components/EnrichmentConfig';
import LoadingModal from './components/LoadingModal';
import { EnrichmentService } from './services/EnrichmentService';
import { GeocodeResult } from './lib/types';

export type ViewMode = 'config' | 'map' | 'mobile-results' | 'desktop-results' | 'data-sources' | 'enrichment-category';

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
  const [activeCategory, setActiveCategory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(true);
      const enrichmentService = new EnrichmentService();
      const result = await enrichmentService.enrichSingleLocation(address, selectedEnrichments, poiRadii);
      setEnrichmentResults([result]);
      
      // On mobile, show mobile results view; on desktop, show desktop results view
      if (isMobile) {
        setViewMode('mobile-results');
      } else {
        setViewMode('desktop-results');
      }
    } catch (error) {
      console.error('Single search failed:', error);
      setError(error instanceof Error ? error.message : 'Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSearch = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
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
    } finally {
      setIsLoading(false);
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
    setIsLoading(false); // Stop loading when batch completes
    
    // For batch processing, always show desktop results view (handles multiple results)
    // Mobile users can still use the desktop results view on mobile devices
    setViewMode('desktop-results');
    
    // Automatically download CSV after batch processing completes
    if (results.length > 0) {
      setTimeout(() => {
        downloadBatchResults(results);
      }, 1000); // Small delay to ensure results are loaded
    }
  };



  const downloadBatchResults = (results: EnrichmentResult[]) => {
    if (!results.length) return;

    // Create individual rows for each POI - similar to downloadSingleLookupResults
    const headers = [
      'Search Address', 'Search Lat', 'Search Lon', 'Search Source', 'Search Confidence',
      'POI Type', 'POI Name', 'POI Lat', 'POI Lon', 'Distance (miles)', 
      'POI Category', 'POI Address', 'POI Phone', 'POI Website', 'POI Source'
    ];
    
    const rows: string[][] = [];
    
    results.forEach(result => {
      console.log(`🔍 Processing result for ${result.location.name}`);
      
      // Add summary row for the search location
      rows.push([
        result.location.name,
        result.location.lat.toString(),
        result.location.lon.toString(),
        result.location.source,
        (result.location.confidence || 'N/A').toString(),
        'SEARCH_LOCATION',
        result.location.name,
        result.location.lat.toString(),
        result.location.lon.toString(),
        '0',
        'SEARCH_LOCATION',
        result.location.name,
        '',
        '',
        result.location.source
      ]);
      
      // Add all POI data as individual rows
      Object.entries(result.enrichments).forEach(([key, value]) => {
        console.log(`🔍 Processing enrichment key: ${key}`, value);
        
        if (key.includes('_all_pois') && Array.isArray(value)) {
          // Handle ALL POI arrays (complete dataset for CSV)
          value.forEach((poi: any) => {
            // Special handling for AVI data
            if (key.includes('animal_vehicle_collisions')) {
              const aviName = `AVI-${poi.case_id || poi.id || 'Unknown'}`;
              const aviType = `${poi.source || 'AVI'} ${poi.year || ''}`.trim();
              rows.push([
                result.location.name,
                result.location.lat.toString(),
                result.location.lon.toString(),
                result.location.source,
                (result.location.confidence || 'N/A').toString(),
                'ANIMAL_VEHICLE_COLLISION',
                aviName,
                poi.lat || '',
                poi.lon || '',
                poi.distance_miles || 'Unknown',
                aviType,
                poi.location || poi.address || '',
                '',
                '',
                poi.source || 'N/A'
              ]);
            } else {
              // Regular POI handling
              rows.push([
                result.location.name,
                result.location.lat.toString(),
                result.location.lon.toString(),
                result.location.source,
                (result.location.confidence || 'N/A').toString(),
                key.replace('_all_pois', '').replace('poi_', '').toUpperCase(),
                poi.name || poi.title || 'Unnamed',
                poi.lat || poi.center?.lat || '',
                poi.lon || poi.center?.lon || '',
                poi.distance_miles || 'Unknown',
                poi.tags?.amenity || poi.tags?.shop || poi.tags?.tourism || 'POI',
                poi.tags?.['addr:street'] || poi.address || poi.tags?.['addr:full'] || '',
                poi.tags?.phone || '',
                poi.tags?.website || '',
                poi.source || 'N/A'
              ]);
            }
          });
        } else if (key === 'poi_wikipedia_articles' && Array.isArray(value)) {
          // Handle Wikipedia articles
          value.forEach((article: any) => {
            rows.push([
              result.location.name,
              result.location.lat.toString(),
              result.location.lon.toString(),
              result.location.source,
              (result.location.confidence || 'N/A').toString(),
              'WIKIPEDIA_ARTICLE',
              article.title || 'Unnamed Article',
              result.location.lat.toString(),
              result.location.lon.toString(),
              '0',
              'WIKIPEDIA',
              '',
              '',
              article.url || '',
              'Wikipedia'
            ]);
          });
        }
      });
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file with timestamp
    const timestamp = new Date().toISOString().slice(0, 10); // Just YYYY-MM-DD
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrichment_results_${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBackToConfig = () => {
    setViewMode('config');
    setError(null);
  };

  const handleViewDataSources = () => {
    setViewMode('data-sources');
  };

  const handleViewEnrichmentCategory = (category: any) => {
    setActiveCategory(category);
    setViewMode('enrichment-category');
  };

  const handleBackToMain = () => {
    setViewMode('config');
  };

  return (
    <div className={`${viewMode === 'map' ? 'h-screen' : 'min-h-screen'} bg-black flex flex-col`}>
      {/* Loading Modal with Jokes */}
      <LoadingModal 
        isVisible={isLoading} 
        enrichmentCount={selectedEnrichments.length} 
      />
      
      {/* Only show header when not in full-screen views and not on mobile */}
      {!['data-sources', 'enrichment-category', 'desktop-results', 'mobile-results'].includes(viewMode) && !isMobile && (
        <Header onViewDataSources={handleViewDataSources} />
      )}
      
      {viewMode === 'config' ? (
        <div className={`${isMobile ? 'pt-8' : 'pt-28'} px-4 sm:px-6 md:px-8`}>
          {/* Main Content - Centered Column Layout */}
          <div className="max-w-2xl mx-auto w-full">

            
            <div className="text-center mb-12 mt-8 sm:mt-16">
              {/* Company Logo - moved from header */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-lg border-2 border-gray-600 flex-shrink-0">
                  <img 
                    src="/assets/lociseverything.png"
                    alt="The Location Is Everything Co Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-gradient mb-4">
                Advanced Location Intelligence
              </h1>
              <p className="text-lg sm:text-xl text-gray-300">
                Professional geocoding and enrichment platform with multi-source data integration. 
                Single address lookup or batch CSV processing with comprehensive location insights.
              </p>
              <p className="text-lg text-primary-400 font-medium mt-4">
                Powered by The Location Is Everything Co
              </p>
            </div>

            {/* Enrichment Options Preview - Single Column Layout */}
            <div className="mb-8 p-4 bg-gradient-to-r from-gray-600 to-gray-900 rounded-xl border-2 border-white shadow-2xl overflow-hidden">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">
                    Available Enrichment Options
                  </h2>
                  <p className="text-blue-200 text-sm">Configure your search to include any combination of these data sources</p>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="bg-gray-500 rounded-lg border border-gray-600 shadow-lg p-4">
                    <h3 className="font-semibold text-white mb-2 text-base">📍 Core Location Data</h3>
                    <ul className="text-white space-y-1 text-sm">
                      <li>• Elevation & Air Quality</li>
                      <li>• Census FIPS Codes</li>
                      <li>• Demographics (Population, Income, Age)</li>
                      <li>• Weather Alerts</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg border border-gray-800 shadow-lg p-4">
                    <h3 className="font-semibold text-white mb-2 text-base">🏢 Points of Interest</h3>
                    <ul className="text-white space-y-1 text-sm">
                      <li>• Schools, Hospitals, Parks, Police & Fire</li>
                      <li>• Retail & Restaurants</li>
                      <li>• Transportation & Infrastructure</li>
                      <li>• Health & Professional Services</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg border border-gray-900 shadow-lg p-4">
                    <h3 className="font-semibold text-white mb-2 text-base">🌍 Specialized Data</h3>
                    <ul className="text-white space-y-1 text-sm">
                      <li>• <span className="text-yellow-300 font-bold">🦌 NEW: Animal-Vehicle Impact (AVI) Data</span> <span className="text-blue-200 text-xs">(FARS + CA CROS, TXDOT, IADOT, ID Fish & Game, NHDOT)</span></li>
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

            <div className="space-y-8 mb-8">
              <div data-section="single-search">
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
                    onLoadingChange={setIsLoading}
                  />
                </div>
              )}
            </div>

            <EnrichmentConfig
              selectedEnrichments={selectedEnrichments}
              onSelectionChange={setSelectedEnrichments}
              poiRadii={poiRadii}
              onPoiRadiiChange={setPoiRadii}
              onViewCategory={handleViewEnrichmentCategory}
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
      ) : viewMode === 'desktop-results' ? (
        <DesktopResultsView
          results={enrichmentResults}
          onViewMap={handleViewMap}
          onBackToSearch={handleBackToSearch}
          onDownloadCSV={handleDownloadCSV}
        />
      ) : viewMode === 'data-sources' ? (
        <DataSourcesView
          onBackToMain={handleBackToMain}
        />
      ) : viewMode === 'enrichment-category' ? (
        <EnrichmentCategoryView
          category={activeCategory}
          selectedEnrichments={selectedEnrichments}
          poiRadii={poiRadii}
          onSelectionChange={setSelectedEnrichments}
          onPoiRadiiChange={setPoiRadii}
          onBackToConfig={handleBackToConfig}
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
