import React from "react";
import AppAvatar from "@/components/Avatar";

const LeaderboardItem = ({ entry }) => {
  const topThree = entry.rank <= 3;
  return (
    <div className="bg-secondary/30 rounded-2xl p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`rounded-full p-0.5 ${topThree ? "border border-primary/60" : "border border-transparent"}`}>
          <AppAvatar avatar={entry.avatar} username={entry.username} className="h-10 w-10" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">
            #{entry.rank} {entry.username || entry.masked_username}
          </p>
          <p className="text-xs text-muted-foreground">
            Redeemed: {entry.coupons_redeemed} coupon{entry.coupons_redeemed === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold text-primary">{entry.points}</p>
        <p className="text-xs text-muted-foreground">points</p>
      </div>
    </div>
  );
};

export default LeaderboardItem;
