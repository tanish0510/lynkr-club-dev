import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Sparkles,
  PlusCircle,
  Copy,
  Gift,
  Trophy,
  Bot,
  ArrowUpRight,
  Handshake,
} from 'lucide-react';
import api from '@/utils/api';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import InAppGuidedTour from '@/components/onboarding/InAppGuidedTour';
import AppAvatar from '@/components/Avatar';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [community, setCommunity] = useState([]);
  const [aiSnapshot, setAiSnapshot] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayPoints, setDisplayPoints] = useState(0);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, leaderboardRes, aiRes, partnersRes] = await Promise.allSettled([
        api.get('/user/dashboard'),
        api.get('/points/leaderboard'),
        api.get('/ai/insights'),
        api.get('/partners/active'),
      ]);

      if (dashboardRes.status === 'fulfilled') {
        setDashboard(dashboardRes.value.data);
      } else {
        throw new Error('dashboard failed');
      }

      if (leaderboardRes.status === 'fulfilled') {
        setCommunity(leaderboardRes.value.data || []);
      }
      if (aiRes.status === 'fulfilled') {
        setAiSnapshot(aiRes.value.data);
      }
      if (partnersRes.status === 'fulfilled') {
        setPartners(partnersRes.value.data || []);
      }
    } catch (_) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dashboard) return;
    const start = displayPoints;
    const target = Number(dashboard.points || 0);
    const duration = 360;
    const startAt = performance.now();
    let raf;

    const tick = (now) => {
      const progress = Math.min(1, (now - startAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPoints(Math.round(start + (target - start) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard?.points]);

  const quickActions = useMemo(
    () => [
      { label: 'Raise Purchase', icon: PlusCircle, action: () => navigate('/app/purchases?raise=1') },
      { label: 'View Rewards', icon: Gift, action: () => navigate('/app/rewards') },
      { label: 'Community', icon: Trophy, action: () => navigate('/app/community') },
    ],
    [navigate]
  );

  const featuredRewards = dashboard?.available_rewards?.slice(0, 6) || [];
  const communityLeader = community[0];
  const registeredPartners = partners.slice(0, 6);

  const getStatusBadge = (status) => {
    if (status === 'VERIFIED') return 'bg-emerald-500/20 text-emerald-300';
    if (status === 'REJECTED') return 'bg-red-500/20 text-red-300';
    return 'bg-amber-500/20 text-amber-300';
  };

  if (loading || !dashboard) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 rounded-3xl border border-border bg-card/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={fetchDashboard} className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-5">
      <section id="tour-points-card" className="rounded-3xl border border-border bg-card/80 p-5 md:p-7">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Hello, {user?.full_name || 'Lynkr User'}</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total points</p>
            <h1 className="text-5xl md:text-6xl font-heading font-bold text-primary">{displayPoints}</h1>
          </div>
          <Button
            variant="ghost"
            className="min-h-11 rounded-2xl"
            onClick={() => {
              navigator.clipboard.writeText(user?.lynkr_email || '');
              toast.success('Lynkr email copied');
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy email
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-3 md:grid-cols-3 gap-3">
        {quickActions.map((item) => (
          <button
            id={item.label === 'Raise Purchase' ? 'tour-raise-purchase' : undefined}
            key={item.label}
            type="button"
            onClick={item.action}
            className="rounded-2xl border border-border bg-card/70 px-3 py-4 text-left transition-all duration-200 active:scale-[0.98] hover:border-border"
          >
            <item.icon className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm font-medium">{item.label}</p>
          </button>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-card/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Purchases</h2>
          <Button variant="ghost" className="min-h-11 rounded-xl" onClick={() => navigate('/app/purchases')}>
            View all
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 snap-x snap-mandatory">
          {(dashboard.recent_purchases || []).slice(0, 8).map((purchase) => (
            <article
              key={purchase.id}
              className="min-w-[240px] snap-start rounded-2xl border border-border bg-background/60 p-4"
            >
              <p className="font-medium">{purchase.brand || 'Partner'}</p>
              <p className="text-xs text-muted-foreground mt-1">Order #{purchase.order_id}</p>
              <p className="mt-3 text-xl font-bold">₹{Number(purchase.amount || 0).toFixed(0)}</p>
              <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs ${getStatusBadge(purchase.status)}`}>
                {purchase.status}
              </span>
            </article>
          ))}
          {(!dashboard.recent_purchases || dashboard.recent_purchases.length === 0) && (
            <div className="w-full rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No purchases yet. Start by raising your first purchase.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Featured Rewards</h2>
          <Button variant="ghost" className="min-h-11 rounded-xl" onClick={() => navigate('/app/rewards')}>
            Open rewards
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 snap-x snap-mandatory">
          {featuredRewards.map((reward) => (
            <article key={reward.id} className="min-w-[220px] snap-start rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-sm text-primary">{reward.partner_name || 'Partner Offer'}</p>
              <h3 className="mt-1 font-semibold">{reward.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{reward.points_cost} points</p>
            </article>
          ))}
          {featuredRewards.length === 0 && (
            <div className="w-full rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Rewards will appear here as soon as offers are available.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="rounded-3xl border border-border bg-card/70 p-4 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">AI Insight</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {aiSnapshot?.monthly_trend || `You spent ₹${Number(dashboard.month_spending || 0).toFixed(0)} this month.`}
          </p>
          <Button className="w-full mt-4 min-h-11 rounded-xl" onClick={() => navigate('/app/ai')}>
            Explore AI
          </Button>
        </article>

        {communityLeader ? (
          <article className="rounded-3xl border border-border bg-card/70 p-4 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Community Highlight</h3>
            </div>
            <div className="flex items-center gap-3">
              <AppAvatar avatar={communityLeader.avatar} username={communityLeader.username} className="h-10 w-10" />
              <p className="text-sm text-muted-foreground">
                #{communityLeader.rank} {communityLeader.username || communityLeader.masked_username} has {communityLeader.points} points this week.
              </p>
            </div>
            <Button variant="outline" className="w-full mt-4 min-h-11 rounded-xl" onClick={() => navigate('/app/community')}>
              View Community
            </Button>
          </article>
        ) : null}
      </section>

      {registeredPartners.length > 0 ? (
        <section className="rounded-3xl border border-border bg-card/70 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Handshake className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Registered Partners</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {registeredPartners.map((partner) => (
              <div key={partner.id} className="rounded-xl border border-border bg-background/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{partner.business_name}</p>
                  <span className="text-[10px] uppercase tracking-wide text-primary">{partner.status}</span>
                </div>
                {partner.category ? <p className="text-xs text-muted-foreground mt-1">{partner.category}</p> : null}
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            className="w-full mt-3 min-h-11 rounded-xl"
            onClick={() => navigate('/partners')}
          >
            Explore partners
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      ) : null}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        Scroll to explore rewards, community and AI updates.
      </div>
      <InAppGuidedTour />
    </PullToRefresh>
  );
};

export default UserDashboard;