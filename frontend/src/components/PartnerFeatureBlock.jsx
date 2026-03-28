import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * One feature block (image-inspired): left = icon, headline, highlighted tagline, description, CTA;
 * right = demo/mock UI. Wrapped in a dark card for modal-like focus.
 * Desktop: two columns; mobile: stack (text first, then visual).
 */
const PartnerFeatureBlock = ({
  icon: Icon,
  title,
  tagline,
  description,
  ctaLabel,
  ctaPath,
  ctaOnClick,
  children,
  reverse = false,
  className,
}) => {
  const navigate = useNavigate();

  const runCta = () => {
    if (ctaOnClick) ctaOnClick();
    else if (ctaPath) navigate(ctaPath);
  };

  const textBlock = (
    <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0 lg:max-w-none">
      {Icon && (
        <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-3 sm:mb-4 inline-flex lg:flex">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
      )}
      <h3 className="text-xl sm:text-2xl md:text-2xl font-bold font-heading text-foreground mb-2">
        {title}
      </h3>
      {tagline && (
        <p className="text-sm sm:text-base font-semibold text-primary/95 mb-3">
          {tagline}
        </p>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 sm:mb-5">
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

  const visualBlock = (
    <div className={cn('flex-1 min-w-0 flex justify-center lg:justify-center', reverse ? 'lg:justify-start' : 'lg:justify-end')}>
      <div className="rounded-2xl ring-1 ring-white/10 ring-offset-2 ring-offset-transparent sm:ring-offset-4 sm:ring-offset-background/50">
        {children}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-card/80 backdrop-blur-sm px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10',
        'flex flex-col lg:flex-row lg:items-center gap-6 sm:gap-8 lg:gap-12',
        'first:mt-0 last:mb-0',
        className
      )}
    >
      {reverse ? (
        <>
          {visualBlock}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {visualBlock}
        </>
      )}
    </div>
  );
};

export default PartnerFeatureBlock;
