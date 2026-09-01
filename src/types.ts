export type StickyColor = 'yellow' | 'green' | 'pink' | 'blue' | 'purple' | 'amber';

export interface StickyNoteItem {
  id: string;
  title?: string;
  content: string;
  color: StickyColor;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isMinimized?: boolean;
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type GradeLevel = 'middle_school' | 'high_school' | 'ap_college' | 'elementary';

export type StudyMode = 
  | 'study_buddy' 
  | 'socratic' 
  | 'essay_coach' 
  | 'stem_solver' 
  | 'quiz_master' 
  | 'flashcards' 
  | 'summarizer';

export type CalendarCategory = 
  | 'school_event' 
  | 'assignment' 
  | 'exam' 
  | 'project' 
  | 'study_session' 
  | 'personal' 
  | 'extracurricular';

export type PriorityLevel = 'high' | 'medium' | 'low';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format (for multi-day events)
  time?: string; // HH:MM (24h) or e.g. "09:00 AM"
  endTime?: string;
  category: CalendarCategory;
  priority: PriorityLevel;
  description?: string;
  location?: string;
  subject?: string;
  isCompleted?: boolean;
  source: 'ai_assistant' | 'manual';
  createdAt: number;
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64 data url or text
  size?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  subject?: string;
  mastered?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  studyMode?: StudyMode;
  gradeLevel?: GradeLevel;
  quiz?: {
    topic: string;
    questions: QuizQuestion[];
  };
  flashcards?: {
    topic: string;
    cards: Flashcard[];
  };
  calendarEvents?: CalendarEvent[];
  suggestedFollowUps?: string[];
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  subject: string;
  gradeLevel: GradeLevel;
  studyMode: StudyMode;
  isPinned?: boolean;
}

export type WallpaperTheme = 
  | 'banaue_rice_terraces'
  | 'mayon_volcano'
  | 'palawan_el_nido'
  | 'vigan_calle_crisologo'
  | 'intramuros_manila'
  | 'batanes_hills'
  | 'bohol_chocolate_hills'
  | 'manila_bay_sunset'
  | 'clean_dark'
  // Legacy aliases for backward compatibility with existing saved sessions
  | 'rice_terrace' 
  | 'midnight_academy' 
  | 'cosy_library' 
  | 'nebula_space';

export interface SubjectOption {
  id: string;
  name: string;
  icon: string;
  color: string;
}
