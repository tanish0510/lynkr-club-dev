import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

const ActionCard = ({ icon: Icon, label, description, onClick, className }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex flex-col items-start gap-3 p-4 rounded-2xl border border-border',
      'bg-background dark:bg-white/[0.03] shadow-sm',
      'hover:border-primary/30 hover:shadow-md active:scale-[0.97] transition-all text-left w-full group',
      className
    )}
  >
    <div className="flex items-center justify-between w-full">
      <div className="w-10 h-10 rounded-xl bg-blue-500/12 dark:bg-blue-500/15 flex items-center justify-center">
        <Icon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
    </div>
    <div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
    </div>
  </button>
);

export default ActionCard;
