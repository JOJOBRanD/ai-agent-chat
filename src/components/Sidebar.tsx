"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Sun,
  Moon,
  PanelLeftClose,
  Zap,
  LogOut,
  User,
} from "lucide-react";
import { useChatStore, useAuthStore } from "@/lib/store";
import { logout } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const { sidebarOpen, theme, toggleSidebar, toggleTheme } = useChatStore();
  const { user, logout: clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    clearAuth();
    router.replace("/login");
  };

  return (
    <AnimatePresence mode="wait">
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-shrink-0 h-full border-r border-border bg-sidebar overflow-hidden"
        >
          <div className="flex flex-col h-full w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600
                                flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Zap size={14} className="text-white" />
                </div>
                <span className="font-semibold text-sm gradient-text">
                  {user?.agentName || "AI Agent"}
                </span>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground
                           hover:bg-sidebar-hover transition-colors"
                aria-label="Close sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>

            {/* Agent info card */}
            <div className="px-3 py-4">
              <div className="p-4 rounded-xl bg-sidebar-hover/50 border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                                  flex items-center justify-center shadow-md">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {user?.agentName || "AI Agent"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Online
                    </p>
                  </div>
                  <div className="ml-auto w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your personal AI assistant. Ask me anything about coding, analysis, or creative tasks.
                </p>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* User info + Footer */}
            <div className="p-3 border-t border-border space-y-2">
              {/* User info */}
              {user && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {user.displayName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs
                             text-muted-foreground hover:text-foreground
                             hover:bg-sidebar-hover transition-colors"
                >
                  {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                  <span>{theme === "dark" ? "Light" : "Dark"}</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground
                               hover:bg-sidebar-hover transition-colors"
                    aria-label="Settings"
                  >
                    <Settings size={15} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-500
                               hover:bg-red-500/10 transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut size={15} />
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
