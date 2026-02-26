import React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag } from 'lucide-react';
import PurchaseCard from '@/components/purchases/PurchaseCard';

const PurchaseList = ({ purchases, loading, onRaiseFirstPurchase, onEdit }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="rounded-3xl border border-white/10 p-5">
            <Skeleton className="h-5 w-32 mb-3" />
            <Skeleton className="h-4 w-44 mb-2" />
            <Skeleton className="h-4 w-56 mb-2" />
            <Skeleton className="h-8 w-24 mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (!purchases.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-card/50 p-12 text-center">
        <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-xl font-semibold mb-1">No purchases yet</p>
        <p className="text-sm text-muted-foreground mb-5">Start by raising your first purchase request.</p>
        <Button className="rounded-full" onClick={onRaiseFirstPurchase}>
          Raise Your First Purchase
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {purchases.map((purchase) => (
        <PurchaseCard key={purchase.id} purchase={purchase} onEdit={onEdit} />
      ))}
    </div>
  );
};

export default PurchaseList;
