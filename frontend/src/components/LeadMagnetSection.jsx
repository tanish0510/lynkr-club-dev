import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';

/**
 * Lead magnet block: left = guide/cover visual, right = headline, description, email form, CTA.
 * Desktop: two columns; mobile: stacked (cover top, then copy + form). Dark card theme.
 *
 * @param {string} [id] - Section id
 * @param {string} title - Headline (e.g. "Get Our FREE Lynkr Quick Start Guide")
 * @param {string} [highlight] - Word to style with gradient (e.g. "FREE")
 * @param {string} description - Short benefit copy
 * @param {string} ctaLabel - Submit button (e.g. "Get the guide")
 * @param {(email: string) => void} onSubmit - Called with email on submit (wire to API or mailto)
 * @param {React.ReactNode} [cover] - Left column content (custom cover); if omitted, shows default doc card
 * @param {string} [coverTitle] - Title on default cover when cover prop not provided
 * @param {string} [className] - Section wrapper class
 * @param {boolean} [altBg] - Use bg-secondary/20 for section background
 * @param {string} [emailPlaceholder] - Placeholder for email input
 */
const LeadMagnetSection = ({
  id,
  title,
  highlight,
  description,
  ctaLabel = 'Get the guide',
  onSubmit,
  cover,
  coverTitle = 'Guide',
  className,
  altBg = false,
  emailPlaceholder = 'Enter your email address',
}) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !onSubmit) return;
    setLoading(true);
    try {
      await Promise.resolve(onSubmit(trimmed));
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const titleParts = highlight && title.includes(highlight)
    ? title.split(highlight)
    : [title];

  const defaultCover = (
    <div className="w-full aspect-[3/4] max-h-[200px] sm:max-h-[280px] lg:max-h-[320px] rounded-xl bg-card border border-border flex flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-violet-500/20 flex items-center justify-center mb-2 sm:mb-4 shrink-0">
        <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-violet-400" />
      </div>
      <p className="text-xs sm:text-base font-semibold text-foreground leading-tight">
        {coverTitle}
      </p>
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
      <div className="max-w-5xl mx-auto">
        <div
          className={cn(
            'rounded-2xl border border-border bg-card overflow-hidden shadow-lg min-w-0',
            'flex flex-col sm:flex-row sm:min-h-[280px] lg:min-h-[320px]'
          )}
        >
          {/* Left: cover — side-by-side from sm */}
          <div className="sm:w-[38%] lg:w-[42%] sm:min-w-0 flex-shrink-0 p-3 sm:p-6 flex items-center justify-center bg-muted/30 order-2 sm:order-1">
            {cover != null ? cover : defaultCover}
          </div>

          {/* Right: copy + form — show first on mobile for clarity */}
          <div className="flex-1 p-4 sm:p-8 flex flex-col justify-center order-1 sm:order-2 min-w-0">
            <h2
              id={id ? `${id}-heading` : undefined}
              className="text-xl sm:text-2xl md:text-3xl font-bold font-heading tracking-tight leading-tight mb-3 text-foreground"
            >
              {highlight && titleParts.length === 2 ? (
                <>
                  <span>{titleParts[0]}</span>
                  <span className="bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
                    {highlight}
                  </span>
                  <span>{titleParts[1]}</span>
                </>
              ) : (
                title
              )}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
              {description}
            </p>

            {submitted ? (
              <p className="text-teal-400 font-medium" data-testid="lead-magnet-success">
                Check your inbox — we&apos;ve sent the guide.
              </p>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 min-w-0 sm:flex-row">
                  <Input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-h-[48px] rounded-xl border-border bg-background/80 flex-1 placeholder:text-muted-foreground/70"
                    required
                    disabled={loading}
                    data-testid="lead-magnet-email"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full sm:w-auto min-h-[48px] rounded-xl px-6 sm:px-8 bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation active:scale-[0.98] shrink-0 font-semibold"
                  >
                    {loading ? 'Sending…' : ctaLabel}
                  </Button>
                </form>
                <p className="mt-3 text-xs text-muted-foreground/90">
                  By signing up you agree to our{' '}
                  <a href="/terms" className="text-muted-foreground hover:text-foreground underline">Terms</a>
                  {' '}and{' '}
                  <a href="/terms" className="text-muted-foreground hover:text-foreground underline">Privacy Policy</a>.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadMagnetSection;
