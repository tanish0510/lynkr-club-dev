import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Gift, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import DashboardLayout from "@/components/DashboardLayout";
import PointsCard from "@/components/rewards/PointsCard";
import RewardsList from "@/components/rewards/RewardsList";
import RedeemModal from "@/components/rewards/RedeemModal";

const RewardsPage = () => {
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [confettiPulse, setConfettiPulse] = useState(false);

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const fetchRewardsData = async () => {
    try {
      const [dashboardRes, couponsRes, redemptionsRes] = await Promise.all([
        api.get("/user/dashboard"),
        api.get("/coupons"),
        api.get("/coupons/redemptions"),
      ]);
      setPoints(dashboardRes.data.points || 0);
      setCoupons(couponsRes.data || []);
      setRedemptions(redemptionsRes.data || []);
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

  return (
    <DashboardLayout>
      <motion.div
        className="max-w-6xl mx-auto px-6 py-12"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
          <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full mb-4">
            <Gift className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Rewards</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold font-heading mb-4">Redeem Real Coupons</h1>
          <p className="text-xl text-muted-foreground mb-6">Live offers from Lynkr partners</p>
          <div className="flex justify-center mb-6">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => navigate("/community")}
            >
              View Community Leaderboard
            </Button>
          </div>

          <PointsCard points={points} />
        </motion.div>

        <RewardsList
          coupons={coupons}
          points={points}
          redeeming={redeeming}
          loading={loading}
          onSelect={(coupon) => setSelectedCoupon(coupon)}
        />

        <section className="mt-12 pt-8 border-t border-white/5">
          <div className="mb-4">
            <h2 className="text-3xl font-bold font-heading">My Rewards Activity</h2>
            <p className="text-sm text-muted-foreground">
              View your personal redemption timeline with coupon IDs and codes.
            </p>
          </div>
          <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
            <h3 className="text-2xl font-bold font-heading mb-4">My Redeemed History</h3>
            {redemptions.length === 0 ? (
              <p className="text-muted-foreground">No coupons redeemed yet.</p>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {redemptions.map((item) => (
                  <div key={item.id} className="bg-secondary/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.coupon_title || "Coupon"}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {item.coupon_id} {item.partner_name ? `• ${item.partner_name}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Redeemed: {new Date(item.redeemed_at).toLocaleString()} • -{item.points_deducted} points
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono bg-black/20 px-2 py-1 rounded">{item.coupon_code}</span>
                      <Button size="sm" variant="outline" onClick={() => copyCouponCode(item.coupon_code)}>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
    </DashboardLayout>
  );
};

export default RewardsPage;