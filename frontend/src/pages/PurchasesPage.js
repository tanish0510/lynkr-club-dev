import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import PurchaseList from '@/components/purchases/PurchaseList';
import RaisePurchaseModal from '@/components/purchases/RaisePurchaseModal';
import api from '@/utils/api';
import PullToRefresh from '@/components/mobile/PullToRefresh';

const PurchasesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [autoPurchases, setAutoPurchases] = useState([]);
  const [manualPurchases, setManualPurchases] = useState([]);
  const [partners, setPartners] = useState([]);
  const [statusTab, setStatusTab] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [autoRes, manualRes, partnersRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/user/raised-purchases'),
        api.get('/partners/active'),
      ]);
      setAutoPurchases(autoRes.data || []);
      setManualPurchases(manualRes.data || []);
      setPartners(partnersRes.data || []);
    } catch (error) {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const shouldOpenRaise = searchParams.get('raise') === '1';
    if (shouldOpenRaise) {
      setModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

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

  const partnerMap = useMemo(() => {
    const map = {};
    for (const p of partners) map[p.id] = p;
    return map;
  }, [partners]);

  const filteredPurchases = useMemo(() => {
    if (statusTab === 'ALL') return normalizedPurchases;
    return normalizedPurchases.filter((p) => p.status === statusTab);
  }, [normalizedPurchases, statusTab]);

  const openRaise = () => {
    setEditingPurchase(null);
    setModalOpen(true);
  };

  return (
    <>
      <PullToRefresh onRefresh={fetchData} className="max-w-xl mx-auto px-5 pt-7 pb-12 sm:px-6 animate-in fade-in-0">
        <header className="mb-6">
          <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Your Orders</p>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-heading font-bold text-foreground">Purchases</h1>
          <p className="text-xs text-txt-secondary font-medium mt-1">Track, verify and manage your orders.</p>
        </header>

        <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full mb-6">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-border bg-muted p-1">
            {[
              { value: 'ALL', label: 'All' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'VERIFIED', label: 'Verified' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="w-full rounded-xl min-h-10 text-sm font-bold text-txt-secondary transition-all duration-200 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <PurchaseList
          purchases={filteredPurchases}
          loading={loading}
          onRaiseFirstPurchase={openRaise}
          partnerMap={partnerMap}
          onEdit={(purchase) => {
            setEditingPurchase(purchase);
            setModalOpen(true);
          }}
        />
      </PullToRefresh>

      <Button
        onClick={openRaise}
        className="fixed z-30 h-14 w-14 rounded-full p-0 shadow-2xl transition-transform duration-200 active:scale-95 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 lg:bottom-8 lg:right-8"
        aria-label="Raise purchase"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <RaisePurchaseModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingPurchase(null);
        }}
        partners={partners}
        purchaseToEdit={editingPurchase}
        onSuccess={fetchData}
      />
    </>
  );
};

export default PurchasesPage;
