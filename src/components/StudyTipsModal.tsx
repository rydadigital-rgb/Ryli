import React from 'react';
import { X, ShieldCheck, GraduationCap, Lightbulb, Sparkles, BookOpen, Target } from 'lucide-react';

interface StudyTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudyTipsModal: React.FC<StudyTipsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div
        id="study-tips-modal"
        className="w-full max-w-2xl rounded-3xl border border-white/20 bg-zinc-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-blue-500/20 text-blue-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl font-display text-white">RYLI School & Study Guide</h3>
              <p className="text-xs text-zinc-400">Designed for student success and classroom integrity</p>
            </div>
          </div>
          <button
            id="btn-close-tips"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Safe for Schools Banner */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-300">Strict Student Safety & Educational Boundaries</h4>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                RYLI is engineered exclusively for academic and classroom success. Automated guardrails actively block mature content, adult themes, violence, weapons, gambling, and illicit substances.
              </p>
            </div>
          </div>

          {/* Key Safety Policy Breakdown */}
          <div className="p-4 rounded-2xl bg-zinc-800/50 border border-white/10 space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> Prohibited Non-Educational Content:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-zinc-400">
              <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center gap-2">
                <span className="text-rose-400 font-bold">🚫 Mature / NSFW:</span>
                <span>Adult, sexual, or dating themes</span>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center gap-2">
                <span className="text-rose-400 font-bold">🚫 Violence & Harm:</span>
                <span>Weapons, self-harm, fighting</span>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center gap-2">
                <span className="text-rose-400 font-bold">🚫 Gambling:</span>
                <span>Betting, casinos, lottery schemes</span>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center gap-2">
                <span className="text-rose-400 font-bold">🚫 Substances:</span>
                <span>Drugs, alcohol, vaping, narcotics</span>
              </div>
            </div>
          </div>

          {/* Key Study Modes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-white/10">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-1.5">
                <Target className="w-4 h-4" /> Socratic Tutor Mode
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Instead of giving the direct answer, RYLI asks guiding questions and gives hints so students learn how to solve homework problems independently.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-white/10">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1.5">
                <Sparkles className="w-4 h-4" /> Active Recall Flashcards
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Turn any lesson, notes, or chapter into digital flip cards with mastery tracking for superior long-term test retention.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-white/10">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-1.5">
                <BookOpen className="w-4 h-4" /> Writing & Essay Coach
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Refine thesis statements, review paragraph flow with the PEEL/CER frameworks, check citations (MLA/APA), and polish grammar.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-white/10">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1.5">
                <Lightbulb className="w-4 h-4" /> The Feynman Technique
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Ask RYLI: <em>"Explain this concept to me as if I were in 6th grade"</em> to break down even the most complex AP chemistry or calculus topics.
              </p>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="p-4 rounded-2xl bg-zinc-800/40 border border-white/5 space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pro Student Prompt Tips:</h5>
            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
              <li>Upload a photo of your homework problem or notes for instant step-by-step guidance.</li>
              <li>Ask for a 4-question practice quiz before major exams.</li>
              <li>Use the 25-minute Pomodoro timer in the top bar for deep-focus study blocks.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            id="btn-got-it-tips"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all cursor-pointer"
          >
            Got it, Let's Study!
          </button>
        </div>
      </div>
    </div>
  );
};
