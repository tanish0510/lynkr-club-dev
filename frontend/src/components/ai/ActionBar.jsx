import React, { useState, useRef, useCallback } from 'react';
import { Copy, Volume2, VolumeX, Bookmark, Check } from 'lucide-react';
import { toast } from 'sonner';

const ActionBar = ({ content }) => {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [saved, setSaved] = useState(false);
  const utteranceRef = useRef(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, [content]);

  const handleListen = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech not supported');
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [content, speaking]);

  const handleSave = useCallback(() => {
    setSaved(true);
    toast.success('Response saved to insights');
    setTimeout(() => setSaved(false), 3000);
  }, []);

  const btnClass =
    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all hover:bg-muted active:scale-95';

  return (
    <div className="flex items-center gap-0.5 mt-3 pt-2.5 border-t border-border">
      <button onClick={handleCopy} className={`${btnClass} ${copied ? 'text-emerald-400' : 'text-txt-muted hover:text-txt-secondary'}`}>
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button onClick={handleListen} className={`${btnClass} ${speaking ? 'text-primary' : 'text-txt-muted hover:text-txt-secondary'}`}>
        {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        {speaking ? 'Stop' : 'Listen'}
      </button>
      <button onClick={handleSave} className={`${btnClass} ${saved ? 'text-amber-400' : 'text-txt-muted hover:text-txt-secondary'}`}>
        {saved ? <Check className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
        {saved ? 'Saved' : 'Save'}
      </button>
    </div>
  );
};

export default ActionBar;
