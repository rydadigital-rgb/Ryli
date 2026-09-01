import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  X, 
  Pin, 
  Download, 
  Copy, 
  Check, 
  Search, 
  FileText, 
  Bold, 
  Italic, 
  List, 
  CheckSquare, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  FolderPlus,
  ExternalLink,
  BookOpen,
  Sparkles,
  Layers,
  Palette,
  Eye,
  Edit3,
  GripVertical,
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react';
import { StickyNoteItem, StickyColor } from '../types';
import { STICKY_COLORS } from '../utils/stickyNotesUtils';

interface DesktopNotepadProps {
  isOpen: boolean;
  onClose: () => void;
  notes: StickyNoteItem[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onAddNote: (color?: StickyColor, initialContent?: string, initialTitle?: string) => string;
  onUpdateNote: (updated: StickyNoteItem) => void;
  onDeleteNote: (id: string) => void;
  onClearAllNotes?: () => void;
  onAppendToActiveNote?: (text: string) => void;
  width?: number;
  onWidthChange?: (newWidth: number) => void;
}

export const DesktopNotepad: React.FC<DesktopNotepadProps> = ({
  isOpen,
  onClose,
  notes,
  activeNoteId,
  onSelectNote,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onClearAllNotes,
  width = 440,
  onWidthChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoteList, setShowNoteList] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  // Determine currently active note
  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null;

  // Auto-select first note if activeNoteId is not valid
  useEffect(() => {
    if (notes.length > 0 && (!activeNoteId || !notes.some((n) => n.id === activeNoteId))) {
      onSelectNote(notes[0].id);
    }
  }, [notes, activeNoteId, onSelectNote]);

  // Handle Dragging / Resizing
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startXRef.current;
      const minW = 280;
      const maxW = Math.max(500, Math.min(window.innerWidth * 0.8, 900));
      const targetW = Math.round(Math.min(maxW, Math.max(minW, startWidthRef.current + delta)));
      if (onWidthChange) {
        onWidthChange(targetW);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [width, onWidthChange]);

  const handleResetWidth = () => {
    if (onWidthChange) {
      onWidthChange(440);
    }
  };

  const handleSetPresetWidth = (presetW: number) => {
    if (onWidthChange) {
      onWidthChange(presetW);
      setShowPresetsMenu(false);
    }
  };

  if (!isOpen) return null;

  const currentColorConfig = activeNote
    ? STICKY_COLORS.find((c) => c.id === activeNote.color) || STICKY_COLORS[0]
    : STICKY_COLORS[0];

  const handleCopyNote = () => {
    if (!activeNote) return;
    const titleText = (activeNote as any).title ? `# ${(activeNote as any).title}\n\n` : '';
    navigator.clipboard.writeText(`${titleText}${activeNote.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportNote = () => {
    if (!activeNote) return;
    const title = (activeNote as any).title || 'Study-Note';
    const blob = new Blob([`${title}\n\n${activeNote.content}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInsertFormat = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current || !activeNote) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const prevText = activeNote.content;
    const selectedText = prevText.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    const newContent = prevText.substring(0, start) + replacement + prevText.substring(end);

    onUpdateNote({
      ...activeNote,
      content: newContent,
      updatedAt: Date.now(),
    });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 50);
  };

  const handleInsertTimestamp = () => {
    if (!activeNote) return;
    const now = new Date();
    const timeStr = `\n[${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]\n`;
    onUpdateNote({
      ...activeNote,
      content: activeNote.content + timeStr,
      updatedAt: Date.now(),
    });
  };

  // Helper to render text with clickable links and highlighted headers in preview mode
  const renderFormattedPreview = (text: string) => {
    if (!text.trim()) {
      return (
        <div className="text-center py-12 text-zinc-500 text-xs">
          This note is currently empty. Click "Edit" to type formulas, links, and study notes.
        </div>
      );
    }

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Heading check (starts with # or ## or ###)
      if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
        const cleanHeading = line.replace(/^#+\s*/, '');
        return (
          <h4 key={idx} className="text-amber-400 font-bold text-sm sm:text-base mt-3 mb-1 font-display">
            {cleanHeading}
          </h4>
        );
      }

      // Detect URLs in line
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = line.split(urlRegex);

      return (
        <p key={idx} className="min-h-[1.25rem] text-xs sm:text-sm leading-relaxed text-zinc-200 break-words py-0.5">
          {parts.map((part, pIdx) => {
            if (part.match(/^https?:\/\//)) {
              return (
                <a
                  key={pIdx}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 underline font-medium inline-flex items-center gap-0.5 break-all hover:bg-amber-400/10 px-1 rounded transition-colors"
                >
                  <span>{part}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 inline ml-0.5" />
                </a>
              );
            }
            if (part.startsWith('- [ ] ') || part.startsWith('• ') || part.startsWith('* ')) {
              return (
                <span key={pIdx} className="text-zinc-300 font-medium pl-1">
                  {part}
                </span>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </p>
      );
    });
  };

  const filteredNotes = notes.filter((n) => {
    const title = (n as any).title || '';
    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <aside
      id="desktop-notepad-pane"
      style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${width}px` : '100%' }}
      className={`fixed inset-0 md:relative md:inset-auto shrink-0 w-full md:w-auto h-screen max-h-screen md:sticky md:top-0 flex flex-col bg-zinc-950 md:bg-zinc-950/95 border-r border-white/10 md:border-white/15 backdrop-blur-2xl text-white shadow-2xl z-50 md:z-30 select-text transition-[width] duration-75 ${
        isDragging ? 'transition-none select-none' : ''
      }`}
    >
      {/* Top Bar / Full Column Header of Desktop Notepad */}
      <div className="px-3.5 py-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-zinc-900/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h3 className="text-xs sm:text-sm font-bold font-display text-amber-400 uppercase tracking-wider flex items-center gap-1.5 truncate">
              <span>Study Notepad</span>
              <span className="text-[10px] text-zinc-400 font-mono font-normal normal-case shrink-0">
                ({notes.length})
              </span>
            </h3>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Preset Widths Menu Toggle */}
          <div className="relative hidden md:block">
            <button
              id="btn-notepad-preset-width"
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              className="px-1.5 py-1 rounded-lg border text-[11px] font-mono text-zinc-400 hover:text-white bg-white/5 border-white/10 hover:bg-white/10 flex items-center gap-1 transition-colors cursor-pointer"
              title="Change notepad column width preset"
            >
              <span>{width}px</span>
            </button>

            {showPresetsMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-44 p-1.5 rounded-xl bg-zinc-900 border border-white/15 shadow-2xl z-50 animate-fadeIn text-xs flex flex-col gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Column Width
                </div>
                <button
                  onClick={() => handleSetPresetWidth(340)}
                  className={`px-2 py-1 rounded-lg text-left text-xs flex items-center justify-between hover:bg-white/10 ${
                    width === 340 ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-zinc-300'
                  }`}
                >
                  <span>Compact (340px)</span>
                  <span className="text-[10px] text-zinc-500 font-mono">1/4</span>
                </button>
                <button
                  onClick={() => handleSetPresetWidth(440)}
                  className={`px-2 py-1 rounded-lg text-left text-xs flex items-center justify-between hover:bg-white/10 ${
                    width === 440 ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-zinc-300'
                  }`}
                >
                  <span>Balanced (440px)</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Default</span>
                </button>
                <button
                  onClick={() => handleSetPresetWidth(580)}
                  className={`px-2 py-1 rounded-lg text-left text-xs flex items-center justify-between hover:bg-white/10 ${
                    width === 580 ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-zinc-300'
                  }`}
                >
                  <span>Wide (580px)</span>
                  <span className="text-[10px] text-zinc-500 font-mono">1/3</span>
                </button>
                <button
                  onClick={() => handleSetPresetWidth(Math.round(window.innerWidth * 0.5))}
                  className="px-2 py-1 rounded-lg text-left text-xs flex items-center justify-between hover:bg-white/10 text-zinc-300"
                >
                  <span>Half Screen (50%)</span>
                  <span className="text-[10px] text-zinc-500 font-mono">1/2</span>
                </button>
              </div>
            )}
          </div>

          {/* Toggle Note List / Drawer */}
          <button
            id="btn-notepad-toggle-list"
            onClick={() => setShowNoteList(!showNoteList)}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              showNoteList
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'text-zinc-400 hover:text-white bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            title="Browse all saved notes"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Notes</span>
          </button>

          {/* New Note Button */}
          <button
            id="btn-notepad-new-note"
            onClick={() => {
              const newId = onAddNote('yellow', '', `Note ${notes.length + 1}`);
              onSelectNote(newId);
              setShowNoteList(false);
            }}
            className="px-2 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            title="Create a new note"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">New</span>
          </button>

          {/* Close Notepad Panel */}
          <button
            id="btn-close-desktop-notepad"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-0.5 cursor-pointer"
            title="Hide notepad workspace"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Note Tabs Bar (when list is closed) */}
      {!showNoteList && notes.length > 1 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/10 bg-zinc-950/70 overflow-x-auto no-scrollbar shrink-0">
          {notes.map((note) => {
            const isSelected = activeNote?.id === note.id;
            const title = (note as any).title || note.content.slice(0, 16) || 'Untitled Note';
            return (
              <button
                key={note.id}
                id={`tab-note-${note.id}`}
                onClick={() => onSelectNote(note.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border-transparent hover:border-white/10'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    note.color === 'yellow' ? 'bg-amber-400' :
                    note.color === 'green' ? 'bg-emerald-400' :
                    note.color === 'pink' ? 'bg-pink-400' :
                    note.color === 'blue' ? 'bg-sky-400' :
                    note.color === 'purple' ? 'bg-purple-400' : 'bg-orange-400'
                  }`}
                />
                <span className="truncate max-w-[110px]">{title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Note List View Overlay if toggled */}
      {showNoteList ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 flex flex-col">
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search in notes & links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-500">
                No notes match "{searchQuery}"
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = activeNote?.id === note.id;
                const title = (note as any).title || note.content.slice(0, 30) || 'Untitled Note';
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      onSelectNote(note.id);
                      setShowNoteList(false);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-md text-amber-200'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 border-white/10 hover:border-white/20 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            note.color === 'yellow' ? 'bg-amber-400' :
                            note.color === 'green' ? 'bg-emerald-400' :
                            note.color === 'pink' ? 'bg-pink-400' :
                            note.color === 'blue' ? 'bg-sky-400' :
                            note.color === 'purple' ? 'bg-purple-400' : 'bg-orange-400'
                          }`}
                        />
                        <span className="font-bold text-xs truncate text-white">{title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notes.length <= 1) {
                              onUpdateNote({ ...note, content: '', updatedAt: Date.now() });
                            } else {
                              onDeleteNote(note.id);
                            }
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {note.content || 'Empty note...'}
                    </p>
                    <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
                      <span>{note.content.length} chars</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Active Note Workspace */
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {activeNote ? (
            <>
              {/* Note Controls Bar */}
              <div className="px-3.5 py-2 border-b border-white/10 bg-zinc-950/40 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
                {/* Note Title Input */}
                <input
                  id="input-notepad-title"
                  type="text"
                  value={(activeNote as any).title || ''}
                  onChange={(e) => {
                    onUpdateNote({
                      ...activeNote,
                      ...({ title: e.target.value } as any),
                      updatedAt: Date.now(),
                    });
                  }}
                  placeholder="Note Title (e.g. Research Links)"
                  className="bg-transparent text-xs sm:text-sm font-bold text-amber-300 placeholder:text-zinc-600 outline-none flex-1 min-w-[120px] truncate"
                />

                {/* Edit / Preview Toggle & Formatting Tools */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    id="btn-notepad-toggle-view"
                    onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
                      viewMode === 'preview'
                        ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                        : 'text-zinc-400 hover:text-white bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    title={viewMode === 'edit' ? 'Switch to interactive link & preview mode' : 'Switch to text editing mode'}
                  >
                    {viewMode === 'edit' ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                    <span className="text-[10px]">{viewMode === 'edit' ? 'Preview' : 'Edit'}</span>
                  </button>

                  {/* Color Accent Picker */}
                  <div className="relative">
                    <button
                      id="btn-notepad-color-picker"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Change note color tag"
                    >
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                    </button>

                    {showColorPicker && (
                      <div
                        className="absolute right-0 top-full mt-1 p-2 rounded-2xl bg-zinc-900 border border-white/20 shadow-2xl flex items-center gap-1.5 z-50 animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {STICKY_COLORS.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              onUpdateNote({ ...activeNote, color: c.id });
                              setShowColorPicker(false);
                            }}
                            className={`w-5 h-5 rounded-full border border-white/30 transition-transform hover:scale-110 flex items-center justify-center ${
                              c.id === 'yellow' ? 'bg-amber-400' :
                              c.id === 'green' ? 'bg-emerald-400' :
                              c.id === 'pink' ? 'bg-pink-400' :
                              c.id === 'blue' ? 'bg-sky-400' :
                              c.id === 'purple' ? 'bg-purple-400' : 'bg-orange-400'
                            }`}
                            title={c.name}
                          >
                            {activeNote.color === c.id && <Check className="w-3 h-3 text-black" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Copy Button */}
                  <button
                    id="btn-notepad-copy"
                    onClick={handleCopyNote}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Copy note to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {/* Export Button */}
                  <button
                    id="btn-notepad-export"
                    onClick={handleExportNote}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Download note as text file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    id="btn-notepad-delete"
                    onClick={() => {
                      if (notes.length <= 1) {
                        onUpdateNote({ ...activeNote, content: '', updatedAt: Date.now() });
                      } else {
                        onDeleteNote(activeNote.id);
                      }
                    }}
                    className="p-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Formatting Toolbar (Only in Edit mode) */}
              {viewMode === 'edit' && (
                <div className="px-3 py-1.5 border-b border-white/5 bg-zinc-950/70 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 text-zinc-400">
                  <button
                    onClick={() => handleInsertFormat('**', '**')}
                    className="px-2 py-0.5 rounded hover:bg-white/10 hover:text-white text-[11px] font-bold"
                    title="Bold"
                  >
                    <Bold className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleInsertFormat('*', '*')}
                    className="px-2 py-0.5 rounded hover:bg-white/10 hover:text-white text-[11px]"
                    title="Italic"
                  >
                    <Italic className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleInsertFormat('## ')}
                    className="px-2 py-0.5 rounded hover:bg-white/10 hover:text-white text-[11px] font-bold"
                    title="Heading"
                  >
                    H1
                  </button>
                  <button
                    onClick={() => handleInsertFormat('• ')}
                    className="px-2 py-0.5 rounded hover:bg-white/10 hover:text-white text-[11px]"
                    title="Bullet point"
                  >
                    <List className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleInsertFormat('- [ ] ')}
                    className="px-2 py-0.5 rounded hover:bg-white/10 hover:text-white text-[11px]"
                    title="Task checkbox"
                  >
                    <CheckSquare className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleInsertTimestamp}
                    className="px-2 py-0.5 rounded hover:bg-white/10 hover:text-white text-[11px] flex items-center gap-1"
                    title="Insert current date & time"
                  >
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px]">Time</span>
                  </button>
                  <button
                    onClick={() => handleInsertFormat('https://')}
                    className="px-2 py-0.5 rounded hover:bg-white/10 hover:text-white text-[11px] flex items-center gap-1"
                    title="Insert URL Link"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="text-[10px]">Link</span>
                  </button>
                </div>
              )}

              {/* Note Content Area */}
              <div className="flex-1 overflow-y-auto p-4 relative min-h-0 flex flex-col">
                {viewMode === 'edit' ? (
                  <textarea
                    ref={textareaRef}
                    id="textarea-desktop-notepad"
                    value={activeNote.content}
                    onChange={(e) => {
                      onUpdateNote({
                        ...activeNote,
                        content: e.target.value,
                        updatedAt: Date.now(),
                      });
                    }}
                    placeholder={`Type or paste your study links, formulas, or reminders here...\n\nExample:\nGdrive\nGoogle Drive: Sign-in\n\nRyda Main Website\nhttps://rydadigital.com`}
                    className="w-full flex-1 min-h-full h-full bg-transparent resize-none outline-none text-xs sm:text-sm font-sans leading-relaxed text-zinc-100 placeholder:text-zinc-600 selection:bg-amber-500/30 selection:text-white"
                  />
                ) : (
                  <div className="flex-1 min-h-full space-y-1 selection:bg-amber-500/30 selection:text-white">
                    {renderFormattedPreview(activeNote.content)}
                  </div>
                )}
              </div>

              {/* Bottom Status Bar */}
              <div className="px-3.5 py-2 border-t border-white/10 bg-zinc-950/90 flex items-center justify-between text-[10px] text-zinc-400 font-mono shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Auto-saved</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>{activeNote.content.trim() ? activeNote.content.trim().split(/\s+/).length : 0} words</span>
                  <span>{activeNote.content.length} chars</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500 text-xs">
              <FileText className="w-10 h-10 text-zinc-600 mb-2" />
              <p>No notes created yet.</p>
              <button
                onClick={() => onAddNote('yellow', '', 'Research Notes')}
                className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500 text-amber-950 font-bold text-xs"
              >
                Create Note
              </button>
            </div>
          )}
        </div>
      )}

      {/* Draggable Column Width Resizer on the right edge */}
      <div
        id="notepad-resize-handle"
        onPointerDown={handlePointerDown}
        onDoubleClick={handleResetWidth}
        title="Click and drag to resize notepad width (double click to reset to 440px)"
        className={`hidden md:flex absolute top-0 right-0 w-3 -mr-1.5 h-full cursor-col-resize items-center justify-center group z-40 transition-colors ${
          isDragging ? 'bg-amber-500/30' : 'hover:bg-amber-500/20'
        }`}
      >
        <div
          className={`w-1 h-8 rounded-full transition-all flex items-center justify-center ${
            isDragging
              ? 'bg-amber-400 h-16 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
              : 'bg-white/20 group-hover:bg-amber-400/80 group-hover:h-12'
          }`}
        />
        
        {/* Real-time Width Tooltip while Dragging */}
        {isDragging && (
          <div className="absolute top-1/2 -translate-y-1/2 left-4 px-2 py-1 rounded-md bg-amber-500 text-amber-950 font-bold text-[11px] font-mono shadow-2xl pointer-events-none whitespace-nowrap animate-fadeIn">
            {width}px
          </div>
        )}
      </div>
    </aside>
  );
};

