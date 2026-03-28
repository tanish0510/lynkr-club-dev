import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  Diamond,
  Gift,
  Maximize2,
  Megaphone,
  Network,
  Repeat,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useIsMobile from '@/hooks/useIsMobile';

gsap.registerPlugin(ScrollTrigger);

const cardClass = 'rounded-2xl border border-border bg-card backdrop-blur-md shadow-[0_14px_40px_rgba(10,18,40,0.45)]';

const EMphasisClass = {
  lynkr: 'bg-gradient-to-r from-[#3B82F6] to-[#14B8A6] bg-clip-text text-transparent',
  rewards: 'text-[#14B8A6]',
  growth: 'text-[#8B5CF6]',
  revenue: 'text-[#F59E0B]',
  network: 'text-[#3B82F6]',
};

const Emphasis = ({ tone = 'lynkr', children }) => (
  <span className={`font-semibold ${EMphasisClass[tone] || ''}`}>{children}</span>
);

const StoryBlock = ({ title, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.45, delay }}
    className={`${cardClass} p-6 md:p-7`}
  >
    <h4 className="text-xl md:text-2xl font-heading font-bold mb-3">{title}</h4>
    <div className="text-sm md:text-base leading-7 text-txt-secondary">{children}</div>
  </motion.div>
);

const Counter = ({ end, suffix = '' }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 1100;
    const start = performance.now();
    let rafId = 0;

    const tick = (ts) => {
      const progress = Math.min(1, (ts - start) / duration);
      setValue(Math.round(end * progress));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [end]);

  return <>{value}{suffix}</>;
};

const AdminPartnerDemoMode = () => {
  const isMobile = useIsMobile();
  const rootRef = useRef(null);
  const horizontalRef = useRef(null);
  const horizontalTrackRef = useRef(null);

  useLayoutEffect(() => {
    if (isMobile) return undefined;
    if (!horizontalRef.current || !horizontalTrackRef.current) return undefined;

    const ctx = gsap.context(() => {
      gsap.to(horizontalTrackRef.current, {
        xPercent: -66.666,
        ease: 'none',
        scrollTrigger: {
          trigger: horizontalRef.current,
          start: 'top top',
          end: '+=2200',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, [isMobile]);

  const openFullscreen = async () => {
    if (!document.fullscreenElement && rootRef.current?.requestFullscreen) {
      await rootRef.current.requestFullscreen();
    }
  };

  return (
    <div ref={rootRef} className="min-h-screen bg-surface-page text-foreground overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#3B82F6]/20 blur-3xl"
          animate={isMobile ? { x: [0, 14, 0], y: [0, 10, 0] } : { x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: isMobile ? 12 : 9, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[-100px] right-[-80px] w-[420px] h-[420px] rounded-full bg-[#8B5CF6]/20 blur-3xl"
          animate={isMobile ? { x: [0, -12, 0], y: [0, -8, 0] } : { x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: isMobile ? 12 : 11, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 px-4 md:px-10 py-6 border-b border-border bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold">Lynkr Partner Demo Mode</h1>
            <p className="text-sm text-txt-secondary">Scroll-driven interactive product story</p>
          </div>
          <Button onClick={openFullscreen} className="rounded-xl min-h-11 bg-[#3B82F6] hover:bg-[#2c6fe0]">
            <Maximize2 className="w-4 h-4 mr-2" />
            Presentation Mode
          </Button>
        </div>
      </div>

      {/* Section 1 */}
      <section className="relative z-10 min-h-screen px-4 md:px-10 py-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full text-center">
          <motion.h2
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-heading font-bold tracking-tight"
          >
            Turn Transactions into <span className="bg-gradient-to-r from-[#3B82F6] to-[#14B8A6] bg-clip-text text-transparent">Loyalty</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="max-w-3xl mx-auto mt-5 text-txt-secondary text-base md:text-lg"
          >
            Lynkr transforms everyday purchases into a powerful rewards ecosystem that drives customer loyalty and business growth.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto mt-6 text-sm md:text-base leading-7 text-txt-secondary"
          >
            With <Emphasis tone="lynkr">Lynkr</Emphasis>, every transaction becomes a loyalty touchpoint. Partners can launch
            <Emphasis tone="rewards"> Rewards</Emphasis>, measure <Emphasis tone="growth">Growth</Emphasis>, and track
            <Emphasis tone="revenue"> Revenue Impact</Emphasis> with a single connected experience designed for modern businesses.
          </motion.p>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[Gift, Store, BarChart3].map((Icon, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className={`${cardClass} p-6`}
              >
                <Icon className="w-7 h-7 text-[#3B82F6] mx-auto" />
              </motion.div>
            ))}
          </div>
          <motion.div
            animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="mt-16 inline-flex flex-col items-center text-txt-secondary"
          >
            <span className="text-xs uppercase tracking-wider">Scroll</span>
            <ArrowDown className="w-5 h-5 mt-1" />
          </motion.div>
        </div>
      </section>

      {/* Section 2 */}
      <section className="relative z-10 min-h-screen px-4 md:px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.h3
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-heading font-bold text-center"
          >
            The <span className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">Lynkr Ecosystem</span>
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center text-txt-secondary mt-3"
          >
            Customer → Partner Store → Earn Rewards → Redeem Anywhere
          </motion.p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-10 items-center">
            <StoryBlock title="How connected loyalty works" delay={0.05}>
              <p>
                The <Emphasis tone="network">Loyalty Network</Emphasis> links merchants into one shared rewards journey.
                A customer can shop at one store, collect points, and return later with higher intent to redeem.
              </p>
              <p className="mt-3">
                This connected flow helps partners increase repeat visits without forcing customers to start over in a different app.
                The result is stronger retention and measurable cross-partner discovery.
              </p>
            </StoryBlock>
            <div className="relative h-[460px] flex items-center justify-center">
            <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px]">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#3B82F6]/50" />
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              >
                <div className="absolute left-1/2 -translate-x-1/2 -top-3">
                  <ArrowRight className="w-6 h-6 text-[#14B8A6]" />
                </div>
              </motion.div>

              {[
                { label: 'Customer', icon: Users, cls: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
                { label: 'Partner Store', icon: Store, cls: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2' },
                { label: 'Earn Rewards', icon: Diamond, cls: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
                { label: 'Redeem Anywhere', icon: Gift, cls: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2' },
              ].map((n, i) => (
                <motion.div
                  key={n.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`absolute ${n.cls} ${cardClass} px-4 py-3 min-w-[145px] text-center`}
                >
                  <n.icon className="w-5 h-5 text-[#3B82F6] mx-auto mb-1" />
                  <p className="text-sm font-semibold">{n.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Section 3 - horizontal on desktop, stacked on mobile */}
      {isMobile ? (
        <section className="relative z-10 min-h-screen px-4 py-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 gap-4">
            {[
              { icon: ShoppingBag, title: 'Shop', desc: 'Customers visit partner stores and make purchases.', color: '#14B8A6' },
              { icon: Zap, title: 'Earn', desc: 'Reward points are instantly credited with no manual process.', color: '#3B82F6' },
              { icon: Gift, title: 'Redeem', desc: 'Rewards can be redeemed across the Lynkr partner network.', color: '#8B5CF6' },
            ].map((s) => (
              <div key={s.title} className={`${cardClass} p-6 text-center`}>
                <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: `${s.color}33` }}>
                  <s.icon className="w-6 h-6" style={{ color: s.color }} />
                </div>
                <h4 className="text-2xl font-heading font-bold">{s.title}</h4>
                <p className="text-txt-secondary mt-2 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section ref={horizontalRef} className="relative z-10 h-screen overflow-hidden">
          <div ref={horizontalTrackRef} className="h-full w-[300%] flex">
            {[
              { icon: ShoppingBag, title: 'Shop', desc: 'Customers visit partner stores and make purchases.', color: '#14B8A6' },
              { icon: Zap, title: 'Earn', desc: 'Reward points are instantly credited with no manual process.', color: '#3B82F6' },
              { icon: Gift, title: 'Redeem', desc: 'Rewards can be redeemed across the Lynkr partner network.', color: '#8B5CF6' },
            ].map((s) => (
              <div key={s.title} className="w-full h-full flex items-center justify-center px-6">
                <div className={`${cardClass} max-w-xl w-full p-10 text-center`}>
                  <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: `${s.color}33` }}>
                    <s.icon className="w-7 h-7" style={{ color: s.color }} />
                  </div>
                  <h4 className="text-3xl font-heading font-bold">{s.title}</h4>
                  <p className="text-txt-secondary mt-3">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="relative z-10 px-4 md:px-10 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StoryBlock title="Why this loop drives repeat visits">
              <p>
                Customers are more likely to return when they can unlock value quickly through <Emphasis tone="rewards">Rewards</Emphasis>.
                Lynkr reduces friction by automating earning and redemption moments at checkout.
              </p>
              <p className="mt-3">
                Every redemption event can trigger follow-up engagement, creating a cycle of discovery, purchase, and retention.
              </p>
            </StoryBlock>
            <StoryBlock title="How partners benefit from visibility" delay={0.08}>
              <p>
                Partners gain a clear lens into customer behavior, including what offers convert, which cohorts repeat,
                and how campaigns influence basket size over time.
              </p>
              <p className="mt-3">
                That visibility turns loyalty into a strategic growth channel instead of a generic discount program.
              </p>
            </StoryBlock>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section className="relative z-10 min-h-screen px-4 md:px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl md:text-5xl font-heading font-bold text-center">Network Effect</h3>
          <p className="text-center text-txt-secondary mt-3">A growing partner graph that increases cross-store customer flow.</p>
          <div className={`${cardClass} mt-10 p-8 relative overflow-hidden min-h-[380px]`}>
            {[
              { name: 'Cafe', top: '18%', left: '18%' },
              { name: 'Gym', top: '28%', left: '58%' },
              { name: 'Restaurant', top: '62%', left: '25%' },
              { name: 'Retail Store', top: '66%', left: '66%' },
            ].map((n, i) => (
              <motion.div
                key={n.name}
                className="absolute"
                style={{ top: n.top, left: n.left }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <div className="px-3 py-2 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-sm">{n.name}</div>
              </motion.div>
            ))}
            {[
              'M 22 24 C 38 32, 52 31, 66 30',
              'M 22 24 C 30 42, 33 53, 34 68',
              'M 66 30 C 64 44, 66 56, 68 66',
              'M 34 68 C 45 71, 54 70, 68 66',
            ].map((path, i) => (
              <svg key={i} className="absolute inset-0 w-full h-full pointer-events-none">
                <motion.path
                  d={path}
                  fill="none"
                  stroke="rgba(20,184,166,0.7)"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.12 }}
                />
              </svg>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 md:px-10 py-8 md:py-10">
        <div className="max-w-5xl mx-auto">
          <motion.blockquote
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45 }}
            className={`${cardClass} p-8 md:p-10 text-center border border-[#8B5CF6]/40`}
          >
            <p className="text-2xl md:text-4xl font-heading font-bold leading-tight">
              "Lynkr turns every purchase into an opportunity to build lasting customer relationships."
            </p>
          </motion.blockquote>
        </div>
      </section>

      {/* Section 5 */}
      <section className="relative z-10 min-h-screen px-4 md:px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl md:text-5xl font-heading font-bold text-center">
            Partner <span className="bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] bg-clip-text text-transparent">Growth Dashboard</span>
          </h3>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-txt-secondary mt-4 max-w-3xl mx-auto text-sm md:text-base"
          >
            This view translates engagement into business outcomes so partner teams can align campaigns with measurable revenue goals.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-10">
            {[
              ['Revenue from Lynkr users', 248, 'K'],
              ['Reward-driven sales', 38, '%'],
              ['Repeat customers', 61, '%'],
              ['Retention rate', 74, '%'],
            ].map(([title, val, suffix]) => (
              <motion.div key={title} className={`${cardClass} p-5`} whileHover={{ y: -4 }}>
                <p className="text-sm text-txt-secondary">{title}</p>
                <p className="text-3xl font-heading font-bold mt-2">
                  <Counter end={Number(val)} suffix={suffix} />
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 */}
      <section className="relative z-10 min-h-screen px-4 md:px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl md:text-5xl font-heading font-bold text-center">Business Benefits</h3>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-txt-secondary mt-4 max-w-3xl mx-auto text-sm md:text-base"
          >
            From customer retention to discovery, each benefit compounds over time and improves how businesses forecast growth.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              ['Increase Repeat Visits', Repeat],
              ['Higher Average Spend', CircleDollarSign],
              ['Customer Retention', Users],
              ['New Customer Discovery', Network],
              ['Behavior Insights', BarChart3],
              ['Promotional Campaigns', Megaphone],
            ].map(([label, Icon], idx) => (
              <motion.div
                key={label}
                className={`${cardClass} p-5`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -6, boxShadow: '0 16px 42px rgba(59,130,246,0.25)' }}
              >
                <Icon className="w-5 h-5 text-[#3B82F6]" />
                <p className="font-semibold mt-3">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7 */}
      <section className="relative z-10 min-h-screen px-4 md:px-10 py-20">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl md:text-5xl font-heading font-bold text-center">Platform Features</h3>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-txt-secondary mt-4 max-w-3xl mx-auto text-sm md:text-base"
          >
            Built to be operationally simple: launch promotions, track transactions, and understand customer behavior from one workflow.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              ['Reward Management', Gift],
              ['Campaign Tools', Megaphone],
              ['Transaction Tracking', ShoppingBag],
              ['Customer Analytics', BarChart3],
              ['Smart Coupons', Diamond],
              ['Growth Dashboard', TrendingUp],
            ].map(([label, Icon], idx) => (
              <motion.div
                key={label}
                className={`${cardClass} p-5`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ rotate: -0.4, scale: 1.02 }}
              >
                <Icon className="w-5 h-5 text-[#8B5CF6]" />
                <p className="font-semibold mt-3">{label}</p>
                <p className="text-xs text-txt-secondary mt-2">
                  {label === 'Reward Management' && 'Create and tune reward rules based on customer behavior.'}
                  {label === 'Campaign Tools' && 'Run time-bound promotions with clear business goals.'}
                  {label === 'Transaction Tracking' && 'Monitor purchases and reward issuance in one timeline.'}
                  {label === 'Customer Analytics' && 'Identify top segments and optimize loyalty engagement.'}
                  {label === 'Smart Coupons' && 'Use approval flows to keep offers controlled and compliant.'}
                  {label === 'Growth Dashboard' && 'Track loyalty ROI and revenue trends continuously.'}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8 CTA */}
      <section className="relative z-10 min-h-[70vh] px-4 md:px-10 py-20 flex items-center">
        <div className="max-w-5xl mx-auto w-full">
          <motion.div
            className={`${cardClass} p-10 border border-[#14B8A6]/40 text-center`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl md:text-5xl font-heading font-bold">
              Become a <span className="bg-gradient-to-r from-[#3B82F6] to-[#14B8A6] bg-clip-text text-transparent">Lynkr Partner</span>
            </h3>
            <p className="text-txt-secondary mt-4 text-lg">
              Join the Lynkr ecosystem and turn everyday transactions into long-term customer loyalty.
            </p>
            <div className="mt-7">
              <Button className="rounded-xl bg-[#3B82F6] hover:bg-[#2b71e8] min-h-11 px-6 shadow-[0_0_24px_rgba(59,130,246,0.35)]">
                Get Started Today
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.1, repeat: Infinity }}>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </motion.span>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AdminPartnerDemoMode;
