import React, { useState, useEffect, useRef } from 'react';
import { Settings, TreePine } from 'lucide-react';
import { poiConfigManager } from '../lib/poiConfig';

interface EnrichmentConfigProps {
  selectedEnrichments: string[];
  onSelectionChange: (enrichments: string[]) => void;
  poiRadii: Record<string, number>;
  onPoiRadiiChange: (radii: Record<string, number>) => void;
  onViewCategory?: (category: EnrichmentCategory) => void;
}

interface EnrichmentCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  enrichments: EnrichmentItem[];
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
  hazards: <span className="text-xl">🌊</span>,
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
  custom: <span className="text-xl">🔧</span>
};




const EnrichmentConfig: React.FC<EnrichmentConfigProps> = ({ 
  selectedEnrichments, 
  onSelectionChange, 
  poiRadii, 
  onPoiRadiiChange,
  onViewCategory
}) => {
  const [enrichmentCategories, setEnrichmentCategories] = useState<EnrichmentCategory[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);
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
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        if (modalContentRef.current) {
          console.log('Scrolling modal content to top');
          modalContentRef.current.scrollTop = 0;
        }
        // Also try to scroll the window to top
        window.scrollTo(0, 0);
        // Force scroll to top of the modal content
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
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
      'health': 'health_wellness',
      'transportation': 'transportation',
      'infrastructure': 'power_inf',
      'recreation': 'recreation_leisure',
      'natural_resources': 'natural_resources',
      'public_lands': 'public_lands',
      'quirky': 'quirky_and_fun'
    };
    return iconMap[categoryId] || categoryId;
  };

  const handleEnrichmentToggle = (enrichmentId: string) => {
    const newSelected = selectedEnrichments.includes(enrichmentId)
      ? selectedEnrichments.filter(id => id !== enrichmentId)
      : [...selectedEnrichments, enrichmentId];
    onSelectionChange(newSelected);
  };

  const handleRadiusChange = (enrichmentId: string, radius: number) => {
    // Cap radius based on POI type: different hazards have different maximums
    let maxRadius = 5; // Default for most POI types

    if (enrichmentId === 'poi_earthquakes') {
      maxRadius = 25; // Earthquakes can go up to 25 miles
    } else if (enrichmentId === 'poi_volcanoes') {
      maxRadius = 50; // Volcanoes can go up to 50 miles
    } else if (enrichmentId === 'poi_wildfires') {
      maxRadius = 50; // Wildfires can go up to 50 miles for risk assessment
    } else if (enrichmentId === 'poi_flood_reference_points') {
      maxRadius = 25; // Flood reference points can go up to 25 miles
    }

    const cappedRadius = Math.min(radius, maxRadius);
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
                <img src="/assets/new-logo.png" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base lg:text-lg font-semibold text-white">Enrichment Configuration</h3>
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
              <div className="grid grid-cols-2 gap-4 sm:gap-12 max-w-lg mx-auto">
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
                        src={`/assets/${getIconFileName(category.id)}.png`}
                        alt={category.title}
                        className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-200"
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

  // Desktop view (existing modal-based approach)
  return (
    <div className="enrichment-config">
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/assets/new-logo.png" alt="The Location Is Everything Co" className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base lg:text-lg font-semibold text-white">Enrichment Configuration</h3>
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
          <div className="mb-6 w-full px-4">
            <div className="grid grid-cols-2 gap-4 sm:gap-12 max-w-lg mx-auto">
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
                      src={`/assets/${getIconFileName(category.id)}.png`}
                      alt={category.title}
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-200"
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

          {/* Category Configuration Modal */}
          {activeModal && (
            <div 
              className="fixed inset-0 bg-white z-[9999]"
            >
              <div className="h-screen bg-white flex flex-col overflow-hidden">
                {(() => {
                  const category = enrichmentCategories.find(c => c.id === activeModal);
                  if (!category) return null;
                  
                  const categoryEnrichments = category.enrichments;
                  
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
                                    category.id === 'core' ? '#1e293b' : '#1f2937';
                  
                  console.log('Category:', category.id, 'Header color:', headerColor);

                  return (
                    <>
                      {/* Header */}
                      <div 
                        className="p-3 flex-shrink-0"
                        style={{
                          backgroundColor: headerColor,
                          color: 'white'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <div className="min-w-0 flex-1">
                              <h2 className="text-base font-bold text-white truncate">{category.title}</h2>
                              <p className="text-xs text-white text-opacity-90 truncate">{category.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveModal(null)}
                            className="text-white text-2xl font-bold p-2 flex-shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Content - Scrollable */}
                      <div 
                        ref={modalContentRef}
                        className="flex-1 overflow-y-auto p-4" 
                        style={{ scrollBehavior: 'smooth' }}
                      >
                        <div className="space-y-4">
                          {categoryEnrichments.map((enrichment) => {
                            const isSelected = selectedEnrichments.includes(enrichment.id);
                            const currentRadius = poiRadii[enrichment.id] || enrichment.defaultRadius;

                            return (
                              <div key={enrichment.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3 flex-1">
                                    <input
                                      type="checkbox"
                                      id={enrichment.id}
                                      checked={isSelected}
                                      onChange={() => handleEnrichmentToggle(enrichment.id)}
                                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                                    />
                                    <div className="flex-1">
                                      <label htmlFor={enrichment.id} className="font-medium text-gray-900 cursor-pointer block">
                                        {enrichment.label}
                                      </label>
                                      <p className="text-sm text-gray-600 mt-1">{enrichment.description}</p>
                                    </div>
                                  </div>
                                </div>

                                {enrichment.isPOI && isSelected && (
                                  <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                      <p className="text-xs text-amber-700">
                                        ⚠️ Maximum radius: {
                                          enrichment.id === 'poi_earthquakes' ? '25 miles (earthquakes)' :
                                          enrichment.id === 'poi_volcanoes' ? '50 miles (volcanoes)' :
                                          enrichment.id === 'poi_wildfires' ? '50 miles (wildfires)' :
                                          enrichment.id === 'poi_flood_reference_points' ? '25 miles (flood reference points)' :
                                          '5 miles'
                                        } (for performance & accuracy)
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                      <label className="text-sm font-medium text-black">Search Radius:</label>
                                      <input
                                        type="number"
                                        min="0.1"
                                        max={
                                          enrichment.id === 'poi_earthquakes' ? 25 :
                                          enrichment.id === 'poi_volcanoes' ? 50 :
                                          enrichment.id === 'poi_wildfires' ? 50 :
                                          enrichment.id === 'poi_flood_reference_points' ? 25 :
                                          5
                                        }
                                        step="0.1"
                                        value={currentRadius}
                                        onChange={(e) => handleRadiusChange(enrichment.id, parseFloat(e.target.value) || 0)}
                                        className="w-20 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                                      />
                                      <span className="text-sm text-black">miles</span>
                                    </div>

                                    {currentRadius > (
                                      enrichment.id === 'poi_earthquakes' ? 25 :
                                      enrichment.id === 'poi_volcanoes' ? 50 :
                                      enrichment.id === 'poi_flood_reference_points' ? 25 :
                                      5
                                    ) && (
                                      <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                                        Capped at {
                                          enrichment.id === 'poi_earthquakes' ? '25' :
                                          enrichment.id === 'poi_volcanoes' ? '50' :
                                          enrichment.id === 'poi_flood_reference_points' ? '25' :
                                          '5'
                                        } miles
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                        <button
                          onClick={() => setActiveModal(null)}
                          className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-medium"
                        >
                          Done
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

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
};

export default EnrichmentConfig;