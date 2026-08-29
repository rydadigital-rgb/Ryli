import React, { useState, useEffect } from 'react';
import { X, Shuffle, Check, HelpCircle, ArrowLeft, ArrowRight, Download, Rotate3D } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  cards: Flashcard[];
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  isOpen,
  onClose,
  topic,
  cards: initialCards,
}) => {
  const [cards, setCards] = useState<Flashcard[]>(initialCards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialCards && initialCards.length > 0) {
      setCards(initialCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [initialCards, isOpen]);

  if (!isOpen || !cards || cards.length === 0) return null;

  const currentCard = cards[currentIndex];
  const isMastered = masteredIds.has(currentCard.id);

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const toggleMastery = () => {
    const nextSet = new Set(masteredIds);
    if (nextSet.has(currentCard.id)) {
      nextSet.delete(currentCard.id);
    } else {
      nextSet.add(currentCard.id);
    }
    setMasteredIds(nextSet);
  };

  const exportCardsAsText = () => {
    const textData = cards.map((c, i) => `${i + 1}. [Front]: ${c.front}\n   [Back]: ${c.back}\n`).join('\n');
    const blob = new Blob([`Topic: ${topic}\n\n${textData}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flashcards.txt`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div
        id="flashcard-deck-modal"
        className="w-full max-w-xl rounded-3xl border border-white/20 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-2xl text-white max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                Flashcard Deck
              </span>
              <span className="text-xs text-zinc-400">
                Card {currentIndex + 1} of {cards.length}
              </span>
            </div>
            <h3 className="font-bold text-lg font-display text-white mt-0.5 line-clamp-1">
              {topic}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-export-flashcards"
              onClick={exportCardsAsText}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Export Flashcards"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              id="btn-close-flashcards"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress & Mastery counters */}
        <div className="flex items-center justify-between my-3 text-xs text-zinc-400">
          <span>
            Mastered:{' '}
            <strong className="text-emerald-400">
              {masteredIds.size} / {cards.length}
            </strong>
          </span>
          <button
            id="btn-shuffle-cards"
            onClick={handleShuffle}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" /> Shuffle Deck
          </button>
        </div>

        {/* 3D Flip Flashcard */}
        <div
          id={`flashcard-item-${currentIndex}`}
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative w-full h-72 sm:h-80 cursor-pointer select-none group perspective-1000 my-2"
        >
          <div
            className={`w-full h-full rounded-3xl p-6 flex flex-col justify-between transition-all duration-500 border shadow-2xl relative ${
              isFlipped
                ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-blue-500/50 text-white'
                : 'bg-gradient-to-br from-zinc-900 to-zinc-950 border-white/15 text-white'
            }`}
          >
            {/* Top card indicator */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                isFlipped ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-zinc-300'
              }`}>
                {isFlipped ? 'Answer / Definition' : 'Prompt / Question'}
              </span>

              <div className="flex items-center gap-2 text-xs text-zinc-400 group-hover:text-white transition-colors">
                <Rotate3D className="w-4 h-4" /> Click card to flip
              </div>
            </div>

            {/* Main content */}
            <div className="my-auto text-center px-4">
              <p className={`font-display font-medium leading-relaxed ${
                isFlipped ? 'text-lg sm:text-xl text-emerald-200' : 'text-xl sm:text-2xl text-white font-semibold'
              }`}>
                {isFlipped ? currentCard.back : currentCard.front}
              </p>
            </div>

            {/* Bottom hint / category */}
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-white/10">
              <span>{currentCard.subject || 'Key Concept'}</span>
              {currentCard.hint && !isFlipped && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint(!showHint);
                  }}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showHint ? currentCard.hint : 'Hint'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card Actions & Navigation */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/10">
          <button
            id="btn-flashcard-prev"
            onClick={handlePrev}
            className="p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer"
            title="Previous Card"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            id="btn-flashcard-mastery"
            onClick={toggleMastery}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isMastered
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10'
            }`}
          >
            <Check className={`w-4 h-4 ${isMastered ? 'text-emerald-400' : 'text-zinc-500'}`} />
            {isMastered ? 'Mastered!' : 'Mark as Mastered'}
          </button>

          <button
            id="btn-flashcard-next"
            onClick={handleNext}
            className="p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer"
            title="Next Card"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
