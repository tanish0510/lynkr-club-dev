import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

const springKnob = { type: 'spring', stiffness: 300, damping: 24, mass: 0.8 };
const fadeGradient = { duration: 0.55, ease: [0.4, 0, 0.2, 1] };
const iconSwap = { type: 'spring', stiffness: 200, damping: 18 };

export default function ThemeToggle({ size = 'md' }) {
  const { isDark, toggleTheme } = useTheme();

  const sm = size === 'sm';
  const trackCls = sm ? 'w-14 h-7' : 'w-16 h-8';
  const knobSize = sm ? 20 : 24;
  const travelPx = sm ? 28 : 32;
  const iconCls = sm ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={`${trackCls} p-1 relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 overflow-hidden cursor-pointer`}
    >
      {/* Background gradients -- cross-fade */}
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 40%, #7dd3fc 100%)' }}
        animate={{ opacity: isDark ? 0 : 1 }}
        transition={fadeGradient}
      />
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: 'linear-gradient(135deg, #0c0921 0%, #1e1b4b 50%, #1e293b 100%)' }}
        animate={{ opacity: isDark ? 1 : 0 }}
        transition={fadeGradient}
      />

      {/* Stars */}
      <motion.span
        className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
        animate={{ opacity: isDark ? 1 : 0 }}
        transition={{ duration: 0.4, delay: isDark ? 0.25 : 0 }}
      >
        {[[6, 8, 2], [12, 16, 3], [5.5, 12, 2], [10, 24, 2.5]].map(([top, left, sz], i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{ top, left, width: sz, height: sz, opacity: 0.5 + i * 0.1, animationDelay: `${i * 0.4}s` }}
          />
        ))}
      </motion.span>

      {/* Clouds */}
      <motion.span
        className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
        animate={{ opacity: isDark ? 0 : 1 }}
        transition={{ duration: 0.4, delay: isDark ? 0 : 0.25 }}
      >
        <span className="absolute bottom-0.5 left-1.5 w-3 h-1.5 rounded-full bg-white/50" />
        <span className="absolute bottom-1 left-4 w-2 h-1 rounded-full bg-white/35" />
      </motion.span>

      {/* Knob */}
      <motion.span
        className="relative z-10 block rounded-full flex items-center justify-center"
        style={{ width: knobSize, height: knobSize }}
        animate={{
          x: isDark ? travelPx : 0,
          backgroundColor: isDark ? '#334155' : '#ffffff',
          boxShadow: isDark
            ? '0 1px 8px rgba(30,27,75,0.6), 0 0 0 1px rgba(99,102,241,0.12)'
            : '0 1px 8px rgba(250,204,21,0.3), 0 0 0 1px rgba(253,224,71,0.15)',
        }}
        transition={springKnob}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.svg
              key="moon"
              className={`${iconCls} absolute`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              initial={{ opacity: 0, rotate: -60, scale: 0.4 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 60, scale: 0.4 }}
              transition={iconSwap}
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" className="fill-yellow-200 stroke-yellow-300" />
            </motion.svg>
          ) : (
            <motion.svg
              key="sun"
              className={`${iconCls} absolute`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}
              initial={{ opacity: 0, rotate: 60, scale: 0.4 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -60, scale: 0.4 }}
              transition={iconSwap}
            >
              <circle cx="12" cy="12" r="5" className="fill-amber-400 stroke-amber-500" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <line key={deg} x1="12" y1="2" x2="12" y2="4" className="stroke-amber-400" strokeLinecap="round" transform={`rotate(${deg} 12 12)`} />
              ))}
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
