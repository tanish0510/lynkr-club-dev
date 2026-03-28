import React from 'react';
import { cn } from '@/lib/utils';

const ListItem = ({ left, right, subtitle, meta, action, className }) => (
  <div
    className={cn(
      'flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border',
      'hover:bg-muted active:scale-[0.99] transition-all',
      className
    )}
  >
    {left && <div className="shrink-0">{left}</div>}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{subtitle}</p>
      {meta && <p className="text-[11px] text-txt-muted mt-0.5 truncate">{meta}</p>}
    </div>
    {right && <div className="shrink-0 text-right">{right}</div>}
    {action && <div className="shrink-0 ml-1">{action}</div>}
  </div>
);

export default ListItem;
