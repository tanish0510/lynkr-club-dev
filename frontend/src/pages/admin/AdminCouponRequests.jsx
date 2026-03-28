import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Clock, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

const STATUS_CONFIG = {
  PENDING: { icon: Clock, label: 'Pending', className: 'bg-amber-500/20 text-amber-500' },
  APPROVED: { icon: CheckCircle2, label: 'Approved', className: 'bg-green-500/20 text-green-500' },
  REJECTED: { icon: XCircle, label: 'Rejected', className: 'bg-red-500/20 text-red-500' },
};

const AdminCouponRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/coupon-requests');
      setRequests(res.data || []);
    } catch (e) {
      toast.error('Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (req) => {
    setActioning(req.id);
    try {
      await api.patch(`/admin/coupon-requests/${req.id}`, {
        status: 'APPROVED',
        value_type: editForm[req.id]?.value_type || req.value_type || 'fixed',
        value: editForm[req.id]?.value ?? req.value ?? 100,
        coupon_code: editForm[req.id]?.coupon_code || req.coupon_code,
      });
      toast.success('Request approved and coupon created');
      setEditingId(null);
      fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Approve failed');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (req) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return;
    setActioning(req.id);
    try {
      await api.patch(`/admin/coupon-requests/${req.id}`, { status: 'REJECTED', rejection_reason: reason || '' });
      toast.success('Request rejected');
      setEditingId(null);
      fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Reject failed');
    } finally {
      setActioning(null);
    }
  };

  const startEdit = (req) => {
    setEditingId(req.id);
    setEditForm((prev) => ({
      ...prev,
      [req.id]: {
        title: req.title,
        description: req.description,
        value_type: req.value_type || 'fixed',
        value: req.value ?? 100,
        coupon_code: req.coupon_code || '',
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Coupon Requests</h1>
        <p className="text-muted-foreground mt-1">Review and approve or reject partner coupon requests.</p>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <p className="text-muted-foreground">No coupon requests yet.</p>
          </div>
        ) : (
          requests.map((req) => {
            const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
            const Icon = config.icon;
            const isEdit = editingId === req.id;
            const form = editForm[req.id] || {};

            return (
              <div key={req.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{isEdit ? (form.title ?? req.title) : req.title}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.className}`}>
                        <Icon className="w-3 h-3" /> {config.label}
                      </span>
                      {req.partner_name && <span className="text-sm text-muted-foreground">• {req.partner_name}</span>}
                    </div>
                    {req.description && <p className="text-sm text-muted-foreground mt-1">{req.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <span>Points: {req.points_required}</span>
                      <span>Max redemptions: {req.max_redemptions}</span>
                      <span>Expiry: {req.expiry_date ? new Date(req.expiry_date).toLocaleDateString() : '-'}</span>
                    </div>
                    {req.rejection_reason && <p className="text-sm text-red-400 mt-2">Rejection: {req.rejection_reason}</p>}
                  </div>
                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => startEdit(req)}>
                        <Pencil className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-xl bg-green-600 hover:bg-green-700"
                        disabled={actioning === req.id}
                        onClick={() => handleApprove(req)}
                      >
                        {actioning === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-xl"
                        disabled={actioning === req.id}
                        onClick={() => handleReject(req)}
                      >
                        {actioning === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
                {isEdit && req.status === 'PENDING' && (
                  <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={form.title}
                        onChange={(e) => setEditForm((p) => ({ ...p, [req.id]: { ...p[req.id], title: e.target.value } }))}
                        className="mt-1 rounded-xl bg-secondary/50"
                      />
                    </div>
                    <div>
                      <Label>Coupon code (optional)</Label>
                      <Input
                        value={form.coupon_code}
                        onChange={(e) => setEditForm((p) => ({ ...p, [req.id]: { ...p[req.id], coupon_code: e.target.value } }))}
                        placeholder="Auto-generated if empty"
                        className="mt-1 rounded-xl bg-secondary/50"
                      />
                    </div>
                    <div>
                      <Label>Value type</Label>
                      <select
                        value={form.value_type}
                        onChange={(e) => setEditForm((p) => ({ ...p, [req.id]: { ...p[req.id], value_type: e.target.value } }))}
                        className="mt-1 w-full rounded-xl h-10 bg-secondary/50 border border-border px-3"
                      >
                        <option value="fixed">Fixed</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                    <div>
                      <Label>Value (₹ or %)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.value}
                        onChange={(e) => setEditForm((p) => ({ ...p, [req.id]: { ...p[req.id], value: Number(e.target.value) || 0 } }))}
                        className="mt-1 rounded-xl bg-secondary/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminCouponRequests;
