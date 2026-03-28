import React, { useState, useRef, useCallback } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

const InputBar = ({ value, onChange, onSend, disabled }) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  const startVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onChange(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, onChange]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !disabled) onSend();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask about spending, rewards, or goals..."
          disabled={disabled}
          className="w-full bg-muted border border-border rounded-2xl pl-4 pr-12 py-3 text-[14px] font-medium text-foreground placeholder:text-txt-placeholder placeholder:font-normal outline-none transition-colors focus:border-primary/30 focus:bg-muted disabled:opacity-40"
        />
        <button
          type="button"
          onClick={startVoice}
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            listening
              ? 'bg-red-500/15 text-red-400'
              : 'text-txt-muted hover:text-txt-secondary hover:bg-muted'
          }`}
        >
          {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 w-11 h-11 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-20 disabled:hover:bg-primary flex items-center justify-center transition-all active:scale-95"
      >
        <Send className="w-4.5 h-4.5 text-primary-foreground" />
      </button>
    </form>
  );
};

export default InputBar;
