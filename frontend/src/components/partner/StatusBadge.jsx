import React from 'react';
import { cn } from '@/lib/utils';

const presets = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  PILOT: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  ACKNOWLEDGED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  VERIFIED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/20',
  DISPUTED: 'bg-red-500/15 text-red-400 border-red-500/20',
  FLAGGED: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const StatusBadge = ({ status, className }) => (
  <span
    className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
      presets[status] || 'bg-muted/30 text-txt-secondary border-border',
      className
    )}
  >
    {status}
  </span>
);

export default StatusBadge;
