import React, { useState, useRef, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Sparkles, 
  FileText, 
  CheckSquare, 
  Layers, 
  RotateCw, 
  Download, 
  Share2, 
  Brain,
  Calendar as CalendarIcon,
  Shuffle,
  X,
  Maximize2
} from 'lucide-react';
import { Message, StudyMode, GradeLevel, QuizQuestion, Flashcard, CalendarEvent, Attachment } from '../types';
import { RyliLogo } from './RyliLogo';
import { RichContentRenderer } from '../utils/markdownRenderer';
import { QUICK_STARTER_PROMPTS } from '../utils/themePresets';
import { CalendarEventCard } from './CalendarEventCard';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  onSelectPrompt: (promptText: string) => void;
  onGenerateQuizFromTopic: (topic: string) => void;
  onGenerateFlashcardsFromTopic: (topic: string) => void;
  onOpenQuizModal: (quiz: { topic: string; questions: QuizQuestion[] }) => void;
  onOpenFlashcardsModal: (deck: { topic: string; cards: Flashcard[] }) => void;
  onOpenCalendarModal?: (focusDate?: string) => void;
  onToggleCompleteCalendarEvent?: (id: string) => void;
  studyMode: StudyMode;
  gradeLevel: GradeLevel;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isLoading,
  onSelectPrompt,
  onGenerateQuizFromTopic,
  onGenerateFlashcardsFromTopic,
  onOpenQuizModal,
  onOpenFlashcardsModal,
  onOpenCalendarModal,
  onToggleCompleteCalendarEvent,
  studyMode,
  gradeLevel,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Exactly 6 randomly chosen starter prompts on every page refresh/mount
  const [randomPrompts, setRandomPrompts] = useState(() => {
    return [...QUICK_STARTER_PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 6);
  });

  const handleShufflePrompts = () => {
    setRandomPrompts([...QUICK_STARTER_PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 6));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean text of markdown formatting for speech
    const cleanText = text
      .replace(/[#*`_~[\]()]/g, '')
      .replace(/\$[^$]+\$/g, 'mathematical expression')
      .replace(/\[FOLLOWUPS\][\s\S]*?\[\/FOLLOWUPS\]/gi, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
    setSpeakingId(id);
  };

  // Welcome Screen when no messages exist yet (Exact recreation of user prompt's design)
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-3 py-4 sm:p-6 text-center max-w-4xl mx-auto w-full select-none">
        {/* Iconic RYLI Brand Logo (Hero Size) */}
        <div className="mb-2 sm:mb-6 animate-fadeIn">
          <RyliLogo size="xl" showSubtitle={true} />
        </div>

        {/* Tagline matching screenshot */}
        <h2 className="text-lg sm:text-2xl md:text-3xl font-medium text-white/95 tracking-normal mb-4 sm:mb-8 font-sans drop-shadow-md">
          What’s on your mind today?
        </h2>

        {/* Quick Starter Cards for Students (Swipeable on mobile, 3-column grid on desktop) */}
        <div className="w-full max-w-3xl flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 text-left overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 snap-x snap-mandatory no-scrollbar px-1 sm:px-0">
          {randomPrompts.map((item, idx) => (
            <button
              key={`${item.title}-${idx}`}
              id={`quick-starter-card-${idx}`}
              onClick={() => onSelectPrompt(item.prompt)}
              className="w-[82vw] max-w-[280px] sm:w-auto sm:max-w-none shrink-0 snap-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-950/40 hover:bg-zinc-900/70 border border-white/15 hover:border-white/35 backdrop-blur-xl transition-all duration-200 text-white flex flex-col justify-between group cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-lg sm:text-xl">{item.icon}</span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-0.5 rounded-full bg-white/10">
                  {item.category}
                </span>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Mobile Swipe Hint + Refresh / Shuffle prompts action */}
        <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
          <div className="sm:hidden text-[11px] text-zinc-400/80 flex items-center gap-1">
            <span>👈 Swipe for more prompts 👉</span>
          </div>

          <button
            id="btn-shuffle-starter-prompts"
            onClick={handleShufflePrompts}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105"
            title="Get 6 new random suggestions"
          >
            <Shuffle className="w-3.5 h-3.5 text-blue-400" />
            <span>Shuffle suggestions</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Chat Message Stream
  return (
    <div className="flex-1 overflow-y-auto px-2.5 sm:px-6 py-3 sm:py-6 space-y-3.5 sm:space-y-6 max-w-4xl mx-auto w-full">
      {messages.map((message) => {
        const isUser = message.role === 'user';

        return (
          <div
            key={message.id}
            id={`message-bubble-${message.id}`}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
          >
            {/* Header label */}
            <div className="flex items-center gap-2 text-xs text-zinc-400 px-1">
              {!isUser && (
                <div className="flex items-center gap-1.5 font-bold font-display text-white">
                  <span className="w-5 h-5 rounded-md bg-zinc-900 border border-white/20 flex items-center justify-center text-[10px] font-black">
                    <span className="text-blue-500">R</span>
                  </span>
                  <span>RYLI</span>
                  {message.studyMode === 'socratic' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                      <Brain className="w-3 h-3" /> Socratic Guide
                    </span>
                  )}
                  {message.studyMode === 'essay_coach' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-semibold flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Writing Coach
                    </span>
                  )}
                </div>
              )}
              {isUser && <span className="font-semibold text-zinc-300">You (Student)</span>}
              <span className="text-[10px] text-zinc-500">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Message Bubble */}
            <div
              className={`rounded-3xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed transition-all shadow-xl ${
                isUser
                  ? 'bg-blue-600 text-white max-w-[85%] sm:max-w-[75%] rounded-tr-sm'
                  : 'w-full bg-zinc-950/70 border border-white/15 backdrop-blur-2xl text-zinc-100 rounded-tl-sm'
              }`}
            >
              {/* Attachment Previews in User Message */}
              {isUser && message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {message.attachments.map((att, i) => (
                    <div 
                      key={i} 
                      className="group relative rounded-xl overflow-hidden border border-white/20 bg-black/40 p-1 shadow-md transition-all hover:border-white/40"
                    >
                      {att.type.startsWith('image/') ? (
                        <div 
                          className="relative cursor-pointer"
                          onClick={() => setPreviewImage({ src: att.data, title: att.name })}
                        >
                          <img
                            src={att.data}
                            alt={att.name}
                            className="max-h-48 max-w-full sm:max-w-xs rounded-lg object-contain bg-zinc-950"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                            <span className="text-[11px] font-semibold text-white px-2 py-1 rounded bg-black/60 backdrop-blur-sm flex items-center gap-1">
                              <Maximize2 className="w-3 h-3" /> View full
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2.5 text-xs text-zinc-100 font-medium">
                          <div className="p-1 rounded bg-white/20">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <span className="truncate max-w-[180px]">{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Text / Markdown Content */}
              {isUser ? (
                message.content ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <p className="text-xs italic text-blue-200/90 flex items-center gap-1">
                    📎 Attached student document / image for analysis
                  </p>
                )
              ) : (
                <RichContentRenderer content={message.content} />
              )}

              {/* Embedded Quiz Button if generated */}
              {message.quiz && (
                <div className="mt-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Practice Quiz Ready!</h4>
                      <p className="text-xs text-zinc-400">{message.quiz.questions.length} Questions on {message.quiz.topic}</p>
                    </div>
                  </div>
                  <button
                    id={`btn-open-embedded-quiz-${message.id}`}
                    onClick={() => onOpenQuizModal(message.quiz!)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Start Quiz
                  </button>
                </div>
              )}

              {/* Embedded Flashcard Deck Button if generated */}
              {message.flashcards && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Flashcard Deck Created!</h4>
                      <p className="text-xs text-zinc-400">{message.flashcards.cards.length} Active Recall Cards on {message.flashcards.topic}</p>
                    </div>
                  </div>
                  <button
                    id={`btn-open-embedded-deck-${message.id}`}
                    onClick={() => onOpenFlashcardsModal(message.flashcards!)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Study Cards
                  </button>
                </div>
              )}

              {/* Embedded Saved Calendar Events if generated */}
              {message.calendarEvents && message.calendarEvents.length > 0 && (
                <div className="space-y-2 mt-3">
                  {message.calendarEvents.map((ev) => (
                    <CalendarEventCard
                      key={ev.id}
                      event={ev}
                      onOpenCalendar={(focusDate) => onOpenCalendarModal && onOpenCalendarModal(focusDate)}
                      onToggleComplete={onToggleCompleteCalendarEvent}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* AI Action Tool Bar */}
            {!isUser && (
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-1 px-1 text-xs text-zinc-400">
                {/* Text-to-Speech button */}
                <button
                  id={`btn-speak-${message.id}`}
                  onClick={() => handleToggleSpeak(message.id, message.content)}
                  className="px-2 py-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1 cursor-pointer bg-white/5"
                  title={speakingId === message.id ? 'Stop reading' : 'Read aloud'}
                >
                  {speakingId === message.id ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400 text-[11px]">Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Read Aloud</span>
                    </>
                  )}
                </button>

                {/* Copy text button */}
                <button
                  id={`btn-copy-${message.id}`}
                  onClick={() => handleCopy(message.id, message.content)}
                  className="px-2 py-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1 cursor-pointer bg-white/5"
                  title="Copy explanation"
                >
                  {copiedId === message.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>

                {/* Generate Quiz trigger */}
                <button
                  id={`btn-trigger-quiz-${message.id}`}
                  onClick={() => onGenerateQuizFromTopic(message.content.substring(0, 100))}
                  className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-300 text-blue-400 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Generate a 4-question practice quiz"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Quiz</span>
                </button>

                {/* Generate Flashcards trigger */}
                <button
                  id={`btn-trigger-flashcards-${message.id}`}
                  onClick={() => onGenerateFlashcardsFromTopic(message.content.substring(0, 100))}
                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-300 text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Turn this lesson into flashcards"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Flashcards</span>
                </button>

                {/* Open Calendar button */}
                {onOpenCalendarModal && (
                  <button
                    id={`btn-trigger-calendar-${message.id}`}
                    onClick={() => onOpenCalendarModal()}
                    className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-300 text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Open study calendar & schedule tasks"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Schedule</span>
                  </button>
                )}
              </div>
            )}

            {/* Suggested Follow-up Prompts Pills */}
            {!isUser && message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
              <div className="w-full pt-2 px-1">
                <div className="text-[11px] font-semibold text-zinc-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" /> Explore Further:
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.suggestedFollowUps.map((followUp, fIdx) => (
                    <button
                      key={fIdx}
                      id={`btn-followup-${message.id}-${fIdx}`}
                      onClick={() => onSelectPrompt(followUp)}
                      className="px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-white/30 text-xs text-zinc-200 hover:text-white transition-all text-left cursor-pointer backdrop-blur-md shadow-sm"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex flex-col items-start space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs text-zinc-400 px-1">
            <span className="w-5 h-5 rounded-md bg-zinc-900 border border-white/20 flex items-center justify-center text-[10px] font-black">
              <span className="text-blue-500">R</span>
            </span>
            <span className="font-bold text-white">RYLI</span>
            <span className="text-zinc-500 text-[11px]">is thinking & formulating response...</span>
          </div>
          <div className="p-4 rounded-3xl bg-zinc-950/70 border border-white/15 backdrop-blur-2xl text-zinc-100 flex items-center gap-3">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-bounce" />
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              Consulting educational curriculum...
            </span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />

      {/* Expanded Image Lightbox Modal */}
      {previewImage && (
        <div
          id="image-preview-lightbox"
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] bg-zinc-950/90 border border-white/20 rounded-3xl p-3 sm:p-5 shadow-2xl flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-white/10">
              <span className="text-sm font-semibold text-white truncate max-w-md">
                {previewImage.title || 'Student Document Preview'}
              </span>
              <button
                type="button"
                id="btn-close-image-preview"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[70vh] flex items-center justify-center rounded-2xl bg-black/50 p-2">
              <img
                src={previewImage.src}
                alt={previewImage.title}
                className="max-h-[65vh] max-w-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
