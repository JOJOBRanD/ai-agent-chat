"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, Square, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  onStop?: () => void;
}

export default function ChatInput({ onSend, disabled, onStop }: ChatInputProps) {
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
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, disabled, onSend]);

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
    <div className="relative px-4 pb-5 pt-2 md:px-8 lg:px-16">
      {/* Frosted glass input container */}
      <motion.div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border transition-all duration-300",
          "bg-white/60 dark:bg-white/[0.06] backdrop-blur-2xl",
          "shadow-[0_2px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.3)]",
          disabled && "opacity-80",
          isFocused
            ? "border-primary/40 shadow-[0_0_0_3px_rgba(0,113,227,0.08),0_2px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_3px_rgba(41,151,255,0.12),0_2px_20px_rgba(0,0,0,0.3)]"
            : "border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.12]"
        )}
      >
        {/* Attachment button */}
        <button
          disabled={disabled}
          className="flex-shrink-0 p-3 pb-3.5 text-muted-foreground/60 hover:text-foreground
                     transition-colors disabled:opacity-40"
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
          disabled={disabled}
          placeholder={disabled ? "Waiting for response..." : "Message AI Agent..."}
          rows={1}
          className="flex-1 bg-transparent py-3.5 text-[0.9375rem] leading-relaxed
                     placeholder:text-muted-foreground/40 focus:outline-none
                     max-h-[200px] disabled:cursor-not-allowed"
        />

        {/* Right side actions */}
        <div className="flex items-center gap-1 p-2">
          {disabled ? (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onStop}
              className="p-2.5 rounded-xl bg-red-500/10 text-red-500
                         hover:bg-red-500/20 transition-all duration-200"
              aria-label="Stop generating"
            >
              <Square size={14} fill="currentColor" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleSubmit}
              disabled={!input.trim()}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-300",
                input.trim()
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                  : "bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground/40 cursor-not-allowed"
              )}
              aria-label="Send message"
            >
              <Send size={15} />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Bottom hint */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        <Sparkles size={10} className="text-muted-foreground/30" />
        <p className="text-[10px] text-muted-foreground/30 tracking-wide">
          AI Agent may produce inaccurate information
        </p>
      </div>
    </div>
  );
}
