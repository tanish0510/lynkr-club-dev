import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Rocket, Sparkles, X } from 'lucide-react';

const STORAGE_KEY = 'lynkr_waitlist_banner_seen';
const SHOW_AFTER_MS = 2200;

export default function WaitlistModal({ open: controlledOpen, onOpenChange, onGoToWaitlist }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange != null;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (v) => { if (!v) onOpenChange(false); } : setInternalOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen) return;
      const t = setTimeout(() => {
        if (isControlled && onOpenChange) onOpenChange(true);
        else setInternalOpen(true);
      }, SHOW_AFTER_MS);
      return () => clearTimeout(t);
    } catch {
      if (isControlled && onOpenChange) onOpenChange(true);
      else setInternalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when mounted
  }, [mounted]);

  const close = useCallback(() => {
    if (isControlled) onOpenChange(false);
    else setInternalOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
      window.dispatchEvent(new CustomEvent('lynkr_waitlist_dismissed'));
    } catch {}
  }, [isControlled, onOpenChange]);

  const goToWaitlist = useCallback(() => {
    if (isControlled) onOpenChange(false);
    else setInternalOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
      window.dispatchEvent(new CustomEvent('lynkr_waitlist_dismissed'));
    } catch {}
    onGoToWaitlist?.();
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [onGoToWaitlist, isControlled, onOpenChange]);

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        className={cn(
          'waitlist-modal-content w-[calc(100vw-12px)] max-w-[calc(100vw-12px)] sm:max-w-lg sm:w-auto md:max-w-xl p-0 gap-0 overflow-hidden',
          'border-0 bg-transparent shadow-2xl shadow-black/30',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
        )}
        onPointerDownOutside={close}
        onEscapeKeyDown={close}
      >
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden waitlist-modal-gradient">
          {/* Visible close (X) on gradient */}
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {/* Subtle overlay so text stays readable */}
          <div className="absolute inset-0 bg-surface-overlay/20 pointer-events-none rounded-2xl sm:rounded-3xl" />

          <div className="relative pt-4 pb-4 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:pl-8 sm:pr-8 md:p-10 text-left sm:text-center">
            {/* Mobile: icon + title in one row to use horizontal space */}
            <div className="flex flex-row items-center gap-3 sm:flex-col sm:gap-4 sm:mb-0 mb-4">
              <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center">
                <Rocket className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
              </div>
              <DialogTitle className="text-lg font-bold font-heading text-foreground tracking-tight flex-1 min-w-0 sm:text-2xl md:text-3xl sm:flex-none">
                Get Early Access to Lynkr
              </DialogTitle>
            </div>

            <DialogDescription className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md sm:mx-auto leading-relaxed">
              Join the waitlist and tell us which brands you shop from. We&apos;ll notify you when rewards, cashback, and deals go live.
            </DialogDescription>

            {/* Mobile: CTA and "Maybe later" in one row; desktop same */}
            <div className="flex flex-row flex-wrap gap-3 justify-start sm:justify-center items-center">
              <Button
                onClick={goToWaitlist}
                className={cn(
                  'min-h-[48px] sm:min-h-[52px] px-6 sm:px-8 rounded-xl text-base font-semibold flex-1 min-w-0 sm:flex-initial',
                  'bg-white text-teal-700 hover:bg-white/95 shadow-lg',
                  'touch-manipulation active:scale-[0.98]'
                )}
              >
                <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Join the Waitlist</span>
              </Button>
              <button
                type="button"
                onClick={close}
                className="text-sm text-muted-foreground hover:text-foreground underline touch-manipulation min-h-[44px] px-3 flex-shrink-0"
              >
                Maybe later
              </button>
            </div>

            <p className="mt-4 sm:mt-5 text-xs text-muted-foreground">
              Help us bring rewards to the brands you love. The more demand we see, the faster we onboard.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
