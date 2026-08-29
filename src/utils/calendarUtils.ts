import { CalendarEvent, CalendarCategory, PriorityLevel } from '../types';

export const CALENDAR_STORAGE_KEY = 'ryli_school_calendar_events_v1';

export interface CategoryMetadata {
  id: CalendarCategory;
  label: string;
  badgeClass: string;
  borderClass: string;
  bgLightClass: string;
  dotColor: string;
  icon: string;
}

export const CALENDAR_CATEGORIES: Record<CalendarCategory, CategoryMetadata> = {
  school_event: {
    id: 'school_event',
    label: 'School Event',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    borderClass: 'border-emerald-500/40',
    bgLightClass: 'bg-emerald-500/10',
    dotColor: '#10b981',
    icon: '🎒',
  },
  assignment: {
    id: 'assignment',
    label: 'Assignment / Homework',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    borderClass: 'border-blue-500/40',
    bgLightClass: 'bg-blue-500/10',
    dotColor: '#3b82f6',
    icon: '📝',
  },
  exam: {
    id: 'exam',
    label: 'Exam / Quiz',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    borderClass: 'border-rose-500/40',
    bgLightClass: 'bg-rose-500/10',
    dotColor: '#f43f5e',
    icon: '⚡',
  },
  project: {
    id: 'project',
    label: 'Project / Group Work',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    borderClass: 'border-purple-500/40',
    bgLightClass: 'bg-purple-500/10',
    dotColor: '#a855f7',
    icon: '🔬',
  },
  study_session: {
    id: 'study_session',
    label: 'Study Session',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    borderClass: 'border-amber-500/40',
    bgLightClass: 'bg-amber-500/10',
    dotColor: '#f59e0b',
    icon: '📖',
  },
  personal: {
    id: 'personal',
    label: 'Personal Task',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    borderClass: 'border-cyan-500/40',
    bgLightClass: 'bg-cyan-500/10',
    dotColor: '#06b6d4',
    icon: '⭐',
  },
  extracurricular: {
    id: 'extracurricular',
    label: 'Club / Sports',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    borderClass: 'border-indigo-500/40',
    bgLightClass: 'bg-indigo-500/10',
    dotColor: '#6366f1',
    icon: '🏆',
  },
};

export const getCategoryMeta = (category: CalendarCategory): CategoryMetadata => {
  return CALENDAR_CATEGORIES[category] || CALENDAR_CATEGORIES.personal;
};

// Generate realistic default starter events based on relative dates from today
export const getDefaultCalendarEvents = (): CalendarEvent[] => {
  const now = new Date();
  
  const formatDateOffset = (daysOffset: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return [
    {
      id: 'event-init-1',
      title: 'Math Calculus & Trigonometry Review',
      date: formatDateOffset(0), // Today
      time: '16:00',
      endTime: '17:30',
      category: 'study_session',
      priority: 'high',
      subject: 'Mathematics',
      location: 'School Library / Online',
      description: 'Review derivatives, limits, and practice 10 past paper problems with RYLI.',
      isCompleted: false,
      source: 'ai_assistant',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'event-init-2',
      title: 'English Literature Essay Submission',
      date: formatDateOffset(2), // 2 days from now
      time: '23:59',
      category: 'assignment',
      priority: 'high',
      subject: 'English',
      location: 'Google Classroom',
      description: 'Submit 1,200-word analysis on themes of identity and historical struggle.',
      isCompleted: false,
      source: 'manual',
      createdAt: Date.now() - 43200000,
    },
    {
      id: 'event-init-3',
      title: 'Philippine Science Fair & STEM Expo',
      date: formatDateOffset(5),
      endDate: formatDateOffset(6),
      time: '08:30',
      endTime: '15:30',
      category: 'school_event',
      priority: 'medium',
      subject: 'Science',
      location: 'School Main Auditorium & Gymnasium',
      description: 'Annual high school science innovation exhibit and robotics demonstration.',
      isCompleted: false,
      source: 'manual',
      createdAt: Date.now() - 21600000,
    },
    {
      id: 'event-init-4',
      title: 'Physics & Earth Science Midterm Exam',
      date: formatDateOffset(8),
      time: '09:00',
      endTime: '11:00',
      category: 'exam',
      priority: 'high',
      subject: 'Physics',
      location: 'Science Building Room 304',
      description: 'Covers Newton\'s Laws, Thermodynamics, and Plate Tectonics / Ring of Fire.',
      isCompleted: false,
      source: 'ai_assistant',
      createdAt: Date.now() - 10000000,
    },
    {
      id: 'event-init-5',
      title: 'Robotics Club Project Milestone',
      date: formatDateOffset(12),
      time: '15:00',
      endTime: '17:00',
      category: 'project',
      priority: 'medium',
      subject: 'Computer Science',
      location: 'Makerspace Lab 2',
      description: 'Assemble sensor hardware and calibrate Arduino line follower algorithm.',
      isCompleted: false,
      source: 'manual',
      createdAt: Date.now() - 5000000,
    }
  ];
};

export const loadCalendarEvents = (): CalendarEvent[] => {
  try {
    const raw = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (!raw) {
      const defaults = getDefaultCalendarEvents();
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load calendar events from localStorage:', e);
    return getDefaultCalendarEvents();
  }
};

export const loadCalendarEventsFromStorage = loadCalendarEvents;

export const saveCalendarEventsToStorage = (events: CalendarEvent[]): void => {
  try {
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save calendar events to localStorage:', e);
  }
};

// Date formatting utility
export const formatEventDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
};

export const formatFullDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatEventTime = (timeStr?: string): string => {
  if (!timeStr) return 'All Day';
  if (timeStr.includes('AM') || timeStr.includes('PM') || timeStr.includes('am') || timeStr.includes('pm')) {
    return timeStr;
  }
  const [hours, minutes] = timeStr.split(':');
  if (hours === undefined) return timeStr;
  const h = parseInt(hours, 10);
  const m = minutes || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${m} ${ampm}`;
};

export const isDateToday = (dateStr: string): boolean => {
  const todayStr = getTodayDateString();
  return dateStr === todayStr;
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Export to .ics format for Google Calendar, Apple Calendar, Outlook
export const exportEventsToICS = (events: CalendarEvent[]): void => {
  const formatICSDate = (dateStr: string, timeStr?: string): string => {
    const cleanDate = dateStr.replace(/-/g, '');
    if (!timeStr) {
      return `${cleanDate}T000000Z`;
    }
    const cleanTime = timeStr.replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4);
    return `${cleanDate}T${cleanTime}00Z`;
  };

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ryda AI//RYLI Student Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:RYLI Student Schedule & Tasks',
  ];

  events.forEach((ev) => {
    icsLines.push('BEGIN:VEVENT');
    icsLines.push(`UID:ryli-${ev.id}@ryli.ai`);
    icsLines.push(`DTSTAMP:${formatICSDate(getTodayDateString())}`);
    icsLines.push(`DTSTART:${formatICSDate(ev.date, ev.time)}`);
    if (ev.endDate || ev.endTime) {
      icsLines.push(`DTEND:${formatICSDate(ev.endDate || ev.date, ev.endTime || ev.time)}`);
    }
    icsLines.push(`SUMMARY:${ev.title.replace(/[,;]/g, ' ')}`);
    if (ev.description) {
      icsLines.push(`DESCRIPTION:${ev.description.replace(/\n/g, '\\n')}`);
    }
    if (ev.location) {
      icsLines.push(`LOCATION:${ev.location.replace(/[,;]/g, ' ')}`);
    }
    icsLines.push(`CATEGORIES:${ev.category.toUpperCase()}`);
    icsLines.push('STATUS:CONFIRMED');
    icsLines.push('END:VEVENT');
  });

  icsLines.push('END:VCALENDAR');

  const icsContent = icsLines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `ryli-school-schedule-${getTodayDateString()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
