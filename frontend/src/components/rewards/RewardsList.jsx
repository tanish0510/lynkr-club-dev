import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import RewardCard from "@/components/rewards/RewardCard";
import useIsMobile from "@/hooks/useIsMobile";

const RewardsList = ({ coupons, points, redeeming, loading, onSelect }) => {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {[1, 2, 3, 4, 5, 6].map((n) =>
          isMobile ? (
            <div key={n} className="rounded-xl border border-white/10 bg-card/80 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-12 rounded-lg" />
              </div>
            </div>
          ) : (
            <div key={n} className="rounded-3xl border border-white/5 p-6 bg-card">
              <Skeleton className="h-14 w-14 rounded-2xl mb-4" />
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-12 w-full rounded-full mt-5" />
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div data-testid="rewards-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
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
