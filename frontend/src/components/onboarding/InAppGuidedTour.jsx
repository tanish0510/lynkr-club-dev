import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  { key: 'points', selector: '#tour-points-card', text: 'This is your rewards balance.' },
  { key: 'raise', selector: '#tour-raise-purchase', text: 'Submit purchases here to earn points.' },
  { key: 'rewards', selector: '#mobile-nav-rewards, #desktop-nav-rewards', text: 'Redeem your points here.' },
  { key: 'community', selector: '#mobile-nav-community, #desktop-nav-community', text: 'See top earners and challenges.' },
];

const InAppGuidedTour = () => {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);

  const currentStep = steps[stepIndex];

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('hasCompletedTour') === '1';
    if (!hasCompletedTour) {
      const timer = setTimeout(() => setActive(true), 450);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!active || !currentStep) return;

    const updateRect = () => {
      const element = document.querySelector(currentStep.selector);
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      setRect(bounds);
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [active, currentStep]);

  const tooltipStyle = useMemo(() => {
    if (!rect) return { left: 16, top: 140 };
    const top = Math.min(window.innerHeight - 180, rect.bottom + 10);
    const left = Math.min(window.innerWidth - 280, Math.max(16, rect.left));
    return { top, left };
  }, [rect]);

  const closeTour = () => {
    localStorage.setItem('hasCompletedTour', '1');
    setActive(false);
  };

  const nextStep = () => {
    if (stepIndex >= steps.length - 1) {
      closeTour();
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  if (!active) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-surface-overlay/70" />

        {rect ? (
          <div
            className="pointer-events-none absolute rounded-2xl border border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
            style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }}
          />
        ) : null}

        <div className="absolute w-[260px] rounded-2xl border border-border bg-card/95 p-4 shadow-2xl" style={tooltipStyle}>
          <p className="text-sm text-muted-foreground mb-3">{currentStep?.text}</p>
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" className="min-h-11 rounded-full" onClick={closeTour}>
              Skip Tour
            </Button>
            <Button className="min-h-11 rounded-full" onClick={nextStep}>
              {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InAppGuidedTour;
