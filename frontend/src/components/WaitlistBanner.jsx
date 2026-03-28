import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Rocket, X } from 'lucide-react';

const STORAGE_KEY = 'lynkr_waitlist_banner_seen';

export default function WaitlistBanner({ onDismiss, onOpenWaitlist, className }) {
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  const readSeen = () => {
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    setDismissed(readSeen());
    setMounted(true);
  }, []);

  useEffect(() => {
    const onWaitlistDismissed = () => setDismissed(readSeen());
    window.addEventListener('lynkr_waitlist_dismissed', onWaitlistDismissed);
    return () => window.removeEventListener('lynkr_waitlist_dismissed', onWaitlistDismissed);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setDismissed(true);
    onDismiss?.();
  };

  if (!mounted) return null;

  /* After user closes modal or dismisses banner: show compact "Join waitlist" bar above landing */
  if (dismissed) {
    return (
      <div
        className={cn(
          'sticky top-0 z-40 w-full border-b border-white/10 bg-card/90 backdrop-blur-sm',
          'flex items-center justify-center gap-2 sm:gap-3 landing-pad-x py-2 min-h-[44px]',
          className
        )}
        role="banner"
      >
        <Rocket className="h-4 w-4 text-teal-400 shrink-0" aria-hidden />
        {onOpenWaitlist ? (
          <button
            type="button"
            onClick={onOpenWaitlist}
            className="text-sm font-semibold text-teal-400 hover:text-teal-300 underline touch-manipulation min-h-[44px] inline-flex items-center"
          >
            Join the waitlist
          </button>
        ) : (
          <a
            href="#waitlist"
            className="text-sm font-semibold text-teal-400 hover:text-teal-300 underline touch-manipulation min-h-[44px] inline-flex items-center"
          >
            Join the waitlist
          </a>
        )}
        <span className="text-xs text-muted-foreground hidden sm:inline">— early access to rewards</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-50 w-full border-b border-white/10 bg-card/95 backdrop-blur-sm shadow-md',
        className
      )}
      role="banner"
    >
      <div className="landing-pad-x py-3 flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 text-center">
        <Rocket className="h-5 w-5 text-teal-400 shrink-0 hidden sm:block" />
        <p className="text-sm font-medium text-foreground">
          Early Access Waitlist is Open{' '}
          <span className="text-teal-400" aria-hidden>🚀</span>
          {' '}
          Join now to help bring rewards to your favorite brands.
        </p>
        <a
          href="#waitlist"
          className="shrink-0 text-sm font-semibold text-teal-400 hover:text-teal-300 underline touch-manipulation min-h-[44px] inline-flex items-center"
        >
          Join waitlist
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
