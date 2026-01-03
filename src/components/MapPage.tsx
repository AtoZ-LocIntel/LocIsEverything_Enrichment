import React from 'react';
// Mobile map should be full-screen; navigation is handled via an overlay inside MapView.
import MapView from './MapView';
import { EnrichmentResult } from '../App';

interface MapPageProps {
  results: EnrichmentResult[];
  onBack: () => void;
  previousViewMode?: string;
  poiRadii?: Record<string, number>;
}

const MapPage: React.FC<MapPageProps> = ({ results, onBack, previousViewMode, poiRadii }) => {
  return (
    <div
      className="mobile-map-page bg-black text-white overflow-hidden"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100dvh',
      }}
    >
      <main className="absolute inset-0 overflow-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
        <MapView
          results={results}
          onBackToConfig={onBack}
          isMobile={true}
          previousViewMode={previousViewMode}
          poiRadii={poiRadii}
        />
      </main>
    </div>
  );
};

export default MapPage;

