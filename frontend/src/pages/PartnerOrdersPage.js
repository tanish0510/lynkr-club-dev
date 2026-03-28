import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Flag,
  IndianRupee,
  Mail,
  Package,
  Search,
  ShoppingBag,
} from 'lucide-react';
import api from '@/utils/api';
import StatusBadge from '@/components/partner/StatusBadge';
import EmptyState from '@/components/partner/EmptyState';
import { ListSkeleton } from '@/components/partner/SkeletonPulse';

const PIPELINE = [
  { key: 'all', label: 'All', icon: ShoppingBag, badgeClass: 'bg-blue-500/20 text-blue-300' },
  { key: 'pending', label: 'Pending', icon: Clock, badgeClass: 'bg-amber-500/20 text-amber-300' },
  { key: 'acknowledged', label: 'Approved', icon: CheckCircle2, badgeClass: 'bg-emerald-500/20 text-emerald-300' },
  { key: 'flagged', label: 'Flagged', icon: Flag, badgeClass: 'bg-red-500/20 text-red-300' },
];

function normalizeStageFromUrl(raw) {
  if (!raw) return 'all';
  const s = raw.toLowerCase();
  if (s === 'pending') return 'pending';
  if (s === 'acknowledged' || s === 'approved') return 'acknowledged';
  if (s === 'flagged' || s === 'disputed') return 'flagged';
  return 'all';
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDateGroupLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

const isFlaggedStatus = (status) => status === 'FLAGGED' || status === 'DISPUTED';

const badgeStatus = (status) => (status === 'DISPUTED' ? 'FLAGGED' : status);

const PartnerOrdersPage = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState(() =>
    normalizeStageFromUrl(searchParams.get('status'))
  );
  const [search, setSearch] = useState('');
  const [acknowledging, setAcknowledging] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [flagDialogOrder, setFlagDialogOrder] = useState(null);
  const [flagging, setFlagging] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/partner/orders');
      setOrders(response.data || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [activeStage, fetchOrders]);

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        const response = await api.get('/partner/purchases');
        setPurchases(response.data || []);
      } catch {
        setPurchases([]);
      }
    };
    loadPurchases();
  }, []);

  const getPurchaseIdForOrder = useCallback(
    (order) => {
      const match = purchases.find(
        (p) =>
          String(p.order_id || '') === String(order.order_id || '') &&
          (p.user_lynkr_email || '').toLowerCase() === (order.user_lynkr_email || '').toLowerCase()
      );
      return match?.purchase_id;
    },
    [purchases]
  );

  const handleAcknowledge = async (orderId) => {
    setAcknowledging(orderId);
    try {
      await api.post(`/partner/acknowledge-order/${orderId}`);
      toast.success('Order acknowledged! User has been credited points.');
      await fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to acknowledge order');
    } finally {
      setAcknowledging(null);
    }
  };

  const handleConfirmFlag = async () => {
    if (!flagDialogOrder) return;
    const purchaseId = getPurchaseIdForOrder(flagDialogOrder);
    if (!purchaseId) {
      toast.error('Could not resolve purchase for this order. Try again after purchases load.');
      return;
    }
    setFlagging(true);
    try {
      await api.post('/partner/verify-purchase', {
        purchase_id: purchaseId,
        action: 'REJECT',
      });
      toast.success('Order flagged for admin review.');
      setFlagDialogOrder(null);
      await fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to flag order');
    } finally {
      setFlagging(false);
    }
  };

  const counts = useMemo(() => {
    const all = orders.length;
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const acknowledged = orders.filter((o) => o.status === 'ACKNOWLEDGED').length;
    const flagged = orders.filter((o) => isFlaggedStatus(o.status)).length;
    return { all, pending, acknowledged, flagged };
  }, [orders]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const verified = orders.filter(
      (o) => o.status === 'ACKNOWLEDGED' || o.status === 'VERIFIED'
    ).length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    return {
      totalOrders: orders.length,
      pending,
      verified,
      totalRevenue,
    };
  }, [orders]);

  const stageFiltered = useMemo(() => {
    if (activeStage === 'all') return orders;
    if (activeStage === 'pending') return orders.filter((o) => o.status === 'PENDING');
    if (activeStage === 'acknowledged') return orders.filter((o) => o.status === 'ACKNOWLEDGED');
    if (activeStage === 'flagged') return orders.filter((o) => isFlaggedStatus(o.status));
    return orders;
  }, [orders, activeStage]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stageFiltered;
    return stageFiltered.filter((o) => {
      const oid = String(o.order_id || '').toLowerCase();
      const email = String(o.user_lynkr_email || '').toLowerCase();
      return oid.includes(q) || email.includes(q);
    });
  }, [stageFiltered, search]);

  const groupedByDate = useMemo(() => {
    const map = new Map();
    filteredOrders.forEach((order) => {
      const label = getDateGroupLabel(order.created_at);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(order);
    });
    return Array.from(map.entries());
  }, [filteredOrders]);

  const pendingCount = counts.pending;

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const statusIconWrap = (status) => {
    if (status === 'PENDING') {
      return (
        <div className="w-11 h-11 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-amber-400" />
        </div>
      );
    }
    if (status === 'ACKNOWLEDGED' || status === 'VERIFIED') {
      return (
        <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
      );
    }
    if (isFlaggedStatus(status)) {
      return (
        <div className="w-11 h-11 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
          <Flag className="w-5 h-5 text-red-400" />
        </div>
      );
    }
    return (
      <div className="w-11 h-11 rounded-full bg-muted/40 border border-white/[0.08] flex items-center justify-center shrink-0">
        <Package className="w-5 h-5 text-txt-muted" />
      </div>
    );
  };

  return (
    <div className="max-w-5xl space-y-6 bg-background">
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">Orders</h1>
        <p className="text-sm text-txt-secondary mt-1">
          Review, acknowledge, and flag orders from Lynkr users.
        </p>
      </div>

      {pendingCount >= 2 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-sm font-medium text-amber-100/95 font-heading tabular-nums transition-all duration-300">
          {pendingCount} orders awaiting verification
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Orders',
            value: stats.totalOrders,
            icon: ShoppingBag,
            accent: 'text-blue-400',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Pending',
            value: stats.pending,
            icon: Clock,
            accent: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Verified',
            value: stats.verified,
            icon: CheckCircle2,
            accent: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Total Revenue',
            value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
            icon: IndianRupee,
            accent: 'text-blue-400',
            bg: 'bg-blue-500/10',
            large: true,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-4 transition-all duration-300 hover:border-white/[0.1]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-txt-muted font-heading">
                  {kpi.label}
                </p>
                <p
                  className={`mt-2 font-heading font-bold tabular-nums text-foreground ${
                    kpi.large ? 'text-xl sm:text-2xl' : 'text-2xl'
                  }`}
                >
                  {kpi.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl ${kpi.bg} border border-white/[0.06] flex items-center justify-center shrink-0`}
              >
                <kpi.icon className={`w-5 h-5 ${kpi.accent}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted pointer-events-none" />
        <Input
          type="search"
          placeholder="Search by order ID or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl border-white/[0.08] bg-[#0A0A0A] h-11 font-heading transition-all duration-300 focus-visible:ring-blue-500/40"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
        {PIPELINE.map((stage) => {
          const count = counts[stage.key];
          const isActive = activeStage === stage.key;
          const StageIcon = stage.icon;
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => setActiveStage(stage.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium font-heading whitespace-nowrap snap-start shrink-0 transition-all duration-300 border ${
                isActive
                  ? 'bg-blue-500/15 text-blue-100 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                  : 'bg-[#0A0A0A] text-txt-secondary border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              <StageIcon className="w-4 h-4" />
              {stage.label}
              <span
                className={`min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                  isActive ? stage.badgeClass : 'bg-white/[0.06] text-txt-muted'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A]">
          <EmptyState
            icon={Package}
            title="No orders found"
            description={
              search
                ? 'No orders match your search.'
                : activeStage === 'pending'
                  ? 'All orders have been acknowledged!'
                  : activeStage === 'acknowledged'
                    ? 'No acknowledged orders yet.'
                    : activeStage === 'flagged'
                      ? 'No flagged orders.'
                      : 'No orders received yet.'
            }
          />
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByDate.map(([dateLabel, groupOrders]) => (
            <div key={dateLabel}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-heading mb-3 px-1">
                {dateLabel}
              </h2>
              <div className="space-y-3">
                {groupOrders.map((order) => {
                  const expanded = expandedId === order.id;
                  const showFlag =
                    (order.status === 'PENDING' || order.status === 'ACKNOWLEDGED') &&
                    !isFlaggedStatus(order.status);

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] overflow-hidden transition-all duration-300 hover:border-white/[0.1]"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleExpanded(order.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleExpanded(order.id);
                          }
                        }}
                        className="w-full text-left p-4 flex items-start gap-4 transition-all duration-300 hover:bg-white/[0.02] cursor-pointer"
                      >
                        {statusIconWrap(order.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold font-heading text-foreground truncate">
                                Order #{order.order_id}
                              </p>
                              <p className="text-xs text-txt-secondary mt-1 flex items-center gap-1.5 truncate">
                                <Mail className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                {order.user_lynkr_email}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xl font-bold font-heading tabular-nums text-foreground">
                                ₹{Number(order.amount || 0).toLocaleString('en-IN')}
                              </p>
                              <div className="mt-1 flex justify-end">
                                <StatusBadge status={badgeStatus(order.status)} />
                              </div>
                            </div>
                          </div>
                          <p className="text-[11px] text-txt-muted mt-3 font-heading tabular-nums">
                            {formatDateTime(order.created_at)}
                          </p>
                        </div>
                        <div className="shrink-0 pt-1 text-txt-muted">
                          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06]">
                        {order.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => handleAcknowledge(order.id)}
                            disabled={acknowledging === order.id}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_20px_rgba(34,197,94,0.12)] transition-all duration-300"
                          >
                            {acknowledging === order.id ? (
                              'Processing…'
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                Acknowledge
                              </>
                            )}
                          </Button>
                        )}
                        {showFlag && (
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => setFlagDialogOrder(order)}
                            className="rounded-xl border-red-500/35 text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-300"
                          >
                            <Flag className="w-3.5 h-3.5 mr-1.5" />
                            Flag as Returned
                          </Button>
                        )}
                      </div>

                      {expanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-white/[0.06]">
                          <div className="grid sm:grid-cols-2 gap-3 pt-4 text-xs font-heading">
                            <div>
                              <p className="text-txt-muted uppercase tracking-wide text-[10px]">Order ID</p>
                              <p className="text-foreground mt-0.5 tabular-nums break-all">{order.order_id}</p>
                            </div>
                            <div>
                              <p className="text-txt-muted uppercase tracking-wide text-[10px]">Transaction ID</p>
                              <p className="text-foreground mt-0.5 tabular-nums break-all">
                                {order.transaction_id || '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-txt-muted uppercase tracking-wide text-[10px]">Created</p>
                              <p className="text-foreground mt-0.5">{formatDateTime(order.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-txt-muted uppercase tracking-wide text-[10px]">Acknowledged</p>
                              <p className="text-foreground mt-0.5">
                                {order.acknowledged_at ? formatDateTime(order.acknowledged_at) : '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!flagDialogOrder} onOpenChange={(open) => !open && setFlagDialogOrder(null)}>
        <DialogContent className="rounded-2xl border border-white/[0.08] bg-[#0A0A0A] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Flag Order as Returned</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-txt-secondary leading-relaxed">
            This will send a request to the admin for review. The order will be marked as Flagged.
          </p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-white/[0.1]"
              onClick={() => setFlagDialogOrder(null)}
              disabled={flagging}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.15)]"
              onClick={handleConfirmFlag}
              disabled={flagging}
            >
              {flagging ? 'Flagging…' : 'Flag Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerOrdersPage;
