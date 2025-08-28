import React, { useState, useEffect } from 'react';

interface AlertConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrichmentType: string;
  enrichmentLabel: string;
  currentRadius: number;
}

const AlertConfigModal: React.FC<AlertConfigModalProps> = ({
  isOpen,
  onClose,
  enrichmentType,
  enrichmentLabel,
  currentRadius
}) => {
  const [proximityMiles, setProximityMiles] = useState(currentRadius);
  const [enabled, setEnabled] = useState(false);
  const [existingPreference, setExistingPreference] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Check if preference already exists
      const saved = localStorage.getItem('enrichmentAlerts');
      if (saved) {
        const preferences = JSON.parse(saved);
        const existing = preferences.find((p: any) => p.enrichmentType === enrichmentType);
        if (existing) {
          setExistingPreference(existing);
          setProximityMiles(existing.proximityMiles);
          setEnabled(existing.enabled);
        } else {
          setExistingPreference(null);
          setProximityMiles(currentRadius);
          setEnabled(false);
        }
      } else {
        setExistingPreference(null);
        setProximityMiles(currentRadius);
        setEnabled(false);
      }
    }
  }, [isOpen, enrichmentType, currentRadius]);

  const handleSave = () => {
    const saved = localStorage.getItem('enrichmentAlerts');
    let preferences = saved ? JSON.parse(saved) : [];
    
    if (existingPreference) {
      // Update existing preference
      preferences = preferences.map((p: any) => 
        p.id === existingPreference.id 
          ? { ...p, proximityMiles, enabled }
          : p
      );
    } else {
      // Create new preference
      const newPreference = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        enrichmentType,
        proximityMiles,
        enabled,
        lastTriggered: null,
        notificationCount: 0
      };
      preferences.push(newPreference);
    }
    
    localStorage.setItem('enrichmentAlerts', JSON.stringify(preferences));
    onClose();
  };

  const handleDelete = () => {
    if (existingPreference) {
      const saved = localStorage.getItem('enrichmentAlerts');
      if (saved) {
        let preferences = JSON.parse(saved);
        preferences = preferences.filter((p: any) => p.id !== existingPreference.id);
        localStorage.setItem('enrichmentAlerts', JSON.stringify(preferences));
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🔔 Alert Settings: {enrichmentLabel}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable proximity alerts for {enrichmentLabel.toLowerCase()}
              </span>
            </label>
          </div>

          {enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert me when found within:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0.1"
                  max="25"
                  step="0.1"
                  value={proximityMiles}
                  onChange={(e) => setProximityMiles(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
                  {proximityMiles} mi
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You'll be notified when {enrichmentLabel.toLowerCase()} are found within this distance of your location
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            {existingPreference && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
              >
                Delete Alert
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              {existingPreference ? 'Update' : 'Save'} Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertConfigModal;
