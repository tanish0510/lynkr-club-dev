import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const statusConfig = {
  PENDING: {
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    tooltip: 'Pending partner/admin verification',
  },
  VERIFIED: {
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    tooltip: 'Verified and points credited',
  },
  REJECTED: {
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
    tooltip: 'Verification rejected',
  },
};

const PurchaseCard = ({ purchase, onEdit }) => {
  const statusMeta = statusConfig[purchase.status] || statusConfig.PENDING;
  return (
    <div className="rounded-3xl border border-white/10 bg-card/80 p-5 shadow-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.25)] animate-in fade-in-0 slide-in-from-bottom-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">{purchase.partnerName || 'Partner'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {purchase.source === 'MANUAL' ? 'Manually raised purchase' : 'Auto-detected purchase'}
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`border ${statusMeta.badgeClass}`}>{purchase.status}</Badge>
            </TooltipTrigger>
            <TooltipContent>{statusMeta.tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mt-4 space-y-1 text-sm text-muted-foreground">
        <p>Order ID: <span className="text-foreground">{purchase.orderId || '-'}</span></p>
        {purchase.transactionId ? (
          <p>Transaction ID: <span className="text-foreground">{purchase.transactionId}</span></p>
        ) : null}
        <p>Date: <span className="text-foreground">{new Date(purchase.date).toLocaleString()}</span></p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-bold font-heading">₹{Number(purchase.amount || 0).toLocaleString()}</p>
          {purchase.status === 'VERIFIED' ? (
            <p className="text-xs text-emerald-300 mt-1">Points earned: +{purchase.pointsEarned}</p>
          ) : null}
        </div>

        {purchase.canEdit ? (
          <Button variant="outline" className="rounded-full" onClick={() => onEdit(purchase)}>
            Edit once
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default PurchaseCard;
