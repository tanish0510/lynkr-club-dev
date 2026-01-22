import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShoppingBag, CheckCircle2, Clock, TrendingUp, IndianRupee } from 'lucide-react';
import api from '@/utils/api';

const EnhancedPartnerDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/partner/dashboard');
      
      // Check if must change password
      if (response.data.must_change_password) {
        navigate('/partner-first-login');
        return;
      }
      
      setDashboard(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboard) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'PILOT': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Partner Info Card */}
        <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold font-heading mb-2">{dashboard.partner_info.business_name}</h1>
              <p className="text-lg text-muted-foreground">{dashboard.partner_info.category}</p>
              <p className="text-sm text-muted-foreground mt-1">{dashboard.partner_info.website}</p>
            </div>
            <div>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(dashboard.partner_info.status)}`}>
                {dashboard.partner_info.status}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Total Orders</h3>
            </div>
            <p className="text-4xl font-bold font-heading text-primary">{dashboard.metrics.total_orders}</p>
          </div>

          <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">Acknowledged</h3>
            </div>
            <p className="text-4xl font-bold font-heading text-green-500">{dashboard.metrics.acknowledged_orders}</p>
          </div>

          <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold">Pending</h3>
            </div>
            <p className="text-4xl font-bold font-heading text-yellow-500">{dashboard.metrics.pending_orders}</p>
          </div>

          <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">Total Value</h3>
            </div>
            <p className="text-4xl font-bold font-heading text-accent">₹{dashboard.metrics.total_value.toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
          <h2 className="text-2xl font-bold font-heading mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => navigate('/partner-orders')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl py-6 text-lg justify-start"
            >
              <ShoppingBag className="mr-3 w-6 h-6" />
              <div className="text-left">
                <div className="font-bold">View All Orders</div>
                <div className="text-sm opacity-80">Manage and acknowledge orders</div>
              </div>
            </Button>
            
            <Button
              onClick={() => navigate('/partner-orders?status=PENDING')}
              variant="outline"
              className="bg-secondary hover:bg-secondary/80 border border-white/10 rounded-2xl py-6 text-lg justify-start"
            >
              <Clock className="mr-3 w-6 h-6 text-yellow-500" />
              <div className="text-left">
                <div className="font-bold">Pending Orders</div>
                <div className="text-sm opacity-80">{dashboard.metrics.pending_orders} orders need acknowledgment</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EnhancedPartnerDashboard;
