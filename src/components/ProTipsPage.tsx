import React from 'react';
import { Lightbulb, Database, ArrowLeft } from 'lucide-react';

interface ProTipsPageProps {
  onBack: () => void;
  onViewDataSources: () => void;
}

const ProTipsPage: React.FC<ProTipsPageProps> = ({ onBack, onViewDataSources }) => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 px-4 py-4 flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <h1 className="text-lg font-semibold">Pro Tips</h1>
        </div>
      </header>

      {/* Content */}
      <main
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        <div className="max-w-xl mx-auto space-y-4">
          {/* Data Sources CTA */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">
                  View Data Sources & APIs
                </span>
              </div>
              <p className="text-xs text-gray-700">
                Browse all data sources and APIs used in this platform, including coverage,
                accuracy, and attribution details.
              </p>
              <button
                onClick={onViewDataSources}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Database className="w-4 h-4" />
                <span>Open Data Sources</span>
              </button>
            </div>
          </div>

          {/* Data Service Disclaimer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-gray-700 space-y-2">
              <p className="font-semibold text-gray-900">
                ⚠️ Data Service Disclaimer
              </p>
              <p>
                This application leverages <strong>open data services</strong> from various public
                sources and third-party providers.
              </p>
              <p className="text-xs text-gray-600">
                <strong>Important:</strong> This application makes <strong>no claim whatsoever</strong>{' '}
                that these services will be working at any given time. We have no control over the
                availability, reliability, or uptime of these external data services. If a data
                service is temporarily unavailable or experiencing issues, some enrichment queries
                may fail.
              </p>
            </div>
          </div>

          {/* Tips List */}
          <ul className="text-sm text-gray-200 space-y-2">
            <li>• Include city and state for better accuracy</li>
            <li>• Use ZIP codes when available</li>
            <li>• Click &quot;Search from my location&quot; to use your current position</li>
            <li>• Results include coordinates, demographics, and nearby POIs</li>
            <li>• Try the pre-filled example: &quot;1600 Pennsylvania Avenue NW, Washington, DC 20500&quot;</li>
          </ul>

          <div className="pt-3 border-t border-gray-800">
            <p className="text-xs text-gray-400">
              🔧 <strong>Customize your search:</strong> Scroll down on the main page to configure which
              enrichment data to include and set search radii for points of interest.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProTipsPage;