import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import LogoAnimated from '@/components/LogoAnimated';
import AnimatedHeadline from '@/components/onboarding/AnimatedHeadline';
const SplashScreen = ({ onGetStarted, onLogin }) => {
  const [showHeadline, setShowHeadline] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const headlineTimer = setTimeout(() => setShowHeadline(true), 1800);
    const subtextTimer = setTimeout(() => setShowSubtext(true), 2400);
    const ctaTimer = setTimeout(() => setShowCta(true), 2450);
    return () => {
      clearTimeout(headlineTimer);
      clearTimeout(subtextTimer);
      clearTimeout(ctaTimer);
    };
  }, []);

  return (
    <motion.section
      className="min-h-screen bg-[#0E0E0E] px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mx-auto flex min-h-screen max-w-[360px] flex-col items-center justify-center">
        <LogoAnimated className="w-[260px]" />

        <div className="mt-8 min-h-[80px]">
          {showHeadline ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <AnimatedHeadline />
            </motion.div>
          ) : null}
        </div>

        <div className="mt-3 min-h-[48px]">
          {showSubtext ? (
            <motion.p
              className="text-center text-sm md:text-base [color:#D1D7E0]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              We make sure you benefit from it.
            </motion.p>
          ) : null}
        </div>

        {showCta ? (
          <motion.div
            className="mt-10 flex w-full flex-col items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Button
              onClick={onGetStarted}
              className="min-h-11 w-full rounded-full px-10 bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(59,130,246,0.25)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_12px_34px_rgba(59,130,246,0.35)] active:scale-[0.97]"
            >
              Get Started
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 rounded-full px-6 [color:#C8CDD6] hover:bg-white/5 hover:[color:#E5E7EB]"
              onClick={() => onLogin?.()}
            >
              I already have an account
            </Button>
          </motion.div>
        ) : (
          <div className="mt-10 min-h-11" />
        )}
      </div>
    </motion.section>
  );
};

export default SplashScreen;
