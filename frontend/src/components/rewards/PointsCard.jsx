import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Sparkles, TrendingUp, Clock } from "lucide-react";

const MILESTONES = [100, 250, 500, 1000, 2000, 5000, 10000, 25000, 50000];

const PointsCard = ({ points, lockedPoints = 0 }) => {
  const { isDark } = useTheme();
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

  const nextTarget = useMemo(() => MILESTONES.find(m => m > points) ?? MILESTONES[MILESTONES.length - 1], [points]);
  const prevTarget = useMemo(() => {
    const idx = MILESTONES.indexOf(nextTarget);
    return idx > 0 ? MILESTONES[idx - 1] : 0;
  }, [nextTarget]);
  const progress = useMemo(() => {
    const range = nextTarget - prevTarget;
    return range > 0 ? Math.min(100, ((points - prevTarget) / range) * 100) : 100;
  }, [points, nextTarget, prevTarget]);
  const toNext = Math.max(0, nextTarget - points);

  return (
    <motion.div
      data-testid="available-points-display"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative w-full rounded-2xl overflow-hidden"
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e293b 100%)'
            : 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 35%, #c7d2fe 65%, #dbeafe 100%)',
        }}
      />

      {/* Mesh overlay for depth */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.1) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.06) 0%, transparent 50%)',
        }}
      />

      {/* Subtle border via inset shadow */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-700"
        style={{
          boxShadow: isDark
            ? 'inset 0 0 0 1px rgba(148,163,184,0.1), 0 4px 24px -4px rgba(0,0,0,0.4)'
            : 'inset 0 0 0 1px rgba(99,102,241,0.12), 0 4px 24px -4px rgba(99,102,241,0.08)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-5 py-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-500/10'}`}>
              <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <p className={`text-[11px] uppercase tracking-[0.18em] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Your Points
            </p>
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'}`}>
            <TrendingUp className="w-2.5 h-2.5" />
            Active
          </div>
        </div>

        {/* Points value */}
        <motion.p className={`text-4xl sm:text-5xl font-bold font-heading leading-none overflow-hidden tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {displayPoints.toLocaleString()}
          {shimmer && (
            <motion.span
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: "-120%" }}
              animate={{ x: "130%" }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          )}
        </motion.p>

        <p className={`text-xs font-medium mt-1 ${isDark ? 'text-indigo-300/70' : 'text-indigo-600/60'}`}>
          pts
        </p>

        {lockedPoints > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {(points - lockedPoints).toLocaleString('en-IN')} available
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
              <Clock className="w-3 h-3" />
              {lockedPoints.toLocaleString('en-IN')} in review
            </span>
          </div>
        )}

        {/* Progress section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Next milestone
            </p>
            <p className={`text-[11px] font-bold tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {points.toLocaleString('en-IN')} / {nextTarget.toLocaleString('en-IN')}
            </p>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-indigo-100'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: isDark
                  ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                  : 'linear-gradient(90deg, #4f46e5, #6366f1)',
              }}
            />
          </div>
          <p className={`text-[11px] font-medium mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {toNext > 0 ? `${toNext.toLocaleString('en-IN')} points to next milestone` : "Milestone reached! 🎉"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PointsCard;
