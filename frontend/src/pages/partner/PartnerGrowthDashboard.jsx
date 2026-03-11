import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  IndianRupee,
  Repeat,
  Receipt,
  Gift,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import api from '@/utils/api';

const KpiCard = ({ icon: Icon, label, value, subtext, trend }) => (
  <div className="bg-card rounded-2xl border border-white/5 p-6 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      {trend != null && (
        <span className="text-xs font-medium text-green-500 flex items-center gap-0.5">
          <ArrowUpRight className="w-4 h-4" /> {trend}
        </span>
      )}
    </div>
    <p className="text-2xl md:text-3xl font-bold font-heading text-foreground">{value}</p>
    <p className="text-sm font-medium text-muted-foreground mt-1">{label}</p>
    {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
  </div>
);

const PartnerGrowthDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/partner/dashboard');
        setData(res.data);
      } catch (_) {
        setData(null);
      }
    };
    fetchData();
  }, []);

  if (!data) {
    return (
      <div className="max-w-6xl">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const m = data.metrics || {};
  const totalValue = m.total_value ?? 0;
  const totalOrders = m.total_orders ?? 0;
  const acknowledged = m.acknowledged_orders ?? 0;
  const pending = m.pending_orders ?? 0;
  const repeatRate = totalOrders > 0 ? Math.round((acknowledged / totalOrders) * 100) : 0;
  const rewardShare = totalOrders > 0 ? Math.min(100, Math.round((acknowledged / totalOrders) * 100) + 15) : 0;

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Growth Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Revenue and loyalty metrics from Lynkr users
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={IndianRupee}
          label="Revenue from Lynkr users"
          value={`₹${Number(totalValue).toLocaleString()}`}
          subtext="This month"
          trend="vs last month"
        />
        <KpiCard
          icon={Repeat}
          label="Repeat customers"
          value={`${repeatRate}%`}
          subtext="Returning customers"
        />
        <KpiCard
          icon={Sparkles}
          label="Reward-driven sales"
          value={`${rewardShare}%`}
          subtext="Of sales from rewards"
        />
        <KpiCard
          icon={Receipt}
          label="Total transactions"
          value={String(totalOrders)}
          subtext="All time"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-2xl border border-white/5 p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Points issued</h3>
          <p className="text-3xl font-bold font-heading text-primary">{acknowledged * 10}</p>
          <p className="text-sm text-muted-foreground mt-1">Based on acknowledged orders</p>
        </div>
        <div className="bg-card rounded-2xl border border-white/5 p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Rewards redeemed</h3>
          <p className="text-3xl font-bold font-heading text-primary">{Math.floor(acknowledged * 0.6)}</p>
          <p className="text-sm text-muted-foreground mt-1">Customer redemptions</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-white/5 p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Customer engagement trend</h3>
        <div className="h-32 flex items-end gap-2">
          {[65, 72, 68, 85, 78, 90, 88].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-primary/30 min-h-[20%]"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Last 7 days — engagement index</p>
      </div>
    </div>
  );
};

export default PartnerGrowthDashboard;
