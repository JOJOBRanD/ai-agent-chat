"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Sun,
  Moon,
  PanelLeftClose,
  LogOut,
  User,
  Shield,
  MessageSquare,
} from "lucide-react";
import { useChatStore, useAuthStore } from "@/lib/store";
import { logout } from "@/lib/api";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Agent 颜色映射
const AGENT_COLORS: Record<string, string> = {
  indigo: "from-indigo-500 to-purple-500",
  blue: "from-blue-500 to-cyan-500",
  green: "from-green-500 to-emerald-500",
  orange: "from-orange-500 to-amber-500",
  pink: "from-pink-500 to-rose-500",
  red: "from-red-500 to-pink-500",
  teal: "from-teal-500 to-cyan-500",
  violet: "from-violet-500 to-purple-500",
};

export default function Sidebar() {
  const {
    sidebarOpen,
    theme,
    currentAgentId,
    toggleSidebar,
    toggleTheme,
    setCurrentAgent,
    setSettingsOpen,
  } = useChatStore();
  const { user, logout: clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    clearAuth();
    router.replace("/login");
  };

  const agents = user?.agents || [];

  return (
    <AnimatePresence mode="wait">
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex-shrink-0 h-full border-r border-white/[0.15] dark:border-white/[0.06]
                     bg-white/30 dark:bg-white/[0.03] backdrop-blur-xl backdrop-saturate-150 overflow-hidden"
        >
          <div className="flex flex-col h-full w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2.5">
                <MessageSquare size={16} className="text-primary" />
                <span className="font-semibold text-sm tracking-tight">Conversations</span>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground
                           hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200"
                aria-label="Close sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            {/* Agent list */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {agents.map((agent) => {
                const isActive = agent.agentId === currentAgentId;
                const gradient = AGENT_COLORS[agent.color || "indigo"] || AGENT_COLORS.indigo;

                return (
                  <button
                    key={agent.agentId}
                    onClick={() => setCurrentAgent(agent.agentId)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left",
                      "transition-all duration-200 border",
                      isActive
                        ? "bg-white/70 dark:bg-white/[0.08] shadow-sm border-black/[0.04] dark:border-white/[0.06]"
                        : "border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    )}
                  >
                    {/* Agent avatar */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden",
                      "bg-gradient-to-br transition-all duration-200",
                      gradient,
                      isActive ? "shadow-md" : "shadow-sm opacity-80"
                    )}>
                      {agent.avatar && (agent.avatar.startsWith("/") || agent.avatar.startsWith("http")) ? (
                        <img src={agent.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">{agent.avatar || "🤖"}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate tracking-tight transition-colors duration-200",
                        isActive ? "text-foreground" : "text-foreground/70"
                      )}>
                        {agent.name}
                      </p>
                      {agent.description && (
                        <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">
                          {agent.description}
                        </p>
                      )}
                    </div>

                    {/* Active indicator — always rendered, visibility controlled by opacity */}
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 transition-opacity duration-200",
                      isActive ? "opacity-100 shadow-sm shadow-green-500/50" : "opacity-0"
                    )} />
                  </button>
                );
              })}

              {agents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-foreground/40">No agents assigned</p>
                </div>
              )}
            </div>

            {/* User info + Footer */}
            <div className="p-3 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1">
              {/* User info */}
              {user && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors">
                  {/* User avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden
                                  bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate tracking-tight">
                      {user.displayName}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 truncate">
                      @{user.username}
                    </p>
                  </div>
                  {user.role === "admin" && (
                    <div className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        Admin
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between px-1">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-medium
                             text-muted-foreground/60 hover:text-foreground
                             hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200"
                >
                  {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
                  <span>{theme === "dark" ? "Light" : "Dark"}</span>
                </button>
                <div className="flex items-center gap-0.5">
                  {user?.role === "admin" && (
                    <button
                      onClick={() => router.push("/admin")}
                      className="p-2 rounded-lg text-muted-foreground/60 hover:text-amber-500
                                 hover:bg-amber-500/10 transition-all duration-200"
                      aria-label="Admin Console"
                    >
                      <Shield size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground
                               hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200"
                    aria-label="Settings"
                  >
                    <Settings size={14} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-muted-foreground/60 hover:text-red-500
                               hover:bg-red-500/10 transition-all duration-200"
                    aria-label="Logout"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
