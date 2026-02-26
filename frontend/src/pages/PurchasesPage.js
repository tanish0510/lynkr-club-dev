import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import PurchaseList from '@/components/purchases/PurchaseList';
import RaisePurchaseModal from '@/components/purchases/RaisePurchaseModal';
import api from '@/utils/api';

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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in-0">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold font-heading">Your Purchases</h1>
            <p className="text-muted-foreground mt-1">Track and manage your orders</p>
          </div>
          <Button
            className="rounded-full px-6 py-6 bg-primary hover:bg-primary/90 glow-primary transition-transform duration-200 hover:scale-[1.02]"
            onClick={() => {
              setEditingPurchase(null);
              setModalOpen(true);
            }}
          >
            Raise Purchase
          </Button>
        </div>

        <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full mb-6">
          <TabsList className="grid w-full max-w-xl grid-cols-4 bg-secondary/50 rounded-xl p-1">
            <TabsTrigger value="ALL" className="rounded-lg">All</TabsTrigger>
            <TabsTrigger value="PENDING" className="rounded-lg">Pending</TabsTrigger>
            <TabsTrigger value="VERIFIED" className="rounded-lg">Verified</TabsTrigger>
            <TabsTrigger value="REJECTED" className="rounded-lg">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        <PurchaseList
          purchases={filteredPurchases}
          loading={loading}
          onRaiseFirstPurchase={() => {
            setEditingPurchase(null);
            setModalOpen(true);
          }}
          onEdit={(purchase) => {
            setEditingPurchase(purchase);
            setModalOpen(true);
          }}
        />
      </div>

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
    </DashboardLayout>
  );
};

export default PurchasesPage;
