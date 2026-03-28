import React from 'react';
import { cn } from '@/lib/utils';

const SuggestionChips = ({ suggestions, onSelect, className }) => (
  <div className={cn('flex gap-2 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory', className)}>
    {suggestions.map((s) => (
      <button
        key={typeof s === 'string' ? s : s.text}
        onClick={() => onSelect(typeof s === 'string' ? s : s.text)}
        className="shrink-0 snap-start px-3.5 py-2 rounded-full border border-border bg-muted/30 text-[12px] font-medium text-txt-secondary whitespace-nowrap transition-all hover:bg-muted hover:text-muted-foreground hover:border-border active:scale-[0.97]"
      >
        {typeof s === 'string' ? s : s.text}
      </button>
    ))}
  </div>
);

export default SuggestionChips;
