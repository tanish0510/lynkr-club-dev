import React from 'react';
import { BarChart3 } from 'lucide-react';

const PartnerAnalyticsPage = () => (
  <div className="max-w-6xl">
    <div className="mb-8">
      <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Analytics</h1>
      <p className="text-muted-foreground mt-1">Data-driven insights and performance reports.</p>
    </div>
    <div className="bg-card rounded-2xl border border-white/5 p-12 text-center shadow-sm">
      <BarChart3 className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold text-lg text-foreground mb-2">Analytics & reports</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Deep-dive analytics, export reports, and custom date ranges. Coming soon.
      </p>
    </div>
  </div>
);

export default PartnerAnalyticsPage;
