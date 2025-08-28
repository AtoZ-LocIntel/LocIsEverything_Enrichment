import React, { useState, useEffect } from 'react';
import AdminAuth from './AdminAuth';
import CustomPOIUpload from './CustomPOIUpload';
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

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [showPOIUpload, setShowPOIUpload] = useState(false);
  const [customPOIs, setCustomPOIs] = useState<POIConfig[]>([]);

  useEffect(() => {
    // Check if admin is already authenticated
    const adminAuth = localStorage.getItem('adminAuthenticated');
    const email = localStorage.getItem('adminEmail');
    
    if (adminAuth === 'true' && email) {
      setIsAuthenticated(true);
      setAdminEmail(email);
      loadCustomPOIs();
    }
  }, []);

  const loadCustomPOIs = () => {
    const allPOIs = poiConfigManager.getAllPOITypes();
    const customPOIsList = allPOIs.filter(poi => poiConfigManager.isCustomPOI(poi.id));
    setCustomPOIs(customPOIsList);
  };

  const handleAuthenticated = (email: string) => {
    setIsAuthenticated(true);
    setAdminEmail(email);
    setShowAuth(false);
    loadCustomPOIs();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminEmail');
    setIsAuthenticated(false);
    setAdminEmail('');
    setCustomPOIs([]);
  };

  const handlePOIAdded = (poi: CustomPOI) => {
    // Refresh the custom POIs list from the configuration manager
    loadCustomPOIs();
    
    // Trigger a custom event to notify other components about the new POI
    window.dispatchEvent(new CustomEvent('customPOIAdded', { detail: poi }));
    
    // You could also trigger a UI refresh here to show the new POI in the main enrichment config
  };

  const handleDeletePOI = (poiId: string) => {
    if (confirm('Are you sure you want to delete this custom POI type? This will remove it from the system.')) {
      poiConfigManager.removeCustomPOI(poiId);
      setCustomPOIs(prev => prev.filter(poi => poi.id !== poiId));
    }
  };

  if (showAuth) {
    return (
      <AdminAuth
        onAuthenticated={handleAuthenticated}
        onCancel={() => setShowAuth(false)}
      />
    );
  }

  if (showPOIUpload) {
    return (
      <CustomPOIUpload
        onPOIAdded={handlePOIAdded}
        onClose={() => setShowPOIUpload(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl text-purple-600">🔒</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
                {isAuthenticated && (
                  <p className="text-sm text-gray-600">Logged in as {adminEmail}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-800 transition-colors flex items-center space-x-2"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
          </div>

          {!isAuthenticated ? (
            /* Not Authenticated - Show Login */
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-gray-400">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin Access Required</h3>
              <p className="text-gray-600 mb-6">
                You need to authenticate to access admin tools and manage custom POI types.
              </p>
              <button
                onClick={() => setShowAuth(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <span>🔐</span>
                <span>Login to Admin</span>
              </button>
            </div>
          ) : (
            /* Authenticated - Show Admin Tools */
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg text-blue-600">💾</span>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Custom POI Types</p>
                      <p className="text-2xl font-bold text-blue-900">{customPOIs.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg text-green-600">👥</span>
                    </div>
                    <div>
                      <p className="text-sm text-green-600">Active Admin</p>
                      <p className="text-lg font-semibold text-green-900">{adminEmail}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg text-purple-600">⚙️</span>
                    </div>
                    <div>
                      <p className="text-sm text-purple-600">System Status</p>
                      <p className="text-lg font-semibold text-purple-900">Active</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowPOIUpload(true)}
                    className="p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-left group"
                  >
                    <div className="flex items-center space-x-3">
                                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                          <span className="text-lg text-purple-600">📤</span>
                        </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Upload Custom POI Data</h4>
                        <p className="text-sm text-gray-600">Add new POI types from CSV files</p>
                      </div>
                    </div>
                  </button>

                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg text-gray-400">⚙️</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-500">System Configuration</h4>
                        <p className="text-sm text-gray-400">Coming soon...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom POI Types List */}
              {customPOIs.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom POI Types</h3>
                  <div className="space-y-3">
                    {customPOIs.map(poi => (
                      <div key={poi.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                              {poi.section}
                            </span>
                            <h4 className="font-medium text-gray-900">{poi.label}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{poi.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Default radius: {poi.defaultRadius} miles
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePOI(poi.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documentation */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium text-blue-900 mb-2">💡 How to Use Custom POI Types</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Upload CSV files with your custom POI data</p>
                  <p>• Map CSV columns to name, address, and coordinates</p>
                  <p>• New POI types automatically appear in the enrichment configuration</p>
                  <p>• Users can search for your custom POI types with configurable proximity</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
