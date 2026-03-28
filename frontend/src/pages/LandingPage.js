import React, { useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Menu,
  Wallet,
  Sparkles,
  Gift,
  Users,

  Zap,
  Lock,
  Network,
  BarChart3,
  ArrowRight,
  Mail,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import api from '@/utils/api';
import Logo from '@/components/Logo';
import LandingFooter from '@/components/LandingFooter';
import LandingHeader from '@/components/LandingHeader';
import FeaturesSection from '@/components/FeaturesSection';
import FeatureShowcaseSection from '@/components/FeatureShowcaseSection';
import LeadMagnetSection from '@/components/LeadMagnetSection';
import SolutionValueCard from '@/components/SolutionValueCard';
import AudienceSection from '@/components/AudienceSection';
import WaitlistSection from '@/components/WaitlistSection';
import WaitlistBanner from '@/components/WaitlistBanner';
import LiveInterestPopup from '@/components/LiveInterestPopup';
import WaitlistModal from '@/components/WaitlistModal';


const NAV_LINKS = [
  { label: 'Product', href: '#how-it-works' },
  { label: 'Rewards', href: '#how-it-works' },
  { label: 'Waitlist', href: '#waitlist' },
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
    path: '/app',
    variant: 'primary',
  },
];

const TRUST_ITEMS = [
  { icon: Zap, title: 'Instant rewards', text: 'Points credited automatically.' },
  { icon: Lock, title: 'Secure transactions', text: 'Your data stays protected.' },
  { icon: Network, title: 'Partner network', text: 'Shop at trusted brands.' },
  { icon: BarChart3, title: 'Smart analytics', text: 'Track and optimize rewards.' },
];

const FEATURES_GRID = [
  { icon: Zap, title: 'Instant' },
  { icon: Lock, title: 'Secure' },
  { icon: Network, title: 'Partners' },
  { icon: BarChart3, title: 'Analytics' },
  { icon: Wallet, title: 'Pay & earn' },
  { icon: Gift, title: 'Redeem' },
  { icon: Sparkles, title: 'Points' },
  { icon: Users, title: 'Rewards' },
];

const AUDIENCE_SEGMENTS_MAIN = [
  { icon: Wallet, title: 'Shoppers', description: 'Earn rewards on every purchase. Use your Lynkr email at partner brands; we credit points and you redeem for offers.' },
  { icon: Gift, title: 'Reward hunters', description: 'Turn points into coupons and exclusive offers from top brands. Redeem anytime, anywhere.' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [waitlistModalOpen, setWaitlistModalOpen] = React.useState(false);

  useEffect(() => {
    if (searchParams.get('openWaitlist') === '1') {
      setWaitlistModalOpen(true);
      searchParams.delete('openWaitlist');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  if (user?.role === 'USER') return <Navigate to="/app/home" replace />;
  if (user?.role === 'PARTNER') return <Navigate to="/app/partner" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/app/admin" replace />;

  const goTo = (path) => navigate(path);

  return (
    <div className="min-h-screen bg-background text-foreground min-w-0 overflow-x-hidden flex flex-col">
      <LandingHeader
        navLinks={NAV_LINKS}
        primaryCta={{ label: 'Sign up for free', path: '/app/signup' }}
        secondaryCta={{ label: 'Login', path: '/app/login' }}
      />

      <WaitlistBanner onOpenWaitlist={() => setWaitlistModalOpen(true)} />

      <main className="min-w-0 flex-1 flex flex-col landing-pad-x pb-[env(safe-area-inset-bottom)]">
      {/* Hero - Dico-style: two-column desktop, stacked mobile; gradient accent, clear CTAs */}
      <section
        className="landing-section landing-pad-x pt-[calc(5rem+env(safe-area-inset-top))] sm:pt-[calc(5.5rem+env(safe-area-inset-top))] md:pt-[calc(6rem+env(safe-area-inset-top))] pb-10 sm:pb-14 md:pb-20 relative overflow-hidden"
        aria-labelledby="hero-heading"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[60%] max-w-md h-[70%] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-[50%] max-w-sm h-[50%] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-8 lg:gap-12 xl:gap-16">
            {/* Left: content */}
            <div className="flex-1 text-center sm:text-left max-w-2xl mx-auto sm:mx-0 min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 mb-4 sm:mb-6">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Partner rewards network</span>
              </div>
              <h1 id="hero-heading" className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-6xl font-bold tracking-tight font-heading leading-tight mb-3 sm:mb-4">
                <span className="text-foreground">Turn everyday payments into </span>
                <span className="bg-gradient-to-r from-teal-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">rewards.</span>
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Use your Lynkr email when you shop. We detect purchases and credit points automatically. Redeem for coupons and offers.
              </p>
              <div className="btn-landing-row gap-2 sm:gap-4 max-w-sm mx-auto lg:mx-0 sm:max-w-none">
                <Button
                  data-testid="hero-get-started-button"
                  className="min-h-[44px] sm:min-h-[48px] rounded-full px-5 sm:px-8 text-sm sm:text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] touch-manipulation shadow-lg shadow-primary/25"
                  onClick={() => goTo('/app/signup')}
                >
                  Get started
                  <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                </Button>
                <a
                  href="#how-it-works"
                  className="min-h-[44px] sm:min-h-[48px] inline-flex items-center justify-center rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted touch-manipulation border border-transparent hover:border-border"
                >
                  How it works
                </a>
              </div>
            </div>
            {/* Right: floating visual — side-by-side from sm */}
            <div className="flex-1 relative mt-6 sm:mt-0 flex justify-center sm:justify-end min-h-[180px] sm:min-h-[260px] lg:min-h-[320px] min-w-0">
              <div className="relative w-full max-w-sm lg:max-w-md">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl bg-card/80 border border-border shadow-xl rotate-[-4deg] flex flex-col items-center justify-center p-4 gap-1">
                    <span className="text-2xl sm:text-3xl font-bold font-heading text-teal-400">+250</span>
                    <span className="text-xs text-muted-foreground">points earned</span>
                  </div>
                </div>
                <div className="absolute top-0 right-0 sm:right-4 w-32 sm:w-36 rounded-2xl bg-card/90 border border-border shadow-lg rotate-[6deg] p-3 text-left">
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Lynkr email</p>
                  <p className="text-sm font-medium truncate">you@lynkr.club</p>
                </div>
                <div className="absolute bottom-4 left-0 sm:left-4 w-28 sm:w-32 rounded-2xl bg-violet-500/20 border border-violet-500/30 shadow-lg rotate-[-6deg] p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Reward</p>
                  <p className="text-sm font-semibold text-violet-400">10% off</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features: two-column + icon grid */}
      <FeaturesSection
        id="features"
        tagline="Partner rewards network"
        headline="One email. Automatic rewards."
        highlightWord="Automatic rewards."
        description="Use your Lynkr email at partner brands. We detect purchases, credit points, and you redeem for coupons and offers—no extra steps."
        cta={{ label: 'How it works', onClick: () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) }}
        features={FEATURES_GRID}
        altBg
      />

      {/* Feature showcase: Email — two-column, mock right */}
      <FeatureShowcaseSection
        id="feature-email"
        tagline="Lynkr email"
        headline="One email for rewards."
        highlightWord="One email"
        description="No extra forms or codes. Use your @lynkr.club email at partner checkout. We read order confirmations and credit points—so you never miss a reward."
        ctaLabel="How it works"
        ctaOnClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
        altBg
      >
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <Mail className="h-4 w-4 text-teal-400" />
            </div>
            <span className="text-sm font-semibold text-foreground">Your Lynkr email</span>
          </div>
          <p className="text-sm font-medium text-teal-400 mb-2">you@lynkr.club</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Connected</span>
          </div>
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Order detected</span>
              <span className="text-teal-400 font-medium">+50 pts</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Order detected</span>
              <span className="text-teal-400 font-medium">+25 pts</span>
            </div>
          </div>
        </div>
      </FeatureShowcaseSection>

      {/* Feature showcase: Rewards — two-column, mock right */}
      <FeatureShowcaseSection
        id="feature-rewards"
        tagline="Earn & redeem"
        headline="Earn and redeem, automatically."
        highlightWord="automatically"
        description="Partner purchases are detected and points are credited to your account. Spend points on discounts and exclusive offers from the brands you already love."
        ctaLabel="Open App"
        ctaPath="/app"
        reverse
      >
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-foreground">Points balance</span>
          </div>
          <p className="text-2xl font-bold font-heading text-violet-400 mb-4">1,240</p>
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Coffee Co</span>
              <span className="text-violet-400 font-medium">+25 pts</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Redeemed • 10% off</span>
              <span className="text-muted-foreground">−100 pts</span>
            </div>
          </div>
        </div>
      </FeatureShowcaseSection>

      {/* Feature showcase: Spend analytics — two-column, mock right */}
      <FeatureShowcaseSection
        id="feature-analytics"
        tagline="Insights"
        headline="See where you earn."
        highlightWord="where you earn"
        description="View your purchase history and reward activity across partners. Understand how much you earn and where to redeem."
        ctaLabel="Open App"
        ctaPath="/app"
        altBg
      >
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-teal-400" />
            </div>
            <span className="text-sm font-semibold text-foreground">This month</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-xl bg-muted p-2">
              <p className="text-[10px] text-muted-foreground uppercase">Points earned</p>
              <p className="text-lg font-bold text-foreground">420</p>
            </div>
            <div className="rounded-xl bg-muted p-2">
              <p className="text-[10px] text-muted-foreground uppercase">Partners</p>
              <p className="text-lg font-bold text-foreground">3</p>
            </div>
          </div>
          <div className="h-12 rounded-xl bg-muted flex items-end gap-1 px-2 pb-1">
            {[40, 65, 45, 80, 55, 70].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-teal-500/40" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </FeatureShowcaseSection>

      {/* How it works — timeline/stepper (no boxy cards): vertical on mobile, horizontal connector on desktop */}
      <section id="how-it-works" className="scroll-mt-24 sm:scroll-mt-28 landing-section landing-pad-x bg-secondary/20" aria-labelledby="how-it-works-heading">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Simple steps</p>
          <h2 id="how-it-works-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-center mb-2 sm:mb-3">
            Here&apos;s how it works
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-8 sm:mb-10 max-w-xl mx-auto">
            Earn and redeem rewards with one email.
          </p>
          <div className="relative">
            {/* Desktop: horizontal connector line */}
            <div className="hidden md:block absolute top-5 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 via-violet-500/25 to-transparent" aria-hidden />
            <ul className="grid grid-cols-2 md:flex md:flex-row gap-3 sm:gap-4 md:gap-8">
              {STEPS.map((step, i) => {
                const useViolet = i === 1 || i === 3;
                return (
                <li
                  key={step.title}
                  data-testid={`step-${i + 1}`}
                  className="flex flex-col md:flex-1 relative"
                >
                  <div className="flex items-start gap-3 py-3 md:py-0 md:flex-col md:items-center md:text-center rounded-xl bg-card/50 border border-border p-3 md:bg-transparent md:border-0 md:p-0">
                    <div className="flex items-center gap-2 md:flex-col md:gap-2 shrink-0">
                      <span className={useViolet ? 'w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-violet-500/20 border-2 border-violet-500/50 flex items-center justify-center text-xs sm:text-sm font-bold text-violet-400 relative z-10' : 'w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-teal-500/20 border-2 border-teal-500/50 flex items-center justify-center text-xs sm:text-sm font-bold text-teal-400 relative z-10'}>
                        {i + 1}
                      </span>
                      <div className={useViolet ? 'w-9 h-9 sm:w-10 md:w-12 md:h-12 rounded-full bg-violet-500/10 flex items-center justify-center md:mt-1 shrink-0' : 'w-9 h-9 sm:w-10 md:w-12 md:h-12 rounded-full bg-teal-500/10 flex items-center justify-center md:mt-1 shrink-0'}>
                        <step.icon className={useViolet ? 'h-4 w-4 sm:h-5 md:h-6 md:w-6 text-violet-400' : 'h-4 w-4 sm:h-5 md:h-6 md:w-6 text-teal-400'} />
                      </div>
                    </div>
                    <div className="min-w-0 md:mt-3">
                      <h3 className="font-semibold font-heading text-foreground text-sm sm:text-lg">{step.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 leading-relaxed line-clamp-2 md:line-clamp-none">{step.text}</p>
                    </div>
                  </div>
                </li>
              );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Choose your portal — two equal columns; aligned on desktop, 2-col grid on mobile */}
      <section id="portals" className="landing-section landing-pad-x bg-teal-500/5" aria-labelledby="portals-heading">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Get started</p>
          <h2 id="portals-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-center mb-2 sm:mb-3">
            Choose your portal
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-8 max-w-xl mx-auto">
            Open the app to start earning and redeeming rewards.
          </p>
          <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
            <Button
              className="w-full min-h-[44px] sm:min-h-[52px] rounded-xl font-semibold touch-manipulation active:scale-[0.98] text-sm sm:text-base inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={() => goTo('/app')}
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              Open App
            </Button>
            <p className="text-xs text-muted-foreground">Earn rewards and redeem points.</p>
          </div>
        </div>
      </section>

      {/* What we provide: value card + benefits */}
      <SolutionValueCard
        tag="Rewards"
        headline="Turn payments into rewards."
        body="Use your Lynkr email at partner brands. We detect purchases and credit points automatically. Redeem for coupons and offers—no extra steps."
        cta={{ label: 'Get started', path: '/app/signup' }}
      />
      {/* What we provide — grid layout: 2x2 mobile, 1x4 desktop, aligned */}
      <section className="landing-section landing-pad-x bg-violet-500/5" aria-labelledby="what-we-provide-heading">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Benefits</p>
          <h2 id="what-we-provide-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-center mb-2 sm:mb-3">
            What we provide
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-8 max-w-xl mx-auto">
            One email, automatic rewards. Here&apos;s what you get with Lynkr:
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-8">
            {TRUST_ITEMS.map((item, i) => {
              const useViolet = i === 1 || i === 3;
              return (
              <div key={item.title} className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-center text-center sm:text-left lg:text-center gap-2 sm:gap-3 min-w-0 rounded-xl border border-border bg-card/30 p-3 sm:p-0 sm:border-0 sm:bg-transparent">
                <div className={useViolet ? 'w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0' : 'w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0'}>
                  <item.icon className={useViolet ? 'h-4 w-4 sm:h-5 sm:w-5 text-violet-400' : 'h-4 w-4 sm:h-5 sm:w-5 text-teal-400'} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-xs sm:text-base">{item.title}</h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">{item.text}</p>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* Audience: who uses Lynkr — split layout (no boxy cards): two columns with divider */}
      <AudienceSection
        id="audience"
        variant="split"
        title="Two ways to use Lynkr"
        subtitle="Shoppers earn and redeem. Partners grow loyalty and revenue."
        segments={AUDIENCE_SEGMENTS_MAIN}
        ctaLabel="How it works"
        ctaOnClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
        altBg
      />

      {/* Early access waitlist */}
      <WaitlistSection
        id="waitlist"
        altBg
        onJoined={() => {
          try { localStorage.setItem('lynkr_waitlist_banner_seen', '1'); } catch {}
        }}
      />

      {/* Lead magnet: user guide */}
      <LeadMagnetSection
        id="user-guide"
        title="Get our FREE Lynkr Quick Start Guide"
        highlight="FREE"
        description="Learn how to shop with your Lynkr email, earn points, and redeem rewards in minutes."
        ctaLabel="Get the guide"
        coverTitle="Lynkr Quick Start"
        onSubmit={async (email) => {
          try {
            const res = await api.post('/leads', { email, source: 'landing' });
            if (!res?.data?.success) throw new Error(res?.data?.detail || 'Failed to submit');
          } catch (err) {
            const d = err.response?.data?.detail;
            const msg = (Array.isArray(d) ? d[0] : d) || err.message || 'Something went wrong. Please try again.';
            toast.error(msg);
            throw err;
          }
        }}
      />

      <section className="landing-section landing-pad-x border-t border-border" aria-labelledby="contact-heading">
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="contact-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading mb-2 sm:mb-3">Contact Us</h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-6">Reach out for onboarding, demos, or support.</p>
          <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-6 text-sm sm:text-base">
            <a href="tel:+919839662626" className="font-semibold text-teal-400 hover:text-teal-300 hover:underline min-h-[48px] inline-flex items-center justify-center touch-manipulation px-2 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50">
              +91 9839662626
            </a>
            <a href="tel:+918199040184" className="font-semibold text-teal-400 hover:text-teal-300 hover:underline min-h-[48px] inline-flex items-center justify-center touch-manipulation px-2 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50">
              +91 8199040184
            </a>
            <a href="mailto:admin@lynkr.club" className="font-semibold text-violet-400 hover:text-violet-300 hover:underline min-h-[48px] inline-flex items-center justify-center touch-manipulation px-2 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50">
              admin@lynkr.club
            </a>
          </div>
        </div>
      </section>

      <LandingFooter />
      </main>

      <LiveInterestPopup onOpenWaitlist={() => setWaitlistModalOpen(true)} />
      <WaitlistModal
        open={waitlistModalOpen}
        onOpenChange={setWaitlistModalOpen}
      />
      {/* Persistent floating CTA to reopen waitlist (left side so live popup stays right) */}
      <button
        type="button"
        onClick={() => setWaitlistModalOpen(true)}
        className="fixed bottom-5 left-5 z-[90] min-h-[48px] min-w-[48px] sm:min-h-[52px] sm:min-w-auto sm:pl-5 sm:pr-5 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 touch-manipulation active:scale-95 transition-transform"
        style={{ marginLeft: 'max(0.5rem, env(safe-area-inset-left))' }}
        aria-label="Join waitlist"
      >
        <Sparkles className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
        <span className="hidden sm:inline">Early Access</span>
      </button>
    </div>
  );
};

export default LandingPage;
