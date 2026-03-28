import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, ShoppingBag, Ticket, ArrowRight } from 'lucide-react';
import api from '@/utils/api';
import PurchaseList from '@/components/purchases/PurchaseList';
import RaisePurchaseModal from '@/components/purchases/RaisePurchaseModal';
import PullToRefresh from '@/components/mobile/PullToRefresh';

const MyActivityPage = () => {
  const navigate = useNavigate();
  const [redemptions, setRedemptions] = useState([]);
  const [autoPurchases, setAutoPurchases] = useState([]);
  const [manualPurchases, setManualPurchases] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);

  const fetchRedemptions = async () => {
    try {
      const res = await api.get('/coupons/redemptions');
      setRedemptions(res.data || []);
    } catch {
      toast.error('Failed to load redemptions');
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const fetchPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const [autoRes, manualRes, partnersRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/user/raised-purchases'),
        api.get('/partners/active'),
      ]);
      setAutoPurchases(autoRes.data || []);
      setManualPurchases(manualRes.data || []);
      setPartners(partnersRes.data || []);
    } catch {
      toast.error('Failed to load purchases');
    } finally {
      setLoadingPurchases(false);
    }
  };

  useEffect(() => {
    fetchRedemptions();
    fetchPurchases();
  }, []);

  const normalizedPurchases = useMemo(() => {
    const manualIdSet = new Set(manualPurchases.map((p) => p.purchase_id));
    const autoItems = autoPurchases
      .filter((p) => !manualIdSet.has(p.id))
      .map((p) => ({
        id: p.id,
        partnerName: p.brand,
        partnerId: null,
        orderId: p.order_id,
        transactionId: p.transaction_id || null,
        amount: p.amount,
        status: p.status,
        date: p.timestamp,
        source: 'AUTO',
        canEdit: false,
        pointsEarned: p.status === 'VERIFIED' ? Math.floor(Number(p.amount || 0) * 0.25) : 0,
      }));
    const manualItems = manualPurchases.map((p) => ({
      id: p.purchase_id,
      partnerName: p.partner_name || 'Partner',
      partnerId: p.partner_id || null,
      orderId: p.order_id,
      transactionId: p.transaction_id,
      amount: p.amount,
      status: p.status,
      date: p.created_at,
      source: 'MANUAL',
      canEdit: Boolean(p.can_edit),
      pointsEarned: p.status === 'VERIFIED' ? Math.floor(Number(p.amount || 0) * 0.25) : 0,
    }));
    return [...manualItems, ...autoItems].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [autoPurchases, manualPurchases]);

  const recentPurchases = normalizedPurchases.slice(0, 10);

  const copyCouponCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Coupon code copied');
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const openRaise = () => {
    setEditingPurchase(null);
    setModalOpen(true);
  };

  return (
    <PullToRefresh onRefresh={() => { fetchRedemptions(); fetchPurchases(); }}>
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 pb-24 md:pb-10">
        <h1 className="text-2xl md:text-4xl font-bold font-heading mb-1">My activity</h1>
        <p className="text-sm text-muted-foreground mb-6">Your redemptions and purchases in one place.</p>

        {/* My rewards redeemed */}
        <section className="mb-10">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg md:text-xl font-semibold font-heading flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              My rewards redeemed
            </h2>
            <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate('/app/rewards')}>
              All rewards
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="rounded-2xl md:rounded-3xl border border-border bg-card/80 p-3 md:p-6">
            {loadingRedemptions ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-secondary/20 animate-pulse" />
                ))}
              </div>
            ) : redemptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No coupons redeemed yet.</p>
            ) : (
              <div className="space-y-2 md:space-y-3 max-h-[400px] md:max-h-[480px] overflow-y-auto pr-1">
                {redemptions.map((item) => (
                  <div
                    key={item.id}
                    className="bg-secondary/20 rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">{item.coupon_title || 'Coupon'}</p>
                      <p className="text-[11px] md:text-xs text-muted-foreground">
                        {item.partner_name ? `${item.partner_name} • ` : ''}
                        −{item.points_deducted} pts
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                        {new Date(item.redeemed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <code className="text-xs font-mono bg-surface-overlay/25 px-2 py-1.5 rounded-lg truncate max-w-[120px] md:max-w-none">
                        {item.coupon_code}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] rounded-xl"
                        onClick={() => copyCouponCode(item.coupon_code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* My purchases */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg md:text-xl font-semibold font-heading flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              My purchases
            </h2>
            <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate('/app/purchases')}>
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <PurchaseList
            purchases={recentPurchases}
            loading={loadingPurchases}
            onRaiseFirstPurchase={openRaise}
            onEdit={(p) => {
              setEditingPurchase(p);
              setModalOpen(true);
            }}
          />
        </section>
      </div>

      <RaisePurchaseModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingPurchase(null);
        }}
        partners={partners}
        purchaseToEdit={editingPurchase}
        onSuccess={fetchPurchases}
      />
    </PullToRefresh>
  );
};

export default MyActivityPage;
