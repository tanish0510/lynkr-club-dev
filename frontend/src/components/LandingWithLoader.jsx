import React, { useEffect, useState } from 'react';
import BrandLoader from '@/components/BrandLoader';

/**
 * Wraps the marketing landing so we show the Lynkr loading animation first,
 * then transition to the actual landing (no welcome card on /).
 */
const LandingWithLoader = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return <BrandLoader label="Loading..." />;
  }

  return children;
};

export default LandingWithLoader;
