import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Building2,
  ArrowRight,
  Presentation,
  Rocket,
  LayoutDashboard,
  WandSparkles,
  Link2,
  Receipt,
  Gift,
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  Shield,
  PieChart,
  Megaphone,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/utils/api';

const PARTNER_STEPS = [
  { icon: Link2, title: 'Integrate with Lynkr', text: 'Connect your business in minutes with our simple onboarding.' },
  { icon: Receipt, title: 'Accept transactions', text: 'Lynkr users shop with their rewards email; orders flow to you.' },
  { icon: Gift, title: 'Customers earn rewards', text: 'Acknowledge orders and points are credited automatically.' },
  { icon: BarChart3, title: 'Track engagement & analytics', text: 'Use the Growth Dashboard to see revenue and loyalty metrics.' },
];

const BENEFITS = [
  { icon: Users, title: 'Customer loyalty growth', text: 'Drive repeat purchases with rewards.' },
  { icon: Zap, title: 'Real-time analytics', text: 'See performance as it happens.' },
  { icon: Gift, title: 'Automated reward system', text: 'No manual point tracking.' },
  { icon: TrendingUp, title: 'Increased retention', text: 'Keep customers coming back.' },
  { icon: Shield, title: 'Data-driven insights', text: 'Understand what drives sales.' },
];

const FEATURE_PREVIEW = [
  { icon: Receipt, title: 'Transaction dashboard', text: 'View and acknowledge every order.' },
  { icon: Gift, title: 'Reward management', text: 'Create and manage offers.' },
  { icon: BarChart3, title: 'Customer engagement analytics', text: 'Track loyalty and redemptions.' },
  { icon: PieChart, title: 'Redemption tracking', text: 'See which rewards convert.' },
  { icon: Megaphone, title: 'Campaign management', text: 'Run promotions and bonus points.' },
];

const PartnerLanding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [partners, setPartners] = useState([]);

  if (user?.role === 'USER') return <Navigate to="/app/dashboard" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'PARTNER') return <Navigate to="/partner/dashboard" replace />;

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await api.get('/partners/active');
        setPartners(response.data || []);
      } catch (_) {
        setPartners([]);
      }
    };
    fetchPartners();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header>
        <nav
          className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/5 pt-[env(safe-area-inset-top)]"
          aria-label="Partner navigation"
        >
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-2 min-h-[52px] sm:min-h-0">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] -ml-1 rounded-lg active:opacity-80"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">Back to Lynkr</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <Button
                variant="ghost"
                className="rounded-xl min-h-[44px] px-3 sm:px-4 text-sm sm:text-base"
                onClick={() => navigate('/partner/login')}
              >
                Login
              </Button>
              <Button
                data-testid="partner-signup-button"
                className="rounded-xl min-h-[44px] px-3 sm:px-4 text-sm sm:text-base bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => window.location.href = 'mailto:partners@lynkr.club?subject=Become a Partner'}
              >
                Become Partner
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <main className="min-w-0">
      {/* Hero */}
      <section
        className="pt-[calc(6rem+env(safe-area-inset-top))] pb-10 sm:pt-28 sm:pb-12 md:pb-24 px-4 sm:px-6"
        aria-labelledby="partner-hero-heading"
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
            For businesses
          </div>
          <h1 id="partner-hero-heading" className="text-xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-foreground leading-tight mb-3 sm:mb-4 px-1">
            Turn customer payments into loyalty rewards.
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground mb-6 sm:mb-10 max-w-xl mx-auto leading-relaxed sm:leading-7">
            Lynkr helps you grow through rewards and customer engagement. Connect once, acknowledge orders, and watch revenue from Lynkr users and repeat customers grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              data-testid="hero-partner-login"
              className="w-full sm:w-auto min-h-[48px] sm:min-h-12 rounded-xl px-6 sm:px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation"
              onClick={() => navigate('/partner/login')}
            >
              Partner Login
              <ArrowRight className="ml-2 w-5 h-5 shrink-0" />
            </Button>
            <Button
              data-testid="become-partner-button"
              variant="outline"
              className="w-full sm:w-auto min-h-[48px] sm:min-h-12 rounded-xl px-6 sm:px-8 text-base font-medium border-white/15 bg-white/5 hover:bg-white/10 touch-manipulation"
              onClick={() => window.location.href = 'mailto:partners@lynkr.club?subject=Become a Partner'}
            >
              Become a Partner
            </Button>
          </div>
        </div>
      </section>

      {/* Partner resources (public) */}
      <section className="py-12 md:py-16 px-4 sm:px-6 bg-secondary/20" aria-labelledby="partner-resources-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="partner-resources-heading" className="text-2xl md:text-3xl font-bold font-heading text-center mb-3">
            Partner resources
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Explore interactive Lynkr demos before onboarding.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="w-full min-h-12 rounded-xl border-white/15 bg-white/5 hover:bg-white/10"
              onClick={() => window.location.assign('/partner-pitch')}
            >
              <Presentation className="w-4 h-4 mr-2" />
              Pitch Deck
            </Button>
            <Button
              className="w-full min-h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => window.location.assign('/partner-demo')}
            >
              <Rocket className="w-4 h-4 mr-2" />
              Demo Mode
            </Button>
            <Button
              className="w-full min-h-12 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#14B8A6] text-white hover:opacity-90"
              onClick={() => window.location.assign('/partner-demo-experience')}
            >
              <WandSparkles className="w-4 h-4 mr-2" />
              Demo Experience
            </Button>
            <Button
              className="w-full min-h-12 rounded-xl bg-[#14B8A6] hover:bg-[#0fa390] text-black font-semibold"
              onClick={() => window.location.assign('/partner-demo-dashboard')}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Demo Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-12 md:py-16 px-4 sm:px-6 bg-secondary/20" aria-labelledby="partner-how-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="partner-how-heading" className="text-2xl md:text-3xl font-bold font-heading text-center mb-8">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {PARTNER_STEPS.map((step, i) => (
              <div
                key={step.title}
                className={cn(
                  'bg-card rounded-2xl border border-white/5 p-5 md:p-6 shadow-sm'
                )}
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

      {/* Partner benefits */}
      <section className="py-12 md:py-16 px-4 sm:px-6" aria-labelledby="partner-benefits-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="partner-benefits-heading" className="text-2xl md:text-3xl font-bold font-heading text-center mb-8">
            Partner benefits
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="bg-card rounded-2xl border border-white/5 p-5 md:p-6 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Growth Dashboard (core selling point) */}
      <section className="py-10 sm:py-12 md:py-16 px-4 sm:px-6 bg-primary/5" aria-labelledby="growth-dashboard-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="growth-dashboard-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-center mb-2">
            Partner Growth Dashboard
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-6 sm:mb-10 max-w-2xl mx-auto px-1">
            See how Lynkr drives revenue and customer loyalty for your business.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10">
            <div className="bg-card rounded-2xl border border-white/5 p-4 sm:p-5 md:p-6 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Revenue from Lynkr users</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-primary">₹XX,XXX</p>
              <p className="text-xs text-muted-foreground mt-1">this month</p>
            </div>
            <div className="bg-card rounded-2xl border border-white/5 p-4 sm:p-5 md:p-6 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Repeat customers</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-primary">XX%</p>
              <p className="text-xs text-muted-foreground mt-1">returning customers</p>
            </div>
            <div className="bg-card rounded-2xl border border-white/5 p-4 sm:p-5 md:p-6 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Reward-driven sales</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-primary">XX%</p>
              <p className="text-xs text-muted-foreground mt-1">of sales from rewards</p>
            </div>
          </div>
          <div className="text-center">
            <Button
              className="w-full sm:w-auto min-h-[48px] sm:min-h-12 rounded-xl px-6 sm:px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold touch-manipulation"
              onClick={() => navigate('/partner/login')}
            >
              View Partner Dashboard
              <ArrowRight className="ml-2 w-5 h-5 shrink-0" />
            </Button>
          </div>
        </div>
      </section>

      {/* Feature preview */}
      <section className="py-10 sm:py-12 md:py-16 px-4 sm:px-6" aria-labelledby="dashboard-features-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="dashboard-features-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-center mb-6 sm:mb-8">
            What you get in the dashboard
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {FEATURE_PREVIEW.map((f) => (
              <div
                key={f.title}
                className="bg-card rounded-2xl border border-white/5 p-4 sm:p-5 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="py-10 sm:py-12 md:py-16 px-4 sm:px-6 bg-secondary/20" aria-labelledby="partner-cta-heading">
        <div className="max-w-2xl mx-auto text-center">
          <h2 id="partner-cta-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading mb-3 sm:mb-4 px-1">
            Ready to grow with Lynkr?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-1">
            Join as a partner and get access to the Growth Dashboard, transaction tools, and customer insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center">
            <Button
              data-testid="cta-partner-button"
              className="w-full sm:w-auto min-h-[48px] sm:min-h-12 rounded-xl px-6 sm:px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold touch-manipulation"
              onClick={() => window.location.href = 'mailto:partners@lynkr.club?subject=Become a Partner'}
            >
              Become a Partner
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto min-h-[48px] sm:min-h-12 rounded-xl px-6 sm:px-8 border-white/15 touch-manipulation"
              onClick={() => window.location.href = 'mailto:partners@lynkr.club?subject=Request Demo'}
            >
              Request Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Registered partners (optional) */}
      {partners.length > 0 && (
        <section className="py-10 sm:py-12 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-center mb-4 sm:mb-6">Our partners</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {partners.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-white/5 bg-card/70 p-3 sm:p-4 text-center min-h-[60px] flex flex-col justify-center"
                >
                  <p className="font-semibold text-xs sm:text-sm truncate">{p.business_name}</p>
                  {p.category && <p className="text-xs text-muted-foreground truncate mt-0.5">{p.category}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-10 sm:py-12 px-4 sm:px-6 border-t border-white/5" aria-labelledby="contact-heading">
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="contact-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading mb-2 sm:mb-3">
            Contact Us
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Reach out for partner onboarding, demos, or support.</p>
          <div className="space-y-3 sm:space-y-2 text-sm md:text-base">
            <p>
              <a href="tel:+919839662626" className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1 py-2 inline-block min-h-[44px] leading-normal touch-manipulation">
                +91 9839662626
              </a>
              <span className="text-muted-foreground"> — Tanish</span>
            </p>
            <p>
              <a href="tel:+918199040184" className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1 py-2 inline-block min-h-[44px] leading-normal touch-manipulation">
                +91 8199040184
              </a>
              <span className="text-muted-foreground"> — Vaidant</span>
            </p>
            <p>
              <a href="mailto:admin@lynkr.club" className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1 py-2 inline-block min-h-[44px] leading-normal touch-manipulation">
                admin@lynkr.club
              </a>
            </p>
          </div>
        </div>
      </section>

      <footer className="py-6 sm:py-8 px-4 border-t border-white/5 text-center text-sm text-muted-foreground pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p>
          <a href="mailto:partners@lynkr.club" className="text-primary hover:underline min-h-[44px] inline-flex items-center justify-center touch-manipulation">partners@lynkr.club</a>
        </p>
        <p className="mt-2">
          <a href="/" className="hover:text-foreground underline min-h-[44px] inline-flex items-center justify-center touch-manipulation">Lynkr home</a>
          {' · '}
          <span>&copy; {new Date().getFullYear()} Lynkr.club</span>
        </p>
      </footer>
      </main>
    </div>
  );
};

export default PartnerLanding;
