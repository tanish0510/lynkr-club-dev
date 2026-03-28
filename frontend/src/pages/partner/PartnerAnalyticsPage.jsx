import React, { useEffect, useState } from 'react';
import { BarChart3, IndianRupee, TrendingUp, ShoppingBag, Clock, Sparkles } from 'lucide-react';
import api from '@/utils/api';
import StatCard from '@/components/partner/StatCard';
import InsightCard from '@/components/partner/InsightCard';
import { PageSkeleton } from '@/components/partner/SkeletonPulse';

const PartnerAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, purchRes] = await Promise.all([
          api.get('/partner/dashboard'),
          api.get('/partner/purchases'),
        ]);
        setData(dashRes.data);
        setPurchases(purchRes.data || []);
      } catch (_) {}
    };
    load();
  }, []);

  if (!data) return <PageSkeleton />;

  const m = data.metrics || {};
  const totalValue = m.total_value ?? 0;
  const totalOrders = m.total_orders ?? 0;
  const acknowledged = m.acknowledged_orders ?? 0;
  const pending = m.pending_orders ?? 0;
  const avgOrder = totalOrders > 0 ? Math.round(totalValue / totalOrders) : 0;
  const verifyRate = totalOrders > 0 ? Math.round((acknowledged / totalOrders) * 100) : 0;

  const weekData = [0, 0, 0, 0, 0, 0, 0];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  purchases.forEach(p => {
    const day = new Date(p.created_at).getDay();
    const idx = day === 0 ? 6 : day - 1;
    weekData[idx] += Number(p.amount || 0);
  });
  const maxWeek = Math.max(...weekData, 1);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">Analytics</h1>
        <p className="text-sm text-txt-secondary mt-1">Data-driven insights and performance reports.</p>
      </div>

      {/* Stats */}
      <section className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0">
        <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${totalValue.toLocaleString()}`} color="primary" />
        <StatCard icon={ShoppingBag} label="Avg Order" value={`₹${avgOrder.toLocaleString()}`} color="green" />
        <StatCard icon={BarChart3} label="Verify Rate" value={`${verifyRate}%`} color="purple" />
        <StatCard icon={Clock} label="Pending" value={pending} color="yellow" />
      </section>

      {/* Revenue by day */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Revenue by Day</h3>
          <span className="text-[10px] text-txt-muted">This week</span>
        </div>
        <div className="h-32 flex items-end gap-2">
          {weekData.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[9px] text-txt-muted font-medium">
                {val > 0 ? `₹${(val / 1000).toFixed(1)}k` : ''}
              </span>
              <div
                className="w-full rounded-t-lg bg-primary/25 hover:bg-primary/40 transition-colors"
                style={{ height: `${Math.max(4, (val / maxWeek) * 100)}%` }}
              />
              <span className="text-[10px] text-txt-muted">{dayLabels[i]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Breakdown */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <p className="text-xs text-txt-secondary mb-2">Order Breakdown</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-txt-secondary">Acknowledged</span>
              <span className="font-semibold text-emerald-400">{acknowledged}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-txt-secondary">Pending</span>
              <span className="font-semibold text-amber-400">{pending}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="text-txt-secondary font-medium">Total</span>
              <span className="font-bold">{totalOrders}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <p className="text-xs text-txt-secondary mb-2">Performance</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-txt-secondary">Points Issued</span>
              <span className="font-semibold text-primary">{acknowledged * 10}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-txt-secondary">Est. Redemptions</span>
              <span className="font-semibold text-violet-400">{Math.floor(acknowledged * 0.6)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="text-txt-secondary font-medium">Redemption Rate</span>
              <span className="font-bold">~60%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Insights */}
      <InsightCard
        icon={Sparkles}
        title="Your data is building"
        description="As more orders come in, analytics will show trends, peak days, and customer segments. Keep growing your catalog and sharing your store."
        color="primary"
      />
    </div>
  );
};

export default PartnerAnalyticsPage;
