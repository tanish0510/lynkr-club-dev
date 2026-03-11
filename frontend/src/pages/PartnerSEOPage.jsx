import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Gift,
  BarChart3,
  TrendingUp,
  Users,
  Megaphone,
  Receipt,
  Target,
} from 'lucide-react';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import {
  CITIES,
  BUSINESS_TYPES,
  getCity,
  getBusinessType,
  isValidPartnerSEOPath,
  getPartnerSEOTitle,
  getPartnerSEODescription,
} from '@/data/partnerSEO';

const SITE_URL = 'https://lynkr.club';

const BENEFITS = [
  { icon: Users, title: 'Increase repeat customers', text: 'Bring customers back with a simple loyalty rewards program.' },
  { icon: Megaphone, title: 'Run reward campaigns', text: 'Launch promotions and bonus points to drive visits.' },
  { icon: TrendingUp, title: 'Attract new customers', text: 'Join a partner network and get discovered by reward-seeking customers.' },
  { icon: BarChart3, title: 'Track customer activity', text: 'See how often customers visit and what they redeem.' },
  { icon: Gift, title: 'Build customer loyalty', text: 'Turn one-time buyers into regulars with an easy rewards system.' },
];

const FEATURES = [
  { icon: Gift, title: 'Reward creation', text: 'Set up points and rewards in minutes.' },
  { icon: Megaphone, title: 'Campaign management', text: 'Run time-bound offers and double-point days.' },
  { icon: BarChart3, title: 'Customer analytics', text: 'Understand who visits and how they engage.' },
  { icon: Receipt, title: 'Transaction tracking', text: 'See every purchase and reward issued.' },
  { icon: Target, title: 'Loyalty rewards dashboard', text: 'One place to manage your rewards platform.' },
];

function PartnerSEOPage() {
  const { city: citySlug, businessType: businessSlug } = useParams();
  const navigate = useNavigate();
  const city = getCity(citySlug);
  const businessType = getBusinessType(businessSlug);
  const isValid = isValidPartnerSEOPath(citySlug, businessSlug);

  const cityName = city?.name ?? '';
  const businessName = businessType?.name ?? '';
  const businessSingular = businessType?.singular ?? businessName;
  const path = `/partners/${citySlug}/${businessSlug}`;

  useDocumentHead(
    isValid
      ? {
          title: getPartnerSEOTitle(cityName, businessName),
          description: getPartnerSEODescription(cityName, businessName),
          path,
        }
      : { title: 'Partners | Lynkr', description: 'Join the Lynkr partner rewards network.', path: '/partners' }
  );

  useEffect(() => {
    if (!isValid) {
      navigate('/partners', { replace: true });
      return;
    }
    const pageUrl = SITE_URL + path;
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'Lynkr',
          url: SITE_URL,
          description: 'Lynkr is a rewards and loyalty platform for businesses. Simple customer rewards program and loyalty rewards system.',
        },
        {
          '@type': 'WebSite',
          name: 'Lynkr',
          url: SITE_URL,
          description: 'Rewards platform and customer loyalty rewards program for businesses.',
        },
        {
          '@type': 'SoftwareApplication',
          name: 'Lynkr',
          applicationCategory: 'BusinessApplication',
          description: 'Simple rewards platform and customer rewards program. Easy loyalty system for cafes, restaurants, gyms, and retail.',
          url: SITE_URL,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Lynkr', item: SITE_URL + '/' },
            { '@type': 'ListItem', position: 2, name: 'Partners', item: SITE_URL + '/partners' },
            { '@type': 'ListItem', position: 3, name: cityName, item: pageUrl },
            { '@type': 'ListItem', position: 4, name: businessName, item: pageUrl },
          ],
        },
      ],
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    script.id = 'partner-seo-jsonld';
    const existing = document.getElementById('partner-seo-jsonld');
    if (existing) existing.remove();
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById('partner-seo-jsonld');
      if (el) el.remove();
    };
  }, [isValid, cityName, businessName, path]);

  if (!isValid) return null;

  const sameCityLinks = BUSINESS_TYPES.filter((b) => b.slug !== businessSlug).slice(0, 4);
  const sameTypeLinks = CITIES.filter((c) => c.slug !== citySlug).slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header>
        <nav className="border-b border-white/5 bg-background/80 backdrop-blur-xl" aria-label="Breadcrumb">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Lynkr</Link>
            <span className="text-muted-foreground mx-2">/</span>
            <Link to="/partners" className="text-sm text-muted-foreground hover:text-foreground">Partners</Link>
            <span className="text-muted-foreground mx-2">/</span>
            <span className="text-sm text-foreground">{cityName}</span>
            <span className="text-muted-foreground mx-2">/</span>
            <span className="text-sm text-foreground">{businessName}</span>
          </div>
        </nav>
      </header>

      <main>
        <section className="pt-12 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6" aria-labelledby="hero-heading">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Rewards platform for {businessName.toLowerCase()} in {cityName}
            </p>
            <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-foreground leading-tight mb-4">
              Simple Rewards Platform for {businessName} in {cityName}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Lynkr helps {businessName.toLowerCase()} in {cityName} turn everyday customer visits into loyalty rewards and repeat business.
            </p>
            <Button
              asChild
              className="min-h-12 rounded-xl px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/partners">
                Become a Lynkr Partner
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4 sm:px-6 bg-secondary/20" aria-labelledby="what-lynkr-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="what-lynkr-heading" className="text-2xl md:text-3xl font-bold font-heading text-center mb-6">
              What Lynkr Does
            </h2>
            <p className="text-muted-foreground text-center leading-relaxed mb-4">
              Lynkr is a <strong className="text-foreground">rewards platform</strong> that automatically converts transactions into <strong className="text-foreground">loyalty rewards</strong>. Customers earn points when they shop and redeem them across partner businesses. It’s a simple loyalty system built for local businesses like {businessName.toLowerCase()} in {cityName}.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4 sm:px-6" aria-labelledby="benefits-heading">
          <div className="max-w-6xl mx-auto">
            <h2 id="benefits-heading" className="text-2xl md:text-3xl font-bold font-heading text-center mb-8">
              Benefits for Your {businessSingular}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BENEFITS.map((b) => (
                <div key={b.title} className="bg-card rounded-2xl border border-white/5 p-5 shadow-sm">
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

        <section className="py-12 md:py-16 px-4 sm:px-6 bg-secondary/20" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto">
            <h2 id="features-heading" className="text-2xl md:text-3xl font-bold font-heading text-center mb-8">
              Platform Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-card rounded-2xl border border-white/5 p-5 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4 sm:px-6" aria-labelledby="why-rewards-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="why-rewards-heading" className="text-2xl md:text-3xl font-bold font-heading text-center mb-6">
              Why Businesses Use a Rewards Platform
            </h2>
            <p className="text-muted-foreground text-center leading-relaxed mb-4">
              A simple <strong className="text-foreground">customer rewards program</strong> helps you improve customer retention, increase repeat purchases, and encourage engagement. Lynkr is an easy loyalty platform: no complicated setup, just a straightforward <strong className="text-foreground">customer rewards system</strong> that works for {businessName.toLowerCase()}, restaurants, gyms, and retail stores.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4 sm:px-6 bg-primary/5" aria-labelledby="explore-heading">
          <div className="max-w-6xl mx-auto">
            <h2 id="explore-heading" className="text-2xl md:text-3xl font-bold font-heading text-center mb-8">
              Explore More
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-foreground mb-3">More in {cityName}</h3>
                <ul className="space-y-2">
                  {sameCityLinks.map((b) => (
                    <li key={b.slug}>
                      <Link to={`/partners/${citySlug}/${b.slug}`} className="text-primary hover:underline">
                        Rewards platform for {b.name.toLowerCase()} in {cityName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">{businessName} in other cities</h3>
                <ul className="space-y-2">
                  {sameTypeLinks.map((c) => (
                    <li key={c.slug}>
                      <Link to={`/partners/${c.slug}/${businessSlug}`} className="text-primary hover:underline">
                        {businessName} in {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="text-center mt-8">
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/partners">View all partner resources</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4 sm:px-6 bg-secondary/20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4">
              Ready to grow with a simple loyalty program?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join Lynkr and get a customer rewards program that increases repeat customers for your {businessSingular.toLowerCase()} in {cityName}.
            </p>
            <Button asChild className="min-h-12 rounded-xl px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              <Link to="/partners">Become a Lynkr Partner</Link>
            </Button>
          </div>
        </section>

        <footer className="py-6 px-4 border-t border-white/5 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Lynkr</Link>
          {' · '}
          <Link to="/partners" className="hover:text-foreground">Partners</Link>
          {' · '}
          &copy; {new Date().getFullYear()} Lynkr.club
        </footer>
      </main>
    </div>
  );
}

export default PartnerSEOPage;
