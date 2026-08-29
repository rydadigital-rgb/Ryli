import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Pin, 
  Trash2, 
  Search, 
  Plus, 
  BookOpen, 
  Layers, 
  Sparkles, 
  FileDown, 
  ShieldCheck, 
  GraduationCap,
  Calendar as CalendarIcon
} from 'lucide-react';
import { ChatSession, Flashcard } from '../types';
import { SUBJECT_PRESETS } from '../utils/themePresets';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onTogglePinSession: (id: string, e: React.MouseEvent) => void;
  onQuickSubjectPrompt: (promptText: string) => void;
  onOpenFlashcardLibrary: () => void;
  savedFlashcardsCount: number;
  onOpenCalendar?: () => void;
  calendarEventsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onTogglePinSession,
  onQuickSubjectPrompt,
  onOpenFlashcardLibrary,
  savedFlashcardsCount,
  onOpenCalendar,
  calendarEventsCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const recentSessions = filteredSessions.filter((s) => !s.isPinned);

  return (
    <aside
      id="app-sidebar-drawer"
      className="fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-zinc-950/95 backdrop-blur-2xl border-r border-white/10 p-4 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out text-white"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm">
            R
          </div>
          <div>
            <h3 className="font-bold text-sm font-display text-white">Study Sessions</h3>
            <p className="text-[11px] text-zinc-400">RYLI by Ryda AI</p>
          </div>
        </div>
        <button
          id="btn-close-sidebar"
          onClick={onClose}
          className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <button
        id="btn-sidebar-new-chat"
        onClick={() => {
          onNewSession();
          onClose();
        }}
        className="my-3 w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-semibold text-white flex items-center justify-between transition-all cursor-pointer shadow-sm group"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          <span>New Study Topic</span>
        </span>
        <span className="text-[10px] text-zinc-400 font-mono px-1.5 py-0.5 rounded bg-black/40">
          ⌘K
        </span>
      </button>

      {/* Search Sessions */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          id="input-search-sessions"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search study history..."
          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Quick Subject Launchers */}
      <div className="mb-3">
        <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center justify-between">
          <span>Quick Subjects</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {SUBJECT_PRESETS.slice(0, 4).map((sub) => (
            <button
              key={sub.id}
              id={`btn-quick-sub-${sub.id}`}
              onClick={() => {
                onQuickSubjectPrompt(sub.prompt);
                onClose();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-left text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 truncate cursor-pointer border border-white/5"
            >
              <span>{sub.icon}</span>
              <span className="truncate">{sub.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Calendar & Schedule shortcut */}
      {onOpenCalendar && (
        <button
          id="btn-sidebar-calendar-shortcut"
          onClick={() => {
            onOpenCalendar();
            onClose();
          }}
          className="mb-2 w-full p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-300 flex items-center justify-between hover:bg-blue-500/15 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            <span>School Calendar & Tasks</span>
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-[10px] font-bold">
            {calendarEventsCount}
          </span>
        </button>
      )}

      {/* Quick Flashcards Deck shortcut */}
      {savedFlashcardsCount > 0 && (
        <button
          id="btn-sidebar-flashcards-shortcut"
          onClick={() => {
            onOpenFlashcardLibrary();
            onClose();
          }}
          className="mb-3 w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300 flex items-center justify-between hover:bg-amber-500/15 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Saved Flashcard Decks</span>
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-[10px]">
            {savedFlashcardsCount}
          </span>
        </button>
      )}

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Pinned Sessions */}
        {pinnedSessions.length > 0 && (
          <div>
            <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 mb-1">
              <Pin className="w-3 h-3" /> Pinned Notes
            </div>
            <div className="space-y-1">
              {pinnedSessions.map((session) => (
                <div
                  key={session.id}
                  id={`session-item-${session.id}`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`group relative w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    activeSessionId === session.id
                      ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                      : 'text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      id={`btn-unpin-${session.id}`}
                      onClick={(e) => onTogglePinSession(session.id, e)}
                      className="p-1 text-amber-400 hover:text-amber-300"
                      title="Unpin"
                    >
                      <Pin className="w-3 h-3 fill-current" />
                    </button>
                    <button
                      id={`btn-delete-${session.id}`}
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className="p-1 text-zinc-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        <div>
          <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Recent Chats
          </div>
          {recentSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500">
              No recent study sessions
            </div>
          ) : (
            <div className="space-y-1">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  id={`session-item-${session.id}`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`group relative w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    activeSessionId === session.id
                      ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
                      : 'text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      id={`btn-pin-${session.id}`}
                      onClick={(e) => onTogglePinSession(session.id, e)}
                      className="p-1 text-zinc-400 hover:text-amber-400"
                      title="Pin session"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      id={`btn-delete-${session.id}`}
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className="p-1 text-zinc-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* School Safe Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400 font-semibold">School Safe Mode</span>
        </div>
        <span className="text-[10px] text-zinc-500">v1.0</span>
      </div>
    </aside>
  );
};
