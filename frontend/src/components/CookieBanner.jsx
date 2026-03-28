import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'lynkr_cookie_consent';

/**
 * Cookie consent banner: fixed bottom, works on mobile and desktop.
 * - Dark bar, cookie emoji, message with link to cookie/privacy policy, "Got it!" button.
 * - Persists acceptance in localStorage; does not render once accepted.
 */
const CookieBanner = ({ className, policyHref = '/terms', policyLabel = 'cookie policy' }) => {
  const [accepted, setAccepted] = useState(true); // start hidden until we read storage

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setAccepted(stored === 'accepted');
    } catch {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
      setAccepted(true);
    } catch {
      setAccepted(true);
    }
  };

  if (accepted) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[100]',
        'pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]',
        'rounded-t-2xl sm:rounded-t-[1.25rem]',
        'bg-card border border-white/10 border-b-0 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm sm:text-base text-foreground leading-relaxed pr-2">
            <span className="inline-block mr-1.5" aria-hidden>🍪</span>
            By continuing to browse the site, you are agreeing to our{' '}
            <Link
              to={policyHref}
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
            >
              {policyLabel}.
            </Link>
          </p>
          <button
            type="button"
            onClick={handleAccept}
            className={cn(
              'shrink-0 rounded-full px-5 py-2.5 sm:px-6 sm:py-3',
              'text-sm font-semibold bg-primary text-primary-foreground',
              'hover:bg-primary/90 active:scale-[0.98]',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
              'min-h-[44px] sm:min-h-0 touch-manipulation'
            )}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
