import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useUserTheme from '@/hooks/useUserTheme';
import {
  ArrowLeft,
  CreditCard,
  TrendingUp,
  Gift,
  IndianRupee,
  Loader2,
  Sparkles,
  ShoppingBag,
  Users,
  Ticket,
  XCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import api from '@/utils/api';

const StatusDot = ({ status }) => {
  const c = { VERIFIED: 'bg-emerald-400', PENDING: 'bg-amber-400', REJECTED: 'bg-red-400' };
  return <span className={`w-2 h-2 rounded-full shrink-0 ${c[status] || c.PENDING}`} />;
};

const iconFor = (item) => {
  if (item.kind === 'coupon_request') {
    if (item.status === 'rejected') return XCircle;
    if (item.status === 'approved') return CheckCircle2;
    return Clock;
  }
  if (item.kind === 'purchase') return CreditCard;
  const d = (item.desc || '').toLowerCase();
  if (d.includes('referral')) return Users;
  if (d.includes('redeem') || d.includes('coupon') || d.includes('reward')) return Gift;
  if (d.includes('purchase') || d.includes('verified')) return ShoppingBag;
  return item.kind === 'earned' ? TrendingUp : Gift;
};

const couponColor = (status) => {
  if (status === 'rejected') return { bg: 'bg-red-500/10', text: 'text-red-400' };
  if (status === 'approved') return { bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
  return { bg: 'bg-amber-500/10', text: 'text-amber-400' };
};

const ActivityTimelinePage = () => {
  const navigate = useNavigate();
  const theme = useUserTheme();
  const [ledger, setLedger] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [couponRequests, setCouponRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const r = await api.get('/points/ledger'); setLedger(r.data || []); } catch {}
      try { const r = await api.get('/purchases'); setPurchases(r.data || []); } catch {}
      try { const r = await api.get('/dynamic-coupons/my-requests'); setCouponRequests(Array.isArray(r.data) ? r.data : []); } catch {}
      setLoading(false);
    })();
  }, []);

  const timeline = useMemo(() => {
    const couponLabel = (r) => {
      if (r.status === 'rejected') return `Coupon rejected: ${r.brand_name}`;
      if (r.status === 'approved') return `Coupon approved: ${r.brand_name}`;
      return `Coupon requested: ${r.brand_name}`;
    };
    return [
      ...ledger.map(e => ({
        kind: e.type === 'CREDIT' ? 'earned' : 'redeemed',
        desc: e.description || (e.type === 'CREDIT' ? 'Points earned' : 'Points used'),
        amount: e.amount,
        date: e.created_at,
      })),
      ...purchases.map(p => ({
        kind: 'purchase',
        desc: p.brand || p.store_name || 'Purchase',
        amount: p.amount,
        status: p.status,
        date: p.timestamp || p.created_at,
      })),
      ...couponRequests.map(r => ({
        kind: 'coupon_request',
        desc: couponLabel(r),
        amount: r.points_used || 0,
        status: r.status,
        date: r.created_at,
      })),
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [ledger, purchases, couponRequests]);

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
        <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Your Activity</p>
        <h1 className="mt-1 text-2xl font-heading font-bold text-foreground">Activity Timeline</h1>
      </header>

      {timeline.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center"
        >
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-txt-muted" />
          <p className="text-sm text-txt-secondary font-semibold">No activity yet</p>
          <p className="text-xs text-txt-muted mt-1">Make purchases and earn points to see your timeline</p>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <AnimatePresence mode="popLayout">
            {timeline.map((item, i) => {
              const isEarned = item.kind === 'earned';
              const isPurchase = item.kind === 'purchase';
              const isCoupon = item.kind === 'coupon_request';
              const Icon = iconFor(item);
              const cc = isCoupon ? couponColor(item.status) : null;
              return (
                <motion.div
                  key={`tl-${i}`}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, delay: Math.min(i * 0.025, 0.5) }}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isCoupon ? cc.bg : isPurchase ? 'bg-primary/10' : isEarned ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                  }`}>
                    <Icon className={`h-3.5 w-3.5 ${
                      isCoupon ? cc.text : isPurchase ? 'text-primary' : isEarned ? 'text-emerald-400' : 'text-amber-400'
                    }`} />
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
                        <p className={`text-sm font-bold tabular-nums ${item.status === 'rejected' ? 'text-red-400' : item.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {item.status === 'rejected' ? '' : '−'}{item.amount.toLocaleString('en-IN')}
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
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default ActivityTimelinePage;
