import React from 'react';
// Mobile map should be full-screen; navigation is handled via an overlay inside MapView.
import MapView from './MapView';
import { EnrichmentResult } from '../App';

interface MapPageProps {
  results: EnrichmentResult[];
  onBack: () => void;
  previousViewMode?: string;
}

const MapPage: React.FC<MapPageProps> = ({ results, onBack, previousViewMode }) => {
  return (
    <div
      className="mobile-map-page h-screen bg-black text-white flex flex-col overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Map Container - Full height, properly constrained like DataSourcesPage */}
      <main 
        className="flex-1 relative min-h-0 overflow-hidden"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          height: '100%',
          width: '100%'
        }}
      >
        <div 
          className="w-full h-full min-h-0"
          style={{
            height: '100%',
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
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

