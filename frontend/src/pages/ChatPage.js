import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Trash2, Plus, Bot } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import MessageBubbleUser from '@/components/ai/MessageBubbleUser';
import MessageCardAI from '@/components/ai/MessageCardAI';
import SuggestionChips from '@/components/ai/SuggestionChips';
import InputBar from '@/components/ai/InputBar';

const SUGGESTIONS = [
  'How can I save more?',
  'Best rewards for me',
  'Track my spending',
  'Help me budget better',
  'What should I buy next?',
  'Analyze my purchases',
];

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/chat/history');
        setMessages(res.data || []);
      } catch {
        setMessages([]);
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loadingHistory) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
    }
  }, [loadingHistory]);

  const scrollToBottom = () => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  const sendMessage = async (text) => {
    const message = (text || inputMessage).trim();
    if (!message || sending) return;

    const optimistic = {
      id: String(Date.now()),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInputMessage('');
    setSending(true);
    scrollToBottom();

    try {
      const res = await api.post('/chat', { message });
      setMessages((prev) => [...prev, res.data]);
      scrollToBottom();
    } catch {
      toast.error('Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    try {
      await api.delete('/chat/history');
      setMessages([]);
      toast.success('Chat cleared');
    } catch {
      toast.error('Failed to clear chat');
    }
  };

  const isEmpty = messages.length === 0 && !loadingHistory;
  const firstName = user?.full_name?.split(' ')[0] || user?.username || 'there';

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem-5rem)] sm:h-[calc(100dvh-4rem)] max-w-2xl mx-auto w-full">
      {/* ── INLINE HEADER ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/12 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-[15px] font-heading font-bold">Lynkr AI</span>
        </div>

        <div className="flex items-center gap-0.5">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-txt-muted hover:text-txt-secondary hover:bg-muted transition-all"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setMessages([])}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-txt-muted hover:text-txt-secondary hover:bg-muted transition-all"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── CHAT AREA ── */}
      <div className="flex-1 overflow-y-auto">
        {loadingHistory ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-[12px] text-txt-muted">Loading conversation...</p>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/10 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-8 rounded-3xl opacity-30"
                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }}
              />
            </div>

            <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground mb-1 text-center">
              Hi {firstName}
            </h2>
            <p className="text-[13px] text-txt-muted text-center max-w-[280px] leading-relaxed mb-8">
              Your AI assistant for smarter spending & rewards.
            </p>

            <div className="w-full max-w-sm">
              <p className="text-[10px] uppercase tracking-wider text-txt-muted font-medium mb-2.5 pl-1">
                Try asking
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s)}
                    className="text-left rounded-xl border border-border bg-muted/30 px-3.5 py-3 text-[12px] font-medium text-txt-secondary leading-snug transition-all hover:bg-muted hover:border-primary/30 hover:text-muted-foreground active:scale-[0.98]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const showAvatar = idx === 0 || messages[idx - 1]?.role !== msg.role;
              const isLast = idx === messages.length - 1 || messages[idx + 1]?.role !== msg.role;

              if (isUser) {
                return (
                  <MessageBubbleUser
                    key={msg.id || idx}
                    content={msg.content}
                    timestamp={msg.timestamp}
                    isFirst={showAvatar}
                    isLast={isLast}
                  />
                );
              }

              return (
                <MessageCardAI
                  key={msg.id || idx}
                  content={msg.content}
                  timestamp={isLast ? msg.timestamp : null}
                  showAvatar={showAvatar}
                />
              );
            })}

            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[92%] sm:max-w-[82%]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-[11px] font-semibold text-txt-secondary">Lynkr AI</span>
                  </div>
                  <div className="rounded-2xl bg-card border border-border px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={endRef} className="h-1" />
          </div>
        )}
      </div>

      {/* ── BOTTOM INPUT ── */}
      <div className="shrink-0 border-t border-border">
        {messages.length > 0 && !sending && (
          <div className="px-4 pt-2.5">
            <SuggestionChips suggestions={SUGGESTIONS} onSelect={(text) => sendMessage(text)} />
          </div>
        )}
        <div className="px-4 py-3">
          <InputBar
            value={inputMessage}
            onChange={setInputMessage}
            onSend={() => sendMessage()}
            disabled={sending}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
