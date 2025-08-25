import React, { useState, useEffect } from 'react';
import { Settings, ChevronDown, ChevronRight, Users, Building2, Heart, Zap, TreePine, Mountain, Bus, Coffee } from 'lucide-react';
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
  community: <Users className="w-5 h-5" />,
  retail: <Building2 className="w-5 h-5" />,
  health: <Heart className="w-5 h-5" />,
  transportation: <Bus className="w-5 h-5" />,
  infrastructure: <Zap className="w-5 h-5" />,
  environment: <TreePine className="w-5 h-5" />,
  recreation: <Mountain className="w-5 h-5" />,
  quirky: <Coffee className="w-5 h-5" />,
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core']));
  const [enrichmentCategories, setEnrichmentCategories] = useState<EnrichmentCategory[]>([]);

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
          icon: SECTION_ICONS[section.id] || <span>📁</span>,
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

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Enrichment Configuration</h3>
                <p className="text-sm text-gray-700">Select data sources and configure search parameters</p>
              </div>
            </div>
            
            {/* Reset All Filters Button */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleResetAllFilters}
                className="btn btn-outline flex items-center space-x-2"
                title="Reset all selected enrichments and radii to defaults"
              >
                <span className="w-4 h-4">🔄</span>
                <span>Reset All Filters</span>
              </button>
              
              <button
                onClick={handleResetApp}
                className="btn btn-outline flex items-center space-x-2"
                title="Clear browser cache and refresh application to ensure latest code"
              >
                <span className="w-4 h-4">🔄</span>
                <span>Reset App</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          <div className="space-y-4">
            {enrichmentCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const categoryEnrichments = category.enrichments;
              const hasSelectedEnrichments = categoryEnrichments.some(enrichment => 
                selectedEnrichments.includes(enrichment.id)
              );
              
              // Get color scheme for this category
              const colors = SECTION_COLORS[category.id] || SECTION_COLORS.custom;

              return (
                <div key={category.id} className={`border ${colors.border} rounded-lg overflow-hidden shadow-sm`}>
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full px-4 py-3 ${colors.header} ${colors.headerHover} transition-colors flex items-center justify-between`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-700">
                        {category.icon}
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">{category.title}</h4>
                        <p className="text-sm text-gray-700">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasSelectedEnrichments && (
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                          {categoryEnrichments.filter(e => selectedEnrichments.includes(e.id)).length} selected
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className={`p-4 ${colors.bg} border-t ${colors.border}`}>
                      <div className="grid gap-3">
                        {categoryEnrichments.map((enrichment) => {
                          const isSelected = selectedEnrichments.includes(enrichment.id);
                          const currentRadius = poiRadii[enrichment.id] || enrichment.defaultRadius;

                          return (
                            <div key={enrichment.id} className={`flex items-center justify-between p-3 rounded-lg ${isSelected ? 'bg-white shadow-sm border border-gray-200' : 'bg-white/60 hover:bg-white/80'}`}>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id={enrichment.id}
                                  checked={isSelected}
                                  onChange={() => handleEnrichmentToggle(enrichment.id)}
                                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <div>
                                  <label htmlFor={enrichment.id} className="font-medium text-gray-900 cursor-pointer">
                                    {enrichment.label}
                                  </label>
                                  <p className="text-sm text-gray-700">{enrichment.description}</p>
                                </div>
                              </div>

                              {enrichment.isPOI && isSelected && (
                                <div className="flex flex-col space-y-2">
                                  {/* Radius Note */}
                                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                    ⚠️ Maximum radius: {
                                      enrichment.id === 'poi_earthquakes' ? '25 miles (earthquakes)' :
                                      enrichment.id === 'poi_volcanoes' ? '50 miles (volcanoes)' :
                                      '5 miles'
                                    } (for performance & accuracy)
                                  </div>
                                  
                                  {/* Radius Input */}
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-900 font-medium">Radius:</span>
                                    <input
                                      type="number"
                                      min="0.1"
                                      max={
                                        enrichment.id === 'poi_earthquakes' ? 25 :
                                        enrichment.id === 'poi_volcanoes' ? 50 :
                                        5
                                      }
                                      step="0.1"
                                      value={currentRadius}
                                      onChange={(e) => handleRadiusChange(enrichment.id, parseFloat(e.target.value) || 0)}
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                                    />
                                    <span className="text-sm text-gray-900 font-medium">miles</span>
                                    
                                    {/* Show warning if user tries to exceed the limit */}
                                    {currentRadius > (
                                      enrichment.id === 'poi_earthquakes' ? 25 :
                                      enrichment.id === 'poi_volcanoes' ? 50 :
                                      5
                                    ) && (
                                      <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                                        Capped at {
                                          enrichment.id === 'poi_earthquakes' ? '25' :
                                          enrichment.id === 'poi_volcanoes' ? '50' :
                                          '5'
                                        } miles
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

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
