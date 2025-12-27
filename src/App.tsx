import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

import Header from './components/Header';
import SingleSearch from './components/SingleSearch';
import BatchProcessing from './components/BatchProcessing';
import MapView from './components/MapView';
import MobileResultsView from './components/MobileResultsView';
import DesktopResultsView from './components/DesktopResultsView';
import DataSourcesView from './components/DataSourcesView';
import EnrichmentCategoryView from './components/EnrichmentCategoryView';
import EnrichmentCategoryPage from './components/EnrichmentCategoryPage';
import EnrichmentConfig from './components/EnrichmentConfig';
import ProTipsPage from './components/ProTipsPage';
import DataSourcesPage from './components/DataSourcesPage';
import MapPage from './components/MapPage';
import { exportEnrichmentResultsToCSV } from './utils/csvExport';
import LoadingModal from './components/LoadingModal';
import DonateModal from './components/DonateModal';
import { EnrichmentService } from './services/EnrichmentService';
import { GeocodeResult } from './lib/types';
import { Heart } from 'lucide-react';

export type ViewMode = 'config' | 'map' | 'mobile-results' | 'desktop-results' | 'data-sources' | 'enrichment-category' | 'pro-tips';

export interface EnrichmentResult {
  location: GeocodeResult;
  enrichments: Record<string, any>;
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('config');
  const [enrichmentResults, setEnrichmentResults] = useState<EnrichmentResult[]>([]);
  const [selectedEnrichments, setSelectedEnrichments] = useState<string[]>(['elev', 'airq', 'fips']);
  const [poiRadii, setPoiRadii] = useState<Record<string, number>>({});
  const [poiYears, setPoiYears] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeCategory, setActiveCategory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0);
  const [previousViewMode, setPreviousViewMode] = useState<ViewMode | null>(null);
  const [searchInput, setSearchInput] = useState<string>('3050 Coast Rd, Santa Cruz, CA 95060');
  const [showDonate, setShowDonate] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [totalLayersCount, setTotalLayersCount] = useState(0);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle Stripe checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const canceled = params.get('canceled');
    const sessionId = params.get('session_id');

    if (success === 'true' && sessionId) {
      // Show success message
      alert('Thank you for your donation! Your payment was successful.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled === 'true') {
      // Show cancel message (optional)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSingleSearch = async (address: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const enrichmentService = new EnrichmentService();
      const result = await enrichmentService.enrichSingleLocation(address, selectedEnrichments, poiRadii, poiYears);
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
      
      // On mobile, show mobile results view; on desktop, show desktop results view
      if (isMobile) {
        setViewMode('mobile-results');
      } else {
        setViewMode('desktop-results');
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
    // Save the current view mode before switching to map
    setPreviousViewMode(viewMode);
    setViewMode('map');
  };

  const handleBackToSearch = () => {
    setViewMode('config');
    // Scroll to top of homepage after a brief delay to ensure the view has rendered
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleDownloadCSV = () => {
    if (enrichmentResults.length > 0) {
      exportEnrichmentResultsToCSV(enrichmentResults);
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
        exportEnrichmentResultsToCSV(results);
      }, 1000); // Small delay to ensure results are loaded
    }
  };




  const handleBackToConfig = () => {
    // If we have a previous view mode (came from results), go back to it
    // Otherwise, go to config (home)
    const targetViewMode = previousViewMode || 'config';
    const isComingFromCategory = viewMode === 'enrichment-category';
    setViewMode(targetViewMode);
    setPreviousViewMode(null); // Clear the previous view mode
    setError(null);
    // If coming from category page, scroll to top for better UX (user typically wants to search next)
    // Otherwise, restore scroll position after a brief delay to ensure the view has rendered
    setTimeout(() => {
      if (isComingFromCategory) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo(0, savedScrollPosition);
      }
    }, 100);
  };


  const handleViewDataSources = () => {
    setViewMode('data-sources');
  };

  const handleViewProTips = () => {
    setViewMode('pro-tips');
    // Scroll to top immediately when opening Pro Tips page
    // Use setTimeout to ensure it happens after view mode change
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  };

  const handleViewMapForBasemaps = () => {
    // Navigate to map view with US centered for basemap exploration
    // Clear any existing results so map centers on US
    setEnrichmentResults([]);
    setViewMode('map');
    setPreviousViewMode('config');
  };

  const handleViewEnrichmentCategory = (category: any) => {
    // Save current scroll position before navigating to category view
    setSavedScrollPosition(window.pageYOffset || document.documentElement.scrollTop);
    setActiveCategory(category);
    setViewMode('enrichment-category');
  };

  const handleBackToMain = () => {
    setViewMode('config');
    // Restore scroll position after a brief delay to ensure the view has rendered
    setTimeout(() => {
      window.scrollTo(0, savedScrollPosition);
    }, 100);
  };

  return (
    <div className={`${viewMode === 'map' ? 'h-screen' : 'min-h-screen'} bg-black flex flex-col`}>
      {/* Loading Modal with Jokes */}
      <LoadingModal 
        isVisible={isLoading} 
        enrichmentCount={selectedEnrichments.length} 
      />
      
      {/* Only show header when not in full-screen views and not on mobile */}
      {!['data-sources', 'enrichment-category', 'desktop-results', 'mobile-results', 'map'].includes(viewMode) && !isMobile && (
        <Header onViewDataSources={handleViewDataSources} />
      )}
      
      {viewMode === 'config' ? (
        <div className={`${isMobile ? 'pt-8' : 'pt-28'} px-2 sm:px-4 md:px-6 main-container`}>
          {/* Main Content - Centered Column Layout */}
          <div className="max-w-2xl mx-auto w-full main-content">

            
            <div className="text-center mb-8 mt-4 sm:mt-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
                KNOW YOUR LOCATION
              </h1>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-3">
                Open Location Intelligence built on Open Data
              </h2>
              
              {/* Dynamic Layer Count Badge */}
              {totalLayersCount > 0 && (
                <div className="inline-flex items-center justify-center px-4 py-2 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                  <span className="text-white font-bold text-lg sm:text-xl mr-2">📊</span>
                  <span className="text-white font-semibold text-sm sm:text-base">
                    <span className="font-bold text-lg sm:text-xl">{totalLayersCount.toLocaleString()}</span> Open Data Layers Available
                  </span>
                  <span className="ml-2 text-white text-xs opacity-90 flex flex-col items-center justify-center">
                    <span className="italic opacity-75 text-center">and</span>
                    <span className="flex items-center justify-center">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                      <span className="italic">growing</span>
                    </span>
                  </span>
                </div>
              )}
              
              <p className="text-lg sm:text-xl text-gray-300">
                Comprehensive location and address enrichment platform using open data sources in real-time and on-demand.
              </p>
              <p className="text-lg text-primary-400 font-medium mt-4">
                Powered by The Location Is Everything Co
              </p>
              <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                📱 Mobile optimized for location intelligence reports • 💻 Full analytical capabilities with interactive maps and batch processing available on desktop
              </p>
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

            {/* Hide search UI when category modal is open */}
            {!isCategoryModalOpen && (
            <div className="space-y-8 mb-8">
              <div id="single-search-section" data-section="single-search">
                <SingleSearch 
                  onSearch={handleSingleSearch} 
                  onLocationSearch={handleLocationSearch}
                  searchInput={searchInput}
                  onSearchInputChange={setSearchInput}
                  onViewProTips={isMobile ? handleViewProTips : undefined}
                  onViewMap={!isMobile ? handleViewMapForBasemaps : undefined}
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
            )}

            <EnrichmentConfig
              selectedEnrichments={selectedEnrichments}
              onSelectionChange={setSelectedEnrichments}
              poiRadii={poiRadii}
              onPoiRadiiChange={setPoiRadii}
              poiYears={poiYears}
              onPoiYearsChange={setPoiYears}
              onViewCategory={handleViewEnrichmentCategory}
              onModalStateChange={setIsCategoryModalOpen}
              onTotalLayersChange={setTotalLayersCount}
            />

            {/* Mobile Donate Button - Only visible on mobile at bottom of page */}
            {isMobile && (
              <div className="mt-8 mb-6 flex justify-center">
                <button
                  onClick={() => setShowDonate(true)}
                  className="w-full max-w-sm px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-3 font-semibold text-lg border-2 border-red-500 hover:border-red-400"
                >
                  <Heart className="w-5 h-5" />
                  <span>Support Our Platform</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'mobile-results' ? (
        <MobileResultsView
          result={enrichmentResults[0]}
          selectedEnrichments={selectedEnrichments}
          onBackToSearch={handleBackToSearch}
          onDownloadCSV={handleDownloadCSV}
          onViewMap={handleViewMap}
        />
      ) : viewMode === 'desktop-results' ? (
        <DesktopResultsView
          results={enrichmentResults}
          selectedEnrichments={selectedEnrichments}
          onViewMap={handleViewMap}
          onBackToSearch={handleBackToSearch}
          onDownloadCSV={handleDownloadCSV}
        />
      ) : viewMode === 'data-sources' ? (
        isMobile ? (
          <DataSourcesPage
            onBack={handleBackToMain}
          />
        ) : (
          <DataSourcesView
            onBackToMain={handleBackToMain}
          />
        )
      ) : viewMode === 'pro-tips' ? (
        <ProTipsPage
          onBack={handleBackToMain}
          onViewDataSources={handleViewDataSources}
        />
      ) : viewMode === 'enrichment-category' ? (
        isMobile ? (
          <EnrichmentCategoryPage
            category={activeCategory}
            selectedEnrichments={selectedEnrichments}
            poiRadii={poiRadii}
            poiYears={poiYears}
            onSelectionChange={setSelectedEnrichments}
            onPoiRadiiChange={setPoiRadii}
            onPoiYearsChange={setPoiYears}
            onBackToConfig={handleBackToConfig}
          />
        ) : (
          <EnrichmentCategoryView
            category={activeCategory}
            selectedEnrichments={selectedEnrichments}
            poiRadii={poiRadii}
            poiYears={poiYears}
            onSelectionChange={setSelectedEnrichments}
            onPoiRadiiChange={setPoiRadii}
            onPoiYearsChange={setPoiYears}
            onBackToConfig={handleBackToConfig}
          />
        )
      ) : viewMode === 'map' ? (
        isMobile ? (
          <MapPage
            results={enrichmentResults}
            onBack={handleBackToConfig}
            previousViewMode={previousViewMode || undefined}
          />
        ) : (
          <div className="flex-1 h-full">
            <MapView
              results={enrichmentResults}
              onBackToConfig={handleBackToConfig}
              isMobile={isMobile}
              previousViewMode={previousViewMode}
              initialCenter={enrichmentResults.length === 0 ? [37.0902, -95.7129] as [number, number] : undefined}
              initialZoom={enrichmentResults.length === 0 ? 4 : undefined}
            />
          </div>
        )
      ) : null}

      {/* Donate Modal - Available on all views */}
      {showDonate && (
        <DonateModal onClose={() => setShowDonate(false)} />
      )}

      <Analytics />
    </div>
  );
}

export default App;
