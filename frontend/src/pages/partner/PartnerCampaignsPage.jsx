import React from 'react';
import { Megaphone } from 'lucide-react';

const PartnerCampaignsPage = () => (
  <div className="max-w-6xl">
    <div className="mb-8">
      <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Campaigns</h1>
      <p className="text-muted-foreground mt-1">Run bonus point events, limited-time rewards, and seasonal promotions.</p>
    </div>
    <div className="bg-card rounded-2xl border border-white/5 p-12 text-center shadow-sm">
      <Megaphone className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold text-lg text-foreground mb-2">Loyalty campaigns</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Launch bonus point events, limited-time rewards, and seasonal promotions. Coming soon.
      </p>
    </div>
  </div>
);

export default PartnerCampaignsPage;
