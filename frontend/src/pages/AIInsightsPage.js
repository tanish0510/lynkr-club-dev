import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Sparkles, Send, Bot, UserRound } from 'lucide-react';
import api from '@/utils/api';

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    fetchInsights();
    fetchHistory();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await api.get('/ai/insights');
      setInsights(response.data);
    } catch (error) {
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/chat/history');
      setMessages(response.data || []);
    } catch (_) {
      setMessages([]);
    }
  };

  const suggestionPrompts = useMemo(
    () => ['How can I earn more?', 'Best reward for me?', 'My spending pattern?'],
    []
  );

  const sendMessage = async (messageOverride) => {
    const message = (messageOverride || inputMessage).trim();
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
    try {
      const response = await api.post('/chat', { message });
      setMessages((prev) => [...prev, response.data]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    } catch (_) {
      toast.error('Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Analyzing your spending patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-10 text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold font-heading mb-2">AI Insights unavailable</h1>
            <p className="text-muted-foreground mb-6">Could not load insights right now. Try again.</p>
            <Button className="rounded-full min-h-11" onClick={fetchInsights}>Retry</Button>
          </div>
        </div>
    );
  }

  return (
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">AI Assistant</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-heading mb-2">AI Insights & Chat</h1>
          <p className="text-sm md:text-lg text-muted-foreground">Ask questions, get spending guidance, and optimize rewards.</p>
        </div>

        <section className="grid gap-3 md:grid-cols-3 mb-5">
          <article className="rounded-3xl border border-white/10 bg-card/80 p-4 md:col-span-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">This month</p>
            <p className="text-2xl font-heading font-bold mt-1">₹{(insights.spending_total || 0).toFixed(0)} spent</p>
            <p className="text-sm text-muted-foreground mt-2">{insights.monthly_trend}</p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-card/80 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Persona</p>
            <p className="text-lg font-semibold mt-1 text-primary">{insights.spending_persona}</p>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-card/80 p-4 mb-5">
          <h2 className="text-base font-semibold mb-3">Suggested prompts</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {suggestionPrompts.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                className="min-h-11 rounded-full whitespace-nowrap"
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-card/80 p-4">
          <div className="h-[50vh] min-h-[360px] overflow-y-auto rounded-2xl border border-white/10 bg-background/40 p-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <Bot className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Start chatting with Lynkr AI.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.slice(-25).map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/60 text-foreground'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-1 text-[10px] opacity-70">
                        {msg.role === 'user' ? <UserRound className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        <span>{msg.role === 'user' ? 'You' : 'Lynkr AI'}</span>
                      </div>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <Input
              value={inputMessage}
              onChange={(event) => setInputMessage(event.target.value)}
              placeholder="Ask Lynkr AI about rewards and spending..."
              className="h-12 rounded-xl"
            />
            <Button type="submit" className="min-h-11 rounded-xl px-4" disabled={sending || !inputMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2">
          <article data-testid="insights-card" className="rounded-3xl border border-white/10 bg-card/80 p-4">
            <h3 className="font-semibold mb-2">Key Insights</h3>
            <div className="space-y-2">
              {insights.insights?.slice(0, 4).map((insight, index) => (
                <p key={index} className="text-sm rounded-xl border border-white/10 bg-background/40 p-3">
                  {insight}
                </p>
              ))}
            </div>
          </article>
          <article data-testid="recommendations-card" className="rounded-3xl border border-white/10 bg-card/80 p-4">
            <h3 className="font-semibold mb-2">Recommendations</h3>
            <div className="space-y-2">
              {insights.recommendations?.slice(0, 4).map((rec, index) => (
                <p key={index} className="text-sm rounded-xl border border-white/10 bg-background/40 p-3">
                  {rec}
                </p>
              ))}
            </div>
          </article>
        </section>
      </div>
  );
};

export default AIInsights;