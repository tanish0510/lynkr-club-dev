import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import SplashScreen from '@/components/onboarding/SplashScreen';
import { Bot, Gift, Mail, Sparkles } from 'lucide-react';

const slides = [
  {
    title: 'Use Your Lynkr Email',
    description: 'Shop using your Lynkr email. We detect purchases automatically.',
    icon: Mail,
    chip: 'Auto detect',
    glow: 'from-zinc-300/10',
  },
  {
    title: 'Earn Points Instantly',
    description: 'Partners verify your orders. Points get credited automatically.',
    icon: Sparkles,
    chip: 'Real-time points',
    glow: 'from-zinc-300/10',
  },
  {
    title: 'Redeem Real Rewards',
    description: 'Convert points into real coupons from top brands.',
    icon: Gift,
    chip: 'Top offers',
    glow: 'from-zinc-300/10',
  },
  {
    title: 'Powered by AI',
    description: 'Track spending. Discover better rewards. Get smart insights.',
    icon: Bot,
    chip: 'Personal insights',
    glow: 'from-zinc-300/10',
  },
];

const WelcomeLayout = ({ onComplete, onLogin }) => {
  const [stage, setStage] = useState('splash');
  const [slideIndex, setSlideIndex] = useState(0);

  const complete = () => {
    localStorage.setItem('hasSeenWelcome', '1');
    localStorage.setItem('hasSeenIntro', '1');
    onComplete();
  };

  if (stage === 'splash') {
    return <SplashScreen onGetStarted={() => setStage('slides')} onLogin={onLogin} />;
  }

  return (
    <section className="min-h-screen bg-[#0E0E0E] px-4 py-8" style={{ color: '#FFFFFF' }}>
      <style>{`.welcome-slide-icon svg,
.welcome-slide-icon path { stroke: #FFFFFF !important; color: #FFFFFF !important; }
.welcome-slide-icon svg { fill: none !important; }`}</style>
      <div className="mx-auto flex min-h-screen max-w-[360px] flex-col">
        <div className="mb-6 flex justify-end">
          <Button
            variant="ghost"
            className="min-h-11 rounded-full hover:bg-white/5"
            style={{ color: '#FFFFFF' }}
            onClick={complete}
          >
            Skip
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.article
            key={slideIndex}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="flex flex-1 flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-[#1A1D24] to-[#101319] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
            style={{ color: '#FFFFFF' }}
          >
            <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#20242D] to-[#131722]">
              <motion.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(237,237,237,0.16),transparent_60%)]"
                animate={{ x: [0, 8, 0], y: [0, -6, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className={`absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t ${slides[slideIndex].glow} to-transparent`} />
              {/* Soft orbiting ring */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={false}
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              >
                <div className="h-32 w-32 rounded-full border border-white/[0.06]" />
              </motion.div>
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={false}
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              >
                <div className="h-40 w-40 rounded-full border border-white/[0.04]" />
              </motion.div>
              <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                <motion.div
                  className="welcome-slide-icon flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-[#0F1218]/90 shadow-[0_0_20px_rgba(255,255,255,0.04)] backdrop-blur"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.95, 1, 0.95] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {React.createElement(slides[slideIndex].icon, {
                    className: 'h-7 w-7 shrink-0',
                    strokeWidth: 2.2,
                    'aria-hidden': false,
                  })}
                </motion.div>
                <span className="rounded-full border border-white/10 bg-[#0D1016]/90 px-3 py-1 text-xs font-medium" style={{ color: '#FFFFFF' }}>
                  {slides[slideIndex].chip}
                </span>
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-heading font-bold text-balance" style={{ color: '#FFFFFF' }}>
              {slides[slideIndex].title}
            </h2>
            <p className="mt-3 leading-relaxed" style={{ color: '#FFFFFF' }}>
              {slides[slideIndex].description}
            </p>
          </motion.article>
        </AnimatePresence>

        <div className="mt-6 flex justify-center gap-2">
          {slides.map((_, i) => (
            <span key={i} className={`h-2 rounded-full ${i === slideIndex ? 'w-6 bg-primary' : 'w-2 bg-white/20'}`} />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-full border-white/15 bg-white/5 hover:bg-white/10"
            style={{ color: '#FFFFFF' }}
            onClick={() => onLogin?.()}
          >
            Login
          </Button>
          <Button
            className="min-h-11 rounded-full"
            onClick={() => {
              if (slideIndex >= slides.length - 1) {
                complete();
                return;
              }
              setSlideIndex((prev) => prev + 1);
            }}
          >
            {slideIndex >= slides.length - 1 ? 'Continue' : 'Next'}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default WelcomeLayout;
