import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Layers,
  Plus,
  RotateCw,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  INITIAL_DOCUMENTS,
  INITIAL_FLASHCARDS,
  INITIAL_QUIZ,
} from '../data/starterData';
import {
  FlashcardItem,
  QuizQuestion,
  StudyDocument,
  UserSession,
  WorkspaceTab,
} from '../types/learning';

interface LearningWorkspaceProps {
  session: UserSession;
  initialTab: WorkspaceTab;
  onBackToLanding: () => void;
}

const STORAGE_KEYS = {
  docs: 'lilet_r3ad_docs_v1',
  cards: 'lilet_r3ad_cards_v1',
  quiz: 'lilet_r3ad_quiz_v1',
  quizScores: 'lilet_r3ad_scores_v1',
};

export const LearningWorkspace: React.FC<LearningWorkspaceProps> = ({
  session,
  initialTab,
  onBackToLanding,
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);

  // Documents state
  const [docs, setDocs] = useState<StudyDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.docs);
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });
  const [selectedDocId, setSelectedDocId] = useState<string>(docs[0]?.id ?? '');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocFolder, setNewDocFolder] = useState('General');

  // Flashcards state
  const [cards, setCards] = useState<FlashcardItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.cards);
      return saved ? JSON.parse(saved) : INITIAL_FLASHCARDS;
    } catch {
      return INITIAL_FLASHCARDS;
    }
  });
  const [cardCursor, setCardCursor] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardDeck, setCardDeck] = useState('Study Methods');

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.quiz);
      return saved ? JSON.parse(saved) : INITIAL_QUIZ;
    } catch {
      return INITIAL_QUIZ;
    }
  });
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [completedQuizzes, setCompletedQuizzes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.quizScores);
      return saved ? Number(saved) : 2;
    } catch {
      return 2;
    }
  });
  const [newQPrompt, setNewQPrompt] = useState('');
  const [newQOpt1, setNewQOpt1] = useState('');
  const [newQOpt2, setNewQOpt2] = useState('');
  const [newQOpt3, setNewQOpt3] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.docs, JSON.stringify(docs));
    } catch {
      // ignore storage errors
    }
  }, [docs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(cards));
    } catch {
      // ignore storage errors
    }
  }, [cards]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.quiz, JSON.stringify(questions));
    } catch {
      // ignore storage errors
    }
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.quizScores, String(completedQuizzes));
    } catch {
      // ignore storage errors
    }
  }, [completedQuizzes]);

  const activeDoc = docs.find((d) => d.id === selectedDocId) ?? docs[0];
  const masteredCount = cards.filter((c) => c.mastered).length;
  const masteryPct = cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0;

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    const created: StudyDocument = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      folder: newDocFolder.trim() || 'General',
      updatedAt: 'Just now',
      content: 'Start writing your study notes, summaries, and key ideas here...',
    };
    setDocs([created, ...docs]);
    setSelectedDocId(created.id);
    setNewDocTitle('');
  };

  const handleUpdateDocContent = (content: string) => {
    if (!activeDoc) return;
    setDocs((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id ? { ...d, content, updatedAt: 'Just now' } : d
      )
    );
  };

  const handleDeleteDoc = (id: string) => {
    const remaining = docs.filter((d) => d.id !== id);
    setDocs(remaining);
    if (selectedDocId === id && remaining.length > 0) {
      setSelectedDocId(remaining[0].id);
    }
  };

  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardFront.trim() || !cardBack.trim()) return;
    const created: FlashcardItem = {
      id: `fc-${Date.now()}`,
      deck: cardDeck.trim() || 'General',
      front: cardFront.trim(),
      back: cardBack.trim(),
      mastered: false,
    };
    const nextCards = [...cards, created];
    setCards(nextCards);
    setCardCursor(nextCards.length - 1);
    setFlipped(false);
    setCardFront('');
    setCardBack('');
  };

  const toggleMastered = (id: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, mastered: !c.mastered } : c))
    );
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQPrompt.trim() || !newQOpt1.trim() || !newQOpt2.trim()) return;
    const options = [newQOpt1.trim(), newQOpt2.trim()];
    if (newQOpt3.trim()) options.push(newQOpt3.trim());

    const created: QuizQuestion = {
      id: `q-${Date.now()}`,
      topic: 'Custom',
      question: newQPrompt.trim(),
      options,
      correctIndex: 0,
    };
    setQuestions([...questions, created]);
    setNewQPrompt('');
    setNewQOpt1('');
    setNewQOpt2('');
    setNewQOpt3('');
    setQuizSubmitted(false);
  };

  const quizScore = questions.reduce((acc, q) => {
    return acc + (quizAnswers[q.id] === q.correctIndex ? 1 : 0);
  }, 0);

  const safeCursor = cards.length > 0 ? cardCursor % cards.length : 0;
  const currentCard = cards[safeCursor];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Workspace Header */}
      <header className="sticky top-0 z-30 border-b border-slate-900/6 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3.5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Landing</span>
            </button>
            <span className="inline-flex items-center gap-2 font-display text-lg font-bold text-slate-900">
              <img
                src="/assets/aistudio/Screenshot_2026-11-18_at_1.12.35_AM_4f655e17.png"
                alt=""
                referrerPolicy="no-referrer"
                className="h-7 w-7 object-contain shrink-0"
              />
              <span>Lilet_r3ad</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{session.name}</span>
            <span aria-hidden="true">·</span>
            <span>{session.mode === 'guest' ? 'Guest Space' : 'Saved Account'}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:py-10">
        {/* Segmented Tab Controls */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Your Learning Space
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              One place for everything you learn — saved automatically in your browser.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Learning workspace tools"
            className="flex flex-wrap items-center gap-1 rounded-2xl bg-white/80 border border-slate-200/80 p-1.5 shadow-sm"
          >
            {[
              { id: 'documents' as WorkspaceTab, label: 'Documents', icon: BookOpen },
              { id: 'flashcards' as WorkspaceTab, label: 'Flashcards', icon: Layers },
              { id: 'quizzes' as WorkspaceTab, label: 'Quizzes', icon: CheckCircle2 },
              { id: 'progress' as WorkspaceTab, label: 'Progress', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Documents */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-4 rounded-3xl border border-white/80 bg-white/80 backdrop-blur-md p-5 shadow-sm space-y-5">
              <form onSubmit={handleCreateDoc} className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-700">New document</p>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Document title..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDocFolder}
                    onChange={(e) => setNewDocFolder(e.target.value)}
                    placeholder="Folder"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                {docs.map((doc) => {
                  const active = activeDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className={`group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                        active ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedDocId(doc.id)}
                        className="flex-1 text-left cursor-pointer min-w-0"
                      >
                        <p className="truncate text-sm font-semibold">{doc.title}</p>
                        <p className="text-xs text-slate-500">
                          {doc.folder} · {doc.updatedAt}
                        </p>
                      </button>
                      {docs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          aria-label={`Delete ${doc.title}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            <section className="lg:col-span-8 rounded-3xl border border-white/80 bg-white/85 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              {activeDoc ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs text-slate-500">
                        {activeDoc.folder} · Updated {activeDoc.updatedAt}
                      </p>
                      <h2 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
                        {activeDoc.title}
                      </h2>
                    </div>
                  </div>
                  <textarea
                    value={activeDoc.content}
                    onChange={(e) => handleUpdateDocContent(e.target.value)}
                    rows={12}
                    aria-label="Document content editor"
                    className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 text-sm sm:text-base leading-relaxed text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-600">Select or create a document to begin.</p>
              )}
            </section>
          </div>
        )}

        {/* Tab 2: Flashcards */}
        {activeTab === 'flashcards' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-3xl border border-white/80 bg-white/85 backdrop-blur-md p-6 sm:p-8 shadow-sm space-y-6">
              {currentCard ? (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {currentCard.deck} · Card{' '}
                      <span className="font-mono tabular-nums">
                        {safeCursor + 1} / {cards.length}
                      </span>
                    </span>
                    <span
                      className={`font-semibold ${
                        currentCard.mastered ? 'text-emerald-700' : 'text-blue-600'
                      }`}
                    >
                      {currentCard.mastered ? 'Mastered' : 'Learning'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="w-full h-64 perspective-1000 cursor-pointer text-left"
                  >
                    <div
                      className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
                        flipped ? 'rotate-y-180' : ''
                      }`}
                    >
                      <div className="absolute inset-0 backface-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50/70 p-7 flex flex-col justify-between">
                        <span className="text-xs font-medium text-blue-600">
                          Question / Prompt
                        </span>
                        <p className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                          {currentCard.front}
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <RotateCw className="h-3.5 w-3.5" />
                          Click card to reveal answer
                        </span>
                      </div>
                      <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-7 flex flex-col justify-between">
                        <span className="text-xs font-medium text-blue-100">
                          Answer
                        </span>
                        <p className="text-base sm:text-lg font-medium leading-relaxed">
                          {currentCard.back}
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-xs text-blue-100">
                          <RotateCw className="h-3.5 w-3.5" />
                          Click to flip back
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFlipped(false);
                          setCardCursor((c) => (c - 1 + cards.length) % cards.length);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFlipped(false);
                          setCardCursor((c) => (c + 1) % cards.length);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMastered(currentCard.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        currentCard.mastered
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>
                        {currentCard.mastered ? 'Marked Mastered' : 'Mark as Mastered'}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-600">No flashcards yet. Add one on the right!</p>
              )}
            </div>

            <form
              onSubmit={handleAddFlashcard}
              className="lg:col-span-5 rounded-3xl border border-white/80 bg-white/80 backdrop-blur-md p-6 shadow-sm space-y-4"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">
                Create a flashcard
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deck name
                </label>
                <input
                  type="text"
                  value={cardDeck}
                  onChange={(e) => setCardDeck(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Front (Question)
                </label>
                <input
                  type="text"
                  value={cardFront}
                  onChange={(e) => setCardFront(e.target.value)}
                  placeholder="e.g., What is spaced repetition?"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Back (Answer)
                </label>
                <textarea
                  rows={3}
                  value={cardBack}
                  onChange={(e) => setCardBack(e.target.value)}
                  placeholder="Write a short, memorable answer..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full min-h-[42px] rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Add to Deck
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Quizzes */}
        {activeTab === 'quizzes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              {questions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-md p-6 shadow-sm space-y-3"
                >
                  <p className="text-xs text-slate-500">
                    Question {qIdx + 1} · {q.topic}
                  </p>
                  <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900">
                    {q.question}
                  </h3>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const picked = quizAnswers[q.id] === optIdx;
                      const isCorrect = optIdx === q.correctIndex;
                      let style = 'border-slate-200 bg-white hover:border-blue-300';
                      if (quizSubmitted) {
                        if (isCorrect) {
                          style = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                        } else if (picked && !isCorrect) {
                          style = 'border-rose-400 bg-rose-50 text-rose-900';
                        }
                      } else if (picked) {
                        style = 'border-blue-600 bg-blue-50 text-blue-900';
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (quizSubmitted) return;
                            setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                          }}
                          className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer ${style}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm">
                {quizSubmitted ? (
                  <p className="text-sm font-semibold text-slate-900">
                    Score:{' '}
                    <span className="font-mono tabular-nums text-blue-600">
                      {quizScore} / {questions.length}
                    </span>{' '}
                    correct
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">
                    Select your answers above and check your score.
                  </p>
                )}

                <div className="flex items-center gap-2">
                  {quizSubmitted ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Retake Quiz
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setQuizSubmitted(true);
                        setCompletedQuizzes((n) => n + 1);
                      }}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                    >
                      Check Answers
                    </button>
                  )}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleAddQuestion}
              className="lg:col-span-5 h-fit rounded-3xl border border-white/80 bg-white/80 backdrop-blur-md p-6 shadow-sm space-y-3.5"
            >
              <h2 className="font-display text-lg font-bold text-slate-900">
                Add a quiz question
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question
                </label>
                <input
                  type="text"
                  value={newQPrompt}
                  onChange={(e) => setNewQPrompt(e.target.value)}
                  placeholder="Write your test question..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correct answer
                </label>
                <input
                  type="text"
                  value={newQOpt1}
                  onChange={(e) => setNewQOpt1(e.target.value)}
                  placeholder="Correct option"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Distractor option 1
                </label>
                <input
                  type="text"
                  value={newQOpt2}
                  onChange={(e) => setNewQOpt2(e.target.value)}
                  placeholder="Another option"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Distractor option 2 (optional)
                </label>
                <input
                  type="text"
                  value={newQOpt3}
                  onChange={(e) => setNewQOpt3(e.target.value)}
                  placeholder="Third option"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full min-h-[42px] rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Add Question
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Progress */}
        {activeTab === 'progress' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-md p-6 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Documents organised</p>
              <p className="font-display text-4xl font-bold text-slate-900 font-mono tabular-nums mt-2">
                {docs.length}
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Sorted across your study folders
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-md p-6 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Flashcard mastery</p>
              <p className="font-display text-4xl font-bold text-blue-600 font-mono tabular-nums mt-2">
                {masteryPct}%
              </p>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{ width: `${masteryPct}%` }}
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                />
              </div>
              <p className="text-xs text-slate-600 mt-2 font-mono tabular-nums">
                {masteredCount} of {cards.length} cards mastered
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white/85 backdrop-blur-md p-6 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Quizzes completed</p>
              <p className="font-display text-4xl font-bold text-slate-900 font-mono tabular-nums mt-2">
                {completedQuizzes}
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Small steps, big progress every day
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
