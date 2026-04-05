import React, { useEffect } from 'react';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import BatchProcessing, { type BatchFilePersistedState } from './BatchProcessing';

interface BatchProcessingPageProps {
  onBack: () => void;
  batchFile: BatchFilePersistedState;
  onBatchFileChange: Dispatch<SetStateAction<BatchFilePersistedState>>;
  onComplete: (results: any[]) => void;
  selectedEnrichments: string[];
  poiRadii: Record<string, number>;
  onLoadingChange?: (isLoading: boolean) => void;
}

const BatchProcessingPage: React.FC<BatchProcessingPageProps> = ({
  onBack,
  batchFile,
  onBatchFileChange,
  onComplete,
  selectedEnrichments,
  poiRadii,
  onLoadingChange,
}) => {
  useEffect(() => {
    onBatchFileChange((prev) => ({ ...prev, isExpanded: true }));
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [onBatchFileChange]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-black border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3 className="w-5 h-5 text-blue-400 shrink-0" />
          <h1 className="text-lg font-semibold truncate">Batch Processing</h1>
        </div>
      </header>

      <main className="flex-1 px-2 sm:px-4 md:px-6 pb-8 pt-4">
        <div className="max-w-2xl mx-auto w-full">
          <BatchProcessing
            batchFile={batchFile}
            onBatchFileChange={onBatchFileChange}
            onComplete={onComplete}
            selectedEnrichments={selectedEnrichments}
            poiRadii={poiRadii}
            onLoadingChange={onLoadingChange}
          />
        </div>
      </main>
    </div>
  );
};

export default BatchProcessingPage;
