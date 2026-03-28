import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Copy, Check, Clock, ChevronRight, Sparkles, Loader2,
  CreditCard, Inbox, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

import api from '@/utils/api';
import useUserTheme from '@/hooks/useUserTheme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS = {
  pending:  'bg-amber-500/15  text-amber-400  border-amber-500/25',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  rejected: 'bg-red-500/15    text-red-400    border-red-500/25',
};

// ─── Gift Card Reveal Overlay ────────────────────────────────────────────────

function RevealOverlay({ card, primary, onClose }) {
  const [copiedField, setCopiedField] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const copy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, rotateY: 180 }}
        animate={{ scale: 1, rotateY: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-sm rounded-3xl border border-border/50 bg-card p-7 space-y-5 text-center"
        onClick={e => e.stopPropagation()}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
          className="inline-flex p-4 rounded-full mx-auto" style={{ background: `hsl(${primary} / 0.15)` }}>
          <Gift className="w-10 h-10" style={{ color: `hsl(${primary})` }} />
        </motion.div>

        <div>
          <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-xl font-bold">
            {card.brand_name}
          </motion.h3>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-muted-foreground text-sm mt-1">
            Gift Card — ₹{card.card_value || card.requested_amount}
          </motion.p>
        </div>

        {!revealed ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Button onClick={() => setRevealed(true)} className="rounded-xl w-full gap-2">
              <Eye className="w-4 h-4" /> Tap to reveal code
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
            <div className="rounded-2xl bg-muted/50 p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Card Code</p>
              <div className="flex items-center justify-center gap-2">
                <p className="font-mono text-lg font-bold tracking-widest">{card.card_code}</p>
                <button onClick={() => copy(card.card_code, 'code')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  {copiedField === 'code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
            {card.card_pin && (
              <div className="rounded-2xl bg-muted/50 p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Card PIN</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="font-mono text-lg font-bold tracking-widest">{card.card_pin}</p>
                  <button onClick={() => copy(card.card_pin, 'pin')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    {copiedField === 'pin' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <Button variant="outline" onClick={onClose} className="rounded-xl w-full">Close</Button>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GiftCardsPage() {
  const { primary } = useUserTheme();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealCard, setRevealCard] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/dynamic-coupons/my-requests');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const redeemed  = requests.filter(r => r.status === 'approved' && r.card_code);
  const pending   = requests.filter(r => r.status === 'pending');
  const rejected  = requests.filter(r => r.status === 'rejected');
  const unredeemed = [...pending, ...rejected];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6 pb-28">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6" style={{ color: `hsl(${primary})` }} />
          Gift Cards
        </h1>
        <p className="text-sm text-muted-foreground">
          View your redeemed gift cards and track pending requests.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: 'Redeemed', value: redeemed.length, color: 'emerald' },
          { label: 'Pending', value: pending.length, color: 'amber' },
          { label: 'Rejected', value: rejected.length, color: 'red' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border/50 bg-card/80 p-3.5 text-center space-y-1">
            <p className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ═══════════ Redeemed Gift Cards ═══════════ */}
      <motion.section
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-400" /> Redeemed
          </h2>
          {redeemed.length > 0 && (
            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs">
              {redeemed.length} card{redeemed.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {redeemed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/15 px-6 py-12 text-center space-y-3">
            <Gift className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-semibold text-muted-foreground">No redeemed gift cards yet</p>
            <p className="text-xs text-muted-foreground/70 max-w-[240px] mx-auto">
              Request a coupon from Dynamic Coupons and your approved gift cards will appear here.
            </p>
            <Button
              variant="outline" size="sm" className="rounded-xl mt-1"
              onClick={() => navigate('/app/dynamic-coupons')}
            >
              <Sparkles className="w-4 h-4 mr-1.5" /> Explore Dynamic Coupons
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {redeemed.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-emerald-500/20 bg-card/80 overflow-hidden cursor-pointer
                  hover:border-emerald-500/40 active:scale-[0.98] transition-all"
                onClick={() => setRevealCard(req)}
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `hsl(${primary} / 0.12)` }}>
                    🎁
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{req.brand_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">₹{req.card_value || req.requested_amount} gift card</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[10px] mb-1">
                      Redeemed
                    </Badge>
                    <p className="text-xs font-medium flex items-center gap-1 justify-end" style={{ color: `hsl(${primary})` }}>
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ═══════════ Pending / Rejected Requests ═══════════ */}
      <motion.section
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" /> Pending & History
          </h2>
          {pending.length > 0 && (
            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/25 text-xs">
              {pending.length} awaiting review
            </Badge>
          )}
        </div>

        {unredeemed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/15 px-6 py-12 text-center space-y-3">
            <Inbox className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-semibold text-muted-foreground">No pending requests</p>
            <p className="text-xs text-muted-foreground/70">Your coupon requests will show up here.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {unredeemed.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border/50 bg-card/80 p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ background: `hsl(${primary} / 0.1)`, color: `hsl(${primary})` }}>
                    {req.brand_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{req.brand_name}</p>
                    <p className="text-xs text-muted-foreground">₹{req.requested_amount} · {req.points_used} pts</p>
                  </div>
                  <Badge className={`${STATUS_COLORS[req.status]} border text-[10px] shrink-0 capitalize`}>
                    {req.status === 'pending' ? '⏳' : '❌'} {req.status}
                  </Badge>
                </div>

                {req.status === 'pending' && (
                  <p className="text-xs text-amber-400/80 flex items-center gap-1.5 mt-2 pl-[52px]">
                    <Clock className="w-3 h-3 shrink-0" />
                    {req.points_used} pts locked while under review
                  </p>
                )}
                {req.status === 'rejected' && (
                  <p className="text-xs text-muted-foreground mt-2 pl-[52px]">Points restored to your balance</p>
                )}
                {req.created_at && (
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5 pl-[52px]">
                    {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ═══════════ CTA to Dynamic Coupons ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 to-muted/30 p-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `hsl(${primary} / 0.15)` }}>
            <Sparkles className="w-6 h-6" style={{ color: `hsl(${primary})` }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Want more gift cards?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use your Lynkr points to request gift cards from top brands.
            </p>
          </div>
        </div>
        <Button
          className="w-full rounded-xl mt-4"
          onClick={() => navigate('/app/dynamic-coupons')}
        >
          <Sparkles className="w-4 h-4 mr-1.5" /> Explore Dynamic Coupons
        </Button>
      </motion.div>

      {/* ═══════════ Reveal Overlay ═══════════ */}
      <AnimatePresence>
        {revealCard && (
          <RevealOverlay card={revealCard} primary={primary} onClose={() => setRevealCard(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
