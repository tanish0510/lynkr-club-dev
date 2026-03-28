import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  BarChart3,
  CircleDollarSign,
  Gift,
  Info,
  Megaphone,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import useIsMobile from '@/hooks/useIsMobile';

const cardClass = 'rounded-2xl border border-border bg-card backdrop-blur shadow-[0_14px_40px_rgba(10,18,40,0.45)]';
const cardClassCompact = 'rounded-xl border border-border bg-card backdrop-blur shadow-lg shrink-0';

const AnimatedValue = ({ value, prefix = '', suffix = '', isMobile = false }) => (
  <motion.span
    key={`${prefix}${value}${suffix}`}
    initial={{ opacity: 0.2, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-heading font-bold text-foreground`}
  >
    {prefix}
    {Number(value).toLocaleString()}
    {suffix}
  </motion.span>
);

const initialRevenue = [
  { month: 'Jan', revenue: 120, rewardSales: 34, repeatRate: 28 },
  { month: 'Feb', revenue: 136, rewardSales: 41, repeatRate: 31 },
  { month: 'Mar', revenue: 149, rewardSales: 48, repeatRate: 34 },
  { month: 'Apr', revenue: 162, rewardSales: 56, repeatRate: 37 },
  { month: 'May', revenue: 174, rewardSales: 61, repeatRate: 40 },
  { month: 'Jun', revenue: 189, rewardSales: 68, repeatRate: 43 },
];

const initialInsights = [
  { name: 'Mon', visits: 35, spend: 12 },
  { name: 'Tue', visits: 42, spend: 16 },
  { name: 'Wed', visits: 38, spend: 14 },
  { name: 'Thu', visits: 46, spend: 18 },
  { name: 'Fri', visits: 58, spend: 25 },
  { name: 'Sat', visits: 64, spend: 30 },
  { name: 'Sun', visits: 49, spend: 20 },
];

const AdminPartnerDemoDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [metrics, setMetrics] = useState({
    totalTransactions: 2489,
    rewardPointsIssued: 128400,
    activeCustomers: 1320,
    revenueFromLynkr: 428000,
    repeatCustomers: 61,
    avgSpendIncrease: 22,
    retentionRate: 74,
  });
  const [revenueData, setRevenueData] = useState(initialRevenue);
  const [insightsData, setInsightsData] = useState(initialInsights);
  const [tourOpen, setTourOpen] = useState(false);

  const simulateCampaign = () => {
    setMetrics((m) => ({
      ...m,
      totalTransactions: m.totalTransactions + 36,
      activeCustomers: m.activeCustomers + 18,
      revenueFromLynkr: m.revenueFromLynkr + 22000,
      avgSpendIncrease: Math.min(35, m.avgSpendIncrease + 1),
    }));
    setRevenueData((rows) =>
      rows.map((r, i) => (i === rows.length - 1 ? { ...r, revenue: r.revenue + 12, rewardSales: r.rewardSales + 8 } : r))
    );
  };

  const simulateRewardRedemption = () => {
    setMetrics((m) => ({
      ...m,
      rewardPointsIssued: m.rewardPointsIssued + 5400,
      repeatCustomers: Math.min(85, m.repeatCustomers + 2),
      retentionRate: Math.min(90, m.retentionRate + 1),
    }));
    setInsightsData((rows) =>
      rows.map((r) => ({ ...r, visits: r.visits + (Math.random() > 0.5 ? 2 : 1) }))
    );
  };

  const simulateCustomerVisit = () => {
    setMetrics((m) => ({
      ...m,
      totalTransactions: m.totalTransactions + 9,
      activeCustomers: m.activeCustomers + 4,
      revenueFromLynkr: m.revenueFromLynkr + 5200,
    }));
  };

  const rings = useMemo(
    () => [
      { label: 'Repeat customers', value: metrics.repeatCustomers, color: '#14B8A6' },
      { label: 'Avg spend increase', value: metrics.avgSpendIncrease, color: '#3B82F6' },
      { label: 'Retention rate', value: metrics.retentionRate, color: '#8B5CF6' },
    ],
    [metrics]
  );

  return (
    <div className="min-h-screen bg-surface-page text-foreground pb-[env(safe-area-inset-bottom)]">
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-[#3B82F6]/20 blur-3xl"
          animate={isMobile ? { x: [0, 10, 0], y: [0, 8, 0] } : { x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: isMobile ? 12 : 9, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[-90px] right-[-60px] w-[380px] h-[380px] rounded-full bg-[#8B5CF6]/20 blur-3xl"
          animate={isMobile ? { x: [0, -10, 0], y: [0, -8, 0] } : { x: [0, -20, 0], y: [0, -25, 0] }}
          transition={{ duration: isMobile ? 12 : 10, repeat: Infinity }}
        />
      </div>

      <header className="sticky top-0 z-20 border-b border-border bg-surface-page/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-2xl font-heading font-bold truncate">Lynkr Partner Demo</h1>
            <p className="text-txt-secondary text-[11px] sm:text-xs md:text-sm truncate">Live simulation of partner experience</p>
          </div>
          <div className="flex gap-2 flex-nowrap overflow-x-auto pb-1 -mx-1 px-1 hide-scrollbar snap-x snap-mandatory">
            <Dialog open={tourOpen} onOpenChange={setTourOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl border-border text-foreground hover:bg-muted whitespace-nowrap min-h-10 sm:min-h-11 shrink-0 snap-start px-3">
                  <Info className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard Tour</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Live Demo Dashboard Tour</DialogTitle>
                  <DialogDescription>What this simulation shows and what each action triggers.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground">Business Overview</p>
                    <p>Shows key partner KPIs: transaction volume, points issued, active customers, and Lynkr-driven revenue.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Simulate Campaign</p>
                    <p>Demonstrates campaign launch impact by increasing transactions, active users, and revenue trend values.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Simulate Reward Redemption</p>
                    <p>Shows loyalty loop effects: more points issued, repeat customer rate increase, and stronger retention.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Simulate Customer Visit</p>
                    <p>Represents incremental daily demand and updates core KPI cards instantly.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">From our side</p>
                    <p>In production, these actions correspond to backend event processing, reward issuance logic, and analytics updates.</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button className="rounded-xl bg-[#3B82F6] hover:bg-[#2b71e8] whitespace-nowrap min-h-10 sm:min-h-11 shrink-0 snap-start px-3 text-sm" onClick={simulateCampaign}>
              <Megaphone className="w-4 h-4 sm:mr-2" />
              Campaign
            </Button>
            <Button variant="outline" className="rounded-xl border-border text-foreground hover:bg-muted whitespace-nowrap min-h-10 sm:min-h-11 shrink-0 snap-start px-3 text-sm" onClick={simulateRewardRedemption}>
              <Gift className="w-4 h-4 sm:mr-2" />
              Rewards
            </Button>
            <Button variant="outline" className="rounded-xl border-border text-foreground hover:bg-muted whitespace-nowrap min-h-10 sm:min-h-11 shrink-0 snap-start px-3 text-sm" onClick={simulateCustomerVisit}>
              <Users className="w-4 h-4 sm:mr-2" />
              Customer
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-4 sm:gap-6">
        <aside className={`${cardClass} p-2 sm:p-3 lg:p-4 h-fit lg:sticky lg:top-24 order-2 lg:order-1`}>
          <p className="text-[10px] sm:text-xs tracking-wider text-txt-secondary uppercase mb-2 sm:mb-3 px-1">Navigation</p>
          <div className="flex lg:flex-col gap-1 sm:gap-2 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar snap-x snap-mandatory">
            {[
              ['Overview', TrendingUp, '#3B82F6'],
              ['Rewards', Gift, '#14B8A6'],
              ['Transactions', ShoppingBag, '#8B5CF6'],
              ['Customers', Users, '#A3A3A3'],
              ['Campaigns', Megaphone, '#A3A3A3'],
              ['Analytics', BarChart3, '#A3A3A3'],
            ].map(([label, Icon, color]) => (
              <button
                key={label}
                type="button"
                className="w-auto lg:w-full whitespace-nowrap text-left px-2.5 sm:px-3 py-2 rounded-xl hover:bg-muted active:bg-muted/50 transition flex items-center gap-2 min-h-10 sm:min-h-11 shrink-0 snap-start touch-manipulation"
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                <span className="text-xs sm:text-sm">{label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-4 sm:space-y-6 order-1 lg:order-2 min-w-0">
          {/* Stats: horizontal scroll on mobile, grid on desktop */}
          <section id="overview" className="flex sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar snap-x snap-mandatory">
            {[
              ['Total Transactions', metrics.totalTransactions, '', ShoppingBag, '#3B82F6'],
              ['Reward Points Issued', metrics.rewardPointsIssued, ' pts', Gift, '#14B8A6'],
              ['Active Customers', metrics.activeCustomers, '', Users, '#8B5CF6'],
              ['Revenue from Lynkr', metrics.revenueFromLynkr, ' INR', CircleDollarSign, '#10B981'],
            ].map(([title, value, suffix, Icon, accent]) => (
              <motion.div
                key={title}
                whileHover={!isMobile ? { y: -4 } : {}}
                className={`${isMobile ? cardClassCompact : cardClass} p-4 sm:p-5 min-w-[72vw] sm:min-w-0 w-full sm:w-auto snap-start shrink-0 sm:shrink`}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 shrink-0" style={{ backgroundColor: `${accent}20` }}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" style={{ color: accent }} />
                </div>
                <p className="text-xs sm:text-sm text-txt-secondary truncate">{title}</p>
                <AnimatedValue value={value} suffix={suffix} isMobile={isMobile} />
              </motion.div>
            ))}
          </section>

          {/* Quick actions: horizontal strip on mobile (optional duplicate — actions are in header) */}

          {/* Activity feed: mobile-first vertical list */}
          <section className={`${cardClass} p-4 sm:p-5`}>
            <h2 className="text-base sm:text-lg font-heading font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#14B8A6]" />
              Recent activity
            </h2>
            <p className="text-xs text-txt-secondary mb-3">Simulation events and updates</p>
            <ul className="space-y-2">
              {[
                { label: 'Campaign launch', detail: 'Double Points Tuesday', time: 'Just now', icon: Megaphone, color: '#3B82F6' },
                { label: 'Reward redeemed', detail: '10% off next purchase', time: '2m ago', icon: Gift, color: '#14B8A6' },
                { label: 'New transaction', detail: 'user@lynkr.club • ₹2,499', time: '5m ago', icon: ShoppingBag, color: '#8B5CF6' },
                { label: 'Points issued', detail: '128,400 pts total', time: '1h ago', icon: Sparkles, color: '#10B981' },
              ].map(({ label, detail, time, icon: Icon, color }) => (
                <li key={label} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 touch-manipulation">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{label}</p>
                    <p className="text-xs text-txt-secondary truncate">{detail}</p>
                  </div>
                  <span className="text-[10px] text-txt-secondary shrink-0">{time}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Revenue Impact */}
          <section className={`${cardClass} p-4 md:p-5`}>
            <h2 className="text-base sm:text-xl font-heading font-bold">Revenue Impact</h2>
            <p className="text-xs sm:text-sm text-txt-secondary mb-3 sm:mb-4">Monthly revenue growth and reward-driven purchases.</p>
            <div className="h-[200px] sm:h-[260px] md:h-[320px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="month" stroke="#A3A3A3" />
                  <YAxis stroke="#A3A3A3" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={false} name="Revenue Growth" />
                  <Line type="monotone" dataKey="rewardSales" stroke="#14B8A6" strokeWidth={2} dot={false} name="Reward-Driven Purchases" />
                  <Line type="monotone" dataKey="repeatRate" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Repeat Visit Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Customer Loyalty Metrics: horizontal scroll on mobile */}
          <section className={`${cardClass} p-4 md:p-5`}>
            <h2 className="text-base sm:text-xl font-heading font-bold">Customer Loyalty Metrics</h2>
            <div className="flex md:grid md:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar snap-x snap-mandatory">
              {rings.map((ring) => (
                <div key={ring.label} className="rounded-xl border border-border p-4 text-center min-w-[140px] sm:min-w-0 shrink-0 snap-center md:shrink">
                  <div
                    className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full grid place-items-center"
                    style={{ background: `conic-gradient(${ring.color} ${ring.value * 3.6}deg, rgba(255,255,255,0.08) 0)` }}
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-surface-page grid place-items-center">
                      <span className="text-sm sm:text-base font-heading font-bold">{ring.value}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-sm text-txt-secondary mt-2 sm:mt-3 line-clamp-2">{ring.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Rewards + Campaigns */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className={`${cardClass} p-4 md:p-5`}>
              <h2 className="text-base sm:text-xl font-heading font-bold">Rewards Management</h2>
              <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
                {[
                  ['Free Coffee after 10 visits', 'Redemption rate: 38%'],
                  ['10% off next purchase', 'Redemption rate: 42%'],
                  ['Exclusive partner rewards', 'Redemption rate: 26%'],
                ].map(([title, detail]) => (
                  <motion.div key={title} whileHover={!isMobile ? { y: -3 } : {}} className="rounded-xl border border-border p-3 sm:p-4">
                    <p className="text-sm sm:text-base font-semibold truncate">{title}</p>
                    <p className="text-[10px] sm:text-xs text-txt-secondary mt-0.5">{detail}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className={`${cardClass} p-4 md:p-5`}>
              <h2 className="text-base sm:text-xl font-heading font-bold">Campaign Tools</h2>
              <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
                {[
                  ['Double Points Tuesday', Sparkles],
                  ['Weekend Bonus Rewards', Target],
                  ['Happy Hour Promotions', Megaphone],
                ].map(([title, Icon], idx) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 }}
                    whileHover={!isMobile ? { y: -4 } : {}}
                    className="rounded-xl border border-border p-3 sm:p-4 flex items-center gap-3 touch-manipulation"
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#14B8A6] shrink-0" />
                    <p className="text-sm sm:text-base truncate">{title}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Customer Insights */}
          <section className={`${cardClass} p-4 md:p-5`}>
            <h2 className="text-base sm:text-xl font-heading font-bold">Customer Insights</h2>
            <p className="text-xs sm:text-sm text-txt-secondary mb-3 sm:mb-4">Visit frequency and spending patterns.</p>
            <div className="h-[200px] sm:h-[240px] md:h-[300px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insightsData}>
                  <defs>
                    <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="#A3A3A3" />
                  <YAxis stroke="#A3A3A3" />
                  <Tooltip />
                  <Area type="monotone" dataKey="visits" stroke="#3B82F6" fill="url(#visitsFill)" />
                  <Bar dataKey="spend" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Partner Network Discovery: compact on mobile */}
          <section className={`${cardClass} p-4 md:p-5`}>
            <h2 className="text-base sm:text-xl font-heading font-bold">Partner Network Discovery</h2>
            <p className="text-xs sm:text-sm text-txt-secondary mb-3 sm:mb-4">How customers flow between partner businesses.</p>
            <div className="relative min-h-[180px] sm:min-h-[260px] rounded-xl border border-border overflow-hidden">
              {[
                ['Cafe', '18%', '20%'],
                ['Gym', '26%', '62%'],
                ['Restaurant', '64%', '28%'],
                ['Retail', '66%', '68%'],
              ].map(([name, top, left], idx) => (
                <motion.div
                  key={name}
                  className="absolute px-3 py-2 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-sm"
                  style={{ top, left }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  {name}
                </motion.div>
              ))}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {['M 22 24 C 40 32, 54 31, 68 28', 'M 22 24 C 30 45, 33 55, 30 67', 'M 68 28 C 69 45, 69 56, 68 67', 'M 30 67 C 43 70, 55 70, 68 67'].map((d, i) => (
                  <motion.path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="rgba(20,184,166,0.75)"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: i * 0.1 }}
                  />
                ))}
              </svg>
            </div>
          </section>

          {/* CTA */}
          <section className={`${cardClass} p-4 sm:p-6 md:p-8 border border-[#14B8A6]/40`}>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-heading font-bold text-center">Grow Your Business with Lynkr</h2>
            <p className="text-center text-xs sm:text-sm text-txt-secondary mt-2 sm:mt-3 max-w-2xl mx-auto px-1">
              Turn everyday transactions into customer loyalty and measurable revenue growth.
            </p>
            <div className="flex justify-center mt-4 sm:mt-6">
              <Button
                className="rounded-xl bg-[#3B82F6] hover:bg-[#2b71e8] min-h-11 w-full sm:w-auto touch-manipulation"
                onClick={() => navigate('/partners')}
              >
                Become a Lynkr Partner
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.1, repeat: Infinity }}>
                  <TrendingUp className="w-4 h-4 ml-2" />
                </motion.span>
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminPartnerDemoDashboard;
