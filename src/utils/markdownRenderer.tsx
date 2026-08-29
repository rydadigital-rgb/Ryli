import React from 'react';
import katex from 'katex';

interface MarkdownProps {
  content: string;
}

export const RichContentRenderer: React.FC<MarkdownProps> = ({ content }) => {
  if (!content) return null;

  // Split into code blocks, math blocks, and normal text
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeBuffer: string[] = [];
  let currentKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        const fullCode = codeBuffer.join('\n');
        renderedElements.push(
          <div key={`code-${currentKey++}`} className="my-4 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/90 shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800/80 text-xs text-zinc-400">
              <span className="font-mono uppercase text-zinc-300">{codeLanguage || 'code'}</span>
              <button
                id={`btn-copy-code-${currentKey}`}
                onClick={() => navigator.clipboard.writeText(fullCode)}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                title="Copy code"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 text-xs sm:text-sm font-mono overflow-x-auto text-emerald-400">
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
        codeLanguage = line.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Check for block math $$...$$
    if (line.startsWith('$$') && line.endsWith('$$') && line.length > 4) {
      const mathStr = line.slice(2, -2).trim();
      try {
        const mathHtml = katex.renderToString(mathStr, { displayMode: true, throwOnError: false });
        renderedElements.push(
          <div 
            key={`math-${currentKey++}`} 
            className="my-3 p-3 overflow-x-auto bg-zinc-900/60 rounded-xl border border-zinc-800/80 text-center"
            dangerouslySetInnerHTML={{ __html: mathHtml }} 
          />
        );
        continue;
      } catch {
        // fallback to standard line
      }
    }

    // Headings
    if (line.startsWith('### ')) {
      renderedElements.push(
        <h3 key={`h3-${currentKey++}`} className="text-base sm:text-lg font-bold text-zinc-100 mt-4 mb-1.5 flex items-center gap-2 font-display">
          {renderInlineFormatting(line.replace('### ', ''))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      renderedElements.push(
        <h2 key={`h2-${currentKey++}`} className="text-lg sm:text-xl font-bold text-white mt-5 mb-2 flex items-center gap-2 font-display border-b border-white/10 pb-1.5">
          {renderInlineFormatting(line.replace('## ', ''))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      renderedElements.push(
        <h1 key={`h1-${currentKey++}`} className="text-xl sm:text-2xl font-extrabold text-white mt-6 mb-2 font-display">
          {renderInlineFormatting(line.replace('# ', ''))}
        </h1>
      );
      continue;
    }

    // Bullet points
    if (line.match(/^[-*•]\s+/)) {
      renderedElements.push(
        <div key={`bullet-${currentKey++}`} className="flex items-start gap-2.5 my-1 ml-1 text-zinc-200">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
          <div className="leading-relaxed text-sm sm:text-base">
            {renderInlineFormatting(line.replace(/^[-*•]\s+/, ''))}
          </div>
        </div>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s+/)) {
      const match = line.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        renderedElements.push(
          <div key={`num-${currentKey++}`} className="flex items-start gap-2.5 my-1.5 ml-1 text-zinc-200">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 text-xs font-semibold shrink-0 mt-0.5">
              {match[1]}
            </span>
            <div className="leading-relaxed text-sm sm:text-base">
              {renderInlineFormatting(match[2])}
            </div>
          </div>
        );
        continue;
      }
    }

    // Callout / Blockquote
    if (line.startsWith('> ')) {
      renderedElements.push(
        <blockquote key={`quote-${currentKey++}`} className="my-2.5 pl-3.5 py-1 border-l-3 border-amber-400/80 bg-amber-500/10 rounded-r-lg text-amber-200 text-sm italic">
          {renderInlineFormatting(line.replace('> ', ''))}
        </blockquote>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      renderedElements.push(<div key={`space-${currentKey++}`} className="h-2" />);
      continue;
    }

    // Standard paragraph
    renderedElements.push(
      <p key={`p-${currentKey++}`} className="my-1.5 leading-relaxed text-sm sm:text-base text-zinc-200">
        {renderInlineFormatting(line)}
      </p>
    );
  }

  return <div className="space-y-1">{renderedElements}</div>;
};

// Helper for inline bold, inline code, inline math $...$, and links
function renderInlineFormatting(text: string): React.ReactNode[] {
  // Regex to match $math$, `code`, **bold**, *italic*
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Match inline math $...$
    const mathMatch = remaining.match(/\$([^$\n]+)\$/);
    // Match inline code `...`
    const codeMatch = remaining.match(/`([^`\n]+)`/);
    // Match bold **...**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

    // Find the earliest match
    const matches = [
      { type: 'math', match: mathMatch, index: mathMatch ? remaining.indexOf(mathMatch[0]) : -1 },
      { type: 'code', match: codeMatch, index: codeMatch ? remaining.indexOf(codeMatch[0]) : -1 },
      { type: 'bold', match: boldMatch, index: boldMatch ? remaining.indexOf(boldMatch[0]) : -1 },
    ].filter(m => m.index !== -1).sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0];
    // Add text before match
    if (first.index > 0) {
      parts.push(remaining.substring(0, first.index));
    }

    const fullMatchedStr = first.match![0];
    const innerContent = first.match![1];

    if (first.type === 'math') {
      try {
        const mathHtml = katex.renderToString(innerContent, { displayMode: false, throwOnError: false });
        parts.push(
          <span 
            key={`im-${keyIndex++}`}
            className="inline-block px-1 py-0.5 mx-0.5 rounded bg-zinc-800/60 text-emerald-300 font-serif text-sm align-middle"
            dangerouslySetInnerHTML={{ __html: mathHtml }}
          />
        );
      } catch {
        parts.push(<span key={`im-fallback-${keyIndex++}`} className="font-mono text-emerald-300">${innerContent}$</span>);
      }
    } else if (first.type === 'code') {
      parts.push(
        <code key={`ic-${keyIndex++}`} className="px-1.5 py-0.5 mx-0.5 rounded-md bg-zinc-800/80 text-amber-300 font-mono text-xs border border-zinc-700/50">
          {innerContent}
        </code>
      );
    } else if (first.type === 'bold') {
      parts.push(
        <strong key={`ib-${keyIndex++}`} className="font-semibold text-white">
          {innerContent}
        </strong>
      );
    }

    remaining = remaining.substring(first.index + fullMatchedStr.length);
  }

  return parts;
}
