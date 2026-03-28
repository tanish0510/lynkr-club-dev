import React from 'react';
import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';

const colorConfig = {
  primary: {
    wrap: 'bg-blue-500/8 dark:bg-blue-500/10 border-blue-500/20',
    icon: 'bg-blue-500/15 text-blue-500 dark:text-blue-400',
    accent: 'text-blue-500 dark:text-blue-400',
  },
  teal: {
    wrap: 'bg-teal-500/8 dark:bg-teal-500/10 border-teal-500/20',
    icon: 'bg-teal-500/15 text-teal-500 dark:text-teal-400',
    accent: 'text-teal-500 dark:text-teal-400',
  },
  violet: {
    wrap: 'bg-violet-500/8 dark:bg-violet-500/10 border-violet-500/20',
    icon: 'bg-violet-500/15 text-violet-500 dark:text-violet-400',
    accent: 'text-violet-500 dark:text-violet-400',
  },
  amber: {
    wrap: 'bg-amber-500/8 dark:bg-amber-500/10 border-amber-500/20',
    icon: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
    accent: 'text-amber-500 dark:text-amber-400',
  },
};

const InsightCard = ({ icon: Icon = Lightbulb, title, description, action, actionLabel, color = 'primary', className }) => {
  const c = colorConfig[color] || colorConfig.primary;

  return (
    <div className={cn('rounded-2xl border p-4', c.wrap, className)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', c.icon)}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
          {action && (
            <button
              onClick={action}
              className={cn('mt-2 text-xs font-semibold inline-flex items-center gap-1 hover:underline', c.accent)}
            >
              {actionLabel || 'View details'} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
