import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useUserTheme from '@/hooks/useUserTheme';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Gift,
  Users,
  Loader2,
  Coins,
  TrendingUp,
  ChevronRight,
  Clock,
} from 'lucide-react';
import api from '@/utils/api';

const sourceIcon = (desc = '') => {
  const d = desc.toLowerCase();
  if (d.includes('referral')) return Users;
  if (d.includes('reward') || d.includes('redeem') || d.includes('coupon')) return Gift;
  if (d.includes('purchase') || d.includes('verified')) return ShoppingBag;
  return Sparkles;
};

const sourceLabel = (desc = '', type = '') => {
  const d = desc.toLowerCase();
  if (d.includes('referral')) return 'Referral bonus';
  if (d.includes('redeem') || d.includes('coupon')) return 'Reward redemption';
  if (d.includes('purchase') || d.includes('verified')) return 'Purchase reward';
  if (d.includes('signup') || d.includes('bonus')) return 'Bonus';
  return type === 'CREDIT' ? 'Points earned' : 'Points used';
};

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay: i * 0.03 },
});

const PointsHistoryPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useUserTheme();
  const initialTab = searchParams.get('tab') === 'redeemed' ? 'DEBIT' : 'ALL';
  const [tab, setTab] = useState(initialTab);
  const [ledger, setLedger] = useState([]);
  const [lockedPts, setLockedPts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/points/ledger');
        setLedger(res.data || []);
      } catch { /* */ }
      try {
        const res = await api.get('/dynamic-coupons/unlock-status');
        setLockedPts(res.data?.locked_points ?? 0);
      } catch { /* */ }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = tab === 'ALL' ? ledger : ledger.filter((e) => e.type === tab);

  const { totalEarned, totalSpent, monthlyBreakdown } = useMemo(() => {
    let earned = 0, spent = 0;
    const byMonth = {};
    for (const e of ledger) {
      if (e.type === 'CREDIT') earned += e.amount;
      else spent += Math.abs(e.amount);
      if (e.created_at) {
        const d = new Date(e.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[key]) byMonth[key] = { earned: 0, spent: 0, label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) };
        if (e.type === 'CREDIT') byMonth[key].earned += e.amount;
        else byMonth[key].spent += Math.abs(e.amount);
      }
    }
    const sorted = Object.entries(byMonth).sort(([a], [b]) => b.localeCompare(a)).slice(0, 6);
    return { totalEarned: earned, totalSpent: spent, monthlyBreakdown: sorted };
  }, [ledger]);

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
        <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Points</p>
        <h1 className="mt-1 text-2xl font-heading font-bold text-foreground">Points History</h1>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <motion.div {...fade(0)} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] text-txt-muted uppercase tracking-wide font-bold">Earned</span>
          </div>
          <p className="text-2xl font-heading font-bold text-emerald-400 tabular-nums">{totalEarned.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-txt-muted mt-1">from purchases & referrals</p>
        </motion.div>
        <motion.div {...fade(1)} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] text-txt-muted uppercase tracking-wide font-bold">Redeemed</span>
          </div>
          <p className="text-2xl font-heading font-bold text-amber-400 tabular-nums">{totalSpent.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-txt-muted mt-1">on rewards & coupons</p>
        </motion.div>
      </div>

      {/* Locked points indicator */}
      {lockedPts > 0 && (
        <motion.div
          {...fade(1.5)}
          className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 mb-5 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-emerald-400">{(totalEarned - totalSpent - lockedPts).toLocaleString('en-IN')} available</span>
              <span className="text-sm font-bold text-amber-400">{lockedPts.toLocaleString('en-IN')} in review</span>
            </div>
            <p className="text-[10px] text-txt-muted mt-0.5">Points locked while coupon requests are under review</p>
          </div>
        </motion.div>
      )}

      {/* Conversion rate explainer */}
      <motion.div
        {...fade(2)}
        className="rounded-2xl border border-border bg-card p-4 mb-5 flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `hsl(${theme.primary} / 0.1)` }}>
          <Coins className="h-4 w-4" style={{ color: `hsl(${theme.primary} / 0.7)` }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">How points are calculated</p>
          <p className="text-[11px] text-txt-muted mt-0.5">
            Every <span className="text-foreground font-bold">₹400</span> spent on verified purchases earns you <span className="font-bold" style={{ color: `hsl(${theme.primary})` }}>1 point</span>.
            Referrals earn <span className="font-bold" style={{ color: `hsl(${theme.primary})` }}>50–100</span> bonus points.
          </p>
        </div>
      </motion.div>

      {/* Monthly breakdown */}
      {monthlyBreakdown.length > 0 && (
        <motion.section {...fade(3)} className="mb-5">
          <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold mb-3">Monthly Breakdown</p>
          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1 -mx-5 px-5 sm:-mx-6 sm:px-6">
            {monthlyBreakdown.map(([key, m], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.1 + i * 0.05 }}
                className="shrink-0 w-[130px] rounded-2xl border border-border bg-card p-3.5"
              >
                <p className="text-[10px] text-txt-muted font-bold uppercase tracking-wide mb-2">{m.label}</p>
                <div className="flex items-center gap-1 text-emerald-400 mb-1">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-sm font-bold tabular-nums">+{m.earned.toLocaleString('en-IN')}</span>
                </div>
                {m.spent > 0 && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="text-xs font-bold tabular-nums">−{m.spent.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Filter tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-border bg-muted p-1">
          {[
            { value: 'ALL', label: 'All' },
            { value: 'CREDIT', label: 'Earned' },
            { value: 'DEBIT', label: 'Redeemed' },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="rounded-xl min-h-10 text-sm font-bold text-txt-secondary transition-all data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Transaction list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center"
        >
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-txt-muted" />
          <p className="text-sm text-txt-secondary font-semibold">No points activity yet</p>
          <p className="text-xs text-txt-muted mt-1 mb-4">Make purchases to start earning points</p>
          <button
            type="button"
            onClick={() => navigate('/app/purchases?raise=1')}
            className="text-sm font-bold"
            style={{ color: `hsl(${theme.primary})` }}
          >
            Raise a purchase <ChevronRight className="inline h-3.5 w-3.5" />
          </button>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          <AnimatePresence mode="popLayout">
            {filtered.map((entry, i) => {
              const Icon = sourceIcon(entry.description);
              const isCredit = entry.type === 'CREDIT';
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.3) }}
                  className="flex items-center gap-3.5 px-4 py-3.5"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isCredit ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                  }`}>
                    <Icon className={`h-4 w-4 ${isCredit ? 'text-emerald-400' : 'text-amber-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{entry.description || sourceLabel(entry.description, entry.type)}</p>
                    <p className="text-[11px] text-txt-muted mt-0.5 flex items-center gap-2">
                      <span>{entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                      <span className="text-txt-muted/40">·</span>
                      <span className="capitalize">{sourceLabel(entry.description, entry.type)}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${isCredit ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isCredit ? '+' : '−'}{Math.abs(entry.amount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-txt-muted mt-0.5 tabular-nums">bal {entry.balance_after?.toLocaleString('en-IN')}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default PointsHistoryPage;
