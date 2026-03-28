import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const accentColors = {
  catalog: { bg: 'rgba(59,130,246,0.12)', text: 'text-blue-400', glow: 'rgba(59,130,246,0.10)' },
  rewards: { bg: 'rgba(168,85,247,0.12)', text: 'text-purple-400', glow: 'rgba(168,85,247,0.10)' },
  experiences: { bg: 'rgba(20,184,166,0.12)', text: 'text-teal-400', glow: 'rgba(20,184,166,0.08)' },
  perks: { bg: 'rgba(251,191,36,0.12)', text: 'text-amber-400', glow: 'rgba(251,191,36,0.08)' },
};

const FeatureCard = ({ id, title, description, icon: Icon, to, disabled, comingSoon }) => {
  const navigate = useNavigate();
  const colors = accentColors[id] || accentColors.catalog;

  const handleClick = () => {
    if (disabled || !to) return;
    navigate(to);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`group relative w-full text-left rounded-2xl border transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 overflow-hidden touch-manipulation ${
        disabled
          ? 'opacity-[0.35] cursor-not-allowed border-border bg-muted/30'
          : 'border-border bg-muted/30 hover:bg-muted hover:border-primary/30 active:scale-[0.98] cursor-pointer'
      }`}
    >
      {/* Top-edge glow on hover */}
      {!disabled && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${colors.glow} 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="relative flex items-start gap-4 p-5">
        {/* Icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300"
          style={{ backgroundColor: disabled ? 'rgba(255,255,255,0.03)' : colors.bg }}
        >
          <Icon
            className={`h-[18px] w-[18px] transition-colors duration-300 ${
              disabled ? 'text-txt-muted' : colors.text
            }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-heading font-semibold text-foreground leading-tight">
              {title}
            </h3>
            {comingSoon && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wider text-txt-secondary uppercase">
                Soon
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-txt-secondary leading-snug">
            {description}
          </p>
        </div>

        {/* Chevron */}
        {!disabled && (
          <ChevronRight className="h-4 w-4 shrink-0 text-txt-muted mt-1 transition-all duration-300 group-hover:text-txt-secondary group-hover:translate-x-0.5" />
        )}
      </div>
    </button>
  );
};

export default FeatureCard;
