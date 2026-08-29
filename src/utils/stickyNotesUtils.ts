import { StickyNoteItem, StickyColor } from '../types';

const STORAGE_KEY = 'ryli_sticky_notes_v1';

export const STICKY_COLORS: { id: StickyColor; name: string; bg: string; border: string; header: string; text: string; pin: string }[] = [
  {
    id: 'yellow',
    name: 'Classic Yellow',
    bg: 'bg-amber-100 dark:bg-amber-200/90 text-amber-950',
    border: 'border-amber-300 dark:border-amber-400/60',
    header: 'bg-amber-200/80 text-amber-900 border-b border-amber-300',
    text: 'text-amber-950',
    pin: 'text-amber-700',
  },
  {
    id: 'green',
    name: 'Mint Green',
    bg: 'bg-emerald-100 dark:bg-emerald-200/90 text-emerald-950',
    border: 'border-emerald-300 dark:border-emerald-400/60',
    header: 'bg-emerald-200/80 text-emerald-900 border-b border-emerald-300',
    text: 'text-emerald-950',
    pin: 'text-emerald-700',
  },
  {
    id: 'pink',
    name: 'Rose Pink',
    bg: 'bg-pink-100 dark:bg-pink-200/90 text-pink-950',
    border: 'border-pink-300 dark:border-pink-400/60',
    header: 'bg-pink-200/80 text-pink-900 border-b border-pink-300',
    text: 'text-pink-950',
    pin: 'text-pink-700',
  },
  {
    id: 'blue',
    name: 'Sky Blue',
    bg: 'bg-sky-100 dark:bg-sky-200/90 text-sky-950',
    border: 'border-sky-300 dark:border-sky-400/60',
    header: 'bg-sky-200/80 text-sky-900 border-b border-sky-300',
    text: 'text-sky-950',
    pin: 'text-sky-700',
  },
  {
    id: 'purple',
    name: 'Lavender',
    bg: 'bg-purple-100 dark:bg-purple-200/90 text-purple-950',
    border: 'border-purple-300 dark:border-purple-400/60',
    header: 'bg-purple-200/80 text-purple-900 border-b border-purple-300',
    text: 'text-purple-950',
    pin: 'text-purple-700',
  },
  {
    id: 'amber',
    name: 'Warm Orange',
    bg: 'bg-orange-100 dark:bg-orange-200/90 text-orange-950',
    border: 'border-orange-300 dark:border-orange-400/60',
    header: 'bg-orange-200/80 text-orange-900 border-b border-orange-300',
    text: 'text-orange-950',
    pin: 'text-orange-700',
  },
];

export function loadStickyNotesFromStorage(): StickyNoteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to load sticky notes from storage', e);
    return [];
  }
}

export function saveStickyNotesToStorage(notes: StickyNoteItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save sticky notes to storage', e);
  }
}
