import React from 'react';
import { cn } from '@/lib/utils';

const colorConfig = {
  primary: {
    icon: 'bg-blue-500/15 text-blue-400 dark:bg-blue-500/15 dark:text-blue-400',
    value: 'text-blue-500 dark:text-blue-400',
  },
  green: {
    icon: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400',
    value: 'text-emerald-500 dark:text-emerald-400',
  },
  yellow: {
    icon: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
    value: 'text-amber-500 dark:text-amber-400',
  },
  red: {
    icon: 'bg-red-500/15 text-red-500 dark:text-red-400',
    value: 'text-red-500 dark:text-red-400',
  },
  purple: {
    icon: 'bg-violet-500/15 text-violet-500 dark:text-violet-400',
    value: 'text-violet-500 dark:text-violet-400',
  },
  accent: {
    icon: 'bg-teal-500/15 text-teal-500 dark:text-teal-400',
    value: 'text-teal-500 dark:text-teal-400',
  },
};

const StatCard = ({ icon: Icon, label, value, trend, trendLabel, color = 'primary', className }) => {
  const c = colorConfig[color] || colorConfig.primary;

  return (
    <div
      className={cn(
        'rounded-2xl border border-border p-4 min-w-[160px] snap-start shrink-0',
        'bg-background dark:bg-white/[0.03] shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend != null && (
          <span className="text-[11px] font-medium text-emerald-500 dark:text-emerald-400">{trend}</span>
        )}
      </div>
      <p className={cn('text-2xl font-bold font-heading', c.value)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {trendLabel && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{trendLabel}</p>}
    </div>
  );
};

export default StatCard;
