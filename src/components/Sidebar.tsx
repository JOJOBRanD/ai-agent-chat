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
  Shield,
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
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex-shrink-0 h-full border-r border-black/[0.06] dark:border-white/[0.06]
                     bg-white/40 dark:bg-white/[0.02] backdrop-blur-2xl overflow-hidden"
        >
          <div className="flex flex-col h-full w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
                                flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Zap size={14} className="text-white" />
                </div>
                <span className="font-semibold text-sm gradient-text tracking-tight">
                  {user?.agentName || "AI Agent"}
                </span>
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

            {/* Agent info card */}
            <div className="px-3 py-4">
              <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/[0.04]
                              border border-black/[0.04] dark:border-white/[0.06]
                              backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
                                  flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground tracking-tight">
                      {user?.agentName || "AI Agent"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                      <p className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                        Online
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">
                  Your personal AI assistant. Ask me anything about coding, analysis, or creative tasks.
                </p>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* User info + Footer */}
            <div className="p-3 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1">
              {/* User info */}
              {user && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors">
                  <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center">
                    <User size={14} className="text-primary" />
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
