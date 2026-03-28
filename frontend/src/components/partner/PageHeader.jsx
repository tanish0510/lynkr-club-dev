import React from 'react';
import { cn } from '@/lib/utils';

const PageHeader = ({ title, description, action, className }) => (
  <div className={cn('mb-6', className)}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">{title}</h1>
        {description && <p className="text-sm text-txt-secondary mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  </div>
);

export default PageHeader;
