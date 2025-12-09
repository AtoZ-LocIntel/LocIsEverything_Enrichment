import React, { useState } from 'react';
import { X, Send, Link as LinkIcon, FileText, Mail } from 'lucide-react';

interface AddSourceFormProps {
  onClose: () => void;
}

const AddSourceForm: React.FC<AddSourceFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    description: '',
    dataType: '', // e.g., 'Feature Service', 'Map Service', 'API', etc.
    coverage: '', // e.g., 'California', 'Nationwide', etc.
    contactEmail: '', // Optional: user's email for follow-up
    additionalInfo: '' // Any additional notes
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.url.trim()) {
      setErrorMessage('Please provide a URL for the data source');
      return false;
    }
    if (!formData.name.trim()) {
      setErrorMessage('Please provide a name for the data source');
      return false;
    }
    if (!formData.description.trim()) {
      setErrorMessage('Please provide a description');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Format email content
      const emailSubject = `New Data Source Submission: ${formData.name}`;
      const emailBody = `
New Data Source Submission from KnowYourLocation.com

Source Name: ${formData.name}
URL: ${formData.url}
Description: ${formData.description}
Data Type: ${formData.dataType || 'Not specified'}
Coverage: ${formData.coverage || 'Not specified'}
Contact Email: ${formData.contactEmail || 'Not provided'}

Additional Information:
${formData.additionalInfo || 'None provided'}

---
Submitted via KnowYourLocation.com Add A Source form
      `.trim();

      // Use FormSubmit (free, no signup required) to send email directly
      // This sends emails directly to submit@knowyourlocation.com without opening email client
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('email', 'submit@knowyourlocation.com');
        formDataToSend.append('subject', emailSubject);
        formDataToSend.append('message', emailBody);
        formDataToSend.append('_captcha', 'false'); // Disable captcha for better UX
        formDataToSend.append('_template', 'table'); // Use table template for better formatting
        formDataToSend.append('_next', window.location.href); // Redirect back after submission
        
        console.log('📧 Attempting to send email via FormSubmit to submit@knowyourlocation.com');
        
        const response = await fetch('https://formsubmit.co/submit@knowyourlocation.com', {
          method: 'POST',
          body: formDataToSend
        });

        console.log('📧 FormSubmit response status:', response.status);

        if (response.ok || response.status === 200 || response.status === 302) {
          console.log('✅ Email sent successfully via FormSubmit');
          setSubmitStatus('success');
          setIsSubmitting(false);
          
          // Reset form but keep it open so user can see success message
          setFormData({
            url: '',
            name: '',
            description: '',
            dataType: '',
            coverage: '',
            contactEmail: '',
            additionalInfo: ''
          });
          return;
        } else {
          const responseText = await response.text();
          console.warn('⚠️ FormSubmit returned non-OK status:', response.status, responseText);
          throw new Error(`Submission failed with status ${response.status}`);
        }
      } catch (formsubmitError) {
        console.warn('⚠️ FormSubmit failed, using mailto fallback:', formsubmitError);
        
        // Fallback to mailto link (works without any setup)
        const mailtoLink = `mailto:submit@knowyourlocation.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        
        console.log('📧 Opening mailto link as fallback');
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Set success status but keep form open so user can see feedback
        setTimeout(() => {
          setSubmitStatus('success');
          setIsSubmitting(false);
          
          // Reset form but keep it open
          setFormData({
            url: '',
            name: '',
            description: '',
            dataType: '',
            coverage: '',
            contactEmail: '',
            additionalInfo: ''
          });
        }, 500);
      }

    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit. Please try again or email submit@knowyourlocation.com directly.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add A Source</h2>
                <p className="text-sm text-gray-600">Submit a new data source for consideration</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Field */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="w-4 h-4 inline mr-1" />
                Data Source URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://services.arcgis.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Enter the full URL to the data source (Feature Service, Map Service, API endpoint, etc.)</p>
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Source Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., CA Wildfire Perimeters"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe what this data source contains and how it could be useful..."
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Data Type Field */}
            <div>
              <label htmlFor="dataType" className="block text-sm font-medium text-gray-700 mb-2">
                Data Type
              </label>
              <select
                id="dataType"
                name="dataType"
                value={formData.dataType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="">Select data type...</option>
                <option value="ArcGIS Feature Service">ArcGIS Feature Service</option>
                <option value="ArcGIS Map Service">ArcGIS Map Service</option>
                <option value="REST API">REST API</option>
                <option value="WMS/WFS Service">WMS/WFS Service</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Coverage Field */}
            <div>
              <label htmlFor="coverage" className="block text-sm font-medium text-gray-700 mb-2">
                Geographic Coverage
              </label>
              <input
                type="text"
                id="coverage"
                name="coverage"
                value={formData.coverage}
                onChange={handleChange}
                placeholder="e.g., California, Nationwide, Los Angeles County"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>

            {/* Contact Email Field */}
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Your Email (Optional)
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
              <p className="mt-1 text-xs text-gray-500">Optional: Provide your email if you'd like us to follow up with you</p>
            </div>

            {/* Additional Info Field */}
            <div>
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Information
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                rows={3}
                placeholder="Any additional details, use cases, or notes..."
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errorMessage}
              </div>
            )}

            {/* Success Message */}
            {submitStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">✓</span>
                  <span>Thank you! Your submission has been sent. We'll review it and get back to you soon.</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSourceForm;

