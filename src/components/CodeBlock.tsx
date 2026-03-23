"use client";

import { useState, useCallback } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  children: string;
}

export default function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  const displayLang = language || "text";

  return (
    <div className="code-block-wrapper group">
      <div className="code-block-header">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="opacity-50" />
          <span>{displayLang}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs
                     hover:bg-white/10 transition-colors duration-200
                     opacity-0 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} className="text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto">
        <code className={language ? `hljs language-${language}` : ""}>
          {children}
        </code>
      </pre>
    </div>
  );
}
