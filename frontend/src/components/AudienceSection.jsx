import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

/** Accent colors for companies variant cards (segment index → tailwind classes) */
const COMPANY_ACCENTS = [
  'bg-teal-500/15 text-teal-400',        // Startups – teal
  'bg-violet-500/15 text-violet-400',    // Growing brands – violet
  'bg-muted text-txt-secondary',      // Enterprises – neutral
];

/**
 * Audience section: who the product is for. Variants:
 * - compact: headline + row of icon+label segments + optional body + CTA
 * - cards: headline + 2–3 cards with icon, title, description
 * - companies: "For companies of all sizes" — 3 blocks with icon, title, tagline, description (desktop 3-col, mobile stack)
 * - split: two segments in two columns with a vertical divider (no card boxes); mobile: stacked with divider
 * Desktop: row or grid; mobile: stack or grid.
 */
const AudienceSection = ({
  id,
  variant = 'cards',
  title,
  subtitle,
  body,
  segments = [],
  ctaLabel,
  ctaPath,
  ctaOnClick,
  className,
  altBg = false,
}) => {
  const navigate = useNavigate();

  const runCta = () => {
    if (ctaOnClick) ctaOnClick();
    else if (ctaPath) navigate(ctaPath);
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
        <h2
          id={id ? `${id}-heading` : undefined}
          className={cn(
            'font-bold font-heading text-foreground text-xl sm:text-2xl md:text-3xl mb-2',
            variant === 'companies' ? 'text-center md:text-left' : 'text-center sm:mb-3'
          )}
        >
          {title}
        </h2>
        {subtitle && (
          <p className={cn(
            'text-sm sm:text-base text-muted-foreground mb-4 max-w-2xl',
            variant === 'companies' ? 'text-center md:text-left' : 'text-center mx-auto'
          )}>
            {subtitle}
          </p>
        )}

        {variant === 'compact' && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10 mb-6 sm:mb-8">
              {segments.map((seg) => {
                const Icon = seg.icon;
                return (
                  <div
                    key={seg.label}
                    className="flex flex-col items-center gap-2 text-center"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-teal-500/15 flex items-center justify-center">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-teal-400" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {seg.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {body && (
              <p className="text-center text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-6">
                {body}
              </p>
            )}
          </>
        )}

        {variant === 'companies' && (
          <div className="rounded-2xl border border-border bg-card/80 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 md:gap-8 min-w-0">
                {segments.map((seg, i) => {
                  const Icon = seg.icon;
                  const accent = COMPANY_ACCENTS[i % COMPANY_ACCENTS.length];
                  return (
                    <div
                      key={seg.title}
                      className="flex flex-col min-w-0 rounded-xl p-3 sm:p-5 bg-background/40 border border-border hover:border-border transition-colors"
                    >
                      <div className={cn('w-11 h-11 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 shrink-0', accent)}>
                        <Icon className="h-5 w-5 sm:h-8 sm:w-8" />
                      </div>
                      <h3 className="font-bold font-heading text-foreground text-sm sm:text-lg mb-0.5 sm:mb-1">
                        {seg.title}
                      </h3>
                      {seg.tagline && (
                        <p className="text-xs sm:text-sm font-medium text-foreground/90 mb-1 sm:mb-2 leading-snug line-clamp-2">
                          {seg.tagline}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3 sm:line-clamp-none">
                        {seg.description}
                      </p>
                    </div>
                  );
                })}
              </div>
              {ctaLabel && (
                <div className="mt-6 sm:mt-8 flex flex-wrap justify-center md:justify-start">
                  <button
                    type="button"
                    onClick={runCta}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg touch-manipulation"
                  >
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {variant === 'split' && segments.length >= 2 && (
          <div className="mt-4 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-0 min-w-0 rounded-xl overflow-hidden border border-border bg-background/50 sm:flex sm:flex-row">
            {segments.slice(0, 2).map((seg, i) => {
              const Icon = seg.icon;
              return (
                <div
                  key={seg.title}
                  className={cn(
                    'flex-1 p-4 sm:p-8 flex flex-col items-center text-center min-w-0',
                    i === 1 && 'border-l border-border'
                  )}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-500/10 flex items-center justify-center mb-2 sm:mb-4 shrink-0">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-teal-400" />
                  </div>
                  <h3 className="font-semibold font-heading text-foreground text-sm sm:text-lg mb-1 sm:mb-2">{seg.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm line-clamp-3 sm:line-clamp-none">{seg.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {variant === 'cards' && (
          <div className={cn('mt-6 sm:mt-8 min-w-0', segments.length <= 2 && 'flex justify-center')}>
            <div className={cn(
              'grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 min-w-0',
              segments.length <= 2 ? 'lg:grid-cols-2 max-w-3xl w-full mx-auto' : 'lg:grid-cols-3'
            )}>
              {segments.map((seg) => {
                const Icon = seg.icon;
                return (
                  <div
                    key={seg.title}
                    className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-6 shadow-sm flex flex-col min-h-[120px] sm:min-h-[180px] transition-shadow hover:shadow-md hover:border-border min-w-0 items-stretch"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-teal-500/15 flex items-center justify-center mb-2 sm:mb-4 shrink-0">
                      <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-teal-400" />
                    </div>
                    <h3 className="font-semibold font-heading text-foreground mb-1 sm:mb-2 text-sm sm:text-lg">
                      {seg.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-2 sm:line-clamp-none">
                      {seg.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {ctaLabel && variant !== 'companies' && (
          <div className="mt-6 sm:mt-8 flex justify-center">
            <button
              type="button"
              onClick={runCta}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg touch-manipulation transition-all duration-200"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AudienceSection;
