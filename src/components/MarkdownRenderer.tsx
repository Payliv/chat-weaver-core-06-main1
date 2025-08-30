import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const formatMarkdown = (text: string) => {
    if (!text) return '';
    
    // Process line by line for paragraphs and lists
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    lines.forEach(line => {
      // Headers
      if (line.startsWith('### ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h3 class="text-lg font-semibold mb-2 mt-4">${line.substring(4)}</h3>`;
      } else if (line.startsWith('## ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h2 class="text-xl font-bold mb-3 mt-5">${line.substring(3)}</h2>`;
      } else if (line.startsWith('# ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h1 class="text-2xl font-extrabold mb-4 mt-6">${line.substring(2)}</h1>`;
      }
      // Lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) { html += '<ul class="list-disc list-inside space-y-1 my-4">'; inList = true; }
        html += `<li>${line.substring(2)}</li>`;
      }
      // Paragraphs
      else if (line.trim() !== '') {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<p class="mb-3">${line}</p>`;
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        // Don't add <br /> for empty lines to avoid excessive spacing, CSS handles paragraph margin.
      }
    });

    if (inList) {
      html += '</ul>';
    }

    // Inline formatting
    html = html
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    return html;
  };

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
    />
  );
};

export default MarkdownRenderer;