import React from 'react';
import { Settings } from 'lucide-react';

const AdminSettings = () => (
  <div className="max-w-6xl">
    <div className="mb-8">
      <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">System Settings</h1>
      <p className="text-muted-foreground mt-1">Platform configuration and system preferences.</p>
    </div>
    <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
      <Settings className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold text-lg text-foreground mb-2">System settings</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Configure platform-wide settings, integrations, and preferences. Coming soon.
      </p>
    </div>
  </div>
);

export default AdminSettings;
