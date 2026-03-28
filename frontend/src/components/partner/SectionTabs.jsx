import React from 'react';
import { cn } from '@/lib/utils';

const SectionTabs = ({ tabs, activeTab, onChange, className }) => (
  <div className={cn('flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory', className)}>
    {tabs.map((tab) => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap snap-start transition-all shrink-0',
          activeTab === tab.value
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-txt-secondary hover:text-muted-foreground hover:bg-muted'
        )}
      >
        {tab.label}
        {tab.count != null && (
          <span className={cn(
            'ml-1.5 text-[11px]',
            activeTab === tab.value ? 'text-primary-foreground/70' : 'text-txt-muted'
          )}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

export default SectionTabs;
