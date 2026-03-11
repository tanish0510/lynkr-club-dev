import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import useIsMobile from "@/hooks/useIsMobile";

const NEXT_REWARD_TARGET = 750;

const PointsCard = ({ points }) => {
  const isMobile = useIsMobile();
  const [displayPoints, setDisplayPoints] = useState(points);
  const [shimmer, setShimmer] = useState(true);

  useEffect(() => {
    let raf;
    const start = displayPoints;
    const end = points;
    const duration = 420;
    const startAt = performance.now();

    const tick = (t) => {
      const p = Math.min(1, (t - startAt) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayPoints(Math.round(start + (end - start) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  useEffect(() => {
    const timer = setTimeout(() => setShimmer(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const progress = useMemo(() => Math.min(100, (points / NEXT_REWARD_TARGET) * 100), [points]);
  const toNext = Math.max(0, NEXT_REWARD_TARGET - points);

  return (
    <motion.div
      data-testid="available-points-display"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      whileHover={isMobile ? undefined : { y: -2, scale: 1.01 }}
      className={`relative rounded-2xl md:rounded-3xl border border-white/10 shadow-xl bg-card overflow-hidden ${
        isMobile
          ? "w-full px-4 py-4 md:px-8 md:py-6"
          : "inline-block min-w-[280px] px-8 py-6 md:px-12 md:py-7"
      }`}
    >
      <div className="pointer-events-none absolute -inset-6 md:-inset-8 opacity-20 md:opacity-25 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.22),transparent_60%)]" />
      <p className="text-xs md:text-base text-muted-foreground uppercase tracking-wider mb-1 md:mb-2 relative">Your Points</p>
      <motion.p className="text-3xl md:text-5xl lg:text-6xl font-bold font-heading text-primary leading-none relative overflow-hidden">
        {displayPoints}
        {shimmer ? (
          <motion.span
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: "-120%" }}
            animate={{ x: "130%" }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        ) : null}
      </motion.p>

      <div className="mt-3 md:mt-4 relative">
        <div className="h-2 md:h-1.5 rounded-full bg-secondary/70 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
            className="h-full bg-primary/80 rounded-full"
          />
        </div>
        <p className="text-[11px] md:text-xs text-muted-foreground mt-1.5 md:mt-2">
          {toNext > 0 ? `Next at ${NEXT_REWARD_TARGET} pts • ${toNext} to go` : "Milestone reached"}
        </p>
      </div>
    </motion.div>
  );
};

export default PointsCard;
