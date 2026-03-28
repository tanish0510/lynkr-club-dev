import React from 'react';
import { Button } from '@/components/ui/button';
import { CircleCheckBig, Clock3, IndianRupee, Store, Pencil } from 'lucide-react';
import { resolveImageUrl } from '@/utils/api';

const statusConfig = {
  PENDING: {
    label: 'Pending',
    cls: 'bg-amber-500/15 text-amber-400',
    border: 'border-l-amber-400/60',
    icon: Clock3,
  },
  VERIFIED: {
    label: 'Verified',
    cls: 'bg-emerald-500/15 text-emerald-400',
    border: 'border-l-emerald-400/60',
    icon: CircleCheckBig,
  },
  REJECTED: {
    label: 'Rejected',
    cls: 'bg-red-500/15 text-red-400',
    border: 'border-l-red-400/60',
    icon: Clock3,
  },
};

const PurchaseCard = ({ purchase, partner, onEdit }) => {
  const statusMeta = statusConfig[purchase.status] || statusConfig.PENDING;
  const StatusIcon = statusMeta.icon;
  const logo = partner?.logo;

  return (
    <article
      className={`rounded-2xl border border-border bg-card overflow-hidden shadow-card transition-all duration-200 active:scale-[0.99] touch-manipulation border-l-[3px] ${statusMeta.border}`}
    >
      <div className="p-4">
        {/* Top row: brand + status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
              {logo ? (
                <img src={resolveImageUrl(logo)} alt="" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-4 w-4 text-txt-secondary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-foreground truncate leading-snug">
                {purchase.partnerName || 'Partner'}
              </p>
              <p className="text-[11px] text-txt-muted font-medium mt-0.5">
                {purchase.date ? new Date(purchase.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                {purchase.orderId ? ` · #${purchase.orderId}` : ''}
              </p>
            </div>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta.cls}`}>
            <StatusIcon className="h-3 w-3" />
            {statusMeta.label}
          </span>
        </div>

        {/* Bottom row: amount + points + edit */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <p className="text-xl font-bold font-heading text-foreground tabular-nums flex items-center gap-0.5">
              <IndianRupee className="h-4 w-4" />
              {Number(purchase.amount || 0).toLocaleString('en-IN')}
            </p>
            {purchase.status === 'VERIFIED' && purchase.pointsEarned > 0 && (
              <span className="text-[11px] text-emerald-400 font-bold">+{purchase.pointsEarned} pts</span>
            )}
          </div>

          {purchase.canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl h-9 px-3 text-xs font-bold text-txt-secondary hover:text-foreground gap-1.5"
              onClick={() => onEdit(purchase)}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

export default PurchaseCard;
