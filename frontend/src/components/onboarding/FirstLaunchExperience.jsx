import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const splashLines = [
  'Turn every purchase into rewards.',
  'Shop smarter. Earn automatically.',
];

const slides = [
  {
    title: 'Use Your Lynkr Email',
    description: 'Shop using your Lynkr email. We detect purchases automatically.',
  },
  {
    title: 'Earn Points Instantly',
    description: 'Partners verify your orders. Points get credited automatically.',
  },
  {
    title: 'Redeem Real Rewards',
    description: 'Convert points into real coupons from top brands.',
  },
  {
    title: 'Powered by AI',
    description: 'Track spending. Discover better rewards. Get smart insights.',
  },
];

const IntroIllustration = ({ index }) => {
  const barCount = 3 + (index % 2);
  return (
    <div className="relative h-44 w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-secondary/60 to-background/60">
      <motion.div
        className="absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-primary/25 blur-2xl"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-x-6 bottom-6 flex items-end gap-2">
        {Array.from({ length: barCount }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-xl bg-primary/40"
            initial={{ height: 28 + i * 10 }}
            animate={{ height: [28 + i * 10, 44 + i * 8, 28 + i * 10] }}
            transition={{ duration: 2 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  );
};

const FirstLaunchExperience = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState('splash');
  const [lineIndex, setLineIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);

  const line = splashLines[lineIndex];

  useEffect(() => {
    if (stage !== 'splash') return undefined;

    const typeTimer = setInterval(() => {
      setCharCount((prev) => {
        if (prev >= line.length) return prev;
        return prev + 1;
      });
    }, 26);

    const lineSwapTimer = setTimeout(() => {
      if (lineIndex === 0) {
        setLineIndex(1);
        setCharCount(0);
      }
    }, 1400);

    const ctaTimer = setTimeout(() => {
      setStage('splash-cta');
    }, 2600);

    return () => {
      clearInterval(typeTimer);
      clearTimeout(lineSwapTimer);
      clearTimeout(ctaTimer);
    };
  }, [stage, line.length, lineIndex]);

  const finishIntro = () => {
    localStorage.setItem('hasSeenIntro', '1');
    navigate('/signup');
  };

  const goNextSlide = () => {
    if (slideIndex >= slides.length - 1) {
      finishIntro();
      return;
    }
    setSlideIndex((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-foreground px-4">
      <AnimatePresence mode="wait">
        {(stage === 'splash' || stage === 'splash-cta') && (
          <motion.section
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center text-center"
          >
            <motion.div
              className="relative mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
              <div className="relative rounded-full border border-white/10 bg-card/80 px-8 py-6 text-3xl font-heading font-bold tracking-tight">
                Lynkr
              </div>
            </motion.div>

            <p className="bg-gradient-to-r from-zinc-400 to-zinc-100 bg-clip-text text-transparent text-2xl md:text-4xl font-bold font-heading min-h-[4rem] md:min-h-[5rem]">
              {line.slice(0, charCount)}
            </p>

            {stage === 'splash-cta' ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
                <Button
                  className="mt-8 min-h-11 rounded-full px-10 py-6 text-lg font-bold glow-primary transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => setStage('slides')}
                >
                  Get Started
                </Button>
              </motion.div>
            ) : null}
          </motion.section>
        )}

        {stage === 'slides' && (
          <motion.section
            key="slides"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="mx-auto flex min-h-screen max-w-md flex-col py-8"
          >
            <div className="mb-6 flex items-center justify-end">
              <Button variant="ghost" className="min-h-11 rounded-full text-muted-foreground" onClick={finishIntro}>
                Skip
              </Button>
            </div>

            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28 }}
              className="flex-1 rounded-3xl border border-white/10 bg-card/80 p-5"
            >
              <IntroIllustration index={slideIndex} />
              <h2 className="mt-6 text-3xl font-heading font-bold">{slides[slideIndex].title}</h2>
              <p className="mt-3 text-muted-foreground">{slides[slideIndex].description}</p>
            </motion.div>

            <div className="mt-6 flex items-center justify-center gap-2">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 rounded-full transition-all ${i === slideIndex ? 'w-6 bg-primary' : 'w-2 bg-muted'}`}
                />
              ))}
            </div>

            <Button className="mt-5 min-h-11 rounded-full" onClick={goNextSlide}>
              {slideIndex === slides.length - 1 ? 'Continue' : 'Next'}
            </Button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FirstLaunchExperience;
