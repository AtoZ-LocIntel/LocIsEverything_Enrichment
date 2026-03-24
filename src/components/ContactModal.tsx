import React, { useState } from 'react';
import { X, Mail, Phone, Send, Loader2, CheckCircle } from 'lucide-react';

const CONTACT_EMAIL = 'submit@knowyourlocation.com';
const CONTACT_PHONE_DISPLAY = '603.722.0669';
const CONTACT_PHONE_TEL = '+16037220669';

const contactApiUrl =
  (import.meta.env.VITE_CONTACT_API_URL as string | undefined)?.replace(/\/$/, '') || '/api/contact';

interface ContactModalProps {
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError('Please enter a message.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(contactApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          replyEmail: replyEmail.trim() || undefined,
          message: trimmed,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full my-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <span>Contact Me</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {sent ? (
            <div className="flex flex-col items-center text-center py-6 space-y-3">
              <CheckCircle className="w-14 h-14 text-green-600" aria-hidden />
              <p className="text-gray-900 font-semibold text-lg">Message sent</p>
              <p className="text-gray-700 text-sm leading-relaxed">
                Thank you. Your message was delivered; we&apos;ll get back to you when we can.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-700 text-sm leading-relaxed">
                <span className="font-semibold text-gray-900">The Location Is Everything</span>
                {' — '}call us or send a message below. It is delivered to{' '}
                <span className="font-medium text-gray-900">{CONTACT_EMAIL}</span> and forwarded to our team.
              </p>

              <a
                href={`tel:${CONTACT_PHONE_TEL}`}
                className="flex items-center gap-2 text-base font-semibold text-blue-700 hover:text-blue-900"
              >
                <Phone className="w-5 h-5 flex-shrink-0" />
                {CONTACT_PHONE_DISPLAY}
              </a>

              <div className="space-y-3 pt-2">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-900 mb-1">
                    Your name <span className="text-gray-600 font-normal">(optional)</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-reply" className="block text-sm font-medium text-gray-900 mb-1">
                    Your email <span className="text-gray-600 font-normal">(optional, for a reply)</span>
                  </label>
                  <input
                    id="contact-reply"
                    type="email"
                    value={replyEmail}
                    onChange={(e) => setReplyEmail(e.target.value)}
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-900 mb-1">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px] disabled:opacity-60"
                    placeholder="Write your message here…"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <p className="text-xs text-gray-500">
                Your message is sent securely from this page. If you added an email above, we can reply directly to you.
              </p>
            </>
          )}
        </div>

        {!sent && (
          <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:justify-end flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send message
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
