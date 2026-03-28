import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

/**
 * Shared landing header (gusto/DevKinsta-style): dark rounded bar, logo left, nav center, CTAs right.
 * Used on both / and /partners for consistency. Partner page uses showBackInsteadOfLogo + different CTAs.
 * Mobile: hamburger opens sheet with nav + CTAs.
 */
const LandingHeader = ({
  /** Main landing: nav items like { label, href } or { label, path }. Partner landing: pass [] or minimal. */
  navLinks = [],
  /** Primary CTA: { label, path } or { label, onClick }. e.g. "Sign up for free" or "Become Partner" */
  primaryCta = { label: 'Sign up for free', path: '/app/signup' },
  /** Secondary CTA: { label, path } or { label, onClick } (e.g. Login) */
  secondaryCta = { label: 'Login', path: '/app/login' },
  /** If true, show back link instead of logo (e.g. partner landing) */
  showBackInsteadOfLogo = false,
  /** For partner: back goes to /partners or /. */
  backTo = '/',
  /** Optional data-testid for primary CTA (e.g. "partner-signup-button"). */
  primaryCtaTestId,
  /** Optional aria-label for nav (e.g. "Partner navigation" on /partners). */
  ariaLabel = 'Main navigation',
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (pathOrHandler) => {
    setMenuOpen(false);
    if (typeof pathOrHandler === 'function') pathOrHandler();
    else navigate(pathOrHandler);
  };

  const runCta = (cta) => {
    if (cta.onClick) cta.onClick();
    else if (cta.path) navigate(cta.path);
    setMenuOpen(false);
  };

  const linkClass = 'min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors';
  /* Utility/secondary CTA: neutral outline so it’s visually distinct from primary */
  const ctaUtilityClass = 'min-h-[44px] px-4 py-2 rounded-full text-sm font-medium border border-border bg-transparent text-foreground hover:bg-muted/50 hover:border-border transition-colors';

  return (
    <header>
      <nav
        className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] px-3 sm:px-4 md:px-6"
        aria-label={ariaLabel}
      >
        {/* Dark rounded bar: full-width on small screens, inset floating bar on md+ */}
        <div
          className={[
            'mx-auto max-w-6xl',
            'rounded-2xl',
            'backdrop-blur-xl bg-card/95 border border-border',
            'shadow-lg shadow-black/20',
          ].join(' ')}
        >
          <div className="px-3 sm:px-6 py-2.5 sm:py-3 grid grid-cols-[1fr_auto_1fr] md:grid-cols-3 items-center gap-4 min-h-[52px] sm:min-h-[56px]">
          {/* Left: logo or back */}
          <div className="flex items-center min-w-0 justify-start">
            {showBackInsteadOfLogo ? (
              <button
                type="button"
                onClick={() => navigate(backTo)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] sm:min-w-0 rounded-xl touch-manipulation active:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back to Lynkr</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center min-h-[44px] min-w-[44px] sm:min-w-0 -ml-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 touch-manipulation"
                aria-label="Lynkr home"
              >
                <Logo className="h-9 w-24 sm:h-10 sm:w-32" />
              </button>
            )}
          </div>

          {/* Center: nav links (desktop only) — middle column so Partner etc. stay centered */}
          <div className="hidden md:flex items-center justify-center justify-self-center">
            {navLinks.length > 0 && (
              <div className="flex items-center gap-1">
                {navLinks.map((link) =>
                  link.path ? (
                    <button
                      key={link.label}
                      onClick={() => goTo(link.path)}
                      className={linkClass}
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a key={link.label} href={link.href} className={linkClass}>
                      {link.label}
                    </a>
                  )
                )}
              </div>
            )}
          </div>

          {/* Right: CTAs (desktop) + hamburger (mobile) in one cell so grid stays 3 columns */}
          <div className="flex items-center justify-end gap-2">
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle size="sm" />
              <button
                type="button"
                data-testid="login-button"
                onClick={() => runCta(secondaryCta)}
                className={ctaUtilityClass}
              >
                {secondaryCta.label}
              </button>
              <Button
                data-testid={primaryCtaTestId}
                onClick={() => runCta(primaryCta)}
                className="min-h-[44px] rounded-full px-5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
              >
                {primaryCta.label}
              </Button>
            </div>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden min-h-[44px] min-w-[44px] rounded-xl touch-manipulation"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-[min(300px,100vw-2rem)] pt-[calc(1rem+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)]"
            >
              <div className="flex flex-col gap-1 pt-2">
                {navLinks.map((link) =>
                  link.path ? (
                    <button
                      key={link.label}
                      type="button"
                      onClick={() => goTo(link.path)}
                      className="min-h-[48px] px-4 py-3 rounded-xl text-foreground hover:bg-white/5 active:bg-white/10 flex items-center font-medium text-left w-full touch-manipulation"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="min-h-[48px] px-4 py-3 rounded-xl text-foreground hover:bg-white/5 flex items-center font-medium w-full touch-manipulation"
                    >
                      {link.label}
                    </a>
                  )
                )}
                {!showBackInsteadOfLogo && (
                  <button
                    type="button"
                    onClick={() => goTo('/partners')}
                    className="min-h-[48px] px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted flex items-center font-medium text-left w-full touch-manipulation gap-2"
                  >
                    For Partners
                  </button>
                )}
                <div className="border-t border-border mt-4 pt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <ThemeToggle size="sm" />
                    <span className="text-sm text-muted-foreground">Theme</span>
                  </div>
                  <Button
                    variant="outline"
                    className="min-h-[44px] rounded-xl justify-start w-full touch-manipulation border-border bg-transparent font-medium"
                    onClick={() => runCta(secondaryCta)}
                  >
                    {secondaryCta.label}
                  </Button>
                  <Button
                    data-testid={primaryCtaTestId}
                    className="min-h-[44px] rounded-xl justify-start w-full touch-manipulation bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    onClick={() => runCta(primaryCta)}
                  >
                    {primaryCta.label}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
        </div>
      </nav>
    </header>
  );
};

export default LandingHeader;
