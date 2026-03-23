"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, Mic, Square, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onStop?: () => void;
}

export default function ChatInput({ onSend, isLoading, onStop }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  }, [input]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="relative px-4 pb-4 pt-2 md:px-8 lg:px-16">
      <motion.div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border transition-all duration-300",
          "bg-card shadow-lg",
          isFocused
            ? "border-primary/50 glow-primary"
            : "border-border hover:border-muted-foreground/30"
        )}
      >
        {/* Attachment button */}
        <button
          className="flex-shrink-0 p-3 pb-3.5 text-muted-foreground hover:text-foreground
                     transition-colors"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Message AI Agent..."
          rows={1}
          className="flex-1 bg-transparent py-3.5 text-sm leading-relaxed
                     placeholder:text-muted-foreground/50 focus:outline-none
                     max-h-[200px]"
        />

        {/* Right side actions */}
        <div className="flex items-center gap-1 p-2">
          {isLoading ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStop}
              className="p-2 rounded-xl bg-red-500/10 text-red-500
                         hover:bg-red-500/20 transition-colors"
              aria-label="Stop generating"
            >
              <Square size={16} fill="currentColor" />
            </motion.button>
          ) : (
            <>
              <button
                className="p-2 text-muted-foreground hover:text-foreground
                           transition-colors rounded-lg"
                aria-label="Voice input"
              >
                <Mic size={18} />
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={!input.trim()}
                className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  input.trim()
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                aria-label="Send message"
              >
                <Send size={16} />
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* Bottom hint */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        <Sparkles size={11} className="text-muted-foreground/40" />
        <p className="text-[11px] text-muted-foreground/40">
          AI Agent may produce inaccurate information. Use with discretion.
        </p>
      </div>
    </div>
  );
}
