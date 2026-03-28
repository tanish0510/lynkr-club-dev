import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trophy, Gift } from "lucide-react";
import api from "@/utils/api";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import AppAvatar from "@/components/Avatar";
import LeaderboardItem from "@/components/LeaderboardItem";
import BrandLoader from "@/components/BrandLoader";

const CommunityPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const [leaderboardRes, redemptionRes] = await Promise.allSettled([
        api.get("/points/leaderboard"),
        api.get("/community/redemptions"),
      ]);

      if (leaderboardRes.status === "fulfilled") {
        setLeaderboard(leaderboardRes.value.data || []);
      }
      if (redemptionRes.status === "fulfilled") {
        setRedemptions(redemptionRes.value.data || []);
      }
    } catch (error) {
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <BrandLoader label="Loading community leaderboard..." />;
  }

  return (
    <PullToRefresh onRefresh={fetchLeaderboard} className="max-w-xl mx-auto px-5 pt-7 pb-12 sm:px-6">
      <header className="mb-6">
        <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Leaderboard</p>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-2.5">
          Community
          <Trophy className="h-5 w-5 text-amber-400" />
        </h1>
        <p className="text-xs text-txt-secondary font-medium mt-1">Compete, complete weekly challenges, and climb the leaderboard.</p>
      </header>

      {redemptions.length > 0 ? (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3.5">
            <Gift className="h-4 w-4 text-primary" />
            <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Recent Redemptions</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden divide-y divide-border">
            {(redemptions || []).slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <AppAvatar avatar={item.avatar} username={item.username} className="h-8 w-8 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{item.username}</p>
                    <p className="text-xs text-txt-secondary font-medium truncate">redeemed {item.coupon_title || "a reward"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] uppercase text-txt-muted font-bold">{item.partner_name || "Lynkr"}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary font-bold tabular-nums">
                    {item.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold mb-3.5">Top Earners</p>
        <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden">
          {leaderboard.length === 0 ? (
            <p className="text-txt-secondary text-sm text-center py-10">No leaderboard data yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {leaderboard.slice(0, 20).map((entry) => (
                <LeaderboardItem key={entry.user_id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PullToRefresh>
  );
};

export default CommunityPage;
