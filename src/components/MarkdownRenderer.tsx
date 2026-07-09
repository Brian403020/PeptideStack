import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content by lines
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  
  let inList = false;
  let listItems: string[] = [];

  const parseInlineStyles = (text: string): React.ReactNode[] => {
    // Basic bold parsing: **text**
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-bold text-gray-900 dark:text-gray-100">{part.slice(2, -2)}</strong>;
      }
      // Code snippet parsing: `text`
      const subParts = part.split(/(`.*?`)/);
      return subParts.map((subPart, subIndex) => {
        if (subPart.startsWith("`") && subPart.endsWith("`")) {
          return (
            <code key={`${index}-${subIndex}`} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-mono text-xs rounded-sm border border-slate-200/50 dark:border-slate-700/50">
              {subPart.slice(1, -1)}
            </code>
          );
        }
        return subPart;
      });
    });
  };

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseInlineStyles(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for list item
    if (line.startsWith("- ") || line.startsWith("* ")) {
      inList = true;
      listItems.push(line.substring(2));
      continue;
    } else {
      if (inList) {
        flushList(i);
      }
    }

    // Check for headings
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-md font-semibold text-gray-900 dark:text-gray-100 mt-5 mb-2 flex items-center">
          {parseInlineStyles(line.substring(4))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3 border-b border-gray-100 dark:border-slate-800 pb-1">
          {parseInlineStyles(line.substring(3))}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="text-xl font-extrabold text-gray-900 dark:text-gray-50 mt-8 mb-4">
          {parseInlineStyles(line.substring(2))}
        </h2>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="pl-4 border-l-4 border-emerald-500 bg-slate-50 dark:bg-slate-900/40 py-2.5 pr-2 my-4 text-gray-600 dark:text-gray-400 italic rounded-r-md">
          {parseInlineStyles(line.substring(2))}
        </blockquote>
      );
    } else if (line === "") {
      // Empty line, spacing handled by margins
      continue;
    } else {
      // Regular paragraph
      elements.push(
        <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-sm sm:text-base">
          {parseInlineStyles(line)}
        </p>
      );
    }
  }

  // Flush any remaining list items
  if (inList) {
    flushList(lines.length);
  }

  return <div className="space-y-1">{elements}</div>;
}
