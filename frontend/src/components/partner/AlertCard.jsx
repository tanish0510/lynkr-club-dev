import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

const variantStyles = {
  warning: {
    wrap: 'bg-amber-500/8 dark:bg-amber-500/10 border-amber-500/20',
    icon: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
    btn: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  urgent: {
    wrap: 'bg-red-500/8 dark:bg-red-500/10 border-red-500/20',
    icon: 'bg-red-500/15 text-red-500 dark:text-red-400',
    btn: 'bg-red-500 hover:bg-red-600 text-white',
  },
  info: {
    wrap: 'bg-blue-500/8 dark:bg-blue-500/10 border-blue-500/20',
    icon: 'bg-blue-500/15 text-blue-500 dark:text-blue-400',
    btn: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  success: {
    wrap: 'bg-emerald-500/8 dark:bg-emerald-500/10 border-emerald-500/20',
    icon: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400',
    btn: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  },
};

const AlertCard = ({ icon: Icon = AlertTriangle, title, description, action, actionLabel, variant = 'warning', className }) => {
  const v = variantStyles[variant] || variantStyles.warning;

  return (
    <div className={cn('rounded-2xl border p-4', v.wrap, className)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', v.icon)}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          {action && (
            <button
              onClick={action}
              className={cn('mt-2.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors', v.btn)}
            >
              {actionLabel || 'Take action'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
