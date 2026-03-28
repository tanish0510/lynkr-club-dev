import React from 'react';
import { BarChart3, Inbox, LayoutDashboard, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Receipt, label: 'Transactions' },
  { icon: Inbox, label: 'Orders' },
  { icon: BarChart3, label: 'Analytics' },
];

const STATS = [
  { label: 'Pending', value: '12' },
  { label: 'Acknowledged', value: '248' },
  { label: 'Revenue', value: '₹42.8k' },
];

/**
 * Static mockup of the partner dashboard for the partner landing hero.
 * Mobile: vertical stack — horizontal nav strip on top, then stats + table.
 * Desktop: sidebar left + main content right.
 */
const PartnerDashboardPreview = ({ className }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card overflow-hidden shadow-xl',
        'max-w-4xl mx-auto w-full',
        className
      )}
    >
      {/* Mobile: vertical layout — nav strip then content */}
      <div className="flex flex-col min-h-[260px] sm:hidden">
        <div className="flex items-center gap-2 border-b border-border bg-surface-overlay/20 px-3 py-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/30 shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate">Partner</span>
          <nav className="flex flex-1 gap-1 min-w-0 justify-end overflow-x-auto hide-scrollbar">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground bg-muted shrink-0"
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-medium truncate max-w-[72px]">{item.label}</span>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex-1 min-w-0 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-foreground">Transactions</h3>
            <div className="h-6 w-20 rounded-lg bg-muted shrink-0" />
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-muted p-2 min-w-0">
                <p className="text-[9px] text-muted-foreground truncate">{stat.label}</p>
                <p className="text-xs font-semibold text-foreground truncate">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="flex-1 min-h-[100px] rounded-lg border border-border bg-muted overflow-hidden flex flex-col">
            <div className="flex border-b border-border shrink-0">
              <div className="flex-1 py-1.5 px-2 text-[9px] text-muted-foreground">Order</div>
              <div className="w-12 py-1.5 px-2 text-[9px] text-muted-foreground">Status</div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex border-b border-border last:border-0 min-h-0">
                <div className="flex-1 py-1.5 px-2 text-[10px] text-foreground/80 truncate min-w-0">user{i}@lynkr.club • #{1000 + i}</div>
                <div className="w-12 py-1.5 px-2 shrink-0">
                  <span className="inline-block px-1 py-0.5 rounded text-[9px] bg-violet-500/20 text-violet-400">New</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: horizontal layout — sidebar left, main right */}
      <div className="hidden sm:flex min-h-[280px] sm:min-h-[320px]">
        <div className="w-36 sm:w-40 flex-shrink-0 border-r border-border bg-surface-overlay/20 py-3 px-2">
          <div className="flex items-center gap-2 px-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-teal-500/30" />
            <span className="text-xs font-semibold text-foreground truncate">Partner</span>
          </div>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-2 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="text-xs truncate">{item.label}</span>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Transactions</h3>
            <div className="h-7 w-24 rounded-lg bg-muted" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-muted p-2 sm:p-3"
              >
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                <p className="text-sm sm:text-base font-semibold text-foreground truncate">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="flex-1 rounded-xl border border-border bg-muted overflow-hidden min-h-0">
            <div className="flex border-b border-border">
              <div className="flex-1 py-2 px-2 text-[10px] sm:text-xs text-muted-foreground">Order</div>
              <div className="w-16 py-2 px-2 text-[10px] sm:text-xs text-muted-foreground">Status</div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex border-b border-border last:border-0">
                <div className="flex-1 py-2 px-2 text-xs text-foreground/80 truncate">user{i}@lynkr.club • Order #{1000 + i}</div>
                <div className="w-16 py-2 px-2">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-violet-500/20 text-violet-400">New</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboardPreview;
