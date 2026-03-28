import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Brand accent rotation for icon tiles (bg + text) — teal, violet, blue, pink */
const ICON_ACCENTS = [
  'bg-teal-500/15 text-teal-400',
  'bg-violet-500/15 text-violet-400',
  'bg-primary/15 text-primary',
  'bg-fuchsia-500/15 text-fuchsia-400',
];

/**
 * Two-column features section: left = headline (optional accent highlight), description, CTA;
 * right = grid of rounded icon tiles. Stacks on mobile. Icons use rotating brand colors.
 *
 * @param {string} [id] - Section id for anchor links
 * @param {string} [tagline] - Small label above headline (e.g. "#rewardsmadefree")
 * @param {string} headline - Main heading; use highlight in string and pass highlightWord for gradient
 * @param {string} [highlightWord] - Word/phrase in headline to style with primary gradient
 * @param {string} description - Paragraph below headline
 * @param {{ label: string, path?: string, onClick?: () => void }} cta - Button: path (navigate) or onClick
 * @param {{ icon: React.ComponentType, title: string }[]} features - Icon grid items (Lucide icons)
 * @param {string} [className] - Wrapper section class
 * @param {boolean} [altBg] - Use bg-secondary/20 for section
 */
const FeaturesSection = ({
  id,
  tagline,
  headline,
  highlightWord,
  description,
  cta,
  features = [],
  className,
  altBg = false,
}) => {
  const navigate = useNavigate();

  const headlineParts = highlightWord && headline.includes(highlightWord)
    ? headline.split(highlightWord)
    : [headline];

  const runCta = () => {
    if (cta.onClick) cta.onClick();
    else if (cta.path) navigate(cta.path);
  };

  return (
    <section
      id={id}
      className={cn(
        'landing-section landing-pad-x',
        altBg && 'bg-secondary/20',
        className
      )}
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-card/80 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 lg:gap-12 xl:gap-16">
          {/* Left: copy + CTA */}
          <div className="flex-1 text-center sm:text-left max-w-xl mx-auto sm:mx-0 lg:max-w-none min-w-0">
            {tagline && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4">
                {tagline}
              </p>
            )}
            <h2
              id={id ? `${id}-heading` : undefined}
              className="text-xl sm:text-2xl md:text-3xl lg:text-[1.75rem] xl:text-4xl font-bold font-heading tracking-tight leading-tight mb-3 sm:mb-4"
            >
              {highlightWord && headlineParts.length === 2 ? (
                <>
                  <span className="text-foreground">{headlineParts[0]}</span>
                  <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    {highlightWord}
                  </span>
                  <span className="text-foreground">{headlineParts[1]}</span>
                </>
              ) : (
                <span className="text-foreground">{headline}</span>
              )}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              {description}
            </p>
            {cta?.label && (
              <Button
                onClick={runCta}
                variant="outline"
                className="w-full sm:w-auto min-h-[48px] rounded-xl px-6 sm:px-8 border-white/15 bg-white/5 hover:bg-white/10 text-foreground font-medium touch-manipulation active:scale-[0.98]"
              >
                {cta.label}
              </Button>
            )}
          </div>

          {/* Mobile only: wrapping pills — each icon a different brand color */}
          <div className="flex-1 flex flex-wrap justify-center gap-2 sm:hidden mt-4 min-w-0">
            {features.map((item, i) => {
              const Icon = item.icon;
              const accent = ICON_ACCENTS[i % ICON_ACCENTS.length];
              const [bgClass, textClass] = accent.split(' ');
              return (
                <span
                  key={item.title}
                  className={cn('inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-foreground', bgClass.replace('/15', '/10'))}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', textClass)} />
                  <span className="text-xs font-medium">{item.title}</span>
                </span>
              );
            })}
          </div>

          {/* Desktop: icon grid — each icon a different brand color */}
          <div className="hidden sm:grid flex-1 grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-4 mt-0 min-w-0">
            {features.map((item, i) => {
              const Icon = item.icon;
              const accent = ICON_ACCENTS[i % ICON_ACCENTS.length];
              const [bgClass, textClass] = accent.split(' ');
              return (
                <div
                  key={item.title}
                  className="aspect-square rounded-2xl bg-background/50 border border-white/5 shadow-sm flex flex-col items-center justify-center p-4"
                >
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-2 shrink-0', bgClass)}>
                    <Icon className={cn('h-6 w-6', textClass)} />
                  </div>
                  <span className="text-sm font-medium text-foreground text-center leading-tight">
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
