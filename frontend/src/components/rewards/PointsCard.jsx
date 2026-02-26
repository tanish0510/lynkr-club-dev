import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const NEXT_REWARD_TARGET = 750;

const PointsCard = ({ points }) => {
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="relative inline-block min-w-[280px] rounded-3xl px-12 py-7 border border-white/10 shadow-2xl bg-card overflow-hidden"
    >
      <div className="pointer-events-none absolute -inset-8 opacity-25 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.22),transparent_60%)]" />
      <p className="text-base text-muted-foreground uppercase tracking-wider mb-2 relative">Your Points</p>
      <motion.p className="text-5xl md:text-6xl font-bold font-heading text-primary leading-none relative overflow-hidden">
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

      <div className="mt-4 relative">
        <div className="h-1.5 rounded-full bg-secondary/70 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
            className="h-full bg-primary/80"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {toNext > 0 ? `Next reward at ${NEXT_REWARD_TARGET} points • ${toNext} to go` : "You reached the next reward milestone"}
        </p>
      </div>
    </motion.div>
  );
};

export default PointsCard;
