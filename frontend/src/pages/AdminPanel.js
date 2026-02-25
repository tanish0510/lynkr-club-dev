import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, Building2, ShoppingBag, LogOut, CheckCircle2, XCircle, Gift, Pencil, Trash2 } from 'lucide-react';
import api from '@/utils/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponLoading, setCouponLoading] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [couponForm, setCouponForm] = useState({
    partner_id: '',
    title: '',
    description: '',
    coupon_code: '',
    value_type: 'fixed',
    value: '',
    min_purchase: '',
    points_cost: '',
    expiry_date: '',
    total_quantity: '',
    is_active: true
  });

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
      const couponsRes = await api.get('/admin/coupons');
      setUsers(usersRes.data);
      setPartners(partnersRes.data);
      setPurchases(purchasesRes.data);
      setCoupons(couponsRes.data);
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

  const resetCouponForm = () => {
    setCouponForm({
      partner_id: '',
      title: '',
      description: '',
      coupon_code: '',
      value_type: 'fixed',
      value: '',
      min_purchase: '',
      points_cost: '',
      expiry_date: '',
      total_quantity: '',
      is_active: true
    });
    setEditingCouponId(null);
  };

  const startEditCoupon = (coupon) => {
    setEditingCouponId(coupon.id);
    setCouponForm({
      partner_id: coupon.partner_id,
      title: coupon.title,
      description: coupon.description,
      coupon_code: coupon.coupon_code,
      value_type: coupon.value_type,
      value: coupon.value,
      min_purchase: coupon.min_purchase ?? '',
      points_cost: coupon.points_cost,
      expiry_date: new Date(coupon.expiry_date).toISOString().slice(0, 16),
      total_quantity: coupon.total_quantity,
      is_active: coupon.is_active,
    });
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setCouponLoading(true);
    try {
      const expiry = new Date(couponForm.expiry_date);
      if (Number.isNaN(expiry.getTime())) {
        throw new Error('Please select a valid expiry date/time');
      }

      const valueNum = Number(couponForm.value);
      const pointsNum = Number(couponForm.points_cost);
      const quantityNum = Number(couponForm.total_quantity);
      const minPurchaseNum = couponForm.min_purchase === '' ? null : Number(couponForm.min_purchase);

      if (Number.isNaN(valueNum) || Number.isNaN(pointsNum) || Number.isNaN(quantityNum) || (minPurchaseNum !== null && Number.isNaN(minPurchaseNum))) {
        throw new Error('Please enter valid numeric values');
      }

      const payload = {
        partner_id: couponForm.partner_id,
        title: couponForm.title,
        description: couponForm.description,
        coupon_code: couponForm.coupon_code,
        value_type: couponForm.value_type,
        value: valueNum,
        min_purchase: minPurchaseNum,
        points_cost: pointsNum,
        expiry_date: expiry.toISOString(),
        total_quantity: quantityNum,
        is_active: couponForm.is_active,
      };
      if (editingCouponId) {
        await api.patch(`/admin/coupons/${editingCouponId}`, payload);
        toast.success('Coupon updated');
      } else {
        await api.post('/admin/coupons', payload);
        toast.success('Coupon created');
      }
      resetCouponForm();
      await fetchAllData();
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(', ')
        : detail || error.message || 'Failed to save coupon';
      toast.error(message);
    } finally {
      setCouponLoading(false);
    }
  };

  const toggleCoupon = async (coupon) => {
    try {
      await api.patch(`/admin/coupons/${coupon.id}`, { is_active: !coupon.is_active });
      toast.success(`Coupon ${coupon.is_active ? 'deactivated' : 'activated'}`);
      await fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update coupon');
    }
  };

  const deleteCoupon = async (couponId) => {
    if (!window.confirm('Delete this coupon? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/coupons/${couponId}`);
      toast.success('Coupon deleted');
      await fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete coupon');
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

  const defaultTab = location.pathname.includes('/admin/coupons') ? 'coupons' : 'purchases';

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

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList data-testid="admin-tabs" className="grid w-full max-w-2xl grid-cols-4 mb-8 bg-secondary/50 rounded-xl p-1">
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
            <TabsTrigger data-testid="coupons-tab" value="coupons" className="rounded-lg">
              <Gift className="w-4 h-4 mr-2" />
              Coupons
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

          {/* Coupons Tab */}
          <TabsContent value="coupons">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6">
                <h2 className="text-2xl font-bold font-heading mb-4">
                  {editingCouponId ? 'Edit Coupon' : 'Create Coupon'}
                </h2>
                <form className="space-y-3" onSubmit={handleSaveCoupon}>
                  <select
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl h-11 px-3"
                    value={couponForm.partner_id}
                    onChange={(e) => setCouponForm({ ...couponForm, partner_id: e.target.value })}
                    required
                  >
                    <option value="">Select partner</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>{partner.business_name}</option>
                    ))}
                  </select>
                  <input
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl h-11 px-3"
                    placeholder="Coupon title"
                    value={couponForm.title}
                    onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })}
                    required
                  />
                  <input
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl h-11 px-3"
                    placeholder="Description"
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                    required
                  />
                  <input
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl h-11 px-3 uppercase"
                    placeholder="Coupon code"
                    value={couponForm.coupon_code}
                    onChange={(e) => setCouponForm({ ...couponForm, coupon_code: e.target.value.toUpperCase() })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl h-11 px-3"
                      value={couponForm.value_type}
                      onChange={(e) => setCouponForm({ ...couponForm, value_type: e.target.value })}
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percentage">Percentage</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl h-11 px-3"
                      placeholder="Value"
                      value={couponForm.value}
                      onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl h-11 px-3"
                      placeholder="Min purchase"
                      value={couponForm.min_purchase}
                      onChange={(e) => setCouponForm({ ...couponForm, min_purchase: e.target.value })}
                    />
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl h-11 px-3"
                      placeholder="Points cost"
                      value={couponForm.points_cost}
                      onChange={(e) => setCouponForm({ ...couponForm, points_cost: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="datetime-local"
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl h-11 px-3"
                      value={couponForm.expiry_date}
                      onChange={(e) => setCouponForm({ ...couponForm, expiry_date: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl h-11 px-3"
                      placeholder="Total quantity"
                      value={couponForm.total_quantity}
                      onChange={(e) => setCouponForm({ ...couponForm, total_quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <label className="text-sm inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={couponForm.is_active}
                        onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                      />
                      Active
                    </label>
                    <div className="flex gap-2">
                      {editingCouponId ? (
                        <Button type="button" variant="outline" onClick={resetCouponForm}>Cancel</Button>
                      ) : null}
                      <Button type="submit" disabled={couponLoading}>
                        {couponLoading ? 'Saving...' : editingCouponId ? 'Update Coupon' : 'Create Coupon'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6">
                <h2 className="text-2xl font-bold font-heading mb-4">Coupons ({coupons.length})</h2>
                <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="bg-secondary/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{coupon.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {coupon.coupon_code} • {coupon.partner_name || coupon.partner_id}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${coupon.is_active ? 'bg-green-500/20 text-green-500' : 'bg-zinc-500/20 text-zinc-400'}`}>
                          {coupon.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {coupon.points_cost} pts • redeemed {coupon.redeemed_count}/{coupon.total_quantity} • expires {new Date(coupon.expiry_date).toLocaleString()}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEditCoupon(coupon)}>
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleCoupon(coupon)}>
                          {coupon.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteCoupon(coupon.id)}>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;