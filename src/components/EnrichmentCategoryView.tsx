import React, { useEffect, useState } from 'react';
import { ArrowLeft, Settings, Check } from 'lucide-react';
import { poiConfigManager } from '../lib/poiConfig';

interface EnrichmentItem {
  id: string;
  label: string;
  description: string;
  isPOI: boolean;
  defaultRadius?: number;
  category?: string;
}

interface EnrichmentCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  enrichments: EnrichmentItem[];
}

interface EnrichmentCategoryViewProps {
  category: EnrichmentCategory;
  selectedEnrichments: string[];
  poiRadii: Record<string, number>;
  poiYears?: Record<string, number>;
  onSelectionChange: (enrichments: string[]) => void;
  onPoiRadiiChange: (radii: Record<string, number>) => void;
  onPoiYearsChange?: (years: Record<string, number>) => void;
  onBackToConfig: () => void;
}

const EnrichmentCategoryView: React.FC<EnrichmentCategoryViewProps> = ({
  category,
  selectedEnrichments,
  poiRadii,
  poiYears = {},
  onSelectionChange,
  onPoiRadiiChange,
  onPoiYearsChange,
  onBackToConfig
}) => {
  const [layerSearchQuery, setLayerSearchQuery] = useState<string>('');
  
  // Filter enrichments based on search query
  const filteredEnrichments = layerSearchQuery.trim() === '' 
    ? category.enrichments 
    : category.enrichments.filter(e => 
        e.label.toLowerCase().includes(layerSearchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(layerSearchQuery.toLowerCase()) ||
        e.id.toLowerCase().includes(layerSearchQuery.toLowerCase())
      );
  
  const handleToggleEnrichment = (enrichmentId: string) => {
    const isSelected = selectedEnrichments.includes(enrichmentId);
    if (isSelected) {
      onSelectionChange(selectedEnrichments.filter(id => id !== enrichmentId));
    } else {
      onSelectionChange([...selectedEnrichments, enrichmentId]);
    }
  };

  const handleRadiusChange = (enrichmentId: string, radius: number) => {
    // Get maxRadius from POI config
    const poiConfig = poiConfigManager.getPOIType(enrichmentId);
    const isAurora = enrichmentId === 'poi_aurora_viewing_sites';
    const isNYCBusinessImprovementDistricts = enrichmentId === 'nyc_business_improvement_districts';
    const isNYCCommunityDistricts = enrichmentId === 'nyc_community_districts';
    const minRadius = isAurora ? 5 : 0.5;
    
    // Use maxRadius from POI config if available, otherwise fallback to hardcoded values
    let maxRadius = 25; // Default fallback
    if (poiConfig?.maxRadius) {
      maxRadius = poiConfig.maxRadius;
      console.log(`🔍 DEBUG EnrichmentCategoryView: Found maxRadius=${maxRadius} for ${enrichmentId} from poiConfig`);
    } else if (isAurora) {
      maxRadius = 100;
    } else if (isNYCBusinessImprovementDistricts || isNYCCommunityDistricts) {
      maxRadius = 5;
    } else {
      console.warn(`⚠️ DEBUG EnrichmentCategoryView: No maxRadius found for ${enrichmentId}, using default 25`);
    }
    
    const normalizedRadius = Math.max(minRadius, Math.min(radius, maxRadius));

    onPoiRadiiChange({
      ...poiRadii,
      [enrichmentId]: normalizedRadius
    });
  };

  const selectedCount = filteredEnrichments.filter(e => selectedEnrichments.includes(e.id)).length;

  // Scroll to top when component mounts
  useEffect(() => {
    // Force scroll to top immediately
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Also try after a small delay to ensure DOM is ready
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div 
        className="shadow-lg border-b border-gray-300 sticky top-0 z-50"
        style={{
          backgroundColor: category.id === 'hazards' ? '#991b1b' :
                          category.id === 'community' ? '#1e40af' :
                          category.id === 'education' ? '#1e40af' :
                          category.id === 'health' ? '#9d174d' :
                          category.id === 'transportation' ? '#3730a3' :
                          category.id === 'infrastructure' ? '#92400e' :
                          category.id === 'food_beverage' ? '#dc2626' :
                          category.id === 'government' ? '#1e3a8a' :
                          category.id === 'religious_community' ? '#7c2d12' :
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
                          category.id === 'ma' ? '#166534' :
                          category.id === 'ma_massgis' ? '#166534' :
                          category.id === 'ri' ? '#166534' :
                          category.id === 'ct' ? '#166534' :
                          category.id === 'ct_geodata_portal' ? '#166534' :
                          category.id === 'ny' ? '#166534' :
                          category.id === 'vt' ? '#166534' :
                          category.id === 'me' ? '#166534' :
                          category.id === 'nj' ? '#166534' :
                          category.id === 'pa' ? '#166534' :
                          category.id === 'de' ? '#166534' :
                          category.id === 'core' ? '#1e293b' : '#1f2937'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 sm:gap-4 h-16">
            <button
              onClick={onBackToConfig}
              className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors font-semibold text-sm sm:text-base flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">Back to Configuration</span>
            </button>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-2 sm:mx-4" style={{ minWidth: '200px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  fontSize: '16px', 
                  zIndex: 10, 
                  pointerEvents: 'none',
                  color: '#9ca3af'
                }}>🔍</span>
                <input
                  id="layer-search-input"
                  type="text"
                  placeholder="Search layers..."
                  value={layerSearchQuery}
                  onChange={(e) => setLayerSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%',
                    backgroundColor: '#ffffff',
                    paddingLeft: '36px',
                    paddingRight: layerSearchQuery ? '36px' : '12px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '400',
                    color: '#111827',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                />
                {layerSearchQuery && (
                  <button
                    onClick={() => setLayerSearchQuery('')}
                    type="button"
                    style={{ 
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#6b7280',
                      padding: '4px',
                      zIndex: 10
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="text-right">
                <h1 className="text-sm sm:text-base font-bold text-white leading-tight">{category.title}</h1>
                <p className="text-xs text-white text-opacity-90 leading-tight">
                  {selectedCount} of {filteredEnrichments.length} selected
                  {layerSearchQuery && filteredEnrichments.length !== category.enrichments.length && (
                    <span className="block text-xs text-white text-opacity-70 mt-0.5">
                      (filtered from {category.enrichments.length})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Category Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 mt-4">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-black mb-2">About {category.title}</h2>
            <p className="text-gray-800">{category.description}</p>
          </div>
        </div>

        {/* Enrichment Options */}
        <div className="space-y-4">
          {filteredEnrichments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600 text-lg">No layers found matching "{layerSearchQuery}"</p>
              <button
                onClick={() => setLayerSearchQuery('')}
                className="mt-4 text-blue-600 hover:text-blue-800 underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredEnrichments.map((enrichment) => {
            const isSelected = selectedEnrichments.includes(enrichment.id);
            const currentRadius = poiRadii[enrichment.id] || enrichment.defaultRadius || 1;
            // Get maxRadius from POI config
            const poiConfig = poiConfigManager.getPOIType(enrichment.id);
            const maxRadius = poiConfig?.maxRadius || 25;
            
            console.log(`🔍 DEBUG EnrichmentCategoryView: enrichment.id=${enrichment.id}, poiConfig.maxRadius=${poiConfig?.maxRadius}, using maxRadius=${maxRadius}`);
            
            // Generate radiusOptions dynamically based on maxRadius, but keep special cases
            let radiusOptions: number[];
            if (enrichment.id === 'poi_aurora_viewing_sites') {
              radiusOptions = [5, 10, 25, 50, 100];
            } else if (enrichment.id === 'nh_parcels' || enrichment.id === 'nj_parcels' || enrichment.id === 'ireland_pois' || enrichment.id === 'uk_nspl_postcode_centroids' || enrichment.id === 'us_national_grid_100m' || enrichment.id === 'dc_trees') {
              radiusOptions = [0.25, 0.50, 0.75, 1.0];
            } else if (enrichment.id === 'nh_nwi_plus' || enrichment.id === 'ma_dep_wetlands' || enrichment.id === 'ma_open_space' || enrichment.id === 'cape_cod_zoning') {
              radiusOptions = [0.1, 0.25, 0.5, 0.75, 1.0];
            } else if (enrichment.id === 'nh_dot_roads' || enrichment.id === 'nh_railroads' || enrichment.id === 'nh_transmission_pipelines' || enrichment.id === 'ma_trails') {
              radiusOptions = [0.5, 1, 2.5, 5, 10];
            } else if (enrichment.id === 'ma_lakes_and_ponds') {
              radiusOptions = [0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0];
            } else if (enrichment.id === 'chicago_311' || enrichment.id === 'chicago_building_footprints' || enrichment.id === 'houston_site_addresses') {
              radiusOptions = [0.25, 0.50, 0.75, 1.0];
            } else if (enrichment.id === 'nyc_bike_routes' || enrichment.id === 'nyc_business_improvement_districts' || enrichment.id === 'nyc_community_districts') {
              radiusOptions = [0.5, 1.0, 2.5, 5.0];
            } else {
              // Generate options dynamically based on maxRadius
              const baseOptions = [0.5, 1, 2, 3, 5, 10, 15];
              if (maxRadius > 25) {
                // Add options up to maxRadius
                if (maxRadius >= 50) {
                  radiusOptions = [...baseOptions, 25, 50];
                  if (maxRadius >= 75) radiusOptions.push(75);
                  if (maxRadius >= 100) radiusOptions.push(100);
                } else {
                  radiusOptions = [...baseOptions, 25, maxRadius];
                }
              } else {
                radiusOptions = baseOptions.filter(opt => opt <= maxRadius);
                if (maxRadius > 15 && !radiusOptions.includes(maxRadius)) {
                  radiusOptions.push(maxRadius);
                }
              }
              radiusOptions.sort((a, b) => a - b);
              console.log(`🔍 DEBUG EnrichmentCategoryView: Generated radiusOptions=${JSON.stringify(radiusOptions)} for maxRadius=${maxRadius}`);
            }
            const formatMiles = (value: number) =>
              Number.isInteger(value) ? value.toString() : value.toFixed(1);

            return (
              <div key={enrichment.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-col sm:grid sm:grid-cols-[auto,1fr] sm:items-start gap-3 mb-3">
                        <button
                          type="button"
                          onClick={() => handleToggleEnrichment(enrichment.id)}
                          className={`w-4 h-5 sm:w-4 sm:h-4 border-2 border-gray-400 rounded flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                            isSelected 
                              ? 'bg-black border-black' 
                              : 'bg-white border-gray-400'
                          }`}
                          style={{ 
                            marginTop: '2px',
                            position: 'relative',
                            zIndex: 1
                          }}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0 w-full text-left space-y-1">
                          <label 
                            htmlFor={`checkbox-${enrichment.id}`} 
                            className="text-lg font-semibold text-black cursor-pointer block"
                            onClick={() => handleToggleEnrichment(enrichment.id)}
                          >
                            {enrichment.label}
                          </label>
                          <p className="text-gray-800 mt-1">{enrichment.description}</p>
                        </div>
                      </div>

                      {/* POI Radius Configuration */}
                      {enrichment.isPOI && isSelected && (
                        <div className="mt-4 p-4 sm:p-4 -mx-2 sm:mx-0 bg-gray-50 rounded-lg overflow-hidden">
                          <div className="flex items-center space-x-2 mb-3">
                            <Settings className="w-4 h-4 text-black" />
                            <span className="font-medium text-black">Search Radius</span>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <label className="text-sm text-black font-medium whitespace-nowrap flex-shrink-0">Radius:</label>
                            <div className="flex-1 min-w-0 w-full sm:w-auto">
                              <select
                                value={currentRadius}
                                onChange={(e) => handleRadiusChange(enrichment.id, parseFloat(e.target.value))}
                                className="w-full sm:w-auto min-w-[120px] max-w-full px-3 py-2 border-2 border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium appearance-none"
                                style={{ 
                                  backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")", 
                                  backgroundPosition: "right 0.5rem center", 
                                  backgroundRepeat: "no-repeat", 
                                  backgroundSize: "1.5em 1.5em", 
                                  paddingRight: "2.5rem",
                                  boxSizing: "border-box"
                                }}
                              >
                                {radiusOptions.map(option => (
                                  <option key={option} value={option}>
                                    {formatMiles(option)} {option === 1 ? 'mile' : 'miles'}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <span className="text-sm text-black font-medium whitespace-nowrap flex-shrink-0">
                              {currentRadius === 1 ? 'mile' : 'miles'} radius
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Year filter for Chicago 311 */}
                      {enrichment.id === 'chicago_311' && isSelected && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <label className="text-sm font-medium text-black block mb-2">
                            Year Filter (Created Date):
                          </label>
                          <select
                            value={poiYears[enrichment.id] || ''}
                            onChange={(e) => {
                              if (onPoiYearsChange) {
                                const newPoiYears = { ...poiYears };
                                if (e.target.value) {
                                  newPoiYears[enrichment.id] = parseInt(e.target.value, 10);
                                } else {
                                  delete newPoiYears[enrichment.id];
                                }
                                onPoiYearsChange(newPoiYears);
                              }
                            }}
                            className="w-full sm:w-auto min-w-[150px] px-3 py-2 border-2 border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium appearance-none"
                            style={{ 
                              backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")", 
                              backgroundPosition: "right 0.5rem center", 
                              backgroundRepeat: "no-repeat", 
                              backgroundSize: "1.5em 1.5em", 
                              paddingRight: "2.5rem",
                              boxSizing: "border-box"
                            }}
                          >
                            <option value="">All Years</option>
                            {Array.from({ length: new Date().getFullYear() - 2009 }, (_, i) => {
                              const year = 2010 + i;
                              return (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      {/* Year filter for Chicago Traffic Crashes */}
                      {enrichment.id === 'chicago_traffic_crashes' && isSelected && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <label className="text-sm font-medium text-black block mb-2">
                            Year Filter (Crash Date):
                          </label>
                          <select
                            value={poiYears[enrichment.id] || ''}
                            onChange={(e) => {
                              if (onPoiYearsChange) {
                                const newPoiYears = { ...poiYears };
                                if (e.target.value) {
                                  newPoiYears[enrichment.id] = parseInt(e.target.value, 10);
                                } else {
                                  delete newPoiYears[enrichment.id];
                                }
                                onPoiYearsChange(newPoiYears);
                              }
                            }}
                            className="w-full sm:w-auto min-w-[150px] px-3 py-2 border-2 border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium appearance-none"
                            style={{ 
                              backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")", 
                              backgroundPosition: "right 0.5rem center", 
                              backgroundRepeat: "no-repeat", 
                              backgroundSize: "1.5em 1.5em", 
                              paddingRight: "2.5rem",
                              boxSizing: "border-box"
                            }}
                          >
                            <option value="">All Years</option>
                            {Array.from({ length: new Date().getFullYear() - 2014 }, (_, i) => {
                              const year = 2015 + i;
                              return (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>

        {/* Selection Summary */}
        {selectedCount > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Selection Summary</h3>
            <div className="text-blue-800">
              <p>You have selected <strong>{selectedCount}</strong> enrichment option{selectedCount !== 1 ? 's' : ''} from {category.title}.</p>
              <p className="mt-2 text-sm">These will be included in your search results and can be downloaded as CSV data.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrichmentCategoryView;
