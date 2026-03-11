import React, { useMemo, useState } from 'react';
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

const cardClass = 'rounded-2xl border border-white/10 bg-[#171717]/70 backdrop-blur shadow-[0_14px_40px_rgba(10,18,40,0.45)]';

const AnimatedValue = ({ value, prefix = '', suffix = '', isMobile = false }) => (
  <motion.span
    key={`${prefix}${value}${suffix}`}
    initial={{ opacity: 0.2, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-heading font-bold text-[#FAFAFA]`}
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
    <div className="min-h-screen bg-[#050506] text-[#FAFAFA]">
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

      <div className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-heading font-bold">Lynkr Partner Demo Dashboard</h1>
            <p className="text-[#A3A3A3] text-xs sm:text-sm">Live simulation of partner experience inside Lynkr</p>
          </div>
          <div className="w-full lg:w-auto flex gap-2 flex-nowrap overflow-x-auto pb-1">
            <Dialog open={tourOpen} onOpenChange={setTourOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl border-white/20 text-white hover:bg-white/10 whitespace-nowrap min-h-11">
                  <Info className="w-4 h-4 mr-2" />
                  Dashboard Tour
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
            <Button className="rounded-xl bg-[#3B82F6] hover:bg-[#2b71e8] whitespace-nowrap min-h-11" onClick={simulateCampaign}>
              Simulate Campaign
            </Button>
            <Button variant="outline" className="rounded-xl border-white/20 text-white hover:bg-white/10 whitespace-nowrap min-h-11" onClick={simulateRewardRedemption}>
              Simulate Reward Redemption
            </Button>
            <Button variant="outline" className="rounded-xl border-white/20 text-white hover:bg-white/10 whitespace-nowrap min-h-11" onClick={simulateCustomerVisit}>
              Simulate Customer Visit
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-6">
        <aside className={`${cardClass} p-3 lg:p-4 h-fit lg:sticky lg:top-24`}>
          <p className="text-xs tracking-wider text-[#A3A3A3] uppercase mb-3">Navigation</p>
          <div className="flex lg:block gap-2 overflow-x-auto pb-1">
            {[
              ['Overview', TrendingUp],
              ['Rewards', Gift],
              ['Transactions', ShoppingBag],
              ['Customers', Users],
              ['Campaigns', Megaphone],
              ['Analytics', BarChart3],
            ].map(([label, Icon]) => (
              <button key={label} type="button" className="w-auto lg:w-full whitespace-nowrap text-left px-3 py-2 rounded-lg hover:bg-white/5 transition flex items-center gap-2 min-h-11">
                <Icon className="w-4 h-4 text-[#3B82F6]" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-6">
          {/* Section 1 */}
          <section id="overview" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              ['Total Transactions', metrics.totalTransactions, '', ShoppingBag],
              ['Reward Points Issued', metrics.rewardPointsIssued, ' pts', Gift],
              ['Active Customers', metrics.activeCustomers, '', Users],
              ['Revenue from Lynkr Users', metrics.revenueFromLynkr, ' INR', CircleDollarSign],
            ].map(([title, value, suffix, Icon]) => (
              <motion.div key={title} whileHover={{ y: -4 }} className={`${cardClass} p-5`}>
                <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <p className="text-sm text-[#A3A3A3]">{title}</p>
                <AnimatedValue value={value} suffix={suffix} isMobile={isMobile} />
              </motion.div>
            ))}
          </section>

          {/* Section 2 */}
          <section className={`${cardClass} p-4 md:p-5`}>
            <h2 className="text-xl font-heading font-bold">Revenue Impact</h2>
            <p className="text-sm text-[#A3A3A3] mb-4">Monthly revenue growth, reward-driven purchases, and repeat visit rate.</p>
            <div className="h-[260px] md:h-[320px]">
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

          {/* Section 3 */}
          <section className={`${cardClass} p-4 md:p-5`}>
            <h2 className="text-xl font-heading font-bold">Customer Loyalty Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {rings.map((ring) => (
                <div key={ring.label} className="rounded-xl border border-white/10 p-4 text-center">
                  <div
                    className="mx-auto w-24 h-24 rounded-full grid place-items-center"
                    style={{ background: `conic-gradient(${ring.color} ${ring.value * 3.6}deg, rgba(255,255,255,0.08) 0)` }}
                  >
                    <div className="w-16 h-16 rounded-full bg-[#050506] grid place-items-center">
                      <span className="font-heading font-bold">{ring.value}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#A3A3A3] mt-3">{ring.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 + 5 */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className={`${cardClass} p-4 md:p-5`}>
              <h2 className="text-xl font-heading font-bold">Rewards Management</h2>
              <div className="space-y-3 mt-4">
                {[
                  ['Free Coffee after 10 visits', 'Redemption rate: 38%'],
                  ['10% off next purchase', 'Redemption rate: 42%'],
                  ['Exclusive partner rewards', 'Redemption rate: 26%'],
                ].map(([title, detail]) => (
                  <motion.div key={title} whileHover={{ y: -3 }} className="rounded-xl border border-white/10 p-4">
                    <p className="font-semibold">{title}</p>
                    <p className="text-xs text-[#A3A3A3] mt-1">{detail}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className={`${cardClass} p-4 md:p-5`}>
              <h2 className="text-xl font-heading font-bold">Campaign Tools</h2>
              <div className="space-y-3 mt-4">
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
                    whileHover={{ y: -4 }}
                    className="rounded-xl border border-white/10 p-4 flex items-center gap-3"
                  >
                    <Icon className="w-5 h-5 text-[#14B8A6]" />
                    <p>{title}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className={`${cardClass} p-4 md:p-5`}>
            <h2 className="text-xl font-heading font-bold">Customer Insights</h2>
            <p className="text-sm text-[#A3A3A3] mb-4">Visit frequency and spending patterns.</p>
            <div className="h-[240px] md:h-[300px]">
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

          {/* Section 7 */}
          <section className={`${cardClass} p-4 md:p-5`}>
            <h2 className="text-xl font-heading font-bold">Partner Network Discovery</h2>
            <p className="text-sm text-[#A3A3A3] mb-4">How customers flow between partner businesses.</p>
            <div className="relative min-h-[260px] rounded-xl border border-white/10 overflow-hidden">
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

          {/* Section 8 */}
          <section className={`${cardClass} p-6 md:p-8 border border-[#14B8A6]/40`}>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-center">Grow Your Business with Lynkr</h2>
            <p className="text-center text-[#A3A3A3] mt-3 max-w-2xl mx-auto">
              Turn everyday transactions into customer loyalty and measurable revenue growth.
            </p>
            <div className="flex justify-center mt-6">
              <Button className="rounded-xl bg-[#3B82F6] hover:bg-[#2b71e8]">
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
