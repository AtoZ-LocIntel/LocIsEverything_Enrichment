import React, { useState } from 'react';
import { Search, Loader2, Lightbulb, X } from 'lucide-react';

interface SingleSearchProps {
  onSearch: (address: string) => Promise<void>;
  onLocationSearch?: () => Promise<void>;
  isMobile?: boolean;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
}

const SingleSearch: React.FC<SingleSearchProps> = ({ onSearch, onLocationSearch, searchInput, onSearchInputChange, isMobile = false }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [showProTips, setShowProTips] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsLoading(true);
    try {
      await onSearch(searchInput.trim());
    } catch (error) {
      console.error('Search failed:', error);
      // Don't show alert here - let the parent handle it
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="single-search card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg flex items-center justify-center">
                <img 
                  src="/assets/new-logo.webp"
                  alt="The Location Is Everything Co Logo" 
                  className="w-16 h-16 lg:w-20 lg:h-20 object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Quicksand, sans-serif' }}>Single Location Search</h3>
                <p className="text-sm text-gray-200">Search from your location or enter an address</p>
              </div>
            </div>
            
            {/* Pro Tips Lightbulb */}
            <button
              onClick={() => setShowProTips(!showProTips)}
              className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
              title="Pro Tips"
            >
              <Lightbulb className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="address" className="form-label text-white text-sm sm:text-base">
                Search by Address, Zip, City, POI, or Lat/Long
              </label>
              <div className="relative">
                <input
                  id="address"
                  type="text"
                  value={searchInput}
                  onChange={(e) => onSearchInputChange(e.target.value)}
                  placeholder="e.g., 3050 Coast Rd, Santa Cruz, CA 95060"
                  className="form-input text-base pl-12 pr-12"
                  disabled={isLoading}
                />
                <Search className="w-5 h-5 text-gray-400 absolute top-1/2 transform -translate-y-1/2 left-3" />
                
                {/* Clear button - only show when there's text */}
                {searchInput.trim() && (
                  <button
                    type="button"
                    onClick={() => onSearchInputChange('')}
                    className="absolute top-1/2 transform -translate-y-1/2 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear address"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Search by Address Button */}
            <button
              type="submit"
              disabled={!searchInput.trim() || isLoading}
              className="btn btn-primary w-full flex items-center justify-center space-x-2 py-4 text-lg font-semibold mb-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span className="text-sm sm:text-base">Search by Address, Zip, City, POI, or Lat/Long</span>
                </>
              )}
            </button>

            {/* Location Search Button */}
            {onLocationSearch && (
              <button
                type="button"
                onClick={async () => {
                  setIsLocationLoading(true);
                  try {
                    await onLocationSearch();
                  } catch (error) {
                    console.error('Location search failed:', error);
                  } finally {
                    setIsLocationLoading(false);
                  }
                }}
                disabled={isLocationLoading}
                className="btn btn-secondary w-full flex items-center justify-center space-x-2 py-4 text-lg font-semibold"
              >
                {isLocationLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Getting your location...</span>
                  </>
                ) : (
                  <>
                    <span>Search From My Location</span>
                  </>
                )}
              </button>
            )}


          </form>
        </div>
      </div>

      {/* Pro Tips Modal - Outside of card structure */}
      {showProTips && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <span>Pro Tips</span>
              </h3>
              <button
                onClick={() => setShowProTips(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Data Service Disclaimer - At the top */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-700 space-y-2">
                  <p className="font-semibold text-gray-900">
                    ⚠️ Data Service Disclaimer
                  </p>
                  <p>
                    This application leverages <strong>open data services</strong> from various public sources and third-party providers.
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Important:</strong> This application makes <strong>no claim whatsoever</strong> that these services will be working at any given time. We have no control over the availability, reliability, or uptime of these external data services. If a data service is temporarily unavailable or experiencing issues, some enrichment queries may fail.
                  </p>
                </div>
              </div>
              
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Include city and state for better accuracy</li>
                <li>• Use ZIP codes when available</li>
                <li>• Click "Search from my location" to use your current position</li>
                <li>• Results include coordinates, demographics, and nearby POIs</li>
                <li>• Try the pre-filled example: "1600 Pennsylvania Avenue NW, Washington, DC 20500"</li>
              </ul>
              
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  🔧 <strong>Customize your search:</strong> Scroll down to configure which enrichment data to include and set search radii for points of interest
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowProTips(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleSearch;
