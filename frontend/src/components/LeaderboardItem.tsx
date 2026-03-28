import React from "react";
import AppAvatar from "@/components/Avatar";

const LeaderboardItem = ({ entry }) => {
  const topThree = entry.rank <= 3;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`rounded-full p-0.5 shrink-0 ${topThree ? "ring-1 ring-primary/40" : ""}`}>
          <AppAvatar avatar={entry.avatar} username={entry.username} className="h-9 w-9" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            #{entry.rank} {entry.username || entry.masked_username}
          </p>
          <p className="text-xs text-txt-secondary font-medium">
            {entry.coupons_redeemed} coupon{entry.coupons_redeemed === 1 ? "" : "s"} redeemed
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-bold text-primary tabular-nums">{entry.points}</p>
        <p className="text-[11px] text-txt-muted font-medium">pts</p>
      </div>
    </div>
  );
};

export default LeaderboardItem;
