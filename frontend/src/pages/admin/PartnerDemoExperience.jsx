import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  Gift,
  Megaphone,
  Network,
  ShoppingBag,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import useIsMobile from '@/hooks/useIsMobile';

const cardClass = 'rounded-2xl border border-border bg-card backdrop-blur-md shadow-[0_14px_40px_rgba(10,18,40,0.45)]';

const Accent = ({ tone = 'blue', children }) => {
  const cls =
    tone === 'teal'
      ? 'text-[#14B8A6]'
      : tone === 'purple'
        ? 'text-[#8B5CF6]'
        : tone === 'amber'
          ? 'text-[#F59E0B]'
          : 'bg-gradient-to-r from-[#3B82F6] to-[#14B8A6] bg-clip-text text-transparent';
  return <span className={`font-semibold ${cls}`}>{children}</span>;
};

const SectionTitle = ({ title, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    className="text-center max-w-4xl mx-auto"
  >
    <h2 className="text-3xl md:text-5xl font-heading font-bold">{title}</h2>
    {subtitle ? <p className="mt-4 text-txt-secondary text-sm md:text-base leading-7">{subtitle}</p> : null}
  </motion.div>
);

const PartnerDemoExperience = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [metrics, setMetrics] = useState({
    customers: 1320,
    transactions: 2489,
    pointsIssued: 128400,
    lynkrRevenue: 428000,
    retentionRate: 74,
    redemptionRate: 41,
  });

  const [growthData, setGrowthData] = useState([
    { month: 'Jan', revenue: 120, retention: 28, redemption: 22 },
    { month: 'Feb', revenue: 136, retention: 31, redemption: 25 },
    { month: 'Mar', revenue: 149, retention: 34, redemption: 30 },
    { month: 'Apr', revenue: 162, retention: 37, redemption: 34 },
    { month: 'May', revenue: 174, retention: 40, redemption: 38 },
    { month: 'Jun', revenue: 189, retention: 43, redemption: 41 },
  ]);

  const insightsData = useMemo(
    () => [
      { day: 'Mon', visits: 34 },
      { day: 'Tue', visits: 42 },
      { day: 'Wed', visits: 39 },
      { day: 'Thu', visits: 47 },
      { day: 'Fri', visits: 58 },
      { day: 'Sat', visits: 64 },
      { day: 'Sun', visits: 51 },
    ],
    []
  );

  const simulateVisit = () => {
    setMetrics((m) => ({ ...m, customers: m.customers + 5, transactions: m.transactions + 8, lynkrRevenue: m.lynkrRevenue + 4600 }));
  };
  const simulateRedemption = () => {
    setMetrics((m) => ({
      ...m,
      pointsIssued: m.pointsIssued + 5200,
      retentionRate: Math.min(90, m.retentionRate + 1),
      redemptionRate: Math.min(75, m.redemptionRate + 2),
    }));
  };
  const simulateCampaign = () => {
    setMetrics((m) => ({ ...m, transactions: m.transactions + 28, customers: m.customers + 14, lynkrRevenue: m.lynkrRevenue + 19000 }));
    setGrowthData((rows) =>
      rows.map((r, idx) => (idx === rows.length - 1 ? { ...r, revenue: r.revenue + 12, retention: r.retention + 2, redemption: r.redemption + 3 } : r))
    );
  };

  return (
    <div className="min-h-screen bg-surface-page text-foreground overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <motion.div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#3B82F6]/20 blur-3xl" animate={isMobile ? { x: [0, 12, 0], y: [0, 8, 0] } : { x: [0, 40, 0], y: [0, 25, 0] }} transition={{ duration: isMobile ? 12 : 10, repeat: Infinity }} />
        <motion.div className="absolute bottom-[-80px] right-[-80px] w-[420px] h-[420px] rounded-full bg-[#8B5CF6]/20 blur-3xl" animate={isMobile ? { x: [0, -10, 0], y: [0, -8, 0] } : { x: [0, -35, 0], y: [0, -20, 0] }} transition={{ duration: isMobile ? 12 : 11, repeat: Infinity }} />
      </div>

      <section className="relative z-10 min-h-[72vh] md:min-h-screen px-4 md:px-10 py-12 md:py-20 flex items-center">
        <div className="max-w-6xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] sm:text-xs tracking-[0.18em] uppercase text-txt-secondary mb-3"
          >
            Partner Demo Experience
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-7xl font-heading font-bold tracking-tight"
          >
            Turn Transactions Into <Accent>Loyalty</Accent>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 md:mt-6 text-sm sm:text-base md:text-xl text-txt-secondary max-w-2xl md:max-w-3xl mx-auto leading-6 sm:leading-7 md:leading-8"
          >
            Lynkr transforms everyday purchases into a connected rewards ecosystem that drives repeat visits, measurable <Accent tone="amber">Revenue</Accent>, and long-term partner growth.
          </motion.p>
          {!isMobile ? (
            <motion.div animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }} className="mt-14 inline-flex flex-col items-center text-txt-secondary">
              <span className="text-xs uppercase tracking-wider">Scroll Story</span>
              <ArrowDown className="w-5 h-5 mt-1" />
            </motion.div>
          ) : null}
        </div>
      </section>

      <section className="relative z-10 px-4 md:px-10 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className={`${cardClass} p-6 md:p-8`}>
            <h3 className="text-2xl md:text-3xl font-heading font-bold">What is <Accent>Lynkr</Accent>?</h3>
            <p className="mt-4 text-txt-secondary leading-7">
              Lynkr is a smart loyalty network connecting customers and businesses through automated rewards. A customer earns points through normal transactions, then redeems across the
              <Accent tone="teal"> Rewards</Accent> ecosystem. This creates more repeat behavior and stronger customer lifetime value.
            </p>
          </div>
          <div className="relative h-[360px] flex items-center justify-center">
            <div className="relative w-[300px] h-[300px]">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#3B82F6]/50" />
              <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}>
                <div className="absolute left-1/2 -translate-x-1/2 -top-2"><ArrowRight className="text-[#14B8A6]" /></div>
              </motion.div>
              {[
                ['Customer', Users, 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'],
                ['Partner Store', Store, 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2'],
                ['Earn Points', Zap, 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'],
                ['Redeem Rewards', Gift, 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2'],
              ].map(([label, Icon, pos], i) => (
                <motion.div key={label} initial={{ opacity: 0, scale: 0.88 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className={`absolute ${pos} ${cardClass} px-3 py-2 text-sm`}>
                  <Icon className="w-4 h-4 text-[#3B82F6] mx-auto mb-1" />
                  <div>{label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 md:px-10 py-16">
        <SectionTitle
          title="Customer Journey"
          subtitle="Customers shop, earn points automatically, and redeem rewards across the Loyalty Network. This repeat loop builds familiarity and keeps businesses top-of-mind."
        />
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            ['Shop', ShoppingBag, 'Customers purchase at partner stores.'],
            ['Earn', Sparkles, 'Reward points are credited instantly.'],
            ['Redeem', Gift, 'Rewards are redeemed across the network.'],
          ].map(([title, Icon, text], idx) => (
            <motion.div key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className={`${cardClass} p-6`}>
              <Icon className="w-6 h-6 text-[#14B8A6]" />
              <h4 className="text-xl font-heading font-bold mt-3">{title}</h4>
              <p className="mt-2 text-txt-secondary text-sm">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-4 md:px-10 py-16">
        <SectionTitle title="Partner Growth Metrics" subtitle="Track Revenue Growth, retention behavior, and reward redemption trends from one view." />
        <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            ['Total Customers', metrics.customers, Users],
            ['Total Transactions', metrics.transactions, ShoppingBag],
            ['Points Issued', metrics.pointsIssued, Gift],
            ['Revenue from Lynkr Users', metrics.lynkrRevenue, CircleDollarSign],
          ].map(([label, value, Icon]) => (
            <motion.div key={label} whileHover={{ y: -4 }} className={`${cardClass} p-5`}>
              <Icon className="w-5 h-5 text-[#3B82F6]" />
              <p className="text-txt-secondary text-sm mt-2">{label}</p>
              <p className="text-3xl font-heading font-bold mt-1">{Number(value).toLocaleString()}</p>
            </motion.div>
          ))}
        </div>
        <div className={`${cardClass} max-w-7xl mx-auto p-4 md:p-5 mt-4`}>
          <div className="h-[240px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="#A3A3A3" />
                <YAxis stroke="#A3A3A3" />
                <Tooltip />
                <Line dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={false} />
                <Line dataKey="retention" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                <Line dataKey="redemption" stroke="#14B8A6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 md:px-10 py-16">
        <SectionTitle title="Interactive Demo Controls" subtitle="Simulate partner-side actions and instantly visualize business impact." />
        <div className="max-w-7xl mx-auto mt-8 flex flex-wrap gap-3 justify-center">
          <Button className="rounded-xl bg-[#3B82F6] hover:bg-[#2b71e8] min-h-11" onClick={simulateVisit}>Simulate Customer Visit</Button>
          <Button variant="outline" className="rounded-xl border-border text-foreground hover:bg-muted min-h-11" onClick={simulateRedemption}>Simulate Reward Redemption</Button>
          <Button variant="outline" className="rounded-xl border-border text-foreground hover:bg-muted min-h-11" onClick={simulateCampaign}>Simulate Campaign Launch</Button>
        </div>
      </section>

      <section className="relative z-10 px-4 md:px-10 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`${cardClass} p-5`}>
            <h3 className="text-2xl font-heading font-bold">Customer Insights</h3>
            <p className="text-txt-secondary text-sm mt-2">Visit frequency and engagement patterns.</p>
            <div className="h-[220px] md:h-[280px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insightsData}>
                  <defs>
                    <linearGradient id="insightFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="day" stroke="#A3A3A3" />
                  <YAxis stroke="#A3A3A3" />
                  <Tooltip />
                  <Area type="monotone" dataKey="visits" stroke="#14B8A6" fill="url(#insightFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={`${cardClass} p-5`}>
            <h3 className="text-2xl font-heading font-bold">Network Discovery</h3>
            <p className="text-txt-secondary text-sm mt-2">How customers move between partner businesses.</p>
            <div className="relative min-h-[280px] mt-4 rounded-xl border border-border overflow-hidden">
              {[
                ['Cafe', '18%', '18%'],
                ['Gym', '28%', '62%'],
                ['Restaurant', '62%', '26%'],
                ['Retail', '68%', '66%'],
              ].map(([label, top, left], idx) => (
                <motion.div key={label} initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="absolute px-3 py-2 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-sm" style={{ top, left }}>
                  {label}
                </motion.div>
              ))}
              <Network className="absolute bottom-4 right-4 text-[#14B8A6]/70" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 md:px-10 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ['Reward Management', Gift, 'Create configurable offers and reward rules.'],
            ['Campaign Tools', Megaphone, 'Launch targeted campaigns by behavior windows.'],
            ['Transaction Tracking', ShoppingBag, 'Monitor sales and reward attribution.'],
            ['Customer Analytics', BarChart3, 'Segment customers and optimize retention.'],
            ['Coupon Approval System', Target, 'Control offer quality and partner governance.'],
            ['Growth Dashboard', TrendingUp, 'Measure loyalty ROI and Revenue Impact over time.'],
          ].map(([title, Icon, desc], idx) => (
            <motion.div key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.07 }} whileHover={{ y: -5, scale: 1.01 }} className={`${cardClass} p-5`}>
              <Icon className="w-5 h-5 text-[#8B5CF6]" />
              <p className="font-semibold mt-3">{title}</p>
              <p className="text-xs mt-2 text-txt-secondary">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-4 md:px-10 py-20">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`${cardClass} max-w-5xl mx-auto p-10 border border-[#14B8A6]/40 text-center`}>
          <h3 className="text-3xl md:text-5xl font-heading font-bold">Become a Lynkr Partner</h3>
          <p className="text-txt-secondary mt-4 max-w-2xl mx-auto">
            Join the Lynkr ecosystem and turn everyday transactions into long-term customer loyalty with measurable business growth.
          </p>
          <div className="mt-8">
            <Button
              className="rounded-xl min-h-11 px-6 bg-[#3B82F6] hover:bg-[#2b71e8]"
              onClick={() => navigate('/partners')}
            >
              Get Started Today
              <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.1, repeat: Infinity }}>
                <ArrowRight className="ml-2 w-4 h-4" />
              </motion.span>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default PartnerDemoExperience;
