import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Gift, Copy, Check, ChevronRight, Sparkles, Loader2, Clock, Inbox, Search } from 'lucide-react';
import { toast } from 'sonner';

import api, { resolveImageUrl } from '@/utils/api';
import useUserTheme from '@/hooks/useUserTheme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose,
} from '@/components/ui/drawer';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};
const STATUS_ICON = { pending: '⏳', approved: '✅', rejected: '❌' };

const TABS = [
  { key: 'explore', label: 'Explore' },
  { key: 'requests', label: 'Requests' },
  { key: 'approved', label: 'Approved' },
];

// ─── Points Bar ──────────────────────────────────────────────────────────────

function PointsBar({ total, available, locked, primary }) {
  const [showTooltip, setShowTooltip] = useState(false);
  if (total <= 0) return null;

  const availPct = Math.max(0, Math.min(100, (available / total) * 100));
  const lockedPct = Math.max(0, Math.min(100 - availPct, (locked / total) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{total.toLocaleString('en-IN')} pts</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-muted-foreground">{available.toLocaleString('en-IN')} available</span>
          </span>
          {locked > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-muted-foreground">{locked.toLocaleString('en-IN')} in review</span>
            </span>
          )}
        </div>
      </div>

      <div
        className="relative h-3 rounded-full bg-muted/40 overflow-hidden cursor-pointer"
        onPointerEnter={() => locked > 0 && setShowTooltip(true)}
        onPointerLeave={() => setShowTooltip(false)}
        onClick={() => locked > 0 && setShowTooltip(t => !t)}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${availPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {locked > 0 && (
          <motion.div
            className="absolute inset-y-0 rounded-full bg-amber-500/80"
            initial={{ width: 0 }}
            animate={{ width: `${lockedPct}%`, left: `${availPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          />
        )}

        <AnimatePresence>
          {showTooltip && locked > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap
                bg-card border border-border rounded-xl px-3 py-1.5 text-xs text-muted-foreground shadow-lg"
            >
              <Clock className="w-3 h-3 inline mr-1 text-amber-400" />
              {locked} pts locked while your request is under review
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, subtitle, cta, onCta }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center space-y-3"
    >
      <Icon className="w-10 h-10 mx-auto text-muted-foreground/60" />
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
      {cta && onCta && (
        <Button variant="outline" size="sm" className="rounded-xl mt-2" onClick={onCta}>{cta}</Button>
      )}
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DynamicCouponsPage() {
  const { primary } = useUserTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState('explore');
  const [unlockStatus, setUnlockStatus] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [sliderValue, setSliderValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [revealCard, setRevealCard] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const maxSlider = configs.length > 0
    ? Math.max(...configs.map(c => c.min_unlock_amount)) * 1.3
    : 5000;

  const fetchData = useCallback(async () => {
    try {
      const statusRes = await api.get('/dynamic-coupons/unlock-status').catch(() => null);
      if (statusRes) setUnlockStatus(statusRes.data);
    } catch { /* ignore */ }
    try {
      const configsRes = await api.get('/dynamic-coupons/configs');
      setConfigs(Array.isArray(configsRes.data) ? configsRes.data : []);
    } catch { /* ignore */ }
    try {
      const requestsRes = await api.get('/dynamic-coupons/my-requests');
      setMyRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      await api.post('/dynamic-coupons/unlock');
      await fetchData();
      toast.success('Dynamic Coupons unlocked!');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to unlock');
    } finally {
      setUnlocking(false);
    }
  };

  const visibleBrands = configs.filter(c => sliderValue >= c.min_unlock_amount);

  const handleRequest = async () => {
    if (!selectedBrand) return;
    setRequesting(true);
    try {
      await api.post('/dynamic-coupons/request', {
        config_id: selectedBrand.id,
        requested_amount: sliderValue,
      });
      toast.success('Request submitted! Points are now in review.');
      setSelectedBrand(null);
      await fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Request failed');
    } finally {
      setRequesting(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const totalPts = unlockStatus?.total_points ?? unlockStatus?.points ?? 0;
  const lockedPts = unlockStatus?.locked_points ?? 0;
  const availablePts = unlockStatus?.available_points ?? totalPts;

  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const approvedRequests = myRequests.filter(r => r.status === 'approved');
  const allNonApproved = myRequests.filter(r => r.status !== 'approved');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- LOCKED STATE ---
  if (unlockStatus && !unlockStatus.is_unlocked) {
    const progress = Math.min((totalPts / 100) * 100, 100);
    return (
      <div className="p-5 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 text-center space-y-5"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="inline-flex p-5 rounded-full bg-muted/50"
          >
            <Lock className="w-12 h-12 text-muted-foreground" />
          </motion.div>
          <h2 className="text-xl font-bold">Dynamic Coupons</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Unlock real gift cards from top brands using your Lynkr points. Earn {Math.max(0, 100 - totalPts)} more points to unlock.
          </p>
          <div className="space-y-2 max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{totalPts} pts</span>
              <span>100 pts</span>
            </div>
            <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `hsl(${primary})` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
          {unlockStatus.eligible && (
            <Button onClick={handleUnlock} disabled={unlocking} className="rounded-full px-8">
              {unlocking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />}
              Unlock Now
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  // --- UNLOCKED STATE ---
  return (
    <div className="p-5 space-y-5 pb-28">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6" style={{ color: `hsl(${primary})` }} />
          Dynamic Coupons
        </h1>
        <p className="text-sm text-muted-foreground">
          Unlock real gift cards from top brands with your points.
        </p>
      </motion.div>

      {/* Points Bar — only when there are locked points */}
      {lockedPts > 0 && (
        <PointsBar total={totalPts} available={availablePts} locked={lockedPts} primary={primary} />
      )}

      {/* Tab Strip */}
      <div className="flex gap-1 bg-muted/30 rounded-xl p-1">
        {TABS.map(t => {
          const isActive = tab === t.key;
          const count = t.key === 'requests' ? pendingRequests.length
            : t.key === 'approved' ? approvedRequests.length : 0;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 relative rounded-lg py-2.5 text-sm font-semibold transition-all touch-manipulation
                ${isActive ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t.label}
              {count > 0 && (
                <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                  ${t.key === 'requests' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ════════════════════ EXPLORE TAB ════════════════════ */}
      {tab === 'explore' && (
        <motion.div
          key="explore"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          {/* Slider */}
          <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Coupon Value</span>
              <span className="text-2xl font-bold tabular-nums" style={{ color: sliderValue > 0 ? `hsl(${primary})` : undefined }}>
                ₹{Math.round(sliderValue).toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxSlider}
              step={10}
              value={sliderValue}
              onChange={e => setSliderValue(Number(e.target.value))}
              className="w-full h-2.5 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab
                [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:bg-[var(--thumb-bg)]"
              style={{
                '--thumb-bg': `hsl(${primary})`,
                background: `linear-gradient(to right, hsl(${primary}) ${(sliderValue / maxSlider) * 100}%, hsl(var(--muted) / 0.5) ${(sliderValue / maxSlider) * 100}%)`,
                WebkitAppearance: 'none',
              }}
            />
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">₹0</span>
              <span className="text-[10px] text-muted-foreground">₹{Math.round(maxSlider).toLocaleString('en-IN')}</span>
            </div>
            {configs.length > 0 && sliderValue < configs[0].min_unlock_amount && (
              <p className="text-xs text-center text-muted-foreground">
                Slide to ₹{configs[0].min_unlock_amount} to reveal your first brand
              </p>
            )}
          </div>

          {/* Brand Cards */}
          <AnimatePresence mode="popLayout">
            {visibleBrands.map((brand, i) => (
              <motion.div
                key={brand.id}
                layout
                initial={{ opacity: 0, scale: 0.7, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.05 }}
                className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 cursor-pointer
                  hover:border-border active:scale-[0.98] transition-all overflow-hidden"
                onClick={() => setSelectedBrand(brand)}
              >
                <div className="flex items-center gap-4">
                  {brand.brand_logo_url ? (
                    <img src={resolveImageUrl(brand.brand_logo_url)} alt={brand.brand_name} className="w-14 h-14 rounded-2xl object-cover bg-muted/50" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                      style={{ background: `hsl(${primary} / 0.15)`, color: `hsl(${primary})` }}>
                      {brand.brand_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{brand.brand_name}</h3>
                    <p className="text-xs text-muted-foreground">Unlocks at ₹{brand.min_unlock_amount}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="secondary" className="text-xs font-medium">{brand.points_cost} pts</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} transition={{ duration: 1.5 }}
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ boxShadow: `0 0 40px 8px hsl(${primary} / 0.3)` }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {visibleBrands.length === 0 && sliderValue > 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Keep sliding to reveal brands...</p>
          )}
        </motion.div>
      )}

      {/* ════════════════════ REQUESTS TAB ════════════════════ */}
      {tab === 'requests' && (
        <motion.div
          key="requests"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {myRequests.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No requests yet"
              subtitle="Explore brands and request your first coupon"
              cta="Explore Coupons"
              onCta={() => setTab('explore')}
            />
          ) : (
            myRequests.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border/50 bg-card/80 p-4 space-y-2 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                      style={{ background: `hsl(${primary} / 0.12)`, color: `hsl(${primary})` }}>
                      {req.brand_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{req.brand_name}</p>
                      <p className="text-xs text-muted-foreground">₹{req.requested_amount} · {req.points_used} pts</p>
                    </div>
                  </div>
                  <Badge className={`${STATUS_COLORS[req.status]} border text-xs`}>
                    {STATUS_ICON[req.status]} {req.status}
                  </Badge>
                </div>

                {req.status === 'pending' && (
                  <p className="text-xs text-amber-400/80 flex items-center gap-1.5 pl-[52px]">
                    <Clock className="w-3 h-3" />
                    {req.points_used} pts locked while under review
                  </p>
                )}
                {req.status === 'approved' && req.card_code && (
                  <div className="pl-[52px]">
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setRevealCard(req)}>
                      <Gift className="w-4 h-4 mr-1.5" /> View Gift Card
                    </Button>
                  </div>
                )}
                {req.status === 'rejected' && (
                  <p className="text-xs text-muted-foreground pl-[52px]">Points restored to your balance</p>
                )}

                {req.created_at && (
                  <p className="text-[10px] text-muted-foreground/60 pl-[52px]">
                    {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* ════════════════════ APPROVED TAB ════════════════════ */}
      {tab === 'approved' && (
        <motion.div
          key="approved"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {approvedRequests.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No approved coupons yet"
              subtitle="Once your request is approved, your gift card will appear here"
              cta="Explore Coupons"
              onCta={() => setTab('explore')}
            />
          ) : (
            approvedRequests.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-emerald-500/20 bg-card/80 overflow-hidden cursor-pointer
                  hover:border-emerald-500/40 active:scale-[0.98] transition-all"
                onClick={() => req.card_code && setRevealCard(req)}
              >
                <div className="p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: `hsl(${primary} / 0.12)` }}>
                    🎁
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{req.brand_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ₹{req.card_value || req.requested_amount} gift card
                    </p>
                  </div>
                  {req.card_code ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                      Tap to reveal
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Processing</Badge>
                  )}
                </div>
                {req.card_code && (
                  <div className="border-t border-border/50 px-5 py-3 flex items-center justify-between bg-muted/10">
                    <span className="text-xs text-muted-foreground">Gift card ready</span>
                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: `hsl(${primary})` }}>
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* ═══════════ Confirm Request Drawer ═══════════ */}
      <Drawer open={!!selectedBrand} onOpenChange={open => !open && setSelectedBrand(null)}>
        <DrawerContent>
          {selectedBrand && (
            <>
              <DrawerHeader className="text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl font-bold"
                  style={{ background: `hsl(${primary} / 0.15)`, color: `hsl(${primary})` }}>
                  {selectedBrand.brand_logo_url ? (
                    <img src={resolveImageUrl(selectedBrand.brand_logo_url)} alt={selectedBrand.brand_name} className="w-full h-full rounded-2xl object-cover" />
                  ) : selectedBrand.brand_name.charAt(0)}
                </div>
                <DrawerTitle>{selectedBrand.brand_name}</DrawerTitle>
                <DrawerDescription>
                  Redeem a ₹{Math.round(sliderValue)} gift card for {selectedBrand.points_cost} points
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-6 pb-2 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coupon Value</span>
                  <span className="font-semibold">₹{Math.round(sliderValue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Points Required</span>
                  <span className="font-semibold">{selectedBrand.points_cost} pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available Balance</span>
                  <span className="font-semibold">{availablePts.toLocaleString('en-IN')} pts</span>
                </div>

                {availablePts >= selectedBrand.points_cost && (
                  <div className="rounded-xl bg-muted/30 p-3 space-y-2">
                    <p className="text-[11px] text-muted-foreground font-medium">After this request:</p>
                    <div className="h-2 rounded-full bg-muted/40 overflow-hidden flex">
                      <div className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${((availablePts - selectedBrand.points_cost) / totalPts) * 100}%` }} />
                      <div className="h-full bg-amber-500/80 transition-all"
                        style={{ width: `${((lockedPts + selectedBrand.points_cost) / totalPts) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{(availablePts - selectedBrand.points_cost).toLocaleString('en-IN')} available</span>
                      <span>{(lockedPts + selectedBrand.points_cost).toLocaleString('en-IN')} in review</span>
                    </div>
                  </div>
                )}
              </div>

              <DrawerFooter>
                <Button onClick={handleRequest} disabled={requesting || availablePts < selectedBrand.points_cost} className="rounded-xl">
                  {requesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {availablePts < selectedBrand.points_cost
                    ? `Need ${selectedBrand.points_cost - availablePts} more pts`
                    : `Redeem with ${selectedBrand.points_cost} pts`}
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost" className="rounded-xl">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* ═══════════ Gift Card Reveal ═══════════ */}
      <AnimatePresence>
        {revealCard && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
            onClick={() => setRevealCard(null)}
          >
            <motion.div
              initial={{ scale: 0.5, rotateY: 180 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-full max-w-sm rounded-3xl border border-border/50 bg-card p-8 space-y-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
                className="inline-flex p-4 rounded-full mx-auto" style={{ background: `hsl(${primary} / 0.15)` }}>
                <Gift className="w-10 h-10" style={{ color: `hsl(${primary})` }} />
              </motion.div>

              <div>
                <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-xl font-bold">
                  {revealCard.brand_name}
                </motion.h3>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-muted-foreground text-sm mt-1">
                  Gift Card — ₹{revealCard.card_value || revealCard.requested_amount}
                </motion.p>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-3">
                <div className="rounded-2xl bg-muted/50 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Card Code</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="font-mono text-lg font-bold tracking-widest">{revealCard.card_code}</p>
                    <button onClick={() => copyToClipboard(revealCard.card_code, 'code')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      {copiedField === 'code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl bg-muted/50 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Card PIN</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="font-mono text-lg font-bold tracking-widest">{revealCard.card_pin}</p>
                    <button onClick={() => copyToClipboard(revealCard.card_pin, 'pin')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      {copiedField === 'pin' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                <Button variant="outline" onClick={() => setRevealCard(null)} className="rounded-xl w-full">Close</Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
