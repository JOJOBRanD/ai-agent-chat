"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Sun,
  Moon,
  PanelLeftClose,
  Search,
  Zap,
} from "lucide-react";
import { useChatStore } from "@/lib/store";
import { cn, formatTime } from "@/lib/utils";
import { useState, useMemo } from "react";

export default function Sidebar() {
  const {
    conversations,
    activeConversationId,
    sidebarOpen,
    theme,
    createConversation,
    deleteConversation,
    setActiveConversation,
    toggleSidebar,
    toggleTheme,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

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
                <span className="font-semibold text-sm gradient-text">AI Agent</span>
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

            {/* New chat button */}
            <div className="px-3 py-2">
              <button
                onClick={createConversation}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl
                           border border-dashed border-border
                           text-sm text-muted-foreground
                           hover:text-foreground hover:border-primary/40 hover:bg-sidebar-hover
                           transition-all duration-200"
              >
                <Plus size={16} />
                <span>New Chat</span>
              </button>
            </div>

            {/* Search */}
            <div className="px-3 py-1">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-sidebar-hover/50
                             text-xs text-foreground placeholder:text-muted-foreground/40
                             border border-transparent focus:border-border
                             focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare
                    size={32}
                    className="text-muted-foreground/20 mb-3"
                  />
                  <p className="text-xs text-muted-foreground/40">
                    {searchQuery ? "No chats found" : "No conversations yet"}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    layout
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer",
                      "transition-all duration-150",
                      activeConversationId === conv.id
                        ? "bg-primary/10 text-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-hover"
                    )}
                    onClick={() => setActiveConversation(conv.id)}
                  >
                    <MessageSquare
                      size={15}
                      className={cn(
                        "flex-shrink-0",
                        activeConversationId === conv.id
                          ? "text-primary"
                          : "text-muted-foreground/50"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{conv.title}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        {conv.messages.length} messages · {formatTime(conv.updatedAt)}
                      </p>
                    </div>
                    {hoveredId === conv.id && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="flex-shrink-0 p-1 rounded-md text-muted-foreground
                                   hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border">
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs
                             text-muted-foreground hover:text-foreground
                             hover:bg-sidebar-hover transition-colors"
                >
                  {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </button>
                <button
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground
                             hover:bg-sidebar-hover transition-colors"
                  aria-label="Settings"
                >
                  <Settings size={15} />
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
