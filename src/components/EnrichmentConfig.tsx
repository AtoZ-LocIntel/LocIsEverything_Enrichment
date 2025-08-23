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
  { id: 'elev', label: 'Elevation', description: 'Terrain elevation in meters', isPOI: false, defaultRadius: 0, category: 'core' },
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
    // Cap radius at 5 miles maximum for performance and accuracy
    const cappedRadius = Math.min(radius, 5);
    onPoiRadiiChange({
      ...poiRadii,
      [enrichmentId]: cappedRadius
    });
  };

  return (
    <div className="enrichment-config">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Enrichment Configuration</h3>
              <p className="text-sm text-gray-700">Select data sources and configure search parameters</p>
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

              return (
                <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
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
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="grid gap-3">
                        {categoryEnrichments.map((enrichment) => {
                          const isSelected = selectedEnrichments.includes(enrichment.id);
                          const currentRadius = poiRadii[enrichment.id] || enrichment.defaultRadius;

                          return (
                            <div key={enrichment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                                    ⚠️ Maximum radius: 5 miles (for performance & accuracy)
                                  </div>
                                  
                                  {/* Radius Input */}
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-900 font-medium">Radius:</span>
                                    <input
                                      type="number"
                                      min="0.1"
                                      max="5"
                                      step="0.1"
                                      value={currentRadius}
                                      onChange={(e) => handleRadiusChange(enrichment.id, parseFloat(e.target.value) || 0)}
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                                    />
                                    <span className="text-sm text-gray-900 font-medium">miles</span>
                                    
                                    {/* Show warning if user tries to exceed 5 miles */}
                                    {currentRadius > 5 && (
                                      <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                                        Capped at 5 miles
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
