import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useUserTheme from '@/hooks/useUserTheme';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Gift,
  ShoppingBag,
  Ticket,
  ChevronRight,
  Clock,
  Sparkles,
  CreditCard,
  ArrowUpRight,
  BarChart3,
  Target,
  Loader2,
  Eye,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '@/utils/api';

const useCountUp = (target, duration = 800, delay = 0) => {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (target == null || target === 0 || started.current) return;
    started.current = true;
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        setValue(Math.round(target * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
};

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, delay: 0.07 * i, ease: [0.25, 0.46, 0.45, 0.94] },
});

const StatusDot = ({ status }) => {
  const c = { VERIFIED: 'bg-emerald-400', PENDING: 'bg-amber-400', REJECTED: 'bg-red-400' };
  return <span className={`w-2 h-2 rounded-full shrink-0 ${c[status] || c.PENDING}`} />;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useUserTheme();
  const firstName = (user?.full_name || user?.username || '').split(' ')[0];

  const [data, setData] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [couponRequests, setCouponRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, ledgerRes, purchRes] = await Promise.all([
          api.get('/user/dashboard'),
          api.get('/points/ledger'),
          api.get('/purchases'),
        ]);
        setData(dashRes.data);
        setLedger(ledgerRes.data || []);
        setPurchases(purchRes.data || []);
      } catch { /* */ }
      try {
        const cpRes = await api.get('/dynamic-coupons/my-requests');
        setCouponRequests(Array.isArray(cpRes.data) ? cpRes.data : []);
      } catch { /* */ }
      finally { setLoading(false); }
    })();
  }, []);

  const points = data?.points ?? 0;
  const monthSpending = data?.month_spending ?? 0;
  const purchasesCount = data?.purchases_count ?? 0;
  const couponsRedeemed = data?.coupons_redeemed_count ?? 0;
  const pendingPurchases = data?.pending_purchases ?? 0;
  const totalSavings = data?.total_savings ?? 0;
  const recentPurchases = data?.recent_purchases ?? [];

  const animPoints = useCountUp(points, 900, 200);
  const animSavings = useCountUp(totalSavings, 800, 300);
  const animSpending = useCountUp(monthSpending, 700, 400);

  const analytics = useMemo(() => {
    const verified = purchases.filter(p => p.status === 'VERIFIED');
    const totalSpent = verified.reduce((s, p) => s + Number(p.amount || 0), 0);

    const byCategory = {};
    const byMonth = {};
    for (const p of verified) {
      const cat = p.category || p.brand || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + Number(p.amount || 0);
      if (p.timestamp) {
        const d = new Date(p.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[key]) byMonth[key] = { spent: 0, label: d.toLocaleDateString('en-IN', { month: 'short' }) };
        byMonth[key].spent += Number(p.amount || 0);
      }
    }

    const categories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount, pct: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0 }));

    const months = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, m]) => m);
    const maxMonth = Math.max(...months.map(m => m.spent), 1);

    const totalEarned = ledger.filter(e => e.type === 'CREDIT').reduce((s, e) => s + e.amount, 0);
    const totalRedeemed = ledger.filter(e => e.type === 'DEBIT').reduce((s, e) => s + Math.abs(e.amount), 0);

    const couponLabel = (r) => {
      if (r.status === 'rejected') return `Coupon rejected: ${r.brand_name}`;
      if (r.status === 'approved') return `Coupon approved: ${r.brand_name}`;
      return `Coupon requested: ${r.brand_name}`;
    };
    const timeline = [
      ...ledger.slice(0, 5).map(e => ({
        type: e.type === 'CREDIT' ? 'earned' : 'redeemed',
        desc: e.description || (e.type === 'CREDIT' ? 'Points earned' : 'Points used'),
        amount: e.amount,
        date: e.created_at,
      })),
      ...recentPurchases.slice(0, 3).map(p => ({
        type: 'purchase',
        desc: p.brand,
        amount: p.amount,
        status: p.status,
        date: p.timestamp,
      })),
      ...couponRequests.map(r => ({
        type: 'coupon_request',
        desc: couponLabel(r),
        amount: r.points_used || 0,
        status: r.status,
        date: r.created_at,
      })),
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 10);

    const nextRewardThreshold = points < 500 ? 500 : points < 1000 ? 1000 : points < 2000 ? 2000 : points < 5000 ? 5000 : 10000;
    const goalProgress = Math.min(100, Math.round((points / nextRewardThreshold) * 100));

    return { totalSpent, categories, months, maxMonth, totalEarned, totalRedeemed, timeline, nextRewardThreshold, goalProgress };
  }, [purchases, ledger, recentPurchases, points, couponRequests]);

  const pendingCoupons = couponRequests.filter(r => r.status === 'pending');
  const approvedCards = couponRequests.filter(r => r.status === 'approved' && r.card_code);
  const lockedPts = pendingCoupons.reduce((s, r) => s + (r.points_used || 0), 0);

  const categoryColors = [theme.primary, '142 71% 45%', theme.accent, '280 60% 50%', '35 92% 50%'];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-xl px-5 pt-7 pb-16 sm:pt-10 sm:px-6">

        {/* ── HERO: Savings-first, analytical ── */}
        <motion.section
          {...fade(0)}
          className="relative mb-6 rounded-3xl overflow-hidden"
          style={{ boxShadow: theme.glowCss }}
        >
          <div className="absolute inset-0 bg-surface-raised border border-border rounded-3xl" />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-60 w-60 rounded-full opacity-25"
            style={{ background: `radial-gradient(circle, hsl(142 71% 45% / 0.3) 0%, transparent 70%)` }}
          />
          <div className="absolute top-0 left-0 right-0 h-[2px] opacity-70" style={{ background: theme.gradientCss }} />

          <div className="relative p-6 sm:p-8">
            <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Dashboard</p>
            <p className="mt-0.5 text-sm text-txt-muted font-medium">{firstName}'s overview</p>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-[10px] text-txt-muted uppercase tracking-[0.15em] font-bold mb-1">Total Saved</p>
                <p className="text-4xl sm:text-5xl font-heading font-bold tabular-nums leading-none tracking-tight" style={{ color: `hsl(142 71% 45%)` }}>
                  ₹{animSavings.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-txt-muted mt-1.5">through Lynkr rewards</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-txt-muted uppercase tracking-wide font-bold mb-0.5">This Month</p>
                <p className="text-xl font-heading font-bold text-foreground tabular-nums">
                  ₹{animSpending.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-txt-muted mt-0.5">spent</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── METRICS GRID — clickable ── */}
        <motion.section {...fade(1)} className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Points', value: animPoints.toLocaleString('en-IN'), icon: Sparkles, color: theme.primary, to: '/app/points' },
            { label: 'Coupons Used', value: couponsRedeemed, icon: Ticket, color: '280 60% 50%', to: '/app/rewards/history?tab=used' },
            { label: 'Purchases', value: purchasesCount, icon: ShoppingBag, color: theme.accent, to: '/app/purchases' },
            { label: 'Pending', value: pendingPurchases, icon: Clock, color: '35 92% 50%', to: '/app/purchases' },
          ].map((m, i) => (
            <motion.button
              key={m.label}
              type="button"
              onClick={() => navigate(m.to)}
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: 0.12 + i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-4 text-left transition-all active:scale-[0.97] hover:bg-muted/40 touch-manipulation group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px opacity-25" style={{ background: `linear-gradient(90deg, transparent, hsl(${m.color}), transparent)` }} />
              <div className="flex items-center justify-between mb-2">
                <m.icon className="h-4 w-4" style={{ color: `hsl(${m.color} / 0.6)` }} />
                <ChevronRight className="h-3 w-3 text-txt-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-heading font-bold text-foreground tabular-nums leading-tight">{m.value}</p>
              <p className="text-[10px] text-txt-muted font-bold mt-1 uppercase tracking-wide">{m.label}</p>
              {m.label === 'Points' && lockedPts > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] text-emerald-400 font-semibold">{(points - lockedPts).toLocaleString('en-IN')} avail</span>
                  <span className="text-[9px] text-amber-400 font-semibold">{lockedPts.toLocaleString('en-IN')} in review</span>
                </div>
              )}
            </motion.button>
          ))}
        </motion.section>

        {/* ── SPENDING CHART ── */}
        {analytics.months.length > 1 && (
          <motion.section {...fade(2)} className="mb-6">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-txt-muted" />
                <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Spending Trend</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/insights')}
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: `hsl(${theme.primary} / 0.8)` }}
              >
                Details <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-end gap-2.5 h-[100px]">
                {analytics.months.map((m, i) => {
                  const h = Math.max(10, (m.spent / analytics.maxMonth) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <motion.div
                        className="w-full rounded-lg"
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.5, delay: 0.2 + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{ background: `linear-gradient(to top, hsl(${theme.primary} / 0.25), hsl(${theme.primary} / 0.65))` }}
                      />
                      <span className="text-[9px] text-txt-muted font-bold">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}

        {/* ── CATEGORY BREAKDOWN — mini donut-style ── */}
        {analytics.categories.length > 0 && (
          <motion.section {...fade(3)} className="mb-6">
            <div className="flex items-center justify-between mb-3.5">
              <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Where You Spend</p>
              <button
                type="button"
                onClick={() => navigate('/app/insights')}
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: `hsl(${theme.primary} / 0.8)` }}
              >
                See all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              {analytics.categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.25 + i * 0.04 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-2.5 h-7 rounded-full shrink-0"
                    style={{ backgroundColor: `hsl(${categoryColors[i % categoryColors.length]} / 0.6)` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-foreground truncate">{cat.name}</p>
                      <p className="text-sm font-bold text-foreground tabular-nums shrink-0">₹{cat.amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.pct}%` }}
                        transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                        style={{ backgroundColor: `hsl(${categoryColors[i % categoryColors.length]})` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-txt-muted font-bold shrink-0 w-8 text-right">{cat.pct}%</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── GOAL PROGRESS ── */}
        <motion.section {...fade(4)} className="mb-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4" style={{ color: `hsl(${theme.primary} / 0.6)` }} />
              <p className="text-sm font-bold text-foreground">Next reward milestone</p>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${analytics.goalProgress}%` }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  style={{ background: theme.gradientCss }}
                />
              </div>
              <span className="text-xs font-bold text-foreground tabular-nums shrink-0">{analytics.goalProgress}%</span>
            </div>
            <p className="text-[11px] text-txt-muted">
              <span className="text-foreground font-bold">{points.toLocaleString('en-IN')}</span> / {analytics.nextRewardThreshold.toLocaleString('en-IN')} points
            </p>
          </div>
        </motion.section>

        {/* ── PENDING COUPON REQUESTS (conditional) ── */}
        {pendingCoupons.length > 0 && (
          <motion.section {...fade(4.5)} className="mb-6">
            <button
              type="button"
              onClick={() => navigate('/app/gift-cards')}
              className="w-full rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-left transition-all active:scale-[0.98] hover:bg-amber-500/10 touch-manipulation"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {pendingCoupons.length} coupon request{pendingCoupons.length !== 1 ? 's' : ''} in review
                  </p>
                  <p className="text-[11px] text-amber-400/80 mt-0.5">
                    {pendingCoupons.reduce((s, r) => s + (r.points_used || 0), 0)} pts locked while under review
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-amber-400/60 shrink-0" />
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none">
                {pendingCoupons.slice(0, 4).map(r => (
                  <span key={r.id} className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-300 whitespace-nowrap shrink-0">
                    {r.brand_name} · ₹{r.requested_amount}
                  </span>
                ))}
                {pendingCoupons.length > 4 && (
                  <span className="text-[11px] text-amber-400/60 font-medium self-center">+{pendingCoupons.length - 4} more</span>
                )}
              </div>
            </button>
          </motion.section>
        )}

        {/* ── GIFT CARDS ── */}
        <motion.section {...fade(4.7)} className="mb-6">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-emerald-400" />
              <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Gift Cards</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/gift-cards')}
              className="text-xs font-semibold flex items-center gap-0.5"
              style={{ color: `hsl(${theme.primary} / 0.8)` }}
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {approvedCards.length === 0 ? (
            <button
              type="button"
              onClick={() => navigate('/app/dynamic-coupons')}
              className="w-full rounded-2xl border border-dashed border-border bg-muted/15 p-5 text-center transition-all active:scale-[0.98] hover:bg-muted/30 touch-manipulation"
            >
              <Gift className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">No gift cards yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Redeem your points for brand gift cards</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold mt-3" style={{ color: `hsl(${theme.primary})` }}>
                <Sparkles className="h-3.5 w-3.5" /> Explore Dynamic Coupons <ChevronRight className="h-3 w-3" />
              </span>
            </button>
          ) : (
            <div className="space-y-2">
              {approvedCards.slice(0, 3).map((card, i) => (
                <motion.button
                  key={card.id}
                  type="button"
                  onClick={() => navigate('/app/gift-cards')}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.25 + i * 0.04 }}
                  className="w-full rounded-2xl border border-emerald-500/15 bg-card p-3.5 flex items-center gap-3 text-left transition-all active:scale-[0.97] hover:bg-muted/40 touch-manipulation"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ background: `hsl(${theme.primary} / 0.1)` }}>
                    🎁
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{card.brand_name}</p>
                    <p className="text-[10px] text-txt-muted mt-0.5">₹{card.card_value || card.requested_amount} gift card</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Eye className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[11px] font-semibold text-emerald-400">View</span>
                  </div>
                </motion.button>
              ))}
              {approvedCards.length > 3 && (
                <button
                  type="button"
                  onClick={() => navigate('/app/gift-cards')}
                  className="w-full text-center py-2 text-xs font-semibold"
                  style={{ color: `hsl(${theme.primary})` }}
                >
                  +{approvedCards.length - 3} more card{approvedCards.length - 3 !== 1 ? 's' : ''} <ChevronRight className="inline h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </motion.section>

        {/* ── POINTS EARNED VS REDEEMED ── */}
        <motion.section {...fade(5)} className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/app/points')}
            className="rounded-2xl border border-border bg-card p-4 text-left transition-all active:scale-[0.97] hover:bg-muted/40 touch-manipulation"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] text-txt-muted uppercase tracking-wide font-bold">Earned</span>
            </div>
            <p className="text-xl font-heading font-bold text-emerald-400 tabular-nums">{analytics.totalEarned.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-txt-muted mt-0.5">total points</p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/points?tab=redeemed')}
            className="rounded-2xl border border-border bg-card p-4 text-left transition-all active:scale-[0.97] hover:bg-muted/40 touch-manipulation"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] text-txt-muted uppercase tracking-wide font-bold">Redeemed</span>
            </div>
            <p className="text-xl font-heading font-bold text-amber-400 tabular-nums">{analytics.totalRedeemed.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-txt-muted mt-0.5">on rewards</p>
          </button>
        </motion.section>

        {/* ── SMART INSIGHTS ── */}
        <motion.section {...fade(6)} className="mb-6">
          <div className="flex items-center justify-between mb-3.5">
            <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" style={{ color: `hsl(${theme.accent})` }} /> Insights
            </p>
            <button
              type="button"
              onClick={() => navigate('/app/insights')}
              className="text-xs font-semibold flex items-center gap-0.5"
              style={{ color: `hsl(${theme.primary} / 0.8)` }}
            >
              See all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {(() => {
              const items = [];
              if (analytics.categories.length > 0) {
                items.push(`You spend most on ${analytics.categories[0].name} (${analytics.categories[0].pct}%)`);
              }
              if (totalSavings > 0) {
                items.push(`You've saved ₹${totalSavings.toLocaleString('en-IN')} — keep going!`);
              }
              if (analytics.months.length >= 2) {
                const curr = analytics.months[analytics.months.length - 1].spent;
                const prev = analytics.months[analytics.months.length - 2].spent;
                if (prev > 0) {
                  const diff = Math.round(((curr - prev) / prev) * 100);
                  items.push(diff >= 0 ? `Spending is up ${diff}% this month` : `Spending is down ${Math.abs(diff)}% — great job!`);
                }
              }
              if (points > 500) {
                items.push(`With ${points.toLocaleString('en-IN')} points, you can unlock rewards`);
              }
              if (items.length === 0) items.push('Start making purchases to see insights');
              return items.map((text, i) => (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => navigate('/app/insights')}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: 0.35 + i * 0.05 }}
                  className="w-full rounded-2xl border border-border bg-card p-3.5 flex items-start gap-2.5 text-left transition-all hover:bg-muted/40 active:scale-[0.98] touch-manipulation"
                >
                  <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: `hsl(${theme.accent} / 0.5)` }} />
                  <p className="text-[13px] text-txt-secondary font-medium leading-relaxed flex-1">{text}</p>
                  <ArrowUpRight className="h-3.5 w-3.5 text-txt-muted shrink-0 mt-0.5" />
                </motion.button>
              ));
            })()}
          </div>
        </motion.section>

        {/* ── ACTIVITY TIMELINE ── */}
        {analytics.timeline.length > 0 && (
          <motion.section {...fade(7)}>
            <div className="flex items-center justify-between mb-3.5">
              <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Activity Timeline</p>
              <button
                type="button"
                onClick={() => navigate('/app/activity-timeline')}
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: `hsl(${theme.primary} / 0.8)` }}
              >
                Full history <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {analytics.timeline.map((item, i) => {
                const isEarned = item.type === 'earned';
                const isPurchase = item.type === 'purchase';
                const isCoupon = item.type === 'coupon_request';
                const couponColors = isCoupon ? (
                  item.status === 'rejected' ? { bg: 'bg-red-500/10', text: 'text-red-400' } :
                  item.status === 'approved' ? { bg: 'bg-emerald-500/10', text: 'text-emerald-400' } :
                  { bg: 'bg-amber-500/10', text: 'text-amber-400' }
                ) : null;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.18, delay: 0.3 + i * 0.03 }}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                  >
                    <div className="relative flex flex-col items-center shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        isCoupon ? couponColors.bg : isPurchase ? 'bg-primary/10' : isEarned ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                      }`}>
                        {isCoupon ? (
                          item.status === 'rejected' ? <XCircle className={`h-3 w-3 ${couponColors.text}`} /> :
                          item.status === 'approved' ? <CheckCircle2 className={`h-3 w-3 ${couponColors.text}`} /> :
                          <Clock className={`h-3 w-3 ${couponColors.text}`} />
                        ) : isPurchase ? (
                          <CreditCard className="h-3 w-3 text-primary" />
                        ) : isEarned ? (
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Gift className="h-3 w-3 text-amber-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{item.desc}</p>
                      <p className="text-[10px] text-txt-muted mt-0.5">
                        {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {isCoupon ? (
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-bold tabular-nums ${couponColors.text}`}>
                            {item.status === 'rejected' ? '' : '−'}{Math.abs(item.amount).toLocaleString('en-IN')}
                          </p>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            item.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                            item.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' :
                            'bg-amber-500/15 text-amber-400'
                          }`}>
                            {item.status === 'rejected' ? 'Rejected' : item.status === 'approved' ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                      ) : isPurchase ? (
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-foreground tabular-nums flex items-center gap-0.5">
                            <IndianRupee className="h-3 w-3" />
                            {Number(item.amount || 0).toLocaleString('en-IN')}
                          </p>
                          <StatusDot status={item.status} />
                        </div>
                      ) : (
                        <p className={`text-sm font-bold tabular-nums ${isEarned ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isEarned ? '+' : '−'}{Math.abs(item.amount).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

      </div>
    </div>
  );
};

export default DashboardPage;
