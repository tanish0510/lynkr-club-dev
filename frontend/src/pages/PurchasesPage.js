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
      <PullToRefresh onRefresh={fetchData} className="max-w-6xl mx-auto px-4 py-6 md:py-10 animate-in fade-in-0">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold font-heading">Purchases</h1>
            <p className="text-sm text-muted-foreground mt-1">Track, verify and manage your orders.</p>
          </div>
        </div>

        <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full mb-6">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-white/10 bg-[#131722] p-1.5">
            <TabsTrigger
              value="ALL"
              className="w-full rounded-xl min-h-11 text-sm font-medium text-[#97A0AF] data-[state=active]:bg-[#0C1018] data-[state=active]:text-[#E7ECF5] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.25)]"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="PENDING"
              className="w-full rounded-xl min-h-11 text-sm font-medium text-[#97A0AF] data-[state=active]:bg-[#0C1018] data-[state=active]:text-[#E7ECF5] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.25)]"
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="VERIFIED"
              className="w-full rounded-xl min-h-11 text-sm font-medium text-[#97A0AF] data-[state=active]:bg-[#0C1018] data-[state=active]:text-[#E7ECF5] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.25)]"
            >
              Verified
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <PurchaseList
          purchases={filteredPurchases}
          loading={loading}
          onRaiseFirstPurchase={openRaise}
          onEdit={(purchase) => {
            setEditingPurchase(purchase);
            setModalOpen(true);
          }}
        />
      </PullToRefresh>

      <Button
        onClick={openRaise}
        className="fixed bottom-24 right-4 z-30 h-14 w-14 rounded-full p-0 shadow-2xl lg:bottom-8 lg:right-8 transition-transform duration-200 active:scale-95"
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
