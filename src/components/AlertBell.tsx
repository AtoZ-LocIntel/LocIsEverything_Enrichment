import React, { useState, useEffect } from 'react';

const AlertBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // For MVP, we'll use a simplified version
  useEffect(() => {
    // Check localStorage for any existing alerts
    const saved = localStorage.getItem('enrichmentAlerts');
    if (saved) {
      const alerts = JSON.parse(saved);
      setUnreadCount(alerts.length);
    }
  }, []);

  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('🔔 Notification permission granted');
      }
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
        title="Alert Settings & Notifications"
      >
        <span className="text-xl">🔔</span>
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                🔔 Alert Center
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="text-center text-gray-500">
              <p className="mb-4">Alert system is ready!</p>
              <p className="text-sm mb-4">
                Go to enrichment configuration to set up proximity alerts for any data layer.
              </p>
              <button
                onClick={handleRequestPermission}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Enable browser notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertBell;
