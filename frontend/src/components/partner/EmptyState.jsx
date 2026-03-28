import React from 'react';
import { cn } from '@/lib/utils';

const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-txt-muted" />
      </div>
    )}
    <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
    {description && <p className="text-sm text-txt-secondary max-w-xs">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
