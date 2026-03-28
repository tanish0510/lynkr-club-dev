import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Flag,
  Users,
  Crown,
  Activity,
  ShoppingBag,
  ChevronRight,
  CalendarClock,
  Repeat,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  CartesianGrid,
} from 'recharts';
import api from '@/utils/api';
import StatusBadge from '@/components/partner/StatusBadge';
import { PageSkeleton } from '@/components/partner/SkeletonPulse';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtCurrency = (n) => `₹${fmt(n)}`;
const CARD = 'rounded-2xl border border-white/[0.06] bg-[#0A0A0A]';

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

function buildSeries(purchases, days) {
  const now = new Date();
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(new Date(now));
    d.setDate(d.getDate() - i);
    series.push({ date: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), revenue: 0, orders: 0 });
  }
  const map = new Map(series.map((r) => [r.date, r]));
  (purchases || []).forEach((p) => {
    const key = startOfDay(new Date(p.created_at)).toISOString().slice(0, 10);
    const row = map.get(key);
    if (row) { row.revenue += Number(p.amount || 0); row.orders += 1; }
  });
  return series;
}

function windowPurchases(list, daysAgo, windowSize) {
  const now = Date.now();
  const end = now - daysAgo * 86400000;
  const start = end - windowSize * 86400000;
  return (list || []).filter((p) => { const t = new Date(p.created_at).getTime(); return t >= start && t <= end; });
}

function sum(list) { return (list || []).reduce((s, p) => s + Number(p.amount || 0), 0); }

function trend(cur, prev) { if (!prev) return cur > 0 ? 100 : 0; return Math.round(((cur - prev) / prev) * 100); }

function peakHour(list) {
  const h = new Array(24).fill(0);
  (list || []).forEach((p) => { h[new Date(p.created_at).getHours()] += 1; });
  let mx = 0; h.forEach((c, i) => { if (c > h[mx]) mx = i; });
  if (h[mx] === 0) return null;
  const f = (v) => v === 0 ? '12 AM' : v < 12 ? `${v} AM` : v === 12 ? '12 PM' : `${v - 12} PM`;
  return `${f(mx)} – ${f((mx + 2) % 24)}`;
}

function topCustomers(list, n = 5) {
  const m = {};
  (list || []).forEach((p) => {
    const e = p.user_lynkr_email || '—';
    if (!m[e]) m[e] = { email: e, total: 0, count: 0 };
    m[e].total += Number(p.amount || 0); m[e].count += 1;
  });
  return Object.values(m).sort((a, b) => b.total - a.total).slice(0, n);
}

function uniqueCount(list) { const s = new Set(); (list || []).forEach((p) => { if (p.user_lynkr_email) s.add(p.user_lynkr_email); }); return s.size; }
function repeatCount(list) { const m = {}; (list || []).forEach((p) => { if (p.user_lynkr_email) m[p.user_lynkr_email] = (m[p.user_lynkr_email] || 0) + 1; }); return Object.values(m).filter((c) => c > 1).length; }

function ChartTip({ active, payload, isOrders }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/[0.1] bg-[#141414] px-3 py-2 shadow-xl">
      <p className="text-[10px] text-zinc-500 mb-0.5">{row.label}</p>
      <p className="text-sm font-bold tabular-nums text-white">{isOrders ? `${row.orders} orders` : fmtCurrency(row.revenue)}</p>
    </div>
  );
}

const PartnerGrowthDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/partner/dashboard'),
      api.get('/partner/purchases').catch(() => ({ data: [] })),
    ])
      .then(([dRes, pRes]) => { setDashboard(dRes.data); setPurchases(pRes.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const d = useMemo(() => {
    if (!dashboard) return null;
    const m = dashboard.metrics || {};
    const all = purchases || [];

    const todayStart = startOfDay(new Date()).getTime();
    const todayP = all.filter((p) => new Date(p.created_at).getTime() >= todayStart);
    const todayRev = sum(todayP);
    const todayOrd = todayP.length;

    const thisWeek = windowPurchases(all, 0, 7);
    const lastWeek = windowPurchases(all, 7, 7);
    const thisMonth = windowPurchases(all, 0, 30);
    const lastMonth = windowPurchases(all, 30, 30);

    const weekRev = sum(thisWeek);
    const prevWeekRev = sum(lastWeek);
    const monthRev = sum(thisMonth);
    const prevMonthRev = sum(lastMonth);

    const pending = all.filter((p) => p.status === 'PENDING');
    const flagged = all.filter((p) => p.status === 'DISPUTED' || p.status === 'FLAGGED' || p.status === 'REJECTED');
    const verified = all.filter((p) => p.status === 'VERIFIED');

    const unique = uniqueCount(all);
    const repeats = repeatCount(all);
    const repeatPct = unique > 0 ? Math.round((repeats / unique) * 100) : 0;
    const avgOrder = all.length > 0 ? Math.round(sum(all) / all.length) : 0;
    const verifyRate = m.total_orders > 0 ? Math.round(((m.acknowledged_orders || 0) / m.total_orders) * 100) : 0;
    const peak = peakHour(all);
    const top5 = topCustomers(all, 5);

    const revenueSeries = buildSeries(all, 14);
    const ordersSeries = buildSeries(all, 14);

    const recent = [...all].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);

    const insights = [];
    const wt = trend(weekRev, prevWeekRev);
    if (weekRev > 0 && prevWeekRev > 0) {
      insights.push({ icon: wt >= 0 ? TrendingUp : TrendingDown, color: wt >= 0 ? 'emerald' : 'red', text: wt >= 0 ? `Revenue up +${wt}% this week` : `Revenue down ${wt}% this week` });
    }
    if (repeats > 0 && repeatPct >= 20) {
      insights.push({ icon: Repeat, color: 'violet', text: `${repeatPct}% of orders from repeat customers` });
    }
    if (peak) {
      insights.push({ icon: CalendarClock, color: 'blue', text: `Peak activity: ${peak}` });
    }
    if (pending.length > 0) {
      insights.push({ icon: AlertTriangle, color: 'amber', text: `${pending.length} order${pending.length > 1 ? 's' : ''} need verification` });
    }
    const weekOrdTrend = trend(thisWeek.length, lastWeek.length);
    if (thisWeek.length > lastWeek.length && lastWeek.length > 0) {
      insights.push({ icon: ArrowUpRight, color: 'blue', text: `Order volume up +${weekOrdTrend}% this week` });
    }

    return {
      totalRev: m.total_value ?? 0, weekRev, prevWeekRev, monthRev, prevMonthRev,
      todayRev, todayOrd, totalOrders: m.total_orders ?? 0,
      pending, flagged, verified,
      avgOrder, unique, repeats, repeatPct, verifyRate, peak,
      top5, revenueSeries, ordersSeries, recent, insights,
    };
  }, [dashboard, purchases]);

  if (loading || !d) return <PageSkeleton />;

  const weekTrend = trend(d.weekRev, d.prevWeekRev);
  const monthTrend = trend(d.monthRev, d.prevMonthRev);

  const colorMap = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-l-emerald-500' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-l-red-500' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-l-violet-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-l-blue-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-l-amber-500' },
  };

  return (
    <div className="max-w-5xl space-y-5 pb-10">

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-heading text-foreground">Business Insights</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Revenue, performance, and customer analytics.</p>
      </div>

      {/* ── REVENUE OVERVIEW ── */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="grid grid-cols-4 divide-x divide-white/[0.06]">
          {[
            { label: 'Total Revenue', value: fmtCurrency(d.totalRev) },
            { label: 'This Week', value: fmtCurrency(d.weekRev), trend: d.prevWeekRev > 0 ? weekTrend : null },
            { label: 'This Month', value: fmtCurrency(d.monthRev), trend: d.prevMonthRev > 0 ? monthTrend : null },
            { label: 'Today', value: fmtCurrency(d.todayRev), sub: `${d.todayOrd} order${d.todayOrd !== 1 ? 's' : ''}` },
          ].map((s) => (
            <div key={s.label} className="py-3 px-3 sm:px-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-sm sm:text-lg font-bold font-heading text-foreground tabular-nums">{s.value}</p>
              {s.trend != null && (
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums mt-0.5 ${s.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.trend >= 0 ? '+' : ''}{s.trend}%
                </span>
              )}
              {s.sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── KEY STATS ── */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="grid grid-cols-4 divide-x divide-white/[0.06]">
          {[
            { label: 'Total Orders', value: fmt(d.totalOrders), icon: ShoppingBag, color: 'text-blue-400' },
            { label: 'Avg Order', value: fmtCurrency(d.avgOrder), icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Customers', value: fmt(d.unique), icon: Users, color: 'text-violet-400', sub: `${d.repeats} repeat` },
            { label: 'Verify Rate', value: `${d.verifyRate}%`, icon: CheckCircle2, color: 'text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className="py-3 px-3 sm:px-4 flex items-center gap-2.5">
              <s.icon className={`w-4 h-4 ${s.color} shrink-0 hidden sm:block`} />
              <div>
                <p className="text-sm sm:text-lg font-bold font-heading text-foreground tabular-nums">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                {s.sub && <p className="text-[10px] text-muted-foreground/50">{s.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CHARTS ── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Revenue trend */}
        <div className={`${CARD} p-4`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Revenue Trend</h3>
              <p className="text-[11px] text-muted-foreground">Last 14 days</p>
            </div>
            <p className="text-sm font-bold font-heading tabular-nums text-foreground">{fmtCurrency(d.weekRev)}</p>
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.revenueSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="insRevG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#insRevG)" dot={false} activeDot={{ r: 3, fill: '#3B82F6', stroke: '#0A0A0A', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders per day */}
        <div className={`${CARD} p-4`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Orders Per Day</h3>
              <p className="text-[11px] text-muted-foreground">Last 14 days</p>
            </div>
            <p className="text-sm font-bold font-heading tabular-nums text-foreground">{d.totalOrders}</p>
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.ordersSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <Tooltip content={<ChartTip isOrders />} />
                <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── INSIGHTS ── */}
      {d.insights.length > 0 && (
        <div className={`${CARD} overflow-hidden`}>
          <div className="border-b border-white/[0.06] px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Insights</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {d.insights.map((ins, idx) => {
              const c = colorMap[ins.color] || colorMap.blue;
              return (
                <div key={idx} className={`flex items-center gap-3 px-4 py-3 border-l-[3px] ${c.border}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
                    <ins.icon className={`h-3.5 w-3.5 ${c.text}`} />
                  </div>
                  <p className="text-sm text-foreground">{ins.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TOP CUSTOMERS ── */}
      {d.top5.length > 0 && (
        <div className={`${CARD} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Top Customers</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">By total spend</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {d.top5.map((row, idx) => (
              <div key={row.email} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                <span className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold tabular-nums ${
                  idx === 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-white/[0.04] text-muted-foreground'
                }`}>
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{row.email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {row.count} order{row.count > 1 ? 's' : ''}
                    {row.count > 1 && <span className="ml-1.5 text-violet-400 font-medium">Repeat</span>}
                  </p>
                </div>
                <p className="text-sm font-bold font-heading tabular-nums text-emerald-400 shrink-0">{fmtCurrency(row.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RECENT ACTIVITY ── */}
      {d.recent.length > 0 && (
        <div className={`${CARD} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            </div>
            <button onClick={() => navigate('/app/partner/orders')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              All orders <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {d.recent.map((p, idx) => {
              const isPending = p.status === 'PENDING';
              const isRejected = p.status === 'REJECTED' || p.status === 'DISPUTED';
              const icon = isPending ? Clock : isRejected ? XCircle : CheckCircle2;
              const color = isPending ? 'text-amber-400' : isRejected ? 'text-red-400' : 'text-emerald-400';
              const bg = isPending ? 'bg-amber-500/10' : isRejected ? 'bg-red-500/10' : 'bg-emerald-500/10';
              const label = isPending ? 'Pending' : isRejected ? 'Flagged' : 'Verified';
              const Icon = icon;
              return (
                <div key={p.purchase_id || idx} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{p.user_lynkr_email || 'Unknown'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      <span className={color}>{label}</span>
                    </p>
                  </div>
                  <p className="text-sm font-bold font-heading tabular-nums text-foreground shrink-0">{fmtCurrency(p.amount)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STATUS BREAKDOWN ── */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
          {[
            { label: 'Pending', value: d.pending.length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', to: '/app/partner/orders?status=pending' },
            { label: 'Verified', value: d.verified.length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', to: '/app/partner/orders?status=approved' },
            { label: 'Flagged', value: d.flagged.length, icon: Flag, color: 'text-red-400', bg: 'bg-red-500/10', to: '/app/partner/orders?status=flagged' },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.to)}
              className="py-3 px-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors group"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold font-heading text-foreground tabular-nums leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartnerGrowthDashboard;
