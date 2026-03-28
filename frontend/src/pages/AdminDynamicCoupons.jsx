import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, CheckCircle2, XCircle, Package, Settings2, Inbox, Loader2, CreditCard } from 'lucide-react';

import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const inputCls = 'w-full bg-secondary/50 border border-border rounded-xl h-11 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function AdminDynamicCoupons() {
  const [tab, setTab] = useState('configs');
  const [configs, setConfigs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Config form
  const [configForm, setConfigForm] = useState({ brand_name: '', brand_logo_url: '', min_unlock_amount: '', points_cost: '' });
  const [savingConfig, setSavingConfig] = useState(false);

  // Inventory form
  const [invForm, setInvForm] = useState({ brand_name: '', card_code: '', card_pin: '', value: '' });
  const [savingInv, setSavingInv] = useState(false);

  // Approval
  const [processingId, setProcessingId] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [c, r, i] = await Promise.all([
        api.get('/admin/dynamic-coupons/configs'),
        api.get('/admin/dynamic-coupons/requests' + (statusFilter ? `?status=${statusFilter}` : '')),
        api.get('/admin/dynamic-coupons/inventory'),
      ]);
      setConfigs(c.data);
      setRequests(r.data);
      setInventory(i.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Config CRUD ---
  const handleCreateConfig = async (e) => {
    e.preventDefault();
    if (!configForm.brand_name || !configForm.min_unlock_amount || !configForm.points_cost) {
      toast.error('Fill all required fields');
      return;
    }
    setSavingConfig(true);
    try {
      await api.post('/admin/dynamic-coupons/configs', {
        brand_name: configForm.brand_name,
        brand_logo_url: configForm.brand_logo_url || null,
        min_unlock_amount: parseInt(configForm.min_unlock_amount),
        points_cost: parseInt(configForm.points_cost),
        is_active: true,
      });
      toast.success('Config created');
      setConfigForm({ brand_name: '', brand_logo_url: '', min_unlock_amount: '', points_cost: '' });
      await fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDeleteConfig = async (id) => {
    try {
      await api.delete(`/admin/dynamic-coupons/configs/${id}`);
      toast.success('Config deleted');
      await fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed');
    }
  };

  const handleToggleConfig = async (config) => {
    try {
      await api.patch(`/admin/dynamic-coupons/configs/${config.id}`, { is_active: !config.is_active });
      toast.success(config.is_active ? 'Deactivated' : 'Activated');
      await fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed');
    }
  };

  // --- Request approval ---
  const handleApproveReject = async (requestId, status) => {
    setProcessingId(requestId);
    try {
      const res = await api.patch(`/admin/dynamic-coupons/requests/${requestId}`, { status });
      toast.success(res.data.message || `Request ${status}`);
      await fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed');
    } finally {
      setProcessingId(null);
    }
  };

  // --- Inventory CRUD ---
  const handleAddInventory = async (e) => {
    e.preventDefault();
    if (!invForm.brand_name || !invForm.card_code || !invForm.card_pin || !invForm.value) {
      toast.error('Fill all fields');
      return;
    }
    setSavingInv(true);
    try {
      await api.post('/admin/dynamic-coupons/inventory', {
        brand_name: invForm.brand_name,
        card_code: invForm.card_code,
        card_pin: invForm.card_pin,
        value: parseInt(invForm.value),
      });
      toast.success('Gift card added');
      setInvForm({ brand_name: '', card_code: '', card_pin: '', value: '' });
      await fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed');
    } finally {
      setSavingInv(false);
    }
  };

  const handleDeleteInventory = async (id) => {
    try {
      await api.delete(`/admin/dynamic-coupons/inventory/${id}`);
      toast.success('Card removed');
      await fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const availableCards = inventory.filter(c => !c.is_used).length;
  const usedCards = inventory.filter(c => c.is_used).length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Dynamic Coupons</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage brand configs, user requests, and gift card inventory</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Brands</p>
          <p className="text-2xl font-bold mt-1">{configs.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Pending Requests</p>
          <p className="text-2xl font-bold mt-1 text-yellow-400">{pendingRequests}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Cards Available</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">{availableCards}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Cards Used</p>
          <p className="text-2xl font-bold mt-1">{usedCards}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3 bg-secondary/50 rounded-xl p-1">
          <TabsTrigger value="configs" className="rounded-lg text-sm">
            <Settings2 className="w-4 h-4 mr-1.5" /> Configs
          </TabsTrigger>
          <TabsTrigger value="requests" className="rounded-lg text-sm">
            <Inbox className="w-4 h-4 mr-1.5" /> Requests
            {pendingRequests > 0 && (
              <span className="ml-1.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full px-1.5 py-0.5">{pendingRequests}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-lg text-sm">
            <CreditCard className="w-4 h-4 mr-1.5" /> Inventory
          </TabsTrigger>
        </TabsList>

        {/* ==================== CONFIGS ==================== */}
        <TabsContent value="configs" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create form */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Brand Config
              </h3>
              <form onSubmit={handleCreateConfig} className="space-y-3">
                <input className={inputCls} placeholder="Brand Name (e.g. Zomato)" value={configForm.brand_name}
                  onChange={e => setConfigForm(f => ({ ...f, brand_name: e.target.value }))} />
                <input className={inputCls} placeholder="Logo URL (optional)" value={configForm.brand_logo_url}
                  onChange={e => setConfigForm(f => ({ ...f, brand_logo_url: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} type="number" placeholder="Min Amount (₹)" value={configForm.min_unlock_amount}
                    onChange={e => setConfigForm(f => ({ ...f, min_unlock_amount: e.target.value }))} />
                  <input className={inputCls} type="number" placeholder="Points Cost" value={configForm.points_cost}
                    onChange={e => setConfigForm(f => ({ ...f, points_cost: e.target.value }))} />
                </div>
                <Button type="submit" disabled={savingConfig} className="w-full rounded-xl">
                  {savingConfig ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Config
                </Button>
              </form>
            </div>

            {/* Config list */}
            <div className="space-y-3">
              <h3 className="font-semibold">Active Configs ({configs.length})</h3>
              {configs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No configs yet</p>
              ) : configs.map(c => (
                <div key={c.id} className="bg-secondary/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.brand_name}</p>
                    <p className="text-xs text-muted-foreground">Min ₹{c.min_unlock_amount} · {c.points_cost} pts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleConfig(c)}
                      className={c.is_active ? 'text-emerald-400' : 'text-muted-foreground'}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteConfig(c.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ==================== REQUESTS ==================== */}
        <TabsContent value="requests" className="mt-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['', 'pending', 'approved', 'rejected'].map(s => (
              <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" className="rounded-full text-xs"
                onClick={() => setStatusFilter(s)}>
                {s || 'All'}
              </Button>
            ))}
          </div>

          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No requests found</p>
          ) : requests.map(req => (
            <div key={req.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{req.brand_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {req.user_name || 'User'} · {req.user_email || ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹{req.requested_amount} · {req.points_used} pts · User balance: {req.user_points ?? '?'} pts
                  </p>
                </div>
                <Badge className={`${STATUS_COLORS[req.status]} border text-xs capitalize`}>{req.status}</Badge>
              </div>

              {req.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    disabled={processingId === req.id}
                    onClick={() => handleApproveReject(req.id, 'approved')}>
                    {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1 rounded-xl"
                    disabled={processingId === req.id}
                    onClick={() => handleApproveReject(req.id, 'rejected')}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              )}

              {req.status === 'approved' && req.gift_card_id && (
                <p className="text-xs text-emerald-400">Gift card assigned: {req.gift_card_id}</p>
              )}
            </div>
          ))}
        </TabsContent>

        {/* ==================== INVENTORY ==================== */}
        <TabsContent value="inventory" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Add form */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" /> Add Gift Card
              </h3>
              <form onSubmit={handleAddInventory} className="space-y-3">
                <input className={inputCls} placeholder="Brand Name" value={invForm.brand_name}
                  onChange={e => setInvForm(f => ({ ...f, brand_name: e.target.value }))} />
                <input className={inputCls} placeholder="Card Code" value={invForm.card_code}
                  onChange={e => setInvForm(f => ({ ...f, card_code: e.target.value }))} />
                <input className={inputCls} placeholder="Card PIN" value={invForm.card_pin}
                  onChange={e => setInvForm(f => ({ ...f, card_pin: e.target.value }))} />
                <input className={inputCls} type="number" placeholder="Value (₹)" value={invForm.value}
                  onChange={e => setInvForm(f => ({ ...f, value: e.target.value }))} />
                <Button type="submit" disabled={savingInv} className="w-full rounded-xl">
                  {savingInv ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add Card
                </Button>
              </form>
            </div>

            {/* Inventory list */}
            <div className="space-y-3">
              <h3 className="font-semibold">Inventory ({inventory.length})</h3>
              {inventory.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No gift cards in inventory</p>
              ) : inventory.map(item => (
                <div key={item.id} className="bg-secondary/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.brand_name} — ₹{item.value}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.card_code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.is_used ? (
                      <Badge className="bg-muted text-muted-foreground border border-border text-xs">Used</Badge>
                    ) : (
                      <>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">Available</Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteInventory(item.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
