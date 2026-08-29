import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Bell, Coffee, BookOpen } from 'lucide-react';

interface FocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const modeDurations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Play gentle beep
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } catch (e) {
        console.log('Audio not allowed without gesture', e);
      }

      setIsRunning(false);
      if (mode === 'focus') {
        setSessionsCompleted((prev) => prev + 1);
        setMode('shortBreak');
        setTimeLeft(modeDurations.shortBreak);
      } else {
        setMode('focus');
        setTimeLeft(modeDurations.focus);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const switchMode = (newMode: 'focus' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(modeDurations[newMode]);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(modeDurations[mode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div 
        id="focus-timer-modal"
        className="w-full max-w-sm rounded-3xl border border-white/20 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-lg font-display">Study Focus Timer</h3>
          </div>
          <button
            id="btn-close-timer"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-800/80 rounded-2xl my-5 text-xs font-medium">
          <button
            id="btn-timer-mode-focus"
            onClick={() => switchMode('focus')}
            className={`py-2 rounded-xl transition-all ${
              mode === 'focus'
                ? 'bg-blue-600 text-white font-semibold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Focus (25m)
          </button>
          <button
            id="btn-timer-mode-short"
            onClick={() => switchMode('shortBreak')}
            className={`py-2 rounded-xl transition-all ${
              mode === 'shortBreak'
                ? 'bg-emerald-600 text-white font-semibold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Short Break (5m)
          </button>
          <button
            id="btn-timer-mode-long"
            onClick={() => switchMode('longBreak')}
            className={`py-2 rounded-xl transition-all ${
              mode === 'longBreak'
                ? 'bg-purple-600 text-white font-semibold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Big Digit Display */}
        <div className="py-6 text-center">
          <div className="text-6xl sm:text-7xl font-mono font-extrabold tracking-tight text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)]">
            {formattedTime}
          </div>
          <p className="mt-2 text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            {mode === 'focus' ? '🎯 High-Yield Study Period' : '☕ Rest your eyes & stretch'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <button
            id="btn-timer-reset"
            onClick={resetTimer}
            className="p-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            id="btn-timer-toggle"
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3.5 rounded-2xl font-bold text-base flex items-center gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> Start Study
              </>
            )}
          </button>
        </div>

        {/* Stats footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span>Completed today:</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            🔥 {sessionsCompleted} Pomodoro {sessionsCompleted === 1 ? 'block' : 'blocks'}
          </span>
        </div>
      </div>
    </div>
  );
};
