import React from 'react';
import { ArrowLeft, Map } from 'lucide-react';
import MapView from './MapView';
import { EnrichmentResult } from '../App';

interface MapPageProps {
  results: EnrichmentResult[];
  onBack: () => void;
  previousViewMode?: string;
}

const MapPage: React.FC<MapPageProps> = ({ results, onBack, previousViewMode }) => {
  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 px-4 py-4 flex items-center space-x-3 flex-shrink-0 z-50">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2 flex-1">
          <Map className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-semibold">Map View</h1>
        </div>
      </header>

      {/* Map Container - Full height, properly constrained like DataSourcesPage */}
      <main 
        className="flex-1 relative min-h-0 overflow-hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="absolute inset-0 w-full h-full">
          <MapView
            results={results}
            onBackToConfig={onBack}
            isMobile={true}
            previousViewMode={previousViewMode}
          />
        </div>
      </main>
    </div>
  );
};

export default MapPage;

