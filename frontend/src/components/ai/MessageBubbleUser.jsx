import React from 'react';

const formatTime = (ts) => {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const MessageBubbleUser = ({ content, timestamp, isFirst, isLast }) => (
  <div className="flex justify-end">
    <div className="max-w-[85%] sm:max-w-[72%]">
      <div
        className={`px-4 py-2.5 text-[14px] leading-[1.6] font-medium bg-primary text-primary-foreground ${
          isFirst && isLast ? 'rounded-2xl' :
          isFirst ? 'rounded-2xl rounded-br-lg' :
          isLast ? 'rounded-2xl rounded-tr-lg' :
          'rounded-xl rounded-r-lg'
        }`}
      >
        {content}
      </div>
      {isLast && timestamp && (
        <p className="text-[10px] text-txt-muted mt-1 text-right pr-1 font-medium">
          {formatTime(timestamp)}
        </p>
      )}
    </div>
  </div>
);

export default MessageBubbleUser;
