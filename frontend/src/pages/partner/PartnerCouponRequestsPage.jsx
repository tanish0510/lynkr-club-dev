import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Gift,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Sparkles,
  Tag,
  Calendar,
  Users,
  ArrowRight,
  Search,
  ChevronRight,
  TicketPercent,
  Percent,
  Coins,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import StatusBadge from '@/components/partner/StatusBadge';
import { PageSkeleton } from '@/components/partner/SkeletonPulse';

const CARD = 'rounded-2xl border border-white/[0.06] bg-[#0A0A0A]';

const EMPTY_FORM = {
  title: '',
  description: '',
  discount_or_reward_details: '',
  points_required: '',
  expiry_date: '',
  max_redemptions: '',
  terms_and_conditions: '',
};

const TABS = [
  { key: 'all', label: 'All', icon: Gift },
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
];

const TEMPLATES = [
  { title: '% Off Next Order', discount: '20% off', points: 50, icon: Percent, color: '217 91% 60%' },
  { title: 'Free Delivery', discount: 'Free delivery on order', points: 30, icon: TicketPercent, color: '142 71% 45%' },
  { title: 'Cashback Reward', discount: '₹100 cashback', points: 80, icon: Coins, color: '45 100% 51%' },
  { title: 'Buy 1 Get 1', discount: 'BOGO on select items', points: 60, icon: Users, color: '292 84% 61%' },
];

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const PartnerCouponRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await api.get('/partner/coupon-requests');
      setRequests(res.data || []);
    } catch (_) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const openCreate = (initial = EMPTY_FORM) => { setForm(initial); setDialogOpen(true); };

  const useTemplate = (t) => {
    setForm({ ...EMPTY_FORM, title: t.title, discount_or_reward_details: t.discount, points_required: String(t.points) });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const points = parseInt(form.points_required, 10);
    const maxRed = parseInt(form.max_redemptions, 10);
    const expiry = form.expiry_date ? new Date(form.expiry_date) : null;
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (Number.isNaN(points) || points <= 0) { toast.error('Points must be a positive number'); return; }
    if (Number.isNaN(maxRed) || maxRed <= 0) { toast.error('Max redemptions must be a positive number'); return; }
    if (!expiry || Number.isNaN(expiry.getTime())) { toast.error('Valid expiry date is required'); return; }
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
      toast.success('Request submitted for approval');
      setForm(EMPTY_FORM);
      setDialogOpen(false);
      fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const counts = useMemo(() => {
    const c = { all: requests.length, pending: 0, approved: 0, rejected: 0 };
    requests.forEach((r) => {
      if (r.status === 'PENDING') c.pending++;
      else if (r.status === 'APPROVED') c.approved++;
      else if (r.status === 'REJECTED') c.rejected++;
    });
    return c;
  }, [requests]);

  const filtered = useMemo(() => {
    let list = requests;
    if (activeTab !== 'all') list = list.filter((r) => r.status === activeTab.toUpperCase());
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        (r.title || '').toLowerCase().includes(q) ||
        (r.discount_or_reward_details || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, activeTab, search]);

  const fieldClass = 'mt-1.5 rounded-xl h-10 bg-transparent border-white/[0.08] text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/30';
  const textareaClass = 'mt-1.5 rounded-xl bg-transparent border-white/[0.08] text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/30 resize-none';

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-5xl space-y-5 pb-10">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-heading text-foreground">Rewards & Coupons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create loyalty rewards for your customers.</p>
        </div>
        <Button
          onClick={() => openCreate()}
          variant="outline"
          className="rounded-xl h-9 px-3.5 text-sm gap-1.5 shrink-0 border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-foreground"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Coupon</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* ── STATS ROW ── */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
          {[
            { label: 'Total', value: counts.all, icon: Gift, color: 'text-blue-400' },
            { label: 'Pending', value: counts.pending, icon: Clock, color: 'text-amber-400' },
            { label: 'Approved', value: counts.approved, icon: CheckCircle2, color: 'text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className="py-3 px-4 flex items-center gap-3">
              <s.icon className={`w-4 h-4 ${s.color} shrink-0`} />
              <div>
                <p className="text-lg font-bold font-heading text-foreground tabular-nums leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK TEMPLATES ── */}
      <section>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Quick Templates</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.title}
              type="button"
              onClick={() => useTemplate(t)}
              className={`group flex items-center gap-3 p-3 rounded-2xl border border-white/[0.08] bg-[#0A0A0A] text-left active:scale-[0.97] transition-all duration-200 hover:border-white/[0.15] hover:bg-[#111]`}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `hsl(${t.color} / 0.12)` }}
              >
                <t.icon className="w-4 h-4" style={{ color: `hsl(${t.color})` }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground leading-tight">{t.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{t.discount} · {t.points} pts</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── FILTER TABS + SEARCH ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  active
                    ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className={`tabular-nums ml-0.5 ${active ? 'text-blue-400' : 'text-muted-foreground/60'}`}>
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative sm:ml-auto sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coupons..."
            className="pl-8 h-8 rounded-full bg-white/[0.03] border-white/[0.08] text-sm placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* ── REQUEST LIST ── */}
      {filtered.length === 0 ? (
        <div className={`${CARD} py-16 text-center`}>
          <Gift className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">
            {requests.length === 0 ? 'No coupons yet' : 'No matching coupons'}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            {requests.length === 0
              ? 'Create your first coupon to reward loyal customers.'
              : 'Try a different filter or search term.'}
          </p>
          {requests.length === 0 && (
            <Button
              onClick={() => openCreate()}
              variant="outline"
              className="rounded-xl h-9 text-xs mt-5 gap-1.5 border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05]"
            >
              <Plus className="w-3.5 h-3.5" /> Create coupon
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const isPending = r.status === 'PENDING';
            const isApproved = r.status === 'APPROVED';
            const isRejected = r.status === 'REJECTED';
            return (
              <article
                key={r.id}
                className={`${CARD} p-4 transition-all duration-200 hover:border-white/[0.12] hover:bg-[#0C0C0C]`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isApproved ? 'bg-emerald-500/10' : isRejected ? 'bg-red-500/10' : 'bg-amber-500/10'
                  }`}>
                    {isApproved ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      : isRejected ? <XCircle className="w-5 h-5 text-red-400" />
                      : <Clock className="w-5 h-5 text-amber-400" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground leading-tight">{r.title}</h4>
                      <StatusBadge status={r.status} />
                    </div>

                    {r.discount_or_reward_details && (
                      <p className="text-xs text-muted-foreground mt-1">{r.discount_or_reward_details}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[11px] text-muted-foreground tabular-nums">
                      {r.points_required != null && (
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-400/70" />
                          {r.points_required} pts
                        </span>
                      )}
                      {r.max_redemptions != null && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Max {r.max_redemptions}
                        </span>
                      )}
                      {r.expiry_date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(r.expiry_date)}
                        </span>
                      )}
                      {r.created_at && (
                        <span className="text-muted-foreground/50">
                          Created {fmtDateTime(r.created_at)}
                        </span>
                      )}
                    </div>

                    {isRejected && r.rejection_reason && (
                      <div className="mt-3 rounded-xl border border-red-500/15 bg-red-500/[0.05] px-3 py-2">
                        <p className="text-[11px] text-red-300/90 leading-relaxed">{r.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── CREATE DIALOG ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-white/[0.08] bg-[#0A0A0A] p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-white/[0.06] text-left space-y-1">
            <DialogTitle className="text-base font-heading font-semibold text-foreground">Create coupon request</DialogTitle>
            <p className="text-xs text-muted-foreground">Submitted coupons are reviewed before going live.</p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground" htmlFor="c-title">Title</label>
                <Input id="c-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. 20% off next order" className={fieldClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground" htmlFor="c-desc">Description</label>
                <Textarea id="c-desc" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Short description of this offer" rows={2} className={`${textareaClass} min-h-[64px]`} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground" htmlFor="c-discount">Discount / reward</label>
                <Input id="c-discount" value={form.discount_or_reward_details} onChange={(e) => set('discount_or_reward_details', e.target.value)} placeholder="e.g. 20% off, ₹500 cashback" className={fieldClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06]">
              <div>
                <label className="text-xs font-medium text-foreground" htmlFor="c-pts">Points required</label>
                <Input id="c-pts" type="number" min={1} value={form.points_required} onChange={(e) => set('points_required', e.target.value)} placeholder="50" className={fieldClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground" htmlFor="c-max">Max redemptions</label>
                <Input id="c-max" type="number" min={1} value={form.max_redemptions} onChange={(e) => set('max_redemptions', e.target.value)} placeholder="100" className={fieldClass} />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <div>
                <label className="text-xs font-medium text-foreground" htmlFor="c-exp">Expiry date</label>
                <Input id="c-exp" type="datetime-local" value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground" htmlFor="c-terms">Terms & conditions</label>
                <Textarea id="c-terms" value={form.terms_and_conditions} onChange={(e) => set('terms_and_conditions', e.target.value)} placeholder="Optional terms for this offer" rows={2} className={`${textareaClass} min-h-[64px]`} />
              </div>
            </div>

            {/* Live preview */}
            {form.title && (
              <div className="rounded-xl border border-white/[0.06] bg-[#080808] p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{form.title}</p>
                    {form.discount_or_reward_details && <p className="text-xs text-muted-foreground mt-0.5">{form.discount_or_reward_details}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground tabular-nums">
                      {form.points_required && <span>{form.points_required} pts</span>}
                      {form.max_redemptions && <span>Max {form.max_redemptions}</span>}
                      {form.expiry_date && <span>{fmtDate(form.expiry_date)}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2 pt-3 border-t border-white/[0.06] px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl h-9 border-white/[0.1] bg-transparent hover:bg-white/[0.04]">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl h-9 gap-1.5 min-w-[140px] bg-blue-500 text-white hover:bg-blue-600">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {submitting ? 'Submitting…' : 'Submit for approval'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerCouponRequestsPage;
