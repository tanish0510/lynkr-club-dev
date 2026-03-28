import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useUserTheme from '@/hooks/useUserTheme';
import api, { resolveImageUrl } from '@/utils/api';
import {
  ArrowLeft,
  Gift,
  Ticket,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay: i * 0.03 },
});

const RewardsHistoryPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useUserTheme();
  const initialTab = searchParams.get('tab') || 'available';
  const [tab, setTab] = useState(initialTab);
  const [redemptions, setRedemptions] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [points, setPoints] = useState(0);
  const [lockedPts, setLockedPts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [redRes, coupRes, dashRes] = await Promise.all([
          api.get('/coupons/redemptions'),
          api.get('/coupons'),
          api.get('/user/dashboard'),
        ]);
        setRedemptions(redRes.data || []);
        setCoupons(coupRes.data || []);
        setPoints(dashRes.data?.points ?? 0);
      } catch { /* */ }
      try {
        const res = await api.get('/dynamic-coupons/unlock-status');
        setLockedPts(res.data?.locked_points ?? 0);
      } catch { /* */ }
      finally { setLoading(false); }
    })();
  }, []);

  const { available, used, expired } = useMemo(() => {
    const now = new Date();
    const usedIds = new Set(redemptions.map(r => r.coupon_id));
    const avail = [];
    const exp = [];
    for (const c of coupons) {
      if (usedIds.has(c.id)) continue;
      const expDate = c.expiry_date ? new Date(c.expiry_date) : null;
      if (expDate && expDate < now) exp.push(c);
      else avail.push(c);
    }
    return { available: avail, used: redemptions, expired: exp };
  }, [coupons, redemptions]);

  const lists = { available, used, expired };
  const currentList = lists[tab] || [];
  const counts = { available: available.length, used: used.length, expired: expired.length };

  const copyCode = async (code) => {
    try { await navigator.clipboard.writeText(code); toast.success('Code copied!'); }
    catch { toast.error('Copy failed'); }
  };

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
        <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Rewards</p>
        <h1 className="mt-1 text-2xl font-heading font-bold text-foreground">Rewards & Coupons</h1>
      </header>

      {/* Points snapshot */}
      <motion.div {...fade(0)} className="rounded-2xl border border-border bg-card p-5 mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-txt-muted uppercase tracking-wide font-bold mb-1">Your Balance</p>
          <p className="text-3xl font-heading font-bold text-foreground tabular-nums">{points.toLocaleString('en-IN')}</p>
          {lockedPts > 0 ? (
            <div className="flex items-center gap-2.5 mt-1">
              <span className="text-[11px] text-emerald-400 font-semibold">{(points - lockedPts).toLocaleString('en-IN')} available</span>
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />{lockedPts.toLocaleString('en-IN')} in review
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-txt-muted mt-0.5">points available</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/rewards')}
          className="rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95"
          style={{ backgroundColor: `hsl(${theme.primary} / 0.12)`, color: `hsl(${theme.primary})` }}
        >
          Redeem <ArrowRight className="inline h-3.5 w-3.5 ml-0.5" />
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { label: 'Available', count: counts.available, color: 'text-emerald-400', icon: Gift },
          { label: 'Used', count: counts.used, color: 'text-primary', icon: CheckCircle2 },
          { label: 'Expired', count: counts.expired, color: 'text-txt-muted', icon: XCircle },
        ].map((s, i) => (
          <motion.div key={s.label} {...fade(i + 1)} className="rounded-2xl border border-border bg-card p-3.5 text-center">
            <s.icon className={`h-4 w-4 mx-auto mb-1.5 ${s.color}`} />
            <p className={`text-xl font-heading font-bold tabular-nums ${s.color}`}>{s.count}</p>
            <p className="text-[10px] text-txt-muted font-bold uppercase tracking-wide mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-border bg-muted p-1">
          {[
            { value: 'available', label: `Available (${counts.available})` },
            { value: 'used', label: `Used (${counts.used})` },
            { value: 'expired', label: `Expired (${counts.expired})` },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="rounded-xl min-h-10 text-xs font-bold text-txt-secondary transition-all data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : currentList.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
          <Ticket className="mx-auto mb-3 h-8 w-8 text-txt-muted" />
          <p className="text-sm text-txt-secondary font-semibold">
            {tab === 'available' ? 'No available rewards' : tab === 'used' ? 'No redeemed rewards yet' : 'No expired rewards'}
          </p>
          {tab === 'available' && (
            <button type="button" onClick={() => navigate('/app/rewards')} className="mt-3 text-sm font-bold" style={{ color: `hsl(${theme.primary})` }}>
              Browse rewards <ChevronRight className="inline h-3.5 w-3.5" />
            </button>
          )}
        </motion.div>
      ) : tab === 'used' ? (
        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          <AnimatePresence mode="popLayout">
            {currentList.map((r, i) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-center gap-3.5 px-4 py-3.5"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{r.coupon_title || 'Reward'}</p>
                  <p className="text-[11px] text-txt-muted mt-0.5">
                    {r.partner_name || 'Partner'} · {r.redeemed_at ? new Date(r.redeemed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                  </p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  {r.coupon_code && (
                    <button
                      type="button"
                      onClick={() => copyCode(r.coupon_code)}
                      className="flex items-center gap-1 text-[11px] font-bold rounded-lg px-2 py-1 transition-all active:scale-95"
                      style={{ backgroundColor: `hsl(${theme.primary} / 0.1)`, color: `hsl(${theme.primary})` }}
                    >
                      <Copy className="h-3 w-3" /> {r.coupon_code}
                    </button>
                  )}
                  <span className="text-xs font-bold text-amber-400 tabular-nums">−{r.points_deducted?.toLocaleString('en-IN')}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {currentList.map((c, i) => {
              const isExpired = tab === 'expired';
              return (
                <motion.button
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.3) }}
                  type="button"
                  onClick={() => !isExpired && navigate('/app/rewards')}
                  disabled={isExpired}
                  className={`w-full rounded-2xl border border-border bg-card p-4 flex items-center gap-3.5 text-left transition-all ${
                    isExpired ? 'opacity-50' : 'active:scale-[0.98] hover:bg-muted/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center border border-border/50 shrink-0">
                    {c.brand_logo || c.partner_logo ? (
                      <img src={resolveImageUrl(c.brand_logo || c.partner_logo)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Gift className="h-4 w-4 text-txt-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{c.title}</p>
                    <p className="text-[11px] text-txt-muted mt-0.5">{c.partner_name || 'Partner'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums" style={{ color: isExpired ? undefined : `hsl(${theme.primary})` }}>
                      {c.points_cost} pts
                    </p>
                    {isExpired && c.expiry_date && (
                      <p className="text-[10px] text-txt-muted flex items-center gap-0.5 justify-end mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(c.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                    {!isExpired && <ChevronRight className="h-3.5 w-3.5 text-txt-muted ml-auto mt-0.5" />}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default RewardsHistoryPage;
