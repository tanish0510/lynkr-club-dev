import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import api from '@/utils/api';
import StatCard from '@/components/partner/StatCard';
import InsightCard from '@/components/partner/InsightCard';
import { PageSkeleton } from '@/components/partner/SkeletonPulse';

const PartnerCustomersPage = () => {
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
  const uniqueEmails = [...new Set(purchases.map(p => p.user_lynkr_email))];
  const totalCustomers = uniqueEmails.length;
  const repeaters = uniqueEmails.filter(email => purchases.filter(p => p.user_lynkr_email === email).length > 1);
  const repeatRate = totalCustomers > 0 ? Math.round((repeaters.length / totalCustomers) * 100) : 0;

  const topCustomers = uniqueEmails.map(email => {
    const customerPurchases = purchases.filter(p => p.user_lynkr_email === email);
    const totalSpend = customerPurchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return { email, orders: customerPurchases.length, spend: totalSpend };
  }).sort((a, b) => b.spend - a.spend).slice(0, 5);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">Customers</h1>
        <p className="text-sm text-txt-secondary mt-1">Understand your customers and drive retention.</p>
      </div>

      {/* Metrics */}
      <section className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0">
        <StatCard icon={Users} label="Total Customers" value={totalCustomers} color="primary" />
        <StatCard icon={TrendingUp} label="Repeat Rate" value={`${repeatRate}%`} color="green" />
        <StatCard icon={Sparkles} label="Points Issued" value={m.acknowledged_orders * 10} color="purple" />
        <StatCard icon={ShoppingBag} label="Avg Orders" value={totalCustomers > 0 ? (m.total_orders / totalCustomers).toFixed(1) : '0'} color="accent" />
      </section>

      {/* Top customers */}
      {topCustomers.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3">Top Customers</h2>
          <div className="space-y-2">
            {topCustomers.map((c, i) => (
              <div key={c.email} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-muted text-txt-secondary'
                }`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.email}</p>
                  <p className="text-[11px] text-txt-muted">{c.orders} order{c.orders > 1 ? 's' : ''}</p>
                </div>
                <p className="text-sm font-bold shrink-0">₹{c.spend.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Insights */}
      <section>
        <h2 className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-3">Customer Insights</h2>
        <div className="space-y-3">
          {repeaters.length > 0 && (
            <InsightCard
              icon={TrendingUp}
              title={`${repeaters.length} repeat customer${repeaters.length > 1 ? 's' : ''}`}
              description="These customers have placed multiple orders. Consider rewarding their loyalty."
              color="teal"
            />
          )}
          <InsightCard
            icon={Users}
            title="Grow your customer base"
            description="Share your catalog link on social media and WhatsApp to attract new customers."
            color="primary"
          />
        </div>
      </section>
    </div>
  );
};

export default PartnerCustomersPage;
