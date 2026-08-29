import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Sparkles,
  Trash2,
  Edit3,
  Download,
  Search,
  Filter,
  Layers,
  BookOpen,
  CalendarDays,
  ListTodo,
  Check,
  AlertCircle
} from 'lucide-react';
import { CalendarEvent, CalendarCategory, PriorityLevel } from '../types';
import {
  CALENDAR_CATEGORIES,
  getCategoryMeta,
  formatEventDate,
  formatFullDate,
  formatEventTime,
  getTodayDateString,
  exportEventsToICS
} from '../utils/calendarUtils';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onToggleComplete: (id: string) => void;
  initialFocusDate?: string;
}

type ViewMode = 'month' | 'agenda' | 'week';

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onToggleComplete,
  initialFocusDate,
}) => {
  const todayStr = getTodayDateString();
  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (initialFocusDate) return parseInt(initialFocusDate.split('-')[0], 10);
    return new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (initialFocusDate) return parseInt(initialFocusDate.split('-')[1], 10) - 1;
    return new Date().getMonth();
  });
  const [selectedDate, setSelectedDate] = useState<string>(initialFocusDate || todayStr);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showMobileDayDetails, setShowMobileDayDetails] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setShowMobileDayDetails(false);
    }
  }, [isOpen]);

  // AI Quick Schedule bar state
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isAiScheduling, setIsAiScheduling] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Add / Edit Modal Sub-dialog State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    date: string;
    endDate: string;
    time: string;
    endTime: string;
    category: CalendarCategory;
    priority: PriorityLevel;
    subject: string;
    location: string;
    description: string;
  }>({
    title: '',
    date: selectedDate,
    endDate: '',
    time: '09:00',
    endTime: '',
    category: 'study_session',
    priority: 'medium',
    subject: '',
    location: '',
    description: '',
  });

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  // Month calendar grid computation
  const monthDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Leading days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Trailing days from next month to complete 6 weeks grid (35 or 42 cells)
    const totalSlots = days.length > 35 ? 42 : 35;
    const remainingSlots = totalSlots - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Category filter
      if (selectedCategory !== 'all' && ev.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'pending' && ev.isCompleted) return false;
      if (statusFilter === 'completed' && !ev.isCompleted) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesSubject = ev.subject?.toLowerCase().includes(q);
        const matchesDesc = ev.description?.toLowerCase().includes(q);
        const matchesLoc = ev.location?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesDesc && !matchesLoc) {
          return false;
        }
      }
      return true;
    });
  }, [events, selectedCategory, statusFilter, searchQuery]);

  // Events on selected day
  const selectedDayEvents = useMemo(() => {
    return filteredEvents
      .filter((ev) => ev.date === selectedDate || (ev.endDate && ev.date <= selectedDate && ev.endDate >= selectedDate))
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  }, [filteredEvents, selectedDate]);

  // Month name display
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  // Open add modal for specific date
  const handleOpenAddModal = (dateToUse?: string) => {
    setEditingEventId(null);
    setFormData({
      title: '',
      date: dateToUse || selectedDate || todayStr,
      endDate: '',
      time: '10:00',
      endTime: '',
      category: 'study_session',
      priority: 'medium',
      subject: '',
      location: '',
      description: '',
    });
    setIsAddEditModalOpen(true);
  };

  // Open edit modal for an existing event
  const handleOpenEditModal = (ev: CalendarEvent) => {
    setEditingEventId(ev.id);
    setFormData({
      title: ev.title,
      date: ev.date,
      endDate: ev.endDate || '',
      time: ev.time || '',
      endTime: ev.endTime || '',
      category: ev.category,
      priority: ev.priority,
      subject: ev.subject || '',
      location: ev.location || '',
      description: ev.description || '',
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) return;

    if (editingEventId) {
      const existing = events.find((e) => e.id === editingEventId);
      if (existing) {
        onUpdateEvent({
          ...existing,
          title: formData.title.trim(),
          date: formData.date,
          endDate: formData.endDate || undefined,
          time: formData.time || undefined,
          endTime: formData.endTime || undefined,
          category: formData.category,
          priority: formData.priority,
          subject: formData.subject.trim() || undefined,
          location: formData.location.trim() || undefined,
          description: formData.description.trim() || undefined,
        });
      }
    } else {
      const newEvent: CalendarEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: formData.title.trim(),
        date: formData.date,
        endDate: formData.endDate || undefined,
        time: formData.time || undefined,
        endTime: formData.endTime || undefined,
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject.trim() || undefined,
        location: formData.location.trim() || undefined,
        description: formData.description.trim() || undefined,
        isCompleted: false,
        source: 'manual',
        createdAt: Date.now(),
      };
      onAddEvent(newEvent);
    }

    setIsAddEditModalOpen(false);
  };

  // Quick AI Schedule Handler
  const handleAiScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim() || isAiScheduling) return;

    setIsAiScheduling(true);
    setAiFeedback(null);

    try {
      const response = await fetch('/api/parse-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: quickPrompt.trim(),
          currentDate: todayStr,
        }),
      });

      if (!response.ok) throw new Error('Failed to parse schedule');
      const data = await response.json();

      if (data.event) {
        onAddEvent(data.event);
        setSelectedDate(data.event.date);
        setQuickPrompt('');
        setAiFeedback(`✨ Scheduled: "${data.event.title}" on ${formatEventDate(data.event.date)}!`);
        setTimeout(() => setAiFeedback(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setAiFeedback('Could not schedule event automatically. Try adding manually.');
      setTimeout(() => setAiFeedback(null), 4000);
    } finally {
      setIsAiScheduling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="school-calendar-modal"
        className="relative w-full max-w-5xl h-[95vh] sm:h-[90vh] max-h-[850px] flex flex-col rounded-2xl sm:rounded-3xl border border-white/20 bg-zinc-950/95 text-white shadow-2xl overflow-hidden backdrop-blur-2xl"
      >
        {/* Top Header */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 sm:gap-3 bg-zinc-900/70">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 shrink-0">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold font-display text-white">School Calendar</h2>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 border border-blue-500/30 text-blue-300">
                  {events.length}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Organize exams, homework deadlines, school events, and study blocks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
              <button
                id="view-mode-month"
                onClick={() => setViewMode('month')}
                className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  viewMode === 'month' ? 'bg-blue-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Month
              </button>
              <button
                id="view-mode-agenda"
                onClick={() => setViewMode('agenda')}
                className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  viewMode === 'agenda' ? 'bg-blue-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Agenda
              </button>
            </div>

            {/* Export .ICS */}
            <button
              id="btn-export-calendar-ics"
              onClick={() => exportEventsToICS(events)}
              className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Export to iCalendar (.ics)"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* + Add Event Button */}
            <button
              id="btn-open-add-event-dialog"
              onClick={() => handleOpenAddModal(selectedDate)}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Event</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* Close Modal */}
            <button
              id="btn-close-calendar-modal"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Quick Scheduler Bar */}
        <div className="px-3 sm:px-5 py-2 border-b border-white/10 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40">
          <form onSubmit={handleAiScheduleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-blue-400">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[11px] font-bold hidden md:inline uppercase tracking-wider">AI Quick-Add:</span>
              </div>
              <input
                id="input-ai-quick-schedule"
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder='E.g. "Math exam on Friday at 9am in Rm 204"'
                className="w-full pl-8 md:pl-28 pr-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              id="btn-submit-ai-quick-schedule"
              type="submit"
              disabled={isAiScheduling || !quickPrompt.trim()}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
            >
              {isAiScheduling ? (
                <span>Parsing...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Schedule</span>
                </>
              )}
            </button>
          </form>

          {aiFeedback && (
            <div className="mt-1.5 text-xs font-medium text-emerald-400 flex items-center gap-1 animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              <span>{aiFeedback}</span>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="px-3 sm:px-5 py-2 border-b border-white/10 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            <button
              id="filter-cat-all"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              All ({events.length})
            </button>
            {Object.values(CALENDAR_CATEGORIES).map((cat) => {
              const count = events.filter((e) => e.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  id={`filter-cat-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? `${cat.badgeClass} ring-1 ring-white/30`
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search box & status filter */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="input-search-calendar-events"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full sm:w-36 md:w-44 pl-8 pr-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              id="select-calendar-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer shrink-0"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Done</option>
            </select>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {viewMode === 'month' ? (
            <>
              {/* Left Month Grid */}
              <div className="flex-1 p-4 flex flex-col border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto">
                {/* Month Navigator */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold font-display text-white">
                      {monthName}
                    </h3>
                    <button
                      id="btn-calendar-today"
                      onClick={handleGoToToday}
                      className="px-2.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-zinc-200 transition-colors cursor-pointer"
                    >
                      Today
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      id="btn-calendar-prev-month"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      id="btn-calendar-next-month"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                {/* Month Grid Cells */}
                <div className="grid grid-cols-7 gap-1 flex-1 min-h-[280px] sm:min-h-[320px]">
                  {monthDays.map((day, idx) => {
                    const dayEvents = filteredEvents.filter(
                      (ev) => ev.date === day.dateStr || (ev.endDate && ev.date <= day.dateStr && ev.endDate >= day.dateStr)
                    );
                    const isSelected = selectedDate === day.dateStr;

                    return (
                      <div
                        key={idx}
                        id={`calendar-day-cell-${day.dateStr}`}
                        onClick={() => {
                          setSelectedDate(day.dateStr);
                          setShowMobileDayDetails(true);
                        }}
                        className={`group relative p-1 sm:p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[52px] sm:min-h-[70px] ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50 shadow-md'
                            : day.isToday
                            ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
                            : day.isCurrentMonth
                            ? 'bg-zinc-900/60 border-white/5 hover:border-white/20 hover:bg-zinc-800/60'
                            : 'bg-zinc-950/40 border-transparent text-zinc-600 hover:bg-zinc-900/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold rounded-md px-1.5 py-0.5 ${
                              day.isToday
                                ? 'bg-amber-500 text-zinc-950 font-black'
                                : isSelected
                                ? 'bg-blue-600 text-white'
                                : day.isCurrentMonth
                                ? 'text-zinc-200'
                                : 'text-zinc-600'
                            }`}
                          >
                            {day.dayNumber}
                          </span>

                          {dayEvents.length > 0 && (
                            <span className="text-[10px] font-bold text-zinc-400">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Event Pills preview */}
                        <div className="space-y-0.5 mt-1 overflow-hidden">
                          {dayEvents.slice(0, 2).map((ev) => {
                            const meta = getCategoryMeta(ev.category);
                            return (
                              <div
                                key={ev.id}
                                className={`text-[9px] font-semibold px-1 py-0.5 rounded truncate border ${meta.borderClass} ${meta.bgLightClass} ${
                                  ev.isCompleted ? 'line-through opacity-60' : ''
                                } text-zinc-200 flex items-center gap-0.5`}
                              >
                                <span className="text-[8px]">{meta.icon}</span>
                                <span className="truncate">{ev.title}</span>
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-[9px] text-blue-400 font-bold pl-0.5">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Guide Note */}
                <div className="md:hidden mt-2.5 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center text-xs text-blue-300 flex items-center justify-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Tap any day cell to view or add study tasks</span>
                </div>
              </div>

              {/* Desktop Side Panel: Selected Day Details */}
              <div className="hidden md:flex md:w-80 lg:w-96 p-4 bg-zinc-900/40 flex-col justify-between overflow-y-auto border-l border-white/10 shrink-0">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <div>
                      <h4 className="font-bold text-sm text-white font-display">
                        {formatFullDate(selectedDate)}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled
                      </p>
                    </div>

                    <button
                      id="btn-add-event-on-selected-day"
                      onClick={() => handleOpenAddModal(selectedDate)}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                      title="Add task on this day"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day Events List */}
                  {selectedDayEvents.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center text-zinc-500 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <p className="text-xs">No tasks or school events scheduled on this day.</p>
                      <button
                        id="btn-empty-add-event"
                        onClick={() => handleOpenAddModal(selectedDate)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        + Add a task or exam
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedDayEvents.map((ev) => {
                        const meta = getCategoryMeta(ev.category);
                        return (
                          <div
                            key={ev.id}
                            id={`day-event-card-${ev.id}`}
                            className={`p-3 rounded-2xl border ${meta.borderClass} ${meta.bgLightClass} text-white space-y-2 transition-all hover:scale-[1.01]`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <button
                                  id={`btn-toggle-done-${ev.id}`}
                                  onClick={() => onToggleComplete(ev.id)}
                                  className="mt-0.5 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                                >
                                  {ev.isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-zinc-400" />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1 mb-1">
                                    <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${meta.badgeClass}`}>
                                      {meta.icon} {meta.label}
                                    </span>
                                    {ev.priority === 'high' && (
                                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300">
                                        High
                                      </span>
                                    )}
                                  </div>
                                  <h5 className={`text-xs font-bold text-white ${ev.isCompleted ? 'line-through text-zinc-400' : ''}`}>
                                    {ev.title}
                                  </h5>
                                  {ev.description && (
                                    <p className="text-[11px] text-zinc-300 mt-1 line-clamp-2">
                                      {ev.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  id={`btn-edit-event-${ev.id}`}
                                  onClick={() => handleOpenEditModal(ev)}
                                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`btn-delete-event-${ev.id}`}
                                  onClick={() => onDeleteEvent(ev.id)}
                                  className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-300 pt-1 border-t border-white/10">
                              {ev.time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>{formatEventTime(ev.time)}</span>
                                </div>
                              )}
                              {ev.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-emerald-400" />
                                  <span className="truncate max-w-[120px]">{ev.location}</span>
                                </div>
                              )}
                              {ev.subject && (
                                <span className="text-blue-300 font-semibold">{ev.subject}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Day Footer Stats */}
                <div className="pt-3 border-t border-white/10 mt-3 text-xs text-zinc-400 flex items-center justify-between">
                  <span>Completed: {selectedDayEvents.filter((e) => e.isCompleted).length} / {selectedDayEvents.length}</span>
                  <span className="text-[10px] text-zinc-500">Auto-saved to storage</span>
                </div>
              </div>

              {/* Mobile Slide-up Bottom Sheet Modal for Selected Day */}
              {showMobileDayDetails && (
                <div
                  className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end p-0 animate-fadeIn"
                  onClick={() => setShowMobileDayDetails(false)}
                >
                  <div
                    className="w-full max-h-[85vh] bg-zinc-950 border-t border-white/20 rounded-t-3xl p-4 sm:p-5 flex flex-col shadow-2xl overflow-y-auto animate-slideUp"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header with clear Cancel / Close and Add button */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-white font-display">
                          {formatFullDate(selectedDate)}
                        </h4>
                        <p className="text-xs text-zinc-400">
                          {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          id="btn-mobile-add-event-day"
                          onClick={() => handleOpenAddModal(selectedDate)}
                          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                          title="Add task on this day"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {/* Clear Cancel / Close button */}
                        <button
                          id="btn-mobile-close-day-view"
                          onClick={() => setShowMobileDayDetails(false)}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Close</span>
                        </button>
                      </div>
                    </div>

                    {/* Day Events on Mobile */}
                    {selectedDayEvents.length === 0 ? (
                      <div className="p-6 text-center flex flex-col items-center justify-center text-zinc-400 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400">
                          <CalendarDays className="w-6 h-6" />
                        </div>
                        <p className="text-xs text-zinc-300">No tasks or school events scheduled on this day.</p>
                        <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
                          <button
                            id="btn-mobile-empty-add-event"
                            onClick={() => handleOpenAddModal(selectedDate)}
                            className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors cursor-pointer"
                          >
                            + Add a task or exam
                          </button>
                          <button
                            id="btn-mobile-empty-cancel"
                            onClick={() => setShowMobileDayDetails(false)}
                            className="flex-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                          >
                            Cancel & View Calendar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-0.5">
                        {selectedDayEvents.map((ev) => {
                          const meta = getCategoryMeta(ev.category);
                          return (
                            <div
                              key={ev.id}
                              id={`mobile-day-event-card-${ev.id}`}
                              className={`p-3 rounded-2xl border ${meta.borderClass} ${meta.bgLightClass} text-white space-y-2`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <button
                                    id={`btn-mobile-toggle-done-${ev.id}`}
                                    onClick={() => onToggleComplete(ev.id)}
                                    className="mt-0.5 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                                  >
                                    {ev.isCompleted ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-zinc-400" />
                                    )}
                                  </button>
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1 mb-1">
                                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${meta.badgeClass}`}>
                                        {meta.icon} {meta.label}
                                      </span>
                                      {ev.priority === 'high' && (
                                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300">
                                          High
                                        </span>
                                      )}
                                    </div>
                                    <h5 className={`text-xs font-bold text-white ${ev.isCompleted ? 'line-through text-zinc-400' : ''}`}>
                                      {ev.title}
                                    </h5>
                                    {ev.description && (
                                      <p className="text-[11px] text-zinc-300 mt-1 line-clamp-2">
                                        {ev.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    id={`btn-mobile-edit-event-${ev.id}`}
                                    onClick={() => handleOpenEditModal(ev)}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    id={`btn-mobile-delete-event-${ev.id}`}
                                    onClick={() => onDeleteEvent(ev.id)}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-300 pt-1 border-t border-white/10">
                                {ev.time && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>{formatEventTime(ev.time)}</span>
                                  </div>
                                )}
                                {ev.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-emerald-400" />
                                    <span className="truncate max-w-[120px]">{ev.location}</span>
                                  </div>
                                )}
                                {ev.subject && (
                                  <span className="text-blue-300 font-semibold">{ev.subject}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Bottom Back Button */}
                    <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between gap-2">
                      <button
                        id="btn-mobile-back-to-calendar"
                        onClick={() => setShowMobileDayDetails(false)}
                        className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer text-center"
                      >
                        ← Back to Calendar Grid
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Agenda List View */
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-base font-bold font-display text-white">
                  Upcoming Agenda & Tasks ({filteredEvents.length})
                </h3>
                <button
                  id="btn-agenda-add-event"
                  onClick={() => handleOpenAddModal()}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task / Event
                </button>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="p-12 text-center text-zinc-400">
                  <ListTodo className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                  <p className="text-sm">No events match your current filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredEvents
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((ev) => {
                      const meta = getCategoryMeta(ev.category);
                      return (
                        <div
                          key={ev.id}
                          id={`agenda-event-card-${ev.id}`}
                          className={`p-4 rounded-2xl border ${meta.borderClass} ${meta.bgLightClass} text-white flex flex-col justify-between space-y-3 transition-all hover:scale-[1.01]`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  id={`btn-agenda-toggle-${ev.id}`}
                                  onClick={() => onToggleComplete(ev.id)}
                                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  {ev.isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-zinc-400" />
                                  )}
                                </button>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeClass}`}>
                                  {meta.icon} {meta.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditModal(ev)}
                                  className="p-1 text-zinc-400 hover:text-white"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteEvent(ev.id)}
                                  className="p-1 text-zinc-400 hover:text-rose-400"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className={`text-sm font-bold mt-2 ${ev.isCompleted ? 'line-through text-zinc-400' : 'text-white'}`}>
                              {ev.title}
                            </h4>
                            {ev.description && (
                              <p className="text-xs text-zinc-300 mt-1 line-clamp-2">
                                {ev.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-zinc-300">
                            <div className="flex items-center gap-1 font-semibold text-blue-400">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              <span>{formatEventDate(ev.date)}</span>
                            </div>
                            {ev.time && (
                              <div className="flex items-center gap-1 text-amber-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formatEventTime(ev.time)}</span>
                              </div>
                            )}
                            {ev.location && (
                              <div className="flex items-center gap-1 text-emerald-400">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[120px]">{ev.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Prompt RYLI anytime in chat to save dates or reminders for you!</span>
          </div>
          <button
            id="btn-done-calendar-modal"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Sub-Dialog: Add / Edit Event Form */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-zinc-950 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-base font-display text-white">
                {editingEventId ? 'Edit Event / Task' : 'Schedule New Event or Task'}
              </h3>
              <button
                id="btn-close-subdialog"
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Title / Event Name *
                </label>
                <input
                  id="input-event-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Calculus Midterm, Biology Lab Submission, Science Fair"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Event Date *
                  </label>
                  <input
                    id="input-event-date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Time (Optional)
                  </label>
                  <input
                    id="input-event-time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Category & Priority Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    id="select-event-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CalendarCategory })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {Object.values(CALENDAR_CATEGORIES).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Priority
                  </label>
                  <select
                    id="select-event-priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="high">🔴 High Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="low">🟢 Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Subject & Location Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Subject (Optional)
                  </label>
                  <input
                    id="input-event-subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Math, Physics, English"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Location / Room (Optional)
                  </label>
                  <input
                    id="input-event-location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Science Lab, Room 302, Gym"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes / Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Description / Study Notes (Optional)
                </label>
                <textarea
                  id="input-event-description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details, chapters to review, rubrics, or reminders..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  id="btn-cancel-add-event"
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-event-submit"
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer"
                >
                  {editingEventId ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
