import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, HelpCircle, Trophy, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion } from '../types';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  questions: QuizQuestion[];
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  topic,
  questions,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowExplanation(false);
      setShowHint(false);
      setIsFinished(false);
    }
  }, [isOpen, questions]);

  if (!isOpen || !questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const selected = selectedAnswers[currentIndex];
  const hasAnswered = selected !== undefined;
  const isCorrect = selected === currentQ?.correctIndex;

  const handleSelectOption = (index: number) => {
    if (hasAnswered) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: index }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    setShowHint(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setShowHint(false);
    setIsFinished(false);
  };

  // Calculate score
  const correctCount = Object.entries(selectedAnswers).filter(
    ([qIdx, ansIdx]) => questions[Number(qIdx)]?.correctIndex === ansIdx
  ).length;
  const scorePercent = Math.round((correctCount / questions.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div
        id="interactive-quiz-modal"
        className="w-full max-w-xl rounded-3xl border border-white/20 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white max-h-[90vh] flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                School Practice Quiz
              </span>
              <span className="text-xs text-zinc-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <h3 className="font-bold text-lg font-display text-white mt-1 line-clamp-1">
              {topic}
            </h3>
          </div>
          <button
            id="btn-close-quiz"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 h-1.5 rounded-full my-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + (hasAnswered ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>

        {!isFinished ? (
          <div className="space-y-5 flex-1 py-2">
            {/* Question Text */}
            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-white/10">
              <p className="text-base sm:text-lg font-medium text-zinc-100 leading-relaxed">
                {currentQ.question}
              </p>
            </div>

            {/* Hint Toggle */}
            {currentQ.hint && !hasAnswered && (
              <div>
                <button
                  id="btn-toggle-quiz-hint"
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-medium transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  {showHint ? 'Hide Hint' : 'Need a hint?'}
                </button>
                {showHint && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                    💡 <span className="font-semibold">Hint:</span> {currentQ.hint}
                  </div>
                )}
              </div>
            )}

            {/* Options list */}
            <div className="space-y-2.5">
              {currentQ.options.map((option, idx) => {
                const isThisSelected = selected === idx;
                const isThisCorrect = idx === currentQ.correctIndex;

                let btnStyles = 'bg-zinc-800/70 border-white/10 hover:bg-zinc-700/80 text-zinc-200';
                if (hasAnswered) {
                  if (isThisCorrect) {
                    btnStyles = 'bg-emerald-950/80 border-emerald-500/80 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
                  } else if (isThisSelected) {
                    btnStyles = 'bg-red-950/80 border-red-500/80 text-red-100';
                  } else {
                    btnStyles = 'bg-zinc-800/40 border-white/5 text-zinc-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    id={`btn-quiz-opt-${currentIndex}-${idx}`}
                    onClick={() => handleSelectOption(idx)}
                    disabled={hasAnswered}
                    className={`w-full p-4 rounded-2xl border text-left text-sm sm:text-base font-medium flex items-center justify-between transition-all cursor-pointer ${btnStyles}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white/10 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </span>
                    {hasAnswered && isThisCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {hasAnswered && isThisSelected && !isThisCorrect && (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation box */}
            {hasAnswered && (
              <div className={`p-4 rounded-2xl border animate-fadeIn ${
                isCorrect 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' 
                  : 'bg-zinc-800/80 border-white/10 text-zinc-300'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {isCorrect ? (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Great Job! That's Correct!</span>
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400">Explanation & Concept:</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            {/* Next Button */}
            {hasAnswered && (
              <div className="flex justify-end pt-2">
                <button
                  id="btn-quiz-next"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Results view */
          <div className="py-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center text-blue-400">
              <Trophy className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-2xl font-black font-display text-white">Quiz Completed!</h4>
              <p className="text-sm text-zinc-400 mt-1">Here is how you scored on {topic}</p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-800/60 border border-white/10 max-w-xs mx-auto">
              <div className="text-5xl font-black font-mono text-emerald-400">{scorePercent}%</div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mt-2">
                {correctCount} of {questions.length} questions correct
              </p>
            </div>

            <p className="text-sm text-zinc-300 max-w-md mx-auto">
              {scorePercent >= 80
                ? '🌟 Outstanding comprehension! You have mastered this concept!'
                : scorePercent >= 50
                ? '👍 Good progress! Review the explanations or ask RYLI for a Socratic breakdown.'
                : '💡 Keep practicing! Ask RYLI to explain the core concepts step-by-step.'}
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                id="btn-quiz-retry"
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Retake Quiz
              </button>
              <button
                id="btn-quiz-done"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
