import React from 'react';
import { Bot } from 'lucide-react';
import AIResponseFormatter from './AIResponseFormatter';
import ActionBar from './ActionBar';

const formatTime = (ts) => {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const MessageCardAI = ({ content, timestamp, showAvatar }) => (
  <div className="flex justify-start">
    <div className="max-w-[92%] sm:max-w-[82%]">
      {showAvatar && (
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
            <Bot className="w-3 h-3 text-primary" />
          </div>
          <span className="text-[11px] font-semibold text-txt-secondary">Lynkr AI</span>
        </div>
      )}
      <div className="rounded-2xl bg-card border border-border px-4 py-4 sm:px-5">
        <AIResponseFormatter content={content} />
        <ActionBar content={content} />
      </div>
      {timestamp && (
        <p className="text-[10px] text-txt-muted mt-1.5 pl-1 font-medium">
          {formatTime(timestamp)}
        </p>
      )}
    </div>
  </div>
);

export default MessageCardAI;
