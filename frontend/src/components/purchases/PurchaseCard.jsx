import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, CircleCheckBig, Clock3 } from 'lucide-react';

const statusConfig = {
  PENDING: {
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Clock3,
  },
  VERIFIED: {
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: CircleCheckBig,
  },
  REJECTED: {
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
    icon: Clock3,
  },
};

const PurchaseCard = ({ purchase, onEdit }) => {
  const statusMeta = statusConfig[purchase.status] || statusConfig.PENDING;
  const StatusIcon = statusMeta.icon;

  return (
    <article className="rounded-3xl border border-white/10 bg-card/90 p-4 shadow-xl transition-all duration-200 active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-secondary/80 border border-white/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold">{purchase.partnerName || 'Partner'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {purchase.source === 'MANUAL' ? 'Manual raise' : 'Auto-detected'}
            </p>
          </div>
        </div>
        <Badge className={`border inline-flex items-center gap-1 ${statusMeta.badgeClass}`}>
          <StatusIcon className="h-3 w-3" />
          {purchase.status}
        </Badge>
      </div>

      <div className="mt-4 space-y-1 text-sm text-muted-foreground">
        <p>Order: <span className="text-foreground">{purchase.orderId || '-'}</span></p>
        {purchase.transactionId ? (
          <p>Txn: <span className="text-foreground">{purchase.transactionId}</span></p>
        ) : null}
        <p>Date: <span className="text-foreground">{new Date(purchase.date).toLocaleString()}</span></p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-bold font-heading">₹{Number(purchase.amount || 0).toFixed(0)}</p>
          {purchase.status === 'VERIFIED' ? (
            <p className="text-xs text-emerald-300 mt-1">Points earned: +{purchase.pointsEarned}</p>
          ) : null}
        </div>

        {purchase.canEdit ? (
          <Button variant="outline" className="rounded-full min-h-11" onClick={() => onEdit(purchase)}>
            Edit once
          </Button>
        ) : null}
      </div>
    </article>
  );
};

export default PurchaseCard;
