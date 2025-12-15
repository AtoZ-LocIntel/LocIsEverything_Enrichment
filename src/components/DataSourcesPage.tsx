import React, { useState } from 'react';
import { ArrowLeft, Database, ExternalLink, Search, X, CheckCircle } from 'lucide-react';
import { getDataSources, DataSourceCategory, DataSource } from './DataSourcesView';

interface DataSourcesPageProps {
  onBack: () => void;
}

const DataSourcesPage: React.FC<DataSourcesPageProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const dataSources = getDataSources();

  // Filter data sources based on search query
  const filteredDataSources = searchQuery.trim() === '' 
    ? dataSources 
    : dataSources.map(category => {
        const searchLower = searchQuery.toLowerCase().trim();
        const filteredSources = category.sources.filter(source => {
          const nameLower = source.name.toLowerCase();
          const descriptionLower = source.description.toLowerCase();
          const coverageLower = source.coverage.toLowerCase();
          const accuracyLower = source.accuracy.toLowerCase();
          const costLower = source.cost.toLowerCase();
          const categoryLower = category.category.toLowerCase();
          
          return nameLower.includes(searchLower) ||
                 nameLower.startsWith(searchLower) ||
                 descriptionLower.includes(searchLower) ||
                 coverageLower.includes(searchLower) ||
                 accuracyLower.includes(searchLower) ||
                 costLower.includes(searchLower) ||
                 categoryLower.includes(searchLower);
        });
        return filteredSources.length > 0 
          ? { ...category, sources: filteredSources }
          : null;
      }).filter(category => category !== null) as DataSourceCategory[];

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 px-4 py-4 flex items-center space-x-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2 flex-1">
          <Database className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-semibold">Data Sources & APIs</h1>
        </div>
      </header>

      {/* Search Bar - Mobile Optimized */}
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search data sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content - Mobile Optimized Scrollable */}
      <main
        className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        <div className="max-w-xl mx-auto space-y-6">
          {filteredDataSources.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg mb-2">
                No data sources found matching &quot;{searchQuery}&quot;
              </p>
              <p className="text-gray-500 text-sm">
                Try searching with different keywords
              </p>
            </div>
          ) : (
            filteredDataSources.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-4">
                {/* Category Header */}
                <div className="border-b border-gray-700 pb-2">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Database className="w-5 h-5 text-blue-400" />
                    <span>{category.category}</span>
                  </h2>
                </div>

                {/* Sources List - Simple, readable format */}
                <div className="space-y-4">
                  {category.sources.map((source: DataSource, sourceIndex: number) => (
                    <div 
                      key={sourceIndex} 
                      className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2"
                    >
                      {/* Source Name */}
                      <h3 className="text-base font-semibold text-white">
                        {source.url ? (
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center space-x-1"
                          >
                            <span>{source.name}</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span>{source.name}</span>
                        )}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {source.description}
                      </p>

                      {/* Metadata - Simple list format */}
                      <div className="pt-2 space-y-1 text-xs text-gray-400">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Coverage:</span>
                          <span>{source.coverage}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Accuracy:</span>
                          <span>{source.accuracy}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Cost:</span>
                          <span>{source.cost}</span>
                        </div>
                        <div className="flex items-center space-x-2 pt-1">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span className="text-green-400 font-medium">Available</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Attribution Footer */}
          <div className="pt-6 pb-4 border-t border-gray-800">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-blue-400" />
                <span>Data Usage & Attribution</span>
              </h3>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• All data sources are used in compliance with their respective terms of service</p>
                <p>• Free data sources are prioritized to minimize costs for users</p>
                <p>• Paid APIs are used only when free alternatives are not available</p>
                <p>• Data is cached and rate-limited to respect API quotas</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DataSourcesPage;
