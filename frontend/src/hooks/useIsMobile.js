import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    const onChange = (event) => setIsMobile(event.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return isMobile;
};

export default useIsMobile;
