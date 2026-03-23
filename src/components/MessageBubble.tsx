"use client";

import { motion } from "framer-motion";
import { Bot, User, Copy, Check, RefreshCw } from "lucide-react";
import { Message } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import MarkdownRenderer from "./MarkdownRenderer";
import { useState, useCallback } from "react";

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
}

export default function MessageBubble({ message, onRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "group flex gap-4 px-4 py-5 md:px-8 lg:px-16",
        isUser
          ? "bg-transparent"
          : "bg-muted/30"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            "ring-1 ring-border/50",
            isUser
              ? "bg-primary/10 text-primary"
              : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
          )}
        >
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {isUser ? "You" : "AI Agent"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Message content */}
        <div className="text-foreground/90">
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <MarkdownRenderer
              content={message.content}
              isStreaming={message.isStreaming}
            />
          )}
        </div>

        {/* Action buttons for assistant messages */}
        {!isUser && !message.isStreaming && (
          <div className="flex items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground
                         hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              {copied ? (
                <><Check size={13} className="text-green-500" /> Copied</>
              ) : (
                <><Copy size={13} /> Copy</>
              )}
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground
                           hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <RefreshCw size={13} /> Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Typing indicator component
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex gap-4 px-4 py-5 md:px-8 lg:px-16 bg-muted/30"
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center
                        bg-gradient-to-br from-indigo-500 to-purple-600 text-white
                        shadow-lg shadow-indigo-500/20">
          <Bot size={16} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 py-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-muted-foreground/40"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
