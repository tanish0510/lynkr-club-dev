import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const wordCycle = ['matters.', 'rewards.', 'grows.'];

const AnimatedHeadline = () => {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % wordCycle.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-bold font-heading leading-tight text-[#EDEDED]">
        Every purchase{' '}
        <AnimatePresence mode="wait">
          <motion.span
            key={wordCycle[wordIndex]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="inline-block"
          >
            {wordCycle[wordIndex]}
          </motion.span>
        </AnimatePresence>
      </p>
    </div>
  );
};

export default AnimatedHeadline;
