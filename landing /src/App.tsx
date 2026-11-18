import React, { useState } from 'react';
import {
  ArrowRight,
  Linkedin,
  Mail,
  MessageSquare,
  MousePointer2,
  Send,
} from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { FeatureBentoSection } from './components/FeatureBentoSection';
import { FeedbackContactModal } from './components/FeedbackContactModal';
import { LearningWorkspace } from './components/LearningWorkspace';
import { Navbar } from './components/Navbar';
import { SLOGANS } from './data/starterData';
import { UserSession, WorkspaceTab } from './types/learning';

export default function App() {
  const [view, setView] = useState<'landing' | 'workspace'>('landing');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('documents');
  const [session, setSession] = useState<UserSession>({
    mode: 'guest',
    name: 'Guest Learner',
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackModalTab, setFeedbackModalTab] = useState<'feedback' | 'contact'>('feedback');
  const [sloganIndex, setSloganIndex] = useState(0);
  const [bgLoaded, setBgLoaded] = useState(true);

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const openFeedbackContact = (tab: 'feedback' | 'contact') => {
    setFeedbackModalTab(tab);
    setFeedbackModalOpen(true);
  };

  const enterGuestSpace = (tab: WorkspaceTab = 'documents') => {
    setSession({ mode: 'guest', name: 'Guest Learner' });
    setWorkspaceTab(tab);
    setAuthModalOpen(false);
    setView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (userSession: UserSession) => {
    setSession(userSession);
    setAuthModalOpen(false);
    setView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="top" className="relative min-h-screen overflow-x-clip text-slate-900">
      {/* Blurred ___3__26dcc747.jpeg pastel background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-sky-100 via-white to-amber-50">
        {bgLoaded && (
          <img
            src="/assets/aistudio/___3__26dcc747.jpeg"
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBgLoaded(false)}
            className="h-full w-full object-cover scale-110 blur-2xl opacity-85"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/35 to-white/60" />
      </div>

      {view === 'workspace' ? (
        <LearningWorkspace
          session={session}
          initialTab={workspaceTab}
          onBackToLanding={() => setView('landing')}
        />
      ) : (
        <>
          <Navbar
            onGetStarted={() => openAuthModal('signup')}
            onLogin={() => openAuthModal('login')}
            onGuestContinue={() => enterGuestSpace('documents')}
            onContactUs={() => openFeedbackContact('contact')}
          />

          <main>
            {/* Clean, minimalist Hero with two-section container */}
            <section className="mx-auto max-w-6xl px-6 pt-12 pb-16 sm:pt-16 sm:pb-20">
              <div className="rounded-[32px] border border-white/80 bg-white/55 backdrop-blur-xl p-8 sm:p-12 shadow-[0_20px_50px_-15px_rgba(37,99,235,0.12)]">
                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-8">
                  {/* First section: hero text & actions */}
                  <div className="md:col-span-8">
                    <div className="flex flex-col items-start text-left">
                      <div className="mb-6">
                        <div className="inline-flex items-center gap-2.5">
                          <img
                            src="/assets/aistudio/Screenshot_2026-11-18_at_1.12.35_AM_4f655e17.png"
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-7 w-7 object-contain shrink-0"
                          />
                          <p className="font-display text-sm font-bold tracking-tight text-blue-700">
                            Lilet_r3ad
                          </p>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 mt-1.5">
                          YOUR LEARNING SPACE
                        </p>
                      </div>

                      {/* Main Title with signature selection bounding box around "Create" */}
                      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12] text-balance">
                        Learn,{' '}
                        <span className="relative inline-block px-2.5 py-0.5 mx-0.5 border-2 border-indigo-500 bg-white/80 text-blue-600 rounded-sm">
                          Create
                          <span
                            aria-hidden="true"
                            className="absolute -top-1.5 -left-1.5 h-2.5 w-2.5 bg-white border-2 border-indigo-500"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 bg-white border-2 border-indigo-500"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute -bottom-1.5 -left-1.5 h-2.5 w-2.5 bg-white border-2 border-indigo-500"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute -bottom-1.5 -right-1.5 h-2.5 w-2.5 bg-white border-2 border-indigo-500"
                          />
                          <MousePointer2
                            aria-hidden="true"
                            className="absolute -bottom-5 -right-4 h-6 w-6 fill-slate-900 text-white drop-shadow-sm"
                          />
                        </span>{' '}
                        &amp; Grow!
                      </h1>

                      <p className="mt-6 max-w-xl text-base sm:text-lg text-slate-700 leading-relaxed">
                        Your little space to organise your ideas, study smarter and make learning easier.
                      </p>

                      {/* Primary CTA + Clean Text Links */}
                      <div className="mt-9 flex flex-col items-start gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <button
                            type="button"
                            onClick={() => openAuthModal('signup')}
                            className="inline-flex items-center gap-2.5 min-h-[48px] rounded-2xl bg-blue-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.99] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                          >
                            <span>Get Started</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => enterGuestSpace('documents')}
                            className="inline-flex items-center min-h-[48px] rounded-2xl border border-white/90 bg-white/80 backdrop-blur-md px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-white hover:border-blue-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          >
                            Or continue as a guest – no account needed!
                          </button>
                        </div>

                        <p className="text-sm text-slate-700">
                          Already have an account?{' '}
                          <button
                            type="button"
                            onClick={() => openAuthModal('login')}
                            className="font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                          >
                            Log in
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Second section: smaller star mascot next to text */}
                  <div className="md:col-span-4 flex items-center justify-center">
                    <img
                      src="/assets/aistudio/Screenshot_2026-11-18_at_1.12.35_AM_4f655e17.png"
                      alt="Lilet_r3ad smiling star mascot"
                      referrerPolicy="no-referrer"
                      className="w-36 sm:w-44 lg:w-48 h-auto object-contain drop-shadow-[0_14px_24px_rgba(37,99,235,0.14)] shrink-0"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Clean Horizontal Editorial Strip (directly echoing the middle bar of img_(1).jpeg) */}
            <section
              aria-label="Study workspace highlights"
              className="border-y border-slate-900/6 bg-white/75 backdrop-blur-md"
            >
              <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="font-display text-sm font-bold text-slate-900 whitespace-nowrap">
                  Lilet_r3ad · Learning Space
                </span>

                <button
                  type="button"
                  onClick={() => setSloganIndex((i) => (i + 1) % SLOGANS.length)}
                  title="Click to cycle study slogans"
                  className="text-xs sm:text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors cursor-pointer text-center"
                >
                  “{SLOGANS[sloganIndex]}”
                </button>

                {/* LinkedIn, Email, Leave Feedback & Contact Us actions */}
                <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
                  <a
                    href="https://www.linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="inline-flex items-center gap-1.5 min-h-[36px] rounded-lg border border-slate-300/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    <span>LinkedIn</span>
                  </a>

                  <a
                    href="mailto:ichraknour22@gmail.com"
                    aria-label="Email"
                    className="inline-flex items-center gap-1.5 min-h-[36px] rounded-lg border border-slate-300/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => openFeedbackContact('feedback')}
                    className="inline-flex items-center gap-1.5 min-h-[36px] rounded-lg border border-slate-300/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Leave Feedback</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openFeedbackContact('contact')}
                    className="inline-flex items-center gap-1.5 min-h-[36px] rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Contact Us</span>
                  </button>
                </div>
              </div>
            </section>

            {/* "Everything you need in one place" Asymmetric Interactive Bento Section */}
            <FeatureBentoSection onOpenTool={(tab) => enterGuestSpace(tab)} />

            {/* Final Conversion Callout */}
            <section className="mx-auto max-w-6xl px-6 pb-20">
              <div className="rounded-[32px] border border-white/80 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 p-8 sm:p-12 text-white shadow-[0_24px_60px_-15px_rgba(37,99,235,0.32)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="max-w-xl space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                    Small steps, big progress
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance">
                    Ready to build your calm study space?
                  </h2>
                  <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                    Organise your documents, flip through flashcards, test yourself with quizzes, and watch your progress grow.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAuthModal('signup')}
                    className="min-h-[46px] rounded-2xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-sm hover:bg-sky-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Get Started
                  </button>
                  <button
                    type="button"
                    onClick={() => enterGuestSpace('documents')}
                    className="min-h-[46px] rounded-2xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Or continue as a guest – no account needed!
                  </button>
                </div>
              </div>
            </section>
          </main>

          {/* Quiet Editorial Footer */}
          <footer className="border-t border-slate-900/6 bg-white/65 backdrop-blur-md">
            <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/aistudio/Screenshot_2026-11-18_at_1.12.35_AM_4f655e17.png"
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-6 w-6 object-contain shrink-0"
                />
                <span className="font-display font-bold text-slate-900">Lilet_r3ad</span>
                <span aria-hidden="true">·</span>
                <span className="text-xs uppercase tracking-wider text-slate-500">
                  Your Learning Space
                </span>
              </div>

              <p className="text-sm font-medium text-slate-700 text-center">
                Made with ♡ by Ichrak Nour Elhouda Belkhla
              </p>

              <div className="flex items-center gap-5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="hover:text-slate-950 transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => enterGuestSpace('documents')}
                  className="hover:text-slate-950 transition-colors cursor-pointer"
                >
                  Guest Space
                </button>
              </div>
            </div>
          </footer>
        </>
      )}

      <AuthModal
        initialMode={authModalMode}
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onGuestContinue={() => enterGuestSpace('documents')}
      />

      <FeedbackContactModal
        initialTab={feedbackModalTab}
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />
    </div>
  );
}
