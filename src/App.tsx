import { useState } from 'react';
import Header from './components/Header';
import SingleSearch from './components/SingleSearch';
import BatchProcessing from './components/BatchProcessing';
import MapView from './components/MapView';
import EnrichmentConfig from './components/EnrichmentConfig';
import { EnrichmentService } from './services/EnrichmentService';
import { GeocodeResult } from './lib/types';

export type ViewMode = 'config' | 'map';

export interface EnrichmentResult {
  location: GeocodeResult;
  enrichments: Record<string, any>;
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('config');
  const [enrichmentResults, setEnrichmentResults] = useState<EnrichmentResult[]>([]);
  const [selectedEnrichments, setSelectedEnrichments] = useState<string[]>(['elev', 'airq', 'fips']);
  const [poiRadii, setPoiRadii] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const handleSingleSearch = async (address: string) => {
    try {
      setError(null);
      const enrichmentService = new EnrichmentService();
      const result = await enrichmentService.enrichSingleLocation(address, selectedEnrichments, poiRadii);
      setEnrichmentResults([result]);
      setViewMode('map');
    } catch (error) {
      console.error('Single search failed:', error);
      setError(error instanceof Error ? error.message : 'Search failed. Please try again.');
      // Don't show alert - just set error state
    }
  };

  const handleBatchComplete = (results: EnrichmentResult[]) => {
    setEnrichmentResults(results);
    setViewMode('map');
    
    // Automatically download CSV after batch processing completes
    if (results.length > 0) {
      setTimeout(() => {
        downloadBatchResults(results);
      }, 1000); // Small delay to ensure map is loaded
    }
  };

  const downloadBatchResults = (results: EnrichmentResult[]) => {
    if (!results.length) return;

    // Convert results to CSV format
    const headers = ['Address', 'Latitude', 'Longitude', 'Source', 'Confidence'];
    const enrichmentKeys = new Set<string>();
    
    results.forEach(result => {
      Object.keys(result.enrichments).forEach(key => enrichmentKeys.add(key));
    });

    const allHeaders = [...headers, ...Array.from(enrichmentKeys)];
    
    const csvContent = [
      allHeaders.join(','),
      ...results.map(result => {
        const row = [
          result.location.name,
          result.location.lat,
          result.location.lon,
          result.location.source,
          result.location.confidence
        ];
        
        enrichmentKeys.forEach(key => {
          row.push(result.enrichments[key] || '');
        });
        
        return row.join(',');
      })
    ].join('\n');

    // Create and download file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_enrichment_results_${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBackToConfig = () => {
    setViewMode('config');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {viewMode === 'config' ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gradient mb-4">
              Advanced Location Intelligence
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Professional geocoding and enrichment platform with multi-source data integration. 
              Single address lookup or batch CSV processing with comprehensive location insights.
            </p>
            <p className="text-lg text-primary-400 font-medium mt-4">
              Powered by The Location Is Everything Co
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

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <SingleSearch onSearch={handleSingleSearch} />
            <BatchProcessing onComplete={handleBatchComplete} />
          </div>

          <EnrichmentConfig
            selectedEnrichments={selectedEnrichments}
            onSelectionChange={setSelectedEnrichments}
            poiRadii={poiRadii}
            onPoiRadiiChange={setPoiRadii}
          />
        </div>
      ) : (
        <MapView
          results={enrichmentResults}
          onBackToConfig={handleBackToConfig}
        />
      )}
    </div>
  );
}

export default App;
