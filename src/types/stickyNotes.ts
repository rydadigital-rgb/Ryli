export type StickyColor = 'yellow' | 'green' | 'pink' | 'blue' | 'purple' | 'amber';

export interface StickyNoteItem {
  id: string;
  content: string;
  color: StickyColor;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized?: boolean;
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}
