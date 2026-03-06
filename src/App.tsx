import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { debugScroll, monitorWheelEvents, checkEventListeners } from './utils/scrollDebug';

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

  // Detect mobile device and ensure desktop scrolling works
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      
      // Desktop-specific: Ensure scrolling is enabled
      if (!isMobileDevice && viewMode === 'config') {
        // Remove any scroll-blocking styles
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.maxHeight = '';
        
        // Ensure html and body allow scrolling on desktop
        document.documentElement.style.overflowY = 'auto';
        document.documentElement.style.overflowX = 'hidden';
        document.documentElement.style.height = 'auto';
        document.documentElement.style.maxHeight = '';
        document.body.style.overflowY = 'auto';
        document.body.style.overflowX = 'hidden';
        document.body.style.height = 'auto';
        document.body.style.maxHeight = '';
        
        // CRITICAL: #root should NOT be the scroll container - body should scroll
        const root = document.getElementById('root');
        if (root) {
          root.style.overflowY = 'visible'; // Changed from 'auto' - body scrolls, not #root
          root.style.overflowX = 'hidden';
          root.style.height = 'auto';
          root.style.maxHeight = '';
        }
        
        // Ensure App wrapper doesn't block scroll
        const appWrapper = document.querySelector('.bg-black.flex.flex-col.min-h-screen');
        if (appWrapper) {
          const wrapperEl = appWrapper as HTMLElement;
          wrapperEl.style.overflow = 'visible';
          wrapperEl.style.height = 'auto';
          wrapperEl.style.maxHeight = '';
          wrapperEl.style.position = 'relative';
          // CRITICAL: Ensure flex wrapper doesn't prevent body scroll
          wrapperEl.style.flexShrink = '0';
        }
        
        // CRITICAL: Force body to be scroll container
        // Remove any height constraints that might prevent scroll
        document.body.style.display = 'block';
        document.body.style.position = 'relative';
        
        // CRITICAL: Remove ALL inline styles that might block scroll
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('overflow-y');
        document.body.style.removeProperty('overflow-x');
        // Then set the correct values
        document.body.style.setProperty('overflow-y', 'auto', 'important');
        document.body.style.setProperty('overflow-x', 'hidden', 'important');
        
        // Ensure html can scroll
        document.documentElement.style.position = 'relative';
        document.documentElement.style.display = 'block';
        document.documentElement.style.removeProperty('overflow');
        document.documentElement.style.removeProperty('overflow-y');
        document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
        
        // DEBUG: Log scroll state
        console.log('🔧 Desktop scroll fix applied for config view');
        setTimeout(() => {
          debugScroll();
          // Try to manually scroll to verify it works
          console.log('🧪 Testing scroll capability...');
          window.scrollTo(0, 1);
          setTimeout(() => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            console.log('🧪 Scroll test result:', scrollTop > 0 ? '✅ SCROLL WORKS' : '❌ SCROLL STILL BLOCKED');
            if (scrollTop > 0) {
              window.scrollTo(0, 0); // Reset
            }
          }, 100);
        }, 200);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Also run on viewMode change to ensure scroll is enabled
    if (viewMode === 'config' && !isMobile) {
      setTimeout(checkMobile, 100);
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [viewMode, isMobile]);

  // DEBUG: Monitor scroll on home page and results page
  useEffect(() => {
    if ((viewMode === 'config' || viewMode === 'desktop-results') && !isMobile) {
      const pageName = viewMode === 'config' ? 'HOME PAGE' : 'RESULTS PAGE';
      console.log(`🏠 ${pageName} LOADED - Starting scroll debug...`);
      
      // CRITICAL: Force enable scroll immediately
      const forceEnableScroll = () => {
        // Remove ALL possible scroll blockers
        document.body.classList.remove('modal-open');
        
        // CRITICAL: Remove any height constraints that prevent body from growing
        document.body.style.removeProperty('height');
        document.body.style.removeProperty('max-height');
        document.body.style.removeProperty('min-height');
        document.documentElement.style.removeProperty('height');
        document.documentElement.style.removeProperty('max-height');
        
        // Force body to be scrollable with !important via setProperty
        document.body.style.setProperty('overflow-y', 'auto', 'important');
        document.body.style.setProperty('overflow-x', 'hidden', 'important');
        document.body.style.setProperty('position', 'relative', 'important');
        // CRITICAL: Don't set height: auto - let it be unset so it can grow naturally
        document.body.style.removeProperty('height');
        
        // Force html to be scrollable
        document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
        document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
        // CRITICAL: Don't set height: auto - let it be unset so it can grow naturally
        document.documentElement.style.removeProperty('height');
        
        // Ensure #root doesn't block - it should NOT be the scroll container
        const root = document.getElementById('root');
        if (root) {
          root.style.setProperty('overflow-y', 'visible', 'important');
          root.style.setProperty('overflow-x', 'hidden', 'important');
          // CRITICAL: Remove height constraints so content can flow naturally
          root.style.removeProperty('height');
          root.style.removeProperty('max-height');
        }
        
        // Ensure App wrapper doesn't block
        const appWrapper = document.querySelector('.bg-black.flex.flex-col.min-h-screen');
        if (appWrapper) {
          const wrapperEl = appWrapper as HTMLElement;
          wrapperEl.style.setProperty('overflow', 'visible', 'important');
          wrapperEl.style.setProperty('overflow-y', 'visible', 'important');
          // CRITICAL: Remove height constraints - let content determine height
          wrapperEl.style.removeProperty('height');
          wrapperEl.style.removeProperty('max-height');
          // Keep min-height but ensure it doesn't prevent scrolling
          wrapperEl.style.setProperty('min-height', '100vh', 'important');
        }
        
        // CRITICAL: Ensure main-container and main-content don't block
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
          (mainContainer as HTMLElement).style.setProperty('overflow', 'visible', 'important');
          (mainContainer as HTMLElement).style.removeProperty('height');
          (mainContainer as HTMLElement).style.removeProperty('max-height');
        }
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          (mainContent as HTMLElement).style.setProperty('overflow', 'visible', 'important');
          (mainContent as HTMLElement).style.removeProperty('height');
          (mainContent as HTMLElement).style.removeProperty('max-height');
        }
      };
      
      // Run immediately and after delays
      forceEnableScroll();
      setTimeout(forceEnableScroll, 100);
      setTimeout(forceEnableScroll, 500);
      
      // CRITICAL: Manually handle wheel events to ensure scroll works
      let manualScrollHandler: ((e: WheelEvent) => void) | null = null;
      
      const enableManualScroll = () => {
        // Check if scroll is actually possible
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        const canScroll = scrollHeight > clientHeight;
        
        if (!canScroll) {
          console.warn('⚠️ Content is not taller than viewport - cannot scroll');
          return;
        }
        
        console.log('🔧 Enabling manual scroll handler');
        console.log(`  scrollHeight: ${scrollHeight}, clientHeight: ${clientHeight}, canScroll: ${canScroll}`);
        
        // Manually handle wheel events to ensure scroll works
        manualScrollHandler = (e: WheelEvent) => {
          const currentScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
          const maxScroll = Math.max(0, scrollHeight - clientHeight);
          
          // Store scroll position before potential browser scroll
          const scrollBefore = currentScroll;
          
          // Wait a bit to see if browser handled the scroll
          requestAnimationFrame(() => {
            setTimeout(() => {
              const scrollAfter = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
              
              // If scroll didn't change significantly and we have a valid deltaY, manually scroll
              if (Math.abs(scrollAfter - scrollBefore) < 5 && Math.abs(e.deltaY) > 0) {
                const scrollAmount = e.deltaY;
                const newPosition = Math.max(0, Math.min(maxScroll, scrollBefore + scrollAmount));
                
                // Only scroll if we're not at the limits
                if ((scrollBefore > 0 && scrollAmount < 0) || (scrollBefore < maxScroll && scrollAmount > 0)) {
                  // Manually scroll using multiple methods to ensure it works
                  window.scrollTo({ top: newPosition, behavior: 'auto' });
                  document.documentElement.scrollTop = newPosition;
                  document.body.scrollTop = newPosition;
                  
                  // Verify it worked
                  setTimeout(() => {
                    const finalScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
                    if (Math.abs(finalScroll - newPosition) > 1) {
                      // Force scroll again if it didn't work
                      window.scrollTo(0, newPosition);
                      document.documentElement.scrollTop = newPosition;
                      document.body.scrollTop = newPosition;
                    }
                  }, 10);
                }
              }
            }, 30);
          });
        };
        
        // Add manual scroll handler with high priority (capture phase)
        document.addEventListener('wheel', manualScrollHandler, { passive: true, capture: true });
        window.addEventListener('wheel', manualScrollHandler, { passive: true, capture: true });
      };
      
      // Enable manual scroll handler immediately
      setTimeout(() => {
        debugScroll();
        checkEventListeners();
        
        // Always enable manual scroll handler as fallback
        enableManualScroll();
      }, 500);
      
      // Monitor wheel events
      const cleanupWheelMonitor = monitorWheelEvents();
      
      // Add keyboard shortcut for manual debug (Ctrl+Shift+D)
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          console.log('🔍 MANUAL SCROLL DEBUG TRIGGERED');
          forceEnableScroll();
          debugScroll();
        }
      };
      
      window.addEventListener('keydown', handleKeyPress);
      
      return () => {
        cleanupWheelMonitor();
        window.removeEventListener('keydown', handleKeyPress);
        if (manualScrollHandler) {
          document.removeEventListener('wheel', manualScrollHandler, { capture: true });
        }
      };
    }
  }, [viewMode, isMobile]);

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
    const isComingFromMap = viewMode === 'map';
    
    // Restore scroll position IMMEDIATELY before changing view mode to prevent flash
    if (!isComingFromMap && savedScrollPosition > 0) {
      // Immediately set scroll position to prevent showing top of page
      window.scrollTo(0, savedScrollPosition);
      document.documentElement.scrollTop = savedScrollPosition;
      document.body.scrollTop = savedScrollPosition;
    }
    
    setViewMode(targetViewMode);
    setPreviousViewMode(null); // Clear the previous view mode
    setError(null);
    
    // Ensure scroll position is maintained after view mode change
    if (!isComingFromMap) {
      setTimeout(() => {
        window.scrollTo(0, savedScrollPosition);
        document.documentElement.scrollTop = savedScrollPosition;
        document.body.scrollTop = savedScrollPosition;
      }, 50);
    } else {
      // Coming from map view, scroll to top
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
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

  const handleViewGlobalRiskMap = async () => {
    // Navigate to map view with all Global Risk layers pre-selected
    // Query ALL Global Risk layer data globally (no spatial constraints) for instant visualization
    const globalRiskLayers = ['portwatch_disruptions', 'portwatch_chokepoints', 'acled'];
    setSelectedEnrichments(globalRiskLayers);
    setPreviousViewMode('enrichment-category');
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Import the global query functions
      const { getAllPortWatchDisruptionsData } = await import('./adapters/portWatchDisruptions');
      const { getAllPortWatchChokepointsData } = await import('./adapters/portWatchChokepoints');
      const { getAllACLEDData } = await import('./adapters/acled');
      
      // Query all features globally in parallel
      const [allDisruptions, allChokepoints, allACLEDEvents] = await Promise.all([
        getAllPortWatchDisruptionsData(),
        getAllPortWatchChokepointsData(),
        getAllACLEDData()
      ]);
      
      // Format enrichments to match expected structure
      const enrichments: Record<string, any> = {};
      
      if (allDisruptions.length > 0) {
        enrichments.portwatch_disruptions_count = allDisruptions.length;
        enrichments.portwatch_disruptions_summary = `Found ${allDisruptions.length} port disruption events globally`;
        enrichments.portwatch_disruptions_all = allDisruptions;
      }
      
      if (allChokepoints.length > 0) {
        enrichments.portwatch_chokepoints_count = allChokepoints.length;
        enrichments.portwatch_chokepoints_summary = `Found ${allChokepoints.length} chokepoint ports globally`;
        enrichments.portwatch_chokepoints_all = allChokepoints;
      }
      
      if (allACLEDEvents.length > 0) {
        enrichments.acled_count = allACLEDEvents.length;
        enrichments.acled_summary = `Found ${allACLEDEvents.length} ACLED conflict events globally`;
        enrichments.acled_all = allACLEDEvents;
      }
      
      // Create enrichment result with minimal location (won't be displayed)
      // Use world center as placeholder location
      const globalLocation: GeocodeResult = {
        lat: 0,
        lon: 0,
        name: '',
        confidence: 1,
        source: 'global'
      };
      
      const globalResult: EnrichmentResult = {
        location: globalLocation,
        enrichments: enrichments
      };
      
      setEnrichmentResults([globalResult]);
      setViewMode('map');
    } catch (error) {
      console.error('Error loading Global Risk layers:', error);
      // Still navigate to map even if query fails
      setEnrichmentResults([]);
      setViewMode('map');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewEnrichmentCategory = (category: any) => {
    // Save current scroll position before navigating to category view
    setSavedScrollPosition(window.pageYOffset || document.documentElement.scrollTop);
    // Scroll to top IMMEDIATELY when opening category view (before state change)
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setActiveCategory(category);
    setViewMode('enrichment-category');
    // Ensure scroll position stays at top after view mode change
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
  };

  const handleBackToMain = () => {
    setViewMode('config');
    // Restore scroll position after a brief delay to ensure the view has rendered
    setTimeout(() => {
      window.scrollTo(0, savedScrollPosition);
    }, 100);
  };

  return (
    <div 
      className={`${viewMode === 'map' ? 'h-screen' : 'min-h-screen'} bg-black flex flex-col`} 
      style={{ 
        overflow: 'visible',
        // CRITICAL: Ensure flex container doesn't block body scroll
        height: viewMode === 'map' ? '100vh' : 'auto',
        minHeight: viewMode === 'map' ? '100vh' : '100vh',
        maxHeight: 'none'
      }}
    >
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
                <div className="inline-flex items-center justify-center px-2.5 sm:px-4 py-2 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                  <span className="text-white font-semibold text-sm sm:text-base whitespace-nowrap text-center">
                    <span className="font-bold text-2xl sm:text-3xl">{totalLayersCount.toLocaleString()}</span> Open Data Layers Available
                  </span>
                  <span className="hidden sm:flex ml-2 text-white text-xs opacity-90 flex-col items-center justify-center">
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
            onViewMap={activeCategory?.id === 'global_risk' ? handleViewGlobalRiskMap : undefined}
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
            onViewMap={activeCategory?.id === 'global_risk' ? handleViewGlobalRiskMap : undefined}
          />
        )
      ) : viewMode === 'map' ? (
        isMobile ? (
          <MapPage
            results={enrichmentResults}
            onBack={handleBackToConfig}
            previousViewMode={previousViewMode || undefined}
            poiRadii={poiRadii}
            hideLocationMarker={
              enrichmentResults.length > 0 && 
              enrichmentResults[0]?.location?.lat === 0 && 
              enrichmentResults[0]?.location?.lon === 0 && 
              enrichmentResults[0]?.location?.name === '' &&
              (selectedEnrichments.includes('portwatch_disruptions') || 
               selectedEnrichments.includes('portwatch_chokepoints'))
            }
          />
        ) : (
          <div className="flex-1 h-full">
            <MapView
              results={enrichmentResults}
              onBackToConfig={handleBackToConfig}
              isMobile={isMobile}
              previousViewMode={previousViewMode}
              initialCenter={
                enrichmentResults.length === 0 
                  ? (selectedEnrichments.includes('portwatch_disruptions') || selectedEnrichments.includes('portwatch_chokepoints')
                      ? [0, 0] as [number, number] // Global center for Global Risk layers
                      : [37.0902, -95.7129] as [number, number]) // US center for other cases
                  : (enrichmentResults.length > 0 && enrichmentResults[0]?.location?.lat === 0 && enrichmentResults[0]?.location?.lon === 0
                      ? [0, 0] as [number, number] // Global center for global view
                      : undefined)
              }
              initialZoom={
                enrichmentResults.length === 0 
                  ? (selectedEnrichments.includes('portwatch_disruptions') || selectedEnrichments.includes('portwatch_chokepoints')
                      ? 3 // Continent level zoom for Global Risk layers
                      : 4) // US zoom for other cases
                  : (enrichmentResults.length > 0 && enrichmentResults[0]?.location?.lat === 0 && enrichmentResults[0]?.location?.lon === 0
                      ? 3 // Continent level zoom for global view
                      : undefined)
              }
              poiRadii={poiRadii}
              hideLocationMarker={
                enrichmentResults.length > 0 && 
                enrichmentResults[0]?.location?.lat === 0 && 
                enrichmentResults[0]?.location?.lon === 0 && 
                enrichmentResults[0]?.location?.name === '' &&
                (selectedEnrichments.includes('portwatch_disruptions') || 
                 selectedEnrichments.includes('portwatch_chokepoints') || 
                 selectedEnrichments.includes('opensky_flights'))
              }
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
