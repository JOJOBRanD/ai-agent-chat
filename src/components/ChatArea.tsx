"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PanelLeftOpen } from "lucide-react";
import { useChatStore } from "@/lib/store";
import { Message } from "@/lib/types";
import { simulateStream, getRandomResponse } from "@/lib/utils";
import MessageBubble, { TypingIndicator } from "./MessageBubble";
import ChatInput from "./ChatInput";
import WelcomeScreen from "./WelcomeScreen";

const generateId = () =>
  Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

export default function ChatArea() {
  const {
    conversations,
    activeConversationId,
    sidebarOpen,
    createConversation,
    addMessage,
    updateMessage,
    setMessageStreaming,
    toggleSidebar,
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, scrollToBottom]);

  const handleSend = useCallback(
    async (content: string) => {
      abortRef.current = false;
      let convId = activeConversationId;

      // Create new conversation if needed
      if (!convId) {
        convId = createConversation();
      }

      // Add user message
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: Date.now(),
      };
      addMessage(convId, userMsg);

      // Add assistant placeholder
      const assistantId = generateId();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };
      addMessage(convId, assistantMsg);

      setIsLoading(true);

      // Simulate streaming response
      const response = getRandomResponse();
      let accumulated = "";

      // Small delay before starting to stream
      await new Promise((r) => setTimeout(r, 600));

      for await (const char of simulateStream(response)) {
        if (abortRef.current) break;
        accumulated += char;
        updateMessage(convId, assistantId, accumulated);
      }

      setMessageStreaming(convId, assistantId, false);
      setIsLoading(false);
    },
    [
      activeConversationId,
      createConversation,
      addMessage,
      updateMessage,
      setMessageStreaming,
    ]
  );

  const handleSuggestionClick = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend]
  );

  const handleStop = useCallback(() => {
    abortRef.current = true;
  }, []);

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
            {activeConversation?.title || "AI Agent"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground/50 px-2 py-1 rounded-md bg-muted/50">
            GPT-4 Turbo
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {!activeConversation || activeConversation.messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="pb-4">
            <AnimatePresence mode="popLayout">
              {activeConversation.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        onStop={handleStop}
      />
    </div>
  );
}
