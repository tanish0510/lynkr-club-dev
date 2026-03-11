import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Gift, Copy, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import useIsMobile from "@/hooks/useIsMobile";
import PointsCard from "@/components/rewards/PointsCard";
import RewardsList from "@/components/rewards/RewardsList";
import RedeemModal from "@/components/rewards/RedeemModal";
import PullToRefresh from "@/components/mobile/PullToRefresh";

const RewardsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [points, setPoints] = useState(0);
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
    } finally {
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
        className="max-w-6xl mx-auto px-4 sm:px-5 py-4 md:py-10 pb-24 md:pb-10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        {/* Header: compact on mobile */}
        <motion.header
          className="mb-4 md:mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/15 px-3 py-1.5 rounded-full mb-2 md:mb-3">
            <Gift className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-xs md:text-sm font-medium text-primary">Rewards</span>
          </div>
          <h1 className="text-2xl md:text-5xl font-bold font-heading mb-1 md:mb-2">Rewards</h1>
          <p className="text-xs md:text-lg text-muted-foreground mb-4 md:mb-5">
            Redeem your points for offers.
          </p>
          <div className={`flex flex-col gap-3 md:gap-4 ${isMobile ? "w-full" : "flex-row flex-wrap items-start"}`}>
            <div className={isMobile ? "w-full" : "inline-block"}>
              <PointsCard points={points} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto min-h-[44px] rounded-xl text-sm shrink-0"
              onClick={() => navigate("/app/community")}
            >
              View leaderboard
            </Button>
          </div>
        </motion.header>

        {/* Featured strip: horizontal scroll on mobile, optional on desktop */}
        {featuredRewards.length > 0 ? (
          <section className="rounded-2xl md:rounded-3xl border border-white/10 bg-card/60 p-3 md:p-4 mb-4 md:mb-5">
            <h2 className="text-sm md:text-lg font-semibold mb-3 px-0.5">Featured</h2>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 snap-x snap-mandatory -mx-0.5">
              {featuredRewards.map((reward) => (
                <article
                  key={reward.id}
                  className={`flex-shrink-0 snap-start rounded-xl md:rounded-2xl border border-white/10 bg-background/60 p-3 md:p-4 ${isMobile ? "w-[160px]" : "min-w-[200px]"}`}
                >
                  <p className="text-[11px] md:text-xs text-primary font-medium truncate">{reward.partner_name || "Partner"}</p>
                  <h3 className="mt-1 text-sm md:text-base font-medium line-clamp-2">{reward.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5">{reward.points_cost} pts</p>
                  <Button
                    className="w-full min-h-[44px] mt-2.5 rounded-xl text-xs"
                    size="sm"
                    onClick={() => setSelectedCoupon(reward)}
                    disabled={points < reward.points_cost}
                  >
                    Redeem
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* All rewards list */}
        <section className="mb-6 md:mb-8">
          <h2 className="text-base md:text-xl font-semibold mb-3 px-0.5">All rewards</h2>
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