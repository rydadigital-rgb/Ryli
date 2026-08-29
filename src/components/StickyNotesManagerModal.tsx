import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Search, 
  StickyNote as StickyIcon,
  Palette,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { StickyNoteItem, StickyColor } from '../types';
import { STICKY_COLORS } from '../utils/stickyNotesUtils';

interface StickyNotesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: StickyNoteItem[];
  onAddNote: (color?: StickyColor) => void;
  onUpdateNote: (updated: StickyNoteItem) => void;
  onDeleteNote: (id: string) => void;
  onClearAll: () => void;
}

export const StickyNotesManagerModal: React.FC<StickyNotesManagerProps> = ({
  isOpen,
  onClose,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColorFilter, setSelectedColorFilter] = useState<StickyColor | 'all'>('all');

  if (!isOpen) return null;

  const filteredNotes = notes.filter((n) => {
    const matchesSearch = n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesColor = selectedColorFilter === 'all' || n.color === selectedColorFilter;
    return matchesSearch && matchesColor;
  });

  return (
    <div
      id="modal-sticky-notes-manager"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-3xl bg-zinc-950/95 border border-white/20 p-5 sm:p-6 shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <StickyIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">Sticky Notes Collection</h3>
              <p className="text-xs text-zinc-400">Manage and search all your active study reminders</p>
            </div>
          </div>
          <button
            id="btn-close-sticky-manager"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-2.5 shrink-0 border-b border-white/10">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-sticky-notes"
              type="text"
              placeholder="Search study notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Quick Add Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id="btn-manager-add-yellow"
              onClick={() => onAddNote('yellow')}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-amber-950 hover:bg-amber-300 text-xs font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Sticky</span>
            </button>

            {notes.length > 0 && (
              <button
                id="btn-manager-clear-all"
                onClick={() => {
                  if (window.confirm('Delete all sticky notes?')) {
                    onClearAll();
                  }
                }}
                className="p-1.5 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                title="Clear all notes"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Notes Grid / List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 px-4">
              <StickyIcon className="w-12 h-12 text-zinc-600 mx-auto mb-3 stroke-[1.5]" />
              <h4 className="text-sm font-semibold text-zinc-300">No sticky notes found</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'No notes match your search query.'
                  : 'Add sticky notes while chatting to jot down study pointers, formulas, and reminders!'}
              </p>
              <button
                onClick={() => onAddNote('yellow')}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create First Sticky Note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredNotes.map((note) => {
                const colorConfig = STICKY_COLORS.find((c) => c.id === note.color) || STICKY_COLORS[0];
                return (
                  <div
                    key={note.id}
                    className={`rounded-2xl border p-3 flex flex-col justify-between shadow-lg ${colorConfig.bg} ${colorConfig.border}`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10 text-[11px] font-bold">
                        <span className="uppercase tracking-wider opacity-80">{colorConfig.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onDeleteNote(note.id)}
                            className="p-1 rounded hover:bg-red-500/20 text-red-700 transition-colors"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={note.content}
                        onChange={(e) => onUpdateNote({ ...note, content: e.target.value, updatedAt: Date.now() })}
                        placeholder="Empty note..."
                        className={`w-full h-24 bg-transparent resize-none outline-none text-xs font-medium ${colorConfig.text}`}
                      />
                    </div>
                    <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[10px] opacity-70">
                      <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
                      <span>{note.content.length} characters</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
