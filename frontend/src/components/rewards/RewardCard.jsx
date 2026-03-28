import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Loader2, CheckCircle2, Clock3, Copy, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import useIsMobile from "@/hooks/useIsMobile";
import { resolveImageUrl } from "@/utils/api";

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

const Notch = ({ side }) => (
  <div className={`absolute ${side === "left" ? "-left-3" : "-right-3"} top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background z-10`} />
);

const DashedDivider = () => (
  <div className="flex items-center gap-0.5 px-3 py-0">
    {Array.from({ length: 24 }).map((_, i) => (
      <span key={i} className="flex-1 h-px bg-border/60" />
    ))}
  </div>
);

const RewardCard = ({ coupon, points, redeeming, onSelect, index = 0 }) => {
  const isMobile = useIsMobile();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const canRedeem = points >= coupon.points_cost && coupon.remaining_quantity > 0;
  const needMore = Math.max(0, coupon.points_cost - points);
  const isExpired = new Date(coupon.expiry_date).getTime() <= Date.now();
  const logoUrl = coupon.partner_logo;

  if (isMobile) {
    return (
      <motion.div
        layout
        data-testid={`reward-${coupon.id}`}
        className="relative rounded-2xl border border-border overflow-hidden bg-card"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.2), duration: 0.2 }}
      >
        <Notch side="left" />
        <Notch side="right" />

        {/* Top: brand + offer */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="h-11 w-11 rounded-xl shrink-0 overflow-hidden bg-muted flex items-center justify-center border border-border/50">
            {logoUrl ? (
              <img src={resolveImageUrl(logoUrl)} alt="" className="h-full w-full object-cover" />
            ) : (
              <Gift className="h-5 w-5 text-primary/60" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate leading-tight">{coupon.title}</p>
            <p className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">{coupon.partner_name || "Partner Offer"}</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="inline-flex bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[11px] font-bold">
              {formatValueBadge(coupon)}
            </span>
          </div>
        </div>

        <DashedDivider />

        {/* Bottom: details + redeem */}
        <div className="px-4 pb-4 pt-2.5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="w-3 h-3" />
                {getExpiryText(coupon.expiry_date)}
              </span>
              <span>{coupon.remaining_quantity} left</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-primary tabular-nums">{coupon.points_cost}</span>
              <span className="text-[10px] text-muted-foreground font-medium">pts</span>
            </div>
          </div>

          {coupon.coupon_code && (
            <div className="flex items-center gap-2 mb-3 bg-muted/50 rounded-lg px-3 py-1.5 border border-dashed border-border">
              <Scissors className="w-3 h-3 text-muted-foreground shrink-0 rotate-180" />
              <span className="text-xs font-mono font-bold tracking-widest text-foreground flex-1">{coupon.coupon_code}</span>
            </div>
          )}

          <Button
            data-testid={`redeem-button-${coupon.id}`}
            onClick={() => onSelect(coupon)}
            disabled={!canRedeem || redeeming === coupon.id || isExpired}
            className="w-full min-h-10 rounded-xl font-bold text-sm"
          >
            {redeeming === coupon.id ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redeeming...</>
            ) : isExpired ? "Expired" : canRedeem ? (
              <><CheckCircle2 className="mr-2 w-4 h-4" />Redeem Now</>
            ) : `Need ${needMore} more pts`}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Desktop: ticket-style coupon card
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
      className={`relative rounded-2xl border border-border overflow-hidden transition-all duration-200 bg-card ${
        canRedeem ? "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5" : "opacity-75"
      } ${redeeming === coupon.id ? "brightness-90" : ""}`}
    >
      <Notch side="left" />
      <Notch side="right" />

      {/* Top section: brand identity */}
      <div className="flex items-start gap-4 p-5 pb-4">
        <div className="h-14 w-14 rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-muted border border-border/50">
          {logoUrl ? (
            <img src={resolveImageUrl(logoUrl)} alt="" className="h-full w-full object-cover" />
          ) : (
            <Gift className="w-6 h-6 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-bold font-heading leading-tight mb-0.5">{coupon.title}</h3>
              <p className="text-xs text-muted-foreground font-medium">{coupon.partner_name || "Partner Offer"}</p>
            </div>
            <span className="inline-flex bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0">
              {formatValueBadge(coupon)}
            </span>
          </div>
          {coupon.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{coupon.description}</p>
          )}
        </div>
      </div>

      <DashedDivider />

      {/* Bottom section: code, meta, redeem */}
      <div className="p-5 pt-3.5">
        <div className="flex items-center justify-between gap-4 mb-4">
          {coupon.coupon_code && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border border-dashed border-border flex-1 max-w-[220px]">
              <Scissors className="w-3.5 h-3.5 text-muted-foreground shrink-0 rotate-180" />
              <span className="text-sm font-mono font-bold tracking-widest text-foreground flex-1 truncate">{coupon.coupon_code}</span>
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium shrink-0">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="w-3 h-3" />
              {getExpiryText(coupon.expiry_date)}
            </span>
            <span>{coupon.remaining_quantity} left</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-primary tabular-nums">{coupon.points_cost}</span>
            <span className="text-xs text-muted-foreground font-medium">points</span>
          </div>
          {coupon.min_purchase ? (
            <p className="text-[11px] text-muted-foreground font-medium">Min. ₹{coupon.min_purchase}</p>
          ) : null}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <motion.div whileTap={{ scale: 0.985 }}>
                    <Button
                      data-testid={`redeem-button-${coupon.id}`}
                      onClick={() => onSelect(coupon)}
                      disabled={!canRedeem || redeeming === coupon.id || isExpired}
                      className="min-h-11 rounded-full px-8 font-bold"
                    >
                      {redeeming === coupon.id ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Redeeming...</>
                      ) : isExpired ? "Expired" : canRedeem ? (
                        <><CheckCircle2 className="mr-2 w-5 h-5" />Redeem Now</>
                      ) : `Need ${needMore} more pts`}
                    </Button>
                  </motion.div>
                </div>
              </TooltipTrigger>
              {!canRedeem && !isExpired ? <TooltipContent>Earn {needMore} more points</TooltipContent> : null}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
};

export default RewardCard;
