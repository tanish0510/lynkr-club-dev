import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, ArrowRight, Sparkles, Target, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InsightCard from '@/components/partner/InsightCard';

const REWARD_TYPES = [
  { icon: Gift, title: 'Discount Coupon', description: 'Percentage or flat discount on next purchase', color: 'primary' },
  { icon: Sparkles, title: 'Bonus Points', description: 'Extra points on specific products or categories', color: 'violet' },
  { icon: Target, title: 'Loyalty Milestone', description: 'Reward after N purchases or spend threshold', color: 'teal' },
  { icon: Zap, title: 'Flash Deal', description: 'Limited-time offer to drive urgency', color: 'amber' },
];

const PartnerRewardsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">Rewards</h1>
        <p className="text-sm text-txt-secondary mt-1">Create and manage rewards to drive customer loyalty.</p>
      </div>

      {/* Quick action */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground">Create a reward campaign</h2>
            <p className="text-sm text-txt-secondary mt-1">
              Submit a coupon request with discount details, point requirements, and expiry. Once approved, it becomes available to your customers.
            </p>
            <Button
              className="mt-3 rounded-xl"
              onClick={() => navigate('/app/partner/coupon-requests')}
            >
              <Gift className="w-4 h-4 mr-1.5" />
              Create New Reward
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reward types */}
      <section>
        <h2 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3">Reward Types</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REWARD_TYPES.map((type) => {
            const colorMap = {
              primary: 'bg-primary/10 text-primary',
              violet: 'bg-violet-500/10 text-violet-400',
              teal: 'bg-teal-500/10 text-teal-400',
              amber: 'bg-amber-500/10 text-amber-400',
            };
            return (
              <button
                key={type.title}
                onClick={() => navigate('/app/partner/coupon-requests')}
                className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-card text-left hover:bg-muted active:scale-[0.98] transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[type.color]}`}>
                  <type.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{type.title}</p>
                  <p className="text-xs text-txt-secondary mt-0.5">{type.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Tips */}
      <section>
        <h2 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3">Tips for better rewards</h2>
        <div className="space-y-3">
          <InsightCard
            icon={TrendingUp}
            title="Start with 10-15% discounts"
            description="Higher discounts drive first purchases, but moderate ones build sustainable loyalty."
            color="teal"
          />
          <InsightCard
            icon={Target}
            title="Set achievable point thresholds"
            description="Rewards that need 100-300 points see 3x more redemptions than those requiring 500+."
            color="violet"
          />
        </div>
      </section>
    </div>
  );
};

export default PartnerRewardsPage;
