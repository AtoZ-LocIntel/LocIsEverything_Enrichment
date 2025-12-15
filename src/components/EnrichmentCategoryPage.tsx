import React, { useEffect, useState } from 'react';
import { ArrowLeft, Settings, Check, Search, X } from 'lucide-react';
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

interface EnrichmentCategoryPageProps {
  category: EnrichmentCategory;
  selectedEnrichments: string[];
  poiRadii: Record<string, number>;
  poiYears?: Record<string, number>;
  onSelectionChange: (enrichments: string[]) => void;
  onPoiRadiiChange: (radii: Record<string, number>) => void;
  onPoiYearsChange?: (years: Record<string, number>) => void;
  onBackToConfig: () => void;
}

const EnrichmentCategoryPage: React.FC<EnrichmentCategoryPageProps> = ({
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
    } else if (isAurora) {
      maxRadius = 100;
    } else if (isNYCBusinessImprovementDistricts || isNYCCommunityDistricts) {
      maxRadius = 5;
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
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
  }, []);

  // Get category header color
  const getCategoryColor = () => {
    const colorMap: Record<string, string> = {
      'hazards': '#991b1b',
      'community': '#1e40af',
      'retail': '#6b21a8',
      'health': '#9d174d',
      'transportation': '#3730a3',
      'infrastructure': '#92400e',
      'environment': '#166534',
      'recreation': '#065f46',
      'natural_resources': '#115e59',
      'public_lands': '#365314',
      'quirky': '#9a3412',
      'wildfire': '#dc2626',
      'at': '#166534',
      'pct': '#166534',
      'nh': '#166534',
      'nh_granit': '#166534',
      'ma': '#166534',
      'ma_massgis': '#166534',
      'ri': '#166534',
      'ct': '#166534',
      'ct_geodata_portal': '#166534',
      'ny': '#166534',
      'vt': '#166534',
      'me': '#166534',
      'nj': '#166534',
      'pa': '#166534',
      'de': '#166534',
      'core': '#1e293b'
    };
    return colorMap[category.id] || '#1f2937';
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header 
        className="border-b border-gray-800 px-4 py-4 flex-shrink-0"
        style={{ backgroundColor: getCategoryColor() }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            onClick={onBackToConfig}
            className="p-2 rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-white">{category.title}</h1>
            <p className="text-xs text-white text-opacity-90 mt-0.5">
              {selectedCount} of {filteredEnrichments.length} selected
              {layerSearchQuery && filteredEnrichments.length !== category.enrichments.length && (
                <span className="block text-xs text-white text-opacity-70 mt-0.5">
                  (filtered from {category.enrichments.length})
                </span>
              )}
            </p>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search layers..."
            value={layerSearchQuery}
            onChange={(e) => setLayerSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent"
            style={{ backdropFilter: 'blur(10px)' }}
          />
          {layerSearchQuery && (
            <button
              onClick={() => setLayerSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Content - Mobile Optimized Scrollable */}
      <main
        className="flex-1 overflow-y-auto px-4 py-4 min-h-0 w-full"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        <div className="w-full space-y-4">
          {/* Category Description */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 w-full">
            <h2 className="text-base font-semibold text-white mb-2 break-words">About {category.title}</h2>
            <p className="text-sm text-gray-300 leading-relaxed break-words">{category.description}</p>
          </div>

          {/* Enrichment Options */}
          {filteredEnrichments.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-400 text-base mb-3">No layers found matching &quot;{layerSearchQuery}&quot;</p>
              <button
                onClick={() => setLayerSearchQuery('')}
                className="text-blue-400 hover:text-blue-300 underline text-sm"
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
              
              // Generate radiusOptions dynamically based on maxRadius
              let radiusOptions: number[];
              if (enrichment.id === 'poi_aurora_viewing_sites') {
                radiusOptions = [5, 10, 25, 50, 100];
              } else if (enrichment.id === 'nh_parcels' || enrichment.id === 'nj_parcels' || enrichment.id === 'ireland_pois') {
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
              }
              
              const formatMiles = (value: number) =>
                Number.isInteger(value) ? value.toString() : value.toFixed(1);

              return (
                <div key={enrichment.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3 w-full">
                  {/* Layer Name and Toggle */}
                  <div className="flex items-start gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => handleToggleEnrichment(enrichment.id)}
                      className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'bg-gray-800 border-gray-700'
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-6 h-6 text-white" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor={`checkbox-${enrichment.id}`} 
                        className="text-base font-semibold text-white cursor-pointer block mb-1 break-words"
                        onClick={() => handleToggleEnrichment(enrichment.id)}
                      >
                        {enrichment.label}
                      </label>
                      <p className="text-sm text-gray-300 leading-relaxed break-words">{enrichment.description}</p>
                    </div>
                  </div>

                  {/* POI Radius Configuration */}
                  {enrichment.isPOI && isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="flex items-center space-x-2 mb-3">
                        <Settings className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">Search Radius</span>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm text-gray-300 font-medium block">Radius:</label>
                        <select
                          value={currentRadius}
                          onChange={(e) => handleRadiusChange(enrichment.id, parseFloat(e.target.value))}
                          className="w-full px-3 py-2.5 bg-gray-800 border-2 border-gray-700 rounded-lg text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                          style={{ 
                            backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")", 
                            backgroundPosition: "right 0.75rem center", 
                            backgroundRepeat: "no-repeat", 
                            backgroundSize: "1.25em 1.25em", 
                            paddingRight: "2.75rem"
                          }}
                        >
                          {radiusOptions.map(option => (
                            <option key={option} value={option} className="bg-gray-800 text-white">
                              {formatMiles(option)} {option === 1 ? 'mile' : 'miles'}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-400">
                          {currentRadius === 1 ? '1 mile' : `${formatMiles(currentRadius)} miles`} radius
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Year filter for Chicago 311 */}
                  {enrichment.id === 'chicago_311' && isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <label className="text-sm font-medium text-white block mb-2">
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
                        className="w-full px-3 py-2.5 bg-gray-800 border-2 border-gray-700 rounded-lg text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        style={{ 
                          backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")", 
                          backgroundPosition: "right 0.75rem center", 
                          backgroundRepeat: "no-repeat", 
                          backgroundSize: "1.25em 1.25em", 
                          paddingRight: "2.75rem"
                        }}
                      >
                        <option value="" className="bg-gray-800 text-white">All Years</option>
                        {Array.from({ length: new Date().getFullYear() - 2009 }, (_, i) => {
                          const year = 2010 + i;
                          return (
                            <option key={year} value={year} className="bg-gray-800 text-white">
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Year filter for Chicago Traffic Crashes */}
                  {enrichment.id === 'chicago_traffic_crashes' && isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <label className="text-sm font-medium text-white block mb-2">
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
                        className="w-full px-3 py-2.5 bg-gray-800 border-2 border-gray-700 rounded-lg text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        style={{ 
                          backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")", 
                          backgroundPosition: "right 0.75rem center", 
                          backgroundRepeat: "no-repeat", 
                          backgroundSize: "1.25em 1.25em", 
                          paddingRight: "2.75rem"
                        }}
                      >
                        <option value="" className="bg-gray-800 text-white">All Years</option>
                        {Array.from({ length: new Date().getFullYear() - 2014 }, (_, i) => {
                          const year = 2015 + i;
                          return (
                            <option key={year} value={year} className="bg-gray-800 text-white">
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Selection Summary */}
          {selectedCount > 0 && (
            <div className="mt-6 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
              <h3 className="text-base font-semibold text-blue-300 mb-2">Selection Summary</h3>
              <div className="text-sm text-blue-200">
                <p>You have selected <strong>{selectedCount}</strong> enrichment option{selectedCount !== 1 ? 's' : ''} from {category.title}.</p>
                <p className="mt-2 text-xs">These will be included in your search results and can be downloaded as CSV data.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EnrichmentCategoryPage;

