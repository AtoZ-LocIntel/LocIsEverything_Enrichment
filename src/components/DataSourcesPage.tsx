import React from 'react';
import { ArrowLeft, Database } from 'lucide-react';
import DataSourcesView from './DataSourcesView';

interface DataSourcesPageProps {
  onBack: () => void;
}

const DataSourcesPage: React.FC<DataSourcesPageProps> = ({ onBack }) => {
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
          <Database className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-semibold">Data Sources & APIs</h1>
        </div>
      </header>

      {/* Content - reuse existing DataSourcesView inside a scrollable area */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        <DataSourcesView onBackToMain={onBack} />
      </main>
    </div>
  );
};

export default DataSourcesPage;


