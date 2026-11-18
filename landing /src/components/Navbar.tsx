import React from 'react';

interface NavbarProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onGuestContinue: () => void;
  onContactUs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onGetStarted,
  onLogin,
  onGuestContinue,
  onContactUs,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-900/6 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand mark with star icon */}
        <a
          href="#top"
          className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
        >
          <img
            src="/assets/aistudio/Screenshot_2026-11-18_at_1.12.35_AM_4f655e17.png"
            alt=""
            referrerPolicy="no-referrer"
            className="h-8 w-8 object-contain shrink-0"
          />
          <span>Lilet_r3ad</span>
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#features"
            className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
          >
            Features
          </a>
          <button
            type="button"
            onClick={onContactUs}
            className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
          >
            Contact us
          </button>
          <button
            type="button"
            onClick={onGuestContinue}
            className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
          >
            Guest Space
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
          >
            Log in
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onGetStarted}
            className="min-h-[40px] rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
};
