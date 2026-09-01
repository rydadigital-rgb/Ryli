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
  Layers,
  UploadCloud
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
  const [isDragging, setIsDragging] = useState(false);
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

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        if (dataUrl) {
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name || 'uploaded_image.png',
              type: file.type || 'image/jpeg',
              data: dataUrl,
              size: file.size,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(files);
    e.target.value = '';
    setShowToolsMenu(false);
  };

  // Support pasting images from clipboard (e.g. Snipping tool, screenshots, copied web images)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    const pastedFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 || items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          pastedFiles.push(file);
        }
      }
    }

    if (pastedFiles.length > 0) {
      processFiles(pastedFiles);
    }
  };

  // Drag & drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    <div 
      className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 relative z-20"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input with comprehensive image, document, and note format support */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,text/plain,text/markdown,.csv,.py,.java,.cpp,.c,.js,.ts,.html,.css"
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload-input"
      />

      {/* Drag & Drop Visual Dropzone Overlay */}
      {isDragging && (
        <div className="absolute inset-x-4 -top-16 bottom-0 z-50 rounded-3xl border-2 border-dashed border-blue-400 bg-blue-950/80 backdrop-blur-md flex items-center justify-center pointer-events-none animate-fadeIn">
          <div className="flex items-center gap-3 text-white font-medium">
            <UploadCloud className="w-6 h-6 text-blue-400 animate-bounce" />
            <span>Drop your homework photo, worksheet, or notes here!</span>
          </div>
        </div>
      )}

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
              onClick={() => {
                fileInputRef.current?.click();
                setShowToolsMenu(false);
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium text-zinc-200 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Attach Photo, Worksheet or Notes</div>
                <div className="text-[11px] text-zinc-400">Upload handwritten math, textbook, or diagram</div>
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
        <div className="flex flex-wrap gap-2 mb-2 px-2 animate-fadeIn">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/95 border border-blue-500/40 text-xs text-zinc-100 shadow-lg backdrop-blur-md transition-all hover:border-blue-400"
            >
              {att.type.startsWith('image/') ? (
                <img
                  src={att.data}
                  alt={att.name}
                  className="w-7 h-7 object-cover rounded-md border border-white/20 shadow-inner"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="p-1 rounded bg-blue-500/20 text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="max-w-[130px] truncate font-semibold text-white">{att.name}</span>
                {att.size && <span className="text-[10px] text-zinc-400">{formatFileSize(att.size)}</span>}
              </div>
              <button
                type="button"
                id={`btn-remove-attachment-${idx}`}
                onClick={() => removeAttachment(idx)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                title="Remove attachment"
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
        className="relative flex items-center w-full rounded-full border border-white/30 bg-zinc-950/70 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/40 focus-within:border-white/60 focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.7)] px-2 sm:px-4 py-2 sm:py-3 group"
      >
        {/* Plus Button */}
        <button
          type="button"
          id="btn-input-plus"
          onClick={() => setShowToolsMenu(!showToolsMenu)}
          className={`p-1.5 sm:p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0 ${
            showToolsMenu ? 'rotate-45 bg-white/15 text-white' : ''
          }`}
          title="Study tools and options"
        >
          <Plus className="w-5 h-5 transition-transform" />
        </button>

        {/* Quick Direct Attach Image/Photo Button */}
        <button
          type="button"
          id="btn-quick-attach-image"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 sm:p-2 rounded-full text-zinc-300 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer shrink-0"
          title="Attach photo, worksheet, or document (or paste Ctrl+V)"
        >
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
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
          onPaste={handlePaste}
          placeholder={
            attachments.length > 0
              ? 'Ask about this image or press Enter to analyze...'
              : studyMode === 'socratic'
              ? 'Ask for homework guidance (Socratic mode is ON)...'
              : studyMode === 'essay_coach'
              ? 'Paste your essay paragraph, draft, or thesis...'
              : 'Ask anything or attach a photo / document...'
          }
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-zinc-400/80 text-sm sm:text-base focus:outline-none resize-none px-2 sm:px-3 max-h-32 py-1 leading-normal selection:bg-blue-600 font-sans"
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
            title="Send prompt or analyze attachment"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
