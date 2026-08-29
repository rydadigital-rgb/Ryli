import React, { useState, useEffect } from 'react';
import { 
  GradeLevel, 
  StudyMode, 
  Message, 
  ChatSession, 
  Attachment, 
  WallpaperTheme, 
  QuizQuestion, 
  Flashcard,
  CalendarEvent
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { PromptInput } from './components/PromptInput';
import { FocusTimer } from './components/FocusTimer';
import { QuizModal } from './components/QuizModal';
import { FlashcardModal } from './components/FlashcardModal';
import { StudyTipsModal } from './components/StudyTipsModal';
import { ThemeModal } from './components/ThemeModal';
import { CalendarModal } from './components/CalendarModal';
import { THEME_OPTIONS } from './utils/themePresets';
import { loadCalendarEventsFromStorage, saveCalendarEventsToStorage, getTodayDateString } from './utils/calendarUtils';

const STORAGE_KEY = 'ryli_student_sessions_v1';
const THEME_KEY = 'ryli_theme_preference_v1';
const GRADE_KEY = 'ryli_grade_preference_v1';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(() => {
    return (localStorage.getItem(GRADE_KEY) as GradeLevel) || 'high_school';
  });
  const [studyMode, setStudyMode] = useState<StudyMode>('study_buddy');
  const [currentTheme, setCurrentTheme] = useState<WallpaperTheme>(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as WallpaperTheme;
    if (savedTheme === 'rice_terrace' || !savedTheme) {
      return 'banaue_rice_terraces';
    }
    return savedTheme;
  });

  // Calendar State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    return loadCalendarEventsFromStorage();
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarFocusDate, setCalendarFocusDate] = useState<string | undefined>(undefined);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState(false);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Active interactive modals for quizzes & flashcards
  const [activeQuiz, setActiveQuiz] = useState<{ topic: string; questions: QuizQuestion[] } | null>(null);
  const [activeFlashcards, setActiveFlashcards] = useState<{ topic: string; cards: Flashcard[] } | null>(null);

  // Saved flashcard decks collection
  const [savedDecks, setSavedDecks] = useState<{ topic: string; cards: Flashcard[] }[]>([]);

  // Persist sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (err) {
      console.error('Failed to save sessions:', err);
    }
  }, [sessions]);

  // Persist calendar events to localStorage
  useEffect(() => {
    saveCalendarEventsToStorage(calendarEvents);
  }, [calendarEvents]);

  // Persist theme & grade
  useEffect(() => {
    localStorage.setItem(THEME_KEY, currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem(GRADE_KEY, gradeLevel);
  }, [gradeLevel]);

  // Calendar event handlers
  const handleAddCalendarEvent = (newEvent: CalendarEvent) => {
    setCalendarEvents((prev) => {
      const exists = prev.some((e) => e.id === newEvent.id);
      if (exists) return prev;
      return [newEvent, ...prev];
    });
  };

  const handleUpdateCalendarEvent = (updated: CalendarEvent) => {
    setCalendarEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleDeleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleToggleCompleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isCompleted: !e.isCompleted } : e))
    );
  };

  const handleOpenCalendarWithFocus = (focusDate?: string) => {
    if (focusDate) {
      setCalendarFocusDate(focusDate);
    }
    setIsCalendarOpen(true);
  };

  // Keyboard shortcut: Cmd+K / Ctrl+K for new session
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewSession();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync active session messages
  const handleSelectSession = (sessionId: string) => {
    const found = sessions.find((s) => s.id === sessionId);
    if (found) {
      setActiveSessionId(sessionId);
      setCurrentMessages(found.messages);
      setGradeLevel(found.gradeLevel || 'high_school');
      setStudyMode(found.studyMode || 'study_buddy');
    }
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setCurrentMessages([]);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleNewSession();
    }
  };

  const handleTogglePinSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  // Main chat prompt submission
  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments,
      studyMode,
      gradeLevel,
    };

    const updatedMessages = [...currentMessages, userMessage];
    setCurrentMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Make real call to server endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          gradeLevel,
          studyMode,
          attachments,
          currentDate: getTodayDateString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();

      // If calendar events were parsed from prompt/response, automatically register them!
      if (data.calendarEvents && Array.isArray(data.calendarEvents) && data.calendarEvents.length > 0) {
        data.calendarEvents.forEach((ev: CalendarEvent) => {
          handleAddCalendarEvent(ev);
        });
      }

      const aiMessage: Message = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: data.content || 'I could not generate an answer. Please try asking again.',
        timestamp: Date.now(),
        studyMode,
        gradeLevel,
        suggestedFollowUps: data.suggestedFollowUps || [],
        calendarEvents: data.calendarEvents || undefined,
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setCurrentMessages(finalMessages);

      // Create or update chat session
      if (!activeSessionId) {
        const newSessionId = `session-${Date.now()}`;
        const autoTitle = text.slice(0, 35) + (text.length > 35 ? '...' : '') || 'Study Session';
        const newSession: ChatSession = {
          id: newSessionId,
          title: autoTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: finalMessages,
          subject: 'General Study',
          gradeLevel,
          studyMode,
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSessionId);
      } else {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  updatedAt: Date.now(),
                  messages: finalMessages,
                }
              : s
          )
        );
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Connection Notice:** Unable to reach RYLI at this moment. ${err.message || 'Please check your connection and try again.'}`,
        timestamp: Date.now(),
      };
      setCurrentMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Quiz from conversation topic
  const handleGenerateQuiz = async (topic: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          gradeLevel,
          count: 4,
        }),
      });

      if (!response.ok) throw new Error('Quiz generation failed');
      const quizData = await response.json();

      if (quizData && quizData.questions && quizData.questions.length > 0) {
        setActiveQuiz(quizData);
        // Also attach to latest message
        setCurrentMessages((prev) => {
          const next = [...prev];
          if (next.length > 0) {
            next[next.length - 1] = {
              ...next[next.length - 1],
              quiz: quizData,
            };
          }
          return next;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Flashcards from conversation topic
  const handleGenerateFlashcards = async (topic: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          gradeLevel,
          count: 6,
        }),
      });

      if (!response.ok) throw new Error('Flashcard generation failed');
      const flashcardsData = await response.json();

      if (flashcardsData && flashcardsData.cards && flashcardsData.cards.length > 0) {
        setActiveFlashcards(flashcardsData);
        setSavedDecks((prev) => [flashcardsData, ...prev]);
        // Also attach to latest message
        setCurrentMessages((prev) => {
          const next = [...prev];
          if (next.length > 0) {
            next[next.length - 1] = {
              ...next[next.length - 1],
              flashcards: flashcardsData,
            };
          }
          return next;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const currentThemeObj = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <div
      id="app-root-container"
      className="relative min-h-screen w-full flex flex-col justify-between text-zinc-100 bg-cover bg-center bg-no-repeat bg-fixed transition-all duration-700"
      style={{
        backgroundImage: currentThemeObj.cssBackground,
      }}
    >
      {/* Dark & atmospheric contrast overlay */}
      <div className={`absolute inset-0 z-0 pointer-events-none transition-colors duration-700 ${currentThemeObj.overlayStyle}`} />

      {/* Main App Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewSession}
          onOpenFocusTimer={() => setIsFocusTimerOpen(true)}
          onOpenTipsModal={() => setIsTipsModalOpen(true)}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          calendarEventsCount={calendarEvents.filter((e) => !e.isCompleted).length}
          gradeLevel={gradeLevel}
          onChangeGradeLevel={setGradeLevel}
          studyMode={studyMode}
          onChangeStudyMode={setStudyMode}
          currentTheme={currentTheme}
          onChangeTheme={setCurrentTheme}
        />

        {/* Sidebar History Drawer */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onTogglePinSession={handleTogglePinSession}
          onQuickSubjectPrompt={(prompt) => handleSendMessage(prompt, [])}
          onOpenFlashcardLibrary={() => {
            if (savedDecks.length > 0) {
              setActiveFlashcards(savedDecks[0]);
            }
          }}
          savedFlashcardsCount={savedDecks.length}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          calendarEventsCount={calendarEvents.filter((e) => !e.isCompleted).length}
        />

        {/* Main Conversation & Welcome Feed */}
        <main className="flex-1 flex flex-col overflow-y-auto w-full">
          <ChatView
            messages={currentMessages}
            isLoading={isLoading}
            onSelectPrompt={(prompt) => handleSendMessage(prompt, [])}
            onGenerateQuizFromTopic={handleGenerateQuiz}
            onGenerateFlashcardsFromTopic={handleGenerateFlashcards}
            onOpenQuizModal={(quiz) => setActiveQuiz(quiz)}
            onOpenFlashcardsModal={(deck) => setActiveFlashcards(deck)}
            onOpenCalendarModal={handleOpenCalendarWithFocus}
            onToggleCompleteCalendarEvent={handleToggleCompleteCalendarEvent}
            studyMode={studyMode}
            gradeLevel={gradeLevel}
          />
        </main>

        {/* Bottom Input Area matching screenshot design */}
        <footer className="w-full pb-3 sm:pb-6 pt-1 sm:pt-2 shrink-0">
          <PromptInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            studyMode={studyMode}
            onSelectStudyMode={setStudyMode}
            gradeLevel={gradeLevel}
          />
          <div className="text-center mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-zinc-400/80 tracking-wide px-2">
            RYLI by Ryda AI • Safe & educational AI assistant for schools
          </div>
        </footer>
      </div>

      {/* Modals & Tools */}
      <FocusTimer
        isOpen={isFocusTimerOpen}
        onClose={() => setIsFocusTimerOpen(false)}
      />

      {activeQuiz && (
        <QuizModal
          isOpen={true}
          onClose={() => setActiveQuiz(null)}
          topic={activeQuiz.topic}
          questions={activeQuiz.questions}
        />
      )}

      {activeFlashcards && (
        <FlashcardModal
          isOpen={true}
          onClose={() => setActiveFlashcards(null)}
          topic={activeFlashcards.topic}
          cards={activeFlashcards.cards}
        />
      )}

      <StudyTipsModal
        isOpen={isTipsModalOpen}
        onClose={() => setIsTipsModalOpen(false)}
      />

      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
      />

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => {
          setIsCalendarOpen(false);
          setCalendarFocusDate(undefined);
        }}
        events={calendarEvents}
        onAddEvent={handleAddCalendarEvent}
        onUpdateEvent={handleUpdateCalendarEvent}
        onDeleteEvent={handleDeleteCalendarEvent}
        onToggleComplete={handleToggleCompleteCalendarEvent}
        initialFocusDate={calendarFocusDate}
      />
    </div>
  );
}

