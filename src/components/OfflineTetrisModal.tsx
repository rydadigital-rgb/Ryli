import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  WifiOff, 
  Play, 
  RotateCcw, 
  Pause, 
  Volume2, 
  VolumeX, 
  X, 
  RotateCw, 
  RotateCcw as RotateCcwIcon,
  ChevronDown,
  ChevronsDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Trophy,
  RefreshCw
} from 'lucide-react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const HIGH_SCORE_KEY = 'ryli_tetris_high_score_v2';

// RYLI Brand & Minimalist Color Palette for Tetrominoes
// RYLI Signature Colors: Royal Blue (#0037FF), Vibrant Yellow (#FFC820), Coral Red (#FF2E4D), Indigo (#4F46E5), Emerald (#10B981), Orange (#F97316), Cyan (#06B6D4)
export const RYLI_TETRIS_THEMES = {
  ryli_vibrant: {
    name: 'RYLI Classic',
    I: { color: '#0037FF', border: '#0028c7', light: '#93c5fd' }, // RYLI Blue
    O: { color: '#FFC820', border: '#e6b010', light: '#fef08a' }, // RYLI Yellow
    T: { color: '#8B5CF6', border: '#7c3aed', light: '#ddd6fe' }, // Purple
    S: { color: '#10B981', border: '#059669', light: '#a7f3d0' }, // Mint Green
    Z: { color: '#FF2E4D', border: '#e11d48', light: '#fecdd3' }, // RYLI Red
    J: { color: '#3B82F6', border: '#2563eb', light: '#bfdbfe' }, // Light Blue
    L: { color: '#F97316', border: '#ea580c', light: '#fed7aa' }, // Amber Orange
  },
  minimalist_gray: {
    name: 'Just Stack (Monochrome)',
    I: { color: '#a1a1aa', border: '#71717a', light: '#e4e4e7' },
    O: { color: '#a1a1aa', border: '#71717a', light: '#e4e4e7' },
    T: { color: '#a1a1aa', border: '#71717a', light: '#e4e4e7' },
    S: { color: '#a1a1aa', border: '#71717a', light: '#e4e4e7' },
    Z: { color: '#a1a1aa', border: '#71717a', light: '#e4e4e7' },
    J: { color: '#a1a1aa', border: '#71717a', light: '#e4e4e7' },
    L: { color: '#a1a1aa', border: '#71717a', light: '#e4e4e7' },
  }
};

const TETROMINO_SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

type TetrominoKey = keyof typeof TETROMINO_SHAPES;
const TETROMINO_KEYS: TetrominoKey[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

interface Piece {
  key: TetrominoKey;
  shape: number[][];
  color: string;
  borderColor: string;
  x: number;
  y: number;
}

interface OfflineTetrisModalProps {
  isOpen: boolean;
  onClose: () => void;
  isActuallyOffline?: boolean;
  onRetryConnection?: () => void;
}

export const OfflineTetrisModal: React.FC<OfflineTetrisModalProps> = ({
  isOpen,
  onClose,
  isActuallyOffline = false,
  onRetryConnection,
}) => {
  const [themeMode, setThemeMode] = useState<'ryli_vibrant' | 'minimalist_gray'>('ryli_vibrant');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [grid, setGrid] = useState<string[][]>(() => 
    Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(''))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPieces, setNextPieces] = useState<TetrominoKey[]>(['T', 'I', 'O', 'L']);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const requestRef = useRef<number | null>(null);
  const lastDropTimeRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio Synthesizer for offline sound effects
  const playTone = useCallback((freq: number, type: OscillatorType = 'sine', duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted
    }
  }, [soundEnabled]);

  // Sound cues
  const playMoveSound = useCallback(() => playTone(320, 'sine', 0.04), [playTone]);
  const playRotateSound = useCallback(() => playTone(440, 'triangle', 0.05), [playTone]);
  const playDropSound = useCallback(() => playTone(180, 'sine', 0.08), [playTone]);
  const playClearSound = useCallback(() => {
    playTone(520, 'sine', 0.08);
    setTimeout(() => playTone(660, 'sine', 0.1), 80);
    setTimeout(() => playTone(880, 'triangle', 0.15), 160);
  }, [playTone]);
  const playGameOverSound = useCallback(() => {
    playTone(280, 'sawtooth', 0.15);
    setTimeout(() => playTone(200, 'sawtooth', 0.25), 150);
  }, [playTone]);

  // Create Random Piece with current theme palette
  const createRandomPiece = useCallback((key?: TetrominoKey): Piece => {
    const chosenKey = key || TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
    const shape = TETROMINO_SHAPES[chosenKey];
    const themeDef = RYLI_TETRIS_THEMES[themeMode][chosenKey];
    return {
      key: chosenKey,
      shape,
      color: themeDef.color,
      borderColor: themeDef.border,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };
  }, [themeMode]);

  // Collision detection
  const checkCollision = useCallback((piece: Piece, boardGrid: string[][], offsetX = 0, offsetY = 0): boolean => {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] !== 0) {
          const newX = piece.x + c + offsetX;
          const newY = piece.y + r + offsetY;

          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }
          if (newY >= 0 && boardGrid[newY][newX] !== '') {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // Matrix rotation
  const rotateMatrix = (matrix: number[][]): number[][] => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        result[c][rows - 1 - r] = matrix[r][c];
      }
    }
    return result;
  };

  // Reset Game
  const resetGame = useCallback(() => {
    const emptyGrid = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(''));
    setGrid(emptyGrid);
    
    // Generate initial queue
    const queue: TetrominoKey[] = Array.from({ length: 5 }, () => 
      TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)]
    );
    const firstKey = queue.shift() || 'T';
    
    setCurrentPiece(createRandomPiece(firstKey));
    setNextPieces(queue);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    lastDropTimeRef.current = performance.now();
  }, [createRandomPiece]);

  // Lock piece & clear rows
  const lockPiece = useCallback((piece: Piece, currentGrid: string[][]) => {
    const newGrid = currentGrid.map((row) => [...row]);
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] !== 0) {
          const boardY = piece.y + r;
          const boardX = piece.x + c;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newGrid[boardY][boardX] = piece.color;
          }
        }
      }
    }

    playDropSound();

    // Line clearing
    let clearedRows = 0;
    const remainingRows = newGrid.filter((row) => {
      const isFull = row.every((cell) => cell !== '');
      if (isFull) clearedRows++;
      return !isFull;
    });

    while (remainingRows.length < BOARD_HEIGHT) {
      remainingRows.unshift(Array(BOARD_WIDTH).fill(''));
    }

    if (clearedRows > 0) {
      playClearSound();
      const linePoints = [0, 100, 300, 500, 800];
      const addedScore = (linePoints[clearedRows] || 100) * level;
      setScore((prev) => {
        const nextScore = prev + addedScore;
        if (nextScore > highScore) {
          setHighScore(nextScore);
          try {
            localStorage.setItem(HIGH_SCORE_KEY, nextScore.toString());
          } catch {}
        }
        return nextScore;
      });
      setLines((prev) => {
        const nextLines = prev + clearedRows;
        setLevel(Math.floor(nextLines / 10) + 1);
        return nextLines;
      });
    }

    // Pull from queue
    const nextQueue = [...nextPieces];
    const spawnKey = nextQueue.shift() || 'T';
    nextQueue.push(TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)]);
    setNextPieces(nextQueue);

    const nextPiece = createRandomPiece(spawnKey);

    if (checkCollision(nextPiece, remainingRows, 0, 0)) {
      setGameOver(true);
      setCurrentPiece(null);
      setGrid(remainingRows);
      playGameOverSound();
    } else {
      setCurrentPiece(nextPiece);
      setGrid(remainingRows);
    }
  }, [checkCollision, createRandomPiece, highScore, level, nextPieces, playClearSound, playDropSound, playGameOverSound]);

  // Movement Actions
  const moveLeft = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    if (!checkCollision(currentPiece, grid, -1, 0)) {
      setCurrentPiece((prev) => prev ? { ...prev, x: prev.x - 1 } : null);
      playMoveSound();
    }
  }, [checkCollision, currentPiece, gameOver, grid, isPaused, playMoveSound]);

  const moveRight = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    if (!checkCollision(currentPiece, grid, 1, 0)) {
      setCurrentPiece((prev) => prev ? { ...prev, x: prev.x + 1 } : null);
      playMoveSound();
    }
  }, [checkCollision, currentPiece, gameOver, grid, isPaused, playMoveSound]);

  const moveDown = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    if (!checkCollision(currentPiece, grid, 0, 1)) {
      setCurrentPiece((prev) => prev ? { ...prev, y: prev.y + 1 } : null);
    } else {
      lockPiece(currentPiece, grid);
    }
  }, [checkCollision, currentPiece, gameOver, grid, isPaused, lockPiece]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    let dropY = 0;
    while (!checkCollision(currentPiece, grid, 0, dropY + 1)) {
      dropY++;
    }
    const droppedPiece = { ...currentPiece, y: currentPiece.y + dropY };
    setScore((prev) => prev + dropY * 2);
    lockPiece(droppedPiece, grid);
  }, [checkCollision, currentPiece, gameOver, grid, isPaused, lockPiece]);

  const rotatePiece = useCallback((clockwise = true) => {
    if (!currentPiece || gameOver || isPaused) return;
    let rotated = rotateMatrix(currentPiece.shape);
    if (!clockwise) {
      // 3 rotations = counter-clockwise
      rotated = rotateMatrix(rotateMatrix(rotated));
    }
    const testPiece = { ...currentPiece, shape: rotated };
    
    // Wall kick attempts
    if (!checkCollision(testPiece, grid, 0, 0)) {
      setCurrentPiece(testPiece);
      playRotateSound();
    } else if (!checkCollision(testPiece, grid, -1, 0)) {
      setCurrentPiece({ ...testPiece, x: testPiece.x - 1 });
      playRotateSound();
    } else if (!checkCollision(testPiece, grid, 1, 0)) {
      setCurrentPiece({ ...testPiece, x: testPiece.x + 1 });
      playRotateSound();
    }
  }, [checkCollision, currentPiece, gameOver, grid, isPaused, playRotateSound]);

  // Main Game Loop
  useEffect(() => {
    if (!isOpen || gameOver || isPaused) return;

    const dropInterval = Math.max(90, 800 - (level - 1) * 65);

    const gameLoop = (time: number) => {
      if (time - lastDropTimeRef.current > dropInterval) {
        moveDown();
        lastDropTimeRef.current = time;
      }
      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isOpen, gameOver, isPaused, level, moveDown]);

  // Keyboard Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'p', 'P', 'r', 'R'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          moveRight();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          moveDown();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          rotatePiece(true);
          break;
        case 'q':
        case 'Q':
          rotatePiece(false);
          break;
        case ' ':
          hardDrop();
          break;
        case 'p':
        case 'P':
          setIsPaused((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, moveLeft, moveRight, moveDown, rotatePiece, hardDrop]);

  // Init on Open
  useEffect(() => {
    if (isOpen) {
      resetGame();
    }
  }, [isOpen, resetGame]);

  if (!isOpen) return null;

  // Calculate Ghost Piece (where the piece will land)
  let ghostY = 0;
  if (currentPiece && !gameOver) {
    while (!checkCollision(currentPiece, grid, 0, ghostY + 1)) {
      ghostY++;
    }
  }

  // Combined Grid Render
  const displayGrid = grid.map((row) => [...row]);

  // 1. Render ghost piece
  if (currentPiece && !gameOver && ghostY > 0) {
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c] !== 0) {
          const boardY = currentPiece.y + ghostY + r;
          const boardX = currentPiece.x + c;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            displayGrid[boardY][boardX] = 'GHOST';
          }
        }
      }
    }
  }

  // 2. Render active piece
  if (currentPiece && !gameOver) {
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c] !== 0) {
          const boardY = currentPiece.y + r;
          const boardX = currentPiece.x + c;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            displayGrid[boardY][boardX] = currentPiece.color;
          }
        }
      }
    }
  }

  return (
    <div
      id="modal-minimal-tetris"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Minimalist Phone/App Container matching the requested design */}
      <div
        className="w-full max-w-[360px] sm:max-w-[380px] bg-white text-zinc-800 rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimalist Top App Bar (Just Stack style) */}
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-zinc-900 font-sans">
              Just Stack
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
              RYLI
            </span>
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            {/* Color mode switcher */}
            <button
              onClick={() => setThemeMode(themeMode === 'ryli_vibrant' ? 'minimalist_gray' : 'ryli_vibrant')}
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded hover:bg-zinc-100 text-zinc-500 transition-colors"
              title="Toggle RYLI colors or Monochrome"
            >
              {themeMode === 'ryli_vibrant' ? '🎨 RYLI' : '⚪ Mono'}
            </button>

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 rounded hover:bg-zinc-100 text-zinc-500 transition-colors"
              title={soundEnabled ? 'Mute sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-300" />}
            </button>

            {/* Pause */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 rounded hover:bg-zinc-100 text-zinc-500 transition-colors"
              title="Pause"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-zinc-100 text-zinc-500 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game Stage Area with minimal side metrics and queue */}
        <div className="p-3 bg-white flex justify-center items-start relative">
          
          {/* Main Tetris Grid Container */}
          <div className="relative">
            
            {/* Minimalist Floating Stats inside grid top-left */}
            <div className="absolute top-2 left-2 z-20 pointer-events-none text-zinc-400 font-mono text-[11px] font-medium leading-tight">
              <div>L {level}</div>
              <div className="text-zinc-600 font-bold text-xs">{score}</div>
            </div>

            {/* Minimal Grid Board */}
            <div
              className="grid gap-[1px] bg-zinc-100 border border-zinc-200/90 rounded-sm p-[1px] shadow-xs"
              style={{
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, 18px)`,
                gridTemplateRows: `repeat(${BOARD_HEIGHT}, 18px)`,
              }}
            >
              {displayGrid.map((row, rIdx) =>
                row.map((cellValue, cIdx) => {
                  const isGhost = cellValue === 'GHOST';
                  const isFilled = cellValue !== '' && !isGhost;

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      style={{
                        backgroundColor: isFilled ? cellValue : isGhost ? 'rgba(0, 55, 255, 0.08)' : '#fafafa',
                      }}
                      className={`w-[18px] h-[18px] transition-all duration-75 ${
                        isGhost 
                          ? 'border border-dashed border-zinc-300' 
                          : isFilled 
                            ? 'rounded-[2px] shadow-2xs' 
                            : 'border-[0.5px] border-zinc-200/40'
                      }`}
                    />
                  );
                })
              )}
            </div>

            {/* Left Edge Controls: Rotate CCW & Move Left */}
            <button
              onClick={() => rotatePiece(false)}
              className="absolute -left-6 top-[55%] -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 active:scale-90 transition-all"
              title="Rotate Left"
            >
              <RotateCcwIcon className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={moveLeft}
              className="absolute -left-6 bottom-4 p-1 text-zinc-400 hover:text-zinc-700 active:scale-90 transition-all"
              title="Move Left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            {/* Right Edge Controls: Rotate CW & Move Right */}
            <button
              onClick={() => rotatePiece(true)}
              className="absolute -right-6 top-[55%] -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 active:scale-90 transition-all"
              title="Rotate Right"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={moveRight}
              className="absolute -right-6 bottom-4 p-1 text-zinc-400 hover:text-zinc-700 active:scale-90 transition-all"
              title="Move Right"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Pause Screen Overlay */}
            {isPaused && !gameOver && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30">
                <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase">Paused</span>
                <button
                  onClick={() => setIsPaused(false)}
                  className="px-3 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" /> Resume
                </button>
              </div>
            )}

            {/* Game Over Screen Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-30">
                <span className="text-sm font-black text-zinc-900 uppercase tracking-wider font-sans">
                  Game Over
                </span>
                <div className="text-xs text-zinc-500 mt-1">
                  Score <span className="font-bold text-blue-600">{score}</span>
                </div>
                {score >= highScore && score > 0 && (
                  <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1">
                    🏆 High Score!
                  </div>
                )}
                <button
                  onClick={resetGame}
                  className="mt-3 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Play Again
                </button>
              </div>
            )}
          </div>

          {/* Right-Side Minimalist Upcoming Pieces Queue (Matching reference image) */}
          <div className="ml-5 flex flex-col items-center gap-4 py-2 text-zinc-300">
            {nextPieces.slice(0, 4).map((key, idx) => {
              const shape = TETROMINO_SHAPES[key];
              const themeDef = RYLI_TETRIS_THEMES[themeMode][key];
              const isFirst = idx === 0;

              return (
                <div
                  key={`next-queue-${idx}`}
                  className={`flex flex-col items-center justify-center transition-opacity ${
                    isFirst ? 'opacity-80' : idx === 1 ? 'opacity-50' : 'opacity-25'
                  }`}
                >
                  <div
                    className="grid gap-[1px]"
                    style={{
                      gridTemplateColumns: `repeat(${shape[0].length}, 8px)`,
                    }}
                  >
                    {shape.map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`q-${idx}-${r}-${c}`}
                          style={{
                            backgroundColor: val ? themeDef.color : 'transparent',
                          }}
                          className={`w-2 h-2 rounded-[1px] ${val ? '' : 'invisible'}`}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Minimalist Drop Controls (Matching reference image) */}
        <div className="pb-3 pt-1 px-6 flex items-center justify-center gap-10 text-zinc-400 bg-white">
          <button
            onClick={moveDown}
            className="p-2 hover:text-zinc-800 active:scale-90 transition-transform cursor-pointer"
            title="Soft Drop"
          >
            <ChevronDown className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={hardDrop}
            className="p-2 hover:text-blue-600 active:scale-90 transition-transform cursor-pointer"
            title="Hard Drop (Space)"
          >
            <ChevronsDown className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Offline Status or High Score Ribbon at Footer */}
        <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            {isActuallyOffline ? (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <WifiOff className="w-3 h-3" /> Offline Play
              </span>
            ) : (
              <span className="flex items-center gap-1 text-zinc-400 font-medium">
                <Trophy className="w-3 h-3 text-amber-500" /> Best: {highScore}
              </span>
            )}
          </div>

          <span className="text-[10px] text-zinc-400 font-sans">
            Keys: ← → ↑ ↓ Space
          </span>
        </div>
      </div>
    </div>
  );
};
