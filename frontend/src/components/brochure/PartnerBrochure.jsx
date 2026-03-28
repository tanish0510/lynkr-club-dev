import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  Gift,
  TrendingUp,
  BarChart3,
  Users,
  Megaphone,
  FileCheck,
  Target,
  ArrowRight,
  Building2,
} from 'lucide-react';

/**
 * Partner pitch brochure for PDF export and sharing.
 * Styled to match app theme (dark, primary/accent, card-based).
 */
const PartnerBrochure = React.forwardRef((props, ref) => (
  <div
    ref={ref}
    className="bg-background text-foreground font-body antialiased"
    style={{ width: '210mm', minHeight: '297mm', margin: 0 }}
    {...props}
  >
    {/* Cover */}
    <section className="p-10 md:p-14 bg-gradient-to-b from-primary/10 via-background to-background border-b border-white/5">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-foreground mb-3">
          Lynkr — Smart Rewards for Modern Businesses
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground font-medium">
          Turn everyday transactions into customer loyalty.
        </p>
        <div className="mt-8 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
        </div>
      </div>
    </section>

    {/* About Lynkr */}
    <section className="p-8 md:p-12 border-b border-white/5">
      <h2 className="text-xl font-bold font-heading text-foreground mb-4">About Lynkr</h2>
      <p className="text-muted-foreground leading-relaxed max-w-2xl">
        Lynkr is a smart rewards platform that allows businesses to turn customer transactions into loyalty rewards.
        Customers earn points when they shop at partner stores, and they can redeem those points for rewards offered
        by partner businesses. It’s a win-win: businesses grow through loyalty, and customers get real value back.
      </p>
    </section>

    {/* How Lynkr Works */}
    <section className="p-8 md:p-12 bg-card/30 border-b border-white/5">
      <h2 className="text-xl font-bold font-heading text-foreground mb-6">How Lynkr Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/5 bg-background p-6 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold font-heading text-foreground mb-2">1. Customers shop at partner stores</h3>
          <p className="text-sm text-muted-foreground">Shoppers use their Lynkr email at checkout with your brand.</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-background p-6 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold font-heading text-foreground mb-2">2. They earn reward points instantly</h3>
          <p className="text-sm text-muted-foreground">Points are credited automatically when you acknowledge the order.</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-background p-6 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold font-heading text-foreground mb-2">3. They redeem across the partner network</h3>
          <p className="text-sm text-muted-foreground">Points unlock rewards and offers from you and other Lynkr partners.</p>
        </div>
      </div>
    </section>

    {/* Benefits for Partners */}
    <section className="p-8 md:p-12 border-b border-white/5">
      <h2 className="text-xl font-bold font-heading text-foreground mb-6">Benefits for Partners</h2>
      <p className="text-muted-foreground mb-6 max-w-2xl">
        Lynkr helps businesses grow through loyalty programs—without the complexity of building your own.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          'Increase customer retention',
          'Drive repeat purchases',
          'Attract new customers from the Lynkr network',
          'Automated loyalty rewards (no manual point tracking)',
          'Customer engagement insights',
          'Marketing campaigns through rewards and promotions',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-card/50 p-4">
            <ArrowRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span className="text-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </section>

    {/* Partner Growth Dashboard */}
    <section className="p-8 md:p-12 bg-card/30 border-b border-white/5">
      <h2 className="text-xl font-bold font-heading text-foreground mb-2">Partner Growth Dashboard</h2>
      <p className="text-muted-foreground mb-6 max-w-2xl">
        Lynkr gives partners a dedicated dashboard to see how the platform drives business growth.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenue from Lynkr users', icon: TrendingUp },
          { label: 'Reward-driven sales', icon: Gift },
          { label: 'Repeat customers', icon: Users },
          { label: 'Transaction analytics', icon: BarChart3 },
        ].map(({ label, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/5 bg-background p-4 shadow-sm">
            <Icon className="w-6 h-6 text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-4">Partners can also track campaign performance and loyalty trends.</p>
    </section>

    {/* Benefits for Customers */}
    <section className="p-8 md:p-12 border-b border-white/5">
      <h2 className="text-xl font-bold font-heading text-foreground mb-6">Benefits for Customers</h2>
      <p className="text-muted-foreground mb-4 max-w-2xl">
        When users shop at partner stores, they get real value—which makes them more likely to choose you again.
      </p>
      <ul className="space-y-2 text-foreground">
        <li className="flex items-center gap-2">• Reward points on every transaction</li>
        <li className="flex items-center gap-2">• Exclusive partner rewards and offers</li>
        <li className="flex items-center gap-2">• Loyalty incentives that drive repeat visits</li>
        <li className="flex items-center gap-2">• Special promotions and campaigns</li>
      </ul>
      <p className="text-muted-foreground mt-4 max-w-2xl">This creates a win-win ecosystem: happier customers, stronger partner performance.</p>
    </section>

    {/* Partner Features */}
    <section className="p-8 md:p-12 bg-card/30 border-b border-white/5">
      <h2 className="text-xl font-bold font-heading text-foreground mb-6">Partner Features</h2>
      <p className="text-muted-foreground mb-4">Key tools available on the Lynkr partner platform:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { text: 'Reward creation and management', icon: Gift },
          { text: 'Campaign management', icon: Megaphone },
          { text: 'Customer insights and analytics', icon: Users },
          { text: 'Transaction tracking and acknowledgment', icon: BarChart3 },
          { text: 'Coupon request and approval workflow', icon: FileCheck },
          { text: 'Loyalty program automation', icon: Sparkles },
        ].map(({ text, icon: Icon }) => (
          <div key={text} className="flex items-center gap-3 rounded-xl border border-white/5 bg-background p-4">
            <Icon className="w-5 h-5 text-primary shrink-0" />
            <span className="text-foreground text-sm font-medium">{text}</span>
          </div>
        ))}
      </div>
    </section>

    {/* Why Businesses Join */}
    <section className="p-8 md:p-12 border-b border-white/5">
      <h2 className="text-xl font-bold font-heading text-foreground mb-6">Why Businesses Join Lynkr</h2>
      <div className="flex flex-wrap gap-3">
        {[
          'Increase repeat customers',
          'Build brand loyalty',
          'Drive more transactions',
          'Access powerful analytics',
          'Join a growing partner network',
        ].map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-foreground"
          >
            <Building2 className="w-4 h-4 text-primary" />
            {item}
          </span>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="p-10 md:p-14 bg-gradient-to-t from-primary/10 to-background border-t border-white/5">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-2xl font-bold font-heading text-foreground mb-3">
          Become a Lynkr Partner
        </h2>
        <p className="text-muted-foreground mb-6">
          Turn every transaction into customer loyalty. Join the platform and get access to the Growth Dashboard, reward tools, and a network of engaged customers.
        </p>
        <p className="text-sm font-medium text-foreground">
          Contact: <a href="mailto:partners@lynkr.club" className="text-primary underline">partners@lynkr.club</a>
        </p>
        <p className="text-xs text-muted-foreground mt-4">Lynkr — Smart rewards for modern businesses.</p>
      </div>
    </section>
  </div>
));

PartnerBrochure.displayName = 'PartnerBrochure';

export default PartnerBrochure;
