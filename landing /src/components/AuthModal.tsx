import React, { useState } from 'react';
import { X } from 'lucide-react';
import { UserSession } from '../types/learning';

interface AuthModalProps {
  initialMode: 'login' | 'signup';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: UserSession) => void;
  onGuestContinue: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode,
  isOpen,
  onClose,
  onSuccess,
  onGuestContinue,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && name.trim().length < 2) {
      setError('Please enter your name so we can personalise your space.');
      return;
    }

    const displayName =
      mode === 'signup'
        ? name.trim()
        : trimmedEmail.split('@')[0].replace(/[._-]/g, ' ');

    onSuccess({
      mode: 'account',
      name: displayName,
      email: trimmedEmail,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white p-7 shadow-2xl shadow-blue-950/15">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1.5">
          Lilet_r3ad
        </p>
        <h2
          id="auth-modal-title"
          className="font-display text-2xl font-bold text-slate-900"
        >
          {mode === 'signup' ? 'Create your learning space' : 'Welcome back'}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {mode === 'signup'
            ? 'Organise your ideas, flashcards, and quizzes in one calm spot.'
            : 'Log in to open your saved documents and study progress.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="auth-name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Your name
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ichrak"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {mode === 'signup' ? 'Get Started' : 'Log in'}
          </button>
        </form>

        <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-center text-sm">
          <p className="text-slate-600">
            {mode === 'signup' ? 'Already have an account?' : 'New to Lilet_r3ad?'}{' '}
            <button
              type="button"
              onClick={() => {
                setError('');
                setMode(mode === 'signup' ? 'login' : 'signup');
              }}
              className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              {mode === 'signup' ? 'Log in' : 'Create an account'}
            </button>
          </p>

          <button
            type="button"
            onClick={onGuestContinue}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 hover:underline transition-colors cursor-pointer"
          >
            Or continue as a guest – no account needed!
          </button>
        </div>
      </div>
    </div>
  );
};
