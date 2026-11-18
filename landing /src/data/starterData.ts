import { FlashcardItem, QuizQuestion, StudyDocument } from '../types/learning';

export const SLOGANS = [
  'Your ideas, your space, your progress.',
  'Make studying simple and fun.',
  'One place for everything you learn.',
  'Small steps, big progress.',
] as const;

export const INITIAL_DOCUMENTS: StudyDocument[] = [
  {
    id: 'doc-1',
    title: 'Memory & Spaced Repetition Notes',
    folder: 'Study Methods',
    updatedAt: 'Today',
    content:
      'Reviewing concepts right before you are about to forget them strengthens neural pathways. Break chapters into concise summaries, turn key definitions into flashcards, and quiz yourself actively instead of passively re-reading.',
  },
  {
    id: 'doc-2',
    title: 'Cellular Biology — Membrane Transport',
    folder: 'Biology 101',
    updatedAt: 'Yesterday',
    content:
      'Passive transport moves molecules down their concentration gradient without ATP (simple diffusion, osmosis, facilitated diffusion). Active transport uses energy (ATP) to pump ions against their gradient, such as the sodium-potassium pump.',
  },
  {
    id: 'doc-3',
    title: 'Design Principles & Visual Hierarchy',
    folder: 'Creative Studio',
    updatedAt: '2 days ago',
    content:
      'Visual hierarchy guides attention through scale, contrast, and whitespace. Lead with one dominant focal element, group related ideas cleanly, and keep supporting metadata quiet and readable.',
  },
];

export const INITIAL_FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-1',
    deck: 'Study Methods',
    front: 'What is Active Recall?',
    back: 'Retrieving information from memory without looking at your notes, which builds stronger recall than passive re-reading.',
    mastered: true,
  },
  {
    id: 'fc-2',
    deck: 'Biology 101',
    front: 'What distinguishes Active Transport from Passive Transport?',
    back: 'Active transport requires cellular energy (ATP) to move substances against their concentration gradient.',
    mastered: false,
  },
  {
    id: 'fc-3',
    deck: 'Study Methods',
    front: 'Why use the Feynman Technique?',
    back: 'Explaining a concept in plain, simple language quickly reveals any hidden gaps in your understanding.',
    mastered: false,
  },
  {
    id: 'fc-4',
    deck: 'Creative Studio',
    front: 'What is the 60-30-10 color rule?',
    back: 'Allocate 60% to a dominant neutral canvas, 30% to structural surfaces, and 10% to focused accent actions.',
    mastered: true,
  },
];

export const INITIAL_QUIZ: QuizQuestion[] = [
  {
    id: 'q-1',
    topic: 'Study Methods',
    question: 'Which study habit produces the strongest long-term memory retention?',
    options: [
      'Highlighting every paragraph twice',
      'Testing yourself with flashcards and spaced recall',
      'Reading notes right before falling asleep once',
      'Copying textbook pages word for word',
    ],
    correctIndex: 1,
  },
  {
    id: 'q-2',
    topic: 'Biology 101',
    question: 'Osmosis specifically refers to the movement of which molecule across a semipermeable membrane?',
    options: ['Glucose', 'Water', 'Sodium ions', 'ATP'],
    correctIndex: 1,
  },
  {
    id: 'q-3',
    topic: 'Study Methods',
    question: 'When organising study documents, what helps prevent overwhelm?',
    options: [
      'Keeping all subjects inside a single long file',
      'Grouping short notes into clear topic folders',
      'Using ten different font colors per sentence',
      'Never summarising your own takeaways',
    ],
    correctIndex: 1,
  },
];
