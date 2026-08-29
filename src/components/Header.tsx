import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  PlusCircle, 
  Timer, 
  Palette, 
  ShieldCheck, 
  GraduationCap, 
  Sparkles, 
  Check, 
  ChevronDown,
  Calendar as CalendarIcon
} from 'lucide-react';
import { RyliLogo } from './RyliLogo';
import { GradeLevel, StudyMode, WallpaperTheme } from '../types';
import { THEME_OPTIONS } from '../utils/themePresets';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenFocusTimer: () => void;
  onOpenTipsModal: () => void;
  onOpenThemeModal?: () => void;
  onOpenCalendar?: () => void;
  calendarEventsCount?: number;
  gradeLevel: GradeLevel;
  onChangeGradeLevel: (level: GradeLevel) => void;
  studyMode: StudyMode;
  onChangeStudyMode: (mode: StudyMode) => void;
  currentTheme: WallpaperTheme;
  onChangeTheme: (theme: WallpaperTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNewChat,
  onOpenFocusTimer,
  onOpenTipsModal,
  onOpenThemeModal,
  onOpenCalendar,
  calendarEventsCount = 0,
  gradeLevel,
  onChangeGradeLevel,
  studyMode,
  onChangeStudyMode,
  currentTheme,
  onChangeTheme,
}) => {
  const [showGradeMenu, setShowGradeMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const gradeMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (gradeMenuRef.current && !gradeMenuRef.current.contains(e.target as Node)) {
        setShowGradeMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const gradeLabels: Record<GradeLevel, { label: string; short: string; badge: string }> = {
    elementary: { label: 'Elementary (Grades 3-5)', short: 'Grades 3-5', badge: 'bg-emerald-500/20 text-emerald-300' },
    middle_school: { label: 'Middle School (Grades 6-8)', short: 'Grades 6-8', badge: 'bg-blue-500/20 text-blue-300' },
    high_school: { label: 'High School (Grades 9-12)', short: 'Grades 9-12', badge: 'bg-indigo-500/20 text-indigo-300' },
    ap_college: { label: 'AP & College Prep', short: 'AP/College', badge: 'bg-purple-500/20 text-purple-300' },
  };

  return (
    <header className="sticky top-0 z-40 w-full px-2 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between border-b border-white/10 bg-zinc-950/60 backdrop-blur-xl transition-all">
      {/* Left section: Sidebar toggle & Brand Logo */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="p-1.5 sm:p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Toggle history & tools"
        >
          <Menu className="w-5 h-5" />
        </button>

        <RyliLogo size="sm" showSubtitle={true} onClick={onNewChat} />
      </div>

      {/* Center Section: Grade level */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Grade Level Dropdown */}
        <div className="relative" ref={gradeMenuRef}>
          <button
            id="btn-grade-selector"
            onClick={() => setShowGradeMenu(!showGradeMenu)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] sm:text-xs font-semibold text-zinc-200 transition-all cursor-pointer shadow-sm"
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="hidden sm:inline">{gradeLabels[gradeLevel].label}</span>
            <span className="sm:hidden">{gradeLabels[gradeLevel].short}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
          </button>

          {showGradeMenu && (
            <div
              id="grade-dropdown-menu"
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 sm:w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/20 bg-zinc-900/95 backdrop-blur-2xl shadow-2xl p-2 z-50 animate-fadeIn"
            >
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/10">
                Select Grade Level
              </div>
              <div className="py-1 space-y-1">
                {(Object.keys(gradeLabels) as GradeLevel[]).map((level) => (
                  <button
                    key={level}
                    id={`btn-select-grade-${level}`}
                    onClick={() => {
                      onChangeGradeLevel(level);
                      setShowGradeMenu(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      gradeLevel === level ? 'bg-blue-600 text-white font-semibold' : 'text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{gradeLabels[level].label}</span>
                    {gradeLevel === level && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Calendar, Focus timer, theme switcher, school safe guide, new chat */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* School Calendar Button */}
        {onOpenCalendar && (
          <button
            id="btn-header-calendar"
            onClick={onOpenCalendar}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-semibold text-blue-300 flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-sm"
            title="School Calendar & Schedule"
          >
            <CalendarIcon className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="hidden lg:inline">Calendar</span>
            {calendarEventsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-[10px] font-bold text-white leading-tight">
                {calendarEventsCount}
              </span>
            )}
          </button>
        )}

        {/* Focus Timer (Available in Sidebar on mobile, visible in header on sm+) */}
        <button
          id="btn-header-timer"
          onClick={onOpenFocusTimer}
          className="hidden sm:flex p-2 sm:px-3 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-zinc-200 items-center gap-1.5 transition-all cursor-pointer"
          title="Pomodoro study focus timer"
        >
          <Timer className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="hidden lg:inline">Focus Timer</span>
        </button>

        {/* Theme / Wallpaper Switcher */}
        <div className="relative" ref={themeMenuRef}>
          <button
            id="btn-header-theme"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-1.5 sm:p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/15 transition-all cursor-pointer flex items-center gap-1"
            title="Change Philippine background atmosphere"
          >
            <Palette className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden xl:inline text-xs font-semibold text-zinc-300">Atmosphere</span>
          </button>

          {showThemeMenu && (
            <div
              id="theme-dropdown-menu"
              className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/20 bg-zinc-900/95 backdrop-blur-2xl shadow-2xl p-2 z-50 animate-fadeIn"
            >
              <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  🇵🇭 Philippine Atmosphere
                </span>
                {onOpenThemeModal && (
                  <button
                    id="btn-open-full-theme-modal"
                    onClick={() => {
                      setShowThemeMenu(false);
                      onOpenThemeModal();
                    }}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                  >
                    View Gallery
                  </button>
                )}
              </div>
              <div className="py-1 space-y-1 max-h-80 overflow-y-auto pr-0.5">
                {THEME_OPTIONS.filter((t) => t.id !== 'rice_terrace').map((theme) => {
                  const isSelected = currentTheme === theme.id || (theme.id === 'banaue_rice_terraces' && currentTheme === 'rice_terrace');
                  return (
                    <button
                      key={theme.id}
                      id={`btn-theme-${theme.id}`}
                      onClick={() => {
                        onChangeTheme(theme.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-600/30 border border-blue-500/40 text-white font-semibold' : 'text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/15 bg-zinc-950">
                        {theme.previewUrl ? (
                          <img
                            src={theme.previewUrl}
                            alt={theme.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-500 font-mono">
                            Dark
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-xs truncate font-semibold">{theme.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-blue-300/90 truncate">{theme.location}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {onOpenThemeModal && (
                <div className="pt-2 border-t border-white/10 mt-1">
                  <button
                    id="btn-footer-explore-themes"
                    onClick={() => {
                      setShowThemeMenu(false);
                      onOpenThemeModal();
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-center text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Explore All Philippine Backgrounds
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* School Safe Guide (Available in Sidebar, visible on sm+) */}
        <button
          id="btn-header-safety"
          onClick={onOpenTipsModal}
          className="hidden sm:flex p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="School AI safety & study guide"
        >
          <ShieldCheck className="w-4 h-4 text-blue-400" />
        </button>

        {/* New Chat Button */}
        <button
          id="btn-header-new-chat"
          onClick={onNewChat}
          className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer shrink-0"
          title="Start new study session"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden md:inline">New Session</span>
        </button>
      </div>
    </header>
  );
};
