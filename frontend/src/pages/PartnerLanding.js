import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TrendingDown,
  Users,
  UserPlus,
  Zap,
  Shield,
  PieChart,
  Megaphone,
  RefreshCw,
  Check,
  Package,
  Share2,
  Image as ImageIcon,
  ListOrdered,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/utils/api';
import LandingFooter from '@/components/LandingFooter';
import LandingHeader from '@/components/LandingHeader';
import FeaturesSection from '@/components/FeaturesSection';
import LeadMagnetSection from '@/components/LeadMagnetSection';
import PartnerDashboardPreview from '@/components/PartnerDashboardPreview';
import AudienceSection from '@/components/AudienceSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const PARTNER_STEPS = [
  { icon: Link2, title: 'Integrate with Lynkr', text: 'Connect your business in minutes with our simple onboarding.' },
  { icon: Receipt, title: 'Accept transactions', text: 'Lynkr users shop with their rewards email; orders flow to you.' },
  { icon: Gift, title: 'Customers earn rewards', text: 'Acknowledge orders and points are credited automatically.' },
  { icon: BarChart3, title: 'Track engagement & analytics', text: 'Use the Growth Dashboard to see revenue and loyalty metrics.' },
];

const CATALOG_STEPS = [
  { icon: ListOrdered, title: 'Create your catalog', text: 'Inside the partner dashboard, open Catalog and add your first product.' },
  { icon: ImageIcon, title: 'Add products and images', text: 'Add product name, description, price, category, and image links.' },
  { icon: Share2, title: 'Share your catalog link', text: 'Copy your unique link and share it with customers on WhatsApp or social media.' },
  { icon: MessageCircle, title: 'Customers order via WhatsApp', text: 'Customers browse your catalog and place orders easily through WhatsApp.' },
];

const FEATURE_PREVIEW = [
  { icon: Receipt, title: 'Transaction dashboard', text: 'View and acknowledge every order.' },
  { icon: Gift, title: 'Reward management', text: 'Create and manage offers.' },
  { icon: BarChart3, title: 'Customer engagement analytics', text: 'Track loyalty and redemptions.' },
  { icon: PieChart, title: 'Redemption tracking', text: 'See which rewards convert.' },
  { icon: Megaphone, title: 'Campaign management', text: 'Run promotions and bonus points.' },
];

const PARTNER_FEATURES_GRID = [
  { icon: Receipt, title: 'Transactions' },
  { icon: Gift, title: 'Rewards' },
  { icon: BarChart3, title: 'Analytics' },
  { icon: PieChart, title: 'Redemptions' },
  { icon: Megaphone, title: 'Campaigns' },
  { icon: Users, title: 'Loyalty' },
  { icon: Zap, title: 'Real-time' },
  { icon: TrendingUp, title: 'Retention' },
  { icon: Shield, title: 'Insights' },
];

const PARTNER_MAIN_FEATURES = [
  { icon: UserPlus, title: 'Leads', tagline: 'Real customers with verified purchases.', text: 'Reach Lynkr users who shop with rewards. Every transaction is a qualified lead—no cold traffic, no guesswork.' },
  { icon: TrendingDown, title: 'CAC reduction', tagline: 'Pay for performance, not clicks.', text: 'Lower cost per acquisition. Reward-driven customers convert without expensive funnels.' },
  { icon: RefreshCw, title: 'Customer retention', tagline: 'Turn one-time buyers into repeat shoppers.', text: 'Keep customers coming back with points and offers they care about.' },
  { icon: LayoutDashboard, title: 'Growth dashboards', tagline: 'Revenue, orders, and loyalty in one place.', text: 'See Lynkr-driven sales, repeat rates, and reward redemptions in real time.' },
  { icon: BarChart3, title: 'Analytics', tagline: 'Data you can act on.', text: 'Track which rewards drive sales, which segments redeem most, and how loyalty correlates with revenue.' },
];

const AUDIENCE_SEGMENTS_PARTNER = [
  { icon: Rocket, title: 'Startups', tagline: 'As a small team, time is your biggest asset.', description: 'Get live quickly with simple onboarding and one dashboard for orders and rewards. No heavy setup—focus on growth.' },
  { icon: TrendingUp, title: 'Growing brands', tagline: 'Loyalty and repeat revenue matter most.', description: 'Use Lynkr to reward customers and see which offers convert. Scale your program without extra dev work.' },
  { icon: Building2, title: 'Enterprises', tagline: 'Research and data get you ahead of the game.', description: 'Data and control at scale. Align teams on one platform: transactions, rewards, and analytics in one place.' },
];

const PartnerLanding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [partners, setPartners] = useState([]);
  const [catalogPreviewOpen, setCatalogPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await api.get('/partners/public');
        setPartners(response.data || []);
      } catch (_) {
        setPartners([]);
      }
    };
    fetchPartners();
  }, []);

  const scrollToDemoSection = () => {
    const el = document.getElementById('demo-dashboard-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col">
      <LandingHeader
        ariaLabel="Partner navigation"
        navLinks={[]}
        showBackInsteadOfLogo
        backTo="/"
        primaryCta={{ label: 'Become Partner', onClick: () => { window.location.href = 'mailto:partners@lynkr.club?subject=Become a Partner'; } }}
        secondaryCta={{ label: 'Login', path: '/app/partner/login' }}
        primaryCtaTestId="partner-signup-button"
      />

      <main className="min-w-0 flex-1 flex flex-col landing-pad-x pb-[env(safe-area-inset-bottom)]">
      {/* Hero: headline + CTAs + dashboard preview */}
      <section
        className="landing-section pt-[calc(5rem+env(safe-area-inset-top))] sm:pt-[calc(5.5rem+env(safe-area-inset-top))] md:pt-[calc(6rem+env(safe-area-inset-top))] pb-10 sm:pb-12 md:pb-16"
        aria-labelledby="partner-hero-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12 md:mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400 shrink-0" />
              For businesses
            </div>
            <h1 id="partner-hero-heading" className="text-xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-foreground leading-tight mb-3 sm:mb-4 px-1">
              Turn customer payments into loyalty rewards.
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground mb-6 sm:mb-10 max-w-xl mx-auto leading-relaxed sm:leading-7">
              Lynkr helps you grow through rewards and customer engagement. Connect once, acknowledge orders, and watch revenue from Lynkr users and repeat customers grow.
            </p>
            <div className="btn-landing-row gap-2 sm:gap-4">
              <Button
                data-testid="hero-partner-login"
                className="min-h-[44px] sm:min-h-[48px] rounded-xl px-5 sm:px-8 text-sm sm:text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation shadow-lg shadow-primary/25"
                onClick={() => navigate('/app/partner/login')}
              >
                Partner Login
                <ArrowRight className="ml-1.5 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </Button>
              <Button
                data-testid="become-partner-button"
                className="min-h-[44px] sm:min-h-[48px] rounded-xl px-5 sm:px-8 text-sm sm:text-base font-semibold bg-teal-600 text-white hover:bg-teal-700 border border-teal-500/50 touch-manipulation shadow-md"
                onClick={() => window.location.href = 'mailto:partners@lynkr.club?subject=Become a Partner'}
              >
                Become a Partner
              </Button>
            </div>
          </div>
          {/* Dashboard preview: how it will look (scroll target for "preview above") */}
          <div id="dashboard-preview" className="px-0 sm:px-4 scroll-mt-24 sm:scroll-mt-28">
            <p className="text-center text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Your Growth Dashboard — transactions, orders, and analytics in one place
            </p>
            <PartnerDashboardPreview className="ring-1 ring-border" />
            <div className="mt-3 sm:mt-4 flex justify-center">
              <Button
                variant="outline"
                className="min-h-[44px] sm:min-h-[48px] px-4 rounded-xl border-violet-500/40 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/50 text-sm font-medium touch-manipulation"
                onClick={() => window.location.assign('/partner-demo-dashboard')}
              >
                Try demo dashboard →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features: two-column + icon grid */}
      <FeaturesSection
        id="partner-features"
        tagline="For businesses"
        headline="Everything you need to grow loyalty."
        highlightWord="grow loyalty."
        description="Integrate once, accept Lynkr transactions, and use the Growth Dashboard for orders, rewards, and analytics."
        cta={{ label: 'See dashboard', onClick: scrollToDemoSection }}
        features={PARTNER_FEATURES_GRID}
        altBg
      />

      {/* Partner resources — refined like other sections */}
      <section id="partner-resources" className="landing-section landing-pad-x bg-secondary/20" aria-labelledby="partner-resources-heading">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Explore</p>
          <h2 id="partner-resources-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-center mb-2 sm:mb-3">
            Partner resources
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto">
            Explore interactive Lynkr demos and materials before onboarding.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 min-w-0">
            <div
              className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-6 shadow-sm flex flex-col min-w-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-teal-500/15 flex items-center justify-center mb-2 sm:mb-3 shrink-0">
                <Presentation className="h-4 w-4 sm:h-5 sm:w-5 text-teal-400" />
              </div>
              <h3 className="font-semibold font-heading text-foreground mb-0.5 sm:mb-1 text-sm sm:text-base">Pitch Deck</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">Present Lynkr to your team or stakeholders.</p>
              <Button
                variant="outline"
                className="w-full min-h-[44px] sm:min-h-[48px] rounded-xl border-border bg-muted text-foreground hover:bg-muted touch-manipulation font-medium"
                onClick={() => window.location.assign('/partner-pitch')}
              >
                Open
              </Button>
            </div>
            <div
              className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-6 shadow-sm flex flex-col min-w-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-violet-500/15 flex items-center justify-center mb-2 sm:mb-3 shrink-0">
                <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />
              </div>
              <h3 className="font-semibold font-heading text-foreground mb-0.5 sm:mb-1 text-sm sm:text-base">Demo Mode</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">Walk through the partner flow step by step.</p>
              <Button
                className="w-full min-h-[44px] sm:min-h-[48px] rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation font-semibold shadow-md"
                onClick={scrollToDemoSection}
              >
                See dashboard
              </Button>
            </div>
            <div
              className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-6 shadow-sm flex flex-col min-w-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-fuchsia-500/15 flex items-center justify-center mb-2 sm:mb-3 shrink-0">
                <WandSparkles className="h-4 w-4 sm:h-5 sm:w-5 text-fuchsia-400" />
              </div>
              <h3 className="font-semibold font-heading text-foreground mb-0.5 sm:mb-1 text-sm sm:text-base">Demo Experience</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">Interactive product experience and flows.</p>
              <Button
                className="w-full min-h-[44px] sm:min-h-[48px] rounded-xl bg-teal-600 text-white hover:bg-teal-700 border border-teal-500/50 touch-manipulation font-semibold shadow-md"
                onClick={() => window.location.assign('/partner-demo-experience')}
              >
                Try experience
              </Button>
            </div>
            <div
              className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-6 shadow-sm flex flex-col min-w-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-teal-500/15 flex items-center justify-center mb-2 sm:mb-3 shrink-0">
                <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-teal-400" />
              </div>
              <h3 className="font-semibold font-heading text-foreground mb-0.5 sm:mb-1 text-sm sm:text-base">Demo Dashboard</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 flex-1 line-clamp-2 sm:line-clamp-none">See the Growth Dashboard with sample data.</p>
              <Button
                className="w-full min-h-[44px] sm:min-h-[48px] rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation font-semibold shadow-md"
                onClick={scrollToDemoSection}
              >
                See dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Create Your Own Product Catalog */}
      <section id="catalog-feature" className="landing-section landing-pad-x bg-teal-500/5" aria-labelledby="catalog-heading">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-violet-400" />
            </div>
            <h2 id="catalog-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-foreground mb-2">
              Create Your Own Product Catalog
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Build a simple storefront inside Lynkr. Add products with images and pricing, then share one link with customers. They browse your catalog and order directly through WhatsApp or social media—no separate e‑commerce site required.
            </p>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <li className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-5 shadow-sm text-center">
              <Package className="w-8 h-8 text-teal-400 mx-auto mb-2" />
              <span className="font-semibold text-foreground text-sm sm:text-base">Create product catalogs</span>
            </li>
            <li className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-5 shadow-sm text-center">
              <ImageIcon className="w-8 h-8 text-violet-400 mx-auto mb-2" />
              <span className="font-semibold text-foreground text-sm sm:text-base">Showcase items visually</span>
            </li>
            <li className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-5 shadow-sm text-center">
              <Share2 className="w-8 h-8 text-fuchsia-400 mx-auto mb-2" />
              <span className="font-semibold text-foreground text-sm sm:text-base">Share catalog links</span>
            </li>
            <li className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-5 shadow-sm text-center">
              <MessageCircle className="w-8 h-8 text-teal-400 mx-auto mb-2" />
              <span className="font-semibold text-foreground text-sm sm:text-base">Sell via WhatsApp & social</span>
            </li>
          </ul>
          <div className="text-center mt-6 sm:mt-8">
            <Button
              className="min-h-[44px] sm:min-h-[48px] rounded-xl px-5 sm:px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold touch-manipulation shadow-md"
              onClick={scrollToDemoSection}
            >
              Open in Dashboard
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            </Button>
          </div>

          {/* Catalog preview: collapsible — "View catalog look" toggles related products */}
          <div className="mt-12 sm:mt-16">
            <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
            <h3 className="text-lg sm:text-xl font-bold font-heading text-center mb-1 text-foreground">
              What your catalog can look like
            </h3>
            <p className="text-center text-sm text-muted-foreground mb-4 max-w-xl mx-auto">
              Create and list your products in a clean, shoppable view. Customers see a simple storefront; you manage everything from the dashboard.
            </p>
            <div className="flex justify-center mb-4">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'min-h-[44px] sm:min-h-[52px] rounded-xl px-5 sm:px-8 text-sm sm:text-base font-semibold touch-manipulation shadow-md',
                  catalogPreviewOpen
                    ? 'border-border bg-muted text-muted-foreground hover:bg-muted hover:text-foreground'
                    : 'border-emerald-500/60 bg-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-400/70 shadow-lg'
                )}
                onClick={() => setCatalogPreviewOpen((v) => !v)}
                aria-expanded={catalogPreviewOpen}
                aria-label={catalogPreviewOpen ? 'Hide catalog preview' : 'View catalog preview'}
              >
                {catalogPreviewOpen ? (
                  <>
                    Hide catalog look
                    <ChevronUp className="ml-2.5 w-5 h-5 shrink-0" aria-hidden />
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2.5 w-5 h-5 shrink-0" aria-hidden />
                    View catalog look
                    <ChevronDown className="ml-2.5 w-5 h-5 shrink-0" aria-hidden />
                  </>
                )}
              </Button>
            </div>
            {catalogPreviewOpen && (
              <div className="rounded-2xl sm:rounded-3xl border border-border bg-card/80 shadow-xl overflow-hidden max-w-4xl mx-auto animate-in fade-in-50 duration-200">
                {/* Section header: Related products + category tabs */}
                <div className="p-4 sm:p-5 border-b border-border">
                  <h4 className="text-sm sm:text-base font-semibold text-foreground mb-3">Related products</h4>
                  <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar snap-x snap-mandatory -mx-1">
                    {['All', 'New', 'Bestsellers', 'Sale'].map((cat, i) => (
                      <button
                        key={cat}
                        type="button"
                        className={cn(
                          'flex-shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[44px] touch-manipulation',
                          i === 0
                            ? 'bg-teal-600 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Showing 6 products</p>
                </div>
                {/* Related products grid with images — 2 cols mobile, 3 cols desktop */}
                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {[
                      { name: 'Classic Tee', category: 'Apparel', price: '₹1,299', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop' },
                      { name: 'Leather Bag', category: 'Accessories', price: '₹3,499', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop' },
                      { name: 'Wireless Earbuds', category: 'Electronics', price: '₹2,199', image: 'https://images.unsplash.com/photo-1598331668826-20cecc596b86?w=400&h=400&fit=crop' },
                      { name: 'Ceramic Mug', category: 'Home', price: '₹449', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop' },
                      { name: 'Skincare Set', category: 'Beauty', price: '₹1,899', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop' },
                      { name: 'Notebook Pack', category: 'Stationery', price: '₹599', image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=400&fit=crop' },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="rounded-xl sm:rounded-2xl border border-border bg-background/50 overflow-hidden shadow-sm flex flex-col"
                      >
                        <div className="aspect-square bg-muted/30 relative overflow-hidden">
                          <img
                            src={item.image}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
                          <span className="text-xs font-medium text-teal-400 uppercase tracking-wide">{item.category}</span>
                          <h4 className="font-semibold text-foreground text-sm sm:text-base mt-0.5 truncate">{item.name}</h4>
                          <p className="text-sm font-bold text-teal-400 mt-auto pt-2">{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    Add your own images, prices & WhatsApp order links — share one link with customers.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How Catalog Works — step-by-step */}
      <section id="how-catalog-works" className="landing-section landing-pad-x bg-secondary/20" aria-labelledby="how-catalog-heading">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Simple steps</p>
          <h2 id="how-catalog-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-center mb-2 sm:mb-3">
            How Catalog Works
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto">
            From creating your catalog to receiving orders in four steps.
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 md:overflow-visible md:grid md:grid-cols-4 md:gap-6 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
            {CATALOG_STEPS.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.title}
                  className={cn(
                    'flex-shrink-0 w-[min(260px,80vw)] md:w-auto bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm snap-start'
                  )}
                >
                  <div className="flex items-center gap-3 mb-3 md:mb-4">
                    <span className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-sm font-bold text-teal-400 shrink-0">
                      {i + 1}
                    </span>
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
                      <StepIcon className="h-5 w-5 md:h-6 md:w-6 text-teal-400" />
                    </div>
                  </div>
                  <h3 className="font-semibold font-heading text-foreground mb-2 text-base md:text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <Button
              className="min-h-[44px] sm:min-h-[48px] rounded-xl px-5 sm:px-6 bg-teal-600 text-white hover:bg-teal-700 border border-teal-500/50 font-semibold touch-manipulation shadow-md"
              onClick={scrollToDemoSection}
            >
              View dashboard
              <ArrowRight className="ml-2 w-4 h-4 shrink-0" />
            </Button>
          </div>
        </div>
      </section>

      {/* Partner main features: hero intro + accordion (desktop: accordion left, visual right) — Owell-inspired */}
      <section id="partner-main-features" className="landing-section landing-pad-x bg-violet-500/5" aria-labelledby="partner-main-features-heading">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">What you get</p>
          <h2 id="partner-main-features-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-center mb-2 text-foreground">
            Simple ways to grow with Lynkr
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-6 max-w-xl mx-auto">
            Real-time metrics, export reports, and one Growth Dashboard. Everything you need in one place.
          </p>
          <div className="btn-landing-row gap-2 sm:gap-4 mb-6 sm:mb-8">
            <Button
              className="min-h-[44px] sm:min-h-[48px] rounded-xl px-5 sm:px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold touch-manipulation shadow-md"
              onClick={scrollToDemoSection}
            >
              See dashboard
              <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
            </Button>
            <Button
              variant="outline"
              className="min-h-[44px] sm:min-h-[48px] rounded-xl px-5 sm:px-6 border-border bg-muted text-foreground hover:bg-muted font-medium touch-manipulation"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              How it works
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-6 lg:gap-8">
            <div className="flex-1 min-w-0 rounded-xl sm:rounded-2xl border border-border bg-card/80 overflow-hidden">
              <Accordion type="single" collapsible defaultValue="0" className="w-full">
                {PARTNER_MAIN_FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <AccordionItem key={f.title} value={String(i)} className="border-border px-4 last:border-b-0">
                      <AccordionTrigger className="py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-teal-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground">{f.title}</span>
                            <span className="block text-xs text-teal-400/90 font-medium mt-0.5">{f.tagline}</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-0">
                        <p className="text-sm text-muted-foreground leading-relaxed pl-0 sm:pl-[52px]">{f.text}</p>
                        <button
                          type="button"
                          onClick={i >= 3 ? scrollToDemoSection : () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                          className="mt-3 pl-0 sm:pl-[52px] text-sm font-medium text-teal-400 hover:text-teal-300 inline-flex items-center gap-1"
                        >
                          {i >= 3 ? 'See dashboard' : 'Learn more'}
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </button>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>

            <div className="sm:w-[240px] lg:w-[280px] shrink-0 flex flex-col gap-3">
              <div className="rounded-xl sm:rounded-2xl border border-border bg-card/80 p-3 sm:p-4 flex flex-col gap-3 flex-1 min-h-[160px] sm:min-h-[200px]">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-teal-400" />
                  <span className="text-sm font-semibold text-foreground">At a glance</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Revenue (Lynkr)', value: '₹42.8k' },
                    { label: 'Orders', value: '248' },
                    { label: 'Repeat rate', value: '41%' },
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between items-baseline py-1.5 border-b border-border last:border-0">
                      <span className="text-xs text-muted-foreground">{s.label}</span>
                      <span className="text-sm font-semibold text-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="mt-auto min-h-[40px] rounded-lg border-border bg-muted hover:bg-muted text-foreground text-xs font-medium touch-manipulation"
                  onClick={scrollToDemoSection}
                >
                  See dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — numbered steps, desktop grid / mobile horizontal scroll */}
      <section id="how-it-works" className="landing-section landing-pad-x bg-secondary/20" aria-labelledby="partner-how-heading">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Simple steps</p>
          <h2 id="partner-how-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-center mb-2 sm:mb-3">
            Here&apos;s how it works
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto">
            From integration to growth in a few steps.
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 md:overflow-visible md:grid md:grid-cols-4 md:gap-6 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
            {PARTNER_STEPS.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.title}
                  data-testid={`partner-step-${i + 1}`}
                  className={cn(
                    'flex-shrink-0 w-[min(260px,80vw)] md:w-auto bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm snap-start'
                  )}
                >
                  <div className="flex items-center gap-3 mb-3 md:mb-4">
                    <span className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-sm font-bold text-teal-400 shrink-0">
                      {i + 1}
                    </span>
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
                      <StepIcon className="h-5 w-5 md:h-6 md:w-6 text-teal-400" />
                    </div>
                  </div>
                  <h3 className="font-semibold font-heading text-foreground mb-2 text-base md:text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Partner Growth Dashboard (core selling point) — scroll target for all "See dashboard" / "Open in Dashboard" */}
      <section
        id="demo-dashboard-section"
        className="landing-section landing-pad-x bg-teal-500/5 scroll-mt-24 sm:scroll-mt-28"
        aria-labelledby="growth-dashboard-heading"
      >
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Core tool</p>
          <h2 id="growth-dashboard-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-center mb-2">
            Partner Growth Dashboard
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto px-1">
            <button type="button" onClick={() => document.getElementById('dashboard-preview')?.scrollIntoView({ behavior: 'smooth' })} className="text-teal-400 hover:text-teal-300 underline underline-offset-2">See the preview above</button>, then open the live demo with sample data.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 md:p-6 shadow-sm min-w-0">
              <p className="text-[10px] sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">Revenue from Lynkr users</p>
              <p className="text-base sm:text-2xl md:text-3xl font-bold font-heading text-teal-400">₹XX,XXX</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">this month</p>
            </div>
            <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 md:p-6 shadow-sm min-w-0">
              <p className="text-[10px] sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">Repeat customers</p>
              <p className="text-base sm:text-2xl md:text-3xl font-bold font-heading text-violet-400">XX%</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">returning customers</p>
            </div>
            <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 md:p-6 shadow-sm min-w-0 col-span-2 sm:col-span-1">
              <p className="text-[10px] sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">Reward-driven sales</p>
              <p className="text-base sm:text-2xl md:text-3xl font-bold font-heading text-teal-400">XX%</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">of sales from rewards</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Button
              className="min-h-[44px] sm:min-h-[48px] rounded-xl px-5 sm:px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold touch-manipulation shadow-md w-full sm:w-auto"
              onClick={() => window.location.assign('/partner-demo-dashboard')}
            >
              Open demo dashboard
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            </Button>
            <Button
              variant="outline"
              className="min-h-[44px] sm:min-h-[48px] rounded-xl px-5 sm:px-6 border-border bg-muted text-foreground hover:bg-muted font-medium touch-manipulation w-full sm:w-auto"
              onClick={() => navigate('/app/partner/login')}
            >
              Partner login
            </Button>
          </div>
        </div>
      </section>

      {/* Feature preview */}
      <section className="landing-section landing-pad-x" aria-labelledby="dashboard-features-heading">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Dashboard</p>
          <h2 id="dashboard-features-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-center mb-6 sm:mb-8">
            What you get in the dashboard
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 min-w-0">
            {FEATURE_PREVIEW.map((f, i) => {
              const useViolet = i === 1 || i === 3;
              const useFuchsia = i === 2 || i === 4;
              const bgClass = useViolet ? 'bg-violet-500/15' : useFuchsia ? 'bg-fuchsia-500/15' : 'bg-teal-500/15';
              const textClass = useViolet ? 'text-violet-400' : useFuchsia ? 'text-fuchsia-400' : 'text-teal-400';
              return (
              <div
                key={f.title}
                className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 shadow-sm min-w-0"
              >
                <div className={cn('w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2 sm:mb-3 shrink-0', bgClass)}>
                  <f.icon className={cn('h-4 w-4 sm:h-5 sm:w-5', textClass)} />
                </div>
                <h3 className="font-semibold text-foreground mb-0.5 sm:mb-1 text-xs sm:text-base">{f.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-none">{f.text}</p>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* Lead magnet: partner guide */}
      <LeadMagnetSection
        id="partner-guide"
        title="Get our FREE Partner Onboarding Guide"
        highlight="FREE"
        description="Integrate with Lynkr, accept transactions, and set up rewards. Step-by-step for new partners."
        ctaLabel="Get the guide"
        coverTitle="Partner Onboarding"
        altBg
        onSubmit={async (email) => {
          try {
            const res = await api.post('/leads', { email, source: 'partner' });
            if (!res?.data?.success) throw new Error(res?.data?.detail || 'Failed to submit');
          } catch (err) {
            const d = err.response?.data?.detail;
            const msg = (Array.isArray(d) ? d[0] : d) || err.message || 'Something went wrong. Please try again.';
            toast.error(msg);
            throw err;
          }
        }}
      />

      {/* Audience: for companies of all sizes — 3 blocks with tagline + description, desktop 3-col, mobile stack */}
      <AudienceSection
        id="audience"
        variant="companies"
        title="For companies of all sizes"
        subtitle="Whether you're testing rewards or scaling a program, one integration gives you the Growth Dashboard and real customer data."
        segments={AUDIENCE_SEGMENTS_PARTNER}
        ctaLabel="See dashboard"
        ctaOnClick={scrollToDemoSection}
      />

      {/* Partner CTA */}
      <section className="landing-section landing-pad-x bg-secondary/20 border-t border-border" aria-labelledby="partner-cta-heading">
        <div className="max-w-2xl mx-auto text-center">
          <h2 id="partner-cta-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading mb-3 sm:mb-4 px-1">
            Ready to grow with Lynkr?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-1">
            Join as a partner and get access to the Growth Dashboard, transaction tools, and customer insights.
          </p>
          <div className="btn-landing-row gap-2 sm:gap-4">
            <Button
              data-testid="cta-partner-button"
              className="min-h-[44px] sm:min-h-[48px] rounded-xl px-4 sm:px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold touch-manipulation text-sm sm:text-base shadow-md"
              onClick={() => window.location.href = 'mailto:partners@lynkr.club?subject=Become a Partner'}
            >
              Become a Partner
            </Button>
            <Button
              className="min-h-[44px] sm:min-h-[48px] rounded-xl px-4 sm:px-8 bg-violet-600 text-white hover:bg-violet-700 border border-violet-500/50 font-semibold touch-manipulation text-sm sm:text-base"
              onClick={() => window.location.href = 'mailto:partners@lynkr.club?subject=Request Demo'}
            >
              Request Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Registered partners (optional) */}
      {partners.length > 0 && (
        <section className="landing-section landing-pad-x border-t border-border">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-center mb-4 sm:mb-6">Our partners</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {partners.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-border bg-card/70 p-3 sm:p-4 text-center min-h-[60px] flex flex-col justify-center"
                >
                  <p className="font-semibold text-xs sm:text-sm truncate">{p.business_name}</p>
                  {p.category && <p className="text-xs text-muted-foreground truncate mt-0.5">{p.category}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="landing-section landing-pad-x border-t border-border" aria-labelledby="contact-heading">
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="contact-heading" className="text-xl sm:text-2xl md:text-3xl font-bold font-heading mb-2 sm:mb-3">
            Contact Us
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Reach out for partner onboarding, demos, or support.</p>
          <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-6 text-sm md:text-base">
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

      <LandingFooter variant="partner" />
      </main>
    </div>
  );
};

export default PartnerLanding;
