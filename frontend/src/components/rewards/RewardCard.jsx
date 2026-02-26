import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Loader2, CheckCircle2, Clock3, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const formatValueBadge = (coupon) => {
  if (coupon.value_type === "percentage") return `${coupon.value}% OFF`;
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

const RewardCard = ({ coupon, points, redeeming, onSelect, index }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const canRedeem = points >= coupon.points_cost && coupon.remaining_quantity > 0;
  const needMore = Math.max(0, coupon.points_cost - points);

  return (
    <motion.div
      data-testid={`reward-${coupon.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.24), duration: 0.22 }}
      whileHover={{ y: -3 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const py = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        setTilt({ x: px * 2, y: py * 2 });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{ transform: `perspective(900px) rotateX(${-tilt.y}deg) rotateY(${tilt.x}deg)` }}
      className={`bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-6 relative overflow-hidden transition-all duration-200 ${
        canRedeem ? "hover:border-white/10 hover:shadow-[0_18px_34px_rgba(0,0,0,0.3)]" : "opacity-75"
      } ${redeeming === coupon.id ? "brightness-90" : ""}`}
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

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <motion.div whileTap={{ scale: 0.985 }}>
                <Button
                  data-testid={`redeem-button-${coupon.id}`}
                  onClick={() => onSelect(coupon)}
                  disabled={!canRedeem || redeeming === coupon.id}
                  className={`w-full rounded-full py-6 font-bold relative overflow-hidden transition-all duration-200 ${
                    canRedeem
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_0_0_rgba(59,130,246,0.35)]"
                      : "bg-secondary text-secondary-foreground cursor-not-allowed"
                  }`}
                >
                  <motion.span
                    className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    whileHover={{ x: "340%" }}
                    transition={{ duration: 0.45 }}
                  />
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
                    `Need ${needMore} more points`
                  )}
                </Button>
              </motion.div>
            </div>
          </TooltipTrigger>
          {!canRedeem ? <TooltipContent>Earn {needMore} more points</TooltipContent> : null}
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
};

export default RewardCard;
