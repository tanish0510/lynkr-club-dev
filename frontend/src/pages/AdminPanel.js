import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, Building2, ShoppingBag, LogOut, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/utils/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [usersRes, partnersRes, purchasesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/partners'),
        api.get('/admin/purchases')
      ]);
      setUsers(usersRes.data);
      setPartners(partnersRes.data);
      setPurchases(purchasesRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPurchase = async (purchaseId, action) => {
    try {
      await api.post(`/admin/verify-purchase/${purchaseId}?action=${action}`);
      toast.success(`Purchase ${action === 'VERIFY' ? 'verified' : 'rejected'}`);
      await fetchAllData();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleUpdatePartnerStatus = async (partnerId, status) => {
    try {
      await api.post(`/admin/update-partner-status/${partnerId}?new_status=${status}`);
      toast.success('Partner status updated');
      await fetchAllData();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav data-testid="admin-nav" className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-heading font-bold tracking-tight">Lynkr Admin</div>
          <Button
            data-testid="admin-logout-button"
            variant="ghost"
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/');
            }}
            className="hover:bg-white/5 rounded-full"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <div data-testid="admin-panel" className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold font-heading mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="purchases" className="w-full">
          <TabsList data-testid="admin-tabs" className="grid w-full max-w-md grid-cols-3 mb-8 bg-secondary/50 rounded-xl p-1">
            <TabsTrigger data-testid="purchases-tab" value="purchases" className="rounded-lg">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Purchases
            </TabsTrigger>
            <TabsTrigger data-testid="users-tab" value="users" className="rounded-lg">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger data-testid="partners-tab" value="partners" className="rounded-lg">
              <Building2 className="w-4 h-4 mr-2" />
              Partners
            </TabsTrigger>
          </TabsList>

          {/* Purchases Tab */}
          <TabsContent value="purchases">
            <div data-testid="purchases-list" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
              <h2 className="text-2xl font-bold font-heading mb-6">Pending Purchases</h2>
              {purchases.filter(p => p.status === 'PENDING').length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending purchases</p>
              ) : (
                <div className="space-y-4">
                  {purchases.filter(p => p.status === 'PENDING').map((purchase) => (
                    <div
                      key={purchase.id}
                      data-testid={`purchase-${purchase.id}`}
                      className="bg-secondary/30 rounded-2xl p-6 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-semibold text-lg">{purchase.brand}</h4>
                        <p className="text-sm text-muted-foreground">Order #{purchase.order_id}</p>
                        <p className="text-sm text-muted-foreground mt-1">User: {purchase.user_id.slice(0, 8)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right mr-4">
                          <p className="text-xl font-bold">₹{purchase.amount}</p>
                          <p className="text-sm text-yellow-500">{purchase.status}</p>
                        </div>
                        <Button
                          data-testid={`verify-${purchase.id}`}
                          onClick={() => handleVerifyPurchase(purchase.id, 'VERIFY')}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full px-4 py-2"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                        <Button
                          data-testid={`reject-${purchase.id}`}
                          onClick={() => handleVerifyPurchase(purchase.id, 'REJECT')}
                          variant="destructive"
                          className="rounded-full px-4 py-2"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div data-testid="users-list" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
              <h2 className="text-2xl font-bold font-heading mb-6">All Users ({users.length})</h2>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    data-testid={`user-${user.id}`}
                    className="bg-secondary/30 rounded-2xl p-6 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-lg">{user.email}</h4>
                      <p className="text-sm text-muted-foreground">{user.lynkr_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{user.points} pts</p>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Partners Tab */}
          <TabsContent value="partners">
            <div data-testid="partners-list" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
              <h2 className="text-2xl font-bold font-heading mb-6">All Partners ({partners.length})</h2>
              <div className="space-y-4">
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    data-testid={`partner-${partner.id}`}
                    className="bg-secondary/30 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{partner.business_name}</h4>
                        <p className="text-sm text-muted-foreground">{partner.category}</p>
                        <p className="text-sm text-muted-foreground">{partner.website}</p>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          partner.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500' :
                          partner.status === 'PILOT' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {partner.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        data-testid={`activate-${partner.id}`}
                        onClick={() => handleUpdatePartnerStatus(partner.id, 'ACTIVE')}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full"
                      >
                        Set Active
                      </Button>
                      <Button
                        data-testid={`pilot-${partner.id}`}
                        onClick={() => handleUpdatePartnerStatus(partner.id, 'PILOT')}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                      >
                        Set Pilot
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;