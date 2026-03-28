import React from 'react';
import formatAIResponse, { renderInlineBold } from '@/utils/formatAIResponse';

const InlineText = ({ text }) => {
  const parts = renderInlineBold(text);
  if (!Array.isArray(parts)) return <>{text}</>;
  return (
    <>
      {parts.map((p) =>
        p.type === 'bold'
          ? <strong key={p.key} className="font-semibold text-foreground">{p.text}</strong>
          : <React.Fragment key={p.key}>{p.text}</React.Fragment>
      )}
    </>
  );
};

const AIResponseFormatter = ({ content }) => {
  const blocks = formatAIResponse(content);

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <h3 key={i} className="text-[13px] font-bold font-heading text-foreground tracking-tight">
                <InlineText text={block.text} />
              </h3>
            );

          case 'numbered':
            return (
              <div key={i} className="space-y-2.5">
                {block.items.map((item, j) => (
                  <div key={j} className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary mt-0.5">
                      {item.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground leading-snug">
                        <InlineText text={item.title} />
                      </p>
                      {item.description && (
                        <p className="text-[12px] text-txt-secondary leading-relaxed mt-0.5">
                          <InlineText text={item.description} />
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );

          case 'bullet':
            return (
              <div key={i} className="space-y-1.5">
                {block.items.map((item, j) => (
                  <div key={j} className="flex gap-2.5 items-start">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary/50 mt-[7px]" />
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      <InlineText text={item} />
                    </p>
                  </div>
                ))}
              </div>
            );

          case 'paragraph':
          default:
            return (
              <p key={i} className="text-[13px] text-muted-foreground leading-[1.7]">
                <InlineText text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
};

export default AIResponseFormatter;
