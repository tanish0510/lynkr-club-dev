import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Gift, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

const STATUS_CONFIG = {
  PENDING: { icon: Clock, label: 'Pending Approval', className: 'bg-amber-500/20 text-amber-500' },
  APPROVED: { icon: CheckCircle2, label: 'Approved', className: 'bg-green-500/20 text-green-500' },
  REJECTED: { icon: XCircle, label: 'Rejected', className: 'bg-red-500/20 text-red-500' },
};

const PartnerCouponRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    discount_or_reward_details: '',
    points_required: '',
    expiry_date: '',
    max_redemptions: '',
    terms_and_conditions: '',
  });

  const fetchRequests = async () => {
    try {
      const res = await api.get('/partner/coupon-requests');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const points = parseInt(form.points_required, 10);
    const maxRed = parseInt(form.max_redemptions, 10);
    const expiry = form.expiry_date ? new Date(form.expiry_date) : null;
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (Number.isNaN(points) || points <= 0) {
      toast.error('Points required must be a positive number');
      return;
    }
    if (Number.isNaN(maxRed) || maxRed <= 0) {
      toast.error('Max redemptions must be a positive number');
      return;
    }
    if (!expiry || Number.isNaN(expiry.getTime())) {
      toast.error('Valid expiry date is required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/partner/coupon-requests', {
        title: form.title.trim(),
        description: form.description.trim(),
        discount_or_reward_details: form.discount_or_reward_details.trim(),
        points_required: points,
        expiry_date: expiry.toISOString(),
        max_redemptions: maxRed,
        terms_and_conditions: form.terms_and_conditions.trim(),
      });
      toast.success('Request submitted. It will appear in Admin for approval.');
      setForm({ title: '', description: '', discount_or_reward_details: '', points_required: '', expiry_date: '', max_redemptions: '', terms_and_conditions: '' });
      fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Coupon Requests</h1>
        <p className="text-muted-foreground mt-1">Submit new reward/coupon requests for admin approval.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-2xl border border-white/5 p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">New request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Coupon Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 20% off next order"
                  className="mt-1.5 rounded-xl bg-secondary/50 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description of the offer"
                  rows={2}
                  className="mt-1.5 rounded-xl bg-secondary/50 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="discount">Discount or Reward Details</Label>
                <Input
                  id="discount"
                  value={form.discount_or_reward_details}
                  onChange={(e) => setForm({ ...form, discount_or_reward_details: e.target.value })}
                  placeholder="e.g. 20% off, or ₹500 value"
                  className="mt-1.5 rounded-xl bg-secondary/50 border-white/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="points">Points Required</Label>
                  <Input
                    id="points"
                    type="number"
                    min={1}
                    value={form.points_required}
                    onChange={(e) => setForm({ ...form, points_required: e.target.value })}
                    className="mt-1.5 rounded-xl bg-secondary/50 border-white/10"
                  />
                </div>
                <div>
                  <Label htmlFor="max_red">Max Redemptions</Label>
                  <Input
                    id="max_red"
                    type="number"
                    min={1}
                    value={form.max_redemptions}
                    onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })}
                    className="mt-1.5 rounded-xl bg-secondary/50 border-white/10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="datetime-local"
                  value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  className="mt-1.5 rounded-xl bg-secondary/50 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="terms">Terms & Conditions (optional)</Label>
                <Textarea
                  id="terms"
                  value={form.terms_and_conditions}
                  onChange={(e) => setForm({ ...form, terms_and_conditions: e.target.value })}
                  placeholder="Any terms for this offer"
                  rows={2}
                  className="mt-1.5 rounded-xl bg-secondary/50 border-white/10"
                />
              </div>
              <Button type="submit" disabled={submitting} className="rounded-xl min-h-11">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Approval'}
              </Button>
            </form>
          </div>
        </div>
        <div>
          <div className="bg-card rounded-2xl border border-white/5 p-6 shadow-sm sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Request status</h2>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests yet. Submit one above.</p>
            ) : (
              <ul className="space-y-3">
                {requests.map((r) => {
                  const config = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;
                  const Icon = config.icon;
                  return (
                    <li key={r.id} className="rounded-xl border border-white/5 p-3 bg-secondary/20">
                      <p className="font-medium text-sm truncate">{r.title}</p>
                      <span className={`inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full ${config.className}`}>
                        <Icon className="w-3 h-3" /> {config.label}
                      </span>
                      {r.rejection_reason && <p className="text-xs text-red-400 mt-1">{r.rejection_reason}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerCouponRequestsPage;
