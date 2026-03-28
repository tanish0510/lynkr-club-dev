import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Zap, Gift, Calendar, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InsightCard from '@/components/partner/InsightCard';

const CAMPAIGN_IDEAS = [
  { icon: Zap, title: 'Double Points Weekend', description: '2x points on all purchases for 48 hours', tag: 'Popular' },
  { icon: Gift, title: 'First Purchase Bonus', description: 'Extra 50 points for first-time buyers', tag: 'Recommended' },
  { icon: Calendar, title: 'Seasonal Sale', description: 'Festival or holiday-themed rewards', tag: 'Seasonal' },
  { icon: TrendingUp, title: 'Spend & Earn', description: 'Bonus points for orders above ₹1,000', tag: 'Retention' },
];

const PartnerCampaignsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">Campaigns</h1>
        <p className="text-sm text-txt-secondary mt-1">Run bonus point events and limited-time promotions.</p>
      </div>

      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <Megaphone className="w-6 h-6 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground">Launch your first campaign</h2>
            <p className="text-sm text-txt-secondary mt-1">
              Campaigns let you run time-limited promotions like double points, flash sales, or spending bonuses. Start by creating a reward, then promote it as a campaign.
            </p>
            <Button
              className="mt-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => navigate('/app/partner/coupon-requests')}
            >
              <Gift className="w-4 h-4 mr-1.5" />
              Create Campaign Reward
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3">Campaign Ideas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CAMPAIGN_IDEAS.map((idea) => (
            <div
              key={idea.title}
              className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-card"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <idea.icon className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{idea.title}</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-medium">{idea.tag}</span>
                </div>
                <p className="text-xs text-txt-secondary mt-0.5">{idea.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <InsightCard
        icon={Megaphone}
        title="Campaigns increase repeat purchases by 35%"
        description="Partners who run monthly campaigns see significantly higher customer return rates."
        color="violet"
      />
    </div>
  );
};

export default PartnerCampaignsPage;
