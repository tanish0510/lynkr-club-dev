import React from 'react';
import { Gift } from 'lucide-react';

const PartnerRewardsPage = () => (
  <div className="max-w-6xl">
    <div className="mb-8">
      <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Rewards</h1>
      <p className="text-muted-foreground mt-1">Create and manage rewards, set point values, and track redemptions.</p>
    </div>
    <div className="bg-card rounded-2xl border border-white/5 p-12 text-center shadow-sm">
      <Gift className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold text-lg text-foreground mb-2">Reward management</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Create new rewards, set point values, enable or disable offers, and track redemption activity. This section will be available in a future update.
      </p>
    </div>
  </div>
);

export default PartnerRewardsPage;
