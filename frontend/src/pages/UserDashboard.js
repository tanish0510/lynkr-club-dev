import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TrendingUp, Gift, Mail, Sparkles, ShoppingBag, PlusCircle, Copy } from 'lucide-react';
import api from '@/utils/api';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/user/dashboard');
      setDashboard(response.data);
    } catch (_) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED': return 'text-emerald-300';
      case 'PENDING': return 'text-amber-300';
      case 'REJECTED': return 'text-red-300';
      default: return 'text-muted-foreground';
    }
  };

  if (loading || !dashboard) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in-0">
        <div className="bg-card/90 rounded-3xl border border-white/10 shadow-2xl p-8 md:p-12 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="relative">
            <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Your Reward Points</p>
            <h1 className="text-6xl md:text-8xl font-bold font-heading text-primary">{dashboard.points}</h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() => navigate('/purchases?raise=1')}
                className="rounded-full px-7 py-6 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary transition-transform duration-200 hover:scale-[1.02]"
              >
                <PlusCircle className="mr-2 w-5 h-5" />
                Raise Purchase
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-7 py-6"
                onClick={() => navigate('/purchases')}
              >
                <ShoppingBag className="mr-2 w-5 h-5" />
                Open Purchases
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card/80 rounded-3xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <p className="font-medium">This Month</p>
            </div>
            <p className="text-3xl font-heading font-bold">₹{dashboard.month_spending.toFixed(2)}</p>
          </div>

          <div className="bg-card/80 rounded-3xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Gift className="w-5 h-5 text-primary" />
              <p className="font-medium">Rewards Available</p>
            </div>
            <p className="text-3xl font-heading font-bold">{dashboard.available_rewards.length}</p>
          </div>

          <div className="bg-card/80 rounded-3xl border border-white/10 p-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <p className="font-medium">Lynkr Email</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  navigator.clipboard.writeText(user?.lynkr_email || '');
                  toast.success('Email copied');
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm font-mono break-all">{user?.lynkr_email}</p>
          </div>
        </div>

        <div className="bg-card/80 rounded-3xl border border-white/10 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-heading">Recent Activity</h2>
            <Button variant="ghost" className="rounded-full" onClick={() => navigate('/purchases')}>
              View All
            </Button>
          </div>
          {dashboard.recent_purchases.length === 0 ? (
            <p className="text-muted-foreground">No purchases detected yet.</p>
          ) : (
            <div className="space-y-3">
              {dashboard.recent_purchases.map((purchase) => (
                <div key={purchase.id} className="rounded-2xl border border-white/5 bg-secondary/20 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{purchase.brand}</p>
                    <p className="text-xs text-muted-foreground">Order #{purchase.order_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{purchase.amount}</p>
                    <p className={`text-xs ${getStatusColor(purchase.status)}`}>{purchase.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Purchases are now managed from the dedicated Purchases section.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;