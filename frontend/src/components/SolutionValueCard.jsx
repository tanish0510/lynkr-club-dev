import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

/**
 * Single value-proposition card: tag, headline, body, CTA.
 * Dark/accent theme, rounded, works full-width on mobile and in container on desktop.
 *
 * @param {string} [tag] - Category label (e.g. "Rewards", "For businesses")
 * @param {string} headline - Main value statement
 * @param {string} body - Short paragraph
 * @param {{ label: string, path?: string, onClick?: () => void }} [cta] - Button or link
 * @param {string} [className] - Wrapper section class
 */
const SolutionValueCard = ({
  tag,
  headline,
  body,
  cta,
  className,
}) => {
  const navigate = useNavigate();

  const runCta = () => {
    if (cta?.onClick) cta.onClick();
    else if (cta?.path) navigate(cta.path);
  };

  return (
    <section
      className={cn(
        'landing-section landing-pad-x',
        className
      )}
      aria-labelledby="solution-value-heading"
    >
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-teal-500/10 via-transparent to-transparent p-5 sm:p-8 md:p-10 text-center relative overflow-hidden min-w-0">
          {/* Subtle grid/dot pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden>
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          </div>
          {tag && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 relative">
              {tag}
            </p>
          )}
          <h2 id="solution-value-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-foreground mb-3 sm:mb-4 relative">
            {headline}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8 relative">
            {body}
          </p>
          {cta?.label && (
            <Button
              onClick={runCta}
              className="w-full sm:w-auto min-h-[48px] rounded-xl px-6 sm:px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-medium touch-manipulation active:scale-[0.98] relative"
            >
              {cta.label}
              <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SolutionValueCard;
