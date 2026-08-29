import React from 'react';

interface RyliLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const RyliLogo: React.FC<RyliLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  onClick,
}) => {
  const sizeStyles = {
    sm: {
      letters: 'text-xl sm:text-2xl font-black tracking-tight',
      sub: 'text-[10px] sm:text-xs',
      gap: 'gap-1 sm:gap-1.5',
    },
    md: {
      letters: 'text-2xl sm:text-4xl font-black tracking-tighter',
      sub: 'text-[11px] sm:text-sm',
      gap: 'gap-2 sm:gap-2.5',
    },
    lg: {
      letters: 'text-4xl sm:text-6xl font-black tracking-tighter',
      sub: 'text-sm sm:text-lg',
      gap: 'gap-2.5 sm:gap-3',
    },
    xl: {
      letters: 'text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter drop-shadow-2xl',
      sub: 'text-sm sm:text-base md:text-xl font-medium',
      gap: 'gap-2 sm:gap-3.5',
    },
  };

  const current = sizeStyles[size];

  return (
    <div
      id="ryli-brand-logo"
      onClick={onClick}
      className={`inline-flex items-center select-none ${current.gap} ${onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${className}`}
    >
      <div className={`flex items-baseline font-black leading-none font-display ${current.letters}`}>
        <span className="text-[#2563EB] drop-shadow-[0_2px_10px_rgba(37,99,235,0.45)]">R</span>
        <span className="text-[#F5C542] drop-shadow-[0_2px_10px_rgba(245,197,66,0.45)]">Y</span>
        <span className="text-[#F8FAFC] drop-shadow-[0_2px_10px_rgba(248,250,252,0.45)]">L</span>
        <span className="text-[#EF6A6A] drop-shadow-[0_2px_10px_rgba(239,106,106,0.45)]">I</span>
      </div>

      {showSubtitle && (
        <span
          className={`text-white/90 font-medium tracking-normal whitespace-nowrap self-end pb-0.5 sm:pb-1 font-sans ${
            size === 'sm' ? 'hidden sm:inline-block' : ''
          } ${current.sub}`}
        >
          By Ryda
        </span>
      )}
    </div>
  );
};
