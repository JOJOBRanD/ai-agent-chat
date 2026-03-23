"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore } from "@/lib/store";
import { fetchChatHistory } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const { user, isLoading } = useAuth();
  const setMessages = useChatStore((s) => s.setMessages);

  // 加载聊天历史
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadHistory() {
      try {
        const history = await fetchChatHistory();
        if (!cancelled && history.length > 0) {
          setMessages(history);
        }
      } catch {
        // 加载历史失败不阻塞使用
      }
    }

    loadHistory();
    return () => { cancelled = true; };
  }, [user, setMessages]);

  // Loading state
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden">
      <Sidebar />
      <ChatArea />
    </main>
  );
}
