import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import api from "@/utils/api";
import DashboardLayout from "@/components/DashboardLayout";

const CommunityPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get("/points/leaderboard");
      setLeaderboard(response.data || []);
    } catch (error) {
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading community leaderboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 px-4 py-2 rounded-full mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Community</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold font-heading mb-4">Leaderboard</h1>
          <p className="text-xl text-muted-foreground">
            Top users by points with privacy-safe masked usernames
          </p>
        </div>

        <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
          {leaderboard.length === 0 ? (
            <p className="text-muted-foreground text-center">No leaderboard data yet.</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.slice(0, 20).map((entry) => (
                <div
                  key={entry.user_id}
                  className="bg-secondary/30 rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold">
                      #{entry.rank} {entry.masked_username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Redeemed: {entry.coupons_redeemed} coupon{entry.coupons_redeemed === 1 ? "" : "s"}
                    </p>
                    {entry.last_activity?.description ? (
                      <p className="text-xs text-muted-foreground">
                        Last: {entry.last_activity.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{entry.points}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CommunityPage;
