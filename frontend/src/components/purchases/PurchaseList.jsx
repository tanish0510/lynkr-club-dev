import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import PurchaseCard from '@/components/purchases/PurchaseCard';

const PurchaseList = ({ purchases, loading, onRaiseFirstPurchase, onEdit, partnerMap = {} }) => {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-[110px] rounded-2xl border border-border bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!purchases.length) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-card">
        <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-txt-muted" />
        <p className="text-sm text-txt-secondary font-semibold">No purchases yet</p>
        <p className="text-xs text-txt-muted font-medium mt-1 mb-5">Start by raising your first purchase request.</p>
        <Button className="rounded-full min-h-10 text-sm font-bold" onClick={onRaiseFirstPurchase}>
          Raise Your First Purchase
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {purchases.map((purchase) => {
        const partner =
          partnerMap[purchase.partnerId] ||
          Object.values(partnerMap).find(
            (p) => p.business_name?.toLowerCase() === purchase.partnerName?.toLowerCase()
          ) ||
          null;
        return (
          <PurchaseCard
            key={purchase.id}
            purchase={purchase}
            partner={partner}
            onEdit={onEdit}
          />
        );
      })}
    </div>
  );
};

export default PurchaseList;
