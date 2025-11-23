import React, { useState, useEffect, useRef } from 'react';
import { Settings, TreePine, Check, ArrowLeft } from 'lucide-react';
import { poiConfigManager } from '../lib/poiConfig';

interface EnrichmentConfigProps {
  selectedEnrichments: string[];
  onSelectionChange: (enrichments: string[]) => void;
  poiRadii: Record<string, number>;
  onPoiRadiiChange: (radii: Record<string, number>) => void;
  onViewCategory?: (category: EnrichmentCategory) => void;
  onModalStateChange?: (isModalOpen: boolean) => void;
}

interface EnrichmentCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  enrichments: EnrichmentItem[];
  subCategories?: EnrichmentCategory[]; // Support for nested sub-categories
}

interface EnrichmentItem {
  id: string;
  label: string;
  description: string;
  isPOI: boolean;
  defaultRadius: number;
  category: string;
}

// Core enrichments (non-POI)
const CORE_ENRICHMENTS = [
  { id: 'elev', label: 'Elevation', description: 'Terrain elevation in feet', isPOI: false, defaultRadius: 0, category: 'core' },
  { id: 'airq', label: 'Air Quality', description: 'PM2.5 air quality index', isPOI: false, defaultRadius: 0, category: 'core' },
  { id: 'fips', label: 'Census IDs', description: 'FIPS codes for state/county/tract', isPOI: false, defaultRadius: 0, category: 'core' },
  { id: 'acs', label: 'Demographics', description: 'ACS population and income data', isPOI: false, defaultRadius: 0, category: 'core' },
  { id: 'nws_alerts', label: 'Weather Alerts', description: 'Active NWS weather alerts', isPOI: false, defaultRadius: 0, category: 'core' }
];

// Icon mapping for sections
const SECTION_ICONS: Record<string, React.ReactNode> = {
  core: <Settings className="w-5 h-5" />,
  hazards: <img src="/assets/human_hazards.webp" alt="Human Caused Hazards" className="w-8 h-8" />,
  community: <span className="text-xl">👥</span>,
  retail: <span className="text-xl">🏢</span>,
  health: <span className="text-xl">❤️</span>,
  transportation: <span className="text-xl">🚌</span>,
  infrastructure: <span className="text-xl">⚡</span>,
  environment: <TreePine className="w-5 h-5" />,
  recreation: <span className="text-xl">🎯</span>,
  natural_resources: <span className="text-xl">🏔️</span>,
  public_lands: <span className="text-xl">🏞️</span>,
  quirky: <span className="text-xl">☕</span>,
  wildfire: <img src="/assets/wildfire.webp" alt="Natural Hazards" className="w-5 h-5" />,
  at: <img src="/assets/at.webp" alt="Appalachian Trail" className="w-5 h-5" />,
  pct: <img src="/assets/pct.webp" alt="Pacific Crest Trail" className="w-5 h-5" />,
  nh: <img src="/assets/newhampshire.webp" alt="New Hampshire Open Data" className="w-5 h-5" />,
  custom: <span className="text-xl">🔧</span>
};




const EnrichmentConfig: React.FC<EnrichmentConfigProps> = ({
  selectedEnrichments,
  onSelectionChange,
  poiRadii,
  onPoiRadiiChange,
  onViewCategory,
  onModalStateChange
}) => {
  const [enrichmentCategories, setEnrichmentCategories] = useState<EnrichmentCategory[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [viewingNHSubCategories, setViewingNHSubCategories] = useState(false);
  const [cameFromNHSubCategories, setCameFromNHSubCategories] = useState(false);
  
  // Notify parent when modal state changes
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(activeModal !== null || viewingNHSubCategories);
    }
  }, [activeModal, viewingNHSubCategories, onModalStateChange]); // Track if viewing NH sub-categories page
  const [isMobile, setIsMobile] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  // const [mobileView, setMobileView] = useState<'landing' | 'category'>('landing'); // Unused after removing mobile view
  // const [activeCategory, setActiveCategory] = useState<string | null>(null); // Unused after removing mobile view

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle modal body scroll prevention (desktop only)
  useEffect(() => {
    if (activeModal && !isMobile) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [activeModal, isMobile]);


  // Scroll to top when modal opens
  useEffect(() => {
    if (activeModal) {
      console.log('Modal opened:', activeModal);
      // Multiple attempts to ensure scroll to top works
      const scrollToTop = () => {
        // Scroll the modal content to top
        if (modalContentRef.current) {
          console.log('Scrolling modal content to top');
          modalContentRef.current.scrollTop = 0;
          modalContentRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
        
        // Scroll the main window to top
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        
        // Force scroll all possible scroll containers
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Try to scroll any parent containers
        const modalContainer = document.querySelector('.fixed.inset-0.bg-white');
        if (modalContainer) {
          modalContainer.scrollTop = 0;
        }
      };
      
      // Immediate scroll
      scrollToTop();
      
      // Delayed scroll to ensure DOM is fully rendered
      setTimeout(scrollToTop, 50);
      setTimeout(scrollToTop, 100);
      setTimeout(scrollToTop, 200);
    }
  }, [activeModal]);

  // Load dynamic POI configuration
  useEffect(() => {
    const loadEnrichmentCategories = () => {
      const sections = poiConfigManager.getAllSections();
      const poiTypes = poiConfigManager.getAllPOITypes();
      
      const categories: EnrichmentCategory[] = sections.map(section => {
        const sectionPOIs = poiTypes.filter(poi => poi.section === section.id);
        const sectionEnrichments = section.id === 'core' 
          ? CORE_ENRICHMENTS 
          : sectionPOIs.map(poi => ({
              id: poi.id,
              label: poi.label,
              description: poi.description,
              isPOI: poi.isPOI,
              defaultRadius: poi.defaultRadius,
              category: poi.category
            }));
        
        // Special handling for NH - add sub-categories based on data sources
        if (section.id === 'nh') {
          // Get NH GRANIT enrichments (filter POIs where section is 'nh')
          const nhGranitPOIs = poiTypes.filter(poi => poi.section === 'nh');
          console.log('🔍 Loading NH GRANIT enrichments:', {
            allPOITypes: poiTypes.length,
            nhPOIs: nhGranitPOIs.length,
            nhPOIIds: nhGranitPOIs.map(p => p.id)
          });
          const nhGranitEnrichments = nhGranitPOIs.map(poi => ({
            id: poi.id,
            label: poi.label,
            description: poi.description,
            isPOI: poi.isPOI,
            defaultRadius: poi.defaultRadius,
            category: poi.category
          }));
          
          console.log('✅ NH GRANIT Enrichments created:', {
            count: nhGranitEnrichments.length,
            enrichments: nhGranitEnrichments.map(e => e.id)
          });
          
          // Define NH sub-categories (organized by data source)
          const nhSubCategories: EnrichmentCategory[] = [
            {
              id: 'nh_granit',
              title: 'NH GRANIT',
              icon: <img src="/assets/NHgranit.webp" alt="NH GRANIT" className="w-full h-full object-cover rounded-full" />,
              description: 'New Hampshire Geographic Reference Information Network (GRANIT) data layers',
              enrichments: nhGranitEnrichments
            }
          ];
          
          return {
            id: section.id,
            title: section.title,
            icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
            description: section.description,
            enrichments: [], // NH parent category has no direct enrichments
            subCategories: nhSubCategories
          };
        }
        
        return {
          id: section.id,
          title: section.title,
          icon: SECTION_ICONS[section.id] || <span className="text-xl">⚙️</span>,
          description: section.description,
          enrichments: sectionEnrichments
        };
      });
      
      setEnrichmentCategories(categories);
    };

    loadEnrichmentCategories();
    
    // Listen for custom POI updates
    const handleStorageChange = () => {
      loadEnrichmentCategories();
    };
    
    const handleCustomPOIAdded = () => {
      loadEnrichmentCategories();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customPOIAdded', handleCustomPOIAdded);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customPOIAdded', handleCustomPOIAdded);
    };
  }, []);

  // Mobile navigation functions - removed since mobile view is disabled

  // const handleMobileBackToLanding = () => {
  //   setMobileView('landing');
  //   setActiveCategory(null);
  // }; // Unused after removing mobile view

  // Map category IDs to icon file names
  const getIconFileName = (categoryId: string): string => {
    const iconMap: { [key: string]: string } = {
      'hazards': 'hazards_risk',
      'community': 'community_services',
      'retail': 'retail_commerce',
      'nh': 'newhampshire',
      'health': 'health_wellness',
      'transportation': 'transportation',
      'infrastructure': 'power_inf',
      'recreation': 'recreation_leisure',
      'natural_resources': 'natural_resources',
      'public_lands': 'public_lands',
      'quirky': 'quirky_and_fun',
      'at': 'at',
      'pct': 'PCT'
    };
    return iconMap[categoryId] || categoryId;
  };

  const handleEnrichmentToggle = (enrichmentId: string) => {
    const newSelected = selectedEnrichments.includes(enrichmentId)
      ? selectedEnrichments.filter(id => id !== enrichmentId)
      : [...selectedEnrichments, enrichmentId];
    onSelectionChange(newSelected);
  };

  const getMaxRadius = (enrichmentId: string): number => {
    // Get max radius from POI config, with fallback to hardcoded values for special cases
    const poiConfig = poiConfigManager.getPOIType(enrichmentId);
    if (poiConfig?.maxRadius) {
      return poiConfig.maxRadius;
    }
    
    // Fallback to hardcoded values for special cases not in POI config
    if (enrichmentId === 'poi_earthquakes') {
      return 25; // Earthquakes can go up to 25 miles
    } else if (enrichmentId === 'poi_volcanoes') {
      return 50; // Volcanoes can go up to 50 miles
    } else if (enrichmentId === 'poi_wildfires') {
      return 50; // Wildfires can go up to 50 miles for risk assessment
    } else if (enrichmentId === 'poi_flood_reference_points') {
      return 25; // Flood reference points can go up to 25 miles
    }
    
    return 5; // Default for most POI types
  };

  const handleRadiusChange = (enrichmentId: string, radius: number) => {
    const maxRadius = getMaxRadius(enrichmentId);
    const minRadius = enrichmentId === 'poi_aurora_viewing_sites' ? 5 : 0.1;
    const cappedRadius = Math.max(minRadius, Math.min(radius, maxRadius));
    onPoiRadiiChange({
      ...poiRadii,
      [enrichmentId]: cappedRadius
    });
  };

  const handleResetAllFilters = () => {
    // Reset all selected enrichments
    onSelectionChange([]);
    // Reset all POI radii to defaults
    const defaultRadii: Record<string, number> = {};
    enrichmentCategories.forEach(category => {
      category.enrichments.forEach(enrichment => {
        if (enrichment.isPOI) {
          defaultRadii[enrichment.id] = enrichment.defaultRadius;
        }
      });
    });
    onPoiRadiiChange(defaultRadii);
  };

  const handleResetApp = () => {
    console.log('🔄 Starting comprehensive app reset from config...');
    
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
    
    // Add cache-busting parameter to force reload
    const timestamp = Date.now();
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_cb', timestamp.toString());
    
    console.log('🔄 Reloading app with cache busting...');
    
    // Force a complete page reload with cache busting
    window.location.href = currentUrl.toString();
  };

  // Mobile full-page view for portrait mode - DISABLED to show grid instead
  // This section has been removed to fix TypeScript compilation errors



  // Mobile landing page for portrait mode - DISABLED to use consistent grid layout
  if (false) { // Disabled mobile landing view
    return (
      <div className="enrichment-config">
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>Enrichment Layers</h3>
                  <p className="text-xs lg:text-sm text-gray-300">Select data sources and configure search parameters</p>
                </div>
              </div>
              
              {/* Reset All Filters Button */}
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <button
                  onClick={handleResetAllFilters}
                  className="btn btn-outline flex items-center justify-center space-x-2 text-xs sm:text-sm px-3 py-2 flex-1 sm:flex-none"
                  title="Reset all selected enrichments and radii to defaults"
                >
                  <span className="w-4 h-4">🔄</span>
                  <span className="whitespace-nowrap">Reset All Filters</span>
                </button>
                
                <button
                  onClick={handleResetApp}
                  className="btn btn-outline flex items-center justify-center space-x-2 text-xs sm:text-sm px-3 py-2 flex-1 sm:flex-none"
                  title="Clear browser cache and refresh application to ensure latest code"
                >
                  <span className="w-4 h-4">🔄</span>
                  <span className="whitespace-nowrap">Reset App</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="card-body">
            {/* Custom Icon Category Button Grid - 2 Column Layout */}
            <div className="mb-6 w-full px-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-12 max-w-lg mx-auto">
                {enrichmentCategories.map((category) => {
                  const categoryEnrichments = category.enrichments;
                  const selectedCount = categoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
                  
                  // Determine ring brightness based on selection count
                  const getRingOpacity = () => {
                    if (selectedCount === 0) return 0;
                    if (selectedCount <= 2) return 0.3;
                    if (selectedCount <= 4) return 0.6;
                    return 0.9;
                  };

                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        // Always use modal view for consistency
                        if (onViewCategory) {
                          onViewCategory(category);
                        } else {
                          setActiveModal(category.id);
                        }
                      }}
                      className="relative w-full aspect-square rounded-full overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        boxShadow: selectedCount > 0 ? `0 0 0 3px rgba(59, 130, 246, ${getRingOpacity()})` : 'none'
                      }}
                    >
                      {/* Custom Icon */}
                      <img
                        src={`/assets/${getIconFileName(category.id)}.webp`}
                        alt={category.title}
                        className={`object-cover opacity-80 hover:opacity-100 transition-opacity duration-200 ${category.id === 'at' ? 'w-full h-full' : 'w-full h-full'}`}
                        onError={(e) => {
                          // Fallback to category name if icon fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      
                      {/* Fallback Text */}
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-800 font-semibold text-sm text-center p-2 hidden"
                        style={{ display: 'none' }}
                      >
                        {category.title}
                      </div>
                      
                      {/* Selection Count Badge */}
                      {selectedCount > 0 && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                          {selectedCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Enrichments Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Selected Enrichments</h4>
              <div className="flex flex-wrap gap-2">
                {selectedEnrichments.length === 0 ? (
                  <span className="text-sm text-blue-700">No enrichments selected</span>
                ) : (
                  selectedEnrichments.map(id => {
                    const enrichment = enrichmentCategories
                      .flatMap(c => c.enrichments)
                      .find(e => e.id === id);
                    return (
                      <span key={id} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {enrichment?.label || id}
                        {enrichment?.isPOI && poiRadii[id] && (
                          <span className="ml-1 text-blue-600">({poiRadii[id]}mi)</span>
                        )}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If viewing NH sub-categories, show full page with round icons
  if (viewingNHSubCategories) {
    const nhCategory = enrichmentCategories.find(c => c.id === 'nh');
    const nhSubCategories = nhCategory?.subCategories || [];
    
    return (
      <div className="enrichment-config">
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewingNHSubCategories(false)}
                  className="text-white text-2xl font-bold p-2 hover:bg-white hover:bg-opacity-20 rounded flex-shrink-0"
                  title="Back to categories"
                >
                  ←
                </button>
                <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>New Hampshire Open Data</h3>
                  <p className="text-xs lg:text-sm text-gray-300">Select a category to view available layers</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card-body">
            {/* NH Sub-Category Round Icons Grid - Same layout as home page */}
            <div className="mb-6 w-full px-2 sm:px-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-12 max-w-lg mx-auto w-full justify-items-center">
                {nhSubCategories.map((subCategory) => {
                  const subCategoryEnrichments = subCategory.enrichments;
                  const selectedCount = subCategoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
                  
                  // Determine ring brightness based on selection count
                  const getRingOpacity = () => {
                    if (selectedCount === 0) return 0;
                    if (selectedCount <= 2) return 0.3;
                    if (selectedCount <= 4) return 0.6;
                    return 0.9;
                  };

                  return (
                    <button
                      key={subCategory.id}
                      onClick={() => {
                        // Open modal with this sub-category's enrichments
                        setCameFromNHSubCategories(true);
                        setActiveModal(subCategory.id);
                        setViewingNHSubCategories(false);
                      }}
                      className="relative w-full aspect-square rounded-full overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        boxShadow: selectedCount > 0 ? `0 0 0 3px rgba(59, 130, 246, ${getRingOpacity()})` : 'none'
                      }}
                    >
                      {/* Sub-Category Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {subCategory.icon}
                      </div>
                      
                      {/* Selection Counter Badge */}
                      {selectedCount > 0 && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold z-10">
                          {selectedCount}
                        </div>
                      )}
                      
                      {/* Category Title Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs font-semibold p-2 text-center z-10">
                        {subCategory.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop view (existing modal-based approach)
  // If modal is open, render ONLY the modal (hide main content)
  if (activeModal) {
    // Render modal only - this will cover the entire screen
    return (
      <div className="enrichment-config" style={{ position: 'relative', zIndex: 10001 }}>
        <div 
          className="fixed inset-0 bg-white"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 10001
          }}
        >
          <div className="h-screen bg-white flex flex-col overflow-hidden" style={{ height: '100vh' }}>
            {(() => {
              // Check if this is an NH sub-category (they have IDs like nh_transportation)
              const isNHSubCategory = activeModal?.startsWith('nh_');
              let category: EnrichmentCategory | undefined;
              
              if (isNHSubCategory) {
                // Find the NH category and get the sub-category
                const nhCategory = enrichmentCategories.find(c => c.id === 'nh');
                category = nhCategory?.subCategories?.find(sc => sc.id === activeModal);
                console.log('🔍 NH Sub-Category Modal:', {
                  activeModal,
                  isNHSubCategory,
                  nhCategoryFound: !!nhCategory,
                  subCategories: nhCategory?.subCategories?.map(sc => sc.id),
                  foundCategory: category?.id,
                  enrichmentsCount: category?.enrichments?.length
                });
              } else {
                // Regular category
                category = enrichmentCategories.find(c => c.id === activeModal);
              }
              
              if (!category) {
                console.warn('⚠️ Category not found for activeModal:', activeModal);
                return (
                  <div className="p-4">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-semibold"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back to Configuration</span>
                    </button>
                    <div className="mt-4 text-center text-gray-500">
                      <p>Category not found: {activeModal}</p>
                    </div>
                  </div>
                );
              }
              
              const categoryEnrichments = category.enrichments;
              const selectedCount = categoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
              console.log('📋 Category Enrichments:', {
                categoryId: category.id,
                categoryTitle: category.title,
                enrichmentsCount: categoryEnrichments.length,
                selectedCount: selectedCount,
                enrichments: categoryEnrichments.map(e => e.id)
              });
              
              const headerColor = category.id === 'hazards' ? '#991b1b' :
                                category.id === 'community' ? '#1e40af' :
                                category.id === 'retail' ? '#6b21a8' :
                                category.id === 'health' ? '#9d174d' :
                                category.id === 'transportation' ? '#3730a3' :
                                category.id === 'infrastructure' ? '#92400e' :
                                category.id === 'environment' ? '#166534' :
                                category.id === 'recreation' ? '#065f46' :
                                category.id === 'natural_resources' ? '#115e59' :
                                category.id === 'public_lands' ? '#365314' :
                                category.id === 'quirky' ? '#9a3412' :
                                category.id === 'wildfire' ? '#dc2626' :
                                category.id === 'at' ? '#166534' :
                                category.id === 'pct' ? '#166534' :
                                category.id === 'nh' ? '#166534' :
                                category.id === 'nh_granit' ? '#166534' :
                                category.id === 'core' ? '#1e293b' : '#1f2937';
              
              console.log('Category:', category.id, 'Header color:', headerColor);

              return (
                <>
                  {/* Header with Back Button - Matching EnrichmentCategoryView style exactly */}
                  <div 
                    className="shadow-lg border-b border-gray-300 flex-shrink-0"
                    style={{
                      backgroundColor: headerColor,
                      position: 'relative',
                      zIndex: 10001,
                      marginTop: '0'
                    }}
                  >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex items-center justify-between h-16">
                        <button
                          onClick={() => {
                            if (cameFromNHSubCategories) {
                              // Go back to NH sub-categories page
                              setCameFromNHSubCategories(false);
                              setActiveModal(null);
                              setViewingNHSubCategories(true);
                            } else {
                              // Go back to main configuration
                              setActiveModal(null);
                            }
                          }}
                          className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors font-semibold"
                        >
                          <ArrowLeft className="w-5 h-5" />
                          <span>Back to Configuration</span>
                        </button>
                        
                        <div className="flex items-center space-x-3">
                          <div>
                            <h1 className="text-base font-bold text-white">{category.title}</h1>
                            <p className="text-xs text-white text-opacity-90">{selectedCount} of {categoryEnrichments.length} selected</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content - Scrollable */}
                  <div 
                    ref={modalContentRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-4" 
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto w-full pt-4">
                      {categoryEnrichments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No layers available yet in this category.</p>
                          <p className="text-sm mt-2">Layers will be added soon.</p>
                          <p className="text-xs mt-2 text-gray-400">Debug: Category ID: {category.id}, Enrichments: {categoryEnrichments.length}</p>
                        </div>
                      ) : (
                        categoryEnrichments.map((enrichment) => {
                        const isSelected = selectedEnrichments.includes(enrichment.id);
                        const currentRadius = poiRadii[enrichment.id] || enrichment.defaultRadius;
                        const maxRadius = getMaxRadius(enrichment.id);
                        const minRadius = enrichment.id === 'poi_aurora_viewing_sites' ? 5 : 0.1;
                        const formatMiles = (value: number) => Number.isInteger(value) ? value.toString() : value.toFixed(1);
                        const radiusLabel = (() => {
                          if (enrichment.id === 'poi_earthquakes') return '25 miles (earthquakes)';
                          if (enrichment.id === 'poi_volcanoes') return '50 miles (volcanoes)';
                          if (enrichment.id === 'poi_wildfires') return '50 miles (wildfires)';
                          if (enrichment.id === 'poi_flood_reference_points') return '25 miles (flood reference points)';
                          if (enrichment.id === 'poi_aurora_viewing_sites') return '100 miles (aurora viewing sites)';
                          if (enrichment.id === 'nh_parcels') return '0.3 miles';
                          return '5 miles';
                        })();

                            return (
                              <div key={enrichment.id} className="border border-gray-200 rounded-lg p-4 sm:p-4">
                            {/* On mobile, stack checkbox above the text to give the text full width */}
                            <div className="flex flex-col sm:flex-row sm:items-start gap-3 w-full">
                              <button
                                type="button"
                                onClick={() => handleEnrichmentToggle(enrichment.id)}
                                className={`w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 border-2 border-gray-300 rounded flex items-center justify-center transition-all duration-200 ${
                                  isSelected 
                                    ? 'bg-black border-black' 
                                    : 'bg-white border-gray-300'
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3 h-3 sm:w-3 sm:h-3 text-white" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0 text-left space-y-1">
                                <label htmlFor={enrichment.id} className="font-semibold text-gray-900 cursor-pointer block text-base sm:text-base break-words leading-relaxed">
                                  {enrichment.label}
                                </label>
                                <p className="text-sm sm:text-sm text-gray-700 break-words leading-relaxed whitespace-normal">
                                  {enrichment.description}
                                </p>
                              </div>
                            </div>

                            {enrichment.isPOI && isSelected && (() => {
                              // For NH parcels, use a dropdown with specific options
                              const isNHParcels = enrichment.id === 'nh_parcels';
                              const radiusOptions = isNHParcels
                                ? [0.25, 0.50, 0.75, 1.0]
                                : enrichment.id === 'poi_aurora_viewing_sites'
                                ? [5, 10, 25, 50, 100]
                                : null; // null means use number input
                              
                              return (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                    <p className="text-xs text-amber-700">
                                      ⚠️ Recommended range: {radiusLabel} (for performance & accuracy)
                                    </p>
                                  </div>
                                  
                                  <div className="flex flex-col gap-3 mt-4 w-full max-w-full overflow-visible">
                                    <label className="text-sm font-medium text-black w-full">Search Radius:</label>
                                    <div className="flex items-center gap-2 w-full max-w-full overflow-visible">
                                      {radiusOptions ? (
                                        <select
                                          value={currentRadius}
                                          onChange={(e) => handleRadiusChange(enrichment.id, parseFloat(e.target.value))}
                                          className="w-32 sm:w-28 flex-shrink-0 px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 max-w-full"
                                        >
                                          {radiusOptions.map(option => (
                                            <option key={option} value={option}>
                                              {formatMiles(option)} {option === 1 ? 'mile' : 'miles'}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type="number"
                                          min={minRadius}
                                          max={maxRadius}
                                          step={enrichment.id === 'poi_aurora_viewing_sites' ? 1 : 0.1}
                                          value={currentRadius}
                                          onChange={(e) => handleRadiusChange(enrichment.id, parseFloat(e.target.value) || 0)}
                                          className="w-24 sm:w-20 flex-shrink-0 px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-center max-w-full"
                                        />
                                      )}
                                      <span className="text-sm text-black whitespace-nowrap flex-shrink-0">miles</span>
                                    </div>
                                  </div>

                                  {!radiusOptions && (currentRadius > maxRadius || currentRadius < minRadius) && (
                                    <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                                      Please stay between {formatMiles(minRadius)} and {formatMiles(maxRadius)} miles
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="enrichment-config">
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/assets/new-logo.webp" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>Enrichment Layers</h3>
                <p className="text-xs lg:text-sm text-gray-300">Select data sources and configure search parameters</p>
              </div>
            </div>
            
            {/* Reset All Filters Button */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <button
                onClick={handleResetAllFilters}
                className="btn btn-outline flex items-center justify-center space-x-2 text-xs sm:text-sm px-3 py-2 flex-1 sm:flex-none"
                title="Reset all selected enrichments and radii to defaults"
              >
                <span className="w-4 h-4">🔄</span>
                <span className="whitespace-nowrap">Reset All Filters</span>
              </button>
              
              <button
                onClick={handleResetApp}
                className="btn btn-outline flex items-center justify-center space-x-2 text-xs sm:text-sm px-3 py-2 flex-1 sm:flex-none"
                title="Clear browser cache and refresh application to ensure latest code"
              >
                <span className="w-4 h-4">🔄</span>
                <span className="whitespace-nowrap">Reset App</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          {/* Custom Icon Category Button Grid - Desktop */}
          <div className="mb-6 w-full px-2 sm:px-4 overflow-hidden">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-12 max-w-lg mx-auto w-full justify-items-center">
              {enrichmentCategories.map((category) => {
                const categoryEnrichments = category.enrichments;
                // For NH, count sub-category enrichments too
                const nhSubCategoryEnrichments = category.id === 'nh' && category.subCategories
                  ? category.subCategories.flatMap(sc => sc.enrichments)
                  : [];
                const allCategoryEnrichments = category.id === 'nh' 
                  ? nhSubCategoryEnrichments 
                  : categoryEnrichments;
                const selectedCount = allCategoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
                
                // Determine ring brightness based on selection count
                const getRingOpacity = () => {
                  if (selectedCount === 0) return 0;
                  if (selectedCount <= 2) return 0.3;
                  if (selectedCount <= 4) return 0.6;
                  return 0.9;
                };

                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      // Special handling for NH - show sub-categories page instead of modal
                      if (category.id === 'nh' && category.subCategories && category.subCategories.length > 0) {
                        setViewingNHSubCategories(true);
                      } else {
                        // Always use modal view for other categories
                        if (onViewCategory) {
                          onViewCategory(category);
                        } else {
                          setActiveModal(category.id);
                        }
                      }
                    }}
                    className={`relative overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 ${category.id === 'at' ? 'w-full aspect-square rounded-full' : 'w-full aspect-square rounded-full'}`}
                    style={{
                      boxShadow: selectedCount > 0 ? `0 0 0 3px rgba(59, 130, 246, ${getRingOpacity()})` : 'none'
                    }}
                  >
                    {/* Custom Icon */}
                    <img
                      src={`/assets/${getIconFileName(category.id)}.webp`}
                      alt={category.title}
                      className={`object-cover opacity-80 hover:opacity-100 transition-opacity duration-200 ${category.id === 'at' ? 'w-full h-full' : 'w-full h-full'}`}
                      onError={(e) => {
                        // Fallback to category name if icon fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    
                    {/* Fallback Text */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-800 font-semibold text-sm text-center p-2 hidden"
                      style={{ display: 'none' }}
                    >
                      {category.title}
                    </div>
                    
                    {/* Selection Counter Badge */}
                    {selectedCount > 0 && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {selectedCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selection Summary Panel */}
          {selectedEnrichments.length > 0 && (
            <div className="mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <h4 className="text-base sm:text-lg font-bold text-blue-900 flex items-center space-x-2">
                  <span>📊</span>
                  <span>Selection Summary</span>
                </h4>
                <span className="text-xs sm:text-sm font-semibold text-blue-700 bg-blue-100 px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">
                  {selectedEnrichments.length} total
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {enrichmentCategories.map((category) => {
                  // For NH, count sub-category enrichments too
                  const nhSubCategoryEnrichments = category.id === 'nh' && category.subCategories
                    ? category.subCategories.flatMap(sc => sc.enrichments)
                    : [];
                  const allCategoryEnrichments = category.id === 'nh' 
                    ? nhSubCategoryEnrichments 
                    : category.enrichments;
                  const categorySelected = allCategoryEnrichments.filter(e => selectedEnrichments.includes(e.id));
                  if (categorySelected.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="bg-white rounded-lg p-2 sm:p-3 border border-blue-100">
                      <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                        <img 
                          src={`/assets/${getIconFileName(category.id)}.webp`}
                          alt={category.title}
                          className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{category.title}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {categorySelected.length} of {allCategoryEnrichments.length} selected
                      </div>
                      <div className="mt-1 text-xs text-blue-600 font-medium truncate">
                        {categorySelected.map(e => e.label).slice(0, 2).join(', ')}
                        {categorySelected.length > 2 && ` +${categorySelected.length - 2} more`}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {selectedEnrichments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>Ready to search!</strong> Your selected enrichments will provide comprehensive location insights.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrichmentConfig;