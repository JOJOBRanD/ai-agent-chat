"use client";

import { motion } from "framer-motion";
import {
  Bot, Copy, Check, RefreshCw, AlertCircle, WifiOff,
  FileText, Download, User,
} from "lucide-react";
import { Message, Attachment } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import MarkdownRenderer from "./MarkdownRenderer";
import { useState, useCallback } from "react";

interface MessageBubbleProps {
  message: Message;
  agentName?: string;
  agentAvatar?: string;
  userAvatar?: string;
  userDisplayName?: string;
  onRetry?: (text: string) => void;
}

// 文件大小格式化
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

// 附件预览组件
function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.mimeType.startsWith("image/");

  if (isImage) {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={attachment.previewUrl || attachment.url}
          alt={attachment.filename}
          className="max-w-[280px] max-h-[200px] rounded-xl object-cover
                     border border-white/10 hover:opacity-90 transition-opacity cursor-pointer"
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl
                 bg-white/10 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]
                 hover:bg-white/20 dark:hover:bg-white/[0.07] transition-all
                 max-w-[280px]"
    >
      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
        <FileText size={16} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{attachment.filename}</p>
        <p className="text-[10px] text-muted-foreground/50">{formatSize(attachment.size)}</p>
      </div>
      <Download size={14} className="text-muted-foreground/40 flex-shrink-0" />
    </a>
  );
}

export default function MessageBubble({
  message,
  agentName,
  agentAvatar,
  userAvatar,
  userDisplayName,
  onRetry,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isStreaming = message.status === "streaming";
  const isError = message.status === "error";
  const isInterrupted = message.status === "interrupted";
  const isDone = message.status === "done";

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "group flex gap-3 px-4 py-3 md:px-8 lg:px-16",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Assistant avatar (left side) */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
                          flex items-center justify-center shadow-lg shadow-indigo-500/25
                          ring-2 ring-white/10 overflow-hidden">
            {agentAvatar && !agentAvatar.startsWith("/") ? (
              <span className="text-sm">{agentAvatar}</span>
            ) : agentAvatar ? (
              <img src={agentAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <Bot size={15} className="text-white" />
            )}
          </div>
        </div>
      )}

      {/* Message bubble */}
      <div className={cn("max-w-[75%] min-w-0", isUser ? "items-end" : "items-start")}>
        {/* Name + time */}
        <div className={cn(
          "flex items-center gap-2 mb-1 px-1",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span className="text-[11px] font-medium text-muted-foreground/60">
            {isUser ? (userDisplayName || "You") : (agentName || "AI Agent")}
          </span>
          <span className="text-[10px] text-muted-foreground/40">
            {formatTime(message.timestamp)}
          </span>
          {isStreaming && (
            <span className="text-[10px] text-primary/80 animate-pulse">typing...</span>
          )}
        </div>

        {/* Attachments (above bubble for user, below for assistant) */}
        {isUser && message.attachments && message.attachments.length > 0 && (
          <div className={cn("flex flex-wrap gap-2 mb-2", isUser ? "justify-end" : "justify-start")}>
            {message.attachments.map((att) => (
              <AttachmentPreview key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 transition-all duration-300",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md shadow-lg shadow-primary/20"
              : "message-glass rounded-bl-md shadow-lg"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed text-[0.9375rem]">
              {message.content}
            </p>
          ) : (
            <>
              {message.content ? (
                <MarkdownRenderer content={message.content} isStreaming={isStreaming} />
              ) : isStreaming ? (
                <div className="flex items-center gap-1.5 py-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Assistant attachments */}
        {!isUser && message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map((att) => (
              <AttachmentPreview key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {/* Error / Interrupted */}
        {(isError || isInterrupted) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-center gap-2 mt-2 px-3 py-2 rounded-xl text-xs",
              "backdrop-blur-xl border",
              isError
                ? "bg-red-500/10 border-red-500/20 text-red-500"
                : "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400"
            )}
          >
            {isError ? <AlertCircle size={13} /> : <WifiOff size={13} />}
            <span>{isError ? (message.errorMessage || "Something went wrong") : "Connection interrupted"}</span>
            {onRetry && (
              <button
                onClick={() => onRetry(message.content)}
                className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg
                           bg-white/5 hover:bg-white/10 transition-colors font-medium"
              >
                <RefreshCw size={11} /> Retry
              </button>
            )}
          </motion.div>
        )}

        {/* Action buttons */}
        {!isUser && isDone && message.content && (
          <div className="flex items-center gap-1 mt-1.5 px-1 opacity-0 group-hover:opacity-100
                          transition-all duration-300">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground/50
                         hover:text-muted-foreground rounded-md hover:bg-muted/30 transition-all"
            >
              {copied ? (
                <><Check size={11} className="text-green-500" /> Copied</>
              ) : (
                <><Copy size={11} /> Copy</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* User avatar (right side) */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full overflow-hidden
                          bg-primary/10 flex items-center justify-center
                          ring-2 ring-primary/20">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={14} className="text-primary" />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
