import React, { useState } from 'react';
import { X, Heart, Loader2 } from 'lucide-react';

interface DonateModalProps {
  onClose: () => void;
}

const DonateModal: React.FC<DonateModalProps> = ({ onClose }) => {
  const [amount, setAmount] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stripeProductId = (import.meta.env.VITE_STRIPE_PRODUCT_ID as string) || 'prod_SkMGkZPKW9vqy8';
  const stripePriceId = (import.meta.env.VITE_STRIPE_PRICE_ID as string) || 'price_1RorXmRotI9oY6VZymOygZRt';

  const presetAmounts = [5, 10, 25, 50, 100];

  const handleDonate = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      // Determine the amount
      const donationAmount = amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount);
      
      if (isNaN(donationAmount) || donationAmount <= 0) {
        throw new Error('Please enter a valid donation amount.');
      }

      // Create checkout session via backend API
      const apiEndpoint = (import.meta.env.VITE_STRIPE_CHECKOUT_API as string) || '/api/create-checkout-session';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: donationAmount * 100, // Convert to cents
          currency: 'usd',
          priceId: stripePriceId,
          productId: stripeProductId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create checkout session' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const session = await response.json();
      
      if (session.error) {
        throw new Error(session.error);
      }

      if (!session.url) {
        throw new Error('Invalid response from server. Missing checkout URL.');
      }

      // Redirect directly to Stripe Checkout URL
      // This is the new approach - redirectToCheckout was removed in newer Stripe.js versions
      window.location.href = session.url;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing your donation.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full my-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            <span>Support Our Platform</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
            disabled={isProcessing}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          <div className="space-y-4">
            <p className="text-sm sm:text-base text-gray-600">
              Your donation helps us maintain and improve the Location Enrichment Platform. 
              Thank you for your support!
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select or Enter Amount ($)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setAmount(preset.toString());
                      setCustomAmount('');
                    }}
                    disabled={isProcessing}
                    className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-md border-2 transition-colors text-sm sm:text-base ${
                      amount === preset.toString()
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setAmount('custom');
                    setCustomAmount('');
                  }}
                  disabled={isProcessing}
                  className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-md border-2 transition-colors text-sm sm:text-base ${
                    amount === 'custom'
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  Custom
                </button>
              </div>

              {amount === 'custom' && (
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                  disabled={isProcessing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Footer buttons - Always visible at bottom */}
            <div className="flex space-x-3 pt-4 pb-2">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDonate}
                disabled={isProcessing || (!amount && !customAmount)}
                className="flex-1 px-4 py-3 sm:py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base font-medium"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    <span>Donate</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center pt-2 pb-2">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonateModal;

