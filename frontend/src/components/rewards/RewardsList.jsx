import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import RewardCard from "@/components/rewards/RewardCard";

const RewardsList = ({ coupons, points, redeeming, loading, onSelect }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="rounded-3xl border border-white/5 p-6 bg-card">
            <Skeleton className="h-14 w-14 rounded-2xl mb-4" />
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-12 w-full rounded-full mt-5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="rewards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {coupons.map((coupon, index) => (
        <RewardCard
          key={coupon.id}
          coupon={coupon}
          points={points}
          redeeming={redeeming}
          onSelect={onSelect}
          index={index}
        />
      ))}
    </div>
  );
};

export default RewardsList;
