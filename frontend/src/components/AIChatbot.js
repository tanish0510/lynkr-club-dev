import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { X, Send, Trash2, Bot, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import AIResponseFormatter from '@/components/ai/AIResponseFormatter';

const AIChatbot = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) loadChatHistory();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const loadChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.get('/chat/history');
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load chat history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    const msg = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      const response = await api.post('/chat', { message: msg });
      setMessages((prev) => [...prev, response.data]);
    } catch (error) {
      toast.error('Failed to get response from AI');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await api.delete('/chat/history');
      setMessages([]);
      toast.success('Chat history cleared');
    } catch (error) {
      toast.error('Failed to clear history');
    }
  };

  if (!user) return null;
  if (location.pathname.startsWith('/app/ai') || location.pathname.startsWith('/app/chat')) return null;

  const hasPageFab = location.pathname === '/app/purchases';
  const btnBottom = hasPageFab
    ? 'bottom-[calc(9rem+env(safe-area-inset-bottom))] lg:bottom-24'
    : 'bottom-24 lg:bottom-6';

  return (
    <>
      {/* Floating AI button */}
      {!isOpen && (
        <button
          data-testid="open-chat-button"
          onClick={() => setIsOpen(true)}
          className={`fixed ${btnBottom} right-4 lg:right-6 z-40 w-11 h-11 rounded-full bg-primary/90 text-primary-foreground shadow-lg shadow-primary/15 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform backdrop-blur-sm`}
        >
          <Sparkles className="w-[18px] h-[18px]" />
        </button>
      )}

      {/* Compact chat popup */}
      {isOpen && (
        <div
          data-testid="chat-window"
          className={`fixed ${btnBottom} right-4 lg:right-6 z-40 w-[calc(100vw-2rem)] max-w-[320px] h-[52vh] max-h-[400px] bg-surface-raised border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/12 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[12px] font-heading font-bold">Lynkr AI</span>
            </div>
            <div className="flex items-center gap-0.5">
              {messages.length > 0 && (
                <button
                  data-testid="clear-chat-button"
                  onClick={clearHistory}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-txt-muted hover:text-txt-secondary hover:bg-muted transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <button
                data-testid="close-chat-button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-txt-muted hover:text-txt-secondary hover:bg-muted transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-2">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-3">
                <div className="w-9 h-9 rounded-lg bg-primary/8 border border-primary/10 flex items-center justify-center mb-2.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <p className="text-[12px] font-medium text-foreground mb-0.5">Hi {user.full_name?.split(' ')[0] || 'there'}</p>
                <p className="text-[10px] text-txt-muted max-w-[180px]">Ask about spending, rewards, or tips</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} data-testid={`chat-message-${msg.role}`}>
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-xl rounded-br-sm px-3 py-2 bg-primary text-primary-foreground text-[12px] leading-[1.5] font-medium">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="max-w-[88%]">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center">
                            <Bot className="w-2 h-2 text-primary" />
                          </div>
                          <span className="text-[9px] font-semibold text-txt-muted">AI</span>
                        </div>
                        <div className="rounded-xl rounded-tl-sm bg-card border border-border px-3 py-2">
                          <div className="text-[12px] leading-[1.5]">
                            <AIResponseFormatter content={msg.content} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-card border border-border px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="border-t border-border px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                data-testid="chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask anything..."
                disabled={loading}
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-[12px] font-medium text-foreground placeholder:text-txt-placeholder outline-none transition-colors focus:border-primary/30 disabled:opacity-40"
              />
              <button
                data-testid="send-message-button"
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="shrink-0 w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-20 flex items-center justify-center transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5 text-primary-foreground" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
