import React from 'react';
import { Settings } from 'lucide-react';

const PartnerSettingsPage = () => (
  <div className="max-w-6xl">
    <div className="mb-8">
      <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Settings</h1>
      <p className="text-muted-foreground mt-1">Manage your partner account and preferences.</p>
    </div>
    <div className="bg-card rounded-2xl border border-white/5 p-12 text-center shadow-sm">
      <Settings className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold text-lg text-foreground mb-2">Account settings</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Business profile, notifications, and security. Coming soon.
      </p>
    </div>
  </div>
);

export default PartnerSettingsPage;
