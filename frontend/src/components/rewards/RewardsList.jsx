import React from "react";
import RewardCard from "@/components/rewards/RewardCard";
import useIsMobile from "@/hooks/useIsMobile";

const RewardsList = ({ coupons, points, redeeming, loading, onSelect }) => {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-[140px] rounded-2xl border border-border bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div data-testid="rewards-grid" className={isMobile ? "space-y-3" : "grid grid-cols-1 lg:grid-cols-2 gap-4"}>
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
