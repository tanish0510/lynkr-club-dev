/**
 * Parses raw AI response text into structured blocks for rich rendering.
 *
 * Returns an array of blocks:
 *   { type: 'heading', text }
 *   { type: 'numbered', items: [{ number, title, description }] }
 *   { type: 'bullet', items: [string] }
 *   { type: 'paragraph', text }
 */
export default function formatAIResponse(raw) {
  if (!raw || typeof raw !== 'string') return [{ type: 'paragraph', text: raw || '' }];

  const lines = raw.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) { i++; continue; }

    // Markdown-style heading (## or ###)
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      blocks.push({ type: 'heading', text: headingMatch[1].trim() });
      i++;
      continue;
    }

    // Bold-only line as heading (e.g. **Title**)
    const boldLine = line.match(/^\*\*(.+?)\*\*$/);
    if (boldLine && line === `**${boldLine[1]}**`) {
      blocks.push({ type: 'heading', text: boldLine[1].trim() });
      i++;
      continue;
    }

    // Numbered list: "1. Title" or "1) Title" optionally followed by description lines
    const numMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      const items = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        const nm = cur.match(/^(\d+)[.)]\s+(.+)/);
        if (!nm && items.length > 0 && cur && !cur.match(/^[-•*]\s/)) {
          // Description continuation for previous item
          const last = items[items.length - 1];
          const descLine = cur.replace(/^[→\-•]\s*/, '');
          last.description = last.description ? `${last.description} ${descLine}` : descLine;
          i++;
          continue;
        }
        if (!nm) break;

        // Split "Title: Description" or "Title - Description" patterns
        let title = nm[2];
        let desc = '';
        const colonSplit = title.match(/^(.+?)[:–—]\s+(.+)/);
        if (colonSplit) {
          title = colonSplit[1].replace(/\*\*/g, '');
          desc = colonSplit[2].replace(/\*\*/g, '');
        } else {
          title = title.replace(/\*\*/g, '');
        }

        items.push({ number: parseInt(nm[1], 10), title, description: desc });
        i++;
      }
      if (items.length > 0) {
        blocks.push({ type: 'numbered', items });
        continue;
      }
    }

    // Bullet list: "- item" or "• item" or "* item"
    const bulletMatch = line.match(/^[-•*]\s+(.+)/);
    if (bulletMatch) {
      const items = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        const bm = cur.match(/^[-•*]\s+(.+)/);
        if (!bm) break;
        items.push(bm[1].replace(/\*\*/g, ''));
        i++;
      }
      if (items.length > 0) {
        blocks.push({ type: 'bullet', items });
        continue;
      }
    }

    // Regular paragraph
    let para = line;
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next || next.match(/^#{1,3}\s/) || next.match(/^(\d+)[.)]\s/) || next.match(/^[-•*]\s/)) break;
      para += ' ' + next;
      i++;
    }
    blocks.push({ type: 'paragraph', text: para });
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'paragraph', text: raw });
  }

  return blocks;
}

/**
 * Renders inline bold (**text**) to an array of React nodes.
 */
export function renderInlineBold(text) {
  if (!text) return text;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return { type: 'bold', text: boldMatch[1], key: i };
    }
    return { type: 'text', text: part, key: i };
  });
}
