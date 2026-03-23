"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import SettingsModal from "@/components/SettingsModal";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const { user, isLoading } = useAuth();
  const { currentAgentId, setCurrentAgent } = useChatStore();

  // 初始化：自动选中第一个 agent
  useEffect(() => {
    if (!user) return;
    if (!currentAgentId && user.agents && user.agents.length > 0) {
      setCurrentAgent(user.agents[0].agentId);
    }
  }, [user, currentAgentId, setCurrentAgent]);

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
      <SettingsModal />
    </main>
  );
}
