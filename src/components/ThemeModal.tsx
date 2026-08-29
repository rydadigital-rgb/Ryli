import React, { useState } from 'react';
import { X, Check, MapPin, Sparkles, Mountain, Landmark, Waves, Compass } from 'lucide-react';
import { WallpaperTheme } from '../types';
import { THEME_OPTIONS, ThemeOption } from '../utils/themePresets';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: WallpaperTheme;
  onSelectTheme: (theme: WallpaperTheme) => void;
}

type FilterCategory = 'all' | 'nature' | 'monuments' | 'coastal' | 'wonders';

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');

  if (!isOpen) return null;

  // Filter themes (excluding duplicate legacy entries in the modal display)
  const displayThemes = THEME_OPTIONS.filter((t) => t.id !== 'rice_terrace');

  const filteredThemes = displayThemes.filter((t) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'nature') return t.category === 'Nature & Landscapes';
    if (selectedFilter === 'monuments') return t.category === 'Historical Monuments';
    if (selectedFilter === 'coastal') return t.category === 'Coastal & Marine';
    if (selectedFilter === 'wonders') return t.category === 'Natural Wonders';
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Historical Monuments':
        return <Landmark className="w-3.5 h-3.5 text-amber-400" />;
      case 'Coastal & Marine':
        return <Waves className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Natural Wonders':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Nature & Landscapes':
        return <Mountain className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="philippine-theme-modal"
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-white/20 bg-zinc-950/95 text-white shadow-2xl overflow-hidden backdrop-blur-2xl"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/25">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display text-white">Philippine Atmosphere & Backgrounds</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300">
                  🇵🇭 Philippine Heritage
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Immerse your study sessions with iconic Philippine nature, UNESCO historical monuments & natural wonders.
              </p>
            </div>
          </div>
          <button
            id="btn-close-theme-modal"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-6 py-3 border-b border-white/10 bg-zinc-900/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            id="filter-theme-all"
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            All Places ({displayThemes.length})
          </button>
          <button
            id="filter-theme-nature"
            onClick={() => setSelectedFilter('nature')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'nature'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Nature & Landscapes</span>
          </button>
          <button
            id="filter-theme-monuments"
            onClick={() => setSelectedFilter('monuments')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'monuments'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Historical Monuments</span>
          </button>
          <button
            id="filter-theme-wonders"
            onClick={() => setSelectedFilter('wonders')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'wonders'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Natural Wonders</span>
          </button>
          <button
            id="filter-theme-coastal"
            onClick={() => setSelectedFilter('coastal')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'coastal'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Islands & Coastlines</span>
          </button>
        </div>

        {/* Theme Cards Grid */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThemes.map((theme) => {
              const isSelected = currentTheme === theme.id || (theme.id === 'banaue_rice_terraces' && currentTheme === 'rice_terrace');
              return (
                <div
                  key={theme.id}
                  id={`theme-card-${theme.id}`}
                  onClick={() => {
                    onSelectTheme(theme.id);
                  }}
                  className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer text-left ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-xl shadow-blue-600/20 bg-zinc-900'
                      : 'border-white/15 hover:border-white/30 bg-zinc-900/80 hover:bg-zinc-900 hover:scale-[1.02]'
                  }`}
                >
                  {/* Thumbnail / Image Preview */}
                  <div className="relative h-36 w-full overflow-hidden bg-zinc-950">
                    {theme.previewUrl ? (
                      <img
                        src={theme.previewUrl}
                        alt={theme.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: theme.cssBackground }}
                      >
                        <span className="text-xs font-mono text-zinc-400">Minimalist Dark Canvas</span>
                      </div>
                    )}
                    
                    {/* Dark gradient overlay on card image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                    {/* Tag badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white shadow-sm">
                      {getCategoryIcon(theme.category)}
                      <span>{theme.tag}</span>
                    </div>

                    {/* Active Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg ring-2 ring-white">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Card Content & Details */}
                  <div className="p-3.5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 mb-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{theme.location}</span>
                      </div>
                      <h3 className="font-bold text-sm text-white font-display leading-snug">
                        {theme.name}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {theme.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {theme.category}
                      </span>
                      <button
                        id={`btn-apply-theme-${theme.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTheme(theme.id);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Active Atmosphere' : 'Select'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>HD Philippine Wallpapers automatically adjust ambient contrast for optimal study readability.</span>
          </div>
          <button
            id="btn-done-theme-modal"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
