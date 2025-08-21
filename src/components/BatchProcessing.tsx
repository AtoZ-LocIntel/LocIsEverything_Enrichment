import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { EnrichmentResult } from '../App';
import { EnrichmentService } from '../services/EnrichmentService';

interface BatchProcessingProps {
  onComplete: (results: EnrichmentResult[]) => void;
}

interface CSVRow {
  [key: string]: string;
}

const BatchProcessing: React.FC<BatchProcessingProps> = ({ 
  onComplete
}) => {
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: CSVRow[] } | null>(null);
  const [fieldMapping, setFieldMapping] = useState<{
    single?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRow, setCurrentRow] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as CSVRow[];
        setCsvData({ headers, rows });
        setFieldMapping({});
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('Error parsing CSV file. Please check the file format.');
      }
    });
  };

  const buildAddress = (row: CSVRow): string => {
    if (fieldMapping.single) {
      return row[fieldMapping.single] || '';
    }

    const parts = [];
    if (fieldMapping.street && row[fieldMapping.street]) parts.push(row[fieldMapping.street]);
    if (fieldMapping.city && row[fieldMapping.city]) parts.push(row[fieldMapping.city]);
    if (fieldMapping.state && row[fieldMapping.state]) parts.push(row[fieldMapping.state]);
    if (fieldMapping.zip && row[fieldMapping.zip]) parts.push(row[fieldMapping.zip]);
    if (fieldMapping.country && row[fieldMapping.country]) parts.push(row[fieldMapping.country]);
    
    return parts.join(', ');
  };

  const handleStartProcessing = async () => {
    if (!csvData || !csvData.rows.length) return;

    setIsProcessing(true);
    setProgress(0);
    setCurrentRow(0);

    try {
      // Use the real EnrichmentService for batch processing
      const enrichmentService = new EnrichmentService();
      const totalRows = csvData.rows.length;
      const results: EnrichmentResult[] = [];

      for (let i = 0; i < totalRows; i++) {
        setCurrentRow(i + 1);
        setProgress(((i + 1) / totalRows) * 100);

        const row = csvData.rows[i];
        const address = buildAddress(row);

        if (address.trim()) {
          try {
            // Use default enrichments for batch processing
            const defaultEnrichments = ['elev', 'airq', 'fips'];
            const result = await enrichmentService.enrichSingleLocation(address, defaultEnrichments, {});
            results.push(result);
          } catch (error) {
            console.error(`Failed to enrich address: ${address}`, error);
            // Add a placeholder result for failed addresses
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

      onComplete(results);
    } catch (error) {
      console.error('Batch processing failed:', error);
      alert('Batch processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFile = () => {
    setCsvData(null);
    setFieldMapping({});
    setProgress(0);
    setCurrentRow(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-secondary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Batch CSV Processing</h3>
            <p className="text-sm text-gray-600">Upload CSV and process multiple addresses</p>
          </div>
        </div>
      </div>

      <div className="card-body">
        {!csvData ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-primary-600 hover:text-primary-700">
                  Choose CSV file
                </span>
                <span className="block text-sm text-gray-500 mt-1">
                  or drag and drop
                </span>
              </label>
              <input
                id="csv-upload"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            <div className="text-sm text-gray-600 text-center">
              <p>Supported format: CSV with address columns</p>
              <p>Maximum file size: 10MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {csvData.rows.length} rows loaded
                  </span>
                </div>
                <button
                  onClick={resetFile}
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  Change file
                </button>
              </div>
            </div>

            <div>
              <h4 className="form-label">Field Mapping</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Single Address Column
                  </label>
                  <select
                    value={fieldMapping.single || ''}
                    onChange={(e) => setFieldMapping(prev => ({ 
                      ...prev, 
                      single: e.target.value || undefined,
                      street: undefined,
                      city: undefined,
                      state: undefined,
                      zip: undefined,
                      country: undefined
                    }))}
                    className="form-input text-sm"
                  >
                    <option value="">Select column</option>
                    {csvData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
                
                <div className="text-center text-gray-500 text-sm">
                  <span>OR</span>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Street</label>
                    <select
                      value={fieldMapping.street || ''}
                      onChange={(e) => setFieldMapping(prev => ({ ...prev, street: e.target.value || undefined, single: undefined }))}
                      className="form-input text-sm"
                    >
                      <option value="">Select column</option>
                      {csvData.headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <select
                      value={fieldMapping.city || ''}
                      onChange={(e) => setFieldMapping(prev => ({ ...prev, city: e.target.value || undefined, single: undefined }))}
                      className="form-input text-sm"
                    >
                      <option value="">Select column</option>
                      {csvData.headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                    <select
                      value={fieldMapping.state || ''}
                      onChange={(e) => setFieldMapping(prev => ({ ...prev, state: e.target.value || undefined, single: undefined }))}
                      className="form-input text-sm"
                    >
                      <option value="">Select column</option>
                      {csvData.headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ZIP</label>
                    <select
                      value={fieldMapping.zip || ''}
                      onChange={(e) => setFieldMapping(prev => ({ ...prev, zip: e.target.value || undefined, single: undefined }))}
                      className="form-input text-sm"
                    >
                      <option value="">Select column</option>
                      {csvData.headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {isProcessing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing row {currentRow} of {csvData.rows.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-center space-x-2 text-primary-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartProcessing}
                disabled={!Object.values(fieldMapping).some(Boolean)}
                className="btn btn-primary w-full flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Start Batch Processing</span>
              </button>
            )}

            {Object.values(fieldMapping).some(Boolean) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Preview</h5>
                <p className="text-sm text-blue-800">
                  Sample address: {buildAddress(csvData.rows[0]) || 'No address built'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchProcessing;
