import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Users, ShoppingBag, CheckCircle2, TrendingUp, LogOut } from 'lucide-react';
import api from '@/utils/api';

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/partner/dashboard');
      setDashboard(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'PILOT': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      default: return 'bg-muted text-txt-secondary border-border';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav data-testid="partner-nav" className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-heading font-bold tracking-tight">Lynkr Partner</div>
          <Button
            data-testid="logout-button"
            variant="ghost"
            onClick={handleLogout}
            className="hover:bg-muted rounded-full"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <div data-testid="partner-dashboard" className="max-w-7xl mx-auto px-6 py-12">
        {/* Partner Info */}
        <div data-testid="partner-info-card" className="bg-card text-card-foreground rounded-3xl border border-border shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold font-heading mb-2">{dashboard.partner_info.business_name}</h1>
              <p className="text-lg text-muted-foreground">{dashboard.partner_info.category}</p>
            </div>
            <div>
              <span data-testid="partner-status" className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(dashboard.partner_info.status)}`}>
                {dashboard.partner_info.status}
              </span>
            </div>
          </div>
          <p className="text-muted-foreground">{dashboard.partner_info.website}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div data-testid="lynkr-users-card" className="bg-card text-card-foreground rounded-3xl border border-border shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Lynkr Users</h3>
            </div>
            <p data-testid="lynkr-users-count" className="text-4xl font-bold font-heading text-primary">{dashboard.lynkr_users}</p>
          </div>

          <div data-testid="detected-purchases-card" className="bg-card text-card-foreground rounded-3xl border border-border shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Detected</h3>
            </div>
            <p data-testid="detected-count" className="text-4xl font-bold font-heading text-primary">{dashboard.detected_purchases}</p>
          </div>

          <div data-testid="verified-purchases-card" className="bg-card text-card-foreground rounded-3xl border border-border shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">Verified</h3>
            </div>
            <p data-testid="verified-count" className="text-4xl font-bold font-heading text-green-500">{dashboard.verified_purchases}</p>
          </div>

          <div data-testid="avg-order-value-card" className="bg-card text-card-foreground rounded-3xl border border-border shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">Avg Order</h3>
            </div>
            <p data-testid="avg-order-value" className="text-4xl font-bold font-heading text-accent">₹{dashboard.monthly_summary.avg_order_value}</p>
          </div>
        </div>

        {/* Monthly Summary */}
        <div data-testid="monthly-summary-card" className="bg-card text-card-foreground rounded-3xl border border-border shadow-2xl p-8">
          <h2 className="text-2xl font-bold font-heading mb-6">This Month's Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-secondary/30 rounded-2xl p-6">
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Total Orders</p>
              <p data-testid="total-orders" className="text-3xl font-bold font-heading">{dashboard.monthly_summary.total_orders}</p>
            </div>
            <div className="bg-secondary/30 rounded-2xl p-6">
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Total Value</p>
              <p data-testid="total-value" className="text-3xl font-bold font-heading">₹{dashboard.monthly_summary.total_value.toLocaleString()}</p>
            </div>
            <div className="bg-secondary/30 rounded-2xl p-6">
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Average Order</p>
              <p data-testid="avg-order" className="text-3xl font-bold font-heading">₹{dashboard.monthly_summary.avg_order_value}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;