import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TrendingUp, Gift, Mail, Sparkles, LogOut, Copy, MessageCircle } from 'lucide-react';
import api from '@/utils/api';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/user/dashboard');
      setDashboard(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user?.lynkr_email || '');
    toast.success('Email copied!');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading || !dashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED': return 'text-green-500';
      case 'PENDING': return 'text-yellow-500';
      case 'REJECTED': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav data-testid="dashboard-nav" className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-heading font-bold tracking-tight">Lynkr</div>
          <div className="flex items-center gap-4">
            <Button
              data-testid="chat-nav-button"
              variant="ghost"
              className="hover:bg-white/5 rounded-full"
              onClick={() => navigate('/chat')}
            >
              <MessageCircle className="mr-2 w-4 h-4" />
              AI Chat
            </Button>
            <Button
              data-testid="insights-nav-button"
              variant="ghost"
              className="hover:bg-white/5 rounded-full"
              onClick={() => navigate('/insights')}
            >
              <Sparkles className="mr-2 w-4 h-4" />
              AI Insights
            </Button>
            <Button
              data-testid="rewards-nav-button"
              variant="ghost"
              className="hover:bg-white/5 rounded-full"
              onClick={() => navigate('/rewards')}
            >
              <Gift className="mr-2 w-4 h-4" />
              Rewards
            </Button>
            <Button
              data-testid="settings-nav-button"
              variant="ghost"
              className="hover:bg-white/5 rounded-full"
              onClick={() => navigate('/settings')}
            >
              Settings
            </Button>
            <Button
              data-testid="logout-button"
              variant="ghost"
              className="hover:bg-white/5 rounded-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div data-testid="user-dashboard" className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Points Card */}
        <div data-testid="points-hero-card" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8 md:p-12 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
          <div className="relative">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Your Reward Points</p>
            <h1 data-testid="points-display" className="text-6xl md:text-8xl font-bold font-heading mb-6 text-primary">
              {dashboard.points}
            </h1>
            <div className="flex flex-wrap gap-4">
              <Button
                data-testid="redeem-points-button"
                onClick={() => navigate('/rewards')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 font-bold glow-primary"
              >
                <Gift className="mr-2 w-5 h-5" />
                Redeem Points
              </Button>
              <Button
                data-testid="view-insights-button"
                variant="outline"
                onClick={() => navigate('/insights')}
                className="bg-secondary hover:bg-secondary/80 border border-white/10 rounded-full px-8 py-6 font-medium"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                View AI Insights
              </Button>
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {/* This Month Spending */}
          <div data-testid="month-spending-card" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6 col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">This Month</h3>
            </div>
            <p data-testid="month-spending-amount" className="text-4xl font-bold font-heading text-primary">₹{dashboard.month_spending.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-2">Total Spending</p>
          </div>

          {/* Lynkr Email Card */}
          <div data-testid="lynkr-email-card" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6 col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Your Lynkr Email</h3>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
              <p data-testid="user-lynkr-email" className="text-lg font-mono break-all">{user?.lynkr_email}</p>
              <Button
                data-testid="copy-lynkr-email-button"
                onClick={handleCopyEmail}
                variant="ghost"
                size="sm"
                className="hover:bg-white/10 rounded-lg flex-shrink-0 ml-2"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">Use this email when shopping to earn rewards</p>
          </div>

          {/* Quick Stat */}
          <div data-testid="available-rewards-card" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6 col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">Rewards</h3>
            </div>
            <p data-testid="rewards-count" className="text-4xl font-bold font-heading text-accent">{dashboard.available_rewards.length}</p>
            <p className="text-sm text-muted-foreground mt-2">Available to Redeem</p>
          </div>
        </div>

        {/* Recent Purchases */}
        <div data-testid="recent-purchases-section" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-heading">Recent Purchases</h2>
            <Button
              data-testid="view-all-purchases-button"
              variant="ghost"
              onClick={() => navigate('/purchases')}
              className="hover:bg-white/5 rounded-full"
            >
              View All
            </Button>
          </div>
          
          {dashboard.recent_purchases.length === 0 ? (
            <div data-testid="no-purchases-message" className="text-center py-12">
              <p className="text-muted-foreground mb-4">No purchases detected yet</p>
              <p className="text-sm text-muted-foreground">Start shopping with your Lynkr email to see purchases here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboard.recent_purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  data-testid={`purchase-${purchase.id}`}
                  className="bg-secondary/30 rounded-2xl p-4 flex items-center justify-between hover:bg-secondary/50"
                >
                  <div>
                    <h4 className="font-semibold text-lg">{purchase.brand}</h4>
                    <p className="text-sm text-muted-foreground">Order #{purchase.order_id}</p>
                    {purchase.category && (
                      <span className="inline-block text-xs bg-primary/20 text-primary px-2 py-1 rounded-full mt-2">
                        {purchase.category}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">₹{purchase.amount}</p>
                    <p className={`text-sm font-medium ${getStatusColor(purchase.status)}`}>
                      {purchase.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;