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
  const currentAssistantIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(
    (text: string) => {
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: text,
        status: "done",
        timestamp: Date.now(),
      };
      addMessage(userMsg);

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

      setIsSending(true);

      const callbacks: SSECallbacks = {
        onAssistantStart: (data) => {
          replaceMessageId(tempAssistantId, data.messageId);
          currentAssistantIdRef.current = data.messageId;
        },

        onAssistantDelta: (data) => {
          const id = currentAssistantIdRef.current || tempAssistantId;
          appendMessageContent(id, data.delta);
        },

        onAssistantFinal: (data) => {
          const id = currentAssistantIdRef.current || tempAssistantId;
          updateMessageContent(id, data.content);
          setMessageStatus(id, "done");
          setIsSending(false);
          currentAssistantIdRef.current = null;
        },

        onError: (data) => {
          const id = currentAssistantIdRef.current || tempAssistantId;
          if (data.code === "AUTH_REQUIRED") {
            window.location.href = "/login";
            return;
          }
          setMessageStatus(id, "error", data.message);
          setIsSending(false);
          currentAssistantIdRef.current = null;
        },

        onDone: () => {
          setIsSending(false);
        },

        onConnectionError: (error) => {
          const id = currentAssistantIdRef.current || tempAssistantId;
          setMessageStatus(id, "interrupted", error.message || "Connection lost");
          setIsSending(false);
          currentAssistantIdRef.current = null;
        },
      };

      abortControllerRef.current = streamChat(text, callbacks);
    },
    [addMessage, appendMessageContent, updateMessageContent, setMessageStatus, replaceMessageId, setIsSending]
  );

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

  const handleRetry = useCallback(
    (text: string) => {
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
      {/* Glass top bar */}
      <div className="flex items-center gap-3 px-5 py-3
                      border-b border-black/[0.04] dark:border-white/[0.06]
                      bg-white/60 dark:bg-black/40 backdrop-blur-2xl">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground
                       hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen size={17} />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {user?.agentName || "AI Agent"}
          </span>
          <span className="text-[10px] text-muted-foreground/40 font-medium">
            Ready
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="pb-4 pt-2">
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
