import React from 'react';
import { WorkspaceTab } from '../types/learning';

interface FeatureBentoSectionProps {
  onOpenTool: (tab: WorkspaceTab) => void;
}

interface StudyFeatureCard {
  id: WorkspaceTab;
  title: string;
  description: string;
  surfaceClass: string;
}

const FEATURE_CARDS: StudyFeatureCard[] = [
  {
    id: 'documents',
    title: 'Create and organise your documents.',
    description:
      'Keep lecture notes, reading summaries, and fresh ideas sorted in neat topic folders without clutter.',
    surfaceClass: 'bg-gradient-to-br from-[#DCEBFF] to-[#EBF3FF]',
  },
  {
    id: 'flashcards',
    title: 'Make flashcards to remember more.',
    description:
      'Turn key concepts into clean double-sided cards for calm, active recall sessions every day.',
    surfaceClass: 'bg-gradient-to-br from-[#E2E4FF] to-[#EFF0FF]',
  },
  {
    id: 'quizzes',
    title: 'Create quizzes and test yourself.',
    description:
      'Check what stuck before study milestones with bite-sized self-quizzes and instant feedback.',
    surfaceClass: 'bg-gradient-to-br from-[#FFEBD9] to-[#FFF6E5]',
  },
];

export const FeatureBentoSection: React.FC<FeatureBentoSectionProps> = ({
  onOpenTool,
}) => {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-xl text-center mb-14 sm:mb-16">
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
          Everything you need in one place
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
          Organise your ideas, build flashcards to remember more, and test yourself in one calm learning space.
        </p>
      </div>

      {/* Playful tall rounded pastel cards inspired by reference layout */}
      <div
        id="preview"
        className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-7 md:gap-6 items-start pb-6"
      >
        {FEATURE_CARDS.map((card, idx) => {
          const isMiddleCard = idx === 1;
          const isLastCard = idx === 2;

          return (
            <article key={card.id} className="relative flex">
              {/* Soft mint-lime pastel backing card peeking behind the tilted middle card */}
              {isMiddleCard && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-[#D4F8E8] to-[#EAFCD4] -rotate-[5deg] -translate-x-2 -translate-y-2 shadow-sm"
                />
              )}

              {/* Soft pastel thunder bolt accent on the top-left corner of the 3rd card */}
              {isLastCard && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 64 64"
                  className="pointer-events-none absolute -top-6 -left-3 z-20 h-14 w-14 -rotate-6 drop-shadow-sm"
                >
                  <defs>
                    <linearGradient id="softPastelThunder" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FDE68A" />
                      <stop offset="55%" stopColor="#FDBA74" />
                      <stop offset="100%" stopColor="#F9A8D4" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M36 6 L15 35 C14 36.5 15 38.5 17 38.5 H29 L24 56 C23.5 58 26 59 27.5 57.5 L49 28.5 C50 27 49 25 47 25 H35 L40 7.5 C40.5 5.5 37.5 4.5 36 6 Z"
                    fill="url(#softPastelThunder)"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              <button
                type="button"
                onClick={() => onOpenTool(card.id)}
                className={`group relative z-10 w-full min-h-[265px] rounded-[28px] border border-white/90 p-7 sm:p-8 text-left flex flex-col justify-between gap-8 shadow-[0_14px_34px_-12px_rgba(59,130,246,0.12)] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                  card.surfaceClass
                } ${
                  isMiddleCard
                    ? 'md:rotate-[3.5deg] md:translate-y-4 hover:rotate-0 hover:translate-y-2'
                    : 'hover:-translate-y-1'
                }`}
              >
                <h3 className="font-display text-xl sm:text-[1.35rem] font-bold text-slate-900 leading-snug text-balance">
                  {card.title}
                </h3>

                <div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};
