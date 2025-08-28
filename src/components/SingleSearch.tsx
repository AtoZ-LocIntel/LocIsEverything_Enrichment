import React, { useState } from 'react';
import { Search, MapPin, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface SingleSearchProps {
  onSearch: (address: string) => Promise<void>;
  onLocationSearch?: () => Promise<void>;
  isMobile?: boolean;
}

const SingleSearch: React.FC<SingleSearchProps> = ({ onSearch, onLocationSearch, isMobile = false }) => {
  const [address, setAddress] = useState('1600 Pennsylvania Avenue NW, Washington, DC 20500');
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationButton, setShowLocationButton] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isProTipsExpanded, setIsProTipsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsLoading(true);
    try {
      await onSearch(address.trim());
    } catch (error) {
      console.error('Search failed:', error);
      // Don't show alert here - let the parent handle it
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="single-search card">
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Single Address Search</h3>
            <p className="text-sm text-gray-200">Geocode and enrich a single location</p>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="address" className="form-label text-white">
              Address or Location
            </label>
            <div className="relative">
                             <input
                 id="address"
                 type="text"
                 value={address}
                 onChange={(e) => setAddress(e.target.value)}
                 placeholder="e.g., 123 Main St, Boston, MA 02108"
                 className="form-input text-base pl-12 pr-16"
                 disabled={isLoading}
               />
               <Search className={`w-5 h-5 text-gray-400 absolute top-1/2 transform -translate-y-1/2 ${isMobile ? 'left-3' : 'left-3'}`} />
              
              {/* Location Toggle - Available on all screen sizes */}
              <button
                type="button"
                onClick={() => setShowLocationButton(!showLocationButton)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-primary-600 transition-colors"
                title="Toggle location search"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Location Search Button - Shows when toggle is clicked on all screen sizes */}
          {showLocationButton && onLocationSearch && (
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
              className="btn btn-secondary w-full flex items-center justify-center space-x-2 py-4 text-lg font-semibold mb-3"
            >
              {isLocationLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Getting your location...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  <span>Search from my location</span>
                </>
              )}
            </button>
          )}

          <button
            type="submit"
            disabled={!address.trim() || isLoading}
            className="btn btn-primary w-full flex items-center justify-center space-x-2 py-4 text-lg font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Search & Enrich</span>
              </>
            )}
          </button>
        </form>

        {/* Pro Tips - Collapsible */}
        <div className="mt-6 hidden md:block">
          <button
            onClick={() => setIsProTipsExpanded(!isProTipsExpanded)}
            className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">💡 Pro Tips</span>
            </div>
            {isProTipsExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {isProTipsExpanded && (
            <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Include city and state for better accuracy</li>
                <li>• Use ZIP codes when available</li>
                <li>• Click the location pin icon to search from your current location</li>
                <li>• Results include coordinates, demographics, and nearby POIs</li>
                <li>• Try the pre-filled example: "1600 Pennsylvania Avenue NW, Washington, DC 20500"</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-700">
                  🔧 <strong>Customize your search:</strong> Scroll down to configure which enrichment data to include and set search radii for points of interest
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleSearch;
