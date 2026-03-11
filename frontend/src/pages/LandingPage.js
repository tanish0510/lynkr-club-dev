import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Menu,
  Wallet,
  Sparkles,
  Gift,
  Users,
  Building2,
  Zap,
  Lock,
  Network,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import WelcomeLayout from '@/components/onboarding/WelcomeLayout';
import Logo from '@/components/Logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Product', href: '#how-it-works' },
  { label: 'Rewards', href: '#how-it-works' },
  { label: 'Partners', path: '/partner' },
];

const STEPS = [
  { icon: Wallet, title: 'Pay or transact', text: 'Shop with your Lynkr email at partner brands.' },
  { icon: Sparkles, title: 'Earn points', text: 'Purchases are detected and points are credited automatically.' },
  { icon: Gift, title: 'Redeem rewards', text: 'Turn points into coupons and offers from top brands.' },
];

const PORTALS = [
  {
    icon: Users,
    title: 'User App',
    description: 'Earn rewards and redeem points.',
    label: 'Open App',
    path: '/login',
    variant: 'primary',
  },
  {
    icon: Building2,
    title: 'Partner Portal',
    description: 'Manage transactions and customer rewards.',
    label: 'Partner Login',
    path: '/partner',
    variant: 'outline',
  },
];

const TRUST_ITEMS = [
  { icon: Zap, title: 'Instant rewards', text: 'Points credited automatically.' },
  { icon: Lock, title: 'Secure transactions', text: 'Your data stays protected.' },
  { icon: Network, title: 'Partner network', text: 'Shop at trusted brands.' },
  { icon: BarChart3, title: 'Smart analytics', text: 'Track and optimize rewards.' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const hasSeenWelcome = localStorage.getItem('hasSeenWelcome') === '1' || localStorage.getItem('hasSeenIntro') === '1';

  if (user?.role === 'USER') return <Navigate to="/app/dashboard" replace />;
  if (user?.role === 'PARTNER') return <Navigate to="/partner/dashboard" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;

  if (!user && !hasSeenWelcome) {
    return <WelcomeLayout onComplete={() => navigate('/signup')} onLogin={() => navigate('/login')} />;
  }

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header>
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/5" aria-label="Main navigation">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg"
            aria-label="Lynkr home"
          >
            <Logo className="h-10 w-28 sm:h-12 sm:w-36" />
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              link.path ? (
                <button
                  key={link.label}
                  onClick={() => goTo(link.path)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 flex items-center"
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 flex items-center"
                >
                  {link.label}
                </a>
              )
            ))}
            <Button
              data-testid="login-button"
              variant="ghost"
              className="min-h-[44px] rounded-xl text-foreground hover:bg-white/5"
              onClick={() => goTo('/login')}
            >
              Login
            </Button>
          </div>

          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden min-h-[44px] min-w-[44px] rounded-xl"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-[280px] pt-8">
              <div className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  link.path ? (
                    <button
                      key={link.label}
                      onClick={() => goTo(link.path)}
                      className="min-h-[44px] px-4 py-3 rounded-xl text-foreground hover:bg-white/5 flex items-center font-medium text-left"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="min-h-[44px] px-4 py-3 rounded-xl text-foreground hover:bg-white/5 flex items-center font-medium"
                    >
                      {link.label}
                    </a>
                  )
                ))}
                <Button
                  className="min-h-[44px] rounded-xl justify-start mt-4"
                  onClick={() => goTo('/login')}
                >
                  Login
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      </header>

      <main>
      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 relative overflow-hidden" aria-labelledby="hero-heading">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto relative text-center">
          <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-heading text-foreground leading-tight mb-4">
            Turn everyday payments into rewards.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
            Use your Lynkr email when you shop. We detect purchases and credit points automatically. Redeem for coupons and offers.
          </p>
          <div className="flex flex-col gap-3 sm:gap-4 max-w-sm mx-auto">
            <Button
              data-testid="hero-get-started-button"
              className="min-h-[48px] w-full rounded-2xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => goTo('/signup')}
            >
              Continue as User
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              data-testid="partner-button"
              variant="outline"
              className="min-h-[48px] w-full rounded-2xl text-base font-medium border-white/15 bg-white/5 hover:bg-white/10"
              onClick={() => goTo('/partner')}
            >
              Partner Login
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-12 md:py-16 px-4 sm:px-6 bg-secondary/20" aria-labelledby="how-it-works-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="how-it-works-heading" className="text-2xl md:text-3xl font-bold font-heading text-center mb-8">
            How it works
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 md:overflow-visible md:grid md:grid-cols-3 md:gap-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                data-testid={`step-${i + 1}`}
                className="flex-shrink-0 w-[280px] md:w-auto bg-card rounded-2xl border border-white/5 p-6 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold font-heading text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal selection */}
      <section id="portals" className="py-12 md:py-16 px-4 sm:px-6" aria-labelledby="portals-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="portals-heading" className="text-2xl md:text-3xl font-bold font-heading text-center mb-8">
            Choose your portal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
            {PORTALS.map((portal) => (
              <div
                key={portal.title}
                className="rounded-2xl border border-white/5 bg-card p-6 shadow-sm flex flex-col min-h-[200px]"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                  <portal.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold font-heading text-lg text-foreground mb-2">{portal.title}</h3>
                <p className="text-sm text-muted-foreground mb-6 flex-1">{portal.description}</p>
                <Button
                  variant={portal.variant}
                  className={cn(
                    'min-h-[44px] w-full rounded-xl font-medium',
                    portal.variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                  onClick={() => goTo(portal.path)}
                >
                  {portal.label}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / value */}
      <section className="py-12 md:py-16 px-4 sm:px-6 bg-secondary/20" aria-labelledby="why-lynkr-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="why-lynkr-heading" className="text-2xl md:text-3xl font-bold font-heading text-center mb-8">
            Why Lynkr
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {TRUST_ITEMS.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-4 rounded-2xl bg-card border border-white/5"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 border-t border-white/5" aria-labelledby="contact-heading">
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="contact-heading" className="text-2xl md:text-3xl font-bold font-heading mb-3">Contact Us</h2>
          <p className="text-muted-foreground mb-6">Reach out for onboarding, demos, or support.</p>
          <div className="space-y-2 text-sm md:text-base">
            <p>
              <span className="font-semibold">+91 9839662626</span> - Tanish
            </p>
            <p>
              <span className="font-semibold">+91 8199040184</span> - Vaidant
            </p>
            <p>
              <span className="font-semibold">admin@lynkr.club</span>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-10 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo className="h-8 w-24 text-muted-foreground/80" />
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="/terms" className="hover:text-foreground min-h-[44px] flex items-center">
              Terms
            </a>
            <a href="/terms" className="hover:text-foreground min-h-[44px] flex items-center">
              Privacy
            </a>
            <a href="/partner" className="hover:text-foreground min-h-[44px] flex items-center">
              For Partners
            </a>
            <a href="mailto:admin@lynkr.club" className="hover:text-foreground min-h-[44px] flex items-center">
              Contact
            </a>
          </div>
        </div>
        <p className="max-w-6xl mx-auto mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Lynkr. All rights reserved.
        </p>
      </footer>
      </main>
    </div>
  );
};

export default LandingPage;
