import React, { useEffect, useState, useCallback, useRef, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useUserTheme from '@/hooks/useUserTheme';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Gift,
  Zap,
  Store,
  Globe,
  Package,
  Heart,
  ChevronRight,
  House,
  IndianRupee,
  Users,
  CreditCard,
  ArrowRight,
  Sparkles,
  Flame,
  Clock,
  TrendingUp,
  Ticket,
  BarChart3,
  BotMessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { resolveImageUrl } from '@/utils/api';

const CatalogPage = lazy(() => import('@/pages/CatalogPage'));
const RewardsPage = lazy(() => import('@/pages/RewardsPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const PurchasesPage = lazy(() => import('@/pages/PurchasesPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));

const CATEGORIES = [
  { key: 'stores', label: 'Stores', Icon: ShoppingBag, color: 'primary', Component: CatalogPage },
  { key: 'rewards', label: 'Rewards', Icon: Gift, color: '280 60% 50%', Component: RewardsPage },
  { key: 'insights', label: 'Insights', Icon: BarChart3, color: '142 71% 45%', Component: DashboardPage },
  { key: 'purchases', label: 'Purchases', Icon: CreditCard, color: '35 92% 50%', Component: PurchasesPage },
  { key: 'ai', label: 'AI', Icon: BotMessageSquare, color: '200 80% 50%', Component: ChatPage },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, delay: 0.06 * i, ease: [0.25, 0.46, 0.45, 0.94] },
});

/* ── Trending on Lynkr — live social proof feed ── */

const SUBTITLES = [
  "What everyone's earning right now",
  'Live activity across Lynkr',
  "Don't miss these rewards",
  "See what's hot today",
];

const timeAgo = (dateStr) => {
  if (!dateStr) return 'just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const TrendingSection = ({ partners, rewards, communityActivity, theme, navigate, fadeIdx }) => {
  const [subtitleIdx, setSubtitleIdx] = useState(0);
  const [visibleActivity, setVisibleActivity] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const iv = setInterval(() => setSubtitleIdx(i => (i + 1) % SUBTITLES.length), 3500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (communityActivity.length === 0) return;
    const iv = setInterval(() => setVisibleActivity(i => (i + 1) % communityActivity.length), 4000);
    return () => clearInterval(iv);
  }, [communityActivity.length]);

  const todayRedemptions = communityActivity.length;

  const feedCards = [];

  feedCards.push({
    type: 'ai',
    id: 'lynkr-ai',
    icon: Sparkles,
    color: '210 100% 56%',
    glowColor: '210 100% 56%',
    title: 'Lynkr AI',
    subtitle: 'Get instant spending insights & smart recommendations',
    to: '/app/chat',
    badge: 'Try it',
  });

  if (communityActivity.length > 0) {
    const act = communityActivity[visibleActivity % communityActivity.length];
    if (act) {
      feedCards.push({
        type: 'activity',
        id: `activity-${visibleActivity}`,
        icon: Sparkles,
        color: '280 60% 50%',
        glowColor: '280 60% 50%',
        title: `${act.username || 'Someone'} redeemed a reward`,
        subtitle: act.partner_name ? `from ${act.partner_name} · ${timeAgo(act.redeemed_at)}` : timeAgo(act.redeemed_at),
        isLive: true,
      });
    }
  }

  if (rewards.length > 0) {
    const nextReward = rewards[Math.floor(Math.random() * rewards.length)];
    feedCards.push({
      type: 'deal',
      id: 'deal-0',
      icon: Zap,
      color: '35 92% 50%',
      glowColor: '35 92% 50%',
      title: nextReward ? `${nextReward.name || nextReward.title}` : 'New rewards available',
      subtitle: nextReward ? `Redeem for ${nextReward.points || nextReward.points_cost} pts` : 'Check what\'s new',
      to: '/app/rewards',
    });
  }

  feedCards.push({
    type: 'dynamic',
    id: 'dynamic-coupons',
    icon: Ticket,
    color: '262 83% 58%',
    glowColor: '262 83% 58%',
    title: 'Dynamic Coupons',
    subtitle: 'Slide to unlock real gift cards',
    to: '/app/dynamic-coupons',
    badge: 'New',
  });

  feedCards.push({
    type: 'coming_soon',
    id: 'coupon-drops',
    icon: Flame,
    color: '350 80% 55%',
    glowColor: '350 80% 55%',
    title: 'Coupon Drops',
    subtitle: 'Flash deals dropping soon — stay tuned',
    badge: 'Coming Soon',
  });

  if (todayRedemptions > 0) {
    feedCards.push({
      type: 'community',
      id: 'community-stat',
      icon: Users,
      color: '142 71% 45%',
      glowColor: '142 71% 45%',
      title: `${todayRedemptions} rewards redeemed`,
      subtitle: 'by the Lynkr community',
    });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.06 * fadeIdx }}
      className="mb-7"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          Trending on Lynkr
        </p>
        <div className="flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
          <span className="text-[10px] text-emerald-400 font-bold">Live</span>
        </div>
      </div>

      <div className="h-5 mb-3.5 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.p
            key={subtitleIdx}
            className="text-[11px] text-txt-muted font-medium absolute"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {SUBTITLES[subtitleIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 snap-x snap-mandatory"
      >
        <AnimatePresence mode="popLayout">
          {feedCards.map((card, i) => (
            <motion.button
              key={card.id}
              layout
              type="button"
              onClick={() => card.to && navigate(card.to)}
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              disabled={!card.to}
              className={`shrink-0 w-[220px] snap-start rounded-2xl border bg-card p-4 text-left transition-all touch-manipulation relative overflow-hidden group ${
                card.to ? 'active:scale-[0.97] cursor-pointer' : ''
              }`}
              style={{
                borderColor: `hsl(${card.color} / 0.12)`,
              }}
            >
              <span
                aria-hidden
                className="border-tracer pointer-events-none"
                style={{
                  '--tracer-color': `hsl(${card.glowColor})`,
                  animationDelay: `${i * -1.2}s`,
                }}
              />
              <div className="flex items-start gap-3 mb-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `hsl(${card.color} / 0.12)` }}
                >
                  {card.logo ? (
                    <img src={resolveImageUrl(card.logo)} alt="" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <card.icon className="h-4 w-4" style={{ color: `hsl(${card.color})` }} />
                  )}
                </div>
                {card.isLive && (
                  <span className="flex items-center gap-1 ml-auto">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                    </span>
                  </span>
                )}
                {card.badge && (
                  <span
                    className="ml-auto text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `hsl(${card.color} / 0.15)`,
                      color: `hsl(${card.color})`,
                    }}
                  >
                    {card.badge}
                  </span>
                )}
              </div>

              <p className="text-[13px] font-bold text-foreground leading-snug line-clamp-2">{card.title}</p>
              <p className="text-[11px] text-txt-muted mt-1 font-medium truncate">{card.subtitle}</p>

              {card.to && (
                <div className="mt-2.5 flex items-center gap-0.5">
                  <span className="text-[10px] font-bold" style={{ color: `hsl(${card.color})` }}>
                    {card.type === 'ai' ? 'Chat now' : card.type === 'deal' ? 'Claim now' : card.type === 'dynamic' ? 'Explore' : 'View'}
                  </span>
                  <ChevronRight className="h-3 w-3" style={{ color: `hsl(${card.color})` }} />
                </div>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

/* ═══════════════════════════════════════════════════════════
   HomeHub — persistent container with inline child rendering
   ═══════════════════════════════════════════════════════════ */

const HomeHub = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useUserTheme();
  const firstName = (user?.full_name || user?.username || '').split(' ')[0];

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [communityActivity, setCommunityActivity] = useState([]);
  const [lockedPts, setLockedPts] = useState(0);

  const [activeCat, setActiveCat] = useState(null);

  useEffect(() => {
    setActiveCat(null);
  }, [location.key]);

  const resolveColor = (c) => c === 'primary' ? theme.primary : c;
  const isExpanded = activeCat !== null;

  useEffect(() => {
    (async () => {
      try { const res = await api.get('/user/dashboard'); setData(res.data); }
      catch { /* */ }
      finally { setLoading(false); }
    })();
    (async () => {
      try { const res = await api.get('/partners/active'); setPartners((res.data || []).filter(p => p.catalog_slug)); }
      catch { setPartners([]); }
      finally { setPartnersLoading(false); }
    })();
    (async () => {
      try { const res = await api.get('/user/favorite-stores'); setFavoriteIds(res.data || []); }
      catch { /* */ }
    })();
    (async () => {
      try { const res = await api.get('/community/redemptions'); setCommunityActivity(res.data || []); }
      catch { /* */ }
    })();
    (async () => {
      try { const res = await api.get('/dynamic-coupons/unlock-status'); setLockedPts(res.data?.locked_points ?? 0); }
      catch { /* */ }
    })();
  }, []);

  const toggleFavorite = useCallback(async (partnerId) => {
    const isFav = favoriteIds.includes(partnerId);
    const store = partners.find(p => p.id === partnerId);
    const name = store?.business_name || 'Store';
    setFavoriteIds(prev => isFav ? prev.filter(id => id !== partnerId) : [...prev, partnerId]);
    try {
      if (isFav) {
        await api.delete(`/user/favorite-stores/${partnerId}`);
        toast('Removed from favorites', { icon: '💔' });
      } else {
        await api.post(`/user/favorite-stores/${partnerId}`);
        toast(`${name} added to favorites`, { icon: '❤️' });
      }
    } catch {
      setFavoriteIds(prev => isFav ? [...prev, partnerId] : prev.filter(id => id !== partnerId));
      toast.error('Could not update favorites');
    }
  }, [favoriteIds, partners]);

  const points = data?.points ?? 0;
  const rewards = data?.available_rewards ?? [];
  const recentPurchases = data?.recent_purchases ?? [];
  const favSet = new Set(favoriteIds);
  const favStores = partners.filter(p => favSet.has(p.id));
  const otherStores = partners.filter(p => !favSet.has(p.id));
  const allStoresOrdered = [...favStores, ...otherStores];

  if (loading && partnersLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `hsl(${theme.primary} / 0.4)`, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const ActiveComponent = activeCat ? CATEGORIES.find(c => c.key === activeCat)?.Component : null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">

      {/* ═══ STICKY HEADER ZONE (hero compresses + strip stays) ═══ */}
      <motion.div
        layout
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className={isExpanded ? 'sticky top-[3.5rem] z-30 bg-background/95 backdrop-blur-xl border-b border-border/50' : ''}
      >
        <div className={`mx-auto max-w-xl ${isExpanded ? 'px-4 pt-2.5 pb-2' : 'px-5 pt-7 sm:pt-10 sm:px-6'}`}>

          {/* ── HERO — compresses when a category is active ── */}
          <AnimatePresence mode="wait">
            {!isExpanded && (
              <motion.header
                key="hero-full"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="mb-7"
              >
                <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">{getGreeting()}</p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-heading font-bold text-foreground">{firstName}</h1>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveCat('insights')}
                    className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 transition-all active:scale-[0.97] hover:bg-muted/50 touch-manipulation"
                  >
                    <Sparkles className="h-4 w-4" style={{ color: `hsl(${theme.primary})` }} />
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-heading font-bold text-foreground tabular-nums">{points.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-txt-muted font-bold uppercase">pts</span>
                      </div>
                      {lockedPts > 0 && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-emerald-400 font-semibold">{(points - lockedPts).toLocaleString('en-IN')} avail</span>
                          <span className="text-[9px] text-amber-400 font-semibold">{lockedPts.toLocaleString('en-IN')} in review</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-txt-muted ml-1" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/app/purchases?raise=1')}
                    className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all active:scale-[0.97] touch-manipulation"
                    style={{ backgroundColor: `hsl(${theme.primary})`, color: 'hsl(0 0% 100%)' }}
                  >
                    <Zap className="h-4 w-4" />
                    Raise
                  </button>
                </div>
              </motion.header>
            )}
          </AnimatePresence>

          {/* ── HOME BUTTON (only when expanded) ── */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setActiveCat(null)}
                  className="flex items-center gap-2 mb-2 rounded-xl px-2.5 py-1.5 text-txt-muted hover:text-foreground hover:bg-muted/50 transition-all touch-manipulation active:scale-[0.95]"
                >
                  <House className="h-4 w-4" />
                  <span className="text-[12px] font-semibold">Home</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CATEGORY STRIP (always visible, not scrollable) ── */}
          <motion.div
            layout
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className={isExpanded ? '' : 'mb-7'}
          >
            <div className="flex items-center justify-center gap-1">
              {CATEGORIES.map((cat, i) => {
                const hue = resolveColor(cat.color);
                const isActive = activeCat === cat.key;
                const isDimmed = isExpanded && !isActive;
                return (
                  <motion.button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveCat(isActive ? null : cat.key)}
                    layout
                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                    className="flex flex-col items-center touch-manipulation transition-opacity duration-200"
                    style={{ width: `${100 / CATEGORIES.length}%`, minWidth: isExpanded ? 48 : 56, opacity: isDimmed ? 0.45 : 1 }}
                  >
                    <div
                      className="relative flex items-center justify-center rounded-2xl transition-all duration-300"
                      style={{
                        width: isActive ? (isExpanded ? 44 : 60) : (isExpanded ? 36 : 52),
                        height: isActive ? (isExpanded ? 44 : 60) : (isExpanded ? 36 : 52),
                        background: isActive
                          ? `linear-gradient(145deg, hsl(${hue} / 0.28) 0%, hsl(${hue} / 0.1) 100%)`
                          : `linear-gradient(145deg, hsl(${hue} / 0.1) 0%, hsl(${hue} / 0.03) 100%)`,
                        borderWidth: 1.5,
                        borderStyle: 'solid',
                        borderColor: isActive ? `hsl(${hue} / 0.4)` : `hsl(${hue} / 0.12)`,
                        boxShadow: isActive
                          ? `0 4px 20px -4px hsl(${hue} / 0.3)`
                          : 'none',
                      }}
                    >
                      {isActive && (
          <div
            aria-hidden
                          className="pointer-events-none absolute inset-0 rounded-2xl opacity-50"
                          style={{ background: `radial-gradient(circle at 30% 30%, hsl(${hue} / 0.35) 0%, transparent 70%)` }}
                        />
                      )}
                      <cat.Icon
                        className="relative z-10 transition-all duration-300"
                        style={{
                          width: isActive ? (isExpanded ? 20 : 26) : (isExpanded ? 16 : 22),
                          height: isActive ? (isExpanded ? 20 : 26) : (isExpanded ? 16 : 22),
                          color: `hsl(${hue})`,
                          strokeWidth: isActive ? 2.2 : 1.8,
                        }}
                      />
              </div>
                    <span
                      className={`mt-1 font-bold leading-tight transition-all duration-200 ${isExpanded ? 'text-[9px]' : 'text-[11px] mt-1.5'}`}
                      style={{ color: isActive ? `hsl(${hue})` : undefined }}
                    >
                      <span className={isActive ? '' : 'text-txt-muted'}>{cat.label}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          </div>
      </motion.div>

      {/* ═══ CONTENT AREA ═══ */}
      <AnimatePresence mode="wait">
        {isExpanded ? (
          /* ── CHILD CATEGORY PAGE (inline) ── */
          <motion.div
            key={`child-${activeCat}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="min-h-[60vh]"
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-24">
                  <motion.div
                    className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: `hsl(${theme.primary} / 0.3)`, borderTopColor: 'transparent' }}
                  />
                </div>
              }
            >
              {ActiveComponent && <ActiveComponent />}
            </Suspense>
          </motion.div>
        ) : (
          /* ── HOME FEED (discovery content) ── */
          <motion.div
            key="home-feed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="mx-auto max-w-xl px-5 pb-12 sm:pb-16 sm:px-6">

              {/* ── PARTNER STORES ── */}
              <motion.section {...fade(2)} className="mb-7">
                <div className="flex items-center justify-between mb-3.5">
                  <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Partner Stores</p>
                  <button
                    type="button"
                    onClick={() => setActiveCat('stores')}
                    className="text-xs font-semibold flex items-center gap-0.5 transition-colors"
                    style={{ color: `hsl(${theme.primary} / 0.8)` }}
                  >
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {partnersLoading ? (
                  <div className="flex gap-3 overflow-hidden">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="shrink-0 w-[160px] h-[150px] rounded-2xl bg-muted/40 animate-pulse" />
                    ))}
                  </div>
                ) : partners.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
                    <Package className="mx-auto mb-3 h-10 w-10 text-txt-muted" />
                    <p className="text-sm text-txt-secondary font-semibold">No stores yet</p>
                    <p className="text-xs text-txt-muted mt-1">Partner stores will appear here soon.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 snap-x snap-mandatory">
                      {allStoresOrdered.slice(0, 10).map((p, i) => {
                        const isFav = favSet.has(p.id);
                        return (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.25, delay: 0.15 + i * 0.04 }}
                            className="shrink-0 w-[160px] snap-start rounded-2xl border border-border bg-card transition-all hover:border-primary/30 group"
                          >
                            <button
                              type="button"
                              onClick={() => navigate(`/catalog/${p.catalog_slug || p.id}`)}
                              className="w-full p-4 pb-3 text-left active:scale-[0.98] touch-manipulation"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-11 h-11 rounded-xl overflow-hidden bg-muted flex items-center justify-center border border-border/50">
                                  {p.logo ? (
                                    <img src={resolveImageUrl(p.logo)} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <Store className="h-5 w-5 text-txt-muted" />
                                  )}
                                </div>
                                {isFav && <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500 shrink-0 mt-1" />}
                              </div>
                              <p className="text-sm font-bold text-foreground truncate leading-snug">{p.business_name}</p>
                              <p className="text-[11px] text-txt-muted mt-0.5 truncate">{p.category || 'Store'}</p>
                            </button>
                            <div className="border-t border-border px-4 py-2 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: `hsl(${theme.primary})` }}>
                                Earn rewards
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(p.id); }}
                                className="p-2 -m-1 rounded-xl active:scale-90 touch-manipulation relative z-10"
                                aria-label={isFav ? 'Unfavorite' : 'Favorite'}
                              >
                                <Heart className={`h-4 w-4 transition-all duration-200 ${isFav ? 'fill-red-500 text-red-500 scale-110' : 'text-txt-muted hover:text-red-400'}`} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {favStores.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[10px] text-txt-secondary uppercase tracking-[0.2em] font-bold mb-2.5 flex items-center gap-1.5">
                          <Heart className="h-3 w-3 fill-red-500 text-red-500" /> Your Favorites
                        </p>
                        <div className="space-y-2">
                          {favStores.slice(0, 3).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => navigate(`/catalog/${p.catalog_slug || p.id}`)}
                              className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left transition-all active:scale-[0.98] hover:bg-muted/40 touch-manipulation"
                            >
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border/50 shrink-0">
                                {p.logo ? (
                                  <img src={resolveImageUrl(p.logo)} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <Store className="h-4 w-4 text-txt-muted" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{p.business_name}</p>
                                <p className="text-[11px] text-txt-muted mt-0.5 flex items-center gap-1">
                                  {p.category && <span className="truncate">{p.category}</span>}
                                  {p.status === 'ACTIVE' && (
                                    <>
                                      <span className="text-txt-muted/40">·</span>
                                      <span className="flex items-center gap-0.5 text-emerald-400/70 font-semibold">
                                        <Globe className="h-2.5 w-2.5" /> Live
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-txt-muted shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.section>

              {/* ── REWARDS FOR YOU ── */}
              {rewards.length > 0 && (
                <motion.section {...fade(3)} className="mb-7">
                  <div className="flex items-center justify-between mb-3.5">
                    <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Rewards for You</p>
                    <button
                      type="button"
                      onClick={() => setActiveCat('rewards')}
                      className="text-xs font-semibold flex items-center gap-0.5 transition-colors"
                      style={{ color: `hsl(${theme.primary} / 0.8)` }}
                    >
                      View all <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 snap-x snap-mandatory">
                    {rewards.slice(0, 6).map((r, i) => (
                      <motion.button
                        key={r.id}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25, delay: 0.1 + i * 0.04 }}
                        type="button"
                        onClick={() => setActiveCat('rewards')}
                        className="shrink-0 w-[170px] snap-start rounded-2xl border border-border bg-card overflow-hidden text-left transition-all hover:border-primary/30 active:scale-[0.98] touch-manipulation"
                      >
                        <div className="p-4 pb-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center border border-border/50 mb-3">
                            {r.partner_logo ? (
                              <img src={resolveImageUrl(r.partner_logo)} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Gift className="h-4 w-4 text-primary/50" />
                            )}
                          </div>
                          <p className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{r.name || r.title}</p>
                          {r.value && (
                            <p className="text-[11px] text-txt-muted mt-1 flex items-center gap-0.5">
                              <IndianRupee className="h-2.5 w-2.5" />
                              {r.value} value
                            </p>
                          )}
                        </div>
                        <div className="border-t border-dashed border-border px-4 py-2.5 flex items-center justify-between">
                          <span className="text-xs font-bold tabular-nums" style={{ color: `hsl(${theme.primary})` }}>
                            {r.points || r.points_cost} pts
                          </span>
                          <span className="text-[10px] font-bold text-txt-muted flex items-center gap-0.5">
                            Redeem <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ── DYNAMIC COUPONS TEASER ── */}
              <motion.section {...fade(4)} className="mb-7">
                <button
                  type="button"
                  onClick={() => navigate('/app/dynamic-coupons')}
                  className="w-full rounded-2xl border border-border bg-card overflow-hidden text-left transition-all hover:border-primary/30 active:scale-[0.98] touch-manipulation"
                >
                  <div className="p-5 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: `linear-gradient(145deg, hsl(${theme.primary} / 0.2) 0%, hsl(${theme.primary} / 0.05) 100%)` }}
                    >
                      <Ticket className="h-5 w-5" style={{ color: `hsl(${theme.primary})` }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">Dynamic Coupons</p>
                      <p className="text-[11px] text-txt-muted mt-0.5">Unlock real gift cards from top brands with your points</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-txt-muted shrink-0" />
                  </div>
                </button>
              </motion.section>

              {/* ── TRENDING ON LYNKR ── */}
              <TrendingSection
                partners={partners}
                rewards={rewards}
                communityActivity={communityActivity}
                theme={theme}
            navigate={navigate}
                fadeIdx={5}
              />

              {/* ── RECENT ACTIVITY ── */}
              {recentPurchases.length > 0 && (
                <motion.section {...fade(6)} className="mb-6">
                  <div className="flex items-center justify-between mb-3.5">
                    <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Recent</p>
                    <button
                      type="button"
                      onClick={() => setActiveCat('purchases')}
                      className="text-xs font-semibold flex items-center gap-0.5"
                      style={{ color: `hsl(${theme.primary} / 0.8)` }}
                    >
                      View all <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                    {recentPurchases.slice(0, 3).map((p, i) => (
                      <motion.button
                        key={p.id}
                        type="button"
                        onClick={() => setActiveCat('purchases')}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.25 + i * 0.04 }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-muted/30 active:bg-muted/50"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `hsl(${theme.primary} / 0.08)` }}>
                          <CreditCard className="h-3.5 w-3.5" style={{ color: `hsl(${theme.primary} / 0.5)` }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{p.brand}</p>
                        </div>
                        <p className="text-sm font-bold text-foreground tabular-nums shrink-0 flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />
                          {Number(p.amount || 0).toLocaleString('en-IN')}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </motion.section>
              )}

              <p className="mt-4 text-center text-[11px] text-txt-muted font-medium tracking-wide">
          More coming to Lynkr
        </p>
      </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default HomeHub;
