import React, { useState } from 'react';

// TODO: Replace 'your-email@example.com' with your actual email address for admin access

interface AdminAuthProps {
  onAuthenticated: (email: string) => void;
  onCancel: () => void;
}

const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthenticated, onCancel }) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Simple admin credentials (in production, this could be encrypted or stored more securely)
  const ADMIN_CREDENTIALS = [
    { email: 'admin@locationmart.com', pin: '1234' },
    { email: 'atoz@locationmart.com', pin: '5678' },
    // Hardcoded access for AtoZgis@gmail.com
    { email: 'AtoZgis@gmail.com', pin: '7770' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const isValid = ADMIN_CREDENTIALS.some(
      cred => cred.email.toLowerCase() === email.toLowerCase() && cred.pin === pin
    );

    if (isValid) {
      // Store admin session in localStorage
      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('adminEmail', email);
      onAuthenticated(email);
    } else {
      setError('Invalid email or PIN. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-purple-600">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
          <p className="text-gray-600 mt-2">Enter your credentials to access admin tools</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
              placeholder="admin@locationmart.com"
              required
            />
          </div>

          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
              Admin PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                placeholder="Enter PIN"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPin ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="mr-2">🔐</span>
                  Access Admin
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-700">
            <strong>Demo Credentials:</strong><br />
            Email: admin@locationmart.com | PIN: 1234<br />
            Email: atoz@locationmart.com | PIN: 5678<br />
            Email: AtoZgis@gmail.com | PIN: 7770
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
