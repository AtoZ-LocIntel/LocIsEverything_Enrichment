import React, { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

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
            <h3 className="text-lg font-semibold text-gray-900">Single Address Search</h3>
            <p className="text-sm text-gray-700">Geocode and enrich a single location</p>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="address" className="form-label">
              Address or Location
            </label>
            <div className="relative">
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 123 Main St, Boston, MA 02108"
                className={`form-input text-base ${isMobile ? 'pr-16' : 'pl-10'}`}
                disabled={isLoading}
              />
              <Search className={`w-5 h-5 text-gray-400 absolute top-1/2 transform -translate-y-1/2 ${isMobile ? 'left-3' : 'left-3'}`} />
              
              {/* Location Toggle - Mobile Only */}
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setShowLocationButton(!showLocationButton)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-primary-600 transition-colors"
                  title="Toggle location search"
                >
                  <MapPin className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Location Search Button - Shows when toggle is clicked */}
          {isMobile && showLocationButton && onLocationSearch && (
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

        {/* Pro Tips - Hidden on Mobile for cleaner experience */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 hidden md:block">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Include city and state for better accuracy</li>
            <li>• Use ZIP codes when available</li>
            <li>• Results include coordinates, demographics, and nearby POIs</li>
            <li>• Try the pre-filled example: "1600 Pennsylvania Avenue NW, Washington, DC 20500"</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              🔧 <strong>Customize your search:</strong> Scroll down to configure which enrichment data to include and set search radii for points of interest
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleSearch;
