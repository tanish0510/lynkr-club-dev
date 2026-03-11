import React from 'react';
import { Users } from 'lucide-react';

const PartnerCustomersPage = () => (
  <div className="max-w-6xl">
    <div className="mb-8">
      <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Customers</h1>
      <p className="text-muted-foreground mt-1">Top customers, redemption behavior, and retention insights.</p>
    </div>
    <div className="bg-card rounded-2xl border border-white/5 p-12 text-center shadow-sm">
      <Users className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold text-lg text-foreground mb-2">Customer analytics</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        View top customers, most redeemed rewards, retention rate, and points issued vs redeemed. Coming soon.
      </p>
    </div>
  </div>
);

export default PartnerCustomersPage;
