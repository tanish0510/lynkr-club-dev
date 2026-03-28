import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  Package,
  Gift,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Users,
  Receipt,
  Sparkles,
  CalendarClock,
  Crown,
  Zap,
  AlertTriangle,
  Flag,
  ShoppingBag,
  Activity,
  XCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import api from '@/utils/api';
import StatusBadge from '@/components/partner/StatusBadge';
import { PageSkeleton } from '@/components/partner/SkeletonPulse';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtCurrency = (n) => `₹${fmt(n)}`;

const CARD = 'rounded-2xl border border-white/[0.06] bg-[#0A0A0A]';
const GLOW_HOVER = 'transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]';

const MS_DAY = 86400000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.getTime();
}

function windowSum(list, startMs, endMs) {
  return (list || []).reduce((s, p) => {
    const t = new Date(p.created_at).getTime();
    return t >= startMs && t <= endMs ? s + Number(p.amount || 0) : s;
  }, 0);
}

function windowCount(list, startMs, endMs) {
  return (list || []).filter((p) => {
    const t = new Date(p.created_at).getTime();
    return t >= startMs && t <= endMs;
  }).length;
}

function buildSeries(list, days) {
  const now = new Date();
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const s = startOfDay(d);
    const e = endOfDay(d);
    series.push({
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: windowSum(list, s, e),
    });
  }
  return series;
}

function trendPct(cur, prev) {
  if (!prev && !cur) return null;
  if (!prev) return 100;
  return Math.round(((cur - prev) / prev) * 100);
}

function peakHour(list) {
  if (!list || list.length < 3) return null;
  const h = new Array(24).fill(0);
  list.forEach((p) => { h[new Date(p.created_at).getHours()] += 1; });
  let best = 0;
  h.forEach((c, i) => { if (c > h[best]) best = i; });
  if (h[best] === 0) return null;
  const f = (x) => {
    if (x === 0) return '12 AM';
    if (x < 12) return `${x} AM`;
    if (x === 12) return '12 PM';
    return `${x - 12} PM`;
  };
  return `${f(best)} – ${f((best + 2) % 24)}`;
}

function topCustomers(list, limit = 3) {
  const m = {};
  (list || []).forEach((p) => {
    const e = p.user_lynkr_email || '—';
    if (!m[e]) m[e] = { email: e, total: 0, count: 0 };
    m[e].total += Number(p.amount || 0);
    m[e].count += 1;
  });
  return Object.values(m).sort((a, b) => b.total - a.total).slice(0, limit);
}

function uniqueCount(list) {
  const s = new Set();
  (list || []).forEach((p) => { if (p.user_lynkr_email) s.add(p.user_lynkr_email); });
  return s.size;
}

function repeatCount(list) {
  const m = {};
  (list || []).forEach((p) => {
    if (p.user_lynkr_email) m[p.user_lynkr_email] = (m[p.user_lynkr_email] || 0) + 1;
  });
  return Object.values(m).filter((c) => c > 1).length;
}


const EnhancedPartnerDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, purchRes] = await Promise.all([
        api.get('/partner/dashboard'),
        api.get('/partner/purchases').catch(() => ({ data: [] })),
      ]);
      if (dashRes.data.must_change_password) {
        navigate('/app/partner/first-login');
        return;
      }
      setDashboard(dashRes.data);
      setPurchases(purchRes.data || []);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (purchaseId, action) => {
    setProcessing(`${purchaseId}:${action}`);
    try {
      await api.post('/partner/verify-purchase', { purchase_id: purchaseId, action });
      toast.success(action === 'VERIFY' ? 'Verified — points credited' : 'Purchase rejected');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    } finally {
      setProcessing(null);
    }
  };

  const d = useMemo(() => {
    if (!dashboard) return null;
    const m = dashboard.metrics;
    const info = dashboard.partner_info;
    const all = purchases || [];
    const now = Date.now();

    const todayS = startOfDay(new Date());
    const todayE = endOfDay(new Date());
    const yesterdayS = todayS - MS_DAY;
    const yesterdayE = todayE - MS_DAY;

    const todayRev = windowSum(all, todayS, todayE);
    const yesterdayRev = windowSum(all, yesterdayS, yesterdayE);
    const todayOrders = windowCount(all, todayS, todayE);

    const weekRev = windowSum(all, now - 7 * MS_DAY, now);
    const prevWeekRev = windowSum(all, now - 14 * MS_DAY, now - 7 * MS_DAY);
    const weekOrders = windowCount(all, now - 7 * MS_DAY, now);
    const prevWeekOrders = windowCount(all, now - 14 * MS_DAY, now - 7 * MS_DAY);

    const monthRev = windowSum(all, now - 30 * MS_DAY, now);
    const prevMonthRev = windowSum(all, now - 60 * MS_DAY, now - 30 * MS_DAY);

    const pending = all.filter((p) => p.status === 'PENDING');
    const flagged = all.filter((p) => ['DISPUTED', 'FLAGGED', 'REJECTED'].includes(p.status));
    const verified = all.filter((p) => ['VERIFIED', 'ACKNOWLEDGED'].includes(p.status));

    const highValue = [...all].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 3);
    const avgOrder = m.total_orders > 0 ? Math.round(m.total_value / m.total_orders) : 0;
    const verifyRate = m.total_orders > 0 ? Math.round((m.acknowledged_orders / m.total_orders) * 100) : 0;
    const unique = uniqueCount(all);
    const repeats = repeatCount(all);
    const repeatPct = unique > 0 ? Math.round((repeats / unique) * 100) : 0;

    const series = buildSeries(all, 7);

    const insights = [];
    const weekTrend = trendPct(weekRev, prevWeekRev);
    if (weekTrend !== null && weekRev > 0) {
      insights.push({
        icon: weekTrend >= 0 ? TrendingUp : TrendingDown,
        text: weekTrend >= 0
          ? `Revenue up +${weekTrend}% this week`
          : `Revenue down ${weekTrend}% this week`,
        color: weekTrend >= 0 ? 'emerald' : 'red',
      });
    }
    if (repeatPct >= 20 && repeats > 0) {
      insights.push({
        icon: Users,
        text: `${repeatPct}% of orders from repeat customers`,
        color: 'violet',
      });
    }
    const peak = peakHour(all);
    if (peak) {
      insights.push({
        icon: CalendarClock,
        text: `Peak activity: ${peak}`,
        color: 'blue',
      });
    }
    if (pending.length > 0) {
      insights.push({
        icon: AlertTriangle,
        text: `${pending.length} order${pending.length > 1 ? 's' : ''} need verification`,
        color: 'amber',
      });
    }
    if (weekOrders > prevWeekOrders && prevWeekOrders > 0) {
      const ot = trendPct(weekOrders, prevWeekOrders);
      insights.push({
        icon: ArrowUpRight,
        text: `Order volume up +${ot}% vs last week`,
        color: 'blue',
      });
    }
    const topCustomer = topCustomers(all, 1)[0];
    if (topCustomer && topCustomer.total > 0) {
      insights.push({
        icon: Crown,
        text: `Top customer spent ${fmtCurrency(topCustomer.total)} (${topCustomer.count} orders)`,
        color: 'amber',
      });
    }

    const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

    const recent = [...all].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
    const top3 = topCustomers(all, 3);

    return {
      m, info, greeting, todayRev, yesterdayRev, todayOrders,
      weekRev, prevWeekRev, monthRev, prevMonthRev,
      pending, flagged, highValue, avgOrder, verifyRate,
      unique, repeats, repeatPct, series, insights,
      recent, top3, verified,
    };
  }, [dashboard, purchases]);

  if (loading || !d) return <PageSkeleton />;

  const weekTrend = trendPct(d.weekRev, d.prevWeekRev);

  const attentionItems = [];
  if (d.pending.length > 0) {
    attentionItems.push({
      icon: Clock, color: 'amber',
      label: `${d.pending.length} order${d.pending.length > 1 ? 's' : ''} to verify`,
      sub: 'Verify to credit user points',
      to: '/app/partner/orders?status=pending',
    });
  }
  if (d.flagged.length > 0) {
    attentionItems.push({
      icon: Flag, color: 'red',
      label: `${d.flagged.length} flagged order${d.flagged.length > 1 ? 's' : ''}`,
      sub: 'Review flagged/returned orders',
      to: '/app/partner/orders?status=flagged',
    });
  }
  d.highValue.forEach((p) => {
    if (Number(p.amount) >= d.avgOrder * 2 && p.status === 'PENDING') {
      attentionItems.push({
        icon: Sparkles, color: 'blue',
        label: `High-value order: ${fmtCurrency(p.amount)}`,
        sub: p.user_lynkr_email || 'Unknown user',
        to: '/app/partner/orders?status=pending',
      });
    }
  });

  const colorMap = {
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-l-emerald-500' },
    red: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-l-red-500' },
    violet: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-l-violet-500' },
    blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-l-blue-500' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-l-amber-500' },
  };

  return (
    <div className="max-w-5xl space-y-6 pb-10">

      {/* ═══ GREETING ═══ */}
      <section className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-heading text-foreground">
            {d.greeting}, {d.info.business_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening with your store.</p>
        </div>
        <span className="shrink-0 rounded-full ring-2 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.25)]">
          <StatusBadge status={d.info.status} />
        </span>
      </section>

      {/* ═══ REVENUE HERO ═══ */}
      <section className={`${CARD} overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.08)] ${GLOW_HOVER}`}>
        <div className="px-5 pt-5 pb-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Revenue</p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tabular-nums">
                {fmtCurrency(d.m.total_value)}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {weekTrend !== null && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${weekTrend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {weekTrend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {weekTrend >= 0 ? '+' : ''}{weekTrend}% vs last week
                  </span>
                )}
                {d.todayRev > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Today: <span className="text-foreground font-semibold tabular-nums">{fmtCurrency(d.todayRev)}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="hidden sm:block w-[180px] h-[60px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.series} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="homeRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#homeRevGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 border-t border-white/[0.06] divide-x divide-white/[0.06]">
          {[
            { label: 'This Week', value: fmtCurrency(d.weekRev) },
            { label: 'Avg Order', value: fmtCurrency(d.avgOrder) },
            { label: 'Customers', value: fmt(d.unique) },
            { label: 'Repeat Rate', value: `${d.repeatPct}%` },
          ].map((s) => (
            <div key={s.label} className="py-2.5 px-2 sm:px-4 text-center">
              <p className="text-sm sm:text-lg font-bold font-heading text-foreground tabular-nums">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ NEEDS YOUR ATTENTION ═══ */}
      {attentionItems.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Needs Your Attention
          </h2>
          <div className="space-y-2">
            {attentionItems.map((item, idx) => {
              const c = colorMap[item.color] || colorMap.blue;
              return (
                <button
                  key={idx}
                  onClick={() => navigate(item.to)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border ${`border-${item.color}-500/20`} bg-${item.color}-500/[0.04] text-left hover:bg-${item.color}-500/[0.08] active:scale-[0.99] transition-all duration-200`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.bg}`}>
                    <item.icon className={`h-4 w-4 ${c.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.sub}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ "YOU'RE DOING GREAT" (when no attention needed) ═══ */}
      {attentionItems.length === 0 && d.m.total_orders > 0 && (
        <section className={`${CARD} p-5 ${GLOW_HOVER} border-emerald-500/15`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">You're doing great — all caught up</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {d.verified.length > 0
                  ? `${d.verified.length} order${d.verified.length > 1 ? 's' : ''} verified. Keep your catalog fresh to attract more customers.`
                  : 'Your store is running smoothly. Check your insights for growth opportunities.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3 ml-[52px]">
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg h-7 text-[11px] px-3 border-white/[0.08]"
              onClick={() => navigate('/app/partner/growth')}
            >
              View Insights <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg h-7 text-[11px] px-3 border-white/[0.08]"
              onClick={() => navigate('/app/partner/catalog')}
            >
              Add Product <Plus className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </section>
      )}

      {/* ═══ QUICK ACTIONS (contextual, trending-glow style) ═══ */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            {
              icon: ShoppingBag,
              label: d.pending.length > 0 ? `Verify ${d.pending.length} Order${d.pending.length > 1 ? 's' : ''}` : 'View Orders',
              desc: d.pending.length > 0 ? 'Action needed' : `${d.m.total_orders} total`,
              to: d.pending.length > 0 ? '/app/partner/orders?status=pending' : '/app/partner/orders',
              color: '0 100% 65%',
            },
            {
              icon: Plus,
              label: 'Add Product',
              desc: 'Grow your catalog',
              to: '/app/partner/catalog',
              color: '160 84% 39%',
            },
            {
              icon: Gift,
              label: 'Create Reward',
              desc: 'Drive repeat purchases',
              to: '/app/partner/coupon-requests',
              color: '292 84% 61%',
            },
            {
              icon: TrendingUp,
              label: 'Business Insights',
              desc: 'Revenue & analytics',
              to: '/app/partner/growth',
              color: '45 100% 51%',
            },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              className="group flex items-center gap-3 p-3.5 rounded-2xl border border-white/[0.08] bg-[#0A0A0A] text-left active:scale-[0.97] transition-all duration-200 hover:border-white/[0.15] hover:bg-[#111]"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `hsl(${a.color} / 0.12)` }}
              >
                <a.icon className="w-4 h-4" style={{ color: `hsl(${a.color})` }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground leading-tight">{a.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{a.desc}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* ═══ SMART INSIGHTS ═══ */}
      {d.insights.length > 0 && (
        <section className={`${CARD} overflow-hidden`}>
          <div className="border-b border-white/[0.06] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15">
                <Zap className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Insights</h3>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {d.insights.map((ins, idx) => {
              const c = colorMap[ins.color] || colorMap.blue;
              return (
                <div key={idx} className={`flex items-center gap-3 px-5 py-3 border-l-[3px] ${c.border}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
                    <ins.icon className={`h-3.5 w-3.5 ${c.text}`} />
                  </div>
                  <p className="text-sm text-foreground">{ins.text}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ REVENUE BREAKDOWN ═══ */}
      <section className={`${CARD} overflow-hidden ${GLOW_HOVER}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06]">
          {[
            { label: 'Today', value: d.todayRev, prev: d.yesterdayRev, sub: 'vs yesterday' },
            { label: 'This Week', value: d.weekRev, prev: d.prevWeekRev, sub: 'vs prior week' },
            { label: 'This Month', value: d.monthRev, prev: d.prevMonthRev, sub: 'vs prior month' },
            { label: 'Lifetime', value: d.m.total_value, prev: null, sub: `${d.m.total_orders} orders` },
          ].map((cell) => {
            const trend = cell.prev != null ? trendPct(cell.value, cell.prev) : null;
            return (
              <div key={cell.label} className="p-4 sm:p-5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{cell.label}</p>
                <p className="text-lg sm:text-xl font-bold font-heading text-foreground tabular-nums">{fmtCurrency(cell.value)}</p>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <span className="text-[10px] text-muted-foreground">{cell.sub}</span>
                  {trend !== null && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {trend >= 0 ? '+' : ''}{trend}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ PENDING VERIFICATION ═══ */}
      {d.pending.length > 0 && (
        <section className={`${CARD} overflow-hidden ${GLOW_HOVER}`}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Needs Verification
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold tabular-nums">
                {d.pending.length}
              </span>
            </h3>
            <button onClick={() => navigate('/app/partner/orders?status=pending')} className="text-xs font-medium text-blue-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {d.pending.slice(0, 3).map((p) => (
              <div key={p.purchase_id} className="group px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.user_lynkr_email}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.order_id && `#${p.order_id} · `}
                      {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground tabular-nums shrink-0">{fmtCurrency(p.amount)}</p>
                </div>
                <div className="flex gap-2 mt-2.5 ml-12">
                  <Button
                    size="sm"
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 h-7 text-[11px] px-3"
                    disabled={processing === `${p.purchase_id}:VERIFY`}
                    onClick={() => handleVerify(p.purchase_id, 'VERIFY')}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {processing === `${p.purchase_id}:VERIFY` ? 'Verifying...' : 'Verify'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg h-7 text-[11px] px-3 border-white/[0.1]"
                    disabled={processing === `${p.purchase_id}:REJECT`}
                    onClick={() => handleVerify(p.purchase_id, 'REJECT')}
                  >
                    {processing === `${p.purchase_id}:REJECT` ? 'Rejecting...' : 'Reject'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ PERFORMANCE ═══ */}
      <section className={`${CARD} overflow-hidden ${GLOW_HOVER}`}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Performance</h3>
          <button onClick={() => navigate('/app/partner/growth')} className="text-xs font-medium text-blue-400 hover:underline flex items-center gap-1">
            Details <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06] border-t border-white/[0.06]">
          {[
            { label: 'Orders', value: fmt(d.m.total_orders), sub: `${d.m.pending_orders} pending` },
            { label: 'Verified', value: fmt(d.m.acknowledged_orders), sub: `${d.verifyRate}% rate` },
            { label: 'Avg Order', value: fmtCurrency(d.avgOrder), sub: 'per transaction' },
            { label: 'Points Issued', value: fmt(d.m.acknowledged_orders * 10), sub: 'to customers' },
          ].map((s) => (
            <div key={s.label} className="p-4 text-center">
              <p className="text-lg font-bold font-heading text-foreground tabular-nums">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TOP CUSTOMERS ═══ */}
      {d.top3.length > 0 && (
        <section className={`${CARD} overflow-hidden ${GLOW_HOVER}`}>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Top Customers</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">By total spend</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {d.top3.map((c, i) => (
              <div key={c.email} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${
                  i === 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-white/[0.04] text-muted-foreground'
                }`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{c.email}</p>
                  <p className="text-[11px] text-muted-foreground">{c.count} order{c.count > 1 ? 's' : ''}</p>
                </div>
                <p className="font-heading text-sm font-bold tabular-nums text-emerald-400 shrink-0">{fmtCurrency(c.total)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ RECENT ACTIVITY ═══ */}
      {d.recent.length > 0 && (
        <section className={`${CARD} overflow-hidden ${GLOW_HOVER}`}>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            </div>
            <button onClick={() => navigate('/app/partner/orders')} className="text-xs font-medium text-blue-400 hover:underline flex items-center gap-1">
              All orders <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {d.recent.map((p, idx) => {
              const isPending = p.status === 'PENDING';
              const isRejected = ['DISPUTED', 'FLAGGED', 'REJECTED'].includes(p.status);
              let stColor = 'text-emerald-400';
              let stLabel = 'Verified';
              let stBg = 'bg-emerald-500/15';
              let StIcon = CheckCircle2;
              if (isPending) { stColor = 'text-amber-400'; stLabel = 'Pending'; stBg = 'bg-amber-500/15'; StIcon = Clock; }
              else if (isRejected) { stColor = 'text-red-400'; stLabel = 'Flagged'; stBg = 'bg-red-500/15'; StIcon = XCircle; }

              return (
                <div key={p.purchase_id || idx} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${stBg}`}>
                    <StIcon className={`h-3.5 w-3.5 ${stColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.user_lynkr_email || 'Unknown'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      <span className={stColor}>{stLabel}</span>
                    </p>
                  </div>
                  <p className="font-heading text-sm font-bold tabular-nums text-foreground shrink-0">{fmtCurrency(p.amount)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ EMPTY STATE (no orders at all) ═══ */}
      {d.m.total_orders === 0 && (
        <section className={`${CARD} p-8 text-center ${GLOW_HOVER}`}>
          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">Set up your store</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Add products to your catalog and share your store link to start receiving orders from Lynkr users.
          </p>
          <div className="flex gap-2 justify-center mt-5">
            <Button className="rounded-xl" onClick={() => navigate('/app/partner/catalog')}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Product
            </Button>
            <Button variant="outline" className="rounded-xl border-white/[0.1]" onClick={() => navigate('/app/partner/coupon-requests')}>
              <Gift className="w-4 h-4 mr-1.5" /> Create Reward
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default EnhancedPartnerDashboard;
