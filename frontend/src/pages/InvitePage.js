import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Copy,
  Gift,
  Check,
  UserPlus,
  Share2,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import api from '@/utils/api';
import { motion } from 'framer-motion';

const InvitePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [applyCode, setApplyCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [showApplyInput, setShowApplyInput] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/referral/stats');
      setStats(res.data);
    } catch {
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const referralCode = stats?.referral_code || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success('Referral code copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    const shareText = `Join Lynkr and turn your purchases into rewards! Use my code ${referralCode} and get bonus points on your first purchase.\n\n${window.location.origin}/auth?mode=signup&ref=${referralCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join Lynkr', text: shareText });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Invite link copied to clipboard');
    }
  };

  const handleApply = async () => {
    const code = applyCode.trim().toUpperCase();
    if (!code) return;
    setApplying(true);
    try {
      await api.post('/referral/apply', { referral_code: code });
      toast.success('Referral code applied! You\'ll earn bonus points on your first purchase.');
      setShowApplyInput(false);
      setApplyCode('');
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid referral code');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const invites = stats?.invites || [];
  const totalInvites = stats?.total_invites || 0;
  const totalEarned = stats?.total_earned || 0;
  const pendingRewards = stats?.pending_rewards || 0;

  return (
    <motion.div
      className="max-w-xl mx-auto px-5 pt-7 pb-16 sm:px-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <header className="mb-6">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 rounded-xl" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
        <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Referrals</p>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-heading font-bold text-foreground">Invite & Earn</h1>
        <p className="text-xs text-txt-secondary font-medium mt-1">
          Invite friends, earn points when they make their first purchase.
        </p>
      </header>

      {/* Referral code card */}
      <section className="rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-purple-500/5 p-5 mb-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-purple-500 to-primary opacity-50" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Your referral code</p>
            <p className="text-[11px] text-txt-muted">Share to earn +100 pts per friend</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl bg-background/80 border border-border px-4 py-3 text-center">
            <p className="text-lg font-heading font-bold text-foreground tracking-wider">{referralCode}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl border-border shrink-0"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <Button
          onClick={handleShare}
          className="w-full mt-4 rounded-xl min-h-11 bg-primary text-primary-foreground font-bold gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share Invite
        </Button>
      </section>

      {/* How it works */}
      <section className="rounded-2xl border border-border bg-card p-5 mb-5">
        <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold mb-4">How It Works</p>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Share your code', desc: 'Send your referral code to friends' },
            { step: '2', title: 'Friend signs up', desc: 'They use your code during signup' },
            { step: '3', title: 'Friend makes a purchase', desc: 'On their first verified purchase' },
            { step: '4', title: 'You both earn', desc: 'You get +100 pts, they get +50 pts' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{item.title}</p>
                <p className="text-[11px] text-txt-muted mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Invited', value: totalInvites, icon: UserPlus },
          { label: 'Earned', value: `${totalEarned} pts`, icon: Sparkles },
          { label: 'Pending', value: pendingRewards, icon: Gift },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <s.icon className="h-4 w-4 mx-auto mb-2 text-txt-muted" />
            <p className="text-lg font-heading font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-txt-muted font-medium uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Invite list */}
      {invites.length > 0 && (
        <section className="rounded-2xl border border-border bg-card overflow-hidden mb-5">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Your Invites</p>
          </div>
          <div className="divide-y divide-border">
            {invites.map((inv) => (
              <div key={inv.invitee_id} className="flex items-center gap-3.5 px-5 py-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  inv.reward_earned ? 'bg-emerald-500/15' : 'bg-amber-500/15'
                }`}>
                  {inv.reward_earned ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5 text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{inv.invitee_name}</p>
                  <p className="text-[11px] text-txt-muted mt-0.5">
                    {inv.reward_earned ? 'Reward earned' : inv.first_purchase_done ? 'Purchase done' : 'Signed up — awaiting first purchase'}
                  </p>
                </div>
                {inv.reward_earned && (
                  <span className="text-[11px] font-bold text-emerald-400">+100 pts</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Apply a referral code */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <button
          type="button"
          onClick={() => setShowApplyInput(!showApplyInput)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <p className="text-sm font-bold text-foreground">Have a referral code?</p>
            <p className="text-[11px] text-txt-muted mt-0.5">Apply a friend's code to earn +50 pts on your first purchase</p>
          </div>
          <ChevronRight className={`h-4 w-4 text-txt-muted transition-transform ${showApplyInput ? 'rotate-90' : ''}`} />
        </button>

        {showApplyInput && (
          <div className="mt-4 flex gap-2">
            <Input
              placeholder="e.g. TANI-LYNK"
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
              className="flex-1 rounded-xl h-11 bg-secondary/50 border-border uppercase tracking-wider font-bold"
            />
            <Button
              onClick={handleApply}
              disabled={applying || !applyCode.trim()}
              className="rounded-xl h-11 px-5 font-bold"
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default InvitePage;
