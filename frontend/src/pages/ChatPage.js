import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, Trash2, Sparkles, TrendingUp, Gift, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

const ChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await api.post('/chat', { message: inputMessage });
      setMessages(prev => [...prev, response.data]);
    } catch (error) {
      toast.error('Failed to get response from AI');
      // Remove the user message if failed
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Clear all chat history? This cannot be undone.')) return;
    try {
      await api.delete('/chat/history');
      setMessages([]);
      toast.success('Chat history cleared');
    } catch (error) {
      toast.error('Failed to clear history');
    }
  };

  const sendSuggestion = (suggestion) => {
    setInputMessage(suggestion);
  };

  const suggestions = [
    { icon: TrendingUp, text: "What's my spending pattern?", color: "text-blue-500" },
    { icon: Gift, text: "Which reward should I redeem?", color: "text-pink-500" },
    { icon: Sparkles, text: "Give me shopping tips", color: "text-purple-500" },
    { icon: HelpCircle, text: "Why is my purchase pending?", color: "text-yellow-500" }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              data-testid="back-to-dashboard-button"
              variant="ghost"
              onClick={() => navigate('/app/dashboard')}
              className="hover:bg-white/5 rounded-full"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-heading">Lynkr AI Assistant</h1>
              <p className="text-sm text-muted-foreground">Your personal shopping advisor</p>
            </div>
          </div>
          <Button
            data-testid="clear-chat-button"
            onClick={clearHistory}
            variant="ghost"
            className="hover:bg-white/5 rounded-full"
          >
            <Trash2 className="mr-2 w-4 h-4" />
            Clear History
          </Button>
        </div>
      </nav>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-5xl mx-auto w-full">
        {/* Messages */}
        <div data-testid="chat-messages" className="flex-1 overflow-y-auto px-6 py-8">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold font-heading mb-2">Hi {user.full_name || 'there'}! 👋</h2>
                <p className="text-xl text-muted-foreground mb-6">I'm your Lynkr AI assistant</p>
                <p className="text-muted-foreground max-w-md">
                  Ask me about your spending, rewards, shopping tips, or anything related to your Lynkr account!
                </p>
              </div>
              
              {/* Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    data-testid={`suggestion-${index}`}
                    onClick={() => sendSuggestion(suggestion.text)}
                    className="bg-card hover:bg-card/80 border border-white/5 rounded-2xl p-6 text-left transition-all hover:scale-105 active:scale-95"
                  >
                    <suggestion.icon className={`w-6 h-6 ${suggestion.color} mb-3`} />
                    <p className="text-sm font-medium">{suggestion.text}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  data-testid={`message-${msg.role}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-3xl px-6 py-4 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-white/5'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Lynkr AI</span>
                      </div>
                    )}
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs mt-2 opacity-60">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-white/5 rounded-3xl px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/5 bg-background/80 backdrop-blur-xl">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto p-6">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Input
                  data-testid="chat-input"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me anything about your shopping, rewards, or insights..."
                  disabled={loading}
                  className="bg-secondary/50 border-white/10 rounded-2xl h-14 px-6 text-base resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2 ml-2">Press Enter to send, Shift+Enter for new line</p>
              </div>
              <Button
                data-testid="send-button"
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-14 w-14 p-0 glow-primary"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;