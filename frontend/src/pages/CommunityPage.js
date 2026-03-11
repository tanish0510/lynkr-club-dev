import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trophy, Gift } from "lucide-react";
import api from "@/utils/api";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import Logo from "@/components/Logo";
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
      <PullToRefresh onRefresh={fetchLeaderboard} className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <Logo className="h-9 w-28 mb-3 opacity-90" />
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 px-4 py-2 rounded-full mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Community</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-heading mb-2">Community Feed</h1>
          <p className="text-sm md:text-lg text-muted-foreground">Compete, complete weekly challenges, and climb the leaderboard.</p>
        </div>

        {redemptions.length > 0 ? (
          <section className="mb-5 rounded-3xl border border-white/10 bg-card/80 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Recent Redemptions</h2>
            </div>
            <div className="space-y-2">
              {(redemptions || []).slice(0, 5).map((item) => (
                <div key={item.id} className="text-xs rounded-xl border border-white/10 bg-background/60 p-2 text-muted-foreground flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <AppAvatar avatar={item.avatar} username={item.username} className="h-7 w-7" />
                    <p className="truncate">
                      <span className="text-foreground">{item.username}</span> redeemed {item.coupon_title || "a reward"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase text-primary">{item.partner_name || "Lynkr"}</span>
                    <span className="rounded-full border border-primary/30 px-2 py-0.5 text-[10px] text-primary">
                      {item.points} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Top Earners</h2>
          {leaderboard.length === 0 ? (
            <p className="text-muted-foreground text-center">No leaderboard data yet.</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.slice(0, 20).map((entry) => (
                <LeaderboardItem key={entry.user_id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>
  );
};

export default CommunityPage;
