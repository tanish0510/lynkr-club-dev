import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Gift, Loader2, CheckCircle2, Copy, Clock3, Boxes } from "lucide-react";
import api from "@/utils/api";

const formatValueBadge = (coupon) => {
  if (coupon.value_type === "percentage") {
    return `${coupon.value}% OFF`;
  }
  return `₹${coupon.value} OFF`;
};

const getExpiryText = (expiryDate) => {
  const expiry = new Date(expiryDate).getTime();
  const diffMs = expiry - Date.now();
  if (diffMs <= 0) return "Expired";
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
};

const RewardsPage = () => {
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

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
      toast.success(
        <div data-testid="redeem-success-message">
          <p className="font-bold mb-1">Coupon Redeemed!</p>
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
      toast.error(error.response?.data?.detail || "Redemption failed");
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Gift className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Button
          data-testid="back-to-dashboard-button"
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-8 hover:bg-white/5 rounded-full"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-12">
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

          <div
            data-testid="available-points-display"
            className="inline-block min-w-[260px] bg-card rounded-3xl px-12 py-7 border border-white/10 shadow-2xl"
          >
            <p className="text-base text-muted-foreground uppercase tracking-wider mb-2">Your Points</p>
            <p className="text-5xl md:text-6xl font-bold font-heading text-primary leading-none">{points}</p>
          </div>
        </div>

        <div data-testid="rewards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => {
            const canRedeem = points >= coupon.points_cost && coupon.remaining_quantity > 0;

            return (
              <div
                key={coupon.id}
                data-testid={`reward-${coupon.id}`}
                className={`bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6 relative overflow-hidden ${
                  canRedeem ? "hover:border-white/10" : "opacity-70"
                }`}
              >
                <div className="mb-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
                    <Gift className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold font-heading mb-1">{coupon.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{coupon.partner_name || "Partner Offer"}</p>
                  <span className="inline-flex bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-semibold mb-3">
                    {formatValueBadge(coupon)}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">{coupon.points_cost}</span>
                    <span className="text-muted-foreground">points</span>
                  </div>
                  {coupon.min_purchase ? (
                    <p className="text-xs text-muted-foreground mt-2">Min purchase ₹{coupon.min_purchase}</p>
                  ) : null}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="w-3 h-3" />
                      {getExpiryText(coupon.expiry_date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Boxes className="w-3 h-3" />
                      {coupon.remaining_quantity} left
                    </span>
                  </div>
                </div>

                <Button
                  data-testid={`redeem-button-${coupon.id}`}
                  onClick={() => setSelectedCoupon(coupon)}
                  disabled={!canRedeem || redeeming === coupon.id}
                  className={`w-full rounded-full py-6 font-bold ${
                    canRedeem
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                      : "bg-secondary text-secondary-foreground cursor-not-allowed"
                  }`}
                >
                  {redeeming === coupon.id ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Redeeming...
                    </>
                  ) : canRedeem ? (
                    <>
                      <CheckCircle2 className="mr-2 w-5 h-5" />
                      Redeem Now
                    </>
                  ) : (
                    `Need ${Math.max(0, coupon.points_cost - points)} more points`
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <section className="mt-12">
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

        {selectedCoupon ? (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card rounded-2xl border border-white/10 p-6">
              <h3 className="text-2xl font-bold mb-2">Confirm redemption</h3>
              <p className="text-muted-foreground mb-6">
                Redeem <strong>{selectedCoupon.title}</strong> for <strong>{selectedCoupon.points_cost} points</strong>?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedCoupon(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={redeeming === selectedCoupon.id}
                  onClick={() => handleRedeem(selectedCoupon)}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
};

export default RewardsPage;