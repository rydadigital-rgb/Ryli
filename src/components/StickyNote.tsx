import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Minus, 
  Square, 
  Pin, 
  Trash2, 
  Palette, 
  GripHorizontal,
  Maximize2,
  Check
} from 'lucide-react';
import { StickyNoteItem, StickyColor } from '../types';
import { STICKY_COLORS } from '../utils/stickyNotesUtils';

interface StickyNoteProps {
  note: StickyNoteItem;
  onUpdate: (updated: StickyNoteItem) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
  zIndex: number;
}

export const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onUpdate,
  onDelete,
  onBringToFront,
  zIndex,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  const colorConfig = STICKY_COLORS.find((c) => c.id === note.color) || STICKY_COLORS[0];

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag when clicking the header, not controls inside header
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
    
    setIsDragging(true);
    onBringToFront(note.id);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: note.x,
      origY: note.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    
    // Constrain within viewport bounds
    const newX = Math.max(10, Math.min(window.innerWidth - (note.isMinimized ? 200 : note.width) - 10, dragRef.current.origX + deltaX));
    const newY = Math.max(70, Math.min(window.innerHeight - 80, dragRef.current.origY + deltaY));

    onUpdate({
      ...note,
      x: newX,
      y: newY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe ignore
      }
    }
  };

  return (
    <div
      ref={noteRef}
      id={`sticky-note-${note.id}`}
      onMouseDown={() => onBringToFront(note.id)}
      style={{
        transform: `translate3d(${note.x}px, ${note.y}px, 0)`,
        width: note.isMinimized ? 220 : `${note.width}px`,
        zIndex: note.isPinned ? zIndex + 1000 : zIndex,
      }}
      className={`fixed top-0 left-0 rounded-2xl shadow-2xl transition-shadow duration-200 select-none border ${colorConfig.border} ${colorConfig.bg} ${
        isDragging ? 'shadow-amber-500/20 scale-[1.02] cursor-grabbing opacity-95' : 'cursor-default'
      } flex flex-col overflow-hidden backdrop-blur-md`}
    >
      {/* Draggable Header */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing ${colorConfig.header} select-none touch-none`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          <GripHorizontal className="w-3.5 h-3.5 opacity-60 shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider truncate">
            {note.isMinimized ? (note.content.trim() || 'Sticky Note') : 'Sticky Note'}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Color palette */}
          <div className="relative">
            <button
              id={`btn-sticky-color-${note.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className="p-1 rounded-md hover:bg-black/10 transition-colors"
              title="Change note color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {showColorPicker && (
              <div
                className="absolute right-0 top-full mt-1 p-1.5 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-white/20 shadow-xl flex items-center gap-1 z-50 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onUpdate({ ...note, color: c.id });
                      setShowColorPicker(false);
                    }}
                    className={`w-5 h-5 rounded-full border border-white/30 transition-transform hover:scale-110 ${
                      c.id === 'yellow' ? 'bg-amber-300' :
                      c.id === 'green' ? 'bg-emerald-300' :
                      c.id === 'pink' ? 'bg-pink-300' :
                      c.id === 'blue' ? 'bg-sky-300' :
                      c.id === 'purple' ? 'bg-purple-300' : 'bg-orange-400'
                    }`}
                    title={c.name}
                  >
                    {note.color === c.id && <Check className="w-3 h-3 text-black mx-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pin toggle */}
          <button
            id={`btn-sticky-pin-${note.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ ...note, isPinned: !note.isPinned });
            }}
            className={`p-1 rounded-md hover:bg-black/10 transition-colors ${note.isPinned ? 'text-amber-800 font-bold bg-amber-400/30' : 'opacity-70'}`}
            title={note.isPinned ? 'Unpin note' : 'Pin note on top'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          {/* Minimize toggle */}
          <button
            id={`btn-sticky-minimize-${note.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ ...note, isMinimized: !note.isMinimized });
            }}
            className="p-1 rounded-md hover:bg-black/10 transition-colors opacity-70 hover:opacity-100"
            title={note.isMinimized ? 'Expand note' : 'Minimize note'}
          >
            {note.isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>

          {/* Delete note */}
          <button
            id={`btn-sticky-delete-${note.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="p-1 rounded-md hover:bg-red-500/20 text-red-700 dark:text-red-800 transition-colors opacity-80 hover:opacity-100"
            title="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Note Body (Text Area) */}
      {!note.isMinimized && (
        <div className="p-3 flex-1 flex flex-col">
          <textarea
            id={`textarea-sticky-${note.id}`}
            value={note.content}
            onChange={(e) => {
              onUpdate({
                ...note,
                content: e.target.value,
                updatedAt: Date.now(),
              });
            }}
            placeholder="Type your study note, key formula, or reminder here..."
            className={`w-full h-36 resize-none bg-transparent outline-none text-xs sm:text-sm font-medium leading-relaxed ${colorConfig.text} placeholder:text-black/40`}
            autoFocus={note.content === ''}
          />
          <div className="pt-2 flex items-center justify-between border-t border-black/10 text-[10px] opacity-60">
            <span>
              {new Date(note.updatedAt || note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>{note.content.length} chars</span>
          </div>
        </div>
      )}
    </div>
  );
};
