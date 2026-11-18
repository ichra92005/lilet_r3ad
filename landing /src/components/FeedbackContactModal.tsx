import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Linkedin,
  Mail,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';

interface FeedbackContactModalProps {
  initialTab: 'feedback' | 'contact';
  isOpen: boolean;
  onClose: () => void;
}

const OWNER_EMAIL = 'ichraknour22@gmail.com';

export const FeedbackContactModal: React.FC<FeedbackContactModalProps> = ({
  initialTab,
  isOpen,
  onClose,
}) => {
  const [showFeedbackWindow, setShowFeedbackWindow] = useState(
    initialTab === 'feedback'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setShowFeedbackWindow(initialTab === 'feedback');
    setError('');
    setSubmitted(false);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const buildMailtoHref = () => {
    const subject = encodeURIComponent(
      `Lilet_r3ad Feedback from ${name.trim() || 'A Learner'}`
    );
    const body = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nFeedback:\n${message.trim()}`
    );
    return `mailto:${OWNER_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (message.trim().length < 5) {
      setError('Please write your feedback before sending.');
      return;
    }

    const mailtoLink = document.createElement('a');
    mailtoLink.href = buildMailtoHref();
    mailtoLink.click();

    setSubmitted(true);
  };

  const resetAndClose = () => {
    setName('');
    setEmail('');
    setMessage('');
    setError('');
    setSubmitted(false);
    setShowFeedbackWindow(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-contact-title"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white p-7 shadow-2xl shadow-blue-950/15">
        <button
          type="button"
          onClick={resetAndClose}
          aria-label="Close dialog"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {!showFeedbackWindow ? (
          /* Contact hub: LinkedIn button + Feedback button */
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1.5">
                Lilet_r3ad
              </p>
              <h2
                id="feedback-contact-title"
                className="font-display text-2xl font-bold text-slate-900"
              >
                Contact Us
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Connect on LinkedIn or send feedback directly to my email.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 min-h-[48px] rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-3 text-sm font-semibold text-slate-800 hover:border-blue-400 hover:bg-blue-50/60 hover:text-blue-700 transition-colors"
              >
                <Linkedin className="h-4 w-4 shrink-0" />
                <span>LinkedIn</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSubmitted(false);
                  setShowFeedbackWindow(true);
                }}
                className="inline-flex items-center justify-center gap-2.5 min-h-[48px] rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span>Feedback</span>
              </button>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Direct email</span>
              <a
                href={`mailto:${OWNER_EMAIL}`}
                className="inline-flex items-center gap-1.5 font-medium text-blue-700 hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>{OWNER_EMAIL}</span>
              </a>
            </div>
          </div>
        ) : submitted ? (
          /* Confirmation window after sending feedback to mail */
          <div className="py-5 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2
                id="feedback-contact-title"
                className="font-display text-xl font-bold text-slate-900"
              >
                Thank you for your feedback!
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Your email app should open with your message addressed to{' '}
                <span className="font-semibold text-slate-800">{OWNER_EMAIL}</span>.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <a
                href={buildMailtoHref()}
                className="inline-flex items-center gap-1.5 min-h-[42px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Open Email App</span>
              </a>
              <button
                type="button"
                onClick={resetAndClose}
                className="min-h-[42px] rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Feedback composer window to send to owner's email */
          <div>
            <button
              type="button"
              onClick={() => setShowFeedbackWindow(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>

            <h2
              id="feedback-contact-title"
              className="font-display text-2xl font-bold text-slate-900"
            >
              Send Feedback
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Your feedback goes straight to{' '}
              <span className="font-medium text-slate-800">{OWNER_EMAIL}</span>.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5" noValidate>
              <div>
                <label
                  htmlFor="fc-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Your name
                </label>
                <input
                  id="fc-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="fc-email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Your email
                </label>
                <input
                  id="fc-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="fc-message"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Your feedback
                </label>
                <textarea
                  id="fc-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your thoughts or suggestions..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Send Feedback to Email</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
