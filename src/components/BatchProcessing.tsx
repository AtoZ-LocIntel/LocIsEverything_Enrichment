import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle, Clock, Zap, Info } from 'lucide-react';
import Papa from 'papaparse';

interface BatchProcessingProps {
  onComplete: (results: any[]) => void;
  selectedEnrichments: string[];
  poiRadii: Record<string, number>;
}

const BatchProcessing: React.FC<BatchProcessingProps> = ({ onComplete, selectedEnrichments, poiRadii }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAddress, setCurrentAddress] = useState('');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [totalAddresses, setTotalAddresses] = useState(0);
  const [showRateLimitInfo, setShowRateLimitInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const addresses = results.data
            .map((row: any) => Object.values(row)[0])
            .filter((address: any) => address && typeof address === 'string' && address.trim())
            .map((address: any) => address as string);

          if (addresses.length > 0) {
            processBatch(addresses);
          }
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    });
  };

  const processBatch = async (addresses: string[]) => {
    setIsProcessing(true);
    setProgress(0);
    setTotalAddresses(addresses.length);
    setEstimatedTimeRemaining(0);

    try {
      const { EnrichmentService } = await import('../services/EnrichmentService');
      const enrichmentService = new EnrichmentService();
      
      const results: any[] = [];
      
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        setCurrentAddress(address);
        setProgress(((i + 1) / addresses.length) * 100);
        
        // Calculate estimated time remaining based on number of enrichments
        const baseTimePerAddress = 0.8; // base geocoding time
        const enrichmentTime = selectedEnrichments.length * 0.3; // additional time per enrichment
        const estimatedTimePerAddress = baseTimePerAddress + enrichmentTime;
        const remainingAddresses = addresses.length - i - 1;
        const estimatedSeconds = remainingAddresses * estimatedTimePerAddress;
        setEstimatedTimeRemaining(estimatedSeconds);

        if (address.trim()) {
          try {
            const result = await enrichmentService.enrichSingleLocation(address, selectedEnrichments, poiRadii);
            results.push(result);
          } catch (error) {
            console.error(`Failed to enrich address: ${address}`, error);
            results.push({
              location: {
                source: 'Failed',
                lat: 0,
                lon: 0,
                name: address,
                confidence: 0,
                raw: {}
              },
              enrichments: { error: 'Geocoding failed' }
            });
          }
        }
      }

      setProgress(100);
      setIsProcessing(false);
      onComplete(results);
    } catch (error) {
      console.error('Batch processing failed:', error);
      setIsProcessing(false);
      alert('Batch processing failed. Please try again.');
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)} seconds`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)} minutes`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Batch CSV Processing</h3>
          <p className="text-sm text-gray-700">Upload CSV and process multiple addresses</p>
        </div>
      </div>

      {/* Rate Limit Information */}
      <div className="mb-4">
        <button
          onClick={() => setShowRateLimitInfo(!showRateLimitInfo)}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          <Info className="w-4 h-4" />
          <span>View Rate Limits & Performance Info</span>
        </button>
        
        {showRateLimitInfo && (
          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Rate Limits & Performance</span>
            </h4>
            <div className="text-sm text-blue-800 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Nominatim (OSM):</span>
                <span>1 request/second (global coverage)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">US Census:</span>
                <span>10 requests/second (US addresses only)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">GeoNames:</span>
                <span>4 requests/second (geographic database)</span>
              </div>
                             <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                 <strong>Processing Time:</strong> ~{Math.round((0.8 + selectedEnrichments.length * 0.3) * 10) / 10}s per address (includes rate limiting delays)
               </div>
            </div>
          </div>
        )}
      </div>

      {!isProcessing ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 mb-2">Upload your CSV file</p>
            <p className="text-sm text-gray-500 mb-4">
              File should contain addresses in the first column
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-primary"
            >
              Choose CSV File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Batch Size Guidelines */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span>Batch Size Guidelines</span>
            </h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>• <strong>1-100 addresses:</strong> 1-2 minutes processing time</div>
              <div>• <strong>100-500 addresses:</strong> 2-8 minutes processing time</div>
              <div>• <strong>500+ addresses:</strong> 8+ minutes processing time</div>
              <div className="text-xs text-gray-700 mt-2">
                💡 Large batches are supported but will take longer due to rate limiting
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Enrichment Configuration</span>
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• <strong>Customize your batch:</strong> Scroll down to select which data sources to include</div>
              <div>• <strong>Set search radii:</strong> Configure how far to search for points of interest</div>
              <div>• <strong>Data sources:</strong> Choose from 50+ enrichment options including demographics, POIs, and specialized data</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Processing addresses...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Processing: {currentAddress}
                </p>
                <p className="text-xs text-blue-700">
                  {Math.round(progress * totalAddresses / 100)} of {totalAddresses} addresses
                </p>
              </div>
            </div>
          </div>

          {/* Time Estimates */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Estimated time remaining: {formatTime(estimatedTimeRemaining)}
                </p>
                                 <p className="text-xs text-green-700">
                   Total estimated time: {formatTime(totalAddresses * (0.8 + selectedEnrichments.length * 0.3))}
                 </p>
              </div>
            </div>
          </div>

          {/* Processing Info */}
          <div className="text-center text-sm text-gray-700">
            <p>⏳ Rate limiting is active to respect API limits</p>
            <p>📊 Progress is saved - you can safely leave this page</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProcessing;
