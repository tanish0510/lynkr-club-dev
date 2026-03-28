import React, { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const MAX_PULL = 72;
const TRIGGER_PULL = 56;

const PullToRefresh = ({ onRefresh, children, className = '' }) => {
  const startY = useRef(0);
  const pulling = useRef(false);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (event) => {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = event.touches[0].clientY;
    pulling.current = true;
  };

  const onTouchMove = (event) => {
    if (!pulling.current || refreshing) return;
    const currentY = event.touches[0].clientY;
    const delta = Math.max(0, currentY - startY.current);
    const next = Math.min(MAX_PULL, delta * 0.45);
    setOffset(next);
  };

  const onTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (offset >= TRIGGER_PULL && onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setOffset(0);
      }
      return;
    }
    setOffset(0);
  };

  return (
    <div
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="pointer-events-none flex items-center justify-center text-primary transition-all duration-200"
        style={{ height: `${offset}px`, opacity: offset > 12 || refreshing ? 1 : 0 }}
      >
        <Loader2 className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;
