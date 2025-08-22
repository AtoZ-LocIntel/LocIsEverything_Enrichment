import React, { useState, useRef } from 'react';
import { poiConfigManager, POIConfig } from '../lib/poiConfig';

interface CustomPOI {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lon?: number;
  category: string;
  section: string;
  description: string;
  defaultRadius: number;
}

interface CustomPOIUploadProps {
  onPOIAdded: (poi: CustomPOI) => void;
  onClose: () => void;
}

const CustomPOIUpload: React.FC<CustomPOIUploadProps> = ({ onPOIAdded, onClose }) => {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [newSection, setNewSection] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [defaultRadius, setDefaultRadius] = useState(5);
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get existing sections from POI configuration manager
  const existingSections = poiConfigManager.getAllSections().map(section => section.id);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row;
          });

        setCsvHeaders(headers);
        setCsvData(data);
        setMapping({
          name: headers.find(h => h.toLowerCase().includes('name')) || headers[0],
          address: headers.find(h => h.toLowerCase().includes('address')) || headers[1],
          lat: headers.find(h => h.toLowerCase().includes('lat')) || '',
          lon: headers.find(h => h.toLowerCase().includes('lon')) || ''
        });
        setError('');
      } catch (err) {
        setError('Error parsing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!newSection || !newCategory || !description) {
      setError('Please fill in all required fields.');
      return;
    }

    if (csvData.length === 0) {
      setError('Please upload a CSV file first.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Create the new POI type using the POI configuration manager
      const newPOI: POIConfig = {
        id: `poi_${newCategory.toLowerCase().replace(/\s+/g, '_')}`,
        label: newCategory,
        description,
        isPOI: true,
        defaultRadius,
        category: newCategory,
        section: newSection,
        csvMapping: mapping,
        csvData: csvData
      };

      // Add to POI configuration manager (this will persist to localStorage)
      poiConfigManager.addCustomPOI(newPOI);

      // Notify parent component
      onPOIAdded({
        id: newPOI.id,
        name: newPOI.label,
        address: '',
        category: newPOI.category,
        section: newPOI.section,
        description: newPOI.description,
        defaultRadius: newPOI.defaultRadius
      });
      
      // Show success message
      setSuccess(`✅ Successfully created "${newCategory}" POI type with ${csvData.length} locations!`);
      setError('');
      
      // Close modal after 2 seconds to show success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Error saving POI type. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setMapping({});
    setNewSection('');
    setNewCategory('');
    setDefaultRadius(5);
    setDescription('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <span className="text-2xl text-purple-600">📤</span>
              <span>Upload Custom POI Data</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

                     {/* Summary Section */}
           {csvData.length > 0 && (
             <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
               <h3 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                 <span>📊</span>
                 <span>POI Type Summary</span>
               </h3>
               <div className="grid md:grid-cols-3 gap-4 text-sm">
                 <div>
                   <span className="font-medium text-blue-800">CSV Records:</span>
                   <span className="ml-2 text-blue-600">{csvData.length} locations</span>
                 </div>
                 <div>
                   <span className="font-medium text-blue-800">Section:</span>
                   <span className="ml-2 text-blue-600">{newSection || 'Not set'}</span>
                 </div>
                 <div>
                   <span className="font-medium text-blue-800">Category:</span>
                   <span className="ml-2 text-blue-600">{newCategory || 'Not set'}</span>
                 </div>
               </div>
             </div>
           )}

           <div className="grid lg:grid-cols-2 gap-6">
             {/* Left Column - File Upload & Mapping */}
             <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <span className="text-lg text-blue-600">📄</span>
                  <span>1. Upload CSV File</span>
                </h3>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors text-gray-900"
                />
                
                {csvData.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                      ✅ Uploaded {csvData.length} records
                    </p>
                  </div>
                )}
              </div>

              {csvHeaders.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <span className="text-lg text-green-600">📍</span>
                    <span>2. Map CSV Columns</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name Column
                      </label>
                      <select
                        value={mapping.name || ''}
                        onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                      >
                        {csvHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Column
                      </label>
                      <select
                        value={mapping.address || ''}
                        onChange={(e) => setMapping({ ...mapping, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                      >
                        {csvHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Latitude Column (optional)
                        </label>
                        <select
                          value={mapping.lat || ''}
                          onChange={(e) => setMapping({ ...mapping, lat: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                        >
                          <option value="">No latitude column</option>
                          {csvHeaders.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Longitude Column (optional)
                        </label>
                        <select
                          value={mapping.lon || ''}
                          onChange={(e) => setMapping({ ...mapping, lon: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                        >
                          <option value="">No longitude column</option>
                          {csvHeaders.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - POI Configuration */}
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <span className="text-lg text-purple-600">⚙️</span>
                  <span>3. Configure POI Type</span>
                </h3>
                
                                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Section <span className="text-red-500">*</span>
                     </label>
                     <div className="flex space-x-2">
                       <select
                         value={newSection}
                         onChange={(e) => setNewSection(e.target.value)}
                         className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                       >
                         <option value="">Select or create new...</option>
                         {existingSections.map(section => (
                           <option key={section} value={section}>
                             {section.charAt(0).toUpperCase() + section.slice(1)}
                           </option>
                         ))}
                       </select>
                       <input
                         type="text"
                         placeholder="New section name"
                         value={newSection}
                         onChange={(e) => setNewSection(e.target.value)}
                         className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                       />
                     </div>
                   </div>

                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Category Name <span className="text-red-500">*</span>
                     </label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g., Farmers Markets, Local Breweries"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                    />
                  </div>

                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Description <span className="text-red-500">*</span>
                     </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of this POI type"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Search Radius (miles)
                    </label>
                    <input
                      type="number"
                      value={defaultRadius}
                      onChange={(e) => setDefaultRadius(Number(e.target.value))}
                      min="0.1"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>

                             {error && (
                 <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                   <p className="text-sm text-red-600">{error}</p>
                 </div>
               )}

               {success && (
                 <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                   <div className="flex items-center space-x-3">
                     <span className="text-2xl">🎉</span>
                     <div>
                       <p className="text-sm font-medium text-green-800">{success}</p>
                       <p className="text-xs text-green-600 mt-1">This POI type is now available in your enrichment configuration!</p>
                     </div>
                   </div>
                 </div>
               )}

                             <div className="flex space-x-3">
                 <button
                   type="button"
                   onClick={resetForm}
                   className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                 >
                   Reset
                 </button>
                 <button
                   onClick={handleSave}
                   disabled={isProcessing || !newSection || !newCategory || !description || csvData.length === 0}
                   className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-semibold text-lg py-3"
                 >
                   {isProcessing ? (
                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                   ) : (
                     <>
                       <span className="mr-2">💾</span>
                       <span>Save & Create POI Type</span>
                     </>
                   )}
                 </button>
               </div>
            </div>
          </div>

          {/* Preview Section */}
          {csvData.length > 0 && (
            <div className="mt-6 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">CSV Preview (First 5 rows)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {csvHeaders.map(header => (
                        <th key={header} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b">
                        {csvHeaders.map(header => (
                          <td key={header} className="px-3 py-2 text-gray-600">
                            {row[header] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomPOIUpload;
