import React from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, Circle, ArrowUpRight, Sparkles, AlertCircle } from 'lucide-react';
import { CalendarEvent } from '../types';
import { getCategoryMeta, formatEventDate, formatEventTime } from '../utils/calendarUtils';

interface CalendarEventCardProps {
  event: CalendarEvent;
  onOpenCalendar: (focusDate?: string) => void;
  onToggleComplete?: (id: string) => void;
  onDeleteEvent?: (id: string) => void;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event,
  onOpenCalendar,
  onToggleComplete,
  onDeleteEvent,
}) => {
  const meta = getCategoryMeta(event.category);

  return (
    <div
      id={`calendar-event-card-${event.id}`}
      className={`mt-4 w-full rounded-2xl border ${meta.borderClass} ${meta.bgLightClass} p-4 backdrop-blur-xl shadow-lg transition-all duration-200 text-white`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Complete Toggle or Category Icon */}
          {onToggleComplete ? (
            <button
              id={`btn-toggle-complete-event-${event.id}`}
              onClick={() => onToggleComplete(event.id)}
              className="mt-0.5 p-1 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title={event.isCompleted ? 'Mark pending' : 'Mark completed'}
            >
              {event.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Circle className="w-5 h-5 text-zinc-400 hover:text-blue-400" />
              )}
            </button>
          ) : (
            <div className="mt-0.5 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-base shrink-0">
              {meta.icon}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Header badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeClass} flex items-center gap-1`}>
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </span>

              {event.priority === 'high' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  High Priority
                </span>
              )}

              {event.subject && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-zinc-300">
                  {event.subject}
                </span>
              )}

              {event.source === 'ai_assistant' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI Scheduled
                </span>
              )}
            </div>

            {/* Title */}
            <h4 className={`text-base font-bold text-white font-display leading-snug ${
              event.isCompleted ? 'line-through text-zinc-400' : ''
            }`}>
              {event.title}
            </h4>

            {/* Description */}
            {event.description && (
              <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                {event.description}
              </p>
            )}

            {/* Date, Time & Location pills */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-300">
              <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/10">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold">{formatEventDate(event.date)}</span>
                {event.endDate && event.endDate !== event.date && (
                  <span> – {formatEventDate(event.endDate)}</span>
                )}
              </div>

              {event.time && (
                <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formatEventTime(event.time)}</span>
                  {event.endTime && <span> – {formatEventTime(event.endTime)}</span>}
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate max-w-[200px]">{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <button
            id={`btn-open-in-calendar-${event.id}`}
            onClick={() => onOpenCalendar(event.date)}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white flex items-center gap-1 shadow-sm transition-all cursor-pointer hover:scale-105"
          >
            <span>View in Calendar</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
