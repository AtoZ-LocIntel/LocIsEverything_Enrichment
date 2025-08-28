import React, { useState, useEffect } from 'react';
import { Settings, TreePine } from 'lucide-react';
import { poiConfigManager } from '../lib/poiConfig';

interface EnrichmentConfigProps {
  selectedEnrichments: string[];
  onSelectionChange: (enrichments: string[]) => void;
  poiRadii: Record<string, number>;
  onPoiRadiiChange: (radii: Record<string, number>) => void;
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

// Color scheme for each category section
const SECTION_COLORS: Record<string, { bg: string; border: string; header: string; headerHover: string }> = {
  core: { 
    bg: 'bg-slate-50', 
    border: 'border-slate-200', 
    header: 'bg-slate-100', 
    headerHover: 'hover:bg-slate-200' 
  },
  hazards: { 
    bg: 'bg-red-50', 
    border: 'border-red-200', 
    header: 'bg-red-100', 
    headerHover: 'hover:bg-red-200' 
  },
  community: { 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    header: 'bg-blue-100', 
    headerHover: 'hover:bg-blue-200' 
  },
  retail: { 
    bg: 'bg-purple-50', 
    border: 'border-purple-200', 
    header: 'bg-purple-100', 
    headerHover: 'hover:bg-purple-200' 
  },
  health: { 
    bg: 'bg-pink-50', 
    border: 'border-pink-200', 
    header: 'bg-pink-100', 
    headerHover: 'hover:bg-pink-200' 
  },
  transportation: { 
    bg: 'bg-indigo-50', 
    border: 'border-indigo-200', 
    header: 'bg-indigo-100', 
    headerHover: 'hover:bg-indigo-200' 
  },
  infrastructure: { 
    bg: 'bg-amber-50', 
    border: 'border-amber-200', 
    header: 'bg-amber-100', 
    headerHover: 'hover:bg-amber-200' 
  },
  environment: { 
    bg: 'bg-green-50', 
    border: 'border-green-200', 
    header: 'bg-green-100', 
    headerHover: 'hover:bg-green-200' 
  },
  recreation: { 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200', 
    header: 'bg-emerald-100', 
    headerHover: 'hover:bg-emerald-200' 
  },
  quirky: { 
    bg: 'bg-orange-50', 
    border: 'border-orange-200', 
    header: 'bg-orange-100', 
    headerHover: 'hover:bg-orange-200' 
  },
  custom: { 
    bg: 'bg-gray-50', 
    border: 'border-gray-200', 
    header: 'bg-gray-100', 
    headerHover: 'hover:bg-gray-200' 
  }
};


const EnrichmentConfig: React.FC<EnrichmentConfigProps> = ({ 
  selectedEnrichments, 
  onSelectionChange, 
  poiRadii, 
  onPoiRadiiChange 
}) => {
  const [enrichmentCategories, setEnrichmentCategories] = useState<EnrichmentCategory[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Handle modal body scroll prevention
  useEffect(() => {
    if (activeModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
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

  // Removed toggleCategory - using modal-based UI now

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
          {/* Category Button Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {enrichmentCategories.map((category) => {
              const categoryEnrichments = category.enrichments;
              const selectedCount = categoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;
              const colors = SECTION_COLORS[category.id] || SECTION_COLORS.custom;

              return (
                <button
                  key={category.id}
                  onClick={() => setActiveModal(category.id)}
                  className={`relative p-4 rounded-xl ${colors.header} ${colors.headerHover} transition-all duration-200 shadow-md hover:shadow-lg border-2 ${colors.border}`}
                >
                  <div className="text-center relative">
                    <div className="text-3xl mb-2 relative">
                      {category.icon}
                      {selectedCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                          {selectedCount}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">{category.title}</h3>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Category Configuration Modal */}
          {activeModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4" 
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setActiveModal(null);
                }
              }}
            >
              <div className="bg-white rounded-xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
                {(() => {
                  const category = enrichmentCategories.find(c => c.id === activeModal);
                  if (!category) return null;
                  
                  const colors = SECTION_COLORS[category.id] || SECTION_COLORS.custom;
                  const categoryEnrichments = category.enrichments;

                  return (
                    <>
                      {/* Modal Header - Fixed */}
                      <div className={`p-4 ${colors.header} flex-shrink-0`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{category.icon}</div>
                            <div>
                              <h2 className="text-lg font-bold text-white">{category.title}</h2>
                              <p className="text-xs text-white text-opacity-90">{category.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveModal(null)}
                            className="text-white hover:text-gray-300 text-2xl font-bold p-3 rounded-full bg-black bg-opacity-20 flex-shrink-0"
                            style={{minWidth: '48px', minHeight: '48px'}}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Modal Body - Scrollable */}
                      <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
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
                                      <label className="text-sm font-medium text-white">Search Radius:</label>
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
                                      <span className="text-sm text-white">miles</span>
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
                      </div>

                      {/* Modal Footer - Fixed */}
                      <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                        <div className="flex justify-center">
                          <button
                            onClick={() => setActiveModal(null)}
                            className="w-full max-w-xs px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-lg"
                          >
                            Done
                          </button>
                        </div>
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
