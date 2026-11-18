export type WorkspaceTab = 'documents' | 'flashcards' | 'quizzes' | 'progress';

export interface StudyDocument {
  id: string;
  title: string;
  folder: string;
  updatedAt: string;
  content: string;
}

export interface FlashcardItem {
  id: string;
  deck: string;
  front: string;
  back: string;
  mastered: boolean;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface UserSession {
  mode: 'guest' | 'account';
  name: string;
  email?: string;
}
