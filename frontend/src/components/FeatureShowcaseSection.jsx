import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

/**
 * Two-column feature block: left = headline (optional highlight), description, CTA link;
 * right = custom visual (mock UI card). Desktop: side-by-side; mobile: stack (text first).
 * Use for email, rewards, AI, spend analytics, linking features.
 */
const FeatureShowcaseSection = ({
  id,
  tagline,
  headline,
  highlightWord,
  description,
  ctaLabel,
  ctaPath,
  ctaOnClick,
  children,
  className,
  altBg = false,
  reverse = false,
}) => {
  const navigate = useNavigate();

  const headlineParts = highlightWord && headline.includes(highlightWord)
    ? headline.split(highlightWord)
    : [headline];

  const runCta = () => {
    if (ctaOnClick) ctaOnClick();
    else if (ctaPath) navigate(ctaPath);
  };

  const content = (
    <div className="flex-1 text-center sm:text-left max-w-xl mx-auto sm:mx-0 lg:max-w-none min-w-0">
      {tagline && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">
          {tagline}
        </p>
      )}
      <h2
        id={id ? `${id}-heading` : undefined}
        className="text-xl sm:text-2xl md:text-3xl font-bold font-heading tracking-tight leading-tight mb-3 text-foreground"
      >
        {highlightWord && headlineParts.length === 2 ? (
          <>
            <span>{headlineParts[0]}</span>
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              {highlightWord}
            </span>
            <span>{headlineParts[1]}</span>
          </>
        ) : (
          headline
        )}
      </h2>
      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
        {description}
      </p>
      {ctaLabel && (
        <button
          type="button"
          onClick={runCta}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg touch-manipulation"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      )}
    </div>
  );

  const visual = (
    <div className={cn('flex-1 min-w-0 flex justify-center mt-4 sm:mt-0', reverse ? 'sm:justify-start' : 'sm:justify-end')}>
      <div className="rounded-xl sm:rounded-2xl ring-1 ring-white/10 ring-offset-2 ring-offset-background w-full max-w-[280px] sm:max-w-sm">
        {children}
      </div>
    </div>
  );

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
        <div
          className={cn(
            'rounded-2xl border border-white/10 bg-card/80 backdrop-blur-sm overflow-hidden',
            'flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 lg:gap-12 xl:gap-16 px-4 py-5 sm:p-6 md:p-8',
            reverse && 'sm:flex-row-reverse'
          )}
        >
          {content}
          {visual}
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcaseSection;
