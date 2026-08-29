import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  ArrowUp, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Sparkles, 
  FileText, 
  HelpCircle, 
  X, 
  Brain, 
  BookOpen, 
  CheckSquare, 
  Layers 
} from 'lucide-react';
import { Attachment, StudyMode, GradeLevel } from '../types';

interface PromptInputProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  studyMode: StudyMode;
  onSelectStudyMode: (mode: StudyMode) => void;
  gradeLevel: GradeLevel;
  onOpenQuizModal?: () => void;
  onOpenFlashcardsModal?: () => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onSend,
  isLoading,
  studyMode,
  onSelectStudyMode,
  gradeLevel,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close tools menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Web Speech Recognition
  useEffect(() => {
    let recognition: any = null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && isListening) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }

    return () => {
      if (recognition) recognition.stop();
    };
  }, [isListening]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSend(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            data: dataUrl,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    setShowToolsMenu(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const studyModeLabels: Record<StudyMode, { label: string; icon: any; color: string }> = {
    study_buddy: { label: 'Study Buddy', icon: Sparkles, color: 'text-blue-400' },
    socratic: { label: 'Socratic Guide', icon: Brain, color: 'text-emerald-400' },
    essay_coach: { label: 'Writing Coach', icon: BookOpen, color: 'text-purple-400' },
    stem_solver: { label: 'Math & STEM', icon: HelpCircle, color: 'text-amber-400' },
    quiz_master: { label: 'Practice Quiz', icon: CheckSquare, color: 'text-rose-400' },
    flashcards: { label: 'Flashcards', icon: Layers, color: 'text-cyan-400' },
    summarizer: { label: 'Notes Summarizer', icon: FileText, color: 'text-indigo-400' },
  };

  const currentModeInfo = studyModeLabels[studyMode];
  const CurrentModeIcon = currentModeInfo.icon;

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 relative z-20">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,text/plain"
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload-input"
      />

      {/* Tools Quick Menu Popover */}
      {showToolsMenu && (
        <div
          ref={toolsMenuRef}
          id="tools-popover-menu"
          className="fixed inset-x-3 bottom-20 sm:absolute sm:inset-x-auto sm:bottom-full sm:left-6 sm:mb-3 sm:w-80 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/20 bg-zinc-900/95 backdrop-blur-2xl shadow-2xl p-2 z-50 animate-fadeIn"
        >
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-white/10">
            Study Tools & Input
          </div>

          <div className="py-1 space-y-1">
            <button
              id="tool-attach-photo"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium text-zinc-200 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Attach Photo or Notes</div>
                <div className="text-[11px] text-zinc-400">Upload homework, textbook, or diagram</div>
              </div>
            </button>

            <button
              id="tool-mode-socratic"
              onClick={() => {
                onSelectStudyMode('socratic');
                setShowToolsMenu(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                studyMode === 'socratic' ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-200 hover:bg-white/10'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Socratic Guide Mode</div>
                <div className="text-[11px] text-zinc-400">Help me solve step-by-step (no spoilers)</div>
              </div>
            </button>

            <button
              id="tool-mode-essay"
              onClick={() => {
                onSelectStudyMode('essay_coach');
                setShowToolsMenu(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                studyMode === 'essay_coach' ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-200 hover:bg-white/10'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Writing & Essay Coach</div>
                <div className="text-[11px] text-zinc-400">Thesis, PEEL structure & citations</div>
              </div>
            </button>

            <button
              id="tool-mode-stem"
              onClick={() => {
                onSelectStudyMode('stem_solver');
                setShowToolsMenu(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                studyMode === 'stem_solver' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-200 hover:bg-white/10'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Math & Science Formulas</div>
                <div className="text-[11px] text-zinc-400">Step-by-step with LaTeX equations</div>
              </div>
            </button>

            <button
              id="tool-mode-summarizer"
              onClick={() => {
                onSelectStudyMode('summarizer');
                setShowToolsMenu(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                studyMode === 'summarizer' ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-200 hover:bg-white/10'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Study Notes Summarizer</div>
                <div className="text-[11px] text-zinc-400">Key takeaways & mnemonics</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/20 text-xs text-zinc-200 shadow-md backdrop-blur-md"
            >
              {att.type.startsWith('image/') ? (
                <img
                  src={att.data}
                  alt={att.name}
                  className="w-6 h-6 object-cover rounded-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <FileText className="w-4 h-4 text-blue-400" />
              )}
              <span className="max-w-[120px] truncate font-medium">{att.name}</span>
              <button
                type="button"
                id={`btn-remove-attachment-${idx}`}
                onClick={() => removeAttachment(idx)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Glass Pill Input matching screenshot design */}
      <div
        id="prompt-input-pill"
        className="relative flex items-center w-full rounded-full border border-white/30 bg-zinc-950/70 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/40 focus-within:border-white/60 focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.7)] px-2.5 sm:px-4 py-2 sm:py-3 group"
      >
        {/* Plus Button */}
        <button
          type="button"
          id="btn-input-plus"
          onClick={() => setShowToolsMenu(!showToolsMenu)}
          className={`p-1.5 sm:p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0 ${
            showToolsMenu ? 'rotate-45 bg-white/15 text-white' : ''
          }`}
          title="Study tools and attachments"
        >
          <Plus className="w-5 h-5 transition-transform" />
        </button>

        {/* Mode Indicator Badge (Clickable) */}
        {studyMode !== 'study_buddy' && (
          <button
            type="button"
            onClick={() => setShowToolsMenu(true)}
            className="hidden sm:flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold border border-white/15 text-zinc-200 hover:bg-white/20 transition-all shrink-0 cursor-pointer"
          >
            <CurrentModeIcon className={`w-3.5 h-3.5 ${currentModeInfo.color}`} />
            <span>{currentModeInfo.label}</span>
          </button>
        )}

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          id="prompt-textarea"
          value={text}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={
            studyMode === 'socratic'
              ? 'Ask for homework guidance (Socratic mode is ON)...'
              : studyMode === 'essay_coach'
              ? 'Paste your essay paragraph, draft, or thesis...'
              : 'Ask anything'
          }
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-zinc-400/80 text-sm sm:text-base focus:outline-none resize-none px-2.5 sm:px-4 max-h-32 py-1 leading-normal selection:bg-blue-600 font-sans"
        />

        {/* Right Actions: Mic + Send */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Voice Mic Button */}
          <button
            type="button"
            id="btn-voice-dictate"
            onClick={() => setIsListening(!isListening)}
            className={`p-1.5 sm:p-2.5 rounded-full transition-all cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title={isListening ? 'Stop listening' : 'Voice ask (Speech to text)'}
          >
            {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Send Button */}
          <button
            type="button"
            id="btn-prompt-send"
            onClick={handleSubmit}
            disabled={(!text.trim() && attachments.length === 0) || isLoading}
            className={`p-2 sm:p-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              (text.trim() || attachments.length > 0) && !isLoading
                ? 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-md shadow-white/20 transform active:scale-95'
                : 'bg-white/10 text-zinc-500 cursor-not-allowed'
            }`}
            title="Send prompt"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
