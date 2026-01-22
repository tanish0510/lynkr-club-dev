import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

const AIChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen]);

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
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Clear all chat history?')) return;
    try {
      await api.delete('/chat/history');
      setMessages([]);
      toast.success('Chat history cleared');
    } catch (error) {
      toast.error('Failed to clear history');
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          data-testid="open-chat-button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:scale-110 transition-transform glow-primary"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div data-testid="chat-window" className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-card border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary/10 border-b border-white/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold font-heading">Lynkr AI</h3>
                <p className="text-xs text-muted-foreground">Your shopping assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                data-testid="clear-chat-button"
                onClick={clearHistory}
                variant="ghost"
                size="sm"
                className="hover:bg-white/10 rounded-full"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                data-testid="close-chat-button"
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="hover:bg-white/10 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Hi {user.full_name}!</p>
                <p className="text-sm text-muted-foreground">Ask me about your spending, rewards, or shopping tips!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  data-testid={`chat-message-${msg.role}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
            <div className="flex items-center gap-2">
              <Input
                data-testid="chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 bg-secondary/50 border-white/10 rounded-full h-12 px-4"
              />
              <Button
                data-testid="send-message-button"
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-12 h-12 p-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatbot;