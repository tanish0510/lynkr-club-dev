import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShoppingBag, CheckCircle2, Clock, TrendingUp, IndianRupee, Info } from 'lucide-react';
import api from '@/utils/api';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

const EnhancedPartnerDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partnerPurchases, setPartnerPurchases] = useState([]);
  const [processingPurchase, setProcessingPurchase] = useState(null);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchPartnerPurchases();
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

  const fetchPartnerPurchases = async () => {
    try {
      const response = await api.get('/partner/purchases');
      setPartnerPurchases(response.data || []);
    } catch (_) {
      setPartnerPurchases([]);
    }
  };

  const handleVerifyAction = async (purchaseId, action) => {
    setProcessingPurchase(`${purchaseId}:${action}`);
    try {
      await api.post('/partner/verify-purchase', { purchase_id: purchaseId, action });
      toast.success(action === 'VERIFY' ? 'Purchase verified and points credited' : 'Purchase rejected');
      await fetchPartnerPurchases();
      await fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process purchase');
    } finally {
      setProcessingPurchase(null);
    }
  };

  if (loading || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
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
    <div className="max-w-6xl">
        {/* Partner Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8 mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2">{dashboard.partner_info.business_name}</h1>
              <p className="text-base md:text-lg text-muted-foreground">{dashboard.partner_info.category}</p>
              <p className="text-sm text-muted-foreground mt-1">{dashboard.partner_info.website}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(dashboard.partner_info.status)}`}>
                {dashboard.partner_info.status}
              </span>
              <Dialog open={tourOpen} onOpenChange={setTourOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    <Info className="w-4 h-4 mr-2" />
                    Dashboard Tour
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Partner Dashboard Tour</DialogTitle>
                    <DialogDescription>
                      What each section means and what happens when you take actions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <p className="font-semibold text-foreground">Metrics</p>
                      <p>Total Orders, Acknowledged, Pending, and Total Value come from your partner order stream.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Pending Purchase Requests</p>
                      <p>
                        <strong className="text-foreground">Verify</strong> marks the request as validated and credits user points on our side.
                        <strong className="text-foreground"> Reject</strong> marks it rejected and no points are issued.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Quick Actions</p>
                      <p>
                        View All Orders opens full transaction management.
                        Pending Orders filters only orders that need acknowledgement.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
          <motion.div whileHover={{ y: -4 }} className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Total Orders</h3>
            </div>
            <p className="text-4xl font-bold font-heading text-primary">{dashboard.metrics.total_orders}</p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">Acknowledged</h3>
            </div>
            <p className="text-4xl font-bold font-heading text-green-500">{dashboard.metrics.acknowledged_orders}</p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold">Pending</h3>
            </div>
            <p className="text-4xl font-bold font-heading text-yellow-500">{dashboard.metrics.pending_orders}</p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">Total Value</h3>
            </div>
            <p className="text-4xl font-bold font-heading text-accent">₹{dashboard.metrics.total_value.toLocaleString()}</p>
          </motion.div>
        </div>

        <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-4 md:p-8 mb-8">
          <h2 className="text-2xl font-bold font-heading mb-2">Pending Purchase Requests</h2>
          <p className="text-sm text-muted-foreground mb-6">Verify or reject manual user purchase requests.</p>

          {partnerPurchases.length === 0 ? (
            <p className="text-muted-foreground">No purchase requests found.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {partnerPurchases.map((p) => (
                <div key={p.purchase_id} className="bg-secondary/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-semibold">{p.user_lynkr_email}</p>
                    <p className="text-xs text-muted-foreground">
                      Order: {p.order_id} • Txn: {p.transaction_id || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">₹{Number(p.amount || 0).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'VERIFIED' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                      {p.status}
                    </span>
                    {p.status === 'PENDING' ? (
                      <>
                        <Button
                          size="sm"
                          className="rounded-full bg-green-600 hover:bg-green-700"
                          disabled={processingPurchase === `${p.purchase_id}:VERIFY`}
                          onClick={() => handleVerifyAction(p.purchase_id, 'VERIFY')}
                        >
                          {processingPurchase === `${p.purchase_id}:VERIFY` ? 'Verifying...' : 'Verify'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={processingPurchase === `${p.purchase_id}:REJECT`}
                          onClick={() => handleVerifyAction(p.purchase_id, 'REJECT')}
                        >
                          {processingPurchase === `${p.purchase_id}:REJECT` ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-4 md:p-8">
          <h2 className="text-2xl font-bold font-heading mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => navigate('/partner/dashboard/orders')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl min-h-11 py-6 text-lg justify-start"
            >
              <ShoppingBag className="mr-3 w-6 h-6" />
              <div className="text-left">
                <div className="font-bold">View All Orders</div>
                <div className="text-sm opacity-80">Manage and acknowledge orders</div>
              </div>
            </Button>
            
            <Button
              onClick={() => navigate('/partner/dashboard/orders?status=PENDING')}
              variant="outline"
              className="bg-secondary hover:bg-secondary/80 border border-white/10 rounded-2xl min-h-11 py-6 text-lg justify-start"
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
  );
};

export default EnhancedPartnerDashboard;
