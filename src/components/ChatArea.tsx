"use client";

import { useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { PanelLeftOpen } from "lucide-react";
import { useChatStore, useAuthStore } from "@/lib/store";
import { Message } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { streamChat, SSECallbacks } from "@/lib/sse";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import WelcomeScreen from "./WelcomeScreen";

export default function ChatArea() {
  const {
    messages,
    isSending,
    sidebarOpen,
    addMessage,
    appendMessageContent,
    updateMessageContent,
    setMessageStatus,
    replaceMessageId,
    setIsSending,
    toggleSidebar,
  } = useChatStore();

  const user = useAuthStore((s) => s.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // 跟踪当前流式 assistant 消息的临时 ID
  const currentAssistantIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(
    (text: string) => {
      // 1. 插入用户消息
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: text,
        status: "done",
        timestamp: Date.now(),
      };
      addMessage(userMsg);

      // 2. 插入 assistant 占位消息
      const tempAssistantId = generateId();
      const assistantMsg: Message = {
        id: tempAssistantId,
        role: "assistant",
        content: "",
        status: "streaming",
        timestamp: Date.now(),
      };
      addMessage(assistantMsg);
      currentAssistantIdRef.current = tempAssistantId;

      // 3. 进入发送中状态
      setIsSending(true);

      // 4. SSE 回调
      const callbacks: SSECallbacks = {
        onAssistantStart: (data) => {
          // 用后端返回的 messageId 替换临时 ID
          replaceMessageId(tempAssistantId, data.messageId);
          currentAssistantIdRef.current = data.messageId;
        },

        onAssistantDelta: (data) => {
          const id = currentAssistantIdRef.current || tempAssistantId;
          appendMessageContent(id, data.delta);
        },

        onAssistantFinal: (data) => {
          const id = currentAssistantIdRef.current || tempAssistantId;
          // 以 final 全文为准
          updateMessageContent(id, data.content);
          setMessageStatus(id, "done");
          setIsSending(false);
          currentAssistantIdRef.current = null;
        },

        onError: (data) => {
          const id = currentAssistantIdRef.current || tempAssistantId;
          // AUTH_REQUIRED 跳登录
          if (data.code === "AUTH_REQUIRED") {
            window.location.href = "/login";
            return;
          }
          setMessageStatus(id, "error", data.message);
          setIsSending(false);
          currentAssistantIdRef.current = null;
        },

        onDone: () => {
          // 流结束（如果 final 已处理，这里只是确认）
          setIsSending(false);
        },

        onConnectionError: (error) => {
          const id = currentAssistantIdRef.current || tempAssistantId;
          setMessageStatus(id, "interrupted", error.message || "Connection lost");
          setIsSending(false);
          currentAssistantIdRef.current = null;
        },
      };

      // 5. 发起流式请求
      abortControllerRef.current = streamChat(text, callbacks);
    },
    [addMessage, appendMessageContent, updateMessageContent, setMessageStatus, replaceMessageId, setIsSending]
  );

  // 中断流
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const id = currentAssistantIdRef.current;
    if (id) {
      setMessageStatus(id, "interrupted");
      currentAssistantIdRef.current = null;
    }
    setIsSending(false);
  }, [setMessageStatus, setIsSending]);

  // 重试
  const handleRetry = useCallback(
    (text: string) => {
      // 重新发送同样的文本（注意：这里用 user 上一条消息的 text）
      // 找到最后一条 user 消息
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      if (lastUserMsg) {
        handleSend(lastUserMsg.content);
      }
    },
    [messages, handleSend]
  );

  const handleSuggestionClick = useCallback(
    (text: string) => handleSend(text),
    [handleSend]
  );

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-lg">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground
                       hover:bg-muted transition-colors"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">
            {user?.agentName || "AI Agent"}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="pb-4">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  agentName={user?.agentName}
                  onRetry={
                    (msg.status === "error" || msg.status === "interrupted")
                      ? handleRetry
                      : undefined
                  }
                />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        disabled={isSending}
        onStop={handleStop}
      />
    </div>
  );
}
