import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Gift, Copy, ArrowRight, Ticket, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api, { resolveImageUrl } from "@/utils/api";
import PointsCard from "@/components/rewards/PointsCard";
import RewardsList from "@/components/rewards/RewardsList";
import RedeemModal from "@/components/rewards/RedeemModal";
import PullToRefresh from "@/components/mobile/PullToRefresh";

const RewardsPage = () => {
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);
  const [lockedPts, setLockedPts] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [confettiPulse, setConfettiPulse] = useState(false);

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const fetchRewardsData = async () => {
    try {
      const [dashboardRes, couponsRes] = await Promise.all([
        api.get("/user/dashboard"),
        api.get("/coupons"),
      ]);
      setPoints(dashboardRes.data.points || 0);
      setCoupons(couponsRes.data || []);
    } catch (error) {
      toast.error("Failed to load rewards");
    }
    try {
      const res = await api.get('/dynamic-coupons/unlock-status');
      setLockedPts(res.data?.locked_points ?? 0);
    } catch { /* */ }
    finally {
      setLoading(false);
    }
  };

  const copyCouponCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Coupon code copied");
    } catch (_) {
      toast.error("Failed to copy code");
    }
  };

  const handleRedeem = async (coupon) => {
    setRedeeming(coupon.id);
    try {
      const response = await api.post(`/coupons/${coupon.id}/redeem`);
      setConfettiPulse(true);
      setTimeout(() => setConfettiPulse(false), 1200);
      toast.success(
        <div data-testid="redeem-success-message">
          <p className="font-bold mb-1">Coupon unlocked 🎉</p>
          <p className="text-xs mb-1">Coupon ID: <strong>{response.data.coupon_id}</strong></p>
          <p className="text-sm mb-2">
            Code: <strong>{response.data.coupon_code}</strong>
          </p>
          <Button
            size="sm"
            className="h-7 rounded-full"
            onClick={() => copyCouponCode(response.data.coupon_code)}
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
        </div>,
        { duration: 7000 },
      );
      await fetchRewardsData();
      setSelectedCoupon(null);
    } catch (error) {
      if (String(error.response?.data?.detail || "").toLowerCase().includes("points")) {
        toast.error("Insufficient points");
      } else {
        toast.error(error.response?.data?.detail || "Redemption failed");
      }
    } finally {
      setRedeeming(null);
    }
  };

  const confettiDots = useMemo(
    () => Array.from({ length: 10 }, (_, i) => ({ id: i, left: 8 + i * 8 })),
    []
  );

  const featuredRewards = coupons.slice(0, 4);

  return (
    <PullToRefresh onRefresh={fetchRewardsData}>
      <motion.div
        className="max-w-3xl mx-auto px-5 pt-7 pb-12 sm:px-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <header className="mb-6">
          <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold">Your Rewards</p>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-heading font-bold text-foreground">Rewards</h1>
          <p className="text-xs text-txt-secondary font-medium mt-1 mb-5">
            Redeem your points for offers.
          </p>
          <div className="w-full mb-3">
            <PointsCard points={points} lockedPoints={lockedPts} />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto min-h-10 rounded-xl text-sm font-bold border-border"
            onClick={() => navigate("/app/community")}
          >
            View leaderboard
          </Button>
        </header>

        {/* Dynamic Coupons Teaser */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <button
            type="button"
            onClick={() => navigate("/app/dynamic-coupons")}
            className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4 text-left transition-all hover:bg-primary/10 active:scale-[0.98] touch-manipulation"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Dynamic Coupons</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Slide to unlock real gift cards from top brands</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </motion.section>

        {featuredRewards.length > 0 ? (
          <section className="mb-6">
            <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold mb-3.5">Featured</p>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 snap-x snap-mandatory -mx-5 px-5 sm:-mx-6 sm:px-6">
              {featuredRewards.map((reward) => (
                <article
                  key={reward.id}
                  className="flex-shrink-0 snap-start w-[170px] rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98] touch-manipulation"
                >
                  <div className="p-3.5 pb-2.5">
                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center border border-border/50 mb-2.5">
                      {reward.partner_logo ? (
                        <img src={resolveImageUrl(reward.partner_logo)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Gift className="h-4 w-4 text-primary/50" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{reward.title}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1 truncate">{reward.partner_name || "Partner"}</p>
                  </div>
                  <div className="border-t border-dashed border-border mx-2" />
                  <div className="p-3.5 pt-2.5 flex items-center justify-between">
                    <span className="text-xs text-primary font-bold tabular-nums">{reward.points_cost} pts</span>
                    <Button
                      className="h-8 px-3 rounded-full text-[11px] font-bold"
                      size="sm"
                      onClick={() => setSelectedCoupon(reward)}
                      disabled={points < reward.points_cost}
                    >
                      Redeem
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mb-6">
          <p className="text-[11px] text-txt-secondary uppercase tracking-[0.2em] font-bold mb-3.5">All Rewards</p>
          <RewardsList
            coupons={coupons}
            points={points}
            redeeming={redeeming}
            loading={loading}
            onSelect={(coupon) => setSelectedCoupon(coupon)}
          />
        </section>

        <RedeemModal
          open={Boolean(selectedCoupon)}
          coupon={selectedCoupon}
          redeeming={redeeming}
          onCancel={() => setSelectedCoupon(null)}
          onConfirm={() => handleRedeem(selectedCoupon)}
        />

        <AnimatePresence>
          {confettiPulse ? (
            <motion.div className="pointer-events-none fixed inset-0 z-[60]">
              {confettiDots.map((dot) => (
                <motion.span
                  key={dot.id}
                  className="absolute top-20 h-2 w-2 rounded-full bg-primary/70"
                  style={{ left: `${dot.left}%` }}
                  initial={{ opacity: 0, y: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 0], y: [0, -20 - dot.id * 2, -38 - dot.id * 2], scale: [0.8, 1, 0.7] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, delay: dot.id * 0.02 }}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </PullToRefresh>
  );
};

export default RewardsPage;