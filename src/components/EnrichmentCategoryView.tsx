import React from 'react';
import { ArrowLeft, CheckCircle, Settings } from 'lucide-react';

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
  onSelectionChange: (enrichments: string[]) => void;
  onPoiRadiiChange: (radii: Record<string, number>) => void;
  onBackToConfig: () => void;
}

const EnrichmentCategoryView: React.FC<EnrichmentCategoryViewProps> = ({
  category,
  selectedEnrichments,
  poiRadii,
  onSelectionChange,
  onPoiRadiiChange,
  onBackToConfig
}) => {
  const handleToggleEnrichment = (enrichmentId: string) => {
    const isSelected = selectedEnrichments.includes(enrichmentId);
    if (isSelected) {
      onSelectionChange(selectedEnrichments.filter(id => id !== enrichmentId));
    } else {
      onSelectionChange([...selectedEnrichments, enrichmentId]);
    }
  };

  const handleRadiusChange = (enrichmentId: string, radius: number) => {
    onPoiRadiiChange({
      ...poiRadii,
      [enrichmentId]: radius
    });
  };

  const selectedCount = category.enrichments.filter(e => selectedEnrichments.includes(e.id)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white shadow-lg border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBackToConfig}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Configuration</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{category.icon}</div>
                             <div>
                 <h1 className="text-xl font-bold text-black">{category.title}</h1>
                 <p className="text-sm text-gray-800">{selectedCount} of {category.enrichments.length} selected</p>
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
          {category.enrichments.map((enrichment) => {
            const isSelected = selectedEnrichments.includes(enrichment.id);
            const currentRadius = poiRadii[enrichment.id] || enrichment.defaultRadius || 1;

            return (
              <div key={enrichment.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <input
                          type="checkbox"
                          id={`checkbox-${enrichment.id}`}
                          checked={isSelected}
                          onChange={() => handleToggleEnrichment(enrichment.id)}
                          className="w-5 h-5 text-blue-600 border-2 border-gray-400 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        
                        <div className="flex-1">
                          <label htmlFor={`checkbox-${enrichment.id}`} className="text-lg font-semibold text-black cursor-pointer block">
                            {enrichment.label}
                          </label>
                          <p className="text-gray-800 mt-1">{enrichment.description}</p>
                        </div>
                      </div>

                      {/* POI Radius Configuration */}
                      {enrichment.isPOI && isSelected && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-3">
                            <Settings className="w-4 h-4 text-black" />
                            <span className="font-medium text-black">Search Radius</span>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <label className="text-sm text-black font-medium">Radius:</label>
                            <select
                              value={currentRadius}
                              onChange={(e) => handleRadiusChange(enrichment.id, parseInt(e.target.value))}
                              className="px-3 py-2 border-2 border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium appearance-none"
                              style={{ 
                                backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")", 
                                backgroundPosition: "right 0.5rem center", 
                                backgroundRepeat: "no-repeat", 
                                backgroundSize: "1.5em 1.5em", 
                                paddingRight: "2.5rem" 
                              }}
                            >
                              <option value={0.5}>0.5 miles</option>
                              <option value={1}>1 mile</option>
                              <option value={2}>2 miles</option>
                              <option value={3}>3 miles</option>
                              <option value={5}>5 miles</option>
                              <option value={10}>10 miles</option>
                              <option value={15}>15 miles</option>
                              <option value={25}>25 miles</option>
                            </select>
                            
                            <span className="text-sm text-black font-medium">
                              {currentRadius === 1 ? 'mile' : 'miles'} radius
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
