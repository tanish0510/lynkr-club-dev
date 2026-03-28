import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import api from '@/utils/api';

const POPUP_DURATION_MS = 6000;
const FETCH_INTERVAL_MS = 25000;
const SLIDE_DURATION_MS = 400;

function formatTimeAgo(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60) return 'just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  } catch {
    return '';
  }
}

function messageFromEntry(entry) {
  const name = (entry.name || 'Someone').trim().split(/\s+/)[0];
  const city = entry.city?.trim();
  const brands = (entry.favorite_brands || []).filter(Boolean).slice(0, 3);
  const timeStr = formatTimeAgo(entry.created_at);

  if (brands.length > 0) {
    const list = brands.join(', ');
    return { text: `${name}${city ? ` from ${city}` : ''} added ${list} to their interest list`, time: timeStr };
  }
  return { text: `${name}${city ? ` from ${city}` : ''} just joined the Lynkr waitlist`, time: timeStr };
}

export default function LiveInterestPopup({ className, onOpenWaitlist }) {
  const [entries, setEntries] = useState([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchRecent = useCallback(async () => {
    try {
      const { data } = await api.get('/waitlist/recent?limit=8');
      const list = data?.entries || [];
      setEntries(list);
      if (list.length > 0 && !mounted) setMounted(true);
    } catch {
      // Non-blocking; popup is optional
    }
  }, [mounted]);

  useEffect(() => {
    fetchRecent();
    const id = setInterval(fetchRecent, FETCH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchRecent]);

  useEffect(() => {
    if (entries.length === 0) return;
    setVisible(true);
  }, [entries.length]);

  useEffect(() => {
    if (entries.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % entries.length);
        setVisible(true);
      }, SLIDE_DURATION_MS);
    }, POPUP_DURATION_MS);
    return () => clearInterval(id);
  }, [entries.length]);

  if (entries.length === 0) return null;

  const entry = entries[index];
  const { text, time } = messageFromEntry(entry);

  const handleClick = () => {
    if (onOpenWaitlist) onOpenWaitlist();
    else document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-[360px] z-[100]',
        onOpenWaitlist ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none',
        'transition-all duration-300 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
      role={onOpenWaitlist ? 'button' : 'status'}
      aria-live="polite"
      onClick={onOpenWaitlist ? handleClick : undefined}
      onKeyDown={onOpenWaitlist ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } } : undefined}
      tabIndex={onOpenWaitlist ? 0 : undefined}
    >
      <div className="rounded-xl border border-white/15 bg-card/95 backdrop-blur-sm shadow-xl p-3 sm:p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-teal-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground leading-snug">{text}</p>
          {time && <p className="text-xs text-muted-foreground mt-1">{time}</p>}
        </div>
      </div>
    </div>
  );
}
