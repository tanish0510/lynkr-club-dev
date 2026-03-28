import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useUserTheme from '@/hooks/useUserTheme';
import {
  ArrowLeft,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Loader2,
  PieChart,
  BarChart3,
  Clock,
  Gift,
} from 'lucide-react';
import api from '@/utils/api';

const useCountUp = (target, dur = 700, delay = 0) => {
  const [v, setV] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!target || started.current) return;
    started.current = true;
    const t = setTimeout(() => {
      const s = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - s) / dur);
        setV(Math.round(target * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, dur, delay]);
  return v;
};

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay: i * 0.04 },
});

const InsightsPage = () => {
  const navigate = useNavigate();
  const theme = useUserTheme();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [couponRequests, setCouponRequests] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [purchRes, ledgerRes, dashRes] = await Promise.all([
          api.get('/purchases'),
          api.get('/points/ledger'),
          api.get('/user/dashboard'),
        ]);
        setPurchases(purchRes.data || []);
        setLedger(ledgerRes.data || []);
        setDashData(dashRes.data);
      } catch { /* */ }
      try {
        const cpRes = await api.get('/dynamic-coupons/my-requests');
        setCouponRequests(Array.isArray(cpRes.data) ? cpRes.data : []);
      } catch { /* */ }
      finally { setLoading(false); }
    })();
  }, []);

  const stats = useMemo(() => {
    const verified = purchases.filter(p => p.status === 'VERIFIED');
    const totalSpent = verified.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalSavings = dashData?.total_savings ?? Math.round(totalSpent * 0.025);
    const totalPoints = ledger.filter(e => e.type === 'CREDIT').reduce((s, e) => s + e.amount, 0);

    const byCategory = {};
    const byMonth = {};
    for (const p of verified) {
      const cat = p.category || p.brand || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + Number(p.amount || 0);
      if (p.timestamp) {
        const d = new Date(p.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[key]) byMonth[key] = { spent: 0, label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) };
        byMonth[key].spent += Number(p.amount || 0);
      }
    }

    const categories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, amount]) => ({ name, amount, pct: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0 }));

    const months = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, m]) => m);

    const maxMonth = Math.max(...months.map(m => m.spent), 1);

    const savingsRate = totalSpent > 0 ? ((totalSavings / totalSpent) * 100).toFixed(1) : '0.0';

    return { totalSpent, totalSavings, totalPoints, categories, months, maxMonth, savingsRate, purchaseCount: verified.length };
  }, [purchases, ledger, dashData]);

  const pendingCoupons = couponRequests.filter(r => r.status === 'pending');
  const approvedCards = couponRequests.filter(r => r.status === 'approved' && r.card_code);

  const animSavings = useCountUp(stats.totalSavings, 800, 200);
  const animSpent = useCountUp(stats.totalSpent, 800, 300);

  const categoryColors = [
    theme.primary, '142 71% 45%', theme.accent, '280 60% 50%',
    '35 92% 50%', '200 80% 50%', '340 80% 60%', '60 80% 45%',
  ];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-xl mx-auto px-5 pt-7 pb-20 sm:px-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <header className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-txt-secondary font-semibold mb-4 -ml-1 hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Insights</p>
        <h1 className="mt-1 text-2xl font-heading font-bold text-foreground">Savings & Spending</h1>
      </header>

      {/* Hero savings card */}
      <motion.section {...fade(0)} className="rounded-3xl border border-border bg-card overflow-hidden relative mb-5" style={{ boxShadow: theme.glowCss }}>
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-70"
          style={{ background: theme.gradientCss }}
        />
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] text-txt-muted uppercase tracking-[0.15em] font-bold mb-1">Total Saved</p>
              <p className="text-4xl font-heading font-bold tabular-nums leading-none" style={{ color: `hsl(142 71% 45%)` }}>
                ₹{animSavings.toLocaleString('en-IN')}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: `hsl(142 71% 45% / 0.1)` }}>
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400">{stats.savingsRate}% saved</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-txt-muted uppercase tracking-wide font-bold mb-1">Total Spent</p>
              <p className="text-2xl font-heading font-bold text-foreground tabular-nums">
                ₹{animSpent.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-txt-muted mt-0.5">{stats.purchaseCount} purchases</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <motion.button
          {...fade(1)}
          type="button"
          onClick={() => navigate('/app/points')}
          className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 text-left transition-all active:scale-[0.97] hover:bg-muted/50"
        >
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{stats.totalPoints.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-txt-muted font-bold uppercase">Points earned</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-txt-muted" />
        </motion.button>
        <motion.button
          {...fade(2)}
          type="button"
          onClick={() => navigate('/app/rewards/history')}
          className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 text-left transition-all active:scale-[0.97] hover:bg-muted/50"
        >
          <IndianRupee className="h-4 w-4 text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{(dashData?.coupons_redeemed_count ?? 0).toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-txt-muted font-bold uppercase">Coupons used</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-txt-muted" />
        </motion.button>
      </div>

      {/* Gift Cards quick nav */}
      <motion.button
        {...fade(2.5)}
        type="button"
        onClick={() => navigate('/app/gift-cards')}
        className="w-full rounded-2xl border border-border bg-card p-4 flex items-center gap-3 text-left transition-all active:scale-[0.97] hover:bg-muted/50 mb-5"
      >
        <Gift className="h-4 w-4 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{approvedCards.length}</p>
          <p className="text-[10px] text-txt-muted font-bold uppercase">Gift cards</p>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-txt-muted" />
      </motion.button>

      {/* Pending coupon requests (conditional) */}
      {pendingCoupons.length > 0 && (
        <motion.section {...fade(2.7)} className="mb-5">
          <button
            type="button"
            onClick={() => navigate('/app/gift-cards')}
            className="w-full rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-left transition-all active:scale-[0.98] hover:bg-amber-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">
                  {pendingCoupons.length} coupon request{pendingCoupons.length !== 1 ? 's' : ''} in review
                </p>
                <p className="text-[11px] text-amber-400/80 mt-0.5">
                  {pendingCoupons.reduce((s, r) => s + (r.points_used || 0), 0)} pts locked
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-400/60 shrink-0" />
            </div>
          </button>
        </motion.section>
      )}

      {/* Monthly spending bar chart */}
      {stats.months.length > 0 && (
        <motion.section {...fade(3)} className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-txt-muted" />
            <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Monthly Spending</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-end gap-2 h-[120px]">
              {stats.months.map((m, i) => {
                const h = Math.max(8, (m.spent / stats.maxMonth) * 100);
                return (
                  <motion.div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1.5"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{ transformOrigin: 'bottom' }}
                  >
                    <span className="text-[9px] text-txt-muted font-bold tabular-nums">
                      ₹{(m.spent / 1000).toFixed(m.spent >= 1000 ? 1 : 0)}k
                    </span>
                    <div
                      className="w-full rounded-lg transition-colors"
                      style={{
                        height: `${h}%`,
                        background: `linear-gradient(to top, hsl(${theme.primary} / 0.3), hsl(${theme.primary} / 0.7))`,
                      }}
                    />
                    <span className="text-[9px] text-txt-muted font-bold">{m.label.split(' ')[0]}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* Category breakdown */}
      {stats.categories.length > 0 && (
        <motion.section {...fade(4)} className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="h-4 w-4 text-txt-muted" />
            <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">By Category</p>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {stats.categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.3 + i * 0.04 }}
                className="px-4 py-3.5 flex items-center gap-3"
              >
                <div
                  className="w-2 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: `hsl(${categoryColors[i % categoryColors.length]} / 0.7)` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{cat.name}</p>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.pct}%` }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.05 }}
                      style={{ backgroundColor: `hsl(${categoryColors[i % categoryColors.length]})` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground tabular-nums">₹{cat.amount.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-txt-muted font-bold">{cat.pct}%</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Smart insights */}
      <motion.section {...fade(5)}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-txt-muted" />
          <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Smart Insights</p>
        </div>
        <div className="space-y-2.5">
          {stats.categories.length > 0 && (
            <motion.div {...fade(6)} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `hsl(${theme.accent} / 0.1)` }}>
                <ShoppingBag className="h-4 w-4" style={{ color: `hsl(${theme.accent} / 0.6)` }} />
              </div>
              <p className="text-sm text-txt-secondary font-medium leading-relaxed">
                You spend most on <span className="text-foreground font-bold">{stats.categories[0].name}</span> ({stats.categories[0].pct}% of total)
              </p>
            </motion.div>
          )}
          {stats.months.length >= 2 && (
            <motion.div {...fade(7)} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `hsl(${theme.primary} / 0.1)` }}>
                {stats.months[stats.months.length - 1].spent >= stats.months[stats.months.length - 2].spent
                  ? <TrendingUp className="h-4 w-4" style={{ color: `hsl(${theme.primary} / 0.6)` }} />
                  : <TrendingDown className="h-4 w-4 text-emerald-400" />
                }
              </div>
              <p className="text-sm text-txt-secondary font-medium leading-relaxed">
                {stats.months[stats.months.length - 1].spent >= stats.months[stats.months.length - 2].spent
                  ? `Spending increased this month compared to ${stats.months[stats.months.length - 2].label}`
                  : `You spent less this month — great savings trend!`
                }
              </p>
            </motion.div>
          )}
          {stats.totalSavings > 0 && (
            <motion.div {...fade(8)} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/10">
                <IndianRupee className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-sm text-txt-secondary font-medium leading-relaxed">
                You've saved <span className="text-emerald-400 font-bold">₹{stats.totalSavings.toLocaleString('en-IN')}</span> through Lynkr rewards and cashback — that's <span className="text-foreground font-bold">{stats.savingsRate}%</span> of total spending
              </p>
            </motion.div>
          )}
          {stats.purchaseCount === 0 && (
            <motion.div {...fade(6)} className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-txt-muted" />
              <p className="text-sm text-txt-secondary font-semibold">No spending data yet</p>
              <button
                type="button"
                onClick={() => navigate('/app/purchases?raise=1')}
                className="mt-3 text-sm font-bold"
                style={{ color: `hsl(${theme.primary})` }}
              >
                Raise your first purchase <ChevronRight className="inline h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
};

export default InsightsPage;
