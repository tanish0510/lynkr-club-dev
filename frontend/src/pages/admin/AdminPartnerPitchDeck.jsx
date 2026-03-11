import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import useIsMobile from '@/hooks/useIsMobile';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  CircleDollarSign,
  Diamond,
  Gift,
  Maximize2,
  Megaphone,
  Minimize2,
  Network,
  Repeat,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

const containerVariants = {
  hidden: (direction) => ({ opacity: 0, x: direction > 0 ? 70 : -70 }),
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: (direction) => ({ opacity: 0, x: direction > 0 ? -70 : 70, transition: { duration: 0.25 } }),
};

const slideTitle = 'text-3xl md:text-5xl font-heading font-bold text-center tracking-tight text-[#FAFAFA]';
const slideSub = 'text-[#A3A3A3] text-center mt-3 max-w-3xl mx-auto';
const cardClass = 'rounded-2xl border border-white/10 bg-[#171717]/65 backdrop-blur-md shadow-[0_14px_40px_rgba(13,25,52,0.45)]';

const AccentWord = ({ children, color = 'from-[#3B82F6] to-[#14B8A6]' }) => (
  <span className={`bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{children}</span>
);

const AnimatedCounter = ({ to, suffix = '', duration = 1100 }) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const step = (ts) => {
      const p = Math.min(1, (ts - start) / duration);
      setValue(Math.round(to * p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, duration]);
  return <>{value}{suffix}</>;
};

const SlideFrame = ({ children, isMobile = false }) => (
  <div className="w-full max-w-[1500px] mx-auto">
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(125deg,#050506,#08142C_45%,#120B25_100%)] p-4 md:p-10 min-h-[68vh] md:min-h-[74vh]">
      <motion.div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#14B8A6]/15 blur-3xl pointer-events-none"
        animate={isMobile ? { x: [0, 16, 0], y: [0, 10, 0] } : { x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: isMobile ? 10 : 7, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-24 right-10 w-80 h-80 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none"
        animate={isMobile ? { x: [0, -12, 0], y: [0, -8, 0] } : { x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: isMobile ? 11 : 8.5, repeat: Infinity }}
      />
      {children}
    </div>
  </div>
);

const SlideOne = ({ isMobile }) => (
  <SlideFrame isMobile={isMobile}>
    <Badge className="mx-auto block w-fit bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/40">PLATFORM OVERVIEW</Badge>
    <h2 className={slideTitle}>What is <AccentWord>Lynkr</AccentWord>?</h2>
    <p className={slideSub}>
      A smart rewards ecosystem that transforms everyday transactions into a unified loyalty currency connecting customers with a network of partner businesses.
    </p>

    <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div className="relative h-[360px] md:h-[420px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[300px] h-[300px] md:w-[360px] md:h-[360px]">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#3B82F6]/50" />
            <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: isMobile ? 14 : 9, repeat: Infinity, ease: 'linear' }}>
              <div className="absolute left-1/2 -translate-x-1/2 -top-3"><ArrowRight className="w-6 h-6 text-[#14B8A6]" /></div>
            </motion.div>
            {[
              { title: 'Customer', icon: Users, pos: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
              { title: 'Partner Store', icon: Store, pos: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2' },
              { title: 'Earn Rewards', icon: Diamond, pos: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
              { title: 'Redeem Rewards', icon: Gift, pos: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2' },
            ].map((node) => (
              <motion.div key={node.title} className={`absolute ${node.pos} ${cardClass} px-4 py-3 min-w-[145px] text-center`} whileHover={{ y: -4, scale: 1.03 }}>
                <node.icon className="w-5 h-5 text-[#3B82F6] mx-auto mb-1" />
                <p className="text-sm font-semibold text-[#FAFAFA]">{node.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { icon: Bot, title: 'Fully Automated', text: 'Points are tracked automatically via payments with no manual loyalty cards.' },
          { icon: Network, title: 'Network Effect', text: 'Customers move across the partner ecosystem and increase engagement.' },
          { icon: BarChart3, title: 'Analytics Ready', text: 'Businesses gain insights into transaction data and retention patterns.' },
        ].map((item, idx) => (
          <motion.div
            key={item.title}
            className={`${cardClass} p-5`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -4, boxShadow: '0 18px 45px rgba(20,184,166,0.2)' }}
          >
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center mb-2">
              <item.icon className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-[#FAFAFA]">{item.title}</h3>
            <p className="text-sm text-[#A3A3A3] mt-1">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </SlideFrame>
);

const SlideTwo = ({ isMobile }) => (
  <SlideFrame isMobile={isMobile}>
    <Badge className="mx-auto block w-fit bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/40">WORKFLOW</Badge>
    <h2 className={slideTitle}>How <AccentWord>Lynkr</AccentWord> Works</h2>
    <p className={slideSub}>A seamless loop that turns shoppers into loyal fans.</p>
    <div className="mt-10 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
      {[
        { icon: Store, title: 'Shop', text: 'Customers visit partner businesses and make purchases.', accent: '#14B8A6' },
        { icon: Zap, title: 'Earn', text: 'Reward points are instantly credited to their account.', accent: '#3B82F6' },
        { icon: Gift, title: 'Redeem', text: 'Points can be used for rewards across the ecosystem.', accent: '#8B5CF6' },
      ].map((s, i) => (
        <React.Fragment key={s.title}>
          <motion.div className={`${cardClass} p-6 text-center`} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${s.accent}33` }}>
              <s.icon className="w-6 h-6" style={{ color: s.accent }} />
            </div>
            <p className="font-heading text-lg font-semibold text-[#FAFAFA]">{s.title}</p>
            <p className="text-sm text-[#A3A3A3] mt-2">{s.text}</p>
          </motion.div>
          {i < 2 && (
            <motion.div className="hidden md:flex items-center justify-center" animate={{ x: [0, 10, 0], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <ArrowRight className="w-5 h-5 text-[#3B82F6]" />
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </div>

    <motion.div className={`${cardClass} p-5 mt-6 border-l-4 border-l-[#14B8A6]`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
      <p className="font-semibold text-[#FAFAFA]">The Network Effect</p>
      <p className="text-sm text-[#A3A3A3] mt-1">Rewards earned at one partner can be used at another in the network.</p>
      <div className="mt-4 flex items-center gap-2">
        {[0, 1, 2, 3].map((n) => (
          <React.Fragment key={n}>
            <motion.div className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.4, delay: n * 0.15, repeat: Infinity }} />
            {n < 3 ? <div className="flex-1 h-px border-t border-dashed border-[#3B82F6]/50" /> : null}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  </SlideFrame>
);

const SlideThree = ({ isMobile }) => (
  <SlideFrame isMobile={isMobile}>
    <Badge className="mx-auto block w-fit bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/40">COMPETITIVE ADVANTAGE</Badge>
    <h2 className={slideTitle}>Why <AccentWord>Lynkr</AccentWord> is Different</h2>
    <p className={slideSub}>A next-generation loyalty ecosystem powered by data and automation.</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
      {[
        { icon: Network, title: 'Network Based Loyalty', text: 'Earn and redeem across the full partner network.' },
        { icon: BarChart3, title: 'Data Driven Insights', text: 'Real-time dashboards for customer spending patterns.' },
        { icon: Bot, title: 'Fully Automated', text: 'No physical cards required for loyalty tracking.' },
        { icon: Target, title: 'Retention by Design', text: 'Incentives encourage repeat visits and higher usage.' },
        { icon: TrendingUp, title: 'Revenue Impact', text: 'Measure ROI generated by loyalty rewards.' },
        { icon: Sparkles, title: 'Cross Partner Discovery', text: 'Customers discover new businesses through rewards.' },
      ].map((item, idx) => (
        <motion.div key={item.title} className={`${cardClass} p-5`} whileHover={{ y: -5, borderColor: 'rgba(59,130,246,0.6)' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
          <div className="flex items-center gap-3 mb-2">
            <item.icon className="w-5 h-5 text-[#3B82F6]" />
            <h3 className="font-heading font-semibold text-lg text-[#FAFAFA]">{item.title}</h3>
          </div>
          <p className="text-sm text-[#A3A3A3]">{item.text}</p>
        </motion.div>
      ))}
    </div>
  </SlideFrame>
);

const SlideFour = ({ isMobile }) => (
  <SlideFrame isMobile={isMobile}>
    <Badge className="mx-auto block w-fit bg-[#14B8A6]/20 text-[#14B8A6] border-[#14B8A6]/40">VALUE PROPOSITION</Badge>
    <h2 className={slideTitle}>How Businesses <AccentWord color="from-[#14B8A6] to-[#3B82F6]">Benefit</AccentWord></h2>
    <p className={slideSub}>Growth metrics that directly impact revenue.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
      {[
        { icon: Repeat, value: 35, suffix: '%', label: 'Increase Repeat Visits', tip: 'Customers return more frequently.' },
        { icon: CircleDollarSign, value: 22, suffix: '%', label: 'Higher Average Spend', tip: 'Larger basket sizes with incentives.' },
        { icon: Users, raw: 'LTV', label: 'Build Long-Term Loyalty', tip: 'Increase customer lifetime value.' },
        { icon: Sparkles, raw: 'NEW', label: 'Attract New Customers', tip: 'Network discovery drives acquisition.' },
        { icon: BarChart3, raw: 'DATA', label: 'Behavior Insights', tip: 'Understand who buys and when.' },
        { icon: Megaphone, raw: 'ROI', label: 'Run Promotions', tip: 'Launch campaigns with measurable impact.' },
      ].map((item, idx) => (
        <motion.div key={item.label} className={`${cardClass} p-5 group`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }} whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-between mb-3">
            <item.icon className="w-5 h-5 text-[#3B82F6]" />
            <span className="text-xs px-2 py-1 rounded-full bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/35">
              {item.raw || <AnimatedCounter to={item.value} suffix={item.suffix} />}
            </span>
          </div>
          <p className="font-heading font-semibold text-[#FAFAFA]">{item.label}</p>
          <p className="text-sm text-[#A3A3A3] mt-2">{item.tip}</p>
          <p className="text-xs text-[#14B8A6] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Hover insight: {item.tip}</p>
        </motion.div>
      ))}
    </div>
  </SlideFrame>
);

const SlideFive = ({ isMobile }) => {
  const features = useMemo(
    () => [
      { id: 'rewards', title: 'Reward Management', detail: 'Create reward tiers, point values, and redemption rules.' },
      { id: 'campaigns', title: 'Campaign Tools', detail: 'Launch targeted promotions and track campaign impact.' },
      { id: 'txns', title: 'Transaction Tracking', detail: 'Monitor transaction logs and reward issuance in real-time.' },
      { id: 'analytics', title: 'Customer Analytics', detail: 'Analyze spending patterns, retention, and cohort behavior.' },
      { id: 'coupon', title: 'Smart Coupons', detail: 'Automated coupon approval, validation, and usage tracking.' },
      { id: 'growth', title: 'Growth Dashboard', detail: 'View revenue impact, ROI, and loyalty growth metrics.' },
    ],
    []
  );
  const [active, setActive] = useState(features[0]);

  return (
    <SlideFrame isMobile={isMobile}>
      <Badge className="mx-auto block w-fit bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40">PLATFORM FEATURES</Badge>
      <h2 className={slideTitle}>Partner Platform <AccentWord color="from-[#8B5CF6] to-[#EC4899]">Features</AccentWord></h2>
      <p className={slideSub}>Everything you need to manage loyalty and drive growth.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
        {features.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActive(f)}
            className={`${cardClass} p-5 text-left transition-all ${active.id === f.id ? 'border-[#8B5CF6]/70 bg-[#8B5CF6]/10' : 'hover:border-[#3B82F6]/40 hover:scale-[1.02]'}`}
          >
            <p className="font-heading font-semibold text-[#FAFAFA]">{f.title}</p>
          </button>
        ))}
      </div>
      <motion.div key={active.id} className={`${cardClass} p-6 mt-6`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs tracking-wider text-[#8B5CF6] uppercase font-semibold">Selected Feature</p>
        <h3 className="text-xl font-heading font-bold mt-1 text-[#FAFAFA]">{active.title}</h3>
        <p className="text-[#A3A3A3] mt-2">{active.detail}</p>
      </motion.div>

      <motion.div className={`${cardClass} mt-6 p-6 border border-[#14B8A6]/40`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <h4 className="text-2xl font-heading font-bold text-center text-[#FAFAFA]">Become a Lynkr Partner</h4>
        <p className="text-center text-[#A3A3A3] mt-2">Join the Lynkr ecosystem and turn everyday transactions into long-term customer loyalty.</p>
        <div className="flex justify-center mt-4">
          <Button className="rounded-xl bg-[#3B82F6] hover:bg-[#2c6fe0] text-white min-h-11 shadow-[0_0_24px_rgba(59,130,246,0.35)]">
            Get Started Today
            <motion.span animate={{ x: [0, 6, 0] }} transition={{ duration: 1.1, repeat: Infinity }}>
              <ArrowRight className="w-4 h-4 ml-2" />
            </motion.span>
          </Button>
        </div>
      </motion.div>
    </SlideFrame>
  );
};

const slides = [
  { title: 'What is Lynkr', component: SlideOne },
  { title: 'How Lynkr Works', component: SlideTwo },
  { title: 'Why Lynkr is Different', component: SlideThree },
  { title: 'How Businesses Benefit', component: SlideFour },
  { title: 'Partner Platform Features', component: SlideFive },
];

const AdminPartnerPitchDeck = () => {
  const isMobile = useIsMobile();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef(null);

  const goTo = (nextIndex) => {
    setDirection(nextIndex > index ? 1 : -1);
    setIndex(nextIndex);
  };
  const next = () => goTo(Math.min(slides.length - 1, index + 1));
  const prev = () => goTo(Math.max(0, index - 1));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && rootRef.current?.requestFullscreen) {
      await rootRef.current.requestFullscreen();
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  };

  const SlideComponent = slides[index].component;

  return (
    <div ref={rootRef} className="relative min-h-screen bg-[#050506] px-3 md:px-6 py-4 md:py-6 overflow-hidden">
      {/* moving particles */}
      {[...Array(isMobile ? 6 : 14)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white/20 pointer-events-none"
          style={{ width: 3 + (i % 3), height: 3 + (i % 3), left: `${(i * 7.1) % 100}%`, top: `${(i * 11.7) % 100}%` }}
          animate={{ y: [0, -18, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: (isMobile ? 4 : 3) + (i % 5), repeat: Infinity }}
        />
      ))}

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#FAFAFA]">Lynkr Partner Pitch Deck</h1>
          <p className="text-sm text-[#A3A3A3] mt-1">Live interactive presentation for partner meetings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-white/10 text-white border-white/15">{index + 1} / {slides.length}</Badge>
          <Button variant="outline" onClick={toggleFullscreen} className="rounded-xl border-white/20 text-white hover:bg-white/10 min-h-11">
            {fullscreen ? <Minimize2 className="w-4 h-4 mr-1" /> : <Maximize2 className="w-4 h-4 mr-1" />}
            {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
          <Button variant="outline" onClick={prev} disabled={index === 0} className="rounded-xl min-h-11">
            <ArrowLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button onClick={next} disabled={index === slides.length - 1} className="rounded-xl min-h-11">
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="relative z-10 flex justify-center gap-2 mb-4">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => goTo(i)}
            className={`h-2.5 rounded-full transition-all ${i === index ? 'w-8 bg-[#3B82F6]' : 'w-2.5 bg-white/25'}`}
            aria-label={`Go to ${s.title}`}
          />
        ))}
      </div>

      <div className="relative z-10">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag={isMobile ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (!isMobile) return;
              if (info.offset.x < -60) next();
              if (info.offset.x > 60) prev();
            }}
          >
            <SlideComponent isMobile={isMobile} />
          </motion.div>
        </AnimatePresence>
        {isMobile ? (
          <p className="text-center text-xs text-[#A3A3A3] mt-3">Swipe left or right to change slides</p>
        ) : null}
      </div>
    </div>
  );
};

export default AdminPartnerPitchDeck;
